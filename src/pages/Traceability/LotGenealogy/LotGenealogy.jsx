import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { Alert, Box, Button, Dialog, DialogContent, LinearProgress, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import FactoryOutlinedIcon from "@mui/icons-material/FactoryOutlined";
import FullscreenOutlinedIcon from "@mui/icons-material/FullscreenOutlined";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import SearchIcon from "@mui/icons-material/Search";
import TableViewOutlinedIcon from "@mui/icons-material/TableViewOutlined";
import UnfoldLessOutlinedIcon from "@mui/icons-material/UnfoldLessOutlined";
import UnfoldMoreOutlinedIcon from "@mui/icons-material/UnfoldMoreOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";

import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, downloadCsv } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, btn, cardSx, ddmmhhmm, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { QuickActionGrid } from "../../MaintenanceManagement/maintUi";
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
            display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800 }}>{label("col", c)}</Box>
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
                  {n.sub ? <Typography variant="caption" noWrap sx={{ display: "block", fontSize: 10.5 }}>{n.sub}</Typography> : null}
                  {n.mold ? <Typography variant="caption" noWrap color="text.secondary" sx={{ display: "block", fontSize: 10 }}>{tx("Mold")}: {n.mold}</Typography> : null}
                  {n.qty ? <Typography variant="caption" noWrap sx={{ display: "block", fontSize: 10.5, fontWeight: 700 }}>{n.qty}</Typography> : null}
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
  const exportCsv = () => g && downloadCsv(`genealogy-${g.ref.code}.csv`, ["Column", "Node", "Detail", "Qty", "Status"], g.nodes.map((n) => [n.col, n.title, n.sub || "", n.qty || "", n.status || ""]));
  const quick = [
    [tx("New Search"), AddBoxOutlinedIcon, "#1570EF", () => { setG(null); setKey(""); }],
    [tx("Advanced Search"), SearchIcon, "#7A5AF8", () => setBy("MACHINE")],
    [tx("Product Trace"), Inventory2OutlinedIcon, "#12B76A", () => { const n = nodesOf("PRODUCT")[0]; navigate(n ? refPath(n.ref) : "/traceability/product"); }],
    [tx("Material Trace"), ScienceOutlinedIcon, "#F79009", () => { const n = nodesOf("MATERIAL")[0]; navigate(n ? refPath(n.ref) : "/traceability/material"); }],
    [tx("Export Report"), TableViewOutlinedIcon, "#0E9384", exportCsv, !g],
    [tx("Print Report"), PrintOutlinedIcon, "#475467", () => window.print(), !g],
  ];
  const toolbar = (
    <>
      <Button startIcon={<AddBoxOutlinedIcon />} onClick={() => { setG(null); setKey(""); }} sx={btn("cancel")}>{tx("New Search")}</Button>
      <Button startIcon={<FullscreenOutlinedIcon />} onClick={() => setFull(true)} disabled={!g} sx={btn("cancel")}>{tx("Full Screen")}</Button>
      <Button startIcon={<UnfoldMoreOutlinedIcon />} onClick={() => setCompact(false)} sx={btn("cancel")}>{tx("Expand All")}</Button>
      <Button startIcon={<UnfoldLessOutlinedIcon />} onClick={() => setCompact(true)} sx={btn("cancel")}>{tx("Collapse All")}</Button>
    </>
  );
  const selRef = sel?.ref;

  return (
    <TraceFrame page={page} title={tx("Lot Genealogy")} loading={busy || sum.loading} ready={Boolean(sum.data)} lastUpdate={sum.lastUpdate} onRefresh={() => sum.load()}
      onExport={exportCsv} toolbar={toolbar} system={sum.data?.system}>
      <Box sx={{ mb: 1.5 }}>
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
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1fr) 330px" }, gap: 1.5 }}>
        <Stack spacing={1.5} sx={{ minWidth: 0 }}>
          <Paper elevation={0} sx={{ ...cardSx, p: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>{tx("Search & Filter")}</Typography>
            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
              <TextField select size="small" label={tx("Search By")} value={by} onChange={(e) => { setBy(e.target.value); setKey(""); }} sx={{ width: 190 }}>
                {BY.map((o) => <MenuItem key={o} value={o}>{label("searchBy", o)}</MenuItem>)}</TextField>
              <TextField select size="small" label={tx("Lot No. / Code")} value={key} onChange={(e) => setKey(e.target.value)} sx={{ width: 240 }}
                slotProps={{ select: { MenuProps: { PaperProps: { sx: { maxHeight: 320 } } } } }}>
                {(suggestions || []).map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>
              <TextField select size="small" label={tx("Trace Direction")} value={direction} onChange={(e) => setDirection(e.target.value)} sx={{ width: 220 }}>
                {["BOTH", "BACKWARD", "FORWARD"].map((o) => <MenuItem key={o} value={o}>{label("direction", o)}</MenuItem>)}</TextField>
              <Button startIcon={<SearchIcon />} onClick={() => run(by, key, direction)} disabled={!key} sx={btn("primary")}>{tx("Search")}</Button>
            </Stack>
          </Paper>
          {busy ? <LinearProgress /> : null}
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Lot Genealogy Map")} action={
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                {[["MATERIAL", tx("Material Flow")], ["PROCESS", tx("Process Flow")], ["INFO", tx("Info Flow")]].map(([kk, t]) => (
                  <Stack key={kk} direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                    <Box sx={{ width: 22, borderTop: `2px ${kk === "INFO" ? "dashed" : "solid"} ${EDGE_COLORS[kk]}` }} /><Typography variant="caption">{t}</Typography></Stack>))}
              </Stack>} />
            <Box sx={{ px: 1.5, pb: 1.5 }}>
              {!g ? <Alert severity="info">{tx("Choose a material lot, product lot, work order, machine or mold, then Search.")}</Alert>
                : <GenealogyMap g={g} compact={compact} selected={sel?.id} onSelect={setSel} navigate={navigate} />}
            </Box>
          </Paper>
          {g ? (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1.3fr) minmax(0,0.9fr) minmax(0,1fr)" }, gap: 1.5 }}>
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Material Usage Details")} />
                <Box sx={{ px: 1, pb: 1, height: 240, overflow: "auto" }}>
                  <Table size="small" stickyHeader sx={tableSx}>
                    <TableHead><TableRow><TableCell>#</TableCell><TableCell>{tx("Work Order")}</TableCell>{usage[0]?.material ? <TableCell>{tx("Material Lot")}</TableCell> : <TableCell>{tx("Product Lot")}</TableCell>}
                      <TableCell>{tx("Machine")}</TableCell><TableCell>{tx("Mold")}</TableCell><TableCell align="right">{tx("Qty Used")}</TableCell><TableCell>{tx("Operator")}</TableCell></TableRow></TableHead>
                    <TableBody>{usage.map((u, i) => (
                      <TableRow key={i}>
                        <TableCell>{i + 1}</TableCell><TableCell><Link navigate={navigate} to={refPath({ type: "WO", id: u.work_order_id })}>{u.wo_no}</Link></TableCell>
                        <TableCell>{u.material || u.product_lot || EMPTY}</TableCell><TableCell>{u.machine_code || EMPTY}</TableCell><TableCell>{u.mold_code || EMPTY}</TableCell>
                        <TableCell align="right">{qty(u.consumed, u.unit || unit)}</TableCell><TableCell>{u.operator || EMPTY}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                  {!usage.length ? <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography> : null}
                </Box>
              </Paper>
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Lot Relationship Statistics")} />
                {branch.length ? (
                  <Chart type="donut" height={230} series={branch.map(([, v]) => Math.round(v * 1000) / 1000)} options={{
                    labels: branch.map(([kk]) => kk), legend: { position: "right", labels: { colors: axisColor }, fontSize: "10px" }, dataLabels: { enabled: false }, chart: { background: "transparent" },
                    stroke: { width: 1, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v) => `${num(v, 3)} ${unit}` } },
                    plotOptions: { pie: { donut: { size: "64%", labels: { show: true, name: { color: axisColor, fontSize: "10px" }, value: { color: dark ? "#fff" : "#101828", fontWeight: 800 },
                      total: { show: true, label: tx("Total Usage"), color: axisColor, formatter: () => `${num(total, 2)} ${unit}` } } } } } }} />
                ) : <Typography variant="caption" color="text.secondary" sx={{ px: 1.5 }}>{tx("No data.")}</Typography>}
              </Paper>
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Trace Timeline")} />
                <Box sx={{ px: 1.5, pb: 1.5, height: 240, overflow: "auto" }}><TraceTimeline events={d?.timeline || []} /></Box>
              </Paper>
            </Box>
          ) : null}
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Quick Actions")} />
            <Box sx={{ px: 1.5, pb: 1.5 }}><QuickActionGrid actions={quick} columns={{ xs: "repeat(2, 1fr)", md: "repeat(3, 1fr)", xl: "repeat(6, 1fr)" }} /></Box>
          </Paper>
        </Stack>

        <Stack spacing={1.5} sx={{ alignSelf: "start" }}>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Lot Information")} />
            {!sel ? <Typography variant="caption" color="text.secondary" sx={{ px: 1.5, pb: 1.5, display: "block" }}>{tx("Click a node of the map.")}</Typography> : (
              <Box sx={{ px: 1.5, pb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">{label("col", sel.col)}</Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ color: COL_COLORS[sel.col], overflowWrap: "anywhere" }}>{sel.title === "Not integrated" ? tx("Not integrated") : sel.title}</Typography>
                  {sel.status && sel.status !== "NA" ? <StatusPill value={sel.status} width={90} /> : null}
                </Stack>
                {sel.id === g.root && d?.lot ? (
                  <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 1.5, rowGap: 0.4 }}>
                    {(g.ref.type === "MATERIAL_LOT" ? [[tx("Material Code"), d.lot.material_code], [tx("Material Name"), d.lot.material_name], [tx("Material Group"), d.lot.material_group],
                      [tx("Supplier"), d.lot.supplier], [tx("Supplier Lot No."), d.lot.supplier_lot_no], [tx("Received Date"), dateText(d.lot.received_at)],
                      [tx("Available Qty"), qty(d.lot.current_qty, d.lot.unit)], [tx("Expiry Date"), dateText(d.lot.expiry_date)], [tx("Storage Location"), d.lot.location_code]]
                      : [[tx("Product"), d.lot.product_name], [tx("Work Order"), d.lot.wo_no], [tx("Production Date"), `${dateText(d.lot.production_date)} · ${d.lot.shift_name || ""}`],
                        [tx("Good Qty"), num(d.lot.good_qty)], [tx("Machine"), d.lot.machine_code], [tx("Mold"), d.lot.mold_code], [tx("Customer"), d.lot.customer_name]])
                      .map(([a, b]) => [<Typography key={`${a}k`} variant="caption" color="text.secondary">{a}</Typography>, <Typography key={`${a}v`} variant="caption" fontWeight={700}>{b ?? EMPTY}</Typography>])}
                  </Box>
                ) : (
                  <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 1.5, rowGap: 0.4 }}>
                    {[[tx("Detail"), sel.sub], sel.mold ? [tx("Mold"), sel.mold] : null, sel.qty ? [tx("Qty"), sel.qty] : null].filter(Boolean)
                      .map(([a, b]) => [<Typography key={`${a}k`} variant="caption" color="text.secondary">{a}</Typography>, <Typography key={`${a}v`} variant="caption" fontWeight={700}>{b || EMPTY}</Typography>])}
                  </Box>
                )}
                {refPath(selRef) ? <Button size="small" sx={{ mt: 1 }} onClick={() => navigate(refPath(selRef))}>{tx("Open detail")} →</Button> : null}
              </Box>
            )}
          </Paper>
          {summary ? (
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Summary (Forward Trace)")} />
              <Box sx={{ px: 1.5, pb: 1.5 }}>
                {[[tx("Work Orders"), summary.wos], [tx("Product Lots"), summary.lots], [tx("Total Finished Qty"), `${num(summary.finished)} pcs`], [tx("Material Lots"), summary.materials],
                  [tx("Customers"), summary.customers.length ? `${summary.customers.length} (${summary.customers.join(", ")})` : 0], [tx("Machines"), summary.machines], [tx("Molds"), summary.molds],
                  [tx("Shipped Qty"), tx("Not integrated")]].map(([a, b]) => (
                  <Stack key={a} direction="row" sx={{ justifyContent: "space-between", py: 0.5, borderBottom: 1, borderColor: "divider" }}>
                    <Typography variant="caption">{a}</Typography><Typography variant="caption" fontWeight={800} sx={{ textAlign: "right" }}>{b}</Typography></Stack>
                ))}
              </Box>
            </Paper>
          ) : null}
          {d?.documents ? (
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Related Documents")} />
              <Box sx={{ px: 1.5, pb: 1.5 }}><Documents docs={d.documents} navigate={navigate} /></Box>
            </Paper>
          ) : null}
        </Stack>
      </Box>
      {full && g ? (
        <Dialog open fullScreen onClose={() => setFull(false)}>
          <DialogContent>
            <Stack direction="row" sx={{ mb: 1, alignItems: "center" }}>
              <Typography variant="h6" fontWeight={800} sx={{ flex: 1 }}>{tx("Lot Genealogy")} · {g.ref.code} · {label("direction", g.direction)}</Typography>
              <Button onClick={() => setCompact((c) => !c)} sx={{ ...btn("cancel"), mr: 1 }}>{compact ? tx("Expand All") : tx("Collapse All")}</Button>
              <Button onClick={() => setFull(false)} sx={btn("primary")}>{tx("Close")}</Button>
            </Stack>
            <GenealogyMap g={g} compact={compact} selected={sel?.id} onSelect={setSel} navigate={navigate} />
            {sel ? <Typography variant="caption">{label("col", sel.col)}: <b>{sel.title}</b> · {sel.sub} {sel.qty ? `· ${sel.qty}` : ""}</Typography> : null}
          </DialogContent>
        </Dialog>
      ) : null}
    </TraceFrame>
  );
}
