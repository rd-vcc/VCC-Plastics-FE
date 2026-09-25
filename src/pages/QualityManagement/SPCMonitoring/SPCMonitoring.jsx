import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import {
  Alert, Box, Button, Dialog, DialogContent, InputAdornment, LinearProgress, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField,
  ToggleButton, ToggleButtonGroup, Typography,
} from "@mui/material";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import InventoryOutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";
import SearchIcon from "@mui/icons-material/Search";
import TableViewOutlinedIcon from "@mui/icons-material/TableViewOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import ZoomInOutlinedIcon from "@mui/icons-material/ZoomInOutlined";

import { resolveImageUrl } from "../../../components/common/ImageUploadField";
import { downloadCsv } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, btn, cardSx, ddmmhhmm, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { InfoRows, QuickActionGrid } from "../../MaintenanceManagement/maintUi";
import { label, tx } from "../qualityLocales";
import { NgCreateDialog } from "../qualityDialogs";
import { FilterSelect, QualityFrame, qsOf, useQualityPage } from "../qualityPage";
import { QUALITY_API, ResultText, SPC_COLORS, SpcStatusPill, dateText, specText } from "../qualityUi";

const RULE_TEXT = { R1: "Point beyond a control limit", R2: "9 points on one side of CL", R3: "6 points steadily increasing / decreasing", R5: "2 of 3 points beyond 2 sigma", RR: "Range beyond UCL" };

