import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import {
  Box, Button, IconButton, InputAdornment, LinearProgress, MenuItem, Paper, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";
import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import SearchIcon from "@mui/icons-material/Search";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, colShares, downloadExcel } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, ddmmhhmm, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { setActiveLanguage as setMaintLanguage } from "../../MaintenanceManagement/maintLocales";
import { DonutCard, MaintFrame, useMaintData } from "../../MaintenanceManagement/maintPage";
import { EmptyBody, FilterToggle, QuickCard, cellsSx, chartBase, fitGridSx, panelSx, toolBtnSx } from "../../shared/onePage";
import { SEL } from "../../MaintenanceManagement/maintUi";
import { useQualityPage } from "../../QualityManagement/qualityPage";
import { CreateReportDialog, HistoryDialog, PreviewDialog, REPORT_API, SchedulesDialog, download, reportName } from "./reportDialogs";
import { label, setActiveLanguage, tx } from "./reportLocales";

const MODULE_ICONS_COLORS = ["#1570EF", "#F04438", "#12B76A", "#7A5AF8", "#F79009", "#0E9384", "#2E90FA", "#667085", "#98A2B3"];
const fmtSize = (b) => (b >= 1073741824 ? `${num(b / 1073741824, 2)} GB` : b >= 1048576 ? `${num(b / 1048576, 2)} MB` : `${num((b || 0) / 1024, 1)} KB`);

