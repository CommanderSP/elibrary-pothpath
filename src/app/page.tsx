"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Book, Cloud, Shield } from "lucide-react"

type Genre = { id: string; name: string }

export default function Home() {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [genres, setGenres] = useState<Genre[]>([])
  const [loadingGenres, setLoadingGenres] = useState(true)

  useEffect(() => {
    const fetchGenres = async () => {
      setLoadingGenres(true)
      const { data, error } = await supabase
        .from("genres")
        .select(`
        id,
        name,
        books:books!inner(id)
      `)

      if (error) {
        console.error(error)
        setGenres([])
        setLoadingGenres(false)
        return
      }

      const sorted = (data || [])
        .map(g => ({ id: g.id, name: g.name, count: g.books.length }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12)

      setGenres(sorted)
      setLoadingGenres(false)
    }
    fetchGenres()
  }, [])

  const go = () => {
    if (!q.trim()) return router.push("/library")
    router.push(`/library?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <div className="min-h-[calc(100vh-120px)] bg-white">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Discover Your Next Favorite Book
        </h1>
        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
          Explore books across various genres. Pothpath is your open library for discovering, reading, and sharing knowledge.
        </p>

        {/* Search */}
        <div className="mt-6 w-full max-w-xl mx-auto relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder="Search title or author…"
            className="w-full pl-10 pr-28 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* CTAs */}
        <div className="mt-5 flex justify-center gap-3">
          <Link href="/library">
            <Button size="lg" className="shadow-sm">Explore Library</Button>
          </Link>
          <Link href="/upload">
            <Button size="lg" variant="secondary">Upload a PDF</Button>
          </Link>
        </div>
      </section>

      {/* Popular genres */}
      <section className="max-w-6xl mx-auto px-4 pb-10">
        <h3 className="font-semibold mb-3">Popular Genres</h3>
        {loadingGenres ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-9 rounded-full bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {genres.map((g) => (
              <Link key={g.id} href={`/library?genreId=${g.id}`}>
                <div
                  className="px-3 py-2 rounded-full text-sm bg-white border shadow-sm text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer truncate"
                  title={g.name}
                >
                  {g.name}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Why */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50">
                <Book className="w-6 h-6 text-indigo-600" />
              </span>
              <CardTitle className="text-xl">Open eLibrary</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-600">
              Access a vast collection of books across all genres. Our open library is constantly growing with new additions from our community.
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="flex flex-row items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50">
                <Cloud className="w-6 h-6 text-indigo-600" />
              </span>
              <CardTitle className="text-xl">Easy Uploads</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-600">
              Share your favorite books with the community. Our simple upload process makes it easy to contribute to our growing library.
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="flex flex-row items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50">
                <Shield className="w-6 h-6 text-indigo-600" />
              </span>
              <CardTitle className="text-xl">Moderated</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-600">
              All content is carefully moderated to ensure quality and appropriateness. Enjoy a safe and respectful reading environment.
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}