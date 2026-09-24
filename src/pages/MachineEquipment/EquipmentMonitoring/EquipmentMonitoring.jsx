import "./locales";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import {
  Alert, Box, Button, CircularProgress, FormControl, FormControlLabel, InputLabel, LinearProgress, MenuItem, Paper, Select, Snackbar, Stack, Switch,
  Table, TableBody, TableCell, TableHead, TableRow, ThemeProvider as MuiThemeProvider, Typography,
} from "@mui/material";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FullscreenOutlinedIcon from "@mui/icons-material/FullscreenOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutlineOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import PowerSettingsNewOutlinedIcon from "@mui/icons-material/PowerSettingsNewOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import SettingsInputComponentOutlinedIcon from "@mui/icons-material/SettingsInputComponentOutlined";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import WifiOffOutlinedIcon from "@mui/icons-material/WifiOffOutlined";

import { getCurrentUser } from "../../../auth/auth";
import usePagePermission from "../../../auth/usePagePermission";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import MachineLayoutBoard from "../../../components/machine/MachineLayoutBoard";
import { API_CONFIG } from "../../../config/config";
import { useTheme as useAppTheme } from "../../../context/ThemeContext";
import { KpiTile, downloadCsv, useRequest } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, btn, cardSx, hhmm, num, pageTheme } from "../../ProductionManagement/ProductionPlanning/ui";
import { SystemStatusBar } from "../../ProductionManagement/WorkOrders/WorkOrderManagement/WoParts";
import { label, localeTag, setActiveLanguage, tx } from "../machineLocales";
import { AlarmDialog, DowntimeDialog, MACHINE_COLORS, MachineStatusPill, PriorityPill, PRIORITY_COLORS, REASON_COLORS, minText } from "../machineUi";

const BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const API = `${BASE}/api/machine-monitoring`;
const DT_API = `${BASE}/api/downtime`;
const AL_API = `${BASE}/api/alarms`;
const STATUSES = ["RUNNING", "IDLE", "DOWN", "MAINTENANCE", "OFFLINE"];

const T = {
  vi: { subtitle: "Trạng thái thời gian thực của thiết bị phụ trợ: chiller, robot, máy sấy, máy nghiền, bơm, khí nén...", "Total Equipment": "Tổng số thiết bị", "of total": "trên tổng",
    "Factory Layout - Equipment Status": "Mặt bằng nhà máy - trạng thái thiết bị", "All Areas": "Tất cả khu vực", "Equipment Status Summary": "Tổng hợp trạng thái thiết bị",
    "Downtime Analysis (Today)": "Phân tích dừng máy (hôm nay)", "Total downtime": "Tổng thời gian dừng", "Active Alarms": "Cảnh báo đang hoạt động", "View all": "Xem tất cả",
    "Maintenance Due (Today)": "Bảo trì đến hạn (hôm nay)", "Equipment List": "Danh sách thiết bị", "Type": "Loại", "Power": "Nguồn", "Runtime (hr)": "Giờ chạy",
    "Util. %": "Sử dụng %", "Last Update": "Cập nhật", "Utilization by Area (Today)": "Hiệu suất sử dụng theo khu vực (hôm nay)", "Run Time Trend (Today)": "Xu hướng thời gian chạy (hôm nay)",
    "Total runtime (h)": "Tổng thời gian chạy (giờ)", "Hour": "Giờ", "Equipment Detail": "Chi tiết thiết bị", "Equipment List View": "Danh sách thiết bị", "Downtime History": "Lịch sử dừng máy",
    "Click equipment to select it; click again to open its detail.": "Bấm vào thiết bị để chọn, bấm lần nữa để mở chi tiết.", "No layout image yet — equipment is placed on a grid.": "Chưa có ảnh mặt bằng — thiết bị đang được xếp trên lưới.",
    "Full Screen": "Toàn màn hình", "Equipment type": "Loại thiết bị", "Need attention": "Cần xử lý", "items": "thiết bị", "Availability": "Khả dụng", "types": "loại" },
  ja: { subtitle: "補機（チラー・ロボット・乾燥機・粉砕機・ポンプ・エア等）のリアルタイム状態", "Total Equipment": "総設備数", "of total": "全体比", "Factory Layout - Equipment Status": "工場レイアウト - 設備状態",
    "All Areas": "全エリア", "Equipment Status Summary": "設備状態サマリー", "Downtime Analysis (Today)": "停止分析（本日）", "Total downtime": "総停止時間", "Active Alarms": "発生中アラーム",
    "View all": "すべて表示", "Maintenance Due (Today)": "本日の保全予定", "Equipment List": "設備一覧", "Type": "種別", "Power": "電源", "Runtime (hr)": "稼働時間（h）", "Util. %": "稼働率 %",
    "Last Update": "最終更新", "Utilization by Area (Today)": "エリア別稼働率（本日）", "Run Time Trend (Today)": "稼働時間推移（本日）", "Total runtime (h)": "総稼働時間（h）", "Hour": "時",
    "Equipment Detail": "設備詳細", "Equipment List View": "設備一覧", "Downtime History": "停止履歴", "Click equipment to select it; click again to open its detail.": "設備をクリックで選択、もう一度クリックで詳細。",
    "No layout image yet — equipment is placed on a grid.": "レイアウト図未設定 — グリッド表示中。", "Full Screen": "全画面", "Equipment type": "設備種別", "Need attention": "要対応", "items": "台",
    "Availability": "可用率", "types": "種別" },
};
const tt = (k, lang) => T[String(lang).split("-")[0]]?.[k] || (k === "subtitle" ? "Real-time status of auxiliary equipment: chillers, robots, dryers, crushers, pumps, compressors..." : tx(k));

