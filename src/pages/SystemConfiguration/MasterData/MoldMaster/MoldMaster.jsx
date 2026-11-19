import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
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
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import PageMeta from "../../../../components/common/PageMeta";
import ImageUploadField, { resolveImageUrl } from "../../../../components/common/ImageUploadField";
import MoldDocuments from "./MoldDocuments";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import AgGridTable from "../../../../components/tables/BasicTables/BasicTableOne";
import { CountBadge, PanelHeader, masterGridSx, panelSx, SettingsMenu } from "../../../../components/masterData/MasterPanels";
import useFillHeight from "../../../../hooks/useFillHeight";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import CheckIcon from "@mui/icons-material/Check";
import FilterListIcon from "@mui/icons-material/FilterList";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import { API_CONFIG } from "../../../../config/config";
import { getAccessToken, getCurrentUser } from "../../../../auth/auth";
import usePagePermission from "../../../../auth/usePagePermission";
import { buttonSystem } from "../../../../components/button/ButtonSystem";
import {
  KpiCard,
  KpiCardGroup,
} from "../../../../components/kpi/KpiCardSystem";
import { useTheme as useAppTheme } from "../../../../context/ThemeContext";
import { useTranslation } from "react-i18next";

const API_BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const EMPTY_STATS = {
  total_molds: 0,
  in_production: 0,
  available: 0,
  in_maintenance: 0,
  in_repair: 0,
  average_life_used: 0,
};
const MOLD_STATUSES = [
  "AVAILABLE",
  "IN_PRODUCTION",
  "IN_MAINTENANCE",
  "IN_REPAIR",
  "LOCKED",
  "RETIRED",
  "SCRAPPED",
]; 
const DATA_TYPES = [
  "TEXT",
  "LONG_TEXT",
  "INTEGER",
  "DECIMAL",
  "BOOLEAN",
  "DATE",
  "DATETIME",
  "SELECT",
  "MULTI_SELECT",
];

const LOCATION_CATEGORIES = ["STORAGE", "MAINTENANCE", "REPAIR", "SCRAP"];
const numOrNull = (v) => (v === "" || v == null ? null : Number(v));


function buttonSx(type, overrides = {}) {
  const styles = buttonSystem[type] || {};
  return {
    ...(styles.base || {}),
    ...(styles.hover ? { "&:hover": styles.hover } : {}),
    ...overrides,
  };
}

function createMoldTheme(mode) {
  const dark = mode === "dark";
  return createTheme({
    palette: {
      mode,
      primary: { main: "#005BAB" },
      background: {
        default: dark ? "#0B1220" : "#F8FAFC",
        paper: dark ? "#111827" : "#FFF",
      },
      text: {
        primary: dark ? "#F3F4F6" : "#172033",
        secondary: dark ? "#A7B0C0" : "#667085",
      },
      divider: dark ? "#344054" : "#D0D5DD",
    },
    typography: {
      fontFamily: '"Bai Jamjuree", Inter, sans-serif',
    },
    components: {
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: dark ? "#0F172A" : "#FFF",
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

const dialogPaperSx = {
  borderRadius: 3,
  overflow: "hidden",
  boxShadow: (theme) =>
    theme.palette.mode === "dark"
      ? "0 24px 60px rgba(0,0,0,.55)"
      : "0 24px 60px rgba(15,23,42,.18)",
};

const SectionHeader = PanelHeader;

function ActivePill({ active, t, width = 92 }) {
  const color = active ? "#12B76A" : "#F04438";
  const label = active ? t("moldMaster.active") : t("moldMaster.inactive");
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
      <Typography variant="caption" sx={{ fontWeight: 700, textAlign: "right", minWidth: 0, overflowWrap: "anywhere" }}>{children ?? "—"}</Typography>
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

const person = (name, code) => (name ? `${name} - ${code}` : code || "—");
const dateText = (value, lang) => {
  if (!value) return "—";
  const d = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(lang === "vi" ? "vi-VN" : lang === "ja" ? "ja-JP" : "en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
};
const numText = (v, unit) => (v == null || v === "" ? "—" : `${Number(v).toLocaleString()}${unit ? ` ${unit}` : ""}`);

// Mold location picker drawn as the location tree; "not assigned" is allowed.
function LocationTreePicker({ nodes, value, onChange, t, noneLabel, excludeIds, title }) {
  const [collapsed, setCollapsed] = useState(() => new Set());
  const children = useMemo(() => {
    const map = {};
    nodes.forEach((n) => { (map[n.parent_id ?? "root"] = map[n.parent_id ?? "root"] || []).push(n); });
    return map;
  }, [nodes]);
  const parents = nodes.filter((n) => children[n.id]?.length).map((n) => n.id);
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
    const kids = children[node.id] || [];
    const open = !collapsed.has(node.id);
    if (excludeIds?.has(node.id)) return null;
    const disabled = node.status !== "ACTIVE";
    return (
      <Box key={node.id} sx={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? "none" : "auto" }}>
        {row(node.id, node.node_name, Number(value) === node.id, () => onChange(node.id), depth, <>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); if (kids.length) toggle(node.id); }} sx={{ width: 22, height: 22, visibility: kids.length ? "visible" : "hidden", pointerEvents: "auto" }}>
            {open ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ChevronRightIcon sx={{ fontSize: 14 }} />}
          </IconButton>
          <LocationOnOutlinedIcon color="primary" sx={{ fontSize: 13, flexShrink: 0 }} />
        </>)}
        {kids.length && open ? kids.map((k) => renderNode(k, depth + 1)) : null}
      </Box>
    );
  };
  return (
    <Box sx={{ flex: 1, minHeight: 280, display: "flex", flexDirection: "column", border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
      <Box sx={{ px: 1, py: 0.5, display: "flex", alignItems: "center", borderBottom: 1, borderColor: "divider", bgcolor: (th) => (th.palette.mode === "dark" ? "#182235" : "#F1F7FF") }}>
        <Typography sx={{ flex: 1, fontSize: 11, fontWeight: 800, pl: 0.5 }}>{title || t("moldMaster.hierarchy")}</Typography>
        <Tooltip title={t("moldMaster.ui.expandAll")}><IconButton size="small" onClick={() => setCollapsed(new Set())}><UnfoldMoreIcon sx={{ fontSize: 14.5 }} /></IconButton></Tooltip>
        <Tooltip title={t("moldMaster.ui.collapseAll")}><IconButton size="small" onClick={() => setCollapsed(new Set(parents))}><UnfoldLessIcon sx={{ fontSize: 14.5 }} /></IconButton></Tooltip>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 0.75 }}>
        {row("none", noneLabel || t("moldMaster.ui.notAssigned"), value === "" || value == null, () => onChange(""), 0,
          <Box sx={{ width: 22, display: "grid", placeItems: "center" }}><LocationOnOutlinedIcon color="disabled" sx={{ fontSize: 13 }} /></Box>)}
        {(children.root || []).map((n) => renderNode(n, 0))}
      </Box>
    </Box>
  );
}

function LocationTreeNode({
  node,
  allNodes,
  selectedId,
  expanded,
  onToggle,
  onSelect,
  depth = 0,
}) {
  const children = allNodes.filter((item) => item.parent_id === node.id);
  const open = expanded.includes(node.id);
  return (
    <Box>
      <Box
        onClick={() => onSelect(node.id)}
        sx={{
          minHeight: 30,
          pl: `${depth * 13 + 3}px`,
          pr: 0.5,
          display: "flex",
          alignItems: "center",
          gap: 0.35,
          cursor: "pointer",
          borderRadius: 1,
          bgcolor: selectedId === node.id ? "action.selected" : "transparent",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <IconButton
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            if (children.length) onToggle(node.id);
          }}
          sx={{ width: 19, height: 19 }}
        >
          {children.length ? (
            open ? (
              <ExpandMoreIcon sx={{ fontSize: 13.5 }} />
            ) : (
              <ChevronRightIcon sx={{ fontSize: 13.5 }} />
            )
          ) : (
            <Box sx={{ width: 16 }} />
          )}
        </IconButton>
        <LocationOnOutlinedIcon color="primary" sx={{ fontSize: 13.5 }} />
        <Typography
          noWrap
          title={node.node_name}
          sx={{ flex: 1, fontSize: 11.5, fontWeight: selectedId === node.id ? 800 : 600, color: node.status === "ACTIVE" ? "text.primary" : "text.disabled" }}
        >
          {node.node_name}
        </Typography>
        <Box sx={{ mr: 0.5, display: "flex" }}><CountBadge value={node.mold_count || 0} /></Box>
      </Box>
      {open &&
        children.map((child) => (
          <LocationTreeNode
            key={child.id}
            node={child}
            allNodes={allNodes}
            selectedId={selectedId}
            expanded={expanded}
            onToggle={onToggle}
            onSelect={onSelect}
            depth={depth + 1}
          />
        ))}
    </Box>
  );
}

function Field({ label, children }) {
  return (
    <Stack direction="row" spacing={1} sx={{ py: 0.45 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ width: 112, flexShrink: 0 }}
      >
        {label}
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 0, wordBreak: "break-word" }}>
        {children ?? "—"}
      </Typography>
    </Stack>
  );
}

