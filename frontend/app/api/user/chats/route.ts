import { NextResponse } from "next/server"
import { connectToDatabase, disconnectFromDatabase } from "@/lib/mongodb"
import { COLLECTIONS } from "@/lib/mongodb-schemas"
import { verifyToken } from "@/lib/auth-utils"

// GET user chat conversations
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

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("id")

    const { db } = await connectToDatabase()
    const chatsCollection = db.collection(COLLECTIONS.CHAT_CONVERSATIONS)

    if (conversationId) {
      // Get specific conversation
      const conversation = await chatsCollection.findOne({
        id: conversationId,
        userId: userData.id,
      })

      if (!conversation) {
        return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 })
      }

      return NextResponse.json({ success: true, conversation })
    } else {
      // Get all user conversations
      const conversations = await chatsCollection.find({ userId: userData.id }).sort({ lastUpdated: -1 }).toArray()

      return NextResponse.json({ success: true, conversations })
    }
  } catch (error) {
    console.error("Error fetching chat conversations:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch conversations" }, { status: 500 })
  } finally {
    await disconnectFromDatabase()
  }
}

// Create or update a chat conversation
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
    const { id, title, messages } = body

    // Validate data
    if (!title || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid conversation data" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const chatsCollection = db.collection(COLLECTIONS.CHAT_CONVERSATIONS)

    const now = new Date()

    if (id) {
      // Update existing conversation
      const result = await chatsCollection.updateOne(
        { id, userId: userData.id },
        {
          $set: {
            title,
            messages,
            lastUpdated: now,
          },
        },
      )

      if (result.matchedCount === 0) {
        return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 })
      }

      return NextResponse.json({ success: true, id })
    } else {
      // Create new conversation
      const newId = Date.now().toString()
      const conversation = {
        id: newId,
        userId: userData.id,
        title,
        messages,
        lastUpdated: now,
        createdAt: now,
      }

      await chatsCollection.insertOne(conversation)
      return NextResponse.json({ success: true, id: newId })
    }
  } catch (error) {
    console.error("Error saving chat conversation:", error)
    return NextResponse.json({ success: false, error: "Failed to save conversation" }, { status: 500 })
  } finally {
    await disconnectFromDatabase()
  }
}

// Delete a chat conversation
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

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("id")

    if (!conversationId) {
      return NextResponse.json({ success: false, error: "Conversation ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const chatsCollection = db.collection(COLLECTIONS.CHAT_CONVERSATIONS)

    const result = await chatsCollection.deleteOne({
      id: conversationId,
      userId: userData.id,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting chat conversation:", error)
    return NextResponse.json({ success: false, error: "Failed to delete conversation" }, { status: 500 })
  } finally {
    await disconnectFromDatabase()
  }
}
