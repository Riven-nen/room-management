/* eslint-disable no-undef */
const express = require("express")
const db = require("../db.js")
const { requireAuth, requireRole } = require("../middleware/auth.js")
const router = express.Router()

const adminOnly = requireRole("admin")
const isTime = (value) => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value)
const isDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
const clean = (value) => (value === undefined || value === null ? null : String(value).trim() || null)

function validateSchedule(body) {
    const errors = []

    if (!body.semester_id) errors.push("Semester is required")
    if (!clean(body.course)) errors.push("Course is required")
    if (!clean(body.year_level)) errors.push("Year level is required")
    if (!clean(body.section)) errors.push("Section is required")
    if (!clean(body.subject)) errors.push("Subject is required")

    const day = Number(body.day_of_week)
    if (!Number.isInteger(day) || day < 1 || day > 7) errors.push("Day of week must be between 1 (Monday) and 7 (Sunday)")

    if (!isTime(body.start_time)) errors.push("Start time must be in HH:MM format")
    if (!isTime(body.end_time)) errors.push("End time must be in HH:MM format")
    if (isTime(body.start_time) && isTime(body.end_time) && body.end_time <= body.start_time) {
        errors.push("End time must be after start time")
    }

    return errors
}

function validateMasterEvent(body) {
    const errors = []
    const types = ["event", "holiday", "exam", "enrollment", "deadline", "other"]

    if (!clean(body.title)) errors.push("Title is required")
    if (!isDate(body.starts_on)) errors.push("Start date must be in YYYY-MM-DD format")
    if (body.ends_on && !isDate(body.ends_on)) errors.push("End date must be in YYYY-MM-DD format")
    if (isDate(body.starts_on) && isDate(body.ends_on) && body.ends_on < body.starts_on) {
        errors.push("End date cannot be before the start date")
    }
    if (body.event_type && !types.includes(body.event_type)) errors.push("Invalid event type")

    const allDay = body.all_day === undefined ? true : Boolean(body.all_day)

    if (!allDay) {
        if (!isTime(body.start_time)) errors.push("Start time is required for a timed event")
        if (body.end_time && !isTime(body.end_time)) errors.push("End time must be in HH:MM format")
        if (isTime(body.start_time) && isTime(body.end_time) && body.end_time <= body.start_time) {
            errors.push("End time must be after start time")
        }
    }

    return errors
}

