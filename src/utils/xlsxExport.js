/**
 * Styled XLSX export (Office Open XML) - no third-party dependency.
 *
 * One worksheet: title, "exported at" line, then the table with a filled header row, thin borders,
 * banded rows, frozen header and auto filter. Numbers stay numbers and ISO dates / datetimes become real
 * Excel dates, so totals, sorting and filters work in Excel. The zip is written uncompressed (STORE).
 */

const BRAND = "FF045C9C";
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/;
const NUM_RE = /^-?(?:0|[1-9]\d{0,11})(?:\.\d+)?$/;

// cell styles (index into cellXfs below)
const S = { title: 1, meta: 2, head: 3, text: 4, num: 5, dec: 6, date: 7, dt: 8 };
const BAND = 5; // banded twin of styles 4..8 = index + BAND

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))
  // eslint-disable-next-line no-control-regex
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");

function colName(n) {
  let s = "";
  for (n += 1; n; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

function excelDate(m) {
  const [, y, mo, d, h = 0, mi = 0, se = 0] = m.map((v) => (v === undefined ? 0 : Number(v)));
  return (Date.UTC(y, mo - 1, d, h, mi, se) - Date.UTC(1899, 11, 30)) / 86400000;
}

/** -> { v, style, width } for one data value */
function classify(value) {
  if (value === null || value === undefined || value === "") return { v: null, style: S.text, width: 0 };
  if (typeof value === "boolean") value = value ? "Yes" : "No";
  if (value instanceof Date) value = value.toISOString();
  if (typeof value === "number" && Number.isFinite(value)) {
    const style = Number.isInteger(value) ? S.num : S.dec;
    return { v: value, style, width: value.toLocaleString("en-US", { maximumFractionDigits: 2 }).length };
  }
  const text = String(value);
  if (NUM_RE.test(text.trim())) {
    const n = Number(text.trim());
    return { v: n, style: Number.isInteger(n) ? S.num : S.dec, width: text.trim().length };
  }
  const m = text.match(DATE_RE);
  if (m && /^(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/.test(text.slice(m[0].length))) {
    const hasTime = m[4] !== undefined;
    let parts = m;
    if (hasTime && /[Z+-]/.test(text.slice(m[0].length))) {
      // zoned timestamp -> the viewer's local wall time, as shown on screen
      const d = new Date(text);
      parts = [null, d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()];
    }
    return { v: excelDate(parts), style: hasTime ? S.dt : S.date, width: hasTime ? 16 : 10 };
  }
  // capitals are ~30% wider than the average character
  const wide = (l) => l.length + (l.match(/[A-Z]/g) || []).length * 0.3;
  return { v: text, style: S.text, width: Math.max(...text.split("\n").map(wide)) };
}

function cell(ref, v, style) {
  if (v === null) return `<c r="${ref}" s="${style}"/>`;
  if (typeof v === "number") return `<c r="${ref}" s="${style}"><v>${v}</v></c>`;
  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="4"><numFmt numFmtId="164" formatCode="#,##0"/><numFmt numFmtId="165" formatCode="#,##0.##"/>
<numFmt numFmtId="166" formatCode="dd/mm/yyyy"/><numFmt numFmtId="167" formatCode="dd/mm/yyyy hh:mm"/></numFmts>
<fonts count="4"><font><sz val="10"/><color rgb="FF1F2937"/><name val="Arial"/></font>
<font><b/><sz val="14"/><color rgb="${BRAND}"/><name val="Arial"/></font>
<font><i/><sz val="9"/><color rgb="FF6B7280"/><name val="Arial"/></font>
<font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Arial"/></font></fonts>
<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="${BRAND}"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF3F6FA"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFD9DEE5"/></left><right style="thin"><color rgb="FFD9DEE5"/></right><top style="thin"><color rgb="FFD9DEE5"/></top><bottom style="thin"><color rgb="FFD9DEE5"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="14">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1" indent="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" indent="1"/></xf>
<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" indent="1"/></xf>
<xf numFmtId="166" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="167" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1" indent="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" indent="1"/></xf>
<xf numFmtId="165" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" indent="1"/></xf>
<xf numFmtId="166" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="167" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
</cellXfs></styleSheet>`;

function sheetName(title) {
  return (title || "Data").replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 31) || "Data";
}

/** Title for the sheet: the page title (document.title before " | "), else the file name. */
function defaultTitle(filename) {
  const page = (typeof document !== "undefined" ? document.title : "").split("|")[0].trim();
  if (page) return page;
  return filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
}

export function buildXlsx(header, rows, { title } = {}) {
  const now = new Date();
  const p2 = (n) => String(n).padStart(2, "0");
  const stamp = `${p2(now.getDate())}/${p2(now.getMonth() + 1)}/${now.getFullYear()} ${p2(now.getHours())}:${p2(now.getMinutes())}`;
  const ncol = Math.max(header.length, 1);
  const last = colName(ncol - 1);
  const widths = header.map((h) => Math.min(String(h ?? "").length, 24));
  const lines = [
    `<row r="1" ht="24" customHeight="1">${cell("A1", title, S.title)}</row>`,
    `<row r="2">${cell("A2", `Xuất lúc ${stamp} · ${rows.length} dòng`, S.meta)}</row>`,
  ];
  const H = 4;
  lines.push(`<row r="${H}" ht="30" customHeight="1">${header.map((h, i) => cell(`${colName(i)}${H}`, String(h ?? ""), S.head)).join("")}</row>`);
  rows.forEach((row, ri) => {
    const r = H + 1 + ri;
    const band = ri % 2 === 1 ? BAND : 0;
    const cells = header.map((_, i) => {
      const c = classify(row[i]);
      if (ri < 1000) widths[i] = Math.max(widths[i], c.width);
      return cell(`${colName(i)}${r}`, c.v, c.style + band);
    });
    const tall = Math.max(1, ...row.map((v) => (typeof v === "string" ? v.split("\n").length : 1)));
    lines.push(`<row r="${r}" ht="${18 * tall}" customHeight="1">${cells.join("")}</row>`);
  });
  const lastRow = H + Math.max(rows.length, 1);
  const cols = widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${Math.min(Math.max(Math.ceil(w * 1.1) + 4, 9), 50)}" customWidth="1"/>`).join("");
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="${H}" topLeftCell="A${H + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="16"/><cols>${cols}</cols><sheetData>${lines.join("")}</sheetData>
<autoFilter ref="A${H}:${last}${lastRow}"/>
<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
<pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>`;
  const name = esc(sheetName(title));
  const files = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${name}" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${name.replace(/'/g, "''")}'!$A$${H}:$${last}$${lastRow}</definedName><definedName name="_xlnm.Print_Titles" localSheetId="0">'${name.replace(/'/g, "''")}'!$${H}:$${H}</definedName></definedNames></workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    "xl/worksheets/sheet1.xml": sheet,
    "xl/styles.xml": STYLES,
  };
  return zip(files);
}

// --- minimal zip (STORE, no compression)
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function zip(files) {
  const enc = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  for (const [path, content] of Object.entries(files)) {
    const name = enc.encode(path);
    const data = enc.encode(content);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true);
    local.setUint32(14, crc, true); local.setUint32(18, data.length, true); local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    parts.push(new Uint8Array(local.buffer), name, data);
    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true); cen.setUint16(8, 0x0800, true);
    cen.setUint32(16, crc, true); cen.setUint32(20, data.length, true); cen.setUint32(24, data.length, true);
    cen.setUint16(28, name.length, true); cen.setUint32(42, offset, true);
    central.push(new Uint8Array(cen.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const size = central.reduce((n, p) => n + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  const count = Object.keys(files).length;
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, count, true); end.setUint16(10, count, true);
  end.setUint32(12, size, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)],
    { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/** Build and download an .xlsx. header: [string]; rows: [[value]]; filename's extension is forced to .xlsx. */
export function downloadXlsx(filename, header, rows, { title } = {}) {
  const file = `${String(filename || "export").replace(/\.(csv|xlsx?)$/i, "")}.xlsx`;
  const blob = buildXlsx(header, rows, { title: title || defaultTitle(file) });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = file;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
