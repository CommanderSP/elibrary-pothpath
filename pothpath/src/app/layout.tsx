import "./globals.css"
import type { Metadata } from "next"
import Link from "next/link"
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "@/components/ui/navigation-menu"

export const metadata: Metadata = {
  title: "Pothpath",
  description: "An open library and blog.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          {/* Navigation bar */}
          <header className="border-b">
            <nav className="container mx-auto flex items-center justify-between py-4">
              <h1 className="text-xl font-bold">📚 Pothpath</h1>
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem><Link href="/" className="px-3 py-2 hover:text-blue-600">Home</Link></NavigationMenuItem>
                  <NavigationMenuItem><Link href="/library" className="px-3 py-2 hover:text-blue-600">Library</Link></NavigationMenuItem>
                  <NavigationMenuItem><Link href="/blog" className="px-3 py-2 hover:text-blue-600">Blog</Link></NavigationMenuItem>
                  <NavigationMenuItem><Link href="/upload" className="px-3 py-2 hover:text-blue-600">Upload</Link></NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </nav>
          </header>

          {/* Main */}
          <main className="flex-grow container mx-auto p-6">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t py-4 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Pothpath. Built with Next.js & love ❤️
          </footer>
        </div>
      </body>
    </html>
  )
}