import type React from "react"
import ProtectedRoute from "@/components/protected-route"
import { AccountBalanceProvider } from "@/hooks/use-account-balance"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <AccountBalanceProvider>
        <SidebarProvider>{children}</SidebarProvider>
      </AccountBalanceProvider>
    </ProtectedRoute>
  )
}
