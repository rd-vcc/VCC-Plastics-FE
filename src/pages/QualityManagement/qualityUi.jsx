import { Box, Stack, Typography } from "@mui/material";

import { API_CONFIG } from "../../config/config";
import { EMPTY, ddmmhhmm, num } from "../ProductionManagement/ProductionPlanning/ui";
import { label, tx } from "./qualityLocales";

const BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
export const API_BASE = BASE;
export const QUALITY_API = `${BASE}/api/quality`;

export const PLAN_STATUS_COLORS = { NOT_STARTED: "#F04438", IN_PROGRESS: "#F79009", COMPLETED: "#12B76A", OVERDUE: "#B42318", CANCELLED: "#98A2B3" };
export const NG_STATUS_COLORS = { NEW: "#F04438", INVESTIGATING: "#2E90FA", CA_IN_PROGRESS: "#7A5AF8", WAITING_VERIFICATION: "#F79009", CLOSED: "#12B76A", REOPENED: "#B42318" };
export const PRIORITY_COLORS = { CRITICAL: "#B42318", HIGH: "#F04438", MEDIUM: "#F79009", LOW: "#12B76A" };
export const ALERT_STATUS_COLORS = { NEW: "#F04438", ACKNOWLEDGED: "#F79009", IN_PROGRESS: "#2E90FA", RESOLVED: "#12B76A", CLOSED: "#98A2B3" };
export const EQUIP_STATE_COLORS = { IN_SERVICE: "#12B76A", DUE_SOON: "#F79009", OVERDUE: "#F04438", NOT_CALIBRATED: "#EAAA08", IN_CALIBRATION: "#2E90FA",
  UNDER_REPAIR: "#7A5AF8", OUT_OF_SERVICE: "#667085", SCRAPPED: "#98A2B3" };
export const CAL_STATUS_COLORS = { PLANNED: "#667085", DUE_SOON: "#F79009", IN_PROGRESS: "#2E90FA", COMPLETED: "#12B76A", OVERDUE: "#F04438", CANCELLED: "#98A2B3" };
export const QSTATUS_COLORS = { NORMAL: "#12B76A", ATTENTION: "#F79009", WARNING: "#F04438", CRITICAL: "#B42318" };
export const SPC_COLORS = { NORMAL: "#12B76A", WARNING: "#F79009", OUT_OF_CONTROL: "#F04438", NO_DATA: "#98A2B3" };
export const RESULT_COLORS = { OK: "#12B76A", NG: "#F04438", PASS: "#12B76A", ADJUSTED: "#2E90FA", FAIL: "#F04438" };
export const TYPE_COLORS = { IQC: "#F79009", IPQC: "#2E90FA", FQC: "#12B76A", OQC: "#7A5AF8", PATROL: "#0E9384", FAI: "#1570EF", LAST_PIECE: "#667085", AUDIT: "#EAAA08",
  OTHER: "#98A2B3", SPC: "#F04438", CUSTOMER: "#B42318", PRODUCTION: "#475467", VISION: "#6172F3", MACHINE: "#475467" };
export const PROCESS_COLORS = { INJECTION: "#2E90FA", COOLING: "#0E9384", TRIMMING: "#12B76A", ASSEMBLY: "#7A5AF8", INSPECTION: "#F79009", PACKING: "#EAAA08", INCOMING: "#667085" };
export const CHART_COLORS = ["#F04438", "#F79009", "#12B76A", "#2E90FA", "#7A5AF8", "#0E9384", "#98A2B3"];

