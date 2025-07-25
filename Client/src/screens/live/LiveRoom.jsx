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
        setIsConnected(false)
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

        if (!peer.peer.remoteDescription) {
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
        if (!peer.peer.remoteDescription) {
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
                    if (called) {
                        socket.emit("call-user", { to: remoteSocketId, offer: peer.peer.localDescription })
                    }
                    else {
                        socket.emit("call-accepted", { to: remoteSocketId, answer: peer.peer.localDescription })
                    }
                    console.log("All ICE candidates have been sent.", event.candidate);
                }
            };

            peer.peer.onconnectionstatechange = () => {
                if (peer.peer.connectionState === 'connected') {
                    setIsConnected(true);
                }
                else {
                    setIsConnected(false);
                }
            };

            peer.peer.oniceconnectionstatechange = () => {
                if (peer.peer.iceConnectionState === 'connected') {
                    setIsConnected(true);
                }
                else {
                    setIsConnected(false);
                }
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
        // if (noOfOffers == 2 && called) {
        //     handleNegoNeeded()
        //     setIsConnected(true)
        // }
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
        <div className="min-h-screen bg-gray-950 text-white font-sans">
            {/* Header */}
            <header className="px-6 py-4 border-b border-gray-700 bg-black/30 backdrop-blur-lg sticky top-0 z-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-2xl drop-shadow-lg">🔴</div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-red-400 to-teal-400 bg-clip-text text-transparent">
                            Live Video Call
                        </h1>
                    </div>

                    {/* Connection Status */}
                    <div className="flex items-center gap-2">
                        {isConnected === true ? (
                            <>
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-green-400 text-sm font-medium">Connected</span>
                            </>
                        ) : isConnected === false ? (
                            <>
                                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                <span className="text-yellow-400 text-sm font-medium">Connecting...</span>
                            </>
                        ) : (
                            <>
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <span className="text-gray-400 text-sm font-medium">Waiting</span>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Video Container */}
            <div className="flex-1 p-4 md:p-6">
                <div className="h-[calc(100vh-120px)] flex flex-col md:flex-row gap-4 md:gap-6">
                    {/* My Video */}
                    <div className="flex-1 bg-gray-900/50 border border-gray-700 rounded-2xl overflow-hidden backdrop-blur-lg">
                        <div className="h-full relative">
                            {myStream ? (
                                <ReactPlayer
                                    url={myStream}
                                    muted
                                    playing
                                    width="100%"
                                    height="100%"
                                    style={{ objectFit: 'cover' }}
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-6xl md:text-8xl mb-4 opacity-30">📹</div>
                                        <p className="text-gray-400">Loading camera...</p>
                                    </div>
                                </div>
                            )}

                            {/* Video Label */}
                            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg">
                                <span className="text-white text-sm font-medium">You</span>
                            </div>
                        </div>
                    </div>

                    {/* Remote Video */}
                    <div className="flex-1 bg-gray-900/50 border border-gray-700 rounded-2xl overflow-hidden backdrop-blur-lg">
                        <div className="h-full relative">
                            {remoteStream ? (
                                <ReactPlayer
                                    url={remoteStream}
                                    playing
                                    width="100%"
                                    height="100%"
                                    style={{ objectFit: 'cover' }}
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-6xl md:text-8xl mb-4 opacity-30">👤</div>
                                        <p className="text-gray-400">
                                            {remoteSocketId ? "Waiting for video..." : "Waiting for participant..."}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Video Label */}
                            {remoteStream && (
                                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg">
                                    <span className="text-white text-sm font-medium">Participant</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Control Panel */}
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent backdrop-blur-lg border-t border-gray-700">
                <div className="p-4 md:p-6">
                    {/* Status Message */}
                    {isConnected === null && (
                        <div className="text-center mb-4">
                            <p className="text-gray-300 text-sm md:text-base">
                                {remoteSocketId
                                    ? "✅ Participant joined! Ready to start call..."
                                    : "⏳ Waiting for participant to join..."
                                }
                            </p>
                        </div>
                    )}

                    {/* Control Buttons */}
                    <div className="flex items-center justify-center gap-3 md:gap-4">
                        {/* Call Button */}
                        {isConnected === null && remoteSocketId && (
                            <button
                                onClick={handleCall}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/40 transition-all duration-300 hover:scale-105"
                            >
                                <span className="text-lg">📞</span>
                                <span className="hidden md:inline">Start Call</span>
                            </button>
                        )}

                        {/* End Call Button */}
                        {remoteSocketId && (
                            <button
                                onClick={() => navigate("/live")}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-500/40 transition-all duration-300 hover:scale-105"
                            >
                                <span className="text-lg">📞</span>
                                <span className="hidden md:inline">End Call</span>
                            </button>
                        )}

                        {/* Back Button */}
                        {!remoteSocketId && (
                            <button
                                onClick={() => navigate("/live")}
                                className="flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-gray-300 font-semibold rounded-xl transition-all duration-300 hover:bg-white/20"
                            >
                                <span className="text-lg">←</span>
                                <span className="hidden md:inline">Back to Home</span>
                            </button>
                        )}
                    </div>

                    {/* Connection Status Text */}
                    {isConnected === true && (
                        <div className="text-center mt-3">
                            <p className="text-green-400 text-sm font-medium">
                                🎉 Call connected successfully!
                            </p>
                        </div>
                    )}

                    {isConnected === false && (
                        <div className="text-center mt-3">
                            <p className="text-yellow-400 text-sm font-medium">
                                🔄 Establishing connection, this may take a while...
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default LiveRoom