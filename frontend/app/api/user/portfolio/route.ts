import { NextResponse } from "next/server"
import { connectToDatabase, disconnectFromDatabase } from "@/lib/mongodb"
import { COLLECTIONS } from "@/lib/mongodb-schemas"
import { verifyToken } from "@/lib/auth-utils"

export async function GET(request: Request) {
  try {
    // Verify JWT token
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const userData = await verifyToken(token)
    if (!userData) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    console.log("Fetching portfolio for user:", userData.id)

    const { db } = await connectToDatabase()
    const portfolioCollection = db.collection(COLLECTIONS.PORTFOLIO)
    const transactionsCollection = db.collection(COLLECTIONS.TRANSACTIONS)

    // Get user portfolio
    let portfolio = await portfolioCollection.findOne({ userId: userData.id })
    console.log("Portfolio from DB:", portfolio)

    // If portfolio doesn't exist or has empty holdings, calculate from transactions
    if (!portfolio || !portfolio.holdings || portfolio.holdings.length === 0) {
      console.log("No portfolio found or empty holdings, calculating from transactions")
      // Get all user transactions
      const transactions = await transactionsCollection.find({ userId: userData.id }).toArray()
      console.log("Transactions for calculation:", transactions)

      // Calculate holdings from transactions
      const holdings: Record<
        string,
        {
          symbol: string
          name: string
          shares: number
          avgPrice: number
          totalCost: number
        }
      > = {}

      // Process transactions to build portfolio
      transactions.forEach((transaction) => {
        const { type, symbol, name, shares, price, amount } = transaction

        if (!holdings[symbol] && (type === "Buy" || type === "Sell")) {
          holdings[symbol] = {
            symbol,
            name,
            shares: 0,
            avgPrice: 0,
            totalCost: 0,
          }
        }

        if (type === "Buy") {
          const currentShares = holdings[symbol]?.shares || 0
          const currentCost = holdings[symbol]?.totalCost || 0

          // Update shares and average price
          holdings[symbol].shares += shares
          holdings[symbol].totalCost += amount

          // Recalculate average price
          if (holdings[symbol].shares > 0) {
            holdings[symbol].avgPrice = holdings[symbol].totalCost / holdings[symbol].shares
          }
        } else if (type === "Sell") {
          // Reduce shares but keep average price
          holdings[symbol].shares -= shares

          // If shares become 0 or negative, reset
          if (holdings[symbol].shares <= 0) {
            holdings[symbol].shares = 0
            holdings[symbol].totalCost = 0
            holdings[symbol].avgPrice = 0
          } else {
            // Reduce cost proportionally
            holdings[symbol].totalCost = holdings[symbol].avgPrice * holdings[symbol].shares
          }
        }
      })

      // Filter out positions with 0 shares
      const holdingsArray = Object.values(holdings).filter((holding) => holding.shares > 0)
      console.log("Calculated holdings:", holdingsArray)

      // Create portfolio document
      portfolio = {
        userId: userData.id,
        holdings: holdingsArray,
        lastUpdated: new Date(),
        createdAt: new Date(),
      }

      // Save portfolio to database
      if (holdingsArray.length > 0) {
        await portfolioCollection.insertOne(portfolio)
        console.log("Created new portfolio in DB")
      }
    }

    return NextResponse.json({
      success: true,
      portfolio: {
        holdings: portfolio.holdings || [],
      },
    })
  } catch (error) {
    console.error("Error fetching user portfolio:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch portfolio" }, { status: 500 })
  } finally {
    await disconnectFromDatabase()
  }
}
