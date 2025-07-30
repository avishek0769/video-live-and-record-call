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
let rooms = {};
let peers = {};
let transports = [];
let producers = [];
let consumers = [];

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
        rtcMaxPort: 2120
    })
    console.log(`Worker pid: ${worker.pid}`)

    worker.on("died", (err) => {
        console.error(err)
        process.exit(1)
    })
    // await worker.createRouter({ mediaCodecs })
}

createWorker()

const createWebRTCTransport = async (router) => {
    return new Promise(async (resolve, reject) => {
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

            resolve(transport)
        }
        catch (error) {
            console.log(error)
            reject(error)
        }
    })
}

const createRoom = async (roomId, socketId) => {
    let router;
    let peers = [];
    if (rooms[roomId]) {
        router = rooms[roomId].router
        peers = rooms[roomId].peers || []
    }
    else {
        router = await worker.createRouter({ mediaCodecs })
    }
    rooms[roomId] = {
        router,
        peers: [...peers, socketId]
    }
    return router
}

const addTransport = (transport, roomId, socketId, consumer) => {
    transports = [
        ...transports,
        { socketId, transport, roomId, consumer }
    ]
    peers[socketId] = {
        ...peers[socketId],
        transports: [...peers[socketId].transports, transport.id]
    }
}

const addProducer = (producer, roomId, socketId) => {
    producers = [
        ...producers,
        { socketId, roomId, producer }
    ]
    peers[socketId] = {
        ...peers[socketId],
        producers: [...peers[socketId].producers, producer.id]
    }
}

const addConsumer = (consumer, roomId, socketId) => {
    consumers = [
        ...consumers,
        { socketId, roomId, consumer }
    ]
    peers[socketId] = {
        ...peers[socketId],
        consumers: [...peers[socketId].consumers, consumer.id]
    }
}
let i = 0
const informProducersToConsume = (socketId, roomId, producerId) => {
    // console.log("Producers --> ", producers)
    producers.forEach(producerData => {
        if (producerData.socketId != socketId && producerData.roomId == roomId) {
            // console.log("Inform Consumers")
            peers[producerData.socketId].socket.emit("new-producer", { producerId, i: ++i })
        }
    })
}

const getProducerTransport = (socketId) => {
    const [producerTransport] = transports.filter(transportData => transportData.socketId == socketId && !transportData.consumer)
    return producerTransport.transport;
}

io.on("connection", async (socket) => {
    // RECORD CALLING

    socket.on("join-user-record", (({ roomId }) => {
        io.to(roomId).emit("user-joined-record", { socketId: socket.id })
        socket.join(roomId)
    }))

    socket.on("user-joined-confirm-record:server", ({ user2Id, socketId }) => {
        // console.log("Connected sockets:", Array.from(io.sockets.sockets.keys()));
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

    socket.on("joinRoom", async ({ roomId }, cb) => {
        let newRouter = await createRoom(roomId, socket.id)
        peers[socket.id] = {
            socket,
            roomId,
            transports: [],
            producers: [],
            consumers: [],
            peerDetails: {
                name: "",
                isAdmin: false
            }
        }

        // console.log("RtpCapabilities --> ", newRouter.rtpCapabilities)

        cb({ rtpCapabilities: newRouter.rtpCapabilities })
    })

    socket.on("createWebRTCTransport", async ({ consumer }, cb) => {
        const roomId = peers[socket.id].roomId;
        const router = rooms[roomId].router;

        createWebRTCTransport(router).then(transport => {
            cb({
                params: {
                    id: transport.id,
                    iceParameters: transport.iceParameters,
                    iceCandidates: transport.iceCandidates,
                    dtlsParameters: transport.dtlsParameters
                }
            })
            addTransport(transport, roomId, socket.id, consumer)
        })

    })

    socket.on("producerTransport-connect", async ({ dtlsParameters }) => {
        // console.log("DTLS Params --> ", dtlsParameters)
        await getProducerTransport(socket.id).connect({ dtlsParameters })
    })

    socket.on("producerTransport-produce", async ({ kind, rtpParameters }, cb) => {
        const producer = await getProducerTransport(socket.id).produce({ kind, rtpParameters })
        console.log("My Producer ID: ", producer.id)

        const { roomId } = peers[socket.id]
        addProducer(producer, roomId, socket.id)

        informProducersToConsume(socket.id, roomId, producer.id)

        producer.on("transportclose", () => {
            console.log('transport for this producer closed ')
            producer.close()
        })

        cb({
            id: producer.id,
            producerExists: producers.length > 1
        })
    })

    socket.on("consumerTransport-connect", async ({ dtlsParameters, serverConsumerTransportId }) => {
        // console.log("DTLS Params --> ", dtlsParameters)
        const consumerTransport = transports.find(transportData =>
            transportData.consumer && transportData.transport.id == serverConsumerTransportId
        ).transport;

        await consumerTransport.connect({ dtlsParameters })
    })

    socket.on("consumerTransport-consume", async ({ rtpCapabilities, serverConsumerTransportId, remoteProducerId }, cb) => {
        const { roomId } = peers[socket.id]
        const { router } = rooms[roomId]
        const consumerTransport = transports.find(transportData =>
            transportData.transport.id == serverConsumerTransportId && transportData.consumer
        ).transport

        let canConsume = router.canConsume({ producerId: remoteProducerId, rtpCapabilities });

        try {
            if (canConsume) {
                const consumer = await consumerTransport.consume({
                    producerId: remoteProducerId,
                    rtpCapabilities,
                    paused: true,
                })
                // console.log("Consumer --> ", consumer)

                consumer.on("transportclose", () => {
                    console.log("Transport Closed")
                })
                consumer.on("producerclose", () => {
                    console.log("Producer Closed")
                    socket.emit("producer-closed", { remoteProducerId })
                    consumerTransport.close([])
                    consumer.close()
                    transports = transports.filter(transportData => transportData.transport.id != consumerTransport.id)
                    consumers = consumers.filter(consumerData => consumerData.consumer.id != consumer.id)
                })

                addConsumer(consumer, roomId, socket.id)

                const params = {
                    id: consumer.id,
                    producerId: remoteProducerId,
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

    socket.on("getProducers", (cb) => {
        const { roomId } = peers[socket.id]
        let producerList = []

        producers.forEach(producerData => {
            if (producerData.socketId !== socket.id && producerData.roomId === roomId) {
                producerList = [...producerList, producerData.producer.id]
            }
        })
        console.log(producerList)
        cb(producerList)
    })

    socket.on("consumer-resume", async ({ consumerId }) => {
        const consumer = consumers.find(consumerData => consumerData.consumer.id === consumerId).consumer
        await consumer.resume()
    })
})

server.listen(3000, () => console.log("Server running on PORT ", process.env.PORT))