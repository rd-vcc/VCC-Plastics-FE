// In-app notifications API. The signed-in user is sent automatically as the X-MES-User header (auth/apiIdentity.js).
import { useCallback, useEffect, useState } from "react";
import { API_CONFIG } from "../../../config/config";
import { getCurrentUser } from "../../../auth/auth";

const BASE = `${API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "")}/api/notifications`;
const CHANGED = "vcc:notifications-changed";
const POLL_MS = 30000;

function who() {
  const code = getCurrentUser()?.employee_code;
  return code ? `employee_code=${encodeURIComponent(code)}` : "";
}

async function call(path, init) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE}${path}${sep}${who()}`, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const fetchNotifications = ({ limit = 50, unread = false } = {}) =>
  call(`?limit=${limit}${unread ? "&unread=true" : ""}`);

export async function markNotificationsRead(ids) {
  const out = await call("/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: ids || null }) });
  window.dispatchEvent(new Event(CHANGED));
  return out;
}

/** Loads the user's notifications, refreshes every 30 s and whenever another component marks some read. */
export function useNotifications({ limit = 50, unread = false } = {}) {
  const [data, setData] = useState({ unread: 0, items: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    if (!getCurrentUser()) return Promise.resolve();
    return fetchNotifications({ limit, unread })
      .then((d) => { setData(d); setError(""); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [limit, unread]);
  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    const onChange = () => load();
    window.addEventListener(CHANGED, onChange);
    window.addEventListener("focus", onChange);
    return () => { clearInterval(timer); window.removeEventListener(CHANGED, onChange); window.removeEventListener("focus", onChange); };
  }, [load]);
  return { ...data, error, loading, reload: load };
}

export const SEVERITY_COLORS = { CRITICAL: "#F04438", WARNING: "#F79009", INFO: "#1570EF" };

export function timeAgo(value, t) {
  if (!value) return "";
  const at = new Date(String(value).replace(" ", "T"));
  const min = Math.max(0, Math.round((Date.now() - at.getTime()) / 60000));
  if (min < 1) return t("notifications.justNow");
  if (min < 60) return t("notifications.minutesAgo", { count: min });
  if (min < 1440) return t("notifications.hoursAgo", { count: Math.round(min / 60) });
  return t("notifications.daysAgo", { count: Math.round(min / 1440) });
}

export const eventTitle = (n, t) => t(`notifications.events.${n.event_code}`, { defaultValue: n.title });
