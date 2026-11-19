import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import {
  Alert, Box, Button, Dialog, DialogContent, IconButton, InputAdornment, LinearProgress, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField,
  ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from "@mui/material";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import InventoryOutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";
import SearchIcon from "@mui/icons-material/Search";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import ZoomInOutlinedIcon from "@mui/icons-material/ZoomInOutlined";

import { resolveImageUrl } from "../../../components/common/ImageUploadField";
import { colShares, downloadExcel } from "../../MaterialManagement/materialUi";
import { DialogHeader, EMPTY, Head, btn, cardSx, ddmmhhmm, dialogPaperSx, num, person } from "../../ProductionManagement/ProductionPlanning/ui";
import { InfoRows } from "../../MaintenanceManagement/maintUi";
import { label, tx } from "../qualityLocales";
import { NgCreateDialog } from "../qualityDialogs";
import { EmptyBody, FilterSelect, FilterToggle, QualityFrame, QuickCard, chartBase, fillSx, panelSx, qsOf, txs, useQualityPage, who } from "../qualityPage";
import { QUALITY_API, ResultText, SPC_COLORS, SpcStatusPill, dateText, specText } from "../qualityUi";

const RULE_TEXT = { R1: "Point beyond a control limit", R2: "9 points on one side of CL", R3: "6 points steadily increasing / decreasing", R5: "2 of 3 points beyond 2 sigma", RR: "Range beyond UCL" };

/** Vertical spec-limit line on the histogram bin closest to the limit. */
const specMark = (bins, v, text) => {
  const b = bins.reduce((best, x) => (Math.abs((x.from + x.to) / 2 - v) < Math.abs((best.from + best.to) / 2 - v) ? x : best), bins[0]);
  return { x: num((b.from + b.to) / 2, 3), borderColor: "#F04438", label: { text, style: { color: "#fff", background: "#F04438", fontSize: "10px" } } };
};

function ControlChart({ a, dark, axisColor, grid, height = 200, range }) {
  const pts = a.points || [];
  const vals = pts.map((p) => (range ? p.range : p.value));
  const ucl = range ? a.r_ucl : a.ucl;
  const cl = range ? a.r_cl : a.cl;
  const lcl = range ? a.r_lcl : a.lcl;
  const spread = (ucl ?? 0) - (lcl ?? 0) || 1;
  const lo0 = Math.min(lcl ?? Infinity, ...vals.filter((v) => v != null)) - spread * 0.15;
  const lo = range ? Math.max(0, lo0) : lo0;
  const hi = Math.max(ucl ?? -Infinity, ...vals.filter((v) => v != null)) + spread * 0.15;
  const bad = pts.map((p, i) => ((range ? p.violation === "RR" : p.violation && p.violation !== "RR") ? i : null)).filter((i) => i != null);
  const ann = (y, text, color, dash) => ({ y, borderColor: color, strokeDashArray: dash ? 4 : 0, label: { text: `${text} ${num(y, 4)}`, position: "right", style: { fontSize: "10px", color: "#fff", background: color } } });
  return (
    <Chart type="line" height={height} series={[{ name: range ? "R" : "X̄", data: vals }]} options={{
      chart: { background: "transparent", toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: false }, parentHeightOffset: 0, fontFamily: '"Bai Jamjuree", sans-serif' },
      colors: ["#1570EF"], stroke: { width: 1.8 }, legend: { show: false }, dataLabels: { enabled: false },
      markers: { size: 3, discrete: bad.map((i) => ({ seriesIndex: 0, dataPointIndex: i, fillColor: "#F04438", strokeColor: "#F04438", size: 6 })) },
      xaxis: { categories: pts.map((p) => p.no), labels: { rotate: 0, hideOverlappingLabels: true, style: { colors: axisColor, fontSize: "10px" } }, tickAmount: Math.min(pts.length, 12), axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { min: lo, max: hi, tickAmount: 4, labels: { style: { colors: axisColor, fontSize: "10px" }, formatter: (v) => num(v, 3) } },
      annotations: { yaxis: [ucl != null && ann(ucl, "UCL", "#F04438", true), cl != null && ann(cl, "CL", "#12B76A"), lcl != null && ann(lcl, "LCL", "#F04438", true)].filter(Boolean) },
      grid: { ...grid, strokeDashArray: 3, padding: { top: 0, right: 8, bottom: -6, left: 4 } }, tooltip: { theme: dark ? "dark" : "light", custom: ({ dataPointIndex }) => { const p = pts[dataPointIndex]; if (!p) return "";
        return `<div style="padding:6px 8px;font-size:11px"><b>#${p.no}</b> ${ddmmhhmm(p.time)}<br/>${range ? "R" : "X̄"}: ${num(range ? p.range : p.value, 4)} (n=${p.n})<br/>${p.label}${p.wo_no ? ` · ${p.wo_no}` : ""}<br/>${[p.machine_code, p.mold_code, p.lot_no].filter(Boolean).join(" · ")}${p.violation ? `<br/><b style="color:#F04438">${tx(RULE_TEXT[p.violation])}</b>` : ""}</div>`; } } }} />
  );
}

export default function SPCMonitoring() {
  const page = useQualityPage();
  const { navigate, params, dark, axisColor, grid, tableSx, lookups, request, actor, notify, canEdit } = page;
  const [f, setF] = useState({ product_id: params.get("product") || "", revision_id: "", work_order_id: params.get("wo") || "", machine_id: "", mold_id: "", material_lot_id: "",
    shift_id: "", date_from: "", date_to: "" });
  const [applied, setApplied] = useState(f);
  const [charId, setCharId] = useState(Number(params.get("char")) || null);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(30);
  const [chartType, setChartType] = useState("");
  const [overview, setOverview] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [zoom, setZoom] = useState(false);
  const [ngDialog, setNgDialog] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [distView, setDistView] = useState("hist");
  const base = chartBase(dark, axisColor);
  const set = (key) => (v) => setF((o) => ({ ...o, [key]: v }));
  useEffect(() => {
    if (!f.product_id && !f.work_order_id && lookups?.products?.length) { const n = { ...f, product_id: lookups.products[0].id }; setF(n); setApplied(n); }
  }, [lookups]); // eslint-disable-line react-hooks/exhaustive-deps
  const filters = useMemo(() => ({ product_id: applied.work_order_id ? "" : applied.product_id, work_order_id: applied.work_order_id, revision_id: applied.revision_id,
    machine_id: applied.machine_id, mold_id: applied.mold_id, material_lot_id: applied.material_lot_id, shift_id: applied.shift_id, date_from: applied.date_from, date_to: applied.date_to }), [applied]);
  const loadOverview = useCallback(async () => {
    if (!filters.product_id && !filters.work_order_id) return;
    setLoading(true);
    try {
      const r = await request(`${QUALITY_API}/spc${qsOf({ ...filters, limit })}`);
      setOverview(r); setLastUpdate(new Date());
      setCharId((c) => (c && r.characteristics.some((x) => x.characteristic_id === c) ? c
        : ([...r.characteristics].sort((a, b) => ["OUT_OF_CONTROL", "WARNING", "NORMAL", "NO_DATA"].indexOf(a.status) - ["OUT_OF_CONTROL", "WARNING", "NORMAL", "NO_DATA"].indexOf(b.status))
          .find((x) => x.characteristic_type !== "ATTRIBUTE") || {}).characteristic_id || null));
    } catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [filters, limit, request, notify]);
  useEffect(() => { loadOverview(); }, [loadOverview]);
  const productId = overview?.product?.id;
  useEffect(() => {
    if (!charId || !productId) { setDetail(null); return; }
    request(`${QUALITY_API}/spc/${charId}${qsOf({ ...filters, product_id: productId, limit, chart_type: chartType })}`).then(setDetail).catch((e) => notify("error", e.message));
  }, [charId, productId, filters, limit, chartType, request, notify]);
  const chars = (overview?.characteristics || []).filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  const s = overview?.summary || {};
  const wo = overview?.work_order;
  const a = detail;
  const lastViolation = a?.violations?.length ? a.violations[a.violations.length - 1] : null;
  const exportRaw = () => a && downloadExcel(`spc-${a.name}.csv`, ["No", "Time", "Value", "Inspector", "Gauge", "Position", "Result", "Plan", "WO", "Machine", "Mold", "Lot"],
    a.history.map((h) => [h.no, h.time, h.value, h.inspector, h.gauge, h.position, h.result, h.plan_no, h.wo_no, h.machine_code, h.mold_code, h.lot_no]));
  const exportChart = () => a && downloadExcel(`spc-chart-${a.name}.csv`, ["Point", "Time", a.chart_type === "IMR" ? "X" : "X-bar", "R / MR", "n", "Violation", "CL", "UCL", "LCL"],
    a.points.map((p) => [p.no, p.time, p.value, p.range, p.n, p.violation || "", a.cl, a.ucl, a.lcl]));
  const createNg = () => setNgDialog({ source: "SPC", product_id: productId, work_order_id: wo?.id || "", defect_code_id: (lookups?.defects || []).find((d) => d.reason_code === "DEF-010")?.id || "",
    ng_qty: a?.outside_spec || 1, description: a ? `SPC ${label("spcStatus", a.status)}: ${a.name}${lastViolation ? ` · ${tx(RULE_TEXT[lastViolation.rule])} (#${lastViolation.point_no})` : ""}` : "" });
  const quick = [
    [txs("CAPA (short)", "Corrective Action (CAPA)"), BuildCircleOutlinedIcon, "#F04438", createNg, !canEdit || !a],
    [txs("Root cause (short)", "Root Cause Analysis"), ManageSearchOutlinedIcon, "#F79009", () => navigate(`/quality-management/ng-management${qsOf({ source: "SPC", date_from: new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10) })}`)],
    [tx("Inspection Management"), FactCheckOutlinedIcon, "#1570EF", () => navigate(`/quality-management/inspection-management${wo ? `?wo=${wo.id}` : ""}`)],
    [tx("Measuring Equipment"), StraightenOutlinedIcon, "#0E9384", () => navigate("/quality-management/measuring-equipment")],
    [txs("Quality overview (short)", "Quality Dashboard"), InsightsOutlinedIcon, "#7A5AF8", () => navigate("/quality-management/dashboard")],
    [tx("NG Management"), ReportProblemOutlinedIcon, "#F04438", () => navigate("/quality-management/ng-management")],
  ];
  const activeFilters = ["revision_id", "machine_id", "mold_id", "material_lot_id", "shift_id", "date_from", "date_to"].filter((key) => f[key]).length;
  const toolbar = (
    <>
      <FilterSelect labelText={tx("Product")} value={f.product_id} onChange={(v) => setF((o) => ({ ...o, product_id: v, work_order_id: "", revision_id: "" }))} items={(lookups?.products || []).map((p) => [p.id, `${p.product_code} ${p.product_name}`])} width={200} />
      <FilterSelect labelText={tx("Work Order")} value={f.work_order_id} onChange={set("work_order_id")} items={(lookups?.work_orders || []).filter((w) => !f.product_id || w.product_id === Number(f.product_id)).map((w) => [w.id, w.wo_no])} />
      <FilterToggle open={showFilter} count={activeFilters} onClick={() => setShowFilter((v) => !v)} />
      <Button startIcon={<SearchIcon />} onClick={() => setApplied({ ...f })} disabled={!f.product_id && !f.work_order_id} sx={btn("primary")}>{tx("Search")}</Button>
    </>
  );
  const filterRow = showFilter ? (
    <>
      <FilterSelect labelText={tx("Revision")} value={f.revision_id} onChange={set("revision_id")} items={(overview?.revisions || []).map((r) => [r.id, `Rev ${r.revision_no} (${label("stdStatus", r.status)})`])} width={130} />
      <FilterSelect labelText={tx("Machine")} value={f.machine_id} onChange={set("machine_id")} items={(lookups?.machines || []).map((m) => [m.id, m.code])} width={115} />
      <FilterSelect labelText={tx("Mold")} value={f.mold_id} onChange={set("mold_id")} items={(lookups?.molds || []).map((m) => [m.id, m.code])} width={115} />
      <FilterSelect labelText={tx("Material Lot")} value={f.material_lot_id} onChange={set("material_lot_id")} items={(lookups?.lots || []).map((l) => [l.id, l.lot_no])} width={130} />
      <FilterSelect labelText={tx("Shift")} value={f.shift_id} onChange={set("shift_id")} items={(lookups?.shifts || []).map((x) => [x.id, x.name])} width={130} />
      <TextField size="small" type="date" label={tx("From")} value={f.date_from} onChange={(e) => set("date_from")(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 145 }} />
      <TextField size="small" type="date" label={tx("To")} value={f.date_to} onChange={(e) => set("date_to")(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 145 }} />
    </>
  ) : null;
  const productFields = overview ? [
    [tx("Product Code"), overview.product.product_code], [tx("Customer"), overview.revision?.customer], [tx("Material"), overview.material ? `${overview.material.material_code} ${overview.material.material_name}` : null],
    [tx("Standard"), overview.revision?.standard_name], [tx("Work Order"), wo?.wo_no || tx("All work orders")], [tx("Machine"), wo?.machine_code], [tx("Mold"), wo?.mold_code],
    [tx("Planned Qty"), wo ? `${num(wo.planned_qty)} pcs` : null], [tx("Produced Qty"), wo ? `${num(wo.actual_qty)} pcs (${num((wo.actual_qty / Math.max(wo.planned_qty, 1)) * 100, 1)}%)` : null],
    [tx("Cycle Time"), wo?.cycle_time_sec ? `${wo.cycle_time_sec} s` : null], [tx("Cavity"), wo?.cavity || wo?.cavity_count], [tx("Operator"), wo?.operator_code ? person(wo.operator_code_name, wo.operator_code) : null],
    [tx("Start"), wo?.started_at ? ddmmhhmm(wo.started_at) : null], [tx("Planned Finish"), wo?.planned_end ? ddmmhhmm(wo.planned_end) : null],
  ] : [];
  const hasChart = a && a.points.length > 0;

  return (
    <QualityFrame fit page={page} title={tx("SPC Monitoring")} loading={loading} ready={Boolean(overview) || (!filters.product_id && !filters.work_order_id)} lastUpdate={lastUpdate}
      onRefresh={() => loadOverview()} onExport={exportRaw} toolbar={toolbar} filters={filterRow}>
      {!overview ? <Alert severity="info">{tx("Select a product or a work order to analyse.")}</Alert> : (
        <>
          <Paper elevation={0} sx={{ ...cardSx, px: 1.5, py: 1 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "52px 200px minmax(0,1fr) auto" }, gap: 1.5, alignItems: "center" }}>
              <Box sx={{ width: 52, height: 52, borderRadius: 1.5, bgcolor: "action.hover", display: { xs: "none", lg: "grid" }, placeItems: "center", overflow: "hidden" }}>
                {overview.product.image_url ? <Box component="img" src={resolveImageUrl(overview.product.image_url)} alt="" sx={{ maxWidth: "100%", maxHeight: "100%" }} /> : <InventoryOutlinedIcon sx={{ fontSize: 28, color: "#1570EF" }} />}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={800} noWrap title={overview.product.product_name}>{overview.product.product_name}</Typography>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mt: 0.25 }}>
                  {overview.revision ? <Typography variant="caption" color="text.secondary">Rev {overview.revision.revision_no}</Typography> : null}
                  {wo ? <Box component="span" sx={{ px: 0.75, borderRadius: 1, fontSize: 10, fontWeight: 700, color: "#12B76A", border: "1px solid #12B76A55", bgcolor: "#12B76A1A" }}>{label("woStatus", wo.status)}</Box> : null}
                </Stack>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0,1fr))", md: "repeat(4, minmax(0,1fr))", lg: "repeat(7, minmax(0,1fr))" }, columnGap: 1.5, rowGap: 0.5 }}>
                {productFields.map(([k, v]) => (
                  <Box key={k} sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 10, lineHeight: 1.3 }} noWrap>{k}</Typography>
                    <Typography variant="caption" fontWeight={700} sx={{ display: "block", lineHeight: 1.3 }} noWrap title={v ? String(v) : ""}>{v ?? EMPTY}</Typography>
                  </Box>
                ))}
              </Box>
              {wo ? <Button size="small" onClick={() => navigate(`/production-management/work-orders/management?wo=${wo.id}`)} sx={{ ...btn("cancel"), border: 1, borderColor: "divider" }}>{tx("View work order")}</Button> : <span />}
            </Box>
          </Paper>

          <Box sx={{ flex: { lg: "1 1 0" }, minHeight: 0, display: "grid", gap: 1,
            gridTemplateColumns: { xs: "1fr", lg: "250px minmax(0,1fr) minmax(0,1fr) 380px" }, gridTemplateRows: { lg: "minmax(0,1.35fr) minmax(0,1fr)" } }}>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "1" }, gridRow: { lg: "1" } }}>
              <Head title={tx("Characteristics")} action={<Typography variant="caption" color="text.secondary">{chars.length}</Typography>} />
              <Box sx={{ px: 1, pb: 0.75 }}>
                <TextField size="small" fullWidth placeholder={tx("Search characteristic...")} value={search} onChange={(e) => setSearch(e.target.value)}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
              </Box>
              {chars.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...colShares(10, 46, 16, 28), "& td": { cursor: "pointer" } }}>
                    <TableHead><TableRow><TableCell /><TableCell>{tx("Characteristic")}</TableCell><TableCell>{tx("Unit")}</TableCell><TableCell>{tx("Chart")}</TableCell></TableRow></TableHead>
                    <TableBody>{chars.map((c) => (
                      <TableRow key={c.characteristic_id} hover selected={c.characteristic_id === charId} onClick={() => c.characteristic_type !== "ATTRIBUTE" && setCharId(c.characteristic_id)}
                        sx={{ opacity: c.characteristic_type === "ATTRIBUTE" ? 0.75 : 1 }}>
                        <TableCell><FiberManualRecordIcon sx={{ fontSize: 11, color: SPC_COLORS[c.status], verticalAlign: "middle" }} titleAccess={label("spcStatus", c.status)} /></TableCell>
                        <TableCell sx={{ fontWeight: 700 }} title={c.name}>{c.name}{c.is_critical ? " ★" : ""}</TableCell><TableCell>{c.unit || "-"}</TableCell>
                        <TableCell>{c.characteristic_type === "ATTRIBUTE" ? `${tx("Attribute")}${c.ng ? ` · ${c.ng} NG` : ""}` : label("chartType", c.chart_type)}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody text={tx("No characteristics in the active standard.")} />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "2 / 4" }, gridRow: { lg: "1" }, minHeight: { xs: 380, lg: 0 } }}>
              <Head title={a ? `${a.name} (${a.unit || "-"}) – ${label("chartType", a.chart_type)}` : tx("Control Chart")}
                action={(
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                    <ToggleButtonGroup exclusive size="small" value={chartType || a?.chart_type || "XBAR_R"} onChange={(e, v) => v && setChartType(v)}>
                      <ToggleButton value="XBAR_R" sx={{ px: 1.25, py: 0.1, textTransform: "none", fontWeight: 700, fontSize: 11 }}>X̄-R</ToggleButton>
                      <ToggleButton value="IMR" sx={{ px: 1.25, py: 0.1, textTransform: "none", fontWeight: 700, fontSize: 11 }}>I-MR</ToggleButton>
                    </ToggleButtonGroup>
                    <TextField select size="small" value={limit} onChange={(e) => setLimit(Number(e.target.value))} sx={{ width: 130, "& .MuiInputBase-input": { py: 0.4, fontSize: 11 } }}>
                      {[20, 25, 30, 50, 100].map((n) => <MenuItem key={n} value={n}>{tx("Last {n} points", { n })}</MenuItem>)}</TextField>
                    <Tooltip title={tx("Zoom")}><span><IconButton size="small" onClick={() => setZoom(true)} disabled={!hasChart}><ZoomInOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
                    <Tooltip title={tx("Export Chart Data")}><span><IconButton size="small" onClick={exportChart} disabled={!a}><DownloadOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
                    {a ? <SpcStatusPill value={a.status} /> : null}
                  </Stack>
                )} />
              {!a ? <LinearProgress sx={{ m: 2 }} /> : !hasChart ? <EmptyBody text={tx("Not enough data: at least 5 subgroups are needed.")} /> : (
                <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", px: 1, pb: 0.75 }}>
                  {a.status === "NO_DATA" ? <Typography variant="caption" sx={{ px: 1, color: "#F79009" }}>{tx("Not enough data: at least 5 subgroups are needed.")} ({a.points.length})</Typography> : null}
                  <Typography variant="caption" fontWeight={800} sx={{ px: 1, fontSize: 10, color: "text.secondary" }}>{a.chart_type === "IMR" ? tx("Individuals (I)") : tx("X̄ Chart")}</Typography>
                  <Box sx={{ flex: 3, minHeight: 0 }}><ControlChart a={a} dark={dark} axisColor={axisColor} grid={grid} height="100%" /></Box>
                  <Typography variant="caption" fontWeight={800} sx={{ px: 1, fontSize: 10, color: "text.secondary" }}>{a.chart_type === "IMR" ? tx("Moving Range (MR)") : tx("R Chart")}</Typography>
                  <Box sx={{ flex: 2, minHeight: 0 }}><ControlChart a={a} dark={dark} axisColor={axisColor} grid={grid} height="100%" range /></Box>
                  <Typography variant="caption" noWrap sx={{ px: 1, color: a.violations.length ? "#F04438" : "text.secondary" }}>
                    {tx("Rule violations")}: {a.violations.length ? a.violations.slice(-4).map((v) => `#${v.point_no} ${tx(RULE_TEXT[v.rule])}`).join(" · ") : tx("none")}
                  </Typography>
                </Box>
              )}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "4" }, gridRow: { lg: "1" }, borderColor: a && !["NORMAL", "NO_DATA"].includes(a.status) ? SPC_COLORS[a.status] : undefined }}>
              <Head title={tx("Process Capability")} />
              {a ? (
                <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1.25, display: "flex", flexDirection: "column", justifyContent: "space-evenly", gap: 1 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", border: 1, borderColor: "divider", borderRadius: 1.5, px: 1, py: 0.5 }}>
                    <WarningAmberOutlinedIcon sx={{ fontSize: 22, color: SPC_COLORS[a.status] }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" fontWeight={800} sx={{ display: "block", color: SPC_COLORS[a.status] }}>{label("spcStatus", a.status)}</Typography>
                      <Typography variant="caption" sx={{ display: "block" }} noWrap>{lastViolation ? `${tx(RULE_TEXT[lastViolation.rule])} · #${lastViolation.point_no} · ${ddmmhhmm(lastViolation.time)}` : a.cpk != null && a.cpk < a.cpk_target ? tx("Cpk below target") : a.status === "NO_DATA" ? tx("No data") : tx("Process stable")}</Typography>
                    </Box>
                  </Stack>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                    {[["Cp", a.cp], ["Cpk", a.cpk]].map(([t, v]) => (
                      <Box key={t} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, px: 1, py: 0.5, textAlign: "center" }}>
                        <Typography variant="caption" fontWeight={800}>{t}</Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.3, color: v == null ? "text.secondary" : v >= a.cpk_target ? "#12B76A" : v >= 1 ? "#F79009" : "#F04438" }}>{v ?? EMPTY}</Typography>
                        <LinearProgress variant="determinate" value={Math.min(100, ((v || 0) / 2) * 100)} color={v >= a.cpk_target ? "success" : v >= 1 ? "warning" : "error"} sx={{ height: 5, borderRadius: 3 }} />
                        <Typography variant="caption" sx={{ color: "#1570EF", fontSize: 10 }}>{tx("Target")}: ≥ {a.cpk_target}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 1.5 }}>
                    <InfoRows rows={[[tx("Mean"), a.mean != null ? num(a.mean, 4) : EMPTY], [tx("Std. Dev."), a.std_dev != null ? num(a.std_dev, 4) : EMPTY], ["UCL", a.ucl != null ? num(a.ucl, 4) : EMPTY], ["CL", a.cl != null ? num(a.cl, 4) : EMPTY], ["LCL", a.lcl != null ? num(a.lcl, 4) : EMPTY]]} />
                    <InfoRows rows={[["USL", a.usl ?? EMPTY], ["LSL", a.lsl ?? EMPTY], [tx("Spec. Range"), a.usl != null && a.lsl != null ? num(a.usl - a.lsl, 4) : EMPTY],
                      [tx("PPM (expected)"), a.ppm_expected != null ? num(a.ppm_expected) : EMPTY], [tx("PPM (out of spec)"), a.ppm_observed != null ? num(a.ppm_observed) : EMPTY, a.ppm_observed ? "#F04438" : undefined]]} />
                  </Box>
                </Box>
              ) : <EmptyBody />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "1" }, gridRow: { lg: "2" } }}>
              <Head title={tx("SPC Summary")} />
              <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.25, pb: 1.25, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 0.5 }}>
                {[[tx("Monitored characteristics"), s.monitored, "#1570EF"], [tx("Stable"), `${s.normal} (${s.total ? num((s.normal / s.total) * 100, 0) : 0}%)`, "#12B76A"],
                  [tx("Warning"), s.warning, "#F79009"], [tx("Out of control"), s.out_of_control, "#F04438"], [tx("No data"), s.no_data, "#98A2B3"],
                  [tx("Average Cp"), s.cp_avg ?? EMPTY, "#1570EF"], [tx("Average Cpk"), s.cpk_avg ?? EMPTY, "#1570EF"]].map(([t, v, color]) => (
                  <Stack key={t} direction="row" sx={{ justifyContent: "space-between", border: 1, borderColor: "divider", borderRadius: 1.5, px: 1, py: 0.35 }}>
                    <Typography variant="caption">{t}</Typography><Typography variant="caption" fontWeight={800} sx={{ color }}>{v}</Typography></Stack>
                ))}
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "2" }, gridRow: { lg: "2" } }}>
              <Head title={`${tx("Measurement History")}${a ? ` (${a.name})` : ""}`} action={<Typography variant="caption" color="text.secondary">{a?.history?.length || 0}</Typography>} />
              {a?.history?.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, "& .MuiTableCell-root": { px: 0.5 }, ...colShares(7, 19, 15, 33, 13, 13) }}>
                    <TableHead><TableRow><TableCell>#</TableCell><TableCell>{tx("Time")}</TableCell><TableCell align="right">{tx("Value")}</TableCell><TableCell>{tx("Inspector")}</TableCell>
                      <TableCell>{tx("Gauge")}</TableCell><TableCell align="center">{tx("Result")}</TableCell></TableRow></TableHead>
                    <TableBody>{a.history.slice().reverse().map((h) => (
                      <TableRow key={h.no} title={[h.position, h.wo_no || h.machine_code, h.remark].filter(Boolean).join(" · ")} sx={{ bgcolor: h.result === "NG" ? "#F044380D" : undefined }}>
                        <TableCell>{h.no}</TableCell><TableCell>{ddmmhhmm(h.time)}</TableCell><TableCell align="right" sx={{ fontWeight: 700, color: h.result === "NG" ? "#F04438" : undefined }}>{num(h.value, 4)}</TableCell>
                        <TableCell>{h.inspector_name ? person(h.inspector_name, h.inspector_code) : who(h.inspector)}</TableCell><TableCell title={h.gauge_name}>{h.gauge || EMPTY}</TableCell>
                        <TableCell align="center"><ResultText value={h.result} /></TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "3" }, gridRow: { lg: "2" } }}>
              <Head title={distView === "cpk" ? tx("Cpk Trend") : tx("Histogram")} action={(
                <ToggleButtonGroup exclusive size="small" value={distView} onChange={(e, v) => v && setDistView(v)}>
                  <ToggleButton value="hist" sx={{ px: 1, py: 0.1, textTransform: "none", fontWeight: 700, fontSize: 10.5 }}>{tx("Histogram")}</ToggleButton>
                  <ToggleButton value="cpk" sx={{ px: 1, py: 0.1, textTransform: "none", fontWeight: 700, fontSize: 10.5 }}>{tx("Cpk Trend")}</ToggleButton>
                </ToggleButtonGroup>
              )} />
              {distView === "hist" ? (a?.histogram?.length ? (
                <Box sx={{ flex: 1, minHeight: 0, px: 1 }}>
                  <Chart type="bar" height="100%" series={[{ name: tx("Count"), data: a.histogram.map((b) => b.count) }]} options={{
                    ...base, colors: ["#1570EF"], plotOptions: { bar: { columnWidth: "92%" } },
                    xaxis: { ...base.xaxis, categories: a.histogram.map((b) => num((b.from + b.to) / 2, 3)) },
                    annotations: { xaxis: [a.lsl != null && specMark(a.histogram, a.lsl, "LSL"), a.usl != null && specMark(a.histogram, a.usl, "USL")].filter(Boolean) },
                    tooltip: { ...base.tooltip, x: { formatter: (v, o) => { const b = a.histogram[o.dataPointIndex]; return b ? `${num(b.from, 4)} – ${num(b.to, 4)}` : v; } } } }} />
                </Box>
              ) : <EmptyBody />) : (a?.cpk_trend?.length ? (
                <Box sx={{ flex: 1, minHeight: 0, px: 1 }}>
                  <Chart type="line" height="100%" series={[{ name: "Cpk", data: a.cpk_trend.map((x) => x.cpk) }]} options={{
                    ...base, colors: ["#12B76A"], stroke: { width: 2 }, markers: { size: 4 },
                    xaxis: { ...base.xaxis, categories: a.cpk_trend.map((x) => dateText(x.date).slice(0, 5)) },
                    yaxis: { min: 0, labels: { ...base.yaxis.labels, formatter: (v) => num(v, 2) } },
                    annotations: { yaxis: [{ y: a.cpk_target, borderColor: "#1570EF", strokeDashArray: 4, label: { text: `${tx("Target")} (${a.cpk_target})`, style: { fontSize: "10px", color: "#fff", background: "#1570EF" } } }] },
                    tooltip: { ...base.tooltip, y: { formatter: (v, o) => `${num(v, 3)} · n=${a.cpk_trend[o.dataPointIndex].count}` } } }} />
                </Box>
              ) : <EmptyBody />)}
            </Paper>

            <Box sx={{ gridColumn: { lg: "4" }, gridRow: { lg: "2" }, display: "flex", minHeight: 0, "& > *": { flex: 1 } }}>
              <QuickCard actions={quick} columns={3} />
            </Box>
          </Box>
        </>
      )}
      {zoom && a ? (
        <Dialog open onClose={() => setZoom(false)} maxWidth="xl" fullWidth slotProps={{ paper: { sx: dialogPaperSx } }}>
          <DialogHeader icon={<ZoomInOutlinedIcon fontSize="small" />} title={`${a.name} (${a.unit || "-"}) – ${label("chartType", a.chart_type)}`} subtitle={label("spcStatus", a.status)} onClose={() => setZoom(false)} />
          <DialogContent sx={{ pt: "12px !important" }}>
            <ControlChart a={a} dark={dark} axisColor={axisColor} grid={grid} height={380} />
            <ControlChart a={a} dark={dark} axisColor={axisColor} grid={grid} height={240} range />
            <Typography variant="caption" color="text.secondary">{specText(a)} · Cp {a.cp ?? EMPTY} · Cpk {a.cpk ?? EMPTY}</Typography>
          </DialogContent>
        </Dialog>
      ) : null}
      {ngDialog ? <NgCreateDialog lookups={lookups} preset={ngDialog} request={request} actor={actor} notify={notify} onClose={() => setNgDialog(null)}
        onSaved={(r) => { setNgDialog(null); navigate(`/quality-management/ng-management?ng=${r.id}`); }} /> : null}
    </QualityFrame>
  );
}
