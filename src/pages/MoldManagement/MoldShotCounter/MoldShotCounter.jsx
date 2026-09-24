import "./locales";
import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { Box, Button, FormControl, InputAdornment, InputLabel, LinearProgress, MenuItem, Paper, Select, Slider, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
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
import { KpiTile, downloadCsv } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, cardSx, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { label, tx } from "../moldLocales";
import { MoldPageFrame, useMoldData, useMoldPage } from "../moldPage";
import { HealthBadge, InfoGrid, LIFE_BUCKET_COLORS, LifeBar, LifeGauge, MOLD_API, MOLD_STATUSES, MoldImage, MoldRowMenu, MoldStatusPill, QuickActionGrid, dateText, lifeColor, locationText } from "../moldUi";

const EMPTY_FILTER = { status: "", type: "", product: "", life: [0, 100], q: "" };

export default function MoldShotCounter() {
  const page = useMoldPage();
  const { navigate, params, setParams, dark, axisColor, grid, tableSx, canEdit, lookups, request } = page;
  const { data, loading, lastUpdate, live, setLive, load } = useMoldData(page, `${MOLD_API}/summary?trend_days=30`);
  const [f, setF] = useState(EMPTY_FILTER);
  const [detail, setDetail] = useState(null);
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
  const exportCsv = () => downloadCsv("mold-shot-counter.csv", ["Mold", "Name", "Machine", "Product", "Status", "Current shot", "Design shot", "Life used %", "Remaining shot", "Daily avg shot", "Est. end of life", "Health"],
    items.map((m) => [m.mold_code, m.mold_name, m.machine_code, m.product_name, label("moldStatus", m.status), m.current_shot, m.design_shot, m.life_used_pct, m.remaining_shot, m.daily_avg_shot, m.eol_date, m.health]));
  const quick = [
    [tx("View Detail"), VisibilityOutlinedIcon, "#1570EF", () => navigate(`/mold-management/detail?mold=${selectedId}`), !selectedId],
    [tx("Mold Status"), FactCheckOutlinedIcon, "#F79009", () => navigate("/mold-management/status"), false],
    [tx("Installation History"), HistoryOutlinedIcon, "#2E90FA", () => navigate(withSel("/mold-management/installation-history")), !selectedId],
    [tx("Mold Location"), LocationOnOutlinedIcon, "#12B76A", () => navigate(withSel("/mold-management/location")), !selectedId],
    [tx("Maintenance History"), EngineeringOutlinedIcon, "#0E9384", () => navigate(`/mold-management/detail?mold=${selectedId}#maintenance`), !selectedId],
    [tx("Adjust Shot Counter"), SpeedOutlinedIcon, "#7A5AF8", () => page.openAction("shots", sel), !canEdit || !sel],
    [tx("Create PM Schedule"), CalendarMonthOutlinedIcon, "#F04438", () => navigate(`/maintenance-management/planning?create=1&asset_type=MOLD${selectedId ? `&asset_id=${selectedId}` : ""}`), false],
  ];
  const sel2 = (key, text, options, width = 150) => (
    <FormControl size="small" sx={{ minWidth: width }}><InputLabel shrink>{text}</InputLabel>
      <Select displayEmpty notched label={text} value={f[key]} onChange={set(key)}><MenuItem value="">{tx("All")}</MenuItem>{options}</Select></FormControl>
  );

  return (
    <MoldPageFrame page={page} title={tx("Mold Shot Counter")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} system={data?.system} onChanged={() => load({ silent: true })}>
      {data ? (
        <>
          <Box sx={{ mb: 1.5 }}>
            <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))", xl: "repeat(6, minmax(0,1fr))" }}>
              <KpiTile tone="primary" title={tx("Total Molds")} value={num(total)} sub="100%" icon={InventoryOutlinedIcon} />
              <KpiTile tone="success" title={tx("Running Molds")} value={num(k.running)} sub={total ? `${num((k.running / total) * 100, 1)}% ${tx("of total")}` : ""} icon={PlayCircleOutlineIcon} />
              <KpiTile tone="warning" title={tx("Total Shots")} value={num(k.total_shots)} sub={`${tx("Shots today")}: ${num(k.shots_today)}`} icon={SpeedOutlinedIcon} />
              <KpiTile tone="accent" title={tx("Avg Life Used")} value={k.avg_life != null ? num(k.avg_life, 1) : EMPTY} unit={k.avg_life != null ? "%" : ""} sub="" icon={TimelapseOutlinedIcon} />
              <KpiTile tone="danger" title={tx("Molds > 90% Life")} value={num(k.life_90)} sub={total ? `${num((k.life_90 / total) * 100, 1)}% ${tx("of total")}` : ""} icon={ReportProblemOutlinedIcon} onClick={() => setF((o) => ({ ...o, life: [90, 100] }))} />
              <KpiTile tone="info" title={tx("Est. End of Life (30 Days)")} value={num(k.eol_30d)} sub={tx("Need attention")} icon={EventBusyOutlinedIcon} />
            </KpiCardGroup>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,3fr) minmax(0,1fr)" }, gap: 1.5, mb: 1.5 }}>
            <Box>
              <Paper elevation={0} sx={{ ...cardSx, p: 1.25, mb: 1.5 }}>
                <Stack direction="row" sx={{ gap: 1.25, flexWrap: "wrap", alignItems: "center" }}>
                  {sel2("status", tx("Status"), MOLD_STATUSES.map((s) => <MenuItem key={s} value={s}>{label("moldStatus", s)}</MenuItem>))}
                  {sel2("type", tx("Mold Type"), (lookups?.mold_types || []).map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>))}
                  {sel2("product", tx("Product"), products.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>), 170)}
                  <Box sx={{ width: 200, px: 1 }}>
                    <Typography variant="caption" color="text.secondary">{tx("Life Used (%) range")}: {f.life[0]}–{f.life[1]}%</Typography>
                    <Slider size="small" value={f.life} min={0} max={100} step={5} onChange={(_, v) => setF((o) => ({ ...o, life: v }))} />
                  </Box>
                  <TextField size="small" placeholder={tx("Search mold, product, machine...")} value={f.q} onChange={set("q")} sx={{ width: 230 }}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
                  <Button startIcon={<FilterAltOffOutlinedIcon />} onClick={() => setF(EMPTY_FILTER)} sx={{ textTransform: "none" }}>{tx("Clear")}</Button>
                </Stack>
              </Paper>
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Shot Counter List")} subtitle={`(${items.length})`} />
                <Box sx={{ px: 1, pb: 1, height: 420, overflow: "auto" }}>
                  <Table size="small" stickyHeader sx={tableSx}>
                    <TableHead><TableRow>
                      {["Mold No.", "Mold Name", "Machine", "Product", "Status", "Current Shot", "Design Shot", "Life Used (%)", "Remaining Shot", "Daily Avg. Shot", "Est. End of Life", "Health Score", ""].map((h, i) => (
                        <TableCell key={h || i} align={["Current Shot", "Design Shot", "Remaining Shot", "Daily Avg. Shot"].includes(h) ? "right" : ["Status", "Life Used (%)", "Health Score"].includes(h) ? "center" : "left"}>{h ? tx(h) : ""}</TableCell>))}
                    </TableRow></TableHead>
                    <TableBody>{items.map((m) => (
                      <TableRow key={m.id} hover selected={m.id === selectedId} onClick={() => setParams({ mold: String(m.id) })} onDoubleClick={() => navigate(`/mold-management/detail?mold=${m.id}`)} sx={{ cursor: "pointer" }}>
                        <TableCell sx={{ fontWeight: 800, color: "#1570EF" }}>{m.mold_code}</TableCell><TableCell sx={{ maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis" }}>{m.mold_name}</TableCell>
                        <TableCell>{m.machine_code || locationText(m)}</TableCell><TableCell sx={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>{m.product_name || EMPTY}</TableCell>
                        <TableCell align="center"><MoldStatusPill value={m.status} /></TableCell><TableCell align="right">{num(m.current_shot)}</TableCell><TableCell align="right">{num(m.design_shot)}</TableCell>
                        <TableCell align="center"><LifeBar value={m.life_used_pct} /></TableCell><TableCell align="right">{num(m.remaining_shot)}</TableCell><TableCell align="right">{num(m.daily_avg_shot)}</TableCell>
                        <TableCell sx={{ color: m.eol_days != null && m.eol_days <= 30 ? "#F04438" : undefined, fontWeight: m.eol_days != null && m.eol_days <= 30 ? 800 : 400 }}>{dateText(m.eol_date)}</TableCell>
                        <TableCell align="center"><HealthBadge value={m.health} /></TableCell>
                        <TableCell padding="none"><MoldRowMenu mold={m} canEdit={canEdit} navigate={navigate} onAction={page.openAction} /></TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              </Paper>
            </Box>
            <Stack spacing={1.5}>
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Life Used Distribution")} />
                <Box sx={{ display: "grid", gridTemplateColumns: "130px 1fr", alignItems: "center", px: 1, pb: 1 }}>
                  <Chart type="donut" height={150} series={buckets.map(([, n]) => n)} options={{
                    labels: buckets.map(([b]) => `${b}%`), colors: LIFE_BUCKET_COLORS, legend: { show: false }, dataLabels: { enabled: false }, chart: { background: "transparent" },
                    stroke: { width: 1, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light" },
                    plotOptions: { pie: { donut: { size: "64%", labels: { show: true, name: { color: axisColor }, value: { fontSize: "18px", fontWeight: 800, color: dark ? "#fff" : "#101828" },
                      total: { show: true, label: tx("Total"), color: axisColor, formatter: () => String(total) } } } } } }} />
                  <Stack spacing={0.5}>{buckets.map(([b, n], i) => (
                    <Stack key={b} direction="row" spacing={1} sx={{ alignItems: "center", cursor: "pointer" }} onClick={() => setF((o) => ({ ...o, life: b.split("-").map(Number) }))}>
                      <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: LIFE_BUCKET_COLORS[i] }} /><Typography variant="caption" sx={{ flex: 1 }}>{b}%</Typography>
                      <Typography variant="caption" fontWeight={800}>{n} ({num((n / (total || 1)) * 100, 0)}%)</Typography></Stack>))}</Stack>
                </Box>
              </Paper>
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Est. End of Life (Next 30 Days)")} />
                <Box sx={{ px: 1.5, pb: 1.5 }}>
                  {!data.eol.length ? <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography> : data.eol.map((m) => (
                    <Stack key={m.id} direction="row" spacing={1} sx={{ py: 0.5, cursor: "pointer" }} onClick={() => setParams({ mold: String(m.id) })}>
                      <Typography variant="caption" fontWeight={800} sx={{ color: "#1570EF", flex: 1 }}>{m.mold_code}</Typography>
                      <Typography variant="caption" sx={{ color: "#F04438", fontWeight: 700 }}>{dateText(m.eol_date)}</Typography>
                      <Typography variant="caption" fontWeight={700} sx={{ width: 70, textAlign: "right" }}>{num(m.remaining_shot)}</Typography></Stack>))}
                </Box>
              </Paper>
              <Paper elevation={0} sx={{ ...cardSx, flex: 1 }}>
                <Head title={tx("Shot Counter Trend (Total Shots)")} />
                <Box sx={{ px: 1, pb: 0.5 }}>
                  <Chart type="area" height={170} series={[{ name: tx("Total Shots"), data: data.shot_trend.map((s) => s.total) }]} options={{
                    chart: { background: "transparent", toolbar: { show: false }, sparkline: { enabled: false } }, colors: ["#12B76A"], stroke: { width: 2 }, dataLabels: { enabled: false },
                    fill: { type: "gradient", gradient: { opacityFrom: 0.35, opacityTo: 0.05 } }, xaxis: { categories: data.shot_trend.map((s) => dateText(s.date).slice(0, 5)), tickAmount: 5, labels: { rotate: 0, style: { colors: axisColor, fontSize: "10px" } } },
                    yaxis: { labels: { style: { colors: axisColor }, formatter: (v) => `${num(v / 1e6, 2)}M` } }, grid, tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v) => num(v) } } }} />
                </Box>
              </Paper>
            </Stack>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0,1fr))", xl: "minmax(0,1.1fr) minmax(0,1.1fr) minmax(0,1.4fr) minmax(0,1fr)" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Shot Counter Overview")} subtitle={`(${tx("Selected mold")})`} />
              <Box sx={{ px: 1.5, pb: 1.5, display: "grid", gridTemplateColumns: "110px 1fr", gap: 1.5, alignItems: "center" }}>
                {sel ? (
                  <>
                    <MoldImage src={sel.image_url} height={110} iconSize={54} />
                    <InfoGrid rows={[[tx("Mold No."), sel.mold_code, "#1570EF"], [tx("Mold Name"), sel.mold_name], [tx("Machine"), sel.machine_code || locationText(sel)], [tx("Product"), sel.product_name],
                      [tx("Cavity"), sel.cavity_count], [tx("Design Shot"), num(sel.design_shot)], [tx("Mold Life Unit"), tx("Shot")]]} />
                  </>
                ) : <Typography variant="caption" color="text.secondary">{tx("Select a mold in the list.")}</Typography>}
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Shot Progress")} subtitle={sel ? `(${sel.mold_code})` : ""} />
              <Box sx={{ px: 1.5, pb: 1.5, display: "grid", gridTemplateColumns: "130px minmax(0,1fr)", gap: 1, alignItems: "center" }}>
                {sel ? (
                  <>
                    <LifeGauge value={sel.life_used_pct} dark={dark} height={160} />
                    <Box sx={{ minWidth: 0 }}>
                      <InfoGrid cols="auto 1fr" rows={[[tx("Current Shot"), num(sel.current_shot)], [tx("Design Shot"), num(sel.design_shot)], [tx("Remaining Shot"), num(sel.remaining_shot)],
                        [tx("Daily Avg. Shot"), num(sel.daily_avg_shot)], [tx("Est. End of Life"), dateText(sel.eol_date)], [tx("Remaining Days"), sel.eol_days != null ? `${num(sel.eol_days)} ${tx("days")}` : EMPTY, "#12B76A"]]} />
                      <LinearProgress variant="determinate" value={Math.min(sel.life_used_pct || 0, 100)} sx={{ mt: 1, height: 7, borderRadius: 4, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: lifeColor(sel.life_used_pct) } }} />
                    </Box>
                  </>
                ) : null}
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Shot Counter History (30 days)")} subtitle={sel ? `(${sel.mold_code})` : ""} />
              <Box sx={{ px: 1, pb: 0.5 }}>
                <Chart type="bar" height={200} series={[{ name: tx("Daily Shots"), data: hist.map((h) => h.shots) }]} options={{
                  chart: { background: "transparent", toolbar: { show: false } }, colors: ["#12B76A"], plotOptions: { bar: { columnWidth: "60%", borderRadius: 2 } }, dataLabels: { enabled: false },
                  xaxis: { categories: hist.map((h) => dateText(h.date).slice(0, 5)), tickAmount: 6, labels: { rotate: 0, style: { colors: axisColor, fontSize: "10px" } } },
                  yaxis: { labels: { style: { colors: axisColor }, formatter: (v) => num(v, 0) } }, grid, tooltip: { theme: dark ? "dark" : "light" } }} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Top Molds by Life Used")} />
              <Box sx={{ px: 1.5, pb: 1.5 }}>
                {data.top_life.map((m, i) => (
                  <Box key={m.id} sx={{ display: "grid", gridTemplateColumns: "14px 80px 1fr 48px", gap: 1, alignItems: "center", mb: 0.75, cursor: "pointer" }} onClick={() => setParams({ mold: String(m.id) })}>
                    <Typography variant="caption" color="text.secondary">{i + 1}</Typography>
                    <Typography variant="caption" fontWeight={800} sx={{ color: "#1570EF" }}>{m.mold_code}</Typography>
                    <LinearProgress variant="determinate" value={Math.min(m.life_used_pct, 100)} sx={{ height: 8, borderRadius: 4, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: lifeColor(m.life_used_pct) } }} />
                    <Typography variant="caption" fontWeight={800} align="right">{num(m.life_used_pct, 1)}%</Typography>
                  </Box>
                ))}
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
