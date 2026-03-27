# GEPL - Loading and Dispatched V1

**GEPL - Material Tracking and Reconciliation System** is a comprehensive Next.js 14 application designed for manufacturing units to manage internal material tracking, dispatch, and reconciliation.

## Overview

GEPL is a single-page application (SPA) with a professional ERP-style interface. It provides complete visibility and control over:

- **Material Inward**: GRN (Goods Receipt Note) management
- **Inventory Management**: Real-time stock tracking across warehouses
- **Material Movement**: Requisitions, internal dispatch, and receipt tracking
- **Reconciliation**: Dispatch vs Receipt reconciliation and Production reconciliation
- **Master Data**: Management of items, vendors, warehouses, plants, supervisors, drivers, and vehicles
- **Reports**: Supervisor performance scorecards
- **QR Code Integration**: Automated QR generation and scanning for tracking

## Features

### Dashboard
- Real-time metrics displaying total stock value, pending GRNs, open requisitions, goods in transit, and pending reconciliation
- Recent activity feed with status tracking
- Quick action buttons for common operations
- System status monitoring

### Masters Management
- **Item Master**: Define items with category, UOM, HSN, and GST rates
- **Vendor Master**: Manage supplier information with contact details and GSTIN
- **Warehouse Master**: Track warehouse locations and capacity
- **Production Plants**: Manage plant details and production capacities
- **Supervisor Master**: Maintain supervisor information and assignments
- **Driver Master**: Driver database with license and contact information
- **Vehicle Master**: Vehicle registration and specification tracking

### Material Inward
- **GRN Creation**: Automated GRN number generation
- **QR Code Generation**: Generate printable QR stickers (50x25mm) for GRN tracking
- **Invoice Management**: Track invoices linked to GRNs
- **PDF Generation**: Export GRN documents as PDFs
- **Quantity Reconciliation**: Compare ordered vs received quantities

### Material Movement
- **Requisitions**: Create and track material requisitions from plants with priority levels
- **Internal Dispatch**: Dispatch materials from warehouses with driver and vehicle assignment
- **Internal Receipt**: Record receipt of dispatched materials
- **Goods in Transit**: Real-time tracking of materials in transit
- **Status Management**: Automated workflow status updates

### Stock Management
- **Stock Overview**: Real-time inventory across all warehouses
- **Low Stock Alerts**: Automatic identification of items below reorder levels
- **Goods in Transit**: Track materials currently being transported
- **FG (Finished Goods) Stock**: Separate tracking for finished goods
- **Rejected Stock**: Management of rejected items under review

### Reconciliation
- **Dispatch vs Receipt**: Compare dispatched and received quantities to identify variance
- **Production Reconciliation**: Match production inputs with outputs
- **Variance Reports**: Identify and track discrepancies
- **Status Tracking**: Monitor reconciliation completion status

### Reporting
- **Supervisor Scorecard**: Performance metrics including:
  - Tasks completed
  - On-time delivery percentage
  - Accuracy score
  - Quality ratings
  - Overall performance score
- **Period-based Filtering**: View metrics for current month, previous periods, quarters, or years
- **Top Performer Recognition**: Highlight best-performing supervisors

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **UI Framework**: React 18.2
- **Styling**: Tailwind CSS 3.3
- **QR Code**: qrcode library
- **PDF Generation**: jspdf + html2canvas
- **UI Components**: Headless UI, Lucide React icons
- **Backend**: Google Apps Script (GAS) for data management

## Project Structure

```
gepl-app/
├── app/
│   ├── layout.js                 # Root layout with sidebar and topbar
│   ├── globals.css               # Global styles and Tailwind imports
│   ├── page.js                   # Dashboard
│   ├── masters/                  # Master data pages
│   │   ├── items/
│   │   ├── vendors/
│   │   ├── warehouses/
│   │   ├── plants/
│   │   ├── supervisors/
│   │   ├── drivers/
│   │   └── vehicles/
│   ├── inward/
│   │   └── grn/                  # GRN creation and management
│   ├── movement/
│   │   ├── requisition/
│   │   ├── dispatch/
│   │   └── receipt/
│   ├── reconciliation/
│   │   ├── dispatch-receipt/
│   │   └── production/
│   ├── production/
│   │   ├── issue/
│   │   └── output/
│   ├── stock/
│   │   ├── overview/
│   │   ├── in-transit/
│   │   ├── fg/
│   │   └── rejected/
│   ├── reports/
│   │   └── scorecard/
│   └── settings/
│       └── add-masters/
├── components/
│   ├── Sidebar.js                # Collapsible navigation sidebar
│   ├── TopBar.js                 # Top navigation with user menu
│   ├── DataTable.js              # Reusable data table with sorting/pagination
│   ├── AutoComplete.js           # Searchable dropdown component
│   ├── FormField.js              # Reusable form field component
│   ├── Modal.js                  # Modal dialog component
│   ├── MetricCard.js             # Dashboard metric cards
│   ├── StatusBadge.js            # Status indicator badges
│   ├── QRGenerator.js            # QR code generation with printing
│   ├── QRScanner.js              # Camera-based QR scanner
│   └── PDFGenerator.js           # PDF generation from HTML
├── lib/
│   ├── api.js                    # API client for Google Apps Script
│   └── utils.js                  # Utility functions
├── public/                       # Static assets
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── .env.example
```

