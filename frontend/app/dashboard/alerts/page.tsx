"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"

interface Alert {
  id: string
  type: "price" | "news" | "system"
  title: string
  message: string
  timestamp: string
  read: boolean
}

export default function AlertsPage() {
  // Mock alerts data
  const alerts: Alert[] = [
    {
      id: "1",
      type: "price",
      title: "Price Alert: AAPL",
      message: "Apple Inc. has reached your target price of ₹180",
      timestamp: "2024-01-15 10:30 AM",
      read: false,
    },
    {
      id: "2",
      type: "news",
      title: "Market News",
      message: "NIFTY 50 hits all-time high of 22,000 points",
      timestamp: "2024-01-15 09:15 AM",
      read: false,
    },
    {
      id: "3",
      type: "system",
      title: "System Maintenance",
      message: "Scheduled maintenance will occur tonight from 2 AM to 4 AM IST",
      timestamp: "2024-01-14 06:00 PM",
      read: true,
    },
  ]

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "price":
        return <TrendingUp className="h-5 w-5" />
      case "news":
        return <Bell className="h-5 w-5" />
      case "system":
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case "price":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "news":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "system":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Alerts</h1>
        <Button variant="outline">Mark All as Read</Button>
      </div>

      <div className="space-y-4">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <Card key={alert.id} className={alert.read ? "opacity-60" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-full ${getAlertColor(alert.type)}`}>
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{alert.title}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant={alert.read ? "secondary" : "default"}>
                          {alert.read ? "Read" : "New"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{alert.timestamp}</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground">{alert.message}</p>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      {!alert.read && (
                        <Button size="sm" variant="ghost">
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No alerts yet</h3>
                <p className="text-muted-foreground">
                  You don't have any alerts at the moment. Set up price alerts to stay informed about your stocks.
                </p>
                <Button className="mt-4">Set Up Alerts</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
