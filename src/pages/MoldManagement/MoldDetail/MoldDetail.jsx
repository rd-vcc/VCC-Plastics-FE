import "./locales";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import Chart from "react-apexcharts";
import { Box, Button, FormControl, InputLabel, LinearProgress, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";

import { colShares, downloadExcel } from "../../MaterialManagement/materialUi";
import { Dot, EMPTY, Head, cardSx, ddmmhhmm, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { EmptyBody, QuickCard, cellsSx, chartBase, fillSx, fitGridSx, panelSx, toolBtnSx, who } from "../../shared/onePage";
import { label, tx, txs } from "../moldLocales";
import { MoldPageFrame, useMoldData, useMoldPage } from "../moldPage";
import { Timeline, materialOf, openDoc } from "../moldParts";
import { InfoGrid, LifeGauge, MOLD_API, MoldImage, MoldStatusPill, REASON_COLORS, dateText, healthColor, hoursText, lifeColor, locationText, pmText } from "../moldUi";

export default function MoldDetail() {
  const page = useMoldPage();
  const { navigate, params, setParams, dark, axisColor, tableSx, canEdit, request } = page;
  const location = useLocation();
  const [molds, setMolds] = useState(null);
  const [infoView, setInfoView] = useState("info");
  const [histView, setHistView] = useState("maint");
  const moldId = Number(params.get("mold")) || molds?.[0]?.id || null;
  const { data, loading, lastUpdate, live, setLive, load } = useMoldData(page, moldId ? `${MOLD_API}/molds/${moldId}` : null);
  useEffect(() => { request(`${MOLD_API}/summary`).then((d) => setMolds(d.items)).catch(() => setMolds([])); }, [request]);
  useEffect(() => {
    if (!data || !location.hash) return;
    if (location.hash === "#documents") setInfoView("docs");
    if (location.hash === "#maintenance") setHistView("maint");
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
  const exportCsv = () => m && downloadExcel(`mold-${m.mold_code}.csv`, ["Field", "Value"], [
    ["Mold No.", m.mold_code], ["Mold Name", m.mold_name], ["Type", m.mold_type], ["Cavity", m.cavity_count], ["Status", label("moldStatus", m.status)], ["Location", locationText(m)],
    ["Current shot", m.current_shot], ["Design shot", m.design_shot], ["Life used %", m.life_used_pct], ["Remaining shot", m.remaining_shot], ["Daily avg shot", m.daily_avg_shot],
    ["Est. end of life", m.eol_date], ["PM due", m.pm_due_date], ["Health", m.health], ...data.installations.map((i) => [`Install ${ddmmhhmm(i.installed_at)}`, `${i.machine_code} ${i.wo_no || ""} → ${i.removed_at ? ddmmhhmm(i.removed_at) : "mounted"}`])]);
  // every action on the mold sits in one place (Quick Actions); navigation links sit in the header of the card they expand
  const quick = m ? [
    mounted ? [tx("Remove Mold"), LogoutOutlinedIcon, "#F79009", () => act("remove"), !canEdit]
      : [tx("Install Mold"), LoginOutlinedIcon, "#12B76A", () => act("install"), !canEdit || m.status !== "AVAILABLE"],
    [tx("Move Location"), SwapHorizOutlinedIcon, "#2E90FA", () => act("move"), !canEdit || mounted],
    [tx("Change Status"), FactCheckOutlinedIcon, "#7A5AF8", () => act("status"), !canEdit || mounted],
    m.status === "LOCKED" ? [tx("Unlock Mold"), LockOpenOutlinedIcon, "#12B76A", () => act("status", "UNLOCK"), !canEdit]
      : [tx("Lock Mold"), LockOutlinedIcon, "#F04438", () => act("status", "LOCK"), !canEdit || mounted || !["AVAILABLE", "IN_MAINTENANCE", "IN_REPAIR"].includes(m.status)],
    [txs("Adjust shots (short)", "Adjust Shot Counter"), TuneOutlinedIcon, "#0E9384", () => act("shots"), !canEdit],
    [tx("Create PM Schedule"), CalendarMonthOutlinedIcon, "#F04438", () => navigate(`/maintenance-management/planning?create=1&asset_type=MOLD${moldId ? `&asset_id=${moldId}` : ""}`), false],
  ] : [];
  const breakdown = m?.health_breakdown || {};
  const base = chartBase(dark, axisColor);
  const toggleSx = { px: 1, py: 0.1, textTransform: "none", fontWeight: 700, fontSize: 10.5 };
  const link = (text, onClick) => <Typography variant="caption" onClick={onClick} sx={{ color: "#1570EF", cursor: "pointer", fontWeight: 700 }}>{text}</Typography>;
  const scroll = { flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1 };

  return (
    <MoldPageFrame fit page={page} title={m ? `${tx("Mold Detail")} · ${m.mold_code}` : tx("Mold Detail")} loading={loading} ready={Boolean(data && molds)} lastUpdate={lastUpdate}
      live={live} setLive={setLive} onRefresh={() => load()} onExport={exportCsv} system={data?.system} onChanged={() => load({ silent: true })}
      toolbar={<>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/mold-management/list")} sx={toolBtnSx}>{tx("Back to List")}</Button>
        <FormControl size="small" sx={{ minWidth: 260 }}><InputLabel>{tx("Select mold")}</InputLabel>
          <Select label={tx("Select mold")} value={moldId || ""} onChange={(e) => setParams({ mold: String(e.target.value) })}>
            {(molds || []).map((x) => <MenuItem key={x.id} value={x.id}>{x.mold_code} — {x.mold_name}</MenuItem>)}
          </Select></FormControl>
      </>}>
      {m ? (
        <>
          <Paper elevation={0} sx={{ ...cardSx, px: 1.5, py: 1 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "auto minmax(0,1fr)" }, gap: 3, alignItems: "center" }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={800} noWrap>{m.mold_name}</Typography><MoldStatusPill value={m.status} />
                {m.lock_reason ? <Typography variant="caption" sx={{ color: "#F04438", fontWeight: 700 }} noWrap>{m.lock_reason}</Typography> : null}
              </Stack>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0,1fr))", md: "repeat(6, minmax(0,1fr))" }, columnGap: 2 }}>
                {[[tx("Mold No."), m.mold_code], [tx("Product"), m.product_name], [tx("Part No."), m.part_no], [tx("Revision"), m.revision ? `Rev. ${m.revision}` : null],
                  [tx("Location"), locationText(m)], [tx("Work Order"), m.wo_no ? `${m.wo_no} · ${label("woStatus", m.wo_status)}` : null]].map(([a, b]) => (
                  <Box key={a} sx={{ minWidth: 0 }}><Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 10, lineHeight: 1.3 }} noWrap>{a}</Typography>
                    <Typography variant="caption" fontWeight={700} sx={{ display: "block", lineHeight: 1.3 }} noWrap title={b ?? ""}>{b ?? EMPTY}</Typography></Box>))}
              </Box>
            </Box>
          </Paper>

          <Box sx={{ ...fitGridSx, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" }, gridTemplateRows: { lg: "repeat(3, minmax(0,1fr))" } }}>
            <Paper elevation={0} sx={panelSx} id="documents">
              <Head title={infoView === "docs" ? tx("Documents & Files") : tx("Mold Information")} action={(
                <ToggleButtonGroup exclusive size="small" value={infoView} onChange={(e, v) => v && setInfoView(v)}>
                  <ToggleButton value="info" sx={toggleSx}>{tx("Information")}</ToggleButton>
                  <ToggleButton value="docs" sx={toggleSx}>{tx("Documents")} ({data.documents.length})</ToggleButton>
                </ToggleButtonGroup>
              )} />
              {infoView === "info" ? (
                <Box sx={{ ...scroll, display: "grid", gridTemplateColumns: "minmax(0,0.8fr) minmax(0,1.2fr)", gap: 1.25, alignItems: "start" }}>
                  <MoldImage src={m.image_url} height={120} iconSize={56} />
                  <InfoGrid nowrap rows={[[tx("Mold Type"), m.mold_type], [tx("Cavity"), m.cavity_count], [tx("Material"), materialOf(data.attributes)],
                    [tx("Mold Weight"), m.weight_kg != null ? `${num(m.weight_kg, 0)} kg` : null],
                    [tx("Dimension (L x W x H)"), [m.length_mm, m.width_mm, m.height_mm].every((v) => v != null) ? `${num(m.length_mm, 0)} x ${num(m.width_mm, 0)} x ${num(m.height_mm, 0)}` : null],
                    [tx("Manufacturer"), m.manufacturer], [tx("Manufacture Date"), dateText(m.manufacture_date)], [tx("Mold Life (Design)"), `${num(m.design_shot)} shots`],
                    ...data.attributes.filter((a) => a.value != null && a.value !== "" && !/steel|material/i.test(a.attribute_code)).map((a) => [a.attribute_name, `${a.value}${a.unit ? ` ${a.unit}` : ""}`])]} />
                </Box>
              ) : data.documents.length ? (
                <Box sx={scroll}>
                  {data.documents.map((d) => (
                    <Stack key={d.id} direction="row" spacing={1} onClick={() => openDoc(d)} sx={{ alignItems: "center", py: 0.5, borderBottom: 1, borderColor: "divider", cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}>
                      <InsertDriveFileOutlinedIcon sx={{ fontSize: 16, color: /\.pdf$/i.test(d.file_url) ? "#F04438" : /\.xlsx$/i.test(d.file_url) ? "#12B76A" : "#1570EF" }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" fontWeight={700} sx={{ display: "block" }} noWrap>{d.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{label("docType", d.doc_type)} · {dateText(d.uploaded_at)}</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">{d.file_size ? `${num(d.file_size / 1048576, 2)} MB` : ""}</Typography>
                    </Stack>
                  ))}
                </Box>
              ) : <EmptyBody text={tx("Documents are uploaded by admins in System Configuration.")} />}
            </Paper>

            <Paper elevation={0} sx={panelSx}>
              <Head title={tx("Life & Shot Counter")} action={link(tx("Shot Counter"), () => navigate(withId("/mold-management/shot-counter")))} />
              <Box sx={{ ...scroll, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "120px minmax(0,1fr)", alignItems: "center", gap: 1 }}>
                  <LifeGauge value={lifePct} dark={dark} height={140} />
                  <InfoGrid nowrap rows={[[tx("Current Shot"), num(m.current_shot)], [tx("Target Shot"), num(m.design_shot)], [tx("Remaining Shot"), num(m.remaining_shot)],
                    [tx("Remaining Life"), lifePct != null ? `${num(Math.max(100 - lifePct, 0), 1)}%` : EMPTY], [tx("Daily Avg. Shot"), num(m.daily_avg_shot)], [tx("Expected End of Life"), dateText(m.eol_date)]]} />
                </Box>
                <LinearProgress variant="determinate" value={Math.min(lifePct || 0, 100)} sx={{ mt: 0.75, height: 7, borderRadius: 5, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: lifeColor(lifePct) } }} />
              </Box>
            </Paper>

            <Paper elevation={0} sx={panelSx}>
              <Head title={tx("Mold Status")} action={(
                <Tooltip arrow title={<Box sx={{ fontSize: 11 }}>{tx("Health score breakdown")}:<br />
                  {[["Life used", "life"], ["Repairs (180 days)", "repair"], ["PM", "pm"], ["Mold downtime (30 days)", "downtime"], ["NG rate (30 days)", "quality"], ["Locked", "locked"]].map(([t, key]) => <div key={key}>{tx(t)}: −{breakdown[key] || 0}</div>)}</Box>}>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", px: 0.75, height: 22, borderRadius: 1, border: 1, borderColor: healthColor(m.health), cursor: "help" }}>
                    <FavoriteBorderOutlinedIcon sx={{ fontSize: 14, color: healthColor(m.health) }} />
                    <Typography variant="caption" fontWeight={800} sx={{ color: healthColor(m.health) }}>{tx("Health Score")} {m.health}/100</Typography>
                  </Stack>
                </Tooltip>
              )} />
              <Box sx={scroll}>
                <InfoGrid nowrap rows={[[tx("Status"), label("moldStatus", m.status)], [tx("Machine"), m.machine_code ? `${m.machine_code} · ${m.machine_name}` : null],
                  [tx("Install Date"), cur ? ddmmhhmm(cur.installed_at) : null], [tx("Installed By"), cur?.installed_by], [tx("Operator"), cur?.operator_code || m.work_order?.operator_code],
                  [tx("Since"), m.location_since ? `${ddmmhhmm(m.location_since)} · ${hoursText(m.since_hours)}` : null], [tx("Last Update"), ddmmhhmm(m.updated_at)]]} />
                {mounted ? <Box sx={{ mt: 0.75 }}>{link(tx("Machine Detail"), () => navigate(`/machine-equipment/machine-detail?machine=${m.current_machine_id}`))}</Box> : null}
              </Box>
            </Paper>

            <Paper elevation={0} sx={panelSx}>
              <Head title={tx("Next Maintenance")} />
              <Stack direction="row" spacing={1.5} sx={{ ...scroll, alignItems: "center" }}>
                <EngineeringOutlinedIcon sx={{ fontSize: 30, color: m.pm_overdue ? "#F04438" : "#12B76A" }} />
                <InfoGrid nowrap rows={[[tx("PM Type"), m.pm_type ? label("maintenanceType", m.pm_type) : null], [tx("Next PM Date"), dateText(m.pm_due_date), m.pm_overdue ? "#F04438" : undefined],
                  [tx("Remaining Days"), pmText(m), m.pm_overdue ? "#F04438" : "#12B76A"], [tx("Next PM at shot"), m.next_pm_shot != null ? num(m.next_pm_shot) : null],
                  [tx("Last PM"), m.last_pm_at ? `${ddmmhhmm(m.last_pm_at)} · ${num(m.last_pm_shot)} shots` : null]]} />
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 3" } }}>
              <Head title={`${tx("Installation History")} (${data.installations.length})`} action={link(tx("View all"), () => navigate(withId("/mold-management/installation-history")))} />
              {data.installations.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(12, 15, 15, 15, 11, 14, 18) }}>
                    <TableHead><TableRow><TableCell>{tx("Machine")}</TableCell><TableCell>{tx("Work Order")}</TableCell><TableCell>{tx("Install Date")}</TableCell><TableCell>{tx("Remove Date")}</TableCell>
                      <TableCell align="right">{tx("Cycle Time (s)")}</TableCell><TableCell>{tx("Installed By")}</TableCell><TableCell>{tx("Removal reason")}</TableCell></TableRow></TableHead>
                    <TableBody>{data.installations.map((i) => (
                      <TableRow key={i.id}><TableCell sx={{ fontWeight: 700 }}>{i.machine_code}</TableCell><TableCell>{i.wo_no || EMPTY}</TableCell><TableCell>{ddmmhhmm(i.installed_at)}</TableCell>
                        <TableCell>{i.removed_at ? ddmmhhmm(i.removed_at) : <Box component="span" sx={{ color: "#12B76A", fontWeight: 700 }}>{tx("In Use")}</Box>}</TableCell>
                        <TableCell align="right">{i.avg_cycle != null ? num(i.avg_cycle, 1) : EMPTY}</TableCell><TableCell title={who(i.installed_by)}>{who(i.installed_by)}</TableCell>
                        <TableCell sx={{ color: i.planned === 0 ? "#F04438" : undefined }} title={i.removal_reason ? label("removalReason", i.removal_reason) : ""}>{i.removal_reason ? label("removalReason", i.removal_reason) : EMPTY}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "3 / 5" } }} id="maintenance">
              <Head title={histView === "timeline" ? `${tx("Status Timeline")} (${data.events.length})` : `${tx("Maintenance History")} (${data.maintenance.length})`} action={(
                <ToggleButtonGroup exclusive size="small" value={histView} onChange={(e, v) => v && setHistView(v)}>
                  <ToggleButton value="maint" sx={toggleSx}>{tx("Maintenance History")}</ToggleButton>
                  <ToggleButton value="timeline" sx={toggleSx}>{tx("Status Timeline")}</ToggleButton>
                </ToggleButtonGroup>
              )} />
              {histView === "timeline" ? (
                data.events.length ? <Box sx={scroll}><Timeline events={data.events} dated max={50} /></Box> : <EmptyBody text={tx("No data.")} />
              ) : data.maintenance.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(18, 17, 20, 33, 12) }}>
                    <TableHead><TableRow><TableCell>{tx("PM Type")}</TableCell><TableCell>{tx("PM Date")}</TableCell><TableCell>{tx("Technician")}</TableCell><TableCell>{tx("Description")}</TableCell><TableCell align="right">{tx("Downtime (h)")}</TableCell></TableRow></TableHead>
                    <TableBody>{data.maintenance.map((e) => (
                      <TableRow key={e.id}><TableCell sx={{ fontWeight: 700, color: e.event_type.startsWith("REPAIR") ? "#F04438" : "#7A5AF8" }}>{label("maintenanceType", e.maintenance_type)}</TableCell>
                        <TableCell>{ddmmhhmm(e.event_at)}</TableCell><TableCell title={who(e.technician || e.actor)}>{who(e.technician || e.actor)}</TableCell>
                        <TableCell title={`${label("eventType", e.event_type)}${e.reason ? ` · ${e.reason}` : ""}`}>{label("eventType", e.event_type)}{e.reason ? ` · ${e.reason}` : ""}</TableCell>
                        <TableCell align="right">{e.downtime_hours != null ? num(e.downtime_hours, 1) : EMPTY}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>

            <Paper elevation={0} sx={panelSx}>
              <Head title={tx("Shot Counter History (30 days)")} action={<Stack direction="row" spacing={1.5}><Dot color="#12B76A" text={tx("Current Shot")} /><Dot color="#2E90FA" text={tx("Daily Shots")} /></Stack>} />
              <Box sx={{ flex: 1, minHeight: 0, px: 1 }}>
                <Chart type="line" height="100%" series={[{ name: tx("Current Shot"), data: data.shot_history.map((s) => s.total) }, { name: tx("Daily Shots"), type: "column", data: data.shot_history.map((s) => s.shots) }]} options={{
                  ...base, colors: ["#12B76A", "#2E90FA"], stroke: { width: [2, 0] },
                  xaxis: { ...base.xaxis, categories: data.shot_history.map((s) => dateText(s.date).slice(0, 5)), tickAmount: 6 },
                  yaxis: [{ tickAmount: 4, labels: { ...base.yaxis.labels, formatter: (v) => num(v, 0) } }, { opposite: true, tickAmount: 4, labels: { ...base.yaxis.labels, formatter: (v) => num(v, 0) } }],
                  tooltip: { ...base.tooltip, y: { formatter: (v) => num(v) } } }} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={panelSx}>
              <Head title={tx("Downtime Analysis (30 days)")} action={<Typography variant="caption" color="text.secondary">{num(dtTotal, 1)} h</Typography>} />
              {data.downtime.length ? (
                <Box sx={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "130px 1fr", alignItems: "center", px: 1, pb: 1 }}>
                  <Chart type="donut" height={140} series={data.downtime.map((d) => d.hours)} options={{
                    labels: data.downtime.map((d) => d.reason), colors: REASON_COLORS, legend: { show: false }, dataLabels: { enabled: false }, chart: { background: "transparent" },
                    stroke: { width: 1, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v) => `${num(v, 1)} h` } }, plotOptions: { pie: { donut: { size: "66%" } } } }} />
                  <Stack spacing={0.4}>{data.downtime.slice(0, 6).map((d, i) => (
                    <Stack key={d.reason} direction="row" spacing={0.75} sx={{ alignItems: "center" }}><Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: REASON_COLORS[i % REASON_COLORS.length] }} />
                      <Typography variant="caption" sx={{ flex: 1 }} noWrap>{d.reason === "UNSPECIFIED" ? EMPTY : d.reason}</Typography>
                      <Typography variant="caption" fontWeight={700}>{num(d.hours, 1)} h</Typography></Stack>))}</Stack>
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>
            <Paper elevation={0} sx={panelSx}>
              <Head title={tx("Quality Summary (30 days)")} />
              <Box sx={{ ...scroll, display: "grid", gridTemplateColumns: "minmax(0,1fr) 110px", alignItems: "center", gap: 1 }}>
                <InfoGrid nowrap rows={[[tx("Total Produced"), `${num(q.produced)} pcs`], [tx("Good Quantity"), `${num(q.good)} pcs`, "#12B76A"], [tx("NG Quantity"), `${num(q.ng)} pcs`, "#F04438"],
                  [tx("NG Rate"), `${num(q.ng_rate, 2)}%`, "#F04438"], [tx("Top NG Reason"), q.top_ng[0] ? `${q.top_ng[0].reason.replace(/^Reject:\s*/, "")} (${q.top_ng[0].qty})` : null]]} />
                <Chart type="radialBar" height={130} series={[q.good_rate || 0]} options={{
                  chart: { background: "transparent", sparkline: { enabled: true } }, colors: ["#12B76A"], labels: [tx("Good Rate")],
                  plotOptions: { radialBar: { hollow: { size: "60%" }, track: { background: dark ? "#263244" : "#EEF2F6" }, dataLabels: { name: { offsetY: 16, fontSize: "10px", color: axisColor },
                    value: { offsetY: -10, fontSize: "13px", fontWeight: 800, color: dark ? "#fff" : "#101828", formatter: (v) => `${num(v, 1)}%` } } } } }} />
              </Box>
            </Paper>
            <Box sx={{ display: "flex", minHeight: 0, "& > *": { flex: 1 } }}>
              <QuickCard title={tx("Quick Actions")} actions={quick} columns={3} />
            </Box>
          </Box>
        </>
      ) : null}
    </MoldPageFrame>
  );
}
