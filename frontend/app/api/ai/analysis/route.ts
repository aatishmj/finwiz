import { NextResponse } from "next/server"
import { connectToDatabase, disconnectFromDatabase } from "@/lib/mongodb"
import { COLLECTIONS } from "@/lib/mongodb-schemas"
import { verifyToken } from "@/lib/auth-utils"
import { getUserContext } from "@/lib/user-context"

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

    // Get latest news
    const newsCollection = db.collection(COLLECTIONS.NEWS)
    const latestNews = await newsCollection.find().sort({ date: -1 }).limit(5).toArray()

    // Get user context
    const userContext = await getUserContext(userData.id.toString(), db)

    // Create prompt for market analysis
    const prompt = `
      You are a financial analyst providing a daily market analysis. 
      
      Here are the latest news items:
      ${latestNews.map((news) => `- ${news.title}: ${news.content}`).join("\n")}
      
      User information:
      ${JSON.stringify(userContext, null, 2)}
      
      Based on the above information, provide a concise daily market analysis focusing on:
      1. Key market trends
      2. Potential impact on the user's portfolio
      3. Actionable insights or recommendations
      
      Format your response in a professional, easy-to-read manner with clear sections.
    `

    // Call Ollama API
    const ollamaResponse = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: prompt,
        stream: false,
      }),
    })

    let ollamaData = null
    if (ollamaResponse.ok) {
      ollamaData = await ollamaResponse.json()
    }

    if (ollamaData) {
      return NextResponse.json({
        success: true,
        analysis: ollamaData.response,
      })
    } else {
      // Fallback analysis if AI service fails
      const fallbackAnalysis = `
        # Daily Market Analysis

        ## Market Overview
        Markets are showing mixed signals today with technology stocks leading gains while energy sectors face pressure from changing commodity prices.

        ## Key Trends
        - Tech sector continues to show resilience amid economic uncertainty
        - Interest rate expectations are shifting as new economic data emerges
        - Global supply chains are stabilizing, potentially easing inflationary pressures

        ## Recommendations
        Consider maintaining a diversified portfolio with exposure to both growth and value stocks. The current environment favors quality companies with strong balance sheets and consistent cash flows.
      `

      return NextResponse.json({
        success: true,
        analysis: fallbackAnalysis,
        fallback: true,
      })
    }
  } catch (error) {
    console.error("Error generating market analysis:", error)

    // Fallback analysis if any error occurs
    const fallbackAnalysis = `
      # Daily Market Analysis

      ## Market Overview
      Markets are showing mixed signals today with technology stocks leading gains while energy sectors face pressure from changing commodity prices.

      ## Key Trends
      - Tech sector continues to show resilience amid economic uncertainty
      - Interest rate expectations are shifting as new economic data emerges
      - Global supply chains are stabilizing, potentially easing inflationary pressures

      ## Recommendations
      Consider maintaining a diversified portfolio with exposure to both growth and value stocks. The current environment favors quality companies with strong balance sheets and consistent cash flows.
    `

    return NextResponse.json({
      success: true,
      analysis: fallbackAnalysis,
      fallback: true,
    })
  } finally {
    await disconnectFromDatabase()
  }
}
