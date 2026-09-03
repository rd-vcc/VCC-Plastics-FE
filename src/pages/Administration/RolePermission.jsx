import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, IconButton, InputAdornment, MenuItem, Paper, Stack, Switch, TextField, Tooltip, Typography, } from "@mui/material";
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
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { API_CONFIG } from "../../config/config";
import { getAccessToken, getCurrentUser } from "../../auth/auth";
import AgGridTable from "../../components/tables/BasicTables/BasicTableOne";
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
const MAIN_TABLE_PANEL_HEIGHT = 445;
const PANEL_FOOTER_HEIGHT = 32;
export default function RolePermission() {
  const currentUser = getCurrentUser();
  const actor = currentUser?.employee_code || "SYSTEM";
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
    const totalPermissions = permissions.length;
    const activeRoles = roles.filter((role) => isActive(role.is_active)).length;
    const inactiveRoles = roles.length - activeRoles;
    const assignedUserCount = users.filter((user) => (user.roles || []).length > 0).length;
    const fullAccessRoles = roles.filter((role) => totalPermissions > 0 &&
      toNumber(role.permission_count) === totalPermissions).length;
    return {
      totalRoles: roles.length,
      activeRoles,
      inactiveRoles,
      totalPermissions,
      assignedUserCount,
      fullAccessRoles,
    };
  }, [roles, permissions.length, users]);
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
        `Unable to complete the request (HTTP ${response.status}).`;
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
      setError(errorMessage(err, "Unable to load Role & Permission data."));
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
      setError(errorMessage(err, "Unable to load role permissions."));
    }
    finally {
      setLoadingRolePermissions(false);
    }
  }
  function selectRole(roleId) {
    if (roleId === selectedRoleId)
      return;
    if (hasPermissionChanges &&
      !window.confirm("Permissions have not been saved. Discard changes and switch roles?")) {
      return;
    }
    setSelectedRoleId(roleId);
  }
  function openCreateRole() {
    setEditingRole(null);
    setRoleForm(EMPTY_ROLE_FORM);
    setRoleModalOpen(true);
  }
  function openEditRole(role) {
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
    const roleCode = roleForm.role_code
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_");
    const roleName = roleForm.role_name.trim();
    if (!roleCode) {
      setError("Please enter the role code.");
      return;
    }
    if (!roleName) {
      setError("Please enter the role name.");
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
        setSuccess("Role updated successfully.");
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
        setSuccess("Role created successfully.");
      }
      closeRoleModal();
      await reloadRolesAndUsers();
    }
    catch (err) {
      setError(errorMessage(err, "Unable to save the role."));
    }
    finally {
      setSavingRole(false);
    }
  }
  async function deactivateRole(role) {
    const confirmed = window.confirm(`Are you sure you want to deactivate role "${role.role_name}"?`);
    if (!confirmed)
      return;
    try {
      setError("");
      await requestJson(`/api/roles/${role.id}`, { method: "DELETE" });
      setSuccess("Role deactivated successfully.");
      await reloadRolesAndUsers();
    }
    catch (err) {
      setError(errorMessage(err, "Unable to deactivate the role."));
    }
  }
  async function reactivateRole(role) {
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
      setSuccess("Role reactivated successfully.");
      await reloadRolesAndUsers();
    }
    catch (err) {
      setError(errorMessage(err, "Unable to reactivate the role."));
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
    setSelectedPermissionIds((current) => current.includes(permissionId)
      ? current.filter((id) => id !== permissionId)
      : [...current, permissionId]);
  }
  async function savePermissions() {
    if (!selectedRole)
      return;
    if (!isActive(selectedRole.is_active)) {
      setError("Permissions cannot be assigned to an inactive role.");
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
      setSuccess(`Permissions saved for role ${selectedRole.role_name}.`);
      await reloadRolesAndUsers();
    }
    catch (err) {
      setError(errorMessage(err, "Unable to save role permissions."));
    }
    finally {
      setSavingPermissions(false);
    }
  }
  function exportRoles() {
    const header = [
      "Role Code",
      "Role Name",
      "Status",
      "Users",
      "Permissions",
      "Description",
    ];
    const rows = roles.map((role) => [
      role.role_code,
      role.role_name,
      isActive(role.is_active) ? "Active" : "Inactive",
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
  return (<>
    <PageMeta title="Role & Permission | VCC Plastics" description="Manage roles and system permissions for VCC Plastics" />

    <PageBreadcrumb pageTitle="Role & Permission" />

    <Stack spacing={2.5} sx={{ pb: 2.5 }}>
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
            Role & Permission Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Manage roles, usage status, and the permission matrix for VCC Plastics.
          </Typography>
        </Box>


      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      <Box sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          md: "repeat(3, minmax(0, 1fr))",
          xl: "repeat(6, minmax(0, 1fr))",
        },
        gap: 1.5,
      }}>
        <KpiCard label="Total Roles" value={statistics.totalRoles} note="All roles" color="#2563eb" symbol="R" />
        <KpiCard label="Active Roles" value={statistics.activeRoles} note="Currently in use" color="#059669" symbol="A" />
        <KpiCard label="Total Permissions" value={statistics.totalPermissions} note="System-defined permissions" color="#d97706" symbol="P" />
        <KpiCard label="Users with Roles" value={statistics.assignedUserCount} note="In the MES user list" color="#7c3aed" symbol="U" />
        <KpiCard label="Full Access Roles" value={statistics.fullAccessRoles} note="All permissions assigned" color="#0284c7" symbol="F" />
        <KpiCard label="Inactive Roles" value={statistics.inactiveRoles} note="Deactivated" color="#dc2626" symbol="I" />
      </Box>

      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, my: 0.25 }}>
        <Box sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(260px,1.7fr) minmax(160px,.8fr) minmax(180px,.9fr) auto",
          },
          gap: 1,
          alignItems: "center",
        }}>
          <TextField size="small" fullWidth value={roleSearch} onChange={(event) => setRoleSearch(event.target.value)} placeholder="Search role code, name, or description..." InputProps={{
            startAdornment: (<InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>),
          }} />

          <TextField select size="small" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
          </TextField>

          <TextField select size="small" value={accessFilter} onChange={(event) => setAccessFilter(event.target.value)}>
            <MenuItem value="ALL">All Access Levels</MenuItem>
            <MenuItem value="FULL">Full Access</MenuItem>
            <MenuItem value="PARTIAL">Partial Access</MenuItem>
            <MenuItem value="NONE">No Access</MenuItem>
          </TextField>

          <Button variant="outlined" size="small" startIcon={<FilterIcon />} onClick={() => {
            setRoleSearch("");
            setStatusFilter("ALL");
            setAccessFilter("ALL");
          }} sx={{
            textTransform: "none",
            minHeight: 40,
            whiteSpace: "nowrap",
          }}>
            Clear Filters
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
        mt: 0.25,
      }}>
        <RoleListPanel
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
          role={selectedRole}
          assignedUsers={assignedUsers}
          loading={loading}
          selectedPermissionCount={selectedPermissionIds.length}
          totalPermissionCount={permissions.length}
          onEdit={openEditRole}
        />
      </Box>

    </Stack>

    <RoleModal open={roleModalOpen} editingRole={editingRole} form={roleForm} saving={savingRole} onChange={setRoleForm} onClose={closeRoleModal} onSave={() => void saveRole()} />
  </>);
}
function KpiCard({ label, value, note, color, symbol }) {
  return (<Paper elevation={0} sx={{
    position: "relative",
    overflow: "hidden",
    minHeight: 88,
    p: 1.5,
    borderRadius: 2,
    bgcolor: color,
    color: "common.white",
  }}>
    <Stack spacing={0.25}>
      <Typography variant="caption" sx={{ color: "rgba(255,255,255,.82)" }}>
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={700} lineHeight={1.15}>
        {value}
      </Typography>
      <Typography variant="caption" noWrap sx={{ color: "rgba(255,255,255,.74)", pr: 4 }}>
        {note}
      </Typography>
    </Stack>

    <Box sx={{
      position: "absolute",
      right: 10,
      top: 10,
      width: 30,
      height: 30,
      borderRadius: 1.25,
      border: "1px solid rgba(255,255,255,.28)",
      bgcolor: "rgba(255,255,255,.10)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
    }}>
      {symbol}
    </Box>
  </Paper>);
}

