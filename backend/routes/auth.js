/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require("express")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const db = require("../db.js")
const { requireAuth, requireRole, normalizeRole } = require("../middleware/auth.js")
const router = express.Router()

const REGISTERABLE_ROLES = ["student", "faculty", "admin", "mis_staff"]
const CODE_ROLES = ["faculty", "admin", "mis_staff"]
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const CODE_PREFIX = { faculty: "FAC", admin: "ADM", mis_staff: "MIS" }

async function encryptUser(userPassword) {
    try {
        return await bcrypt.hash(userPassword, 10)
    } catch (err) {
        console.error("Hashing password error.")
        throw err
    }
}

function generateInviteCode(role) {
    const group = () => Array.from(crypto.randomBytes(4))
        .map((byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length])
        .join("")

    return `LCUP-${CODE_PREFIX[role]}-${group()}-${group()}`
}

// Find the first active invite code that matches the supplied plain text.
async function findInviteCode(client, role, plainCode) {
    const { rows } = await client.query(
        `SELECT id, code_hash
         FROM invite_codes
         WHERE role = $1
           AND revoked_at IS NULL
           AND (expires_at IS NULL OR expires_at > now())
           AND uses < max_uses`,
        [role]
    )

    for (const row of rows) {
        if (await bcrypt.compare(plainCode, row.code_hash)) return row
    }

    return null
}

router.post("/login", async (req, res) => {
    const { email, password } = req.body

    const { rows } = await db.query("SELECT * FROM users where email = $1", [String(email || "").trim().toLowerCase()])
    const user = rows[0]

    if (!user) return res.status(401).json({ message: "Invalid email or password" })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ message: "Invalid email or password" })

    req.session.userId = user.id

    res.json({
        message: "Login successful",
        user: { id: user.id, email: user.email, name: user.name, role: normalizeRole(user.role) }
    })
})

router.post("/register", async (req, res) => {
    const { name, email, password, role, invite_code: inviteCode } = req.body
    const requestedRole = normalizeRole(role)

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "All fields are required" })
    }

    if (!REGISTERABLE_ROLES.includes(requestedRole)) {
        return res.status(400).json({ message: "Invalid role" })
    }

    if (String(password).length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const client = await db.connect()

    try {
        await client.query("BEGIN")

        const existingUser = await client.query("SELECT id FROM users WHERE email = $1", [normalizedEmail])
        if (existingUser.rows.length > 0) {
            await client.query("ROLLBACK")
            return res.status(409).json({ message: "Email is already registered" })
        }

        let invite = null

        // Students register freely; every staff role needs a valid invite code.
        if (requestedRole !== "student") {
            if (!inviteCode) {
                await client.query("ROLLBACK")
                return res.status(400).json({ message: "A registration code is required for this role" })
            }

            invite = await findInviteCode(client, requestedRole, String(inviteCode).trim())

            if (!invite) {
                await client.query("ROLLBACK")
                return res.status(403).json({ message: "Invalid, expired, or already used registration code" })
            }
        }

        const hashedPassword = await encryptUser(password)

        const { rows } = await client.query(
            "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
            [String(name).trim(), normalizedEmail, hashedPassword, requestedRole]
        )

        if (invite) {
            await client.query("UPDATE invite_codes SET uses = uses + 1 WHERE id = $1", [invite.id])
        }

        await client.query("COMMIT")

        req.session.userId = rows[0].id

        res.status(201).json({
            message: "Account created successfully",
            user: { ...rows[0], role: normalizeRole(rows[0].role) }
        })
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {})
        console.error(error)
        res.status(500).json({ message: "Failed to create account" })
    } finally {
        client.release()
    }
})

