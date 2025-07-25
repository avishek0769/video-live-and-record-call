import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

function App() {
  const [currentCategory, setcurrentCategory] = useState("")
  const [hide, setHide] = useState(false)
  const navigate = useNavigate()
  const route = useLocation()

  useEffect(() => {
    setcurrentCategory("live")
  }, [])

  useEffect(() => {
    setHide(!route.pathname.includes("room"))
  }, [route])

  useEffect(() => {
    if (currentCategory == "record") {
      navigate("/record")
    }
    else {
      navigate("/live")
    }
  }, [currentCategory])

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {
        hide ? (
          <>
            {/* Header for both sections */}
            <header className="px-6 py-4 md:px-6 md:py-4 border-b border-gray-700 bg-black/30 backdrop-blur-lg sticky top-0 z-50">
              <div className="flex items-center gap-3 md:gap-3 justify-center md:justify-start">
                <div className="text-2xl md:text-3xl drop-shadow-lg">📹</div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-red-400 to-teal-400 bg-clip-text text-transparent">
                  VideoChat
                </h1>
              </div>
            </header>

            <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
              {/* Left Side - Navigation */}
              <div className="w-full md:w-1/2 min-h-[30vh] md:min-h-auto bg-gradient-to-br from-gray-950 to-gray-950 flex flex-col order-1">
                <main className="flex items-center justify-center flex-1 p-4 md:p-5">
                  <div className="text-center max-w-md w-full px-2 md:px-0">
                    <h2 className="text-xl md:text-3xl font-extrabold mb-2 md:mb-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent leading-tight">
                      {currentCategory === "record" ? "🎥 Recording Mode" : "🔴 Live Mode"}
                    </h2>
                    <p className="text-xs md:text-sm text-gray-400 mb-4 md:mb-8 leading-relaxed">
                      {currentCategory === "record" 
                        ? "Create and save video recordings" 
                        : "Start live video conversations"
                      }
                    </p>
                    
                    <div className="flex flex-row md:flex-col gap-3 md:gap-4">
                      <button 
                        onClick={() => setcurrentCategory("live")} 
                        className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 border-2 border-transparent rounded-xl text-sm md:text-base font-semibold cursor-pointer transition-all duration-300 justify-center relative overflow-hidden flex-1 md:flex-none min-w-[120px] md:min-w-0 md:w-auto ${
                          currentCategory === "live" 
                            ? "bg-gradient-to-r from-red-400 to-teal-400 text-white transform-none md:-translate-y-0.5 shadow-lg shadow-red-400/30" 
                            : "bg-white/5 text-gray-300 border-white/10"
                        }`}
                      >
                        <span className="text-sm md:text-base drop-shadow-sm">🔴</span>
                        Live Chat
                      </button>
                      <button 
                        onClick={() => setcurrentCategory("record")} 
                        className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 border-2 border-transparent rounded-xl text-sm md:text-base font-semibold cursor-pointer transition-all duration-300 justify-center relative overflow-hidden flex-1 md:flex-none min-w-[120px] md:min-w-0 md:w-auto ${
                          currentCategory === "record" 
                            ? "bg-gradient-to-r from-red-400 to-teal-400 text-white transform-none md:-translate-y-0.5 shadow-lg shadow-red-400/30" 
                            : "bg-white/5 text-gray-300 border-white/10"
                        }`}
                      >
                        <span className="text-sm md:text-base drop-shadow-sm">🎥</span>
                        Record
                      </button>
                    </div>
                  </div>
                </main>
              </div>

              {/* Right Side - Outlet */}
              <div className="w-full md:w-1/2 min-h-[70vh] md:min-h-auto bg-gray-950 order-2">
                <Outlet />
              </div>
            </div>
          </>
        ) : (
          <Outlet />
        )
      }
    </div>
  )
}

export default App
