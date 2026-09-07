// USER MANAGEMENT - FIXED 2026-09-05
// Uses API_CONFIG and default MUI icon imports for project compatibility.
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputAdornment,
  InputLabel,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  ThemeProvider as MuiThemeProvider,
  Tooltip,
  Typography,
  createTheme,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FilterIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import AgGridTable from "../../components/tables/BasicTables/BasicTableOne";
import { API_CONFIG } from "../../config/config";
import { getAccessToken, getCurrentUser } from "../../auth/auth";
import { buttonSystem } from "../../components/button/ButtonSystem";
import { KpiCard, KpiCardGroup } from "../../components/kpi/KpiCardSystem";
import { useTheme as useAppTheme } from "../../context/ThemeContext";
import usePagePermission from "../../auth/usePagePermission";
import { useTranslation } from "react-i18next";

const API_BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const PANEL_HEADER_HEIGHT = 30;
const MAIN_TABLE_PANEL_HEIGHT = 520;

const cardSx = {
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 2,
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
};

function SectionHeader({ icon, title, action = null }) {
  return (
    <Box
      sx={{
        height: PANEL_HEADER_HEIGHT,
        minHeight: PANEL_HEADER_HEIGHT,
        px: 1.25,
        bgcolor: (theme) =>
          theme.palette.mode === "dark" ? "#182235" : "#DDEBFF",
        borderBottom: 1,
        borderColor: (theme) =>
          theme.palette.mode === "dark" ? "#344054" : "#AFC7EE",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxSizing: "border-box",
        flexShrink: 0,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.75} minWidth={0}>
        <Box sx={{ display: "flex", alignItems: "center", lineHeight: 0 }}>
          {icon}
        </Box>
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

function createUserManagementTheme(mode) {
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
      fontFamily:
        '"Bai Jamjuree", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial',
    },
    components: {
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { backgroundColor: isDark ? "#0F172A" : "#FFFFFF" },
        },
      },
    },
  });
}

