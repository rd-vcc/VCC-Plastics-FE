import { API_ENDPOINTS } from "../config/config";
const ACCESS_TOKEN_KEY = "vcc_plastics_access_token";
const USER_KEY = "vcc_plastics_user";
const MES_ACCESS_KEY = "vcc_plastics_mes_access";
export async function loginWithVccGroup(username, password) {
    const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username,
            password,
        }),
    });
    const data = (await response.json().catch(() => ({})));
    if (!response.ok) {
        const errorData = data;
        if (response.status === 401) {
            throw new Error("Tài khoản hoặc mật khẩu không đúng.");
        }
        if (response.status === 404) {
            throw new Error("Không tìm thấy thông tin nhân sự của tài khoản này.");
        }
        throw new Error(errorData.detail ||
            errorData.error ||
            errorData.message ||
            `Đăng nhập thất bại (HTTP ${response.status}).`);
    }
    const loginData = data;
    if (!loginData.token || !loginData.user) {
        throw new Error("Dữ liệu đăng nhập từ VCC Group không hợp lệ.");
    }
    // Lưu token
    localStorage.setItem(ACCESS_TOKEN_KEY, loginData.token);
    // Lưu thông tin nhân viên
    localStorage.setItem(USER_KEY, JSON.stringify(loginData.user));
    // Lưu role và permission do VCC Plastics cấp.
    localStorage.setItem(MES_ACCESS_KEY, JSON.stringify(loginData.mes_access || {
        enabled: false,
        roles: [],
        permissions: [],
    }));
    return loginData.user;
}
export function isAuthenticated() {
    return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
}
export function getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}
export function getCurrentUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
        return null;
    }
    try {
        return JSON.parse(raw);
    }
    catch {
        localStorage.removeItem(USER_KEY);
        return null;
    }
}
export function getMesAccess() {
    const raw = localStorage.getItem(MES_ACCESS_KEY);
    if (!raw) return { enabled: false, roles: [], permissions: [] };
    try {
        const access = JSON.parse(raw);
        return {
            enabled: Boolean(access?.enabled),
            roles: Array.isArray(access?.roles) ? access.roles : [],
            permissions: Array.isArray(access?.permissions) ? access.permissions : [],
        };
    }
    catch {
        localStorage.removeItem(MES_ACCESS_KEY);
        return { enabled: false, roles: [], permissions: [] };
    }
}
export function hasPermission(permissionCode) {
    if (!permissionCode) return true;
    const permissions = getMesAccess().permissions;

    // The backend intentionally exposes a fixed module-level permission set.
    // Every page permission is mapped to its owning module here.
    const moduleByPagePrefix = {
        dashboard: "dashboard",
        production: "production",
        machine: "machine_equipment",
        equipment: "machine_equipment",
        mold: "mold",
        material: "material",
        quality: "quality",
        maintenance: "maintenance",
        traceability: "traceability",
        reports: "reports",
        administration: "administration",
        configuration: "system_configuration",
    };

    const parts = permissionCode.split(".").filter(Boolean);
    const pagePrefix = parts[0];
    const pageAction = parts[parts.length - 1];
    const moduleCode = moduleByPagePrefix[pagePrefix];

    // In the fixed backend permission set, `create` is the write/edit right.
    const moduleAction = pageAction === "view" ? "view" : "create";
    const fixedPermissionCode = moduleCode
        ? `${moduleCode}.${moduleAction}`
        : permissionCode;

    return permissions.includes(fixedPermissionCode);
}
export function logout() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(MES_ACCESS_KEY);
}
