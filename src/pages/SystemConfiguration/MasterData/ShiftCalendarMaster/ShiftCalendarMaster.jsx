import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, Divider, FormControl, IconButton, InputAdornment,
  InputLabel, MenuItem, Paper, Select, Snackbar, Stack, Tab,
  Tabs, TextField, ThemeProvider as MuiThemeProvider, Tooltip, Typography, createTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircle";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircle";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

import { getAccessToken, getCurrentUser } from "../../../../auth/auth";
import usePagePermission from "../../../../auth/usePagePermission";
import { buttonSystem } from "../../../../components/button/ButtonSystem";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import PageMeta from "../../../../components/common/PageMeta";
import { KpiCard, KpiCardGroup } from "../../../../components/kpi/KpiCardSystem";
import AgGridTable from "../../../../components/tables/BasicTables/BasicTableOne";
import { API_CONFIG } from "../../../../config/config";
import { useTheme as useAppTheme } from "../../../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { calendarLocaleTag, dayTypeText, setActiveLanguage, statusText, tx } from "./locales";

const BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const API = `${BASE}/api/shift-calendar-master`;
const FACTORY_API = `${BASE}/api/factory-structure`;
const EMPTY = "—";
const STATUSES = ["ACTIVE", "INACTIVE"];
const DAY_TYPES = ["HOLIDAY", "SPECIAL_DAY", "COMPANY_EVENT", "FACTORY_SHUTDOWN", "OVERTIME"];
const DAY_TYPE_COLORS = { HOLIDAY: "#F04438", SPECIAL_DAY: "#7A5AF8", COMPANY_EVENT: "#7A5AF8", FACTORY_SHUTDOWN: "#667085", OVERTIME: "#F79009" };
const cardSx = { border: "1px solid", borderColor: "divider", borderRadius: 2, boxShadow: "0 1px 3px rgba(15,23,42,.06)", overflow: "hidden" };

function btn(type, extra = {}) {
  const s = buttonSystem[type] || buttonSystem.edit || { base: {} };
  return { ...(s.base || {}), ...(s.hover ? { "&:hover": s.hover } : {}), ...(s.active ? { "&:active": s.active } : {}), ...extra };
}

function pageTheme(mode) {
  const dark = mode === "dark";
  return createTheme({
    palette: {
      mode,
      primary: { main: "#005BAB" },
      background: { default: dark ? "#0B1220" : "#F8FAFC", paper: dark ? "#111827" : "#FFF" },
      text: { primary: dark ? "#F3F4F6" : "#172033", secondary: dark ? "#A7B0C0" : "#667085" },
      divider: dark ? "#344054" : "#D0D5DD",
    },
    typography: { fontFamily: '"Bai Jamjuree", Inter, sans-serif' },
    components: {
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: dark ? "#0F172A" : "#FFFFFF",
            "& .MuiOutlinedInput-notchedOutline": {
              borderWidth: "1px !important", borderStyle: "solid !important",
              borderColor: `${dark ? "#3B4759" : "#CBD3DF"} !important`,
            },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: `${dark ? "#5B6B84" : "#98A2B3"} !important` },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderWidth: "2px !important", borderColor: "#005BAB !important" },
            "&.Mui-error .MuiOutlinedInput-notchedOutline": { borderColor: "#EE1B1B !important" },
          },
        },
      },
    },
  });
}

