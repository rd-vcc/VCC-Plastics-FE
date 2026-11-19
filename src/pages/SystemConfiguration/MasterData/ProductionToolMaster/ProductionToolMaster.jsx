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
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import CheckIcon from "@mui/icons-material/Check";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";
import ContentCutOutlinedIcon from "@mui/icons-material/ContentCutOutlined";
import HandymanOutlinedIcon from "@mui/icons-material/HandymanOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import SearchIcon from "@mui/icons-material/Search";
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

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
import { setActiveLanguage, statusText, toolTypeText, tx } from "./locales";

const API_BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const API = `${API_BASE}/api/production-tool-master`;
const EMPTY = "—";
const TOOL_TYPES = ["CUTTING", "ASSEMBLY", "MEASURING", "HANDLING"];
const STATUSES = ["ACTIVE", "INACTIVE"];
const FIELD_DATA_TYPES = ["TEXT", "INTEGER", "DECIMAL", "BOOLEAN", "DATE"];
const numOrNull = (v) => (v === "" || v == null ? null : Number(v));
const person = (name, code) => (name ? `${name} - ${code}` : code || EMPTY);
const dateText = (value) => {
  if (!value) return EMPTY;
  const d = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return String(value);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} ${d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
};
const numText = (v, unit) => (v == null || v === "" ? EMPTY : `${Number(v).toLocaleString()}${unit ? ` ${unit}` : ""}`);
const dataTypeText = (v) => tx(`DATA_${v}`);

function buttonSx(type, overrides = {}) {
  const styles = buttonSystem[type] || {};
  return { ...(styles.base || {}), ...(styles.hover ? { "&:hover": styles.hover } : {}), ...overrides };
}

function createToolTheme(mode) {
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

const TYPE_COLORS = { CUTTING: "#F79009", ASSEMBLY: "#12B76A", MEASURING: "#7A5AF8", HANDLING: "#0BA5EC" };
function TypePill({ value, width = 132 }) {
  const color = TYPE_COLORS[value] || "#667085";
  return (
    <Box component="span" sx={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", width, height: 22, px: 0.5,
      whiteSpace: "nowrap", overflow: "hidden", borderRadius: 1, fontSize: 10, fontWeight: 700, color, bgcolor: `${color}1A`, border: `1px solid ${color}40`,
    }}>{toolTypeText(value)}</Box>
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
// tools in a location and all of its child locations
const subtreeCount = (id, kids, nodes) => (nodes.find((n) => n.id === id)?.tool_count || 0) + (kids[id] || []).reduce((sum, c) => sum + subtreeCount(c.id, kids, nodes), 0);

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
        <Typography sx={{ flex: 1, fontSize: 11, fontWeight: 800, pl: 0.5 }}>{title || tx("Location Hierarchy")}</Typography>
        <Tooltip title={tx("Expand all")}><IconButton size="small" onClick={() => setCollapsed(new Set())}><UnfoldMoreIcon sx={{ fontSize: 14.5 }} /></IconButton></Tooltip>
        <Tooltip title={tx("Collapse all")}><IconButton size="small" onClick={() => setCollapsed(new Set(parents))}><UnfoldLessIcon sx={{ fontSize: 14.5 }} /></IconButton></Tooltip>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 0.75 }}>
        {row("none", noneLabel || tx("No location"), value === "" || value == null, () => onChange(""), 0,
          <Box sx={{ width: 22, display: "grid", placeItems: "center" }}><CategoryOutlinedIcon color="disabled" sx={{ fontSize: 13 }} /></Box>)}
        {(kids.root || []).map((n) => renderNode(n, 0))}
      </Box>
    </Box>
  );
}

function CustomFieldInput({ field, value, onChange }) {
  const label = field.unit ? `${field.field_name} (${field.unit})` : field.field_name;
  if (field.data_type === "BOOLEAN") {
    return (
      <FormControl fullWidth size="small" required={Boolean(field.is_required)}>
        <InputLabel>{label}</InputLabel>
        <Select label={label} value={value === true ? "1" : value === false ? "0" : ""} onChange={(e) => onChange(e.target.value === "" ? null : e.target.value === "1")}>
          <MenuItem value=""><em>{EMPTY}</em></MenuItem>
          <MenuItem value="1">{tx("Yes")}</MenuItem>
          <MenuItem value="0">{tx("No")}</MenuItem>
        </Select>
      </FormControl>
    );
  }
  return (
    <TextField fullWidth size="small" required={Boolean(field.is_required)} label={label} value={value ?? ""} onChange={(e) => onChange(e.target.value)}
      type={["INTEGER", "DECIMAL"].includes(field.data_type) ? "number" : field.data_type === "DATE" ? "date" : "text"}
      slotProps={field.data_type === "DATE" ? { inputLabel: { shrink: true } } : undefined} />
  );
}

const emptyTool = {
  tool_code: "", tool_name: "", tool_type: "CUTTING", production_tool_node_id: "", tool_category: "", manufacturer: "", model: "",
  serial_number: "", assigned_process: "", calibration_required: false, calibration_interval_days: "", measurement_range: "",
  measurement_resolution: "", image_url: "", description: "", active: true,
};

