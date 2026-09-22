/* eslint-disable no-undef */
require("dotenv").config()
const { Pool } = require("pg")

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

// Return timestamp columns as raw strings, not JS Date objects
const PG_TIMESTAMP_OID = 1114       // timestamp without time zone
const PG_TIMESTAMPTZ_OID = 1184     // timestamp with time zone

const identity = (val) => val

pool.on("connect", (client) => {
    client.setTypeParser(PG_TIMESTAMP_OID, identity)
    client.setTypeParser(PG_TIMESTAMPTZ_OID, identity)
})

module.exports = pool