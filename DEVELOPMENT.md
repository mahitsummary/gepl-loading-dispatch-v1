# GEPL Development Guide

## Getting Started

### Prerequisites
- Node.js 18+ and npm 8+
- Google Apps Script project with API endpoints
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Initial Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env.local
   ```
   Update `NEXT_PUBLIC_GAS_URL` with your Google Apps Script deployment URL.

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

### `/app` - Next.js App Router Pages
- `page.js` - Dashboard home page
- `layout.js` - Root layout with navigation
- `globals.css` - Global styles

#### Masters Management
- `/masters/items/` - Item master CRUD
- `/masters/vendors/` - Vendor management
- `/masters/warehouses/` - Warehouse configuration
- `/masters/plants/` - Production plants
- `/masters/supervisors/` - Supervisor database
- `/masters/drivers/` - Driver management
- `/masters/vehicles/` - Vehicle tracking

#### Inward Operations
- `/inward/grn/` - Goods Receipt Note creation and management

#### Material Movement
- `/movement/requisition/` - Material requisition creation
- `/movement/dispatch/` - Internal dispatch management
- `/movement/receipt/` - Receipt recording

#### Stock Management
- `/stock/overview/` - Real-time inventory dashboard
- `/stock/in-transit/` - Goods in transit tracking
- `/stock/fg/` - Finished goods inventory
- `/stock/rejected/` - Rejected items management

#### Reconciliation
- `/reconciliation/dispatch-receipt/` - Dispatch vs Receipt matching
- `/reconciliation/production/` - Production input/output reconciliation

#### Production
- `/production/issue/` - Issue materials to production
- `/production/output/` - Record production output

#### Reports & Settings
- `/reports/scorecard/` - Supervisor performance metrics
- `/settings/add-masters/` - Master data management hub

### `/components` - Reusable React Components

**Layout Components**:
- `Sidebar.js` - Collapsible navigation sidebar
- `TopBar.js` - Top navigation with user menu

**UI Components**:
- `DataTable.js` - Reusable data table with sorting, searching, pagination
- `Modal.js` - Modal dialog component
- `FormField.js` - Form field wrapper with validation
- `AutoComplete.js` - Searchable dropdown input

**Data Visualization**:
- `MetricCard.js` - Dashboard metric cards
- `StatusBadge.js` - Status indicators

**Specialized Components**:
- `QRGenerator.js` - QR code generation and printing
- `QRScanner.js` - Camera-based QR code scanning
- `PDFGenerator.js` - PDF document generation from HTML

### `/lib` - Utilities and API

**api.js**:
- API client for Google Apps Script
- Organized by feature (Items, Vendors, GRN, Dispatch, etc.)
- Error handling and request management

**utils.js**:
- Date formatting: `formatDate()`, `formatDateTime()`
- Currency formatting: `formatCurrency()`
- QR operations: `generateQRData()`, `parseQRData()`
- Validation: `validateItemCode()`, `validateEmail()`, `validatePhone()`, `validateGSTIN()`
- Data processing: `sortByField()`, `filterByField()`, `chunk()`
- Export: `convertToCSV()`, `downloadCSV()`
- String manipulation: `capitalizeWords()`, `slugify()`, `getInitials()`

## Component Usage Examples

### DataTable with Search and Pagination
```jsx
<DataTable
  columns={[
    { key: 'itemCode', label: 'Item Code' },
    { key: 'itemName', label: 'Item Name' },
    { key: 'category', label: 'Category' }
  ]}
  data={items}
  searchable={true}
  searchableFields={['itemCode', 'itemName']}
  pageSize={10}
  onRowClick={(item) => handleItemClick(item)}
/>
```

### Form with Modal Dialog
```jsx
const [showModal, setShowModal] = useState(false);

<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Add Item"
  size="lg"
  actions={[
    { label: 'Cancel', variant: 'secondary', onClick: () => setShowModal(false) },
    { label: 'Save', onClick: handleSave }
  ]}
>
  <FormField
    label="Item Code"
    value={formData.itemCode}
    onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
    required
  />
  <FormField
    label="Category"
    type="select"
    value={formData.category}
    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
    options={[
      { value: 'raw', label: 'Raw Material' },
      { value: 'semi', label: 'Semi-finished' }
    ]}
  />
</Modal>
```

### QR Code Generation and Printing
```jsx
<QRGenerator
  data={generateQRData({
    itemCode: 'IT-001',
    itemName: 'Fastener A',
    qtyPerPack: 100,
    uom: 'PCS',
    batchId: 'BATCH-001',
    grnNumber: 'GRN-001'
  })}
  itemName="Fastener A"
/>
```

### QR Scanner with Camera
```jsx
const handleQRScan = (data) => {
  const parsed = parseQRData(data);
  console.log('Scanned:', parsed);
};

<QRScanner
  onScan={handleQRScan}
  onError={(error) => console.error('Scan error:', error)}
/>
```

## API Integration

All API calls go through `/lib/api.js`. Example:

```javascript
// Fetching data
const items = await api.fetchItems();
const vendors = await api.fetchVendors();

// Creating records
await api.createGRN({
  grnNumber: 'GRN-001',
  vendorId: 'V001',
  itemId: 'IT-001',
  quantity: 100,
  invoiceNumber: 'INV-001',
  invoiceDate: '2024-03-15',
  invoiceAmount: 50000
});

