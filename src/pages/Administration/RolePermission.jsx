import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, IconButton, InputAdornment, MenuItem, Paper, Stack, Switch, TextField, ThemeProvider as MuiThemeProvider, Tooltip, Typography, createTheme, } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import FilterIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { API_CONFIG } from "../../config/config";
import { getAccessToken, getCurrentUser } from "../../auth/auth";
import AgGridTable from "../../components/tables/BasicTables/BasicTableOne";
import { buttonSystem } from "../../components/button/ButtonSystem";
import { KpiCard, KpiCardGroup } from "../../components/kpi/KpiCardSystem";
import { useTheme as useAppTheme } from "../../context/ThemeContext";
import usePagePermission from "../../auth/usePagePermission";
import { useTranslation } from "react-i18next";
import { toTranslationSlug } from "../../i18n";
const EMPTY_ROLE_FORM = {
  role_code: "",
  role_name: "",
  description: "",
  is_active: true,
};
const ACTION_ORDER = ["view", "edit"];
const ACTION_LABELS = {
  view: "View",
  edit: "Edit",
};
const MODULE_LABELS = {
  DASHBOARD: "Dashboard",
  PRODUCTION: "Production Management",
  MACHINE_EQUIPMENT: "Machine & Equipment",
  MOLD: "Mold Management",
  MATERIAL: "Material Management",
  QUALITY: "Quality Management",
  MAINTENANCE: "Maintenance Management",
  TRACEABILITY: "Traceability",
  REPORTS: "Reports & Analytics",
  ADMINISTRATION: "Administration",
  SYSTEM_CONFIGURATION: "System Configuration",
};
const MODULE_ORDER = [
  "DASHBOARD",
  "PRODUCTION",
  "MACHINE_EQUIPMENT",
  "MOLD",
  "MATERIAL",
  "QUALITY",
  "MAINTENANCE",
  "TRACEABILITY",
  "REPORTS",
  "ADMINISTRATION",
  "SYSTEM_CONFIGURATION",
];
const API_BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const MAIN_PANEL_HEIGHT = 380;
const PANEL_HEADER_HEIGHT = 30;
const MAIN_TABLE_PANEL_HEIGHT = 490;
const PANEL_FOOTER_HEIGHT = 32;

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

function createRolePermissionMuiTheme(mode) {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#005BAB",
      },
      background: {
        default: isDark ? "#0B1220" : "#F8FAFC",
        paper: isDark ? "#111827" : "#FFFFFF",
      },
      text: {
        primary: isDark ? "#F3F4F6" : "#172033",
        secondary: isDark ? "#A7B0C0" : "#667085",
        disabled: isDark ? "#667085" : "#98A2B3",
      },
      divider: isDark ? "#344054" : "#D0D5DD",
    },
    typography: {
      fontFamily: '"Bai Jamjuree", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial',
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundImage: "none",
          },
        },
      },
    },
  });
}

function rolePermissionPageSx(isDark) {
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

    "& .vcc-ag-grid .ag-root-wrapper": {
      borderColor: "#344054 !important",
      backgroundColor: "#111827 !important",
    },
    "& .vcc-ag-grid .ag-header": {
      background: "#182235 !important",
      borderBottomColor: "#344054 !important",
    },
    "& .vcc-ag-grid .ag-header-cell": {
      borderRightColor: "#344054 !important",
    },
    "& .vcc-ag-grid .ag-header-cell-text": {
      color: "#E5E7EB !important",
    },
    "& .vcc-ag-grid .ag-row": {
      borderBottomColor: "#293548 !important",
    },
    "& .vcc-ag-grid .ag-row-even": {
      backgroundColor: "#111827 !important",
    },
    "& .vcc-ag-grid .ag-row-odd": {
      backgroundColor: "#0F172A !important",
    },
    "& .vcc-ag-grid .ag-row-hover": {
      backgroundColor: "#1B2B45 !important",
    },
    "& .vcc-ag-grid .ag-row-selected": {
      backgroundColor: "#173A63 !important",
    },
    "& .vcc-ag-grid .ag-cell": {
      color: "#D0D5DD !important",
      borderRightColor: "#293548 !important",
    },
    "& .vcc-ag-grid .ag-icon": {
      color: "#98A2B3 !important",
    },
    "& .vcc-ag-grid .ag-header-cell:hover": {
      backgroundColor: "#20304A !important",
    },
    "& .vcc-ag-grid .ag-paging-panel": {
      color: "#D0D5DD !important",
      borderTopColor: "#293548 !important",
      backgroundColor: "#111827 !important",
    },
    "& .vcc-ag-grid .ag-paging-panel .ag-disabled .ag-icon": {
      color: "#667085 !important",
    },
    "& .vcc-ag-grid .ag-body-vertical-scroll-viewport::-webkit-scrollbar-thumb, & .vcc-ag-grid .ag-body-horizontal-scroll-viewport::-webkit-scrollbar-thumb": {
      background: "#475467",
    },
    "& .vcc-ag-grid .ag-overlay-loading-center": {
      color: "#E5E7EB",
      backgroundColor: "#182235",
      borderColor: "#344054",
    },
  };
}

