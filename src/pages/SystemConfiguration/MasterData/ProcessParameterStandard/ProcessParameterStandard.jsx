import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
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
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import RuleFolderOutlinedIcon from "@mui/icons-material/SettingsSuggestOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import SearchIcon from "@mui/icons-material/Search";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { getAccessToken, getCurrentUser } from "../../../../auth/auth";
import usePagePermission from "../../../../auth/usePagePermission";
import { buttonSystem } from "../../../../components/button/ButtonSystem";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import PageMeta from "../../../../components/common/PageMeta";
import { KpiCard, KpiCardGroup } from "../../../../components/kpi/KpiCardSystem";
import AgGridTable from "../../../../components/tables/BasicTables/BasicTableOne";
import { CountBadge, PanelHeader, masterGridSx, panelSx } from "../../../../components/masterData/MasterPanels";
import useFillHeight from "../../../../hooks/useFillHeight";
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
// Machine signals (Chapter II.1): the parameter name must be the English signal name, the machine
// matches it by code (upper case, spaces → "_"), e.g. "Melt Temperature" → MELT_TEMPERATURE.
const MACHINE_SIGNALS = [
  ["Injection Pressure", "bar", "Áp suất phun"], ["Holding Pressure", "bar", "Áp suất giữ"], ["Melt Temperature", "°C", "Nhiệt độ nhựa"],
  ["Mold Temperature", "°C", "Nhiệt độ khuôn"], ["Screw Speed", "rpm", "Tốc độ trục vít"], ["Cooling Time", "s", "Thời gian làm nguội"],
  ["Injection Time", "s", "Thời gian phun"], ["Holding Time", "s", "Thời gian giữ áp"], ["Mold Open Time", "s", "Thời gian mở khuôn"],
  ["Eject Time", "s", "Thời gian đẩy"], ["Cycle Time", "s", "Chu kỳ ép"],
];
const SAMPLE_PARAMETERS = MACHINE_SIGNALS.map(([name]) => name);
const signalCode = (name) => String(name || "").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const KNOWN_CODES = new Set(MACHINE_SIGNALS.map(([name]) => signalCode(name)));
const EMPTY = "—";
const STATUS_COLORS = { ACTIVE: "#005BAB", OBSOLETE: "#F04438" };
const person = (name, code) => (name ? `${name} - ${code}` : code || EMPTY);
const dateText = (value) => {
  if (!value) return EMPTY;
  const d = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return String(value);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} ${d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
};
const dayText = (iso) => {
  if (!iso) return EMPTY;
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : EMPTY;
};
const numText = (v) => (v == null || v === "" ? EMPTY : String(Number(v)).replace(".", ","));

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


// Record status pill: Hoạt động / Ngừng dùng (stored as ACTIVE / OBSOLETE on the current revision).
function WorkflowPill({ value, width = 92 }) {
  const active = value === "ACTIVE";
  const color = active ? "#12B76A" : "#F04438";
  return (
    <Box component="span" title={statusText(active ? "ACTIVE" : "OBSOLETE")} sx={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxSizing: "border-box", width, height: 22, px: 0.5,
      whiteSpace: "nowrap", overflow: "hidden", borderRadius: 1, fontSize: 10, fontWeight: 700, color, bgcolor: `${color}1A`, border: `1px solid ${color}40`,
    }}>{statusText(active ? "ACTIVE" : "OBSOLETE")}</Box>
  );
}

const emptyParameter = () => ({ parameter_name: "", min_value: "", target_value: "", max_value: "", unit: "" });

