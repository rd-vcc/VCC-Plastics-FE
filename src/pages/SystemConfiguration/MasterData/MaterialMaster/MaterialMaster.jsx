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
import BiotechOutlinedIcon from "@mui/icons-material/BiotechOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import RecyclingOutlinedIcon from "@mui/icons-material/RecyclingOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
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
import { materialTypeText, setActiveLanguage, statusText, tx } from "./locales";

const API_BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const API = `${API_BASE}/api/material-master`;
const EMPTY = "—";

const EMPTY_STATS = {
  total_materials: 0,
  active_materials: 0,
  raw_materials: 0,
  compounds: 0,
  additives: 0,
  recycled: 0,
  packaging: 0,
  inactive_materials: 0,
};

const MATERIAL_TYPES = ["RAW_MATERIAL", "COMPOUND", "ADDITIVE", "RECYCLED", "PACKAGING"];
const STATUSES = ["ACTIVE", "INACTIVE"];

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

function createMaterialTheme(mode) {
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
  RAW_MATERIAL: "warning",
  COMPOUND: "secondary",
  ADDITIVE: "info",
  RECYCLED: "success",
  PACKAGING: "default",
};

function MaterialTypeChip({ value }) {
  return (
    <Chip
      size="small"
      variant="outlined"
      color={TYPE_TONES[value] || "default"}
      label={materialTypeText(value)}
      sx={{ height: 21, fontSize: 10.5 }}
    />
  );
}

