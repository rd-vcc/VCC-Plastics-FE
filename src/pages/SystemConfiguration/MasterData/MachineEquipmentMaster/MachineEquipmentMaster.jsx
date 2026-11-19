import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Collapse, Dialog, DialogActions,
  DialogContent, Divider, FormControl, IconButton, InputAdornment,
  InputLabel, LinearProgress, ListItemIcon, ListItemText, ListSubheader, Menu, MenuItem, Paper, Select, Snackbar, Stack, Tab,
  Tabs, TextField, ThemeProvider as MuiThemeProvider, Tooltip, Typography, createTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
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
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import CheckIcon from "@mui/icons-material/Check";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
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
import { CountBadge, PanelHeader, masterGridSx, panelSx, SettingsMenu } from "../../../../components/masterData/MasterPanels";
import useFillHeight from "../../../../hooks/useFillHeight";
import FilterListIcon from "@mui/icons-material/FilterList";
import { API_CONFIG } from "../../../../config/config";
import { useTheme as useAppTheme } from "../../../../context/ThemeContext";
import { useTranslation } from "react-i18next";

const BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const API = `${BASE}/api/equipment-master`;
const FACTORY_API = `${BASE}/api/factory-structure`;
const EMPTY = "—";
const OPS = ["UNKNOWN", "RUNNING", "IDLE", "DOWN", "MAINTENANCE", "OFFLINE"];
const ASSETS = ["DRAFT", "ACTIVE", "INACTIVE", "RETIRED", "SCRAPPED"];
const cardSx = panelSx;

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
        px: 2, py: 1.25,
        display: "flex",
        alignItems: "center",
        gap: 1.25,
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
          width: 28, height: 28,
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
        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800 }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.35 }}>
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
const Head = PanelHeader;
const STATUS_COLORS = { RUNNING: "#12B76A", ACTIVE: "#12B76A", IDLE: "#DC6803", MAINTENANCE: "#7A5AF8", DOWN: "#F04438", OFFLINE: "#667085",
  UNKNOWN: "#667085", DRAFT: "#0E9384", INACTIVE: "#667085", RETIRED: "#667085", SCRAPPED: "#F04438" };