function DynamicInput({ definition, value, onChange }) {
  const common = {
    fullWidth: true,
    size: "small",
    label: `${definition.attribute_name}${definition.unit ? ` (${definition.unit})` : ""}`,
    value: value ?? "",
    onChange: (e) => onChange(e.target.value),
    required: Boolean(definition.is_required),
  };
  if (definition.data_type === "BOOLEAN")
    return (
      <FormControlLabel
        control={
          <Switch
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
        }
        label={definition.attribute_name}
      />
    );
  if (definition.data_type === "SELECT")
    return (
      <TextField {...common} select>
        {(definition.select_options || []).map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label || option.value}
          </MenuItem>
        ))}
      </TextField>
    );
  if (definition.data_type === "MULTI_SELECT")
    return (
      <FormControl fullWidth size="small">
        <InputLabel>{definition.attribute_name}</InputLabel>
        <Select
          multiple
          label={definition.attribute_name}
          value={Array.isArray(value) ? value : []}
          onChange={(e) => onChange(e.target.value)}
        >
          {(definition.select_options || []).map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label || option.value}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  const type = ["INTEGER", "DECIMAL"].includes(definition.data_type)
    ? "number"
    : definition.data_type === "DATE"
      ? "date"
      : definition.data_type === "DATETIME"
        ? "datetime-local"
        : "text";
  return (
    <TextField {...common} type={type} multiline={definition.data_type === "LONG_TEXT"} minRows={definition.data_type === "LONG_TEXT" ? 2 : undefined} slotProps={{ inputLabel: ["DATE", "DATETIME"].includes(definition.data_type)
          ? { shrink: true }
          : undefined }} />
  );
}

const emptyMold = {
  mold_code: "",
  mold_name: "",
  mold_type: "",
  mold_group: "",
  cavity_count: 1,
  status: "AVAILABLE",
  current_location_id: "",
  design_shot: 0,
  current_shot: 0,
  weight_kg: "",
  length_mm: "",
  width_mm: "",
  height_mm: "",
  manufacturer: "",
  manufacture_date: "",
  image_url: "",
  description: "",
  remark: "",
  revision: "",
  pm_interval_shot: "",
  pm_interval_days: "",
  is_active: true,
  attributeMap: {},
  productIds: [],
};

