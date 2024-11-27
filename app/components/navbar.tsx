"use client"
import { useAuth } from "@/app/contexts/auth"
import { CloudUpload, Home, LogOut, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const pathname = usePathname()
  const { username } = useAuth()

  const routes = [
    { href: "/", label: "Home", icon: Home },
    { href: "/upload", label: "Upload", icon: CloudUpload },
    { href: "/profile", label: "Profile", icon: User },
  ]

  const authRoutes = [{ href: "/logout", label: "Log out", icon: LogOut }]

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true
    if (path !== "/" && pathname.startsWith(path)) return true
    return false
  }

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Brand/Logo */}
          <div className="flex items-center font-semibold text-lg text-gray-900">
            {username ? `Welcome, ${username}` : "Media de la Familia"}
          </div>

          {/* Right side - Navigation */}
          <div className="flex space-x-2 sm:space-x-4">
            {routes.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center px-8 md:px-4 py-2 text-sm font-medium rounded-md transition-colors
                  ${
                    isActive(href)
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                title={label} // Show label on hover for mobile
              >
                <Icon className="h-5 w-5" />
                <span className="hidden sm:block ml-1.5">{label}</span>
              </Link>
            ))}
          </div>

          <div className="flex space-x-2 sm:space-x-4">
            {authRoutes.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center px-8 md:px-4 py-2 text-sm font-medium rounded-md transition-colors
                ${
                  isActive(href)
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                }`}
                title={label} // Show label on hover for mobile
              >
                <Icon className="h-5 w-5" />
                <span className="hidden sm:block ml-1.5">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
