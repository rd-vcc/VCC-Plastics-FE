import "./locales";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import {
  Alert, Box, Button, CircularProgress, FormControl, FormControlLabel, InputLabel, LinearProgress, MenuItem, Paper, Select, Snackbar, Stack, Switch,
  Table, TableBody, TableCell, TableHead, TableRow, ThemeProvider as MuiThemeProvider, Typography,
} from "@mui/material";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FullscreenOutlinedIcon from "@mui/icons-material/FullscreenOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutlineOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

import { getCurrentUser } from "../../../auth/auth";
import usePagePermission from "../../../auth/usePagePermission";
import { resolveImageUrl } from "../../../components/common/ImageUploadField";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import MachineLayoutBoard from "../../../components/machine/MachineLayoutBoard";
import { API_CONFIG } from "../../../config/config";
import { useTheme as useAppTheme } from "../../../context/ThemeContext";
import { KpiTile, downloadCsv, useRequest } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, btn, cardSx, hhmm, num, pageTheme } from "../../ProductionManagement/ProductionPlanning/ui";
import { SystemStatusBar } from "../../ProductionManagement/WorkOrders/WorkOrderManagement/WoParts";
import { HoldDialog } from "../MachineDetail/MachineDetail";
import { label, localeTag, setActiveLanguage, tx } from "../machineLocales";
import { AlarmDialog, DowntimeDialog, MACHINE_COLORS, MachineStatusPill, PriorityPill, PRIORITY_COLORS, REASON_COLORS, minText } from "../machineUi";

const BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const API = `${BASE}/api/machine-monitoring`;
const DT_API = `${BASE}/api/downtime`;
const AL_API = `${BASE}/api/alarms`;
const EX_API = `${BASE}/api/production-execution`;
const STATUSES = ["RUNNING", "IDLE", "DOWN", "MAINTENANCE", "OFFLINE"];
const KEY_PARAMS = ["CYCLE_TIME", "INJECTION_TIME", "INJECTION_PRESSURE", "HOLDING_PRESSURE", "MELT_TEMPERATURE", "MOLD_TEMPERATURE", "SCREW_SPEED", "COOLING_TIME"];

const T = {
  vi: { subtitle: "Trạng thái thời gian thực của máy ép trên toàn nhà máy", "Total Machines": "Tổng số máy", "of total": "trên tổng", "OEE (Average)": "OEE (trung bình)",
    "Factory Layout - Machine Status": "Mặt bằng nhà máy - trạng thái máy", "All Areas": "Tất cả khu vực", "Machine Status Summary": "Tổng hợp trạng thái máy",
    "Downtime Analysis (Today)": "Phân tích dừng máy (hôm nay)", "Total downtime": "Tổng thời gian dừng", "Recent Alarms": "Cảnh báo gần đây", "View all": "Xem tất cả",
    "Maintenance Due (Today)": "Bảo trì đến hạn (hôm nay)", "Machine List": "Danh sách máy", "Product": "Sản phẩm", "Good": "Đạt", "Reject": "Lỗi", "Utilization": "Hiệu suất sử dụng",
    "Real-time Status": "Trạng thái thời gian thực", "Current Production": "Sản xuất hiện tại", "Mold": "Khuôn", "Cavity": "Số lòng khuôn", "Shot counter": "Bộ đếm shot",
    "Mold life": "Tuổi thọ khuôn", "Remaining life": "Tuổi thọ còn lại", "Progress": "Tiến độ", "OEE Trend (7 days)": "Xu hướng OEE (7 ngày)", "Machine Utilization (Today)": "Hiệu suất sử dụng máy (hôm nay)",
    "Parameter Monitor": "Giám sát thông số", "Hold Machine": "Tạm dừng máy", "Resume Machine": "Tiếp tục chạy", "Stop Machine": "Dừng máy", "Work Order": "Work Order",
    "Click a machine to view its status; click again to open Machine Detail.": "Bấm vào máy để xem trạng thái, bấm lần nữa để mở Chi tiết máy.",
    "No layout image yet — machines are placed on a grid.": "Chưa có ảnh mặt bằng — máy đang được xếp trên lưới.", "Full Screen": "Toàn màn hình",
    "No machine in production.": "Máy không có WO đang chạy.", "No data yet (waiting for PLC / IoT data).": "Chưa có dữ liệu (chờ dữ liệu PLC / IoT).",
    "Group": "Nhóm máy", "Need attention": "Cần xử lý", "machines": "máy", "Select a machine": "Chọn một máy", "Work order resumed.": "Đã tiếp tục Work Order.", "Util. %": "Sử dụng %" },
  ja: { subtitle: "工場全体の成形機のリアルタイム状態", "Total Machines": "総機械数", "of total": "全体比", "OEE (Average)": "OEE（平均）", "Factory Layout - Machine Status": "工場レイアウト - 機械状態",
    "All Areas": "全エリア", "Machine Status Summary": "機械状態サマリー", "Downtime Analysis (Today)": "停止分析（本日）", "Total downtime": "総停止時間", "Recent Alarms": "最近のアラーム",
    "View all": "すべて表示", "Maintenance Due (Today)": "本日の保全予定", "Machine List": "機械一覧", "Product": "製品", "Good": "良品", "Reject": "不良", "Utilization": "稼働率",
    "Real-time Status": "リアルタイム状態", "Current Production": "現在の生産", "Mold": "金型", "Cavity": "キャビティ", "Shot counter": "ショットカウンター", "Mold life": "金型寿命",
    "Remaining life": "残寿命", "Progress": "進捗", "OEE Trend (7 days)": "OEE推移（7日）", "Machine Utilization (Today)": "機械稼働率（本日）", "Parameter Monitor": "パラメータ監視",
    "Hold Machine": "機械保留", "Resume Machine": "再開", "Stop Machine": "停止", "Work Order": "作業指示", "Click a machine to view its status; click again to open Machine Detail.": "機械をクリックで状態表示、もう一度クリックで機械詳細。",
    "No layout image yet — machines are placed on a grid.": "レイアウト図未設定 — グリッド表示中。", "Full Screen": "全画面", "No machine in production.": "稼働中の作業指示はありません。",
    "No data yet (waiting for PLC / IoT data).": "データなし（PLC / IoT 待ち）。", "Group": "グループ", "Need attention": "要対応", "machines": "台", "Select a machine": "機械を選択",
    "Work order resumed.": "作業指示を再開しました。", "Util. %": "稼働率 %" },
};
const tt = (k, lang) => T[String(lang).split("-")[0]]?.[k] || (k === "subtitle" ? "Real-time status of injection machines across the plant" : tx(k));

