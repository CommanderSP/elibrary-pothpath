"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Cog,
  LogOut,
  RefreshCw,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  FileText,
  Search,
  Filter,
  BookOpen,
  BarChart3,
  Tag,
  Download,
  User,
  Calendar
} from "lucide-react"

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

type AnalyticsBook = {
  id: string
  status: "pending" | "approved" | "rejected" | "archived"
  genre_id: string | null
  genres: { name: string } | null
  download_count: number
}

const ALLOWED_ADMIN_EMAILS = process.env.NEXT_PUBLIC_ALLOWED_ADMIN_EMAILS?.split(',') || []

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  // Check if user is admin and has allowed email
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }

      // Check if user's email is in the allowed list
      const userEmail = session.user.email
      if (!userEmail || !ALLOWED_ADMIN_EMAILS.includes(userEmail)) {
        setAccessDenied(true)
        setLoading(false)
        return
      }

      setUser(session.user)
      setLoading(false)
    }
    getSession()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the admin panel.
          </p>
          <Button onClick={() => router.push("/")}>
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-120px)]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Cog className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage books, genres, and view analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              Logged in as: {user?.email}
            </div>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2 sm:w-auto w-full">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="books" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="books" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Books
            </TabsTrigger>
            <TabsTrigger value="genres" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Genres
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="books">
            <BooksTab />
          </TabsContent>

          <TabsContent value="genres">
            <GenresTab />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

/* ----------------- Books Tab ----------------- */

function BooksTab() {
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

function EditBookModal({
  book,
  onClose,
  onSaved,
  genres
}: {
  book: Book | null
  onClose: () => void
  onSaved: () => void
  genres: Genre[]
}) {
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [description, setDescription] = useState("")
  const [genreId, setGenreId] = useState<string>("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (book) {
      setTitle(book.title)
      setAuthor(book.author)
      setDescription(book.description || "")
      setGenreId(book.genre_id || "")
    }
  }, [book])

  async function save() {
    if (!book) return

    setSaving(true)
    const { error } = await supabase
      .from("books")
      .update({
        title,
        author,
        description: description || null,
        genre_id: genreId || null
      })
      .eq("id", book.id)

    setSaving(false)

    if (error) {
      alert("Failed to update book")
      return
    }

    onSaved()
    onClose()
  }

  if (!book) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Edit Book</CardTitle>
          <CardDescription>
            Update book information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Book title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Book description"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="genre">Genre</Label>
            <Select value={genreId} onValueChange={setGenreId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a genre" />
              </SelectTrigger>
              <SelectContent>
                {genres.map((genre) => (
                  <SelectItem key={genre.id} value={genre.id}>
                    {genre.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <div className="flex gap-3 p-6 pt-0">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={save} disabled={saving} className="flex-1">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card>
    </div>
  )
}

/* ----------------- Genres Tab ----------------- */

function GenresTab() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState("")

  useEffect(() => {
    fetchGenres()
  }, [])

  async function fetchGenres() {
    setLoading(true)
    const { data, error } = await supabase
      .from("genres")
      .select("*")
      .order("sort_order")

    setLoading(false)
    if (!error && data) setGenres(data)
  }

  async function addGenre() {
    if (!newName.trim()) return

    const { error } = await supabase
      .from("genres")
      .insert([{
        name: newName.trim(),
        slug: newName.trim().toLowerCase().replace(/\s+/g, '-'),
        sort_order: genres.length
      }])

    if (error) {
      alert("Failed to add genre (maybe duplicate name)")
      return
    }

    setNewName("")
    fetchGenres()
  }

  async function editGenre(id: string, currentName: string) {
    const name = prompt("Edit genre name:", currentName)
    if (!name || name.trim() === currentName) return

    const { error } = await supabase
      .from("genres")
      .update({
        name: name.trim(),
        slug: name.trim().toLowerCase().replace(/\s+/g, '-')
      })
      .eq("id", id)

    if (error) {
      alert("Failed to rename genre")
      return
    }

    fetchGenres()
  }

  async function deleteGenre(id: string, name: string) {
    if (!confirm(`Delete genre "${name}"? Books linked to this genre will keep the genre_id but show as "Uncategorized".`)) {
      return
    }

    const { error } = await supabase.from("genres").delete().eq("id", id)
    if (error) {
      alert("Failed to delete genre")
      return
    }

    fetchGenres()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Genre Management</CardTitle>
        <CardDescription>
          Add, edit, and manage book genres
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 mb-6">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New genre name"
            className="flex-1"
            onKeyPress={(e) => e.key === 'Enter' && addGenre()}
          />
          <Button onClick={addGenre}>
            Add Genre
          </Button>
        </div>

        <Separator className="my-6" />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg animate-pulse bg-muted" />
            ))}
          </div>
        ) : genres.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No genres found</h3>
            <p className="text-muted-foreground">Create your first genre above</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {genres.map((genre) => (
              <Card key={genre.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {genre.color_code && (
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: genre.color_code }}
                      />
                    )}
                    <span className="font-medium">{genre.name}</span>
                    <Badge variant={genre.is_active ? "default" : "secondary"}>
                      {genre.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Order: {genre.sort_order}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => editGenre(genre.id, genre.name)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteGenre(genre.id, genre.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ----------------- Analytics Tab ----------------- */

function AnalyticsTab() {
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

function StatCard({
  title,
  value,
  description,
  icon
}: {
  title: string
  value: number
  description: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}