// ---------------------------------------------------------------------------
// Semesters
// ---------------------------------------------------------------------------
router.get("/semesters", requireAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT id, school_year, term, is_active, created_at
             FROM semesters
             ORDER BY is_active DESC, school_year DESC, term ASC`
        )
        res.json({ semesters: rows })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to load semesters" })
    }
})

router.post("/semesters", requireAuth, adminOnly, async (req, res) => {
    const schoolYear = clean(req.body.school_year)
    const term = clean(req.body.term)
    const isActive = Boolean(req.body.is_active)

    if (!schoolYear || !term) {
        return res.status(400).json({ message: "School year and term are required" })
    }

    if (!["1st Semester", "2nd Semester", "Summer"].includes(term)) {
        return res.status(400).json({ message: "Invalid term" })
    }

    const client = await db.connect()

    try {
        await client.query("BEGIN")

        if (isActive) {
            await client.query("UPDATE semesters SET is_active = false WHERE is_active = true")
        }

        const { rows } = await client.query(
            `INSERT INTO semesters (school_year, term, is_active, created_by)
             VALUES ($1, $2, $3, $4)
             RETURNING id, school_year, term, is_active, created_at`,
            [schoolYear, term, isActive, req.user.id]
        )

        await client.query("COMMIT")
        res.status(201).json({ semester: rows[0] })
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {})
        console.error(error)
        if (error.code === "23505") {
            return res.status(409).json({ message: "That semester already exists" })
        }
        res.status(500).json({ message: "Failed to create semester" })
    } finally {
        client.release()
    }
})

router.put("/semesters/:id", requireAuth, adminOnly, async (req, res) => {
    const schoolYear = clean(req.body.school_year)
    const term = clean(req.body.term)
    const isActive = Boolean(req.body.is_active)

    if (!schoolYear || !term) {
        return res.status(400).json({ message: "School year and term are required" })
    }

    if (!["1st Semester", "2nd Semester", "Summer"].includes(term)) {
        return res.status(400).json({ message: "Invalid term" })
    }

    const client = await db.connect()

    try {
        await client.query("BEGIN")

        if (isActive) {
            await client.query("UPDATE semesters SET is_active = false WHERE is_active = true AND id <> $1", [req.params.id])
        }

        const { rows } = await client.query(
            `UPDATE semesters
             SET school_year = $1, term = $2, is_active = $3, updated_at = now()
             WHERE id = $4
             RETURNING id, school_year, term, is_active, created_at`,
            [schoolYear, term, isActive, req.params.id]
        )

        if (rows.length === 0) {
            await client.query("ROLLBACK")
            return res.status(404).json({ message: "Semester not found" })
        }

        await client.query("COMMIT")
        res.json({ semester: rows[0] })
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {})
        console.error(error)
        if (error.code === "23505") {
            return res.status(409).json({ message: "That semester already exists" })
        }
        res.status(500).json({ message: "Failed to update semester" })
    } finally {
        client.release()
    }
})

router.delete("/semesters/:id", requireAuth, adminOnly, async (req, res) => {
    try {
        const { rowCount } = await db.query("DELETE FROM semesters WHERE id = $1", [req.params.id])
        if (rowCount === 0) return res.status(404).json({ message: "Semester not found" })
        res.json({ message: "Semester deleted" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to delete semester" })
    }
})

// ---------------------------------------------------------------------------
// Semester schedule
// ---------------------------------------------------------------------------
router.get("/semester-schedules", requireAuth, async (req, res) => {
    const { semester_id: semesterId, course, year_level: yearLevel, section, search } = req.query

    const conditions = []
    const values = []

    if (semesterId) {
        values.push(semesterId)
        conditions.push(`semester_schedules.semester_id = $${values.length}`)
    }

    if (course) {
        values.push(course)
        conditions.push(`semester_schedules.course = $${values.length}`)
    }

    if (yearLevel) {
        values.push(yearLevel)
        conditions.push(`semester_schedules.year_level = $${values.length}`)
    }

    if (section) {
        values.push(section)
        conditions.push(`semester_schedules.section = $${values.length}`)
    }

    if (search) {
        values.push(`%${String(search).trim()}%`)
        const index = values.length
        conditions.push(`(
            semester_schedules.subject ILIKE $${index}
            OR semester_schedules.subject_code ILIKE $${index}
            OR semester_schedules.course ILIKE $${index}
            OR semester_schedules.section ILIKE $${index}
            OR semester_schedules.instructor ILIKE $${index}
            OR semester_schedules.room ILIKE $${index}
        )`)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    try {
        const { rows } = await db.query(
            `SELECT semester_schedules.*,
                    semesters.school_year,
                    semesters.term
             FROM semester_schedules
             JOIN semesters ON semesters.id = semester_schedules.semester_id
             ${where}
             ORDER BY semester_schedules.day_of_week ASC,
                      semester_schedules.start_time ASC,
                      semester_schedules.course ASC,
                      semester_schedules.year_level ASC,
                      semester_schedules.section ASC`,
            values
        )

        res.json({ schedules: rows })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to load the semester schedule" })
    }
})

router.get("/filters", requireAuth, async (req, res) => {
    const { semester_id: semesterId } = req.query

    try {
        const semesterClause = semesterId ? "WHERE semester_id = $1" : ""
        const values = semesterId ? [semesterId] : []

        const [courses, yearLevels, sections] = await Promise.all([
            db.query(`SELECT DISTINCT course FROM semester_schedules ${semesterClause} ORDER BY course`, values),
            db.query(`SELECT DISTINCT year_level FROM semester_schedules ${semesterClause} ORDER BY year_level`, values),
            db.query(`SELECT DISTINCT section FROM semester_schedules ${semesterClause} ORDER BY section`, values)
        ])

        res.json({
            courses: courses.rows.map((row) => row.course),
            yearLevels: yearLevels.rows.map((row) => row.year_level),
            sections: sections.rows.map((row) => row.section)
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to load schedule filters" })
    }
})

router.post("/semester-schedules", requireAuth, adminOnly, async (req, res) => {
    const errors = validateSchedule(req.body)
    if (errors.length > 0) return res.status(400).json({ message: errors[0], errors })

    try {
        const { rows } = await db.query(
            `INSERT INTO semester_schedules
                (semester_id, course, year_level, section, subject_code, subject,
                 instructor, day_of_week, start_time, end_time, room, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
            [
                req.body.semester_id,
                clean(req.body.course),
                clean(req.body.year_level),
                clean(req.body.section),
                clean(req.body.subject_code),
                clean(req.body.subject),
                clean(req.body.instructor),
                Number(req.body.day_of_week),
                req.body.start_time,
                req.body.end_time,
                clean(req.body.room),
                req.user.id
            ]
        )

        res.status(201).json({ schedule: rows[0] })
    } catch (error) {
        console.error(error)
        if (error.code === "23503") return res.status(400).json({ message: "Semester not found" })
        res.status(500).json({ message: "Failed to save the schedule entry" })
    }
})

