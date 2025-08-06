import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import SocketProvider from './context/SocketProvider.jsx'
import RecordRoom from './screens/record/RecordRoom.jsx'
import RecordLobby from './screens/record/RecordLobby.jsx'
import LiveLobby from './screens/live/LiveLobby.jsx'
import LiveRoom from './screens/live/LiveRoom.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/record",
        element: <RecordLobby />
      },
      {
        path: "/record/room/:roomId",
        element: <RecordRoom />
      },
      {
        path: "/live",
        element: <LiveLobby />
      },
      {
        path: "/live/room/:roomId",
        element: <LiveRoom />
      },
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SocketProvider>
      <RouterProvider router={router} />
    </SocketProvider>
  </StrictMode>
)
