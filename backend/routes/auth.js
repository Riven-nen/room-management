/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require("express")
const bcrypt = require("bcrypt")
const db = require("../db.js")
const router = express.Router()

async function encryptUser(userPassword) {
    try {
        return await bcrypt.hash(userPassword, 10)
    } catch (err) {
        console.error("Hashing password error.")
    }
}

router.post("/login", async (req, res) => {
    const { email, password } = req.body

    const { rows } = await db.query("SELECT * FROM users where email = $1", [email])
    const user = rows[0]

    if (!user) return res.status(401).json({ message: "Invalid email or password" })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ message: "Invalid email or password" })

    req.session.userId = user.id

    res.json({
        message: "Login successful",
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
    })
})

// --- NEW REGISTER ROUTE ---
router.post("/register", async (req, res) => {
    const { name, email, password, role } = req.body

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "All fields are required" })
    }

    try {
        // 1. Check if email already exists
        const existingUser = await db.query("SELECT id FROM users WHERE email = $1", [email])
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: "Email is already registered" })
        }

        // 2. Hash the password
        const hashedPassword = await encryptUser(password)

        // 3. Insert into database
        const { rows } = await db.query(
            "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
            [name, email, hashedPassword, role]
        )

        res.status(201).json({
            message: "Account created successfully",
            user: rows[0]
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to create account" })
    }
})

router.get("/me", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not logged in" })

    try {
        const { rows } = await db.query("SELECT id, email, name, role FROM users WHERE id = $1", [req.session.userId])
        const user = rows[0]
        if (!user) return res.status(404).json({ message: "User not found" })
        res.json({ user })
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
        res.json({ message: "Profile updated successfully", user: rows[0] })
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