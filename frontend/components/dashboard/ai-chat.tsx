"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Bot, Send, User, Save, Trash2, BarChart2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { AIService } from "@/services/ai-service"
import { useAuth } from "@/contexts/auth-context"
import ReactMarkdown from "react-markdown"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  type?: "text" | "image"
  imageUrl?: string
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  lastUpdated: Date
}

export function AiChat() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string>("new")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "Hello! I'm StockSence, your AI trading assistant. How can I help you with your investments today? I can analyze market trends, provide stock recommendations, and even create charts to visualize data.",
      role: "assistant",
      timestamp: new Date(),
      type: "text",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Load user's conversations from MongoDB
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return

      setIsLoadingConversations(true)
      try {
        const accessToken = localStorage.getItem("accessToken")
        if (!accessToken) {
          throw new Error("No access token found")
        }

        const response = await fetch("/api/user/chats", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch conversations")
        }

        const data = await response.json()
        setConversations(data.conversations || [])
      } catch (error) {
        console.error("Error fetching conversations:", error)
        toast({
          title: "Error",
          description: "Failed to load your conversations. Using local data.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingConversations(false)
      }
    }

    fetchConversations()
  }, [user, toast])

  // Load conversation when selected
  useEffect(() => {
    const loadConversation = async () => {
      if (currentConversationId === "new") {
        setMessages([
          {
            id: "welcome",
            content:
              "Hello! I'm StockSence, your AI trading assistant. How can I help you with your investments today? I can analyze market trends, provide stock recommendations, and even create charts to visualize data.",
            role: "assistant",
            timestamp: new Date(),
            type: "text",
          },
        ])
        return
      }

      const conversation = conversations.find((c) => c.id === currentConversationId)
      if (conversation) {
        setMessages(conversation.messages)
      } else if (user) {
        // Try to fetch from API if not in local state
        try {
          const accessToken = localStorage.getItem("accessToken")
          if (!accessToken) {
            throw new Error("No access token found")
          }

          const response = await fetch(`/api/user/chats?id=${currentConversationId}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })

          if (!response.ok) {
            throw new Error("Failed to fetch conversation")
          }

          const data = await response.json()
          if (data.conversation) {
            setMessages(data.conversation.messages)
          }
        } catch (error) {
          console.error("Error fetching conversation:", error)
          toast({
            title: "Error",
            description: "Failed to load conversation.",
            variant: "destructive",
          })
        }
      }
    }

    loadConversation()
  }, [currentConversationId, conversations, user, toast])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current
      scrollArea.scrollTop = scrollArea.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
      type: "text",
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Get AI response using context-aware API
      let aiResponse

      if (user) {
        // Use context-aware API if user is logged in
        aiResponse = await AIService.generateResponseWithContext(input, user.id)
      } else {
        // Fallback to regular API if not logged in
        const prompt = `
          You are StockSence, a financial advisor and trading assistant specializing in Indian stock markets.
          The user says: "${input}"
          
          Provide a helpful, accurate, and concise response about financial markets, trading, or investments.
          Keep your response under 150 words.
          Always use ₹ (rupees) when discussing money or stock prices.
        `
        const textResponse = await AIService.generateText(prompt)
        aiResponse = { type: "text", content: textResponse }
      }

      // Create AI message based on response type
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          aiResponse.type === "image" ? aiResponse.message || "Here's the chart you requested:" : aiResponse.content,
        role: "assistant",
        timestamp: new Date(),
        type: aiResponse.type as "text" | "image",
        imageUrl: aiResponse.type === "image" ? `http://localhost:8000${aiResponse.image_url}` : undefined,
      }

      setMessages((prev) => [...prev, aiMessage])

      // If this is part of an existing conversation, update it in the database
      if (currentConversationId !== "new" && user) {
        try {
          const accessToken = localStorage.getItem("accessToken")
          if (!accessToken) {
            throw new Error("No access token found")
          }

          const updatedMessages = [...messages, userMessage, aiMessage]

          await fetch("/api/user/chats", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              id: currentConversationId,
              title: conversations.find((c) => c.id === currentConversationId)?.title || "Conversation",
              messages: updatedMessages,
            }),
          })
        } catch (error) {
          console.error("Error updating conversation:", error)
        }
      }
    } catch (error) {
      console.error("Error getting AI response:", error)

      // Fallback response if AI service fails
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I couldn't generate a response at the moment. Please try again later.",
        role: "assistant",
        timestamp: new Date(),
        type: "text",
      }

      setMessages((prev) => [...prev, aiMessage])

      toast({
        title: "AI Service Issue",
        description: "Could not connect to the AI service. Using fallback response.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const saveConversation = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save conversations.",
        variant: "destructive",
      })
      return
    }

    if (messages.length <= 1) {
      toast({
        title: "Cannot save empty conversation",
        description: "Please have a conversation before saving.",
        variant: "destructive",
      })
      return
    }

    const firstUserMessage = messages.find((m) => m.role === "user")
    const title = firstUserMessage
      ? firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? "..." : "")
      : "New Conversation"

    try {
      setIsLoading(true)
      const accessToken = localStorage.getItem("accessToken")
      if (!accessToken) {
        throw new Error("No access token found")
      }

      if (currentConversationId === "new") {
        // Create new conversation
        const response = await fetch("/api/user/chats", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            title,
            messages,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to save conversation")
        }

        const data = await response.json()
        const newConversation: Conversation = {
          id: data.id,
          title,
          messages: [...messages],
          lastUpdated: new Date(),
        }

        setConversations([newConversation, ...conversations])
        setCurrentConversationId(newConversation.id)
      } else {
        // Update existing conversation
        await fetch("/api/user/chats", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            id: currentConversationId,
            title,
            messages,
          }),
        })

        // Update local state
        setConversations(
          conversations.map((conv) =>
            conv.id === currentConversationId ? { ...conv, messages: [...messages], lastUpdated: new Date() } : conv,
          ),
        )
      }

      toast({
        title: "Conversation saved",
        description: "Your conversation has been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving conversation:", error)
      toast({
        title: "Error",
        description: "Failed to save conversation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const startNewConversation = () => {
    setCurrentConversationId("new")
  }

  const deleteConversation = async () => {
    if (currentConversationId === "new") {
      startNewConversation()
      return
    }

    try {
      const accessToken = localStorage.getItem("accessToken")
      if (!accessToken) {
        throw new Error("No access token found")
      }

      const response = await fetch(`/api/user/chats?id=${currentConversationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete conversation")
      }

      // Update local state
      setConversations(conversations.filter((conv) => conv.id !== currentConversationId))
      setCurrentConversationId("new")

      toast({
        title: "Conversation deleted",
        description: "Your conversation has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting conversation:", error)
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="col-span-2 flex h-[600px] flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>AI Trading Assistant</CardTitle>
          <CardDescription>Get personalized trading advice and market insights</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={saveConversation} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={deleteConversation} disabled={isLoading}>
            <Trash2 className="mr-2 h-4 w-4" />
            {currentConversationId === "new" ? "Clear" : "Delete"}
          </Button>
        </div>
      </CardHeader>
      <div className="px-4 pb-0 pt-2">
        <Select
          value={currentConversationId}
          onValueChange={setCurrentConversationId}
          disabled={isLoadingConversations}
        >
          <SelectTrigger>
            <SelectValue placeholder={isLoadingConversations ? "Loading conversations..." : "Select a conversation"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New Conversation</SelectItem>
            {conversations.map((conv) => (
              <SelectItem key={conv.id} value={conv.id}>
                {conv.title} ({new Date(conv.lastUpdated).toLocaleDateString()})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <CardContent className="flex-1 overflow-hidden p-0 pt-4">
        <ScrollArea className="h-[calc(600px-12rem)] px-4" ref={scrollAreaRef}>
          <div className="flex flex-col gap-4 py-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex max-w-[80%] gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <Avatar className="h-8 w-8">
                    {message.role === "assistant" ? (
                      <>
                        <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI" />
                        <AvatarFallback>
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </>
                    ) : (
                      <>
                        <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.role === "assistant" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {message.type === "text" || !message.type ? (
                      <div className="text-sm prose dark:prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : message.type === "image" && message.imageUrl ? (
                      <div className="flex flex-col gap-2">
                        <div className="text-sm">{message.content}</div>
                        <div className="relative w-full max-w-md rounded-md overflow-hidden border border-border">
                          <img
                            src={message.imageUrl || "/placeholder.svg"}
                            alt="AI Generated Chart"
                            className="object-contain w-full"
                            onError={(e) => {
                              // Use a type guard to ensure e.target is an HTMLImageElement
                              const target = e.target as (EventTarget & HTMLImageElement) | null
                              if (target) {
                                target.src = "/placeholder.svg?height=300&width=400"
                                target.alt = "Failed to load chart"
                              }
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm">{message.content}</div>
                    )}

                    <p className="mt-1 text-right text-[10px] opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex max-w-[80%] gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI" />
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-lg bg-muted px-4 py-2 text-foreground">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/50"></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-foreground/50"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-foreground/50"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex w-full items-center gap-2"
        >
          <Input
            placeholder="Ask about stocks, market trends, or trading advice..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            title="Request chart"
            onClick={() => setInput((prev) => prev + " Can you create a chart for this data?")}
            disabled={isLoading}
          >
            <BarChart2 className="h-4 w-4" />
            <span className="sr-only">Request chart</span>
          </Button>
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
