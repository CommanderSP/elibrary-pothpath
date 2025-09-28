"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import {
    Book,
    CloudUpload,
    User,
    LogOut,
    Menu,
    X,
    Home,
} from "lucide-react"

export function Navigation() {
    const pathname = usePathname()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [user, setUser] = useState<any>(null)

    // Check if user is logged in (you might want to use a context or session provider for this)
    React.useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setUser(session?.user || null)
        }

        getSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setIsMenuOpen(false)
    }

    const navItems = [
        { href: "/", label: "Home", icon: Home },
        { href: "/library", label: "Library", icon: Book },
        { href: "/upload", label: "Upload", icon: CloudUpload },
    ]

    const isActive = (path: string) => pathname === path

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                        📚 Pothpath
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${isActive(item.href) ? "text-primary" : "text-muted-foreground"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Right side items */}
                    <div className="flex items-center gap-4">
                        {/* Theme Toggle */}
                        <ModeToggle />

                        {/* Auth buttons - Desktop */}
                        <div className="hidden md:flex items-center gap-2">
                            {user ? (
                                <div className="flex items-center gap-3">
                                    <Link href="/profile">
                                        <Button variant="ghost" size="sm" className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            Profile
                                        </Button>
                                    </Link>
                                    <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link href="/login">
                                        <Button variant="ghost" size="sm">
                                            Login
                                        </Button>
                                    </Link>
                                    <Link href="/signup">
                                        <Button size="sm">
                                            Sign Up
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <button
                            className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden border-t py-4">
                        <nav className="flex flex-col gap-4">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md transition-colors ${isActive(item.href)
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:text-primary hover:bg-muted"
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {item.label}
                                    </Link>
                                )
                            })}

                            {/* Mobile Auth buttons */}
                            <div className="border-t pt-4 mt-2">
                                {user ? (
                                    <div className="flex flex-col gap-2">
                                        <Link
                                            href="/profile"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                                        >
                                            <User className="w-5 h-5" />
                                            Profile
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors text-left"
                                        >
                                            <LogOut className="w-5 h-5" />
                                            Logout
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <Link
                                            href="/login"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                                        >
                                            Login
                                        </Link>
                                        <Link
                                            href="/signup"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                        >
                                            Sign Up
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    )
}