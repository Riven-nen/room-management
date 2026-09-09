import { createContext, useState, useEffect } from 'react'


export const UserContext = createContext(null)

export function UserProvider({children}) {
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState(null)
    const [labs, setLabs] = useState([])
    useEffect(() => {
        fetch("http://localhost:3000/api/auth/me", {
            credentials: "include"
        })
            .then(response => response.json())
            .then(data => setUser(data.user))
    }, [])

    useEffect(() => {
        fetch("http://localhost:3000/api/lab/all", {
            credentials: "include"
        })
            .then(response => response.json())
            .then(data => setLabs(data.labs))
            .finally(() => setLoading(false))
    }, [])
    
    return (
    <UserContext.Provider value={{ 
        user, 
        setUser, 
        labs,
        setLabs,
        loading
    }}>
        {children}
    </UserContext.Provider>
    )
}