const express = require("express")
const router = express.Router()
const db = require("../db.js")

const normalize = (value) => {
    if (!value) return value
    return String(value).replace("T", " ").trim()
}

router.get("/all", async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT
                reservations.id,
                reservations.time_start,
                reservations.time_end,
                reservations.status,
                reservations.purpose,
                reservations.participants,
                rooms.id AS room_id,
                rooms.name AS room_name,
                rooms.coordinator_id,
                coord.name AS coordinator_name,
                users.id AS user_id,
                users.name AS user_name,
                users.email AS user_email
            FROM reservations
            JOIN rooms ON reservations.room_id = rooms.id
            JOIN users ON reservations.reserved_by = users.id
            LEFT JOIN users AS coord ON rooms.coordinator_id = coord.id
            ORDER BY reservations.time_start ASC
        `)

        const reservations = rows.map((reservation) => ({
            id: reservation.id,
            title: reservation.room_name,
            room: reservation.room_name,
            user: reservation.user_name || reservation.user_email,
            start: reservation.time_start,
            end: reservation.time_end,
            status: reservation.status,
            purpose: reservation.purpose,
            participants: reservation.participants,
            coordinator_id: reservation.coordinator_id,
            coordinator_name: reservation.coordinator_name
        }))

        res.json({ reservations })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to retrieve reservations" })
    }
})

router.get("/get", async (req, res) => {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: "Reservation ID is required" })

    try {
        const { rows } = await db.query(`
            SELECT
                reservations.id,
                reservations.time_start,
                reservations.time_end,
                reservations.status,
                reservations.purpose,
                reservations.participants,
                rooms.id AS room_id,
                rooms.name AS room_name,
                users.id AS user_id,
                users.name AS user_name,
                users.email AS user_email
            FROM reservations
            JOIN rooms ON reservations.room_id = rooms.id
            JOIN users ON reservations.reserved_by = users.id
            WHERE reservations.id = $1
        `, [id])

        if (rows.length === 0) return res.status(404).json({ error: "Reservation not found" })

        const reservation = rows[0]
        res.json({
            reservation: {
                id: reservation.id,
                title: reservation.room_name,
                room: reservation.room_name,
                user: reservation.user_name || reservation.user_email,
                start: reservation.time_start,
                end: reservation.time_end,
                status: reservation.status,
                purpose: reservation.purpose,
                participants: reservation.participants
            }
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to retrieve reservation" })
    }
})

router.post("/add", async (req, res) => {
    const { roomId, reservedBy, timeStart, timeEnd, status, purpose, participants } = req.body

    if (!roomId || !reservedBy || !timeStart || !timeEnd || !purpose || !participants) {
        return res.status(400).json({ error: "Room, user, start time, end time, purpose, and participants are required" })
    }

    const start = normalize(timeStart)
    const end = normalize(timeEnd)
    if (start >= end) return res.status(400).json({ error: "End time must be after start time" })

    try {
        const roomResult = await db.query("SELECT id, name, maintenance, coordinator_id FROM rooms WHERE id = $1", [roomId])
        if (roomResult.rows.length === 0) return res.status(404).json({ error: "Laboratory not found" })
        if (roomResult.rows[0].maintenance) return res.status(409).json({ error: "Laboratory is currently under maintenance" })

        const userResult = await db.query("SELECT id, name FROM users WHERE id = $1", [reservedBy])
        if (userResult.rows.length === 0) return res.status(404).json({ error: "User not found" })

        const overlapResult = await db.query(`
            SELECT id FROM reservations
            WHERE room_id = $1 AND time_start < $3 AND time_end > $2 AND status NOT IN ('rejected', 'cancelled')
        `, [roomId, start, end])

        if (overlapResult.rows.length > 0) {
            return res.status(409).json({ error: "Laboratory is already reserved during this time" })
        }

        const reservationStatus = status || "pending"
        const { rows } = await db.query(`
            INSERT INTO reservations (time_start, time_end, reserved_by, room_id, status, purpose, participants)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, time_start, time_end, reserved_by, room_id, status, purpose, participants
        `, [start, end, reservedBy, roomId, reservationStatus, purpose, participants])

        // NOTIFY COORDINATOR
        const coordinatorId = roomResult.rows[0].coordinator_id
        if (coordinatorId) {
            await db.query(
                "INSERT INTO notifications (user_id, message) VALUES ($1, $2)",
                [coordinatorId, `New booking request for ${roomResult.rows[0].name} by ${userResult.rows[0].name}.`]
            )
        }

        res.status(201).json({ message: "Reservation created successfully", reservation: rows[0] })
    } catch (error) {
        console.error(error)
        if (error.code === "22P02") return res.status(400).json({ error: "Invalid reservation data" })
        res.status(500).json({ error: "Failed to create reservation" })
    }
})

router.put("/edit", async (req, res) => {
    const { id, roomId, reservedBy, timeStart, timeEnd, status, purpose, participants } = req.body
    if (!id || !roomId || !reservedBy || !timeStart || !timeEnd || !status || !purpose || !participants) {
        return res.status(400).json({ error: "All fields are required" })
    }

    const start = normalize(timeStart)
    const end = normalize(timeEnd)
    if (start >= end) return res.status(400).json({ error: "End time must be after start time" })

    try {
        const reservationResult = await db.query("SELECT id FROM reservations WHERE id = $1", [id])
        if (reservationResult.rows.length === 0) return res.status(404).json({ error: "Reservation not found" })

        const roomResult = await db.query("SELECT id, maintenance FROM rooms WHERE id = $1", [roomId])
        if (roomResult.rows.length === 0) return res.status(404).json({ error: "Laboratory not found" })
        if (roomResult.rows[0].maintenance) return res.status(409).json({ error: "Laboratory is currently under maintenance" })

        const overlapResult = await db.query(`
            SELECT id FROM reservations
            WHERE room_id = $1 AND time_start < $3 AND time_end > $2 AND id != $4 AND status NOT IN ('rejected', 'cancelled')
        `, [roomId, start, end, id])

        if (overlapResult.rows.length > 0) return res.status(409).json({ error: "Laboratory is already reserved during this time" })

        const { rows } = await db.query(`
            UPDATE reservations
            SET time_start = $1, time_end = $2, reserved_by = $3, room_id = $4, status = $5, purpose = $6, participants = $7
            WHERE id = $8
            RETURNING id, time_start, time_end, reserved_by, room_id, status, purpose, participants
        `, [start, end, reservedBy, roomId, status, purpose, participants, id])

        res.json({ message: "Reservation updated successfully", reservation: rows[0] })
    } catch (error) {
        console.error(error)
        if (error.code === "22P02") return res.status(400).json({ error: "Invalid reservation data" })
        res.status(500).json({ error: "Failed to update reservation" })
    }
})

router.put("/update-status", async (req, res) => {
    const { id, status } = req.body
    try {
        const { rowCount } = await db.query("UPDATE reservations SET status = $1 WHERE id = $2::int", [status, id])
        if (rowCount === 0) return res.status(404).json({ error: "Reservation not found" })

        // NOTIFY THE USER WHO MADE THE BOOKING
        const resInfo = await db.query(`
            SELECT reservations.reserved_by, rooms.name AS room_name 
            FROM reservations 
            JOIN rooms ON reservations.room_id = rooms.id 
            WHERE reservations.id = $1
        `, [id])

        if (resInfo.rows.length > 0) {
            const { reserved_by, room_name } = resInfo.rows[0]
            await db.query(
                "INSERT INTO notifications (user_id, message) VALUES ($1, $2)",
                [reserved_by, `Your booking for ${room_name} was ${status}.`]
            )
        }

        res.json({ message: `Reservation ${status}` })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to update status" })
    }
})

router.delete("/delete", async (req, res) => {
    const { id } = req.body
    const userId = req.session.userId

    if (!id) return res.status(400).json({ error: "Reservation ID is required" })
    if (!userId) return res.status(401).json({ error: "Unauthorized" })

    try {
        const userRes = await db.query("SELECT role, name FROM users WHERE id = $1", [userId])
        const user = userRes.rows[0]

        const resRes = await db.query(`
            SELECT reservations.id, reservations.reserved_by, users.name AS reserved_by_name 
            FROM reservations 
            JOIN users ON reservations.reserved_by = users.id
            WHERE reservations.id = $1
        `, [id])

        if (resRes.rows.length === 0) return res.status(404).json({ error: "Reservation not found" })
        const reservation = resRes.rows[0]

        if (user.role !== "admin" && user.name !== reservation.reserved_by_name) {
            return res.status(403).json({ error: "You do not have permission to cancel this booking" })
        }

        await db.query("DELETE FROM reservations WHERE id = $1", [id])
        res.json({ message: "Reservation deleted successfully" })
        
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to delete reservation" })
    }
})

router.get("/analytics", async (req, res) => {
    try {
        const totalBookingsResult = await db.query("SELECT COUNT(*) FROM reservations WHERE status = 'approved'")
        const totalBookings = parseInt(totalBookingsResult.rows[0].count)

        const labUsageResult = await db.query(`
            SELECT rooms.name, COUNT(reservations.id) as count
            FROM reservations
            JOIN rooms ON reservations.room_id = rooms.id
            WHERE reservations.status = 'approved'
            GROUP BY rooms.name
            ORDER BY count DESC
        `)
        
        const labUsage = labUsageResult.rows.map(row => ({
            name: row.name,
            value: totalBookings > 0 ? Math.round((parseInt(row.count) / totalBookings) * 100) : 0
        }))

        // Calculate bookings by day of the week (1 = Monday, 7 = Sunday in Postgres ISODOW)
        const weeklyTrendsResult = await db.query(`
            SELECT EXTRACT(ISODOW FROM time_start) as day_num, COUNT(*) as count
            FROM reservations
            WHERE status = 'approved'
            GROUP BY day_num
        `)
        
        const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        
        // Create an array with all 7 days initialized to 0
        const weeklyTrends = daysOfWeek.map(day => ({ day, bookings: 0 }))
        
        // Populate with actual data from DB
        weeklyTrendsResult.rows.forEach(row => {
            const index = parseInt(row.day_num) - 1
            if (index >= 0 && index < 7) {
                weeklyTrends[index].bookings = parseInt(row.count)
            }
        })

        res.json({ totalBookings, labUsage, weeklyTrends })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to generate analytics" })
    }
})

module.exports = router