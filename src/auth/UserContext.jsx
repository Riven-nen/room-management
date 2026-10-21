/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react'

export const UserContext = createContext(null)

export function UserProvider({children}) {
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState(null)
    const [labs, setLabs] = useState([])

    useEffect(() => {
        const fetchUserAndLabs = async () => {
            try {
                const userRes = await fetch("https://room-management-475x.onrender.com/api/auth/me", {
                    credentials: "include"
                })
                if (userRes.ok) {
                    const userData = await userRes.json()
                    setUser(userData.user)
                } else {
                    setUser(null)
                }

                const labsRes = await fetch("https://room-management-475x.onrender.com/api/lab/all", {
                    credentials: "include"
                })
                if (labsRes.ok) {
                    const labsData = await labsRes.json()
                    setLabs(labsData.labs)
                }
            } catch (error) {
                console.error("Error fetching initial data:", error)
            } finally {
                setLoading(false) 
            }
        }

        fetchUserAndLabs()
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