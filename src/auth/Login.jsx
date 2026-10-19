import './Login.css'
import logo from '../assets/logo.png'
import {useState, useContext} from 'react'
import {UserContext} from './UserContext.jsx'

function Login({ onSwitchToRegister }) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const {setUser} = useContext(UserContext)

    const handleSubmit = async (event) => {
        event.preventDefault()
        const response = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password })
        })

        const data = await response.json()
        if (response.ok) {
            setUser(data.user)
        } else {
            alert(data.message || "Invalid credentials")
        }
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <img src={logo} id="logo" alt="Logo"/>
                <h1 id="login-title">LCUP Laboratory</h1>
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="prompt-label-box">
                        <label>Email Address</label>
                        <input 
                            type="email" required className="prompt-box"
                            value={email} onChange={(event) => setEmail(event.target.value)}
                        />
                    </div>

                    <div className="prompt-label-box">
                        <label>Password</label>
                        <input 
                            type="password" required className="prompt-box"
                            value={password} onChange={(event) => setPassword(event.target.value)}
                        />
                    </div>
                    
                    <div className="form-options">
                        <div className="remember-me">
                            <input type="checkbox" id="remember"/>
                            <label htmlFor="remember">Remember Me</label>
                        </div>
                        {/* WIRE UP REGISTER LINK */}
                        <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToRegister(); }}>Register Account</a>
                    </div>

                    <button className="submit" type="submit"> Login </button>
                </form>
            </div>
        </div>
    )
}

export default Login