function SectionHeader({ icon, title, action = null }) {
  return (
    <Box
      sx={{
        height: PANEL_HEADER_HEIGHT,
        minHeight: PANEL_HEADER_HEIGHT,
        px: 1.25,
        bgcolor: "#DDEBFF",
        borderBottom: 1,
        borderColor: "#AFC7EE",
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

function RoleListPanel({ loading, roles, selectedRoleId, onSelect, onEdit, onDeactivate, onReactivate, onCreate, }) {
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
      headerName: "Role",
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
      headerName: "User",
      field: "user_count",
      width: 64,
      minWidth: 64,
      maxWidth: 64,
      filter: false,
      cellClass: "ag-cell-center",
      valueGetter: (params) => toNumber(params.data?.user_count),
    },
  ], [selectedRoleId, onEdit, onDeactivate, onReactivate]);
  return (<Paper variant="outlined" sx={{ position: "relative", borderRadius: 2, overflow: "hidden", height: MAIN_TABLE_PANEL_HEIGHT, minHeight: MAIN_TABLE_PANEL_HEIGHT, maxHeight: MAIN_TABLE_PANEL_HEIGHT, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
    <SectionHeader
      icon={<BadgeOutlinedIcon sx={{ color: "text.primary" }} fontSize="small" />}
      title="Roles"
    />

    <Box sx={{ p: 0.75, pb: 6, flex: 1, minHeight: 0 }}>
      <AgGridTable rowData={roles} columnDefs={columnDefs} height="100%" loading={loading} pagination paginationPageSize={6} getRowId={(params) => String(params.data.id)} onRowClicked={(event) => {
        if (event.data)
          onSelect(event.data.id);
      }} />
    </Box>

    <Button
      variant="contained"
      size="small"
      startIcon={<AddIcon />}
      onClick={onCreate}
      sx={{
        position: "absolute",
        right: 12,
        bottom: 10,
        zIndex: 2,
        textTransform: "none",
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
      }}
    >
      Create Role
    </Button>
  </Paper>);
}
function PermissionMatrixPanel({ selectedRole, rows, selectedPermissionIds, loading, saving, dirty, permissionSearch, onPermissionSearchChange, onTogglePermission, onSave, }) {
  const selectedPermissionSet = useMemo(() => new Set(selectedPermissionIds), [selectedPermissionIds]);
  const columnDefs = useMemo(() => [
    {
      headerName: "Module",
      width: 210,
      minWidth: 190,
      flex: 1,
      headerClass: "ag-header-center",
      cellClass: "ag-cell-left",
      valueGetter: (params) => params.data ? moduleLabel(params.data.moduleCode) : "",
      cellRenderer: (params) => params.data ? (<Typography variant="caption" fontWeight={700} noWrap>
        {moduleLabel(params.data.moduleCode)}
      </Typography>) : null,
    },
    ...ACTION_ORDER.map((action) => ({
      headerName: ACTION_LABELS[action],
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
            —
          </Typography>);
        }
        return (<MatrixToggle checked={selectedPermissionSet.has(permission.id)} disabled={!selectedRole || !isActive(selectedRole.is_active)} title={`${permission.permission_name} (${permission.permission_code})`} onClick={() => onTogglePermission(permission.id)} />);
      },
    })),
  ], [selectedPermissionSet, selectedRole, onTogglePermission]);
  return (<Paper variant="outlined" sx={{ position: "relative", borderRadius: 2, overflow: "hidden", height: MAIN_TABLE_PANEL_HEIGHT, minHeight: MAIN_TABLE_PANEL_HEIGHT, maxHeight: MAIN_TABLE_PANEL_HEIGHT, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
    <SectionHeader
      icon={<ShieldOutlinedIcon sx={{ color: "text.primary" }} fontSize="small" />}
      title="Permission Matrix (SYSTEM ADMIN)"
    />

    {!selectedRole ? (<Stack alignItems="center" justifyContent="center" spacing={1} sx={{ flex: 1, px: 2 }}>
      <Typography variant="subtitle2">No Role Selected</Typography>
      <Typography variant="caption" color="text.secondary" textAlign="center">
        Select a role from the left table to view and assign permissions.
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
            Unsaved changes
          </Typography>
        ) : null}

        <Button
          variant="contained"
          size="small"
          startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <SaveIcon />}
          onClick={onSave}
          disabled={!selectedRole ||
            !dirty ||
            saving ||
            !isActive(selectedRole.is_active)}
          sx={{
            textTransform: "none",
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
          }}
        >
          {saving ? "Saving..." : "Save Permissions"}
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
  role,
  assignedUsers,
  loading,
  selectedPermissionCount,
  totalPermissionCount,
  onEdit,
}) {
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
      headerName: "User Code",
      field: "employee_code",
      minWidth: 95,
      flex: 1,
      cellRenderer: (params) => (
        <Typography variant="caption" fontWeight={600} noWrap>
          {params.data?.employee_code || "—"}
        </Typography>
      ),
    },
    {
      headerName: "User Name",
      minWidth: 110,
      flex: 1.2,
      valueGetter: (params) =>
        params.data?.full_name ||
        params.data?.user_name ||
        params.data?.name ||
        "—",
    },
    {
      headerName: "Status",
      width: 68,
      minWidth: 68,
      maxWidth: 68,
      sortable: false,
      filter: false,
      cellClass: "ag-cell-center",
      cellRenderer: (params) =>
        params.data ? <StatusBadge active={isActive(params.data.is_active)} compact /> : null,
    },
  ], []);

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
        title="Role Details"
        action={
          role ? (
            <Tooltip title="Edit Role">
              <IconButton
                size="small"
                onClick={() => onEdit(role)}
                sx={{
                  color: "text.primary",
                  p: 0.25,
                }}
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
            Select a role to view details.
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
              <DetailRow label="Role Name" value={role.role_name} strong />
              <DetailRow label="Role Code" value={role.role_code} />
              <DetailRow
                label="Status"
                value={isActive(role.is_active) ? "Active" : "Inactive"}
                strong
              />
              <DetailRow label="Description" value={role.description || "—"} />
              <DetailRow label="Users" value={String(toNumber(role.user_count))} strong />
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
                Assigned:{" "}
                <Typography component="span" variant="caption" fontWeight={700} color="text.primary">
                  {selectedPermissionCount}
                </Typography>
              </Typography>

              <Typography variant="caption" color="text.secondary" noWrap>
                Unassigned:{" "}
                <Typography component="span" variant="caption" fontWeight={700} color="text.primary">
                  {Math.max(totalPermissionCount - selectedPermissionCount, 0)}
                </Typography>
              </Typography>

              <Typography variant="caption" color="text.secondary" noWrap>
                Total:{" "}
                <Typography component="span" variant="caption" fontWeight={700} color="text.primary">
                  {totalPermissionCount}
                </Typography>
                {" "}Permission
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
                Assigned Users ({assignedUsers.length})
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
      {value || "—"}
    </Typography>)}
  </Box>);
}
function StatusBadge({ active, compact = false, }) {
  return (<Chip size="small" label={active ? "Active" : "Inactive"} color={active ? "success" : "error"} variant="outlined" sx={{
    height: compact ? 20 : 22,
    "& .MuiChip-label": { px: compact ? 0.75 : 1 },
  }} />);
}
function RoleModal({ open, editingRole, form, saving, onChange, onClose, onSave, }) {
  return (<Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2.5 } }}>
    <DialogTitle sx={{ pb: 1 }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {editingRole ? "Update Role" : "Create New Role"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Permissions can be configured in the matrix after the role is saved.
          </Typography>
        </Box>

        <IconButton size="small" onClick={onClose} disabled={saving}>
          <CloseIcon />
        </IconButton>
      </Stack>
    </DialogTitle>

    <Divider />

    <DialogContent>
      <Stack spacing={2} sx={{ pt: 1 }}>
        <TextField fullWidth required size="small" label="Role Code" value={form.role_code} disabled={Boolean(editingRole)} onChange={(event) => onChange({ ...form, role_code: event.target.value })} placeholder="e.g. PRODUCTION_MANAGER" helperText={editingRole ? "The role code cannot be changed after creation." : undefined} />

        <TextField fullWidth required size="small" label="Role Name" value={form.role_name} onChange={(event) => onChange({ ...form, role_name: event.target.value })} placeholder="e.g. Production Manager" />

        <TextField fullWidth multiline minRows={3} label="Description" value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} placeholder="Describe the role scope and intended users..." />

        <FormControlLabel control={<Switch checked={form.is_active} onChange={(event) => onChange({ ...form, is_active: event.target.checked })} />} label={<Box>
          <Typography variant="body2" fontWeight={600}>
            Activate Role
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Only active roles can be assigned permissions and used.
          </Typography>
        </Box>} />
      </Stack>
    </DialogContent>

    <DialogActions sx={{ px: 3, pb: 2.5 }}>
      <Button variant="outlined" onClick={onClose} disabled={saving} sx={{ textTransform: "none" }}>
        Cancel
      </Button>
      <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />} onClick={onSave} disabled={saving} sx={{ textTransform: "none" }}>
        {saving ? "Saving..." : "Save Role"}
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
