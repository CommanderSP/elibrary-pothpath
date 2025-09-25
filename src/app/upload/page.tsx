"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { motion } from "framer-motion"
import { CloudArrowUpIcon, DocumentTextIcon } from "@heroicons/react/24/outline"

type Genre = { id: string; name: string }

export default function UploadPage() {
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Genres (dynamic)
  const [genres, setGenres] = useState<Genre[]>([])
  const [genreId, setGenreId] = useState<string>("")
  const [loadingGenres, setLoadingGenres] = useState(true)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    const fetchGenres = async () => {
      setLoadingGenres(true)
      const { data, error } = await supabase
        .from("genres")
        .select("*")
        .order("name")
      if (error) {
        console.error("Error loading genres:", error)
      } else {
        setGenres((data || []) as Genre[])
        if (data && data.length > 0) setGenreId(data[0].id)
      }
      setLoadingGenres(false)
    }
    fetchGenres()
  }, [])

  const onFileInput = (f: File | null) => {
    if (!f) return
    if (f.type !== "application/pdf") {
      alert("Please upload a PDF file")
      return
    }
    setFile(f)
  }

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragActive(true)
  }
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragActive(false)
  }
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files?.[0]
    onFileInput(f || null)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return alert("Please select a PDF file")
    if (!genreId) return alert("Please select a genre")

    try {
      setUploading(true)

      // 1) Upload file to Storage
      const safeTitle = title.trim().replace(/\s+/g, "_").slice(0, 60)
      const filePath = `${Date.now()}_${safeTitle || "book"}.pdf`
      const { error: storageError } = await supabase.storage
        .from("books")
        .upload(filePath, file, { upsert: false })

      if (storageError) throw storageError

      // 2) Get public URL
      const { data } = supabase.storage
        .from("books")
        .getPublicUrl(filePath)
      const fileUrl = data.publicUrl

      // 3) Insert DB row with genre_id
      const { error: dbError } = await supabase.from("books").insert([
        { title, author, description, file_url: fileUrl, genre_id: genreId, status: "pending" },
      ])
      if (dbError) throw dbError

      alert("🎉 Book uploaded successfully (awaiting approval)")
      setTitle("")
      setAuthor("")
      setDescription("")
      setFile(null)
      if (genres.length > 0) setGenreId(genres[0].id)
    } catch (err) {
      console.error("Upload failed:", err)
      alert("❌ Upload failed — check console for details")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4 py-10">
      <motion.div
        className="w-full max-w-2xl bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-indigo-100"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="px-6 sm:px-8 pt-7 pb-2 border-b">
          <h1 className="text-3xl font-extrabold text-indigo-700 tracking-tight text-center">
            📚 Upload a Book
          </h1>
          <p className="text-center text-sm text-gray-500 mt-2">
            All uploads are moderated before appearing in the library.
          </p>
        </div>

        <form onSubmit={handleUpload} className="p-6 sm:p-8 space-y-5">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Enter title..."
              className="mt-1 w-full border px-4 py-2.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Author */}
          <div>
            <label className="text-sm font-medium text-gray-700">Author</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author name..."
              className="mt-1 w-full border px-4 py-2.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              className="mt-1 w-full border px-4 py-2.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 h-28"
            />
          </div>

          {/* Genre */}
          <div>
            <label className="text-sm font-medium text-gray-700">Genre</label>
            <div className="mt-1">
              {loadingGenres ? (
                <div className="w-full h-10 rounded-lg bg-gray-100 animate-pulse" />
              ) : (
                <select
                  value={genreId}
                  onChange={(e) => setGenreId(e.target.value)}
                  className="w-full border px-4 py-2.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {genres.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Drag & drop file zone */}
          <div>
            <label className="text-sm font-medium text-gray-700">PDF File</label>
            <motion.label
              htmlFor="fileInput"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              whileHover={{ scale: 1.01 }}
              className={`mt-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition ${
                dragActive ? "border-indigo-400 bg-indigo-50" : "border-gray-300 bg-gray-50"
              }`}
            >
              <CloudArrowUpIcon className="w-10 h-10 text-indigo-500 mb-2" />
              {file ? (
                <p className="text-sm text-gray-700 flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-gray-500" />
                  {file.name}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Drag & drop or click to choose a PDF</p>
              )}
              <input
                id="fileInput"
                type="file"
                accept="application/pdf"
                onChange={(e) => onFileInput(e.target.files?.[0] || null)}
                className="hidden"
              />
            </motion.label>
            <p className="text-xs text-gray-400 mt-1">Only PDF files are accepted.</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <motion.button
              type="submit"
              disabled={uploading || loadingGenres || !genreId}
              whileHover={{ scale: uploading ? 1 : 1.02 }}
              whileTap={{ scale: uploading ? 1 : 0.98 }}
              className={`flex-1 py-3 rounded-lg font-semibold text-white shadow-sm transition ${
                uploading || loadingGenres || !genreId
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              }`}
            >
              {uploading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Uploading...
                </span>
              ) : (
                "🚀 Upload Book"
              )}
            </motion.button>

            <button
              type="button"
              onClick={() => {
                setTitle(""); setAuthor(""); setDescription(""); setFile(null)
                if (genres.length > 0) setGenreId(genres[0].id)
              }}
              className="px-4 py-3 rounded-lg border text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}