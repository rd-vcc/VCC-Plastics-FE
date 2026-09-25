import "./locales";
import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { Box, Button, InputAdornment, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SettingsSuggestOutlinedIcon from "@mui/icons-material/SettingsSuggestOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, downloadCsv } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, btn, cardSx, ddmmhhmm, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { QuickActionGrid } from "../../MaintenanceManagement/maintUi";
import { label, tx } from "../qualityLocales";
import { AlertDialog, NgCreateDialog, NgDetailDialog } from "../qualityDialogs";
import { DateRange, DonutCard, FilterSelect, QualityFrame, Sparkline, daysAgoIso, qsOf, todayIso, useQualityData, useQualityPage } from "../qualityPage";
import { Change, NG_STATUS_COLORS, NgStatusPill, PRIORITY_COLORS, PROCESS_COLORS, PriorityPill, QUALITY_API, TYPE_COLORS, alertText, changeOf, pctText, relChange } from "../qualityUi";

const STAGES = [["NEW", HourglassEmptyOutlinedIcon, "#F79009"], ["INVESTIGATING", ManageSearchOutlinedIcon, "#2E90FA"], ["CA_IN_PROGRESS", SettingsSuggestOutlinedIcon, "#7A5AF8"],
  ["WAITING_VERIFICATION", HourglassEmptyOutlinedIcon, "#F79009"], ["CLOSED", CheckCircleOutlineIcon, "#12B76A"]];

export default function NGManagement() {
  const page = useQualityPage();
  const { navigate, params, setParams, dark, axisColor, grid, tableSx, canEdit, lookups, request, actor, notify } = page;
  const [range, setRange] = useState({ from: params.get("date_from") || daysAgoIso(6), to: params.get("date_to") || todayIso() });
  const [f, setF] = useState({ work_order_id: params.get("wo") || params.get("work_order_id") || "", product_id: params.get("product_id") || "", source: params.get("source") || "",
    defect_code_id: params.get("defect") || "", process: "", machine_id: params.get("machine_id") || "", owner: "", status: params.get("status") || "", priority: "" });
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(null);
  const url = `${QUALITY_API}/ng${qsOf({ date_from: range.from, date_to: range.to, ...f, search })}`;
  const { data, loading, lastUpdate, live, setLive, load } = useQualityData(page, url, { interval: 30000, paused: Boolean(dialog) });
  const set = (key) => (v) => setF((o) => ({ ...o, [key]: v }));
  useEffect(() => {
    const ng = Number(params.get("ng"));
    if (ng) setDialog({ type: "ng", id: ng });
    else if (params.get("create")) setDialog({ type: "create", preset: { source: params.get("source") || "IPQC", work_order_id: Number(params.get("wo")) || "" } });
  }, [params]);
  const closeDialog = () => {
    setDialog(null);
    if (params.get("ng") || params.get("create")) { const p = new URLSearchParams(params); p.delete("ng"); p.delete("create"); setParams(p, { replace: true }); }
  };
  const k = data?.kpis || {};
  const rows = data?.records || [];
  const pick = (statuses, tab) => {
    const n = rows.find((r) => statuses.includes(r.status));
    if (n) setDialog({ type: "ng", id: n.id, tab }); else notify("info", tx("No NG record in this stage."));
  };
  const exportCsv = () => downloadCsv(`ng-records-${range.from}_${range.to}.csv`, ["NG No.", "Time", "Source", "Work Order", "Product", "Defect", "Process", "Machine", "Mold", "Qty", "NG %", "Status", "Priority", "Owner", "Due", "Root cause", "Corrective action", "Disposition"],
    rows.map((n) => [n.ng_no, n.detected_at, n.source, n.wo_no, n.product_code, n.defect_name, n.process, n.machine_code, n.mold_code, n.ng_qty, n.ng_rate, n.status, n.priority, n.owner, n.due_date, n.root_cause, n.corrective_action, n.disposition]));
  const quick = [
    [tx("Create NG"), AddIcon, "#1570EF", () => setDialog({ type: "create", preset: {} }), !canEdit],
    [tx("Root Cause Analysis"), ManageSearchOutlinedIcon, "#2E90FA", () => pick(["NEW", "INVESTIGATING", "REOPENED"], "rca")],
    [tx("Corrective Action"), BuildOutlinedIcon, "#7A5AF8", () => pick(["CA_IN_PROGRESS", "INVESTIGATING"], "rca")],
    [tx("Verify Effectiveness"), VerifiedOutlinedIcon, "#12B76A", () => pick(["WAITING_VERIFICATION"], "verify")],
    [tx("Close NG"), CheckCircleOutlineIcon, "#0E9384", () => pick(["WAITING_VERIFICATION"], "verify")],
    [tx("NG Report"), AssessmentOutlinedIcon, "#F79009", () => window.print()],
    [tx("Export NG Data"), FileDownloadOutlinedIcon, "#667085", exportCsv],
    [tx("NG History"), HistoryOutlinedIcon, "#475467", () => { setF((o) => ({ ...o, status: "CLOSED" })); setRange({ from: daysAgoIso(89), to: todayIso() }); }],
  ];
  const vsY = (a, b, goodWhenUp = false, unit = "") => <><span>{tx("vs yesterday")} </span><Change value={unit ? changeOf(a, b) : relChange(a, b)} unit={unit || "%"} goodWhenUp={goodWhenUp} /></>;
  const toolbar = (
    <>
      <DateRange from={range.from} to={range.to} onChange={(a, b) => setRange({ from: a, to: b })} />
      {canEdit ? <Button startIcon={<AddIcon />} onClick={() => setDialog({ type: "create", preset: {} })} sx={btn("primary")}>{tx("Create NG")}</Button> : null}
    </>
  );

  return (
    <QualityFrame page={page} title={tx("NG Management")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} toolbar={toolbar} system={data?.system}>
      {data ? (
        <>
          <Box sx={{ mb: 1.5 }}>
            <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))", xl: "repeat(6, minmax(0,1fr))" }}>
              <KpiTile tone="primary" title={tx("Total NG")} value={num(k.total)} sub={<>{num(k.ng_qty)} {tx("pcs")} · {vsY(k.total, k.y_total)}</>} icon={ReportProblemOutlinedIcon} onClick={() => set("status")("")} />
              <KpiTile tone="success" title={tx("In Progress")} value={num(k.in_progress)} sub={vsY(k.in_progress, k.y_in_progress)} icon={ManageSearchOutlinedIcon} onClick={() => set("status")("INVESTIGATING")} />
              <KpiTile tone="warning" title={tx("Pending")} value={num(k.pending)} sub={k.overdue ? <span style={{ color: "#F04438", fontWeight: 700 }}>{k.overdue} {tx("overdue")}</span> : vsY(k.pending, k.y_pending)}
                icon={HourglassEmptyOutlinedIcon} onClick={() => set("status")("NEW")} />
              <KpiTile tone="accent" title={tx("Closed")} value={num(k.closed)} sub={vsY(k.closed, k.y_closed, true)} icon={CheckCircleOutlineIcon} onClick={() => set("status")("CLOSED")} />
              <KpiTile tone="danger" title={tx("NG Rate")} value={k.ng_rate != null ? num(k.ng_rate, 2) : EMPTY} unit={k.ng_rate != null ? "%" : ""} sub={vsY(k.ng_rate, k.ng_rate_prev, false, "%")}
                icon={WarningAmberOutlinedIcon} onClick={() => navigate("/quality-management/inspection-management")} />
              <KpiTile tone="info" title={tx("Repeat Rate")} value={k.repeat_rate != null ? num(k.repeat_rate, 1) : EMPTY} unit={k.repeat_rate != null ? "%" : ""}
                sub={`${k.repeat} ${tx("repeated after closure")}`} icon={ReplayOutlinedIcon} />
            </KpiCardGroup>
          </Box>

          <Paper elevation={0} sx={{ ...cardSx, p: 1, mb: 1.5 }}>
            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
              <TextField size="small" placeholder={tx("Search NG No., work order, product, defect...")} value={search} onChange={(e) => setSearch(e.target.value)} sx={{ width: 260 }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
              <FilterSelect labelText={tx("Work Order")} value={f.work_order_id} onChange={set("work_order_id")} items={(lookups?.work_orders || []).map((w) => [w.id, w.wo_no])} width={140} />
              <FilterSelect labelText={tx("Product")} value={f.product_id} onChange={set("product_id")} items={(lookups?.products || []).map((p) => [p.id, `${p.product_code} ${p.product_name}`])} width={140} />
              <FilterSelect labelText={tx("NG Source")} value={f.source} onChange={set("source")} items={(lookups?.ng_sources || []).map((x) => [x, label("ngSource", x)])} width={125} />
              <FilterSelect labelText={tx("Defect")} value={f.defect_code_id} onChange={set("defect_code_id")} items={(lookups?.defects || []).map((d) => [d.id, d.reason_name])} width={140} />
              <FilterSelect labelText={tx("Process")} value={f.process} onChange={set("process")} items={(lookups?.processes || []).map((x) => [x, label("process", x)])} width={120} />
              <FilterSelect labelText={tx("Machine")} value={f.machine_id} onChange={set("machine_id")} items={(lookups?.machines || []).map((m) => [m.id, m.code])} width={110} />
              <FilterSelect labelText={tx("Owner")} value={f.owner} onChange={set("owner")} items={(lookups?.inspectors || []).map((p) => [p, p])} width={140} />
              <FilterSelect labelText={tx("Status")} value={f.status} onChange={set("status")} items={(lookups?.ng_statuses || []).map((x) => [x, label("ngStatus", x)])} width={140} />
              <FilterSelect labelText={tx("Priority")} value={f.priority} onChange={set("priority")} items={(lookups?.priorities || []).map((x) => [x, label("priority", x)])} width={110} />
            </Stack>
          </Paper>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1fr) 340px" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("NG List")} action={<Typography variant="caption" color="text.secondary">{rows.length} {tx("rows")}</Typography>} />
              <Box sx={{ px: 1, pb: 1, height: 430, overflow: "auto" }}>
                <Table size="small" stickyHeader sx={tableSx}>
                  <TableHead><TableRow><TableCell>{tx("NG No.")}</TableCell><TableCell>{tx("Time")}</TableCell><TableCell>{tx("Work Order")}</TableCell><TableCell>{tx("Product")}</TableCell>
                    <TableCell>{tx("Defect")}</TableCell><TableCell>{tx("Process")}</TableCell><TableCell>{tx("Machine")}</TableCell><TableCell>{tx("Mold")}</TableCell><TableCell>{tx("Source")}</TableCell>
                    <TableCell align="right">{tx("Qty")}</TableCell><TableCell align="right">NG %</TableCell><TableCell align="center">{tx("Status")}</TableCell><TableCell align="center">{tx("Priority")}</TableCell><TableCell>{tx("Owner")}</TableCell></TableRow></TableHead>
                  <TableBody>{rows.map((n) => (
                    <TableRow key={n.id} hover sx={{ cursor: "pointer" }} onClick={() => setDialog({ type: "ng", id: n.id })}>
                      <TableCell sx={{ fontWeight: 700, color: "#1570EF" }}>{n.ng_no}{n.is_repeat ? <ReplayOutlinedIcon sx={{ fontSize: 13, color: "#F04438", ml: 0.4, verticalAlign: "middle" }} titleAccess={tx("Repeat")} /> : null}
                        {n.wo_held ? <LockOutlinedIcon sx={{ fontSize: 13, color: "#F04438", ml: 0.3, verticalAlign: "middle" }} titleAccess={tx("Work order held")} /> : null}</TableCell>
                      <TableCell>{ddmmhhmm(n.detected_at)}</TableCell><TableCell>{n.wo_no || EMPTY}</TableCell><TableCell>{n.product_name || n.lot_no || EMPTY}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{n.defect_name || EMPTY}</TableCell><TableCell>{label("process", n.process)}</TableCell><TableCell>{n.machine_code || EMPTY}</TableCell>
                      <TableCell>{n.mold_code || EMPTY}</TableCell><TableCell>{label("ngSource", n.source)}</TableCell><TableCell align="right">{num(n.ng_qty)}</TableCell><TableCell align="right">{pctText(n.ng_rate)}</TableCell>
                      <TableCell align="center"><NgStatusPill value={n.status} /></TableCell><TableCell align="center"><PriorityPill value={n.priority} /></TableCell>
                      <TableCell sx={{ color: n.overdue ? "#F04438" : undefined }}>{n.owner || EMPTY}</TableCell></TableRow>
                  ))}</TableBody>
                </Table>
                {!rows.length ? <Typography variant="caption" color="text.secondary" sx={{ p: 1, display: "block" }}>{tx("No data.")}</Typography> : null}
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("NG Distribution by Type")} />
              <Box sx={{ cursor: "pointer" }}>
                <DonutCard entries={data.by_source.map(([key, v]) => [key, v, label("ngSource", key)])} colors={TYPE_COLORS} dark={dark} axisColor={axisColor} height={200} centerLabel={tx("pcs")} />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ px: 1.5, display: "block" }}>{tx("NG pieces by the inspection stage that found them.")}</Typography>
            </Paper>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", xl: "repeat(4, minmax(0,1fr))" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Top 5 NG Defects")} />
              <Box sx={{ px: 1 }}>
                {data.top_defects.length ? (
                  <Chart type="bar" height={210} series={[{ name: tx("Qty"), data: data.top_defects.map((d) => d.qty) }]} options={{
                    chart: { background: "transparent", toolbar: { show: false }, events: { dataPointSelection: (e, c, cfg) => { const d = data.top_defects[cfg.dataPointIndex]; if (d?.defect_code_id) set("defect_code_id")(d.defect_code_id); } } },
                    plotOptions: { bar: { horizontal: true, barHeight: "55%", borderRadius: 3 } }, colors: ["#1570EF"], grid,
                    dataLabels: { enabled: true, formatter: (v, o) => `${v} (${data.top_defects[o.dataPointIndex].share}%)`, style: { fontSize: "10px" } },
                    xaxis: { categories: data.top_defects.map((d) => d.name), labels: { style: { colors: axisColor } } }, yaxis: { labels: { style: { colors: axisColor } } },
                    tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v, o) => `${v} · ${tx("previous period")}: ${data.top_defects[o.dataPointIndex].prev}` } } }} />
                ) : <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>{tx("No data.")}</Typography>}
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("NG by Process")} />
              <DonutCard entries={data.by_process.map(([key, v]) => [key, v, label("process", key)])} colors={PROCESS_COLORS} dark={dark} axisColor={axisColor} height={190} centerLabel={tx("pcs")} />
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("NG Trend by Day")} />
              <Box sx={{ px: 1 }}>
                <Chart type="area" height={210} series={[{ name: tx("NG pcs"), data: data.trend.map((x) => x.qty) }]} options={{
                  chart: { background: "transparent", toolbar: { show: false } }, colors: ["#1570EF"], stroke: { width: 2 }, fill: { type: "gradient", gradient: { opacityFrom: 0.3, opacityTo: 0.02 } },
                  markers: { size: 3 }, dataLabels: { enabled: true, style: { fontSize: "9px" }, background: { enabled: false }, offsetY: -6 }, grid,
                  xaxis: { categories: data.trend.map((x) => String(x.date).slice(8, 10) + "/" + String(x.date).slice(5, 7)), labels: { style: { colors: axisColor, fontSize: "10px" } } },
                  yaxis: { min: 0, labels: { style: { colors: axisColor }, formatter: (v) => num(v, 0) } },
                  tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v, o) => `${v} ${tx("pcs")} · ${data.trend[o.dataPointIndex].records} ${tx("records")}` } } }} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("NG Rate by Machine")} />
              <Box sx={{ px: 1 }}>
                {data.machines.length ? (
                  <Chart type="bar" height={210} series={[{ name: "NG %", data: data.machines.map((m) => m.ng_rate ?? 0) }]} options={{
                    chart: { background: "transparent", toolbar: { show: false }, events: { dataPointSelection: (e, c, cfg) => { const m = data.machines[cfg.dataPointIndex]; if (m) navigate(`/machine-equipment/machine-detail?machine=${m.machine_id}`); } } },
                    plotOptions: { bar: { horizontal: true, barHeight: "50%", borderRadius: 3, distributed: true } }, legend: { show: false }, grid,
                    colors: data.machines.map((m) => (m.ng_rate >= 3 ? "#F04438" : m.ng_rate >= 2 ? "#F79009" : "#12B76A")),
                    dataLabels: { enabled: true, formatter: (v) => `${num(v, 2)}%`, style: { fontSize: "10px" } },
                    xaxis: { categories: data.machines.map((m) => m.machine_code), labels: { style: { colors: axisColor }, formatter: (v) => `${num(v, 1)}%` } }, yaxis: { labels: { style: { colors: axisColor } } },
                    tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v, o) => `${num(v, 2)}% · ${data.machines[o.dataPointIndex].ng_qty}/${num(data.machines[o.dataPointIndex].produced)} ${tx("pcs")}` } } }} />
                ) : <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>{tx("No data.")}</Typography>}
              </Box>
            </Paper>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1.5fr) minmax(0,1fr) minmax(0,1.1fr)" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("NG Processing Status")} />
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 1, px: 1.5, pb: 1.5 }}>
                {STAGES.map(([st, Icon, color]) => {
                  const n = data.stages[st] || 0;
                  return (
                    <Stack key={st} spacing={0.5} onClick={() => set("status")(st)} sx={{ border: 1, borderColor: f.status === st ? NG_STATUS_COLORS[st] : "divider", borderRadius: 2, p: 1.25, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}>
                      <Typography variant="caption" color="text.secondary" sx={{ minHeight: 30, lineHeight: 1.2 }}>{label("ngStage", st)}</Typography>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: `${color}1A`, display: "grid", placeItems: "center" }}><Icon sx={{ color, fontSize: 18 }} /></Box>
                        <Typography variant="h6" fontWeight={800}>{n}</Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">{k.total ? `${num((n / k.total) * 100, 1)}%` : EMPTY}</Typography>
                    </Stack>
                  );
                })}
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Repeat NG (Top 5)")} />
              <Box sx={{ px: 1, pb: 1, height: 170, overflow: "auto" }}>
                <Table size="small" stickyHeader sx={tableSx}>
                  <TableHead><TableRow><TableCell>{tx("Defect")}</TableCell><TableCell align="right">{tx("Repeats")}</TableCell><TableCell align="right">{tx("Repeat %")}</TableCell><TableCell align="center">{tx("Trend")}</TableCell></TableRow></TableHead>
                  <TableBody>{data.repeat_top.map((r) => (
                    <TableRow key={r.name} hover sx={{ cursor: "pointer" }} onClick={() => r.defect_code_id && set("defect_code_id")(r.defect_code_id)}>
                      <TableCell sx={{ fontWeight: 700 }}>{r.name}</TableCell><TableCell align="right">{r.repeats}</TableCell><TableCell align="right">{num(r.rate, 1)}%</TableCell>
                      <TableCell align="center" sx={{ py: 0 }}><Sparkline data={r.series} /></TableCell></TableRow>
                  ))}</TableBody>
                </Table>
                {!data.repeat_top.length ? <Typography variant="caption" color="text.secondary" sx={{ p: 1, display: "block" }}>{tx("No repeated defect in the period.")}</Typography> : null}
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("NG Alerts")} />
              <Box sx={{ px: 1.5, pb: 1, height: 170, overflow: "auto" }}>
                {data.alerts.map((a) => (
                  <Stack key={a.id} direction="row" spacing={1} onClick={() => setDialog({ type: "alert", alert: a })}
                    sx={{ py: 0.6, borderBottom: 1, borderColor: "divider", cursor: "pointer", opacity: ["RESOLVED", "CLOSED"].includes(a.status) ? 0.55 : 1, alignItems: "flex-start" }}>
                    {["CRITICAL", "HIGH"].includes(a.severity) ? <WarningAmberOutlinedIcon sx={{ fontSize: 18, color: PRIORITY_COLORS[a.severity] }} /> : <InfoOutlinedIcon sx={{ fontSize: 18, color: "#2E90FA" }} />}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" fontWeight={700} sx={{ display: "block", lineHeight: 1.3 }} title={a.message}>{alertText(a)}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5 }}>{ddmmhhmm(a.raised_at)} · {label("alertStatus", a.status)}</Typography>
                    </Box>
                    <PriorityPill value={a.severity} />
                  </Stack>
                ))}
                {!data.alerts.length ? <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography> : null}
              </Box>
            </Paper>
          </Box>

          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Quick Actions")} />
            <Box sx={{ px: 1.5, pb: 1.5 }}><QuickActionGrid actions={quick} columns={{ xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)", xl: "repeat(8, 1fr)" }} /></Box>
          </Paper>
        </>
      ) : null}
      {dialog?.type === "create" ? <NgCreateDialog lookups={lookups} preset={dialog.preset} request={request} actor={actor} notify={notify} onClose={closeDialog}
        onSaved={(r) => { load({ silent: true }); setDialog({ type: "ng", id: r.id }); }} /> : null}
      {dialog?.type === "ng" ? <NgDetailDialog ngId={dialog.id} initialTab={dialog.tab} lookups={lookups} request={request} actor={actor} notify={notify} canEdit={canEdit} navigate={navigate}
        onClose={closeDialog} onChanged={() => load({ silent: true })} /> : null}
      {dialog?.type === "alert" ? <AlertDialog alert={dialog.alert} lookups={lookups} request={request} actor={actor} notify={notify} canEdit={canEdit} navigate={navigate}
        onClose={() => setDialog(null)} onChanged={() => load({ silent: true })} /> : null}
    </QualityFrame>
  );
}
