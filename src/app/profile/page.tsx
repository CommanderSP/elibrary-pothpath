"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    User,
    Mail,
    Calendar,
    Book,
    CloudUpload,
    Download,
    Edit3,
    Save,
    X,
    LogOut,
    Shield
} from "lucide-react"

type UserProfile = {
    id: string
    email: string
    user_metadata?: {
        full_name?: string
        avatar_url?: string
        bio?: string
    }
    created_at: string
}

type UserBook = {
    id: string
    title: string
    author: string
    status: string
    created_at: string
    download_count: number
    genres: {
        name: string
    } | null
}

export default function ProfilePage() {
    const router = useRouter()
    const [user, setUser] = useState<UserProfile | null>(null)
    const [userBooks, setUserBooks] = useState<UserBook[]>([])
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        full_name: "",
        bio: ""
    })

    useEffect(() => {
        const getProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                router.push("/login")
                return
            }

            setUser({
                id: session.user.id,
                email: session.user.email!,
                user_metadata: session.user.user_metadata,
                created_at: session.user.created_at
            })

            setFormData({
                full_name: session.user.user_metadata?.full_name || "",
                bio: session.user.user_metadata?.bio || ""
            })

            // Fetch user's uploaded books
            const { data: books, error } = await supabase
                .from("books")
                .select("*, genres(name)")
                .eq("created_by", session.user.id)
                .order("created_at", { ascending: false })

            if (!error && books) {
                setUserBooks(books as UserBook[])
            }

            setLoading(false)
        }

        getProfile()
    }, [router])

    const handleSaveProfile = async () => {
        if (!user) return

        setSaving(true)
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: formData.full_name,
                    bio: formData.bio
                }
            })

            if (error) throw error

            // Update local user state
            setUser(prev => prev ? {
                ...prev,
                user_metadata: {
                    ...prev.user_metadata,
                    full_name: formData.full_name,
                    bio: formData.bio
                }
            } : null)

            setEditing(false)
        } catch (error) {
            console.error("Error updating profile:", error)
        } finally {
            setSaving(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/")
    }

    const getInitials = (name: string, email: string) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        }
        return email.slice(0, 2).toUpperCase()
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
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

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="min-h-[calc(100vh-120px)]">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">User Profile</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage your account and view your uploaded books
                        </p>
                    </div>
                    <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2 sm:w-auto w-full">
                        <LogOut className="w-4 h-4" />
                        Logout
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column - Profile Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Profile Card */}
                        <Card>
                            <CardHeader className="text-center">
                                <div className="flex justify-center mb-4">
                                    <Avatar className="w-24 h-24 border-4 border-background">
                                        <AvatarImage src={user.user_metadata?.avatar_url} />
                                        <AvatarFallback className="text-lg">
                                            {getInitials(formData.full_name, user.email)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <CardTitle>
                                    {editing ? (
                                        <Input
                                            value={formData.full_name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                            placeholder="Full Name"
                                        />
                                    ) : (
                                        user.user_metadata?.full_name || "Anonymous User"
                                    )}
                                </CardTitle>
                                <CardDescription className="flex items-center justify-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    {user.email}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4" />
                                    <span>Joined {formatDate(user.created_at)}</span>
                                </div>

                                <div className="flex items-center gap-2 text-sm">
                                    <Book className="w-4 h-4" />
                                    <span>{userBooks.length} books uploaded</span>
                                </div>

                                <div className="flex items-center gap-2 text-sm">
                                    <Shield className="w-4 h-4" />
                                    <span>Verified Account</span>
                                </div>

                                <Separator />

                                <div>
                                    <Label htmlFor="bio" className="text-sm font-medium mb-2 block">
                                        Bio
                                    </Label>
                                    {editing ? (
                                        <Textarea
                                            id="bio"
                                            value={formData.bio}
                                            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                            placeholder="Tell us about yourself..."
                                            rows={4}
                                        />
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            {user.user_metadata?.bio || "No bio yet."}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    {editing ? (
                                        <>
                                            <Button
                                                onClick={handleSaveProfile}
                                                disabled={saving}
                                                className="flex-1 flex items-center gap-2"
                                            >
                                                <Save className="w-4 h-4" />
                                                {saving ? "Saving..." : "Save"}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => setEditing(false)}
                                                className="flex items-center gap-2"
                                            >
                                                <X className="w-4 h-4" />
                                                Cancel
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            onClick={() => setEditing(true)}
                                            className="w-full flex items-center gap-2"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            Edit Profile
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - User's Books */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CloudUpload className="w-5 h-5" />
                                    Your Uploaded Books
                                </CardTitle>
                                <CardDescription>
                                    Manage and track the books you've uploaded to Pothpath
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {userBooks.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Book className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No books uploaded yet</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Start sharing your knowledge by uploading your first book
                                        </p>
                                        <Button asChild>
                                            <a href="/upload">Upload Your First Book</a>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {userBooks.map((book) => (
                                            <div key={book.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-semibold">{book.title}</h3>
                                                        {getStatusBadge(book.status)}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-1">
                                                        by {book.author}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span>{book.genres?.name || "Uncategorized"}</span>
                                                        <span>•</span>
                                                        <span>Uploaded {formatDate(book.created_at)}</span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <Download className="w-3 h-3" />
                                                            {book.download_count} downloads
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}