function Status({ value, width = 96 }) {
  const color = STATUS_COLORS[value] || "#667085";
  const label = statusText(value || "UNKNOWN");
  return (
    <Box component="span" title={label} sx={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxSizing: "border-box",
      width, height: 22, px: 0.5, lineHeight: 1, verticalAlign: "middle", whiteSpace: "nowrap", overflow: "hidden",
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
      <Typography variant="caption" sx={{ fontWeight: 700, textAlign: "right", minWidth: 0, overflowWrap: "anywhere" }}>{children}</Typography>
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
const dateText = (value) => {
  if (!value) return EMPTY;
  const d = new Date(String(value).slice(0, 10) + "T00:00:00");
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString(tx("LOCALE_TAG") === "LOCALE_TAG" ? "en-GB" : tx("LOCALE_TAG"), { day: "2-digit", month: "2-digit", year: "numeric" });
};
function normalNode(n) { return { ...n, id: Number(n.id), parentId: n.parent_id == null ? null : Number(n.parent_id) }; }
function pathOf(id, nodes) { const names = [], seen = new Set(); let n = nodes.find((x) => x.id === Number(id)); while (n && !seen.has(n.id)) { seen.add(n.id); names.unshift(n.name); n = nodes.find((x) => x.id === n.parentId); } return names.join(" / ") || EMPTY; }

function TreeNode({ node, nodes, rows, selected, expanded, onSelect, onToggle, depth = 0 }) {
  const children = nodes.filter((x) => x.parentId === node.id), open = expanded.includes(node.id);
  const count = rows.filter((x) => Number(x.factory_node_id) === node.id).length;
  return <Box><Box onClick={() => onSelect(node.id)} sx={{ minHeight: 30, pl: `${depth * 13 + 2}px`, display: "flex", alignItems: "center", gap: .4, borderRadius: 1, cursor: "pointer", bgcolor: selected === node.id ? "action.selected" : "transparent", "&:hover": { bgcolor: "action.hover" } }}><IconButton size="small" onClick={(e) => { e.stopPropagation(); if (children.length) onToggle(node.id); }} sx={{ width: 20, height: 20 }}>{children.length ? open ? <ExpandMoreIcon sx={{ fontSize: 13.5 }} /> : <ChevronRightIcon sx={{ fontSize: 13.5 }} /> : <Box sx={{ width: 16 }} />}</IconButton><FactoryOutlinedIcon color="primary" sx={{ fontSize: 13 }} /><Typography noWrap title={node.name} sx={{ flex: 1, fontSize: 11.5, fontWeight: selected === node.id ? 800 : 600, color: node.status === "ACTIVE" ? "text.primary" : "text.disabled" }}>{node.name}</Typography><Box sx={{ mr: .5, display: "flex" }}><CountBadge value={count} /></Box></Box>{children.length > 0 && <Collapse in={open}>{children.map((child) => <TreeNode key={child.id} node={child} nodes={nodes} rows={rows} selected={selected} expanded={expanded} onSelect={onSelect} onToggle={onToggle} depth={depth + 1} />)}</Collapse>}</Box>;
}

// Factory location picker drawn as the factory structure tree; inactive units cannot be chosen.
function LocationTreePicker({ nodes, value, onChange }) {
  const [collapsed, setCollapsed] = useState(() => new Set());
  const children = useMemo(() => {
    const map = {};
    nodes.forEach((n) => { (map[n.parentId ?? "root"] = map[n.parentId ?? "root"] || []).push(n); });
    return map;
  }, [nodes]);
  const parents = nodes.filter((n) => children[n.id]?.length).map((n) => n.id);
  const toggle = (id) => setCollapsed((old) => { const next = new Set(old); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const renderNode = (node, depth) => {
    const kids = children[node.id] || [];
    const open = !collapsed.has(node.id);
    const selected = Number(value) === node.id;
    const disabled = node.status !== "ACTIVE";
    return (
      <Box key={node.id}>
        <Box onClick={() => !disabled && onChange(node.id)} sx={{ minHeight: 27, pl: `${depth * 16 + 2}px`, pr: 0.75, display: "flex", alignItems: "center", gap: 0.5, borderRadius: 1,
          cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
          bgcolor: selected ? "action.selected" : "transparent", "&:hover": disabled ? {} : { bgcolor: selected ? "action.selected" : "action.hover" } }}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); if (kids.length) toggle(node.id); }} sx={{ width: 22, height: 22, visibility: kids.length ? "visible" : "hidden" }}>
            {open ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ChevronRightIcon sx={{ fontSize: 14 }} />}
          </IconButton>
          <FactoryOutlinedIcon color="primary" sx={{ fontSize: 13, flexShrink: 0 }} />
          <Typography noWrap title={node.name} sx={{ flex: 1, minWidth: 0, fontSize: 11.5, fontWeight: selected ? 800 : depth ? 600 : 700 }}>{node.name}</Typography>
          {selected ? <CheckIcon color="primary" sx={{ fontSize: 13.5, flexShrink: 0 }} /> : null}
        </Box>
        {kids.length && open ? kids.map((k) => renderNode(k, depth + 1)) : null}
      </Box>
    );
  };
  return (
    <Box sx={{ flex: 1, minHeight: 280, display: "flex", flexDirection: "column", border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
      <Box sx={{ px: 1, py: 0.5, display: "flex", alignItems: "center", borderBottom: 1, borderColor: "divider", bgcolor: (t) => (t.palette.mode === "dark" ? "#182235" : "#F1F7FF") }}>
        <Typography sx={{ flex: 1, fontSize: 11, fontWeight: 800, pl: 0.5 }}>{tx("Factory structure")}</Typography>
        <Tooltip title={tx("Expand all")}><IconButton size="small" onClick={() => setCollapsed(new Set())}><UnfoldMoreIcon sx={{ fontSize: 14.5 }} /></IconButton></Tooltip>
        <Tooltip title={tx("Collapse all")}><IconButton size="small" onClick={() => setCollapsed(new Set(parents))}><UnfoldLessIcon sx={{ fontSize: 14.5 }} /></IconButton></Tooltip>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 0.75 }}>{(children.root || []).map((n) => renderNode(n, 0))}</Box>
    </Box>
  );
}

function EquipmentForm({ item, types, groups, nodes, actor, saving, onClose, onSave }) {
  const [f, setF] = useState(item ? { code: item.equipment_code, name: item.equipment_name, type: item.equipment_type_id, group: item.equipment_group_id ?? "", node: item.factory_node_id, maker: item.manufacturer || "", model: item.model || "", serial: item.serial_number || "", year: item.manufacturing_year || "", install: item.installation_date?.slice(0, 10) || "", commission: item.commissioning_date?.slice(0, 10) || "", image: item.image_url || "", asset: item.asset_status, op: item.operational_status, note: item.description || "", version: item.version } : { code: "", name: "", type: "", group: "", node: "", maker: "", model: "", serial: "", year: "", install: "", commission: "", image: "", asset: "DRAFT", op: "UNKNOWN", note: "", version: 1 });
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const submit = () => onSave({ equipment_code: f.code.trim().toUpperCase(), equipment_name: f.name.trim(), equipment_type_id: Number(f.type), equipment_group_id: f.group === "" ? null : Number(f.group), factory_node_id: Number(f.node), manufacturer: f.maker.trim() || null, model: f.model.trim() || null, serial_number: f.serial.trim() || null, manufacturing_year: f.year === "" ? null : Number(f.year), installation_date: f.install || null, commissioning_date: f.commission || null, image_url: f.image.trim() || null, asset_status: f.asset, description: f.note.trim() || null, ...(item ? { version: Number(f.version), updated_by: actor } : { created_by: actor }) });
  const activeGroups = groups.filter((g) => g.is_active);
  const groupOptions = f.type === "" ? activeGroups : activeGroups.filter((g) => !g.equipment_type_id || Number(g.equipment_type_id) === Number(f.type));
  // picking a group fills in its equipment type; changing the type drops a group that no longer fits
  const pickGroup = (value) => {
    const g = groups.find((x) => Number(x.id) === Number(value));
    setF((o) => ({ ...o, group: value, type: g?.equipment_type_id ? g.equipment_type_id : o.type }));
  };
  const pickType = (value) => setF((o) => {
    const g = groups.find((x) => Number(x.id) === Number(o.group));
    const keep = !g || !g.equipment_type_id || Number(g.equipment_type_id) === Number(value);
    return { ...o, type: value, group: keep ? o.group : "" };
  });
  const groupItems = () => {
    const out = [<MenuItem key="none" value=""><em>{tx("Not set")}</em></MenuItem>];
    const byType = {};
    groupOptions.forEach((g) => { const k = g.equipment_type_id ?? "shared"; (byType[k] = byType[k] || []).push(g); });
    Object.entries(byType).forEach(([k, list]) => {
      out.push(<ListSubheader key={`h-${k}`} sx={{ lineHeight: "30px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "text.secondary" }}>
        {k === "shared" ? tx("All equipment types") : types.find((t) => Number(t.id) === Number(k))?.type_name || k}</ListSubheader>);
      list.forEach((g) => out.push(<MenuItem key={g.id} value={g.id} sx={{ pl: 3 }}>{g.group_name}</MenuItem>));
    });
    return out;
  };
  const section = (label) => <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "text.secondary", fontSize: "0.68rem" }}>{label}</Typography>;
  const grid = (cols) => ({ display: "grid", gridTemplateColumns: { xs: "1fr", sm: cols }, gap: 1.5, pt: 0.75 });
  return (
    <Dialog open fullWidth maxWidth="lg" onClose={saving ? undefined : onClose} slotProps={{ paper: { sx: { borderRadius: 3, overflow: "hidden", boxShadow: (theme) => (theme.palette.mode === "dark" ? "0 24px 60px rgba(0,0,0,.55)" : "0 24px 60px rgba(15,23,42,.18)") } } }}>
      <DialogHeader icon={<PrecisionManufacturingOutlinedIcon />} title={tx(item ? "Edit Machine / Equipment" : "Add New Machine / Equipment")}
        subtitle={tx("Choose where the machine is installed on the left; fill in its details on the right.")} disabled={saving} onClose={onClose} />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "320px minmax(0,1fr)" }, gap: 2.5, mt: 1, height: { md: 540 } }}>
          {/* left: factory location as the structure tree */}
          <Stack spacing={0.75} sx={{ minHeight: 0 }}>
            {section(`${tx("Factory Location")} *`)}
            <LocationTreePicker nodes={nodes} value={f.node} onChange={(id) => setF((o) => ({ ...o, node: id }))} />
          </Stack>

          {/* right: details */}
          <Box sx={{ minHeight: 0, overflowY: "auto", pr: 0.5 }}>
            <Stack spacing={2.25}>
              <Stack spacing={0.5}>
                {section(tx("Basic information"))}
                <Box sx={grid("1fr 2fr")}>
                  <TextField required fullWidth size="small" disabled={Boolean(item)} label={tx("Equipment Code")} placeholder="VD: IMM-01" value={f.code} onChange={ch("code")} />
                  <TextField required fullWidth size="small" label={tx("Equipment Name")} value={f.name} onChange={ch("name")} />
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 1, px: 1.25, py: 0.9, borderRadius: 1.5, bgcolor: (t) => (t.palette.mode === "dark" ? "#182235" : "#F1F7FF") }}>
                  <AccountTreeOutlinedIcon color="primary" sx={{ fontSize: 13.5 }} />
                  <Typography variant="caption" color="text.secondary">{tx("Factory Location")}:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 0, overflowWrap: "anywhere", color: f.node ? "text.primary" : "text.disabled" }}>
                    {f.node ? pathOf(f.node, nodes) : tx("Not selected")}
                  </Typography>
                </Box>
              </Stack>
              <Stack spacing={0.5}>
                {section(tx("Classification"))}
                <Box sx={grid("1fr 1fr 1fr")}>
                  <FormControl required fullWidth size="small">
                    <InputLabel>{tx("Equipment Type")}</InputLabel>
                    <Select label={tx("Equipment Type")} value={f.type} onChange={(e) => pickType(e.target.value)}>
                      {types.filter((x) => x.is_active).map((x) => <MenuItem key={x.id} value={x.id}>{x.type_name}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel>{tx("Machine Group")}</InputLabel>
                    <Select label={tx("Machine Group")} value={f.group} onChange={(e) => pickGroup(e.target.value)}>{groupItems()}</Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel>{tx("Asset Status")}</InputLabel>
                    <Select label={tx("Asset Status")} value={f.asset} onChange={ch("asset")}>{ASSETS.map((x) => <MenuItem key={x} value={x}>{statusText(x)}</MenuItem>)}</Select>
                  </FormControl>
                </Box>
              </Stack>
              <Stack spacing={0.5}>
                {section(tx("Technical Information"))}
                <Box sx={grid("1fr 1fr")}>
                  <TextField fullWidth size="small" label={tx("Manufacturer")} value={f.maker} onChange={ch("maker")} />
                  <TextField fullWidth size="small" label={tx("Model")} value={f.model} onChange={ch("model")} />
                  <TextField fullWidth size="small" label={tx("Serial Number")} value={f.serial} onChange={ch("serial")} />
                  <TextField fullWidth size="small" type="number" label={tx("Manufacturing Year")} value={f.year} onChange={ch("year")} />
                  <TextField fullWidth size="small" type="date" label={tx("Installation Date")} value={f.install} onChange={ch("install")} slotProps={{ inputLabel: { shrink: true } }} />
                  <TextField fullWidth size="small" type="date" label={tx("Commissioning Date")} value={f.commission} onChange={ch("commission")} slotProps={{ inputLabel: { shrink: true } }} />
                </Box>
              </Stack>
              <ImageUploadField value={f.image} category="machine" label={tx("Image")} disabled={saving} onChange={(v) => setF((o) => ({ ...o, image: v || "" }))} />
              <TextField fullWidth multiline minRows={3} label={tx("Description")} value={f.note} onChange={ch("note")} />
            </Stack>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.25, borderTop: 1, borderColor: "divider", bgcolor: (theme) => (theme.palette.mode === "dark" ? "#0F172A" : "#F8FAFC") }}>
        <Button onClick={submit} disabled={saving || !f.code.trim() || !f.name.trim() || !f.type || !f.node} sx={btn("primary")} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

