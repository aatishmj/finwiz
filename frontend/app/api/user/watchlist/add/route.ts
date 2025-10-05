import { NextResponse } from "next/server"
import { connectToDatabase, disconnectFromDatabase } from "@/lib/mongodb"
import { COLLECTIONS } from "@/lib/mongodb-schemas"
import { verifyToken } from "@/lib/auth-utils"

export async function POST(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const userData = await verifyToken(token)
    if (!userData) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { symbol, name } = body

    if (!symbol || !name) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const watchlistCollection = db.collection(COLLECTIONS.WATCHLIST)

    // Check if user watchlist exists
    const existingWatchlist = await watchlistCollection.findOne({ userId: userData.id.toString() })

    if (existingWatchlist) {
      // Check if stock already exists in watchlist
      const stockExists = existingWatchlist.stocks.some((stock: any) => stock.symbol === symbol)
      if (stockExists) {
        await disconnectFromDatabase()
        return NextResponse.json({ success: false, error: "Stock already in watchlist" }, { status: 400 })
      }

      // Add stock to existing watchlist
      await watchlistCollection.updateOne(
        { userId: userData.id.toString() },
        { $push: { stocks: { symbol, name } as any }, $set: { lastUpdated: new Date() } }
      )
    } else {
      // Create new watchlist for user
      await watchlistCollection.insertOne({
        userId: userData.id.toString(),
        stocks: [{ symbol, name }],
        lastUpdated: new Date(),
        createdAt: new Date(),
      })
    }

    await disconnectFromDatabase()

    return NextResponse.json({ success: true, message: "Added to watchlist" })
  } catch (error) {
    console.error("Error adding to watchlist:", error)
    return NextResponse.json({ success: false, error: "Failed to add to watchlist" }, { status: 500 })
  }
}
