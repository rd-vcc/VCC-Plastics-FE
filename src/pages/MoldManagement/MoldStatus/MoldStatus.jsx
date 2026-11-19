import "./locales";
import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { Box, InputAdornment, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, colShares, downloadExcel } from "../../MaterialManagement/materialUi";
import { Dot, EMPTY, Head, ddmmhhmm, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { EmptyBody, QuickCard, cellsSx, chartBase, fillSx, fitGridSx, panelSx } from "../../shared/onePage";
import { label, tx } from "../moldLocales";
import { MoldPageFrame, useMoldData, useMoldPage } from "../moldPage";
import { AlertSummary, Timeline } from "../moldParts";
import { HealthBadge, LOCATION_COLORS, LifeBar, MOLD_API, MOLD_STATUS_COLORS, MoldRowMenu, MoldStatusPill, REASON_COLORS, dateText, locationText } from "../moldUi";

const STATUS_ORDER = ["IN_PRODUCTION", "AVAILABLE", "IN_MAINTENANCE", "IN_REPAIR", "RETIRED", "SCRAPPED", "LOCKED"];

export default function MoldStatus() {
  const page = useMoldPage();
  const { navigate, dark, axisColor, tableSx, canEdit } = page;
  const { data, loading, lastUpdate, live, setLive, load } = useMoldData(page, `${MOLD_API}/summary`);
  const [statusFilter, setStatusFilter] = useState("");
  const [locFilter, setLocFilter] = useState(null);
  const [q, setQ] = useState("");
  const [sideView, setSideView] = useState("alerts");
  const [selectedId, setSelectedId] = useState(null);

  const all = data?.items || [];
  const items = useMemo(() => all.filter((m) => (!statusFilter || m.status === statusFilter || (statusFilter === "OUT_OF_SERVICE" && ["RETIRED", "SCRAPPED"].includes(m.status)))
    && (!locFilter || (locFilter.type === m.location_type && (!locFilter.label || locFilter.label === (m.location_label || "—"))))
    && (!q || `${m.mold_code} ${m.mold_name} ${m.product_name || ""} ${m.machine_code || ""} ${m.location_label || ""}`.toLowerCase().includes(q.toLowerCase()))), [all, statusFilter, locFilter, q]);
  const k = data?.kpis || {};
  const total = k.total || 0;
  const pct = (n) => (total ? `${num((n / total) * 100, 1)}% ${tx("of total")}` : "");
  const sel = all.find((m) => m.id === selectedId);
  useEffect(() => { if (!selectedId && items.length) setSelectedId(items[0].id); }, [selectedId, items]);
  const detailUrl = (id) => `/mold-management/detail?mold=${id}`;
  const withSel = (path) => `${path}${selectedId ? `?mold=${selectedId}` : ""}`;
  const types = data ? Object.entries(data.type_counts).sort((a, b) => b[1] - a[1]) : [];
  const byLoc = data?.status_by_location || [];
  const maxLoc = Math.max(1, ...byLoc.map((l) => l.total));
  const today = new Date().toISOString().slice(0, 10);
  const timeline = (data?.timeline || []).filter((e) => String(e.event_at).slice(0, 10) === today);
  const rowsFor = (list) => list.map((m) => [m.mold_code, m.mold_name, m.mold_type, m.product_name, locationText(m), label("moldStatus", m.status), m.current_shot, m.life_used_pct, m.pm_due_date, m.health, m.updated_at]);
  const header = ["Mold No.", "Mold Name", "Mold Type", "Product", "Machine / Location", "Status", "Current shot", "Life used %", "PM due", "Health", "Updated"];
  const exportCsv = () => downloadExcel("mold-status.csv", header, rowsFor(items));
  const quick = [
    [tx("View Detail"), VisibilityOutlinedIcon, "#1570EF", () => navigate(detailUrl(selectedId)), !selectedId],
    [tx("Shot Counter"), SpeedOutlinedIcon, "#7A5AF8", () => navigate(withSel("/mold-management/shot-counter")), false],
    [tx("Installation History"), HistoryOutlinedIcon, "#2E90FA", () => navigate(withSel("/mold-management/installation-history")), false],
    [tx("Move Location"), SwapHorizOutlinedIcon, "#12B76A", () => page.openAction("move", sel), !canEdit || !sel || Boolean(sel?.current_machine_id)],
    [tx("Change Status"), BuildCircleOutlinedIcon, "#F79009", () => page.openAction("status", sel), !canEdit || !sel || Boolean(sel?.current_machine_id)],
    [tx("Create PM Schedule"), CalendarMonthOutlinedIcon, "#F04438", () => navigate(`/maintenance-management/planning?create=1&asset_type=MOLD${selectedId ? `&asset_id=${selectedId}` : ""}`), false],
  ];
  const kpiClick = (s) => () => { setStatusFilter((o) => (o === s ? "" : s)); setLocFilter(null); };
  const tile = (type, labelText, count, extra) => (
    <Box key={`${type}-${labelText}`} onClick={() => setLocFilter((o) => (o && o.type === type && o.label === (extra?.label ?? null) ? null : { type, label: extra?.label ?? null }))}
      sx={{ border: 1.5, borderColor: LOCATION_COLORS[type], borderRadius: 1.5, px: 0.5, py: 0.4, textAlign: "center", cursor: "pointer", bgcolor: `${LOCATION_COLORS[type]}12`, minWidth: 0,
        outline: locFilter && locFilter.type === type && locFilter.label === (extra?.label ?? null) ? `2px solid ${LOCATION_COLORS[type]}` : "none", outlineOffset: 2 }}>
      <Typography variant="caption" fontWeight={700} sx={{ display: "block", fontSize: 10 }} noWrap>{labelText}</Typography>
      <Typography variant="caption" fontWeight={800} sx={{ display: "block", color: LOCATION_COLORS[type], fontSize: 12 }} noWrap>{extra?.text ?? count}</Typography>
    </Box>
  );
  const base = chartBase(dark, axisColor);
  const toggleSx = { px: 1, py: 0.1, textTransform: "none", fontWeight: 700, fontSize: 10.5 };
  const usedStatuses = STATUS_ORDER.filter((s) => byLoc.some((l) => l.counts[s]));
  const toolbar = (
    <TextField size="small" placeholder={tx("Search mold, product, machine...")} value={q} onChange={(e) => setQ(e.target.value)} sx={{ width: 240 }}
      slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
  );
  const filterText = [statusFilter ? label("moldStatus", statusFilter) : null, locFilter ? locFilter.label || label("locationType", locFilter.type) : null].filter(Boolean).join(" · ");

  return (
    <MoldPageFrame fit page={page} title={tx("Mold Status")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} toolbar={toolbar} system={data?.system} onChanged={() => load({ silent: true })}>
      {data ? (
        <>
          <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(4, minmax(0,1fr))", xl: "repeat(7, minmax(0,1fr))" }}>
            <KpiTile tone="primary" title={tx("Total Molds")} value={num(total)} sub="100%" icon={InventoryOutlinedIcon} onClick={() => { setStatusFilter(""); setLocFilter(null); }} />
            <KpiTile tone="success" title={tx("Running")} value={num(k.running)} sub={pct(k.running)} icon={PlayCircleOutlineIcon} onClick={kpiClick("IN_PRODUCTION")} />
            <KpiTile tone="info" title={tx("Standby")} value={num(k.available)} sub={pct(k.available)} icon={CheckCircleOutlineIcon} onClick={kpiClick("AVAILABLE")} />
            <KpiTile tone="accent" title={tx("In Maintenance")} value={num(k.maintenance)} sub={pct(k.maintenance)} icon={EngineeringOutlinedIcon} onClick={kpiClick("IN_MAINTENANCE")} />
            <KpiTile tone="danger" title={tx("In Repair")} value={num(k.repair)} sub={pct(k.repair)} icon={BuildCircleOutlinedIcon} onClick={kpiClick("IN_REPAIR")} />
            <KpiTile tone="primary" title={tx("Out of Service")} value={num(k.out_of_service)} sub={pct(k.out_of_service)} icon={BlockOutlinedIcon} onClick={kpiClick("OUT_OF_SERVICE")} />
            <KpiTile tone="warning" title={tx("Locked")} value={num(k.locked)} sub={pct(k.locked)} icon={LockOutlinedIcon} onClick={kpiClick("LOCKED")} />
          </KpiCardGroup>

          <Box sx={{ ...fitGridSx, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" }, gridTemplateRows: { lg: "repeat(3, minmax(0,1fr))" } }}>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 3" } }}>
              <Head title={tx("Status by Location")} action={<Stack direction="row" spacing={1.25}>{usedStatuses.map((s) => <Dot key={s} color={MOLD_STATUS_COLORS[s]} text={label("moldStatus", s)} />)}</Stack>} />
              {byLoc.length ? (
                <Box sx={{ flex: 1, minHeight: 0, px: 1 }}>
                  <Chart type="bar" height="100%" series={STATUS_ORDER.map((s) => ({ name: label("moldStatus", s), data: byLoc.map((l) => l.counts[s] || 0) }))} options={{
                    ...base, chart: { ...base.chart, stacked: true }, colors: STATUS_ORDER.map((s) => MOLD_STATUS_COLORS[s]),
                    plotOptions: { bar: { horizontal: true, barHeight: "60%", borderRadius: 2 } },
                    xaxis: { ...base.xaxis, categories: byLoc.map((l) => (l.location_type === "NOT_ASSIGNED" ? label("locationType", "NOT_ASSIGNED") : l.label)), min: 0, max: maxLoc, tickAmount: Math.min(maxLoc, 6),
                      labels: { ...base.xaxis.labels, formatter: (v) => num(v, 0) } },
                    yaxis: { labels: { ...base.yaxis.labels, maxWidth: 150 } } }} />
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>
            <Paper elevation={0} sx={panelSx}>
              <Head title={tx("Status by Mold Type")} />
              {types.length ? (
                <Box sx={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "130px 1fr", alignItems: "center", px: 1, pb: 1 }}>
                  <Chart type="donut" height={140} series={types.map(([, n]) => n)} options={{
                    labels: types.map(([t]) => t), colors: REASON_COLORS, legend: { show: false }, dataLabels: { enabled: false }, chart: { background: "transparent" },
                    stroke: { width: 1, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light" }, plotOptions: { pie: { donut: { size: "62%" } } } }} />
                  <Stack spacing={0.4}>{types.map(([t, n], i) => (
                    <Stack key={t} direction="row" spacing={0.75} sx={{ alignItems: "center" }}><Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: REASON_COLORS[i % REASON_COLORS.length] }} />
                      <Typography variant="caption" sx={{ flex: 1 }} noWrap>{t}</Typography><Typography variant="caption" fontWeight={800}>{n} ({num((n / (total || 1)) * 100, 0)}%)</Typography></Stack>))}</Stack>
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>
            <Paper elevation={0} sx={panelSx}>
              <Head title={sideView === "timeline" ? `${tx("Status Timeline")} (${tx("today")})` : tx("Alert Summary")} action={(
                <ToggleButtonGroup exclusive size="small" value={sideView} onChange={(e, v) => v && setSideView(v)}>
                  <ToggleButton value="alerts" sx={toggleSx}>{tx("Alert Summary")}</ToggleButton>
                  <ToggleButton value="timeline" sx={toggleSx}>{tx("today")}</ToggleButton>
                </ToggleButtonGroup>
              )} />
              <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1 }}>
                {sideView === "timeline" ? <Timeline events={timeline} onOpen={(e) => navigate(detailUrl(e.mold_id))} /> : <AlertSummary alerts={data.alerts} onOpen={(m) => navigate(detailUrl(m.id))} />}
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 4" }, gridRow: { lg: "2 / 4" }, minHeight: { xs: 360, lg: 0 } }}>
              <Head title={`${tx("Mold Status List")}${filterText ? ` · ${filterText}` : ""}`} action={(
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  {filterText ? <Typography variant="caption" sx={{ color: "#1570EF", cursor: "pointer", fontWeight: 700 }} onClick={() => { setStatusFilter(""); setLocFilter(null); }}>{tx("Clear")}</Typography> : null}
                  <Typography variant="caption" color="text.secondary">{items.length} {tx("molds")}</Typography>
                </Stack>
              )} />
              {items.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(9, 12, 8, 10, 10, 10, 7.5, 8, 7.5, 6, 8, 4) }}>
                    <TableHead><TableRow>
                      <TableCell>{tx("Mold No.")}</TableCell><TableCell>{tx("Mold Name")}</TableCell><TableCell>{tx("Mold Type")}</TableCell><TableCell>{tx("Product")}</TableCell>
                      <TableCell>{tx("Machine / Location")}</TableCell><TableCell align="center">{tx("Status")}</TableCell><TableCell align="right">{tx("Current Shot")}</TableCell>
                      <TableCell align="center">{tx("Life Used (%)")}</TableCell><TableCell>{tx("PM Due Date")}</TableCell><TableCell align="center">{tx("Health Score")}</TableCell>
                      <TableCell>{tx("Updated Time")}</TableCell><TableCell />
                    </TableRow></TableHead>
                    <TableBody>{items.map((m) => (
                      <TableRow key={m.id} hover selected={m.id === selectedId} onClick={() => setSelectedId(m.id)} onDoubleClick={() => navigate(detailUrl(m.id))} sx={{ cursor: "pointer" }}>
                        <TableCell sx={{ fontWeight: 800, color: "#1570EF" }}>{m.mold_code}</TableCell><TableCell title={m.mold_name}>{m.mold_name}</TableCell>
                        <TableCell title={m.mold_type || ""}>{m.mold_type || EMPTY}</TableCell><TableCell title={m.product_name || ""}>{m.product_name || EMPTY}</TableCell>
                        <TableCell sx={{ color: m.location_type === "NOT_ASSIGNED" ? "#F79009" : undefined }} title={locationText(m) || ""}>{locationText(m)}</TableCell>
                        <TableCell align="center"><MoldStatusPill value={m.status} /></TableCell><TableCell align="right">{num(m.current_shot)}</TableCell>
                        <TableCell align="center"><LifeBar value={m.life_used_pct} width={80} /></TableCell>
                        <TableCell sx={{ color: m.pm_overdue ? "#F04438" : undefined }}>{dateText(m.pm_due_date)}</TableCell>
                        <TableCell align="center"><HealthBadge value={m.health} /></TableCell><TableCell>{ddmmhhmm(m.status_since)}</TableCell>
                        <TableCell align="center" padding="none" sx={{ textOverflow: "clip !important" }}><MoldRowMenu mold={m} canEdit={canEdit} navigate={navigate} onAction={page.openAction} /></TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "4" }, gridRow: { lg: "2" } }}>
              <Head title={tx("Location Map Overview")} />
              <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.4, fontSize: 10 }}>{tx("Injection Machine Area")}</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: 0.6, mb: 0.75 }}>
                  {data.machines.map((mc) => tile("MACHINE", mc.equipment_code, mc.mold_code ? 1 : 0, { label: mc.equipment_code, text: mc.mold_code || EMPTY }))}
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 0.6 }}>
                  {["STORAGE", "MAINTENANCE", "REPAIR", "SCRAP", "NOT_ASSIGNED"].map((t) => tile(t, label("locationType", t), data.location_counts[t] || 0))}
                </Box>
              </Box>
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
