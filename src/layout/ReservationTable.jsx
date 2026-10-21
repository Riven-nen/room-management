import './ReservationTable.css'
import { Check, X } from "lucide-react"

const parseLocal = (value) => {
    if (!value) return new Date()
    if (value instanceof Date) {
        return value
    }
    const str = String(value).trim()
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/)
    if (match) {
        const [, y, mo, d, h, mi, s] = match
        return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s || 0), 0)
    }
    return new Date(str)
}

function ReservationTable({ data, onApprove, onReject, isDashboard }) {
    return (
        <div className="reservation-table-wrapper">
            <table className="reservation-table">
                <thead>
                    <tr>
                        <th>Room Name</th>
                        <th>User</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                        {isDashboard && <th>Actions</th>}
                    </tr>
                </thead>

                <tbody>
                    {data.map((reservation, index) => {
                        const start = parseLocal(reservation.start)
                        const end = parseLocal(reservation.end)

                        return (
                            <tr key={index}>
                                <td>{reservation.room || reservation.roomName}</td>
                                <td>{reservation.user || reservation.section}</td>
                                <td>
                                    {start.toLocaleDateString()}
                                </td>
                                <td>
                                    {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td>
                                    <span className={`status ${reservation.status ? reservation.status.toLowerCase() : 'active'}`}>
                                        {reservation.status || "Active"}
                                    </span>
                                </td>
                                {isDashboard && (
                                    <td>
                                        <div className="reservation-actions">
                                            <button className="action-check" onClick={() => onApprove(reservation.id)} title="Approve">
                                                <Check size={18} />
                                            </button>
                                            <button className="action-x" onClick={() => onReject(reservation.id)} title="Reject">
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

export default ReservationTable