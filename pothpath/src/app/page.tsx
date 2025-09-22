"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MagnifyingGlassIcon, BookOpenIcon, CloudArrowUpIcon, ShieldCheckIcon } from "@heroicons/react/24/outline"

type Genre = { id: string; name: string }

export default function Home() {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [genres, setGenres] = useState<Genre[]>([])
  const [loadingGenres, setLoadingGenres] = useState(true)

  useEffect(() => {
    const fetchGenres = async () => {
      setLoadingGenres(true)
      const { data } = await supabase.from("genres").select("*").order("name").limit(10)
      setGenres(data || [])
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
          Pothpath — Your Open eLibrary
        </h1>
        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
          Search, explore, and upload community‑curated books in seconds.
        </p>

        {/* Search */}
        <div className="mt-6 w-full max-w-xl mx-auto relative">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder="Search title or author…"
            className="w-full pl-10 pr-28 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <Button onClick={go} className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg">
            Search
          </Button>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
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

      {/* Why Pothpath (simple cards) */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50">
                <BookOpenIcon className="w-6 h-6 text-indigo-600" />
              </span>
              <CardTitle className="text-xl">Open eLibrary</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-600">
              Browse community‑curated books and documents for free.
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="flex flex-row items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50">
                <CloudArrowUpIcon className="w-6 h-6 text-indigo-600" />
              </span>
              <CardTitle className="text-xl">Easy Uploads</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-600">
              Upload PDFs in seconds — title, author, and genre.
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="flex flex-row items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50">
                <ShieldCheckIcon className="w-6 h-6 text-indigo-600" />
              </span>
              <CardTitle className="text-xl">Moderated</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-600">
              Admin approval keeps quality high and content safe.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <Card className="text-center p-8">
          <h2 className="text-2xl sm:text-3xl font-bold">Start your journey on Pothpath</h2>
          <p className="mt-2 text-gray-600">
            Explore classics, discover articles, or contribute your own work.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link href="/upload">
              <Button size="lg" className="shadow-sm">Upload a PDF</Button>
            </Link>
            <Link href="/library">
              <Button size="lg" variant="secondary">Browse Library</Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  )
}