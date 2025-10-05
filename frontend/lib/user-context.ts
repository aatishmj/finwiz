/**
 * Utility function to gather user-specific data for AI context
 */
export async function getUserContext(userId: string, db: any) {
  try {
    // Get user information
    const usersCollection = db.collection("users")
    const user = await usersCollection.findOne({ id: userId })

    if (!user) {
      return { error: "User not found" }
    }

    // Get portfolio holdings
    const portfolioCollection = db.collection("portfolio")
    const portfolio = await portfolioCollection.findOne({ userId })

    // Get recent transactions
    const transactionsCollection = db.collection("transactions")
    const allTransactions = await transactionsCollection.find({ userId }).sort({ date: 1 }).toArray()

    // Calculate dynamic balance based on deposits and trades
    let balance = 0
    for (const tx of allTransactions) {
      if (tx.type.toLowerCase() === "deposit") {
        balance += tx.amount
      } else if (tx.type.toLowerCase() === "buy") {
        balance -= tx.amount
      } else if (tx.type.toLowerCase() === "sell") {
        balance += tx.amount
      }
    }

    // Use balance from user document if available (MongoDB users collection)
    if (user.balance !== undefined) {
      balance = user.balance
    }

    // Format balance as currency string
    const formattedBalance = `₹${balance.toLocaleString("en-IN")}`

    // Get watchlist
    const watchlistCollection = db.collection("watchlist")
    const watchlist = await watchlistCollection.findOne({ userId })

    // Format currency values to use ₹ instead of $
    const formattedUser = {
      username: user.username,
      balance: formattedBalance,
    }

    const formattedPortfolio =
      portfolio?.holdings.map((holding: any) => ({
        ...holding,
        avgPrice: `₹${holding.avgPrice.toLocaleString("en-IN")}`,
        totalCost: `₹${holding.totalCost.toLocaleString("en-IN")}`,
      })) || []

    const formattedTransactions = allTransactions.map((transaction: any) => ({
      ...transaction,
      price: transaction.price ? `₹${transaction.price.toLocaleString("en-IN")}` : null,
      amount: `₹${transaction.amount.toLocaleString("en-IN")}`,
      date: new Date(transaction.date).toLocaleDateString("en-IN"),
    }))

    return {
      user: formattedUser,
      portfolio: formattedPortfolio,
      recentTransactions: formattedTransactions,
      watchlist: watchlist?.stocks || [],
    }
  } catch (error) {
    console.error("Error getting user context:", error)
    return { error: "Failed to get user context" }
  }
}
