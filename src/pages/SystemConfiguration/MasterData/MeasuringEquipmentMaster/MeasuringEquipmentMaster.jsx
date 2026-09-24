import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, Divider, FormControl, IconButton, InputAdornment,
  InputLabel, MenuItem, Paper, Select, Snackbar, Stack, Tab,
  Tabs, TextField, ThemeProvider as MuiThemeProvider, Tooltip, Typography, createTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircle";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircle";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

import { getAccessToken, getCurrentUser } from "../../../../auth/auth";
import usePagePermission from "../../../../auth/usePagePermission";
import { buttonSystem } from "../../../../components/button/ButtonSystem";
import ImageUploadField, { resolveImageUrl } from "../../../../components/common/ImageUploadField";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import PageMeta from "../../../../components/common/PageMeta";
import { KpiCard, KpiCardGroup } from "../../../../components/kpi/KpiCardSystem";
import AgGridTable from "../../../../components/tables/BasicTables/BasicTableOne";
import { API_CONFIG } from "../../../../config/config";
import { useTheme as useAppTheme } from "../../../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { categoryText, setActiveLanguage, statusText, tx } from "./locales";

const BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const API = `${BASE}/api/measuring-equipment-master`;
const FACTORY_API = `${BASE}/api/factory-structure`;
const EMPTY = "—";
const STATUSES = ["AVAILABLE", "IN_USE", "OUT_OF_SERVICE", "INACTIVE"];
const CATEGORIES = ["DIMENSIONAL", "ELECTRICAL", "PHYSICAL_TEST", "VISION_OPTICAL", "OTHER"];
const CALIBRATION_RESULTS = ["PASS", "FAIL", "ADJUSTED"];
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

const STATUS_TONES = { AVAILABLE: "info", IN_USE: "success", OUT_OF_SERVICE: "warning", INACTIVE: "default" };
function StatusChip({ value }) {
  return <Chip size="small" variant="outlined" color={STATUS_TONES[value] || "default"} label={statusText(value)} sx={{ height: 21, fontSize: 10, fontWeight: 800 }} />;
}

const CAL_TONES = { VALID: "success", DUE_SOON: "warning", OVERDUE: "error" };
function calibrationStatusOf(nextDate) {
  if (!nextDate) return "VALID";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(nextDate);
  const days = Math.round((due - today) / 86400000);
  if (days < 0) return "OVERDUE";
  if (days <= 30) return "DUE_SOON";
  return "VALID";
}
function CalibrationChip({ nextDate }) {
  const value = calibrationStatusOf(nextDate);
  return <Chip size="small" variant="outlined" color={CAL_TONES[value]} label={statusText(value)} sx={{ height: 21, fontSize: 10, fontWeight: 800 }} />;
}

function normalNode(n) { return { ...n, id: Number(n.id), parentId: n.parent_id == null ? null : Number(n.parent_id) }; }
function pathOf(id, nodes) {
  const names = [], seen = new Set();
  let n = nodes.find((x) => x.id === Number(id));
  while (n && !seen.has(n.id)) { seen.add(n.id); names.unshift(n.name); n = nodes.find((x) => x.id === n.parentId); }
  return names.join(" / ") || EMPTY;
}

