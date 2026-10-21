import {
    Save,
    SlidersHorizontal,
    User,
    Wrench,
    ShieldCheck,
    Lock
} from 'lucide-react'
import Card from './Card.jsx'
import './Settings.css'
import { useState, useContext, useEffect } from 'react'
import { UserContext } from '../auth/UserContext.jsx'

function Settings() {
    const { user, setUser } = useContext(UserContext)
    
    // Profile State
    const [name, setName] = useState("")
    const [saving, setSaving] = useState(false)

    // Password State
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [changingPass, setChangingPass] = useState(false)

    useEffect(() => {
        if (user) setName(user.name || "")
    }, [user])

    const handleSaveProfile = async () => {
        if (!name.trim()) return alert("Name cannot be empty")
        setSaving(true)
        try {
            const response = await fetch("https://room-management-475x.onrender.com/api/auth/update-profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ name })
            })
            const data = await response.json()
            if (response.ok) {
                setUser(data.user)
                alert("Profile updated successfully!")
            } else {
                alert(data.message || "Failed to update profile")
            }
        } catch (error) {
            alert("Network error")
        } finally {
            setSaving(false)
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            return alert("New passwords do not match")
        }
        if (newPassword.length < 6) {
            return alert("New password must be at least 6 characters")
        }

        setChangingPass(true)
        try {
            const response = await fetch("https://room-management-475x.onrender.com/api/auth/change-password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ currentPassword, newPassword })
            })
            const data = await response.json()
            
            if (response.ok) {
                alert("Password changed successfully!")
                setCurrentPassword("")
                setNewPassword("")
                setConfirmPassword("")
            } else {
                alert(data.message || "Failed to change password")
            }
        } catch (error) {
            alert("Network error")
        } finally {
            setChangingPass(false)
        }
    }

    if (!user) return <p>Loading...</p>

    return (
        <>
            <div className="settings-title">
                <div>
                    <h1>System Settings</h1>
                    <p>Manage your personal account and global lab preferences.</p>
                </div>
            </div>

            <div className="settings-content">
                <div className="settings-content-main">
                    <Card className="settings-profile">
                        <div className="settings-card-title">
                            <div>
                                <User size={20} />
                                <h2>User Profile</h2>
                            </div>

                            <button onClick={handleSaveProfile} disabled={saving}>
                                <Save size={14} /> {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>

                        <div className="settings-profile-content">
                            <div className="settings-profile-image">
                                <div className="settings-profile-avatar">
                                    <User size={45} />
                                </div>
                                <button>Change Photo</button>
                            </div>

                            <div className="settings-profile-fields">
                                <div className="settings-field">
                                    <label>Full Name</label>
                                    <input value={name} onChange={(e) => setName(e.target.value)} />
                                </div>

                                <div className="settings-field">
                                    <label>Role</label>
                                    <input value={user.role.toUpperCase()} disabled style={{backgroundColor: '#e2e8f0', color: '#64748b'}} />
                                </div>

                                <div className="settings-field settings-field-wide">
                                    <label>Email Address</label>
                                    <input value={user.email} disabled style={{backgroundColor: '#f1f5f9', color: '#64748b'}} />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="settings-security">
                        <div className="settings-card-title">
                            <div>
                                <Lock />
                                <h2>Change Password</h2>
                            </div>
                        </div>

                        <form onSubmit={handleChangePassword} style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className="settings-field">
                                <label>Current Password</label>
                                <input 
                                    type="password" 
                                    value={currentPassword} 
                                    onChange={(e) => setCurrentPassword(e.target.value)} 
                                    required 
                                />
                            </div>
                            <div className="settings-field">
                                <label>New Password</label>
                                <input 
                                    type="password" 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)} 
                                    required 
                                />
                            </div>
                            <div className="settings-field">
                                <label>Confirm New Password</label>
                                <input 
                                    type="password" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    required 
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={changingPass}
                                style={{
                                    marginTop: '8px',
                                    padding: '10px',
                                    backgroundColor: '#00195c',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: 'bold',
                                    cursor: changingPass ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {changingPass ? "Updating..." : "Update Password"}
                            </button>
                        </form>
                    </Card>
                </div>

                {/* Sidebar remains the same */}
                <div className="settings-content-side">
                    <Card className="settings-preferences">
                        <div className="settings-card-title">
                            <div>
                                <SlidersHorizontal size={20} />
                                <h2>System Preferences</h2>
                            </div>
                        </div>

                        <div className="settings-preference-section">
                            <label>INTERFACE THEME</label>
                            <div className="settings-theme-buttons">
                                <button className="settings-theme-active">☼ Light</button>
                                <button>☾ Dark</button>
                            </div>
                        </div>

                        <div className="settings-preference-section">
                            <label>NOTIFICATIONS</label>
                            <div className="settings-checkbox-row">
                                <span>Email Alerts</span>
                                <input type="checkbox" defaultChecked />
                            </div>
                            <div className="settings-checkbox-row">
                                <span>Desktop Notifications</span>
                                <input type="checkbox" defaultChecked />
                            </div>
                        </div>
                    </Card>

                    <Card className="settings-defaults">
                        <div className="settings-defaults-title">
                            <Wrench size={20} />
                            <h2>Lab Management Defaults</h2>
                        </div>

                        <div className="settings-default-field">
                            <label>DEFAULT BOOKING DURATION</label>
                            <div>
                                <input defaultValue="60" />
                                <span>Minutes</span>
                            </div>
                        </div>

                        <button className="settings-defaults-button">
                            Update Admin Policies
                        </button>
                    </Card>
                </div>
            </div>
        </>
    )
}

export default Settings