export default function ReportCenter() {
  const page = useQualityPage();
  const { i18n } = useTranslation();
  setActiveLanguage(i18n.resolvedLanguage || i18n.language || "en");
  setMaintLanguage(i18n.resolvedLanguage || i18n.language || "en");
  const { dark, axisColor, grid, tableSx, request, actor, notify, canEdit, navigate } = page;
  const [catalog, setCatalog] = useState(null);
  const [tab, setTab] = useState("ALL");
  const [f, setF] = useState({ module: "", category: "", type: "" });
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [usageView, setUsageView] = useState("usage");
  const sum = useMaintData(page, `${REPORT_API}/summary?actor=${encodeURIComponent(actor)}`, { interval: 60000, paused: Boolean(dialog) });
  const loadCatalog = useCallback(() => request(`${REPORT_API}/catalog?actor=${encodeURIComponent(actor)}`).then((r) => setCatalog(r.items)).catch((e) => notify("error", e.message)), [request, actor, notify]);
  useEffect(() => { loadCatalog(); }, [loadCatalog]);
  const refresh = () => { loadCatalog(); sum.load({ silent: true }); };
  const items = catalog || [];
  const k = sum.data?.kpis || {};
  const shown = useMemo(() => {
    const s = search.trim().toLowerCase();
    let list = items.filter((r) => (!f.module || r.module === f.module) && (!f.category || r.category === f.category) && (!f.type || r.type === f.type)
      && (!s || `${r.name_en} ${r.name_vi} ${r.description || ""} ${r.code}`.toLowerCase().includes(s)));
    if (tab === "FAV") list = list.filter((r) => r.favorite);
    if (tab === "FREQ") list = [...list].filter((r) => r.uses_mtd).sort((a, b) => b.uses_mtd - a.uses_mtd);
    if (tab === "CUSTOM") list = list.filter((r) => r.type === "CUSTOM");
    return list;
  }, [items, f, search, tab]);
  const byModule = useMemo(() => {
    const m = {};
    items.forEach((r) => { m[r.module] = (m[r.module] || 0) + 1; });
    return m;
  }, [items]);
  const categories = [...new Set(items.filter((r) => !f.module || r.module === f.module).map((r) => r.category))];
  const toggleFav = async (r) => {
    try { const x = await request(`${REPORT_API}/favorites/${r.code}`, { method: "POST", body: JSON.stringify({ actor }) }); notify("success", x.favorite ? tx("Added to favorites.") : tx("Removed from favorites.")); refresh(); }
    catch (e) { notify("error", e.message); }
  };
  const quickExport = async (r) => {
    try { await download(`${REPORT_API}/export/${r.code}?${new URLSearchParams({ format: "XLSX", range_type: r.range_type || "LAST_7", lang: i18n.language?.startsWith("vi") ? "vi" : "en", actor })}`, `${r.code}.xlsx`); refresh(); }
    catch (e) { notify("error", e.message); }
  };
  const delCustom = async (r) => {
    if (!window.confirm(tx("Delete this custom report?"))) return;
    try { await request(`${REPORT_API}/saved/${r.code}?actor=${encodeURIComponent(actor)}`, { method: "DELETE" }); notify("success", tx("Deleted.")); refresh(); } catch (e) { notify("error", e.message); }
  };
  const exportList = () => downloadExcel("report-catalog.csv", ["Code", "Name", "Module", "Category", "Type", "Last generated", "Uses (MTD)", "Schedules"],
    shown.map((r) => [r.code, reportName(r), label("module", r.module), label("category", r.category), r.type, r.last_generated || "", r.uses_mtd, r.schedules]));
  const quick = [
    [tx("Create Report"), AddIcon, "#1570EF", () => setDialog({ type: "create" }), !canEdit],
    [tx("Scheduled Reports"), EventRepeatOutlinedIcon, "#F79009", () => setDialog({ type: "schedules" })],
    [tx("Report History"), HistoryOutlinedIcon, "#12B76A", () => setDialog({ type: "history" })],
    [tx("Audit Log"), ManageSearchOutlinedIcon, "#7A5AF8", () => navigate("/administration/audit-log")],
    [tx("Production Results"), InsertChartOutlinedIcon, "#0E9384", () => navigate("/production-management/results")],
    [tx("Quality Overview"), FactCheckOutlinedIcon, "#F04438", () => navigate("/quality-management/dashboard")],
  ];
  const storage = sum.data?.storage || [];
  const used = storage.reduce((a, s) => a + s.bytes, 0);
  const activeFilters = Object.values(f).filter(Boolean).length + (search ? 1 : 0);
  const reset = () => { setF({ module: "", category: "", type: "" }); setSearch(""); setTab("ALL"); };
  const toolbar = (
    <>
      <TextField size="small" placeholder={tx("Search by report name, description...")} value={search} onChange={(e) => setSearch(e.target.value)} sx={{ width: 260 }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
      <FilterToggle label={tx("Filter")} open={showFilter} count={activeFilters} onClick={() => setShowFilter((v) => !v)} />
    </>
  );
  const filters = showFilter ? (
    <>
      <TextField select size="small" label={tx("Module")} value={f.module} onChange={(e) => setF({ ...f, module: e.target.value, category: "" })} slotProps={SEL} sx={{ width: 200 }}>
        <MenuItem value="">{tx("All Modules")}</MenuItem>{Object.keys(byModule).map((m) => <MenuItem key={m} value={m}>{label("module", m)}</MenuItem>)}</TextField>
      <TextField select size="small" label={tx("Report Category")} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} slotProps={SEL} sx={{ width: 170 }}>
        <MenuItem value="">{tx("All Categories")}</MenuItem>{categories.map((c) => <MenuItem key={c} value={c}>{label("category", c)}</MenuItem>)}</TextField>
      <TextField select size="small" label={tx("Report Type")} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} slotProps={SEL} sx={{ width: 150 }}>
        <MenuItem value="">{tx("All Types")}</MenuItem><MenuItem value="STANDARD">{tx("Standard")}</MenuItem><MenuItem value="CUSTOM">{tx("Custom")}</MenuItem></TextField>
      <Button onClick={reset} sx={toolBtnSx}>{tx("Reset")}</Button>
    </>
  ) : null;
  const genChange = k.generated_prev ? Math.round(((k.generated_mtd - k.generated_prev) / k.generated_prev) * 1000) / 10 : null;
  const base = chartBase(dark, axisColor);
  const toggleSx = { px: 1, py: 0.1, textTransform: "none", fontWeight: 700, fontSize: 10.5 };
  const usage = (sum.data?.by_module || []).map(([m, n]) => [m, n, label("module", m)]);
  const usageColors = Object.fromEntries((sum.data?.by_module || []).map(([m], i) => [m, MODULE_ICONS_COLORS[i % MODULE_ICONS_COLORS.length]]));

  return (
    <MaintFrame fit page={page} title={tx("Report Center")} loading={sum.loading || !catalog} ready={Boolean(sum.data && catalog)} lastUpdate={sum.lastUpdate} live={sum.live} setLive={sum.setLive}
      onRefresh={refresh} onExport={exportList} toolbar={toolbar} filters={filters} system={sum.data?.system}>
      {sum.data && catalog ? (
        <>
          <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))", xl: "repeat(5, minmax(0,1fr))" }}>
            <KpiTile tone="primary" title={tx("Total Reports")} value={num(k.total)} sub={`${k.new_month} ${tx("new this month")}`} icon={DescriptionOutlinedIcon} onClick={() => setTab("ALL")} />
            <KpiTile tone="success" title={tx("Favorite Reports")} value={num(k.favorites)} sub={tx("frequently used")} icon={StarBorderIcon} onClick={() => setTab("FAV")} />
            <KpiTile tone="accent" title={tx("Reports Generated (MTD)")} value={num(k.generated_mtd)} sub={genChange != null ? `${genChange >= 0 ? "▲" : "▼"} ${num(Math.abs(genChange), 1)}% ${tx("vs last month")}` : `${num(k.generated_prev)} ${tx("vs last month")}`}
              icon={InsertChartOutlinedIcon} onClick={() => setDialog({ type: "history" })} />
            <KpiTile tone="warning" title={tx("Scheduled Reports")} value={num(k.scheduled)} sub={tx("active schedules")} icon={ScheduleOutlinedIcon} onClick={() => setDialog({ type: "schedules" })} />
            <KpiTile tone="info" title={tx("Last Generated")} value={k.last_generated ? String(k.last_generated).slice(11, 19) : EMPTY} sub={k.last_generated ? String(k.last_generated).slice(0, 10).split("-").reverse().join("/") : tx("never")}
              icon={HistoryOutlinedIcon} onClick={() => setDialog({ type: "history" })} />
          </KpiCardGroup>

          <Box sx={{ ...fitGridSx, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" }, gridTemplateRows: { lg: "minmax(0,1fr) minmax(0,1fr) minmax(0,0.9fr)" } }}>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 4" }, gridRow: { lg: "1 / 3" }, minHeight: { xs: 420, lg: 0 } }}>
              <Stack direction="row" sx={{ alignItems: "center", px: 1.5, height: 36, flexShrink: 0, gap: 1 }}>
                <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ flex: 1, minHeight: 30, "& .MuiTab-root": { minHeight: 30, py: 0, px: 1.25, minWidth: 0, textTransform: "none", fontWeight: 700, fontSize: 11.5 } }}>
                  <Tab value="ALL" label={tx("All Reports")} /><Tab value="FAV" label={`${tx("My Favorites")} (${k.favorites || 0})`} /><Tab value="FREQ" label={tx("Frequently Used")} />
                  <Tab value="CUSTOM" label={`${tx("Custom Reports")} (${items.filter((r) => r.type === "CUSTOM").length})`} />
                </Tabs>
                <Typography variant="caption" color="text.secondary">{shown.length} {tx("Reports")}</Typography>
              </Stack>
              <Box sx={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: { xs: "1fr", lg: "210px minmax(0,1fr)" }, gap: 1, px: 1, pb: 1 }}>
                <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 0.75, minHeight: 0, overflow: "auto" }}>
                  {[["", tx("All Categories"), items.length], ...Object.entries(byModule).map(([m, n]) => [m, label("module", m), n])].map(([m, text, n]) => (
                    <Stack key={m || "all"} direction="row" onClick={() => setF({ ...f, module: m, category: "" })} sx={{ alignItems: "center", gap: 1, px: 0.75, py: 0.5, borderRadius: 1.25, cursor: "pointer",
                      bgcolor: f.module === m ? "#1570EF14" : undefined, color: f.module === m ? "#1570EF" : undefined, "&:hover": { bgcolor: "action.hover" } }}>
                      <CategoryOutlinedIcon sx={{ fontSize: 14 }} /><Typography variant="caption" fontWeight={700} sx={{ flex: 1 }} noWrap>{text}</Typography><Typography variant="caption">{n}</Typography>
                    </Stack>
                  ))}
                </Box>
                <Box sx={{ minHeight: 0, minWidth: 0, overflow: "auto", border: 1, borderColor: "divider", borderRadius: 1.5 }}>
                  {shown.length ? (
                    <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(4, 31, 13, 12, 8, 10, 10, 12) }}>
                      <TableHead><TableRow><TableCell>#</TableCell><TableCell>{tx("Report Name")}</TableCell><TableCell>{tx("Module")}</TableCell><TableCell>{tx("Category")}</TableCell>
                        <TableCell>{tx("Type")}</TableCell><TableCell>{tx("Output")}</TableCell><TableCell>{tx("Last Generated")}</TableCell><TableCell align="right">{tx("Actions")}</TableCell></TableRow></TableHead>
                      <TableBody>{shown.map((r, i) => (
                        <TableRow key={r.code} hover>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell title={reportName(r)}>
                            <IconButton size="small" onClick={() => toggleFav(r)} sx={{ p: 0.25, mr: 0.25 }}>{r.favorite ? <StarIcon sx={{ fontSize: 13.5, color: "#EAAA08" }} /> : <StarBorderIcon sx={{ fontSize: 13.5, color: "text.disabled" }} />}</IconButton>
                            <Box component="span" sx={{ fontWeight: 800, color: "#1570EF", cursor: "pointer" }} onClick={() => setDialog({ type: "preview", report: r })}>{reportName(r)}</Box>
                          </TableCell>
                          <TableCell sx={{ cursor: "pointer" }} onClick={() => setF({ ...f, module: r.module, category: "" })}>{label("module", r.module)}</TableCell><TableCell title={label("category", r.category)}>{label("category", r.category)}</TableCell>
                          <TableCell>{r.type === "CUSTOM" ? tx("Custom") : tx("Standard")}</TableCell>
                          <TableCell>
                            {[["PDF", "#F04438", () => setDialog({ type: "preview", report: r })], ["XLSX", "#12B76A", () => quickExport(r)]].map(([fm, color, fn]) => (
                              <Box key={fm} component="span" onClick={fn} sx={{ display: "inline-block", mr: 0.5, px: 0.6, borderRadius: 0.75, fontSize: 10, fontWeight: 800, color, border: `1px solid ${color}55`, bgcolor: `${color}12`, cursor: "pointer" }}>{fm}</Box>
                            ))}
                          </TableCell>
                          <TableCell>{r.last_generated ? ddmmhhmm(r.last_generated) : EMPTY}</TableCell>
                          <TableCell align="right" sx={{ py: "0 !important" }}>
                            <Tooltip title={tx("Preview")}><IconButton size="small" onClick={() => setDialog({ type: "preview", report: r })}><PlayArrowOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title={tx("Schedule")}><IconButton size="small" onClick={() => setDialog({ type: "schedules", preset: r })}><EventRepeatOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                            {r.type === "CUSTOM" && canEdit ? <Tooltip title={tx("Delete")}><IconButton size="small" color="error" onClick={() => delCustom(r)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip> : null}
                          </TableCell></TableRow>
                      ))}</TableBody>
                    </Table>
                  ) : <EmptyBody text={tx("No data.")} />}
                </Box>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "4" }, gridRow: { lg: "1" } }}>
              <Head title={tx("Most Recent Reports")} action={<Typography variant="caption" sx={{ color: "#1570EF", cursor: "pointer" }} onClick={() => setDialog({ type: "history" })}>{tx("View all")}</Typography>} />
              {(sum.data.recent || []).length ? (
                <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1 }}>
                  {sum.data.recent.map((r) => {
                    const c = items.find((x) => x.code === r.report_code);
                    return (
                      <Stack key={r.id} direction="row" spacing={1} onClick={() => c && setDialog({ type: "preview", report: c })} sx={{ alignItems: "center", py: 0.45, borderBottom: 1, borderColor: "divider", cursor: c ? "pointer" : "default" }}>
                        <DescriptionOutlinedIcon sx={{ fontSize: 14.5, color: "text.secondary" }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="caption" fontWeight={700} noWrap sx={{ display: "block" }}>{c ? reportName(c) : r.report_name}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{ddmmhhmm(r.created_at)} · {label("action", r.action)}</Typography></Box>
                        <Box component="span" sx={{ fontSize: 10, fontWeight: 800, color: "#12B76A", border: "1px solid #12B76A55", borderRadius: 0.75, px: 0.6 }}>{r.output_format || "VIEW"}</Box>
                      </Stack>
                    );
                  })}
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "4" }, gridRow: { lg: "2" } }}>
              <Head title={usageView === "storage" ? tx("Storage Usage") : tx("Report Usage (MTD)")} action={(
                <ToggleButtonGroup exclusive size="small" value={usageView} onChange={(e, v) => v && setUsageView(v)}>
                  <ToggleButton value="usage" sx={toggleSx}>{tx("Reports")}</ToggleButton>
                  <ToggleButton value="storage" sx={toggleSx}>{tx("Storage Usage")}</ToggleButton>
                </ToggleButtonGroup>
              )} />
              {usageView === "usage" ? (usage.length ? (
                <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", alignItems: "center" }}>
                  <Box sx={{ width: "100%", "& .MuiStack-root": { maxHeight: 150, overflow: "auto" } }}>
                    <DonutCard entries={usage} colors={usageColors} dark={dark} axisColor={axisColor} height={140} size={130} />
                  </Box>
                </Box>
              ) : <EmptyBody text={tx("No data.")} />) : (
                <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  {storage.length ? (
                    <DonutCard entries={storage.map((s) => [s.format, s.bytes, `${s.format} (${s.files} ${tx("Files")})`])} colors={{ XLSX: "#12B76A", CSV: "#1570EF", PDF: "#F04438" }}
                      dark={dark} axisColor={axisColor} height={130} size={120} centerLabel={tx("Used")} formatter={fmtSize} />
                  ) : <EmptyBody text={tx("No data.")} />}
                  <Stack direction="row" sx={{ justifyContent: "space-between", px: 1.5, pb: 1 }}>
                    <Typography variant="caption">{tx("Used")}: <b>{fmtSize(used)}</b></Typography>
                    <Typography variant="caption">{tx("Available")}: <b>{sum.data.disk.free != null ? fmtSize(sum.data.disk.free) : EMPTY}</b></Typography>
                  </Stack>
                </Box>
              )}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "1" }, gridRow: { lg: "3" } }}>
              <Head title={tx("Report Generation Trend (Last 7 Days)")} />
              <Box sx={{ flex: 1, minHeight: 0, px: 1 }}>
                <Chart type="area" height="100%" series={[{ name: tx("Reports"), data: sum.data.trend.map((t) => t.count) }]} options={{
                  ...base, colors: ["#1570EF"], stroke: { width: 2 }, fill: { type: "gradient", gradient: { opacityFrom: 0.3, opacityTo: 0.02 } },
                  markers: { size: 3 }, dataLabels: { enabled: true, formatter: (v) => (v ? v : ""), style: { fontSize: "10px" }, background: { enabled: false }, offsetY: -6 },
                  xaxis: { ...base.xaxis, categories: sum.data.trend.map((t) => String(t.date).slice(8, 10) + "/" + String(t.date).slice(5, 7)) },
                  yaxis: { min: 0, tickAmount: 3, labels: { ...base.yaxis.labels, formatter: (v) => num(v, 0) } } }} />
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "2" }, gridRow: { lg: "3" } }}>
              <Head title={tx("Top 5 Frequently Used Reports (MTD)")} />
              {sum.data.top.length ? (
                <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly" }}>
                  {sum.data.top.map((t, i) => {
                    const c = items.find((x) => x.code === t.report_code);
                    const max = sum.data.top[0]?.n || 1;
                    return (
                      <Box key={t.report_code} sx={{ cursor: c ? "pointer" : "default" }} onClick={() => c && setDialog({ type: "preview", report: c })}>
                        <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}><Typography variant="caption" fontWeight={700} noWrap>{i + 1}. {c ? reportName(c) : t.name}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{t.n} {tx("times")}</Typography></Stack>
                        <LinearProgress variant="determinate" value={(t.n / max) * 100} sx={{ height: 5, borderRadius: 3 }} />
                      </Box>
                    );
                  })}
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "3" }, gridRow: { lg: "3" } }}>
              <Head title={tx("Scheduled Reports (Next 7 Days)")} action={<Typography variant="caption" sx={{ color: "#1570EF", cursor: "pointer" }} onClick={() => setDialog({ type: "schedules" })}>{tx("View all")}</Typography>} />
              {sum.data.upcoming.length ? (
                <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1 }}>
                  {sum.data.upcoming.map((s) => (
                    <Stack key={s.id} direction="row" sx={{ alignItems: "center", py: 0.5, borderBottom: 1, borderColor: "divider", gap: 1 }}>
                      <Typography variant="caption" fontWeight={700} sx={{ flex: 1 }} noWrap title={s.name}>{s.name}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>{label("frequency", s.frequency)} · {ddmmhhmm(s.next_run_at)}</Typography>
                      <Box component="span" sx={{ fontSize: 10, fontWeight: 800, color: "#12B76A", border: "1px solid #12B76A55", borderRadius: 0.75, px: 0.6 }}>{label("status", s.status)}</Box>
                    </Stack>
                  ))}
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>

            <Box sx={{ gridColumn: { lg: "4" }, gridRow: { lg: "3" }, display: "flex", minHeight: 0, "& > *": { flex: 1 } }}>
              <QuickCard title={tx("Quick Actions")} actions={quick} columns={3} />
            </Box>
          </Box>
        </>
      ) : null}
      {dialog?.type === "preview" ? <PreviewDialog report={dialog.report} request={request} actor={actor} notify={notify} dark={dark} axisColor={axisColor} grid={grid} onClose={() => setDialog(null)} onChanged={refresh} /> : null}
      {dialog?.type === "schedules" ? <SchedulesDialog items={sum.data?.schedules || []} catalog={items} preset={dialog.preset} request={request} actor={actor} notify={notify} onClose={() => setDialog(null)} onChanged={refresh} /> : null}
      {dialog?.type === "history" ? <HistoryDialog request={request} notify={notify} catalog={items} onClose={() => setDialog(null)} onOpen={(r) => setDialog({ type: "preview", report: r })} /> : null}
      {dialog?.type === "create" ? <CreateReportDialog catalog={items} request={request} actor={actor} notify={notify} onClose={() => setDialog(null)}
        onSaved={(code) => { refresh(); setDialog(null); setTab("CUSTOM"); notify("success", code); }} /> : null}
    </MaintFrame>
  );
}
