import "./locales";
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
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import AgGridTable from "../../../components/tables/BasicTables/BasicTableOne";
import { API_CONFIG } from "../../../config/config";
import { getAccessToken, getCurrentUser } from "../../../auth/auth";
import { buttonSystem } from "../../../components/button/ButtonSystem";
import { KpiCard, KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { useTheme as useAppTheme } from "../../../context/ThemeContext";
import usePagePermission from "../../../auth/usePagePermission";
import { useTranslation } from "react-i18next";

const API_BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const PANEL_HEADER_HEIGHT = 30;
const MAIN_TABLE_PANEL_HEIGHT = "max(520px, calc(var(--app-vh, 100vh) - 340px))";

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

// Header of the small account dialogs: icon, title, subtitle and the X close button (no Cancel button).
function AccountDialogTitle({ icon, title, subtitle, onClose, disabled, closeLabel }) {
  return (
    <DialogTitle
      sx={{
        position: "relative",
        pl: 2.5,
        pr: 7,
        py: 2,
        bgcolor: (theme) => (theme.palette.mode === "dark" ? "#182235" : "#EEF4FF"),
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Box sx={{ width: 29, height: 29, borderRadius: 1.5, bgcolor: "primary.main", color: "common.white", display: "grid", placeItems: "center" }}>
          {icon}
        </Box>
        <Box minWidth={0}>
          <Typography variant="h5" fontWeight={800}>{title}</Typography>
          <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
        </Box>
      </Stack>
      <Tooltip title={closeLabel}>
        <span style={{ position: "absolute", top: 12, right: 12 }}>
          <IconButton size="small" disabled={disabled} onClick={onClose} sx={buttonSx("cancel", { width: 29, height: 29, p: 0.25 })}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </DialogTitle>
  );
}

// Section caption inside a dialog (same style as the master-data dialogs).
function FormSection({ title, children }) {
  return (
    <Stack spacing={1.25}>
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "text.secondary", fontSize: "0.68rem" }}
      >
        {title}
      </Typography>
      {children}
    </Stack>
  );
}

// Password input with a show / hide eye button.
function PasswordField({ label, value, onChange, error, helperText, autoFocus, showLabel, hideLabel }) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      fullWidth
      required
      size="small"
      autoFocus={autoFocus}
      type={visible ? "text" : "password"}
      autoComplete="new-password"
      label={label}
      value={value}
      onChange={onChange}
      error={error}
      helperText={helperText}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={visible ? hideLabel : showLabel}>
                <IconButton size="small" edge="end" tabIndex={-1} onClick={() => setVisible((v) => !v)}>
                  {visible ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

const dialogFooterSx = {
  px: 2.5,
  py: 1.25,
  borderTop: 1,
  borderColor: "divider",
  bgcolor: (theme) => (theme.palette.mode === "dark" ? "#0F172A" : "#F8FAFC"),
  justifyContent: "space-between",
  gap: 1.5,
};

const EMPTY_ACCOUNT = { employee_code: "", full_name: "", department: "", position: "", external_user_id: null };

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
  const muiTheme = useMemo(
    () => createUserManagementTheme(appTheme),
    [appTheme],
  );
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
  const [createOpen, setCreateOpen] = useState(false);
  const [newAccount, setNewAccount] = useState(EMPTY_ACCOUNT);
  const [newAccountRoles, setNewAccountRoles] = useState([]);
  const [newAccountActive, setNewAccountActive] = useState(true);
  const [creating, setCreating] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ password: "", confirm: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState({
    open: false,
    type: "success",
    text: "",
  });

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
          `Unable to complete the request (HTTP ${response.status}).`,
      );
    }
    return payload;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [employeeData, roleData] = await Promise.all([
        requestJson(
          `${API_BASE}/api/user-management/employees?employment_status=all`,
        ),
        requestJson(`${API_BASE}/api/roles`),
      ]);
      const nextEmployees = Array.isArray(employeeData)
        ? employeeData
        : employeeData.items || [];
      const nextRoles = (
        Array.isArray(roleData) ? roleData : roleData.items || []
      ).filter((role) => Boolean(role.is_active));

      setEmployees(nextEmployees);
      setRoles(nextRoles);
      const grantedEmployees = nextEmployees.filter(
        (employee) => employee.mes_user_id,
      );
      setSelectedEmployee((current) => {
        if (!current) return grantedEmployees[0] || null;
        return (
          grantedEmployees.find(
            (employee) => employee.employee_code === current.employee_code,
          ) ||
          grantedEmployees[0] ||
          null
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
      [
        ...new Set(
          employees
            .filter((employee) => employee.mes_user_id)
            .map((employee) =>
              getDepartment(employee, t("userManagement.notSpecified")),
            ),
        ),
      ].sort((a, b) => a.localeCompare(b, "en")),
    [employees, t],
  );

  // The main table only shows employees who have been granted access to VCC Plastics.
  // Employees without access remain available in the Add Employee dialog.
  const grantedEmployees = useMemo(
    () => employees.filter((employee) => Boolean(employee.mes_user_id)),
    [employees],
  );

  const availableEmployees = useMemo(
    () => employees.filter((employee) => !employee.mes_user_id),
    [employees],
  );

  const filteredEmployees = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase("en");
    return grantedEmployees.filter((employee) => {
      const matchesKeyword =
        !normalizedKeyword ||
        [
          employee.employee_code,
          employee.full_name,
          employee.position,
          getDepartment(employee, t("userManagement.notSpecified")),
        ]
          .join(" ")
          .toLocaleLowerCase("en")
          .includes(normalizedKeyword);
      const matchesRole =
        roleFilter === "all" ||
        (employee.role_ids || []).includes(Number(roleFilter));
      const matchesDepartment =
        departmentFilter === "all" ||
        getDepartment(employee, t("userManagement.notSpecified")) ===
          departmentFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          employee.mes_user_id &&
          employee.mes_is_active) ||
        (statusFilter === "inactive" &&
          employee.mes_user_id &&
          !employee.mes_is_active);
      return (
        matchesKeyword && matchesRole && matchesDepartment && matchesStatus
      );
    });
  }, [
    departmentFilter,
    grantedEmployees,
    keyword,
    roleFilter,
    statusFilter,
    t,
  ]);

  const statistics = useMemo(() => {
    const assigned = employees.filter(
      (employee) => employee.mes_user_id,
    ).length;
    const unassigned = employees.filter(
      (employee) => !employee.mes_user_id,
    ).length;
    const active = employees.filter(
      (employee) => employee.mes_user_id && employee.mes_is_active,
    ).length;
    const inactive = employees.filter(
      (employee) => employee.mes_user_id && !employee.mes_is_active,
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
      {
        headerName: t("userManagement.columns.employeeCode"),
        field: "employee_code",
        width: 130,
      },
      {
        headerName: t("userManagement.columns.fullName"),
        field: "full_name",
        minWidth: 180,
        flex: 1.2,
      },
      {
        headerName: t("userManagement.columns.department"),
        valueGetter: (params) =>
          getDepartment(params.data, t("userManagement.notSpecified")),
        minWidth: 160,
        flex: 1,
      },
      {
        headerName: t("userManagement.columns.jobTitle"),
        field: "position",
        minWidth: 150,
        flex: 1,
      },
      {
        headerName: t("userManagement.columns.roles"),
        minWidth: 200,
        flex: 1.25,
        cellRenderer: (params) => {
          const assignedRoles = params.data?.roles || [];
          if (!assignedRoles.length) {
            return (
              <Typography variant="caption" color="text.secondary">
                {t("userManagement.unassigned")}
              </Typography>
            );
          }
          return (
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              height="100%"
            >
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
        valueGetter: (params) =>
          formatDateTime(
            params.data?.last_login_at,
            i18n.resolvedLanguage,
            t("userManagement.neverLoggedIn"),
          ),
        minWidth: 170,
        flex: 1,
      },
    ],
    [i18n.resolvedLanguage, t],
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
          selectedEmployee.employee_code,
        )}/roles`,
        {
          method: "PUT",
          body: JSON.stringify({
            role_ids: selectedRoles.map((role) => role.id),
            is_active: accessEnabled,
            updated_by: actor,
          }),
        },
      );
      showMessage("success", result.message || t("userManagement.saveSuccess"));
      await loadData();
    } catch (error) {
      showMessage("error", error.message || t("userManagement.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const setAccountField = (field) => (event) =>
    setNewAccount((current) => ({ ...current, [field]: event.target.value }));
  // picking someone from the VCC Group directory fills the form (still editable)
  const pickDirectoryEmployee = (employee) =>
    setNewAccount(
      employee
        ? {
            employee_code: employee.employee_code || "",
            full_name: employee.full_name || "",
            department: getDepartment(employee, ""),
            position: employee.position || "",
            external_user_id: employee.external_user_id ?? null,
          }
        : EMPTY_ACCOUNT,
    );
  const passwordMismatch = Boolean(passwordForm.confirm) && passwordForm.password !== passwordForm.confirm;

  const handleOpenCreate = () => {
    if (!canEdit) return;
    setNewAccount(EMPTY_ACCOUNT);
    setNewAccountRoles([]);
    setNewAccountActive(true);
    setCreateOpen(true);
  };

  const handleCreateAccount = async () => {
    if (!canEdit || creating) return;
    setCreating(true);
    try {
      const result = await requestJson(`${API_BASE}/api/user-management/accounts`, {
        method: "POST",
        body: JSON.stringify({
          employee_code: newAccount.employee_code.trim(),
          full_name: newAccount.full_name.trim(),
          department: newAccount.department.trim() || null,
          position: newAccount.position.trim() || null,
          external_user_id: newAccount.external_user_id,
          role_ids: newAccountRoles.map((role) => role.id),
          is_active: newAccountActive,
          created_by: actor,
        }),
      });
      setSelectedEmployee({ employee_code: newAccount.employee_code.trim() });
      await loadData();
      setCreateOpen(false);
      showMessage("success", result.message || t("userManagement.addSuccess"));
    } catch (error) {
      showMessage("error", error.message || t("userManagement.addError"));
    } finally {
      setCreating(false);
    }
  };

  const handleOpenPassword = () => {
    if (!canEdit || !selectedEmployee) return;
    setPasswordForm({ password: "", confirm: "" });
    setPasswordOpen(true);
  };

  const handleSavePassword = async () => {
    if (!canEdit || !selectedEmployee || savingPassword) return;
    setSavingPassword(true);
    try {
      const result = await requestJson(
        `${API_BASE}/api/user-management/accounts/${encodeURIComponent(selectedEmployee.employee_code)}/password`,
        { method: "PUT", body: JSON.stringify({ password: passwordForm.password, updated_by: actor }) },
      );
      setPasswordOpen(false);
      showMessage("success", result.message || t("userManagement.passwordSaved"));
      await loadData();
    } catch (error) {
      showMessage("error", error.message || t("userManagement.passwordError"));
    } finally {
      setSavingPassword(false);
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
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.25 }}
              >
                {t("userManagement.description")}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
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
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
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
                  <MenuItem value="all">
                    {t("userManagement.allStatuses")}
                  </MenuItem>
                  <MenuItem value="active">
                    {t("userManagement.active")}
                  </MenuItem>
                  <MenuItem value="inactive">
                    {t("userManagement.inactive")}
                  </MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel>{t("userManagement.role")}</InputLabel>
                <Select
                  value={roleFilter}
                  label={t("userManagement.role")}
                  onChange={(event) => setRoleFilter(event.target.value)}
                >
                  <MenuItem value="all">
                    {t("userManagement.allRoles")}
                  </MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={String(role.id)}>
                      {role.role_name}
                    </MenuItem>
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
                  <MenuItem value="all">
                    {t("userManagement.allDepartments")}
                  </MenuItem>
                  {departments.map((department) => (
                    <MenuItem key={department} value={department}>
                      {department}
                    </MenuItem>
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
                sx={buttonSx("cancel", { minHeight: 29, whiteSpace: "nowrap" })}
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
                icon={
                  <GroupOutlinedIcon
                    sx={{ color: "text.primary" }}
                    fontSize="small"
                  />
                }
                title={t("userManagement.authorizedUsers")}
                action={
                  loading ? (
                    <CircularProgress size={16} />
                  ) : (
                    <Chip
                      label={t("userManagement.userCount", {
                        count: filteredEmployees.length,
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
                icon={
                  <AssignmentIndOutlinedIcon
                    sx={{ color: "text.primary" }}
                    fontSize="small"
                  />
                }
                title={t("userManagement.userDetails")}
              />
              <Box sx={{ p: 2, flex: 1, minHeight: 0, overflowY: "auto" }}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
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
                      {selectedEmployee?.full_name ||
                        t("userManagement.selectEmployee")}
                    </Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {selectedEmployee?.employee_code || "—"}
                      </Typography>
                      {selectedEmployee ? (
                        <Chip
                          size="small"
                          label={
                            selectedEmployee.mes_is_active
                              ? t("userManagement.active")
                              : t("userManagement.inactive")
                          }
                          color={
                            selectedEmployee.mes_is_active ? "success" : "error"
                          }
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
                      <Typography variant="caption" color="text.secondary">
                        {t("userManagement.department")}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {getDepartment(
                          selectedEmployee,
                          t("userManagement.notSpecified"),
                        )}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t("userManagement.jobTitle")}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedEmployee.position || "—"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t("userManagement.lastLogin")}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatDateTime(
                          selectedEmployee.last_login_at,
                          i18n.resolvedLanguage,
                          t("userManagement.neverLoggedIn"),
                        )}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t("userManagement.accountType")}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedEmployee.has_password
                          ? t("userManagement.localAccount")
                          : t("userManagement.vccAccount")}
                      </Typography>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        sx={{ mb: 1 }}
                      >
                        {t("userManagement.assignedRoles")}
                      </Typography>
                      <Autocomplete
                        multiple
                        size="small"
                        options={roles}
                        value={selectedRoles}
                        disabled={!canEdit}
                        onChange={(_, value) => setSelectedRoles(value)}
                        getOptionLabel={(option) =>
                          option.role_name || option.role_code
                        }
                        isOptionEqualToValue={(option, value) =>
                          option.id === value.id
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder={
                              selectedRoles.length
                                ? ""
                                : t("userManagement.selectRoles")
                            }
                          />
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

                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {t("userManagement.systemAccess")}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t("userManagement.allowAccess")}
                        </Typography>
                      </Box>
                      <Switch sx={{ ml: "auto" }}
                        disabled={!canEdit}
                        checked={accessEnabled}
                        onChange={(event) =>
                          setAccessEnabled(event.target.checked)
                        }
                      />
                    </Stack>

                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={
                        saving ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <SaveIcon />
                        )
                      }
                      disabled={!canEdit || saving}
                      onClick={handleSave}
                      sx={buttonSx("primary")}
                    >
                      {saving
                        ? t("common.saving")
                        : t("userManagement.savePermissions")}
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<VpnKeyOutlinedIcon />}
                      disabled={!canEdit || !selectedEmployee.mes_user_id}
                      onClick={handleOpenPassword}
                      sx={buttonSx("edit")}
                    >
                      {selectedEmployee.has_password
                        ? t("userManagement.changePassword")
                        : t("userManagement.setPassword")}
                    </Button>
                  </Stack>
                ) : (
                  <Stack
                    alignItems="center"
                    justifyContent="center"
                    sx={{ height: "100%" }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      textAlign="center"
                    >
                      {t("userManagement.selectRowHelp")}
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Paper>
          </Box>

          <Dialog
            open={createOpen}
            onClose={() => !creating && setCreateOpen(false)}
            fullWidth
            maxWidth="sm"
            PaperProps={{ sx: { borderRadius: 2.5, overflow: "hidden" } }}
          >
            <AccountDialogTitle
              icon={<PersonAddAltOutlinedIcon fontSize="small" />}
              title={t("userManagement.addEmployee")}
              subtitle={t("userManagement.addEmployeeDescription")}
              onClose={() => setCreateOpen(false)}
              disabled={creating}
              closeLabel={t("userManagement.close")}
            />
            <DialogContent sx={{ px: 2.5, py: 2.25, "&&": { pt: 2.25 } }}>
              <Stack spacing={2.25} sx={{ pt: 0.5 }}>
                <FormSection title={t("userManagement.sectionProfile")}>
                  {availableEmployees.length ? (
                    <Autocomplete
                      size="small"
                      options={availableEmployees}
                      onChange={(_, value) => pickDirectoryEmployee(value)}
                      getOptionLabel={(option) =>
                        `${option.employee_code || "—"} - ${option.full_name || t("userManagement.nameUnavailable")}`
                      }
                      isOptionEqualToValue={(option, value) => option.employee_code === value.employee_code}
                      noOptionsText={t("userManagement.noEmployees")}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t("userManagement.pickFromDirectory")}
                          placeholder={t("userManagement.searchEmployee")}
                        />
                      )}
                    />
                  ) : null}
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                    <TextField
                      fullWidth
                      required
                      size="small"
                      autoFocus
                      label={t("userManagement.employeeCode")}
                      placeholder={t("userManagement.codePlaceholder")}
                      value={newAccount.employee_code}
                      onChange={setAccountField("employee_code")}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <BadgeOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      required
                      size="small"
                      label={t("userManagement.fullName")}
                      placeholder={t("userManagement.namePlaceholder")}
                      value={newAccount.full_name}
                      onChange={setAccountField("full_name")}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label={t("userManagement.department")}
                      placeholder={t("userManagement.departmentPlaceholder")}
                      value={newAccount.department}
                      onChange={setAccountField("department")}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label={t("userManagement.jobTitle")}
                      placeholder={t("userManagement.positionPlaceholder")}
                      value={newAccount.position}
                      onChange={setAccountField("position")}
                    />
                  </Box>
                </FormSection>

                <FormSection title={t("userManagement.sectionLogin")}>
                  <Stack
                    direction="row"
                    spacing={1.25}
                    alignItems="center"
                    sx={{
                      px: 1.5,
                      py: 1,
                      borderRadius: 1.5,
                      border: 1,
                      borderColor: (theme) => (theme.palette.mode === "dark" ? "#1E3A5F" : "#C7DBF5"),
                      bgcolor: (theme) => (theme.palette.mode === "dark" ? "#0F2238" : "#F3F8FF"),
                    }}
                  >
                    <VpnKeyOutlinedIcon fontSize="small" sx={{ color: "primary.main" }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {t("userManagement.defaultPasswordTitle", { code: newAccount.employee_code.trim() || "…" })}{" "}
                        <Box component="span" sx={{ px: 0.75, py: 0.1, borderRadius: 1, bgcolor: "background.paper", border: 1, borderColor: "divider", fontFamily: "monospace" }}>
                          1
                        </Box>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("userManagement.defaultPasswordHint")}
                      </Typography>
                    </Box>
                  </Stack>
                </FormSection>

                <FormSection title={t("userManagement.sectionAccess")}>
                  <Autocomplete
                    multiple
                    size="small"
                    options={roles}
                    value={newAccountRoles}
                    onChange={(_, value) => setNewAccountRoles(value)}
                    getOptionLabel={(option) => option.role_name || option.role_code}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required
                        label={t("userManagement.roles")}
                        placeholder={newAccountRoles.length ? "" : t("userManagement.selectAtLeastOneRole")}
                      />
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
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ px: 1.5, py: 1, border: 1, borderColor: "divider", borderRadius: 1.5 }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{t("userManagement.systemAccess")}</Typography>
                      <Typography variant="caption" color="text.secondary">{t("userManagement.allowEmployeeAccess")}</Typography>
                    </Box>
                    <Switch sx={{ ml: "auto" }} checked={newAccountActive} onChange={(event) => setNewAccountActive(event.target.checked)} />
                  </Stack>
                </FormSection>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ ...dialogFooterSx, justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                startIcon={creating ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={
                  !canEdit || creating || !newAccount.employee_code.trim() || !newAccount.full_name.trim() ||
                  !newAccountRoles.length
                }
                onClick={handleCreateAccount}
                sx={buttonSx("primary", { flexShrink: 0 })}
              >
                {creating ? t("userManagement.adding") : t("userManagement.addEmployee")}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={passwordOpen}
            onClose={() => !savingPassword && setPasswordOpen(false)}
            fullWidth
            maxWidth="xs"
            PaperProps={{ sx: { borderRadius: 2.5, overflow: "hidden" } }}
          >
            <AccountDialogTitle
              icon={<VpnKeyOutlinedIcon fontSize="small" />}
              title={selectedEmployee?.has_password ? t("userManagement.changePassword") : t("userManagement.setPassword")}
              subtitle={t("userManagement.setPasswordDescription", {
                name: `${selectedEmployee?.full_name || ""} - ${selectedEmployee?.employee_code || ""}`,
              })}
              onClose={() => setPasswordOpen(false)}
              disabled={savingPassword}
              closeLabel={t("userManagement.close")}
            />
            <DialogContent sx={{ px: 2.5, py: 2.25, "&&": { pt: 2.25 } }}>
              <Stack spacing={1.5} sx={{ pt: 0.5 }}>
                <PasswordField
                  autoFocus
                  label={t("userManagement.newPassword")}
                  value={passwordForm.password}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))}
                  showLabel={t("userManagement.showPassword")}
                  hideLabel={t("userManagement.hidePassword")}
                />
                <PasswordField
                  label={t("userManagement.confirmPassword")}
                  value={passwordForm.confirm}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, confirm: event.target.value }))}
                  error={passwordMismatch}
                  helperText={passwordMismatch ? t("userManagement.passwordMismatch") : null}
                  showLabel={t("userManagement.showPassword")}
                  hideLabel={t("userManagement.hidePassword")}
                />
                {!selectedEmployee?.has_password ? (
                  <Alert severity="info" variant="outlined" sx={{ py: 0, fontSize: 11 }}>
                    {t("userManagement.passwordSwitchHint")}
                  </Alert>
                ) : null}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ ...dialogFooterSx, justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                startIcon={savingPassword ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                disabled={!canEdit || savingPassword || !passwordForm.password || passwordForm.password !== passwordForm.confirm}
                onClick={handleSavePassword}
                sx={buttonSx("primary")}
              >
                {savingPassword ? t("common.saving") : t("userManagement.savePassword")}
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={message.open}
            autoHideDuration={4000}
            onClose={() =>
              setMessage((current) => ({ ...current, open: false }))
            }
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          >
            <Alert
              severity={message.type}
              variant="filled"
              onClose={() =>
                setMessage((current) => ({ ...current, open: false }))
              }
            >
              {message.text}
            </Alert>
          </Snackbar>
        </Stack>
      </Box>
    </MuiThemeProvider>
  );
}
