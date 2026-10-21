/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from 'react'
import { UserContext } from './UserContext.jsx'

export const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
    const { user } = useContext(UserContext)
    const [notifications, setNotifications] = useState([])

    const fetchNotifications = async () => {
        if (!user) return
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, { credentials: "include" })
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications)
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err)
        }
    }

    useEffect(() => {
        fetchNotifications()
        // Poll every 30 seconds for new notifications
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [user])

    const markAsRead = async () => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/read`, { method: "PUT", credentials: "include" })
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        } catch (err) {
            console.error("Failed to mark notifications as read", err)
        }
    }

    const unreadCount = notifications.filter(n => !n.is_read).length

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, fetchNotifications }}>
            {children}
        </NotificationContext.Provider>
    )
}