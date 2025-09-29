"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    RefreshCw,
    CheckCircle,
    BookOpen,
    Download,
} from "lucide-react"
import { StatCard } from "@/components/admin/StatCard"
type AnalyticsBook = {
    id: string
    status: "pending" | "approved" | "rejected" | "archived"
    genre_id: string | null
    genres: { name: string } | null
    download_count: number
}

export function AnalyticsTab() {
    const [books, setBooks] = useState<AnalyticsBook[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from("books")
                .select("id, status, genre_id, genres(name), download_count")

            if (!error && data) {
                setBooks(data.map(book => ({
                    ...book,
                    genres: Array.isArray(book.genres) ? book.genres[0] : book.genres
                })) as AnalyticsBook[])
            }
            setLoading(false)
        }

        fetchData()
    }, [])

    const countsByStatus = useMemo(() => {
        const counts = { approved: 0, pending: 0, rejected: 0, archived: 0 }
        books.forEach(book => {
            counts[book.status] = (counts[book.status] || 0) + 1
        })
        return counts
    }, [books])

    const totalDownloads = useMemo(() => {
        return books.reduce((total, book) => total + book.download_count, 0)
    }, [books])

    const booksByGenre = useMemo(() => {
        const genreMap: Record<string, number> = {}
        books
            .filter(book => book.status === "approved")
            .forEach(book => {
                const genreName = book.genres?.name || "Uncategorized"
                genreMap[genreName] = (genreMap[genreName] || 0) + 1
            })
        return genreMap
    }, [books])

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Analytics</CardTitle>
                    <CardDescription>
                        Loading analytics data...
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-24 rounded-lg animate-pulse bg-muted" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid gap-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Books"
                    value={books.length}
                    description="All books in system"
                    icon={<BookOpen className="w-6 h-6" />}
                />
                <StatCard
                    title="Total Downloads"
                    value={totalDownloads}
                    description="All-time downloads"
                    icon={<Download className="w-6 h-6" />}
                />
                <StatCard
                    title="Approved Books"
                    value={countsByStatus.approved}
                    description="Currently published"
                    icon={<CheckCircle className="w-6 h-6" />}
                />
                <StatCard
                    title="Pending Review"
                    value={countsByStatus.pending}
                    description="Awaiting approval"
                    icon={<RefreshCw className="w-6 h-6" />}
                />
            </div>

            {/* Status Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Book Status Distribution</CardTitle>
                    <CardDescription>
                        Breakdown of books by approval status
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{countsByStatus.approved}</div>
                            <div className="text-sm text-muted-foreground">Approved</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600">{countsByStatus.pending}</div>
                            <div className="text-sm text-muted-foreground">Pending</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold text-red-600">{countsByStatus.rejected}</div>
                            <div className="text-sm text-muted-foreground">Rejected</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold text-gray-600">{countsByStatus.archived}</div>
                            <div className="text-sm text-muted-foreground">Archived</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Genre Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Books by Genre</CardTitle>
                    <CardDescription>
                        Distribution of approved books across genres
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {Object.keys(booksByGenre).length === 0 ? (
                        <p className="text-muted-foreground">No approved books yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(booksByGenre)
                                .sort(([, a], [, b]) => b - a)
                                .map(([genre, count]) => (
                                    <div key={genre} className="flex items-center justify-between p-3 border rounded-lg">
                                        <span className="font-medium">{genre}</span>
                                        <Badge variant="secondary">{count} books</Badge>
                                    </div>
                                ))
                            }
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}