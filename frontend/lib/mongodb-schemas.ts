// MongoDB schema definitions for our collections

export interface User {
  id: string
  username: string
  email: string
  balance: number
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id: string
  userId: string
  type: "Buy" | "Sell" | "Dividend" | "Deposit" | "Withdrawal"
  symbol: string
  name: string
  shares: number
  price: number
  amount: number
  date: Date
  createdAt: Date
}

export interface ChatMessage {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export interface ChatConversation {
  id: string
  userId: string
  title: string
  messages: ChatMessage[]
  lastUpdated: Date
  createdAt: Date
}

export interface WatchlistItem {
  symbol: string
  name: string
}

export interface Watchlist {
  userId: string
  stocks: WatchlistItem[]
  lastUpdated: Date
  createdAt: Date
}

export interface PortfolioHolding {
  symbol: string
  name: string
  shares: number
  avgPrice: number
  totalCost: number
}

export interface Portfolio {
  userId: string
  holdings: PortfolioHolding[]
  lastUpdated: Date
  createdAt: Date
}

export interface NewsItem {
  id: string
  title: string
  content: string
  summary?: string
  source: string
  date: Date
  url?: string
  category?: string
  tags?: string[]
}

// Collection names
export const COLLECTIONS = {
  USERS: "users",
  TRANSACTIONS: "transactions",
  CHAT_CONVERSATIONS: "chat_conversations",
  NEWS: "news",
  WATCHLIST: "watchlist",
  PORTFOLIO: "portfolio",
}
