import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, FormControlLabel, InputAdornment, LinearProgress, Paper,
  Snackbar, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, ThemeProvider as MuiThemeProvider, Typography,
} from "@mui/material";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import PlaylistAddCheckOutlinedIcon from "@mui/icons-material/PlaylistAddCheckOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import SearchIcon from "@mui/icons-material/Search";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";

import { getCurrentUser } from "../../../auth/auth";
import usePagePermission from "../../../auth/usePagePermission";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { useTheme as useAppTheme } from "../../../context/ThemeContext";
import { DialogHeader, Dot, EMPTY, Head, QuickAction, QuickActions, btn, cardSx, ddmmhhmm, dialogPaperSx, num, pageTheme } from "../../ProductionManagement/ProductionPlanning/ui";
import { label, localeTag, setActiveLanguage, tx } from "../materialLocales";
import { CATEGORY_COLORS, KpiTile, MATERIAL_API, colShares, downloadExcel, qty, tons, useRequest } from "../materialUi";

const AUTO_REFRESH_MS = 60000;
const STATUS_PARTS = [["available", "Available", "#12B76A"], ["reserved", "Reserved", "#F79009"], ["waiting_iqc", "Waiting IQC", "#2E90FA"], ["hold", "Hold", "#F04438"], ["in_use", "In Use", "#7A5AF8"], ["expired", "Expired", "#98A2B3"]];
const FLOW = [["IQC_AREA", "Waiting IQC"], ["WAREHOUSE", "Warehouse"], ["SILO", "Silo / Tank"], ["DRYER", "Dryer"], ["MACHINE", "Machine"]];

