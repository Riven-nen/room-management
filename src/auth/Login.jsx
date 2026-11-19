import './Login.css'
import logo from '../assets/logo.png'
import { Link } from 'react-router-dom'
import { useState, useContext } from 'react'
import { UserContext } from './UserContext.jsx'

function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const { setUser } = useContext(UserContext)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError("")
        setSubmitting(true)

        try {
            const response = await fetch(`/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password })
            })

            const data = await response.json()

            if (response.ok) {
                setUser(data.user)
            } else {
                setError(data.message || "Invalid credentials")
            }
        } catch {
            setError("Network error. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <img src={logo} id="logo" alt="Logo"/>
                <h1 id="login-title">LabEase</h1>

                {error && <p className="login-error" role="alert">{error}</p>}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="prompt-label-box">
                        <label>Email Address</label>
                        <input 
                            type="email" required className="prompt-box"
                            autoComplete="email"
                            value={email} onChange={(event) => setEmail(event.target.value)}
                        />
                    </div>

                    <div className="prompt-label-box">
                        <label>Password</label>
                        <input 
                            type="password" required className="prompt-box"
                            autoComplete="current-password"
                            value={password} onChange={(event) => setPassword(event.target.value)}
                        />
                    </div>
                    
                    <div className="form-options">
                        <div className="remember-me">
                            <input type="checkbox" id="remember"/>
                            <label htmlFor="remember">Remember Me</label>
                        </div>
                        <Link to="/register">Register Account</Link>
                    </div>

                    <button className="submit" type="submit" disabled={submitting}>
                        {submitting ? "Signing in..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Login
