dotenv.config({
    path: "./.env"
})
import { Server } from "socket.io"
import { CLIENT_ADDRESS } from "../constants.js"
import https from "https"
import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import mediasoup from "mediasoup"
import fs from "fs"

const options = {
    key: fs.readFileSync('../ssl/key.pem', 'utf-8'),
    cert: fs.readFileSync('../ssl/cert.pem', 'utf-8')
}

const app = express()
const server = https.createServer(options, app)

app.use(cors({
    origin: CLIENT_ADDRESS
}))

const io = new Server(server, {
    cors: {
        origin: CLIENT_ADDRESS
    }
})

let worker;
let router;
let producerTransport;
let consumerTransport;
let producer;
let consumer;
const mediaCodecs = [
    {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
    },
    {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
            'x-google-start-bitrate': 1000,
        },
    },
]

const createWorker = async () => {
    worker = await mediasoup.createWorker({
        rtcMinPort: 2000,
        rtcMaxPort: 2020
    })
    console.log(`Worker pid: ${worker.pid}`)

    worker.on("died", (err) => {
        console.error(err)
        process.exit(1)
    })
    // await worker.createRouter({ mediaCodecs })
}

createWorker()

const createWebRTCTransport = async (cb) => {
    try {
        let transport = await router.createWebRtcTransport({
            listenIps: [
                { ip: '192.168.1.38' }
            ],
            enableUdp: true,
            enableTcp: true,
            preferUdp: true
        })

        transport.on("dtlsstatechange", dtlsstate => {
            if (dtlsstate == "closed") {
                transport.close()
            }
        })

        transport.on("close", () => {
            console.log("Transport Closed")
        })

        cb({
            params: {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters
            }
        })
        return transport;
    }
    catch (error) {
        console.log(error)
        cb({ params: { error } })
    }
}


io.on("connection", async (socket) => {
    // RECORD CALLING

    socket.on("join-user-record", (({ roomId }) => {
        io.to(roomId).emit("user-joined-record", { socketId: socket.id })
        socket.join(roomId)
    }))

    socket.on("user-joined-confirm-record:server", ({ user2Id, socketId }) => {
        console.log("Connected sockets:", Array.from(io.sockets.sockets.keys()));
        setTimeout(() => {
            io.to(user2Id).emit("user-joined-confirm-record:client", socketId)
        }, 1000);
    })

    socket.on("streamData1-record:server", ({ streamData, sendTo, isLastChunk }) => {
        io.to(sendTo).emit("streamData1-record:client", { streamData, isLastChunk })
    })

    socket.on("end-call-record", ({ to }) => {
        io.to(to).emit("user-left-record", { from: socket.id })
    })

    // VIDEO CALLING

    socket.on("join-user", (({ roomId }) => {
        io.to(roomId).emit("user-joined", { socketId: socket.id })
        socket.join(roomId)
    }))

    socket.on("user-joined-confirm:server", ({ user2Id, socketId }) => {
        setTimeout(() => {
            io.to(user2Id).emit("user-joined-confirm:client", socketId)
        }, 1000);
    })

    router = await worker.createRouter({ mediaCodecs })

    socket.on("getRtpCapabilities", (cb) => {
        console.log("RtpCapabilities --> ", router.rtpCapabilities)
        cb({ rtpCapabilities: router.rtpCapabilities })
    })

    socket.on("createWebRTCTransport", async ({ producer }, cb) => {
        if (producer) producerTransport = await createWebRTCTransport(cb);
        else consumerTransport = await createWebRTCTransport(cb);
    })

    socket.on("producerTransport-connect", async ({ dtlsParameters }) => {
        console.log("DTLS Params --> ", dtlsParameters)
        console.log("Producer --> connect()")
        await producerTransport.connect({ dtlsParameters })
    })

    socket.on("producerTransport-produce", async ({ kind, rtpParameters }, cb) => {
        producer = await producerTransport.produce({ kind, rtpParameters })
        console.log("Producer ID: ", producer.id)

        producer.on("transportclose", () => {
            console.log('transport for this producer closed ')
            producer.close()
        })

        cb({ id: producer.id })
    })

    socket.on("consumerTransport-connect", async ({ dtlsParameters }) => {
        console.log("DTLS Params --> ", dtlsParameters)
        console.log("Consumer --> connect()")
        await consumerTransport.connect({ dtlsParameters })
    })

    socket.on("consumerTransport-consume", async ({ rtpCapabilities }, cb) => {
        let canConsume = router.canConsume({ producerId: producer.id, rtpCapabilities });

        try {
            if (canConsume) {
                consumer = await consumerTransport.consume({
                    producerId: producer.id,
                    rtpCapabilities,
                    paused: true,
                })
                console.log("Consumer --> ", consumer)

                consumer.on("transportclose", () => {
                    console.log("Transport Closed")
                })
                consumer.on("producerclose", () => {
                    console.log("Producer Closed")
                })
                const params = {
                    id: consumer.id,
                    producerId: producer.id,
                    kind: consumer.kind,
                    rtpParameters: consumer.rtpParameters,
                }
                cb({ params })
            }
        }
        catch (error) {
            console.log(error.message)
            callback({
                params: {
                    error: error
                }
            })
        }
    })

    socket.on("consumer-resume", async () => {
        await consumer.resume()
    })
})

server.listen(3000, () => console.log("Server running on PORT ", process.env.PORT))