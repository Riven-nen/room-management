/* eslint-disable no-unused-vars */
import './Login.css'
import logo from '../assets/logo.png'
import { useState, useContext } from 'react'
import { UserContext } from './UserContext.jsx'

const ROLE_OPTIONS = [
    { value: 'student', label: 'Student', needsCode: false },
    { value: 'faculty', label: 'Faculty', needsCode: true },
    { value: 'mis_staff', label: 'MIS Staff', needsCode: true },
    { value: 'admin', label: 'Admin', needsCode: true }
]

function Register({ onSwitchToLogin }) {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState("student")
    const [inviteCode, setInviteCode] = useState("")
    const [error, setError] = useState("")
    const { setUser } = useContext(UserContext)

    const selectedRole = ROLE_OPTIONS.find(option => option.value === role)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError("")

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ 
                    name, 
                    email, 
                    password, 
                    role,
                    invite_code: selectedRole?.needsCode ? inviteCode : undefined
                })
            })

            const data = await response.json()

            if (response.ok) {
                setUser(data.user)
            } else {
                setError(data.message || "Registration failed")
            }
        } catch (err) {
            setError("Network error. Please try again.")
        }
    }

    return (
        <div className="login-page">
            <div className="login-container" style={{ height: 'auto', minHeight: '70vh', paddingTop: '28px', paddingBottom: '28px' }}>
                <img src={logo} id="logo" alt="Logo"/>
                <h1 id="login-title">Create Account</h1>
                
                {error && <p style={{color: 'red', margin: '0 0 10px 0', fontSize: '14px'}}>{error}</p>}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="prompt-label-box">
                        <label>Full Name</label>
                        <input 
                            type="text" 
                            required 
                            className="prompt-box"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                    </div>

                    <div className="prompt-label-box">
                        <label>Email Address</label>
                        <input 
                            type="email" 
                            required 
                            className="prompt-box"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                        />
                    </div>

                    <div className="prompt-label-box">
                        <label>Password</label>
                        <input 
                            type="password" 
                            required 
                            minLength={8}
                            className="prompt-box"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                        <small style={{ display: 'block', marginTop: '4px', color: '#64748b' }}>
                            At least 8 characters.
                        </small>
                    </div>

                    <div className="prompt-label-box">
                        <label>Account Type</label>
                        <select
                            className="prompt-box"
                            value={role}
                            onChange={(event) => {
                                setRole(event.target.value)
                                setInviteCode("")
                            }}
                        >
                            {ROLE_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    {selectedRole?.needsCode && (
                        <div className="prompt-label-box">
                            <label>Registration Code</label>
                            <input
                                type="text"
                                required
                                className="prompt-box"
                                placeholder="LCUP-XXX-XXXX-XXXX"
                                value={inviteCode}
                                onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                            />
                            <small style={{ display: 'block', marginTop: '4px', color: '#64748b' }}>
                                Ask the administrator for a code for this role.
                            </small>
                        </div>
                    )}

                    <button className="submit" type="submit" style={{ marginTop: '20px' }}> Register </button>

                    <div className="support-prompt">
                        <p>Already have an account?</p> 
                        <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>Log In</a>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Register
