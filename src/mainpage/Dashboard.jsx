import Card from "./Card.jsx"
import './Dashboard.css'
import {Calendar, Download, Book, CalendarArrowDownIcon, Gauge, TriangleAlert, Wrench, AlertCircle} from 'lucide-react'

import BarChart from '../layout/BarChart.jsx'
import CircleChart from '../layout/CircleChart.jsx'
import ReservationTable from '../layout/ReservationTable.jsx'
import ConflictTable from '../layout/ConflictTable.jsx'
import { useContext } from 'react'
import { UserContext } from '../auth/UserContext.jsx'

// Test Data (for the charts)
const data = [
    { name: '1', value: 65 }, { name: '2', value: 75 }, { name: '3', value: 85 }, 
    { name: '4', value: 45 }, { name: '5', value: 80 }, { name: '6', value: 65 }, 
    { name: '7', value: 35 }, { name: '8', value: 60 }, { name: '9', value: 80 }, 
    { name: '10', value: 70 },
]

const data_circle = [
    { name: 'Advanced Web Lab', value: 45 },
    { name: 'Comp. Graphics', value: 30 },
    { name: 'Research Hub', value: 25 }
]

const reservations = [
    { roomName: "SA 301", section: "BSIT 1A", date: "Aug 31, 2026", time: "10:00 AM", status: "Active" },
    { roomName: "SA 304", section: "BSIT 2B", date: "Aug 31, 2026", time: "1:00 PM", status: "Pending" }
]

const conflicts = [
    { partiesInvolved: "BSIT 3A vs BSIT 2B", conflictType: "Double Booking", severity: "Critical", roomName: "Room 101" }
]


function Dashboard() {
    const { labs } = useContext(UserContext)
    
    // Filter out labs that are currently under maintenance
    const maintenanceLabs = labs.filter(lab => lab.maintenance)

    return (
        <>
            <div className="dashboard-title">
                <div className="dashboard-title-left">
                    <label htmlFor="dashboard-title-text">SYSTEMS STATUS: ONLINE</label>
                    <h1 id="dashboard-title-text">IT Laboratory Overview</h1>
                </div>

                <div className="dashboard-title-right">
                    <button className="dashboard-title-date"> <Calendar size={16}/> {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} </button>
                    <button className="dashboard-title-export"> <Download size={16}/> Export Report</button>
                </div>
            </div>
            
            <div className="dashboard-content">
                <Card className="dashboard-stats dashboard-bookings"> 
                    <div className="dashboard-stats-icon-wrapper icon-book"><Book size={32} color="#00195c"/></div>
                    <div className="dashboard-stats-title-number"><p>Total Bookings</p><h2>1234</h2></div>
                </Card>

                <Card className="dashboard-stats dashboard-reservationsr">
                    <div className="dashboard-stats-icon-wrapper icon-calendar"> <CalendarArrowDownIcon size={32} color="#f5c542"/></div>
                    <div className="dashboard-stats-title-number"><p> Active Reservations </p><h2> 12 </h2></div>
                </Card>

                <Card className="dashboard-stats dashboard-utilization">
                    <div className="dashboard-stats-icon-wrapper icon-gauge"> <Gauge size={32} color="#00195c"/></div>
                    <div className="dashboard-stats-title-number"><p> Lab Utilization </p><h2> 82.4% </h2></div>
                </Card>

                <Card className="dashboard-stats dashboard-alerts"> 
                    <div className="dashboard-stats-icon-wrapper icon-triangle"><TriangleAlert size={32}/></div>
                    <div className="dashboard-stats-title-number"><p> Conflict Alerts </p><h2> 2 </h2></div>
                </Card>

                {/* NEW: MAINTENANCE ALERTS FOR STUDENTS */}
                <Card columns={4} rows={2}>
                    <div className="dashboard-pending-reservation-title">
                        <h3 style={{color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <Wrench size={20} /> Facility Maintenance Alerts
                        </h3>
                    </div>
                    
                    {maintenanceLabs.length === 0 ? (
                        <p style={{color: '#64748b', marginTop: '16px'}}>All laboratories are currently operational.</p>
                    ) : (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', overflowY: 'auto', maxHeight: '150px'}}>
                            {maintenanceLabs.map(lab => (
                                <div key={lab.id} style={{backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'flex-start'}}>
                                    <AlertCircle color="#dc2626" size={20} style={{marginTop: '2px'}}/>
                                    <div>
                                        <h4 style={{margin: 0, color: '#991b1b'}}>{lab.name} is under maintenance</h4>
                                        <p style={{margin: '4px 0 0 0', fontSize: '13px', color: '#b91c1c'}}>
                                            <strong>Reason:</strong> {lab.maintenance_reason || "General maintenance"}
                                        </p>
                                        <p style={{margin: '2px 0 0 0', fontSize: '12px', color: '#b91c1c'}}>
                                            <strong>Expected return:</strong> {lab.maintenance_until ? new Date(lab.maintenance_until).toLocaleDateString() : "TBD"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card columns={3} rows={2}>
                    <h2 className="dashboard-barchart-title"> Weekly Utilization Trends </h2>
                    <BarChart data={data}/>
                </Card>
                
                <Card rows={2}>
                    <CircleChart data={data_circle}/>
                </Card>
                
                <Card columns={4} rows={2}>
                    <div className="dashboard-pending-reservation-title">
                        <h3>Pending Reservation Requests</h3>
                        <a>View All Requests</a>
                    </div>
                    <ReservationTable data={reservations}/>
                </Card>
                
                <Card columns={4} rows={1}>
                    <h3 className="dashboard-conflict-log-title">Critical Conflict Logs</h3>
                    <ConflictTable data={conflicts}/>
                </Card>
            </div>
        </>
    )
}

export default Dashboard