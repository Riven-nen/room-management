import { useEffect, useState, useContext } from "react"
import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { enUS } from "date-fns/locale"
import { X } from "lucide-react"
import { UserContext } from "../auth/UserContext.jsx"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "./Reservation.css"

const locales = { "en-US": enUS }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

const API_URL = "http://localhost:3000/api/reservation"
const LAB_API_URL = "http://localhost:3000/api/lab"

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

    const [form, setForm] = useState({
        roomId: "",
        timeStart: "",
        timeEnd: "",
        status: "pending",
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
            roomId: "",
            timeStart: formatDateTime(start),
            timeEnd: formatDateTime(adjustedEnd),
            status: "pending",
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
            
            // Handle time adjustments (same as before)
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
        if (start < new Date()) return setError("Cannot create a reservation in the past")

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
                    status: form.status,
                    purpose: form.purpose,
                    participants: Number(form.participants)
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to add reservation")

            setShowAddModal(false)
            setForm({ roomId: "", timeStart: "", timeEnd: "", status: "pending", purpose: "", participants: "" })
            await fetchReservations()
        } catch (error) {
            setError(error.message)
        }
    }

    return (
        <div className="reservation-page">
            <div className="reservation-header">
                <div>
                    <h1>Work Bookings</h1>
                    <p>Manage laboratory work bookings</p>
                </div>
                <button className="reservation-add-button" onClick={() => {
                    setError("")
                    setForm({ roomId: "", timeStart: "", timeEnd: "", status: "pending", purpose: "", participants: "" })
                    setShowAddModal(true)
                }}>
                    Add Work Booking
                </button>
            </div>

            {error && <div className="reservation-error">{error}</div>}

            <div className="reservation-calendar-card">
                {loading ? (
                    <p>Loading bookings...</p>
                ) : (
                    <Calendar
                        localizer={localizer}
                        events={reservations}
                        startAccessor="start"
                        endAccessor="end"
                        titleAccessor="title"
                        defaultView="week"
                        defaultDate={new Date()}
                        views={["week", "day"]}
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
                                    event.status === "confirmed" ? "#16a34a" :
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

            {/* DETAILS MODAL */}
            {selectedReservation && (
                <div className="reservation-modal-overlay" onClick={() => setSelectedReservation(null)}>
                    <div className="reservation-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="reservation-modal-header">
                            <h2>Work Booking Details</h2>
                            <button type="button" onClick={() => setSelectedReservation(null)}><X size={22} /></button>
                        </div>

                        <div className="reservation-modal-content">
                            <div className="reservation-detail">
                                <span>Laboratory</span>
                                <strong>{selectedReservation.room}</strong>
                            </div>
                            <div className="reservation-detail">
                                <span>Reserved By</span>
                                <strong>{selectedReservation.user}</strong>
                            </div>
                            <div className="reservation-detail">
                                <span>Start</span>
                                <strong>{format(selectedReservation.start, "MMM d, yyyy h:mm a")}</strong>
                            </div>
                            <div className="reservation-detail">
                                <span>End</span>
                                <strong>{format(selectedReservation.end, "MMM d, yyyy h:mm a")}</strong>
                            </div>
                            <div className="reservation-detail">
                                <span>Purpose</span>
                                <strong>{selectedReservation.purpose || "N/A"}</strong>
                            </div>
                            <div className="reservation-detail">
                                <span>Participants</span>
                                <strong>{selectedReservation.participants || "N/A"}</strong>
                            </div>
                            <div className="reservation-detail">
                                <span>Status</span>
                                <strong className={`reservation-status reservation-status-${selectedReservation.status}`}>
                                    {selectedReservation.status}
                                </strong>
                            </div>
                        </div>

                        <div className="reservation-modal-footer">
                            <button type="button" onClick={() => setSelectedReservation(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD MODAL */}
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
                                            <option 
                                                key={lab.id} 
                                                value={lab.id}
                                                disabled={lab.maintenance}
                                                style={{color: lab.maintenance ? '#dc2626' : 'inherit'}}
                                            >
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

                                <div className="reservation-form-group">
                                    <label htmlFor="status">Status</label>
                                    <select id="status" name="status" value={form.status} onChange={handleChange} required>
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="rejected">Rejected</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
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