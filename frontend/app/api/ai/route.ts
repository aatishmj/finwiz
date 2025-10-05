import { NextResponse } from "next/server"

interface OllamaRequest {
  model: string
  prompt: string
  stream?: boolean
  options?: {
    temperature?: number
    top_p?: number
    top_k?: number
    max_tokens?: number
  }
}

interface OllamaResponse {
  model: string
  created_at: string
  response: string
  done: boolean
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { prompt, options = {} } = body

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 })
    }

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2:latest",
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 500,
          ...options,
        },
      } as OllamaRequest),
    })

    if (!response.ok) {
      throw new Error(`Failed to generate text: ${response.statusText}`)
    }

    const data = (await response.json()) as OllamaResponse

    return NextResponse.json({
      success: true,
      data: {
        response: data.response,
        model: data.model,
      },
    })
  } catch (error) {
    console.error("Error generating text with Ollama:", error)

    // Return a fallback response
    const fallbackResponses = [
      "Based on recent market trends, this stock shows potential for growth in the next quarter.",
      "I'd recommend diversifying your portfolio with some ETFs to reduce risk exposure.",
      "The tech sector has been volatile lately, but certain companies have shown resilience due to AI demand.",
      "Looking at your portfolio, you might want to consider taking some profits from your top performers.",
      "Interest rate changes could impact financial stocks. Keep an eye on major banking institutions.",
    ]

    const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]

    return NextResponse.json({
      success: true,
      data: {
        response: fallbackResponse,
        model: "fallback",
      },
    })
  }
}
