const express = require("express")
const router = express.Router()
const db = require("../db.js")

router.post("/add", async (req, res) => {
    console.log("LAB ADD ROUTE HIT")
    const {roomName, roomBuilding, roomCapacity, roomPCS} = req.body
    try {
        await db.query(
            "INSERT INTO rooms (name, location, capacity, computer_count, maintenance) VALUES ($1, $2, $3, $4, $5)",
            [roomName, roomBuilding, roomCapacity, roomPCS, false]
        )
        res.status(201).json({ message: "Lab added successfully" })
    } catch (error) {
        if (error.code === "23505") return res.status(409).json({ error: "A laboratory with this room name already exists" })
        console.error(error)
        res.status(500).json({ error: "Failed to add laboratory" })
    }
})

router.get("/all", async (req, res) => {
    try {
        const {rows} = await db.query(`
            SELECT rooms.*, users.name AS coordinator_name 
            FROM rooms 
            LEFT JOIN users ON rooms.coordinator_id = users.id
        `)
        res.json({ labs: rows })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to retrieve laboratories" })
    }
})

router.get("/get-teachers", async (req, res) => {
    try {
        const { rows } = await db.query("SELECT id, name FROM users WHERE role IN ('teacher', 'admin')")
        res.json({ teachers: rows })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to get teachers" })
    }
})

router.put("/edit", async (req, res) => {
    const { roomName, newRoomName, roomBuilding, roomCapacity, roomPCS, coordinatorId } = req.body
    try {
        const {rowCount} = await db.query(
            "UPDATE rooms SET name = $1, location = $2, capacity = $3, computer_count = $4, coordinator_id = $5 WHERE name = $6",
            [newRoomName, roomBuilding, roomCapacity, roomPCS, coordinatorId || null, roomName]
        )
        if (rowCount === 0) return res.status(404).json({ error: "Laboratory not found" })
        res.json({ message: "Laboratory updated successfully" })
    } catch (error) {
        if (error.code === "23505") return res.status(409).json({ error: "A laboratory with this room name already exists" })
        console.error(error)
        res.status(500).json({ error: "Failed to update laboratory" })
    }
})

router.delete("/delete", async (req, res) => {
    const {roomName} = req.body
    try {
        const {rowCount} = await db.query("DELETE FROM rooms WHERE name = $1", [roomName])
        if (rowCount === 0) return res.status(404).json({ error: "Laboratory not found" })
        res.json({ message: "Laboratory deleted successfully" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to delete laboratory" })
    }
})

router.put("/maintenance", async (req, res) => {
    const { roomName, maintenance, maintenanceReason, maintenanceUntil } = req.body
    try {
        let reason = maintenance ? maintenanceReason : null
        let until = maintenance ? maintenanceUntil : null
        if (until === "" || until === undefined) until = null

        const { rowCount } = await db.query(
            `UPDATE rooms SET maintenance = $1, maintenance_reason = $2, maintenance_until = $3 WHERE name = $4`,
            [maintenance, reason, until, roomName]
        )
        if (rowCount === 0) return res.status(404).json({ error: "Laboratory not found" })
        res.json({ message: "Maintenance status updated successfully" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to update maintenance status" })
    }
})

router.get("/get-computers", async (req, res) => {
    const { roomId } = req.query
    try {
        let { rows } = await db.query("SELECT * FROM computers WHERE room_id = $1 ORDER BY pc_number ASC", [roomId])
        if (rows.length === 0) {
            const roomRes = await db.query("SELECT computer_count FROM rooms WHERE id = $1", [roomId])
            if(roomRes.rows.length === 0) return res.status(404).json({error: "Room not found"})
            const count = roomRes.rows[0].computer_count
            if (count > 0) {
                const insertValues = []
                for (let i = 1; i <= count; i++) insertValues.push(`(${roomId}, ${i}, false)`)
                await db.query(`INSERT INTO computers (room_id, pc_number, is_maintenance) VALUES ${insertValues.join(', ')}`)
                const newRows = await db.query("SELECT * FROM computers WHERE room_id = $1 ORDER BY pc_number ASC", [roomId])
                rows = newRows.rows
            }
        }
        res.json({ computers: rows })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to retrieve computers" })
    }
})

router.put("/toggle-pc", async (req, res) => {
    const { computerId, isMaintenance, maintenanceReason } = req.body
    try {
        await db.query("UPDATE computers SET is_maintenance = $1, maintenance_reason = $2 WHERE id = $3", [isMaintenance, maintenanceReason, computerId])
        res.json({ message: "Computer status updated" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to update computer status" })
    }
})

module.exports = router