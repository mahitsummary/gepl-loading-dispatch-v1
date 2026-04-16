# CLAUDE.md — GEPL RJCA Stock Management System

## Project Overview
A comprehensive stock/inventory management system for GEPL (Garware Enterprises Pvt Ltd) built as a Next.js web application with Supabase (PostgreSQL) backend.

## Tech Stack
- **Framework**: Next.js 14 (App Router) with TypeScript
- **Backend/DB**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Auth**: Supabase Auth (GoTrue) — email/password login
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Button, Input, Card, Table, Select, etc.)
- **Icons**: lucide-react
- **PDF Generation**: jspdf + jspdf-autotable
- **QR Codes**: qrcode library
- **Deployment**: Vercel (auto-deploy from GitHub `main` branch)
- **Repo**: `mahitsummary/GEPL---RJCA-Stock-Management-` on GitHub

## Supabase Connection
- **Project ID**: `kijehrisbwvljozxuzzy`
- **URL**: `https://kijehrisbwvljozxuzzy.supabase.co`
- **Anon Key**: stored in `src/lib/supabase.ts`
- **Auth User**: `af351b69-670b-4b34-a282-de034762b7cc`

## Production URLs
- **App**: `https://gepl-rjca-stock-management.vercel.app`
- **Login**: mahitagarwal23@gmail.com / Gepl@2025

---

## Database Schema (CURRENT — columns already renamed in Supabase)

### Core Master Tables

**vendors**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| code | text | Was `vendor_code` |
| name | text | Was `vendor_name` |
| contact_person | text | Was `poc_name` |
| phone | text | Was `poc_phone` |
| email | text | Was `poc_email` |
| city | text | |
| state | text | |
| gst_number | text | |
| payment_terms | text | |
| status | text | |
| address | text | |
| pincode | text | |

**items**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| code | text | Was `item_code` |
| name | text | Was `item_name` |
| items_group_code | text | |
| sub_category | text | |
| uom | text | |
| hsn_code | text | |
| gst_rate | numeric | |
| status | text | |
| purchase_item | boolean | |
| sales_item | boolean | |
| inventory_item | boolean | |
| manufacturer | text | |

**customers**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| code | text | Was `customer_code` |
| name | text | Was `customer_name` |
| city, state, gst_number, payment_terms, status, address, pincode, phone, email | various | |

**warehouses**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| code | text | Was `warehouse_code` |
| name | text | Was `warehouse_name` |
| group_code | text | |
| city, state, pincode, gst_number, active_status, address, phone, email, contact_person | various | |

**uoms**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | Was `uom_code` |
| description | text | Was `uom_name` |

**plants**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | |
| code | text | |

**vehicles**: id, number
**shifts**: id, name
**drivers**: id, name
**supervisors**: id (+ foreign keys)
**locations**: id

### Transaction Tables

**stock_summary**
| Column | Type | Notes |
|--------|------|-------|
| item_id | uuid | FK → items |
| warehouse_id | uuid | FK → warehouses |
| stock_type | text | |
| quantity | numeric | Was `closing_qty` |
| in_qty | numeric | |
| out_qty | numeric | |
| opening_qty | numeric | |
| reorder_level | numeric | |
| last_updated | timestamptz | |

**grn_header** — Goods Receipt Notes header
- grn_number, grn_date, vendor_id, vendor_name (denormalized), po_number, po_date, total_amount, status, etc.

**grn_items** — GRN line items
- grn_id, item_id, quantity, rate, amount, warehouse_id, etc.

**requisitions** — Internal requisitions
**transit_stock** — Goods in transit
**reconciliation** — Stock reconciliation records

**roles**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| role_name | text | KEPT AS-IS (not renamed to `name`) — used by auth.ts |
| permissions_json | jsonb | |

