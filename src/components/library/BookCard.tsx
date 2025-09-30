"use client"

import { motion } from "framer-motion"
import {
    ArrowDownTrayIcon,
    DocumentTextIcon,
    ShareIcon,
} from "@heroicons/react/24/outline"

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

const formatWhen = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

interface BookCardProps {
    book: BookRow
    viewMode: "grid" | "list"
    isFavorite: boolean
    isBookmarked: boolean
    onToggleFavorite: () => void
    onToggleBookmark: () => void
    onShare: () => void
    onViewDetails: () => void
}

export function BookCard({
    book,
    viewMode,
    onShare,
    onViewDetails
}: BookCardProps) {
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