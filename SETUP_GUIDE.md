# GEPL - Loading and Dispatched V1
## Complete Setup & Deployment Guide

---

## Step 1: Set Up Google Apps Script Backend

### 1.1 Open Google Apps Script
1. Go to https://script.google.com
2. Click **New Project**
3. Name it: `GEPL Backend`

### 1.2 Paste the Code
1. Delete all existing code in `Code.gs`
2. Copy the entire contents of `/google-apps-script/Code.gs` into the editor
3. The spreadsheet ID is already configured: `1S_tycoVntFJwTK-Nefqdwt6VRzg-4ZiQY5ukXypW0_s`

### 1.3 Deploy as Web App
1. Click **Deploy** > **New deployment**
2. Click the gear icon next to **Select type** > Choose **Web app**
3. Set:
   - **Description**: `GEPL API v1`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone` (or `Anyone with Google account` for security)
4. Click **Deploy**
5. **Copy the Web App URL** - it looks like: `https://script.google.com/macros/s/AKfycb.../exec`

### 1.4 Initialize Sheets
1. In the Apps Script editor, select function: `ensureSheetsExist`
2. Click **Run**
3. Authorize the permissions when prompted
4. This creates all 22 new sheets in your spreadsheet

---

## Step 2: Set Up the Next.js Frontend

### 2.1 Install Dependencies
```bash
cd gepl-app
npm install
```

### 2.2 Configure Environment
Create `.env.local` file:
```
NEXT_PUBLIC_GAS_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```
Replace with your actual Web App URL from Step 1.3.

### 2.3 Test Locally
```bash
npm run dev
```
Open http://localhost:3000

---

## Step 3: Deploy to Vercel via GitHub

### 3.1 Create GitHub Repository
```bash
cd gepl-app
git init
git add .
git commit -m "Initial commit: GEPL Loading and Dispatched V1"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gepl-app.git
git push -u origin main
```

### 3.2 Deploy on Vercel
1. Go to https://vercel.com and sign in with GitHub
2. Click **Import Project** > Select `gepl-app` repository
3. In **Environment Variables**, add:
   - Key: `NEXT_PUBLIC_GAS_URL`
   - Value: Your Apps Script Web App URL
4. Click **Deploy**
5. Your app will be live at `https://gepl-app.vercel.app`

---

## Application Modules

| Module | Path | Description |
|--------|------|-------------|
| Dashboard | `/` | Overview metrics and quick actions |
| Item Master | `/masters/items` | View/add items |
| Vendor Master | `/masters/vendors` | View/add vendors |
| Warehouse Master | `/masters/warehouses` | View/add warehouses |
| Production Plants | `/masters/plants` | View/add plants |
| Supervisors | `/masters/supervisors` | View/add supervisors |
| Drivers | `/masters/drivers` | View/add drivers |
| Vehicles | `/masters/vehicles` | View/add vehicles |
| Inward (GRN) | `/inward/grn` | Purchase inward with QR generation |
| Requisition | `/movement/requisition` | Material requisition requests |
| Dispatch | `/movement/dispatch` | Internal dispatch with delivery challan |
| Receipt | `/movement/receipt` | Internal receipt with gate pass |
| Reco (Dispatch) | `/reconciliation/dispatch-receipt` | Dispatch vs receipt reconciliation |
| Reco (Production) | `/reconciliation/production` | Production reconciliation |
| Issue to Production | `/production/issue` | Issue RM/SFG for production |
| Production Output | `/production/output` | Record FG production |
| Stock Overview | `/stock/overview` | Warehouse-wise stock |
| Goods in Transit | `/stock/in-transit` | Track goods in transit |
| FG Stock | `/stock/fg` | Finished goods stock |
| Rejected Stock | `/stock/rejected` | Rejected items stock |
| Supervisor Scorecard | `/reports/scorecard` | Performance scoring |
| Settings | `/settings/add-masters` | Add new master data |

---

## Google Sheets Structure

### Existing Sheets (Your Data):
- Vendor & Customer Master
- Item Master
- Warehouse Master
- Production plant master

### Auto-Created Sheets:
- Supervisor Master, Driver Master, Vehicle Master
- Batch Master
- GRN Transactions, GRN Line Items
- Material Requisitions, Requisition Line Items
- Internal Dispatches, Dispatch Line Items
- Internal Receipts, Receipt Line Items
- Reconciliation
- Stock Master, Goods In Transit
- Production Issues, Production Output
- FG Stock Master, Rejected Stock
- Supervisor Scores
- Gate Pass Register
- Audit Log

---

## Key Workflows

### 1. Inward from Purchase
Security → Enter vendor/PO/vehicle details → Generate Gate Pass →
Supervisor → Scan/enter items being unloaded → Generate QR stickers →
System → Creates GRN, updates stock, generates PDF

### 2. Material Requisition → Dispatch → Receipt
Site Manager → Create requisition →
Godown Manager → Dispatch items (scan each) → Generate Delivery Challan →
Receiving Security → Enter DC details → Generate Gate Pass →
Receiving Supervisor → Scan/enter items → Generate Receipt Note →
System → Auto-reconcile dispatch vs receipt → Flag variances

### 3. Production Flow
Store Manager → Issue RM/SFG to production →
Production → Record FG output →
System → Reconcile: Issued RM = FG Produced × BOM + Rejected + WIP + Returns
