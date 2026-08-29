import './Navbar.css'
import { Search, Menu, BellIcon, CircleQuestionMark, CircleUserRound, SeparatorVertical } from 'lucide-react'

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
                        <input type="text" placeholder="Search Activities..."/>
                    </div>
                    <BellIcon/>
                    <CircleQuestionMark/>
                    <div className="divider"></div>
                    <CircleUserRound size={32} aria-label="User profile" />
                    <p>Placeholder Name</p>
                </div>
            </div>
        </>
    )
}

export default Navbar