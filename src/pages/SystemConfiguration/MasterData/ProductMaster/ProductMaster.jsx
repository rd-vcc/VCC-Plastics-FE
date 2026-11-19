import "./locales";
import { CountBadge, PanelHeader, masterGridSx, panelSx, SettingsMenu } from "../../../../components/masterData/MasterPanels";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
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
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import CheckIcon from "@mui/icons-material/Check";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";

import { getAccessToken, getCurrentUser } from "../../../../auth/auth";
import usePagePermission from "../../../../auth/usePagePermission";
import { buttonSystem } from "../../../../components/button/ButtonSystem";
import ImageUploadField, { resolveImageUrl } from "../../../../components/common/ImageUploadField";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import PageMeta from "../../../../components/common/PageMeta";
import { KpiCard, KpiCardGroup } from "../../../../components/kpi/KpiCardSystem";
import AgGridTable from "../../../../components/tables/BasicTables/BasicTableOne";
import useFillHeight from "../../../../hooks/useFillHeight";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import { API_CONFIG } from "../../../../config/config";
import { useTheme as useAppTheme } from "../../../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { BomManagerDialog, BomOverviewDialog, BomSummary } from "./BomManager";
import { downloadXlsx } from "../../../../utils/xlsxExport";

const API_BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const API = `${API_BASE}/api/product-master`;
const EMPTY = "—";
let activeTranslator = (key, params = {}) =>
  Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{{${name}}}`, String(value)),
    key,
  );
const tx = (key, params) => activeTranslator(key, params);
const cardSx = panelSx;

function buttonSx(type, overrides = {}) {
  const style = buttonSystem[type];
  return {
    ...style.base,
    ...(style.hover ? { "&:hover": style.hover } : {}),
    ...(style.active ? { "&:active": style.active } : {}),
    ...overrides,
  };
}

function createProductTheme(mode) {
  const dark = mode === "dark";
  return createTheme({
    palette: {
      mode,
      primary: { main: "#005BAB" },
      background: {
        default: dark ? "#0B1220" : "#F8FAFC",
        paper: dark ? "#111827" : "#FFFFFF",
      },
      text: {
        primary: dark ? "#F3F4F6" : "#172033",
        secondary: dark ? "#A7B0C0" : "#667085",
      },
      divider: dark ? "#344054" : "#D0D5DD",
    },
    typography: {
      fontFamily: '"Bai Jamjuree", Inter, ui-sans-serif, system-ui, sans-serif',
    },
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
      MuiDialog: { styleOverrides: { paper: { backgroundImage: "none" } } },
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
      <IconButton
        size="small"
        disabled={disabled}
        onClick={onClose}
        sx={{ mr: -0.5 }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

const SectionHeader = PanelHeader;

function StatusChip({ status, width = 92 }) {
  const active = status === "ACTIVE";
  const color = active ? "#12B76A" : "#F04438";
  const label = active ? tx("Active") : tx("Inactive");
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

function formatDate(value, language = "vi") {
  if (!value) return EMPTY;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const locale =
    language === "ja" ? "ja-JP" : language === "en" ? "en-GB" : "vi-VN";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function flattenTree(nodes, depth = 0) {
  return nodes.flatMap((node) => [
    { ...node, depth },
    ...flattenTree(node.children || [], depth + 1),
  ]);
}

function FamilyTreeNode({
  node,
  selectedId,
  expanded,
  onToggle,
  onSelect,
  depth = 0,
}) {
  const hasChildren = Boolean(node.children?.length);
  const open = expanded.includes(node.id);
  return (
    <Box>
      <Box
        onClick={() => onSelect(node.id)}
        sx={{
          minHeight: 31,
          pl: `${depth * 14 + 2}px`,
          pr: 0.5,
          display: "flex",
          alignItems: "center",
          gap: 0.35,
          borderRadius: 1,
          cursor: "pointer",
          bgcolor: selectedId === node.id ? "action.selected" : "transparent",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <IconButton
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            if (hasChildren) onToggle(node.id);
          }}
          sx={{ width: 20, height: 20 }}
        >
          {hasChildren ? (
            open ? (
              <ExpandMoreIcon sx={{ fontSize: 13.5 }} />
            ) : (
              <ChevronRightIcon sx={{ fontSize: 13.5 }} />
            )
          ) : (
            <Box sx={{ width: 16 }} />
          )}
        </IconButton>
        <AccountTreeOutlinedIcon color="primary" sx={{ fontSize: 13.5 }} />
        <Typography
          noWrap
          title={`${node.family_code} · ${node.family_name}`}
          sx={{
            flex: 1,
            fontSize: 11.5,
            fontWeight: selectedId === node.id ? 800 : 600,
            color: node.status === "INACTIVE" ? "text.disabled" : "text.primary",
          }}
        >
          {node.family_name}
        </Typography>
        <CountBadge value={node.product_count ?? node.direct_product_count ?? 0} />
      </Box>
      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          {node.children.map((child) => (
            <FamilyTreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </Collapse>
      )}
    </Box>
  );
}

function FieldLabel({ children }) {
  return <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "text.secondary", fontSize: "0.68rem" }}>{children}</Typography>;
}

function FamilyDialog({ family, families, saving, onClose, onSave, defaultParentId = "" }) {
  const [form, setForm] = useState(
    family
      ? {
          code: family.family_code,
          name: family.family_name,
          parentId: family.parent_id ?? "",
          sortOrder: family.sort_order || 0,
          description: family.description || "",
          status: family.status,
        }
      : {
          code: "",
          name: "",
          parentId: defaultParentId,
          sortOrder: 0,
          description: "",
          status: "ACTIVE",
        },
  );
  const change = (key) => (event) =>
    setForm((old) => ({ ...old, [key]: event.target.value }));
  const blocked = useMemo(() => {
    const ids = new Set(family ? [family.id] : []);
    let changed = true;
    while (changed) {
      changed = false;
      families.forEach((item) => {
        if (ids.has(item.parent_id) && !ids.has(item.id)) {
          ids.add(item.id);
          changed = true;
        }
      });
    }
    return ids;
  }, [families, family]);
  // parent options in tree order, indented by level; the family itself and its children are excluded
  const treeOptions = useMemo(() => {
    const active = families.filter((item) => item.status === "ACTIVE" && !blocked.has(item.id));
    const out = [];
    const walk = (parentId, depth) => active
      .filter((item) => (item.parent_id ?? null) === parentId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || String(a.family_name).localeCompare(String(b.family_name)))
      .forEach((item) => { out.push({ ...item, depth }); walk(item.id, depth + 1); });
    walk(null, 0);
    return out;
  }, [families, blocked]);
  const pathOf = (id) => {
    const names = [];
    let node = families.find((item) => item.id === Number(id));
    while (node) { names.unshift(node.family_name); node = families.find((item) => item.id === node.parent_id); }
    return names;
  };
  const path = [...(form.parentId === "" ? [] : pathOf(form.parentId)), form.name.trim() || tx("New family")];
  return (
    <Dialog open fullWidth maxWidth="md" onClose={saving ? undefined : onClose} slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogHeader
        icon={<CategoryOutlinedIcon />}
        title={family ? tx("Edit Product Family") : tx("Add Product Family")}
        subtitle={tx("Product families group products in a parent / child tree.")}
        disabled={saving}
        onClose={onClose}
      />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Stack spacing={2.25} sx={{ pt: 1 }}>
          <Stack spacing={1.25}>
            <FieldLabel>{tx("Basic information")}</FieldLabel>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 2fr" }, gap: 1.5 }}>
              <TextField fullWidth required size="small" label={tx("Family Code")} placeholder="VD: AUTO-INT" disabled={Boolean(family)} value={form.code} onChange={change("code")} />
              <TextField fullWidth required size="small" label={tx("Family Name")} value={form.name} onChange={change("name")} />
            </Box>
          </Stack>
          <Stack spacing={1.25}>
            <FieldLabel>{tx("Position in tree")}</FieldLabel>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 1fr" }, gap: 1.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel shrink>{tx("Parent Family")}</InputLabel>
                <Select label={tx("Parent Family")} notched displayEmpty value={form.parentId} onChange={change("parentId")}
                  renderValue={(value) => (value === "" ? <em>{tx("Root family")}</em> : pathOf(value).join(" / "))}>
                  <MenuItem value=""><em>{tx("Root family")}</em></MenuItem>
                  {treeOptions.map((item) => (
                    <MenuItem key={item.id} value={item.id} sx={{ pl: 2 + item.depth * 2.25 }}>
                      <AccountTreeOutlinedIcon color="primary" sx={{ fontSize: 13, mr: 1 }} />
                      <Typography component="span" sx={{ fontSize: 11.5, fontWeight: item.depth ? 500 : 700 }}>{item.family_name}</Typography>
                      <Typography component="span" color="text.secondary" sx={{ fontSize: 11, ml: 0.75 }}>{item.family_code}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField fullWidth size="small" label={tx("Sort Order")} type="number" value={form.sortOrder} onChange={change("sortOrder")} />
              <FormControl fullWidth size="small">
                <InputLabel>{tx("Status")}</InputLabel>
                <Select label={tx("Status")} value={form.status} onChange={change("status")}>
                  <MenuItem value="ACTIVE">{tx("Active")}</MenuItem>
                  <MenuItem value="INACTIVE">{tx("Inactive")}</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.25, py: 0.9, borderRadius: 1.5, bgcolor: (t) => (t.palette.mode === "dark" ? "#182235" : "#F1F7FF") }}>
              <AccountTreeOutlinedIcon color="primary" sx={{ fontSize: 13.5 }} />
              <Typography variant="caption" color="text.secondary">{tx("Path")}:</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 0, overflowWrap: "anywhere" }}>{path.join(" / ")}</Typography>
            </Box>
          </Stack>
          <TextField fullWidth multiline minRows={3} label={tx("Description")} value={form.description} onChange={change("description")} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.25, borderTop: 1, borderColor: "divider", bgcolor: (theme) => (theme.palette.mode === "dark" ? "#0F172A" : "#F8FAFC") }}>
        <Button onClick={() => onSave(form)} disabled={saving || !form.code.trim() || !form.name.trim()} sx={buttonSx("primary")}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
          {tx("Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function parseOptions(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const separator = line.indexOf("|");
      const value = separator >= 0 ? line.slice(0, separator).trim() : line;
      const label = separator >= 0 ? line.slice(separator + 1).trim() : value;
      return {
        option_value: value,
        option_label: label || value,
        sort_order: (index + 1) * 10,
        is_active: true,
      };
    });
}

function FieldDialog({ field, families, saving, onClose, onSave }) {
  const [form, setForm] = useState(
    field
      ? {
          code: field.field_code,
          name: field.field_name,
          type: field.data_type,
          group: field.field_group || "GENERAL",
          placeholder: field.placeholder || "",
          unit: field.unit_label || "",
          required: Boolean(field.is_required),
          filterable: Boolean(field.is_filterable),
          listVisible: Boolean(field.is_list_visible),
          appliesAll: Boolean(field.applies_to_all_families),
          active: Boolean(field.is_active),
          familyIds: (field.families || []).map((item) => item.family_id),
          includeDescendants: field.families?.[0]?.include_descendants !== 0,
          sortOrder: field.sort_order || 0,
          options: (field.options || [])
            .map((item) => `${item.option_value}|${item.option_label}`)
            .join("\n"),
        }
      : {
          code: "",
          name: "",
          type: "TEXT",
          group: "GENERAL",
          placeholder: "",
          unit: "",
          required: false,
          filterable: false,
          listVisible: false,
          appliesAll: true,
          active: true,
          familyIds: [],
          includeDescendants: true,
          sortOrder: 0,
          options: "",
        },
  );
  const change = (key) => (event) =>
    setForm((old) => ({ ...old, [key]: event.target.value }));
  const toggle = (key) => (event) =>
    setForm((old) => ({ ...old, [key]: event.target.checked }));
  const needsOptions = ["SELECT", "MULTI_SELECT"].includes(form.type);
  return (
    <Dialog open fullWidth maxWidth="md" onClose={saving ? undefined : onClose} slotProps={{ paper: {
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 24px 60px rgba(0,0,0,.55)"
              : "0 24px 60px rgba(15,23,42,.18)",
        },
      } }}>
      <DialogHeader
        icon={<TuneOutlinedIcon />}
        title={field ? tx("Edit Product Field") : tx("Add Dynamic Product Field")}
        disabled={saving}
        onClose={onClose}
      />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              fullWidth
              size="small"
              label={tx("Field Code")}
              disabled={Boolean(field)}
              value={form.code}
              onChange={change("code")}
              helperText={tx("lowercase_and_underscore")}
            />
            <TextField
              fullWidth
              size="small"
              label={tx("Field Name")}
              value={form.name}
              onChange={change("name")}
            />
            <FormControl fullWidth size="small" disabled={Boolean(field)}>
              <InputLabel>{tx("Data Type")}</InputLabel>
              <Select
                label={tx("Data Type")}
                value={form.type}
                onChange={change("type")}
              >
                {[
                  "TEXT",
                  "LONG_TEXT",
                  "INTEGER",
                  "DECIMAL",
                  "DATE",
                  "DATETIME",
                  "BOOLEAN",
                  "SELECT",
                  "MULTI_SELECT",
                  "FILE",
                  "IMAGE",
                ].map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              fullWidth
              size="small"
              label={tx("Field Group")}
              value={form.group}
              onChange={change("group")}
            />
            <TextField
              fullWidth
              size="small"
              label={tx("Placeholder")}
              value={form.placeholder}
              onChange={change("placeholder")}
            />
            <TextField
              fullWidth
              size="small"
              label={tx("Unit Label")}
              value={form.unit}
              onChange={change("unit")}
            />
            <TextField
              fullWidth
              size="small"
              type="number"
              label={tx("Sort Order")}
              value={form.sortOrder}
              onChange={change("sortOrder")}
            />
          </Stack>
          {needsOptions && (
            <TextField
              multiline
              minRows={4}
              label={tx("Options")}
              value={form.options}
              onChange={change("options")}
              helperText={tx("One per line: VALUE|Display label")}
            />
          )}
          <Paper variant="outlined" sx={{ p: 1 }}>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.required}
                    onChange={toggle("required")}
                  />
                }
                label={tx("Required")}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.filterable}
                    onChange={toggle("filterable")}
                  />
                }
                label={tx("Filterable")}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.listVisible}
                    onChange={toggle("listVisible")}
                  />
                }
                label={tx("Show in list")}
              />
              <FormControlLabel
                control={
                  <Checkbox checked={form.active} onChange={toggle("active")} />
                }
                label={tx("Active")}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.appliesAll}
                    onChange={toggle("appliesAll")}
                  />
                }
                label={tx("All families")}
              />
            </Stack>
          </Paper>
          {!form.appliesAll && (
            <FormControl fullWidth size="small">
              <InputLabel>{tx("Applicable Families")}</InputLabel>
              <Select
                multiple
                label={tx("Applicable Families")}
                value={form.familyIds}
                onChange={change("familyIds")}
                renderValue={(selected) =>
                  tx("{{count}} selected", { count: selected.length })
                }
              >
                {families
                  .filter((item) => item.status === "ACTIVE")
                  .map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      <Checkbox checked={form.familyIds.includes(item.id)} />
                      {item.family_code} · {item.family_name}
                    </MenuItem>
                  ))}
              </Select>
              <FormControlLabel
                sx={{ ml: 0 }}
                control={
                  <Checkbox
                    checked={form.includeDescendants}
                    onChange={toggle("includeDescendants")}
                  />
                }
                label={tx("Include descendant families")}
              />
            </FormControl>
          )}
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          py: 1.75,
          borderTop: 1,
          borderColor: "divider",
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "#0F172A" : "#F8FAFC",
        }}
      >
        <Button
          onClick={() =>
            onSave({ ...form, parsedOptions: parseOptions(form.options) })
          }
          disabled={
            saving ||
            !form.code.trim() ||
            !form.name.trim() ||
            (needsOptions && !form.options.trim()) ||
            (!form.appliesAll && !form.familyIds.length)
          }
          sx={buttonSx("primary")}
        >
          {tx("Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DynamicInput({ field, value, onChange }) {
  const common = {
    fullWidth: true,
    size: "small",
    label: field.field_name,
    required: Boolean(field.is_required),
    helperText: field.unit_label
      ? tx("Unit: {{unit}}", { unit: field.unit_label })
      : field.description || "",
  };
  if (field.data_type === "BOOLEAN")
    return (
      <FormControlLabel
        control={
          <Switch
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
          />
        }
        label={field.field_name}
      />
    );
  if (field.data_type === "SELECT")
    return (
      <FormControl fullWidth size="small">
        <InputLabel>{field.field_name}</InputLabel>
        <Select
          label={field.field_name}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
        >
          {(field.options || [])
            .filter((option) => option.is_active)
            .map((option) => (
              <MenuItem key={option.id} value={option.option_value}>
                {option.option_label}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
    );
  if (field.data_type === "MULTI_SELECT")
    return (
      <FormControl fullWidth size="small">
        <InputLabel>{field.field_name}</InputLabel>
        <Select
          multiple
          label={field.field_name}
          value={Array.isArray(value) ? value : []}
          onChange={(event) => onChange(event.target.value)}
        >
          {(field.options || [])
            .filter((option) => option.is_active)
            .map((option) => (
              <MenuItem key={option.id} value={option.option_value}>
                <Checkbox
                  checked={
                    Array.isArray(value) && value.includes(option.option_value)
                  }
                />
                {option.option_label}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
    );
  const typeMap = {
    INTEGER: "number",
    DECIMAL: "number",
    DATE: "date",
    DATETIME: "datetime-local",
  };
  return (
    <TextField {...common} type={typeMap[field.data_type] || "text"} multiline={field.data_type === "LONG_TEXT"} minRows={field.data_type === "LONG_TEXT" ? 3 : undefined} value={value ?? ""} onChange={(event) => onChange(event.target.value)} placeholder={
        field.placeholder ||
        (["FILE", "IMAGE"].includes(field.data_type)
          ? tx("Enter URL or storage key")
          : undefined)
      } slotProps={{ inputLabel: ["DATE", "DATETIME"].includes(field.data_type)
          ? { shrink: true }
          : undefined }} />
  );
}

// Product family picker drawn as the family tree; only active families can be chosen.
function FamilyTreePicker({ families, value, onChange }) {
  const [collapsed, setCollapsed] = useState(() => new Set());
  const children = useMemo(() => {
    const map = {};
    families.forEach((f) => { (map[f.parent_id ?? "root"] = map[f.parent_id ?? "root"] || []).push(f); });
    Object.values(map).forEach((list) => list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || String(a.family_name).localeCompare(String(b.family_name))));
    return map;
  }, [families]);
  const parents = families.filter((f) => children[f.id]?.length).map((f) => f.id);
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
          {kids.length
            ? <AccountTreeOutlinedIcon color="primary" sx={{ fontSize: 13.5, flexShrink: 0 }} />
            : <CategoryOutlinedIcon sx={{ fontSize: 13, flexShrink: 0, color: "text.secondary" }} />}
          <Typography noWrap sx={{ flex: 1, minWidth: 0, fontSize: 11.5, fontWeight: selected ? 800 : depth ? 600 : 700 }}>{node.family_name}</Typography>
          <Typography noWrap color="text.secondary" sx={{ fontSize: 10, flexShrink: 0 }}>{node.family_code}</Typography>
          {selected ? <CheckIcon color="primary" sx={{ fontSize: 13.5, flexShrink: 0 }} /> : null}
        </Box>
        {kids.length && open ? kids.map((k) => renderNode(k, depth + 1)) : null}
      </Box>
    );
  };
  return (
    <Box sx={{ flex: 1, minHeight: 280, display: "flex", flexDirection: "column", border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
      <Box sx={{ px: 1, py: 0.5, display: "flex", alignItems: "center", borderBottom: 1, borderColor: "divider", bgcolor: (t) => (t.palette.mode === "dark" ? "#182235" : "#F1F7FF") }}>
        <Typography sx={{ flex: 1, fontSize: 11, fontWeight: 800, pl: 0.5 }}>{tx("{{count}} families", { count: families.length })}</Typography>
        <Tooltip title={tx("Expand all")}><IconButton size="small" onClick={() => setCollapsed(new Set())}><UnfoldMoreIcon sx={{ fontSize: 14.5 }} /></IconButton></Tooltip>
        <Tooltip title={tx("Collapse all")}><IconButton size="small" onClick={() => setCollapsed(new Set(parents))}><UnfoldLessIcon sx={{ fontSize: 14.5 }} /></IconButton></Tooltip>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 0.75 }}>
        {(children.root || []).map((n) => renderNode(n, 0))}
      </Box>
    </Box>
  );
}

function ProductDialog({
  product,
  families,
  requestJson,
  actor,
  saving,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(
    product
      ? {
          code: product.product_code,
          name: product.product_name,
          familyId: product.product_family_id,
          status: product.status,
          image: product.image_url || "",
        }
      : { code: "", name: "", familyId: "", status: "ACTIVE", image: "" },
  );
  const [fields, setFields] = useState([]);
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      (product?.values || []).map((item) => [item.field_id, item.value]),
    ),
  );
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!form.familyId) {
      setFields([]);
      return undefined;
    }
    let active = true;
    setLoading(true);
    requestJson(
      `${API}/fields?family_id=${form.familyId}&include_inactive=false`,
    )
      .then((data) => {
        if (active) setFields(data || []);
      })
      .catch(() => {
        if (active) setFields([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [form.familyId, requestJson]);
  const groups = useMemo(
    () =>
      fields.reduce((result, field) => {
        const group = field.field_group || "GENERAL";
        if (!result[group]) result[group] = [];
        result[group].push(field);
        return result;
      }, {}),
    [fields],
  );
  const submit = () =>
    onSave({
      product_code: form.code.trim().toUpperCase(),
      product_name: form.name.trim(),
      product_family_id: Number(form.familyId),
      status: form.status,
      image_url: form.image || null,
      values: fields.map((field) => ({
        field_id: field.id,
        value: values[field.id] ?? null,
      })),
      ...(product ? { updated_by: actor } : { created_by: actor }),
    });
  const invalid =
    !form.code.trim() ||
    !form.name.trim() ||
    !form.familyId ||
    fields.some(
      (field) =>
        field.is_required &&
        (values[field.id] == null ||
          values[field.id] === "" ||
          values[field.id]?.length === 0),
    );
  const familyPath = (id) => {
    const names = [];
    let n = families.find((f) => f.id === Number(id));
    while (n) { names.unshift(n.family_name); n = families.find((f) => f.id === n.parent_id); }
    return names.join(" / ");
  };
  return (
    <Dialog open fullWidth maxWidth="lg" onClose={saving ? undefined : onClose} slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogHeader
        icon={<Inventory2OutlinedIcon />}
        title={product ? tx("Edit Product") : tx("Add Product")}
        subtitle={tx("Choose the product family on the left; its specification fields appear on the right.")}
        disabled={saving}
        onClose={onClose}
      />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "320px minmax(0,1fr)" }, gap: 2.5, mt: 1, height: { md: 520 } }}>
          {/* left: product family tree */}
          <Stack spacing={0.75} sx={{ minHeight: 0 }}>
            <FieldLabel>{tx("Product Family")} *</FieldLabel>
            <FamilyTreePicker families={families} value={form.familyId}
              onChange={(id) => { if (id !== form.familyId) { setForm((old) => ({ ...old, familyId: id })); setValues({}); } }} />
          </Stack>

          {/* right: basic information, image and dynamic fields */}
          <Box sx={{ minHeight: 0, overflowY: "auto", pr: 0.5 }}>
            <Stack spacing={2.25}>
              <Stack spacing={1.25}>
                <FieldLabel>{tx("Basic information")}</FieldLabel>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 2fr 1fr" }, gap: 1.5, pt: 0.75 }}>
                  <TextField fullWidth required size="small" label={tx("Product Code")} disabled={Boolean(product)} value={form.code}
                    onChange={(event) => setForm((old) => ({ ...old, code: event.target.value }))} />
                  <TextField fullWidth required size="small" label={tx("Product Name")} value={form.name}
                    onChange={(event) => setForm((old) => ({ ...old, name: event.target.value }))} />
                  <FormControl fullWidth size="small">
                    <InputLabel>{tx("Status")}</InputLabel>
                    <Select label={tx("Status")} value={form.status} onChange={(event) => setForm((old) => ({ ...old, status: event.target.value }))}>
                      <MenuItem value="ACTIVE">{tx("Active")}</MenuItem>
                      <MenuItem value="INACTIVE">{tx("Inactive")}</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.25, py: 0.9, borderRadius: 1.5, bgcolor: (t) => (t.palette.mode === "dark" ? "#182235" : "#F1F7FF") }}>
                  <AccountTreeOutlinedIcon color="primary" sx={{ fontSize: 13.5 }} />
                  <Typography variant="caption" color="text.secondary">{tx("Product Family")}:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 0, overflowWrap: "anywhere", color: form.familyId ? "text.primary" : "text.disabled" }}>
                    {form.familyId ? familyPath(form.familyId) : tx("Not selected")}
                  </Typography>
                </Box>
              </Stack>
              <ImageUploadField value={form.image} category="product" label={tx("Product Image")} disabled={saving} onChange={(v) => setForm((old) => ({ ...old, image: v || "" }))} />
              {loading && <LinearProgress />}
              {!form.familyId ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>{tx("Select a product family to show its specification fields.")}</Alert>
              ) : !loading && !fields.length ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>{tx("This family has no specification fields configured.")}</Alert>
              ) : null}
              {Object.entries(groups).map(([group, items]) => (
                <Stack key={group} spacing={1.25}>
                  <FieldLabel>{group.replaceAll("_", " ")}</FieldLabel>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2,minmax(0,1fr))" }, gap: 1.5, pt: 0.75 }}>
                    {items.map((field) => (
                      <DynamicInput key={field.id} field={field} value={values[field.id]}
                        onChange={(value) => setValues((old) => ({ ...old, [field.id]: value }))} />
                    ))}
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.25, borderTop: 1, borderColor: "divider", bgcolor: (theme) => (theme.palette.mode === "dark" ? "#0F172A" : "#F8FAFC") }}>
        <Button onClick={submit} disabled={saving || invalid} sx={buttonSx("primary")} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
          {tx("Save Product")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Product family tree on the left, details of the clicked family on the right.
function HierarchyManager({ families, canEdit, saving, onClose, onAdd, onEdit, onDelete }) {
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [selectedId, setSelectedId] = useState(() => families[0]?.id ?? null);
  const children = useMemo(() => {
    const map = {};
    families.forEach((f) => { (map[f.parent_id ?? "root"] = map[f.parent_id ?? "root"] || []).push(f); });
    return map;
  }, [families]);
  const selected = families.find((f) => f.id === selectedId) || null;
  const pathOf = (node) => {
    const names = [];
    let n = node;
    while (n) { names.unshift(n.family_name); n = families.find((f) => f.id === n.parent_id); }
    return names.join(" / ");
  };
  const toggle = (id) => setCollapsed((old) => { const next = new Set(old); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const parents = families.filter((f) => children[f.id]?.length).map((f) => f.id);

  const renderNode = (node, depth) => {
    const kids = children[node.id] || [];
    const open = !collapsed.has(node.id);
    const isSel = node.id === selectedId;
    return (
      <Box key={node.id}>
        <Box onClick={() => setSelectedId(node.id)} sx={{ minHeight: 27, pl: `${depth * 16 + 2}px`, pr: 0.75, display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", borderRadius: 1,
          bgcolor: isSel ? "action.selected" : "transparent", "&:hover": { bgcolor: isSel ? "action.selected" : "action.hover" } }}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); if (kids.length) toggle(node.id); }} sx={{ width: 22, height: 22, visibility: kids.length ? "visible" : "hidden" }}>
            {open ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ChevronRightIcon sx={{ fontSize: 14 }} />}
          </IconButton>
          {kids.length
            ? <AccountTreeOutlinedIcon color="primary" sx={{ fontSize: 13.5, flexShrink: 0 }} />
            : <CategoryOutlinedIcon sx={{ fontSize: 13, flexShrink: 0, color: "text.secondary" }} />}
          <Typography noWrap sx={{ flex: 1, minWidth: 0, fontSize: 11.5, fontWeight: isSel ? 800 : depth ? 600 : 700, color: node.status === "ACTIVE" ? "text.primary" : "text.disabled" }}>{node.family_name}</Typography>
          <CountBadge value={node.product_count ?? node.direct_product_count ?? 0} />
        </Box>
        {kids.length && open ? kids.map((k) => renderNode(k, depth + 1)) : null}
      </Box>
    );
  };

  return (
    <Dialog open fullWidth maxWidth="lg" onClose={onClose} slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogHeader icon={<AccountTreeOutlinedIcon />} title={tx("Product Hierarchy")} subtitle={tx("Product families and their parent / child levels.")} onClose={onClose} />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "380px minmax(0,1fr)" }, gap: 2.5, mt: 1, height: { md: 470 } }}>
          {/* left: tree */}
          <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
            <Box sx={{ px: 1, py: 0.5, display: "flex", alignItems: "center", borderBottom: 1, borderColor: "divider", bgcolor: (t) => (t.palette.mode === "dark" ? "#182235" : "#F1F7FF") }}>
              <Typography sx={{ flex: 1, fontSize: 11, fontWeight: 800, pl: 0.5 }}>{tx("{{count}} families", { count: families.length })}</Typography>
              <Tooltip title={tx("Expand all")}><IconButton size="small" onClick={() => setCollapsed(new Set())}><UnfoldMoreIcon sx={{ fontSize: 14.5 }} /></IconButton></Tooltip>
              <Tooltip title={tx("Collapse all")}><IconButton size="small" onClick={() => setCollapsed(new Set(parents))}><UnfoldLessIcon sx={{ fontSize: 14.5 }} /></IconButton></Tooltip>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 0.75 }}>
              {(children.root || []).map((n) => renderNode(n, 0))}
            </Box>
            <Box sx={{ p: 1, borderTop: 1, borderColor: "divider" }}>
              <Button fullWidth variant="contained" disabled={!canEdit} onClick={() => onAdd(null)} startIcon={<AddIcon />} sx={buttonSx("primary")}>{tx("Add Family")}</Button>
            </Box>
          </Box>

          {/* right: details of the clicked family */}
          <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
            {selected ? (
              <>
                <Box sx={{ p: 1.5, flexShrink: 0 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr) auto", columnGap: 1.25, alignItems: "center" }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", color: "#FFF", bgcolor: "#005BAB" }}>
                      {children[selected.id]?.length ? <AccountTreeOutlinedIcon sx={{ fontSize: 18 }} /> : <CategoryOutlinedIcon sx={{ fontSize: 18 }} />}
                    </Box>
                    <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0.25 }}>
                      <Typography noWrap sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>{selected.family_name}</Typography>
                      <Typography noWrap color="text.secondary" sx={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2 }}>{selected.family_code}</Typography>
                    </Box>
                    <StatusChip status={selected.status} />
                  </Box>
                </Box>
                <Box sx={{ px: 1.5, pb: 1.5, flex: 1, minHeight: 0, overflowY: "auto" }}>
                  <Stack spacing={1.5}>
                    <DetailSection title={tx("General")}>
                      <DetailRow label={tx("Path")}>{pathOf(selected)}</DetailRow>
                      <DetailRow label={tx("Parent Family")}>{selected.parent_name || tx("Root family")}</DetailRow>
                      <DetailRow label={tx("Sub-families")}>{children[selected.id]?.length || 0}</DetailRow>
                      <DetailRow label={tx("Products")}>{selected.product_count ?? selected.direct_product_count ?? 0}</DetailRow>
                      <DetailRow label={tx("Sort Order")}>{selected.sort_order ?? 0}</DetailRow>
                      <DetailRow label={tx("Description")} last>{selected.description || EMPTY}</DetailRow>
                    </DetailSection>
                    <DetailSection title={tx("Record")}>
                      <DetailRow label={tx("Created By")}>{person(selected.created_by_name, selected.created_by_code)}</DetailRow>
                      <DetailRow label={tx("Created Date")}>{formatDate(selected.created_at)}</DetailRow>
                      <DetailRow label={tx("Last Modified")} last>{formatDate(selected.updated_at)}</DetailRow>
                    </DetailSection>
                  </Stack>
                </Box>
                <Divider />
                <Stack direction="row" sx={{ p: 1.5, justifyContent: "center", gap: 1.5, flexShrink: 0 }}>
                  <ActionIcon title={tx("Add sub-family")} icon={<AddIcon fontSize="small" />} color="primary" disabled={!canEdit || saving} onClick={() => onAdd(selected)} />
                  <ActionIcon title={tx("Edit")} icon={<EditOutlinedIcon fontSize="small" />} disabled={!canEdit || saving} onClick={() => onEdit(selected)} />
                  <ActionIcon title={children[selected.id]?.length ? tx("Delete its sub-families first") : tx("Delete")} icon={<DeleteOutlineIcon fontSize="small" />} color="error"
                    disabled={!canEdit || saving || Boolean(children[selected.id]?.length)} onClick={() => onDelete(selected)} />
                </Stack>
              </>
            ) : (
              <Box sx={{ flex: 1, display: "grid", placeItems: "center", p: 2 }}>
                <Typography variant="body2" color="text.secondary">{tx("Select a family in the tree to view its details.")}</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function FieldManager({ fields, canEdit, saving, onClose, onAdd, onEdit, onDelete }) {
  const columns = useMemo(() => [
    { headerName: tx("Field Code"), field: "field_code", width: 150, pinned: "left" },
    { headerName: tx("Field Name"), field: "field_name", minWidth: 170, flex: 1.3 },
    { headerName: tx("Data Type"), field: "data_type", minWidth: 110, flex: 0.7 },
    { headerName: tx("Field Group"), field: "field_group", minWidth: 130, flex: 0.9, valueFormatter: (p) => p.value || EMPTY },
    { headerName: tx("Scope"), minWidth: 130, flex: 0.8,
      valueGetter: (p) => (p.data.applies_to_all_families ? tx("All families") : tx("{{count}} families", { count: p.data.families?.length || 0 })) },
    { headerName: tx("List"), field: "is_list_visible", minWidth: 80, flex: 0.5, valueFormatter: (p) => (p.value ? tx("Yes") : tx("No")) },
    { headerName: tx("Status"), field: "is_active", minWidth: 110, flex: 0.6,
      cellRenderer: (p) => <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}><StatusChip status={p.value ? "ACTIVE" : "INACTIVE"} /></Box> },
    { headerName: tx("Actions"), width: 100, sortable: false, filter: false, cellRenderer: (p) => (
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "center", height: "100%" }}>
        <Tooltip title={tx("Edit")}><span><IconButton size="small" disabled={!canEdit || saving} onClick={() => onEdit(p.data)}><EditOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
        <Tooltip title={tx("Delete")}><span><IconButton size="small" color="error" disabled={!canEdit || saving} onClick={() => onDelete(p.data)}><DeleteOutlineIcon fontSize="small" /></IconButton></span></Tooltip>
      </Stack>
    ) },
  ], [canEdit, saving, onEdit, onDelete]);
  return (
    <Dialog open fullWidth maxWidth="lg" onClose={onClose} slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogHeader icon={<TuneOutlinedIcon />} title={tx("Product Field Configuration")} subtitle={tx("Fields are rendered automatically in the Product form.")} onClose={onClose} />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Box sx={{ height: 420, mt: 1 }}>
          <AgGridTable rowData={fields} columnDefs={columns} height="100%" getRowId={(p) => String(p.data.id)} />
        </Box>
        <Stack direction="row" sx={{ mt: 1.5 }}>
          <Button variant="contained" disabled={!canEdit} onClick={onAdd} startIcon={<AddIcon />} sx={buttonSx("primary", { whiteSpace: "nowrap" })}>{tx("Add Field")}</Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

const dialogPaperSx = {
  borderRadius: 3,
  overflow: "hidden",
  boxShadow: (theme) => (theme.palette.mode === "dark" ? "0 24px 60px rgba(0,0,0,.55)" : "0 24px 60px rgba(15,23,42,.18)"),
};

export default function ProductMaster() {
  const [panelsRef, panelHeight] = useFillHeight();
  const { theme: appTheme } = useAppTheme();
  const { t, i18n } = useTranslation();
  const translate = useCallback(
    (key, params = {}) =>
      t(`productMaster.${key}`, { defaultValue: key, ...params }),
    [t],
  );
  activeTranslator = translate;
  const muiTheme = useMemo(() => createProductTheme(appTheme), [appTheme]);
  const { canEdit } = usePagePermission();
  const actor = getCurrentUser()?.employee_code || "SYSTEM";
  const [families, setFamilies] = useState([]);
  const [familyTree, setFamilyTree] = useState([]);
  const [fields, setFields] = useState([]);
  const [products, setProducts] = useState([]);
  const [kpis, setKpis] = useState({});
  const [selectedFamilyId, setSelectedFamilyId] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [expanded, setExpanded] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [detailTab, setDetailTab] = useState(0);
  const [bomRefresh, setBomRefresh] = useState(0);
  const [message, setMessage] = useState({
    open: false,
    type: "success",
    text: "",
  });

  const notify = useCallback(
    (type, text) => setMessage({ open: true, type, text }),
    [],
  );
  const requestJson = useCallback(async (url, options = {}) => {
    const token = getAccessToken();
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok)
      throw new Error(
        payload?.detail ||
          payload?.message ||
          tx("Request failed (HTTP {{status}}).", { status: response.status }),
      );
    return payload;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [flat, tree, dynamicFields, productData, KPI] = await Promise.all([
        requestJson(`${API}/families?tree=false`),
        requestJson(`${API}/families?tree=true`),
        requestJson(`${API}/fields?include_inactive=true`),
        requestJson(`${API}/products?page_size=500`),
        requestJson(`${API}/products/kpis`),
      ]);
      const productItems = productData?.items || [];
      setFamilies(flat || []);
      setFamilyTree(tree || []);
      setFields(dynamicFields || []);
      setProducts(productItems);
      setKpis(KPI || {});
      setExpanded((flat || []).map((item) => item.id));
      setSelectedProductId((current) =>
        productItems.some((item) => item.id === current)
          ? current
          : (productItems[0]?.id ?? null),
      );
    } catch (error) {
      notify("error", error.message || tx("Unable to load Product Master."));
    } finally {
      setLoading(false);
    }
  }, [notify, requestJson]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  useEffect(() => {
    if (!selectedProductId) {
      setSelectedProduct(null);
      return undefined;
    }
    let active = true;
    requestJson(`${API}/products/${selectedProductId}`)
      .then((data) => {
        if (active) setSelectedProduct(data);
      })
      .catch((error) => notify("error", error.message));
    return () => {
      active = false;
    };
  }, [notify, requestJson, selectedProductId]);

  const allTreeNodes = useMemo(() => flattenTree(familyTree), [familyTree]);
  const filteredProducts = useMemo(() => {
    const selectedNode = allTreeNodes.find(
      (node) => node.id === selectedFamilyId,
    );
    const allowedFamilies = new Set(
      flattenTree(selectedNode ? [selectedNode] : []).map((node) => node.id),
    );
    const term = keyword.trim().toLowerCase();
    return products.filter((product) => {
      const searchable =
        `${product.product_code} ${product.product_name} ${Object.values(
          product.dynamic_values || {},
        )
          .map((item) => item.value)
          .join(" ")}`.toLowerCase();
      return (
        (!term || searchable.includes(term)) &&
        (statusFilter === "all" || product.status === statusFilter) &&
        (!selectedFamilyId || allowedFamilies.has(product.product_family_id))
      );
    });
  }, [allTreeNodes, keyword, products, selectedFamilyId, statusFilter]);
  const listFields = useMemo(
    () =>
      fields
        .filter((field) => field.is_active && field.is_list_visible)
        .slice(0, 4),
    [fields],
  );

  const openEditProduct = useCallback(
    (id) => {
      requestJson(`${API}/products/${id}`)
        .then((data) => {
          setSelectedProductId(id);
          setDialog({ type: "product", item: data });
        })
        .catch((error) => notify("error", error.message));
    },
    [notify, requestJson],
  );

  const columns = useMemo(
    () => [
      {
        headerName: translate("Product Code"),
        field: "product_code",
        width: 140,
        pinned: "left",
      },
      {
        headerName: translate("Product Name"),
        field: "product_name",
        minWidth: 175,
        flex: 1.6,
      },
      {
        headerName: translate("Product Family"),
        field: "family_name",
        minWidth: 140,
        flex: 1,
      },
      ...listFields.map((field) => ({
        headerName: field.field_name,
        colId: `field_${field.id}`,
        valueGetter: (params) =>
          params.data?.dynamic_values?.[field.field_code]?.value ?? EMPTY,
        minWidth: 105,
        flex: 0.75,
      })),
      {
        headerName: translate("Status"),
        field: "status",
        minWidth: 110,
        flex: 0.6,
        cellRenderer: (params) => (
          <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}>
            <StatusChip status={params.value} />
          </Box>
        ),
      },
    ],
    [listFields, translate],
  );

  const saveFamily = async (form) => {
    const item = dialog?.type === "family" ? dialog.item : null;
    const body = {
      family_name: form.name.trim(),
      parent_id: form.parentId === "" ? null : Number(form.parentId),
      sort_order: Number(form.sortOrder || 0),
      description: form.description.trim() || null,
      status: form.status,
      ...(item
        ? { updated_by: actor }
        : { family_code: form.code.trim().toUpperCase(), created_by: actor }),
    };
    setSaving(true);
    try {
      const result = await requestJson(
        item ? `${API}/families/${item.id}` : `${API}/families`,
        { method: item ? "PUT" : "POST", body: JSON.stringify(body) },
      );
      setDialog({ type: "hierarchy" });
      await loadData();
      notify("success", result.message);
    } catch (error) {
      notify("error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteFamily = async (item) => {
    if (
      !window.confirm(tx("Delete family {{name}}?", { name: item.family_name }))
    )
      return;
    setSaving(true);
    try {
      const result = await requestJson(`${API}/families/${item.id}`, {
        method: "DELETE",
      });
      await loadData();
      notify("success", result.message);
    } catch (error) {
      notify("error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const saveField = async (form) => {
    const item = dialog?.type === "field" ? dialog.item : null;
    const body = {
      field_name: form.name.trim(),
      field_group: form.group.trim() || "GENERAL",
      placeholder: form.placeholder.trim() || null,
      default_value: null,
      unit_label: form.unit.trim() || null,
      validation_rules: null,
      is_required: form.required,
      is_unique: false,
      is_filterable: form.filterable,
      is_list_visible: form.listVisible,
      applies_to_all_families: form.appliesAll,
      is_active: form.active,
      sort_order: Number(form.sortOrder || 0),
      options: form.parsedOptions,
      family_ids: form.appliesAll ? [] : form.familyIds.map(Number),
      include_descendants: form.includeDescendants,
      ...(item
        ? { updated_by: actor }
        : {
            field_code: form.code.trim().toLowerCase(),
            data_type: form.type,
            created_by: actor,
          }),
    };
    setSaving(true);
    try {
      const result = await requestJson(
        item ? `${API}/fields/${item.id}` : `${API}/fields`,
        { method: item ? "PUT" : "POST", body: JSON.stringify(body) },
      );
      setDialog({ type: "fields" });
      await loadData();
      notify("success", result.message);
    } catch (error) {
      notify("error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteField = async (item) => {
    if (
      !window.confirm(
        tx("Delete or deactivate field {{name}}?", { name: item.field_name }),
      )
    )
      return;
    setSaving(true);
    try {
      const result = await requestJson(
        `${API}/fields/${item.id}?updated_by=${encodeURIComponent(actor)}`,
        { method: "DELETE" },
      );
      await loadData();
      notify("success", result.message);
    } catch (error) {
      notify("error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const saveProduct = async (body) => {
    const item = dialog?.type === "product" ? dialog.item : null;
    setSaving(true);
    try {
      const result = await requestJson(
        item ? `${API}/products/${item.id}` : `${API}/products`,
        { method: item ? "PUT" : "POST", body: JSON.stringify(body) },
      );
      setDialog(null);
      await loadData();
      setSelectedProductId(result.id || item?.id);
      notify("success", result.message);
    } catch (error) {
      notify("error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!selectedProduct || !canEdit) return;
    const status = selectedProduct.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setSaving(true);
    try {
      const result = await requestJson(
        `${API}/products/${selectedProduct.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status, updated_by: actor }),
        },
      );
      await loadData();
      setSelectedProduct((old) => ({ ...old, status }));
      notify("success", result.message);
    } catch (error) {
      notify("error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const header = [
      tx("Product Code"),
      tx("Product Name"),
      tx("Product Family"),
      tx("Status"),
      ...listFields.map((field) => field.field_name),
    ];
    const rows = filteredProducts.map((product) => [
      product.product_code,
      product.product_name,
      product.family_name,
      product.status,
      ...listFields.map(
        (field) => product.dynamic_values?.[field.field_code]?.value ?? "",
      ),
    ]);
    downloadXlsx("product-master.xlsx", header, rows);
  };


  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box
        sx={{
          minHeight: "100%",
          color: "text.primary",
          "& .vcc-ag-grid":
            appTheme === "dark"
              ? {
                  "--ag-background-color": "#111827",
                  "--ag-header-background-color": "#182235",
                  "--ag-foreground-color": "#D0D5DD",
                  "--ag-border-color": "#344054",
                  "--ag-row-border-color": "#293548",
                  "--ag-row-hover-color": "#1B2B45",
                }
              : {},
        }}
      >
        <PageMeta
          title={`${tx("Product Master")} | VCC Plastics`}
          description={tx(
            "Manage products, product families and dynamic specifications",
          )}
        />
        <PageBreadcrumb pageTitle={tx("Product Master")} />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr auto" },
            gap: 1.5,
            alignItems: "center",
            mb: 1.5,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {tx("Product Master")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tx(
                "Manage products, product families and dynamic specifications",
              )}
            </Typography>
          </Box>
          <Stack
            direction="row"
            sx={{ flexWrap: "wrap", gap: 2, justifyContent: "flex-end" }}
          >
            <Button
              startIcon={<AccountTreeOutlinedIcon />}
              onClick={() => setDialog({ type: "bomOverview" })}
              sx={buttonSx("cancel")}
            >
              {tx("Product BOM")}
            </Button>
            <SettingsMenu title={tx("Settings")} items={[
              { key: "import", label: tx("Import Data"), icon: <UploadFileOutlinedIcon />, disabled: true, title: tx("Import API will be added later"), onClick: () => {} },
              { key: "export", label: tx("Export Data"), icon: <DownloadOutlinedIcon />, onClick: exportCsv },
              { key: "fields", label: tx("Field Configuration"), icon: <TuneOutlinedIcon />, onClick: () => setDialog({ type: "fields" }), divider: true },
              { key: "hierarchy", label: tx("Product Hierarchy"), icon: <AccountTreeOutlinedIcon />, onClick: () => setDialog({ type: "hierarchy" }) },
            ]} />
            <Button
              disabled={!canEdit}
              startIcon={<AddIcon />}
              onClick={() => setDialog({ type: "product", item: null })}
              sx={buttonSx("primary")}
            >
              {tx("Add New Product")}
            </Button>
          </Stack>
        </Box>
        <KpiCardGroup sx={{ mb: 1.5 }}>
          <KpiCard
            label={tx("Total Products")}
            value={kpis.total_products || 0}
            note={tx("All products")}
            icon={<Inventory2OutlinedIcon />}
            tone="primary"
          />
          <KpiCard
            label={tx("Active Products")}
            value={kpis.active_products || 0}
            note={tx("Available for production")}
            icon={<Inventory2OutlinedIcon />}
            tone="success"
          />
          <KpiCard
            label={tx("New This Month")}
            value={kpis.new_this_month || 0}
            note={tx("New products")}
            icon={<LayersOutlinedIcon />}
            tone="accent"
          />
          <KpiCard
            label={tx("Product Families")}
            value={kpis.product_families || 0}
            note={tx("Active families")}
            icon={<AccountTreeOutlinedIcon />}
            tone="warning"
          />
          <KpiCard
            label={tx("Dynamic Fields")}
            value={fields.filter((item) => item.is_active).length}
            note={tx("Configured attributes")}
            icon={<SettingsOutlinedIcon />}
            tone="info"
          />
          <KpiCard
            label={tx("Inactive Products")}
            value={kpis.inactive_products || 0}
            note={tx("Unavailable")}
            icon={<Inventory2OutlinedIcon />}
            tone="danger"
          />
        </KpiCardGroup>
        <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, borderRadius: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(240px,1.6fr) repeat(2,minmax(145px,1fr)) auto" }, gap: 1 }}>
            <TextField size="small" placeholder={tx("Search by product code, name or value...")} value={keyword} onChange={(event) => setKeyword(event.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
            <FormControl size="small">
              <InputLabel shrink>{tx("Product Family")}</InputLabel>
              <Select displayEmpty notched label={tx("Product Family")} value={selectedFamilyId ?? ""}
                onChange={(event) => setSelectedFamilyId(event.target.value === "" ? null : Number(event.target.value))}>
                <MenuItem value="">{tx("All Families")}</MenuItem>
                {families.map((item) => <MenuItem key={item.id} value={item.id}>{item.family_code} · {item.family_name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>{tx("Status")}</InputLabel>
              <Select label={tx("Status")} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <MenuItem value="all">{tx("All Statuses")}</MenuItem>
                <MenuItem value="ACTIVE">{tx("Active")}</MenuItem>
                <MenuItem value="INACTIVE">{tx("Inactive")}</MenuItem>
              </Select>
            </FormControl>
            <Button startIcon={<FilterListIcon />} onClick={() => { setKeyword(""); setSelectedFamilyId(null); setStatusFilter("all"); }}
              sx={buttonSx("cancel", { minHeight: 29, whiteSpace: "nowrap" })}>{tx("Clear")}</Button>
          </Box>
        </Paper>
        <Box
          ref={panelsRef}
          sx={masterGridSx}
        >
          <Paper
            elevation={0}
            sx={{
              ...cardSx,
              height: panelHeight,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <SectionHeader
              icon={
                <AccountTreeOutlinedIcon color="primary" fontSize="small" />
              }
              title={tx("Product Family Tree")}
            />
            <Box sx={{ p: 0.75, overflow: "auto", flex: 1 }}>
              <Box
                onClick={() => setSelectedFamilyId(null)}
                sx={{
                  minHeight: 31,
                  px: 0.75,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  borderRadius: 1,
                  cursor: "pointer",
                  bgcolor:
                    selectedFamilyId == null
                      ? "action.selected"
                      : "transparent",
                }}
              >
                <CategoryOutlinedIcon color="primary" sx={{ fontSize: 14 }} />
                <Typography sx={{ flex: 1, fontSize: 11.5, fontWeight: 800 }}>
                  {tx("All Product Families")}
                </Typography>
                <CountBadge value={kpis.total_products || 0} />
              </Box>
              {familyTree.map((node) => (
                <FamilyTreeNode
                  key={node.id}
                  node={node}
                  selectedId={selectedFamilyId}
                  expanded={expanded}
                  onToggle={(id) =>
                    setExpanded((old) =>
                      old.includes(id)
                        ? old.filter((item) => item !== id)
                        : [...old, id],
                    )
                  }
                  onSelect={setSelectedFamilyId}
                />
              ))}
            </Box>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              ...cardSx,
              height: panelHeight,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}
          >
            <SectionHeader
              icon={<Inventory2OutlinedIcon color="primary" fontSize="small" />}
              title={tx("Product List ({{count}})", {
                count: filteredProducts.length,
              })}
            />
            <Box sx={{ p: 0.75, flex: 1, minHeight: 0 }}>
              <AgGridTable
                rowData={filteredProducts}
                columnDefs={columns}
                loading={loading}
                rowSelection="single"
                onRowClicked={(event) => setSelectedProductId(event.data.id)}
                getRowId={(params) => String(params.data.id)}
                height="100%"
              />
            </Box>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              ...cardSx,
              height: panelHeight,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <SectionHeader
              icon={
                <RemoveRedEyeOutlinedIcon color="primary" fontSize="small" />
              }
              title={tx("Product Detail")}
            />
            {selectedProduct ? (
              <>
                <Box sx={{ p: 1.5, flexShrink: 0 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr) auto", columnGap: 1.25, alignItems: "center" }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", color: "#FFF", bgcolor: "#005BAB" }}>
                      <Inventory2OutlinedIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 0.25 }}>
                      <Typography noWrap title={selectedProduct.product_name} sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>{selectedProduct.product_name}</Typography>
                      <Typography noWrap color="text.secondary" sx={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2 }}>{selectedProduct.product_code}</Typography>
                    </Box>
                    <StatusChip status={selectedProduct.status} />
                  </Box>
                </Box>
                <Tabs value={detailTab} onChange={(_, value) => setDetailTab(value)} variant="fullWidth"
                  sx={{ minHeight: 27, borderTop: 1, borderBottom: 1, borderColor: "divider", "& .MuiTab-root": { minHeight: 27, py: 0, fontSize: 11, fontWeight: 700, textTransform: "none" } }}>
                  <Tab label={tx("Information")} />
                  <Tab label={tx("BOM")} />
                </Tabs>
                <Box sx={{ p: 1.5, flex: 1, minHeight: 0, overflow: "auto" }}>
                  {detailTab === 1 ? (
                    <BomSummary productId={selectedProduct.id} api={API} requestJson={requestJson} tx={tx} refreshKey={bomRefresh}
                      onManage={() => setDialog({ type: "bom", item: selectedProduct })} />
                  ) : (
                    <Stack spacing={1.5}>
                      {selectedProduct.image_url ? (
                        <Box component="a" href={resolveImageUrl(selectedProduct.image_url)} target="_blank" rel="noreferrer" title={tx("Open full image")}
                          sx={{ display: "block", borderRadius: 1.5, overflow: "hidden", border: 1, borderColor: "divider", bgcolor: "action.hover", cursor: "zoom-in" }}>
                          <Box component="img" src={resolveImageUrl(selectedProduct.image_url)} alt={selectedProduct.product_name}
                            sx={{ display: "block", width: "100%", height: 180, objectFit: "contain" }} />
                        </Box>
                      ) : null}
                      <DetailSection title={tx("General")}>
                        <DetailRow label={tx("Product Family")}>{selectedProduct.family_code} · {selectedProduct.family_name}</DetailRow>
                        <DetailRow label={tx("Description")} last>{selectedProduct.description || EMPTY}</DetailRow>
                      </DetailSection>
                          {Object.entries((selectedProduct.values || []).reduce((acc, item) => {
                            const group = item.field_group || tx("Specifications");
                            (acc[group] = acc[group] || []).push(item);
                            return acc;
                          }, {})).map(([group, items]) => (
                            <DetailSection key={group} title={group}>
                              {items.map((item, index) => (
                                <DetailRow key={item.field_id || index} label={item.field_name} last={index === items.length - 1}>
                                  {item.value === null || item.value === undefined || item.value === "" ? EMPTY
                                    : item.data_type === "BOOLEAN" ? (item.value === true || item.value === 1 || item.value === "1" || item.value === "true" ? tx("Yes") : tx("No"))
                                    : Array.isArray(item.value) ? item.value.join(", ") : String(item.value)}
                                  {item.unit_label && item.value != null && item.value !== "" ? ` ${item.unit_label}` : ""}
                                </DetailRow>
                              ))}
                            </DetailSection>
                          ))}
                      <DetailSection title={tx("Record")}>
                        <DetailRow label={tx("Created By")}>{person(selectedProduct.created_by_name, selectedProduct.created_by_code)}</DetailRow>
                        <DetailRow label={tx("Created Date")}>{formatDate(selectedProduct.created_at, i18n.resolvedLanguage)}</DetailRow>
                        <DetailRow label={tx("Last Modified")} last>{formatDate(selectedProduct.updated_at, i18n.resolvedLanguage)}</DetailRow>
                      </DetailSection>
                    </Stack>
                  )}
                </Box>
                <Divider />
                <Stack direction="row" sx={{ p: 1.5, justifyContent: "center", gap: 1.5, flexShrink: 0 }}>
                  <ActionIcon title={tx("Product BOM")} icon={<AccountTreeOutlinedIcon fontSize="small" />} color="primary" onClick={() => setDialog({ type: "bom", item: selectedProduct })} />
                  <ActionIcon title={tx("Edit Product")} icon={<EditOutlinedIcon fontSize="small" />} disabled={!canEdit} onClick={() => openEditProduct(selectedProduct.id)} />
                  <ActionIcon title={selectedProduct.status === "ACTIVE" ? tx("Deactivate") : tx("Activate")}
                    icon={selectedProduct.status === "ACTIVE" ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
                    color={selectedProduct.status === "ACTIVE" ? "warning" : "success"} disabled={!canEdit || saving} onClick={toggleStatus} />
                </Stack>
              </>
            ) : (
              <Box
                sx={{ flex: 1, display: "grid", placeItems: "center", p: 3 }}
              >
                <Typography color="text.secondary">
                  {tx("Select a product to view details.")}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
        {dialog?.type === "product" && (
          <ProductDialog
            key={dialog.item?.id || "new-product"}
            product={dialog.item}
            families={families}
            requestJson={requestJson}
            actor={actor}
            saving={saving}
            onClose={() => setDialog(null)}
            onSave={saveProduct}
          />
        )}
        {dialog?.type === "bom" && (
          <BomManagerDialog
            product={dialog.item}
            api={API}
            requestJson={requestJson}
            tx={tx}
            canEdit={canEdit}
            actor={actor}
            notify={notify}
            onClose={() => setDialog(null)}
            onChanged={() => setBomRefresh((value) => value + 1)}
          />
        )}
        {dialog?.type === "bomOverview" && (
          <BomOverviewDialog
            api={API}
            requestJson={requestJson}
            tx={tx}
            products={products}
            notify={notify}
            onClose={() => setDialog(null)}
            onOpen={(product) => setDialog({ type: "bom", item: product })}
          />
        )}
        {dialog?.type === "hierarchy" && (
          <HierarchyManager
            families={allTreeNodes}
            canEdit={canEdit}
            saving={saving}
            onClose={() => setDialog(null)}
            onAdd={(parent) => setDialog({ type: "family", item: null, parentId: parent?.id ?? "" })}
            onEdit={(item) => setDialog({ type: "family", item })}
            onDelete={deleteFamily}
          />
        )}
        {dialog?.type === "family" && (
          <FamilyDialog
            key={dialog.item?.id || `new-family-${dialog.parentId ?? ""}`}
            family={dialog.item}
            defaultParentId={dialog.parentId ?? ""}
            families={families}
            saving={saving}
            onClose={() => setDialog({ type: "hierarchy" })}
            onSave={saveFamily}
          />
        )}
        {dialog?.type === "fields" && (
          <FieldManager
            fields={fields}
            canEdit={canEdit}
            saving={saving}
            onClose={() => setDialog(null)}
            onAdd={() => setDialog({ type: "field", item: null })}
            onEdit={(item) => setDialog({ type: "field", item })}
            onDelete={deleteField}
          />
        )}
        {dialog?.type === "field" && (
          <FieldDialog
            key={dialog.item?.id || "new-field"}
            field={dialog.item}
            families={families}
            saving={saving}
            onClose={() => setDialog({ type: "fields" })}
            onSave={saveField}
          />
        )}
        <Snackbar
          open={message.open}
          autoHideDuration={4500}
          onClose={() => setMessage((old) => ({ ...old, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            severity={message.type}
            variant="filled"
            onClose={() => setMessage((old) => ({ ...old, open: false }))}
          >
            {message.text}
          </Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}
