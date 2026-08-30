import {
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    ResponsiveContainer
} from 'recharts'

import './CircleChart.css'

function CircleChart({ data }) {
    const colors = ['#041c59', '#ffc641', '#041c59']

    return (
        <div className="circle-chart">
            <div className="circle-chart-graph">
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius="65%"
                            outerRadius="90%"
                            paddingAngle={0}
                            startAngle={90}
                            endAngle={-270}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={index}
                                    fill={colors[index % colors.length]}
                                />
                            ))}
                        </Pie>
                    </RechartsPieChart>
                </ResponsiveContainer>

                <div className="circle-chart-center">
                    <h2>Lab 04</h2>
                    <p>Most Used</p>
                </div>
            </div>

            <div className="circle-chart-legend">
                {data.map((entry, index) => (
                    <div className="circle-chart-legend-item" key={entry.name}>
                        <div className="circle-chart-legend-name">
                            <span
                                style={{
                                    backgroundColor: colors[index % colors.length]
                                }}
                            />
                            <p>{entry.name}</p>
                        </div>
                        <p>{entry.value}%</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default CircleChart