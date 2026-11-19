import "./locales";
import { CountBadge, PanelHeader, masterGridSx, panelSx, SettingsMenu } from "../../../../components/masterData/MasterPanels";
import useFillHeight from "../../../../hooks/useFillHeight";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, Divider, FormControl, IconButton, InputAdornment,
  InputLabel, List, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Select, Snackbar,
  Stack, Tab, Tabs, TextField, ThemeProvider as MuiThemeProvider, Tooltip, Typography, createTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import SensorsOutlinedIcon from "@mui/icons-material/SensorsOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircle";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircle";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import UpdateOutlinedIcon from "@mui/icons-material/UpdateOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

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
import {
  categoryStatusText, codeTypeText, impactLevelText, moduleText,
  setActiveLanguage, statusText, tx,
} from "./locales";

const BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const API = `${BASE}/api/reason-code-master`;
const EMPTY = "—";
const STATUSES = ["ACTIVE", "INACTIVE"];
const CATEGORY_STATUSES = ["ACTIVE", "INACTIVE"];
const CODE_TYPES = ["SYSTEM", "MANUAL", "AUTO"];
const IMPACT_LEVELS = ["LOW", "MEDIUM", "HIGH"];
const MODULES = ["MACHINE_MONITORING", "DOWNTIME_MANAGEMENT", "NG_MANAGEMENT", "SCRAP_MANAGEMENT", "MAINTENANCE_MANAGEMENT", "PRODUCTION_EXECUTION"];
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

