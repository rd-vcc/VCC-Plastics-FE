import "./locales";
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
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";

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

const API_BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const API = `${API_BASE}/api/product-master`;
const EMPTY = "—";
let activeTranslator = (key, params = {}) =>
  Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{{${name}}}`, String(value)),
    key,
  );
const tx = (key, params) => activeTranslator(key, params);
const cardSx = {
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 2,
  boxShadow: "0 1px 3px rgba(15,23,42,.06)",
  overflow: "hidden",
};

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

function SectionHeader({ icon, title, action }) {
  return (
    <Box
      sx={{
        minHeight: 36,
        px: 1.25,
        bgcolor: (theme) =>
          theme.palette.mode === "dark" ? "#182235" : "#EAF2FF",
        borderBottom: 1,
        borderColor: "divider",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.75}>
        {icon}
        <Typography variant="subtitle2" noWrap fontWeight={800}>
          {title}
        </Typography>
      </Stack>
      {action}
    </Box>
  );
}

function StatusChip({ status }) {
  const active = status === "ACTIVE";
  return (
    <Chip
      size="small"
      label={active ? tx("Active") : tx("Inactive")}
      color={active ? "success" : "error"}
      variant="outlined"
      sx={{ height: 20, fontWeight: 700, "& .MuiChip-label": { px: 0.75 } }}
    />
  );
}

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
              <ExpandMoreIcon sx={{ fontSize: 16 }} />
            ) : (
              <ChevronRightIcon sx={{ fontSize: 16 }} />
            )
          ) : (
            <Box sx={{ width: 16 }} />
          )}
        </IconButton>
        <AccountTreeOutlinedIcon color="primary" sx={{ fontSize: 16 }} />
        <Typography
          noWrap
          sx={{
            flex: 1,
            fontSize: 11.5,
            fontWeight: selectedId === node.id ? 800 : 600,
          }}
        >
          {node.family_code} · {node.family_name}
        </Typography>
        <Chip
          size="small"
          label={node.product_count ?? node.direct_product_count ?? 0}
          variant="outlined"
          color="primary"
          sx={{
            height: 19,
            minWidth: 26,
            "& .MuiChip-label": { px: 0.55, fontSize: 10 },
          }}
        />
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

function FamilyDialog({ family, families, saving, onClose, onSave }) {
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
          parentId: "",
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
  return (
    <Dialog
      open
      fullWidth
      maxWidth="sm"
      onClose={saving ? undefined : onClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 24px 60px rgba(0,0,0,.55)"
              : "0 24px 60px rgba(15,23,42,.18)",
        },
      }}
    >
      <DialogHeader
        icon={<CategoryOutlinedIcon />}
        title={family ? tx("Edit Product Family") : tx("Add Product Family")}
        disabled={saving}
        onClose={onClose}
      />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              fullWidth
              size="small"
              label={tx("Family Code")}
              disabled={Boolean(family)}
              value={form.code}
              onChange={change("code")}
            />
            <TextField
              fullWidth
              size="small"
              label={tx("Family Name")}
              value={form.name}
              onChange={change("name")}
            />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <FormControl fullWidth size="small">
              <InputLabel>{tx("Parent Family")}</InputLabel>
              <Select
                label={tx("Parent Family")}
                value={form.parentId}
                onChange={change("parentId")}
              >
                <MenuItem value="">
                  <em>{tx("Root family")}</em>
                </MenuItem>
                {families
                  .filter(
                    (item) => item.status === "ACTIVE" && !blocked.has(item.id),
                  )
                  .map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.family_code} · {item.family_name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              label={tx("Sort Order")}
              type="number"
              value={form.sortOrder}
              onChange={change("sortOrder")}
            />
            <FormControl fullWidth size="small">
              <InputLabel>{tx("Status")}</InputLabel>
              <Select
                label={tx("Status")}
                value={form.status}
                onChange={change("status")}
              >
                <MenuItem value="ACTIVE">{tx("Active")}</MenuItem>
                <MenuItem value="INACTIVE">{tx("Inactive")}</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label={tx("Description")}
            value={form.description}
            onChange={change("description")}
          />
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
        <Button onClick={onClose} disabled={saving} sx={buttonSx("cancel")}>
          {tx("Cancel")}
        </Button>
        <Button
          onClick={() => onSave(form)}
          disabled={saving || !form.code.trim() || !form.name.trim()}
          sx={buttonSx("primary")}
          startIcon={
            saving ? <CircularProgress size={16} color="inherit" /> : null
          }
        >
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
    <Dialog
      open
      fullWidth
      maxWidth="md"
      onClose={saving ? undefined : onClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 24px 60px rgba(0,0,0,.55)"
              : "0 24px 60px rgba(15,23,42,.18)",
        },
      }}
    >
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
            <Stack direction="row" flexWrap="wrap" gap={1}>
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
        <Button onClick={onClose} disabled={saving} sx={buttonSx("cancel")}>
          {tx("Cancel")}
        </Button>
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
    <TextField
      {...common}
      type={typeMap[field.data_type] || "text"}
      multiline={field.data_type === "LONG_TEXT"}
      minRows={field.data_type === "LONG_TEXT" ? 3 : undefined}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      InputLabelProps={
        ["DATE", "DATETIME"].includes(field.data_type)
          ? { shrink: true }
          : undefined
      }
      placeholder={
        field.placeholder ||
        (["FILE", "IMAGE"].includes(field.data_type)
          ? tx("Enter URL or storage key")
          : undefined)
      }
    />
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
        }
      : { code: "", name: "", familyId: "", status: "ACTIVE" },
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
  return (
    <Dialog
      open
      fullWidth
      maxWidth="md"
      onClose={saving ? undefined : onClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 24px 60px rgba(0,0,0,.55)"
              : "0 24px 60px rgba(15,23,42,.18)",
        },
      }}
    >
      <DialogHeader
        icon={<Inventory2OutlinedIcon />}
        title={product ? tx("Edit Product") : tx("Add Product")}
        disabled={saving}
        onClose={onClose}
      />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              fullWidth
              size="small"
              label={tx("Product Code")}
              disabled={Boolean(product)}
              value={form.code}
              onChange={(event) =>
                setForm((old) => ({ ...old, code: event.target.value }))
              }
            />
            <TextField
              fullWidth
              size="small"
              label={tx("Product Name")}
              value={form.name}
              onChange={(event) =>
                setForm((old) => ({ ...old, name: event.target.value }))
              }
            />
            <FormControl fullWidth size="small">
              <InputLabel>{tx("Product Family")}</InputLabel>
              <Select
                label={tx("Product Family")}
                value={form.familyId}
                onChange={(event) => {
                  setForm((old) => ({ ...old, familyId: event.target.value }));
                  setValues({});
                }}
              >
                {families
                  .filter((item) => item.status === "ACTIVE")
                  .map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.family_code} · {item.family_name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>{tx("Status")}</InputLabel>
              <Select
                label={tx("Status")}
                value={form.status}
                onChange={(event) =>
                  setForm((old) => ({ ...old, status: event.target.value }))
                }
              >
                <MenuItem value="ACTIVE">{tx("Active")}</MenuItem>
                <MenuItem value="INACTIVE">{tx("Inactive")}</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          {loading && <LinearProgress />}
          {Object.entries(groups).map(([group, items]) => (
            <Paper key={group} variant="outlined" sx={{ p: 1.5 }}>
              <Typography
                variant="subtitle2"
                fontWeight={800}
                color="primary"
                sx={{ mb: 1.5 }}
              >
                {group.replaceAll("_", " ")}
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2,minmax(0,1fr))",
                  },
                  gap: 1.5,
                }}
              >
                {items.map((field) => (
                  <DynamicInput
                    key={field.id}
                    field={field}
                    value={values[field.id]}
                    onChange={(value) =>
                      setValues((old) => ({ ...old, [field.id]: value }))
                    }
                  />
                ))}
              </Box>
            </Paper>
          ))}
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
        <Button onClick={onClose} disabled={saving} sx={buttonSx("cancel")}>
          {tx("Cancel")}
        </Button>
        <Button
          onClick={submit}
          disabled={saving || invalid}
          sx={buttonSx("primary")}
          startIcon={
            saving ? <CircularProgress size={16} color="inherit" /> : null
          }
        >
          {tx("Save Product")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function HierarchyManager({
  families,
  canEdit,
  saving,
  onClose,
  onAdd,
  onEdit,
  onDelete,
}) {
  return (
    <Dialog
      open
      fullWidth
      maxWidth="md"
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 24px 60px rgba(0,0,0,.55)"
              : "0 24px 60px rgba(15,23,42,.18)",
        },
      }}
    >
      <DialogHeader
        icon={<AccountTreeOutlinedIcon />}
        title={tx("Product Hierarchy")}
        onClose={onClose}
      />
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 1.5, display: "flex", justifyContent: "flex-end" }}>
          <Button
            disabled={!canEdit}
            onClick={onAdd}
            startIcon={<AddIcon />}
            sx={buttonSx("primary")}
          >
            {tx("Add Family")}
          </Button>
        </Box>
        <Divider />
        <Stack divider={<Divider />} sx={{ maxHeight: 520, overflow: "auto" }}>
          {families.map((family) => (
            <Box
              key={family.id}
              sx={{
                px: 2,
                py: 1,
                pl: `${family.depth * 22 + 16}px`,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <AccountTreeOutlinedIcon color="primary" fontSize="small" />
              <Box flex={1} minWidth={0}>
                <Typography noWrap fontSize={12.5} fontWeight={700}>
                  {family.family_code} · {family.family_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {family.parent_name
                    ? tx("Parent: {{name}}", { name: family.parent_name })
                    : tx("Root family")}{" "}
                  ·{" "}
                  {tx("{{count}} products", {
                    count: family.direct_product_count || 0,
                  })}
                </Typography>
              </Box>
              <StatusChip status={family.status} />
              <IconButton
                size="small"
                disabled={!canEdit || saving}
                onClick={() => onEdit(family)}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                disabled={!canEdit || saving}
                onClick={() => onDelete(family)}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={buttonSx("cancel")}>
          {tx("Close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function FieldManager({
  fields,
  canEdit,
  saving,
  onClose,
  onAdd,
  onEdit,
  onDelete,
}) {
  return (
    <Dialog
      open
      fullWidth
      maxWidth="lg"
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 24px 60px rgba(0,0,0,.55)"
              : "0 24px 60px rgba(15,23,42,.18)",
        },
      }}
    >
      <DialogHeader
        icon={<TuneOutlinedIcon />}
        title={tx("Product Field Configuration")}
        onClose={onClose}
      />
      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            p: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {tx("Fields are rendered automatically in the Product form.")}
          </Typography>
          <Button
            disabled={!canEdit}
            onClick={onAdd}
            startIcon={<AddIcon />}
            sx={buttonSx("primary")}
          >
            {tx("Add Field")}
          </Button>
        </Box>
        <Box sx={{ overflow: "auto" }}>
          <Box
            component="table"
            sx={{
              width: "100%",
              borderCollapse: "collapse",
              "& th,& td": {
                px: 1.5,
                py: 1,
                borderTop: 1,
                borderColor: "divider",
                textAlign: "left",
                fontSize: 12,
              },
              "& th": { bgcolor: "action.hover", fontWeight: 800 },
            }}
          >
            <thead>
              <tr>
                <th>{tx("Field Code")}</th>
                <th>{tx("Field Name")}</th>
                <th>{tx("Data Type")}</th>
                <th>{tx("Field Group")}</th>
                <th>{tx("Scope")}</th>
                <th>{tx("List")}</th>
                <th>{tx("Status")}</th>
                <th>{tx("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field.id}>
                  <td>{field.field_code}</td>
                  <td>
                    <b>{field.field_name}</b>
                  </td>
                  <td>{field.data_type}</td>
                  <td>{field.field_group || EMPTY}</td>
                  <td>
                    {field.applies_to_all_families
                      ? tx("All families")
                      : tx("{{count}} families", {
                          count: field.families?.length || 0,
                        })}
                  </td>
                  <td>{field.is_list_visible ? tx("Yes") : tx("No")}</td>
                  <td>
                    <StatusChip
                      status={field.is_active ? "ACTIVE" : "INACTIVE"}
                    />
                  </td>
                  <td>
                    <IconButton
                      size="small"
                      disabled={!canEdit || saving}
                      onClick={() => onEdit(field)}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      disabled={!canEdit || saving}
                      onClick={() => onDelete(field)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={buttonSx("cancel")}>
          {tx("Close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ProductMaster() {
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
  const [settingsAnchor, setSettingsAnchor] = useState(null);
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
        width: 135,
        pinned: "left",
      },
      {
        headerName: translate("Product Name"),
        field: "product_name",
        minWidth: 175,
        flex: 1.2,
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
        width: 95,
        cellRenderer: (params) => (
          <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}>
            <StatusChip status={params.value} />
          </Box>
        ),
      },
      {
        headerName: translate("Actions"),
        width: 95,
        sortable: false,
        filter: false,
        cellRenderer: (params) => (
          <Stack direction="row" alignItems="center" height="100%">
            <IconButton
              size="small"
              onClick={() => setSelectedProductId(params.data.id)}
            >
              <RemoveRedEyeOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              disabled={!canEdit}
              onClick={() => openEditProduct(params.data.id)}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Stack>
        ),
      },
    ],
    [canEdit, listFields, openEditProduct, translate],
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
    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "product-master.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const details = useMemo(
    () =>
      selectedProduct
        ? [
            { label: tx("Product Code"), value: selectedProduct.product_code },
            { label: tx("Product Name"), value: selectedProduct.product_name },
            {
              label: tx("Product Family"),
              value: `${selectedProduct.family_code} · ${selectedProduct.family_name}`,
            },
            ...(selectedProduct.values || []).map((item) => ({
              label: item.field_name,
              value: Array.isArray(item.value)
                ? item.value.join(", ")
                : item.value,
              unit: item.unit_label,
            })),
            {
              label: tx("Status"),
              value:
                selectedProduct.status === "ACTIVE"
                  ? tx("Active")
                  : tx("Inactive"),
            },
            { label: tx("Created By"), value: selectedProduct.created_by },
            {
              label: tx("Created Date"),
              value: formatDate(
                selectedProduct.created_at,
                i18n.resolvedLanguage,
              ),
            },
            {
              label: tx("Last Modified"),
              value: formatDate(
                selectedProduct.updated_at,
                i18n.resolvedLanguage,
              ),
            },
          ]
        : [],
    [i18n.resolvedLanguage, selectedProduct],
  );
  const distribution = useMemo(
    () =>
      familyTree
        .map((item) => ({
          name: item.family_name,
          count: item.product_count || 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    [familyTree],
  );
  const maxCount = Math.max(1, ...distribution.map((item) => item.count));

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
            <Typography variant="h5" fontWeight={800}>
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
            <Tooltip title={tx("Settings")}>
              <IconButton
                onClick={(event) => setSettingsAnchor(event.currentTarget)}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <SettingsOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={settingsAnchor}
              open={Boolean(settingsAnchor)}
              onClose={() => setSettingsAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem
                disabled
                onClick={() => setSettingsAnchor(null)}
                title={tx("Import API will be added later")}
              >
                <ListItemIcon>
                  <UploadFileOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{tx("Import Data")}</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setSettingsAnchor(null);
                  exportCsv();
                }}
              >
                <ListItemIcon>
                  <DownloadOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{tx("Export Data")}</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={() => {
                  setSettingsAnchor(null);
                  setDialog({ type: "fields" });
                }}
              >
                <ListItemIcon>
                  <TuneOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{tx("Field Configuration")}</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setSettingsAnchor(null);
                  setDialog({ type: "hierarchy" });
                }}
              >
                <ListItemIcon>
                  <AccountTreeOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{tx("Product Hierarchy")}</ListItemText>
              </MenuItem>
            </Menu>
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
        <Paper elevation={0} sx={{ ...cardSx, p: 1, mb: 1.5 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <TextField
              size="small"
              placeholder={tx("Search by product code, name or value...")}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              sx={{ flex: 1, minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 210 }}>
              <InputLabel>{tx("Product Family")}</InputLabel>
              <Select
                label={tx("Product Family")}
                value={selectedFamilyId ?? ""}
                onChange={(event) =>
                  setSelectedFamilyId(
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                  )
                }
              >
                <MenuItem value="">{tx("All Families")}</MenuItem>
                {families.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.family_code} · {item.family_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{tx("Status")}</InputLabel>
              <Select
                label={tx("Status")}
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <MenuItem value="all">{tx("All Statuses")}</MenuItem>
                <MenuItem value="ACTIVE">{tx("Active")}</MenuItem>
                <MenuItem value="INACTIVE">{tx("Inactive")}</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              onClick={() => {
                setKeyword("");
                setSelectedFamilyId(null);
                setStatusFilter("all");
              }}
            >
              {tx("Clear")}
            </Button>
            <IconButton onClick={loadData}>
              <RefreshIcon />
            </IconButton>
          </Stack>
        </Paper>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "250px minmax(0,1fr) 300px" },
            gap: 1.5,
            mb: 1.5,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              ...cardSx,
              height: { xs: 320, lg: 560 },
              display: "flex",
              flexDirection: "column",
            }}
          >
            <SectionHeader
              icon={
                <AccountTreeOutlinedIcon color="primary" fontSize="small" />
              }
              title={tx("Product Family Tree")}
              action={
                <IconButton size="small" onClick={loadData}>
                  <RefreshIcon sx={{ fontSize: 17 }} />
                </IconButton>
              }
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
                <CategoryOutlinedIcon color="primary" sx={{ fontSize: 17 }} />
                <Typography sx={{ flex: 1, fontSize: 11.5, fontWeight: 800 }}>
                  {tx("All Product Families")}
                </Typography>
                <Chip
                  size="small"
                  label={kpis.total_products || 0}
                  variant="outlined"
                  sx={{ height: 19 }}
                />
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
              height: 560,
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
                pagination
                paginationPageSize={20}
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
              height: { xs: "auto", lg: 560 },
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
                <Box sx={{ p: 1.5, borderBottom: 1, borderColor: "divider" }}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 2,
                        bgcolor: "action.hover",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Inventory2OutlinedIcon
                        color="primary"
                        sx={{ fontSize: 30 }}
                      />
                    </Box>
                    <Box minWidth={0}>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Typography noWrap fontWeight={800}>
                          {selectedProduct.product_code}
                        </Typography>
                        <StatusChip status={selectedProduct.status} />
                      </Stack>
                      <Typography noWrap variant="body2" color="text.secondary">
                        {selectedProduct.product_name}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
                <Tabs
                  value={0}
                  variant="fullWidth"
                  sx={{
                    minHeight: 36,
                    borderBottom: 1,
                    borderColor: "divider",
                    "& .MuiTab-root": {
                      minHeight: 36,
                      py: 0,
                      fontSize: 11,
                      fontWeight: 700,
                    },
                  }}
                >
                  <Tab label={tx("General")} />
                </Tabs>
                <Box sx={{ p: 1.5, flex: 1, overflow: "auto" }}>
                  <Stack spacing={1}>
                    {details.map((item, index) => (
                      <Box
                        key={`${item.label}-${index}`}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "42% 58%",
                          gap: 1,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {item.label}
                        </Typography>
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          sx={{ overflowWrap: "anywhere" }}
                        >
                          {item.value === null ||
                          item.value === undefined ||
                          item.value === ""
                            ? EMPTY
                            : String(item.value)}
                          {item.unit && item.value != null
                            ? ` ${item.unit}`
                            : ""}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
                <Divider />
                <Stack
                  direction="row"
                  sx={{ p: 1.5, justifyContent: "center", gap: 2.5 }}
                >
                  <Tooltip title={tx("Edit Product")}>
                    <span>
                      <IconButton
                        disabled={!canEdit}
                        color="primary"
                        onClick={() => openEditProduct(selectedProduct.id)}
                        sx={{
                          border: 1,
                          borderColor: "primary.light",
                          borderRadius: 1.5,
                        }}
                      >
                        <EditOutlinedIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip
                    title={
                      selectedProduct.status === "ACTIVE"
                        ? tx("Deactivate")
                        : tx("Activate")
                    }
                  >
                    <span>
                      <IconButton
                        disabled={!canEdit || saving}
                        color={
                          selectedProduct.status === "ACTIVE"
                            ? "error"
                            : "success"
                        }
                        onClick={toggleStatus}
                        sx={{
                          border: 1,
                          borderColor: "currentColor",
                          borderRadius: 1.5,
                        }}
                      >
                        <Inventory2OutlinedIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
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
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1.2fr 1fr" },
            gap: 1.5,
          }}
        >
          <Paper elevation={0} sx={cardSx}>
            <SectionHeader
              icon={
                <AccountTreeOutlinedIcon color="primary" fontSize="small" />
              }
              title={tx("Products by Family")}
            />
            <Stack spacing={1.25} sx={{ p: 1.5 }}>
              {distribution.length ? (
                distribution.map((item) => (
                  <Box key={item.name}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" fontWeight={700}>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.count}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={(item.count / maxCount) * 100}
                      sx={{ mt: 0.4, height: 7, borderRadius: 5 }}
                    />
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {tx("No product data.")}
                </Typography>
              )}
            </Stack>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <SectionHeader
              icon={<RefreshIcon color="primary" fontSize="small" />}
              title={tx("Recently Updated Products")}
            />
            <Stack divider={<Divider />}>
              {products.slice(0, 5).map((product) => (
                <Box
                  key={product.id}
                  onClick={() => setSelectedProductId(product.id)}
                  sx={{
                    px: 1.5,
                    py: 1,
                    cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" gap={1}>
                    <Box minWidth={0}>
                      <Typography noWrap variant="caption" fontWeight={800}>
                        {product.product_code} · {product.product_name}
                      </Typography>
                      <Typography
                        display="block"
                        variant="caption"
                        color="text.secondary"
                      >
                        {product.family_name}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      whiteSpace="nowrap"
                    >
                      {formatDate(product.updated_at, i18n.resolvedLanguage)}
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>
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
        {dialog?.type === "hierarchy" && (
          <HierarchyManager
            families={allTreeNodes}
            canEdit={canEdit}
            saving={saving}
            onClose={() => setDialog(null)}
            onAdd={() => setDialog({ type: "family", item: null })}
            onEdit={(item) => setDialog({ type: "family", item })}
            onDelete={deleteFamily}
          />
        )}
        {dialog?.type === "family" && (
          <FamilyDialog
            key={dialog.item?.id || "new-family"}
            family={dialog.item}
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
