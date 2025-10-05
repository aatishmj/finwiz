"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "./use-toast"

export interface Transaction {
  id: string
  date: string
  type: "Buy" | "Sell" | "Dividend" | "Deposit" | "Withdrawal"
  symbol: string
  name: string
  shares: number
  price: number
  amount: number
}

interface AccountBalanceContextType {
  balance: number
  updateBalance: (newBalance: number) => void
  transactions: Transaction[]
  addTransaction: (transaction: Transaction) => void
  isLoading: boolean
  refreshData: () => void
}

const AccountBalanceContext = createContext<AccountBalanceContextType | undefined>(undefined)

export function AccountBalanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Fetch user balance and transactions from API
  useEffect(() => {
    const fetchUserFinancialData = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const accessToken = localStorage.getItem("accessToken")
        if (!accessToken) {
          throw new Error("No access token found")
        }

        // Fetch user balance
        const balanceResponse = await fetch("/api/user/balance", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        let balanceData: any = {}
        try {
          balanceData = await balanceResponse.json()
        } catch {
          // If parsing fails, balanceData stays as {}
        }

        if (!balanceResponse.ok) {
          throw new Error(balanceData.error || "Failed to fetch balance")
        }

        setBalance(balanceData.balance || 0)

        // Fetch user transactions
        const transactionsResponse = await fetch("/api/user/transactions", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        let transactionsData: any = {}
        try {
          transactionsData = await transactionsResponse.json()
        } catch {
          // If parsing fails, transactionsData stays as {}
        }

        if (!transactionsResponse.ok) {
          throw new Error(transactionsData.error || "Failed to fetch transactions")
        }

        setTransactions(transactionsData.transactions || [])
      } catch (error) {
        console.error("Error fetching financial data:", error)
        // Initialize with empty data for new users
        setBalance(0)
        setTransactions([])

        // Show error toast only if it's not a new user
        if (transactions.length > 0) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to load financial data",
            variant: "destructive",
          })
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserFinancialData()
  }, [user, refreshTrigger, toast, transactions.length])

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const updateBalance = async (newBalance: number) => {
    if (!user) return

    try {
      const accessToken = localStorage.getItem("accessToken")
      if (!accessToken) {
        throw new Error("No access token found")
      }

      // Update balance in the database
      const response = await fetch("/api/user/balance", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ balance: newBalance }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to update balance")
      }

      // Update local state
      setBalance(newBalance)
    } catch (error) {
      console.error("Error updating balance:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update balance",
        variant: "destructive",
      })
    }
  }

  const addTransaction = async (transaction: Transaction) => {
    if (!user) return

    try {
      const accessToken = localStorage.getItem("accessToken")
      if (!accessToken) {
        throw new Error("No access token found")
      }

      // Add transaction to the database
      const response = await fetch("/api/user/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(transaction),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to add transaction")
      }

      // Update local state
      setTransactions((prev) => [transaction, ...prev])

      // Refresh data to update portfolio
      refreshData()
    } catch (error) {
      console.error("Error adding transaction:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record transaction",
        variant: "destructive",
      })
    }
  }

  return (
    <AccountBalanceContext.Provider
      value={{
        balance,
        updateBalance,
        transactions,
        addTransaction,
        isLoading,
        refreshData,
      }}
    >
      {children}
    </AccountBalanceContext.Provider>
  )
}

export function useAccountBalance() {
  const context = useContext(AccountBalanceContext)
  if (context === undefined) {
    throw new Error("useAccountBalance must be used within an AccountBalanceProvider")
  }
  return context
}
