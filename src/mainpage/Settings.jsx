import {
    Bell,
    CircleHelp,
    LockKeyhole,
    Save,
    Settings as SettingsIcon,
    Shield,
    SlidersHorizontal,
    User,
    Wrench
} from 'lucide-react'
import Card from './Card.jsx'
import Toggle from '../layout/Toggle.jsx'
import './Settings.css'

function Settings() {
    return (
        <>
            <div className="settings-title">
                <div>
                    <h1>System Settings</h1>
                    <p>Manage your personal account, security, and global lab preferences.</p>
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

                            <button>
                                Save Changes
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
                                    <input value="Dr. Mariano Santos" readOnly />
                                </div>

                                <div className="settings-field">
                                    <label>Department</label>
                                    <input value="IT Program" readOnly />
                                </div>

                                <div className="settings-field settings-field-wide">
                                    <label>Email Address</label>
                                    <input value="mariano.santos@lcup.edu.ph" readOnly />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="settings-security">
                        <div className="settings-card-title">
                            <div>
                                <Shield/>
                                <h2>Account Security</h2>
                            </div>
                        </div>

                        <div className="settings-security-fields">
                            <div className="settings-field">
                                <label>New Password</label>
                                <input type="password" value="12345678" readOnly />
                            </div>

                            <div className="settings-field">
                                <label>Confirm New Password</label>
                                <input type="password" value="12345678" readOnly />
                            </div>
                        </div>

                        <div className="settings-two-factor">
                            <div>
                                <strong>Two-Factor Authentication</strong>
                                <p>Add an extra layer of security to your account.</p>
                            </div>

                            <Toggle checked={true} onChange={() => {}} />
                        </div>
                    </Card>
                </div>

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
                                <input type="checkbox" checked readOnly />
                            </div>

                            <div className="settings-checkbox-row">
                                <span>Desktop Notifications</span>
                                <input type="checkbox" checked readOnly />
                            </div>

                            <div className="settings-checkbox-row">
                                <span>Mobile Push</span>
                                <input type="checkbox" readOnly />
                            </div>
                        </div>

                        <div className="settings-preference-section">
                            <label>LANGUAGE</label>
                            <select>
                                <option>English (US)</option>
                            </select>
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
                                <input value="60" readOnly />
                                <span>Minutes</span>
                            </div>
                        </div>

                        <div className="settings-default-field">
                            <label>MAINTENANCE WINDOW ALERT</label>
                            <div>
                                <input value="48" readOnly />
                                <span>Hours Advance</span>
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