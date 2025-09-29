"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { motion, AnimatePresence } from "framer-motion"
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  HeartIcon,
  ShareIcon,
  BookmarkIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  ListBulletIcon
} from "@heroicons/react/24/outline"
import {
  HeartIcon as HeartSolidIcon,
  BookmarkIcon as BookmarkSolidIcon
} from "@heroicons/react/24/solid"

type BookRow = {
  id: string
  title: string
  author: string | null
  description: string | null
  file_url: string
  upload_at: string
  file_size_bytes: number | null
  download_count: number
  is_public: boolean
  genres: { name: string; color_code?: string } | null
}

type Genre = { id: string; name: string; color_code?: string }

const PAGE_SIZE = 12

// Utility functions
const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "Unknown"
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(1)} MB`
}

const formatWhen = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

export default function LibraryPage() {
  const [books, setBooks] = useState<BookRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  // filters & state
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<"newest" | "oldest" | "az" | "popular">("newest")
  const [genres, setGenres] = useState<Genre[]>([])
  const [genreId, setGenreId] = useState<string>("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const [selectedBook, setSelectedBook] = useState<BookRow | null>(null)

  // load genres once
  useEffect(() => {
    const fetchGenres = async () => {
      const { data, error } = await supabase
        .from("genres")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
      if (!error && data) setGenres(data as Genre[])
    }
    fetchGenres()

    // Load user preferences from localStorage
    const savedFavorites = localStorage.getItem('library-favorites')
    const savedBookmarks = localStorage.getItem('library-bookmarks')
    const savedViewMode = localStorage.getItem('library-view-mode')

    if (savedFavorites) setFavorites(new Set(JSON.parse(savedFavorites)))
    if (savedBookmarks) setBookmarks(new Set(JSON.parse(savedBookmarks)))
    if (savedViewMode) setViewMode(savedViewMode as "grid" | "list")
  }, [])

  // fetch first page whenever filters change
  useEffect(() => {
    fetchBooks(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sort, genreId])

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('library-favorites', JSON.stringify(Array.from(favorites)))
  }, [favorites])

  useEffect(() => {
    localStorage.setItem('library-bookmarks', JSON.stringify(Array.from(bookmarks)))
  }, [bookmarks])

  useEffect(() => {
    localStorage.setItem('library-view-mode', viewMode)
  }, [viewMode])

  // build query and fetch
  async function fetchBooks(reset = false) {
    if (reset) {
      setLoading(true)
      setBooks([])
      setHasMore(true)
    } else {
      setLoadingMore(true)
    }

    try {
      let query = supabase
        .from("books")
        .select("*, genres(name, color_code)", { count: "exact" })
        .eq("status", "approved")
        .eq("is_public", true)

      if (genreId) query = query.eq("genre_id", genreId)
      if (search.trim()) {
        const term = search.trim()
        query = query.or(`title.ilike.%${term}%,author.ilike.%${term}%,description.ilike.%${term}%`)
      }

      // Apply sorting
      switch (sort) {
        case "newest":
          query = query.order("upload_at", { ascending: false })
          break
        case "oldest":
          query = query.order("upload_at", { ascending: true })
          break
        case "az":
          query = query.order("title", { ascending: true })
          break
      }

      // pagination range
      const from = reset ? 0 : books.length
      const to = from + PAGE_SIZE - 1
      const { data, error, count } = await query.range(from, to)

      if (error) throw error

      const newRows = (data || []) as BookRow[]
      setBooks(reset ? newRows : [...books, ...newRows])

      if (count !== null) {
        setHasMore((reset ? newRows.length : books.length + newRows.length) < count)
      } else {
        setHasMore(newRows.length === PAGE_SIZE)
      }
    } catch (err) {
      console.error("Error fetching books:", err)
      if (reset) setBooks([])
      setHasMore(false)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // UI helpers
  const formattedCount = useMemo(() => books.length, [books])

  const toggleFavorite = (bookId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(bookId)) {
        newFavorites.delete(bookId)
      } else {
        newFavorites.add(bookId)
      }
      return newFavorites
    })
  }

  const toggleBookmark = (bookId: string) => {
    setBookmarks(prev => {
      const newBookmarks = new Set(prev)
      if (newBookmarks.has(bookId)) {
        newBookmarks.delete(bookId)
      } else {
        newBookmarks.add(bookId)
      }
      return newBookmarks
    })
  }

  const shareBook = async (book: BookRow) => {
    const shareData = {
      title: book.title,
      text: `Check out "${book.title}" by ${book.author} on Pothpath`,
      url: window.location.href
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      await navigator.clipboard.writeText(book.file_url)
      alert("Book link copied to clipboard!")
    }
  }

  const clearFilters = () => {
    setSearch("")
    setGenreId("")
    setSort("newest")
  }

  const filteredBooks = useMemo(() => {
    return books
  }, [books])

  return (
    <div className="min-h-[calc(100vh-120px)]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8"
        >
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text">
              📚 Pothpath Library
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Discover and explore approved books from our community
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm backdrop-blur-sm px-4 py-2 rounded-full border shadow-sm">
              <span className="font-semibold">{formattedCount}</span> book{formattedCount === 1 ? "" : "s"} available
            </div>
            <div className="flex gap-1 backdrop-blur-sm p-1 rounded-lg border shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8"
        >
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, or description..."
              className="w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent backdrop-blur-sm bg-background"
            />
          </div>

          {/* Genre Filter */}
          <div className="relative">
            <FunnelIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select
              value={genreId}
              onChange={(e) => setGenreId(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent backdrop-blur-sm bg-background"
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort & Filter Toggle */}
          <div className="flex gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="flex-1 px-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent backdrop-blur-sm bg-background"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="az">A → Z (Title)</option>
              <option value="popular">Most Popular</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 border rounded-xl shadow-sm transition-colors backdrop-blur-sm bg-background hover:bg-accent"
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Active Filters */}
        {(search || genreId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex flex-wrap items-center gap-2 mb-6"
          >
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-accent">
                Search: "{search}"
                <button onClick={() => setSearch("")} className="hover:bg-accent/50 rounded-full p-0.5">
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            {genreId && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-accent">
                Genre: {genres.find(g => g.id === genreId)?.name}
                <button onClick={() => setGenreId("")} className="hover:bg-accent/50 rounded-full p-0.5">
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-sm underline text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          </motion.div>
        )}

        {/* Grid/List View */}
        {loading ? (
          <div className={viewMode === "grid"
            ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "space-y-4"
          }>
            {Array.from({ length: 8 }).map((_, i) => (
              <BookCardSkeleton key={i} viewMode={viewMode} />
            ))}
          </div>
        ) : filteredBooks.length === 0 ? (
          <EmptyState onClearFilters={clearFilters} hasFilters={!!(search || genreId)} />
        ) : (
          <>
            <AnimatePresence>
              <motion.div
                className={viewMode === "grid"
                  ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "space-y-4"
                }
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.05 } },
                }}
              >
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    viewMode={viewMode}
                    isFavorite={favorites.has(book.id)}
                    isBookmarked={bookmarks.has(book.id)}
                    onToggleFavorite={() => toggleFavorite(book.id)}
                    onToggleBookmark={() => toggleBookmark(book.id)}
                    onShare={() => shareBook(book)}
                    onViewDetails={() => setSelectedBook(book)}
                  />
                ))}
              </motion.div>
            </AnimatePresence>

            {hasMore && (
              <div className="flex justify-center mt-12">
                <motion.button
                  onClick={() => fetchBooks(false)}
                  disabled={loadingMore}
                  className="px-8 py-3 border-2 rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-background hover:bg-accent"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-primary" />
                      Loading...
                    </span>
                  ) : (
                    "Load More Books"
                  )}
                </motion.button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Book Detail Modal */}
      <AnimatePresence>
        {selectedBook && (
          <BookDetailModal
            book={selectedBook}
            isFavorite={favorites.has(selectedBook.id)}
            isBookmarked={bookmarks.has(selectedBook.id)}
            onClose={() => setSelectedBook(null)}
            onToggleFavorite={() => toggleFavorite(selectedBook.id)}
            onToggleBookmark={() => toggleBookmark(selectedBook.id)}
            onShare={() => shareBook(selectedBook)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function BookCard({
  book,
  viewMode,
  isFavorite,
  isBookmarked,
  onToggleFavorite,
  onToggleBookmark,
  onShare,
  onViewDetails
}: {
  book: BookRow
  viewMode: "grid" | "list"
  isFavorite: boolean
  isBookmarked: boolean
  onToggleFavorite: () => void
  onToggleBookmark: () => void
  onShare: () => void
  onViewDetails: () => void
}) {
  if (viewMode === "list") {
    return (
      <motion.div
        className="rounded-xl border shadow-sm hover:shadow-md transition-all p-6 group bg-card"
        variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-16 h-20 rounded-lg flex items-center justify-center bg-muted">
            <DocumentTextIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg leading-tight line-clamp-2 transition-colors group-hover:text-primary">
                  {book.title}
                </h3>
                {book.author && (
                  <p className="mt-1 text-muted-foreground">by {book.author}</p>
                )}
              </div>
            </div>

            {book.description && (
              <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                {book.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-accent`}>
                {book.genres?.name || "Uncategorized"}
              </span>
              <span>{formatWhen(book.upload_at)}</span>
              <span>{formatFileSize(book.file_size_bytes)}</span>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <a
                href={book.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 transition-colors text-primary hover:bg-primary/10 rounded-lg"
              >
                <DocumentTextIcon className="w-4 h-4" />
                Read
              </a>
              <a
                href={book.file_url}
                download
                className="inline-flex items-center gap-2 px-4 py-2 border transition-colors hover:bg-accent rounded-lg"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Download
              </a>
              <button
                onClick={onViewDetails}
                className="ml-auto text-sm transition-colors text-muted-foreground hover:text-foreground"
              >
                Details
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Grid View
  return (
    <motion.div
      className="rounded-xl border shadow-sm hover:shadow-xl transition-all p-5 group bg-card"
      variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      {/* Header with genre and actions */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-accent`}>
          {book.genres?.name || "Uncategorized"}
        </span>
      </div>

      {/* Book icon */}
      <div className="w-12 h-16 rounded-lg flex items-center justify-center mb-4 mx-auto bg-muted">
        <DocumentTextIcon className="w-6 h-6 text-primary" />
      </div>

      {/* Content */}
      <h3 className="font-semibold text-lg leading-tight line-clamp-2 mb-2 transition-colors group-hover:text-primary">
        {book.title}
      </h3>

      {book.author && (
        <p className="text-sm mb-3 text-muted-foreground">by {book.author}</p>
      )}

      {/* Metadata */}
      <div className="flex justify-between text-xs mb-4 text-muted-foreground">
        <span>{formatWhen(book.upload_at)}</span>
        <span>{formatFileSize(book.file_size_bytes)}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <a
          href={book.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-primary hover:bg-primary/10"
        >
          <DocumentTextIcon className="w-4 h-4" />
          Read
        </a>
        <a
          href={book.file_url}
          download
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border text-sm rounded-lg transition-colors hover:bg-accent"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Save
        </a>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <button
          onClick={onShare}
          className="text-xs transition-colors flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ShareIcon className="w-3 h-3" />
          Share
        </button>
        <button
          onClick={onViewDetails}
          className="text-xs transition-colors text-muted-foreground hover:text-foreground"
        >
          Details
        </button>
      </div>
    </motion.div>
  )
}

function BookCardSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  if (viewMode === "list") {
    return (
      <div className="rounded-xl border shadow-sm p-6 bg-card">
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-16 h-20 rounded-lg animate-pulse bg-muted" />
          <div className="flex-1 space-y-3">
            <div className="h-6 rounded animate-pulse w-3/4 bg-muted" />
            <div className="h-4 rounded animate-pulse w-1/2 bg-muted" />
            <div className="h-4 rounded animate-pulse w-full bg-muted" />
            <div className="h-4 rounded animate-pulse w-2/3 bg-muted" />
            <div className="flex gap-4">
              <div className="h-8 rounded animate-pulse w-24 bg-muted" />
              <div className="h-8 rounded animate-pulse w-24 bg-muted" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border shadow-sm p-5 space-y-3 bg-card">
      <div className="h-4 rounded animate-pulse w-1/3 bg-muted" />
      <div className="w-12 h-16 rounded-lg animate-pulse mx-auto bg-muted" />
      <div className="h-6 rounded animate-pulse bg-muted" />
      <div className="h-4 rounded animate-pulse w-2/3 mx-auto bg-muted" />
      <div className="h-12 rounded animate-pulse bg-muted" />
      <div className="h-3 rounded animate-pulse w-full bg-muted" />
    </div>
  )
}

function EmptyState({ onClearFilters, hasFilters }: { onClearFilters: () => void; hasFilters: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-20 rounded-2xl border-2 border-dashed border-border bg-card"
    >
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
        <DocumentTextIcon className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-2xl font-semibold mb-2">No books found</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {hasFilters
          ? "Try adjusting your search criteria or filters to find more books."
          : "The library is currently empty. Check back later for new additions!"
        }
      </p>
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="px-6 py-3 transition-colors bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
        >
          Clear Filters
        </button>
      )}
    </motion.div>
  )
}

function BookDetailModal({
  book,
  isFavorite,
  isBookmarked,
  onClose,
  onToggleFavorite,
  onToggleBookmark,
  onShare
}: {
  book: BookRow
  isFavorite: boolean
  isBookmarked: boolean
  onClose: () => void
  onToggleFavorite: () => void
  onToggleBookmark: () => void
  onShare: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-accent`}>
                {book.genres?.name || "Uncategorized"}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="w-20 h-28 rounded-xl flex items-center justify-center mx-auto mb-4 bg-muted">
              <DocumentTextIcon className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{book.title}</h2>
            {book.author && <p className="text-lg text-muted-foreground">by {book.author}</p>}
          </div>

          {book.description && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="leading-relaxed text-muted-foreground">{book.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 rounded-lg bg-accent">
              <div className="text-2xl font-bold">{formatFileSize(book.file_size_bytes)}</div>
              <div className="text-sm text-muted-foreground">File Size</div>
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href={book.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 transition-colors font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
            >
              <DocumentTextIcon className="w-5 h-5" />
              Read Online
            </a>
            <a
              href={book.file_url}
              download
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition-colors font-semibold hover:bg-accent"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Download
            </a>
            <button
              onClick={onShare}
              className="px-4 py-3 border rounded-lg transition-colors hover:bg-accent"
            >
              <ShareIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-border">
            <button
              onClick={onToggleFavorite}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-accent transition-colors"
            >
              {isFavorite ? (
                <HeartSolidIcon className="w-5 h-5 text-red-500" />
              ) : (
                <HeartIcon className="w-5 h-5" />
              )}
              <span>{isFavorite ? "Favorited" : "Add to Favorites"}</span>
            </button>
            <button
              onClick={onToggleBookmark}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-accent transition-colors"
            >
              {isBookmarked ? (
                <BookmarkSolidIcon className="w-5 h-5 text-primary" />
              ) : (
                <BookmarkIcon className="w-5 h-5" />
              )}
              <span>{isBookmarked ? "Bookmarked" : "Add to Bookmarks"}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}