import Login from "./auth/Login.jsx"
import Navbar from "./layout/Navbar.jsx"
import Sidebar from "./layout/Sidebar.jsx"
import Card from "./mainpage/Card.jsx"
import "./index.css"
import Dashboard from "./mainpage/Dashboard.jsx"

function App() {
  return (
    <>
      <div className="app-layout">
        <Sidebar/>
        <div className="main-container">
          <Navbar/>
          <div className="main-content">
            <Dashboard/>
          </div>
        </div>
      </div>

    </>
  )
}

export default App