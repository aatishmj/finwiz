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
    const { symbol } = body

    if (!symbol) {
      return NextResponse.json({ success: false, error: "Symbol is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const watchlistCollection = db.collection(COLLECTIONS.WATCHLIST)

    // Remove stock from watchlist
    const result = await watchlistCollection.updateOne(
      { userId: userData.id },
      {
        $pull: { stocks: { symbol } },
        $set: { lastUpdated: new Date() },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Watchlist not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing from watchlist:", error)
    return NextResponse.json({ success: false, error: "Failed to remove from watchlist" }, { status: 500 })
  } finally {
    await disconnectFromDatabase()
  }
}
