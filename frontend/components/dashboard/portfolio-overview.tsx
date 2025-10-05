"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Default portfolio data if none is provided
const defaultPortfolioData = [
  { name: "AAPL", value: 35, shares: 25, price: 187.32, change: 1.25 },
  { name: "MSFT", value: 25, shares: 12, price: 415.5, change: 2.1 },
  { name: "NVDA", value: 20, shares: 8, price: 950.02, change: -0.75 },
  { name: "GOOGL", value: 15, shares: 10, price: 175.2, change: 0.5 },
  { name: "AMZN", value: 5, shares: 3, price: 185.95, change: -1.2 },
]

// Colors for the pie chart
const COLORS = ["#4f46e5", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316"]

interface PortfolioOverviewProps {
  portfolioData?: any
}

export function PortfolioOverview({ portfolioData }: PortfolioOverviewProps) {
  // Use provided data or default if none is available
  const data = portfolioData?.holdings || defaultPortfolioData

  // Calculate total value and percentages for pie chart
  const totalValue = data.reduce((sum: number, stock: any) => sum + stock.shares * stock.price, 0)

  // Create data for pie chart with correct percentages
  const pieData = data.map((stock: any) => {
    const stockValue = stock.shares * stock.price
    const percentage = (stockValue / totalValue) * 100
    return {
      ...stock,
      value: Math.round(percentage), // Use percentage for pie chart
    }
  })

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Portfolio Overview</CardTitle>
        <CardDescription>Your current holdings and allocation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col items-center justify-center">
            <div className="h-60 w-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Allocation"]}
                    labelFormatter={(index) => pieData[index as number].name}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <div className="text-sm text-muted-foreground">Total Portfolio Value</div>
              <div className="text-2xl font-bold">₹{totalValue.toFixed(2)}</div>
            </div>
          </div>
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((stock: any) => (
                  <TableRow key={stock.name}>
                    <TableCell className="font-medium">{stock.name}</TableCell>
                    <TableCell className="text-right">{stock.shares}</TableCell>
                    <TableCell className="text-right">₹{stock.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{(stock.shares * stock.price).toFixed(2)}</TableCell>
                    <TableCell className={`text-right ${stock.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {stock.change >= 0 ? "+" : ""}
                      {stock.change}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
