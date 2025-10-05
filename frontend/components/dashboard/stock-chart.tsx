"use client"

import type React from "react"

import { useState } from "react"
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Sample data for the candle chart
const generateCandleData = (days: number, startPrice: number, volatility: number) => {
  const data = []
  let prevClose = startPrice

  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - i - 1))

    // Generate random price movements
    const changePercent = (Math.random() - 0.5) * volatility
    const range = prevClose * 0.02 // 2% of previous close for high-low range

    // Calculate OHLC values
    const open = prevClose
    const close = prevClose * (1 + changePercent)
    const high = Math.max(open, close) + Math.random() * range
    const low = Math.min(open, close) - Math.random() * range

    // Volume is random but correlates with price change magnitude
    const volume = 1000000 + Math.abs(changePercent) * 10000000

    data.push({
      date: date.toISOString().split("T")[0],
      open: Number.parseFloat(open.toFixed(2)),
      high: Number.parseFloat(high.toFixed(2)),
      low: Number.parseFloat(low.toFixed(2)),
      close: Number.parseFloat(close.toFixed(2)),
      volume: Math.round(volume),
      // For area/line charts
      price: Number.parseFloat(close.toFixed(2)),
    })

    prevClose = close
  }

  return data
}

// Custom candle stick component
const CandleStick = (props: any) => {
  const { x, width, low, high, open, close, yScale } = props
  const isRising = close > open
  const color = isRising ? "var(--chart-green)" : "var(--chart-red)"
  const halfWidth = width / 2

  // Calculate SVG y coordinates using yScale function
  const yLow = yScale(low)
  const yHigh = yScale(high)
  const yOpen = yScale(open)
  const yClose = yScale(close)

  return (
    <g>
      {/* Wick line */}
      <line x1={x + halfWidth} y1={yHigh} x2={x + halfWidth} y2={yLow} stroke={color} strokeWidth={1} />
      {/* Candle body */}
      <rect
        x={x}
        y={isRising ? yClose : yOpen}
        width={width}
        height={Math.abs(yOpen - yClose)}
        fill={color}
        stroke={color}
      />
    </g>
  )
}

// Custom tooltip for candle chart
const CandleTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-background p-2 border rounded shadow-sm text-xs">
        <p className="font-bold">{data.date}</p>
        <p>Open: ₹{data.open}</p>
        <p>High: ₹{data.high}</p>
        <p>Low: ₹{data.low}</p>
        <p>Close: ₹{data.close}</p>
        <p>Volume: {(data.volume / 1000000).toFixed(2)}M</p>
      </div>
    )
  }
  return null
}

const timeRanges = [
  { label: "1D", days: 1 },
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "1Y", days: 365 },
  { label: "All", days: 1825 },
]

const chartTypes = [
  { value: "candle", label: "Candle" },
  { value: "area", label: "Area" },
  { value: "line", label: "Line" },
  { value: "bar", label: "Bar" },
]

interface StockChartProps {
  symbol: string
  name: string
  currentPrice: number
  change: number
  changePercent: number
}

export function StockChart({ symbol, name, currentPrice, change, changePercent }: StockChartProps) {
  const [selectedRange, setSelectedRange] = useState("1M")
  const [chartType, setChartType] = useState("area")
  const range = timeRanges.find((r) => r.label === selectedRange) || timeRanges[2]

  const chartData = generateCandleData(range.days, currentPrice - change * (range.days / 30), 0.02)

  const isPositive = change >= 0
  const chartColor = isPositive ? "hsl(var(--chart-1))" : "hsl(var(--chart-3))"

  // Add CSS variables for candle colors
  const chartStyles = {
    "--chart-green": "hsl(142.1, 76.2%, 36.3%)",
    "--chart-red": "hsl(0, 84.2%, 60.2%)",
  } as React.CSSProperties

  const renderChart = () => {
    switch (chartType) {
      case "candle":
        return (
          <ResponsiveContainer width="100%" height="100%" style={chartStyles}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => {
                  if (range.days <= 7) {
                    return new Date(value).toLocaleDateString(undefined, { weekday: "short" })
                  } else if (range.days <= 90) {
                    return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                  } else {
                    return new Date(value).toLocaleDateString(undefined, { month: "short", year: "2-digit" })
                  }
                }}
              />
              <YAxis
                domain={["auto", "auto"]}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `₹${value}`}
              />
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <Tooltip content={<CandleTooltip />} />
          {chartData.map((entry, index) => (
            <CandleStick
              key={`candle-${index}`}
              x={index * (100 / chartData.length)}
              width={0.5 * (100 / chartData.length)}
              yScale={(value: number) => {
                // Map data value to SVG coordinate (invert y-axis)
                const minY = 0
                const maxY = 300 // height of chart container in px
                const minValue = Math.min(...chartData.map((d) => d.low))
                const maxValue = Math.max(...chartData.map((d) => d.high))
                return maxY - ((value - minValue) / (maxValue - minValue)) * (maxY - minY)
              }}
              low={entry.low}
              high={entry.high}
              open={entry.open}
              close={entry.close}
            />
          ))}
            </LineChart>
          </ResponsiveContainer>
        )
      case "line":
        return (
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => {
                if (range.days <= 7) {
                  return new Date(value).toLocaleDateString(undefined, { weekday: "short" })
                } else if (range.days <= 90) {
                  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                } else {
                  return new Date(value).toLocaleDateString(undefined, { month: "short", year: "2-digit" })
                }
              }}
            />
            <YAxis domain={["auto", "auto"]} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="close" stroke={chartColor} strokeWidth={2} dot={false} />
          </LineChart>
        )
      case "bar":
        return (
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => {
                if (range.days <= 7) {
                  return new Date(value).toLocaleDateString(undefined, { weekday: "short" })
                } else if (range.days <= 90) {
                  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                } else {
                  return new Date(value).toLocaleDateString(undefined, { month: "short", year: "2-digit" })
                }
              }}
            />
            <YAxis domain={["auto", "auto"]} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="close" fill={chartColor} />
          </BarChart>
        )
      default:
        return (
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => {
                if (range.days <= 7) {
                  return new Date(value).toLocaleDateString(undefined, { weekday: "short" })
                } else if (range.days <= 90) {
                  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                } else {
                  return new Date(value).toLocaleDateString(undefined, { month: "short", year: "2-digit" })
                }
              }}
            />
            <YAxis domain={["auto", "auto"]} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey="close" stroke={chartColor} fillOpacity={1} fill="url(#colorPrice)" />
          </AreaChart>
        )
    }
  }

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold">{symbol}</CardTitle>
          <CardDescription>{name}</CardDescription>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-2xl font-bold">₹{currentPrice.toFixed(2)}</div>
          <div className={`flex items-center text-sm ${isPositive ? "text-green-500" : "text-red-500"}`}>
            {isPositive ? "+" : ""}
            {change.toFixed(2)} ({isPositive ? "+" : ""}
            {changePercent.toFixed(2)}%)
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Chart Type" />
            </SelectTrigger>
            <SelectContent>
              {chartTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="h-[400px]">
          <ChartContainer
            config={{
              price: {
                label: "Price",
                color: chartColor,
              },
            }}
          >
            {renderChart()}
          </ChartContainer>
        </div>
        <Tabs value={selectedRange} onValueChange={setSelectedRange} className="mt-4">
          <TabsList className="grid w-full grid-cols-6">
            {timeRanges.map((range) => (
              <TabsTrigger key={range.label} value={range.label}>
                {range.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardContent>
    </Card>
  )
}
