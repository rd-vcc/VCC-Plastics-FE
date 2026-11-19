import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import {
  Alert, Box, Button, CircularProgress, FormControl, InputAdornment, InputLabel, LinearProgress, MenuItem, Paper, Select,
  Snackbar, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, ThemeProvider as MuiThemeProvider, Typography,
} from "@mui/material";
import CallReceivedOutlinedIcon from "@mui/icons-material/CallReceivedOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import HourglassBottomOutlinedIcon from "@mui/icons-material/HourglassBottomOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import RecyclingOutlinedIcon from "@mui/icons-material/RecyclingOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";

import { getCurrentUser } from "../../../auth/auth";
import usePagePermission from "../../../auth/usePagePermission";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import AgGridTable from "../../../components/tables/BasicTables/BasicTableOne";
import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { useTheme as useAppTheme } from "../../../context/ThemeContext";
import { Dot, EMPTY, Head, QuickAction, QuickActions, btn, cardSx, ddmmhhmm, num, pageTheme } from "../../ProductionManagement/ProductionPlanning/ui";
import { label, localeTag, setActiveLanguage, tx } from "../materialLocales";
import { fitColumns, colShares, KpiTile, LOT_STATUS_COLORS, LotStatusPill, MATERIAL_API, downloadExcel, person, qty, useRequest } from "../materialUi";
import {
  AdjustDialog, IqcDialog, LocationsDialog, LotDetailDialog, LotTimeline, ReasonDialog, ReceiveDialog, RegrindDialog, TransferDialog,
} from "./LotDialogs";

const STATUS_KEYS = ["IN_STOCK", "IN_USE", "WAITING_IQC", "HOLD", "EXPIRED"];
const EMPTY_FILTER = { category: "", material_id: "", keyword: "", supplier: "", status: "", location_id: "" };

