import "./Loading.css"
import logo from "../assets/logo.png"

const repeat = (count) => Array.from({ length: count })

export function SystemLoader({ label = "Loading system..." }) {
    return (
        <div className="system-loader" role="status" aria-live="polite">
            <div className="system-loader-card">
                <img src={logo} alt="" />
                <h1>LCUP Laboratory</h1>
                <p>{label}</p>
                <div className="system-loader-progress"><span /></div>
            </div>
        </div>
    )
}

export function SkeletonLine({ className = "" }) {
    return <span className={`skeleton-line ${className}`} />
}

export function TableSkeleton({ rows = 6, columns = 5, label = "Loading data" }) {
    const columnsStyle = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }

    return (
        <div className="skeleton-table" role="status" aria-live="polite" aria-label={label}>
            <div className="skeleton-table-row skeleton-table-head" style={columnsStyle}>
                {repeat(columns).map((_, index) => <SkeletonLine key={index} className="w-70" />)}
            </div>
            {repeat(rows).map((_, row) => (
                <div className="skeleton-table-row" key={row} style={columnsStyle}>
                    {repeat(columns).map((_, column) => (
                        <SkeletonLine
                            key={column}
                            className={column === 0 ? "w-80" : column === columns - 1 ? "w-40" : "w-60"}
                        />
                    ))}
                </div>
            ))}
            <span className="sr-only">{label}</span>
        </div>
    )
}

export function CalendarSkeleton({ label = "Loading calendar" }) {
    return (
        <div className="skeleton-calendar" role="status" aria-live="polite" aria-label={label}>
            <div className="skeleton-calendar-toolbar">
                <SkeletonLine className="w-20 h-26" />
                <div className="skeleton-calendar-nav">
                    <span /><span /><span />
                </div>
            </div>
            <div className="skeleton-calendar-days">
                {repeat(7).map((_, index) => <SkeletonLine key={index} className="w-60" />)}
            </div>
            <div className="skeleton-calendar-grid">
                {repeat(35).map((_, index) => (
                    <div className="skeleton-calendar-cell" key={index}><span /></div>
                ))}
            </div>
            <span className="sr-only">{label}</span>
        </div>
    )
}

export function ListSkeleton({ items = 4, label = "Loading data" }) {
    return (
        <div className="skeleton-list" role="status" aria-live="polite" aria-label={label}>
            {repeat(items).map((_, index) => (
                <div className="skeleton-list-item" key={index}>
                    <span className="skeleton-avatar" />
                    <div className="skeleton-list-copy">
                        <SkeletonLine className="w-70" />
                        <SkeletonLine className="w-40" />
                    </div>
                </div>
            ))}
            <span className="sr-only">{label}</span>
        </div>
    )
}

export function PageSkeleton({ label = "Loading data", stats = 4, chart = false, rows = 5, columns = 6 }) {
    return (
        <div className="skeleton-page" role="status" aria-live="polite" aria-label={label}>
            <div className="skeleton-page-head">
                <SkeletonLine className="w-30 h-28" />
                <SkeletonLine className="w-55" />
                <SkeletonLine className="w-40" />
            </div>

            {stats > 0 && (
                <div className="skeleton-stats">
                    {repeat(stats).map((_, index) => (
                        <div className="skeleton-stat" key={index}>
                            <span className="skeleton-icon" />
                            <SkeletonLine className="w-50" />
                            <SkeletonLine className="w-30 h-26" />
                        </div>
                    ))}
                </div>
            )}

            {chart && <div className="skeleton-panel skeleton-chart" />}

            {rows > 0 && (
                <div className="skeleton-panel">
                    <TableSkeleton rows={rows} columns={columns} label={label} />
                </div>
            )}

            <span className="sr-only">{label}</span>
        </div>
    )
}

export function InlineLoader({ label = "Loading" }) {
    return (
        <span className="inline-loader" role="status" aria-live="polite">
            <span className="inline-loader-spinner" />
            {label}
        </span>
    )
}
