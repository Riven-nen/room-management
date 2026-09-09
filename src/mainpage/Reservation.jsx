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

    const fetchReservations = async () => {
        try {
            setLoading(true)
            setError("")

            const response = await fetch(`${API_URL}/all`, {
                credentials: "include"
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch reservations")
            }

            const formattedReservations = data.reservations.map(
                (reservation) => ({
                    ...reservation,
                    start: new Date(reservation.start),
                    end: new Date(reservation.end)
                })
            )

            setReservations(formattedReservations)
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

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
        } catch (error) {
            setError(error.message)
        }
    }

    useEffect(() => {
        fetchReservations()
        fetchLabs()
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

        setForm({
            roomId: "",
            timeStart: formatDateTime(start),
            timeEnd: formatDateTime(end),
            status: "pending"
        })

        setError("")
        setShowAddModal(true)
    }

    const handleChange = (event) => {
        const { name, value } = event.target

        setForm((previous) => ({
            ...previous,
            [name]: value
        }))
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

        if (start >= end) {
            setError("End time must be after start time")
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
                        min={new Date(1970, 0, 1, 7, 0)}
                        max={new Date(1970, 0, 1, 18, 0)}
                        selectable
                        popup
                        onSelectEvent={handleSelectEvent}
                        onSelectSlot={handleSelectSlot}
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
                                        onChange={handleChange}
                                        required
                                    />
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