function userManagementPageSx(isDark) {
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

function formatDateTime(value, language, emptyText) {
  if (!value) return emptyText;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(language === "ja" ? "ja-JP" : language === "vi" ? "vi-VN" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getDepartment(employee, fallback = "—") {
  return (
    employee.organization_unit_name ||
    employee.group_name ||
    employee.section ||
    employee.sub_division ||
    employee.division ||
    employee.factory ||
    employee.company ||
    employee.corporation ||
    fallback
  );
}

export default function UserManagement() {
  const { t, i18n } = useTranslation();
  const { theme: appTheme } = useAppTheme();
  const isDark = appTheme === "dark";
  const muiTheme = useMemo(() => createUserManagementTheme(appTheme), [appTheme]);
  const currentUser = getCurrentUser();
  const actor = currentUser?.employee_code || "SYSTEM";
  const { canEdit } = usePagePermission();
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [accessEnabled, setAccessEnabled] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [employeeToAdd, setEmployeeToAdd] = useState(null);
  const [rolesToAdd, setRolesToAdd] = useState([]);
  const [newAccessEnabled, setNewAccessEnabled] = useState(true);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState({ open: false, type: "success", text: "" });

  const showMessage = useCallback((type, text) => {
    setMessage({ open: true, type, text });
  }, []);

  const requestJson = useCallback(async (url, options) => {
    const token = getAccessToken();
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers || {}),
      },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(
        payload?.detail ||
          payload?.message ||
          `Unable to complete the request (HTTP ${response.status}).`
      );
    }
    return payload;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [employeeData, roleData] = await Promise.all([
        requestJson(
          `${API_BASE}/api/user-management/employees?employment_status=all`
        ),
        requestJson(`${API_BASE}/api/roles`),
      ]);
      const nextEmployees = Array.isArray(employeeData)
        ? employeeData
        : employeeData.items || [];
      const nextRoles = (Array.isArray(roleData) ? roleData : roleData.items || []).filter(
        (role) => Boolean(role.is_active)
      );

      setEmployees(nextEmployees);
      setRoles(nextRoles);
      const grantedEmployees = nextEmployees.filter((employee) => employee.mes_user_id);
      setSelectedEmployee((current) => {
        if (!current) return grantedEmployees[0] || null;
        return (
          grantedEmployees.find(
            (employee) => employee.employee_code === current.employee_code
          ) || grantedEmployees[0] || null
        );
      });
    } catch (error) {
      showMessage("error", error.message || t("userManagement.loadError"));
    } finally {
      setLoading(false);
    }
  }, [requestJson, showMessage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedEmployee) {
      setSelectedRoles([]);
      setAccessEnabled(false);
      return;
    }
    const roleIdSet = new Set(selectedEmployee.role_ids || []);
    setSelectedRoles(roles.filter((role) => roleIdSet.has(role.id)));
    setAccessEnabled(Boolean(selectedEmployee.mes_is_active));
  }, [roles, selectedEmployee]);

  const departments = useMemo(
    () =>
      [...new Set(employees.filter((employee) => employee.mes_user_id).map((employee) => getDepartment(employee, t("userManagement.notSpecified"))))].sort((a, b) =>
        a.localeCompare(b, "en")
      ),
    [employees, t]
  );

  // The main table only shows employees who have been granted access to VCC Plastics.
  // Employees without access remain available in the Add Employee dialog.
  const grantedEmployees = useMemo(
    () => employees.filter((employee) => Boolean(employee.mes_user_id)),
    [employees]
  );

  const availableEmployees = useMemo(
    () => employees.filter((employee) => !employee.mes_user_id),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase("en");
    return grantedEmployees.filter((employee) => {
      const matchesKeyword =
        !normalizedKeyword ||
        [employee.employee_code, employee.full_name, employee.position, getDepartment(employee, t("userManagement.notSpecified"))]
          .join(" ")
          .toLocaleLowerCase("en")
          .includes(normalizedKeyword);
      const matchesRole =
        roleFilter === "all" || (employee.role_ids || []).includes(Number(roleFilter));
      const matchesDepartment =
        departmentFilter === "all" || getDepartment(employee, t("userManagement.notSpecified")) === departmentFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && employee.mes_user_id && employee.mes_is_active) ||
        (statusFilter === "inactive" && employee.mes_user_id && !employee.mes_is_active);
      return matchesKeyword && matchesRole && matchesDepartment && matchesStatus;
    });
  }, [departmentFilter, grantedEmployees, keyword, roleFilter, statusFilter, t]);

  const statistics = useMemo(() => {
    const assigned = employees.filter((employee) => employee.mes_user_id).length;
    const unassigned = employees.filter((employee) => !employee.mes_user_id).length;
    const active = employees.filter(
      (employee) => employee.mes_user_id && employee.mes_is_active
    ).length;
    const inactive = employees.filter(
      (employee) => employee.mes_user_id && !employee.mes_is_active
    ).length;
    return {
      total: employees.length,
      assigned,
      unassigned,
      active,
      inactive,
      availableRoles: roles.length,
    };
  }, [employees, roles.length]);

  const columnDefs = useMemo(
    () => [
      {
        headerName: t("userManagement.columns.no"),
        valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
        width: 64,
        minWidth: 64,
        maxWidth: 64,
        sortable: false,
        filter: false,
        cellStyle: { textAlign: "center" },
      },
      { headerName: t("userManagement.columns.employeeCode"), field: "employee_code", width: 130 },
      { headerName: t("userManagement.columns.fullName"), field: "full_name", minWidth: 180, flex: 1.2 },
      {
        headerName: t("userManagement.columns.department"),
        valueGetter: (params) => getDepartment(params.data, t("userManagement.notSpecified")),
        minWidth: 160,
        flex: 1,
      },
      { headerName: t("userManagement.columns.jobTitle"), field: "position", minWidth: 150, flex: 1 },
      {
        headerName: t("userManagement.columns.roles"),
        minWidth: 200,
        flex: 1.25,
        cellRenderer: (params) => {
          const assignedRoles = params.data?.roles || [];
          if (!assignedRoles.length) {
            return <Typography variant="caption" color="text.secondary">{t("userManagement.unassigned")}</Typography>;
          }
          return (
            <Stack direction="row" spacing={0.5} alignItems="center" height="100%">
              <Chip
                label={assignedRoles[0].role_name}
                size="small"
                variant="outlined"
                color="primary"
                sx={{ maxWidth: 150 }}
              />
              {assignedRoles.length > 1 && (
                <Chip label={`+${assignedRoles.length - 1}`} size="small" />
              )}
            </Stack>
          );
        },
      },
      {
        headerName: t("userManagement.columns.lastLogin"),
        valueGetter: (params) => formatDateTime(params.data?.last_login_at, i18n.resolvedLanguage, t("userManagement.neverLoggedIn")),
        minWidth: 170,
        flex: 1,
      },
    ],
    [i18n.resolvedLanguage, t]
  );

  const handleRowClicked = useCallback((event) => {
    setSelectedEmployee(event.data);
  }, []);

  const handleSave = async () => {
    if (!canEdit || !selectedEmployee) return;
    setSaving(true);
    try {
      const result = await requestJson(
        `${API_BASE}/api/user-management/employees/${encodeURIComponent(
          selectedEmployee.employee_code
        )}/roles`,
        {
          method: "PUT",
          body: JSON.stringify({
            role_ids: selectedRoles.map((role) => role.id),
            is_active: accessEnabled,
            updated_by: actor,
          }),
        }
      );
      showMessage("success", result.message || t("userManagement.saveSuccess"));
      await loadData();
    } catch (error) {
      showMessage("error", error.message || t("userManagement.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAdd = () => {
    if (!canEdit) return;
    setEmployeeToAdd(null);
    setRolesToAdd([]);
    setNewAccessEnabled(true);
    setAddOpen(true);
  };

  const handleAddEmployee = async () => {
    if (!canEdit || !employeeToAdd) return;
    setAdding(true);
    try {
      const result = await requestJson(
        `${API_BASE}/api/user-management/employees/${encodeURIComponent(
          employeeToAdd.employee_code
        )}/roles`,
        {
          method: "PUT",
          body: JSON.stringify({
            role_ids: rolesToAdd.map((role) => role.id),
            is_active: newAccessEnabled,
            updated_by: actor,
          }),
        }
      );
      setSelectedEmployee(employeeToAdd);
      await loadData();
      setAddOpen(false);
      showMessage("success", result.message || t("userManagement.addSuccess"));
    } catch (error) {
      showMessage("error", error.message || t("userManagement.addError"));
    } finally {
      setAdding(false);
    }
  };

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box sx={userManagementPageSx(isDark)}>
        <PageMeta
          title={`${t("userManagement.title")} | VCC Plastics`}
          description={t("userManagement.description")}
        />
        <PageBreadcrumb pageTitle="User Management" />
        <Stack spacing={3} sx={{ pb: 2.5 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr auto" },
          gap: 1.5,
          alignItems: "end",
          width: "100%",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            {t("userManagement.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {t("userManagement.description")}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          disabled={!canEdit}
          sx={buttonSx("primary", { flexShrink: 0 })}
        >
          {t("userManagement.addEmployee")}
        </Button>
      </Box>

      <KpiCardGroup>
        <KpiCard
          label={t("userManagement.kpi.totalEmployees")}
          value={statistics.total}
          note={t("userManagement.kpi.synced")}
          tone="primary"
          icon={<GroupOutlinedIcon />}
        />
        <KpiCard
          label={t("userManagement.kpi.activeUsers")}
          value={statistics.active}
          note={t("userManagement.kpi.accessEnabled")}
          tone="success"
          icon={<ShieldOutlinedIcon />}
        />
        <KpiCard
          label={t("userManagement.kpi.inactiveUsers")}
          value={statistics.inactive}
          note={t("userManagement.kpi.accessDisabled")}
          tone="warning"
          icon={<LockOutlinedIcon />}
        />
        <KpiCard
          label={t("userManagement.kpi.usersAssigned")}
          value={statistics.assigned}
          note={t("userManagement.kpi.assignedToRoles")}
          tone="accent"
          icon={<AssignmentIndOutlinedIcon />}
        />
        <KpiCard
          label={t("userManagement.kpi.unassignedEmployees")}
          value={statistics.unassigned}
          note={t("userManagement.kpi.notAdded")}
          tone="danger"
          icon={<GroupOutlinedIcon />}
        />
        <KpiCard
          label={t("userManagement.kpi.availableRoles")}
          value={statistics.availableRoles}
          note={t("userManagement.kpi.activeRoles")}
          tone="info"
          icon={<ShieldOutlinedIcon />}
        />
      </KpiCardGroup>

      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(240px, 1.6fr) repeat(3, minmax(150px, 1fr)) auto",
            },
            gap: 1,
            alignItems: "center",
          }}
        >
          <TextField
            size="small"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={t("userManagement.searchPlaceholder")}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
              ),
            }}
          />
          <FormControl size="small">
            <InputLabel>{t("userManagement.status")}</InputLabel>
            <Select
              value={statusFilter}
              label={t("userManagement.status")}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <MenuItem value="all">{t("userManagement.allStatuses")}</MenuItem>
              <MenuItem value="active">{t("userManagement.active")}</MenuItem>
              <MenuItem value="inactive">{t("userManagement.inactive")}</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>{t("userManagement.role")}</InputLabel>
            <Select
              value={roleFilter}
              label={t("userManagement.role")}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <MenuItem value="all">{t("userManagement.allRoles")}</MenuItem>
              {roles.map((role) => (
                <MenuItem key={role.id} value={String(role.id)}>{role.role_name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>{t("userManagement.department")}</InputLabel>
            <Select
              value={departmentFilter}
              label={t("userManagement.department")}
              onChange={(event) => setDepartmentFilter(event.target.value)}
            >
              <MenuItem value="all">{t("userManagement.allDepartments")}</MenuItem>
              {departments.map((department) => (
                <MenuItem key={department} value={department}>{department}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterIcon />}
            onClick={() => {
              setKeyword("");
              setStatusFilter("all");
              setRoleFilter("all");
              setDepartmentFilter("all");
            }}
            sx={buttonSx("cancel", { minHeight: 40, whiteSpace: "nowrap" })}
          >
            {t("userManagement.clearFilters")}
          </Button>
        </Box>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            xl: "minmax(0, 1.8fr) minmax(330px, 0.7fr)",
          },
          gap: 2,
          alignItems: "stretch",
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            ...cardSx,
            overflow: "hidden",
            height: MAIN_TABLE_PANEL_HEIGHT,
            minHeight: MAIN_TABLE_PANEL_HEIGHT,
            maxHeight: MAIN_TABLE_PANEL_HEIGHT,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <SectionHeader
            icon={<GroupOutlinedIcon sx={{ color: "text.primary" }} fontSize="small" />}
            title={t("userManagement.authorizedUsers")}
            action={
              loading ? (
                <CircularProgress size={16} />
              ) : (
                <Chip
                  label={t("userManagement.userCount", { count: filteredEmployees.length })}
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
              rowData={filteredEmployees}
              columnDefs={columnDefs}
              loading={loading}
              pagination
              paginationPageSize={20}
              rowSelection="single"
              onRowClicked={handleRowClicked}
              getRowId={(params) => String(params.data.employee_code)}
              selectedRowId={selectedEmployee?.employee_code || null}
              selectedRowKey="employee_code"
              selectedRowClassName="vcc-user-row-selected"
              height="100%"
            />
          </Box>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            ...cardSx,
            overflow: "hidden",
            height: MAIN_TABLE_PANEL_HEIGHT,
            minHeight: MAIN_TABLE_PANEL_HEIGHT,
            maxHeight: MAIN_TABLE_PANEL_HEIGHT,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <SectionHeader
            icon={<AssignmentIndOutlinedIcon sx={{ color: "text.primary" }} fontSize="small" />}
            title={t("userManagement.userDetails")}
          />
          <Box sx={{ p: 2, flex: 1, minHeight: 0, overflowY: "auto" }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
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
              <AssignmentIndOutlinedIcon />
            </Box>
            <Box minWidth={0}>
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                {selectedEmployee?.full_name || t("userManagement.selectEmployee")}
              </Typography>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  {selectedEmployee?.employee_code || "—"}
                </Typography>
                {selectedEmployee ? (
                  <Chip
                    size="small"
                    label={selectedEmployee.mes_is_active ? t("userManagement.active") : t("userManagement.inactive")}
                    color={selectedEmployee.mes_is_active ? "success" : "error"}
                    variant="outlined"
                    sx={{ height: 20, "& .MuiChip-label": { px: 0.75 } }}
                  />
                ) : null}
              </Stack>
            </Box>
          </Stack>

          <Divider sx={{ my: 1.75 }} />

          {selectedEmployee ? (
            <Stack spacing={1.6}>
              <Box>
                <Typography variant="caption" color="text.secondary">{t("userManagement.department")}</Typography>
                <Typography variant="body2" fontWeight={600}>{getDepartment(selectedEmployee, t("userManagement.notSpecified"))}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{t("userManagement.jobTitle")}</Typography>
                <Typography variant="body2" fontWeight={600}>{selectedEmployee.position || "—"}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{t("userManagement.lastLogin")}</Typography>
                <Typography variant="body2" fontWeight={600}>{formatDateTime(selectedEmployee.last_login_at, i18n.resolvedLanguage, t("userManagement.neverLoggedIn"))}</Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  {t("userManagement.assignedRoles")}
                </Typography>
                <Autocomplete
                  multiple
                  size="small"
                  options={roles}
                  value={selectedRoles}
                  disabled={!canEdit}
                  onChange={(_, value) => setSelectedRoles(value)}
                  getOptionLabel={(option) => option.role_name || option.role_code}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => (
                    <TextField {...params} placeholder={selectedRoles.length ? "" : t("userManagement.selectRoles")} />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option.id}
                        label={option.role_name}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))
                  }
                />
              </Box>

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" fontWeight={600}>{t("userManagement.systemAccess")}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("userManagement.allowAccess")}
                  </Typography>
                </Box>
                <Switch disabled={!canEdit} checked={accessEnabled} onChange={(event) => setAccessEnabled(event.target.checked)} />
              </Stack>

              <Button
                fullWidth
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={!canEdit || saving}
                onClick={handleSave}
                sx={buttonSx("primary")}
              >
                {saving ? t("common.saving") : t("userManagement.savePermissions")}
              </Button>
            </Stack>
          ) : (
            <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {t("userManagement.selectRowHelp")}
              </Typography>
            </Stack>
          )}
          </Box>
        </Paper>
      </Box>

      <Dialog
        open={addOpen}
        onClose={() => !adding && setAddOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 2.5, overflow: "hidden" } }}
      >
        <DialogTitle
          sx={{
            position: "relative",
            pl: 2.5,
            pr: 7,
            py: 2,
            bgcolor: (theme) => theme.palette.mode === "dark" ? "#182235" : "#EEF4FF",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                bgcolor: "primary.main",
                color: "common.white",
                display: "grid",
                placeItems: "center",
              }}
            >
              <AssignmentIndOutlinedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800}>{t("userManagement.addEmployee")}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t("userManagement.addDescription")}
              </Typography>
            </Box>
          </Stack>
          <Tooltip title={t("userManagement.close")}>
            <span style={{ position: "absolute", top: 12, right: 12 }}>
              <IconButton
                size="small"
                disabled={adding}
                onClick={() => setAddOpen(false)}
                sx={buttonSx("cancel", { width: 34, height: 34, p: 0.25 })}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 2 }}>
            <Autocomplete
              disabled={!canEdit}
              options={availableEmployees}
              value={employeeToAdd}
              onChange={(_, value) => setEmployeeToAdd(value)}
              getOptionLabel={(option) =>
                `${option.employee_code || "—"} - ${option.full_name || t("userManagement.nameUnavailable")}`
              }
              isOptionEqualToValue={(option, value) =>
                option.employee_code === value.employee_code
              }
              noOptionsText={t("userManagement.noEmployees")}
              renderInput={(params) => (
                <TextField {...params} label={t("userManagement.employee")} placeholder={t("userManagement.searchEmployee")} />
              )}
            />

            <Autocomplete
              disabled={!canEdit}
              multiple
              options={roles}
              value={rolesToAdd}
              onChange={(_, value) => setRolesToAdd(value)}
              getOptionLabel={(option) => option.role_name || option.role_code}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField {...params} required label={t("userManagement.roles")} placeholder={t("userManagement.selectAtLeastOneRole")} />
              )}
            />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body2" fontWeight={600}>{t("userManagement.systemAccess")}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("userManagement.allowEmployeeAccess")}
                </Typography>
              </Box>
              <Switch
                disabled={!canEdit}
                checked={newAccessEnabled}
                onChange={(event) => setNewAccessEnabled(event.target.checked)}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button
            disabled={adding}
            onClick={() => setAddOpen(false)}
            sx={buttonSx("cancel")}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            startIcon={adding ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            disabled={!canEdit || !employeeToAdd || !rolesToAdd.length || adding}
            onClick={handleAddEmployee}
            sx={buttonSx("primary")}
          >
            {adding ? t("userManagement.adding") : t("userManagement.addEmployee")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={message.open}
        autoHideDuration={4000}
        onClose={() => setMessage((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={message.type}
          variant="filled"
          onClose={() => setMessage((current) => ({ ...current, open: false }))}
        >
          {message.text}
        </Alert>
      </Snackbar>
        </Stack>
      </Box>
    </MuiThemeProvider>
  );
}

