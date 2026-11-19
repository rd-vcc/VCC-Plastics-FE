import "./locales";
import { useEffect, useMemo, useState } from "react";
import { Box, InputAdornment, LinearProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DeleteSweepOutlinedIcon from "@mui/icons-material/DeleteSweepOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlineOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import ViewModuleOutlinedIcon from "@mui/icons-material/ViewModuleOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, colShares, downloadExcel } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, ddmmhhmm, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { EmptyBody, QuickCard, cellsSx, fillSx, fitGridSx, panelSx } from "../../shared/onePage";
import { label, tx } from "../moldLocales";
import { MoldPageFrame, useMoldData, useMoldPage } from "../moldPage";
import { Timeline } from "../moldParts";
import { ALERT_LEVEL_COLORS, LOCATION_COLORS, LocationPill, MOLD_API, MoldRowMenu, MoldStatusPill, hoursText } from "../moldUi";

const LOCATION_ALERTS = ["NO_LOCATION", "REPAIR_LONG", "MAINTENANCE_LONG", "WRONG_LOCATION", "INACTIVE_30D"];
const AREA_ICONS = { STORAGE: WarehouseOutlinedIcon, MAINTENANCE: EngineeringOutlinedIcon, REPAIR: BuildCircleOutlinedIcon, SCRAP: DeleteSweepOutlinedIcon, NOT_ASSIGNED: HelpOutlineIcon };

