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
    const { action, symbol, name, shares, price, amount } = body

    if (
      !action ||
      !symbol ||
      !name ||
      typeof shares !== "number" ||
      typeof price !== "number" ||
      typeof amount !== "number"
    ) {
      return NextResponse.json({ success: false, error: "Invalid request data" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const portfolioCollection = db.collection(COLLECTIONS.PORTFOLIO)

    // Get current portfolio
    let portfolio = await portfolioCollection.findOne({ userId: userData.id })

    if (!portfolio) {
      // Create new portfolio if it doesn't exist
      portfolio = {
        userId: userData.id,
        holdings: [],
        lastUpdated: new Date(),
        createdAt: new Date(),
      }
    }

    const holdings = portfolio.holdings || []
    const existingHoldingIndex = holdings.findIndex((h: any) => h.symbol === symbol)

    if (action === "buy") {
      if (existingHoldingIndex >= 0) {
        // Update existing holding
        const existingHolding = holdings[existingHoldingIndex]
        const newShares = existingHolding.shares + shares
        const newTotalCost = existingHolding.totalCost + amount
        const newAvgPrice = newTotalCost / newShares

        holdings[existingHoldingIndex] = {
          ...existingHolding,
          shares: newShares,
          avgPrice: newAvgPrice,
          totalCost: newTotalCost,
        }
      } else {
        // Add new holding
        holdings.push({
          symbol,
          name,
          shares,
          avgPrice: price,
          totalCost: amount,
        })
      }
    } else if (action === "sell") {
      if (existingHoldingIndex >= 0) {
        // Update existing holding
        const existingHolding = holdings[existingHoldingIndex]

        if (existingHolding.shares < shares) {
          return NextResponse.json(
            {
              success: false,
              error: `You only have ${existingHolding.shares} shares of ${symbol} to sell`,
            },
            { status: 400 },
          )
        }

        const newShares = existingHolding.shares - shares

        if (newShares > 0) {
          // Reduce shares but keep average price
          holdings[existingHoldingIndex] = {
            ...existingHolding,
            shares: newShares,
            // Keep the same average price
            totalCost: existingHolding.avgPrice * newShares,
          }
        } else {
          // Remove holding if no shares left
          holdings.splice(existingHoldingIndex, 1)
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            error: `You don't own any shares of ${symbol}`,
          },
          { status: 400 },
        )
      }
    } else {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    // Update portfolio in database
    await portfolioCollection.updateOne(
      { userId: userData.id },
      {
        $set: {
          holdings,
          lastUpdated: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    return NextResponse.json({
      success: true,
      message: `Successfully ${action === "buy" ? "bought" : "sold"} ${shares} shares of ${symbol}`,
    })
  } catch (error) {
    console.error("Error updating portfolio:", error)
    return NextResponse.json({ success: false, error: "Failed to update portfolio" }, { status: 500 })
  } finally {
    await disconnectFromDatabase()
  }
}
