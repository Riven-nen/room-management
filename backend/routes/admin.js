const express = require("express")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const db = require("../db.js")
const permissions = require("../../shared/permissions.json")
const { requireAuth, requireCapability, normalizeRole } = require("../middleware/auth.js")

const router = express.Router()

const adminOnly = [requireAuth, requireCapability("userManage")]

router.get("/users", adminOnly, async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT id, name, email, role::text AS role, is_active, created_at
            FROM users
            ORDER BY id ASC
        `)

        res.json({ users: rows.map((user) => ({ ...user, role: normalizeRole(user.role) })) })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to load users" })
    }
})

router.put("/users/:id/role", adminOnly, async (req, res) => {
    const role = normalizeRole(req.body.role)

    if (!permissions.roles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" })
    }

    if (String(req.params.id) === String(req.user.id) && role !== "admin") {
        return res.status(400).json({ message: "You cannot remove your own admin role" })
    }

    try {
        const target = await db.query(
            "SELECT id, role::text AS role FROM users WHERE id = $1",
            [req.params.id]
        )

        if (target.rows.length === 0) {
            return res.status(404).json({ message: "User not found" })
        }

        if (normalizeRole(target.rows[0].role) === "admin" && role !== "admin") {
            const admins = await db.query("SELECT count(*)::int AS count FROM users WHERE role = 'admin' AND is_active = true")
            if (admins.rows[0].count <= 1) {
                return res.status(400).json({ message: "At least one active admin is required" })
            }
        }

        const { rows } = await db.query(
            `UPDATE users SET role = $1, updated_at = now()
             WHERE id = $2
             RETURNING id, name, email, role::text AS role, is_active`,
            [role, req.params.id]
        )

        res.json({ user: { ...rows[0], role: normalizeRole(rows[0].role) } })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to update the user role" })
    }
})

router.put("/users/:id/active", adminOnly, async (req, res) => {
    const isActive = Boolean(req.body.is_active)

    if (String(req.params.id) === String(req.user.id) && !isActive) {
        return res.status(400).json({ message: "You cannot deactivate your own account" })
    }

    try {
        const { rows } = await db.query(
            `UPDATE users SET is_active = $1, updated_at = now()
             WHERE id = $2
             RETURNING id, name, email, role::text AS role, is_active`,
            [isActive, req.params.id]
        )

        if (rows.length === 0) return res.status(404).json({ message: "User not found" })

        res.json({ user: { ...rows[0], role: normalizeRole(rows[0].role) } })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to update the account status" })
    }
})

router.post("/users/:id/reset-password", adminOnly, async (req, res) => {
    const suppliedPassword = req.body?.password
    const temporaryPassword = suppliedPassword || `LCUP-${crypto.randomBytes(4).toString("hex")}`

    if (String(temporaryPassword).length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" })
    }

    try {
        const hash = await bcrypt.hash(temporaryPassword, 10)
        const { rows } = await db.query(
            `UPDATE users SET password = $1, updated_at = now()
             WHERE id = $2
             RETURNING id, name, email`,
            [hash, req.params.id]
        )

        if (rows.length === 0) return res.status(404).json({ message: "User not found" })

        res.json({
            message: "Password reset",
            temporaryPassword: suppliedPassword ? undefined : temporaryPassword,
            user: rows[0]
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to reset the password" })
    }
})

module.exports = router
