import { useEffect, useState, useContext } from "react"
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { enUS } from "date-fns/locale"
import { UserContext } from "../auth/UserContext.jsx"
import { MapPin, CheckCircle2, XCircle, Wrench, Clock, CalendarClock } from "lucide-react"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "./ScheduleViewer.css"

const locales = { "en-US": enUS }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

const parseLocal = (value) => {
    if (!value) return new Date()
    if (value instanceof Date) {
        return new Date(value.getFullYear(), value.getMonth(), value.getDate(), value.getHours(), value.getMinutes(), 0, 0)
    }
    const str = String(value).trim()
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/)
    if (match) {
        const [, y, mo, d, h, mi, s] = match
        return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s || 0), 0)
    }
    return new Date(str)
}

function ScheduleViewer() {
    const { labs } = useContext(UserContext)
    const [reservations, setReservations] = useState([])
    const [loading, setLoading] = useState(true)
    const [filterRoom, setFilterRoom] = useState("all")
    
    const [currentDate, setCurrentDate] = useState(new Date())
    const [currentView, setCurrentView] = useState(Views.WEEK)

    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const response = await fetch("https://room-management-475x.onrender.com/api/reservation/all", { credentials: "include" })
                const data = await response.json()
                
                if (response.ok) {
                    const formatted = data.reservations.map((r) => {
                        const start = parseLocal(r.start)
                        const end = parseLocal(r.end)
                        return {
                            ...r,
                            start,
                            end,
                            title: `${r.room} — ${r.user}`,
                        }
                    })
                    setReservations(formatted)
                }
            } catch (error) {
                console.error("Failed to load schedule", error)
            } finally {
                setLoading(false)
            }
        }

        fetchReservations()
    }, [])

    // FIXED FILTER LOGIC
    const filteredEvents = filterRoom === "all" 
        ? reservations 
        : reservations.filter(r => {
            const selectedLab = labs.find(l => String(l.id) === String(filterRoom))
            return selectedLab && String(r.room) === String(selectedLab.name)
        })

    const now = new Date()

    const labStatuses = labs.map(lab => {
        if (lab.maintenance) {
            return { ...lab, status: "Maintenance", currentClass: null, nextClass: null }
        }
        
        const currentClass = reservations.find(r => 
            String(r.room) === String(lab.name) && 
            r.status === "approved" && 
            now >= r.start && 
            now <= r.end
        )

        const futureClasses = reservations
            .filter(r => String(r.room) === String(lab.name) && r.status === "approved" && r.start > now)
            .sort((a, b) => a.start - b.start)
            
        const nextClass = futureClasses.length > 0 ? futureClasses[0] : null

        if (currentClass) {
            return { ...lab, status: "Occupied", currentClass, nextClass }
        }

        return { ...lab, status: "Available", currentClass: null, nextClass }
    })

    const formatNextClass = (date) => {
        if (!date) return ""
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        if (date.toDateString() === today.toDateString()) {
            return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        } else {
            return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        }
    }

    return (
        <div className="schedule-viewer-container">
            <div className="schedule-viewer-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Laboratory Schedule Viewer</h1>
                    <p>View real-time availability, live lab status, and weekly schedules.</p>
                </div>

                <select 
                    value={filterRoom} 
                    onChange={(e) => setFilterRoom(e.target.value)}
                    style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontWeight: 'bold', color: '#00195c', outline: 'none', cursor: 'pointer' }}
                >
                    <option value="all">All Laboratories</option>
                    {labs.map(lab => (
                        <option key={lab.id} value={lab.id}>{lab.name}</option>
                    ))}
                </select>
            </div>

            <div style={{ marginTop: '20px' }}>
                <h2 style={{ color: '#00195c', marginBottom: '16px', fontSize: '18px' }}>Live Laboratory Status</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {labStatuses.map(lab => (
                        <div key={lab.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ margin: 0, color: '#00195c' }}>{lab.name}</h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <MapPin size={14} /> {lab.location}
                                    </p>
                                </div>
                                <span style={{
                                    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px',
                                    backgroundColor: lab.status === 'Available' ? '#dcfce7' : lab.status === 'Occupied' ? '#fef2f2' : '#fef3c7',
                                    color: lab.status === 'Available' ? '#166534' : lab.status === 'Occupied' ? '#dc2626' : '#d97706'
                                }}>
                                    {lab.status === 'Available' && <CheckCircle2 size={12} />}
                                    {lab.status === 'Occupied' && <XCircle size={12} />}
                                    {lab.status === 'Maintenance' && <Wrench size={12} />}
                                    {lab.status}
                                </span>
                            </div>

                            {lab.status === 'Occupied' && lab.currentClass ? (
                                <div style={{ backgroundColor: '#fef2f2', padding: '10px', borderRadius: '6px', fontSize: '12px', color: '#b91c1c' }}>
                                    <p style={{ margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={14} /> Currently In Use
                                    </p>
                                    <p style={{ margin: '4px 0 0 0', color: '#dc2626' }}>{lab.currentClass.user}</p>
                                    <p style={{ margin: '2px 0 0 0', color: '#dc2626', opacity: 0.8 }}>{lab.currentClass.purpose || 'Class'}</p>
                                </div>
                            ) : lab.status === 'Maintenance' ? (
                                <div style={{ backgroundColor: '#fffbeb', padding: '10px', borderRadius: '6px', fontSize: '12px', color: '#d97706' }}>
                                    <p style={{ margin: 0, fontWeight: 'bold' }}>Under Maintenance</p>
                                    <p style={{ margin: '4px 0 0 0' }}>{lab.maintenance_reason}</p>
                                    <p style={{ margin: '2px 0 0 0', fontWeight: 'bold' }}>Until: {lab.maintenance_until ? new Date(lab.maintenance_until).toLocaleDateString() : 'TBD'}</p>
                                </div>
                            ) : (
                                <div style={{ backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '6px', fontSize: '12px', color: '#166534' }}>
                                    <p style={{ margin: 0, fontWeight: 'bold' }}>Available for class</p>
                                    <p style={{ margin: '4px 0 0 0' }}>No active bookings right now.</p>
                                </div>
                            )}

                            {lab.nextClass && (
                                <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', fontSize: '12px', color: '#475569', borderTop: '1px solid #e2e8f0' }}>
                                    <p style={{ margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', color: '#00195c' }}>
                                        <CalendarClock size={14} /> Next Booking
                                    </p>
                                    <p style={{ margin: '4px 0 0 0' }}>{formatNextClass(lab.nextClass.start)}</p>
                                    <p style={{ margin: '2px 0 0 0', color: '#64748b' }}>{lab.nextClass.user}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="schedule-viewer-timetable" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ color: '#00195c', margin: 0, fontSize: '18px' }}>Weekly Timetable</h2>
                    
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '12px', height: '12px', backgroundColor: '#16a34a', borderRadius: '3px' }}></span> Approved
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '12px', height: '12px', backgroundColor: '#f59e0b', borderRadius: '3px' }}></span> Pending
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '12px', height: '12px', backgroundColor: '#dc2626', borderRadius: '3px' }}></span> Rejected
                        </div>
                    </div>
                </div>

                {loading ? (
                    <p style={{ padding: '20px' }}>Loading schedule...</p>
                ) : (
                    <Calendar
                        localizer={localizer}
                        events={filteredEvents}
                        startAccessor="start"
                        endAccessor="end"
                        titleAccessor="title"
                        date={currentDate}
                        view={currentView}
                        onNavigate={(newDate) => setCurrentDate(newDate)}
                        onView={(newView) => setCurrentView(newView)}
                        views={["week", "day"]}
                        step={30}
                        timeslots={2}
                        min={new Date(1970, 0, 1, 7, 0)}
                        max={new Date(1970, 0, 1, 20, 0)}
                        popup
                        eventPropGetter={(event) => ({
                            style: {
                                backgroundColor:
                                    event.status === "approved" ? "#16a34a" :
                                    event.status === "pending"   ? "#f59e0b" :
                                    event.status === "rejected"  ? "#dc2626" :
                                    event.status === "cancelled" ? "#6b7280" : "#2563eb",
                                borderRadius: "4px",
                                color: "white",
                                border: "none"
                            }
                        })}
                        style={{ height: 600 }}
                    />
                )}
            </div>
        </div>
    )
}

export default ScheduleViewer