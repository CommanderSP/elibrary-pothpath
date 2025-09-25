// pothpath\src\app\admin\login\page.tsx
"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminLogin() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const adminUser = process.env.NEXT_PUBLIC_ADMIN_USERNAME || process.env.ADMIN_USERNAME
    const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD

    if (username === adminUser && password === adminPass) {
      localStorage.setItem("isAdmin", "true")
      window.location.href = "/admin"
    } else {
      setError("Invalid credentials")
    }

    setIsLoading(false)
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setError("")

    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError("Failed to initiate Google login")
      }
    } catch (error) {
      setError("Login service unavailable")
      console.error("Google login error:", error)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleGoogleCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')

    if (token) {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (data.isAdmin) {
          localStorage.setItem("isAdmin", "true")
          localStorage.setItem("adminEmail", data.email)
          window.location.href = "/admin"
        } else {
          setError("Not authorized as admin")
        }
      } catch (error) {
        setError("Verification failed")
      }
    }
  }

  useEffect(() => {
    handleGoogleCallback()
  }, [])

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <form
          className={cn("flex flex-col gap-6")}
          onSubmit={handleLogin}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">Admin Login</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Enter your credentials to access the admin panel
            </p>
          </div>

          <div className="grid gap-6">
            {/* Username/Password Fields */}
            <div className="grid gap-3">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="grid gap-3">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-destructive/15 p-3">
                <p className="text-sm text-destructive text-center">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>

            {/* Divider */}
            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="bg-background text-muted-foreground relative z-10 px-2">
                Or continue with
              </span>
            </div>

            {/* Google Login Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                "Connecting..."
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Login with Google
                </>
              )}
            </Button>
          </div>

          {/* Admin Notice */}
          <div className="text-center text-sm text-muted-foreground">
            <p>This area is restricted to authorized administrators only.</p>
          </div>
        </form>
      </div>
    </div>
  )
}