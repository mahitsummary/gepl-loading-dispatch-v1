'use client';

import { useState, useCallback, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/lib/supabase';
import { updateStock, generateDocNumber } from '@/lib/stock';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
}

interface Batch {
  id: string;
  batch_number: string;
  item_id: string;
  available_qty: number;
  created_at: string;
}

interface IssueItem {
  item_id: string;
  item_name?: string;
  batch_id: string;
  batch_number?: string;
  uom_id: string;
  qty_issued: number;
  remarks?: string;
}

interface RecentIssue {
  id: string;
  issue_note_number: string;
  issue_date: string;
  plant_name: string;
  warehouse_name: string;
  issued_by: string;
  total_items: number;
  created_at: string;
}

const today = new Date().toISOString().split('T')[0];

export default function IssueToProductionPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    issue_date: today,
    plant_id: '',
    warehouse_id: '',
  });

  const [itemRows, setItemRows] = useState<IssueItem[]>([]);

  // Lookup data
  const [items, setItems] = useState<Item[]>([]);
  const [uoms, setUoms] = useState<UOM[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [recentIssues, setRecentIssues] = useState<RecentIssue[]>([]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [itemsRes, uomsRes, plantsRes, warehousesRes, issuesRes] = await Promise.all([
        supabase.from('items').select('id, code, name').order('code'),
        supabase.from('uoms').select('id, name'),
        supabase.from('plants').select('id, name'),
        supabase.from('warehouses').select('id, name'),
        supabase
          .from('production_issues')
          .select(
            'id, issue_note_number, issue_date, plant_id, warehouse_id, issued_by, (plants(name)), (warehouses(name))'
          )
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      if (itemsRes.data) setItems(itemsRes.data);
      if (uomsRes.data) setUoms(uomsRes.data);
      if (plantsRes.data) setPlants(plantsRes.data);
      if (warehousesRes.data) setWarehouses(warehousesRes.data);
      if (issuesRes.data) {
        // Count items for each issue
        const issueIds = issuesRes.data.map(i => i.id);
        if (issueIds.length > 0) {
          const { data: itemsData } = await supabase
            .from('production_issue_items')
            .select('production_issue_id')
            .in('production_issue_id', issueIds);

          const itemCounts = itemsData?.reduce((acc: any, item: any) => {
            acc[item.production_issue_id] = (acc[item.production_issue_id] || 0) + 1;
            return acc;
          }, {});

          setRecentIssues(
            issuesRes.data.map((issue: any) => ({
              id: issue.id,
              issue_note_number: issue.issue_note_number,
              issue_date: issue.issue_date,
              plant_name: issue.plants?.name || 'N/A',
              warehouse_name: issue.warehouses?.name || 'N/A',
              issued_by: issue.issued_by || 'N/A',
              total_items: itemCounts?.[issue.id] || 0,
              created_at: issue.created_at,
            }))
          );
        }
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

  // Load batches when item or warehouse changes
  const loadBatches = useCallback(async (itemId: string, warehouseId: string) => {
    if (!itemId || !warehouseId) return;

    try {
      // Get batches for this item in FIFO order
      const { data: batchesData } = await supabase
        .from('batches')
        .select('id, batch_number, item_id, available_qty, created_at')
        .eq('item_id', itemId)
        .eq('warehouse_id', warehouseId)
        .gt('available_qty', 0)
        .order('created_at', { ascending: true });

      if (batchesData) {
        setBatches(batchesData);
      }
    } catch (err) {
      console.error('Failed to load batches:', err);
    }
  }, []);

  // Add item row
  const addItemRow = () => {
    setItemRows(prev => [
      ...prev,
      {
        item_id: '',
        batch_id: '',
        uom_id: '',
        qty_issued: 0,
        remarks: '',
      },
    ]);
  };

  // Handle QR scan - add a row based on parsed QR code
  const handleIssueQRScan = (parsed: ParsedQRCode) => {
    if (!parsed.valid || !parsed.itemCode) return;
    const matched = items.find(
      (it: any) => it.code?.toUpperCase() === (parsed.itemCode || '').toUpperCase()
    );
    const qty = parsed.qtyPerPack || 0;
    setItemRows(prev => [
      ...prev,
      {
        item_id: matched?.id || '',
        item_name: matched ? `${matched.code} - ${matched.name}` : undefined,
        batch_id: '',
        uom_id: '',
        qty_issued: qty,
        remarks: matched ? '' : `Scanned code: ${parsed.itemCode}`,
      },
    ]);
    if (matched && formData.warehouse_id) {
      // Asynchronously load batches for selected matched item
      loadBatches(matched.id, formData.warehouse_id).catch(() => {});
    }
  };

  // Update item row
  const updateItemRow = async (index: number, field: string, value: any) => {
    const newRows = [...itemRows];
    newRows[index] = { ...newRows[index], [field]: value };

    // When item is selected, set default batch and load available batches
    if (field === 'item_id') {
      const item = items.find(i => i.id === value);
      if (item) {
        newRows[index].item_name = `${item.code} - ${item.name}`;
        // Load batches for this item
        await loadBatches(value, formData.warehouse_id);
        newRows[index].batch_id = '';
        newRows[index].batch_number = '';
      }
    }

    // When batch is selected, show batch number
    if (field === 'batch_id') {
      const batch = batches.find(b => b.id === value);
      if (batch) {
        newRows[index].batch_number = batch.batch_number;
      }
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

  // Handle select changes
  const handleSelectChange = async (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Reset item rows when warehouse changes
    if (field === 'warehouse_id') {
      setItemRows([]);
    }
  };

  // Validate form
  const validateForm = (): string | null => {
    if (!formData.plant_id) return 'Plant is required';
    if (!formData.warehouse_id) return 'Warehouse is required';
    if (itemRows.length === 0) return 'Please add at least one item';

    for (const row of itemRows) {
      if (!row.item_id) return 'All items must be selected';
      if (!row.batch_id) return 'All batches must be selected';
      if (!row.uom_id) return 'All UOMs must be selected';
      if (row.qty_issued <= 0) return 'All quantities must be greater than 0';

      // Check if qty exceeds batch available qty
      const batch = batches.find(b => b.id === row.batch_id);
      if (batch && row.qty_issued > batch.available_qty) {
        return `Quantity ${row.qty_issued} exceeds available quantity ${batch.available_qty} for batch ${batch.batch_number}`;
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

      // Generate issue note number
      const issueNumber = await generateDocNumber('IN');

      // Insert issue header
      const { data: issueData, error: issueError } = await supabase
        .from('production_issues')
        .insert([
          {
            issue_note_number: issueNumber,
            issue_date: formData.issue_date,
            plant_id: formData.plant_id,
            warehouse_id: formData.warehouse_id,
            issued_by: user?.id,
          },
        ])
        .select();

      if (issueError) throw issueError;

      const issueId = issueData?.[0]?.id;

      // Insert item rows
      const itemsToInsert = itemRows.map(row => ({
        production_issue_id: issueId,
        item_id: row.item_id,
        batch_id: row.batch_id,
        uom_id: row.uom_id,
        qty_issued: row.qty_issued,
        remarks: row.remarks,
      }));

      const { error: itemsError } = await supabase.from('production_issue_items').insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Update stock for each item
      for (const row of itemRows) {
        await updateStock({
          item_id: row.item_id,
          warehouse_id: formData.warehouse_id,
          direction: 'out',
          quantity: row.qty_issued,
          reference_number: issueId,
          reference_type: 'ISSUE_PRODUCTION',
        });
      }

      setSuccess(`Issue note created successfully! Issue Note #${issueNumber}`);

      // Reset form
      setFormData({ issue_date: today, plant_id: '', warehouse_id: '' });
      setItemRows([]);

      // Reload issues
      loadInitialData();
    } catch (err) {
      setError('Failed to create issue note');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Issue to Production</h1>
          <p className="text-gray-600 mt-2">Issue materials from warehouse to production</p>
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
            <CardTitle>Issue Materials</CardTitle>
            <CardDescription>Create a production issue note</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Header Section */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">Issue Date</label>
                  <Input
                    type="date"
                    name="issue_date"
                    value={formData.issue_date}
                    onChange={handleFormChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Plant *</label>
                  <Select value={formData.plant_id} onValueChange={v => handleSelectChange('plant_id', v)}>
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
                <div>
                  <label className="text-sm font-medium">Warehouse *</label>
                  <Select value={formData.warehouse_id} onValueChange={v => handleSelectChange('warehouse_id', v)}>
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
                <div>
                  <label className="text-sm font-medium">Issued By (readonly)</label>
                  <Input type="text" value={user?.email || 'System'} disabled className="mt-1 bg-gray-100" />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Materials to Issue</h3>
                  <div className="flex gap-2">
                    <QRScanner
                      onScan={handleIssueQRScan}
                      buttonLabel="Scan QR"
                      disabled={!formData.warehouse_id}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addItemRow}
                      disabled={!formData.warehouse_id}
                    >
                      + Add Item
                    </Button>
                  </div>
                </div>

                {!formData.warehouse_id && (
                  <div className="text-center py-4 text-gray-600 bg-blue-50 rounded-md text-sm">
                    <p>Please select a warehouse first to add items</p>
                  </div>
                )}

                {formData.warehouse_id && itemRows.length === 0 && (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md">
                    <p>No items added. Click "Add Item" to get started.</p>
                  </div>
                )}

                {formData.warehouse_id && itemRows.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Item Code/Name</th>
                          <th className="text-left py-2 px-2">Batch (FIFO)</th>
                          <th className="text-left py-2 px-2">UOM</th>
                          <th className="text-right py-2 px-2">Qty Issued</th>
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
                                value={row.batch_id}
                                onChange={e => updateItemRow(idx, 'batch_id', e.target.value)}
                                className="border rounded px-2 py-1 w-full"
                                disabled={!row.item_id}
                              >
                                <option value="">Select batch</option>
                                {batches
                                  .filter(b => b.item_id === row.item_id)
                                  .map(batch => (
                                    <option key={batch.id} value={batch.id}>
                                      {batch.batch_number} (Qty: {batch.available_qty})
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
                                value={row.qty_issued || ''}
                                onChange={e => updateItemRow(idx, 'qty_issued', Number(e.target.value))}
                                placeholder="0"
                                className="w-24 text-right"
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

                {formData.warehouse_id && (
                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addItemRow}
                      disabled={itemRows.length === 0}
                    >
                      + Add Another Item
                    </Button>
                    <Button type="submit" disabled={submitting} className="gap-2">
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      Create Issue Note
                    </Button>
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Recent Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Issues</CardTitle>
            <CardDescription>Last 20 production issue notes</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue Note #</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Plant</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Issued By</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentIssues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-4">
                      No issue notes found
                    </TableCell>
                  </TableRow>
                ) : (
                  recentIssues.map(issue => (
                    <TableRow key={issue.id}>
                      <TableCell className="font-medium">{issue.issue_note_number}</TableCell>
                      <TableCell>{issue.issue_date}</TableCell>
                      <TableCell>{issue.plant_name}</TableCell>
                      <TableCell>{issue.warehouse_name}</TableCell>
                      <TableCell className="text-sm">{issue.issued_by}</TableCell>
                      <TableCell className="text-center font-semibold">{issue.total_items}</TableCell>
                      <TableCell className="text-sm text-gray-500">{issue.created_at.split('T')[0]}</TableCell>
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