function MoldDialog({
  open,
  mold,
  nodes,
  attributes,
  products,
  saving,
  onClose,
  onSave,
  t,
}) {
  const [form, setForm] = useState(emptyMold);
  const [tab, setTab] = useState(0);
  useEffect(() => {
    if (!open) return;
    const attributeMap = Object.fromEntries(
      (mold?.attribute_values || []).map((item) => [item.id, item.value]),
    );
    setForm(
      mold
        ? {
            ...emptyMold,
            ...mold,
            current_location_id: mold.current_location_id || "",
            manufacture_date: mold.manufacture_date || "",
            revision: mold.revision || "",
            pm_interval_shot: mold.pm_interval_shot ?? "",
            pm_interval_days: mold.pm_interval_days ?? "",
            attributeMap,
            productIds: (mold.products || []).map((item) => item.product_id),
          }
        : emptyMold,
    );
    setTab(0);
  }, [open, mold]);
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const submit = () =>
    onSave({
      ...form,
      current_location_id:
        form.current_location_id === ""
          ? null
          : Number(form.current_location_id),
      cavity_count: Number(form.cavity_count),
      design_shot: Number(form.design_shot || 0),
      current_shot: Number(form.current_shot || 0),
      weight_kg: form.weight_kg === "" ? null : Number(form.weight_kg),
      length_mm: form.length_mm === "" ? null : Number(form.length_mm),
      width_mm: form.width_mm === "" ? null : Number(form.width_mm),
      height_mm: form.height_mm === "" ? null : Number(form.height_mm),
      manufacture_date: form.manufacture_date || null,
      revision: form.revision?.trim() || null,
      pm_interval_shot: numOrNull(form.pm_interval_shot),
      pm_interval_days: numOrNull(form.pm_interval_days),
      attribute_values: attributes.map((item) => ({
        attribute_definition_id: item.id,
        value: form.attributeMap[item.id] ?? null,
      })),
      // keep cavity quantity / primary flag of links that already exist; new links take the mold's cavity count
      products: form.productIds.map((id, index) => {
        const old = (mold?.products || []).find((p) => Number(p.product_id) === Number(id));
        return old
          ? { product_id: Number(id), cavity_quantity: old.cavity_quantity ?? null, is_primary: Boolean(old.is_primary), status: old.status || "ACTIVE" }
          : { product_id: Number(id), cavity_quantity: Number(form.cavity_count) || null, is_primary: !(mold?.products || []).length && index === 0, status: "ACTIVE" };
      }),
    });
  const g = (cols) => ({ display: "grid", gridTemplateColumns: { xs: "1fr", sm: cols }, gap: 1.5, pt: 0.75 });
  const locationPath = (id) => {
    const names = [];
    let n = nodes.find((x) => x.id === Number(id));
    while (n) { names.unshift(n.node_name); n = nodes.find((x) => x.id === n.parent_id); }
    return names.join(" / ");
  };
  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="lg" slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogHeader icon={<Inventory2OutlinedIcon />} title={mold ? t("moldMaster.editMold") : t("moldMaster.addMold")}
        subtitle={t("moldMaster.ui.pickHint")} disabled={saving} onClose={onClose} />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "300px minmax(0,1fr)" }, gap: 2.5, mt: 1, height: { md: 560 } }}>
          <Stack spacing={0.75} sx={{ minHeight: 0 }}>
            <FieldLabel>{t("moldMaster.fields.location")}</FieldLabel>
            <LocationTreePicker nodes={nodes} value={form.current_location_id} onChange={(id) => set("current_location_id", id)} t={t} />
          </Stack>
          <Box sx={{ minHeight: 0, overflowY: "auto", pr: 0.5 }}>
            <Stack spacing={2.25}>
              <Stack spacing={0.5}>
                <FieldLabel>{t("moldMaster.ui.basic")}</FieldLabel>
                <Box sx={g("1fr 2fr")}>
                  <TextField size="small" required disabled={Boolean(mold)} label={t("moldMaster.fields.moldCode")} placeholder="VD: MD-001" value={form.mold_code} onChange={(e) => set("mold_code", e.target.value)} />
                  <TextField size="small" required label={t("moldMaster.fields.moldName")} value={form.mold_name} onChange={(e) => set("mold_name", e.target.value)} />
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 1, px: 1.25, py: 0.9, borderRadius: 1.5, bgcolor: (th) => (th.palette.mode === "dark" ? "#182235" : "#F1F7FF") }}>
                  <LocationOnOutlinedIcon color="primary" sx={{ fontSize: 13.5 }} />
                  <Typography variant="caption" color="text.secondary">{t("moldMaster.fields.location")}:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 0, overflowWrap: "anywhere", color: form.current_location_id ? "text.primary" : "text.disabled" }}>
                    {form.current_location_id ? locationPath(form.current_location_id) : t("moldMaster.ui.notAssigned")}
                  </Typography>
                </Box>
              </Stack>
              <Stack spacing={0.5}>
                <FieldLabel>{t("moldMaster.ui.classification")}</FieldLabel>
                <Box sx={g("1fr 1fr 1fr 1fr")}>
                  <TextField size="small" label={t("moldMaster.fields.moldType")} value={form.mold_type || ""} onChange={(e) => set("mold_type", e.target.value)} />
                  <TextField size="small" label={t("moldMaster.fields.moldGroup")} value={form.mold_group || ""} onChange={(e) => set("mold_group", e.target.value)} />
                  <TextField size="small" type="number" label={t("moldMaster.fields.cavity")} value={form.cavity_count} onChange={(e) => set("cavity_count", e.target.value)} />
                  <TextField select size="small" label={t("moldMaster.ui.recordStatus")} value={form.is_active ? "1" : "0"} onChange={(e) => set("is_active", e.target.value === "1")}>
                    <MenuItem value="1">{t("moldMaster.active")}</MenuItem>
                    <MenuItem value="0">{t("moldMaster.inactive")}</MenuItem>
                  </TextField>
                </Box>
              </Stack>
              <Stack spacing={0.5}>
                <FieldLabel>{t("moldMaster.ui.technical")}</FieldLabel>
                <Box sx={g("1fr 1fr 1fr")}>
                  <TextField size="small" type="number" label={t("moldMaster.fields.designShot")} value={form.design_shot} onChange={(e) => set("design_shot", e.target.value)} />
                  <TextField size="small" type="number" label={t("moldMaster.fields.weight")} value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} />
                  <TextField size="small" label={t("moldMaster.fields.revision")} value={form.revision || ""} onChange={(e) => set("revision", e.target.value)} />
                  <TextField size="small" type="number" label={t("moldMaster.fields.length")} value={form.length_mm} onChange={(e) => set("length_mm", e.target.value)} />
                  <TextField size="small" type="number" label={t("moldMaster.fields.width")} value={form.width_mm} onChange={(e) => set("width_mm", e.target.value)} />
                  <TextField size="small" type="number" label={t("moldMaster.fields.height")} value={form.height_mm} onChange={(e) => set("height_mm", e.target.value)} />
                  <TextField size="small" label={t("moldMaster.fields.manufacturer")} value={form.manufacturer || ""} onChange={(e) => set("manufacturer", e.target.value)} />
                  <TextField size="small" type="date" label={t("moldMaster.fields.manufactureDate")} value={form.manufacture_date || ""} onChange={(e) => set("manufacture_date", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                </Box>
              </Stack>
              <Stack spacing={0.5}>
                <FieldLabel>{t("moldMaster.ui.maintenance")}</FieldLabel>
                <Box sx={g("1fr 1fr")}>
                  <TextField size="small" type="number" label={t("moldMaster.fields.pmIntervalShot")} helperText={t("moldMaster.fields.pmIntervalShotHelp")} value={form.pm_interval_shot} onChange={(e) => set("pm_interval_shot", e.target.value)} />
                  <TextField size="small" type="number" label={t("moldMaster.fields.pmIntervalDays")} helperText={t("moldMaster.fields.pmIntervalDaysHelp")} value={form.pm_interval_days} onChange={(e) => set("pm_interval_days", e.target.value)} />
                </Box>
              </Stack>
              {attributes.length ? (
                <Stack spacing={0.5}>
                  <FieldLabel>{t("moldMaster.customFields")}</FieldLabel>
                  <Box sx={g("1fr 1fr")}>
                    {attributes.map((item) => (
                      <DynamicInput key={item.id} definition={item} value={form.attributeMap[item.id]}
                        onChange={(value) => setForm((old) => ({ ...old, attributeMap: { ...old.attributeMap, [item.id]: value } }))} />
                    ))}
                  </Box>
                </Stack>
              ) : null}
              <Stack spacing={0.5}>
                <FieldLabel>{t("moldMaster.products")}</FieldLabel>
                <FormControl fullWidth size="small" sx={{ mt: 0.75 }}>
                  <InputLabel>{t("moldMaster.fields.linkedProducts")}</InputLabel>
                  <Select multiple label={t("moldMaster.fields.linkedProducts")} value={form.productIds} onChange={(e) => set("productIds", e.target.value)}
                    renderValue={(ids) => ids.map((id) => products.find((p) => p.id === Number(id))?.product_code).filter(Boolean).join(", ")}>
                    {products.map((item) => <MenuItem key={item.id} value={item.id}>{item.product_code} — {item.product_name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>
              <ImageUploadField value={form.image_url || ""} category="mold" label={t("moldMaster.fields.image", { defaultValue: "Image" })} onChange={(v) => set("image_url", v || "")} />
              <TextField size="small" multiline minRows={2} label={t("moldMaster.fields.description")} value={form.description || ""} onChange={(e) => set("description", e.target.value)} />
              <TextField size="small" multiline minRows={2} label={t("moldMaster.fields.remark")} value={form.remark || ""} onChange={(e) => set("remark", e.target.value)} />
            </Stack>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.25, borderTop: 1, borderColor: "divider", bgcolor: (th) => (th.palette.mode === "dark" ? "#0F172A" : "#F8FAFC") }}>
        <Button disabled={saving || !form.mold_code.trim() || !form.mold_name.trim()} onClick={submit} sx={buttonSx("primary")}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>{t("moldMaster.save")}</Button>
      </DialogActions>
    </Dialog>
  );
}


// Settings → mold location tree: tree on the left, details / inline form of the clicked location on the right.
function LocationTreeManager({ open, nodes, nodeTypes, canEdit, onClose, onReload, request, actor, t, lang }) {
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("view"); // view | new | edit
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const children = useMemo(() => {
    const map = {};
    nodes.forEach((n) => { (map[n.parent_id ?? "root"] = map[n.parent_id ?? "root"] || []).push(n); });
    return map;
  }, [nodes]);
  useEffect(() => { if (open) { setMode("view"); setError(""); } }, [open]);
  useEffect(() => {
    if (open && !nodes.some((n) => n.id === selectedId)) setSelectedId(children.root?.[0]?.id ?? nodes[0]?.id ?? null);
  }, [open, nodes, children, selectedId]);
  const selected = nodes.find((n) => n.id === selectedId) || null;
  const byId = (id) => nodes.find((n) => n.id === id);
  const pathOf = (node) => {
    const names = [];
    let n = node;
    while (n) { names.unshift(n.node_name); n = byId(n.parent_id); }
    return names.join(" / ");
  };
  const descendants = (id) => {
    const out = new Set([id]);
    const walk = (x) => (children[x] || []).forEach((c) => { out.add(c.id); walk(c.id); });
    walk(id);
    return out;
  };
  const parents = nodes.filter((n) => children[n.id]?.length).map((n) => n.id);
  const toggle = (id) => setCollapsed((old) => { const next = new Set(old); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const kidsOf = (id) => children[id]?.length || 0;

  const startNew = (parent) => {
    const activeTypes = nodeTypes.filter((x) => x.is_active).sort((a, b) => (a.level_order || 0) - (b.level_order || 0));
    // suggest the type one level below the parent's
    const parentLevel = parent ? nodeTypes.find((x) => x.id === parent.node_type_id)?.level_order || 0 : 0;
    const type = activeTypes.find((x) => (x.level_order || 0) > parentLevel) || activeTypes[0];
    setForm({ node_code: "", node_name: "", node_type_id: type?.id ?? "", parent_id: parent?.id ?? "", capacity: "", sort_order: (parent ? kidsOf(parent.id) : children.root?.length || 0) + 1, status: "ACTIVE", description: "" });
    setError(""); setMode("new");
  };
  const startEdit = (n) => {
    setForm({ node_code: n.node_code, node_name: n.node_name, node_type_id: n.node_type_id, parent_id: n.parent_id ?? "", capacity: n.capacity ?? "", sort_order: n.sort_order ?? 0, status: n.status || "ACTIVE", description: n.description || "" });
    setError(""); setMode("edit");
  };
  const run = async (fn) => {
    setBusy(true); setError("");
    try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const save = () => run(async () => {
    const base = `${API_BASE}/api/mold-master/location-nodes`;
    const payload = {
      node_name: form.node_name.trim(), node_type_id: Number(form.node_type_id), parent_id: form.parent_id === "" ? null : Number(form.parent_id),
      sort_order: Number(form.sort_order || 0), capacity: numOrNull(form.capacity), status: form.status, description: form.description || null,
      ...(mode === "edit" ? { updated_by: actor } : { node_code: form.node_code.trim(), created_by: actor }),
    };
    const res = await request(mode === "edit" ? `${base}/${selected.id}` : base, { method: mode === "edit" ? "PUT" : "POST", body: JSON.stringify(payload) });
    await onReload();
    if (mode === "new" && res?.id) setSelectedId(res.id);
    if (payload.parent_id) setCollapsed((old) => { const next = new Set(old); next.delete(payload.parent_id); return next; });
    setMode("view");
  });
  const toggleStatus = () => run(async () => {
    await request(`${API_BASE}/api/mold-master/location-nodes/${selected.id}/status`, { method: "PATCH", body: JSON.stringify({ status: selected.status === "ACTIVE" ? "INACTIVE" : "ACTIVE", updated_by: actor }) });
    await onReload();
  });
  const remove = () => {
    if (!window.confirm(t("moldMaster.messages.confirmDelete"))) return;
    run(async () => {
      await request(`${API_BASE}/api/mold-master/location-nodes/${selected.id}`, { method: "DELETE" });
      setSelectedId(selected.parent_id ?? null);
      await onReload();
    });
  };

  const renderNode = (node, depth) => {
    const kids = children[node.id] || [];
    const isOpen = !collapsed.has(node.id);
    const isSel = node.id === selectedId;
    return (
      <Box key={node.id}>
        <Box onClick={() => { if (mode === "view") setSelectedId(node.id); }} sx={{ minHeight: 27, pl: `${depth * 16 + 2}px`, pr: 0.75, display: "flex", alignItems: "center", gap: 0.5, borderRadius: 1,
          cursor: mode === "view" ? "pointer" : "default", bgcolor: isSel ? "action.selected" : "transparent", "&:hover": { bgcolor: isSel ? "action.selected" : "action.hover" } }}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); if (kids.length) toggle(node.id); }} sx={{ width: 22, height: 22, visibility: kids.length ? "visible" : "hidden" }}>
            {isOpen ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ChevronRightIcon sx={{ fontSize: 14 }} />}
          </IconButton>
          {kids.length
            ? <AccountTreeOutlinedIcon color="primary" sx={{ fontSize: 13.5, flexShrink: 0 }} />
            : <LocationOnOutlinedIcon sx={{ fontSize: 13, flexShrink: 0, color: "text.secondary" }} />}
          <Typography noWrap title={`${node.node_code} · ${node.node_name}`} sx={{ flex: 1, minWidth: 0, fontSize: 11.5, fontWeight: isSel ? 800 : depth ? 600 : 700, color: node.status === "ACTIVE" ? "text.primary" : "text.disabled" }}>{node.node_name}</Typography>
          <CountBadge value={node.mold_count || 0} />
        </Box>
        {kids.length && isOpen ? kids.map((k) => renderNode(k, depth + 1)) : null}
      </Box>
    );
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const sectionLabel = (text) => <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: "text.secondary" }}>{text}</Typography>;
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
  const valid = form.node_name?.trim() && form.node_type_id && (mode === "edit" || form.node_code?.trim());

  return (
    <Dialog open={open} fullWidth maxWidth="lg" onClose={busy ? undefined : onClose} slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogHeader icon={<AccountTreeOutlinedIcon />} title={t("moldMaster.hierarchy")} subtitle={t("moldMaster.ui.locSubtitle")} disabled={busy} onClose={onClose} />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "380px minmax(0,1fr)" }, gap: 2.5, mt: 1, height: { md: 470 } }}>
          {/* left: tree */}
          <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
            <Box sx={{ px: 1, py: 0.5, display: "flex", alignItems: "center", borderBottom: 1, borderColor: "divider", bgcolor: (th) => (th.palette.mode === "dark" ? "#182235" : "#F1F7FF") }}>
              <Typography sx={{ flex: 1, fontSize: 11, fontWeight: 800, pl: 0.5 }}>{t("moldMaster.ui.locCount", { count: nodes.length })}</Typography>
              <Tooltip title={t("moldMaster.ui.expandAll")}><IconButton size="small" onClick={() => setCollapsed(new Set())}><UnfoldMoreIcon sx={{ fontSize: 14.5 }} /></IconButton></Tooltip>
              <Tooltip title={t("moldMaster.ui.collapseAll")}><IconButton size="small" onClick={() => setCollapsed(new Set(parents))}><UnfoldLessIcon sx={{ fontSize: 14.5 }} /></IconButton></Tooltip>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 0.75 }}>
              {(children.root || []).map((n) => renderNode(n, 0))}
            </Box>
            <Box sx={{ p: 1, borderTop: 1, borderColor: "divider" }}>
              <Button fullWidth variant="contained" disabled={!canEdit || busy || mode !== "view"} onClick={() => startNew(null)} startIcon={<AddIcon />} sx={buttonSx("primary")}>{t("moldMaster.addNode")}</Button>
            </Box>
          </Box>

          {/* right: details, or the add / edit form */}
          <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, border: 1, borderColor: mode === "view" ? "divider" : "primary.main", borderRadius: 1.5, overflow: "hidden" }}>
            {mode !== "view" ? (
              <>
                {header(mode === "edit" ? <EditOutlinedIcon sx={{ fontSize: 18 }} /> : <AddIcon sx={{ fontSize: 18 }} />,
                  mode === "edit" ? `${t("moldMaster.edit")} · ${selected?.node_name}` : t("moldMaster.addNode"),
                  mode === "edit" ? selected?.node_code : form.parent_id ? `${t("moldMaster.fields.parent")}: ${pathOf(byId(Number(form.parent_id)))}` : t("moldMaster.ui.rootLocation"))}
                <Divider />
                <Box sx={{ p: 1.5, flex: 1, minHeight: 0, overflowY: "auto", display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0,1fr) minmax(0,1fr)" }, gap: 2 }}>
                  <Stack spacing={1.5}>
                    {sectionLabel(t("moldMaster.general"))}
                    <TextField size="small" required disabled={mode === "edit"} label={t("moldMaster.fields.code")} value={form.node_code} onChange={(e) => setForm((f) => ({ ...f, node_code: e.target.value.toUpperCase() }))} />
                    <TextField size="small" required label={t("moldMaster.fields.name")} value={form.node_name} onChange={set("node_name")} />
                    <TextField select size="small" required label={t("moldMaster.ui.locType")} value={form.node_type_id} onChange={set("node_type_id")}>
                      {[...nodeTypes].sort((a, b) => (a.level_order || 0) - (b.level_order || 0)).filter((x) => x.is_active || x.id === form.node_type_id).map((x) => <MenuItem key={x.id} value={x.id}>{x.type_name}</MenuItem>)}
                    </TextField>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                      <TextField size="small" type="number" label={t("moldMaster.fields.capacity")} value={form.capacity} onChange={set("capacity")} />
                      <TextField size="small" type="number" label={t("moldMaster.ui.sortOrder")} value={form.sort_order} onChange={set("sort_order")} />
                    </Box>
                    <TextField select size="small" label={t("moldMaster.ui.recordStatus")} value={form.status} onChange={set("status")}>
                      <MenuItem value="ACTIVE">{t("moldMaster.active")}</MenuItem>
                      <MenuItem value="INACTIVE">{t("moldMaster.inactive")}</MenuItem>
                    </TextField>
                    <TextField size="small" multiline minRows={2} label={t("moldMaster.fields.description")} value={form.description} onChange={set("description")} />
                  </Stack>
                  <Stack spacing={1.5} sx={{ minHeight: 280 }}>
                    {sectionLabel(t("moldMaster.fields.parent"))}
                    <LocationTreePicker nodes={nodes} value={form.parent_id} onChange={(v) => setForm((f) => ({ ...f, parent_id: v }))} t={t}
                      title={t("moldMaster.hierarchy")} noneLabel={t("moldMaster.ui.rootLocation")} excludeIds={mode === "edit" && selected ? descendants(selected.id) : undefined} />
                  </Stack>
                </Box>
                {error ? <Alert severity="error" sx={{ mx: 1.5, mb: 1 }}>{error}</Alert> : null}
                <Divider />
                <Stack direction="row" sx={{ p: 1.5, justifyContent: "flex-end", gap: 1, flexShrink: 0, bgcolor: (th) => (th.palette.mode === "dark" ? "rgba(255,255,255,.02)" : "#F8FAFC") }}>
                  <Button disabled={busy} onClick={() => { setMode("view"); setError(""); }} sx={buttonSx("cancel")}>{t("moldMaster.ui.discard")}</Button>
                  <Button disabled={busy || !valid} onClick={save} sx={buttonSx("primary")} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}>{t("moldMaster.save")}</Button>
                </Stack>
              </>
            ) : selected ? (
              <>
                {header(kidsOf(selected.id) ? <AccountTreeOutlinedIcon sx={{ fontSize: 18 }} /> : <LocationOnOutlinedIcon sx={{ fontSize: 18 }} />,
                  selected.node_name, selected.node_code, <ActivePill active={selected.status === "ACTIVE"} t={t} />)}
                <Box sx={{ px: 1.5, pb: 1.5, flex: 1, minHeight: 0, overflowY: "auto" }}>
                  <Stack spacing={1.5}>
                    <DetailSection title={t("moldMaster.general")}>
                      <DetailRow label={t("moldMaster.ui.path")}>{pathOf(selected)}</DetailRow>
                      <DetailRow label={t("moldMaster.fields.parent")}>{byId(selected.parent_id)?.node_name || t("moldMaster.ui.rootLocation")}</DetailRow>
                      <DetailRow label={t("moldMaster.ui.locType")}>{selected.type_name || "—"}</DetailRow>
                      <DetailRow label={t("moldMaster.ui.childCount")}>{kidsOf(selected.id)}</DetailRow>
                      <DetailRow label={t("moldMaster.ui.moldCount")}>{selected.mold_count || 0}</DetailRow>
                      <DetailRow label={t("moldMaster.fields.capacity")}>{selected.capacity ?? t("moldMaster.ui.unlimited")}</DetailRow>
                      <DetailRow label={t("moldMaster.ui.sortOrder")}>{selected.sort_order ?? 0}</DetailRow>
                      <DetailRow label={t("moldMaster.fields.description")} last>{selected.description || "—"}</DetailRow>
                    </DetailSection>
                    <DetailSection title={t("moldMaster.ui.record")}>
                      <DetailRow label={t("moldMaster.ui.createdBy")}>{person(selected.created_by_name, selected.created_by_code || selected.created_by)}</DetailRow>
                      <DetailRow label={t("moldMaster.ui.createdAt")}>{dateText(selected.created_at, lang)}</DetailRow>
                      <DetailRow label={t("moldMaster.ui.updatedBy")}>{selected.updated_by ? person(selected.updated_by_name, selected.updated_by_code || selected.updated_by) : "—"}</DetailRow>
                      <DetailRow label={t("moldMaster.ui.updatedAt")} last>{dateText(selected.updated_at, lang)}</DetailRow>
                    </DetailSection>
                  </Stack>
                </Box>
                {error ? <Alert severity="error" sx={{ mx: 1.5, mb: 1 }}>{error}</Alert> : null}
                <Divider />
                <Stack direction="row" sx={{ p: 1.5, justifyContent: "center", gap: 1.5, flexShrink: 0 }}>
                  <ActionIcon title={t("moldMaster.ui.addChild")} icon={<AddIcon fontSize="small" />} color="primary" disabled={!canEdit || busy} onClick={() => startNew(selected)} />
                  <ActionIcon title={t("moldMaster.edit")} icon={<EditOutlinedIcon fontSize="small" />} disabled={!canEdit || busy} onClick={() => startEdit(selected)} />
                  <ActionIcon title={selected.status === "ACTIVE" ? t("moldMaster.ui.deactivate") : t("moldMaster.ui.activate")}
                    icon={selected.status === "ACTIVE" ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
                    color={selected.status === "ACTIVE" ? "warning" : "success"} disabled={!canEdit || busy} onClick={toggleStatus} />
                  <ActionIcon title={kidsOf(selected.id) ? t("moldMaster.ui.deleteChildrenFirst") : selected.mold_count ? t("moldMaster.ui.hasMolds") : t("moldMaster.ui.deleteLocation")}
                    icon={<DeleteOutlineIcon fontSize="small" />} color="error" disabled={!canEdit || busy || Boolean(kidsOf(selected.id)) || Boolean(selected.mold_count)} onClick={remove} />
                </Stack>
              </>
            ) : (
              <Box sx={{ flex: 1, display: "grid", placeItems: "center", p: 2 }}>
                <Typography variant="body2" color="text.secondary">{t("moldMaster.ui.selectLocation")}</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}


// Settings → location types / custom fields: table on the left, details or the inline form on the right
// (same layout as the managers on the Machine & Equipment page).
const MOLD_MANAGER = {
  type: { segment: "location-node-types", code: "type_code", name: "type_name", icon: CategoryOutlinedIcon, title: "moldMaster.nodeTypes", subtitle: "moldMaster.ui.typesSubtitle", add: "moldMaster.addNodeType" },
  field: { segment: "attributes", code: "attribute_code", name: "attribute_name", icon: TuneOutlinedIcon, title: "moldMaster.manageFields", subtitle: "moldMaster.ui.fieldsSubtitle", add: "moldMaster.addField" },
};

function MoldSettingsManager({ open, kind, rows: rawRows, canEdit, request, actor, onClose, onReload, notify, t }) {
  const conf = MOLD_MANAGER[kind] || MOLD_MANAGER.type;
  const Icon = conf.icon;
  const rows = useMemo(() => [...rawRows].sort((a, b) => (kind === "type" ? (a.level_order || 0) - (b.level_order || 0) : 0) || (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id), [rawRows, kind]);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("view"); // view | edit | new
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) setMode("view"); }, [open, kind]);
  useEffect(() => { if (open && !rows.some((r) => r.id === selectedId)) setSelectedId(rows[0]?.id ?? null); }, [open, rows, selectedId]);
  const selected = rows.find((r) => r.id === selectedId) || null;
  const yesNo = (v) => (v ? t("moldMaster.ui.yes") : t("moldMaster.ui.no"));
  const dataTypeText = (v) => t(`moldMaster.ui.dataTypeNames.${v}`, v || "—");
  const categoryText = (v) => t(`moldMaster.locationCategory.${v}`, v || "—");
  const usage = (item) => (kind === "type" ? Number(item?.node_count || 0) : 0);

  const toForm = (item) => (kind === "type"
    ? { code: item?.type_code || "", name: item?.type_name || "", category: item?.location_category || "STORAGE", level: item?.level_order ?? 1, sort: item?.sort_order ?? 0, active: item ? Boolean(item.is_active) : true, description: item?.description || "" }
    : { code: item?.attribute_code || "", name: item?.attribute_name || "", dataType: item?.data_type || "TEXT", unit: item?.unit || "", required: Boolean(item?.is_required), showInList: Boolean(item?.show_in_list),
        searchable: Boolean(item?.is_searchable), filterable: Boolean(item?.is_filterable), sort: item?.sort_order ?? 0, active: item ? Boolean(item.is_active) : true, description: item?.description || "",
        options: (item?.select_options || []).map((x) => `${x.value}|${x.label || x.value}`).join("\n") });
  const toPayload = (f, isNew) => {
    const who = isNew ? { created_by: actor } : { updated_by: actor };
    if (kind === "type") return { ...who, ...(isNew ? { type_code: f.code.trim().toUpperCase() } : {}), type_name: f.name.trim(), location_category: f.category, level_order: Number(f.level || 1), sort_order: Number(f.sort || 0), is_active: Boolean(f.active), description: f.description.trim() || null };
    const hasOptions = ["SELECT", "MULTI_SELECT"].includes(f.dataType);
    return {
      ...who, ...(isNew ? { attribute_code: f.code.trim(), data_type: f.dataType } : {}), attribute_name: f.name.trim(), unit: f.unit.trim() || null,
      select_options: hasOptions ? f.options.split("\n").map((l) => l.trim()).filter(Boolean).map((line) => { const [value, label] = line.split("|"); return { value: value.trim(), label: (label || value).trim() }; }) : null,
      is_required: Boolean(f.required), show_in_list: Boolean(f.showInList), is_searchable: Boolean(f.searchable), is_filterable: Boolean(f.filterable),
      sort_order: Number(f.sort || 0), is_active: Boolean(f.active), description: f.description.trim() || null,
    };
  };
  const base = `${API_BASE}/api/mold-master/${conf.segment}`;
  const submit = async (f, isNew, item) => {
    setSaving(true);
    try {
      const result = await request(isNew ? base : `${base}/${item.id}`, { method: isNew ? "POST" : "PUT", body: JSON.stringify(toPayload(f, isNew)) });
      await onReload();
      if (isNew && result?.id) setSelectedId(result.id);
      setMode("view");
      notify("success", t("moldMaster.messages.saved"));
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const remove = async (item) => {
    if (!window.confirm(t("moldMaster.messages.confirmDelete"))) return;
    setSaving(true);
    try {
      await request(`${base}/${item.id}`, { method: "DELETE" });
      await onReload(); setSelectedId(null);
      notify("success", t("moldMaster.ui.deleted"));
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const change = (key) => (e) => setForm((old) => ({ ...old, [key]: e.target.value }));

  const statusCol = { headerName: t("moldMaster.fields.status"), field: "is_active", minWidth: 110, flex: 0.6, cellRenderer: (p) => <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}><ActivePill active={Boolean(p.value)} t={t} /></Box> };
  const cols = kind === "type" ? [
    { headerName: t("moldMaster.fields.code"), field: "type_code", width: 140, pinned: "left" },
    { headerName: t("moldMaster.fields.name"), field: "type_name", minWidth: 160, flex: 1.4 },
    { headerName: t("moldMaster.fields.locationCategory"), field: "location_category", minWidth: 130, flex: 1, valueFormatter: (p) => categoryText(p.value) },
    { headerName: t("moldMaster.fields.level"), field: "level_order", minWidth: 70, flex: 0.45, cellStyle: { justifyContent: "center" } },
    { headerName: t("moldMaster.ui.locationsCol"), field: "node_count", minWidth: 90, flex: 0.55, cellStyle: { justifyContent: "center" }, valueFormatter: (p) => p.value ?? 0 },
    statusCol,
  ] : [
    { headerName: t("moldMaster.fields.code"), field: "attribute_code", width: 150, pinned: "left" },
    { headerName: t("moldMaster.fields.name"), field: "attribute_name", minWidth: 160, flex: 1.4 },
    { headerName: t("moldMaster.ui.dataType"), field: "data_type", minWidth: 115, flex: 0.8, valueFormatter: (p) => dataTypeText(p.value) },
    { headerName: t("moldMaster.fields.unit"), field: "unit", minWidth: 80, flex: 0.5, valueFormatter: (p) => p.value || "—" },
    { headerName: t("moldMaster.fields.required"), field: "is_required", minWidth: 90, flex: 0.5, cellStyle: { justifyContent: "center" }, valueFormatter: (p) => yesNo(p.value) },
    statusCol,
  ];

  const editing = mode !== "view";
  const isNew = mode === "new";
  const valid = form && form.code.trim() && form.name.trim();
  const inUse = usage(selected);

  const boolSelect = (label, key) => (
    <FormControl fullWidth size="small">
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={form[key]} onChange={change(key)}>
        <MenuItem value={true}>{t("moldMaster.ui.yes")}</MenuItem><MenuItem value={false}>{t("moldMaster.ui.no")}</MenuItem>
      </Select>
    </FormControl>
  );
  const statusSelect = () => (
    <FormControl fullWidth size="small">
      <InputLabel>{t("moldMaster.fields.status")}</InputLabel>
      <Select label={t("moldMaster.fields.status")} value={form.active} onChange={change("active")}>
        <MenuItem value={true}>{t("moldMaster.active")}</MenuItem><MenuItem value={false}>{t("moldMaster.inactive")}</MenuItem>
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
          <ActivePill active={Boolean(selected.is_active)} t={t} />
        </Box>
      </Box>
      <Box sx={{ px: 1.5, pb: 1.5, flex: 1, minHeight: 0, overflowY: "auto" }}>
        <DetailSection title={t("moldMaster.general")}>
          {kind === "type" ? <>
            <DetailRow label={t("moldMaster.fields.locationCategory")}>{categoryText(selected.location_category)}</DetailRow>
            <DetailRow label={t("moldMaster.fields.level")}>{selected.level_order ?? 1}</DetailRow>
            <DetailRow label={t("moldMaster.ui.locationsCol")}>{selected.node_count ?? 0}</DetailRow>
          </> : <>
            <DetailRow label={t("moldMaster.ui.dataType")}>{dataTypeText(selected.data_type)}</DetailRow>
            <DetailRow label={t("moldMaster.fields.unit")}>{selected.unit || "—"}</DetailRow>
            <DetailRow label={t("moldMaster.fields.required")}>{yesNo(selected.is_required)}</DetailRow>
            <DetailRow label={t("moldMaster.fields.showInList")}>{yesNo(selected.show_in_list)}</DetailRow>
            {["SELECT", "MULTI_SELECT"].includes(selected.data_type)
              ? <DetailRow label={t("moldMaster.ui.options")}>{(selected.select_options || []).map((o) => o.label || o.value).join(", ") || "—"}</DetailRow> : null}
          </>}
          <DetailRow label={t("moldMaster.ui.sortOrder")}>{selected.sort_order ?? 0}</DetailRow>
          <DetailRow label={t("moldMaster.fields.description")} last>{selected.description || "—"}</DetailRow>
        </DetailSection>
      </Box>
      <Divider />
      <Stack direction="row" sx={{ p: 1.5, minHeight: 64, boxSizing: "border-box", justifyContent: "center", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
        <ActionIcon title={t("moldMaster.edit")} icon={<EditOutlinedIcon fontSize="small" />} disabled={!canEdit || saving} onClick={() => { setForm(toForm(selected)); setMode("edit"); }} />
        <ActionIcon title={selected.is_active ? t("moldMaster.ui.deactivate") : t("moldMaster.ui.activate")} color={selected.is_active ? "warning" : "success"}
          icon={selected.is_active ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
          disabled={!canEdit || saving} onClick={() => submit({ ...toForm(selected), active: !selected.is_active }, false, selected)} />
        <ActionIcon title={inUse ? t("moldMaster.ui.typeInUse") : t("moldMaster.ui.deleteItem")} icon={<DeleteOutlineIcon fontSize="small" />} color="error"
          disabled={!canEdit || saving || Boolean(inUse)} onClick={() => remove(selected)} />
      </Stack>
    </>
  ) : (
    <Box sx={{ flex: 1, display: "grid", placeItems: "center", p: 2 }}><Typography variant="body2" color="text.secondary">{t("moldMaster.ui.selectRow")}</Typography></Box>
  );

  const formPanel = form ? (
    <>
      <Box sx={{ px: 1.5, py: 1.25, flexShrink: 0, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
        {isNew ? <AddIcon color="primary" fontSize="small" /> : <EditOutlinedIcon color="primary" fontSize="small" />}
        <Typography noWrap sx={{ fontSize: 12, fontWeight: 800 }}>{isNew ? t(conf.add) : `${t("moldMaster.edit")} · ${selected?.[conf.name] || ""}`}</Typography>
      </Box>
      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, overflowY: "auto" }}>
        <Stack spacing={2}>
          <Stack spacing={1.25}>
            <FieldLabel>{t("moldMaster.ui.basic")}</FieldLabel>
            <TextField fullWidth required size="small" label={t("moldMaster.fields.code")} disabled={!isNew} value={form.code}
              onChange={(e) => setForm((o) => ({ ...o, code: kind === "type" ? e.target.value.toUpperCase() : e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
              helperText={kind === "field" && isNew ? t("moldMaster.ui.fieldCodeHelp") : undefined} />
            <TextField fullWidth required size="small" label={t("moldMaster.fields.name")} value={form.name} onChange={change("name")} />
          </Stack>
          <Stack spacing={1.25}>
            <FieldLabel>{t("moldMaster.ui.classification")}</FieldLabel>
            {kind === "type" ? <>
              <FormControl fullWidth size="small">
                <InputLabel>{t("moldMaster.fields.locationCategory")}</InputLabel>
                <Select label={t("moldMaster.fields.locationCategory")} value={form.category} onChange={change("category")}>
                  {LOCATION_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{categoryText(c)}</MenuItem>)}
                </Select>
              </FormControl>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.25 }}>
                <TextField fullWidth size="small" type="number" label={t("moldMaster.fields.level")} value={form.level} onChange={change("level")} />
                <TextField fullWidth size="small" type="number" label={t("moldMaster.ui.sortOrder")} value={form.sort} onChange={change("sort")} />
                {statusSelect()}
              </Box>
            </> : <>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t("moldMaster.ui.dataType")}</InputLabel>
                  <Select label={t("moldMaster.ui.dataType")} value={form.dataType} disabled={!isNew} onChange={change("dataType")}>
                    {DATA_TYPES.map((d) => <MenuItem key={d} value={d}>{dataTypeText(d)}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField fullWidth size="small" label={t("moldMaster.fields.unit")} placeholder="VD: mm, kg, °C" value={form.unit} onChange={change("unit")} />
              </Box>
              {["SELECT", "MULTI_SELECT"].includes(form.dataType)
                ? <TextField fullWidth multiline minRows={3} size="small" label={t("moldMaster.ui.options")} helperText={t("moldMaster.ui.optionsHelp")} value={form.options} onChange={change("options")} /> : null}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25 }}>
                {boolSelect(t("moldMaster.fields.required"), "required")}
                {boolSelect(t("moldMaster.fields.showInList"), "showInList")}
                <TextField fullWidth size="small" type="number" label={t("moldMaster.ui.sortOrder")} value={form.sort} onChange={change("sort")} />
                {statusSelect()}
              </Box>
            </>}
          </Stack>
          <TextField fullWidth multiline minRows={3} label={t("moldMaster.fields.description")} value={form.description} onChange={change("description")} />
        </Stack>
      </Box>
      <Divider />
      <Stack direction="row" sx={{ p: 1.5, minHeight: 64, boxSizing: "border-box", justifyContent: "flex-end", alignItems: "center", gap: 1, flexShrink: 0 }}>
        <Button disabled={saving} onClick={() => setMode("view")} sx={buttonSx("cancel")}>{t("moldMaster.ui.discard")}</Button>
        <Button disabled={saving || !valid} onClick={() => submit(form, isNew, selected)} sx={buttonSx("primary")} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>{t("moldMaster.save")}</Button>
      </Stack>
    </>
  ) : null;

  return (
    <Dialog open={open} fullWidth maxWidth="lg" onClose={saving ? undefined : onClose} slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogHeader icon={<Icon />} title={t(conf.title)} subtitle={t(conf.subtitle)} disabled={saving} onClose={onClose} />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0,1fr) 380px" }, gap: 2.5, mt: 1, height: { md: 500 } }}>
          {/* left: table; its footer row has the right panel's footer height so the buttons line up */}
          <Box sx={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
            <Box sx={{ flex: 1, minHeight: 300 }}>
              <AgGridTable rowData={rows} columnDefs={cols} height="100%" getRowId={(p) => String(p.data.id)}
                onRowClicked={(e) => { if (!editing) setSelectedId(e.data.id); }} />
            </Box>
            <Stack direction="row" sx={{ minHeight: 66, boxSizing: "border-box", alignItems: "center", flexShrink: 0 }}>
              <Button variant="contained" disabled={!canEdit || saving || editing} startIcon={<AddIcon />} onClick={() => { setForm(toForm(null)); setMode("new"); }} sx={buttonSx("primary")}>{t(conf.add)}</Button>
              <Box sx={{ flex: 1 }} />
              <Typography variant="caption" color="text.secondary">{rows.length} {t("moldMaster.ui.rows")}</Typography>
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

export default function MoldMaster() {
  const { t, i18n } = useTranslation();
  const { theme } = useAppTheme();
  const dark = theme === "dark";
  const muiTheme = useMemo(
    () => createMoldTheme(dark ? "dark" : "light"),
    [dark],
  );
  const permission = usePagePermission("mold");
  const canEdit = permission?.canEdit ?? true;
  const currentUser = getCurrentUser?.() || {};
  // the employee code is stored so the name can be looked up ("Họ tên - Mã") like on the other pages
  const actor = currentUser.employee_code || null;
  const [stats, setStats] = useState(EMPTY_STATS);
  const [nodes, setNodes] = useState([]);
  const [nodeTypes, setNodeTypes] = useState([]);
  const [molds, setMolds] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [locationId, setLocationId] = useState(null);
  const [expanded, setExpanded] = useState([]);
  const [detailTab, setDetailTab] = useState(0);
  const [detailVersion, setDetailVersion] = useState(0); // bumped after a save so the open detail reloads
  const [filters, setFilters] = useState({
    keyword: "",
    active: "",
    moldType: "",
    moldGroup: "",
  });
  const [loading, setLoading] = useState(true);
  const [panelsRef, panelHeight] = useFillHeight();
  const [saving, setSaving] = useState(false);
  const [moldDialog, setMoldDialog] = useState(null);
  const [fieldManager, setFieldManager] = useState(false);
  const [hierarchyDialog, setHierarchyDialog] = useState(null); // null | 0 locations | 1 location types
  const [message, setMessage] = useState(null);
  const notify = useCallback((severity, text) => setMessage({ severity, text }), []);

  const request = useCallback(async (url, options = {}) => {
    const token = getAccessToken?.();
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    const data =
      response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok)
      throw new Error(data?.detail || `HTTP ${response.status}`);
    return data;
  }, []);

  const loadReference = useCallback(async () => {
    const [statData, nodeData, typeData, attrData, productData] =
      await Promise.all([
        request(`${API_BASE}/api/mold-master/statistics`),
        request(`${API_BASE}/api/mold-master/location-nodes?tree=false`),
        request(`${API_BASE}/api/mold-master/location-node-types`),
        request(
          `${API_BASE}/api/mold-master/attributes?include_inactive=false`,
        ),
        request(`${API_BASE}/api/mold-master/products/lookup?limit=200`),
      ]);
    setStats({ ...EMPTY_STATS, ...statData });
    setNodes(nodeData || []);
    setNodeTypes(typeData || []);
    setAttributes(attrData || []);
    setProducts(productData || []);
    setExpanded((nodeData || []).map((x) => x.id));
  }, [request]);

  const loadMolds = useCallback(async () => {
    const params = new URLSearchParams({ page: "1", page_size: "500" });
    if (filters.keyword.trim()) params.set("keyword", filters.keyword.trim());
    if (filters.active) params.set("is_active", filters.active);
    if (filters.moldType) params.set("mold_type", filters.moldType);
    if (filters.moldGroup) params.set("mold_group", filters.moldGroup);
    if (locationId) params.set("location_id", locationId);
    const data = await request(`${API_BASE}/api/mold-master/molds?${params}`);
    setMolds(data.items || []);
    if (selectedId && !(data.items || []).some((x) => x.id === selectedId))
      setSelectedId(null);
  }, [request, filters, locationId, selectedId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadReference(), loadMolds()]);
    } catch (e) {
      setMessage({
        severity: "error",
        text: e.message || t("moldMaster.messages.loadError"),
      });
    } finally {
      setLoading(false);
    }
  }, [loadReference, loadMolds, t]);
  useEffect(() => {
    loadAll();
  }, []);
  useEffect(() => {
    const timer = setTimeout(
      () =>
        loadMolds().catch((e) =>
          setMessage({ severity: "error", text: e.message }),
        ),
      250,
    );
    return () => clearTimeout(timer);
  }, [filters, locationId]);
  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    request(`${API_BASE}/api/mold-master/molds/${selectedId}`)
      .then(setSelected)
      .catch((e) => setMessage({ severity: "error", text: e.message }));
  }, [selectedId, request, detailVersion]);

  const roots = useMemo(
    () => nodes.filter((x) => x.parent_id == null),
    [nodes],
  );
  const types = useMemo(
    () => [...new Set(molds.map((x) => x.mold_type).filter(Boolean))],
    [molds],
  );
  const groups = useMemo(
    () => [...new Set(molds.map((x) => x.mold_group).filter(Boolean))],
    [molds],
  );
  const columns = useMemo(
    () => [
      { headerName: t("moldMaster.fields.moldCode"), field: "mold_code", width: 120, pinned: "left" },
      { headerName: t("moldMaster.fields.moldName"), field: "mold_name", minWidth: 170, flex: 1.5 },
      { headerName: t("moldMaster.fields.moldType"), field: "mold_type", minWidth: 120, flex: 0.9, valueFormatter: (p) => p.value || "—" },
      { headerName: t("moldMaster.fields.cavity"), field: "cavity_count", minWidth: 80, flex: 0.5, cellStyle: { justifyContent: "center" } },
      { headerName: t("moldMaster.fields.location"), field: "location_name", minWidth: 130, flex: 1, valueFormatter: (p) => p.value || t("moldMaster.ui.notAssigned") },
      { headerName: t("moldMaster.products"), field: "product_names", minWidth: 150, flex: 1.2, valueFormatter: (p) => p.value || "—" },
      { headerName: t("moldMaster.fields.status"), field: "is_active", minWidth: 110, flex: 0.6,
        cellRenderer: (p) => <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}><ActivePill active={Boolean(p.value)} t={t} /></Box> },
    ],
    [t],
  );

  const saveMold = async (form) => {
    setSaving(true);
    try {
      const editing = Boolean(moldDialog?.id);
      await request(
        editing
          ? `${API_BASE}/api/mold-master/molds/${moldDialog.id}`
          : `${API_BASE}/api/mold-master/molds`,
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify({
            ...form,
            ...(editing ? { updated_by: actor } : { created_by: actor }),
          }),
        },
      );
      setMoldDialog(null);
      await loadAll();
      setDetailVersion((v) => v + 1);
      setMessage({ severity: "success", text: t("moldMaster.messages.saved") });
    } catch (e) {
      setMessage({
        severity: "error",
        text: e.message || t("moldMaster.messages.saveError"),
      });
    } finally {
      setSaving(false);
    }
  };
  const deleteMold = async () => {
    if (!selected || !window.confirm(t("moldMaster.messages.confirmDelete")))
      return;
    setSaving(true);
    try {
      await request(`${API_BASE}/api/mold-master/molds/${selected.id}`, {
        method: "DELETE",
      });
      setSelectedId(null);
      await loadAll();
      setDetailVersion((v) => v + 1);
      setMessage({
        severity: "success",
        text: t("moldMaster.messages.deleted"),
      });
    } catch (e) {
      setMessage({ severity: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  };


  const kpis = [
    { label: t("moldMaster.ui.kpiTotal"), value: stats.total_molds || molds.length, note: t("moldMaster.ui.kpiTotalNote"), icon: Inventory2OutlinedIcon, tone: "primary" },
    { label: t("moldMaster.ui.kpiTypes"), value: types.length, note: t("moldMaster.ui.kpiTypesNote"), icon: CategoryOutlinedIcon, tone: "success" },
    { label: t("moldMaster.ui.kpiLinked"), value: molds.filter((m) => m.product_names).length, note: t("moldMaster.ui.kpiLinkedNote"), icon: PrecisionManufacturingOutlinedIcon, tone: "accent" },
    { label: t("moldMaster.ui.kpiPm"), value: molds.filter((m) => m.pm_interval_shot || m.pm_interval_days).length, note: t("moldMaster.ui.kpiPmNote"), icon: BuildOutlinedIcon, tone: "warning" },
    { label: t("moldMaster.ui.kpiLocations"), value: nodes.filter((n) => n.status === "ACTIVE").length, note: t("moldMaster.ui.kpiLocationsNote"), icon: LocationOnOutlinedIcon, tone: "info" },
    { label: t("moldMaster.ui.kpiInactive"), value: molds.filter((m) => !m.is_active).length, note: t("moldMaster.ui.kpiInactiveNote"), icon: BlockOutlinedIcon, tone: "danger" },
  ];
  const lang = i18n.resolvedLanguage || i18n.language || "vi";

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box sx={dark ? { "& .vcc-ag-grid": { "--ag-background-color": "#111827", "--ag-header-background-color": "#182235", "--ag-foreground-color": "#D0D5DD", "--ag-border-color": "#344054" } } : {}}>
        <PageMeta title={`${t("moldMaster.title")} | VCC Plastics`} description={t("moldMaster.description")} />
        <PageBreadcrumb pageTitle={t("moldMaster.title")} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr auto" }, gap: 1.5, alignItems: "center", mb: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{t("moldMaster.title")}</Typography>
            <Typography variant="body2" color="text.secondary">{t("moldMaster.description")}</Typography>
          </Box>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2, justifyContent: "flex-end" }}>
            <SettingsMenu title={t("moldMaster.settings", "Cài đặt")} items={[
              { key: "tree", label: t("moldMaster.hierarchy"), icon: <AccountTreeOutlinedIcon />, onClick: () => setHierarchyDialog(0) },
              { key: "types", label: t("moldMaster.nodeTypes"), icon: <CategoryOutlinedIcon />, onClick: () => setHierarchyDialog(1) },
              { key: "fields", label: t("moldMaster.manageFields"), icon: <TuneOutlinedIcon />, onClick: () => setFieldManager(true) },
            ]} />
            <Button variant="contained" startIcon={<AddIcon />} disabled={!canEdit} onClick={() => setMoldDialog({})} sx={buttonSx("primary")}>{t("moldMaster.addMold")}</Button>
          </Stack>
        </Box>

        <KpiCardGroup>
          {kpis.map((item) => { const Icon = item.icon; return <KpiCard key={item.label} label={item.label} value={item.value} note={item.note} icon={<Icon />} tone={item.tone} />; })}
        </KpiCardGroup>

        <Paper variant="outlined" sx={{ my: 1.5, p: 1.5, borderRadius: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(240px,1.6fr) repeat(3,minmax(145px,1fr)) auto" }, gap: 1 }}>
            <TextField size="small" placeholder={t("moldMaster.search")} value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
            <FormControl size="small">
              <InputLabel shrink>{t("moldMaster.fields.moldType")}</InputLabel>
              <Select displayEmpty notched label={t("moldMaster.fields.moldType")} value={filters.moldType} onChange={(e) => setFilters({ ...filters, moldType: e.target.value })}>
                <MenuItem value="">{t("moldMaster.allTypes")}</MenuItem>
                {types.map((x) => <MenuItem key={x} value={x}>{x}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel shrink>{t("moldMaster.fields.moldGroup")}</InputLabel>
              <Select displayEmpty notched label={t("moldMaster.fields.moldGroup")} value={filters.moldGroup} onChange={(e) => setFilters({ ...filters, moldGroup: e.target.value })}>
                <MenuItem value="">{t("moldMaster.allGroups")}</MenuItem>
                {groups.map((x) => <MenuItem key={x} value={x}>{x}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel shrink>{t("moldMaster.fields.status")}</InputLabel>
              <Select displayEmpty notched label={t("moldMaster.fields.status")} value={filters.active} onChange={(e) => setFilters({ ...filters, active: e.target.value })}>
                <MenuItem value="">{t("moldMaster.allStatuses")}</MenuItem>
                <MenuItem value="true">{t("moldMaster.active")}</MenuItem>
                <MenuItem value="false">{t("moldMaster.inactive")}</MenuItem>
              </Select>
            </FormControl>
            <Button startIcon={<FilterListIcon />} onClick={() => { setFilters({ keyword: "", active: "", moldType: "", moldGroup: "" }); setLocationId(null); }}
              sx={buttonSx("cancel", { minHeight: 29, whiteSpace: "nowrap" })}>{t("moldMaster.clear")}</Button>
          </Box>
        </Paper>

        <Box ref={panelsRef} sx={masterGridSx}>
          {/* left: mold location tree */}
          <Paper sx={{ ...panelSx, height: panelHeight, display: "flex", flexDirection: "column" }}>
            <SectionHeader title={t("moldMaster.hierarchy")} icon={<AccountTreeOutlinedIcon color="primary" fontSize="small" />} />
            <Box sx={{ p: 0.75, flex: 1, minHeight: 0, overflow: "auto" }}>
              <Box onClick={() => setLocationId(null)} sx={{ minHeight: 27, px: 0.75, display: "flex", alignItems: "center", gap: 0.75, borderRadius: 1, cursor: "pointer", bgcolor: locationId == null ? "action.selected" : "transparent", "&:hover": { bgcolor: locationId == null ? "action.selected" : "action.hover" } }}>
                <CategoryOutlinedIcon color="primary" sx={{ fontSize: 13.5 }} />
                <Typography sx={{ flex: 1, fontSize: 11.5, fontWeight: 800 }}>{t("moldMaster.allLocations")}</Typography>
                <Box sx={{ mr: 0.5, display: "flex" }}><CountBadge value={stats.total_molds || molds.length} /></Box>
              </Box>
              {roots.map((node) => (
                <LocationTreeNode key={node.id} node={node} allNodes={nodes} selectedId={locationId} expanded={expanded}
                  onToggle={(id) => setExpanded((old) => (old.includes(id) ? old.filter((x) => x !== id) : [...old, id]))} onSelect={setLocationId} />
              ))}
            </Box>
          </Paper>

          {/* middle: mold list */}
          <Paper sx={{ ...panelSx, height: panelHeight, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <SectionHeader title={`${t("moldMaster.moldList")} (${molds.length})`} icon={<Inventory2OutlinedIcon color="primary" fontSize="small" />} />
            <Box sx={{ p: 0.75, flex: 1, minHeight: 0 }}>
              <AgGridTable rowData={molds} columnDefs={columns} loading={loading} height="100%" rowSelection="single"
                getRowId={(p) => String(p.data.id)} onRowClicked={(event) => setSelectedId(event.data.id)} />
            </Box>
          </Paper>

          {/* right: mold detail */}
          <Paper sx={{ ...panelSx, height: panelHeight, display: "flex", flexDirection: "column" }}>
            <SectionHeader title={t("moldMaster.moldDetail")} icon={<VisibilityOutlinedIcon color="primary" fontSize="small" />} />
            {selected ? (
              <>
                <Box sx={{ p: 1.5, flexShrink: 0 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr) auto", columnGap: 1.25, alignItems: "center" }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", color: "#FFF", bgcolor: "#005BAB" }}><Inventory2OutlinedIcon sx={{ fontSize: 18 }} /></Box>
                    <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0.25 }}>
                      <Typography noWrap title={selected.mold_name} sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>{selected.mold_name}</Typography>
                      <Typography noWrap color="text.secondary" sx={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2 }}>{selected.mold_code}</Typography>
                    </Box>
                    <ActivePill active={Boolean(selected.is_active)} t={t} />
                  </Box>
                </Box>
                <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)} variant="fullWidth"
                  sx={{ minHeight: 27, borderTop: 1, borderBottom: 1, borderColor: "divider", "& .MuiTab-root": { minHeight: 27, py: 0, px: 0.5, fontSize: 11, fontWeight: 700, textTransform: "none" } }}>
                  <Tab label={t("moldMaster.ui.info")} />
                  <Tab label={t("moldMaster.specification")} />
                  <Tab label={t("moldMaster.products")} />
                  <Tab label={t("moldMaster.documents.tab")} />
                </Tabs>
                <Box sx={{ p: 1.5, flex: 1, minHeight: 0, overflow: "auto" }}>
                  {detailTab === 0 && (
                    <Stack spacing={1.5}>
                      {selected.image_url ? (
                        <Box component="a" href={resolveImageUrl(selected.image_url)} target="_blank" rel="noreferrer" title={t("moldMaster.ui.openImage")}
                          sx={{ display: "block", borderRadius: 1.5, overflow: "hidden", border: 1, borderColor: "divider", bgcolor: "action.hover", cursor: "zoom-in" }}>
                          <Box component="img" src={resolveImageUrl(selected.image_url)} alt={selected.mold_name} sx={{ display: "block", width: "100%", height: 170, objectFit: "contain" }} />
                        </Box>
                      ) : null}
                      <DetailSection title={t("moldMaster.general")}>
                        <DetailRow label={t("moldMaster.fields.moldType")}>{selected.mold_type || "—"}</DetailRow>
                        <DetailRow label={t("moldMaster.fields.moldGroup")}>{selected.mold_group || "—"}</DetailRow>
                        <DetailRow label={t("moldMaster.fields.cavity")}>{selected.cavity_count}</DetailRow>
                        <DetailRow label={t("moldMaster.fields.location")}>{selected.location_name || t("moldMaster.ui.notAssigned")}</DetailRow>
                        <DetailRow label={t("moldMaster.fields.manufacturer")}>{selected.manufacturer || "—"}</DetailRow>
                        <DetailRow label={t("moldMaster.fields.manufactureDate")}>{dateText(selected.manufacture_date, lang)}</DetailRow>
                        <DetailRow label={t("moldMaster.fields.description")} last>{selected.description || "—"}</DetailRow>
                      </DetailSection>
                      <DetailSection title={t("moldMaster.ui.record")}>
                        <DetailRow label={t("moldMaster.ui.createdBy")}>{person(selected.created_by_name, selected.created_by_code)}</DetailRow>
                        <DetailRow label={t("moldMaster.ui.createdAt")}>{dateText(selected.created_at, lang)}</DetailRow>
                        <DetailRow label={t("moldMaster.ui.updatedBy")}>{selected.updated_by ? person(selected.updated_by_name, selected.updated_by_code) : "—"}</DetailRow>
                        <DetailRow label={t("moldMaster.ui.updatedAt")} last>{dateText(selected.updated_at, lang)}</DetailRow>
                      </DetailSection>
                    </Stack>
                  )}
                  {detailTab === 1 && (
                    <Stack spacing={1.5}>
                      <DetailSection title={t("moldMaster.ui.technical")}>
                        <DetailRow label={t("moldMaster.fields.designShot")}>{numText(selected.design_shot)}</DetailRow>
                        <DetailRow label={t("moldMaster.fields.weight")}>{numText(selected.weight_kg, "kg")}</DetailRow>
                        <DetailRow label={t("moldMaster.ui.size")}>{[selected.length_mm, selected.width_mm, selected.height_mm].filter((x) => x != null).join(" × ") || "—"}</DetailRow>
                        <DetailRow label={t("moldMaster.fields.revision")} last>{selected.revision || "—"}</DetailRow>
                      </DetailSection>
                      <DetailSection title={t("moldMaster.ui.maintenance")}>
                        <DetailRow label={t("moldMaster.fields.pmIntervalShot")}>{numText(selected.pm_interval_shot)}</DetailRow>
                        <DetailRow label={t("moldMaster.fields.pmIntervalDays")} last>{numText(selected.pm_interval_days)}</DetailRow>
                      </DetailSection>
                      {selected.attribute_values?.some((x) => x.value != null && x.value !== "") ? (
                        <DetailSection title={t("moldMaster.customFields")}>
                          {selected.attribute_values.filter((x) => x.value != null && x.value !== "").map((x, idx, arr) => (
                            <DetailRow key={x.id} label={x.attribute_name} last={idx === arr.length - 1}>
                              {Array.isArray(x.value) ? x.value.join(", ") : typeof x.value === "boolean" ? (x.value ? t("moldMaster.ui.yes") : t("moldMaster.ui.no")) : String(x.value)}{x.unit ? ` ${x.unit}` : ""}
                            </DetailRow>
                          ))}
                        </DetailSection>
                      ) : null}
                    </Stack>
                  )}
                  {detailTab === 2 && (selected.products?.length ? (
                    <DetailSection title={t("moldMaster.products")}>
                      {selected.products.map((p, idx) => (
                        <DetailRow key={p.id} label={p.product_code} last={idx === selected.products.length - 1}>
                          {p.product_name}{p.is_primary ? ` · ${t("moldMaster.ui.primary")}` : ""}
                        </DetailRow>
                      ))}
                    </DetailSection>
                  ) : <Alert severity="info" sx={{ borderRadius: 2 }}>{t("moldMaster.noProducts")}</Alert>)}
                  {detailTab === 3 && <MoldDocuments moldId={selected.id} apiBase={API_BASE} request={request} actor={actor} canEdit={canEdit} />}
                </Box>
                <Divider />
                <Stack direction="row" sx={{ p: 1.5, justifyContent: "center", gap: 1.5, flexShrink: 0 }}>
                  <ActionIcon title={t("moldMaster.editMold")} icon={<EditOutlinedIcon fontSize="small" />} disabled={!canEdit} onClick={() => setMoldDialog(selected)} />
                  <ActionIcon title={t("moldMaster.ui.delete")} icon={<DeleteOutlineIcon fontSize="small" />} color="error" disabled={!canEdit || saving} onClick={deleteMold} />
                </Stack>
              </>
            ) : (
              <Box sx={{ flex: 1, display: "grid", placeItems: "center", p: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>{t("moldMaster.selectMold")}</Typography>
              </Box>
            )}
          </Paper>
        </Box>
        <MoldDialog
          open={moldDialog !== null}
          mold={moldDialog?.id ? moldDialog : null}
          nodes={nodes}
          attributes={attributes}
          products={products}
          saving={saving}
          onClose={() => setMoldDialog(null)}
          onSave={saveMold}
          t={t}
        />
        <MoldSettingsManager open={fieldManager} kind="field" rows={attributes} canEdit={canEdit} request={request} actor={actor}
          onClose={() => setFieldManager(false)} onReload={loadReference} notify={notify} t={t} />
        <LocationTreeManager
          open={hierarchyDialog === 0}
          nodes={nodes}
          nodeTypes={nodeTypes}
          canEdit={canEdit}
          onClose={() => setHierarchyDialog(null)}
          onReload={loadReference}
          request={request}
          actor={actor}
          t={t}
          lang={lang}
        />
        <MoldSettingsManager open={hierarchyDialog === 1} kind="type" rows={nodeTypes} canEdit={canEdit} request={request} actor={actor}
          onClose={() => setHierarchyDialog(null)} onReload={loadReference} notify={notify} t={t} />
        <Snackbar
          open={Boolean(message)}
          autoHideDuration={4500}
          onClose={() => setMessage(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          {message ? (
            <Alert severity={message.severity} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          ) : undefined}
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}
