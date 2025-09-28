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

  // Genres (dynamic)
  const [genres, setGenres] = useState<Genre[]>([])
  const [genreId, setGenreId] = useState<string>("")
  const [loadingGenres, setLoadingGenres] = useState(true)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    const fetchGenres = async () => {
      setLoadingGenres(true);

      const { data, error } = await supabase
        .from("genres")
        .select("id, name, slug, color_code, is_active, sort_order")
        .order("sort_order")
        .eq("is_active", true);

      if (error) {
        console.error("Error loading genres:", error);
      } else {
        console.log("Fetched genres:", data);  // Log the fetched data for debugging
        setGenres((data || []) as Genre[]);
        if (data && data.length > 0) {
          setGenreId(data[0].id);
        }
      }
      setLoadingGenres(false);
    };

    fetchGenres();
  }, []);


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
    }
  }

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br flex items-center justify-center px-4 py-10">
      <motion.div
        className="w-full max-w-2xl backdrop-blur rounded-2xl shadow-xl border"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="px-6 sm:px-8 pt-7 pb-2 border-b">
          <h1 className="text-3xl font-extrabold tracking-tight text-center">
          </h1>
          <p className="text-center text-sm mt-2">
          </p>
        </div>

        <form onSubmit={handleUpload} className="p-6 sm:p-8 space-y-5">
          {/* Title */}
          <div>
            <label className="text-sm font-medium">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Enter title..."
              className="mt-1 w-full border px-4 py-2.5 rounded-lg shadow-sm focus:outline-none focus:ring-2"
            />
          </div>

          {/* Author */}
          <div>
            <label className="text-sm font-medium">Author</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author name..."
              className="mt-1 w-full border px-4 py-2.5 rounded-lg shadow-sm focus:outline-none focus:ring-2"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              className="mt-1 w-full border px-4 py-2.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 h-28"
            />
          </div>

          {/* Genre */}
          <div>
            <label className="text-sm font-medium">Genre</label>
            <div className="mt-1">
              {loadingGenres ? (
                <div className="w-full h-10 rounded-lg animate-pulse" />
              ) : (
                <select
                  value={genreId}
                  onChange={(e) => setGenreId(e.target.value)}
                  className="w-full border px-4 py-2.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
            <label className="text-sm font-medium">PDF File</label>
            <motion.label
              htmlFor="fileInput"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              whileHover={{ scale: 1.01 }}
              className={`mt-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition"
                }`}
            >
              <CloudArrowUpIcon className="w-10 h-10 mb-2" />
              {file ? (
                <p className="text-sm flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5" />
                  {file.name}
                </p>
              ) : (
                <p className="text-sm">Drag & drop or click to choose a PDF</p>
              )}
              <input
                id="fileInput"
                type="file"
                accept="application/pdf"
                onChange={(e) => onFileInput(e.target.files?.[0] || null)}
                className="hidden"
              />
            </motion.label>
            <p className="text-xs mt-1">Max 50MB</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <motion.button
              type="submit"
              disabled={loadingGenres || !genreId}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-3 rounded-lg font-semibold shadow-sm transition`}
            >Upload
            </motion.button>

            <button
              type="button"
              onClick={() => {
                setTitle(""); setAuthor(""); setDescription(""); setFile(null)
                if (genres.length > 0) setGenreId(genres[0].id)
              }}
              className="px-4 py-3 rounded-lg border"
            >
              Reset
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}