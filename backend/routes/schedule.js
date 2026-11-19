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
    if (!roomId) return { roomId: null, roomName: clean(fallbackLabel), maintenance: false }

    const { rows } = await client.query("SELECT id, name, maintenance FROM rooms WHERE id = $1", [roomId])
    if (rows.length === 0) return null
    return { roomId: rows[0].id, roomName: rows[0].name, maintenance: rows[0].maintenance }
}

async function getSemesterDates(semesterId, client = db) {
    const { rows } = await client.query(
        "SELECT starts_on, ends_on FROM semesters WHERE id = $1",
        [semesterId]
    )
    return rows[0] || null
}

async function resolveInstructor(instructorId, instructorName, client = db) {
    if (instructorId) {
        const { rows } = await client.query(
            "SELECT id, name FROM users WHERE id = $1 AND role = 'faculty' AND is_active = true",
            [instructorId]
        )
        if (rows.length > 0) return { id: rows[0].id, name: rows[0].name }
    }

    const name = clean(instructorName)
    if (name) {
        const { rows } = await client.query(
            "SELECT id, name FROM users WHERE role = 'faculty' AND is_active = true AND lower(name) = lower($1) LIMIT 1",
            [name]
        )
        if (rows.length > 0) return { id: rows[0].id, name: rows[0].name }
    }

    return { id: null, name }
}

async function getScheduleForCancellation(id) {
    const { rows } = await db.query(`
        SELECT ss.id, ss.day_of_week, ss.instructor, ss.instructor_id,
               s.starts_on, s.ends_on
        FROM semester_schedules ss
        JOIN semesters s ON s.id = ss.semester_id
        WHERE ss.id = $1
    `, [id])

    return rows[0] || null
}

function canCancelSchedule(schedule, user) {
    if (["admin", "mis_staff"].includes(user.role)) return true
    if (schedule.instructor_id && String(schedule.instructor_id) === String(user.id)) return true
    return String(schedule.instructor || "").trim().toLowerCase() === String(user.name || "").trim().toLowerCase()
}

const normalizeText = (value) => String(value || "").trim().toLowerCase()

function sameSection(row, course, yearLevel, section) {
    return normalizeText(row.course) === normalizeText(course)
        && normalizeText(row.year_level) === normalizeText(yearLevel)
        && normalizeText(row.section) === normalizeText(section)
}

async function findScheduleConflict({
    semesterId,
    roomId,
    instructorId,
    instructorName,
    course,
    yearLevel,
    section,
    dayOfWeek,
    startTime,
    endTime,
    excludeId
}, client = db) {
    const { rows } = await client.query(`
        SELECT id, subject, room_id, instructor, instructor_id, course, year_level, section
        FROM semester_schedules
        WHERE semester_id = $1
          AND day_of_week = $2
          AND start_time < $4::time
          AND end_time > $3::time
          AND ($5::bigint IS NULL OR id <> $5)
    `, [semesterId, dayOfWeek, startTime, endTime, excludeId || null])

    for (const row of rows) {
        if (roomId && String(row.room_id) === String(roomId)) {
            return { type: "room", ...row }
        }

        const rowName = normalizeText(row.instructor)
        const newName = normalizeText(instructorName)
        const instructorMatches = instructorId && row.instructor_id
            ? String(instructorId) === String(row.instructor_id)
            : Boolean(rowName && newName && rowName === newName)

        if (instructorMatches) {
            return { type: "instructor", ...row }
        }

        if (sameSection(row, course, yearLevel, section)) {
            return { type: "section", ...row }
        }
    }

    return null
}

function scheduleConflictMessage(conflict, { instructorName, course, yearLevel, section }) {
    if (conflict.type === "room") {
        return `That room already has ${conflict.subject} at this time`
    }
    if (conflict.type === "instructor") {
        return `${instructorName || "That instructor"} is already teaching ${conflict.subject} at this time`
    }
    return `${course} ${yearLevel} ${section} already has ${conflict.subject} at this time`
}

