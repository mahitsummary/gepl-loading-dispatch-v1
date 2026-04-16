# GEPL Stock Management — QR + BOM Feature Patch

This archive contains new and modified files implementing:
1. **QR Code Scanning** on Inward, Internal Receipt/Dispatch/Issue/Requisition, Stock Ledger, and FG Production pages.
2. **BOM Management** admin page with "Apply BOM" auto-consumption in FG Production.

## Contents

### New files (create)
- `src/lib/qrParser.ts` — QR code parser
- `src/lib/bom.ts` — BOM fetch + consumption helpers
- `src/components/QRScanner.tsx` — reusable scanner component
- `src/app/admin/bom/page.tsx` — BOM management page
- `migrations/bom_tables.sql` — run against Supabase (OR already applied via MCP)

### Modified files (replace)
- `src/app/admin/page.tsx` — added BOM admin card
- `src/app/inward/page.tsx` — QR scanner integration
- `src/app/stock-ledger/page.tsx` — QR scanner on both item searches
- `src/app/production/fg-produced/page.tsx` — QR + Apply BOM + consumption
- `src/app/internal/receipt/page.tsx` — QR scanner
- `src/app/internal/dispatch/page.tsx` — QR scanner
- `src/app/internal/issue-to-production/page.tsx` — QR scanner
- `src/app/internal/requisition/page.tsx` — QR scanner
- `CLAUDE.md` — updated documentation

## How to push via a sub-branch

From inside your local clone of `mahitsummary/GEPL---RJCA-Stock-Management-`:

```bash
# 1. Make sure main is up to date
git checkout main
git pull origin main

# 2. Create a feature branch
git checkout -b feature/qr-scanning-and-bom

# 3. Copy all files from this patch over your repo
# (replace the path below with wherever you extracted this archive)
cp -r /path/to/gepl-changes/* /path/to/your/repo/

# 4. Stage, commit, push
git add -A
git status                     # review changes first
git commit -m "feat: QR code scanning on entry pages + BOM management

- Add QR code parser (src/lib/qrParser.ts) for GEPL label format
- Add reusable QRScanner component with camera + manual input fallback
- Integrate QR scanner into Inward, Internal (Receipt/Dispatch/Issue/Requisition),
  Stock Ledger, and FG Production pages — auto-fills item rows from scanned codes
- Add BOM Management admin page (/admin/bom) with single-level BOMs per FG
- Add Apply BOM button on FG Production rows that auto-fills editable
  consumption rows and deducts RM/SFG stock on submit
- Update CLAUDE.md with feature docs"

git push -u origin feature/qr-scanning-and-bom
```

Then open a PR on GitHub from `feature/qr-scanning-and-bom` → `main`. Vercel will create a **preview deployment** for the PR branch that you can test before merging.

## Supabase migration

The BOM tables (`boms`, `bom_items`) were already created in your Supabase project
(`kijehrisbwvljozxuzzy`) via the Supabase MCP during the implementation session.
If for any reason you need to re-run the migration, the SQL is in
`migrations/bom_tables.sql`.

## Recommended: verify build locally before pushing

```bash
npm install       # if you haven't already
npm run build     # catches TS/lint errors
npm run dev       # local test at http://localhost:3000
```

## QR Code format reference

Example: `21/250.00-RBTR0024-Nos--400.00-GE-RMImport-103852_1_226_03032026`

| Position | Value | Meaning |
|----------|-------|---------|
| pre-`/` | `21` | serial |
| field 0 | `250.00` | qty per pack |
| field 1 | `RBTR0024` | **item code** |
| field 2 | `Nos` | UOM |
| field 3 | `` | unused |
| field 4 | `400.00` | total qty |
| field 5 | `GE` | group |
| field 6 | `RMImport` | sub-category |
| field 7 split by `_` | `103852 / 1 / 226 / 03032026` | vendor ref / GRN# / serial / date (DDMMYYYY) |

Date is only parsed when 4+ underscore-separated suffix parts exist — protects against labels where position 0 is an 8-digit vendor ref.
