const db = require("../db.js")
const permissions = require("../../shared/permissions.json")

// Legacy 'teacher' accounts are treated as 'faculty' until the data migration
// (003_convert_teacher_role.sql) is applied.
const normalizeRole = (role) => {
    const value = String(role || "").toLowerCase()
    return value === "teacher" ? "faculty" : value
}

const ROLES = {
    STUDENT: "student",
    FACULTY: "faculty",
    ADMIN: "admin",
    MIS_STAFF: "mis_staff"
}

const requireAuth = async (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Not logged in" })
    }

    try {
        const { rows } = await db.query(
            "SELECT id, name, email, role, is_active FROM users WHERE id = $1",
            [req.session.userId]
        )

        if (rows.length === 0 || rows[0].is_active === false) {
            req.session.destroy(() => {})
            return res.status(401).json({ message: "Session is no longer valid" })
        }

        const user = rows[0]
        req.user = { ...user, role: normalizeRole(user.role) }
        next()
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to verify session" })
    }
}

const requireRole = (...allowedRoles) => {
    const allowed = allowedRoles.map(normalizeRole)
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ message: "Not logged in" })
        if (!allowed.includes(req.user.role)) {
            return res.status(403).json({ message: "You do not have permission to do that" })
        }
        next()
    }
}

const requireCapability = (capability) => {
    const allowed = (permissions.capabilities[capability] || []).map(normalizeRole)
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ message: "Not logged in" })
        if (!allowed.includes(req.user.role)) {
            return res.status(403).json({ message: "You do not have permission to do that" })
        }
        next()
    }
}

module.exports = { requireAuth, requireRole, requireCapability, normalizeRole, ROLES }
