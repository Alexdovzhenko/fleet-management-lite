"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  Paperclip,
  ImageIcon,
  FileText,
  FileCode,
  File,
  X,
  Eye,
  Loader2,
  Upload,
  Download,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useUploadAttachment, useDeleteAttachment } from "@/lib/hooks/use-attachments"
import type { TripAttachment, PendingFile } from "@/types"
import { cn } from "@/lib/utils"

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_FILES = 5
const MAX_SIZE = 3 * 1024 * 1024 // 3 MB
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "heic", "pdf", "doc", "docx", "txt"]
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
])

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon
  if (mimeType === "application/pdf") return FileText
  if (mimeType === "text/plain") return FileCode
  if (mimeType.includes("word")) return FileText
  return File
}

function isImage(mimeType: string) {
  return mimeType.startsWith("image/")
}

function isPdf(mimeType: string) {
  return mimeType === "application/pdf"
}

function isText(mimeType: string) {
  return mimeType === "text/plain"
}

function isOffice(mimeType: string) {
  return mimeType.includes("word") || mimeType === "application/msword"
}

// ── Preview Modal Component ──────────────────────────────────────────────────

interface PreviewModalProps {
  attachment: TripAttachment | PendingFile | null
  onClose: () => void
}

function AttachmentPreviewModal({ attachment, onClose }: PreviewModalProps) {
  const [textContent, setTextContent] = useState<string | null>(null)
  const [textLoading, setTextLoading] = useState(false)

  const url = attachment
    ? "url" in attachment && "tripId" in attachment
      ? (attachment as TripAttachment).url
      : (attachment as PendingFile).localUrl
    : null
  const mimeType = attachment?.mimeType ?? ""
  const name = attachment?.name ?? ""

  // Fetch text content for TXT files
  useEffect(() => {
    if (!attachment || !isText(mimeType)) {
      setTextContent(null)
      return
    }

    setTextLoading(true)
    const fetchUrl =
      "url" in attachment && "tripId" in attachment
        ? (attachment as TripAttachment).url
        : (attachment as PendingFile).localUrl

    fetch(fetchUrl)
      .then((r) => r.text())
      .then((t) => setTextContent(t))
      .catch(() => setTextContent("Could not load file content."))
      .finally(() => setTextLoading(false))
  }, [attachment, mimeType])

  if (!attachment) return null

  return (
    <Dialog open={!!attachment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b border-gray-100">
          <DialogTitle className="text-sm font-semibold text-gray-900 truncate">{name}</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          {isImage(mimeType) && (
            <img
              src={url!}
              alt={name}
              className="max-w-full max-h-[70vh] object-contain mx-auto block rounded-lg"
            />
          )}
          {isPdf(mimeType) && (
            <iframe
              src={url!}
              className="w-full h-[70vh] rounded-lg border border-gray-100"
              title={name}
            />
          )}
          {isText(mimeType) &&
            (textLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto max-h-[70vh] bg-gray-50 rounded-xl p-4 font-mono">
                {textContent}
              </pre>
            ))}
          {isOffice(mimeType) && (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-gray-500">
              <FileText className="w-12 h-12 text-gray-300" />
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-gray-400">Office documents cannot be previewed in the browser</p>
              <a
                href={url!}
                download={name}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download file
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Attachment Card Component ────────────────────────────────────────────────

interface AttachmentCardProps {
  name: string
  mimeType: string
  size: number
  isDeleting?: boolean
  isUploading?: boolean
  onPreview: () => void
  onRemove: () => void
}

function AttachmentCard({
  name,
  mimeType,
  size,
  isDeleting,
  isUploading,
  onPreview,
  onRemove,
}: AttachmentCardProps) {
  const Icon = getFileIcon(mimeType)
  const busy = isDeleting || isUploading

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all",
        busy
          ? "opacity-60 bg-gray-50 border-gray-100"
          : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
      )}
    >
      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
        {isDeleting || isUploading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
        ) : (
          <Icon className="w-3.5 h-3.5 text-gray-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate">{name}</p>
        <p className="text-[11px] text-gray-400">{formatFileSize(size)}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={onPreview}
          disabled={busy}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={busy}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Main Section Component ───────────────────────────────────────────────────

interface TripAttachmentsSectionProps {
  mode: "create" | "edit"
  tripId?: string
  existingAttachments?: TripAttachment[]
  onPendingFilesChange?: (files: PendingFile[]) => void
}

interface UploadingFile {
  id: string
  name: string
  mimeType: string
  size: number
}

export function TripAttachmentsSection({
  mode,
  tripId,
  existingAttachments = [],
  onPendingFilesChange,
}: TripAttachmentsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewTarget, setPreviewTarget] = useState<TripAttachment | PendingFile | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  // Create mode state
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])

  // Edit mode: track files currently being uploaded (with unique client-side IDs)
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map())

  // Edit mode mutations
  const uploadMutation = useUploadAttachment(tripId ?? "")
  const deleteMutation = useDeleteAttachment(tripId ?? "")

  const totalCount = mode === "create"
    ? pendingFiles.length
    : existingAttachments.length + uploadingFiles.size

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      setError(null)

      const remaining = MAX_FILES - totalCount
      if (remaining <= 0) {
        setError(`Maximum ${MAX_FILES} files allowed`)
        return
      }

      const toProcess = Array.from(files).slice(0, remaining)
      const errors: string[] = []

      for (const file of toProcess) {
        if (file.size > MAX_SIZE) {
          errors.push(`"${file.name}" exceeds 3 MB`)
          continue
        }
        if (!ALLOWED_TYPES.has(file.type)) {
          errors.push(`"${file.name}" is not a supported file type`)
          continue
        }

        if (mode === "create") {
          const pending: PendingFile = {
            id: crypto.randomUUID(),
            file,
            localUrl: URL.createObjectURL(file),
            name: file.name,
            mimeType: file.type,
            size: file.size,
          }
          setPendingFiles((prev) => {
            const next = [...prev, pending]
            onPendingFilesChange?.(next)
            return next
          })
        } else if (mode === "edit" && tripId) {
          // Create a client-side tracking ID immediately
          const uploadId = crypto.randomUUID()
          const uploadingFile: UploadingFile = {
            id: uploadId,
            name: file.name,
            mimeType: file.type,
            size: file.size,
          }

          // Show file immediately in UI while uploading
          setUploadingFiles((prev) => new Map(prev).set(uploadId, uploadingFile))

          // Start the upload
          uploadMutation.mutate(file, {
            onSuccess: () => {
              // Remove from local tracking once confirmed by API
              setUploadingFiles((prev) => {
                const next = new Map(prev)
                next.delete(uploadId)
                return next
              })
            },
            onError: (err) => {
              // Remove from tracking and show error
              setUploadingFiles((prev) => {
                const next = new Map(prev)
                next.delete(uploadId)
                return next
              })
              setError(err instanceof Error ? err.message : "Upload failed")
            },
          })
        }
      }

      if (errors.length > 0) setError(errors.join("; "))
    },
    [mode, tripId, totalCount, onPendingFilesChange, uploadMutation]
  )

  const handleRemovePending = (id: string) => {
    setPendingFiles((prev) => {
      const target = prev.find((f) => f.id === id)
      if (target) URL.revokeObjectURL(target.localUrl)
      const next = prev.filter((f) => f.id !== id)
      onPendingFilesChange?.(next)
      return next
    })
  }

  const handleRemoveExisting = (attachmentId: string) => {
    setDeletingIds((s) => new Set(s).add(attachmentId))
    deleteMutation.mutate(attachmentId, {
      onSettled: () => {
        setDeletingIds((s) => {
          const n = new Set(s)
          n.delete(attachmentId)
          return n
        })
      },
      onError: (err) => setError(err instanceof Error ? err.message : "Delete failed"),
    })
  }

  const atLimit = totalCount >= MAX_FILES

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100">
        <div
          className="w-6 h-6 rounded-lg bg-violet-500 flex items-center justify-center flex-shrink-0"
          style={{ boxShadow: "0 2px 8px rgba(139,92,246,0.30)" }}
        >
          <Paperclip className="w-3 h-3 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-800">Attachments</h3>
          <p className="text-[11px] text-gray-400">Up to {MAX_FILES} files · Max 3 MB each</p>
        </div>
        <button
          type="button"
          disabled={atLimit}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
            atLimit
              ? "opacity-40 cursor-not-allowed bg-gray-100 text-gray-400"
              : "bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100"
          )}
        >
          <Upload className="w-3 h-3" />
          Upload file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
          className="sr-only"
          onChange={(e) => {
            handleFileSelect(e.target.files)
            e.target.value = ""
          }}
        />
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-2">
        {/* Error */}
        {error && (
          <p className="text-[11px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Existing attachments (edit mode) */}
        {mode === "edit" &&
          existingAttachments.map((att) => (
            <AttachmentCard
              key={att.id}
              name={att.name}
              mimeType={att.mimeType}
              size={att.size}
              isDeleting={deletingIds.has(att.id)}
              onPreview={() => setPreviewTarget(att)}
              onRemove={() => handleRemoveExisting(att.id)}
            />
          ))}

        {/* Currently uploading files (edit mode) - shown immediately with spinner */}
        {mode === "edit" &&
          Array.from(uploadingFiles.values()).map((uploadingFile) => (
            <AttachmentCard
              key={uploadingFile.id}
              name={uploadingFile.name}
              mimeType={uploadingFile.mimeType}
              size={uploadingFile.size}
              isUploading={true}
              onPreview={() => {}} // Disabled during upload
              onRemove={() => {}} // Disabled during upload
            />
          ))}

        {/* Pending files (create mode) */}
        {mode === "create" &&
          pendingFiles.map((pf) => (
            <AttachmentCard
              key={pf.id}
              name={pf.name}
              mimeType={pf.mimeType}
              size={pf.size}
              onPreview={() => setPreviewTarget(pf)}
              onRemove={() => handleRemovePending(pf.id)}
            />
          ))}

        {/* Empty state */}
        {totalCount === 0 && (
          <p className="text-center text-[11px] text-gray-400 py-4">
            No attachments yet
          </p>
        )}
      </div>

      {/* Preview modal */}
      <AttachmentPreviewModal attachment={previewTarget} onClose={() => setPreviewTarget(null)} />
    </div>
  )
}
