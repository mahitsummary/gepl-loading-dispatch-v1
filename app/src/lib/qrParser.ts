/**
 * GEPL QR Code Parser
 *
 * QR Format (observed):
 *   {prefix1}/{prefix2}-{itemCode}-{uom}--{qtyPerPack}-{branchCode}-{category}-{vendorRef}_{grnNo}_{serial}_{date}
 *
 * Examples:
 *   "21/250.00-RBTR0024-Nos--400.00-GE-RMImport-103852_1_226_03032026"
 *     → itemCode=RBTR0024, uom=Nos, qtyPerPack=400, branch=GE, category=RMImport,
 *       vendorRef=103852, grnNo=1, serial=226, date=03/03/2026
 *
 *   "250/350.00-RBTR0017-Nos--400.00-GE-RMImport-103102_1_174_26122025"
 *     → itemCode=RBTR0017, qtyPerPack=400, vendorRef=103102, grnNo=1, serial=174
 *
 *   "61/100.00-RMAC0001-Nos--1200.00-GE-RMImport-16112024_100851_1"
 *     → itemCode=RMAC0001, qtyPerPack=1200, (3-part suffix: a/b/c)
 *
 * The parser is forgiving — if a part is missing, the field is undefined.
 */

export interface ParsedQRCode {
  raw: string;
  prefix1?: string;          // e.g. "21"
  prefix2?: string;          // e.g. "250.00"
  itemCode?: string;         // e.g. "RBTR0024"
  uom?: string;              // e.g. "Nos"
  qtyPerPack?: number;       // e.g. 400
  branchCode?: string;       // e.g. "GE"
  category?: string;         // e.g. "RMImport"
  vendorRef?: string;        // first numeric suffix part
  grnNo?: string;            // second numeric suffix part
  serial?: string;           // third numeric suffix part
  issuedDate?: string;       // "DD/MM/YYYY" formatted if detected
  suffixParts: string[];     // raw suffix split by "_"
  valid: boolean;            // true if we could parse an itemCode
}

/**
 * Detect whether an 8-digit string looks like a DDMMYYYY date.
 * Returns "DD/MM/YYYY" if valid, null otherwise.
 */
function tryParseDDMMYYYY(s: string): string | null {
  if (!/^\d{8}$/.test(s)) return null;
  const dd = s.substring(0, 2);
  const mm = s.substring(2, 4);
  const yyyy = s.substring(4, 8);
  const day = parseInt(dd, 10);
  const month = parseInt(mm, 10);
  const year = parseInt(yyyy, 10);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (year < 2000 || year > 2100) return null;
  return `${dd}/${mm}/${yyyy}`;
}

export function parseQRCode(raw: string): ParsedQRCode {
  const result: ParsedQRCode = {
    raw: raw.trim(),
    suffixParts: [],
    valid: false,
  };

  if (!raw || !raw.trim()) return result;

  const text = raw.trim();

  // Split on first "/" to get prefix1
  let remainder = text;
  const slashIdx = text.indexOf('/');
  if (slashIdx > 0) {
    result.prefix1 = text.substring(0, slashIdx);
    remainder = text.substring(slashIdx + 1);
  }

  // Split remainder on "-" (but note the "--" between uom and qtyPerPack)
  // Normalize "--" to "- -" to keep consistent splits, then filter empties.
  const segments = remainder.split('-').map((s) => s.trim());

  // Expected structure after prefix1/:
  // [prefix2, itemCode, uom, "", qtyPerPack, branch, category, suffix]
  // i.e. empty string between uom and qtyPerPack (because of "--")
  if (segments.length >= 2) result.prefix2 = segments[0];
  if (segments.length >= 3) result.itemCode = segments[1] || undefined;
  if (segments.length >= 4) result.uom = segments[2] || undefined;
  // segments[3] should be empty (the double dash)

  // Find the qtyPerPack — it's the first numeric segment after an empty one
  let idx = 3;
  if (segments[idx] === '' && segments.length > idx + 1) {
    idx += 1;
    const qty = parseFloat(segments[idx]);
    if (!isNaN(qty)) result.qtyPerPack = qty;
    idx += 1;
  }

  if (segments.length > idx) result.branchCode = segments[idx++] || undefined;
  if (segments.length > idx) result.category = segments[idx++] || undefined;

  // Remaining segments are the suffix chunk. The suffix contains underscores.
  const suffixChunk = segments.slice(idx).join('-');
  if (suffixChunk) {
    const parts = suffixChunk.split('_');
    result.suffixParts = parts;

    // Position-based interpretation of suffix:
    //   parts[0] = vendorRef
    //   parts[1] = grnNo
    //   parts[2] = serial
    //   parts[3] = issued date (DDMMYYYY) — only treat as date when 4+ parts
    if (parts[0]) result.vendorRef = parts[0];
    if (parts[1]) result.grnNo = parts[1];
    if (parts[2]) result.serial = parts[2];
    if (parts.length >= 4 && parts[3]) {
      const d = tryParseDDMMYYYY(parts[3]);
      if (d) result.issuedDate = d;
    }
  }

  result.valid = Boolean(result.itemCode);
  return result;
}

/**
 * Helper to compute total qty from parsed QR + packages.
 */
export function computeTotalQty(parsed: ParsedQRCode, packages: number): number {
  if (!parsed.qtyPerPack || !packages) return 0;
  return parsed.qtyPerPack * packages;
}
