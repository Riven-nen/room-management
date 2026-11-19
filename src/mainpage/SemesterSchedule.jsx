/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react"
import { CalendarDays, Search, Clock, MapPin, User, GraduationCap, BookOpen, Printer } from "lucide-react"
import { TableSkeleton } from "../layout/Loading.jsx"
import "./Schedules.css"

const API = ""
const DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const formatTime = (value) => {
    if (!value) return ""
    const [hourText, minuteText] = String(value).split(":")
    const hour = Number(hourText)
    const suffix = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 === 0 ? 12 : hour % 12
    return `${displayHour}:${minuteText} ${suffix}`
}

const semesterLabel = (semester) => `${semester.school_year} · ${semester.term}`

function SemesterSchedule() {
    const [semesters, setSemesters] = useState([])
    const [semesterId, setSemesterId] = useState("")
    const [schedules, setSchedules] = useState([])
    const [filters, setFilters] = useState({ courses: [], yearLevels: [], sections: [] })
    const [course, setCourse] = useState("")
    const [yearLevel, setYearLevel] = useState("")
    const [section, setSection] = useState("")
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const controller = new AbortController()

        const loadSemesters = async () => {
            try {
                const response = await fetch(`${API}/api/schedule/semesters`, {
                    credentials: "include",
                    signal: controller.signal
                })
                const data = await response.json()

                if (!response.ok) throw new Error(data.message || "Failed to load semesters")

                setSemesters(data.semesters)
                const preferred = data.semesters.find(item => item.is_active) || data.semesters[0]
                if (preferred) setSemesterId(String(preferred.id))
            } catch (err) {
                if (err.name !== "AbortError") setError(err.message)
            } finally {
                if (!controller.signal.aborted) setLoading(false)
            }
        }

        loadSemesters()
        return () => controller.abort()
    }, [])

    useEffect(() => {
        if (!semesterId) return

        const controller = new AbortController()

        const loadFilters = async () => {
            try {
                const response = await fetch(`${API}/api/schedule/filters?semester_id=${encodeURIComponent(semesterId)}`, {
                    credentials: "include",
                    signal: controller.signal
                })
                const data = await response.json()
                if (response.ok) setFilters(data)
            } catch (err) {
                if (err.name !== "AbortError") console.error(err)
            }
        }

        loadFilters()
        return () => controller.abort()
    }, [semesterId])

    useEffect(() => {
        if (!semesterId) {
            setSchedules([])
            return
        }

        const controller = new AbortController()
        const params = new URLSearchParams({ semester_id: semesterId })
        if (course) params.set("course", course)
        if (yearLevel) params.set("year_level", yearLevel)
        if (section) params.set("section", section)
        if (search.trim()) params.set("search", search.trim())

        setLoading(true)
        setError("")

        const timer = setTimeout(async () => {
            try {
                const response = await fetch(`${API}/api/schedule/semester-schedules?${params.toString()}`, {
                    credentials: "include",
                    signal: controller.signal
                })
                const data = await response.json()

                if (!response.ok) throw new Error(data.message || "Failed to load the class schedule")
                setSchedules(data.schedules)
            } catch (err) {
                if (err.name !== "AbortError") setError(err.message)
            } finally {
                if (!controller.signal.aborted) setLoading(false)
            }
        }, 220)

        return () => {
            clearTimeout(timer)
            controller.abort()
        }
    }, [semesterId, course, yearLevel, section, search])

    const selectedSemester = semesters.find(item => String(item.id) === String(semesterId))
    const hasFilters = Boolean(course || yearLevel || section || search.trim())

    return (
        <div className="schedule-page">
            <div className="schedule-hero">
                <div>
                    <h1>Class Schedule</h1>
                    <p>
                        Browse the official semester-based schedule. Search by course, section,
                        year level, subject, instructor, or room.
                    </p>
                </div>
                <div className="hero-meta">
                    {selectedSemester && (
                        <span className="hero-chip"><CalendarDays size={14} /> {semesterLabel(selectedSemester)}</span>
                    )}
                    <span className="hero-chip"><BookOpen size={14} /> {schedules.length} class{schedules.length === 1 ? "" : "es"}</span>
                    <button className="ghost-btn" type="button" onClick={() => window.print()}>
                        <Printer size={16} /> Print
                    </button>
                </div>
            </div>

            <div className="schedule-toolbar">
                <div className="schedule-field">
                    <label>Semester</label>
                    <select
                        value={semesterId}
                        onChange={(event) => {
                            setSemesterId(event.target.value)
                            setCourse("")
                            setYearLevel("")
                            setSection("")
                        }}
                    >
                        {semesters.length === 0 && <option value="">No semesters yet</option>}
                        {semesters.map(semester => (
                            <option key={semester.id} value={semester.id}>
                                {semesterLabel(semester)}{semester.is_active ? " (Active)" : ""}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="schedule-field">
                    <label>Course</label>
                    <select value={course} onChange={(event) => setCourse(event.target.value)}>
                        <option value="">All courses</option>
                        {filters.courses.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                </div>

                <div className="schedule-field">
                    <label>Year Level</label>
                    <select value={yearLevel} onChange={(event) => setYearLevel(event.target.value)}>
                        <option value="">All year levels</option>
                        {filters.yearLevels.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                </div>

                <div className="schedule-field">
                    <label>Section</label>
                    <select value={section} onChange={(event) => setSection(event.target.value)}>
                        <option value="">All sections</option>
                        {filters.sections.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                </div>

                <div className="schedule-field grow">
                    <label>Search</label>
                    <div className="search-input-wrapper">
                        <Search size={16} />
                        <input
                            type="search"
                            placeholder="Subject, instructor, or room..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                </div>
            </div>

            {error && <div className="schedule-error">{error}</div>}

            <div className="schedule-card">
                <div className="schedule-card-header">
                    <div>
                        <h2>Semester Timetable</h2>
                        <p>
                            {selectedSemester ? semesterLabel(selectedSemester) : "No semester selected"}
                            {hasFilters ? " · filtered results" : ""}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <TableSkeleton rows={6} columns={6} label="Loading the class schedule" />
                ) : schedules.length === 0 ? (
                    <div className="schedule-empty">
                        <CalendarDays size={34} color="#94a3b8" />
                        <h3>No classes to show</h3>
                        <p>
                            {hasFilters
                                ? "No class matches those filters. Try clearing them."
                                : "The administrator has not published a schedule for this semester yet."}
                        </p>
                    </div>
                ) : (
                    <div className="schedule-table-wrapper">
                        <table className="schedule-table">
                            <thead>
                                <tr>
                                    <th>Day</th>
                                    <th>Time</th>
                                    <th>Subject</th>
                                    <th>Course &amp; Section</th>
                                    <th>Instructor</th>
                                    <th>Room</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedules.map(item => (
                                    <tr key={item.id}>
                                        <td><span className="day-pill">{DAYS[item.day_of_week]}</span></td>
                                        <td>
                                            <span className="time-cell">
                                                <Clock size={14} />
                                                {formatTime(item.start_time)} – {formatTime(item.end_time)}
                                            </span>
                                        </td>
                                        <td>
                                            {item.subject_code && (
                                                <div className="muted">{item.subject_code}</div>
                                            )}
                                            <div className="subject-name">{item.subject}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700 }}>{item.course}</div>
                                            <div className="muted">{item.year_level} · {item.section}</div>
                                        </td>
                                        <td>
                                            <span className="room-cell">
                                                <User size={14} /> {item.instructor || "TBA"}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="room-cell">
                                                <MapPin size={14} /> {item.room_name || item.room || "TBA"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {!loading && schedules.length > 0 && (
                <div className="schedule-card-header" style={{ border: "none", background: "transparent", padding: "0 4px" }}>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                        <GraduationCap size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
                        Showing {schedules.length} class{schedules.length === 1 ? "" : "es"}
                        {selectedSemester ? ` for ${semesterLabel(selectedSemester)}` : ""}.
                    </p>
                </div>
            )}
        </div>
    )
}

export default SemesterSchedule
