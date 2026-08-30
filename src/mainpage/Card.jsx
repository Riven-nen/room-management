import './Card.css'

function Card({ children, columns = 1, rows = 1, className = '' }) {
    return (
        <div
            className={`card-container ${className}`}
            style={{
                gridColumn: `span ${columns}`,
                gridRow: `span ${rows}`
            }}
        >
            {children}
        </div>
    )
}

export default Card