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
const filename = path.basename(fullPath)
const sql = fs.readFileSync(fullPath, "utf8")

const client = new Client({ connectionString: process.env.DATABASE_URL })

;(async () => {
    try {
        await client.connect()

        await client.query(`
            create table if not exists schema_migrations (
                filename text primary key,
                applied_at timestamptz not null default now()
            )
        `)

        const applied = await client.query(
            "select 1 from schema_migrations where filename = $1",
            [filename]
        )

        if (applied.rows.length > 0) {
            console.log(`Skipped ${filename} (already applied)`)
            return
        }

        await client.query("BEGIN")
        await client.query(sql)
        await client.query("insert into schema_migrations (filename) values ($1)", [filename])
        await client.query("COMMIT")
        console.log(`Applied ${filename}`)
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {})
        console.error(`Migration failed: ${error.message}`)
        process.exitCode = 1
    } finally {
        await client.end()
    }
})()
