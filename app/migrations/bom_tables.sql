-- GEPL RJCA Stock Management — BOM Tables Migration
-- Adds boms (header) + bom_items (components) for single-level BOM management.
-- Already applied to project kijehrisbwvljozxuzzy. Re-run is idempotent via IF NOT EXISTS.

-- ============================================================
-- boms: BOM header — one active BOM per FG item
-- ============================================================
CREATE TABLE IF NOT EXISTS public.boms (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fg_item_id   uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  name         text,
  version      integer NOT NULL DEFAULT 1,
  is_active    boolean NOT NULL DEFAULT true,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boms_fg_item_id ON public.boms(fg_item_id);
CREATE INDEX IF NOT EXISTS idx_boms_is_active ON public.boms(is_active);

-- ============================================================
-- bom_items: BOM components (RM / SFG consumed per FG unit)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bom_items (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id             uuid NOT NULL REFERENCES public.boms(id) ON DELETE CASCADE,
  component_item_id  uuid NOT NULL REFERENCES public.items(id),
  qty_per_unit       numeric NOT NULL DEFAULT 0,
  uom                text,
  wastage_pct        numeric DEFAULT 0,
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bom_items_bom_id ON public.bom_items(bom_id);
CREATE INDEX IF NOT EXISTS idx_bom_items_component_item_id ON public.bom_items(component_item_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.boms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom_items ENABLE ROW LEVEL SECURITY;

-- Read: any authenticated user
DROP POLICY IF EXISTS "boms read auth" ON public.boms;
CREATE POLICY "boms read auth" ON public.boms
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "bom_items read auth" ON public.bom_items;
CREATE POLICY "bom_items read auth" ON public.bom_items
  FOR SELECT TO authenticated USING (true);

-- Write: authenticated users (tighten per-role later if needed)
DROP POLICY IF EXISTS "boms write auth" ON public.boms;
CREATE POLICY "boms write auth" ON public.boms
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bom_items write auth" ON public.bom_items;
CREATE POLICY "bom_items write auth" ON public.bom_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- Updated-at trigger for boms
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_boms_updated_at ON public.boms;
CREATE TRIGGER trg_boms_updated_at
  BEFORE UPDATE ON public.boms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