function StockDialog({ request, canEdit, actor, notify, onClose, onChanged }) {
  const [rows, setRows] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [edit, setEdit] = useState(null);
  const load = useCallback(() => request(`${MATERIAL_API}/stock`).then(setRows).catch((e) => notify("error", e.message)), [request, notify]);
  useEffect(() => { load(); }, [load]);
  const list = (rows || []).filter((r) => !keyword.trim() || `${r.material_code} ${r.material_name}`.toLowerCase().includes(keyword.trim().toLowerCase()));
  const save = async () => {
    try {
      await request(`${MATERIAL_API}/safety-stock/${edit.id}`, { method: "PUT", body: JSON.stringify({ safety_stock_qty: Number(edit.value || 0), actor }) });
      notify("success", tx("Safety stock updated.")); setEdit(null); await load(); onChanged();
    } catch (e) { notify("error", e.message); }
  };
  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<InventoryOutlinedIcon />} title={tx("Stock by Material")} subtitle={tx("Local inventory mode: stock is kept in MES until a warehouse system (WMS) is connected.")} onClose={onClose} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <TextField size="small" fullWidth placeholder={tx("Search lot no. or material...")} value={keyword} onChange={(e) => setKeyword(e.target.value)} sx={{ mb: 1.5 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
        {!rows ? <LinearProgress /> : (
          <Box sx={{ maxHeight: 520, overflow: "auto" }}>
            <Table size="small" stickyHeader sx={{ "& td, & th": { fontSize: 11, whiteSpace: "nowrap" } }}>
              <TableHead>
                <TableRow>
                  <TableCell>{tx("Material Code")}</TableCell><TableCell>{tx("Material Name")}</TableCell><TableCell>{tx("Group")}</TableCell><TableCell>{tx("Unit")}</TableCell>
                  <TableCell align="right">{tx("Available")}</TableCell><TableCell align="right">{tx("Reserved")}</TableCell><TableCell align="right">{tx("Waiting IQC")}</TableCell>
                  <TableCell align="right">{tx("Hold")}</TableCell><TableCell align="right">{tx("Expired")}</TableCell><TableCell align="right">{tx("Safety Stock")}</TableCell><TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((r) => {
                  const low = r.safety_stock_qty > 0 && r.available < r.safety_stock_qty;
                  return (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{r.material_code}</TableCell><TableCell>{r.material_name}</TableCell><TableCell>{label("category", r.category)}</TableCell><TableCell>{r.unit}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: low ? "#F04438" : "inherit" }}>{num(r.available, 3)}</TableCell>
                      <TableCell align="right">{num(r.reserved, 3)}</TableCell><TableCell align="right">{num(r.waiting_iqc, 3)}</TableCell>
                      <TableCell align="right">{num(r.hold, 3)}</TableCell><TableCell align="right">{num(r.expired, 3)}</TableCell>
                      <TableCell align="right">
                        {edit?.id === r.id ? <TextField size="small" type="number" value={edit.value} onChange={(e) => setEdit({ ...edit, value: e.target.value })} sx={{ width: 110 }} inputProps={{ min: 0, step: "any" }} /> : num(r.safety_stock_qty, 3)}
                      </TableCell>
                      <TableCell align="right">
                        {edit?.id === r.id ? (
                          <><Button size="small" onClick={() => setEdit(null)}>{tx("Cancel")}</Button><Button size="small" variant="contained" onClick={save}>{tx("Save")}</Button></>
                        ) : <Button size="small" disabled={!canEdit} onClick={() => setEdit({ id: r.id, value: r.safety_stock_qty })}>{tx("Safety Stock")}</Button>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function MaterialStatus() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  const { theme } = useAppTheme();
  const dark = theme === "dark";
  const muiTheme = useMemo(() => pageTheme(theme), [theme]);
  const navigate = useNavigate();
  const { canEdit } = usePagePermission();
  const actor = getCurrentUser()?.employee_code || "SYSTEM";
  const request = useRequest();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [msg, setMsg] = useState({ open: false, type: "success", text: "" });
  const notify = useCallback((type, text) => setMsg({ open: true, type, text }), []);

  const load = useCallback(async ({ silent } = {}) => {
    if (!silent) setLoading(true);
    try { setData(await request(`${MATERIAL_API}/status-summary`)); setLastUpdate(new Date()); }
    catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [request, notify]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!autoRefresh) return undefined;
    const t = setInterval(() => { if (!dialog) load({ silent: true }); }, AUTO_REFRESH_MS);
    return () => clearInterval(t);
  }, [autoRefresh, load, dialog]);

  const flow = useMemo(() => FLOW.map(([type, name]) => {
    const locs = (data?.by_location || []).filter((l) => l.location_type === type);
    return { type, name, qty: locs.reduce((a, l) => a + l.qty, 0), lots: locs.reduce((a, l) => a + l.lots, 0) };
  }), [data]);

  if (!data) return <Box sx={{ height: 400, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  const k = data.kpis;
  const statusTotal = STATUS_PARTS.reduce((a, [key]) => a + (data.by_status[key] || 0), 0);
  const categories = Object.entries(data.by_category).filter(([, v]) => v > 0);
  const toLots = (status) => navigate(`/material-management/lot-history${status ? `?status=${status}` : ""}`);
  const alerts = [
    [tx("Below safety stock"), data.alerts.low_stock, ReportProblemOutlinedIcon, "#F04438", () => setDialog("stock")],
    [tx("Short for the plan"), data.alerts.shortage, TrendingDownOutlinedIcon, "#F04438", () => navigate("/material-management/requirement")],
    [tx("Near expiry"), data.alerts.near_expiry, EventNoteOutlinedIcon, "#F79009", () => toLots()],
    [tx("Expired material"), data.alerts.expired, EventBusyOutlinedIcon, "#F04438", () => toLots()],
    [tx("On hold"), data.alerts.hold, BlockOutlinedIcon, "#F04438", () => toLots()],
    [tx("Waiting for IQC"), data.alerts.waiting_iqc, ScienceOutlinedIcon, "#F79009", () => toLots()],
  ];
  const exportReport = () => downloadExcel(`material-status-${new Date().toISOString().slice(0, 10)}.csv`,
    ["Section", "Code", "Name", "Value", "Unit", "Detail"],
    [
      ...STATUS_PARTS.map(([key, name]) => ["Stock by status", key, name, data.by_status[key], "KG", ""]),
      ...data.by_location.map((l) => ["Stock by location", l.location_type, l.location_name, l.qty, "KG", `${l.lots} lots`]),
      ...data.low_stock.map((r) => ["Low stock", r.material_code, r.material_name, r.available, r.unit, `safety ${r.safety_stock_qty}`]),
      ...data.shortages.map((r) => ["Shortage", r.material_code, r.material_name, r.shortage_qty, r.unit, `from ${r.expected_date} · ${r.work_orders.join(" ")}`]),
      ...data.near_expiry_lots.map((l) => ["Near expiry", l.lot_no, l.material_code, l.current_qty, l.unit, `${l.expiry_date} (${l.days_to_expiry} d)`]),
    ]);
  const quick = [
    [tx("Check Inventory"), PlaylistAddCheckOutlinedIcon, "#1570EF", () => setDialog("stock")],
    [tx("Create Material Request"), AssignmentOutlinedIcon, "#F79009", () => navigate("/material-management/requirement")],
    [tx("Allocate Material"), Inventory2OutlinedIcon, "#12B76A", () => navigate("/material-management/allocation")],
    [tx("Lot History"), HistoryOutlinedIcon, "#7A5AF8", () => toLots()],
  ];
  const tableSx = { "& td, & th": { fontSize: 11, px: 0.75, whiteSpace: "nowrap" }, "& th": { color: "text.secondary", fontWeight: 800 } };
  const viewAll = (onClick) => <Button size="small" endIcon={<ChevronRightIcon fontSize="small" />} onClick={onClick} sx={{ textTransform: "none", minWidth: 0, py: 0 }}>{tx("View all")}</Button>;
  const toolBtnSx = { ...btn("cancel"), bgcolor: "background.paper", border: 1, borderColor: "divider" };
  const fill = { flex: 1, minHeight: 0 };
  const panel = { ...cardSx, display: "flex", flexDirection: "column", minHeight: { xs: 220, xl: 0 } };
  const tableBody = { ...fill, px: 1, pb: 1, overflow: "auto" };
  const maxLocation = Math.max(...data.by_location.map((l) => l.qty), 1);

  return (
    <MuiThemeProvider theme={muiTheme}>
      {/* One screen on lg+: toolbar · KPI · flow · 4-column grid (status | location ×2 | alerts / three lists | quick actions bottom-right) */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, height: { lg: "calc(var(--app-vh, 100vh) - 74px)" }, minHeight: 0, "& > *": { flexShrink: 0 } }}>
        <PageMeta title={`${tx("Material Status")} | VCC Plastics`} description={tx("Plant-wide overview of material stock and status")} />
        <PageBreadcrumb pageTitle={tx("Material Status")} />

        <Paper elevation={0} sx={{ ...cardSx, p: 0.75 }}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Button startIcon={<RefreshIcon />} onClick={() => load()} sx={toolBtnSx}>{tx("Refresh")}</Button>
            <Button startIcon={<FileDownloadOutlinedIcon />} onClick={exportReport} sx={toolBtnSx}>{tx("Export")}</Button>
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">{tx("Last Update")}: {lastUpdate ? lastUpdate.toLocaleString(localeTag()) : EMPTY}</Typography>
            <FormControlLabel sx={{ mr: 0 }} control={<Switch size="small" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />} label={<Typography variant="caption" fontWeight={700}>{tx("Auto Refresh")}</Typography>} />
          </Stack>
          {loading ? <LinearProgress sx={{ mt: 0.5, height: 2 }} /> : null}
        </Paper>

        {/* KPI */}
        <KpiCardGroup>
          <KpiTile title={tx("Total Materials")} value={num(k.material_types)} unit={tx("types")} sub={tx("View list")} icon={Inventory2OutlinedIcon} tone="primary" onClick={() => setDialog("stock")} />
          <KpiTile title={tx("Available Stock")} value={tons(k.available)} unit={tx("tons")} sub={tx("View details")} icon={WarehouseOutlinedIcon} tone="success" onClick={() => setDialog("stock")} />
          <KpiTile title={tx("Reserved")} value={tons(k.reserved)} unit={tx("tons")} sub={tx("View details")} icon={EventNoteOutlinedIcon} tone="warning" onClick={() => navigate("/material-management/allocation")} />
          <KpiTile title={tx("Low Stock")} value={num(k.low_stock)} unit={tx("types")} sub={tx("View list")} icon={InventoryOutlinedIcon} tone="accent" onClick={() => setDialog("stock")} />
          <KpiTile title={tx("Materials Short")} value={num(k.shortage)} unit={tx("types")} sub={tx("View list")} icon={ReportProblemOutlinedIcon} tone="danger" onClick={() => navigate("/material-management/requirement")} />
          <KpiTile title={tx("Lots Near Expiry")} value={num(k.near_expiry_lots)} unit={tx("lots")} sub={tx("View list")} icon={ScheduleOutlinedIcon} tone="info" onClick={() => toLots()} />
        </KpiCardGroup>

        {/* Flow + distribution */}
        <Paper elevation={0} sx={cardSx}>
          <Head title={tx("Material Flow")} subtitle={`· ${tx("Weight totals include materials stocked in KG only.")}`} />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1.6fr) minmax(0,1fr)" }, gap: 2, alignItems: "center", px: 1.5, pb: 1.25 }}>
            <Stack direction="row" sx={{ gap: 0.75, alignItems: "stretch", flexWrap: "wrap" }}>
              {flow.map((step, i) => (
                <Stack key={step.type} direction="row" sx={{ alignItems: "center", gap: 0.75, flex: "1 1 120px" }}>
                  <Box sx={{ flex: 1, border: 1, borderColor: step.lots ? "primary.main" : "divider", borderRadius: 1.5, py: 0.6, px: 1, textAlign: "center", bgcolor: step.lots ? "action.hover" : "transparent" }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: "block" }}>{label("locationType", step.type)}</Typography>
                    <Typography fontWeight={800} sx={{ fontSize: 15, lineHeight: 1.4 }}>{tons(step.qty)} t</Typography>
                    <Typography variant="caption" color="text.secondary">{step.lots} {tx("lots")}</Typography>
                  </Box>
                  {i < flow.length - 1 ? <ChevronRightIcon color="disabled" /> : null}
                </Stack>
              ))}
            </Stack>
            <Box>
              <Typography variant="caption" fontWeight={800} color="text.secondary">{tx("Material Distribution")}</Typography>
              <Box sx={{ display: "flex", height: 12, borderRadius: 1, overflow: "hidden", my: 0.75, bgcolor: "action.hover" }}>
                {categories.map(([c, v]) => <Box key={c} title={`${label("category", c)}: ${tons(v)} t`} sx={{ width: `${(v / Math.max(categories.reduce((a, [, x]) => a + x, 0), 1)) * 100}%`, bgcolor: CATEGORY_COLORS[c] }} />)}
              </Box>
              <Stack direction="row" sx={{ gap: 1.5, flexWrap: "wrap" }}>
                {categories.map(([c, v]) => <Dot key={c} color={CATEGORY_COLORS[c]} text={`${label("category", c)} ${tons(v)} t`} />)}
              </Stack>
            </Box>
          </Box>
        </Paper>

        {/* One 3-column grid so every card edge lines up: overview row (status | location | alerts) and list row
            (low stock | shortage | expiring lots + quick actions in the bottom-right corner) */}
        <Box sx={{ flex: { lg: "1 1 0" }, minHeight: 0, display: "grid", gap: 1,
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr", xl: "repeat(3, minmax(0,1fr))" }, gridTemplateRows: { xl: "minmax(0,1fr) minmax(0,1fr)" } }}>
          <Paper elevation={0} sx={panel}>
            <Head title={tx("Stock by Status")} />
            <Box sx={{ ...fill, display: "grid", gridTemplateColumns: "128px minmax(0,1fr)", alignItems: "center", gap: 1, pl: 0.5, pr: 1.5 }}>
              <Chart type="donut" height={136} series={STATUS_PARTS.map(([key]) => Number(((data.by_status[key] || 0) / 1000).toFixed(3)))} options={{
                chart: { background: "transparent", fontFamily: '"Bai Jamjuree", sans-serif' }, labels: STATUS_PARTS.map(([, n]) => tx(n)), colors: STATUS_PARTS.map(([, , c]) => c),
                legend: { show: false }, dataLabels: { enabled: false }, stroke: { width: 2, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v) => `${num(v, 2)} t` } },
                plotOptions: { pie: { donut: { size: "76%", labels: { show: true, total: { show: true, label: tx("tons"), fontSize: "10px", color: dark ? "#A7B0C0" : "#667085", formatter: () => tons(statusTotal) }, name: { fontSize: "10px", offsetY: -2 }, value: { fontSize: "18px", fontWeight: 800, offsetY: 2, color: dark ? "#F3F4F6" : "#172033" } } } } },
              }} />
              <Stack spacing={0.7} sx={{ minWidth: 0 }}>
                {STATUS_PARTS.map(([key, name, color]) => (
                  <Box key={key} sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", columnGap: 1, alignItems: "center" }}>
                    <Box sx={{ minWidth: 0, overflow: "hidden", "& .MuiTypography-root": { fontSize: 11, whiteSpace: "nowrap" } }}><Dot color={color} text={tx(name)} /></Box>
                    <Typography variant="caption" sx={{ fontSize: 11, whiteSpace: "nowrap" }}><b>{tons(data.by_status[key])}</b> <Box component="span" sx={{ color: "text.secondary" }}>· {num(statusTotal ? ((data.by_status[key] || 0) / statusTotal) * 100 : 0, 0)}%</Box></Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Paper>
          <Paper elevation={0} sx={panel}>
            <Head title={tx("Stock by Location")} subtitle="(t)" />
            {data.by_location.length === 0 ? <Box sx={{ ...fill, display: "grid", placeItems: "center" }}><Typography variant="caption" color="text.disabled">{tx("No data.")}</Typography></Box> : (
              <Stack sx={{ ...fill, px: 1.5, pb: 1, overflow: "auto", justifyContent: data.by_location.length < 5 ? "center" : "flex-start", gap: 1.25 }}>
                {data.by_location.map((l) => (
                  <Box key={`${l.location_type}-${l.location_name}`}>
                    <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "baseline", mb: 0.4 }}>
                      <Typography variant="caption" fontWeight={700} noWrap title={l.location_name} sx={{ fontSize: 11.5, minWidth: 0 }}>{l.location_name}
                        <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}> · {label("locationType", l.location_type)}</Box></Typography>
                      <Typography variant="caption" sx={{ whiteSpace: "nowrap", fontSize: 11.5 }}><b>{tons(l.qty)} t</b> <Box component="span" sx={{ color: "text.secondary" }}>· {l.lots} {tx("lots")}</Box></Typography>
                    </Stack>
                    <Box sx={{ height: 8, borderRadius: 4, bgcolor: "action.hover", overflow: "hidden" }}>
                      <Box sx={{ width: `${(l.qty / maxLocation) * 100}%`, height: "100%", borderRadius: 4, bgcolor: "#1570EF" }} />
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
          <Paper elevation={0} sx={panel}>
            <Head title={tx("Material Alerts")} />
            <Stack sx={{ ...fill, px: 1.5, pb: 0.75, overflow: "auto", justifyContent: "space-evenly" }}>
              {alerts.map(([text, count, Icon, color, onClick]) => (
                <Stack key={text} direction="row" onClick={onClick} sx={{ alignItems: "center", gap: 1.25, py: 0.6, borderBottom: 1, borderColor: "divider", cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}>
                  <Icon sx={{ color, fontSize: 16 }} />
                  <Typography variant="caption" sx={{ flex: 1, fontSize: 11.5 }}>{text}</Typography>
                  <Typography variant="caption" fontWeight={800} sx={{ fontSize: 12, color: count ? color : "text.disabled" }}>{count}</Typography>
                  <ChevronRightIcon fontSize="small" color="disabled" />
                </Stack>
              ))}
            </Stack>
          </Paper>

          <Paper elevation={0} sx={panel}>
            <Head title={tx("Top 5 Lowest Available Stock")} action={viewAll(() => setDialog("stock"))} />
            <Box sx={tableBody}>
              <Table size="small" stickyHeader sx={{ ...tableSx, ...colShares(18, 29, 18, 18, 17) }}>
                <TableHead><TableRow><TableCell>{tx("Material Code")}</TableCell><TableCell>{tx("Material Name")}</TableCell><TableCell align="right">{tx("Available")}</TableCell><TableCell align="right">{tx("Safety Stock")}</TableCell><TableCell>{tx("Status")}</TableCell></TableRow></TableHead>
                <TableBody>
                  {data.low_stock.length === 0 ? <TableRow><TableCell colSpan={5}>{tx("No data.")}</TableCell></TableRow> : data.low_stock.slice(0, 5).map((r) => (
                    <TableRow key={r.material_id}>
                      <TableCell sx={{ fontWeight: 700 }}>{r.material_code}</TableCell><TableCell title={r.material_name}>{r.material_name}</TableCell>
                      <TableCell align="right">{qty(r.available, r.unit)}</TableCell><TableCell align="right">{qty(r.safety_stock_qty, r.unit)}</TableCell>
                      <TableCell><Box component="span" sx={{ display: "inline-block", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", verticalAlign: "middle", width: 76, px: 0.5, py: 0.2, borderRadius: 1, fontSize: 10, fontWeight: 700, color: "#F79009", bgcolor: "#F790091A" }}>{tx("Low")}</Box></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
          <Paper elevation={0} sx={panel}>
            <Head title={tx("Material Shortage (from production plan)")} action={viewAll(() => navigate("/material-management/requirement"))} />
            <Box sx={tableBody}>
              <Table size="small" stickyHeader sx={{ ...tableSx, ...colShares(20, 32, 20, 28) }}>
                <TableHead><TableRow><TableCell>{tx("Material Code")}</TableCell><TableCell>{tx("Material Name")}</TableCell><TableCell align="right">{tx("Shortage")}</TableCell><TableCell>{tx("Expected date")}</TableCell></TableRow></TableHead>
                <TableBody>
                  {data.shortages.length === 0 ? <TableRow><TableCell colSpan={4}>{tx("No data.")}</TableCell></TableRow> : data.shortages.slice(0, 5).map((r) => (
                    <TableRow key={r.material_id} title={r.work_orders.join(", ")}>
                      <TableCell sx={{ fontWeight: 700 }}>{r.material_code}</TableCell><TableCell title={r.material_name}>{r.material_name}</TableCell>
                      <TableCell align="right" sx={{ color: "#F04438", fontWeight: 800 }}>{qty(r.shortage_qty, r.unit)}</TableCell><TableCell>{ddmmhhmm(r.expected_date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data.risky_work_orders.length ? (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, px: 0.5 }}>
                  {tx("Work orders at risk")}: {data.risky_work_orders.slice(0, 6).map((w) => w.wo_no).join(", ")}{data.risky_work_orders.length > 6 ? "…" : ""}
                </Typography>
              ) : null}
            </Box>
          </Paper>
          <Stack spacing={1} sx={{ minHeight: 0 }}>
          <Paper elevation={0} sx={{ ...panel, flex: 1 }}>
            <Head title={tx("Lots Expiring (within 90 days)")} action={viewAll(() => toLots())} />
            <Box sx={tableBody}>
              <Table size="small" stickyHeader sx={{ ...tableSx, ...colShares(24, 18, 20, 20, 18) }}>
                <TableHead><TableRow><TableCell>{tx("Lot No.")}</TableCell><TableCell>{tx("Material Code")}</TableCell><TableCell>{tx("Received")}</TableCell><TableCell>{tx("Expiry")}</TableCell><TableCell align="right">{tx("Days left")}</TableCell></TableRow></TableHead>
                <TableBody>
                  {data.near_expiry_lots.length === 0 ? <TableRow><TableCell colSpan={5}>{tx("No data.")}</TableCell></TableRow> : data.near_expiry_lots.slice(0, 5).map((l) => (
                    <TableRow key={l.id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/material-management/lot-history?lot=${encodeURIComponent(l.lot_no)}`)}>
                      <TableCell sx={{ fontWeight: 700 }}>{l.lot_no}</TableCell><TableCell>{l.material_code}</TableCell>
                      <TableCell>{String(l.received_at).slice(0, 10).split("-").reverse().join("/")}</TableCell><TableCell>{String(l.expiry_date).split("-").reverse().join("/")}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: l.days_to_expiry <= 30 ? "#F04438" : "#F79009" }}>{l.days_to_expiry}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
          <Paper elevation={0} sx={{ ...cardSx, flexShrink: 0 }}>
            <Head title={tx("Quick Actions")} />
            <QuickActions columns={4} sx={{ pb: 1.25 }}>
              {quick.map(([text, Icon, color, onClick]) => <QuickAction key={text} icon={Icon} text={text} color={color} onClick={onClick} />)}
            </QuickActions>
          </Paper>
          </Stack>
        </Box>

        {dialog === "stock" && <StockDialog request={request} canEdit={canEdit} actor={actor} notify={notify} onClose={() => setDialog(null)} onChanged={() => load({ silent: true })} />}
        <Snackbar open={msg.open} autoHideDuration={4500} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}