> **IMPORTANT**: `roles.role_name` was intentionally NOT renamed because `src/lib/auth.ts` references `roles(role_name, permissions_json)` in its FK join query.

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Landing/redirect
│   ├── globals.css                   # Global styles
│   ├── login/page.tsx                # Login page
│   ├── dashboard/page.tsx            # Main dashboard with summary cards
│   ├── inward/page.tsx               # Inward from Purchase (GRN entry) ★
│   ├── stock-ledger/page.tsx         # Stock ledger reports
│   ├── reconciliation/page.tsx       # Stock reconciliation
│   ├── notifications/page.tsx        # Notifications
│   ├── admin/
│   │   ├── page.tsx                  # Admin landing
│   │   ├── vendors/page.tsx          # Vendor Master CRUD ✅
│   │   ├── items/page.tsx            # Item Master CRUD ✅
│   │   ├── customers/page.tsx        # Customer Master CRUD ✅
│   │   ├── warehouses/page.tsx       # Warehouse Master CRUD ✅
│   │   ├── plants/page.tsx           # Plant Master
│   │   ├── vehicles/page.tsx         # Vehicle Master
│   │   ├── drivers/page.tsx          # Driver Master
│   │   └── supervisors/page.tsx      # Supervisor Master ⚠️
│   ├── internal/
│   │   ├── page.tsx                  # Internal transactions landing
│   │   ├── requisition/page.tsx      # Internal Requisition ⚠️
│   │   ├── dispatch/page.tsx         # Dispatch ⚠️
│   │   ├── receipt/page.tsx          # Receipt ⚠️
│   │   └── issue-to-production/page.tsx # Issue to Production ⚠️
│   └── production/
│       ├── page.tsx                  # Production landing
│       ├── fg-produced/page.tsx      # FG Produced ⚠️
│       └── fg-sales/page.tsx         # FG Sales ⚠️
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx             # Main app layout wrapper
│   │   └── Sidebar.tsx               # Navigation sidebar
│   └── ui/                           # shadcn/ui components
│       ├── alert.tsx, button.tsx, card.tsx, checkbox.tsx
│       ├── input.tsx, select.tsx, table.tsx, textarea.tsx
└── lib/
    ├── auth.ts                       # Auth context & role management
    ├── supabase.ts                   # Supabase client init
    ├── stock.ts                      # Stock update/query functions ✅
    └── utils.ts                      # cn() utility (clsx + tailwind-merge)
```

Legend: ✅ = Fixed, ⚠️ = Needs column name fixes

---

## CRITICAL: Pending Column Name Fixes

Database columns were renamed in Supabase but many frontend files still use old names. Below is a precise list of what STILL NEEDS FIXING.

### Understanding the Issue
There are TWO types of references:
1. **Supabase `.select()` queries** — These WILL BREAK if they reference old column names directly (e.g., `.select('vendor_name')` on a table where the column is now `name`)
2. **Local TypeScript interface properties** — These are cosmetic frontend names and WON'T break the app. They're just used as local state. However, some queries use FK joins like `items(code, name)` and then map to local properties like `item_code: item.items?.code` — these work fine.

### Files Already Fixed ✅
- `src/lib/stock.ts` — `closing_qty` → `quantity`, FK joins updated
- `src/app/admin/vendors/page.tsx` — `vendor_code` → `code`, `vendor_name` → `name`
- `src/app/admin/items/page.tsx` — `item_code` → `code`, `item_name` → `name`, UOM fields updated
- `src/app/admin/customers/page.tsx` — `customer_code` → `code`, `customer_name` → `name`
- `src/app/admin/warehouses/page.tsx` — `warehouse_code` → `code`, `warehouse_name` → `name`
- `src/app/dashboard/page.tsx` — FK joins updated (`items(code, name)`, `warehouses(name)`)
- `src/app/inward/page.tsx` — vendor fields updated, missing `useEffect` added, FK join fixed

### Files Still Needing Fixes ⚠️

#### HIGH PRIORITY — Broken Supabase Queries

**`src/app/admin/supervisors/page.tsx`**
- Line ~79: `.select('id, warehouse_name')` — should be `.select('id, name')`
- Line ~339: displays `warehouse.warehouse_name` — should be `warehouse.name`

**`src/app/stock-ledger/page.tsx`** (MANY issues)
- References `closing_qty` in Supabase selects (~13 occurrences) — should be `quantity`
- Local interfaces use `item_code`, `item_name`, `warehouse_name`, `closing_qty`
- FK joins may need verification

**`src/app/reconciliation/page.tsx`**
- Uses `item_code`, `item_name` in local interfaces
- References `source_warehouse_name`, `destination_warehouse_name`
- FK joins to verify

**`src/app/production/fg-sales/page.tsx`**
- Uses `item_code`, `item_name`, `customer_name`, `dispatch_warehouse_name`
- FK joins to verify

**`src/app/production/fg-produced/page.tsx`**
- Uses `item_code`, `item_name`, `warehouse_name`
- FK joins to verify

**`src/app/internal/receipt/page.tsx`**
- Uses `item_code`, `item_name`, `uom_name`

**`src/app/internal/requisition/page.tsx`**
- Uses `item_name`, `warehouse_name`

**`src/app/internal/dispatch/page.tsx`**
- Uses `item_name`, `warehouse_name`

**`src/app/internal/issue-to-production/page.tsx`**
- Uses `item_name`, `warehouse_name`

### How to Fix Each File
For each file above:
1. Open the file and find all Supabase `.select()` calls
2. Check if any `.select()` references old column names directly (not via FK joins)
3. If the query uses FK joins like `items(code, name)` and maps to local props, the query is fine — local interface property names don't matter
4. If the query directly selects old column names (e.g., `.select('closing_qty')` on `stock_summary`), update to new names
5. If the query selects from `warehouses` table with `.select('id, warehouse_name')`, change to `.select('id, name')`

---

## Key Patterns & Conventions

### Supabase FK Join Pattern
```typescript
// Correct pattern — join related tables
const { data } = await supabase
  .from('stock_summary')
  .select('*, items(code, name, uom), warehouses(name)')
  .gt('quantity', 0);

