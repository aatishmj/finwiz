"use client"

import {
  Briefcase,
  CreditCard,
  DollarSign,
  Home,
  List,
  MessageSquare,
  TrendingUp,
  Globe,
  Settings,
  HelpCircle,
  Bell,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { useAccountBalance } from "@/hooks/use-account-balance"

export function DashboardNav() {
  const { balance } = useAccountBalance()

  return (
    <Sidebar>
      <SidebarHeader className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2 font-semibold">
          <TrendingUp className="h-6 w-6 text-primary" />
          <span>StockSense</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/dashboard">
                <Home className="h-5 w-5" />
                <span>Dashboard</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <div className="px-3 py-2">
            <h3 className="mb-2 text-xs font-medium text-muted-foreground">Markets</h3>
          </div>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/dashboard/market/india">
                <Globe className="h-5 w-5" />
                <span>Indian Markets</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <div className="px-3 py-2">
            <h3 className="mb-2 text-xs font-medium text-muted-foreground">Personal</h3>
          </div>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/dashboard/portfolio">
                <Briefcase className="h-5 w-5" />
                <span>Portfolio</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/dashboard/wallet">
                <CreditCard className="h-5 w-5" />
                <span>Wallet</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/dashboard/watchlist">
                <List className="h-5 w-5" />
                <span>Watchlist</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/dashboard/trade">
                <DollarSign className="h-5 w-5" />
                <span>Trade</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/dashboard/transactions">
                <CreditCard className="h-5 w-5" />
                <span>Transactions</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <div className="px-3 py-2">
            <h3 className="mb-2 text-xs font-medium text-muted-foreground">Tools</h3>
          </div>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/dashboard/ai-assistant">
                <MessageSquare className="h-5 w-5" />
                <span>AI Assistant</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/dashboard/alerts">
                <Bell className="h-5 w-5" />
                <span>Alerts</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <div className="px-3 py-2">
            <h3 className="mb-2 text-xs font-medium text-muted-foreground">Account</h3>
          </div>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/dashboard/settings">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/dashboard/help">
                <HelpCircle className="h-5 w-5" />
                <span>Help & Support</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t p-6">
        <div className="grid gap-1">
          <div className="text-xs font-medium">Account Balance</div>
          <div className="text-xl font-bold">₹{balance.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">+₹452.35 (1.8%) today</div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
