import { Box, Button, Stack, Tooltip, Typography } from "@mui/material";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import AcUnitOutlinedIcon from "@mui/icons-material/AcUnitOutlined";
import ArchitectureOutlinedIcon from "@mui/icons-material/ArchitectureOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import ThreeDRotationOutlinedIcon from "@mui/icons-material/ThreeDRotationOutlined";
import UnfoldMoreDoubleOutlinedIcon from "@mui/icons-material/UnfoldMoreDoubleOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";

import { resolveImageUrl } from "../../components/common/ImageUploadField";
import { EMPTY, ddmmhhmm, hhmm, num } from "../ProductionManagement/ProductionPlanning/ui";
import { label, tx } from "./moldLocales";
import { ALERT_LEVEL_COLORS, InfoGrid, MOLD_STATUS_COLORS, MoldImage, MoldStatusPill, dateText, pmText } from "./moldUi";

const DOC_BUTTONS = [
  ["3D View", ThreeDRotationOutlinedIcon, "MODEL_3D"], ["Part View", CategoryOutlinedIcon, "PART"], ["BOM", AccountTreeOutlinedIcon, "BOM"],
  ["Cooling", AcUnitOutlinedIcon, "COOLING_LAYOUT"], ["Ejection", UnfoldMoreDoubleOutlinedIcon, "EJECTION_LAYOUT"], ["Drawing", ArchitectureOutlinedIcon, "DRAWING"],
];
export const openDoc = (doc) => window.open(resolveImageUrl(doc.file_url), "_blank", "noopener");
export const materialOf = (attrs) => (attrs || []).find((a) => /steel|material/i.test(`${a.attribute_code} ${a.attribute_name}`))?.value;

/** Digital twin block: image, identity / technical data and quick access to the technical documents. */
export function DigitalTwin({ mold, attributes, documents, onDocuments, imageHeight = 190, compact }) {
  if (!mold) return <Typography variant="caption" color="text.secondary">{tx("Select a mold in the list.")}</Typography>;
  const docs = documents || [];
  const dims = [mold.length_mm, mold.width_mm, mold.height_mm].every((v) => v != null) ? `${num(mold.length_mm, 0)} x ${num(mold.width_mm, 0)} x ${num(mold.height_mm, 0)} mm` : EMPTY;
  return (
    <Box>
      <Box sx={{ display: "grid", gridTemplateColumns: compact ? "1fr" : { xs: "1fr", sm: "minmax(0,1fr) minmax(0,1.1fr)" }, gap: 1.5, alignItems: "center" }}>
        <MoldImage src={mold.image_url} height={imageHeight} iconSize={90} />
        {compact ? null : (
          <InfoGrid rows={[[tx("Mold No."), mold.mold_code, "#1570EF"], [tx("Mold Name"), mold.mold_name], [tx("Mold Type"), mold.mold_type], [tx("Cavity"), mold.cavity_count],
            [tx("Material"), materialOf(attributes)], [tx("Mold Weight"), mold.weight_kg != null ? `${num(mold.weight_kg, 0)} kg` : null], [tx("Dimension (L x W x H)"), dims],
            [tx("Manufacturer"), mold.manufacturer], [tx("Manufacture Date"), dateText(mold.manufacture_date)]]} />
        )}
      </Box>
      <Stack direction="row" sx={{ mt: 1.25, gap: 0.5, flexWrap: "wrap" }}>
        {DOC_BUTTONS.map(([text, Icon, type]) => {
          const doc = docs.find((d) => d.doc_type === type);
          return (
            <Tooltip key={type} title={doc ? doc.title : tx("No document of this type.")}><span>
              <Button size="small" disabled={!doc} onClick={() => openDoc(doc)} sx={{ flexDirection: "column", minWidth: 58, textTransform: "none", fontSize: 10.5, fontWeight: 700, color: "text.primary", border: 1, borderColor: "divider", borderRadius: 1.5, py: 0.5 }}>
                <Icon sx={{ fontSize: 20, color: doc ? "#1570EF" : "action.disabled" }} />{tx(text)}</Button></span></Tooltip>
          );
        })}
        <Button size="small" onClick={onDocuments} sx={{ flexDirection: "column", minWidth: 58, textTransform: "none", fontSize: 10.5, fontWeight: 700, color: "text.primary", border: 1, borderColor: "divider", borderRadius: 1.5, py: 0.5 }}>
          <FolderOpenOutlinedIcon sx={{ fontSize: 20, color: "#F79009" }} />{tx("Documents")} ({docs.length})</Button>
      </Stack>
    </Box>
  );
}

