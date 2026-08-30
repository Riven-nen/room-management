import './ReservationTable.css'
import { Check, X } from "lucide-react"

function ReservationTable({ data }) {
    return (
        <div className="reservation-table-wrapper">
            <table className="reservation-table">
                <thead>
                    <tr>
                        <th>Room Name</th>
                        <th>Section</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {data.map((reservation, index) => (
                        <tr key={index}>
                            <td>{reservation.roomName}</td>
                            <td>{reservation.section}</td>
                            <td>{reservation.date}</td>
                            <td>{reservation.time}</td>
                            <td>
                                <span className={`status ${reservation.status.toLowerCase()}`}>
                                    {reservation.status}
                                </span>
                            </td>
                            <td>
                                <div className="reservation-actions">
                                    <button className="action-check">
                                        <Check size={18} />
                                    </button>
                                    <button className="action-x">
                                        <X size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default ReservationTable