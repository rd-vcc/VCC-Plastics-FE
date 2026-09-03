import { API_ENDPOINTS } from "../config/config";
const ACCESS_TOKEN_KEY = "vcc_plastics_access_token";
const USER_KEY = "vcc_plastics_user";
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
        throw new Error(errorData.error ||
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
export function logout() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}
