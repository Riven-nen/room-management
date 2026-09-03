import "./AnalyticsReports.css"
import Card from "./Card";
import {File, Sheet} from 'lucide-react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts"

const data = [
    { day: "Week 1", value: 40 },
    { day: "Week 2", value: 65 },
    { day: "Week 3", value: 45 },
    { day: "Week 4", value: 90 },
]

function AnalyticsReports() {
    return (
        <>
            <div className="analytics-control">
                <div className="analytics-control-left">
                    <select>
                        <option value="">Feb 21 - Feb 27 2026</option>
                    </select>
                    <select>
                        <option value="">Department</option>
                    </select>
                </div>
                <div className="analytics-control-right">
                    <button>
                        <File/>
                        Export PDF
                    </button>
                    <button>
                        <Sheet/>
                        Export Excel
                    </button>
                </div>
            </div>

            <div className="analytics-content">
                <Card className="analytics-content-dash" columns={4}>
                    <div className="analytics-content-dash-title">
                        <p>Total Bookings</p>
                        <span>+32%</span>
                    </div>
                    <h1>1,284</h1   >
                    <p>Past 10 days</p>
                </Card>

                <Card className="analytics-content-dash" columns={4}>
                    <div className="analytics-content-dash-title">
                        <p>Total Bookings</p>
                        <span>+32%</span>
                    </div>
                    <h1>1,284</h1   >
                    <p>Past 10 days</p>
                </Card>

                <Card className="analytics-content-dash" columns={4}>
                    <div className="analytics-content-dash-title">
                        <p>Total Bookings</p>
                        <span>+32%</span>
                    </div>
                    <h1>1,284</h1   >
                    <p>Past 10 days</p>
                </Card>

                <Card className="analytics-content-dash" columns={4}>
                    <div className="analytics-content-dash-title">
                        <p>Total Bookings</p>
                        <span>+32%</span>
                    </div>
                    <h1>1,284</h1   >
                    <p>Past 10 days</p>
                </Card>

                <Card columns={11} rows={4}>
                    <h2>Booking History Trend</h2>
                    <ResponsiveContainer width="100%" height="95%">
                        <LineChart data={data}>
                            <CartesianGrid vertical={false} />
                            <XAxis 
                                interval={0}
                                dataKey="day" 
                                padding={{ left: 25, right: 25 }}
                            />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#041c59"
                                strokeWidth={3}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>
                <Card columns={5} rows={4} className="analytics-content-usage">
                    <h2> Top Faculty Usage </h2>

                    <div className="analytics-usage-entry">
                        <div className="analytics-usage-entry-top">
                            <p> Dr. Edna Dayao</p>
                            <span> 87% </span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-bar-fill" style={{ width: "87%" }}></div>
                        </div>
                    </div>

                    <div className="analytics-usage-entry">
                        <div className="analytics-usage-entry-top">
                            <p> Dr. Edna Dayao</p>
                            <span> 87% </span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-bar-fill" style={{ width: "87%" }}></div>
                        </div>
                    </div>

                    <div className="analytics-usage-entry">
                        <div className="analytics-usage-entry-top">
                            <p> Dr. Edna Dayao</p>
                            <span> 87% </span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-bar-fill" style={{ width: "87%" }}></div>
                        </div>
                    </div>

                    <div className="analytics-usage-entry">
                        <div className="analytics-usage-entry-top">
                            <p> Dr. Edna Dayao</p>
                            <span> 87% </span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-bar-fill" style={{ width: "87%" }}></div>
                        </div>
                    </div>
                </Card>

                <Card columns={8} rows={3}>
                    <h2>Peak Usage Hours (Weekly)</h2>
                </Card>
                <Card columns={8} rows={3}>
                    <h2>Laboratory Efficiency</h2>
                </Card>

                <Card columns={16} rows={2}>

                </Card>
            </div>
        </>
    )
}

export default AnalyticsReports