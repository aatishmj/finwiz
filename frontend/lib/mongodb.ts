import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"
const DB_NAME = process.env.MONGODB_DB || "trada_db"

// This is a server-side only utility
// It should never be imported in client components
let client: MongoClient | null = null

export async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log("Connected to local MongoDB at", MONGODB_URI)
  }

  return {
    client,
    db: client.db(DB_NAME),
  }
}

export async function disconnectFromDatabase() {
  // Do not close the client to avoid MongoClientClosedError
  // This allows reuse of the client connection across requests
  // Commenting out the close to keep the client alive
  /*
  if (client) {
    await client.close()
    client = null
  }
  */
}
