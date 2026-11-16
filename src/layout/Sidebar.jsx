import './Sidebar.css'
import logo from '../assets/logo.png'
import {
    LayoutDashboardIcon,
    LogOut,
    BookIcon,
    Calendar,
    RobotArm,
    Settings,
    ChartBar,
    ClipboardList,
    CalendarDays,
    CalendarRange,
    ShieldCheck,
    KeyRound
} from 'lucide-react'
import { UserContext } from '../auth/UserContext.jsx'
import { useContext } from 'react'
import { normalizeRole } from '../auth/roles.js'

function Sidebar({ page, setPage, role }) {
    const {setUser} = useContext(UserContext)

    const handleLogout = async (event) => {
        event.preventDefault()
        await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, { method: "POST", credentials: "include" })
        setUser(null)
    }

    const userRole = normalizeRole(role)
    const isAdmin = userRole === "admin"
    const isStudent = userRole === "student"
    const canBookLabs = userRole === "admin" || userRole === "faculty"

    return (
        <div className="sidebar-container">
            <div className="sidebar-title">
                <img src={logo} alt="Logo" />
                <h3>LCUP <br /> Laboratory</h3>
            </div>

            <div className="sidebar-items">
                <ul>
                    {!isStudent && (
                        <li>
                            <button onClick={() => setPage("Dashboard")} className={page === "Dashboard" ? "active" : ""}>
                                <LayoutDashboardIcon /> Dashboard
                            </button>
                        </li>
                    )}

                    <li>
                        <button onClick={() => setPage("SemesterSchedule")} className={page === "SemesterSchedule" ? "active" : ""}>
                            <CalendarDays /> Class Schedule
                        </button>
                    </li>

                    <li>
                        <button onClick={() => setPage("MasterSchedule")} className={page === "MasterSchedule" ? "active" : ""}>
                            <CalendarRange /> University Calendar
                        </button>
                    </li>

                    <li>
                        <button onClick={() => setPage("ScheduleViewer")} className={page === "ScheduleViewer" ? "active" : ""}>
                            <Calendar /> Lab Schedule
                        </button>
                    </li>

                    {canBookLabs && (
                        <li>
                            <button onClick={() => setPage("Reservation")} className={page === "Reservation" ? "active" : ""}>
                                <BookIcon /> Work Booking
                            </button>
                        </li>
                    )}

                    {canBookLabs && (
                        <li>
                            <button onClick={() => setPage("BookingsManager")} className={page === "BookingsManager" ? "active" : ""}>
                                <ClipboardList /> {isAdmin ? "All Bookings" : "Coordinator Hub"}
                            </button>
                        </li>
                    )}

                    {isAdmin && (
                        <li>
                            <button onClick={() => setPage("ScheduleManager")} className={page === "ScheduleManager" ? "active" : ""}>
                                <ShieldCheck /> Manage Schedules
                            </button>
                        </li>
                    )}

                    {isAdmin && (
                        <li>
                            <button onClick={() => setPage("InviteCodes")} className={page === "InviteCodes" ? "active" : ""}>
                                <KeyRound /> Registration Codes
                            </button>
                        </li>
                    )}

                    {isAdmin && (
                        <li>
                            <button onClick={() => setPage("LabManagement")} className={page === "LabManagement" ? "active" : ""}>
                                <RobotArm /> Lab Management
                            </button>
                        </li>
                    )}

                    {isAdmin && (
                        <li>
                            <button onClick={() => setPage("AnalyticsReports")} className={page === "AnalyticsReports" ? "active" : ""}>
                                <ChartBar /> Analytics Reports
                            </button>
                        </li>
                    )}

                    <li>
                        <button onClick={() => setPage("Settings")} className={page === "Settings" ? "active" : ""}>
                            <Settings /> Settings
                        </button>
                    </li>
                </ul>
            </div>

            <div className="sidebar-bottom">
                {canBookLabs && (
                    <button className="new-booking" onClick={() => setPage("Reservation")}>
                        + New Work Booking
                    </button>
                )}
                
                <button className="logout" onClick={handleLogout}>
                    <LogOut size={18} />
                    Log Out
                </button>
            </div>
        </div>
    )
}

export default Sidebar
