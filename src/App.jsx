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
import AnalyticsReports from "./mainpage/AnalyticsReports.jsx"
import Reservation from "./mainpage/Reservation.jsx"

import {useContext, useState} from 'react'
import {UserContext} from './auth/UserContext.jsx'

function App() {
  const {user, setUser, loading} = useContext(UserContext)
  const [page, setPage] = useState("Dashboard")

  const pages = {
      Dashboard: {
          component: Dashboard,
          name: "Dashboard"
      },
      LabManagement: {
          component: LabManagement,
          name: "Lab Management"
      },
      Announcements: {
          component: Announcements,
          name: "Announcements"
      },
      Settings: {
          component: Settings,
          name: "Settings"
      },
      ScheduleViewer: {
          component: ScheduleViewer,
          name: "Schedule Viewer"
      },
      AnalyticsReports: {
          component: AnalyticsReports,
          name: "Analytics Reports"
      },
      Reservation: {
          component: Reservation,
          name: "Laboratory Booking"
      }
  }

  const CurrentPage = pages[page].component
  const pageTitle = pages[page].name

  if (loading) {
    return <p></p>
  }

  if (!user) {
    return <Login setUser={setUser}/>
  }
  return (
    <>
      
      <div className="app-layout">
        <Sidebar page = {page} setPage={setPage}/>
        <div className="main-container">
          <Navbar pageTitle={pageTitle}/>
          <div className="main-content">
            <CurrentPage/>
          </div>
        </div>
      </div>

    </>
  )
}

export default App