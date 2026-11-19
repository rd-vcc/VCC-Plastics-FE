import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  ThemeProvider as MuiThemeProvider,
  Tooltip,
  Typography,
  createTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import CheckIcon from "@mui/icons-material/Check";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import SearchIcon from "@mui/icons-material/Search";
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";

import PageMeta from "../../../../components/common/PageMeta";
import ImageUploadField, { resolveImageUrl } from "../../../../components/common/ImageUploadField";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import AgGridTable from "../../../../components/tables/BasicTables/BasicTableOne";
import { CountBadge, PanelHeader, SettingsMenu, masterGridSx, panelSx } from "../../../../components/masterData/MasterPanels";
import useFillHeight from "../../../../hooks/useFillHeight";
import { API_CONFIG } from "../../../../config/config";
import { getAccessToken, getCurrentUser } from "../../../../auth/auth";
import usePagePermission from "../../../../auth/usePagePermission";
import { buttonSystem } from "../../../../components/button/ButtonSystem";
import { KpiCard, KpiCardGroup } from "../../../../components/kpi/KpiCardSystem";
import { useTheme as useAppTheme } from "../../../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { categoryText, setActiveLanguage, statusText, tx } from "./locales";

const API_BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const API = `${API_BASE}/api/measuring-equipment-master`;
const FACTORY_API = `${API_BASE}/api/factory-structure`;
const EMPTY = "—";
const CATEGORIES = ["DIMENSIONAL", "ELECTRICAL", "PHYSICAL_TEST", "VISION_OPTICAL", "OTHER"];
const CATEGORY_COLORS = { DIMENSIONAL: "#7A5AF8", ELECTRICAL: "#F79009", PHYSICAL_TEST: "#12B76A", VISION_OPTICAL: "#0BA5EC", OTHER: "#667085" };
const numOrNull = (v) => (v === "" || v == null ? null : Number(v));
const person = (name, code) => (name ? `${name} - ${code}` : code || EMPTY);
const dateText = (value) => {
  if (!value) return EMPTY;
  const d = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return String(value);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} ${d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
};

function buttonSx(type, overrides = {}) {
  const styles = buttonSystem[type] || {};
  return { ...(styles.base || {}), ...(styles.hover ? { "&:hover": styles.hover } : {}), ...overrides };
}

function createMaterialTheme(mode) {
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
            backgroundColor: dark ? "#0F172A" : "#FFF",
            // Tailwind's preflight resets border-width globally, which can
            // strip MUI's default notched-outline border on this page — so
            // it's re-asserted explicitly here.
            "& .MuiOutlinedInput-notchedOutline": { borderWidth: "1px !important", borderStyle: "solid !important", borderColor: `${dark ? "#3B4759" : "#CBD3DF"} !important` },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: `${dark ? "#5B6B84" : "#98A2B3"} !important` },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderWidth: "2px !important", borderColor: "#005BAB !important" },
            "&.Mui-error .MuiOutlinedInput-notchedOutline": { borderColor: "#EE1B1B !important" },
          },
        },
      },
    },
  });
}

function DialogHeader({ icon, title, subtitle, onClose, disabled }) {
  return (
    <Box sx={{ px: 2, py: 1.25, display: "flex", alignItems: "center", gap: 1.25, borderBottom: 1, borderColor: "divider", bgcolor: (th) => (th.palette.mode === "dark" ? "rgba(0,91,171,0.14)" : "#F1F7FF") }}>
      <Box sx={{ width: 28, height: 28, borderRadius: "50%", bgcolor: (th) => (th.palette.mode === "dark" ? "#173A63" : "#EEF4FF"), color: "#005BAB", display: "grid", placeItems: "center", flexShrink: 0 }}>{icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800 }}>{title}</Typography>
        {subtitle ? <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.35 }}>{subtitle}</Typography> : null}
      </Box>
      <IconButton size="small" disabled={disabled} onClick={onClose} sx={{ mr: -0.5 }}><CloseIcon fontSize="small" /></IconButton>
    </Box>
  );
}

const dialogPaperSx = {
  borderRadius: 3,
  overflow: "hidden",
  boxShadow: (theme) => (theme.palette.mode === "dark" ? "0 24px 60px rgba(0,0,0,.55)" : "0 24px 60px rgba(15,23,42,.18)"),
};

// Fixed-width status pill (same width on every page).
function StatusPill({ active, width = 92 }) {
  const color = active ? "#12B76A" : "#F04438";
  const label = statusText(active ? "ACTIVE" : "INACTIVE");
  return (
    <Box component="span" title={label} sx={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxSizing: "border-box",
      width, height: 22, px: 0.5, lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden",
      borderRadius: 1, fontSize: 10, fontWeight: 700, color, bgcolor: `${color}1A`, border: `1px solid ${color}40`,
    }}>{label}</Box>
  );
}

function DetailSection({ title, children }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ display: "block", mb: 0.5, fontWeight: 800, fontSize: 10, letterSpacing: "0.05em", textTransform: "uppercase", color: "text.secondary" }}>{title}</Typography>
      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, px: 1.25 }}>{children}</Box>
    </Box>
  );
}

function DetailRow({ label, children, last }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, py: 0.9, borderBottom: last ? 0 : 1, borderColor: "divider" }}>
      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{label}</Typography>
      <Typography variant="caption" sx={{ fontWeight: 700, textAlign: "right", minWidth: 0, overflowWrap: "anywhere" }}>{children ?? EMPTY}</Typography>
    </Box>
  );
}

function ActionIcon({ title, icon, onClick, disabled, color = "default" }) {
  return (
    <Tooltip title={title}>
      <span><IconButton disabled={disabled} color={color} onClick={onClick} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}>{icon}</IconButton></span>
    </Tooltip>
  );
}

function FieldLabel({ children }) {
  return <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "text.secondary", fontSize: "0.68rem" }}>{children}</Typography>;
}

