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

        res.status(201).json({
            message: "Lab added successfully"
        })
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                error: "A laboratory with this room name already exists"
            })
        }

        console.error(error)

        res.status(500).json({
            error: "Failed to add laboratory"
        })
    }
})

router.get("/all", async (req, res) => {
    console.log("LAB GET ROUTE HIT")

    try {
        const {rows} = await db.query(
            "SELECT * FROM rooms"
        )

        res.json({
            labs: rows
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            error: "Failed to retrieve laboratories"
        })
    }
})

router.get("/get/lab", async (req, res) => {
    const {name} = req.query

    try {
        const {rows} = await db.query(
            "SELECT * FROM rooms WHERE name = $1",
            [name]
        )

        if (rows.length === 0) {
            return res.status(404).json({
                error: "Laboratory not found"
            })
        }

        res.json({
            lab: rows[0]
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            error: "Failed to retrieve laboratory"
        })
    }
})

router.put("/edit", async (req, res) => {
    const {
        roomName,
        newRoomName,
        roomBuilding,
        roomCapacity,
        roomPCS
    } = req.body

    try {
        const {rowCount} = await db.query(
            "UPDATE rooms SET name = $1, location = $2, capacity = $3, computer_count = $4 WHERE name = $5",
            [
                newRoomName,
                roomBuilding,
                roomCapacity,
                roomPCS,
                roomName
            ]
        )

        if (rowCount === 0) {
            return res.status(404).json({
                error: "Laboratory not found"
            })
        }

        res.json({
            message: "Laboratory updated successfully"
        })
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                error: "A laboratory with this room name already exists"
            })
        }

        console.error(error)

        res.status(500).json({
            error: "Failed to update laboratory"
        })
    }
})

router.delete("/delete", async (req, res) => {
    const {roomName} = req.body

    try {
        const {rowCount} = await db.query(
            "DELETE FROM rooms WHERE name = $1",
            [roomName]
        )

        if (rowCount === 0) {
            return res.status(404).json({
                error: "Laboratory not found"
            })
        }

        res.json({
            message: "Laboratory deleted successfully"
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            error: "Failed to delete laboratory"
        })
    }
})

module.exports = router