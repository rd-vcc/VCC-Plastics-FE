import "./locales";
import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { Box, FormControl, InputLabel, LinearProgress, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import SwapVertOutlinedIcon from "@mui/icons-material/SwapVertOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, colShares, downloadExcel } from "../../MaterialManagement/materialUi";
import { Dot, EMPTY, Head, ddmmhhmm, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { EmptyBody, FilterToggle, QuickCard, cellsSx, chartBase, fillSx, fitGridSx, panelSx, who } from "../../shared/onePage";
import { label, tx } from "../moldLocales";
import { MoldPageFrame, useMoldData, useMoldPage } from "../moldPage";
import { InfoGrid, MOLD_API, MoldImage, REASON_COLORS, dateText, hoursText } from "../moldUi";

const iso = (d) => d.toISOString().slice(0, 10);
const ACTION_COLORS = { INSTALL: "#12B76A", REMOVE: "#F04438" };

export default function MoldInstallationHistory() {
  const page = useMoldPage();
  const { navigate, params, dark, axisColor, tableSx, lookups } = page;
  const [f, setF] = useState(() => {
    const to = new Date();
    return { date_from: iso(new Date(to.getTime() - 29 * 86400000)), date_to: iso(to), mold_id: params.get("mold") || "", machine_id: "", action_type: "", work_order: "", q: "" };
  });
  const [molds, setMolds] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [nowView, setNowView] = useState("running");
  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const qs = useMemo(() => new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString(), [f]);
  const { data, loading, lastUpdate, live, setLive, load } = useMoldData(page, `${MOLD_API}/installations?${qs}`, { interval: 60000 });
  const { request } = page;
  useEffect(() => { request(`${MOLD_API}/summary`).then((d) => setMolds(d.items)).catch(() => {}); }, [request]);

  const k = data?.kpis || {};
  const p = data?.kpis_prev || {};
  const vs = (a, b, suffix = "") => (b ? `${a >= b ? "↑" : "↓"} ${num(Math.abs(((a - b) / b) * 100), 1)}% ${tx("vs previous period")}` : `${tx("vs previous period")}: ${EMPTY}${suffix}`);
  const minText = (v) => (v != null ? `${num(v, 1)} ${tx("min")}` : EMPTY);
  const rows = data?.rows || [];
  const last = data?.last;
  const reasons = data?.reasons || [];
  const running = data?.running;
  const selMold = f.mold_id ? Number(f.mold_id) : null;
  const withSel = (path) => `${path}${selMold ? `?mold=${selMold}` : ""}`;
  const exportCsv = () => downloadExcel("mold-installation-history.csv",
    ["Action", "Mold", "Mold name", "Type", "Cavity", "Machine", "Area", "Work order", "Product", "Installed at", "Removed at", "Installed by", "Removed by", "Install min", "Remove min", "Removal reason", "Planned", "Remark"],
    rows.map((r) => [r.action, r.mold_code, r.mold_name, r.mold_type, r.cavity_count, r.machine_code, r.area_name, r.wo_no, r.product_name, r.installed_at, r.removed_at, r.installed_by, r.removed_by,
      r.install_minutes, r.remove_minutes, r.removal_reason, r.planned, r.remark]));
  const quick = [
    [tx("View Detail"), VisibilityOutlinedIcon, "#1570EF", () => navigate(`/mold-management/detail?mold=${selMold}`), !selMold],
    [tx("Mold Status"), FactCheckOutlinedIcon, "#F79009", () => navigate("/mold-management/status"), false],
    [tx("Shot Counter"), SpeedOutlinedIcon, "#7A5AF8", () => navigate(withSel("/mold-management/shot-counter")), false],
    [tx("Mold Location"), LocationOnOutlinedIcon, "#12B76A", () => navigate(withSel("/mold-management/location")), false],
    [tx("Maintenance History"), EngineeringOutlinedIcon, "#0E9384", () => navigate(`/mold-management/detail?mold=${selMold}#maintenance`), !selMold],
    [tx("Create PM Schedule"), CalendarMonthOutlinedIcon, "#F04438", () => navigate(`/maintenance-management/planning?create=1&asset_type=MOLD${selMold ? `&asset_id=${selMold}` : ""}`), false],
  ];
  const sel = (key, text, options, width = 150) => (
    <FormControl size="small" sx={{ minWidth: width }}><InputLabel shrink>{text}</InputLabel>
      <Select displayEmpty notched label={text} value={f[key]} onChange={set(key)}><MenuItem value="">{tx("All")}</MenuItem>{options}</Select></FormControl>
  );
  const runningByMachine = running?.by_machine || [];
  const base = chartBase(dark, axisColor);
  const toggleSx = { px: 1, py: 0.1, textTransform: "none", fontWeight: 700, fontSize: 10.5 };
  const activeFilters = ["mold_id", "machine_id", "action_type", "work_order"].filter((key) => f[key]).length;
  const scroll = { flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1 };
  const maxByMachine = data?.by_machine?.[0]?.[1] || 1;

  return (
    <MoldPageFrame fit page={page} title={tx("Mold Installation History")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} system={data?.system} onChanged={() => load({ silent: true })}
      toolbar={<>
        <TextField size="small" type="date" label={tx("Date from")} value={f.date_from} onChange={set("date_from")} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 150 }} />
        <TextField size="small" type="date" label={tx("Date to")} value={f.date_to} onChange={set("date_to")} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 150 }} />
        <FilterToggle open={showFilter} count={activeFilters} onClick={() => setShowFilter((v) => !v)} label={tx("Filter")} />
      </>}
      filters={showFilter ? <>
        {sel("mold_id", tx("Mold No."), molds.map((m) => <MenuItem key={m.id} value={String(m.id)}>{m.mold_code} — {m.mold_name}</MenuItem>), 170)}
        {sel("machine_id", tx("Machine"), (lookups?.machines || []).map((m) => <MenuItem key={m.id} value={String(m.id)}>{m.equipment_code}</MenuItem>), 130)}
        {sel("action_type", tx("Action Type"), ["INSTALL", "REMOVE"].map((a) => <MenuItem key={a} value={a}>{tx(a === "INSTALL" ? "Install" : "Remove")}</MenuItem>), 130)}
        <TextField size="small" label={tx("Work Order")} value={f.work_order} onChange={set("work_order")} sx={{ width: 150 }} />
      </> : null}>
      {data ? (
        <>
          <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))", xl: "repeat(6, minmax(0,1fr))" }}>
            <KpiTile tone="primary" title={tx("Total Installations")} value={num(k.total)} sub={vs(k.total, p.total)} icon={SwapVertOutlinedIcon} />
            <KpiTile tone="success" title={tx("Installations")} value={num(k.installs)} sub={vs(k.installs, p.installs)} icon={LoginOutlinedIcon} onClick={() => setF((o) => ({ ...o, action_type: o.action_type === "INSTALL" ? "" : "INSTALL" }))} />
            <KpiTile tone="warning" title={tx("Removals")} value={num(k.removals)} sub={`${k.unplanned || 0} ${tx("Unplanned").toLowerCase()}`} icon={LogoutOutlinedIcon} onClick={() => setF((o) => ({ ...o, action_type: o.action_type === "REMOVE" ? "" : "REMOVE" }))} />
            <KpiTile tone="accent" title={tx("Avg Install Time")} value={minText(k.avg_install_min)} sub={p.avg_install_min != null ? `${tx("vs previous period")}: ${minText(p.avg_install_min)}` : ""} icon={TimerOutlinedIcon} />
            <KpiTile tone="danger" title={tx("Avg Remove Time")} value={minText(k.avg_remove_min)} sub={p.avg_remove_min != null ? `${tx("vs previous period")}: ${minText(p.avg_remove_min)}` : ""} icon={TimerOutlinedIcon} />
            <KpiTile tone="info" title={tx("Machines Used")} value={num(k.machines)} sub={`${dateText(data.period.from)} – ${dateText(data.period.to)}`} icon={PrecisionManufacturingOutlinedIcon} />
          </KpiCardGroup>

          <Box sx={{ ...fitGridSx, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" }, gridTemplateRows: { lg: "repeat(3, minmax(0,1fr))" } }}>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 4" }, gridRow: { lg: "1 / 3" }, minHeight: { xs: 360, lg: 0 } }}>
              <Head title={tx("Installation History")} action={<Typography variant="caption" color="text.secondary">{rows.length}</Typography>} />
              {rows.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(6.5, 9, 11, 7, 9, 9.5, 8.5, 8.5, 11, 5, 5, 10) }}>
                    <TableHead><TableRow>
                      {["Action Type", "Mold No.", "Mold Name", "Machine", "Work Order", "Product", "Install Date & Time", "Remove Date & Time", "Installed By", "Install (min)", "Remove (min)", "Removal reason"].map((h) => (
                        <TableCell key={h} align={["Install (min)", "Remove (min)", "Action Type"].includes(h) ? "center" : "left"} title={tx(h)}>{tx(h)}</TableCell>))}
                    </TableRow></TableHead>
                    <TableBody>{rows.map((r) => (
                      <TableRow key={`${r.id}-${r.action}`} hover onDoubleClick={() => navigate(`/mold-management/detail?mold=${r.mold_id}`)} sx={{ cursor: "pointer" }}>
                        <TableCell align="center" sx={{ textOverflow: "clip !important" }}><Box component="span" sx={{ display: "inline-block", width: 58, textAlign: "center", fontSize: 10, fontWeight: 700, borderRadius: 1, color: ACTION_COLORS[r.action], bgcolor: `${ACTION_COLORS[r.action]}1A`, border: `1px solid ${ACTION_COLORS[r.action]}55` }}>{tx(r.action === "INSTALL" ? "Install" : "Remove")}</Box></TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "#1570EF" }} onClick={() => navigate(`/mold-management/detail?mold=${r.mold_id}`)}>{r.mold_code}</TableCell>
                        <TableCell title={r.mold_name}>{r.mold_name}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} title={r.area_name || ""}>{r.machine_code}</TableCell><TableCell>{r.wo_no || EMPTY}</TableCell>
                        <TableCell title={r.product_name || ""}>{r.product_name || EMPTY}</TableCell>
                        <TableCell>{ddmmhhmm(r.installed_at)}</TableCell><TableCell>{r.removed_at ? ddmmhhmm(r.removed_at) : EMPTY}</TableCell>
                        <TableCell title={who(r.action === "INSTALL" ? r.installed_by : r.removed_by)}>{who(r.action === "INSTALL" ? r.installed_by : r.removed_by)}</TableCell>
                        <TableCell align="center">{r.action === "INSTALL" && r.install_minutes != null ? num(r.install_minutes, 0) : EMPTY}</TableCell>
                        <TableCell align="center">{r.action === "REMOVE" && r.remove_minutes != null ? num(r.remove_minutes, 0) : EMPTY}</TableCell>
                        <TableCell sx={{ color: r.action === "REMOVE" && r.planned === 0 ? "#F04438" : undefined, fontWeight: r.planned === 0 ? 700 : 400 }}>{r.action === "REMOVE" ? label("removalReason", r.removal_reason) : EMPTY}</TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "4" }, gridRow: { lg: "1" } }}>
              <Head title={tx("Install / Remove Trend")} action={<Stack direction="row" spacing={1.25}><Dot color={ACTION_COLORS.INSTALL} text={tx("Installations")} /><Dot color={ACTION_COLORS.REMOVE} text={tx("Removals")} /></Stack>} />
              <Box sx={{ flex: 1, minHeight: 0, px: 1 }}>
                <Chart type="line" height="100%" series={[{ name: tx("Installations"), data: data.trend.map((t) => t.installs) }, { name: tx("Removals"), data: data.trend.map((t) => t.removals) }]} options={{
                  ...base, colors: [ACTION_COLORS.INSTALL, ACTION_COLORS.REMOVE], stroke: { width: 2, curve: "straight" }, markers: { size: 2 },
                  xaxis: { ...base.xaxis, categories: data.trend.map((t) => dateText(t.date).slice(0, 5)), tickAmount: 6 },
                  yaxis: { min: 0, forceNiceScale: true, tickAmount: 3, labels: { ...base.yaxis.labels, formatter: (v) => num(v, 0) } } }} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "4" }, gridRow: { lg: "2" } }}>
              <Head title={tx("Installations by Machine")} />
              {data.by_machine.length ? (
                <Box sx={scroll}>
                  {data.by_machine.map(([mc, n]) => (
                    <Box key={mc} sx={{ display: "grid", gridTemplateColumns: "70px 1fr 28px", gap: 1, alignItems: "center", mb: 0.6 }}>
                      <Typography variant="caption" fontWeight={700}>{mc}</Typography>
                      <LinearProgress variant="determinate" value={(n / maxByMachine) * 100} sx={{ height: 8, borderRadius: 4, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: "#12B76A" } }} />
                      <Typography variant="caption" fontWeight={800} align="right">{n}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "1" }, gridRow: { lg: "3" } }}>
              <Head title={nowView === "last" ? tx("Last Installation Details") : tx("Currently Installed Molds")} action={(
                <ToggleButtonGroup exclusive size="small" value={nowView} onChange={(e, v) => v && setNowView(v)}>
                  <ToggleButton value="running" sx={toggleSx}>{tx("Running Molds")}</ToggleButton>
                  <ToggleButton value="last" sx={toggleSx}>{tx("Last")}</ToggleButton>
                </ToggleButtonGroup>
              )} />
              {nowView === "last" ? (last ? (
                <Box sx={{ ...scroll, display: "grid", gridTemplateColumns: "96px minmax(0,1fr)", gap: 1.25, alignItems: "center" }}>
                  <MoldImage src={last.image_url} height={90} iconSize={44} />
                  <InfoGrid nowrap rows={[[tx("Mold No."), last.mold_code, "#1570EF"], [tx("Mold Name"), last.mold_name], [tx("Machine"), last.machine_code], [tx("Installed By"), who(last.installed_by)],
                    [tx("Install Date & Time"), ddmmhhmm(last.installed_at)], [tx("Installation Duration"), last.install_minutes != null ? `${num(last.install_minutes, 0)} ${tx("min")}` : null]]} />
                </Box>
              ) : <EmptyBody text={tx("No data.")} />) : (
                <Box sx={{ ...scroll, display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: 1.5, alignItems: "center" }}>
                  <Stack spacing={0.5}>
                    {[[tx("Running Molds"), running.molds, "#12B76A"], [tx("Machines in Use"), running.machines, "#1570EF"], [tx("Active Work Orders"), running.active_work_orders, "#F79009"]].map(([t, v, c]) => (
                      <Box key={t}><Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 10 }}>{t}</Typography><Typography fontWeight={800} sx={{ color: c, lineHeight: 1.15, fontSize: 18 }}>{v}</Typography></Box>))}
                  </Stack>
                  <Box sx={{ minWidth: 0 }}>{runningByMachine.map((r, i) => (
                    <Stack key={r.machine} direction="row" spacing={1} sx={{ alignItems: "center", py: 0.3 }}><Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: REASON_COLORS[i % REASON_COLORS.length] }} />
                      <Typography variant="caption" fontWeight={700} sx={{ flex: 1 }}>{r.machine}</Typography><Typography variant="caption" noWrap sx={{ color: "#1570EF", fontWeight: 700 }}>{r.mold}</Typography></Stack>))}</Box>
                </Box>
              )}
            </Paper>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "2" }, gridRow: { lg: "3" } }}>
              <Head title={tx("Unplanned Removal Alert")} action={<Typography variant="caption" color="text.secondary">{data.unplanned.length}</Typography>} />
              {data.unplanned.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(22, 16, 22, 22, 18) }}>
                    <TableHead><TableRow><TableCell>{tx("Mold No.")}</TableCell><TableCell>{tx("Machine")}</TableCell><TableCell>{tx("Removed At")}</TableCell><TableCell>{tx("Reason")}</TableCell><TableCell title={tx("Idle until next install")}>{tx("Idle until next install")}</TableCell></TableRow></TableHead>
                    <TableBody>{data.unplanned.map((u) => (
                      <TableRow key={u.id} hover onClick={() => navigate(`/mold-management/detail?mold=${u.mold_id}`)} sx={{ cursor: "pointer" }}>
                        <TableCell sx={{ fontWeight: 800, color: "#1570EF" }}>{u.mold_code}</TableCell><TableCell>{u.machine_code}</TableCell><TableCell>{ddmmhhmm(u.removed_at)}</TableCell>
                        <TableCell sx={{ color: "#F04438", fontWeight: 700 }} title={label("removalReason", u.removal_reason)}>{label("removalReason", u.removal_reason)}</TableCell><TableCell>{hoursText(u.machine_down_hours)}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "3" }, gridRow: { lg: "3" } }}>
              <Head title={tx("Top Removal Reasons")} />
              {reasons.length ? (
                <Box sx={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "130px 1fr", alignItems: "center", px: 1, pb: 1 }}>
                  <Chart type="donut" height={140} series={reasons.map(([, n]) => n)} options={{
                    labels: reasons.map(([r]) => label("removalReason", r)), colors: REASON_COLORS, legend: { show: false }, dataLabels: { enabled: false }, chart: { background: "transparent" },
                    stroke: { width: 1, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light" },
                    plotOptions: { pie: { donut: { size: "66%", labels: { show: true, name: { color: axisColor, fontSize: "10px" }, value: { fontSize: "16px", fontWeight: 800, color: dark ? "#fff" : "#101828" },
                      total: { show: true, label: tx("Total"), color: axisColor, formatter: () => String(k.removals) } } } } } }} />
                  <Stack spacing={0.4}>{reasons.map(([r, n], i) => (
                    <Stack key={r} direction="row" spacing={0.75} sx={{ alignItems: "center" }}><Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: REASON_COLORS[i % REASON_COLORS.length] }} />
                      <Typography variant="caption" noWrap sx={{ flex: 1 }}>{label("removalReason", r)}</Typography><Typography variant="caption" fontWeight={700}>{n}</Typography></Stack>))}</Stack>
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