const pillSx = (color, width) => ({
  display: "inline-block", width, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", verticalAlign: "middle",
  px: 0.5, py: 0.2, borderRadius: 1, fontSize: 11, fontWeight: 700, color, bgcolor: `${color}1A`, border: `1px solid ${color}55`,
});
export const Pill = ({ group, value, colors, width = 104 }) => <Box component="span" title={label(group, value)} sx={pillSx(colors[value] || "#667085", width)}>{label(group, value)}</Box>;
export const PlanStatusPill = ({ value }) => <Pill group="planStatus" value={value} colors={PLAN_STATUS_COLORS} />;
export const NgStatusPill = ({ value }) => <Pill group="ngStatus" value={value} colors={NG_STATUS_COLORS} />;
export const PriorityPill = ({ value }) => <Pill group="priority" value={value} colors={PRIORITY_COLORS} width={84} />;
export const SeverityPill = ({ value }) => <Pill group="priority" value={value} colors={PRIORITY_COLORS} width={84} />;
export const AlertStatusPill = ({ value }) => <Pill group="alertStatus" value={value} colors={ALERT_STATUS_COLORS} />;
export const EquipStatePill = ({ value }) => <Pill group="equipState" value={value} colors={EQUIP_STATE_COLORS} />;
export const CalStatusPill = ({ value }) => <Pill group="calStatus" value={value} colors={CAL_STATUS_COLORS} />;
export const QStatusPill = ({ value }) => <Pill group="qStatus" value={value} colors={QSTATUS_COLORS} />;
export const SpcStatusPill = ({ value }) => <Pill group="spcStatus" value={value} colors={SPC_COLORS} />;
export const TypePill = ({ value, group = "inspectionType" }) => <Pill group={group} value={value} colors={TYPE_COLORS} width={84} />;
export const ResultText = ({ value }) => (value ? <Typography component="span" variant="caption" sx={{ fontWeight: 800, color: RESULT_COLORS[value] || "text.primary" }}>{label("result", value)}</Typography> : EMPTY);

export const pctText = (v, d = 2) => (v == null ? EMPTY : `${num(v, d)}%`);
export const dateText = (v) => (v ? String(v).slice(0, 10).split("-").reverse().join("/") : EMPTY);
export const dueText = (days) => (days == null ? EMPTY : days < 0 ? tx("{n} days overdue", { n: -days }) : days === 0 ? tx("today") : tx("in {n} days", { n: days }));
export const whenText = (v) => (v ? (String(v).length > 10 ? ddmmhhmm(v) : dateText(v)) : EMPTY);
export const specText = (c) => {
  if (!c || (c.characteristic_type || "VARIABLE") === "ATTRIBUTE") return tx("OK / NG");
  const u = c.unit ? ` ${c.unit}` : "";
  return `${c.lsl ?? "—"} ~ ${c.usl ?? "—"}${u}`;
};

/** Trend arrow + change text (inherits the colour of the card it sits on). */
export function Change({ value, unit = "", suffix }) {
  if (value == null || Number.isNaN(value)) return <span>{suffix || ""}</span>;
  return <span style={{ fontWeight: 700 }}>{value === 0 ? "=" : value > 0 ? "▲" : "▼"} {num(Math.abs(value), 2)}{unit}{suffix ? ` ${suffix}` : ""}</span>;
}

/** Localised alert text: kind + object (the stored message stays as tooltip / detail). */
export const alertText = (a) => `${label("alertKind", a.kind)}${a.ref_code ? `: ${a.ref_code}` : ""}`;

export const changeOf = (a, b) => (a == null || b == null ? null : Math.round((a - b) * 100) / 100);
export const relChange = (a, b) => (a == null || b == null || !b ? null : Math.round(((a - b) / b) * 1000) / 10);

/** Timeline of events [{event_at, action, actor, note, to_status}]. */
export function Events({ events, group = "action", colors = NG_STATUS_COLORS }) {
  if (!events?.length) return <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography>;
  return (
    <Box>
      {events.map((e, i) => (
        <Box key={e.id || i} sx={{ display: "grid", gridTemplateColumns: "92px 14px 1fr", gap: 0.75 }}>
          <Typography variant="caption" color="text.secondary" sx={{ pt: 0.2 }}>{ddmmhhmm(e.event_at)}</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", mt: 0.5, bgcolor: colors[e.to_status] || "#98A2B3" }} />
            {i < events.length - 1 ? <Box sx={{ flex: 1, width: 2, bgcolor: "divider", my: 0.25 }} /> : null}
          </Box>
          <Box sx={{ pb: 1, minWidth: 0 }}>
            <Typography variant="caption" fontWeight={700} sx={{ display: "block" }}>{label(group, e.action)}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5, overflowWrap: "anywhere" }}>{e.actor}{e.note ? ` · ${e.note}` : ""}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

/** Small stat block used in panels. */
export function Stat({ title, value, color, sub }) {
  return (
    <Stack sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 1, minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" noWrap>{title}</Typography>
      <Typography variant="h6" fontWeight={800} sx={{ color, lineHeight: 1.2 }}>{value ?? EMPTY}</Typography>
      {sub ? <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5 }}>{sub}</Typography> : null}
    </Stack>
  );
}

export const toBase64 = (file) => new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = reject; r.readAsDataURL(file); });