/** Vertical spec-limit line on the histogram bin closest to the limit. */
const specMark = (bins, v, text) => {
  const b = bins.reduce((best, x) => (Math.abs((x.from + x.to) / 2 - v) < Math.abs((best.from + best.to) / 2 - v) ? x : best), bins[0]);
  return { x: num((b.from + b.to) / 2, 3), borderColor: "#F04438", label: { text, style: { color: "#fff", background: "#F04438", fontSize: "9px" } } };
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
  const ann = (y, text, color, dash) => ({ y, borderColor: color, strokeDashArray: dash ? 4 : 0, label: { text: `${text} ${num(y, 4)}`, position: "right", style: { fontSize: "9px", color: "#fff", background: color } } });
  return (
    <Chart type="line" height={height} series={[{ name: range ? "R" : "X̄", data: vals }]} options={{
      chart: { background: "transparent", toolbar: { show: false }, animations: { enabled: false } }, colors: ["#1570EF"], stroke: { width: 1.8 },
      markers: { size: 3, discrete: bad.map((i) => ({ seriesIndex: 0, dataPointIndex: i, fillColor: "#F04438", strokeColor: "#F04438", size: 6 })) },
      xaxis: { categories: pts.map((p) => p.no), labels: { style: { colors: axisColor, fontSize: "9px" } }, tickAmount: Math.min(pts.length, 12) },
      yaxis: { min: lo, max: hi, labels: { style: { colors: axisColor }, formatter: (v) => num(v, range ? 3 : 3) } },
      annotations: { yaxis: [ucl != null && ann(ucl, "UCL", "#F04438", true), cl != null && ann(cl, "CL", "#12B76A"), lcl != null && ann(lcl, "LCL", "#F04438", true)].filter(Boolean) },
      grid, tooltip: { theme: dark ? "dark" : "light", custom: ({ dataPointIndex }) => { const p = pts[dataPointIndex]; if (!p) return "";
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
  const exportRaw = () => a && downloadCsv(`spc-${a.name}.csv`, ["No", "Time", "Value", "Inspector", "Gauge", "Position", "Result", "Plan", "WO", "Machine", "Mold", "Lot"],
    a.history.map((h) => [h.no, h.time, h.value, h.inspector, h.gauge, h.position, h.result, h.plan_no, h.wo_no, h.machine_code, h.mold_code, h.lot_no]));
  const exportChart = () => a && downloadCsv(`spc-chart-${a.name}.csv`, ["Point", "Time", a.chart_type === "IMR" ? "X" : "X-bar", "R / MR", "n", "Violation", "CL", "UCL", "LCL"],
    a.points.map((p) => [p.no, p.time, p.value, p.range, p.n, p.violation || "", a.cl, a.ucl, a.lcl]));
  const createNg = () => setNgDialog({ source: "SPC", product_id: productId, work_order_id: wo?.id || "", defect_code_id: (lookups?.defects || []).find((d) => d.reason_code === "DEF-010")?.id || "",
    ng_qty: a?.outside_spec || 1, description: a ? `SPC ${label("spcStatus", a.status)}: ${a.name}${lastViolation ? ` · ${tx(RULE_TEXT[lastViolation.rule])} (#${lastViolation.point_no})` : ""}` : "" });
  const quick = [
    [tx("Create SPC Report"), AssessmentOutlinedIcon, "#1570EF", () => window.print()],
    [tx("View Raw Data"), TableViewOutlinedIcon, "#0E9384", exportRaw, !a],
    [tx("Zoom Chart"), ZoomInOutlinedIcon, "#7A5AF8", () => setZoom(true), !a],
    [tx("Export Chart Data"), DownloadOutlinedIcon, "#12B76A", exportChart, !a],
    [tx("Root Cause Analysis"), ManageSearchOutlinedIcon, "#F79009", () => navigate(`/quality-management/ng-management${qsOf({ source: "SPC", date_from: new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10) })}`)],
    [tx("Corrective Action (CAPA)"), BuildCircleOutlinedIcon, "#F04438", createNg, !canEdit || !a],
  ];
  const toolbar = (
    <>
      <FilterSelect labelText={tx("Product")} value={f.product_id} onChange={(v) => setF((o) => ({ ...o, product_id: v, work_order_id: "", revision_id: "" }))} items={(lookups?.products || []).map((p) => [p.id, `${p.product_code} ${p.product_name}`])} width={170} />
      <FilterSelect labelText={tx("Revision")} value={f.revision_id} onChange={set("revision_id")} items={(overview?.revisions || []).map((r) => [r.id, `Rev ${r.revision_no} (${label("stdStatus", r.status)})`])} width={130} />
      <FilterSelect labelText={tx("Work Order")} value={f.work_order_id} onChange={set("work_order_id")} items={(lookups?.work_orders || []).filter((w) => !f.product_id || w.product_id === Number(f.product_id)).map((w) => [w.id, w.wo_no])} />
      <FilterSelect labelText={tx("Machine")} value={f.machine_id} onChange={set("machine_id")} items={(lookups?.machines || []).map((m) => [m.id, m.code])} width={115} />
      <FilterSelect labelText={tx("Mold")} value={f.mold_id} onChange={set("mold_id")} items={(lookups?.molds || []).map((m) => [m.id, m.code])} width={115} />
      <FilterSelect labelText={tx("Material Lot")} value={f.material_lot_id} onChange={set("material_lot_id")} items={(lookups?.lots || []).map((l) => [l.id, l.lot_no])} width={130} />
      <FilterSelect labelText={tx("Shift")} value={f.shift_id} onChange={set("shift_id")} items={(lookups?.shifts || []).map((x) => [x.id, x.name])} width={130} />
      <TextField size="small" type="date" label={tx("From")} value={f.date_from} onChange={(e) => set("date_from")(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 145 }} />
      <TextField size="small" type="date" label={tx("To")} value={f.date_to} onChange={(e) => set("date_to")(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 145 }} />
      <Button startIcon={<SearchIcon />} onClick={() => setApplied({ ...f })} disabled={!f.product_id && !f.work_order_id} sx={btn("primary")}>{tx("Search")}</Button>
    </>
  );

  return (
    <QualityFrame page={page} title={tx("SPC Monitoring")} loading={loading} ready={Boolean(overview) || (!filters.product_id && !filters.work_order_id)} lastUpdate={lastUpdate}
      onRefresh={() => loadOverview()} onExport={exportRaw} toolbar={toolbar}>
      {!overview ? <Alert severity="info">{tx("Select a product or a work order to analyse.")}</Alert> : (
        <>
          <Paper elevation={0} sx={{ ...cardSx, p: 1.5, mb: 1.5 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "90px minmax(0,1.1fr) minmax(0,1fr) minmax(0,1fr) auto" }, gap: 2, alignItems: "center" }}>
              <Box sx={{ width: 84, height: 84, borderRadius: 2, bgcolor: "action.hover", display: "grid", placeItems: "center", overflow: "hidden" }}>
                {overview.product.image_url ? <Box component="img" src={resolveImageUrl(overview.product.image_url)} alt="" sx={{ maxWidth: "100%", maxHeight: "100%" }} /> : <InventoryOutlinedIcon sx={{ fontSize: 44, color: "#1570EF" }} />}
              </Box>
              <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                  <Typography variant="subtitle1" fontWeight={800}>{overview.product.product_name}{overview.revision ? ` – Rev ${overview.revision.revision_no}` : ""}</Typography>
                  {wo ? <Box component="span" sx={{ px: 1, borderRadius: 1, fontSize: 11, fontWeight: 700, color: "#12B76A", border: "1px solid #12B76A55", bgcolor: "#12B76A1A" }}>{label("woStatus", wo.status)}</Box> : null}
                </Stack>
                <InfoRows rows={[[tx("Product Code"), overview.product.product_code], [tx("Customer"), overview.revision?.customer], [tx("Material"), overview.material ? `${overview.material.material_code} ${overview.material.material_name}` : EMPTY],
                  [tx("Standard"), overview.revision?.standard_name]]} />
              </Box>
              <InfoRows rows={[[tx("Work Order"), wo?.wo_no || tx("All work orders")], [tx("Planned Qty"), wo ? `${num(wo.planned_qty)} pcs` : EMPTY],
                [tx("Produced Qty"), wo ? `${num(wo.actual_qty)} pcs (${num((wo.actual_qty / Math.max(wo.planned_qty, 1)) * 100, 1)}%)` : EMPTY], [tx("Cycle Time"), wo?.cycle_time_sec ? `${wo.cycle_time_sec} s` : EMPTY]]} />
              <InfoRows rows={[[tx("Machine"), wo?.machine_code], [tx("Mold"), wo?.mold_code], [tx("Cavity"), wo?.cavity || wo?.cavity_count], [tx("Operator"), wo?.operator_code],
                [tx("Start"), wo?.started_at ? ddmmhhmm(wo.started_at) : EMPTY], [tx("Planned Finish"), wo?.planned_end ? ddmmhhmm(wo.planned_end) : EMPTY]]} />
              {wo ? <Button variant="outlined" size="small" onClick={() => navigate(`/production-management/work-orders/management?wo=${wo.id}`)}>{tx("View work order")}</Button> : <span />}
            </Box>
          </Paper>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "250px minmax(0,1fr) 330px" }, gap: 1.5, mb: 1.5 }}>
            <Stack spacing={1.5}>
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Characteristics")} />
                <Box sx={{ px: 1 }}>
                  <TextField size="small" fullWidth placeholder={tx("Search characteristic...")} value={search} onChange={(e) => setSearch(e.target.value)}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
                </Box>
                <Box sx={{ px: 1, pb: 1, maxHeight: 330, overflow: "auto" }}>
                  <Table size="small" sx={{ ...tableSx, "& td": { ...tableSx["& td, & th"], cursor: "pointer" } }}>
                    <TableHead><TableRow><TableCell /><TableCell>{tx("Characteristic")}</TableCell><TableCell>{tx("Unit")}</TableCell><TableCell>{tx("Chart")}</TableCell></TableRow></TableHead>
                    <TableBody>{chars.map((c) => (
                      <TableRow key={c.characteristic_id} hover selected={c.characteristic_id === charId} onClick={() => c.characteristic_type !== "ATTRIBUTE" && setCharId(c.characteristic_id)}
                        sx={{ opacity: c.characteristic_type === "ATTRIBUTE" ? 0.75 : 1 }}>
                        <TableCell sx={{ width: 16 }}><FiberManualRecordIcon sx={{ fontSize: 12, color: SPC_COLORS[c.status] }} titleAccess={label("spcStatus", c.status)} /></TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{c.name}{c.is_critical ? " ★" : ""}</TableCell><TableCell>{c.unit || "-"}</TableCell>
                        <TableCell>{c.characteristic_type === "ATTRIBUTE" ? `${tx("Attribute")}${c.ng ? ` · ${c.ng} NG` : ""}` : label("chartType", c.chart_type)}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                  {!chars.length ? <Typography variant="caption" color="text.secondary">{tx("No characteristics in the active standard.")}</Typography> : null}
                </Box>
              </Paper>
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("SPC Summary")} />
                <Stack spacing={0.75} sx={{ px: 1.5, pb: 1.5 }}>
                  {[[tx("Monitored characteristics"), s.monitored, "#1570EF"], [tx("Stable"), `${s.normal} (${s.total ? num((s.normal / s.total) * 100, 0) : 0}%)`, "#12B76A"],
                    [tx("Warning"), s.warning, "#F79009"], [tx("Out of control"), s.out_of_control, "#F04438"], [tx("No data"), s.no_data, "#98A2B3"],
                    [tx("Average Cp"), s.cp_avg ?? EMPTY, "#1570EF"], [tx("Average Cpk"), s.cpk_avg ?? EMPTY, "#1570EF"]].map(([t, v, color]) => (
                    <Stack key={t} direction="row" sx={{ justifyContent: "space-between", border: 1, borderColor: "divider", borderRadius: 1.5, px: 1, py: 0.5 }}>
                      <Typography variant="caption">{t}</Typography><Typography variant="caption" fontWeight={800} sx={{ color }}>{v}</Typography></Stack>
                  ))}
                  <Typography variant="caption" color="text.secondary">{tx("Updated")}: {lastUpdate ? lastUpdate.toLocaleString() : EMPTY}</Typography>
                </Stack>
              </Paper>
            </Stack>

            <Paper elevation={0} sx={cardSx}>
              <Head title={a ? `${a.name} (${a.unit || "-"}) – ${label("chartType", a.chart_type)}` : tx("Control Chart")}
                action={a ? <SpcStatusPill value={a.status} /> : null} />
              <Stack direction="row" sx={{ px: 1.5, gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                <ToggleButtonGroup exclusive size="small" value={chartType || a?.chart_type || "XBAR_R"} onChange={(e, v) => v && setChartType(v)}>
                  <ToggleButton value="XBAR_R" sx={{ px: 1.5, py: 0.25, textTransform: "none", fontWeight: 700 }}>X̄-R</ToggleButton>
                  <ToggleButton value="IMR" sx={{ px: 1.5, py: 0.25, textTransform: "none", fontWeight: 700 }}>I-MR</ToggleButton>
                </ToggleButtonGroup>
                <TextField select size="small" value={limit} onChange={(e) => setLimit(Number(e.target.value))} sx={{ width: 150 }}>
                  {[20, 25, 30, 50, 100].map((n) => <MenuItem key={n} value={n}>{tx("Last {n} points", { n })}</MenuItem>)}</TextField>
                <Box sx={{ flex: 1 }} />
                <Button size="small" startIcon={<ZoomInOutlinedIcon />} onClick={() => setZoom(true)} disabled={!a}>{tx("Zoom")}</Button>
                <Button size="small" startIcon={<DownloadOutlinedIcon />} onClick={exportChart} disabled={!a}>{tx("Export")}</Button>
              </Stack>
              {!a ? <LinearProgress sx={{ m: 2 }} /> : a.status === "NO_DATA" ? (
                <Alert severity="info" sx={{ m: 1.5 }}>{tx("Not enough data: at least 5 subgroups are needed.")} ({a.points.length})</Alert>
              ) : (
                <Box sx={{ px: 1, pb: 1 }}>
                  <Typography variant="caption" fontWeight={800} sx={{ px: 1 }}>{a.chart_type === "IMR" ? tx("Individuals (I)") : tx("X̄ Chart")}</Typography>
                  <ControlChart a={a} dark={dark} axisColor={axisColor} grid={grid} height={210} />
                  <Typography variant="caption" fontWeight={800} sx={{ px: 1 }}>{a.chart_type === "IMR" ? tx("Moving Range (MR)") : tx("R Chart")}</Typography>
                  <ControlChart a={a} dark={dark} axisColor={axisColor} grid={grid} height={160} range />
                  <Typography variant="caption" sx={{ px: 1, color: a.violations.length ? "#F04438" : "text.secondary" }}>
                    {tx("Rule violations")}: {a.violations.length ? a.violations.slice(-4).map((v) => `#${v.point_no} ${tx(RULE_TEXT[v.rule])}`).join(" · ") : tx("none")}
                  </Typography>
                </Box>
              )}
            </Paper>

            <Stack spacing={1.5}>
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Process Capability")} />
                {a && a.status !== "NO_DATA" ? (
                  <Box sx={{ px: 1.5, pb: 1.5 }}>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mb: 1 }}>
                      {[["Cp", a.cp], ["Cpk", a.cpk]].map(([t, v]) => (
                        <Box key={t} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 1, textAlign: "center" }}>
                          <Typography variant="caption" fontWeight={800}>{t}</Typography>
                          <Typography variant="h5" fontWeight={800} sx={{ color: v == null ? "text.secondary" : v >= a.cpk_target ? "#12B76A" : v >= 1 ? "#F79009" : "#F04438" }}>{v ?? EMPTY}</Typography>
                          <LinearProgress variant="determinate" value={Math.min(100, ((v || 0) / 2) * 100)} color={v >= a.cpk_target ? "success" : v >= 1 ? "warning" : "error"} sx={{ height: 6, borderRadius: 3 }} />
                          <Typography variant="caption" sx={{ color: "#1570EF" }}>{tx("Target")}: ≥ {a.cpk_target}</Typography>
                        </Box>
                      ))}
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 1.5 }}>
                      <InfoRows rows={[[tx("Mean"), num(a.mean, 4)], [tx("Std. Dev."), num(a.std_dev, 4)], ["UCL", num(a.ucl, 4)], ["CL", num(a.cl, 4)], ["LCL", num(a.lcl, 4)]]} />
                      <InfoRows rows={[["USL", a.usl ?? EMPTY], ["LSL", a.lsl ?? EMPTY], [tx("Spec. Range"), a.usl != null && a.lsl != null ? num(a.usl - a.lsl, 4) : EMPTY],
                        [tx("PPM (expected)"), num(a.ppm_expected)], [tx("PPM (out of spec)"), num(a.ppm_observed), a.ppm_observed ? "#F04438" : undefined]]} />
                    </Box>
                  </Box>
                ) : <Typography variant="caption" color="text.secondary" sx={{ px: 1.5, display: "block", pb: 1.5 }}>{tx("No data.")}</Typography>}
              </Paper>
              <Paper elevation={0} sx={{ ...cardSx, borderColor: a && a.status !== "NORMAL" ? SPC_COLORS[a.status] : undefined }}>
                <Head title={tx("SPC Status")} />
                {a ? (
                  <Stack direction="row" spacing={1.5} sx={{ px: 1.5, pb: 1.5, alignItems: "center" }}>
                    <WarningAmberOutlinedIcon sx={{ fontSize: 34, color: SPC_COLORS[a.status] }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={800} sx={{ color: SPC_COLORS[a.status] }}>{label("spcStatus", a.status)}</Typography>
                      <Typography variant="caption">{lastViolation ? tx(RULE_TEXT[lastViolation.rule]) : a.cpk != null && a.cpk < a.cpk_target ? tx("Cpk below target") : tx("Process stable")}</Typography>
                    </Box>
                    {lastViolation ? <InfoRows rows={[[tx("Last violation"), ddmmhhmm(lastViolation.time)], [tx("Point"), `#${lastViolation.point_no}`]]} /> : null}
                  </Stack>
                ) : null}
              </Paper>
            </Stack>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr)" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={`${tx("Measurement History")}${a ? ` (${a.name})` : ""}`} action={<Typography variant="caption" color="text.secondary">{tx("read only")}</Typography>} />
              <Box sx={{ px: 1, pb: 1, height: 260, overflow: "auto" }}>
                <Table size="small" stickyHeader sx={tableSx}>
                  <TableHead><TableRow><TableCell>#</TableCell><TableCell>{tx("Time")}</TableCell><TableCell align="right">{tx("Value")}</TableCell><TableCell>{tx("Inspector")}</TableCell>
                    <TableCell>{tx("Measuring Equipment")}</TableCell><TableCell>{tx("Sampling Position")}</TableCell><TableCell>{tx("Work Order")}</TableCell><TableCell align="center">{tx("Result")}</TableCell><TableCell>{tx("Remark")}</TableCell></TableRow></TableHead>
                  <TableBody>{(a?.history || []).slice().reverse().map((h) => (
                    <TableRow key={h.no} sx={{ bgcolor: h.result === "NG" ? "#F044380D" : undefined }}>
                      <TableCell>{h.no}</TableCell><TableCell>{ddmmhhmm(h.time)}</TableCell><TableCell align="right" sx={{ fontWeight: 700, color: h.result === "NG" ? "#F04438" : undefined }}>{num(h.value, 4)}</TableCell>
                      <TableCell>{h.inspector}</TableCell><TableCell title={h.gauge_name}>{h.gauge || EMPTY}</TableCell><TableCell>{h.position}</TableCell><TableCell>{h.wo_no || h.machine_code || EMPTY}</TableCell>
                      <TableCell align="center"><ResultText value={h.result} /></TableCell><TableCell>{h.remark || EMPTY}</TableCell></TableRow>
                  ))}</TableBody>
                </Table>
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Histogram")} />
              <Box sx={{ px: 1 }}>
                {a?.histogram?.length ? (
                  <Chart type="bar" height={240} series={[{ name: tx("Count"), data: a.histogram.map((b) => b.count) }]} options={{
                    chart: { background: "transparent", toolbar: { show: false } }, colors: ["#1570EF"], plotOptions: { bar: { columnWidth: "92%" } }, dataLabels: { enabled: false }, grid,
                    xaxis: { categories: a.histogram.map((b) => num((b.from + b.to) / 2, 3)), labels: { style: { colors: axisColor, fontSize: "9px" }, rotate: -45 } },
                    yaxis: { labels: { style: { colors: axisColor } } },
                    annotations: { xaxis: [a.lsl != null && specMark(a.histogram, a.lsl, "LSL"), a.usl != null && specMark(a.histogram, a.usl, "USL")].filter(Boolean) },
                    tooltip: { theme: dark ? "dark" : "light", x: { formatter: (v, o) => { const b = a.histogram[o.dataPointIndex]; return b ? `${num(b.from, 4)} – ${num(b.to, 4)}` : v; } } } }} />
                ) : <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>{tx("No data.")}</Typography>}
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Cpk Trend")} />
              <Box sx={{ px: 1 }}>
                {a?.cpk_trend?.length ? (
                  <Chart type="line" height={240} series={[{ name: "Cpk", data: a.cpk_trend.map((x) => x.cpk) }]} options={{
                    chart: { background: "transparent", toolbar: { show: false } }, colors: ["#12B76A"], stroke: { width: 2.5 }, markers: { size: 4 }, grid,
                    xaxis: { categories: a.cpk_trend.map((x) => dateText(x.date).slice(0, 5)), labels: { style: { colors: axisColor, fontSize: "10px" } } },
                    yaxis: { min: 0, labels: { style: { colors: axisColor }, formatter: (v) => num(v, 2) } },
                    annotations: { yaxis: [{ y: a.cpk_target, borderColor: "#1570EF", strokeDashArray: 4, label: { text: `${tx("Target")} (${a.cpk_target})`, style: { fontSize: "9px", color: "#fff", background: "#1570EF" } } }] },
                    tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v, o) => `${num(v, 3)} · n=${a.cpk_trend[o.dataPointIndex].count}` } } }} />
                ) : <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>{tx("No data.")}</Typography>}
              </Box>
            </Paper>
          </Box>

          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Quick Actions")} />
            <Box sx={{ px: 1.5, pb: 1.5 }}><QuickActionGrid actions={quick} columns={{ xs: "repeat(2, 1fr)", md: "repeat(3, 1fr)", xl: "repeat(6, 1fr)" }} /></Box>
          </Paper>
        </>
      )}
      {zoom && a ? (
        <Dialog open onClose={() => setZoom(false)} maxWidth="xl" fullWidth>
          <DialogContent>
            <Typography variant="subtitle1" fontWeight={800}>{a.name} – {label("chartType", a.chart_type)} · <SpcStatusPill value={a.status} /></Typography>
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
