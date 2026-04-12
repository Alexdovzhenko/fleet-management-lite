# Trip Billing Modal — Visual Specification

## 📐 Modal Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ ↑ STICKY HEADER (104px) ↑                                [×]    │
│ Trip Billing                                                    │
│ Trip #LC-001234 · Acme Corp Client                            │
└─────────────────────────────────────────────────────────────────┘
│                                                                 │
│  SCROLLABLE CONTENT (max-height: calc(100vh - 280px))          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ BASE RATE                                                │ │
│  │ ┌─────────────────────────────┐  ┌──────────────────────┐│ │
│  │ │ Base Fare                   │  │ Gratuity             ││ │
│  │ │ ┌──────────────────────────┐│  │ ┌──────────────────┐││ │
│  │ │ │ $          [____0.00____] ││  │ │ [____0____] %    │││ │
│  │ │ └──────────────────────────┘│  │ └──────────────────┘││ │
│  │ └─────────────────────────────┘  └──────────────────────┘│ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ TRIP ADJUSTMENTS                                          │ │
│  │ ┌─────────────────────────────────────────────────────────┐│ │
│  │ │ ◎ Extra Stops          [Enable toggle]  [$____0.00____] ││ │
│  │ └─────────────────────────────────────────────────────────┘│ │
│  │ ┌─────────────────────────────────────────────────────────┐│ │
│  │ │ ◎ Waiting Time         [Enable toggle]  [$____0.00____] ││ │
│  │ └─────────────────────────────────────────────────────────┘│ │
│  │ ┌─────────────────────────────────────────────────────────┐│ │
│  │ │ ◎ Tolls                [Enable toggle]  [$____0.00____] ││ │
│  │ └─────────────────────────────────────────────────────────┘│ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ADDITIONAL CHARGES                       [+ Add Charge]  │ │
│  │ ┌─────────────────────────────────────────────────────────┐│ │
│  │ │ ⠿ Service▾ | Description | $Rate | Qty | Unit | $Total │ │
│  │ │    Transfer  Airport pickup  $150  1    flat  $150    [×]││ │
│  │ └─────────────────────────────────────────────────────────┘│ │
│  │ ┌─────────────────────────────────────────────────────────┐│ │
│  │ │ ⠿ Service▾ | Description | $Rate | Qty | Unit | $Total │ │
│  │ │    Parking   Valet fee       $35   1    flat  $35     [×]││ │
│  │ └─────────────────────────────────────────────────────────┘│ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
│ ↓ STICKY SUMMARY FOOTER (172px) ↓                              │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐│
│ │ SUBTOTAL         │ │ ADJUSTMENTS      │ │ TAX (8.5%)       ││
│ │ $185.00          │ │ +$52.50          │ │ +$20.12          ││
│ └──────────────────┘ └──────────────────┘ └──────────────────┘│
│ ┌──────────────────┐                                           │
│ │ TOTAL ← highlight│                                           │
│ │ $257.62          │                                           │
│ └──────────────────┘                                           │
│                                  [Cancel]  [Save & Close]     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Color & Typography

### Header Section
- Background: `bg-gradient-to-r from-white to-slate-50`
- Title: `text-2xl font-semibold text-slate-900` (24px, 600 weight)
- Subtitle: `text-sm text-slate-500 mt-1` (14px, 400 weight)
- Border: `border-b border-slate-200`

### Section Titles
- Style: `text-sm font-semibold text-slate-900 uppercase tracking-wide`
- Size: 14px, 600 weight
- Letter spacing: wide (tracking-wide)

### Input Labels
- Style: `block text-xs font-medium text-slate-600 mb-1`
- Size: 12px, 500 weight
- Color: slate-600

### Input Fields
- Border: `border border-slate-200`
- Background: `bg-white`
- Focus: `border-blue-500 ring-2 ring-blue-100`
- Padding: `px-4 py-3` (16px horiz, 12px vert)
- Border radius: `rounded-lg` (8px)

### Read-only Total Fields
- Background: `bg-slate-50`
- Border: `border border-slate-200`
- Text: `font-mono font-semibold text-slate-900`

### Summary Boxes
- Regular: White background with slate-900 text
- Total box: `bg-blue-50` with `text-blue-600` for value
- Layout: Grid 4 columns (responsive to 2 on mobile)

### Buttons
- Primary (Save): `bg-blue-600 text-white hover:bg-blue-700`
- Secondary (Cancel): `bg-white text-slate-700 border border-slate-300 hover:bg-slate-100`
- Padding: `px-6 py-2.5`
- Border radius: `rounded-lg`
- Active state: `active:scale-95`

---

## ✨ Animation Timeline

### Modal Entry (Total: 350ms)
```
Time    Element             Animation
0ms     Header             opacity: 0→1, y: -20→0 (duration: 350ms, ease-out)
0ms     Backdrop           Dialog default fade-in
100ms   Section 1          opacity: 0→1 (duration: 250ms, ease-out, delay: 100ms)
150ms   Section 2          opacity: 0→1 (duration: 250ms, ease-out, delay: 150ms)
200ms   Section 3          opacity: 0→1 (duration: 250ms, ease-out, delay: 200ms)
250ms   Summary            opacity: 0→1, y: 20→0 (duration: 300ms, ease-out, delay: 250ms)
```

