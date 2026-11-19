import { useState } from "react";
import { Box, Divider, IconButton, Menu, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

/*
 * Shared layout of the System Configuration master-data pages:
 *   tree / categories (left) | list table (middle) | detail (right)
 * Change the numbers here to change every page at once.
 */
export const MASTER_PANEL_COLUMNS = { xs: "1fr", lg: "240px minmax(0,1fr) 300px" };
export const MASTER_PANEL_GAP = 1.5;

export const masterGridSx = {
  display: "grid",
  gridTemplateColumns: MASTER_PANEL_COLUMNS,
  gap: MASTER_PANEL_GAP,
};

export const panelSx = {
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 2,
  boxShadow: "0 1px 3px rgba(15,23,42,.06)",
  overflow: "hidden",
};

// Title bar on top of each panel: icon + title on the left, optional action on the right.
export function PanelHeader({ icon, title, action }) {
  return (
    <Box
      sx={{
        minHeight: 27,
        px: 1.25,
        flexShrink: 0,
        bgcolor: (theme) => (theme.palette.mode === "dark" ? "#182235" : "#EAF2FF"),
        borderBottom: 1,
        borderColor: "divider",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
      }}
    >
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", minWidth: 0 }}>
        {icon}
        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800 }}>{title}</Typography>
      </Stack>
      {action}
    </Box>
  );
}

/*
 * ⚙ button in the page header. Sizes are fixed here (not taken from the page theme)
 * so the button and its menu look the same on every page.
 *   items: [{ key, label, icon, onClick, disabled?, title?, divider? }]  (divider = line above the item)
 * One item → the button opens it directly (tooltip = its label); several → a menu.
 */
export function SettingsMenu({ items, title = "Cài đặt" }) {
  const [anchor, setAnchor] = useState(null);
  const list = items.filter(Boolean);
  const single = list.length === 1 ? list[0] : null;
  return (
    <>
      <Tooltip title={single ? single.label : title}>
        <IconButton
          onClick={(e) => (single ? single.onClick() : setAnchor(e.currentTarget))}
          sx={{ width: 29, height: 29, border: 1, borderColor: "divider", borderRadius: 2, color: "text.secondary", "& svg": { fontSize: 18 } }}
        >
          <SettingsOutlinedIcon />
        </IconButton>
      </Tooltip>
      {single ? null : (
        <Menu
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={() => setAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{ paper: { sx: { mt: 0.75, minWidth: 250, borderRadius: 2, border: 1, borderColor: "divider", boxShadow: "0 12px 32px rgba(15,23,42,.14)" } }, list: { sx: { py: 0.5 } } }}
        >
          {list.flatMap((item) => [
            item.divider ? <Divider key={`${item.key}-divider`} sx={{ my: "4px !important" }} /> : null,
            <MenuItem
              key={item.key}
              disabled={item.disabled}
              title={item.title}
              onClick={() => { setAnchor(null); item.onClick(); }}
              sx={{ minHeight: 29, px: 1.75, gap: 1.25, fontFamily: '"Bai Jamjuree", Inter, sans-serif', fontSize: 12, fontWeight: 500, lineHeight: 1.4 }}
            >
              <Box component="span" sx={{ width: 20, display: "inline-flex", justifyContent: "center", color: "text.secondary", "& svg": { fontSize: 16 } }}>{item.icon}</Box>
              {item.label}
            </MenuItem>,
          ]).filter(Boolean)}
        </Menu>
      )}
    </>
  );
}

// Count shown at the right of a tree / list row (machines per unit, products per family, codes per group…).
export function CountBadge({ value }) {
  const n = Number(value) || 0;
  return (
    <Box
      component="span"
      sx={{
        minWidth: 26,
        height: 20,
        px: 0.75,
        flexShrink: 0,
        boxSizing: "border-box",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 700,
        lineHeight: 1,
        color: n ? "#005BAB" : "text.disabled",
        bgcolor: n ? "rgba(0,91,171,0.10)" : "action.hover",
      }}
    >
      {n}
    </Box>
  );
}
