// Utility functions for authentication

export async function verifyToken(token: string) {
  try {
    // Decode the JWT token to extract user information
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )

    const payload = JSON.parse(jsonPayload)

    // Extract user information from the payload
    const email = payload.email || ""
    let username = payload.username || ""

    // If no username is provided, generate one from email
    if (!username && email) {
      // Use the part before @ in email as username
      username = email.split("@")[0]
    }

    return {
      id: payload.user_id || payload.sub,
      username: username,
      email: email || "",
    }
  } catch (error) {
    console.error("Error decoding token:", error)
    return null
  }
}
