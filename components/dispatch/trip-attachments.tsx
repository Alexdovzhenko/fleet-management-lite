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
  CloudUpload,
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

function isImage(mimeType: string) { return mimeType.startsWith("image/") }
function isPdf(mimeType: string)   { return mimeType === "application/pdf" }
function isText(mimeType: string)  { return mimeType === "text/plain" }
function isOffice(mimeType: string){ return mimeType.includes("word") || mimeType === "application/msword" }

// ── Preview Modal ────────────────────────────────────────────────────────────

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

  useEffect(() => {
    if (!attachment || !isText(mimeType)) { setTextContent(null); return }
    setTextLoading(true)
    const fetchUrl = "url" in attachment && "tripId" in attachment
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
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden" style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.10)" }}>
        <DialogHeader className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <DialogTitle className="text-sm font-semibold truncate" style={{ color: "rgba(255,255,255,0.90)" }}>{name}</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          {isImage(mimeType) && (
            <img src={url!} alt={name} className="max-w-full max-h-[70vh] object-contain mx-auto block rounded-xl" />
          )}
          {isPdf(mimeType) && (
            <iframe src={url!} className="w-full h-[70vh] rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.08)" }} title={name} />
          )}
          {isText(mimeType) && (
            textLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "rgba(200,212,228,0.40)" }} />
              </div>
            ) : (
              <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-[70vh] rounded-xl p-4 font-mono" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(200,212,228,0.80)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {textContent}
              </pre>
            )
          )}
          {isOffice(mimeType) && (
            <div className="flex flex-col items-center justify-center gap-4 py-12" style={{ color: "rgba(200,212,228,0.55)" }}>
              <FileText className="w-12 h-12" style={{ color: "rgba(200,212,228,0.25)" }} />
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>{name}</p>
              <p className="text-xs">Office documents cannot be previewed in the browser</p>
              <a href={url!} download={name} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors" style={{ background: "#c9a87c", color: "#0d1526" }}>
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

// ── Attachment Card ───────────────────────────────────────────────────────────

interface AttachmentCardProps {
  name: string
  mimeType: string
  size: number
  isDeleting?: boolean
  isUploading?: boolean
  onPreview: () => void
  onRemove: () => void
}

function AttachmentCard({ name, mimeType, size, isDeleting, isUploading, onPreview, onRemove }: AttachmentCardProps) {
  const Icon = getFileIcon(mimeType)
  const busy = isDeleting || isUploading

  return (
    <div
      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all"
      style={{
        background: busy ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        opacity: busy ? 0.6 : 1,
      }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,168,124,0.10)", border: "1px solid rgba(201,168,124,0.18)" }}>
        {busy
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "#c9a87c" }} />
          : <Icon className="w-3.5 h-3.5" style={{ color: "#c9a87c" }} />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: "rgba(255,255,255,0.88)" }}>{name}</p>
        <p className="text-[11px]" style={{ color: "rgba(200,212,228,0.45)" }}>{formatFileSize(size)}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={onPreview}
          disabled={busy}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40"
          style={{ color: "rgba(200,212,228,0.45)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(200,212,228,0.45)" }}
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={busy}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40"
          style={{ color: "rgba(200,212,228,0.45)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.10)"; (e.currentTarget as HTMLElement).style.color = "rgba(248,113,113,0.85)" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(200,212,228,0.45)" }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Main Section ─────────────────────────────────────────────────────────────

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

export function TripAttachmentsSection({ mode, tripId, existingAttachments = [], onPendingFilesChange }: TripAttachmentsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewTarget, setPreviewTarget] = useState<TripAttachment | PendingFile | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [isDragOver, setIsDragOver] = useState(false)

  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map())

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
      if (remaining <= 0) { setError(`Maximum ${MAX_FILES} files allowed`); return }

      const toProcess = Array.from(files).slice(0, remaining)
      const errors: string[] = []

      for (const file of toProcess) {
        if (file.size > MAX_SIZE) { errors.push(`"${file.name}" exceeds 3 MB`); continue }
        if (!ALLOWED_TYPES.has(file.type)) { errors.push(`"${file.name}" is not a supported file type`); continue }

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
          const uploadId = crypto.randomUUID()
          const uploadingFile: UploadingFile = { id: uploadId, name: file.name, mimeType: file.type, size: file.size }
          setUploadingFiles((prev) => new Map(prev).set(uploadId, uploadingFile))
          uploadMutation.mutate(file, {
            onSuccess: () => {
              setUploadingFiles((prev) => { const next = new Map(prev); next.delete(uploadId); return next })
            },
            onError: (err) => {
              setUploadingFiles((prev) => { const next = new Map(prev); next.delete(uploadId); return next })
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
        setDeletingIds((s) => { const n = new Set(s); n.delete(attachmentId); return n })
      },
      onError: (err) => setError(err instanceof Error ? err.message : "Delete failed"),
    })
  }

  const atLimit = totalCount >= MAX_FILES

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.07)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
        <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: "#c9a87c" }} />
        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,168,124,0.12)", border: "1px solid rgba(201,168,124,0.20)" }}>
          <Paperclip className="w-3 h-3" style={{ color: "#c9a87c" }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.90)" }}>Attachments</h3>
          <p className="text-[11px]" style={{ color: "rgba(200,212,228,0.45)" }}>Up to {MAX_FILES} files · Max 3 MB each</p>
        </div>
        <button
          type="button"
          disabled={atLimit}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "rgba(201,168,124,0.12)", color: "#c9a87c", border: "1px solid rgba(201,168,124,0.25)" }}
          onMouseEnter={e => { if (!atLimit) (e.currentTarget as HTMLElement).style.background = "rgba(201,168,124,0.20)" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(201,168,124,0.12)" }}
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
          onChange={(e) => { handleFileSelect(e.target.files); e.target.value = "" }}
        />
      </div>

      {/* Body */}
      <div className="px-4 py-3.5 space-y-2">
        {/* Error */}
        {error && (
          <p className="text-[11px] rounded-lg px-3 py-2" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: "rgba(248,113,113,0.85)" }}>
            {error}
          </p>
        )}

        {/* Existing attachments (edit mode) */}
        {mode === "edit" && existingAttachments.map((att) => (
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

        {/* Uploading files (edit mode) */}
        {mode === "edit" && Array.from(uploadingFiles.values()).map((f) => (
          <AttachmentCard
            key={f.id}
            name={f.name}
            mimeType={f.mimeType}
            size={f.size}
            isUploading={true}
            onPreview={() => {}}
            onRemove={() => {}}
          />
        ))}

        {/* Pending files (create mode) */}
        {mode === "create" && pendingFiles.map((pf) => (
          <AttachmentCard
            key={pf.id}
            name={pf.name}
            mimeType={pf.mimeType}
            size={pf.size}
            onPreview={() => setPreviewTarget(pf)}
            onRemove={() => handleRemovePending(pf.id)}
          />
        ))}

        {/* Drop zone / empty state */}
        {totalCount === 0 && (
          <button
            type="button"
            disabled={atLimit}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFileSelect(e.dataTransfer.files) }}
            className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl transition-all cursor-pointer"
            style={{
              background: isDragOver ? "rgba(201,168,124,0.08)" : "rgba(255,255,255,0.02)",
              border: `1px dashed ${isDragOver ? "rgba(201,168,124,0.50)" : "rgba(255,255,255,0.10)"}`,
            }}
          >
            <CloudUpload className="w-6 h-6" style={{ color: isDragOver ? "#c9a87c" : "rgba(200,212,228,0.25)" }} />
            <p className="text-xs font-medium" style={{ color: isDragOver ? "#c9a87c" : "rgba(200,212,228,0.40)" }}>
              Drop files here or <span style={{ color: isDragOver ? "#c9a87c" : "rgba(200,212,228,0.65)", textDecoration: "underline", textUnderlineOffset: "2px" }}>browse</span>
            </p>
            <p className="text-[10px]" style={{ color: "rgba(200,212,228,0.28)" }}>
              JPG, PNG, PDF, DOC, TXT · Max 3 MB
            </p>
          </button>
        )}
      </div>

      <AttachmentPreviewModal attachment={previewTarget} onClose={() => setPreviewTarget(null)} />
    </div>
  )
}
