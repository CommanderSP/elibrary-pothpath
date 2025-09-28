"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CloudUpload, FileText, X, Loader2 } from "lucide-react"

type Genre = {
  id: string
  name: string
  slug: string
  color_code?: string
  is_active: boolean
  sort_order: number
}

export default function UploadPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [genres, setGenres] = useState<Genre[]>([])
  const [genreId, setGenreId] = useState<string>("")
  const [loadingGenres, setLoadingGenres] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Check if user is logged in
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }
      setUser(session.user)
    }
    getSession()
  }, [router])

  // Fetch genres
  useEffect(() => {
    const fetchGenres = async () => {
      setLoadingGenres(true)

      const { data, error } = await supabase
        .from("genres")
        .select("id, name, slug, color_code, is_active, sort_order")
        .eq("is_active", true)
        .order("sort_order")

      if (error) {
        console.error("Error loading genres:", error)
      } else {
        setGenres(data || [])
        if (data && data.length > 0) {
          setGenreId(data[0].id)
        }
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
    if (f.size > 50 * 1024 * 1024) { // 50MB limit
      alert("File size must be less than 50MB")
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

    if (!user) {
      alert("Please log in to upload books")
      router.push("/login")
      return
    }

    if (!file) {
      alert("Please select a PDF file")
      return
    }

    if (!title.trim()) {
      alert("Please enter a title")
      return
    }

    if (!author.trim()) {
      alert("Please enter an author")
      return
    }

    if (!genreId) {
      alert("Please select a genre")
      return
    }

    setUploading(true)

    try {
      // 1) Upload file to Storage
      const safeTitle = title.trim().replace(/\s+/g, "_").slice(0, 60)
      const filePath = `${user.id}/${Date.now()}_${safeTitle}.pdf`

      const { error: storageError } = await supabase.storage
        .from("books")
        .upload(filePath, file, {
          upsert: false,
          cacheControl: '3600'
        })

      if (storageError) throw storageError

      // 2) Get public URL
      const { data: urlData } = supabase.storage
        .from("books")
        .getPublicUrl(filePath)
      const fileUrl = urlData.publicUrl

      // 3) Insert DB row with correct column names
      const { error: dbError } = await supabase.from("books").insert([{
        title: title.trim(),
        author: author.trim(),
        description: description.trim() || null,
        file_url: fileUrl,
        genre_id: genreId,
        file_size_bytes: file.size,
        status: "pending",
        is_public: true,
        upload_by: user.id,
        upload_at: new Date().toISOString()
      }])

      if (dbError) throw dbError

      alert("🎉 Book uploaded successfully! It's now pending approval.")

      // Reset form
      setTitle("")
      setAuthor("")
      setDescription("")
      setFile(null)
      if (genres.length > 0) setGenreId(genres[0].id)

    } catch (err: any) {
      console.error("Upload failed:", err)
      alert(`❌ Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setAuthor("")
    setDescription("")
    setFile(null)
    if (genres.length > 0) setGenreId(genres[0].id)
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p>Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-120px)] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Upload a Book</CardTitle>
            <CardDescription>
              Share your knowledge with the Pothpath community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Enter book title..."
                  disabled={uploading}
                />
              </div>

              {/* Author */}
              <div className="space-y-2">
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  required
                  placeholder="Enter author name..."
                  disabled={uploading}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the book..."
                  className="min-h-[100px]"
                  disabled={uploading}
                />
              </div>

              {/* Genre */}
              <div className="space-y-2">
                <Label htmlFor="genre">Genre *</Label>
                {loadingGenres ? (
                  <div className="h-10 w-full rounded-md border bg-muted animate-pulse" />
                ) : (
                  <Select value={genreId} onValueChange={setGenreId} disabled={uploading}>
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
                )}
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file">PDF File *</Label>
                <label
                  htmlFor="fileInput"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors
                    ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
                    ${uploading ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:bg-primary/5"}
                  `}
                >
                  {file ? (
                    <div className="text-center">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-green-600" />
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <CloudUpload className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="font-medium">Drag & drop your PDF here</p>
                      <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                      <p className="text-xs text-muted-foreground mt-2">Max 50MB</p>
                    </div>
                  )}
                  <input
                    id="fileInput"
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => onFileInput(e.target.files?.[0] || null)}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>

                {file && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFile(null)}
                    disabled={uploading}
                    className="mt-2"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove File
                  </Button>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={uploading || !file || !title.trim() || !author.trim() || !genreId}
                  className="flex-1"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-4 h-4 mr-2" />
                      Upload Book
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={uploading}
                >
                  Reset
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                * Required fields. All uploads will be reviewed before being published.
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}