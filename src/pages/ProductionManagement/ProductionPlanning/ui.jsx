import { Children } from "react";
import { Box, Chip, IconButton, Typography, createTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { buttonSystem } from "../../../components/button/ButtonSystem";
import { label, tx } from "./locales";

export const EMPTY = "—";
// A person is always shown as "Full name - employee code"; the code alone when the name is unknown (e.g. SYSTEM).
export const person = (name, code) => (name ? `${name} - ${code}` : code || EMPTY);
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
    <Box sx={{ px: 2, py: 1.25, display: "flex", alignItems: "center", gap: 1.25, borderBottom: 1, borderColor: "divider",
      bgcolor: (theme) => theme.palette.mode === "dark" ? (tone === "danger" ? "rgba(238,27,27,0.10)" : "rgba(0,91,171,0.14)") : (tone === "danger" ? "#FFF3F3" : "#F1F7FF") }}>
      <Box sx={{ width: 28, height: 28, borderRadius: "50%",
        bgcolor: (theme) => theme.palette.mode === "dark" ? (tone === "danger" ? "#4C1D1D" : "#173A63") : (tone === "danger" ? "#FDECEC" : "#EEF4FF"),
        color: toneColor, display: "grid", placeItems: "center", flexShrink: 0 }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" fontWeight={800} noWrap title={typeof title === "string" ? title : undefined}>{title}</Typography>
        {subtitle ? <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.35 }}>{subtitle}</Typography> : null}
      </Box>
      <IconButton size="small" disabled={disabled} onClick={onClose} sx={{ mr: -0.5 }}><CloseIcon fontSize="small" /></IconButton>
    </Box>
  );
}

// Quick Actions: one tile style and one size on every production page (icon above a one-line label).
export const QUICK_TILE = { width: 120, height: 48 };

export function QuickAction({ icon: Icon, text, color = "#1570EF", onClick, disabled, primary }) {
  return (
    <Box component="button" type="button" disabled={disabled} onClick={disabled ? undefined : onClick} title={text}
      sx={{ width: QUICK_TILE.width, height: QUICK_TILE.height, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.4, px: 0.5,
        border: 1, borderColor: primary && !disabled ? "primary.main" : "divider", borderRadius: 1.5, bgcolor: primary && !disabled ? "rgba(21,112,239,.06)" : "background.paper",
        color: disabled ? "text.disabled" : primary ? "primary.main" : "text.primary", font: "inherit", fontSize: 10.5, fontWeight: 700, lineHeight: 1.2,
        cursor: disabled ? "default" : "pointer", transition: "border-color .15s, background-color .15s",
        "&:hover": disabled ? {} : { borderColor: color, bgcolor: `${color}12` } }}>
      <Icon sx={{ fontSize: 19, color: disabled ? "action.disabled" : color }} />
      <Box component="span" sx={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{text}</Box>
    </Box>
  );
}

// Lays the tiles out in rows of `columns` and spreads the free space evenly between the tiles and all four
// edges of the box (a short last row is centred). Tiles keep their fixed size.
export function QuickActions({ children, columns = 4, sx }) {
  const tiles = Children.toArray(children);
  const rows = [];
  for (let i = 0; i < tiles.length; i += columns) rows.push(tiles.slice(i, i + columns));
  return (
    <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "space-evenly", gap: 0.75, ...sx }}>
      {rows.map((row, i) => <Box key={i} sx={{ display: "flex", justifyContent: "space-evenly", gap: 0.75 }}>{row}</Box>)}
    </Box>
  );
}

export function Head({ title, subtitle, action }) {
  return (
    // Fixed height so card titles line up across a row whether or not a card has an action.
    <Box sx={{ height: 36, flexShrink: 0, px: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
      <Typography variant="subtitle2" fontWeight={800} noWrap>
        {title}{subtitle ? <Typography component="span" variant="subtitle2" fontWeight={500} color="text.secondary"> {subtitle}</Typography> : null}
      </Typography>
      {action ? <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0, "& .MuiButton-root": { py: 0, minHeight: 0, height: 24 } }}>{action}</Box> : null}
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
  return <Chip size="small" label={label("priority", value)} sx={{ height: 20, width: 76, fontSize: 10, fontWeight: 800, color, bgcolor: `${color}1A`, "& .MuiChip-label": { px: 0.5 } }} />;
}

export function PlanStatusChip({ value }) {
  return <Chip size="small" variant="outlined" color={PLAN_STATUS_TONES[value] || "default"} label={tx(value)} sx={{ height: 22, width: 104, fontSize: 10, fontWeight: 800, "& .MuiChip-label": { px: 0.5 } }} />;
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
