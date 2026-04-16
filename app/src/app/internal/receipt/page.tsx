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
import { AlertCircle, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
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

interface Vehicle {
  id: string;
  number: string;
}

interface DispatchDetail {
  id: string;
  dc_number: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  requisition_number?: string;
  eway_bill: string;
  dispatch_date: string;
  items: Array<{
    item_id: string;
    item_code: string;
    item_name: string;
    qty_per_pack: number;
    uom_id: string;
    uom_name: string;
    number_of_packs: number;
    total_qty: number;
  }>;
}

interface ReceiptItem {
  item_id: string;
  item_name?: string;
  qty_per_pack: number;
  uom_id: string;
  number_of_packs: number;
  total_qty: number;
  grn_sticker_put: boolean;
  remarks?: string;
}

interface RecentReceipt {
  id: string;
  receipt_note_number: string;
  dc_number: string;
  receipt_date: string;
  from_warehouse: string;
  to_warehouse: string;
  status: string;
}

const today = new Date().toISOString().split('T')[0];

export default function ReceiptPage() {
  const [step, setStep] = useState<'header' | 'items' | 'complete'>('header');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [eWayBillMismatch, setEWayBillMismatch] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [headerForm, setHeaderForm] = useState({
    dc_number: '',
    requisition_number: '',
    dc_date: '',
    receipt_date: today,
    receiver_security_name: '',
    vehicle_id: '',
    eway_bill_number: '',
    dispatch_id: '',
  });

  const [itemRows, setItemRows] = useState<ReceiptItem[]>([]);
  const [gatePassNumber, setGatePassNumber] = useState<string | null>(null);
  const [receiptNoteNumber, setReceiptNoteNumber] = useState<string | null>(null);

  // Lookup data
  const [items, setItems] = useState<Item[]>([]);
  const [uoms, setUoms] = useState<UOM[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [dispatchHeaders, setDispatchHeaders] = useState<any[]>([]);
  const [recentReceipts, setRecentReceipts] = useState<RecentReceipt[]>([]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [itemsRes, uomsRes, vehiclesRes, dispatchRes, receiptsRes] = await Promise.all([
        supabase.from('items').select('id, code, name'),
        supabase.from('uoms').select('id, name'),
        supabase.from('vehicles').select('id, number'),
        supabase
          .from('dispatch_header')
          .select('id, dc_number, from_warehouse_id, to_warehouse_id, requisition_id, eway_bill, dispatch_date, status, (requisitions(requisition_number))')
          .in('status', ['Dispatched', 'In Transit']),
        supabase
          .from('receipt_header')
          .select('id, receipt_note_number, dc_number, receipt_date, from_warehouse_id, to_warehouse_id, status, (dispatch_header(dc_number))')
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      if (itemsRes.data) setItems(itemsRes.data);
      if (uomsRes.data) setUoms(uomsRes.data);
      if (vehiclesRes.data) setVehicles(vehiclesRes.data);
      if (dispatchRes.data) {
        setDispatchHeaders(
          dispatchRes.data.map((d: any) => ({
            id: d.id,
            dc_number: d.dc_number,
            from_warehouse_id: d.from_warehouse_id,
            to_warehouse_id: d.to_warehouse_id,
            requisition_number: d.requisitions?.requisition_number || null,
            eway_bill: d.eway_bill,
            dispatch_date: d.dispatch_date,
            status: d.status,
          }))
        );
      }
      if (receiptsRes.data) {
        setRecentReceipts(
          receiptsRes.data.map((r: any) => ({
            id: r.id,
            receipt_note_number: r.receipt_note_number,
            dc_number: r.dc_number,
            receipt_date: r.receipt_date,
            from_warehouse: r.from_warehouse_id || 'N/A',
            to_warehouse: r.to_warehouse_id || 'N/A',
            status: r.status,
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

  // Handle DC number selection
  const handleSelectDC = async (dcNumber: string) => {
    const dispatch = dispatchHeaders.find(d => d.dc_number === dcNumber);
    if (!dispatch) return;

    setHeaderForm(prev => ({
      ...prev,
      dc_number: dcNumber,
      requisition_number: dispatch.requisition_number || '',
      dc_date: dispatch.dispatch_date,
      eway_bill_number: dispatch.eway_bill,
      dispatch_id: dispatch.id,
    }));

    // Load dispatch items
    try {
      const { data: itemsData } = await supabase
        .from('dispatch_items')
        .select('item_id, items(code, name), qty_per_pack, uom_id, uoms(name), number_of_packs, total_qty')
        .eq('dispatch_header_id', dispatch.id);

      if (itemsData) {
        setItemRows(
          itemsData.map((item: any) => ({
            item_id: item.item_id,
            item_name: `${item.items?.code} - ${item.items?.name}`,
            qty_per_pack: item.qty_per_pack,
            uom_id: item.uom_id,
            number_of_packs: item.number_of_packs,
            total_qty: item.total_qty,
            grn_sticker_put: true,
            remarks: '',
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load dispatch items:', err);
    }

    setStep('items');
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
        grn_sticker_put: true,
        remarks: '',
      },
    ]);
  };

  // QR scan — add a row prefilled from scanned QR
  const handleReceiptQRScan = (parsed: ParsedQRCode) => {
    if (!parsed.valid || !parsed.itemCode) return;
    const matched = items.find(
      (it: any) => it.code?.toUpperCase() === (parsed.itemCode || '').toUpperCase()
    );
    const qtyPack = parsed.qtyPerPack || 1;
    setItemRows(prev => [
      ...prev,
      {
        item_id: matched?.id || '',
        qty_per_pack: qtyPack,
        uom_id: '',
        number_of_packs: 1,
        total_qty: qtyPack,
        grn_sticker_put: true,
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
    setHeaderForm(prev => ({ ...prev, [name]: value }));

    // Check E-Way bill mismatch
    if (name === 'eway_bill_number' && headerForm.eway_bill_number && value !== headerForm.eway_bill_number) {
      setEWayBillMismatch(`E-Way bill mismatch. DC shows: ${headerForm.eway_bill_number}, You entered: ${value}`);
    } else {
      setEWayBillMismatch(null);
    }
  };

  // Handle vehicle select
  const handleVehicleSelect = (value: string) => {
    setHeaderForm(prev => ({ ...prev, vehicle_id: value }));
  };

  // Save header and generate gate pass
  const handleHeaderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!headerForm.dc_number || !headerForm.receipt_date) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const gatePass = `GP-REC-${Date.now()}`;

      // No need to insert header yet, just show gate pass
      setGatePassNumber(gatePass);
      setSuccess('Gate Pass generated: ' + gatePass);
    } catch (err) {
      setError('Failed to generate gate pass');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Validate form
  const validateForm = (): string | null => {
    if (!headerForm.dc_number) return 'DC number is required';
    if (!headerForm.receipt_date) return 'Receipt date is required';
    if (!headerForm.vehicle_id) return 'Vehicle is required';
    if (itemRows.length === 0) return 'Please add at least one item';

    for (const row of itemRows) {
      if (!row.item_id) return 'All items must be selected';
      if (!row.uom_id) return 'All UOMs must be selected';
      if (row.total_qty <= 0) return 'All quantities must be greater than 0';
    }

    return null;
  };

  // Complete receipt
  const handleCompleteReceipt = async () => {
    setError(null);
    setSuccess(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);

      // Generate receipt note number
      const receiptNumber = await generateDocNumber('RN');

      const dispatch = dispatchHeaders.find(d => d.id === headerForm.dispatch_id);

      // Insert receipt header
      const { data: receiptData, error: receiptError } = await supabase
        .from('receipt_header')
        .insert([
          {
            receipt_note_number: receiptNumber,
            dc_number: headerForm.dc_number,
            dispatch_id: headerForm.dispatch_id,
            requisition_id: dispatch?.requisition_id || null,
            from_warehouse_id: dispatch?.from_warehouse_id,
            to_warehouse_id: dispatch?.to_warehouse_id,
            receipt_date: headerForm.receipt_date,
            entry_date: today,
            gate_pass_number: gatePassNumber,
            receiver_security_name: headerForm.receiver_security_name,
            vehicle_id: headerForm.vehicle_id,
            eway_bill_number: headerForm.eway_bill_number,
            status: 'Received',
          },
        ])
        .select();

      if (receiptError) throw receiptError;

      const receiptId = receiptData?.[0]?.id;

      // Insert item rows
      const itemsToInsert = itemRows.map(row => ({
        receipt_header_id: receiptId,
        item_id: row.item_id,
        qty_per_pack: row.qty_per_pack,
        uom_id: row.uom_id,
        number_of_packs: row.number_of_packs,
        total_qty: row.total_qty,
        grn_sticker_put: row.grn_sticker_put,
        remarks: row.remarks,
      }));

      const { error: itemsError } = await supabase.from('receipt_items').insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Update stock - add to destination warehouse
      for (const row of itemRows) {
        await updateStock({
          item_id: row.item_id,
          warehouse_id: dispatch?.to_warehouse_id,
          direction: 'in',
          quantity: row.total_qty,
          reference_number: receiptId,
          reference_type: 'RECEIPT',
        });
      }

      // Create reconciliation record
      const { error: reconError } = await supabase.from('reconciliation').insert([
        {
          receipt_id: receiptId,
          dispatch_id: headerForm.dispatch_id,
          reconciliation_date: today,
          status: 'Matched',
        },
      ]);

      if (reconError) console.error('Failed to create reconciliation:', reconError);

      setReceiptNoteNumber(receiptNumber);
      setStep('complete');
      setSuccess(`Receipt completed successfully! Receipt Note #${receiptNumber}`);
    } catch (err) {
      setError('Failed to complete receipt');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setStep('header');
    setHeaderForm({
      dc_number: '',
      requisition_number: '',
      dc_date: '',
      receipt_date: today,
      receiver_security_name: '',
      vehicle_id: '',
      eway_bill_number: '',
      dispatch_id: '',
    });
    setItemRows([]);
    setGatePassNumber(null);
    setReceiptNoteNumber(null);
    setSuccess(null);
    setError(null);
    loadInitialData();
  };

  if (loading && step === 'header') {
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
          <h1 className="text-3xl font-bold tracking-tight">Internal Receipt</h1>
          <p className="text-gray-600 mt-2">Receive dispatched materials</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {eWayBillMismatch && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{eWayBillMismatch}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {step === 'header' && (
          <Card>
            <CardHeader>
              <CardTitle>Select Dispatch</CardTitle>
              <CardDescription>Choose a dispatch note to create receipt</CardDescription>
            </CardHeader>
            <CardContent>
              {dispatchHeaders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No dispatches available for receipt</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dispatchHeaders.map(dispatch => (
                    <button
                      key={dispatch.id}
                      onClick={() => handleSelectDC(dispatch.dc_number)}
                      className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">DC #{dispatch.dc_number}</div>
                          <div className="text-sm text-gray-600">
                            Req: {dispatch.requisition_number || 'Direct'} | Date: {dispatch.dispatch_date}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">E-Way Bill: {dispatch.eway_bill}</div>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {dispatch.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === 'items' && (
          <Card>
            <CardHeader>
              <CardTitle>Receipt Details</CardTitle>
              <CardDescription>DC: {headerForm.dc_number}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleHeaderSubmit} className="space-y-6">
                {/* Header Section */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium">DC Number (readonly)</label>
                    <Input type="text" value={headerForm.dc_number} disabled className="mt-1 bg-gray-100" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Requisition Number</label>
                    <Input type="text" value={headerForm.requisition_number} disabled className="mt-1 bg-gray-100" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">DC Date (readonly)</label>
                    <Input type="date" value={headerForm.dc_date} disabled className="mt-1 bg-gray-100" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Receipt Date *</label>
                    <Input
                      type="date"
                      name="receipt_date"
                      value={headerForm.receipt_date}
                      onChange={handleFormChange}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Entry and Gate Pass */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Entry Date (readonly)</label>
                    <Input type="date" value={today} disabled className="mt-1 bg-gray-100" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Receiver/Security Name</label>
                    <Input
                      type="text"
                      name="receiver_security_name"
                      value={headerForm.receiver_security_name}
                      onChange={handleFormChange}
                      placeholder="Enter name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Vehicle *</label>
                    <Select value={headerForm.vehicle_id} onValueChange={handleVehicleSelect}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map(v => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* E-Way Bill */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">E-Way Bill Number *</label>
                    <Input
                      type="text"
                      name="eway_bill_number"
                      value={headerForm.eway_bill_number}
                      onChange={handleFormChange}
                      placeholder="Enter E-Way bill"
                      className="mt-1"
                    />
                    {headerForm.eway_bill_number && (
                      <p className="text-xs text-gray-600 mt-1">DC E-Way Bill: {headerForm.eway_bill_number}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Gate Pass</label>
                    <Input type="text" value={gatePassNumber || ''} disabled className="mt-1 bg-gray-100" />
                  </div>
                </div>

                {/* Items Section */}
                <div className="space-y-4 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Items Received</h3>
                    <div className="flex gap-2">
                      <QRScanner onScan={handleReceiptQRScan} buttonLabel="Scan QR" />
                      <Button type="button" variant="outline" onClick={addItemRow}>
                        + Add Item
                      </Button>
                    </div>
                  </div>

                  {itemRows.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md">
                      <p>No items found for this dispatch</p>
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
                                  checked={row.grn_sticker_put}
                                  onCheckedChange={checked => updateItemRow(idx, 'grn_sticker_put', checked)}
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
                    <Button type="button" variant="outline" onClick={() => setStep('header')} disabled={submitting}>
                      Back
                    </Button>
                    <Button type="submit" disabled={loading} className="gap-2">
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Generate Gate Pass
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCompleteReceipt}
                      disabled={submitting || !gatePassNumber}
                      className="gap-2"
                    >
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      Complete Receipt
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'complete' && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <CardTitle className="text-green-900">Receipt Completed Successfully</CardTitle>
                  <CardDescription className="text-green-800">Receipt Note #{receiptNoteNumber}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={handleReset} size="lg">
                Create New Receipt
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Receipts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Receipts</CardTitle>
            <CardDescription>Last 20 receipts created</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>DC #</TableHead>
                  <TableHead>Receipt Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentReceipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-4">
                      No receipts found
                    </TableCell>
                  </TableRow>
                ) : (
                  recentReceipts.map(receipt => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-medium">{receipt.receipt_note_number}</TableCell>
                      <TableCell>{receipt.dc_number}</TableCell>
                      <TableCell>{receipt.receipt_date}</TableCell>
                      <TableCell>{receipt.from_warehouse}</TableCell>
                      <TableCell>{receipt.to_warehouse}</TableCell>
                      <TableCell>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          {receipt.status}
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
