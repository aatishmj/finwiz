"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PortfolioChart } from "@/components/dashboard/portfolio-chart"
import { PortfolioPerformance } from "@/components/dashboard/portfolio-performance"
import { PortfolioTransactions } from "@/components/dashboard/portfolio-transactions"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAccountBalance } from "@/hooks/use-account-balance"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TradingPanel } from "@/components/dashboard/trading-panel"
import { Loader2 } from "lucide-react"

interface PortfolioHolding {
  symbol: string
  name: string
  shares: number
  avgPrice: number
  totalCost: number
  currentPrice?: number
  marketValue?: number
  totalReturn?: number
  totalReturnPercent?: number
  dayChange?: number
  dayChangePercent?: number
}

export default function PortfolioPage() {
  const { toast } = useToast()
  const { balance, transactions, refreshData } = useAccountBalance()
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStock, setSelectedStock] = useState<PortfolioHolding | null>(null)
  const [showSellDialog, setShowSellDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPortfolio = async () => {
      setLoading(true)
      setError(null)

      try {
        const accessToken = localStorage.getItem("accessToken")
        if (!accessToken) {
          throw new Error("No access token found")
        }

        const response = await fetch("/api/user/portfolio", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch portfolio")
        }

        const data = await response.json()
        console.log("Portfolio data:", data)

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch portfolio")
        }

        // Transform portfolio data and add current prices (in a real app, these would come from an API)
        const portfolioHoldings = data.portfolio.holdings.map((holding: PortfolioHolding) => {
          // Simulate current price with a random variation from avg price
          const priceVariation = Math.random() * 0.2 - 0.1 // -10% to +10%
          const currentPrice = holding.avgPrice * (1 + priceVariation)
          const marketValue = holding.shares * currentPrice
          const totalReturn = marketValue - holding.totalCost
          const totalReturnPercent = (totalReturn / holding.totalCost) * 100

          // Simulate day change
          const dayChangePercent = Math.random() * 4 - 2 // -2% to +2%
          const dayChange = marketValue * (dayChangePercent / 100)

          return {
            ...holding,
            currentPrice,
            marketValue,
            totalReturn,
            totalReturnPercent,
            dayChange,
            dayChangePercent,
          }
        })

        setHoldings(portfolioHoldings)
      } catch (error) {
        console.error("Error fetching portfolio:", error)
        setError("Failed to load portfolio data. Please try again later.")
        setHoldings([])
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolio()
  }, [toast, transactions])

  const handleSellClick = (stock: PortfolioHolding) => {
    setSelectedStock(stock)
    setShowSellDialog(true)
  }

  const totalPortfolioValue = holdings.reduce((sum, stock) => sum + (stock.marketValue || 0), 0)
  const totalDayChange = holdings.reduce((sum, stock) => sum + (stock.dayChange || 0), 0)
  const totalDayChangePercent = totalPortfolioValue > 0 ? (totalDayChange / totalPortfolioValue) * 100 : 0
  const totalReturn = holdings.reduce((sum, stock) => sum + (stock.totalReturn || 0), 0)
  const totalInvestment = holdings.reduce((sum, stock) => sum + stock.totalCost, 0)
  const totalReturnPercent = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Portfolio</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Portfolio Value</CardTitle>
            <CardDescription>Your portfolio performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <PortfolioChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Your portfolio at a glance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Value</div>
                <div className="text-2xl font-bold">₹{totalPortfolioValue.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Today's Change</div>
                <div className={`text-2xl font-bold ${totalDayChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {totalDayChange >= 0 ? "+" : ""}
                  {totalDayChange.toFixed(2)} ({totalDayChange >= 0 ? "+" : ""}
                  {totalDayChangePercent.toFixed(2)}%)
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Return</div>
                <div className={`text-2xl font-bold ${totalReturn >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {totalReturn >= 0 ? "+" : ""}
                  {totalReturn.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Return %</div>
                <div className={`text-2xl font-bold ${totalReturnPercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {totalReturnPercent >= 0 ? "+" : ""}
                  {totalReturnPercent.toFixed(2)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="holdings" className="mt-6">
        <TabsList>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="holdings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Holdings</CardTitle>
              <CardDescription>Stocks you currently own</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500">{error}</p>
                  <Button className="mt-4" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              ) : holdings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">You don't have any stocks in your portfolio yet.</p>
                  <Button className="mt-4" onClick={() => (window.location.href = "/dashboard/trade")}>
                    Start Trading
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Shares</TableHead>
                      <TableHead className="text-right">Avg. Cost</TableHead>
                      <TableHead className="text-right">Current Price</TableHead>
                      <TableHead className="text-right">Market Value</TableHead>
                      <TableHead className="text-right">Today's Change</TableHead>
                      <TableHead className="text-right">Total Return</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holdings.map((stock, idx) => (
                      <TableRow key={stock.symbol || idx}>
                        <TableCell className="font-medium">{stock.symbol}</TableCell>
                        <TableCell>{stock.name}</TableCell>
                        <TableCell className="text-right">{stock.shares}</TableCell>
                        <TableCell className="text-right">
                          ₹{typeof stock.avgPrice === "number" ? stock.avgPrice.toFixed(2) : "-"}
                        </TableCell>
                        <TableCell className="text-right">₹{stock.currentPrice?.toFixed(2) || "-"}</TableCell>
                        <TableCell className="text-right">₹{stock.marketValue?.toFixed(2) || "-"}</TableCell>
                        <TableCell
                          className={`text-right ${(stock.dayChangePercent || 0) >= 0 ? "text-green-500" : "text-red-500"}`}
                        >
                          {(stock.dayChangePercent || 0) >= 0 ? "+" : ""}
                          {stock.dayChangePercent?.toFixed(2) || 0}%
                        </TableCell>
                        <TableCell
                          className={`text-right ${(stock.totalReturnPercent || 0) >= 0 ? "text-green-500" : "text-red-500"}`}
                        >
                          {(stock.totalReturnPercent || 0) >= 0 ? "+" : ""}
                          {stock.totalReturnPercent?.toFixed(2) || 0}%
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                (window.location.href = `/dashboard/trade?symbol=${stock.symbol}&action=buy`)
                              }
                            >
                              Buy
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleSellClick(stock)}>
                              Sell
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="performance" className="mt-4">
          <PortfolioPerformance />
        </TabsContent>
        <TabsContent value="transactions" className="mt-4">
          <PortfolioTransactions />
        </TabsContent>
      </Tabs>

      {/* Sell Dialog */}
      <Dialog open={showSellDialog} onOpenChange={setShowSellDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sell {selectedStock?.symbol}</DialogTitle>
            <DialogDescription>Sell shares of {selectedStock?.name}</DialogDescription>
          </DialogHeader>
          {selectedStock && (
            <TradingPanel
              symbol={selectedStock.symbol}
              currentPrice={selectedStock.currentPrice || selectedStock.avgPrice}
              defaultTab="sell"
              maxShares={selectedStock.shares}
              onTradeComplete={() => {
                setShowSellDialog(false)
                refreshData()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
