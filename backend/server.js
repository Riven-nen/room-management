const express = require("express")
const cors = require("cors")
const authRoutes = require("./routes/auth")
const labRoutes = require("./routes/lab.js")
const session = require("express-session")
const app = express()
const reservationRoutes = require("./routes/reservation.js")
const notificationRoutes = require("./routes/notifications.js")
const scheduleRoutes = require("./routes/schedule.js")

const allowedOrigins = [
    "http://localhost:5173", 
    "http://localhost:4000", 
    "https://room-management-alpha.vercel.app"
];

app.use(cors({
    origin: function(origin, callback){
        if(!origin) return callback(null, true);
        if(allowedOrigins.indexOf(origin) === -1){
            return callback(new Error('CORS blocked'), false);
        }
        return callback(null, true);
    },
    credentials: true
}))

app.use(express.json())

app.set('trust proxy', 1);

// Production keeps the cross-site secure cookie. Local development can be run
// with NODE_ENV=development so the cookie also works over plain http.
const isDevelopment = process.env.NODE_ENV === "development"

app.use(session({
    secret: process.env.SESSION_SECRET || "secret-text",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: !isDevelopment,
        sameSite: isDevelopment ? "lax" : "none",
        httpOnly: true
    }
}))

app.use("/api/auth", authRoutes)
app.use("/api/lab", labRoutes)
app.use("/api/reservation", reservationRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/schedule", scheduleRoutes)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})