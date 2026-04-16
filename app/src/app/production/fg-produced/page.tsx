'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { updateStock } from '@/lib/stock';
import { cn } from '@/lib/utils';
import QRScanner from '@/components/QRScanner';
import { ParsedQRCode } from '@/lib/qrParser';
import { getActiveBOM, computeBOMConsumption } from '@/lib/bom';

interface Plant {
  id: string;
  name: string;
  code: string;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface Item {
  id: string;
  code: string;
  name: string;
  items_group_code: string;
  uom: string;
}

interface ProductionItem {
  id: string;
  item_id: string;
  item_code: string;
  item_name: string;
  qty_per_pack: number;
  uom: string;
  number_of_packs: number;
  total_qty_produced: number;
  qty_rejected: number;
  rejection_reason: string;
  net_qty: number;
  remarks: string;
}

interface RecentProduction {
  id: string;
  production_note_number: string;
  production_date: string;
  plant_name: string;
  warehouse_name: string;
  total_items: number;
  total_qty: number;
  status: string;
}

interface ConsumptionRow {
  id: string;
  production_item_id: string; // links to ProductionItem.id
  component_item_id: string;
  component_code: string;
  component_name: string;
  required_qty: number;
  actual_qty: number;
  uom?: string;
  source_bom: boolean; // was this row auto-generated from BOM?
}

export default function FGProducedPage() {
  const { user } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    productionDate: new Date().toISOString().split('T')[0],
    plantId: '',
    warehouseId: '',
    producedBy: user?.email || '',
  });

  const [productionItems, setProductionItems] = useState<ProductionItem[]>([
    {
      id: crypto.randomUUID(),
      item_id: '',
      item_code: '',
      item_name: '',
      qty_per_pack: 0,
      uom: '',
      number_of_packs: 0,
      total_qty_produced: 0,
      qty_rejected: 0,
      rejection_reason: '',
      net_qty: 0,
      remarks: '',
    },
  ]);

  const [recentProductions, setRecentProductions] = useState<RecentProduction[]>([]);
  const [consumptionRows, setConsumptionRows] = useState<ConsumptionRow[]>([]);
  const [applyingBom, setApplyingBom] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [plantsData, warehousesData, itemsData] = await Promise.all([
        supabase.from('plants').select('id, name, code').order('name'),
        supabase.from('warehouses').select('id, name, code').order('name'),
        supabase
          .from('items')
          .select('id, code, name, items_group_code, uom')
          .in('items_group_code', ['Finished Goods', 'Semi finished Goods'])
          .order('code'),
      ]);

      if (plantsData.error) throw plantsData.error;
      if (warehousesData.error) throw warehousesData.error;
      if (itemsData.error) throw itemsData.error;

      setPlants(plantsData.data || []);
      setWarehouses(warehousesData.data || []);
      setItems(itemsData.data || []);

      await fetchRecentProductions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentProductions = async () => {
    try {
      const { data } = await supabase
        .from('production_output')
        .select(
          `
          id,
          production_note_number,
          production_date,
          plants (name),
          warehouses (name),
          status
        `
        )
        .order('production_date', { ascending: false })
        .limit(10);

      if (data) {
        const formatted = data.map((item: any) => ({
          id: item.id,
          production_note_number: item.production_note_number,
          production_date: item.production_date,
          plant_name: item.plants?.name || 'N/A',
          warehouse_name: item.warehouses?.name || 'N/A',
          total_items: 0,
          total_qty: 0,
          status: item.status,
        }));
        setRecentProductions(formatted);
      }
    } catch (err) {
      console.error('Error fetching recent productions:', err);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (
    itemId: string,
    field: keyof ProductionItem,
    value: any
  ) => {
    setProductionItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const updated = { ...item, [field]: value };

        // Auto-calculate fields
        if (field === 'qty_per_pack' || field === 'number_of_packs') {
          updated.total_qty_produced = updated.qty_per_pack * updated.number_of_packs;
        }

        if (field === 'qty_rejected' || field === 'total_qty_produced') {
          updated.net_qty = updated.total_qty_produced - updated.qty_rejected;
        }

        if (field === 'item_id') {
          const selectedItem = items.find((i) => i.id === value);
          if (selectedItem) {
            updated.item_code = selectedItem.code;
            updated.item_name = selectedItem.name;
            updated.uom = selectedItem.uom;
            updated.item_id = selectedItem.id;
          }
        }

        return updated;
      })
    );
  };

  const addProductionItem = () => {
    setProductionItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        item_id: '',
        item_code: '',
        item_name: '',
        qty_per_pack: 0,
        uom: '',
        number_of_packs: 0,
        total_qty_produced: 0,
        qty_rejected: 0,
        rejection_reason: '',
        net_qty: 0,
        remarks: '',
      },
    ]);
  };

  const removeProductionItem = (itemId: string) => {
    if (productionItems.length > 1) {
      setProductionItems((prev) => prev.filter((item) => item.id !== itemId));
    }
    // Also remove any consumption rows linked to this production item
    setConsumptionRows((prev) => prev.filter((r) => r.production_item_id !== itemId));
  };

  // Apply BOM: fetch active BOM for the produced FG and auto-fill consumption rows.
  const applyBOM = async (productionItem: ProductionItem) => {
    if (!productionItem.item_id) {
      setError('Select a Finished Good first, then click Apply BOM.');
      return;
    }
    const qty = productionItem.total_qty_produced || productionItem.net_qty;
    if (!qty || qty <= 0) {
      setError('Enter Qty/Pack and Packs before applying BOM.');
      return;
    }

    setApplyingBom(productionItem.id);
    setError(null);
    try {
      const bom = await getActiveBOM(productionItem.item_id);
      if (!bom) {
        setError(
          `No active BOM found for ${productionItem.item_code}. Create one in Admin → BOM Management.`
        );
        return;
      }
      const computed = computeBOMConsumption(bom, qty);

      // Remove existing BOM-sourced rows for this production item, then add new ones
      setConsumptionRows((prev) => [
        ...prev.filter(
          (r) => !(r.production_item_id === productionItem.id && r.source_bom)
        ),
        ...computed.map((c) => ({
          id: crypto.randomUUID(),
          production_item_id: productionItem.id,
          component_item_id: c.component_item_id,
          component_code: c.component_code,
          component_name: c.component_name,
          required_qty: c.required_qty || 0,
          actual_qty: c.required_qty || 0,
          uom: c.uom,
          source_bom: true,
        })),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply BOM');
    } finally {
      setApplyingBom(null);
    }
  };

  const updateConsumptionRow = (
    rowId: string,
    field: keyof ConsumptionRow,
    value: any
  ) => {
    setConsumptionRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r))
    );
  };

  const removeConsumptionRow = (rowId: string) => {
    setConsumptionRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const addManualConsumptionRow = (productionItemId: string) => {
    setConsumptionRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        production_item_id: productionItemId,
        component_item_id: '',
        component_code: '',
        component_name: '',
        required_qty: 0,
        actual_qty: 0,
        uom: '',
        source_bom: false,
      },
    ]);
  };

  // QR scan handler for production: prefill a new production row
  const handleProductionQRScan = (parsed: ParsedQRCode) => {
    if (!parsed.valid || !parsed.itemCode) {
      setError('QR code could not be parsed.');
      return;
    }
    const matched = items.find(
      (it) => it.code.toUpperCase() === (parsed.itemCode || '').toUpperCase()
    );
    if (!matched) {
      setError(`Item code "${parsed.itemCode}" not found in Item Master.`);
      return;
    }
    setProductionItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        item_id: matched.id,
        item_code: matched.code,
        item_name: matched.name,
        qty_per_pack: parsed.qtyPerPack || 0,
        uom: matched.uom || parsed.uom || '',
        number_of_packs: 1,
        total_qty_produced: parsed.qtyPerPack || 0,
        qty_rejected: 0,
        rejection_reason: '',
        net_qty: parsed.qtyPerPack || 0,
        remarks: '',
      },
    ]);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.plantId || !formData.warehouseId) {
      setError('Plant and Warehouse are required');
      return;
    }

    const validItems = productionItems.filter((item) => item.item_id);
    if (validItems.length === 0) {
      setError('At least one item must be selected');
      return;
    }

    const itemsWithRejection = productionItems.filter(
      (item) => item.qty_rejected > 0 && !item.rejection_reason
    );
    if (itemsWithRejection.length > 0) {
      setError('Rejection reason is required for items with rejected qty');
      return;
    }

    setSubmitting(true);

    try {
      const productionNoteNumber = `PN-${Date.now()}`;

      const { data: productionData, error: productionError } = await supabase
        .from('production_output')
        .insert({
          production_note_number: productionNoteNumber,
          production_date: formData.productionDate,
          plant_id: formData.plantId,
          warehouse_id: formData.warehouseId,
          produced_by: formData.producedBy,
          status: 'completed',
        })
        .select()
        .single();

      if (productionError) throw productionError;

      const itemsToInsert = validItems.map((item) => ({
        production_output_id: productionData.id,
        item_id: item.item_id,
        qty_produced_per_pack: item.qty_per_pack,
        uom: item.uom,
        number_of_packs: item.number_of_packs,
        total_qty_produced: item.total_qty_produced,
        qty_rejected: item.qty_rejected,
        rejection_reason: item.rejection_reason,
        net_qty: item.net_qty,
        remarks: item.remarks,
      }));

      const { error: itemsError } = await supabase
        .from('production_output_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Update stock
      for (const item of validItems) {
        if (item.net_qty > 0) {
          await updateStock({
            item_id: item.item_id,
            warehouse_id: formData.warehouseId,
            movement_type: 'in',
            quantity: item.net_qty,
            stock_type: 'FG',
            reference_doc: productionNoteNumber,
            remarks: item.remarks || 'FG Production',
          });
        }

        if (item.qty_rejected > 0) {
          const rejectWarehouse = warehouses.find((w) => w.code === 'REJECT');
          if (rejectWarehouse) {
            await updateStock({
              item_id: item.item_id,
              warehouse_id: rejectWarehouse.id,
              movement_type: 'in',
              quantity: item.qty_rejected,
              stock_type: 'FG',
              reference_doc: productionNoteNumber,
              remarks: `Rejected: ${item.rejection_reason}`,
            });
          }
        }

        // Deduct consumption (RM/SFG) from production warehouse
        const linkedConsumption = consumptionRows.filter(
          (r) => r.production_item_id === item.id && r.component_item_id && r.actual_qty > 0
        );
        for (const cons of linkedConsumption) {
          await updateStock({
            item_id: cons.component_item_id,
            warehouse_id: formData.warehouseId,
            movement_type: 'out',
            quantity: cons.actual_qty,
            stock_type: cons.component_code?.startsWith('R') ? 'RM' : 'SFG',
            reference_doc: productionNoteNumber,
            remarks: `Consumed for ${item.item_code} production${
              cons.source_bom ? ' (BOM)' : ''
            }`,
          });
        }
      }

      setSuccess(`Production Note ${productionNoteNumber} created successfully`);
      setFormData({
        productionDate: new Date().toISOString().split('T')[0],
        plantId: '',
        warehouseId: '',
        producedBy: user?.email || '',
      });
      setProductionItems([
        {
          id: crypto.randomUUID(),
          item_id: '',
          item_code: '',
          item_name: '',
          qty_per_pack: 0,
          uom: '',
          number_of_packs: 0,
          total_qty_produced: 0,
          qty_rejected: 0,
          rejection_reason: '',
          net_qty: 0,
          remarks: '',
        },
      ]);
      setConsumptionRows([]);
      await fetchRecentProductions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save production');
    } finally {
      setSubmitting(false);
    }
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

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">FG Production</h1>
          <p className="text-gray-600 mt-2">Record finished goods production</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Production Date
              </label>
              <input
                type="date"
                name="productionDate"
                value={formData.productionDate}
                onChange={handleFormChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plant *
              </label>
              <select
                name="plantId"
                value={formData.plantId}
                onChange={handleFormChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Plant</option>
                {plants.map((plant) => (
                  <option key={plant.id} value={plant.id}>
                    {plant.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warehouse *
              </label>
              <select
                name="warehouseId"
                value={formData.warehouseId}
                onChange={handleFormChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Produced By
              </label>
              <input
                type="text"
                value={formData.producedBy}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Production Items</h2>
              <div className="flex gap-2 items-center">
                <QRScanner onScan={handleProductionQRScan} buttonLabel="Scan FG QR" />
                <button
                  type="button"
                  onClick={addProductionItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  + Add Item
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="px-4 py-2 text-left text-sm font-semibold">Item</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold">Qty/Pack</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">UOM</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold">Packs</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold">Total Produced</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold">Rejected</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Reason</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold">Net Qty</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Remarks</th>
                    <th className="px-4 py-2 text-center text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {productionItems.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <select
                          value={item.item_id}
                          onChange={(e) => handleItemChange(item.id, 'item_id', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Item</option>
                          {items.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.code} - {i.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.qty_per_pack}
                          onChange={(e) =>
                            handleItemChange(item.id, 'qty_per_pack', parseFloat(e.target.value))
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.uom}
                          disabled
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          value={item.number_of_packs}
                          onChange={(e) =>
                            handleItemChange(item.id, 'number_of_packs', parseInt(e.target.value))
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-medium">
                        {item.total_qty_produced.toFixed(2)}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          value={item.qty_rejected}
                          onChange={(e) =>
                            handleItemChange(item.id, 'qty_rejected', parseFloat(e.target.value))
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          placeholder="Required if rejected"
                          value={item.rejection_reason}
                          onChange={(e) =>
                            handleItemChange(item.id, 'rejection_reason', e.target.value)
                          }
                          className={cn(
                            'w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                            item.qty_rejected > 0 && !item.rejection_reason
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-300'
                          )}
                        />
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-medium">
                        {item.net_qty.toFixed(2)}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.remarks}
                          onChange={(e) => handleItemChange(item.id, 'remarks', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex flex-col gap-1 items-center">
                          <button
                            type="button"
                            onClick={() => applyBOM(item)}
                            disabled={!item.item_id || applyingBom === item.id}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium disabled:text-gray-400"
                            title="Apply BOM to auto-fill consumption"
                          >
                            {applyingBom === item.id ? 'Applying…' : 'Apply BOM'}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeProductionItem(item.id)}
                            disabled={productionItems.length === 1}
                            className="text-red-600 hover:text-red-800 text-xs disabled:text-gray-400"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Consumption Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Raw Material / SFG Consumption
              </h2>
              <p className="text-sm text-gray-500">
                Auto-filled from BOM. You can edit actual qty or add manual rows.
              </p>
            </div>

            {productionItems.filter((it) => it.item_id).length === 0 ? (
              <div className="text-sm text-gray-500 italic border rounded p-4 bg-gray-50">
                Add production items above, then click &ldquo;Apply BOM&rdquo; to auto-compute consumption.
              </div>
            ) : (
              <div className="space-y-4">
                {productionItems
                  .filter((it) => it.item_id)
                  .map((prodItem) => {
                    const linkedRows = consumptionRows.filter(
                      (r) => r.production_item_id === prodItem.id
                    );
                    return (
                      <div key={`cons-${prodItem.id}`} className="border rounded-lg bg-gray-50 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-gray-800">
                            {prodItem.item_code} — {prodItem.item_name}{' '}
                            <span className="text-gray-500">
                              (Produced: {prodItem.total_qty_produced.toFixed(2)} {prodItem.uom})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => addManualConsumptionRow(prodItem.id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            + Add manual row
                          </button>
                        </div>
                        {linkedRows.length === 0 ? (
                          <div className="text-xs text-gray-500 italic py-2">
                            No consumption rows. Click &ldquo;Apply BOM&rdquo; on the production item above.
                          </div>
                        ) : (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b text-left text-gray-600">
                                <th className="py-1 pr-2">Component</th>
                                <th className="py-1 pr-2 text-right w-32">Required Qty</th>
                                <th className="py-1 pr-2 text-right w-32">Actual Qty</th>
                                <th className="py-1 pr-2 w-20">UOM</th>
                                <th className="py-1 pr-2 w-20">Source</th>
                                <th className="py-1 w-10" />
                              </tr>
                            </thead>
                            <tbody>
                              {linkedRows.map((row) => (
                                <tr key={row.id} className="border-b last:border-0">
                                  <td className="py-1 pr-2">
                                    {row.source_bom ? (
                                      <div>
                                        <div className="font-medium">{row.component_code}</div>
                                        <div className="text-xs text-gray-500">
                                          {row.component_name}
                                        </div>
                                      </div>
                                    ) : (
                                      <select
                                        value={row.component_item_id}
                                        onChange={(e) => {
                                          const it = items.find((x) => x.id === e.target.value);
                                          updateConsumptionRow(row.id, 'component_item_id', e.target.value);
                                          if (it) {
                                            updateConsumptionRow(row.id, 'component_code', it.code);
                                            updateConsumptionRow(row.id, 'component_name', it.name);
                                            updateConsumptionRow(row.id, 'uom', it.uom);
                                          }
                                        }}
                                        className="border rounded px-2 py-1 w-full text-sm"
                                      >
                                        <option value="">— Select —</option>
                                        {items.map((it) => (
                                          <option key={it.id} value={it.id}>
                                            {it.code} — {it.name}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </td>
                                  <td className="py-1 pr-2 text-right font-mono">
                                    {row.required_qty.toFixed(2)}
                                  </td>
                                  <td className="py-1 pr-2">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={row.actual_qty}
                                      onChange={(e) =>
                                        updateConsumptionRow(
                                          row.id,
                                          'actual_qty',
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className="w-full border rounded px-2 py-1 text-right text-sm"
                                    />
                                  </td>
                                  <td className="py-1 pr-2 text-xs">{row.uom}</td>
                                  <td className="py-1 pr-2">
                                    <span
                                      className={cn(
                                        'text-xs px-2 py-0.5 rounded-full',
                                        row.source_bom
                                          ? 'bg-teal-100 text-teal-800'
                                          : 'bg-gray-200 text-gray-700'
                                      )}
                                    >
                                      {row.source_bom ? 'BOM' : 'Manual'}
                                    </span>
                                  </td>
                                  <td className="py-1 text-center">
                                    <button
                                      type="button"
                                      onClick={() => removeConsumptionRow(row.id)}
                                      className="text-red-600 hover:text-red-800 text-xs"
                                    >
                                      ✕
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
            >
              {submitting ? 'Saving...' : 'Save Production'}
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          </div>
        </form>

        {recentProductions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Productions</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="px-4 py-2 text-left text-sm font-semibold">Note Number</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Date</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Plant</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Warehouse</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProductions.map((prod) => (
                    <tr key={prod.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-medium">{prod.production_note_number}</td>
                      <td className="px-4 py-2 text-sm">{prod.production_date}</td>
                      <td className="px-4 py-2 text-sm">{prod.plant_name}</td>
                      <td className="px-4 py-2 text-sm">{prod.warehouse_name}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          {prod.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
