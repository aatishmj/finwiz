// News service for fetching news from API routes

interface NewsItem {
  id: string
  title: string
  content: string
  source: string
  date: string
  url?: string
  category?: string
  tags?: string[]
}

export const NewsService = {
  // Get latest news
  getLatestNews: async (limit = 10): Promise<NewsItem[]> => {
    try {
      const response = await fetch(`/api/news?limit=${limit}`)

      if (!response.ok) {
        throw new Error("Failed to fetch news")
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      console.error("Error fetching news:", error)
      throw new Error("Failed to fetch news")
    }
  },

  // Get news by category
  getNewsByCategory: async (category: string, limit = 10): Promise<NewsItem[]> => {
    try {
      const response = await fetch(`/api/news?category=${encodeURIComponent(category)}&limit=${limit}`)

      if (!response.ok) {
        throw new Error("Failed to fetch news by category")
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      console.error("Error fetching news by category:", error)
      throw new Error("Failed to fetch news by category")
    }
  },

  // Search news
  searchNews: async (query: string, limit = 10): Promise<NewsItem[]> => {
    try {
      const response = await fetch(`/api/news?query=${encodeURIComponent(query)}&limit=${limit}`)

      if (!response.ok) {
        throw new Error("Failed to search news")
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      console.error("Error searching news:", error)
      throw new Error("Failed to search news")
    }
  },
}
