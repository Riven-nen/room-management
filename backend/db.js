require("dotenv").config()
const { id } = require("date-fns/locale");
const { Pool } = require("pg")

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

async function testDatabase() {
    const { rows } = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        ["admin@example.com"]
    )

    console.log(rows)

    const {id, email} = rows[0]
    console.log(email)
}

testDatabase()

module.exports = pool