function SpecForm({ equipment, definitions, actor, request, saving, onClose, onDone }) {
  const defs = definitions.filter((d) => Number(d.equipment_type_id) === Number(equipment.equipment_type_id) && d.is_active);
  const current = Object.fromEntries((equipment.specifications || []).map((x) => [x.spec_definition_id, x]));
  const getValue = (d) => { const r = current[d.id] || {}; return r.value_text ?? r.value_integer ?? r.value_decimal ?? r.value_boolean ?? r.value_date ?? ""; };
  const [values, setValues] = useState(Object.fromEntries(defs.map((d) => [d.id, getValue(d)])));
  const save = async () => { for (const d of defs) { const value = values[d.id]; if (value === "" || value == null) continue; const key = { TEXT: "value_text", INTEGER: "value_integer", DECIMAL: "value_decimal", BOOLEAN: "value_boolean", DATE: "value_date" }[d.data_type]; await request(`${API}/equipment/${equipment.id}/spec-values/${d.id}`, { method: "PUT", body: JSON.stringify({ spec_definition_id: d.id, [key]: ["INTEGER", "DECIMAL"].includes(d.data_type) ? Number(value) : value, updated_by: actor }) }); } await onDone(); };
  return <Dialog open fullWidth maxWidth="sm" onClose={saving ? undefined : onClose} slotProps={{ paper: { sx: { borderRadius: 3, overflow: "hidden", boxShadow: (theme) => theme.palette.mode === "dark" ? "0 24px 60px rgba(0,0,0,.55)" : "0 24px 60px rgba(15,23,42,.18)" } } }}><DialogHeader icon={<SettingsOutlinedIcon />} title={`${tx("Specifications")} · ${equipment.equipment_code}`} disabled={saving} onClose={onClose} /><DialogContent><Stack spacing={1.5} sx={{ pt: 1 }}>{defs.length ? defs.map((d) => d.data_type === "BOOLEAN" ? <FormControl key={d.id} fullWidth size="small"><InputLabel>{d.spec_name}</InputLabel><Select label={d.spec_name} value={values[d.id]} onChange={(e) => setValues((o) => ({ ...o, [d.id]: e.target.value }))}><MenuItem value=""><em>{tx("Not set")}</em></MenuItem><MenuItem value={true}>{tx("Yes")}</MenuItem><MenuItem value={false}>{tx("No")}</MenuItem></Select></FormControl> : <TextField key={d.id} required={Boolean(d.is_required)} fullWidth size="small" type={d.data_type === "DATE" ? "date" : ["INTEGER", "DECIMAL"].includes(d.data_type) ? "number" : "text"} label={`${d.spec_name}${d.unit ? ` (${d.unit})` : ""}`} value={values[d.id]} onChange={(e) => setValues((o) => ({ ...o, [d.id]: e.target.value }))} slotProps={{ inputLabel: d.data_type === "DATE" ? { shrink: true } : undefined }} />) : <Alert severity="info">{tx("No specifications are configured for this equipment type.")}</Alert>}</Stack></DialogContent><DialogActions sx={{ px: 2, py: 1.25, borderTop: 1, borderColor: "divider" }}><Button onClick={save} disabled={saving || !defs.length} sx={btn("primary")}>{tx("Save Specifications")}</Button></DialogActions></Dialog>;
}