export default function EquipmentMonitoring() {
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
  const listRef = useRef(null);

  const [data, setData] = useState(null);
  const [filter, setFilter] = useState({ type_code: "", status: "" });
  const [area, setArea] = useState("ALL");
  const [selectedId, setSelectedId] = useState(null);
  const [live, setLive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dtLookups, setDtLookups] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [msg, setMsg] = useState({ open: false, type: "success", text: "" });
  const notify = useCallback((type, text) => setMsg({ open: true, type, text }), []);

  useEffect(() => { request(`${DT_API}/lookups`).then(setDtLookups).catch(() => {}); }, [request]);
  const load = useCallback(async ({ silent } = {}) => {
    if (!silent) setLoading(true);
    const q = new URLSearchParams({ category: "AUX", ...(filter.type_code ? { type_code: filter.type_code } : {}), ...(filter.status ? { status: filter.status } : {}) });
    try {
      const d = await request(`${API}/overview?${q}`);
      setData(d); setLastUpdate(new Date());
      setSelectedId((id) => (id && d.items.some((i) => i.id === id) ? id : d.items[0]?.id || null));
    } catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [filter, request, notify]);
  useEffect(() => { load(); }, [load]);
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
  const axisColor = dark ? "#A7B0C0" : "#667085";
  const grid = { borderColor: dark ? "#263244" : "#EEF2F6" };
  const toolBtnSx = { ...btn("cancel"), bgcolor: "background.paper", border: 1, borderColor: "divider" };
  const tableSx = { "& td, & th": { fontSize: 11.5, px: 0.75, py: 0.5, whiteSpace: "nowrap" }, "& th": { color: "text.secondary", fontWeight: 800, bgcolor: "background.paper" } };
  const statusCounts = STATUSES.map((s) => [s, k[s.toLowerCase()] || 0]);
  const dtTotal = data.downtime_by_reason.reduce((a, [, m]) => a + m, 0);
  const util = (i) => (i.elapsed_sec ? (i.running_sec / i.elapsed_sec) * 100 : null);
  const detailUrl = (id) => `/machine-equipment/machine-detail?machine=${id}`;
  const powerColor = (s) => (s === "RUNNING" || s === "IDLE" ? "#12B76A" : s === "OFFLINE" ? "#98A2B3" : "#F04438");

  const exportCsv = () => downloadCsv("equipment-monitoring.csv", ["Equipment", "Name", "Type", "Area", "Status", "Runtime (h)", "Utilization %", "Active alarms", "Last update"],
    items.map((i) => [i.equipment_code, i.equipment_name, i.type_name, i.layout_area, i.operational_status, i.runtime_hours, util(i) != null ? Math.round(util(i) * 10) / 10 : "", i.alarms, i.last_update]));
  const fullScreen = () => (document.fullscreenElement ? document.exitFullscreen() : rootRef.current?.requestFullscreen?.());
  const quick = [
    [tx("Report Downtime"), ReportProblemOutlinedIcon, "#F04438", () => setDialog({ type: "downtime" }), !canEdit || !selectedId],
    [tx("Request Maintenance"), BuildOutlinedIcon, "#1570EF", () => navigate(`/maintenance-management/requests?create=1&asset_type=EQUIPMENT${selectedId ? `&asset_id=${selectedId}` : ""}`), false],
    [L("Equipment Detail"), SettingsInputComponentOutlinedIcon, "#12B76A", () => navigate(detailUrl(selectedId)), !selectedId],
    [L("Equipment List View"), ViewListOutlinedIcon, "#1570EF", () => listRef.current?.scrollIntoView({ behavior: "smooth" }), false],
    [tx("Alarm History"), NotificationsOutlinedIcon, "#F79009", () => navigate(`/machine-equipment/alarm-history${selectedId ? `?machine=${selectedId}` : ""}`), false],
    [L("Downtime History"), TimerOutlinedIcon, "#7A5AF8", () => navigate(`/machine-equipment/downtime-management${selectedId ? `?machine=${selectedId}` : ""}`), false],
    [tx("Export"), FileDownloadOutlinedIcon, "#12B76A", exportCsv, false],
    [tx("Print"), PrintOutlinedIcon, "#475467", () => window.print(), false],
  ];
  const tooltip = (i) => (
    <Box sx={{ fontSize: 11.5, lineHeight: 1.5 }}>
      <b>{i.equipment_code}</b> · {i.equipment_name}<br />{i.type_name} · {label("machineStatus", i.operational_status)}<br />
      {L("Util. %")}: {util(i) != null ? num(util(i), 1) : EMPTY}{i.alarms ? <><br />{L("Active Alarms")}: {i.alarms}</> : null}
    </Box>
  );
  const kpiClick = (s) => () => setFilter((f) => ({ ...f, status: f.status === s ? "" : s }));

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box ref={rootRef} sx={{ bgcolor: "background.default", overflow: "auto" }}>
        <PageMeta title={`${tx("Equipment Monitoring")} | VCC Plastics`} description={L("subtitle")} />
        <PageBreadcrumb pageTitle={tx("Equipment Monitoring")} />
        <Paper elevation={0} sx={{ ...cardSx, p: 1, mb: 1.5 }}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <FormControl size="small" sx={{ minWidth: 170 }}><InputLabel>{tx("Area")}</InputLabel>
              <Select label={tx("Area")} value={area} onChange={(e) => setArea(e.target.value)}>
                <MenuItem value="ALL">{L("All Areas")}</MenuItem>{areas.map((a) => <MenuItem key={a.id ?? "none"} value={a.id}>{a.name}</MenuItem>)}
              </Select></FormControl>
            <FormControl size="small" sx={{ minWidth: 170 }}><InputLabel shrink>{L("Equipment type")}</InputLabel>
              <Select displayEmpty notched label={L("Equipment type")} value={filter.type_code} onChange={(e) => setFilter((f) => ({ ...f, type_code: e.target.value }))}>
                <MenuItem value="">{tx("All")}</MenuItem>{data.types.map((t) => <MenuItem key={t.code} value={t.code}>{t.name}</MenuItem>)}
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
          <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(4, minmax(0,1fr))", xl: "repeat(8, minmax(0,1fr))" }}>
            <KpiTile tone="primary" title={L("Total Equipment")} value={num(total)} sub={`${data.types.length} ${L("types")} · ${areas.length} ${tx("Area").toLowerCase()}`} icon={SettingsInputComponentOutlinedIcon} />
            <KpiTile tone="success" title={label("machineStatus", "RUNNING")} value={num(k.running)} sub={pct(k.running)} icon={PlayCircleOutlineIcon} onClick={kpiClick("RUNNING")} />
            <KpiTile tone="warning" title={label("machineStatus", "IDLE")} value={num(k.idle)} sub={pct(k.idle)} icon={PauseCircleOutlineIcon} onClick={kpiClick("IDLE")} />
            <KpiTile tone="danger" title={label("machineStatus", "DOWN")} value={num(k.down)} sub={pct(k.down)} icon={StopCircleOutlinedIcon} onClick={kpiClick("DOWN")} />
            <KpiTile tone="info" title={label("machineStatus", "MAINTENANCE")} value={num(k.maintenance)} sub={pct(k.maintenance)} icon={BuildCircleOutlinedIcon} onClick={kpiClick("MAINTENANCE")} />
            <KpiTile tone="primary" title={label("machineStatus", "OFFLINE")} value={num(k.offline)} sub={pct(k.offline)} icon={WifiOffOutlinedIcon} onClick={kpiClick("OFFLINE")} />
            <KpiTile tone="accent" title={L("Availability")} value={k.availability != null ? num(k.availability, 1) : EMPTY} unit={k.availability != null ? "%" : ""} sub="" icon={ScheduleOutlinedIcon} />
            <KpiTile tone="danger" title={L("Active Alarms")} value={num(k.active_alarms)} sub={k.active_alarms ? L("Need attention") : ""} icon={WarningAmberOutlinedIcon} onClick={() => navigate("/machine-equipment/alarm-history")} />
          </KpiCardGroup>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,2.2fr) minmax(0,1fr) minmax(0,1fr)" }, gap: 1.5, mb: 1.5 }}>
          <Paper elevation={0} sx={cardSx}>
            <Head title={L("Factory Layout - Equipment Status")} action={
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
                  onSelect={(i) => (i.id === selectedId ? navigate(detailUrl(i.id)) : setSelectedId(i.id))} emptyText={boardArea?.image_url ? "" : L("No layout image yet — equipment is placed on a grid.")} />
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, textAlign: "right" }}>{L("Click equipment to select it; click again to open its detail.")}</Typography>
              </Box>
            </Box>
          </Paper>

          <Stack spacing={1.5}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={L("Equipment Status Summary")} />
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
              <Head title={`${L("Active Alarms")} (${data.alarms.length})`} action={<Button size="small" onClick={() => navigate("/machine-equipment/alarm-history")} sx={{ textTransform: "none", fontSize: 12 }}>{L("View all")}</Button>} />
              <Box sx={{ px: 1.5, pb: 1.5, maxHeight: 250, overflow: "auto" }}>
                {!data.alarms.length ? <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography> : data.alarms.map((a) => (
                  <Stack key={a.id} direction="row" spacing={1} onClick={() => setDialog({ type: "alarm", id: a.id })}
                    sx={{ alignItems: "center", py: 0.6, borderBottom: 1, borderColor: "divider", cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}>
                    <WarningAmberOutlinedIcon sx={{ fontSize: 18, color: PRIORITY_COLORS[a.priority] }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" fontWeight={800} sx={{ display: "block" }} noWrap>{a.equipment_code} · {a.message}</Typography>
                      <Typography variant="caption" color="text.secondary">{a.alarm_no} · {hhmm(a.raised_at)}</Typography>
                    </Box>
                    <PriorityPill value={a.priority} />
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

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,2.2fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)" }, gap: 1.5, mb: 1.5 }}>
          <Paper elevation={0} sx={cardSx} ref={listRef}>
            <Head title={L("Equipment List")} subtitle={`(${listItems.length} ${L("items")})`} />
            <Box sx={{ px: 1, pb: 1, height: 300, overflow: "auto" }}>
              <Table size="small" stickyHeader sx={tableSx}>
                <TableHead><TableRow>
                  <TableCell>{tx("Equipment")}</TableCell><TableCell>{L("Type")}</TableCell>{areas.length > 1 ? <TableCell>{tx("Area")}</TableCell> : null}
                  <TableCell align="center">{tx("Status")}</TableCell><TableCell align="center">{L("Power")}</TableCell><TableCell align="right">{L("Runtime (hr)")}</TableCell>
                  <TableCell align="right">{L("Util. %")}</TableCell><TableCell align="center">{tx("Alarms")}</TableCell><TableCell>{L("Last Update")}</TableCell>
                </TableRow></TableHead>
                <TableBody>{listItems.map((i) => (
                  <TableRow key={i.id} hover selected={i.id === selectedId} onClick={() => setSelectedId(i.id)} onDoubleClick={() => navigate(detailUrl(i.id))} sx={{ cursor: "pointer" }}>
                    <TableCell><Box component="span" sx={{ fontWeight: 800, color: "#1570EF" }}>{i.equipment_code}</Box><Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 10.5 }}>{i.equipment_name}</Typography></TableCell>
                    <TableCell>{i.type_name}</TableCell>{areas.length > 1 ? <TableCell>{i.layout_area || EMPTY}</TableCell> : null}
                    <TableCell align="center"><MachineStatusPill value={i.operational_status} /></TableCell>
                    <TableCell align="center"><PowerSettingsNewOutlinedIcon sx={{ fontSize: 18, color: powerColor(i.operational_status) }} /></TableCell>
                    <TableCell align="right">{num(i.runtime_hours, 1)}</TableCell>
                    <TableCell align="right">{util(i) != null ? num(util(i), 1) : EMPTY}</TableCell>
                    <TableCell align="center">{i.alarms ? <PriorityPill value={i.alarm_top} /> : EMPTY}</TableCell>
                    <TableCell>{i.last_update ? hhmm(i.last_update) : EMPTY}</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </Box>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <Head title={L("Utilization by Area (Today)")} />
            <Box sx={{ px: 1.5, pb: 1.5 }}>
              {!areas.length ? <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography> : areas.map((a) => (
                <Box key={a.id ?? "none"} sx={{ mb: 1.25 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography variant="caption" fontWeight={700}>{a.name} ({a.count})</Typography>
                    <Typography variant="caption" fontWeight={800}>{num(a.utilization, 1)}%</Typography></Stack>
                  <LinearProgress variant="determinate" value={Math.min(a.utilization, 100)} sx={{ height: 8, borderRadius: 4, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: a.utilization >= 75 ? "#12B76A" : a.utilization >= 50 ? "#F79009" : "#F04438" } }} />
                </Box>
              ))}
            </Box>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <Head title={L("Run Time Trend (Today)")} />
            <Box sx={{ px: 1, pb: 0.5 }}>
              <Chart type="line" height={260} series={[{ name: L("Total runtime (h)"), data: data.runtime_hourly.map((r) => r.hours) }]} options={{
                chart: { background: "transparent", toolbar: { show: false } }, colors: ["#1570EF"], stroke: { width: 2.5, curve: "straight" }, markers: { size: 3 },
                xaxis: { categories: data.runtime_hourly.map((r) => r.hour), title: { text: L("Hour"), style: { color: axisColor, fontSize: "11px" } }, labels: { style: { colors: axisColor, fontSize: "10px" } } },
                yaxis: { min: 0, labels: { style: { colors: axisColor }, formatter: (v) => num(v, 1) } }, legend: { show: true, position: "top", labels: { colors: axisColor } }, grid, tooltip: { theme: dark ? "dark" : "light" } }} />
            </Box>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Quick Actions")} subtitle={sel ? `(${sel.equipment_code})` : ""} />
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 0.75, px: 1.5, pb: 1.5 }}>
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
        <Snackbar open={msg.open} autoHideDuration={5000} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}
