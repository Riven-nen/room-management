const path = require("path")

require("dotenv").config({ path: path.join(__dirname, "..", ".env") })

const nodeEnv = process.env.NODE_ENV || "development"
const isProduction = nodeEnv === "production" || process.env.RENDER === "true"
const isDevelopment = !isProduction

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required. Add it to backend/.env or the hosting environment.")
}

if (isProduction && !process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required in production.")
}

const DEFAULT_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:4000",
    "http://localhost:5173",
    "https://room-management-alpha.vercel.app"
]

const allowedOrigins = (process.env.ALLOWED_ORIGINS || DEFAULT_ORIGINS.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)

module.exports = {
    nodeEnv,
    isProduction,
    isDevelopment,
    port: Number(process.env.PORT) || 3000,
    databaseUrl: process.env.DATABASE_URL,
    sessionSecret: process.env.SESSION_SECRET || "development-only-insecure-secret",
    sessionMaxAgeMs: 1000 * 60 * 60 * 24 * 7,
    cookieSecure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : isProduction,
    allowedOrigins
}
