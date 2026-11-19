import "./locales";
import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { Box, Button, FormControl, InputAdornment, InputLabel, LinearProgress, MenuItem, Paper, Select, Slider, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import TimelapseOutlinedIcon from "@mui/icons-material/TimelapseOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, colShares, downloadExcel } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { EmptyBody, FilterToggle, QuickCard, cellsSx, chartBase, fillSx, fitGridSx, panelSx } from "../../shared/onePage";
import { label, tx, txs } from "../moldLocales";
import { MoldPageFrame, useMoldData, useMoldPage } from "../moldPage";
import { HealthBadge, InfoGrid, LIFE_BUCKET_COLORS, LifeBar, LifeGauge, MOLD_API, MOLD_STATUSES, MoldRowMenu, MoldStatusPill, dateText, lifeColor, locationText } from "../moldUi";

const EMPTY_FILTER = { status: "", type: "", product: "", life: [0, 100], q: "" };

export default function MoldShotCounter() {
  const page = useMoldPage();
  const { navigate, params, setParams, dark, axisColor, tableSx, canEdit, lookups, request } = page;
  const { data, loading, lastUpdate, live, setLive, load } = useMoldData(page, `${MOLD_API}/summary?trend_days=30`);
  const [f, setF] = useState(EMPTY_FILTER);
  const [detail, setDetail] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [sideView, setSideView] = useState("top");
  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const all = data?.items || [];
  const selectedId = Number(params.get("mold")) || (all.find((m) => m.status === "IN_PRODUCTION") || all[0])?.id || null;
  useEffect(() => { if (selectedId) request(`${MOLD_API}/molds/${selectedId}`).then(setDetail).catch(() => setDetail(null)); }, [selectedId, request, lastUpdate]);

  const items = useMemo(() => all.filter((m) => (!f.status || m.status === f.status) && (!f.type || m.mold_type === f.type) && (!f.product || m.product_name === f.product)
    && (m.life_used_pct ?? 0) >= f.life[0] && (f.life[1] >= 100 || (m.life_used_pct ?? 0) <= f.life[1])
    && (!f.q || `${m.mold_code} ${m.mold_name} ${m.machine_code || ""} ${m.product_name || ""}`.toLowerCase().includes(f.q.toLowerCase()))), [all, f]);
  const k = data?.kpis || {};
  const total = k.total || 0;
  const sel = detail?.mold?.id === selectedId ? detail.mold : all.find((m) => m.id === selectedId);
  const buckets = data ? Object.entries(data.life_buckets) : [];
  const products = [...new Set(all.map((m) => m.product_name).filter(Boolean))];
  const hist = detail?.mold?.id === selectedId ? detail.shot_history : [];
  const withSel = (path) => `${path}?mold=${selectedId}`;
  const exportCsv = () => downloadExcel("mold-shot-counter.csv", ["Mold", "Name", "Machine", "Product", "Status", "Current shot", "Design shot", "Life used %", "Remaining shot", "Daily avg shot", "Est. end of life", "Health"],
    items.map((m) => [m.mold_code, m.mold_name, m.machine_code, m.product_name, label("moldStatus", m.status), m.current_shot, m.design_shot, m.life_used_pct, m.remaining_shot, m.daily_avg_shot, m.eol_date, m.health]));
  const quick = [
    [tx("View Detail"), VisibilityOutlinedIcon, "#1570EF", () => navigate(`/mold-management/detail?mold=${selectedId}`), !selectedId],
    [tx("Mold Status"), FactCheckOutlinedIcon, "#F79009", () => navigate("/mold-management/status"), false],
    [tx("Installation History"), HistoryOutlinedIcon, "#2E90FA", () => navigate(withSel("/mold-management/installation-history")), !selectedId],
    [tx("Mold Location"), LocationOnOutlinedIcon, "#12B76A", () => navigate(withSel("/mold-management/location")), !selectedId],
    [txs("Adjust shots (short)", "Adjust Shot Counter"), SpeedOutlinedIcon, "#7A5AF8", () => page.openAction("shots", sel), !canEdit || !sel],
    [tx("Create PM Schedule"), CalendarMonthOutlinedIcon, "#F04438", () => navigate(`/maintenance-management/planning?create=1&asset_type=MOLD${selectedId ? `&asset_id=${selectedId}` : ""}`), false],
  ];
  const sel2 = (key, text, options, width = 150) => (
    <FormControl size="small" sx={{ minWidth: width }}><InputLabel shrink>{text}</InputLabel>
      <Select displayEmpty notched label={text} value={f[key]} onChange={set(key)}><MenuItem value="">{tx("All")}</MenuItem>{options}</Select></FormControl>
  );
  const base = chartBase(dark, axisColor);
  const toggleSx = { px: 1, py: 0.1, textTransform: "none", fontWeight: 700, fontSize: 10.5 };
  const activeFilters = ["status", "type", "product", "q"].filter((key) => f[key]).length + (f.life[0] > 0 || f.life[1] < 100 ? 1 : 0);
  const scroll = { flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1 };

  return (
    <MoldPageFrame fit page={page} title={tx("Mold Shot Counter")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} system={data?.system} onChanged={() => load({ silent: true })}
      toolbar={<FilterToggle open={showFilter} count={activeFilters} onClick={() => setShowFilter((v) => !v)} label={tx("Filter")} />}
      filters={showFilter ? <>
        <TextField size="small" placeholder={tx("Search mold, product, machine...")} value={f.q} onChange={set("q")} sx={{ width: 230 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
        {sel2("status", tx("Status"), MOLD_STATUSES.map((s) => <MenuItem key={s} value={s}>{label("moldStatus", s)}</MenuItem>))}
        {sel2("type", tx("Mold Type"), (lookups?.mold_types || []).map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>))}
        {sel2("product", tx("Product"), products.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>), 170)}
        <Box sx={{ width: 200, px: 1 }}>
          <Typography variant="caption" color="text.secondary">{tx("Life Used (%) range")}: {f.life[0]}–{f.life[1]}%</Typography>
          <Slider size="small" value={f.life} min={0} max={100} step={5} onChange={(_, v) => setF((o) => ({ ...o, life: v }))} sx={{ py: 0.5 }} />
        </Box>
        <Button startIcon={<FilterAltOffOutlinedIcon />} onClick={() => setF(EMPTY_FILTER)} sx={{ textTransform: "none" }}>{tx("Clear")}</Button>
      </> : null}>
      {data ? (
        <>
          <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))", xl: "repeat(6, minmax(0,1fr))" }}>
            <KpiTile tone="primary" title={tx("Total Molds")} value={num(total)} sub="100%" icon={InventoryOutlinedIcon} onClick={() => setF(EMPTY_FILTER)} />
            <KpiTile tone="success" title={tx("Running Molds")} value={num(k.running)} sub={total ? `${num((k.running / total) * 100, 1)}% ${tx("of total")}` : ""} icon={PlayCircleOutlineIcon} onClick={() => setF((o) => ({ ...o, status: "IN_PRODUCTION" }))} />
            <KpiTile tone="warning" title={tx("Total Shots")} value={num(k.total_shots)} sub={`${tx("Shots today")}: ${num(k.shots_today)}`} icon={SpeedOutlinedIcon} />
            <KpiTile tone="accent" title={tx("Avg Life Used")} value={k.avg_life != null ? num(k.avg_life, 1) : EMPTY} unit={k.avg_life != null ? "%" : ""} sub="" icon={TimelapseOutlinedIcon} />
            <KpiTile tone="danger" title={tx("Molds > 90% Life")} value={num(k.life_90)} sub={total ? `${num((k.life_90 / total) * 100, 1)}% ${tx("of total")}` : ""} icon={ReportProblemOutlinedIcon} onClick={() => setF((o) => ({ ...o, life: [90, 100] }))} />
            <KpiTile tone="info" title={tx("Est. End of Life (30 Days)")} value={num(k.eol_30d)} sub={tx("Need attention")} icon={EventBusyOutlinedIcon} onClick={() => setSideView("eol")} />
          </KpiCardGroup>

          <Box sx={{ ...fitGridSx, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" }, gridTemplateRows: { lg: "repeat(3, minmax(0,1fr))" } }}>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 4" }, gridRow: { lg: "1 / 3" }, minHeight: { xs: 360, lg: 0 } }}>
              <Head title={tx("Shot Counter List")} action={<Typography variant="caption" color="text.secondary">{items.length} / {all.length} {tx("molds")}</Typography>} />
              {items.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(9, 11, 8, 8.5, 10, 8, 7, 8, 8, 6.5, 7.5, 5.5, 3) }}>
                    <TableHead><TableRow>
                      {["Mold No.", "Mold Name", "Machine", "Product", "Status", "Current Shot", "Design Shot", "Life Used (%)", "Remaining Shot", "Daily Avg. Shot", "Est. End of Life", "Health Score", ""].map((h, i) => (
                        <TableCell key={h || i} title={h ? tx(h) : ""} align={["Current Shot", "Design Shot", "Remaining Shot", "Daily Avg. Shot"].includes(h) ? "right" : ["Status", "Life Used (%)", "Health Score"].includes(h) ? "center" : "left"}>{h ? tx(h) : ""}</TableCell>))}
                    </TableRow></TableHead>
                    <TableBody>{items.map((m) => (
                      <TableRow key={m.id} hover selected={m.id === selectedId} onClick={() => setParams({ mold: String(m.id) })} onDoubleClick={() => navigate(`/mold-management/detail?mold=${m.id}`)} sx={{ cursor: "pointer" }}>
                        <TableCell sx={{ fontWeight: 800, color: "#1570EF" }}>{m.mold_code}</TableCell><TableCell title={m.mold_name}>{m.mold_name}</TableCell>
                        <TableCell>{m.machine_code || locationText(m)}</TableCell><TableCell title={m.product_name || ""}>{m.product_name || EMPTY}</TableCell>
                        <TableCell align="center"><MoldStatusPill value={m.status} /></TableCell><TableCell align="right">{num(m.current_shot)}</TableCell><TableCell align="right">{num(m.design_shot)}</TableCell>
                        <TableCell align="center"><LifeBar value={m.life_used_pct} width={80} /></TableCell><TableCell align="right">{num(m.remaining_shot)}</TableCell><TableCell align="right">{num(m.daily_avg_shot)}</TableCell>
                        <TableCell sx={{ color: m.eol_days != null && m.eol_days <= 30 ? "#F04438" : undefined, fontWeight: m.eol_days != null && m.eol_days <= 30 ? 800 : 400 }}>{dateText(m.eol_date)}</TableCell>
                        <TableCell align="center"><HealthBadge value={m.health} /></TableCell>
                        <TableCell padding="none" align="center" sx={{ textOverflow: "clip !important" }}><MoldRowMenu mold={m} canEdit={canEdit} navigate={navigate} onAction={page.openAction} /></TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "4" }, gridRow: { lg: "1" } }}>
              <Head title={tx("Life Used Distribution")} />
              <Box sx={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "130px 1fr", alignItems: "center", px: 1, pb: 1 }}>
                <Chart type="donut" height={140} series={buckets.map(([, n]) => n)} options={{
                  labels: buckets.map(([b]) => `${b}%`), colors: LIFE_BUCKET_COLORS, legend: { show: false }, dataLabels: { enabled: false }, chart: { background: "transparent" },
                  stroke: { width: 1, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light" },
                  plotOptions: { pie: { donut: { size: "66%", labels: { show: true, name: { color: axisColor, fontSize: "10px" }, value: { fontSize: "16px", fontWeight: 800, color: dark ? "#fff" : "#101828" },
                    total: { show: true, label: tx("Total"), color: axisColor, formatter: () => String(total) } } } } } }} />
                <Stack spacing={0.4}>{buckets.map(([b, n], i) => (
                  <Stack key={b} direction="row" spacing={0.75} sx={{ alignItems: "center", cursor: "pointer" }} onClick={() => setF((o) => ({ ...o, life: b.split("-").map(Number) }))}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: LIFE_BUCKET_COLORS[i] }} /><Typography variant="caption" sx={{ flex: 1 }}>{b}%</Typography>
                    <Typography variant="caption" fontWeight={800}>{n}</Typography></Stack>))}</Stack>
              </Box>
            </Paper>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "4" }, gridRow: { lg: "2" } }}>
              <Head title={sideView === "eol" ? tx("Est. End of Life (Next 30 Days)") : tx("Top Molds by Life Used")} action={(
                <ToggleButtonGroup exclusive size="small" value={sideView} onChange={(e, v) => v && setSideView(v)}>
                  <ToggleButton value="top" sx={toggleSx}>Top</ToggleButton>
                  <ToggleButton value="eol" sx={toggleSx}>{tx("Est. End of Life")}</ToggleButton>
                </ToggleButtonGroup>
              )} />
              {sideView === "eol" ? (data.eol.length ? (
                <Box sx={scroll}>{data.eol.map((m) => (
                  <Stack key={m.id} direction="row" spacing={1} sx={{ py: 0.45, borderBottom: 1, borderColor: "divider", cursor: "pointer" }} onClick={() => setParams({ mold: String(m.id) })}>
                    <Typography variant="caption" fontWeight={800} sx={{ color: "#1570EF", flex: 1 }}>{m.mold_code}</Typography>
                    <Typography variant="caption" sx={{ color: "#F04438", fontWeight: 700 }}>{dateText(m.eol_date)}</Typography>
                    <Typography variant="caption" fontWeight={700} sx={{ width: 70, textAlign: "right" }}>{num(m.remaining_shot)}</Typography></Stack>))}</Box>
              ) : <EmptyBody text={tx("No data.")} />) : (data.top_life.length ? (
                <Box sx={scroll}>{data.top_life.map((m, i) => (
                  <Box key={m.id} sx={{ display: "grid", gridTemplateColumns: "14px 96px 1fr 44px", gap: 1, alignItems: "center", mb: 0.6, cursor: "pointer" }} onClick={() => setParams({ mold: String(m.id) })}>
                    <Typography variant="caption" color="text.secondary">{i + 1}</Typography>
                    <Typography variant="caption" fontWeight={800} noWrap sx={{ color: "#1570EF" }}>{m.mold_code}</Typography>
                    <LinearProgress variant="determinate" value={Math.min(m.life_used_pct, 100)} sx={{ height: 7, borderRadius: 4, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: lifeColor(m.life_used_pct) } }} />
                    <Typography variant="caption" fontWeight={800} align="right">{num(m.life_used_pct, 1)}%</Typography>
                  </Box>))}</Box>
              ) : <EmptyBody text={tx("No data.")} />)}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "1" }, gridRow: { lg: "3" } }}>
              <Head title={sel ? `${tx("Shot Progress")} · ${sel.mold_code}` : tx("Shot Progress")} />
              {sel ? (
                <Box sx={{ ...scroll, display: "grid", gridTemplateColumns: "120px minmax(0,1fr)", gap: 1, alignItems: "center" }}>
                  <LifeGauge value={sel.life_used_pct} dark={dark} height={140} />
                  <InfoGrid nowrap rows={[[tx("Current Shot"), num(sel.current_shot)], [tx("Design Shot"), num(sel.design_shot)], [tx("Remaining Shot"), num(sel.remaining_shot)],
                    [tx("Daily Avg. Shot"), num(sel.daily_avg_shot)], [tx("Est. End of Life"), dateText(sel.eol_date)], [tx("Remaining Days"), sel.eol_days != null ? `${num(sel.eol_days)} ${tx("days")}` : EMPTY, "#12B76A"],
                    [tx("Cavity"), sel.cavity_count]]} />
                </Box>
              ) : <EmptyBody text={tx("Select a mold in the list.")} />}
            </Paper>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "2" }, gridRow: { lg: "3" } }}>
              <Head title={`${tx("Shot Counter History (30 days)")}${sel ? ` · ${sel.mold_code}` : ""}`} />
              <Box sx={{ flex: 1, minHeight: 0, px: 1 }}>
                <Chart type="bar" height="100%" series={[{ name: tx("Daily Shots"), data: hist.map((h) => h.shots) }]} options={{
                  ...base, colors: ["#12B76A"], plotOptions: { bar: { columnWidth: "60%", borderRadius: 2 } },
                  xaxis: { ...base.xaxis, categories: hist.map((h) => dateText(h.date).slice(0, 5)), tickAmount: 6 },
                  yaxis: { tickAmount: 3, labels: { ...base.yaxis.labels, formatter: (v) => num(v, 0) } } }} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "3" }, gridRow: { lg: "3" } }}>
              <Head title={tx("Shot Counter Trend (Total Shots)")} />
              <Box sx={{ flex: 1, minHeight: 0, px: 1 }}>
                <Chart type="area" height="100%" series={[{ name: tx("Total Shots"), data: data.shot_trend.map((s) => s.total) }]} options={{
                  ...base, colors: ["#12B76A"], stroke: { width: 2 }, fill: { type: "gradient", gradient: { opacityFrom: 0.35, opacityTo: 0.05 } },
                  xaxis: { ...base.xaxis, categories: data.shot_trend.map((s) => dateText(s.date).slice(0, 5)), tickAmount: 5 },
                  yaxis: { tickAmount: 3, labels: { ...base.yaxis.labels, formatter: (v) => `${num(v / 1e6, 2)}M` } }, tooltip: { ...base.tooltip, y: { formatter: (v) => num(v) } } }} />
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
