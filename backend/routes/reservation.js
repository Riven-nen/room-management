const express = require("express")
const router = express.Router()
const db = require("../db.js")

router.get("/all", async (req, res) => {
    try {
        const {rows} = await db.query(`
            SELECT
                reservations.id,
                reservations.time_start,
                reservations.time_end,
                reservations.status,
                rooms.id AS room_id,
                rooms.name AS room_name,
                users.id AS user_id,
                users.name AS user_name,
                users.email AS user_email
            FROM reservations
            JOIN rooms ON reservations.room_id = rooms.id
            JOIN users ON reservations.reserved_by = users.id
            ORDER BY reservations.time_start ASC
        `)

        const reservations = rows.map((reservation) => ({
            id: reservation.id,
            title: reservation.room_name,
            room: reservation.room_name,
            user: reservation.user_name || reservation.user_email,
            start: reservation.time_start,
            end: reservation.time_end,
            status: reservation.status
        }))

        res.json({
            reservations
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            error: "Failed to retrieve reservations"
        })
    }
})

router.get("/get", async (req, res) => {
    const {id} = req.query

    if (!id) {
        return res.status(400).json({
            error: "Reservation ID is required"
        })
    }

    try {
        const {rows} = await db.query(`
            SELECT
                reservations.id,
                reservations.time_start,
                reservations.time_end,
                reservations.status,
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

        if (rows.length === 0) {
            return res.status(404).json({
                error: "Reservation not found"
            })
        }

        const reservation = rows[0]

        res.json({
            reservation: {
                id: reservation.id,
                title: reservation.room_name,
                room: reservation.room_name,
                user: reservation.user_name || reservation.user_email,
                start: reservation.time_start,
                end: reservation.time_end,
                status: reservation.status
            }
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            error: "Failed to retrieve reservation"
        })
    }
})

router.post("/add", async (req, res) => {
    const {
        roomId,
        reservedBy,
        timeStart,
        timeEnd,
        status
    } = req.body

    if (!roomId || !reservedBy || !timeStart || !timeEnd) {
        return res.status(400).json({
            error: "Room, user, start time, and end time are required"
        })
    }

    const start = new Date(timeStart)
    const end = new Date(timeEnd)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
            error: "Invalid reservation date or time"
        })
    }

    if (start >= end) {
        return res.status(400).json({
            error: "End time must be after start time"
        })
    }

    try {
        const roomResult = await db.query(
            "SELECT id, name, maintenance FROM rooms WHERE id = $1",
            [roomId]
        )

        if (roomResult.rows.length === 0) {
            return res.status(404).json({
                error: "Laboratory not found"
            })
        }

        if (roomResult.rows[0].maintenance) {
            return res.status(409).json({
                error: "Laboratory is currently under maintenance"
            })
        }

        const userResult = await db.query(
            "SELECT id FROM users WHERE id = $1",
            [reservedBy]
        )

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                error: "User not found"
            })
        }

        const overlapResult = await db.query(`
            SELECT id
            FROM reservations
            WHERE room_id = $1
            AND time_start < $3
            AND time_end > $2
            AND status NOT IN ('rejected', 'cancelled')
        `, [
            roomId,
            timeStart,
            timeEnd
        ])

        if (overlapResult.rows.length > 0) {
            return res.status(409).json({
                error: "Laboratory is already reserved during this time"
            })
        }

        const reservationStatus = status || "pending"

        const {rows} = await db.query(`
            INSERT INTO reservations (
                time_start,
                time_end,
                reserved_by,
                room_id,
                status
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, time_start, time_end, reserved_by, room_id, status
        `, [
            timeStart,
            timeEnd,
            reservedBy,
            roomId,
            reservationStatus
        ])

        res.status(201).json({
            message: "Reservation created successfully",
            reservation: rows[0]
        })
    } catch (error) {
        console.error(error)

        if (error.code === "22P02") {
            return res.status(400).json({
                error: "Invalid reservation data"
            })
        }

        res.status(500).json({
            error: "Failed to create reservation"
        })
    }
})

router.put("/edit", async (req, res) => {
    const {
        id,
        roomId,
        reservedBy,
        timeStart,
        timeEnd,
        status
    } = req.body

    if (!id || !roomId || !reservedBy || !timeStart || !timeEnd || !status) {
        return res.status(400).json({
            error: "Reservation ID, room, user, start time, end time, and status are required"
        })
    }

    const start = new Date(timeStart)
    const end = new Date(timeEnd)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
            error: "Invalid reservation date or time"
        })
    }

    if (start >= end) {
        return res.status(400).json({
            error: "End time must be after start time"
        })
    }

    try {
        const reservationResult = await db.query(
            "SELECT id FROM reservations WHERE id = $1",
            [id]
        )

        if (reservationResult.rows.length === 0) {
            return res.status(404).json({
                error: "Reservation not found"
            })
        }

        const roomResult = await db.query(
            "SELECT id, maintenance FROM rooms WHERE id = $1",
            [roomId]
        )

        if (roomResult.rows.length === 0) {
            return res.status(404).json({
                error: "Laboratory not found"
            })
        }

        if (roomResult.rows[0].maintenance) {
            return res.status(409).json({
                error: "Laboratory is currently under maintenance"
            })
        }

        const userResult = await db.query(
            "SELECT id FROM users WHERE id = $1",
            [reservedBy]
        )

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                error: "User not found"
            })
        }

        const overlapResult = await db.query(`
            SELECT id
            FROM reservations
            WHERE room_id = $1
            AND time_start < $3
            AND time_end > $2
            AND id != $4
            AND status NOT IN ('rejected', 'cancelled')
        `, [
            roomId,
            timeStart,
            timeEnd,
            id
        ])

        if (overlapResult.rows.length > 0) {
            return res.status(409).json({
                error: "Laboratory is already reserved during this time"
            })
        }

        const {rows} = await db.query(`
            UPDATE reservations
            SET
                time_start = $1,
                time_end = $2,
                reserved_by = $3,
                room_id = $4,
                status = $5
            WHERE id = $6
            RETURNING id, time_start, time_end, reserved_by, room_id, status
        `, [
            timeStart,
            timeEnd,
            reservedBy,
            roomId,
            status,
            id
        ])

        res.json({
            message: "Reservation updated successfully",
            reservation: rows[0]
        })
    } catch (error) {
        console.error(error)

        if (error.code === "22P02") {
            return res.status(400).json({
                error: "Invalid reservation data"
            })
        }

        res.status(500).json({
            error: "Failed to update reservation"
        })
    }
})

router.delete("/delete", async (req, res) => {
    const {id} = req.body

    if (!id) {
        return res.status(400).json({
            error: "Reservation ID is required"
        })
    }

    try {
        const {rowCount} = await db.query(
            "DELETE FROM reservations WHERE id = $1",
            [id]
        )

        if (rowCount === 0) {
            return res.status(404).json({
                error: "Reservation not found"
            })
        }

        res.json({
            message: "Reservation deleted successfully"
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            error: "Failed to delete reservation"
        })
    }
})

module.exports = router