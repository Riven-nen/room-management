import Card from "./Card.jsx"
import './Dashboard.css'
import {Calendar, Download, Book, CalendarArrowDownIcon, Gauge, TriangleAlert} from 'lucide-react'

import BarChart from '../layout/BarChart.jsx'
import CircleChart from '../layout/CircleChart.jsx'
import ReservationTable from '../layout/ReservationTable.jsx'
import ConflictTable from '../layout/ConflictTable.jsx'


// Test Data
const data = [
    { name: '1', value: 65 },
    { name: '2', value: 75 },
    { name: '3', value: 85 },
    { name: '4', value: 45 },
    { name: '5', value: 80 },
    { name: '6', value: 65 },
    { name: '7', value: 35 },
    { name: '8', value: 60 },
    { name: '9', value: 80 },
    { name: '10', value: 70 },
]

const data_circle = [
    { name: 'Advanced Web Lab', value: 45 },
    { name: 'Comp. Graphics', value: 30 },
    { name: 'Research Hub', value: 25 }
]

const reservations = [
    {
        roomName: "SA 301",
        section: "BSIT 1A",
        date: "Aug 31, 2026",
        time: "10:00 AM",
        status: "Active"
    },
    {
        roomName: "SA 304",
        section: "BSIT 2B",
        date: "Aug 31, 2026",
        time: "1:00 PM",
        status: "Pending"
    },
    {
        roomName: "SA 305",
        section: "BSCPE 3A",
        date: "Sep 1, 2026",
        time: "9:00 AM",
        status: "Pending"
    }
]

const conflicts = [
    {
        partiesInvolved: "BSIT 3A vs BSIT 2B",
        conflictType: "Double Booking",
        severity: "Critical",
        roomName: "Room 101"
    },
    {
        partiesInvolved: "BSIT 2A vs Section BSIT 4B",
        conflictType: "Schedule Conflict",
        severity: "High",
        roomName: "Room 204"
    }
]


function Dashboard() {
    return (
        <>
            <div className="dashboard-title">
                <div className="dashboard-title-left">
                    <label for="dashboard-title-text">SYSTEMS STATUS: ONLINE</label>
                    <h1 id="dashboard-title-text">IT Laboratory Overview</h1>
                </div>

                <div className="dashboard-title-right">
                    <button className="dashboard-title-date"> <Calendar size={16}/> Feb 21 - Feb 27 2026 </button>
                    <button className="dashboard-title-export"> <Download size={16}/> Export Report</button>
                </div>
            </div>
            <div className="dashboard-content">
                <Card className="dashboard-stats dashboard-bookings"> 
                    <div className="dashboard-stats-icon-wrapper icon-book">
                        <Book size={32} color="#00195c"/>
                    </div>
                    <div className="dashboard-stats-title-number">
                        <p>Total Bookings</p>
                        <h2>1234</h2>
                    </div>
                </Card>

                <Card className="dashboard-stats dashboard-reservationsr">
                    <div className="dashboard-stats-icon-wrapper icon-calendar"> 
                        <CalendarArrowDownIcon size={32} color="#f5c542"/>
                    </div>
                    <div className="dashboard-stats-title-number">
                        <p> Active Reservations </p>
                        <h2> 1234</h2>
                    </div>
                </Card>

                <Card className="dashboard-stats dashboard-utilization">
                    <div className="dashboard-stats-icon-wrapper icon-gauge"> 
                        <Gauge size={32} color="#00195c"/>
                    </div>
                    <div className="dashboard-stats-title-number">
                        <p> Lab Utilization </p>
                        <h2> 12.34% </h2>
                    </div>
                </Card>

                <Card className="dashboard-stats dashboard-alerts"> 
                    <div className="dashboard-stats-icon-wrapper icon-triangle">
                        <TriangleAlert size={32}/>
                    </div>
                    <div className="dashboard-stats-title-number">
                        <p> Conflict Alerts </p>
                        <h2> 1234 </h2>
                    </div>
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
                    <h3 className="dashboard-conflict-log-title">
                        Critical Conflict Logs
                    </h3>
                    <ConflictTable data={conflicts}/>
                </Card>
            </div>

        </>
    )
}

export default Dashboard