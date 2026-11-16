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
import SemesterSchedule from "./mainpage/SemesterSchedule.jsx"
import MasterSchedule from "./mainpage/MasterSchedule.jsx"
import ScheduleManager from "./mainpage/ScheduleManager.jsx"
import InviteCodes from "./mainpage/InviteCodes.jsx"
import AnalyticsReports from "./mainpage/AnalyticsReports.jsx"
import Reservation from "./mainpage/Reservation.jsx"
import BookingsManager from "./mainpage/BookingsManager.jsx"

import { useContext, useState } from 'react'
import { UserContext } from './auth/UserContext.jsx'
import { NotificationProvider } from './auth/NotificationContext.jsx'
import { normalizeRole, canAccessPage } from './auth/roles.js'

function App() {
  const { user, loading } = useContext(UserContext)
  const [page, setPage] = useState("Dashboard")
  const [sessionUserId, setSessionUserId] = useState(null)
  const [isRegistering, setIsRegistering] = useState(false)

  const role = normalizeRole(user?.role)
  const defaultPage = role === "student" ? "SemesterSchedule" : "Dashboard"

  // Reset the landing page whenever a different account logs in.
  if (user && user.id !== sessionUserId) {
    setSessionUserId(user.id)
    setPage(defaultPage)
  }

  if (!user && sessionUserId !== null) {
    setSessionUserId(null)
    setPage("Dashboard")
  }

  const pages = {
      Dashboard: { component: Dashboard, name: "Dashboard" },
      LabManagement: { component: LabManagement, name: "Lab Management" },
      Announcements: { component: Announcements, name: "Announcements" },
      Settings: { component: Settings, name: "Settings" },
      ScheduleViewer: { component: ScheduleViewer, name: "Laboratory Schedule" },
      SemesterSchedule: { component: SemesterSchedule, name: "Class Schedule" },
      MasterSchedule: { component: MasterSchedule, name: "University Calendar" },
      ScheduleManager: { component: ScheduleManager, name: "Manage Schedules" },
      InviteCodes: { component: InviteCodes, name: "Registration Codes" },
      AnalyticsReports: { component: AnalyticsReports, name: "Analytics Reports" },
      Reservation: { component: Reservation, name: "Work Booking" },
      BookingsManager: { component: BookingsManager, name: "Manage Bookings" }
  }

  const activePage = user && canAccessPage(role, page) ? page : defaultPage
  const currentPageData = pages[activePage] || pages["Dashboard"]
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
    <NotificationProvider>
      <div className="app-layout">
        <Sidebar page={activePage} setPage={setPage} role={role} />
        <div className="main-container">
          <Navbar pageTitle={pageTitle} />
          <div className="main-content">
            <CurrentPage/>
          </div>
        </div>
      </div>
    </NotificationProvider>
  )
}

export default App
