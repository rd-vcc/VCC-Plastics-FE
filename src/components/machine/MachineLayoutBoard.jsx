import { useRef, useState } from "react";
import { Badge, Box, Tooltip, Typography } from "@mui/material";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import SettingsInputComponentOutlinedIcon from "@mui/icons-material/SettingsInputComponentOutlined";

import { resolveImageUrl } from "../common/ImageUploadField";

export const LAYOUT_STATUS_COLORS = { RUNNING: "#12B76A", IDLE: "#F79009", DOWN: "#F04438", MAINTENANCE: "#2E90FA", OFFLINE: "#98A2B3" };
const clamp = (v) => Math.min(97, Math.max(3, v));

/** Auto grid for equipment that has no saved position yet (layout_x / layout_y = null). */
export function withPositions(items) {
  const unplaced = items.filter((i) => i.layout_x == null || i.layout_y == null);
  const cols = Math.max(1, Math.ceil(Math.sqrt(unplaced.length * 1.8)));
  const rows = Math.max(1, Math.ceil(unplaced.length / cols));
  return items.map((i) => {
    if (i.layout_x != null && i.layout_y != null) return { ...i, x: i.layout_x, y: i.layout_y, auto: false };
    const k = unplaced.indexOf(i);
    return { ...i, x: ((k % cols) + 0.5) / cols * 100, y: (Math.floor(k / cols) + 0.5) / rows * 100, auto: true };
  });
}

/**
 * Factory floor plan: the area's layout image with equipment markers at layout_x / layout_y (% of the image).
 * View mode: click a marker. Edit mode (System Configuration): drag markers, onMove(id, x, y) on drop.
 */
export default function MachineLayoutBoard({ image, items, editable = false, onMove, onSelect, selectedId, minHeight = 320, emptyText, renderTooltip, statusLabel }) {
  const boardRef = useRef(null);
  const [drag, setDragState] = useState(null);
  const dragRef = useRef(null);
  const setDrag = (d) => { dragRef.current = d; setDragState(d); };
  const placed = withPositions(items);

  const pointFrom = (e) => {
    const r = boardRef.current.getBoundingClientRect();
    return { x: clamp(((e.clientX - r.left) / r.width) * 100), y: clamp(((e.clientY - r.top) / r.height) * 100) };
  };
  const down = (e, it) => {
    if (!editable) return;
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* synthetic events have no active pointer */ }
    setDrag({ id: it.id, x: it.x, y: it.y });
  };
  const move = (e) => { if (dragRef.current) setDrag({ ...dragRef.current, ...pointFrom(e) }); };
  const up = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const p = pointFrom(e);
    setDrag(null);
    onMove?.(d.id, Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100);
  };

  return (
    <Box ref={boardRef} onPointerMove={move} onPointerUp={up}
      sx={{ position: "relative", width: "100%", minHeight: image ? 0 : minHeight, borderRadius: 2, overflow: "hidden", border: 1, borderColor: "divider", userSelect: "none", touchAction: editable ? "none" : "auto",
        bgcolor: "action.hover", backgroundImage: image ? "none" : "linear-gradient(rgba(152,162,179,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(152,162,179,.18) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
      {image ? <Box component="img" src={resolveImageUrl(image)} alt="" draggable={false} sx={{ display: "block", width: "100%", height: "auto", minHeight: 200, objectFit: "contain", pointerEvents: "none" }} /> : null}
      {!image && emptyText ? <Typography variant="caption" color="text.secondary" sx={{ position: "absolute", right: 8, bottom: 6 }}>{emptyText}</Typography> : null}
      {placed.map((it) => {
        const pos = drag?.id === it.id ? drag : it;
        const color = LAYOUT_STATUS_COLORS[it.operational_status] || LAYOUT_STATUS_COLORS.OFFLINE;
        const Icon = it.category && it.category !== "MACHINE" ? SettingsInputComponentOutlinedIcon : PrecisionManufacturingOutlinedIcon;
        const marker = (
          <Box onPointerDown={(e) => down(e, it)} onClick={() => !editable && onSelect?.(it)}
            sx={{ position: "absolute", left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)", zIndex: drag?.id === it.id ? 5 : selectedId === it.id ? 4 : 2,
              cursor: editable ? (drag?.id === it.id ? "grabbing" : "grab") : "pointer", minWidth: 62, px: 0.75, py: 0.4, borderRadius: 1.5, textAlign: "center",
              bgcolor: "background.paper", border: 2, borderColor: color, borderStyle: editable && it.auto && drag?.id !== it.id ? "dashed" : "solid",
              boxShadow: selectedId === it.id ? `0 0 0 3px ${color}55` : "0 2px 6px rgba(15,23,42,.18)", transition: drag?.id === it.id ? "none" : "box-shadow .15s",
              "&:hover": { boxShadow: `0 0 0 3px ${color}40` } }}>
            <Badge color="error" badgeContent={it.alarms || 0} invisible={!it.alarms} sx={{ "& .MuiBadge-badge": { fontSize: 9, height: 15, minWidth: 15 } }}>
              <Box sx={{ width: 30, height: 22, borderRadius: 1, bgcolor: color, display: "grid", placeItems: "center", mx: "auto" }}><Icon sx={{ fontSize: 17, color: "#fff" }} /></Box>
            </Badge>
            <Typography sx={{ fontSize: 10.5, fontWeight: 800, lineHeight: 1.25, whiteSpace: "nowrap" }}>{it.equipment_code}</Typography>
          </Box>
        );
        return editable || !renderTooltip ? <Box key={it.id}>{marker}</Box> : (
          <Tooltip key={it.id} arrow placement="top" title={renderTooltip(it, statusLabel)}>{marker}</Tooltip>
        );
      })}
    </Box>
  );
}
