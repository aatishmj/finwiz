import { NextResponse } from "next/server"
import { connectToDatabase, disconnectFromDatabase } from "@/lib/mongodb"
import { COLLECTIONS } from "@/lib/mongodb-schemas"
import { verifyToken } from "@/lib/auth-utils"

// GET user balance
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

    console.log("Balance GET: userData.id =", userData.id)

    const { db } = await connectToDatabase()
    const usersCollection = db.collection(COLLECTIONS.USERS)

    // Find user
    const userId = String(userData.id)
    const user = await usersCollection.findOne({ id: userId })
    console.log("Balance GET: found user =", user)

    if (!user) {
      // Create new user with 0 balance if not found
      const newUser = {
        id: userId,
        username: userData.username,
        email: userData.email,
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await usersCollection.insertOne(newUser)
      return NextResponse.json({ success: true, balance: 0 })
    }

    return NextResponse.json({ success: true, balance: user.balance })
  } catch (error) {
    console.error("Error fetching user balance:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch balance" }, { status: 500 })
  } finally {
    await disconnectFromDatabase()
  }
}

// Update user balance
export async function PUT(request: Request) {
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

    const userId = String(userData.id)
    console.log("Balance PUT: userId =", userId)

    const body = await request.json()
    const { balance } = body

    console.log("Balance PUT: new balance =", balance)

    if (typeof balance !== "number") {
      return NextResponse.json({ success: false, error: "Invalid balance" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const usersCollection = db.collection(COLLECTIONS.USERS)

    // Find and update user
    const result = await usersCollection.updateOne(
      { id: userId },
      {
        $set: {
          balance,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          username: userData.username,
          email: userData.email,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    console.log("Balance PUT: update result =", result)

    if (result.matchedCount === 0 && result.upsertedCount === 0) {
      return NextResponse.json({ success: false, error: "Failed to update balance" }, { status: 500 })
    }

    return NextResponse.json({ success: true, balance })
  } catch (error) {
    console.error("Error updating user balance:", error)
    return NextResponse.json({ success: false, error: "Failed to update balance" }, { status: 500 })
  } finally {
    await disconnectFromDatabase()
  }
}
