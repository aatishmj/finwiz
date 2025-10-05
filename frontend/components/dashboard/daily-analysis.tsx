"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { AIService } from "@/services/ai-service"
import { useAuth } from "@/contexts/auth-context"
import ReactMarkdown from "react-markdown"

export function DailyAnalysis() {
  const { user } = useAuth()
  const [analysis, setAnalysis] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnalysis = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const analysisText = await AIService.generateMarketAnalysis()
      setAnalysis(analysisText)
    } catch (error) {
      console.error("Error fetching market analysis:", error)
      setError("Failed to load market analysis. Please try again later.")

      // Fallback analysis
      setAnalysis(`
# Daily Market Analysis

## Market Overview
Markets are showing mixed signals today with technology stocks leading gains while energy sectors face pressure from changing commodity prices.

## Key Trends
- Tech sector continues to show resilience amid economic uncertainty
- Interest rate expectations are shifting as new economic data emerges
- Global supply chains are stabilizing, potentially easing inflationary pressures

## Recommendations
Consider maintaining a diversified portfolio with exposure to both growth and value stocks. The current environment favors quality companies with strong balance sheets and consistent cash flows.
      `)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalysis()
  }, [user])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchAnalysis()
  }

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Daily Market Analysis</CardTitle>
          <CardDescription>AI-powered insights for today's market</CardDescription>
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading || refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          <span className="sr-only">Refresh</span>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-6 w-1/2 mt-6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-center text-muted-foreground">
            <p>{error}</p>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{analysis}</ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
