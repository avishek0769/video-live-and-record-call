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
            <h1 style={styles.heading}>Lobby</h1>

            <label htmlFor="roomId" style={styles.label}>Enter the Room id</label>
            <input type="text" id="roomId" name="roomId" style={styles.input} value={roomId} onChange={e => setRoomId(e.target.value)} />

            <button style={styles.button} onClick={handleJoin}>Join</button>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
    },
    input: {
        margin: '10px 0',
        padding: '10px',
        fontSize: '16px',
        borderRadius: '5px',
        border: '1px solid #ccc',
        outline: 'none',
    },
    label: {
        margin: '10px 0 5px',
        fontSize: '18px',
    },
    heading: {
        fontSize: '32px',
        marginBottom: '20px',
    },
    button: {
        padding: '10px 20px',
        fontSize: '16px',
        borderRadius: '5px',
        border: 'none',
        backgroundColor: 'blue',
        color: 'white',
        cursor: 'pointer',
    },
};

export default LiveLobby