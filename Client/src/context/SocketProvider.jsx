import { createContext, useMemo } from "react";
import { io } from "socket.io-client"
import { SERVER_ADDRESS } from "../../../constants";

export const SocketContext = createContext(null)

function SocketProvider({children}) {
    const socket = useMemo(() => io(SERVER_ADDRESS), [])
    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    )
}

export default SocketProvider
