require("dotenv").config()
const { id } = require("date-fns/locale");
const { Pool } = require("pg")

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})


module.exports = pool