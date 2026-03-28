'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Trash2, Eye, AlertCircle } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import AutoComplete from '@/components/AutoComplete';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { formatDate, getCurrentDate, parseQRData } from '@/lib/utils';

const QRScanner = dynamic(() => import('@/components/QRScanner'), { ssr: false });

export default function RequisitionPage() {
  // Main data state
  const [requisitions, setRequisitions] = useState([]);
  const [plants, setPlants] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [uomList, setUomList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [showRequisitionModal, setShowRequisitionModal] = useState(false);
  const [showLineItemModal, setShowLineItemModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [editingLineItem, setEditingLineItem] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [scanError, setScanError] = useState('');

  // Form data
  const [requisitionForm, setRequisitionForm] = useState({
    requisitionNumber: '',
    requestedBy: '',
    requestedDate: getCurrentDate(),
    productionDate: '',
    productionPlant: null,
    destinationWarehouse: null,
    lineItems: [],
    remarks: '',
  });

  const [lineItemForm, setLineItemForm] = useState({
    itemCode: null,
    itemName: '',
    uom: null,
    totalQtyRequired: '',
    remarks: '',
  });

  // Filter state
  const [filters, setFilters] = useState({
    plants: [],
    warehouses: [],
    requestedBy: '',
    dateFrom: '',
    dateTo: '',
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [
        requisitionData,
        plantData,
        warehouseData,
        itemData,
        uomData,
      ] = await Promise.all([
        api.getRequisitions().catch(() => []),
        api.fetchPlants().catch(() => []),
        api.fetchWarehouses().catch(() => []),
        api.fetchItems().catch(() => []),
        api.getUOMList().catch(() => []),
      ]);

      setRequisitions(requisitionData || []);
      setPlants(plantData || []);
      setWarehouses(warehouseData || []);
      setItems(itemData || []);
      setUomList(uomData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter requisitions based on filter criteria
  const filteredRequisitions = requisitions.filter((req) => {
    if (filters.plants.length > 0 && !filters.plants.includes(req.productionPlant)) {
      return false;
    }
    if (filters.warehouses.length > 0 && !filters.warehouses.includes(req.destinationWarehouse)) {
      return false;
    }
    if (filters.requestedBy && !req.requestedBy?.toLowerCase().includes(filters.requestedBy.toLowerCase())) {
      return false;
    }
    if (filters.dateFrom && new Date(req.requestedDate) < new Date(filters.dateFrom)) {
      return false;
    }
    if (filters.dateTo && new Date(req.requestedDate) > new Date(filters.dateTo)) {
      return false;
    }
    return true;
  });

  const handleStartRequisition = async () => {
    const reqNumber = `REQ-${Date.now().toString().slice(-6)}`;
    setRequisitionForm({
      requisitionNumber: reqNumber,
      requestedBy: '',
      requestedDate: getCurrentDate(),
      productionDate: '',
      productionPlant: null,
      destinationWarehouse: null,
      lineItems: [],
      remarks: '',
    });
    setSelectedRequisition(null);
    setShowRequisitionModal(true);
  };

  const handleAddLineItem = () => {
    setLineItemForm({
      itemCode: null,
      itemName: '',
      uom: null,
      totalQtyRequired: '',
      remarks: '',
    });
    setEditingLineItem(null);
    setShowLineItemModal(true);
  };

  const handleEditLineItem = (index) => {
    setLineItemForm(requisitionForm.lineItems[index]);
    setEditingLineItem(index);
    setShowLineItemModal(true);
  };

  const handleSaveLineItem = () => {
    if (!lineItemForm.itemCode || !lineItemForm.uom || !lineItemForm.totalQtyRequired) {
      alert('Please fill all required fields');
      return;
    }

    const lineItem = {
      ...lineItemForm,
    };

    if (editingLineItem !== null) {
      const updated = [...requisitionForm.lineItems];
      updated[editingLineItem] = lineItem;
      setRequisitionForm({ ...requisitionForm, lineItems: updated });
    } else {
      setRequisitionForm({
        ...requisitionForm,
        lineItems: [...requisitionForm.lineItems, lineItem],
      });
    }

    setShowLineItemModal(false);
    setLineItemForm({
      itemCode: null,
      itemName: '',
      uom: null,
      totalQtyRequired: '',
      remarks: '',
    });
  };

  const handleDeleteLineItem = (index) => {
    setRequisitionForm({
      ...requisitionForm,
      lineItems: requisitionForm.lineItems.filter((_, i) => i !== index),
    });
  };

  const handleSaveRequisition = async () => {
    if (
      !requisitionForm.requestedBy ||
      !requisitionForm.productionDate ||
      !requisitionForm.productionPlant ||
      !requisitionForm.destinationWarehouse ||
      requisitionForm.lineItems.length === 0
    ) {
      alert('Please fill all required fields and add at least one line item');
      return;
    }

    try {
      const requisitionData = {
        requisitionNumber: requisitionForm.requisitionNumber,
        requestedBy: requisitionForm.requestedBy,
        requestedDate: requisitionForm.requestedDate,
        productionDate: requisitionForm.productionDate,
        productionPlant: requisitionForm.productionPlant,
        destinationWarehouse: requisitionForm.destinationWarehouse,
        lineItems: requisitionForm.lineItems.map((item) => ({
          itemCode: items.find((i) => i.id === item.itemCode)?.itemCode,
          itemName: item.itemName,
          uom: item.uom,
          totalQtyRequired: item.totalQtyRequired,
          remarks: item.remarks,
        })),
        remarks: requisitionForm.remarks,
        status: 'open',
      };

      await api.createRequisition(requisitionData);
      setShowRequisitionModal(false);
      await loadData();
      alert('Requisition created successfully!');
    } catch (error) {
      console.error('Error saving requisition:', error);
      alert('Error saving requisition');
    }
  };

  const handleDispatch = (requisition) => {
    // Navigate to dispatch page with requisition context
    window.location.href = `/movement/dispatch?requisition=${requisition.requisitionNumber}`;
  };

  const handleQRScan = (qrData) => {
    try {
      const parsed = parseQRData(qrData);
      const item = items.find((i) => i.itemCode === parsed.itemCode);
      if (item) {
        setLineItemForm({
          ...lineItemForm,
          itemCode: item.id,
          itemName: item.itemName,
          uom: item.uom || null,
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

  const columns = [
    { key: 'requisitionNumber', label: 'Req. #' },
    { key: 'requestedBy', label: 'Requested By' },
    { key: 'requestedDate', label: 'Req. Date', render: (v) => formatDate(v) },
    { key: 'productionDate', label: 'Production Date', render: (v) => formatDate(v) },
    {
      key: 'productionPlant',
      label: 'Plant',
      render: (id) => {
        const p = plants.find((x) => x.id === id);
        return p ? p.plantName : '-';
      },
    },
    {
      key: 'destinationWarehouse',
      label: 'Warehouse',
      render: (id) => {
        const w = warehouses.find((x) => x.id === id);
        return w ? w.warehouseName : '-';
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      disableSort: true,
      render: (_, row) => (
        <div className="flex gap-2">
          {row.status === 'open' && (
            <button
              onClick={() => handleDispatch(row)}
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              title="Create Dispatch"
            >
              Dispatch
            </button>
          )}
          <button
            onClick={() => setSelectedRequisition(row)}
            className="p-1 hover:bg-secondary-100 rounded transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
        </div>
      ),
    },
  ];

  const plantOptions = plants.map((p) => ({
    id: p.id,
    name: p.plantName,
  }));

  const warehouseOptions = warehouses.map((w) => ({
    id: w.id,
    name: w.warehouseName,
  }));

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
            Material Requisition
          </h1>
          <p className="text-secondary-600 mt-1">
            Request materials for production plants
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFiltersModal(true)}
            className="px-4 py-2 bg-secondary-100 text-secondary-900 rounded-lg hover:bg-secondary-200 transition-colors font-medium"
          >
            Filters
          </button>
          <button
            onClick={handleStartRequisition}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <Plus size={20} />
            New Requisition
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.plants.length > 0 || filters.warehouses.length > 0 || filters.requestedBy || filters.dateFrom || filters.dateTo) && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <p className="font-medium mb-2">Active Filters:</p>
          <div className="flex flex-wrap gap-2">
            {filters.plants.length > 0 && (
              <span className="bg-blue-200 px-2 py-1 rounded">
                Plants: {filters.plants.length}
              </span>
            )}
            {filters.warehouses.length > 0 && (
              <span className="bg-blue-200 px-2 py-1 rounded">
                Warehouses: {filters.warehouses.length}
              </span>
            )}
            {filters.requestedBy && (
              <span className="bg-blue-200 px-2 py-1 rounded">
                Requested By: {filters.requestedBy}
              </span>
            )}
            {filters.dateFrom && (
              <span className="bg-blue-200 px-2 py-1 rounded">
                From: {formatDate(filters.dateFrom)}
              </span>
            )}
            {filters.dateTo && (
              <span className="bg-blue-200 px-2 py-1 rounded">
                To: {formatDate(filters.dateTo)}
              </span>
            )}
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredRequisitions}
        isLoading={isLoading}
        searchable={true}
        searchableFields={['requisitionNumber', 'requestedBy']}
        pageSize={10}
      />

      {/* Requisition Modal */}
      <Modal
        isOpen={showRequisitionModal}
        onClose={() => setShowRequisitionModal(false)}
        title="Create Material Requisition"
        size="4xl"
        actions={[
          {
            label: 'Cancel',
            variant: 'secondary',
            onClick: () => setShowRequisitionModal(false),
          },
          {
            label: 'Save Requisition',
            onClick: handleSaveRequisition,
          },
        ]}
      >
        <div className="space-y-6">
          {/* Document Header */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Requisition #"
              value={requisitionForm.requisitionNumber}
              disabled
              readOnly
            />
            <FormField
              label="Requested Date"
              type="date"
              value={requisitionForm.requestedDate}
              onChange={(e) =>
                setRequisitionForm({ ...requisitionForm, requestedDate: e.target.value })
              }
              required
            />
          </div>

          {/* Request Details */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Requested By"
              value={requisitionForm.requestedBy}
              onChange={(e) =>
                setRequisitionForm({ ...requisitionForm, requestedBy: e.target.value })
              }
              placeholder="Enter name or employee ID"
              required
            />
            <FormField
              label="Production Date (When items will be used)"
              type="date"
              value={requisitionForm.productionDate}
              onChange={(e) =>
                setRequisitionForm({ ...requisitionForm, productionDate: e.target.value })
              }
              required
            />
          </div>

          {/* Plant and Warehouse */}
          <div className="grid grid-cols-2 gap-4">
            <AutoComplete
              label="Production Plant"
              options={plantOptions}
              value={requisitionForm.productionPlant}
              onChange={(value) =>
                setRequisitionForm({ ...requisitionForm, productionPlant: value })
              }
              displayKey="name"
              valueKey="id"
              required
            />
            <AutoComplete
              label="Destination Warehouse"
              options={warehouseOptions}
              value={requisitionForm.destinationWarehouse}
              onChange={(value) =>
                setRequisitionForm({ ...requisitionForm, destinationWarehouse: value })
              }
              displayKey="name"
              valueKey="id"
              required
            />
          </div>

          {/* Remarks */}
          <FormField
            label="Remarks"
            type="textarea"
            rows={2}
            value={requisitionForm.remarks}
            onChange={(e) =>
              setRequisitionForm({ ...requisitionForm, remarks: e.target.value })
            }
            placeholder="Any special remarks or instructions..."
          />

          {/* Line Items */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-secondary-900">
                Line Items
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleAddLineItem}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                >
                  <Plus size={16} />
                  Add Item
                </button>
                <button
                  onClick={() => setShowQRModal(true)}
                  className="px-3 py-1 text-sm bg-secondary-600 text-white rounded hover:bg-secondary-700 transition-colors"
                >
                  Scan QR
                </button>
              </div>
            </div>

            {requisitionForm.lineItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-secondary-200 bg-secondary-50">
                      <th className="text-left p-2">Item Code/Name</th>
                      <th className="text-left p-2">UOM</th>
                      <th className="text-left p-2">Total Qty Required</th>
                      <th className="text-left p-2">Remarks</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requisitionForm.lineItems.map((item, index) => (
                      <tr key={index} className="border-b border-secondary-100 hover:bg-secondary-50">
                        <td className="p-2">
                          {items.find((i) => i.id === item.itemCode)?.itemCode} -{' '}
                          {item.itemName}
                        </td>
                        <td className="p-2">{item.uom}</td>
                        <td className="p-2 font-medium">{item.totalQtyRequired}</td>
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
            label="Total Qty Required"
            type="number"
            value={lineItemForm.totalQtyRequired}
            onChange={(e) =>
              setLineItemForm({ ...lineItemForm, totalQtyRequired: e.target.value })
            }
            step="0.01"
            required
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
        </div>
      </Modal>

      {/* Filters Modal */}
      <Modal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        title="Filter Requisitions"
        size="lg"
        actions={[
          {
            label: 'Reset Filters',
            variant: 'secondary',
            onClick: () => {
              setFilters({
                plants: [],
                warehouses: [],
                requestedBy: '',
                dateFrom: '',
                dateTo: '',
              });
            },
          },
          {
            label: 'Close',
            onClick: () => setShowFiltersModal(false),
          },
        ]}
      >
        <div className="space-y-4">
          <FormField
            label="Requested By"
            value={filters.requestedBy}
            onChange={(e) =>
              setFilters({ ...filters, requestedBy: e.target.value })
            }
            placeholder="Enter name or ID"
          />

          <FormField
            label="From Date"
            type="date"
            value={filters.dateFrom}
            onChange={(e) =>
              setFilters({ ...filters, dateFrom: e.target.value })
            }
          />

          <FormField
            label="To Date"
            type="date"
            value={filters.dateTo}
            onChange={(e) =>
              setFilters({ ...filters, dateTo: e.target.value })
            }
          />

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Plants
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {plants.map((plant) => (
                <div key={plant.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`plant-${plant.id}`}
                    checked={filters.plants.includes(plant.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilters({
                          ...filters,
                          plants: [...filters.plants, plant.id],
                        });
                      } else {
                        setFilters({
                          ...filters,
                          plants: filters.plants.filter((id) => id !== plant.id),
                        });
                      }
                    }}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                  <label
                    htmlFor={`plant-${plant.id}`}
                    className="ml-2 text-sm text-secondary-700 cursor-pointer"
                  >
                    {plant.plantName}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Warehouses
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {warehouses.map((warehouse) => (
                <div key={warehouse.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`warehouse-${warehouse.id}`}
                    checked={filters.warehouses.includes(warehouse.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilters({
                          ...filters,
                          warehouses: [...filters.warehouses, warehouse.id],
                        });
                      } else {
                        setFilters({
                          ...filters,
                          warehouses: filters.warehouses.filter((id) => id !== warehouse.id),
                        });
                      }
                    }}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                  <label
                    htmlFor={`warehouse-${warehouse.id}`}
                    className="ml-2 text-sm text-secondary-700 cursor-pointer"
                  >
                    {warehouse.warehouseName}
                  </label>
                </div>
              ))}
            </div>
          </div>
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

      {/* Details Modal */}
      {selectedRequisition && (
        <Modal
          isOpen={!!selectedRequisition}
          onClose={() => setSelectedRequisition(null)}
          title={`Requisition ${selectedRequisition.requisitionNumber}`}
          size="2xl"
          actions={[
            {
              label: 'Close',
              onClick: () => setSelectedRequisition(null),
            },
          ]}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-600">Requisition #</p>
                <p className="font-medium">{selectedRequisition.requisitionNumber}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Status</p>
                <p className="mt-1">
                  <StatusBadge status={selectedRequisition.status} />
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Requested By</p>
                <p className="font-medium">{selectedRequisition.requestedBy}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Requested Date</p>
                <p className="font-medium">{formatDate(selectedRequisition.requestedDate)}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Production Date</p>
                <p className="font-medium">{formatDate(selectedRequisition.productionDate)}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Plant</p>
                <p className="font-medium">
                  {plants.find((p) => p.id === selectedRequisition.productionPlant)?.plantName || '-'}
                </p>
              </div>
            </div>

            {selectedRequisition.remarks && (
              <div className="border-t pt-4">
                <p className="text-sm text-secondary-600 mb-2">Remarks</p>
                <p className="text-secondary-900">{selectedRequisition.remarks}</p>
              </div>
            )}

            {selectedRequisition.lineItems && selectedRequisition.lineItems.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-secondary-900 mb-3">Line Items</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-secondary-200 bg-secondary-50">
                        <th className="text-left p-2">Item</th>
                        <th className="text-left p-2">UOM</th>
                        <th className="text-left p-2">Qty</th>
                        <th className="text-left p-2">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequisition.lineItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-secondary-100">
                          <td className="p-2">{item.itemName}</td>
                          <td className="p-2">{item.uom}</td>
                          <td className="p-2">{item.totalQtyRequired}</td>
                          <td className="p-2 text-secondary-600">{item.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