function ParameterItemsEditor({ rows, onChange }) {
  const update = (idx, key, value) => onChange(rows.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  const remove = (idx) => onChange(rows.filter((_, i) => i !== idx));
  const add = () => onChange([...rows, emptyParameter()]);
  const bad = (r) => r.min_value !== "" && r.max_value !== "" && Number(r.min_value) > Number(r.max_value);
  return (
    <Stack spacing={1.25}>
      {rows.length ? (
        <Box sx={{ display: { xs: "none", md: "grid" }, gridTemplateColumns: "28px minmax(0,2.2fr) repeat(3,minmax(0,1fr)) minmax(0,0.8fr) 36px", gap: 1.25, px: 1.25 }}>
          {["#", tx("Parameter Name"), tx("Min Value"), tx("Target Value"), tx("Max Value"), tx("Unit"), ""].map((h, i) => (
            <Typography key={i} sx={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: "text.secondary" }}>{h}</Typography>
          ))}
        </Box>
      ) : null}
      {rows.map((row, idx) => (
        <Box key={idx} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "28px minmax(0,2.2fr) repeat(3,minmax(0,1fr)) minmax(0,0.8fr) 36px" }, gap: 1.25, alignItems: "start",
          p: 1.25, border: 1, borderColor: bad(row) ? "error.main" : "divider", borderRadius: 1.5 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: "text.secondary", textAlign: "center" }}>{idx + 1}</Typography>
          <Autocomplete freeSolo options={SAMPLE_PARAMETERS} value={row.parameter_name}
            onInputChange={(_, value) => {
              const known = MACHINE_SIGNALS.find(([n]) => n === value);
              onChange(rows.map((r, i) => (i === idx ? { ...r, parameter_name: value, unit: known && !r.unit ? known[1] : r.unit } : r)));
            }}
            renderOption={(props, option) => {
              const { key, ...rest } = props;
              const vi = MACHINE_SIGNALS.find(([n]) => n === option)?.[2];
              return <li key={key} {...rest}><Box><Typography sx={{ fontSize: 11.5, fontWeight: 600 }}>{option}</Typography><Typography variant="caption" color="text.secondary">{vi} · {signalCode(option)}</Typography></Box></li>;
            }}
            renderInput={(params) => {
              const code = signalCode(row.parameter_name);
              const ok = KNOWN_CODES.has(code);
              return <TextField {...params} size="small" required label={tx("Parameter Name")}
                helperText={row.parameter_name ? (ok ? `${tx("Machine signal")}: ${code}` : tx("Not a machine signal — use the English signal name")) : " "}
                slotProps={{ ...params.slotProps, formHelperText: { sx: { mx: 0.25, color: row.parameter_name ? (ok ? "success.main" : "warning.main") : undefined } } }} />;
            }} />
          <TextField size="small" type="number" label={tx("Min Value")} value={row.min_value} onChange={(e) => update(idx, "min_value", e.target.value)} error={bad(row)} />
          <TextField size="small" type="number" label={tx("Target Value")} value={row.target_value} onChange={(e) => update(idx, "target_value", e.target.value)} />
          <TextField size="small" type="number" label={tx("Max Value")} value={row.max_value} onChange={(e) => update(idx, "max_value", e.target.value)} error={bad(row)} />
          <TextField size="small" label={tx("Unit")} placeholder="°C, bar…" value={row.unit} onChange={(e) => update(idx, "unit", e.target.value)} />
          <Tooltip title={tx("Delete")}><IconButton size="small" color="error" onClick={() => remove(idx)}><DeleteOutlineIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
        </Box>
      ))}
      {!rows.length ? <Alert severity="info" sx={{ borderRadius: 2 }}>{tx("No parameters yet.")}</Alert> : null}
      <Box><Button variant="outlined" startIcon={<AddIcon />} onClick={add} sx={buttonSx("edit")}>{tx("Add Parameter")}</Button></Box>
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
      ? parameters.map((p) => ({ parameter_name: p.parameter_name, min_value: p.min_value ?? "", target_value: p.target_value ?? "", max_value: p.max_value ?? "", unit: p.unit || "" }))
      : [],
  );
  const ch = (k) => (e) => setForm((o) => ({ ...o, [k]: e.target.value }));
  const g = (cols) => ({ display: "grid", gridTemplateColumns: { xs: "1fr", sm: cols }, gap: 1.5, pt: 0.75 });
  const num = (v) => (v === "" || v == null ? null : Number(v));
  const invalid = rows.some((r) => r.min_value !== "" && r.max_value !== "" && Number(r.min_value) > Number(r.max_value));
  const submit = () => onSave({
    standard_code: form.code.trim().toUpperCase(),
    standard_name: form.name.trim(),
    product_id: form.productId === "" ? null : Number(form.productId),
    mold_id: form.moldId === "" ? null : Number(form.moldId),
    machine_type_id: form.machineTypeId === "" ? null : Number(form.machineTypeId),
    material_id: form.materialId === "" ? null : Number(form.materialId),
    process: form.process.trim() || null,
    effective_date: form.effectiveDate || null,
    remark: form.remark.trim() || null,
    parameters: rows.filter((r) => r.parameter_name.trim()).map((r, i) => ({
      parameter_name: r.parameter_name.trim(), min_value: num(r.min_value), target_value: num(r.target_value), max_value: num(r.max_value), unit: r.unit.trim() || null, sort_order: i,
    })),
    actor,
  });
  const pick = (label, key, list, show) => (
    <TextField select size="small" label={label} value={form[key]} onChange={ch(key)} slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}>
      <MenuItem value=""><em>{tx("Any")}</em></MenuItem>
      {list.map((x) => <MenuItem key={x.id} value={x.id}>{show(x)}</MenuItem>)}
    </TextField>
  );
  return (
    <Dialog open fullWidth maxWidth="lg" onClose={saving ? undefined : onClose} slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogHeader icon={<RuleFolderOutlinedIcon />} title={tx(mode === "edit" ? "Edit Standard" : "Add New Standard Dialog")}
        subtitle={mode === "edit" ? `${standard?.standard_code} · Rev ${revision?.revision_no}` : tx("The standard is applied as soon as it is saved.")} disabled={saving} onClose={onClose} />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, minHeight: 29, borderBottom: 1, borderColor: "divider", "& .MuiTab-root": { minHeight: 29, fontSize: 11.5, fontWeight: 700, textTransform: "none" } }}>
        <Tab label={tx("General")} /><Tab label={`${tx("Parameter Items")} (${rows.length})`} />
      </Tabs>
      <DialogContent sx={{ px: 3, py: 2.5, height: { md: 520 } }}>
        {tab === 0 && (
          <Stack spacing={2.25}>
            <Stack spacing={0.5}>
              <FieldLabel>{tx("Basic information")}</FieldLabel>
              <Box sx={g("1fr 2fr")}>
                <TextField required size="small" disabled={mode === "edit"} label={tx("Standard Code")} placeholder="VD: PPS-SP001" value={form.code} onChange={(e) => setForm((o) => ({ ...o, code: e.target.value.toUpperCase() }))} />
                <TextField required size="small" label={tx("Standard Name")} value={form.name} onChange={ch("name")} />
              </Box>
            </Stack>
            <Stack spacing={0.5}>
              <FieldLabel>{tx("Scope")}</FieldLabel>
              <Typography variant="caption" color="text.secondary">{tx("Leave a field empty to apply to all; the most specific standard wins on the machine.")}</Typography>
              <Box sx={g("1fr 1fr")}>
                {pick(tx("Product"), "productId", products, (p) => `${p.product_code} · ${p.product_name}`)}
                {pick(tx("Mold"), "moldId", molds, (m) => `${m.mold_code} · ${m.mold_name}`)}
                {pick(tx("Machine Type"), "machineTypeId", machineTypes, (t) => t.type_name)}
                {pick(tx("Material"), "materialId", materials, (m) => `${m.material_code} · ${m.material_name}`)}
              </Box>
            </Stack>
            <Stack spacing={0.5}>
              <FieldLabel>{tx("Validity")}</FieldLabel>
              <Box sx={g("1fr 1fr")}>
                <TextField size="small" label={tx("Process")} placeholder="VD: Ép phun" value={form.process} onChange={ch("process")} />
                <TextField size="small" type="date" label={tx("Effective Date")} value={form.effectiveDate} onChange={ch("effectiveDate")} slotProps={{ inputLabel: { shrink: true } }} />
              </Box>
            </Stack>
            <TextField fullWidth multiline minRows={3} label={tx("Remark")} value={form.remark} onChange={ch("remark")} />
          </Stack>
        )}
        {tab === 1 && <ParameterItemsEditor rows={rows} onChange={setRows} />}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.25, borderTop: 1, borderColor: "divider", bgcolor: (th) => (th.palette.mode === "dark" ? "#0F172A" : "#F8FAFC") }}>
        {invalid ? <Typography variant="caption" color="error" sx={{ mr: "auto" }}>{tx("Min value must not be greater than max value.")}</Typography> : null}
        <Button onClick={submit} disabled={saving || invalid || !form.code.trim() || !form.name.trim()} sx={buttonSx("primary")} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