const STATUS_COLORS = { DRAFT: "#667085", PENDING_APPROVAL: "#DC6803", ACTIVE: "#12B76A", INACTIVE: "#F04438" };
function StatusChip({ value, width = 104 }) {
  const color = STATUS_COLORS[value] || "#667085";
  return (
    <Box component="span" title={statusText(value)} sx={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxSizing: "border-box",
      width, height: 22, px: 0.5, lineHeight: 1, verticalAlign: "middle", whiteSpace: "nowrap", overflow: "hidden",
      borderRadius: 1, fontSize: 10, fontWeight: 700, color, bgcolor: `${color}1A`, border: `1px solid ${color}40`,
    }}>{statusText(value)}</Box>
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
      <Typography variant="caption" sx={{ fontWeight: 700, textAlign: "right", minWidth: 0, wordBreak: "break-word" }}>{children}</Typography>
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

const person = (name, code) => (name ? `${name} - ${code}` : code || EMPTY);
const localeTag = () => { const tag = tx("LOCALE_TAG"); return tag === "LOCALE_TAG" ? "en-GB" : tag; };
const dateText = (value) => {
  if (!value) return EMPTY;
  const d = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString(localeTag(), { day: "2-digit", month: "2-digit", year: "numeric" });
};
const timeDateText = (value) => {
  if (!value) return EMPTY;
  const d = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return String(value);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} ${tx("on")} ${dateText(value)}`;
};
const AUDIT_LABELS = { CREATE: "Created by", UPDATE: "Updated by", SUBMIT: "Submitted by", APPROVE: "Approved by", REJECT: "Rejected by", ACTIVATE: "Activated by", DEACTIVATE: "Deactivated by", DELETE: "Deleted by" };

function FieldLabel({ children }) {
  return <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "text.secondary", fontSize: "0.68rem" }}>{children}</Typography>;
}

function ReasonCodeForm({ item, categories, actor, saving, onClose, onSave }) {
  const [f, setF] = useState(item ? {
    code: item.reason_code, name: item.reason_name, categoryId: item.category_id, codeType: item.code_type,
    module: item.applicable_module, description: item.description || "", impactLevel: item.impact_level,
    sortOrder: item.sort_order, version: item.version,
  } : {
    code: "", name: "", categoryId: categories[0]?.id ?? "", codeType: "MANUAL", module: MODULES[0],
    description: "", impactLevel: "MEDIUM", sortOrder: 0, version: 1,
  });
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const submit = () => onSave({
    reason_code: f.code.trim().toUpperCase(), reason_name: f.name.trim(), category_id: Number(f.categoryId),
    code_type: f.codeType, applicable_module: f.module, description: f.description.trim() || null,
    impact_level: f.impactLevel, sort_order: Number(f.sortOrder || 0),
    ...(item ? { version: Number(f.version), updated_by: actor } : { created_by: actor }),
  });
  return (
    <Dialog open fullWidth maxWidth="md" onClose={saving ? undefined : onClose} slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogHeader icon={<LabelOutlinedIcon />} title={tx(item ? "Edit Reason Code" : "Add New Reason Code Dialog")} subtitle={tx("Reason codes are master data and are active as soon as they are saved.")} disabled={saving} onClose={onClose} />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Stack spacing={2.25} sx={{ pt: 1 }}>
          <Stack spacing={1.25}>
            <FieldLabel>{tx("Basic information")}</FieldLabel>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 2fr" }, gap: 1.5 }}>
              <TextField fullWidth required size="small" disabled={Boolean(item)} label={tx("Reason Code")} placeholder="VD: DT-009" value={f.code} onChange={ch("code")} />
              <TextField fullWidth required size="small" label={tx("Reason Name")} value={f.name} onChange={ch("name")} />
            </Box>
          </Stack>
          <Stack spacing={1.25}>
            <FieldLabel>{tx("Classification")}</FieldLabel>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0,1fr))" }, gap: 1.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{tx("Category")}</InputLabel>
                <Select label={tx("Category")} value={f.categoryId} onChange={ch("categoryId")}>
                  {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.category_name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>{tx("Code Type")}</InputLabel>
                <Select label={tx("Code Type")} value={f.codeType} onChange={ch("codeType")}>
                  {CODE_TYPES.map((t) => <MenuItem key={t} value={t}>{codeTypeText(t)}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField fullWidth size="small" type="number" label={tx("Sort Order")} value={f.sortOrder} onChange={ch("sortOrder")} />
              <FormControl fullWidth size="small" sx={{ gridColumn: { sm: "span 2" } }}>
                <InputLabel>{tx("Applicable Module")}</InputLabel>
                <Select label={tx("Applicable Module")} value={f.module} onChange={ch("module")}>
                  {MODULES.map((m) => <MenuItem key={m} value={m}>{moduleText(m)}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>{tx("Impact Level")}</InputLabel>
                <Select label={tx("Impact Level")} value={f.impactLevel} onChange={ch("impactLevel")}>
                  {IMPACT_LEVELS.map((l) => <MenuItem key={l} value={l}>{impactLevelText(l)}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          </Stack>
          <TextField fullWidth multiline minRows={3} label={tx("Description")} value={f.description} onChange={ch("description")} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.25, borderTop: 1, borderColor: "divider", bgcolor: (t) => (t.palette.mode === "dark" ? "#0F172A" : "#F8FAFC") }}>
        <Button onClick={submit} disabled={saving || !f.code.trim() || !f.name.trim() || !f.categoryId} sx={btn("primary")} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
          {tx("Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CopyReasonCodeDialog({ saving, onClose, onConfirm }) {
  const [code, setCode] = useState("");
  return (
    <Dialog open fullWidth maxWidth="xs" onClose={saving ? undefined : onClose} slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogHeader icon={<ContentCopyOutlinedIcon />} title={tx("Copy Reason Code")} disabled={saving} onClose={onClose} />
      <DialogContent>
        <TextField fullWidth required size="small" sx={{ mt: 1 }} label={tx("New Reason Code")} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.25 }}>
        <Button onClick={() => onConfirm(code)} disabled={saving || !code.trim()} sx={btn("primary")}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}


function CategoryForm({ item, actor, saving, onClose, onSave }) {
  const [f, setF] = useState(item ? {
    code: item.category_code, name: item.category_name, description: item.description || "",
    sortOrder: item.sort_order, status: item.status, version: item.version,
  } : { code: "", name: "", description: "", sortOrder: 0, status: "ACTIVE", version: 1 });
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const submit = () => onSave({
    category_code: f.code.trim().toUpperCase(), category_name: f.name.trim(), description: f.description.trim() || null,
    sort_order: Number(f.sortOrder || 0), status: f.status,
    ...(item ? { version: Number(f.version), updated_by: actor } : { created_by: actor }),
  });
  return (
    <Dialog open fullWidth maxWidth="xs" onClose={saving ? undefined : onClose} slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogHeader icon={<CategoryOutlinedIcon />} title={tx(item ? "Edit Category" : "Add Category")} disabled={saving} onClose={onClose} />
      <DialogContent>
        <Stack spacing={1.7} sx={{ pt: 1 }}>
          <TextField fullWidth required size="small" disabled={Boolean(item)} label={tx("Category Code")} value={f.code} onChange={ch("code")} />
          <TextField fullWidth required size="small" label={tx("Category Name")} value={f.name} onChange={ch("name")} />
          <TextField fullWidth size="small" type="number" label={tx("Sort Order")} value={f.sortOrder} onChange={ch("sortOrder")} />
          <FormControl fullWidth size="small">
            <InputLabel>{tx("Status")}</InputLabel>
            <Select label={tx("Status")} value={f.status} onChange={ch("status")}>
              {CATEGORY_STATUSES.map((s) => <MenuItem key={s} value={s}>{categoryStatusText(s)}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth multiline minRows={2} label={tx("Description")} value={f.description} onChange={ch("description")} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.25 }}>
        <Button onClick={submit} disabled={saving || !f.code.trim() || !f.name.trim()} sx={btn("primary")}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

function CategoryManagerDialog({ categories, actor, canEdit, onClose, onCreate, onUpdate, onToggleStatus, onDelete }) {
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const columns = useMemo(() => [
    { headerName: tx("Category Code"), field: "category_code", width: 150, pinned: "left" },
    { headerName: tx("Category Name"), field: "category_name", minWidth: 180, flex: 1.4 },
    { headerName: tx("Description"), field: "description", minWidth: 160, flex: 1.2, valueFormatter: (p) => p.value || EMPTY },
    { headerName: tx("Reason Code Count"), field: "reason_code_count", minWidth: 110, flex: 0.6, cellStyle: { justifyContent: "center" } },
    { headerName: tx("Sort Order"), field: "sort_order", minWidth: 80, flex: 0.5, cellStyle: { justifyContent: "center" } },
    { headerName: tx("Status"), field: "status", minWidth: 110, flex: 0.7, cellRenderer: (p) => <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}><StatusChip value={p.value} width={92} /></Box> },
    { headerName: tx("Actions"), width: 120, sortable: false, filter: false, cellRenderer: (p) => (
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "center", height: "100%" }}>
        <Tooltip title={tx("Edit")}><span><IconButton size="small" disabled={!canEdit} onClick={() => { setEditItem(p.data); setShowForm(true); }}><EditOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
        <Tooltip title={tx(p.data.status === "ACTIVE" ? "Deactivate" : "Activate")}><span>
          <IconButton size="small" color={p.data.status === "ACTIVE" ? "warning" : "success"} disabled={!canEdit} onClick={() => onToggleStatus(p.data)}>
            {p.data.status === "ACTIVE" ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
          </IconButton>
        </span></Tooltip>
        <Tooltip title={p.data.reason_code_count > 0 ? tx("Category in use cannot be deleted") : tx("Delete")}><span>
          <IconButton size="small" color="error" disabled={!canEdit || p.data.reason_code_count > 0} onClick={() => onDelete(p.data)}><DeleteOutlineIcon fontSize="small" /></IconButton>
        </span></Tooltip>
      </Stack>
    ) },
  ], [canEdit, onDelete, onToggleStatus]);
  return (
    <Dialog open fullWidth maxWidth="lg" onClose={onClose} slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogHeader icon={<CategoryOutlinedIcon />} title={tx("Manage Categories")} subtitle={tx("Groups used to organise reason codes (e.g. Downtime, NG, Scrap).")} onClose={onClose} />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Box sx={{ height: 420, mt: 1 }}>
          <AgGridTable rowData={categories} columnDefs={columns} height="100%" getRowId={(p) => String(p.data.id)} />
        </Box>
        <Stack direction="row" sx={{ mt: 1.5 }}>
          <Button variant="contained" disabled={!canEdit} startIcon={<AddIcon />} onClick={() => { setEditItem(null); setShowForm(true); }} sx={btn("primary", { whiteSpace: "nowrap" })}>{tx("Add Category")}</Button>
        </Stack>
      </DialogContent>
      {showForm && (
        <CategoryForm item={editItem} actor={actor} saving={false} onClose={() => setShowForm(false)}
          onSave={async (payload) => { if (editItem) { await onUpdate(editItem.id, payload); } else { await onCreate(payload); } setShowForm(false); }} />
      )}
    </Dialog>
  );
}

export default function ReasonCodeMaster() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  const { theme } = useAppTheme();
  const muiTheme = useMemo(() => pageTheme(theme), [theme]);
  const { canEdit } = usePagePermission();
  const [panelsRef, panelHeight] = useFillHeight();
  const actor = getCurrentUser()?.employee_code || "SYSTEM";

  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ total_codes: 0, active_codes: 0, category_count: 0, usage_percent: 0, recently_added: 0 });
  const [categories, setCategories] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [codeTypeFilter, setCodeTypeFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tab, setTab] = useState(0);
  const [dialog, setDialog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ open: false, type: "success", text: "" });
  const [auditLog, setAuditLog] = useState([]);

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statData, listData, categoryData] = await Promise.all([
        request(`${API}/statistics`),
        request(`${API}/reason-codes?page=1&page_size=500`),
        request(`${API}/categories`),
      ]);
      const list = listData?.items || [];
      setStats(statData); setRows(list); setCategories(categoryData || []);
      setSelectedId((old) => (list.some((x) => x.id === old) ? old : list[0]?.id ?? null));
    } catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [notify, request]);
  useEffect(() => { load(); }, [load]);

  const loadDetail = useCallback(async (id) => {
    if (!id) { setDetail(null); return; }
    try { setDetail(await request(`${API}/reason-codes/${id}`)); } catch (e) { notify("error", e.message); }
  }, [request, notify]);
  useEffect(() => { loadDetail(selectedId); setTab(0); }, [selectedId, loadDetail]);

  useEffect(() => {
    if (!selectedId || tab !== 1) return;
    request(`${API}/reason-codes/${selectedId}/audit-log`).then(setAuditLog).catch((e) => notify("error", e.message));
  }, [selectedId, tab, request, notify]);

  const filtered = useMemo(() => {
    const q = keyword.toLowerCase().trim();
    return rows.filter((r) => {
      if (q && !`${r.reason_code} ${r.reason_name}`.toLowerCase().includes(q)) return false;
      if (categoryFilter !== "all" && Number(r.category_id) !== Number(categoryFilter)) return false;
      if (codeTypeFilter !== "all" && r.code_type !== codeTypeFilter) return false;
      if (moduleFilter !== "all" && r.applicable_module !== moduleFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, keyword, categoryFilter, codeTypeFilter, moduleFilter, statusFilter]);

  const reloadAll = useCallback(async () => { await load(); await loadDetail(selectedId); }, [load, loadDetail, selectedId]);

  const saveReasonCode = async (payload) => {
    setSaving(true);
    try {
      const item = dialog?.item;
      const result = await request(item ? `${API}/reason-codes/${item.id}` : `${API}/reason-codes`, { method: item ? "PUT" : "POST", body: JSON.stringify(payload) });
      setDialog(null); await reloadAll(); if (result.id) setSelectedId(result.id);
      notify("success", tx("Reason code saved."));
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const toggleStatus = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const next = detail.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await request(`${API}/reason-codes/${detail.id}/status`, { method: "PATCH", body: JSON.stringify({ status: next, version: detail.version, updated_by: actor }) });
      await reloadAll(); notify("success", tx("Status updated."));
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const copyCode = async (newCode) => {
    setSaving(true);
    try {
      const result = await request(`${API}/reason-codes/${detail.id}/copy`, { method: "POST", body: JSON.stringify({ new_reason_code: newCode, created_by: actor }) });
      setDialog(null); await load(); setSelectedId(result.id); notify("success", tx("Reason code copied."));
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const deleteCode = async () => {
    if (!detail || !window.confirm(tx("Are you sure you want to delete this item?"))) return;
    setSaving(true);
    try { await request(`${API}/reason-codes/${detail.id}`, { method: "DELETE" }); setSelectedId(null); await load(); notify("success", "Deleted."); }
    catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };

  const createCategory = async (payload) => {
    try { await request(`${API}/categories`, { method: "POST", body: JSON.stringify(payload) }); await load(); notify("success", tx("Category saved.")); }
    catch (e) { notify("error", e.message); }
  };
  const updateCategory = async (id, payload) => {
    try { await request(`${API}/categories/${id}`, { method: "PUT", body: JSON.stringify(payload) }); await load(); notify("success", tx("Category saved.")); }
    catch (e) { notify("error", e.message); }
  };
  const toggleCategoryStatus = async (category) => {
    try {
      const next = category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await request(`${API}/categories/${category.id}/status`, { method: "PATCH", body: JSON.stringify({ status: next, version: category.version, updated_by: actor }) });
      await load(); notify("success", tx("Status updated."));
    } catch (e) { notify("error", e.message); }
  };
  const deleteCategory = async (category) => {
    if (!window.confirm(tx("Are you sure you want to delete this item?"))) return;
    try { await request(`${API}/categories/${category.id}`, { method: "DELETE" }); await load(); notify("success", "Deleted."); }
    catch (e) { notify("error", e.message); }
  };

  const percent = (n) => (stats.total_codes ? `${((n / stats.total_codes) * 100).toFixed(1)}% ${tx("of total")}` : `0% ${tx("of total")}`);

  const cols = useMemo(() => [
    { headerName: tx("Reason Code"), field: "reason_code", width: 120, pinned: "left" },
    { headerName: tx("Reason Name"), field: "reason_name", minWidth: 170, flex: 1.6 },
    { headerName: tx("Category"), field: "category_name", minWidth: 120, flex: 1, valueFormatter: (p) => p.value || EMPTY },
    { headerName: tx("Code Type"), field: "code_type", minWidth: 100, flex: 0.7, valueFormatter: (p) => codeTypeText(p.value) },
    { headerName: tx("Applicable Module"), field: "applicable_module", minWidth: 150, flex: 1.2, valueFormatter: (p) => moduleText(p.value) },
    { headerName: tx("Status"), field: "status", minWidth: 125, flex: 0.9, cellRenderer: (p) => <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}><StatusChip value={p.value} /></Box> },
    { headerName: tx("Sort Order"), field: "sort_order", minWidth: 80, flex: 0.5 },
  ], [language]);

  const kpis = [
    { label: tx("Total Reason Codes"), value: stats.total_codes, note: `+${stats.recently_added || 0} ${tx("last 30 days")}`, icon: LabelOutlinedIcon, tone: "primary" },
    { label: tx("Active Codes"), value: stats.active_codes, note: percent(stats.active_codes), icon: CheckCircleOutlineIcon, tone: "success" },
    { label: tx("High Impact"), value: stats.high_impact_codes || 0, note: percent(stats.high_impact_codes || 0), icon: WarningAmberOutlinedIcon, tone: "warning" },
    { label: tx("Automatic Codes"), value: stats.auto_codes || 0, note: tx("recorded from machines"), icon: SensorsOutlinedIcon, tone: "info" },
    { label: tx("Categories"), value: stats.category_count, note: tx("active categories"), icon: CategoryOutlinedIcon, tone: "accent" },
    { label: tx("Inactive Codes"), value: stats.inactive_codes || 0, note: percent(stats.inactive_codes || 0), icon: BlockOutlinedIcon, tone: "danger" },
  ];

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box>
        <PageMeta title={`${tx("Reason Code Master")} | VCC Plastics`} description={tx("Manage all reason codes used across the system (Downtime, NG, Scrap, Maintenance, Setup, etc.)")} />
        <PageBreadcrumb pageTitle={tx("Reason Code Master")} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr auto" }, gap: 1.5, alignItems: "center", mb: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{tx("Reason Code Master")}</Typography>
            <Typography variant="body2" color="text.secondary">{tx("Manage all reason codes used across the system (Downtime, NG, Scrap, Maintenance, Setup, etc.)")}</Typography>
          </Box>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2, justifyContent: "flex-end" }}>
            <SettingsMenu items={[{ key: "categories", label: tx("Manage Categories"), onClick: () => setDialog({ type: "manageCategories" }) }]} />
            <Button disabled={!canEdit} startIcon={<AddIcon />} onClick={() => setDialog({ type: "reasonCode" })} sx={btn("primary")}>{tx("Add New Reason Code")}</Button>
          </Stack>
        </Box>

        <KpiCardGroup>
          {kpis.map((k) => { const Icon = k.icon; return <KpiCard key={k.label} label={k.label} value={k.value} note={k.note} icon={<Icon />} tone={k.tone} />; })}
        </KpiCardGroup>

        <Paper variant="outlined" sx={{ my: 1.5, p: 1.5, borderRadius: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(240px,1.6fr) repeat(4,minmax(140px,1fr)) auto" }, gap: 1 }}>
            <TextField size="small" placeholder={tx("Search by reason code or name...")} value={keyword} onChange={(e) => setKeyword(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
            <FormControl size="small">
              <InputLabel>{tx("Category")}</InputLabel>
              <Select label={tx("Category")} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <MenuItem value="all">{tx("All Categories")}</MenuItem>
                {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.category_name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>{tx("Code Type")}</InputLabel>
              <Select label={tx("Code Type")} value={codeTypeFilter} onChange={(e) => setCodeTypeFilter(e.target.value)}>
                <MenuItem value="all">{tx("All Code Types")}</MenuItem>
                {CODE_TYPES.map((t) => <MenuItem key={t} value={t}>{codeTypeText(t)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>{tx("Applicable Module")}</InputLabel>
              <Select label={tx("Applicable Module")} value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
                <MenuItem value="all">{tx("All Modules")}</MenuItem>
                {MODULES.map((m) => <MenuItem key={m} value={m}>{moduleText(m)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>{tx("Status")}</InputLabel>
              <Select label={tx("Status")} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">{tx("All Status")}</MenuItem>
                {STATUSES.map((st) => <MenuItem key={st} value={st}>{statusText(st)}</MenuItem>)}
              </Select>
            </FormControl>
            <Button startIcon={<FilterListIcon />} onClick={() => { setKeyword(""); setCategoryFilter("all"); setCodeTypeFilter("all"); setModuleFilter("all"); setStatusFilter("all"); }}
              sx={btn("cancel", { minHeight: 29, whiteSpace: "nowrap" })}>{tx("Clear")}</Button>
          </Box>
        </Paper>

        <Box ref={panelsRef} sx={masterGridSx}>
          <Paper elevation={0} sx={{ ...cardSx, height: panelHeight, display: "flex", flexDirection: "column" }}>
            <Head icon={<CategoryOutlinedIcon color="primary" fontSize="small" />} title={tx("Reason Categories")} />
            <List disablePadding sx={{ flex: 1, overflow: "auto", p: 0.75 }}>
              {[{ id: "all", category_name: tx("All Categories"), reason_code_count: rows.length }, ...categories].map((c) => {
                const selected = c.id === "all" ? categoryFilter === "all" : Number(categoryFilter) === Number(c.id);
                return (
                  <ListItemButton key={c.id} selected={selected} onClick={() => setCategoryFilter(c.id)} sx={{ borderRadius: 1, py: 0.75, mb: 0.25 }}>
                    <ListItemText primary={c.category_name} slotProps={{ primary: { noWrap: true, sx: { fontSize: 11.5, fontWeight: selected ? 800 : 600 } } }} />
                    <CountBadge value={c.reason_code_count ?? 0} />
                  </ListItemButton>
                );
              })}
            </List>
          </Paper>

          <Paper elevation={0} sx={{ ...cardSx, height: panelHeight, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Head icon={<LabelOutlinedIcon color="primary" fontSize="small" />} title={`${tx("Reason Code List")} (${filtered.length})`} />
            <Box sx={{ p: 0.75, flex: 1, minHeight: 0 }}>
              <AgGridTable rowData={filtered} columnDefs={cols} loading={loading} pagination paginationPageSize={20} onRowClicked={(e) => setSelectedId(e.data.id)} getRowId={(p) => String(p.data.id)} height="100%" />
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ ...cardSx, height: panelHeight, display: "flex", flexDirection: "column" }}>
            <Head icon={<VisibilityOutlinedIcon color="primary" fontSize="small" />} title={tx("Reason Code Detail")} />
            {detail ? (
              <>
                <Box sx={{ p: 1.5, flexShrink: 0 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr) auto", columnGap: 1.25, alignItems: "center" }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", color: "#FFF", bgcolor: STATUS_COLORS[detail.status] || "#005BAB" }}>
                      <LabelOutlinedIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 0.25 }}>
                      <Typography noWrap title={detail.reason_name} sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>{detail.reason_name}</Typography>
                      <Typography noWrap color="text.secondary" sx={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2 }}>{detail.reason_code}</Typography>
                    </Box>
                    <StatusChip value={detail.status} />
                  </Box>
                </Box>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ minHeight: 27, borderTop: 1, borderBottom: 1, borderColor: "divider", "& .MuiTab-root": { minHeight: 27, py: 0, fontSize: 11, fontWeight: 700, textTransform: "none" } }}>
                  <Tab label={tx("Information")} /><Tab label={tx("History")} />
                </Tabs>
                <Box sx={{ p: 1.5, flex: 1, minHeight: 0, overflow: "auto" }}>
                  {tab === 0 && (
                    <Stack spacing={1.5}>
                      <DetailSection title={tx("General")}>
                        <DetailRow label={tx("Category")}>{detail.category_name || EMPTY}</DetailRow>
                        <DetailRow label={tx("Code Type")}>{codeTypeText(detail.code_type)}</DetailRow>
                        <DetailRow label={tx("Applicable Module")}>{moduleText(detail.applicable_module)}</DetailRow>
                        <DetailRow label={tx("Impact Level")}>{impactLevelText(detail.impact_level)}</DetailRow>
                        <DetailRow label={tx("Sort Order")}>{detail.sort_order ?? EMPTY}</DetailRow>
                        <DetailRow label={tx("Description")} last>{detail.description || EMPTY}</DetailRow>
                      </DetailSection>
                      <DetailSection title={tx("Record")}>
                        <DetailRow label={tx("Created by")}>{person(detail.created_by_name, detail.created_by_code)}</DetailRow>
                        <DetailRow label={tx("Created at")}>{timeDateText(detail.created_at)}</DetailRow>
                        <DetailRow label={tx("Updated by")}>{detail.updated_by ? person(detail.updated_by_name, detail.updated_by_code) : EMPTY}</DetailRow>
                        <DetailRow label={tx("Updated at")} last>{timeDateText(detail.updated_at)}</DetailRow>
                      </DetailSection>
                    </Stack>
                  )}
                  {tab === 1 && (
                    <Stack spacing={1}>
                      {auditLog.length ? auditLog.map((a) => (
                        <Box key={a.id} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, px: 1.25, py: 0.9 }}>
                          <Typography variant="caption" sx={{ display: "block" }}>
                            <b>{tx(AUDIT_LABELS[a.action] || a.action)}:</b> {person(a.actor_name, a.actor_code || a.actor)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            {timeDateText(a.acted_at)}{a.remark ? ` · ${a.remark}` : ""}
                          </Typography>
                        </Box>
                      )) : <Typography variant="caption" color="text.secondary">{EMPTY}</Typography>}
                    </Stack>
                  )}
                </Box>
                <Divider />
                <Stack direction="row" sx={{ flexWrap: "wrap", justifyContent: "center", gap: 1.2, p: 1.5 }}>
                  <ActionIcon title={tx("Edit")} icon={<EditOutlinedIcon fontSize="small" />} disabled={!canEdit} onClick={() => setDialog({ type: "reasonCode", item: detail })} />
                  <ActionIcon title={tx(detail.status === "ACTIVE" ? "Deactivate" : "Activate")} color={detail.status === "ACTIVE" ? "warning" : "success"}
                    icon={detail.status === "ACTIVE" ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />} disabled={!canEdit || saving} onClick={toggleStatus} />
                  <Tooltip title={tx("Copy")}><span><IconButton disabled={!canEdit} onClick={() => setDialog({ type: "copyReasonCode" })} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><ContentCopyOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
                  <Tooltip title={tx("Delete")}><span><IconButton disabled={!canEdit || saving} color="error" onClick={deleteCode} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><DeleteOutlineIcon fontSize="small" /></IconButton></span></Tooltip>
                </Stack>
              </>
            ) : (
              <Box sx={{ flex: 1, display: "grid", placeItems: "center", p: 2 }}><Typography color="text.secondary">{tx("Select a reason code to view details.")}</Typography></Box>
            )}
          </Paper>
        </Box>

        {dialog?.type === "reasonCode" && (
          <ReasonCodeForm item={dialog.item} categories={categories} actor={actor} saving={saving} onClose={() => setDialog(null)} onSave={saveReasonCode} />
        )}
        {dialog?.type === "copyReasonCode" && (
          <CopyReasonCodeDialog saving={saving} onClose={() => setDialog(null)} onConfirm={copyCode} />
        )}
        {dialog?.type === "manageCategories" && (
          <CategoryManagerDialog categories={categories} actor={actor} canEdit={canEdit} onClose={() => setDialog(null)}
            onCreate={createCategory} onUpdate={updateCategory} onToggleStatus={toggleCategoryStatus} onDelete={deleteCategory} />
        )}

        <Snackbar open={msg.open} autoHideDuration={4500} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}

// ---------------- //

// ---------------- //

// Helper functions // 

// ---------------- //

// ---------------- //

// ---------------- //