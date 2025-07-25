import React, { useCallback, useContext, useState } from 'react'
import { SocketContext } from '../../context/SocketProvider'
import { useNavigate } from 'react-router-dom'

function RecordLobby() {
    const [roomId, setRoomId] = useState("")
    const socket = useContext(SocketContext)
    const navigate = useNavigate()

    const handleJoin = useCallback(()=>{
        socket.emit("join-user-record", { roomId })
        navigate(`/record/room/${roomId}`)
    }, [roomId, socket, navigate])
    
    return (
        <div className="h-full min-h-[60vh] md:min-h-[calc(100vh-80px)] flex items-center justify-center p-4 md:p-5 bg-gray-950 text-white font-sans">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-2xl p-4 md:p-8 max-w-full md:max-w-sm w-full backdrop-blur-2xl shadow-2xl mx-auto">
                <div className="text-center mb-6">
                    <div className="text-3xl md:text-4xl mb-3 drop-shadow-lg filter-drop-shadow-teal">🎥</div>
                    <h1 className="text-lg md:text-2xl font-bold mb-2 bg-gradient-to-r from-teal-400 to-white bg-clip-text text-transparent">
                        Join Recording Mode
                    </h1>
                    <p className="text-sm md:text-sm text-gray-400 leading-relaxed">
                        Enter the room ID shared to you, or enter a new one and share it to others to start your recording video conversation
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <label htmlFor="roomId" className="text-sm font-semibold text-gray-300 mb-1">
                        Room ID
                    </label>
                    <input 
                        type="text" 
                        id="roomId" 
                        name="roomId" 
                        className="px-3 py-2 md:px-4 md:py-3 text-sm md:text-base rounded-lg border-2 border-white/10 bg-white/5 text-white outline-none transition-all duration-300 font-inherit focus:border-white/20 focus:bg-white/10" 
                        value={roomId} 
                        onChange={e => setRoomId(e.target.value)}
                        placeholder="Enter room ID..."
                    />

                    <button 
                        className={`flex items-center justify-center gap-2 px-4 py-3 md:px-5 md:py-3 text-sm md:text-base font-semibold rounded-lg border-none cursor-pointer transition-all duration-300 mt-1 ${
                            roomId 
                                ? "bg-gradient-to-r from-teal-400 to-red-400 text-white shadow-lg shadow-teal-400/30 hover:shadow-teal-400/40" 
                                : "bg-white/5 text-gray-500 cursor-not-allowed"
                        }`}
                        onClick={handleJoin}
                        disabled={!roomId}
                    >
                        <span className="text-base">🎬</span>
                        Join Room
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RecordLobby