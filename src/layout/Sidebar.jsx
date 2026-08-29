import './Sidebar.css'
import logo from '../assets/logo.png'
import {LayoutDashboardIcon, LogOut, BookIcon, Calendar, RobotArm, Settings, ChartColumn, ChartBar} from 'lucide-react'
function Sidebar() {
    return (
        <>
            <div className="sidebar-container">
                <div className="sidebar-title">
                    <img src={logo}/>
                    <h3>LCUP <br/> Laboratory</h3>
                </div>
                <div className="sidebar-items">
                    <ul>
                        <li><LayoutDashboardIcon/> Dashboard</li>
                        <li><BookIcon/> Laboratory Booking</li>
                        <li><Calendar/> Schedule Viewer</li>
                        <li><RobotArm/> Lab Management</li>
                        <li><ChartBar/> Analytics Reports</li>
                        <li><Settings/> Settings</li>
                    </ul>

                </div>
                <div className="sidebar-bottom">
                    <button className="new-booking">+ New Booking</button>
                    <button className="logout">
                        <LogOut size={18} />
                        Log Out
                    </button>
                </div>
            </div>
        </>
    )
}

export default Sidebar