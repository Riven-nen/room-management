import Login from "./auth/Login.jsx"
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

import {useContext, useState} from 'react'
import {UserContext} from './auth/UserContext.jsx'

function App() {
  const {user, setUser, loading} = useContext(UserContext)
  const [page, setPage] = useState("Dashboard")

  const pages = {
      Dashboard: { component: Dashboard, name: "Dashboard", allowedRoles: ["student", "teacher", "admin"] },
      LabManagement: { component: LabManagement, name: "Lab Management", allowedRoles: ["admin"] },
      Announcements: { component: Announcements, name: "Announcements", allowedRoles: ["student", "teacher", "admin"] },
      Settings: { component: Settings, name: "Settings", allowedRoles: ["student", "teacher", "admin"] },
      ScheduleViewer: { component: ScheduleViewer, name: "Schedule Viewer", allowedRoles: ["student", "teacher", "admin"] },
      AnalyticsReports: { component: AnalyticsReports, name: "Analytics Reports", allowedRoles: ["admin", "teacher"] },
      Reservation: { component: Reservation, name: "Work Booking", allowedRoles: ["student", "teacher", "admin"] }
  }

  const currentPageData = pages[page] || pages["Dashboard"]
  const CurrentPage = currentPageData.component
  const pageTitle = currentPageData.name

  if (loading) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Loading System...</div>
  }

  if (!user) {
    return <Login setUser={setUser}/>
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