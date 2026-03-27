'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import DataTable from '@/components/DataTable';
import api from '@/lib/api';
import { formatNumber, formatCurrency } from '@/lib/utils';

export default function StockOverview() {
  const [stock, setStock] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
  });

  useEffect(() => {
    loadStock();
  }, []);

  const loadStock = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetchStock();
      setStock(data);

      const totalValue = data.reduce(
        (sum, item) => sum + (item.quantity * item.unitPrice || 0),
        0
      );
      const lowStockItems = data.filter((item) => item.quantity < item.reorderLevel).length;

      setSummary({
        totalItems: data.length,
        totalValue,
        lowStockItems,
      });
    } catch (error) {
      console.error('Error loading stock:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { key: 'itemCode', label: 'Item Code' },
    { key: 'itemName', label: 'Item Name' },
    { key: 'warehouse', label: 'Warehouse' },
    { key: 'quantity', label: 'Quantity', render: (v) => formatNumber(v) },
    { key: 'reorderLevel', label: 'Reorder Level' },
    {
      key: 'status',
      label: 'Status',
      render: (_, item) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            item.quantity < item.reorderLevel
              ? 'bg-red-100 text-red-800'
              : item.quantity < item.reorderLevel * 1.5
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
          }`}
        >
          {item.quantity < item.reorderLevel
            ? 'Low Stock'
            : item.quantity < item.reorderLevel * 1.5
              ? 'Running Low'
              : 'Good'}
        </span>
      ),
    },
    {
      key: 'value',
      label: 'Value',
      render: (_, item) =>
        formatCurrency(item.quantity * item.unitPrice),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            Stock Overview
          </h1>
          <p className="text-secondary-600 mt-1">
            Real-time inventory status across all warehouses
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-lg text-white">
              <BarChart3 size={24} />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Items</p>
              <p className="text-2xl font-bold text-blue-900">
                {summary.totalItems}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-600 rounded-lg text-white">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">Total Value</p>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(summary.totalValue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-600 rounded-lg text-white">
              <BarChart3 size={24} />
            </div>
            <div>
              <p className="text-sm text-red-600 font-medium">
                Low Stock Items
              </p>
              <p className="text-2xl font-bold text-red-900">
                {summary.lowStockItems}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <DataTable
        columns={columns}
        data={stock}
        isLoading={isLoading}
        searchable={true}
        searchableFields={['itemCode', 'itemName', 'warehouse']}
        pageSize={15}
      />
    </div>
  );
}