export function PmDueList({ items, onOpen, max = 6 }) {
  if (!items.length) return <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography>;
  return (
    <Stack>
      {items.slice(0, max).map((p) => {
        const color = p.pm_overdue || p.pm_days_left <= 2 ? "#F04438" : "#F79009";
        return (
          <Stack key={p.id} direction="row" spacing={1} onClick={() => onOpen(p)} sx={{ alignItems: "center", py: 0.7, borderBottom: 1, borderColor: "divider", cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}>
            <WarningAmberOutlinedIcon sx={{ fontSize: 18, color }} />
            <Typography variant="caption" fontWeight={800} sx={{ flex: 1, color: "#1570EF" }}>{p.mold_code}</Typography>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="caption" fontWeight={700} sx={{ color, display: "block" }}>{pmText(p)}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5 }}>{label("maintenanceType", p.pm_type)} · {dateText(p.pm_due_date)}</Typography>
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
}

export function eventText(e) {
  const parts = [label("eventType", e.event_type)];
  if (e.event_type === "INSTALL") parts.push(e.machine_code);
  if (e.event_type === "REMOVE") parts.push(e.machine_code);
  if (e.event_type === "MOVE" || e.to_location) parts.push(`${e.from_location || EMPTY} → ${e.to_location || EMPTY}`);
  if (e.event_type === "SHOT_ADJUST") parts.push(`${num(e.shot_before)} → ${num(e.shot_after)}`);
  if (e.maintenance_type) parts.push(label("maintenanceType", e.maintenance_type));
  return parts.filter(Boolean).join(" · ");
}

/** REMOVE events store "REASON_CODE: remark"; show the translated reason. */
export function reasonText(e) {
  if (!e.reason) return "";
  if (e.event_type !== "REMOVE") return e.reason;
  const [, code, rest] = String(e.reason).match(/^([A-Z_]+)(?::\s*(.*))?$/) || [];
  return code ? [label("removalReason", code), rest].filter(Boolean).join(": ") : e.reason;
}

export function Timeline({ events, onOpen, dated, max = 12 }) {
  if (!events.length) return <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography>;
  return (
    <Box>
      {events.slice(0, max).map((e, i) => {
        const color = MOLD_STATUS_COLORS[e.to_status] || (e.event_type === "MOVE" ? "#2E90FA" : "#98A2B3");
        return (
          <Box key={e.id} sx={{ display: "grid", gridTemplateColumns: dated ? "88px 14px 1fr" : "42px 14px 1fr", gap: 0.75, cursor: onOpen ? "pointer" : "default" }} onClick={() => onOpen?.(e)}>
            <Typography variant="caption" color="text.secondary" sx={{ pt: 0.2 }}>{dated ? ddmmhhmm(e.event_at) : hhmm(e.event_at)}</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color, mt: 0.5 }} />
              {i < Math.min(events.length, max) - 1 ? <Box sx={{ flex: 1, width: 2, bgcolor: "divider", my: 0.25 }} /> : null}
            </Box>
            <Box sx={{ pb: 1, minWidth: 0 }}>
              {dated ? null : <Typography variant="caption" fontWeight={800} sx={{ color: "#1570EF", display: "block" }}>{e.mold_code}</Typography>}
              <Typography variant="caption" sx={{ display: "block" }}>{eventText(e)}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5 }}>{reasonText(e) ? `${reasonText(e)} · ` : ""}{e.technician || e.actor}</Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

export function AlertSummary({ alerts, onOpen }) {
  if (!alerts.length) return <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography>;
  return (
    <Stack>
      {alerts.map((a) => {
        const level = a.molds.some((m) => m.level === "CRITICAL") ? "CRITICAL" : "WARNING";
        return (
          <Stack key={a.code} direction="row" spacing={1} sx={{ alignItems: "center", py: 0.7, borderBottom: 1, borderColor: "divider" }}>
            {level === "CRITICAL" ? <BuildCircleOutlinedIcon sx={{ fontSize: 18, color: ALERT_LEVEL_COLORS[level] }} /> : <WarningAmberOutlinedIcon sx={{ fontSize: 18, color: ALERT_LEVEL_COLORS[level] }} />}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" fontWeight={700} sx={{ display: "block" }}>{label("alert", a.code)}</Typography>
              <Stack direction="row" sx={{ gap: 0.5, flexWrap: "wrap" }}>
                {a.molds.slice(0, 6).map((m) => <Typography key={m.id} variant="caption" onClick={() => onOpen(m)} sx={{ color: "#1570EF", cursor: "pointer", fontSize: 10.5, fontWeight: 700 }}>{m.mold_code}</Typography>)}
              </Stack>
            </Box>
            <Typography variant="subtitle2" fontWeight={800}>{a.count}</Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}

export function StatusLegend() {
  return (
    <Stack direction="row" sx={{ gap: 2, flexWrap: "wrap" }}>
      {["IN_PRODUCTION", "AVAILABLE", "IN_MAINTENANCE", "IN_REPAIR", "RETIRED", "LOCKED"].map((s) => <MoldStatusPill key={s} value={s} />)}
    </Stack>
  );
}
