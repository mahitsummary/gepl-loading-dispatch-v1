/**
 * BOM helper utilities.
 * Fetches the active BOM for an FG item and computes component consumption.
 */

import { supabase } from './supabase';

export interface BOMComponent {
  bom_item_id: string;
  component_item_id: string;
  component_code: string;
  component_name: string;
  qty_per_unit: number;
  uom?: string;
  wastage_pct?: number;
  sort_order?: number;
  required_qty?: number; // computed: qty_per_unit * qty_produced * (1 + wastage_pct/100) / output_qty
}

export interface BOMHeader {
  id: string;
  fg_item_id: string;
  bom_code?: string;
  description?: string;
  output_qty: number;
  uom?: string;
  status: string;
}

/**
 * Fetch the active BOM + components for a given FG item.
 * Returns null if no active BOM exists.
 */
export async function getActiveBOM(fgItemId: string): Promise<{
  header: BOMHeader;
  components: BOMComponent[];
} | null> {
  const { data: bomData, error: bomErr } = await supabase
    .from('boms')
    .select('*')
    .eq('fg_item_id', fgItemId)
    .eq('status', 'active')
    .maybeSingle();

  if (bomErr || !bomData) return null;

  const { data: itemsData, error: itemsErr } = await supabase
    .from('bom_items')
    .select('*, items!bom_items_component_item_id_fkey(code, name, uom)')
    .eq('bom_id', bomData.id)
    .order('sort_order', { ascending: true });

  if (itemsErr) return null;

  const components: BOMComponent[] = (itemsData || []).map((bi: any) => ({
    bom_item_id: bi.id,
    component_item_id: bi.component_item_id,
    component_code: bi.items?.code || '',
    component_name: bi.items?.name || '',
    qty_per_unit: bi.qty_per_unit,
    uom: bi.uom || bi.items?.uom,
    wastage_pct: bi.wastage_pct || 0,
    sort_order: bi.sort_order,
  }));

  return {
    header: {
      id: bomData.id,
      fg_item_id: bomData.fg_item_id,
      bom_code: bomData.bom_code,
      description: bomData.description,
      output_qty: bomData.output_qty || 1,
      uom: bomData.uom,
      status: bomData.status,
    },
    components,
  };
}

/**
 * Compute consumption rows based on BOM and produced quantity.
 */
export function computeBOMConsumption(
  bom: { header: BOMHeader; components: BOMComponent[] },
  qtyProduced: number
): BOMComponent[] {
  const factor = qtyProduced / (bom.header.output_qty || 1);
  return bom.components.map((c) => ({
    ...c,
    required_qty: +(c.qty_per_unit * factor * (1 + (c.wastage_pct || 0) / 100)).toFixed(4),
  }));
}
