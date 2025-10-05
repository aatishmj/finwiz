"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Bell, ChevronDown, LogOut, Menu, Moon, Settings, Sun, User } from "lucide-react"
import { useTheme } from "next-themes"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardNav } from "./dashboard-nav"
import { SidebarOverlay } from "./sidebar-overlay"
import { AccountBalanceProvider } from "@/hooks/use-account-balance"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { theme, setTheme } = useTheme()
  const [notifications] = useState(3)
  const { user, logout, refreshToken } = useAuth()
  const router = useRouter()

  // Add token refresh interval to prevent session expiration
  useEffect(() => {
    // Refresh token every 15 minutes
    const refreshInterval = setInterval(
      () => {
        refreshToken()
      },
      15 * 60 * 1000,
    )

    return () => clearInterval(refreshInterval)
  }, [refreshToken])

  const handleProfileClick = () => {
    router.push("/dashboard/profile")
  }

  return (
    <AccountBalanceProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
            <SidebarTrigger className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </SidebarTrigger>
            <div className="flex items-center gap-2 md:ml-auto md:gap-4">
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {notifications}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
              <Button variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span className="sr-only">Toggle theme</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 md:pr-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" alt={user?.username || "User"} />
                      <AvatarFallback>{user?.username?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="hidden flex-col items-start md:flex">
                      <span className="text-sm font-medium">{user?.username || "Loading..."}</span>
                      <span className="text-xs text-muted-foreground">{user?.email || "Loading..."}</span>
                    </div>
                    <ChevronDown className="hidden h-4 w-4 md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleProfileClick}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <div className="flex flex-1">
            <DashboardNav />
            <SidebarOverlay />
            <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </AccountBalanceProvider>
  )
}
