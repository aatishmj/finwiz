import { NextResponse } from "next/server"
import { connectToDatabase, disconnectFromDatabase } from "@/lib/mongodb"
import { COLLECTIONS } from "@/lib/mongodb-schemas"
import { verifyToken } from "@/lib/auth-utils"

// GET user transactions
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
    const transactionsCollection = db.collection(COLLECTIONS.TRANSACTIONS)

    // Get user transactions
    const transactions = await transactionsCollection.find({ userId: userData.id }).sort({ date: -1 }).toArray()

    return NextResponse.json({ success: true, transactions })
  } catch (error) {
    console.error("Error fetching user transactions:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch transactions" }, { status: 500 })
  } finally {
    await disconnectFromDatabase()
  }
}

// Add a new transaction
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
    const { type, symbol, name, shares, price, amount } = body

    // Validate transaction data
    if (
      !type ||
      !symbol ||
      !name ||
      typeof shares !== "number" ||
      typeof price !== "number" ||
      typeof amount !== "number"
    ) {
      return NextResponse.json({ success: false, error: "Invalid transaction data" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const transactionsCollection = db.collection(COLLECTIONS.TRANSACTIONS)
    const usersCollection = db.collection(COLLECTIONS.USERS)

    // Create transaction
    const transaction = {
      id: Date.now().toString(),
      userId: userData.id,
      type,
      symbol,
      name,
      shares,
      price,
      amount,
      date: new Date(),
      createdAt: new Date(),
    }

    await transactionsCollection.insertOne(transaction)

    // Update user balance based on transaction type
    let balanceChange = 0
    if (type === "Buy") {
      balanceChange = -amount
    } else if (type === "Sell") {
      balanceChange = amount
    } else if (type === "Deposit") {
      balanceChange = amount
    } else if (type === "Withdrawal") {
      balanceChange = -amount
    } else if (type === "Dividend") {
      balanceChange = amount
    }

    if (balanceChange !== 0) {
      await usersCollection.updateOne(
        { id: userData.id },
        { $inc: { balance: balanceChange }, $set: { updatedAt: new Date() } },
      )
    }

    return NextResponse.json({ success: true, transaction })
  } catch (error) {
    console.error("Error adding transaction:", error)
    return NextResponse.json({ success: false, error: "Failed to add transaction" }, { status: 500 })
  } finally {
    await disconnectFromDatabase()
  }
}
