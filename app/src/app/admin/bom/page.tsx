'use client';

import { useEffect, useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/lib/supabase';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Save,
  Loader,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Item {
  id: string;
  code: string;
  name: string;
  uom?: string;
  sub_category?: string;
  inventory_item?: boolean;
}

interface BomItem {
  id?: string;
  component_item_id: string;
  component_code?: string;
  component_name?: string;
  qty_per_unit: number;
  uom?: string;
  wastage_pct?: number;
  notes?: string;
  sort_order?: number;
}

interface Bom {
  id: string;
  fg_item_id: string;
  bom_code?: string;
  description?: string;
  output_qty: number;
  uom?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  fg_code?: string;
  fg_name?: string;
  item_count?: number;
}

export default function BOMManagementPage() {
  const [boms, setBoms] = useState<Bom[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBom, setEditingBom] = useState<Bom | null>(null);
  const [expandedBom, setExpandedBom] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, BomItem[]>>({});

  // Form state
  const [headerForm, setHeaderForm] = useState({
    fg_item_id: '',
    bom_code: '',
    description: '',
    output_qty: 1,
    uom: '',
    status: 'active',
    notes: '',
  });
  const [itemRows, setItemRows] = useState<BomItem[]>([]);
  const [fgSearch, setFgSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bomsRes, itemsRes] = await Promise.all([
        supabase
          .from('boms')
          .select('*, items!boms_fg_item_id_fkey(code, name)')
          .order('created_at', { ascending: false }),
        supabase.from('items').select('id, code, name, uom, sub_category, inventory_item').order('code'),
      ]);

      // Fetch item counts per BOM
      const bomIds = (bomsRes.data || []).map((b: any) => b.id);
      const countsMap: Record<string, number> = {};
      if (bomIds.length > 0) {
        const { data: bomItemsData } = await supabase
          .from('bom_items')
          .select('bom_id')
          .in('bom_id', bomIds);
        (bomItemsData || []).forEach((bi: any) => {
          countsMap[bi.bom_id] = (countsMap[bi.bom_id] || 0) + 1;
        });
      }

      const enrichedBoms: Bom[] = (bomsRes.data || []).map((b: any) => ({
        ...b,
        fg_code: b.items?.code,
        fg_name: b.items?.name,
        item_count: countsMap[b.id] || 0,
      }));

      setBoms(enrichedBoms);
      setItems(itemsRes.data || []);
    } catch (err) {
      console.error('Error fetching BOM data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBomItems = async (bomId: string) => {
    if (expandedItems[bomId]) return; // already loaded
    const { data } = await supabase
      .from('bom_items')
      .select('*, items!bom_items_component_item_id_fkey(code, name)')
      .eq('bom_id', bomId)
      .order('sort_order', { ascending: true });
    const mapped: BomItem[] = (data || []).map((bi: any) => ({
      id: bi.id,
      component_item_id: bi.component_item_id,
      component_code: bi.items?.code,
      component_name: bi.items?.name,
      qty_per_unit: bi.qty_per_unit,
      uom: bi.uom,
      wastage_pct: bi.wastage_pct,
      notes: bi.notes,
      sort_order: bi.sort_order,
    }));
    setExpandedItems((prev) => ({ ...prev, [bomId]: mapped }));
  };

  const toggleExpand = async (bomId: string) => {
    if (expandedBom === bomId) {
      setExpandedBom(null);
    } else {
      setExpandedBom(bomId);
      await loadBomItems(bomId);
    }
  };

  const filteredBoms = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return boms;
    return boms.filter(
      (b) =>
        (b.fg_code || '').toLowerCase().includes(q) ||
        (b.fg_name || '').toLowerCase().includes(q) ||
        (b.bom_code || '').toLowerCase().includes(q) ||
        (b.description || '').toLowerCase().includes(q)
    );
  }, [boms, searchTerm]);

  const filteredFgItems = useMemo(() => {
    const q = fgSearch.trim().toLowerCase();
    if (!q) return [];
    return items
      .filter(
        (i) =>
          i.code.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [items, fgSearch]);

  const openNew = () => {
    setEditingBom(null);
    setHeaderForm({
      fg_item_id: '',
      bom_code: '',
      description: '',
      output_qty: 1,
      uom: '',
      status: 'active',
      notes: '',
    });
    setItemRows([{ component_item_id: '', qty_per_unit: 0 }]);
    setFgSearch('');
    setShowForm(true);
  };

  const openEdit = async (bom: Bom) => {
    setEditingBom(bom);
    setHeaderForm({
      fg_item_id: bom.fg_item_id,
      bom_code: bom.bom_code || '',
      description: bom.description || '',
      output_qty: bom.output_qty,
      uom: bom.uom || '',
      status: bom.status,
      notes: bom.notes || '',
    });
    setFgSearch(bom.fg_code ? `${bom.fg_code} — ${bom.fg_name}` : '');
    await loadBomItems(bom.id);
    const rows = expandedItems[bom.id] || [];
    // need to re-fetch since expandedItems may not be populated yet
    const { data } = await supabase
      .from('bom_items')
      .select('*, items!bom_items_component_item_id_fkey(code, name, uom)')
      .eq('bom_id', bom.id)
      .order('sort_order', { ascending: true });
    const fetched: BomItem[] = (data || []).map((bi: any) => ({
      id: bi.id,
      component_item_id: bi.component_item_id,
      component_code: bi.items?.code,
      component_name: bi.items?.name,
      qty_per_unit: bi.qty_per_unit,
      uom: bi.uom || bi.items?.uom,
      wastage_pct: bi.wastage_pct,
      notes: bi.notes,
      sort_order: bi.sort_order,
    }));
    setItemRows(fetched.length ? fetched : [{ component_item_id: '', qty_per_unit: 0 }]);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingBom(null);
    setItemRows([]);
    setFgSearch('');
  };

  const addItemRow = () => {
    setItemRows((prev) => [...prev, { component_item_id: '', qty_per_unit: 0 }]);
  };

  const removeItemRow = (idx: number) => {
    setItemRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItemRow = (idx: number, patch: Partial<BomItem>) => {
    setItemRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const handleComponentSelect = (idx: number, itemId: string) => {
    const item = items.find((x) => x.id === itemId);
    updateItemRow(idx, {
      component_item_id: itemId,
      component_code: item?.code,
      component_name: item?.name,
      uom: item?.uom,
    });
  };

  const handleSave = async () => {
    if (!headerForm.fg_item_id) {
      alert('Please select a Finished Good item');
      return;
    }
    const validRows = itemRows.filter(
      (r) => r.component_item_id && r.qty_per_unit > 0
    );
    if (validRows.length === 0) {
      alert('Please add at least one component with qty > 0');
      return;
    }

    setSaving(true);
    try {
      let bomId: string;

      if (editingBom) {
        // Update header
        const { error: updErr } = await supabase
          .from('boms')
          .update({
            bom_code: headerForm.bom_code || null,
            description: headerForm.description || null,
            output_qty: headerForm.output_qty,
            uom: headerForm.uom || null,
            status: headerForm.status,
            notes: headerForm.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingBom.id);
        if (updErr) throw updErr;
        bomId = editingBom.id;

        // Delete existing items
        await supabase.from('bom_items').delete().eq('bom_id', bomId);
      } else {
        // Deactivate any existing active BOM for this FG
        await supabase
          .from('boms')
          .update({ status: 'inactive' })
          .eq('fg_item_id', headerForm.fg_item_id)
          .eq('status', 'active');

        const { data, error } = await supabase
          .from('boms')
          .insert({
            fg_item_id: headerForm.fg_item_id,
            bom_code: headerForm.bom_code || null,
            description: headerForm.description || null,
            output_qty: headerForm.output_qty,
            uom: headerForm.uom || null,
            status: headerForm.status,
            notes: headerForm.notes || null,
          })
          .select('id')
          .single();
        if (error) throw error;
        bomId = data.id;
      }

      // Insert items
      const rowsToInsert = validRows.map((r, i) => ({
        bom_id: bomId,
        component_item_id: r.component_item_id,
        qty_per_unit: r.qty_per_unit,
        uom: r.uom || null,
        wastage_pct: r.wastage_pct || 0,
        notes: r.notes || null,
        sort_order: i,
      }));
      const { error: insErr } = await supabase.from('bom_items').insert(rowsToInsert);
      if (insErr) throw insErr;

      setExpandedItems({}); // invalidate cache
      await fetchData();
      closeForm();
    } catch (err: any) {
      console.error(err);
      alert('Failed to save BOM: ' + (err?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bom: Bom) => {
    if (!confirm(`Delete BOM for ${bom.fg_code} — ${bom.fg_name}?`)) return;
    try {
      const { error } = await supabase.from('boms').delete().eq('id', bom.id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      console.error(err);
      alert('Failed to delete BOM: ' + (err?.message || 'Unknown error'));
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-8 h-8 text-blue-600" />
              BOM Management
            </h1>
            <p className="text-gray-600 mt-1">
              Create and manage Bills of Materials for Finished Goods
            </p>
          </div>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" />
            New BOM
          </Button>
        </div>

        {/* Search */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by FG code, name, or BOM code…"
              className="pl-10"
            />
          </div>
          <div className="text-sm text-gray-600">
            {filteredBoms.length} BOM{filteredBoms.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* BOMs list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : filteredBoms.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No BOMs yet. Click &ldquo;New BOM&rdquo; to create one.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBoms.map((bom) => (
              <div key={bom.id} className="bg-white border rounded-lg shadow-sm">
                <div className="flex items-center justify-between p-4">
                  <button
                    onClick={() => toggleExpand(bom.id)}
                    className="flex-1 flex items-center gap-4 text-left hover:bg-gray-50 -m-2 p-2 rounded"
                  >
                    {expandedBom === bom.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {bom.fg_code} — {bom.fg_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {bom.bom_code && <span className="mr-3">BOM: {bom.bom_code}</span>}
                        Output: {bom.output_qty} {bom.uom || ''} · {bom.item_count} component
                        {bom.item_count === 1 ? '' : 's'}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        bom.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {bom.status}
                    </span>
                  </button>
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm" onClick={() => openEdit(bom)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(bom)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Expanded items */}
                {expandedBom === bom.id && (
                  <div className="border-t bg-gray-50 p-4">
                    {!expandedItems[bom.id] ? (
                      <div className="text-sm text-gray-500">Loading…</div>
                    ) : expandedItems[bom.id].length === 0 ? (
                      <div className="text-sm text-gray-500">No components</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="text-left text-gray-600">
                          <tr>
                            <th className="py-2 pr-3">Component Code</th>
                            <th className="py-2 pr-3">Component Name</th>
                            <th className="py-2 pr-3 text-right">Qty / Unit</th>
                            <th className="py-2 pr-3">UOM</th>
                            <th className="py-2 pr-3 text-right">Wastage %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expandedItems[bom.id].map((bi) => (
                            <tr key={bi.id} className="border-t">
                              <td className="py-2 pr-3 font-medium">{bi.component_code}</td>
                              <td className="py-2 pr-3">{bi.component_name}</td>
                              <td className="py-2 pr-3 text-right">{bi.qty_per_unit}</td>
                              <td className="py-2 pr-3">{bi.uom || '-'}</td>
                              <td className="py-2 pr-3 text-right">{bi.wastage_pct || 0}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <h2 className="text-xl font-semibold">
                  {editingBom ? 'Edit BOM' : 'New BOM'}
                </h2>
                <button onClick={closeForm} className="text-gray-500 hover:text-gray-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Finished Good (FG) Item *
                    </label>
                    <Input
                      value={fgSearch}
                      onChange={(e) => {
                        setFgSearch(e.target.value);
                        setHeaderForm((p) => ({ ...p, fg_item_id: '' }));
                      }}
                      placeholder="Search by item code or name…"
                      disabled={!!editingBom}
                    />
                    {!editingBom && filteredFgItems.length > 0 && !headerForm.fg_item_id && (
                      <div className="absolute z-10 top-full left-0 right-0 bg-white border rounded-md shadow mt-1 max-h-52 overflow-y-auto">
                        {filteredFgItems.map((it) => (
                          <button
                            key={it.id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-gray-50"
                            onClick={() => {
                              setHeaderForm((p) => ({
                                ...p,
                                fg_item_id: it.id,
                                uom: it.uom || p.uom,
                              }));
                              setFgSearch(`${it.code} — ${it.name}`);
                            }}
                          >
                            <div className="font-medium text-sm">{it.code}</div>
                            <div className="text-xs text-gray-500">{it.name}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      BOM Code
                    </label>
                    <Input
                      value={headerForm.bom_code}
                      onChange={(e) =>
                        setHeaderForm((p) => ({ ...p, bom_code: e.target.value }))
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Output Qty *
                    </label>
                    <Input
                      type="number"
                      min="0.0001"
                      step="0.01"
                      value={headerForm.output_qty}
                      onChange={(e) =>
                        setHeaderForm((p) => ({
                          ...p,
                          output_qty: parseFloat(e.target.value) || 1,
                        }))
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      How many FG units this BOM produces (usually 1).
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      UOM
                    </label>
                    <Input
                      value={headerForm.uom}
                      onChange={(e) =>
                        setHeaderForm((p) => ({ ...p, uom: e.target.value }))
                      }
                      placeholder="e.g., Nos"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Description
                    </label>
                    <Input
                      value={headerForm.description}
                      onChange={(e) =>
                        setHeaderForm((p) => ({ ...p, description: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Status
                    </label>
                    <select
                      className="w-full border rounded-md h-9 px-2"
                      value={headerForm.status}
                      onChange={(e) =>
                        setHeaderForm((p) => ({ ...p, status: e.target.value }))
                      }
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Components table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">
                      Components (RM / SFG)
                    </h3>
                    <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Component
                    </Button>
                  </div>
                  <div className="border rounded-md overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-left text-gray-700">
                        <tr>
                          <th className="px-3 py-2 w-1/3">Component</th>
                          <th className="px-3 py-2 text-right w-32">Qty / FG Unit</th>
                          <th className="px-3 py-2 w-24">UOM</th>
                          <th className="px-3 py-2 text-right w-28">Wastage %</th>
                          <th className="px-3 py-2">Notes</th>
                          <th className="px-3 py-2 w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {itemRows.map((row, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-3 py-2">
                              <select
                                className="w-full border rounded-md h-8 px-2"
                                value={row.component_item_id}
                                onChange={(e) =>
                                  handleComponentSelect(idx, e.target.value)
                                }
                              >
                                <option value="">— Select —</option>
                                {items.map((it) => (
                                  <option key={it.id} value={it.id}>
                                    {it.code} — {it.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.0001"
                                value={row.qty_per_unit || ''}
                                onChange={(e) =>
                                  updateItemRow(idx, {
                                    qty_per_unit: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="text-right h-8"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                value={row.uom || ''}
                                onChange={(e) =>
                                  updateItemRow(idx, { uom: e.target.value })
                                }
                                className="h-8"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={row.wastage_pct || 0}
                                onChange={(e) =>
                                  updateItemRow(idx, {
                                    wastage_pct: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="text-right h-8"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                value={row.notes || ''}
                                onChange={(e) =>
                                  updateItemRow(idx, { notes: e.target.value })
                                }
                                className="h-8"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeItemRow(idx)}
                                className="text-red-600 hover:bg-red-50 p-1 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Notes
                  </label>
                  <textarea
                    className="w-full border rounded-md p-2 h-20"
                    value={headerForm.notes}
                    onChange={(e) =>
                      setHeaderForm((p) => ({ ...p, notes: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t px-5 py-4">
                <Button variant="outline" onClick={closeForm} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save BOM
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