export default function MachineMonitoring() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  const L = (k) => tt(k, language);
  const { theme } = useAppTheme();
  const dark = theme === "dark";
  const muiTheme = useMemo(() => pageTheme(theme), [theme]);
  const navigate = useNavigate();
  const { canEdit } = usePagePermission();
  const actor = getCurrentUser()?.employee_code || "SYSTEM";
  const request = useRequest();
  const rootRef = useRef(null);

  const [data, setData] = useState(null);
  const [filter, setFilter] = useState({ group_id: "", status: "" });
  const [area, setArea] = useState("ALL");
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [live, setLive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dtLookups, setDtLookups] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ open: false, type: "success", text: "" });
  const notify = useCallback((type, text) => setMsg({ open: true, type, text }), []);

  useEffect(() => { request(`${DT_API}/lookups`).then(setDtLookups).catch(() => {}); }, [request]);
  const load = useCallback(async ({ silent } = {}) => {
    if (!silent) setLoading(true);
    const q = new URLSearchParams({ category: "MACHINE", ...(filter.group_id ? { group_id: filter.group_id } : {}), ...(filter.status ? { status: filter.status } : {}) });
    try {
      const d = await request(`${API}/overview?${q}`);
      setData(d); setLastUpdate(new Date());
      setSelectedId((id) => (id && d.items.some((i) => i.id === id) ? id : (d.items.find((i) => i.operational_status === "RUNNING") || d.items[0])?.id || null));
    } catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [filter, request, notify]);
  useEffect(() => { load(); }, [load]);
  const loadDetail = useCallback(() => {
    if (!selectedId) { setDetail(null); return; }
    request(`${API}/machines/${selectedId}`).then(setDetail).catch(() => setDetail(null));
  }, [selectedId, request]);
  useEffect(() => { loadDetail(); }, [loadDetail, lastUpdate]);
  useEffect(() => {
    if (!live) return undefined;
    const t = setInterval(() => { if (!dialog) load({ silent: true }); }, 15000);
    return () => clearInterval(t);
  }, [live, load, dialog]);

  if (!data) return <Box sx={{ height: 400, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  const k = data.kpis;
  const total = k.total || 0;
  const pct = (n) => (total ? `${num((n / total) * 100, 1)}% ${L("of total")}` : "");
  const items = data.items;
  const areas = data.areas;
  const boardArea = area === "ALL" ? (areas.length === 1 ? areas[0] : null) : areas.find((a) => a.id === area);
  const boardItems = boardArea ? items.filter((i) => i.layout_node_id === boardArea.id) : items;
  const listItems = area === "ALL" ? items : boardItems;
  const sel = items.find((i) => i.id === selectedId);
  const cur = detail?.machine?.id === selectedId ? detail.current : null;
  const axisColor = dark ? "#A7B0C0" : "#667085";
  const grid = { borderColor: dark ? "#263244" : "#EEF2F6" };
  const toolBtnSx = { ...btn("cancel"), bgcolor: "background.paper", border: 1, borderColor: "divider" };
  const tableSx = { "& td, & th": { fontSize: 11.5, px: 0.75, py: 0.5, whiteSpace: "nowrap" }, "& th": { color: "text.secondary", fontWeight: 800, bgcolor: "background.paper" } };
  const statusCounts = STATUSES.map((s) => [s, k[s.toLowerCase()] || 0]);
  const dtTotal = data.downtime_by_reason.reduce((a, [, m]) => a + m, 0);
  const runSec = items.reduce((a, i) => a + (i.running_sec || 0), 0);
  const elapsedSec = items.reduce((a, i) => a + (i.elapsed_sec || 0), 0);
  const utilization = elapsedSec ? Math.round((runSec / elapsedSec) * 1000) / 10 : 0;
  const detailUrl = (id) => `/machine-equipment/machine-detail?machine=${id}`;

  const hold = async (reason) => {
    setSaving(true);
    try { await request(`${EX_API}/${cur.id}/hold`, { method: "POST", body: JSON.stringify({ reason, actor, version: cur.version }) }); setDialog(null); notify("success", tx("Work order on hold.")); load({ silent: true }); }
    catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const resume = async () => {
    setSaving(true);
    try { await request(`${EX_API}/${cur.id}/resume`, { method: "POST", body: JSON.stringify({ actor, version: cur.version }) }); notify("success", L("Work order resumed.")); load({ silent: true }); }
    catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const exportCsv = () => downloadCsv("machine-monitoring.csv", ["Machine", "Name", "Area", "Status", "Work Order", "Product", "OEE %", "Good", "Reject", "Utilization %", "Active alarms"],
    items.map((i) => [i.equipment_code, i.equipment_name, i.layout_area, i.operational_status, i.wo_no, i.product_name, i.oee, i.good, i.reject,
      i.elapsed_sec ? Math.round((i.running_sec / i.elapsed_sec) * 1000) / 10 : "", i.alarms]));
  const fullScreen = () => (document.fullscreenElement ? document.exitFullscreen() : rootRef.current?.requestFullscreen?.());

  const quick = [
    [L("Parameter Monitor"), InsightsOutlinedIcon, "#0E9384", () => navigate(detailUrl(selectedId)), !selectedId],
    [tx("Alarm History"), NotificationsOutlinedIcon, "#F79009", () => navigate(`/machine-equipment/alarm-history${selectedId ? `?machine=${selectedId}` : ""}`), false],
    [tx("Downtime Management"), TimerOutlinedIcon, "#7A5AF8", () => navigate(`/machine-equipment/downtime-management${selectedId ? `?machine=${selectedId}` : ""}`), false],
    [L("Work Order"), AssignmentOutlinedIcon, "#12B76A", () => navigate(cur ? `/production-management/work-orders/execution?wo=${cur.id}` : "/production-management/work-orders/management"), false],
    [L("Hold Machine"), PauseCircleOutlineIcon, "#F79009", () => setDialog({ type: "hold" }), !canEdit || cur?.status !== "IN_PRODUCTION"],
    [L("Resume Machine"), PlayCircleOutlineIcon, "#12B76A", resume, !canEdit || saving || cur?.status !== "ON_HOLD"],
    [tx("Machine Detail"), PrecisionManufacturingOutlinedIcon, "#1570EF", () => navigate(detailUrl(selectedId)), !selectedId],
    [tx("Report Downtime"), ReportProblemOutlinedIcon, "#F04438", () => setDialog({ type: "downtime" }), !canEdit || !selectedId || Boolean(detail?.open_downtime)],
    [tx("Export"), FileDownloadOutlinedIcon, "#12B76A", exportCsv, false],
    [tx("Print"), PrintOutlinedIcon, "#475467", () => window.print(), false],
  ];
  const tooltip = (i) => (
    <Box sx={{ fontSize: 11.5, lineHeight: 1.5 }}>
      <b>{i.equipment_code}</b> · {i.equipment_name}<br />
      {label("machineStatus", i.operational_status)} · OEE {i.oee != null ? `${num(i.oee, 1)}%` : EMPTY}<br />
      {i.wo_no ? <>{i.wo_no} · {i.product_name}<br />{L("Progress")}: {num(i.progress_pct, 1)}%<br /></> : null}
      {i.alarms ? `${tx("Active Alarms")}: ${i.alarms}` : null}
    </Box>
  );
  const params = (detail?.parameters || []).filter((p) => p.value != null).sort((a, b) => (KEY_PARAMS.indexOf(a.code) + 1 || 99) - (KEY_PARAMS.indexOf(b.code) + 1 || 99)).slice(0, 8);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box ref={rootRef} sx={{ bgcolor: "background.default", overflow: "auto" }}>
        <PageMeta title={`${tx("Machine Monitoring")} | VCC Plastics`} description={L("subtitle")} />
        <PageBreadcrumb pageTitle={tx("Machine Monitoring")} />
        <Paper elevation={0} sx={{ ...cardSx, p: 1, mb: 1.5 }}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <FormControl size="small" sx={{ minWidth: 170 }}><InputLabel>{tx("Area")}</InputLabel>
              <Select label={tx("Area")} value={area} onChange={(e) => setArea(e.target.value)}>
                <MenuItem value="ALL">{L("All Areas")}</MenuItem>{areas.map((a) => <MenuItem key={a.id ?? "none"} value={a.id}>{a.name}</MenuItem>)}
              </Select></FormControl>
            <FormControl size="small" sx={{ minWidth: 170 }}><InputLabel shrink>{L("Group")}</InputLabel>
              <Select displayEmpty notched label={L("Group")} value={filter.group_id} onChange={(e) => setFilter((f) => ({ ...f, group_id: e.target.value }))}>
                <MenuItem value="">{tx("All")}</MenuItem>{data.groups.map((g) => <MenuItem key={g.id} value={g.id}>{g.group_name}</MenuItem>)}
              </Select></FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel shrink>{tx("Status")}</InputLabel>
              <Select displayEmpty notched label={tx("Status")} value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}>
                <MenuItem value="">{tx("All")}</MenuItem>{STATUSES.map((s) => <MenuItem key={s} value={s}>{label("machineStatus", s)}</MenuItem>)}
              </Select></FormControl>
            <Button startIcon={<RefreshIcon />} onClick={() => load()} sx={toolBtnSx}>{tx("Refresh")}</Button>
            <Button startIcon={<NotificationsActiveOutlinedIcon />} onClick={() => navigate("/machine-equipment/alarm-history")} sx={toolBtnSx}>{tx("Alarms")}</Button>
            <Button startIcon={<FileDownloadOutlinedIcon />} onClick={exportCsv} sx={toolBtnSx}>{tx("Export")}</Button>
            <Button startIcon={<FullscreenOutlinedIcon />} onClick={fullScreen} sx={toolBtnSx}>{L("Full Screen")}</Button>
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">{tx("Last Update")}: {lastUpdate ? lastUpdate.toLocaleString(localeTag()) : EMPTY}</Typography>
            <FormControlLabel sx={{ mx: 0.5 }} control={<Switch size="small" checked={live} onChange={(e) => setLive(e.target.checked)} />} label={<Typography variant="caption" fontWeight={700}>{tx("Auto Refresh")}</Typography>} />
          </Stack>
        </Paper>
        {loading ? <LinearProgress sx={{ mb: 1 }} /> : null}

        <Box sx={{ mb: 1.5 }}>
          <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(4, minmax(0,1fr))", xl: "repeat(7, minmax(0,1fr))" }}>
            <KpiTile tone="primary" title={L("Total Machines")} value={num(total)} sub={`${data.groups.length} ${L("Group").toLowerCase()} · ${areas.length} ${tx("Area").toLowerCase()}`} icon={PrecisionManufacturingOutlinedIcon} />
            <KpiTile tone="success" title={label("machineStatus", "RUNNING")} value={num(k.running)} sub={pct(k.running)} icon={PlayCircleOutlineIcon} onClick={() => setFilter((f) => ({ ...f, status: f.status === "RUNNING" ? "" : "RUNNING" }))} />
            <KpiTile tone="warning" title={label("machineStatus", "IDLE")} value={num(k.idle)} sub={pct(k.idle)} icon={PauseCircleOutlineIcon} onClick={() => setFilter((f) => ({ ...f, status: f.status === "IDLE" ? "" : "IDLE" }))} />
            <KpiTile tone="danger" title={label("machineStatus", "DOWN")} value={num(k.down)} sub={pct(k.down)} icon={StopCircleOutlinedIcon} onClick={() => setFilter((f) => ({ ...f, status: f.status === "DOWN" ? "" : "DOWN" }))} />
            <KpiTile tone="info" title={label("machineStatus", "MAINTENANCE")} value={num(k.maintenance)} sub={pct(k.maintenance)} icon={BuildCircleOutlinedIcon} onClick={() => setFilter((f) => ({ ...f, status: f.status === "MAINTENANCE" ? "" : "MAINTENANCE" }))} />
            <KpiTile tone="accent" title={L("OEE (Average)")} value={k.oee != null ? num(k.oee, 1) : EMPTY} unit={k.oee != null ? "%" : ""} sub={`${tx("Availability")} ${k.availability != null ? `${num(k.availability, 1)}%` : EMPTY}`} icon={SpeedOutlinedIcon} />
            <KpiTile tone="danger" title={tx("Active Alarms")} value={num(k.active_alarms)} sub={k.active_alarms ? L("Need attention") : ""} icon={WarningAmberOutlinedIcon} onClick={() => navigate("/machine-equipment/alarm-history")} />
          </KpiCardGroup>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,2.2fr) minmax(0,1fr) minmax(0,1fr)" }, gap: 1.5, mb: 1.5 }}>
          <Paper elevation={0} sx={cardSx}>
            <Head title={L("Factory Layout - Machine Status")} action={
              <Stack direction="row" spacing={1.25} sx={{ flexWrap: "wrap" }}>{STATUSES.map((s) => (
                <Stack key={s} direction="row" spacing={0.5} sx={{ alignItems: "center" }}><Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: MACHINE_COLORS[s] }} />
                  <Typography variant="caption" fontWeight={600}>{label("machineStatus", s)}</Typography></Stack>))}</Stack>} />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "150px minmax(0,1fr)" }, gap: 1, px: 1.5, pb: 1 }}>
              <Stack spacing={0.75}>
                {[{ id: "ALL", name: L("All Areas"), count: total }, ...areas].map((a) => (
                  <Button key={a.id ?? "none"} onClick={() => setArea(a.id)} sx={{ justifyContent: "space-between", textTransform: "none", fontSize: 12, fontWeight: 700, py: 0.6, borderRadius: 1.5, border: 1,
                    borderColor: area === a.id ? "#1570EF" : "divider", bgcolor: area === a.id ? "#1570EF" : "background.paper", color: area === a.id ? "#fff" : "text.primary", "&:hover": { bgcolor: area === a.id ? "#175CD3" : "action.hover" } }}>
                    <span>{a.name}</span><span>{a.count}</span>
                  </Button>
                ))}
              </Stack>
              <Box>
                <MachineLayoutBoard image={boardArea?.image_url} items={boardItems} selectedId={selectedId} minHeight={330} renderTooltip={tooltip}
                  onSelect={(i) => (i.id === selectedId ? navigate(detailUrl(i.id)) : setSelectedId(i.id))} emptyText={boardArea?.image_url ? "" : L("No layout image yet — machines are placed on a grid.")} />
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, textAlign: "right" }}>{L("Click a machine to view its status; click again to open Machine Detail.")}</Typography>
              </Box>
            </Box>
          </Paper>

          <Stack spacing={1.5}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={L("Machine Status Summary")} />
              <Box sx={{ display: "grid", gridTemplateColumns: "150px 1fr", alignItems: "center", px: 1, pb: 1 }}>
                <Chart type="donut" height={160} series={statusCounts.map(([, n]) => n)} options={{
                  labels: statusCounts.map(([s]) => label("machineStatus", s)), colors: statusCounts.map(([s]) => MACHINE_COLORS[s]), legend: { show: false }, dataLabels: { enabled: false },
                  stroke: { width: 1, colors: [dark ? "#111827" : "#fff"] }, chart: { background: "transparent" }, tooltip: { theme: dark ? "dark" : "light" },
                  plotOptions: { pie: { donut: { size: "70%", labels: { show: true, name: { show: true, color: axisColor }, value: { show: true, fontSize: "20px", fontWeight: 800, color: dark ? "#fff" : "#101828" },
                    total: { show: true, label: tx("Total"), color: axisColor, formatter: () => String(total) } } } } } }} />
                <Stack spacing={0.6}>{statusCounts.map(([s, n]) => (
                  <Stack key={s} direction="row" spacing={1} sx={{ alignItems: "center" }}><Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: MACHINE_COLORS[s] }} />
                    <Typography variant="caption" sx={{ flex: 1 }}>{label("machineStatus", s)}</Typography>
                    <Typography variant="caption" fontWeight={800}>{n} ({total ? num((n / total) * 100, 1) : 0}%)</Typography></Stack>))}</Stack>
              </Box>
            </Paper>
            <Paper elevation={0} sx={{ ...cardSx, flex: 1 }}>
              <Head title={L("Downtime Analysis (Today)")} action={<Button size="small" onClick={() => navigate("/machine-equipment/downtime-management")} sx={{ textTransform: "none", fontSize: 12 }}>{L("View all")}</Button>} />
              <Box sx={{ px: 1.5, pb: 1.5 }}>
                {!data.downtime_by_reason.length ? <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>{tx("No data.")}</Typography> : data.downtime_by_reason.slice(0, 6).map(([r, m], idx) => (
                  <Box key={r} sx={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr) 52px 44px", gap: 1, alignItems: "center", mb: 0.6 }}>
                    <Typography variant="caption" noWrap title={r}>{r === "UNSPECIFIED" ? tx("Unspecified") : r}</Typography>
                    <LinearProgress variant="determinate" value={dtTotal ? (m / dtTotal) * 100 : 0} sx={{ height: 8, borderRadius: 4, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: REASON_COLORS[idx % REASON_COLORS.length] } }} />
                    <Typography variant="caption" fontWeight={700} align="right">{minText(m)}</Typography>
                    <Typography variant="caption" color="text.secondary" align="right">{dtTotal ? num((m / dtTotal) * 100, 1) : 0}%</Typography>
                  </Box>
                ))}
                <Typography variant="caption" fontWeight={700}>{L("Total downtime")}: <Box component="span" sx={{ color: "#1570EF" }}>{minText(dtTotal)}</Box></Typography>
              </Box>
            </Paper>
          </Stack>

          <Stack spacing={1.5}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={`${L("Recent Alarms")} (${data.alarms.length})`} action={<Button size="small" onClick={() => navigate("/machine-equipment/alarm-history")} sx={{ textTransform: "none", fontSize: 12 }}>{L("View all")}</Button>} />
              <Box sx={{ px: 1.5, pb: 1.5, maxHeight: 250, overflow: "auto" }}>
                {!data.alarms.length ? <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography> : data.alarms.map((a) => (
                  <Stack key={a.id} direction="row" spacing={1} onClick={() => setDialog({ type: "alarm", id: a.id })}
                    sx={{ alignItems: "center", py: 0.6, borderBottom: 1, borderColor: "divider", cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}>
                    <WarningAmberOutlinedIcon sx={{ fontSize: 18, color: PRIORITY_COLORS[a.priority] }} />
                    <Typography variant="caption" fontWeight={800} sx={{ width: 64, flexShrink: 0 }}>{a.equipment_code}</Typography>
                    <Typography variant="caption" sx={{ flex: 1, minWidth: 0 }} noWrap title={a.message}>{a.message}</Typography>
                    <Typography variant="caption" color="text.secondary">{hhmm(a.raised_at)}</Typography>
                  </Stack>
                ))}
              </Box>
            </Paper>
            <Paper elevation={0} sx={{ ...cardSx, flex: 1 }}>
              <Head title={L("Maintenance Due (Today)")} />
              <Box sx={{ px: 1.5, pb: 1.5 }}>
                {data.maintenance_due.length ? data.maintenance_due.map((m) => (
                  <Typography key={`${m.kind}-${m.id}`} variant="caption" sx={{ display: "block", py: 0.3, cursor: "pointer", color: m.overdue ? "#F04438" : undefined }}
                    onClick={() => navigate(m.kind === "WO" ? `/maintenance-management/machine-equipment-maintenance?wo=${m.id}` : `/maintenance-management/planning?plan=${m.id}`)}>
                    <b>{m.equipment_code}</b> · {m.title} · {m.ref}</Typography>))
                  : <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography>}
              </Box>
            </Paper>
          </Stack>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,2.2fr) minmax(0,1fr) minmax(0,1fr)" }, gap: 1.5, mb: 1.5 }}>
          <Paper elevation={0} sx={cardSx}>
            <Head title={L("Machine List")} subtitle={`(${listItems.length} ${L("machines")})`} />
            <Box sx={{ px: 1, pb: 1, height: 300, overflow: "auto" }}>
              <Table size="small" stickyHeader sx={tableSx}>
                <TableHead><TableRow>
                  <TableCell>{tx("Machine")}</TableCell>{areas.length > 1 ? <TableCell>{tx("Area")}</TableCell> : null}<TableCell align="center">{tx("Status")}</TableCell><TableCell>{L("Product")}</TableCell>
                  <TableCell>{L("Work Order")}</TableCell><TableCell align="right">OEE (%)</TableCell><TableCell align="right">{L("Good")}</TableCell><TableCell align="right">{L("Reject")}</TableCell>
                  <TableCell align="right">{L("Util. %")}</TableCell><TableCell align="center">{tx("Alarms")}</TableCell>
                </TableRow></TableHead>
                <TableBody>{listItems.map((i) => (
                  <TableRow key={i.id} hover selected={i.id === selectedId} onClick={() => setSelectedId(i.id)} onDoubleClick={() => navigate(detailUrl(i.id))} sx={{ cursor: "pointer" }}>
                    <TableCell sx={{ fontWeight: 800, color: "#1570EF" }}>{i.equipment_code}</TableCell>{areas.length > 1 ? <TableCell>{i.layout_area || i.area_name || EMPTY}</TableCell> : null}
                    <TableCell align="center"><MachineStatusPill value={i.operational_status} /></TableCell>
                    <TableCell sx={{ maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis" }}>{i.product_name || EMPTY}</TableCell>
                    <TableCell>{i.wo_no ? <Box component="span" sx={{ color: "#1570EF", fontWeight: 700 }} onClick={(e) => { e.stopPropagation(); navigate(`/production-management/work-orders/execution?wo=${i.wo_id}`); }}>{i.wo_no}</Box> : EMPTY}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{i.oee != null ? num(i.oee, 1) : EMPTY}</TableCell>
                    <TableCell align="right">{num(i.good)}</TableCell><TableCell align="right" sx={{ color: i.reject ? "#F04438" : undefined }}>{num(i.reject)}</TableCell>
                    <TableCell align="right">{i.elapsed_sec ? `${num((i.running_sec / i.elapsed_sec) * 100, 0)}%` : EMPTY}</TableCell>
                    <TableCell align="center">{i.alarms ? <PriorityPill value={i.alarm_top} /> : EMPTY}</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </Box>
          </Paper>

          <Paper elevation={0} sx={cardSx}>
            <Head title={L("Real-time Status")} subtitle={sel ? `(${sel.equipment_code})` : ""} action={sel ? <MachineStatusPill value={sel.operational_status} /> : null} />
            <Box sx={{ px: 1.5, pb: 1.5 }}>
              {!sel ? <Typography variant="caption" color="text.secondary">{L("Select a machine")}</Typography> : !params.length ? <Typography variant="caption" color="text.secondary">{L("No data yet (waiting for PLC / IoT data).")}</Typography> : (
                <Table size="small" sx={tableSx}><TableBody>{params.map((p) => (
                  <TableRow key={p.code}><TableCell>{p.name}{p.unit ? ` (${p.unit})` : ""}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: p.state === "HIGH" || p.state === "LOW" ? "#F04438" : undefined }}>{num(p.value, p.value >= 100 ? 0 : 2)}</TableCell></TableRow>
                ))}</TableBody></Table>
              )}
              {detail?.open_downtime ? <Alert severity="error" sx={{ mt: 1, py: 0, fontSize: 12 }}>{tx("Open")}: {detail.open_downtime.downtime_no} · {detail.open_downtime.reason_text || EMPTY}</Alert> : null}
            </Box>
          </Paper>

          <Paper elevation={0} sx={cardSx}>
            <Head title={L("Current Production")} subtitle={sel ? `(${sel.equipment_code})` : ""} />
            <Box sx={{ px: 1.5, pb: 1.5 }}>
              {!cur ? <Typography variant="caption" color="text.secondary">{L("No machine in production.")}</Typography> : (
                <>
                  <Box sx={{ display: "grid", gridTemplateColumns: "96px 1fr", gap: 1.25, alignItems: "center", mb: 1 }}>
                    <Box sx={{ height: 80, borderRadius: 1.5, border: 1, borderColor: "divider", display: "grid", placeItems: "center", overflow: "hidden", bgcolor: "action.hover" }}>
                      {cur.mold_image || cur.product_image ? <Box component="img" src={resolveImageUrl(cur.mold_image || cur.product_image)} alt="" sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        : <ViewInArOutlinedIcon sx={{ fontSize: 40, color: "#1570EF" }} />}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" fontWeight={800} sx={{ display: "block", color: "#1570EF", cursor: "pointer" }} onClick={() => navigate(`/production-management/work-orders/execution?wo=${cur.id}`)}>{cur.wo_no} · {label("woStatus", cur.status)}</Typography>
                      <Typography variant="caption" fontWeight={700} sx={{ display: "block" }} noWrap>{cur.product_name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }} noWrap>{L("Mold")}: {cur.mold_code || EMPTY}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 1.5, rowGap: 0.3 }}>
                    {[[L("Cavity"), cur.mold_cavity ?? cur.cavity], [L("Good"), `${num(cur.good_qty)} / ${num(cur.planned_qty)} pcs`], [L("Shot counter"), cur.current_shot != null ? num(cur.current_shot) : EMPTY],
                      [L("Mold life"), cur.design_shot ? num(cur.design_shot) : EMPTY],
                      [L("Remaining life"), cur.design_shot ? `${num(Math.max(cur.design_shot - (cur.current_shot || 0), 0))} (${num(100 - (cur.mold_usage_pct || 0), 1)}%)` : EMPTY]].map(([a, b]) => [
                      <Typography key={`${a}k`} variant="caption" color="text.secondary">{a}</Typography>, <Typography key={`${a}v`} variant="caption" fontWeight={700}>{b ?? EMPTY}</Typography>])}
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">{L("Progress")}</Typography>
                    <LinearProgress variant="determinate" value={Math.min(cur.progress_pct || 0, 100)} sx={{ flex: 1, height: 7, borderRadius: 4 }} />
                    <Typography variant="caption" fontWeight={800}>{num(cur.progress_pct, 1)}%</Typography>
                  </Stack>
                </>
              )}
            </Box>
          </Paper>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1.4fr) minmax(0,1fr) minmax(0,1.4fr)" }, gap: 1.5, mb: 1.5 }}>
          <Paper elevation={0} sx={cardSx}>
            <Head title={L("OEE Trend (7 days)")} />
            <Box sx={{ px: 1, pb: 0.5 }}>
              <Chart type="bar" height={200} series={[{ name: "OEE", data: data.oee_trend.map((t) => t.oee) }]} options={{
                chart: { background: "transparent", toolbar: { show: false } }, colors: ["#2E90FA"], plotOptions: { bar: { columnWidth: "45%", borderRadius: 3, dataLabels: { position: "top" } } },
                dataLabels: { enabled: true, formatter: (v) => (v != null ? `${num(v, 1)}%` : ""), offsetY: -16, style: { fontSize: "10px", colors: [axisColor] } },
                xaxis: { categories: data.oee_trend.map((t) => t.date.slice(8, 10) + "/" + t.date.slice(5, 7)), labels: { style: { colors: axisColor, fontSize: "10px" } } },
                yaxis: { min: 0, max: 100, labels: { style: { colors: axisColor }, formatter: (v) => `${num(v, 0)}%` } }, grid, tooltip: { theme: dark ? "dark" : "light" } }} />
            </Box>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <Head title={L("Machine Utilization (Today)")} />
            <Box sx={{ px: 1, pb: 0.5 }}>
              <Chart type="radialBar" height={210} series={[utilization]} options={{
                chart: { background: "transparent" }, colors: [utilization >= 75 ? "#12B76A" : utilization >= 50 ? "#F79009" : "#F04438"],
                plotOptions: { radialBar: { startAngle: -110, endAngle: 110, hollow: { size: "62%" }, track: { background: dark ? "#263244" : "#EEF2F6" },
                  dataLabels: { name: { show: true, offsetY: 22, color: axisColor, fontSize: "12px" }, value: { offsetY: -12, fontSize: "26px", fontWeight: 800, color: dark ? "#fff" : "#101828", formatter: (v) => `${num(v, 1)}%` } } } },
                labels: [L("Utilization")] }} />
            </Box>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Quick Actions")} subtitle={sel ? `(${sel.equipment_code})` : ""} />
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0.75, px: 1.5, pb: 1.5 }}>
              {quick.map(([text, Icon, color, onClick, disabled]) => (
                <Button key={text} disabled={disabled} onClick={onClick} sx={{ flexDirection: "column", gap: 0.4, py: 0.9, border: 1, borderColor: "divider", borderRadius: 1.5, textTransform: "none",
                  fontSize: 10.5, fontWeight: 700, color: "text.primary", lineHeight: 1.2, minWidth: 0 }}><Icon sx={{ color: disabled ? "action.disabled" : color }} />{text}</Button>
              ))}
            </Box>
          </Paper>
        </Box>

        <SystemStatusBar system={data.system} />

        {dialog?.type === "downtime" && dtLookups && selectedId ? (
          <DowntimeDialog mode="report" api={DT_API} request={request} lookups={dtLookups} preset={{ equipment_id: selectedId }} actor={actor} notify={notify} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); load({ silent: true }); }} />
        ) : null}
        {dialog?.type === "alarm" ? (
          <AlarmDialog api={AL_API} request={request} alarmId={dialog.id} canEdit={canEdit} actor={actor} notify={notify} onClose={() => setDialog(null)} onChanged={() => load({ silent: true })}
            onReportDowntime={() => setDialog({ type: "downtime" })} />
        ) : null}
        {dialog?.type === "hold" && cur ? <HoldDialog wo={cur} lang={language} saving={saving} onClose={() => setDialog(null)} onSubmit={hold} /> : null}
        <Snackbar open={msg.open} autoHideDuration={5000} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}
