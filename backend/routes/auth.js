const express = require("express")
const bcrypt = require("bcrypt")
const db = require("../db.js")
const router = express.Router()

async function encryptUser(userPassword) { // easier i guess, idk how it works
    try {
        return await bcrypt.hash(userPassword, 10)
    } catch (err) {
        console.error("Hashing password error.")
    }
}

router.post("/login", async (req, res) => {
    console.log("LOGIN ROUTE HIT")
    console.log(req.body)

    const { email, password } = req.body

    const {rows} = await db.query(
        "SELECT * FROM users where email = $1", 
        [email]
    )

    const user = rows[0]
    console.log(user)

    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    const match = await bcrypt.compare(password, user.password)

    if (!match) {
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    req.session.userId = user.id
    console.log(req.session)

    res.json({
        message: "Login successful",
        user: {
            id: user.id,
            email: user.email
        }
    })
})

router.get("/register", async (req, res) => {
})

router.get("/me", async (req, res) => {
    const rows = await db.query("SELECT * FROM users where id = $!", [req.session.id])
    const user = rows[0]

    res.json({
        user : user
    })
})

module.exports = router