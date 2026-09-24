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
  FormControlLabel,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Popover,
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
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import PageMeta from "../../../../components/common/PageMeta";
import ImageUploadField, { resolveImageUrl } from "../../../../components/common/ImageUploadField";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import AgGridTable from "../../../../components/tables/BasicTables/BasicTableOne";
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

const EMPTY_STATS = {
  total_tools: 0,
  in_use: 0,
  available: 0,
  in_maintenance: 0,
  out_of_service: 0,
  inactive: 0,
  calibration_due_soon: 0,
};

const TOOL_TYPES = ["CUTTING", "ASSEMBLY", "MEASURING", "HANDLING"];
const STATUSES = ["IN_USE", "AVAILABLE", "IN_MAINTENANCE", "OUT_OF_SERVICE", "INACTIVE"];

const panelSx = {
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 2,
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(15,23,42,.05)",
};

function buttonSx(type, overrides = {}) {
  const styles = buttonSystem[type] || {};
  return {
    ...(styles.base || {}),
    ...(styles.hover ? { "&:hover": styles.hover } : {}),
    ...overrides,
  };
}

function createToolTheme(mode) {
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
      fontSize: 12,
    },
    components: {
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: dark ? "#0F172A" : "#FFF",
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

function formatDisplayDate(iso) {
  if (!iso) return EMPTY;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
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

const dialogPaperSx = {
  borderRadius: 3,
  overflow: "hidden",
  boxShadow: (theme) =>
    theme.palette.mode === "dark"
      ? "0 24px 60px rgba(0,0,0,.55)"
      : "0 24px 60px rgba(15,23,42,.18)",
};

function SectionHeader({ title, icon, action }) {
  return (
    <Box
      sx={{
        height: 34,
        px: 1.25,
        bgcolor: (theme) => (theme.palette.mode === "dark" ? "#182235" : "#E8F1FF"),
        borderBottom: 1,
        borderColor: "divider",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
        {icon}
        <Typography variant="subtitle2" fontWeight={700}>
          {title}
        </Typography>
      </Stack>
      {action}
    </Box>
  );
}

const TYPE_TONES = {
  CUTTING: "info",
  ASSEMBLY: "success",
  MEASURING: "warning",
  HANDLING: "secondary",
};

function ToolTypeChip({ value }) {
  return (
    <Chip
      size="small"
      variant="outlined"
      color={TYPE_TONES[value] || "default"}
      label={toolTypeText(value)}
      sx={{ height: 21, fontSize: 10.5 }}
    />
  );
}

const STATUS_TONES = {
  ACTIVE: "success",
  IN_USE: "success",
  AVAILABLE: "info",
  IN_MAINTENANCE: "warning",
  OUT_OF_SERVICE: "error",
  INACTIVE: "default",
};

function StatusChip({ status }) {
  return (
    <Chip
      size="small"
      variant="outlined"
      color={STATUS_TONES[status] || "default"}
      label={statusText(status)}
      sx={{ height: 21, fontSize: 10.5, fontWeight: 700 }}
    />
  );
}

function Field({ label, children }) {
  return (
    <Stack direction="row" spacing={1} sx={{ py: 0.45 }}>
      <Typography variant="caption" color="text.secondary" sx={{ width: 130, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="caption" fontWeight={600} sx={{ minWidth: 0, wordBreak: "break-word" }}>
        {children ?? EMPTY}
      </Typography>
    </Stack>
  );
}

function countToolsInSubtree(nodeId, allNodes, tools) {
  const direct = tools.filter((item) => item.production_tool_node_id === nodeId).length;
  const children = allNodes.filter((item) => item.parent_id === nodeId);
  return children.reduce((sum, child) => sum + countToolsInSubtree(child.id, allNodes, tools), direct);
}

function LocationTreeNode({ node, allNodes, tools, selectedId, expanded, onToggle, onSelect, depth = 0 }) {
  const children = allNodes.filter((item) => item.parent_id === node.id);
  const open = expanded.includes(node.id);
  const count = countToolsInSubtree(node.id, allNodes, tools);
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
            open ? <ExpandMoreIcon sx={{ fontSize: 16 }} /> : <ChevronRightIcon sx={{ fontSize: 16 }} />
          ) : (
            <Box sx={{ width: 16 }} />
          )}
        </IconButton>
        <CategoryOutlinedIcon color={selectedId === node.id ? "primary" : "inherit"} sx={{ fontSize: 16 }} />
        <Typography noWrap variant="caption" sx={{ flex: 1, fontWeight: selectedId === node.id ? 700 : 500 }}>
          {node.name}
        </Typography>
        <Chip
          size="small"
          label={count}
          variant="outlined"
          color={selectedId === node.id ? "primary" : "default"}
          sx={{ height: 18, "& .MuiChip-label": { px: 0.6, fontSize: 9.5 } }}
        />
      </Box>
      {open &&
        children.map((child) => (
          <LocationTreeNode
            key={child.id}
            node={child}
            allNodes={allNodes}
            tools={tools}
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

function NodeTreeOption({ node, allNodes, depth, expanded, onToggle, onPick, selectableGroups, selectedId }) {
  const children = allNodes.filter((item) => item.parent_id === node.id);
  const isGroup = children.length > 0;
  const open = expanded.includes(node.id);
  const selectable = selectableGroups || !isGroup;
  const isSelected = selectedId === node.id;
  return (
    <Box>
      <Box
        onClick={() => selectable && onPick(node)}
        sx={{
          minHeight: 32,
          pl: `${depth * 16 + 4}px`,
          pr: 1,
          display: "flex",
          alignItems: "center",
          gap: 0.4,
          cursor: selectable ? "pointer" : "default",
          borderRadius: 1,
          bgcolor: isSelected ? "action.selected" : "transparent",
          "&:hover": selectable ? { bgcolor: "action.hover" } : undefined,
        }}
      >
        <IconButton
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            if (isGroup) onToggle(node.id);
          }}
          sx={{ width: 20, height: 20, flexShrink: 0 }}
        >
          {isGroup ? (
            open ? <ExpandMoreIcon sx={{ fontSize: 16 }} /> : <ChevronRightIcon sx={{ fontSize: 16 }} />
          ) : (
            <Box sx={{ width: 16 }} />
          )}
        </IconButton>
        <CategoryOutlinedIcon sx={{ fontSize: 15, color: isGroup ? "text.secondary" : "primary.main", flexShrink: 0 }} />
        <Typography
          noWrap
          sx={{
            fontSize: isGroup ? 10.5 : 12.5,
            fontWeight: isGroup ? 700 : isSelected ? 700 : 500,
            color: !selectable ? "text.disabled" : isGroup ? "text.secondary" : "text.primary",
            textTransform: isGroup ? "uppercase" : "none",
            letterSpacing: isGroup ? 0.4 : 0,
          }}
        >
          {node.name}
        </Typography>
      </Box>
      {open &&
        children.map((child) => (
          <NodeTreeOption
            key={child.id}
            node={child}
            allNodes={allNodes}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
            onPick={onPick}
            selectableGroups={selectableGroups}
            selectedId={selectedId}
          />
        ))}
    </Box>
  );
}

function NodeTreePicker({ nodes, value, onChange, label, placeholder = "—", selectableGroups = false, excludeId }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const filteredNodes = useMemo(
    () => nodes.filter((n) => n.id !== excludeId),
    [nodes, excludeId],
  );
  const roots = useMemo(() => filteredNodes.filter((n) => n.parent_id == null), [filteredNodes]);
  const [expanded, setExpanded] = useState([]);
  useEffect(() => {
    setExpanded(filteredNodes.map((n) => n.id));
  }, [filteredNodes]);
  const selectedNode = filteredNodes.find((n) => n.id === value);
  const toggle = (id) => setExpanded((old) => (old.includes(id) ? old.filter((x) => x !== id) : [...old, id]));
  const pick = (node) => {
    onChange(node.id);
    setAnchorEl(null);
  };
  return (
    <>
      <TextField
        size="small"
        label={label}
        value={selectedNode ? selectedNode.name : ""}
        placeholder={placeholder}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <ExpandMoreIcon fontSize="small" sx={{ color: "text.secondary" }} />
            </InputAdornment>
          ),
        }}
        sx={{ "& .MuiInputBase-input": { cursor: "pointer" } }}
      />
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Box sx={{ width: 300, maxHeight: 360, overflow: "auto", p: 0.5 }}>
          <Box
            onClick={() => pick({ id: "" })}
            sx={{ px: 1.25, py: 0.7, cursor: "pointer", borderRadius: 1, "&:hover": { bgcolor: "action.hover" } }}
          >
            <Typography variant="caption" color="text.secondary">
              {placeholder}
            </Typography>
          </Box>
          <Divider sx={{ my: 0.5 }} />
          {roots.map((node) => (
            <NodeTreeOption
              key={node.id}
              node={node}
              allNodes={filteredNodes}
              depth={0}
              expanded={expanded}
              onToggle={toggle}
              onPick={pick}
              selectableGroups={selectableGroups}
              selectedId={value}
            />
          ))}
        </Box>
      </Popover>
    </>
  );
}

const emptyTool = {
  tool_code: "",
  tool_name: "",
  tool_type: "CUTTING",
  production_tool_node_id: "",
  tool_category: "",
  manufacturer: "",
  model: "",
  serial_number: "",
  assigned_process: "",
  status: "AVAILABLE",
  measurement_range: "",
  measurement_resolution: "",
  calibration_required: false,
  calibration_due_date: "",
  last_calibration_date: "",
  calibration_interval_days: "",
  description: "",
  image_url: "",
};

function ToolDialog({ open, tool, nodes, fieldDefinitions, saving, onClose, onSave }) {
  const [form, setForm] = useState(emptyTool);
  const [customFields, setCustomFields] = useState({});
  const [tab, setTab] = useState(0);
  useEffect(() => {
    if (!open) return;
    setForm(
      tool
        ? {
            ...emptyTool,
            ...tool,
            production_tool_node_id: tool.production_tool_node_id ?? "",
            calibration_interval_days: tool.calibration_interval_days ?? "",
            calibration_due_date: tool.calibration_due_date ?? "",
            last_calibration_date: tool.last_calibration_date ?? "",
          }
        : emptyTool,
    );
    setCustomFields({ ...(tool?.custom_fields || {}) });
    setTab(0);
  }, [open, tool]);
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const setCustomField = (fieldCode, value) => setCustomFields((old) => ({ ...old, [fieldCode]: value }));
  const activeFields = fieldDefinitions.filter((f) => f.is_active);
  const submit = () => {
    const preparedCustomFields = {};
    activeFields.forEach((field) => {
      const raw = customFields[field.field_code];
      if (raw === "" || raw === undefined) {
        preparedCustomFields[field.field_code] = null;
      } else if (field.data_type === "INTEGER" || field.data_type === "DECIMAL") {
        preparedCustomFields[field.field_code] = raw === null ? null : Number(raw);
      } else if (field.data_type === "BOOLEAN") {
        preparedCustomFields[field.field_code] = Boolean(raw);
      } else {
        preparedCustomFields[field.field_code] = raw;
      }
    });
    onSave({
      ...form,
      production_tool_node_id: form.production_tool_node_id === "" ? null : Number(form.production_tool_node_id),
      calibration_interval_days:
        form.calibration_interval_days === "" ? null : Number(form.calibration_interval_days),
      calibration_due_date: form.calibration_due_date || null,
      last_calibration_date: form.last_calibration_date || null,
      image_url: form.image_url || null,
      custom_fields: preparedCustomFields,
    });
  };
  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md" PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader
        icon={<PrecisionManufacturingOutlinedIcon />}
        title={tool ? tx("Edit Tool") : tx("Add New Tool")}
        disabled={saving}
        onClose={onClose}
      />
      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ px: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tab label={tx("General")} />
        <Tab label={tx("Specification")} />
        {activeFields.length > 0 && <Tab label={tx("Custom Fields")} />}
      </Tabs>
      <DialogContent dividers sx={{ minHeight: 380 }}>
        {tab === 0 && (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 2 }}>
            <TextField
              size="small"
              required
              disabled={Boolean(tool)}
              label={tx("Tool Code")}
              value={form.tool_code}
              onChange={(e) => set("tool_code", e.target.value.toUpperCase())}
            />
            <TextField
              size="small"
              required
              label={tx("Tool Name")}
              value={form.tool_name}
              onChange={(e) => set("tool_name", e.target.value)}
            />
            <TextField
              select
              size="small"
              label={tx("Tool Type")}
              value={form.tool_type}
              onChange={(e) => set("tool_type", e.target.value)}
            >
              {TOOL_TYPES.map((item) => (
                <MenuItem key={item} value={item}>
                  {toolTypeText(item)}
                </MenuItem>
              ))}
            </TextField>
            <NodeTreePicker
              nodes={nodes}
              value={form.production_tool_node_id}
              onChange={(id) => set("production_tool_node_id", id)}
              label={tx("Location")}
              selectableGroups={false}
            />
            <TextField
              size="small"
              label={tx("Category")}
              value={form.tool_category || ""}
              onChange={(e) => set("tool_category", e.target.value)}
            />
            <TextField
              size="small"
              label={tx("Manufacturer")}
              value={form.manufacturer || ""}
              onChange={(e) => set("manufacturer", e.target.value)}
            />
            <TextField
              size="small"
              label={tx("Model")}
              value={form.model || ""}
              onChange={(e) => set("model", e.target.value)}
            />
            <TextField
              size="small"
              label={tx("Serial Number")}
              value={form.serial_number || ""}
              onChange={(e) => set("serial_number", e.target.value)}
            />
            <TextField
              select
              size="small"
              label={tx("Status")}
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {STATUSES.map((item) => (
                <MenuItem key={item} value={item}>
                  {statusText(item)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label={tx("Assigned Process")}
              value={form.assigned_process || ""}
              onChange={(e) => set("assigned_process", e.target.value)}
            />
            <TextField
              size="small"
              multiline
              minRows={2}
              label={tx("Description")}
              value={form.description || ""}
              onChange={(e) => set("description", e.target.value)}
              sx={{ gridColumn: "1 / -1" }}
            />
            <Box sx={{ gridColumn: "1 / -1" }}>
              <ImageUploadField value={form.image_url || ""} category="production_tool" label={tx("Image")} disabled={saving} onChange={(v) => set("image_url", v || "")} />
            </Box>
          </Box>
        )}
        {tab === 1 && (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 2 }}>
            <TextField
              size="small"
              label={tx("Measurement Range")}
              value={form.measurement_range || ""}
              onChange={(e) => set("measurement_range", e.target.value)}
            />
            <TextField
              size="small"
              label={tx("Measurement Resolution")}
              value={form.measurement_resolution || ""}
              onChange={(e) => set("measurement_resolution", e.target.value)}
            />
            <FormControlLabel
              sx={{ gridColumn: "1 / -1" }}
              control={
                <Switch
                  checked={Boolean(form.calibration_required)}
                  onChange={(e) => set("calibration_required", e.target.checked)}
                />
              }
              label={tx("Calibration Required")}
            />
            {form.calibration_required && (
              <>
                <TextField
                  size="small"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  label={tx("Calibration Due Date")}
                  value={form.calibration_due_date || ""}
                  onChange={(e) => set("calibration_due_date", e.target.value)}
                />
                <TextField
                  size="small"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  label={tx("Last Calibration Date")}
                  value={form.last_calibration_date || ""}
                  onChange={(e) => set("last_calibration_date", e.target.value)}
                />
                <TextField
                  size="small"
                  type="number"
                  label={tx("Calibration Interval (days)")}
                  value={form.calibration_interval_days ?? ""}
                  onChange={(e) => set("calibration_interval_days", e.target.value)}
                />
              </>
            )}
          </Box>
        )}
        {tab === 2 && (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 2 }}>
            {activeFields.map((field) =>
              field.data_type === "BOOLEAN" ? (
                <FormControlLabel
                  key={field.field_code}
                  control={
                    <Switch
                      checked={Boolean(customFields[field.field_code])}
                      onChange={(e) => setCustomField(field.field_code, e.target.checked)}
                    />
                  }
                  label={field.field_name}
                />
              ) : (
                <TextField
                  key={field.field_code}
                  size="small"
                  required={field.is_required}
                  type={
                    field.data_type === "INTEGER" || field.data_type === "DECIMAL"
                      ? "number"
                      : field.data_type === "DATE"
                        ? "date"
                        : "text"
                  }
                  label={field.unit ? `${field.field_name} (${field.unit})` : field.field_name}
                  helperText={field.description || undefined}
                  value={customFields[field.field_code] ?? ""}
                  onChange={(e) => setCustomField(field.field_code, e.target.value)}
                  InputLabelProps={field.data_type === "DATE" ? { shrink: true } : undefined}
                />
              ),
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={buttonSx("cancel")}>
          {tx("Cancel")}
        </Button>
        <Button
          variant="contained"
          disabled={saving || !form.tool_code.trim() || !form.tool_name.trim()}
          onClick={submit}
          sx={buttonSx("primary")}
        >
          {saving ? <CircularProgress size={18} /> : tx("Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function LocationDialog({ open, nodes, nodeTypes, saving, onClose, onReload, request, actor }) {
  const [tab, setTab] = useState(0);
  const [editing, setEditing] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [nodeMode, setNodeMode] = useState("view"); // "view" | "form"
  const [expanded, setExpanded] = useState([]);
  const [form, setForm] = useState({
    code: "",
    name: "",
    node_type_id: "",
    parent_id: "",
    status: "ACTIVE",
    sort_order: 0,
    description: "",
    level_order: 1,
    is_active: true,
  });

  useEffect(() => {
    setExpanded(nodes.map((n) => n.id));
  }, [nodes]);

  const beginType = (item = null) => {
    setEditing(item);
    setForm({
      code: item?.code || "",
      name: item?.name || "",
      level_order: item?.level_order || 1,
      is_active: item?.is_active ?? true,
      sort_order: item?.sort_order || 0,
    });
  };

  const beginNode = (item = null, parentId = null) => {
    setEditing(item);
    setForm({
      code: item?.code || "",
      name: item?.name || "",
      node_type_id: item?.node_type_id || "",
      parent_id: item ? item.parent_id || "" : parentId || "",
      status: item?.status || "ACTIVE",
      sort_order: item?.sort_order || 0,
      description: item?.description || "",
    });
    setNodeMode("form");
  };

  useEffect(() => {
    if (!open) return;
    setSelectedNodeId(null);
    setNodeMode("view");
    beginType(null);
    beginNode(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab]);

  const save = async () => {
    const isNode = tab === 0;
    const base = `${API}/${isNode ? "nodes" : "node-types"}`;
    let payload;
    if (isNode) {
      const parentId = form.parent_id === "" ? null : Number(form.parent_id);
      const parentNode = nodes.find((n) => n.id === parentId);
      payload = {
        name: form.name,
        node_type_id: form.node_type_id === "" ? null : Number(form.node_type_id),
        parent_id: parentId,
        level_no: parentNode ? (parentNode.level_no || 1) + 1 : 1,
        status: form.status,
        sort_order: Number(form.sort_order || 0),
        description: form.description || null,
        ...(editing ? { updated_by: actor } : { code: form.code, created_by: actor }),
      };
    } else {
      payload = {
        name: form.name,
        level_order: Number(form.level_order || 1),
        is_active: form.is_active,
        sort_order: Number(form.sort_order || 0),
        ...(editing ? { updated_by: actor } : { code: form.code, created_by: actor }),
      };
    }
    const result = await request(editing ? `${base}/${editing.id}` : base, {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    await onReload();
    if (isNode) {
      setSelectedNodeId(editing ? editing.id : result?.id ?? null);
      setNodeMode("view");
    } else {
      beginType(null);
    }
  };

  const removeNode = async (item) => {
    if (!window.confirm(tx("Are you sure you want to delete this item?"))) return;
    await request(`${API}/nodes/${item.id}`, { method: "DELETE" });
    await onReload();
    setSelectedNodeId(null);
    setNodeMode("view");
  };

  const removeType = async (item) => {
    if (!window.confirm(tx("Are you sure you want to delete this item?"))) return;
    await request(`${API}/node-types/${item.id}`, { method: "DELETE" });
    await onReload();
    beginType(null);
  };

  const toggleExpand = (id) =>
    setExpanded((old) => (old.includes(id) ? old.filter((x) => x !== id) : [...old, id]));

  const roots = nodes.filter((n) => n.parent_id == null);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;
  const selectedType = selectedNode && nodeTypes.find((t) => t.id === selectedNode.node_type_id);
  const selectedParent = selectedNode && nodes.find((n) => n.id === selectedNode.parent_id);

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md" PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<AccountTreeOutlinedIcon />} title={tx("Location Hierarchy")} disabled={saving} onClose={onClose} />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3 }}>
        <Tab label={tx("Locations")} />
        <Tab label={tx("Location Types")} />
      </Tabs>
      <DialogContent dividers>
        {tab === 0 ? (
          <Box sx={{ display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 2 }}>
            <Paper variant="outlined" sx={{ maxHeight: 430, overflow: "auto", p: 0.5 }}>
              {roots.map((node) => (
                <NodeTreeOption
                  key={node.id}
                  node={node}
                  allNodes={nodes}
                  depth={0}
                  expanded={expanded}
                  onToggle={toggleExpand}
                  onPick={(item) => {
                    setSelectedNodeId(item.id);
                    setNodeMode("view");
                  }}
                  selectableGroups
                  selectedId={nodeMode === "view" ? selectedNodeId : null}
                />
              ))}
            </Paper>
            <Stack spacing={1.25}>
              {nodeMode === "form" ? (
                <>
                  <TextField
                    size="small"
                    disabled={Boolean(editing)}
                    label={tx("Code")}
                    value={form.code || ""}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  />
                  <TextField
                    size="small"
                    label={tx("Name")}
                    value={form.name || ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <TextField
                    select
                    size="small"
                    label={tx("Location Types")}
                    value={form.node_type_id || ""}
                    onChange={(e) => setForm({ ...form, node_type_id: e.target.value })}
                  >
                    <MenuItem value="">—</MenuItem>
                    {nodeTypes
                      .filter((x) => x.is_active)
                      .map((x) => (
                        <MenuItem key={x.id} value={x.id}>
                          {x.name}
                        </MenuItem>
                      ))}
                  </TextField>
                  <NodeTreePicker
                    nodes={nodes}
                    value={form.parent_id || ""}
                    onChange={(id) => setForm({ ...form, parent_id: id })}
                    label={tx("Parent Location")}
                    placeholder={tx("Root location")}
                    selectableGroups
                    excludeId={editing?.id}
                  />
                  <TextField
                    size="small"
                    multiline
                    minRows={2}
                    label={tx("Description")}
                    value={form.description || ""}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                  <Stack direction="row" spacing={1}>
                    <Button
                      onClick={() => {
                        setNodeMode("view");
                      }}
                    >
                      {tx("Cancel")}
                    </Button>
                    <Button variant="contained" disabled={saving} onClick={save} sx={buttonSx("primary")}>
                      {tx("Save")}
                    </Button>
                  </Stack>
                </>
              ) : selectedNode ? (
                <>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <AccountTreeOutlinedIcon color="primary" sx={{ fontSize: 20 }} />
                    <Box>
                      <Typography fontWeight={700}>{selectedNode.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedNode.code}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider />
                  <Field label={tx("Location Types")}>{selectedType?.name}</Field>
                  <Field label={tx("Parent Location")}>{selectedParent?.name || tx("Root location")}</Field>
                  <Field label={tx("Status")}>{statusText(selectedNode.status)}</Field>
                  <Field label={tx("Sort Order")}>{selectedNode.sort_order}</Field>
                  <Field label={tx("Description")}>{selectedNode.description}</Field>
                  <Divider sx={{ mt: 1 }} />
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<AddIcon fontSize="small" />}
                      onClick={() => beginNode(null, selectedNode.id)}
                    >
                      {tx("Add Child Location")}
                    </Button>
                    <Button
                      size="small"
                      startIcon={<EditOutlinedIcon fontSize="small" />}
                      onClick={() => beginNode(selectedNode)}
                    >
                      {tx("Edit")}
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteOutlineIcon fontSize="small" />}
                      onClick={() => removeNode(selectedNode)}
                    >
                      {tx("Delete")}
                    </Button>
                  </Stack>
                </>
              ) : (
                <Stack sx={{ height: 340, alignItems: "center", justifyContent: "center", gap: 1.5 }}>
                  <AccountTreeOutlinedIcon color="disabled" sx={{ fontSize: 40 }} />
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    {tx("Select a location on the left to view its details.")}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon fontSize="small" />}
                    onClick={() => beginNode(null, null)}
                    sx={buttonSx("primary")}
                  >
                    {tx("Add Root Location")}
                  </Button>
                </Stack>
              )}
            </Stack>
          </Box>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 2 }}>
            <Paper variant="outlined" sx={{ maxHeight: 430, overflow: "auto" }}>
              {nodeTypes.map((item) => (
                <Stack
                  key={item.id}
                  direction="row"
                  sx={{ alignItems: "center", px: 1.5, py: 0.7, borderBottom: 1, borderColor: "divider" }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.code}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => beginType(item)}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => removeType(item)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Paper>
            <Stack spacing={1.5}>
              <TextField
                size="small"
                disabled={Boolean(editing)}
                label={tx("Code")}
                value={form.code || ""}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
              <TextField
                size="small"
                label={tx("Name")}
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <TextField
                size="small"
                type="number"
                label={tx("Level Order")}
                value={form.level_order || 1}
                onChange={(e) => setForm({ ...form, level_order: e.target.value })}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(form.is_active)}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                }
                label={statusText("ACTIVE")}
              />
              <Stack direction="row" spacing={1}>
                <Button onClick={() => beginType(null)}>{tx("Add Location Type")}</Button>
                <Button variant="contained" disabled={saving} onClick={save} sx={buttonSx("primary")}>
                  {tx("Save")}
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={buttonSx("cancel")}>
          {tx("Close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const FIELD_DATA_TYPES = ["TEXT", "INTEGER", "DECIMAL", "BOOLEAN", "DATE"];

const emptyFieldDefinition = {
  field_code: "",
  field_name: "",
  data_type: "TEXT",
  unit: "",
  is_required: false,
  is_active: true,
  sort_order: 0,
  description: "",
};

function FieldDefinitionsDialog({ open, fields, saving, onClose, onReload, request, actor }) {
  const [editing, setEditing] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("view"); // "view" | "form"
  const [form, setForm] = useState(emptyFieldDefinition);
  const begin = (item = null) => {
    setEditing(item);
    setForm(
      item
        ? {
            field_code: item.field_code,
            field_name: item.field_name,
            data_type: item.data_type,
            unit: item.unit || "",
            is_required: Boolean(item.is_required),
            is_active: Boolean(item.is_active),
            sort_order: item.sort_order || 0,
            description: item.description || "",
          }
        : emptyFieldDefinition,
    );
    setMode("form");
  };
  useEffect(() => {
    if (!open) return;
    setSelectedId(null);
    setEditing(null);
    setForm(emptyFieldDefinition);
    setMode("view");
  }, [open]);
  const save = async () => {
    const payload = editing
      ? {
          field_name: form.field_name,
          unit: form.unit || null,
          is_required: form.is_required,
          is_active: form.is_active,
          sort_order: Number(form.sort_order || 0),
          description: form.description || null,
          updated_by: actor,
        }
      : {
          field_code: form.field_code,
          field_name: form.field_name,
          data_type: form.data_type,
          unit: form.unit || null,
          is_required: form.is_required,
          is_active: form.is_active,
          sort_order: Number(form.sort_order || 0),
          description: form.description || null,
          created_by: actor,
        };
    const result = await request(`${API}/field-definitions${editing ? `/${editing.id}` : ""}`, {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    await onReload();
    setSelectedId(editing ? editing.id : (result?.id ?? null));
    setMode("view");
  };
  const remove = async (item) => {
    if (!window.confirm(tx("Are you sure you want to delete this item?"))) return;
    await request(`${API}/field-definitions/${item.id}`, { method: "DELETE" });
    await onReload();
    setSelectedId(null);
    setMode("view");
  };
  const selectedField = fields.find((f) => f.id === selectedId) || null;
  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md" PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader
        icon={<SettingsOutlinedIcon />}
        title={tx("Custom Fields")}
        subtitle={tx("Define extra fields (e.g. specification, note) that can be filled in on any tool.")}
        disabled={saving}
        onClose={onClose}
      />
      <DialogContent dividers>
        <Box sx={{ display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 2 }}>
          <Stack spacing={1}>
            <Box sx={{ height: 430, border: 1, borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
              <AgGridTable
                rowData={fields}
                height={430}
                getRowId={(p) => String(p.data.id)}
                rowSelection="single"
                onRowClicked={(event) => {
                  setSelectedId(event.data.id);
                  setMode("view");
                }}
                columnDefs={[
                  { headerName: tx("Code"), field: "field_code", width: 140 },
                  { headerName: tx("Name"), field: "field_name", width: 150 },
                  { headerName: tx("Data Type"), field: "data_type", width: 100 },
                  {
                    headerName: tx("Status"),
                    field: "is_active",
                    width: 90,
                    cellRenderer: (p) => (
                      <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}>
                        <StatusChip status={p.value ? "ACTIVE" : "INACTIVE"} />
                      </Box>
                    ),
                  },
                ]}
              />
            </Box>
            <Stack direction="row" spacing={1}>
              <Button startIcon={<AddIcon fontSize="small" />} onClick={() => begin(null)} sx={buttonSx("primary")}>
                {tx("Add New")}
              </Button>
            </Stack>
          </Stack>
          <Stack spacing={1.25}>
            {mode === "form" ? (
              <>
                <TextField
                  size="small"
                  disabled={Boolean(editing)}
                  label={tx("Code")}
                  value={form.field_code}
                  onChange={(e) => setForm({ ...form, field_code: e.target.value.toUpperCase() })}
                />
                <TextField
                  size="small"
                  label={tx("Name")}
                  value={form.field_name}
                  onChange={(e) => setForm({ ...form, field_name: e.target.value })}
                />
                <TextField
                  select
                  size="small"
                  disabled={Boolean(editing)}
                  label={tx("Data Type")}
                  value={form.data_type}
                  onChange={(e) => setForm({ ...form, data_type: e.target.value })}
                >
                  {FIELD_DATA_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  size="small"
                  label={tx("Unit")}
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                />
                <TextField
                  size="small"
                  type="number"
                  label={tx("Sort Order")}
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                />
                <TextField
                  size="small"
                  multiline
                  minRows={2}
                  label={tx("Description")}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.is_required}
                      onChange={(e) => setForm({ ...form, is_required: e.target.checked })}
                    />
                  }
                  label={tx("Required")}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    />
                  }
                  label={statusText("ACTIVE")}
                />
                <Stack direction="row" spacing={1}>
                  <Button onClick={() => setMode("view")} sx={buttonSx("cancel")}>
                    {tx("Cancel")}
                  </Button>
                  <Button
                    disabled={saving || !form.field_code.trim() || !form.field_name.trim()}
                    onClick={save}
                    sx={buttonSx("primary")}
                  >
                    {tx("Save")}
                  </Button>
                </Stack>
              </>
            ) : selectedField ? (
              <>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <SettingsOutlinedIcon color="primary" sx={{ fontSize: 20 }} />
                  <Box>
                    <Typography fontWeight={700}>{selectedField.field_name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedField.field_code}
                    </Typography>
                  </Box>
                </Box>
                <Divider />
                <Field label={tx("Data Type")}>{selectedField.data_type}</Field>
                <Field label={tx("Unit")}>{selectedField.unit}</Field>
                <Field label={tx("Required")}>{selectedField.is_required ? tx("Required") : EMPTY}</Field>
                <Field label={tx("Status")}>{statusText(selectedField.is_active ? "ACTIVE" : "INACTIVE")}</Field>
                <Field label={tx("Sort Order")}>{selectedField.sort_order}</Field>
                <Field label={tx("Description")}>{selectedField.description}</Field>
                <Divider sx={{ mt: 1 }} />
                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    startIcon={<EditOutlinedIcon fontSize="small" />}
                    onClick={() => begin(selectedField)}
                    sx={buttonSx("edit")}
                  >
                    {tx("Edit")}
                  </Button>
                  <Button
                    fullWidth
                    startIcon={<DeleteOutlineIcon fontSize="small" />}
                    onClick={() => remove(selectedField)}
                    sx={buttonSx("delete")}
                  >
                    {tx("Delete")}
                  </Button>
                </Stack>
              </>
            ) : (
              <Stack sx={{ height: 340, alignItems: "center", justifyContent: "center", gap: 1.5 }}>
                <SettingsOutlinedIcon color="disabled" sx={{ fontSize: 40 }} />
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  {tx("Select a field on the left to view its details.")}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
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

  const [stats, setStats] = useState(EMPTY_STATS);
  const [nodes, setNodes] = useState([]);
  const [nodeTypes, setNodeTypes] = useState([]);
  const [fieldDefinitions, setFieldDefinitions] = useState([]);
  const [tools, setTools] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [nodeId, setNodeId] = useState(null);
  const [expanded, setExpanded] = useState([]);
  const [detailTab, setDetailTab] = useState(0);
  const [filters, setFilters] = useState({ keyword: "", toolType: "", status: "", manufacturer: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toolDialog, setToolDialog] = useState(null);
  const [locationDialog, setLocationDialog] = useState(false);
  const [fieldDialog, setFieldDialog] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const [message, setMessage] = useState(null);

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
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(
        response.status === 409
          ? tx("This record was changed by someone else. Please reload and try again.")
          : data?.detail || data?.message || `HTTP ${response.status}`,
      );
      error.status = response.status;
      throw error;
    }
    return data;
  }, []);

  const loadReference = useCallback(async () => {
    const [statData, nodeData, typeData, fieldData] = await Promise.all([
      request(`${API}/statistics`),
      request(`${API}/nodes`),
      request(`${API}/node-types`),
      request(`${API}/field-definitions`),
    ]);
    setStats({ ...EMPTY_STATS, ...statData });
    setNodes(nodeData || []);
    setNodeTypes(typeData || []);
    setFieldDefinitions(fieldData || []);
    setExpanded((nodeData || []).map((x) => x.id));
  }, [request]);

  const loadTools = useCallback(async () => {
    const params = new URLSearchParams({ page: "1", page_size: "500" });
    if (filters.keyword.trim()) params.set("keyword", filters.keyword.trim());
    if (filters.toolType) params.set("tool_type", filters.toolType);
    if (filters.status) params.set("status", filters.status);
    if (filters.manufacturer) params.set("manufacturer", filters.manufacturer);
    if (nodeId) params.set("production_tool_node_id", nodeId);
    const data = await request(`${API}/tools?${params}`);
    setTools(data?.items || []);
    if (selectedId && !(data?.items || []).some((x) => x.id === selectedId)) setSelectedId(null);
  }, [request, filters, nodeId, selectedId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadReference(), loadTools()]);
    } catch (e) {
      setMessage({ severity: "error", text: e.message || tx("Unable to load Production Tool Master data.") });
    } finally {
      setLoading(false);
    }
  }, [loadReference, loadTools]);
  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const timer = setTimeout(
      () => loadTools().catch((e) => setMessage({ severity: "error", text: e.message })),
      250,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, nodeId]);
  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    request(`${API}/tools/${selectedId}`)
      .then(setSelected)
      .catch((e) => setMessage({ severity: "error", text: e.message }));
  }, [selectedId, request]);

  const roots = useMemo(() => nodes.filter((x) => x.parent_id == null), [nodes]);
  const manufacturers = useMemo(
    () => [...new Set(tools.map((x) => x.manufacturer).filter(Boolean))].sort(),
    [tools],
  );
  const columns = useMemo(
    () => [
      { headerName: tx("Tool Code"), field: "tool_code", width: 110, pinned: "left" },
      { headerName: tx("Tool Name"), field: "tool_name", minWidth: 180, flex: 1.2 },
      {
        headerName: tx("Tool Type"),
        field: "tool_type",
        width: 130,
        cellRenderer: (p) => (
          <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}>
            <ToolTypeChip value={p.value} />
          </Box>
        ),
      },
      { headerName: tx("Manufacturer"), field: "manufacturer", width: 130, valueFormatter: (p) => p.value || EMPTY },
      {
        headerName: tx("Status"),
        field: "status",
        width: 130,
        cellRenderer: (p) => (
          <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}>
            <StatusChip status={p.value} />
          </Box>
        ),
      },
      {
        headerName: tx("Calibration Due Date"),
        field: "calibration_due_date",
        width: 130,
        valueFormatter: (p) => formatDisplayDate(p.value),
      },
      {
        headerName: tx("Actions"),
        width: 90,
        sortable: false,
        filter: false,
        cellRenderer: (p) => (
          <Stack direction="row" sx={{ alignItems: "center", height: "100%" }}>
            <Tooltip title={tx("View")}>
              <IconButton size="small" onClick={() => setSelectedId(p.data.id)}>
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={tx("Edit")}>
              <span>
                <IconButton
                  size="small"
                  disabled={!canEdit}
                  onClick={async () => {
                    const item = await request(`${API}/tools/${p.data.id}`);
                    setToolDialog(item);
                  }}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [canEdit, request, language],
  );

  const saveTool = async (form) => {
    setSaving(true);
    try {
      const editing = Boolean(toolDialog?.id);
      await request(editing ? `${API}/tools/${toolDialog.id}` : `${API}/tools`, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({
          ...form,
          ...(editing ? { version: toolDialog.version, updated_by: actor } : { created_by: actor }),
        }),
      });
      setToolDialog(null);
      await loadAll();
      setMessage({ severity: "success", text: tx("Data saved successfully.") });
    } catch (e) {
      setMessage({ severity: "error", text: e.message || tx("Unable to save data.") });
    } finally {
      setSaving(false);
    }
  };

  const kpis = [
    { label: tx("Total Tools"), value: stats.total_tools, icon: PrecisionManufacturingOutlinedIcon, tone: "primary" },
    { label: tx("In Use"), value: stats.in_use, icon: CheckCircleOutlineIcon, tone: "success" },
    { label: tx("Available"), value: stats.available, icon: FactCheckOutlinedIcon, tone: "info" },
    { label: tx("In Maintenance"), value: stats.in_maintenance, icon: BuildOutlinedIcon, tone: "warning" },
    { label: tx("Out of Service"), value: stats.out_of_service, icon: CancelOutlinedIcon, tone: "danger" },
    { label: tx("Calibration Due"), value: stats.calibration_due_soon, icon: CalendarMonthOutlinedIcon, tone: "accent" },
  ];

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box
        sx={
          dark
            ? {
                "& .vcc-ag-grid": {
                  "--ag-background-color": "#111827",
                  "--ag-header-background-color": "#182235",
                  "--ag-foreground-color": "#D0D5DD",
                  "--ag-border-color": "#344054",
                },
              }
            : {}
        }
      >
        <PageMeta
          title={`${tx("Production Tool Master")} | VCC Plastics`}
          description={tx(
            "Manage cutting, assembly, measuring and handling tools with location hierarchy, calibration tracking and technical specifications.",
          )}
        />
        <PageBreadcrumb pageTitle={tx("Production Tool Master")} />
        <Stack spacing={2.25} sx={{ pb: 2.5 }}>
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
              <Typography variant="h4" fontWeight={700}>
                {tx("Production Tool Master")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tx(
                  "Manage cutting, assembly, measuring and handling tools with location hierarchy, calibration tracking and technical specifications.",
                )}
              </Typography>
            </Box>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2, justifyContent: "flex-end" }}>
              <Tooltip title={tx("Settings")}>
                <IconButton
                  onClick={(event) => setSettingsAnchor(event.currentTarget)}
                  sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}
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
                  onClick={() => {
                    setSettingsAnchor(null);
                    setLocationDialog(true);
                  }}
                >
                  <ListItemIcon>
                    <AccountTreeOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{tx("Manage Locations")}</ListItemText>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setSettingsAnchor(null);
                    setFieldDialog(true);
                  }}
                >
                  <ListItemIcon>
                    <SettingsOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{tx("Custom Fields")}</ListItemText>
                </MenuItem>
              </Menu>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!canEdit}
                onClick={() => setToolDialog({})}
                sx={buttonSx("primary")}
              >
                {tx("Add Tool")}
              </Button>
            </Stack>
          </Box>
          <KpiCardGroup>
            {kpis.map((item) => {
              const Icon = item.icon;
              return <KpiCard key={item.label} label={item.label} value={item.value} note="" icon={<Icon />} tone={item.tone} />;
            })}
          </KpiCardGroup>
          <Paper variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "minmax(220px,1.5fr) repeat(3,minmax(130px,.75fr)) auto" },
                gap: 1,
              }}
            >
              <TextField
                size="small"
                placeholder={tx("Search by tool code or name...")}
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                select
                size="small"
                value={filters.toolType}
                onChange={(e) => setFilters({ ...filters, toolType: e.target.value })}
              >
                <MenuItem value="">{tx("All Types")}</MenuItem>
                {TOOL_TYPES.map((x) => (
                  <MenuItem key={x} value={x}>
                    {toolTypeText(x)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="">{tx("All Statuses")}</MenuItem>
                {STATUSES.map((x) => (
                  <MenuItem key={x} value={x}>
                    {statusText(x)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                value={filters.manufacturer}
                onChange={(e) => setFilters({ ...filters, manufacturer: e.target.value })}
              >
                <MenuItem value="">{tx("All Manufacturers")}</MenuItem>
                {manufacturers.map((x) => (
                  <MenuItem key={x} value={x}>
                    {x}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                onClick={() => {
                  setFilters({ keyword: "", toolType: "", status: "", manufacturer: "" });
                  setNodeId(null);
                }}
              >
                {tx("Clear")}
              </Button>
            </Box>
          </Paper>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "230px minmax(0,1fr) 330px" },
              gap: 1.25,
              minHeight: 520,
            }}
          >
            <Paper sx={panelSx}>
              <SectionHeader
                title={tx("Location Hierarchy")}
                icon={<AccountTreeOutlinedIcon sx={{ fontSize: 18 }} />}
                action={
                  <IconButton size="small" onClick={() => setNodeId(null)}>
                    <RefreshIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                }
              />
              <Box sx={{ p: 0.75, maxHeight: 486, overflow: "auto" }}>
                <Box
                  onClick={() => setNodeId(null)}
                  sx={{
                    px: 1,
                    py: 0.7,
                    cursor: "pointer",
                    borderRadius: 1,
                    bgcolor: nodeId == null ? "action.selected" : "transparent",
                  }}
                >
                  <Typography variant="caption" fontWeight={700}>
                    {tx("All Locations")}
                  </Typography>
                </Box>
                {roots.map((node) => (
                  <LocationTreeNode
                    key={node.id}
                    node={node}
                    allNodes={nodes}
                    tools={tools}
                    selectedId={nodeId}
                    expanded={expanded}
                    onToggle={(id) =>
                      setExpanded((old) => (old.includes(id) ? old.filter((x) => x !== id) : [...old, id]))
                    }
                    onSelect={setNodeId}
                  />
                ))}
              </Box>
            </Paper>
            <Paper sx={panelSx}>
              <SectionHeader
                title={`${tx("Tool List")} (${tools.length})`}
                icon={<PrecisionManufacturingOutlinedIcon sx={{ fontSize: 18 }} />}
                action={
                  <IconButton size="small" onClick={loadAll}>
                    <RefreshIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                }
              />
              <Box sx={{ height: 486 }}>
                {loading ? (
                  <Stack sx={{ height: "100%", alignItems: "center", justifyContent: "center" }}>
                    <CircularProgress size={28} />
                  </Stack>
                ) : (
                  <AgGridTable
                    rowData={tools}
                    columnDefs={columns}
                    height={486}
                    pagination={false}
                    rowSelection="single"
                    getRowId={(p) => String(p.data.id)}
                    onRowClicked={(event) => setSelectedId(event.data.id)}
                  />
                )}
              </Box>
            </Paper>
            <Paper sx={panelSx}>
              <SectionHeader title={tx("Tool Detail")} icon={<PrecisionManufacturingOutlinedIcon sx={{ fontSize: 18 }} />} />
              {selected ? (
                <Box>
                  <Stack direction="row" spacing={1.25} sx={{ p: 1.5 }}>
                    <Avatar variant="rounded" src={resolveImageUrl(selected.image_url) || undefined} sx={{ width: 58, height: 58, bgcolor: "action.hover" }}>
                      <PrecisionManufacturingOutlinedIcon />
                    </Avatar>
                    <Box minWidth={0}>
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                        <Typography fontWeight={700}>{selected.tool_code}</Typography>
                        <StatusChip status={selected.status} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary" noWrap component="div">
                        {selected.tool_name}
                      </Typography>
                    </Box>
                  </Stack>
                  <Tabs
                    value={detailTab}
                    onChange={(_, v) => setDetailTab(v)}
                    variant="fullWidth"
                    sx={{
                      minHeight: 34,
                      borderBottom: 1,
                      borderColor: "divider",
                      "& .MuiTab-root": { minHeight: 34, fontSize: 10.5, px: 0.5 },
                    }}
                  >
                    <Tab label={tx("General")} />
                    <Tab label={tx("Specification")} />
                    {fieldDefinitions.some((f) => f.is_active) && <Tab label={tx("Custom Fields")} />}
                  </Tabs>
                  <Box sx={{ px: 1.5, py: 1, maxHeight: 320, overflow: "auto" }}>
                    {detailTab === 0 && (
                      <>
                        <Field label={tx("Tool Code")}>{selected.tool_code}</Field>
                        <Field label={tx("Tool Name")}>{selected.tool_name}</Field>
                        <Field label={tx("Tool Type")}>
                          <ToolTypeChip value={selected.tool_type} />
                        </Field>
                        <Field label={tx("Location")}>{selected.production_tool_node_name}</Field>
                        <Field label={tx("Category")}>{selected.tool_category}</Field>
                        <Field label={tx("Manufacturer")}>{selected.manufacturer}</Field>
                        <Field label={tx("Model")}>{selected.model}</Field>
                        <Field label={tx("Serial Number")}>{selected.serial_number}</Field>
                        <Field label={tx("Assigned Process")}>{selected.assigned_process}</Field>
                        <Divider sx={{ my: 1 }} />
                        <Field label={tx("Description")}>{selected.description}</Field>
                      </>
                    )}
                    {detailTab === 1 && (
                      <>
                        <Field label={tx("Measurement Range")}>{selected.measurement_range}</Field>
                        <Field label={tx("Measurement Resolution")}>{selected.measurement_resolution}</Field>
                        <Field label={tx("Calibration Required")}>
                          {selected.calibration_required ? tx("Required") : EMPTY}
                        </Field>
                        {selected.calibration_required && (
                          <>
                            <Field label={tx("Calibration Due Date")}>{formatDisplayDate(selected.calibration_due_date)}</Field>
                            <Field label={tx("Last Calibration Date")}>{formatDisplayDate(selected.last_calibration_date)}</Field>
                            <Field label={tx("Calibration Interval (days)")}>{selected.calibration_interval_days}</Field>
                          </>
                        )}
                      </>
                    )}
                    {detailTab === 2 &&
                      fieldDefinitions
                        .filter((f) => f.is_active)
                        .map((field) => {
                          const value = selected.custom_fields?.[field.field_code];
                          return (
                            <Field key={field.field_code} label={field.unit ? `${field.field_name} (${field.unit})` : field.field_name}>
                              {field.data_type === "BOOLEAN" ? (value ? statusText("ACTIVE") : statusText("INACTIVE")) : value}
                            </Field>
                          );
                        })}
                  </Box>
                  <Divider />
                  <Stack direction="row" sx={{ justifyContent: "center", gap: 2.5, p: 1.5 }}>
                    <Tooltip title={tx("Edit tool")}>
                      <span>
                        <IconButton
                          size="small"
                          disabled={!canEdit}
                          onClick={() => setToolDialog(selected)}
                          sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Box>
              ) : (
                <Stack height={480} spacing={1} sx={{ justifyContent: "center", alignItems: "center" }}>
                  <PrecisionManufacturingOutlinedIcon color="disabled" sx={{ fontSize: 44 }} />
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    {tx("Select a tool to view details.")}
                  </Typography>
                </Stack>
              )}
            </Paper>
          </Box>
        </Stack>
        <ToolDialog
          open={toolDialog !== null}
          tool={toolDialog?.id ? toolDialog : null}
          nodes={nodes}
          fieldDefinitions={fieldDefinitions}
          saving={saving}
          onClose={() => setToolDialog(null)}
          onSave={saveTool}
        />
        <LocationDialog
          open={locationDialog}
          nodes={nodes}
          nodeTypes={nodeTypes}
          saving={saving}
          onClose={() => setLocationDialog(false)}
          onReload={loadReference}
          request={request}
          actor={actor}
        />
        <FieldDefinitionsDialog
          open={fieldDialog}
          fields={fieldDefinitions}
          saving={saving}
          onClose={() => setFieldDialog(false)}
          onReload={loadReference}
          request={request}
          actor={actor}
        />
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
