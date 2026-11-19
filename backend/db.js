const { databaseUrl } = require("./config/env")

const { Pool } = require("pg")

const pool = new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
})

pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL pool error", error)
})

// Return date/timestamp columns as raw strings, not JS Date objects
const PG_DATE_OID = 1082            // date
const PG_TIMESTAMP_OID = 1114       // timestamp without time zone
const PG_TIMESTAMPTZ_OID = 1184     // timestamp with time zone

const identity = (val) => val

pool.on("connect", (client) => {
    client.setTypeParser(PG_DATE_OID, identity)
    client.setTypeParser(PG_TIMESTAMP_OID, identity)
    client.setTypeParser(PG_TIMESTAMPTZ_OID, identity)
})

module.exports = pool