function ToolDialog({ open, tool, nodes, fieldDefinitions, saving, onClose, onSave }) {
  const [form, setForm] = useState(emptyTool);
  const [customFields, setCustomFields] = useState({});
  useEffect(() => {
    if (!open) return;
    setForm(tool ? { ...emptyTool, ...tool, production_tool_node_id: tool.production_tool_node_id ?? "", calibration_required: Boolean(tool.calibration_required),
      calibration_interval_days: tool.calibration_interval_days ?? "", active: tool.status !== "INACTIVE" } : emptyTool);
    setCustomFields({ ...(tool?.custom_fields || {}) });
  }, [open, tool]);
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const activeFields = fieldDefinitions.filter((f) => f.is_active);
  const g = (cols) => ({ display: "grid", gridTemplateColumns: { xs: "1fr", sm: cols }, gap: 1.5, pt: 0.75 });
  const text = (v) => (v?.trim() ? v.trim() : null);
  const submit = () => {
    const prepared = {};
    activeFields.forEach((field) => {
      const raw = customFields[field.field_code];
      prepared[field.field_code] = raw === "" || raw === undefined || raw === null ? null
        : ["INTEGER", "DECIMAL"].includes(field.data_type) ? Number(raw) : field.data_type === "BOOLEAN" ? Boolean(raw) : raw;
    });
    onSave({
      tool_code: form.tool_code.trim().toUpperCase(),
      tool_name: form.tool_name.trim(),
      tool_type: form.tool_type,
      production_tool_node_id: form.production_tool_node_id === "" ? null : Number(form.production_tool_node_id),
      tool_category: text(form.tool_category),
      manufacturer: text(form.manufacturer),
      model: text(form.model),
      serial_number: text(form.serial_number),
      assigned_process: text(form.assigned_process),
      calibration_required: Boolean(form.calibration_required),
      calibration_interval_days: form.calibration_required ? numOrNull(form.calibration_interval_days) : null,
      measurement_range: text(form.measurement_range),
      measurement_resolution: text(form.measurement_resolution),
      image_url: form.image_url || null,
      description: form.description || null,
      custom_fields: prepared,
      // new tools start ready to use (or inactive); later states come from Maintenance
      ...(tool ? {} : { status: form.active ? "AVAILABLE" : "INACTIVE" }),
    });
  };
  const missingRequired = activeFields.some((f) => f.is_required && (customFields[f.field_code] === "" || customFields[f.field_code] == null));
  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="lg" slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogHeader icon={<HandymanOutlinedIcon />} title={tool ? tx("Edit Tool") : tx("Add Tool")}
        subtitle={tx("Choose the storage location on the left; fill in the tool details on the right.")} disabled={saving} onClose={onClose} />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "300px minmax(0,1fr)" }, gap: 2.5, mt: 1, height: { md: 560 } }}>
          <Stack spacing={0.75} sx={{ minHeight: 0 }}>
            <FieldLabel>{tx("Location")}</FieldLabel>
            <CategoryTreePicker nodes={nodes} value={form.production_tool_node_id} onChange={(id) => set("production_tool_node_id", id)} />
          </Stack>
          <Box sx={{ minHeight: 0, overflowY: "auto", pr: 0.5 }}>
            <Stack spacing={2.25}>
              <Stack spacing={0.5}>
                <FieldLabel>{tx("Basic information")}</FieldLabel>
                <Box sx={g("1fr 2fr")}>
                  <TextField size="small" required disabled={Boolean(tool)} label={tx("Tool Code")} placeholder="VD: TL-CUT-001" value={form.tool_code} onChange={(e) => set("tool_code", e.target.value.toUpperCase())} />
                  <TextField size="small" required label={tx("Tool Name")} value={form.tool_name} onChange={(e) => set("tool_name", e.target.value)} />
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 1, px: 1.25, py: 0.9, borderRadius: 1.5, bgcolor: (th) => (th.palette.mode === "dark" ? "#182235" : "#F1F7FF") }}>
                  <LocationOnOutlinedIcon color="primary" sx={{ fontSize: 13.5 }} />
                  <Typography variant="caption" color="text.secondary">{tx("Location")}:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 0, overflowWrap: "anywhere", color: form.production_tool_node_id ? "text.primary" : "text.disabled" }}>
                    {form.production_tool_node_id ? pathOf(nodes.find((n) => n.id === Number(form.production_tool_node_id)), nodes) : tx("No location")}
                  </Typography>
                </Box>
              </Stack>
              <Stack spacing={0.5}>
                <FieldLabel>{tx("Classification")}</FieldLabel>
                <Box sx={g("1fr 1fr 1fr 1fr")}>
                  <TextField select size="small" label={tx("Tool Type")} value={form.tool_type} onChange={(e) => set("tool_type", e.target.value)}>
                    {TOOL_TYPES.map((x) => <MenuItem key={x} value={x}>{toolTypeText(x)}</MenuItem>)}
                  </TextField>
                  <TextField size="small" label={tx("Tool Category")} placeholder="VD: Dao cắt runner" value={form.tool_category || ""} onChange={(e) => set("tool_category", e.target.value)} />
                  <TextField size="small" label={tx("Assigned Process")} placeholder="VD: Ép phun" value={form.assigned_process || ""} onChange={(e) => set("assigned_process", e.target.value)} />
                  {tool ? (
                    <TextField size="small" disabled label={tx("Status")} value={statusText(tool.status === "INACTIVE" ? "INACTIVE" : "ACTIVE")} helperText={tx("Use the status button in the detail panel")} />
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
                  <TextField size="small" label={tx("Resolution")} placeholder="VD: 0,01 mm" value={form.measurement_resolution || ""} onChange={(e) => set("measurement_resolution", e.target.value)} />
                  <TextField select size="small" label={tx("Calibration Required")} value={form.calibration_required ? "1" : "0"} onChange={(e) => set("calibration_required", e.target.value === "1")}>
                    <MenuItem value="1">{tx("Yes")}</MenuItem>
                    <MenuItem value="0">{tx("No")}</MenuItem>
                  </TextField>
                  <TextField size="small" type="number" disabled={!form.calibration_required} label={tx("Calibration Interval (days)")} value={form.calibration_interval_days} onChange={(e) => set("calibration_interval_days", e.target.value)} />
                </Box>
              </Stack>
              {activeFields.length ? (
                <Stack spacing={0.5}>
                  <FieldLabel>{tx("Custom Fields")}</FieldLabel>
                  <Box sx={g("1fr 1fr")}>
                    {activeFields.map((field) => (
                      <CustomFieldInput key={field.field_code} field={field} value={customFields[field.field_code]}
                        onChange={(v) => setCustomFields((old) => ({ ...old, [field.field_code]: v }))} />
                    ))}
                  </Box>
                </Stack>
              ) : null}
              <ImageUploadField value={form.image_url || ""} category="production_tool" label={tx("Image")} disabled={saving} onChange={(v) => set("image_url", v || "")} />
              <TextField size="small" multiline minRows={2} label={tx("Description")} value={form.description || ""} onChange={(e) => set("description", e.target.value)} />
            </Stack>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.25, borderTop: 1, borderColor: "divider", bgcolor: (th) => (th.palette.mode === "dark" ? "#0F172A" : "#F8FAFC") }}>
        <Button disabled={saving || !form.tool_code.trim() || !form.tool_name.trim() || missingRequired} onClick={submit} sx={buttonSx("primary")}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

