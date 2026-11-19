import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, FormControl, FormControlLabel, InputLabel, LinearProgress, MenuItem, Paper,
  Select, Snackbar, Stack, Switch, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, ThemeProvider as MuiThemeProvider, ToggleButton, ToggleButtonGroup, Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import CachedOutlinedIcon from "@mui/icons-material/CachedOutlined";
import CircleIcon from "@mui/icons-material/Circle";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutlineOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import AdsClickOutlinedIcon from "@mui/icons-material/AdsClickOutlined";

import { getCurrentUser } from "../../../auth/auth";
import usePagePermission from "../../../auth/usePagePermission";
import { resolveImageUrl } from "../../../components/common/ImageUploadField";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { API_CONFIG } from "../../../config/config";
import { useTheme as useAppTheme } from "../../../context/ThemeContext";
import { KpiTile, colShares, downloadExcel, useRequest } from "../../MaterialManagement/materialUi";
import { EmptyBody, QuickCard, cellsSx, chartBase, fillSx, fitGridSx, fitPageSx, panelSx, toolBtnSx, who } from "../../shared/onePage";
import { DialogHeader, Dot, EMPTY, Head, btn, cardSx, ddmmhhmm, dialogPaperSx, hhmm, num, pageTheme } from "../../ProductionManagement/ProductionPlanning/ui";
import { SystemStatusBar } from "../../ProductionManagement/WorkOrders/WorkOrderManagement/WoParts";
import { label, localeTag, setActiveLanguage, tx } from "../machineLocales";
import { ALARM_STATUS_COLORS, AlarmDialog, DowntimeDialog, MACHINE_COLORS, MachineStatusPill, Pill, PriorityPill, minText } from "../machineUi";

const BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const API = `${BASE}/api/machine-monitoring`;
const DT_API = `${BASE}/api/downtime`;
const AL_API = `${BASE}/api/alarms`;
const EX_API = `${BASE}/api/production-execution`;
const STATUSES = ["RUNNING", "IDLE", "DOWN", "MAINTENANCE", "OFFLINE"];
const COMP_COLORS = { OK: "#12B76A", WARNING: "#F79009", ERROR: "#F04438", FAULT: "#F04438" };
const BREAK_COLORS = ["#F04438", "#F79009", "#12B76A", "#7A5AF8", "#2E90FA", "#98A2B3"];
const EVENT_COLORS = { STATUS: "#2E90FA", ALARM: "#F04438", DOWNTIME: "#F79009", PRODUCTION: "#12B76A" };

