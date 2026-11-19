const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const compression = require("compression")
const session = require("express-session")
const connectPgSimple = require("connect-pg-simple")

const config = require("./config/env")
const pool = require("./db.js")
const { notFound, errorHandler } = require("./middleware/error.js")
const { apiLimiter } = require("./middleware/rateLimit.js")

const authRoutes = require("./routes/auth.js")
const adminRoutes = require("./routes/admin.js")
const labRoutes = require("./routes/lab.js")
const reservationRoutes = require("./routes/reservation.js")
const notificationRoutes = require("./routes/notifications.js")
const scheduleRoutes = require("./routes/schedule.js")

const app = express()
const PgSession = connectPgSimple(session)

app.set("trust proxy", 1)

app.use(helmet())
app.use(compression())

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true)
        if (config.allowedOrigins.includes(origin)) return callback(null, true)

        // Local dev servers can pick a different port when 5173 is busy.
        if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true)

        // Vercel preview deployments.
        if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return callback(null, true)

        return callback(new Error("CORS blocked"))
    },
    credentials: true
}))

app.use(express.json({ limit: "1mb" }))

app.use(session({
    store: new PgSession({
        pool,
        tableName: "session",
        createTableIfMissing: false
    }),
    name: "connect.sid",
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        secure: config.cookieSecure,
        sameSite: "lax",
        httpOnly: true,
        maxAge: config.sessionMaxAgeMs
    }
}))

app.get("/api/health", async (req, res) => {
    try {
        await pool.query("select 1")
        res.json({
            status: "ok",
            uptime: Math.round(process.uptime()),
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error(error)
        res.status(503).json({ status: "unavailable" })
    }
})

app.use("/api", apiLimiter)

app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/lab", labRoutes)
app.use("/api/reservation", reservationRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/schedule", scheduleRoutes)

app.use(notFound)
app.use(errorHandler)

const server = app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} (${config.nodeEnv})`)
})

const shutdown = async (signal) => {
    console.log(`${signal} received. Shutting down...`)
    server.close(async () => {
        try {
            await pool.end()
            process.exit(0)
        } catch (error) {
            console.error(error)
            process.exit(1)
        }
    })
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))

module.exports = app
