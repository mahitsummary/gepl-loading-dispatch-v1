'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { formatNumber, formatDate } from '@/lib/utils';

export default function RejectedStockPage() {
  const [stock, setStock] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStock();
  }, []);

  const loadStock = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetchRejectedStock();
      setStock(data);
    } catch (error) {
      console.error('Error loading stock:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { key: 'itemCode', label: 'Item Code' },
    { key: 'itemName', label: 'Item Name' },
    { key: 'quantity', label: 'Quantity', render: (v) => formatNumber(v) },
    { key: 'rejectionReason', label: 'Reason' },
    { key: 'rejectionDate', label: 'Date', render: (v) => formatDate(v) },
    { key: 'status', label: 'Status', render: (status) => <StatusBadge status={status} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">Rejected Stock</h1>
        <p className="text-secondary-600 mt-1">Items under quality review</p>
      </div>

      <DataTable
        columns={columns}
        data={stock}
        isLoading={isLoading}
        searchable={true}
        searchableFields={['itemCode', 'itemName']}
        pageSize={15}
      />
    </div>
  );
}
