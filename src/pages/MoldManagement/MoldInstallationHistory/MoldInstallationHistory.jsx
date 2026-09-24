import "./locales";
import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { Box, FormControl, InputLabel, LinearProgress, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
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
import { KpiTile, downloadCsv } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, cardSx, ddmmhhmm, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { label, tx } from "../moldLocales";
import { MoldPageFrame, useMoldData, useMoldPage } from "../moldPage";
import { InfoGrid, MOLD_API, MoldImage, QuickActionGrid, REASON_COLORS, dateText, hoursText } from "../moldUi";

const iso = (d) => d.toISOString().slice(0, 10);
const ACTION_COLORS = { INSTALL: "#12B76A", REMOVE: "#F04438" };

export default function MoldInstallationHistory() {
  const page = useMoldPage();
  const { navigate, params, dark, axisColor, grid, tableSx, lookups } = page;
  const [f, setF] = useState(() => {
    const to = new Date();
    return { date_from: iso(new Date(to.getTime() - 29 * 86400000)), date_to: iso(to), mold_id: params.get("mold") || "", machine_id: "", action_type: "", work_order: "", q: "" };
  });
  const [molds, setMolds] = useState([]);
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
  const exportCsv = () => downloadCsv("mold-installation-history.csv",
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

  return (
    <MoldPageFrame page={page} title={tx("Mold Installation History")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} system={data?.system} onChanged={() => load({ silent: true })}
      toolbar={<>
        <TextField size="small" type="date" label={tx("Date from")} value={f.date_from} onChange={set("date_from")} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 150 }} />
        <TextField size="small" type="date" label={tx("Date to")} value={f.date_to} onChange={set("date_to")} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 150 }} />
        {sel("mold_id", tx("Mold No."), molds.map((m) => <MenuItem key={m.id} value={String(m.id)}>{m.mold_code} — {m.mold_name}</MenuItem>), 170)}
        {sel("machine_id", tx("Machine"), (lookups?.machines || []).map((m) => <MenuItem key={m.id} value={String(m.id)}>{m.equipment_code}</MenuItem>), 130)}
        {sel("action_type", tx("Action Type"), ["INSTALL", "REMOVE"].map((a) => <MenuItem key={a} value={a}>{tx(a === "INSTALL" ? "Install" : "Remove")}</MenuItem>), 130)}
        <TextField size="small" label={tx("Work Order")} value={f.work_order} onChange={set("work_order")} sx={{ width: 150 }} />
      </>}>
      {data ? (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,3fr) minmax(0,1fr)" }, gap: 1.5, mb: 1.5 }}>
            <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))", xl: "repeat(6, minmax(0,1fr))" }}>
              <KpiTile tone="primary" title={tx("Total Installations")} value={num(k.total)} sub={vs(k.total, p.total)} icon={SwapVertOutlinedIcon} />
              <KpiTile tone="success" title={tx("Installations")} value={num(k.installs)} sub={vs(k.installs, p.installs)} icon={LoginOutlinedIcon} onClick={() => setF((o) => ({ ...o, action_type: o.action_type === "INSTALL" ? "" : "INSTALL" }))} />
              <KpiTile tone="warning" title={tx("Removals")} value={num(k.removals)} sub={`${k.unplanned || 0} ${tx("Unplanned").toLowerCase()}`} icon={LogoutOutlinedIcon} onClick={() => setF((o) => ({ ...o, action_type: o.action_type === "REMOVE" ? "" : "REMOVE" }))} />
              <KpiTile tone="accent" title={tx("Avg Install Time")} value={minText(k.avg_install_min)} sub={p.avg_install_min != null ? `${tx("vs previous period")}: ${minText(p.avg_install_min)}` : ""} icon={TimerOutlinedIcon} />
              <KpiTile tone="danger" title={tx("Avg Remove Time")} value={minText(k.avg_remove_min)} sub={p.avg_remove_min != null ? `${tx("vs previous period")}: ${minText(p.avg_remove_min)}` : ""} icon={TimerOutlinedIcon} />
              <KpiTile tone="info" title={tx("Machines Used")} value={num(k.machines)} sub={`${dateText(data.period.from)} – ${dateText(data.period.to)}`} icon={PrecisionManufacturingOutlinedIcon} />
            </KpiCardGroup>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Install / Remove Summary")} />
              <Box sx={{ px: 1.5, pb: 1.5 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", textAlign: "center", mb: 1 }}>
                  <Box><Typography variant="caption" color="text.secondary">{tx("Installations")}</Typography><Typography variant="h5" fontWeight={800} sx={{ color: ACTION_COLORS.INSTALL }}>{num(k.installs)}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">{tx("Removals")}</Typography><Typography variant="h5" fontWeight={800} sx={{ color: ACTION_COLORS.REMOVE }}>{num(k.removals)}</Typography></Box>
                </Box>
                <Box sx={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", bgcolor: "action.hover" }}>
                  <Box sx={{ width: `${k.total ? (k.installs / k.total) * 100 : 0}%`, bgcolor: ACTION_COLORS.INSTALL }} /><Box sx={{ flex: 1, bgcolor: k.removals ? ACTION_COLORS.REMOVE : "transparent" }} />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 0.5 }}>{tx("Total")}: {num(k.total)}</Typography>
              </Box>
            </Paper>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,3fr) minmax(0,1fr)" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Installation History")} subtitle={`(${rows.length})`} />
              <Box sx={{ px: 1, pb: 1, height: 470, overflow: "auto" }}>
                <Table size="small" stickyHeader sx={tableSx}>
                  <TableHead><TableRow>
                    {["Action Type", "Mold No.", "Mold Name", "Mold Type", "Cavity", "Machine", "Area", "Work Order", "Product", "Install Date & Time", "Remove Date & Time", "Installed By", "Install (min)", "Remove (min)", "Removal reason"].map((h) => (
                      <TableCell key={h} align={["Cavity", "Install (min)", "Remove (min)", "Action Type"].includes(h) ? "center" : "left"}>{tx(h)}</TableCell>))}
                  </TableRow></TableHead>
                  <TableBody>{rows.map((r) => (
                    <TableRow key={`${r.id}-${r.action}`} hover onDoubleClick={() => navigate(`/mold-management/detail?mold=${r.mold_id}`)} sx={{ cursor: "pointer" }}>
                      <TableCell align="center"><Box component="span" sx={{ display: "inline-block", width: 64, textAlign: "center", fontSize: 11, fontWeight: 700, borderRadius: 1, color: ACTION_COLORS[r.action], bgcolor: `${ACTION_COLORS[r.action]}1A`, border: `1px solid ${ACTION_COLORS[r.action]}55` }}>{tx(r.action === "INSTALL" ? "Install" : "Remove")}</Box></TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#1570EF" }} onClick={() => navigate(`/mold-management/detail?mold=${r.mold_id}`)}>{r.mold_code}</TableCell>
                      <TableCell sx={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>{r.mold_name}</TableCell><TableCell>{r.mold_type || EMPTY}</TableCell><TableCell align="center">{r.cavity_count}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{r.machine_code}</TableCell><TableCell>{r.area_name || EMPTY}</TableCell><TableCell>{r.wo_no || EMPTY}</TableCell>
                      <TableCell sx={{ maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis" }}>{r.product_name || EMPTY}</TableCell>
                      <TableCell>{ddmmhhmm(r.installed_at)}</TableCell><TableCell>{r.removed_at ? ddmmhhmm(r.removed_at) : EMPTY}</TableCell>
                      <TableCell>{(r.action === "INSTALL" ? r.installed_by : r.removed_by) || EMPTY}</TableCell>
                      <TableCell align="center">{r.action === "INSTALL" && r.install_minutes != null ? num(r.install_minutes, 0) : EMPTY}</TableCell>
                      <TableCell align="center">{r.action === "REMOVE" && r.remove_minutes != null ? num(r.remove_minutes, 0) : EMPTY}</TableCell>
                      <TableCell sx={{ color: r.action === "REMOVE" && r.planned === 0 ? "#F04438" : undefined, fontWeight: r.planned === 0 ? 700 : 400 }}>{r.action === "REMOVE" ? label("removalReason", r.removal_reason) : EMPTY}</TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </Box>
            </Paper>
            <Stack spacing={1.5}>
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Installations by Machine")} />
                <Box sx={{ px: 1.5, pb: 1.5 }}>
                  {!data.by_machine.length ? <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography> : data.by_machine.map(([mc, n]) => (
                    <Box key={mc} sx={{ display: "grid", gridTemplateColumns: "70px 1fr 28px", gap: 1, alignItems: "center", mb: 0.6 }}>
                      <Typography variant="caption" fontWeight={700}>{mc}</Typography>
                      <LinearProgress variant="determinate" value={(n / data.by_machine[0][1]) * 100} sx={{ height: 9, borderRadius: 4, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: "#12B76A" } }} />
                      <Typography variant="caption" fontWeight={800} align="right">{n}</Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
              <Paper elevation={0} sx={{ ...cardSx, flex: 1 }}>
                <Head title={tx("Install / Remove Trend")} />
                <Box sx={{ px: 1, pb: 0.5 }}>
                  <Chart type="line" height={220} series={[{ name: tx("Installations"), data: data.trend.map((t) => t.installs) }, { name: tx("Removals"), data: data.trend.map((t) => t.removals) }]} options={{
                    chart: { background: "transparent", toolbar: { show: false } }, colors: [ACTION_COLORS.INSTALL, ACTION_COLORS.REMOVE], stroke: { width: 2, curve: "straight" }, markers: { size: 2 },
                    xaxis: { categories: data.trend.map((t) => dateText(t.date).slice(0, 5)), tickAmount: 6, labels: { rotate: 0, style: { colors: axisColor, fontSize: "10px" } } },
                    yaxis: { min: 0, forceNiceScale: true, labels: { style: { colors: axisColor }, formatter: (v) => num(v, 0) } }, legend: { position: "top", labels: { colors: axisColor } }, grid,
                    tooltip: { theme: dark ? "dark" : "light" } }} />
                </Box>
              </Paper>
            </Stack>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0,1fr))", xl: "minmax(0,1.1fr) minmax(0,1.1fr) minmax(0,1.3fr) minmax(0,1fr)" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Last Installation Details")} />
              <Box sx={{ px: 1.5, pb: 1.5, display: "grid", gridTemplateColumns: "110px 1fr", gap: 1.5, alignItems: "center" }}>
                {last ? (
                  <>
                    <MoldImage src={last.image_url} height={100} iconSize={50} />
                    <InfoGrid rows={[[tx("Mold No."), last.mold_code, "#1570EF"], [tx("Mold Name"), last.mold_name], [tx("Machine"), last.machine_code], [tx("Installed By"), last.installed_by],
                      [tx("Install Date & Time"), ddmmhhmm(last.installed_at)], [tx("Installation Duration"), last.install_minutes != null ? `${num(last.install_minutes, 0)} ${tx("min")}` : null]]} />
                  </>
                ) : <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography>}
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Currently Installed Molds")} />
              <Box sx={{ px: 1.5, pb: 1.5, display: "grid", gridTemplateColumns: "auto 1fr", gap: 1.5, alignItems: "center" }}>
                <InfoGrid cols="1fr" gap={0.2} rows={[[tx("Running Molds"), <Typography key="a" variant="h5" fontWeight={800} sx={{ color: "#12B76A" }}>{running.molds}</Typography>],
                  [tx("Machines in Use"), <Typography key="b" variant="h5" fontWeight={800} sx={{ color: "#1570EF" }}>{running.machines}</Typography>],
                  [tx("Active Work Orders"), <Typography key="c" variant="h5" fontWeight={800} sx={{ color: "#F79009" }}>{running.active_work_orders}</Typography>]]} />
                <Box>{runningByMachine.map((r, i) => (
                  <Stack key={r.machine} direction="row" spacing={1} sx={{ alignItems: "center", py: 0.4 }}><Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: REASON_COLORS[i % REASON_COLORS.length] }} />
                    <Typography variant="caption" fontWeight={700} sx={{ flex: 1 }}>{r.machine}</Typography><Typography variant="caption" sx={{ color: "#1570EF", fontWeight: 700 }}>{r.mold}</Typography></Stack>))}</Box>
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Unplanned Removal Alert")} subtitle={`(${data.unplanned.length})`} />
              <Box sx={{ px: 1, pb: 1, maxHeight: 220, overflow: "auto" }}>
                <Table size="small" stickyHeader sx={tableSx}>
                  <TableHead><TableRow><TableCell>{tx("Mold No.")}</TableCell><TableCell>{tx("Machine")}</TableCell><TableCell>{tx("Removed At")}</TableCell><TableCell>{tx("Reason")}</TableCell><TableCell>{tx("Idle until next install")}</TableCell></TableRow></TableHead>
                  <TableBody>{data.unplanned.map((u) => (
                    <TableRow key={u.id} hover onClick={() => navigate(`/mold-management/detail?mold=${u.mold_id}`)} sx={{ cursor: "pointer" }}>
                      <TableCell sx={{ fontWeight: 800, color: "#1570EF" }}>{u.mold_code}</TableCell><TableCell>{u.machine_code}</TableCell><TableCell>{ddmmhhmm(u.removed_at)}</TableCell>
                      <TableCell sx={{ color: "#F04438", fontWeight: 700 }}>{label("removalReason", u.removal_reason)}</TableCell><TableCell>{hoursText(u.machine_down_hours)}</TableCell></TableRow>
                  ))}</TableBody>
                </Table>
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Top Removal Reasons")} />
              <Box sx={{ px: 1, pb: 1 }}>
                {!reasons.length ? <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>{tx("No data.")}</Typography> : (
                  <>
                    <Chart type="donut" height={150} series={reasons.map(([, n]) => n)} options={{
                      labels: reasons.map(([r]) => label("removalReason", r)), colors: REASON_COLORS, legend: { show: false }, dataLabels: { enabled: false }, chart: { background: "transparent" },
                      stroke: { width: 1, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light" },
                      plotOptions: { pie: { donut: { size: "64%", labels: { show: true, name: { color: axisColor }, value: { fontSize: "18px", fontWeight: 800, color: dark ? "#fff" : "#101828" },
                        total: { show: true, label: tx("Total"), color: axisColor, formatter: () => String(k.removals) } } } } } }} />
                    {reasons.map(([r, n], i) => (
                      <Stack key={r} direction="row" spacing={1} sx={{ alignItems: "center", px: 1 }}><Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: REASON_COLORS[i % REASON_COLORS.length] }} />
                        <Typography variant="caption" sx={{ flex: 1 }}>{label("removalReason", r)}</Typography><Typography variant="caption" fontWeight={700}>{n} ({num((n / (k.removals || 1)) * 100, 0)}%)</Typography></Stack>))}
                  </>
                )}
              </Box>
            </Paper>
          </Box>

          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Quick Actions")} />
            <Box sx={{ px: 1.5, pb: 1.5 }}><QuickActionGrid actions={quick} columns="repeat(auto-fill, minmax(130px, 1fr))" /></Box>
          </Paper>
        </>
      ) : null}
    </MoldPageFrame>
  );
}
