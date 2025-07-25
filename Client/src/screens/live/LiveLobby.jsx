import React, { useCallback, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SocketContext } from '../../context/SocketProvider'

function LiveLobby() {
    const [roomId, setRoomId] = useState("")
    const socket = useContext(SocketContext)
    const navigate = useNavigate()

    const handleJoin = useCallback(()=>{
        console.log("JOI")
        socket.emit("join-user", { roomId })
        navigate("/live/room")
    })
    
    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <div style={styles.icon}>🔴</div>
                    <h1 style={styles.title}>Join Live Chat</h1>
                    <p style={styles.subtitle}>Enter a room ID to start your live video conversation</p>
                </div>

                <div style={styles.form}>
                    <label htmlFor="roomId" style={styles.label}>Room ID</label>
                    <input 
                        type="text" 
                        id="roomId" 
                        name="roomId" 
                        style={styles.input} 
                        value={roomId} 
                        onChange={e => setRoomId(e.target.value)}
                        placeholder="Enter room ID..."
                    />

                    <button 
                        style={{
                            ...styles.button,
                            ...(roomId ? styles.buttonEnabled : styles.buttonDisabled)
                        }} 
                        onClick={handleJoin}
                        disabled={!roomId}
                    >
                        <span style={styles.buttonIcon}>🚀</span>
                        Join Room
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        height: '100%',
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: '#0f0f0f',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '380px',
        width: '100%',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 15px 45px rgba(0, 0, 0, 0.4)',
    },
    header: {
        textAlign: 'center',
        marginBottom: '24px',
    },
    icon: {
        fontSize: '36px',
        marginBottom: '12px',
        filter: 'drop-shadow(0 0 12px rgba(255, 107, 107, 0.5))',
    },
    title: {
        fontSize: '24px',
        fontWeight: '700',
        margin: '0 0 8px 0',
        background: 'linear-gradient(45deg, #ff6b6b, #ffffff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
    },
    subtitle: {
        fontSize: '14px',
        color: '#888',
        margin: 0,
        lineHeight: '1.4',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#cccccc',
        marginBottom: '4px',
    },
    input: {
        padding: '12px 16px',
        fontSize: '14px',
        borderRadius: '10px',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: '#ffffff',
        outline: 'none',
        transition: 'all 0.3s ease',
        fontFamily: 'inherit',
    },
    button: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px 20px',
        fontSize: '16px',
        fontWeight: '600',
        borderRadius: '10px',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        marginTop: '4px',
    },
    buttonEnabled: {
        background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
        color: '#ffffff',
        transform: 'translateY(0)',
        boxShadow: '0 6px 24px rgba(255, 107, 107, 0.3)',
    },
    buttonDisabled: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: '#666',
        cursor: 'not-allowed',
    },
    buttonIcon: {
        fontSize: '16px',
    },
    '@media (max-width: 768px)': {
        container: {
            padding: '16px',
            minHeight: '60vh',
        },
        card: {
            padding: '20px',
            maxWidth: '100%',
            margin: '0 auto',
        },
        title: {
            fontSize: '20px',
        },
        icon: {
            fontSize: '30px',
        },
        input: {
            padding: '10px 14px',
            fontSize: '16px',
        },
        button: {
            padding: '12px 16px',
            fontSize: '14px',
        },
    },
    '@media (max-width: 480px)': {
        card: {
            padding: '16px',
            borderRadius: '16px',
        },
        title: {
            fontSize: '18px',
        },
        subtitle: {
            fontSize: '13px',
        },
    },
};

export default LiveLobby