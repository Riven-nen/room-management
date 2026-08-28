import './Login.css'
import logo from '../assets/logo.png'

function Login() {
    return (
    <>
        <div className="login-page">
            <div className="login-container">
                <img src={logo} id="logo"/>
                <h1 id="login-title">LCUP Laboratory</h1>
                <form className="login-form">
                    <div className="prompt-label-box">
                        <label for="account">I am a...</label>
                        <select id="account" className="prompt-box">
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                        </select>
                    </div>
                    
                    <div className="prompt-label-box">
                        <label for="email">Email Address</label>
                        <input type="text" id="email" className="prompt-box"/>
                    </div>

                    <div className="prompt-label-box">
                        <label for="password">Password</label>
                        <input type="text" id="password" className="prompt-box"/>
                    </div>
                    
                    <div className="form-options">
                        <div className="remember-me">
                            <input type="checkbox" id="remember"/>
                            <label for="remember">Remember Me</label>
                        </div>

                        <a href="#">Register Account</a>
                    </div>

                    <button className="submit"> Login </button>

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