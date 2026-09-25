import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Autocomplete, Box, Button, Dialog, DialogContent, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import SearchIcon from "@mui/icons-material/Search";

import { getCurrentUser } from "../../auth/auth";
import { resolveImageUrl } from "../../components/common/ImageUploadField";
import usePagePermission from "../../auth/usePagePermission";
import { API_CONFIG } from "../../config/config";
import { useTheme as useAppTheme } from "../../context/ThemeContext";
import { useRequest } from "../MaterialManagement/materialUi";
import { DialogHeader, EMPTY, btn, cardSx, ddmmhhmm, dialogPaperSx, num, pageTheme } from "../ProductionManagement/ProductionPlanning/ui";
import { setActiveLanguage as setMaintLanguage } from "../MaintenanceManagement/maintLocales";
import { MaintFrame, useMaintData } from "../MaintenanceManagement/maintPage";
import { label, setActiveLanguage, tx } from "./traceLocales";

const BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
export const TRACE_API = `${BASE}/api/traceability`;
export const TraceFrame = MaintFrame;
export const useTraceData = useMaintData;

export const STATUS_COLORS = { PASS: "#12B76A", DONE: "#12B76A", HOLD: "#F04438", FAIL: "#F04438", PENDING: "#F79009", NA: "#98A2B3", NOT_REQUIRED: "#98A2B3",
  IN_STOCK: "#12B76A", CONSUMED: "#667085", RESERVED: "#2E90FA", QUARANTINE: "#F79009", EXPIRED: "#F04438", OPEN: "#2E90FA", CLOSED: "#12B76A",
  IN_PRODUCTION: "#2E90FA", ON_HOLD: "#F04438", COMPLETED: "#12B76A", RELEASED: "#667085", OK: "#12B76A", NG: "#F04438" };

export function useTracePage() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  setMaintLanguage(language);
  const { theme } = useAppTheme();
  const muiTheme = useMemo(() => pageTheme(theme), [theme]);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { canEdit } = usePagePermission();
  const u = getCurrentUser();
  const actor = u?.full_name ? `${u.full_name} (${u.employee_code})` : u?.employee_code || "SYSTEM";
  const request = useRequest();
  const [lookups, setLookups] = useState(null);
  const [msg, setMsg] = useState({ open: false, type: "success", text: "" });
  const notify = useCallback((type, text) => setMsg({ open: true, type, text }), []);
  useEffect(() => { request(`${TRACE_API}/lookups`).then(setLookups).catch(() => {}); }, [request]);
  const dark = theme === "dark";
  return {
    language, dark, muiTheme, navigate, params, setParams, canEdit, actor, request, lookups, msg, setMsg, notify,
    axisColor: dark ? "#A7B0C0" : "#667085", grid: { borderColor: dark ? "#263244" : "#EEF2F6" },
    tableSx: { "& td, & th": { fontSize: 11.5, px: 0.75, py: 0.5, whiteSpace: "nowrap" }, "& th": { color: "text.secondary", fontWeight: 800, bgcolor: "background.paper" } },
  };
}

/** Navigation target of a reference {type, id}. */
export const refPath = (ref) => {
  if (!ref?.id) return null;
  return {
    PRODUCT_LOT: `/traceability/product?lot_id=${ref.id}`, MATERIAL_LOT: `/traceability/material?lot_id=${ref.id}`,
    WO: `/production-management/work-orders/management?wo=${ref.id}`, MACHINE: `/machine-equipment/machine-detail?machine=${ref.id}`,
    MOLD: `/mold-management/detail?mold=${ref.id}`, INSPECTION: `/quality-management/inspection-management?plan=${ref.id}`,
  }[ref.type] || null;
};

export const dateText = (v) => (v ? String(v).slice(0, 10).split("-").reverse().join("/") : EMPTY);
export const qty = (v, unit) => (v == null ? EMPTY : `${num(v, 3)}${unit ? ` ${unit}` : ""}`);

export const StatusPill = ({ value, group = "status", width = 104 }) => {
  const color = STATUS_COLORS[value] || "#667085";
  return (
    <Box component="span" title={label(group, value)} sx={{ display: "inline-block", width, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      verticalAlign: "middle", px: 0.5, py: 0.2, borderRadius: 1, fontSize: 11, fontWeight: 700, color, bgcolor: `${color}1A`, border: `1px solid ${color}55` }}>{label(group, value)}</Box>
  );
};

export function Link({ children, to, navigate, bold = true }) {
  if (!to) return <span>{children ?? EMPTY}</span>;
  return <Typography component="span" variant="caption" sx={{ color: "#1570EF", cursor: "pointer", fontWeight: bold ? 700 : 400, fontSize: "inherit" }}
    onClick={(e) => { e.stopPropagation(); navigate(to); }}>{children}</Typography>;
}

