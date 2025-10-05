import { NextResponse } from "next/server"
import { connectToDatabase, disconnectFromDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth-utils"

// Sample news data to use if no news is found in the database
const sampleNews = [
  {
    id: "1",
    title: "RBI Keeps Repo Rate Unchanged at 6.5%",
    content:
      "The Reserve Bank of India (RBI) maintained the repo rate at 6.5% for the seventh consecutive time, in line with market expectations. The central bank remains focused on withdrawing accommodation to ensure inflation progressively aligns with the target while supporting growth.",
    summary:
      "RBI maintains repo rate at 6.5% for the seventh consecutive time, focusing on controlling inflation while supporting economic growth.",
    source: "Economic Times",
    date: new Date().toISOString(),
    category: "economy",
    tags: ["RBI", "interest rates", "monetary policy"],
  },
  {
    id: "2",
    title: "Reliance Industries Reports Strong Q1 Results",
    content:
      "Reliance Industries Limited (RIL) reported a 10.8% year-on-year increase in consolidated net profit to ₹16,225 crore for Q1 FY24. The oil-to-telecom conglomerate's revenue from operations rose 12.4% to ₹2.1 lakh crore, driven by strong performance in retail and digital services segments.",
    summary:
      "Reliance Industries posts 10.8% increase in Q1 profit with strong performance in retail and digital services segments.",
    source: "Business Standard",
    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    category: "earnings",
    tags: ["Reliance", "earnings", "oil and gas"],
  },
  {
    id: "3",
    title: "Infosys Raises FY24 Revenue Guidance",
    content:
      "IT major Infosys has raised its FY24 revenue growth guidance to 5-6.5% from the earlier projected 4-6%. The company reported a 3.2% year-on-year increase in consolidated net profit at ₹6,128 crore for the quarter ended June 30, 2023, beating street estimates.",
    summary: "Infosys raises FY24 revenue growth guidance to 5-6.5% after reporting better-than-expected Q1 results.",
    source: "Mint",
    date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    category: "technology",
    tags: ["Infosys", "IT sector", "earnings"],
  },
  {
    id: "4",
    title: "HDFC Bank Completes Merger with HDFC Ltd",
    content:
      "HDFC Bank has successfully completed its merger with parent HDFC Ltd, creating a banking behemoth with a combined balance sheet of over ₹30 lakh crore. The merged entity will have a network of 8,700 branches and employ over 1.7 lakh people.",
    summary: "HDFC Bank completes merger with HDFC Ltd, creating a banking giant with over ₹30 lakh crore in assets.",
    source: "Financial Express",
    date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    category: "finance",
    tags: ["HDFC Bank", "merger", "banking"],
  },
  {
    id: "5",
    title: "Tata Motors Launches New Electric SUV",
    content:
      "Tata Motors has launched its new electric SUV, the Nexon EV Max, with an enhanced range of up to 437 km on a single charge. Priced between ₹14.99 lakh and ₹19.29 lakh (ex-showroom), the vehicle aims to address range anxiety concerns among EV buyers.",
    summary:
      "Tata Motors launches Nexon EV Max with 437 km range, priced between ₹14.99-19.29 lakh to address range anxiety.",
    source: "Auto Car India",
    date: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    category: "automotive",
    tags: ["Tata Motors", "electric vehicles", "automotive"],
  },
]

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

    // Get news from the news collection
    const newsCollection = db.collection("news")
    let news = await newsCollection.find().sort({ date: -1 }).limit(10).toArray()

    // If no news in database, seed with sample data
    if (news.length === 0) {
      console.log("No news found in database, seeding with sample data")
      await newsCollection.insertMany(sampleNews)
      news = sampleNews
    }

    return NextResponse.json({
      success: true,
      news,
    })
  } catch (error) {
    console.error("Error fetching news:", error)

    // Return sample news as fallback
    return NextResponse.json({
      success: true,
      news: sampleNews,
      fallback: true,
    })
  } finally {
    await disconnectFromDatabase()
  }
}