function StatusChip({ status }) {
  const active = status === "ACTIVE";
  return (
    <Chip
      size="small"
      variant="outlined"
      color={active ? "success" : "error"}
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

function countMaterialsInSubtree(nodeId, allNodes, materials) {
  const direct = materials.filter((item) => item.material_node_id === nodeId).length;
  const children = allNodes.filter((item) => item.parent_id === nodeId);
  return children.reduce((sum, child) => sum + countMaterialsInSubtree(child.id, allNodes, materials), direct);
}

function CategoryTreeNode({ node, allNodes, materials, selectedId, expanded, onToggle, onSelect, depth = 0 }) {
  const children = allNodes.filter((item) => item.parent_id === node.id);
  const open = expanded.includes(node.id);
  const count = countMaterialsInSubtree(node.id, allNodes, materials);
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
          <CategoryTreeNode
            key={child.id}
            node={child}
            allNodes={allNodes}
            materials={materials}
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

const emptyMaterial = {
  material_code: "",
  material_name: "",
  material_type: "RAW_MATERIAL",
  material_node_id: "",
  base_resin: "",
  material_group: "",
  supplier: "",
  unit: "",
  status: "ACTIVE",
  density: "",
  mfi: "",
  moisture_content: "",
  melting_point_min: "",
  melting_point_max: "",
  image_url: "",
  description: "",
};

function MaterialDialog({ open, material, nodes, fieldDefinitions, saving, onClose, onSave }) {
  const [form, setForm] = useState(emptyMaterial);
  const [customFields, setCustomFields] = useState({});
  const [tab, setTab] = useState(0);
  useEffect(() => {
    if (!open) return;
    setForm(
      material
        ? {
            ...emptyMaterial,
            ...material,
            material_node_id: material.material_node_id ?? "",
            density: material.density ?? "",
            mfi: material.mfi ?? "",
            moisture_content: material.moisture_content ?? "",
            melting_point_min: material.melting_point_min ?? "",
            melting_point_max: material.melting_point_max ?? "",
          }
        : emptyMaterial,
    );
    setCustomFields({ ...(material?.custom_fields || {}) });
    setTab(0);
  }, [open, material]);
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const setCustomField = (fieldCode, value) => setCustomFields((old) => ({ ...old, [fieldCode]: value }));
  const numOrNull = (value) => (value === "" || value == null ? null : Number(value));
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
      material_node_id: form.material_node_id === "" ? null : Number(form.material_node_id),
      density: numOrNull(form.density),
      mfi: numOrNull(form.mfi),
      moisture_content: numOrNull(form.moisture_content),
      melting_point_min: numOrNull(form.melting_point_min),
      melting_point_max: numOrNull(form.melting_point_max),
      custom_fields: preparedCustomFields,
    });
  };
  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md" PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader
        icon={<Inventory2OutlinedIcon />}
        title={material ? tx("Edit Material") : tx("Add Material")}
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
              disabled={Boolean(material)}
              label={tx("Material Code")}
              value={form.material_code}
              onChange={(e) => set("material_code", e.target.value.toUpperCase())}
            />
            <TextField
              size="small"
              required
              label={tx("Material Name")}
              value={form.material_name}
              onChange={(e) => set("material_name", e.target.value)}
            />
            <TextField
              select
              size="small"
              label={tx("Material Type")}
              value={form.material_type}
              onChange={(e) => set("material_type", e.target.value)}
            >
              {MATERIAL_TYPES.map((item) => (
                <MenuItem key={item} value={item}>
                  {materialTypeText(item)}
                </MenuItem>
              ))}
            </TextField>
            <NodeTreePicker
              nodes={nodes}
              value={form.material_node_id}
              onChange={(id) => set("material_node_id", id)}
              label={tx("Category")}
              selectableGroups={false}
            />
            <TextField
              size="small"
              label={tx("Base Resin")}
              value={form.base_resin || ""}
              onChange={(e) => set("base_resin", e.target.value)}
            />
            <TextField
              size="small"
              label={tx("Material Group")}
              value={form.material_group || ""}
              onChange={(e) => set("material_group", e.target.value)}
            />
            <TextField
              size="small"
              label={tx("Supplier")}
              value={form.supplier || ""}
              onChange={(e) => set("supplier", e.target.value)}
            />
            <TextField
              size="small"
              label={tx("Unit")}
              value={form.unit || ""}
              onChange={(e) => set("unit", e.target.value)}
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
            <Box sx={{ gridColumn: "1 / -1" }}>
              <ImageUploadField value={form.image_url || ""} category="material" label={tx("Image")} onChange={(v) => set("image_url", v || "")} />
            </Box>
            <TextField
              size="small"
              multiline
              minRows={2}
              label={tx("Description")}
              value={form.description || ""}
              onChange={(e) => set("description", e.target.value)}
              sx={{ gridColumn: "1 / -1" }}
            />
          </Box>
        )}
        {tab === 1 && (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 2 }}>
            <TextField
              size="small"
              type="number"
              label={tx("Density (g/cm³)")}
              value={form.density}
              onChange={(e) => set("density", e.target.value)}
            />
            <TextField
              size="small"
              type="number"
              label={tx("MFI (g/10min)")}
              value={form.mfi}
              onChange={(e) => set("mfi", e.target.value)}
            />
            <TextField
              size="small"
              type="number"
              label={tx("Moisture Content (%)")}
              value={form.moisture_content}
              onChange={(e) => set("moisture_content", e.target.value)}
            />
            <Box />
            <TextField
              size="small"
              type="number"
              label={tx("Melting Point Min (°C)")}
              value={form.melting_point_min}
              onChange={(e) => set("melting_point_min", e.target.value)}
            />
            <TextField
              size="small"
              type="number"
              label={tx("Melting Point Max (°C)")}
              value={form.melting_point_max}
              onChange={(e) => set("melting_point_max", e.target.value)}
            />
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
          disabled={saving || !form.material_code.trim() || !form.material_name.trim()}
          onClick={submit}
          sx={buttonSx("primary")}
        >
          {saving ? <CircularProgress size={18} /> : tx("Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CategoryDialog({ open, nodes, nodeTypes, saving, onClose, onReload, request, actor }) {
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
      <DialogHeader icon={<AccountTreeOutlinedIcon />} title={tx("Category Hierarchy")} disabled={saving} onClose={onClose} />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3 }}>
        <Tab label={tx("Categories")} />
        <Tab label={tx("Category Types")} />
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
                    label={tx("Category Types")}
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
                    label={tx("Parent Category")}
                    placeholder={tx("Root category")}
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
                  <Field label={tx("Category Types")}>{selectedType?.name}</Field>
                  <Field label={tx("Parent Category")}>{selectedParent?.name || tx("Root category")}</Field>
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
                      {tx("Add Child Category")}
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
                    {tx("Select a category on the left to view its details.")}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon fontSize="small" />}
                    onClick={() => beginNode(null, null)}
                    sx={buttonSx("primary")}
                  >
                    {tx("Add Root Category")}
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
                <Button onClick={() => beginType(null)}>{tx("Add Category Type")}</Button>
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
        subtitle={tx("Define extra fields (e.g. characteristics, origin) that can be filled in on any material.")}
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