// Settings → tool location tree: tree on the left, details / inline form of the clicked location on the right.
function CategoryTreeManager({ open, nodes, nodeTypes, canEdit, onClose, onReload, request, actor }) {
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("view"); // view | new | edit
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const kids = useMemo(() => childrenMap(nodes), [nodes]);
  useEffect(() => { if (open) { setMode("view"); setError(""); } }, [open]);
  useEffect(() => {
    if (open && !nodes.some((n) => n.id === selectedId)) setSelectedId(kids.root?.[0]?.id ?? nodes[0]?.id ?? null);
  }, [open, nodes, kids, selectedId]);
  const selected = nodes.find((n) => n.id === selectedId) || null;
  const byId = (id) => nodes.find((n) => n.id === id);
  const kidsOf = (id) => kids[id]?.length || 0;
  const descendants = (id) => {
    const out = new Set([id]);
    const walk = (x) => (kids[x] || []).forEach((c) => { out.add(c.id); walk(c.id); });
    walk(id);
    return out;
  };
  const parents = nodes.filter((n) => kidsOf(n.id)).map((n) => n.id);
  const toggle = (id) => setCollapsed((old) => { const next = new Set(old); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const activeTypes = [...nodeTypes].filter((x) => x.is_active).sort((a, b) => (a.level_order || 0) - (b.level_order || 0));

  const startNew = (parent) => {
    // suggest the type one level below the parent's
    const parentLevel = parent ? nodeTypes.find((x) => x.id === parent.node_type_id)?.level_order || 0 : 0;
    const type = activeTypes.find((x) => (x.level_order || 0) > parentLevel) || activeTypes[0];
    setForm({ code: "", name: "", node_type_id: type?.id ?? "", parent_id: parent?.id ?? "", sort_order: (parent ? kidsOf(parent.id) : kids.root?.length || 0) + 1, status: "ACTIVE", description: "" });
    setError(""); setMode("new");
  };
  const startEdit = (n) => {
    setForm({ code: n.code, name: n.name, node_type_id: n.node_type_id, parent_id: n.parent_id ?? "", sort_order: n.sort_order ?? 0, status: n.status || "ACTIVE", description: n.description || "" });
    setError(""); setMode("edit");
  };
  const run = async (fn) => {
    setBusy(true); setError("");
    try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const save = () => run(async () => {
    const payload = {
      name: form.name.trim(), node_type_id: Number(form.node_type_id), parent_id: form.parent_id === "" ? null : Number(form.parent_id),
      sort_order: Number(form.sort_order || 0), status: form.status, description: form.description || null,
      ...(mode === "edit" ? { updated_by: actor } : { code: form.code.trim(), created_by: actor }),
    };
    const res = await request(mode === "edit" ? `${API}/nodes/${selected.id}` : `${API}/nodes`, { method: mode === "edit" ? "PUT" : "POST", body: JSON.stringify(payload) });
    await onReload();
    if (mode === "new" && res?.id) setSelectedId(res.id);
    if (payload.parent_id) setCollapsed((old) => { const next = new Set(old); next.delete(payload.parent_id); return next; });
    setMode("view");
  });
  const toggleStatus = () => run(async () => {
    await request(`${API}/nodes/${selected.id}/status`, { method: "PATCH", body: JSON.stringify({ status: selected.status === "ACTIVE" ? "INACTIVE" : "ACTIVE", updated_by: actor }) });
    await onReload();
  });
  const remove = () => {
    if (!window.confirm(tx("Are you sure you want to delete this item?"))) return;
    run(async () => {
      await request(`${API}/nodes/${selected.id}`, { method: "DELETE" });
      setSelectedId(selected.parent_id ?? null);
      await onReload();
    });
  };

  const renderNode = (node, depth) => {
    const list = kids[node.id] || [];
    const isOpen = !collapsed.has(node.id);
    const isSel = node.id === selectedId;
    return (
      <Box key={node.id}>
        <Box onClick={() => { if (mode === "view") setSelectedId(node.id); }} sx={{ minHeight: 27, pl: `${depth * 16 + 2}px`, pr: 0.75, display: "flex", alignItems: "center", gap: 0.5, borderRadius: 1,
          cursor: mode === "view" ? "pointer" : "default", bgcolor: isSel ? "action.selected" : "transparent", "&:hover": { bgcolor: isSel ? "action.selected" : "action.hover" } }}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); if (list.length) toggle(node.id); }} sx={{ width: 22, height: 22, visibility: list.length ? "visible" : "hidden" }}>
            {isOpen ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ChevronRightIcon sx={{ fontSize: 14 }} />}
          </IconButton>
          {list.length ? <AccountTreeOutlinedIcon color="primary" sx={{ fontSize: 13.5, flexShrink: 0 }} /> : <CategoryOutlinedIcon sx={{ fontSize: 13, flexShrink: 0, color: "text.secondary" }} />}
          <Typography noWrap title={`${node.code} · ${node.name}`} sx={{ flex: 1, minWidth: 0, fontSize: 11.5, fontWeight: isSel ? 800 : depth ? 600 : 700, color: node.status === "ACTIVE" ? "text.primary" : "text.disabled" }}>{node.name}</Typography>
          <CountBadge value={subtreeCount(node.id, kids, nodes)} />
        </Box>
        {list.length && isOpen ? list.map((k) => renderNode(k, depth + 1)) : null}
      </Box>
    );
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const header = (icon, title, code, right) => (
    <Box sx={{ p: 1.5, flexShrink: 0, display: "grid", gridTemplateColumns: "44px minmax(0,1fr) auto", columnGap: 1.25, alignItems: "center" }}>
      <Box sx={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", color: "#FFF", bgcolor: "#005BAB" }}>{icon}</Box>
      <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0.25 }}>
        <Typography noWrap sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>{title}</Typography>
        <Typography noWrap color="text.secondary" sx={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2 }}>{code}</Typography>
      </Box>
      {right}
    </Box>
  );
  const valid = form.name?.trim() && form.node_type_id && (mode === "edit" || form.code?.trim());

  return (
    <Dialog open={open} fullWidth maxWidth="lg" onClose={busy ? undefined : onClose} slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogHeader icon={<AccountTreeOutlinedIcon />} title={tx("Location Hierarchy")} subtitle={tx("Tool locations and their parent / child levels.")} disabled={busy} onClose={onClose} />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "380px minmax(0,1fr)" }, gap: 2.5, mt: 1, height: { md: 470 } }}>
          <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
            <Box sx={{ px: 1, py: 0.5, display: "flex", alignItems: "center", borderBottom: 1, borderColor: "divider", bgcolor: (th) => (th.palette.mode === "dark" ? "#182235" : "#F1F7FF") }}>
              <Typography sx={{ flex: 1, fontSize: 11, fontWeight: 800, pl: 0.5 }}>{nodes.length} {tx("locations")}</Typography>
              <Tooltip title={tx("Expand all")}><IconButton size="small" onClick={() => setCollapsed(new Set())}><UnfoldMoreIcon sx={{ fontSize: 14.5 }} /></IconButton></Tooltip>
              <Tooltip title={tx("Collapse all")}><IconButton size="small" onClick={() => setCollapsed(new Set(parents))}><UnfoldLessIcon sx={{ fontSize: 14.5 }} /></IconButton></Tooltip>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 0.75 }}>
              {(kids.root || []).map((n) => renderNode(n, 0))}
            </Box>
            <Box sx={{ p: 1, borderTop: 1, borderColor: "divider" }}>
              <Button fullWidth variant="contained" disabled={!canEdit || busy || mode !== "view"} onClick={() => startNew(null)} startIcon={<AddIcon />} sx={buttonSx("primary")}>{tx("Add Location")}</Button>
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, border: 1, borderColor: mode === "view" ? "divider" : "primary.main", borderRadius: 1.5, overflow: "hidden" }}>
            {mode !== "view" ? (
              <>
                {header(mode === "edit" ? <EditOutlinedIcon sx={{ fontSize: 18 }} /> : <AddIcon sx={{ fontSize: 18 }} />,
                  mode === "edit" ? `${tx("Edit")} · ${selected?.name}` : tx("Add Location"),
                  mode === "edit" ? selected?.code : form.parent_id ? `${tx("Parent Location")}: ${pathOf(byId(Number(form.parent_id)), nodes)}` : tx("Root location"))}
                <Divider />
                <Box sx={{ p: 1.5, flex: 1, minHeight: 0, overflowY: "auto", display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0,1fr) minmax(0,1fr)" }, gap: 2 }}>
                  <Stack spacing={1.5}>
                    <FieldLabel>{tx("General")}</FieldLabel>
                    <TextField size="small" required disabled={mode === "edit"} label={tx("Code")} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
                    <TextField size="small" required label={tx("Name")} value={form.name} onChange={set("name")} />
                    <TextField select size="small" required label={tx("Location Type")} value={form.node_type_id} onChange={set("node_type_id")}>
                      {[...nodeTypes].sort((a, b) => (a.level_order || 0) - (b.level_order || 0)).filter((x) => x.is_active || x.id === form.node_type_id).map((x) => <MenuItem key={x.id} value={x.id}>{x.name}</MenuItem>)}
                    </TextField>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                      <TextField size="small" type="number" label={tx("Sort Order")} value={form.sort_order} onChange={set("sort_order")} />
                      <TextField select size="small" label={tx("Status")} value={form.status} onChange={set("status")}>
                        {STATUSES.map((x) => <MenuItem key={x} value={x}>{statusText(x)}</MenuItem>)}
                      </TextField>
                    </Box>
                    <TextField size="small" multiline minRows={2} label={tx("Description")} value={form.description} onChange={set("description")} />
                  </Stack>
                  <Stack spacing={1.5} sx={{ minHeight: 280 }}>
                    <FieldLabel>{tx("Parent Location")}</FieldLabel>
                    <CategoryTreePicker nodes={nodes} value={form.parent_id} onChange={(v) => setForm((f) => ({ ...f, parent_id: v }))}
                      noneLabel={tx("Root location")} excludeIds={mode === "edit" && selected ? descendants(selected.id) : undefined} />
                  </Stack>
                </Box>
                {error ? <Alert severity="error" sx={{ mx: 1.5, mb: 1 }}>{error}</Alert> : null}
                <Divider />
                <Stack direction="row" sx={{ p: 1.5, justifyContent: "flex-end", gap: 1, flexShrink: 0, bgcolor: (th) => (th.palette.mode === "dark" ? "rgba(255,255,255,.02)" : "#F8FAFC") }}>
                  <Button disabled={busy} onClick={() => { setMode("view"); setError(""); }} sx={buttonSx("cancel")}>{tx("Discard")}</Button>
                  <Button disabled={busy || !valid} onClick={save} sx={buttonSx("primary")} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}>{tx("Save")}</Button>
                </Stack>
              </>
            ) : selected ? (
              <>
                {header(kidsOf(selected.id) ? <AccountTreeOutlinedIcon sx={{ fontSize: 18 }} /> : <CategoryOutlinedIcon sx={{ fontSize: 18 }} />,
                  selected.name, selected.code, <StatusPill active={selected.status === "ACTIVE"} />)}
                <Box sx={{ px: 1.5, pb: 1.5, flex: 1, minHeight: 0, overflowY: "auto" }}>
                  <Stack spacing={1.5}>
                    <DetailSection title={tx("General")}>
                      <DetailRow label={tx("Path")}>{pathOf(selected, nodes)}</DetailRow>
                      <DetailRow label={tx("Parent Location")}>{byId(selected.parent_id)?.name || tx("Root location")}</DetailRow>
                      <DetailRow label={tx("Location Type")}>{selected.type_name || EMPTY}</DetailRow>
                      <DetailRow label={tx("Child locations")}>{kidsOf(selected.id)}</DetailRow>
                      <DetailRow label={tx("Tools")}>{subtreeCount(selected.id, kids, nodes)}</DetailRow>
                      <DetailRow label={tx("Sort Order")}>{selected.sort_order ?? 0}</DetailRow>
                      <DetailRow label={tx("Description")} last>{selected.description || EMPTY}</DetailRow>
                    </DetailSection>
                    <DetailSection title={tx("Record")}>
                      <DetailRow label={tx("Created By")}>{person(selected.created_by_name, selected.created_by_code || selected.created_by)}</DetailRow>
                      <DetailRow label={tx("Created Date")}>{dateText(selected.created_at)}</DetailRow>
                      <DetailRow label={tx("Updated By")}>{selected.updated_by ? person(selected.updated_by_name, selected.updated_by_code || selected.updated_by) : EMPTY}</DetailRow>
                      <DetailRow label={tx("Last Modified")} last>{dateText(selected.updated_at)}</DetailRow>
                    </DetailSection>
                  </Stack>
                </Box>
                {error ? <Alert severity="error" sx={{ mx: 1.5, mb: 1 }}>{error}</Alert> : null}
                <Divider />
                <Stack direction="row" sx={{ p: 1.5, justifyContent: "center", gap: 1.5, flexShrink: 0 }}>
                  <ActionIcon title={tx("Add Child Location")} icon={<AddIcon fontSize="small" />} color="primary" disabled={!canEdit || busy} onClick={() => startNew(selected)} />
                  <ActionIcon title={tx("Edit")} icon={<EditOutlinedIcon fontSize="small" />} disabled={!canEdit || busy} onClick={() => startEdit(selected)} />
                  <ActionIcon title={selected.status === "ACTIVE" ? tx("Deactivate") : tx("Activate")}
                    icon={selected.status === "ACTIVE" ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
                    color={selected.status === "ACTIVE" ? "warning" : "success"} disabled={!canEdit || busy} onClick={toggleStatus} />
                  <ActionIcon title={kidsOf(selected.id) ? tx("Delete its child locations first") : selected.tool_count ? tx("Location holds tools, cannot delete") : tx("Delete")}
                    icon={<DeleteOutlineIcon fontSize="small" />} color="error" disabled={!canEdit || busy || Boolean(kidsOf(selected.id)) || Boolean(selected.tool_count)} onClick={remove} />
                </Stack>
              </>
            ) : (
              <Box sx={{ flex: 1, display: "grid", placeItems: "center", p: 2 }}>
                <Typography variant="body2" color="text.secondary">{tx("Select a location on the left to view its details.")}</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// Settings → category types / custom fields: table on the left, details or the inline form on the right
// (same layout as the managers on the Machine & Equipment page).
const MANAGER = {
  type: { segment: "node-types", code: "code", name: "name", icon: CategoryOutlinedIcon, title: "Location Types", subtitle: "Location types and their level in the location tree.", add: "Add Location Type" },
  field: { segment: "field-definitions", code: "field_code", name: "field_name", icon: TuneOutlinedIcon, title: "Custom Fields", subtitle: "Define extra fields that can be filled in on any tool.", add: "Add Field" },
};

function ToolSettingsManager({ open, kind, rows: rawRows, types = [], canEdit, request, actor, onClose, onReload, notify }) {
  const conf = MANAGER[kind] || MANAGER.type;
  const Icon = conf.icon;
  const rows = useMemo(() => [...rawRows].sort((a, b) => (kind === "type" ? (a.level_order || 0) - (b.level_order || 0) : 0) || (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id), [rawRows, kind]);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("view");
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) setMode("view"); }, [open, kind]);
  useEffect(() => { if (open && !rows.some((r) => r.id === selectedId)) setSelectedId(rows[0]?.id ?? null); }, [open, rows, selectedId]);
  const selected = rows.find((r) => r.id === selectedId) || null;
  const yesNo = (v) => (v ? tx("Yes") : tx("No"));
  const typeName = (id) => types.find((t) => t.id === id)?.name;
  const inUse = kind === "type" && selected ? Number(selected.node_count || 0) + Number(selected.child_type_count || 0) : 0;

  const toForm = (item) => (kind === "type"
    ? { code: item?.code || "", name: item?.name || "", parent: item?.parent_type_id ?? "", level: item?.level_order ?? 1, sort: item?.sort_order ?? 0, active: item ? Boolean(item.is_active) : true }
    : { code: item?.field_code || "", name: item?.field_name || "", dataType: item?.data_type || "TEXT", unit: item?.unit || "", required: Boolean(item?.is_required), sort: item?.sort_order ?? 0, active: item ? Boolean(item.is_active) : true, description: item?.description || "" });
  const toPayload = (f, isNew) => {
    const who = isNew ? { created_by: actor } : { updated_by: actor };
    if (kind === "type") return { ...who, ...(isNew ? { code: f.code.trim().toUpperCase() } : {}), name: f.name.trim(), parent_type_id: f.parent === "" ? null : Number(f.parent), level_order: Number(f.level || 1), sort_order: Number(f.sort || 0), is_active: Boolean(f.active) };
    return { ...who, ...(isNew ? { field_code: f.code.trim().toUpperCase(), data_type: f.dataType } : {}), field_name: f.name.trim(), unit: f.unit.trim() || null, is_required: Boolean(f.required), sort_order: Number(f.sort || 0), is_active: Boolean(f.active), description: f.description.trim() || null };
  };
  const base = `${API}/${conf.segment}`;
  const submit = async (f, isNew, item) => {
    setSaving(true);
    try {
      const result = await request(isNew ? base : `${base}/${item.id}`, { method: isNew ? "POST" : "PUT", body: JSON.stringify(toPayload(f, isNew)) });
      await onReload();
      if (isNew && result?.id) setSelectedId(result.id);
      setMode("view");
      notify("success", tx("Data saved successfully."));
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const remove = async (item) => {
    if (!window.confirm(tx("Are you sure you want to delete this item?"))) return;
    setSaving(true);
    try {
      await request(`${base}/${item.id}`, { method: "DELETE" });
      await onReload(); setSelectedId(null);
      notify("success", tx("Data deleted."));
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const change = (key) => (e) => setForm((old) => ({ ...old, [key]: e.target.value }));

  const statusCol = { headerName: tx("Status"), field: "is_active", minWidth: 110, flex: 0.6, cellRenderer: (p) => <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}><StatusPill active={Boolean(p.value)} /></Box> };
  const cols = kind === "type" ? [
    { headerName: tx("Code"), field: "code", width: 140, pinned: "left" },
    { headerName: tx("Name"), field: "name", minWidth: 160, flex: 1.4 },
    { headerName: tx("Parent Type"), field: "parent_type_id", minWidth: 130, flex: 1, valueFormatter: (p) => typeName(p.value) || EMPTY },
    { headerName: tx("Level Order"), field: "level_order", minWidth: 80, flex: 0.5, cellStyle: { justifyContent: "center" } },
    { headerName: tx("Locations"), field: "node_count", minWidth: 90, flex: 0.55, cellStyle: { justifyContent: "center" }, valueFormatter: (p) => p.value ?? 0 },
    statusCol,
  ] : [
    { headerName: tx("Code"), field: "field_code", width: 150, pinned: "left" },
    { headerName: tx("Name"), field: "field_name", minWidth: 160, flex: 1.4 },
    { headerName: tx("Data Type"), field: "data_type", minWidth: 115, flex: 0.8, valueFormatter: (p) => dataTypeText(p.value) },
    { headerName: tx("Unit"), field: "unit", minWidth: 80, flex: 0.5, valueFormatter: (p) => p.value || EMPTY },
    { headerName: tx("Required"), field: "is_required", minWidth: 90, flex: 0.5, cellStyle: { justifyContent: "center" }, valueFormatter: (p) => yesNo(p.value) },
    statusCol,
  ];

  const editing = mode !== "view";
  const isNew = mode === "new";
  const valid = form && form.code.trim() && form.name.trim();
  const statusSelect = () => (
    <FormControl fullWidth size="small">
      <InputLabel>{tx("Status")}</InputLabel>
      <Select label={tx("Status")} value={form.active} onChange={change("active")}>
        <MenuItem value={true}>{statusText("ACTIVE")}</MenuItem><MenuItem value={false}>{statusText("INACTIVE")}</MenuItem>
      </Select>
    </FormControl>
  );

  const detail = selected ? (
    <>
      <Box sx={{ p: 1.5, flexShrink: 0 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr) auto", columnGap: 1.25, alignItems: "center" }}>
          <Box sx={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", color: "#FFF", bgcolor: "#005BAB" }}><Icon sx={{ fontSize: 18 }} /></Box>
          <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0.25 }}>
            <Typography noWrap sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>{selected[conf.name]}</Typography>
            <Typography noWrap color="text.secondary" sx={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2 }}>{selected[conf.code]}</Typography>
          </Box>
          <StatusPill active={Boolean(selected.is_active)} />
        </Box>
      </Box>
      <Box sx={{ px: 1.5, pb: 1.5, flex: 1, minHeight: 0, overflowY: "auto" }}>
        <DetailSection title={tx("General")}>
          {kind === "type" ? <>
            <DetailRow label={tx("Parent Type")}>{typeName(selected.parent_type_id) || EMPTY}</DetailRow>
            <DetailRow label={tx("Level Order")}>{selected.level_order ?? 1}</DetailRow>
            <DetailRow label={tx("Locations")}>{selected.node_count ?? 0}</DetailRow>
            <DetailRow label={tx("Sort Order")} last>{selected.sort_order ?? 0}</DetailRow>
          </> : <>
            <DetailRow label={tx("Data Type")}>{dataTypeText(selected.data_type)}</DetailRow>
            <DetailRow label={tx("Unit")}>{selected.unit || EMPTY}</DetailRow>
            <DetailRow label={tx("Required")}>{yesNo(selected.is_required)}</DetailRow>
            <DetailRow label={tx("Sort Order")}>{selected.sort_order ?? 0}</DetailRow>
            <DetailRow label={tx("Description")} last>{selected.description || EMPTY}</DetailRow>
          </>}
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
  );

  const formPanel = form ? (
    <>
      <Box sx={{ px: 1.5, py: 1.25, flexShrink: 0, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
        {isNew ? <AddIcon color="primary" fontSize="small" /> : <EditOutlinedIcon color="primary" fontSize="small" />}
        <Typography noWrap sx={{ fontSize: 12, fontWeight: 800 }}>{isNew ? tx(conf.add) : `${tx("Edit")} · ${selected?.[conf.name] || ""}`}</Typography>
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
            {kind === "type" ? <>
              <FormControl fullWidth size="small">
                <InputLabel>{tx("Parent Type")}</InputLabel>
                <Select label={tx("Parent Type")} value={form.parent} onChange={change("parent")}>
                  <MenuItem value=""><em>{EMPTY}</em></MenuItem>
                  {types.filter((t) => t.id !== selected?.id || isNew).map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                </Select>
              </FormControl>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.25 }}>
                <TextField fullWidth size="small" type="number" label={tx("Level Order")} value={form.level} onChange={change("level")} />
                <TextField fullWidth size="small" type="number" label={tx("Sort Order")} value={form.sort} onChange={change("sort")} />
                {statusSelect()}
              </Box>
            </> : <>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{tx("Data Type")}</InputLabel>
                  <Select label={tx("Data Type")} value={form.dataType} disabled={!isNew} onChange={change("dataType")}>
                    {FIELD_DATA_TYPES.map((d) => <MenuItem key={d} value={d}>{dataTypeText(d)}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField fullWidth size="small" label={tx("Unit")} placeholder="VD: %, °C" value={form.unit} onChange={change("unit")} />
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.25 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{tx("Required")}</InputLabel>
                  <Select label={tx("Required")} value={form.required} onChange={change("required")}>
                    <MenuItem value={true}>{tx("Yes")}</MenuItem><MenuItem value={false}>{tx("No")}</MenuItem>
                  </Select>
                </FormControl>
                <TextField fullWidth size="small" type="number" label={tx("Sort Order")} value={form.sort} onChange={change("sort")} />
                {statusSelect()}
              </Box>
            </>}
          </Stack>
          {kind === "field" ? <TextField fullWidth multiline minRows={3} label={tx("Description")} value={form.description} onChange={change("description")} /> : null}
        </Stack>
      </Box>
      <Divider />
      <Stack direction="row" sx={{ p: 1.5, minHeight: 64, boxSizing: "border-box", justifyContent: "flex-end", alignItems: "center", gap: 1, flexShrink: 0 }}>
        <Button disabled={saving} onClick={() => setMode("view")} sx={buttonSx("cancel")}>{tx("Discard")}</Button>
        <Button disabled={saving || !valid} onClick={() => submit(form, isNew, selected)} sx={buttonSx("primary")} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>{tx("Save")}</Button>
      </Stack>
    </>
  ) : null;

  return (
    <Dialog open={open} fullWidth maxWidth="lg" onClose={saving ? undefined : onClose} slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogHeader icon={<Icon />} title={tx(conf.title)} subtitle={tx(conf.subtitle)} disabled={saving} onClose={onClose} />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0,1fr) 380px" }, gap: 2.5, mt: 1, height: { md: 500 } }}>
          {/* left: table; its footer row has the right panel's footer height so the buttons line up */}
          <Box sx={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
            <Box sx={{ flex: 1, minHeight: 300 }}>
              <AgGridTable rowData={rows} columnDefs={cols} height="100%" getRowId={(p) => String(p.data.id)} onRowClicked={(e) => { if (!editing) setSelectedId(e.data.id); }} />
            </Box>
            <Stack direction="row" sx={{ minHeight: 66, boxSizing: "border-box", alignItems: "center", flexShrink: 0 }}>
              <Button variant="contained" disabled={!canEdit || saving || editing} startIcon={<AddIcon />} onClick={() => { setForm(toForm(null)); setMode("new"); }} sx={buttonSx("primary")}>{tx(conf.add)}</Button>
              <Box sx={{ flex: 1 }} />
              <Typography variant="caption" color="text.secondary">{rows.length} {tx("rows")}</Typography>
            </Stack>
          </Box>
          <Box sx={{ minHeight: 0, display: "flex", flexDirection: "column", border: 1, borderColor: editing ? "primary.main" : "divider", borderRadius: 1.5, overflow: "hidden" }}>
            {editing ? formPanel : detail}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function CategoryTreeNode({ node, kids, nodes, selectedId, collapsed, onToggle, onSelect, depth = 0 }) {
  const list = kids[node.id] || [];
  const open = !collapsed.has(node.id);
  const isSel = selectedId === node.id;
  return (
    <Box>
      <Box onClick={() => onSelect(node.id)} sx={{ minHeight: 30, pl: `${depth * 13 + 3}px`, pr: 0.5, display: "flex", alignItems: "center", gap: 0.35, cursor: "pointer", borderRadius: 1,
        bgcolor: isSel ? "action.selected" : "transparent", "&:hover": { bgcolor: "action.hover" } }}>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); if (list.length) onToggle(node.id); }} sx={{ width: 19, height: 19 }}>
          {list.length ? (open ? <ExpandMoreIcon sx={{ fontSize: 13.5 }} /> : <ChevronRightIcon sx={{ fontSize: 13.5 }} />) : <Box sx={{ width: 16 }} />}
        </IconButton>
        {list.length ? <AccountTreeOutlinedIcon color="primary" sx={{ fontSize: 13.5 }} /> : <CategoryOutlinedIcon sx={{ fontSize: 13, color: "text.secondary" }} />}
        <Typography noWrap title={node.name} sx={{ flex: 1, fontSize: 11.5, fontWeight: isSel ? 800 : 600, color: node.status === "ACTIVE" ? "text.primary" : "text.disabled" }}>{node.name}</Typography>
        <Box sx={{ mr: 0.5, display: "flex" }}><CountBadge value={subtreeCount(node.id, kids, nodes)} /></Box>
      </Box>
      {open && list.map((child) => (
        <CategoryTreeNode key={child.id} node={child} kids={kids} nodes={nodes} selectedId={selectedId} collapsed={collapsed} onToggle={onToggle} onSelect={onSelect} depth={depth + 1} />
      ))}
    </Box>
  );
}

export default function ProductionToolMaster() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  const { theme } = useAppTheme();
  const dark = theme === "dark";
  const muiTheme = useMemo(() => createToolTheme(dark ? "dark" : "light"), [dark]);
  const { canEdit } = usePagePermission();
  const actor = getCurrentUser()?.employee_code || "SYSTEM";

  const [nodes, setNodes] = useState([]);
  const [nodeTypes, setNodeTypes] = useState([]);
  const [fieldDefinitions, setFieldDefinitions] = useState([]);
  const [allTools, setAllTools] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detailVersion, setDetailVersion] = useState(0); // bumped after a save so the open detail reloads
  const [nodeId, setNodeId] = useState(null);
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [detailTab, setDetailTab] = useState(0);
  const [filters, setFilters] = useState({ keyword: "", toolType: "", status: "", manufacturer: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toolDialog, setToolDialog] = useState(null);
  const [settings, setSettings] = useState(null); // tree | types | fields
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

  const loadReference = useCallback(async () => {
    const [nodeData, typeData, fieldData] = await Promise.all([request(`${API}/nodes`), request(`${API}/node-types`), request(`${API}/field-definitions`)]);
    setNodes(nodeData || []);
    setNodeTypes(typeData || []);
    setFieldDefinitions(fieldData || []);
  }, [request]);
  const loadTools = useCallback(async () => {
    const data = await request(`${API}/tools?page=1&page_size=500`);
    const list = data?.items || [];
    setAllTools(list);
    setSelectedId((old) => (list.some((x) => x.id === old) ? old : list[0]?.id ?? null));
  }, [request]);
  const loadAll = useCallback(async () => {
    setLoading(true);
    try { await Promise.all([loadReference(), loadTools()]); }
    catch (e) { notify("error", e.message || tx("Unable to load Production Tool Master data.")); }
    finally { setLoading(false); }
  }, [loadReference, loadTools, notify]);
  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => {
    if (!selectedId) { setSelected(null); return; }
    request(`${API}/tools/${selectedId}`).then(setSelected).catch((e) => notify("error", e.message));
  }, [selectedId, request, notify, detailVersion]);

  const kids = useMemo(() => childrenMap(nodes), [nodes]);
  const inLocation = useMemo(() => {
    if (!nodeId) return null;
    const ids = new Set([nodeId]);
    const walk = (x) => (kids[x] || []).forEach((c) => { ids.add(c.id); walk(c.id); });
    walk(nodeId);
    return ids;
  }, [nodeId, kids]);
  const isActive = (t) => t.status !== "INACTIVE";
  const tools = useMemo(() => {
    const q = filters.keyword.trim().toLowerCase();
    return allTools.filter((t) => (!q || `${t.tool_code} ${t.tool_name} ${t.model || ""} ${t.serial_number || ""}`.toLowerCase().includes(q))
      && (!filters.toolType || t.tool_type === filters.toolType)
      && (!filters.status || (filters.status === "ACTIVE" ? isActive(t) : !isActive(t)))
      && (!filters.manufacturer || t.manufacturer === filters.manufacturer)
      && (!inLocation || inLocation.has(t.production_tool_node_id)));
  }, [allTools, filters, inLocation]);
  const manufacturers = useMemo(() => [...new Set(allTools.map((x) => x.manufacturer).filter(Boolean))].sort(), [allTools]);

  const columns = useMemo(() => [
    { headerName: tx("Tool Code"), field: "tool_code", width: 130, pinned: "left" },
    { headerName: tx("Tool Name"), field: "tool_name", minWidth: 180, flex: 1.6 },
    { headerName: tx("Tool Type"), field: "tool_type", minWidth: 150, flex: 1, cellRenderer: (p) => <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}><TypePill value={p.value} /></Box> },
    { headerName: tx("Location"), field: "production_tool_node_name", minWidth: 130, flex: 1, valueFormatter: (p) => p.value || EMPTY },
    { headerName: tx("Manufacturer"), field: "manufacturer", minWidth: 120, flex: 0.9, valueFormatter: (p) => p.value || EMPTY },
    { headerName: tx("Model"), field: "model", minWidth: 100, flex: 0.8, valueFormatter: (p) => p.value || EMPTY },
    { headerName: tx("Status"), field: "status", minWidth: 115, flex: 0.7, cellRenderer: (p) => <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}><StatusPill active={p.value !== "INACTIVE"} /></Box> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [language]);

  const saveTool = async (form) => {
    setSaving(true);
    try {
      const editing = Boolean(toolDialog?.id);
      const result = await request(editing ? `${API}/tools/${toolDialog.id}` : `${API}/tools`, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({ ...form, ...(editing ? { version: toolDialog.version, updated_by: actor } : { created_by: actor }) }),
      });
      setToolDialog(null);
      await Promise.all([loadReference(), loadTools()]);
      if (!editing && result?.id) setSelectedId(result.id);
      setDetailVersion((v) => v + 1);
      notify("success", tx("Data saved successfully."));
    } catch (e) { notify("error", e.message || tx("Unable to save data.")); } finally { setSaving(false); }
  };
  const toggleStatus = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await request(`${API}/tools/${selected.id}/status`, { method: "PATCH", body: JSON.stringify({ status: isActive(selected) ? "INACTIVE" : "AVAILABLE", version: selected.version, updated_by: actor }) });
      await loadTools(); setDetailVersion((v) => v + 1);
      notify("success", tx("Status updated."));
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const deleteTool = async () => {
    if (!selected || !window.confirm(tx("Are you sure you want to delete this item?"))) return;
    setSaving(true);
    try {
      await request(`${API}/tools/${selected.id}`, { method: "DELETE" });
      await Promise.all([loadReference(), loadTools()]);
      notify("success", tx("Data deleted."));
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };

  const countType = (t) => allTools.filter((x) => x.tool_type === t).length;
  const percent = (n) => (allTools.length ? `${((n / allTools.length) * 100).toFixed(1)}% ${tx("of total")}` : `0% ${tx("of total")}`);
  const kpis = [
    { label: tx("Total Tools"), value: allTools.length, note: `${allTools.filter((t) => t.calibration_required).length} ${tx("require calibration")}`, icon: HandymanOutlinedIcon, tone: "primary" },
    { label: toolTypeText("CUTTING"), value: countType("CUTTING"), note: percent(countType("CUTTING")), icon: ContentCutOutlinedIcon, tone: "warning" },
    { label: toolTypeText("ASSEMBLY"), value: countType("ASSEMBLY"), note: percent(countType("ASSEMBLY")), icon: BuildOutlinedIcon, tone: "success" },
    { label: toolTypeText("MEASURING"), value: countType("MEASURING"), note: percent(countType("MEASURING")), icon: StraightenOutlinedIcon, tone: "accent" },
    { label: toolTypeText("HANDLING"), value: countType("HANDLING"), note: percent(countType("HANDLING")), icon: LocalShippingOutlinedIcon, tone: "info" },
    { label: tx("Inactive Tools"), value: allTools.filter((t) => !isActive(t)).length, note: tx("Not used for new data"), icon: BlockOutlinedIcon, tone: "danger" },
  ];
  const activeFields = fieldDefinitions.filter((f) => f.is_active);
  const customValue = (field, v) => (v == null || v === "" ? null : field.data_type === "BOOLEAN" ? (v ? tx("Yes") : tx("No")) : `${v}${field.unit ? ` ${field.unit}` : ""}`);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box sx={dark ? { "& .vcc-ag-grid": { "--ag-background-color": "#111827", "--ag-header-background-color": "#182235", "--ag-foreground-color": "#D0D5DD", "--ag-border-color": "#344054" } } : {}}>
        <PageMeta title={`${tx("Production Tool Master")} | VCC Plastics`} description={tx("Manage cutting, assembly, measuring and handling tools with location hierarchy and technical specifications.")} />
        <PageBreadcrumb pageTitle={tx("Production Tool Master")} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr auto" }, gap: 1.5, alignItems: "center", mb: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{tx("Production Tool Master")}</Typography>
            <Typography variant="body2" color="text.secondary">{tx("Manage cutting, assembly, measuring and handling tools with location hierarchy and technical specifications.")}</Typography>
          </Box>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2, justifyContent: "flex-end" }}>
            <SettingsMenu title={tx("Settings")} items={[
              { key: "tree", label: tx("Location Hierarchy"), icon: <AccountTreeOutlinedIcon />, onClick: () => setSettings("tree") },
              { key: "types", label: tx("Location Types"), icon: <CategoryOutlinedIcon />, onClick: () => setSettings("types") },
              { key: "fields", label: tx("Custom Fields"), icon: <TuneOutlinedIcon />, onClick: () => setSettings("fields") },
            ]} />
            <Button variant="contained" startIcon={<AddIcon />} disabled={!canEdit} onClick={() => setToolDialog({})} sx={buttonSx("primary")}>{tx("Add Tool")}</Button>
          </Stack>
        </Box>

        <KpiCardGroup>
          {kpis.map((item) => { const Icon = item.icon; return <KpiCard key={item.label} label={item.label} value={item.value} note={item.note} icon={<Icon />} tone={item.tone} />; })}
        </KpiCardGroup>

        <Paper variant="outlined" sx={{ my: 1.5, p: 1.5, borderRadius: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(240px,1.6fr) repeat(3,minmax(145px,1fr)) auto" }, gap: 1 }}>
            <TextField size="small" placeholder={tx("Search by tool code, name, model or serial...")} value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
            <FormControl size="small">
              <InputLabel shrink>{tx("Tool Type")}</InputLabel>
              <Select displayEmpty notched label={tx("Tool Type")} value={filters.toolType} onChange={(e) => setFilters({ ...filters, toolType: e.target.value })}>
                <MenuItem value="">{tx("All Types")}</MenuItem>
                {TOOL_TYPES.map((x) => <MenuItem key={x} value={x}>{toolTypeText(x)}</MenuItem>)}
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
                <MenuItem value="">{tx("All Statuses")}</MenuItem>
                <MenuItem value="ACTIVE">{statusText("ACTIVE")}</MenuItem>
                <MenuItem value="INACTIVE">{statusText("INACTIVE")}</MenuItem>
              </Select>
            </FormControl>
            <Button startIcon={<FilterListIcon />} onClick={() => { setFilters({ keyword: "", toolType: "", status: "", manufacturer: "" }); setNodeId(null); }}
              sx={buttonSx("cancel", { minHeight: 29, whiteSpace: "nowrap" })}>{tx("Clear")}</Button>
          </Box>
        </Paper>

        <Box ref={panelsRef} sx={masterGridSx}>
          {/* left: tool location tree */}
          <Paper sx={{ ...panelSx, height: panelHeight, display: "flex", flexDirection: "column" }}>
            <PanelHeader title={tx("Location Hierarchy")} icon={<AccountTreeOutlinedIcon color="primary" fontSize="small" />} />
            <Box sx={{ p: 0.75, flex: 1, minHeight: 0, overflow: "auto" }}>
              <Box onClick={() => setNodeId(null)} sx={{ minHeight: 27, px: 0.75, display: "flex", alignItems: "center", gap: 0.75, borderRadius: 1, cursor: "pointer", bgcolor: nodeId == null ? "action.selected" : "transparent", "&:hover": { bgcolor: nodeId == null ? "action.selected" : "action.hover" } }}>
                <CategoryOutlinedIcon color="primary" sx={{ fontSize: 13.5 }} />
                <Typography sx={{ flex: 1, fontSize: 11.5, fontWeight: 800 }}>{tx("All Locations")}</Typography>
                <Box sx={{ mr: 0.5, display: "flex" }}><CountBadge value={allTools.length} /></Box>
              </Box>
              {(kids.root || []).map((node) => (
                <CategoryTreeNode key={node.id} node={node} kids={kids} nodes={nodes} selectedId={nodeId} collapsed={collapsed} onSelect={setNodeId}
                  onToggle={(id) => setCollapsed((old) => { const next = new Set(old); if (next.has(id)) next.delete(id); else next.add(id); return next; })} />
              ))}
            </Box>
          </Paper>

          {/* middle: tool list */}
          <Paper sx={{ ...panelSx, height: panelHeight, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <PanelHeader title={`${tx("Tool List")} (${tools.length})`} icon={<HandymanOutlinedIcon color="primary" fontSize="small" />} />
            <Box sx={{ p: 0.75, flex: 1, minHeight: 0 }}>
              <AgGridTable rowData={tools} columnDefs={columns} loading={loading} height="100%" rowSelection="single"
                getRowId={(p) => String(p.data.id)} onRowClicked={(event) => setSelectedId(event.data.id)} />
            </Box>
          </Paper>

          {/* right: tool detail */}
          <Paper sx={{ ...panelSx, height: panelHeight, display: "flex", flexDirection: "column" }}>
            <PanelHeader title={tx("Tool Detail")} icon={<VisibilityOutlinedIcon color="primary" fontSize="small" />} />
            {selected ? (
              <>
                <Box sx={{ p: 1.5, flexShrink: 0 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr) auto", columnGap: 1.25, alignItems: "center" }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", color: "#FFF", bgcolor: TYPE_COLORS[selected.tool_type] || "#005BAB" }}><HandymanOutlinedIcon sx={{ fontSize: 18 }} /></Box>
                    <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0.25 }}>
                      <Typography noWrap title={selected.tool_name} sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>{selected.tool_name}</Typography>
                      <Typography noWrap color="text.secondary" sx={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2 }}>{selected.tool_code}</Typography>
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
                          <Box component="img" src={resolveImageUrl(selected.image_url)} alt={selected.tool_name} sx={{ display: "block", width: "100%", height: 170, objectFit: "contain" }} />
                        </Box>
                      ) : null}
                      <DetailSection title={tx("General")}>
                        <DetailRow label={tx("Tool Type")}><TypePill value={selected.tool_type} /></DetailRow>
                        <DetailRow label={tx("Tool Category")}>{selected.tool_category || EMPTY}</DetailRow>
                        <DetailRow label={tx("Location")}>{selected.production_tool_node_id ? pathOf(nodes.find((n) => n.id === selected.production_tool_node_id), nodes) || selected.production_tool_node_name : tx("No location")}</DetailRow>
                        <DetailRow label={tx("Assigned Process")}>{selected.assigned_process || EMPTY}</DetailRow>
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
                    <Stack spacing={1.5}>
                      <DetailSection title={tx("Technical Specification")}>
                        <DetailRow label={tx("Measurement Range")}>{selected.measurement_range || EMPTY}</DetailRow>
                        <DetailRow label={tx("Resolution")}>{selected.measurement_resolution || EMPTY}</DetailRow>
                        <DetailRow label={tx("Calibration Required")}>{selected.calibration_required ? tx("Yes") : tx("No")}</DetailRow>
                        <DetailRow label={tx("Calibration Interval (days)")} last>{selected.calibration_required ? numText(selected.calibration_interval_days) : EMPTY}</DetailRow>
                      </DetailSection>
                      {activeFields.some((f) => customValue(f, selected.custom_fields?.[f.field_code]) != null) ? (
                        <DetailSection title={tx("Custom Fields")}>
                          {activeFields.filter((f) => customValue(f, selected.custom_fields?.[f.field_code]) != null).map((f, idx, arr) => (
                            <DetailRow key={f.field_code} label={f.field_name} last={idx === arr.length - 1}>{customValue(f, selected.custom_fields?.[f.field_code])}</DetailRow>
                          ))}
                        </DetailSection>
                      ) : null}
                    </Stack>
                  )}
                </Box>
                <Divider />
                <Stack direction="row" sx={{ p: 1.5, justifyContent: "center", gap: 1.5, flexShrink: 0 }}>
                  <ActionIcon title={tx("Edit tool")} icon={<EditOutlinedIcon fontSize="small" />} disabled={!canEdit || saving} onClick={() => setToolDialog(selected)} />
                  <ActionIcon title={isActive(selected) ? tx("Deactivate tool") : tx("Activate tool")}
                    icon={isActive(selected) ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
                    color={isActive(selected) ? "warning" : "success"} disabled={!canEdit || saving} onClick={toggleStatus} />
                  <ActionIcon title={tx("Delete tool")} icon={<DeleteOutlineIcon fontSize="small" />} color="error" disabled={!canEdit || saving} onClick={deleteTool} />
                </Stack>
              </>
            ) : (
              <Box sx={{ flex: 1, display: "grid", placeItems: "center", p: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>{tx("Select a tool to view details.")}</Typography>
              </Box>
            )}
          </Paper>
        </Box>

        <ToolDialog open={toolDialog !== null} tool={toolDialog?.id ? toolDialog : null} nodes={nodes} fieldDefinitions={fieldDefinitions}
          saving={saving} onClose={() => setToolDialog(null)} onSave={saveTool} />
        <CategoryTreeManager open={settings === "tree"} nodes={nodes} nodeTypes={nodeTypes} canEdit={canEdit} request={request} actor={actor}
          onClose={() => setSettings(null)} onReload={loadReference} />
        <ToolSettingsManager open={settings === "types"} kind="type" rows={nodeTypes} types={nodeTypes} canEdit={canEdit} request={request} actor={actor}
          onClose={() => setSettings(null)} onReload={loadReference} notify={notify} />
        <ToolSettingsManager open={settings === "fields"} kind="field" rows={fieldDefinitions} canEdit={canEdit} request={request} actor={actor}
          onClose={() => setSettings(null)} onReload={loadReference} notify={notify} />
        <Snackbar open={Boolean(message)} autoHideDuration={4500} onClose={() => setMessage(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          {message ? <Alert severity={message.severity} onClose={() => setMessage(null)}>{message.text}</Alert> : undefined}
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}
