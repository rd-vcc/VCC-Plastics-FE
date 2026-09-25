/**
 * Adds the signed-in user to every call of the VCC Plastics API (X-MES-User / X-MES-User-Name / X-MES-Session),
 * so the backend Audit Log knows who did what. The backend has no token check yet: these headers identify, they do not authorize.
 */
import { API_CONFIG } from "../config/config";
import { getCurrentUser } from "./auth";

const BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");

function sessionId() {
  try {
    let id = sessionStorage.getItem("vcc_mes_session");
    if (!id) {
      id = `S-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem("vcc_mes_session", id);
    }
    return id;
  } catch {
    return "";
  }
}

export function identityHeaders() {
  const u = getCurrentUser();
  if (!u) return {};
  const code = String(u.employee_code || u.username || "");
  const name = u.full_name ? `${u.full_name} (${code})` : code;
  return { "X-MES-User": encodeURIComponent(code), "X-MES-User-Name": encodeURIComponent(name), "X-MES-Session": sessionId() };
}

export function installApiIdentity() {
  if (window.__vccIdentityInstalled) return;
  window.__vccIdentityInstalled = true;
  const original = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url || "";
    if (!url.startsWith(BASE)) return original(input, init);
    const extra = identityHeaders();
    if (!Object.keys(extra).length) return original(input, init);
    const headers = new Headers(init.headers || (typeof input !== "string" ? input.headers : undefined) || {});
    Object.entries(extra).forEach(([k, v]) => { if (!headers.has(k)) headers.set(k, v); });
    return original(input, { ...init, headers });
  };
}

/** Audit the logout before the session is cleared (fire and forget). */
export function auditLogout(user) {
  const u = user || getCurrentUser();
  if (!u) return;
  const code = String(u.employee_code || "");
  try {
    fetch(`${BASE}/api/auth/logout`, { method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
      body: JSON.stringify({ user_code: code, user_name: u.full_name ? `${u.full_name} (${code})` : code }) }).catch(() => {});
  } catch { /* ignore */ }
}
