'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Trash2, Eye, Download, AlertCircle, CheckCircle, X, ClipboardList, Truck, Package, Clock } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import AutoComplete from '@/components/AutoComplete';
import StatusBadge from '@/components/StatusBadge';
const QRScanner = dynamic(() => import('@/components/QRScanner'), { ssr: false });
import api from '@/lib/api';
import { formatDate, parseQRData, getCurrentDate } from '@/lib/utils';

export default function ReceiptPage() {
  // Main data state
  const [receipts, setReceipts] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [items, setItems] = useState([]);
  const [uomList, setUomList] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showLineItemModal, setShowLineItemModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showVarianceModal, setShowVarianceModal] = useState(false);
  const [scanError, setScanError] = useState('');
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [editingLineItem, setEditingLineItem] = useState(null);
  const [varianceData, setVarianceData] = useState(null);
  const [openInwardGatePasses, setOpenInwardGatePasses] = useState([]);

  // Form data
  const [receiptForm, setReceiptForm] = useState({
    receiptNumber: '',
    deliverychallanNumber: null,
    requisitionNumber: '',
    requisitionDate: '',
    dcDate: '',
    receiptDate: getCurrentDate(),
    entryDate: getCurrentDate(),
    receiverName: null,
    vehicleNumber: null,
    gatePassNumber: null,
    lineItems: [],
  });

  const [lineItemForm, setLineItemForm] = useState({
    itemCode: null,
    itemName: '',
    qtyPerPack: '',
    uom: null,
    numberOfPacks: '',
    grnStickerPut: 'Yes',
    remarks: '',
  });

  const [varianceForm, setVarianceForm] = useState({
    varianceType: 'dispatch-counting-error',
    remarks: '',
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [
        receiptData,
        dispatchData,
        itemData,
        uomData,
        vehicleData,
        warehouseData,
        supervisorData,
      ] = await Promise.all([
        api.getReceipts().catch(() => []),
        api.getDispatches().catch(() => []),
        api.fetchItems().catch(() => []),
        api.getUOMList().catch(() => []),
        api.fetchVehicles().catch(() => []),
        api.fetchWarehouses().catch(() => []),
        api.fetchSupervisors().catch(() => []),
      ]);

      setReceipts(receiptData || []);
      setDispatches(dispatchData || []);
      setItems(itemData || []);
      setUomList(uomData || []);
      setVehicles(vehicleData || []);
      setWarehouses(warehouseData || []);
      setSupervisors(supervisorData || []);

      // Filter open inward gate passes (receipts with status 'Open' that have no line items yet)
      const openReceipts = (receiptData || []).filter(
        (r) => r.status === 'Open' || r.Status === 'Open'
      );
      setOpenInwardGatePasses(openReceipts);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Supervisor flow - select an open gate pass and start counting
  const handleSelectOpenGatePass = async (receipt) => {
    const dispatch = dispatches.find(
      (d) => d.dcNumber === receipt.dcNumber || d.id === receipt.dcNumber
    );

    const receiptNumber = receipt.receiptNumber || receipt.ReceiptNumber || '';

    setReceiptForm({
      receiptNumber,
      deliverychallanNumber: dispatch?.id || receipt.dcNumber,
      requisitionNumber: receipt.requisitionNumber || receipt.RequisitionNumber || '',
      requisitionDate: dispatch?.requisitionDate || '',
      dcDate: dispatch?.dispatchDate || '',
      receiptDate: receipt.receiptDate || receipt.ReceiptDate || getCurrentDate(),
      entryDate: receipt.entryDate || receipt.EntryDate || getCurrentDate(),
      receiverName: receipt.receiverName || receipt.ReceiverName || null,
      vehicleNumber: vehicles.find((v) => v.vehicleNumber === (receipt.vehicleNumber || receipt.VehicleNumber))?.id || null,
      gatePassNumber: receipt.gatePassNumber || receipt.GatePassNumber || null,
      lineItems: [],
    });

    // Set selectedDispatch but supervisor will NOT see the dispatch quantities
    setSelectedDispatch(dispatch || null);
    setShowReceiptModal(true);
  };

  const handleAddLineItem = () => {
    setLineItemForm({
      itemCode: null,
      itemName: '',
      qtyPerPack: '',
      uom: null,
      numberOfPacks: '',
      grnStickerPut: 'Yes',
      remarks: '',
    });
    setEditingLineItem(null);
    setShowLineItemModal(true);
  };

  const handleEditLineItem = (index) => {
    setLineItemForm(receiptForm.lineItems[index]);
    setEditingLineItem(index);
    setShowLineItemModal(true);
  };

  const handleSaveLineItem = () => {
    if (!lineItemForm.itemCode || !lineItemForm.qtyPerPack || !lineItemForm.uom || !lineItemForm.numberOfPacks) {
      alert('Please fill all required fields');
      return;
    }

    const totalQty = parseInt(lineItemForm.numberOfPacks || 0) * parseFloat(lineItemForm.qtyPerPack || 0);
    const lineItem = {
      ...lineItemForm,
      totalQty,
    };

    if (editingLineItem !== null) {
      const updated = [...receiptForm.lineItems];
      updated[editingLineItem] = lineItem;
      setReceiptForm({ ...receiptForm, lineItems: updated });
    } else {
      setReceiptForm({
        ...receiptForm,
        lineItems: [...receiptForm.lineItems, lineItem],
      });
    }

    setShowLineItemModal(false);
    setLineItemForm({
      itemCode: null,
      itemName: '',
      qtyPerPack: '',
      uom: null,
      numberOfPacks: '',
      grnStickerPut: 'Yes',
      remarks: '',
    });
  };

  const handleDeleteLineItem = (index) => {
    setReceiptForm({
      ...receiptForm,
      lineItems: receiptForm.lineItems.filter((_, i) => i !== index),
    });
  };

  const handleQRScan = (qrData) => {
    try {
      const parsed = parseQRData(qrData);
      const item = items.find((i) => i.itemCode === parsed.itemCode);

      if (item) {
        setLineItemForm({
          itemCode: item.id,
          itemName: item.itemName,
          qtyPerPack: parsed.qtyPerPack || item.qtyPerPack || '',
          uom: item.uom || null,
          numberOfPacks: '',
          grnStickerPut: 'Yes',
          remarks: '',
        });
        setScanError('');
      } else {
        setScanError('Item not found in system');
      }
    } catch (error) {
      setScanError('Invalid QR code format');
    }
    setShowQRModal(false);
  };

  const handleSaveReceipt = async () => {
    if (
      !receiptForm.deliverychallanNumber ||
      !receiptForm.receiverName ||
      !receiptForm.vehicleNumber ||
      receiptForm.lineItems.length === 0
    ) {
      alert('Please fill all required fields and add at least one line item');
      return;
    }

    try {
      // Check for variance
      const dispatchLineItems = selectedDispatch?.lineItems || [];
      let hasVariance = false;

      const receiptData = {
        receiptNumber: receiptForm.receiptNumber,
        dcNumber: dispatches.find((d) => d.id === receiptForm.deliverychallanNumber)?.dcNumber || receiptForm.deliverychallanNumber,
        requisitionNumber: receiptForm.requisitionNumber,
        receiptDate: receiptForm.receiptDate,
        entryDate: receiptForm.entryDate,
        receiverName: receiptForm.receiverName,
        vehicleNumber: vehicles.find((v) => v.id === receiptForm.vehicleNumber)?.vehicleNumber,
        gatePassNumber: receiptForm.gatePassNumber,
        lineItems: receiptForm.lineItems.map((item) => ({
          itemCode: items.find((i) => i.id === item.itemCode)?.itemCode,
          itemName: item.itemName,
          qtyPerPack: item.qtyPerPack,
          numberOfPacks: item.numberOfPacks,
          totalQty: item.totalQty,
          uom: item.uom,
          grnStickerPut: item.grnStickerPut,
          remarks: item.remarks,
        })),
      };

      // Save receipt first
      await api.createReceipt(receiptData);

      // Check for variance
      receiptForm.lineItems.forEach((receivedItem) => {
        const dispatchedItem = dispatchLineItems.find(
          (d) => d.itemCode === items.find((i) => i.id === receivedItem.itemCode)?.itemCode
        );

        if (dispatchedItem && dispatchedItem.totalQty !== receivedItem.totalQty) {
          hasVariance = true;
          setVarianceData({
            itemCode: receivedItem.itemName,
            dispatchedQty: dispatchedItem.totalQty,
            receivedQty: receivedItem.totalQty,
            variance: receivedItem.totalQty - dispatchedItem.totalQty,
          });
        }
      });

      if (hasVariance) {
        setShowReceiptModal(false);
        setShowVarianceModal(true);
      } else {
        setShowReceiptModal(false);
        await loadData();
        alert('Receipt recorded successfully!');
        resetReceiptForm();
      }
    } catch (error) {
      console.error('Error saving receipt:', error);
      alert('Error saving receipt');
    }
  };

  const handleVarianceResolution = async () => {
    try {
      await api.reconcileDocument({
        dispatchId: selectedDispatch?.id,
        varianceType: varianceForm.varianceType,
        remarks: varianceForm.remarks,
      });

      setShowVarianceModal(false);
      await loadData();
      alert('Variance recorded and reconciled!');
      resetReceiptForm();
    } catch (error) {
      console.error('Error reconciling variance:', error);
      alert('Error reconciling variance');
    }
  };

  const resetReceiptForm = () => {
    setReceiptForm({
      receiptNumber: '',
      deliverychallanNumber: null,
      requisitionNumber: '',
      requisitionDate: '',
      dcDate: '',
      receiptDate: getCurrentDate(),
      entryDate: getCurrentDate(),
      receiverName: null,
      vehicleNumber: null,
      gatePassNumber: null,
      lineItems: [],
    });
    setSelectedDispatch(null);
  };

  const columns = [
    { key: 'receiptNumber', label: 'Receipt #' },
    { key: 'dcNumber', label: 'DC Number' },
    { key: 'gatePassNumber', label: 'Gate Pass #' },
    { key: 'receiverName', label: 'Receiver' },
    { key: 'receiptDate', label: 'Receipt Date', render: (v) => formatDate(v) },
    {
      key: 'status',
      label: 'Status',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => alert('PDF download - integrate with service')}
            className="p-1 hover:bg-secondary-100 rounded transition-colors"
            title="Download Receipt Note"
          >
            <Download size={16} />
          </button>
          <button
            onClick={() => setSelectedDispatch(row)}
            className="p-1 hover:bg-secondary-100 rounded transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
        </div>
      ),
    },
  ];

  const itemOptions = items.map((i) => ({
    id: i.id,
    name: `${i.itemCode} - ${i.itemName}`,
  }));

  const uomOptions = uomList.map((u) => ({
    id: typeof u === 'string' ? u : (u.id || u),
    name: typeof u === 'string' ? u : (u.uomName || u.name || u),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            Internal Receipt
          </h1>
          <p className="text-secondary-600 mt-1">
            Select an open gate pass to record receipt of dispatched materials
          </p>
        </div>
      </div>

      {/* Open Inward Gate Passes */}
      {openInwardGatePasses.length > 0 ? (
        <div id="open-gate-passes-section" className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <Clock size={18} />
            Open Inward Gate Passes - Select to Start Counting ({openInwardGatePasses.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {openInwardGatePasses.map((gp, i) => (
              <button
                key={i}
                onClick={() => handleSelectOpenGatePass(gp)}
                className="flex flex-col gap-1 p-4 bg-white border border-amber-300 rounded-lg hover:border-indigo-500 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-secondary-900 group-hover:text-indigo-600">
                    {gp.gatePassNumber || gp.GatePassNumber || 'N/A'}
                  </span>
                  <StatusBadge status="Open" />
                </div>
                <div className="text-sm text-secondary-600">
                  <span className="font-medium">DC:</span> {gp.dcNumber || gp.DCNumber || 'N/A'}
                </div>
                <div className="text-sm text-secondary-600">
                  <span className="font-medium">Vehicle:</span> {gp.vehicleNumber || gp.VehicleNumber || 'N/A'}
                </div>
                <div className="text-sm text-secondary-600">
                  <span className="font-medium">Receipt #:</span> {gp.receiptNumber || gp.ReceiptNumber || 'N/A'}
                </div>
                <div className="text-xs text-secondary-400 mt-1">
                  {formatDate(gp.receiptDate || gp.ReceiptDate)}
                </div>
                <div className="text-xs text-indigo-600 font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to start counting
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

      <DataTable
        columns={columns}
        data={receipts}
        isLoading={isLoading}
        searchable={true}
        searchableFields={['receiptNumber', 'dcNumber', 'gatePassNumber', 'receiverName']}
        pageSize={10}
      />

      {/* Receipt Modal - Supervisor Counting */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="Supervisor - Record Inward Counting"
        size="4xl"
        actions={[
          {
            label: 'Cancel',
            variant: 'secondary',
            onClick: () => setShowReceiptModal(false),
          },
          {
            label: 'Save Receipt',
            onClick: handleSaveReceipt,
          },
        ]}
      >
        <div className="space-y-6">
          {/* Receipt Header Info (read-only, from gate pass) */}
          <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
            <h3 className="font-semibold text-secondary-900 mb-3 flex items-center gap-2">
              <Package size={18} />
              Gate Pass Details
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                label="Receipt Number"
                value={receiptForm.receiptNumber}
                disabled
                readOnly
              />
              <FormField
                label="DC Number"
                value={dispatches.find((d) => d.id === receiptForm.deliverychallanNumber)?.dcNumber || receiptForm.deliverychallanNumber || ''}
                disabled
                readOnly
              />
              <FormField
                label="Gate Pass Number"
                value={typeof receiptForm.gatePassNumber === 'object' ? '' : (receiptForm.gatePassNumber || '')}
                disabled
                readOnly
              />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3">
              <FormField
                label="Receipt Date"
                value={receiptForm.receiptDate}
                disabled
                readOnly
              />
              <FormField
                label="Vehicle Number"
                value={vehicles.find((v) => v.id === receiptForm.vehicleNumber)?.vehicleNumber || ''}
                disabled
                readOnly
              />
              <FormField
                label="Requisition Number"
                value={receiptForm.requisitionNumber}
                disabled
                readOnly
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <AlertCircle size={16} className="inline mr-2" />
            Count items independently. Dispatch quantities are hidden to ensure accurate counting.
          </div>

          {/* Line Items */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-secondary-900">
                Receipt Line Items
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowQRModal(true)}
                  className="px-3 py-1 text-sm bg-secondary-600 text-white rounded hover:bg-secondary-700 transition-colors"
                >
                  Scan GRN
                </button>
                <button
                  onClick={handleAddLineItem}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>
            </div>

            {receiptForm.lineItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-secondary-200 bg-secondary-50">
                      <th className="text-left p-2">Item Code</th>
                      <th className="text-left p-2">Qty/Pack</th>
                      <th className="text-left p-2">UOM</th>
                      <th className="text-left p-2">Packs</th>
                      <th className="text-left p-2">Total Qty</th>
                      <th className="text-left p-2">GRN Sticker</th>
                      <th className="text-left p-2">Remarks</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptForm.lineItems.map((item, index) => (
                      <tr key={index} className="border-b border-secondary-100 hover:bg-secondary-50">
                        <td className="p-2">
                          {items.find((i) => i.id === item.itemCode)?.itemCode}
                        </td>
                        <td className="p-2">{item.qtyPerPack}</td>
                        <td className="p-2">{item.uom}</td>
                        <td className="p-2">{item.numberOfPacks}</td>
                        <td className="p-2 font-medium">{item.totalQty}</td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              item.grnStickerPut === 'Yes'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {item.grnStickerPut}
                          </span>
                        </td>
                        <td className="p-2 text-secondary-600">{item.remarks}</td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditLineItem(index)}
                              className="p-1 hover:bg-indigo-100 rounded transition-colors"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteLineItem(index)}
                              className="p-1 hover:bg-red-100 rounded transition-colors text-red-600"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-secondary-600">
                No line items added yet
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Line Item Modal */}
      <Modal
        isOpen={showLineItemModal}
        onClose={() => setShowLineItemModal(false)}
        title={editingLineItem !== null ? 'Edit Line Item' : 'Add Line Item'}
        size="lg"
        actions={[
          {
            label: 'Cancel',
            variant: 'secondary',
            onClick: () => setShowLineItemModal(false),
          },
          {
            label: 'Save Item',
            onClick: handleSaveLineItem,
          },
        ]}
      >
        <div className="space-y-4">
          <AutoComplete
            label="Item Code / Name"
            options={itemOptions}
            value={lineItemForm.itemCode}
            onChange={(value) => {
              const item = items.find((i) => i.id === value);
              setLineItemForm({
                ...lineItemForm,
                itemCode: value,
                itemName: item?.itemName || '',
                uom: item?.uom || null,
              });
            }}
            displayKey="name"
            valueKey="id"
            required
          />

          <FormField
            label="Qty Per Pack"
            type="number"
            value={lineItemForm.qtyPerPack}
            onChange={(e) =>
              setLineItemForm({ ...lineItemForm, qtyPerPack: e.target.value })
            }
            step="0.01"
            required
          />

          <AutoComplete
            label="UOM"
            options={uomOptions}
            value={lineItemForm.uom}
            onChange={(value) =>
              setLineItemForm({ ...lineItemForm, uom: value })
            }
            displayKey="name"
            valueKey="id"
            required
          />

          <FormField
            label="Number of Packs"
            type="number"
            value={lineItemForm.numberOfPacks}
            onChange={(e) =>
              setLineItemForm({ ...lineItemForm, numberOfPacks: e.target.value })
            }
            required
          />

          <FormField
            label="GRN Sticker Put"
            type="radio"
            options={[
              { value: 'Yes', label: 'Yes' },
              { value: 'No', label: 'No' },
            ]}
            value={lineItemForm.grnStickerPut}
            onChange={(e) =>
              setLineItemForm({ ...lineItemForm, grnStickerPut: e.target.value })
            }
          />

          <FormField
            label="Remarks"
            type="textarea"
            rows={3}
            value={lineItemForm.remarks}
            onChange={(e) =>
              setLineItemForm({ ...lineItemForm, remarks: e.target.value })
            }
            placeholder="Any damage, discrepancies, or notes..."
          />

          {lineItemForm.itemCode && (
            <div className="bg-indigo-50 border border-indigo-200 rounded p-3 text-sm">
              <strong>Total Qty:</strong>{' '}
              {(parseInt(lineItemForm.numberOfPacks || 0) *
                parseFloat(lineItemForm.qtyPerPack || 0)).toFixed(2)}{' '}
              {lineItemForm.uom}
            </div>
          )}
        </div>
      </Modal>

      {/* QR Scanner Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="Scan GRN Sticker"
        size="lg"
      >
        <div className="space-y-4">
          {scanError && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{scanError}</p>
            </div>
          )}
          <QRScanner
            onScan={handleQRScan}
            onError={(error) => setScanError(error)}
          />
        </div>
      </Modal>

      {/* Variance Modal */}
      <Modal
        isOpen={showVarianceModal}
        onClose={() => setShowVarianceModal(false)}
        title="Dispatch vs Receipt Variance"
        size="md"
        actions={[
          {
            label: 'Cancel',
            variant: 'secondary',
            onClick: () => setShowVarianceModal(false),
          },
          {
            label: 'Record Variance',
            onClick: handleVarianceResolution,
          },
        ]}
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="font-medium text-yellow-900 mb-2">Variance Detected</p>
            <div className="text-sm text-yellow-800 space-y-1">
              {varianceData && (
                <>
                  <p>Item: {varianceData.itemCode}</p>
                  <p>Dispatched Qty: {varianceData.dispatchedQty}</p>
                  <p>Received Qty: {varianceData.receivedQty}</p>
                  <p
                    className={`font-medium ${
                      varianceData.variance > 0
                        ? 'text-green-700'
                        : 'text-red-700'
                    }`}
                  >
                    Variance: {varianceData.variance > 0 ? '+' : ''}
                    {varianceData.variance}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-secondary-700">
              Classify Variance Type
            </label>
            <FormField
              type="radio"
              options={[
                {
                  value: 'dispatch-counting-error',
                  label: 'Dispatch Counting Error',
                },
                {
                  value: 'receipt-counting-error',
                  label: 'Receipt Counting Error',
                },
                { value: 'transit-loss', label: 'Transit Loss' },
              ]}
              value={varianceForm.varianceType}
              onChange={(e) =>
                setVarianceForm({
                  ...varianceForm,
                  varianceType: e.target.value,
                })
              }
              required
            />
          </div>

          <FormField
            label="Remarks (Required)"
            type="textarea"
            rows={3}
            value={varianceForm.remarks}
            onChange={(e) =>
              setVarianceForm({
                ...varianceForm,
                remarks: e.target.value,
              })
            }
            placeholder="Explain the variance and any corrective actions..."
            required
          />
        </div>
      </Modal>
    </div>
  );
}
