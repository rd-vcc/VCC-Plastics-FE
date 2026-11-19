// Building blocks of the one-screen page layout (page fits 1920x~920, data scrolls inside its own card).
// Texts are passed in by the caller so every module keeps its own translations.
import { Box, Button, Paper, Typography } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

import { EMPTY, Head, QuickAction, QuickActions, btn, cardSx } from "../ProductionManagement/ProductionPlanning/ui";

/** Outer page box: a column exactly one screen high on large screens. */
export const fitPageSx = { display: "flex", flexDirection: "column", gap: 1, height: { lg: "calc(var(--app-vh, 100vh) - 74px)" }, minHeight: 0, minWidth: 0, "& > *": { flexShrink: 0 } };
/** Main grid area taking the height left under the toolbar / KPI row. */
export const fitGridSx = { flex: { lg: "1 1 0" }, minHeight: 0, display: "grid", gap: 1 };
/** A card that fills its grid cell. */
export const panelSx = { ...cardSx, display: "flex", flexDirection: "column", minHeight: { xs: 220, lg: 0 }, minWidth: 0 };
/** Scrolling body of a card (tables). */
export const fillSx = { flex: 1, minHeight: 0, overflow: "auto", px: 1, pb: 1 };
/** Compact table cells; pill columns are not cut with an ellipsis. Spread after the page tableSx. */
export const cellsSx = { "& .MuiTableCell-root": { px: 0.5 }, "& td:has(> span[title])": { textOverflow: "clip" } };
export const toolBtnSx = { ...btn("cancel"), bgcolor: "background.paper", border: 1, borderColor: "divider" };

export const EmptyBody = ({ text }) => (
  <Box sx={{ flex: 1, display: "grid", placeItems: "center", pb: 2 }}><Typography variant="caption" color="text.disabled">{text}</Typography></Box>
);

/** Filter toggle of the toolbar: highlighted while open or while any filter is set. */
export function FilterToggle({ open, count, onClick, label }) {
  return (
    <Button startIcon={<FilterListIcon />} onClick={onClick} sx={{ ...toolBtnSx, ...(open || count ? { borderColor: "primary.main", color: "primary.main" } : {}) }}>
      {label}{count ? ` (${count})` : ""}
    </Button>
  );
}

/** Quick Actions card filling its grid cell; actions = [text, Icon, color, onClick, disabled]. */
export function QuickCard({ title, actions, columns = 3 }) {
  return (
    <Paper elevation={0} sx={panelSx}>
      <Head title={title} />
      <QuickActions columns={columns} sx={{ flex: 1, pb: 1.25 }}>
        {actions.map(([text, Icon, color, onClick, disabled]) => <QuickAction key={text} icon={Icon} text={text} color={color} onClick={onClick} disabled={disabled} />)}
      </QuickActions>
    </Paper>
  );
}

/** Compact ApexCharts base options (legend hidden: show it as Dots in the card header). */
export const chartBase = (dark, axisColor) => ({
  chart: { background: "transparent", toolbar: { show: false }, zoom: { enabled: false }, fontFamily: '"Bai Jamjuree", sans-serif', parentHeightOffset: 0 },
  legend: { show: false }, dataLabels: { enabled: false }, tooltip: { theme: dark ? "dark" : "light" },
  grid: { borderColor: dark ? "#263244" : "#EEF2F6", strokeDashArray: 3, padding: { top: 0, right: 8, bottom: -4, left: 4 } },
  xaxis: { labels: { rotate: 0, hideOverlappingLabels: true, style: { colors: axisColor, fontSize: "10px" } }, axisBorder: { show: false }, axisTicks: { show: false } },
  yaxis: { labels: { style: { colors: axisColor, fontSize: "10px" } } },
});

/** A person stored as "Full name (code)" is shown as "Full name - code". */
export const who = (v) => { if (!v) return EMPTY; const m = /^(.*\S)\s*\(([^()]+)\)$/.exec(String(v)); return m ? `${m[1]} - ${m[2]}` : v; };