const T = {
  vi: { "Back to List": "Về danh sách", "Live Data": "Dữ liệu trực tiếp", "Status since": "Trạng thái từ", "Machine Group": "Nhóm máy", "Installation Date": "Ngày lắp đặt",
    "Manufacturer": "Nhà sản xuất", "Serial No.": "Số serial", "Model": "Model", "Availability": "Availability", "Performance": "Performance", "Quality": "Quality",
    "Cycle Time (sec)": "Cycle time (giây)", "Shot Count": "Số shot khuôn", "Current Production": "Sản xuất hiện tại", "Production Order": "Lệnh sản xuất", "Product": "Sản phẩm",
    "Mold": "Khuôn", "Material": "Vật tư", "Planned Qty": "SL kế hoạch", "Good Qty": "SL đạt", "Reject Qty": "SL lỗi", "Remaining Qty": "SL còn lại", "Due Time": "Hạn hoàn thành",
    "Progress": "Tiến độ", "No work order running on this machine.": "Máy không có WO đang chạy.", "Machine Status": "Trạng thái máy", "Real-time Status": "Trạng thái thời gian thực",
    "Parameters": "Thông số", "History": "Lịch sử", "Downtime": "Dừng máy", "Status Summary (today)": "Phân bổ trạng thái (hôm nay)", "Maintenance Due": "Bảo trì đến hạn",
    "Parameter Monitoring": "Giám sát thông số", "Parameter": "Thông số", "Set Value": "Giá trị chuẩn", "Actual Value": "Giá trị thực", "Unit": "Đơn vị", "Range": "Ngưỡng",
    "Cycle Time Breakdown (sec)": "Phân rã cycle time (giây)", "Trends": "Xu hướng", "Machine Event Log": "Nhật ký sự kiện máy", "Event Type": "Loại sự kiện", "Description": "Mô tả",
    "User/System": "Người / hệ thống", "Hold Production": "Tạm dừng sản xuất", "Change Product": "Đổi sản phẩm", "View Machine List": "Danh sách máy", "View Mold Detail": "Chi tiết khuôn",
    "View Work Order": "Xem Work Order", "Open downtime": "Đang dừng máy", "No data yet (waiting for PLC / IoT data).": "Chưa có dữ liệu (chờ dữ liệu PLC / IoT).",
    "Hold reason": "Lý do tạm dừng", "vs yesterday": "so với hôm qua", "Standard": "Tiêu chuẩn", "Good": "Đạt", "Last 2 hours": "2 giờ gần nhất", "Last 8 hours": "8 giờ gần nhất",
    "Source": "Nguồn", "Select machine": "Chọn máy", "STATUS": "Trạng thái", "ALARM": "Cảnh báo", "DOWNTIME": "Dừng máy", "PRODUCTION": "Sản xuất", "OTHER": "Khác",
    "INJECTION_TIME": "Phun", "HOLDING_TIME": "Giữ áp", "COOLING_TIME": "Làm nguội", "MOLD_OPEN_TIME": "Mở khuôn", "EJECT_TIME": "Đẩy sản phẩm" },
  ja: { "Back to List": "一覧へ戻る", "Live Data": "ライブデータ", "Status since": "状態開始", "Machine Group": "機械グループ", "Installation Date": "設置日", "Manufacturer": "メーカー",
    "Serial No.": "シリアル", "Model": "モデル", "Availability": "時間稼働率", "Performance": "性能稼働率", "Quality": "良品率", "Cycle Time (sec)": "サイクル（秒）", "Shot Count": "ショット数",
    "Current Production": "現在の生産", "Production Order": "製造指示", "Product": "製品", "Mold": "金型", "Material": "材料", "Planned Qty": "計画数", "Good Qty": "良品数", "Reject Qty": "不良数",
    "Remaining Qty": "残数", "Due Time": "納期", "Progress": "進捗", "No work order running on this machine.": "この機械で稼働中の作業指示はありません。", "Machine Status": "機械状態",
    "Real-time Status": "リアルタイム", "Parameters": "パラメータ", "History": "履歴", "Downtime": "停止", "Status Summary (today)": "状態内訳（本日）", "Maintenance Due": "保全予定",
    "Parameter Monitoring": "パラメータ監視", "Parameter": "パラメータ", "Set Value": "設定値", "Actual Value": "実測値", "Unit": "単位", "Range": "範囲", "Cycle Time Breakdown (sec)": "サイクル内訳（秒）",
    "Trends": "推移", "Machine Event Log": "機械イベントログ", "Event Type": "種別", "Description": "内容", "User/System": "担当 / システム", "Hold Production": "生産保留", "Change Product": "製品変更",
    "View Machine List": "機械一覧", "View Mold Detail": "金型詳細", "View Work Order": "作業指示", "Open downtime": "停止中", "No data yet (waiting for PLC / IoT data).": "データなし（PLC / IoT 待ち）。",
    "Hold reason": "保留理由", "vs yesterday": "前日比", "Standard": "標準", "Good": "良品", "Last 2 hours": "直近2時間", "Last 8 hours": "直近8時間", "Source": "ソース", "Select machine": "機械を選択",
    "STATUS": "状態", "ALARM": "アラーム", "DOWNTIME": "停止", "PRODUCTION": "生産", "OTHER": "その他", "INJECTION_TIME": "射出", "HOLDING_TIME": "保圧", "COOLING_TIME": "冷却",
    "MOLD_OPEN_TIME": "型開", "EJECT_TIME": "突出" },
};
const tt = (k, lang) => T[String(lang).split("-")[0]]?.[k] || tx(k);

export function HoldDialog({ wo, lang, saving, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<PauseCircleOutlineIcon />} title={tt("Hold Production", lang)} subtitle={wo.wo_no} onClose={onClose} disabled={saving} tone="danger" />
      <DialogContent sx={{ pt: "16px !important" }}><TextField fullWidth size="small" required multiline minRows={2} label={tt("Hold reason", lang)} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus /></DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => onSubmit(reason.trim())} disabled={saving || !reason.trim()} sx={btn("delete")}>{tx("Confirm")}</Button></DialogActions>
    </Dialog>
  );
}

