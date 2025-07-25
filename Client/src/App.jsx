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
    <>
      {
        hide && <>
          <header style={styles.header}>
            <h1>Video Chat App</h1>
          </header>
          <main style={styles.main}>
            <h1>{currentCategory === "record" ? "Record" : "Live"} Category</h1>
          </main>
          <div style={{ display: "flex", justifyContent: "space-around", margin: "20px" }}>
            <button onClick={() => setcurrentCategory("record")} style={{ backgroundColor: "aqua", padding: 18, border: "0", borderRadius: 1000 }}>Record</button>
            <button onClick={() => setcurrentCategory("live")} style={{ backgroundColor: "aqua", padding: 18, border: "0", borderRadius: 1000 }}>Live</button>
          </div>
        </>
      }
      <Outlet />
    </>
  )
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#282c34',
    color: 'white',
  },
  main: {
    padding: '20px',
    textAlign: "center"
  },
  li: {
    listStyle: "none"
  }
}

export default App
