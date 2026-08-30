import './ConflictTable.css'

function ConflictTable({ data }) {
    return (
        <div className="conflict-table-wrapper">
            <table className="conflict-table">
                <thead>
                    <tr>
                        <th>Parties Involved</th>
                        <th>Conflict Type</th>
                        <th>Severity</th>
                        <th>Room Name</th>
                    </tr>
                </thead>

                <tbody>
                    {data.map((conflict, index) => (
                        <tr key={index}>
                            <td>{conflict.partiesInvolved}</td>
                            <td>{conflict.conflictType}</td>
                            <td>
                                <span className={`severity ${conflict.severity.toLowerCase()}`}>
                                    {conflict.severity}
                                </span>
                            </td>
                            <td>{conflict.roomName}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default ConflictTable