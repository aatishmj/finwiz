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

    const { db } = await connectToDatabase()
    const watchlistCollection = db.collection(COLLECTIONS.WATCHLIST)

    // Get user watchlist
    let watchlist = await watchlistCollection.findOne({ userId: userData.id.toString() })

    // If watchlist doesn't exist, create default watchlist
    if (!watchlist) {
      const defaultWatchlist = [
        { symbol: "RELIANCE", name: "Reliance Industries Ltd." },
        { symbol: "TCS", name: "Tata Consultancy Services Ltd." },
        { symbol: "INFY", name: "Infosys Ltd." },
        { symbol: "HDFCBANK", name: "HDFC Bank Ltd." },
        { symbol: "ICICIBANK", name: "ICICI Bank Ltd." },
      ]

      watchlist = {
        userId: userData.id,
        stocks: defaultWatchlist,
        lastUpdated: new Date(),
        createdAt: new Date(),
      }

      await watchlistCollection.insertOne(watchlist)
    }

    return NextResponse.json({
      success: true,
      watchlist: {
        stocks: watchlist.stocks || [],
      },
    })
  } catch (error) {
    console.error("Error fetching user watchlist:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch watchlist" }, { status: 500 })
  } finally {
    await disconnectFromDatabase()
  }
}

// Add to watchlist
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
    const { symbol, name } = body

    if (!symbol || !name) {
      return NextResponse.json({ success: false, error: "Symbol and name are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const watchlistCollection = db.collection(COLLECTIONS.WATCHLIST)

    // Check if watchlist exists
    const watchlist = await watchlistCollection.findOne({ userId: userData.id.toString() })

    if (watchlist) {
      // Check if stock already exists in watchlist
      const stockExists = watchlist.stocks.some((stock: any) => stock.symbol === symbol)

      if (stockExists) {
        return NextResponse.json(
          {
            success: false,
            error: "Stock already in watchlist",
          },
          { status: 400 },
        )
      }

      // Add stock to watchlist
      await watchlistCollection.updateOne(
        { userId: userData.id.toString() },
        {
          $push: { stocks: { symbol, name } },
          $set: { lastUpdated: new Date() },
        },
      )
    } else {
      // Create new watchlist
      await watchlistCollection.insertOne({
        userId: userData.id.toString(),
        stocks: [{ symbol, name }],
        lastUpdated: new Date(),
        createdAt: new Date(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error adding to watchlist:", error)
    return NextResponse.json({ success: false, error: "Failed to add to watchlist" }, { status: 500 })
  } finally {
    await disconnectFromDatabase()
  }
}

// Remove from watchlist
export async function DELETE(request: Request) {
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
    const { stock_symbol } = body

    if (!stock_symbol) {
      return NextResponse.json({ success: false, error: "Stock symbol is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const watchlistCollection = db.collection(COLLECTIONS.WATCHLIST)

    // Remove stock from watchlist
    const result = await watchlistCollection.updateOne(
      { userId: userData.id.toString() },
      {
        $pull: { stocks: { symbol: stock_symbol } },
        $set: { lastUpdated: new Date() },
      },
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ success: false, error: "Stock not in watchlist" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing from watchlist:", error)
    return NextResponse.json({ success: false, error: "Failed to remove from watchlist" }, { status: 500 })
  } finally {
    await disconnectFromDatabase()
  }
}
