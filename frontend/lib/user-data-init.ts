import { connectToDatabase, disconnectFromDatabase } from "@/lib/mongodb"
import { COLLECTIONS } from "@/lib/mongodb-schemas"

/**
 * Initialize user data in MongoDB when a user registers or logs in for the first time
 */
export async function initializeUserData(userId: string, username: string, email: string) {
  try {
    const { db } = await connectToDatabase()

    // Collections
    const usersCollection = db.collection(COLLECTIONS.USERS)
    const transactionsCollection = db.collection(COLLECTIONS.TRANSACTIONS)
    const watchlistCollection = db.collection(COLLECTIONS.WATCHLIST)
    const portfolioCollection = db.collection(COLLECTIONS.PORTFOLIO)

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ id: userId })

    if (!existingUser) {
      console.log(`Initializing new user: ${username} (${userId})`)

      // Create user with initial balance of 10,000 (for demo purposes)
      const initialBalance = 0

      // 1. Create user document
      await usersCollection.insertOne({
        id: userId,
        username,
        email,
        balance: initialBalance,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // 2. Add initial deposit transaction
      await transactionsCollection.insertOne({
        id: Date.now().toString(),
        userId,
        type: "Deposit",
        symbol: "USD",
        name: "Initial Deposit",
        shares: 0,
        price: 0,
        amount: initialBalance,
        date: new Date(),
        createdAt: new Date(),
      })

      // 3. Create empty portfolio
      await portfolioCollection.insertOne({
        userId,
        holdings: [],
        lastUpdated: new Date(),
        createdAt: new Date(),
      })

      // 4. Create default watchlist with popular stocks
      const defaultWatchlist = [
        { symbol: "RELIANCE", name: "Reliance Industries Ltd." },
        { symbol: "TCS", name: "Tata Consultancy Services Ltd." },
        { symbol: "INFY", name: "Infosys Ltd." },
        { symbol: "HDFCBANK", name: "HDFC Bank Ltd." },
        { symbol: "ICICIBANK", name: "ICICI Bank Ltd." },
        { symbol: "NIFTY 50", name: "National Stock Exchange of India Index" },
        { symbol: "SENSEX", name: "Bombay Stock Exchange Index" },
      ]

      await watchlistCollection.insertOne({
        userId,
        stocks: defaultWatchlist,
        lastUpdated: new Date(),
        createdAt: new Date(),
      })

      console.log(`User ${username} initialized successfully`)
      return true
    } else {
      console.log(`User ${username} already exists, skipping initialization`)
      return false
    }
  } catch (error) {
    console.error("Error initializing user data:", error)
    throw error
  } finally {
    await disconnectFromDatabase()
  }
}