// Map to local interface
const formatted = data.map((item: any) => ({
  item_code: item.items?.code || 'N/A',    // local prop name (cosmetic)
  item_name: item.items?.name || 'N/A',
  warehouse_name: item.warehouses?.name || 'Unknown',
  total_quantity: item.quantity || 0,        // direct column (must match DB)
}));
```

### Auth Pattern
```typescript
// src/lib/auth.ts uses this — DO NOT change role_name
const { data } = await supabase
  .from('user_roles')
  .select('roles(role_name, permissions_json)')
  .eq('user_id', user.id);
```

### Page Structure Pattern
Every page follows this pattern:
```typescript
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/lib/supabase';
// ... shadcn/ui imports, lucide-react icons

export default function PageName() {
  const { user } = useAuth();
  // state, effects, handlers
  return (
    <AppLayout>
      {/* page content */}
    </AppLayout>
  );
}
```

---

## Git & Deployment

### Workflow
1. Push to `main` branch on GitHub
2. Vercel auto-deploys from `main`
3. App available at `https://gepl-rjca-stock-management.vercel.app`

### Pending Git Actions
All local file changes need to be committed and pushed to GitHub. The following files were modified locally but NOT yet pushed:
- `src/lib/stock.ts`
- `src/app/admin/vendors/page.tsx`
- `src/app/admin/items/page.tsx`
- `src/app/admin/customers/page.tsx`
- `src/app/admin/warehouses/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/inward/page.tsx`

### Commands
```bash
npm run dev    # Local dev server
npm run build  # Production build (use to verify no errors)
npm run lint   # ESLint check
```

---

## Common Issues & Gotchas

1. **RLS Policies**: Supabase has Row Level Security enabled. If queries return empty unexpectedly, check RLS policies.
2. **FK Joins Syntax**: PostgREST uses `table(col1, col2)` for foreign key joins. Extra parentheses like `(table(col))` will cause errors.
3. **`useCallback` + `useEffect`**: If defining a data-loading function with `useCallback`, you MUST call it inside a `useEffect` — otherwise data never loads.
4. **`useEffect` import**: Always ensure `useEffect` is imported from React if used.
5. **Supabase count**: Use `{ count: 'exact' }` option, but data length works too.
6. **Currency format**: Use `₹` symbol with `.toLocaleString('en-IN')` for Indian number formatting.

---

## QR Code Scanning (Added 2026-04)

### QR Code Format
GEPL label QR codes follow this pattern:
```
<serial>/<qtyPerPack>-<itemCode>-<uom>-<unused>-<totalQty>-<group>-<subCategory>-<vendorRef>_<grnNo>_<serial>_<issuedDate>
```

Example: `21/250.00-RBTR0024-Nos--400.00-GE-RMImport-103852_1_226_03032026`
- `21` = serial (pre-slash)
- `250.00` = qty per pack
- `RBTR0024` = **item code** (used for matching)
- `Nos` = UOM
- `400.00` = total qty
- `GE-RMImport` = group / sub-category
- suffix positions (split by `_`):
  - `parts[0]` = vendor ref
  - `parts[1]` = GRN number
  - `parts[2]` = serial
  - `parts[3]` = issued date (DDMMYYYY — only when 4+ parts)

