import './Sidebar.css'
import logo from '../assets/logo.png'
import { LayoutDashboardIcon, LogOut, BookIcon, Calendar, RobotArm, Settings, ChartBar } from 'lucide-react'
import {UserContext} from '../auth/UserContext.jsx'
import {useContext} from 'react'

function Sidebar({ page, setPage, role }) {
    const {setUser} = useContext(UserContext)

    const handleLogout = async (event) => {
        event.preventDefault()
        await fetch("http://localhost:3000/api/auth/logout", { method: "POST" })
        setUser(null)
    }

    const isAdmin = role === "admin"
    const canBookLabs = role === "admin" || role === "teacher"
    const isStudent = role === "student"

    return (
        <div className="sidebar-container">
            <div className="sidebar-title">
                <img src={logo} alt="Logo" />
                <h3>LCUP <br /> Laboratory</h3>
            </div>

            <div className="sidebar-items">
                <ul>
                    {/* HIDE DASHBOARD FROM STUDENTS */}
                    {!isStudent && (
                        <li>
                            <button onClick={() => setPage("Dashboard")} className={page === "Dashboard" ? "active" : ""}>
                                <LayoutDashboardIcon /> Dashboard
                            </button>
                        </li>
                    )}

                    {canBookLabs && (
                        <li>
                            <button onClick={() => setPage("Reservation")} className={page === "Reservation" ? "active" : ""}>
                                <BookIcon /> Work Booking
                            </button>
                        </li>
                    )}

                    <li>
                        <button onClick={() => setPage("ScheduleViewer")} className={page === "ScheduleViewer" ? "active" : ""}>
                            <Calendar /> Schedule Viewer
                        </button>
                    </li>

                    {isAdmin && (
                        <>
                            <li>
                                <button onClick={() => setPage("LabManagement")} className={page === "LabManagement" ? "active" : ""}>
                                    <RobotArm /> Lab Management
                                </button>
                            </li>
                            <li>
                                <button onClick={() => setPage("AnalyticsReports")} className={page === "AnalyticsReports" ? "active" : ""}>
                                    <ChartBar /> Analytics Reports
                                </button>
                            </li>
                        </>
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