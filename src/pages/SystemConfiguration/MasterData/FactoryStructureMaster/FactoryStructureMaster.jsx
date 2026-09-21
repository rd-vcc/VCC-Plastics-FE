import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
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
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import DomainOutlinedIcon from "@mui/icons-material/DomainOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FactoryOutlinedIcon from "@mui/icons-material/FactoryOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import LanOutlinedIcon from "@mui/icons-material/LanOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import PageMeta from "../../../../components/common/PageMeta";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import AgGridTable from "../../../../components/tables/BasicTables/BasicTableOne";
import { API_CONFIG } from "../../../../config/config";
import { getAccessToken, getCurrentUser } from "../../../../auth/auth";
import usePagePermission from "../../../../auth/usePagePermission";
import { buttonSystem } from "../../../../components/button/ButtonSystem";
import { KpiCard, KpiCardGroup } from "../../../../components/kpi/KpiCardSystem";
import { useTheme as useAppTheme } from "../../../../context/ThemeContext";
import { useTranslation } from "react-i18next";

const API_BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const PANEL_HEADER_HEIGHT = 30;
const CONTENT_HEIGHT = 520;

const TYPE_META = {
  COMPANY: { label: "Company", icon: BusinessOutlinedIcon, tone: "primary" },
  FACTORY: { label: "Factory", icon: FactoryOutlinedIcon, tone: "success" },
  AREA: { label: "Area", icon: DomainOutlinedIcon, tone: "info" },
  WORKSHOP: {
    label: "Workshop",
    icon: PrecisionManufacturingOutlinedIcon,
    tone: "warning",
  },
  LINE: { label: "Line", icon: HubOutlinedIcon, tone: "accent" },
  STATION: { label: "Station", icon: LanOutlinedIcon, tone: "info" },
};

const cardSx = {
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 2,
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
};

function buttonSx(type, overrides = {}) {
  const styles = buttonSystem[type];
  return {
    ...styles.base,
    ...(styles["& .MuiSvgIcon-root"]
      ? { "& .MuiSvgIcon-root": styles["& .MuiSvgIcon-root"] }
      : {}),
    ...(styles.hover ? { "&:hover": styles.hover } : {}),
    ...(styles.active ? { "&:active": styles.active } : {}),
    ...overrides,
  };
}

