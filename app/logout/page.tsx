"use client"
import { User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { useAuth } from "@/app/contexts/auth"

export default function LogoutPage() {
  const router = useRouter()
  const { logout } = useAuth()

  useEffect(() => {
    // Call logout immediately
    logout()

    // Set up redirect timer
    const timer = setTimeout(() => {
      router.push("/login")
    }, 10000)

    // Clean up timer if component unmounts
    return () => clearTimeout(timer)
  }, [logout, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <User className="w-12 h-12 text-gray-600 animate-spin" />
      <h1 className="mt-6 text-2xl font-semibold text-gray-800">
        See you again soon
      </h1>
    </div>
  )
}
