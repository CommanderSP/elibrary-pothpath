import { useState, useEffect } from "react";
import { Edit, Trash2, Tag } from "lucide-react"; // Adjust paths as needed
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabaseClient"
import { Separator } from "@/components/ui/separator";

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

export function GenresTab() {
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