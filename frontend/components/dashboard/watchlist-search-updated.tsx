"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, Plus, X, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { UserService } from "@/services/user-service"

// Sample stock data for search results - only Indian stocks
const stocksData = [
  {
    symbol: "RELIANCE",
    name: "Reliance Industries Ltd.",
    price: 2850.75,
    change: 45.25,
    changePercent: 1.61,
  },
  {
    symbol: "TCS",
    name: "Tata Consultancy Services Ltd.",
    price: 3725.5,
    change: -15.3,
    changePercent: -0.41,
  },
  {
    symbol: "INFY",
    name: "Infosys Ltd.",
    price: 1475.5,
    change: 22.75,
    changePercent: 1.57,
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank Ltd.",
    price: 1680.25,
    change: 12.5,
    changePercent: 0.75,
  },
  {
    symbol: "ICICIBANK",
    name: "ICICI Bank Ltd.",
    price: 1025.8,
    change: -5.2,
    changePercent: -0.5,
  },
  {
    symbol: "BHARTIARTL",
    name: "Bharti Airtel Ltd.",
    price: 1125.45,
    change: 15.75,
    changePercent: 1.42,
  },
  {
    symbol: "HINDUNILVR",
    name: "Hindustan Unilever Ltd.",
    price: 2450.3,
    change: -12.5,
    changePercent: -0.51,
  },
  {
    symbol: "SBIN",
    name: "State Bank of India",
    price: 675.2,
    change: 8.45,
    changePercent: 1.27,
  },
  {
    symbol: "TATAMOTORS",
    name: "Tata Motors Ltd.",
    price: 825.75,
    change: 22.3,
    changePercent: 2.78,
  },
  {
    symbol: "WIPRO",
    name: "Wipro Ltd.",
    price: 475.6,
    change: -3.25,
    changePercent: -0.68,
  },
]

export function WatchlistSearch({ onStockAdded }: { onStockAdded?: () => void }) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<typeof stocksData>([])
  const [isSearching, setIsSearching] = useState(false)
  const [currentWatchlist, setCurrentWatchlist] = useState<string[]>([])

  // Fetch current watchlist on component mount
  useEffect(() => {
    const fetchCurrentWatchlist = async () => {
      if (!user) return

      try {
        const accessToken = localStorage.getItem("accessToken")
        if (!accessToken) return

        const data = await UserService.getUserWatchlist(accessToken)
        const symbols = data.watchlist.map((stock: any) => stock.symbol)
        setCurrentWatchlist(symbols)
      } catch (error) {
        console.error("Error fetching current watchlist:", error)
      }
    }

    fetchCurrentWatchlist()
  }, [user])

  const handleSearch = () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)

    // Simulate API call with a delay
    setTimeout(() => {
      const results = stocksData.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setSearchResults(results)
      setIsSearching(false)
    }, 500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const addToWatchlist = async (stock: (typeof stocksData)[0]) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add to watchlist.",
        variant: "destructive",
      })
      return
    }

    // Check if stock is already in watchlist
    if (currentWatchlist.includes(stock.symbol)) {
      toast({
        title: "Already in Watchlist",
        description: `${stock.symbol} is already in your watchlist.`,
        variant: "default",
      })
      return
    }

    try {
      const result = await UserService.addToWatchlist(localStorage.getItem("accessToken") || "", stock.symbol, stock.name)
      if (result.success) {
        toast({
          title: "Added to Watchlist",
          description: `${stock.symbol} (${stock.name}) has been added to your watchlist.`,
        })
        // Update local watchlist state
        setCurrentWatchlist(prev => [...prev, stock.symbol])
        // Trigger refresh of watchlist table
        onStockAdded?.()
      } else {
        toast({
          title: "Already in Watchlist",
          description: `${stock.symbol} is already in your watchlist.`,
          variant: "default",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add stock to watchlist.",
        variant: "destructive",
      })
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
  }

  const isInWatchlist = (symbol: string) => currentWatchlist.includes(symbol)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Stocks to Watchlist</CardTitle>
        <CardDescription>Search for stocks to add to your watchlist</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Input
              placeholder="Search by symbol or company name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-8"
            />
            {searchQuery && (
              <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={clearSearch}>
                <X className="h-4 w-4" />
                <span className="sr-only">Clear</span>
              </Button>
            )}
          </div>
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? "Searching..." : "Search"}
            <Search className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((stock) => (
                  <TableRow key={stock.symbol}>
                    <TableCell className="font-medium">{stock.symbol}</TableCell>
                    <TableCell>{stock.name}</TableCell>
                    <TableCell className="text-right">₹{stock.price.toFixed(2)}</TableCell>
                    <TableCell className={`text-right ${stock.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {stock.change >= 0 ? "+" : ""}
                      {stock.change.toFixed(2)} ({stock.change >= 0 ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%)
                    </TableCell>
                    <TableCell className="text-right">
                      {isInWatchlist(stock.symbol) ? (
                        <Button size="sm" variant="outline" disabled>
                          <Check className="mr-2 h-4 w-4" />
                          In Watchlist
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => addToWatchlist(stock)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
