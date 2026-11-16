/* eslint-disable no-undef */
// Minimal migration runner for the room-management Postgres database.
// Usage (from the backend folder): node migrations/run.js 001_schedules_roles.sql
const fs = require("fs")
const path = require("path")
const { Client } = require("pg")

require("dotenv").config({ path: path.join(__dirname, "..", ".env") })

const file = process.argv[2]

if (!file) {
    console.error("Usage: node migrations/run.js <migration-file.sql>")
    process.exit(1)
}

const fullPath = path.isAbsolute(file) ? file : path.join(__dirname, file)
const sql = fs.readFileSync(fullPath, "utf8")

const client = new Client({ connectionString: process.env.DATABASE_URL })

;(async () => {
    try {
        await client.connect()
        await client.query(sql)
        console.log(`Applied ${path.basename(fullPath)}`)
    } catch (error) {
        console.error(`Migration failed: ${error.message}`)
        process.exitCode = 1
    } finally {
        await client.end()
    }
})()