const CATEGORIES = ["MACHINE", "ROBOT", "AUXILIARY", "UTILITY", "OTHER"];
const DATA_TYPES = ["TEXT", "INTEGER", "DECIMAL", "BOOLEAN", "DATE"];
const MANAGER = {
  type: { title: "Equipment Types", subtitle: "What kind of machine it is; every machine belongs to one type.", segment: "types", code: "type_code", name: "type_name", icon: CategoryOutlinedIcon },
  group: { title: "Machine Groups", subtitle: "Finer grouping inside a type, e.g. injection machines by clamping force.", segment: "groups", code: "group_code", name: "group_name", icon: AccountTreeOutlinedIcon },
  spec: { title: "Specification Definitions", subtitle: "Technical specifications each machine of a type has.", segment: "spec-definitions", code: "spec_code", name: "spec_name", icon: TuneOutlinedIcon },
};

const catText = (c) => { const v = tx(`CAT_${c}`); return v === `CAT_${c}` ? c : v; };
const dataTypeText = (d) => { const v = tx(`DT_${d}`); return v === `DT_${d}` ? d : v; };

function FieldLabel({ children }) {
  return <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "text.secondary", fontSize: "0.68rem" }}>{children}</Typography>;
}

// Equipment types / machine groups / specification definitions:
// list on the left, details of the clicked row on the right; add / edit happen in the right panel.
function MasterManager({ kind, rows, types, machines, actor, canEdit, request, onClose, onRefresh, notify }) {
  const conf = MANAGER[kind];
  const Icon = conf.icon;
  const perType = kind !== "type";
  const [typeFilter, setTypeFilter] = useState(() => (kind === "spec" ? types[0]?.id ?? "all" : "all"));
  const visibleRows = useMemo(() => (!perType || typeFilter === "all" ? rows
    : rows.filter((r) => Number(r.equipment_type_id) === Number(typeFilter) || (kind === "group" && r.equipment_type_id == null))), [rows, perType, typeFilter, kind]);
  const [selectedId, setSelectedId] = useState(() => visibleRows[0]?.id ?? null);
  useEffect(() => { if (!visibleRows.some((r) => r.id === selectedId)) setSelectedId(visibleRows[0]?.id ?? null); }, [visibleRows, selectedId]);
  const typeCount = (id) => rows.filter((r) => Number(r.equipment_type_id) === Number(id)).length;
  const [mode, setMode] = useState("view"); // view | edit | new
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const selected = rows.find((r) => r.id === selectedId) || null;
  const usage = useCallback((item) => (kind === "type"
    ? machines.filter((m) => Number(m.equipment_type_id) === Number(item.id)).length
    : kind === "group" ? machines.filter((m) => Number(m.equipment_group_id) === Number(item.id)).length : null), [kind, machines]);

  const toForm = (item) => (kind === "type"
    ? { code: item?.type_code || "", name: item?.type_name || "", category: item?.category || "MACHINE", active: item ? Boolean(item.is_active) : true, sort: item?.sort_order || 0, description: item?.description || "" }
    : kind === "group"
      ? { code: item?.group_code || "", name: item?.group_name || "", typeId: item ? item.equipment_type_id ?? "" : typeFilter === "all" ? "" : typeFilter, active: item ? Boolean(item.is_active) : true, sort: item?.sort_order || 0, description: item?.description || "" }
      : { code: item?.spec_code || "", name: item?.spec_name || "", typeId: item ? item.equipment_type_id ?? "" : typeFilter === "all" ? "" : typeFilter, dataType: item?.data_type || "TEXT", unit: item?.unit || "", required: item ? Boolean(item.is_required) : false, active: item ? Boolean(item.is_active) : true, sort: item?.sort_order || 0, description: item?.description || "" });
  const toPayload = (f, isNew) => {
    const who = isNew ? { created_by: actor } : { updated_by: actor };
    if (kind === "type") return { ...who, ...(isNew ? { type_code: f.code.trim().toUpperCase() } : {}), type_name: f.name.trim(), category: f.category, description: f.description.trim() || null, is_active: Boolean(f.active), sort_order: Number(f.sort || 0) };
    if (kind === "group") return { ...who, ...(isNew ? { group_code: f.code.trim().toUpperCase() } : {}), group_name: f.name.trim(), equipment_type_id: f.typeId === "" ? null : Number(f.typeId), description: f.description.trim() || null, is_active: Boolean(f.active), sort_order: Number(f.sort || 0) };
    return { ...who, ...(isNew ? { equipment_type_id: Number(f.typeId), spec_code: f.code.trim().toUpperCase() } : {}), spec_name: f.name.trim(), data_type: f.dataType, unit: f.unit.trim() || null, is_required: Boolean(f.required), is_active: Boolean(f.active), sort_order: Number(f.sort || 0), description: f.description.trim() || null };
  };
  const submit = async (f, isNew, item) => {
    setSaving(true);
    try {
      const result = await request(isNew ? `${API}/${conf.segment}` : `${API}/${conf.segment}/${item.id}`, { method: isNew ? "POST" : "PUT", body: JSON.stringify(toPayload(f, isNew)) });
      await onRefresh();
      if (isNew && result?.id) setSelectedId(result.id);
      setMode("view");
      notify("success", result?.message || tx("Saved."));
    } catch (error) { notify("error", error.message); } finally { setSaving(false); }
  };
  const remove = async (item) => {
    if (!window.confirm(`${tx("Delete")} ${item[conf.name]}?`)) return;
    setSaving(true);
    try {
      const result = await request(`${API}/${conf.segment}/${item.id}`, { method: "DELETE" });
      await onRefresh(); setSelectedId(null); notify("success", result?.message || tx("Deleted."));
    } catch (error) { notify("error", error.message); } finally { setSaving(false); }
  };
  const change = (key) => (event) => setForm((old) => ({ ...old, [key]: event.target.value }));
  const typeName = (id) => types.find((t) => Number(t.id) === Number(id))?.type_name;

  const cols = useMemo(() => [
    { headerName: tx("Code"), field: conf.code, width: 140, pinned: "left" },
    { headerName: tx("Name"), field: conf.name, minWidth: 170, flex: 1.4 },
    kind === "type"
      ? { headerName: tx("Category"), field: "category", minWidth: 130, flex: 0.9, valueFormatter: (p) => catText(p.value) }
      : typeFilter === "all" ? { headerName: tx("Equipment Type"), field: "type_name", minWidth: 140, flex: 1, valueFormatter: (p) => p.value || tx("All equipment types") } : null,
    ...(kind === "spec" ? [
      { headerName: tx("Data Type"), field: "data_type", minWidth: 110, flex: 0.7, valueFormatter: (p) => dataTypeText(p.value) },
      { headerName: tx("Unit"), field: "unit", minWidth: 80, flex: 0.5, valueFormatter: (p) => p.value || EMPTY },
    ] : [{ headerName: tx("Machines"), minWidth: 90, flex: 0.5, valueGetter: (p) => usage(p.data), cellStyle: { justifyContent: "center" } }]),
    { headerName: tx("Status"), minWidth: 110, flex: 0.6, cellRenderer: (p) => <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}><Status value={p.data.is_active ? "ACTIVE" : "INACTIVE"} /></Box> },
  ].filter(Boolean), [kind, conf, usage, typeFilter]);

  const editing = mode !== "view";
  const isNew = mode === "new";
  const valid = form && form.code.trim() && form.name.trim() && (kind !== "spec" || form.typeId !== "");

  const detail = selected ? (
    <>
      <Box sx={{ p: 1.5, flexShrink: 0 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr) auto", columnGap: 1.25, alignItems: "center" }}>
          <Box sx={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", color: "#FFF", bgcolor: "#005BAB" }}><Icon sx={{ fontSize: 18 }} /></Box>
          <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0.25 }}>
            <Typography noWrap sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>{selected[conf.name]}</Typography>
            <Typography noWrap color="text.secondary" sx={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2 }}>{selected[conf.code]}</Typography>
          </Box>
          <Status value={selected.is_active ? "ACTIVE" : "INACTIVE"} />
        </Box>
      </Box>
      <Box sx={{ px: 1.5, pb: 1.5, flex: 1, minHeight: 0, overflowY: "auto" }}>
        <DetailSection title={tx("General")}>
          {kind === "type" ? <DetailRow label={tx("Category")}>{catText(selected.category)}</DetailRow> : null}
          {kind !== "type" ? <DetailRow label={tx("Equipment Type")}>{selected.type_name || typeName(selected.equipment_type_id) || tx("All equipment types")}</DetailRow> : null}
          {kind === "spec" ? <DetailRow label={tx("Data Type")}>{dataTypeText(selected.data_type)}</DetailRow> : null}
          {kind === "spec" ? <DetailRow label={tx("Unit")}>{selected.unit || EMPTY}</DetailRow> : null}
          {kind === "spec" ? <DetailRow label={tx("Required")}>{selected.is_required ? tx("Yes") : tx("No")}</DetailRow> : null}
          {kind !== "spec" ? <DetailRow label={tx("Machines")}>{usage(selected)}</DetailRow> : null}
          <DetailRow label={tx("Sort Order")}>{selected.sort_order ?? 0}</DetailRow>
          <DetailRow label={tx("Description")} last>{selected.description || EMPTY}</DetailRow>
        </DetailSection>
      </Box>
      <Divider />
      <Stack direction="row" sx={{ p: 1.5, minHeight: 64, boxSizing: "border-box", justifyContent: "center", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
        <ActionIcon title={tx("Edit")} icon={<EditOutlinedIcon fontSize="small" />} disabled={!canEdit || saving} onClick={() => { setForm(toForm(selected)); setMode("edit"); }} />
        <ActionIcon title={tx(selected.is_active ? "Deactivate" : "Activate")} color={selected.is_active ? "warning" : "success"}
          icon={selected.is_active ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
          disabled={!canEdit || saving} onClick={() => submit({ ...toForm(selected), active: !selected.is_active }, false, selected)} />
        <ActionIcon title={usage(selected) ? tx("In use by machines, deactivate instead") : tx("Delete")} icon={<DeleteOutlineIcon fontSize="small" />} color="error"
          disabled={!canEdit || saving || Boolean(usage(selected))} onClick={() => remove(selected)} />
      </Stack>
    </>
  ) : (
    <Box sx={{ flex: 1, display: "grid", placeItems: "center", p: 2 }}><Typography variant="body2" color="text.secondary">{tx("Select a row to view details.")}</Typography></Box>
  );

  const formPanel = form ? (
    <>
      <Box sx={{ px: 1.5, py: 1.25, flexShrink: 0, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
        {isNew ? <AddIcon color="primary" fontSize="small" /> : <EditOutlinedIcon color="primary" fontSize="small" />}
        <Typography sx={{ fontSize: 12, fontWeight: 800 }}>{isNew ? tx("Add New") : `${tx("Edit")} · ${selected?.[conf.name] || ""}`}</Typography>
      </Box>
      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, overflowY: "auto" }}>
        <Stack spacing={2}>
          <Stack spacing={1.25}>
            <FieldLabel>{tx("Basic information")}</FieldLabel>
            <TextField fullWidth required size="small" label={tx("Code")} disabled={!isNew} value={form.code} onChange={change("code")} />
            <TextField fullWidth required size="small" label={tx("Name")} value={form.name} onChange={change("name")} />
          </Stack>
          <Stack spacing={1.25}>
            <FieldLabel>{tx("Classification")}</FieldLabel>
            {kind === "type" ? (
              <FormControl fullWidth size="small">
                <InputLabel>{tx("Category")}</InputLabel>
                <Select label={tx("Category")} value={form.category} onChange={change("category")}>
                  {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{catText(c)}</MenuItem>)}
                </Select>
              </FormControl>
            ) : (
              <FormControl fullWidth required={kind === "spec"} size="small">
                <InputLabel>{tx("Equipment Type")}</InputLabel>
                <Select label={tx("Equipment Type")} value={form.typeId} disabled={kind === "spec" && !isNew} onChange={change("typeId")}>
                  {kind === "group" ? <MenuItem value=""><em>{tx("All equipment types")}</em></MenuItem> : null}
                  {types.map((t) => <MenuItem key={t.id} value={t.id}>{t.type_name}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            {kind === "spec" ? (
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{tx("Data Type")}</InputLabel>
                  <Select label={tx("Data Type")} value={form.dataType} disabled={!isNew} onChange={change("dataType")}>
                    {DATA_TYPES.map((d) => <MenuItem key={d} value={d}>{dataTypeText(d)}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField fullWidth size="small" label={tx("Unit")} placeholder="VD: tấn, mm, °C" value={form.unit} onChange={change("unit")} />
              </Box>
            ) : null}
            <Box sx={{ display: "grid", gridTemplateColumns: kind === "spec" ? "1fr 1fr 1fr" : "1fr 1fr", gap: 1.25 }}>
              {kind === "spec" ? (
                <FormControl fullWidth size="small">
                  <InputLabel>{tx("Required")}</InputLabel>
                  <Select label={tx("Required")} value={form.required} onChange={change("required")}>
                    <MenuItem value={true}>{tx("Yes")}</MenuItem><MenuItem value={false}>{tx("No")}</MenuItem>
                  </Select>
                </FormControl>
              ) : null}
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
        <Button disabled={saving} onClick={() => setMode("view")} sx={btn("cancel")}>{tx("Discard")}</Button>
        <Button disabled={saving || !valid} onClick={() => submit(form, isNew, selected)} sx={btn("primary")} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>{tx("Save")}</Button>
      </Stack>
    </>
  ) : null;

  return (
    <Dialog open fullWidth maxWidth="lg" onClose={saving ? undefined : onClose} slotProps={{ paper: { sx: { borderRadius: 3, overflow: "hidden", boxShadow: (theme) => (theme.palette.mode === "dark" ? "0 24px 60px rgba(0,0,0,.55)" : "0 24px 60px rgba(15,23,42,.18)") } } }}>
      <DialogHeader icon={<Icon />} title={tx(conf.title)} subtitle={tx(conf.subtitle)} disabled={saving} onClose={onClose} />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
          {perType ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
              <FormControl size="small" sx={{ width: 320 }} disabled={editing}>
                <InputLabel>{tx("Equipment Type")}</InputLabel>
                <Select label={tx("Equipment Type")} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                  renderValue={(v) => (v === "all" ? tx("All") : types.find((t) => String(t.id) === String(v))?.type_name || "")}
                  MenuProps={{ slotProps: { paper: { sx: { maxHeight: 360 } } } }}>
                  {kind === "group" ? (
                    <MenuItem value="all">
                      <Box sx={{ flex: 1 }}>{tx("All")}</Box>
                      <Typography component="span" variant="caption" color="text.secondary">{rows.length}</Typography>
                    </MenuItem>
                  ) : null}
                  {types.map((t) => (
                    <MenuItem key={t.id} value={t.id} sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{t.type_name}</Box>
                      <Typography component="span" variant="caption" color="text.secondary">{typeCount(t.id)}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          ) : null}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0,1fr) 380px" }, gap: 2.5, mt: perType ? 2 : 1, height: { md: 500 } }}>
          {/* left: table without an extra frame; the footer row has the right panel's footer height so the buttons line up */}
          <Box sx={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
            <Box sx={{ flex: 1, minHeight: 300 }}>
              <AgGridTable rowData={visibleRows} columnDefs={cols} height="100%" getRowId={(p) => String(p.data.id)}
                onRowClicked={(e) => { if (!editing) setSelectedId(e.data.id); }} />
            </Box>
            <Stack direction="row" sx={{ minHeight: 66, boxSizing: "border-box", alignItems: "center", flexShrink: 0 }}>
              <Button variant="contained" disabled={!canEdit || saving || editing} startIcon={<AddIcon />} onClick={() => { setForm(toForm(null)); setMode("new"); }} sx={btn("primary")}>{tx("Add New")}</Button>
              <Box sx={{ flex: 1 }} />
              <Typography variant="caption" color="text.secondary">{visibleRows.length} {tx("rows")}</Typography>
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
  const filtered = useMemo(() => { const q = keyword.toLowerCase().trim(); return rows.filter((x) => (!q || `${x.equipment_code} ${x.equipment_name} ${x.model || ""}`.toLowerCase().includes(q)) && (typeFilter === "all" || Number(x.equipment_type_id) === Number(typeFilter)) && (groupFilter === "all" || Number(x.equipment_group_id) === Number(groupFilter)) && (statusFilter === "all" || x.asset_status === statusFilter) && (!nodeId || Number(x.factory_node_id) === Number(nodeId))); }, [rows, keyword, typeFilter, groupFilter, statusFilter, nodeId]);
  const byCategory = (c) => rows.filter((x) => x.category === c).length;
  const notInUse = rows.filter((x) => x.asset_status !== "ACTIVE").length;
  const percent = (n) => (rows.length ? `${((n / rows.length) * 100).toFixed(1)}% ${tx("of total")}` : `0% ${tx("of total")}`);
  const openEdit = async (id) => { try { setDialog({ type: "equipment", item: await request(`${API}/equipment/${id}`) }); } catch (e) { notify("error", e.message); } };
  const saveEquipment = async (payload) => { setSaving(true); try { const item = dialog.item, result = await request(item ? `${API}/equipment/${item.id}` : `${API}/equipment`, { method: item ? "PUT" : "POST", body: JSON.stringify(payload) }); setDialog(null); await load(); if (result.id) setSelectedId(result.id); setDetail(null); notify("success", result.message || "Saved."); } catch (e) { notify("error", e.message); } finally { setSaving(false); } };
  const toggle = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const next = selected.asset_status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await request(`${API}/equipment/${selected.id}/status`, { method: "PATCH", body: JSON.stringify({ asset_status: next, version: selected.version, updated_by: actor }) });
      await load(); setDetail(null); notify("success", tx("Status updated."));
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const cols = useMemo(() => [
    { headerName: tx("Equipment Code"), field: "equipment_code", width: 130, pinned: "left" },
    { headerName: tx("Equipment Name"), field: "equipment_name", minWidth: 170, flex: 1.5 },
    { headerName: tx("Equipment Type"), field: "type_name", minWidth: 130, flex: 1 },
    { headerName: tx("Model"), field: "model", minWidth: 120, flex: 0.9, valueFormatter: (p) => p.value || EMPTY },
    { headerName: tx("Factory Location"), minWidth: 150, flex: 1.1, valueGetter: (p) => nodes.find((n) => n.id === Number(p.data.factory_node_id))?.name || EMPTY },
    { headerName: tx("Asset Status"), field: "asset_status", minWidth: 120, flex: 0.7, cellRenderer: (p) => <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}><Status value={p.value} /></Box> },
  ], [nodes, language]);
  const [panelsRef, panelHeight] = useFillHeight();
  return <MuiThemeProvider theme={muiTheme}><Box>
    <PageMeta title="Machine & Equipment Master | VCC Plastics" description="Machine master data" />
    <PageBreadcrumb pageTitle={tx("Machine & Equipment Master")} />
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr auto" }, gap: 1.5, alignItems: "center", mb: 1.5 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>{tx("Machine & Equipment Master")}</Typography>
        <Typography variant="body2" color="text.secondary">{tx("Manage all machines and equipment in the system")}</Typography>
      </Box>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2, justifyContent: "flex-end" }}>
        <SettingsMenu title={tx("Settings")} items={[["type", "Equipment Types", <CategoryOutlinedIcon />], ["group", "Machine Groups", <AccountTreeOutlinedIcon />], ["spec", "Specification Definitions", <TuneOutlinedIcon />]]
          .map(([kind, label, icon]) => ({ key: kind, label: tx(label), icon, onClick: () => setDialog({ type: "manager", kind }) }))} />
        <Button disabled={!canEdit} startIcon={<AddIcon />} onClick={() => setDialog({ type: "equipment", item: null })} sx={btn("primary")}>{tx("Add New Machine")}</Button>
      </Stack>
    </Box>

    <KpiCardGroup>
      <KpiCard label={tx("Total Machines")} value={rows.length} note={`${types.filter((x) => x.is_active).length} ${tx("Active types")}`} icon={<PrecisionManufacturingOutlinedIcon />} tone="primary" />
      <KpiCard label={catText("MACHINE")} value={byCategory("MACHINE")} note={percent(byCategory("MACHINE"))} icon={<PrecisionManufacturingOutlinedIcon />} tone="success" />
      <KpiCard label={catText("ROBOT")} value={byCategory("ROBOT")} note={percent(byCategory("ROBOT"))} icon={<SmartToyOutlinedIcon />} tone="accent" />
      <KpiCard label={catText("AUXILIARY")} value={byCategory("AUXILIARY")} note={percent(byCategory("AUXILIARY"))} icon={<BuildOutlinedIcon />} tone="warning" />
      <KpiCard label={catText("UTILITY")} value={byCategory("UTILITY")} note={percent(byCategory("UTILITY"))} icon={<CategoryOutlinedIcon />} tone="info" />
      <KpiCard label={tx("Not in use")} value={notInUse} note={tx("Draft / inactive / retired")} icon={<BlockOutlinedIcon />} tone="danger" />
    </KpiCardGroup>

    <Paper variant="outlined" sx={{ my: 1.5, p: 1.5, borderRadius: 2 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(240px,1.6fr) repeat(3,minmax(145px,1fr)) auto" }, gap: 1 }}>
        <TextField size="small" placeholder={tx("Search by machine code or name...")} value={keyword} onChange={(e) => setKeyword(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
        <FormControl size="small">
          <InputLabel>{tx("Equipment Type")}</InputLabel>
          <Select label={tx("Equipment Type")} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <MenuItem value="all">{tx("All Types")}</MenuItem>
            {types.map((x) => <MenuItem key={x.id} value={x.id}>{x.type_name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>{tx("Asset Status")}</InputLabel>
          <Select label={tx("Asset Status")} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="all">{tx("All Status")}</MenuItem>
            {ASSETS.map((x) => <MenuItem key={x} value={x}>{statusText(x)}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>{tx("Machine Group")}</InputLabel>
          <Select label={tx("Machine Group")} value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
            <MenuItem value="all">{tx("All Groups")}</MenuItem>
            {groups.map((x) => <MenuItem key={x.id} value={x.id}>{x.group_name}</MenuItem>)}
          </Select>
        </FormControl>
        <Button startIcon={<FilterListIcon />} onClick={() => { setKeyword(""); setTypeFilter("all"); setStatusFilter("all"); setGroupFilter("all"); setNodeId(null); }}
          sx={btn("cancel", { minHeight: 29, whiteSpace: "nowrap" })}>{tx("Clear")}</Button>
      </Box>
    </Paper>

    <Box ref={panelsRef} sx={masterGridSx}>
      {/* left: factory structure tree with the number of machines per unit */}
      <Paper elevation={0} sx={{ ...cardSx, height: panelHeight, display: "flex", flexDirection: "column" }}>
        <Head icon={<AccountTreeOutlinedIcon color="primary" fontSize="small" />} title={tx("Equipment Hierarchy")} />
        <Box sx={{ p: 0.75, flex: 1, minHeight: 0, overflow: "auto" }}>
          <Box onClick={() => setNodeId(null)} sx={{ minHeight: 27, px: 0.75, display: "flex", alignItems: "center", gap: 0.75, borderRadius: 1, cursor: "pointer", bgcolor: nodeId == null ? "action.selected" : "transparent", "&:hover": { bgcolor: nodeId == null ? "action.selected" : "action.hover" } }}>
            <CategoryOutlinedIcon color="primary" sx={{ fontSize: 13.5 }} />
            <Typography sx={{ flex: 1, fontSize: 11.5, fontWeight: 800 }}>{tx("All locations")}</Typography>
            <Box sx={{ mr: 0.5, display: "flex" }}><CountBadge value={rows.length} /></Box>
          </Box>
          {roots.map((r) => <TreeNode key={r.id} node={r} nodes={nodes} rows={rows} selected={nodeId} expanded={expanded} onSelect={setNodeId}
            onToggle={(id) => setExpanded((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]))} />)}
        </Box>
      </Paper>

      {/* middle: machine list */}
      <Paper elevation={0} sx={{ ...cardSx, height: panelHeight, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Head icon={<PrecisionManufacturingOutlinedIcon color="primary" fontSize="small" />} title={`${tx("Machine List")} (${filtered.length})`} />
        <Box sx={{ p: 0.75, flex: 1, minHeight: 0 }}>
          <AgGridTable rowData={filtered} columnDefs={cols} loading={loading} onRowClicked={(e) => setSelectedId(e.data.id)} getRowId={(p) => String(p.data.id)} height="100%" />
        </Box>
      </Paper>

      {/* right: machine detail */}
      <Paper elevation={0} sx={{ ...cardSx, height: panelHeight, display: "flex", flexDirection: "column" }}>
        <Head icon={<VisibilityOutlinedIcon color="primary" fontSize="small" />} title={tx("Machine Detail")} />
        {selected ? <>
          <Box sx={{ p: 1.5, flexShrink: 0 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr) auto", columnGap: 1.25, alignItems: "center" }}>
              <Box sx={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", color: "#FFF", bgcolor: "#005BAB" }}>
                <PrecisionManufacturingOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0.25 }}>
                <Typography noWrap title={selected.equipment_name} sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>{selected.equipment_name}</Typography>
                <Typography noWrap color="text.secondary" sx={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2 }}>{selected.equipment_code}</Typography>
              </Box>
              <Status value={selected.asset_status} />
            </Box>
          </Box>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth"
            sx={{ minHeight: 27, borderTop: 1, borderBottom: 1, borderColor: "divider", "& .MuiTab-root": { minHeight: 27, py: 0, fontSize: 11, fontWeight: 700, textTransform: "none" } }}>
            <Tab label={tx("Information")} /><Tab label={tx("Specification")} />
          </Tabs>
          <Box sx={{ p: 1.5, flex: 1, minHeight: 0, overflow: "auto" }}>
            {tab === 0 ? (
              <Stack spacing={1.5}>
                {selected.image_url ? (
                  <Box component="a" href={resolveImageUrl(selected.image_url)} target="_blank" rel="noreferrer" title={tx("Open full image")}
                    sx={{ display: "block", borderRadius: 1.5, overflow: "hidden", border: 1, borderColor: "divider", bgcolor: "action.hover", cursor: "zoom-in" }}>
                    <Box component="img" src={resolveImageUrl(selected.image_url)} alt={selected.equipment_name} sx={{ display: "block", width: "100%", height: 170, objectFit: "contain" }} />
                  </Box>
                ) : null}
                <DetailSection title={tx("General")}>
                  <DetailRow label={tx("Equipment Type")}>{selected.type_name || EMPTY}</DetailRow>
                  <DetailRow label={tx("Machine Group")}>{selected.group_name || EMPTY}</DetailRow>
                  <DetailRow label={tx("Area / Line")} last>{pathOf(selected.factory_node_id, nodes)}</DetailRow>
                </DetailSection>
                <DetailSection title={tx("Technical Information")}>
                  <DetailRow label={tx("Manufacturer")}>{selected.manufacturer || EMPTY}</DetailRow>
                  <DetailRow label={tx("Model")}>{selected.model || EMPTY}</DetailRow>
                  <DetailRow label={tx("Serial Number")}>{selected.serial_number || EMPTY}</DetailRow>
                  <DetailRow label={tx("Manufacturing Year")}>{selected.manufacturing_year || EMPTY}</DetailRow>
                  <DetailRow label={tx("Installation Date")}>{dateText(selected.installation_date)}</DetailRow>
                  <DetailRow label={tx("Commissioning Date")} last>{dateText(selected.commissioning_date)}</DetailRow>
                </DetailSection>
                <DetailSection title={tx("Record")}>
                  <DetailRow label={tx("Created by")}>{person(selected.created_by_name, selected.created_by_code)}</DetailRow>
                  <DetailRow label={tx("Updated by")}>{selected.updated_by ? person(selected.updated_by_name, selected.updated_by_code) : EMPTY}</DetailRow>
                  <DetailRow label={tx("Description")} last>{selected.description || EMPTY}</DetailRow>
                </DetailSection>
              </Stack>
            ) : (
              selected.specifications?.length ? (
                <DetailSection title={tx("Specifications")}>
                  {selected.specifications.map((sp, idx) => (
                    <DetailRow key={sp.spec_definition_id} label={sp.spec_name} last={idx === selected.specifications.length - 1}>
                      {sp.value_text ?? sp.value_integer ?? sp.value_decimal ?? (sp.value_date ? dateText(sp.value_date) : null) ?? (sp.value_boolean == null ? EMPTY : sp.value_boolean ? tx("Yes") : tx("No"))}
                      {sp.unit && (sp.value_integer != null || sp.value_decimal != null) ? ` ${sp.unit}` : ""}
                    </DetailRow>
                  ))}
                </DetailSection>
              ) : <Typography color="text.secondary" variant="body2">{tx("No specifications.")}</Typography>
            )}
          </Box>
          <Divider />
          <Stack direction="row" sx={{ justifyContent: "center", gap: 1.5, p: 1.5, flexShrink: 0 }}>
            <ActionIcon title={tx("Edit machine")} icon={<EditOutlinedIcon fontSize="small" />} disabled={!canEdit} onClick={() => openEdit(selected.id)} />
            <ActionIcon title={tx("Edit specifications")} icon={<SettingsOutlinedIcon fontSize="small" />} color="primary" disabled={!canEdit} onClick={() => setDialog({ type: "spec", item: selected })} />
            <ActionIcon title={tx(selected.asset_status === "ACTIVE" ? "Deactivate" : "Activate")}
              icon={selected.asset_status === "ACTIVE" ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
              color={selected.asset_status === "ACTIVE" ? "warning" : "success"} disabled={!canEdit || saving} onClick={toggle} />
          </Stack>
        </> : <Box sx={{ flex: 1, display: "grid", placeItems: "center", p: 2 }}><Typography color="text.secondary">{tx("Select a machine.")}</Typography></Box>}
      </Paper>
    </Box>
    {dialog?.type === "equipment" && <EquipmentForm key={dialog.item?.id || "new"} item={dialog.item} types={types} groups={groups} nodes={nodes} actor={actor} saving={saving} onClose={() => setDialog(null)} onSave={saveEquipment} />}{dialog?.type === "spec" && <SpecForm equipment={dialog.item} definitions={definitions} actor={actor} request={request} saving={saving} onClose={() => setDialog(null)} onDone={async () => { setSaving(true); try { const d = await request(`${API}/equipment/${dialog.item.id}`); setDetail(d); setDialog(null); notify("success", "Specifications saved."); } catch (e) { notify("error", e.message); } finally { setSaving(false); } }} />}{dialog?.type === "manager" && <MasterManager kind={dialog.kind} rows={dialog.kind === "type" ? types : dialog.kind === "group" ? groups : definitions} types={types} machines={rows} actor={actor} canEdit={canEdit} request={request} onClose={() => setDialog(null)} onRefresh={load} notify={notify} />}<Snackbar open={msg.open} autoHideDuration={4500} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}><Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert></Snackbar></Box></MuiThemeProvider>;
}