export default function RolePermission() {
  const { t } = useTranslation();
  const { theme: appTheme } = useAppTheme();
  const isDark = appTheme === "dark";
  const muiTheme = useMemo(() => createRolePermissionMuiTheme(appTheme), [appTheme]);
  const currentUser = getCurrentUser();
  const actor = currentUser?.employee_code || "SYSTEM";
  const { canEdit } = usePagePermission();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);
  const [originalPermissionIds, setOriginalPermissionIds] = useState([]);
  const [roleSearch, setRoleSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [accessFilter, setAccessFilter] = useState("ALL");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingRolePermissions, setLoadingRolePermissions] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState(EMPTY_ROLE_FORM);
  useEffect(() => {
    void loadInitialData();
  }, []);
  useEffect(() => {
    if (selectedRoleId === null) {
      setSelectedPermissionIds([]);
      setOriginalPermissionIds([]);
      return;
    }
    void loadRolePermissions(selectedRoleId);
  }, [selectedRoleId]);
  useEffect(() => {
    if (!error && !success)
      return;
    const timer = window.setTimeout(() => {
      setError("");
      setSuccess("");
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [error, success]);
  const selectedRole = useMemo(() => roles.find((role) => role.id === selectedRoleId) || null, [roles, selectedRoleId]);
  const hasPermissionChanges = useMemo(() => !sameNumberSet(selectedPermissionIds, originalPermissionIds), [selectedPermissionIds, originalPermissionIds]);
  const permissionMatrixRows = useMemo(() => buildPermissionMatrixRows(permissions, permissionSearch), [permissions, permissionSearch]);
  const filteredRoles = useMemo(() => {
    const keyword = roleSearch.trim().toLowerCase();
    const totalPermissions = permissions.length;
    return roles.filter((role) => {
      const active = isActive(role.is_active);
      const permissionCount = toNumber(role.permission_count);
      const matchesKeyword = !keyword ||
        role.role_name.toLowerCase().includes(keyword) ||
        role.role_code.toLowerCase().includes(keyword) ||
        (role.description || "").toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && active) ||
        (statusFilter === "INACTIVE" && !active);
      const matchesAccess = accessFilter === "ALL" ||
        (accessFilter === "FULL" &&
          totalPermissions > 0 &&
          permissionCount === totalPermissions) ||
        (accessFilter === "PARTIAL" &&
          permissionCount > 0 &&
          permissionCount < totalPermissions) ||
        (accessFilter === "NONE" && permissionCount === 0);
      return matchesKeyword && matchesStatus && matchesAccess;
    });
  }, [roles, permissions.length, roleSearch, statusFilter, accessFilter]);
  const assignedUsers = useMemo(() => {
    if (!selectedRole)
      return [];
    return users.filter((user) => (user.roles || []).includes(selectedRole.role_code));
  }, [users, selectedRole]);
  const statistics = useMemo(() => {
    const totalRoles = roles.length;
    const totalPermissions = permissions.length;
    const activeRoles = roles.filter((role) => isActive(role.is_active)).length;
    const inactiveRoles = totalRoles - activeRoles;
    const assignedUserCount = users.filter((user) => (user.roles || []).length > 0).length;

    // With the current API, "Highly Privileged" is defined as an ACTIVE role
    // that owns at least 80% of all system permissions.
    const highlyPrivilegedRoles = roles.filter((role) => {
      if (!isActive(role.is_active) || totalPermissions <= 0)
        return false;
      return toNumber(role.permission_count) / totalPermissions >= 0.8;
    }).length;

    const activeRolePercent = totalRoles > 0
      ? ((activeRoles / totalRoles) * 100).toFixed(1)
      : "0.0";

    const permissionResourceCount = buildPermissionMatrixRows(permissions, "").length;

    const now = new Date();
    const newRolesThisMonth = roles.filter((role) => {
      if (!role?.created_at)
        return false;
      const createdAt = new Date(role.created_at);
      return !Number.isNaN(createdAt.getTime()) &&
        createdAt.getFullYear() === now.getFullYear() &&
        createdAt.getMonth() === now.getMonth();
    }).length;

    return {
      totalRoles,
      activeRoles,
      totalPermissions,
      assignedUserCount,
      highlyPrivilegedRoles,
      inactiveRoles,
      activeRolePercent,
      permissionResourceCount,
      newRolesThisMonth,
    };
  }, [roles, permissions, users]);
  async function requestJson(path, options) {
    const token = getAccessToken();
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers || {}),
      },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message = payload?.detail ||
        payload?.message ||
        t("rolePermission.errors.request", { status: response.status });
      throw new Error(message);
    }
    return payload;
  }
  async function loadInitialData() {
    try {
      setLoading(true);
      setError("");
      const [roleData, permissionData, userData] = await Promise.all([
        requestJson("/api/roles"),
        requestJson("/api/permissions"),
        requestJson("/api/users"),
      ]);
      setRoles(roleData);
      setPermissions(permissionData);
      setUsers(userData);
      setSelectedRoleId((current) => {
        if (current !== null &&
          roleData.some((role) => role.id === current)) {
          return current;
        }
        return (roleData.find((role) => isActive(role.is_active))?.id ??
          roleData[0]?.id ??
          null);
      });
    }
    catch (err) {
      setError(errorMessage(err, t("rolePermission.errors.load")));
    }
    finally {
      setLoading(false);
    }
  }
  async function loadRolePermissions(roleId) {
    try {
      setLoadingRolePermissions(true);
      setError("");
      const rolePermissions = await requestJson(`/api/roles/${roleId}/permissions`);
      const ids = rolePermissions.map((permission) => permission.id);
      setSelectedPermissionIds(ids);
      setOriginalPermissionIds(ids);
    }
    catch (err) {
      setSelectedPermissionIds([]);
      setOriginalPermissionIds([]);
      setError(errorMessage(err, t("rolePermission.errors.loadPermissions")));
    }
    finally {
      setLoadingRolePermissions(false);
    }
  }
  function selectRole(roleId) {
    if (roleId === selectedRoleId)
      return;
    if (hasPermissionChanges &&
      !window.confirm(t("rolePermission.confirmDiscard"))) {
      return;
    }
    setSelectedRoleId(roleId);
  }
  function openCreateRole() {
    if (!canEdit) return;
    setEditingRole(null);
    setRoleForm(EMPTY_ROLE_FORM);
    setRoleModalOpen(true);
  }
  function openEditRole(role) {
    if (!canEdit) return;
    setEditingRole(role);
    setRoleForm({
      role_code: role.role_code,
      role_name: role.role_name,
      description: role.description || "",
      is_active: isActive(role.is_active),
    });
    setRoleModalOpen(true);
  }
  function closeRoleModal() {
    if (savingRole)
      return;
    setRoleModalOpen(false);
    setEditingRole(null);
    setRoleForm(EMPTY_ROLE_FORM);
  }
  async function saveRole() {
    if (!canEdit) return;
    const roleCode = roleForm.role_code
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_");
    const roleName = roleForm.role_name.trim();
    if (!roleCode) {
      setError(t("rolePermission.errors.roleCodeRequired"));
      return;
    }
    if (!roleName) {
      setError(t("rolePermission.errors.roleNameRequired"));
      return;
    }
    try {
      setSavingRole(true);
      setError("");
      if (editingRole) {
        await requestJson(`/api/roles/${editingRole.id}`, {
          method: "PUT",
          body: JSON.stringify({
            role_name: roleName,
            description: roleForm.description.trim() || null,
            is_active: roleForm.is_active,
            updated_by: actor,
          }),
        });
        setSuccess(t("rolePermission.success.updated"));
      }
      else {
        const result = await requestJson("/api/roles", {
          method: "POST",
          body: JSON.stringify({
            role_code: roleCode,
            role_name: roleName,
            description: roleForm.description.trim() || null,
            is_active: roleForm.is_active,
            created_by: actor,
          }),
        });
        setSelectedRoleId(result.id);
        setSuccess(t("rolePermission.success.created"));
      }
      closeRoleModal();
      await reloadRolesAndUsers();
    }
    catch (err) {
      setError(errorMessage(err, t("rolePermission.errors.saveRole")));
    }
    finally {
      setSavingRole(false);
    }
  }
  async function deactivateRole(role) {
    if (!canEdit) return;
    const confirmed = window.confirm(t("rolePermission.confirmDeactivate", { name: role.role_name }));
    if (!confirmed)
      return;
    try {
      setError("");
      await requestJson(`/api/roles/${role.id}`, { method: "DELETE" });
      setSuccess(t("rolePermission.success.deactivated"));
      await reloadRolesAndUsers();
    }
    catch (err) {
      setError(errorMessage(err, t("rolePermission.errors.deactivate")));
    }
  }
  async function reactivateRole(role) {
    if (!canEdit) return;
    try {
      setError("");
      await requestJson(`/api/roles/${role.id}`, {
        method: "PUT",
        body: JSON.stringify({
          role_name: role.role_name,
          description: role.description || null,
          is_active: true,
          updated_by: actor,
        }),
      });
      setSuccess(t("rolePermission.success.reactivated"));
      await reloadRolesAndUsers();
    }
    catch (err) {
      setError(errorMessage(err, t("rolePermission.errors.reactivate")));
    }
  }
  async function reloadRolesAndUsers() {
    const [roleData, userData] = await Promise.all([
      requestJson("/api/roles"),
      requestJson("/api/users"),
    ]);
    setRoles(roleData);
    setUsers(userData);
    setSelectedRoleId((current) => {
      if (current !== null &&
        roleData.some((role) => role.id === current)) {
        return current;
      }
      return (roleData.find((role) => isActive(role.is_active))?.id ??
        roleData[0]?.id ??
        null);
    });
  }
  function togglePermission(permissionId) {
    if (!canEdit) return;
    setSelectedPermissionIds((current) => current.includes(permissionId)
      ? current.filter((id) => id !== permissionId)
      : [...current, permissionId]);
  }
  async function savePermissions() {
    if (!canEdit || !selectedRole)
      return;
    if (!isActive(selectedRole.is_active)) {
      setError(t("rolePermission.errors.inactivePermissions"));
      return;
    }
    try {
      setSavingPermissions(true);
      setError("");
      await requestJson(`/api/roles/${selectedRole.id}/permissions`, {
        method: "PUT",
        body: JSON.stringify({
          permission_ids: selectedPermissionIds,
          updated_by: actor,
        }),
      });
      setOriginalPermissionIds(selectedPermissionIds);
      setSuccess(t("rolePermission.success.permissionsSaved", { name: selectedRole.role_name }));
      await reloadRolesAndUsers();
    }
    catch (err) {
      setError(errorMessage(err, t("rolePermission.errors.savePermissions")));
    }
    finally {
      setSavingPermissions(false);
    }
  }
  function exportRoles() {
    const header = [
      t("rolePermission.roleCode"),
      t("rolePermission.roleName"),
      t("rolePermission.status"),
      t("rolePermission.users"),
      t("rolePermission.permissions"),
      t("rolePermission.roleDescription"),
    ];
    const rows = roles.map((role) => [
      role.role_code,
      role.role_name,
      isActive(role.is_active) ? t("rolePermission.active") : t("rolePermission.inactive"),
      String(toNumber(role.user_count)),
      String(toNumber(role.permission_count)),
      role.description || "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vcc-plastics-roles-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box sx={rolePermissionPageSx(isDark)}>
    <PageMeta title={`${t("rolePermission.title")} | VCC Plastics`} description={t("rolePermission.description")} />

    <PageBreadcrumb pageTitle="Role & Permission" />

    <Stack spacing={3} sx={{ pb: 2.5 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 1.5,
          alignItems: "end",
          width: "100%",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" fontWeight={700}>
            {t("rolePermission.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {t("rolePermission.description")}
          </Typography>
        </Box>


      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      <KpiCardGroup>
        <KpiCard
          label={t("rolePermission.kpi.totalRoles")}
          value={statistics.totalRoles}
          note={t("rolePermission.kpi.newThisMonth", { count: statistics.newRolesThisMonth })}
          tone="primary"
          icon={<BadgeOutlinedIcon />}
        />
        <KpiCard
          label={t("rolePermission.kpi.activeRoles")}
          value={statistics.activeRoles}
          note={t("rolePermission.kpi.percentOfTotal", { percent: statistics.activeRolePercent })}
          tone="success"
          icon={<ShieldOutlinedIcon />}
        />
        <KpiCard
          label={t("rolePermission.kpi.totalPermissions")}
          value={statistics.totalPermissions}
          note={t("rolePermission.kpi.acrossMenus", { count: statistics.permissionResourceCount })}
          tone="warning"
          icon={<VpnKeyOutlinedIcon />}
        />
        <KpiCard
          label={t("rolePermission.kpi.usersAssigned")}
          value={statistics.assignedUserCount}
          note={t("rolePermission.kpi.acrossRoles")}
          tone="accent"
          icon={<GroupOutlinedIcon />}
        />
        <KpiCard
          label={t("rolePermission.kpi.highlyPrivileged")}
          value={statistics.highlyPrivilegedRoles}
          note={t("rolePermission.kpi.requireAttention")}
          tone="info"
          icon={<LockOutlinedIcon />}
        />
        <KpiCard
          label={t("rolePermission.kpi.inactiveRoles")}
          value={statistics.inactiveRoles}
          note={t("rolePermission.kpi.deactivatedRoles")}
          tone="danger"
          icon={<LockOutlinedIcon />}
        />
      </KpiCardGroup>

      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
        <Box sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(260px,1.7fr) minmax(160px,.8fr) minmax(180px,.9fr) auto",
          },
          gap: 1,
          alignItems: "center",
        }}>
          <TextField size="small" fullWidth value={roleSearch} onChange={(event) => setRoleSearch(event.target.value)} placeholder={t("rolePermission.searchPlaceholder")} InputProps={{
            startAdornment: (<InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>),
          }} />

          <TextField select size="small" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <MenuItem value="ALL">{t("rolePermission.allStatuses")}</MenuItem>
            <MenuItem value="ACTIVE">{t("rolePermission.active")}</MenuItem>
            <MenuItem value="INACTIVE">{t("rolePermission.inactive")}</MenuItem>
          </TextField>

          <TextField select size="small" value={accessFilter} onChange={(event) => setAccessFilter(event.target.value)}>
            <MenuItem value="ALL">{t("rolePermission.allAccessLevels")}</MenuItem>
            <MenuItem value="FULL">{t("rolePermission.fullAccess")}</MenuItem>
            <MenuItem value="PARTIAL">{t("rolePermission.partialAccess")}</MenuItem>
            <MenuItem value="NONE">{t("rolePermission.noAccess")}</MenuItem>
          </TextField>

          <Button variant="outlined" size="small" startIcon={<FilterIcon />} onClick={() => {
            setRoleSearch("");
            setStatusFilter("ALL");
            setAccessFilter("ALL");
          }} sx={buttonSx("cancel", {
            minHeight: 40,
            whiteSpace: "nowrap",
          })}>
            {t("rolePermission.clearFilters")}
          </Button>
        </Box>
      </Paper>

      <Box sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(2, minmax(0, 1fr))",
          xl: "repeat(3, minmax(0, 1fr))",
        },
        gap: 2,
        alignItems: "stretch",
      }}>
        <RoleListPanel
          canEdit={canEdit}
          loading={loading}
          roles={filteredRoles}
          selectedRoleId={selectedRoleId}
          onSelect={selectRole}
          onEdit={openEditRole}
          onDeactivate={(role) => void deactivateRole(role)}
          onReactivate={(role) => void reactivateRole(role)}
          onCreate={openCreateRole}
        />

        <PermissionMatrixPanel
          canEdit={canEdit}
          selectedRole={selectedRole}
          rows={permissionMatrixRows}
          selectedPermissionIds={selectedPermissionIds}
          loading={loading || loadingRolePermissions}
          saving={savingPermissions}
          dirty={hasPermissionChanges}
          permissionSearch={permissionSearch}
          onPermissionSearchChange={setPermissionSearch}
          onTogglePermission={togglePermission}
          onSave={() => void savePermissions()}
        />

        <RoleDetailPanel
          canEdit={canEdit}
          role={selectedRole}
          assignedUsers={assignedUsers}
          loading={loading}
          selectedPermissionCount={selectedPermissionIds.length}
          totalPermissionCount={permissions.length}
          onEdit={openEditRole}
        />
      </Box>

    </Stack>

    <RoleModal canEdit={canEdit} open={roleModalOpen} editingRole={editingRole} form={roleForm} saving={savingRole} onChange={setRoleForm} onClose={closeRoleModal} onSave={() => void saveRole()} />
      </Box>
    </MuiThemeProvider>
  );
}
function SectionHeader({ icon, title, action = null }) {
  return (
    <Box
      sx={{
        height: PANEL_HEADER_HEIGHT,
        minHeight: PANEL_HEADER_HEIGHT,
        px: 1.25,
        bgcolor: (theme) => theme.palette.mode === "dark" ? "#182235" : "#DDEBFF",
        borderBottom: 1,
        borderColor: (theme) => theme.palette.mode === "dark" ? "#344054" : "#AFC7EE",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        sx={{
          height: "100%",
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 0,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>

        <Typography
          variant="subtitle2"
          noWrap
          sx={{
            color: "text.primary",
            fontWeight: 700,
            WebkitTextStroke: "0.22px currentColor",
            lineHeight: `${PANEL_HEADER_HEIGHT}px`,
          }}
        >
          {title}
        </Typography>

        {action ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {action}
          </Box>
        ) : null}
      </Stack>
    </Box>
  );
}

function RoleListPanel({ canEdit, loading, roles, selectedRoleId, onSelect, onEdit, onDeactivate, onReactivate, onCreate, }) {
  const { t } = useTranslation();
  const columnDefs = useMemo(() => [
    {
      headerName: "",
      width: 50,
      minWidth: 50,
      maxWidth: 50,
      sortable: false,
      filter: false,
      valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
      cellClass: "ag-cell-center",
    },
    {
      headerName: t("rolePermission.role"),
      field: "role_name",
      minWidth: 155,
      flex: 1,
      cellRenderer: (params) => {
        const role = params.data;
        if (!role)
          return null;
        const selected = role.id === selectedRoleId;
        const active = isActive(role.is_active);
        return (<Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%", minWidth: 0 }}>
          <Box sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            flexShrink: 0,
            bgcolor: selected
              ? "primary.main"
              : active
                ? "success.main"
                : "grey.400",
          }} />

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              noWrap
              sx={{
                display: "block",
                fontWeight: 700,
                color: selected ? "primary.main" : "text.primary",
                lineHeight: 1.2,
              }}
            >
              {role.role_name}
            </Typography>
          </Box>
        </Stack>);
      },
    },
    {
      headerName: t("rolePermission.users"),
      field: "user_count",
      width: 64,
      minWidth: 64,
      maxWidth: 64,
      filter: false,
      cellClass: "ag-cell-center",
      valueGetter: (params) => toNumber(params.data?.user_count),
    },
  ], [selectedRoleId, onEdit, onDeactivate, onReactivate, t]);
  return (<Paper variant="outlined" sx={{ position: "relative", borderRadius: 2, overflow: "hidden", height: MAIN_TABLE_PANEL_HEIGHT, minHeight: MAIN_TABLE_PANEL_HEIGHT, maxHeight: MAIN_TABLE_PANEL_HEIGHT, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
    <SectionHeader
      icon={<BadgeOutlinedIcon sx={{ color: "text.primary" }} fontSize="small" />}
      title={t("rolePermission.roles")}
    />

    <Box sx={{ p: 0.75, pb: 6, flex: 1, minHeight: 0 }}>
      <AgGridTable
        className="role-list-grid"
        rowData={roles}
        columnDefs={columnDefs}
        height="100%"
        loading={loading}
        rowSelection={false}
        pagination
        paginationPageSize={6}
        getRowId={(params) => String(params.data.id)}
        selectedRowId={selectedRoleId}
        selectedRowKey="id"
        selectedRowClassName="vcc-role-row-selected"
        onRowClicked={(event) => {
          if (event.data)
            onSelect(event.data.id);
        }}
      />
    </Box>

    <Button
      variant="contained"
      size="small"
      startIcon={<AddIcon />}
      onClick={onCreate}
      disabled={!canEdit}
      sx={buttonSx("primary", {
        position: "absolute",
        right: 12,
        bottom: 10,
        zIndex: 2,
        height: PANEL_FOOTER_HEIGHT,
        minHeight: PANEL_FOOTER_HEIGHT,
        maxHeight: PANEL_FOOTER_HEIGHT,
        py: 0,
        px: 1.75,
        borderRadius: 1,
        whiteSpace: "nowrap",
        "& .MuiButton-startIcon": {
          display: "flex",
          alignItems: "center",
        },
      })}
    >
      {t("rolePermission.createRole")}
    </Button>
  </Paper>);
}
function PermissionMatrixPanel({ canEdit, selectedRole, rows, selectedPermissionIds, loading, saving, dirty, permissionSearch, onPermissionSearchChange, onTogglePermission, onSave, }) {
  const { t } = useTranslation();
  const selectedPermissionSet = useMemo(() => new Set(selectedPermissionIds), [selectedPermissionIds]);
  const columnDefs = useMemo(() => [
    {
      headerName: t("rolePermission.module"),
      width: 210,
      minWidth: 190,
      flex: 1,
      headerClass: "ag-header-center",
      cellClass: "ag-cell-left",
      valueGetter: (params) => params.data ? t(`navigation.${toTranslationSlug(moduleLabel(params.data.moduleCode))}`, { defaultValue: moduleLabel(params.data.moduleCode) }) : "",
      cellRenderer: (params) => params.data ? (<Typography variant="caption" fontWeight={700} noWrap>
        {t(`navigation.${toTranslationSlug(moduleLabel(params.data.moduleCode))}`, { defaultValue: moduleLabel(params.data.moduleCode) })}
      </Typography>) : null,
    },
    ...ACTION_ORDER.map((action) => ({
      headerName: t(`rolePermission.actions.${action}`),
      width: 92,
      minWidth: 92,
      maxWidth: 92,
      headerClass: "ag-header-center",
      sortable: false,
      filter: false,
      resizable: false,
      cellClass: "ag-cell-center",
      cellStyle: { display: "flex", alignItems: "center", justifyContent: "center" },
      cellRenderer: (params) => {
        const row = params.data;
        if (!row)
          return null;
        const permission = row.permissionsByAction[action];
        if (!permission) {
          return (<Typography variant="caption" color="text.disabled">
            -
          </Typography>);
        }
        return (<MatrixToggle checked={selectedPermissionSet.has(permission.id)} disabled={!canEdit || !selectedRole || !isActive(selectedRole.is_active)} title={`${permission.permission_name} (${permission.permission_code})`} onClick={() => onTogglePermission(permission.id)} />);
      },
    })),
  ], [canEdit, selectedPermissionSet, selectedRole, onTogglePermission, t]);
  return (<Paper variant="outlined" sx={{ position: "relative", borderRadius: 2, overflow: "hidden", height: MAIN_TABLE_PANEL_HEIGHT, minHeight: MAIN_TABLE_PANEL_HEIGHT, maxHeight: MAIN_TABLE_PANEL_HEIGHT, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
    <SectionHeader
      icon={<ShieldOutlinedIcon sx={{ color: "text.primary" }} fontSize="small" />}
      title={t("rolePermission.permissionMatrix")}
    />

    {!selectedRole ? (<Stack alignItems="center" justifyContent="center" spacing={1} sx={{ flex: 1, px: 2 }}>
      <Typography variant="subtitle2">{t("rolePermission.noRoleSelected")}</Typography>
      <Typography variant="caption" color="text.secondary" textAlign="center">
        {t("rolePermission.selectRoleHelp")}
      </Typography>
    </Stack>) : (<>
      <Box sx={{ p: 0.75, pb: 6, flex: 1, minHeight: 0 }}>
        <AgGridTable rowData={rows} columnDefs={columnDefs} height="100%" loading={loading} pagination={false} getRowId={(params) => params.data.key} />
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="flex-end"
        spacing={1}
        sx={{
          position: "absolute",
          right: 12,
          bottom: 10,
          zIndex: 2,
          height: PANEL_FOOTER_HEIGHT,
          flexWrap: "nowrap",
          whiteSpace: "nowrap",
        }}
      >
        {dirty ? (
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{
              height: PANEL_FOOTER_HEIGHT,
              display: "flex",
              alignItems: "center",
              lineHeight: `${PANEL_FOOTER_HEIGHT}px`,
              flexShrink: 0,
            }}
          >
            {t("rolePermission.unsavedChanges")}
          </Typography>
        ) : null}

        <Button
          variant="contained"
          size="small"
          startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <SaveIcon />}
          onClick={onSave}
          disabled={!selectedRole ||
            !canEdit ||
            !dirty ||
            saving ||
            !isActive(selectedRole.is_active)}
          sx={buttonSx("primary", {
            minWidth: 110,
            height: PANEL_FOOTER_HEIGHT,
            minHeight: PANEL_FOOTER_HEIGHT,
            maxHeight: PANEL_FOOTER_HEIGHT,
            py: 0,
            borderRadius: 1,
            flexShrink: 0,
            "& .MuiButton-startIcon": {
              display: "flex",
              alignItems: "center",
            },
          })}
        >
          {saving ? t("common.saving") : t("rolePermission.savePermissions")}
        </Button>
      </Stack>
    </>)}
  </Paper>);
}
function MatrixToggle({ checked, disabled, title, onClick }) {
  return (<Tooltip title={title} arrow>
    <Box component="span">
      <Checkbox size="small" checked={checked} disabled={disabled} onClick={(event) => event.stopPropagation()} onChange={() => onClick()} sx={{ p: 0.25 }} />
    </Box>
  </Tooltip>);
}
function RoleDetailPanel({
  canEdit,
  role,
  assignedUsers,
  loading,
  selectedPermissionCount,
  totalPermissionCount,
  onEdit,
}) {
  const { t } = useTranslation();
  const userColumnDefs = useMemo(() => [
    {
      headerName: "",
      width: 42,
      minWidth: 42,
      maxWidth: 42,
      sortable: false,
      filter: false,
      valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
      cellClass: "ag-cell-center",
    },
    {
      headerName: t("rolePermission.userCode"),
      field: "employee_code",
      minWidth: 95,
      flex: 1,
      cellRenderer: (params) => (
        <Typography variant="caption" fontWeight={600} noWrap>
          {params.data?.employee_code || "-"}
        </Typography>
      ),
    },
    {
      headerName: t("rolePermission.userName"),
      minWidth: 110,
      flex: 1.2,
      valueGetter: (params) => getEmployeeDisplayName(params.data),
      cellRenderer: (params) => (
        <Typography variant="caption" fontWeight={600} noWrap>
          {params.value || "-"}
        </Typography>
      ),
    },
    {
      headerName: t("rolePermission.status"),
      width: 68,
      minWidth: 68,
      maxWidth: 68,
      sortable: false,
      filter: false,
      cellClass: "ag-cell-center",
      cellRenderer: (params) =>
        params.data ? <StatusBadge active={isActive(params.data.is_active)} compact /> : null,
    },
  ], [t]);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        height: MAIN_TABLE_PANEL_HEIGHT,
        minHeight: MAIN_TABLE_PANEL_HEIGHT,
        maxHeight: MAIN_TABLE_PANEL_HEIGHT,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <SectionHeader
        icon={<AssignmentIndOutlinedIcon sx={{ color: "text.primary" }} fontSize="small" />}
        title={t("rolePermission.roleDetails")}
        action={
          role ? (
            <Tooltip title={t("rolePermission.editRole")}>
              <IconButton
                size="small"
                onClick={() => onEdit(role)}
                disabled={!canEdit}
                sx={buttonSx("edit", {
                  width: 30,
                  minWidth: 30,
                  height: 28,
                  p: 0.25,
                })}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null
        }
      />

      {!role ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ flex: 1, px: 2 }}
        >
          <Typography variant="body2" color="text.secondary">
            {t("rolePermission.selectRoleDetails")}
          </Typography>
        </Stack>
      ) : (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "grid",
            gridTemplateRows: "auto 1fr",
          }}
        >
          {/* Top section: Role information + permission statistics */}
          <Box
            sx={{
              minHeight: 0,
              borderBottom: 1,
              borderColor: "divider",
              px: 2,
              py: 1.5,
            }}
          >
            <Stack spacing={1.1}>
              <DetailRow label={t("rolePermission.roleName")} value={role.role_name} strong />
              <DetailRow label={t("rolePermission.roleCode")} value={role.role_code} />
              <DetailRow
                label={t("rolePermission.status")}
                value={isActive(role.is_active) ? t("rolePermission.active") : t("rolePermission.inactive")}
                strong
              />
              <DetailRow label={t("rolePermission.roleDescription")} value={role.description || "-"} />
              <DetailRow label={t("rolePermission.users")} value={String(toNumber(role.user_count))} strong />
            </Stack>

            <Stack
              direction="row"
              alignItems="center"
              spacing={2}
              sx={{
                mt: 1.5,
                pt: 1.25,
                borderTop: 1,
                borderColor: "divider",
                flexWrap: "wrap",
                rowGap: 0.75,
              }}
            >
              <Typography variant="caption" color="text.secondary" noWrap>
                {t("rolePermission.assigned")}: {" "}
                <Typography component="span" variant="caption" fontWeight={700} color="text.primary">
                  {selectedPermissionCount}
                </Typography>
              </Typography>

              <Typography variant="caption" color="text.secondary" noWrap>
                {t("rolePermission.unassigned")}: {" "}
                <Typography component="span" variant="caption" fontWeight={700} color="text.primary">
                  {Math.max(totalPermissionCount - selectedPermissionCount, 0)}
                </Typography>
              </Typography>

              <Typography variant="caption" color="text.secondary" noWrap>
                {t("rolePermission.total")}: {" "}
                <Typography component="span" variant="caption" fontWeight={700} color="text.primary">
                  {totalPermissionCount}
                </Typography>
                {" "}{t("rolePermission.permissions")}
              </Typography>
            </Stack>
          </Box>

          {/* Bottom section: Assigned users */}
          <Box
            sx={{
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              px: 1.25,
              pt: 1.25,
              pb: 1.25,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{
                px: 0.5,
                pb: 1,
                flexShrink: 0,
              }}
            >
              <GroupOutlinedIcon sx={{ color: "text.secondary" }} fontSize="small" />
              <Typography variant="caption" fontWeight={700} color="text.primary">
                {t("rolePermission.assignedUsers", { count: assignedUsers.length })}
              </Typography>
            </Stack>

            <Box sx={{ flex: 1, minHeight: 0 }}>
              <AgGridTable
                rowData={assignedUsers}
                columnDefs={userColumnDefs}
                height="100%"
                loading={loading}
                pagination={false}
                getRowId={(params) => String(params.data.id)}
              />
            </Box>
          </Box>
        </Box>
      )}
    </Paper>
  );
}

