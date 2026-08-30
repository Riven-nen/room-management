import {
    BarChart as RechartsBarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'

function BarChart({ data }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <Tooltip />
                <Bar dataKey="value">
                    {data.map((entry, index) => (
                        <Cell
                            key={index}
                            fill={index % 2 === 0 ? '#071f5c' : '#ffc641'}
                        />
                    ))}
                </Bar>
            </RechartsBarChart>
        </ResponsiveContainer>
    )
}

export default BarChart