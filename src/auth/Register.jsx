/* eslint-disable no-unused-vars */
import './Login.css'
import logo from '../assets/logo.png'
import { useState, useContext } from 'react'
import { UserContext } from './UserContext.jsx'

function Register({ onSwitchToLogin }) {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const { setUser } = useContext(UserContext)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError("")

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    name, 
                    email, 
                    password, 
                    role: "student" // Hardcoded for security
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
            <div className="login-container" style={{ height: '80vh' }}>
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
                            className="prompt-box"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                    </div>

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