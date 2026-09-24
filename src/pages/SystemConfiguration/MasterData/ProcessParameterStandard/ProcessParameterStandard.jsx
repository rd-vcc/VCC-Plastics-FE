import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Autocomplete, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, Divider, FormControl, IconButton, InputAdornment,
  InputLabel, MenuItem, Paper, Select, Snackbar, Stack, Tab,
  Tabs, TextField, ThemeProvider as MuiThemeProvider, Tooltip, Typography, createTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import PlaylistAddCheckOutlinedIcon from "@mui/icons-material/PlaylistAddCheckOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import SettingsSuggestOutlinedIcon from "@mui/icons-material/SettingsSuggestOutlined";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
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
import { setActiveLanguage, statusText, tx } from "./locales";

const BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const API = `${BASE}/api/process-parameter-standard-master`;
const PRODUCT_API = `${BASE}/api/product-master`;
const MOLD_API = `${BASE}/api/mold-master`;
const EQUIPMENT_API = `${BASE}/api/equipment-master`;
const MATERIAL_API = `${BASE}/api/material-master`;
const EMPTY = "—";
const STATUSES = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "ACTIVE", "OBSOLETE"];
const SAMPLE_PARAMETERS = [
  "Melt Temperature", "Mold Temperature", "Injection Pressure", "Injection Speed", "Holding Pressure",
  "Holding Time", "Cooling Time", "Screw Speed", "Back Pressure", "Cushion", "Clamp Force", "Cycle Time",
];
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

const STATUS_TONES = { DRAFT: "default", PENDING_APPROVAL: "warning", APPROVED: "info", ACTIVE: "success", OBSOLETE: "error" };
function StatusChip({ value }) {
  return <Chip size="small" variant="outlined" color={STATUS_TONES[value] || "default"} label={statusText(value)} sx={{ height: 21, fontSize: 10, fontWeight: 800 }} />;
}

