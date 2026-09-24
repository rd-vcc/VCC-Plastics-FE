import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Collapse, Dialog, DialogActions,
  DialogContent, Divider, FormControl, IconButton, InputAdornment,
  InputLabel, LinearProgress, MenuItem, Paper, Select, Snackbar, Stack, Tab,
  Tabs, TextField, ThemeProvider as MuiThemeProvider, Tooltip, Typography, createTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FactoryOutlinedIcon from "@mui/icons-material/Factory";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircle";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircle";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
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

const BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const API = `${BASE}/api/equipment-master`;
const FACTORY_API = `${BASE}/api/factory-structure`;
const EMPTY = "—";
const OPS = ["UNKNOWN", "RUNNING", "IDLE", "DOWN", "MAINTENANCE", "OFFLINE"];
const ASSETS = ["DRAFT", "ACTIVE", "INACTIVE", "RETIRED", "SCRAPPED"];
const cardSx = { border: "1px solid", borderColor: "divider", borderRadius: 2, boxShadow: "0 1px 3px rgba(15,23,42,.06)", overflow: "hidden" };

import { setActiveLanguage, statusText, tx } from "./locales";

function btn(type, extra = {}) {
  const s = buttonSystem[type] || buttonSystem.edit || { base: {} };
  return {
    ...(s.base || {}),
    ...(s.hover ? { "&:hover": s.hover } : {}),
    ...(s.active ? { "&:active": s.active } : {}),
    ...extra,
  };
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
            // Tailwind's preflight resets border-width globally, which can
            // strip MUI's default notched-outline border on this page — so
            // it's re-asserted explicitly here.
            "& .MuiOutlinedInput-notchedOutline": {
              borderWidth: "1px !important",
              borderStyle: "solid !important",
              borderColor: `${dark ? "#3B4759" : "#CBD3DF"} !important`,
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: `${dark ? "#5B6B84" : "#98A2B3"} !important`,
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderWidth: "2px !important",
              borderColor: "#005BAB !important",
            },
            "&.Mui-error .MuiOutlinedInput-notchedOutline": {
              borderColor: "#EE1B1B !important",
            },
          },
        },
      },
    },
  });
}

