'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import api from '@/lib/api';
import { formatNumber, formatCurrency } from '@/lib/utils';

export default function FGStockPage() {
  const [stock, setStock] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStock();
  }, []);

  const loadStock = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetchFGStock();
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
    { key: 'warehouse', label: 'Warehouse' },
    { key: 'value', label: 'Value', render: (_, item) => formatCurrency(item.quantity * item.unitPrice) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">FG Stock</h1>
        <p className="text-secondary-600 mt-1">Finished goods inventory</p>
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