/** Search panel: search-by select + key with suggestions. */
export function SearchPanel({ options, by, setBy, value, setValue, suggestions, onSearch, extra, tips }) {
  return (
    <Paper elevation={0} sx={{ ...cardSx, p: 1.5 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1.5fr) minmax(0,1fr)" }, gap: 2 }}>
        <Stack direction="row" sx={{ gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <TextField select size="small" label={tx("Search By")} value={by} onChange={(e) => setBy(e.target.value)} sx={{ width: 180 }}>
            {options.map((o) => <MenuItem key={o} value={o}>{label("searchBy", o)}</MenuItem>)}
          </TextField>
          <Autocomplete freeSolo size="small" options={suggestions || []} value={value} onInputChange={(e, v) => setValue(v)} sx={{ flex: 1, minWidth: 220 }}
            renderInput={(p) => <TextField {...p} label={tx("Lot / Code / Barcode")} onKeyDown={(e) => { if (e.key === "Enter") onSearch(); }} />} />
          {extra}
          <Button startIcon={<SearchIcon />} onClick={onSearch} disabled={!value?.trim()} sx={btn("primary")}>{tx("Search")}</Button>
        </Stack>
        <Box sx={{ borderLeft: { lg: 1 }, borderColor: "divider", pl: { lg: 2 } }}>
          <Typography variant="caption" fontWeight={800}>{tx("Search Tips")}</Typography>
          {(tips || []).map((t) => <Typography key={t} variant="caption" color="text.secondary" sx={{ display: "block" }}>• {t}</Typography>)}
        </Box>
      </Box>
    </Paper>
  );
}

/** Horizontal chain of cards with arrows. nodes: [{key, title, sub, extra, status, ref}] */
export function Chain({ nodes, icons, navigate }) {
  return (
    <Box sx={{ display: "flex", alignItems: "stretch", gap: 0.5, overflowX: "auto", pb: 0.5 }}>
      {nodes.map((n, i) => {
        const Icon = icons[n.key];
        const to = refPath(n.ref);
        const color = STATUS_COLORS[n.status] || "#12B76A";
        const na = n.status === "NA";
        return (
          <Box key={n.key} sx={{ display: "flex", alignItems: "center", gap: 0.5, flex: "1 1 0", minWidth: 128 }}>
            <Box onClick={() => to && navigate(to)} sx={{ flex: 1, border: 1, borderColor: "divider", borderRadius: 2, p: 1, textAlign: "center", minHeight: 150, cursor: to ? "pointer" : "default",
              opacity: na ? 0.55 : 1, bgcolor: "background.paper", "&:hover": to ? { borderColor: "#1570EF" } : undefined }}>
              <Box sx={{ position: "relative", display: "inline-block" }}>
                {Icon ? <Icon sx={{ fontSize: 40, color: na ? "#98A2B3" : "#344054" }} /> : null}
                {!na ? <CheckCircleIcon sx={{ position: "absolute", right: -6, bottom: -2, fontSize: 16, color, bgcolor: "background.paper", borderRadius: "50%" }} /> : null}
              </Box>
              <Typography variant="caption" fontWeight={800} sx={{ display: "block", mt: 0.5 }}>{label("node", n.key)}</Typography>
              <Typography variant="caption" sx={{ display: "block", color: to ? "#1570EF" : "text.primary", fontWeight: 700, overflowWrap: "anywhere", lineHeight: 1.3, mt: 0.5 }}>
                {n.key === "IQC" || n.key === "INSPECTION" ? label("status", n.title) : n.title === "Not integrated" ? tx("Not integrated") : n.title}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 10.5, overflowWrap: "anywhere" }}>{n.sub}</Typography>
              {n.extra ? <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 10.5 }}>{n.extra}</Typography> : null}
            </Box>
            {i < nodes.length - 1 ? <ArrowForwardIcon sx={{ color: "text.secondary", fontSize: 18, flexShrink: 0 }} /> : null}
          </Box>
        );
      })}
    </Box>
  );
}

