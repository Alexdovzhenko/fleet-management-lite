import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId, role } = auth.ctx

  if (role !== "OWNER") {
    return NextResponse.json(
      { error: "Only owners can delete templates" },
      { status: 403 }
    )
  }

  try {
    const { templateId } = await params

    const template = await prisma.expenseTemplate.findUnique({
      where: { id: templateId },
    })

    if (!template || template.companyId !== companyId) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    await prisma.expenseTemplate.delete({
      where: { id: templateId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/expense-templates/[templateId]]", error)
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    )
  }
}
