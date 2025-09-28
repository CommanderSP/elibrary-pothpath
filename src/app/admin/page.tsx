"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { motion, AnimatePresence } from "framer-motion"
import {
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  ChartPieIcon,
} from "@heroicons/react/24/outline"
import { Pie } from "react-chartjs-2"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(ArcElement, Tooltip, Legend)

type Genre = { id: string; name: string }
type Book = {
  id: number | string
  title: string
  author: string | null
  description: string | null
  status: "pending" | "approved" | "rejected"
  created_at?: string | null
  file_url: string
  genre_id: string | null
  genres?: { id: string; name: string } | null
}

type AnalyticsBook = {
  id: number | string
  status: "pending" | "approved" | "rejected"
  genre_id: string | null
  genres: { name: string }[] | null
}

const Tabs = ["books", "genres", "analytics"] as const
type Tab = typeof Tabs[number]

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("books")

  return (
    <div className="min-h-[calc(100vh-120px)] bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Cog6ToothIcon className="w-7 h-7 text-indigo-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold">Admin Dashboard</h1>
          </div>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white hover:bg-gray-50"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {Tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md capitalize ${tab === t ? "bg-indigo-600 text-white" : "bg-white border hover:bg-gray-50"
                }`}
            >
              {t}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "books" && (
            <motion.div
              key="books"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
            >
              <BooksTab />
            </motion.div>
          )}

          {tab === "genres" && (
            <motion.div
              key="genres"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
            >
              <GenresTab />
            </motion.div>
          )}

          {tab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
            >
              <AnalyticsTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ----------------- Books Tab ----------------- */

function BooksTab() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "all">("pending")
  const [sort, setSort] = useState<"newest" | "oldest" | "az">("newest")

  const [genres, setGenres] = useState<Genre[]>([])
  const [edit, setEdit] = useState<Book | null>(null)

  useEffect(() => {
    fetchGenres()
  }, [])

  useEffect(() => {
    fetchBooks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, sort])

  async function fetchGenres() {
    const { data, error } = await supabase.from("genres").select("*").order("name")
    if (!error && data) setGenres(data as Genre[])
  }

  async function fetchBooks() {
    setLoading(true)
    try {
      let q = supabase
        .from("books")
        .select("id, title, author, description, status, created_at, file_url, genre_id, genres(id, name)")
      if (status !== "all") q = q.eq("status", status)
      if (search.trim()) q = q.or(`title.ilike.%${search}%,author.ilike.%${search}%`)

      if (sort === "newest") q = q.order("created_at", { ascending: false })
      if (sort === "oldest") q = q.order("created_at", { ascending: true })
      if (sort === "az") q = q.order("title", { ascending: true })

      const { data, error } = await q
      if (error) throw error
      const booksData = (data || []).map(book => ({
        ...book,
        genres: book.genres?.[0] || null
      })) as Book[];
      setBooks(booksData)
    } catch (e) {
      console.error(e)
      setBooks([])
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: Book["id"], newStatus: Book["status"]) {
    const { error } = await supabase.from("books").update({ status: newStatus }).eq("id", id)
    if (error) return alert("Failed to update status")
    setBooks((prev) => prev.filter((b) => b.id !== id))
  }

  async function deleteBook(id: Book["id"]) {
    if (!confirm("Delete this book?")) return
    const { error } = await supabase.from("books").delete().eq("id", id)
    if (error) return alert("Failed to delete")
    setBooks((prev) => prev.filter((b) => b.id !== id))
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or author..."
            className="w-full pl-10 pr-3 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="relative">
          <FunnelIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full pl-10 pr-3 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
        <div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">A → Z (Title)</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBooks}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border bg-white hover:bg-gray-50"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Title</th>
              <th className="text-left p-3">Author</th>
              <th className="text-left p-3">Genre</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">Loading…</td>
              </tr>
            ) : books.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">No books found</td>
              </tr>
            ) : (
              books.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="p-3">
                    <div className="font-semibold">{b.title}</div>
                    {b.description && <div className="text-gray-500 line-clamp-1">{b.description}</div>}
                  </td>
                  <td className="p-3">{b.author || "-"}</td>
                  <td className="p-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                      {b.genres?.name || "Uncategorized"}
                    </span>
                  </td>
                  <td className="p-3 capitalize">{b.status}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {b.status === "pending" && (
                        <>
                          <button
                            onClick={() => updateStatus(b.id, "approved")}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700"
                          >
                            <CheckCircleIcon className="w-4 h-4" /> Approve
                          </button>
                          <button
                            onClick={() => updateStatus(b.id, "rejected")}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                          >
                            <XCircleIcon className="w-4 h-4" /> Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setEdit(b)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded border hover:bg-gray-50"
                      >
                        <PencilSquareIcon className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => deleteBook(b.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        <TrashIcon className="w-4 h-4" /> Delete
                      </button>
                      <a
                        href={b.file_url}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded border hover:bg-gray-50"
                      >
                        <DocumentTextIcon className="w-4 h-4" /> PDF
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EditModal open={!!edit} book={edit} onClose={() => setEdit(null)} onSaved={fetchBooks} />
    </div>
  )
}

function EditModal({
  open,
  book,
  onClose,
  onSaved,
}: {
  open: boolean
  book: Book | null
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [description, setDescription] = useState("")
  const [genreId, setGenreId] = useState<string>("")
  const [genres, setGenres] = useState<Genre[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !book) return
    setTitle(book.title || "")
    setAuthor(book.author || "")
    setDescription(book.description || "")
    setGenreId(book.genre_id || book.genres?.id || "")
    loadGenres()
  }, [open, book])

  async function loadGenres() {
    const { data } = await supabase.from("genres").select("*").order("name")
    setGenres((data || []) as Genre[])
  }

  async function save() {
    if (!book) return
    setSaving(true)
    const { error } = await supabase
      .from("books")
      .update({ title, author, description, genre_id: genreId || null })
      .eq("id", book.id)
    setSaving(false)
    if (error) return alert("Failed to save")
    onSaved()
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-lg bg-white rounded-xl shadow-xl p-6"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
          >
            <h3 className="text-lg font-bold mb-4">Edit Book</h3>
            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border px-3 py-2 rounded"
                placeholder="Title"
              />
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full border px-3 py-2 rounded"
                placeholder="Author"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border px-3 py-2 rounded h-28"
                placeholder="Description"
              />
              <select
                value={genreId}
                onChange={(e) => setGenreId(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">Uncategorized</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={onClose} className="px-3 py-2 rounded border hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
    const { data, error } = await supabase.from("genres").select("*").order("name")
    setLoading(false)
    if (!error && data) setGenres(data as Genre[])
  }

  async function add() {
    if (!newName.trim()) return
    const { error } = await supabase.from("genres").insert([{ name: newName.trim() }])
    if (error) return alert("Failed to add genre (maybe duplicate name)")
    setNewName("")
    fetchGenres()
  }

  async function edit(id: string, current: string) {
    const name = prompt("Edit genre name:", current)
    if (!name || name.trim() === current) return
    const { error } = await supabase.from("genres").update({ name: name.trim() }).eq("id", id)
    if (error) return alert("Failed to rename genre")
    fetchGenres()
  }

  async function del(id: string) {
    if (!confirm("Delete this genre? Books linked to this genre will keep the old id."))
      return
    const { error } = await supabase.from("genres").delete().eq("id", id)
    if (error) return alert("Failed to delete genre")
    fetchGenres()
  }

  return (
    <div className="bg-white border rounded-xl p-6">
      <h3 className="text-lg font-bold mb-4">Manage Genres</h3>

      <div className="flex gap-2 mb-4">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New genre name"
          className="flex-1 border px-3 py-2 rounded"
        />
        <button onClick={add} className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700">
          Add
        </button>
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={2} className="p-6 text-center text-gray-500">Loading…</td>
              </tr>
            ) : genres.length === 0 ? (
              <tr>
                <td colSpan={2} className="p-6 text-center text-gray-500">No genres found</td>
              </tr>
            ) : (
              genres.map((g) => (
                <tr key={g.id} className="border-t">
                  <td className="p-3">{g.name}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => edit(g.id, g.name)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded border hover:bg-gray-50"
                      >
                        <PencilSquareIcon className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => del(g.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        <TrashIcon className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ----------------- Analytics Tab ----------------- */

function AnalyticsTab() {
  const [books, setBooks] = useState<AnalyticsBook[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ; (async () => {
      setLoading(true)
      const { data: b } = await supabase
        .from("books")
        .select("id, status, genre_id, genres(name)")
      setBooks((b || []) as AnalyticsBook[])
      setLoading(false)
    })()
  }, [])

  const countsByStatus = useMemo(() => {
    const c = { approved: 0, pending: 0, rejected: 0 }
    books.forEach((b) => (c[b.status] = (c[b.status] || 0) + 1))
    return c
  }, [books])

  const byGenre = useMemo(() => {
    const map: Record<string, number> = {}
    books
      .filter((b) => b.status === "approved")
      .forEach((b) => {
        const name = b.genres?.[0]?.name || "Uncategorized"
        map[name] = (map[name] || 0) + 1
      })
    const labels = Object.keys(map)
    const values = labels.map((l) => map[l])

    // colors for the pie
    const palette = [
      "#6366F1", "#22C55E", "#F59E0B", "#EF4444", "#06B6D4", "#A855F7", "#84CC16",
      "#EAB308", "#F97316", "#0EA5E9", "#14B8A6", "#EC4899", "#6B7280", "#059669",
      "#7C3AED", "#4ADE80", "#F43F5E"
    ]
    const bg = labels.map((_, i) => palette[i % palette.length])

    return { labels, values, bg }
  }, [books])

  if (loading) return <p className="p-6 text-gray-500">Loading analytics…</p>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Approved" value={countsByStatus.approved} color="bg-green-100 text-green-700" />
        <StatCard title="Pending" value={countsByStatus.pending} color="bg-yellow-100 text-yellow-700" />
        <StatCard title="Rejected" value={countsByStatus.rejected} color="bg-red-100 text-red-700" />
      </div>

      <div className="bg-white border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <ChartPieIcon className="w-6 h-6 text-indigo-600" />
          <h3 className="text-lg font-bold">Approved Books by Genre</h3>
        </div>
        {byGenre.labels.length === 0 ? (
          <p className="text-gray-500">No approved books yet.</p>
        ) : (
          <div className="max-w-3xl">
            <Pie
              data={{
                labels: byGenre.labels,
                datasets: [
                  {
                    label: "Books",
                    data: byGenre.values,
                    backgroundColor: byGenre.bg,
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "right" },
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl p-5 border bg-white flex items-center gap-4`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>{value}</div>
      <div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
    </div>
  )
}