/** Vertical timeline [{at, kind, text, qty, unit, actor, result}]. */
export function TraceTimeline({ events, max }) {
  const list = max ? events.slice(-max) : events;
  if (!list?.length) return <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography>;
  return (
    <Box>
      {list.map((e, i) => (
        <Box key={i} sx={{ display: "grid", gridTemplateColumns: "88px 14px 1fr auto", gap: 0.75, alignItems: "start" }}>
          <Typography variant="caption" color="text.secondary" sx={{ pt: 0.2 }}>{ddmmhhmm(e.at)}</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
            <FiberManualRecordIcon sx={{ fontSize: 12, mt: 0.4, color: e.result === "NG" || e.kind === "NG" ? "#F04438" : "#12B76A" }} />
            {i < list.length - 1 ? <Box sx={{ flex: 1, width: 2, bgcolor: "divider", minHeight: 14 }} /> : null}
          </Box>
          <Box sx={{ pb: 0.9, minWidth: 0 }}>
            <Typography variant="caption" fontWeight={700} sx={{ display: "block", lineHeight: 1.3 }}>{label("event", e.kind)}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5, overflowWrap: "anywhere" }}>{e.text}{e.qty ? ` · ${e.qty > 0 ? "+" : ""}${num(e.qty, 3)} ${e.unit || ""}` : ""}</Typography>
          </Box>
          <Typography variant="caption" sx={{ fontSize: 10, border: 1, borderColor: "divider", borderRadius: 1, px: 0.5, color: "text.secondary", whiteSpace: "nowrap" }}>{e.actor || "Auto"}</Typography>
        </Box>
      ))}
    </Box>
  );
}

/** Related documents: available ones open, missing ones are shown greyed out. */
export function Documents({ docs, navigate }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 0.75 }}>
      {(docs || []).map((d, i) => {
        const to = d.ref ? refPath(d.ref) : null;
        const open = () => (d.url ? window.open(resolveImageUrl(d.url), "_blank", "noopener") : to ? navigate(to) : null);
        return (
          <Button key={i} disabled={!d.available} onClick={open} title={d.available ? d.title || label("doc", d.kind) : tx("Not available yet")}
            sx={{ flexDirection: "column", gap: 0.4, py: 1, border: 1, borderColor: "divider", borderRadius: 1.5, textTransform: "none", fontSize: 11, fontWeight: 700, color: "text.primary", minWidth: 0 }}>
            <DescriptionOutlinedIcon sx={{ color: d.available ? "#1570EF" : "action.disabled" }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{d.title || label("doc", d.kind)}</span>
          </Button>
        );
      })}
    </Box>
  );
}

/** Key information grid of small boxes: items [[label, value, to]] */
export function KeyGrid({ items, navigate, columns = 4 }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`, gap: 0.75 }}>
      {items.map(([k, v, to]) => (
        <Box key={k} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, px: 1, py: 0.75, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 10 }}>{k}</Typography>
          <Typography variant="caption" fontWeight={700} sx={{ display: "block", overflowWrap: "anywhere" }}>{to ? <Link to={to} navigate={navigate}>{v}</Link> : v ?? EMPTY}</Typography>
        </Box>
      ))}
    </Box>
  );
}

export function HistoryDialog({ rows, onClose, onPick }) {
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<HistoryOutlinedIcon />} title={tx("Trace History")} onClose={onClose} />
      <DialogContent sx={{ pt: "12px !important" }}>
        <Box sx={{ maxHeight: 460, overflow: "auto" }}>
          <Table size="small" stickyHeader sx={{ "& td, & th": { fontSize: 11.5, px: 0.75, py: 0.5 } }}>
            <TableHead><TableRow><TableCell>{tx("Time")}</TableCell><TableCell>{tx("Search By")}</TableCell><TableCell>{tx("Keyword")}</TableCell><TableCell>{tx("Result")}</TableCell>
              <TableCell align="right">{tx("Time (s)")}</TableCell><TableCell>{tx("User")}</TableCell></TableRow></TableHead>
            <TableBody>{rows.map((r) => (
              <TableRow key={r.id} hover sx={{ cursor: r.found ? "pointer" : "default" }} onClick={() => r.found && onPick(r)}>
                <TableCell>{ddmmhhmm(r.created_at)}</TableCell><TableCell>{label("searchBy", r.search_by)}</TableCell><TableCell sx={{ fontWeight: 700 }}>{r.keyword}</TableCell>
                <TableCell sx={{ color: r.found ? "#12B76A" : "#F04438", fontWeight: 700 }}>{r.found ? r.result_ref : tx("Not found")}</TableCell>
                <TableCell align="right">{num(r.duration_ms / 1000, 2)}</TableCell><TableCell>{r.actor || EMPTY}</TableCell></TableRow>
            ))}</TableBody>
          </Table>
          {!rows.length ? <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography> : null}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export const vsYesterday = (a, b, unit = "") => {
  if (a == null || b == null) return tx("today");
  const d = Math.round((a - b) * 100) / 100;
  return `${d === 0 ? "=" : d > 0 ? "▲" : "▼"} ${num(Math.abs(d), 2)}${unit} ${tx("vs yesterday")}`;
};
