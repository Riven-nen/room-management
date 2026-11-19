const express = require("express")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const z = require("zod")
const db = require("../db.js")
const permissions = require("../../shared/permissions.json")
const { requireAuth, requireCapability, normalizeRole } = require("../middleware/auth.js")
const { authLimiter } = require("../middleware/rateLimit.js")

const router = express.Router()

const CODE_ROLES = ["faculty", "admin", "mis_staff"]
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const CODE_PREFIX = { faculty: "FAC", admin: "ADM", mis_staff: "MIS" }

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(1).max(200)
})

const registerSchema = z.object({
    name: z.string().trim().min(2).max(120),
    email: z.email(),
    password: z.string().min(8).max(200),
    role: z.string().trim(),
    invite_code: z.string().trim().optional()
})

const regenerateSession = (req) => new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
        if (error) reject(error)
        else resolve()
    })
})

function generateInviteCode(role) {
    const group = () => Array.from(crypto.randomBytes(4))
        .map((byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length])
        .join("")

    return `LCUP-${CODE_PREFIX[role]}-${group()}-${group()}`
}

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

router.post("/login", authLimiter, async (req, res) => {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(400).json({ message: "Enter a valid email and password" })
    }

    const email = parsed.data.email.trim().toLowerCase()

    try {
        const { rows } = await db.query("SELECT * FROM users WHERE email = $1", [email])
        const user = rows[0]

        if (!user) return res.status(401).json({ message: "Invalid email or password" })

        if (user.is_active === false) {
            return res.status(403).json({ message: "This account has been deactivated" })
        }

        const match = await bcrypt.compare(parsed.data.password, user.password).catch(() => false)
        if (!match) return res.status(401).json({ message: "Invalid email or password" })

        await regenerateSession(req)
        req.session.userId = user.id

        res.json({
            message: "Login successful",
            user: { id: user.id, email: user.email, name: user.name, role: normalizeRole(user.role) }
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Login failed" })
    }
})

router.post("/register", authLimiter, async (req, res) => {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
        const firstIssue = parsed.error.issues[0]
        return res.status(400).json({ message: firstIssue?.message || "Invalid registration details" })
    }

    const { name, email, password, invite_code: inviteCode } = parsed.data
    const requestedRole = normalizeRole(parsed.data.role)

    if (!permissions.roles.includes(requestedRole)) {
        return res.status(400).json({ message: "Invalid role" })
    }

    const normalizedEmail = email.trim().toLowerCase()
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

            invite = await findInviteCode(client, requestedRole, inviteCode)

            if (!invite) {
                await client.query("ROLLBACK")
                return res.status(403).json({ message: "Invalid, expired, or already used registration code" })
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const { rows } = await client.query(
            `INSERT INTO users (name, email, password, role, invite_code_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, name, email, role`,
            [name.trim(), normalizedEmail, hashedPassword, requestedRole, invite?.id || null]
        )

        if (invite) {
            await client.query("UPDATE invite_codes SET uses = uses + 1 WHERE id = $1", [invite.id])
        }

        await client.query("COMMIT")

        await regenerateSession(req)
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
router.get("/invites", requireAuth, requireCapability("inviteManage"), async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT invite_codes.id,
                   invite_codes.role::text AS role,
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

router.post("/invites", requireAuth, requireCapability("inviteManage"), async (req, res) => {
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
             RETURNING id, role::text AS role, label, max_uses, uses, expires_at, created_at`,
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

router.post("/invites/:id/revoke", requireAuth, requireCapability("inviteManage"), async (req, res) => {
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
        const { rows } = await db.query(
            "SELECT id, email, name, role::text AS role, is_active FROM users WHERE id = $1",
            [req.session.userId]
        )
        const user = rows[0]
        if (!user || user.is_active === false) return res.status(404).json({ message: "User not found" })
        res.json({ user: { ...user, role: normalizeRole(user.role) } })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Server error" })
    }
})

router.put("/update-profile", requireAuth, async (req, res) => {
    const name = String(req.body.name || "").trim()

    if (name.length < 2) {
        return res.status(400).json({ message: "Name must be at least 2 characters" })
    }

    try {
        const { rows } = await db.query(
            `UPDATE users SET name = $1, updated_at = now()
             WHERE id = $2
             RETURNING id, email, name, role::text AS role`,
            [name, req.user.id]
        )
        res.json({ message: "Profile updated successfully", user: { ...rows[0], role: normalizeRole(rows[0].role) } })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to update profile" })
    }
})

router.put("/change-password", requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body

    if (String(newPassword || "").length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters" })
    }

    try {
        const { rows } = await db.query("SELECT password FROM users WHERE id = $1", [req.user.id])
        const match = await bcrypt.compare(currentPassword, rows[0].password)
        if (!match) return res.status(401).json({ message: "Incorrect current password" })

        const hashedNewPassword = await bcrypt.hash(newPassword, 10)
        await db.query("UPDATE users SET password = $1, updated_at = now() WHERE id = $2", [hashedNewPassword, req.user.id])
        res.json({ message: "Password changed successfully" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to change password" })
    }
})

router.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: "Logout failed" })
        res.clearCookie("connect.sid", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
        })
        res.json({ message: "Logout successful" })
    })
})

module.exports = router
