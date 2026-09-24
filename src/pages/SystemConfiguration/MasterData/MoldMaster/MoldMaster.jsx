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
        bgcolor: (theme) =>
          theme.palette.mode === "dark" ? "#182235" : "#E8F1FF",
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

function MoldStatusChip({ status, t }) {
  const tones = {
    AVAILABLE: "info",
    IN_PRODUCTION: "success",
    IN_MAINTENANCE: "warning",
    IN_REPAIR: "error",
    RETIRED: "default",
    SCRAPPED: "default",
  };
  return (
    <Chip
      size="small"
      variant="outlined"
      color={tones[status] || "default"}
      label={t(`moldMaster.status.${status}`, status)}
      sx={{ height: 21, fontSize: 10.5 }}
    />
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
              <ExpandMoreIcon sx={{ fontSize: 16 }} />
            ) : (
              <ChevronRightIcon sx={{ fontSize: 16 }} />
            )
          ) : (
            <Box sx={{ width: 16 }} />
          )}
        </IconButton>
        <LocationOnOutlinedIcon
          color={selectedId === node.id ? "primary" : "inherit"}
          sx={{ fontSize: 16 }}
        />
        <Typography
          noWrap
          variant="caption"
          sx={{ flex: 1, fontWeight: selectedId === node.id ? 700 : 500 }}
        >
          {node.node_name}
        </Typography>
        <Chip
          size="small"
          label={node.mold_count || 0}
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
      <Typography
        variant="caption"
        fontWeight={600}
        sx={{ minWidth: 0, wordBreak: "break-word" }}
      >
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
    <TextField
      {...common}
      type={type}
      multiline={definition.data_type === "LONG_TEXT"}
      minRows={definition.data_type === "LONG_TEXT" ? 2 : undefined}
      InputLabelProps={
        ["DATE", "DATETIME"].includes(definition.data_type)
          ? { shrink: true }
          : undefined
      }
    />
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
      products: form.productIds.map((id, index) => ({
        product_id: Number(id),
        is_primary: index === 0,
        status: "ACTIVE",
      })),
    });
  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: dialogPaperSx }}
    >
      <DialogHeader
        icon={<Inventory2OutlinedIcon />}
        title={mold ? t("moldMaster.editMold") : t("moldMaster.addMold")}
        disabled={saving}
        onClose={onClose}
      />
      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        sx={{ px: 3, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label={t("moldMaster.general")} />
        <Tab label={t("moldMaster.specification")} />
        <Tab label={t("moldMaster.customFields")} />
        <Tab label={t("moldMaster.products")} />
      </Tabs>
      <DialogContent dividers sx={{ minHeight: 410 }}>
        {tab === 0 && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2,minmax(0,1fr))",
              gap: 2,
            }}
          >
            <TextField
              size="small"
              required
              disabled={Boolean(mold)}
              label={t("moldMaster.fields.moldCode")}
              value={form.mold_code}
              onChange={(e) => set("mold_code", e.target.value)}
            />
            <TextField
              size="small"
              required
              label={t("moldMaster.fields.moldName")}
              value={form.mold_name}
              onChange={(e) => set("mold_name", e.target.value)}
            />
            <TextField
              size="small"
              label={t("moldMaster.fields.moldType")}
              value={form.mold_type || ""}
              onChange={(e) => set("mold_type", e.target.value)}
            />
            <TextField
              size="small"
              label={t("moldMaster.fields.moldGroup")}
              value={form.mold_group || ""}
              onChange={(e) => set("mold_group", e.target.value)}
            />
            <TextField
              select
              size="small"
              label={t("moldMaster.fields.status")}
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              disabled={Boolean(mold?.current_machine_id)}
              helperText={mold?.current_machine_id ? t("moldMaster.mountedHint") : ""}
            >
              {MOLD_STATUSES.map((item) => (
                <MenuItem key={item} value={item} disabled={item === "IN_PRODUCTION" && !mold?.current_machine_id}>
                  {t(`moldMaster.status.${item}`)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label={t("moldMaster.fields.location")}
              value={form.current_location_id}
              onChange={(e) => set("current_location_id", e.target.value)}
            >
              <MenuItem value="">—</MenuItem>
              {nodes
                .filter((n) => n.status === "ACTIVE")
                .map((item) => (
                  <MenuItem
                    key={item.id}
                    value={item.id}
                  >{`${"—".repeat(Math.max(0, item.level_no - 1))} ${item.node_name}`}</MenuItem>
                ))}
            </TextField>
            <TextField
              size="small"
              type="number"
              label={t("moldMaster.fields.cavity")}
              value={form.cavity_count}
              onChange={(e) => set("cavity_count", e.target.value)}
            />
            <TextField
              size="small"
              label={t("moldMaster.fields.manufacturer")}
              value={form.manufacturer || ""}
              onChange={(e) => set("manufacturer", e.target.value)}
            />
            <TextField
              size="small"
              type="date"
              InputLabelProps={{ shrink: true }}
              label={t("moldMaster.fields.manufactureDate")}
              value={form.manufacture_date}
              onChange={(e) => set("manufacture_date", e.target.value)}
            />
            <Box sx={{ gridColumn: "1 / -1" }}>
              <ImageUploadField
                value={form.image_url || ""}
                category="mold"
                label={t("moldMaster.fields.image", { defaultValue: "Image" })}
                onChange={(v) => set("image_url", v || "")}
              />
            </Box>
            <TextField
              size="small"
              multiline
              minRows={2}
              label={t("moldMaster.fields.description")}
              value={form.description || ""}
              onChange={(e) => set("description", e.target.value)}
              sx={{ gridColumn: "1 / -1" }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(e) => set("is_active", e.target.checked)}
                />
              }
              label={
                form.is_active
                  ? t("moldMaster.active")
                  : t("moldMaster.inactive")
              }
            />
          </Box>
        )}
        {tab === 1 && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2,minmax(0,1fr))",
              gap: 2,
            }}
          >
            {[
              "design_shot",
              "current_shot",
              "weight_kg",
              "length_mm",
              "width_mm",
              "height_mm",
            ].map((key) => (
              <TextField
                key={key}
                size="small"
                type="number"
                label={t(
                  `moldMaster.fields.${{ design_shot: "designShot", current_shot: "currentShot", weight_kg: "weight", length_mm: "length", width_mm: "width", height_mm: "height" }[key]}`,
                )}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            ))}
            <TextField
              size="small"
              label={t("moldMaster.fields.revision")}
              value={form.revision || ""}
              onChange={(e) => set("revision", e.target.value)}
            />
            <Box />
            <TextField
              size="small"
              type="number"
              label={t("moldMaster.fields.pmIntervalShot")}
              helperText={t("moldMaster.fields.pmIntervalShotHelp")}
              value={form.pm_interval_shot}
              onChange={(e) => set("pm_interval_shot", e.target.value)}
            />
            <TextField
              size="small"
              type="number"
              label={t("moldMaster.fields.pmIntervalDays")}
              helperText={t("moldMaster.fields.pmIntervalDaysHelp")}
              value={form.pm_interval_days}
              onChange={(e) => set("pm_interval_days", e.target.value)}
            />
            <TextField
              size="small"
              multiline
              minRows={3}
              label={t("moldMaster.fields.remark")}
              value={form.remark || ""}
              onChange={(e) => set("remark", e.target.value)}
              sx={{ gridColumn: "1 / -1" }}
            />
          </Box>
        )}
        {tab === 2 && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2,minmax(0,1fr))",
              gap: 2,
            }}
          >
            {attributes.length ? (
              attributes.map((item) => (
                <DynamicInput
                  key={item.id}
                  definition={item}
                  value={form.attributeMap[item.id]}
                  onChange={(value) =>
                    setForm((old) => ({
                      ...old,
                      attributeMap: { ...old.attributeMap, [item.id]: value },
                    }))
                  }
                />
              ))
            ) : (
              <Alert severity="info" sx={{ gridColumn: "1 / -1" }}>
                {t("moldMaster.noCustomFields")}
              </Alert>
            )}
          </Box>
        )}
        {tab === 3 && (
          <FormControl fullWidth size="small">
            <InputLabel>{t("moldMaster.fields.linkedProducts")}</InputLabel>
            <Select
              multiple
              label={t("moldMaster.fields.linkedProducts")}
              value={form.productIds}
              onChange={(e) => set("productIds", e.target.value)}
              renderValue={(ids) =>
                ids
                  .map(
                    (id) =>
                      products.find((p) => p.id === Number(id))?.product_code,
                  )
                  .filter(Boolean)
                  .join(", ")
              }
            >
              {products.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.product_code} — {item.product_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("moldMaster.cancel")}</Button>
        <Button
          variant="contained"
          disabled={saving || !form.mold_code.trim() || !form.mold_name.trim()}
          onClick={submit}
        >
          {saving ? <CircularProgress size={18} /> : t("moldMaster.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AttributeDialog({ open, item, saving, onClose, onSave, t }) {
  const [form, setForm] = useState({
    attribute_code: "",
    attribute_name: "",
    data_type: "TEXT",
    unit: "",
    is_required: false,
    is_searchable: false,
    is_filterable: false,
    show_in_list: false,
    sort_order: 0,
    is_active: true,
    optionsText: "",
  });
  useEffect(() => {
    if (open)
      setForm(
        item
          ? {
              ...item,
              optionsText: (item.select_options || [])
                .map((x) => `${x.value}|${x.label || x.value}`)
                .join("\n"),
            }
          : {
              attribute_code: "",
              attribute_name: "",
              data_type: "TEXT",
              unit: "",
              is_required: false,
              is_searchable: false,
              is_filterable: false,
              show_in_list: false,
              sort_order: 0,
              is_active: true,
              optionsText: "",
            },
      );
  }, [open, item]);
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const submit = () =>
    onSave({
      ...form,
      unit: form.unit || null,
      select_options: ["SELECT", "MULTI_SELECT"].includes(form.data_type)
        ? form.optionsText
            .split("\n")
            .filter(Boolean)
            .map((line) => {
              const [value, label] = line.split("|");
              return { value: value.trim(), label: (label || value).trim() };
            })
        : null,
      sort_order: Number(form.sort_order || 0),
    });
  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: dialogPaperSx }}
    >
      <DialogHeader
        icon={<TuneOutlinedIcon />}
        title={item ? t("moldMaster.editField") : t("moldMaster.addField")}
        disabled={saving}
        onClose={onClose}
      />
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            size="small"
            required
            disabled={Boolean(item)}
            label={t("moldMaster.fields.code")}
            value={form.attribute_code}
            onChange={(e) =>
              set(
                "attribute_code",
                e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
              )
            }
          />
          <TextField
            size="small"
            required
            label={t("moldMaster.fields.name")}
            value={form.attribute_name}
            onChange={(e) => set("attribute_name", e.target.value)}
          />
          <TextField
            select
            size="small"
            disabled={Boolean(item)}
            label={t("moldMaster.fields.type")}
            value={form.data_type}
            onChange={(e) => set("data_type", e.target.value)}
          >
            {DATA_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label={t("moldMaster.fields.unit")}
            value={form.unit || ""}
            onChange={(e) => set("unit", e.target.value)}
          />
          {["SELECT", "MULTI_SELECT"].includes(form.data_type) && (
            <TextField
              multiline
              minRows={4}
              label="Options (value|label)"
              value={form.optionsText}
              onChange={(e) => set("optionsText", e.target.value)}
            />
          )}
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_required}
                  onChange={(e) => set("is_required", e.target.checked)}
                />
              }
              label={t("moldMaster.fields.required")}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.show_in_list}
                  onChange={(e) => set("show_in_list", e.target.checked)}
                />
              }
              label={t("moldMaster.fields.showInList")}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(e) => set("is_active", e.target.checked)}
                />
              }
              label={t("moldMaster.active")}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("moldMaster.cancel")}</Button>
        <Button variant="contained" disabled={saving} onClick={submit}>
          {t("moldMaster.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function HierarchyDialog({
  open,
  nodes,
  nodeTypes,
  saving,
  onClose,
  onReload,
  request,
  actor,
  t,
}) {
  const [tab, setTab] = useState(0);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    node_code: "",
    node_name: "",
    node_type_id: "",
    parent_id: "",
    status: "ACTIVE",
    sort_order: 0,
    type_code: "",
    type_name: "",
    level_order: 1,
    is_active: true,
  });
  const begin = (item = null) => {
    setEditing(item);
    setForm(
      tab === 0
        ? {
            node_code: item?.node_code || "",
            node_name: item?.node_name || "",
            node_type_id: item?.node_type_id || "",
            parent_id: item?.parent_id || "",
            status: item?.status || "ACTIVE",
            sort_order: item?.sort_order || 0,
            capacity: item?.capacity ?? "",
          }
        : {
            type_code: item?.type_code || "",
            type_name: item?.type_name || "",
            level_order: item?.level_order || 1,
            location_category: item?.location_category || "STORAGE",
            is_active: item?.is_active ?? true,
            sort_order: item?.sort_order || 0,
          },
    );
  };
  useEffect(() => {
    if (open) begin(null);
  }, [open, tab]);
  const save = async () => {
    const isNode = tab === 0;
    const base = `${API_BASE}/api/mold-master/${isNode ? "location-nodes" : "location-node-types"}`;
    const payload = isNode
      ? {
          node_name: form.node_name,
          node_type_id: Number(form.node_type_id),
          parent_id: form.parent_id === "" ? null : Number(form.parent_id),
          status: form.status,
          sort_order: Number(form.sort_order || 0),
          capacity: numOrNull(form.capacity),
          ...(editing
            ? { updated_by: actor }
            : { node_code: form.node_code, created_by: actor }),
        }
      : {
          type_name: form.type_name,
          level_order: Number(form.level_order),
          location_category: form.location_category || "STORAGE",
          is_active: form.is_active,
          sort_order: Number(form.sort_order || 0),
          ...(editing
            ? { updated_by: actor }
            : { type_code: form.type_code, created_by: actor }),
        };
    await request(editing ? `${base}/${editing.id}` : base, {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    await onReload();
    begin(null);
  };
  const remove = async (item) => {
    if (!window.confirm(t("moldMaster.messages.confirmDelete"))) return;
    const segment = tab === 0 ? "location-nodes" : "location-node-types";
    await request(`${API_BASE}/api/mold-master/${segment}/${item.id}`, {
      method: "DELETE",
    });
    await onReload();
    begin(null);
  };
  const rows = tab === 0 ? nodes : nodeTypes;
  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: dialogPaperSx }}
    >
      <DialogHeader
        icon={<AccountTreeOutlinedIcon />}
        title={t("moldMaster.hierarchy")}
        disabled={saving}
        onClose={onClose}
      />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3 }}>
        <Tab label={t("moldMaster.locationNodes")} />
        <Tab label={t("moldMaster.nodeTypes")} />
      </Tabs>
      <DialogContent dividers>
        <Box
          sx={{ display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 2 }}
        >
          <Paper variant="outlined" sx={{ maxHeight: 430, overflow: "auto" }}>
            {rows.map((item) => (
              <Stack
                key={item.id}
                direction="row"
                sx={{
                  alignItems: "center",
                  px: 1.5,
                  py: 0.7,
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {tab === 0 ? item.node_name : item.type_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {tab === 0 ? item.node_code : item.type_code}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => begin(item)}>
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => remove(item)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Paper>
          <Stack spacing={1.5}>
            {tab === 0 ? (
              <>
                <TextField
                  size="small"
                  disabled={Boolean(editing)}
                  label={t("moldMaster.fields.code")}
                  value={form.node_code || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      node_code: e.target.value.toUpperCase(),
                    })
                  }
                />
                <TextField
                  size="small"
                  label={t("moldMaster.fields.name")}
                  value={form.node_name || ""}
                  onChange={(e) =>
                    setForm({ ...form, node_name: e.target.value })
                  }
                />
                <TextField
                  select
                  size="small"
                  label={t("moldMaster.fields.type")}
                  value={form.node_type_id || ""}
                  onChange={(e) =>
                    setForm({ ...form, node_type_id: e.target.value })
                  }
                >
                  {nodeTypes
                    .filter((x) => x.is_active)
                    .map((x) => (
                      <MenuItem key={x.id} value={x.id}>
                        {x.type_name}
                      </MenuItem>
                    ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label={t("moldMaster.fields.parent")}
                  value={form.parent_id || ""}
                  onChange={(e) =>
                    setForm({ ...form, parent_id: e.target.value })
                  }
                >
                  <MenuItem value="">{t("moldMaster.root")}</MenuItem>
                  {nodes
                    .filter((x) => x.id !== editing?.id)
                    .map((x) => (
                      <MenuItem key={x.id} value={x.id}>
                        {x.node_name}
                      </MenuItem>
                    ))}
                </TextField>
                <TextField
                  size="small"
                  type="number"
                  label={t("moldMaster.fields.capacity")}
                  helperText={t("moldMaster.fields.capacityHelp")}
                  value={form.capacity ?? ""}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                />
              </>
            ) : (
              <>
                <TextField
                  size="small"
                  disabled={Boolean(editing)}
                  label={t("moldMaster.fields.code")}
                  value={form.type_code || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type_code: e.target.value.toUpperCase(),
                    })
                  }
                />
                <TextField
                  size="small"
                  label={t("moldMaster.fields.name")}
                  value={form.type_name || ""}
                  onChange={(e) =>
                    setForm({ ...form, type_name: e.target.value })
                  }
                />
                <TextField
                  size="small"
                  type="number"
                  label={t("moldMaster.fields.level")}
                  value={form.level_order || 1}
                  onChange={(e) =>
                    setForm({ ...form, level_order: e.target.value })
                  }
                />
                <TextField
                  select
                  size="small"
                  label={t("moldMaster.fields.locationCategory")}
                  value={form.location_category || "STORAGE"}
                  onChange={(e) => setForm({ ...form, location_category: e.target.value })}
                >
                  {LOCATION_CATEGORIES.map((c) => (
                    <MenuItem key={c} value={c}>{t(`moldMaster.locationCategory.${c}`)}</MenuItem>
                  ))}
                </TextField>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(form.is_active)}
                      onChange={(e) =>
                        setForm({ ...form, is_active: e.target.checked })
                      }
                    />
                  }
                  label={t("moldMaster.active")}
                />
              </>
            )}
            <Stack direction="row" spacing={1}>
              <Button onClick={() => begin(null)}>
                {tab === 0
                  ? t("moldMaster.addNode")
                  : t("moldMaster.addNodeType")}
              </Button>
              <Button variant="contained" disabled={saving} onClick={save}>
                {t("moldMaster.save")}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("moldMaster.cancel")}</Button>
      </DialogActions>
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
  const actor = currentUser.full_name || currentUser.employee_code || null;
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
  const [filters, setFilters] = useState({
    keyword: "",
    status: "",
    moldType: "",
    moldGroup: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moldDialog, setMoldDialog] = useState(null);
  const [fieldManager, setFieldManager] = useState(false);
  const [fieldDialog, setFieldDialog] = useState(null);
  const [hierarchyDialog, setHierarchyDialog] = useState(false);
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
    if (filters.status) params.set("status", filters.status);
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
  }, [selectedId, request]);

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
      {
        headerName: t("moldMaster.fields.moldCode"),
        field: "mold_code",
        width: 110,
        pinned: "left",
      },
      {
        headerName: t("moldMaster.fields.moldName"),
        field: "mold_name",
        minWidth: 180,
        flex: 1.2,
      },
      {
        headerName: t("moldMaster.fields.moldType"),
        field: "mold_type",
        width: 130,
      },
      {
        headerName: t("moldMaster.fields.cavity"),
        field: "cavity_count",
        width: 82,
        cellStyle: { textAlign: "center" },
      },
      {
        headerName: t("moldMaster.fields.status"),
        field: "status",
        width: 130,
        cellRenderer: (p) => (
          <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}>
            <MoldStatusChip status={p.value} t={t} />
          </Box>
        ),
      },
      {
        headerName: t("moldMaster.fields.location"),
        field: "location_name",
        width: 135,
      },
      {
        headerName: t("moldMaster.fields.currentShot"),
        field: "current_shot",
        width: 120,
        valueFormatter: (p) => Number(p.value || 0).toLocaleString(),
      },
      {
        headerName: t("moldMaster.fields.lifeUsed"),
        field: "life_used_percent",
        width: 105,
        valueFormatter: (p) => `${Number(p.value || 0).toFixed(1)}%`,
      },
      {
        headerName: t("moldMaster.fields.actions"),
        width: 90,
        sortable: false,
        cellRenderer: (p) => (
          <Stack
            direction="row"
            height="100%"
            alignItems="center"
            justifyContent="center"
          >
            <Tooltip title={t("moldMaster.view")}>
              <IconButton size="small" onClick={() => setSelectedId(p.data.id)}>
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("moldMaster.edit")}>
              <span>
                <IconButton
                  size="small"
                  disabled={!canEdit}
                  onClick={async () => {
                    const item = await request(
                      `${API_BASE}/api/mold-master/molds/${p.data.id}`,
                    );
                    setMoldDialog(item);
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
    [t, canEdit, request],
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
  const saveAttribute = async (form) => {
    setSaving(true);
    try {
      const editing = Boolean(fieldDialog?.id);
      const payload = {
        ...form,
        ...(editing ? { updated_by: actor } : { created_by: actor }),
      };
      if (editing) delete payload.attribute_code;
      if (editing) delete payload.data_type;
      delete payload.optionsText;
      await request(
        editing
          ? `${API_BASE}/api/mold-master/attributes/${fieldDialog.id}`
          : `${API_BASE}/api/mold-master/attributes`,
        { method: editing ? "PUT" : "POST", body: JSON.stringify(payload) },
      );
      setFieldDialog(null);
      await loadReference();
      setMessage({ severity: "success", text: t("moldMaster.messages.saved") });
    } catch (e) {
      setMessage({ severity: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const kpis = [
    {
      label: t("moldMaster.kpi.total"),
      value: stats.total_molds,
      icon: Inventory2OutlinedIcon,
      tone: "primary",
    },
    {
      label: t("moldMaster.kpi.production"),
      value: stats.in_production,
      icon: PrecisionManufacturingOutlinedIcon,
      tone: "success",
    },
    {
      label: t("moldMaster.kpi.maintenance"),
      value: stats.in_maintenance,
      icon: BuildOutlinedIcon,
      tone: "warning",
    },
    {
      label: t("moldMaster.kpi.life"),
      value: `${Number(stats.average_life_used || 0).toFixed(1)}%`,
      icon: PercentOutlinedIcon,
      tone: "accent",
    },
    {
      label: t("moldMaster.kpi.available"),
      value: stats.available,
      icon: CategoryOutlinedIcon,
      tone: "info",
    },
    {
      label: t("moldMaster.kpi.repair"),
      value: stats.in_repair,
      icon: SettingsOutlinedIcon,
      tone: "danger",
    },
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
          title={`${t("moldMaster.title")} | VCC Plastics`}
          description={t("moldMaster.description")}
        />
        <PageBreadcrumb pageTitle={t("moldMaster.title")} />
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
                {t("moldMaster.title")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("moldMaster.description")}
              </Typography>
            </Box>
            <Stack
              direction="row"
              sx={{ flexWrap: "wrap", gap: 2, justifyContent: "flex-end" }}
            >
              <Tooltip title={t("moldMaster.settings", "Settings")}>
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
                    setFieldManager(true);
                  }}
                >
                  <ListItemIcon>
                    <TuneOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{t("moldMaster.manageFields")}</ListItemText>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setSettingsAnchor(null);
                    setHierarchyDialog(true);
                  }}
                >
                  <ListItemIcon>
                    <AccountTreeOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{t("moldMaster.hierarchy")}</ListItemText>
                </MenuItem>
              </Menu>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!canEdit}
                onClick={() => setMoldDialog({})}
                sx={buttonSx("primary")}
              >
                {t("moldMaster.addMold")}
              </Button>
            </Stack>
          </Box>
          <KpiCardGroup>
            {kpis.map((item) => {
              const Icon = item.icon;
              return (
                <KpiCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  note=""
                  icon={<Icon />}
                  tone={item.tone}
                />
              );
            })}
          </KpiCardGroup>
          <Paper variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "minmax(220px,1.5fr) repeat(3,minmax(130px,.75fr)) auto",
                },
                gap: 1,
              }}
            >
              <TextField
                size="small"
                placeholder={t("moldMaster.search")}
                value={filters.keyword}
                onChange={(e) =>
                  setFilters({ ...filters, keyword: e.target.value })
                }
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
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <MenuItem value="">{t("moldMaster.allStatuses")}</MenuItem>
                {MOLD_STATUSES.map((x) => (
                  <MenuItem key={x} value={x}>
                    {t(`moldMaster.status.${x}`)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                value={filters.moldType}
                onChange={(e) =>
                  setFilters({ ...filters, moldType: e.target.value })
                }
              >
                <MenuItem value="">{t("moldMaster.allTypes")}</MenuItem>
                {types.map((x) => (
                  <MenuItem key={x} value={x}>
                    {x}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                value={filters.moldGroup}
                onChange={(e) =>
                  setFilters({ ...filters, moldGroup: e.target.value })
                }
              >
                <MenuItem value="">{t("moldMaster.allGroups")}</MenuItem>
                {groups.map((x) => (
                  <MenuItem key={x} value={x}>
                    {x}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                onClick={() => {
                  setFilters({
                    keyword: "",
                    status: "",
                    moldType: "",
                    moldGroup: "",
                  });
                  setLocationId(null);
                }}
              >
                {t("moldMaster.clear")}
              </Button>
            </Box>
          </Paper>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                lg: "230px minmax(0,1fr) 300px",
              },
              gap: 1.25,
              minHeight: 520,
            }}
          >
            <Paper sx={panelSx}>
              <SectionHeader
                title={t("moldMaster.hierarchy")}
                icon={<AccountTreeOutlinedIcon sx={{ fontSize: 18 }} />}
                action={
                  <IconButton size="small" onClick={() => setLocationId(null)}>
                    <RefreshIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                }
              />
              <Box sx={{ p: 0.75, maxHeight: 486, overflow: "auto" }}>
                <Box
                  onClick={() => setLocationId(null)}
                  sx={{
                    px: 1,
                    py: 0.7,
                    cursor: "pointer",
                    borderRadius: 1,
                    bgcolor:
                      locationId == null ? "action.selected" : "transparent",
                  }}
                >
                  <Typography variant="caption" fontWeight={700}>
                    {t("moldMaster.allLocations")}
                  </Typography>
                </Box>
                {roots.map((node) => (
                  <LocationTreeNode
                    key={node.id}
                    node={node}
                    allNodes={nodes}
                    selectedId={locationId}
                    expanded={expanded}
                    onToggle={(id) =>
                      setExpanded((old) =>
                        old.includes(id)
                          ? old.filter((x) => x !== id)
                          : [...old, id],
                      )
                    }
                    onSelect={setLocationId}
                  />
                ))}
              </Box>
            </Paper>
            <Paper sx={panelSx}>
              <SectionHeader
                title={`${t("moldMaster.moldList")} (${molds.length})`}
                icon={<Inventory2OutlinedIcon sx={{ fontSize: 18 }} />}
                action={
                  <IconButton size="small" onClick={loadAll}>
                    <RefreshIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                }
              />
              <Box sx={{ height: 486 }}>
                {loading ? (
                  <Stack
                    height="100%"
                    sx={{ alignItems: "center", justifyContent: "center" }}
                  >
                    <CircularProgress size={28} />
                  </Stack>
                ) : (
                  <AgGridTable
                    rowData={molds}
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
              <SectionHeader
                title={t("moldMaster.moldDetail")}
                icon={
                  <PrecisionManufacturingOutlinedIcon sx={{ fontSize: 18 }} />
                }
                action={
                  selected && (
                    <Stack direction="row" sx={{ gap: 2.5 }}>
                      <IconButton
                        size="small"
                        disabled={!canEdit}
                        onClick={() => setMoldDialog(selected)}
                      >
                        <EditOutlinedIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={!canEdit}
                        onClick={deleteMold}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Stack>
                  )
                }
              />
              {selected ? (
                <Box>
                  <Stack direction="row" spacing={1.25} sx={{ p: 1.5 }}>
                    <Avatar
                      variant="rounded"
                      src={resolveImageUrl(selected.image_url) || undefined}
                      sx={{ width: 58, height: 58, bgcolor: "action.hover" }}
                    >
                      <PrecisionManufacturingOutlinedIcon />
                    </Avatar>
                    <Box minWidth={0}>
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                        <Typography fontWeight={700}>
                          {selected.mold_code}
                        </Typography>
                        <MoldStatusChip status={selected.status} t={t} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {selected.mold_name}
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
                      "& .MuiTab-root": {
                        minHeight: 34,
                        fontSize: 10.5,
                        px: 0.5,
                      },
                    }}
                  >
                    <Tab label={t("moldMaster.general")} />
                    <Tab label={t("moldMaster.specification")} />
                    <Tab label={t("moldMaster.products")} />
                    <Tab label={t("moldMaster.documents.tab")} />
                  </Tabs>
                  <Box
                    sx={{ px: 1.5, py: 1, maxHeight: 350, overflow: "auto" }}
                  >
                    {detailTab === 0 && (
                      <>
                        <Field label={t("moldMaster.fields.moldCode")}>
                          {selected.mold_code}
                        </Field>
                        <Field label={t("moldMaster.fields.moldName")}>
                          {selected.mold_name}
                        </Field>
                        <Field label={t("moldMaster.fields.moldType")}>
                          {selected.mold_type}
                        </Field>
                        <Field label={t("moldMaster.fields.moldGroup")}>
                          {selected.mold_group}
                        </Field>
                        <Field label={t("moldMaster.fields.cavity")}>
                          {selected.cavity_count}
                        </Field>
                        <Field label={t("moldMaster.fields.location")}>
                          {selected.location_name}
                        </Field>
                        <Field label={t("moldMaster.fields.manufacturer")}>
                          {selected.manufacturer}
                        </Field>
                        <Field label={t("moldMaster.fields.manufactureDate")}>
                          {selected.manufacture_date}
                        </Field>
                      </>
                    )}
                    {detailTab === 1 && (
                      <>
                        <Field label={t("moldMaster.fields.currentShot")}>
                          {Number(selected.current_shot || 0).toLocaleString()}
                        </Field>
                        <Field label={t("moldMaster.fields.designShot")}>
                          {Number(selected.design_shot || 0).toLocaleString()}
                        </Field>
                        <Field label={t("moldMaster.fields.lifeUsed")}>
                          {Number(selected.life_used_percent || 0).toFixed(1)}%
                        </Field>
                        <Field label={t("moldMaster.fields.weight")}>
                          {selected.weight_kg}
                        </Field>
                        <Field
                          label={`${t("moldMaster.fields.length")} × ${t("moldMaster.fields.width")} × ${t("moldMaster.fields.height")}`}
                        >
                          {[
                            selected.length_mm,
                            selected.width_mm,
                            selected.height_mm,
                          ]
                            .filter((x) => x != null)
                            .join(" × ") || "—"}
                        </Field>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="caption" fontWeight={700}>
                          {t("moldMaster.customFields")}
                        </Typography>
                        {selected.attribute_values
                          ?.filter((x) => x.value != null)
                          .map((x) => (
                            <Field key={x.id} label={x.attribute_name}>
                              {Array.isArray(x.value)
                                ? x.value.join(", ")
                                : String(x.value)}
                            </Field>
                          ))}
                      </>
                    )}
                    {detailTab === 3 && (
                      <MoldDocuments moldId={selected.id} apiBase={API_BASE} request={request} actor={actor} canEdit={canEdit} />
                    )}
                    {detailTab === 2 &&
                      (selected.products?.length ? (
                        selected.products.map((p) => (
                          <Paper
                            key={p.id}
                            variant="outlined"
                            sx={{ p: 1, mb: 0.75 }}
                          >
                            <Typography variant="caption" fontWeight={700}>
                              {p.product_code}
                            </Typography>
                            <Typography
                              variant="caption"
                              display="block"
                              color="text.secondary"
                            >
                              {p.product_name}
                            </Typography>
                            {p.is_primary ? (
                              <Chip
                                label="Primary"
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ mt: 0.5, height: 18 }}
                              />
                            ) : null}
                          </Paper>
                        ))
                      ) : (
                        <Alert severity="info">
                          {t("moldMaster.noProducts")}
                        </Alert>
                      ))}
                  </Box>
                </Box>
              ) : (
                <Stack
                  height={480}
                  spacing={1}
                  sx={{ justifyContent: "center", alignItems: "center" }}
                >
                  <PrecisionManufacturingOutlinedIcon
                    color="disabled"
                    sx={{ fontSize: 44 }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                  >
                    {t("moldMaster.selectMold")}
                  </Typography>
                </Stack>
              )}
            </Paper>
          </Box>
        </Stack>
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
        <Dialog
          open={fieldManager}
          onClose={() => setFieldManager(false)}
          fullWidth
          maxWidth="md"
          PaperProps={{ sx: dialogPaperSx }}
        >
          <DialogHeader
            icon={<TuneOutlinedIcon />}
            title={t("moldMaster.manageFields")}
            onClose={() => setFieldManager(false)}
          />
          <DialogContent dividers>
            {attributes.map((item) => (
              <Stack
                key={item.id}
                direction="row"
                sx={{ alignItems: "center", py: 0.8, borderBottom: 1, borderColor: "divider" }}
              >
                <Box flex={1}>
                  <Typography variant="body2" fontWeight={600}>
                    {item.attribute_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.attribute_code} · {item.data_type}
                    {item.unit ? ` · ${item.unit}` : ""}
                  </Typography>
                </Box>
                {item.is_required && (
                  <Chip
                    size="small"
                    label={t("moldMaster.fields.required")}
                    color="warning"
                    variant="outlined"
                  />
                )}
                <IconButton size="small" onClick={() => setFieldDialog(item)}>
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </DialogContent>
          <DialogActions>
            <Button
              startIcon={<AddIcon />}
              onClick={() => setFieldDialog({})}
              sx={{ mr: "auto", ...buttonSx("primary") }}
            >
              {t("moldMaster.addField")}
            </Button>
            <Button onClick={() => setFieldManager(false)}>
              {t("moldMaster.cancel")}
            </Button>
          </DialogActions>
        </Dialog>
        <AttributeDialog
          open={fieldDialog !== null}
          item={fieldDialog?.id ? fieldDialog : null}
          saving={saving}
          onClose={() => setFieldDialog(null)}
          onSave={saveAttribute}
          t={t}
        />
        <HierarchyDialog
          open={hierarchyDialog}
          nodes={nodes}
          nodeTypes={nodeTypes}
          saving={saving}
          onClose={() => setHierarchyDialog(false)}
          onReload={loadReference}
          request={request}
          actor={actor}
          t={t}
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
