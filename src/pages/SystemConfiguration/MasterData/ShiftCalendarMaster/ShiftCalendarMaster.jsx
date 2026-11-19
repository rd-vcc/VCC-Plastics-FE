import "./locales";
import { PanelHeader, masterGridSx, panelSx, SettingsMenu } from "../../../../components/masterData/MasterPanels";
import useFillHeight from "../../../../hooks/useFillHeight";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Autocomplete, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, Divider, FormControl, IconButton, InputAdornment,
  InputLabel, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Popover, Select, Snackbar, Stack, Tab,
  Tabs, TextField, ThemeProvider as MuiThemeProvider, Tooltip, Typography, createTheme,
} from "@mui/material";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import AddIcon from "@mui/icons-material/Add";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CheckIcon from "@mui/icons-material/Check";
import DomainOutlinedIcon from "@mui/icons-material/DomainOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FactoryOutlinedIcon from "@mui/icons-material/FactoryOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import LanOutlinedIcon from "@mui/icons-material/LanOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircle";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircle";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
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
const DAY_TYPES = ["HOLIDAY", "WEEKEND", "FACTORY_SHUTDOWN", "OTHER_HOLIDAY", "SPECIAL_DAY", "COMPANY_EVENT", "OVERTIME", "OTHER_SPECIAL"];
// OTHER_* = user-typed day type; the base decides whether it is a day off or a special day.
const CUSTOM_DAY_TYPES = ["OTHER_HOLIDAY", "OTHER_SPECIAL"];
const dayLabel = (entry) => entry?.custom_type_name || dayTypeText(entry?.day_type);
const DAY_TYPE_COLORS = { HOLIDAY: "#F04438", WEEKEND: "#F04438", SPECIAL_DAY: "#7A5AF8", COMPANY_EVENT: "#7A5AF8", FACTORY_SHUTDOWN: "#667085", OVERTIME: "#F79009" };
const cardSx = panelSx;

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
    <Box sx={{ px: 2, py: 1.25, display: "flex", alignItems: "center", gap: 1.25, borderBottom: 1, borderColor: "divider",
      bgcolor: (theme) => theme.palette.mode === "dark" ? (tone === "danger" ? "rgba(238,27,27,0.10)" : "rgba(0,91,171,0.14)") : (tone === "danger" ? "#FFF3F3" : "#F1F7FF") }}>
      <Box sx={{ width: 28, height: 28, borderRadius: "50%",
        bgcolor: (theme) => theme.palette.mode === "dark" ? (tone === "danger" ? "#4C1D1D" : "#173A63") : (tone === "danger" ? "#FDECEC" : "#EEF4FF"),
        color: toneColor, display: "grid", placeItems: "center", flexShrink: 0 }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800 }}>{title}</Typography>
        {subtitle ? <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.35 }}>{subtitle}</Typography> : null}
      </Box>
      <IconButton size="small" disabled={disabled} onClick={onClose} sx={{ mr: -0.5 }}><CloseIcon fontSize="small" /></IconButton>
    </Box>
  );
}

const dialogPaperSx = { borderRadius: 3, overflow: "hidden", boxShadow: (theme) => theme.palette.mode === "dark" ? "0 24px 60px rgba(0,0,0,.55)" : "0 24px 60px rgba(15,23,42,.18)" };

const Head = PanelHeader;

function DetailSection({ title, children, grow = false }) {
  return (
    <Box sx={grow ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" } : undefined}>
      <Typography variant="caption" sx={{ display: "block", mb: 0.5, fontWeight: 800, fontSize: 10, letterSpacing: "0.05em", textTransform: "uppercase", color: "text.secondary" }}>{title}</Typography>
      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, px: 1.25, ...(grow ? { flex: 1, minHeight: 0, overflowY: "auto" } : {}) }}>{children}</Box>
    </Box>
  );
}

function DetailRow({ label, children, last }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, py: 0.9, borderBottom: last ? 0 : 1, borderColor: "divider" }}>
      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{label}</Typography>
      <Typography variant="caption" sx={{ fontWeight: 700, textAlign: "right", minWidth: 0, wordBreak: "break-word" }}>{children}</Typography>
    </Box>
  );
}

function YesNo({ value }) {
  return <Chip size="small" variant="outlined" color={value ? "success" : "default"} label={value ? tx("Yes") : tx("No")} sx={{ height: 20, minWidth: 52, fontSize: 10, fontWeight: 800 }} />;
}

const STATUS_TONES = { ACTIVE: "success", INACTIVE: "default" };
const AUDIT_LABELS = { CREATE: "Created by", UPDATE: "Updated by", ACTIVATE: "Activated by", DEACTIVATE: "Deactivated by", DELETE: "Deleted by" };
const STATUS_COLORS = { ACTIVE: "#12B76A", INACTIVE: "#667085" };
function StatusChip({ value }) {
  const color = STATUS_COLORS[value] || "#667085";
  return (
    <Box component="span" title={statusText(value)} sx={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxSizing: "border-box",
      width: 92, height: 22, px: 0.5, lineHeight: 1, verticalAlign: "middle", whiteSpace: "nowrap", overflow: "hidden",
      borderRadius: 1, fontSize: 10, fontWeight: 700, color, bgcolor: `${color}1A`, border: `1px solid ${color}40`,
    }}>{statusText(value)}</Box>
  );
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

