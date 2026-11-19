/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react'

export const UserContext = createContext(null)

export function UserProvider({children}) {
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState(null)
    const [labs, setLabs] = useState([])

    useEffect(() => {
        const handleUnauthorized = () => setUser(null)
        window.addEventListener("auth:unauthorized", handleUnauthorized)
        return () => window.removeEventListener("auth:unauthorized", handleUnauthorized)
    }, [])

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userRes = await fetch(`/api/auth/me`, {
                    credentials: "include"
                })
                if (userRes.ok) {
                    const userData = await userRes.json()
                    setUser(userData.user)
                } else {
                    setUser(null)
                }
            } catch (error) {
                console.error("Error fetching user:", error)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        fetchUser()
    }, [])

    useEffect(() => {
        const userId = user?.id
        if (!userId) return

        const controller = new AbortController()

        const fetchLabs = async () => {
            try {
                const labsRes = await fetch(`/api/lab/all`, {
                    credentials: "include",
                    signal: controller.signal
                })
                if (labsRes.ok) {
                    const labsData = await labsRes.json()
                    setLabs(labsData.labs)
                }
            } catch (error) {
                if (error.name !== "AbortError") console.error("Error fetching labs:", error)
            }
        }

        fetchLabs()
        return () => controller.abort()
    }, [user?.id])
    
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
