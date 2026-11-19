const CHANNEL_NAME = "labease-data"

const channel = typeof window !== "undefined" && "BroadcastChannel" in window
    ? new BroadcastChannel(CHANNEL_NAME)
    : null

const notify = (eventName) => {
    if (typeof window === "undefined") return
    window.dispatchEvent(new Event(eventName))
    channel?.postMessage(eventName)
}

export const notifyScheduleChanged = () => notify("schedule:changed")
export const notifyBookingsChanged = () => notify("bookings:changed")

export const subscribeToDataChanges = (eventNames, callback) => {
    if (typeof window === "undefined") return () => {}

    const names = Array.isArray(eventNames) ? eventNames : [eventNames]
    const handleWindowEvent = (event) => {
        if (names.includes(event.type)) callback()
    }
    const handleChannelMessage = (event) => {
        if (names.includes(event.data)) callback()
    }

    names.forEach((name) => window.addEventListener(name, handleWindowEvent))
    channel?.addEventListener("message", handleChannelMessage)

    return () => {
        names.forEach((name) => window.removeEventListener(name, handleWindowEvent))
        channel?.removeEventListener("message", handleChannelMessage)
    }
}
