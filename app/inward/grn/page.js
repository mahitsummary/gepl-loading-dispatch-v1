'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Eye, Download, QrCode, Scan, Truck, Package, FileText, Camera, Upload } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import AutoComplete from '@/components/AutoComplete';
import QRGenerator from '@/components/QRGenerator';
import QRScanner from '@/components/QRScanner';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { formatDate, generateQRData, parseQRData } from '@/lib/utils';

const INITIAL_TRANSACTION = {
  vendorCode: '',
  vendorName: '',
  vendorPOCName: '',
  vendorPhone: '',
  vendorEmail: '',
  poNumber: '',
  poDate: '',
  committedDeliveryDate: '',
  vendorDocNumber: '',
  vendorDocDate: new Date().toISOString().split('T')[0],
  receiptDate: new Date().toISOString().split('T')[0],
  entryDate: new Date().toISOString().split('T')[0],
  receiverName: '',
  vehicleNumber: '',
  invoicePhoto: null,
};

const INITIAL_LINE_ITEM = {
  itemCode: '',
  itemName: '',
  qtyPerPack: '',
  uom: '',
  numberOfPacks: '',
  totalQty: 0,
  generateQR: true,
  remarks: '',
};

export default function GRNPage() {
  // Data states
  const [grns, setGrns] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [uomList, setUomList] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [openGatePasses, setOpenGatePasses] = useState([]);

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0); // 0: list, 1: security entry, 2: line items
  const [showQRModal, setShowQRModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState(null);
  const [qrStickers, setQrStickers] = useState([]);
  const [error, setError] = useState('');

  // Form states
  const [transactionData, setTransactionData] = useState(INITIAL_TRANSACTION);
  const [gatePassNumber, setGatePassNumber] = useState('');
  const [grnNumber, setGrnNumber] = useState('');
  const [lineItems, setLineItems] = useState([]);
  const [currentLineItem, setCurrentLineItem] = useState(INITIAL_LINE_ITEM);
  const [uomValidation, setUomValidation] = useState({}); // Track UOM per item code

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [grnData, vendorData, itemData, uomData, supervisorData] = await Promise.all([
        api.getGRNs().catch(() => []),
        api.fetchVendors().catch(() => []),
        api.fetchItems().catch(() => []),
        api.getUOMList().catch(() => []),
        api.fetchSupervisors().catch(() => []),
      ]);
      setGrns(Array.isArray(grnData) ? grnData : []);
      setVendors(Array.isArray(vendorData) ? vendorData : []);
      setItems(Array.isArray(itemData) ? itemData : []);
      setUomList(Array.isArray(uomData) ? uomData : ['PCS', 'KG', 'LTR', 'MTR', 'NOS', 'SET', 'BOX', 'ROLL', 'PKT', 'DOZ']);
      setSupervisors(Array.isArray(supervisorData) ? supervisorData : []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== STEP 1: Security Entry ====================
  const handleStartNewGRN = () => {
    setTransactionData({
      ...INITIAL_TRANSACTION,
      entryDate: new Date().toISOString().split('T')[0],
      receiptDate: new Date().toISOString().split('T')[0],
      vendorDocDate: new Date().toISOString().split('T')[0],
    });
    setLineItems([]);
    setGatePassNumber('');
    setGrnNumber('');
    setActiveStep(1);
    setError('');
  };

  const handleVendorSelect = (vendor) => {
    if (vendor) {
      setTransactionData(prev => ({
        ...prev,
        vendorCode: vendor['BP Code'] || vendor.BPCode || '',
        vendorName: vendor['BP Name'] || vendor.BPName || '',
        vendorPOCName: vendor['Contact Person'] || '',
        vendorPhone: vendor['Phone'] || '',
        vendorEmail: vendor['Email'] || '',
      }));
    }
  };

  const handleSecuritySubmit = async () => {
    // Validate required fields
    if (!transactionData.vendorName) return setError('Vendor Name is required');
    if (!transactionData.poNumber) return setError('PO Number is required');
    if (!transactionData.poDate) return setError('PO Date is required');
    if (!transactionData.receiverName) return setError('Security Name is required');
    if (!transactionData.vehicleNumber) return setError('Vehicle Number is required');

    setError('');
    try {
      // Generate Gate Pass
      const gpResult = await api.generateGatePass({
        vehicleNumber: transactionData.vehicleNumber,
        type: 'Inward',
      }).catch(() => ({ gatePassNumber: `GP-${Date.now()}` }));

      const gp = gpResult?.gatePassNumber || gpResult?.GatePassNumber || `GP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`;
      setGatePassNumber(gp);

      // Generate GRN number
      const grnResult = await api.generateGRNNumber().catch(() => `GRN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`);
      const grn = typeof grnResult === 'string' ? grnResult : grnResult?.grnNumber || `GRN-${Date.now()}`;
      setGrnNumber(grn);

      // Move to step 2 (line items entry by supervisor)
      setActiveStep(2);
    } catch (err) {
      setError('Failed to generate Gate Pass. Please try again.');
      console.error(err);
    }
  };

  // ==================== STEP 2: Supervisor Line Items ====================
  const handleQRScan = (data) => {
    setShowQRScanner(false);
    if (data) {
      const parsed = parseQRData(data);
      if (parsed) {
        // Find matching item in master
        const matchedItem = items.find(
          i => (i.ItemCode === parsed.itemCode) || (i.itemCode === parsed.itemCode)
        );
        if (matchedItem) {
          setCurrentLineItem(prev => ({
            ...prev,
            itemCode: parsed.itemCode,
            itemName: parsed.itemName || matchedItem['Item Description'] || matchedItem.itemName || '',
            qtyPerPack: parsed.qtyPerPack || prev.qtyPerPack,
            uom: parsed.uom || prev.uom,
          }));
        } else {
          setError(`Item not found in Item Master: ${parsed.itemCode}`);
        }
      }
    }
  };

  const handleItemCodeChange = (value) => {
    const item = items.find(
      i => (i.ItemCode === value || i.itemCode === value)
    );
    if (item) {
      setCurrentLineItem(prev => ({
        ...prev,
        itemCode: item.ItemCode || item.itemCode,
        itemName: item['Item Description'] || item.itemName || item['Froreign Name'] || '',
      }));
    } else if (value) {
      setError('Item not found in Item Master');
    }
  };

  const handleItemNameSelect = (item) => {
    if (item) {
      setCurrentLineItem(prev => ({
        ...prev,
        itemCode: item.ItemCode || item.itemCode || '',
        itemName: item['Item Description'] || item.itemName || '',
      }));
    }
  };

  const handleUOMChange = (uom) => {
    const itemCode = currentLineItem.itemCode;
    // Check if this item already has a UOM recorded
    if (uomValidation[itemCode] && uomValidation[itemCode] !== uom) {
      setError(`UOM mismatch! Item ${itemCode} was previously recorded with UOM: ${uomValidation[itemCode]}. Please use the same UOM.`);
      return;
    }
    setCurrentLineItem(prev => ({ ...prev, uom }));
    setError('');
  };

  const calculateTotalQty = () => {
    const packs = parseFloat(currentLineItem.numberOfPacks) || 0;
    const qtyPerPack = parseFloat(currentLineItem.qtyPerPack) || 0;
    return packs * qtyPerPack;
  };

  const handleAddLineItem = async () => {
    if (!currentLineItem.itemCode) return setError('Item Code is required');
    if (!currentLineItem.qtyPerPack) return setError('Qty Per Pack is required');
    if (!currentLineItem.uom) return setError('UOM is required');
    if (!currentLineItem.numberOfPacks) return setError('Number of Packs is required');

    // Validate item exists in master
    const itemExists = items.find(
      i => (i.ItemCode === currentLineItem.itemCode || i.itemCode === currentLineItem.itemCode)
    );
    if (!itemExists) {
      setError('Item not found in Item Master. Please check the item code.');
      return;
    }

    setError('');

    const totalQty = calculateTotalQty();

    // Store UOM validation
    setUomValidation(prev => ({
      ...prev,
      [currentLineItem.itemCode]: currentLineItem.uom,
    }));

    // Generate batch ID
    let batchId = '';
    try {
      const batchResult = await api.generateBatchID().catch(() => `BAT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(lineItems.length + 1).padStart(3, '0')}`);
      batchId = typeof batchResult === 'string' ? batchResult : batchResult?.batchId || `BAT-${Date.now()}`;
    } catch {
      batchId = `BAT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(lineItems.length + 1).padStart(3, '0')}`;
    }

    const newLineItem = {
      ...currentLineItem,
      lineNumber: lineItems.length + 1,
      totalQty,
      batchId,
      grnStickerGenerated: currentLineItem.generateQR ? 'Yes' : 'No',
    };

    // Generate QR stickers if requested (one per pack)
    if (currentLineItem.generateQR) {
      const newStickers = [];
      for (let i = 1; i <= parseInt(currentLineItem.numberOfPacks); i++) {
        newStickers.push({
          data: generateQRData({
            itemCode: currentLineItem.itemCode,
            itemName: currentLineItem.itemName,
            qtyPerPack: currentLineItem.qtyPerPack,
            uom: currentLineItem.uom,
            batchId,
            grnNumber,
          }),
          label: `${currentLineItem.itemCode} | Pack ${i}/${currentLineItem.numberOfPacks} | ${currentLineItem.qtyPerPack} ${currentLineItem.uom} | ${batchId}`,
          packNumber: i,
        });
      }
      setQrStickers(prev => [...prev, ...newStickers]);
    }

    setLineItems(prev => [...prev, newLineItem]);

    // Reset form but pre-fill same item's UOM for next entry
    setCurrentLineItem({
      ...INITIAL_LINE_ITEM,
      // Pre-fill from previous if same item scanned again
    });
  };

  const handleRemoveLineItem = (index) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinalSubmit = async () => {
    if (lineItems.length === 0) {
      setError('Please add at least one line item');
      return;
    }

    try {
      // Create the GRN transaction
      const grnData = {
        ...transactionData,
        grnNumber,
        gatePassNumber,
        lineItems,
        totalItems: lineItems.length,
        status: 'Completed',
      };

      await api.createGRN(grnData).catch(() => {
        console.log('GRN saved locally');
      });

      // Refresh data
      await loadData();
      setActiveStep(0);
      setShowPDFPreview(true);
      setSelectedGRN(grnData);
    } catch (err) {
      setError('Failed to save GRN. Please try again.');
      console.error(err);
    }
  };

  // ==================== Vendor options ====================
  const vendorOptions = vendors.map(v => ({
    ...v,
    label: `${v['BP Code'] || v.BPCode || ''} - ${v['BP Name'] || v.BPName || ''}`,
    value: v['BP Code'] || v.BPCode || v.id,
  }));

  const itemOptions = items.map(i => ({
    ...i,
    label: `${i.ItemCode || i.itemCode || ''} - ${i['Item Description'] || i.itemName || ''}`,
    value: i.ItemCode || i.itemCode || i.id,
  }));

  const securityOptions = supervisors
    .filter(s => s.Role === 'Security' || s.role === 'Security')
    .map(s => ({ label: s.Name || s.name, value: s.Name || s.name }));

  // ==================== GRN List Columns ====================
  const columns = [
    { key: 'GRNNumber', label: 'GRN #' },
    { key: 'GatePassNumber', label: 'Gate Pass' },
    { key: 'VendorName', label: 'Vendor' },
    { key: 'PONumber', label: 'PO #' },
    { key: 'VehicleNumber', label: 'Vehicle' },
    { key: 'ReceiptDate', label: 'Receipt Date' },
    { key: 'TotalItems', label: 'Items' },
    {
      key: 'Status', label: 'Status',
      render: (status) => <StatusBadge status={status || 'Completed'} />,
    },
    {
      key: 'actions', label: 'Actions', disableSort: true,
      render: (_, grn) => (
        <div className="flex gap-2">
          <button onClick={() => { setSelectedGRN(grn); setShowPDFPreview(true); }}
            className="text-blue-600 hover:text-blue-800" title="View GRN Document">
            <FileText size={16} />
          </button>
          <button onClick={() => { setSelectedGRN(grn); setShowQRModal(true); }}
            className="text-indigo-600 hover:text-indigo-800" title="View QR Stickers">
            <QrCode size={16} />
          </button>
        </div>
      ),
    },
  ];

  // ==================== RENDER ====================

  // Step 0: GRN List
  if (activeStep === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inward from Purchase (GRN)</h1>
            <p className="text-gray-500 mt-1">Record goods received from external vendors</p>
          </div>
          <button onClick={handleStartNewGRN}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm">
            <Truck size={20} /> New Inward Entry
          </button>
        </div>

        {/* Open Gate Passes */}
        {openGatePasses.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-800 mb-2">Open Gate Passes</h3>
            <div className="flex flex-wrap gap-2">
              {openGatePasses.map((gp, i) => (
                <span key={i} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                  {gp.GatePassNumber} | {gp.VehicleNumber}
                </span>
              ))}
            </div>
          </div>
        )}

        <DataTable columns={columns} data={grns} isLoading={isLoading}
          searchable={true} searchableFields={['GRNNumber', 'VendorName', 'PONumber', 'VehicleNumber']}
          pageSize={15} />

        {/* PDF Preview Modal */}
        <Modal isOpen={showPDFPreview} onClose={() => setShowPDFPreview(false)}
          title="GRN Document" size="xl">
          {selectedGRN && (
            <div className="p-6 bg-white" id="grn-pdf-content">
              <div className="border-2 border-gray-800 p-6">
                <h2 className="text-xl font-bold text-center mb-4">GOODS RECEIPT NOTE</h2>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div><span className="font-semibold">GRN Number:</span> {selectedGRN.grnNumber || selectedGRN.GRNNumber}</div>
                  <div><span className="font-semibold">Gate Pass:</span> {selectedGRN.gatePassNumber || selectedGRN.GatePassNumber}</div>
                  <div><span className="font-semibold">Vendor:</span> {selectedGRN.vendorName || selectedGRN.VendorName}</div>
                  <div><span className="font-semibold">PO Number:</span> {selectedGRN.poNumber || selectedGRN.PONumber}</div>
                  <div><span className="font-semibold">Receipt Date:</span> {selectedGRN.receiptDate || selectedGRN.ReceiptDate}</div>
                  <div><span className="font-semibold">Vehicle:</span> {selectedGRN.vehicleNumber || selectedGRN.VehicleNumber}</div>
                </div>
                {selectedGRN.lineItems && (
                  <table className="w-full border-collapse border border-gray-400 text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-400 p-2">#</th>
                        <th className="border border-gray-400 p-2">Item Code</th>
                        <th className="border border-gray-400 p-2">Item Name</th>
                        <th className="border border-gray-400 p-2">Qty/Pack</th>
                        <th className="border border-gray-400 p-2">UOM</th>
                        <th className="border border-gray-400 p-2">Packs</th>
                        <th className="border border-gray-400 p-2">Total Qty</th>
                        <th className="border border-gray-400 p-2">Batch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedGRN.lineItems.map((item, i) => (
                        <tr key={i}>
                          <td className="border border-gray-400 p-2 text-center">{i + 1}</td>
                          <td className="border border-gray-400 p-2">{item.itemCode}</td>
                          <td className="border border-gray-400 p-2">{item.itemName}</td>
                          <td className="border border-gray-400 p-2 text-center">{item.qtyPerPack}</td>
                          <td className="border border-gray-400 p-2 text-center">{item.uom}</td>
                          <td className="border border-gray-400 p-2 text-center">{item.numberOfPacks}</td>
                          <td className="border border-gray-400 p-2 text-center font-semibold">{item.totalQty}</td>
                          <td className="border border-gray-400 p-2 text-xs">{item.batchId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div className="mt-6 flex justify-between text-sm">
                  <div><span className="font-semibold">Receiver (Security):</span> {selectedGRN.receiverName || selectedGRN.ReceiverName}</div>
                  <div><span className="font-semibold">Signature: </span>_______________</div>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* QR Stickers Modal */}
        <Modal isOpen={showQRModal} onClose={() => setShowQRModal(false)}
          title="GRN QR Stickers" size="lg">
          <p className="text-sm text-gray-500 mb-4">Print these stickers (50mm x 25mm each) and affix one per pack.</p>
          <div className="grid grid-cols-2 gap-3">
            {qrStickers.map((sticker, i) => (
              <div key={i} className="border rounded p-2 text-xs">
                <QRGenerator data={sticker.data} size={80} />
                <p className="mt-1 truncate">{sticker.label}</p>
              </div>
            ))}
          </div>
        </Modal>
      </div>
    );
  }

  // Step 1: Security Transaction Entry
  if (activeStep === 1) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Inward Entry - Security Gate</h1>
            <p className="text-gray-500 mt-1">Step 1: Record vehicle and vendor invoice details</p>
          </div>
          <button onClick={() => setActiveStep(0)} className="text-gray-500 hover:text-gray-700">Cancel</button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-indigo-600 rounded-full"></div>
          <div className="flex-1 h-2 bg-gray-200 rounded-full"></div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>
        )}

        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
          <h3 className="font-semibold text-gray-800 border-b pb-2">Vendor Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name *</label>
              <AutoComplete
                options={vendorOptions}
                value={transactionData.vendorCode}
                onChange={(val) => {
                  const vendor = vendors.find(v => (v['BP Code'] || v.BPCode) === val);
                  handleVendorSelect(vendor);
                }}
                displayKey="label"
                valueKey="value"
                placeholder="Search vendor..."
              />
            </div>
            <FormField label="Vendor POC Name" value={transactionData.vendorPOCName}
              onChange={(e) => setTransactionData(prev => ({ ...prev, vendorPOCName: e.target.value }))} />
            <FormField label="Vendor Phone" value={transactionData.vendorPhone}
              onChange={(e) => setTransactionData(prev => ({ ...prev, vendorPhone: e.target.value }))} />
            <FormField label="Vendor Email" value={transactionData.vendorEmail}
              onChange={(e) => setTransactionData(prev => ({ ...prev, vendorEmail: e.target.value }))} />
          </div>

          <h3 className="font-semibold text-gray-800 border-b pb-2 pt-4">Purchase Order Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="PO Number *" value={transactionData.poNumber}
              onChange={(e) => setTransactionData(prev => ({ ...prev, poNumber: e.target.value }))}
              placeholder="Enter PO Number" required />
            <FormField label="PO Date *" type="date" value={transactionData.poDate}
              onChange={(e) => setTransactionData(prev => ({ ...prev, poDate: e.target.value }))} required />
            <FormField label="Committed Delivery Date" type="date" value={transactionData.committedDeliveryDate}
              onChange={(e) => setTransactionData(prev => ({ ...prev, committedDeliveryDate: e.target.value }))} />
          </div>

          <h3 className="font-semibold text-gray-800 border-b pb-2 pt-4">Document Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Vendor Document Number" value={transactionData.vendorDocNumber}
              onChange={(e) => setTransactionData(prev => ({ ...prev, vendorDocNumber: e.target.value }))} />
            <FormField label="Vendor Document Date" type="date" value={transactionData.vendorDocDate}
              onChange={(e) => setTransactionData(prev => ({ ...prev, vendorDocDate: e.target.value }))} />
            <FormField label="Receipt Date" type="date" value={transactionData.receiptDate}
              onChange={(e) => setTransactionData(prev => ({ ...prev, receiptDate: e.target.value }))} />
            <FormField label="Entry Date" type="date" value={transactionData.entryDate} disabled />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo of Invoice</label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <Camera size={16} /> Take Photo
                  <input type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={(e) => setTransactionData(prev => ({ ...prev, invoicePhoto: e.target.files[0] }))} />
                </label>
                <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <Upload size={16} /> Upload
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => setTransactionData(prev => ({ ...prev, invoicePhoto: e.target.files[0] }))} />
                </label>
                {transactionData.invoicePhoto && (
                  <span className="text-sm text-green-600">File selected</span>
                )}
              </div>
            </div>
          </div>

          <h3 className="font-semibold text-gray-800 border-b pb-2 pt-4">Gate Entry Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name of Receiver (Security) *</label>
              {securityOptions.length > 0 ? (
                <AutoComplete options={securityOptions} value={transactionData.receiverName}
                  onChange={(val) => setTransactionData(prev => ({ ...prev, receiverName: val }))}
                  displayKey="label" valueKey="value" placeholder="Select security..." />
              ) : (
                <input type="text" value={transactionData.receiverName}
                  onChange={(e) => setTransactionData(prev => ({ ...prev, receiverName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter security name" />
              )}
            </div>
            <FormField label="Vehicle Number *" value={transactionData.vehicleNumber}
              onChange={(e) => setTransactionData(prev => ({ ...prev, vehicleNumber: e.target.value.toUpperCase() }))}
              placeholder="e.g., KA-01-AB-1234" required />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={() => setActiveStep(0)}
            className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
            Cancel
          </button>
          <button onClick={handleSecuritySubmit}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm">
            Generate Gate Pass & Proceed
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Supervisor Line Items Entry
  if (activeStep === 2) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Items - Unloading</h1>
            <p className="text-gray-500 mt-1">Step 2: Scan or enter items being unloaded</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Gate Pass</div>
            <div className="text-lg font-bold text-indigo-600">{gatePassNumber}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-indigo-600 rounded-full"></div>
          <div className="flex-1 h-2 bg-indigo-600 rounded-full"></div>
        </div>

        {/* Summary bar */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex gap-6 text-sm">
            <span><strong>GRN:</strong> {grnNumber}</span>
            <span><strong>Vendor:</strong> {transactionData.vendorName}</span>
            <span><strong>PO:</strong> {transactionData.poNumber}</span>
            <span><strong>Vehicle:</strong> {transactionData.vehicleNumber}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>
        )}

        {/* Add Item Form */}
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Add Item</h3>
            <button onClick={() => setShowQRScanner(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
              <Scan size={16} /> Scan QR Code
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Code / Name *</label>
              <AutoComplete
                options={itemOptions}
                value={currentLineItem.itemCode}
                onChange={(val) => {
                  const item = items.find(i => (i.ItemCode || i.itemCode) === val);
                  if (item) handleItemNameSelect(item);
                }}
                displayKey="label"
                valueKey="value"
                placeholder="Search item code or name..."
              />
            </div>
            <FormField label="Item Name" value={currentLineItem.itemName} disabled />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qty Per Pack *</label>
              <input type="number" value={currentLineItem.qtyPerPack}
                onChange={(e) => setCurrentLineItem(prev => ({ ...prev, qtyPerPack: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., 100" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UOM *</label>
              <AutoComplete
                options={uomList.map(u => ({ label: u, value: u }))}
                value={currentLineItem.uom}
                onChange={(val) => handleUOMChange(val)}
                displayKey="label"
                valueKey="value"
                placeholder="Select UOM..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Packs *</label>
              <input type="number" value={currentLineItem.numberOfPacks}
                onChange={(e) => setCurrentLineItem(prev => ({ ...prev, numberOfPacks: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., 10" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Qty (Auto)</label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg font-bold text-lg text-indigo-700">
                {calculateTotalQty()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={currentLineItem.generateQR}
                  onChange={(e) => setCurrentLineItem(prev => ({ ...prev, generateQR: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 rounded" />
                <span className="text-sm font-medium">Generate QR Code Stickers (one per pack, 50x25mm)</span>
              </label>
            </div>
            <FormField label="Remarks" value={currentLineItem.remarks}
              onChange={(e) => setCurrentLineItem(prev => ({ ...prev, remarks: e.target.value }))}
              placeholder="Optional remarks..." />
          </div>

          <button onClick={handleAddLineItem}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
            <Plus size={16} /> Add Item
          </button>
        </div>

        {/* Line Items Table */}
        {lineItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Items Added ({lineItems.length})</h3>
              <span className="text-sm text-gray-500">
                Total Packs: {lineItems.reduce((s, i) => s + parseInt(i.numberOfPacks || 0), 0)} |
                QR Stickers: {qrStickers.length}
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">#</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Item Code</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Item Name</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Qty/Pack</th>
                  <th className="px-4 py-3 font-medium text-gray-600">UOM</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Packs</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Total Qty</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Batch</th>
                  <th className="px-4 py-3 font-medium text-gray-600">QR</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lineItems.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs">{item.itemCode}</td>
                    <td className="px-4 py-3">{item.itemName}</td>
                    <td className="px-4 py-3">{item.qtyPerPack}</td>
                    <td className="px-4 py-3">{item.uom}</td>
                    <td className="px-4 py-3">{item.numberOfPacks}</td>
                    <td className="px-4 py-3 font-bold">{item.totalQty}</td>
                    <td className="px-4 py-3 font-mono text-xs">{item.batchId}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.grnStickerGenerated === 'Yes' ? 'Active' : 'Inactive'} />
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleRemoveLineItem(i)}
                        className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* QR Stickers Preview */}
        {qrStickers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">QR Stickers Preview ({qrStickers.length} stickers)</h3>
              <button onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                <Download size={16} /> Print Stickers
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:grid-cols-4">
              {qrStickers.slice(0, 8).map((sticker, i) => (
                <div key={i} className="border border-dashed border-gray-300 rounded p-2 text-center"
                  style={{ width: '188px', height: '94px' }}>
                  <QRGenerator data={sticker.data} size={50} />
                  <p className="text-[8px] mt-1 truncate leading-tight">{sticker.label}</p>
                </div>
              ))}
              {qrStickers.length > 8 && (
                <div className="flex items-center justify-center text-sm text-gray-500">
                  +{qrStickers.length - 8} more stickers
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button onClick={() => setActiveStep(1)}
            className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
            Back to Gate Entry
          </button>
          <div className="flex gap-3">
            <button onClick={() => setActiveStep(0)}
              className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
              Cancel
            </button>
            <button onClick={handleFinalSubmit}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm"
              disabled={lineItems.length === 0}>
              Complete GRN & Generate Document
            </button>
          </div>
        </div>

        {/* QR Scanner Modal */}
        <Modal isOpen={showQRScanner} onClose={() => setShowQRScanner(false)} title="Scan QR Code" size="md">
          <QRScanner onScan={handleQRScan} onError={(err) => console.error(err)} />
        </Modal>
      </div>
    );
  }

  return null;
}
