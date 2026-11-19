import "./locales";
import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { Box, InputAdornment, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import TimelapseOutlinedIcon from "@mui/icons-material/TimelapseOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";

import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, colShares, downloadExcel } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { EmptyBody, QuickCard, cellsSx, chartBase, fillSx, fitGridSx, panelSx } from "../../shared/onePage";
import { label, tx } from "../moldLocales";
import { MoldPageFrame, useMoldData, useMoldPage } from "../moldPage";
import { DigitalTwin, PmDueList } from "../moldParts";
import {
  InfoGrid, LIFE_BUCKET_COLORS, LifeBar, LifeGauge, MOLD_API, MOLD_STATUS_COLORS, MoldRowMenu, MoldStatusPill, dateText, locationText,
} from "../moldUi";

const TABS = ["ALL", "IN_PRODUCTION", "AVAILABLE", "IN_MAINTENANCE", "IN_REPAIR", "OUT_OF_SERVICE"];

export default function MoldOverview() {
  const page = useMoldPage();
  const { navigate, dark, axisColor, tableSx, canEdit, request } = page;
  const { data, loading, lastUpdate, live, setLive, load } = useMoldData(page, `${MOLD_API}/summary`);
  const [tab, setTab] = useState("ALL");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [rankView, setRankView] = useState("shots");
  const [trendView, setTrendView] = useState("util");

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
  const exportCsv = () => downloadExcel("mold-overview.csv", ["Mold", "Name", "Type", "Cavity", "Status", "Machine / Location", "Product", "Life used %", "Current shot", "Design shot", "PM due", "Health"],
    items.map((m) => [m.mold_code, m.mold_name, m.mold_type, m.cavity_count, m.status, locationText(m), m.product_name, m.life_used_pct, m.current_shot, m.design_shot, m.pm_due_date, m.health]));
  const quick = [
    [tx("Mold Detail"), ViewInArOutlinedIcon, "#12B76A", () => navigate(selectedId ? detailUrl(selectedId) : "/mold-management/detail"), false],
    [tx("Mold Status"), FactCheckOutlinedIcon, "#F79009", () => navigate("/mold-management/status"), false],
    [tx("Shot Counter"), SpeedOutlinedIcon, "#7A5AF8", () => navigate(`/mold-management/shot-counter${selectedId ? `?mold=${selectedId}` : ""}`), false],
    [tx("Installation History"), HistoryOutlinedIcon, "#2E90FA", () => navigate(`/mold-management/installation-history${selectedId ? `?mold=${selectedId}` : ""}`), false],
    [tx("Mold Location"), LocationOnOutlinedIcon, "#F04438", () => navigate(`/mold-management/location${selectedId ? `?mold=${selectedId}` : ""}`), false],
    [tx("Create PM Schedule"), CalendarMonthOutlinedIcon, "#0E9384", () => navigate(`/maintenance-management/planning?create=1&asset_type=MOLD${selectedId ? `&asset_id=${selectedId}` : ""}`), false],
  ];
  const base = chartBase(dark, axisColor);
  const toggleSx = { px: 1, py: 0.1, textTransform: "none", fontWeight: 700, fontSize: 10.5 };
  const toolbar = (
    <TextField size="small" placeholder={tx("Search mold, product, machine...")} value={q} onChange={(e) => setQ(e.target.value)} sx={{ width: 240 }}
      slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
  );
  const rankRows = (rows, valueOf) => (rows.length ? (
    <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1 }}>
      {rows.map((m, i) => (
        <Stack key={m.id} direction="row" spacing={1} sx={{ py: 0.45, borderBottom: 1, borderColor: "divider", cursor: "pointer" }} onClick={() => navigate(detailUrl(m.id))}>
          <Typography variant="caption" color="text.secondary" sx={{ width: 14 }}>{i + 1}</Typography>
          <Typography variant="caption" fontWeight={800} sx={{ color: "#1570EF", flex: 1 }}>{m.mold_code}</Typography>
          <Typography variant="caption" fontWeight={700}>{valueOf(m)}</Typography></Stack>))}
    </Box>
  ) : <EmptyBody text={tx("No data.")} />);

  return (
    <MoldPageFrame fit page={page} title={tx("Mold Overview")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} toolbar={toolbar} system={data?.system} onChanged={() => load({ silent: true })}>
      {data ? (
        <>
          <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(4, minmax(0,1fr))", xl: "repeat(7, minmax(0,1fr))" }}>
            <KpiTile tone="primary" title={tx("Total Molds")} value={num(total)} sub={`${num(k.total_shots)} shots`} icon={InventoryOutlinedIcon} onClick={() => setTab("ALL")} />
            <KpiTile tone="success" title={tx("In Use")} value={num(k.running)} sub={pct(k.running)} icon={PlayCircleOutlineIcon} onClick={() => setTab("IN_PRODUCTION")} />
            <KpiTile tone="info" title={tx("Available")} value={num(k.available)} sub={pct(k.available)} icon={CheckCircleOutlineIcon} onClick={() => setTab("AVAILABLE")} />
            <KpiTile tone="accent" title={tx("In Maintenance")} value={num(k.maintenance)} sub={pct(k.maintenance)} icon={EngineeringOutlinedIcon} onClick={() => setTab("IN_MAINTENANCE")} />
            <KpiTile tone="danger" title={tx("In Repair")} value={num(k.repair)} sub={pct(k.repair)} icon={BuildCircleOutlinedIcon} onClick={() => setTab("IN_REPAIR")} />
            <KpiTile tone="warning" title={tx("Average Life Used")} value={k.avg_life != null ? num(k.avg_life, 1) : EMPTY} unit={k.avg_life != null ? "%" : ""} sub={`${tx("Health")} ${k.avg_health ?? EMPTY}/100`} icon={TimelapseOutlinedIcon} />
            <KpiTile tone="danger" title={tx("PM Due (7 Days)")} value={num(k.pm_due_7d)} sub={k.pm_overdue ? `${k.pm_overdue} ${tx("overdue")}` : tx("Need attention")} icon={CalendarMonthOutlinedIcon} />
          </KpiCardGroup>

          <Box sx={{ ...fitGridSx, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" }, gridTemplateRows: { lg: "minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr)" } }}>
            <Paper elevation={0} sx={panelSx}>
              <Head title={tx("Mold Status Distribution")} />
              {statusSeries.length ? (
                <Box sx={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "140px 1fr", alignItems: "center", px: 1, pb: 1 }}>
                  <Chart type="donut" height={150} series={statusSeries.map(([, n]) => n)} options={{
                    labels: statusSeries.map(([s]) => label("moldStatus", s)), colors: statusSeries.map(([s]) => MOLD_STATUS_COLORS[s]), legend: { show: false }, dataLabels: { enabled: false },
                    stroke: { width: 1, colors: [dark ? "#111827" : "#fff"] }, chart: { background: "transparent" }, tooltip: { theme: dark ? "dark" : "light" },
                    plotOptions: { pie: { donut: { size: "72%", labels: { show: true, name: { color: axisColor, fontSize: "10px" }, value: { fontSize: "17px", fontWeight: 800, color: dark ? "#fff" : "#101828" },
                      total: { show: true, label: tx("Total"), color: axisColor, formatter: () => String(total) } } } } } }} />
                  <Stack spacing={0.5}>{statusSeries.map(([s, n]) => (
                    <Stack key={s} direction="row" spacing={0.75} sx={{ alignItems: "center", cursor: "pointer" }} onClick={() => setTab(TABS.includes(s) ? s : "OUT_OF_SERVICE")}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: MOLD_STATUS_COLORS[s] }} /><Typography variant="caption" noWrap sx={{ flex: 1 }}>{label("moldStatus", s)}</Typography>
                      <Typography variant="caption" fontWeight={800}>{n}</Typography></Stack>))}</Stack>
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>
            <Paper elevation={0} sx={panelSx}>
              <Head title={sel ? `${tx("Mold Digital Twin")} · ${sel.mold_code}` : tx("Mold Digital Twin")} action={sel ? <MoldStatusPill value={sel.status} /> : null} />
              <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1 }}>
                <DigitalTwin mold={sel} attributes={detail?.attributes} documents={detail?.documents} imageHeight={130} dense onDocuments={() => navigate(`${detailUrl(selectedId)}#documents`)} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={panelSx}>
              <Head title={sel ? `${tx("Mold Life Summary")} · ${sel.mold_code}` : tx("Mold Life Summary")} />
              {sel ? (
                <Box sx={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "minmax(0,0.9fr) minmax(0,1.1fr)", alignItems: "center", gap: 1, px: 1.5, pb: 1 }}>
                  <LifeGauge value={sel.life_used_pct} dark={dark} height={160} />
                  <InfoGrid rows={[[tx("Current Shot"), num(sel.current_shot)], [tx("Target Shot"), num(sel.design_shot)], [tx("Remaining Shot"), num(sel.remaining_shot)],
                    [tx("Remaining Life"), sel.life_used_pct != null ? `${num(Math.max(100 - sel.life_used_pct, 0), 1)}%` : EMPTY], [tx("Daily Avg. Shot"), num(sel.daily_avg_shot)],
                    [tx("Expected End of Life"), dateText(sel.eol_date)]]} />
                </Box>
              ) : <EmptyBody text={tx("Select a mold in the list.")} />}
            </Paper>
            <Paper elevation={0} sx={panelSx}>
              <Head title={tx("PM Due Soon")} action={<Typography variant="caption" color="text.secondary">{data.pm_due.length}</Typography>} />
              {data.pm_due.length ? <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1 }}><PmDueList items={data.pm_due} max={50} onOpen={(p) => navigate(detailUrl(p.id))} /></Box> : <EmptyBody text={tx("No data.")} />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 3" }, gridRow: { lg: "2 / 4" }, minHeight: { xs: 320, lg: 0 } }}>
              <Head title={`${tx("Mold List")}${tab !== "ALL" ? ` · ${label("moldStatus", tab)}` : ""}`} action={(
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  {tab !== "ALL" ? <Typography variant="caption" sx={{ color: "#1570EF", cursor: "pointer", fontWeight: 700 }} onClick={() => setTab("ALL")}>{tx("All")} ({count("ALL")})</Typography> : null}
                  <Typography variant="caption" color="text.secondary">{items.length} {tx("molds")}</Typography>
                </Stack>
              )} />
              {items.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(15, 16, 12, 15, 13, 13, 12, 4) }}>
                    <TableHead><TableRow>
                      <TableCell>{tx("Mold No.")}</TableCell><TableCell>{tx("Mold Name")}</TableCell><TableCell>{tx("Product")}</TableCell><TableCell align="center">{tx("Status")}</TableCell>
                      <TableCell>{tx("Machine / Location")}</TableCell><TableCell align="center">{tx("Life Used")}</TableCell><TableCell>{tx("PM Due Date")}</TableCell><TableCell />
                    </TableRow></TableHead>
                    <TableBody>{items.map((m) => (
                      <TableRow key={m.id} hover selected={m.id === selectedId} onClick={() => setSelectedId(m.id)} onDoubleClick={() => navigate(detailUrl(m.id))} sx={{ cursor: "pointer" }}>
                        <TableCell sx={{ fontWeight: 800, color: "#1570EF" }}>{m.mold_code}</TableCell><TableCell title={m.mold_name}>{m.mold_name}</TableCell>
                        <TableCell title={m.product_name || ""}>{m.product_name || EMPTY}</TableCell><TableCell align="center"><MoldStatusPill value={m.status} /></TableCell>
                        <TableCell title={locationText(m) || ""}>{locationText(m) || EMPTY}</TableCell>
                        <TableCell align="center"><LifeBar value={m.life_used_pct} width={80} /></TableCell>
                        <TableCell sx={{ color: m.pm_overdue ? "#F04438" : undefined, fontWeight: m.pm_overdue ? 800 : 400 }}>{dateText(m.pm_due_date)}</TableCell>
                        <TableCell padding="none" align="center" sx={{ textOverflow: "clip !important" }}><MoldRowMenu mold={m} canEdit={canEdit} navigate={navigate} onAction={page.openAction} /></TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>

            <Paper elevation={0} sx={panelSx}>
              <Head title={tx("Mold Life Distribution")} />
              {buckets.some(([, n]) => n) ? (
                <Box sx={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "140px 1fr", alignItems: "center", px: 1, pb: 1 }}>
                  <Chart type="donut" height={150} series={buckets.map(([, n]) => n)} options={{
                    labels: buckets.map(([b]) => `${b}%`), colors: LIFE_BUCKET_COLORS, legend: { show: false }, dataLabels: { enabled: false }, chart: { background: "transparent" },
                    stroke: { width: 1, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light" }, plotOptions: { pie: { donut: { size: "64%" } } } }} />
                  <Stack spacing={0.5}>{buckets.map(([b, n], i) => (
                    <Stack key={b} direction="row" spacing={0.75} sx={{ alignItems: "center" }}><Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: LIFE_BUCKET_COLORS[i] }} />
                      <Typography variant="caption" sx={{ flex: 1 }}>{b}%</Typography><Typography variant="caption" fontWeight={800}>{n}</Typography></Stack>))}</Stack>
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>
            <Paper elevation={0} sx={panelSx}>
              <Head title={rankView === "idle" ? tx("Top Idle Molds") : tx("Top Molds by Shot Count (Today)")} action={(
                <ToggleButtonGroup exclusive size="small" value={rankView} onChange={(e, v) => v && setRankView(v)}>
                  <ToggleButton value="shots" sx={toggleSx}>{tx("Shots")}</ToggleButton>
                  <ToggleButton value="idle" sx={toggleSx}>{tx("Idle")}</ToggleButton>
                </ToggleButtonGroup>
              )} />
              {rankView === "idle" ? rankRows(data.top_idle, (m) => `${m.idle_days} ${tx("days")}`) : rankRows(data.top_shots, (m) => num(m.shots_today))}
            </Paper>

            <Paper elevation={0} sx={panelSx}>
              <Head title={trendView === "shots" ? tx("Mold Shot Count Trend") : tx("Mold Utilization Trend (%)")} action={(
                <ToggleButtonGroup exclusive size="small" value={trendView} onChange={(e, v) => v && setTrendView(v)}>
                  <ToggleButton value="util" sx={toggleSx}>%</ToggleButton>
                  <ToggleButton value="shots" sx={toggleSx}>{tx("Shots")}</ToggleButton>
                </ToggleButtonGroup>
              )} />
              <Box sx={{ flex: 1, minHeight: 0, px: 1 }}>
                {trendView === "util" ? (
                  <Chart key="util" type="line" height="100%" series={[{ name: tx("Mold Utilization Trend (%)"), data: data.utilization.map((u) => u.pct) }]} options={{
                    ...base, colors: ["#1570EF"], stroke: { width: 2, curve: "smooth" }, markers: { size: 3 },
                    dataLabels: { enabled: true, formatter: (v) => (v ? `${num(v, 0)}%` : ""), offsetY: -6, style: { fontSize: "10px" }, background: { enabled: false } },
                    xaxis: { ...base.xaxis, categories: data.utilization.map((u) => dateText(u.date).slice(0, 5)) },
                    yaxis: { min: 0, max: 100, tickAmount: 4, labels: { ...base.yaxis.labels, formatter: (v) => num(v, 0) } } }} />
                ) : (
                  <Chart key="shots" type="line" height="100%" series={[{ name: tx("Total Shots"), data: data.shot_trend.map((s) => s.total) }, { name: tx("Daily Shots"), type: "column", data: data.shot_trend.map((s) => s.shots) }]} options={{
                    ...base, colors: ["#12B76A", "#2E90FA"], stroke: { width: [2, 0] }, markers: { size: 3 },
                    xaxis: { ...base.xaxis, categories: data.shot_trend.map((s) => dateText(s.date).slice(0, 5)) },
                    yaxis: [{ tickAmount: 4, labels: { ...base.yaxis.labels, formatter: (v) => `${num(v / 1e6, 2)}M` } }, { opposite: true, tickAmount: 4, labels: { ...base.yaxis.labels, formatter: (v) => num(v, 0) } }],
                    tooltip: { ...base.tooltip, y: { formatter: (v) => num(v) } } }} />
                )}
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
