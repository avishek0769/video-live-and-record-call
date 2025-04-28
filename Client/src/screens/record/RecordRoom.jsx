import React, { useContext, useEffect, useRef, useState, useCallback } from 'react'
import { SocketContext } from '../../context/SocketProvider';
import { useParams } from 'react-router-dom';


function RecordRoom() {
    const mediaRecorderRef = useRef(null);
    const [myStream, setMySetstream] = useState()
    const [state, setState] = useState()
    const [remoteSocketId, setRemoteSocketId] = useState(null)
    const videoRef = useRef(null)
    const nextUserRef = useRef(null)
    const socket = useContext(SocketContext)
    const { roomId } = useParams()

    const handleUserJoined = useCallback(({ socketId }) => {
        setRemoteSocketId(socketId)
        console.log(`User with this socket ID, ${socketId} just joined !`)
        socket.emit("user-joined-confirm-record:server", { user2Id: socketId, socketId: socket.id })
    })

    const handleUserJoinedConfirm = useCallback((socketId) => {
        setRemoteSocketId(socketId)
        console.log(`User with this socket ID, ${socketId} was waiting !`)
    }, [])

    const handleCall = useCallback(() => {
        setState("Recording...")
        mediaRecorderRef.current = new MediaRecorder(myStream, {
            mimeType: 'video/webm; codecs="vp8,opus"',
            audioBitsPerSecond: 128000,
            videoBitsPerSecond: 2500000,
        });

        mediaRecorderRef.current.ondataavailable = (ev) => {
            socket.emit("streamData1-record:server", {
                streamData: ev.data,
                sendTo: remoteSocketId,
            });
        };

        // Detect when recording stops
        mediaRecorderRef.current.onstop = () => {
            socket.emit("streamData1-record:server", {
                streamData: new Blob([], { type: "video/webm" }), // Empty final chunk
                sendTo: remoteSocketId,
                isLastChunk: true,
            });
        };

        mediaRecorderRef.current.start(500);
    }, [socket, myStream, remoteSocketId]);

    const receivedChunks = useRef([]);
    const handleReceivingStream = useCallback((chunk) => {
        console.log(chunk);
        receivedChunks.current.push(chunk.streamData);

        if (chunk.isLastChunk) {
            const combinedBlob = new Blob(receivedChunks.current, {
                type: "video/webm"
            });
            const videoUrl = URL.createObjectURL(combinedBlob);

            if (nextUserRef.current) {
                nextUserRef.current.src = videoUrl;
                nextUserRef.current.play().catch(console.error);
            }
            receivedChunks.current = [];
        }
    }, []);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                if (videoRef.current) {
                    setMySetstream(stream)
                    videoRef.current.srcObject = stream;
                }
            })
        console.log("Now-->", socket.id);
    }, [])

    useEffect(() => {
        socket.on("user-joined-record", handleUserJoined)
        socket.on("user-joined-confirm-record:client", handleUserJoinedConfirm)
        socket.on("streamData1-record:client", handleReceivingStream)

        return () => {
            socket.off("user-joined-record", handleUserJoined)
            socket.off("user-joined-confirm-record:client", handleUserJoinedConfirm)
            socket.off("streamData1-record:client", handleReceivingStream)
        }
    }, [socket, handleUserJoined, handleUserJoinedConfirm, handleReceivingStream])


    return (
        <>
            <div style={styles.container}>
                <video ref={videoRef} height={350} muted autoPlay style={styles.myVideo} playsInline > </video>
                <video ref={nextUserRef} width={400} height={350} autoPlay playsInline> </video>
            </div>

            {remoteSocketId ? <h1>Connected !</h1> : <h1>Waiting for the other user.... </h1>}
            <div style={{ display: "flex", justifyContent: "center", gap: 20, width: "100%" }}>
                {remoteSocketId && <button onClick={handleCall} style={styles.callBtn}>Call</button>}
                {remoteSocketId && <button onClick={() => {
                    mediaRecorderRef.current.stop()
                    setState("Sent !")
                }} style={styles.stopBtn}>Stop</button>}
            </div>
            <h2>{state}</h2>
        </>
    )
}

const styles = {
    callBtn: {
        padding: '10px 20%',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        margin: '20px 0px'
    },
    stopBtn: {
        padding: '10px 20%',
        backgroundColor: 'red',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        margin: '20px 0px'
    },
}

export default RecordRoom