const childrenMap = (nodes) => {
  const map = {};
  nodes.forEach((n) => { (map[n.parent_id ?? "root"] = map[n.parent_id ?? "root"] || []).push(n); });
  return map;
};
const pathOf = (node, nodes) => {
  const names = [];
  let n = node;
  while (n) { names.unshift(n.name); const pid = n.parent_id; n = nodes.find((x) => x.id === pid); }
  return names.join(" / ");
};
// Category picker drawn as the category tree; the "none" row is allowed.
function CategoryTreePicker({ nodes, value, onChange, noneLabel, excludeIds, title }) {
  const [collapsed, setCollapsed] = useState(() => new Set());
  const kids = useMemo(() => childrenMap(nodes), [nodes]);
  const parents = nodes.filter((n) => kids[n.id]?.length).map((n) => n.id);
  const toggle = (id) => setCollapsed((old) => { const next = new Set(old); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const row = (key, label, selected, onClick, depth, extra) => (
    <Box key={key} onClick={onClick} sx={{ minHeight: 27, pl: `${depth * 16 + 2}px`, pr: 0.75, display: "flex", alignItems: "center", gap: 0.5, borderRadius: 1, cursor: "pointer",
      bgcolor: selected ? "action.selected" : "transparent", "&:hover": { bgcolor: selected ? "action.selected" : "action.hover" } }}>
      {extra}
      <Typography noWrap title={label} sx={{ flex: 1, minWidth: 0, fontSize: 11.5, fontWeight: selected ? 800 : depth ? 600 : 700 }}>{label}</Typography>
      {selected ? <CheckIcon color="primary" sx={{ fontSize: 13.5, flexShrink: 0 }} /> : null}
    </Box>
  );
  const renderNode = (node, depth) => {
    if (excludeIds?.has(node.id)) return null;
    const list = kids[node.id] || [];
    const open = !collapsed.has(node.id);
    const disabled = node.status !== "ACTIVE";
    return (
      <Box key={node.id} sx={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? "none" : "auto" }}>
        {row(node.id, node.name, Number(value) === node.id, () => onChange(node.id), depth, <>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); if (list.length) toggle(node.id); }} sx={{ width: 22, height: 22, visibility: list.length ? "visible" : "hidden", pointerEvents: "auto" }}>
            {open ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ChevronRightIcon sx={{ fontSize: 14 }} />}
          </IconButton>
          {list.length ? <AccountTreeOutlinedIcon color="primary" sx={{ fontSize: 13, flexShrink: 0 }} /> : <CategoryOutlinedIcon sx={{ fontSize: 13, flexShrink: 0, color: "text.secondary" }} />}
        </>)}
        {list.length && open ? list.map((k) => renderNode(k, depth + 1)) : null}
      </Box>
    );
  };
  return (
    <Box sx={{ flex: 1, minHeight: 280, display: "flex", flexDirection: "column", border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
      <Box sx={{ px: 1, py: 0.5, display: "flex", alignItems: "center", borderBottom: 1, borderColor: "divider", bgcolor: (th) => (th.palette.mode === "dark" ? "#182235" : "#F1F7FF") }}>
        <Typography sx={{ flex: 1, fontSize: 11, fontWeight: 800, pl: 0.5 }}>{title || tx("Category Hierarchy")}</Typography>
        <Tooltip title={tx("Expand all")}><IconButton size="small" onClick={() => setCollapsed(new Set())}><UnfoldMoreIcon sx={{ fontSize: 14.5 }} /></IconButton></Tooltip>
        <Tooltip title={tx("Collapse all")}><IconButton size="small" onClick={() => setCollapsed(new Set(parents))}><UnfoldLessIcon sx={{ fontSize: 14.5 }} /></IconButton></Tooltip>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 0.75 }}>
        {row("none", noneLabel || tx("No category"), value === "" || value == null, () => onChange(""), 0,
          <Box sx={{ width: 22, display: "grid", placeItems: "center" }}><CategoryOutlinedIcon color="disabled" sx={{ fontSize: 13 }} /></Box>)}
        {(kids.root || []).map((n) => renderNode(n, 0))}
      </Box>
    </Box>
  );
}


function CategoryPill({ value, width = 132 }) {
  const color = CATEGORY_COLORS[value] || "#667085";
  return (
    <Box component="span" sx={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", width, height: 22, px: 0.5,
      whiteSpace: "nowrap", overflow: "hidden", borderRadius: 1, fontSize: 10, fontWeight: 700, color, bgcolor: `${color}1A`, border: `1px solid ${color}40`,
    }}>{categoryText(value)}</Box>
  );
}
const categoryIcon = (c) => ({ DIMENSIONAL: StraightenOutlinedIcon, ELECTRICAL: BoltOutlinedIcon, PHYSICAL_TEST: ScienceOutlinedIcon, VISION_OPTICAL: CameraAltOutlinedIcon }[c] || CategoryOutlinedIcon);

