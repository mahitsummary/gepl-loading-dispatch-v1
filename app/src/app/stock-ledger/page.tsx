'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import QRScanner from '@/components/QRScanner';
import { ParsedQRCode } from '@/lib/qrParser';

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface StockSummaryItem {
  id: string;
  item_code: string;
  item_name: string;
  warehouse_id: string;
  warehouse_name: string;
  stock_type: string;
  opening_qty: number;
  in_qty: number;
  out_qty: number;
  closing_qty: number;
}

interface StockLedgerEntry {
  id: string;
  date: string;
  item_code: string;
  item_name: string;
  warehouse_id: string;
  warehouse_name: string;
  stock_type: string;
  movement_type: string;
  opening_qty: number;
  in_qty: number;
  out_qty: number;
  closing_qty: number;
  reference_doc: string;
  remarks: string;
}

interface WarehouseSummary {
  warehouse_id: string;
  warehouse_name: string;
  total_items: number;
  total_qty: number;
  expanded: boolean;
  items: StockSummaryItem[];
}

export default function StockLedgerPage() {
  const { user, userWarehouseId } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [activeTab, setActiveTab] = useState<'summary' | 'ledger' | 'warehouse'>('summary');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Summary Tab State
  const [summaryData, setSummaryData] = useState<StockSummaryItem[]>([]);
  const [warehouseFilter, setWarehouseFilter] = useState(userWarehouseId || 'all');
  const [itemSearch, setItemSearch] = useState('');
  const [stockTypeFilter, setStockTypeFilter] = useState('all');

  // Ledger Tab State
  const [ledgerData, setLedgerData] = useState<StockLedgerEntry[]>([]);
  const [ledgerDateRange, setLedgerDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [ledgerWarehouseFilter, setLedgerWarehouseFilter] = useState(userWarehouseId || 'all');
  const [ledgerItemSearch, setLedgerItemSearch] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('all');

  // Warehouse Summary State
  const [warehouseSummaries, setWarehouseSummaries] = useState<WarehouseSummary[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'summary') {
      fetchStockSummary();
    } else if (activeTab === 'ledger') {
      fetchStockLedger();
    } else if (activeTab === 'warehouse') {
      fetchWarehouseSummary();
    }
  }, [
    activeTab,
    warehouseFilter,
    itemSearch,
    stockTypeFilter,
    ledgerDateRange,
    ledgerWarehouseFilter,
    ledgerItemSearch,
    movementTypeFilter,
  ]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('warehouses')
        .select('id, name, code')
        .order('name');

      if (err) throw err;
      setWarehouses(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStockSummary = async () => {
    try {
      let query = supabase.from('stock_summary').select(
        `
        id,
        items (code, name),
        warehouse_id,
        warehouses (name),
        stock_type,
        opening_qty,
        in_qty,
        out_qty,
        closing_qty
      `
      );

      const filterWarehouse = userWarehouseId || (warehouseFilter !== 'all' ? warehouseFilter : null);
      if (filterWarehouse) {
        query = query.eq('warehouse_id', filterWarehouse);
      }

      if (stockTypeFilter !== 'all') {
        query = query.eq('stock_type', stockTypeFilter);
      }

      const { data, error: err } = await query.order('items.code');

      if (err) throw err;

      const formatted = (data || [])
        .map((item: any) => ({
          id: item.id,
          item_code: item.items?.code || 'N/A',
          item_name: item.items?.name || 'N/A',
          warehouse_id: item.warehouse_id,
          warehouse_name: item.warehouses?.name || 'N/A',
          stock_type: item.stock_type,
          opening_qty: item.opening_qty || 0,
          in_qty: item.in_qty || 0,
          out_qty: item.out_qty || 0,
          closing_qty: item.closing_qty || 0,
        }))
        .filter((item) => {
          const itemMatch =
            itemSearch === '' ||
            item.item_code.toLowerCase().includes(itemSearch.toLowerCase()) ||
            item.item_name.toLowerCase().includes(itemSearch.toLowerCase());
          return itemMatch;
        });

      setSummaryData(formatted);
    } catch (err) {
      console.error('Error fetching stock summary:', err);
    }
  };

  const fetchStockLedger = async () => {
    try {
      let query = supabase.from('stock_ledger').select(
        `
        id,
        date,
        items (code, name),
        warehouse_id,
        warehouses (name),
        stock_type,
        movement_type,
        opening_qty,
        in_qty,
        out_qty,
        closing_qty,
        reference_doc,
        remarks
      `
      );

      const filterWarehouse = userWarehouseId || (ledgerWarehouseFilter !== 'all' ? ledgerWarehouseFilter : null);
      if (filterWarehouse) {
        query = query.eq('warehouse_id', filterWarehouse);
      }

      if (ledgerDateRange.from) {
        query = query.gte('date', ledgerDateRange.from);
      }

      if (ledgerDateRange.to) {
        query = query.lte('date', ledgerDateRange.to);
      }

      if (movementTypeFilter !== 'all') {
        query = query.eq('movement_type', movementTypeFilter);
      }

      const { data, error: err } = await query.order('date', { ascending: false }).limit(500);

      if (err) throw err;

      const formatted = (data || [])
        .map((item: any) => ({
          id: item.id,
          date: item.date,
          item_code: item.items?.code || 'N/A',
          item_name: item.items?.name || 'N/A',
          warehouse_id: item.warehouse_id,
          warehouse_name: item.warehouses?.name || 'N/A',
          stock_type: item.stock_type,
          movement_type: item.movement_type,
          opening_qty: item.opening_qty || 0,
          in_qty: item.in_qty || 0,
          out_qty: item.out_qty || 0,
          closing_qty: item.closing_qty || 0,
          reference_doc: item.reference_doc || 'N/A',
          remarks: item.remarks || '',
        }))
        .filter((item) => {
          const itemMatch =
            ledgerItemSearch === '' ||
            item.item_code.toLowerCase().includes(ledgerItemSearch.toLowerCase()) ||
            item.item_name.toLowerCase().includes(ledgerItemSearch.toLowerCase());
          return itemMatch;
        });

      setLedgerData(formatted);
    } catch (err) {
      console.error('Error fetching stock ledger:', err);
    }
  };

  const fetchWarehouseSummary = async () => {
    try {
      const { data, error: err } = await supabase
        .from('stock_summary')
        .select(
          `
          warehouse_id,
          warehouses (name),
          items (code, name),
          stock_type,
          closing_qty
        `
        )
        .order('warehouses.name');

      if (err) throw err;

      const grouped: { [key: string]: WarehouseSummary } = {};

      (data || []).forEach((item: any) => {
        const whId = item.warehouse_id;
        if (!grouped[whId]) {
          grouped[whId] = {
            warehouse_id: whId,
            warehouse_name: item.warehouses?.name || 'N/A',
            total_items: 0,
            total_qty: 0,
            expanded: false,
            items: [],
          };
        }

        grouped[whId].items.push({
          id: crypto.randomUUID(),
          item_code: item.items?.code || 'N/A',
          item_name: item.items?.name || 'N/A',
          warehouse_id: whId,
          warehouse_name: item.warehouses?.name || 'N/A',
          stock_type: item.stock_type,
          opening_qty: 0,
          in_qty: 0,
          out_qty: 0,
          closing_qty: item.closing_qty || 0,
        });

        grouped[whId].total_items += 1;
        grouped[whId].total_qty += item.closing_qty || 0;
      });

      setWarehouseSummaries(Object.values(grouped));
    } catch (err) {
      console.error('Error fetching warehouse summary:', err);
    }
  };

  const toggleWarehouseExpand = (warehouseId: string) => {
    setWarehouseSummaries((prev) =>
      prev.map((wh) =>
        wh.warehouse_id === warehouseId ? { ...wh, expanded: !wh.expanded } : wh
      )
    );
  };

  const calculateSummaryTotals = () => {
    return {
      opening: summaryData.reduce((sum, item) => sum + item.opening_qty, 0),
      in: summaryData.reduce((sum, item) => sum + item.in_qty, 0),
      out: summaryData.reduce((sum, item) => sum + item.out_qty, 0),
      closing: summaryData.reduce((sum, item) => sum + item.closing_qty, 0),
    };
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const summaryTotals = calculateSummaryTotals();

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Stock Ledger</h1>
          <p className="text-gray-600 mt-2">View and analyze stock movements</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeTab === 'summary'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Stock Summary
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeTab === 'ledger'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Stock Ledger
            </button>
            <button
              onClick={() => setActiveTab('warehouse')}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeTab === 'warehouse'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Warehouse-wise Summary
            </button>
          </div>
        </div>

        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {!userWarehouseId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Warehouse
                    </label>
                    <select
                      value={warehouseFilter}
                      onChange={(e) => setWarehouseFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Warehouses</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Search
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Item code or name"
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <QRScanner
                      onScan={(parsed: ParsedQRCode) => {
                        if (parsed.itemCode) setItemSearch(parsed.itemCode);
                      }}
                      buttonLabel="QR"
                      buttonSize="sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Type
                  </label>
                  <select
                    value={stockTypeFilter}
                    onChange={(e) => setStockTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="RM">Raw Materials</option>
                    <option value="SFG">Semi-Finished Goods</option>
                    <option value="FG">Finished Goods</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="px-4 py-2 text-left text-sm font-semibold">Item Code</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Item Name</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Warehouse</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Type</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold">Opening</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold">In</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold">Out</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold">Closing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium">{item.item_code}</td>
                        <td className="px-4 py-2 text-sm">{item.item_name}</td>
                        <td className="px-4 py-2 text-sm">{item.warehouse_name}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                            {item.stock_type}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-right">
                          {item.opening_qty.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-green-600">
                          {item.in_qty.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-red-600">
                          {item.out_qty.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-medium">
                          {item.closing_qty.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 border-t font-semibold">
                      <td colSpan={4} className="px-4 py-2 text-sm">
                        TOTAL
                      </td>
                      <td className="px-4 py-2 text-sm text-right">
                        {summaryTotals.opening.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-green-600">
                        {summaryTotals.in.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-red-600">
                        {summaryTotals.out.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-sm text-right">
                        {summaryTotals.closing.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={ledgerDateRange.from}
                    onChange={(e) =>
                      setLedgerDateRange({ ...ledgerDateRange, from: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={ledgerDateRange.to}
                    onChange={(e) =>
                      setLedgerDateRange({ ...ledgerDateRange, to: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {!userWarehouseId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Warehouse
                    </label>
                    <select
                      value={ledgerWarehouseFilter}
                      onChange={(e) => setLedgerWarehouseFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Warehouses</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Movement Type
                  </label>
                  <select
                    value={movementTypeFilter}
                    onChange={(e) => setMovementTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="in">Inbound</option>
                    <option value="out">Outbound</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Search
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Item code or name"
                      value={ledgerItemSearch}
                      onChange={(e) => setLedgerItemSearch(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <QRScanner
                      onScan={(parsed: ParsedQRCode) => {
                        if (parsed.itemCode) setLedgerItemSearch(parsed.itemCode);
                      }}
                      buttonLabel="QR"
                      buttonSize="sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="px-4 py-2 text-left font-semibold">Date</th>
                      <th className="px-4 py-2 text-left font-semibold">Item Code</th>
                      <th className="px-4 py-2 text-left font-semibold">Item Name</th>
                      <th className="px-4 py-2 text-left font-semibold">Warehouse</th>
                      <th className="px-4 py-2 text-left font-semibold">Type</th>
                      <th className="px-4 py-2 text-left font-semibold">Movement</th>
                      <th className="px-4 py-2 text-right font-semibold">Opening</th>
                      <th className="px-4 py-2 text-right font-semibold">In</th>
                      <th className="px-4 py-2 text-right font-semibold">Out</th>
                      <th className="px-4 py-2 text-right font-semibold">Closing</th>
                      <th className="px-4 py-2 text-left font-semibold">Reference</th>
                      <th className="px-4 py-2 text-left font-semibold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerData.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{item.date}</td>
                        <td className="px-4 py-2 font-medium">{item.item_code}</td>
                        <td className="px-4 py-2">{item.item_name}</td>
                        <td className="px-4 py-2">{item.warehouse_name}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                            {item.stock_type}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              item.movement_type === 'in'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {item.movement_type === 'in' ? 'IN' : 'OUT'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">{item.opening_qty.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right text-green-600">
                          {item.in_qty.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right text-red-600">
                          {item.out_qty.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          {item.closing_qty.toFixed(2)}
                        </td>
                        <td className="px-4 py-2">{item.reference_doc}</td>
                        <td className="px-4 py-2">{item.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'warehouse' && (
          <div className="space-y-4">
            {warehouseSummaries.map((warehouse) => (
              <div key={warehouse.warehouse_id} className="bg-white rounded-lg shadow-md">
                <button
                  onClick={() => toggleWarehouseExpand(warehouse.warehouse_id)}
                  className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
                >
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{warehouse.warehouse_name}</h3>
                    <p className="text-sm text-gray-600">
                      {warehouse.total_items} items | Total Qty: {warehouse.total_qty.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-gray-600">
                    {warehouse.expanded ? '▼' : '▶'}
                  </div>
                </button>

                {warehouse.expanded && (
                  <div className="border-t">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-6 py-2 text-left font-semibold">Item Code</th>
                          <th className="px-6 py-2 text-left font-semibold">Item Name</th>
                          <th className="px-6 py-2 text-left font-semibold">Type</th>
                          <th className="px-6 py-2 text-right font-semibold">Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {warehouse.items.map((item) => (
                          <tr key={item.id} className="border-b hover:bg-gray-50">
                            <td className="px-6 py-2 font-medium">{item.item_code}</td>
                            <td className="px-6 py-2">{item.item_name}</td>
                            <td className="px-6 py-2">
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                                {item.stock_type}
                              </span>
                            </td>
                            <td className="px-6 py-2 text-right font-medium">
                              {item.closing_qty.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
