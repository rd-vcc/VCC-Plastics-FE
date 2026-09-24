import { useMemo } from "react";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { label, tx } from "./locales";

export const PROGRESS_COLORS = {
  ON_TRACK: "#12B76A",
  AHEAD: "#2E90FA",
  AT_RISK: "#F79009",
  DELAY: "#F04438",
  NOT_STARTED: "#98A2B3",
  COMPLETED: "#039855",
};

const LEGEND = ["ON_TRACK", "AHEAD", "AT_RISK", "DELAY", "NOT_STARTED"];
const ROW_HEIGHT = 30;
const COLUMNS = "minmax(300px, 42%) 1fr";
const LEFT_COLUMNS = "104px minmax(40px,1fr) 58px 50px";
// Horizontal inset of the time track so edge tick labels are not clipped.
const TRACK_INSET = "0 18px";

const two = (n) => String(n).padStart(2, "0");
const hhmm = (d) => `${two(d.getHours())}:${two(d.getMinutes())}`;

export default function PlanningGantt({ rows, rangeStart, rangeEnd, now, tickHours = 1, onSelect, height = 300 }) {
  const start = rangeStart.getTime();
  const span = Math.max(rangeEnd.getTime() - start, 1);
  const pct = (time) => ((time - start) / span) * 100;

  const ticks = useMemo(() => {
    const list = [];
    const first = new Date(rangeStart);
    first.setMinutes(0, 0, 0);
    if (first < rangeStart) first.setHours(first.getHours() + 1);
    for (let t = first.getTime(); t <= rangeEnd.getTime(); t += tickHours * 3600000) list.push(new Date(t));
    return list;
  }, [rangeStart, rangeEnd, tickHours]);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => new Date(a.planned_start) - new Date(b.planned_start) || a.wo_no.localeCompare(b.wo_no)),
    [rows],
  );
  const nowPct = now ? pct(now.getTime()) : null;
  const showNow = nowPct != null && nowPct >= 0 && nowPct <= 100;
  const labelEvery = ticks.length > 8 ? 2 : 1;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height, minHeight: 0 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: COLUMNS, borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: LEFT_COLUMNS, gap: 0.5, px: 1, py: 0.6 }}>
          {[tx("Work Order"), tx("Product"), tx("Machine"), tx("Qty (PCS)")].map((h, i) => (
            <Typography key={h} variant="caption" fontWeight={800} color="text.secondary" noWrap sx={{ textAlign: i === 3 ? "right" : "left" }}>{h}</Typography>
          ))}
        </Box>
        <Box sx={{ position: "relative", height: 28, borderLeft: 1, borderColor: "divider" }}>
          <Box sx={{ position: "absolute", inset: TRACK_INSET }}>
            {ticks.filter((_, i) => i % labelEvery === 0).map((t) => (
              <Typography key={t.getTime()} variant="caption" color="text.secondary"
                sx={{ position: "absolute", left: `${pct(t.getTime())}%`, top: 6, transform: "translateX(-50%)", fontSize: 10.5, whiteSpace: "nowrap" }}>
                {hhmm(t)}
              </Typography>
            ))}
            {showNow ? (
              <Box sx={{ position: "absolute", left: `${nowPct}%`, top: 3, transform: "translateX(-50%)", bgcolor: "#F04438", color: "#fff", px: 0.6, borderRadius: 0.75, fontSize: 10.5, fontWeight: 800, zIndex: 2 }}>
                {hhmm(now)}
              </Box>
            ) : null}
          </Box>
        </Box>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {sorted.length === 0 ? (
          <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}><Typography variant="body2" color="text.secondary">{tx("No data.")}</Typography></Box>
        ) : sorted.map((row) => {
          const s = new Date(row.planned_start).getTime();
          const e = new Date(row.planned_end).getTime();
          const left = Math.max(pct(s), 0);
          const right = Math.min(pct(e), 100);
          const visible = right > 0 && left < 100;
          const done = Math.min((Number(row.actual_qty) || 0) / Math.max(Number(row.planned_qty), 1), 1);
          const color = PROGRESS_COLORS[row.progress_state] || PROGRESS_COLORS.NOT_STARTED;
          return (
            <Box key={row.id} onClick={() => onSelect?.(row)}
              sx={{ display: "grid", gridTemplateColumns: COLUMNS, height: ROW_HEIGHT, cursor: "pointer", borderBottom: 1, borderColor: "divider", "&:hover": { bgcolor: "action.hover" } }}>
              <Box sx={{ display: "grid", gridTemplateColumns: LEFT_COLUMNS, gap: 0.5, px: 1, alignItems: "center", minWidth: 0, overflow: "hidden" }}>
                <Typography variant="caption" fontWeight={700} noWrap sx={{ color: "primary.main" }}>{row.wo_no}</Typography>
                <Typography variant="caption" noWrap title={row.product_name}>{row.product_name}</Typography>
                <Typography variant="caption" noWrap>{row.machine_code || "—"}</Typography>
                <Typography variant="caption" noWrap sx={{ textAlign: "right" }}>{Number(row.planned_qty).toLocaleString()}</Typography>
              </Box>
              <Box sx={{ position: "relative", borderLeft: 1, borderColor: "divider" }}>
                <Box sx={{ position: "absolute", inset: TRACK_INSET }}>
                  {ticks.map((t) => (
                    <Box key={t.getTime()} sx={{ position: "absolute", top: 0, bottom: 0, left: `${pct(t.getTime())}%`, borderLeft: "1px dashed", borderColor: "divider", opacity: 0.6 }} />
                  ))}
                  {showNow ? <Box sx={{ position: "absolute", top: 0, bottom: 0, left: `${nowPct}%`, borderLeft: "2px dashed #F04438", zIndex: 1, pointerEvents: "none" }} /> : null}
                  {visible ? (
                    <Tooltip arrow title={
                      <Box>
                        <Typography variant="caption" fontWeight={800} sx={{ display: "block" }}>{row.wo_no} · {label("progress", row.progress_state)}</Typography>
                        <Typography variant="caption" sx={{ display: "block" }}>{row.product_code} — {row.product_name}</Typography>
                        <Typography variant="caption" sx={{ display: "block" }}>{row.machine_code} · {row.mold_code || "—"}</Typography>
                        <Typography variant="caption" sx={{ display: "block" }}>{hhmm(new Date(s))} – {hhmm(new Date(e))}</Typography>
                        <Typography variant="caption" sx={{ display: "block" }}>{tx("Actual")}: {Number(row.actual_qty).toLocaleString()} / {Number(row.planned_qty).toLocaleString()}</Typography>
                      </Box>
                    }>
                      <Box sx={{ position: "absolute", top: 8, height: ROW_HEIGHT - 16, left: `${left}%`, width: `${Math.max(right - left, 0.6)}%`, borderRadius: 0.75, bgcolor: `${color}40`, border: `1px solid ${color}`, overflow: "hidden" }}>
                        <Box sx={{ width: `${done * 100}%`, height: "100%", bgcolor: color }} />
                      </Box>
                    </Tooltip>
                  ) : null}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Stack direction="row" spacing={2} sx={{ justifyContent: "center", pt: 0.75, flexShrink: 0, flexWrap: "wrap" }}>
        {LEGEND.map((k) => (
          <Stack key={k} direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: PROGRESS_COLORS[k] }} />
            <Typography variant="caption">{label("progress", k)}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
