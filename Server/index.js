dotenv.config({
    path: "./.env"
})
import { Server } from "socket.io"
import { CLIENT_ADDRESS } from "../constants.js"
import http from "http"
import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import mediasoup from "mediasoup"

const app = express()
const server = http.createServer(app)

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
})

server.listen(3000, () => console.log("Server running on PORT ", process.env.PORT))