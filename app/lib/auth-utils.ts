export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token")

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    // Handle unauthorized error (optional)
    localStorage.removeItem("token")
    localStorage.removeItem("username")
    window.location.href = "/login"
    throw new Error("Unauthorized")
  }

  return response
}
