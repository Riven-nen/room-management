/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useContext } from "react"
import Card from "./Card"
import { Check, X, Search, MapPin } from "lucide-react"
import { UserContext } from "../auth/UserContext.jsx"

const parseLocal = (value) => {
    if (!value) return new Date()
    if (value instanceof Date) return value
    const str = String(value).trim()
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/)
    if (match) {
        const [, y, mo, d, h, mi, s] = match
        return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s || 0), 0)
    }
    return new Date(str)
}

function BookingsManager() {
    const { user, labs } = useContext(UserContext)
    const [reservations, setReservations] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("all")
    const [search, setSearch] = useState("")

    const fetchReservations = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reservation/all`, { credentials: "include" })
            if (res.ok) {
                const data = await res.json()
                setReservations(data.reservations)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReservations()
    }, [])

    const handleUpdateStatus = async (id, status) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reservation/update-status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ id, status })
            })
            if (res.ok) {
                setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r))
            }
        } catch (error) {
            console.error("Failed to update status", error)
        }
    }

    const isTeacher = user.role.toLowerCase() === "teacher"
    const assignedLabs = labs.filter(lab => String(lab.coordinator_id) === String(user.id))

    const filteredReservations = reservations.filter(r => {
        if (isTeacher && String(r.coordinator_id) !== String(user.id)) {
            return false
        }

        const matchesStatus = filter === "all" || r.status === filter
        const matchesSearch = 
            r.room.toLowerCase().includes(search.toLowerCase()) || 
            r.user.toLowerCase().includes(search.toLowerCase())
        return matchesStatus && matchesSearch
    })

    const getStatusColor = (status) => {
        switch(status) {
            case 'approved': return { bg: '#dcfce7', text: '#166534' }
            case 'pending': return { bg: '#fef3c7', text: '#d97706' }
            case 'rejected': return { bg: '#fef2f2', text: '#dc2626' }
            default: return { bg: '#f1f5f9', text: '#64748b' }
        }
    }

    if (loading) return <p>Loading bookings...</p>

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="dashboard-title">
                <div className="dashboard-title-left">
                    <label>{isTeacher ? "COORDINATOR HUB" : "ADMIN COMMAND CENTER"}</label>
                    <h1 style={{ margin: 0 }}>{isTeacher ? "Review Lab Requests" : "Manage All Bookings"}</h1>
                    {isTeacher && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Assigned Labs:</span>
                            {assignedLabs.length === 0 ? (
                                <span style={{ fontSize: '13px', color: '#dc2626' }}>None</span>
                            ) : (
                                assignedLabs.map(lab => (
                                    <span key={lab.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: '#00195c', color: 'white', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                                        <MapPin size={12} /> {lab.name}
                                    </span>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['all', 'pending', 'approved', 'rejected'].map(status => (
                            <button 
                                key={status}
                                onClick={() => setFilter(status)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    textTransform: 'capitalize',
                                    backgroundColor: filter === status ? '#00195c' : '#f1f5f9',
                                    color: filter === status ? 'white' : '#64748b'
                                }}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', backgroundColor: '#f8fafc' }}>
                        <Search size={18} color="#64748b" />
                        <input 
                            type="text" 
                            placeholder="Search room or user..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ border: 'none', background: 'transparent', outline: 'none', height: '40px', width: '250px', color: '#334155' }}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '12px', color: '#64748b' }}>Room</th>
                                <th style={{ padding: '12px', color: '#64748b' }}>Reserved By</th>
                                {!isTeacher && <th style={{ padding: '12px', color: '#64748b' }}>Coordinator</th>}
                                <th style={{ padding: '12px', color: '#64748b' }}>Schedule</th>
                                <th style={{ padding: '12px', color: '#64748b' }}>Details</th>
                                <th style={{ padding: '12px', color: '#64748b' }}>Status</th>
                                <th style={{ padding: '12px', color: '#64748b', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReservations.length === 0 ? (
                                <tr>
                                    <td colSpan={!isTeacher ? 7 : 6} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                                        No bookings found.
                                    </td>
                                </tr>
                            ) : (
                                filteredReservations.map(res => {
                                    const colors = getStatusColor(res.status)
                                    const start = parseLocal(res.start)
                                    const end = parseLocal(res.end)

                                    return (
                                        <tr key={res.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '12px', fontWeight: 'bold', color: '#00195c' }}>{res.room}</td>
                                            <td style={{ padding: '12px', color: '#334155' }}>{res.user}</td>
                                            {!isTeacher && <td style={{ padding: '12px', color: '#64748b' }}>{res.coordinator_name || "None"}</td>}
                                            <td style={{ padding: '12px', fontSize: '13px' }}>
                                                <div style={{ color: '#334155', fontWeight: 'bold' }}>{start.toLocaleDateString()}</div>
                                                <div style={{ color: '#64748b' }}>{start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '13px' }}>
                                                <div style={{ color: '#334155' }}><strong>Purpose:</strong> {res.purpose}</div>
                                                <div style={{ color: '#64748b' }}><strong>Pax:</strong> {res.participants}</div>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', backgroundColor: colors.bg, color: colors.text, textTransform: 'capitalize' }}>
                                                    {res.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                {res.status === "pending" ? (
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                        <button onClick={() => handleUpdateStatus(res.id, "approved")} style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: '#dcfce7', color: '#166534', cursor: 'pointer' }}>
                                                            <Check size={18} />
                                                        </button>
                                                        <button onClick={() => handleUpdateStatus(res.id, "rejected")} style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>Processed</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}

export default BookingsManager