// ---------------------------------------------------------------------------
// Invite code management (admin only)
// ---------------------------------------------------------------------------
router.get("/invites", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT invite_codes.id,
                   invite_codes.role,
                   invite_codes.label,
                   invite_codes.max_uses,
                   invite_codes.uses,
                   invite_codes.expires_at,
                   invite_codes.revoked_at,
                   invite_codes.created_at,
                   creator.name AS created_by_name
            FROM invite_codes
            LEFT JOIN users AS creator ON creator.id = invite_codes.created_by
            ORDER BY invite_codes.created_at DESC
        `)

        res.json({
            invites: rows.map((invite) => ({
                ...invite,
                role: normalizeRole(invite.role),
                status: invite.revoked_at
                    ? "revoked"
                    : (invite.expires_at && new Date(invite.expires_at) <= new Date())
                        ? "expired"
                        : invite.uses >= invite.max_uses
                            ? "used"
                            : "active"
            }))
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to load registration codes" })
    }
})

router.post("/invites", requireAuth, requireRole("admin"), async (req, res) => {
    const { role, label, max_uses: maxUses, expires_in_days: expiresInDays } = req.body
    const targetRole = normalizeRole(role)

    if (!CODE_ROLES.includes(targetRole)) {
        return res.status(400).json({ message: "Registration codes can only be created for faculty, admin, or MIS staff" })
    }

    const uses = Number(maxUses ?? 1)
    if (!Number.isInteger(uses) || uses < 1) {
        return res.status(400).json({ message: "Maximum uses must be a whole number of at least 1" })
    }

    let expiresAt = null
    if (expiresInDays !== undefined && expiresInDays !== null && expiresInDays !== "") {
        const days = Number(expiresInDays)
        if (!Number.isFinite(days) || days <= 0) {
            return res.status(400).json({ message: "Expiry must be a positive number of days" })
        }
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    }

    try {
        const code = generateInviteCode(targetRole)
        const codeHash = await bcrypt.hash(code, 10)

        const { rows } = await db.query(
            `INSERT INTO invite_codes (role, code_hash, label, max_uses, expires_at, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, role, label, max_uses, uses, expires_at, created_at`,
            [targetRole, codeHash, label || null, uses, expiresAt, req.user.id]
        )

        res.status(201).json({
            message: "Registration code created",
            code,
            invite: { ...rows[0], role: normalizeRole(rows[0].role), status: "active" }
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to create registration code" })
    }
})

router.post("/invites/:id/revoke", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { rows } = await db.query(
            `UPDATE invite_codes
             SET revoked_at = now()
             WHERE id = $1 AND revoked_at IS NULL
             RETURNING id`,
            [req.params.id]
        )

        if (rows.length === 0) {
            return res.status(404).json({ message: "Registration code not found or already revoked" })
        }

        res.json({ message: "Registration code revoked" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to revoke registration code" })
    }
})

router.get("/me", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not logged in" })

    try {
        const { rows } = await db.query("SELECT id, email, name, role FROM users WHERE id = $1", [req.session.userId])
        const user = rows[0]
        if (!user) return res.status(404).json({ message: "User not found" })
        res.json({ user: { ...user, role: normalizeRole(user.role) } })
    } catch (error) {
        res.status(500).json({ message: "Server error" })
    }
})

router.put("/update-profile", async (req, res) => {
    const { name } = req.body
    const userId = req.session.userId
    if (!userId) return res.status(401).json({ message: "Unauthorized" })

    try {
        const { rows } = await db.query(
            "UPDATE users SET name = $1 WHERE id = $2 RETURNING id, email, name, role",
            [name, userId]
        )
        res.json({ message: "Profile updated successfully", user: { ...rows[0], role: normalizeRole(rows[0].role) } })
    } catch (error) {
        res.status(500).json({ message: "Failed to update profile" })
    }
})

router.put("/change-password", async (req, res) => {
    const { currentPassword, newPassword } = req.body
    const userId = req.session.userId
    if (!userId) return res.status(401).json({ message: "Unauthorized" })

    try {
        const { rows } = await db.query("SELECT password FROM users WHERE id = $1", [userId])
        const match = await bcrypt.compare(currentPassword, rows[0].password)
        if (!match) return res.status(401).json({ message: "Incorrect current password" })

        const hashedNewPassword = await bcrypt.hash(newPassword, 10)
        await db.query("UPDATE users SET password = $1 WHERE id = $2", [hashedNewPassword, userId])
        res.json({ message: "Password changed successfully" })
    } catch (error) {
        res.status(500).json({ message: "Failed to change password" })
    }
})

router.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: "Logout failed" })
        res.clearCookie("connect.sid")
        res.json({ message: "Logout successful" })
    })
})

module.exports = router
