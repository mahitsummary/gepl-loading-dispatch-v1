'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Trash2, Eye, Download, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import AutoComplete from '@/components/AutoComplete';
import StatusBadge from '@/components/StatusBadge';
const QRScanner = dynamic(() => import('@/components/QRScanner'), { ssr: false });
const QRGenerator = dynamic(() => import('@/components/QRGenerator'), { ssr: false });
import api from '@/lib/api';
import { formatDate, parseQRData, generateQRData, getCurrentDate } from '@/lib/utils';

export default function DispatchPage() {
  // Main data state
  const [dispatches, setDispatches] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [uomList, setUomList] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showLineItemModal, setShowLineItemModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showRequisitionClosureModal, setShowRequisitionClosureModal] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [editingLineItem, setEditingLineItem] = useState(null);
  const [scanError, setScanError] = useState('');

  // Form data
  const [dispatchForm, setDispatchForm] = useState({
    dcNumber: '',
    supervisorName: null,
    driverName: null,
    vehicleNumber: null,
    dispatchDate: getCurrentDate(),
    requisitionNumber: null,
    locationFromAddress: '',
    locationFromPhone: '',
    locationFromGST: '',
    locationToAddress: '',
    locationToPhone: '',
    locationToGST: '',
    lineItems: [],
  });

  const [lineItemForm, setLineItemForm] = useState({
    itemCode: null,
    itemName: '',
    qtyPerPack: '',
    uom: null,
    numberOfPacks: '',
    grnStickerStuck: 'Yes',
    remarks: '',
  });

  const [requisitionClosureForm, setRequisitionClosureForm] = useState({
    closeRequisition: 'keep-open',
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [
        dispatchData,
        supervisorData,
        driverData,
        vehicleData,
        itemData,
        warehouseData,
        uomData,
        requisitionData,
      ] = await Promise.all([
        api.getDispatches().catch(() => []),
        api.fetchSupervisors().catch(() => []),
        api.fetchDrivers().catch(() => []),
        api.fetchVehicles().catch(() => []),
        api.fetchItems().catch(() => []),
        api.fetchWarehouses().catch(() => []),
        api.getUOMList().catch(() => []),
        api.getRequisitions().catch(() => []),
      ]);

      setDispatches(dispatchData || []);
      setSupervisors(supervisorData || []);
      setDrivers(driverData || []);
      setVehicles(vehicleData || []);
      setItems(itemData || []);
      setWarehouses(warehouseData || []);
      setUomList(uomData || []);
      setRequisitions(requisitionData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartDispatch = async (requisition = null) => {
    const dcNumber = await api.generateDCNumber().catch(() => '');
    setDispatchForm({
      dcNumber,
      supervisorName: null,
      driverName: null,
      vehicleNumber: null,
      dispatchDate: getCurrentDate(),
      requisitionNumber: requisition?.id || null,
      locationFromAddress: '',
      locationFromPhone: '',
      locationFromGST: '',
      locationToAddress: requisition?.plantAddress || '',
      locationToPhone: requisition?.plantPhone || '',
      locationToGST: requisition?.plantGST || '',
      lineItems: [],
    });
    setSelectedDispatch(null);
    setShowDispatchModal(true);
  };

  const handleAddLineItem = () => {
    setLineItemForm({
      itemCode: null,
      itemName: '',
      qtyPerPack: '',
      uom: null,
      numberOfPacks: '',
      grnStickerStuck: 'Yes',
      remarks: '',
    });
    setEditingLineItem(null);
    setShowLineItemModal(true);
  };

  const handleEditLineItem = (index) => {
    setLineItemForm(dispatchForm.lineItems[index]);
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
      const updated = [...dispatchForm.lineItems];
      updated[editingLineItem] = lineItem;
      setDispatchForm({ ...dispatchForm, lineItems: updated });
    } else {
      setDispatchForm({
        ...dispatchForm,
        lineItems: [...dispatchForm.lineItems, lineItem],
      });
    }

    setShowLineItemModal(false);
    setLineItemForm({
      itemCode: null,
      itemName: '',
      qtyPerPack: '',
      uom: null,
      numberOfPacks: '',
      grnStickerStuck: 'Yes',
      remarks: '',
    });
  };

  const handleDeleteLineItem = (index) => {
    setDispatchForm({
      ...dispatchForm,
      lineItems: dispatchForm.lineItems.filter((_, i) => i !== index),
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
          grnStickerStuck: 'Yes',
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

  const handleSaveDispatch = async () => {
    if (
      !dispatchForm.supervisorName ||
      !dispatchForm.driverName ||
      !dispatchForm.vehicleNumber ||
      !dispatchForm.locationFromAddress ||
      !dispatchForm.locationToAddress ||
      dispatchForm.lineItems.length === 0
    ) {
      alert('Please fill all required fields and add at least one line item');
      return;
    }

    try {
      const dispatchData = {
        dcNumber: dispatchForm.dcNumber,
        supervisorName: supervisors.find((s) => s.id === dispatchForm.supervisorName)?.supervisorName,
        driverName: drivers.find((d) => d.id === dispatchForm.driverName)?.driverName,
        vehicleNumber: vehicles.find((v) => v.id === dispatchForm.vehicleNumber)?.vehicleNumber,
        dispatchDate: dispatchForm.dispatchDate,
        requisitionNumber: dispatchForm.requisitionNumber,
        locationFromAddress: dispatchForm.locationFromAddress,
        locationFromPhone: dispatchForm.locationFromPhone,
        locationFromGST: dispatchForm.locationFromGST,
        locationToAddress: dispatchForm.locationToAddress,
        locationToPhone: dispatchForm.locationToPhone,
        locationToGST: dispatchForm.locationToGST,
        lineItems: dispatchForm.lineItems.map((item) => ({
          itemCode: items.find((i) => i.id === item.itemCode)?.itemCode,
          itemName: item.itemName,
          qtyPerPack: item.qtyPerPack,
          numberOfPacks: item.numberOfPacks,
          totalQty: item.totalQty,
          uom: item.uom,
          grnStickerStuck: item.grnStickerStuck,
          remarks: item.remarks,
        })),
        status: 'open',
      };

      await api.createDispatch(dispatchData);
      setShowDispatchModal(false);
      setShowRequisitionClosureModal(true);
      await loadData();
    } catch (error) {
      console.error('Error saving dispatch:', error);
      alert('Error saving dispatch');
    }
  };

  const handleRequisitionClosure = async () => {
    if (requisitionClosureForm.closeRequisition === 'close') {
      try {
        await api.updateRequisitionStatus({
          requisitionNumber: dispatchForm.requisitionNumber,
          status: 'closed',
        });
      } catch (error) {
        console.error('Error closing requisition:', error);
      }
    }
    setShowRequisitionClosureModal(false);
    setDispatchForm({
      dcNumber: '',
      supervisorName: null,
      driverName: null,
      vehicleNumber: null,
      dispatchDate: getCurrentDate(),
      requisitionNumber: null,
      locationFromAddress: '',
      locationFromPhone: '',
      locationFromGST: '',
      locationToAddress: '',
      locationToPhone: '',
      locationToGST: '',
      lineItems: [],
    });
  };

  const handleGeneratePDF = (dispatch) => {
    // Generate delivery challan PDF
    const dcQRData = generateQRData({
      itemCode: dispatch.dcNumber,
      itemName: dispatch.dcNumber,
      qtyPerPack: '1',
      uom: 'DC',
      batchId: dispatch.dcNumber,
      grnNumber: dispatch.dcNumber,
    });

    console.log('Generate PDF for Delivery Challan:', dispatch, dcQRData);
    // In production, integrate with PDF generation library and API
    alert('PDF generation initiated - integrate with PDF service');
  };

  const columns = [
    { key: 'dcNumber', label: 'DC Number' },
    { key: 'supervisorName', label: 'Supervisor' },
    { key: 'driverName', label: 'Driver' },
    { key: 'vehicleNumber', label: 'Vehicle' },
    { key: 'dispatchDate', label: 'Date', render: (v) => formatDate(v) },
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
            onClick={() => handleGeneratePDF(row)}
            className="p-1 hover:bg-secondary-100 rounded transition-colors"
            title="Download PDF"
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

  const supervisorOptions = supervisors.map((s) => ({
    id: s.id,
    name: s.supervisorName,
  }));

  const driverOptions = drivers.map((d) => ({
    id: d.id,
    name: d.driverName,
  }));

  const vehicleOptions = vehicles.map((v) => ({
    id: v.id,
    name: v.vehicleNumber,
  }));

  const itemOptions = items.map((i) => ({
    id: i.id,
    name: `${i.itemCode} - ${i.itemName}`,
  }));

  const uomOptions = uomList.map((u) => ({
    id: u.id,
    name: u.uomName || u.name,
  }));

  const requisitionOptions = requisitions
    .filter((r) => r.status === 'open')
    .map((r) => ({
      id: r.id,
      name: `${r.requisitionNumber} - ${r.description || ''}`,
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            Internal Dispatch
          </h1>
          <p className="text-secondary-600 mt-1">
            Create and manage material dispatch to production plants
          </p>
        </div>
        <button
          onClick={() => handleStartDispatch()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus size={20} />
          New Dispatch
        </button>
      </div>

      <DataTable
        columns={columns}
        data={dispatches}
        isLoading={isLoading}
        searchable={true}
        searchableFields={['dcNumber', 'supervisorName', 'driverName']}
        pageSize={10}
      />

      {/* Dispatch Modal */}
      <Modal
        isOpen={showDispatchModal}
        onClose={() => setShowDispatchModal(false)}
        title="Create Dispatch Challan"
        size="4xl"
        actions={[
          {
            label: 'Cancel',
            variant: 'secondary',
            onClick: () => setShowDispatchModal(false),
          },
          {
            label: 'Save Dispatch',
            onClick: handleSaveDispatch,
          },
        ]}
      >
        <div className="space-y-6">
          {/* Document Header */}
          <div className="grid grid-cols-3 gap-4">
            <FormField
              label="DC Number"
              value={dispatchForm.dcNumber}
              disabled
              readOnly
              required
            />
            <FormField
              label="Dispatch Date"
              type="date"
              value={dispatchForm.dispatchDate}
              onChange={(e) =>
                setDispatchForm({ ...dispatchForm, dispatchDate: e.target.value })
              }
              required
            />
            <AutoComplete
              label="Requisition (Optional)"
              options={requisitionOptions}
              value={dispatchForm.requisitionNumber}
              onChange={(value) =>
                setDispatchForm({ ...dispatchForm, requisitionNumber: value })
              }
              displayKey="name"
              valueKey="id"
            />
          </div>

          {/* Supervisor, Driver, Vehicle */}
          <div className="grid grid-cols-3 gap-4">
            <AutoComplete
              label="Supervisor Name"
              options={supervisorOptions}
              value={dispatchForm.supervisorName}
              onChange={(value) =>
                setDispatchForm({ ...dispatchForm, supervisorName: value })
              }
              displayKey="name"
              valueKey="id"
              required
            />
            <AutoComplete
              label="Driver Name"
              options={driverOptions}
              value={dispatchForm.driverName}
              onChange={(value) =>
                setDispatchForm({ ...dispatchForm, driverName: value })
              }
              displayKey="name"
              valueKey="id"
              required
            />
            <AutoComplete
              label="Vehicle Number"
              options={vehicleOptions}
              value={dispatchForm.vehicleNumber}
              onChange={(value) =>
                setDispatchForm({ ...dispatchForm, vehicleNumber: value })
              }
              displayKey="name"
              valueKey="id"
              required
            />
          </div>

          {/* Location From */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-secondary-900 mb-3">
              Location From
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                label="Address"
                type="textarea"
                rows={2}
                value={dispatchForm.locationFromAddress}
                onChange={(e) =>
                  setDispatchForm({
                    ...dispatchForm,
                    locationFromAddress: e.target.value,
                  })
                }
                required
              />
              <FormField
                label="Phone"
                type="tel"
                value={dispatchForm.locationFromPhone}
                onChange={(e) =>
                  setDispatchForm({
                    ...dispatchForm,
                    locationFromPhone: e.target.value,
                  })
                }
              />
              <FormField
                label="GST (for GST Delivery Challan)"
                value={dispatchForm.locationFromGST}
                onChange={(e) =>
                  setDispatchForm({
                    ...dispatchForm,
                    locationFromGST: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* Location To */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-secondary-900 mb-3">
              Location To
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                label="Address"
                type="textarea"
                rows={2}
                value={dispatchForm.locationToAddress}
                onChange={(e) =>
                  setDispatchForm({
                    ...dispatchForm,
                    locationToAddress: e.target.value,
                  })
                }
                required
              />
              <FormField
                label="Phone"
                type="tel"
                value={dispatchForm.locationToPhone}
                onChange={(e) =>
                  setDispatchForm({
                    ...dispatchForm,
                    locationToPhone: e.target.value,
                  })
                }
              />
              <FormField
                label="GST (for GST Delivery Challan)"
                value={dispatchForm.locationToGST}
                onChange={(e) =>
                  setDispatchForm({
                    ...dispatchForm,
                    locationToGST: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-secondary-900">
                Dispatch Line Items
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowQRModal(true)}
                  className="px-3 py-1 text-sm bg-secondary-600 text-white rounded hover:bg-secondary-700 transition-colors"
                >
                  Scan QR
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

            {dispatchForm.lineItems.length > 0 ? (
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
                    {dispatchForm.lineItems.map((item, index) => (
                      <tr key={index} className="border-b border-secondary-100 hover:bg-secondary-50">
                        <td className="p-2">
                          {items.find((i) => i.id === item.itemCode)?.itemCode}
                        </td>
                        <td className="p-2">{item.qtyPerPack}</td>
                        <td className="p-2">{item.uom}</td>
                        <td className="p-2">{item.numberOfPacks}</td>
                        <td className="p-2 font-medium">{item.totalQty}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.grnStickerStuck === 'Yes'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.grnStickerStuck}
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
            label="GRN Sticker Stuck"
            type="radio"
            options={[
              { value: 'Yes', label: 'Yes' },
              { value: 'No', label: 'No' },
            ]}
            value={lineItemForm.grnStickerStuck}
            onChange={(e) =>
              setLineItemForm({ ...lineItemForm, grnStickerStuck: e.target.value })
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
            placeholder="Any special remarks or instructions..."
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
        title="Scan QR Code"
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

      {/* Requisition Closure Modal */}
      <Modal
        isOpen={showRequisitionClosureModal}
        onClose={() => setShowRequisitionClosureModal(false)}
        title="Dispatch Created"
        size="md"
        actions={[
          {
            label: 'Done',
            onClick: handleRequisitionClosure,
          },
        ]}
      >
        <div className="space-y-4">
          <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">
                Dispatch created successfully!
              </p>
              <p className="text-sm text-green-700 mt-1">
                DC Number: {dispatchForm.dcNumber}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-secondary-700">
              What would you like to do with the requisition?
            </label>
            <FormField
              type="radio"
              options={[
                {
                  value: 'keep-open',
                  label: 'Keep Open (allow partial dispatch)',
                },
                { value: 'close', label: 'Close (no more dispatch)' },
              ]}
              value={requisitionClosureForm.closeRequisition}
              onChange={(e) =>
                setRequisitionClosureForm({
                  closeRequisition: e.target.value,
                })
              }
            />
          </div>

          {requisitionClosureForm.closeRequisition === 'keep-open' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <p className="font-medium mb-1">Requisition Status</p>
              <p>
                Qty Requisitioned: 1000 | Qty Dispatched: 500 | Qty Pending: 500
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
