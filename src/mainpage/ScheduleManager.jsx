/* eslint-disable react-hooks/set-state-in-effect */
import { useContext, useEffect, useState } from "react"
import Modal from "../layout/Modal.jsx"
import { Plus, Pencil, Trash2, CalendarDays, CalendarRange, Layers, ShieldCheck, Upload } from "lucide-react"
import { UserContext } from "../auth/UserContext.jsx"
import { PageSkeleton } from "../layout/Loading.jsx"
import { notifyScheduleChanged } from "../lib/dataEvents.js"
import "./Schedules.css"

const API = ""

const DAYS = [
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
    { value: 7, label: "Sunday" }
]

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"]
const TERMS = ["1st Semester", "2nd Semester", "Summer"]
const EVENT_TYPES = {
    event: "University Event",
    holiday: "Holiday",
    exam: "Examination",
    enrollment: "Enrollment",
    deadline: "Deadline",
    other: "Other"
}

const emptySemester = { school_year: "", term: "1st Semester", starts_on: "", ends_on: "", is_active: false }
const emptySchedule = {
    semester_id: "",
    course: "",
    year_level: "1st Year",
    section: "",
    subject_code: "",
    subject: "",
    instructor: "",
    day_of_week: 1,
    start_time: "08:00",
    end_time: "09:00",
    room: "",
    room_id: ""
}
const emptyEvent = {
    title: "",
    description: "",
    event_type: "event",
    starts_on: "",
    ends_on: "",
    all_day: true,
    start_time: "08:00",
    end_time: "09:00",
    location: ""
}

const dayLabel = (value) => DAYS.find(day => Number(day.value) === Number(value))?.label || ""
const shortTime = (value) => String(value || "").slice(0, 5)

const DAY_ALIASES = {
    monday: 1, mon: 1,
    tuesday: 2, tue: 2, tues: 2,
    wednesday: 3, wed: 3,
    thursday: 4, thu: 4, thur: 4, thurs: 4,
    friday: 5, fri: 5,
    saturday: 6, sat: 6,
    sunday: 7, sun: 7
}

const CSV_HEADERS = {
    course: "course",
    "year level": "year_level",
    year_level: "year_level",
    year: "year_level",
    section: "section",
    "subject code": "subject_code",
    subject_code: "subject_code",
    subject: "subject",
    instructor: "instructor",
    day: "day_of_week",
    "day of week": "day_of_week",
    day_of_week: "day_of_week",
    start: "start_time",
    "start time": "start_time",
    start_time: "start_time",
    end: "end_time",
    "end time": "end_time",
    end_time: "end_time",
    room: "room",
    "room id": "room_id",
    room_id: "room_id"
}

function parseCsv(text) {
    const rows = []
    let row = []
    let field = ""
    let inQuotes = false

    for (let index = 0; index < text.length; index++) {
        const char = text[index]
        const next = text[index + 1]

        if (inQuotes) {
            if (char === '"' && next === '"') {
                field += '"'
                index++
            } else if (char === '"') {
                inQuotes = false
            } else {
                field += char
            }
        } else if (char === '"') {
            inQuotes = true
        } else if (char === ",") {
            row.push(field.trim())
            field = ""
        } else if (char === "\n") {
            row.push(field.trim())
            rows.push(row)
            row = []
            field = ""
        } else if (char !== "\r") {
            field += char
        }
    }

    if (field.length > 0 || row.length > 0) {
        row.push(field.trim())
        rows.push(row)
    }

    return rows.filter((entry) => entry.some((cell) => cell !== ""))
}

function parseDay(value) {
    const text = String(value || "").trim().toLowerCase()
    if (/^[1-7]$/.test(text)) return Number(text)
    return DAY_ALIASES[text] || null
}

function parseTime(value) {
    const text = String(value || "").trim().toUpperCase()
    const match = text.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/)
    if (!match) return text

    let hour = Number(match[1])
    const minute = match[2]
    const meridiem = match[3]

    if (meridiem === "PM" && hour < 12) hour += 12
    if (meridiem === "AM" && hour === 12) hour = 0

    return `${String(hour).padStart(2, "0")}:${minute}`
}

