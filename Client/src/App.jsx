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
              <div className="w-full md:w-1/2 min-h-[40vh] md:min-h-auto bg-gradient-to-br from-gray-950 to-gray-950 flex flex-col order-1">
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
              <div className="w-full md:w-1/2 min-h-[60vh] md:min-h-auto bg-gray-950 order-2">
                <Outlet />
              </div>
            </div>

            {/* Information Section */}
            <div className="bg-gradient-to-r from-gray-950 to-gray-900 border-t border-gray-700 px-6 py-8 md:py-12">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8 md:mb-12">
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-red-400 to-teal-400 bg-clip-text text-transparent">
                    How VideoChat Works
                  </h3>
                  <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                    Experience seamless video communication with our easy-to-use platform
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {/* Live Mode Card */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-lg">
                    <div className="text-center mb-4">
                      <div className="text-3xl md:text-4xl mb-3">🔴</div>
                      <h4 className="text-lg md:text-xl font-bold text-red-400 mb-2">Live Mode</h4>
                    </div>
                    <ul className="text-sm md:text-base text-gray-300 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        Real-time video conversations
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        Instant communication
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        No recording saved
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        Perfect for meetings
                      </li>
                    </ul>
                  </div>

                  {/* Recording Mode Card */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-lg">
                    <div className="text-center mb-4">
                      <div className="text-3xl md:text-4xl mb-3">🎥</div>
                      <h4 className="text-lg md:text-xl font-bold text-teal-400 mb-2">Recording Mode</h4>
                    </div>
                    <ul className="text-sm md:text-base text-gray-300 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        This kind of a Walkie-Talkie with video
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        Temporarily record and send video instantly without saving
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        Use for non-live interactions with video
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        Great for quick infrequent video messages
                      </li>
                    </ul>
                  </div>

                  {/* How Rooms Work Card */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-lg md:col-span-2 lg:col-span-1">
                    <div className="text-center mb-4">
                      <div className="text-3xl md:text-4xl mb-3">🚪</div>
                      <h4 className="text-lg md:text-xl font-bold text-purple-400 mb-2">Room System</h4>
                    </div>
                    <ul className="text-sm md:text-base text-gray-300 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        Enter any Room ID to join
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        New room created if ID doesn't exist
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        Join existing rooms with same ID
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        Currently supports 1-to-1 calls
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Quick Start Guide */}
                <div className="mt-8 md:mt-12 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-2xl p-6 md:p-8">
                  <h4 className="text-xl md:text-2xl font-bold text-center mb-6 text-blue-300">
                    🚀 Quick Start Guide
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-xl font-bold text-blue-300">1</span>
                      </div>
                      <h5 className="font-semibold text-blue-200">Choose Mode</h5>
                      <p className="text-sm text-gray-400">Select Live Chat for instant calls or Recording for saved sessions</p>
                    </div>
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-xl font-bold text-purple-300">2</span>
                      </div>
                      <h5 className="font-semibold text-purple-200">Enter Room ID</h5>
                      <p className="text-sm text-gray-400">Type any room name or ID to create/join a room</p>
                    </div>
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-xl font-bold text-green-300">3</span>
                      </div>
                      <h5 className="font-semibold text-green-200">Start Chatting</h5>
                      <p className="text-sm text-gray-400">Begin your video conversation instantly</p>
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div className="mt-6 text-center">
                  <p className="text-xs md:text-sm text-gray-500 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-2 inline-block">
                    <span className="text-yellow-400">⚠️ Note:</span> Currently supports 1-to-1 video calls. Group calling coming soon!
                  </p>
                </div>
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
