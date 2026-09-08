import { createContext, useState, useEffect } from 'react'


export const UserContext = createContext(null)

export function UserProvider({children}) {
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState(null)
    useEffect(() => {
        fetch("http://localhost:3000/api/auth/me", {
            credentials: "include"
        })
            .then(response => response.json())
            .then(data => setUser(data.user))
            .finally(() => setLoading(false))
    }, [])
    
    return (
    <UserContext.Provider value={{ user, setUser, loading }}>
        {children}
    </UserContext.Provider>
    )
}