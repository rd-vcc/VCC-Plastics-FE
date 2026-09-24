import { Box, Chip, IconButton, Typography, createTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { buttonSystem } from "../../../components/button/ButtonSystem";
import { label, tx } from "./locales";

export const EMPTY = "—";
export const cardSx = { border: "1px solid", borderColor: "divider", borderRadius: 2, boxShadow: "0 1px 3px rgba(15,23,42,.06)", overflow: "hidden", bgcolor: "background.paper" };
export const dialogPaperSx = { borderRadius: 3, overflow: "hidden", boxShadow: (theme) => theme.palette.mode === "dark" ? "0 24px 60px rgba(0,0,0,.55)" : "0 24px 60px rgba(15,23,42,.18)" };

export const PRIORITY_COLORS = { URGENT: "#D92D20", HIGH: "#F04438", MEDIUM: "#F79009", LOW: "#12B76A" };
export const MATERIAL_COLORS = { ENOUGH: "#12B76A", RUNNING_LOW: "#F79009", SHORTAGE: "#F04438" };
export const SEVERITY_COLORS = { ERROR: "#F04438", WARNING: "#F79009", INFO: "#2E90FA" };
export const PLAN_STATUS_TONES = { DRAFT: "default", CONFIRMED: "info", PUBLISHED: "success", CANCELLED: "error" };

export function btn(type, extra = {}) {
  const s = buttonSystem[type] || buttonSystem.edit || { base: {} };
  return { ...(s.base || {}), ...(s.hover ? { "&:hover": s.hover } : {}), ...(s.active ? { "&:active": s.active } : {}), ...extra };
}

export function pageTheme(mode) {
  const dark = mode === "dark";
  return createTheme({
    palette: {
      mode,
      primary: { main: "#005BAB" },
      background: { default: dark ? "#0B1220" : "#F8FAFC", paper: dark ? "#111827" : "#FFF" },
      text: { primary: dark ? "#F3F4F6" : "#172033", secondary: dark ? "#A7B0C0" : "#667085" },
      divider: dark ? "#344054" : "#D0D5DD",
    },
    typography: { fontFamily: '"Bai Jamjuree", Inter, sans-serif' },
    components: {
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: dark ? "#0F172A" : "#FFFFFF",
            "& .MuiOutlinedInput-notchedOutline": {
              borderWidth: "1px !important", borderStyle: "solid !important",
              borderColor: `${dark ? "#3B4759" : "#CBD3DF"} !important`,
            },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: `${dark ? "#5B6B84" : "#98A2B3"} !important` },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderWidth: "2px !important", borderColor: "#005BAB !important" },
            "&.Mui-error .MuiOutlinedInput-notchedOutline": { borderColor: "#EE1B1B !important" },
          },
        },
      },
    },
  });
}

export function DialogHeader({ icon, title, subtitle, onClose, disabled, tone = "primary" }) {
  const toneColor = tone === "danger" ? "#EE1B1B" : "#005BAB";
  return (
    <Box sx={{ px: 3, pt: 2.5, pb: 2, display: "flex", alignItems: "center", gap: 1.5, borderBottom: 1, borderColor: "divider",
      bgcolor: (theme) => theme.palette.mode === "dark" ? (tone === "danger" ? "rgba(238,27,27,0.10)" : "rgba(0,91,171,0.14)") : (tone === "danger" ? "#FFF3F3" : "#F1F7FF") }}>
      <Box sx={{ width: 44, height: 44, borderRadius: "50%",
        bgcolor: (theme) => theme.palette.mode === "dark" ? (tone === "danger" ? "#4C1D1D" : "#173A63") : (tone === "danger" ? "#FDECEC" : "#EEF4FF"),
        color: toneColor, display: "grid", placeItems: "center", flexShrink: 0 }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" fontWeight={700} noWrap>{title}</Typography>
        {subtitle ? <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{subtitle}</Typography> : null}
      </Box>
      <IconButton size="small" disabled={disabled} onClick={onClose} sx={{ mr: -0.5 }}><CloseIcon fontSize="small" /></IconButton>
    </Box>
  );
}

export function Head({ title, subtitle, action }) {
  return (
    <Box sx={{ minHeight: 40, px: 1.5, pt: 1, pb: 0.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
      <Typography variant="subtitle2" fontWeight={800} noWrap>
        {title}{subtitle ? <Typography component="span" variant="subtitle2" fontWeight={500} color="text.secondary"> {subtitle}</Typography> : null}
      </Typography>
      {action}
    </Box>
  );
}

export function Dot({ color, text }) {
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, color }}>
      <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
      <Typography component="span" variant="caption" fontWeight={600} sx={{ color }}>{text}</Typography>
    </Box>
  );
}

export function PriorityChip({ value }) {
  const color = PRIORITY_COLORS[value] || "#667085";
  return <Chip size="small" label={label("priority", value)} sx={{ height: 20, width: 76, fontSize: 10.5, fontWeight: 800, color, bgcolor: `${color}1A`, "& .MuiChip-label": { px: 0.5 } }} />;
}

export function PlanStatusChip({ value }) {
  return <Chip size="small" variant="outlined" color={PLAN_STATUS_TONES[value] || "default"} label={tx(value)} sx={{ height: 22, width: 104, fontSize: 11, fontWeight: 800, "& .MuiChip-label": { px: 0.5 } }} />;
}

const two = (n) => String(n).padStart(2, "0");
export const hhmm = (value) => { if (!value) return EMPTY; const d = new Date(value); return `${two(d.getHours())}:${two(d.getMinutes())}`; };
export const ddmmhhmm = (value) => { if (!value) return EMPTY; const d = new Date(value); return `${two(d.getDate())}/${two(d.getMonth() + 1)} ${hhmm(d)}`; };
export const toInputDateTime = (value) => (value ? String(value).slice(0, 16) : "");
export const fromInputDateTime = (value) => (value ? `${value.length === 16 ? `${value}:00` : value}` : null);
export const localIsoDate = (d = new Date()) => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
export const num = (value, digits = 0) => (value == null || Number.isNaN(Number(value)) ? EMPTY : Number(value).toLocaleString(undefined, { maximumFractionDigits: digits }));

export function durationMinutes(qty, cavity, cycle, setup) {
  const shots = Math.ceil(Number(qty || 0) / Math.max(Number(cavity || 1), 1));
  return Math.round((shots * Number(cycle || 0) + Number(setup || 0) * 60) / 60);
}

export function fmtDuration(minutes) {
  if (minutes == null) return EMPTY;
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return h ? `${h}h${two(m)}` : `${m} ${tx("min")}`;
}
