/**
 * CSV Export Utilities
 */

export function generateCSV(headers: string[], rows: (string | number)[][]): string {
  const escapeCsvField = (field: string | number): string => {
    const stringField = String(field)
    if (stringField.includes(",") || stringField.includes('"') || stringField.includes("\n")) {
      return `"${stringField.replace(/"/g, '""')}"` // Escape quotes by doubling them
    }
    return stringField
  }

  const headerRow = headers.map(escapeCsvField).join(",")
  const dataRows = rows.map((row) => row.map(escapeCsvField).join(",")).join("\n")

  return `${headerRow}\n${dataRows}`
}

export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function generateExpensesCSV(expenses: any[]): string {
  const headers = [
    "Date",
    "Category",
    "Type",
    "Vehicle",
    "Amount",
    "Recurring",
    "Notes",
  ]

  const rows = expenses.map((exp) => [
    new Date(exp.date).toLocaleDateString("en-US"),
    exp.category,
    exp.subcategory,
    exp.vehicle?.name || "Company-wide",
    parseFloat(exp.amount).toFixed(2),
    exp.isRecurring ? "Yes" : "No",
    exp.notes || "",
  ])

  return generateCSV(headers, rows)
}

export function generateEarningsSummaryCSV(data: {
  period: { start: string; end: string }
  metrics: any
  deltas: any
}): string {
  const headers = ["Metric", "Value", "Previous Period", "Change (%)", "Change ($)"]

  const rows = [
    [
      "Total Revenue",
      `$${data.metrics.totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
      `$${((data.metrics.totalRevenue - data.deltas.revenue.amount) / 1).toLocaleString("en-US", {
        maximumFractionDigits: 2,
      })}`,
      `${data.deltas.revenue.pct}%`,
      `$${data.deltas.revenue.amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
    ],
    [
      "Collected Revenue",
      `$${data.metrics.collectedRevenue.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
      "",
      "",
      "",
    ],
    [
      "Uncollected Revenue",
      `$${data.metrics.uncollectedRevenue.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
      "",
      "",
      "",
    ],
    [
      "Total Expenses",
      `$${data.metrics.totalExpenses.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
      `$${((data.metrics.totalExpenses - data.deltas.expenses.amount) / 1).toLocaleString("en-US", {
        maximumFractionDigits: 2,
      })}`,
      `${data.deltas.expenses.pct}%`,
      `$${data.deltas.expenses.amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
    ],
    [
      "Fixed Expenses",
      `$${data.metrics.fixedExpenses.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
      "",
      "",
      "",
    ],
    [
      "Variable Expenses",
      `$${data.metrics.variableExpenses.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
      "",
      "",
      "",
    ],
    [
      "Net Profit",
      `$${(data.metrics.totalRevenue - data.metrics.totalExpenses).toLocaleString("en-US", {
        maximumFractionDigits: 2,
      })}`,
      "",
      "",
      "",
    ],
  ]

  return generateCSV(headers, rows)
}

export function generateFleetPerformanceCSV(vehicles: any[]): string {
  const headers = [
    "Vehicle",
    "Type",
    "Trips",
    "Total Revenue",
    "Total Expenses",
    "Net Profit",
    "Profit Margin (%)",
    "Status",
  ]

  const rows = vehicles.map((v) => [
    v.name,
    v.type,
    v.trips,
    v.revenue.toLocaleString("en-US", { maximumFractionDigits: 2 }),
    v.expenses.toLocaleString("en-US", { maximumFractionDigits: 2 }),
    v.profitability.toLocaleString("en-US", { maximumFractionDigits: 2 }),
    ((v.profitability / v.revenue) * 100).toFixed(1),
    v.status.toUpperCase(),
  ])

  return generateCSV(headers, rows)
}
