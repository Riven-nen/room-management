import './Sidebar.css'
import logo from '../assets/logo.png'
import { NavLink, useNavigate } from 'react-router-dom'
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
    KeyRound,
    Users,
    X
} from 'lucide-react'
import { UserContext } from '../auth/UserContext.jsx'
import { useContext } from 'react'
import { normalizeRole, PAGE_ACCESS } from '../auth/roles.js'

function Sidebar({ isOpen = false, onClose }) {
    const { user, setUser } = useContext(UserContext)
    const navigate = useNavigate()
    const role = normalizeRole(user?.role)

    const canSee = (roles) => (roles || []).includes(role)

    const items = [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon, roles: PAGE_ACCESS.dashboard },
        { to: "/class-schedule", label: "Class Schedule", icon: CalendarDays, roles: PAGE_ACCESS.classSchedule },
        { to: "/university-calendar", label: "University Calendar", icon: CalendarRange, roles: PAGE_ACCESS.universityCalendar },
        { to: "/lab-schedule", label: "Lab Schedule", icon: Calendar, roles: PAGE_ACCESS.labSchedule },
        { to: "/bookings", label: "Lab Reservation", icon: BookIcon, roles: PAGE_ACCESS.bookings },
        { to: "/manage-bookings", label: "Manage Bookings", icon: ClipboardList, roles: PAGE_ACCESS.manageBookings },
        { to: "/admin/schedules", label: "Manage Schedules", icon: ShieldCheck, roles: PAGE_ACCESS.scheduleManager },
        { to: "/admin/registration-codes", label: "Registration Codes", icon: KeyRound, roles: PAGE_ACCESS.inviteCodes },
        { to: "/admin/users", label: "User Management", icon: Users, roles: PAGE_ACCESS.userManagement },
        { to: "/admin/labs", label: "Lab Management", icon: RobotArm, roles: PAGE_ACCESS.labManagement },
        { to: "/admin/analytics", label: "Analytics Reports", icon: ChartBar, roles: PAGE_ACCESS.analytics },
        { to: "/settings", label: "Settings", icon: Settings, roles: PAGE_ACCESS.settings }
    ]

    const handleLogout = async (event) => {
        event.preventDefault()
        await fetch('/api/auth/logout', { method: "POST", credentials: "include" })
        setUser(null)
        navigate("/login", { replace: true })
    }

    return (
        <div className={`sidebar-container ${isOpen ? "sidebar-open" : ""}`}>
            <div className="sidebar-title">
                <img src={logo} alt="Logo" />
                <h3>LabEase</h3>
                <button className="sidebar-close" type="button" onClick={onClose} aria-label="Close navigation">
                    <X size={18} />
                </button>
            </div>

            <div className="sidebar-items">
                <ul>
                    {items.filter((item) => canSee(item.roles)).map((item) => {
                        const Icon = item.icon
                        return (
                            <li key={item.to}>
                                <NavLink
                                    to={item.to}
                                    onClick={onClose}
                                    className={({ isActive }) => (isActive ? "active" : "")}
                                >
                                    <Icon /> {item.label}
                                </NavLink>
                            </li>
                        )
                    })}
                </ul>
            </div>

            <div className="sidebar-bottom">
                {canSee(PAGE_ACCESS.bookings) && (
                    <NavLink className="new-booking" to="/bookings" onClick={onClose}>
                        + New Lab Reservation
                    </NavLink>
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
