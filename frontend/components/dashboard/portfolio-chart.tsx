"use client"

import { useState } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Sample data for the chart
const generatePortfolioData = (days: number, startValue: number, volatility: number) => {
  const data = []
  let value = startValue

  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - i - 1))

    // Add some randomness to the value
    const change = (Math.random() - 0.4) * volatility // Slightly biased towards positive
    value = Math.max(100, value * (1 + change))

    data.push({
      date: date.toISOString().split("T")[0],
      value: Number.parseFloat(value.toFixed(2)),
    })
  }

  return data
}

const timeRanges = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "YTD", days: 172 }, // Approximately YTD for mid-year
  { label: "1Y", days: 365 },
  { label: "All", days: 1095 }, // 3 years
]

export function PortfolioChart() {
  const [selectedRange, setSelectedRange] = useState("1M")
  const range = timeRanges.find((r) => r.label === selectedRange) || timeRanges[1]

  const chartData = generatePortfolioData(range.days, 20000, 0.01)
  const startValue = chartData[0].value
  const endValue = chartData[chartData.length - 1].value
  const change = endValue - startValue
  const percentChange = (change / startValue) * 100

  const isPositive = change >= 0

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-1">
        <div className="text-2xl font-bold">${endValue.toFixed(2)}</div>
        <div className={`flex items-center text-sm ${isPositive ? "text-green-500" : "text-red-500"}`}>
          {isPositive ? "+" : ""}
          {change.toFixed(2)} ({isPositive ? "+" : ""}
          {percentChange.toFixed(2)}%)
          <span className="ml-2 text-muted-foreground">{range.label}</span>
        </div>
      </div>

      <div className="h-[300px]">
        <ChartContainer
          config={{
            value: {
              label: "Portfolio Value",
              color: isPositive ? "hsl(var(--chart-1))" : "hsl(var(--chart-3))",
            },
          }}
        >
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isPositive ? "hsl(var(--chart-1))" : "hsl(var(--chart-3))"}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={isPositive ? "hsl(var(--chart-1))" : "hsl(var(--chart-3))"}
                  stopOpacity={0}
                />
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
            <YAxis
              domain={["auto", "auto"]}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? "hsl(var(--chart-1))" : "hsl(var(--chart-3))"}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ChartContainer>
      </div>

      <div className="flex flex-wrap gap-2">
        {timeRanges.map((range) => (
          <Button
            key={range.label}
            variant={selectedRange === range.label ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedRange(range.label)}
          >
            {range.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
