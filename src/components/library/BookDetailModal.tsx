"use client"

import { motion } from "framer-motion"
import {
    ArrowDownTrayIcon,
    DocumentTextIcon,
    ShareIcon,
    HeartIcon,
    BookmarkIcon,
    XMarkIcon,
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

const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown"
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
}

interface BookDetailModalProps {
    book: BookRow
    isFavorite: boolean
    isBookmarked: boolean
    onClose: () => void
    onToggleFavorite: () => void
    onToggleBookmark: () => void
    onShare: () => void
}

export function BookDetailModal({
    book,
    isFavorite,
    isBookmarked,
    onClose,
    onToggleFavorite,
    onToggleBookmark,
    onShare
}: BookDetailModalProps) {
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