function DialogHeader({ icon, title, subtitle, onClose, disabled, tone = "primary" }) {
  const toneColor = tone === "danger" ? "#EE1B1B" : "#005BAB";
  return (
    <Box sx={{ px: 3, pt: 2.5, pb: 2, display: "flex", alignItems: "center", gap: 1.5, borderBottom: 1, borderColor: "divider",
      bgcolor: (theme) => theme.palette.mode === "dark" ? (tone === "danger" ? "rgba(238,27,27,0.10)" : "rgba(0,91,171,0.14)") : (tone === "danger" ? "#FFF3F3" : "#F1F7FF") }}>
      <Box sx={{ width: 44, height: 44, borderRadius: "50%",
        bgcolor: (theme) => theme.palette.mode === "dark" ? (tone === "danger" ? "#4C1D1D" : "#173A63") : (tone === "danger" ? "#FDECEC" : "#EEF4FF"),
        color: toneColor, display: "grid", placeItems: "center", flexShrink: 0 }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" fontWeight={700} noWrap>{title}</Typography>
        {subtitle ? <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{subtitle}</Typography> : null}
      </Box>
      <IconButton size="small" disabled={disabled} onClick={onClose} sx={{ mr: -0.5 }}><CloseIcon fontSize="small" /></IconButton>
    </Box>
  );
}

const dialogPaperSx = { borderRadius: 3, overflow: "hidden", boxShadow: (theme) => theme.palette.mode === "dark" ? "0 24px 60px rgba(0,0,0,.55)" : "0 24px 60px rgba(15,23,42,.18)" };

function Head({ icon, title, action }) {
  return (
    <Box sx={{ minHeight: 34, px: 1.25, bgcolor: (t) => t.palette.mode === "dark" ? "#182235" : "#EAF2FF", borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Stack direction="row" spacing={0.7} alignItems="center">{icon}<Typography variant="subtitle2" fontWeight={800}>{title}</Typography></Stack>
      {action}
    </Box>
  );
}

const STATUS_TONES = { ACTIVE: "success", INACTIVE: "default" };
function StatusChip({ value }) {
  return <Chip size="small" variant="outlined" color={STATUS_TONES[value] || "default"} label={statusText(value)} sx={{ height: 21, fontSize: 10, fontWeight: 800 }} />;
}

function normalNode(n) { return { ...n, id: Number(n.id), parentId: n.parent_id == null ? null : Number(n.parent_id) }; }
function pathOf(id, nodes) {
  if (id == null) return tx("All Areas");
  const names = [], seen = new Set();
  let n = nodes.find((x) => x.id === Number(id));
  while (n && !seen.has(n.id)) { seen.add(n.id); names.unshift(n.name); n = nodes.find((x) => x.id === n.parentId); }
  return names.join(" / ") || EMPTY;
}

function computeWorkingHoursPreview(start, end, breakMinutes) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((v) => Number.isNaN(v))) return null;
  const startMin = sh * 60 + sm, endMin = eh * 60 + em;
  const overnight = endMin <= startMin;
  const total = overnight ? endMin + 1440 - startMin : endMin - startMin;
  const working = total - Number(breakMinutes || 0);
  return { hours: Math.round((working / 60) * 100) / 100, overnight };
}

function MonthCalendar({ days, month, onMonthChange, onDayClick, localeTag }) {
  const year = month.getFullYear(), monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday-first grid
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  const byDate = useMemo(() => {
    const map = {};
    days.forEach((d) => {
      const key = String(d.calendar_date).slice(0, 10);
      (map[key] = map[key] || []).push(d);
    });
    return map;
  }, [days]);
  const monthLabel = month.toLocaleDateString(localeTag, { month: "long", year: "numeric" });
  return (
    <Box sx={{ p: 1 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <IconButton size="small" onClick={() => onMonthChange(new Date(year, monthIndex - 1, 1))}><ChevronLeftIcon fontSize="small" /></IconButton>
        <Typography variant="caption" fontWeight={800}>{monthLabel}</Typography>
        <IconButton size="small" onClick={() => onMonthChange(new Date(year, monthIndex + 1, 1))}><ChevronRightIcon fontSize="small" /></IconButton>
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 0.4 }}>
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <Typography key={d} variant="caption" align="center" color="text.secondary" fontWeight={700}>{d}</Typography>
        ))}
        {cells.map((d, idx) => {
          if (!d) return <Box key={idx} />;
          const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const entries = byDate[key] || [];
          return (
            <Box key={idx} onClick={() => onDayClick(key)}
              sx={{ height: 34, borderRadius: 1, border: 1, borderColor: "divider", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", "&:hover": { bgcolor: "action.hover" } }}>
              <Typography variant="caption" fontWeight={600}>{d}</Typography>
              <Stack direction="row" spacing={0.3}>
                {entries.slice(0, 3).map((e) => (
                  <Box key={e.id} sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: DAY_TYPE_COLORS[e.day_type] || "#98A2B3" }} />
                ))}
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function ShiftForm({ item, areas, actor, saving, onClose, onSave }) {
  const [tab, setTab] = useState(0);
  const [f, setF] = useState(item ? {
    code: item.shift_code, name: item.shift_name, type: item.shift_type || "", start: item.start_time, end: item.end_time,
    breakMin: item.break_minutes, areaId: item.applicable_area_id ?? "", effectiveDate: String(item.effective_date).slice(0, 10),
    overtimeAllowed: Boolean(item.overtime_allowed), allowOverlap: Boolean(item.allow_overlap), color: item.color_code || "",
    description: item.description || "", status: item.status, version: item.version,
  } : {
    code: "", name: "", type: "", start: "06:00", end: "14:00", breakMin: 0, areaId: "",
    effectiveDate: new Date().toISOString().slice(0, 10), overtimeAllowed: false, allowOverlap: false,
    color: "#2563EB", description: "", status: "ACTIVE", version: 1,
  });
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const preview = computeWorkingHoursPreview(f.start, f.end, f.breakMin);
  const submit = () => onSave({
    shift_code: f.code.trim().toUpperCase(), shift_name: f.name.trim(), shift_type: f.type.trim() || null,
    start_time: f.start, end_time: f.end, break_minutes: Number(f.breakMin || 0),
    applicable_area_id: f.areaId === "" ? null : Number(f.areaId), effective_date: f.effectiveDate,
    overtime_allowed: f.overtimeAllowed, allow_overlap: f.allowOverlap, color_code: f.color.trim() || null,
    description: f.description.trim() || null, status: f.status,
    ...(item ? { version: Number(f.version), updated_by: actor } : { created_by: actor }),
  });
  return (
    <Dialog open fullWidth maxWidth="md" onClose={saving ? undefined : onClose} PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<CalendarMonthOutlinedIcon />} title={tx(item ? "Edit Shift" : "Add New Shift Dialog")} disabled={saving} onClose={onClose} />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tab label={tx("General")} /><Tab label={tx("Break Time Tab")} /><Tab label={tx("Applicable Area Tab")} />
      </Tabs>
      <DialogContent sx={{ minHeight: 340 }}>
        {tab === 0 && (
          <Stack spacing={1.7} sx={{ pt: 1 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <TextField fullWidth required size="small" disabled={Boolean(item)} label={tx("Shift Code")} value={f.code} onChange={ch("code")} />
              <TextField fullWidth required size="small" label={tx("Shift Name")} value={f.name} onChange={ch("name")} />
              <TextField fullWidth size="small" label={tx("Shift Type")} value={f.type} onChange={ch("type")} />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <TextField fullWidth required size="small" type="time" label={tx("Start Time")} value={f.start} onChange={ch("start")} InputLabelProps={{ shrink: true }} />
              <TextField fullWidth required size="small" type="time" label={tx("End Time")} value={f.end} onChange={ch("end")} InputLabelProps={{ shrink: true }} />
              <TextField fullWidth required size="small" type="date" label={tx("Effective Date")} value={f.effectiveDate} onChange={ch("effectiveDate")} InputLabelProps={{ shrink: true }} />
            </Stack>
            <FormControl fullWidth size="small">
              <InputLabel>{tx("Status")}</InputLabel>
              <Select label={tx("Status")} value={f.status} onChange={ch("status")}>
                {STATUSES.map((s) => <MenuItem key={s} value={s}>{statusText(s)}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth multiline minRows={2} label={tx("Description")} value={f.description} onChange={ch("description")} />
          </Stack>
        )}
        {tab === 1 && (
          <Stack spacing={1.7} sx={{ pt: 1 }}>
            <TextField fullWidth size="small" type="number" label={tx("Break Time")} value={f.breakMin} onChange={ch("breakMin")} />
            {preview && (
              <Alert severity="info">
                {tx("Working Hours")}: <b>{preview.hours}</b> {preview.overnight ? `(${tx("Overnight Shift")})` : ""}
              </Alert>
            )}
            <FormControlLabelSwitch label={tx("Overtime Allowed")} checked={f.overtimeAllowed} onChange={(v) => setF((o) => ({ ...o, overtimeAllowed: v }))} />
            <FormControlLabelSwitch label={tx("Allow Overlap")} checked={f.allowOverlap} onChange={(v) => setF((o) => ({ ...o, allowOverlap: v }))} />
          </Stack>
        )}
        {tab === 2 && (
          <Stack spacing={1.7} sx={{ pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{tx("Applicable Area")}</InputLabel>
              <Select label={tx("Applicable Area")} value={f.areaId} onChange={ch("areaId")}>
                <MenuItem value="">{tx("All Areas")}</MenuItem>
                {areas.map((a) => <MenuItem key={a.id} value={a.id}>{pathOf(a.id, areas)}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth size="small" label={tx("Color")} type="color" value={f.color} onChange={ch("color")} sx={{ maxWidth: 120 }} />
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Cancel")}</Button>
        <Button onClick={submit} disabled={saving || !f.code.trim() || !f.name.trim() || !f.start || !f.end} sx={btn("primary")} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
          {tx("Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function FormControlLabelSwitch({ label, checked, onChange }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box component="input" type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} sx={{ width: 16, height: 16 }} />
      <Typography variant="body2">{label}</Typography>
    </Stack>
  );
}

function CopyShiftDialog({ saving, onClose, onConfirm }) {
  const [code, setCode] = useState("");
  return (
    <Dialog open fullWidth maxWidth="xs" onClose={saving ? undefined : onClose} PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<ContentCopyOutlinedIcon />} title={tx("Copy Shift")} disabled={saving} onClose={onClose} />
      <DialogContent>
        <TextField fullWidth required size="small" sx={{ mt: 1 }} label={tx("New Shift Code")} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Cancel")}</Button>
        <Button onClick={() => onConfirm(code)} disabled={saving || !code.trim()} sx={btn("primary")}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

function CalendarDayForm({ item, defaultDate, defaultType, areas, actor, saving, onClose, onSave }) {
  const [f, setF] = useState(item ? {
    date: String(item.calendar_date).slice(0, 10), dayType: item.day_type, name: item.name,
    areaId: item.applicable_area_id ?? "", description: item.description || "", status: item.status, version: item.version,
  } : {
    date: defaultDate || new Date().toISOString().slice(0, 10), dayType: defaultType || "HOLIDAY", name: "",
    areaId: "", description: "", status: "ACTIVE", version: 1,
  });
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const submit = () => onSave({
    calendar_date: f.date, day_type: f.dayType, name: f.name.trim(),
    applicable_area_id: f.areaId === "" ? null : Number(f.areaId), description: f.description.trim() || null, status: f.status,
    ...(item ? { version: Number(f.version), updated_by: actor } : { created_by: actor }),
  });
  return (
    <Dialog open fullWidth maxWidth="sm" onClose={saving ? undefined : onClose} PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<EventBusyOutlinedIcon />} title={tx("Add Calendar Day")} disabled={saving} onClose={onClose} />
      <DialogContent>
        <Stack spacing={1.7} sx={{ pt: 1 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField fullWidth required size="small" type="date" label={tx("Date")} value={f.date} onChange={ch("date")} InputLabelProps={{ shrink: true }} />
            <FormControl fullWidth size="small">
              <InputLabel>{tx("Day Type")}</InputLabel>
              <Select label={tx("Day Type")} value={f.dayType} onChange={ch("dayType")}>
                {DAY_TYPES.map((t) => <MenuItem key={t} value={t}>{dayTypeText(t)}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
          <TextField fullWidth required size="small" label={tx("Name")} value={f.name} onChange={ch("name")} />
          <FormControl fullWidth size="small">
            <InputLabel>{tx("Applicable Area")}</InputLabel>
            <Select label={tx("Applicable Area")} value={f.areaId} onChange={ch("areaId")}>
              <MenuItem value="">{tx("All Areas")}</MenuItem>
              {areas.map((a) => <MenuItem key={a.id} value={a.id}>{pathOf(a.id, areas)}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth multiline minRows={2} label={tx("Description")} value={f.description} onChange={ch("description")} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Cancel")}</Button>
        <Button onClick={submit} disabled={saving || !f.name.trim() || !f.date} sx={btn("primary")}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ShiftCalendarMaster() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  const { theme } = useAppTheme();
  const muiTheme = useMemo(() => pageTheme(theme), [theme]);
  const { canEdit } = usePagePermission();
  const actor = getCurrentUser()?.employee_code || "SYSTEM";

  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ total_shifts: 0, active_shifts: 0, working_days_this_month: 0, holidays_this_month: 0, special_days_this_month: 0 });
  const [areas, setAreas] = useState([]);
  const [calendarDays, setCalendarDays] = useState([]);
  const [month, setMonth] = useState(() => new Date());
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [tab, setTab] = useState(0);
  const [dialog, setDialog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ open: false, type: "success", text: "" });

  const notify = useCallback((type, text) => setMsg({ open: true, type, text }), []);
  const request = useCallback(async (url, options = {}) => {
    const token = getAccessToken();
    const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const detailMsg = Array.isArray(data?.detail) ? data.detail.map((d) => d.msg).join("; ") : data?.detail;
      const error = new Error(response.status === 409 ? (detailMsg || tx("This record was changed by someone else. Please reload and try again.")) : detailMsg || data?.message || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return data;
  }, []);

  const loadCalendar = useCallback(async () => {
    try {
      const data = await request(`${API}/calendar-days?year=${month.getFullYear()}&month=${month.getMonth() + 1}`);
      setCalendarDays(data || []);
    } catch (e) { notify("error", e.message); }
  }, [month, request, notify]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statData, listData, areaData] = await Promise.all([
        request(`${API}/statistics`),
        request(`${API}/shifts?page=1&page_size=500`),
        request(`${FACTORY_API}/nodes`),
      ]);
      const list = listData?.items || [];
      const areaList = (Array.isArray(areaData) ? areaData : areaData?.items || []).map(normalNode);
      setStats(statData); setRows(list); setAreas(areaList);
      setSelectedId((old) => (list.some((x) => x.id === old) ? old : list[0]?.id ?? null));
    } catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [notify, request]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCalendar(); }, [loadCalendar]);

  const loadDetail = useCallback(async (id) => {
    if (!id) { setDetail(null); return; }
    try { setDetail(await request(`${API}/shifts/${id}`)); } catch (e) { notify("error", e.message); }
  }, [request, notify]);
  useEffect(() => { loadDetail(selectedId); setTab(0); }, [selectedId, loadDetail]);

  const [auditLog, setAuditLog] = useState([]);
  useEffect(() => {
    if (!selectedId || tab !== 3) return;
    request(`${API}/shifts/${selectedId}/audit-log`).then(setAuditLog).catch((e) => notify("error", e.message));
  }, [selectedId, tab, request, notify]);

  const shiftTypes = useMemo(() => [...new Set(rows.map((r) => r.shift_type).filter(Boolean))].sort(), [rows]);
  const filtered = useMemo(() => {
    const q = keyword.toLowerCase().trim();
    return rows.filter((r) => {
      if (q && !`${r.shift_code} ${r.shift_name}`.toLowerCase().includes(q)) return false;
      if (typeFilter !== "all" && r.shift_type !== typeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (areaFilter !== "all" && Number(r.applicable_area_id) !== Number(areaFilter)) return false;
      return true;
    });
  }, [rows, keyword, typeFilter, statusFilter, areaFilter]);

  const percent = (n) => (stats.total_shifts ? `${((n / stats.total_shifts) * 100).toFixed(1)}% ${tx("of total")}` : `0% ${tx("of total")}`);
  const reloadAll = useCallback(async () => { await load(); await loadCalendar(); await loadDetail(selectedId); }, [load, loadCalendar, loadDetail, selectedId]);

  const saveShift = async (payload) => {
    setSaving(true);
    try {
      const item = dialog?.item;
      const result = await request(item ? `${API}/shifts/${item.id}` : `${API}/shifts`, { method: item ? "PUT" : "POST", body: JSON.stringify(payload) });
      setDialog(null); await reloadAll(); if (result.id) setSelectedId(result.id);
      notify("success", tx("Shift saved."));
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const toggleStatus = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const next = detail.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await request(`${API}/shifts/${detail.id}/status`, { method: "PATCH", body: JSON.stringify({ status: next, version: detail.version, updated_by: actor }) });
      await reloadAll(); notify("success", tx("Status updated."));
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const copyShift = async (newCode) => {
    setSaving(true);
    try {
      const result = await request(`${API}/shifts/${detail.id}/copy`, { method: "POST", body: JSON.stringify({ new_shift_code: newCode, created_by: actor }) });
      setDialog(null); await load(); setSelectedId(result.id); notify("success", tx("Shift copied."));
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const deleteShift = async () => {
    if (!detail || !window.confirm(tx("Are you sure you want to delete this item?"))) return;
    setSaving(true);
    try { await request(`${API}/shifts/${detail.id}`, { method: "DELETE" }); setSelectedId(null); await load(); notify("success", "Deleted."); }
    catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const saveCalendarDay = async (payload) => {
    setSaving(true);
    try {
      const item = dialog?.item;
      await request(item ? `${API}/calendar-days/${item.id}` : `${API}/calendar-days`, { method: item ? "PUT" : "POST", body: JSON.stringify(payload) });
      setDialog(null); await reloadAll(); notify("success", tx("Calendar day saved."));
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const deleteCalendarDay = async (item) => {
    if (!window.confirm(tx("Are you sure you want to delete this item?"))) return;
    try { await request(`${API}/calendar-days/${item.id}`, { method: "DELETE" }); await reloadAll(); notify("success", "Deleted."); }
    catch (e) { notify("error", e.message); }
  };

  const cols = useMemo(() => [
    { headerName: tx("Shift Code"), field: "shift_code", width: 110, pinned: "left" },
    { headerName: tx("Shift Name"), field: "shift_name", minWidth: 170, flex: 1.1 },
    { headerName: tx("Shift Type"), field: "shift_type", width: 120, valueFormatter: (p) => p.value || EMPTY },
    { headerName: tx("Start Time"), field: "start_time", width: 100 },
    { headerName: tx("End Time"), field: "end_time", width: 100 },
    { headerName: tx("Working Hours"), field: "working_hours", width: 110 },
    { headerName: tx("Applicable Area"), minWidth: 150, valueGetter: (p) => pathOf(p.data.applicable_area_id, areas) },
    { headerName: tx("Status"), field: "status", width: 110, cellRenderer: (p) => <Box height="100%" display="flex" alignItems="center"><StatusChip value={p.value} /></Box> },
    { headerName: tx("Actions"), width: 90, sortable: false, filter: false, cellRenderer: (p) => (
      <Stack direction="row" alignItems="center" height="100%">
        <IconButton size="small" onClick={() => setSelectedId(p.data.id)}><VisibilityOutlinedIcon fontSize="small" /></IconButton>
      </Stack>
    ) },
  ], [areas, language]);

  const holidayCols = useMemo(() => [
    { headerName: tx("Date"), field: "calendar_date", width: 110 },
    { headerName: tx("Name"), field: "name", minWidth: 160, flex: 1 },
    { headerName: tx("Day Type"), field: "day_type", width: 140, valueFormatter: (p) => dayTypeText(p.value) },
    { headerName: tx("Applicable Area"), minWidth: 140, valueGetter: (p) => pathOf(p.data.applicable_area_id, areas) },
    { headerName: tx("Actions"), width: 90, sortable: false, filter: false, cellRenderer: (p) => (
      <Stack direction="row" alignItems="center" height="100%">
        <IconButton size="small" disabled={!canEdit} onClick={() => setDialog({ type: "calendarDay", item: p.data })}><EditOutlinedIcon fontSize="small" /></IconButton>
        <IconButton size="small" color="error" disabled={!canEdit} onClick={() => deleteCalendarDay(p.data)}><DeleteOutlineIcon fontSize="small" /></IconButton>
      </Stack>
    ) },
  ], [areas, canEdit, language]);

  const holidayRows = useMemo(() => calendarDays.filter((d) => d.day_type === "HOLIDAY"), [calendarDays]);
  const specialDayRows = useMemo(() => calendarDays.filter((d) => ["SPECIAL_DAY", "COMPANY_EVENT"].includes(d.day_type)), [calendarDays]);

  const kpis = [
    { label: tx("Total Shifts"), value: stats.total_shifts, note: "", icon: CalendarMonthOutlinedIcon, tone: "primary" },
    { label: tx("Active Shifts"), value: stats.active_shifts, note: percent(stats.active_shifts), icon: CheckCircleOutlineIcon, tone: "success" },
    { label: tx("Working Days"), value: stats.working_days_this_month, note: tx("this month"), icon: PlayCircleOutlineIcon, tone: "info" },
    { label: tx("Holidays"), value: stats.holidays_this_month, note: tx("this month"), icon: EventBusyOutlinedIcon, tone: "warning" },
    { label: tx("Special Days"), value: stats.special_days_this_month, note: tx("this month"), icon: WarningAmberOutlinedIcon, tone: "danger" },
  ];

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box>
        <PageMeta title={`${tx("Shift & Calendar Master")} | VCC Plastics`} description={tx("Manage factory calendar, working shifts, holidays and special days")} />
        <PageBreadcrumb pageTitle={tx("Shift & Calendar Master")} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr auto" }, gap: 1.5, alignItems: "center", mb: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800}>{tx("Shift & Calendar Master")}</Typography>
            <Typography variant="body2" color="text.secondary">{tx("Manage factory calendar, working shifts, holidays and special days")}</Typography>
          </Box>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2, justifyContent: "flex-end" }}>
            <Button disabled={!canEdit} startIcon={<AddIcon />} onClick={() => setDialog({ type: "shift" })} sx={btn("primary")}>{tx("Add New Shift")}</Button>
          </Stack>
        </Box>

        <KpiCardGroup>
          {kpis.map((k) => { const Icon = k.icon; return <KpiCard key={k.label} label={k.label} value={k.value} note={k.note} icon={<Icon />} tone={k.tone} />; })}
        </KpiCardGroup>

        <Paper elevation={0} sx={{ ...cardSx, my: 1.5, p: 1 }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={1} flexWrap="wrap">
            <TextField size="small" placeholder={tx("Search by shift code or name...")} value={keyword} onChange={(e) => setKeyword(e.target.value)} sx={{ minWidth: 230 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{tx("Shift Type")}</InputLabel>
              <Select label={tx("Shift Type")} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <MenuItem value="all">{tx("All Types")}</MenuItem>
                {shiftTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{tx("Status")}</InputLabel>
              <Select label={tx("Status")} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">{tx("All Status")}</MenuItem>
                {STATUSES.map((s) => <MenuItem key={s} value={s}>{statusText(s)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel>{tx("Applicable Area")}</InputLabel>
              <Select label={tx("Applicable Area")} value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}>
                <MenuItem value="all">{tx("All Areas")}</MenuItem>
                {areas.map((a) => <MenuItem key={a.id} value={a.id}>{pathOf(a.id, areas)}</MenuItem>)}
              </Select>
            </FormControl>
            <Button onClick={() => { setKeyword(""); setTypeFilter("all"); setStatusFilter("all"); setAreaFilter("all"); }} sx={btn("cancel")}>{tx("Clear")}</Button>
          </Stack>
        </Paper>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "260px minmax(0,1fr) 340px" }, gap: 1.5 }}>
          <Paper elevation={0} sx={{ ...cardSx, height: 600, display: "flex", flexDirection: "column" }}>
            <Head icon={<CalendarMonthOutlinedIcon color="primary" fontSize="small" />} title={tx("Calendar")} />
            <MonthCalendar days={calendarDays} month={month} onMonthChange={setMonth} localeTag={calendarLocaleTag()}
              onDayClick={(dateStr) => setDialog({ type: "calendarDay", defaultDate: dateStr })} />
          </Paper>

          <Paper elevation={0} sx={{ ...cardSx, height: 600, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Head icon={<CalendarMonthOutlinedIcon color="primary" fontSize="small" />} title={`${tx("Shift List")} (${filtered.length})`} />
            <Box sx={{ p: 0.75, flex: 1, minHeight: 0 }}>
              <AgGridTable rowData={filtered} columnDefs={cols} loading={loading} pagination paginationPageSize={20} onRowClicked={(e) => setSelectedId(e.data.id)} getRowId={(p) => String(p.data.id)} height="100%" />
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ ...cardSx, height: 600, display: "flex", flexDirection: "column" }}>
            <Head icon={<VisibilityOutlinedIcon color="primary" fontSize="small" />} title={tx("Shift Detail")} />
            {detail ? (
              <>
                <Box sx={{ p: 1.5, borderBottom: 1, borderColor: "divider" }}>
                  <Stack direction="row" spacing={0.7} alignItems="center">
                    <Typography fontWeight={800}>{detail.shift_code}</Typography>
                    <StatusChip value={detail.status} />
                  </Stack>
                  <Typography noWrap variant="body2" color="text.secondary">{detail.shift_name}</Typography>
                </Box>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ minHeight: 36, borderBottom: 1, borderColor: "divider", "& .MuiTab-root": { minHeight: 36, p: 0, fontSize: 9.5, fontWeight: 700 } }}>
                  <Tab label={tx("General")} /><Tab label={tx("Break Time Tab")} /><Tab label={tx("Applicable Area Tab")} /><Tab label={tx("History")} />
                </Tabs>
                <Box sx={{ p: 1.5, flex: 1, overflow: "auto" }}>
                  {tab === 0 && (
                    <Stack spacing={0.85}>
                      {[
                        [tx("Shift Code"), detail.shift_code], [tx("Shift Name"), detail.shift_name], [tx("Shift Type"), detail.shift_type],
                        [tx("Start Time"), detail.start_time], [tx("End Time"), detail.end_time],
                        [tx("Effective Date"), detail.effective_date], [tx("Description"), detail.description],
                      ].map(([label, value]) => (
                        <Box key={label} sx={{ display: "grid", gridTemplateColumns: "45% 55%", gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">{label}</Typography>
                          <Typography variant="caption" fontWeight={700}>{value || EMPTY}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                  {tab === 1 && (
                    <Stack spacing={0.85}>
                      {[
                        [tx("Break Time"), `${detail.break_minutes} min`], [tx("Working Hours"), detail.working_hours],
                        [tx("Overnight Shift"), detail.is_overnight ? tx("Yes") : tx("No")],
                        [tx("Overtime Allowed"), detail.overtime_allowed ? tx("Yes") : tx("No")],
                        [tx("Allow Overlap"), detail.allow_overlap ? tx("Yes") : tx("No")],
                      ].map(([label, value]) => (
                        <Box key={label} sx={{ display: "grid", gridTemplateColumns: "45% 55%", gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">{label}</Typography>
                          <Typography variant="caption" fontWeight={700}>{value ?? EMPTY}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                  {tab === 2 && (
                    <Stack spacing={0.85}>
                      <Box sx={{ display: "grid", gridTemplateColumns: "45% 55%", gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">{tx("Applicable Area")}</Typography>
                        <Typography variant="caption" fontWeight={700}>{pathOf(detail.applicable_area_id, areas)}</Typography>
                      </Box>
                      <Box sx={{ display: "grid", gridTemplateColumns: "45% 55%", gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">{tx("Color")}</Typography>
                        <Box sx={{ width: 16, height: 16, borderRadius: 0.5, bgcolor: detail.color_code || "transparent", border: 1, borderColor: "divider" }} />
                      </Box>
                    </Stack>
                  )}
                  {tab === 3 && (
                    <Stack divider={<Divider />}>
                      {auditLog.map((a) => (
                        <Box key={a.id} py={0.6}>
                          <Typography variant="caption" fontWeight={700} display="block">{a.action} — {a.from_status || EMPTY} → {a.to_status || EMPTY}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">{a.actor} · {a.acted_at}{a.remark ? ` · ${a.remark}` : ""}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
                <Divider />
                <Stack direction="row" sx={{ justifyContent: "center", gap: 1.5, p: 1.5 }}>
                  <Tooltip title={tx("Edit")}><span><IconButton disabled={!canEdit} onClick={() => setDialog({ type: "shift", item: detail })} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><EditOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
                  <Tooltip title={tx("Toggle Active / Inactive")}><span><IconButton disabled={!canEdit || saving} color={detail.status === "ACTIVE" ? "success" : "default"} onClick={toggleStatus} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}>{detail.status === "ACTIVE" ? <PlayCircleOutlineIcon fontSize="small" /> : <PauseCircleOutlineIcon fontSize="small" />}</IconButton></span></Tooltip>
                  <Tooltip title={tx("Copy")}><span><IconButton disabled={!canEdit} onClick={() => setDialog({ type: "copyShift" })} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><ContentCopyOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
                  <Tooltip title={tx("Delete")}><span><IconButton disabled={!canEdit || saving} color="error" onClick={deleteShift} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><DeleteOutlineIcon fontSize="small" /></IconButton></span></Tooltip>
                </Stack>
              </>
            ) : (
              <Box flex={1} display="grid" sx={{ placeItems: "center" }}><Typography color="text.secondary">{tx("Select a shift to view details.")}</Typography></Box>
            )}
          </Paper>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 1.5, mt: 1.5 }}>
          <Paper elevation={0} sx={{ ...cardSx, height: 320, display: "flex", flexDirection: "column" }}>
            <Head icon={<EventBusyOutlinedIcon color="primary" fontSize="small" />} title={tx("Holiday List")}
              action={<Button size="small" startIcon={<AddIcon fontSize="small" />} disabled={!canEdit} onClick={() => setDialog({ type: "calendarDay", defaultType: "HOLIDAY" })}>{tx("Add Holiday")}</Button>} />
            <Box sx={{ p: 0.75, flex: 1, minHeight: 0 }}>
              <AgGridTable rowData={holidayRows} columnDefs={holidayCols} height="100%" pagination paginationPageSize={10} getRowId={(p) => String(p.data.id)} />
            </Box>
          </Paper>
          <Paper elevation={0} sx={{ ...cardSx, height: 320, display: "flex", flexDirection: "column" }}>
            <Head icon={<EventBusyOutlinedIcon color="primary" fontSize="small" />} title={tx("Special Day List")}
              action={<Button size="small" startIcon={<AddIcon fontSize="small" />} disabled={!canEdit} onClick={() => setDialog({ type: "calendarDay", defaultType: "SPECIAL_DAY" })}>{tx("Add Special Day")}</Button>} />
            <Box sx={{ p: 0.75, flex: 1, minHeight: 0 }}>
              <AgGridTable rowData={specialDayRows} columnDefs={holidayCols} height="100%" pagination paginationPageSize={10} getRowId={(p) => String(p.data.id)} />
            </Box>
          </Paper>
        </Box>

        {dialog?.type === "shift" && (
          <ShiftForm item={dialog.item} areas={areas} actor={actor} saving={saving} onClose={() => setDialog(null)} onSave={saveShift} />
        )}
        {dialog?.type === "copyShift" && (
          <CopyShiftDialog saving={saving} onClose={() => setDialog(null)} onConfirm={copyShift} />
        )}
        {dialog?.type === "calendarDay" && (
          <CalendarDayForm item={dialog.item} defaultDate={dialog.defaultDate} defaultType={dialog.defaultType} areas={areas} actor={actor} saving={saving} onClose={() => setDialog(null)} onSave={saveCalendarDay} />
        )}

        <Snackbar open={msg.open} autoHideDuration={4500} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}
