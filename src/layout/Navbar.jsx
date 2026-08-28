import './Navbar.css'
import { Search, Menu, BellIcon, Settings, CircleUserRound } from 'lucide-react'

function Navbar() {
    return (
        <>
            <div className="navbar-container">
                <div className="navbar-left">
                    <h1>Page Title</h1>
                </div>

                <div className="navbar-right">
                    <div className="navbar-search-bar">
                        <Search/>
                        <input type="text" placeholder="Search"/>
                    </div>
                    <BellIcon/>
                    <Settings/>
                    <CircleUserRound size={32} aria-label="User profile" />
                </div>
            </div>
        </>
    )
}

export default Navbar