// Generating system numbers
const grnNumber = await api.generateGRNNumber();
const dispatchNumber = await api.generateDispatchNumber();
```

## Google Apps Script Integration

The app expects Google Apps Script to expose the following functions via Web App deployment:

```javascript
// Example GAS endpoint structure
doGet(e) {
  const action = e.parameter.action;

  switch(action) {
    case 'fetchItems':
      return ContentService.createTextOutput(
        JSON.stringify(fetchItemsFromSheet())
      );
    case 'addItem':
      // Handle item creation
      break;
    // ... more cases
  }
}
```

**Required GAS Functions**:
- `fetchItems()`, `addItem()`, `updateItem()`, `deleteItem()`
- `fetchVendors()`, `addVendor()`, `updateVendor()`, `deleteVendor()`
- `fetchWarehouses()`, `addWarehouse()`, `updateWarehouse()`, `deleteWarehouse()`
- `fetchPlants()`, `addPlant()`, `updatePlant()`, `deletePlant()`
- `fetchSupervisors()`, `addSupervisor()`, `updateSupervisor()`, `deleteSupervisor()`
- `fetchDrivers()`, `addDriver()`, `updateDriver()`, `deleteDriver()`
- `fetchVehicles()`, `addVehicle()`, `updateVehicle()`, `deleteVehicle()`
- `createGRN()`, `fetchGRNs()`, `updateGRN()`, `getGRNById()`
- `createRequisition()`, `fetchRequisitions()`, `updateRequisition()`, `approveRequisition()`
- `createDispatch()`, `fetchDispatches()`, `updateDispatch()`, `getDispatchById()`
- `createReceipt()`, `fetchReceipts()`, `updateReceipt()`
- `fetchStock()`, `getStockByItem()`
- `fetchGoodsInTransit()`, `getGoodsInTransitByDispatch()`
- `fetchFGStock()`, `fetchRejectedStock()`
- `fetchDispatchReceiptReco()`, `getDispatchReceiptRecoDetail()`
- `fetchProductionReco()`
- `issueToProduction()`, `fetchProductionIssues()`
- `recordProductionOutput()`, `fetchProductionOutput()`
- `fetchSupervisorScores()`, `getSupervisorScoreDetail()`
- `fetchDashboardMetrics()`, `fetchRecentActivity()`
- `generateGRNNumber()`, `generateDispatchNumber()`, `generateRequisitionNumber()`, `generateReceiptNumber()`

## Styling & Theming

### Color Palette

**Primary (Indigo/Blue)**:
- `primary-50` to `primary-900` - Main application color

**Secondary (Gray)**:
- `secondary-50` to `secondary-900` - Neutral backgrounds and text

**Status Colors**:
- Green: Success, Completed, Approved
- Red: Error, Rejected, Cancelled
- Yellow: Warning, Pending
- Blue: Info, In Transit
- Purple: Processing, Special status

### CSS Classes

Custom utility classes in `globals.css`:
- `.truncate-2`, `.truncate-3` - Multi-line text truncation
- `.animate-fade-in` - Fade animation
- `.responsive-table` - Mobile-friendly table styling
- `.no-print`, `.print-only` - Print media helpers

## Development Workflow

### Adding a New Master Page

1. Create folder under `/app/masters/[resource]/`
2. Create `page.js` with:
   - useState for data, form, modal state
   - useEffect to load data on mount
   - API calls for CRUD operations
   - DataTable with columns definition
   - Modal for add/edit forms
   - Form fields with validation

3. Use existing patterns from `/app/masters/items/page.js`

### Adding a New Transaction Page

1. Create folder under `/app/[module]/[operation]/`
2. Create `page.js` with:
   - State management for records and filters
   - Multi-step form or modal for creation
   - DataTable showing all records
   - Status badges and action buttons
   - PDF/QR generation as needed

3. Follow patterns from `/app/inward/grn/page.js`

### Component Development Guidelines

- Always use 'use client' directive at component top for client-side hooks
- Props drilling: pass simple props, use Context for complex state
- Controlled inputs: manage all form state in parent component
- Error handling: try-catch blocks with user-friendly messages
- Loading states: show spinners/skeletons during async operations
- Accessibility: semantic HTML, proper labels, ARIA attributes

## Testing

### Manual Testing Checklist

- [ ] Page loads without errors
- [ ] Search functionality works
- [ ] Sorting by columns works
- [ ] Pagination navigates correctly
- [ ] Form validation displays errors
- [ ] Modal opens and closes properly
- [ ] API calls complete successfully
- [ ] Data displays in correct format
- [ ] Responsive design works on mobile

### Browser DevTools

- Check Console for errors
- Verify Network tab for API calls
- Use React DevTools extension for component inspection
- Test responsive design with device emulation

## Performance Optimization

1. **Code Splitting**: Next.js automatically code-splits at page routes
2. **Image Optimization**: Use next/image for images (if added)
3. **Lazy Loading**: Consider dynamic imports for heavy components
4. **Memoization**: Use React.memo() for expensive components
5. **State Management**: Keep state close to where it's used
6. **API Caching**: Implement caching for frequently accessed data

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Self-Hosted
```bash
npm run build
npm start
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### QR Scanner not working
- Ensure HTTPS enabled
- Check camera permissions in browser
- Verify device has camera hardware
- Test in different browser

### API calls failing
- Check GAS deployment is active
- Verify GAS function names match api.js
- Check network tab in DevTools
- Ensure .env.local has correct GAS_URL

### Styling issues
- Clear .next folder and rebuild
- Check Tailwind CSS in globals.css
- Verify classNames are in tailwind.config.js
- Use browser DevTools to inspect styles

### Modal not showing
- Verify isOpen state is true
- Check z-index not hidden by other elements
- Ensure Modal component receives correct props
- Check browser console for React errors

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)
- [Lucide React Icons](https://lucide.dev)
- [QR Code Library](https://davidshimjs.github.io/qrcodejs/)

## Support

For questions or issues during development:
1. Check README.md for general information
2. Review similar implemented pages for patterns
3. Check browser console and network tab for errors
4. Verify API responses in DevTools
5. Test with sample/mock data first
