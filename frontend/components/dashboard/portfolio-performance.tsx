"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// Sample performance data
const performanceData = [
  { period: "1 Day", value: 1.8, amount: 452.35 },
  { period: "1 Week", value: 2.3, amount: 575.82 },
  { period: "1 Month", value: 4.7, amount: 1175.5 },
  { period: "3 Months", value: 8.2, amount: 2050.25 },
  { period: "YTD", value: 12.5, amount: 3125.75 },
  { period: "1 Year", value: 15.2, amount: 3800.0 },
]

// Sample sector allocation data
const sectorData = [
  { name: "Technology", value: 45 },
  { name: "Healthcare", value: 15 },
  { name: "Consumer Cyclical", value: 12 },
  { name: "Financial Services", value: 10 },
  { name: "Communication Services", value: 8 },
  { name: "Industrials", value: 5 },
  { name: "Other", value: 5 },
]

export function PortfolioPerformance() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
          <CardDescription>Your portfolio performance over different time periods</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Return %</TableHead>
                <TableHead className="text-right">Return $</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceData.map((item) => (
                <TableRow key={item.period}>
                  <TableCell className="font-medium">{item.period}</TableCell>
                  <TableCell className={`text-right ${item.value >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {item.value >= 0 ? "+" : ""}
                    {item.value.toFixed(2)}%
                  </TableCell>
                  <TableCell className={`text-right ${item.amount >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {item.amount >= 0 ? "+" : ""}${Math.abs(item.amount).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sector Allocation</CardTitle>
          <CardDescription>Your portfolio distribution across sectors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={(value) => `${value}%`} />
                <YAxis type="category" dataKey="name" width={120} />
                <Tooltip formatter={(value) => [`${value}%`, "Allocation"]} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
