const db = require("../db.js")

const DEMO_SEMESTER = {
    school_year: "2026-2027",
    term: "1st Semester",
    starts_on: "2026-08-03",
    ends_on: "2026-12-19"
}

const DEMO_EVENTS = [
    {
        title: "University Foundation Day",
        description: "University-wide celebration. No classes.",
        event_type: "holiday",
        starts_on: "2026-09-15",
        ends_on: "2026-09-15",
        all_day: true,
        location: "Main Campus"
    },
    {
        title: "Midterm Examinations",
        description: "Midterm examination week.",
        event_type: "exam",
        starts_on: "2026-10-12",
        ends_on: "2026-10-16",
        all_day: true,
        location: "Main Campus"
    },
    {
        title: "Second Semester Enrollment",
        description: "Enrollment period for the second semester.",
        event_type: "enrollment",
        starts_on: "2027-01-04",
        ends_on: "2027-01-08",
        all_day: true,
        location: "Registrar"
    },
    {
        title: "Christmas Break",
        description: "Holiday break.",
        event_type: "holiday",
        starts_on: "2026-12-21",
        ends_on: "2027-01-03",
        all_day: true,
        location: "Main Campus"
    }
]

const DEMO_SCHEDULE = [
    { course: "BSIT", year_level: "1st Year", section: "A", subject_code: "IT 101", subject: "Introduction to Computing", day_of_week: 1, start_time: "08:00", end_time: "09:30" },
    { course: "BSIT", year_level: "1st Year", section: "A", subject_code: "IT 102", subject: "Computer Programming 1", day_of_week: 2, start_time: "10:00", end_time: "11:30" },
    { course: "BSIT", year_level: "2nd Year", section: "A", subject_code: "IT 201", subject: "Data Structures and Algorithms", day_of_week: 3, start_time: "13:00", end_time: "14:30" },
    { course: "BSCS", year_level: "3rd Year", section: "A", subject_code: "CS 301", subject: "Database Management Systems", day_of_week: 4, start_time: "08:00", end_time: "09:30" },
    { course: "BSIT", year_level: "4th Year", section: "A", subject_code: "IT 401", subject: "Capstone Project 1", day_of_week: 5, start_time: "14:00", end_time: "16:00" }
]

;(async () => {
    try {
        let semester = (await db.query(
            "SELECT * FROM semesters WHERE school_year = $1 AND term = $2",
            [DEMO_SEMESTER.school_year, DEMO_SEMESTER.term]
        )).rows[0]

        if (!semester) {
            const active = await db.query("SELECT id FROM semesters WHERE is_active = true LIMIT 1")
            const shouldActivate = active.rows.length === 0

            const { rows } = await db.query(
                `INSERT INTO semesters (school_year, term, starts_on, ends_on, is_active)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [
                    DEMO_SEMESTER.school_year,
                    DEMO_SEMESTER.term,
                    DEMO_SEMESTER.starts_on,
                    DEMO_SEMESTER.ends_on,
                    shouldActivate
                ]
            )
            semester = rows[0]
            console.log(`Created semester ${semester.school_year} ${semester.term}${shouldActivate ? "" : " (another semester is active)"}`)

            if (!shouldActivate) {
                console.log("Set this semester active from Manage Schedules if you want it shown by default.")
            }
        } else {
            console.log(`Using existing semester ${semester.school_year} ${semester.term}`)
        }

        const rooms = (await db.query(
            "SELECT id, name FROM rooms WHERE maintenance = false ORDER BY name ASC LIMIT 3"
        )).rows

        if (rooms.length === 0) {
            throw new Error("Add at least one laboratory before seeding the demo schedule.")
        }

        const faculty = (await db.query(
            "SELECT name FROM users WHERE role = 'faculty' AND is_active = true ORDER BY id ASC LIMIT 3"
        )).rows

        const existingSchedule = await db.query(
            "SELECT count(*)::int AS count FROM semester_schedules WHERE semester_id = $1",
            [semester.id]
        )

        if (existingSchedule.rows[0].count === 0) {
            for (const [index, entry] of DEMO_SCHEDULE.entries()) {
                const room = rooms[index % rooms.length]
                const instructor = faculty[index % Math.max(faculty.length, 1)]?.name || "Instructor TBA"

                await db.query(
                    `INSERT INTO semester_schedules
                        (semester_id, course, year_level, section, subject_code, subject,
                         instructor, day_of_week, start_time, end_time, room, room_id)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                    [
                        semester.id,
                        entry.course,
                        entry.year_level,
                        entry.section,
                        entry.subject_code,
                        entry.subject,
                        instructor,
                        entry.day_of_week,
                        entry.start_time,
                        entry.end_time,
                        room.name,
                        room.id
                    ]
                )
            }
            console.log(`Inserted ${DEMO_SCHEDULE.length} demo class entries`)
        } else {
            console.log("Semester already has schedule entries; skipping class seed")
        }

        const existingEvents = await db.query(
            "SELECT count(*)::int AS count FROM master_schedule_events WHERE title = ANY($1)",
            [DEMO_EVENTS.map((event) => event.title)]
        )

        if (existingEvents.rows[0].count === 0) {
            for (const event of DEMO_EVENTS) {
                await db.query(
                    `INSERT INTO master_schedule_events
                        (title, description, event_type, starts_on, ends_on, all_day, location)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        event.title,
                        event.description,
                        event.event_type,
                        event.starts_on,
                        event.ends_on,
                        event.all_day,
                        event.location
                    ]
                )
            }
            console.log(`Inserted ${DEMO_EVENTS.length} demo calendar events`)
        } else {
            console.log("Demo calendar events already exist; skipping event seed")
        }

        console.log("Demo seed complete.")
    } catch (error) {
        console.error("Seed failed:", error.message)
        process.exitCode = 1
    } finally {
        await db.end()
    }
})()
