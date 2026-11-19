import "./locales";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import {
  Alert, Box, Button, CircularProgress, FormControl, FormControlLabel, InputLabel, LinearProgress, MenuItem, Paper, Select, Snackbar, Stack, Switch,
  Table, TableBody, TableCell, TableHead, TableRow, ThemeProvider as MuiThemeProvider, ToggleButton, ToggleButtonGroup, Typography,
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
import { KpiTile, colShares, downloadExcel, useRequest } from "../../MaterialManagement/materialUi";
import { EmptyBody, FilterToggle, QuickCard, cellsSx, chartBase, fillSx, fitGridSx, fitPageSx, panelSx, toolBtnSx } from "../../shared/onePage";
import { Dot, EMPTY, Head, cardSx, hhmm, num, pageTheme } from "../../ProductionManagement/ProductionPlanning/ui";
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

  const [data, setData] = useState(null);
  const [filter, setFilter] = useState({ type_code: "", status: "" });
  const [area, setArea] = useState("ALL");
  const [selectedId, setSelectedId] = useState(null);
  const [live, setLive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dtLookups, setDtLookups] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [sideView, setSideView] = useState("alarm");
  const [useView, setUseView] = useState("area");
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
  const tableSx = { "& .MuiTableCell-root": { fontSize: 11, px: 0.75, py: 0.5, whiteSpace: "nowrap" }, "& th": { color: "text.secondary", fontWeight: 800, bgcolor: "background.paper" } };
  const dtTotal = data.downtime_by_reason.reduce((a, [, m]) => a + m, 0);
  const util = (i) => (i.elapsed_sec ? (i.running_sec / i.elapsed_sec) * 100 : null);
  const detailUrl = (id) => `/machine-equipment/machine-detail?machine=${id}`;
  const powerColor = (s) => (s === "RUNNING" || s === "IDLE" ? "#12B76A" : s === "OFFLINE" ? "#98A2B3" : "#F04438");

  const exportCsv = () => downloadExcel("equipment-monitoring.csv", ["Equipment", "Name", "Type", "Area", "Status", "Runtime (h)", "Utilization %", "Active alarms", "Last update"],
    items.map((i) => [i.equipment_code, i.equipment_name, i.type_name, i.layout_area, i.operational_status, i.runtime_hours, util(i) != null ? Math.round(util(i) * 10) / 10 : "", i.alarms, i.last_update]));
  const fullScreen = () => (document.fullscreenElement ? document.exitFullscreen() : rootRef.current?.requestFullscreen?.());
  // list, alarms, export and print already sit on the page / toolbar, so the tiles only hold what is not on screen
  const quick = [
    [tx("Report Downtime"), ReportProblemOutlinedIcon, "#F04438", () => setDialog({ type: "downtime" }), !canEdit || !selectedId],
    [tx("Request Maintenance"), BuildOutlinedIcon, "#1570EF", () => navigate(`/maintenance-management/requests?create=1&asset_type=EQUIPMENT${selectedId ? `&asset_id=${selectedId}` : ""}`)],
    [L("Equipment Detail"), SettingsInputComponentOutlinedIcon, "#12B76A", () => navigate(detailUrl(selectedId)), !selectedId],
    [tx("Alarm History"), NotificationsOutlinedIcon, "#F79009", () => navigate(`/machine-equipment/alarm-history${selectedId ? `?machine=${selectedId}` : ""}`)],
    [L("Downtime History"), TimerOutlinedIcon, "#7A5AF8", () => navigate(`/machine-equipment/downtime-management${selectedId ? `?machine=${selectedId}` : ""}`)],
    [tx("Machine Monitoring"), ViewListOutlinedIcon, "#0E9384", () => navigate("/machine-equipment/machine-monitoring")],
  ];
  const tooltip = (i) => (
    <Box sx={{ fontSize: 11, lineHeight: 1.5 }}>
      <b>{i.equipment_code}</b> · {i.equipment_name}<br />{i.type_name} · {label("machineStatus", i.operational_status)}<br />
      {L("Util. %")}: {util(i) != null ? num(util(i), 1) : EMPTY}{i.alarms ? <><br />{L("Active Alarms")}: {i.alarms}</> : null}
    </Box>
  );
  const kpiClick = (s) => () => setFilter((f) => ({ ...f, status: f.status === s ? "" : s }));
  const base = chartBase(dark, axisColor);
  const activeFilters = Object.values(filter).filter(Boolean).length;
  const toggleSx = { px: 1, py: 0.1, textTransform: "none", fontWeight: 700, fontSize: 10.5 };
  const showArea = areas.length > 1;

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box ref={rootRef} sx={{ ...fitPageSx, bgcolor: "background.default" }}>
        <PageMeta title={`${tx("Equipment Monitoring")} | VCC Plastics`} description={L("subtitle")} />
        <PageBreadcrumb pageTitle={tx("Equipment Monitoring")} />
        <Paper elevation={0} sx={{ ...cardSx, p: 0.75, position: "relative", overflow: "hidden" }}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Button startIcon={<RefreshIcon />} onClick={() => load()} sx={toolBtnSx}>{tx("Refresh")}</Button>
            <FormControl size="small" sx={{ width: 170 }}><InputLabel>{tx("Area")}</InputLabel>
              <Select label={tx("Area")} value={area} onChange={(e) => setArea(e.target.value)}>
                <MenuItem value="ALL">{L("All Areas")} ({total})</MenuItem>{areas.map((a) => <MenuItem key={a.id ?? "none"} value={a.id}>{a.name} ({a.count})</MenuItem>)}
              </Select></FormControl>
            <FilterToggle label={tx("Filter")} open={showFilter} count={activeFilters} onClick={() => setShowFilter((v) => !v)} />
            <Button startIcon={<FileDownloadOutlinedIcon />} onClick={exportCsv} sx={toolBtnSx}>{tx("Export")}</Button>
            <Button startIcon={<PrintOutlinedIcon />} onClick={() => window.print()} sx={toolBtnSx}>{tx("Print")}</Button>
            <Button startIcon={<FullscreenOutlinedIcon />} onClick={fullScreen} sx={toolBtnSx}>{L("Full Screen")}</Button>
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">{tx("Last Update")}: {lastUpdate ? lastUpdate.toLocaleString(localeTag()) : EMPTY}</Typography>
            <FormControlLabel sx={{ mr: 0 }} control={<Switch size="small" checked={live} onChange={(e) => setLive(e.target.checked)} />} label={<Typography variant="caption" fontWeight={700}>{tx("Auto Refresh")}</Typography>} />
          </Stack>
          {showFilter ? (
            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center", mt: 0.75 }}>
              <FormControl size="small" sx={{ width: 170 }}><InputLabel shrink>{L("Equipment type")}</InputLabel>
                <Select displayEmpty notched label={L("Equipment type")} value={filter.type_code} onChange={(e) => setFilter((f) => ({ ...f, type_code: e.target.value }))}>
                  <MenuItem value="">{tx("All")}</MenuItem>{data.types.map((t) => <MenuItem key={t.code} value={t.code}>{t.name}</MenuItem>)}
                </Select></FormControl>
              <FormControl size="small" sx={{ width: 150 }}><InputLabel shrink>{tx("Status")}</InputLabel>
                <Select displayEmpty notched label={tx("Status")} value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}>
                  <MenuItem value="">{tx("All")}</MenuItem>{STATUSES.map((s) => <MenuItem key={s} value={s}>{label("machineStatus", s)}</MenuItem>)}
                </Select></FormControl>
            </Stack>
          ) : null}
          {loading ? <LinearProgress sx={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2 }} /> : null}
        </Paper>

        {/* the status tiles are the status summary (no separate status donut) */}
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

        <Box sx={{ ...fitGridSx, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" }, gridTemplateRows: { lg: "minmax(0,1fr) minmax(0,1fr) minmax(0,0.9fr)" } }}>
          <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 3" }, gridRow: { lg: "1 / 3" }, minHeight: { xs: 360, lg: 0 } }}>
            <Head title={L("Factory Layout - Equipment Status")} action={
              <Stack direction="row" spacing={1.25} sx={{ flexWrap: "wrap" }}>{STATUSES.map((s) => <Dot key={s} color={MACHINE_COLORS[s]} text={label("machineStatus", s)} />)}</Stack>} />
            <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5 }}>
              <MachineLayoutBoard image={boardArea?.image_url} items={boardItems} selectedId={selectedId} minHeight={260} renderTooltip={tooltip}
                onSelect={(i) => (i.id === selectedId ? navigate(detailUrl(i.id)) : setSelectedId(i.id))} emptyText={boardArea?.image_url ? "" : L("No layout image yet — equipment is placed on a grid.")} />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", px: 1.5, py: 0.5, textAlign: "right" }}>{L("Click equipment to select it; click again to open its detail.")}</Typography>
          </Paper>

          <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "3 / 5" }, gridRow: { lg: "1 / 3" }, minHeight: { xs: 320, lg: 0 } }}>
            <Head title={L("Equipment List")} action={<Typography variant="caption" color={sel ? "#1570EF" : "text.secondary"} fontWeight={sel ? 700 : 400}>{sel ? `${tx("Selected")}: ${sel.equipment_code}` : `${listItems.length} ${L("items")}`}</Typography>} />
            {listItems.length ? (
              <Box sx={fillSx}>
                <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(...(showArea ? [22, 13, 11, 15, 6, 9, 8, 9, 7] : [25, 15, 16, 7, 10, 9, 10, 8])) }}>
                  <TableHead><TableRow>
                    <TableCell>{tx("Equipment")}</TableCell><TableCell>{L("Type")}</TableCell>{showArea ? <TableCell>{tx("Area")}</TableCell> : null}
                    <TableCell align="center">{tx("Status")}</TableCell><TableCell align="center">{L("Power")}</TableCell><TableCell align="right">{L("Runtime (hr)")}</TableCell>
                    <TableCell align="right">{L("Util. %")}</TableCell><TableCell align="center">{tx("Alarms")}</TableCell><TableCell>{L("Last Update")}</TableCell>
                  </TableRow></TableHead>
                  <TableBody>{listItems.map((i) => (
                    <TableRow key={i.id} hover selected={i.id === selectedId} onClick={() => setSelectedId(i.id)} onDoubleClick={() => navigate(detailUrl(i.id))} sx={{ cursor: "pointer" }}>
                      <TableCell title={i.equipment_name}><Box component="span" sx={{ fontWeight: 800, color: "#1570EF" }}>{i.equipment_code}</Box> · {i.equipment_name}</TableCell>
                      <TableCell title={i.type_name}>{i.type_name}</TableCell>{showArea ? <TableCell title={i.layout_area || ""}>{i.layout_area || EMPTY}</TableCell> : null}
                      <TableCell align="center"><MachineStatusPill value={i.operational_status} /></TableCell>
                      <TableCell align="center"><PowerSettingsNewOutlinedIcon sx={{ fontSize: 14.5, color: powerColor(i.operational_status), verticalAlign: "middle" }} /></TableCell>
                      <TableCell align="right">{num(i.runtime_hours, 1)}</TableCell>
                      <TableCell align="right">{util(i) != null ? num(util(i), 1) : EMPTY}</TableCell>
                      <TableCell align="center">{i.alarms ? <PriorityPill value={i.alarm_top} /> : EMPTY}</TableCell>
                      <TableCell>{i.last_update ? hhmm(i.last_update) : EMPTY}</TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </Box>
            ) : <EmptyBody text={tx("No data.")} />}
          </Paper>

          <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "1" }, gridRow: { lg: "3" } }}>
            <Head title={L("Downtime Analysis (Today)")} action={<Typography variant="caption" sx={{ color: "#1570EF", cursor: "pointer" }} onClick={() => navigate("/machine-equipment/downtime-management")}>{minText(dtTotal)} · {L("View all")}</Typography>} />
            {data.downtime_by_reason.length ? (
              <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1 }}>
                {data.downtime_by_reason.map(([r, m], idx) => (
                  <Box key={r} sx={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr) 52px 40px", gap: 1, alignItems: "center", mb: 0.6 }}>
                    <Typography variant="caption" noWrap title={r}>{r === "UNSPECIFIED" ? tx("Unspecified") : r}</Typography>
                    <LinearProgress variant="determinate" value={dtTotal ? (m / dtTotal) * 100 : 0} sx={{ height: 8, borderRadius: 4, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: REASON_COLORS[idx % REASON_COLORS.length] } }} />
                    <Typography variant="caption" fontWeight={700} align="right">{minText(m)}</Typography>
                    <Typography variant="caption" color="text.secondary" align="right">{dtTotal ? num((m / dtTotal) * 100, 1) : 0}%</Typography>
                  </Box>
                ))}
              </Box>
            ) : <EmptyBody text={tx("No data.")} />}
          </Paper>

          <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "2" }, gridRow: { lg: "3" } }}>
            <Head title={sideView === "maint" ? L("Maintenance Due (Today)") : `${L("Active Alarms")} (${data.alarms.length})`} action={(
              <ToggleButtonGroup exclusive size="small" value={sideView} onChange={(e, v) => v && setSideView(v)}>
                <ToggleButton value="alarm" sx={toggleSx}>{tx("Alarms")} ({data.alarms.length})</ToggleButton>
                <ToggleButton value="maint" sx={toggleSx}>{tx("Maintenance")} ({data.maintenance_due.length})</ToggleButton>
              </ToggleButtonGroup>
            )} />
            {sideView === "alarm" ? (data.alarms.length ? (
              <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1 }}>
                {data.alarms.map((a) => (
                  <Stack key={a.id} direction="row" spacing={1} onClick={() => setDialog({ type: "alarm", id: a.id })}
                    sx={{ alignItems: "center", py: 0.5, borderBottom: 1, borderColor: "divider", cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}>
                    <WarningAmberOutlinedIcon sx={{ fontSize: 14.5, color: PRIORITY_COLORS[a.priority] }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" fontWeight={800} sx={{ display: "block" }} noWrap title={a.message}>{a.equipment_code} · {a.message}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{a.alarm_no} · {hhmm(a.raised_at)}</Typography>
                    </Box>
                    <PriorityPill value={a.priority} />
                  </Stack>
                ))}
              </Box>
            ) : <EmptyBody text={tx("No data.")} />) : (data.maintenance_due.length ? (
              <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1 }}>
                {data.maintenance_due.map((m) => (
                  <Typography key={`${m.kind}-${m.id}`} variant="caption" noWrap sx={{ display: "block", py: 0.4, borderBottom: 1, borderColor: "divider", cursor: "pointer", color: m.overdue ? "#F04438" : undefined }}
                    onClick={() => navigate(m.kind === "WO" ? `/maintenance-management/machine-equipment-maintenance?wo=${m.id}` : `/maintenance-management/planning?plan=${m.id}`)}>
                    <b>{m.equipment_code}</b> · {m.title} · {m.ref}</Typography>
                ))}
              </Box>
            ) : <EmptyBody text={tx("No data.")} />)}
          </Paper>

          <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "3" }, gridRow: { lg: "3" } }}>
            <Head title={useView === "trend" ? L("Run Time Trend (Today)") : L("Utilization by Area (Today)")} action={(
              <ToggleButtonGroup exclusive size="small" value={useView} onChange={(e, v) => v && setUseView(v)}>
                <ToggleButton value="area" sx={toggleSx}>{tx("Area")}</ToggleButton>
                <ToggleButton value="trend" sx={toggleSx}>{L("Hour")}</ToggleButton>
              </ToggleButtonGroup>
            )} />
            {useView === "area" ? (areas.length ? (
              <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 1 }}>
                {areas.map((a) => (
                  <Box key={a.id ?? "none"}>
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography variant="caption" fontWeight={700}>{a.name} ({a.count})</Typography>
                      <Typography variant="caption" fontWeight={800}>{num(a.utilization, 1)}%</Typography></Stack>
                    <LinearProgress variant="determinate" value={Math.min(a.utilization, 100)} sx={{ height: 8, borderRadius: 4, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: a.utilization >= 75 ? "#12B76A" : a.utilization >= 50 ? "#F79009" : "#F04438" } }} />
                  </Box>
                ))}
              </Box>
            ) : <EmptyBody text={tx("No data.")} />) : (
              <Box sx={{ flex: 1, minHeight: 0, px: 1 }}>
                <Chart type="line" height="100%" series={[{ name: L("Total runtime (h)"), data: data.runtime_hourly.map((r) => r.hours) }]} options={{
                  ...base, colors: ["#1570EF"], stroke: { width: 2, curve: "straight" }, markers: { size: 3 },
                  xaxis: { ...base.xaxis, categories: data.runtime_hourly.map((r) => r.hour) },
                  yaxis: { min: 0, tickAmount: 4, labels: { ...base.yaxis.labels, formatter: (v) => num(v, 1) } } }} />
              </Box>
            )}
          </Paper>

          <Box sx={{ gridColumn: { lg: "4" }, gridRow: { lg: "3" }, display: "flex", minHeight: 0, "& > *": { flex: 1 } }}>
            <QuickCard title={sel ? `${tx("Quick Actions")} · ${sel.equipment_code}` : tx("Quick Actions")} actions={quick} columns={3} />
          </Box>
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
