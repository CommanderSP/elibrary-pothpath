// src/components/admin/BooksTab.tsx
import { useState, useEffect } from "react";
import { Search, Filter, RefreshCw, CheckCircle, XCircle, Edit, Trash2, FileText, User, Tag, Calendar, Download, BookOpen } from "lucide-react"; // Adjust paths as needed
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabaseClient"
import { EditBookModal } from "@/components/admin/EditBookModal"

type Genre = {
    id: string;
    name: string;
    slug?: string;
    color_code?: string;
    is_active: boolean;
    sort_order: number;
}

type Book = {
    id: string
    title: string
    author: string
    description: string | null
    status: "pending" | "approved" | "rejected" | "archived"
    upload_at: string
    file_url: string
    genre_id: string | null
    file_size_bytes: number | null
    download_count: number
    is_public: boolean
    upload_by: string | null
    genres?: { name: string } | null
}

export function BooksTab() {
    const [books, setBooks] = useState<Book[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "archived" | "all">("pending")
    const [sort, setSort] = useState<"newest" | "oldest" | "az">("newest")
    const [genres, setGenres] = useState<Genre[]>([])
    const [editBook, setEditBook] = useState<Book | null>(null)

    useEffect(() => {
        fetchGenres()
    }, [])

    useEffect(() => {
        fetchBooks()
    }, [search, status, sort])

    async function fetchGenres() {
        try {
            const { data, error } = await supabase
                .from("genres")
                .select("*")
                .eq("is_active", true)
                .order("sort_order")

            if (error) {
                console.error('Error fetching genres:', error)
                throw error
            }

            if (data) setGenres(data)
        } catch (error) {
            console.error('Failed to fetch genres:', error)
            alert('Failed to load genres. Check console for details.')
        }
    }
    async function fetchBooks() {
        setLoading(true)
        try {
            let query = supabase
                .from("books")
                .select(`
        *,
        genres (
          name
        )
      `)

            if (status !== "all") query = query.eq("status", status)
            if (search.trim()) {
                query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`)
            }

            if (sort === "newest") query = query.order("upload_at", { ascending: false })
            if (sort === "oldest") query = query.order("upload_at", { ascending: true })
            if (sort === "az") query = query.order("title", { ascending: true })

            const { data, error } = await query
            if (error) {
                console.error('Supabase query error:', error)
                throw error
            }

            const booksData = (data || []).map(book => ({
                ...book,
                genres: Array.isArray(book.genres) ? book.genres[0] : book.genres
            })) as Book[]

            setBooks(booksData)
        } catch (error: any) {
            console.error("Error fetching books:", error)

            // More specific error messages
            if (error.message?.includes('Failed to fetch')) {
                alert('Network error: Cannot connect to Supabase. Check your internet connection and Supabase project status.')
            } else if (error.code === 'PGRST301') {
                alert('Database error: The books table might not exist or you lack permissions.')
            } else {
                alert(`Failed to load books: ${error.message}`)
            }

            setBooks([])
        } finally {
            setLoading(false)
        }
    }

    async function updateStatus(id: string, newStatus: Book["status"]) {
        try {
            const updateData: any = {
                status: newStatus,
                updated_at: new Date().toISOString(), // Set the updated_at field
            }

            // Only set approved_at when approving
            if (newStatus === "approved") {
                updateData.approved_at = new Date().toISOString()
            }

            const { error } = await supabase
                .from("books")
                .update(updateData)
                .eq("id", id)

            if (error) {
                console.error('Update status error:', error)

                if (error.code === '23503') {
                    alert("Database constraint error: The book might reference invalid data.")
                } else if (error.code === '42501') {
                    alert("Permission denied: Check RLS policies.")
                } else {
                    alert(`Failed to update status: ${error.message}`)
                }
                return
            }

            // Remove from current view if not showing "all"
            if (status !== "all") {
                setBooks(prev => prev.filter(book => book.id !== id))
            } else {
                fetchBooks() // Refresh to update status
            }
        } catch (error: any) {
            console.error('Error updating status:', error)
            alert(`Failed to update status: ${error.message}`)
        }
    }


    async function deleteBook(id: string) {
        if (!confirm("Are you sure you want to delete this book?")) return

        const { error } = await supabase.from("books").delete().eq("id", id)
        if (error) {
            alert("Failed to delete book")
            return
        }

        setBooks(prev => prev.filter(book => book.id !== id))
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return "Unknown"
        const mb = bytes / (1024 * 1024)
        return `${mb.toFixed(2)} MB`
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { variant: "secondary" as const, label: "Pending" },
            approved: { variant: "default" as const, label: "Approved" },
            rejected: { variant: "destructive" as const, label: "Rejected" },
            archived: { variant: "outline" as const, label: "Archived" }
        }

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Book Management</CardTitle>
                <CardDescription>
                    Review and manage book submissions
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search title or author..."
                            className="pl-9"
                        />
                    </div>

                    <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                        <SelectTrigger>
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                            <SelectItem value="all">All</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={sort} onValueChange={(value: any) => setSort(value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                            <SelectItem value="az">A → Z (Title)</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button onClick={fetchBooks} variant="outline" className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                </div>

                {/* Books List */}
                {loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-20 rounded-lg animate-pulse bg-muted" />
                        ))}
                    </div>
                ) : books.length === 0 ? (
                    <div className="text-center py-12">
                        <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No books found</h3>
                        <p className="text-muted-foreground">
                            {status === "all" ? "No books in the system" : `No ${status} books found`}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {books.map((book) => (
                            <Card key={book.id} className="p-4">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold text-lg">{book.title}</h3>
                                            {getStatusBadge(book.status)}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                <span>{book.author}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Tag className="w-4 h-4" />
                                                <span>{book.genres?.name || "Uncategorized"}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>{formatDate(book.upload_at)}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Download className="w-4 h-4" />
                                                <span>{book.download_count} downloads</span>
                                            </div>
                                        </div>

                                        {book.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {book.description}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>Size: {formatFileSize(book.file_size_bytes)}</span>
                                            <span>•</span>
                                            <span>Public: {book.is_public ? "Yes" : "No"}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {book.status === "pending" && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    onClick={() => updateStatus(book.id, "approved")}
                                                    className="flex items-center gap-2"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => updateStatus(book.id, "rejected")}
                                                    className="flex items-center gap-2"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Reject
                                                </Button>
                                            </>
                                        )}

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditBook(book)}
                                            className="flex items-center gap-2"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </Button>

                                        <a
                                            href={book.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border hover:bg-accent"
                                        >
                                            <FileText className="w-4 h-4" />
                                            View PDF
                                        </a>

                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => deleteBook(book.id)}
                                            className="flex items-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Edit Modal */}
            <EditBookModal
                book={editBook}
                onClose={() => setEditBook(null)}
                onSaved={fetchBooks}
                genres={genres}
            />
        </Card>
    )
}