// Calendar is view-only: holidays / special days are maintained from Settings.
// Any day that is not a holiday or special day counts as a working day.
const DAY_KINDS = {
  WORKING: { color: "#12B76A", label: "Working Day" },
  HOLIDAY: { color: "#F04438", label: "Holiday" },
  SPECIAL: { color: "#F79009", label: "Special Day" },
};
const HOLIDAY_TYPES = ["HOLIDAY", "WEEKEND", "FACTORY_SHUTDOWN", "OTHER_HOLIDAY"];
const SELECTED_COLOR = "#1570EF";
const KIND_TINTS = { HOLIDAY: "rgba(240,68,56,0.14)", SPECIAL: "rgba(247,144,9,0.16)" };
const WEEKEND_COLOR = "#F04438";
const toKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function MonthCalendar({ days, month, onMonthChange, localeTag, areaLabel }) {
  const year = month.getFullYear(), monthIndex = month.getMonth();
  const [selected, setSelected] = useState(() => toKey(new Date()));
  const byDate = useMemo(() => {
    const map = {};
    days.filter((d) => d.status !== "INACTIVE").forEach((d) => {
      const key = String(d.calendar_date).slice(0, 10);
      (map[key] = map[key] || []).push(d);
    });
    return map;
  }, [days]);
  const kindOf = (key) => {
    const entries = byDate[key] || [];
    if (entries.some((e) => HOLIDAY_TYPES.includes(e.day_type))) return "HOLIDAY";
    if (entries.length) return "SPECIAL";
    return "WORKING";
  };

  // Monday-first 6x7 grid including the trailing / leading days of the neighbour months.
  const start = new Date(year, monthIndex, 1 - ((new Date(year, monthIndex, 1).getDay() + 6) % 7));
  const cells = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  const rows = cells[35].getMonth() === monthIndex ? cells : cells.slice(0, 35);
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(localeTag, { weekday: "short" }));
  const monthLabel = localeTag.startsWith("vi")
    ? `Tháng ${monthIndex + 1}/${year}`
    : month.toLocaleDateString(localeTag, { month: "long", year: "numeric" });
  const selectedEntries = byDate[selected] || [];
  const selectedDate = new Date(`${selected}T00:00:00`);
  const weekdayLong = selectedDate.toLocaleDateString(localeTag, { weekday: "long" });
  const selectedLabel = `${weekdayLong.charAt(0).toUpperCase()}${weekdayLong.slice(1)}, ${selectedDate.toLocaleDateString(localeTag, { day: "2-digit", month: "2-digit", year: "numeric" })}`;

  return (
    <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {areaLabel ? (
        <Typography variant="caption" color="text.secondary" noWrap title={areaLabel} sx={{ display: "block", mb: 1 }}>
          <b>{tx("Applicable Area")}:</b> {areaLabel}
        </Typography>
      ) : null}
      <Box sx={{ display: "grid", gridTemplateColumns: "32px 1fr 32px", alignItems: "center", mb: 2 }}>
        <IconButton size="small" onClick={() => onMonthChange(new Date(year, monthIndex - 1, 1))}><ChevronLeftIcon fontSize="small" /></IconButton>
        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, textAlign: "center", lineHeight: 1, textTransform: "capitalize" }}>{monthLabel}</Typography>
        <IconButton size="small" onClick={() => onMonthChange(new Date(year, monthIndex + 1, 1))}><ChevronRightIcon fontSize="small" /></IconButton>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gridTemplateRows: `auto repeat(${rows.length / 7}, minmax(44px, 1fr))`, rowGap: 0.5, flex: 1, minHeight: 0 }}>
        {weekdays.map((d) => (
          <Typography key={d} variant="caption" align="center" sx={{ fontWeight: 800, pb: 1 }}>{d}</Typography>
        ))}
        {rows.map((date) => {
          const key = toKey(date);
          const inMonth = date.getMonth() === monthIndex;
          const weekend = date.getDay() === 0 || date.getDay() === 6;
          const isSelected = key === selected;
          const kind = kindOf(key);
          return (
            <Box key={key} onClick={() => { setSelected(key); if (!inMonth) onMonthChange(new Date(date.getFullYear(), date.getMonth(), 1)); }}
              sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.5, cursor: "pointer" }}>
              <Box sx={{
                width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center",
                bgcolor: isSelected ? SELECTED_COLOR : kind !== "WORKING" && inMonth ? KIND_TINTS[kind] : "transparent",
                color: isSelected ? "#FFF" : !inMonth ? "text.disabled" : weekend || kind === "HOLIDAY" ? WEEKEND_COLOR : "text.primary",
                "&:hover": isSelected ? {} : { bgcolor: "action.hover" },
              }}>
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11 }}>{date.getDate()}</Typography>
              </Box>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: DAY_KINDS[kind].color, opacity: inMonth ? 1 : 0.35 }} />
            </Box>
          );
        })}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 1, rowGap: 1, mt: 2.5, p: 1.25, borderRadius: 1.5, bgcolor: "action.hover" }}>
        {[...Object.values(DAY_KINDS), { color: SELECTED_COLOR, label: "Selected Day" }].map((k) => (
          <Stack key={k.label} direction="row" spacing={0.75} sx={{ alignItems: "center", minWidth: 0 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: k.color, flexShrink: 0 }} />
            <Typography variant="caption" noWrap sx={{ fontWeight: 600, fontSize: 11 }}>{tx(k.label)}</Typography>
          </Stack>
        ))}
      </Box>
      <Divider sx={{ my: 2 }} />
      <Stack spacing={0.5} sx={{ alignItems: "center", textAlign: "center" }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 800, lineHeight: 1.3 }}>{selectedLabel}</Typography>
        {(selectedEntries.length ? selectedEntries : [null]).map((e) => {
          const kind = !e ? "WORKING" : HOLIDAY_TYPES.includes(e.day_type) ? "HOLIDAY" : "SPECIAL";
          return (
            <Stack key={e?.id ?? "working"} direction="row" spacing={0.75} sx={{ alignItems: "center", justifyContent: "center", maxWidth: "100%" }}>
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, bgcolor: DAY_KINDS[kind].color }} />
              <Typography noWrap title={e ? `${dayLabel(e)} – ${e.name}` : ""} sx={{ fontSize: 11.5, lineHeight: 1.3, minWidth: 0 }}>
                {e ? `${dayLabel(e)} – ${e.name}` : tx("Working Day")}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
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
    applicable_area_id: null, effective_date: f.effectiveDate,
    overtime_allowed: f.overtimeAllowed, allow_overlap: f.allowOverlap, color_code: f.color.trim() || null,
    description: f.description.trim() || null, status: f.status,
    ...(item ? { version: Number(f.version), updated_by: actor } : { created_by: actor }),
  });
  return (
    <Dialog open fullWidth maxWidth="md" onClose={saving ? undefined : onClose} slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogHeader icon={<CalendarMonthOutlinedIcon />} title={tx(item ? "Edit Shift" : "Add New Shift Dialog")} disabled={saving} onClose={onClose} />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tab label={tx("General")} /><Tab label={tx("Break Time Tab")} /><Tab label={tx("Display")} />
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
              <TextField fullWidth required size="small" type="time" label={tx("Start Time")} value={f.start} onChange={ch("start")} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField fullWidth required size="small" type="time" label={tx("End Time")} value={f.end} onChange={ch("end")} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField fullWidth required size="small" type="date" label={tx("Effective Date")} value={f.effectiveDate} onChange={ch("effectiveDate")} slotProps={{ inputLabel: { shrink: true } }} />
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
            <Alert severity="info" sx={{ borderRadius: 2 }}>{tx("The area of a shift is set in Settings > Shift Pattern by Area.")}</Alert>
            <TextField fullWidth size="small" label={tx("Color")} type="color" value={f.color} onChange={ch("color")} sx={{ maxWidth: 120 }} />
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.25 }}>
        <Button onClick={submit} disabled={saving || !f.code.trim() || !f.name.trim() || !f.start || !f.end} sx={btn("primary")} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
          {tx("Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function FormControlLabelSwitch({ label, checked, onChange }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Box component="input" type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} sx={{ width: 16, height: 16 }} />
      <Typography variant="body2">{label}</Typography>
    </Stack>
  );
}

