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
    <div style={styles.container}>
      {
        hide ? (
          <>
            {/* Header for both sections */}
            <header style={styles.globalHeader}>
              <div style={styles.logo}>
                <div style={styles.logoIcon}>📹</div>
                <h1 style={styles.logoText}>VideoChat</h1>
              </div>
            </header>

            <div style={styles.splitContainer}>
              {/* Left Side - Navigation */}
              <div style={styles.leftPanel}>
                <main style={styles.main}>
                  <div style={styles.content}>
                    <h2 style={styles.title}>
                      {currentCategory === "record" ? "🎥 Recording Mode" : "🔴 Live Mode"}
                    </h2>
                    <p style={styles.subtitle}>
                      {currentCategory === "record" 
                        ? "Create and save video recordings" 
                        : "Start live video conversations"
                      }
                    </p>
                    
                    <div style={styles.buttonContainer}>
                      <button 
                        onClick={() => setcurrentCategory("live")} 
                        style={{
                          ...styles.button,
                          ...(currentCategory === "live" ? styles.buttonActive : styles.buttonInactive)
                        }}
                      >
                        <span style={styles.buttonIcon}>🔴</span>
                        Live Chat
                      </button>
                      <button 
                        onClick={() => setcurrentCategory("record")} 
                        style={{
                          ...styles.button,
                          ...(currentCategory === "record" ? styles.buttonActive : styles.buttonInactive)
                        }}
                      >
                        <span style={styles.buttonIcon}>🎥</span>
                        Record
                      </button>
                    </div>
                  </div>
                </main>
              </div>

              {/* Right Side - Outlet */}
              <div style={styles.rightPanel}>
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

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0f0f0f',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  globalHeader: {
    padding: '16px 24px',
    borderBottom: '1px solid #333',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  splitContainer: {
    display: 'flex',
    minHeight: 'calc(100vh - 80px)',
    flexDirection: 'row',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      minHeight: '100vh',
    },
  },
  leftPanel: {
    width: '50%',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
    display: 'flex',
    flexDirection: 'column',
    '@media (max-width: 768px)': {
      width: '100%',
      minHeight: '40vh',
      order: 1,
    },
  },
  rightPanel: {
    width: '50%',
    backgroundColor: '#0f0f0f',
    '@media (max-width: 768px)': {
      width: '100%',
      minHeight: '60vh',
      order: 2,
    },
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    justifyContent: 'left',
    '@media (max-width: 768px)': {
      gap: '8px',
      justifyContent: 'center',
    },
  },
  logoIcon: {
    fontSize: '28px',
    filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))',
    '@media (max-width: 768px)': {
      fontSize: '24px',
    },
  },
  logoText: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    '@media (max-width: 768px)': {
      fontSize: '20px',
    },
  },
  main: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '20px',
    '@media (max-width: 768px)': {
      padding: '12px 16px',
    },
  },
  content: {
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%',
    '@media (max-width: 768px)': {
      maxWidth: '100%',
      padding: '0',
    },
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    margin: '0 0 12px 0',
    background: 'linear-gradient(45deg, #ffffff, #cccccc)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: '1.2',
    '@media (max-width: 768px)': {
      fontSize: '22px',
      margin: '0 0 8px 0',
    },
    '@media (max-width: 480px)': {
      fontSize: '20px',
    },
  },
  subtitle: {
    fontSize: '14px',
    color: '#888',
    margin: '0 0 32px 0',
    lineHeight: '1.5',
    '@media (max-width: 768px)': {
      fontSize: '13px',
      margin: '0 0 20px 0',
    },
    '@media (max-width: 480px)': {
      fontSize: '12px',
      margin: '0 0 16px 0',
    },
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    justifyContent: 'center',
    '@media (max-width: 768px)': {
      flexDirection: 'row',
      gap: '12px',
    },
    '@media (max-width: 480px)': {
      flexDirection: 'column',
      gap: '10px',
    },
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    border: '2px solid transparent',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    '@media (max-width: 768px)': {
      padding: '8px 16px',
      fontSize: '14px',
      flex: 1,
      minWidth: '120px',
    },
    '@media (max-width: 480px)': {
      padding: '10px 20px',
      fontSize: '14px',
      width: '100%',
    },
  },
  buttonActive: {
    background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
    color: '#ffffff',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 16px rgba(255, 107, 107, 0.3)',
    '@media (max-width: 768px)': {
      transform: 'none',
      boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)',
    },
  },
  buttonInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#cccccc',
    border: '2px solid rgba(255, 255, 255, 0.1)',
  },
  buttonIcon: {
    fontSize: '16px',
    filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.3))',
    '@media (max-width: 768px)': {
      fontSize: '14px',
    },
  },
}

export default App
