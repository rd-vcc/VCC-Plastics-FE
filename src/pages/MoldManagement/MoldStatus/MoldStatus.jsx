import "./locales";
import { useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { Box, Checkbox, IconButton, InputAdornment, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, downloadCsv } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, cardSx, ddmmhhmm, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { label, tx } from "../moldLocales";
import { MoldPageFrame, useMoldData, useMoldPage } from "../moldPage";
import { AlertSummary, Timeline } from "../moldParts";
import { HealthBadge, LOCATION_COLORS, LifeBar, MOLD_API, MOLD_STATUS_COLORS, MoldRowMenu, MoldStatusPill, QuickActionGrid, REASON_COLORS, dateText, locationText } from "../moldUi";

const STATUS_ORDER = ["IN_PRODUCTION", "AVAILABLE", "IN_MAINTENANCE", "IN_REPAIR", "RETIRED", "SCRAPPED", "LOCKED"];

export default function MoldStatus() {
  const page = useMoldPage();
  const { navigate, dark, axisColor, grid, tableSx, canEdit } = page;
  const { data, loading, lastUpdate, live, setLive, load } = useMoldData(page, `${MOLD_API}/summary`);
  const [statusFilter, setStatusFilter] = useState("");
  const [locFilter, setLocFilter] = useState(null);
  const [q, setQ] = useState("");
  const [checked, setChecked] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const all = data?.items || [];
  const items = useMemo(() => all.filter((m) => (!statusFilter || m.status === statusFilter || (statusFilter === "OUT_OF_SERVICE" && ["RETIRED", "SCRAPPED"].includes(m.status)))
    && (!locFilter || (locFilter.type === m.location_type && (!locFilter.label || locFilter.label === (m.location_label || "—"))))
    && (!q || `${m.mold_code} ${m.mold_name} ${m.product_name || ""} ${m.machine_code || ""} ${m.location_label || ""}`.toLowerCase().includes(q.toLowerCase()))), [all, statusFilter, locFilter, q]);
  const k = data?.kpis || {};
  const total = k.total || 0;
  const pct = (n) => (total ? `${num((n / total) * 100, 1)}% ${tx("of total")}` : "");
  const sel = all.find((m) => m.id === selectedId);
  const detailUrl = (id) => `/mold-management/detail?mold=${id}`;
  const withSel = (path) => `${path}${selectedId ? `?mold=${selectedId}` : ""}`;
  const statusSeries = data ? STATUS_ORDER.map((s) => [s, data.status_counts[s] || 0]) : [];
  const types = data ? Object.entries(data.type_counts).sort((a, b) => b[1] - a[1]) : [];
  const byLoc = data?.status_by_location || [];
  const maxLoc = Math.max(1, ...byLoc.map((l) => l.total));
  const today = new Date().toISOString().slice(0, 10);
  const timeline = (data?.timeline || []).filter((e) => String(e.event_at).slice(0, 10) === today);
  const rowsFor = (list) => list.map((m) => [m.mold_code, m.mold_name, m.mold_type, m.product_name, locationText(m), label("moldStatus", m.status), m.current_shot, m.life_used_pct, m.pm_due_date, m.health, m.updated_at]);
  const header = ["Mold No.", "Mold Name", "Mold Type", "Product", "Machine / Location", "Status", "Current shot", "Life used %", "PM due", "Health", "Updated"];
  const exportCsv = () => downloadCsv("mold-status.csv", header, rowsFor(items));
  const exportChecked = () => downloadCsv("mold-status-selected.csv", header, rowsFor(all.filter((m) => checked.includes(m.id))));
  const quick = [
    [tx("View Detail"), VisibilityOutlinedIcon, "#1570EF", () => navigate(detailUrl(selectedId)), !selectedId],
    [tx("Shot Counter"), SpeedOutlinedIcon, "#7A5AF8", () => navigate(withSel("/mold-management/shot-counter")), false],
    [tx("Installation History"), HistoryOutlinedIcon, "#2E90FA", () => navigate(withSel("/mold-management/installation-history")), false],
    [tx("Move Location"), SwapHorizOutlinedIcon, "#12B76A", () => page.openAction("move", sel), !canEdit || !sel || Boolean(sel?.current_machine_id)],
    [tx("Change Status"), BuildCircleOutlinedIcon, "#F79009", () => page.openAction("status", sel), !canEdit || !sel || Boolean(sel?.current_machine_id)],
    [tx("Maintenance History"), EngineeringOutlinedIcon, "#0E9384", () => navigate(`${detailUrl(selectedId)}#maintenance`), !selectedId],
    [tx("Create PM Schedule"), CalendarMonthOutlinedIcon, "#F04438", () => navigate(`/maintenance-management/planning?create=1&asset_type=MOLD${selectedId ? `&asset_id=${selectedId}` : ""}`), false],
    [`${tx("Export")} (${checked.length})`, FileDownloadOutlinedIcon, "#12B76A", exportChecked, !checked.length],
  ];
  const kpiClick = (s) => () => { setStatusFilter((o) => (o === s ? "" : s)); setLocFilter(null); };
  const tile = (type, labelText, count, extra) => (
    <Box key={`${type}-${labelText}`} onClick={() => setLocFilter((o) => (o && o.type === type && o.label === (extra?.label ?? null) ? null : { type, label: extra?.label ?? null }))}
      sx={{ border: 2, borderColor: LOCATION_COLORS[type], borderRadius: 1.5, p: 0.75, textAlign: "center", cursor: "pointer", bgcolor: `${LOCATION_COLORS[type]}12`,
        outline: locFilter && locFilter.type === type && locFilter.label === (extra?.label ?? null) ? `2px solid ${LOCATION_COLORS[type]}` : "none", outlineOffset: 2 }}>
      <Typography variant="caption" fontWeight={700} sx={{ display: "block" }} noWrap>{labelText}</Typography>
      <Typography variant="subtitle1" fontWeight={800} sx={{ color: LOCATION_COLORS[type], lineHeight: 1.2 }}>{extra?.text ?? count}</Typography>
    </Box>
  );

  return (
    <MoldPageFrame page={page} title={tx("Mold Status")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} system={data?.system} onChanged={() => load({ silent: true })}>
      {data ? (
        <>
          <Box sx={{ mb: 1.5 }}>
            <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(4, minmax(0,1fr))", xl: "repeat(7, minmax(0,1fr))" }}>
              <KpiTile tone="primary" title={tx("Total Molds")} value={num(total)} sub="100%" icon={InventoryOutlinedIcon} onClick={() => { setStatusFilter(""); setLocFilter(null); }} />
              <KpiTile tone="success" title={tx("Running")} value={num(k.running)} sub={pct(k.running)} icon={PlayCircleOutlineIcon} onClick={kpiClick("IN_PRODUCTION")} />
              <KpiTile tone="info" title={tx("Standby")} value={num(k.available)} sub={pct(k.available)} icon={CheckCircleOutlineIcon} onClick={kpiClick("AVAILABLE")} />
              <KpiTile tone="accent" title={tx("In Maintenance")} value={num(k.maintenance)} sub={pct(k.maintenance)} icon={EngineeringOutlinedIcon} onClick={kpiClick("IN_MAINTENANCE")} />
              <KpiTile tone="danger" title={tx("In Repair")} value={num(k.repair)} sub={pct(k.repair)} icon={BuildCircleOutlinedIcon} onClick={kpiClick("IN_REPAIR")} />
              <KpiTile tone="primary" title={tx("Out of Service")} value={num(k.out_of_service)} sub={pct(k.out_of_service)} icon={BlockOutlinedIcon} onClick={kpiClick("OUT_OF_SERVICE")} />
              <KpiTile tone="warning" title={tx("Locked")} value={num(k.locked)} sub={pct(k.locked)} icon={LockOutlinedIcon} onClick={kpiClick("LOCKED")} />
            </KpiCardGroup>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0,1fr))", xl: "minmax(0,1fr) minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr)" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Status Distribution")} />
              <Box sx={{ display: "grid", gridTemplateColumns: "140px 1fr", alignItems: "center", px: 1, pb: 1 }}>
                <Chart type="donut" height={160} series={statusSeries.map(([, n]) => n)} options={{
                  labels: statusSeries.map(([s]) => label("moldStatus", s)), colors: statusSeries.map(([s]) => MOLD_STATUS_COLORS[s]), legend: { show: false }, dataLabels: { enabled: false },
                  stroke: { width: 1, colors: [dark ? "#111827" : "#fff"] }, chart: { background: "transparent" }, tooltip: { theme: dark ? "dark" : "light" },
                  plotOptions: { pie: { donut: { size: "68%", labels: { show: true, name: { color: axisColor }, value: { fontSize: "18px", fontWeight: 800, color: dark ? "#fff" : "#101828" },
                    total: { show: true, label: tx("Total"), color: axisColor, formatter: () => String(total) } } } } } }} />
                <Stack spacing={0.4}>{statusSeries.map(([s, n]) => (
                  <Stack key={s} direction="row" spacing={0.75} sx={{ alignItems: "center", cursor: "pointer" }} onClick={kpiClick(s)}><Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: MOLD_STATUS_COLORS[s] }} />
                    <Typography variant="caption" sx={{ flex: 1 }} noWrap>{label("moldStatus", s)}</Typography><Typography variant="caption" fontWeight={800}>{n}</Typography></Stack>))}</Stack>
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Status by Location")} />
              <Box sx={{ px: 1, pb: 0.5 }}>
                <Chart type="bar" height={Math.max(170, byLoc.length * 26 + 60)} series={STATUS_ORDER.map((s) => ({ name: label("moldStatus", s), data: byLoc.map((l) => l.counts[s] || 0) }))} options={{
                  chart: { stacked: true, background: "transparent", toolbar: { show: false } }, colors: STATUS_ORDER.map((s) => MOLD_STATUS_COLORS[s]),
                  plotOptions: { bar: { horizontal: true, barHeight: "60%", borderRadius: 2 } }, dataLabels: { enabled: false },
                  xaxis: { categories: byLoc.map((l) => (l.location_type === "NOT_ASSIGNED" ? label("locationType", "NOT_ASSIGNED") : l.label)), min: 0, max: maxLoc, tickAmount: Math.min(maxLoc, 10),
                    labels: { style: { colors: axisColor, fontSize: "10px" }, formatter: (v) => num(v, 0) } },
                  yaxis: { labels: { style: { colors: axisColor, fontSize: "10.5px" }, maxWidth: 150 } }, legend: { position: "bottom", fontSize: "10.5px", labels: { colors: axisColor } }, grid, tooltip: { theme: dark ? "dark" : "light" } }} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Status by Mold Type")} />
              <Box sx={{ display: "grid", gridTemplateColumns: "130px 1fr", alignItems: "center", px: 1, pb: 1 }}>
                <Chart type="donut" height={150} series={types.map(([, n]) => n)} options={{
                  labels: types.map(([t]) => t), colors: REASON_COLORS, legend: { show: false }, dataLabels: { enabled: false }, chart: { background: "transparent" },
                  stroke: { width: 1, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light" }, plotOptions: { pie: { donut: { size: "62%" } } } }} />
                <Stack spacing={0.4}>{types.map(([t, n], i) => (
                  <Stack key={t} direction="row" spacing={0.75} sx={{ alignItems: "center" }}><Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: REASON_COLORS[i % REASON_COLORS.length] }} />
                    <Typography variant="caption" sx={{ flex: 1 }} noWrap>{t}</Typography><Typography variant="caption" fontWeight={800}>{n} ({num((n / (total || 1)) * 100, 0)}%)</Typography></Stack>))}</Stack>
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Alert Summary")} />
              <Box sx={{ px: 1.5, pb: 1.5, maxHeight: 260, overflow: "auto" }}><AlertSummary alerts={data.alerts} onOpen={(m) => navigate(detailUrl(m.id))} /></Box>
            </Paper>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,2.6fr) minmax(0,1fr)" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Mold Status List")} subtitle={`(${items.length}${statusFilter ? ` · ${label("moldStatus", statusFilter)}` : ""}${locFilter ? ` · ${locFilter.label || label("locationType", locFilter.type)}` : ""})`} action={
                <TextField size="small" placeholder={tx("Search mold, product, machine...")} value={q} onChange={(e) => setQ(e.target.value)} sx={{ width: 240 }}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />} />
              <Box sx={{ px: 1, pb: 1, height: 420, overflow: "auto" }}>
                <Table size="small" stickyHeader sx={tableSx}>
                  <TableHead><TableRow>
                    <TableCell padding="checkbox"><Checkbox size="small" checked={items.length > 0 && items.every((m) => checked.includes(m.id))} indeterminate={checked.length > 0 && !items.every((m) => checked.includes(m.id))}
                      onChange={(e) => setChecked(e.target.checked ? items.map((m) => m.id) : [])} /></TableCell>
                    <TableCell>{tx("Mold No.")}</TableCell><TableCell>{tx("Mold Name")}</TableCell><TableCell>{tx("Mold Type")}</TableCell><TableCell>{tx("Product")}</TableCell>
                    <TableCell>{tx("Machine / Location")}</TableCell><TableCell align="center">{tx("Status")}</TableCell><TableCell align="right">{tx("Current Shot")}</TableCell>
                    <TableCell align="center">{tx("Life Used (%)")}</TableCell><TableCell>{tx("PM Due Date")}</TableCell><TableCell align="center">{tx("Health Score")}</TableCell>
                    <TableCell>{tx("Updated Time")}</TableCell><TableCell align="center">{tx("Action")}</TableCell>
                  </TableRow></TableHead>
                  <TableBody>{items.map((m) => (
                    <TableRow key={m.id} hover selected={m.id === selectedId} onClick={() => setSelectedId(m.id)} onDoubleClick={() => navigate(detailUrl(m.id))} sx={{ cursor: "pointer" }}>
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}><Checkbox size="small" checked={checked.includes(m.id)} onChange={(e) => setChecked((o) => (e.target.checked ? [...o, m.id] : o.filter((x) => x !== m.id)))} /></TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1570EF" }}>{m.mold_code}</TableCell><TableCell sx={{ maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis" }}>{m.mold_name}</TableCell>
                      <TableCell>{m.mold_type || EMPTY}</TableCell><TableCell sx={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>{m.product_name || EMPTY}</TableCell>
                      <TableCell sx={{ color: m.location_type === "NOT_ASSIGNED" ? "#F79009" : undefined }}>{locationText(m)}</TableCell>
                      <TableCell align="center"><MoldStatusPill value={m.status} /></TableCell><TableCell align="right">{num(m.current_shot)}</TableCell>
                      <TableCell align="center"><LifeBar value={m.life_used_pct} /></TableCell>
                      <TableCell sx={{ color: m.pm_overdue ? "#F04438" : undefined }}>{dateText(m.pm_due_date)}</TableCell>
                      <TableCell align="center"><HealthBadge value={m.health} /></TableCell><TableCell>{ddmmhhmm(m.status_since)}</TableCell>
                      <TableCell align="center" padding="none">
                        <Tooltip title={tx("Mold Detail")}><IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(detailUrl(m.id)); }}><VisibilityOutlinedIcon fontSize="small" sx={{ color: "#1570EF" }} /></IconButton></Tooltip>
                        <MoldRowMenu mold={m} canEdit={canEdit} navigate={navigate} onAction={page.openAction} />
                      </TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </Box>
            </Paper>
            <Stack spacing={1.5}>
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Location Map Overview")} />
                <Box sx={{ px: 1.5, pb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>{tx("Injection Machine Area")}</Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: 0.75, mb: 1 }}>
                    {data.machines.map((mc) => tile("MACHINE", mc.equipment_code, mc.mold_code ? 1 : 0, { label: mc.equipment_code, text: mc.mold_code || EMPTY }))}
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0.75 }}>
                    {["STORAGE", "MAINTENANCE", "REPAIR", "SCRAP", "NOT_ASSIGNED"].map((t) => tile(t, label("locationType", t), data.location_counts[t] || 0))}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>{tx("Click an area to filter the list.")}</Typography>
                </Box>
              </Paper>
              <Paper elevation={0} sx={{ ...cardSx, flex: 1 }}>
                <Head title={tx("Status Timeline")} subtitle={`(${tx("today")})`} />
                <Box sx={{ px: 1.5, pb: 1.5, maxHeight: 260, overflow: "auto" }}><Timeline events={timeline} onOpen={(e) => navigate(detailUrl(e.mold_id))} /></Box>
              </Paper>
            </Stack>
          </Box>

          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Quick Actions")} subtitle={sel ? `(${sel.mold_code})` : `(${tx("Select a mold in the list.")})`} />
            <Box sx={{ px: 1.5, pb: 1.5 }}><QuickActionGrid actions={quick} columns="repeat(auto-fill, minmax(120px, 1fr))" /></Box>
          </Paper>
        </>
      ) : null}
    </MoldPageFrame>
  );
}
