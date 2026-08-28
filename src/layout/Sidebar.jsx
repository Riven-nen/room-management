import './Sidebar.css'
import logo from '../assets/logo.png'
import {LayoutDashboardIcon, LogOut} from 'lucide-react'
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
                        <li><LayoutDashboardIcon/> Placeholder</li>
                        <li><LayoutDashboardIcon/> Placeholder</li>
                        <li><LayoutDashboardIcon/> Placeholder</li>
                        <li><LayoutDashboardIcon/> Placeholder</li>
                        <li><LayoutDashboardIcon/> Placeholder</li>
                        <li><LayoutDashboardIcon/> Placeholder</li>
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