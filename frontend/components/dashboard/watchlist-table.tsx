"use client"

import { useState, useEffect } from "react"
import { EyeOff, ArrowUpDown, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { UserService } from "@/services/user-service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TradingPanel } from "./trading-panel"

type Stock = {
  symbol: string
  name: string
  price?: number
  change?: number
  changePercent?: number
  volume?: number
  marketCap?: string
  market?: string
}

type SortField = "symbol" | "price" | "change" | "volume" | "marketCap"
type SortDirection = "asc" | "desc"

export function WatchlistTable({ refreshTrigger }: { refreshTrigger?: number }) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [watchlist, setWatchlist] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>("symbol")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)

  // Fetch watchlist on component mount
  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!user) return

      try {
        const accessToken = localStorage.getItem("accessToken")
        if (!accessToken) return

        const data = await UserService.getUserWatchlist(accessToken)
        console.log("Watchlist data from API:", data)
        // Transform the data to include price information (you might want to fetch real prices)
        const enrichedStocks = data.watchlist.stocks.map((stock: any) => ({
          ...stock,
          price: 1000 + Math.random() * 2000, // Mock price
          change: (Math.random() - 0.5) * 100,
          changePercent: (Math.random() - 0.5) * 5,
          volume: Math.floor(Math.random() * 10000000),
          marketCap: "N/A",
          market: "india",
        }))
        console.log("Enriched stocks:", enrichedStocks)
        setWatchlist(enrichedStocks)
      } catch (error) {
        console.error("Error fetching watchlist:", error)
        toast({
          title: "Error",
          description: "Failed to load watchlist",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    console.log("WatchlistTable: refreshTrigger changed to", refreshTrigger)
fetchWatchlist()
  }, [user, toast, refreshTrigger])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Sort the watchlist
  const sortedWatchlist = [...watchlist].sort((a, b) => {
    let comparison = 0

    switch (sortField) {
      case "symbol":
        comparison = a.symbol.localeCompare(b.symbol)
        break
      case "price":
        comparison = (a.price || 0) - (b.price || 0)
        break
      case "change":
        comparison = (a.changePercent || 0) - (b.changePercent || 0)
        break
      case "volume":
        comparison = (a.volume || 0) - (b.volume || 0)
        break
      case "marketCap":
        comparison = 0 // Keep as is for now
        break
    }

    return sortDirection === "asc" ? comparison : -comparison
  })

  const removeFromWatchlist = async (symbol: string) => {
    if (!user) return

    try {
      const accessToken = localStorage.getItem("accessToken")
      if (!accessToken) return

      await UserService.removeFromWatchlist(accessToken, symbol)
      setWatchlist(watchlist.filter((stock) => stock.symbol !== symbol))
      toast({
        title: "Removed from Watchlist",
        description: `${symbol} has been removed from your watchlist.`,
      })
    } catch (error) {
      console.error("Error removing from watchlist:", error)
      toast({
        title: "Error",
        description: "Failed to remove stock from watchlist",
        variant: "destructive",
      })
    }
  }

  const openTradeDialog = (stock: Stock) => {
    setSelectedStock(stock)
  }

  // Function to view stock chart
  const viewStockChart = (symbol: string) => {
    window.location.href = `/dashboard/trade?symbol=${symbol}`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Watchlist</CardTitle>
          <CardDescription>Loading your watchlist...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Watchlist</CardTitle>
        <CardDescription>Stocks you're monitoring</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("symbol")}>
                    Symbol
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort("price")}>
                    Price
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort("change")}>
                    Change
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort("volume")}>
                    Volume
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedWatchlist.length > 0 ? (
                sortedWatchlist.map((stock) => (
                  <TableRow key={stock.symbol} className="cursor-pointer" onClick={() => viewStockChart(stock.symbol)}>
                    <TableCell className="font-medium">{stock.symbol}</TableCell>
                    <TableCell>{stock.name}</TableCell>
                    <TableCell className="text-right">
                      ₹{stock.price ? stock.price.toFixed(2) : "N/A"}
                    </TableCell>
                    <TableCell
                      className={`text-right ${
                        (stock.change || 0) >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {(stock.change || 0) >= 0 ? "+" : ""}
                      {stock.change ? stock.change.toFixed(2) : "0.00"} (
                      {(stock.changePercent || 0) >= 0 ? "+" : ""}
                      {stock.changePercent ? stock.changePercent.toFixed(2) : "0.00"}%)
                    </TableCell>
                    <TableCell className="text-right">
                      {stock.volume ? `${(stock.volume / 1_000_000).toFixed(1)}M` : "-"}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="outline" onClick={() => openTradeDialog(stock)}>
                              <DollarSign className="h-4 w-4" />
                              <span className="sr-only">Trade</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Trade {selectedStock?.symbol}</DialogTitle>
                              <DialogDescription>Buy or sell {selectedStock?.name} shares</DialogDescription>
                            </DialogHeader>
                            {selectedStock && (
                              <TradingPanel
                                symbol={selectedStock.symbol}
                                currentPrice={selectedStock.price || 0}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button size="icon" variant="outline" onClick={() => removeFromWatchlist(stock.symbol)}>
                          <EyeOff className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Your watchlist is empty. Search for stocks to add them to your watchlist.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
