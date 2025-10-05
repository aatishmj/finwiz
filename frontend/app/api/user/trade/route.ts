import { NextResponse } from "next/server"
import { connectToDatabase, disconnectFromDatabase } from "@/lib/mongodb"
import { COLLECTIONS } from "@/lib/mongodb-schemas"
import { verifyToken } from "@/lib/auth-utils"

export async function POST(request: Request) {
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

    const body = await request.json()
    const { symbol, action, shares, price } = body

    if (!symbol || !action || !shares || !price) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Get user
    const usersCollection = db.collection(COLLECTIONS.USERS)
    const user = await usersCollection.findOne({ id: userData.id.toString() })

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const amount = shares * price

    // Check balance for buy
    if (action === "buy" && user.balance < amount) {
      return NextResponse.json({ success: false, error: "Insufficient balance" }, { status: 400 })
    }

    // Get portfolio
    const portfolioCollection = db.collection(COLLECTIONS.PORTFOLIO)
    const portfolio = await portfolioCollection.findOne({ userId: userData.id.toString() }) || {
      userId: userData.id.toString(),
      holdings: [],
      lastUpdated: new Date(),
      createdAt: new Date(),
    }

    // Update holdings
    const holdings = portfolio.holdings || []
    const existingHolding = holdings.find((h: any) => h.symbol === symbol)

    if (action === "buy") {
      if (existingHolding) {
        const totalShares = existingHolding.shares + shares
        const totalCost = existingHolding.totalCost + amount
        existingHolding.shares = totalShares
        existingHolding.avgPrice = totalCost / totalShares
        existingHolding.totalCost = totalCost
      } else {
        holdings.push({
          symbol,
          name: symbol, // You might want to get the full name
          shares,
          avgPrice: price,
          totalCost: amount,
        })
      }
      user.balance -= amount
    } else if (action === "sell") {
      if (!existingHolding || existingHolding.shares < shares) {
        return NextResponse.json({ success: false, error: "Insufficient shares" }, { status: 400 })
      }
      const sellAmount = shares * price
      existingHolding.shares -= shares
      existingHolding.totalCost -= sellAmount
      if (existingHolding.shares <= 0) {
        // Remove holding
        const index = holdings.indexOf(existingHolding)
        holdings.splice(index, 1)
      }
      user.balance += sellAmount
    } else {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    // Update portfolio
    portfolio.holdings = holdings
    portfolio.lastUpdated = new Date()
    await portfolioCollection.replaceOne({ userId: userData.id.toString() }, portfolio, { upsert: true })

    // Update user balance
    await usersCollection.updateOne({ id: userData.id.toString() }, { $set: { balance: user.balance, updatedAt: new Date() } })

    // Add transaction
    const transactionsCollection = db.collection(COLLECTIONS.TRANSACTIONS)
    await transactionsCollection.insertOne({
      id: Date.now().toString(),
      userId: userData.id.toString(),
      type: action === "buy" ? "Buy" : "Sell",
      symbol,
      name: symbol,
      shares,
      price,
      amount,
      date: new Date(),
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true, message: "Trade executed successfully" })
  } catch (error) {
    console.error("Error executing trade:", error)
    return NextResponse.json({ success: false, error: "Failed to execute trade" }, { status: 500 })
  } finally {
    await disconnectFromDatabase()
  }
}
