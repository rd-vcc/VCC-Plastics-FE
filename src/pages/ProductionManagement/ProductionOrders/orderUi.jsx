import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { PRIORITY_COLORS, num } from "../ProductionPlanning/ui";
import { label } from "./ProductionOrderList/locales";
import { WO_STATUS_COLORS } from "../WorkOrders/woStatus";

export const PROGRESS_COLORS = { ON_TRACK: "#12B76A", AT_RISK: "#F79009", DELAY: "#F04438", COMPLETED: "#7A5AF8", NOT_STARTED: "#98A2B3", CANCELLED: "#667085" };
export const STATUS_COLORS = { DRAFT: "#667085", RELEASED: "#2E90FA", SCHEDULING: "#0BA5EC", IN_PRODUCTION: "#12B76A", COMPLETED: "#7A5AF8", CLOSED: "#475467", CANCELLED: "#F04438" };
export { WO_STATUS_COLORS } from "../WorkOrders/woStatus";

// Fixed width so every badge in a column is the same size (short labels are not smaller).
function Pill({ color, text, outlined, width = 104 }) {
  return (
    <Box component="span" title={text} sx={{ display: "inline-block", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", verticalAlign: "middle", width, px: 0.5, py: 0.2, borderRadius: 1, fontSize: 11, fontWeight: 700, color, bgcolor: `${color}1A`, border: outlined ? `1px solid ${color}40` : "none", whiteSpace: "nowrap" }}>
      {text}
    </Box>
  );
}

export function StatusPill({ value }) {
  return <Pill outlined color={STATUS_COLORS[value] || "#667085"} text={label("status", value)} />;
}

export function PriorityPill({ value }) {
  return <Pill width={76} color={PRIORITY_COLORS[value] || "#667085"} text={label("priority", value)} />;
}

export function ProgressStatePill({ value }) {
  return <Pill outlined color={PROGRESS_COLORS[value] || "#667085"} text={label("progress", value)} />;
}

export function WoStatusPill({ value, text }) {
  return <Pill outlined color={WO_STATUS_COLORS[value] || "#667085"} text={text} />;
}

export function ProgressBar({ value, state, color }) {
  const tone = color || PROGRESS_COLORS[state] || "#2E90FA";
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", width: "100%" }}>
      <Typography variant="caption" sx={{ width: 42, textAlign: "right", fontWeight: 700, color: tone }}>{num(value, 1)}%</Typography>
      <LinearProgress variant="determinate" value={Math.min(Number(value) || 0, 100)} sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: tone, borderRadius: 3 } }} />
    </Stack>
  );
}
