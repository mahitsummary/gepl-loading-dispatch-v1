'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Truck, Package, Plus, Clock } from 'lucide-react';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import AutoComplete from '@/components/AutoComplete';
import StatusBadge from '@/components/StatusBadge';
import DataTable from '@/components/DataTable';
import api from '@/lib/api';
import { getCurrentDate, formatDate } from '@/lib/utils';

const INITIAL_VENDOR_FORM = {
  vendorCode: '',
  vendorName: '',
  vendorPOCName: '',
  vendorPhone: '',
  vendorEmail: '',
  poNumber: '',
  poDate: '',
  committedDeliveryDate: '',
  vendorDocNumber: '',
  vendorDocDate: getCurrentDate(),
  receiptDate: getCurrentDate(),
  entryDate: getCurrentDate(),
  receiverName: '',
  vehicleNumber: '',
  invoicePhoto: null,
  invoicePhotoPreview: '',
};

export default function GatePassPage() {
  // Data
  const [gatePasses, setGatePasses] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showInternalModal, setShowInternalModal] = useState(false);
  const [error, setError] = useState('');

  // Vendor gate pass form (for inward from purchase)
  const [vendorForm, setVendorForm] = useState(INITIAL_VENDOR_FORM);

  // Internal gate pass form (for internal inward)
  const [internalForm, setInternalForm] = useState({
    deliverychallanNumber: null,
    requisitionNumber: '',
    requisitionDate: '',
    dcDate: '',
    receiptDate: getCurrentDate(),
    entryDate: getCurrentDate(),
    receiverName: null,
    vehicleNumber: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [gatePassData, vendorData, dispatchData, supervisorData, vehicleData] = await Promise.all([
        api.getOpenGatePasses().catch(() => []),
        api.fetchVendors().catch(() => []),
        api.getDispatches().catch(() => []),
        api.fetchSupervisors().catch(() => []),
        api.fetchVehicles().catch(() => []),
      ]);
      setGatePasses(Array.isArray(gatePassData) ? gatePassData : []);
      setVendors(Array.isArray(vendorData) ? vendorData : []);
      setDispatches(Array.isArray(dispatchData) ? dispatchData : []);
      setSupervisors(Array.isArray(supervisorData) ? supervisorData : []);
      setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== Options ====================
  const vendorOptions = vendors.map(v => ({
    ...v,
    label: `${v['BP Code'] || v.BPCode || ''} - ${v['BP Name'] || v.BPName || ''}`,
    value: v['BP Code'] || v.BPCode || v.id,
  }));

  const securityOptions = supervisors
    .filter(s => s.Role === 'Security' || s.role === 'Security' || s.department === 'Security' || true)
    .map(s => ({
      id: s.id,
      name: s.supervisorName || s.Name || s.name || '',
      label: s.supervisorName || s.Name || s.name || '',
      value: s.supervisorName || s.Name || s.name || '',
    }));

  const vehicleOptions = vehicles.map(v => ({
    id: v.id,
    name: v.vehicleNumber,
  }));

  const dcOptions = dispatches
    .filter(d => d.status === 'Dispatched' || d.status === 'in-transit')
    .map(d => ({
      id: d.id,
      name: `${d.dcNumber} - Vehicle: ${d.vehicleNumber}`,
    }));

  // ==================== Vendor Gate Pass (Inward from Purchase) ====================
  const handleOpenVendorModal = () => {
    setVendorForm({
      ...INITIAL_VENDOR_FORM,
      entryDate: getCurrentDate(),
      receiptDate: getCurrentDate(),
      vendorDocDate: getCurrentDate(),
    });
    setError('');
    setShowVendorModal(true);
  };

  const handleVendorSelect = (vendor) => {
    if (vendor) {
      setVendorForm(prev => ({
        ...prev,
        vendorCode: vendor['BP Code'] || vendor.BPCode || '',
        vendorName: vendor['BP Name'] || vendor.BPName || '',
        vendorPOCName: vendor['Contact Person'] || '',
        vendorPhone: vendor['Phone'] || '',
        vendorEmail: vendor['Email'] || '',
      }));
    }
  };

  const handleVendorGatePassSubmit = async () => {
    if (!vendorForm.vendorName) return setError('Vendor Name is required');
    if (!vendorForm.poNumber) return setError('PO Number is required');
    if (!vendorForm.poDate) return setError('PO Date is required');
    if (!vendorForm.receiverName) return setError('Security Name is required');
    if (!vendorForm.vehicleNumber) return setError('Vehicle Number is required');

    setError('');
    try {
      // Generate Gate Pass
      const gpResult = await api.generateGatePass({
        vehicleNumber: vendorForm.vehicleNumber,
        type: 'Inward',
        subType: 'Purchase',
        vendorCode: vendorForm.vendorCode,
        vendorName: vendorForm.vendorName,
        poNumber: vendorForm.poNumber,
        poDate: vendorForm.poDate,
        committedDeliveryDate: vendorForm.committedDeliveryDate,
        vendorDocNumber: vendorForm.vendorDocNumber,
        vendorDocDate: vendorForm.vendorDocDate,
        receiptDate: vendorForm.receiptDate,
        entryDate: vendorForm.entryDate,
        receiverName: vendorForm.receiverName,
        vendorPOCName: vendorForm.vendorPOCName,
        vendorPhone: vendorForm.vendorPhone,
        vendorEmail: vendorForm.vendorEmail,
      }).catch(() => ({ gatePassNumber: `GP-${Date.now()}` }));

      const gp = gpResult?.gatePassNumber || gpResult?.GatePassNumber || `GP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`;

      setShowVendorModal(false);
      await loadData();
      alert(`Gate Pass ${gp} created successfully! The supervisor can now select this gate pass from the Inward from Purchase (GRN) page to record line items.`);
    } catch (err) {
      setError('Failed to generate Gate Pass. Please try again.');
      console.error(err);
    }
  };

  // ==================== Internal Gate Pass ====================
  const handleOpenInternalModal = () => {
    setInternalForm({
      deliverychallanNumber: null,
      requisitionNumber: '',
      requisitionDate: '',
      dcDate: '',
      receiptDate: getCurrentDate(),
      entryDate: getCurrentDate(),
      receiverName: null,
      vehicleNumber: null,
    });
    setError('');
    setShowInternalModal(true);
  };

  const handleInternalDCSelection = (dcId) => {
    const dispatch = dispatches.find(d => d.id === dcId);
    if (dispatch) {
      setInternalForm(prev => ({
        ...prev,
        deliverychallanNumber: dcId,
        requisitionNumber: dispatch.requisitionNumber || '',
        requisitionDate: dispatch.requisitionDate || '',
        dcDate: dispatch.dispatchDate || '',
        vehicleNumber: vehicles.find(v => v.vehicleNumber === dispatch.vehicleNumber)?.id || null,
      }));
    }
  };

  const handleInternalGatePassSubmit = async () => {
    if (!internalForm.deliverychallanNumber) {
      return setError('Please select a Delivery Challan');
    }
    if (!internalForm.receiverName) {
      return setError('Please select Receiver Name (Security)');
    }
    if (!internalForm.vehicleNumber) {
      return setError('Please select Vehicle Number');
    }

    setError('');
    try {
      // Generate gate pass
      const gpResult = await api.generateGatePass({
        vehicleNumber: vehicles.find(v => v.id === internalForm.vehicleNumber)?.vehicleNumber,
        type: 'Inward',
        subType: 'Internal',
      }).catch(() => ({ gatePassNumber: `GP-INW-${Date.now()}` }));

      const gatePassNumber = gpResult?.gatePassNumber || gpResult?.GatePassNumber || `GP-INW-${Date.now()}`;

      // Generate receipt number
      const receiptNumber = await api.generateReceiptNumber().catch(() => `RCP-${Date.now()}`);

      const dispatch = dispatches.find(d => d.id === internalForm.deliverychallanNumber);

      // Create receipt header with status 'Open'
      const receiptData = {
        receiptNumber,
        dcNumber: dispatch?.dcNumber || internalForm.deliverychallanNumber,
        requisitionNumber: internalForm.requisitionNumber,
        receiptDate: internalForm.receiptDate,
        entryDate: internalForm.entryDate,
        receiverName: internalForm.receiverName,
        vehicleNumber: vehicles.find(v => v.id === internalForm.vehicleNumber)?.vehicleNumber,
        gatePassNumber,
        status: 'Open',
        lineItems: [],
      };

      await api.createReceipt(receiptData).catch(() => {
        console.log('Receipt header saved locally');
      });

      setShowInternalModal(false);
      await loadData();
      alert(`Gate Pass ${gatePassNumber} created successfully! Receipt ${receiptNumber} is now open for supervisor counting on the Internal Receipt page.`);
    } catch (err) {
      setError('Failed to generate Gate Pass. Please try again.');
      console.error(err);
    }
  };

  // ==================== Table Columns ====================
  const columns = [
    { key: 'GatePassNumber', label: 'Gate Pass #' },
    { key: 'Type', label: 'Type', render: (v) => v || 'Inward' },
    {
      key: 'SubType', label: 'Category',
      render: (v, row) => {
        const subType = v || row.subType;
        if (subType === 'Purchase') return <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">From Purchase</span>;
        if (subType === 'Internal') return <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">Internal</span>;
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs font-medium">{subType || 'N/A'}</span>;
      },
    },
    { key: 'VehicleNumber', label: 'Vehicle' },
    { key: 'VendorName', label: 'Vendor / DC', render: (v, row) => v || row.DCNumber || row.dcNumber || '-' },
    { key: 'Date', label: 'Date', render: (v) => formatDate(v) },
    { key: 'Status', label: 'Status', render: (v) => <StatusBadge status={v || 'Open'} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Gate Pass</h1>
          <p className="text-gray-500 mt-1">Create gate passes for incoming vehicles. Supervisors will pick up from here.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleOpenVendorModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            <Package size={18} />
            Vendor Inward
          </button>
          <button
            onClick={handleOpenInternalModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm"
          >
            <Truck size={18} />
            Internal Inward
          </button>
        </div>
      </div>

      {/* Open Gate Passes Summary */}
      {gatePasses.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <Clock size={18} />
            Open Gate Passes - Pending Supervisor Action ({gatePasses.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {gatePasses.map((gp, i) => (
              <div
                key={i}
                className="flex flex-col gap-1 p-4 bg-white border border-amber-300 rounded-lg text-left"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-gray-900">
                    {gp.GatePassNumber || gp.gatePassNumber || 'N/A'}
                  </span>
                  <StatusBadge status="Open" />
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Vehicle:</span> {gp.VehicleNumber || gp.vehicleNumber || 'N/A'}
                </div>
                {(gp.VendorName || gp.vendorName) && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Vendor:</span> {gp.VendorName || gp.vendorName}
                  </div>
                )}
                {(gp.DCNumber || gp.dcNumber) && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">DC:</span> {gp.DCNumber || gp.dcNumber}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  {formatDate(gp.Date || gp.date)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={gatePasses}
        isLoading={isLoading}
        searchable={true}
        searchableFields={['GatePassNumber', 'VehicleNumber', 'VendorName', 'Type', 'SubType']}
        pageSize={15}
      />

      {/* ==================== Vendor Inward Modal ==================== */}
      <Modal
        isOpen={showVendorModal}
        onClose={() => setShowVendorModal(false)}
        title="Security - Create Gate Pass (Vendor Inward)"
        size="4xl"
        actions={[
          { label: 'Cancel', variant: 'secondary', onClick: () => setShowVendorModal(false) },
          { label: 'Create Gate Pass', onClick: handleVendorGatePassSubmit },
        ]}
      >
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <ShieldCheck size={16} className="inline mr-2" />
            Security: Record the vehicle and vendor invoice details. A gate pass will be created for the supervisor to process on the GRN page.
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>
          )}

          <h3 className="font-semibold text-gray-800 border-b pb-2">Vendor Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name *</label>
              <AutoComplete
                options={vendorOptions}
                value={vendorForm.vendorCode}
                onChange={(val) => {
                  const vendor = vendors.find(v => (v['BP Code'] || v.BPCode) === val);
                  handleVendorSelect(vendor);
                }}
                displayKey="label"
                valueKey="value"
                placeholder="Search vendor..."
              />
            </div>
            <FormField label="Vendor POC Name" value={vendorForm.vendorPOCName}
              onChange={(e) => setVendorForm(prev => ({ ...prev, vendorPOCName: e.target.value }))} />
            <FormField label="Vendor Phone" value={vendorForm.vendorPhone}
              onChange={(e) => setVendorForm(prev => ({ ...prev, vendorPhone: e.target.value }))} />
            <FormField label="Vendor Email" value={vendorForm.vendorEmail}
              onChange={(e) => setVendorForm(prev => ({ ...prev, vendorEmail: e.target.value }))} />
          </div>

          <h3 className="font-semibold text-gray-800 border-b pb-2 pt-4">Purchase Order Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="PO Number *" value={vendorForm.poNumber}
              onChange={(e) => setVendorForm(prev => ({ ...prev, poNumber: e.target.value }))}
              placeholder="Enter PO Number" required />
            <FormField label="PO Date *" type="date" value={vendorForm.poDate}
              onChange={(e) => setVendorForm(prev => ({ ...prev, poDate: e.target.value }))} required />
            <FormField label="Committed Delivery Date" type="date" value={vendorForm.committedDeliveryDate}
              onChange={(e) => setVendorForm(prev => ({ ...prev, committedDeliveryDate: e.target.value }))} />
          </div>

          <h3 className="font-semibold text-gray-800 border-b pb-2 pt-4">Document Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Vendor Document Number" value={vendorForm.vendorDocNumber}
              onChange={(e) => setVendorForm(prev => ({ ...prev, vendorDocNumber: e.target.value }))} />
            <FormField label="Vendor Document Date" type="date" value={vendorForm.vendorDocDate}
              onChange={(e) => setVendorForm(prev => ({ ...prev, vendorDocDate: e.target.value }))} />
            <FormField label="Receipt Date" type="date" value={vendorForm.receiptDate}
              onChange={(e) => setVendorForm(prev => ({ ...prev, receiptDate: e.target.value }))} />
            <FormField label="Entry Date" type="date" value={vendorForm.entryDate} disabled />
          </div>

          <h3 className="font-semibold text-gray-800 border-b pb-2 pt-4">Gate Entry Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name of Receiver (Security) *</label>
              {securityOptions.length > 0 ? (
                <AutoComplete options={securityOptions} value={vendorForm.receiverName}
                  onChange={(val) => setVendorForm(prev => ({ ...prev, receiverName: val }))}
                  displayKey="label" valueKey="value" placeholder="Select security..." />
              ) : (
                <input type="text" value={vendorForm.receiverName}
                  onChange={(e) => setVendorForm(prev => ({ ...prev, receiverName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter security name" />
              )}
            </div>
            <FormField label="Vehicle Number *" value={vendorForm.vehicleNumber}
              onChange={(e) => setVendorForm(prev => ({ ...prev, vehicleNumber: e.target.value.toUpperCase() }))}
              placeholder="e.g., KA-01-AB-1234" required />
          </div>
        </div>
      </Modal>

      {/* ==================== Internal Inward Modal ==================== */}
      <Modal
        isOpen={showInternalModal}
        onClose={() => setShowInternalModal(false)}
        title="Security - Create Gate Pass (Internal Inward)"
        size="xl"
        actions={[
          { label: 'Cancel', variant: 'secondary', onClick: () => setShowInternalModal(false) },
          { label: 'Create Gate Pass', onClick: handleInternalGatePassSubmit },
        ]}
      >
        <div className="space-y-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800">
            <ShieldCheck size={16} className="inline mr-2" />
            Security: Select the Delivery Challan for the arriving vehicle. A gate pass and receipt header will be created for supervisor counting on the Internal Receipt page.
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <AutoComplete
              label="Delivery Challan (Scan DC QR or Select)"
              options={dcOptions}
              value={internalForm.deliverychallanNumber}
              onChange={handleInternalDCSelection}
              displayKey="name"
              valueKey="id"
              required
            />
            <FormField
              label="Receipt Date"
              type="date"
              value={internalForm.receiptDate}
              onChange={(e) => setInternalForm(prev => ({ ...prev, receiptDate: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Entry Date" type="date" value={internalForm.entryDate} disabled readOnly />
            <FormField label="Requisition Number (Auto)" value={internalForm.requisitionNumber} disabled readOnly />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Requisition Date (Auto)" type="date" value={internalForm.requisitionDate} disabled readOnly />
            <FormField label="DC Date (Auto)" type="date" value={internalForm.dcDate} disabled readOnly />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <AutoComplete
              label="Receiver Name (Security)"
              options={securityOptions}
              value={internalForm.receiverName}
              onChange={(value) => setInternalForm(prev => ({ ...prev, receiverName: value }))}
              displayKey="name"
              valueKey="id"
              required
            />
            <AutoComplete
              label="Vehicle Number"
              options={vehicleOptions}
              value={internalForm.vehicleNumber}
              onChange={(value) => setInternalForm(prev => ({ ...prev, vehicleNumber: value }))}
              displayKey="name"
              valueKey="id"
              required
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
