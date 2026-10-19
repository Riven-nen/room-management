import Card from "./Card.jsx"
import './Dashboard.css'
import { Calendar, Download, Book, CalendarArrowDownIcon, Gauge, TriangleAlert, Wrench, AlertCircle } from 'lucide-react'
import BarChart from '../layout/BarChart.jsx'
import CircleChart from '../layout/CircleChart.jsx'
import ReservationTable from '../layout/ReservationTable.jsx'
import ConflictTable from '../layout/ConflictTable.jsx'
import { useContext, useEffect, useState } from 'react'
import { UserContext } from '../auth/UserContext.jsx'

function Dashboard() {
    const { user, labs } = useContext(UserContext)
    const [reservations, setReservations] = useState([])

    const fetchReservations = async () => {
        try {
            const res = await fetch("http://localhost:3000/api/reservation/all", { credentials: "include" })
            if (res.ok) {
                const d = await res.json()
                setReservations(d.reservations)
            }
        } catch (error) {
            console.error("Failed to fetch reservations", error)
        }
    }

    useEffect(() => {
        fetchReservations()
    }, [])

    const handleApprove = async (id) => {
        try {
            const res = await fetch("http://localhost:3000/api/reservation/update-status", {
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
            const res = await fetch("http://localhost:3000/api/reservation/update-status", {
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

    const myBookings = reservations.filter(r => 
        r.user === user.name && 
        new Date(r.start) > new Date() && 
        r.status !== "rejected" && 
        r.status !== "cancelled"
    ).sort((a, b) => new Date(a.start) - new Date(b.start))

    const pendingToApprove = reservations.filter(res => {
        if (res.status !== "pending") return false;
        if (user.role === "admin") return true;
        if (user.role === "teacher") return res.coordinator_id === user.id;
        return false;
    })

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
            
            <div className="dashboard-content" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
                
                <Card className="dashboard-stats dashboard-bookings" columns={3}> 
                    <div className="dashboard-stats-icon-wrapper icon-book"><Book size={32} color="#00195c"/></div>
                    <div className="dashboard-stats-title-number"><p>Total Bookings</p><h2>{reservations.length}</h2></div>
                </Card>

                <Card className="dashboard-stats dashboard-reservationsr" columns={3}>
                    <div className="dashboard-stats-icon-wrapper icon-calendar"> <CalendarArrowDownIcon size={32} color="#f5c542"/></div>
                    <div className="dashboard-stats-title-number"><p> Active Reservations </p><h2> {reservations.filter(r => r.status === "approved").length} </h2></div>
                </Card>

                <Card className="dashboard-stats dashboard-utilization" columns={3}>
                    <div className="dashboard-stats-icon-wrapper icon-gauge"> <Gauge size={32} color="#00195c"/></div>
                    <div className="dashboard-stats-title-number"><p> Lab Utilization </p><h2> 82.4% </h2></div>
                </Card>

                <Card className="dashboard-stats dashboard-alerts" columns={3}> 
                    <div className="dashboard-stats-icon-wrapper icon-triangle"><TriangleAlert size={32}/></div>
                    <div className="dashboard-stats-title-number"><p> Conflict Alerts </p><h2> 2 </h2></div>
                </Card>

                <Card columns={4} rows={2}>
                    <h2 className="dashboard-barchart-title"> Weekly Utilization Trends </h2>
                    <BarChart data={[
                        { name: '1', value: 65 }, { name: '2', value: 75 }, { name: '3', value: 85 }, 
                        { name: '4', value: 45 }, { name: '5', value: 80 }, { name: '6', value: 65 }
                    ]}/>
                </Card>
                
                <Card columns={4} rows={2}>
                    <CircleChart data={[
                        { name: 'Advanced Web Lab', value: 45 },
                        { name: 'Comp. Graphics', value: 30 },
                        { name: 'Research Hub', value: 25 }
                    ]}/>
                </Card>

                <Card columns={4} rows={2}>
                    <h2 style={{ margin: '0 0 16px 0', color: '#00195c', fontSize: '18px' }}>Peak Usage Hours</h2>
                    <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#94a3b8' }}>
                        Chart coming soon
                    </div>
                </Card>

                {pendingToApprove.length > 0 && (
                    <Card columns={6} rows={2}>
                        <div className="dashboard-pending-reservation-title">
                            <h3 style={{ color: '#f59e0b' }}>Action Required: Pending Approvals</h3>
                        </div>
                        <ReservationTable 
                            data={pendingToApprove} 
                            isDashboard={true} 
                            onApprove={handleApprove} 
                            onReject={handleReject} 
                        />
                    </Card>
                )}

                <Card columns={pendingToApprove.length > 0 ? 6 : 12} rows={2}>
                    <div className="dashboard-pending-reservation-title" style={{ marginBottom: '16px' }}>
                        <h3 style={{ color: '#00195c', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            My Upcoming Bookings
                        </h3>
                    </div>
                    
                    {myBookings.length === 0 ? (
                        <p style={{ color: '#64748b', margin: 0 }}>You have no upcoming work bookings.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '200px' }}>
                            {myBookings.map(booking => (
                                <div key={booking.id} style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #00195c' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h4 style={{ margin: 0, color: '#00195c' }}>{booking.room}</h4>
                                        <span className={`status ${booking.status}`}>{booking.status}</span>
                                    </div>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                                        <strong>When:</strong> {new Date(booking.start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                                        <strong>Purpose:</strong> {booking.purpose}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card columns={6} rows={2}>
                    <div className="dashboard-pending-reservation-title" style={{ marginBottom: '16px' }}>
                        <h3 style={{color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px', margin: 0}}>
                            <Wrench size={20} /> Facility Maintenance Alerts
                        </h3>
                    </div>
                    
                    {maintenanceLabs.length === 0 ? (
                        <p style={{color: '#64748b', margin: 0}}>All laboratories are currently operational.</p>
                    ) : (
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', overflowY: 'auto', maxHeight: '200px'}}>
                            {maintenanceLabs.map(lab => (
                                <div key={lab.id} style={{backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '16px', borderRadius: '8px', display: 'flex', gap: '12px'}}>
                                    <AlertCircle color="#dc2626" size={24} style={{marginTop: '2px', flexShrink: 0}}/>
                                    <div>
                                        <h4 style={{margin: 0, color: '#991b1b', fontSize: '15px'}}>{lab.name} is under maintenance</h4>
                                        <p style={{margin: '6px 0 0 0', fontSize: '13px', color: '#b91c1c'}}><strong>Reason:</strong> {lab.maintenance_reason}</p>
                                        <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#b91c1c'}}><strong>Return:</strong> {lab.maintenance_until ? new Date(lab.maintenance_until).toLocaleDateString() : "TBD"}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card columns={6} rows={1}>
                    <h3 className="dashboard-conflict-log-title">Critical Conflict Logs</h3>
                    <ConflictTable data={[
                        { partiesInvolved: "BSIT 3A vs BSIT 2B", conflictType: "Double Booking", severity: "Critical", roomName: "Room 101" }
                    ]}/>
                </Card>

            </div>
        </>
    )
}

export default Dashboard