function DialogHeader({ icon, title, subtitle, onClose, disabled, tone = "primary" }) {
  const toneColor = tone === "danger" ? "#EE1B1B" : "#005BAB";
  return (
    <Box
      sx={{
        px: 3,
        pt: 2.5,
        pb: 2,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: (theme) =>
          theme.palette.mode === "dark"
            ? tone === "danger"
              ? "rgba(238,27,27,0.10)"
              : "rgba(0,91,171,0.14)"
            : tone === "danger"
              ? "#FFF3F3"
              : "#F1F7FF",
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? tone === "danger"
                ? "#4C1D1D"
                : "#173A63"
              : tone === "danger"
                ? "#FDECEC"
                : "#EEF4FF",
          color: toneColor,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" fontWeight={700} noWrap>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      <IconButton size="small" disabled={disabled} onClick={onClose} sx={{ mr: -0.5 }}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
function Head({ icon, title, action }) { return <Box sx={{ minHeight: 34, px: 1.25, bgcolor: (t) => t.palette.mode === "dark" ? "#182235" : "#EAF2FF", borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}><Stack direction="row" spacing={0.7} alignItems="center">{icon}<Typography variant="subtitle2" fontWeight={800}>{title}</Typography></Stack>{action}</Box>; }
function Status({ value }) { const colors = { RUNNING: "success", ACTIVE: "success", IDLE: "warning", MAINTENANCE: "secondary", DOWN: "error", DRAFT: "info", SCRAPPED: "error" }; return <Chip size="small" variant="outlined" color={colors[value] || "default"} label={statusText(value || "UNKNOWN")} sx={{ height: 21, fontSize: 10, fontWeight: 800 }} />; }
function normalNode(n) { return { ...n, id: Number(n.id), parentId: n.parent_id == null ? null : Number(n.parent_id) }; }
function pathOf(id, nodes) { const names = [], seen = new Set(); let n = nodes.find((x) => x.id === Number(id)); while (n && !seen.has(n.id)) { seen.add(n.id); names.unshift(n.name); n = nodes.find((x) => x.id === n.parentId); } return names.join(" / ") || EMPTY; }

function TreeNode({ node, nodes, rows, selected, expanded, onSelect, onToggle, depth = 0 }) {
  const children = nodes.filter((x) => x.parentId === node.id), open = expanded.includes(node.id);
  const count = rows.filter((x) => Number(x.factory_node_id) === node.id).length;
  return <Box><Box onClick={() => onSelect(node.id)} sx={{ minHeight: 30, pl: `${depth * 13 + 2}px`, display: "flex", alignItems: "center", gap: .4, borderRadius: 1, cursor: "pointer", bgcolor: selected === node.id ? "action.selected" : "transparent", "&:hover": { bgcolor: "action.hover" } }}><IconButton size="small" onClick={(e) => { e.stopPropagation(); if (children.length) onToggle(node.id); }} sx={{ width: 20, height: 20 }}>{children.length ? open ? <ExpandMoreIcon sx={{ fontSize: 16 }} /> : <ChevronRightIcon sx={{ fontSize: 16 }} /> : <Box width={16} />}</IconButton><FactoryOutlinedIcon color="primary" sx={{ fontSize: 15 }} /><Typography noWrap sx={{ flex: 1, fontSize: 11.5, fontWeight: selected === node.id ? 800 : 600 }}>{node.name}</Typography><Chip label={count} size="small" variant="outlined" color="primary" sx={{ height: 19, mr: .5, "& .MuiChip-label": { px: .5, fontSize: 10 } }} /></Box>{children.length > 0 && <Collapse in={open}>{children.map((child) => <TreeNode key={child.id} node={child} nodes={nodes} rows={rows} selected={selected} expanded={expanded} onSelect={onSelect} onToggle={onToggle} depth={depth + 1} />)}</Collapse>}</Box>;
}

function EquipmentForm({ item, types, groups, nodes, actor, saving, onClose, onSave }) {
  const [f, setF] = useState(item ? { code: item.equipment_code, name: item.equipment_name, type: item.equipment_type_id, group: item.equipment_group_id ?? "", node: item.factory_node_id, maker: item.manufacturer || "", model: item.model || "", serial: item.serial_number || "", year: item.manufacturing_year || "", install: item.installation_date?.slice(0, 10) || "", commission: item.commissioning_date?.slice(0, 10) || "", image: item.image_url || "", asset: item.asset_status, op: item.operational_status, note: item.description || "", version: item.version } : { code: "", name: "", type: "", group: "", node: "", maker: "", model: "", serial: "", year: "", install: "", commission: "", image: "", asset: "DRAFT", op: "UNKNOWN", note: "", version: 1 });
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const submit = () => onSave({ equipment_code: f.code.trim().toUpperCase(), equipment_name: f.name.trim(), equipment_type_id: Number(f.type), equipment_group_id: f.group === "" ? null : Number(f.group), factory_node_id: Number(f.node), manufacturer: f.maker.trim() || null, model: f.model.trim() || null, serial_number: f.serial.trim() || null, manufacturing_year: f.year === "" ? null : Number(f.year), installation_date: f.install || null, commissioning_date: f.commission || null, image_url: f.image.trim() || null, asset_status: f.asset, operational_status: f.op, description: f.note.trim() || null, ...(item ? { version: Number(f.version), updated_by: actor } : { created_by: actor }) });
  const groupOptions = groups.filter((g) => !g.equipment_type_id || Number(g.equipment_type_id) === Number(f.type));
  return <Dialog open fullWidth maxWidth="md" onClose={saving ? undefined : onClose} PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", boxShadow: (theme) => theme.palette.mode === "dark" ? "0 24px 60px rgba(0,0,0,.55)" : "0 24px 60px rgba(15,23,42,.18)" } }}><DialogHeader icon={<PrecisionManufacturingOutlinedIcon />} title={tx(item ? "Edit Machine / Equipment" : "Add New Machine / Equipment")} disabled={saving} onClose={onClose} /><DialogContent><Stack spacing={1.7} sx={{ pt: 1 }}><Stack direction={{ xs: "column", md: "row" }} spacing={1.5}><TextField required fullWidth size="small" disabled={Boolean(item)} label={tx("Equipment Code")} value={f.code} onChange={ch("code")} /><TextField required fullWidth size="small" label={tx("Equipment Name")} value={f.name} onChange={ch("name")} /><FormControl required fullWidth size="small"><InputLabel>{tx("Equipment Type")}</InputLabel><Select label={tx("Equipment Type")} value={f.type} onChange={(e) => setF((o) => ({ ...o, type: e.target.value, group: "" }))}>{types.filter((x) => x.is_active).map((x) => <MenuItem key={x.id} value={x.id}>{x.type_name}</MenuItem>)}</Select></FormControl></Stack><Stack direction={{ xs: "column", md: "row" }} spacing={1.5}><FormControl fullWidth size="small"><InputLabel>{tx("Machine Group")}</InputLabel><Select label={tx("Machine Group")} value={f.group} onChange={ch("group")}><MenuItem value=""><em>{tx("Not set")}</em></MenuItem>{groupOptions.filter((x) => x.is_active).map((x) => <MenuItem key={x.id} value={x.id}>{x.group_name}</MenuItem>)}</Select></FormControl><FormControl required fullWidth size="small"><InputLabel>{tx("Factory Location")}</InputLabel><Select label={tx("Factory Location")} value={f.node} onChange={ch("node")}>{nodes.filter((x) => x.status === "ACTIVE").map((x) => <MenuItem key={x.id} value={x.id}>{pathOf(x.id, nodes)}</MenuItem>)}</Select></FormControl></Stack><Divider><Chip size="small" label={tx("Technical Information")} /></Divider><Stack direction={{ xs: "column", md: "row" }} spacing={1.5}><TextField fullWidth size="small" label={tx("Manufacturer")} value={f.maker} onChange={ch("maker")} /><TextField fullWidth size="small" label={tx("Model")} value={f.model} onChange={ch("model")} /><TextField fullWidth size="small" label={tx("Serial Number")} value={f.serial} onChange={ch("serial")} /><TextField fullWidth size="small" type="number" label={tx("Manufacturing Year")} value={f.year} onChange={ch("year")} /></Stack><Stack direction={{ xs: "column", md: "row" }} spacing={1.5}><TextField fullWidth size="small" type="date" label={tx("Installation Date")} value={f.install} onChange={ch("install")} InputLabelProps={{ shrink: true }} /><TextField fullWidth size="small" type="date" label={tx("Commissioning Date")} value={f.commission} onChange={ch("commission")} InputLabelProps={{ shrink: true }} /></Stack><ImageUploadField value={f.image} category="machine" label={tx("Image")} disabled={saving} onChange={(v) => setF((o) => ({ ...o, image: v || "" }))} /><Stack direction={{ xs: "column", md: "row" }} spacing={1.5}><FormControl fullWidth size="small"><InputLabel>{tx("Asset Status")}</InputLabel><Select label={tx("Asset Status")} value={f.asset} onChange={ch("asset")}>{ASSETS.map((x) => <MenuItem key={x} value={x}>{statusText(x)}</MenuItem>)}</Select></FormControl><FormControl fullWidth size="small"><InputLabel>{tx("Operational Status")}</InputLabel><Select label={tx("Operational Status")} value={f.op} onChange={ch("op")}>{OPS.map((x) => <MenuItem key={x} value={x}>{statusText(x)}</MenuItem>)}</Select></FormControl></Stack><TextField fullWidth multiline minRows={2} label={tx("Description")} value={f.note} onChange={ch("note")} /></Stack></DialogContent><DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={onClose} sx={btn("cancel")}>{tx("Cancel")}</Button><Button onClick={submit} disabled={saving || !f.code.trim() || !f.name.trim() || !f.type || !f.node} sx={btn("primary")} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>{tx("Save")}</Button></DialogActions></Dialog>;
}

function SpecForm({ equipment, definitions, actor, request, saving, onClose, onDone }) {
  const defs = definitions.filter((d) => Number(d.equipment_type_id) === Number(equipment.equipment_type_id) && d.is_active);
  const current = Object.fromEntries((equipment.specifications || []).map((x) => [x.spec_definition_id, x]));
  const getValue = (d) => { const r = current[d.id] || {}; return r.value_text ?? r.value_integer ?? r.value_decimal ?? r.value_boolean ?? r.value_date ?? ""; };
  const [values, setValues] = useState(Object.fromEntries(defs.map((d) => [d.id, getValue(d)])));
  const save = async () => { for (const d of defs) { const value = values[d.id]; if (value === "" || value == null) continue; const key = { TEXT: "value_text", INTEGER: "value_integer", DECIMAL: "value_decimal", BOOLEAN: "value_boolean", DATE: "value_date" }[d.data_type]; await request(`${API}/equipment/${equipment.id}/spec-values/${d.id}`, { method: "PUT", body: JSON.stringify({ spec_definition_id: d.id, [key]: ["INTEGER", "DECIMAL"].includes(d.data_type) ? Number(value) : value, updated_by: actor }) }); } await onDone(); };
  return <Dialog open fullWidth maxWidth="sm" onClose={saving ? undefined : onClose} PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", boxShadow: (theme) => theme.palette.mode === "dark" ? "0 24px 60px rgba(0,0,0,.55)" : "0 24px 60px rgba(15,23,42,.18)" } }}><DialogHeader icon={<SettingsOutlinedIcon />} title={`${tx("Specifications")} · ${equipment.equipment_code}`} disabled={saving} onClose={onClose} /><DialogContent><Stack spacing={1.5} sx={{ pt: 1 }}>{defs.length ? defs.map((d) => d.data_type === "BOOLEAN" ? <FormControl key={d.id} fullWidth size="small"><InputLabel>{d.spec_name}</InputLabel><Select label={d.spec_name} value={values[d.id]} onChange={(e) => setValues((o) => ({ ...o, [d.id]: e.target.value }))}><MenuItem value=""><em>{tx("Not set")}</em></MenuItem><MenuItem value={true}>{tx("Yes")}</MenuItem><MenuItem value={false}>{tx("No")}</MenuItem></Select></FormControl> : <TextField key={d.id} required={Boolean(d.is_required)} fullWidth size="small" type={d.data_type === "DATE" ? "date" : ["INTEGER", "DECIMAL"].includes(d.data_type) ? "number" : "text"} label={`${d.spec_name}${d.unit ? ` (${d.unit})` : ""}`} value={values[d.id]} onChange={(e) => setValues((o) => ({ ...o, [d.id]: e.target.value }))} InputLabelProps={d.data_type === "DATE" ? { shrink: true } : undefined} />) : <Alert severity="info">{tx("No specifications are configured for this equipment type.")}</Alert>}</Stack></DialogContent><DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={onClose} sx={btn("cancel")}>{tx("Cancel")}</Button><Button onClick={save} disabled={saving || !defs.length} sx={btn("primary")}>{tx("Save Specifications")}</Button></DialogActions></Dialog>;
}

function MasterManager({ kind, rows, types, actor, canEdit, request, onClose, onRefresh, onKindChange, notify }) {
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const empty = kind === "type"
    ? { code: "", name: "", category: "MACHINE", active: true, sort: 0, description: "" }
    : kind === "group"
      ? { code: "", name: "", typeId: "", active: true, sort: 0, description: "" }
      : { code: "", name: "", typeId: "", dataType: "TEXT", unit: "", required: false, active: true, sort: 0, description: "" };
  const [form, setForm] = useState(empty);
  const title = tx(kind === "type" ? "Equipment Types" : kind === "group" ? "Machine Groups" : "Specification Definitions");
  const segment = kind === "type" ? "types" : kind === "group" ? "groups" : "spec-definitions";
  const codeField = kind === "type" ? "type_code" : kind === "group" ? "group_code" : "spec_code";
  const nameField = kind === "type" ? "type_name" : kind === "group" ? "group_name" : "spec_name";
  const beginAdd = () => { setEditing({ isNew: true }); setForm(empty); };
  const beginEdit = (item) => {
    setEditing(item);
    setForm(kind === "type"
      ? { code: item.type_code, name: item.type_name, category: item.category, active: Boolean(item.is_active), sort: item.sort_order || 0, description: item.description || "" }
      : kind === "group"
        ? { code: item.group_code, name: item.group_name, typeId: item.equipment_type_id ?? "", active: Boolean(item.is_active), sort: item.sort_order || 0, description: item.description || "" }
        : { code: item.spec_code, name: item.spec_name, typeId: item.equipment_type_id, dataType: item.data_type, unit: item.unit || "", required: Boolean(item.is_required), active: Boolean(item.is_active), sort: item.sort_order || 0, description: item.description || "" });
  };
  const change = (key) => (event) => setForm((old) => ({ ...old, [key]: event.target.value }));
  const save = async () => {
    setSaving(true);
    try {
      const isNew = editing?.isNew;
      let payload;
      if (kind === "type") payload = { ...(isNew ? { type_code: form.code.trim().toUpperCase(), created_by: actor } : { updated_by: actor }), type_name: form.name.trim(), category: form.category, description: form.description.trim() || null, is_active: Boolean(form.active), sort_order: Number(form.sort) };
      else if (kind === "group") payload = { ...(isNew ? { group_code: form.code.trim().toUpperCase(), created_by: actor } : { updated_by: actor }), group_name: form.name.trim(), equipment_type_id: form.typeId === "" ? null : Number(form.typeId), description: form.description.trim() || null, is_active: Boolean(form.active), sort_order: Number(form.sort) };
      else payload = { ...(isNew ? { equipment_type_id: Number(form.typeId), spec_code: form.code.trim().toUpperCase(), created_by: actor } : { updated_by: actor }), spec_name: form.name.trim(), data_type: form.dataType, unit: form.unit.trim() || null, is_required: Boolean(form.required), is_active: Boolean(form.active), sort_order: Number(form.sort), description: form.description.trim() || null };
      const result = await request(isNew ? `${API}/${segment}` : `${API}/${segment}/${editing.id}`, { method: isNew ? "POST" : "PUT", body: JSON.stringify(payload) });
      await onRefresh(); setEditing(null); notify("success", result.message || "Master data saved.");
    } catch (error) { notify("error", error.message); } finally { setSaving(false); }
  };
  const remove = async (item) => {
    if (!window.confirm(`Delete ${item[nameField]}? If it is in use, deactivate it instead.`)) return;
    setSaving(true);
    try { const result = await request(`${API}/${segment}/${item.id}`, { method: "DELETE" }); await onRefresh(); notify("success", result.message || "Deleted."); }
    catch (error) { notify("error", error.message); } finally { setSaving(false); }
  };
  const cols = [
    { headerName: tx("Code"), field: codeField, width: 145, pinned: "left" },
    { headerName: tx("Name"), field: nameField, minWidth: 180, flex: 1 },
    kind === "type" ? { headerName: tx("Category"), field: "category", width: 130 } : { headerName: tx("Equipment Type"), field: "type_name", minWidth: 150, valueFormatter: (p) => p.value || "All types" },
    ...(kind === "spec" ? [{ headerName: tx("Data Type"), field: "data_type", width: 105 }, { headerName: tx("Unit"), field: "unit", width: 85 }] : []),
    { headerName: tx("Status"), width: 95, cellRenderer: (p) => <Box height="100%" display="flex" alignItems="center"><Status value={p.data.is_active ? "ACTIVE" : "INACTIVE"} /></Box> },
    { headerName: tx("Actions"), width: 100, sortable: false, filter: false, cellRenderer: (p) => <Stack direction="row" alignItems="center" height="100%"><IconButton size="small" disabled={!canEdit} onClick={() => beginEdit(p.data)}><EditOutlinedIcon fontSize="small" /></IconButton><IconButton size="small" color="error" disabled={!canEdit || saving} onClick={() => remove(p.data)}><DeleteOutlineIcon fontSize="small" /></IconButton></Stack> },
  ];
  return <Dialog open fullWidth maxWidth="md" onClose={saving ? undefined : onClose} PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", boxShadow: (theme) => theme.palette.mode === "dark" ? "0 24px 60px rgba(0,0,0,.55)" : "0 24px 60px rgba(15,23,42,.18)" } }}><DialogHeader icon={<CategoryOutlinedIcon />} title={tx("Master Data Configuration")} disabled={saving} onClose={onClose} /><Tabs value={kind} onChange={(_, value) => { setEditing(null); onKindChange(value); }} variant="fullWidth" sx={{ minHeight: 42, borderBottom: 1, borderColor: "divider", "& .MuiTab-root": { minHeight: 42, fontWeight: 700 } }}><Tab value="type" label={tx("Equipment Types")} /><Tab value="group" label={tx("Machine Groups")} /><Tab value="spec" label={tx("Specification Definitions")} /></Tabs><DialogContent sx={{ p: 1.5 }}>{editing ? <Stack spacing={1.5} sx={{ pt: .5 }}><Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}><TextField fullWidth required size="small" label={tx("Code")} disabled={!editing.isNew} value={form.code} onChange={change("code")} /><TextField fullWidth required size="small" label={tx("Name")} value={form.name} onChange={change("name")} /></Stack>{kind === "type" && <FormControl fullWidth size="small"><InputLabel>{tx("Category")}</InputLabel><Select label={tx("Category")} value={form.category} onChange={change("category")}>{["MACHINE", "ROBOT", "AUXILIARY", "UTILITY", "OTHER"].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select></FormControl>}{kind !== "type" && <FormControl fullWidth required={kind === "spec"} size="small"><InputLabel>{tx("Equipment Type")}</InputLabel><Select label={tx("Equipment Type")} value={form.typeId} disabled={kind === "spec" && !editing.isNew} onChange={change("typeId")}><MenuItem value=""><em>{tx(kind === "group" ? "All equipment types" : "Select equipment type")}</em></MenuItem>{types.map((type) => <MenuItem key={type.id} value={type.id}>{type.type_name}</MenuItem>)}</Select></FormControl>}{kind === "spec" && <Stack direction="row" spacing={1.5}><FormControl fullWidth size="small"><InputLabel>{tx("Data Type")}</InputLabel><Select label={tx("Data Type")} value={form.dataType} disabled={!editing.isNew} onChange={change("dataType")}>{["TEXT", "INTEGER", "DECIMAL", "BOOLEAN", "DATE"].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select></FormControl><TextField fullWidth size="small" label={tx("Unit")} value={form.unit} onChange={change("unit")} /><FormControl fullWidth size="small"><InputLabel>{tx("Required")}</InputLabel><Select label={tx("Required")} value={form.required} onChange={change("required")}><MenuItem value={true}>{tx("Yes")}</MenuItem><MenuItem value={false}>{tx("No")}</MenuItem></Select></FormControl></Stack>}<Stack direction="row" spacing={1.5}><TextField fullWidth size="small" type="number" label={tx("Sort Order")} value={form.sort} onChange={change("sort")} /><FormControl fullWidth size="small"><InputLabel>{tx("Status")}</InputLabel><Select label={tx("Status")} value={form.active} onChange={change("active")}><MenuItem value={true}>{statusText("ACTIVE")}</MenuItem><MenuItem value={false}>{statusText("INACTIVE")}</MenuItem></Select></FormControl></Stack><TextField fullWidth multiline minRows={2} label={tx("Description")} value={form.description} onChange={change("description")} /></Stack> : <Box sx={{ height: 430 }}><AgGridTable rowData={rows} columnDefs={cols} height="100%" pagination paginationPageSize={20} getRowId={(p) => String(p.data.id)} /></Box>}</DialogContent><DialogActions sx={{ px: 2, pb: 2 }}><Button disabled={saving} onClick={editing ? () => setEditing(null) : onClose} sx={btn("cancel")}>{tx(editing ? "Back" : "Close")}</Button>{editing ? <Button disabled={saving || !form.code.trim() || !form.name.trim() || (kind === "spec" && !form.typeId)} onClick={save} sx={btn("primary")} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>{tx("Save")}</Button> : <Button disabled={!canEdit} onClick={beginAdd} startIcon={<AddIcon />} sx={btn("primary")}>{tx("Add New")}</Button>}</DialogActions></Dialog>;
}

export default function MachineEquipmentMaster() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  const { theme } = useAppTheme(), muiTheme = useMemo(() => pageTheme(theme), [theme]);
  const { canEdit } = usePagePermission(), actor = getCurrentUser()?.employee_code || "SYSTEM";
  const [rows, setRows] = useState([]), [types, setTypes] = useState([]), [groups, setGroups] = useState([]), [definitions, setDefinitions] = useState([]), [nodes, setNodes] = useState([]);
  const [selectedId, setSelectedId] = useState(null), [detail, setDetail] = useState(null), [nodeId, setNodeId] = useState(null), [expanded, setExpanded] = useState([]);
  const [keyword, setKeyword] = useState(""), [typeFilter, setTypeFilter] = useState("all"), [groupFilter, setGroupFilter] = useState("all"), [statusFilter, setStatusFilter] = useState("all"), [tab, setTab] = useState(0);
  const [dialog, setDialog] = useState(null), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [msg, setMsg] = useState({ open: false, type: "success", text: "" });
  const notify = useCallback((type, text) => setMsg({ open: true, type, text }), []);
  const request = useCallback(async (url, options = {}) => { const token = getAccessToken(); const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } }); const data = await response.json().catch(() => null); if (!response.ok) throw new Error(data?.detail || data?.message || `HTTP ${response.status}`); return data; }, []);
  const load = useCallback(async () => { setLoading(true); try { const [r, t, g, d, n] = await Promise.all([request(`${API}/equipment?limit=2000`), request(`${API}/types`), request(`${API}/groups`), request(`${API}/spec-definitions`), request(`${FACTORY_API}/nodes`)]); const list = r?.items || [], nodeList = (Array.isArray(n) ? n : n?.items || []).map(normalNode); setRows(list); setTypes(t || []); setGroups(g || []); setDefinitions(d || []); setNodes(nodeList); setExpanded(nodeList.map((x) => x.id)); setSelectedId((old) => list.some((x) => x.id === old) ? old : list[0]?.id ?? null); } catch (e) { notify("error", e.message); } finally { setLoading(false); } }, [notify, request]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!selectedId) return setDetail(null); request(`${API}/equipment/${selectedId}`).then(setDetail).catch((e) => notify("error", e.message)); }, [selectedId, request, notify]);
  const selected = detail || rows.find((x) => x.id === selectedId), roots = nodes.filter((x) => x.parentId == null);
  const filtered = useMemo(() => { const q = keyword.toLowerCase().trim(); return rows.filter((x) => (!q || `${x.equipment_code} ${x.equipment_name} ${x.model || ""}`.toLowerCase().includes(q)) && (typeFilter === "all" || Number(x.equipment_type_id) === Number(typeFilter)) && (groupFilter === "all" || Number(x.equipment_group_id) === Number(groupFilter)) && (statusFilter === "all" || x.operational_status === statusFilter) && (!nodeId || Number(x.factory_node_id) === Number(nodeId))); }, [rows, keyword, typeFilter, groupFilter, statusFilter, nodeId]);
  const count = (s) => rows.filter((x) => x.operational_status === s).length, percent = (n) => rows.length ? `${(n / rows.length * 100).toFixed(1)}% ${tx("of total")}` : `0% ${tx("of total")}`;
  const openEdit = async (id) => { try { setDialog({ type: "equipment", item: await request(`${API}/equipment/${id}`) }); } catch (e) { notify("error", e.message); } };
  const saveEquipment = async (payload) => { setSaving(true); try { const item = dialog.item, result = await request(item ? `${API}/equipment/${item.id}` : `${API}/equipment`, { method: item ? "PUT" : "POST", body: JSON.stringify(payload) }); setDialog(null); await load(); if (result.id) setSelectedId(result.id); setDetail(null); notify("success", result.message || "Saved."); } catch (e) { notify("error", e.message); } finally { setSaving(false); } };
  const toggle = async () => { if (!selected) return; setSaving(true); try { const next = selected.operational_status === "RUNNING" ? "IDLE" : "RUNNING"; await request(`${API}/equipment/${selected.id}/status`, { method: "PATCH", body: JSON.stringify({ operational_status: next, version: selected.version, updated_by: actor }) }); await load(); setDetail(null); notify("success", `Status changed to ${next}.`); } catch (e) { notify("error", e.message); } finally { setSaving(false); } };
  const cols = useMemo(() => [{ headerName: tx("Equipment Code"), field: "equipment_code", width: 130, pinned: "left" }, { headerName: tx("Equipment Name"), field: "equipment_name", minWidth: 170, flex: 1.2 }, { headerName: tx("Equipment Type"), field: "type_name", minWidth: 150 }, { headerName: tx("Model"), field: "model", minWidth: 135, valueFormatter: (p) => p.value || EMPTY }, { headerName: tx("Factory Location"), minWidth: 180, valueGetter: (p) => pathOf(p.data.factory_node_id, nodes) }, { headerName: tx("Status"), field: "operational_status", width: 120, cellRenderer: (p) => <Box height="100%" display="flex" alignItems="center"><Status value={p.value} /></Box> }, { headerName: tx("Actions"), width: 100, sortable: false, filter: false, cellRenderer: (p) => <Stack direction="row" alignItems="center" height="100%"><IconButton size="small" onClick={() => setSelectedId(p.data.id)}><VisibilityOutlinedIcon fontSize="small" /></IconButton><IconButton size="small" disabled={!canEdit} onClick={() => openEdit(p.data.id)}><EditOutlinedIcon fontSize="small" /></IconButton></Stack> }], [nodes, canEdit, language]);
  const general = selected ? [[tx("Machine Code"), selected.equipment_code], [tx("Machine Name"), selected.equipment_name], [tx("Equipment Type"), selected.type_name], [tx("Model"), selected.model], [tx("Serial Number"), selected.serial_number], [tx("Area / Line"), pathOf(selected.factory_node_id, nodes)], [tx("Machine Group"), selected.group_name], [tx("Asset Status"), statusText(selected.asset_status)], [tx("Manufacturer"), selected.manufacturer], [tx("Install Date"), selected.installation_date]] : [];
  const distribution = types.map((t) => ({ name: t.type_name, count: rows.filter((x) => Number(x.equipment_type_id) === Number(t.id)).length })).filter((x) => x.count).sort((a, b) => b.count - a.count);
  return <MuiThemeProvider theme={muiTheme}><Box><PageMeta title="Machine & Equipment Master | VCC Plastics" description="Machine master data" /><PageBreadcrumb pageTitle={tx("Machine & Equipment Master")} /><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr auto" }, gap: 1.5, alignItems: "center", mb: 1.5 }}><Box sx={{ minWidth: 0 }}><Typography variant="h5" fontWeight={800}>{tx("Machine & Equipment Master")}</Typography><Typography variant="body2" color="text.secondary">{tx("Manage all machines and equipment in the system")}</Typography></Box><Stack direction="row" sx={{ flexWrap: "wrap", gap: 2, justifyContent: "flex-end" }}><Button disabled={!canEdit} startIcon={<AddIcon />} onClick={() => setDialog({ type: "equipment", item: null })} sx={btn("primary")}>{tx("Add New Machine")}</Button><Button startIcon={<SettingsOutlinedIcon />} onClick={() => setDialog({ type: "manager", kind: "type" })} sx={btn("edit")}>{tx("Settings")}</Button></Stack></Box>
    <KpiCardGroup><KpiCard label={tx("Total Machines")} value={rows.length} note={tx("All machines")} icon={<PrecisionManufacturingOutlinedIcon />} tone="primary" /><KpiCard label={tx("Running")} value={count("RUNNING")} note={percent(count("RUNNING"))} icon={<PlayCircleOutlineIcon />} tone="success" /><KpiCard label={tx("Idle")} value={count("IDLE")} note={percent(count("IDLE"))} icon={<PauseCircleOutlineIcon />} tone="warning" /><KpiCard label={tx("Maintenance")} value={count("MAINTENANCE")} note={percent(count("MAINTENANCE"))} icon={<BuildOutlinedIcon />} tone="accent" /><KpiCard label={tx("Equipment Types")} value={types.filter((x) => x.is_active).length} note={tx("Active types")} icon={<CategoryOutlinedIcon />} tone="info" /><KpiCard label={tx("Down")} value={count("DOWN")} note={percent(count("DOWN"))} icon={<WarningAmberOutlinedIcon />} tone="danger" /></KpiCardGroup>
    <Paper elevation={0} sx={{ ...cardSx, my: 1.5, p: 1 }}><Stack direction={{ xs: "column", lg: "row" }} spacing={1}><TextField size="small" placeholder={tx("Search by machine code or name...")} value={keyword} onChange={(e) => setKeyword(e.target.value)} sx={{ minWidth: 250 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} /><FormControl size="small" sx={{ minWidth: 155 }}><InputLabel>{tx("Equipment Type")}</InputLabel><Select label={tx("Equipment Type")} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><MenuItem value="all">{tx("All Types")}</MenuItem>{types.map((x) => <MenuItem key={x.id} value={x.id}>{x.type_name}</MenuItem>)}</Select></FormControl><FormControl size="small" sx={{ minWidth: 155 }}><InputLabel>{tx("Machine Status")}</InputLabel><Select label={tx("Machine Status")} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><MenuItem value="all">{tx("All Status")}</MenuItem>{OPS.map((x) => <MenuItem key={x} value={x}>{statusText(x)}</MenuItem>)}</Select></FormControl><FormControl size="small" sx={{ minWidth: 155 }}><InputLabel>{tx("Machine Group")}</InputLabel><Select label={tx("Machine Group")} value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}><MenuItem value="all">{tx("All Groups")}</MenuItem>{groups.map((x) => <MenuItem key={x.id} value={x.id}>{x.group_name}</MenuItem>)}</Select></FormControl><Button onClick={() => { setKeyword(""); setTypeFilter("all"); setStatusFilter("all"); setGroupFilter("all"); setNodeId(null); }} sx={btn("cancel")}>{tx("Clear")}</Button></Stack></Paper>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "210px minmax(0,1fr) 330px" }, gap: 1.5 }}><Paper elevation={0} sx={{ ...cardSx, height: 555, display: "flex", flexDirection: "column" }}><Head icon={<AccountTreeOutlinedIcon color="primary" fontSize="small" />} title={tx("Equipment Hierarchy")} /><Box sx={{ p: .7, overflow: "auto" }}><Box onClick={() => setNodeId(null)} sx={{ p: .75, borderRadius: 1, cursor: "pointer", bgcolor: nodeId == null ? "action.selected" : "transparent" }}><Typography fontSize={11.5} fontWeight={800}>{tx("All locations")} ({rows.length})</Typography></Box>{roots.map((r) => <TreeNode key={r.id} node={r} nodes={nodes} rows={rows} selected={nodeId} expanded={expanded} onSelect={setNodeId} onToggle={(id) => setExpanded((o) => o.includes(id) ? o.filter((x) => x !== id) : [...o, id])} />)}</Box></Paper><Paper elevation={0} sx={{ ...cardSx, height: 555, display: "flex", flexDirection: "column", minWidth: 0 }}><Head icon={<PrecisionManufacturingOutlinedIcon color="primary" fontSize="small" />} title={`${tx("Machine List")} (${filtered.length})`} /><Box sx={{ p: .75, flex: 1, minHeight: 0 }}><AgGridTable rowData={filtered} columnDefs={cols} loading={loading} pagination paginationPageSize={20} onRowClicked={(e) => setSelectedId(e.data.id)} getRowId={(p) => String(p.data.id)} height="100%" /></Box></Paper><Paper elevation={0} sx={{ ...cardSx, height: 555, display: "flex", flexDirection: "column" }}><Head icon={<VisibilityOutlinedIcon color="primary" fontSize="small" />} title={tx("Machine Detail")} />{selected ? <><Box sx={{ p: 1.5, borderBottom: 1, borderColor: "divider" }}><Stack direction="row" spacing={1.2} alignItems="center"><Box component="img" src={resolveImageUrl(selected.image_url) || "/images/product/product-01.jpg"} sx={{ width: 72, height: 54, objectFit: "contain", bgcolor: "action.hover", borderRadius: 1.5 }} /><Box minWidth={0}><Stack direction="row" alignItems="center" sx={{ gap: 0.7 }}><Typography fontWeight={800}>{selected.equipment_code}</Typography><Status value={selected.operational_status} /></Stack><Typography noWrap variant="body2" color="text.secondary">{selected.equipment_name}</Typography></Box></Stack></Box><Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ minHeight: 36, borderBottom: 1, borderColor: "divider", "& .MuiTab-root": { minHeight: 36, p: 0, fontSize: 10.5, fontWeight: 700 } }}><Tab label={tx("General")} /><Tab label={tx("Specification")} /></Tabs><Box sx={{ p: 1.5, flex: 1, overflow: "auto" }}>{tab === 0 ? <Stack spacing={.85}>{general.map(([label, value]) => <Box key={label} sx={{ display: "grid", gridTemplateColumns: "43% 57%", gap: 1 }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="caption" fontWeight={700}>{value || EMPTY}</Typography></Box>)}</Stack> : <Stack spacing={.85}>{selected.specifications?.length ? selected.specifications.map((s) => <Box key={s.spec_definition_id} sx={{ display: "grid", gridTemplateColumns: "48% 52%", gap: 1 }}><Typography variant="caption" color="text.secondary">{s.spec_name}</Typography><Typography variant="caption" fontWeight={700}>{s.value_text ?? s.value_integer ?? s.value_decimal ?? s.value_date ?? (s.value_boolean == null ? EMPTY : s.value_boolean ? tx("Yes") : tx("No"))} {s.unit || ""}</Typography></Box>) : <Typography color="text.secondary" variant="body2">{tx("No specifications.")}</Typography>}</Stack>}</Box><Divider /><Stack direction="row" sx={{ justifyContent: "center", gap: 2.5, p: 1.5 }}><Tooltip title={tx("Edit machine")}><span><IconButton disabled={!canEdit} color="primary" onClick={() => openEdit(selected.id)} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><EditOutlinedIcon /></IconButton></span></Tooltip><Tooltip title={tx("Edit specifications")}><span><IconButton disabled={!canEdit} color="secondary" onClick={() => setDialog({ type: "spec", item: selected })} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}><SettingsOutlinedIcon /></IconButton></span></Tooltip><Tooltip title={tx("Toggle Running / Idle")}><span><IconButton disabled={!canEdit || saving} color={selected.operational_status === "RUNNING" ? "warning" : "success"} onClick={toggle} sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}>{selected.operational_status === "RUNNING" ? <PauseCircleOutlineIcon /> : <PlayCircleOutlineIcon />}</IconButton></span></Tooltip></Stack></> : <Box flex={1} display="grid" sx={{ placeItems: "center" }}><Typography color="text.secondary">{tx("Select a machine.")}</Typography></Box>}</Paper></Box>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 1.5, mt: 1.5 }}><Paper elevation={0} sx={cardSx}><Head icon={<CategoryOutlinedIcon color="primary" fontSize="small" />} title={tx("Machines by Type")} /><Stack spacing={1.1} p={1.5}>{distribution.length ? distribution.slice(0, 7).map((d) => <Box key={d.name}><Stack direction="row" justifyContent="space-between"><Typography variant="caption" fontWeight={700}>{d.name}</Typography><Typography variant="caption">{d.count}</Typography></Stack><LinearProgress variant="determinate" value={rows.length ? d.count / rows.length * 100 : 0} sx={{ mt: .4, height: 7, borderRadius: 5 }} /></Box>) : <Typography color="text.secondary">{tx("No data.")}</Typography>}</Stack></Paper><Paper elevation={0} sx={cardSx}><Head icon={<RefreshIcon color="primary" fontSize="small" />} title={tx("Recently Updated Machines")} /><Stack divider={<Divider />}>{rows.slice().sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))).slice(0, 6).map((r) => <Box key={r.id} onClick={() => setSelectedId(r.id)} sx={{ px: 1.5, py: 1, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}><Stack direction="row" justifyContent="space-between"><Box minWidth={0}><Typography noWrap variant="caption" fontWeight={800}>{r.equipment_code} · {r.equipment_name}</Typography><Typography noWrap display="block" variant="caption" color="text.secondary">{r.type_name} · {pathOf(r.factory_node_id, nodes)}</Typography></Box><Status value={r.operational_status} /></Stack></Box>)}</Stack></Paper></Box>
    {dialog?.type === "equipment" && <EquipmentForm key={dialog.item?.id || "new"} item={dialog.item} types={types} groups={groups} nodes={nodes} actor={actor} saving={saving} onClose={() => setDialog(null)} onSave={saveEquipment} />}{dialog?.type === "spec" && <SpecForm equipment={dialog.item} definitions={definitions} actor={actor} request={request} saving={saving} onClose={() => setDialog(null)} onDone={async () => { setSaving(true); try { const d = await request(`${API}/equipment/${dialog.item.id}`); setDetail(d); setDialog(null); notify("success", "Specifications saved."); } catch (e) { notify("error", e.message); } finally { setSaving(false); } }} />}{dialog?.type === "manager" && <MasterManager kind={dialog.kind} rows={dialog.kind === "type" ? types : dialog.kind === "group" ? groups : definitions} types={types} actor={actor} canEdit={canEdit} request={request} onClose={() => setDialog(null)} onRefresh={load} onKindChange={(kind) => setDialog({ type: "manager", kind })} notify={notify} />}<Snackbar open={msg.open} autoHideDuration={4500} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}><Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert></Snackbar></Box></MuiThemeProvider>;
}
