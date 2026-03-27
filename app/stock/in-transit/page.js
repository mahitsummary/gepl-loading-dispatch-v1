'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { MapPin, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function GoodsInTransitPage() {
  const [goodsInTransit, setGoodsInTransit] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalPackages: 0,
    inTransit: 0,
    delayed: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetchGoodsInTransit();
      setGoodsInTransit(data);

      const inTransit = data.filter(
        (d) => d.status === 'in_transit'
      ).length;
      const delayed = data.filter((d) => d.isDelayed).length;

      setSummary({
        totalPackages: data.length,
        inTransit,
        delayed,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { key: 'dispatchNumber', label: 'Dispatch #' },
    { key: 'itemName', label: 'Item' },
    { key: 'quantity', label: 'Quantity' },
    {
      key: 'sourceWarehouse',
      label: 'From',
      render: (v) => v || '-',
    },
    {
      key: 'destinationPlant',
      label: 'To',
      render: (v) => v || '-',
    },
    {
      key: 'driverName',
      label: 'Driver',
      render: (v) => v || '-',
    },
    {
      key: 'vehicleNumber',
      label: 'Vehicle',
      render: (v) => v || '-',
    },
    {
      key: 'dispatchDate',
      label: 'Dispatched',
      render: (v) => formatDate(v),
    },
    {
      key: 'expectedDeliveryDate',
      label: 'Expected Delivery',
      render: (v) => formatDate(v),
    },
    {
      key: 'isDelayed',
      label: 'Status',
      render: (isDelayed, item) => (
        <StatusBadge
          status={isDelayed ? 'delayed' : 'in_transit'}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            Goods in Transit
          </h1>
          <p className="text-secondary-600 mt-1">
            Track materials currently being transported
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <MapPin className="text-blue-600" size={24} />
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Packages</p>
              <p className="text-2xl font-bold text-blue-900">
                {summary.totalPackages}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-3">
            <Calendar className="text-purple-600" size={24} />
            <div>
              <p className="text-sm text-purple-600 font-medium">In Transit</p>
              <p className="text-2xl font-bold text-purple-900">
                {summary.inTransit}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center gap-3">
            <Calendar className="text-red-600" size={24} />
            <div>
              <p className="text-sm text-red-600 font-medium">Delayed</p>
              <p className="text-2xl font-bold text-red-900">
                {summary.delayed}
              </p>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={goodsInTransit}
        isLoading={isLoading}
        searchable={true}
        searchableFields={['dispatchNumber', 'itemName', 'driverName']}
        pageSize={15}
      />
    </div>
  );
}