function ScheduleManager() {
    const { labs } = useContext(UserContext)
    const [tab, setTab] = useState("schedules")
    const [semesters, setSemesters] = useState([])
    const [schedules, setSchedules] = useState([])
    const [events, setEvents] = useState([])
    const [instructors, setInstructors] = useState([])
    const [scheduleFilter, setScheduleFilter] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const [editor, setEditor] = useState(null)
    const [semesterForm, setSemesterForm] = useState(emptySemester)
    const [scheduleForm, setScheduleForm] = useState(emptySchedule)
    const [eventForm, setEventForm] = useState(emptyEvent)
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState("")
    const [showImport, setShowImport] = useState(false)
    const [csvText, setCsvText] = useState("")
    const [importing, setImporting] = useState(false)
    const [importError, setImportError] = useState("")

    const loadData = async () => {
        setError("")
        try {
            const [semestersRes, schedulesRes, eventsRes, instructorsRes] = await Promise.all([
                fetch(`${API}/api/schedule/semesters`, { credentials: "include" }),
                fetch(`${API}/api/schedule/semester-schedules`, { credentials: "include" }),
                fetch(`${API}/api/schedule/master-events`, { credentials: "include" }),
                fetch(`${API}/api/schedule/instructors`, { credentials: "include" })
            ])

            const semestersData = await semestersRes.json()
            const schedulesData = await schedulesRes.json()
            const eventsData = await eventsRes.json()
            const instructorsData = await instructorsRes.json()

            if (!semestersRes.ok) throw new Error(semestersData.message || "Failed to load semesters")
            if (!schedulesRes.ok) throw new Error(schedulesData.message || "Failed to load the schedule")
            if (!eventsRes.ok) throw new Error(eventsData.message || "Failed to load the calendar")
            if (!instructorsRes.ok) throw new Error(instructorsData.message || "Failed to load instructors")

            setSemesters(semestersData.semesters)
            setSchedules(schedulesData.schedules)
            setEvents(eventsData.events)
            setInstructors(instructorsData.instructors)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const defaultSemesterId = () => {
        const active = semesters.find(item => item.is_active) || semesters[0]
        return active ? String(active.id) : ""
    }

    const closeEditor = () => {
        setEditor(null)
        setFormError("")
    }

    const openSemesterEditor = (semester = null) => {
        setSemesterForm(semester
            ? {
                school_year: semester.school_year,
                term: semester.term,
                starts_on: semester.starts_on ? String(semester.starts_on).slice(0, 10) : "",
                ends_on: semester.ends_on ? String(semester.ends_on).slice(0, 10) : "",
                is_active: semester.is_active
            }
            : { ...emptySemester })
        setFormError("")
        setEditor({ type: "semester", id: semester?.id || null })
    }

    const openScheduleEditor = (schedule = null) => {
        setScheduleForm(schedule
            ? {
                semester_id: String(schedule.semester_id),
                course: schedule.course,
                year_level: schedule.year_level,
                section: schedule.section,
                subject_code: schedule.subject_code || "",
                subject: schedule.subject,
                instructor: schedule.instructor || "",
                day_of_week: Number(schedule.day_of_week),
                start_time: shortTime(schedule.start_time),
                end_time: shortTime(schedule.end_time),
                room: schedule.room || "",
                room_id: schedule.room_id ? String(schedule.room_id) : ""
            }
            : { ...emptySchedule, semester_id: defaultSemesterId() })
        setFormError("")
        setEditor({ type: "schedule", id: schedule?.id || null })
    }

    const openEventEditor = (event = null) => {
        setEventForm(event
            ? {
                title: event.title,
                description: event.description || "",
                event_type: event.event_type,
                starts_on: String(event.starts_on).slice(0, 10),
                ends_on: event.ends_on ? String(event.ends_on).slice(0, 10) : "",
                all_day: event.all_day,
                start_time: shortTime(event.start_time) || "08:00",
                end_time: shortTime(event.end_time) || "09:00",
                location: event.location || ""
            }
            : { ...emptyEvent })
        setFormError("")
        setEditor({ type: "event", id: event?.id || null })
    }

    const request = async (url, options) => {
        const response = await fetch(`${API}${url}`, {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            ...options
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || "Something went wrong")
        return data
    }

    const saveSemester = async (event) => {
        event.preventDefault()
        setSaving(true)
        setFormError("")

        try {
            const payload = {
                school_year: semesterForm.school_year,
                term: semesterForm.term,
                starts_on: semesterForm.starts_on || null,
                ends_on: semesterForm.ends_on || null,
                is_active: Boolean(semesterForm.is_active)
            }

            if (editor.id) {
                await request(`/api/schedule/semesters/${editor.id}`, { method: "PUT", body: JSON.stringify(payload) })
            } else {
                await request("/api/schedule/semesters", { method: "POST", body: JSON.stringify(payload) })
            }

            closeEditor()
            await loadData()
            notifyScheduleChanged()
        } catch (err) {
            setFormError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const saveSchedule = async (event) => {
        event.preventDefault()
        setSaving(true)
        setFormError("")

        try {
            const payload = {
                ...scheduleForm,
                semester_id: Number(scheduleForm.semester_id),
                day_of_week: Number(scheduleForm.day_of_week)
            }

            if (editor.id) {
                await request(`/api/schedule/semester-schedules/${editor.id}`, { method: "PUT", body: JSON.stringify(payload) })
            } else {
                await request("/api/schedule/semester-schedules", { method: "POST", body: JSON.stringify(payload) })
            }

            closeEditor()
            await loadData()
            notifyScheduleChanged()
        } catch (err) {
            setFormError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const saveEvent = async (event) => {
        event.preventDefault()
        setSaving(true)
        setFormError("")

        try {
            const payload = {
                ...eventForm,
                all_day: Boolean(eventForm.all_day),
                ends_on: eventForm.ends_on || null,
                start_time: eventForm.all_day ? null : eventForm.start_time,
                end_time: eventForm.all_day ? null : eventForm.end_time
            }

            if (editor.id) {
                await request(`/api/schedule/master-events/${editor.id}`, { method: "PUT", body: JSON.stringify(payload) })
            } else {
                await request("/api/schedule/master-events", { method: "POST", body: JSON.stringify(payload) })
            }

            closeEditor()
            await loadData()
            notifyScheduleChanged()
        } catch (err) {
            setFormError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const importCsv = async () => {
        setImporting(true)
        setImportError("")

        try {
            const semesterId = scheduleFilter || defaultSemesterId()
            if (!semesterId) throw new Error("Select a semester first")

            const rows = parseCsv(csvText)
            if (rows.length < 2) throw new Error("CSV needs a header row and at least one data row")

            const headers = rows[0].map((header) => CSV_HEADERS[header.trim().toLowerCase()] || header.trim().toLowerCase())

            const entries = rows.slice(1).map((row, index) => {
                const item = {}
                headers.forEach((header, column) => {
                    item[header] = row[column] ? row[column].trim() : ""
                })

                const room = labs.find((lab) => (
                    String(lab.id) === String(item.room_id)
                    || String(lab.name).toLowerCase() === String(item.room).toLowerCase()
                ))

                if (!room) throw new Error(`Row ${index + 2}: room not found`)
                if (!item.course || !item.subject || !item.section) {
                    throw new Error(`Row ${index + 2}: course, section, and subject are required`)
                }

                const day = parseDay(item.day_of_week)
                if (!day) throw new Error(`Row ${index + 2}: invalid day`)

                return {
                    semester_id: Number(semesterId),
                    course: item.course,
                    year_level: item.year_level || "1st Year",
                    section: item.section,
                    subject_code: item.subject_code || "",
                    subject: item.subject,
                    instructor: item.instructor || "",
                    day_of_week: day,
                    start_time: parseTime(item.start_time),
                    end_time: parseTime(item.end_time),
                    room_id: room.id,
                    room: room.name
                }
            })

            await request("/api/schedule/semester-schedules/import", {
                method: "POST",
                body: JSON.stringify({ semester_id: Number(semesterId), entries })
            })

            setShowImport(false)
            setCsvText("")
            await loadData()
            notifyScheduleChanged()
        } catch (err) {
            setImportError(err.message)
        } finally {
            setImporting(false)
        }
    }

    const remove = async (type, id, label) => {
        const warnings = {
            semester: "Deleting this semester will also delete all of its class schedule entries.",
            schedule: "",
            event: ""
        }

        const message = `${warnings[type] ? `${warnings[type]}\n\n` : ""}Delete "${label}"? This cannot be undone.`
        if (!window.confirm(message)) return

        const urls = {
            semester: `/api/schedule/semesters/${id}`,
            schedule: `/api/schedule/semester-schedules/${id}`,
            event: `/api/schedule/master-events/${id}`
        }

        try {
            await request(urls[type], { method: "DELETE" })
            await loadData()
            notifyScheduleChanged()
        } catch (err) {
            setError(err.message)
        }
    }

    const filteredSchedules = scheduleFilter
        ? schedules.filter(item => String(item.semester_id) === String(scheduleFilter))
        : schedules

    const semesterName = (id) => {
        const semester = semesters.find(item => String(item.id) === String(id))
        return semester ? `${semester.school_year} · ${semester.term}` : "—"
    }

    if (loading) {
        return <PageSkeleton label="Loading schedules" stats={3} rows={6} columns={7} />
    }

    return (
        <div className="schedule-page">
            <div className="schedule-hero">
                <div>
                    <h1>Manage Schedules</h1>
                    <p>
                        Publish the semester-based class schedule and the university-wide master
                        calendar. Only administrators can create, edit, or delete entries.
                    </p>
                </div>
                <div className="hero-meta">
                    <span className="hero-chip"><ShieldCheck size={14} /> Admin only</span>
                    <span className="hero-chip"><Layers size={14} /> {semesters.length} semester{semesters.length === 1 ? "" : "s"}</span>
                </div>
            </div>

            {error && <div className="schedule-error">{error}</div>}

            <div className="tab-bar">
                <button className={tab === "schedules" ? "active" : ""} onClick={() => setTab("schedules")}>
                    <CalendarDays size={16} /> Class Schedule
                </button>
                <button className={tab === "semesters" ? "active" : ""} onClick={() => setTab("semesters")}>
                    <Layers size={16} /> Semesters
                </button>
                <button className={tab === "calendar" ? "active" : ""} onClick={() => setTab("calendar")}>
                    <CalendarRange size={16} /> University Calendar
                </button>
            </div>

            {tab === "schedules" && (
                <div className="schedule-card">
                    <div className="schedule-card-header">
                        <div>
                            <h2>Class Schedule Entries</h2>
                            <p>{filteredSchedules.length} entr{filteredSchedules.length === 1 ? "y" : "ies"} shown</p>
                        </div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                            <div className="schedule-field" style={{ minWidth: 220 }}>
                                <label>Filter semester</label>
                                <select value={scheduleFilter} onChange={(event) => setScheduleFilter(event.target.value)}>
                                    <option value="">All semesters</option>
                                    {semesters.map(semester => (
                                        <option key={semester.id} value={semester.id}>
                                            {semester.school_year} · {semester.term}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                className="ghost-btn"
                                onClick={() => { setShowImport(true); setImportError("") }}
                                disabled={semesters.length === 0}
                                title={semesters.length === 0 ? "Create a semester first" : ""}
                            >
                                <Upload size={16} /> Import CSV
                            </button>
                            <button
                                className="primary-btn"
                                onClick={() => openScheduleEditor()}
                                disabled={semesters.length === 0}
                                title={semesters.length === 0 ? "Create a semester first" : ""}
                            >
                                <Plus size={16} /> Add Class
                            </button>
                        </div>
                    </div>

                    {semesters.length === 0 ? (
                        <div className="schedule-empty">
                            <Layers size={32} color="#94a3b8" />
                            <h3>Create a semester first</h3>
                            <p>Class schedule entries belong to a semester. Add one in the Semesters tab.</p>
                        </div>
                    ) : filteredSchedules.length === 0 ? (
                        <div className="schedule-empty">
                            <CalendarDays size={32} color="#94a3b8" />
                            <h3>No class entries yet</h3>
                            <p>Use “Add Class” to publish the first entry.</p>
                        </div>
                    ) : (
                        <div className="schedule-table-wrapper">
                            <table className="schedule-table">
                                <thead>
                                    <tr>
                                        <th>Semester</th>
                                        <th>Course</th>
                                        <th>Year &amp; Section</th>
                                        <th>Subject</th>
                                        <th>Schedule</th>
                                        <th>Room</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSchedules.map(item => (
                                        <tr key={item.id}>
                                            <td>{semesterName(item.semester_id)}</td>
                                            <td style={{ fontWeight: 700 }}>{item.course}</td>
                                            <td>{item.year_level}<div className="muted">{item.section}</div></td>
                                            <td>
                                                {item.subject_code && <div className="muted">{item.subject_code}</div>}
                                                <div className="subject-name">{item.subject}</div>
                                                <div className="muted">{item.instructor || "Instructor TBA"}</div>
                                            </td>
                                            <td>
                                                <span className="day-pill">{dayLabel(item.day_of_week)}</span>
                                                <div className="muted">{shortTime(item.start_time)}–{shortTime(item.end_time)}</div>
                                            </td>
                                            <td>{item.room_name || item.room || "TBA"}</td>
                                            <td>
                                                <div className="row-actions">
                                                    <button className="icon-btn" title="Edit" onClick={() => openScheduleEditor(item)}>
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        className="icon-btn danger"
                                                        title="Delete"
                                                        onClick={() => remove("schedule", item.id, `${item.subject} (${item.course} ${item.section})`)}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {tab === "semesters" && (
                <div className="schedule-card">
                    <div className="schedule-card-header">
                        <div>
                            <h2>Semesters</h2>
                            <p>The active semester is the default shown to users.</p>
                        </div>
                        <button className="primary-btn" onClick={() => openSemesterEditor()}>
                            <Plus size={16} /> Add Semester
                        </button>
                    </div>

                    {semesters.length === 0 ? (
                        <div className="schedule-empty">
                            <Layers size={32} color="#94a3b8" />
                            <h3>No semesters yet</h3>
                            <p>Add a school year and term to start building a class schedule.</p>
                        </div>
                    ) : (
                        <div className="schedule-table-wrapper">
                            <table className="schedule-table" style={{ minWidth: 640 }}>
                                <thead>
                                    <tr>
                                        <th>School Year</th>
                                        <th>Term</th>
                                        <th>Status</th>
                                        <th>Class Entries</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {semesters.map(semester => {
                                        const count = schedules.filter(item => item.semester_id === semester.id).length
                                        return (
                                            <tr key={semester.id}>
                                                <td style={{ fontWeight: 700 }}>{semester.school_year}</td>
                                                <td>{semester.term}</td>
                                                <td>
                                                    <span className={`status-badge ${semester.is_active ? "active" : "revoked"}`}>
                                                        {semester.is_active ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                                <td>{count}</td>
                                                <td>
                                                    <div className="row-actions">
                                                        <button className="icon-btn" title="Edit" onClick={() => openSemesterEditor(semester)}>
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button
                                                            className="icon-btn danger"
                                                            title="Delete"
                                                            onClick={() => remove("semester", semester.id, `${semester.school_year} ${semester.term}`)}
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {tab === "calendar" && (
                <div className="schedule-card">
                    <div className="schedule-card-header">
                        <div>
                            <h2>University Calendar</h2>
                            <p>{events.length} event{events.length === 1 ? "" : "s"} on the master schedule.</p>
                        </div>
                        <button className="primary-btn" onClick={() => openEventEditor()}>
                            <Plus size={16} /> Add Event
                        </button>
                    </div>

                    {events.length === 0 ? (
                        <div className="schedule-empty">
                            <CalendarRange size={32} color="#94a3b8" />
                            <h3>No calendar events yet</h3>
                            <p>Add holidays, exams, enrollment periods, and other university dates.</p>
                        </div>
                    ) : (
                        <div className="schedule-table-wrapper">
                            <table className="schedule-table">
                                <thead>
                                    <tr>
                                        <th>Event</th>
                                        <th>Type</th>
                                        <th>Date</th>
                                        <th>Location</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map(event => (
                                        <tr key={event.id}>
                                            <td>
                                                <div className="subject-name">{event.title}</div>
                                                {event.description && <div className="muted">{event.description}</div>}
                                            </td>
                                            <td><span className="day-pill">{EVENT_TYPES[event.event_type] || event.event_type}</span></td>
                                            <td>
                                                {String(event.starts_on).slice(0, 10)}
                                                {event.ends_on && event.ends_on !== event.starts_on ? ` – ${String(event.ends_on).slice(0, 10)}` : ""}
                                                {!event.all_day && event.start_time && (
                                                    <div className="muted">{shortTime(event.start_time)}{event.end_time ? `–${shortTime(event.end_time)}` : ""}</div>
                                                )}
                                            </td>
                                            <td>{event.location || "—"}</td>
                                            <td>
                                                <div className="row-actions">
                                                    <button className="icon-btn" title="Edit" onClick={() => openEventEditor(event)}>
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        className="icon-btn danger"
                                                        title="Delete"
                                                        onClick={() => remove("event", event.id, event.title)}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Semester editor */}
            <Modal isOpen={editor?.type === "semester"} onClose={closeEditor} title={editor?.id ? "Edit Semester" : "Add Semester"}>
                <form className="schedule-form" onSubmit={saveSemester}>
                    {formError && <div className="form-error">{formError}</div>}
                    <div className="form-grid">
                        <div className="form-field">
                            <label>School Year</label>
                            <input
                                required
                                placeholder="2026-2027"
                                value={semesterForm.school_year}
                                onChange={(event) => setSemesterForm(prev => ({ ...prev, school_year: event.target.value }))}
                            />
                        </div>
                        <div className="form-field">
                            <label>Term</label>
                            <select
                                value={semesterForm.term}
                                onChange={(event) => setSemesterForm(prev => ({ ...prev, term: event.target.value }))}
                            >
                                {TERMS.map(term => <option key={term} value={term}>{term}</option>)}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Starts On</label>
                            <input
                                type="date"
                                value={semesterForm.starts_on}
                                onChange={(event) => setSemesterForm(prev => ({ ...prev, starts_on: event.target.value }))}
                            />
                        </div>
                        <div className="form-field">
                            <label>Ends On</label>
                            <input
                                type="date"
                                value={semesterForm.ends_on}
                                onChange={(event) => setSemesterForm(prev => ({ ...prev, ends_on: event.target.value }))}
                            />
                        </div>
                        <div className="form-field full">
                            <label className="checkbox-field" style={{ textTransform: "none", letterSpacing: 0 }}>
                                <input
                                    type="checkbox"
                                    checked={semesterForm.is_active}
                                    onChange={(event) => setSemesterForm(prev => ({ ...prev, is_active: event.target.checked }))}
                                />
                                Set as the active semester
                            </label>
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="ghost-btn" onClick={closeEditor}>Cancel</button>
                        <button type="submit" className="primary-btn" disabled={saving}>{saving ? "Saving..." : "Save Semester"}</button>
                    </div>
                </form>
            </Modal>

            {/* Class schedule editor */}
            <Modal isOpen={editor?.type === "schedule"} onClose={closeEditor} title={editor?.id ? "Edit Class Entry" : "Add Class Entry"}>
                <form className="schedule-form" onSubmit={saveSchedule}>
                    {formError && <div className="form-error">{formError}</div>}
                    <div className="form-grid">
                        <div className="form-field full">
                            <label>Semester</label>
                            <select
                                required
                                value={scheduleForm.semester_id}
                                onChange={(event) => setScheduleForm(prev => ({ ...prev, semester_id: event.target.value }))}
                            >
                                <option value="">Select a semester</option>
                                {semesters.map(semester => (
                                    <option key={semester.id} value={semester.id}>
                                        {semester.school_year} · {semester.term}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Course</label>
                            <input
                                required
                                placeholder="BSIT"
                                value={scheduleForm.course}
                                onChange={(event) => setScheduleForm(prev => ({ ...prev, course: event.target.value }))}
                            />
                        </div>
                        <div className="form-field">
                            <label>Year Level</label>
                            <select
                                value={scheduleForm.year_level}
                                onChange={(event) => setScheduleForm(prev => ({ ...prev, year_level: event.target.value }))}
                            >
                                {YEAR_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Section</label>
                            <input
                                required
                                placeholder="A"
                                value={scheduleForm.section}
                                onChange={(event) => setScheduleForm(prev => ({ ...prev, section: event.target.value }))}
                            />
                        </div>
                        <div className="form-field">
                            <label>Room</label>
                            <select
                                required
                                value={scheduleForm.room_id}
                                onChange={(event) => setScheduleForm(prev => ({ ...prev, room_id: event.target.value }))}
                            >
                                <option value="">Select a laboratory</option>
                                {labs.map((lab) => (
                                    <option key={lab.id} value={lab.id} disabled={lab.maintenance}>
                                        {lab.name}{lab.maintenance ? " (Under Maintenance)" : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Subject Code</label>
                            <input
                                placeholder="IT 101"
                                value={scheduleForm.subject_code}
                                onChange={(event) => setScheduleForm(prev => ({ ...prev, subject_code: event.target.value }))}
                            />
                        </div>
                        <div className="form-field">
                            <label>Subject</label>
                            <input
                                required
                                placeholder="Introduction to Computing"
                                value={scheduleForm.subject}
                                onChange={(event) => setScheduleForm(prev => ({ ...prev, subject: event.target.value }))}
                            />
                        </div>
                        <div className="form-field full">
                            <label>Instructor</label>
                            <select
                                value={scheduleForm.instructor}
                                onChange={(event) => setScheduleForm(prev => ({ ...prev, instructor: event.target.value }))}
                            >
                                <option value="">Unassigned / TBA</option>
                                {scheduleForm.instructor
                                    && !instructors.some((instructor) => instructor.name === scheduleForm.instructor)
                                    && (
                                        <option value={scheduleForm.instructor}>
                                            {scheduleForm.instructor} (not in teacher accounts)
                                        </option>
                                    )}
                                {instructors.map((instructor) => (
                                    <option key={instructor.id} value={instructor.name}>
                                        {instructor.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Day</label>
                            <select
                                value={scheduleForm.day_of_week}
                                onChange={(event) => setScheduleForm(prev => ({ ...prev, day_of_week: Number(event.target.value) }))}
                            >
                                {DAYS.map(day => <option key={day.value} value={day.value}>{day.label}</option>)}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Start Time</label>
                            <input
                                type="time"
                                required
                                value={scheduleForm.start_time}
                                onChange={(event) => setScheduleForm(prev => ({ ...prev, start_time: event.target.value }))}
                            />
                        </div>
                        <div className="form-field">
                            <label>End Time</label>
                            <input
                                type="time"
                                required
                                value={scheduleForm.end_time}
                                onChange={(event) => setScheduleForm(prev => ({ ...prev, end_time: event.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="ghost-btn" onClick={closeEditor}>Cancel</button>
                        <button type="submit" className="primary-btn" disabled={saving}>{saving ? "Saving..." : "Save Class"}</button>
                    </div>
                </form>
            </Modal>

            {/* Calendar event editor */}
            <Modal isOpen={editor?.type === "event"} onClose={closeEditor} title={editor?.id ? "Edit Calendar Event" : "Add Calendar Event"}>
                <form className="schedule-form" onSubmit={saveEvent}>
                    {formError && <div className="form-error">{formError}</div>}
                    <div className="form-grid">
                        <div className="form-field full">
                            <label>Title</label>
                            <input
                                required
                                placeholder="Foundation Day"
                                value={eventForm.title}
                                onChange={(event) => setEventForm(prev => ({ ...prev, title: event.target.value }))}
                            />
                        </div>
                        <div className="form-field">
                            <label>Type</label>
                            <select
                                value={eventForm.event_type}
                                onChange={(event) => setEventForm(prev => ({ ...prev, event_type: event.target.value }))}
                            >
                                {Object.entries(EVENT_TYPES).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Location</label>
                            <input
                                placeholder="Main Auditorium"
                                value={eventForm.location}
                                onChange={(event) => setEventForm(prev => ({ ...prev, location: event.target.value }))}
                            />
                        </div>
                        <div className="form-field">
                            <label>Start Date</label>
                            <input
                                type="date"
                                required
                                value={eventForm.starts_on}
                                onChange={(event) => setEventForm(prev => ({ ...prev, starts_on: event.target.value }))}
                            />
                        </div>
                        <div className="form-field">
                            <label>End Date (optional)</label>
                            <input
                                type="date"
                                value={eventForm.ends_on}
                                onChange={(event) => setEventForm(prev => ({ ...prev, ends_on: event.target.value }))}
                            />
                        </div>
                        <div className="form-field full">
                            <label className="checkbox-field" style={{ textTransform: "none", letterSpacing: 0 }}>
                                <input
                                    type="checkbox"
                                    checked={eventForm.all_day}
                                    onChange={(event) => setEventForm(prev => ({ ...prev, all_day: event.target.checked }))}
                                />
                                All-day event
                            </label>
                        </div>
                        {!eventForm.all_day && (
                            <>
                                <div className="form-field">
                                    <label>Start Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={eventForm.start_time}
                                        onChange={(event) => setEventForm(prev => ({ ...prev, start_time: event.target.value }))}
                                    />
                                </div>
                                <div className="form-field">
                                    <label>End Time</label>
                                    <input
                                        type="time"
                                        value={eventForm.end_time}
                                        onChange={(event) => setEventForm(prev => ({ ...prev, end_time: event.target.value }))}
                                    />
                                </div>
                            </>
                        )}
                        <div className="form-field full">
                            <label>Description</label>
                            <textarea
                                placeholder="Details about this date..."
                                value={eventForm.description}
                                onChange={(event) => setEventForm(prev => ({ ...prev, description: event.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="ghost-btn" onClick={closeEditor}>Cancel</button>
                        <button type="submit" className="primary-btn" disabled={saving}>{saving ? "Saving..." : "Save Event"}</button>
                    </div>
                </form>
            </Modal>

            {/* CSV import */}
            <Modal isOpen={showImport} onClose={() => setShowImport(false)} title="Import Class Schedule (CSV)">
                <div className="schedule-form">
                    {importError && <div className="form-error">{importError}</div>}

                    <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                        Header row: <code>course, year_level, section, subject_code, subject, instructor, day, start_time, end_time, room</code>.
                        Day can be 1–7 or a weekday name. Room can be the laboratory name or id.
                    </p>

                    <div className="form-field">
                        <label>Target Semester</label>
                        <select
                            value={scheduleFilter || defaultSemesterId()}
                            onChange={(event) => setScheduleFilter(event.target.value)}
                        >
                            {semesters.map((semester) => (
                                <option key={semester.id} value={semester.id}>
                                    {semester.school_year} · {semester.term}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field">
                        <label>CSV File</label>
                        <input
                            type="file"
                            accept=".csv,text/csv"
                            onChange={async (event) => {
                                const file = event.target.files?.[0]
                                if (file) setCsvText(await file.text())
                            }}
                        />
                    </div>

                    <div className="form-field">
                        <label>Or paste CSV</label>
                        <textarea
                            style={{ minHeight: 160 }}
                            placeholder={"course,year_level,section,subject_code,subject,instructor,day,start_time,end_time,room\nBSIT,1st Year,A,IT101,Introduction to Computing,Prof. Cruz,Monday,08:00,09:30,Lab 1"}
                            value={csvText}
                            onChange={(event) => setCsvText(event.target.value)}
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="ghost-btn" onClick={() => setShowImport(false)}>Cancel</button>
                        <button type="button" className="primary-btn" onClick={importCsv} disabled={importing || !csvText.trim()}>
                            <Upload size={16} /> {importing ? "Importing..." : "Import Entries"}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default ScheduleManager
