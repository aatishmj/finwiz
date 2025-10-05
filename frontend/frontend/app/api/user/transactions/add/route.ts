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
    const { type, symbol, name, shares, price, amount, date } = body

    if (!type || !symbol || !name || shares === undefined || price === undefined || amount === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const transactionsCollection = db.collection(COLLECTIONS.TRANSACTIONS)

    const transaction = {
      id: Date.now().toString(),
      userId: userData.id.toString(),
      type,
      symbol,
      name,
      shares,
      price,
      amount,
      date: date ? new Date(date) : new Date(),
      createdAt: new Date(),
    }

    await transactionsCollection.insertOne(transaction)
    await disconnectFromDatabase()

    return NextResponse.json({ success: true, message: "Transaction added successfully" })
  } catch (error) {
    console.error("Error adding transaction:", error)
    return NextResponse.json({ success: false, error: "Failed to add transaction" }, { status: 500 })
  }
}
