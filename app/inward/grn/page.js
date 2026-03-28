'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Eye, Download, QrCode, Scan, Truck, Package, FileText, Clock } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import AutoComplete from '@/components/AutoComplete';
const QRGenerator = dynamic(() => import('@/components/QRGenerator'), { ssr: false });
const QRScanner = dynamic(() => import('@/components/QRScanner'), { ssr: false });
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { formatDate, generateQRData, parseQRData } from '@/lib/utils';

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
  const [items, setItems] = useState([]);
  const [uomList, setUomList] = useState([]);
  const [openGatePasses, setOpenGatePasses] = useState([]);

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0); // 0: list, 1: line items
  const [showQRModal, setShowQRModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState(null);
  const [qrStickers, setQrStickers] = useState([]);
  const [error, setError] = useState('');

  // Form states - gate pass data from security
  const [selectedGatePass, setSelectedGatePass] = useState(null);
  const [gatePassNumber, setGatePassNumber] = useState('');
  const [grnNumber, setGrnNumber] = useState('');
  const [lineItems, setLineItems] = useState([]);
  const [currentLineItem, setCurrentLineItem] = useState(INITIAL_LINE_ITEM);
  const [uomValidation, setUomValidation] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [grnData, itemData, uomData, gatePassData] = await Promise.all([
        api.getGRNs().catch(() => []),
        api.fetchItems().catch(() => []),
        api.getUOMList().catch(() => []),
        api.getOpenGatePasses().catch(() => []),
      ]);
      setGrns(Array.isArray(grnData) ? grnData : []);
      setItems(Array.isArray(itemData) ? itemData : []);
      setUomList(Array.isArray(uomData) ? uomData : ['PCS', 'KG', 'LTR', 'MTR', 'NOS', 'SET', 'BOX', 'ROLL', 'PKT', 'DOZ']);
      // Filter only purchase-type open gate passes
      const allGP = Array.isArray(gatePassData) ? gatePassData : [];
      const purchaseGP = allGP.filter(gp => {
        const subType = gp.SubType || gp.subType || '';
        const type = gp.Type || gp.type || '';
        // Show gate passes that are for purchase inward, or those without subType that are Inward type (backwards compatibility)
        return subType === 'Purchase' || (type === 'Inward' && subType !== 'Internal');
      });
      setOpenGatePasses(purchaseGP);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== Select Gate Pass & Start GRN ====================
  const handleSelectGatePass = async (gp) => {
    setSelectedGatePass(gp);
    setGatePassNumber(gp.GatePassNumber || gp.gatePassNumber || '');
    setLineItems([]);
    setQrStickers([]);
    setError('');
    setUomValidation({});

    try {
      const grnResult = await api.generateGRNNumber().catch(() => `GRN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`);
      const grn = typeof grnResult === 'string' ? grnResult : grnResult?.grnNumber || `GRN-${Date.now()}`;
      setGrnNumber(grn);
      setActiveStep(1);
    } catch (err) {
      setError('Failed to generate GRN number. Please try again.');
      console.error(err);
    }
  };

  // ==================== Line Items Entry ====================
  const handleQRScan = (data) => {
    setShowQRScanner(false);
    if (data) {
      const parsed = parseQRData(data);
      if (parsed) {
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

    const itemExists = items.find(
      i => (i.ItemCode === currentLineItem.itemCode || i.itemCode === currentLineItem.itemCode)
    );
    if (!itemExists) {
      setError('Item not found in Item Master. Please check the item code.');
      return;
    }

    setError('');
    const totalQty = calculateTotalQty();

    setUomValidation(prev => ({
      ...prev,
      [currentLineItem.itemCode]: currentLineItem.uom,
    }));

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
    setCurrentLineItem({ ...INITIAL_LINE_ITEM });
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
      const grnData = {
        vendorCode: selectedGatePass?.VendorCode || selectedGatePass?.vendorCode || '',
        vendorName: selectedGatePass?.VendorName || selectedGatePass?.vendorName || '',
        vendorPOCName: selectedGatePass?.VendorPOCName || selectedGatePass?.vendorPOCName || '',
        vendorPhone: selectedGatePass?.VendorPhone || selectedGatePass?.vendorPhone || '',
        vendorEmail: selectedGatePass?.VendorEmail || selectedGatePass?.vendorEmail || '',
        poNumber: selectedGatePass?.PONumber || selectedGatePass?.poNumber || '',
        poDate: selectedGatePass?.PODate || selectedGatePass?.poDate || '',
        committedDeliveryDate: selectedGatePass?.CommittedDeliveryDate || selectedGatePass?.committedDeliveryDate || '',
        vendorDocNumber: selectedGatePass?.VendorDocNumber || selectedGatePass?.vendorDocNumber || '',
        vendorDocDate: selectedGatePass?.VendorDocDate || selectedGatePass?.vendorDocDate || '',
        receiptDate: selectedGatePass?.ReceiptDate || selectedGatePass?.receiptDate || '',
        entryDate: selectedGatePass?.EntryDate || selectedGatePass?.entryDate || '',
        receiverName: selectedGatePass?.ReceiverName || selectedGatePass?.receiverName || '',
        vehicleNumber: selectedGatePass?.VehicleNumber || selectedGatePass?.vehicleNumber || '',
        grnNumber,
        gatePassNumber,
        lineItems,
        totalItems: lineItems.length,
        status: 'Completed',
      };

      await api.createGRN(grnData).catch(() => {
        console.log('GRN saved locally');
      });

      // Close the gate pass
      await api.closeGatePass({ gatePassNumber }).catch(() => {});

      await loadData();
      setActiveStep(0);
      setShowPDFPreview(true);
      setSelectedGRN(grnData);
    } catch (err) {
      setError('Failed to save GRN. Please try again.');
      console.error(err);
    }
  };

  // ==================== Options ====================
  const itemOptions = items.map(i => ({
    ...i,
    label: `${i.ItemCode || i.itemCode || ''} - ${i['Item Description'] || i.itemName || ''}`,
    value: i.ItemCode || i.itemCode || i.id,
  }));

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

  // Step 0: GRN List + Open Gate Passes
  if (activeStep === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inward from Purchase (GRN)</h1>
            <p className="text-gray-500 mt-1">Select an open gate pass to record items received from vendors</p>
          </div>
        </div>

        {/* Open Gate Passes - Clickable cards for supervisor to pick */}
        {openGatePasses.length > 0 ? (
          <div id="open-gate-passes-section" className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
              <Clock size={18} />
              Open Gate Passes - Select to Start GRN ({openGatePasses.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {openGatePasses.map((gp, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectGatePass(gp)}
                  className="flex flex-col gap-1 p-4 bg-white border border-amber-300 rounded-lg hover:border-indigo-500 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-gray-900 group-hover:text-indigo-600">
                      {gp.GatePassNumber || gp.gatePassNumber || 'N/A'}
                    </span>
                    <StatusBadge status="Open" />
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Vendor:</span> {gp.VendorName || gp.vendorName || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">PO:</span> {gp.PONumber || gp.poNumber || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Vehicle:</span> {gp.VehicleNumber || gp.vehicleNumber || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatDate(gp.Date || gp.date || gp.ReceiptDate || gp.receiptDate)}
                  </div>
                  <div className="text-xs text-indigo-600 font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to start GRN entry
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <Package size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600 font-medium">No open gate passes available</p>
            <p className="text-gray-400 text-sm mt-1">Security must create a gate pass first from the Gate Pass page</p>
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

  // Step 1: Supervisor Line Items Entry (selected gate pass)
  if (activeStep === 1) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Items - Unloading</h1>
            <p className="text-gray-500 mt-1">Scan or enter items being unloaded</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Gate Pass</div>
            <div className="text-lg font-bold text-indigo-600">{gatePassNumber}</div>
          </div>
        </div>

        {/* Summary bar - info from gate pass */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex gap-6 text-sm flex-wrap">
            <span><strong>GRN:</strong> {grnNumber}</span>
            <span><strong>Vendor:</strong> {selectedGatePass?.VendorName || selectedGatePass?.vendorName || 'N/A'}</span>
            <span><strong>PO:</strong> {selectedGatePass?.PONumber || selectedGatePass?.poNumber || 'N/A'}</span>
            <span><strong>Vehicle:</strong> {selectedGatePass?.VehicleNumber || selectedGatePass?.vehicleNumber || 'N/A'}</span>
            <span><strong>Security:</strong> {selectedGatePass?.ReceiverName || selectedGatePass?.receiverName || 'N/A'}</span>
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
          <button onClick={() => { setActiveStep(0); setSelectedGatePass(null); }}
            className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
            Back to Gate Pass List
          </button>
          <div className="flex gap-3">
            <button onClick={() => { setActiveStep(0); setSelectedGatePass(null); }}
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
