"use client"

import { useState, useEffect } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface ChartData {
  time: string
  value: number
}

export function RealTimeChart() {
  const [data, setData] = useState<ChartData[]>([])

  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}/ws/realtime`)

    ws.onmessage = (event) => {
      const newData = JSON.parse(event.data)
      setData((prevData) => [...prevData.slice(-9), newData])
    }

    return () => {
      ws.close()
    }
  }, [])

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  )
}
