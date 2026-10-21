const express = require("express")
const router = express.Router()
const db = require("../db.js")

router.get("/", async (req, res) => {
    const userId = req.session.userId
    if (!userId) return res.status(401).json({ error: "Unauthorized" })

    try {
        const { rows } = await db.query(
            "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10", 
            [userId]
        )
        res.json({ notifications: rows })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to fetch notifications" })
    }
})

router.put("/read", async (req, res) => {
    const userId = req.session.userId
    if (!userId) return res.status(401).json({ error: "Unauthorized" })

    try {
        await db.query("UPDATE notifications SET is_read = true WHERE user_id = $1", [userId])
        res.json({ message: "Notifications marked as read" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to mark as read" })
    }
})

module.exports = router