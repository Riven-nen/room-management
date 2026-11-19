const express = require("express")
const router = express.Router()
const db = require("../db.js")
const { requireAuth, requireCapability } = require("../middleware/auth.js")

const labWrite = requireCapability("labWrite")

const toPositiveInt = (value, fallback = 0) => {
    const number = Number(value)
    return Number.isInteger(number) && number >= 0 ? number : fallback
}

router.post("/add", requireAuth, labWrite, async (req, res) => {
    const { roomName, roomBuilding, roomCapacity, roomPCS, coordinatorId } = req.body

    if (!String(roomName || "").trim() || !String(roomBuilding || "").trim()) {
        return res.status(400).json({ error: "Room name and building are required" })
    }

    const capacity = toPositiveInt(roomCapacity)
    const computerCount = toPositiveInt(roomPCS)
    const client = await db.connect()

    try {
        await client.query("BEGIN")

        const { rows } = await client.query(
            `INSERT INTO rooms (name, location, capacity, computer_count, maintenance, coordinator_id)
             VALUES ($1, $2, $3, $4, false, $5)
             RETURNING id`,
            [String(roomName).trim(), String(roomBuilding).trim(), capacity, computerCount, coordinatorId || null]
        )

        const roomId = rows[0].id

        if (computerCount > 0) {
            await client.query(
                `INSERT INTO computers (room_id, pc_number, is_maintenance)
                 SELECT $1, gs, false
                 FROM generate_series(1, $2) AS gs`,
                [roomId, computerCount]
            )
        }

        await client.query("COMMIT")
        res.status(201).json({ message: "Lab added successfully", roomId })
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {})
        if (error.code === "23505") {
            return res.status(409).json({ error: "A laboratory with this room name already exists" })
        }
        if (error.code === "23503") {
            return res.status(400).json({ error: "The selected coordinator was not found" })
        }
        console.error(error)
        res.status(500).json({ error: "Failed to add laboratory" })
    } finally {
        client.release()
    }
})

router.get("/all", requireAuth, async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT rooms.*, users.name AS coordinator_name
            FROM rooms
            LEFT JOIN users ON rooms.coordinator_id = users.id
            ORDER BY rooms.name ASC
        `)
        res.json({ labs: rows })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to retrieve laboratories" })
    }
})

router.get("/get-teachers", requireAuth, labWrite, async (req, res) => {
    try {
        const { rows } = await db.query(
            "SELECT id, name FROM users WHERE role IN ('faculty', 'admin') AND is_active = true ORDER BY name ASC"
        )
        res.json({ teachers: rows })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to get coordinators" })
    }
})

router.put("/edit", requireAuth, labWrite, async (req, res) => {
    const { roomName, newRoomName, roomBuilding, roomCapacity, roomPCS, coordinatorId } = req.body

    if (!String(roomName || "").trim() || !String(newRoomName || "").trim()) {
        return res.status(400).json({ error: "Room name is required" })
    }

    try {
        const { rowCount } = await db.query(
            `UPDATE rooms
             SET name = $1, location = $2, capacity = $3, computer_count = $4, coordinator_id = $5
             WHERE name = $6`,
            [
                String(newRoomName).trim(),
                String(roomBuilding || "").trim(),
                toPositiveInt(roomCapacity),
                toPositiveInt(roomPCS),
                coordinatorId || null,
                roomName
            ]
        )
        if (rowCount === 0) return res.status(404).json({ error: "Laboratory not found" })
        res.json({ message: "Laboratory updated successfully" })
    } catch (error) {
        if (error.code === "23505") return res.status(409).json({ error: "A laboratory with this room name already exists" })
        console.error(error)
        res.status(500).json({ error: "Failed to update laboratory" })
    }
})

router.delete("/delete", requireAuth, labWrite, async (req, res) => {
    const { roomName } = req.body
    try {
        const { rowCount } = await db.query("DELETE FROM rooms WHERE name = $1", [roomName])
        if (rowCount === 0) return res.status(404).json({ error: "Laboratory not found" })
        res.json({ message: "Laboratory deleted successfully" })
    } catch (error) {
        if (error.code === "23503") {
            return res.status(409).json({ error: "This laboratory still has reservations or schedules attached" })
        }
        console.error(error)
        res.status(500).json({ error: "Failed to delete laboratory" })
    }
})

router.put("/maintenance", requireAuth, labWrite, async (req, res) => {
    const { roomName, maintenance, maintenanceReason, maintenanceUntil } = req.body
    try {
        const reason = maintenance ? maintenanceReason : null
        const until = maintenance && maintenanceUntil ? maintenanceUntil : null

        const { rowCount } = await db.query(
            `UPDATE rooms SET maintenance = $1, maintenance_reason = $2, maintenance_until = $3 WHERE name = $4`,
            [Boolean(maintenance), reason, until, roomName]
        )
        if (rowCount === 0) return res.status(404).json({ error: "Laboratory not found" })
        res.json({ message: "Maintenance status updated successfully" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to update maintenance status" })
    }
})

router.get("/get-computers", requireAuth, labWrite, async (req, res) => {
    const { roomId } = req.query

    try {
        const { rows } = await db.query(
            "SELECT * FROM computers WHERE room_id = $1 ORDER BY pc_number ASC",
            [roomId]
        )
        res.json({ computers: rows })
    } catch (error) {
        if (error.code === "22P02") return res.status(400).json({ error: "Invalid room id" })
        console.error(error)
        res.status(500).json({ error: "Failed to retrieve computers" })
    }
})

router.put("/toggle-pc", requireAuth, labWrite, async (req, res) => {
    const { computerId, isMaintenance, maintenanceReason } = req.body
    try {
        await db.query(
            "UPDATE computers SET is_maintenance = $1, maintenance_reason = $2 WHERE id = $3",
            [Boolean(isMaintenance), maintenanceReason || null, computerId]
        )
        res.json({ message: "Computer status updated" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to update computer status" })
    }
})

module.exports = router