export default function MachineDetail() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  const L = (k) => tt(k, language);
  const { theme } = useAppTheme();
  const dark = theme === "dark";
  const muiTheme = useMemo(() => pageTheme(theme), [theme]);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { canEdit } = usePagePermission();
  const actor = getCurrentUser()?.employee_code || "SYSTEM";
  const request = useRequest();

  const [machines, setMachines] = useState(null);
  const [machineId, setMachineId] = useState(Number(params.get("machine")) || null);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState(0);
  const [trendKey, setTrendKey] = useState("OEE");
  const [trend, setTrend] = useState([]);
  const [live, setLive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dtLookups, setDtLookups] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sumView, setSumView] = useState("status");
  const [sideView, setSideView] = useState("alarm");
  const [msg, setMsg] = useState({ open: false, type: "success", text: "" });
  const notify = useCallback((type, text) => setMsg({ open: true, type, text }), []);

  useEffect(() => {
    request(`${API}/machines`).then((list) => { setMachines(list); setMachineId((id) => id || list[0]?.id || null); }).catch((e) => notify("error", e.message));
    request(`${DT_API}/lookups`).then(setDtLookups).catch(() => {});
  }, [request, notify]);
  const load = useCallback(async ({ silent } = {}) => {
    if (!machineId) return;
    if (!silent) setLoading(true);
    try { setData(await request(`${API}/machines/${machineId}`)); setLastUpdate(new Date()); }
    catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [machineId, request, notify]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!live) return undefined;
    const t = setInterval(() => { if (!dialog) load({ silent: true }); }, 10000);
    return () => clearInterval(t);
  }, [live, load, dialog]);
  useEffect(() => {
    if (!machineId || trendKey === "OEE") return;
    request(`${API}/machines/${machineId}/trend?parameter=${trendKey}&hours=2`).then(setTrend).catch(() => setTrend([]));
  }, [machineId, trendKey, data, request]);
  const pick = (id) => { setMachineId(id); setParams({ machine: String(id) }); setTab(0); setTrendKey("OEE"); };

  if (!machines || !data) return <Box sx={{ height: 400, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  const m = data.machine;
  const k = data.kpi;
  const y = data.kpi_yesterday;
  const cur = data.current;
  const axisColor = dark ? "#A7B0C0" : "#667085";
  const vs = (a, b, u = "%") => (a != null && b != null ? `${a >= b ? "↑" : "↓"} ${num(Math.abs(a - b), 1)}${u} ${L("vs yesterday")}` : "");
  const secs = k.status_seconds || {};
  const secTotal = Object.values(secs).reduce((a, b) => a + b, 0);
  const statusKeys = STATUSES.filter((s) => secs[s]);
  const tableSx = { "& .MuiTableCell-root": { fontSize: 11, px: 0.75, py: 0.5, whiteSpace: "nowrap" }, "& th": { color: "text.secondary", fontWeight: 800, bgcolor: "background.paper" } };
  const paramOptions = data.parameters.filter((p) => p.value != null);
  const holdWo = async (reason) => {
    setSaving(true);
    try { await request(`${EX_API}/${cur.id}/hold`, { method: "POST", body: JSON.stringify({ reason, actor, version: cur.version }) }); setDialog(null); notify("success", tx("Work order on hold.")); load({ silent: true }); }
    catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const exportCsv = () => downloadExcel(`machine-${m.equipment_code}-parameters.csv`, ["Parameter", "Value", "Unit", "Target", "Min", "Max", "State", "Read at", "Source"],
    data.parameters.map((p) => [p.name, p.value, p.unit, p.target, p.min, p.max, p.state, p.read_at, p.source]));
  const comps = data.components;
  const compTile = (c) => {
    const color = COMP_COLORS[c.status] || "#98A2B3";
    return (
      <Box key={c.component_code} sx={{ border: 1, borderColor: color, borderRadius: 1.5, px: 1, py: 0.5, textAlign: "center", bgcolor: `${color}0F`, minWidth: 0 }}>
        <Typography variant="caption" fontWeight={700} sx={{ display: "block" }} noWrap>{label("component", c.component_code)}</Typography>
        <Typography variant="caption" fontWeight={800} sx={{ color }}>{c.status || EMPTY}</Typography>
      </Box>
    );
  };
  // the machine list is one click away (Back to List); parameters / alarms / events each live in one card only
  const quick = [
    [tx("Report Downtime"), ReportProblemOutlinedIcon, "#F04438", () => setDialog({ type: "downtime" }), !canEdit || Boolean(data.open_downtime)],
    [tx("Request Maintenance"), BuildOutlinedIcon, "#1570EF", () => navigate(`/maintenance-management/requests?create=1&asset_type=MACHINE&asset_id=${m.id}`)],
    [L("Hold Production"), PauseCircleOutlineIcon, "#F79009", () => setDialog({ type: "hold" }), !canEdit || cur?.status !== "IN_PRODUCTION"],
    [L("View Work Order"), AssignmentOutlinedIcon, "#12B76A", () => navigate(`/production-management/work-orders/execution?wo=${cur?.id}`), !cur],
    [L("View Mold Detail"), GridViewOutlinedIcon, "#7A5AF8", () => navigate(`/mold-management/detail?mold=${cur?.mold_id}`), !cur?.mold_id],
    [tx("Downtime Management"), CachedOutlinedIcon, "#0E9384", () => navigate(`/machine-equipment/downtime-management?machine=${m.id}`)],
  ];
  const base = chartBase(dark, axisColor);
  const toggleSx = { px: 1, py: 0.1, textTransform: "none", fontWeight: 700, fontSize: 10.5 };
  const infoFields = [[tx("Area"), m.area_name], [L("Machine Group"), m.group_name], [L("Model"), [m.manufacturer, m.model].filter(Boolean).join(" ")], [L("Serial No."), m.serial_number],
    [L("Installation Date"), m.installation_date ? String(m.installation_date).slice(0, 10) : null], [L("Status since"), ddmmhhmm(m.status_since)],
    ...m.specs.map((s) => [s.name, s.value != null ? `${num(s.value, 1)} ${s.unit || ""}` : null])];
  const eventText = (e) => (e.kind === "STATUS" ? `${e.detail ? `${label("machineStatus", e.detail)} → ` : ""}${label("machineStatus", e.title)}` : e.kind === "ALARM" ? `${label("priority", e.title)} · ${e.detail}` : `${e.title}${e.detail ? ` · ${e.detail}` : ""}`);
  const eventActor = (a) => (label("source", a) !== a ? label("source", a) : who(a));

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box sx={fitPageSx}>
        <PageMeta title={`${m.equipment_code} · ${tx("Machine Detail")} | VCC Plastics`} description={m.equipment_name} />
        <PageBreadcrumb pageTitle={tx("Machine Detail")} />
        <Paper elevation={0} sx={{ ...cardSx, p: 0.75, position: "relative", overflow: "hidden" }}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/machine-equipment/machine-monitoring")} sx={toolBtnSx}>{L("Back to List")}</Button>
            <FormControl size="small" sx={{ width: 260 }}><InputLabel>{L("Select machine")}</InputLabel>
              <Select label={L("Select machine")} value={machineId || ""} onChange={(e) => pick(e.target.value)}>
                {machines.map((x) => <MenuItem key={x.id} value={x.id}><CircleIcon sx={{ fontSize: 10, mr: 1, color: MACHINE_COLORS[x.operational_status] || "#98A2B3" }} />{x.equipment_code} — {x.equipment_name}</MenuItem>)}
              </Select></FormControl>
            <Button startIcon={<RefreshIcon />} onClick={() => load()} sx={toolBtnSx}>{tx("Refresh")}</Button>
            <Button startIcon={<FileDownloadOutlinedIcon />} onClick={exportCsv} sx={toolBtnSx}>{tx("Export")}</Button>
            <Button startIcon={<PrintOutlinedIcon />} onClick={() => window.print()} sx={toolBtnSx}>{tx("Print")}</Button>
            {data.open_downtime ? <Alert severity="error" sx={{ py: 0, px: 1, fontSize: 11, "& .MuiAlert-icon": { py: 0.5 }, "& .MuiAlert-message": { py: 0.5 } }}>{L("Open downtime")}: {data.open_downtime.downtime_no} · {data.open_downtime.reason_text || EMPTY} · {ddmmhhmm(data.open_downtime.started_at)}</Alert> : null}
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">{tx("Last Update")}: {lastUpdate ? lastUpdate.toLocaleString(localeTag()) : EMPTY}</Typography>
            <FormControlLabel sx={{ mr: 0 }} control={<Switch size="small" checked={live} onChange={(e) => setLive(e.target.checked)} />} label={<Typography variant="caption" fontWeight={700}>{L("Live Data")}</Typography>} />
          </Stack>
          {loading ? <LinearProgress sx={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2 }} /> : null}
        </Paper>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1fr) minmax(0,3fr)" }, gap: 1 }}>
          <Paper elevation={0} sx={{ ...cardSx, px: 1.25, py: 0.75, display: "grid", gridTemplateColumns: "56px minmax(0,1fr)", gap: 1, alignItems: "center" }}>
            <Box sx={{ height: 56, borderRadius: 1.5, border: 1, borderColor: "divider", display: "grid", placeItems: "center", overflow: "hidden", bgcolor: "action.hover" }}>
              {m.image_url ? <Box component="img" src={resolveImageUrl(m.image_url)} alt="" sx={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <PrecisionManufacturingOutlinedIcon sx={{ fontSize: 30, color: MACHINE_COLORS[m.operational_status] }} />}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#1570EF" }}>{m.equipment_code}</Typography><MachineStatusPill value={m.operational_status} />
              </Stack>
              <Typography variant="caption" fontWeight={700} noWrap sx={{ display: "block" }} title={m.equipment_name}>{m.equipment_name}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }} title={infoFields.map(([a, b]) => `${a}: ${b || EMPTY}`).join("\n")}>
                {[m.area_name, m.group_name, [m.manufacturer, m.model].filter(Boolean).join(" ")].filter(Boolean).join(" · ") || EMPTY}</Typography>
            </Box>
          </Paper>
          <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))", xl: "repeat(6, minmax(0,1fr))" }}>
            <KpiTile tone="primary" title="OEE" value={k.oee != null ? num(k.oee, 1) : EMPTY} unit={k.oee != null ? "%" : ""} sub={vs(k.oee, y.oee)} icon={SpeedOutlinedIcon} />
            <KpiTile tone="success" title={L("Availability")} value={k.availability != null ? num(k.availability, 1) : EMPTY} unit={k.availability != null ? "%" : ""} sub={vs(k.availability, y.availability)} icon={ScheduleOutlinedIcon} />
            <KpiTile tone="warning" title={L("Performance")} value={k.performance != null ? num(k.performance, 1) : EMPTY} unit={k.performance != null ? "%" : ""} sub={vs(k.performance, y.performance)} icon={TrendingUpOutlinedIcon} />
            <KpiTile tone="accent" title={L("Quality")} value={k.quality != null ? num(k.quality, 2) : EMPTY} unit={k.quality != null ? "%" : ""} sub={vs(k.quality, y.quality)} icon={VerifiedOutlinedIcon} />
            <KpiTile tone="info" title={L("Cycle Time (sec)")} value={data.cycle?.value != null ? num(data.cycle.value, 1) : EMPTY} sub={data.cycle?.target ? `${L("Standard")} ${num(data.cycle.target, 1)} s` : ""} icon={TimerOutlinedIcon} />
            <KpiTile tone="primary" title={L("Shot Count")} value={data.shot_count != null ? num(data.shot_count) : num(k.shots)} sub={`${num(k.shots)} shots · ${num(k.good)} ${L("Good")}`} icon={AdsClickOutlinedIcon} />
          </KpiCardGroup>
        </Box>

        <Box sx={{ ...fitGridSx, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" }, gridTemplateRows: { lg: "minmax(0,1fr) minmax(0,1fr)" } }}>
          <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "1" }, gridRow: { lg: "1" } }}>
            <Head title={L("Current Production")} />
            {!cur ? <EmptyBody text={L("No work order running on this machine.")} /> : (
              <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 0.75 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", columnGap: 1.5, rowGap: 0.3 }}>
                  <Typography variant="caption" color="text.secondary">{tx("Work Order")}</Typography>
                  <Typography variant="caption" fontWeight={800} noWrap sx={{ color: "#1570EF", cursor: "pointer" }} onClick={() => navigate(`/production-management/work-orders/execution?wo=${cur.id}`)}>{cur.wo_no} · {label("woStatus", cur.status)}</Typography>
                  <Typography variant="caption" color="text.secondary">{L("Production Order")}</Typography>
                  <Typography variant="caption" fontWeight={700} noWrap sx={{ color: "#1570EF", cursor: "pointer" }} onClick={() => navigate(`/production-management/production-orders/detail?order=${encodeURIComponent(cur.order_no || "")}`)}>{cur.order_no || EMPTY}</Typography>
                  <Typography variant="caption" color="text.secondary">{L("Product")}</Typography>
                  <Typography variant="caption" fontWeight={700} noWrap title={cur.product_name}>{cur.product_name}</Typography>
                  <Typography variant="caption" color="text.secondary">{L("Mold")}</Typography>
                  <Typography variant="caption" fontWeight={700} noWrap>{cur.mold_code || EMPTY} · {cur.mold_cavity ?? cur.cavity} cav</Typography>
                  <Typography variant="caption" color="text.secondary">{L("Material")}</Typography>
                  <Typography variant="caption" fontWeight={700} noWrap>{(cur.materials || []).map((x) => x.material_code).join(", ") || EMPTY}</Typography>
                  {[[L("Planned Qty"), `${num(cur.planned_qty)} pcs`], [L("Good Qty"), `${num(cur.good_qty)} pcs`, "#12B76A"], [L("Reject Qty"), `${num(cur.reject_qty)} pcs`, "#F04438"],
                    [L("Remaining Qty"), `${num(cur.remaining_qty)} pcs`], [tx("Start Time"), ddmmhhmm(cur.started_at)], [L("Due Time"), ddmmhhmm(cur.due_date)]].map(([a, b, c]) => [
                    <Typography key={`${a}k`} variant="caption" color="text.secondary">{a}</Typography>, <Typography key={`${a}v`} variant="caption" fontWeight={700} sx={{ color: c }}>{b}</Typography>])}
                </Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Typography variant="caption" color="text.secondary">{L("Progress")}</Typography>
                  <LinearProgress variant="determinate" value={Math.min(cur.progress_pct, 100)} sx={{ flex: 1, height: 7, borderRadius: 4 }} />
                  <Typography variant="caption" fontWeight={800}>{num(cur.progress_pct, 1)}%</Typography>
                </Stack>
              </Box>
            )}
          </Paper>

          <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "2 / 4" }, gridRow: { lg: "1" } }}>
            <Head title={L("Machine Status")} action={(
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 26, "& .MuiTab-root": { minHeight: 26, py: 0, px: 1.25, minWidth: 0, textTransform: "none", fontWeight: 700, fontSize: 11 } }}>
                <Tab label={L("Real-time Status")} /><Tab label={`${L("Machine Event Log")} (${data.events.length})`} /><Tab label={L("Downtime")} />
              </Tabs>
            )} />
            <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1 }}>
              {tab === 0 ? (
                <Box sx={{ height: "100%", display: "grid", gridTemplateRows: "auto minmax(60px,1fr) auto", gap: 1 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1 }}>{comps.slice(0, 4).map(compTile)}</Box>
                  <Box sx={{ minHeight: 0, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: "action.hover", overflow: "hidden" }}>
                    {m.image_url ? <Box component="img" src={resolveImageUrl(m.image_url)} alt="" sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      : <PrecisionManufacturingOutlinedIcon sx={{ fontSize: 72, color: MACHINE_COLORS[m.operational_status], opacity: 0.85 }} />}
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1 }}>{comps.slice(4, 8).map(compTile)}</Box>
                </Box>
              ) : null}
              {tab === 1 ? (data.events.length ? (
                <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(14, 12, 46, 12, 16) }}>
                  <TableHead><TableRow><TableCell>{tx("Time")}</TableCell><TableCell>{L("Event Type")}</TableCell><TableCell>{L("Description")}</TableCell><TableCell>{tx("Duration")}</TableCell><TableCell>{L("User/System")}</TableCell></TableRow></TableHead>
                  <TableBody>{data.events.map((e, i) => (
                    <TableRow key={i}><TableCell>{ddmmhhmm(e.at)}</TableCell><TableCell sx={{ color: EVENT_COLORS[e.kind], fontWeight: 700 }}>{L(e.kind)}</TableCell>
                      <TableCell title={eventText(e)}>{eventText(e)}</TableCell>
                      <TableCell>{e.secs != null ? minText(e.secs / 60) : EMPTY}</TableCell><TableCell title={eventActor(e.actor)}>{e.actor ? eventActor(e.actor) : EMPTY}</TableCell></TableRow>
                  ))}</TableBody>
                </Table>
              ) : <EmptyBody text={tx("No data.")} />) : null}
              {tab === 2 ? (
                <Stack spacing={0.5}>
                  {data.open_downtime ? <Alert severity="error" sx={{ py: 0 }}>{L("Open downtime")}: {data.open_downtime.downtime_no} · {minText((Date.now() - new Date(data.open_downtime.started_at)) / 60000)}</Alert> : null}
                  {data.events.filter((e) => e.kind === "DOWNTIME").map((e, i) => (
                    <Stack key={i} direction="row" sx={{ justifyContent: "space-between", borderBottom: 1, borderColor: "divider", py: 0.5, gap: 1 }}>
                      <Typography variant="caption" noWrap><b>{e.title}</b> · {e.detail || EMPTY}</Typography><Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>{ddmmhhmm(e.at)} · {minText((e.secs || 0) / 60)}</Typography>
                    </Stack>
                  ))}
                  {!data.open_downtime && !data.events.some((e) => e.kind === "DOWNTIME") ? <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography> : null}
                </Stack>
              ) : null}
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "4" }, gridRow: { lg: "1" } }}>
            <Head title={sumView === "cycle" ? L("Cycle Time Breakdown (sec)") : L("Status Summary (today)")} action={(
              <ToggleButtonGroup exclusive size="small" value={sumView} onChange={(e, v) => v && setSumView(v)}>
                <ToggleButton value="status" sx={toggleSx}>{tx("Status")}</ToggleButton>
                <ToggleButton value="cycle" sx={toggleSx}>{L("Cycle Time (sec)")}</ToggleButton>
              </ToggleButtonGroup>
            )} />
            {sumView === "status" ? (
              <Box sx={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.15fr)", alignItems: "center", gap: 1, px: 1.5, pb: 1 }}>
                <Chart type="donut" height={150} series={statusKeys.length ? statusKeys.map((s) => Math.round(secs[s] / 60)) : [1]} options={{
                  chart: { background: "transparent" }, labels: statusKeys.length ? statusKeys.map((s) => label("machineStatus", s)) : [tx("No data.")], colors: statusKeys.length ? statusKeys.map((s) => MACHINE_COLORS[s]) : ["#EAECF0"],
                  legend: { show: false }, dataLabels: { enabled: false }, stroke: { width: 2, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v) => `${v} ${tx("min")}` } },
                  plotOptions: { pie: { donut: { size: "68%" } } } }} />
                <Stack spacing={0.5}>{STATUSES.map((s) => (
                  <Stack key={s} direction="row" sx={{ justifyContent: "space-between", gap: 1 }}><Dot color={MACHINE_COLORS[s]} text={label("machineStatus", s)} />
                    <Typography variant="caption" fontWeight={700} sx={{ whiteSpace: "nowrap" }}>{minText((secs[s] || 0) / 60)}</Typography></Stack>
                ))}</Stack>
              </Box>
            ) : data.breakdown.length ? (
              <Box sx={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.15fr)", alignItems: "center", gap: 1, px: 1.5, pb: 1 }}>
                <Chart type="donut" height={150} series={data.breakdown.map(([, v]) => v)} options={{
                  chart: { background: "transparent" }, labels: data.breakdown.map(([c]) => L(c)), colors: BREAK_COLORS, legend: { show: false }, dataLabels: { enabled: false },
                  stroke: { width: 2, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v) => `${num(v, 2)} s` } },
                  plotOptions: { pie: { donut: { size: "68%", labels: { show: true, total: { show: true, label: tx("Total"), color: axisColor, formatter: () => num(data.cycle?.value, 1) }, value: { fontSize: "13px", fontWeight: 800, color: dark ? "#F3F4F6" : "#172033" } } } } } }} />
                <Stack spacing={0.4}>{data.breakdown.map(([c, v], i) => (
                  <Stack key={c} direction="row" sx={{ justifyContent: "space-between", gap: 1 }}><Box sx={{ minWidth: 0, overflow: "hidden" }}><Dot color={BREAK_COLORS[i % BREAK_COLORS.length]} text={L(c)} /></Box><Typography variant="caption" fontWeight={700} sx={{ whiteSpace: "nowrap" }}>{num(v, 2)} s</Typography></Stack>
                ))}</Stack>
              </Box>
            ) : <EmptyBody text={L("No data yet (waiting for PLC / IoT data).")} />}
          </Paper>

          <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "1" }, gridRow: { lg: "2" } }}>
            <Head title={L("Parameter Monitoring")} action={paramOptions[0]?.source ? <Typography variant="caption" color="text.secondary">{L("Source")}: {label("source", paramOptions[0].source)}</Typography> : null} />
            {paramOptions.length ? (
              <Box sx={fillSx}>
                <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(36, 17, 19, 14, 14) }}>
                  <TableHead><TableRow><TableCell>{L("Parameter")}</TableCell><TableCell align="right">{L("Set Value")}</TableCell><TableCell align="right">{L("Actual Value")}</TableCell><TableCell>{L("Unit")}</TableCell><TableCell align="center">{tx("Status")}</TableCell></TableRow></TableHead>
                  <TableBody>{paramOptions.map((p) => (
                    <TableRow key={p.code} hover selected={trendKey === p.code} sx={{ cursor: "pointer" }} onClick={() => setTrendKey(p.code)}>
                      <TableCell sx={{ color: "#1570EF" }} title={`${p.name}${p.min != null || p.max != null ? ` · ${p.min ?? "…"} – ${p.max ?? "…"}` : ""}`}>{p.name}{p.standard ? " ★" : ""}</TableCell><TableCell align="right">{p.target != null ? num(p.target, 1) : EMPTY}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: p.state === "HIGH" || p.state === "LOW" ? "#F04438" : undefined }}>{num(p.value, 2)}</TableCell><TableCell>{p.unit || EMPTY}</TableCell>
                      <TableCell align="center"><CircleIcon sx={{ fontSize: 10, color: p.state === "OK" ? "#12B76A" : "#F04438", verticalAlign: "middle" }} /></TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </Box>
            ) : <EmptyBody text={L("No data yet (waiting for PLC / IoT data).")} />}
          </Paper>

          <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "2" }, gridRow: { lg: "2" } }}>
            <Head title={`${L("Trends")} (${trendKey === "OEE" ? L("Last 8 hours") : L("Last 2 hours")})`} action={
              <Select size="small" value={trendKey} onChange={(e) => setTrendKey(e.target.value)} sx={{ fontSize: 11, width: 140, "& .MuiSelect-select": { py: 0.4 } }}>
                <MenuItem value="OEE">OEE</MenuItem>{paramOptions.map((p) => <MenuItem key={p.code} value={p.code}>{p.name}</MenuItem>)}
              </Select>} />
            <Box sx={{ flex: 1, minHeight: 0, px: 1 }}>
              {trendKey === "OEE" ? (
                <Chart type="line" height="100%" series={[{ name: "OEE", data: data.oee_trend.map((t) => t.oee) }, { name: L("Availability"), data: data.oee_trend.map((t) => t.availability) }]} options={{
                  ...base, colors: ["#1570EF", "#12B76A"], stroke: { width: 2, curve: "smooth" }, markers: { size: 3 },
                  xaxis: { ...base.xaxis, categories: data.oee_trend.map((t) => t.hour) }, yaxis: { min: 0, max: 100, tickAmount: 4, labels: { ...base.yaxis.labels, formatter: (v) => `${num(v, 0)}%` } },
                  tooltip: { ...base.tooltip, shared: true } }} />
              ) : (() => {
                const p = data.parameters.find((x) => x.code === trendKey);
                const ann = [p?.max != null ? { y: p.max, borderColor: "#F04438", strokeDashArray: 4, label: { text: "Max", style: { background: "#F04438", color: "#fff" } } } : null,
                  p?.min != null ? { y: p.min, borderColor: "#F79009", strokeDashArray: 4, label: { text: "Min", style: { background: "#F79009", color: "#fff" } } } : null].filter(Boolean);
                return (
                  <Chart type="line" height="100%" series={[{ name: p?.name || trendKey, data: trend.map((r) => ({ x: new Date(r.t).getTime(), y: r.v })) }]} options={{
                    ...base, chart: { ...base.chart, animations: { enabled: false } }, colors: ["#1570EF"], stroke: { width: 2, curve: "straight" },
                    xaxis: { ...base.xaxis, type: "datetime", labels: { ...base.xaxis.labels, datetimeUTC: false } }, yaxis: { tickAmount: 4, labels: { ...base.yaxis.labels, formatter: (v) => num(v, 1) } },
                    annotations: { yaxis: ann }, tooltip: { ...base.tooltip, x: { format: "HH:mm:ss" } } }} />
                );
              })()}
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "3" }, gridRow: { lg: "2" } }}>
            <Head title={sideView === "maint" ? L("Maintenance Due") : tx("Active Alarms")} action={(
              <ToggleButtonGroup exclusive size="small" value={sideView} onChange={(e, v) => v && setSideView(v)}>
                <ToggleButton value="alarm" sx={toggleSx}>{tx("Alarms")} ({data.alarms.length})</ToggleButton>
                <ToggleButton value="maint" sx={toggleSx}>{tx("Maintenance")} ({(data.maintenance_due || []).length})</ToggleButton>
              </ToggleButtonGroup>
            )} />
            {sideView === "alarm" ? (data.alarms.length ? (
              <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1 }}>
                {data.alarms.map((a) => (
                  <Stack key={a.id} direction="row" spacing={1} sx={{ py: 0.5, borderBottom: 1, borderColor: "divider", alignItems: "center", cursor: "pointer" }} onClick={() => setDialog({ type: "alarm", id: a.id })}>
                    <PriorityPill value={a.priority} />
                    <Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="caption" fontWeight={800} sx={{ display: "block" }}>{a.alarm_no}</Typography><Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }} title={a.message}>{a.message}</Typography></Box>
                    <Typography variant="caption" color="text.secondary">{hhmm(a.raised_at)}</Typography>
                  </Stack>
                ))}
              </Box>
            ) : <EmptyBody text={tx("No data.")} />) : ((data.maintenance_due || []).length ? (
              <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1 }}>
                {data.maintenance_due.map((x) => (
                  <Stack key={`${x.kind}-${x.id}`} direction="row" spacing={1} sx={{ py: 0.5, borderBottom: 1, borderColor: "divider", alignItems: "center", cursor: "pointer" }}
                    onClick={() => navigate(x.kind === "WO" ? `/maintenance-management/machine-equipment-maintenance?wo=${x.id}` : `/maintenance-management/planning?plan=${x.id}`)}>
                    <BuildOutlinedIcon sx={{ fontSize: 13.5, color: x.overdue ? "#F04438" : "#1570EF" }} />
                    <Typography variant="caption" noWrap sx={{ flex: 1 }} title={x.title}>{x.title}</Typography>
                    <Typography variant="caption" sx={{ color: x.overdue ? "#F04438" : "text.secondary", fontWeight: x.overdue ? 700 : 400, whiteSpace: "nowrap" }}>{x.ref} · {String(x.due || "").slice(5, 10).split("-").reverse().join("/")}</Typography>
                  </Stack>
                ))}
              </Box>
            ) : <EmptyBody text={tx("No data.")} />)}
          </Paper>

          <Box sx={{ gridColumn: { lg: "4" }, gridRow: { lg: "2" }, display: "flex", minHeight: 0, "& > *": { flex: 1 } }}>
            <QuickCard title={tx("Quick Actions")} actions={quick} columns={3} />
          </Box>
        </Box>

        <SystemStatusBar system={data.system} />

        {dialog?.type === "downtime" && dtLookups && (
          <DowntimeDialog mode="report" api={DT_API} request={request} lookups={dtLookups} preset={{ equipment_id: m.id }} actor={actor} notify={notify} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); load({ silent: true }); }} />
        )}
        {dialog?.type === "alarm" && (
          <AlarmDialog api={AL_API} request={request} alarmId={dialog.id} canEdit={canEdit} actor={actor} notify={notify} onClose={() => setDialog(null)} onChanged={() => load({ silent: true })}
            onReportDowntime={() => setDialog({ type: "downtime" })} />
        )}
        {dialog?.type === "hold" && cur ? <HoldDialog wo={cur} lang={language} saving={saving} onClose={() => setDialog(null)} onSubmit={holdWo} /> : null}
        <Snackbar open={msg.open} autoHideDuration={5000} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}