function DetailRow({ label, value, strong, custom }) {
  return (<Box sx={{
    display: "grid",
    gridTemplateColumns: "82px minmax(0,1fr)",
    gap: 1,
    alignItems: "start",
  }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    {custom || (<Typography variant="caption" sx={{
      color: "text.primary",
      fontWeight: strong ? 700 : 500,
      wordBreak: "break-word",
    }}>
      {value || "-"}
    </Typography>)}
  </Box>);
}

function getEmployeeDisplayName(user) {
  if (!user)
    return "-";

  return (
    user.full_name ||
    user.employee_name ||
    user.user_name ||
    user.username ||
    user.name ||
    user.fullName ||
    user.employee?.full_name ||
    user.employee?.employee_name ||
    user.employee?.name ||
    "-"
  );
}

function StatusBadge({ active, compact = false, }) {
  const { t } = useTranslation();
  return (<Chip size="small" label={active ? t("rolePermission.active") : t("rolePermission.inactive")} color={active ? "success" : "error"} variant="outlined" sx={{
    height: compact ? 20 : 22,
    "& .MuiChip-label": { px: compact ? 0.75 : 1 },
  }} />);
}
function RoleModal({ canEdit, open, editingRole, form, saving, onChange, onClose, onSave, }) {
  const { t } = useTranslation();
  return (<Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" PaperProps={{
    sx: {
      borderRadius: 2.5,
      overflow: "hidden",
      boxShadow: (theme) => theme.palette.mode === "dark"
        ? "0 18px 48px rgba(0,0,0,.48)"
        : "0 18px 48px rgba(15,23,42,.18)",
    },
  }}>
    <DialogTitle
      sx={{
        position: "relative",
        pb: 1.25,
        pl: 2.5,
        pr: 7,
        pt: 2,
        bgcolor: (theme) => theme.palette.mode === "dark" ? "#182235" : "#EEF4FF",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Stack direction="row" alignItems="flex-start" spacing={2}>
        <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              bgcolor: "primary.main",
              color: "common.white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 8px 20px rgba(0,91,171,.22)",
            }}
          >
            <ShieldOutlinedIcon fontSize="small" />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.15 }}>
              {editingRole ? t("rolePermission.updateRole") : t("rolePermission.createNewRole")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
              {t("rolePermission.modalHelp")}
            </Typography>
          </Box>
        </Stack>

        <Tooltip title={t("rolePermission.close")} arrow>
          <span
            style={{
              position: "absolute",
              top: 10,
              right: 10,
            }}
          >
            <IconButton
              size="small"
              onClick={onClose}
              disabled={saving}
              sx={{
                width: 34,
                height: 34,
                border: 1,
                borderColor: "divider",
                bgcolor: "background.paper",
                color: "text.secondary",
                boxShadow: (theme) => theme.palette.mode === "dark"
                  ? "0 4px 12px rgba(0,0,0,.28)"
                  : "0 4px 12px rgba(15,23,42,.08)",
                "&:hover": {
                  bgcolor: (theme) => theme.palette.mode === "dark" ? "#1F2A3D" : "#E6EEF9",
                  color: "text.primary",
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </DialogTitle>

    <DialogContent sx={{ pt: 2 }}>
      <Stack spacing={2} sx={{ pt: 1 }}>
        <TextField fullWidth required size="small" label={t("rolePermission.roleCode")} value={form.role_code} disabled={!canEdit || Boolean(editingRole)} onChange={(event) => onChange({ ...form, role_code: event.target.value })} placeholder={t("rolePermission.roleCodePlaceholder")} helperText={editingRole ? t("rolePermission.roleCodeHelp") : undefined} />

        <TextField fullWidth required size="small" label={t("rolePermission.roleName")} value={form.role_name} disabled={!canEdit} onChange={(event) => onChange({ ...form, role_name: event.target.value })} placeholder={t("rolePermission.roleNamePlaceholder")} />

        <TextField fullWidth multiline minRows={3} label={t("rolePermission.roleDescription")} value={form.description} disabled={!canEdit} onChange={(event) => onChange({ ...form, description: event.target.value })} placeholder={t("rolePermission.descriptionPlaceholder")} />

        <FormControlLabel control={<Switch disabled={!canEdit} checked={form.is_active} onChange={(event) => onChange({ ...form, is_active: event.target.checked })} />} label={<Box>
          <Typography variant="body2" fontWeight={600}>
            {t("rolePermission.activateRole")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t("rolePermission.activateHelp")}
          </Typography>
        </Box>} />
      </Stack>
    </DialogContent>

    <DialogActions sx={{ px: 3, pb: 2.5 }}>
      <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />} onClick={onSave} disabled={!canEdit || saving} sx={buttonSx("primary")}>
        {saving ? t("common.saving") : t("rolePermission.saveRole")}
      </Button>
    </DialogActions>
  </Dialog>);
}
function buildPermissionMatrixRows(permissions, search) {
  const keyword = search.trim().toLowerCase();
  const rowMap = new Map();
  permissions.forEach((permission) => {
    const moduleCode = permission.module_code || "OTHER";
    const backendAction = permissionAction(permission.permission_code);
    if (!["view", "create", "edit"].includes(backendAction))
      return;
    const action = backendAction === "create" ? "edit" : backendAction;
    const resourceCode = permissionResource(permission.permission_code, moduleCode);
    const searchable = [
      permission.permission_code,
      permission.permission_name,
      permission.description || "",
      moduleCode,
      moduleLabel(moduleCode),
      resourceCode,
      ACTION_LABELS[action] || action,
    ]
      .join(" ")
      .toLowerCase();
    if (keyword && !searchable.includes(keyword))
      return;
    const key = `${moduleCode}|${resourceCode}`;
    const current = rowMap.get(key) || {
      key,
      moduleCode,
      resourceCode,
      label: resourceLabel(resourceCode, moduleCode),
      permissionsByAction: {},
    };
    const existing = current.permissionsByAction[action];
    if (!existing || backendAction === action) {
      current.permissionsByAction[action] = permission;
    }
    rowMap.set(key, current);
  });
  return Array.from(rowMap.values()).sort((left, right) => {
    const moduleDifference = moduleOrder(left.moduleCode) - moduleOrder(right.moduleCode);
    if (moduleDifference !== 0)
      return moduleDifference;
    return left.resourceCode.localeCompare(right.resourceCode);
  });
}
function permissionAction(permissionCode) {
  const parts = permissionCode.split(".").filter(Boolean);
  return parts.at(-1) || "access";
}
function permissionResource(permissionCode, moduleCode) {
  const parts = permissionCode.split(".").filter(Boolean);
  if (parts.length <= 1)
    return moduleCode.toLowerCase();
  return parts.slice(0, -1).join(".");
}
function resourceLabel(resourceCode, moduleCode) {
  const normalizedModule = moduleCode.toLowerCase();
  if (resourceCode === normalizedModule ||
    resourceCode.replaceAll("_", "") === normalizedModule.replaceAll("_", "")) {
    return moduleLabel(moduleCode);
  }
  return resourceCode
    .split(".")
    .map((part) => formatWords(part))
    .join(" / ");
}
function moduleLabel(moduleCode) {
  return MODULE_LABELS[moduleCode] || formatWords(moduleCode);
}
function moduleOrder(moduleCode) {
  const index = MODULE_ORDER.indexOf(moduleCode);
  return index === -1 ? MODULE_ORDER.length : index;
}
function formatWords(value) {
  return value
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
function isActive(value) {
  return value === true || value === 1;
}
function toNumber(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}
function sameNumberSet(left, right) {
    if (left.length !== right.length)
      return false;
  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
}
function errorMessage(error, fallback) {
  return error instanceof Error ? error.message : fallback;
}
function csvCell(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

