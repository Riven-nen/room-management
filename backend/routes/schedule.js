const express = require("express")
const db = require("../db.js")
const { requireAuth, requireCapability } = require("../middleware/auth.js")

const router = express.Router()
const scheduleWrite = requireCapability("scheduleWrite")

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
    if (!body.room_id && !clean(body.room)) errors.push("Room is required")

    const day = Number(body.day_of_week)
    if (!Number.isInteger(day) || day < 1 || day > 7) errors.push("Day of week must be between 1 (Monday) and 7 (Sunday)")

    if (!isTime(body.start_time)) errors.push("Start time must be in HH:MM format")
    if (!isTime(body.end_time)) errors.push("End time must be in HH:MM format")
    if (isTime(body.start_time) && isTime(body.end_time) && body.end_time <= body.start_time) {
        errors.push("End time must be after start time")
    }

    return errors
}

function validateSemester(body) {
    const errors = []
    const startsOn = clean(body.starts_on)
    const endsOn = clean(body.ends_on)

    if (!clean(body.school_year)) errors.push("School year is required")
    if (!["1st Semester", "2nd Semester", "Summer"].includes(clean(body.term))) errors.push("Invalid term")

    if (startsOn && !isDate(startsOn)) errors.push("Start date must be YYYY-MM-DD")
    if (endsOn && !isDate(endsOn)) errors.push("End date must be YYYY-MM-DD")
    if (isDate(startsOn) && isDate(endsOn) && endsOn < startsOn) {
        errors.push("End date cannot be before the start date")
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

async function resolveRoom(roomId, fallbackLabel, client = db) {
    if (!roomId) return { roomId: null, roomName: clean(fallbackLabel) }

    const { rows } = await client.query("SELECT id, name FROM rooms WHERE id = $1", [roomId])
    if (rows.length === 0) return null
    return { roomId: rows[0].id, roomName: rows[0].name }
}

async function findScheduleConflict({ semesterId, roomId, dayOfWeek, startTime, endTime, excludeId }, client = db) {
    if (!roomId) return null

    const { rows } = await client.query(`
        SELECT id, subject
        FROM semester_schedules
        WHERE semester_id = $1
          AND room_id = $2
          AND day_of_week = $3
          AND start_time < $5::time
          AND end_time > $4::time
          AND ($6::bigint IS NULL OR id <> $6)
        LIMIT 1
    `, [semesterId, roomId, dayOfWeek, startTime, endTime, excludeId || null])

    return rows[0] || null
}

// ---------------------------------------------------------------------------
// Semesters
// ---------------------------------------------------------------------------
router.get("/semesters", requireAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT id, school_year, term, starts_on, ends_on, is_active, created_at
             FROM semesters
             ORDER BY is_active DESC, school_year DESC, term ASC`
        )
        res.json({ semesters: rows })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to load semesters" })
    }
})

router.post("/semesters", requireAuth, scheduleWrite, async (req, res) => {
    const errors = validateSemester(req.body)
    if (errors.length > 0) return res.status(400).json({ message: errors[0], errors })

    const schoolYear = clean(req.body.school_year)
    const term = clean(req.body.term)
    const isActive = Boolean(req.body.is_active)
    const startsOn = clean(req.body.starts_on)
    const endsOn = clean(req.body.ends_on)
    const client = await db.connect()

    try {
        await client.query("BEGIN")

        if (isActive) {
            await client.query("UPDATE semesters SET is_active = false WHERE is_active = true")
        }

        const { rows } = await client.query(
            `INSERT INTO semesters (school_year, term, starts_on, ends_on, is_active, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, school_year, term, starts_on, ends_on, is_active, created_at`,
            [schoolYear, term, startsOn, endsOn, isActive, req.user.id]
        )

        await client.query("COMMIT")
        res.status(201).json({ semester: rows[0] })
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {})
        console.error(error)
        if (error.code === "23505") return res.status(409).json({ message: "That semester already exists" })
        res.status(500).json({ message: "Failed to create semester" })
    } finally {
        client.release()
    }
})

router.put("/semesters/:id", requireAuth, scheduleWrite, async (req, res) => {
    const errors = validateSemester(req.body)
    if (errors.length > 0) return res.status(400).json({ message: errors[0], errors })

    const schoolYear = clean(req.body.school_year)
    const term = clean(req.body.term)
    const isActive = Boolean(req.body.is_active)
    const startsOn = clean(req.body.starts_on)
    const endsOn = clean(req.body.ends_on)
    const client = await db.connect()

    try {
        await client.query("BEGIN")

        if (isActive) {
            await client.query("UPDATE semesters SET is_active = false WHERE is_active = true AND id <> $1", [req.params.id])
        }

        const { rows } = await client.query(
            `UPDATE semesters
             SET school_year = $1, term = $2, starts_on = $3, ends_on = $4, is_active = $5, updated_at = now()
             WHERE id = $6
             RETURNING id, school_year, term, starts_on, ends_on, is_active, created_at`,
            [schoolYear, term, startsOn, endsOn, isActive, req.params.id]
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
        if (error.code === "23505") return res.status(409).json({ message: "That semester already exists" })
        res.status(500).json({ message: "Failed to update semester" })
    } finally {
        client.release()
    }
})

router.delete("/semesters/:id", requireAuth, scheduleWrite, async (req, res) => {
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
                    semesters.term,
                    rooms.name AS room_name
             FROM semester_schedules
             JOIN semesters ON semesters.id = semester_schedules.semester_id
             LEFT JOIN rooms ON rooms.id = semester_schedules.room_id
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

router.get("/instructors", requireAuth, scheduleWrite, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT id, name
             FROM users
             WHERE role = 'faculty' AND is_active = true
             ORDER BY name ASC`
        )
        res.json({ instructors: rows })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to load instructors" })
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

router.post("/semester-schedules", requireAuth, scheduleWrite, async (req, res) => {
    const errors = validateSchedule(req.body)
    if (errors.length > 0) return res.status(400).json({ message: errors[0], errors })

    try {
        const room = await resolveRoom(req.body.room_id, req.body.room)
        if (!room) return res.status(400).json({ message: "Room not found" })

        const day = Number(req.body.day_of_week)
        const conflict = await findScheduleConflict({
            semesterId: req.body.semester_id,
            roomId: room.roomId,
            dayOfWeek: day,
            startTime: req.body.start_time,
            endTime: req.body.end_time
        })

        if (conflict) {
            return res.status(409).json({ message: `That room already has ${conflict.subject} at this time` })
        }

        const { rows } = await db.query(
            `INSERT INTO semester_schedules
                (semester_id, course, year_level, section, subject_code, subject,
                 instructor, day_of_week, start_time, end_time, room, room_id, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING *`,
            [
                req.body.semester_id,
                clean(req.body.course),
                clean(req.body.year_level),
                clean(req.body.section),
                clean(req.body.subject_code),
                clean(req.body.subject),
                clean(req.body.instructor),
                day,
                req.body.start_time,
                req.body.end_time,
                room.roomName,
                room.roomId,
                req.user.id
            ]
        )

        res.status(201).json({ schedule: rows[0] })
    } catch (error) {
        console.error(error)
        if (error.code === "23503") return res.status(400).json({ message: "Semester or room not found" })
        res.status(500).json({ message: "Failed to save the schedule entry" })
    }
})

router.post("/semester-schedules/import", requireAuth, scheduleWrite, async (req, res) => {
    const semesterId = req.body.semester_id
    const entries = Array.isArray(req.body.entries) ? req.body.entries : []

    if (!semesterId) return res.status(400).json({ message: "Semester is required" })
    if (entries.length === 0) return res.status(400).json({ message: "No entries to import" })
    if (entries.length > 1000) return res.status(400).json({ message: "Import up to 1000 entries at a time" })

    const client = await db.connect()

    try {
        await client.query("BEGIN")

        const semester = await client.query("SELECT id FROM semesters WHERE id = $1", [semesterId])
        if (semester.rows.length === 0) {
            await client.query("ROLLBACK")
            return res.status(404).json({ message: "Semester not found" })
        }

        for (const [index, entry] of entries.entries()) {
            const payload = { ...entry, semester_id: semesterId }
            const errors = validateSchedule(payload)

            if (errors.length > 0) {
                await client.query("ROLLBACK")
                return res.status(400).json({ message: `Row ${index + 1}: ${errors[0]}` })
            }

            const room = await resolveRoom(payload.room_id, payload.room, client)
            if (!room) {
                await client.query("ROLLBACK")
                return res.status(400).json({ message: `Row ${index + 1}: room not found` })
            }

            const conflict = await findScheduleConflict({
                semesterId,
                roomId: room.roomId,
                dayOfWeek: Number(payload.day_of_week),
                startTime: payload.start_time,
                endTime: payload.end_time
            }, client)

            if (conflict) {
                await client.query("ROLLBACK")
                return res.status(409).json({ message: `Row ${index + 1}: conflicts with ${conflict.subject}` })
            }

            await client.query(
                `INSERT INTO semester_schedules
                    (semester_id, course, year_level, section, subject_code, subject,
                     instructor, day_of_week, start_time, end_time, room, room_id, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [
                    semesterId,
                    clean(payload.course),
                    clean(payload.year_level),
                    clean(payload.section),
                    clean(payload.subject_code),
                    clean(payload.subject),
                    clean(payload.instructor),
                    Number(payload.day_of_week),
                    payload.start_time,
                    payload.end_time,
                    room.roomName,
                    room.roomId,
                    req.user.id
                ]
            )
        }

        await client.query("COMMIT")
        res.status(201).json({ message: `Imported ${entries.length} schedule entries`, imported: entries.length })
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {})
        console.error(error)
        res.status(500).json({ message: "Failed to import the schedule" })
    } finally {
        client.release()
    }
})

router.put("/semester-schedules/:id", requireAuth, scheduleWrite, async (req, res) => {
    const errors = validateSchedule(req.body)
    if (errors.length > 0) return res.status(400).json({ message: errors[0], errors })

    try {
        const room = await resolveRoom(req.body.room_id, req.body.room)
        if (!room) return res.status(400).json({ message: "Room not found" })

        const day = Number(req.body.day_of_week)
        const conflict = await findScheduleConflict({
            semesterId: req.body.semester_id,
            roomId: room.roomId,
            dayOfWeek: day,
            startTime: req.body.start_time,
            endTime: req.body.end_time,
            excludeId: req.params.id
        })

        if (conflict) {
            return res.status(409).json({ message: `That room already has ${conflict.subject} at this time` })
        }

        const { rows } = await db.query(
            `UPDATE semester_schedules
             SET semester_id = $1, course = $2, year_level = $3, section = $4,
                 subject_code = $5, subject = $6, instructor = $7, day_of_week = $8,
                 start_time = $9, end_time = $10, room = $11, room_id = $12, updated_at = now()
             WHERE id = $13
             RETURNING *`,
            [
                req.body.semester_id,
                clean(req.body.course),
                clean(req.body.year_level),
                clean(req.body.section),
                clean(req.body.subject_code),
                clean(req.body.subject),
                clean(req.body.instructor),
                day,
                req.body.start_time,
                req.body.end_time,
                room.roomName,
                room.roomId,
                req.params.id
            ]
        )

        if (rows.length === 0) return res.status(404).json({ message: "Schedule entry not found" })
        res.json({ schedule: rows[0] })
    } catch (error) {
        console.error(error)
        if (error.code === "23503") return res.status(400).json({ message: "Semester or room not found" })
        res.status(500).json({ message: "Failed to update the schedule entry" })
    }
})

router.delete("/semester-schedules/:id", requireAuth, scheduleWrite, async (req, res) => {
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

router.post("/master-events", requireAuth, scheduleWrite, async (req, res) => {
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

router.put("/master-events/:id", requireAuth, scheduleWrite, async (req, res) => {
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

router.delete("/master-events/:id", requireAuth, scheduleWrite, async (req, res) => {
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
