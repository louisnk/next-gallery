"use client"
import { fetchWithAuth } from "@/app/lib/auth-utils"
// import { useAuth } from '@/app/contexts/auth'
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function Page() {
  // const { username, logout } = useAuth()
  const username = "TEST"
  const router = useRouter()
  const [error, setError] = useState("")
  console.log("ok")

  const uploadMedia = async (e: React.FormEvent) => {
    router.push("/upload")
  }

  const getMedia = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const res = await fetchWithAuth("/api/media", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        // body: JSON.stringify({ username, password }),
      })

      const data = await res.json()
      console.log("done?", data)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unknown error occurred")
      }
    }
  }

  return (
    <div className="p-4 text-center">
      <h1>Welcome, {username}!</h1>
      <div className="flex gap-2 w-full justify-center">
        <button
          type="button"
          onClick={getMedia}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Get Media
        </button>
        <button
          type="button"
          onClick={uploadMedia}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Upload
        </button>
      </div>
    </div>
  )
}