## Installation

1. **Clone or extract the project**:
   ```bash
   cd gepl-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your Google Apps Script URL:
   ```
   NEXT_PUBLIC_GAS_URL=https://script.google.com/macros/d/YOUR_GAS_ID/usercall?action=
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Building for Production

```bash
npm run build
npm start
```

## API Integration

The application communicates with Google Apps Script (GAS) for all data operations. The API client in `lib/api.js` includes methods for:

- Item, Vendor, Warehouse, Plant, Supervisor, Driver, Vehicle management
- GRN creation and retrieval
- Requisition, Dispatch, Receipt operations
- Stock and inventory queries
- Reconciliation data
- Dashboard metrics and reporting

## Component Usage

### DataTable
```jsx
<DataTable
  columns={[
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' }
  ]}
  data={items}
  searchable={true}
  searchableFields={['name', 'email']}
  pageSize={10}
/>
```

### Modal
```jsx
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Add Item"
  size="lg"
  actions={[
    { label: 'Cancel', onClick: () => setShowModal(false) },
    { label: 'Save', onClick: handleSave }
  ]}
>
  {/* Content */}
</Modal>
```

### AutoComplete
```jsx
<AutoComplete
  label="Select Item"
  options={items}
  value={selectedId}
  onChange={handleChange}
  displayKey="itemName"
  valueKey="id"
/>
```

### QRGenerator
```jsx
<QRGenerator
  data="ITEM001|Widget|100|PCS|BATCH001|GRN-001"
  itemName="Widget"
/>
```

## Styling

The application uses Tailwind CSS with a custom color scheme:

- **Primary**: Blue/Indigo (`primary-*`)
- **Secondary**: Gray (`secondary-*`)
- **Accent Colors**: Green, Red, Yellow, Purple, Orange for status indicators

All colors are configured in `tailwind.config.js`.

## Key Features Implementation

### QR Code Workflow
1. Create GRN in system
2. Generate QR code with item data
3. Print QR sticker (50x25mm format)
4. Attach to physical package
5. Scan QR on receipt using device camera
6. Auto-populate receipt form

### Reconciliation Process
1. Compare dispatch quantities with receipt quantities
2. Identify variance automatically
3. Generate variance reports
4. Track reconciliation status
5. Export for auditing

## Browser Compatibility

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Security Considerations

- HTTPS required for production
- QR Scanner requires HTTPS and camera permission
- API endpoints secured via Google Apps Script authentication
- No sensitive data stored in local storage
- CSRF protection via same-origin policy

## Performance Optimization

- Client-side pagination for large datasets
- Debounced search functionality
- Lazy loading of components
- Image optimization for QR codes
- Minimal bundle size with tree-shaking

## Troubleshooting

### Camera not working in QR Scanner
- Check browser permissions for camera access
- Ensure HTTPS is enabled
- Verify BarcodeDetector API support

### PDF generation not working
- Check browser console for html2canvas errors
- Ensure all images have CORS enabled
- Verify sufficient memory available

### API calls failing
- Verify Google Apps Script URL in .env.local
- Check GAS deployment is active
- Confirm GAS function names match api.js

## Future Enhancements

- Mobile app using React Native
- Real-time notifications via WebSockets
- Advanced analytics and BI dashboards
- Barcode support in addition to QR codes
- Multi-language support (Hindi, regional languages)
- Offline capability with sync
- Advanced search with filters
- User roles and permissions management

## Support

For issues, feature requests, or documentation updates, please contact the development team.

## License

Internal use only. All rights reserved.

---

**GEPL v1.0** - Manufacturing Material Tracking System
