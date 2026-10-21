import './Navbar.css'
import { BellIcon, CircleQuestionMark, CircleUserRound, ChevronDown, X } from 'lucide-react'
import { UserContext } from '../auth/UserContext'
import { NotificationContext } from '../auth/NotificationContext'
import { useContext, useState, useEffect, useRef } from 'react'

function Navbar({ pageTitle }) {
    const { user } = useContext(UserContext)
    const { notifications, unreadCount, markAsRead } = useContext(NotificationContext)
    
    const [showNotifDropdown, setShowNotifDropdown] = useState(false)
    const [showProfileDropdown, setShowProfileDropdown] = useState(false)
    const [showHelpModal, setShowHelpModal] = useState(false)

    const notifRef = useRef(null)
    const profileRef = useRef(null)

    useEffect(() => {
        function handleClickOutside(event) {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifDropdown(false)
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileDropdown(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleOpenNotifs = () => {
        setShowNotifDropdown(!showNotifDropdown)
        setShowProfileDropdown(false)
        if (!showNotifDropdown && unreadCount > 0) {
            markAsRead()
        }
    }

    return (
        <>
            <div className="navbar-container">
                <div className="navbar-left">
                    <h1>{pageTitle}</h1>
                </div>

                <div className="navbar-right">
                    
                    <div style={{ position: 'relative' }} ref={notifRef}>
                        <button className="nav-icon-btn" onClick={handleOpenNotifs}>
                            <BellIcon size={22} />
                            {unreadCount > 0 && <span className="notif-dot">{unreadCount}</span>}
                        </button>

                        {showNotifDropdown && (
                            <div className="dropdown-menu notif-menu">
                                <div className="dropdown-header">Notifications</div>
                                <div className="dropdown-list">
                                    {notifications.length === 0 ? (
                                        <p className="dropdown-empty">No new notifications</p>
                                    ) : (
                                        notifications.map(n => (
                                            <div key={n.id} className={`notif-item ${n.is_read ? 'read' : 'unread'}`}>
                                                <p className="notif-message">{n.message}</p>
                                                <p className="notif-time">{new Date(n.created_at).toLocaleString()}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <button className="nav-icon-btn" onClick={() => setShowHelpModal(true)}>
                        <CircleQuestionMark size={22} />
                    </button>

                    <div className="nav-divider"></div>

                    <div className="profile-container" ref={profileRef} onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowNotifDropdown(false); }}>
                        <div className="profile-info">
                            <CircleUserRound size={32} color="#00195c" />
                            <div className="profile-text">
                                <span className="profile-name">{user.name || "User"}</span>
                                <span className="profile-role">{user.role.toUpperCase()}</span>
                            </div>
                            <ChevronDown size={16} color="#64748b" />
                        </div>

                        {showProfileDropdown && (
                            <div className="dropdown-menu profile-menu" style={{ padding: '16px', width: '240px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#00195c' }}>{user.name}</span>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>{user.email}</span>
                                    <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                        Role: {user.role}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showHelpModal && (
                <div className="modal-overlay" onClick={() => setShowHelpModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', maxWidth: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ margin: 0, color: '#00195c' }}>Need Help?</h2>
                            <button onClick={() => setShowHelpModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#334155' }}>
                            <p>If you are experiencing issues with the LCUP Laboratory Management System, please reach out to the MIS Department.</p>
                            
                            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <strong style={{ color: '#00195c', display: 'block', marginBottom: '4px' }}>Contact Support</strong>
                                <p style={{ margin: 0 }}>Email: mis.support@lcup.edu.ph</p>
                                <p style={{ margin: '4px 0 0 0' }}>Phone: (044) 123-4567 local 123</p>
                            </div>

                            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                                Version 1.0.0 | Capstone Project
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default Navbar