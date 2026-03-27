'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import api from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';

export default function ProductionRecoPage() {
  const [recoData, setRecoData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetchProductionReco();
      setRecoData(data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { key: 'productionNumber', label: 'Production #' },
    { key: 'itemName', label: 'Item' },
    { key: 'inputQuantity', label: 'Input Qty', render: (v) => formatNumber(v) },
    { key: 'outputQuantity', label: 'Output Qty', render: (v) => formatNumber(v) },
    {
      key: 'efficiency',
      label: 'Efficiency %',
      render: (_, item) => {
        const eff = (item.outputQuantity / item.inputQuantity * 100).toFixed(2);
        return eff;
      },
    },
    { key: 'productionDate', label: 'Date', render: (v) => formatDate(v) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">
          Production Reconciliation
        </h1>
        <p className="text-secondary-600 mt-1">
          Match production inputs with outputs
        </p>
      </div>

      <DataTable
        columns={columns}
        data={recoData}
        isLoading={isLoading}
        searchable={true}
        searchableFields={['productionNumber', 'itemName']}
        pageSize={15}
      />
    </div>
  );
}