export default function MaterialMaster() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  const { theme } = useAppTheme();
  const dark = theme === "dark";
  const muiTheme = useMemo(() => createMaterialTheme(dark ? "dark" : "light"), [dark]);
  const { canEdit } = usePagePermission();
  const actor = getCurrentUser()?.employee_code || "SYSTEM";

  const [stats, setStats] = useState(EMPTY_STATS);
  const [nodes, setNodes] = useState([]);
  const [nodeTypes, setNodeTypes] = useState([]);
  const [fieldDefinitions, setFieldDefinitions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [nodeId, setNodeId] = useState(null);
  const [expanded, setExpanded] = useState([]);
  const [detailTab, setDetailTab] = useState(0);
  const [filters, setFilters] = useState({ keyword: "", materialType: "", status: "", supplier: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [materialDialog, setMaterialDialog] = useState(null);
  const [categoryDialog, setCategoryDialog] = useState(false);
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

  const loadMaterials = useCallback(async () => {
    const params = new URLSearchParams({ page: "1", page_size: "500" });
    if (filters.keyword.trim()) params.set("keyword", filters.keyword.trim());
    if (filters.materialType) params.set("material_type", filters.materialType);
    if (filters.status) params.set("status", filters.status);
    if (filters.supplier) params.set("supplier", filters.supplier);
    if (nodeId) params.set("material_node_id", nodeId);
    const data = await request(`${API}/materials?${params}`);
    setMaterials(data?.items || []);
    if (selectedId && !(data?.items || []).some((x) => x.id === selectedId)) setSelectedId(null);
  }, [request, filters, nodeId, selectedId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadReference(), loadMaterials()]);
    } catch (e) {
      setMessage({ severity: "error", text: e.message || tx("Unable to load Material Master data.") });
    } finally {
      setLoading(false);
    }
  }, [loadReference, loadMaterials]);
  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const timer = setTimeout(
      () => loadMaterials().catch((e) => setMessage({ severity: "error", text: e.message })),
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
    request(`${API}/materials/${selectedId}`)
      .then(setSelected)
      .catch((e) => setMessage({ severity: "error", text: e.message }));
  }, [selectedId, request]);

  const roots = useMemo(() => nodes.filter((x) => x.parent_id == null), [nodes]);
  const suppliers = useMemo(
    () => [...new Set(materials.map((x) => x.supplier).filter(Boolean))].sort(),
    [materials],
  );
  const columns = useMemo(
    () => [
      { headerName: tx("Material Code"), field: "material_code", width: 120, pinned: "left" },
      { headerName: tx("Material Name"), field: "material_name", minWidth: 180, flex: 1.2 },
      {
        headerName: tx("Material Type"),
        field: "material_type",
        width: 130,
        cellRenderer: (p) => (
          <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}>
            <MaterialTypeChip value={p.value} />
          </Box>
        ),
      },
      { headerName: tx("Base Resin"), field: "base_resin", width: 110, valueFormatter: (p) => p.value || EMPTY },
      { headerName: tx("Supplier"), field: "supplier", width: 130, valueFormatter: (p) => p.value || EMPTY },
      { headerName: tx("Unit"), field: "unit", width: 80, valueFormatter: (p) => p.value || EMPTY },
      {
        headerName: tx("Status"),
        field: "status",
        width: 105,
        cellRenderer: (p) => (
          <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}>
            <StatusChip status={p.value} />
          </Box>
        ),
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
                    const item = await request(`${API}/materials/${p.data.id}`);
                    setMaterialDialog(item);
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

  const saveMaterial = async (form) => {
    setSaving(true);
    try {
      const editing = Boolean(materialDialog?.id);
      await request(editing ? `${API}/materials/${materialDialog.id}` : `${API}/materials`, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({
          ...form,
          ...(editing ? { version: materialDialog.version, updated_by: actor } : { created_by: actor }),
        }),
      });
      setMaterialDialog(null);
      await loadAll();
      setMessage({ severity: "success", text: tx("Data saved successfully.") });
    } catch (e) {
      setMessage({ severity: "error", text: e.message || tx("Unable to save data.") });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!selected || !canEdit) return;
    const next = selected.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setSaving(true);
    try {
      await request(`${API}/materials/${selected.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: next, version: selected.version, updated_by: actor }),
      });
      await loadAll();
      setSelected((old) => ({ ...old, status: next }));
      setMessage({ severity: "success", text: tx("Status updated.") });
    } catch (e) {
      setMessage({ severity: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const kpis = [
    { label: tx("Total Materials"), value: stats.total_materials, icon: Inventory2OutlinedIcon, tone: "primary" },
    { label: tx("Active Materials"), value: stats.active_materials, icon: CheckCircleOutlineIcon, tone: "success" },
    { label: tx("Raw Materials"), value: stats.raw_materials, icon: ScienceOutlinedIcon, tone: "warning" },
    { label: tx("Compounds"), value: stats.compounds, icon: BiotechOutlinedIcon, tone: "accent" },
    {
      label: tx("Additives & Others"),
      value: (stats.additives || 0) + (stats.recycled || 0) + (stats.packaging || 0),
      icon: RecyclingOutlinedIcon,
      tone: "info",
    },
    { label: tx("Inactive Materials"), value: stats.inactive_materials, icon: CancelOutlinedIcon, tone: "danger" },
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
        <PageMeta title={`${tx("Material Master")} | VCC Plastics`} description={tx(
          "Manage raw materials, compounds, additives, recycled and packaging materials with category hierarchy and technical specifications.",
        )} />
        <PageBreadcrumb pageTitle={tx("Material Master")} />
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
                {tx("Material Master")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tx(
                  "Manage raw materials, compounds, additives, recycled and packaging materials with category hierarchy and technical specifications.",
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
                    setCategoryDialog(true);
                  }}
                >
                  <ListItemIcon>
                    <AccountTreeOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{tx("Manage Categories")}</ListItemText>
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
                onClick={() => setMaterialDialog({})}
                sx={buttonSx("primary")}
              >
                {tx("Add Material")}
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
                placeholder={tx("Search by material code or name...")}
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
                value={filters.materialType}
                onChange={(e) => setFilters({ ...filters, materialType: e.target.value })}
              >
                <MenuItem value="">{tx("All Types")}</MenuItem>
                {MATERIAL_TYPES.map((x) => (
                  <MenuItem key={x} value={x}>
                    {materialTypeText(x)}
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
                value={filters.supplier}
                onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
              >
                <MenuItem value="">{tx("All Suppliers")}</MenuItem>
                {suppliers.map((x) => (
                  <MenuItem key={x} value={x}>
                    {x}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                onClick={() => {
                  setFilters({ keyword: "", materialType: "", status: "", supplier: "" });
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
                title={tx("Category Hierarchy")}
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
                    {tx("All Categories")}
                  </Typography>
                </Box>
                {roots.map((node) => (
                  <CategoryTreeNode
                    key={node.id}
                    node={node}
                    allNodes={nodes}
                    materials={materials}
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
                title={`${tx("Material List")} (${materials.length})`}
                icon={<Inventory2OutlinedIcon sx={{ fontSize: 18 }} />}
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
                    rowData={materials}
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
              <SectionHeader title={tx("Material Detail")} icon={<ScienceOutlinedIcon sx={{ fontSize: 18 }} />} />
              {selected ? (
                <Box>
                  <Stack direction="row" spacing={1.25} sx={{ p: 1.5 }}>
                    <Avatar variant="rounded" src={resolveImageUrl(selected.image_url) || undefined} sx={{ width: 58, height: 58, bgcolor: "action.hover" }}>
                      <ScienceOutlinedIcon />
                    </Avatar>
                    <Box minWidth={0}>
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                        <Typography fontWeight={700}>{selected.material_code}</Typography>
                        <StatusChip status={selected.status} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary" noWrap component="div">
                        {selected.material_name}
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
                        <Field label={tx("Material Code")}>{selected.material_code}</Field>
                        <Field label={tx("Material Name")}>{selected.material_name}</Field>
                        <Field label={tx("Material Type")}>
                          <MaterialTypeChip value={selected.material_type} />
                        </Field>
                        <Field label={tx("Category")}>{selected.material_node_name}</Field>
                        <Field label={tx("Base Resin")}>{selected.base_resin}</Field>
                        <Field label={tx("Material Group")}>{selected.material_group}</Field>
                        <Field label={tx("Supplier")}>{selected.supplier}</Field>
                        <Field label={tx("Unit")}>{selected.unit}</Field>
                        <Divider sx={{ my: 1 }} />
                        <Field label={tx("Description")}>{selected.description}</Field>
                      </>
                    )}
                    {detailTab === 1 && (
                      <>
                        <Field label={tx("Density (g/cm³)")}>{selected.density}</Field>
                        <Field label={tx("MFI (g/10min)")}>{selected.mfi}</Field>
                        <Field label={tx("Moisture Content (%)")}>{selected.moisture_content}</Field>
                        <Field label={tx("Melting Point Min (°C)")}>{selected.melting_point_min}</Field>
                        <Field label={tx("Melting Point Max (°C)")}>{selected.melting_point_max}</Field>
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
                    <Tooltip title={tx("Edit material")}>
                      <span>
                        <IconButton
                          size="small"
                          disabled={!canEdit}
                          onClick={() => setMaterialDialog(selected)}
                          sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={selected.status === "ACTIVE" ? tx("Deactivate material") : tx("Activate material")}>
                      <span>
                        <IconButton
                          size="small"
                          disabled={!canEdit || saving}
                          color={selected.status === "ACTIVE" ? "success" : "default"}
                          onClick={toggleStatus}
                          sx={{ border: 1, borderColor: "currentColor", borderRadius: 1.5 }}
                        >
                          {selected.status === "ACTIVE" ? <ToggleOnIcon fontSize="small" /> : <ToggleOffIcon fontSize="small" />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Box>
              ) : (
                <Stack height={480} spacing={1} sx={{ justifyContent: "center", alignItems: "center" }}>
                  <ScienceOutlinedIcon color="disabled" sx={{ fontSize: 44 }} />
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    {tx("Select a material to view details.")}
                  </Typography>
                </Stack>
              )}
            </Paper>
          </Box>
        </Stack>
        <MaterialDialog
          open={materialDialog !== null}
          material={materialDialog?.id ? materialDialog : null}
          nodes={nodes}
          fieldDefinitions={fieldDefinitions}
          saving={saving}
          onClose={() => setMaterialDialog(null)}
          onSave={saveMaterial}
        />
        <CategoryDialog
          open={categoryDialog}
          nodes={nodes}
          nodeTypes={nodeTypes}
          saving={saving}
          onClose={() => setCategoryDialog(false)}
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
