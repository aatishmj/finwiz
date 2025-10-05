"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { WatchlistTable } from "@/components/dashboard/watchlist-table"
import { WatchlistSearch } from "@/components/dashboard/watchlist-search"
import { useState } from "react"

export default function WatchlistPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleWatchlistUpdate = () => {
    console.log("Watchlist updated, incrementing refreshTrigger")
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Watchlist</h1>
      </div>

      <WatchlistSearch onStockAdded={handleWatchlistUpdate} />

      <div className="mt-6">
        <WatchlistTable refreshTrigger={refreshTrigger} />
      </div>
    </DashboardLayout>
  )
}
