"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { NiftyChart } from "@/components/dashboard/nifty-chart"
import { AiChat } from "@/components/dashboard/ai-chat"
import { TradingPanel } from "@/components/dashboard/trading-panel"
import { PortfolioOverview } from "@/components/dashboard/portfolio-overview"
import { MarketNews } from "@/components/dashboard/market-news"
import { DailyAnalysis } from "@/components/dashboard/daily-analysis"
import { useAuth } from "@/contexts/auth-context"
import { UserService } from "@/services/user-service"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [portfolioData, setPortfolioData] = useState<any>(null)
  const [watchlistData, setWatchlistData] = useState<any>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Sample Nifty data
  const niftyData = {
    symbol: "NIFTY 50",
    name: "National Stock Exchange of India Index",
    currentPrice: 22450.25,
    change: 125.75,
    changePercent: 0.56,
  }

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      setError(null)

      try {
        const accessToken = localStorage.getItem("accessToken")
        if (!accessToken) {
          throw new Error("No access token found")
        }

        // Fetch user portfolio and watchlist data
        const [portfolio, watchlist] = await Promise.all([
          UserService.getUserPortfolio(accessToken),
          UserService.getUserWatchlist(accessToken),
        ])

        setPortfolioData(portfolio)
        setWatchlistData(watchlist)
      } catch (err) {
        console.error("Error fetching user data:", err)
        setError("Failed to load your dashboard data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchUserData()
    } else {
      setLoading(false)
    }
  }, [user, retryCount])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  return (
    <DashboardLayout>
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
          <Skeleton className="col-span-3 h-[500px]" />
          <Skeleton className="h-[500px]" />
          <Skeleton className="col-span-2 h-[400px]" />
          <Skeleton className="col-span-2 h-[400px]" />
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      ) : error ? (
        <div>
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={handleRetry} className="ml-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
            <NiftyChart
              symbol={niftyData.symbol}
              name={niftyData.name}
              currentPrice={niftyData.currentPrice}
              change={niftyData.change}
              changePercent={niftyData.changePercent}
            />
            <TradingPanel symbol="NIFTY 50" currentPrice={niftyData.currentPrice} />
            <MarketNews />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
          <NiftyChart
            symbol={niftyData.symbol}
            name={niftyData.name}
            currentPrice={niftyData.currentPrice}
            change={niftyData.change}
            changePercent={niftyData.changePercent}
          />
          <TradingPanel symbol="NIFTY 50" currentPrice={niftyData.currentPrice} />
          <PortfolioOverview portfolioData={portfolioData} />
          <DailyAnalysis />
          <AiChat />
          <MarketNews />
        </div>
      )}
    </DashboardLayout>
  )
}
