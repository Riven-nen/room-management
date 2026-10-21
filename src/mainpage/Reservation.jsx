import { useEffect, useState, useContext } from "react"
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { enUS } from "date-fns/locale"
import { X, Trash2 } from "lucide-react"
import { UserContext } from "../auth/UserContext.jsx"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "./Reservation.css"

const locales = { "en-US": enUS }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

const API_URL = "https://room-management-475x.onrender.com/api/reservation"
const LAB_API_URL = "https://room-management-475x.onrender.com/api/lab"

const pad = (n) => String(n).padStart(2, "0")

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

const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

function Reservation() {
    const { user } = useContext(UserContext)

    const [reservations, setReservations] = useState([])
    const [labs, setLabs] = useState([])
    const [selectedReservation, setSelectedReservation] = useState(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [filterRoom, setFilterRoom] = useState("all")

    const [currentDate, setCurrentDate] = useState(new Date())
    const [currentView, setCurrentView] = useState(Views.WEEK)

    const [form, setForm] = useState({
        roomId: "",
        timeStart: "",
        timeEnd: "",
        purpose: "",
        participants: ""
    })

    const fetchLabs = async () => {
        try {
            const response = await fetch(`${LAB_API_URL}/all`, { credentials: "include" })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to fetch laboratories")
            setLabs(data.labs)
            return data.labs
        } catch (error) {
            setError(error.message)
            return []
        }
    }

    const fetchReservations = async (labsList = labs) => {
        try {
            setLoading(true)
            setError("")
            const response = await fetch(`${API_URL}/all`, { credentials: "include" })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to fetch reservations")

            const formattedReservations = data.reservations.map((r) => {
                const start = parseLocal(r.start)
                const end = parseLocal(r.end)
                const lab = labsList.find((l) => l.id === r.room_id)
                const roomName = r.room || lab?.name || `Room ${r.room_id}`
                const userName = r.user || `User ${r.reserved_by}`
                const title = r.title ? `${r.title} — ${userName}` : `${roomName} — ${userName}`

                return { ...r, start, end, title, room: roomName, user: userName }
            })

            setReservations(formattedReservations)
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const loadData = async () => {
            const labsList = await fetchLabs()
            await fetchReservations(labsList)
        }
        loadData()
    }, [])

    const handleSelectEvent = (reservation) => setSelectedReservation(reservation)

    const handleSelectSlot = ({ start, end }) => {
        const formatDateTime = (date) => {
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
        }

        let adjustedEnd = end
        if (!isSameDay(start, end)) {
            adjustedEnd = new Date(start)
            adjustedEnd.setHours(23, 59, 0, 0)
        }

        setForm({
            roomId: filterRoom !== "all" ? filterRoom : "", 
            timeStart: formatDateTime(start),
            timeEnd: formatDateTime(adjustedEnd),
            purpose: "",
            participants: ""
        })
        setError("")
        setShowAddModal(true)
    }

    const handleChange = (event) => {
        const { name, value } = event.target
        setForm((previous) => {
            const updated = { ...previous, [name]: value }
            
            if (name === "timeStart" && value && previous.timeEnd) {
                const newStart = new Date(value)
                const currentEnd = new Date(previous.timeEnd)
                if (!isSameDay(newStart, currentEnd)) {
                    const newEnd = new Date(newStart)
                    newEnd.setHours(newEnd.getHours() + 1)
                    updated.timeEnd = `${newEnd.getFullYear()}-${pad(newEnd.getMonth() + 1)}-${pad(newEnd.getDate())}T${pad(newEnd.getHours())}:${pad(newEnd.getMinutes())}`
                }
            }
            if (name === "timeEnd" && value && previous.timeStart) {
                const startDate = new Date(previous.timeStart)
                const endDate = new Date(value)
                if (!isSameDay(startDate, endDate)) {
                    const clampedEnd = new Date(startDate)
                    clampedEnd.setHours(23, 59, 0, 0)
                    updated.timeEnd = `${clampedEnd.getFullYear()}-${pad(clampedEnd.getMonth() + 1)}-${pad(clampedEnd.getDate())}T${pad(clampedEnd.getHours())}:${pad(clampedEnd.getMinutes())}`
                }
            }
            return updated
        })
    }

    const handleAddReservation = async (event) => {
        event.preventDefault()
        if (!user) return setError("You must be logged in to make a reservation")
        if (!form.roomId || !form.timeStart || !form.timeEnd || !form.purpose || !form.participants) {
            return setError("Please fill in all required fields")
        }

        const start = new Date(form.timeStart)
        const end = new Date(form.timeEnd)

        if (isNaN(start.getTime()) || isNaN(end.getTime())) return setError("Invalid reservation date")
        if (!isSameDay(start, end)) return setError("Reservations must start and end on the same day.")
        if (start >= end) return setError("End time must be after start time")
        
        // NEW TIME VALIDATION
        const now = new Date()
        if (end <= now) {
            return setError("Cannot create a reservation in the past. The end time has already passed.")
        }
        
        const bufferTime = new Date(now.getTime() - 5 * 60000) 
        if (start < bufferTime) {
            return setError("The start time is too close to the current time or in the past.")
        }

        const startHour = start.getHours() + start.getMinutes() / 60
        const endHour = end.getHours() + end.getMinutes() / 60
        if (startHour < 7 || endHour > 20) return setError("Reservations must be between 7:00 AM and 8:00 PM")

        const durationHours = (end - start) / (1000 * 60 * 60)
        if (durationHours > 8) return setError("Reservation cannot exceed 8 hours in a single day")

        try {
            setError("")
            const response = await fetch(`${API_URL}/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    roomId: Number(form.roomId),
                    reservedBy: user.id,
                    timeStart: form.timeStart,
                    timeEnd: form.timeEnd,
                    status: "pending",
                    purpose: form.purpose,
                    participants: Number(form.participants)
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to add reservation")

            setShowAddModal(false)
            setForm({ roomId: "", timeStart: "", timeEnd: "", purpose: "", participants: "" })
            await fetchReservations()
        } catch (error) {
            setError(error.message)
        }
    }

    const handleCancelBooking = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this booking?")) return

        try {
            const response = await fetch(`${API_URL}/delete`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ id })
            })

            if (response.ok) {
                setSelectedReservation(null)
                await fetchReservations()
            } else {
                const data = await response.json()
                alert(data.error || "Failed to cancel booking")
            }
        } catch (error) {
            console.error(error)
            alert("Network error")
        }
    }

    const filteredEvents = filterRoom === "all" 
        ? reservations 
        : reservations.filter(r => {
            const selectedLab = labs.find(l => String(l.id) === String(filterRoom))
            return selectedLab && String(r.room) === String(selectedLab.name)
        })

    return (
        <div className="reservation-page">
            <div className="reservation-header">
                <div>
                    <h1>Work Bookings</h1>
                    <p>Manage laboratory work bookings</p>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginRight: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '10px', height: '10px', backgroundColor: '#16a34a', borderRadius: '2px' }}></span> Approved
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '10px', height: '10px', backgroundColor: '#f59e0b', borderRadius: '2px' }}></span> Pending
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '10px', height: '10px', backgroundColor: '#dc2626', borderRadius: '2px' }}></span> Rejected
                        </div>
                    </div>

                    <select 
                        value={filterRoom} 
                        onChange={(e) => setFilterRoom(e.target.value)}
                        style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontWeight: 'bold', color: '#00195c', outline: 'none' }}
                    >
                        <option value="all">All Laboratories</option>
                        {labs.map(lab => (
                            <option key={lab.id} value={lab.id}>{lab.name}</option>
                        ))}
                    </select>

                    <button className="reservation-add-button" onClick={() => {
                        setError("")
                        setForm({ roomId: filterRoom !== "all" ? filterRoom : "", timeStart: "", timeEnd: "", purpose: "", participants: "" })
                        setShowAddModal(true)
                    }}>
                        Add Work Booking
                    </button>
                </div>
            </div>

            {error && <div className="reservation-error">{error}</div>}

            <div className="reservation-calendar-card">
                {loading ? (
                    <p>Loading bookings...</p>
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
                        views={["week", "day", "month"]}
                        step={30}
                        timeslots={2}
                        min={new Date(1970, 0, 1, 7, 0)}
                        max={new Date(1970, 0, 1, 20, 0)}
                        selectable
                        popup
                        onSelectEvent={handleSelectEvent}
                        onSelectSlot={handleSelectSlot}
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
                        style={{ height: 650 }}
                    />
                )}
            </div>

            {selectedReservation && (
                <div className="reservation-modal-overlay" onClick={() => setSelectedReservation(null)}>
                    <div className="reservation-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="reservation-modal-header">
                            <h2>Work Booking Details</h2>
                            <button type="button" onClick={() => setSelectedReservation(null)}><X size={22} /></button>
                        </div>

                        <div className="reservation-modal-content">
                            <div className="reservation-detail"><span>Laboratory</span><strong>{selectedReservation.room}</strong></div>
                            <div className="reservation-detail"><span>Reserved By</span><strong>{selectedReservation.user}</strong></div>
                            <div className="reservation-detail"><span>Start</span><strong>{format(selectedReservation.start, "MMM d, yyyy h:mm a")}</strong></div>
                            <div className="reservation-detail"><span>End</span><strong>{format(selectedReservation.end, "MMM d, yyyy h:mm a")}</strong></div>
                            <div className="reservation-detail"><span>Purpose</span><strong>{selectedReservation.purpose || "N/A"}</strong></div>
                            <div className="reservation-detail"><span>Participants</span><strong>{selectedReservation.participants || "N/A"}</strong></div>
                            <div className="reservation-detail">
                                <span>Status</span>
                                <strong className={`reservation-status reservation-status-${selectedReservation.status}`}>
                                    {selectedReservation.status}
                                </strong>
                            </div>
                        </div>

                        <div style={{ display: 'flex', padding: '16px 24px', borderTop: '1px solid #e5e5e5', width: '100%', boxSizing: 'border-box' }}>
                            {(user.role === "admin" || user.name === selectedReservation.user) && (
                                <button 
                                    type="button" 
                                    onClick={() => handleCancelBooking(selectedReservation.id)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    <Trash2 size={18} />
                                    Cancel Booking
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showAddModal && (
                <div className="reservation-modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="reservation-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="reservation-modal-header">
                            <h2>Add Work Booking</h2>
                            <button type="button" onClick={() => setShowAddModal(false)}><X size={22} /></button>
                        </div>

                        <form onSubmit={handleAddReservation}>
                            <div className="reservation-modal-content">
                                <div className="reservation-form-group">
                                    <label htmlFor="roomId">Laboratory</label>
                                    <select id="roomId" name="roomId" value={form.roomId} onChange={handleChange} required>
                                        <option value="">Select laboratory</option>
                                        {labs.map((lab) => (
                                            <option key={lab.id} value={lab.id} disabled={lab.maintenance} style={{color: lab.maintenance ? '#dc2626' : 'inherit'}}>
                                                {lab.name} {lab.maintenance ? "🚫 (Under Maintenance)" : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="reservation-form-group">
                                    <label htmlFor="reservedBy">Reserved By</label>
                                    <input id="reservedBy" type="text" value={user ? user.name : "Not logged in"} disabled />
                                </div>

                                <div className="reservation-form-group">
                                    <label htmlFor="purpose">Purpose of Booking</label>
                                    <input id="purpose" name="purpose" type="text" placeholder="e.g. Capstone Project Meeting" value={form.purpose} onChange={handleChange} required />
                                </div>

                                <div className="reservation-form-group">
                                    <label htmlFor="participants">Number of Participants</label>
                                    <input id="participants" name="participants" type="number" min="1" placeholder="e.g. 5" value={form.participants} onChange={handleChange} required />
                                </div>

                                <div className="reservation-form-group">
                                    <label htmlFor="timeStart">Start</label>
                                    <input id="timeStart" name="timeStart" type="datetime-local" value={form.timeStart} onChange={handleChange} required />
                                </div>

                                <div className="reservation-form-group">
                                    <label htmlFor="timeEnd">End</label>
                                    <input id="timeEnd" name="timeEnd" type="datetime-local" value={form.timeEnd} min={form.timeStart || undefined} onChange={handleChange} required />
                                    <small>Must be on the same day as the start time</small>
                                </div>
                            </div>

                            <div className="reservation-modal-footer">
                                <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit">Add Booking</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Reservation