### Line Item Addition (Individual Item)
```
- Entry: opacity 0→1, translateY 8px→0
- Duration: 200ms
- Easing: easeOut
- Drag handle visible on hover (opacity 0→1, instant)
```

### Line Item Deletion
```
- Exit: opacity 1→0, scale 1→0.95, translateY 0→-8px
- Duration: 150ms
- Easing: easeOut
```

### Adjustment Toggle
```
- Toggle Switch Background: 200ms ease-out
- Toggle Knob: translateX 200ms ease-out
- Input Reveal: opacity 0→1, width 0→auto (150ms ease-out)
- Input Hide: opacity 1→0, width auto→0 (150ms ease-out)
```

### Button Interactions
```
Hover:
  - Background color: 150ms ease-out
  - No scale (stays at 1)

Active (press):
  - Scale: 1→0.95
  - Duration: 150ms ease-out
  - Returns to 1 instantly on release
```

---

## 🔍 Focus & Accessibility

### Focus State
```css
.input:focus {
  border: 2px solid #2563eb;
  outline: none;
  ring: 2px #dbeafe; /* ring-blue-100 */
}
```

### Keyboard Navigation
- Tab order: Header close → Base Rate inputs → Adjustments → Charges → Buttons
- Enter to add/delete items
- Escape to close modal (Dialog native)

### Touch Targets
- All buttons: min 44×44px
- Input fields: 48px height minimum
- Drag handle: 18×18px icon (hit area expanded with parent)

### Screen Reader
- Modal has `role="dialog"` (Dialog primitive)
- Labels properly associated with inputs via `<label htmlFor>`
- Drag handle: `aria-label="Drag to reorder"`
- Buttons have descriptive text (not icon-only)

---

## 📱 Responsive Behavior

### Mobile (<640px)
- Summary grid: 2 columns instead of 4
- Modal max-width: 100% - 2rem (full width minus padding)
- Line items: Stack fields vertically if needed
- Font sizes: Slightly reduced on smaller screens

### Tablet (640px - 1024px)
- Summary grid: 4 columns (current)
- Modal max-width: 600px

### Desktop (>1024px)
- Modal max-width: 800px (STRICT)
- All 4 columns visible

---

## 🎯 State Management

### State Variables
```typescript
billingData: {
  lineItems: [
    { id, tab, order, serviceType, description, rate, qty, unit }
  ],
  adjustments: {
    taxPercent, gratuityPercent, tollsEnabled, tollsAmount, ...
  }
}

payments: [] // Reserved for future payments section

isSaving: boolean // Loading state during save
```

### Computed (useMemo)
```typescript
totals = computeBillingTotals(billingData, payments)
// Returns: { subtotal, adjustmentsTotal, taxAmt, total, totalPaid, balance }
```

### No Layout Shift Pattern
All fields have **reserved space upfront** — inputs don't appear/disappear,
they just become enabled/disabled. Summary grid always 4 columns (responsive at breakpoints).

---

## 📊 Component Interaction Map

```
BillingModalRedesigned
├── Header (sticky)
│   ├── Title + Trip Context
│   └── Close Button
│
├── Scrollable Content
│   ├── Base Rate Section
│   │   ├── Base Fare Input
│   │   └── Gratuity % Input
│   │
│   ├── Trip Adjustments Section
│   │   └── AdjustmentRow × 3
│   │       ├── Toggle Switch
│   │       └── Conditional Amount Input
│   │
│   └── Additional Charges Section
│       ├── "Add Charge" Button
│       └── Sortable List (DnD Context)
│           └── DraggableLineItem × N
│               ├── Drag Handle
│               ├── Service Type Select
│               ├── Description Input
│               ├── Rate Input
│               ├── Qty Input
│               ├── Unit Select
│               ├── Total (read-only)
│               └── Actions (Copy, Delete)
│
└── Summary Footer (sticky)
    ├── SummaryItem × 4 (grid)
    │   ├── Subtotal
    │   ├── Adjustments
    │   ├── Tax
    │   └── Total (highlighted)
    │
    └── Action Buttons
        ├── Cancel
        └── Save & Close
```

---

## 🚀 Performance Optimization

- **Transform + Opacity Only** — No width/height animations
- **useMemo on totals** — Prevents re-render cascade
- **AnimatePresence mode="popLayout"** — Smooth list re-arrangement
- **Hardware-accelerated animations** — GPU-rendered transforms
- **Memoized line item component** — Drag handle doesn't re-render siblings

---

## 🎓 Design Philosophy

**Inspiration:** Apple's Notes app, Stripe Billing, Linear Workspace

**Key Principles:**
1. **Clarity** — Clear section grouping, no visual clutter
2. **Speed** — Fast data entry, no unnecessary animations
3. **Premium** — Gradient header, smooth transitions, professional spacing
4. **Stability** — No layout shifts, all space reserved upfront
5. **Feedback** — Every action has a response (color, scale, animation)
