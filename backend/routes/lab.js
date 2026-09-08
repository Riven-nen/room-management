const express = require("express")
const router = express.Router()
const db = require("../db.js")

router.post("/add", async (req, res) => {
    console.log("LAB ADD ROUTE HIT")
    const {roomName, roomBuilding, roomCapacity, roomPCS} = req.body
    
    await db.query(
        "INSERT INTO rooms (name, location, capacity, computer_count, maintenance) VALUES ($1, $2, $3, $4, $5)",
        [roomName, roomBuilding, roomCapacity, roomPCS, false]
    )

    res.json({
        message: "Lab added successfully"
    })
})

router.get("/get", async (req,res) => {
    console.log("LAB GET ROUTE HIT")
    const {rows} = await db.query(
        "SELECT * FROM rooms"
    )

    res.json ({
        labs : rows
    })
})

module.exports = router