function CopyStandardDialog({ source, saving, onClose, onConfirm }) {
  const [code, setCode] = useState("");
  return (
    <Dialog open fullWidth maxWidth="sm" onClose={saving ? undefined : onClose} slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogHeader icon={<ContentCopyOutlinedIcon />} title={tx("Copy Standard")} subtitle={source ? `${tx("Copy from")} ${source}` : null} disabled={saving} onClose={onClose} />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <TextField fullWidth required size="small" sx={{ mt: 1 }} label={tx("New Standard Code")} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.25, borderTop: 1, borderColor: "divider", bgcolor: (th) => (th.palette.mode === "dark" ? "#0F172A" : "#F8FAFC") }}>
        <Button onClick={() => onConfirm(code)} disabled={saving || !code.trim()} sx={buttonSx("primary")}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

// Left tree: product family → product → process, with the number of standards.
function StandardTree({ families, products, rows, selection, onSelect }) {
  const [collapsed, setCollapsed] = useState(() => new Set());
  const flip = (k) => setCollapsed((old) => { const next = new Set(old); if (next.has(k)) next.delete(k); else next.add(k); return next; });
  const kidsOf = (id) => families.filter((f) => f.parentId === id);
  const productsOf = (id) => products.filter((p) => Number(p.product_family_id) === Number(id));
  const familyProductIds = (id) => [...productsOf(id).map((p) => Number(p.id)), ...kidsOf(id).flatMap((c) => familyProductIds(c.id))];
  const same = (a) => selection && a && selection.kind === a.kind && selection.id === a.id && selection.process === a.process;
  const line = (key, depth, label, count, sel, hasKids, icon, bold) => (
    <Box key={key} onClick={() => onSelect(sel)} sx={{ minHeight: 30, pl: `${depth * 13 + 3}px`, pr: 0.5, display: "flex", alignItems: "center", gap: 0.35, cursor: "pointer", borderRadius: 1,
      bgcolor: same(sel) ? "action.selected" : "transparent", "&:hover": { bgcolor: "action.hover" } }}>
      <IconButton size="small" onClick={(e) => { e.stopPropagation(); if (hasKids) flip(key); }} sx={{ width: 19, height: 19, visibility: hasKids ? "visible" : "hidden" }}>
        {collapsed.has(key) ? <ChevronRightIcon sx={{ fontSize: 13.5 }} /> : <ExpandMoreIcon sx={{ fontSize: 13.5 }} />}
      </IconButton>
      {icon}
      <Typography noWrap title={label} sx={{ flex: 1, fontSize: 11.5, fontWeight: same(sel) ? 800 : bold ? 700 : 600 }}>{label}</Typography>
      <Box sx={{ mr: 0.5, display: "flex" }}><CountBadge value={count} /></Box>
    </Box>
  );
  const renderProduct = (p, depth) => {
    const key = `p:${p.id}`;
    const productRows = rows.filter((r) => Number(r.product_id) === Number(p.id));
    const processes = [...new Set(productRows.map((r) => r.process).filter(Boolean))];
    return (
      <Box key={key}>
        {line(key, depth, p.product_name, productRows.length, { kind: "product", id: Number(p.id) }, processes.length > 0, <Inventory2OutlinedIcon sx={{ fontSize: 13, color: "text.secondary" }} />)}
        {!collapsed.has(key) && processes.map((proc) => line(`${key}:${proc}`, depth + 1, proc, productRows.filter((r) => r.process === proc).length,
          { kind: "product", id: Number(p.id), process: proc }, false, <TimelineOutlinedIcon sx={{ fontSize: 13, color: "text.secondary" }} />))}
      </Box>
    );
  };
  const renderFamily = (f, depth) => {
    const key = `f:${f.id}`;
    const ids = familyProductIds(f.id);
    const count = rows.filter((r) => ids.includes(Number(r.product_id))).length;
    const children = kidsOf(f.id);
    const prods = productsOf(f.id);
    return (
      <Box key={key}>
        {line(key, depth, f.family_name, count, { kind: "family", id: f.id }, children.length + prods.length > 0, <AccountTreeOutlinedIcon color="primary" sx={{ fontSize: 13.5 }} />, depth === 0)}
        {!collapsed.has(key) && (
          <>
            {children.map((c) => renderFamily(c, depth + 1))}
            {prods.map((p) => renderProduct(p, depth + 1))}
          </>
        )}
      </Box>
    );
  };
  const noProduct = rows.filter((r) => !r.product_id).length;
  return (
    <Box sx={{ p: 0.75, flex: 1, minHeight: 0, overflow: "auto" }}>
      <Box onClick={() => onSelect(null)} sx={{ minHeight: 27, px: 0.75, display: "flex", alignItems: "center", gap: 0.75, borderRadius: 1, cursor: "pointer", bgcolor: selection == null ? "action.selected" : "transparent", "&:hover": { bgcolor: selection == null ? "action.selected" : "action.hover" } }}>
        <CategoryOutlinedIcon color="primary" sx={{ fontSize: 13.5 }} />
        <Typography sx={{ flex: 1, fontSize: 11.5, fontWeight: 800 }}>{tx("All standards")}</Typography>
        <Box sx={{ mr: 0.5, display: "flex" }}><CountBadge value={rows.length} /></Box>
      </Box>
      {families.filter((f) => f.parentId == null).map((f) => renderFamily(f, 0))}
      {noProduct ? line("none", 0, tx("No product"), noProduct, { kind: "none" }, false, <RuleFolderOutlinedIcon sx={{ fontSize: 13, color: "text.secondary" }} />) : null}
    </Box>
  );
}

