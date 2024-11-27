"use client"
import { usePathname, useRouter } from "next/navigation"
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"

import { PUBLIC_PATHS } from "@/app/lib/constants"

interface AuthContextType {
  isAuthenticated: boolean
  username: string | null
  login: (token: string, username: string) => Promise<boolean>
  logout: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // useEffect(() => {
  //   // Check authentication status on mount
  //   checkAuth()
  // }, [])

  // useEffect(() => {
  //   const handleStorageChange = () => {
  //     checkAuth()
  //   }

  //   window.addEventListener('storage', handleStorageChange)
  //   checkAuth()

  //   return () => {
  //     window.removeEventListener('storage', handleStorageChange)
  //   }
  // }, [])

  useEffect(() => {
    // Redirect logic
    if (!isLoading) {
      if (!isAuthenticated && !PUBLIC_PATHS.includes(pathname)) {
        console.log("fail")
        router.push("/login")
      } else if (isAuthenticated && pathname === "/login") {
        console.log("isLoading, isAuthenticated, pathname")
        router.push("/")
      }
    } else if (!isAuthenticated) {
      checkAuth()
    } else {
      console.log("Broken")
    }
  }, [isAuthenticated, pathname, isLoading, router.push])

  const checkAuth = () => {
    try {
      const token = localStorage.getItem("token")
      const storedUsername = localStorage.getItem("username")

      if (token && storedUsername) {
        setIsAuthenticated(true)
        setUsername(storedUsername)
      } else {
        setIsAuthenticated(false)
        setUsername(null)
      }
    } catch (err) {
      setIsAuthenticated(false)
      setUsername(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (token: string, username: string): Promise<boolean> => {
    localStorage.setItem("token", token)
    localStorage.setItem("username", username)
    setIsAuthenticated(true)
    setUsername(username)

    return true
  }

  const logout = (): boolean => {
    localStorage.removeItem("token")
    localStorage.removeItem("username")
    setIsAuthenticated(false)
    setUsername(null)
    router.push("/login")

    return true
  }

  if (isLoading) {
    return <div>Loading...</div> // Or your loading component
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