export default function MoldLocation() {
  const page = useMoldPage();
  const { navigate, params, setParams, tableSx, canEdit, request } = page;
  const { data, loading, lastUpdate, live, setLive, load } = useMoldData(page, `${MOLD_API}/summary`);
  const [area, setArea] = useState(null);
  const [q, setQ] = useState("");
  const [history, setHistory] = useState([]);
  const all = data?.items || [];
  const selectedId = Number(params.get("mold")) || all[0]?.id || null;
  useEffect(() => {
    if (!selectedId) return;
    request(`${MOLD_API}/events?mold_id=${selectedId}&limit=60`).then((ev) => setHistory(ev.filter((e) => ["INSTALL", "REMOVE", "MOVE"].includes(e.event_type) || e.to_location))).catch(() => setHistory([]));
  }, [selectedId, request, lastUpdate]);

  const items = useMemo(() => all.filter((m) => (!area || (m.location_type === area.type && (!area.nodeId || m.current_location_id === area.nodeId) && (!area.machineId || m.current_machine_id === area.machineId)))
    && (!q || `${m.mold_code} ${m.mold_name} ${m.location_label || ""} ${m.machine_code || ""}`.toLowerCase().includes(q.toLowerCase()))), [all, area, q]);
  const k = data?.kpis || {};
  const total = k.total || 0;
  const pct = (n) => (total ? `${num((n / total) * 100, 1)}% ${tx("of total")}` : "");
  const sel = all.find((m) => m.id === selectedId);
  const counts = data?.location_counts || {};
  const nodes = data?.nodes || [];
  const fullNodes = nodes.filter((n) => n.capacity && n.used / n.capacity >= 0.9);
  const alerts = [
    ...LOCATION_ALERTS.map((code) => ({ code, molds: all.filter((m) => m.alerts.some((a) => a.code === code)), level: code === "REPAIR_LONG" ? "CRITICAL" : "WARNING" })),
    { code: "CAPACITY_90", molds: [], nodes: fullNodes, level: "WARNING" },
  ];
  const withSel = (path) => `${path}?mold=${selectedId}`;
  const exportCsv = () => downloadExcel("mold-location.csv", ["Mold", "Name", "Type", "Cavity", "Location type", "Machine / Rack", "Status", "Since", "Duration (h)"],
    items.map((m) => [m.mold_code, m.mold_name, m.mold_type, m.cavity_count, label("locationType", m.location_type), m.machine_code || m.location_label, label("moldStatus", m.status), m.location_since, m.since_hours]));
  const quick = [
    [tx("View Detail"), VisibilityOutlinedIcon, "#1570EF", () => navigate(`/mold-management/detail?mold=${selectedId}`), !selectedId],
    [tx("Mold Status"), FactCheckOutlinedIcon, "#F79009", () => navigate("/mold-management/status"), false],
    [tx("Shot Counter"), SpeedOutlinedIcon, "#7A5AF8", () => navigate(withSel("/mold-management/shot-counter")), !selectedId],
    [tx("Installation History"), HistoryOutlinedIcon, "#2E90FA", () => navigate(withSel("/mold-management/installation-history")), !selectedId],
    [tx("Move Location"), SwapHorizOutlinedIcon, "#12B76A", () => page.openAction("move", sel), !canEdit || !sel || Boolean(sel?.current_machine_id)],
    [tx("Create PM Schedule"), CalendarMonthOutlinedIcon, "#F04438", () => navigate(`/maintenance-management/planning?create=1&asset_type=MOLD${selectedId ? `&asset_id=${selectedId}` : ""}`), false],
  ];
  const isArea = (a) => area && a.type === area.type && (a.nodeId || null) === (area.nodeId || null) && (a.machineId || null) === (area.machineId || null);
  const pick = (a) => setArea((o) => (o && isArea(a) ? null : a));
  const areaBox = (type, children, span) => {
    const color = LOCATION_COLORS[type];
    const Icon = AREA_ICONS[type] || ViewModuleOutlinedIcon;
    return (
      <Box sx={{ gridColumn: span, border: 1, borderColor: `${color}88`, borderRadius: 1.5, p: 0.75, bgcolor: `${color}0D`, minWidth: 0 }}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mb: 0.5, cursor: "pointer" }} onClick={() => pick({ type })}>
          <Icon sx={{ fontSize: 14, color }} /><Typography variant="caption" fontWeight={800} noWrap sx={{ color, flex: 1, fontSize: 10.5 }}>{label("locationType", type).toUpperCase()}</Typography>
          <Box sx={{ minWidth: 24, px: 0.5, borderRadius: 1, border: 1, borderColor: color, textAlign: "center", fontWeight: 800, fontSize: 11, color, bgcolor: isArea({ type }) ? `${color}30` : "background.paper" }}>{counts[type] || 0}</Box>
        </Stack>
        {children}
      </Box>
    );
  };
  const chip = (text, count, color, a, sub) => (
    <Box key={text} onClick={() => pick(a)} title={sub || ""} sx={{ border: 1, borderColor: color, borderRadius: 1.5, px: 0.5, py: 0.25, textAlign: "center", cursor: "pointer", bgcolor: isArea(a) ? `${color}30` : "background.paper", minWidth: 0 }}>
      <Typography variant="caption" fontWeight={700} sx={{ display: "block", fontSize: 10 }} noWrap>{text}</Typography>
      <Typography variant="caption" fontWeight={800} sx={{ color, display: "block", fontSize: 10.5 }} noWrap>{count}</Typography>
    </Box>
  );
  const chips = (cat) => (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: 0.5 }}>
      {nodes.filter((n) => n.location_category === cat).map((n) => chip(n.node_code, n.capacity ? `${n.used}/${n.capacity}` : n.used, LOCATION_COLORS[cat], { type: cat, nodeId: n.id, label: n.node_name }, n.node_name))}
    </Box>
  );
  const toolbar = (
    <TextField size="small" placeholder={tx("Search mold, product, machine...")} value={q} onChange={(e) => setQ(e.target.value)} sx={{ width: 240 }}
      slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
  );
  const scroll = { flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1 };

  return (
    <MoldPageFrame fit page={page} title={tx("Mold Location")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} toolbar={toolbar} system={data?.system} onChanged={() => load({ silent: true })}>
      {data ? (
        <>
          <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(4, minmax(0,1fr))", xl: "repeat(7, minmax(0,1fr))" }}>
            <KpiTile tone="primary" title={tx("Total Molds")} value={num(total)} sub="100%" icon={InventoryOutlinedIcon} onClick={() => setArea(null)} />
            <KpiTile tone="success" title={tx("In Machine")} value={num(counts.MACHINE)} sub={pct(counts.MACHINE || 0)} icon={PrecisionManufacturingOutlinedIcon} onClick={() => pick({ type: "MACHINE" })} />
            <KpiTile tone="info" title={tx("In Storage")} value={num(counts.STORAGE)} sub={pct(counts.STORAGE || 0)} icon={WarehouseOutlinedIcon} onClick={() => pick({ type: "STORAGE" })} />
            <KpiTile tone="accent" title={tx("In Maintenance")} value={num(counts.MAINTENANCE)} sub={pct(counts.MAINTENANCE || 0)} icon={EngineeringOutlinedIcon} onClick={() => pick({ type: "MAINTENANCE" })} />
            <KpiTile tone="danger" title={tx("In Repair")} value={num(counts.REPAIR)} sub={pct(counts.REPAIR || 0)} icon={BuildCircleOutlinedIcon} onClick={() => pick({ type: "REPAIR" })} />
            <KpiTile tone="primary" title={tx("In Scrap Area")} value={num(counts.SCRAP)} sub={pct(counts.SCRAP || 0)} icon={DeleteSweepOutlinedIcon} onClick={() => pick({ type: "SCRAP" })} />
            <KpiTile tone="warning" title={tx("Location Not Assigned")} value={num(counts.NOT_ASSIGNED)} sub={counts.NOT_ASSIGNED ? tx("Need attention") : ""} icon={HelpOutlineIcon} onClick={() => pick({ type: "NOT_ASSIGNED" })} />
          </KpiCardGroup>

          <Box sx={{ ...fitGridSx, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" }, gridTemplateRows: { lg: "minmax(0,1.15fr) minmax(0,1fr) minmax(0,1fr)" } }}>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 4" } }}>
              <Head title={`${tx("Location Map Overview")}${area ? ` · ${area.label || label("locationType", area.type)}` : ""}`} action={(
                area ? <Typography variant="caption" sx={{ color: "#1570EF", cursor: "pointer", fontWeight: 700 }} onClick={() => setArea(null)}>{tx("Clear")}</Typography>
                  : <Typography variant="caption" color="text.secondary">{tx("Click an area to filter the list.")}</Typography>
              )} />
              <Box sx={{ ...scroll, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(6, minmax(0,1fr))" }, gap: 0.75, alignContent: "start" }}>
                {areaBox("MACHINE", (
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: 0.5 }}>
                    {data.machines.map((mc) => chip(mc.equipment_code, mc.mold_code || tx("empty"), mc.mold_code ? LOCATION_COLORS.MACHINE : "#98A2B3", { type: "MACHINE", machineId: mc.id, label: mc.equipment_code }, mc.area_name))}
                  </Box>
                ), "1 / -1")}
                {areaBox("STORAGE", chips("STORAGE"), { md: "span 2" })}
                {areaBox("MAINTENANCE", chips("MAINTENANCE"))}
                {areaBox("REPAIR", chips("REPAIR"))}
                {areaBox("SCRAP", chips("SCRAP"))}
                {areaBox("NOT_ASSIGNED", (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{all.filter((m) => m.location_type === "NOT_ASSIGNED").map((m) => m.mold_code).join(", ") || EMPTY}</Typography>
                ))}
              </Box>
            </Paper>
            <Paper elevation={0} sx={panelSx}>
              <Head title={tx("Alert Summary")} />
              <Box sx={scroll}>
                {alerts.map((a) => {
                  const n = a.code === "CAPACITY_90" ? a.nodes.length : a.molds.length;
                  return (
                    <Stack key={a.code} direction="row" spacing={1} sx={{ alignItems: "center", py: 0.4, borderBottom: 1, borderColor: "divider", opacity: n ? 1 : 0.55 }}>
                      <WarningAmberOutlinedIcon sx={{ fontSize: 14, color: n ? ALERT_LEVEL_COLORS[a.level] : "#98A2B3" }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" fontWeight={700} noWrap sx={{ display: "block" }}>{a.code === "CAPACITY_90" ? `${tx("Storage Capacity")} > 90%` : label("alert", a.code)}</Typography>
                        {n ? <Typography variant="caption" noWrap sx={{ display: "block", color: "#1570EF", fontSize: 10 }}>{a.code === "CAPACITY_90" ? a.nodes.map((x) => x.node_code).join(", ") : a.molds.map((m) => m.mold_code).join(", ")}</Typography> : null}
                      </Box>
                      <Typography variant="caption" fontWeight={800}>{n}</Typography>
                    </Stack>
                  );
                })}
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 3" }, gridRow: { lg: "2 / 4" }, minHeight: { xs: 320, lg: 0 } }}>
              <Head title={tx("Mold Location List")} action={<Typography variant="caption" color="text.secondary">{items.length} / {all.length} {tx("molds")}</Typography>} />
              {items.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(15, 19, 16, 19, 16, 11, 4) }}>
                    <TableHead><TableRow>
                      <TableCell>{tx("Mold No.")}</TableCell><TableCell>{tx("Mold Name")}</TableCell><TableCell align="center">{tx("Current Location")}</TableCell><TableCell>{tx("Machine / Rack")}</TableCell>
                      <TableCell align="center">{tx("Status")}</TableCell><TableCell>{tx("Duration")}</TableCell><TableCell />
                    </TableRow></TableHead>
                    <TableBody>{items.map((m) => {
                      const where = m.location_type === "MACHINE" ? `${m.machine_code}${m.machine_area ? ` · ${m.machine_area}` : ""}` : m.location_code ? `${m.location_code} · ${m.location_name}` : EMPTY;
                      return (
                        <TableRow key={m.id} hover selected={m.id === selectedId} onClick={() => setParams({ mold: String(m.id) })} onDoubleClick={() => navigate(`/mold-management/detail?mold=${m.id}`)} sx={{ cursor: "pointer" }}>
                          <TableCell sx={{ fontWeight: 800, color: "#1570EF" }}>{m.mold_code}</TableCell><TableCell title={m.mold_name}>{m.mold_name}</TableCell>
                          <TableCell align="center"><LocationPill value={m.location_type} /></TableCell>
                          <TableCell title={where}>{where}</TableCell>
                          <TableCell align="center"><MoldStatusPill value={m.status} /></TableCell>
                          <TableCell title={`${tx("Since")}: ${ddmmhhmm(m.location_since)}`}>{hoursText(m.since_hours)}</TableCell>
                          <TableCell align="center" padding="none" sx={{ textOverflow: "clip !important" }}><MoldRowMenu mold={m} canEdit={canEdit} navigate={navigate} onAction={page.openAction} /></TableCell>
                        </TableRow>
                      );
                    })}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "3" }, gridRow: { lg: "2 / 4" } }}>
              <Head title={sel ? `${tx("Location History")} · ${sel.mold_code}` : tx("Location History")} />
              {history.length ? <Box sx={scroll}><Timeline events={history} dated max={40} /></Box> : <EmptyBody text={tx("No data.")} />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "4" }, gridRow: { lg: "2" } }}>
              <Head title={tx("Storage Capacity")} />
              {data.capacity.length ? (
                <Box sx={{ ...scroll, display: "flex", flexDirection: "column", justifyContent: "space-evenly" }}>
                  {data.capacity.map((c) => (
                    <Box key={c.category}>
                      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                        <Typography variant="caption" fontWeight={700}>{label("locationType", c.category)}</Typography>
                        <Typography variant="caption" fontWeight={800}>{c.used} / {c.capacity} · {num(c.pct, 0)}%</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={Math.min(c.pct, 100)} sx={{ height: 7, borderRadius: 4, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: c.pct >= 90 ? "#F04438" : LOCATION_COLORS[c.category] } }} />
                    </Box>
                  ))}
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>
            <Box sx={{ gridColumn: { lg: "4" }, gridRow: { lg: "3" }, display: "flex", minHeight: 0, "& > *": { flex: 1 } }}>
              <QuickCard title={tx("Quick Actions")} actions={quick} columns={3} />
            </Box>
          </Box>
        </>
      ) : null}
    </MoldPageFrame>
  );
}
