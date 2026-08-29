import Login from "./auth/Login.jsx"
import Navbar from "./layout/Navbar.jsx"
import Sidebar from "./layout/Sidebar.jsx"
import Card from "./mainpage/Card.jsx"
import "./index.css"

function App() {
  return (
    <>
      <div className="app-layout">
        <Sidebar/>
        <div className="main-container">
          <Navbar/>
          <Card/>
        </div>
      </div>

    </>
  )
}

export default App