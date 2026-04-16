'use client';

import { useState, useCallback, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/lib/supabase';
import { updateStock, generateDocNumber } from '@/lib/stock';
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

interface Supervisor {
  id: string;
  name: string;
}

interface Driver {
  id: string;
  name: string;
}

interface Item {
  id: string;
  code: string;
  name: string;
}

interface UOM {
  id: string;
  name: string;
}

interface Warehouse {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  gst_number?: string;
}

interface Vehicle {
  id: string;
  number: string;
}

interface Requisition {
  id: string;
  requisition_number: string;
  plant_name: string;
  warehouse_name: string;
  status: string;
}

interface DispatchItem {
  item_id: string;
  item_name?: string;
  qty_per_pack: number;
  uom_id: string;
  number_of_packs: number;
  total_qty: number;
  grn_sticker_stuck: boolean;
  remarks?: string;
}

interface RecentDispatch {
  id: string;
  dc_number: string;
  requisition_number?: string;
  from_warehouse: string;
  to_warehouse: string;
  driver_name: string;
  date: string;
  status: string;
}

const today = new Date().toISOString().split('T')[0];

export default function DispatchPage() {
  const [mode, setMode] = useState<'select_requisition' | 'dispatch_form' | 'direct_form'>('select_requisition');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [dispatchForm, setDispatchForm] = useState({
    supervisor_id: '',
    driver_id: '',
    vehicle_id: '',
    from_warehouse_id: '',
    to_warehouse_id: '',
    requisition_id: '',
    requisition_number: '',
  });

  const [itemRows, setItemRows] = useState<DispatchItem[]>([]);

  // Lookup data
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [uoms, setUoms] = useState<UOM[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [recentDispatches, setRecentDispatches] = useState<RecentDispatch[]>([]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [supervisorsRes, driversRes, itemsRes, uomsRes, warehousesRes, vehiclesRes, reqRes, dispatchRes] = await Promise.all([
        supabase.from('supervisors').select('id, name'),
        supabase.from('drivers').select('id, name'),
        supabase.from('items').select('id, code, name'),
        supabase.from('uoms').select('id, name'),
        supabase.from('warehouses').select('id, name, address, phone, gst_number'),
        supabase.from('vehicles').select('id, number'),
        supabase
          .from('requisitions')
          .select('id, requisition_number, plant_id, warehouse_id, status, (plants(name)), (warehouses(name))')
          .in('status', ['Open', 'Partially Dispatched']),
        supabase
          .from('dispatch_header')
          .select('id, dc_number, requisition_id, from_warehouse_id, to_warehouse_id, driver_id, dispatch_date, status, (requisitions(requisition_number)), (drivers(name)), (warehouses(name))')
          .order('dispatch_date', { ascending: false })
          .limit(20),
      ]);

      if (supervisorsRes.data) setSupervisors(supervisorsRes.data);
      if (driversRes.data) setDrivers(driversRes.data);
      if (itemsRes.data) setItems(itemsRes.data);
      if (uomsRes.data) setUoms(uomsRes.data);
      if (warehousesRes.data) setWarehouses(warehousesRes.data);
      if (vehiclesRes.data) setVehicles(vehiclesRes.data);
      if (reqRes.data) {
        setRequisitions(
          reqRes.data.map((req: any) => ({
            id: req.id,
            requisition_number: req.requisition_number,
            plant_name: req.plants?.name || 'N/A',
            warehouse_name: req.warehouses?.name || 'N/A',
            status: req.status,
          }))
        );
      }
      if (dispatchRes.data) {
        setRecentDispatches(
          dispatchRes.data.map((dispatch: any) => ({
            id: dispatch.id,
            dc_number: dispatch.dc_number,
            requisition_number: dispatch.requisitions?.requisition_number || 'Direct',
            from_warehouse: dispatch.from_warehouse_id || 'N/A',
            to_warehouse: dispatch.to_warehouse_id || 'N/A',
            driver_name: dispatch.drivers?.name || 'N/A',
            date: dispatch.dispatch_date,
            status: dispatch.status,
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

  // Handle requisition selection
  const handleSelectRequisition = async (requisitionId: string) => {
    const req = requisitions.find(r => r.id === requisitionId);
    if (!req) return;

    setDispatchForm(prev => ({
      ...prev,
      requisition_id: requisitionId,
      requisition_number: req.requisition_number,
    }));

    // Load requisition items
    try {
      const { data: itemsData } = await supabase
        .from('requisition_items')
        .select('item_id, items(code, name), uom_id, qty_to_order, (uoms(name))')
        .eq('requisition_id', requisitionId);

      if (itemsData) {
        setItemRows(
          itemsData.map((item: any) => ({
            item_id: item.item_id,
            item_name: `${item.items?.code} - ${item.items?.name}`,
            qty_per_pack: 1,
            uom_id: item.uom_id,
            number_of_packs: item.qty_to_order,
            total_qty: item.qty_to_order,
            grn_sticker_stuck: true,
            remarks: '',
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load requisition items:', err);
    }

    setMode('dispatch_form');
  };

  // Add item row
  const addItemRow = () => {
    setItemRows(prev => [
      ...prev,
      {
        item_id: '',
        qty_per_pack: 1,
        uom_id: '',
        number_of_packs: 0,
        total_qty: 0,
        grn_sticker_stuck: true,
        remarks: '',
      },
    ]);
  };

  // Handle QR scan - add a row with parsed data
  const handleDispatchQRScan = (parsed: ParsedQRCode) => {
    if (!parsed.valid || !parsed.itemCode) return;
    const matched = items.find(
      (it: any) => it.code?.toUpperCase() === (parsed.itemCode || '').toUpperCase()
    );
    const qtyPack = parsed.qtyPerPack || 1;
    setItemRows(prev => [
      ...prev,
      {
        item_id: matched?.id || '',
        item_name: matched?.name,
        qty_per_pack: qtyPack,
        uom_id: '',
        number_of_packs: 1,
        total_qty: qtyPack,
        grn_sticker_stuck: true,
        remarks: matched ? '' : `Scanned code: ${parsed.itemCode}`,
      },
    ]);
  };

  // Update item row
  const updateItemRow = (index: number, field: string, value: any) => {
    const newRows = [...itemRows];
    newRows[index] = { ...newRows[index], [field]: value };

    // Auto-calculate total qty
    if (field === 'qty_per_pack' || field === 'number_of_packs') {
      const qtyPerPack = newRows[index].qty_per_pack || 1;
      const numPacks = newRows[index].number_of_packs || 0;
      newRows[index].total_qty = qtyPerPack * numPacks;
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
    setDispatchForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (field: string, value: string) => {
    setDispatchForm(prev => ({ ...prev, [field]: value }));
  };

  // Validate form
  const validateForm = (): string | null => {
    if (!dispatchForm.supervisor_id) return 'Supervisor is required';
    if (!dispatchForm.driver_id) return 'Driver is required';
    if (!dispatchForm.vehicle_id) return 'Vehicle is required';
    if (!dispatchForm.from_warehouse_id) return 'From warehouse is required';
    if (!dispatchForm.to_warehouse_id) return 'To warehouse is required';
    if (itemRows.length === 0) return 'Please add at least one item';

    for (const row of itemRows) {
      if (!row.item_id) return 'All items must be selected';
      if (!row.uom_id) return 'All UOMs must be selected';
      if (row.total_qty <= 0) return 'All quantities must be greater than 0';
    }

    return null;
  };

  // Submit dispatch
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

      // Generate DC number
      const dcNumber = await generateDocNumber('DC');

      // Insert dispatch header
      const { data: dispatchData, error: dispatchError } = await supabase
        .from('dispatch_header')
        .insert([
          {
            dc_number: dcNumber,
            requisition_id: dispatchForm.requisition_id || null,
            supervisor_id: dispatchForm.supervisor_id,
            driver_id: dispatchForm.driver_id,
            vehicle_id: dispatchForm.vehicle_id,
            from_warehouse_id: dispatchForm.from_warehouse_id,
            to_warehouse_id: dispatchForm.to_warehouse_id,
            dispatch_date: today,
            status: 'Dispatched',
          },
        ])
        .select();

      if (dispatchError) throw dispatchError;

      const dispatchId = dispatchData?.[0]?.id;

      // Insert item rows
      const itemsToInsert = itemRows.map(row => ({
        dispatch_header_id: dispatchId,
        item_id: row.item_id,
        qty_per_pack: row.qty_per_pack,
        uom_id: row.uom_id,
        number_of_packs: row.number_of_packs,
        total_qty: row.total_qty,
        grn_sticker_stuck: row.grn_sticker_stuck,
        remarks: row.remarks,
      }));

      const { error: itemsError } = await supabase.from('dispatch_items').insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Update stock - reduce from source warehouse
      for (const row of itemRows) {
        await updateStock({
          item_id: row.item_id,
          warehouse_id: dispatchForm.from_warehouse_id,
          direction: 'out',
          quantity: row.total_qty,
          reference_number: dispatchId,
          reference_type: 'DISPATCH',
        });
      }

      setSuccess(`Dispatch created successfully! DC #${dcNumber}`);

      // Reset form
      resetForm();
      loadInitialData();
    } catch (err) {
      setError('Failed to create dispatch');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setMode('select_requisition');
    setDispatchForm({
      supervisor_id: '',
      driver_id: '',
      vehicle_id: '',
      from_warehouse_id: '',
      to_warehouse_id: '',
      requisition_id: '',
      requisition_number: '',
    });
    setItemRows([]);
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Internal Dispatch</h1>
          <p className="text-gray-600 mt-2">Dispatch materials to warehouses</p>
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

        {mode === 'select_requisition' && (
          <div className="grid grid-cols-2 gap-6">
            {/* From Requisition */}
            <Card>
              <CardHeader>
                <CardTitle>From Requisition</CardTitle>
                <CardDescription>Dispatch from an existing requisition</CardDescription>
              </CardHeader>
              <CardContent>
                {requisitions.length === 0 ? (
                  <p className="text-gray-500 text-sm">No open requisitions available</p>
                ) : (
                  <div className="space-y-2">
                    {requisitions.map(req => (
                      <button
                        key={req.id}
                        onClick={() => handleSelectRequisition(req.id)}
                        className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition"
                      >
                        <div className="font-medium">{req.requisition_number}</div>
                        <div className="text-sm text-gray-600">
                          {req.plant_name} → {req.warehouse_name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Status: {req.status}</div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Direct Dispatch */}
            <Card>
              <CardHeader>
                <CardTitle>Direct Dispatch</CardTitle>
                <CardDescription>Create manual dispatch without requisition</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setMode('direct_form')}
                  className="w-full"
                >
                  Create Direct Dispatch
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {(mode === 'dispatch_form' || mode === 'direct_form') && (
          <Card>
            <CardHeader>
              <CardTitle>Dispatch Details</CardTitle>
              <CardDescription>
                {mode === 'dispatch_form' ? `Requisition: ${dispatchForm.requisition_number}` : 'Manual Dispatch'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personnel Section */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Supervisor *</label>
                    <Select value={dispatchForm.supervisor_id} onValueChange={v => handleSelectChange('supervisor_id', v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select supervisor" />
                      </SelectTrigger>
                      <SelectContent>
                        {supervisors.map(sup => (
                          <SelectItem key={sup.id} value={sup.id}>
                            {sup.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Driver *</label>
                    <Select value={dispatchForm.driver_id} onValueChange={v => handleSelectChange('driver_id', v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select driver" />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers.map(driver => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Vehicle *</label>
                    <Select value={dispatchForm.vehicle_id} onValueChange={v => handleSelectChange('vehicle_id', v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map(vehicle => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="text-sm font-medium">Dispatch Date (readonly)</label>
                  <Input type="date" value={today} disabled className="mt-1 bg-gray-100" />
                </div>

                {/* Warehouse Section */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium">Location From (Warehouse) *</label>
                    <Select value={dispatchForm.from_warehouse_id} onValueChange={v => handleSelectChange('from_warehouse_id', v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map(wh => (
                          <SelectItem key={wh.id} value={wh.id}>
                            {wh.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {dispatchForm.from_warehouse_id && (
                      <div className="text-xs text-gray-600 mt-2 space-y-1">
                        <div>
                          {warehouses.find(w => w.id === dispatchForm.from_warehouse_id)?.address || 'N/A'}
                        </div>
                        <div>
                          {warehouses.find(w => w.id === dispatchForm.from_warehouse_id)?.phone || 'N/A'}
                        </div>
                        <div>
                          GST: {warehouses.find(w => w.id === dispatchForm.from_warehouse_id)?.gst_number || 'N/A'}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Location To (Warehouse) *</label>
                    <Select value={dispatchForm.to_warehouse_id} onValueChange={v => handleSelectChange('to_warehouse_id', v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map(wh => (
                          <SelectItem key={wh.id} value={wh.id}>
                            {wh.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {dispatchForm.to_warehouse_id && (
                      <div className="text-xs text-gray-600 mt-2 space-y-1">
                        <div>
                          {warehouses.find(w => w.id === dispatchForm.to_warehouse_id)?.address || 'N/A'}
                        </div>
                        <div>
                          {warehouses.find(w => w.id === dispatchForm.to_warehouse_id)?.phone || 'N/A'}
                        </div>
                        <div>
                          GST: {warehouses.find(w => w.id === dispatchForm.to_warehouse_id)?.gst_number || 'N/A'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Section */}
                <div className="space-y-4 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Items to Dispatch</h3>
                    <div className="flex gap-2">
                      <QRScanner onScan={handleDispatchQRScan} buttonLabel="Scan QR" />
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
                            <th className="text-left py-2 px-2">Qty/Pack</th>
                            <th className="text-left py-2 px-2">UOM</th>
                            <th className="text-left py-2 px-2">Packs</th>
                            <th className="text-right py-2 px-2">Total Qty</th>
                            <th className="text-center py-2 px-2">GRN Sticker?</th>
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
                                <Input
                                  type="number"
                                  value={row.qty_per_pack || ''}
                                  onChange={e => updateItemRow(idx, 'qty_per_pack', Number(e.target.value))}
                                  placeholder="0"
                                  className="w-20"
                                />
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
                              <td className="py-2 px-2">
                                <Input
                                  type="number"
                                  value={row.number_of_packs || ''}
                                  onChange={e => updateItemRow(idx, 'number_of_packs', Number(e.target.value))}
                                  placeholder="0"
                                  className="w-20"
                                />
                              </td>
                              <td className="py-2 px-2 text-right font-semibold">{row.total_qty}</td>
                              <td className="py-2 px-2 text-center">
                                <Checkbox
                                  checked={row.grn_sticker_stuck}
                                  onCheckedChange={checked => updateItemRow(idx, 'grn_sticker_stuck', checked)}
                                />
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
                    <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                      Cancel
                    </Button>
                    <QRScanner onScan={handleDispatchQRScan} buttonLabel="Scan QR" buttonVariant="outline" />
                    <Button type="button" variant="outline" onClick={addItemRow}>
                      + Add Another Item
                    </Button>
                    <Button type="submit" disabled={submitting} className="gap-2">
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      Create Dispatch
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Recent Dispatches */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Dispatches</CardTitle>
            <CardDescription>Last 20 dispatch notes created</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DC #</TableHead>
                  <TableHead>Requisition #</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDispatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-4">
                      No dispatches found
                    </TableCell>
                  </TableRow>
                ) : (
                  recentDispatches.map(dispatch => (
                    <TableRow key={dispatch.id}>
                      <TableCell className="font-medium">{dispatch.dc_number}</TableCell>
                      <TableCell>{dispatch.requisition_number}</TableCell>
                      <TableCell>{dispatch.from_warehouse}</TableCell>
                      <TableCell>{dispatch.to_warehouse}</TableCell>
                      <TableCell>{dispatch.driver_name}</TableCell>
                      <TableCell>{dispatch.date}</TableCell>
                      <TableCell>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {dispatch.status}
                        </span>
                      </TableCell>
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
