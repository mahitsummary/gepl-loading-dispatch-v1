'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/lib/supabase';
import { updateStock, generateBatchNumber, generateDocNumber } from '@/lib/stock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2, Loader2, Upload } from 'lucide-react';
import QRScanner from '@/components/QRScanner';
import { ParsedQRCode } from '@/lib/qrParser';

interface Vendor {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
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

interface GRNHeader {
  id: string;
  vendor_id: string;
  po_number: string;
  po_date: string;
  committed_delivery_date?: string;
  vendor_doc_number?: string;
  vendor_doc_date: string;
  receipt_date: string;
  entry_date: string;
  gate_pass_number?: string;
  photo_url?: string;
  receiver_name?: string;
  security_name?: string;
  vehicle_number?: string;
}

interface GRNItem {
  id: string;
  grn_header_id: string;
  item_id: string;
  qty_per_pack: number;
  uom_id: string;
  number_of_packs: number;
  total_qty: number;
  batch_number?: string;
  remarks?: string;
}

interface RecentGRN {
  id: string;
  gate_pass_number: string;
  vendor_name: string;
  po_number: string;
  receipt_date: string;
  vehicle_number?: string;
  status: string;
}

const today = new Date().toISOString().split('T')[0];

export default function InwardPage() {
  const [step, setStep] = useState<'header' | 'items' | 'complete'>('header');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Header form state
  const [headerForm, setHeaderForm] = useState({
    vendor_id: '',
    vendor_name: '',
    po_number: '',
    po_date: '',
    committed_delivery_date: '',
    vendor_doc_number: '',
    vendor_doc_date: today,
    receipt_date: today,
    receiver_name: '',
    security_name: '',
    vehicle_number: '',
    photo_url: '',
  });

  const [grnHeaderId, setGrnHeaderId] = useState<string | null>(null);
  const [gatePassNumber, setGatePassNumber] = useState<string | null>(null);
  const [grnNumber, setGrnNumber] = useState<string | null>(null);

  // Item form state
  const [itemRows, setItemRows] = useState<Array<Partial<GRNItem> & { item_id?: string; item_name?: string; uom_id?: string; generate_qr?: boolean }>>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [uoms, setUoms] = useState<UOM[]>([]);
  const [recentGRNs, setRecentGRNs] = useState<RecentGRN[]>([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [vendorsRes, itemsRes, uomsRes, grnsRes] = await Promise.all([
        supabase.from('vendors').select('id, name, contact_person, phone, email'),
        supabase.from('items').select('id, code, name'),
        supabase.from('uoms').select('id, name'),
        supabase
          .from('grn_header')
          .select('id, gate_pass_number, po_number, receipt_date, vehicle_number, vendors(name)')
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      if (vendorsRes.data) setVendors(vendorsRes.data);
      if (itemsRes.data) setItems(itemsRes.data);
      if (uomsRes.data) setUoms(uomsRes.data);
      if (grnsRes.data) {
        setRecentGRNs(
          grnsRes.data.map((grn: any) => ({
            id: grn.id,
            gate_pass_number: grn.gate_pass_number || 'N/A',
            vendor_name: grn.vendors?.name || 'N/A',
            po_number: grn.po_number,
            receipt_date: grn.receipt_date,
            vehicle_number: grn.vehicle_number,
            status: 'Completed',
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

  // Filter vendors based on search
  const filteredVendors = useMemo(() => {
    if (!vendorSearch) return vendors;
    return vendors.filter(v => v.name.toLowerCase().includes(vendorSearch.toLowerCase()));
  }, [vendorSearch, vendors]);

  // Select vendor and auto-fill POC
  const handleSelectVendor = (vendor: Vendor) => {
    setHeaderForm(prev => ({
      ...prev,
      vendor_id: vendor.id,
      vendor_name: vendor.name,
    }));
    setVendorSearch('');
    setVendorDropdownOpen(false);
  };

  // Handle header form changes
  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setHeaderForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const fileName = `grn_${Date.now()}_${file.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('grn_photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('grn_photos').getPublicUrl(fileName);
      setHeaderForm(prev => ({ ...prev, photo_url: publicUrlData.publicUrl }));
      setSuccess('Photo uploaded successfully');
    } catch (err) {
      setError('Failed to upload photo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Submit header
  const handleHeaderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!headerForm.vendor_id || !headerForm.po_number || !headerForm.po_date) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const gatePass = `GP-${Date.now()}`;

      const { data: grnData, error: grnError } = await supabase
        .from('grn_header')
        .insert([
          {
            vendor_id: headerForm.vendor_id,
            po_number: headerForm.po_number,
            po_date: headerForm.po_date,
            committed_delivery_date: headerForm.committed_delivery_date,
            vendor_doc_number: headerForm.vendor_doc_number,
            vendor_doc_date: headerForm.vendor_doc_date,
            receipt_date: headerForm.receipt_date,
            entry_date: today,
            gate_pass_number: gatePass,
            photo_url: headerForm.photo_url,
            receiver_name: headerForm.receiver_name,
            security_name: headerForm.security_name,
            vehicle_number: headerForm.vehicle_number,
          },
        ])
        .select();

      if (grnError) throw grnError;

      const headerId = grnData?.[0]?.id;
      setGrnHeaderId(headerId);
      setGatePassNumber(gatePass);
      setStep('items');
      setSuccess('GRN header created successfully. Gate Pass: ' + gatePass);
    } catch (err) {
      setError('Failed to save GRN header');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Add item row
  const addItemRow = () => {
    setItemRows(prev => [...prev, {}]);
  };

  // Handle QR scan: auto-add an item row prefilled from parsed QR data
  const handleQRScan = (parsed: ParsedQRCode) => {
    if (!parsed.valid || !parsed.itemCode) {
      setError('QR code could not be parsed. Please enter item manually.');
      return;
    }

    // Look up item by code (case-insensitive)
    const matchedItem = items.find(
      (it) => it.code.toUpperCase() === (parsed.itemCode || '').toUpperCase()
    );

    // Match UOM (e.g., "Nos")
    const matchedUom = uoms.find(
      (u) => u.name.toLowerCase() === (parsed.uom || '').toLowerCase()
    );

    const qtyPerPack = parsed.qtyPerPack || 0;

    setItemRows((prev) => [
      ...prev,
      {
        item_id: matchedItem?.id,
        item_name: matchedItem ? `${matchedItem.code} - ${matchedItem.name}` : parsed.itemCode,
        qty_per_pack: qtyPerPack,
        uom_id: matchedUom?.id,
        number_of_packs: 1,
        total_qty: qtyPerPack, // 1 pack by default
        remarks: parsed.vendorRef ? `Vendor Ref: ${parsed.vendorRef}` : undefined,
      },
    ]);

    if (!matchedItem) {
      setError(
        `Item code "${parsed.itemCode}" not found in Item Master. Row added; please correct the item manually.`
      );
    } else {
      setError(null);
    }

    // Auto-fill vendor doc number if scanned QR has vendorRef and field is empty
    if (parsed.vendorRef && !headerForm.vendor_doc_number) {
      setHeaderForm((prev) => ({
        ...prev,
        vendor_doc_number: parsed.vendorRef || prev.vendor_doc_number,
      }));
    }
  };

  // Update item row
  const updateItemRow = (index: number, field: string, value: any) => {
    setItemRows(prev => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], [field]: value };

      // Auto-calculate total qty
      if (field === 'qty_per_pack' || field === 'number_of_packs') {
        const qtyPerPack = newRows[index].qty_per_pack || 0;
        const numPacks = newRows[index].number_of_packs || 0;
        newRows[index].total_qty = qtyPerPack * numPacks;
      }

      return newRows;
    });
  };

  // Complete GRN
  const handleCompleteGRN = async () => {
    if (!grnHeaderId || itemRows.length === 0) {
      setError('Please add at least one item');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Save all item rows
      const itemsToInsert = await Promise.all(
        itemRows.map(async row => {
          let batchNumber = undefined;
          if (row.generate_qr) {
            batchNumber = await generateBatchNumber(row.item_id || '');
          }
          return {
            grn_header_id: grnHeaderId,
            item_id: row.item_id,
            qty_per_pack: row.qty_per_pack,
            uom_id: row.uom_id,
            number_of_packs: row.number_of_packs,
            total_qty: row.total_qty,
            batch_number: batchNumber,
            remarks: row.remarks,
          };
        })
      );

      const { error: itemsError } = await supabase.from('grn_items').insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Update stock for each item
      for (const row of itemRows) {
        await updateStock({
          item_id: row.item_id || '',
          warehouse_id: 'main_warehouse', // Adjust based on your logic
          direction: 'in',
          quantity: row.total_qty || 0,
          reference_number: grnHeaderId,
          reference_type: 'GRN',
        });
      }

      // Generate GRN document number
      const docNumber = await generateDocNumber('GRN');

      // Update GRN header with doc number
      await supabase.from('grn_header').update({ document_number: docNumber }).eq('id', grnHeaderId);

      setGrnNumber(docNumber);
      setStep('complete');
      setSuccess(`GRN completed successfully! GRN #${docNumber}`);
    } catch (err) {
      setError('Failed to complete GRN');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setStep('header');
    setHeaderForm({
      vendor_id: '',
      vendor_name: '',
      po_number: '',
      po_date: '',
      committed_delivery_date: '',
      vendor_doc_number: '',
      vendor_doc_date: today,
      receipt_date: today,
      receiver_name: '',
      security_name: '',
      vehicle_number: '',
      photo_url: '',
    });
    setItemRows([]);
    setGrnHeaderId(null);
    setGatePassNumber(null);
    setGrnNumber(null);
    setSuccess(null);
    setError(null);
    loadInitialData();
  };

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goods Receipt Note (GRN) - Inward</h1>
          <p className="text-gray-600 mt-2">Record incoming goods from suppliers</p>
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

        {step === 'header' && (
          <Card>
            <CardHeader>
              <CardTitle>Transaction Header</CardTitle>
              <CardDescription>Enter GRN details and vendor information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleHeaderSubmit} className="space-y-6">
                {/* Vendor Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Vendor Information</h3>
                  <div className="relative">
                    <label className="text-sm font-medium">Vendor Name *</label>
                    <div className="flex gap-2 mt-1">
                      <div className="relative flex-1">
                        <Input
                          placeholder="Search vendor..."
                          value={vendorSearch || headerForm.vendor_name}
                          onChange={e => setVendorSearch(e.target.value)}
                          onFocus={() => setVendorDropdownOpen(true)}
                          className="w-full"
                        />
                        {vendorDropdownOpen && filteredVendors.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-white border rounded-md mt-1 max-h-48 overflow-y-auto z-10 shadow-lg">
                            {filteredVendors.map(vendor => (
                              <button
                                key={vendor.id}
                                type="button"
                                onClick={() => handleSelectVendor(vendor)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                              >
                                {vendor.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {headerForm.vendor_id && (
                    <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-md">
                      <div>
                        <label className="text-xs text-gray-600">POC Name</label>
                        <p className="font-medium">{vendors.find(v => v.id === headerForm.vendor_id)?.contact_person || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">POC Phone</label>
                        <p className="font-medium">{vendors.find(v => v.id === headerForm.vendor_id)?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">POC Email</label>
                        <p className="font-medium text-sm">{vendors.find(v => v.id === headerForm.vendor_id)?.email || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* PO Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">PO Number *</label>
                    <Input
                      type="text"
                      name="po_number"
                      value={headerForm.po_number}
                      onChange={handleHeaderChange}
                      placeholder="Enter PO number"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">PO Date *</label>
                    <Input
                      type="date"
                      name="po_date"
                      value={headerForm.po_date}
                      onChange={handleHeaderChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Committed Delivery Date</label>
                    <Input
                      type="date"
                      name="committed_delivery_date"
                      value={headerForm.committed_delivery_date}
                      onChange={handleHeaderChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Vendor Document Number</label>
                    <Input
                      type="text"
                      name="vendor_doc_number"
                      value={headerForm.vendor_doc_number}
                      onChange={handleHeaderChange}
                      placeholder="Invoice/Bill number"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Document Dates */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Vendor Document Date</label>
                    <Input
                      type="date"
                      name="vendor_doc_date"
                      value={headerForm.vendor_doc_date}
                      onChange={handleHeaderChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Receipt Date</label>
                    <Input
                      type="date"
                      name="receipt_date"
                      value={headerForm.receipt_date}
                      onChange={handleHeaderChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Entry Date (readonly)</label>
                    <Input type="date" value={today} disabled className="mt-1 bg-gray-100" />
                  </div>
                </div>

                {/* Receipt Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Receiver/Security Name</label>
                    <Input
                      type="text"
                      name="receiver_name"
                      value={headerForm.receiver_name}
                      onChange={handleHeaderChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Vehicle Number</label>
                    <Input
                      type="text"
                      name="vehicle_number"
                      value={headerForm.vehicle_number}
                      onChange={handleHeaderChange}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="text-sm font-medium">Invoice Photo</label>
                  <div className="mt-2 flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="mt-1"
                    />
                    {headerForm.photo_url && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Photo uploaded
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="submit" disabled={loading} className="gap-2">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save & Continue to Items
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'items' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Item Entry</CardTitle>
                    <CardDescription>Gate Pass: {gatePassNumber}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <QRScanner onScan={handleQRScan} buttonLabel="Scan QR to Add Item" />
                    <Button onClick={addItemRow} variant="outline">
                      + Add Item
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {itemRows.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No items added yet. Click "Add Item" to get started.</p>
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
                          <th className="text-left py-2 px-2">Total Qty</th>
                          <th className="text-left py-2 px-2">QR</th>
                          <th className="text-left py-2 px-2">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemRows.map((row, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="py-2 px-2">
                              <select
                                value={row.item_id || ''}
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
                                value={row.uom_id || ''}
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
                            <td className="py-2 px-2 font-semibold">{row.total_qty || 0}</td>
                            <td className="py-2 px-2">
                              <Checkbox
                                checked={row.generate_qr || false}
                                onCheckedChange={checked => updateItemRow(idx, 'generate_qr', checked)}
                              />
                            </td>
                            <td className="py-2 px-2">
                              <Input
                                type="text"
                                value={row.remarks || ''}
                                onChange={e => updateItemRow(idx, 'remarks', e.target.value)}
                                placeholder="Remarks"
                                className="text-xs"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex gap-2 justify-end mt-6">
                  <Button variant="outline" onClick={() => setStep('header')} disabled={loading}>
                    Back
                  </Button>
                  <Button variant="outline" onClick={addItemRow}>
                    + Add Another Item
                  </Button>
                  <Button onClick={handleCompleteGRN} disabled={loading} className="gap-2">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Complete GRN
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'complete' && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <CardTitle className="text-green-900">GRN Completed Successfully</CardTitle>
                  <CardDescription className="text-green-800">GRN #{grnNumber}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={handleReset} size="lg">
                Create New GRN
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent GRNs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent GRNs</CardTitle>
            <CardDescription>Last 20 goods receipts</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>GRN #</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>PO #</TableHead>
                  <TableHead>Receipt Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentGRNs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-4">
                      No GRNs found
                    </TableCell>
                  </TableRow>
                ) : (
                  recentGRNs.map(grn => (
                    <TableRow key={grn.id}>
                      <TableCell className="font-medium">{grn.gate_pass_number}</TableCell>
                      <TableCell>{grn.vendor_name}</TableCell>
                      <TableCell>{grn.po_number}</TableCell>
                      <TableCell>{grn.receipt_date}</TableCell>
                      <TableCell>{grn.vehicle_number || 'N/A'}</TableCell>
                      <TableCell>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          {grn.status}
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
