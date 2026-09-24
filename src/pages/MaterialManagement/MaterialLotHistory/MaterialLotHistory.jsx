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
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
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
import TravelExploreOutlinedIcon from "@mui/icons-material/TravelExploreOutlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";

import { getCurrentUser } from "../../../auth/auth";
import usePagePermission from "../../../auth/usePagePermission";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import AgGridTable from "../../../components/tables/BasicTables/BasicTableOne";
import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { useTheme as useAppTheme } from "../../../context/ThemeContext";
import { Dot, EMPTY, Head, btn, cardSx, ddmmhhmm, num, pageTheme } from "../../ProductionManagement/ProductionPlanning/ui";
import { label, localeTag, setActiveLanguage, tx } from "../materialLocales";
import { KpiTile, LOT_STATUS_COLORS, LotStatusPill, MATERIAL_API, downloadCsv, qty, useRequest } from "../materialUi";
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

  const exportLots = () => downloadCsv(`material-lots-${new Date().toISOString().slice(0, 10)}.csv`,
    ["Lot No", "Material", "Material Name", "Group", "Supplier", "Supplier Lot", "Received", "Expiry", "Location", "Quantity", "Unit", "Reserved", "Status", "Source", "Source WO"],
    items.map((l) => [l.lot_no, l.material_code, l.material_name, label("category", l.category), l.supplier, l.supplier_lot_no, l.received_at, l.expiry_date,
      l.location_name, l.current_qty, l.unit, l.reserved_qty, l.effective_status, l.source, l.source_wo_no]));

  const columns = useMemo(() => [
    { headerName: tx("Lot No."), field: "lot_no", width: 140, pinned: "left", cellStyle: { fontWeight: 700 } },
    { headerName: tx("Material"), field: "material_code", width: 150 },
    { headerName: tx("Status"), field: "effective_status", width: 130, cellRenderer: (p) => <LotStatusPill value={p.value} /> },
    { headerName: tx("Group"), colId: "category", width: 130, valueGetter: (p) => label("category", p.data.category) },
    { headerName: tx("Supplier"), field: "supplier", width: 140, valueFormatter: (p) => p.value || EMPTY },
    { headerName: tx("Received"), field: "received_at", width: 110, valueFormatter: (p) => (p.value ? String(p.value).slice(0, 10).split("-").reverse().join("/") : EMPTY) },
    { headerName: tx("Expiry"), field: "expiry_date", width: 110, valueFormatter: (p) => (p.value ? String(p.value).split("-").reverse().join("/") : EMPTY),
      cellStyle: (p) => ({ color: p.data.effective_status === "EXPIRED" ? "#F04438" : p.data.near_expiry ? "#F79009" : undefined, fontWeight: p.data.near_expiry || p.data.effective_status === "EXPIRED" ? 700 : 400 }) },
    { headerName: tx("Location"), field: "location_name", minWidth: 140, flex: 1 },
    { headerName: tx("Quantity"), field: "current_qty", width: 120, type: "numericColumn", valueFormatter: (p) => qty(p.value, p.data.unit) },
    { headerName: tx("Source"), colId: "source", width: 150, valueGetter: (p) => `${label("source", p.data.source)}${p.data.source_wo_no ? ` · ${p.data.source_wo_no}` : ""}` },
  ].map((c) => ({ filter: false, ...c })), [language]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lookups) return <Box sx={{ height: 400, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;

  const statusSeries = STATUS_KEYS.map((k) => summary?.by_status?.[k] || 0);
  const selectSx = { minWidth: 150, flex: "1 1 150px" };
  const quick = [
    [tx("View lot detail"), Inventory2OutlinedIcon, () => selected && setDialog({ type: "detail" }), !selected],
    [tx("View Movement History"), HistoryOutlinedIcon, () => document.getElementById("lot-moves")?.scrollIntoView({ behavior: "smooth" }), false],
    [tx("Record IQC Result"), ScienceOutlinedIcon, () => selected && setDialog({ type: "iqc", lot: selected }), !canEdit || selected?.status !== "WAITING_IQC"],
    [tx("View Lot Origin"), TravelExploreOutlinedIcon, () => selected && setDialog({ type: "detail" }), !selected],
    [tx("Transfer Lot"), SwapHorizOutlinedIcon, () => selected && setDialog({ type: "transfer", lot: selected }), !canEdit || !selected || !["IN_STOCK", "HOLD", "WAITING_IQC"].includes(selected.status)],
    [tx("Hold / Release"), BlockOutlinedIcon, () => selected && onDetailAction("hold", selected), !canEdit || !selected || !["IN_STOCK", "WAITING_IQC", "HOLD"].includes(selected.status)],
    [tx("Export Lot Report"), FileDownloadOutlinedIcon, exportLots, !items.length],
  ];

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box>
        <PageMeta title={`${tx("Material Lot History")} | VCC Plastics`} description={tx("Track the history and origin of every material lot")} />
        <PageBreadcrumb pageTitle={tx("Material Lot History")} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr auto" }, gap: 1.5, alignItems: "center", mb: 1.5 }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>{tx("Material Lot History")}</Typography>
            <Typography variant="body2" color="text.secondary">{tx("Track the history and origin of every material lot")}</Typography>
          </Box>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
            <Typography variant="caption" color="text.secondary">{tx("Last Update")}: {lastUpdate ? lastUpdate.toLocaleString(localeTag()) : EMPTY}</Typography>
            <Button startIcon={<RefreshIcon />} onClick={() => load()} sx={btn("cancel")}>{tx("Refresh")}</Button>
            <Button startIcon={<PlaceOutlinedIcon />} onClick={() => setDialog({ type: "locations" })} sx={btn("cancel")}>{tx("Locations")}</Button>
            <Button startIcon={<RecyclingOutlinedIcon />} disabled={!canEdit} onClick={() => setDialog({ type: "regrind" })} sx={btn("cancel")}>{tx("Create Regrind Lot")}</Button>
            <Button startIcon={<CallReceivedOutlinedIcon />} disabled={!canEdit} onClick={() => setDialog({ type: "receive" })} sx={btn("primary")}>{tx("Receive Material")}</Button>
          </Stack>
        </Box>

        {/* KPI */}
        <KpiCardGroup sx={{ mb: 1.5 }}>
          <KpiTile title={tx("Total Lots")} value={num(summary?.total)} unit={tx("lots")} icon={Inventory2OutlinedIcon} tone="primary" />
          <KpiTile title={tx("In Stock")} value={num(summary?.in_stock)} unit={tx("lots")} icon={WarehouseOutlinedIcon} tone="success" onClick={() => setFilter((f) => ({ ...f, status: "IN_STOCK" }))} />
          <KpiTile title={tx("In Use")} value={num(summary?.in_use)} unit={tx("lots")} icon={HourglassBottomOutlinedIcon} tone="warning" onClick={() => setFilter((f) => ({ ...f, status: "IN_USE" }))} />
          <KpiTile title={tx("In IQC")} value={num(summary?.waiting_iqc)} unit={tx("lots")} icon={ScienceOutlinedIcon} tone="accent" onClick={() => setFilter((f) => ({ ...f, status: "WAITING_IQC" }))} />
          <KpiTile title={tx("On Hold")} value={num(summary?.hold)} unit={tx("lots")} icon={BlockOutlinedIcon} tone="danger" onClick={() => setFilter((f) => ({ ...f, status: "HOLD" }))} />
          <KpiTile title={tx("Expiring (≤{days} days)", { days: warningDays })} value={num(summary?.near_expiry)} unit={tx("lots")} icon={ScheduleOutlinedIcon} tone="info" onClick={() => setFilter((f) => ({ ...f, status: "NEAR_EXPIRY" }))} />
        </KpiCardGroup>

        {/* Filters */}
        <Paper elevation={0} sx={{ ...cardSx, p: 1, mb: 1.5 }}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <FormControl size="small" sx={selectSx}><InputLabel>{tx("Group")}</InputLabel>
              <Select label={tx("Group")} value={filter.category} onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value }))}>
                <MenuItem value="">{tx("All")}</MenuItem>{lookups.categories.map((c) => <MenuItem key={c} value={c}>{label("category", c)}</MenuItem>)}
              </Select></FormControl>
            <FormControl size="small" sx={selectSx}><InputLabel>{tx("Material")}</InputLabel>
              <Select label={tx("Material")} value={filter.material_id} onChange={(e) => setFilter((f) => ({ ...f, material_id: e.target.value }))}>
                <MenuItem value="">{tx("All")}</MenuItem>{lookups.materials.map((m) => <MenuItem key={m.id} value={m.id}>{m.material_code}</MenuItem>)}
              </Select></FormControl>
            <TextField size="small" placeholder={tx("Search lot no. or material...")} value={filter.keyword} onChange={(e) => setFilter((f) => ({ ...f, keyword: e.target.value }))} sx={{ flex: "2 1 220px" }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
            <FormControl size="small" sx={selectSx}><InputLabel>{tx("Supplier")}</InputLabel>
              <Select label={tx("Supplier")} value={filter.supplier} onChange={(e) => setFilter((f) => ({ ...f, supplier: e.target.value }))}>
                <MenuItem value="">{tx("All")}</MenuItem>{lookups.suppliers.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select></FormControl>
            <FormControl size="small" sx={selectSx}><InputLabel>{tx("Status")}</InputLabel>
              <Select label={tx("Status")} value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}>
                <MenuItem value="">{tx("All")}</MenuItem>
                {[...STATUS_KEYS, "NEAR_EXPIRY"].map((s) => <MenuItem key={s} value={s}>{s === "NEAR_EXPIRY" ? tx("Near expiry") : label("lotStatus", s)}</MenuItem>)}
              </Select></FormControl>
            <FormControl size="small" sx={selectSx}><InputLabel>{tx("Location")}</InputLabel>
              <Select label={tx("Location")} value={filter.location_id} onChange={(e) => setFilter((f) => ({ ...f, location_id: e.target.value }))}>
                <MenuItem value="">{tx("All")}</MenuItem>{lookups.locations.map((l) => <MenuItem key={l.id} value={l.id}>{l.location_name}</MenuItem>)}
              </Select></FormControl>
            <Button onClick={() => setFilter(EMPTY_FILTER)} sx={btn("cancel")}>{tx("Clear")}</Button>
          </Stack>
          {loading ? <LinearProgress sx={{ mt: 1 }} /> : null}
        </Paper>

        {/* List | status donut + near expiry */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1.75fr) minmax(0,1fr)" }, gap: 1.5, mb: 1.5 }}>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Material Lot List")} subtitle={`(${items.length})`} />
            <Box sx={{ px: 1, pb: 1 }}>
              <AgGridTable rowData={items} columnDefs={columns} height={420} rowHeight={32}
                getRowId={(p) => String(p.data.id)} onRowClicked={(e) => openLot(e.data.id, false)} />
            </Box>
          </Paper>
          <Stack spacing={1.5}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Lot Status Distribution")} />
              <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.1fr)", alignItems: "center", gap: 1, px: 1.5, pb: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Chart type="donut" height={180} series={statusSeries} options={{
                    chart: { background: "transparent", fontFamily: '"Bai Jamjuree", sans-serif' }, labels: STATUS_KEYS.map((k) => label("lotStatus", k)),
                    colors: STATUS_KEYS.map((k) => LOT_STATUS_COLORS[k]), legend: { show: false }, dataLabels: { enabled: false }, stroke: { width: 2, colors: [dark ? "#111827" : "#fff"] },
                    plotOptions: { pie: { donut: { size: "68%", labels: { show: true, total: { show: true, label: tx("lots"), color: dark ? "#A7B0C0" : "#667085", formatter: () => String(summary?.total || 0) }, value: { fontSize: "20px", fontWeight: 800, color: dark ? "#F3F4F6" : "#172033" } } } } },
                    tooltip: { theme: dark ? "dark" : "light" },
                  }} />
                </Box>
                <Stack spacing={0.8}>
                  {STATUS_KEYS.map((k, i) => (
                    <Stack key={k} direction="row" sx={{ justifyContent: "space-between" }}>
                      <Dot color={LOT_STATUS_COLORS[k]} text={label("lotStatus", k)} />
                      <Typography variant="caption" fontWeight={700}>{statusSeries[i]} ({num(summary?.total ? (statusSeries[i] / summary.total) * 100 : 0, 1)}%)</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Paper>
            <Paper elevation={0} sx={{ ...cardSx, flex: 1 }}>
              <Head title={tx("Lots Expiring (≤{days} days)", { days: warningDays })} />
              <Box sx={{ px: 1, pb: 1, maxHeight: 220, overflow: "auto" }}>
                <Table size="small" sx={{ "& td, & th": { fontSize: 11.5, px: 0.75, whiteSpace: "nowrap" } }}>
                  <TableHead><TableRow><TableCell>{tx("Lot No.")}</TableCell><TableCell>{tx("Material")}</TableCell><TableCell>{tx("Expiry")}</TableCell><TableCell align="right">{tx("Days left")}</TableCell><TableCell align="right">{tx("Quantity")}</TableCell><TableCell>{tx("Location")}</TableCell></TableRow></TableHead>
                  <TableBody>
                    {nearExpiry.length === 0 ? <TableRow><TableCell colSpan={6}>{tx("No data.")}</TableCell></TableRow> : nearExpiry.map((l) => (
                      <TableRow key={l.id} hover sx={{ cursor: "pointer" }} onClick={() => openLot(l.id, true)}>
                        <TableCell>{l.lot_no}</TableCell><TableCell>{l.material_code}</TableCell><TableCell>{String(l.expiry_date).split("-").reverse().join("/")}</TableCell>
                        <TableCell align="right" sx={{ color: l.days_to_expiry <= 15 ? "#F04438" : "#F79009", fontWeight: 800 }}>{l.days_to_expiry}</TableCell>
                        <TableCell align="right">{qty(l.current_qty, l.unit)}</TableCell><TableCell>{l.location_name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
          </Stack>
        </Box>

        {/* Moves | timeline | by location */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr", xl: "1.3fr 1fr 1fr" }, gap: 1.5, mb: 1.5 }}>
          <Paper elevation={0} sx={cardSx} id="lot-moves">
            <Head title={tx("Lot Movement History (latest)")} />
            <Box sx={{ px: 1, pb: 1, maxHeight: 300, overflow: "auto" }}>
              <Table size="small" stickyHeader sx={{ "& td, & th": { fontSize: 11.5, px: 0.75, whiteSpace: "nowrap" } }}>
                <TableHead><TableRow><TableCell>{tx("Time")}</TableCell><TableCell>{tx("Lot No.")}</TableCell><TableCell>{tx("Material")}</TableCell><TableCell>{tx("From")}</TableCell><TableCell>{tx("To")}</TableCell><TableCell>{tx("Transaction")}</TableCell><TableCell>{tx("Operator")}</TableCell></TableRow></TableHead>
                <TableBody>
                  {moves.length === 0 ? <TableRow><TableCell colSpan={7}>{tx("No data.")}</TableCell></TableRow> : moves.map((t) => (
                    <TableRow key={t.id} hover sx={{ cursor: "pointer" }} onClick={() => openLot(t.lot_id, false)}>
                      <TableCell>{ddmmhhmm(t.acted_at)}</TableCell><TableCell>{t.lot_no}</TableCell><TableCell>{t.material_code}</TableCell>
                      <TableCell>{t.from_location || EMPTY}</TableCell><TableCell>{t.to_location || EMPTY}</TableCell>
                      <TableCell>{label("txn", t.txn_type)}</TableCell><TableCell>{t.actor}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Lot Traceability")} subtitle={selected ? `· ${selected.lot_no}` : ""}
              action={selected ? <Button size="small" sx={{ textTransform: "none" }} onClick={() => setDialog({ type: "detail" })}>{tx("View lot detail")}</Button> : null} />
            <Box sx={{ px: 1.5, pb: 1.5, maxHeight: 300, overflow: "auto" }}><LotTimeline lot={selected} dense /></Box>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Stock by Lot Location")} subtitle="(t)" />
            <Box sx={{ px: 1 }}>
              <Chart type="bar" height={Math.max(180, byLocation.length * 34 + 40)} series={[{ name: tx("Qty (t)"), data: byLocation.map(([, v]) => Number((v / 1000).toFixed(3))) }]} options={{
                chart: { toolbar: { show: false }, background: "transparent", fontFamily: '"Bai Jamjuree", sans-serif' },
                plotOptions: { bar: { horizontal: true, barHeight: "55%", borderRadius: 2 } }, colors: ["#1570EF"],
                dataLabels: { enabled: true, formatter: (v) => num(v, 2), style: { fontSize: "11px" } },
                xaxis: { categories: byLocation.map(([k]) => k), labels: { style: { colors: dark ? "#A7B0C0" : "#667085" } } },
                yaxis: { labels: { style: { colors: dark ? "#A7B0C0" : "#667085" }, maxWidth: 140 } }, grid: { borderColor: dark ? "#344054" : "#EAECF0" },
                tooltip: { theme: dark ? "dark" : "light" },
              }} />
            </Box>
          </Paper>
        </Box>

        {/* Quick actions */}
        <Paper elevation={0} sx={cardSx}>
          <Head title={tx("Quick Actions")} />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)", xl: "repeat(7, 1fr)" }, gap: 1, px: 1.5, pb: 1.5 }}>
            {quick.map(([text, Icon, onClick, disabled]) => (
              <Button key={text} disabled={disabled} onClick={onClick} startIcon={<Icon sx={{ color: disabled ? "inherit" : "primary.main" }} />}
                sx={{ justifyContent: "flex-start", border: 1, borderColor: "divider", borderRadius: 1.5, textTransform: "none", color: "text.primary", fontWeight: 700, py: 1.25 }}>
                {text}
              </Button>
            ))}
          </Box>
        </Paper>

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