// Left tree: equipment category → equipment type, with the number of devices.
function TypeTree({ types, rows, selected, onSelect }) {
  const [collapsed, setCollapsed] = useState(() => new Set());
  const count = (fn) => rows.filter(fn).length;
  const groups = CATEGORIES.map((c) => ({ category: c, types: types.filter((t) => t.category === c) })).filter((g) => g.types.length);
  const row = (key, label, isSel, onClick, depth, icon, value, toggle) => (
    <Box key={key} onClick={onClick} sx={{ minHeight: 30, pl: `${depth * 13 + 3}px`, pr: 0.5, display: "flex", alignItems: "center", gap: 0.35, cursor: "pointer", borderRadius: 1,
      bgcolor: isSel ? "action.selected" : "transparent", "&:hover": { bgcolor: "action.hover" } }}>
      <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggle?.(); }} sx={{ width: 19, height: 19, visibility: toggle ? "visible" : "hidden" }}>
        {toggle && !collapsed.has(key) ? <ExpandMoreIcon sx={{ fontSize: 13.5 }} /> : <ChevronRightIcon sx={{ fontSize: 13.5 }} />}
      </IconButton>
      {icon}
      <Typography noWrap title={label} sx={{ flex: 1, fontSize: 11.5, fontWeight: isSel ? 800 : 600 }}>{label}</Typography>
      <Box sx={{ mr: 0.5, display: "flex" }}><CountBadge value={value} /></Box>
    </Box>
  );
  const flip = (k) => setCollapsed((old) => { const next = new Set(old); if (next.has(k)) next.delete(k); else next.add(k); return next; });
  return (
    <Box sx={{ p: 0.75, flex: 1, minHeight: 0, overflow: "auto" }}>
      <Box onClick={() => onSelect(null)} sx={{ minHeight: 27, px: 0.75, display: "flex", alignItems: "center", gap: 0.75, borderRadius: 1, cursor: "pointer", bgcolor: selected == null ? "action.selected" : "transparent", "&:hover": { bgcolor: selected == null ? "action.selected" : "action.hover" } }}>
        <CategoryOutlinedIcon color="primary" sx={{ fontSize: 13.5 }} />
        <Typography sx={{ flex: 1, fontSize: 11.5, fontWeight: 800 }}>{tx("All equipment")}</Typography>
        <Box sx={{ mr: 0.5, display: "flex" }}><CountBadge value={rows.length} /></Box>
      </Box>
      {groups.map((g) => {
        const key = `c:${g.category}`;
        const Icon = categoryIcon(g.category);
        return (
          <Box key={key}>
            {row(key, categoryText(g.category), selected === key, () => onSelect(key), 0, <AccountTreeOutlinedIcon color="primary" sx={{ fontSize: 13.5 }} />,
              count((r) => r.category === g.category || g.types.some((t) => Number(t.id) === Number(r.equipment_type_id))), () => flip(key))}
            {!collapsed.has(key) && g.types.map((t) => row(`t:${t.id}`, t.type_name, selected === `t:${t.id}`, () => onSelect(`t:${t.id}`), 1,
              <Icon sx={{ fontSize: 13, color: t.is_active ? "text.secondary" : "text.disabled" }} />, count((r) => Number(r.equipment_type_id) === Number(t.id))))}
          </Box>
        );
      })}
    </Box>
  );
}

const emptyEquipment = { equipment_code: "", equipment_name: "", equipment_type_id: "", factory_node_id: "", manufacturer: "", model: "", serial_number: "",
  measurement_range: "", resolution: "", accuracy: "", calibration_cycle_days: 180, description: "", image_url: "", active: true };

function EquipmentDialog({ open, item, types, nodes, saving, onClose, onSave }) {
  const [form, setForm] = useState(emptyEquipment);
  useEffect(() => {
    if (!open) return;
    setForm(item ? { ...emptyEquipment, ...item, factory_node_id: item.factory_node_id ?? "", active: item.status !== "INACTIVE" } : emptyEquipment);
  }, [open, item]);
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const g = (cols) => ({ display: "grid", gridTemplateColumns: { xs: "1fr", sm: cols }, gap: 1.5, pt: 0.75 });
  const text = (v) => (String(v ?? "").trim() ? String(v).trim() : null);
  const submit = () => onSave({
    equipment_code: form.equipment_code.trim().toUpperCase(),
    equipment_name: form.equipment_name.trim(),
    equipment_type_id: Number(form.equipment_type_id),
    factory_node_id: Number(form.factory_node_id),
    manufacturer: text(form.manufacturer), model: text(form.model), serial_number: text(form.serial_number),
    measurement_range: text(form.measurement_range), resolution: text(form.resolution), accuracy: text(form.accuracy),
    calibration_cycle_days: numOrNull(form.calibration_cycle_days),
    description: text(form.description), image_url: form.image_url || null,
    // new equipment starts usable (or inactive); later states come from Quality → calibration
    status: item ? item.status : form.active ? "AVAILABLE" : "INACTIVE",
  });
  const valid = form.equipment_code.trim() && form.equipment_name.trim() && form.equipment_type_id && form.factory_node_id && Number(form.calibration_cycle_days) > 0;
  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="lg" slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogHeader icon={<StraightenOutlinedIcon />} title={item ? tx("Edit Equipment") : tx("Add New Measuring Equipment")}
        subtitle={tx("Choose the area on the left; fill in the equipment details on the right.")} disabled={saving} onClose={onClose} />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "300px minmax(0,1fr)" }, gap: 2.5, mt: 1, height: { md: 540 } }}>
          <Stack spacing={0.75} sx={{ minHeight: 0 }}>
            <FieldLabel>{tx("Location")} *</FieldLabel>
            <CategoryTreePicker nodes={nodes} value={form.factory_node_id} onChange={(id) => set("factory_node_id", id)} title={tx("Factory Structure")} noneLabel={tx("Not selected")} />
          </Stack>
          <Box sx={{ minHeight: 0, overflowY: "auto", pr: 0.5 }}>
            <Stack spacing={2.25}>
              <Stack spacing={0.5}>
                <FieldLabel>{tx("Basic information")}</FieldLabel>
                <Box sx={g("1fr 2fr")}>
                  <TextField size="small" required disabled={Boolean(item)} label={tx("Equipment Code")} placeholder="VD: ME-001" value={form.equipment_code} onChange={(e) => set("equipment_code", e.target.value.toUpperCase())} />
                  <TextField size="small" required label={tx("Equipment Name")} value={form.equipment_name} onChange={(e) => set("equipment_name", e.target.value)} />
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 1, px: 1.25, py: 0.9, borderRadius: 1.5, bgcolor: (th) => (th.palette.mode === "dark" ? "#182235" : "#F1F7FF") }}>
                  <LocationOnOutlinedIcon color="primary" sx={{ fontSize: 13.5 }} />
                  <Typography variant="caption" color="text.secondary">{tx("Location")}:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 0, overflowWrap: "anywhere", color: form.factory_node_id ? "text.primary" : "error.main" }}>
                    {form.factory_node_id ? pathOf(nodes.find((n) => n.id === Number(form.factory_node_id)), nodes) : tx("Choose an area in the factory structure")}
                  </Typography>
                </Box>
              </Stack>
              <Stack spacing={0.5}>
                <FieldLabel>{tx("Classification")}</FieldLabel>
                <Box sx={g("2fr 1fr")}>
                  <TextField select size="small" required label={tx("Equipment Type")} value={form.equipment_type_id} onChange={(e) => set("equipment_type_id", e.target.value)}>
                    {CATEGORIES.flatMap((c) => {
                      const list = types.filter((t) => t.category === c && (t.is_active || t.id === form.equipment_type_id));
                      return list.length ? [<MenuItem key={`h-${c}`} disabled sx={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", opacity: "1 !important", color: "text.secondary" }}>{categoryText(c)}</MenuItem>,
                        ...list.map((t) => <MenuItem key={t.id} value={t.id} sx={{ pl: 3 }}>{t.type_name}</MenuItem>)] : [];
                    })}
                  </TextField>
                  {item ? (
                    <TextField size="small" disabled label={tx("Status")} value={statusText(item.status === "INACTIVE" ? "INACTIVE" : "ACTIVE")} helperText={tx("Use the status button in the detail panel")} />
                  ) : (
                    <TextField select size="small" label={tx("Status")} value={form.active ? "1" : "0"} onChange={(e) => set("active", e.target.value === "1")}>
                      <MenuItem value="1">{statusText("ACTIVE")}</MenuItem>
                      <MenuItem value="0">{statusText("INACTIVE")}</MenuItem>
                    </TextField>
                  )}
                </Box>
              </Stack>
              <Stack spacing={0.5}>
                <FieldLabel>{tx("Manufacturer information")}</FieldLabel>
                <Box sx={g("1fr 1fr 1fr")}>
                  <TextField size="small" label={tx("Manufacturer")} value={form.manufacturer || ""} onChange={(e) => set("manufacturer", e.target.value)} />
                  <TextField size="small" label={tx("Model")} value={form.model || ""} onChange={(e) => set("model", e.target.value)} />
                  <TextField size="small" label={tx("Serial Number")} value={form.serial_number || ""} onChange={(e) => set("serial_number", e.target.value)} />
                </Box>
              </Stack>
              <Stack spacing={0.5}>
                <FieldLabel>{tx("Technical Specification")}</FieldLabel>
                <Box sx={g("1fr 1fr 1fr 1fr")}>
                  <TextField size="small" label={tx("Measurement Range")} placeholder="VD: 0–150 mm" value={form.measurement_range || ""} onChange={(e) => set("measurement_range", e.target.value)} />
                  <TextField size="small" label={tx("Resolution")} placeholder="VD: 0,01 mm" value={form.resolution || ""} onChange={(e) => set("resolution", e.target.value)} />
                  <TextField size="small" label={tx("Accuracy")} placeholder="VD: ±0,02 mm" value={form.accuracy || ""} onChange={(e) => set("accuracy", e.target.value)} />
                  <TextField size="small" required type="number" label={tx("Calibration Cycle (days)")} value={form.calibration_cycle_days ?? ""} onChange={(e) => set("calibration_cycle_days", e.target.value)} />
                </Box>
              </Stack>
              <ImageUploadField value={form.image_url || ""} category="measuring_equipment" label={tx("Image")} disabled={saving} onChange={(v) => set("image_url", v || "")} />
              <TextField size="small" multiline minRows={2} label={tx("Description")} value={form.description || ""} onChange={(e) => set("description", e.target.value)} />
            </Stack>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.25, borderTop: 1, borderColor: "divider", bgcolor: (th) => (th.palette.mode === "dark" ? "#0F172A" : "#F8FAFC") }}>
        <Button disabled={saving || !valid} onClick={submit} sx={buttonSx("primary")} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

