const notFound = (req, res) => {
    res.status(404).json({ message: "Route not found" })
}

const errorHandler = (error, req, res, next) => {
    if (res.headersSent) return next(error)

    console.error(error)

    if (error.code === "23P01") {
        return res.status(409).json({ message: "That room is already booked during this time" })
    }

    if (error.code === "23505") {
        return res.status(409).json({ message: "That record already exists" })
    }

    if (error.code === "22P02") {
        return res.status(400).json({ message: "Invalid request data" })
    }

    const status = error.status || 500
    res.status(status).json({
        message: status >= 500 ? "Internal server error" : error.message
    })
}

module.exports = { notFound, errorHandler }