function formatDisplayDateTime(iso) {
  if (!iso) return EMPTY;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return EMPTY;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function formatDisplayDate(iso) {
  if (!iso) return EMPTY;
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  if (!y || !m || !d) return EMPTY;
  return `${d}/${m}/${y}`;
}

const emptyParameter = () => ({ parameter_name: "", min_value: "", target_value: "", max_value: "", unit: "" });

function ParameterItemsEditor({ rows, onChange }) {
  const update = (idx, key, value) => onChange(rows.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  const remove = (idx) => onChange(rows.filter((_, i) => i !== idx));
  const add = () => onChange([...rows, emptyParameter()]);
  return (
    <Stack spacing={1.25}>
      {rows.map((row, idx) => (
        <Paper key={idx} variant="outlined" sx={{ p: 1.25 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
            <Autocomplete
              freeSolo fullWidth options={SAMPLE_PARAMETERS} value={row.parameter_name}
              onInputChange={(_, value) => update(idx, "parameter_name", value)}
              renderInput={(params) => <TextField {...params} size="small" required label={tx("Parameter Name")} />}
              sx={{ minWidth: 220 }}
            />
            <TextField fullWidth size="small" type="number" label={tx("Min Value")} value={row.min_value} onChange={(e) => update(idx, "min_value", e.target.value)} />
            <TextField fullWidth size="small" type="number" label={tx("Target Value")} value={row.target_value} onChange={(e) => update(idx, "target_value", e.target.value)} />
            <TextField fullWidth size="small" type="number" label={tx("Max Value")} value={row.max_value} onChange={(e) => update(idx, "max_value", e.target.value)} />
            <TextField fullWidth size="small" label={tx("Unit")} value={row.unit} onChange={(e) => update(idx, "unit", e.target.value)} />
            <IconButton size="small" color="error" onClick={() => remove(idx)}><DeleteOutlineIcon fontSize="small" /></IconButton>
          </Stack>
        </Paper>
      ))}
      <Button startIcon={<AddIcon fontSize="small" />} onClick={add} sx={{ alignSelf: "flex-start" }}>{tx("Add Parameter")}</Button>
      {!rows.length && <Alert severity="info">{tx("No parameters yet.")}</Alert>}
    </Stack>
  );
}

function StandardForm({ mode, standard, revision, parameters, products, molds, machineTypes, materials, actor, saving, onClose, onSave }) {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({
    code: standard?.standard_code || "",
    name: revision?.standard_name || "",
    productId: revision?.product_id || "",
    moldId: revision?.mold_id || "",
    machineTypeId: revision?.machine_type_id || "",
    materialId: revision?.material_id || "",
    process: revision?.process || "",
    effectiveDate: revision?.effective_date ? String(revision.effective_date).slice(0, 10) : "",
    remark: revision?.remark || "",
  });
  const [rows, setRows] = useState(
    parameters && parameters.length
      ? parameters.map((p) => ({
          parameter_name: p.parameter_name, min_value: p.min_value ?? "", target_value: p.target_value ?? "",
          max_value: p.max_value ?? "", unit: p.unit || "",
        }))
      : [],
  );
  const ch = (k) => (e) => setForm((o) => ({ ...o, [k]: e.target.value }));
  const submit = () => {
    const parametersPayload = rows
      .filter((r) => r.parameter_name.trim())
      .map((r, i) => ({
        parameter_name: r.parameter_name.trim(),
        min_value: r.min_value === "" ? null : Number(r.min_value),
        target_value: r.target_value === "" ? null : Number(r.target_value),
        max_value: r.max_value === "" ? null : Number(r.max_value),
        unit: r.unit.trim() || null,
        sort_order: i,
      }));
    onSave({
      standard_code: form.code.trim().toUpperCase(),
      standard_name: form.name.trim(),
      product_id: form.productId === "" ? null : Number(form.productId),
      mold_id: form.moldId === "" ? null : Number(form.moldId),
      machine_type_id: form.machineTypeId === "" ? null : Number(form.machineTypeId),
      material_id: form.materialId === "" ? null : Number(form.materialId),
      process: form.process.trim() || null,
      effective_date: form.effectiveDate || null,
      remark: form.remark.trim() || null,
      parameters: parametersPayload,
      actor,
    });
  };
  return (
    <Dialog open fullWidth maxWidth="md" onClose={saving ? undefined : onClose} PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<SettingsSuggestOutlinedIcon />} title={tx(mode === "edit" ? "Edit Standard" : "Add New Standard Dialog")} disabled={saving} onClose={onClose} />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tab label={tx("General")} /><Tab label={tx("Parameter Items")} />
      </Tabs>
      <DialogContent sx={{ minHeight: 380 }}>
        {tab === 0 && (
          <Stack spacing={1.7} sx={{ pt: 1 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <TextField fullWidth required size="small" disabled={mode === "edit"} label={tx("Standard Code")} value={form.code} onChange={ch("code")} />
              <TextField fullWidth required size="small" label={tx("Standard Name")} value={form.name} onChange={ch("name")} />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>{tx("Product")}</InputLabel>
                <Select label={tx("Product")} value={form.productId} onChange={ch("productId")}>
                  <MenuItem value="">—</MenuItem>
                  {products.map((p) => <MenuItem key={p.id} value={p.id}>{p.product_code} · {p.product_name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>{tx("Mold")}</InputLabel>
                <Select label={tx("Mold")} value={form.moldId} onChange={ch("moldId")}>
                  <MenuItem value="">—</MenuItem>
                  {molds.map((m) => <MenuItem key={m.id} value={m.id}>{m.mold_code} · {m.mold_name}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>{tx("Machine Type")}</InputLabel>
                <Select label={tx("Machine Type")} value={form.machineTypeId} onChange={ch("machineTypeId")}>
                  <MenuItem value="">—</MenuItem>
                  {machineTypes.map((t) => <MenuItem key={t.id} value={t.id}>{t.type_name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>{tx("Material")}</InputLabel>
                <Select label={tx("Material")} value={form.materialId} onChange={ch("materialId")}>
                  <MenuItem value="">—</MenuItem>
                  {materials.map((m) => <MenuItem key={m.id} value={m.id}>{m.material_code} · {m.material_name}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <TextField fullWidth size="small" label={tx("Process")} value={form.process} onChange={ch("process")} />
              <TextField fullWidth size="small" type="date" label={tx("Effective Date")} value={form.effectiveDate} onChange={ch("effectiveDate")} InputLabelProps={{ shrink: true }} />
            </Stack>
            <TextField fullWidth multiline minRows={2} label={tx("Remark")} value={form.remark} onChange={ch("remark")} />
          </Stack>
        )}
        {tab === 1 && (
          <Box sx={{ pt: 1 }}>
            <ParameterItemsEditor rows={rows} onChange={setRows} />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Cancel")}</Button>
        <Button onClick={submit} disabled={saving || !form.code.trim() || !form.name.trim()} sx={btn("primary")} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
          {tx("Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function RemarkDialog({ title, icon, requireRemark, saving, onClose, onConfirm }) {
  const [remark, setRemark] = useState("");
  return (
    <Dialog open fullWidth maxWidth="xs" onClose={saving ? undefined : onClose} PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={icon} title={title} disabled={saving} onClose={onClose} />
      <DialogContent>
        <TextField
          fullWidth multiline minRows={2} sx={{ mt: 1 }}
          required={requireRemark}
          label={requireRemark ? tx("Rejection reason (required)") : tx("Remark")}
          value={remark} onChange={(e) => setRemark(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Cancel")}</Button>
        <Button onClick={() => onConfirm(remark)} disabled={saving || (requireRemark && !remark.trim())} sx={btn("primary")}>{tx("Confirm")}</Button>
      </DialogActions>
    </Dialog>
  );
}

function CopyStandardDialog({ saving, onClose, onConfirm }) {
  const [code, setCode] = useState("");
  return (
    <Dialog open fullWidth maxWidth="xs" onClose={saving ? undefined : onClose} PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<ContentCopyOutlinedIcon />} title={tx("Copy Standard")} disabled={saving} onClose={onClose} />
      <DialogContent>
        <TextField fullWidth required size="small" sx={{ mt: 1 }} label={tx("New Standard Code")} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Cancel")}</Button>
        <Button onClick={() => onConfirm(code)} disabled={saving || !code.trim()} sx={btn("primary")}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

function normalFamily(f) { return { ...f, id: Number(f.id), parentId: f.parent_id == null ? null : Number(f.parent_id) }; }

function ProcessLeaf({ label, count, selected, onSelect, depth }) {
  return (
    <Box onClick={onSelect} sx={{ pl: `${depth * 13 + 38}px`, minHeight: 26, display: "flex", alignItems: "center", gap: 0.4, cursor: "pointer", borderRadius: 1, bgcolor: selected ? "action.selected" : "transparent", "&:hover": { bgcolor: "action.hover" } }}>
      <Typography noWrap sx={{ flex: 1, fontSize: 11, fontWeight: selected ? 800 : 500 }}>{label}</Typography>
      <Chip label={count} size="small" variant="outlined" sx={{ height: 17, mr: 0.5, "& .MuiChip-label": { px: 0.5, fontSize: 9 } }} />
    </Box>
  );
}

function ProductNode({ product, rows, selection, onSelect, depth }) {
  const [open, setOpen] = useState(true);
  const productRows = rows.filter((r) => Number(r.product_id) === Number(product.id));
  const processes = [...new Set(productRows.map((r) => r.process).filter(Boolean))];
  const selected = selection.productId === product.id && !selection.process;
  return (
    <Box>
      <Box onClick={() => onSelect({ productId: product.id, process: null })} sx={{ pl: `${depth * 13 + 20}px`, minHeight: 27, display: "flex", alignItems: "center", gap: 0.4, cursor: "pointer", borderRadius: 1, bgcolor: selected ? "action.selected" : "transparent", "&:hover": { bgcolor: "action.hover" } }}>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }} sx={{ width: 18, height: 18 }}>
          {processes.length ? (open ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ChevronRightIcon sx={{ fontSize: 14 }} />) : <Box width={14} />}
        </IconButton>
        <Typography noWrap sx={{ flex: 1, fontSize: 11.5, fontWeight: selected ? 800 : 600 }}>{product.product_name}</Typography>
        <Chip label={productRows.length} size="small" variant="outlined" color={selected ? "primary" : "default"} sx={{ height: 18, mr: 0.5, "& .MuiChip-label": { px: 0.5, fontSize: 9.5 } }} />
      </Box>
      {open && processes.map((proc) => (
        <ProcessLeaf key={proc} label={proc} count={productRows.filter((r) => r.process === proc).length}
          selected={selection.productId === product.id && selection.process === proc}
          onSelect={() => onSelect({ productId: product.id, process: proc })} depth={depth + 1} />
      ))}
    </Box>
  );
}

function FamilyNode({ family, families, products, rows, selection, onSelect, depth = 0 }) {
  const [open, setOpen] = useState(true);
  const childFamilies = families.filter((f) => f.parentId === family.id);
  const familyProducts = products.filter((p) => Number(p.product_family_id) === Number(family.id));
  const familyProductIds = familyProducts.map((p) => p.id);
  const count = rows.filter((r) => familyProductIds.includes(Number(r.product_id))).length;
  const hasChildren = childFamilies.length > 0 || familyProducts.length > 0;
  return (
    <Box>
      <Box sx={{ pl: `${depth * 13 + 4}px`, minHeight: 28, display: "flex", alignItems: "center", gap: 0.4 }}>
        <IconButton size="small" onClick={() => setOpen((o) => !o)} sx={{ width: 18, height: 18 }}>
          {hasChildren ? (open ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ChevronRightIcon sx={{ fontSize: 14 }} />) : <Box width={14} />}
        </IconButton>
        <Typography noWrap sx={{ flex: 1, fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "text.secondary" }}>{family.family_name}</Typography>
        <Chip label={count} size="small" variant="outlined" sx={{ height: 18, mr: 0.5, "& .MuiChip-label": { px: 0.5, fontSize: 9.5 } }} />
      </Box>
      {open && (
        <>
          {childFamilies.map((child) => (
            <FamilyNode key={child.id} family={child} families={families} products={products} rows={rows} selection={selection} onSelect={onSelect} depth={depth + 1} />
          ))}
          {familyProducts.map((product) => (
            <ProductNode key={product.id} product={product} rows={rows} selection={selection} onSelect={onSelect} depth={depth + 1} />
          ))}
        </>
      )}
    </Box>
  );
}

export default function ProcessParameterStandard() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  const { theme } = useAppTheme();
  const muiTheme = useMemo(() => pageTheme(theme), [theme]);
  const { canEdit } = usePagePermission();
  const actor = getCurrentUser()?.employee_code || "SYSTEM";

  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ total_standards: 0, active: 0, products: 0, processes: 0, machine_types: 0, parameter_items: 0 });
  const [products, setProducts] = useState([]);
  const [families, setFamilies] = useState([]);
  const [molds, setMolds] = useState([]);
  const [machineTypes, setMachineTypes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [treeSelection, setTreeSelection] = useState({ productId: null, process: null });
  const [keyword, setKeyword] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [processFilter, setProcessFilter] = useState("all");
  const [machineTypeFilter, setMachineTypeFilter] = useState("all");
  const [materialFilter, setMaterialFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statData, listData, productData, familyData, moldData, typeData, materialData] = await Promise.all([
        request(`${API}/statistics`),
        request(`${API}/standards?page=1&page_size=500`),
        request(`${PRODUCT_API}/products?page_size=500`),
        request(`${PRODUCT_API}/families?tree=false`),
        request(`${MOLD_API}/molds?page_size=500`),
        request(`${EQUIPMENT_API}/types`),
        request(`${MATERIAL_API}/materials?page_size=500`),
      ]);
      const list = listData?.items || [];
      setStats(statData); setRows(list);
      setProducts(productData?.items || []);
      setFamilies((Array.isArray(familyData) ? familyData : []).map(normalFamily));
      setMolds(moldData?.items || []);
      setMachineTypes((typeData || []).filter((t) => t.category === "MACHINE"));
      setMaterials(materialData?.items || []);
      setSelectedId((old) => (list.some((x) => x.id === old) ? old : list[0]?.id ?? null));
    } catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [notify, request]);
  useEffect(() => { load(); }, [load]);

  const [viewRevisionId, setViewRevisionId] = useState(null);
  const loadDetail = useCallback(async (id, revisionId) => {
    if (!id) { setDetail(null); return; }
    const query = revisionId ? `?revision_id=${revisionId}` : "";
    try { setDetail(await request(`${API}/standards/${id}${query}`)); } catch (e) { notify("error", e.message); }
  }, [request, notify]);
  useEffect(() => { setViewRevisionId(null); loadDetail(selectedId); setTab(0); }, [selectedId, loadDetail]);
  useEffect(() => { if (viewRevisionId) loadDetail(selectedId, viewRevisionId); }, [viewRevisionId, selectedId, loadDetail]);

  const [auditLog, setAuditLog] = useState([]);
  useEffect(() => {
    if (!selectedId || tab !== 2) return;
    request(`${API}/standards/${selectedId}/audit-log`).then(setAuditLog).catch((e) => notify("error", e.message));
  }, [selectedId, tab, request, notify]);

  const processes = useMemo(() => [...new Set(rows.map((r) => r.process).filter(Boolean))].sort(), [rows]);
  const roots = useMemo(() => families.filter((f) => f.parentId == null), [families]);

  const filtered = useMemo(() => {
    const q = keyword.toLowerCase().trim();
    return rows.filter((r) => {
      if (q && !`${r.standard_code} ${r.standard_name}`.toLowerCase().includes(q)) return false;
      if (productFilter !== "all" && Number(r.product_id) !== Number(productFilter)) return false;
      if (processFilter !== "all" && r.process !== processFilter) return false;
      if (machineTypeFilter !== "all" && Number(r.machine_type_id) !== Number(machineTypeFilter)) return false;
      if (materialFilter !== "all" && Number(r.material_id) !== Number(materialFilter)) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (treeSelection.productId != null && Number(r.product_id) !== Number(treeSelection.productId)) return false;
      if (treeSelection.process != null && r.process !== treeSelection.process) return false;
      return true;
    });
  }, [rows, keyword, productFilter, processFilter, machineTypeFilter, materialFilter, statusFilter, treeSelection]);

  const percent = (n) => (stats.total_standards ? `${((n / stats.total_standards) * 100).toFixed(1)}% ${tx("of total")}` : `0% ${tx("of total")}`);

  const reloadAll = useCallback(async () => { await load(); await loadDetail(selectedId, viewRevisionId); }, [load, loadDetail, selectedId, viewRevisionId]);

  const runAction = async (fn) => {
    setSaving(true);
    try { const result = await fn(); await reloadAll(); notify("success", result?.message || tx("Status updated.")); }
    catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };

  const createStandard = (payload) => runAction(async () => {
    const result = await request(`${API}/standards`, { method: "POST", body: JSON.stringify({ ...payload, created_by: actor }) });
    setDialog(null); setSelectedId(result.id);
    return { message: tx("Standard saved.") };
  });
  const saveRevisionEdit = (payload) => runAction(async () => {
    const revisionId = detail.revision.id;
    const { standard_code, actor: _a, ...rest } = payload;
    const result = await request(`${API}/standards/${detail.id}/revisions/${revisionId}`, {
      method: "PUT", body: JSON.stringify({ ...rest, updated_by: actor, version: detail.revision.version }),
    });
    setDialog(null);
    return { message: tx("Standard saved.") };
  });
  const newRevision = () => runAction(async () => {
    const result = await request(`${API}/standards/${detail.id}/revisions`, {
      method: "POST", body: JSON.stringify({ source_revision_id: detail.revision.id, created_by: actor }),
    });
    setDialog(null);
    setViewRevisionId(result.id);
    await loadDetail(detail.id, result.id);
    return { message: tx("New revision created.") };
  });
  const submitRevision = () => runAction(() => request(`${API}/standards/${detail.id}/revisions/${detail.revision.id}/submit`, { method: "POST", body: JSON.stringify({ actor }) }));
  const approveRevision = () => runAction(() => request(`${API}/standards/${detail.id}/revisions/${detail.revision.id}/approve`, { method: "POST", body: JSON.stringify({ actor }) }));
  const rejectRevision = (remark) => runAction(async () => {
    const result = await request(`${API}/standards/${detail.id}/revisions/${detail.revision.id}/reject`, { method: "POST", body: JSON.stringify({ actor, remark }) });
    setDialog(null); return result;
  });
  const activateRevision = () => runAction(() => request(`${API}/standards/${detail.id}/revisions/${detail.revision.id}/activate`, { method: "POST", body: JSON.stringify({ actor }) }));
  const obsoleteRevision = () => runAction(() => request(`${API}/standards/${detail.id}/revisions/${detail.revision.id}/obsolete`, { method: "POST", body: JSON.stringify({ actor }) }));
  const copyStandard = (newCode) => runAction(async () => {
    const result = await request(`${API}/standards/${detail.id}/copy`, { method: "POST", body: JSON.stringify({ new_standard_code: newCode, created_by: actor }) });
    setDialog(null); setSelectedId(result.id);
    return { message: tx("Standard copied.") };
  });
  const deleteStandard = async () => {
    if (!window.confirm(tx("Are you sure you want to delete this item?"))) return;
    setSaving(true);
    try { await request(`${API}/standards/${detail.id}`, { method: "DELETE" }); setSelectedId(null); setDetail(null); await load(); notify("success", "Deleted."); }
    catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };

  const cols = useMemo(() => [
    { headerName: tx("Standard Code"), field: "standard_code", width: 130, pinned: "left" },
    { headerName: tx("Standard Name"), field: "standard_name", minWidth: 180, flex: 1.2 },
    { headerName: tx("Product"), field: "product_name", minWidth: 140, valueFormatter: (p) => p.value || EMPTY },
    { headerName: tx("Mold"), field: "mold_name", minWidth: 140, valueFormatter: (p) => p.value || EMPTY },
    { headerName: tx("Machine Type"), field: "type_name", width: 150, valueFormatter: (p) => p.value || EMPTY },
    { headerName: tx("Material"), field: "material_name", minWidth: 140, valueFormatter: (p) => p.value || EMPTY },
    { headerName: tx("Process"), field: "process", width: 140, valueFormatter: (p) => p.value || EMPTY },
    { headerName: tx("Revision"), field: "revision_no", width: 90, valueFormatter: (p) => `Rev ${p.value}` },
    { headerName: tx("Status"), field: "status", width: 140, cellRenderer: (p) => <Box height="100%" display="flex" alignItems="center"><StatusChip value={p.value} /></Box> },
    { headerName: tx("Updated"), field: "updated_at", width: 150, valueFormatter: (p) => formatDisplayDateTime(p.value) },
    { headerName: tx("Actions"), width: 90, sortable: false, filter: false, cellRenderer: (p) => (
      <Stack direction="row" alignItems="center" height="100%">
        <IconButton size="small" onClick={() => setSelectedId(p.data.id)}><VisibilityOutlinedIcon fontSize="small" /></IconButton>
      </Stack>
    ) },
  ], [language]);

  const selected = detail;
  const rev = selected?.revision;
  const isDraft = rev?.status === "DRAFT";
  const isPending = rev?.status === "PENDING_APPROVAL";
  const isApproved = rev?.status === "APPROVED";
  const isActive = rev?.status === "ACTIVE";
  const hasOpenRevision = selected?.revisions?.some((r) => ["DRAFT", "PENDING_APPROVAL"].includes(r.status));

  const kpis = [
    { label: tx("Total Standards"), value: stats.total_standards, note: "", icon: SettingsSuggestOutlinedIcon, tone: "primary" },
    { label: tx("Active Standards"), value: stats.active, note: percent(stats.active), icon: CheckCircleOutlineIcon, tone: "success" },
    { label: tx("Products"), value: stats.products, note: "", icon: FactCheckOutlinedIcon, tone: "info" },
    { label: tx("Processes"), value: stats.processes, note: "", icon: HourglassEmptyOutlinedIcon, tone: "warning" },
    { label: tx("Machine Types"), value: stats.machine_types, note: "", icon: WarningAmberOutlinedIcon, tone: "danger" },
    { label: tx("Parameter Items"), value: stats.parameter_items, note: "", icon: PlaylistAddCheckOutlinedIcon, tone: "accent" },
  ];

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box>
        <PageMeta title={`${tx("Process Parameter Standard")} | VCC Plastics`} description={tx("Manage standard process parameters for machines, molds, materials and products")} />
        <PageBreadcrumb pageTitle={tx("Process Parameter Standard")} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr auto" }, gap: 1.5, alignItems: "center", mb: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800}>{tx("Process Parameter Standard")}</Typography>
            <Typography variant="body2" color="text.secondary">{tx("Manage standard process parameters for machines, molds, materials and products")}</Typography>
          </Box>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2, justifyContent: "flex-end" }}>
            <Button disabled={!canEdit} startIcon={<AddIcon />} onClick={() => setDialog({ type: "create" })} sx={btn("primary")}>{tx("Add New Standard")}</Button>
          </Stack>
        </Box>

        <KpiCardGroup>
          {kpis.map((k) => { const Icon = k.icon; return <KpiCard key={k.label} label={k.label} value={k.value} note={k.note} icon={<Icon />} tone={k.tone} />; })}
        </KpiCardGroup>

        <Paper elevation={0} sx={{ ...cardSx, my: 1.5, p: 1 }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={1} flexWrap="wrap">
            <TextField size="small" placeholder={tx("Search by standard code or name...")} value={keyword} onChange={(e) => setKeyword(e.target.value)} sx={{ minWidth: 230 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel>{tx("Product")}</InputLabel>
              <Select label={tx("Product")} value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
                <MenuItem value="all">{tx("All Products")}</MenuItem>
                {products.map((p) => <MenuItem key={p.id} value={p.id}>{p.product_code}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{tx("Process")}</InputLabel>
              <Select label={tx("Process")} value={processFilter} onChange={(e) => setProcessFilter(e.target.value)}>
                <MenuItem value="all">{tx("All Processes")}</MenuItem>
                {processes.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>{tx("Machine Type")}</InputLabel>
              <Select label={tx("Machine Type")} value={machineTypeFilter} onChange={(e) => setMachineTypeFilter(e.target.value)}>
                <MenuItem value="all">{tx("All Machine Types")}</MenuItem>
                {machineTypes.map((t) => <MenuItem key={t.id} value={t.id}>{t.type_name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>{tx("Material")}</InputLabel>
              <Select label={tx("Material")} value={materialFilter} onChange={(e) => setMaterialFilter(e.target.value)}>
                <MenuItem value="all">{tx("All Materials")}</MenuItem>
                {materials.map((m) => <MenuItem key={m.id} value={m.id}>{m.material_code}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{tx("Status")}</InputLabel>
              <Select label={tx("Status")} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">{tx("All Status")}</MenuItem>
                {STATUSES.map((s) => <MenuItem key={s} value={s}>{statusText(s)}</MenuItem>)}
              </Select>
            </FormControl>
            <Button onClick={() => { setKeyword(""); setProductFilter("all"); setProcessFilter("all"); setMachineTypeFilter("all"); setMaterialFilter("all"); setStatusFilter("all"); setTreeSelection({ productId: null, process: null }); }} sx={btn("cancel")}>{tx("Clear")}</Button>
          </Stack>
        </Paper>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "250px minmax(0,1fr) 360px" }, gap: 1.5 }}>
          <Paper elevation={0} sx={{ ...cardSx, height: 600, display: "flex", flexDirection: "column" }}>
            <Head icon={<AccountTreeOutlinedIcon color="primary" fontSize="small" />} title={tx("Standard Hierarchy")} />
            <Box sx={{ p: 0.75, overflow: "auto" }}>
              <Box onClick={() => setTreeSelection({ productId: null, process: null })} sx={{ p: 0.75, borderRadius: 1, cursor: "pointer", bgcolor: treeSelection.productId == null ? "action.selected" : "transparent" }}>
                <Typography fontSize={11.5} fontWeight={800}>{tx("All standards")} ({rows.length})</Typography>
              </Box>
              {roots.map((f) => <FamilyNode key={f.id} family={f} families={families} products={products} rows={rows} selection={treeSelection} onSelect={setTreeSelection} />)}
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ ...cardSx, height: 600, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Head icon={<SettingsSuggestOutlinedIcon color="primary" fontSize="small" />} title={`${tx("Standard List")} (${filtered.length})`} />
            <Box sx={{ p: 0.75, flex: 1, minHeight: 0 }}>
              <AgGridTable rowData={filtered} columnDefs={cols} loading={loading} pagination paginationPageSize={20} onRowClicked={(e) => setSelectedId(e.data.id)} getRowId={(p) => String(p.data.id)} height="100%" />
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ ...cardSx, height: 600, display: "flex", flexDirection: "column" }}>
            <Head icon={<VisibilityOutlinedIcon color="primary" fontSize="small" />} title={tx("Standard Detail")} />
            {selected && rev ? (
              <>
                <Box sx={{ p: 1.5, borderBottom: 1, borderColor: "divider" }}>
                  <Stack direction="row" spacing={0.7} alignItems="center">
                    <Typography fontWeight={800}>{selected.standard_code}</Typography>
                    <StatusChip value={rev.status} />
                    <Chip size="small" label={`Rev ${rev.revision_no}`} sx={{ height: 20, fontSize: 10 }} />
                  </Stack>
                  <Typography noWrap variant="body2" color="text.secondary">{rev.standard_name}</Typography>
                </Box>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ minHeight: 36, borderBottom: 1, borderColor: "divider", "& .MuiTab-root": { minHeight: 36, p: 0, fontSize: 10, fontWeight: 700 } }}>
                  <Tab label={tx("General")} /><Tab label={tx("Parameter Items")} /><Tab label={tx("History")} />
                </Tabs>
                <Box sx={{ p: 1.5, flex: 1, overflow: "auto" }}>
                  {tab === 0 && (
                    <Stack spacing={0.85}>
                      {[
                        [tx("Standard Code"), selected.standard_code], [tx("Standard Name"), rev.standard_name],
                        [tx("Product"), rev.product_name ? `${rev.product_code} · ${rev.product_name}` : null],
                        [tx("Mold"), rev.mold_name ? `${rev.mold_code} · ${rev.mold_name}` : null],
                        [tx("Machine Type"), rev.type_name], [tx("Material"), rev.material_name ? `${rev.material_code} · ${rev.material_name}` : null],
                        [tx("Process"), rev.process],
                        [tx("Effective Date"), formatDisplayDate(rev.effective_date)], [tx("Remark"), rev.remark],
                        [tx("Submitted By"), rev.submitted_by], [tx("Submitted At"), formatDisplayDateTime(rev.submitted_at)],
                        [tx("Approved By"), rev.approved_by], [tx("Approved At"), formatDisplayDateTime(rev.approved_at)],
                      ].map(([label, value]) => (
                        <Box key={label} sx={{ display: "grid", gridTemplateColumns: "42% 58%", gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">{label}</Typography>
                          <Typography variant="caption" fontWeight={700}>{value || EMPTY}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                  {tab === 1 && (
                    <Stack spacing={1}>
                      {(selected.parameters || []).length ? selected.parameters.map((p) => (
                        <Paper key={p.id} variant="outlined" sx={{ p: 1 }}>
                          <Typography variant="caption" fontWeight={800} sx={{ display: "block", mb: 0.5 }}>{p.parameter_name}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            {tx("Min Value")}: {p.min_value ?? EMPTY} &nbsp;|&nbsp; {tx("Target Value")}: {p.target_value ?? EMPTY} &nbsp;|&nbsp; {tx("Max Value")}: {p.max_value ?? EMPTY} {p.unit || ""}
                          </Typography>
                        </Paper>
                      )) : <Alert severity="info">{tx("No parameters yet.")}</Alert>}
                    </Stack>
                  )}
                  {tab === 2 && (
                    <Stack spacing={1.5}>
                      <Box>
                        <Typography variant="caption" fontWeight={800} color="text.secondary">{tx("All Revisions")}</Typography>
                        <Stack divider={<Divider />} sx={{ mt: 0.5 }}>
                          {(selected.revisions || []).map((r) => (
                            <Stack key={r.id} direction="row" justifyContent="space-between" alignItems="center" py={0.6}
                              onClick={() => setViewRevisionId(r.id)}
                              sx={{ cursor: "pointer", px: 0.5, borderRadius: 1, bgcolor: rev.id === r.id ? "action.selected" : "transparent", "&:hover": { bgcolor: "action.hover" } }}>
                              <Typography variant="caption" fontWeight={rev.id === r.id ? 800 : 400}>Rev {r.revision_no}</Typography>
                              <StatusChip value={r.status} />
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                      <Box>
                        <Typography variant="caption" fontWeight={800} color="text.secondary">{tx("Audit Log")}</Typography>
                        <Stack divider={<Divider />} sx={{ mt: 0.5 }}>
                          {auditLog.map((a) => (
                            <Box key={a.id} py={0.6}>
                              <Typography variant="caption" fontWeight={700} display="block">{a.action} — {a.from_status || EMPTY} → {a.to_status || EMPTY}</Typography>
                              <Typography variant="caption" color="text.secondary" display="block">{a.actor} · {formatDisplayDateTime(a.acted_at)}{a.remark ? ` · ${a.remark}` : ""}</Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    </Stack>
                  )}
                </Box>
                <Divider />
                <Stack direction="row" sx={{ justifyContent: "center", gap: 1, p: 1, flexWrap: "wrap" }}>
                  {isDraft && <Tooltip title={tx("Edit")}><span><IconButton disabled={!canEdit} onClick={() => setDialog({ type: "edit" })} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><EditOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>}
                  {isDraft && <Tooltip title={tx("Submit for Approval")}><span><IconButton disabled={!canEdit || saving} color="warning" onClick={submitRevision} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><SendOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>}
                  {isPending && <Tooltip title={tx("Approve")}><span><IconButton disabled={!canEdit || saving} color="success" onClick={approveRevision} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><ThumbUpOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>}
                  {isPending && <Tooltip title={tx("Reject")}><span><IconButton disabled={!canEdit || saving} color="error" onClick={() => setDialog({ type: "reject" })} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><ThumbDownOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>}
                  {isApproved && <Tooltip title={tx("Activate")}><span><IconButton disabled={!canEdit || saving} color="success" onClick={activateRevision} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><CheckCircleOutlineIcon fontSize="small" /></IconButton></span></Tooltip>}
                  {isActive && <Tooltip title={tx("Mark Obsolete")}><span><IconButton disabled={!canEdit || saving} color="error" onClick={obsoleteRevision} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><WarningAmberOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>}
                  {!isDraft && !isPending && !hasOpenRevision && <Tooltip title={tx("New Revision Action")}><span><IconButton disabled={!canEdit || saving} onClick={() => setDialog({ type: "newRevision" })} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><FactCheckOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>}
                  <Tooltip title={tx("Copy Standard")}><span><IconButton disabled={!canEdit} onClick={() => setDialog({ type: "copy" })} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><ContentCopyOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
                  <Tooltip title={tx("Delete")}><span><IconButton disabled={!canEdit || saving} color="error" onClick={deleteStandard} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><DeleteOutlineIcon fontSize="small" /></IconButton></span></Tooltip>
                </Stack>
              </>
            ) : (
              <Box flex={1} display="grid" sx={{ placeItems: "center" }}><Typography color="text.secondary">{tx("Select a standard to view details.")}</Typography></Box>
            )}
          </Paper>
        </Box>

        {dialog?.type === "create" && (
          <StandardForm mode="create" standard={null} revision={null} parameters={[]} products={products} molds={molds} machineTypes={machineTypes} materials={materials} actor={actor} saving={saving} onClose={() => setDialog(null)} onSave={createStandard} />
        )}
        {dialog?.type === "edit" && selected && (
          <StandardForm mode="edit" standard={selected} revision={rev} parameters={selected.parameters} products={products} molds={molds} machineTypes={machineTypes} materials={materials} actor={actor} saving={saving} onClose={() => setDialog(null)} onSave={saveRevisionEdit} />
        )}
        {dialog?.type === "reject" && (
          <RemarkDialog title={tx("Reject")} icon={<ThumbDownOutlinedIcon />} requireRemark saving={saving} onClose={() => setDialog(null)} onConfirm={rejectRevision} />
        )}
        {dialog?.type === "newRevision" && (
          <RemarkDialog title={tx("New Revision Action")} icon={<FactCheckOutlinedIcon />} requireRemark={false} saving={saving} onClose={() => setDialog(null)} onConfirm={() => newRevision()} />
        )}
        {dialog?.type === "copy" && (
          <CopyStandardDialog saving={saving} onClose={() => setDialog(null)} onConfirm={copyStandard} />
        )}

        <Snackbar open={msg.open} autoHideDuration={4500} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}