// Settings → equipment types: table on the left, details or the inline form on the right (Machine & Equipment layout).
function TypesManager({ open, rows: rawRows, canEdit, request, actor, onClose, onReload, notify }) {
  const rows = useMemo(() => [...rawRows].sort((a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) || (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id), [rawRows]);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("view");
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) setMode("view"); }, [open]);
  useEffect(() => { if (open && !rows.some((r) => r.id === selectedId)) setSelectedId(rows[0]?.id ?? null); }, [open, rows, selectedId]);
  const selected = rows.find((r) => r.id === selectedId) || null;
  const toForm = (it) => ({ code: it?.type_code || "", name: it?.type_name || "", category: it?.category || "DIMENSIONAL", sort: it?.sort_order ?? 0, active: it ? Boolean(it.is_active) : true, description: it?.description || "" });
  const submit = async (f, isNew, it) => {
    setSaving(true);
    try {
      const payload = { ...(isNew ? { type_code: f.code.trim().toUpperCase(), created_by: actor } : { updated_by: actor }), type_name: f.name.trim(), category: f.category,
        description: f.description.trim() || null, is_active: Boolean(f.active), sort_order: Number(f.sort || 0) };
      const result = await request(isNew ? `${API}/types` : `${API}/types/${it.id}`, { method: isNew ? "POST" : "PUT", body: JSON.stringify(payload) });
      await onReload();
      if (isNew && result?.id) setSelectedId(result.id);
      setMode("view");
      notify("success", tx("Data saved successfully."));
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const remove = async (it) => {
    if (!window.confirm(tx("Are you sure you want to delete this item?"))) return;
    setSaving(true);
    try { await request(`${API}/types/${it.id}`, { method: "DELETE" }); await onReload(); setSelectedId(null); notify("success", tx("Data deleted.")); }
    catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const change = (key) => (e) => setForm((old) => ({ ...old, [key]: e.target.value }));
  const cols = [
    { headerName: tx("Code"), field: "type_code", width: 130, pinned: "left" },
    { headerName: tx("Name"), field: "type_name", minWidth: 160, flex: 1.4 },
    { headerName: tx("Category"), field: "category", minWidth: 150, flex: 1, cellRenderer: (p) => <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}><CategoryPill value={p.value} /></Box> },
    { headerName: tx("Devices"), field: "equipment_count", minWidth: 90, flex: 0.5, cellStyle: { justifyContent: "center" }, valueFormatter: (p) => p.value ?? 0 },
    { headerName: tx("Status"), field: "is_active", minWidth: 110, flex: 0.6, cellRenderer: (p) => <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}><StatusPill active={Boolean(p.value)} /></Box> },
  ];
  const editing = mode !== "view";
  const isNew = mode === "new";
  const valid = form && form.code.trim() && form.name.trim();
  const inUse = Number(selected?.equipment_count || 0);
  return (
    <Dialog open={open} fullWidth maxWidth="lg" onClose={saving ? undefined : onClose} slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogHeader icon={<CategoryOutlinedIcon />} title={tx("Equipment Types")} subtitle={tx("Types of measuring equipment grouped by category; each device belongs to one type.")} disabled={saving} onClose={onClose} />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0,1fr) 380px" }, gap: 2.5, mt: 1, height: { md: 500 } }}>
          <Box sx={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
            <Box sx={{ flex: 1, minHeight: 300 }}>
              <AgGridTable rowData={rows} columnDefs={cols} height="100%" getRowId={(p) => String(p.data.id)} onRowClicked={(e) => { if (!editing) setSelectedId(e.data.id); }} />
            </Box>
            <Stack direction="row" sx={{ minHeight: 66, boxSizing: "border-box", alignItems: "center", flexShrink: 0 }}>
              <Button variant="contained" disabled={!canEdit || saving || editing} startIcon={<AddIcon />} onClick={() => { setForm(toForm(null)); setMode("new"); }} sx={buttonSx("primary")}>{tx("Add Equipment Type")}</Button>
              <Box sx={{ flex: 1 }} />
              <Typography variant="caption" color="text.secondary">{rows.length} {tx("rows")}</Typography>
            </Stack>
          </Box>
          <Box sx={{ minHeight: 0, display: "flex", flexDirection: "column", border: 1, borderColor: editing ? "primary.main" : "divider", borderRadius: 1.5, overflow: "hidden" }}>
            {editing && form ? (
              <>
                <Box sx={{ px: 1.5, py: 1.25, flexShrink: 0, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
                  {isNew ? <AddIcon color="primary" fontSize="small" /> : <EditOutlinedIcon color="primary" fontSize="small" />}
                  <Typography noWrap sx={{ fontSize: 12, fontWeight: 800 }}>{isNew ? tx("Add Equipment Type") : `${tx("Edit")} · ${selected?.type_name || ""}`}</Typography>
                </Box>
                <Box sx={{ p: 1.5, flex: 1, minHeight: 0, overflowY: "auto" }}>
                  <Stack spacing={2}>
                    <Stack spacing={1.25}>
                      <FieldLabel>{tx("Basic information")}</FieldLabel>
                      <TextField fullWidth required size="small" label={tx("Code")} disabled={!isNew} value={form.code} onChange={(e) => setForm((o) => ({ ...o, code: e.target.value.toUpperCase() }))} />
                      <TextField fullWidth required size="small" label={tx("Name")} value={form.name} onChange={change("name")} />
                    </Stack>
                    <Stack spacing={1.25}>
                      <FieldLabel>{tx("Classification")}</FieldLabel>
                      <FormControl fullWidth size="small">
                        <InputLabel>{tx("Category")}</InputLabel>
                        <Select label={tx("Category")} value={form.category} onChange={change("category")}>
                          {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{categoryText(c)}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25 }}>
                        <TextField fullWidth size="small" type="number" label={tx("Sort Order")} value={form.sort} onChange={change("sort")} />
                        <FormControl fullWidth size="small">
                          <InputLabel>{tx("Status")}</InputLabel>
                          <Select label={tx("Status")} value={form.active} onChange={change("active")}>
                            <MenuItem value={true}>{statusText("ACTIVE")}</MenuItem><MenuItem value={false}>{statusText("INACTIVE")}</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Stack>
                    <TextField fullWidth multiline minRows={3} label={tx("Description")} value={form.description} onChange={change("description")} />
                  </Stack>
                </Box>
                <Divider />
                <Stack direction="row" sx={{ p: 1.5, minHeight: 64, boxSizing: "border-box", justifyContent: "flex-end", alignItems: "center", gap: 1, flexShrink: 0 }}>
                  <Button disabled={saving} onClick={() => setMode("view")} sx={buttonSx("cancel")}>{tx("Discard")}</Button>
                  <Button disabled={saving || !valid} onClick={() => submit(form, isNew, selected)} sx={buttonSx("primary")} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>{tx("Save")}</Button>
                </Stack>
              </>
            ) : selected ? (
              <>
                <Box sx={{ p: 1.5, flexShrink: 0, display: "grid", gridTemplateColumns: "44px minmax(0,1fr) auto", columnGap: 1.25, alignItems: "center" }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", color: "#FFF", bgcolor: CATEGORY_COLORS[selected.category] || "#005BAB" }}><CategoryOutlinedIcon sx={{ fontSize: 18 }} /></Box>
                  <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0.25 }}>
                    <Typography noWrap sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>{selected.type_name}</Typography>
                    <Typography noWrap color="text.secondary" sx={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2 }}>{selected.type_code}</Typography>
                  </Box>
                  <StatusPill active={Boolean(selected.is_active)} />
                </Box>
                <Box sx={{ px: 1.5, pb: 1.5, flex: 1, minHeight: 0, overflowY: "auto" }}>
                  <DetailSection title={tx("General")}>
                    <DetailRow label={tx("Category")}><CategoryPill value={selected.category} /></DetailRow>
                    <DetailRow label={tx("Devices")}>{selected.equipment_count ?? 0}</DetailRow>
                    <DetailRow label={tx("Sort Order")}>{selected.sort_order ?? 0}</DetailRow>
                    <DetailRow label={tx("Description")} last>{selected.description || EMPTY}</DetailRow>
                  </DetailSection>
                </Box>
                <Divider />
                <Stack direction="row" sx={{ p: 1.5, minHeight: 64, boxSizing: "border-box", justifyContent: "center", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
                  <ActionIcon title={tx("Edit")} icon={<EditOutlinedIcon fontSize="small" />} disabled={!canEdit || saving} onClick={() => { setForm(toForm(selected)); setMode("edit"); }} />
                  <ActionIcon title={selected.is_active ? tx("Deactivate") : tx("Activate")} color={selected.is_active ? "warning" : "success"}
                    icon={selected.is_active ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
                    disabled={!canEdit || saving} onClick={() => submit({ ...toForm(selected), active: !selected.is_active }, false, selected)} />
                  <ActionIcon title={inUse ? tx("Type is in use, deactivate it instead") : tx("Delete")} icon={<DeleteOutlineIcon fontSize="small" />} color="error"
                    disabled={!canEdit || saving || Boolean(inUse)} onClick={() => remove(selected)} />
                </Stack>
              </>
            ) : (
              <Box sx={{ flex: 1, display: "grid", placeItems: "center", p: 2 }}><Typography variant="body2" color="text.secondary">{tx("Select a row to view details.")}</Typography></Box>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default function MeasuringEquipmentMaster() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  const { theme } = useAppTheme();
  const dark = theme === "dark";
  const muiTheme = useMemo(() => createMaterialTheme(dark ? "dark" : "light"), [dark]);
  const { canEdit } = usePagePermission();
  const actor = getCurrentUser()?.employee_code || "SYSTEM";

  const [rows, setRows] = useState([]);
  const [types, setTypes] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detailVersion, setDetailVersion] = useState(0); // bumped after a save so the open detail reloads
  const [treeKey, setTreeKey] = useState(null); // null | "c:<category>" | "t:<type id>"
  const [detailTab, setDetailTab] = useState(0);
  const [filters, setFilters] = useState({ keyword: "", category: "", status: "", manufacturer: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState(null); // null | {} | item
  const [typesOpen, setTypesOpen] = useState(false);
  const [message, setMessage] = useState(null);
  const notify = useCallback((severity, text) => setMessage({ severity, text }), []);
  const [panelsRef, panelHeight] = useFillHeight();

  const request = useCallback(async (url, options = {}) => {
    const token = getAccessToken?.();
    const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const detail = Array.isArray(data?.detail) ? data.detail.map((d) => d.msg).join("; ") : data?.detail;
      throw new Error(detail || data?.message || `HTTP ${response.status}`);
    }
    return data;
  }, []);
  const loadTypes = useCallback(async () => setTypes((await request(`${API}/types`)) || []), [request]);
  const loadRows = useCallback(async () => {
    const data = await request(`${API}/equipment?limit=2000`);
    const list = data?.items || [];
    setRows(list);
    setSelectedId((old) => (list.some((x) => x.id === old) ? old : list[0]?.id ?? null));
  }, [request]);
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [, , nodeData] = await Promise.all([loadTypes(), loadRows(), request(`${FACTORY_API}/nodes`)]);
      setNodes((Array.isArray(nodeData) ? nodeData : nodeData?.items || []).map((n) => ({ ...n, id: Number(n.id), parent_id: n.parent_id == null ? null : Number(n.parent_id) })));
    } catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [loadTypes, loadRows, request, notify]);
  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => {
    if (!selectedId) { setSelected(null); return; }
    request(`${API}/equipment/${selectedId}`).then(setSelected).catch((e) => notify("error", e.message));
  }, [selectedId, request, notify, detailVersion]);

  const isActive = (x) => x.status !== "INACTIVE";
  const manufacturers = useMemo(() => [...new Set(rows.map((x) => x.manufacturer).filter(Boolean))].sort(), [rows]);
  const filtered = useMemo(() => {
    const q = filters.keyword.trim().toLowerCase();
    return rows.filter((x) => (!q || `${x.equipment_code} ${x.equipment_name} ${x.model || ""} ${x.serial_number || ""}`.toLowerCase().includes(q))
      && (!filters.category || x.category === filters.category)
      && (!filters.status || (filters.status === "ACTIVE" ? isActive(x) : !isActive(x)))
      && (!filters.manufacturer || x.manufacturer === filters.manufacturer)
      && (!treeKey || (treeKey.startsWith("c:") ? x.category === treeKey.slice(2) : Number(x.equipment_type_id) === Number(treeKey.slice(2)))));
  }, [rows, filters, treeKey]);
  const nodePath = (id) => pathOf(nodes.find((n) => n.id === Number(id)), nodes) || EMPTY;

  const columns = useMemo(() => [
    { headerName: tx("Equipment Code"), field: "equipment_code", width: 130, pinned: "left" },
    { headerName: tx("Equipment Name"), field: "equipment_name", minWidth: 180, flex: 1.5 },
    { headerName: tx("Equipment Type"), field: "type_name", minWidth: 130, flex: 1 },
    { headerName: tx("Location"), field: "factory_node_name", minWidth: 130, flex: 1, valueFormatter: (p) => p.value || EMPTY },
    { headerName: tx("Manufacturer"), field: "manufacturer", minWidth: 120, flex: 0.9, valueFormatter: (p) => p.value || EMPTY },
    { headerName: tx("Calibration Cycle (days)"), field: "calibration_cycle_days", minWidth: 165, flex: 0.8, cellStyle: { justifyContent: "center" }, valueFormatter: (p) => p.value ?? EMPTY },
    { headerName: tx("Status"), field: "status", minWidth: 115, flex: 0.7, cellRenderer: (p) => <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}><StatusPill active={p.value !== "INACTIVE"} /></Box> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [language]);

  const saveEquipment = async (payload) => {
    setSaving(true);
    try {
      const item = dialog?.id ? dialog : null;
      const result = await request(item ? `${API}/equipment/${item.id}` : `${API}/equipment`, {
        method: item ? "PUT" : "POST",
        body: JSON.stringify({ ...payload, ...(item ? { version: item.version, updated_by: actor } : { created_by: actor }) }),
      });
      setDialog(null);
      await Promise.all([loadTypes(), loadRows()]);
      if (!item && result?.id) setSelectedId(result.id);
      setDetailVersion((v) => v + 1);
      notify("success", tx("Data saved successfully."));
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const toggleStatus = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await request(`${API}/equipment/${selected.id}/status`, { method: "PATCH", body: JSON.stringify({ status: isActive(selected) ? "INACTIVE" : "AVAILABLE", version: selected.version, updated_by: actor }) });
      await loadRows(); setDetailVersion((v) => v + 1);
      notify("success", tx("Status updated."));
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const deleteEquipment = async () => {
    if (!selected || !window.confirm(tx("Are you sure you want to delete this item?"))) return;
    setSaving(true);
    try { await request(`${API}/equipment/${selected.id}`, { method: "DELETE" }); await Promise.all([loadTypes(), loadRows()]); notify("success", tx("Data deleted.")); }
    catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };

  const byCategory = (c) => rows.filter((x) => x.category === c).length;
  const percent = (n) => (rows.length ? `${((n / rows.length) * 100).toFixed(1)}% ${tx("of total")}` : `0% ${tx("of total")}`);
  const kpis = [
    { label: tx("Total Equipment"), value: rows.length, note: `${types.filter((t) => t.is_active).length} ${tx("active types")}`, icon: StraightenOutlinedIcon, tone: "primary" },
    { label: categoryText("DIMENSIONAL"), value: byCategory("DIMENSIONAL"), note: percent(byCategory("DIMENSIONAL")), icon: StraightenOutlinedIcon, tone: "accent" },
    { label: categoryText("ELECTRICAL"), value: byCategory("ELECTRICAL"), note: percent(byCategory("ELECTRICAL")), icon: BoltOutlinedIcon, tone: "warning" },
    { label: categoryText("PHYSICAL_TEST"), value: byCategory("PHYSICAL_TEST"), note: percent(byCategory("PHYSICAL_TEST")), icon: ScienceOutlinedIcon, tone: "success" },
    { label: tx("Vision / Others"), value: byCategory("VISION_OPTICAL") + byCategory("OTHER"), note: tx("Optical, vision and other equipment"), icon: CameraAltOutlinedIcon, tone: "info" },
    { label: tx("Inactive Equipment"), value: rows.filter((x) => !isActive(x)).length, note: tx("Not used for new data"), icon: BlockOutlinedIcon, tone: "danger" },
  ];

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box sx={dark ? { "& .vcc-ag-grid": { "--ag-background-color": "#111827", "--ag-header-background-color": "#182235", "--ag-foreground-color": "#D0D5DD", "--ag-border-color": "#344054" } } : {}}>
        <PageMeta title={`${tx("Measuring Equipment Master")} | VCC Plastics`} description={tx("Manage all measuring and inspection equipment in the system")} />
        <PageBreadcrumb pageTitle={tx("Measuring Equipment Master")} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr auto" }, gap: 1.5, alignItems: "center", mb: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{tx("Measuring Equipment Master")}</Typography>
            <Typography variant="body2" color="text.secondary">{tx("Manage all measuring and inspection equipment in the system")}</Typography>
          </Box>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2, justifyContent: "flex-end" }}>
            <SettingsMenu items={[{ key: "types", label: tx("Equipment Types"), onClick: () => setTypesOpen(true) }]} />
            <Button variant="contained" startIcon={<AddIcon />} disabled={!canEdit} onClick={() => setDialog({})} sx={buttonSx("primary")}>{tx("Add New Equipment")}</Button>
          </Stack>
        </Box>

        <KpiCardGroup>
          {kpis.map((item) => { const Icon = item.icon; return <KpiCard key={item.label} label={item.label} value={item.value} note={item.note} icon={<Icon />} tone={item.tone} />; })}
        </KpiCardGroup>

        <Paper variant="outlined" sx={{ my: 1.5, p: 1.5, borderRadius: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(240px,1.6fr) repeat(3,minmax(145px,1fr)) auto" }, gap: 1 }}>
            <TextField size="small" placeholder={tx("Search by code, name, model or serial...")} value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
            <FormControl size="small">
              <InputLabel shrink>{tx("Category")}</InputLabel>
              <Select displayEmpty notched label={tx("Category")} value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                <MenuItem value="">{tx("All categories")}</MenuItem>
                {CATEGORIES.map((x) => <MenuItem key={x} value={x}>{categoryText(x)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel shrink>{tx("Manufacturer")}</InputLabel>
              <Select displayEmpty notched label={tx("Manufacturer")} value={filters.manufacturer} onChange={(e) => setFilters({ ...filters, manufacturer: e.target.value })}>
                <MenuItem value="">{tx("All Manufacturers")}</MenuItem>
                {manufacturers.map((x) => <MenuItem key={x} value={x}>{x}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel shrink>{tx("Status")}</InputLabel>
              <Select displayEmpty notched label={tx("Status")} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <MenuItem value="">{tx("All Status")}</MenuItem>
                <MenuItem value="ACTIVE">{statusText("ACTIVE")}</MenuItem>
                <MenuItem value="INACTIVE">{statusText("INACTIVE")}</MenuItem>
              </Select>
            </FormControl>
            <Button startIcon={<FilterListIcon />} onClick={() => { setFilters({ keyword: "", category: "", status: "", manufacturer: "" }); setTreeKey(null); }}
              sx={buttonSx("cancel", { minHeight: 29, whiteSpace: "nowrap" })}>{tx("Clear")}</Button>
          </Box>
        </Paper>

        <Box ref={panelsRef} sx={masterGridSx}>
          <Paper sx={{ ...panelSx, height: panelHeight, display: "flex", flexDirection: "column" }}>
            <PanelHeader title={tx("Equipment Hierarchy")} icon={<AccountTreeOutlinedIcon color="primary" fontSize="small" />} />
            <TypeTree types={types} rows={rows} selected={treeKey} onSelect={setTreeKey} />
          </Paper>

          <Paper sx={{ ...panelSx, height: panelHeight, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <PanelHeader title={`${tx("Equipment List")} (${filtered.length})`} icon={<StraightenOutlinedIcon color="primary" fontSize="small" />} />
            <Box sx={{ p: 0.75, flex: 1, minHeight: 0 }}>
              <AgGridTable rowData={filtered} columnDefs={columns} loading={loading} height="100%" rowSelection="single"
                getRowId={(p) => String(p.data.id)} onRowClicked={(event) => setSelectedId(event.data.id)} />
            </Box>
          </Paper>

          <Paper sx={{ ...panelSx, height: panelHeight, display: "flex", flexDirection: "column" }}>
            <PanelHeader title={tx("Equipment Detail")} icon={<VisibilityOutlinedIcon color="primary" fontSize="small" />} />
            {selected ? (
              <>
                <Box sx={{ p: 1.5, flexShrink: 0 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr) auto", columnGap: 1.25, alignItems: "center" }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", color: "#FFF", bgcolor: CATEGORY_COLORS[selected.category] || "#005BAB" }}><StraightenOutlinedIcon sx={{ fontSize: 18 }} /></Box>
                    <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0.25 }}>
                      <Typography noWrap title={selected.equipment_name} sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>{selected.equipment_name}</Typography>
                      <Typography noWrap color="text.secondary" sx={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2 }}>{selected.equipment_code}</Typography>
                    </Box>
                    <StatusPill active={isActive(selected)} />
                  </Box>
                </Box>
                <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)} variant="fullWidth"
                  sx={{ minHeight: 27, borderTop: 1, borderBottom: 1, borderColor: "divider", "& .MuiTab-root": { minHeight: 27, py: 0, px: 0.5, fontSize: 11, fontWeight: 700, textTransform: "none" } }}>
                  <Tab label={tx("Information")} />
                  <Tab label={tx("Specification")} />
                </Tabs>
                <Box sx={{ p: 1.5, flex: 1, minHeight: 0, overflow: "auto" }}>
                  {detailTab === 0 && (
                    <Stack spacing={1.5}>
                      {selected.image_url ? (
                        <Box component="a" href={resolveImageUrl(selected.image_url)} target="_blank" rel="noreferrer" title={tx("Open full image")}
                          sx={{ display: "block", borderRadius: 1.5, overflow: "hidden", border: 1, borderColor: "divider", bgcolor: "action.hover", cursor: "zoom-in" }}>
                          <Box component="img" src={resolveImageUrl(selected.image_url)} alt={selected.equipment_name} sx={{ display: "block", width: "100%", height: 170, objectFit: "contain" }} />
                        </Box>
                      ) : null}
                      <DetailSection title={tx("General")}>
                        <DetailRow label={tx("Equipment Type")}>{selected.type_name || EMPTY}</DetailRow>
                        <DetailRow label={tx("Category")}><CategoryPill value={selected.category} /></DetailRow>
                        <DetailRow label={tx("Location")}>{nodePath(selected.factory_node_id)}</DetailRow>
                        <DetailRow label={tx("Manufacturer")}>{selected.manufacturer || EMPTY}</DetailRow>
                        <DetailRow label={tx("Model")}>{selected.model || EMPTY}</DetailRow>
                        <DetailRow label={tx("Serial Number")}>{selected.serial_number || EMPTY}</DetailRow>
                        <DetailRow label={tx("Description")} last>{selected.description || EMPTY}</DetailRow>
                      </DetailSection>
                      <DetailSection title={tx("Record")}>
                        <DetailRow label={tx("Created By")}>{person(selected.created_by_name, selected.created_by_code || selected.created_by)}</DetailRow>
                        <DetailRow label={tx("Created Date")}>{dateText(selected.created_at)}</DetailRow>
                        <DetailRow label={tx("Updated By")}>{selected.updated_by ? person(selected.updated_by_name, selected.updated_by_code || selected.updated_by) : EMPTY}</DetailRow>
                        <DetailRow label={tx("Last Modified")} last>{dateText(selected.updated_at)}</DetailRow>
                      </DetailSection>
                    </Stack>
                  )}
                  {detailTab === 1 && (
                    <DetailSection title={tx("Technical Specification")}>
                      <DetailRow label={tx("Measurement Range")}>{selected.measurement_range || EMPTY}</DetailRow>
                      <DetailRow label={tx("Resolution")}>{selected.resolution || EMPTY}</DetailRow>
                      <DetailRow label={tx("Accuracy")}>{selected.accuracy || EMPTY}</DetailRow>
                      <DetailRow label={tx("Calibration Cycle (days)")} last>{selected.calibration_cycle_days ?? EMPTY}</DetailRow>
                    </DetailSection>
                  )}
                </Box>
                <Divider />
                <Stack direction="row" sx={{ p: 1.5, justifyContent: "center", gap: 1.5, flexShrink: 0 }}>
                  <ActionIcon title={tx("Edit equipment")} icon={<EditOutlinedIcon fontSize="small" />} disabled={!canEdit || saving} onClick={() => setDialog(selected)} />
                  <ActionIcon title={isActive(selected) ? tx("Deactivate equipment") : tx("Activate equipment")}
                    icon={isActive(selected) ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
                    color={isActive(selected) ? "warning" : "success"} disabled={!canEdit || saving} onClick={toggleStatus} />
                  <ActionIcon title={tx("Delete equipment")} icon={<DeleteOutlineIcon fontSize="small" />} color="error" disabled={!canEdit || saving} onClick={deleteEquipment} />
                </Stack>
              </>
            ) : (
              <Box sx={{ flex: 1, display: "grid", placeItems: "center", p: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>{tx("Select equipment to view details.")}</Typography>
              </Box>
            )}
          </Paper>
        </Box>

        <EquipmentDialog open={dialog !== null} item={dialog?.id ? dialog : null} types={types} nodes={nodes} saving={saving} onClose={() => setDialog(null)} onSave={saveEquipment} />
        <TypesManager open={typesOpen} rows={types} canEdit={canEdit} request={request} actor={actor} onClose={() => setTypesOpen(false)} onReload={async () => { await Promise.all([loadTypes(), loadRows()]); }} notify={notify} />
        <Snackbar open={Boolean(message)} autoHideDuration={4500} onClose={() => setMessage(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          {message ? <Alert severity={message.severity} onClose={() => setMessage(null)}>{message.text}</Alert> : undefined}
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}
