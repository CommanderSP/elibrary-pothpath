// components/navigation.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export function Navigation() {
    const pathname = usePathname()

    const links = [
        { name: "Home", href: "/" },
        { name: "Library", href: "/library" },
        { name: "About", href: "/about" },
        { name: "Upload", href: "/upload" },
    ]

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between">
                {/* Left section (Logo + Center Nav) */}
                <div className="flex items-center gap-6">
                    <Link
                        href="/"
                        className="flex items-center gap-2 font-semibold pl-4"
                        aria-label="BPothpath homepage"
                    >
                        <span>Pothpath</span>
                    </Link>
                    <nav className="hidden sm:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center gap-4">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-primary",
                                    pathname === link.href ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="absolute right-0 top-0 h-14 flex items-center gap-2 pr-4">
                    <Link
                        href="/login"
                        className={buttonVariants({ variant: "outline" })}
                    >
                        Login
                    </Link>
                </div>
            </div>
        </header>
    )
}