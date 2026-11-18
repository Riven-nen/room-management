import { useEffect, useMemo, useState } from "react"
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { enUS } from "date-fns/locale"
import { CalendarRange, MapPin, Clock, Info } from "lucide-react"
import { CalendarSkeleton, ListSkeleton } from "../layout/Loading.jsx"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "./Schedules.css"

const locales = { "en-US": enUS }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })
const API = import.meta.env.VITE_API_URL

const EVENT_TYPES = {
    event: { label: "University Event", color: "#2563eb" },
    holiday: { label: "Holiday", color: "#dc2626" },
    exam: { label: "Examination", color: "#7c3aed" },
    enrollment: { label: "Enrollment", color: "#0891b2" },
    deadline: { label: "Deadline", color: "#d97706" },
    other: { label: "Other", color: "#64748b" }
}

const toDate = (value) => {
    if (!value) return null
    return new Date(`${String(value).slice(0, 10)}T00:00:00`)
}

const addDays = (date, days) => {
    const next = new Date(date)
    next.setDate(next.getDate() + days)
    return next
}

const withTime = (date, time) => {
    if (!time) return date
    const [hours, minutes] = String(time).split(":").map(Number)
    const next = new Date(date)
    next.setHours(hours, minutes || 0, 0, 0)
    return next
}

const formatDate = (value) => {
    const date = toDate(value)
    return date ? date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : ""
}

const formatEventRange = (event) => {
    const start = formatDate(event.starts_on)
    if (!event.ends_on || event.ends_on === event.starts_on) return start
    return `${start} – ${formatDate(event.ends_on)}`
}

function MasterSchedule() {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [selected, setSelected] = useState(null)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [currentView, setCurrentView] = useState(Views.MONTH)

    useEffect(() => {
        const controller = new AbortController()

        const loadEvents = async () => {
            try {
                const response = await fetch(`${API}/api/schedule/master-events`, {
                    credentials: "include",
                    signal: controller.signal
                })
                const data = await response.json()
                if (!response.ok) throw new Error(data.message || "Failed to load the university calendar")
                setEvents(data.events)
            } catch (err) {
                if (err.name !== "AbortError") setError(err.message)
            } finally {
                if (!controller.signal.aborted) setLoading(false)
            }
        }

        loadEvents()
        return () => controller.abort()
    }, [])

    const calendarEvents = useMemo(() => events.map(event => {
        const startDay = toDate(event.starts_on)
        const endDay = toDate(event.ends_on || event.starts_on) || startDay

        if (event.all_day) {
            return {
                ...event,
                title: event.title,
                start: startDay,
                end: addDays(endDay, 1),
                allDay: true
            }
        }

        const start = withTime(startDay, event.start_time)
        const end = event.end_time
            ? withTime(endDay, event.end_time)
            : new Date(start.getTime() + 60 * 60 * 1000)

        return {
            ...event,
            title: event.title,
            start,
            end,
            allDay: false
        }
    }), [events])

    const upcoming = useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return events
            .filter(event => {
                const end = toDate(event.ends_on || event.starts_on)
                return end && end >= today
            })
            .sort((a, b) => String(a.starts_on).localeCompare(String(b.starts_on)))
            .slice(0, 6)
    }, [events])

    const eventPropGetter = (event) => {
        const meta = EVENT_TYPES[event.event_type] || EVENT_TYPES.other
        return {
            style: {
                backgroundColor: meta.color,
                border: "none",
                color: "#ffffff"
            }
        }
    }

    return (
        <div className="schedule-page">
            <div className="schedule-hero">
                <div>
                    <h1>University Calendar</h1>
                    <p>
                        The official master schedule for the whole university: school events,
                        holidays, examinations, enrollment periods, and deadlines.
                    </p>
                </div>
                <div className="hero-meta">
                    <span className="hero-chip"><CalendarRange size={14} /> {events.length} event{events.length === 1 ? "" : "s"}</span>
                    {upcoming[0] && (
                        <span className="hero-chip"><Clock size={14} /> Next: {formatDate(upcoming[0].starts_on)}</span>
                    )}
                </div>
            </div>

            {error && <div className="schedule-error">{error}</div>}

            <div className="master-grid">
                <div className="calendar-shell">
                    {loading ? (
                        <CalendarSkeleton label="Loading the university calendar" />
                    ) : (
                        <>
                            <Calendar
                                localizer={localizer}
                                events={calendarEvents}
                                startAccessor="start"
                                endAccessor="end"
                                titleAccessor="title"
                                date={currentDate}
                                view={currentView}
                                onNavigate={setCurrentDate}
                                onView={setCurrentView}
                                views={[Views.MONTH, Views.AGENDA]}
                                popup
                                onSelectEvent={setSelected}
                                eventPropGetter={eventPropGetter}
                                style={{ height: 620 }}
                            />
                            <div className="calendar-legend">
                                {Object.entries(EVENT_TYPES).map(([key, meta]) => (
                                    <span key={key}>
                                        <span className="legend-dot" style={{ backgroundColor: meta.color }}></span>
                                        {meta.label}
                                    </span>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {selected && (
                        <div className="schedule-card">
                            <div className="schedule-card-header">
                                <div>
                                    <h2>{selected.title}</h2>
                                    <p>{EVENT_TYPES[selected.event_type]?.label || "Event"}</p>
                                </div>
                                <button className="icon-btn" onClick={() => setSelected(null)} aria-label="Close details">
                                    <Info size={16} />
                                </button>
                            </div>
                            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10, fontSize: 13.5, color: "#334155" }}>
                                <span><Clock size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />{formatEventRange(selected)}{!selected.all_day && selected.start_time ? ` · ${String(selected.start_time).slice(0, 5)}${selected.end_time ? `–${String(selected.end_time).slice(0, 5)}` : ""}` : ""}</span>
                                {selected.location && (
                                    <span><MapPin size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />{selected.location}</span>
                                )}
                                {selected.description && (
                                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.5 }}>{selected.description}</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="schedule-card">
                        <div className="schedule-card-header">
                            <div>
                                <h2>Upcoming</h2>
                                <p>The next dates on the university calendar.</p>
                            </div>
                        </div>
                        <div style={{ padding: 16 }}>
                            {loading ? (
                                <ListSkeleton items={3} label="Loading upcoming events" />
                            ) : upcoming.length === 0 ? (
                                <div className="schedule-empty" style={{ padding: "24px 8px" }}>
                                    <CalendarRange size={28} color="#94a3b8" />
                                    <h3>No upcoming events</h3>
                                    <p>New calendar entries will appear here.</p>
                                </div>
                            ) : (
                                <div className="upcoming-list">
                                    {upcoming.map(event => {
                                        const date = toDate(event.starts_on)
                                        return (
                                            <button
                                                key={event.id}
                                                type="button"
                                                className="upcoming-item"
                                                onClick={() => setSelected(event)}
                                                style={{ cursor: "pointer", textAlign: "left", width: "100%" }}
                                            >
                                                <div className="upcoming-date">
                                                    <span style={{ fontSize: 18 }}>{date.getDate()}</span>
                                                    <small>{date.toLocaleDateString(undefined, { month: "short" })}</small>
                                                </div>
                                                <div className="upcoming-body">
                                                    <h4>{event.title}</h4>
                                                    <p>{EVENT_TYPES[event.event_type]?.label || "Event"}{event.location ? ` · ${event.location}` : ""}</p>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MasterSchedule
