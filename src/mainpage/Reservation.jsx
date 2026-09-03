import { useState } from "react"
import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { enUS } from "date-fns/locale"
import { X } from "lucide-react"
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

const reservations = [
    {
        id: "1",
        title: "Computer Laboratory",
        room: "Laboratory 1",
        user: "Dr. Edna Dayao",
        start: new Date("2026-09-03T08:00:00"),
        end: new Date("2026-09-03T10:00:00"),
        status: "Confirmed"
    },
    {
        id: "2",
        title: "Faculty Meeting",
        room: "Conference Room",
        user: "Dr. Mark Santos",
        start: new Date("2026-09-03T10:30:00"),
        end: new Date("2026-09-03T12:00:00"),
        status: "Confirmed"
    },
    {
        id: "3",
        title: "Programming Class",
        room: "Laboratory 2",
        user: "Prof. Ana Cruz",
        start: new Date("2026-09-04T13:00:00"),
        end: new Date("2026-09-04T15:00:00"),
        status: "Pending"
    },
    {
        id: "4",
        title: "Research Presentation",
        room: "Conference Room",
        user: "Dr. John Reyes",
        start: new Date("2026-09-05T09:00:00"),
        end: new Date("2026-09-05T11:00:00"),
        status: "Confirmed"
    }
]

function Reservation() {
    const [selectedReservation, setSelectedReservation] = useState(null)

    const handleSelectEvent = (event) => {
        setSelectedReservation(event)
    }

    return (
        <div className="reservation-page">
            <div className="reservation-header">
                <div>
                    <h1>Reservations</h1>
                    <p>View and manage ongoing reservations</p>
                </div>

                <button className="reservation-add-button">
                    New Reservation
                </button>
            </div>

            <div className="reservation-calendar-card">
                <Calendar
                    localizer={localizer}
                    events={reservations}
                    startAccessor="start"
                    endAccessor="end"
                    titleAccessor="title"
                    defaultView="week"
                    defaultDate={new Date("2026-09-03")}
                    views={["week", "day"]}
                    step={30}
                    timeslots={2}
                    min={new Date("2026-09-03T07:00:00")}
                    max={new Date("2026-09-03T18:00:00")}
                    selectable
                    popup
                    onSelectEvent={handleSelectEvent}
                    style={{ height: 650 }}
                />
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
                            <div>
                                <span>Reservation Details</span>
                                <h2>{selectedReservation.title}</h2>
                            </div>

                            <button
                                onClick={() => setSelectedReservation(null)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="reservation-modal-content">
                            <div className="reservation-detail">
                                <span>Room</span>
                                <strong>{selectedReservation.room}</strong>
                            </div>

                            <div className="reservation-detail">
                                <span>Reserved by</span>
                                <strong>{selectedReservation.user}</strong>
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
                                    className={`status-${selectedReservation.status.toLowerCase()}`}
                                >
                                    {selectedReservation.status}
                                </strong>
                            </div>
                        </div>

                        <div className="reservation-modal-footer">
                            <button
                                className="reservation-close-button"
                                onClick={() => setSelectedReservation(null)}
                            >
                                Close
                            </button>

                            <button className="reservation-edit-button">
                                Edit Reservation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Reservation