router.put("/semester-schedules/:id", requireAuth, adminOnly, async (req, res) => {
    const errors = validateSchedule(req.body)
    if (errors.length > 0) return res.status(400).json({ message: errors[0], errors })

    try {
        const { rows } = await db.query(
            `UPDATE semester_schedules
             SET semester_id = $1, course = $2, year_level = $3, section = $4,
                 subject_code = $5, subject = $6, instructor = $7, day_of_week = $8,
                 start_time = $9, end_time = $10, room = $11, updated_at = now()
             WHERE id = $12
             RETURNING *`,
            [
                req.body.semester_id,
                clean(req.body.course),
                clean(req.body.year_level),
                clean(req.body.section),
                clean(req.body.subject_code),
                clean(req.body.subject),
                clean(req.body.instructor),
                Number(req.body.day_of_week),
                req.body.start_time,
                req.body.end_time,
                clean(req.body.room),
                req.params.id
            ]
        )

        if (rows.length === 0) return res.status(404).json({ message: "Schedule entry not found" })
        res.json({ schedule: rows[0] })
    } catch (error) {
        console.error(error)
        if (error.code === "23503") return res.status(400).json({ message: "Semester not found" })
        res.status(500).json({ message: "Failed to update the schedule entry" })
    }
})

router.delete("/semester-schedules/:id", requireAuth, adminOnly, async (req, res) => {
    try {
        const { rowCount } = await db.query("DELETE FROM semester_schedules WHERE id = $1", [req.params.id])
        if (rowCount === 0) return res.status(404).json({ message: "Schedule entry not found" })
        res.json({ message: "Schedule entry deleted" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to delete the schedule entry" })
    }
})

// ---------------------------------------------------------------------------
// Master schedule (university calendar)
// ---------------------------------------------------------------------------
router.get("/master-events", requireAuth, async (req, res) => {
    const { from, to } = req.query
    const conditions = []
    const values = []

    if (from) {
        values.push(from)
        conditions.push(`COALESCE(ends_on, starts_on) >= $${values.length}`)
    }

    if (to) {
        values.push(to)
        conditions.push(`starts_on <= $${values.length}`)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    try {
        const { rows } = await db.query(
            `SELECT id, title, description, event_type, starts_on, ends_on, all_day,
                    start_time, end_time, location, created_at
             FROM master_schedule_events
             ${where}
             ORDER BY starts_on ASC, start_time ASC NULLS FIRST`,
            values
        )

        res.json({ events: rows })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to load the university calendar" })
    }
})

router.post("/master-events", requireAuth, adminOnly, async (req, res) => {
    const errors = validateMasterEvent(req.body)
    if (errors.length > 0) return res.status(400).json({ message: errors[0], errors })

    const allDay = req.body.all_day === undefined ? true : Boolean(req.body.all_day)

    try {
        const { rows } = await db.query(
            `INSERT INTO master_schedule_events
                (title, description, event_type, starts_on, ends_on, all_day,
                 start_time, end_time, location, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [
                clean(req.body.title),
                clean(req.body.description),
                req.body.event_type || "event",
                req.body.starts_on,
                clean(req.body.ends_on),
                allDay,
                allDay ? null : req.body.start_time,
                allDay ? null : clean(req.body.end_time),
                clean(req.body.location),
                req.user.id
            ]
        )

        res.status(201).json({ event: rows[0] })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to save the calendar event" })
    }
})

router.put("/master-events/:id", requireAuth, adminOnly, async (req, res) => {
    const errors = validateMasterEvent(req.body)
    if (errors.length > 0) return res.status(400).json({ message: errors[0], errors })

    const allDay = req.body.all_day === undefined ? true : Boolean(req.body.all_day)

    try {
        const { rows } = await db.query(
            `UPDATE master_schedule_events
             SET title = $1, description = $2, event_type = $3, starts_on = $4,
                 ends_on = $5, all_day = $6, start_time = $7, end_time = $8,
                 location = $9, updated_at = now()
             WHERE id = $10
             RETURNING *`,
            [
                clean(req.body.title),
                clean(req.body.description),
                req.body.event_type || "event",
                req.body.starts_on,
                clean(req.body.ends_on),
                allDay,
                allDay ? null : req.body.start_time,
                allDay ? null : clean(req.body.end_time),
                clean(req.body.location),
                req.params.id
            ]
        )

        if (rows.length === 0) return res.status(404).json({ message: "Calendar event not found" })
        res.json({ event: rows[0] })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to update the calendar event" })
    }
})

router.delete("/master-events/:id", requireAuth, adminOnly, async (req, res) => {
    try {
        const { rowCount } = await db.query("DELETE FROM master_schedule_events WHERE id = $1", [req.params.id])
        if (rowCount === 0) return res.status(404).json({ message: "Calendar event not found" })
        res.json({ message: "Calendar event deleted" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to delete the calendar event" })
    }
})

module.exports = router
