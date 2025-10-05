"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StockChart } from "@/components/dashboard/stock-chart"
import { TradingPanel } from "@/components/dashboard/trading-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Sample stock data
const stocksData = {
  AAPL: { symbol: "AAPL", name: "Apple Inc.", currentPrice: 187.32, change: 1.25, changePercent: 0.67 },
  MSFT: { symbol: "MSFT", name: "Microsoft Corporation", currentPrice: 415.5, change: 2.1, changePercent: 0.51 },
  GOOGL: { symbol: "GOOGL", name: "Alphabet Inc.", currentPrice: 175.2, change: 0.5, changePercent: 0.29 },
  AMZN: { symbol: "AMZN", name: "Amazon.com, Inc.", currentPrice: 185.95, change: -1.2, changePercent: -0.64 },
  NVDA: { symbol: "NVDA", name: "NVIDIA Corporation", currentPrice: 950.02, change: -0.75, changePercent: -0.08 },
  "NIFTY 50": {
    symbol: "NIFTY 50",
    name: "National Stock Exchange of India Index",
    currentPrice: 22450.25,
    change: 125.75,
    changePercent: 0.56,
  },
}

export default function TradePage() {
  const searchParams = useSearchParams()
  const [stockData, setStockData] = useState(stocksData["AAPL"])
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy")

  useEffect(() => {
    const symbol = searchParams.get("symbol")
    const action = searchParams.get("action") as "buy" | "sell" | null

    if (symbol && stocksData[symbol]) {
      setStockData(stocksData[symbol])
    }

    if (action && (action === "buy" || action === "sell")) {
      setActiveTab(action)
    }
  }, [searchParams])

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Trade {stockData.symbol}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <StockChart
            symbol={stockData.symbol}
            name={stockData.name}
            currentPrice={stockData.currentPrice}
            change={stockData.change}
            changePercent={stockData.changePercent}
          />
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Trade {stockData.symbol}</CardTitle>
              <CardDescription>Current price: ${stockData.currentPrice.toFixed(2)}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "buy" | "sell")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="buy">Buy</TabsTrigger>
                  <TabsTrigger value="sell">Sell</TabsTrigger>
                </TabsList>
                <TradingPanel symbol={stockData.symbol} currentPrice={stockData.currentPrice} defaultTab={activeTab} />
              </Tabs>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Stock Information</CardTitle>
              <CardDescription>Key data about {stockData.symbol}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Open</div>
                    <div className="font-medium">${(stockData.currentPrice - Math.random() * 2).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Previous Close</div>
                    <div className="font-medium">${(stockData.currentPrice - stockData.change).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Day Range</div>
                    <div className="font-medium">
                      ${(stockData.currentPrice - Math.random() * 5).toFixed(2)} - $
                      {(stockData.currentPrice + Math.random() * 3).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">52 Week Range</div>
                    <div className="font-medium">
                      ${(stockData.currentPrice * 0.7).toFixed(2)} - ${(stockData.currentPrice * 1.2).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Volume</div>
                    <div className="font-medium">{(Math.random() * 10 + 5).toFixed(1)}M</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Avg. Volume</div>
                    <div className="font-medium">{(Math.random() * 15 + 5).toFixed(1)}M</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
