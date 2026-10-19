import './ReservationTable.css'
import { Check, X } from "lucide-react"

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
                    {data.map((reservation, index) => (
                        <tr key={index}>
                            <td>{reservation.room || reservation.roomName}</td>
                            <td>{reservation.user || reservation.section}</td>
                            <td>
                                {reservation.start 
                                    ? new Date(reservation.start).toLocaleDateString() 
                                    : reservation.date}
                            </td>
                            <td>
                                {reservation.start 
                                    ? new Date(reservation.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                    : reservation.time}
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
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default ReservationTable