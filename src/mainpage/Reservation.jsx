/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useContext } from "react"
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { enUS } from "date-fns/locale"
import { X, Trash2 } from "lucide-react"
import { UserContext } from "../auth/UserContext.jsx"
import { normalizeRole } from "../auth/roles.js"
import { formatClassBlocks } from "../lib/classBlocks.js"
import { notifyBookingsChanged, notifyScheduleChanged, subscribeToDataChanges } from "../lib/dataEvents.js"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { CalendarSkeleton } from "../layout/Loading.jsx"
import "./Reservation.css"

const locales = { "en-US": enUS }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

const API_URL = `/api/reservation`
const LAB_API_URL = `/api/lab`

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
    const [formError, setFormError] = useState("")
    const [notice, setNotice] = useState("")
    const [classBlocks, setClassBlocks] = useState([])
    const [selectedClass, setSelectedClass] = useState(null)
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
            setClassBlocks(formatClassBlocks(data.classBlocks || []))
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

    useEffect(() => {
        return subscribeToDataChanges(["schedule:changed", "bookings:changed"], () => {
            fetchReservations()
        })
    }, [labs])

    const handleSelectEvent = (event) => {
        if (event.isClass) {
            setSelectedReservation(null)
            setSelectedClass(event)
            return
        }

        setSelectedClass(null)
        setSelectedReservation(event)
    }

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
        setFormError("")
        setNotice("")
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

    const closeAddModal = () => {
        setShowAddModal(false)
        setFormError("")
    }

    const handleAddReservation = async (event) => {
        event.preventDefault()
        setFormError("")
        setNotice("")
        setError("")

        if (!user) return setFormError("You must be logged in to make a reservation")
        if (!form.roomId || !form.timeStart || !form.timeEnd || !form.purpose || !form.participants) {
            return setFormError("Please fill in all required fields")
        }

        const start = new Date(form.timeStart)
        const end = new Date(form.timeEnd)

        if (isNaN(start.getTime()) || isNaN(end.getTime())) return setFormError("Invalid reservation date")
        if (!isSameDay(start, end)) return setFormError("Reservations must start and end on the same day.")
        if (start >= end) return setFormError("End time must be after start time")
        
        // NEW TIME VALIDATION
        const now = new Date()
        if (end <= now) {
            return setFormError("Cannot create a reservation in the past. The end time has already passed.")
        }
        
        const bufferTime = new Date(now.getTime() - 5 * 60000) 
        if (start < bufferTime) {
            return setFormError("The start time is too close to the current time or in the past.")
        }

        const startHour = start.getHours() + start.getMinutes() / 60
        const endHour = end.getHours() + end.getMinutes() / 60
        if (startHour < 7 || endHour > 20) return setFormError("Reservations must be between 7:00 AM and 8:00 PM")

        const durationHours = (end - start) / (1000 * 60 * 60)
        if (durationHours > 8) return setFormError("Reservation cannot exceed 8 hours in a single day")

        try {
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
            setNotice("Reservation submitted. It is pending until a coordinator approves it.")
            await fetchReservations()
            notifyBookingsChanged()
        } catch (error) {
            setFormError(error.message)
        }
    }

    const handleCancelBooking = async (id) => {
        if (!window.confirm("Cancel this reservation? This will free the room for that time.")) return

        try {
            const response = await fetch(`${API_URL}/delete`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ id })
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to cancel reservation")

            setSelectedReservation(null)
            setNotice("Reservation canceled. The room is now available for that time.")
            await fetchReservations()
            notifyBookingsChanged()
        } catch (error) {
            setError(error.message)
        }
    }

    const canCancelClass = (block) => {
        if (!user || !block) return false
        const role = normalizeRole(user.role)
        if (role === "admin" || role === "mis_staff") return true
        if (block.instructor_id && String(block.instructor_id) === String(user.id)) return true
        return String(block.instructor || "").trim().toLowerCase() === String(user.name || "").trim().toLowerCase()
    }

    const handleCancelClassDate = async (block) => {
        const dateValue = block.date || format(block.start, "yyyy-MM-dd")
        const dateLabel = format(block.start, "MMM d, yyyy")
        const reason = window.prompt(
            `Cancel ${block.subject} on ${dateLabel}?\n\nThe room will open for booking on that date.\n\nReason (optional):`,
            "Instructor leave"
        )

        if (reason === null) return

        try {
            setError("")
            const response = await fetch(`/api/schedule/semester-schedules/${block.schedule_id}/cancel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ date: dateValue, reason })
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.message || "Failed to cancel the class date")

            setSelectedClass(null)
            setNotice(`Class canceled on ${dateLabel}. The room is now available for booking.`)
            await fetchReservations()
            notifyScheduleChanged()
        } catch (error) {
            setError(error.message)
        }
    }

    const allEvents = [...reservations, ...classBlocks]
    const filteredEvents = filterRoom === "all"
        ? allEvents
        : allEvents.filter(r => {
            const selectedLab = labs.find(l => String(l.id) === String(filterRoom))
            return selectedLab && String(r.room) === String(selectedLab.name)
        })

    return (
        <div className="reservation-page">
            <div className="reservation-header">
                <div>
                    <h1>Lab Reservations</h1>
                    <p>Reserve laboratory space for classes, meetings, or project work.</p>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '10px', height: '10px', backgroundColor: '#0d3a8f', border: '2px solid #f5c542', borderRadius: '2px' }}></span> Class Schedule
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
                        setFormError("")
                        setNotice("")
                        setForm({ roomId: filterRoom !== "all" ? filterRoom : "", timeStart: "", timeEnd: "", purpose: "", participants: "" })
                        setShowAddModal(true)
                    }}>
                        Add Lab Reservation
                    </button>
                </div>
            </div>

            {notice && <div className="reservation-success">{notice}</div>}
            {error && <div className="reservation-error">{error}</div>}

            <p className="reservation-hint">
                Class Schedule blocks only appear within each semester’s start and end dates.
            </p>

            <div className="reservation-calendar-card">
                {loading ? (
                    <CalendarSkeleton label="Loading bookings" />
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
                                backgroundColor: event.isClass
                                    ? "#0d3a8f"
                                    : event.status === "approved" ? "#16a34a" :
                                      event.status === "pending"   ? "#f59e0b" :
                                      event.status === "rejected"  ? "#dc2626" :
                                      event.status === "cancelled" ? "#6b7280" : "#2563eb",
                                borderRadius: "4px",
                                color: "white",
                                border: event.isClass ? "2px solid #f5c542" : "none"
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
                            <h2>Lab Reservation Details</h2>
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
                            {(["admin", "mis_staff"].includes(normalizeRole(user.role)) || user.name === selectedReservation.user) && (
                                <button 
                                    type="button" 
                                    onClick={() => handleCancelBooking(selectedReservation.id)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    <Trash2 size={18} />
                                    Cancel Reservation
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {selectedClass && (
                <div className="reservation-modal-overlay" onClick={() => setSelectedClass(null)}>
                    <div className="reservation-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="reservation-modal-header">
                            <h2>Scheduled Class</h2>
                            <button type="button" onClick={() => setSelectedClass(null)}><X size={22} /></button>
                        </div>

                        <div className="reservation-modal-content">
                            <div className="reservation-detail"><span>Subject</span><strong>{selectedClass.subject}</strong></div>
                            <div className="reservation-detail"><span>Course / Section</span><strong>{selectedClass.course} · {selectedClass.year_level} · {selectedClass.section}</strong></div>
                            {(selectedClass.school_year || selectedClass.term) && (
                                <div className="reservation-detail"><span>Semester</span><strong>{selectedClass.school_year} · {selectedClass.term}</strong></div>
                            )}
                            <div className="reservation-detail"><span>Instructor</span><strong>{selectedClass.instructor || "TBA"}</strong></div>
                            <div className="reservation-detail"><span>Room</span><strong>{selectedClass.room || "TBA"}</strong></div>
                            <div className="reservation-detail"><span>Date</span><strong>{format(selectedClass.start, "MMM d, yyyy")}</strong></div>
                            <div className="reservation-detail"><span>Time</span><strong>{format(selectedClass.start, "h:mm a")} – {format(selectedClass.end, "h:mm a")}</strong></div>
                            <p className="reservation-class-note">
                                This is a semester class schedule block, not a reservation. Choose another time to book, or cancel this class date if you are the assigned instructor.
                            </p>
                        </div>

                        {canCancelClass(selectedClass) && (
                            <div className="reservation-modal-footer">
                                <button
                                    type="button"
                                    className="reservation-cancel-class"
                                    onClick={() => handleCancelClassDate(selectedClass)}
                                >
                                    <Trash2 size={16} /> Cancel This Class Date
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showAddModal && (
                <div className="reservation-modal-overlay" onClick={closeAddModal}>
                    <div className="reservation-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="reservation-modal-header">
                            <h2>Add Lab Reservation</h2>
                            <button type="button" onClick={closeAddModal}><X size={22} /></button>
                        </div>

                        <form onSubmit={handleAddReservation}>
                            <div className="reservation-modal-content">
                                {formError && <div className="reservation-form-error">{formError}</div>}

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
                                    <label htmlFor="purpose">Purpose of Reservation</label>
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
                                <button type="button" onClick={closeAddModal}>Cancel</button>
                                <button type="submit">Add Reservation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Reservation