function CopyShiftDialog({ saving, onClose, onConfirm }) {
  const [code, setCode] = useState("");
  return (
    <Dialog open fullWidth maxWidth="xs" onClose={saving ? undefined : onClose} slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogHeader icon={<ContentCopyOutlinedIcon />} title={tx("Copy Shift")} disabled={saving} onClose={onClose} />
      <DialogContent>
        <TextField fullWidth required size="small" sx={{ mt: 1 }} label={tx("New Shift Code")} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.25 }}>
        <Button onClick={() => onConfirm(code)} disabled={saving || !code.trim()} sx={btn("primary")}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

const AREA_ICONS = {
  COMPANY: BusinessOutlinedIcon, FACTORY: FactoryOutlinedIcon, DIVISION: DomainOutlinedIcon,
  WORKSHOP: PrecisionManufacturingOutlinedIcon, LINE: HubOutlinedIcon, STATION: LanOutlinedIcon,
};

// Area picker drawn as the factory structure tree; ticking the root node covers the whole company.
function AreaTree({ areas, value, onChange, renderBadge }) {
  const [collapsed, setCollapsed] = useState([]);
  const renderNode = (node, depth) => {
    const children = areas.filter((a) => a.parentId === node.id);
    const open = !collapsed.includes(node.id);
    const selected = Number(value) === node.id;
    const Icon = AREA_ICONS[node.node_type_code] || DomainOutlinedIcon;
    return (
      <Box key={node.id}>
        <Box onClick={() => onChange(node.id)} sx={{ minHeight: 30, pl: `${depth * 14 + 2}px`, pr: 0.5, display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", borderRadius: 1,
          bgcolor: selected ? "action.selected" : "transparent", "&:hover": { bgcolor: selected ? "action.selected" : "action.hover" } }}>
          <IconButton size="small" sx={{ width: 20, height: 20 }} onClick={(e) => { e.stopPropagation(); if (children.length) setCollapsed((o) => (o.includes(node.id) ? o.filter((x) => x !== node.id) : [...o, node.id])); }}>
            {children.length ? (open ? <ExpandMoreIcon sx={{ fontSize: 13.5 }} /> : <ChevronRightIcon sx={{ fontSize: 13.5 }} />) : <Box sx={{ width: 16 }} />}
          </IconButton>
          <Icon color="primary" sx={{ fontSize: 13.5 }} />
          <Typography noWrap sx={{ flex: 1, fontSize: 11, fontWeight: selected ? 800 : 600 }}>{node.name}</Typography>
          {renderBadge ? renderBadge(node) : null}
          {selected ? <CheckIcon color="primary" sx={{ fontSize: 13.5 }} /> : null}
        </Box>
        {children.length > 0 && open ? children.map((c) => renderNode(c, depth + 1)) : null}
      </Box>
    );
  };
  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 0.75, flex: 1, minHeight: 200, overflowY: "auto" }}>
      {areas.filter((a) => a.parentId == null).map((r) => renderNode(r, 0))}
    </Box>
  );
}

// Date picker drawn as a month calendar; several dates can be ticked when adding.
function PickerCalendar({ days, selected, multiple, onChange, localeTag, footer, selectColor = SELECTED_COLOR }) {
  const first = selected[0] ? new Date(`${selected[0]}T00:00:00`) : new Date();
  const [month, setMonth] = useState(new Date(first.getFullYear(), first.getMonth(), 1));
  const year = month.getFullYear(), monthIndex = month.getMonth();
  const byDate = useMemo(() => {
    const map = {};
    days.filter((d) => d.status !== "INACTIVE").forEach((d) => { const k = String(d.calendar_date).slice(0, 10); (map[k] = map[k] || []).push(d); });
    return map;
  }, [days]);
  const start = new Date(year, monthIndex, 1 - ((new Date(year, monthIndex, 1).getDay() + 6) % 7));
  const cells = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  const rows = cells[35].getMonth() === monthIndex ? cells : cells.slice(0, 35);
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(localeTag, { weekday: "short" }));
  const label = localeTag.startsWith("vi") ? `Tháng ${monthIndex + 1}/${year}` : month.toLocaleDateString(localeTag, { month: "long", year: "numeric" });
  const toggle = (key) => {
    if (!multiple) return onChange([key]);
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key].sort());
  };
  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 1.25, flex: 1, display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "32px 1fr 32px", alignItems: "center", mb: 1 }}>
        <IconButton size="small" onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}><ChevronLeftIcon fontSize="small" /></IconButton>
        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, textAlign: "center", lineHeight: 1, textTransform: "capitalize" }}>{label}</Typography>
        <IconButton size="small" onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}><ChevronRightIcon fontSize="small" /></IconButton>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gridTemplateRows: `auto repeat(${rows.length / 7}, minmax(38px, 1fr))`, rowGap: 0.5, flex: 1 }}>
        {weekdays.map((d) => <Typography key={d} variant="caption" align="center" sx={{ fontWeight: 800, pb: 0.5 }}>{d}</Typography>)}
        {rows.map((date) => {
          const key = toKey(date);
          const inMonth = date.getMonth() === monthIndex;
          const weekend = date.getDay() === 0 || date.getDay() === 6;
          const isSel = selected.includes(key);
          const entries = byDate[key] || [];
          const kind = entries.some((e) => HOLIDAY_TYPES.includes(e.day_type)) ? "HOLIDAY" : entries.length ? "SPECIAL" : null;
          return (
            <Box key={key} onClick={() => toggle(key)} sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.3, cursor: "pointer" }}>
              <Box sx={{ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center",
                bgcolor: isSel ? selectColor : kind && inMonth ? KIND_TINTS[kind] : "transparent",
                color: isSel ? "#FFF" : !inMonth ? "text.disabled" : weekend || kind === "HOLIDAY" ? WEEKEND_COLOR : "text.primary",
                "&:hover": isSel ? {} : { bgcolor: "action.hover" } }}>
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11 }}>{date.getDate()}</Typography>
              </Box>
              <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: kind ? DAY_KINDS[kind].color : "transparent" }} />
            </Box>
          );
        })}
      </Box>
      {footer ? <Box sx={{ borderTop: 1, borderColor: "divider", pt: 1, mt: 1 }}>{footer}</Box> : null}
    </Box>
  );
}

