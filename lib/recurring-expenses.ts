import { prisma } from "@/lib/db"

/**
 * Process all recurring expenses that are due on the given day of month
 * Should be called once daily (preferably early morning)
 */
export async function processRecurringExpenses(dayOfMonth: number = new Date().getDate()) {
  try {
    console.log(`[Recurring Expenses] Processing for day ${dayOfMonth}...`)

    // Find all recurring fixed expenses that are due today
    const dueExpenses = await prisma.expense.findMany({
      where: {
        isRecurring: true,
        category: "FIXED",
        recurrenceDay: dayOfMonth,
      },
      include: {
        company: true,
        vehicle: true,
      },
    })

    console.log(`[Recurring Expenses] Found ${dueExpenses.length} expenses to process`)

    const created = []

    for (const expense of dueExpenses) {
      // Check if it was already created today
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const existingToday = await prisma.expense.findFirst({
        where: {
          id: { not: expense.id },
          companyId: expense.companyId,
          vehicleId: expense.vehicleId,
          category: expense.category,
          subcategory: expense.subcategory,
          date: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      })

      if (existingToday) {
        console.log(
          `[Recurring Expenses] Skipping ${expense.subcategory} - already created today`
        )
        continue
      }

      // Create new expense for today
      const newExpense = await prisma.expense.create({
        data: {
          companyId: expense.companyId,
          category: expense.category,
          subcategory: expense.subcategory,
          amount: expense.amount,
          date: today,
          vehicleId: expense.vehicleId,
          isRecurring: false, // This is the generated instance
          notes: `Auto-generated from recurring expense (${expense.subcategory})`,
        },
      })

      // Update lastRecurredAt
      await prisma.expense.update({
        where: { id: expense.id },
        data: { lastRecurredAt: today },
      })

      created.push(newExpense)
      console.log(
        `[Recurring Expenses] Created: ${expense.subcategory} ($${Number(expense.amount)} for ${expense.company.name})`
      )
    }

    return {
      success: true,
      processed: dueExpenses.length,
      created: created.length,
      expenses: created,
    }
  } catch (error) {
    console.error("[Recurring Expenses] Error processing:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get upcoming recurring expenses for the month
 */
export async function getUpcomingRecurringExpenses(companyId: string) {
  const today = new Date()
  const daysRemaining = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate() - today.getDate()

  return prisma.expense.findMany({
    where: {
      companyId,
      isRecurring: true,
      category: "FIXED",
      recurrenceDay: {
        gte: today.getDate(),
        lte: today.getDate() + daysRemaining,
      },
    },
    select: {
      id: true,
      subcategory: true,
      amount: true,
      recurrenceDay: true,
      vehicle: {
        select: { name: true },
      },
    },
    orderBy: { recurrenceDay: "asc" },
  })
}
