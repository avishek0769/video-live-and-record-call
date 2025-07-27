import React, { useContext, useEffect, useRef, useState, useCallback } from 'react'
import { SocketContext } from '../../context/SocketProvider';
import { useParams, useNavigate } from 'react-router-dom';

function RecordRoom() {
    const mediaRecorderRef = useRef(null);
    const [myStream, setMySetstream] = useState()
    const [state, setState] = useState(null)
    const [remoteSocketId, setRemoteSocketId] = useState(null)
    const [recordingDuration, setRecordingDuration] = useState(0)
    const [cooldownTime, setCooldownTime] = useState(0)
    const [showUserLeftPopup, setShowUserLeftPopup] = useState(false)
    const videoRef = useRef(null)
    const nextUserRef = useRef(null)
    const recordingTimerRef = useRef(null)
    const cooldownTimerRef = useRef(null)
    const socket = useContext(SocketContext)
    const { roomId } = useParams()
    const navigate = useNavigate()

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
        setState("recording")
        setRecordingDuration(0)
        
        // Start recording timer
        recordingTimerRef.current = setInterval(() => {
            setRecordingDuration(prev => prev + 1)
        }, 1000)

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

    const handleStopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop()
            
            // Clear recording timer
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current)
                recordingTimerRef.current = null
            }

            setState("sent")
            
            // Start cooldown timer with the recorded duration
            setCooldownTime(recordingDuration + 1)
            cooldownTimerRef.current = setInterval(() => {
                setCooldownTime(prev => {
                    if (prev <= 0) {
                        clearInterval(cooldownTimerRef.current)
                        cooldownTimerRef.current = null
                        setState(null)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        }
    }, [recordingDuration]);

    const handleEndCall = useCallback(() => {
        socket.emit("end-call-record", { to: remoteSocketId });
        // Clear all timers
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current)
            recordingTimerRef.current = null
        }
        if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current)
            cooldownTimerRef.current = null
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop()
        }
        if (myStream) {
            myStream.getTracks().forEach(track => track.stop())
        }
        setMySetstream(null)
        setRemoteSocketId(null)
        setState(null)
        setRecordingDuration(0)
        setCooldownTime(0)
        navigate("/record")
    }, [myStream, navigate, remoteSocketId]);

    const handleUserLeft = useCallback(() => {
        console.log("User left the recording session")
        setRemoteSocketId(null)
        setState(null)
        setRecordingDuration(0)
        setCooldownTime(0)
        setShowUserLeftPopup(true)
        nextUserRef.current.src = "";

        // Clear all timers
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current)
            recordingTimerRef.current = null
        }
        if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current)
            cooldownTimerRef.current = null
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop()
        }

        // Auto-hide popup after 3 seconds
        setTimeout(() => {
            setShowUserLeftPopup(false)
        }, 3000)
    }, [])

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current)
            }
            if (cooldownTimerRef.current) {
                clearInterval(cooldownTimerRef.current)
            }
        }
    }, [])

    // Format time helper
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

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
        socket.on("user-left-record", handleUserLeft);

        return () => {
            socket.off("user-joined-record", handleUserJoined)
            socket.off("user-joined-confirm-record:client", handleUserJoinedConfirm)
            socket.off("streamData1-record:client", handleReceivingStream)
            socket.off("user-left-record", handleUserLeft);
        }
    }, [socket, handleUserJoined, handleUserJoinedConfirm, handleReceivingStream, handleUserLeft])

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans">
            {/* User Left Popup */}
            {showUserLeftPopup && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-red-500/30 rounded-2xl p-6 md:p-8 mx-4 max-w-md w-full text-center shadow-2xl shadow-red-500/20">
                        <div className="text-4xl md:text-5xl mb-4">👋</div>
                        <h3 className="text-xl md:text-2xl font-bold text-red-400 mb-2">
                            User Left
                        </h3>
                        <p className="text-gray-300 text-sm md:text-base mb-4">
                            The other participant has left the recording session
                        </p>
                        <button
                            onClick={() => setShowUserLeftPopup(false)}
                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-200"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="px-6 py-4 border-b border-gray-700 bg-black/30 backdrop-blur-lg sticky top-0 z-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-2xl drop-shadow-lg">🎥</div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-red-400 to-teal-400 bg-clip-text text-transparent">
                            Recording Session
                        </h1>
                    </div>

                    {/* Connection Status */}
                    <div className="flex items-center gap-2">
                        {state === "recording" ? (
                            <>
                                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                                <span className="text-red-400 text-sm font-medium">Recording</span>
                            </>
                        ) : state === "sent" ? (
                            <>
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span className="text-green-400 text-sm font-medium">Sent</span>
                            </>
                        ) : remoteSocketId ? (
                            <>
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-green-400 text-sm font-medium">Connected</span>
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
                <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-4 md:gap-6">
                    {/* My Video */}
                    <div className="flex-1 bg-gray-900/50 border border-gray-700 rounded-2xl overflow-hidden backdrop-blur-lg">
                        <div className="h-full w-full relative flex items-center justify-center">
                            <video 
                                ref={videoRef} 
                                muted 
                                autoPlay 
                                playsInline
                                className="w-full h-full object-contain"
                                style={{
                                    aspectRatio: 'auto',
                                    objectFit: 'contain',
                                    objectPosition: 'center'
                                }}
                            />
                            
                            {/* Video Label */}
                            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg">
                                <span className="text-white text-sm font-medium">You</span>
                            </div>

                            {/* Recording Indicator with Timer */}
                            {state === "recording" && (
                                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/20 backdrop-blur-sm px-3 py-1 rounded-lg border border-red-500/30">
                                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                                    <span className="text-red-400 text-sm font-medium">REC</span>
                                    <span className="text-red-400 text-sm font-medium">{formatTime(recordingDuration)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Remote Video */}
                    <div className="flex-1 bg-gray-900/50 border border-gray-700 rounded-2xl overflow-hidden backdrop-blur-lg">
                        <div className="h-full relative flex items-center justify-center">
                            <video 
                                ref={nextUserRef}
                                autoPlay 
                                playsInline
                                className="w-full h-full object-contain"
                                style={{
                                    aspectRatio: 'auto',
                                    objectFit: 'contain',
                                    objectPosition: 'center'
                                }}
                            />
                            
                            {!remoteSocketId && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-6xl md:text-8xl mb-4 opacity-30">👤</div>
                                        <p className="text-gray-400">Waiting for participant...</p>
                                    </div>
                                </div>
                            )}

                            {/* Video Label */}
                            {remoteSocketId && (
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
                <div className="flex justify-center items-center gap-4 px-4 py-2 md:px-6">
                    {/* Status Message */}
                    <div className="text-center mb-2">
                        <p className="text-gray-300 text-sm">
                            {!remoteSocketId ? "⏳ Waiting for participant to join..." : null}

                            {(remoteSocketId && state === undefined) ? (
                                "Record again and send"
                            ) : (remoteSocketId && state === "recording") ? (
                                "🔴 Recording in progress..."
                            ) : (remoteSocketId && state === "sent") ? (
                                `🎉 Recording sent! Cooldown: ${formatTime(cooldownTime)}`
                            ) : (remoteSocketId && state === null) ?(
                                "✅ Participant joined! Ready to send recordings..."
                            ) : null}
                        </p>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-center gap-2 md:gap-3">
                        {/* Start Recording Button - with cooldown */}
                        {remoteSocketId && state !== "recording" && (
                            <button
                                onClick={handleCall}
                                disabled={cooldownTime > 0}
                                className={`flex items-center gap-1 px-4 py-2 md:px-6 font-semibold rounded-lg md:rounded-xl shadow-lg transition-all duration-300 text-sm md:text-base ${
                                    cooldownTime > 0 
                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed shadow-gray-600/30' 
                                        : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-105'
                                }`}
                            >
                                <span className="text-sm md:text-lg">🎥</span>
                                <span className="hidden md:inline">
                                    {cooldownTime > 0 ? `Wait ${formatTime(cooldownTime)}` : 'Start Recording'}
                                </span>
                            </button>
                        )}

                        {/* Stop Recording Button */}
                        {state === "recording" && (
                            <button
                                onClick={handleStopRecording}
                                className="flex items-center gap-1 px-4 py-2 md:px-6 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-lg md:rounded-xl shadow-lg shadow-gray-600/30 hover:shadow-gray-600/40 transition-all duration-300 hover:scale-105 text-sm md:text-base"
                            >
                                <span className="text-sm md:text-lg">⏹️</span>
                                <span className="hidden md:inline">Stop Recording</span>
                            </button>
                        )}

                        {/* End Session Button */}
                        {remoteSocketId && (
                            <button
                                onClick={handleEndCall}
                                className="flex items-center gap-1 px-4 py-2 md:px-6 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg md:rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-500/40 transition-all duration-300 hover:scale-105 text-sm md:text-base"
                            >
                                <span className="text-sm md:text-lg">📞</span>
                                <span className="hidden md:inline">End Session</span>
                            </button>
                        )}

                        {/* Back Button */}
                        {!remoteSocketId && (
                            <button
                                onClick={handleEndCall}
                                className="flex items-center gap-1 px-4 py-2 md:px-6 bg-white/10 border border-white/20 text-gray-300 font-semibold rounded-lg md:rounded-xl transition-all duration-300 hover:bg-white/20 text-sm md:text-base"
                            >
                                <span className="text-sm md:text-lg">←</span>
                                <span className="hidden md:inline">Back to Home</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RecordRoom