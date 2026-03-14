"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Users, Mail, Shield, ChevronRight, Copy, Check, X, UserPlus, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/providers/auth-provider"
import Link from "next/link"

type TeamUser = {
  id: string
  name: string
  email: string
  role: "OWNER" | "DISPATCHER" | "VIEWER"
  avatarUrl: string | null
  createdAt: string
}

type Invite = {
  id: string
  email: string
  role: "DISPATCHER" | "VIEWER"
  createdAt: string
  expiresAt: string
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  DISPATCHER: "Dispatcher",
  VIEWER: "Viewer",
}

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-violet-100 text-violet-700",
  DISPATCHER: "bg-blue-100 text-blue-700",
  VIEWER: "bg-gray-100 text-gray-600",
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[role] ?? "bg-gray-100 text-gray-500"}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}

function Avatar({ name, url }: { name: string; url?: string | null }) {
  if (url) return <img src={url} alt={name} className="w-9 h-9 rounded-full object-cover" />
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-white">{initials}</span>
    </div>
  )
}

export default function TeamPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const isOwner = user?.role === "OWNER"

  const [showInviteForm, setShowInviteForm] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"DISPATCHER" | "VIEWER">("DISPATCHER")
  const [inviteUrl, setInviteUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const [formError, setFormError] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const res = await fetch("/api/team")
      if (!res.ok) throw new Error("Failed to load team")
      return res.json() as Promise<{ users: TeamUser[]; invites: Invite[] }>
    },
  })

  const invite = useMutation({
    mutationFn: async (body: { email: string; role: string }) => {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send invite")
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["team"] })
      setInviteUrl(data.inviteUrl)
      setEmail("")
      setFormError("")
    },
    onError: (err: Error) => {
      setFormError(err.message)
    },
  })

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")
    invite.mutate({ email, role })
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/settings" className="hover:text-gray-900 transition-colors">Settings</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 font-medium">Team</span>
        </div>
        {isOwner && !showInviteForm && (
          <Button
            onClick={() => { setShowInviteForm(true); setInviteUrl("") }}
            size="sm"
            className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Invite form */}
      {isOwner && showInviteForm && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <UserPlus className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900">Invite Team Member</span>
            </div>
            <button
              onClick={() => { setShowInviteForm(false); setInviteUrl(""); setFormError("") }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6">
            {inviteUrl ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  Invite created! Share this link with your team member.
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={inviteUrl}
                    readOnly
                    className="h-9 text-xs font-mono text-gray-500 bg-gray-50"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className="h-9 px-3 flex-shrink-0 gap-1.5 text-xs"
                  >
                    {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setInviteUrl(""); setEmail("") }}
                  className="text-xs h-8"
                >
                  Send another invite
                </Button>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                {formError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    {formError}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">Email address *</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@yourlimo.com"
                    required
                    className="h-10 text-sm"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">Role</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["DISPATCHER", "VIEWER"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`flex flex-col items-start gap-0.5 p-3.5 rounded-xl border text-left transition-all ${
                          role === r
                            ? "border-blue-400 bg-blue-50 ring-1 ring-blue-300"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-xs font-semibold text-gray-900">{ROLE_LABELS[r]}</span>
                        <span className="text-[10px] text-gray-400">
                          {r === "DISPATCHER" ? "Can create & manage trips" : "Read-only access"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => { setShowInviteForm(false); setFormError("") }}
                    className="h-9 text-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!email || invite.isPending}
                    className="h-9 text-sm bg-blue-600 hover:bg-blue-700 text-white gap-1.5 flex-1"
                  >
                    {invite.isPending ? "Sending…" : "Generate Invite Link"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Team members */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <span className="text-sm font-semibold text-gray-800">Team Members</span>
          {data && (
            <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
              {data.users.length} {data.users.length === 1 ? "member" : "members"}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-100 rounded w-36" />
                  <div className="h-2.5 bg-gray-100 rounded w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data?.users.map((member) => (
              <div key={member.id} className="flex items-center gap-4 px-6 py-4">
                <Avatar name={member.name} url={member.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
                    {member.id === user?.id && (
                      <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">You</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{member.email}</p>
                </div>
                <RoleBadge role={member.role} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending invites */}
      {data && data.invites.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <span className="text-sm font-semibold text-gray-800">Pending Invites</span>
            <span className="ml-auto text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
              {data.invites.length} pending
            </span>
          </div>

          <div className="divide-y divide-gray-50">
            {data.invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{inv.email}</p>
                  <p className="text-xs text-gray-400">
                    Expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <RoleBadge role={inv.role} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No members empty state */}
      {!isLoading && data?.users.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No team members yet</p>
        </div>
      )}
    </div>
  )
}
