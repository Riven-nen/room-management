/* eslint-disable react-hooks/set-state-in-effect */
import Card from "./Card.jsx"
import './Dashboard.css'
import { Calendar, Download, Book, CalendarArrowDownIcon, Wrench, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react'
import BarChart from '../layout/BarChart.jsx'
import CircleChart from '../layout/CircleChart.jsx'
import ReservationTable from '../layout/ReservationTable.jsx'
import { useContext, useEffect, useState } from 'react'
import { UserContext } from '../auth/UserContext.jsx'

function Dashboard() {
    const { user, labs } = useContext(UserContext)
    const [reservations, setReservations] = useState([])
    const [analytics, setAnalytics] = useState({ weeklyTrends: [], labUsage: [] })

    const fetchData = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reservation/all`, { credentials: "include" })
            if (res.ok) {
                const d = await res.json()
                setReservations(d.reservations)
            }
            const analyticsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/reservation/analytics`, { credentials: "include" })
            if (analyticsRes.ok) {
                const a = await analyticsRes.json()
                setAnalytics(a)
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data", error)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleApprove = async (id) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reservation/update-status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ id, status: "approved" })
            })
            if (res.ok) setReservations(prev => prev.map(r => r.id === id ? { ...r, status: "approved" } : r))
        } catch (error) {
            console.error("FETCH ERROR:", error)
        }
    }

    const handleReject = async (id) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reservation/update-status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ id, status: "rejected" })
            })
            if (res.ok) setReservations(prev => prev.map(r => r.id === id ? { ...r, status: "rejected" } : r))
        } catch (error) {
            console.error("FETCH ERROR:", error)
        }
    }

    const maintenanceLabs = labs.filter(lab => lab.maintenance)
    const availableLabs = labs.filter(lab => !lab.maintenance)
    
    const now = new Date()
    const currentlyOccupied = reservations.filter(r => 
        r.status === "approved" && 
        now >= new Date(r.start) && 
        now <= new Date(r.end)
    )

    const myBookings = reservations.filter(r => 
        r.user === user.name && 
        new Date(r.start) > new Date() && 
        r.status !== "rejected" && 
        r.status !== "cancelled"
    ).sort((a, b) => new Date(a.start) - new Date(b.start))

    const pendingToApprove = reservations.filter(res => {
        if (res.status !== "pending") return false;
        if (user.role === "admin") return true;
        if (user.role === "teacher") return String(res.coordinator_id) === String(user.id);
        return false;
    })

    const approvedCount = reservations.filter(r => r.status === "approved").length
    const totalPendingCount = reservations.filter(r => r.status === "pending").length

    return (
        <>
            <div className="dashboard-title">
                <div className="dashboard-title-left">
                    <label>SYSTEMS STATUS: ONLINE</label>
                    <h1>{user.role === "admin" ? "IT Laboratory Overview" : "Faculty Dashboard"}</h1>
                </div>
                <div className="dashboard-title-right">
                    <button className="dashboard-title-date"> <Calendar size={16}/> {new Date().toLocaleDateString()} </button>
                    <button className="dashboard-title-export"> <Download size={16}/> Export Report</button>
                </div>
            </div>
            
            <div className="dashboard-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', alignItems: 'stretch' }}>
                
                {/* STATS ROW */}
                <Card className="dashboard-stats dashboard-bookings" columns={3}> 
                    <div className="dashboard-stats-icon-wrapper icon-book"><Book size={32} color="#00195c"/></div>
                    <div className="dashboard-stats-title-number"><p>Total Bookings</p><h2>{reservations.length}</h2></div>
                </Card>

                <Card className="dashboard-stats dashboard-reservationsr" columns={3}>
                    <div className="dashboard-stats-icon-wrapper icon-calendar"> <CalendarArrowDownIcon size={32} color="#f5c542"/></div>
                    <div className="dashboard-stats-title-number"><p> Active Reservations </p><h2> {approvedCount} </h2></div>
                </Card>

                <Card className="dashboard-stats dashboard-utilization" columns={3}>
                    <div className="dashboard-stats-icon-wrapper icon-gauge"> <Clock size={32} color="#00195c"/></div>
                    <div className="dashboard-stats-title-number"><p> Pending Requests </p><h2> {totalPendingCount} </h2></div>
                </Card>

                <Card className="dashboard-stats dashboard-alerts" columns={3}> 
                    <div className="dashboard-stats-icon-wrapper icon-triangle"><Wrench size={32}/></div>
                    <div className="dashboard-stats-title-number"><p> Facility Issues </p><h2> {maintenanceLabs.length} </h2></div>
                </Card>

                {/* CHARTS ROW */}
                <Card columns={4} rows={2}>
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <h2 className="dashboard-barchart-title" style={{ marginTop: 0 }}> Bookings by Day </h2>
                        <div style={{ flex: 1, minHeight: 0 }}>
                            <BarChart data={analytics.weeklyTrends} />
                        </div>
                    </div>
                </Card>
                
                <Card columns={4} rows={2}>
                    <div style={{ height: '100%', width: '100%' }}>
                        <CircleChart data={analytics.labUsage} />
                    </div>
                </Card>

                <Card columns={4} rows={2}>
                    <h2 style={{ margin: '0 0 16px 0', color: '#00195c', fontSize: '18px' }}>Live Facility Status</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle2 color="#166534" size={20} />
                                <span style={{ fontWeight: 'bold', color: '#166534', fontSize: '14px' }}>Available</span>
                            </div>
                            <h2 style={{ margin: 0, color: '#166534', fontSize: '20px' }}>{availableLabs.length}</h2>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <XCircle color="#dc2626" size={20} />
                                <span style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '14px' }}>In Use</span>
                            </div>
                            <h2 style={{ margin: 0, color: '#dc2626', fontSize: '20px' }}>{currentlyOccupied.length}</h2>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Wrench color="#d97706" size={20} />
                                <span style={{ fontWeight: 'bold', color: '#d97706', fontSize: '14px' }}>Maintenance</span>
                            </div>
                            <h2 style={{ margin: 0, color: '#d97706', fontSize: '20px' }}>{maintenanceLabs.length}</h2>
                        </div>
                    </div>
                </Card>

                {/* BOTTOM SECTION */}
                <Card columns={12} rows={2}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', height: '100%' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ color: '#f59e0b', margin: 0, fontSize: '18px' }}>Action Required: Pending Approvals</h3>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                {pendingToApprove.length > 0 ? (
                                    <ReservationTable 
                                        data={pendingToApprove} 
                                        isDashboard={true} 
                                        onApprove={handleApprove} 
                                        onReject={handleReject} 
                                    />
                                ) : (
                                    <p style={{ color: '#64748b', margin: 0 }}>No pending requests at this time.</p>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderLeft: '1px solid #e2e8f0', paddingLeft: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ color: '#00195c', margin: 0, fontSize: '18px' }}>My Upcoming Bookings</h3>
                            </div>
                            
                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {myBookings.length === 0 ? (
                                    <p style={{ color: '#64748b', margin: 0 }}>You have no upcoming work bookings.</p>
                                ) : (
                                    myBookings.map(booking => (
                                        <div key={booking.id} style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #00195c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h4 style={{ margin: 0, color: '#00195c', fontSize: '15px' }}>{booking.room}</h4>
                                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                                                    <strong>When:</strong> {new Date(booking.start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                </p>
                                                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                                                    <strong>Purpose:</strong> {booking.purpose}
                                                </p>
                                            </div>
                                            <span className={`status ${booking.status}`} style={{ marginLeft: '16px' }}>{booking.status}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card columns={12}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '18px' }}>
                                <Wrench size={20} /> Facility Maintenance Alerts
                            </h3>
                        </div>
                        
                        {maintenanceLabs.length === 0 ? (
                            <p style={{ color: '#64748b', margin: 0 }}>All laboratories are currently operational.</p>
                        ) : (
                            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                                {maintenanceLabs.map(lab => (
                                    <div key={lab.id} style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '16px', borderRadius: '8px', display: 'flex', gap: '12px', minWidth: '300px', flexShrink: 0 }}>
                                        <AlertCircle color="#dc2626" size={24} style={{ marginTop: '2px', flexShrink: 0 }}/>
                                        <div>
                                            <h4 style={{ margin: 0, color: '#991b1b', fontSize: '15px' }}>{lab.name} is under maintenance</h4>
                                            <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#b91c1c' }}><strong>Reason:</strong> {lab.maintenance_reason}</p>
                                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#b91c1c' }}><strong>Return:</strong> {lab.maintenance_until ? new Date(lab.maintenance_until).toLocaleDateString() : "TBD"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

            </div>
        </>
    )
}

export default Dashboard