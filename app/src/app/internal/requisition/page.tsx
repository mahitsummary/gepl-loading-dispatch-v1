'use client';

import { useState, useCallback, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/lib/supabase';
import { generateDocNumber } from '@/lib/stock';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import QRScanner from '@/components/QRScanner';
import { ParsedQRCode } from '@/lib/qrParser';

interface Item {
  id: string;
  code: string;
  name: string;
}

interface UOM {
  id: string;
  name: string;
}

interface Plant {
  id: string;
  name: string;
}

interface Warehouse {
  id: string;
  name: string;
  location?: string;
}

interface RequisitionItem {
  item_id: string;
  item_name?: string;
  uom_id: string;
  total_qty_required: number;
  available_qty: number;
  qty_to_order: number;
  remarks?: string;
}

interface Requisition {
  id: string;
  requisition_number: string;
  requested_by_name: string;
  production_date: string;
  plant_name: string;
  warehouse_name: string;
  status: string;
  created_at: string;
}

const today = new Date().toISOString().split('T')[0];

export default function RequisitionPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    production_date: '',
    plant_id: '',
    warehouse_id: '',
  });

  const [itemRows, setItemRows] = useState<RequisitionItem[]>([]);

  // Lookup data
  const [items, setItems] = useState<Item[]>([]);
  const [uoms, setUoms] = useState<UOM[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [filterPlant, setFilterPlant] = useState<string>('');
  const [filterWarehouse, setFilterWarehouse] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [itemsRes, uomsRes, plantsRes, warehousesRes, reqRes] = await Promise.all([
        supabase.from('items').select('id, code, name').order('code'),
        supabase.from('uoms').select('id, name'),
        supabase.from('plants').select('id, name'),
        supabase.from('warehouses').select('id, name, location'),
        supabase
          .from('requisitions')
          .select('id, requisition_number, requested_by, production_date, plant_id, warehouse_id, status, created_at, (plants(name)), (warehouses(name))')
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      if (itemsRes.data) setItems(itemsRes.data);
      if (uomsRes.data) setUoms(uomsRes.data);
      if (plantsRes.data) setPlants(plantsRes.data);
      if (warehousesRes.data) setWarehouses(warehousesRes.data);
      if (reqRes.data) {
        setRequisitions(
          reqRes.data.map((req: any) => ({
            id: req.id,
            requisition_number: req.requisition_number,
            requested_by_name: req.requested_by || 'N/A',
            production_date: req.production_date,
            plant_name: req.plants?.name || 'N/A',
            warehouse_name: req.warehouses?.name || 'N/A',
            status: req.status,
            created_at: req.created_at,
          }))
        );
      }
    } catch (err) {
      setError('Failed to load initial data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Add item row
  const addItemRow = () => {
    setItemRows(prev => [
      ...prev,
      {
        item_id: '',
        uom_id: '',
        total_qty_required: 0,
        available_qty: 0,
        qty_to_order: 0,
        remarks: '',
      },
    ]);
  };

  // QR scan — find item by scanned code & auto-add a row
  const handleRequisitionQRScan = (parsed: ParsedQRCode) => {
    if (!parsed.valid || !parsed.itemCode) return;
    const matched = items.find(
      (it: any) => it.code?.toUpperCase() === (parsed.itemCode || '').toUpperCase()
    );
    setItemRows(prev => [
      ...prev,
      {
        item_id: matched?.id || '',
        uom_id: '',
        total_qty_required: parsed.qtyPerPack || 0,
        available_qty: 0,
        qty_to_order: 0,
        remarks: matched ? '' : `Scanned code: ${parsed.itemCode}`,
      },
    ]);
  };

  // Update item row
  const updateItemRow = async (index: number, field: string, value: any) => {
    const newRows = [...itemRows];
    newRows[index] = { ...newRows[index], [field]: value };

    // When item is selected, fetch available qty
    if (field === 'item_id' && formData.warehouse_id) {
      try {
        const { data: stockData } = await supabase
          .from('stock_summary')
          .select('available_qty')
          .eq('item_id', value)
          .eq('warehouse_id', formData.warehouse_id)
          .single();

        newRows[index].available_qty = stockData?.available_qty || 0;
      } catch (err) {
        console.error('Failed to fetch available qty:', err);
      }
    }

    // Calculate qty to order
    if (field === 'total_qty_required' || field === 'available_qty') {
      const required = newRows[index].total_qty_required || 0;
      const available = newRows[index].available_qty || 0;
      newRows[index].qty_to_order = Math.max(0, required - available);
    }

    setItemRows(newRows);
  };

  // Remove item row
  const removeItemRow = (index: number) => {
    setItemRows(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle plant/warehouse select
  const handlePlantChange = (value: string) => {
    setFormData(prev => ({ ...prev, plant_id: value }));
  };

  const handleWarehouseChange = (value: string) => {
    setFormData(prev => ({ ...prev, warehouse_id: value }));
    // Reset item rows when warehouse changes
    setItemRows([]);
  };

  // Validate form
  const validateForm = (): string | null => {
    if (!formData.production_date) return 'Production date is required';
    if (!formData.plant_id) return 'Plant is required';
    if (!formData.warehouse_id) return 'Warehouse is required';
    if (itemRows.length === 0) return 'Please add at least one item';

    for (const row of itemRows) {
      if (!row.item_id) return 'All items must be selected';
      if (!row.uom_id) return 'All UOMs must be selected';
      if (row.total_qty_required <= 0) return 'All quantities must be greater than 0';
      if (row.qty_to_order < 0) {
        const itemName = items.find(i => i.id === row.item_id)?.name || 'Item';
        return `${itemName}: Sufficient stock available. Cannot order negative quantity.`;
      }
    }

    return null;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);

      // Generate requisition number
      const reqNumber = await generateDocNumber('REQ');

      // Insert requisition header
      const { data: reqData, error: reqError } = await supabase
        .from('requisitions')
        .insert([
          {
            requisition_number: reqNumber,
            requested_by: user?.id,
            production_date: formData.production_date,
            plant_id: formData.plant_id,
            warehouse_id: formData.warehouse_id,
            status: 'Open',
          },
        ])
        .select();

      if (reqError) throw reqError;

      const reqId = reqData?.[0]?.id;

      // Insert item rows
      const itemsToInsert = itemRows.map(row => ({
        requisition_id: reqId,
        item_id: row.item_id,
        uom_id: row.uom_id,
        total_qty_required: row.total_qty_required,
        qty_to_order: row.qty_to_order,
        remarks: row.remarks,
      }));

      const { error: itemsError } = await supabase.from('requisition_items').insert(itemsToInsert);

      if (itemsError) throw itemsError;

      setSuccess(`Requisition created successfully! Requisition #${reqNumber}`);

      // Reset form
      setFormData({ production_date: '', plant_id: '', warehouse_id: '' });
      setItemRows([]);

      // Reload requisitions
      loadInitialData();
    } catch (err) {
      setError('Failed to create requisition');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter requisitions
  const filteredRequisitions = requisitions.filter(req => {
    if (filterPlant && req.plant_name !== filterPlant) return false;
    if (filterWarehouse && req.warehouse_name !== filterWarehouse) return false;
    if (filterDate && req.created_at.split('T')[0] !== filterDate) return false;
    return true;
  });

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Material Requisition Request</h1>
          <p className="text-gray-600 mt-2">Request materials for production</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>New Requisition</CardTitle>
            <CardDescription>Create a material requisition request</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Header Section */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">Requested By (readonly)</label>
                  <Input type="text" value={user?.email || 'System'} disabled className="mt-1 bg-gray-100" />
                </div>
                <div>
                  <label className="text-sm font-medium">Requested Date</label>
                  <Input type="date" value={today} disabled className="mt-1 bg-gray-100" />
                </div>
                <div>
                  <label className="text-sm font-medium">Production Date *</label>
                  <Input
                    type="date"
                    name="production_date"
                    value={formData.production_date}
                    onChange={handleFormChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Production Plant *</label>
                  <Select value={formData.plant_id} onValueChange={handlePlantChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select plant" />
                    </SelectTrigger>
                    <SelectContent>
                      {plants.map(plant => (
                        <SelectItem key={plant.id} value={plant.id}>
                          {plant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="w-1/2">
                <label className="text-sm font-medium">Destination Warehouse *</label>
                <Select value={formData.warehouse_id} onValueChange={handleWarehouseChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(warehouse => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Items Section */}
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Items Required</h3>
                  <div className="flex gap-2">
                    <QRScanner onScan={handleRequisitionQRScan} buttonLabel="Scan QR" />
                    <Button type="button" variant="outline" onClick={addItemRow}>
                      + Add Item
                    </Button>
                  </div>
                </div>

                {itemRows.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md">
                    <p>No items added. Click "Add Item" to get started.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Item Code/Name</th>
                          <th className="text-left py-2 px-2">UOM</th>
                          <th className="text-right py-2 px-2">Total Qty Required</th>
                          <th className="text-right py-2 px-2">Available Qty</th>
                          <th className="text-right py-2 px-2">Qty to Order</th>
                          <th className="text-left py-2 px-2">Remarks</th>
                          <th className="text-center py-2 px-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemRows.map((row, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="py-2 px-2">
                              <select
                                value={row.item_id}
                                onChange={e => updateItemRow(idx, 'item_id', e.target.value)}
                                className="border rounded px-2 py-1 w-full"
                              >
                                <option value="">Select item</option>
                                {items.map(item => (
                                  <option key={item.id} value={item.id}>
                                    {item.code} - {item.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-2">
                              <select
                                value={row.uom_id}
                                onChange={e => updateItemRow(idx, 'uom_id', e.target.value)}
                                className="border rounded px-2 py-1 w-full"
                              >
                                <option value="">Select UOM</option>
                                {uoms.map(uom => (
                                  <option key={uom.id} value={uom.id}>
                                    {uom.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-2 text-right">
                              <Input
                                type="number"
                                value={row.total_qty_required || ''}
                                onChange={e => updateItemRow(idx, 'total_qty_required', Number(e.target.value))}
                                placeholder="0"
                                className="w-24 text-right"
                              />
                            </td>
                            <td className="py-2 px-2 text-right font-semibold">{row.available_qty}</td>
                            <td className={`py-2 px-2 text-right font-semibold ${row.qty_to_order < 0 ? 'text-red-600' : ''}`}>
                              {Math.max(0, row.qty_to_order)}
                            </td>
                            <td className="py-2 px-2">
                              <Input
                                type="text"
                                value={row.remarks || ''}
                                onChange={e => updateItemRow(idx, 'remarks', e.target.value)}
                                placeholder="Notes"
                                className="text-xs"
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItemRow(idx)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Remove
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={addItemRow}>
                    + Add Another Item
                  </Button>
                  <Button type="submit" disabled={submitting} className="gap-2">
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create Requisition
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Recent Requisitions */}
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <CardTitle>Recent Requisitions</CardTitle>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Filter by Plant</label>
                  <Select value={filterPlant} onValueChange={setFilterPlant}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All plants" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All plants</SelectItem>
                      {plants.map(plant => (
                        <SelectItem key={plant.id} value={plant.name}>
                          {plant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Filter by Warehouse</label>
                  <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All warehouses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All warehouses</SelectItem>
                      {warehouses.map(warehouse => (
                        <SelectItem key={warehouse.id} value={warehouse.name}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Filter by Date</label>
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requisition #</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Production Date</TableHead>
                  <TableHead>Plant</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequisitions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-4">
                      No requisitions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequisitions.map(req => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.requisition_number}</TableCell>
                      <TableCell>{req.requested_by_name}</TableCell>
                      <TableCell>{req.production_date}</TableCell>
                      <TableCell>{req.plant_name}</TableCell>
                      <TableCell>{req.warehouse_name}</TableCell>
                      <TableCell>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            req.status === 'Open'
                              ? 'bg-blue-100 text-blue-800'
                              : req.status === 'Partially Dispatched'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{req.created_at.split('T')[0]}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
