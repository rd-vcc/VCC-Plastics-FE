import "./locales";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import Chart from "react-apexcharts";
import { Box, Button, FormControl, InputLabel, LinearProgress, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";

import { downloadCsv } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, btn, cardSx, ddmmhhmm, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { label, tx } from "../moldLocales";
import { MoldPageFrame, useMoldData, useMoldPage } from "../moldPage";
import { DigitalTwin, Timeline, materialOf, openDoc } from "../moldParts";
import { InfoGrid, LifeGauge, MOLD_API, MoldImage, MoldStatusPill, QuickActionGrid, REASON_COLORS, dateText, healthColor, hoursText, lifeColor, locationText, pmText } from "../moldUi";

export default function MoldDetail() {
  const page = useMoldPage();
  const { navigate, params, setParams, dark, axisColor, grid, tableSx, canEdit, request } = page;
  const location = useLocation();
  const [molds, setMolds] = useState(null);
  const moldId = Number(params.get("mold")) || molds?.[0]?.id || null;
  const { data, loading, lastUpdate, live, setLive, load } = useMoldData(page, moldId ? `${MOLD_API}/molds/${moldId}` : null);
  useEffect(() => { request(`${MOLD_API}/summary`).then((d) => setMolds(d.items)).catch(() => setMolds([])); }, [request]);
  useEffect(() => {
    if (!data || !location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
  }, [data, location.hash]);

  const m = data?.mold;
  const cur = data?.current_installation;
  const q = data?.quality;
  const dtTotal = useMemo(() => (data?.downtime || []).reduce((a, d) => a + d.hours, 0), [data]);
  const mounted = Boolean(m?.current_machine_id);
  const lifePct = m?.life_used_pct;
  const act = (mode, action) => page.setDialog({ mode, mold: m, action });
  const withId = (path) => `${path}?mold=${moldId}`;
  const exportCsv = () => m && downloadCsv(`mold-${m.mold_code}.csv`, ["Field", "Value"], [
    ["Mold No.", m.mold_code], ["Mold Name", m.mold_name], ["Type", m.mold_type], ["Cavity", m.cavity_count], ["Status", label("moldStatus", m.status)], ["Location", locationText(m)],
    ["Current shot", m.current_shot], ["Design shot", m.design_shot], ["Life used %", m.life_used_pct], ["Remaining shot", m.remaining_shot], ["Daily avg shot", m.daily_avg_shot],
    ["Est. end of life", m.eol_date], ["PM due", m.pm_due_date], ["Health", m.health], ...data.installations.map((i) => [`Install ${ddmmhhmm(i.installed_at)}`, `${i.machine_code} ${i.wo_no || ""} → ${i.removed_at ? ddmmhhmm(i.removed_at) : "mounted"}`])]);
  const quick = m ? [
    [tx("Mold List"), ListAltOutlinedIcon, "#1570EF", () => navigate("/mold-management/list"), false],
    [tx("Mold Status"), FactCheckOutlinedIcon, "#F79009", () => navigate("/mold-management/status"), false],
    [tx("Shot Counter"), SpeedOutlinedIcon, "#7A5AF8", () => navigate(withId("/mold-management/shot-counter")), false],
    [tx("Installation History"), HistoryOutlinedIcon, "#2E90FA", () => navigate(withId("/mold-management/installation-history")), false],
    [tx("Mold Location"), SwapHorizOutlinedIcon, "#12B76A", () => navigate(withId("/mold-management/location")), false],
    [tx("Machine Detail"), PrecisionManufacturingOutlinedIcon, "#0E9384", () => navigate(`/machine-equipment/machine-detail?machine=${m.current_machine_id}`), !mounted],
    [tx("Create PM Schedule"), CalendarMonthOutlinedIcon, "#F04438", () => navigate(`/maintenance-management/planning?create=1&asset_type=MOLD${moldId ? `&asset_id=${moldId}` : ""}`), false],
  ] : [];
  const toolBtn = { ...btn("cancel"), bgcolor: "background.paper", border: 1, borderColor: "divider" };
  const breakdown = m?.health_breakdown || {};

  return (
    <MoldPageFrame page={page} title={m ? `${tx("Mold Detail")} · ${m.mold_code}` : tx("Mold Detail")} loading={loading} ready={Boolean(data && molds)} lastUpdate={lastUpdate}
      live={live} setLive={setLive} onRefresh={() => load()} onExport={exportCsv} system={data?.system} onChanged={() => load({ silent: true })}
      toolbar={<>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/mold-management/list")} sx={toolBtn}>{tx("Back to List")}</Button>
        <FormControl size="small" sx={{ minWidth: 260 }}><InputLabel>{tx("Select mold")}</InputLabel>
          <Select label={tx("Select mold")} value={moldId || ""} onChange={(e) => setParams({ mold: String(e.target.value) })}>
            {(molds || []).map((x) => <MenuItem key={x.id} value={x.id}>{x.mold_code} — {x.mold_name}</MenuItem>)}
          </Select></FormControl>
      </>}>
      {m ? (
        <>
          <Paper elevation={0} sx={{ ...cardSx, p: 1.5, mb: 1.5 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "96px minmax(0,1fr) auto" }, gap: 2, alignItems: "center" }}>
              <MoldImage src={m.image_url} height={72} iconSize={44} />
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", mb: 0.5 }}>
                  <Typography variant="h6" fontWeight={800}>{m.mold_name}</Typography><MoldStatusPill value={m.status} />
                  {m.lock_reason ? <Typography variant="caption" sx={{ color: "#F04438", fontWeight: 700 }}>{m.lock_reason}</Typography> : null}
                </Stack>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(6, auto)" }, columnGap: 3, rowGap: 0.5, justifyContent: "start" }}>
                  {[[tx("Mold No."), m.mold_code], [tx("Mold Type"), m.mold_type], [tx("Cavity"), m.cavity_count], [tx("Product"), m.product_name], [tx("Part No."), m.part_no], [tx("Revision"), m.revision ? `Rev. ${m.revision}` : null]].map(([a, b]) => (
                    <Box key={a}><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{a}</Typography><Typography variant="body2" fontWeight={700}>{b ?? EMPTY}</Typography></Box>))}
                </Box>
              </Box>
              {canEdit ? (
                <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {mounted ? <Button startIcon={<LogoutOutlinedIcon />} onClick={() => act("remove")} sx={toolBtn}>{tx("Remove Mold")}</Button>
                    : <Button startIcon={<LoginOutlinedIcon />} disabled={m.status !== "AVAILABLE"} onClick={() => act("install")} sx={toolBtn}>{tx("Install Mold")}</Button>}
                  <Button startIcon={<SwapHorizOutlinedIcon />} disabled={mounted} onClick={() => act("move")} sx={toolBtn}>{tx("Move Location")}</Button>
                  <Button startIcon={<FactCheckOutlinedIcon />} disabled={mounted} onClick={() => act("status")} sx={toolBtn}>{tx("Change Status")}</Button>
                  {m.status === "LOCKED" ? <Button startIcon={<LockOpenOutlinedIcon />} onClick={() => act("status", "UNLOCK")} sx={toolBtn}>{tx("Unlock Mold")}</Button>
                    : <Button startIcon={<LockOutlinedIcon />} disabled={mounted || !["AVAILABLE", "IN_MAINTENANCE", "IN_REPAIR"].includes(m.status)} onClick={() => act("status", "LOCK")} sx={toolBtn}>{tx("Lock Mold")}</Button>}
                  <Button startIcon={<TuneOutlinedIcon />} onClick={() => act("shots")} sx={toolBtn}>{tx("Adjust Shot Counter")}</Button>
                </Stack>
              ) : null}
            </Box>
          </Paper>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0,1fr))", xl: "minmax(0,1.1fr) minmax(0,1.3fr) minmax(0,1.1fr) minmax(0,1fr)" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Mold Digital Twin")} />
              <Box sx={{ px: 1.5, pb: 1.5 }}><DigitalTwin mold={m} documents={data.documents} compact imageHeight={200} onDocuments={() => document.getElementById("documents")?.scrollIntoView({ behavior: "smooth" })} /></Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Mold Information")} />
              <Box sx={{ px: 1.5, pb: 1.5, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <InfoGrid rows={[[tx("Mold No."), m.mold_code, "#1570EF"], [tx("Mold Name"), m.mold_name], [tx("Mold Type"), m.mold_type], [tx("Cavity"), m.cavity_count],
                  [tx("Material"), materialOf(data.attributes)], [tx("Mold Weight"), m.weight_kg != null ? `${num(m.weight_kg, 0)} kg` : null],
                  [tx("Dimension (L x W x H)"), [m.length_mm, m.width_mm, m.height_mm].every((v) => v != null) ? `${num(m.length_mm, 0)} x ${num(m.width_mm, 0)} x ${num(m.height_mm, 0)}` : null]]} />
                <InfoGrid rows={[[tx("Product"), m.product_name], [tx("Part No."), m.part_no], [tx("Revision"), m.revision], [tx("Manufacturer"), m.manufacturer],
                  [tx("Manufacture Date"), dateText(m.manufacture_date)], [tx("Mold Life (Design)"), `${num(m.design_shot)} shots`], [tx("Mold Life Unit"), tx("Shot")],
                  ...data.attributes.filter((a) => a.value != null && a.value !== "" && !/steel|material/i.test(a.attribute_code)).map((a) => [a.attribute_name, `${a.value}${a.unit ? ` ${a.unit}` : ""}`])]} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Life & Shot Counter")} />
              <Box sx={{ px: 1.5, pb: 1.5 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "130px minmax(0,1fr)", alignItems: "center", gap: 1 }}>
                  <LifeGauge value={lifePct} dark={dark} height={160} />
                  <InfoGrid cols="auto 1fr" rows={[[tx("Current Shot"), num(m.current_shot)], [tx("Target Shot"), num(m.design_shot)], [tx("Remaining Shot"), num(m.remaining_shot)],
                    [tx("Remaining Life"), lifePct != null ? `${num(Math.max(100 - lifePct, 0), 1)}%` : EMPTY], [tx("Daily Avg. Shot"), num(m.daily_avg_shot)], [tx("Expected End of Life"), dateText(m.eol_date)]]} />
                </Box>
                <LinearProgress variant="determinate" value={Math.min(lifePct || 0, 100)} sx={{ mt: 1, height: 9, borderRadius: 5, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: lifeColor(lifePct) } }} />
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>{["0%", "25%", "50%", "75%", "100%"].map((t) => <Typography key={t} variant="caption" color="text.secondary">{t}</Typography>)}</Stack>
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Mold Status")} />
              <Box sx={{ px: 1.5, pb: 1.5 }}>
                <InfoGrid rows={[[tx("Status"), label("moldStatus", m.status)], [tx("Location"), locationText(m)], [tx("Machine"), m.machine_code ? `${m.machine_code} · ${m.machine_name}` : null],
                  [tx("Work Order"), m.wo_no ? `${m.wo_no} · ${label("woStatus", m.wo_status)}` : null], [tx("Install Date"), cur ? ddmmhhmm(cur.installed_at) : null],
                  [tx("Installed By"), cur?.installed_by], [tx("Operator"), cur?.operator_code || m.work_order?.operator_code], [tx("Since"), m.location_since ? `${ddmmhhmm(m.location_since)} · ${hoursText(m.since_hours)}` : null],
                  [tx("Last Update"), ddmmhhmm(m.updated_at)]]} />
                <Tooltip arrow title={<Box sx={{ fontSize: 11.5 }}>{tx("Health score breakdown")}:<br />
                  {[["Life used", "life"], ["Repairs (180 days)", "repair"], ["PM", "pm"], ["Mold downtime (30 days)", "downtime"], ["NG rate (30 days)", "quality"], ["Locked", "locked"]].map(([t, key]) => <div key={key}>{tx(t)}: −{breakdown[key] || 0}</div>)}</Box>}>
                  <Stack direction="row" spacing={1} sx={{ mt: 1.25, p: 1.25, borderRadius: 2, border: 1.5, borderColor: healthColor(m.health), alignItems: "center", cursor: "help" }}>
                    <FavoriteBorderOutlinedIcon sx={{ color: healthColor(m.health) }} /><Typography fontWeight={800} sx={{ flex: 1, color: healthColor(m.health) }}>{tx("Health Score")}</Typography>
                    <Typography variant="h6" fontWeight={800} sx={{ color: healthColor(m.health) }}>{m.health} / 100</Typography>
                  </Stack>
                </Tooltip>
              </Box>
            </Paper>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1.4fr) minmax(0,1.4fr) minmax(0,0.9fr)" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Installation History")} subtitle={`(${data.installations.length})`} action={<Button size="small" onClick={() => navigate(withId("/mold-management/installation-history"))} sx={{ textTransform: "none", fontSize: 12 }}>{tx("View all")}</Button>} />
              <Box sx={{ px: 1, pb: 1, maxHeight: 250, overflow: "auto" }}>
                <Table size="small" stickyHeader sx={tableSx}>
                  <TableHead><TableRow><TableCell>{tx("Machine")}</TableCell><TableCell>{tx("Work Order")}</TableCell><TableCell>{tx("Install Date")}</TableCell><TableCell>{tx("Remove Date")}</TableCell>
                    <TableCell align="right">{tx("Cycle Time (s)")}</TableCell><TableCell>{tx("Installed By")}</TableCell><TableCell>{tx("Removal reason")}</TableCell></TableRow></TableHead>
                  <TableBody>{data.installations.map((i) => (
                    <TableRow key={i.id}><TableCell sx={{ fontWeight: 700 }}>{i.machine_code}</TableCell><TableCell>{i.wo_no || EMPTY}</TableCell><TableCell>{ddmmhhmm(i.installed_at)}</TableCell>
                      <TableCell>{i.removed_at ? ddmmhhmm(i.removed_at) : <Box component="span" sx={{ color: "#12B76A", fontWeight: 700 }}>{tx("In Use")}</Box>}</TableCell>
                      <TableCell align="right">{i.avg_cycle != null ? num(i.avg_cycle, 1) : EMPTY}</TableCell><TableCell>{i.installed_by || EMPTY}</TableCell>
                      <TableCell sx={{ color: i.planned === 0 ? "#F04438" : undefined }}>{i.removal_reason ? label("removalReason", i.removal_reason) : EMPTY}</TableCell></TableRow>
                  ))}</TableBody>
                </Table>
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx} id="maintenance">
              <Head title={tx("Maintenance History")} subtitle={`(${data.maintenance.length})`} />
              <Box sx={{ px: 1, pb: 1, maxHeight: 250, overflow: "auto" }}>
                <Table size="small" stickyHeader sx={tableSx}>
                  <TableHead><TableRow><TableCell>{tx("PM Type")}</TableCell><TableCell>{tx("PM Date")}</TableCell><TableCell>{tx("Technician")}</TableCell><TableCell>{tx("Description")}</TableCell><TableCell align="right">{tx("Downtime (h)")}</TableCell></TableRow></TableHead>
                  <TableBody>{data.maintenance.map((e) => (
                    <TableRow key={e.id}><TableCell sx={{ fontWeight: 700, color: e.event_type.startsWith("REPAIR") ? "#F04438" : "#7A5AF8" }}>{label("maintenanceType", e.maintenance_type)}</TableCell>
                      <TableCell>{ddmmhhmm(e.event_at)}</TableCell><TableCell>{e.technician || e.actor || EMPTY}</TableCell>
                      <TableCell sx={{ whiteSpace: "normal", minWidth: 160 }}>{label("eventType", e.event_type)}{e.reason ? ` · ${e.reason}` : ""}</TableCell>
                      <TableCell align="right">{e.downtime_hours != null ? num(e.downtime_hours, 1) : EMPTY}</TableCell></TableRow>
                  ))}</TableBody>
                </Table>
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Next Maintenance")} />
              <Box sx={{ px: 1.5, pb: 1.5 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1 }}>
                  <EngineeringOutlinedIcon sx={{ fontSize: 40, color: m.pm_overdue ? "#F04438" : "#12B76A" }} />
                  <InfoGrid rows={[[tx("PM Type"), m.pm_type ? label("maintenanceType", m.pm_type) : null], [tx("Next PM Date"), dateText(m.pm_due_date), m.pm_overdue ? "#F04438" : undefined],
                    [tx("Remaining Days"), pmText(m), m.pm_overdue ? "#F04438" : "#12B76A"], [tx("Next PM at shot"), m.next_pm_shot != null ? num(m.next_pm_shot) : null],
                    [tx("Last PM"), m.last_pm_at ? `${ddmmhhmm(m.last_pm_at)} · ${num(m.last_pm_shot)} shots` : null]]} />
                </Stack>
                <Button fullWidth startIcon={<CalendarMonthOutlinedIcon />} onClick={() => navigate(`/maintenance-management/planning?create=1&asset_type=MOLD${moldId ? `&asset_id=${moldId}` : ""}`)} sx={btn("primary")}>{tx("Create PM Schedule")}</Button>
              </Box>
            </Paper>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0,1fr))", xl: "minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Shot Counter History (30 days)")} />
              <Box sx={{ px: 1, pb: 0.5 }}>
                <Chart type="line" height={220} series={[{ name: tx("Current Shot"), data: data.shot_history.map((s) => s.total) }, { name: tx("Daily Shots"), type: "column", data: data.shot_history.map((s) => s.shots) }]} options={{
                  chart: { background: "transparent", toolbar: { show: false } }, colors: ["#12B76A", "#2E90FA"], stroke: { width: [2.5, 0] },
                  xaxis: { categories: data.shot_history.map((s) => dateText(s.date).slice(0, 5)), tickAmount: 6, labels: { rotate: 0, style: { colors: axisColor, fontSize: "10px" } } },
                  yaxis: [{ labels: { style: { colors: axisColor }, formatter: (v) => num(v, 0) } }, { opposite: true, labels: { style: { colors: axisColor }, formatter: (v) => num(v, 0) } }],
                  legend: { position: "top", labels: { colors: axisColor } }, grid, tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v) => num(v) } } }} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Downtime Analysis (30 days)")} />
              <Box sx={{ px: 1, pb: 1 }}>
                {!data.downtime.length ? <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>{tx("No data.")}</Typography> : (
                  <>
                    <Chart type="donut" height={160} series={data.downtime.map((d) => d.hours)} options={{
                      labels: data.downtime.map((d) => d.reason), colors: REASON_COLORS, legend: { show: false }, dataLabels: { enabled: false }, chart: { background: "transparent" },
                      stroke: { width: 1, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v) => `${num(v, 1)} h` } },
                      plotOptions: { pie: { donut: { size: "68%", labels: { show: true, name: { color: axisColor }, value: { fontSize: "18px", fontWeight: 800, color: dark ? "#fff" : "#101828", formatter: (v) => `${num(Number(v), 1)} h` },
                        total: { show: true, label: tx("Total"), color: axisColor, formatter: () => `${num(dtTotal, 1)} h` } } } } } }} />
                    {data.downtime.slice(0, 5).map((d, i) => (
                      <Stack key={d.reason} direction="row" spacing={1} sx={{ alignItems: "center", px: 1 }}><Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: REASON_COLORS[i % REASON_COLORS.length] }} />
                        <Typography variant="caption" sx={{ flex: 1 }} noWrap>{d.reason === "UNSPECIFIED" ? EMPTY : d.reason}</Typography>
                        <Typography variant="caption" fontWeight={700}>{num(d.hours, 1)} h ({num((d.hours / (dtTotal || 1)) * 100, 0)}%)</Typography></Stack>))}
                  </>
                )}
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Quality Summary (30 days)")} />
              <Box sx={{ px: 1.5, pb: 1.5, display: "grid", gridTemplateColumns: "1fr 120px", alignItems: "center", gap: 1 }}>
                <InfoGrid cols="minmax(96px,1fr) auto" rows={[[tx("Total Produced"), `${num(q.produced)} pcs`], [tx("Good Quantity"), `${num(q.good)} pcs`, "#12B76A"], [tx("NG Quantity"), `${num(q.ng)} pcs`, "#F04438"],
                  [tx("NG Rate"), `${num(q.ng_rate, 2)}%`, "#F04438"], [tx("Top NG Reason"), q.top_ng[0] ? `${q.top_ng[0].reason.replace(/^Reject:\s*/, "")} (${q.top_ng[0].qty})` : null]]} />
                <Chart type="radialBar" height={140} series={[q.good_rate || 0]} options={{
                  chart: { background: "transparent", sparkline: { enabled: true } }, colors: ["#12B76A"], labels: [tx("Good Rate")],
                  plotOptions: { radialBar: { hollow: { size: "60%" }, track: { background: dark ? "#263244" : "#EEF2F6" }, dataLabels: { name: { offsetY: 16, fontSize: "10px", color: axisColor },
                    value: { offsetY: -10, fontSize: "16px", fontWeight: 800, color: dark ? "#fff" : "#101828", formatter: (v) => `${num(v, 2)}%` } } } } }} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx} id="documents">
              <Head title={tx("Documents & Files")} subtitle={`(${data.documents.length})`} />
              <Box sx={{ px: 1.5, pb: 1.5, maxHeight: 230, overflow: "auto" }}>
                {!data.documents.length ? <Typography variant="caption" color="text.secondary">{tx("Documents are uploaded by admins in System Configuration.")}</Typography> : data.documents.map((d) => (
                  <Stack key={d.id} direction="row" spacing={1} onClick={() => openDoc(d)} sx={{ alignItems: "center", py: 0.6, borderBottom: 1, borderColor: "divider", cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}>
                    <InsertDriveFileOutlinedIcon sx={{ fontSize: 20, color: /\.pdf$/i.test(d.file_url) ? "#F04438" : /\.xlsx$/i.test(d.file_url) ? "#12B76A" : "#1570EF" }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" fontWeight={700} sx={{ display: "block" }} noWrap>{d.title}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5 }}>{label("docType", d.doc_type)} · {dateText(d.uploaded_at)}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">{d.file_size ? `${num(d.file_size / 1048576, 2)} MB` : ""}</Typography>
                  </Stack>
                ))}
              </Box>
            </Paper>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1.2fr) minmax(0,1fr)" }, gap: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Status Timeline")} subtitle={`(${data.events.length})`} />
              <Box sx={{ px: 1.5, pb: 1.5, maxHeight: 300, overflow: "auto" }}><Timeline events={data.events} dated max={50} /></Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Quick Actions")} />
              <Box sx={{ px: 1.5, pb: 1.5 }}><QuickActionGrid actions={quick} /></Box>
            </Paper>
          </Box>
        </>
      ) : null}
    </MoldPageFrame>
  );
}