function CalendarDayForm({ item, defaultDate, defaultType, areas, days, actor, saving, onClose, onSave }) {
  const [f, setF] = useState(item ? {
    dates: [String(item.calendar_date).slice(0, 10)], dayType: item.day_type, customType: item.custom_type_name || "", name: item.name,
    areaId: item.applicable_area_id ?? "", description: item.description || "", status: item.status, version: item.version,
  } : {
    dates: defaultDate ? [defaultDate] : [], dayType: defaultType || "HOLIDAY", customType: "", name: "",
    areaId: "", description: "", status: "ACTIVE", version: 1,
  });
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const localeTag = calendarLocaleTag();
  const rootId = areas.find((a) => a.parentId == null)?.id ?? "";
  const areaId = f.areaId === "" || f.areaId == null ? rootId : f.areaId;
  const isCustom = CUSTOM_DAY_TYPES.includes(f.dayType);
  const customSuggestions = [...new Set(days.filter((d) => d.day_type === f.dayType && d.custom_type_name).map((d) => d.custom_type_name))];
  const submit = () => onSave(f.dates.map((date) => ({
    calendar_date: date, day_type: f.dayType, custom_type_name: isCustom ? f.customType.trim() : null, name: f.name.trim(),
    applicable_area_id: areaId === "" ? null : Number(areaId), description: f.description.trim() || null, status: f.status,
    ...(item ? { version: Number(f.version), updated_by: actor } : { created_by: actor }),
  })));
  const title = item ? "Edit Calendar Day" : HOLIDAY_TYPES.includes(defaultType) ? "Add Holiday" : defaultType ? "Add Special Day" : "Add Calendar Day";
  return (
    <Dialog open fullWidth maxWidth="md" onClose={saving ? undefined : onClose} slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogHeader icon={<EventBusyOutlinedIcon />} title={tx(title)} disabled={saving} onClose={onClose} />
      <DialogContent>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "340px minmax(0,1fr)" }, gap: 2.5, pt: 2, height: { md: 440 } }}>
          <PickerCalendar days={days} selected={f.dates} multiple={!item} localeTag={localeTag} onChange={(dates) => setF((o) => ({ ...o, dates }))}
            selectColor={DAY_KINDS[HOLIDAY_TYPES.includes(f.dayType) ? "HOLIDAY" : "SPECIAL"].color} />
          <Stack spacing={1.75} sx={{ minHeight: 0 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField fullWidth required size="small" label={tx("Name")} value={f.name} onChange={ch("name")} />
              <FormControl fullWidth size="small">
                <InputLabel>{tx("Day Type")}</InputLabel>
                <Select label={tx("Day Type")} value={f.dayType} onChange={ch("dayType")}>
                  {(HOLIDAY_TYPES.includes(f.dayType) ? HOLIDAY_TYPES : DAY_TYPES.filter((t) => !HOLIDAY_TYPES.includes(t))).map((t) => <MenuItem key={t} value={t}>{dayTypeText(t)}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            {isCustom ? (
              <Autocomplete freeSolo options={customSuggestions} value={f.customType}
                onInputChange={(_, v) => setF((o) => ({ ...o, customType: v }))}
                renderInput={(params) => <TextField {...params} required size="small" label={tx("Custom Day Type")} placeholder={tx("e.g. Compensatory day off")} />} />
            ) : null}
            <Stack spacing={0.75} sx={{ flex: 1, minHeight: 0 }}>
              <Typography variant="caption" color="text.secondary" noWrap>
                <b>{tx("Applicable Area")}:</b> {pathOf(areaId === "" ? null : areaId, areas)}
              </Typography>
              <AreaTree areas={areas} value={areaId} onChange={(id) => setF((o) => ({ ...o, areaId: id }))} />
            </Stack>
            <TextField fullWidth multiline minRows={2} maxRows={2} label={tx("Description")} value={f.description} onChange={ch("description")} />
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pt: 0, pb: 2.5 }}>
        <Button onClick={submit} disabled={saving || !f.name.trim() || !f.dates.length || (isCustom && !f.customType.trim())} sx={btn("primary")}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

const fmtDate = (value) => (value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString(calendarLocaleTag(), { day: "2-digit", month: "2-digit", year: "numeric" }) : EMPTY);
const todayKey = () => toKey(new Date());

function PatternBadge({ pattern, inherited }) {
  if (!pattern) return <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>{tx("Not assigned")}</Typography>;
  return (
    <Box component="span" title={inherited ? tx("Inherited from parent unit") : ""} sx={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", height: 20, px: 0.75, borderRadius: 1, flexShrink: 0,
      fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
      color: inherited ? "text.secondary" : "#005BAB", bgcolor: inherited ? "transparent" : "rgba(0,91,171,0.10)",
      border: 1, borderColor: inherited ? "divider" : "rgba(0,91,171,0.30)", borderStyle: inherited ? "dashed" : "solid",
    }}>{pattern}</Box>
  );
}

// Settings > shift pattern per area: each unit runs one shift pattern (own or inherited from its parent).
function PatternDialog({ areas, patterns, assignments, areaPatterns, canEdit, actor, request, notify, onChanged, onClose }) {
  const rootId = areas.find((a) => a.parentId == null)?.id ?? null;
  const [areaId, setAreaId] = useState(rootId);
  const empty = { id: null, shiftType: "", from: todayKey(), to: "" };
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const effective = areaPatterns.find((a) => a.area_id === areaId);
  const own = assignments.filter((a) => a.area_id === areaId);
  const effectivePattern = patterns.find((p) => p.shift_type === effective?.shift_type);
  const byArea = useMemo(() => Object.fromEntries(areaPatterns.map((a) => [a.area_id, a])), [areaPatterns]);

  const save = async () => {
    setBusy(true);
    try {
      const body = { area_id: areaId, shift_type: form.shiftType, effective_from: form.from, effective_to: form.to || null, ...(form.id ? { updated_by: actor } : { created_by: actor }) };
      await request(form.id ? `${API}/pattern-assignments/${form.id}` : `${API}/pattern-assignments`, { method: form.id ? "PUT" : "POST", body: JSON.stringify(body) });
      setForm(empty); await onChanged(); notify("success", tx("Shift pattern saved."));
    } catch (e) { notify("error", e.message); } finally { setBusy(false); }
  };
  const remove = async (a) => {
    if (!window.confirm(tx("Are you sure you want to delete this item?"))) return;
    try { await request(`${API}/pattern-assignments/${a.id}`, { method: "DELETE" }); await onChanged(); notify("success", tx("Shift pattern saved.")); }
    catch (e) { notify("error", e.message); }
  };

  return (
    <Dialog open fullWidth maxWidth="lg" onClose={onClose} slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogHeader icon={<AccountTreeOutlinedIcon />} title={tx("Shift Pattern by Area")} subtitle={tx("Each unit runs one shift pattern; sub-units inherit it unless they have their own.")} onClose={onClose} />
      <DialogContent>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "380px minmax(0,1fr)" }, gap: 2.5, pt: 2, height: { md: 480 } }}>
          <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
            <AreaTree areas={areas} value={areaId ?? ""} onChange={(id) => { setAreaId(id); setForm(empty); }}
              renderBadge={(node) => <PatternBadge pattern={byArea[node.id]?.shift_type} inherited={byArea[node.id]?.inherited} />} />
          </Box>
          <Stack spacing={1.75} sx={{ minHeight: 0 }}>
            <Box sx={{ p: 1.5, borderRadius: 1.5, flexShrink: 0, bgcolor: (t) => (t.palette.mode === "dark" ? "#182235" : "#F1F7FF") }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{pathOf(areaId, areas)}</Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 0.5 }}>
                <Typography sx={{ fontWeight: 800 }}>{effective?.shift_type || tx("Not assigned")}</Typography>
                {effective?.inherited ? <Typography variant="caption" color="text.secondary">({tx("inherited from")} {effective.source_area_name})</Typography> : null}
              </Stack>
              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75, mt: 1 }}>
                {(effectivePattern?.shifts || []).map((sh) => (
                  <Box key={sh.id} sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, px: 1, py: 0.4, borderRadius: 1, bgcolor: "background.paper", border: 1, borderColor: "divider" }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: sh.color_code || "#005BAB" }} />
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{sh.shift_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{sh.start_time} → {sh.end_time}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            <DetailSection title={tx("Assignments of this unit")} grow>
              {own.length ? own.map((a, i) => (
                <Box key={a.id} sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto auto", alignItems: "center", gap: 1, py: 0.75, borderBottom: i === own.length - 1 ? 0 : 1, borderColor: "divider" }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" noWrap sx={{ fontWeight: 800, display: "block" }}>{a.shift_type}</Typography>
                    <Typography variant="caption" color="text.secondary">{fmtDate(a.effective_from)} → {a.effective_to ? fmtDate(a.effective_to) : tx("no end date")}</Typography>
                  </Box>
                  <IconButton size="small" disabled={!canEdit} onClick={() => setForm({ id: a.id, shiftType: a.shift_type, from: String(a.effective_from).slice(0, 10), to: a.effective_to ? String(a.effective_to).slice(0, 10) : "" })}><EditOutlinedIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" disabled={!canEdit} onClick={() => remove(a)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                </Box>
              )) : <Typography variant="caption" color="text.secondary" sx={{ display: "block", py: 1 }}>{tx("No own assignment — this unit uses its parent's shift pattern.")}</Typography>}
            </DetailSection>

            <DetailSection title={form.id ? tx("Edit assignment") : tx("Assign shift pattern")}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0,1.4fr) 1fr 1fr" }, gap: 1.25, py: 1.25 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>{tx("Shift Pattern")}</InputLabel>
                  <Select label={tx("Shift Pattern")} value={form.shiftType} onChange={(e) => setForm((o) => ({ ...o, shiftType: e.target.value }))}>
                    {patterns.map((p) => <MenuItem key={p.shift_type} value={p.shift_type}>{p.shift_type} ({p.shifts.map((x) => x.shift_code).join(", ")})</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField size="small" type="date" label={tx("Effective from")} value={form.from} onChange={(e) => setForm((o) => ({ ...o, from: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
                <TextField size="small" type="date" label={tx("Effective to")} value={form.to} onChange={(e) => setForm((o) => ({ ...o, to: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
              </Box>
              <Stack direction="row" spacing={1} sx={{ pb: 1.25 }}>
                <Button variant="contained" startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <AddIcon />} disabled={!canEdit || busy || !areaId || !form.shiftType || !form.from}
                  onClick={save} sx={btn("primary")}>{form.id ? tx("Save") : tx("Assign")}</Button>
                {form.id ? <Button onClick={() => setForm(empty)} sx={btn("cancel")}>{tx("New assignment")}</Button> : null}
              </Stack>
            </DetailSection>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

const DAY_LISTS = {
  HOLIDAY: { title: "Holiday List", add: "Add Holiday", types: HOLIDAY_TYPES },
  SPECIAL_DAY: { title: "Special Day List", add: "Add Special Day", types: DAY_TYPES.filter((t) => !HOLIDAY_TYPES.includes(t)) },
};

function DayListDialog({ kind, days, columns, canEdit, onAdd, onClose }) {
  const conf = DAY_LISTS[kind];
  const rows = days.filter((d) => conf.types.includes(d.day_type));
  return (
    <Dialog open fullWidth maxWidth="md" onClose={onClose} slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogHeader icon={<EventBusyOutlinedIcon />} title={tx(conf.title)} onClose={onClose} />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Box sx={{ height: 420, mt: 1 }}>
          <AgGridTable rowData={rows} columnDefs={columns} height="100%" getRowId={(p) => String(p.data.id)} />
        </Box>
        <Stack direction="row" sx={{ mt: 1.5 }}>
          <Button variant="contained" startIcon={<AddIcon />} disabled={!canEdit} onClick={onAdd} sx={btn("primary", { whiteSpace: "nowrap" })}>
            {tx(conf.add)}
          </Button>
        </Stack>
      </DialogContent>
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
  const [panelsRef, panelHeight] = useFillHeight();
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
  const [dayList, setDayList] = useState(null);
  const [allDays, setAllDays] = useState([]);
  const [calendarArea, setCalendarArea] = useState("");
  const [patternOpen, setPatternOpen] = useState(false);
  const [patterns, setPatterns] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [areaPatterns, setAreaPatterns] = useState([]);
  const [areaAnchor, setAreaAnchor] = useState(null);
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

  const loadPatterns = useCallback(async () => {
    try {
      const [p, a, ap] = await Promise.all([request(`${API}/shift-patterns`), request(`${API}/pattern-assignments`), request(`${API}/area-patterns`)]);
      setPatterns(p || []); setAssignments(a || []); setAreaPatterns(ap || []);
    } catch (e) { notify("error", e.message); }
  }, [request, notify]);
  useEffect(() => { loadPatterns(); }, [loadPatterns]);

  const loadAllDays = useCallback(async () => {
    try { setAllDays((await request(`${API}/calendar-days`)) || []); } catch (e) { notify("error", e.message); }
  }, [request, notify]);
  useEffect(() => { if (dayList) loadAllDays(); }, [dayList, loadAllDays]);

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
    if (!selectedId || tab !== 1) return;
    request(`${API}/shifts/${selectedId}/audit-log`).then(setAuditLog).catch((e) => notify("error", e.message));
  }, [selectedId, tab, request, notify]);

  // Days that apply to the chosen area: its own entries plus those set on any parent unit (or company-wide).
  const calendarAreaId = calendarArea === "" ? areas.find((a) => a.parentId == null)?.id ?? null : Number(calendarArea);
  const areaDays = useMemo(() => {
    const chain = new Set();
    let n = areas.find((a) => a.id === calendarAreaId);
    while (n && !chain.has(n.id)) { chain.add(n.id); n = areas.find((a) => a.id === n.parentId); }
    return calendarDays.filter((d) => d.applicable_area_id == null || chain.has(Number(d.applicable_area_id)));
  }, [areas, calendarAreaId, calendarDays]);

  const patternKey = (v) => (v || "").trim().toLowerCase();
  const usedBy = useCallback((shiftType) => {
    const today = toKey(new Date());
    return assignments.filter((a) => patternKey(a.shift_type) === patternKey(shiftType)
      && String(a.effective_from).slice(0, 10) <= today && (!a.effective_to || String(a.effective_to).slice(0, 10) >= today));
  }, [assignments]);
  const shortArea = useCallback((id) => areas.find((a) => a.id === Number(id))?.name || EMPTY, [areas]);

  const shiftTypes = useMemo(() => [...new Set(rows.map((r) => r.shift_type).filter(Boolean))].sort(), [rows]);
  const filtered = useMemo(() => {
    const q = keyword.toLowerCase().trim();
    return rows.filter((r) => {
      if (q && !`${r.shift_code} ${r.shift_name}`.toLowerCase().includes(q)) return false;
      if (typeFilter !== "all" && r.shift_type !== typeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (areaFilter !== "all" && patternKey(areaPatterns.find((a) => a.area_id === Number(areaFilter))?.shift_type) !== patternKey(r.shift_type)) return false;
      return true;
    });
  }, [rows, keyword, typeFilter, statusFilter, areaFilter, areaPatterns]);

  const percent = (n) => (stats.total_shifts ? `${((n / stats.total_shifts) * 100).toFixed(1)}% ${tx("of total")}` : `0% ${tx("of total")}`);
  const reloadAll = useCallback(async () => {
    await load(); await loadCalendar(); await loadDetail(selectedId); await loadPatterns();
    if (dayList) await loadAllDays();
  }, [load, loadCalendar, loadDetail, selectedId, dayList, loadAllDays, loadPatterns]);

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
  const saveCalendarDay = async (payloads) => {
    const item = dialog?.item;
    const fmt = (d) => new Date(`${d}T00:00:00`).toLocaleDateString(calendarLocaleTag(), { day: "2-digit", month: "2-digit", year: "numeric" });
    // Adding: a date that already has a (non-overtime) entry for the same area is skipped, not re-posted.
    const taken = new Set(allDays
      .filter((d) => d.status !== "INACTIVE" && d.day_type !== "OVERTIME")
      .map((d) => `${String(d.calendar_date).slice(0, 10)}|${d.applicable_area_id ?? ""}`));
    const skipped = item ? [] : payloads.filter((p) => p.day_type !== "OVERTIME" && taken.has(`${p.calendar_date}|${p.applicable_area_id ?? ""}`));
    const todo = payloads.filter((p) => !skipped.includes(p));
    setSaving(true);
    const failed = [];
    let saved = 0;
    for (const payload of todo) {
      try {
        await request(item ? `${API}/calendar-days/${item.id}` : `${API}/calendar-days`, { method: item ? "PUT" : "POST", body: JSON.stringify(payload) });
        saved += 1;
      } catch (e) { failed.push(`${fmt(payload.calendar_date)}: ${e.status === 409 && !item ? tx("already registered") : e.message}`); }
    }
    try {
      await reloadAll();
      const skippedText = skipped.length ? ` ${tx("Skipped (already registered)")}: ${skipped.map((p) => fmt(p.calendar_date)).join(", ")}.` : "";
      if (failed.length) notify("error", `${tx("Could not save")}: ${failed.join("; ")}.${skippedText}`);
      else {
        setDialog(null);
        notify(saved ? "success" : "info", `${saved ? `${tx("Calendar day saved.")} (${saved})` : ""}${skippedText}`.trim());
      }
    } finally { setSaving(false); }
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
    { headerName: tx("Used by"), minWidth: 190, flex: 1,
      valueGetter: (p) => usedBy(p.data.shift_type).map((a) => shortArea(a.area_id)).join(", "),
      cellRenderer: (p) => {
        const used = usedBy(p.data.shift_type);
        if (!used.length) return <Typography variant="caption" color="text.disabled">{tx("Not assigned")}</Typography>;
        // first unit + "+N"; the tooltip lists every unit with its parent to tell same-named units apart
        const full = used.map((a) => {
          const node = areas.find((n) => n.id === Number(a.area_id));
          const parent = areas.find((n) => n.id === node?.parentId);
          return parent ? `${node?.name} (${parent.name})` : node?.name || EMPTY;
        });
        return (
          <Tooltip title={<Box>{full.map((t) => <div key={t}>{t}</div>)}</Box>} placement="top-start">
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", height: "100%", minWidth: 0 }}>
              <Typography variant="caption" noWrap sx={{ minWidth: 0 }}>{shortArea(used[0].area_id)}</Typography>
              {used.length > 1 ? (
                <Box component="span" sx={{ flexShrink: 0, px: 0.6, height: 18, display: "inline-flex", alignItems: "center", borderRadius: 1, fontSize: 10, fontWeight: 800, color: "#005BAB", bgcolor: "rgba(0,91,171,0.10)" }}>
                  +{used.length - 1}
                </Box>
              ) : null}
            </Stack>
          </Tooltip>
        );
      } },
    { headerName: tx("Status"), field: "status", width: 110, cellRenderer: (p) => <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}><StatusChip value={p.value} /></Box> },
  ], [areas, language, usedBy, shortArea]);

  const holidayCols = useMemo(() => [
    { headerName: tx("Date"), field: "calendar_date", width: 110 },
    { headerName: tx("Name"), field: "name", minWidth: 160, flex: 1 },
    { headerName: tx("Day Type"), field: "day_type", width: 160, valueGetter: (p) => dayLabel(p.data) },
    { headerName: tx("Applicable Area"), minWidth: 140, valueGetter: (p) => pathOf(p.data.applicable_area_id, areas) },
    { headerName: tx("Actions"), width: 90, sortable: false, filter: false, cellRenderer: (p) => (
      <Stack direction="row" sx={{ alignItems: "center", height: "100%" }}>
        <IconButton size="small" disabled={!canEdit} onClick={() => setDialog({ type: "calendarDay", item: p.data })}><EditOutlinedIcon fontSize="small" /></IconButton>
        <IconButton size="small" color="error" disabled={!canEdit} onClick={() => deleteCalendarDay(p.data)}><DeleteOutlineIcon fontSize="small" /></IconButton>
      </Stack>
    ) },
  ], [areas, canEdit, language]);


  const kpis = [
    { label: tx("Total Shifts"), value: stats.total_shifts, note: "", icon: CalendarMonthOutlinedIcon, tone: "primary" },
    { label: tx("Active Shifts"), value: stats.active_shifts, note: percent(stats.active_shifts), icon: CheckCircleOutlineIcon, tone: "success" },
    { label: tx("Working Days"), value: stats.working_days_this_month, note: tx("this month"), icon: PlayCircleOutlineIcon, tone: "info" },
    { label: tx("Holidays"), value: stats.holidays_this_month, note: tx("this month"), icon: EventBusyOutlinedIcon, tone: "warning" },
    { label: tx("Special Days"), value: stats.special_days_this_month, note: tx("this month"), icon: WarningAmberOutlinedIcon, tone: "accent" },
    { label: tx("Inactive Shifts"), value: Math.max(0, (stats.total_shifts || 0) - (stats.active_shifts || 0)), note: percent(Math.max(0, (stats.total_shifts || 0) - (stats.active_shifts || 0))), icon: PauseCircleOutlineIcon, tone: "danger" },
  ];

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box>
        <PageMeta title={`${tx("Shift & Calendar Master")} | VCC Plastics`} description={tx("Manage factory calendar, working shifts, holidays and special days")} />
        <PageBreadcrumb pageTitle={tx("Shift & Calendar Master")} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr auto" }, gap: 1.5, alignItems: "center", mb: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{tx("Shift & Calendar Master")}</Typography>
            <Typography variant="body2" color="text.secondary">{tx("Manage factory calendar, working shifts, holidays and special days")}</Typography>
          </Box>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2, justifyContent: "flex-end" }}>
            <SettingsMenu title={tx("Settings")} items={[
              { key: "holiday", label: tx("Holiday List"), icon: <EventBusyOutlinedIcon />, onClick: () => setDayList("HOLIDAY") },
              { key: "special", label: tx("Special Day List"), icon: <EventNoteOutlinedIcon />, onClick: () => setDayList("SPECIAL_DAY") },
              { key: "pattern", label: tx("Shift Pattern by Area"), icon: <AccountTreeOutlinedIcon />, onClick: () => setPatternOpen(true), divider: true },
            ]} />
            <Button disabled={!canEdit} startIcon={<AddIcon />} onClick={() => setDialog({ type: "shift" })} sx={btn("primary")}>{tx("Add New Shift")}</Button>
          </Stack>
        </Box>

        <KpiCardGroup>
          {kpis.map((k) => { const Icon = k.icon; return <KpiCard key={k.label} label={k.label} value={k.value} note={k.note} icon={<Icon />} tone={k.tone} />; })}
        </KpiCardGroup>

        <Paper variant="outlined" sx={{ my: 1.5, p: 1.5, borderRadius: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(240px,1.6fr) repeat(3,minmax(145px,1fr)) auto" }, gap: 1 }}>
            <TextField size="small" placeholder={tx("Search by shift code or name...")} value={keyword} onChange={(e) => setKeyword(e.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
            <FormControl size="small">
              <InputLabel>{tx("Shift Type")}</InputLabel>
              <Select label={tx("Shift Type")} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <MenuItem value="all">{tx("All Types")}</MenuItem>
                {shiftTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>{tx("Status")}</InputLabel>
              <Select label={tx("Status")} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">{tx("All Status")}</MenuItem>
                {STATUSES.map((s) => <MenuItem key={s} value={s}>{statusText(s)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>{tx("Applicable Area")}</InputLabel>
              <Select label={tx("Applicable Area")} value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}>
                <MenuItem value="all">{tx("All Areas")}</MenuItem>
                {areas.map((a) => <MenuItem key={a.id} value={a.id}>{pathOf(a.id, areas)}</MenuItem>)}
              </Select>
            </FormControl>
            <Button startIcon={<FilterListIcon />} onClick={() => { setKeyword(""); setTypeFilter("all"); setStatusFilter("all"); setAreaFilter("all"); }}
              sx={btn("cancel", { minHeight: 29, whiteSpace: "nowrap" })}>{tx("Clear")}</Button>
          </Box>
        </Paper>

        <Box ref={panelsRef} sx={masterGridSx}>
          <Paper elevation={0} sx={{ ...cardSx, height: panelHeight, display: "flex", flexDirection: "column" }}>
            <Head icon={<CalendarMonthOutlinedIcon color="primary" fontSize="small" />} title={tx("Calendar")}
              action={
                <Tooltip title={tx("Select area")}>
                  <IconButton size="small" onClick={(e) => setAreaAnchor(e.currentTarget)} color={calendarArea === "" ? "default" : "primary"}>
                    <AccountTreeOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              } />
            <Popover open={Boolean(areaAnchor)} anchorEl={areaAnchor} onClose={() => setAreaAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}
              PaperProps={{ sx: { width: 320, p: 1, display: "flex", flexDirection: "column", height: 360 } }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, px: 0.5, pb: 0.75 }}>{tx("Select area")}</Typography>
              <AreaTree areas={areas} value={calendarAreaId ?? ""} onChange={(id) => { setCalendarArea(id); setAreaAnchor(null); }} />
            </Popover>
            <MonthCalendar days={areaDays} month={month} onMonthChange={setMonth} localeTag={calendarLocaleTag()}
              areaLabel={calendarAreaId != null ? pathOf(calendarAreaId, areas) : null} />
          </Paper>

          <Paper elevation={0} sx={{ ...cardSx, height: panelHeight, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Head icon={<CalendarMonthOutlinedIcon color="primary" fontSize="small" />} title={`${tx("Shift List")} (${filtered.length})`} />
            <Box sx={{ p: 0.75, flex: 1, minHeight: 0 }}>
              <AgGridTable rowData={filtered} columnDefs={cols} loading={loading} pagination paginationPageSize={20} onRowClicked={(e) => setSelectedId(e.data.id)} getRowId={(p) => String(p.data.id)} height="100%" />
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ ...cardSx, height: panelHeight, display: "flex", flexDirection: "column" }}>
            <Head icon={<VisibilityOutlinedIcon color="primary" fontSize="small" />} title={tx("Shift Detail")} />
            {detail ? (
              <>
                <Box sx={{ p: 1.5 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr) auto", columnGap: 1.25, alignItems: "center" }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", color: "#FFF", bgcolor: detail.color_code || "#005BAB", alignSelf: "center" }}>
                      <AccessTimeOutlinedIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 0.25 }}>
                      <Typography noWrap sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>{detail.shift_name}</Typography>
                      <Typography noWrap color="text.secondary" sx={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2 }}>{detail.shift_code}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", alignSelf: "center" }}><StatusChip value={detail.status} /></Box>
                  </Box>
                  <Box sx={{ mt: 1.5, p: 1.25, borderRadius: 1.5, bgcolor: (t) => (t.palette.mode === "dark" ? "#182235" : "#F1F7FF") }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "center" }}>
                      <Typography sx={{ fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{detail.start_time}</Typography>
                      <Typography color="text.secondary" sx={{ fontSize: 13.5, lineHeight: 1 }}>→</Typography>
                      <Typography sx={{ fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{detail.end_time}</Typography>
                      {detail.is_overnight ? <Chip size="small" label={tx("Overnight Shift")} sx={{ height: 20, fontSize: 10, fontWeight: 800, bgcolor: "#EDE9FE", color: "#5B21B6" }} /> : null}
                    </Stack>
                  </Box>
                </Box>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ minHeight: 27, borderTop: 1, borderBottom: 1, borderColor: "divider", "& .MuiTab-root": { minHeight: 27, py: 0, fontSize: 11, fontWeight: 700, textTransform: "none" } }}>
                  <Tab label={tx("Information")} /><Tab label={tx("History")} />
                </Tabs>
                <Box sx={{ p: 1.5, flex: 1, overflow: "auto" }}>
                  {tab === 0 && (
                    <Stack spacing={1.5}>
                      <DetailSection title={tx("General")}>
                        <DetailRow label={tx("Shift Type")}>{detail.shift_type || EMPTY}</DetailRow>
                        <DetailRow label={tx("Effective Date")}>{detail.effective_date ? new Date(`${String(detail.effective_date).slice(0, 10)}T00:00:00`).toLocaleDateString(calendarLocaleTag(), { day: "2-digit", month: "2-digit", year: "numeric" }) : EMPTY}</DetailRow>
                        <DetailRow label={tx("Description")} last>{detail.description || EMPTY}</DetailRow>
                      </DetailSection>
                      <DetailSection title={tx("Used by")}>
                        {(() => {
                          const key = (detail.shift_type || "").trim().toLowerCase();
                          const used = assignments.filter((a) => a.shift_type.trim().toLowerCase() === key && String(a.effective_from).slice(0, 10) <= todayKey() && (!a.effective_to || String(a.effective_to).slice(0, 10) >= todayKey()));
                          return used.length ? used.map((a, i) => (
                            <DetailRow key={a.id} label={(() => { const node = areas.find((n) => n.id === Number(a.area_id)); const parent = areas.find((n) => n.id === node?.parentId); return <>{node?.name || EMPTY}{parent ? <Typography component="span" variant="caption" color="text.disabled"> · {parent.name}</Typography> : null}</>; })()} last={i === used.length - 1}>{tx("since")} {fmtDate(a.effective_from)}</DetailRow>
                          )) : <DetailRow label={tx("Not assigned to any unit")} last>{EMPTY}</DetailRow>;
                        })()}
                      </DetailSection>
                      <DetailSection title={tx("Rules")}>
                        <DetailRow label={tx("Overtime Allowed")}><YesNo value={detail.overtime_allowed} /></DetailRow>
                        <DetailRow label={tx("Allow Overlap")} last><YesNo value={detail.allow_overlap} /></DetailRow>
                      </DetailSection>
                    </Stack>
                  )}
                  {tab === 1 && (
                    <Stack spacing={1}>
                      {auditLog.length ? auditLog.map((a) => (
                        <Box key={a.id} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, px: 1.25, py: 0.9 }}>
                          <Typography variant="caption" sx={{ display: "block" }}>
                            <b>{tx(AUDIT_LABELS[a.action] || a.action)}:</b> {a.actor_name ? `${a.actor_name} - ${a.actor_code}` : a.actor_code || a.actor}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            {(() => {
                              const d = new Date(String(a.acted_at).replace(" ", "T"));
                              if (Number.isNaN(d.getTime())) return a.acted_at;
                              const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                              return `${time} ${tx("on")} ${d.toLocaleDateString(calendarLocaleTag(), { day: "2-digit", month: "2-digit", year: "numeric" })}`;
                            })()}
                            {a.remark ? ` · ${a.remark}` : ""}
                          </Typography>
                        </Box>
                      )) : <Typography variant="caption" color="text.secondary">{EMPTY}</Typography>}
                    </Stack>
                  )}
                </Box>
                <Divider />
                <Stack direction="row" sx={{ justifyContent: "center", gap: 1.5, p: 1.5 }}>
                  <Tooltip title={tx("Edit")}><span><IconButton disabled={!canEdit} onClick={() => setDialog({ type: "shift", item: detail })} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><EditOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
                  <Tooltip title={tx(detail.status === "ACTIVE" ? "Deactivate" : "Activate")}><span><IconButton disabled={!canEdit || saving} color={detail.status === "ACTIVE" ? "warning" : "success"} onClick={toggleStatus} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}>{detail.status === "ACTIVE" ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}</IconButton></span></Tooltip>
                  <Tooltip title={tx("Copy")}><span><IconButton disabled={!canEdit} onClick={() => setDialog({ type: "copyShift" })} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><ContentCopyOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
                  <Tooltip title={tx("Delete")}><span><IconButton disabled={!canEdit || saving} color="error" onClick={deleteShift} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><DeleteOutlineIcon fontSize="small" /></IconButton></span></Tooltip>
                </Stack>
              </>
            ) : (
              <Box sx={{ flex: 1, display: "grid", placeItems: "center" }}><Typography color="text.secondary">{tx("Select a shift to view details.")}</Typography></Box>
            )}
          </Paper>
        </Box>

        {patternOpen && (
          <PatternDialog areas={areas} patterns={patterns} assignments={assignments} areaPatterns={areaPatterns} canEdit={canEdit} actor={actor}
            request={request} notify={notify} onChanged={loadPatterns} onClose={() => setPatternOpen(false)} />
        )}
        {dayList && (
          <DayListDialog kind={dayList} days={allDays} columns={holidayCols} canEdit={canEdit} onClose={() => setDayList(null)}
            onAdd={() => setDialog({ type: "calendarDay", defaultType: DAY_LISTS[dayList].types[0] })} />
        )}

        {dialog?.type === "shift" && (
          <ShiftForm item={dialog.item} areas={areas} actor={actor} saving={saving} onClose={() => setDialog(null)} onSave={saveShift} />
        )}
        {dialog?.type === "copyShift" && (
          <CopyShiftDialog saving={saving} onClose={() => setDialog(null)} onConfirm={copyShift} />
        )}
        {dialog?.type === "calendarDay" && (
          <CalendarDayForm item={dialog.item} defaultDate={dialog.defaultDate} defaultType={dialog.defaultType} areas={areas} days={allDays} actor={actor} saving={saving} onClose={() => setDialog(null)} onSave={saveCalendarDay} />
        )}

        <Snackbar open={msg.open} autoHideDuration={4500} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}
