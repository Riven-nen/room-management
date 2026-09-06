const express = require("express")

const router = express.Router()

const users = [
    {
        id: 1,
        email: "admin@example.com",
        password: "password123"
    },
    {
        id: 2,
        email: "user@example.com",
        password: "hello123"
    }
]

router.post("/login", (req, res) => {
    console.log("LOGIN ROUTE HIT")
    console.log(req.body)

    const { email, password } = req.body

    const user = users.find(user => user.email === email)

    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    if (user.password !== password) {
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    res.json({
        message: "Login successful",
        user: {
            id: user.id,
            email: user.email
        }
    })
})
module.exports = router