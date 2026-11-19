import "./AnalyticsReports.css"
import Card from "./Card";
import { PageSkeleton } from "../layout/Loading.jsx";
import { Download } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts"

function AnalyticsReports() {
    const [analytics, setAnalytics] = useState({
        totalBookings: 0,
        labUsage: [],
        peakHours: []
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await fetch(`/api/reservation/analytics`, { credentials: "include" })
                const data = await response.json()
                if (response.ok) {
                    setAnalytics(data)
                }
            } catch (error) {
                console.error("Failed to load analytics:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchAnalytics()
    }, [])

    if (loading) return <PageSkeleton label="Loading analytics" stats={4} chart rows={4} columns={5} />

    const topLab = analytics.labUsage.length > 0 ? analytics.labUsage[0].name : "N/A"

    const exportAnalytics = () => {
        const rows = [
            ["Metric", "Value"],
            ["Total Approved Bookings", analytics.totalBookings],
            ["Most Used Lab", topLab],
            [],
            ["Laboratory", "Usage %"],
            ...analytics.labUsage.map((item) => [item.name, item.value]),
            [],
            ["Day", "Bookings"],
            ...(analytics.weeklyTrends || []).map((item) => [item.day, item.bookings])
        ]
        const csv = rows
            .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
            .join("\n")
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = "analytics-report.csv"
        anchor.click()
        URL.revokeObjectURL(url)
    }

    return (
        <>
            <div className="analytics-control">
                <div className="analytics-control-left">
                    <select><option value="">All Time</option></select>
                    <select><option value="">All Departments</option></select>
                </div>
                <div className="analytics-control-right">
                    <button onClick={exportAnalytics}><Download /> Export CSV</button>
                </div>
            </div>

            <div className="analytics-content">
                <Card className="analytics-content-dash" columns={4}>
                    <div className="analytics-content-dash-title">
                        <p>Total Approved Bookings</p>
                        <span>All Time</span>
                    </div>
                    <h1>{analytics.totalBookings.toLocaleString()}</h1>
                    <p>Across all laboratories</p>
                </Card>

                <Card className="analytics-content-dash" columns={4}>
                    <div className="analytics-content-dash-title">
                        <p>Most Used Lab</p>
                    </div>
                    <h1 style={{fontSize: '24px'}}>{topLab}</h1>
                    <p>Highest booking frequency</p>
                </Card>

                <Card className="analytics-content-dash" columns={4}>
                    <div className="analytics-content-dash-title">
                        <p>System Status</p>
                        <span style={{backgroundColor: '#d9f3e5', color: '#218838'}}>Active</span>
                    </div>
                    <h1>100%</h1>
                    <p>Data synced with database</p>
                </Card>

                <Card className="analytics-content-dash" columns={4}>
                    <div className="analytics-content-dash-title">
                        <p>Database</p>
                        <span>Connected</span>
                    </div>
                    <h1>PostgreSQL</h1>
                    <p>Supabase Cloud</p>
                </Card>

                <Card columns={8} rows={4}>
                    <h2>Peak Usage Hours (Weekly)</h2>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={analytics.peakHours}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="bookings" fill="#041c59" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                <Card columns={8} rows={4} className="analytics-content-usage">
                    <h2> Top Laboratory Usage </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
                        {analytics.labUsage.map((lab, index) => (
                            <div className="analytics-usage-entry" key={index}>
                                <div className="analytics-usage-entry-top">
                                    <p>{lab.name}</p>
                                    <span>{lab.value}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-bar-fill" style={{ width: `${lab.value}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </>
    )
}

export default AnalyticsReports