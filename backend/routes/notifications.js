const express = require("express")
const router = express.Router()
const db = require("../db.js")
const { requireAuth } = require("../middleware/auth.js")

router.get("/", requireAuth, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT id, message, is_read, created_at
             FROM notifications
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT 10`,
            [req.user.id]
        )
        res.json({ notifications: rows })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to fetch notifications" })
    }
})

router.put("/read", requireAuth, async (req, res) => {
    try {
        await db.query("UPDATE notifications SET is_read = true WHERE user_id = $1", [req.user.id])
        res.json({ message: "Notifications marked as read" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to mark as read" })
    }
})

module.exports = router
