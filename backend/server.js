const express = require("express")
const cors = require("cors")
const authRoutes = require("./routes/auth")
const labRoutes = require("./routes/lab.js")
const session = require("express-session")
const pool = require("./db.js")
const app = express()

app.use(cors({
    origin: "http://localhost:4000",
    credentials: true
}))

app.use(express.json())

app.use(session({
    secret: "secret-text",
    resave: false,
    saveUninitialized: false
}))

app.use("/api/auth", authRoutes)
app.use("/api/lab", labRoutes)

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000")
})