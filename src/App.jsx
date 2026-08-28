import Login from "./auth/Login.jsx"
import Navbar from "./layout/Navbar.jsx"
import Sidebar from "./layout/Sidebar.jsx"
import "./index.css"

function App() {
  return (
    <>
      <div className="app-layout">
        <Sidebar/>
        <div className="main-container">
          <Navbar/>
        </div>
      </div>

    </>
  )
}

export default App