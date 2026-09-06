import './Login.css'
import logo from '../assets/logo.png'
import {useState, useContext} from 'react'
import {UserContext} from './UserContext.jsx'

function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const {user, setUser} = useContext(UserContext)

    const handleSubmit = async (event) => {
        event.preventDefault()

        console.log("SUBMIT FIRED")

        const response = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                email,
                password
            })
        })

        const data = await response.json()

        console.log(data)
        if (response.ok) {
            setUser(data.user)
        }
    }

    return (
    <>
        <div className="login-page">
            <div className="login-container">
                <img src={logo} id="logo"/>
                <h1 id="login-title">LCUP Laboratory</h1>
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="prompt-label-box">
                        <label for="account">I am a...</label>
                        <select id="account" className="prompt-box">
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                        </select>
                    </div>
                    
                    <div className="prompt-label-box">
                        <label for="email">Email Address</label>
                        <input 
                            type="email" 
                            required 
                            id="email" 
                            className="prompt-box"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                        />
                    </div>

                    <div className="prompt-label-box">
                        <label for="password">Password</label>
                        <input 
                            type="password" 
                            required 
                            id="password" 
                            className="prompt-box"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                    </div>
                    
                    <div className="form-options">
                        <div className="remember-me">
                            <input type="checkbox" id="remember"/>
                            <label for="remember">Remember Me</label>
                        </div>

                        <a href="#">Register Account</a>
                    </div>

                    <button className="submit" type="submit"> Login </button>

                    <div className="support-prompt">
                        <p>Need Help?</p> <a href="#">Contact Support</a>
                    </div>
                </form>
            </div>
        </div>
    </>
    )
}
export default Login