export default function MaterialLotHistory() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  const { theme } = useAppTheme();
  const dark = theme === "dark";
  const muiTheme = useMemo(() => pageTheme(theme), [theme]);
  const { canEdit } = usePagePermission();
  const actor = getCurrentUser()?.employee_code || "SYSTEM";
  const request = useRequest();
  const [params, setParams] = useSearchParams();

  const [lookups, setLookups] = useState(null);
  const [data, setData] = useState(null);
  const [moves, setMoves] = useState([]);
  const [filter, setFilter] = useState({ ...EMPTY_FILTER, keyword: params.get("lot") || "", status: params.get("status") || "" });
  const [selected, setSelected] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [msg, setMsg] = useState({ open: false, type: "success", text: "" });
  const notify = useCallback((type, text) => setMsg({ open: true, type, text }), []);

  const loadLookups = useCallback(() => request(`${MATERIAL_API}/lookups`).then(setLookups).catch((e) => notify("error", e.message)), [request, notify]);
  useEffect(() => { loadLookups(); }, [loadLookups]);

  const load = useCallback(async ({ silent } = {}) => {
    if (!silent) setLoading(true);
    try {
      const q = new URLSearchParams();
      Object.entries(filter).forEach(([k, v]) => { if (v !== "" && v != null) q.set(k, v); });
      const [lots, txns] = await Promise.all([request(`${MATERIAL_API}/lots?${q}`), request(`${MATERIAL_API}/transactions?limit=30`)]);
      setData(lots); setMoves(txns); setLastUpdate(new Date());
    } catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [filter, request, notify]);
  useEffect(() => { const t = setTimeout(() => load(), 250); return () => clearTimeout(t); }, [load]);

  const openLot = useCallback(async (lotId, showDialog) => {
    try {
      const lot = await request(`${MATERIAL_API}/lots/${lotId}`);
      setSelected(lot);
      setParams((p) => { const n = new URLSearchParams(p); n.set("lot", lot.lot_no); return n; }, { replace: true });
      if (showDialog) setDialog({ type: "detail" });
    } catch (e) { notify("error", e.message); }
  }, [request, notify, setParams]);
  useEffect(() => {
    const lotNo = params.get("lot");
    if (!selected && lotNo && data?.items?.length) {
      const match = data.items.find((l) => l.lot_no === lotNo);
      if (match) openLot(match.id, false);
    }
  }, [data, params, selected, openLot]);

  const run = async (fn, text) => {
    setSaving(true);
    try {
      const result = await fn();
      notify("success", text); setDialog(null);
      await load({ silent: true });
      const id = result?.id || selected?.id;
      if (id) await openLot(id, false);
      return true;
    } catch (e) { notify("error", e.message); return false; } finally { setSaving(false); }
  };
  const post = (url, body) => request(url, { method: "POST", body: JSON.stringify(body) });
  const lotAction = (lot, step, body, text) => run(() => post(`${MATERIAL_API}/lots/${lot.id}/${step}`, { ...body, version: lot.version, actor }), text);
  const onDetailAction = (key, lot) => {
    if (key === "hold") setDialog({ type: lot.status === "HOLD" ? "release" : "hold", lot });
    else setDialog({ type: key, lot });
  };
  const saveLocation = async (id, body) => {
    setSaving(true);
    try {
      await request(id ? `${MATERIAL_API}/locations/${id}` : `${MATERIAL_API}/locations`, { method: id ? "PUT" : "POST", body: JSON.stringify({ ...body, actor }) });
      notify("success", tx("Location saved.")); await loadLookups(); return true;
    } catch (e) { notify("error", e.message); return false; } finally { setSaving(false); }
  };

  const items = useMemo(() => data?.items || [], [data]);
  const summary = data?.summary;
  const warningDays = lookups?.settings?.["material.expiry_warning_days"] ?? 30;
  const nearExpiry = useMemo(() => items.filter((l) => l.days_to_expiry != null && l.days_to_expiry >= 0 && l.days_to_expiry <= warningDays).sort((a, b) => a.days_to_expiry - b.days_to_expiry), [items, warningDays]);
  const byLocation = useMemo(() => {
    const map = {};
    items.forEach((l) => {
      if (String(l.unit).toUpperCase() !== "KG") return;
      map[l.location_name] = (map[l.location_name] || 0) + l.current_qty;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [items]);

  const exportLots = () => downloadExcel(`material-lots-${new Date().toISOString().slice(0, 10)}.csv`,
    ["Lot No", "Material", "Material Name", "Group", "Supplier", "Supplier Lot", "Received", "Expiry", "Location", "Quantity", "Unit", "Reserved", "Status", "Source", "Source WO"],
    items.map((l) => [l.lot_no, l.material_code, l.material_name, label("category", l.category), l.supplier, l.supplier_lot_no, l.received_at, l.expiry_date,
      l.location_name, l.current_qty, l.unit, l.reserved_qty, l.effective_status, l.source, l.source_wo_no]));

  const columns = useMemo(() => fitColumns([
    { headerName: tx("Lot No."), field: "lot_no", width: 112, cellStyle: { fontWeight: 700 } },
    { headerName: tx("Material"), field: "material_code", width: 84 },
    { headerName: tx("Status"), field: "effective_status", width: 112, cellRenderer: (p) => <LotStatusPill value={p.value} /> },
    { headerName: tx("Group"), colId: "category", width: 104, valueGetter: (p) => label("category", p.data.category) },
    { headerName: tx("Supplier"), field: "supplier", width: 104, valueFormatter: (p) => p.value || EMPTY },
    { headerName: tx("Received"), field: "received_at", width: 88, valueFormatter: (p) => (p.value ? String(p.value).slice(0, 10).split("-").reverse().join("/") : EMPTY) },
    { headerName: tx("Expiry"), field: "expiry_date", width: 88, valueFormatter: (p) => (p.value ? String(p.value).split("-").reverse().join("/") : EMPTY),
      cellStyle: (p) => ({ color: p.data.effective_status === "EXPIRED" ? "#F04438" : p.data.near_expiry ? "#F79009" : undefined, fontWeight: p.data.near_expiry || p.data.effective_status === "EXPIRED" ? 700 : 400 }) },
    { headerName: tx("Location"), field: "location_name", width: 104, tooltipField: "location_name" },
    { headerName: tx("Quantity"), field: "current_qty", width: 84, type: "numericColumn", valueFormatter: (p) => qty(p.value, p.data.unit) },
    { headerName: tx("Source"), colId: "source", width: 96, valueGetter: (p) => `${label("source", p.data.source)}${p.data.source_wo_no ? ` · ${p.data.source_wo_no}` : ""}` },
  ]), [language]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lookups) return <Box sx={{ height: 400, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;

  const statusSeries = STATUS_KEYS.map((k) => summary?.by_status?.[k] || 0);
  const selectSx = { minWidth: 150, flex: "1 1 150px" };
  const quick = [
    [tx("Receive Material"), CallReceivedOutlinedIcon, "#1570EF", () => setDialog({ type: "receive" }), !canEdit, true],
    [tx("Create Regrind Lot"), RecyclingOutlinedIcon, "#12B76A", () => setDialog({ type: "regrind" }), !canEdit],
    [tx("Record IQC Result"), ScienceOutlinedIcon, "#7A5AF8", () => selected && setDialog({ type: "iqc", lot: selected }), !canEdit || selected?.status !== "WAITING_IQC"],
    [tx("Transfer Lot"), SwapHorizOutlinedIcon, "#F79009", () => selected && setDialog({ type: "transfer", lot: selected }), !canEdit || !selected || !["IN_STOCK", "HOLD", "WAITING_IQC"].includes(selected.status)],
    [tx("Hold / Release"), BlockOutlinedIcon, "#F04438", () => selected && onDetailAction("hold", selected), !canEdit || !selected || !["IN_STOCK", "WAITING_IQC", "HOLD"].includes(selected.status)],
    [tx("View lot detail"), Inventory2OutlinedIcon, "#1570EF", () => selected && setDialog({ type: "detail" }), !selected],
  ];
  const activeFilters = ["category", "material_id", "supplier", "status", "location_id"].filter((key) => filter[key]).length;
  const toolBtnSx = { ...btn("cancel"), bgcolor: "background.paper", border: 1, borderColor: "divider" };
  const fill = { flex: 1, minHeight: 0 };
  const panel = { ...cardSx, display: "flex", flexDirection: "column", minHeight: { xs: 220, xl: 0 } };
  const axisColor = dark ? "#A7B0C0" : "#667085";
  const maxLocation = Math.max(...byLocation.map(([, value]) => value), 1);

  return (
    <MuiThemeProvider theme={muiTheme}>
      {/* One screen on lg+: toolbar · KPI · 3-column grid (lots ×2 | status + expiring / moves | traceability | stock by location + quick actions bottom-right) */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, height: { lg: "calc(var(--app-vh, 100vh) - 74px)" }, minHeight: 0, "& > *": { flexShrink: 0 } }}>
        <PageMeta title={`${tx("Material Lot History")} | VCC Plastics`} description={tx("Track the history and origin of every material lot")} />
        <PageBreadcrumb pageTitle={tx("Material Lot History")} />

        <Paper elevation={0} sx={{ ...cardSx, p: 0.75 }}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Button startIcon={<RefreshIcon />} onClick={() => load()} sx={toolBtnSx}>{tx("Refresh")}</Button>
            <Button startIcon={<FilterListIcon />} onClick={() => setShowFilter((v) => !v)}
              sx={{ ...toolBtnSx, ...(showFilter || activeFilters ? { borderColor: "primary.main", color: "primary.main" } : {}) }}>
              {tx("Filter")}{activeFilters ? ` (${activeFilters})` : ""}
            </Button>
            <TextField size="small" placeholder={tx("Search lot no. or material...")} value={filter.keyword} onChange={(e) => setFilter((f) => ({ ...f, keyword: e.target.value }))} sx={{ width: 260 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
            <Button startIcon={<PlaceOutlinedIcon />} onClick={() => setDialog({ type: "locations" })} sx={toolBtnSx}>{tx("Locations")}</Button>
            <Button startIcon={<FileDownloadOutlinedIcon />} disabled={!items.length} onClick={exportLots} sx={toolBtnSx}>{tx("Export Lot Report")}</Button>
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">{tx("Last Update")}: {lastUpdate ? lastUpdate.toLocaleString(localeTag()) : EMPTY}</Typography>
          </Stack>
          {showFilter ? (
            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center", mt: 0.75 }}>
              <FormControl size="small" sx={selectSx}><InputLabel shrink>{tx("Group")}</InputLabel>
                <Select displayEmpty notched label={tx("Group")} value={filter.category} onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value }))}>
                  <MenuItem value="">{tx("All")}</MenuItem>{lookups.categories.map((c) => <MenuItem key={c} value={c}>{label("category", c)}</MenuItem>)}
                </Select></FormControl>
              <FormControl size="small" sx={selectSx}><InputLabel shrink>{tx("Material")}</InputLabel>
                <Select displayEmpty notched label={tx("Material")} value={filter.material_id} onChange={(e) => setFilter((f) => ({ ...f, material_id: e.target.value }))}>
                  <MenuItem value="">{tx("All")}</MenuItem>{lookups.materials.map((m) => <MenuItem key={m.id} value={m.id}>{m.material_code}</MenuItem>)}
                </Select></FormControl>
              <FormControl size="small" sx={selectSx}><InputLabel shrink>{tx("Supplier")}</InputLabel>
                <Select displayEmpty notched label={tx("Supplier")} value={filter.supplier} onChange={(e) => setFilter((f) => ({ ...f, supplier: e.target.value }))}>
                  <MenuItem value="">{tx("All")}</MenuItem>{lookups.suppliers.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select></FormControl>
              <FormControl size="small" sx={selectSx}><InputLabel shrink>{tx("Status")}</InputLabel>
                <Select displayEmpty notched label={tx("Status")} value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}>
                  <MenuItem value="">{tx("All")}</MenuItem>
                  {[...STATUS_KEYS, "NEAR_EXPIRY"].map((s) => <MenuItem key={s} value={s}>{s === "NEAR_EXPIRY" ? tx("Near expiry") : label("lotStatus", s)}</MenuItem>)}
                </Select></FormControl>
              <FormControl size="small" sx={selectSx}><InputLabel shrink>{tx("Location")}</InputLabel>
                <Select displayEmpty notched label={tx("Location")} value={filter.location_id} onChange={(e) => setFilter((f) => ({ ...f, location_id: e.target.value }))}>
                  <MenuItem value="">{tx("All")}</MenuItem>{lookups.locations.map((l) => <MenuItem key={l.id} value={l.id}>{l.location_name}</MenuItem>)}
                </Select></FormControl>
              <Button onClick={() => setFilter(EMPTY_FILTER)} sx={btn("cancel")}>{tx("Clear")}</Button>
            </Stack>
          ) : null}
          {loading ? <LinearProgress sx={{ mt: 0.5, height: 2 }} /> : null}
        </Paper>

        <KpiCardGroup>
          <KpiTile title={tx("Total Lots")} value={num(summary?.total)} unit={tx("lots")} icon={Inventory2OutlinedIcon} tone="primary" />
          <KpiTile title={tx("In Stock")} value={num(summary?.in_stock)} unit={tx("lots")} icon={WarehouseOutlinedIcon} tone="success" onClick={() => setFilter((f) => ({ ...f, status: "IN_STOCK" }))} />
          <KpiTile title={tx("In Use")} value={num(summary?.in_use)} unit={tx("lots")} icon={HourglassBottomOutlinedIcon} tone="warning" onClick={() => setFilter((f) => ({ ...f, status: "IN_USE" }))} />
          <KpiTile title={tx("In IQC")} value={num(summary?.waiting_iqc)} unit={tx("lots")} icon={ScienceOutlinedIcon} tone="accent" onClick={() => setFilter((f) => ({ ...f, status: "WAITING_IQC" }))} />
          <KpiTile title={tx("On Hold")} value={num(summary?.hold)} unit={tx("lots")} icon={BlockOutlinedIcon} tone="danger" onClick={() => setFilter((f) => ({ ...f, status: "HOLD" }))} />
          <KpiTile title={tx("Expiring (≤{days} days)", { days: warningDays })} value={num(summary?.near_expiry)} unit={tx("lots")} icon={ScheduleOutlinedIcon} tone="info" onClick={() => setFilter((f) => ({ ...f, status: "NEAR_EXPIRY" }))} />
        </KpiCardGroup>

        {/* One 3-column grid so every card edge lines up; quick actions in the bottom-right corner */}
        <Box sx={{ flex: { lg: "1 1 0" }, minHeight: 0, display: "grid", gap: 1,
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr", xl: "repeat(3, minmax(0,1fr))" }, gridTemplateRows: { xl: "minmax(0,1.2fr) minmax(0,1fr)" } }}>
          <Paper elevation={0} sx={{ ...panel, gridColumn: { lg: "1 / -1", xl: "1 / span 2" } }}>
            <Head title={tx("Material Lot List")} subtitle={`(${items.length})`} action={selected ? <Typography variant="caption" color="text.secondary" noWrap>{tx("Selected")}: <b>{selected.lot_no}</b></Typography> : null} />
            <Box sx={{ ...fill, px: 1, pb: 1, minHeight: { xs: 320, xl: 0 } }}>
              <AgGridTable rowData={items} columnDefs={columns} height="100%" rowHeight={27}
                getRowId={(p) => String(p.data.id)} onRowClicked={(e) => openLot(e.data.id, false)}
                getRowStyle={(p) => (p.data.id === selected?.id ? { background: dark ? "rgba(46,144,250,.16)" : "#EFF8FF" } : null)} />
            </Box>
          </Paper>
          <Stack spacing={1} sx={{ minHeight: 0 }}>
            <Paper elevation={0} sx={{ ...panel, flex: 1 }}>
              <Head title={tx("Lot Status Distribution")} />
              <Box sx={{ ...fill, display: "grid", gridTemplateColumns: "120px minmax(0,1fr)", alignItems: "center", gap: 1, pl: 0.5, pr: 1.5 }}>
                <Chart type="donut" height={124} series={summary?.total ? statusSeries : [1]} options={{
                  chart: { background: "transparent", fontFamily: '"Bai Jamjuree", sans-serif' }, labels: summary?.total ? STATUS_KEYS.map((k) => label("lotStatus", k)) : [tx("No data.")],
                  colors: summary?.total ? STATUS_KEYS.map((k) => LOT_STATUS_COLORS[k]) : ["#EAECF0"], legend: { show: false }, dataLabels: { enabled: false }, stroke: { width: 2, colors: [dark ? "#111827" : "#fff"] },
                  plotOptions: { pie: { donut: { size: "76%", labels: { show: true, total: { show: true, label: tx("lots"), fontSize: "10px", color: axisColor, formatter: () => String(summary?.total || 0) }, name: { fontSize: "10px", offsetY: -2 }, value: { fontSize: "18px", fontWeight: 800, offsetY: 2, color: dark ? "#F3F4F6" : "#172033" } } } } },
                  tooltip: { enabled: Boolean(summary?.total), theme: dark ? "dark" : "light" },
                }} />
                <Stack spacing={0.6} sx={{ minWidth: 0 }}>
                  {STATUS_KEYS.map((k, i) => (
                    <Box key={k} sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", columnGap: 1, alignItems: "center" }}>
                      <Box sx={{ minWidth: 0, overflow: "hidden", "& .MuiTypography-root": { fontSize: 11, whiteSpace: "nowrap" } }}><Dot color={LOT_STATUS_COLORS[k]} text={label("lotStatus", k)} /></Box>
                      <Typography variant="caption" sx={{ fontSize: 11, whiteSpace: "nowrap" }}><b>{statusSeries[i]}</b> <Box component="span" sx={{ color: "text.secondary" }}>· {num(summary?.total ? (statusSeries[i] / summary.total) * 100 : 0, 0)}%</Box></Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Paper>
            <Paper elevation={0} sx={{ ...panel, flex: 1 }}>
              <Head title={tx("Lots Expiring (≤{days} days)", { days: warningDays })} />
              <Box sx={{ ...fill, px: 1, pb: 1, overflow: "auto" }}>
                <Table size="small" stickyHeader sx={{ "& td, & th": { fontSize: 11, px: 0.75 }, "& th": { color: "text.secondary", fontWeight: 800 }, ...colShares(20, 15, 16, 19, 12, 18) }}>
                  <TableHead><TableRow><TableCell>{tx("Lot No.")}</TableCell><TableCell>{tx("Material")}</TableCell><TableCell title={tx("Expiry")}>{tx("Expiry (short)")}</TableCell><TableCell align="right" title={tx("Days left")}>{tx("Days left (short)")}</TableCell><TableCell align="right" title={tx("Quantity")}>{tx("Qty (short)")}</TableCell><TableCell title={tx("Location")}>{tx("Location (short)")}</TableCell></TableRow></TableHead>
                  <TableBody>
                    {nearExpiry.length === 0 ? <TableRow><TableCell colSpan={6}><Typography variant="caption" color="text.disabled">{tx("No data.")}</Typography></TableCell></TableRow> : nearExpiry.map((l) => (
                      <TableRow key={l.id} hover sx={{ cursor: "pointer" }} onClick={() => openLot(l.id, true)}>
                        <TableCell>{l.lot_no}</TableCell><TableCell>{l.material_code}</TableCell><TableCell>{String(l.expiry_date).split("-").reverse().join("/")}</TableCell>
                        <TableCell align="right" sx={{ color: l.days_to_expiry <= 15 ? "#F04438" : "#F79009", fontWeight: 800 }}>{l.days_to_expiry}</TableCell>
                        <TableCell align="right">{qty(l.current_qty, l.unit)}</TableCell><TableCell title={l.location_name}>{l.location_name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
          </Stack>

          <Paper elevation={0} sx={panel}>
            <Head title={tx("Lot Movement History (latest)")} />
            <Box sx={{ ...fill, px: 1, pb: 1, overflow: "auto" }}>
              <Table size="small" stickyHeader sx={{ "& td, & th": { fontSize: 11, px: 0.75 }, "& th": { color: "text.secondary", fontWeight: 800 }, ...colShares(17, 19, 13, 15, 17, 19) }}>
                <TableHead><TableRow><TableCell>{tx("Time")}</TableCell><TableCell>{tx("Lot No.")}</TableCell><TableCell title={tx("From")}>{tx("From (short)")}</TableCell><TableCell title={tx("To")}>{tx("To (short)")}</TableCell><TableCell title={tx("Transaction")}>{tx("Transaction (short)")}</TableCell><TableCell title={tx("Operator")}>{tx("Operator (short)")}</TableCell></TableRow></TableHead>
                <TableBody>
                  {moves.length === 0 ? <TableRow><TableCell colSpan={6}><Typography variant="caption" color="text.disabled">{tx("No data.")}</Typography></TableCell></TableRow> : moves.map((t) => (
                    <TableRow key={t.id} hover sx={{ cursor: "pointer" }} onClick={() => openLot(t.lot_id, false)}>
                      <TableCell title={ddmmhhmm(t.acted_at)}>{ddmmhhmm(t.acted_at)}</TableCell><TableCell title={`${t.lot_no} · ${t.material_code}`}>{t.lot_no}</TableCell>
                      <TableCell title={t.from_location || ""}>{t.from_location || EMPTY}</TableCell><TableCell title={t.to_location || ""}>{t.to_location || EMPTY}</TableCell>
                      <TableCell title={label("txn", t.txn_type)}>{label("txn", t.txn_type)}</TableCell><TableCell title={person(t.actor_name, t.actor_code || t.actor)}>{person(t.actor_name, t.actor_code || t.actor)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
          <Paper elevation={0} sx={panel}>
            <Head title={tx("Lot Traceability")} subtitle={selected ? `· ${selected.lot_no}` : ""} />
            {selected ? <Box sx={{ ...fill, px: 1.5, pb: 1.25, overflow: "auto" }}><LotTimeline lot={selected} dense /></Box> : (
              <Box sx={{ flex: 1, display: "grid", placeItems: "center", pb: 2 }}><Typography variant="caption" color="text.disabled">{tx("Select a lot to see its history.")}</Typography></Box>
            )}
          </Paper>
          <Stack spacing={1} sx={{ minHeight: 0 }}>
            <Paper elevation={0} sx={{ ...panel, flex: 1 }}>
              <Head title={tx("Stock by Lot Location")} subtitle="(t)" />
              {byLocation.length === 0 ? <Box sx={{ flex: 1, display: "grid", placeItems: "center", pb: 2 }}><Typography variant="caption" color="text.disabled">{tx("No data.")}</Typography></Box> : (
                <Stack sx={{ ...fill, px: 1.5, pb: 1, gap: 1.1, overflow: "auto", justifyContent: byLocation.length < 4 ? "center" : "flex-start" }}>
                  {byLocation.map(([loc, value]) => (
                    <Box key={loc}>
                      <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", mb: 0.3 }}>
                        <Typography variant="caption" noWrap sx={{ minWidth: 0, fontSize: 11.5 }}>{loc}</Typography>
                        <Typography variant="caption" fontWeight={800} sx={{ fontSize: 11.5 }}>{num(value / 1000, 3)} t</Typography>
                      </Stack>
                      <Box sx={{ height: 6, borderRadius: 3, bgcolor: "action.hover", overflow: "hidden" }}><Box sx={{ width: `${(value / maxLocation) * 100}%`, height: "100%", borderRadius: 3, bgcolor: "#1570EF" }} /></Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
            <Paper elevation={0} sx={{ ...cardSx, flexShrink: 0 }}>
              <Head title={tx("Quick Actions")} />
              <QuickActions columns={3} sx={{ pb: 1.25 }}>
                {quick.map(([text, Icon, color, onClick, disabled, primary]) => <QuickAction key={text} icon={Icon} text={text} color={color} onClick={onClick} disabled={disabled} primary={primary} />)}
              </QuickActions>
            </Paper>
          </Stack>
        </Box>

        {dialog?.type === "receive" && <ReceiveDialog lookups={lookups} saving={saving} onClose={() => setDialog(null)}
          onSave={(body) => run(async () => { const r = await post(`${MATERIAL_API}/lots/receive`, { ...body, actor }); await loadLookups(); return r; }, tx("Lot received."))} />}
        {dialog?.type === "regrind" && <RegrindDialog lookups={lookups} saving={saving} onClose={() => setDialog(null)}
          onSave={(body) => run(() => post(`${MATERIAL_API}/lots/regrind`, { ...body, actor }), tx("Regrind lot created."))} />}
        {dialog?.type === "locations" && <LocationsDialog locations={lookups.locations} machines={lookups.machines} canEdit={canEdit} saving={saving} onClose={() => setDialog(null)} onSave={saveLocation} />}
        {dialog?.type === "detail" && selected && <LotDetailDialog lot={selected} canEdit={canEdit} saving={saving} onClose={() => setDialog(null)} onAction={onDetailAction} />}
        {dialog?.type === "iqc" && <IqcDialog lot={dialog.lot} locations={lookups.locations} saving={saving} onClose={() => setDialog(null)}
          onSave={(body) => lotAction(dialog.lot, "iqc", body, tx("IQC result recorded."))} />}
        {dialog?.type === "transfer" && <TransferDialog lot={dialog.lot} locations={lookups.locations} saving={saving} onClose={() => setDialog(null)}
          onSave={(body) => lotAction(dialog.lot, "transfer", body, tx("Lot moved."))} />}
        {dialog?.type === "hold" && <ReasonDialog lot={dialog.lot} danger required title={tx("Hold / Release")} fieldLabel={tx("Hold reason")} saving={saving} onClose={() => setDialog(null)}
          onSave={(reason) => lotAction(dialog.lot, "hold", { reason }, tx("Lot put on hold."))} />}
        {dialog?.type === "release" && <ReasonDialog lot={dialog.lot} title={tx("Hold / Release")} fieldLabel={tx("Release reason")} required={dialog.lot.iqc_result === "FAIL"}
          helper={tx("Required for lots that failed IQC.")} saving={saving} onClose={() => setDialog(null)}
          onSave={(remark) => lotAction(dialog.lot, "release", { remark }, tx("Lot released."))} />}
        {dialog?.type === "adjust" && <AdjustDialog lot={dialog.lot} saving={saving} onClose={() => setDialog(null)}
          onSave={(body) => lotAction(dialog.lot, "adjust", body, tx("Lot quantity adjusted."))} />}

        <Snackbar open={msg.open} autoHideDuration={4500} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}

