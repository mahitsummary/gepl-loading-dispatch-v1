'use client';

import { useState, useEffect } from 'react';
import { Plus, Eye } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField from '@/components/FormField';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function BatchMaster() {
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState(null);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetchBatches();
      setBatches(data);
    } catch (error) {
      console.error('Error loading batches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewBatch = (batch) => {
    setSelectedBatch(batch);
  };

  const columns = [
    { key: 'batchId', label: 'Batch ID' },
    { key: 'itemCode', label: 'Item Code' },
    { key: 'itemName', label: 'Item Name' },
    { key: 'dateOfEntry', label: 'Date of Entry', render: (v) => formatDate(v) },
    { key: 'dateOfReceipt', label: 'Date of Receipt', render: (v) => formatDate(v) },
    { key: 'placeOfOrigin', label: 'Place of Origin' },
    { key: 'warehouse', label: 'Warehouse' },
    { key: 'grnNumber', label: 'GRN Number' },
    { key: 'quantity', label: 'Qty' },
    {
      key: 'status',
      label: 'Status',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => handleViewBatch(row)}
          className="text-primary-600 hover:text-primary-800 transition-colors"
          title="View Details"
        >
          <Eye size={18} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            Batch Master
          </h1>
          <p className="text-secondary-600 mt-1">
            View batch records auto-generated from GRN line items
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={batches}
        isLoading={isLoading}
        searchable={true}
        searchableFields={['batchId', 'itemCode', 'itemName', 'grnNumber']}
        pageSize={10}
      />

      <Modal
        isOpen={!!selectedBatch}
        onClose={() => setSelectedBatch(null)}
        title="Batch Details"
        size="lg"
        actions={[
          { label: 'Close', variant: 'secondary', onClick: () => setSelectedBatch(null) },
        ]}
      >
        {selectedBatch && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-500">Batch ID</label>
              <p className="mt-1 text-secondary-900 font-semibold">{selectedBatch.batchId}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-500">GRN Number</label>
              <p className="mt-1 text-secondary-900 font-semibold">{selectedBatch.grnNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-500">Item Code</label>
              <p className="mt-1 text-secondary-900">{selectedBatch.itemCode}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-500">Item Name</label>
              <p className="mt-1 text-secondary-900">{selectedBatch.itemName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-500">Date of Entry</label>
              <p className="mt-1 text-secondary-900">{formatDate(selectedBatch.dateOfEntry)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-500">Date of Receipt</label>
              <p className="mt-1 text-secondary-900">{formatDate(selectedBatch.dateOfReceipt)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-500">Place of Origin</label>
              <p className="mt-1 text-secondary-900">{selectedBatch.placeOfOrigin || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-500">Warehouse</label>
              <p className="mt-1 text-secondary-900">{selectedBatch.warehouse}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-500">Quantity</label>
              <p className="mt-1 text-secondary-900">{selectedBatch.quantity}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-500">UOM</label>
              <p className="mt-1 text-secondary-900">{selectedBatch.uom || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-500">Status</label>
              <div className="mt-1">
                <StatusBadge status={selectedBatch.status} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-500">Vendor</label>
              <p className="mt-1 text-secondary-900">{selectedBatch.vendor || '-'}</p>
            </div>
            {selectedBatch.remarks && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-secondary-500">Remarks</label>
                <p className="mt-1 text-secondary-900">{selectedBatch.remarks}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
