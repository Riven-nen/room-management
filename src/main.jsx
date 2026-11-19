import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { UserProvider } from "./auth/UserContext.jsx"
import "./index.css"

// Same-origin API wrapper:
// - defaults credentials to include
// - turns any 401 into a global "session expired" event so the router can
//   redirect back to /login
const nativeFetch = window.fetch.bind(window)

window.fetch = async (input, init = {}) => {
    const response = await nativeFetch(input, { credentials: "include", ...init })

    if (response.status === 401) {
        const url = typeof input === "string" ? input : input?.url || ""
        const isAuthAttempt = url.includes("/api/auth/login") || url.includes("/api/auth/register")
        if (!isAuthAttempt) {
            window.dispatchEvent(new Event("auth:unauthorized"))
        }
    }

    return response
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
  </StrictMode>,
)