async function findReservationConflict({ roomId, dayOfWeek, startTime, endTime, startsOn, endsOn }, client = db) {
    if (!roomId || !startsOn || !endsOn) return null

    const { rows } = await client.query(`
        SELECT id, time_start, time_end, purpose
        FROM reservations
        WHERE room_id = $1
          AND status NOT IN ('rejected', 'cancelled')
          AND extract(isodow FROM time_start) = $2
          AND time_start::time < $4::time
          AND time_end::time > $3::time
          AND time_start::date >= GREATEST($5::date, CURRENT_DATE)
          AND time_start::date <= $6::date
        ORDER BY time_start ASC
        LIMIT 1
    `, [roomId, dayOfWeek, startTime, endTime, startsOn, endsOn])

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

router.get("/class-blocks", requireAuth, async (req, res) => {
    const { from, to } = req.query

    if (from && !isDate(from)) return res.status(400).json({ message: "Invalid from date" })
    if (to && !isDate(to)) return res.status(400).json({ message: "Invalid to date" })

    try {
        const { rows } = await db.query(`
            SELECT ss.id AS schedule_id,
                   d::date AS date,
                   ss.start_time,
                   ss.end_time,
                   ss.room_id,
                   rooms.name AS room_name,
                   ss.subject,
                   ss.subject_code,
                   ss.course,
                   ss.year_level,
                   ss.section,
                   ss.instructor,
                   ss.instructor_id
            FROM semester_schedules ss
            JOIN semesters s ON s.id = ss.semester_id
            LEFT JOIN rooms ON rooms.id = ss.room_id
            CROSS JOIN LATERAL generate_series(
                COALESCE($1::date, s.starts_on),
                COALESCE($2::date, s.ends_on),
                interval '1 day'
            ) AS d
            WHERE s.starts_on IS NOT NULL
              AND s.ends_on IS NOT NULL
              AND d::date BETWEEN s.starts_on AND s.ends_on
              AND extract(isodow FROM d) = ss.day_of_week
              AND NOT EXISTS (
                  SELECT 1
                  FROM class_cancellations c
                  WHERE c.schedule_id = ss.id
                    AND c.cancelled_on = d::date
              )
            ORDER BY d ASC, ss.start_time ASC, ss.course ASC, ss.section ASC
        `, [from || null, to || null])

        res.json({ blocks: rows })
    } catch (error) {
        console.error(error)
        if (error.code === "22007") return res.status(400).json({ message: "Invalid date range" })
        res.status(500).json({ message: "Failed to load class schedule blocks" })
    }
})

router.post("/semester-schedules", requireAuth, scheduleWrite, async (req, res) => {
    const errors = validateSchedule(req.body)
    if (errors.length > 0) return res.status(400).json({ message: errors[0], errors })

    try {
        const room = await resolveRoom(req.body.room_id, req.body.room)
        if (!room) return res.status(400).json({ message: "Room not found" })
        if (room.maintenance) return res.status(409).json({ message: "That laboratory is currently under maintenance" })

        const instructor = await resolveInstructor(req.body.instructor_id, req.body.instructor)
        const day = Number(req.body.day_of_week)
        const semester = await getSemesterDates(req.body.semester_id)

        if (!semester) return res.status(400).json({ message: "Semester not found" })
        if (!semester.starts_on || !semester.ends_on) {
            return res.status(400).json({ message: "Set the semester start and end dates before adding class entries" })
        }

        const conflict = await findScheduleConflict({
            semesterId: req.body.semester_id,
            roomId: room.roomId,
            instructorId: instructor.id,
            instructorName: instructor.name,
            course: clean(req.body.course),
            yearLevel: clean(req.body.year_level),
            section: clean(req.body.section),
            dayOfWeek: day,
            startTime: req.body.start_time,
            endTime: req.body.end_time
        })

        if (conflict) {
            return res.status(409).json({
                message: scheduleConflictMessage(conflict, {
                    instructorName: instructor.name,
                    course: clean(req.body.course),
                    yearLevel: clean(req.body.year_level),
                    section: clean(req.body.section)
                })
            })
        }

        const reservationConflict = await findReservationConflict({
            roomId: room.roomId,
            dayOfWeek: day,
            startTime: req.body.start_time,
            endTime: req.body.end_time,
            startsOn: semester.starts_on,
            endsOn: semester.ends_on
        })

        if (reservationConflict) {
            return res.status(409).json({
                message: `This room already has a reservation on ${String(reservationConflict.time_start).slice(0, 10)} at that time`
            })
        }

        const { rows } = await db.query(
            `INSERT INTO semester_schedules
                (semester_id, course, year_level, section, subject_code, subject,
                 instructor, instructor_id, day_of_week, start_time, end_time, room, room_id, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             RETURNING *`,
            [
                req.body.semester_id,
                clean(req.body.course),
                clean(req.body.year_level),
                clean(req.body.section),
                clean(req.body.subject_code),
                clean(req.body.subject),
                instructor.name,
                instructor.id,
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

        const semester = await client.query("SELECT starts_on, ends_on FROM semesters WHERE id = $1", [semesterId])
        if (semester.rows.length === 0) {
            await client.query("ROLLBACK")
            return res.status(404).json({ message: "Semester not found" })
        }
        if (!semester.rows[0].starts_on || !semester.rows[0].ends_on) {
            await client.query("ROLLBACK")
            return res.status(400).json({ message: "Set the semester start and end dates before importing class entries" })
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
            if (room.maintenance) {
                await client.query("ROLLBACK")
                return res.status(409).json({ message: `Row ${index + 1}: ${room.roomName} is under maintenance` })
            }

            const instructor = await resolveInstructor(payload.instructor_id, payload.instructor, client)
            const day = Number(payload.day_of_week)

            const conflict = await findScheduleConflict({
                semesterId,
                roomId: room.roomId,
                instructorId: instructor.id,
                instructorName: instructor.name,
                course: clean(payload.course),
                yearLevel: clean(payload.year_level),
                section: clean(payload.section),
                dayOfWeek: day,
                startTime: payload.start_time,
                endTime: payload.end_time
            }, client)

            if (conflict) {
                await client.query("ROLLBACK")
                return res.status(409).json({
                    message: `Row ${index + 1}: ${scheduleConflictMessage(conflict, {
                        instructorName: instructor.name,
                        course: clean(payload.course),
                        yearLevel: clean(payload.year_level),
                        section: clean(payload.section)
                    })}`
                })
            }

            const reservationConflict = await findReservationConflict({
                roomId: room.roomId,
                dayOfWeek: day,
                startTime: payload.start_time,
                endTime: payload.end_time,
                startsOn: semester.rows[0].starts_on,
                endsOn: semester.rows[0].ends_on
            }, client)

            if (reservationConflict) {
                await client.query("ROLLBACK")
                return res.status(409).json({
                    message: `Row ${index + 1}: ${room.roomName} already has a reservation on ${String(reservationConflict.time_start).slice(0, 10)} at that time`
                })
            }

            await client.query(
                `INSERT INTO semester_schedules
                    (semester_id, course, year_level, section, subject_code, subject,
                     instructor, instructor_id, day_of_week, start_time, end_time, room, room_id, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                [
                    semesterId,
                    clean(payload.course),
                    clean(payload.year_level),
                    clean(payload.section),
                    clean(payload.subject_code),
                    clean(payload.subject),
                    instructor.name,
                    instructor.id,
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
        if (room.maintenance) return res.status(409).json({ message: "That laboratory is currently under maintenance" })

        const instructor = await resolveInstructor(req.body.instructor_id, req.body.instructor)
        const day = Number(req.body.day_of_week)
        const semester = await getSemesterDates(req.body.semester_id)

        if (!semester) return res.status(400).json({ message: "Semester not found" })
        if (!semester.starts_on || !semester.ends_on) {
            return res.status(400).json({ message: "Set the semester start and end dates before adding class entries" })
        }

        const conflict = await findScheduleConflict({
            semesterId: req.body.semester_id,
            roomId: room.roomId,
            instructorId: instructor.id,
            instructorName: instructor.name,
            course: clean(req.body.course),
            yearLevel: clean(req.body.year_level),
            section: clean(req.body.section),
            dayOfWeek: day,
            startTime: req.body.start_time,
            endTime: req.body.end_time,
            excludeId: req.params.id
        })

        if (conflict) {
            return res.status(409).json({
                message: scheduleConflictMessage(conflict, {
                    instructorName: instructor.name,
                    course: clean(req.body.course),
                    yearLevel: clean(req.body.year_level),
                    section: clean(req.body.section)
                })
            })
        }

        const reservationConflict = await findReservationConflict({
            roomId: room.roomId,
            dayOfWeek: day,
            startTime: req.body.start_time,
            endTime: req.body.end_time,
            startsOn: semester.starts_on,
            endsOn: semester.ends_on
        })

        if (reservationConflict) {
            return res.status(409).json({
                message: `This room already has a reservation on ${String(reservationConflict.time_start).slice(0, 10)} at that time`
            })
        }

        const { rows } = await db.query(
            `UPDATE semester_schedules
             SET semester_id = $1, course = $2, year_level = $3, section = $4,
                 subject_code = $5, subject = $6, instructor = $7, instructor_id = $8,
                 day_of_week = $9, start_time = $10, end_time = $11, room = $12,
                 room_id = $13, updated_at = now()
             WHERE id = $14
             RETURNING *`,
            [
                req.body.semester_id,
                clean(req.body.course),
                clean(req.body.year_level),
                clean(req.body.section),
                clean(req.body.subject_code),
                clean(req.body.subject),
                instructor.name,
                instructor.id,
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

router.post("/semester-schedules/:id/cancel", requireAuth, async (req, res) => {
    const date = clean(req.body.date)
    const reason = clean(req.body.reason)

    if (!isDate(date)) return res.status(400).json({ message: "A valid cancellation date is required" })

    try {
        const schedule = await getScheduleForCancellation(req.params.id)
        if (!schedule) return res.status(404).json({ message: "Schedule entry not found" })

        if (!schedule.starts_on || !schedule.ends_on || date < schedule.starts_on || date > schedule.ends_on) {
            return res.status(400).json({ message: "That date is outside the semester" })
        }

        const parsed = new Date(`${date}T00:00:00`)
        const isoDay = parsed.getDay() === 0 ? 7 : parsed.getDay()
        if (isoDay !== Number(schedule.day_of_week)) {
            return res.status(400).json({ message: "That date is not a scheduled class day" })
        }

        if (!canCancelSchedule(schedule, req.user)) {
            return res.status(403).json({ message: "Only the assigned instructor, Admin, or MIS can cancel this class date" })
        }

        const { rows } = await db.query(`
            INSERT INTO class_cancellations (schedule_id, cancelled_on, reason, cancelled_by)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (schedule_id, cancelled_on)
            DO UPDATE SET reason = EXCLUDED.reason, cancelled_by = EXCLUDED.cancelled_by, created_at = now()
            RETURNING *
        `, [schedule.id, date, reason, req.user.id])

        res.json({ message: "Class canceled for that date", cancellation: rows[0] })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to cancel the class date" })
    }
})

router.delete("/semester-schedules/:id/cancel", requireAuth, async (req, res) => {
    const date = clean(req.query.date)
    if (!isDate(date)) return res.status(400).json({ message: "A valid cancellation date is required" })

    try {
        const schedule = await getScheduleForCancellation(req.params.id)
        if (!schedule) return res.status(404).json({ message: "Schedule entry not found" })

        if (!canCancelSchedule(schedule, req.user)) {
            return res.status(403).json({ message: "Only the assigned instructor, Admin, or MIS can restore this class date" })
        }

        const { rowCount } = await db.query(
            "DELETE FROM class_cancellations WHERE schedule_id = $1 AND cancelled_on = $2",
            [schedule.id, date]
        )

        if (rowCount === 0) return res.status(404).json({ message: "No cancellation found for that date" })
        res.json({ message: "Class date restored" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to restore the class date" })
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
