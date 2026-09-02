import Login from "./auth/Login.jsx"
import Navbar from "./layout/Navbar.jsx"
import Sidebar from "./layout/Sidebar.jsx"
import Card from "./mainpage/Card.jsx"
import "./index.css"
import Dashboard from "./mainpage/Dashboard.jsx"
import LabManagement from "./mainpage/LabManagement.jsx"
import Announcements from "./mainpage/Announcements.jsx"
import Settings from "./mainpage/Settings.jsx"
import ScheduleViewer from "./mainpage/ScheduleViewer.jsx"

function App() {
  return (
    <>
      <div className="app-layout">
        <Sidebar/>
        <div className="main-container">
          <Navbar/>
          <div className="main-content">
            <ScheduleViewer/>
          </div>
        </div>
      </div>

    </>
  )
}

export default App