function createFactoryTheme(mode) {
  const isDark = mode === "dark";
  return createTheme({
    palette: {
      mode,
      primary: { main: "#005BAB" },
      background: {
        default: isDark ? "#0B1220" : "#F8FAFC",
        paper: isDark ? "#111827" : "#FFFFFF",
      },
      text: {
        primary: isDark ? "#F3F4F6" : "#172033",
        secondary: isDark ? "#A7B0C0" : "#667085",
      },
      divider: isDark ? "#344054" : "#D0D5DD",
    },
    typography: {
      fontFamily: '"Bai Jamjuree", Inter, ui-sans-serif, system-ui, sans-serif',
    },
    components: {
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
            // Tailwind's preflight resets border-width globally, which can
            // strip MUI's default notched-outline border on this page — so
            // it's re-asserted explicitly here.
            "& .MuiOutlinedInput-notchedOutline": {
              borderWidth: "1px !important",
              borderStyle: "solid !important",
              borderColor: `${isDark ? "#3B4759" : "#CBD3DF"} !important`,
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: `${isDark ? "#5B6B84" : "#98A2B3"} !important`,
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

function pageSx(isDark) {
  if (!isDark) return {};
  return {
    color: "text.primary",
    "& .vcc-ag-grid": {
      "--ag-background-color": "#111827",
      "--ag-header-background-color": "#182235",
      "--ag-header-foreground-color": "#E5E7EB",
      "--ag-foreground-color": "#D0D5DD",
      "--ag-border-color": "#344054",
      "--ag-row-border-color": "#293548",
      "--ag-odd-row-background-color": "#0F172A",
      "--ag-row-hover-color": "#1B2B45",
      "--ag-selected-row-background-color": "#173A63",
    },
  };
}

function SectionHeader({ icon, title, action }) {
  return (
    <Box
      sx={{
        height: PANEL_HEADER_HEIGHT,
        px: 1.25,
        bgcolor: (theme) =>
          theme.palette.mode === "dark" ? "#182235" : "#DDEBFF",
        borderBottom: 1,
        borderColor: (theme) =>
          theme.palette.mode === "dark" ? "#344054" : "#AFC7EE",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.75} minWidth={0}>
        {icon}
        <Typography
          variant="subtitle2"
          noWrap
          sx={{ fontWeight: 700, WebkitTextStroke: "0.22px currentColor" }}
        >
          {title}
        </Typography>
      </Stack>
      {action}
    </Box>
  );
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

function FieldGroupLabel({ children }) {
  return (
    <Typography
      variant="caption"
      sx={{
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: "text.secondary",
        fontSize: "0.68rem",
      }}
    >
      {children}
    </Typography>
  );
}

function StatusChip({ status }) {
  const { t } = useTranslation();
  const active = status === "ACTIVE";
  return (
    <Chip
      size="small"
      label={
        active ? t("factoryStructure.active") : t("factoryStructure.inactive")
      }
      color={active ? "success" : "error"}
      variant="outlined"
      sx={{ height: 20, "& .MuiChip-label": { px: 0.75 } }}
    />
  );
}

function normalizeNode(node) {
  return {
    ...node,
    type: node.node_type_code,
    parentId: node.parent_id,
    createdBy: node.created_by,
    createdAt: node.created_at,
    updatedAt: node.updated_at,
  };
}

function formatDateTime(value, language) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(
    language === "ja" ? "ja-JP" : language === "vi" ? "vi-VN" : "en-GB",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function TreeNode({
  node,
  nodes,
  selectedId,
  expanded,
  onToggle,
  onSelect,
  depth = 0,
}) {
  const children = nodes.filter((item) => item.parentId === node.id);
  const open = expanded.includes(node.id);
  const meta = TYPE_META[node.type] || TYPE_META.AREA;
  const Icon = meta.icon;
  return (
    <Box>
      <Box
        onClick={() => onSelect(node.id)}
        sx={{
          minHeight: 31,
          pl: `${depth * 14 + 3}px`,
          pr: 0.5,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
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
          sx={{ width: 20, height: 20 }}
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
        <Icon color="primary" sx={{ fontSize: 16 }} />
        <Typography
          noWrap
          sx={{
            flex: 1,
            fontSize: 11,
            fontWeight: selectedId === node.id ? 700 : 600,
          }}
        >
          {node.name}
        </Typography>
        <StatusChip status={node.status} />
      </Box>
      {children.length > 0 && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              nodes={nodes}
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

function NodeDialog({
  open,
  mode,
  node,
  nodes,
  nodeTypes,
  saving,
  onClose,
  onSave,
}) {
  const { t } = useTranslation();
  const activeTypes = nodeTypes.filter((item) => Boolean(item.is_active));
  const suggestedType = node
    ? activeTypes.find((item) => item.parent_type_id === node.node_type_id)
    : activeTypes.find((item) => item.parent_type_id == null);
  const [form, setForm] = useState(
    mode === "edit" && node
      ? {
          ...node,
          nodeTypeId: node.node_type_id,
        }
      : {
          code: "",
          name: "",
          nodeTypeId: suggestedType?.id || "",
          parentId: node?.id ?? null,
          description: "",
          status: "ACTIVE",
          sort_order: 0,
        },
  );
  const change = (key) => (event) =>
    setForm((old) => ({ ...old, [key]: event.target.value }));
  const selectedType = activeTypes.find(
    (item) => item.id === Number(form.nodeTypeId),
  );
  const parentCandidates = nodes.filter(
    (item) =>
      item.node_type_id === selectedType?.parent_type_id &&
      item.status === "ACTIVE" &&
      item.id !== node?.id,
  );
  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
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
        title={
          mode === "edit"
            ? t("factoryStructure.editNode")
            : t("factoryStructure.addNewNode")
        }
        subtitle={t("factoryStructure.descriptionText")}
        disabled={saving}
        onClose={onClose}
      />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Stack spacing={2.25}>
          <Stack spacing={1.25}>
            <FieldGroupLabel>
              {t("factoryStructure.sectionBasicInfo")}
            </FieldGroupLabel>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                fullWidth
                size="small"
                label={t("factoryStructure.nodeCode")}
                value={form.code}
                disabled={mode === "edit"}
                onChange={change("code")}
              />
              <TextField
                fullWidth
                size="small"
                label={t("factoryStructure.nodeName")}
                value={form.name}
                onChange={change("name")}
              />
            </Stack>
          </Stack>
          <Stack spacing={1.25}>
            <FieldGroupLabel>
              {t("factoryStructure.sectionHierarchy")}
            </FieldGroupLabel>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>{t("factoryStructure.nodeType")}</InputLabel>
              <Select
                label={t("factoryStructure.nodeType")}
                value={form.nodeTypeId}
                onChange={(event) =>
                  setForm((old) => ({
                    ...old,
                    nodeTypeId: event.target.value,
                    parentId: null,
                  }))
                }
              >
                {activeTypes.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl
              fullWidth
              size="small"
              disabled={selectedType?.parent_type_id == null}
            >
              <InputLabel>{t("factoryStructure.parentNode")}</InputLabel>
              <Select
                label={t("factoryStructure.parentNode")}
                value={form.parentId ?? ""}
                onChange={change("parentId")}
              >
                <MenuItem value="">
                  <em>{t("factoryStructure.selectParent")}</em>
                </MenuItem>
                {parentCandidates.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.code} — {item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            </Stack>
          </Stack>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label={t("factoryStructure.description")}
            value={form.description || ""}
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
        <Button
          fullWidth
          disabled={
            saving ||
            !form.code.trim() ||
            !form.name.trim() ||
            !selectedType ||
            (selectedType.parent_type_id != null && !form.parentId)
          }
          onClick={() => onSave(form)}
          sx={buttonSx("primary")}
          startIcon={
            saving ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <SaveOutlinedIcon />
            )
          }
        >
          {t("common.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function NodeTypeDialog({
  open,
  mode,
  nodeType,
  nodeTypes,
  saving,
  onClose,
  onSave,
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState(
    mode === "edit" && nodeType
      ? {
          code: nodeType.code,
          name: nodeType.name,
          parentTypeId: nodeType.parent_type_id ?? "",
          color: nodeType.color || "#005BAB",
          icon: nodeType.icon || "",
          sortOrder: nodeType.sort_order || 0,
          isActive: Boolean(nodeType.is_active),
        }
      : {
          code: "",
          name: "",
          parentTypeId: "",
          color: "#005BAB",
          icon: "",
          sortOrder: 0,
          isActive: true,
        },
  );
  const change = (key) => (event) =>
    setForm((old) => ({ ...old, [key]: event.target.value }));
  const parentOptions = nodeTypes.filter(
    (item) => item.id !== nodeType?.id && Boolean(item.is_active),
  );
  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
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
        icon={<DomainOutlinedIcon />}
        title={
          mode === "edit"
            ? t("factoryStructure.editNodeType")
            : t("factoryStructure.addNodeType")
        }
        disabled={saving}
        onClose={onClose}
      />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Stack spacing={2.25}>
          <Stack spacing={1.25}>
            <FieldGroupLabel>
              {t("factoryStructure.sectionBasicInfo")}
            </FieldGroupLabel>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                fullWidth
                size="small"
                label={t("factoryStructure.typeCode")}
                value={form.code}
                disabled={mode === "edit"}
                onChange={change("code")}
              />
              <TextField
                fullWidth
                size="small"
                label={t("factoryStructure.typeName")}
                value={form.name}
                onChange={change("name")}
              />
            </Stack>
          </Stack>
          <Stack spacing={1.25}>
            <FieldGroupLabel>
              {t("factoryStructure.sectionHierarchy")}
            </FieldGroupLabel>
            <FormControl fullWidth size="small">
              <InputLabel>{t("factoryStructure.parentType")}</InputLabel>
              <Select
                label={t("factoryStructure.parentType")}
                value={form.parentTypeId}
                onChange={change("parentTypeId")}
              >
                <MenuItem value="">
                  <em>{t("factoryStructure.rootType")}</em>
                </MenuItem>
                {parentOptions.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.code} — {item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <Stack spacing={1.25}>
            <FieldGroupLabel>
              {t("factoryStructure.sectionAppearance")}
            </FieldGroupLabel>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                fullWidth
                size="small"
                label={t("factoryStructure.color")}
                type="color"
                value={form.color}
                onChange={change("color")}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                size="small"
                label={t("factoryStructure.iconName")}
                value={form.icon}
                onChange={change("icon")}
                placeholder={t("factoryStructure.optional")}
              />
              <TextField
                fullWidth
                size="small"
                label={t("factoryStructure.sortOrder")}
                type="number"
                value={form.sortOrder}
                onChange={change("sortOrder")}
              />
            </Stack>
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                {t("factoryStructure.activeStatus")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("factoryStructure.activeStatusHelp")}
              </Typography>
            </Box>
            <Switch
              checked={form.isActive}
              onChange={(event) =>
                setForm((old) => ({ ...old, isActive: event.target.checked }))
              }
            />
          </Stack>
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
          fullWidth
          disabled={saving || !form.code.trim() || !form.name.trim()}
          onClick={() => onSave(form)}
          sx={buttonSx("primary")}
          startIcon={
            saving ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <SaveOutlinedIcon />
            )
          }
        >
          {t("common.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function FactoryStructureMaster() {
  const { t, i18n } = useTranslation();
  const { theme: appTheme } = useAppTheme();
  const isDark = appTheme === "dark";
  const muiTheme = useMemo(() => createFactoryTheme(appTheme), [appTheme]);
  const currentUser = getCurrentUser();
  const actor = currentUser?.employee_code || "SYSTEM";
  const { canEdit } = usePagePermission();
  const [activeTab, setActiveTab] = useState(0);
  const [nodes, setNodes] = useState([]);
  const [nodeTypes, setNodeTypes] = useState([]);
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [expanded, setExpanded] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [factoryFilter, setFactoryFilter] = useState("all");
  const [dialog, setDialog] = useState(null);
  const [typeDialog, setTypeDialog] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({
    open: false,
    type: "success",
    text: "",
  });

  const showMessage = useCallback(
    (type, text) => setMessage({ open: true, type, text }),
    [],
  );
  const requestJson = useCallback(
    async (url, options = {}) => {
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
            t("factoryStructure.errors.request", { status: response.status }),
        );
      return payload;
    },
    [t],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [typesData, nodesData] = await Promise.all([
        requestJson(`${API_BASE}/api/factory-structure/node-types`),
        requestJson(`${API_BASE}/api/factory-structure/nodes`),
      ]);
      const nextTypes = Array.isArray(typesData)
        ? typesData
        : typesData?.items || [];
      const nextNodes = (
        Array.isArray(nodesData) ? nodesData : nodesData?.items || []
      ).map(normalizeNode);
      setNodeTypes(nextTypes);
      setNodes(nextNodes);
      setExpanded(nextNodes.map((node) => node.id));
      setSelectedId((current) =>
        nextNodes.some((node) => node.id === current)
          ? current
          : (nextNodes[0]?.id ?? null),
      );
      setSelectedTypeId((current) =>
        nextTypes.some((item) => item.id === current)
          ? current
          : (nextTypes[0]?.id ?? null),
      );
    } catch (error) {
      showMessage("error", error.message || t("factoryStructure.errors.load"));
    } finally {
      setLoading(false);
    }
  }, [requestJson, showMessage, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getParent = useCallback(
    (node) => nodes.find((item) => item.id === node?.parentId),
    [nodes],
  );
  const getFactoryId = useCallback(
    (node) => {
      let current = node;
      while (current && current.type !== "FACTORY")
        current = nodes.find((item) => item.id === current.parentId);
      return current?.id;
    },
    [nodes],
  );
  const selected = nodes.find((item) => item.id === selectedId) || null;
  const selectedType =
    nodeTypes.find((item) => item.id === selectedTypeId) || null;
  const factories = nodes.filter((item) => item.type === "FACTORY");
  const roots = nodes.filter((item) => item.parentId == null);

  const filteredNodes = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    return nodes.filter(
      (node) =>
        (!term || `${node.code} ${node.name}`.toLowerCase().includes(term)) &&
        (typeFilter === "all" || node.type === typeFilter) &&
        (statusFilter === "all" || node.status === statusFilter) &&
        (factoryFilter === "all" ||
          getFactoryId(node) === Number(factoryFilter)),
    );
  }, [factoryFilter, getFactoryId, keyword, nodes, statusFilter, typeFilter]);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(TYPE_META).map((key) => [
          key,
          nodes.filter((node) => node.type === key).length,
        ]),
      ),
    [nodes],
  );

  const columnDefs = useMemo(
    () => [
      {
        headerName: t("factoryStructure.columns.code"),
        field: "code",
        width: 145,
        pinned: "left",
      },
      {
        headerName: t("factoryStructure.columns.name"),
        field: "name",
        minWidth: 175,
        flex: 1.2,
      },
      {
        headerName: t("factoryStructure.columns.type"),
        valueGetter: (params) =>
          t(
            `factoryStructure.types.${String(params.data?.type || "").toLowerCase()}`,
            {
              defaultValue:
                TYPE_META[params.data?.type]?.label || params.data?.type,
            },
          ),
        width: 105,
      },
      {
        headerName: t("factoryStructure.columns.parent"),
        valueGetter: (params) => getParent(params.data)?.code || "—",
        width: 115,
      },
      {
        headerName: t("factoryStructure.columns.level"),
        field: "level_no",
        width: 80,
        cellStyle: { textAlign: "center" },
      },
      {
        headerName: t("factoryStructure.columns.status"),
        field: "status",
        width: 100,
        cellRenderer: (params) => (
          <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}>
            <StatusChip status={params.value} />
          </Box>
        ),
      },
      {
        headerName: t("factoryStructure.columns.description"),
        field: "description",
        minWidth: 150,
        flex: 1,
      },
      {
        headerName: t("factoryStructure.columns.actions"),
        width: 100,
        sortable: false,
        filter: false,
        cellRenderer: (params) => (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            height="100%"
          >
            <Tooltip title={t("common.view")}>
              <IconButton
                size="small"
                onClick={() => setSelectedId(params.data.id)}
              >
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("common.edit")}>
              <span>
                <IconButton
                  size="small"
                  disabled={!canEdit}
                  onClick={() => {
                    setSelectedId(params.data.id);
                    setDialog({ mode: "edit", node: params.data });
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
    [canEdit, getParent, t],
  );

  const saveNode = async (form) => {
    if (!canEdit || saving) return;
    const editingNode = dialog?.mode === "edit" ? dialog.node : null;
    const nodeType = nodeTypes.find(
      (item) => item.id === Number(form.nodeTypeId),
    );
    if (!nodeType)
      return showMessage("error", t("factoryStructure.errors.typeNotFound"));
    const payload = {
      name: form.name.trim(),
      node_type_id: nodeType.id,
      parent_id:
        form.parentId === "" || form.parentId == null
          ? null
          : Number(form.parentId),
      sort_order: Number(form.sort_order || 0),
      description: form.description?.trim() || null,
      status: form.status,
      ...(editingNode
        ? { updated_by: actor }
        : { code: form.code.trim().toUpperCase(), created_by: actor }),
    };
    setSaving(true);
    try {
      const result = await requestJson(
        editingNode
          ? `${API_BASE}/api/factory-structure/nodes/${editingNode.id}`
          : `${API_BASE}/api/factory-structure/nodes`,
        { method: editingNode ? "PUT" : "POST", body: JSON.stringify(payload) },
      );
      setDialog(null);
      await loadData();
      if (!editingNode && result?.id) setSelectedId(result.id);
      showMessage(
        "success",
        result?.message || t("factoryStructure.success.nodeSaved"),
      );
    } catch (error) {
      showMessage(
        "error",
        error.message || t("factoryStructure.errors.saveNode"),
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!selected || !canEdit || saving) return;
    const nodeType = nodeTypes.find((item) => item.code === selected.type);
    if (!nodeType) return;
    setSaving(true);
    try {
      const result = await requestJson(
        `${API_BASE}/api/factory-structure/nodes/${selected.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: selected.name,
            node_type_id: nodeType.id,
            parent_id: selected.parentId,
            sort_order: Number(selected.sort_order || 0),
            description: selected.description || null,
            status: selected.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
            updated_by: actor,
          }),
        },
      );
      await loadData();
      showMessage(
        "success",
        result?.message || t("factoryStructure.success.statusUpdated"),
      );
    } catch (error) {
      showMessage(
        "error",
        error.message || t("factoryStructure.errors.updateStatus"),
      );
    } finally {
      setSaving(false);
    }
  };

  const nodeTypeColumnDefs = useMemo(
    () => [
      {
        headerName: t("factoryStructure.columns.code"),
        field: "code",
        width: 140,
        pinned: "left",
      },
      {
        headerName: t("factoryStructure.columns.name"),
        field: "name",
        minWidth: 180,
        flex: 1.2,
      },
      {
        headerName: t("factoryStructure.parentType"),
        field: "parent_type_name",
        minWidth: 160,
        flex: 1,
        valueFormatter: (params) => params.value || t("factoryStructure.root"),
      },
      {
        headerName: t("factoryStructure.columns.level"),
        field: "level_order",
        width: 85,
        cellStyle: { textAlign: "center" },
      },
      {
        headerName: t("factoryStructure.nodes"),
        field: "node_count",
        width: 85,
        cellStyle: { textAlign: "center" },
      },
      {
        headerName: t("factoryStructure.color"),
        field: "color",
        width: 105,
        cellRenderer: (params) => (
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            height="100%"
          >
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: 0.75,
                bgcolor: params.value || "#005BAB",
                border: "1px solid",
                borderColor: "divider",
              }}
            />
            <Typography variant="caption">{params.value || "—"}</Typography>
          </Stack>
        ),
      },
      {
        headerName: t("factoryStructure.columns.status"),
        field: "is_active",
        width: 100,
        cellRenderer: (params) => (
          <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}>
            <StatusChip status={params.value ? "ACTIVE" : "INACTIVE"} />
          </Box>
        ),
      },
      {
        headerName: t("factoryStructure.columns.actions"),
        width: 110,
        sortable: false,
        filter: false,
        cellRenderer: (params) => (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            height="100%"
          >
            <Tooltip title={t("common.edit")}>
              <span>
                <IconButton
                  size="small"
                  disabled={!canEdit}
                  onClick={() => {
                    setSelectedTypeId(params.data.id);
                    setTypeDialog({ mode: "edit", nodeType: params.data });
                  }}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={t("common.delete")}>
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={!canEdit || Number(params.data.node_count) > 0}
                  onClick={() => setDeleteType(params.data)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [canEdit, t],
  );

  const saveNodeType = async (form) => {
    if (!canEdit || saving) return;
    const editingType =
      typeDialog?.mode === "edit" ? typeDialog.nodeType : null;
    const payload = {
      name: form.name.trim(),
      parent_type_id:
        form.parentTypeId === "" ? null : Number(form.parentTypeId),
      color: form.color || null,
      icon: form.icon?.trim() || null,
      sort_order: Number(form.sortOrder || 0),
      is_active: Boolean(form.isActive),
      ...(editingType ? {} : { code: form.code.trim().toUpperCase() }),
    };
    setSaving(true);
    try {
      const result = await requestJson(
        editingType
          ? `${API_BASE}/api/factory-structure/node-types/${editingType.id}`
          : `${API_BASE}/api/factory-structure/node-types`,
        { method: editingType ? "PUT" : "POST", body: JSON.stringify(payload) },
      );
      setTypeDialog(null);
      await loadData();
      if (!editingType && result?.id) setSelectedTypeId(result.id);
      showMessage(
        "success",
        result?.message || t("factoryStructure.success.typeSaved"),
      );
    } catch (error) {
      showMessage(
        "error",
        error.message || t("factoryStructure.errors.saveType"),
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteNodeType = async () => {
    if (!deleteType || !canEdit || saving) return;
    setSaving(true);
    try {
      const result = await requestJson(
        `${API_BASE}/api/factory-structure/node-types/${deleteType.id}`,
        { method: "DELETE" },
      );
      setDeleteType(null);
      await loadData();
      showMessage(
        "success",
        result?.message || t("factoryStructure.success.typeDeleted"),
      );
    } catch (error) {
      showMessage(
        "error",
        error.message || t("factoryStructure.errors.deleteType"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box sx={pageSx(isDark)}>
        <PageMeta
          title={`${t("factoryStructure.title")} | VCC Plastics`}
          description={t("factoryStructure.descriptionText")}
        />
        <PageBreadcrumb pageTitle={t("factoryStructure.title")} />
        <Stack spacing={3} sx={{ pb: 2.5 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr auto" },
              gap: 1.5,
              alignItems: "end",
            }}
          >
            <Box>
              <Typography variant="h4" fontWeight={700}>
                {t("factoryStructure.title")}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.25 }}
              >
                {t("factoryStructure.descriptionText")}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              disabled={!canEdit}
              onClick={() =>
                activeTab === 0
                  ? setDialog({ mode: "add", node: null })
                  : setTypeDialog({ mode: "add", nodeType: null })
              }
              sx={buttonSx("primary")}
            >
              {activeTab === 0
                ? t("factoryStructure.addNewNode")
                : t("factoryStructure.addNodeType")}
            </Button>
          </Box>

          <Paper
            variant="outlined"
            sx={{ borderRadius: 2, overflow: "hidden" }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              sx={{
                minHeight: 42,
                "& .MuiTab-root": {
                  minHeight: 42,
                  fontWeight: 700,
                  textTransform: "none",
                },
              }}
            >
              <Tab
                label={t("factoryStructure.structureNodes", {
                  count: nodes.length,
                })}
              />
              <Tab
                label={t("factoryStructure.nodeTypes", {
                  count: nodeTypes.length,
                })}
              />
            </Tabs>
          </Paper>

          {activeTab === 0 ? (
            <>
              <KpiCardGroup>
                <KpiCard
                  label={t("factoryStructure.kpi.totalNodes")}
                  value={nodes.length}
                  note={t("factoryStructure.kpi.allLevels")}
                  tone="primary"
                  icon={<AccountTreeOutlinedIcon />}
                />
                <KpiCard
                  label={t("factoryStructure.kpi.factories")}
                  value={counts.FACTORY || 0}
                  note={t("factoryStructure.kpi.acrossCompany")}
                  tone="success"
                  icon={<FactoryOutlinedIcon />}
                />
                <KpiCard
                  label={t("factoryStructure.kpi.workshops")}
                  value={counts.WORKSHOP || 0}
                  note={t("factoryStructure.kpi.acrossFactories")}
                  tone="warning"
                  icon={<PrecisionManufacturingOutlinedIcon />}
                />
                <KpiCard
                  label={t("factoryStructure.kpi.lines")}
                  value={counts.LINE || 0}
                  note={t("factoryStructure.kpi.acrossWorkshops")}
                  tone="accent"
                  icon={<HubOutlinedIcon />}
                />
                <KpiCard
                  label={t("factoryStructure.kpi.stations")}
                  value={counts.STATION || 0}
                  note={t("factoryStructure.kpi.acrossLines")}
                  tone="info"
                  icon={<LanOutlinedIcon />}
                />
                <KpiCard
                  label={t("factoryStructure.kpi.inactiveNodes")}
                  value={
                    nodes.filter((node) => node.status === "INACTIVE").length
                  }
                  note={t("factoryStructure.kpi.accessDisabled")}
                  tone="danger"
                  icon={<DeleteOutlineIcon />}
                />
              </KpiCardGroup>

              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "minmax(240px,1.6fr) repeat(3,minmax(145px,1fr)) auto",
                    },
                    gap: 1,
                  }}
                >
                  <TextField
                    size="small"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder={t("factoryStructure.searchPlaceholder")}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <FormControl size="small">
                    <InputLabel>{t("factoryStructure.nodeType")}</InputLabel>
                    <Select
                      label={t("factoryStructure.nodeType")}
                      value={typeFilter}
                      onChange={(event) => setTypeFilter(event.target.value)}
                    >
                      <MenuItem value="all">
                        {t("factoryStructure.allTypes")}
                      </MenuItem>
                      {Object.entries(TYPE_META).map(([key, meta]) => (
                        <MenuItem key={key} value={key}>
                          {t(`factoryStructure.types.${key.toLowerCase()}`, {
                            defaultValue: meta.label,
                          })}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small">
                    <InputLabel>{t("factoryStructure.status")}</InputLabel>
                    <Select
                      label={t("factoryStructure.status")}
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                    >
                      <MenuItem value="all">
                        {t("factoryStructure.allStatuses")}
                      </MenuItem>
                      <MenuItem value="ACTIVE">
                        {t("factoryStructure.active")}
                      </MenuItem>
                      <MenuItem value="INACTIVE">
                        {t("factoryStructure.inactive")}
                      </MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small">
                    <InputLabel>{t("factoryStructure.factory")}</InputLabel>
                    <Select
                      label={t("factoryStructure.factory")}
                      value={factoryFilter}
                      onChange={(event) => setFactoryFilter(event.target.value)}
                    >
                      <MenuItem value="all">
                        {t("factoryStructure.allFactories")}
                      </MenuItem>
                      {factories.map((factory) => (
                        <MenuItem key={factory.id} value={String(factory.id)}>
                          {factory.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    startIcon={<FilterListIcon />}
                    onClick={() => {
                      setKeyword("");
                      setTypeFilter("all");
                      setStatusFilter("all");
                      setFactoryFilter("all");
                    }}
                    sx={buttonSx("cancel", {
                      minHeight: 40,
                      whiteSpace: "nowrap",
                    })}
                  >
                    {t("factoryStructure.clearFilters")}
                  </Button>
                </Box>
              </Paper>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    xl: "260px minmax(0,1fr) 290px",
                  },
                  gap: 2,
                }}
              >
                <Paper
                  variant="outlined"
                  sx={{
                    ...cardSx,
                    height: CONTENT_HEIGHT,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <SectionHeader
                    icon={<AccountTreeOutlinedIcon fontSize="small" />}
                    title={t("factoryStructure.tree")}
                    action={
                      <Tooltip title={t("factoryStructure.expandAll")}>
                        <IconButton
                          size="small"
                          onClick={() =>
                            setExpanded(nodes.map((node) => node.id))
                          }
                        >
                          <RefreshIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    }
                  />
                  <Box sx={{ p: 0.75, flex: 1, overflowY: "auto" }}>
                    {loading ? (
                      <Box
                        sx={{
                          display: "grid",
                          placeItems: "center",
                          height: "100%",
                        }}
                      >
                        <CircularProgress size={24} />
                      </Box>
                    ) : (
                      roots.map((node) => (
                        <TreeNode
                          key={node.id}
                          node={node}
                          nodes={nodes}
                          selectedId={selectedId}
                          expanded={expanded}
                          onToggle={(id) =>
                            setExpanded((old) =>
                              old.includes(id)
                                ? old.filter((item) => item !== id)
                                : [...old, id],
                            )
                          }
                          onSelect={setSelectedId}
                        />
                      ))
                    )}
                  </Box>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{
                    ...cardSx,
                    height: CONTENT_HEIGHT,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <SectionHeader
                    icon={<FactoryOutlinedIcon fontSize="small" />}
                    title={t("factoryStructure.list")}
                    action={
                      loading ? (
                        <CircularProgress size={16} />
                      ) : (
                        <Chip
                          label={t("factoryStructure.nodeCount", {
                            count: filteredNodes.length,
                          })}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ height: 22 }}
                        />
                      )
                    }
                  />
                  <Box sx={{ p: 0.75, flex: 1, minHeight: 0 }}>
                    <AgGridTable
                      rowData={filteredNodes}
                      columnDefs={columnDefs}
                      loading={loading}
                      pagination
                      paginationPageSize={20}
                      rowSelection="single"
                      onRowClicked={(event) => setSelectedId(event.data.id)}
                      getRowId={(params) => String(params.data.id)}
                      selectedRowId={selectedId}
                      selectedRowKey="id"
                      height="100%"
                    />
                  </Box>
                </Paper>

                <Stack spacing={2} sx={{ height: CONTENT_HEIGHT }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      ...cardSx,
                      flex: 1,
                      minHeight: 0,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <SectionHeader
                      icon={<DomainOutlinedIcon fontSize="small" />}
                      title={t("factoryStructure.nodeDetails")}
                    />
                    <Box sx={{ p: 2, flex: 1, overflowY: "auto" }}>
                      {selected ? (
                        <>
                          <Stack
                            direction="row"
                            spacing={1.25}
                            alignItems="center"
                          >
                            <Box
                              sx={{
                                width: 44,
                                height: 44,
                                borderRadius: "50%",
                                bgcolor: isDark ? "#173A63" : "#EEF4FF",
                                color: "#005BAB",
                                display: "grid",
                                placeItems: "center",
                              }}
                            >
                              {(() => {
                                const Icon =
                                  TYPE_META[selected.type]?.icon ||
                                  DomainOutlinedIcon;
                                return <Icon />;
                              })()}
                            </Box>
                            <Box minWidth={0}>
                              <Typography
                                variant="subtitle1"
                                fontWeight={700}
                                noWrap
                              >
                                {selected.name}
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={0.75}
                                alignItems="center"
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {selected.code}
                                </Typography>
                                <StatusChip status={selected.status} />
                              </Stack>
                            </Box>
                          </Stack>
                          <Divider sx={{ my: 1.75 }} />
                          <Stack spacing={1.3}>
                            {[
                              [
                                t("factoryStructure.type"),
                                t(
                                  `factoryStructure.types.${String(selected.type).toLowerCase()}`,
                                  {
                                    defaultValue:
                                      TYPE_META[selected.type]?.label ||
                                      selected.type,
                                  },
                                ),
                              ],
                              [
                                t("factoryStructure.parent"),
                                getParent(selected)?.name || "—",
                              ],
                              [
                                t("factoryStructure.level"),
                                selected.level_no ?? "—",
                              ],
                              [
                                t("factoryStructure.description"),
                                selected.description || "—",
                              ],
                              [
                                t("factoryStructure.createdBy"),
                                selected.createdBy || "—",
                              ],
                              [
                                t("factoryStructure.createdDate"),
                                formatDateTime(
                                  selected.createdAt,
                                  i18n.resolvedLanguage,
                                ),
                              ],
                              [
                                t("factoryStructure.lastModified"),
                                formatDateTime(
                                  selected.updatedAt,
                                  i18n.resolvedLanguage,
                                ),
                              ],
                            ].map(([label, value]) => (
                              <Box key={label}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {label}
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                  {value}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {t("factoryStructure.selectNodeHelp")}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                  <Paper
                    variant="outlined"
                    sx={{ ...cardSx, overflow: "hidden" }}
                  >
                    <SectionHeader
                      icon={<EditOutlinedIcon fontSize="small" />}
                      title={t("factoryStructure.quickActions")}
                    />
                    <Stack spacing={1} sx={{ p: 1.25 }}>
                      <Button
                        fullWidth
                        size="medium"
                        disabled={!canEdit || !selected}
                        startIcon={<AddIcon />}
                        onClick={() =>
                          setDialog({ mode: "add", node: selected })
                        }
                        sx={buttonSx("primary", {
                          justifyContent: "flex-start",
                        })}
                      >
                        {t("factoryStructure.addChild")}
                      </Button>
                      <Button
                        fullWidth
                        size="medium"
                        disabled={!canEdit || !selected}
                        startIcon={<EditOutlinedIcon />}
                        onClick={() =>
                          setDialog({ mode: "edit", node: selected })
                        }
                        sx={buttonSx("edit", {
                          justifyContent: "flex-start",
                          minHeight: 40,
                        })}
                      >
                        {t("common.edit")}
                      </Button>
                      <Button
                        fullWidth
                        size="medium"
                        disabled={!canEdit || !selected || saving}
                        startIcon={
                          selected?.status === "ACTIVE" ? (
                            <DeleteOutlineIcon />
                          ) : (
                            <AddIcon />
                          )
                        }
                        onClick={toggleStatus}
                        sx={buttonSx(
                          selected?.status === "ACTIVE" ? "delete" : "primary",
                          { justifyContent: "flex-start" },
                        )}
                      >
                        {selected?.status === "ACTIVE"
                          ? t("factoryStructure.deactivate")
                          : t("factoryStructure.activate")}
                      </Button>
                    </Stack>
                  </Paper>
                </Stack>
              </Box>
            </>
          ) : (
            <>
              <KpiCardGroup>
                <KpiCard
                  label={t("factoryStructure.kpi.totalTypes")}
                  value={nodeTypes.length}
                  note={t("factoryStructure.kpi.allConfiguredTypes")}
                  tone="primary"
                  icon={<AccountTreeOutlinedIcon />}
                />
                <KpiCard
                  label={t("factoryStructure.kpi.activeTypes")}
                  value={
                    nodeTypes.filter((item) => Boolean(item.is_active)).length
                  }
                  note={t("factoryStructure.kpi.availableNewNodes")}
                  tone="success"
                  icon={<FactoryOutlinedIcon />}
                />
                <KpiCard
                  label={t("factoryStructure.kpi.inactiveTypes")}
                  value={nodeTypes.filter((item) => !item.is_active).length}
                  note={t("factoryStructure.kpi.notAvailableSelection")}
                  tone="danger"
                  icon={<DeleteOutlineIcon />}
                />
                <KpiCard
                  label={t("factoryStructure.kpi.rootTypes")}
                  value={
                    nodeTypes.filter((item) => item.parent_type_id == null)
                      .length
                  }
                  note={t("factoryStructure.kpi.withoutParent")}
                  tone="accent"
                  icon={<BusinessOutlinedIcon />}
                />
                <KpiCard
                  label={t("factoryStructure.kpi.usedTypes")}
                  value={
                    nodeTypes.filter((item) => Number(item.node_count) > 0)
                      .length
                  }
                  note={t("factoryStructure.kpi.assignedNodes")}
                  tone="warning"
                  icon={<HubOutlinedIcon />}
                />
                <KpiCard
                  label={t("factoryStructure.kpi.unusedTypes")}
                  value={
                    nodeTypes.filter((item) => Number(item.node_count) === 0)
                      .length
                  }
                  note={t("factoryStructure.kpi.safeDelete")}
                  tone="info"
                  icon={<DomainOutlinedIcon />}
                />
              </KpiCardGroup>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    xl: "minmax(0,1.8fr) minmax(300px,0.7fr)",
                  },
                  gap: 2,
                }}
              >
                <Paper
                  variant="outlined"
                  sx={{
                    ...cardSx,
                    height: CONTENT_HEIGHT,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <SectionHeader
                    icon={<AccountTreeOutlinedIcon fontSize="small" />}
                    title={t("factoryStructure.typeList")}
                    action={
                      loading ? (
                        <CircularProgress size={16} />
                      ) : (
                        <Chip
                          label={t("factoryStructure.typeCount", {
                            count: nodeTypes.length,
                          })}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ height: 22 }}
                        />
                      )
                    }
                  />
                  <Box sx={{ p: 0.75, flex: 1, minHeight: 0 }}>
                    <AgGridTable
                      rowData={nodeTypes}
                      columnDefs={nodeTypeColumnDefs}
                      loading={loading}
                      pagination
                      paginationPageSize={20}
                      rowSelection="single"
                      onRowClicked={(event) => setSelectedTypeId(event.data.id)}
                      getRowId={(params) => String(params.data.id)}
                      selectedRowId={selectedTypeId}
                      selectedRowKey="id"
                      height="100%"
                    />
                  </Box>
                </Paper>

                <Stack spacing={2} sx={{ height: CONTENT_HEIGHT }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      ...cardSx,
                      flex: 1,
                      minHeight: 0,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <SectionHeader
                      icon={<DomainOutlinedIcon fontSize="small" />}
                      title={t("factoryStructure.typeDetails")}
                    />
                    <Box sx={{ p: 2, flex: 1, overflowY: "auto" }}>
                      {selectedType ? (
                        <>
                          <Stack
                            direction="row"
                            spacing={1.25}
                            alignItems="center"
                          >
                            <Box
                              sx={{
                                width: 44,
                                height: 44,
                                borderRadius: "50%",
                                bgcolor: isDark ? "#173A63" : "#EEF4FF",
                                color: selectedType.color || "#005BAB",
                                display: "grid",
                                placeItems: "center",
                              }}
                            >
                              <AccountTreeOutlinedIcon />
                            </Box>
                            <Box minWidth={0}>
                              <Typography
                                variant="subtitle1"
                                fontWeight={700}
                                noWrap
                              >
                                {selectedType.name}
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={0.75}
                                alignItems="center"
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {selectedType.code}
                                </Typography>
                                <StatusChip
                                  status={
                                    selectedType.is_active
                                      ? "ACTIVE"
                                      : "INACTIVE"
                                  }
                                />
                              </Stack>
                            </Box>
                          </Stack>
                          <Divider sx={{ my: 1.75 }} />
                          <Stack spacing={1.4}>
                            {[
                              [
                                t("factoryStructure.parentType"),
                                selectedType.parent_type_name ||
                                  t("factoryStructure.root"),
                              ],
                              [
                                t("factoryStructure.level"),
                                selectedType.level_order,
                              ],
                              [
                                t("factoryStructure.sortOrder"),
                                selectedType.sort_order,
                              ],
                              [
                                t("factoryStructure.assignedNodes"),
                                selectedType.node_count || 0,
                              ],
                              [
                                t("factoryStructure.icon"),
                                selectedType.icon || "—",
                              ],
                              [
                                t("factoryStructure.color"),
                                selectedType.color || "—",
                              ],
                            ].map(([label, value]) => (
                              <Box key={label}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {label}
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                  {value}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {t("factoryStructure.selectTypeHelp")}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                  <Paper
                    variant="outlined"
                    sx={{ ...cardSx, overflow: "hidden" }}
                  >
                    <SectionHeader
                      icon={<EditOutlinedIcon fontSize="small" />}
                      title={t("factoryStructure.quickActions")}
                    />
                    <Stack spacing={1} sx={{ p: 1.25 }}>
                      <Button
                        fullWidth
                        size="medium"
                        disabled={!canEdit || !selectedType}
                        startIcon={<EditOutlinedIcon />}
                        onClick={() =>
                          setTypeDialog({
                            mode: "edit",
                            nodeType: selectedType,
                          })
                        }
                        sx={buttonSx("edit", {
                          justifyContent: "flex-start",
                          minHeight: 40,
                        })}
                      >
                        {t("common.edit")}
                      </Button>
                      <Button
                        fullWidth
                        size="medium"
                        disabled={
                          !canEdit ||
                          !selectedType ||
                          Number(selectedType?.node_count) > 0
                        }
                        startIcon={<DeleteOutlineIcon />}
                        onClick={() => setDeleteType(selectedType)}
                        sx={buttonSx("delete", { justifyContent: "flex-start" })}
                      >
                        {t("common.delete")}
                      </Button>
                    </Stack>
                  </Paper>
                </Stack>
              </Box>
            </>
          )}
        </Stack>

        {dialog && (
          <NodeDialog
            key={`${dialog.mode}-${dialog.node?.id || "new"}`}
            open
            mode={dialog.mode}
            node={dialog.node}
            nodes={nodes}
            nodeTypes={nodeTypes}
            saving={saving}
            onClose={() => setDialog(null)}
            onSave={saveNode}
          />
        )}
        {typeDialog && (
          <NodeTypeDialog
            key={`${typeDialog.mode}-${typeDialog.nodeType?.id || "new"}`}
            open
            mode={typeDialog.mode}
            nodeType={typeDialog.nodeType}
            nodeTypes={nodeTypes}
            saving={saving}
            onClose={() => setTypeDialog(null)}
            onSave={saveNodeType}
          />
        )}
        <Dialog
          open={Boolean(deleteType)}
          onClose={saving ? undefined : () => setDeleteType(null)}
          maxWidth="xs"
          fullWidth
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
            icon={<DeleteOutlineIcon />}
            title={t("factoryStructure.deleteNodeType")}
            tone="danger"
            disabled={saving}
            onClose={() => setDeleteType(null)}
          />
          <DialogContent sx={{ px: 3, py: 2.5 }}>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              {t("factoryStructure.deleteConfirmation", {
                name: deleteType?.name,
              })}
            </Alert>
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
              disabled={saving}
              onClick={() => setDeleteType(null)}
              sx={buttonSx("cancel")}
            >
              {t("common.cancel")}
            </Button>
            <Button
              disabled={saving}
              onClick={confirmDeleteNodeType}
              sx={buttonSx("delete")}
              startIcon={
                saving ? <CircularProgress size={16} color="inherit" /> : null
              }
            >
              {t("common.delete")}
            </Button>
          </DialogActions>
        </Dialog>
        <Snackbar
          open={message.open}
          autoHideDuration={5000}
          onClose={() => setMessage((old) => ({ ...old, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            severity={message.type}
            onClose={() => setMessage((old) => ({ ...old, open: false }))}
          >
            {message.text}
          </Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}
