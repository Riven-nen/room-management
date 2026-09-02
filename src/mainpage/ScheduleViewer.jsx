import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    DoorOpen,
    Users,
    Wifi
} from 'lucide-react'
import Card from './Card.jsx'
import './ScheduleViewer.css'

const schedule = [
    {
        time: '08:00',
        monday: ['AVAILABLE'],
        tuesday: ['COMP 101', 'Dr. Santos'],
        wednesday: ['AVAILABLE'],
        thursday: ['WEB 201', 'Dr. Reyes'],
        friday: ['AVAILABLE'],
        saturday: ['MAINTENANCE']
    },
    {
        time: '09:00',
        monday: ['Reserved', 'BSIT 2A'],
        tuesday: ['COMP 101', 'Dr. Santos'],
        wednesday: ['AVAILABLE'],
        thursday: ['WEB 201', 'Dr. Reyes'],
        friday: ['AVAILABLE'],
        saturday: ['AVAILABLE']
    },
    {
        time: '10:00',
        monday: ['NET 301', 'BSIT 3A'],
        tuesday: ['AVAILABLE'],
        wednesday: ['DATA 201', 'Dr. Cruz'],
        thursday: ['AVAILABLE'],
        friday: ['COMP 101', 'BSIT 2A'],
        saturday: ['AVAILABLE']
    },
    {
        time: '11:00',
        monday: ['NET 301', 'BSIT 3A'],
        tuesday: ['AVAILABLE'],
        wednesday: ['DATA 201', 'Dr. Cruz'],
        thursday: ['AVAILABLE'],
        friday: ['COMP 101', 'BSIT 2A'],
        saturday: ['AVAILABLE']
    }
]

const laboratories = [
    {
        name: 'SA 304',
        status: 'AVAILABLE',
        capacity: '40 workstations',
        equipment: 'Server Ready'
    },
    {
        name: 'MR 211',
        status: 'OCCUPIED',
        capacity: 'Currently COMP 101',
        equipment: 'Ends in 42 mins'
    },
    {
        name: 'MR 204',
        status: 'RESERVED SOON',
        capacity: 'Next Lab Activity',
        equipment: 'Access Code Required'
    }
]

function ScheduleViewer() {
    return (
        <>
            <div className="schedule-viewer-hero">
                <div>
                    <h1>Laboratory Schedule & Availability</h1>
                    <p>Real-time room allocation for St. Augustine and Mo. Rita Buildings.</p>
                </div>
            </div>

            <div className="schedule-viewer-filters">
                <div className="schedule-viewer-filter-group">
                    <span>BUILDING</span>

                    <button className="schedule-viewer-filter-active">All</button>
                    <button>St. Augustine</button>
                    <button>Mo. Rita</button>
                </div>

                <div className="schedule-viewer-filter-divider"></div>

                <div className="schedule-viewer-filter-group">
                    <span>SELECT LAB</span>

                    <select>
                        <option>All Laboratories</option>
                        <option>SA 304</option>
                        <option>MR 211</option>
                        <option>MR 204</option>
                    </select>
                </div>

                <div className="schedule-viewer-legend">
                    <span>AVAILABILITY LEGEND</span>
                    <p><i className="legend-available"></i> Available for Walk-ins</p>
                    <p><i className="legend-occupied"></i> Occupied / Class Ongoing</p>
                    <p><i className="legend-reserved"></i> Reserved Soon</p>
                </div>
            </div>

            <Card className="schedule-viewer-timetable">
                <div className="schedule-viewer-timetable-header">
                    <div>
                        <h2>Weekly Timetable: MR 211 - Multimedia Lab</h2>
                        <p>Building Mr. 211 | Week of Feb 21 - Feb 27, 2026</p>
                    </div>

                    <div className="schedule-viewer-timetable-navigation">
                        <button><ChevronLeft size={16} /></button>
                        <button><ChevronRight size={16} /></button>
                    </div>
                </div>

                <div className="schedule-viewer-table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>TIME</th>
                                <th>MON</th>
                                <th>TUE</th>
                                <th>WED</th>
                                <th>THU</th>
                                <th>FRI</th>
                                <th>SAT</th>
                            </tr>
                        </thead>

                        <tbody>
                            {schedule.map((row) => (
                                <tr key={row.time}>
                                    <td>{row.time}</td>

                                    {[
                                        row.monday,
                                        row.tuesday,
                                        row.wednesday,
                                        row.thursday,
                                        row.friday,
                                        row.saturday
                                    ].map((cell, index) => (
                                        <td key={index}>
                                            <div className={
                                                cell[0] === 'AVAILABLE'
                                                    ? 'schedule-cell schedule-cell-available'
                                                    : cell[0] === 'MAINTENANCE'
                                                        ? 'schedule-cell schedule-cell-maintenance'
                                                        : 'schedule-cell schedule-cell-occupied'
                                            }>
                                                <strong>{cell[0]}</strong>
                                                {cell[1] && <span>{cell[1]}</span>}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
            <div className="schedule-viewer-container">
                <div className="schedule-viewer-status-title">
                    <h2>All Laboratories Status</h2>
                </div>
                <div className="schedule-viewer-status">
                    {laboratories.map((lab) => (
                        <Card className="schedule-viewer-status-card" key={lab.name}>
                            <div className="schedule-viewer-status-card-header">
                                <div>
                                    <span>IT LABORATORY</span>
                                    <h2>{lab.name}</h2>
                                </div>

                                <strong className={`lab-status lab-status-${lab.status.toLowerCase().replace(' ', '-')}`}>
                                    {lab.status}
                                </strong>
                            </div>

                            <p><Users size={14} /> {lab.capacity}</p>
                            <p><Wifi size={14} /> {lab.equipment}</p>

                            <button>View Full Schedule</button>
                        </Card>
                    ))}
                </div>
            </div>

        </>
    )
}

export default ScheduleViewer