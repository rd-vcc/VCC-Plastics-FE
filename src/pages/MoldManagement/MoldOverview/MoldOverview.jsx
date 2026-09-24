import "./locales";
import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { Box, InputAdornment, LinearProgress, Paper, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography } from "@mui/material";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import TimelapseOutlinedIcon from "@mui/icons-material/TimelapseOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";

import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, downloadCsv } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, cardSx, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { label, tx } from "../moldLocales";
import { MoldPageFrame, useMoldData, useMoldPage } from "../moldPage";
import { DigitalTwin, PmDueList } from "../moldParts";
import {
  InfoGrid, LIFE_BUCKET_COLORS, LifeBar, LifeGauge, MOLD_API, MOLD_STATUS_COLORS, MoldRowMenu, MoldStatusPill, QuickActionGrid, dateText, locationText,
} from "../moldUi";

const TABS = ["ALL", "IN_PRODUCTION", "AVAILABLE", "IN_MAINTENANCE", "IN_REPAIR", "OUT_OF_SERVICE"];

export default function MoldOverview() {
  const page = useMoldPage();
  const { navigate, dark, axisColor, grid, tableSx, canEdit, request } = page;
  const { data, loading, lastUpdate, live, setLive, load } = useMoldData(page, `${MOLD_API}/summary`);
  const [tab, setTab] = useState("ALL");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (!data || selectedId) return;
    const first = data.items.find((m) => m.status === "IN_PRODUCTION") || data.items[0];
    if (first) setSelectedId(first.id);
  }, [data, selectedId]);
  useEffect(() => { if (selectedId) request(`${MOLD_API}/molds/${selectedId}`).then(setDetail).catch(() => setDetail(null)); }, [selectedId, request, lastUpdate]);

  const k = data?.kpis || {};
  const total = k.total || 0;
  const pct = (n) => (total ? `${num((n / total) * 100, 1)}% ${tx("of total")}` : "");
  const items = (data?.items || []).filter((m) => (tab === "ALL" || m.status === tab || (tab === "OUT_OF_SERVICE" && ["RETIRED", "SCRAPPED"].includes(m.status)))
    && (!q || `${m.mold_code} ${m.mold_name} ${m.product_name || ""} ${m.machine_code || ""}`.toLowerCase().includes(q.toLowerCase())));
  const count = (s) => (data?.items || []).filter((m) => s === "ALL" || m.status === s || (s === "OUT_OF_SERVICE" && ["RETIRED", "SCRAPPED"].includes(m.status))).length;
  const sel = detail?.mold?.id === selectedId ? detail.mold : null;
  const detailUrl = (id) => `/mold-management/detail?mold=${id}`;
  const statusSeries = data ? ["IN_PRODUCTION", "AVAILABLE", "IN_MAINTENANCE", "IN_REPAIR", "LOCKED", "RETIRED", "SCRAPPED"].map((s) => [s, data.status_counts[s] || 0]).filter(([, n]) => n) : [];
  const buckets = data ? Object.entries(data.life_buckets) : [];
  const exportCsv = () => downloadCsv("mold-overview.csv", ["Mold", "Name", "Type", "Cavity", "Status", "Machine / Location", "Product", "Life used %", "Current shot", "Design shot", "PM due", "Health"],
    items.map((m) => [m.mold_code, m.mold_name, m.mold_type, m.cavity_count, m.status, locationText(m), m.product_name, m.life_used_pct, m.current_shot, m.design_shot, m.pm_due_date, m.health]));
  const quick = [
    [tx("Mold List"), ListAltOutlinedIcon, "#1570EF", () => navigate("/mold-management/list"), false],
    [tx("Mold Detail"), ViewInArOutlinedIcon, "#12B76A", () => navigate(selectedId ? detailUrl(selectedId) : "/mold-management/detail"), false],
    [tx("Mold Status"), FactCheckOutlinedIcon, "#F79009", () => navigate("/mold-management/status"), false],
    [tx("Shot Counter"), SpeedOutlinedIcon, "#7A5AF8", () => navigate(`/mold-management/shot-counter${selectedId ? `?mold=${selectedId}` : ""}`), false],
    [tx("Installation History"), HistoryOutlinedIcon, "#2E90FA", () => navigate(`/mold-management/installation-history${selectedId ? `?mold=${selectedId}` : ""}`), false],
    [tx("Mold Location"), LocationOnOutlinedIcon, "#F04438", () => navigate(`/mold-management/location${selectedId ? `?mold=${selectedId}` : ""}`), false],
    [tx("Create PM Schedule"), CalendarMonthOutlinedIcon, "#0E9384", () => navigate(`/maintenance-management/planning?create=1&asset_type=MOLD${selectedId ? `&asset_id=${selectedId}` : ""}`), false],
  ];

  return (
    <MoldPageFrame page={page} title={tx("Mold Overview")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} system={data?.system} onChanged={() => load({ silent: true })}>
      {data ? (
        <>
          <Box sx={{ mb: 1.5 }}>
            <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(4, minmax(0,1fr))", xl: "repeat(7, minmax(0,1fr))" }}>
              <KpiTile tone="primary" title={tx("Total Molds")} value={num(total)} sub={`${num(k.total_shots)} shots`} icon={InventoryOutlinedIcon} onClick={() => setTab("ALL")} />
              <KpiTile tone="success" title={tx("In Use")} value={num(k.running)} sub={pct(k.running)} icon={PlayCircleOutlineIcon} onClick={() => setTab("IN_PRODUCTION")} />
              <KpiTile tone="info" title={tx("Available")} value={num(k.available)} sub={pct(k.available)} icon={CheckCircleOutlineIcon} onClick={() => setTab("AVAILABLE")} />
              <KpiTile tone="accent" title={tx("In Maintenance")} value={num(k.maintenance)} sub={pct(k.maintenance)} icon={EngineeringOutlinedIcon} onClick={() => setTab("IN_MAINTENANCE")} />
              <KpiTile tone="danger" title={tx("In Repair")} value={num(k.repair)} sub={pct(k.repair)} icon={BuildCircleOutlinedIcon} onClick={() => setTab("IN_REPAIR")} />
              <KpiTile tone="warning" title={tx("Average Life Used")} value={k.avg_life != null ? num(k.avg_life, 1) : EMPTY} unit={k.avg_life != null ? "%" : ""} sub={`${tx("Health")} ${k.avg_health ?? EMPTY}/100`} icon={TimelapseOutlinedIcon} />
              <KpiTile tone="danger" title={tx("PM Due (7 Days)")} value={num(k.pm_due_7d)} sub={k.pm_overdue ? `${k.pm_overdue} ${tx("overdue")}` : tx("Need attention")} icon={CalendarMonthOutlinedIcon} />
            </KpiCardGroup>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0,1fr))", xl: "minmax(0,1fr) minmax(0,1.7fr) minmax(0,1.1fr) minmax(0,1fr)" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Mold Status Distribution")} />
              <Box sx={{ px: 1, pb: 1.5 }}>
                <Chart type="donut" height={190} series={statusSeries.map(([, n]) => n)} options={{
                  labels: statusSeries.map(([s]) => label("moldStatus", s)), colors: statusSeries.map(([s]) => MOLD_STATUS_COLORS[s]), legend: { show: false }, dataLabels: { enabled: false },
                  stroke: { width: 1, colors: [dark ? "#111827" : "#fff"] }, chart: { background: "transparent" }, tooltip: { theme: dark ? "dark" : "light" },
                  plotOptions: { pie: { donut: { size: "70%", labels: { show: true, name: { color: axisColor }, value: { fontSize: "22px", fontWeight: 800, color: dark ? "#fff" : "#101828" },
                    total: { show: true, label: tx("Total"), color: axisColor, formatter: () => String(total) } } } } } }} />
                <Stack spacing={0.5} sx={{ px: 1 }}>{statusSeries.map(([s, n]) => (
                  <Stack key={s} direction="row" spacing={1} sx={{ alignItems: "center", cursor: "pointer" }} onClick={() => setTab(TABS.includes(s) ? s : "OUT_OF_SERVICE")}>
                    <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: MOLD_STATUS_COLORS[s] }} /><Typography variant="caption" sx={{ flex: 1 }}>{label("moldStatus", s)}</Typography>
                    <Typography variant="caption" fontWeight={800}>{n} ({num((n / (total || 1)) * 100, 1)}%)</Typography></Stack>))}</Stack>
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Mold Digital Twin")} subtitle={sel ? `(${sel.mold_code})` : ""} action={sel ? <MoldStatusPill value={sel.status} /> : null} />
              <Box sx={{ px: 1.5, pb: 1.5 }}><DigitalTwin mold={sel} attributes={detail?.attributes} documents={detail?.documents} onDocuments={() => navigate(`${detailUrl(selectedId)}#documents`)} /></Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Mold Life Summary")} subtitle={sel ? `(${sel.mold_code})` : ""} />
              <Box sx={{ px: 1.5, pb: 1.5 }}>
                {sel ? (
                  <>
                    <LifeGauge value={sel.life_used_pct} dark={dark} height={180} />
                    <InfoGrid rows={[[tx("Current Shot"), num(sel.current_shot)], [tx("Target Shot"), num(sel.design_shot)], [tx("Remaining Shot"), num(sel.remaining_shot)],
                      [tx("Remaining Life"), sel.life_used_pct != null ? `${num(Math.max(100 - sel.life_used_pct, 0), 1)}%` : EMPTY], [tx("Daily Avg. Shot"), num(sel.daily_avg_shot)],
                      [tx("Expected End of Life"), dateText(sel.eol_date)]]} cols="minmax(96px,1fr) auto" />
                  </>
                ) : <Typography variant="caption" color="text.secondary">{tx("Select a mold in the list.")}</Typography>}
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("PM Due Soon")} />
              <Box sx={{ px: 1.5, pb: 1.5 }}><PmDueList items={data.pm_due} onOpen={(p) => navigate(detailUrl(p.id))} /></Box>
            </Paper>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,2.4fr) minmax(0,1fr) minmax(0,1fr)" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Mold List")} subtitle={`(${items.length})`} action={
                <TextField size="small" placeholder={tx("Search mold, product, machine...")} value={q} onChange={(e) => setQ(e.target.value)} sx={{ width: 240 }}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />} />
              <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ minHeight: 34, px: 1, "& .MuiTab-root": { minHeight: 34, textTransform: "none", fontWeight: 700, fontSize: 12 } }}>
                {TABS.map((s) => <Tab key={s} value={s} label={`${s === "ALL" ? tx("All") : label("moldStatus", s)} (${count(s)})`} />)}
              </Tabs>
              <Box sx={{ px: 1, pb: 1, height: 330, overflow: "auto" }}>
                <Table size="small" stickyHeader sx={tableSx}>
                  <TableHead><TableRow>
                    <TableCell>{tx("Mold No.")}</TableCell><TableCell>{tx("Mold Name")}</TableCell><TableCell>{tx("Type")}</TableCell><TableCell align="center">{tx("Cavity")}</TableCell>
                    <TableCell align="center">{tx("Status")}</TableCell><TableCell>{tx("Machine / Location")}</TableCell><TableCell>{tx("Product")}</TableCell>
                    <TableCell align="center">{tx("Life Used")}</TableCell><TableCell align="right">{tx("Current Shot")}</TableCell><TableCell align="right">{tx("Target Shot")}</TableCell>
                    <TableCell>{tx("PM Due Date")}</TableCell><TableCell />
                  </TableRow></TableHead>
                  <TableBody>{items.map((m) => (
                    <TableRow key={m.id} hover selected={m.id === selectedId} onClick={() => setSelectedId(m.id)} onDoubleClick={() => navigate(detailUrl(m.id))} sx={{ cursor: "pointer" }}>
                      <TableCell sx={{ fontWeight: 800, color: "#1570EF" }}>{m.mold_code}</TableCell><TableCell sx={{ maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis" }}>{m.mold_name}</TableCell>
                      <TableCell>{m.mold_type || EMPTY}</TableCell><TableCell align="center">{m.cavity_count}</TableCell><TableCell align="center"><MoldStatusPill value={m.status} /></TableCell>
                      <TableCell>{locationText(m) || EMPTY}</TableCell><TableCell sx={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>{m.product_name || EMPTY}</TableCell>
                      <TableCell align="center"><LifeBar value={m.life_used_pct} /></TableCell><TableCell align="right">{num(m.current_shot)}</TableCell><TableCell align="right">{num(m.design_shot)}</TableCell>
                      <TableCell sx={{ color: m.pm_overdue ? "#F04438" : undefined, fontWeight: m.pm_overdue ? 800 : 400 }}>{dateText(m.pm_due_date)}</TableCell>
                      <TableCell padding="none"><MoldRowMenu mold={m} canEdit={canEdit} navigate={navigate} onAction={page.openAction} /></TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </Box>
            </Paper>
            <Stack spacing={1.5}>
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Mold Status")} />
                <Box sx={{ px: 1.5, pb: 1.5 }}>
                  {statusSeries.map(([s, n]) => (
                    <Box key={s} sx={{ display: "grid", gridTemplateColumns: "96px 1fr 54px", gap: 1, alignItems: "center", mb: 0.6 }}>
                      <Typography variant="caption" noWrap>{label("moldStatus", s)}</Typography>
                      <LinearProgress variant="determinate" value={(n / (total || 1)) * 100} sx={{ height: 8, borderRadius: 4, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: MOLD_STATUS_COLORS[s] } }} />
                      <Typography variant="caption" fontWeight={700} align="right">{n} ({num((n / (total || 1)) * 100, 0)}%)</Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
              <Paper elevation={0} sx={{ ...cardSx, flex: 1 }}>
                <Head title={tx("Mold Life Distribution")} />
                <Box sx={{ display: "grid", gridTemplateColumns: "140px 1fr", alignItems: "center", px: 1, pb: 1 }}>
                  <Chart type="donut" height={150} series={buckets.map(([, n]) => n)} options={{
                    labels: buckets.map(([b]) => `${b}%`), colors: LIFE_BUCKET_COLORS, legend: { show: false }, dataLabels: { enabled: false }, chart: { background: "transparent" },
                    stroke: { width: 1, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light" }, plotOptions: { pie: { donut: { size: "62%" } } } }} />
                  <Stack spacing={0.5}>{buckets.map(([b, n], i) => (
                    <Stack key={b} direction="row" spacing={1} sx={{ alignItems: "center" }}><Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: LIFE_BUCKET_COLORS[i] }} />
                      <Typography variant="caption" sx={{ flex: 1 }}>{b}%</Typography><Typography variant="caption" fontWeight={800}>{n}</Typography></Stack>))}</Stack>
                </Box>
              </Paper>
            </Stack>
            <Stack spacing={1.5}>
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Top Molds by Shot Count (Today)")} />
                <Box sx={{ px: 1.5, pb: 1.5 }}>
                  {!data.top_shots.length ? <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography> : data.top_shots.map((m, i) => (
                    <Stack key={m.id} direction="row" spacing={1} sx={{ py: 0.5, cursor: "pointer" }} onClick={() => navigate(detailUrl(m.id))}>
                      <Typography variant="caption" color="text.secondary" sx={{ width: 14 }}>{i + 1}</Typography>
                      <Typography variant="caption" fontWeight={800} sx={{ color: "#1570EF", flex: 1 }}>{m.mold_code}</Typography>
                      <Typography variant="caption" fontWeight={700}>{num(m.shots_today)}</Typography></Stack>))}
                </Box>
              </Paper>
              <Paper elevation={0} sx={{ ...cardSx, flex: 1 }}>
                <Head title={tx("Top Idle Molds")} />
                <Box sx={{ px: 1.5, pb: 1.5 }}>
                  {!data.top_idle.length ? <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography> : data.top_idle.map((m, i) => (
                    <Stack key={m.id} direction="row" spacing={1} sx={{ py: 0.5, cursor: "pointer" }} onClick={() => navigate(detailUrl(m.id))}>
                      <Typography variant="caption" color="text.secondary" sx={{ width: 14 }}>{i + 1}</Typography>
                      <Typography variant="caption" fontWeight={800} sx={{ color: "#1570EF", flex: 1 }}>{m.mold_code}</Typography>
                      <Typography variant="caption" fontWeight={700}>{m.idle_days} {tx("days")}</Typography></Stack>))}
                </Box>
              </Paper>
            </Stack>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1fr) minmax(0,1fr) minmax(0,1.1fr)" }, gap: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Mold Utilization Trend (%)")} />
              <Box sx={{ px: 1, pb: 0.5 }}>
                <Chart type="line" height={210} series={[{ name: tx("Mold Utilization Trend (%)"), data: data.utilization.map((u) => u.pct) }]} options={{
                  chart: { background: "transparent", toolbar: { show: false } }, colors: ["#1570EF"], stroke: { width: 2.5, curve: "smooth" }, markers: { size: 4 },
                  dataLabels: { enabled: true, formatter: (v) => `${num(v, 1)}%`, offsetY: -6, style: { fontSize: "10px" }, background: { enabled: false } },
                  xaxis: { categories: data.utilization.map((u) => dateText(u.date).slice(0, 5)), labels: { style: { colors: axisColor, fontSize: "10px" } } },
                  yaxis: { min: 0, max: 100, labels: { style: { colors: axisColor }, formatter: (v) => num(v, 0) } }, grid, tooltip: { theme: dark ? "dark" : "light" } }} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Mold Shot Count Trend")} subtitle={`(${tx("Total Shots")})`} />
              <Box sx={{ px: 1, pb: 0.5 }}>
                <Chart type="line" height={210} series={[{ name: tx("Total Shots"), data: data.shot_trend.map((s) => s.total) }, { name: tx("Daily Shots"), type: "column", data: data.shot_trend.map((s) => s.shots) }]} options={{
                  chart: { background: "transparent", toolbar: { show: false } }, colors: ["#12B76A", "#2E90FA"], stroke: { width: [2.5, 0] }, markers: { size: 3 },
                  xaxis: { categories: data.shot_trend.map((s) => dateText(s.date).slice(0, 5)), labels: { style: { colors: axisColor, fontSize: "10px" } } },
                  yaxis: [{ labels: { style: { colors: axisColor }, formatter: (v) => `${num(v / 1e6, 2)}M` } }, { opposite: true, labels: { style: { colors: axisColor }, formatter: (v) => num(v, 0) } }],
                  legend: { position: "top", labels: { colors: axisColor } }, grid, tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v) => num(v) } } }} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Quick Actions")} subtitle={sel ? `(${sel.mold_code})` : ""} />
              <Box sx={{ px: 1.5, pb: 1.5 }}><QuickActionGrid actions={quick} /></Box>
            </Paper>
          </Box>
        </>
      ) : null}
    </MoldPageFrame>
  );
}
