import "./locales";
import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { Box, IconButton, InputAdornment, LinearProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from "@mui/material";
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
import { KpiTile, downloadCsv } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, cardSx, ddmmhhmm, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { label, tx } from "../moldLocales";
import { MoldPageFrame, useMoldData, useMoldPage } from "../moldPage";
import { Timeline } from "../moldParts";
import { ALERT_LEVEL_COLORS, LOCATION_COLORS, LOCATION_TYPES, LocationPill, MOLD_API, MoldRowMenu, MoldStatusPill, QuickActionGrid, hoursText } from "../moldUi";

const LOCATION_ALERTS = ["NO_LOCATION", "REPAIR_LONG", "MAINTENANCE_LONG", "WRONG_LOCATION", "INACTIVE_30D"];
const AREA_ICONS = { STORAGE: WarehouseOutlinedIcon, MAINTENANCE: EngineeringOutlinedIcon, REPAIR: BuildCircleOutlinedIcon, SCRAP: DeleteSweepOutlinedIcon, NOT_ASSIGNED: HelpOutlineIcon };

export default function MoldLocation() {
  const page = useMoldPage();
  const { navigate, params, setParams, dark, axisColor, tableSx, canEdit, request } = page;
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
  const locSeries = LOCATION_TYPES.map((t) => [t, counts[t] || 0]);
  const nodes = data?.nodes || [];
  const fullNodes = nodes.filter((n) => n.capacity && n.used / n.capacity >= 0.9);
  const alerts = [
    ...LOCATION_ALERTS.map((code) => ({ code, molds: all.filter((m) => m.alerts.some((a) => a.code === code)), level: code === "REPAIR_LONG" ? "CRITICAL" : "WARNING" })),
    { code: "CAPACITY_90", molds: [], nodes: fullNodes, level: "WARNING" },
  ];
  const withSel = (path) => `${path}?mold=${selectedId}`;
  const exportCsv = () => downloadCsv("mold-location.csv", ["Mold", "Name", "Type", "Cavity", "Location type", "Machine / Rack", "Status", "Since", "Duration (h)"],
    items.map((m) => [m.mold_code, m.mold_name, m.mold_type, m.cavity_count, label("locationType", m.location_type), m.machine_code || m.location_label, label("moldStatus", m.status), m.location_since, m.since_hours]));
  const quick = [
    [tx("View Detail"), VisibilityOutlinedIcon, "#1570EF", () => navigate(`/mold-management/detail?mold=${selectedId}`), !selectedId],
    [tx("Mold Status"), FactCheckOutlinedIcon, "#F79009", () => navigate("/mold-management/status"), false],
    [tx("Shot Counter"), SpeedOutlinedIcon, "#7A5AF8", () => navigate(withSel("/mold-management/shot-counter")), !selectedId],
    [tx("Installation History"), HistoryOutlinedIcon, "#2E90FA", () => navigate(withSel("/mold-management/installation-history")), !selectedId],
    [tx("Move Location"), SwapHorizOutlinedIcon, "#12B76A", () => page.openAction("move", sel), !canEdit || !sel || Boolean(sel?.current_machine_id)],
    [tx("Maintenance History"), EngineeringOutlinedIcon, "#0E9384", () => navigate(`/mold-management/detail?mold=${selectedId}#maintenance`), !selectedId],
    [tx("Create PM Schedule"), CalendarMonthOutlinedIcon, "#F04438", () => navigate(`/maintenance-management/planning?create=1&asset_type=MOLD${selectedId ? `&asset_id=${selectedId}` : ""}`), false],
  ];
  const isArea = (a) => area && a.type === area.type && (a.nodeId || null) === (area.nodeId || null) && (a.machineId || null) === (area.machineId || null);
  const pick = (a) => setArea((o) => (o && isArea(a) ? null : a));
  const areaBox = (type, children, span) => {
    const color = LOCATION_COLORS[type];
    const Icon = AREA_ICONS[type] || ViewModuleOutlinedIcon;
    return (
      <Box sx={{ gridColumn: span, border: 1.5, borderColor: `${color}88`, borderRadius: 2, p: 1, bgcolor: `${color}0D`, minWidth: 0 }}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mb: 0.75, cursor: "pointer" }} onClick={() => pick({ type })}>
          <Icon sx={{ fontSize: 18, color }} /><Typography variant="caption" fontWeight={800} sx={{ color, flex: 1 }}>{label("locationType", type).toUpperCase()}</Typography>
          <Box sx={{ minWidth: 28, px: 0.75, borderRadius: 1, border: 1.5, borderColor: color, textAlign: "center", fontWeight: 800, fontSize: 13, color, bgcolor: isArea({ type }) ? `${color}30` : "background.paper" }}>{counts[type] || 0}</Box>
        </Stack>
        {children}
      </Box>
    );
  };
  const chip = (text, count, color, a, sub) => (
    <Box key={text} onClick={() => pick(a)} sx={{ border: 1, borderColor: color, borderRadius: 1.5, px: 0.75, py: 0.5, textAlign: "center", cursor: "pointer", bgcolor: isArea(a) ? `${color}30` : "background.paper", minWidth: 0 }}>
      <Typography variant="caption" fontWeight={700} sx={{ display: "block", fontSize: 10.5 }} noWrap>{text}</Typography>
      <Typography variant="caption" fontWeight={800} sx={{ color, display: "block" }} noWrap>{count}</Typography>
      {sub ? <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9.5 }} noWrap>{sub}</Typography> : null}
    </Box>
  );

  return (
    <MoldPageFrame page={page} title={tx("Mold Location")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} system={data?.system} onChanged={() => load({ silent: true })}>
      {data ? (
        <>
          <Box sx={{ mb: 1.5 }}>
            <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(4, minmax(0,1fr))", xl: "repeat(7, minmax(0,1fr))" }}>
              <KpiTile tone="primary" title={tx("Total Molds")} value={num(total)} sub="100%" icon={InventoryOutlinedIcon} onClick={() => setArea(null)} />
              <KpiTile tone="success" title={tx("In Machine")} value={num(counts.MACHINE)} sub={pct(counts.MACHINE || 0)} icon={PrecisionManufacturingOutlinedIcon} onClick={() => pick({ type: "MACHINE" })} />
              <KpiTile tone="info" title={tx("In Storage")} value={num(counts.STORAGE)} sub={pct(counts.STORAGE || 0)} icon={WarehouseOutlinedIcon} onClick={() => pick({ type: "STORAGE" })} />
              <KpiTile tone="accent" title={tx("In Maintenance")} value={num(counts.MAINTENANCE)} sub={pct(counts.MAINTENANCE || 0)} icon={EngineeringOutlinedIcon} onClick={() => pick({ type: "MAINTENANCE" })} />
              <KpiTile tone="danger" title={tx("In Repair")} value={num(counts.REPAIR)} sub={pct(counts.REPAIR || 0)} icon={BuildCircleOutlinedIcon} onClick={() => pick({ type: "REPAIR" })} />
              <KpiTile tone="primary" title={tx("In Scrap Area")} value={num(counts.SCRAP)} sub={pct(counts.SCRAP || 0)} icon={DeleteSweepOutlinedIcon} onClick={() => pick({ type: "SCRAP" })} />
              <KpiTile tone="warning" title={tx("Location Not Assigned")} value={num(counts.NOT_ASSIGNED)} sub={counts.NOT_ASSIGNED ? tx("Need attention") : ""} icon={HelpOutlineIcon} onClick={() => pick({ type: "NOT_ASSIGNED" })} />
            </KpiCardGroup>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,2.2fr) minmax(0,1fr) minmax(0,1fr)" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Location Map Overview")} subtitle={area ? `· ${area.label || label("locationType", area.type)}` : ""} />
              <Box sx={{ px: 1.5, pb: 1.5, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(6, minmax(0,1fr))" }, gap: 1 }}>
                {areaBox("MACHINE", (
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(78px, 1fr))", gap: 0.75 }}>
                    {data.machines.map((mc) => chip(mc.equipment_code, mc.mold_code || tx("empty"), mc.mold_code ? LOCATION_COLORS.MACHINE : "#98A2B3", { type: "MACHINE", machineId: mc.id, label: mc.equipment_code }, mc.area_name))}
                  </Box>
                ), "1 / -1")}
                {areaBox("STORAGE", (
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(78px, 1fr))", gap: 0.75 }}>
                    {nodes.filter((n) => n.location_category === "STORAGE").map((n) => chip(n.node_code, n.capacity ? `${n.used}/${n.capacity}` : n.used, LOCATION_COLORS.STORAGE, { type: "STORAGE", nodeId: n.id, label: n.node_name }, n.node_name))}
                  </Box>
                ), { xs: "auto", md: "span 3" })}
                {areaBox("MAINTENANCE", (
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(78px, 1fr))", gap: 0.75 }}>
                    {nodes.filter((n) => n.location_category === "MAINTENANCE").map((n) => chip(n.node_code, n.capacity ? `${n.used}/${n.capacity}` : n.used, LOCATION_COLORS.MAINTENANCE, { type: "MAINTENANCE", nodeId: n.id, label: n.node_name }))}
                  </Box>
                ), { xs: "auto", md: "span 3" })}
                {areaBox("REPAIR", (
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(78px, 1fr))", gap: 0.75 }}>
                    {nodes.filter((n) => n.location_category === "REPAIR").map((n) => chip(n.node_code, n.capacity ? `${n.used}/${n.capacity}` : n.used, LOCATION_COLORS.REPAIR, { type: "REPAIR", nodeId: n.id, label: n.node_name }))}
                  </Box>
                ), { xs: "auto", md: "span 2" })}
                {areaBox("SCRAP", (
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(78px, 1fr))", gap: 0.75 }}>
                    {nodes.filter((n) => n.location_category === "SCRAP").map((n) => chip(n.node_code, n.capacity ? `${n.used}/${n.capacity}` : n.used, LOCATION_COLORS.SCRAP, { type: "SCRAP", nodeId: n.id, label: n.node_name }))}
                  </Box>
                ), { xs: "auto", md: "span 2" })}
                {areaBox("NOT_ASSIGNED", (
                  <Typography variant="caption" color="text.secondary">{all.filter((m) => m.location_type === "NOT_ASSIGNED").map((m) => m.mold_code).join(", ") || EMPTY}</Typography>
                ), { xs: "auto", md: "span 2" })}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", px: 1.5, pb: 1 }}>{tx("Click an area to filter the list.")}</Typography>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Location Status by Type")} />
              <Box sx={{ px: 1, pb: 1 }}>
                <Chart type="donut" height={180} series={locSeries.map(([, n]) => n)} options={{
                  labels: locSeries.map(([t]) => label("locationType", t)), colors: locSeries.map(([t]) => LOCATION_COLORS[t]), legend: { show: false }, dataLabels: { enabled: false },
                  chart: { background: "transparent" }, stroke: { width: 1, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light" },
                  plotOptions: { pie: { donut: { size: "68%", labels: { show: true, name: { color: axisColor }, value: { fontSize: "20px", fontWeight: 800, color: dark ? "#fff" : "#101828" },
                    total: { show: true, label: tx("Total"), color: axisColor, formatter: () => String(total) } } } } } }} />
                <Stack spacing={0.5} sx={{ px: 1 }}>{locSeries.map(([t, n]) => (
                  <Stack key={t} direction="row" spacing={1} sx={{ alignItems: "center", cursor: "pointer" }} onClick={() => pick({ type: t })}><Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: LOCATION_COLORS[t] }} />
                    <Typography variant="caption" sx={{ flex: 1 }}>{label("locationType", t)}</Typography><Typography variant="caption" fontWeight={800}>{n} ({num((n / (total || 1)) * 100, 1)}%)</Typography></Stack>))}</Stack>
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Alert Summary")} />
              <Box sx={{ px: 1.5, pb: 1.5 }}>
                {alerts.map((a) => {
                  const n = a.code === "CAPACITY_90" ? a.nodes.length : a.molds.length;
                  return (
                    <Stack key={a.code} direction="row" spacing={1} sx={{ alignItems: "flex-start", py: 0.75, borderBottom: 1, borderColor: "divider", opacity: n ? 1 : 0.55 }}>
                      <WarningAmberOutlinedIcon sx={{ fontSize: 18, color: n ? ALERT_LEVEL_COLORS[a.level] : "#98A2B3" }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" fontWeight={700} sx={{ display: "block" }}>{a.code === "CAPACITY_90" ? `${tx("Storage Capacity")} > 90%` : label("alert", a.code)}</Typography>
                        <Typography variant="caption" sx={{ color: "#1570EF", fontSize: 10.5 }}>{a.code === "CAPACITY_90" ? a.nodes.map((x) => x.node_code).join(", ") : a.molds.map((m) => m.mold_code).join(", ")}</Typography>
                      </Box>
                      <Typography variant="subtitle2" fontWeight={800}>{n}</Typography>
                    </Stack>
                  );
                })}
              </Box>
            </Paper>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,2.2fr) minmax(0,1fr) minmax(0,1fr)" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Mold Location List")} subtitle={`(${items.length})`} action={
                <TextField size="small" placeholder={tx("Search mold, product, machine...")} value={q} onChange={(e) => setQ(e.target.value)} sx={{ width: 230 }}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />} />
              <Box sx={{ px: 1, pb: 1, height: 400, overflow: "auto" }}>
                <Table size="small" stickyHeader sx={tableSx}>
                  <TableHead><TableRow>
                    <TableCell>{tx("Mold No.")}</TableCell><TableCell>{tx("Mold Name")}</TableCell><TableCell>{tx("Mold Type")}</TableCell><TableCell align="center">{tx("Cavity")}</TableCell>
                    <TableCell align="center">{tx("Current Location")}</TableCell><TableCell>{tx("Machine / Rack")}</TableCell><TableCell align="center">{tx("Status")}</TableCell>
                    <TableCell>{tx("Since")}</TableCell><TableCell>{tx("Duration")}</TableCell><TableCell align="center">{tx("Action")}</TableCell>
                  </TableRow></TableHead>
                  <TableBody>{items.map((m) => (
                    <TableRow key={m.id} hover selected={m.id === selectedId} onClick={() => setParams({ mold: String(m.id) })} onDoubleClick={() => navigate(`/mold-management/detail?mold=${m.id}`)} sx={{ cursor: "pointer" }}>
                      <TableCell sx={{ fontWeight: 800, color: "#1570EF" }}>{m.mold_code}</TableCell><TableCell sx={{ maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis" }}>{m.mold_name}</TableCell>
                      <TableCell>{m.mold_type || EMPTY}</TableCell><TableCell align="center">{m.cavity_count}</TableCell>
                      <TableCell align="center"><LocationPill value={m.location_type} /></TableCell>
                      <TableCell>{m.location_type === "MACHINE" ? `${m.machine_code}${m.machine_area ? ` · ${m.machine_area}` : ""}` : m.location_code ? `${m.location_code} · ${m.location_name}` : EMPTY}</TableCell>
                      <TableCell align="center"><MoldStatusPill value={m.status} /></TableCell>
                      <TableCell>{ddmmhhmm(m.location_since)}</TableCell><TableCell>{hoursText(m.since_hours)}</TableCell>
                      <TableCell align="center" padding="none">
                        <Tooltip title={tx("Location History")}><IconButton size="small" onClick={(e) => { e.stopPropagation(); setParams({ mold: String(m.id) }); }}><HistoryOutlinedIcon fontSize="small" sx={{ color: "#2E90FA" }} /></IconButton></Tooltip>
                        {canEdit ? <Tooltip title={tx("Move Location")}><span><IconButton size="small" disabled={Boolean(m.current_machine_id)} onClick={(e) => { e.stopPropagation(); page.openAction("move", m); }}><SwapHorizOutlinedIcon fontSize="small" sx={{ color: m.current_machine_id ? undefined : "#12B76A" }} /></IconButton></span></Tooltip> : null}
                        <MoldRowMenu mold={m} canEdit={canEdit} navigate={navigate} onAction={page.openAction} />
                      </TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </Box>
            </Paper>
            <Stack spacing={1.5}>
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Storage Capacity")} />
                <Box sx={{ px: 1.5, pb: 1.5 }}>
                  {!data.capacity.length ? <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography> : data.capacity.map((c) => (
                    <Box key={c.category} sx={{ mb: 1 }}>
                      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                        <Typography variant="caption" fontWeight={700}>{label("locationType", c.category)}</Typography>
                        <Typography variant="caption" fontWeight={800}>{c.used} / {c.capacity} · {num(c.pct, 0)}%</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={Math.min(c.pct, 100)} sx={{ height: 8, borderRadius: 4, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: c.pct >= 90 ? "#F04438" : LOCATION_COLORS[c.category] } }} />
                    </Box>
                  ))}
                </Box>
              </Paper>
              <Paper elevation={0} sx={{ ...cardSx, flex: 1 }}>
                <Head title={tx("Molds by Location Type")} />
                <Box sx={{ px: 1, pb: 1 }}>
                  <Table size="small" sx={tableSx}>
                    <TableHead><TableRow><TableCell>{tx("Location Type")}</TableCell><TableCell align="right">{tx("Count")}</TableCell><TableCell align="right">{tx("Percentage")}</TableCell></TableRow></TableHead>
                    <TableBody>
                      {locSeries.map(([t, n]) => <TableRow key={t}><TableCell>{label("locationType", t)}</TableCell><TableCell align="right">{n}</TableCell><TableCell align="right">{num((n / (total || 1)) * 100, 1)}%</TableCell></TableRow>)}
                      <TableRow><TableCell sx={{ fontWeight: 800 }}>{tx("Total")}</TableCell><TableCell align="right" sx={{ fontWeight: 800 }}>{total}</TableCell><TableCell align="right" sx={{ fontWeight: 800 }}>100%</TableCell></TableRow>
                    </TableBody>
                  </Table>
                </Box>
              </Paper>
            </Stack>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Location History")} subtitle={sel ? `(${sel.mold_code})` : ""} />
              <Box sx={{ px: 1.5, pb: 1.5, maxHeight: 520, overflow: "auto" }}>
                {sel ? <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>{sel.mold_code} · {sel.mold_name}</Typography> : null}
                <Timeline events={history} dated max={40} />
              </Box>
            </Paper>
          </Box>

          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Quick Actions")} subtitle={sel ? `(${sel.mold_code})` : ""} />
            <Box sx={{ px: 1.5, pb: 1.5 }}><QuickActionGrid actions={quick} columns="repeat(auto-fill, minmax(130px, 1fr))" /></Box>
          </Paper>
        </>
      ) : null}
    </MoldPageFrame>
  );
}
