import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Dialog, DialogContent, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import FactoryOutlinedIcon from "@mui/icons-material/FactoryOutlined";
import FullscreenOutlinedIcon from "@mui/icons-material/FullscreenOutlined";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import SearchIcon from "@mui/icons-material/Search";
import TableViewOutlinedIcon from "@mui/icons-material/TableViewOutlined";
import UnfoldLessOutlinedIcon from "@mui/icons-material/UnfoldLessOutlined";
import UnfoldMoreOutlinedIcon from "@mui/icons-material/UnfoldMoreOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";

import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, colShares, downloadExcel } from "../../MaterialManagement/materialUi";
import { DialogHeader, EMPTY, Head, btn, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { EmptyBody, QuickCard, cellsSx, fillSx, fitGridSx, panelSx, toolBtnSx, who } from "../../shared/onePage";
import { DonutCard } from "../../MaintenanceManagement/maintPage";
import { label, tx } from "../traceLocales";
import { Documents, Link, STATUS_COLORS, StatusPill, TRACE_API, TraceFrame, TraceTimeline, dateText, qty, refPath, useTraceData, useTracePage, vsYesterday } from "../traceUi";

const COL_COLORS = { SUPPLIER: "#2E90FA", MATERIAL: "#12B76A", MACHINE: "#7A5AF8", PRODUCTION: "#0E9384", INSPECTION: "#9E77ED", PRODUCT: "#1570EF", SHIPMENT: "#F04438" };
const EDGE_COLORS = { MATERIAL: "#12B76A", PROCESS: "#1570EF", INFO: "#98A2B3" };
const BY = ["MATERIAL_LOT", "PRODUCT_LOT", "WO", "MACHINE", "MOLD"];
const W = 172;
const GAP = 44;

function GenealogyMap({ g, compact, selected, onSelect, navigate }) {
  const H = compact ? 46 : 84;
  const VG = compact ? 14 : 22;
  const cols = g.columns;
  const counts = cols.map((c) => g.nodes.filter((n) => n.col === c).length);
  const maxRows = Math.max(1, ...counts);
  const top = 40;
  const pos = {};
  g.nodes.forEach((n) => {
    const ci = cols.indexOf(n.col);
    const offset = ((maxRows - counts[ci]) * (H + VG)) / 2;
    pos[n.id] = { x: ci * (W + GAP), y: top + offset + n.row * (H + VG) };
  });
  const width = cols.length * (W + GAP) - GAP;
  const height = top + maxRows * (H + VG);
  return (
    <Box sx={{ overflow: "auto", pb: 1 }}>
      <Box sx={{ position: "relative", width, height, minWidth: width }}>
        {cols.map((c, i) => (
          <Box key={c} sx={{ position: "absolute", left: i * (W + GAP), top: 0, width: W, height: 28, borderRadius: 1, bgcolor: `${COL_COLORS[c]}14`, color: COL_COLORS[c],
            display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800 }}>{label("col", c)}</Box>
        ))}
        <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
          <defs>{Object.entries(EDGE_COLORS).map(([k, c]) => (
            <marker key={k} id={`arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={c} /></marker>
          ))}</defs>
          {g.edges.map((e) => {
            const a = pos[e.from];
            const b = pos[e.to];
            if (!a || !b) return null;
            const x1 = a.x + W, y1 = a.y + H / 2, x2 = b.x - 2, y2 = b.y + H / 2;
            const mx = (x1 + x2) / 2;
            return <path key={`${e.from}-${e.to}`} d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`} fill="none" stroke={EDGE_COLORS[e.kind]} strokeWidth="1.6"
              strokeDasharray={e.kind === "INFO" ? "4 3" : undefined} markerEnd={`url(#arrow-${e.kind})`} />;
          })}
        </svg>
        {g.nodes.map((n) => {
          const p = pos[n.id];
          const color = COL_COLORS[n.col];
          const isRoot = n.id === g.root;
          const na = n.status === "NA";
          return (
            <Box key={n.id} onClick={() => onSelect(n)} onDoubleClick={() => { const to = refPath(n.ref); if (to) navigate(to); }}
              title={tx("Click: details · double-click: open")}
              sx={{ position: "absolute", left: p.x, top: p.y, width: W, height: H, borderRadius: 1.5, border: 2, borderColor: selected === n.id ? "#101828" : color,
                bgcolor: n.highlight || isRoot ? `${color}1F` : "background.paper", boxShadow: isRoot ? `0 0 0 3px ${color}40` : "none", px: 1, py: 0.5, cursor: "pointer",
                opacity: na ? 0.6 : 1, borderStyle: na ? "dashed" : "solid", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
              <Typography variant="caption" fontWeight={800} noWrap sx={{ color, display: "block", lineHeight: 1.3 }}>{n.title === "Not integrated" ? tx("Not integrated") : n.title}</Typography>
              {!compact ? (
                <>
                  {n.sub ? <Typography variant="caption" noWrap sx={{ display: "block", fontSize: 10 }}>{n.sub}</Typography> : null}
                  {n.mold ? <Typography variant="caption" noWrap color="text.secondary" sx={{ display: "block", fontSize: 10 }}>{tx("Mold")}: {n.mold}</Typography> : null}
                  {n.qty ? <Typography variant="caption" noWrap sx={{ display: "block", fontSize: 10, fontWeight: 700 }}>{n.qty}</Typography> : null}
                  {n.status && !["NA"].includes(n.status) && ["INSPECTION", "PRODUCT", "MATERIAL"].includes(n.col) ? (
                    <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 800, color: STATUS_COLORS[n.status] || "text.secondary" }}>{label("status", n.status)}</Typography>) : null}
                </>
              ) : null}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default function LotGenealogy() {
  const page = useTracePage();
  const { navigate, params, dark, axisColor, tableSx, lookups, request, actor, notify } = page;
  const [by, setBy] = useState(params.get("by") || "MATERIAL_LOT");
  const [key, setKey] = useState(params.get("key") || "");
  const [direction, setDirection] = useState("BOTH");
  const [g, setG] = useState(null);
  const [busy, setBusy] = useState(false);
  const [compact, setCompact] = useState(false);
  const [full, setFull] = useState(false);
  const [sel, setSel] = useState(null);
  const sum = useTraceData(page, `${TRACE_API}/summary/genealogy`, { interval: 60000 });
  const run = useCallback(async (b, k, d) => {
    if (!k?.trim()) return;
    setBusy(true);
    try {
      const r = await request(`${TRACE_API}/genealogy?${new URLSearchParams({ by: b, key: k.trim(), direction: d, actor })}`);
      if (!r.found) { notify("warning", tx("Nothing found for this key.")); setG(null); } else { setG(r); setSel(r.nodes.find((n) => n.id === r.root) || null); }
      sum.load({ silent: true });
    } catch (e) { notify("error", e.message); } finally { setBusy(false); }
  }, [request, actor, notify]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (params.get("key")) run(params.get("by") || "MATERIAL_LOT", params.get("key"), "BOTH"); }, [params, run]);
  const k = sum.data?.kpis || {};
  const d = g?.detail;
  const suggestions = { MATERIAL_LOT: lookups?.material_lots, PRODUCT_LOT: lookups?.product_lots, WO: lookups?.work_orders, MACHINE: lookups?.machines, MOLD: lookups?.molds }[by] || [];
  const nodesOf = (col) => (g?.nodes || []).filter((n) => n.col === col);
  const summary = g ? {
    wos: nodesOf("PRODUCTION").length, lots: nodesOf("PRODUCT").length, machines: nodesOf("MACHINE").length,
    molds: new Set(nodesOf("PRODUCTION").map((n) => n.mold).filter(Boolean)).size, materials: nodesOf("MATERIAL").length,
    finished: nodesOf("PRODUCT").reduce((a, n) => a + Number(String(n.qty || "0").replace(/[^0-9]/g, "")), 0),
    customers: [...new Set(nodesOf("SHIPMENT").map((n) => String(n.sub || "").split(": ")[1]).filter((x) => x && x !== "-"))],
  } : null;
  const usage = d?.usage || [];
  const branch = useMemo(() => {
    const m = {};
    usage.forEach((u) => { const kk = u.material || u.wo_no; m[kk] = (m[kk] || 0) + Number(u.consumed || 0); });
    return Object.entries(m).filter(([, v]) => v > 0);
  }, [usage]);
  const total = branch.reduce((a, [, v]) => a + v, 0);
  const unit = d?.statistics?.unit || usage[0]?.unit || "";
  const exportCsv = () => g && downloadExcel(`genealogy-${g.ref.code}.csv`, ["Column", "Node", "Detail", "Qty", "Status"], g.nodes.map((n) => [n.col, n.title, n.sub || "", n.qty || "", n.status || ""]));
  const quick = [
    [tx("New Search"), AddBoxOutlinedIcon, "#1570EF", () => { setG(null); setKey(""); }],
    [tx("Advanced Search"), SearchIcon, "#7A5AF8", () => setBy("MACHINE")],
    [tx("Product Trace"), Inventory2OutlinedIcon, "#12B76A", () => { const n = nodesOf("PRODUCT")[0]; navigate(n ? refPath(n.ref) : "/traceability/product"); }],
    [tx("Material Trace"), ScienceOutlinedIcon, "#F79009", () => { const n = nodesOf("MATERIAL")[0]; navigate(n ? refPath(n.ref) : "/traceability/material"); }],
    [tx("Full Screen"), FullscreenOutlinedIcon, "#2E90FA", () => setFull(true), !g],
    [tx("Export Report"), TableViewOutlinedIcon, "#0E9384", exportCsv, !g],
  ];
  const toolbar = (
    <>
      <TextField select size="small" label={tx("Search By")} value={by} onChange={(e) => { setBy(e.target.value); setKey(""); }} sx={{ width: 160 }}>
        {BY.map((o) => <MenuItem key={o} value={o}>{label("searchBy", o)}</MenuItem>)}</TextField>
      <TextField select size="small" label={tx("Lot No. / Code")} value={key} onChange={(e) => setKey(e.target.value)} sx={{ width: 220 }}
        slotProps={{ select: { MenuProps: { PaperProps: { sx: { maxHeight: 320 } } } } }}>
        {(suggestions || []).map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>
      <TextField select size="small" label={tx("Trace Direction")} value={direction} onChange={(e) => setDirection(e.target.value)} sx={{ width: 190 }}>
        {["BOTH", "BACKWARD", "FORWARD"].map((o) => <MenuItem key={o} value={o}>{label("direction", o)}</MenuItem>)}</TextField>
      <Button startIcon={<SearchIcon />} onClick={() => run(by, key, direction)} disabled={!key} sx={btn("primary")}>{tx("Search")}</Button>
    </>
  );
  const selRef = sel?.ref;
  const compactToggle = (
    <Button size="small" startIcon={compact ? <UnfoldMoreOutlinedIcon /> : <UnfoldLessOutlinedIcon />} onClick={() => setCompact((c) => !c)} sx={{ ...toolBtnSx, py: 0.1 }}>
      {compact ? tx("Expand All") : tx("Collapse All")}</Button>
  );
  const kv = (rows) => rows.filter(Boolean).map(([a, b]) => [<Typography key={`${a}k`} variant="caption" color="text.secondary">{a}</Typography>, <Typography key={`${a}v`} variant="caption" fontWeight={700} sx={{ overflowWrap: "anywhere" }}>{b ?? EMPTY}</Typography>]);

  return (
    <TraceFrame fit page={page} title={tx("Lot Genealogy")} loading={busy || sum.loading} ready={Boolean(sum.data)} lastUpdate={sum.lastUpdate} onRefresh={() => sum.load()}
      onExport={exportCsv} toolbar={toolbar} system={sum.data?.system}>
      <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(4, minmax(0,1fr))", xl: "repeat(7, minmax(0,1fr))" }}>
        <KpiTile tone="primary" title={tx("Total Genealogies (Today)")} value={num(k.today?.total)} sub={`${tx("yesterday")}: ${num(k.yesterday?.total)}`} icon={AccountTreeOutlinedIcon} />
        <KpiTile tone="success" title={tx("Material Lots")} value={num(k.material_lots)} sub={`${num(k.used_material_lots)} ${tx("used in production")}`} icon={ScienceOutlinedIcon} />
        <KpiTile tone="accent" title={tx("Product Lots")} value={num(k.product_lots)} sub={tx("Total")} icon={Inventory2OutlinedIcon} />
        <KpiTile tone="warning" title={tx("Work Orders")} value={num(k.work_orders)} sub={tx("with output")} icon={FactoryOutlinedIcon} />
        <KpiTile tone="info" title={tx("Machines")} value={num(k.machines)} sub={tx("Total")} icon={PrecisionManufacturingOutlinedIcon} />
        <KpiTile tone="primary" title={tx("Molds")} value={num(k.molds)} sub={tx("Total")} icon={GridViewOutlinedIcon} />
        <KpiTile tone="danger" title={tx("Trace Success Rate")} value={k.today?.success != null ? num(k.today.success, 1) : EMPTY} unit={k.today?.success != null ? "%" : ""}
          sub={vsYesterday(k.today?.success, k.yesterday?.success, "%")} icon={VerifiedUserOutlinedIcon} />
      </KpiCardGroup>

      <Box sx={{ ...fitGridSx, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" }, gridTemplateRows: { lg: "minmax(0,1fr) minmax(0,1fr)" } }}>
        <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 4" }, gridRow: { lg: "1" }, minHeight: { xs: 300, lg: 0 } }}>
          <Head title={tx("Lot Genealogy Map")} action={
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              {[["MATERIAL", tx("Material Flow")], ["PROCESS", tx("Process Flow")], ["INFO", tx("Info Flow")]].map(([kk, t]) => (
                <Stack key={kk} direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                  <Box sx={{ width: 20, borderTop: `2px ${kk === "INFO" ? "dashed" : "solid"} ${EDGE_COLORS[kk]}` }} /><Typography variant="caption">{t}</Typography></Stack>))}
              {g ? compactToggle : null}
            </Stack>} />
          {!g ? <EmptyBody text={tx("Choose a material lot, product lot, work order, machine or mold, then Search.")} />
            : <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1, display: "flex", flexDirection: "column" }}><Box sx={{ my: "auto" }}><GenealogyMap g={g} compact={compact} selected={sel?.id} onSelect={setSel} navigate={navigate} /></Box></Box>}
        </Paper>

        <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "4" }, gridRow: { lg: "1" } }}>
          <Head title={tx("Lot Information")} action={refPath(selRef) ? <Box component="span" sx={{ fontSize: 11 }}><Link navigate={navigate} to={refPath(selRef)}>{tx("Open detail")} →</Link></Box> : null} />
          {!sel ? <EmptyBody text={tx("Click a node of the map.")} /> : (
            <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1.25 }}>
              <Typography variant="caption" color="text.secondary">{label("col", sel.col)}</Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.75 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: COL_COLORS[sel.col], overflowWrap: "anywhere" }}>{sel.title === "Not integrated" ? tx("Not integrated") : sel.title}</Typography>
                {sel.status && sel.status !== "NA" ? <StatusPill value={sel.status} width={90} /> : null}
              </Stack>
              <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 1.5, rowGap: 0.3 }}>
                {sel.id === g.root && d?.lot ? kv(g.ref.type === "MATERIAL_LOT" ? [[tx("Material Code"), d.lot.material_code], [tx("Material Name"), d.lot.material_name], [tx("Material Group"), d.lot.material_group],
                  [tx("Supplier"), d.lot.supplier], [tx("Supplier Lot No."), d.lot.supplier_lot_no], [tx("Received Date"), dateText(d.lot.received_at)],
                  [tx("Available Qty"), qty(d.lot.current_qty, d.lot.unit)], [tx("Expiry Date"), dateText(d.lot.expiry_date)], [tx("Storage Location"), d.lot.location_code]]
                  : [[tx("Product"), d.lot.product_name], [tx("Work Order"), d.lot.wo_no], [tx("Production Date"), `${dateText(d.lot.production_date)} · ${d.lot.shift_name || ""}`],
                    [tx("Good Qty"), num(d.lot.good_qty)], [tx("Machine"), d.lot.machine_code], [tx("Mold"), d.lot.mold_code], [tx("Customer"), d.lot.customer_name]])
                  : kv([[tx("Detail"), sel.sub], sel.mold ? [tx("Mold"), sel.mold] : null, sel.qty ? [tx("Qty"), sel.qty] : null])}
              </Box>
              {d?.documents ? (
                <>
                  <Typography variant="caption" fontWeight={800} sx={{ display: "block", mt: 1, mb: 0.5 }}>{tx("Related Documents")}</Typography>
                  <Documents docs={d.documents} navigate={navigate} />
                </>
              ) : null}
            </Box>
          )}
        </Paper>

        <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "1" }, gridRow: { lg: "2" } }}>
          <Head title={tx("Material Usage Details")} />
          {usage.length ? (
            <Box sx={fillSx}>
              <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(6, 24, 24, 14, 14, 18) }}>
                <TableHead><TableRow><TableCell>#</TableCell><TableCell>{tx("Work Order")}</TableCell>{usage[0]?.material ? <TableCell>{tx("Material Lot")}</TableCell> : <TableCell>{tx("Product Lot")}</TableCell>}
                  <TableCell>{tx("Machine")}</TableCell><TableCell>{tx("Mold")}</TableCell><TableCell align="right">{tx("Qty Used")}</TableCell></TableRow></TableHead>
                <TableBody>{usage.map((u, i) => (
                  <TableRow key={i} title={u.operator ? `${tx("Operator")}: ${who(u.operator)}` : ""}>
                    <TableCell>{i + 1}</TableCell><TableCell><Link navigate={navigate} to={refPath({ type: "WO", id: u.work_order_id })}>{u.wo_no}</Link></TableCell>
                    <TableCell title={u.material || u.product_lot || ""}>{u.material || u.product_lot || EMPTY}</TableCell><TableCell>{u.machine_code || EMPTY}</TableCell><TableCell title={u.mold_code || ""}>{u.mold_code || EMPTY}</TableCell>
                    <TableCell align="right">{qty(u.consumed, u.unit || unit)}</TableCell></TableRow>
                ))}</TableBody>
              </Table>
            </Box>
          ) : <EmptyBody text={tx("No data.")} />}
        </Paper>

        <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "2" }, gridRow: { lg: "2" } }}>
          <Head title={summary && !branch.length ? tx("Summary (Forward Trace)") : tx("Lot Relationship Statistics")} />
          {branch.length ? (
            <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", alignItems: "center" }}>
              <Box sx={{ width: "100%" }}>
                <DonutCard entries={branch.map(([kk, v]) => [kk, Math.round(v * 1000) / 1000, kk])} colors={{}} dark={dark} axisColor={axisColor} height={140} size={130}
                  centerLabel={tx("Total")} formatter={(v) => `${num(v, 2)} ${unit}`} />
              </Box>
            </Box>
          ) : null}
          {summary ? (
            <Box sx={{ px: 1.5, pb: 1, display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 2, flexShrink: 0, ...(branch.length ? {} : { flex: 1, alignContent: "start", overflow: "auto" }) }}>
              {[[tx("Work Orders"), summary.wos], [tx("Product Lots"), summary.lots], [tx("Total Finished Qty"), `${num(summary.finished)} pcs`], [tx("Material Lots"), summary.materials],
                [tx("Machines"), summary.machines], [tx("Molds"), summary.molds],
                [tx("Customers"), summary.customers.length ? summary.customers.join(", ") : 0], [tx("Shipped Qty"), tx("Not integrated")]].map(([a, b]) => (
                <Stack key={a} direction="row" sx={{ justifyContent: "space-between", gap: 1, py: 0.25, borderBottom: 1, borderColor: "divider", minWidth: 0 }}>
                  <Typography variant="caption" noWrap>{a}</Typography><Typography variant="caption" fontWeight={800} noWrap title={String(b)}>{b}</Typography></Stack>
              ))}
            </Box>
          ) : !branch.length ? <EmptyBody text={tx("No data.")} /> : null}
        </Paper>

        <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "3" }, gridRow: { lg: "2" } }}>
          <Head title={tx("Trace Timeline")} />
          {d?.timeline?.length ? <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1 }}><TraceTimeline events={d.timeline} /></Box> : <EmptyBody text={tx("No data.")} />}
        </Paper>

        <Box sx={{ gridColumn: { lg: "4" }, gridRow: { lg: "2" }, display: "flex", minHeight: 0, "& > *": { flex: 1 } }}>
          <QuickCard title={tx("Quick Actions")} actions={quick} columns={3} />
        </Box>
      </Box>
      {full && g ? (
        <Dialog open fullScreen onClose={() => setFull(false)}>
          <DialogHeader icon={<AccountTreeOutlinedIcon />} title={`${tx("Lot Genealogy")} · ${g.ref.code}`} subtitle={label("direction", g.direction)} onClose={() => setFull(false)} />
          <DialogContent sx={{ pt: "8px !important" }}>
            <Stack direction="row" sx={{ mb: 1, alignItems: "center", gap: 1 }}>
              {compactToggle}
              {sel ? <Typography variant="caption">{label("col", sel.col)}: <b>{sel.title}</b> · {sel.sub} {sel.qty ? `· ${sel.qty}` : ""}</Typography> : null}
            </Stack>
            <GenealogyMap g={g} compact={compact} selected={sel?.id} onSelect={setSel} navigate={navigate} />
          </DialogContent>
        </Dialog>
      ) : null}
    </TraceFrame>
  );
}
