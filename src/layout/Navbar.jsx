import './Navbar.css'
import { Search, Menu, BellIcon, CircleQuestionMark, CircleUserRound, SeparatorVertical, User } from 'lucide-react'
import {UserContext} from '../auth/UserContext'
import {useContext} from 'react'

function Navbar({pageTitle}) {
    const { user } = useContext(UserContext)

    return (
        <>
            <div className="navbar-container">
                <div className="navbar-left">
                    <h1>{pageTitle}</h1>
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
                    <p>{user.email}</p>
                </div>
            </div>
        </>
    )
}

export default Navbar