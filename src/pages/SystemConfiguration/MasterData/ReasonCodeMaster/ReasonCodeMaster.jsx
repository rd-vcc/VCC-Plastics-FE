import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, Divider, FormControl, IconButton, InputAdornment,
  InputLabel, List, ListItemButton, ListItemText, MenuItem, Paper, Select, Snackbar,
  Stack, Tab, Tabs, TextField, ThemeProvider as MuiThemeProvider, Tooltip, Typography, createTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
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
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
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
const STATUSES = ["DRAFT", "PENDING_APPROVAL", "ACTIVE", "INACTIVE"];
const CATEGORY_STATUSES = ["ACTIVE", "INACTIVE"];
const CODE_TYPES = ["SYSTEM", "MANUAL", "AUTO"];
const IMPACT_LEVELS = ["LOW", "MEDIUM", "HIGH"];
const MODULES = ["MACHINE_MONITORING", "DOWNTIME_MANAGEMENT", "NG_MANAGEMENT", "SCRAP_MANAGEMENT", "MAINTENANCE_MANAGEMENT", "PRODUCTION_EXECUTION"];
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

const STATUS_TONES = { DRAFT: "default", PENDING_APPROVAL: "warning", ACTIVE: "success", INACTIVE: "default" };
function StatusChip({ value }) {
  return <Chip size="small" variant="outlined" color={STATUS_TONES[value] || "default"} label={statusText(value)} sx={{ height: 21, fontSize: 10, fontWeight: 800 }} />;
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
    <Dialog open fullWidth maxWidth="sm" onClose={saving ? undefined : onClose} PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<LabelOutlinedIcon />} title={tx(item ? "Edit Reason Code" : "Add New Reason Code Dialog")} disabled={saving} onClose={onClose} />
      <DialogContent>
        <Stack spacing={1.7} sx={{ pt: 1 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField fullWidth required size="small" disabled={Boolean(item)} label={tx("Reason Code")} value={f.code} onChange={ch("code")} />
            <TextField fullWidth required size="small" label={tx("Reason Name")} value={f.name} onChange={ch("name")} />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
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
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <FormControl fullWidth size="small">
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
          </Stack>
          <TextField fullWidth size="small" type="number" label={tx("Sort Order")} value={f.sortOrder} onChange={ch("sortOrder")} sx={{ maxWidth: 160 }} />
          <TextField fullWidth multiline minRows={2} label={tx("Description")} value={f.description} onChange={ch("description")} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Cancel")}</Button>
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
    <Dialog open fullWidth maxWidth="xs" onClose={saving ? undefined : onClose} PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<ContentCopyOutlinedIcon />} title={tx("Copy Reason Code")} disabled={saving} onClose={onClose} />
      <DialogContent>
        <TextField fullWidth required size="small" sx={{ mt: 1 }} label={tx("New Reason Code")} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Cancel")}</Button>
        <Button onClick={() => onConfirm(code)} disabled={saving || !code.trim()} sx={btn("primary")}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

function RejectDialog({ saving, onClose, onConfirm }) {
  const [remark, setRemark] = useState("");
  return (
    <Dialog open fullWidth maxWidth="xs" onClose={saving ? undefined : onClose} PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<ThumbDownOutlinedIcon />} title={tx("Reject Reason Code")} disabled={saving} onClose={onClose} tone="danger" />
      <DialogContent>
        <TextField fullWidth required multiline minRows={2} size="small" sx={{ mt: 1 }} label={tx("Remark")} value={remark} onChange={(e) => setRemark(e.target.value)} helperText={!remark.trim() ? tx("Reject Remark Required") : " "} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Cancel")}</Button>
        <Button onClick={() => onConfirm(remark)} disabled={saving || !remark.trim()} sx={btn("delete")}>{tx("Reject")}</Button>
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
    <Dialog open fullWidth maxWidth="xs" onClose={saving ? undefined : onClose} PaperProps={{ sx: dialogPaperSx }}>
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
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Cancel")}</Button>
        <Button onClick={submit} disabled={saving || !f.code.trim() || !f.name.trim()} sx={btn("primary")}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

function CategoryManagerDialog({ categories, actor, canEdit, onClose, onCreate, onUpdate, onToggleStatus, onDelete }) {
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  return (
    <Dialog open fullWidth maxWidth="sm" onClose={onClose} PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<SettingsOutlinedIcon />} title={tx("Manage Categories")} onClose={onClose} />
      <DialogContent sx={{ p: 0 }}>
        <List disablePadding>
          {categories.map((c) => (
            <Box key={c.id} sx={{ display: "flex", alignItems: "center", px: 2, py: 1, borderBottom: 1, borderColor: "divider" }}>
              <ListItemText primary={`${c.category_code} — ${c.category_name}`} secondary={`${tx("Reason Code Count")}: ${c.reason_code_count}`} />
              <Chip size="small" label={categoryStatusText(c.status)} color={c.status === "ACTIVE" ? "success" : "default"} sx={{ mr: 1 }} />
              <IconButton size="small" disabled={!canEdit} onClick={() => { setEditItem(c); setShowForm(true); }}><EditOutlinedIcon fontSize="small" /></IconButton>
              <IconButton size="small" disabled={!canEdit} onClick={() => onToggleStatus(c)}>{c.status === "ACTIVE" ? <PauseCircleOutlineIcon fontSize="small" /> : <PlayCircleOutlineIcon fontSize="small" />}</IconButton>
              <IconButton size="small" color="error" disabled={!canEdit || c.reason_code_count > 0} onClick={() => onDelete(c)}><DeleteOutlineIcon fontSize="small" /></IconButton>
            </Box>
          ))}
        </List>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button disabled={!canEdit} startIcon={<AddIcon />} onClick={() => { setEditItem(null); setShowForm(true); }} sx={btn("primary")}>{tx("Add Category")}</Button>
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Close")}</Button>
      </DialogActions>
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
    if (!selectedId || tab !== 2) return;
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
  const submitForApproval = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      await request(`${API}/reason-codes/${detail.id}/submit`, { method: "POST", body: JSON.stringify({ actor, version: detail.version }) });
      await reloadAll(); notify("success", tx("Submitted for approval."));
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const approve = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      await request(`${API}/reason-codes/${detail.id}/approve`, { method: "POST", body: JSON.stringify({ actor, version: detail.version }) });
      await reloadAll(); notify("success", tx("Approved."));
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const reject = async (remark) => {
    setSaving(true);
    try {
      await request(`${API}/reason-codes/${detail.id}/reject`, { method: "POST", body: JSON.stringify({ actor, remark, version: detail.version }) });
      setDialog(null); await reloadAll(); notify("success", tx("Rejected."));
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
    { headerName: tx("Reason Code"), field: "reason_code", width: 110, pinned: "left" },
    { headerName: tx("Reason Name"), field: "reason_name", minWidth: 170, flex: 1.1 },
    { headerName: tx("Category"), field: "category_name", width: 130, valueFormatter: (p) => p.value || EMPTY },
    { headerName: tx("Code Type"), field: "code_type", width: 100, valueFormatter: (p) => codeTypeText(p.value) },
    { headerName: tx("Applicable Module"), field: "applicable_module", minWidth: 160, valueFormatter: (p) => moduleText(p.value) },
    { headerName: tx("Status"), field: "status", width: 130, cellRenderer: (p) => <Box height="100%" display="flex" alignItems="center"><StatusChip value={p.value} /></Box> },
    { headerName: tx("Sort Order"), field: "sort_order", width: 90 },
    { headerName: tx("Actions"), width: 90, sortable: false, filter: false, cellRenderer: (p) => (
      <Stack direction="row" alignItems="center" height="100%">
        <IconButton size="small" onClick={() => setSelectedId(p.data.id)}><VisibilityOutlinedIcon fontSize="small" /></IconButton>
      </Stack>
    ) },
  ], [language]);

  const kpis = [
    { label: tx("Total Reason Codes"), value: stats.total_codes, note: "", icon: LabelOutlinedIcon, tone: "primary" },
    { label: tx("Active Codes"), value: stats.active_codes, note: percent(stats.active_codes), icon: CheckCircleOutlineIcon, tone: "success" },
    { label: tx("Categories"), value: stats.category_count, note: "", icon: CategoryOutlinedIcon, tone: "info" },
    { label: tx("System Usage"), value: `${stats.usage_percent}%`, note: "", icon: UpdateOutlinedIcon, tone: "warning" },
    { label: tx("Recently Added"), value: stats.recently_added, note: tx("last 30 days"), icon: AddIcon, tone: "danger" },
  ];

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box>
        <PageMeta title={`${tx("Reason Code Master")} | VCC Plastics`} description={tx("Manage all reason codes used across the system (Downtime, NG, Scrap, Maintenance, Setup, etc.)")} />
        <PageBreadcrumb pageTitle={tx("Reason Code Master")} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr auto" }, gap: 1.5, alignItems: "center", mb: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800}>{tx("Reason Code Master")}</Typography>
            <Typography variant="body2" color="text.secondary">{tx("Manage all reason codes used across the system (Downtime, NG, Scrap, Maintenance, Setup, etc.)")}</Typography>
          </Box>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2, justifyContent: "flex-end" }}>
            <Button disabled={!canEdit} startIcon={<AddIcon />} onClick={() => setDialog({ type: "reasonCode" })} sx={btn("primary")}>{tx("Add New Reason Code")}</Button>
          </Stack>
        </Box>

        <KpiCardGroup>
          {kpis.map((k) => { const Icon = k.icon; return <KpiCard key={k.label} label={k.label} value={k.value} note={k.note} icon={<Icon />} tone={k.tone} />; })}
        </KpiCardGroup>

        <Paper elevation={0} sx={{ ...cardSx, my: 1.5, p: 1 }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={1} flexWrap="wrap">
            <TextField size="small" placeholder={tx("Search by reason code or name...")} value={keyword} onChange={(e) => setKeyword(e.target.value)} sx={{ minWidth: 230 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{tx("Category")}</InputLabel>
              <Select label={tx("Category")} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <MenuItem value="all">{tx("All Categories")}</MenuItem>
                {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.category_name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>{tx("Code Type")}</InputLabel>
              <Select label={tx("Code Type")} value={codeTypeFilter} onChange={(e) => setCodeTypeFilter(e.target.value)}>
                <MenuItem value="all">{tx("All Code Types")}</MenuItem>
                {CODE_TYPES.map((t) => <MenuItem key={t} value={t}>{codeTypeText(t)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel>{tx("Applicable Module")}</InputLabel>
              <Select label={tx("Applicable Module")} value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
                <MenuItem value="all">{tx("All Modules")}</MenuItem>
                {MODULES.map((m) => <MenuItem key={m} value={m}>{moduleText(m)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{tx("Status")}</InputLabel>
              <Select label={tx("Status")} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">{tx("All Status")}</MenuItem>
                {STATUSES.map((s) => <MenuItem key={s} value={s}>{statusText(s)}</MenuItem>)}
              </Select>
            </FormControl>
            <Button onClick={() => { setKeyword(""); setCategoryFilter("all"); setCodeTypeFilter("all"); setModuleFilter("all"); setStatusFilter("all"); }} sx={btn("cancel")}>{tx("Clear")}</Button>
          </Stack>
        </Paper>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "260px minmax(0,1fr) 340px" }, gap: 1.5 }}>
          <Paper elevation={0} sx={{ ...cardSx, height: 600, display: "flex", flexDirection: "column" }}>
            <Head icon={<CategoryOutlinedIcon color="primary" fontSize="small" />} title={tx("Reason Categories")} />
            <List disablePadding sx={{ flex: 1, overflow: "auto" }}>
              <ListItemButton selected={categoryFilter === "all"} onClick={() => setCategoryFilter("all")}>
                <ListItemText primary={tx("All Categories")} secondary={rows.length} />
              </ListItemButton>
              {categories.map((c) => (
                <ListItemButton key={c.id} selected={Number(categoryFilter) === Number(c.id)} onClick={() => setCategoryFilter(c.id)}>
                  <ListItemText primary={c.category_name} secondary={c.reason_code_count} />
                </ListItemButton>
              ))}
            </List>
            <Divider />
            <Button disabled={!canEdit} size="small" sx={{ m: 1 }} startIcon={<SettingsOutlinedIcon fontSize="small" />} onClick={() => setDialog({ type: "manageCategories" })}>
              {tx("Manage Categories")}
            </Button>
          </Paper>

          <Paper elevation={0} sx={{ ...cardSx, height: 600, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Head icon={<LabelOutlinedIcon color="primary" fontSize="small" />} title={`${tx("Reason Code List")} (${filtered.length})`} />
            <Box sx={{ p: 0.75, flex: 1, minHeight: 0 }}>
              <AgGridTable rowData={filtered} columnDefs={cols} loading={loading} pagination paginationPageSize={20} onRowClicked={(e) => setSelectedId(e.data.id)} getRowId={(p) => String(p.data.id)} height="100%" />
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ ...cardSx, height: 600, display: "flex", flexDirection: "column" }}>
            <Head icon={<VisibilityOutlinedIcon color="primary" fontSize="small" />} title={tx("Reason Code Detail")} />
            {detail ? (
              <>
                <Box sx={{ p: 1.5, borderBottom: 1, borderColor: "divider" }}>
                  <Stack direction="row" spacing={0.7} alignItems="center">
                    <Typography fontWeight={800}>{detail.reason_code}</Typography>
                    <StatusChip value={detail.status} />
                  </Stack>
                  <Typography noWrap variant="body2" color="text.secondary">{detail.reason_name}</Typography>
                </Box>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ minHeight: 36, borderBottom: 1, borderColor: "divider", "& .MuiTab-root": { minHeight: 36, p: 0, fontSize: 10, fontWeight: 700 } }}>
                  <Tab label={tx("General")} /><Tab label={tx("Usage Tab")} /><Tab label={tx("History")} />
                </Tabs>
                <Box sx={{ p: 1.5, flex: 1, overflow: "auto" }}>
                  {tab === 0 && (
                    <Stack spacing={0.85}>
                      {[
                        [tx("Reason Code"), detail.reason_code], [tx("Reason Name"), detail.reason_name],
                        [tx("Category"), detail.category_name], [tx("Code Type"), codeTypeText(detail.code_type)],
                        [tx("Sort Order"), detail.sort_order],
                      ].map(([label, value]) => (
                        <Box key={label} sx={{ display: "grid", gridTemplateColumns: "45% 55%", gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">{label}</Typography>
                          <Typography variant="caption" fontWeight={700}>{value ?? EMPTY}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                  {tab === 1 && (
                    <Stack spacing={0.85}>
                      {[
                        [tx("Applicable Module"), moduleText(detail.applicable_module)], [tx("Impact Level"), impactLevelText(detail.impact_level)],
                        [tx("Description"), detail.description], [tx("Submitted By"), detail.submitted_by], [tx("Submitted At"), detail.submitted_at],
                        [tx("Approved By"), detail.approved_by], [tx("Approved At"), detail.approved_at],
                      ].map(([label, value]) => (
                        <Box key={label} sx={{ display: "grid", gridTemplateColumns: "45% 55%", gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">{label}</Typography>
                          <Typography variant="caption" fontWeight={700}>{value || EMPTY}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                  {tab === 2 && (
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
                <Stack direction="row" sx={{ flexWrap: "wrap", justifyContent: "center", gap: 1.2, p: 1.5 }}>
                  {detail.status === "DRAFT" && (
                    <>
                      <Tooltip title={tx("Edit")}><span><IconButton disabled={!canEdit} onClick={() => setDialog({ type: "reasonCode", item: detail })} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><EditOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
                      <Tooltip title={tx("Submit for Approval")}><span><IconButton disabled={!canEdit || saving} color="primary" onClick={submitForApproval} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><SendOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
                    </>
                  )}
                  {detail.status === "PENDING_APPROVAL" && (
                    <>
                      <Tooltip title={tx("Approve")}><span><IconButton disabled={!canEdit || saving} color="success" onClick={approve} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><ThumbUpOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
                      <Tooltip title={tx("Reject")}><span><IconButton disabled={!canEdit || saving} color="error" onClick={() => setDialog({ type: "reject" })} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><ThumbDownOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
                    </>
                  )}
                  {(detail.status === "ACTIVE" || detail.status === "INACTIVE") && (
                    <Tooltip title={tx("Toggle Active / Inactive")}><span><IconButton disabled={!canEdit || saving} color={detail.status === "ACTIVE" ? "success" : "default"} onClick={toggleStatus} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}>{detail.status === "ACTIVE" ? <PlayCircleOutlineIcon fontSize="small" /> : <PauseCircleOutlineIcon fontSize="small" />}</IconButton></span></Tooltip>
                  )}
                  <Tooltip title={tx("Copy")}><span><IconButton disabled={!canEdit} onClick={() => setDialog({ type: "copyReasonCode" })} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><ContentCopyOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
                  <Tooltip title={tx("Delete")}><span><IconButton disabled={!canEdit || saving} color="error" onClick={deleteCode} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><DeleteOutlineIcon fontSize="small" /></IconButton></span></Tooltip>
                </Stack>
              </>
            ) : (
              <Box flex={1} display="grid" sx={{ placeItems: "center" }}><Typography color="text.secondary">{tx("Select a reason code to view details.")}</Typography></Box>
            )}
          </Paper>
        </Box>

        {dialog?.type === "reasonCode" && (
          <ReasonCodeForm item={dialog.item} categories={categories} actor={actor} saving={saving} onClose={() => setDialog(null)} onSave={saveReasonCode} />
        )}
        {dialog?.type === "copyReasonCode" && (
          <CopyReasonCodeDialog saving={saving} onClose={() => setDialog(null)} onConfirm={copyCode} />
        )}
        {dialog?.type === "reject" && (
          <RejectDialog saving={saving} onClose={() => setDialog(null)} onConfirm={reject} />
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
