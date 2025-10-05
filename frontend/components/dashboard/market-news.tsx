"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NewsItem {
  id: string
  title: string
  content: string
  summary?: string
  source: string
  date: string
  url?: string
  category?: string
  tags?: string[]
}

export function MarketNews() {
  const { toast } = useToast()
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchNews = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch news from API route
      const accessToken = localStorage.getItem("accessToken")
      if (!accessToken) {
        throw new Error("No access token found")
      }

      const response = await fetch("/api/news", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch news")
      }

      const data = await response.json()
      console.log("News data:", data)

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch news")
      }

      setNews(data.news || [])
    } catch (error) {
      console.error("Error fetching news:", error)
      setError("Failed to load news. Please try again later.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchNews()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Market News</CardTitle>
          <CardDescription>Latest financial news and updates</CardDescription>
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading || refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          <span className="sr-only">Refresh</span>
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="border-b pb-4 last:border-0">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground">
              <p>{error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {news.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                  <p>No news available at the moment.</p>
                </div>
              ) : (
                news.map((item) => (
                  <div key={item.id} className="border-b pb-4 last:border-0">
                    <h3 className="font-semibold">{item.title}</h3>
                    <div className="mt-1 flex items-center text-xs text-muted-foreground">
                      <span>{item.source}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDate(item.date)}</span>
                    </div>
                    <p className="mt-2 text-sm">{item.summary || item.content}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
