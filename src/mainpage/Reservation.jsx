import { useEffect, useState, useContext } from "react"
import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { enUS } from "date-fns/locale"
import { X } from "lucide-react"
import { UserContext } from "../auth/UserContext.jsx"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "./Reservation.css"

const locales = {
    "en-US": enUS
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales
})

const API_URL = "http://localhost:3000/api/reservation"
const LAB_API_URL = "http://localhost:3000/api/lab"

// Parse a UTC timestamp string as local time (strips the trailing Z)
const parseLocal = (value) => {
    if (!value) return new Date()
    if (value instanceof Date) return value

    const str = String(value)

    if (str.endsWith("Z")) {
        return new Date(str.slice(0, -1))
    }

    return new Date(str)
}

// Check if two dates fall on the same calendar day
const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

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
        status: "pending"
    })

    const fetchLabs = async () => {
        try {
            const response = await fetch(`${LAB_API_URL}/all`, {
                credentials: "include"
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to fetch laboratories"
                )
            }

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

            const response = await fetch(`${API_URL}/all`, {
                credentials: "include"
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to fetch reservations"
                )
            }

            const formattedReservations = data.reservations.map((r) => {
                const start = parseLocal(r.start)
                const end = parseLocal(r.end)

                const lab = labsList.find((l) => l.id === r.room_id)

                const roomName =
                    r.room || lab?.name || `Room ${r.room_id}`

                const userName = r.user || `User ${r.reserved_by}`

                const title = r.title
                    ? `${r.title} — ${userName}`
                    : `${roomName} — ${userName}`

                return {
                    ...r,
                    start,
                    end,
                    title,
                    room: roomName,
                    user: userName
                }
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

    const handleSelectEvent = (reservation) => {
        setSelectedReservation(reservation)
    }

    const handleSelectSlot = ({ start, end }) => {
        const formatDateTime = (date) => {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, "0")
            const day = String(date.getDate()).padStart(2, "0")
            const hours = String(date.getHours()).padStart(2, "0")
            const minutes = String(date.getMinutes()).padStart(2, "0")

            return `${year}-${month}-${day}T${hours}:${minutes}`
        }

        // Force the end time to be on the same day as the start
        // If the user drags across midnight, clamp the end to 23:59 of the start day
        let adjustedEnd = end

        if (!isSameDay(start, end)) {
            adjustedEnd = new Date(start)
            adjustedEnd.setHours(23, 59, 0, 0)
        }

        setForm({
            roomId: "",
            timeStart: formatDateTime(start),
            timeEnd: formatDateTime(adjustedEnd),
            status: "pending"
        })

        setError("")
        setShowAddModal(true)
    }

    const handleChange = (event) => {
        const { name, value } = event.target

        setForm((previous) => {
            const updated = {
                ...previous,
                [name]: value
            }

            // If the user changes the start time, keep end on the same day
            if (name === "timeStart" && value && previous.timeEnd) {
                const newStart = new Date(value)
                const currentEnd = new Date(previous.timeEnd)

                if (!isSameDay(newStart, currentEnd)) {
                    // Auto-fix end to be one hour after start, same day
                    const newEnd = new Date(newStart)
                    newEnd.setHours(newEnd.getHours() + 1)

                    updated.timeEnd = `${newEnd.getFullYear()}-${String(
                        newEnd.getMonth() + 1
                    ).padStart(2, "0")}-${String(newEnd.getDate()).padStart(
                        2,
                        "0"
                    )}T${String(newEnd.getHours()).padStart(2, "0")}:${String(
                        newEnd.getMinutes()
                    ).padStart(2, "0")}`
                }
            }

            // If the user changes the end time, clamp it to the same day as start
            if (name === "timeEnd" && value && previous.timeStart) {
                const startDate = new Date(previous.timeStart)
                const endDate = new Date(value)

                if (!isSameDay(startDate, endDate)) {
                    // Clamp end to 23:59 of the start day
                    const clampedEnd = new Date(startDate)
                    clampedEnd.setHours(23, 59, 0, 0)

                    updated.timeEnd = `${clampedEnd.getFullYear()}-${String(
                        clampedEnd.getMonth() + 1
                    ).padStart(2, "0")}-${String(clampedEnd.getDate()).padStart(
                        2,
                        "0"
                    )}T${String(clampedEnd.getHours()).padStart(2, "0")}:${String(
                        clampedEnd.getMinutes()
                    ).padStart(2, "0")}`
                }
            }

            return updated
        })
    }

    const handleAddReservation = async (event) => {
        event.preventDefault()

        if (!user) {
            setError("You must be logged in to make a reservation")
            return
        }

        if (!form.roomId || !form.timeStart || !form.timeEnd) {
            setError("Please fill in all required fields")
            return
        }

        const start = new Date(form.timeStart)
        const end = new Date(form.timeEnd)

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            setError("Invalid reservation date")
            return
        }

        // === Validation ===

        // 1. Must be same day
        if (!isSameDay(start, end)) {
            setError(
                "Reservations must start and end on the same day. Multi-day bookings are not allowed."
            )
            return
        }

        // 2. End must be after start
        if (start >= end) {
            setError("End time must be after start time")
            return
        }

        // 3. Cannot book in the past
        const now = new Date()
        if (start < now) {
            setError("Cannot create a reservation in the past")
            return
        }

        // 4. Optional: enforce a max duration (e.g., 8 hours)
        const MAX_HOURS = 8
        const durationHours = (end - start) / (1000 * 60 * 60)
        if (durationHours > MAX_HOURS) {
            setError(
                `Reservation cannot exceed ${MAX_HOURS} hours in a single day`
            )
            return
        }

        try {
            setError("")

            const response = await fetch(`${API_URL}/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    roomId: Number(form.roomId),
                    reservedBy: user.id,
                    timeStart: form.timeStart,
                    timeEnd: form.timeEnd,
                    status: form.status
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to add reservation"
                )
            }

            setShowAddModal(false)

            setForm({
                roomId: "",
                timeStart: "",
                timeEnd: "",
                status: "pending"
            })

            await fetchReservations()
        } catch (error) {
            setError(error.message)
        }
    }

    return (
        <div className="reservation-page">
            <div className="reservation-header">
                <div>
                    <h1>Reservations</h1>
                    <p>Manage laboratory reservations</p>
                </div>

                <button
                    className="reservation-add-button"
                    onClick={() => {
                        setError("")

                        setForm({
                            roomId: "",
                            timeStart: "",
                            timeEnd: "",
                            status: "pending"
                        })

                        setShowAddModal(true)
                    }}
                >
                    Add Reservation
                </button>
            </div>

            {error && (
                <div className="reservation-error">
                    {error}
                </div>
            )}

            <div className="reservation-calendar-card">
                {loading ? (
                    <p>Loading reservations...</p>
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
                        min={new Date(1970, 0, 1, 0, 0)}
                        max={new Date(1970, 0, 1, 23, 59)}
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
                                    event.status === "cancelled" ? "#6b7280" :
                                    "#2563eb",
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
                <div
                    className="reservation-modal-overlay"
                    onClick={() => setSelectedReservation(null)}
                >
                    <div
                        className="reservation-modal"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="reservation-modal-header">
                            <h2>Reservation Details</h2>

                            <button
                                type="button"
                                onClick={() => setSelectedReservation(null)}
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="reservation-modal-content">
                            <div className="reservation-detail">
                                <span>Room</span>
                                <strong>
                                    {selectedReservation.room}
                                </strong>
                            </div>

                            <div className="reservation-detail">
                                <span>Reserved By</span>
                                <strong>
                                    {selectedReservation.user}
                                </strong>
                            </div>

                            <div className="reservation-detail">
                                <span>Start</span>
                                <strong>
                                    {format(
                                        selectedReservation.start,
                                        "MMM d, yyyy h:mm a"
                                    )}
                                </strong>
                            </div>

                            <div className="reservation-detail">
                                <span>End</span>
                                <strong>
                                    {format(
                                        selectedReservation.end,
                                        "MMM d, yyyy h:mm a"
                                    )}
                                </strong>
                            </div>

                            <div className="reservation-detail">
                                <span>Status</span>
                                <strong
                                    className={`reservation-status reservation-status-${selectedReservation.status}`}
                                >
                                    {selectedReservation.status}
                                </strong>
                            </div>
                        </div>

                        <div className="reservation-modal-footer">
                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedReservation(null)
                                }
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAddModal && (
                <div
                    className="reservation-modal-overlay"
                    onClick={() => setShowAddModal(false)}
                >
                    <div
                        className="reservation-modal"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="reservation-modal-header">
                            <h2>Add Reservation</h2>

                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleAddReservation}>
                            <div className="reservation-modal-content">
                                <div className="reservation-form-group">
                                    <label htmlFor="roomId">
                                        Laboratory
                                    </label>

                                    <select
                                        id="roomId"
                                        name="roomId"
                                        value={form.roomId}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">
                                            Select laboratory
                                        </option>

                                        {labs.map((lab) => (
                                            <option
                                                key={lab.id}
                                                value={lab.id}
                                            >
                                                {lab.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="reservation-form-group">
                                    <label htmlFor="reservedBy">
                                        Reserved By
                                    </label>

                                    <input
                                        id="reservedBy"
                                        type="text"
                                        value={
                                            user
                                                ? user.name
                                                : "Not logged in"
                                        }
                                        disabled
                                    />
                                </div>

                                <div className="reservation-form-group">
                                    <label htmlFor="timeStart">
                                        Start
                                    </label>

                                    <input
                                        id="timeStart"
                                        name="timeStart"
                                        type="datetime-local"
                                        value={form.timeStart}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="reservation-form-group">
                                    <label htmlFor="timeEnd">
                                        End
                                    </label>

                                    <input
                                        id="timeEnd"
                                        name="timeEnd"
                                        type="datetime-local"
                                        value={form.timeEnd}
                                        min={form.timeStart || undefined}
                                        onChange={handleChange}
                                        required
                                    />
                                    <small>
                                        Must be on the same day as the start time
                                    </small>
                                </div>

                                <div className="reservation-form-group">
                                    <label htmlFor="status">
                                        Status
                                    </label>

                                    <select
                                        id="status"
                                        name="status"
                                        value={form.status}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="pending">
                                            Pending
                                        </option>

                                        <option value="confirmed">
                                            Confirmed
                                        </option>

                                        <option value="rejected">
                                            Rejected
                                        </option>

                                        <option value="cancelled">
                                            Cancelled
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div className="reservation-modal-footer">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    Cancel
                                </button>

                                <button type="submit">
                                    Add Reservation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Reservation