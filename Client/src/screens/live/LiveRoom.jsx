import React, { useContext, useEffect, useRef, useState, useCallback } from 'react'
import ReactPlayer from "react-player"
import { useNavigate } from 'react-router-dom'
import peer from '../../service/PeerService'
import { SocketContext } from '../../context/SocketProvider'

function LiveRoom() {
    const [called, setCalled] = useState(false)
    const [noOfOffers, setNoOfOffers] = useState(0)
    const [myStream, setMyStream] = useState()
    const [isConnected, setIsConnected] = useState(null)
    const [remoteStream, setRemoteStream] = useState()
    const [remoteSocketId, setRemoteSocketId] = useState(null)
    const socket = useContext(SocketContext)
    const navigate = useNavigate()

    const handleUserJoined = useCallback(({ socketId }) => {
        setRemoteSocketId(socketId)
        // console.log(`User with this socket ID, ${socketId} just joined !`)
        socket.emit("user-joined-confirm:server", { user2Id: socketId, socketId: socket.id })
    }, [setRemoteSocketId])

    const handleUserJoinedConfirm = useCallback((socketId) => {
        setRemoteSocketId(socketId)
        // console.log(`User with this socket ID, ${socketId} was waiting !`)
    }, [setRemoteSocketId])

    const handleCall = useCallback(async () => {
        setCalled(true)
        const offer = await peer.getOffer()
        // console.log("Remote Socket id -->", remoteSocketId)
        // socket.emit("call-user", { to: remoteSocketId, offer }) // Sending the offer immediately after creating it - !
        console.log("Offer --> ", offer);
    }, [socket, remoteSocketId, setCalled, myStream]);

    const handleIncomingCall = useCallback(async ({ from, offer }) => {
        console.log("Getting an incoming call....")
        console.log("Signaling state before setting answer:", peer.peer.signalingState);

        const answer = await peer.getAnswer(offer)
        // socket.emit("call-accepted", { to: from, answer }) // Sending the answer immediately after creating it - !
        console.log("Call Accepted with - Answer --> ", answer);

        setNoOfOffers(prev => ++prev)
    }, [socket])

    const handleCallAcceptedConfirm = useCallback(async ({ answer, from }) => {
        console.log("Signaling state before setting answer:", peer.peer.signalingState);

        if(!peer.peer.remoteDescription){
            await peer.setRemoteDescription(answer)
        }
        console.log("Confirm Answer --> ", answer);

        if (myStream && peer.peer.getSenders().length === 0) {
            for (const track of myStream.getTracks()) {
                peer.peer.addTrack(track, myStream)
                console.log("Sending streams....", track)
            }
        }
        setNoOfOffers(prev => ++prev)
    }, [myStream])

    const handleNegoNeeded = useCallback(async () => {
        // console.log("RemoteSocket id on habdleNegoAdded --> ", remoteSocketId);
        const offer = await peer.getOffer();
        socket.emit("peer-nego-needed", { offer, to: remoteSocketId }); // Nego --> Sending the offer immediately after creating it - !
    }, [remoteSocketId, socket]);

    const handleNegoNeedIncomming = useCallback(async ({ from, offer }) => {
        console.log("Incoming Nego --> ", offer);
        const ans = await peer.getAnswer(offer); // Nego --> Sending the answer immediately after creating it - !
        socket.emit("peer-nego-done", { to: from, ans });
        setNoOfOffers(prev => ++prev)
    }, [socket]);

    const handleNegoNeedFinal = useCallback(async ({ ans }) => {
        console.log("Nego Final --> ", ans);
        if(!peer.peer.remoteDescription){
            await peer.setRemoteDescription(answer)
        }
        setNoOfOffers(prev => ++prev)
    }, [myStream]);

    useEffect(() => {
        // console.log("USE EFFECT-->", remoteSocketId);
        if (remoteSocketId) {
            peer.peer.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log("New ICE candidate:", event.candidate.candidate);
                    console.log(peer.peer.localDescription);
                }
                else {
                    if(called){
                        socket.emit("call-user", { to: remoteSocketId, offer: peer.peer.localDescription })
                    }
                    else {
                        socket.emit("call-accepted", { to: remoteSocketId, answer: peer.peer.localDescription })
                    }
                    console.log("All ICE candidates have been sent.", event.candidate);
                }
            };

            peer.peer.oniceconnectionstatechange = () => {
                console.log('ICE State:', peer.peer.iceConnectionState);
            };

            peer.peer.addEventListener("negotiationneeded", () => {
                console.log("NEGOTIATION NEEDED");
                handleNegoNeeded()
            })

            peer.peer.addEventListener("track", (ev) => {
                setRemoteStream(ev.streams[0])
            })
        }
    }, [remoteSocketId, setRemoteStream, called, myStream])

    useEffect(() => {
        console.log("noOfOffers --> ", noOfOffers);
        if (myStream && peer.peer.getSenders().length === 0) {
            for (const track of myStream.getTracks()) {
                peer.peer.addTrack(track, myStream)
                console.log("Sending streams....", track)
            }
        }
        if (noOfOffers == 2 && called) {
            handleNegoNeeded()
            setIsConnected(true)
        }
        else if (noOfOffers == 3 && !called) {
            // for (const track of myStream.getTracks()) {
            //     peer.peer.addTrack(track, myStream)
            //     console.log("Sending streams....", track)
            // }
            setIsConnected(true)
        }
    }, [noOfOffers, myStream])

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                setMyStream(stream)
            })
        // console.log("Now-->", socket.id);
    }, [setMyStream])

    useEffect(() => {
        socket.on("user-joined", handleUserJoined)
        socket.on("user-joined-confirm:client", handleUserJoinedConfirm)
        socket.on("incoming-call", handleIncomingCall)
        socket.on("call-accepted-confirm", handleCallAcceptedConfirm)
        socket.on("peer-nego-incoming", handleNegoNeedIncomming);
        socket.on("peer-nego-final", handleNegoNeedFinal);

        return () => {
            socket.off("user-joined", handleUserJoined)
            socket.off("user-joined-confirm:client", handleUserJoinedConfirm)
            socket.off("incoming-call", handleIncomingCall)
            socket.off("call-accepted-confirm", handleCallAcceptedConfirm)
            socket.off("peer-nego-incoming", handleNegoNeedIncomming);
            socket.off("peer-nego-final", handleNegoNeedFinal);
        }
    }, [socket, handleUserJoined, handleUserJoinedConfirm, handleIncomingCall, handleCallAcceptedConfirm])


    return (
        <>
            <div style={styles.container}>
                {myStream && <ReactPlayer url={myStream} muted playing />}
                {remoteStream && <ReactPlayer url={remoteStream} playing style={{ marginTop: 20 }} />}
            </div>

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", marginTop: 10 }}>
                <div style={{ display: isConnected != null ? "none" : "block" }}>
                    {remoteSocketId ? <h2>User Joined ! Waiting for someone to call...</h2> : <h2>Waiting for the other user to join.... </h2>}
                </div>
                {isConnected == true ? <h1 style={{ color: "green" }}>Connected !</h1> : isConnected == false ? <h1>Connecting....</h1> : remoteSocketId && <button onClick={handleCall} style={styles.callBtn}>Call</button>}
                {remoteSocketId && <button onClick={() => navigate("/")} style={styles.stopBtn}>Stop</button>}
            </div>
        </>
    )
}

const styles = {
    callBtn: {
        padding: '10px 0',
        width: "90%",
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '18px',
        marginTop: '20px'
    },
    stopBtn: {
        padding: '10px 0',
        width: "90%",
        backgroundColor: 'red',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '18px',
        marginTop: '20px'
    },
    sendStreamBtn: {
        padding: '10px 120px',
        backgroundColor: 'blue',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        marginTop: '20px'
    },
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column"
    }
}

export default LiveRoom