function normalFamily(f) { return { ...f, id: Number(f.id), parentId: f.parent_id == null ? null : Number(f.parent_id) }; }

export default function ProcessParameterStandard() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  const { theme } = useAppTheme();
  const dark = theme === "dark";
  const muiTheme = useMemo(() => createMaterialTheme(dark ? "dark" : "light"), [dark]);
  const { canEdit } = usePagePermission();
  const actor = getCurrentUser()?.employee_code || "SYSTEM";
  const [panelsRef, panelHeight] = useFillHeight();

  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ total_standards: 0, active: 0, inactive: 0, products: 0, processes: 0, machine_types: 0, parameter_items: 0 });
  const [molds, setMolds] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [families, setFamilies] = useState([]);
  const [machineTypes, setMachineTypes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [treeSelection, setTreeSelection] = useState(null); // null | {kind:"family"|"product"|"none", id, process}
  const [filters, setFilters] = useState({ keyword: "", product: "", machineType: "", material: "", process: "", status: "" });
  const [tab, setTab] = useState(0);
  const [dialog, setDialog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const notify = useCallback((severity, text) => setMessage({ severity, text }), []);

  const request = useCallback(async (url, options = {}) => {
    const token = getAccessToken();
    const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const detailMsg = Array.isArray(data?.detail) ? data.detail.map((d) => d.msg).join("; ") : data?.detail;
      throw new Error(detailMsg || data?.message || `HTTP ${response.status}`);
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
      setMolds(moldData?.items || (Array.isArray(moldData) ? moldData : []));
      setMachineTypes((typeData || []).filter((t) => t.category === "MACHINE" && t.is_active));
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
  }, [selectedId, tab, request, notify, detail]);

  const processes = useMemo(() => [...new Set(rows.map((r) => r.process).filter(Boolean))].sort(), [rows]);
  const familyProducts = useCallback((fid) => {
    const out = new Set();
    const walk = (id) => { products.filter((p) => Number(p.product_family_id) === Number(id)).forEach((p) => out.add(Number(p.id))); families.filter((f) => f.parentId === id).forEach((f) => walk(f.id)); };
    walk(fid);
    return out;
  }, [products, families]);

  const filtered = useMemo(() => {
    const q = filters.keyword.toLowerCase().trim();
    const famSet = treeSelection?.kind === "family" ? familyProducts(treeSelection.id) : null;
    return rows.filter((r) => {
      if (q && !`${r.standard_code} ${r.standard_name}`.toLowerCase().includes(q)) return false;
      if (filters.product && Number(r.product_id) !== Number(filters.product)) return false;
      if (filters.machineType && Number(r.machine_type_id) !== Number(filters.machineType)) return false;
      if (filters.material && Number(r.material_id) !== Number(filters.material)) return false;
      if (filters.process && r.process !== filters.process) return false;
      if (filters.status && (filters.status === "ACTIVE") !== (r.status === "ACTIVE")) return false;
      if (treeSelection?.kind === "none" && r.product_id) return false;
      if (famSet && !famSet.has(Number(r.product_id))) return false;
      if (treeSelection?.kind === "product" && Number(r.product_id) !== treeSelection.id) return false;
      if (treeSelection?.process && r.process !== treeSelection.process) return false;
      return true;
    });
  }, [rows, filters, treeSelection, familyProducts]);

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
    // eslint-disable-next-line no-unused-vars
    const { standard_code, actor: _a, ...rest } = payload;
    const result = await request(`${API}/standards/${detail.id}`, { method: "PUT", body: JSON.stringify({ ...rest, updated_by: actor, version: detail.revision.version }) });
    setDialog(null);
    setViewRevisionId(null);
    return { message: result?.message ? tx("Standard saved.") : tx("Standard saved.") };
  });
  const toggleStatus = () => runAction(() => request(`${API}/standards/${detail.id}/status`, { method: "PATCH", body: JSON.stringify({ status: detail.revision.status === "ACTIVE" ? "INACTIVE" : "ACTIVE", actor }) }));
  const copyStandard = (newCode) => runAction(async () => {
    const result = await request(`${API}/standards/${detail.id}/copy`, { method: "POST", body: JSON.stringify({ new_standard_code: newCode, created_by: actor }) });
    setDialog(null); setSelectedId(result.id);
    return { message: tx("Standard copied.") };
  });
  const deleteStandard = async () => {
    if (!window.confirm(tx("Are you sure you want to delete this item?"))) return;
    setSaving(true);
    try { await request(`${API}/standards/${detail.id}`, { method: "DELETE" }); setSelectedId(null); setDetail(null); await load(); notify("success", tx("Data deleted.")); }
    catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };

  const cols = useMemo(() => [
    { headerName: tx("Standard Code"), field: "standard_code", width: 130, pinned: "left" },
    { headerName: tx("Standard Name"), field: "standard_name", minWidth: 180, flex: 1.5 },
    { headerName: tx("Product"), field: "product_name", minWidth: 140, flex: 1, valueFormatter: (p) => p.value || tx("Any") },
    { headerName: tx("Mold"), field: "mold_name", minWidth: 140, flex: 1, valueFormatter: (p) => p.value || tx("Any") },
    { headerName: tx("Machine Type"), field: "type_name", minWidth: 120, flex: 0.8, valueFormatter: (p) => p.value || tx("Any") },
    { headerName: tx("Material"), field: "material_name", minWidth: 120, flex: 0.8, valueFormatter: (p) => p.value || tx("Any") },
    { headerName: tx("Status"), field: "status", minWidth: 115, flex: 0.7, cellRenderer: (p) => <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}><WorkflowPill value={p.value} /></Box> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [language]);

  const selected = detail;
  const rev = selected?.revision;
  const currentRevision = selected?.revisions?.find((r) => r.status === "ACTIVE") || selected?.revisions?.[0];
  const isCurrent = Boolean(rev && currentRevision && rev.id === currentRevision.id);
  const isActive = rev?.status === "ACTIVE";

  const kpis = [
    { label: tx("Total Standards"), value: stats.total_standards, note: `${stats.parameter_items} ${tx("parameter items")}`, icon: RuleFolderOutlinedIcon, tone: "primary" },
    { label: tx("Active Standards"), value: stats.active, note: percent(stats.active), icon: CheckCircleOutlineIcon, tone: "success" },
    { label: tx("Products"), value: stats.products, note: tx("Products with a standard"), icon: Inventory2OutlinedIcon, tone: "accent" },
    { label: tx("Machine Types"), value: stats.machine_types, note: tx("Machine types with a standard"), icon: PrecisionManufacturingOutlinedIcon, tone: "warning" },
    { label: tx("Processes"), value: stats.processes, note: tx("Distinct processes"), icon: TimelineOutlinedIcon, tone: "info" },
    { label: tx("Inactive Standards"), value: stats.inactive, note: tx("Not used by machines"), icon: BlockOutlinedIcon, tone: "danger" },
  ];

  const people = (name, code) => (code ? person(name, code) : EMPTY);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box sx={dark ? { "& .vcc-ag-grid": { "--ag-background-color": "#111827", "--ag-header-background-color": "#182235", "--ag-foreground-color": "#D0D5DD", "--ag-border-color": "#344054" } } : {}}>
        <PageMeta title={`${tx("Process Parameter Standard")} | VCC Plastics`} description={tx("Manage standard process parameters for machines, molds, materials and products")} />
        <PageBreadcrumb pageTitle={tx("Process Parameter Standard")} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr auto" }, gap: 1.5, alignItems: "center", mb: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{tx("Process Parameter Standard")}</Typography>
            <Typography variant="body2" color="text.secondary">{tx("Manage standard process parameters for machines, molds, materials and products")}</Typography>
          </Box>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2, justifyContent: "flex-end" }}>
            <Button variant="contained" disabled={!canEdit} startIcon={<AddIcon />} onClick={() => setDialog({ type: "create" })} sx={buttonSx("primary", { height: 29 })}>{tx("Add New Standard")}</Button>
          </Stack>
        </Box>

        <KpiCardGroup>
          {kpis.map((k) => { const Icon = k.icon; return <KpiCard key={k.label} label={k.label} value={k.value} note={k.note} icon={<Icon />} tone={k.tone} />; })}
        </KpiCardGroup>

        <Paper variant="outlined" sx={{ my: 1.5, p: 1.5, borderRadius: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(220px,1.4fr) repeat(5,minmax(130px,1fr)) auto" }, gap: 1 }}>
            <TextField size="small" placeholder={tx("Search by standard code or name...")} value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
            {[
              ["product", tx("Product"), tx("All Products"), products.map((p) => [p.id, p.product_code])],
              ["machineType", tx("Machine Type"), tx("All Machine Types"), machineTypes.map((t) => [t.id, t.type_name])],
              ["material", tx("Material"), tx("All Materials"), materials.map((m) => [m.id, m.material_code])],
              ["process", tx("Process"), tx("All Processes"), processes.map((p) => [p, p])],
              ["status", tx("Status"), tx("All Status"), [["ACTIVE", statusText("ACTIVE")], ["INACTIVE", statusText("OBSOLETE")]]],
            ].map(([key, label, all, options]) => (
              <FormControl key={key} size="small">
                <InputLabel shrink>{label}</InputLabel>
                <Select displayEmpty notched label={label} value={filters[key]} onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}>
                  <MenuItem value="">{all}</MenuItem>
                  {options.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                </Select>
              </FormControl>
            ))}
            <Button startIcon={<FilterListIcon />} onClick={() => { setFilters({ keyword: "", product: "", machineType: "", material: "", process: "", status: "" }); setTreeSelection(null); }}
              sx={buttonSx("cancel", { minHeight: 29, whiteSpace: "nowrap" })}>{tx("Clear")}</Button>
          </Box>
        </Paper>

        <Box ref={panelsRef} sx={masterGridSx}>
          <Paper sx={{ ...panelSx, height: panelHeight, display: "flex", flexDirection: "column" }}>
            <PanelHeader title={tx("Standard Hierarchy")} icon={<AccountTreeOutlinedIcon color="primary" fontSize="small" />} />
            <StandardTree families={families} products={products} rows={rows} selection={treeSelection} onSelect={setTreeSelection} />
          </Paper>

          <Paper sx={{ ...panelSx, height: panelHeight, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <PanelHeader title={`${tx("Standard List")} (${filtered.length})`} icon={<RuleFolderOutlinedIcon color="primary" fontSize="small" />} />
            <Box sx={{ p: 0.75, flex: 1, minHeight: 0 }}>
              <AgGridTable rowData={filtered} columnDefs={cols} loading={loading} height="100%" rowSelection="single"
                getRowId={(p) => String(p.data.id)} onRowClicked={(e) => setSelectedId(e.data.id)} />
            </Box>
          </Paper>

          <Paper sx={{ ...panelSx, height: panelHeight, display: "flex", flexDirection: "column" }}>
            <PanelHeader title={tx("Standard Detail")} icon={<VisibilityOutlinedIcon color="primary" fontSize="small" />} />
            {selected && rev ? (
              <>
                <Box sx={{ p: 1.5, flexShrink: 0 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr) auto", columnGap: 1.25, alignItems: "center" }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", color: "#FFF", bgcolor: STATUS_COLORS[rev.status] || "#F04438" }}><RuleFolderOutlinedIcon sx={{ fontSize: 18 }} /></Box>
                    <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0.25 }}>
                      <Typography noWrap title={rev.standard_name} sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>{rev.standard_name}</Typography>
                      <Typography noWrap color="text.secondary" sx={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2 }}>{selected.standard_code} · Rev {rev.revision_no}</Typography>
                    </Box>
                    <WorkflowPill value={rev.status} />
                  </Box>
                </Box>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth"
                  sx={{ minHeight: 27, borderTop: 1, borderBottom: 1, borderColor: "divider", "& .MuiTab-root": { minHeight: 27, py: 0, px: 0.5, fontSize: 11, fontWeight: 700, textTransform: "none" } }}>
                  <Tab label={tx("Information")} /><Tab label={`${tx("Parameter Items")} (${(selected.parameters || []).length})`} /><Tab label={tx("History")} />
                </Tabs>
                <Box sx={{ p: 1.5, flex: 1, minHeight: 0, overflow: "auto" }}>
                  {tab === 0 && (
                    <Stack spacing={1.5}>
                      <DetailSection title={tx("Scope")}>
                        <DetailRow label={tx("Product")}>{rev.product_name ? `${rev.product_code} · ${rev.product_name}` : tx("Any")}</DetailRow>
                        <DetailRow label={tx("Mold")}>{rev.mold_name ? `${rev.mold_code} · ${rev.mold_name}` : tx("Any")}</DetailRow>
                        <DetailRow label={tx("Machine Type")}>{rev.type_name || tx("Any")}</DetailRow>
                        <DetailRow label={tx("Material")}>{rev.material_name ? `${rev.material_code} · ${rev.material_name}` : tx("Any")}</DetailRow>
                        <DetailRow label={tx("Process")}>{rev.process || EMPTY}</DetailRow>
                        <DetailRow label={tx("Effective Date")}>{dayText(rev.effective_date)}</DetailRow>
                        <DetailRow label={tx("Remark")} last>{rev.remark || EMPTY}</DetailRow>
                      </DetailSection>
                      <DetailSection title={tx("Record")}>
                        <DetailRow label={tx("Created By")}>{people(rev.created_by_name, rev.created_by_code || rev.created_by)}</DetailRow>
                        <DetailRow label={tx("Created Date")}>{dateText(rev.created_at)}</DetailRow>
                        <DetailRow label={tx("Updated By")}>{people(rev.updated_by_name, rev.updated_by_code || rev.updated_by)}</DetailRow>
                        <DetailRow label={tx("Last Modified")} last>{dateText(rev.updated_at)}</DetailRow>
                      </DetailSection>
                    </Stack>
                  )}
                  {tab === 1 && ((selected.parameters || []).length ? (
                    <DetailSection title={tx("Min / Target / Max")}>
                      {selected.parameters.map((p, idx, arr) => (
                        <DetailRow key={p.id} label={p.parameter_name} last={idx === arr.length - 1}>
                          {`${numText(p.min_value)} / ${numText(p.target_value)} / ${numText(p.max_value)}${p.unit ? ` ${p.unit}` : ""}`}
                        </DetailRow>
                      ))}
                    </DetailSection>
                  ) : <Alert severity="info" sx={{ borderRadius: 2 }}>{tx("No parameters yet.")}</Alert>)}
                  {tab === 2 && (
                    <Stack spacing={1.5}>
                      <DetailSection title={tx("All Revisions")}>
                        {(selected.revisions || []).map((r, idx, arr) => (
                          <Box key={r.id} onClick={() => setViewRevisionId(r.id)} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, py: 0.8, mx: -1.25, px: 1.25, cursor: "pointer",
                            borderBottom: idx === arr.length - 1 ? 0 : 1, borderColor: "divider", bgcolor: rev.id === r.id ? "action.selected" : "transparent", "&:hover": { bgcolor: "action.hover" } }}>
                            <Typography variant="caption" sx={{ fontWeight: rev.id === r.id ? 800 : 600 }}>Rev {r.revision_no}</Typography>
                            <WorkflowPill value={r.status} />
                          </Box>
                        ))}
                      </DetailSection>
                      <DetailSection title={tx("Audit Log")}>
                        {auditLog.length ? auditLog.map((a, idx) => (
                          <Box key={a.id} sx={{ py: 0.9, borderBottom: idx === auditLog.length - 1 ? 0 : 1, borderColor: "divider" }}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 800 }}>{tx(`ACTION_${a.action}`) === `ACTION_${a.action}` ? a.action : tx(`ACTION_${a.action}`)}</Typography>
                              {a.to_status ? <WorkflowPill value={a.to_status} /> : null}
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{people(a.actor_name, a.actor_code || a.actor)} · {dateText(a.acted_at)}</Typography>
                            {a.remark ? <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{a.remark}</Typography> : null}
                          </Box>
                        )) : <Typography variant="caption" color="text.secondary" sx={{ display: "block", py: 0.9 }}>{EMPTY}</Typography>}
                      </DetailSection>
                    </Stack>
                  )}
                </Box>
                <Divider />
                <Stack direction="row" sx={{ p: 1.5, justifyContent: "center", gap: 1.5, flexShrink: 0, flexWrap: "wrap" }}>
                  <ActionIcon title={isCurrent ? tx("Edit") : tx("Old revision, view only")} icon={<EditOutlinedIcon fontSize="small" />} disabled={!canEdit || !isCurrent} onClick={() => setDialog({ type: "edit" })} />
                  <ActionIcon title={isActive ? tx("Deactivate") : tx("Activate")} icon={isActive ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
                    color={isActive ? "warning" : "success"} disabled={!canEdit || saving || !isCurrent} onClick={toggleStatus} />
                  <ActionIcon title={tx("Copy Standard")} icon={<ContentCopyOutlinedIcon fontSize="small" />} disabled={!canEdit} onClick={() => setDialog({ type: "copy" })} />
                  <ActionIcon title={tx("Delete")} icon={<DeleteOutlineIcon fontSize="small" />} color="error" disabled={!canEdit || saving} onClick={deleteStandard} />
                </Stack>
              </>
            ) : (
              <Box sx={{ flex: 1, display: "grid", placeItems: "center", p: 2 }}><Typography variant="body2" color="text.secondary">{tx("Select a standard to view details.")}</Typography></Box>
            )}
          </Paper>
        </Box>

        {dialog?.type === "create" && (
          <StandardForm mode="create" standard={null} revision={null} parameters={[]} products={products} molds={molds} machineTypes={machineTypes} materials={materials} actor={actor} saving={saving} onClose={() => setDialog(null)} onSave={createStandard} />
        )}
        {dialog?.type === "edit" && selected && (
          <StandardForm mode="edit" standard={selected} revision={rev} parameters={selected.parameters} products={products} molds={molds} machineTypes={machineTypes} materials={materials} actor={actor} saving={saving} onClose={() => setDialog(null)} onSave={saveRevisionEdit} />
        )}
        {dialog?.type === "copy" && (
          <CopyStandardDialog source={selected?.standard_code} saving={saving} onClose={() => setDialog(null)} onConfirm={copyStandard} />
        )}

        <Snackbar open={Boolean(message)} autoHideDuration={4500} onClose={() => setMessage(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          {message ? <Alert severity={message.severity} onClose={() => setMessage(null)}>{message.text}</Alert> : undefined}
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}
