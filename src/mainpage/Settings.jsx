/* eslint-disable react-hooks/set-state-in-effect */
import { Save, User, Lock, Mail, Info, ShieldCheck } from 'lucide-react'
import Card from './Card.jsx'
import './Settings.css'
import './Schedules.css'
import { useState, useContext, useEffect } from 'react'
import { UserContext } from '../auth/UserContext.jsx'
import { PageSkeleton } from '../layout/Loading.jsx'
import { normalizeRole, ROLE_LABELS } from '../auth/roles.js'

function Settings() {
    const { user, setUser } = useContext(UserContext)
    
    const [name, setName] = useState("")
    const [saving, setSaving] = useState(false)
    const [notice, setNotice] = useState(null)

    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [changingPass, setChangingPass] = useState(false)

    useEffect(() => {
        if (user) setName(user.name || "")
    }, [user])

    const handleSaveProfile = async () => {
        if (!name.trim()) {
            setNotice({ type: "error", text: "Name cannot be empty." })
            return
        }

        setSaving(true)
        setNotice(null)

        try {
            const response = await fetch('/api/auth/update-profile', {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ name })
            })
            const data = await response.json()

            if (response.ok) {
                setUser(data.user)
                setNotice({ type: "success", text: "Profile updated successfully." })
            } else {
                setNotice({ type: "error", text: data.message || "Failed to update profile." })
            }
        } catch {
            setNotice({ type: "error", text: "Network error. Please try again." })
        } finally {
            setSaving(false)
        }
    }

    const handleChangePassword = async (event) => {
        event.preventDefault()
        setNotice(null)

        if (newPassword !== confirmPassword) {
            setNotice({ type: "error", text: "New passwords do not match." })
            return
        }
        if (newPassword.length < 8) {
            setNotice({ type: "error", text: "New password must be at least 8 characters." })
            return
        }

        setChangingPass(true)

        try {
            const response = await fetch('/api/auth/change-password', {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ currentPassword, newPassword })
            })
            const data = await response.json()

            if (response.ok) {
                setNotice({ type: "success", text: "Password changed successfully." })
                setCurrentPassword("")
                setNewPassword("")
                setConfirmPassword("")
            } else {
                setNotice({ type: "error", text: data.message || "Failed to change password." })
            }
        } catch {
            setNotice({ type: "error", text: "Network error. Please try again." })
        } finally {
            setChangingPass(false)
        }
    }

    if (!user) return <PageSkeleton label="Loading settings" stats={0} rows={3} columns={2} />

    const roleLabel = ROLE_LABELS[normalizeRole(user.role)] || "User"

    return (
        <div className="schedule-page">
            <div className="schedule-hero">
                <div>
                    <h1>System Settings</h1>
                    <p>Manage your profile, password, and account access.</p>
                </div>
                <div className="hero-meta">
                    <span className="hero-chip"><User size={14} /> {roleLabel}</span>
                    <span className="hero-chip"><Mail size={14} /> {user.email}</span>
                </div>
            </div>

            {notice && <div className={`settings-notice ${notice.type}`}>{notice.text}</div>}

            <div className="settings-content">
                <div className="settings-content-main">
                    <Card className="settings-profile">
                        <div className="settings-card-title">
                            <div>
                                <User size={20} />
                                <h2>User Profile</h2>
                            </div>

                            <button onClick={handleSaveProfile} disabled={saving}>
                                <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>

                        <div className="settings-profile-content">
                            <div className="settings-profile-image">
                                <div className="settings-profile-avatar">
                                    <User size={42} />
                                </div>
                                <span className="settings-avatar-caption">{roleLabel}</span>
                            </div>

                            <div className="settings-profile-fields">
                                <div className="settings-field">
                                    <label>Full Name</label>
                                    <input value={name} onChange={(event) => setName(event.target.value)} />
                                </div>

                                <div className="settings-field">
                                    <label>Role</label>
                                    <input value={roleLabel} disabled />
                                </div>

                                <div className="settings-field settings-field-wide">
                                    <label>Email Address</label>
                                    <input value={user.email} disabled />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="settings-content-side">
                    <Card className="settings-security">
                        <div className="settings-card-title">
                            <div>
                                <Lock size={20} />
                                <h2>Change Password</h2>
                            </div>
                        </div>

                        <form className="settings-password-form" onSubmit={handleChangePassword}>
                            <div className="settings-field">
                                <label>Current Password</label>
                                <input
                                    type="password"
                                    autoComplete="current-password"
                                    value={currentPassword}
                                    onChange={(event) => setCurrentPassword(event.target.value)}
                                    required
                                />
                            </div>
                            <div className="settings-field">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    value={newPassword}
                                    onChange={(event) => setNewPassword(event.target.value)}
                                    minLength={8}
                                    required
                                />
                            </div>
                            <div className="settings-field">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    minLength={8}
                                    required
                                />
                            </div>
                            <button type="submit" className="settings-submit" disabled={changingPass}>
                                {changingPass ? "Updating..." : "Update Password"}
                            </button>
                        </form>
                    </Card>

                    <Card className="settings-account">
                        <div className="settings-card-title">
                            <div>
                                <ShieldCheck size={20} />
                                <h2>Account &amp; Security</h2>
                            </div>
                        </div>

                        <div className="settings-account-body">
                            <div className="settings-account-row">
                                <User size={16} />
                                <div>
                                    <strong>Role</strong>
                                    {roleLabel}
                                </div>
                            </div>
                            <div className="settings-account-row">
                                <Mail size={16} />
                                <div>
                                    <strong>Email</strong>
                                    {user.email}
                                </div>
                            </div>
                            <div className="settings-account-row">
                                <Info size={16} />
                                <div>
                                    <strong>Need a change?</strong>
                                    Contact MIS to update your role or email address.
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default Settings
