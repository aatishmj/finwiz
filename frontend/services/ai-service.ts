// Client-side service for AI interactions
const API_URL = "/api/ai"

export const AIService = {
  // Generate text using the AI model
  async generateText(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${API_URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      return data.text
    } catch (error) {
      console.error("Error generating text:", error)
      throw error
    }
  },

  // Generate a summary of a news article
  async generateNewsSummary(content: string): Promise<string> {
    try {
      const prompt = `
        Summarize the following financial news article in 2-3 sentences:
        
        ${content}
        
        Keep the summary concise, informative, and focused on the key financial implications.
      `

      const response = await fetch(`${API_URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      return data.text
    } catch (error) {
      console.error("Error generating summary:", error)
      throw error
    }
  },

  // Generate a response with user context
  async generateResponseWithContext(
    userMessage: string,
    userId: number,
  ): Promise<{ type: string; content: string; message?: string; image_url?: string }> {
    try {
      // First, send request to our Next.js API route
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          message: userMessage,
          userId: userId.toString(),
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      // Parse the response
      const data = await response.json()

      // Return the response data in the format expected by the chat component
      return {
        type: data.type || "text",
        content: data.content || data.response || "",
        message: data.message || data.content || data.response || "",
        image_url: data.image_url || "",
      }
    } catch (error) {
      console.error("Error generating response with context:", error)
      throw error
    }
  },

  // Generate market analysis based on news and market data
  async generateMarketAnalysis(): Promise<string> {
    try {
      const response = await fetch(`${API_URL}/analysis`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      return data.analysis
    } catch (error) {
      console.error("Error generating market analysis:", error)
      throw error
    }
  },
}