### Parser Utility — `src/lib/qrParser.ts`
```typescript
import { parseQRCode, ParsedQRCode } from '@/lib/qrParser';
const parsed = parseQRCode(rawText);
// parsed: { valid, raw, serial, qtyPerPack, itemCode, uom, totalQty, group, subCategory, vendorRef, grnNo, issuedDate }
```
Position-based suffix parsing — only `parts[3]` is interpreted as a DDMMYYYY date, and only when 4+ underscore-separated parts exist.

### Scanner Component — `src/components/QRScanner.tsx`
Reusable React component with camera (`BarcodeDetector` API) + USB/manual input fallback.

```tsx
<QRScanner
  onScan={(parsed: ParsedQRCode) => { /* auto-fill row */ }}
  buttonLabel="Scan QR"
  buttonVariant="outline"
  disabled={false}
/>
```

### Pages with QR Scanner Integration
- `src/app/inward/page.tsx` — adds a GRN item row with matched item + qty/pack + vendor doc#
- `src/app/internal/receipt/page.tsx` — adds receipt item row
- `src/app/internal/dispatch/page.tsx` — adds dispatch item row
- `src/app/internal/issue-to-production/page.tsx` — adds issue row and auto-loads batches for matched item
- `src/app/internal/requisition/page.tsx` — adds requisition row
- `src/app/stock-ledger/page.tsx` — auto-fills item search field
- `src/app/production/fg-produced/page.tsx` — adds consumption row

Each page defines its own `handle<Page>QRScan(parsed)` function that:
1. Looks up item by `parsed.itemCode` against loaded `items[]` (case-insensitive)
2. Creates a new row pre-filled with `item_id` (if matched) + `qty_per_pack` + sensible defaults
3. Falls back to putting scanned code into `remarks` if no item match

---

## BOM Management (Added 2026-04)

### Database Tables
Two new tables created via Supabase migration:

**`boms`** — BOM header (one active per FG)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| fg_item_id | uuid | FK → items |
| name | text | Optional label |
| version | int | Version number |
| is_active | boolean | Only one active per FG |
| notes | text | |
| created_at, updated_at | timestamptz | |

**`bom_items`** — BOM components (RM/SFG consumed per FG unit)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| bom_id | uuid | FK → boms (cascade) |
| component_item_id | uuid | FK → items |
| qty_per_unit | numeric | Consumption per 1 FG unit |
| uom | text | |
| wastage_pct | numeric | Optional wastage % |
| notes | text | |

RLS: read access to authenticated users, write to staff role.

### BOM Helpers — `src/lib/bom.ts`
```typescript
import { getActiveBOM, computeBOMConsumption } from '@/lib/bom';

// Fetch active BOM with component details (via FK join)
const bom = await getActiveBOM(fgItemId);

// Compute total consumption for N FG units
const rows = computeBOMConsumption(bom, qtyProduced);
// rows: Array<{ component_item_id, component_code, component_name, uom, qty }>
```

### BOM Management Page — `src/app/admin/bom/page.tsx`
- FG selection via autocomplete
- Create/edit/delete BOMs with multiple component rows (qty_per_unit, uom, wastage_pct, notes)
- Creating a new BOM auto-deactivates existing active BOM for the same FG
- Search + expand/collapse per BOM

### FG Production Integration — `src/app/production/fg-produced/page.tsx`
New "Apply BOM" button on each production item row:
1. Fetches active BOM for that FG item
2. Computes consumption = `qty_per_unit × qty_produced` for each component
3. Pre-fills editable rows in a "Consumption" section below the production table
4. Rows are linked via `production_item_id` — on submit, each linked consumption row triggers `updateStock(..., movement_type: 'out', stock_type: 'RM' | 'SFG')` to deduct from inventory
5. `stock_type` is inferred from component code prefix: starts with `R` → RM, else SFG
6. Users can edit `actual_qty`, add manual rows (without BOM), or remove rows before submitting

### Admin Landing Card
`src/app/admin/page.tsx` now shows a "BOM Management" card (teal gradient, Layers icon) linking to `/admin/bom`.