function formatDisplayDate(iso) {
  if (!iso) return EMPTY;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function CategoryTree({ types, rows, selectedTypeId, onSelect }) {
  const [expanded, setExpanded] = useState(() => CATEGORIES);
  const toggle = (cat) => setExpanded((old) => (old.includes(cat) ? old.filter((x) => x !== cat) : [...old, cat]));
  const byCategory = CATEGORIES.map((cat) => ({
    category: cat,
    types: types.filter((t) => t.category === cat),
  })).filter((g) => g.types.length);
  const countForType = (typeId) => rows.filter((r) => Number(r.equipment_type_id) === Number(typeId)).length;
  return (
    <Box sx={{ p: 0.75, overflow: "auto" }}>
      <Box onClick={() => onSelect(null)} sx={{ p: 0.75, borderRadius: 1, cursor: "pointer", bgcolor: selectedTypeId == null ? "action.selected" : "transparent" }}>
        <Typography fontSize={11.5} fontWeight={800}>{tx("All equipment")} ({rows.length})</Typography>
      </Box>
      {byCategory.map((group) => {
        const open = expanded.includes(group.category);
        const count = group.types.reduce((sum, t) => sum + countForType(t.id), 0);
        return (
          <Box key={group.category}>
            <Box onClick={() => toggle(group.category)} sx={{ display: "flex", alignItems: "center", gap: 0.4, minHeight: 28, cursor: "pointer", borderRadius: 1, "&:hover": { bgcolor: "action.hover" } }}>
              <IconButton size="small" sx={{ width: 20, height: 20 }}>{open ? <ExpandMoreIcon sx={{ fontSize: 16 }} /> : <ChevronRightIcon sx={{ fontSize: 16 }} />}</IconButton>
              <Typography noWrap sx={{ flex: 1, fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "text.secondary" }}>{categoryText(group.category)}</Typography>
              <Chip label={count} size="small" variant="outlined" sx={{ height: 18, mr: 0.5, "& .MuiChip-label": { px: 0.5, fontSize: 9.5 } }} />
            </Box>
            {open && group.types.map((t) => (
              <Box key={t.id} onClick={() => onSelect(t.id)} sx={{ pl: 3.2, minHeight: 28, display: "flex", alignItems: "center", gap: 0.4, cursor: "pointer", borderRadius: 1, bgcolor: selectedTypeId === t.id ? "action.selected" : "transparent", "&:hover": { bgcolor: "action.hover" } }}>
                <StraightenOutlinedIcon color={selectedTypeId === t.id ? "primary" : "inherit"} sx={{ fontSize: 14 }} />
                <Typography noWrap sx={{ flex: 1, fontSize: 11.5, fontWeight: selectedTypeId === t.id ? 800 : 600 }}>{t.type_name}</Typography>
                <Chip label={countForType(t.id)} size="small" variant="outlined" color={selectedTypeId === t.id ? "primary" : "default"} sx={{ height: 18, mr: 0.5, "& .MuiChip-label": { px: 0.5, fontSize: 9.5 } }} />
              </Box>
            ))}
          </Box>
        );
      })}
    </Box>
  );
}

function EquipmentForm({ item, types, nodes, actor, saving, onClose, onSave }) {
  const [f, setF] = useState(item ? {
    code: item.equipment_code, name: item.equipment_name, type: item.equipment_type_id, node: item.factory_node_id,
    maker: item.manufacturer || "", model: item.model || "", serial: item.serial_number || "",
    range: item.measurement_range || "", resolution: item.resolution || "", accuracy: item.accuracy || "",
    cycle: item.calibration_cycle_days, status: item.status, note: item.description || "", image: item.image_url || "", version: item.version,
  } : {
    code: "", name: "", type: "", node: "", maker: "", model: "", serial: "",
    range: "", resolution: "", accuracy: "", cycle: 180, status: "AVAILABLE", note: "", image: "", version: 1,
  });
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const submit = () => onSave({
    equipment_code: f.code.trim().toUpperCase(), equipment_name: f.name.trim(), equipment_type_id: Number(f.type),
    factory_node_id: Number(f.node), manufacturer: f.maker.trim() || null, model: f.model.trim() || null,
    serial_number: f.serial.trim() || null, measurement_range: f.range.trim() || null, resolution: f.resolution.trim() || null,
    accuracy: f.accuracy.trim() || null, calibration_cycle_days: Number(f.cycle), status: f.status, description: f.note.trim() || null,
    image_url: f.image || null,
    ...(item ? { version: Number(f.version), updated_by: actor } : { created_by: actor }),
  });
  return (
    <Dialog open fullWidth maxWidth="md" onClose={saving ? undefined : onClose} PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<StraightenOutlinedIcon />} title={tx(item ? "Edit Equipment" : "Add New Measuring Equipment")} disabled={saving} onClose={onClose} />
      <DialogContent>
        <Stack spacing={1.7} sx={{ pt: 1 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField required fullWidth size="small" disabled={Boolean(item)} label={tx("Equipment Code")} value={f.code} onChange={ch("code")} />
            <TextField required fullWidth size="small" label={tx("Equipment Name")} value={f.name} onChange={ch("name")} />
            <FormControl required fullWidth size="small">
              <InputLabel>{tx("Equipment Type")}</InputLabel>
              <Select label={tx("Equipment Type")} value={f.type} onChange={ch("type")}>
                {types.filter((x) => x.is_active).map((x) => <MenuItem key={x.id} value={x.id}>{x.type_name}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <FormControl required fullWidth size="small">
              <InputLabel>{tx("Location")}</InputLabel>
              <Select label={tx("Location")} value={f.node} onChange={ch("node")}>
                {nodes.filter((x) => x.status === "ACTIVE").map((x) => <MenuItem key={x.id} value={x.id}>{pathOf(x.id, nodes)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>{tx("Status")}</InputLabel>
              <Select label={tx("Status")} value={f.status} onChange={ch("status")}>
                {STATUSES.map((x) => <MenuItem key={x} value={x}>{statusText(x)}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
          <Divider><Chip size="small" label={tx("General")} /></Divider>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField fullWidth size="small" label={tx("Manufacturer")} value={f.maker} onChange={ch("maker")} />
            <TextField fullWidth size="small" label={tx("Model")} value={f.model} onChange={ch("model")} />
            <TextField fullWidth size="small" label={tx("Serial Number")} value={f.serial} onChange={ch("serial")} />
          </Stack>
          <Divider><Chip size="small" label={tx("Specification")} /></Divider>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField fullWidth size="small" label={tx("Measurement Range")} value={f.range} onChange={ch("range")} />
            <TextField fullWidth size="small" label={tx("Resolution")} value={f.resolution} onChange={ch("resolution")} />
            <TextField fullWidth size="small" label={tx("Accuracy")} value={f.accuracy} onChange={ch("accuracy")} />
            <TextField required fullWidth size="small" type="number" label={tx("Calibration Cycle (days)")} value={f.cycle} onChange={ch("cycle")} />
          </Stack>
          <TextField fullWidth multiline minRows={2} label={tx("Description")} value={f.note} onChange={ch("note")} />
          <ImageUploadField value={f.image} category="measuring_equipment" label={tx("Image")} disabled={saving} onChange={(v) => setF((o) => ({ ...o, image: v || "" }))} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Cancel")}</Button>
        <Button onClick={submit} disabled={saving || !f.code.trim() || !f.name.trim() || !f.type || !f.node || !f.cycle} sx={btn("primary")} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
          {tx("Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CalibrationHistoryDialog({ equipment, actor, request, saving, onClose, onDone, notify }) {
  const [records, setRecords] = useState(equipment.recent_calibrations || []);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), result: "PASS", by: "", cert: "", remark: "" });
  const load = useCallback(async () => {
    setLoading(true);
    try { setRecords(await request(`${API}/equipment/${equipment.id}/calibration-history`)); }
    catch (e) { notify("error", e.message); }
    finally { setLoading(false); }
  }, [equipment.id, request, notify]);
  useEffect(() => { load(); }, [load]);
  const ch = (k) => (e) => setForm((o) => ({ ...o, [k]: e.target.value }));
  const submit = async () => {
    try {
      await request(`${API}/equipment/${equipment.id}/calibration-history`, {
        method: "POST",
        body: JSON.stringify({
          calibration_date: form.date, result: form.result, calibrated_by: form.by.trim() || null,
          certificate_no: form.cert.trim() || null, remark: form.remark.trim() || null, created_by: actor,
        }),
      });
      await load();
      notify("success", tx("Calibration record saved."));
      await onDone();
    } catch (e) { notify("error", e.message); }
  };
  return (
    <Dialog open fullWidth maxWidth="sm" onClose={saving ? undefined : onClose} PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<HistoryOutlinedIcon />} title={`${tx("Calibration History")} · ${equipment.equipment_code}`} disabled={saving} onClose={onClose} />
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 1 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField fullWidth size="small" type="date" label={tx("Calibration Date")} value={form.date} onChange={ch("date")} InputLabelProps={{ shrink: true }} />
            <FormControl fullWidth size="small">
              <InputLabel>{tx("Result")}</InputLabel>
              <Select label={tx("Result")} value={form.result} onChange={ch("result")}>
                {CALIBRATION_RESULTS.map((x) => <MenuItem key={x} value={x}>{statusText(x)}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField fullWidth size="small" label={tx("Calibrated By")} value={form.by} onChange={ch("by")} />
            <TextField fullWidth size="small" label={tx("Certificate No.")} value={form.cert} onChange={ch("cert")} />
          </Stack>
          <TextField fullWidth size="small" multiline minRows={2} label={tx("Remark")} value={form.remark} onChange={ch("remark")} />
          <Button onClick={submit} startIcon={<AddIcon />} sx={btn("primary")}>{tx("Add Calibration Record")}</Button>
          <Divider />
          {loading ? <Stack alignItems="center" py={2}><CircularProgress size={22} /></Stack> : records.length ? (
            <Stack divider={<Divider />} sx={{ maxHeight: 260, overflow: "auto" }}>
              {records.map((r) => (
                <Stack key={r.id} direction="row" justifyContent="space-between" alignItems="center" py={1}>
                  <Box minWidth={0}>
                    <Typography variant="caption" fontWeight={700} display="block">{formatDisplayDate(r.calibration_date)} → {formatDisplayDate(r.next_due_date)}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">{r.calibrated_by || EMPTY} {r.certificate_no ? `· ${r.certificate_no}` : ""}</Typography>
                  </Box>
                  <StatusChip value={r.result} />
                </Stack>
              ))}
            </Stack>
          ) : <Alert severity="info">{tx("No calibration records yet.")}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Close")}</Button>
      </DialogActions>
    </Dialog>
  );
}

function TypesManager({ rows, actor, canEdit, request, onClose, onRefresh, notify }) {
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const empty = { code: "", name: "", category: "DIMENSIONAL", active: true, sort: 0, description: "" };
  const [form, setForm] = useState(empty);
  const beginAdd = () => { setEditing({ isNew: true }); setForm(empty); };
  const beginEdit = (item) => { setEditing(item); setForm({ code: item.type_code, name: item.type_name, category: item.category, active: Boolean(item.is_active), sort: item.sort_order || 0, description: item.description || "" }); };
  const change = (key) => (event) => setForm((old) => ({ ...old, [key]: event.target.value }));
  const save = async () => {
    setSaving(true);
    try {
      const isNew = editing?.isNew;
      const payload = { ...(isNew ? { type_code: form.code.trim().toUpperCase(), created_by: actor } : { updated_by: actor }),
        type_name: form.name.trim(), category: form.category, description: form.description.trim() || null,
        is_active: Boolean(form.active), sort_order: Number(form.sort) };
      const result = await request(isNew ? `${API}/types` : `${API}/types/${editing.id}`, { method: isNew ? "POST" : "PUT", body: JSON.stringify(payload) });
      await onRefresh(); setEditing(null); notify("success", result.message || "Saved.");
    } catch (error) { notify("error", error.message); } finally { setSaving(false); }
  };
  const remove = async (item) => {
    if (!window.confirm(`${tx("Are you sure you want to delete this item?")} (${item.type_name})`)) return;
    setSaving(true);
    try { const result = await request(`${API}/types/${item.id}`, { method: "DELETE" }); await onRefresh(); notify("success", result.message || "Deleted."); }
    catch (error) { notify("error", error.message); } finally { setSaving(false); }
  };
  const cols = [
    { headerName: tx("Code"), field: "type_code", width: 130, pinned: "left" },
    { headerName: tx("Name"), field: "type_name", minWidth: 170, flex: 1 },
    { headerName: tx("Category"), field: "category", width: 160, valueFormatter: (p) => categoryText(p.value) },
    { headerName: tx("Status"), width: 95, cellRenderer: (p) => <Box height="100%" display="flex" alignItems="center"><StatusChip value={p.data.is_active ? "AVAILABLE" : "INACTIVE"} /></Box> },
    { headerName: tx("Actions"), width: 100, sortable: false, filter: false, cellRenderer: (p) => (
      <Stack direction="row" alignItems="center" height="100%">
        <IconButton size="small" disabled={!canEdit} onClick={() => beginEdit(p.data)}><EditOutlinedIcon fontSize="small" /></IconButton>
        <IconButton size="small" color="error" disabled={!canEdit || saving} onClick={() => remove(p.data)}><DeleteOutlineIcon fontSize="small" /></IconButton>
      </Stack>
    ) },
  ];
  return (
    <Dialog open fullWidth maxWidth="md" onClose={saving ? undefined : onClose} PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<CategoryOutlinedIcon />} title={tx("Master Data Configuration")} subtitle={tx("Equipment Types")} disabled={saving} onClose={onClose} />
      <DialogContent sx={{ p: 1.5 }}>
        {editing ? (
          <Stack spacing={1.5} sx={{ pt: 0.5 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField fullWidth required size="small" label={tx("Code")} disabled={!editing.isNew} value={form.code} onChange={change("code")} />
              <TextField fullWidth required size="small" label={tx("Name")} value={form.name} onChange={change("name")} />
            </Stack>
            <FormControl fullWidth size="small">
              <InputLabel>{tx("Category")}</InputLabel>
              <Select label={tx("Category")} value={form.category} onChange={change("category")}>
                {CATEGORIES.map((value) => <MenuItem key={value} value={value}>{categoryText(value)}</MenuItem>)}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1.5}>
              <TextField fullWidth size="small" type="number" label={tx("Sort Order")} value={form.sort} onChange={change("sort")} />
              <FormControl fullWidth size="small">
                <InputLabel>{tx("Status")}</InputLabel>
                <Select label={tx("Status")} value={form.active} onChange={change("active")}>
                  <MenuItem value={true}>{statusText("AVAILABLE")}</MenuItem>
                  <MenuItem value={false}>{statusText("INACTIVE")}</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <TextField fullWidth multiline minRows={2} label={tx("Description")} value={form.description} onChange={change("description")} />
          </Stack>
        ) : (
          <Box sx={{ height: 430 }}>
            <AgGridTable rowData={rows} columnDefs={cols} height="100%" pagination paginationPageSize={20} getRowId={(p) => String(p.data.id)} />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button disabled={saving} onClick={editing ? () => setEditing(null) : onClose} sx={btn("cancel")}>{tx(editing ? "Back" : "Close")}</Button>
        {editing
          ? <Button disabled={saving || !form.code.trim() || !form.name.trim()} onClick={save} sx={btn("primary")} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>{tx("Save")}</Button>
          : <Button disabled={!canEdit} onClick={beginAdd} startIcon={<AddIcon />} sx={btn("primary")}>{tx("Add New")}</Button>}
      </DialogActions>
    </Dialog>
  );
}

export default function MeasuringEquipmentMaster() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  const { theme } = useAppTheme();
  const muiTheme = useMemo(() => pageTheme(theme), [theme]);
  const { canEdit } = usePagePermission();
  const actor = getCurrentUser()?.employee_code || "SYSTEM";

  const [rows, setRows] = useState([]);
  const [types, setTypes] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [stats, setStats] = useState({ total: 0, in_use: 0, available: 0, calibration_due_soon: 0, calibration_overdue: 0, out_of_use: 0 });
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [typeFilterTree, setTypeFilterTree] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [nodeFilter, setNodeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [calFilter, setCalFilter] = useState("all");
  const [manufacturerFilter, setManufacturerFilter] = useState("all");
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
      const error = new Error(response.status === 409 ? (data?.detail || tx("This record was changed by someone else. Please reload and try again.")) : data?.detail || data?.message || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return data;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statData, equipData, typeData, nodeData] = await Promise.all([
        request(`${API}/statistics`), request(`${API}/equipment?limit=2000`), request(`${API}/types`), request(`${FACTORY_API}/nodes`),
      ]);
      const list = equipData?.items || [];
      const nodeList = (Array.isArray(nodeData) ? nodeData : nodeData?.items || []).map(normalNode);
      setStats(statData); setRows(list); setTypes(typeData || []); setNodes(nodeList);
      setSelectedId((old) => (list.some((x) => x.id === old) ? old : list[0]?.id ?? null));
    } catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [notify, request]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    request(`${API}/equipment/${selectedId}`).then(setDetail).catch((e) => notify("error", e.message));
  }, [selectedId, request, notify]);

  const selected = detail || rows.find((x) => x.id === selectedId);
  const manufacturers = useMemo(() => [...new Set(rows.map((x) => x.manufacturer).filter(Boolean))].sort(), [rows]);

  const filtered = useMemo(() => {
    const q = keyword.toLowerCase().trim();
    return rows.filter((x) => {
      if (q && !`${x.equipment_code} ${x.equipment_name} ${x.model || ""}`.toLowerCase().includes(q)) return false;
      if (typeFilter !== "all" && Number(x.equipment_type_id) !== Number(typeFilter)) return false;
      if (typeFilterTree != null && Number(x.equipment_type_id) !== Number(typeFilterTree)) return false;
      if (nodeFilter !== "all" && Number(x.factory_node_id) !== Number(nodeFilter)) return false;
      if (statusFilter !== "all" && x.status !== statusFilter) return false;
      if (manufacturerFilter !== "all" && x.manufacturer !== manufacturerFilter) return false;
      if (calFilter !== "all" && calibrationStatusOf(x.next_calibration_date) !== calFilter) return false;
      return true;
    });
  }, [rows, keyword, typeFilter, typeFilterTree, nodeFilter, statusFilter, manufacturerFilter, calFilter]);

  const percent = (n) => (stats.total ? `${((n / stats.total) * 100).toFixed(1)}% ${tx("of total")}` : `0% ${tx("of total")}`);

  const openEdit = async (id) => { try { setDialog({ type: "equipment", item: await request(`${API}/equipment/${id}`) }); } catch (e) { notify("error", e.message); } };
  const saveEquipment = async (payload) => {
    setSaving(true);
    try {
      const item = dialog.item;
      const result = await request(item ? `${API}/equipment/${item.id}` : `${API}/equipment`, { method: item ? "PUT" : "POST", body: JSON.stringify(payload) });
      setDialog(null); await load(); if (result.id) setSelectedId(result.id); setDetail(null);
      notify("success", result.message || tx("Equipment saved."));
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const toggleStatus = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const next = selected.status === "IN_USE" ? "AVAILABLE" : "IN_USE";
      await request(`${API}/equipment/${selected.id}/status`, { method: "PATCH", body: JSON.stringify({ status: next, version: selected.version, updated_by: actor }) });
      await load(); setDetail(null); notify("success", tx("Status updated."));
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };

  const cols = useMemo(() => [
    { headerName: tx("Equipment Code"), field: "equipment_code", width: 130, pinned: "left" },
    { headerName: tx("Equipment Name"), field: "equipment_name", minWidth: 170, flex: 1.2 },
    { headerName: tx("Equipment Type"), field: "type_name", minWidth: 150 },
    { headerName: tx("Manufacturer"), field: "manufacturer", minWidth: 130, valueFormatter: (p) => p.value || EMPTY },
    { headerName: tx("Location"), minWidth: 160, valueGetter: (p) => pathOf(p.data.factory_node_id, nodes) },
    { headerName: tx("Status"), field: "status", width: 120, cellRenderer: (p) => <Box height="100%" display="flex" alignItems="center"><StatusChip value={p.value} /></Box> },
    { headerName: tx("Next Calibration Date"), field: "next_calibration_date", width: 150, cellRenderer: (p) => <Box height="100%" display="flex" alignItems="center" gap={0.5}><Typography variant="caption">{formatDisplayDate(p.value)}</Typography><CalibrationChip nextDate={p.value} /></Box> },
    { headerName: tx("Actions"), width: 110, sortable: false, filter: false, cellRenderer: (p) => (
      <Stack direction="row" alignItems="center" height="100%">
        <IconButton size="small" onClick={() => setSelectedId(p.data.id)}><VisibilityOutlinedIcon fontSize="small" /></IconButton>
        <IconButton size="small" disabled={!canEdit} onClick={() => openEdit(p.data.id)}><EditOutlinedIcon fontSize="small" /></IconButton>
      </Stack>
    ) },
  ], [nodes, canEdit, language]);

  const general = selected ? [
    [tx("Equipment Code"), selected.equipment_code], [tx("Equipment Name"), selected.equipment_name],
    [tx("Equipment Type"), selected.type_name], [tx("Category"), categoryText(selected.category)],
    [tx("Location"), pathOf(selected.factory_node_id, nodes)], [tx("Manufacturer"), selected.manufacturer],
    [tx("Model"), selected.model], [tx("Serial Number"), selected.serial_number], [tx("Description"), selected.description],
  ] : [];
  const spec = selected ? [
    [tx("Measurement Range"), selected.measurement_range], [tx("Resolution"), selected.resolution],
    [tx("Accuracy"), selected.accuracy], [tx("Calibration Cycle (days)"), selected.calibration_cycle_days],
    [tx("Last Calibration Date"), formatDisplayDate(selected.last_calibration_date)],
    [tx("Next Calibration Date"), formatDisplayDate(selected.next_calibration_date)],
  ] : [];

  const kpis = [
    { label: tx("Total Equipment"), value: stats.total, note: tx("All equipment"), icon: StraightenOutlinedIcon, tone: "primary" },
    { label: tx("In Use"), value: stats.in_use, note: percent(stats.in_use), icon: PlayCircleOutlineIcon, tone: "success" },
    { label: tx("Available"), value: stats.available, note: percent(stats.available), icon: FactCheckOutlinedIcon, tone: "info" },
    { label: tx("Calibration Due Soon"), value: stats.calibration_due_soon, note: percent(stats.calibration_due_soon), icon: EventAvailableOutlinedIcon, tone: "warning" },
    { label: tx("Calibration Overdue"), value: stats.calibration_overdue, note: percent(stats.calibration_overdue), icon: WarningAmberOutlinedIcon, tone: "danger" },
    { label: tx("Out of Use"), value: stats.out_of_use, note: percent(stats.out_of_use), icon: PauseCircleOutlineIcon, tone: "accent" },
  ];

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box>
        <PageMeta title={`${tx("Measuring Equipment Master")} | VCC Plastics`} description={tx("Manage all measuring and inspection equipment in the system")} />
        <PageBreadcrumb pageTitle={tx("Measuring Equipment Master")} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr auto" }, gap: 1.5, alignItems: "center", mb: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800}>{tx("Measuring Equipment Master")}</Typography>
            <Typography variant="body2" color="text.secondary">{tx("Manage all measuring and inspection equipment in the system")}</Typography>
          </Box>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2, justifyContent: "flex-end" }}>
            <Button disabled={!canEdit} startIcon={<AddIcon />} onClick={() => setDialog({ type: "equipment", item: null })} sx={btn("primary")}>{tx("Add New Equipment")}</Button>
            <Button startIcon={<SettingsOutlinedIcon />} onClick={() => setDialog({ type: "types" })} sx={btn("edit")}>{tx("Settings")}</Button>
          </Stack>
        </Box>

        <KpiCardGroup>
          {kpis.map((k) => { const Icon = k.icon; return <KpiCard key={k.label} label={k.label} value={k.value} note={k.note} icon={<Icon />} tone={k.tone} />; })}
        </KpiCardGroup>

        <Paper elevation={0} sx={{ ...cardSx, my: 1.5, p: 1 }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={1} flexWrap="wrap">
            <TextField size="small" placeholder={tx("Search by equipment code or name...")} value={keyword} onChange={(e) => setKeyword(e.target.value)} sx={{ minWidth: 230 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{tx("Equipment Type")}</InputLabel>
              <Select label={tx("Equipment Type")} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <MenuItem value="all">{tx("All Types")}</MenuItem>
                {types.map((x) => <MenuItem key={x.id} value={x.id}>{x.type_name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{tx("Location")}</InputLabel>
              <Select label={tx("Location")} value={nodeFilter} onChange={(e) => setNodeFilter(e.target.value)}>
                <MenuItem value="all">{tx("All locations")}</MenuItem>
                {nodes.map((x) => <MenuItem key={x.id} value={x.id}>{pathOf(x.id, nodes)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{tx("Status")}</InputLabel>
              <Select label={tx("Status")} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">{tx("All Status")}</MenuItem>
                {STATUSES.map((x) => <MenuItem key={x} value={x}>{statusText(x)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel>{tx("All Calibration Status")}</InputLabel>
              <Select label={tx("All Calibration Status")} value={calFilter} onChange={(e) => setCalFilter(e.target.value)}>
                <MenuItem value="all">{tx("All Calibration Status")}</MenuItem>
                <MenuItem value="VALID">{statusText("VALID")}</MenuItem>
                <MenuItem value="DUE_SOON">{statusText("DUE_SOON")}</MenuItem>
                <MenuItem value="OVERDUE">{statusText("OVERDUE")}</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>{tx("Manufacturer")}</InputLabel>
              <Select label={tx("Manufacturer")} value={manufacturerFilter} onChange={(e) => setManufacturerFilter(e.target.value)}>
                <MenuItem value="all">{tx("All Manufacturers")}</MenuItem>
                {manufacturers.map((x) => <MenuItem key={x} value={x}>{x}</MenuItem>)}
              </Select>
            </FormControl>
            <Button onClick={() => { setKeyword(""); setTypeFilter("all"); setNodeFilter("all"); setStatusFilter("all"); setCalFilter("all"); setManufacturerFilter("all"); setTypeFilterTree(null); }} sx={btn("cancel")}>{tx("Clear")}</Button>
          </Stack>
        </Paper>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "230px minmax(0,1fr) 330px" }, gap: 1.5 }}>
          <Paper elevation={0} sx={{ ...cardSx, height: 555, display: "flex", flexDirection: "column" }}>
            <Head icon={<AccountTreeOutlinedIcon color="primary" fontSize="small" />} title={tx("Equipment Hierarchy")} />
            <CategoryTree types={types} rows={rows} selectedTypeId={typeFilterTree} onSelect={setTypeFilterTree} />
          </Paper>
          <Paper elevation={0} sx={{ ...cardSx, height: 555, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Head icon={<StraightenOutlinedIcon color="primary" fontSize="small" />} title={`${tx("Equipment List")} (${filtered.length})`} />
            <Box sx={{ p: 0.75, flex: 1, minHeight: 0 }}>
              <AgGridTable rowData={filtered} columnDefs={cols} loading={loading} pagination paginationPageSize={20} onRowClicked={(e) => setSelectedId(e.data.id)} getRowId={(p) => String(p.data.id)} height="100%" />
            </Box>
          </Paper>
          <Paper elevation={0} sx={{ ...cardSx, height: 555, display: "flex", flexDirection: "column" }}>
            <Head icon={<VisibilityOutlinedIcon color="primary" fontSize="small" />} title={tx("Equipment Detail")} />
            {selected ? (
              <>
                <Box sx={{ p: 1.5, borderBottom: 1, borderColor: "divider" }}>
                  {selected.image_url ? <Box component="img" src={resolveImageUrl(selected.image_url)} alt="" sx={{ width: "100%", height: 110, objectFit: "contain", bgcolor: "action.hover", borderRadius: 1.5, mb: 1 }} /> : null}
                  <Stack direction="row" spacing={0.7} alignItems="center">
                    <Typography fontWeight={800}>{selected.equipment_code}</Typography>
                    <StatusChip value={selected.status} />
                    <CalibrationChip nextDate={selected.next_calibration_date} />
                  </Stack>
                  <Typography noWrap variant="body2" color="text.secondary">{selected.equipment_name}</Typography>
                </Box>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ minHeight: 36, borderBottom: 1, borderColor: "divider", "& .MuiTab-root": { minHeight: 36, p: 0, fontSize: 10.5, fontWeight: 700 } }}>
                  <Tab label={tx("General")} /><Tab label={tx("Specification")} />
                </Tabs>
                <Box sx={{ p: 1.5, flex: 1, overflow: "auto" }}>
                  <Stack spacing={0.85}>
                    {(tab === 0 ? general : spec).map(([label, value]) => (
                      <Box key={label} sx={{ display: "grid", gridTemplateColumns: "45% 55%", gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                        <Typography variant="caption" fontWeight={700}>{value || EMPTY}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
                <Divider />
                <Stack direction="row" sx={{ justifyContent: "center", gap: 2.5, p: 1.5 }}>
                  <Tooltip title={tx("Edit equipment")}>
                    <span><IconButton disabled={!canEdit} color="primary" onClick={() => openEdit(selected.id)} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><EditOutlinedIcon /></IconButton></span>
                  </Tooltip>
                  <Tooltip title={tx("View calibration history")}>
                    <span><IconButton color="secondary" onClick={() => setDialog({ type: "calibration", item: selected })} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><HistoryOutlinedIcon /></IconButton></span>
                  </Tooltip>
                  <Tooltip title={tx("Toggle Available / In Use")}>
                    <span><IconButton disabled={!canEdit || saving} color={selected.status === "IN_USE" ? "warning" : "success"} onClick={toggleStatus} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}>
                      {selected.status === "IN_USE" ? <PauseCircleOutlineIcon /> : <PlayCircleOutlineIcon />}
                    </IconButton></span>
                  </Tooltip>
                </Stack>
              </>
            ) : (
              <Box flex={1} display="grid" sx={{ placeItems: "center" }}><Typography color="text.secondary">{tx("Select equipment to view details.")}</Typography></Box>
            )}
          </Paper>
        </Box>

        {dialog?.type === "equipment" && (
          <EquipmentForm key={dialog.item?.id || "new"} item={dialog.item} types={types} nodes={nodes} actor={actor} saving={saving} onClose={() => setDialog(null)} onSave={saveEquipment} />
        )}
        {dialog?.type === "calibration" && (
          <CalibrationHistoryDialog equipment={dialog.item} actor={actor} request={request} saving={saving} notify={notify} onClose={() => setDialog(null)}
            onDone={async () => { const d = await request(`${API}/equipment/${dialog.item.id}`); setDetail(d); await load(); }} />
        )}
        {dialog?.type === "types" && (
          <TypesManager rows={types} actor={actor} canEdit={canEdit} request={request} onClose={() => setDialog(null)} onRefresh={load} notify={notify} />
        )}
        <Snackbar open={msg.open} autoHideDuration={4500} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}