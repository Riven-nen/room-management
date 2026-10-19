import Login from "./auth/Login.jsx"
import Register from "./auth/Register.jsx" 
import Navbar from "./layout/Navbar.jsx"
import Sidebar from "./layout/Sidebar.jsx"
import "./index.css"
import Dashboard from "./mainpage/Dashboard.jsx"
import LabManagement from "./mainpage/LabManagement.jsx"
import Announcements from "./mainpage/Announcements.jsx"
import Settings from "./mainpage/Settings.jsx"
import ScheduleViewer from "./mainpage/ScheduleViewer.jsx"
import AnalyticsReports from "./mainpage/AnalyticsReports.jsx"
import Reservation from "./mainpage/Reservation.jsx"

import { useContext, useState, useEffect } from 'react'
import { UserContext } from './auth/UserContext.jsx'

function App() {
  const { user, setUser, loading } = useContext(UserContext)
  const [page, setPage] = useState("Dashboard")
  const [isRegistering, setIsRegistering] = useState(false)

  useEffect(() => {
    if (user) {
        if (user.role === "student") {
            setPage("ScheduleViewer")
        } else {
            setPage("Dashboard")
        }
    }
  }, [user])

  const pages = {
      Dashboard: { component: Dashboard, name: "Dashboard" },
      LabManagement: { component: LabManagement, name: "Lab Management" },
      Announcements: { component: Announcements, name: "Announcements" },
      Settings: { component: Settings, name: "Settings" },
      ScheduleViewer: { component: ScheduleViewer, name: "Schedule Viewer" },
      AnalyticsReports: { component: AnalyticsReports, name: "Analytics Reports" },
      Reservation: { component: Reservation, name: "Work Booking" }
  }

  let currentPageData = pages[page] || pages["Dashboard"]

  if (user && user.role === "student" && (page === "Reservation" || page === "LabManagement" || page === "AnalyticsReports" || page === "Dashboard")) {
      currentPageData = pages["ScheduleViewer"]
  }

  const CurrentPage = currentPageData.component
  const pageTitle = currentPageData.name

  if (loading) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Loading System...</div>
  }

  if (!user) {
    if (isRegistering) {
        return <Register onSwitchToLogin={() => setIsRegistering(false)} />
    }
    return <Login onSwitchToRegister={() => setIsRegistering(true)} />
  }

  return (
    <>
      <div className="app-layout">
        <Sidebar page={page} setPage={setPage} role={user.role} />
        <div className="main-container">
          <Navbar pageTitle={pageTitle} />
          <div className="main-content">
            <CurrentPage/>
          </div>
        </div>
      </div>
    </>
  )
}

export default App