// Authentication service for handling API calls

interface RegisterData {
  username: string
  email: string
  password: string
}

interface LoginData {
  username: string
  password: string
}

interface AuthResponse {
  access: string
  refresh: string
}

const API_URL = "http://127.0.0.1:8000"

export const AuthService = {
  // Register a new user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/api/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Registration failed")
    }

    return response.json()
  },

  // Login user
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/api/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Login failed")
    }

    return response.json()
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<{ access: string }> => {
    const response = await fetch(`${API_URL}/api/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (!response.ok) {
      throw new Error("Token refresh failed")
    }

    return response.json()
  },

  // Get user profile with token
  getUserProfile: async (token: string): Promise<any> => {
    const response = await fetch(`${API_URL}/api/user/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      throw new Error("Failed to fetch user profile")
    }

    const data = await response.json()
    return {
      id: data.id,
      username: data.username,
      email: data.email,
    }
  },
}
