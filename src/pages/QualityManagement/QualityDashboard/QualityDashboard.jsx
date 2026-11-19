import "./locales";
import { useState } from "react";
import Chart from "react-apexcharts";
import { Alert, Box, Chip, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import BugReportOutlinedIcon from "@mui/icons-material/BugReportOutlined";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, colShares, downloadExcel } from "../../MaterialManagement/materialUi";
import { Dot, EMPTY, Head, ddmmhhmm, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { label, tx } from "../qualityLocales";
import { AlertDialog } from "../qualityDialogs";
import { DateRange, EmptyBody, FilterSelect, FilterToggle, QualityFrame, QuickCard, chartBase, daysAgoIso, fillSx, panelSx, qsOf, todayIso, useQualityData, useQualityPage } from "../qualityPage";
import { AlertStatusPill, Change, QSTATUS_COLORS, QStatusPill, QUALITY_API, SeverityPill, SpcStatusPill, alertText, dateText, pctText } from "../qualityUi";

const OVERALL_TONE = { NORMAL: "success", ATTENTION: "warning", CRITICAL: "error" };

export default function QualityDashboard() {
  const page = useQualityPage();
  const { navigate, dark, axisColor, tableSx, lookups, request, actor, notify, canEdit } = page;
  const [range, setRange] = useState({ from: daysAgoIso(6), to: todayIso() });
  const [f, setF] = useState({ shift_id: "", machine_id: "", mold_id: "", product_id: "", work_order_id: "", inspection_type: "" });
  const [alert, setAlert] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const url = `${QUALITY_API}/dashboard${qsOf({ date_from: range.from, date_to: range.to, ...f })}`;
  const { data, loading, lastUpdate, live, setLive, load } = useQualityData(page, url, { interval: 60000, paused: Boolean(alert) });
  const k = data?.kpis || {};
  const t = data?.targets || {};
  const keep = qsOf({ date_from: range.from, date_to: range.to, work_order_id: f.work_order_id, machine_id: f.machine_id, product_id: f.product_id });
  const set = (key) => (v) => setF((o) => ({ ...o, [key]: v }));
  const exportCsv = () => downloadExcel(`quality-dashboard-${range.from}_${range.to}.csv`, ["Work Order", "Product", "Machine", "Samples", "OK %", "NG %", "FPY %", "PPM", "Top defect", "Status"],
    (data?.work_orders || []).map((w) => [w.wo_no, w.product_code, w.machine_code, w.samples, w.ok_rate, w.ng_rate, w.fpy, w.ppm, w.top_defect, w.quality_status]));
  const quick = [
    [tx("Inspection Management"), FactCheckOutlinedIcon, "#1570EF", () => navigate(`/quality-management/inspection-management${keep}`)],
    [tx("Create Plan"), AddIcon, "#12B76A", () => navigate("/quality-management/inspection-management?create=1"), !canEdit],
    [tx("SPC Monitoring"), ShowChartOutlinedIcon, "#7A5AF8", () => navigate(`/quality-management/spc-monitoring${data?.spc ? `?product=${data.spc.product_id}&char=${data.spc.characteristic_id}` : ""}`)],
    [tx("NG Management"), ReportProblemOutlinedIcon, "#F79009", () => navigate(`/quality-management/ng-management${keep}`)],
    [tx("Measuring Equipment"), StraightenOutlinedIcon, "#0E9384", () => navigate("/quality-management/measuring-equipment")],
    [tx("Calibration Schedule"), EventRepeatOutlinedIcon, "#F04438", () => navigate("/quality-management/calibration-management")],
  ];
  const trend = data?.trend || [];
  const base = chartBase(dark, axisColor);
  // control limits when there is enough data, otherwise the spec limits, so the chart always has a frame of reference
  const spc = data?.spc;
  const spcLines = spc ? [["UCL", spc.ucl, "#F04438", 4], ["CL", spc.cl, "#12B76A", 0], ["LCL", spc.lcl, "#F04438", 4], ["USL", spc.usl, "#7A5AF8", 2], ["LSL", spc.lsl, "#7A5AF8", 2]].filter(([, y]) => y != null) : [];
  const spcValues = [...spcLines.map(([, y]) => y), ...(spc?.points || []).map((p) => p.value)];
  const spcPad = spcValues.length ? (Math.max(...spcValues) - Math.min(...spcValues) || 1) * 0.15 : 1;
  const spcRange = spcValues.length ? [Math.min(...spcValues) - spcPad, Math.max(...spcValues) + spcPad] : [0, 1];
  const activeFilters = Object.values(f).filter(Boolean).length;
  const toolbar = (
    <>
      <DateRange from={range.from} to={range.to} onChange={(a, b) => setRange({ from: a, to: b })} />
      <FilterToggle open={showFilter} count={activeFilters} onClick={() => setShowFilter((v) => !v)} />
    </>
  );
  const filters = showFilter ? (
    <>
      <FilterSelect labelText={tx("Shift")} value={f.shift_id} onChange={set("shift_id")} items={(lookups?.shifts || []).map((s) => [s.id, s.name])} width={140} />
      <FilterSelect labelText={tx("Machine")} value={f.machine_id} onChange={set("machine_id")} items={(lookups?.machines || []).map((m) => [m.id, m.code])} width={120} />
      <FilterSelect labelText={tx("Mold")} value={f.mold_id} onChange={set("mold_id")} items={(lookups?.molds || []).map((m) => [m.id, m.code])} width={120} />
      <FilterSelect labelText={tx("Product")} value={f.product_id} onChange={set("product_id")} items={(lookups?.products || []).map((p) => [p.id, `${p.product_code} ${p.product_name}`])} />
      <FilterSelect labelText={tx("Work Order")} value={f.work_order_id} onChange={set("work_order_id")} items={(lookups?.work_orders || []).map((w) => [w.id, w.wo_no])} />
      <FilterSelect labelText={tx("Inspection Type")} value={f.inspection_type} onChange={set("inspection_type")} items={(lookups?.inspection_types || []).map((x) => [x, label("inspectionType", x)])} width={130} />
    </>
  ) : null;
  const cells = { "& .MuiTableCell-root": { px: 0.5 }, "& td:has(> span[title])": { textOverflow: "clip" } };
  const chartBox = { flex: 1, minHeight: 0, px: 1 };

  return (
    <QualityFrame fit page={page} title={tx("Quality Dashboard")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} toolbar={toolbar} filters={filters} system={data?.system}>
      {data ? (
        <>
          <Alert severity={OVERALL_TONE[data.overall]} icon={data.overall === "NORMAL" ? <TaskAltOutlinedIcon fontSize="small" /> : <WarningAmberOutlinedIcon fontSize="small" />}
            sx={{ py: 0, px: 1.5, alignItems: "center", "& .MuiAlert-icon": { py: 0.5, mr: 1 }, "& .MuiAlert-message": { py: 0.5, flex: 1, minWidth: 0 } }}>
            <Stack direction="row" sx={{ gap: 1, alignItems: "center", flexWrap: "wrap" }}>
              <Typography variant="caption" fontWeight={800}>{tx("Quality status")}: {label("overall", data.overall)}</Typography>
              {data.reasons.map((r) => <Chip key={r} size="small" label={label("reason", r)} sx={{ height: 18, fontSize: 10 }} />)}
              <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                {tx("Data up to")}: {tx("inspection")} {ddmmhhmm(data.confidence.last_inspection)} · {tx("production")} {ddmmhhmm(data.confidence.last_production)}
                {data.confidence.flags.length ? ` · ${data.confidence.flags.map((x) => label("confidence", x)).join(" · ")}` : ""}
              </Typography>
            </Stack>
          </Alert>
          <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))", xl: "repeat(6, minmax(0,1fr))" }}>
            <KpiTile tone={k.fpy == null ? "info" : k.fpy >= t.fpy ? "success" : "danger"} title={tx("FPY (First Pass Yield)")} value={k.fpy != null ? num(k.fpy, 2) : EMPTY} unit={k.fpy != null ? "%" : ""}
              sub={<>{tx("Target")} ≥ {num(t.fpy, 2)}% · <Change value={k.fpy_change} unit="%" /></>} icon={TaskAltOutlinedIcon} onClick={() => navigate(`/quality-management/inspection-management${keep}`)} />
            <KpiTile tone={k.ppm == null ? "info" : k.ppm <= t.ppm ? "success" : "danger"} title={tx("PPM (Parts Per Million)")} value={k.ppm != null ? num(k.ppm) : EMPTY}
              sub={<>{tx("Target")} ≤ {num(t.ppm)} · {num(k.reject)}/{num(k.produced)} {tx("pcs")}</>} icon={InsightsOutlinedIcon} onClick={() => navigate(`/quality-management/ng-management${keep}`)} />
            <KpiTile tone={k.ng_rate == null ? "info" : k.ng_rate <= t.ng_rate ? "success" : "warning"} title={tx("NG Rate")} value={k.ng_rate != null ? num(k.ng_rate, 2) : EMPTY} unit={k.ng_rate != null ? "%" : ""}
              sub={<>{tx("Target")} ≤ {num(t.ng_rate, 2)}% · <Change value={k.ng_rate != null && k.ng_rate_prev != null ? k.ng_rate - k.ng_rate_prev : null} unit="%" goodWhenUp={false} /></>}
              icon={WarningAmberOutlinedIcon} onClick={() => navigate(`/quality-management/ng-management${keep}`)} />
            <KpiTile tone="accent" title={tx("Defects")} value={num(k.defects)} sub={<>{k.defect_types} {tx("types")} · {k.defect_events} {tx("events")} · <Change value={k.defects - k.defects_prev} goodWhenUp={false} /></>}
              icon={BugReportOutlinedIcon} onClick={() => navigate(`/quality-management/ng-management${keep}`)} />
            <KpiTile tone={k.wo_ng ? "danger" : "success"} title={tx("Work Orders with NG")} value={num(k.wo_ng)} sub={<>{tx("vs previous period")}: <Change value={k.wo_ng - k.wo_ng_prev} goodWhenUp={false} /></>}
              icon={ListAltOutlinedIcon} onClick={() => navigate(`/quality-management/inspection-management${keep}`)} />
            <KpiTile tone={k.machines_alert ? "warning" : "info"} title={tx("Machines with Quality Alert")} value={`${k.machines_alert}/${k.machines_running}`} sub={tx("machines running")}
              icon={PrecisionManufacturingOutlinedIcon} onClick={() => navigate("/machine-equipment/machine-monitoring")} />
          </KpiCardGroup>

          <Box sx={{ flex: { lg: "1 1 0" }, minHeight: 0, display: "grid", gap: 1,
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" }, gridTemplateRows: { lg: "repeat(3, minmax(0,1fr))" } }}>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 3" } }}>
              <Head title={tx("FPY & PPM Trend")} action={<Stack direction="row" spacing={1.5}><Dot color="#1570EF" text="FPY (%)" /><Dot color="#12B76A" text="PPM" /></Stack>} />
              <Box sx={chartBox}>
                <Chart type="line" height="100%" series={[{ name: "FPY (%)", type: "line", data: trend.map((x) => x.fpy) }, { name: "PPM", type: "column", data: trend.map((x) => x.ppm) }]} options={{
                  ...base, colors: ["#1570EF", "#12B76A"], stroke: { width: [2, 0], curve: "straight" }, markers: { size: [4, 0] }, plotOptions: { bar: { columnWidth: "38%", borderRadius: 2 } },
                  xaxis: { ...base.xaxis, tickPlacement: "between", categories: trend.map((x) => dateText(x.date).slice(0, 5)) },
                  yaxis: [{ min: (m) => Math.max(0, Math.floor(Math.min(m, t.fpy) - 2)), max: 100, labels: { ...base.yaxis.labels, formatter: (v) => (v == null ? "" : `${num(v, 0)}%`) } },
                    { opposite: true, min: 0, labels: { ...base.yaxis.labels, formatter: (v) => (v == null ? "" : num(v, 0)) } }],
                  annotations: { yaxis: [{ y: t.fpy, borderColor: "#1570EF", strokeDashArray: 4, label: { position: "left", textAnchor: "start", offsetX: 4, text: `${tx("Target")} ${t.fpy}%`, style: { fontSize: "10px", color: "#fff", background: "#1570EF" } } }] },
                  tooltip: { ...base.tooltip, shared: true,
                    custom: ({ dataPointIndex }) => { const x = trend[dataPointIndex]; return x ? `<div style="padding:6px 8px;font-size:11px"><b>${dateText(x.date)}</b><br/>FPY: ${x.fpy ?? "—"}%<br/>PPM: ${x.ppm ?? "—"}<br/>${tx("Samples")}: ${x.samples} · NG: ${x.ng}<br/>${tx("Produced")}: ${num(x.produced)} · ${tx("Reject")}: ${num(x.reject)}</div>` : ""; } } }} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={panelSx}>
              <Head title={tx("Inspection Performance by Shift")} action={<Stack direction="row" spacing={1.5}><Dot color="#1570EF" text="OK" /><Dot color="#F04438" text="NG" /></Stack>} />
              {data.shifts.length ? (
                <Box sx={chartBox}>
                  <Chart type="bar" height="100%" series={[{ name: "OK (%)", data: data.shifts.map((s) => s.ok_rate) }, { name: "NG (%)", data: data.shifts.map((s) => s.ng_rate) }]} options={{
                    ...base, colors: ["#1570EF", "#F04438"], plotOptions: { bar: { horizontal: true, barHeight: "62%", borderRadius: 2 } },
                    dataLabels: { enabled: true, formatter: (v) => (v ? `${num(v, 1)}%` : ""), style: { fontSize: "10px" } },
                    xaxis: { ...base.xaxis, categories: data.shifts.map((s) => s.name), max: 100, min: 0, tickAmount: 4, labels: { ...base.xaxis.labels, formatter: (v) => `${num(v, 0)}%` } },
                    yaxis: { labels: { ...base.yaxis.labels, maxWidth: 110 } },
                    tooltip: { ...base.tooltip, y: { formatter: (v, o) => `${v == null ? "—" : `${num(v, 2)}%`} · ${data.shifts[o.dataPointIndex]?.samples || 0} ${tx("samples")}` } } }} />
                </Box>
              ) : <EmptyBody />}
            </Paper>
            <Paper elevation={0} sx={panelSx}>
              <Head title={tx("Top 5 Defects")} />
              {data.top_defects.length ? (
                <Box sx={chartBox}>
                  <Chart type="bar" height="100%" series={[{ name: tx("Qty"), data: data.top_defects.map((d) => d.qty) }]} options={{
                    ...base, chart: { ...base.chart, events: { dataPointSelection: (e, c, cfg) => { const d = data.top_defects[cfg.dataPointIndex]; if (d) navigate(`/quality-management/ng-management${qsOf({ date_from: range.from, date_to: range.to, defect: d.defect_code_id })}`); } } },
                    plotOptions: { bar: { horizontal: true, barHeight: "55%", borderRadius: 3 } }, colors: ["#1570EF"],
                    dataLabels: { enabled: true, formatter: (v, o) => `${v} (${data.top_defects[o.dataPointIndex].share}%)`, style: { fontSize: "10px" } },
                    xaxis: { ...base.xaxis, categories: data.top_defects.map((d) => d.name) } }} />
                </Box>
              ) : <EmptyBody />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 3" } }}>
              <Head title={tx("Quality by Work Order")} action={<Typography variant="caption" sx={{ color: "#1570EF", cursor: "pointer" }} onClick={() => navigate(`/quality-management/inspection-management${keep}`)}>{tx("View details")}</Typography>} />
              {data.work_orders.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cells, ...colShares(14, 16, 10, 10, 8, 8, 8, 12, 14) }}>
                    <TableHead><TableRow><TableCell>{tx("Work Order")}</TableCell><TableCell>{tx("Product")}</TableCell><TableCell>{tx("Machine")}</TableCell><TableCell align="right">{tx("Inspected")}</TableCell>
                      <TableCell align="right">OK %</TableCell><TableCell align="right">NG %</TableCell><TableCell align="right">PPM</TableCell><TableCell>{tx("Top defect")}</TableCell><TableCell align="center">{tx("Status")}</TableCell></TableRow></TableHead>
                    <TableBody>{data.work_orders.map((w) => (
                      <TableRow key={w.work_order_id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/quality-management/inspection-management?wo=${w.work_order_id}&date_from=${range.from}&date_to=${range.to}`)}>
                        <TableCell sx={{ fontWeight: 700, color: "#1570EF" }}>{w.wo_no}</TableCell><TableCell title={w.product_name}>{w.product_name}</TableCell><TableCell>{w.machine_code || EMPTY}</TableCell>
                        <TableCell align="right">{num(w.samples)}</TableCell><TableCell align="right">{pctText(w.ok_rate)}</TableCell>
                        <TableCell align="right" sx={{ color: w.ng_rate >= t.wo_attention ? "#F04438" : undefined, fontWeight: 700 }}>{pctText(w.ng_rate)}</TableCell>
                        <TableCell align="right">{num(w.ppm)}</TableCell><TableCell title={w.top_defect || ""}>{w.top_defect || EMPTY}</TableCell><TableCell align="center"><QStatusPill value={w.quality_status} /></TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody text={tx("No inspection data in the period.")} />}
            </Paper>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "3 / 5" } }}>
              <Head title={data.spc ? `${tx("SPC Monitoring – Key Characteristics")}: ${data.spc.name} (${data.spc.unit || "-"}) · ${data.spc.product_code} · Cpk ${data.spc.cpk ?? EMPTY}` : tx("SPC Monitoring – Key Characteristics")}
                action={data.spc ? <SpcStatusPill value={data.spc.status} /> : null} />
              {data.spc ? (
                <Box sx={{ ...chartBox, cursor: "pointer" }} onClick={() => navigate(`/quality-management/spc-monitoring?product=${data.spc.product_id}&char=${data.spc.characteristic_id}`)}>
                  <Chart type="line" height="100%" series={[{ name: tx("Measured"), data: data.spc.points.map((p) => p.value) }]} options={{
                    ...base, chart: { ...base.chart, animations: { enabled: false } }, colors: ["#1570EF"], stroke: { width: 2 },
                    markers: { size: 3, discrete: data.spc.points.map((p, i) => (p.violation ? { seriesIndex: 0, dataPointIndex: i, fillColor: "#F04438", strokeColor: "#F04438", size: 5 } : null)).filter(Boolean) },
                    xaxis: { ...base.xaxis, categories: data.spc.points.map((p) => String(p.time).slice(11, 16)) },
                    yaxis: { min: spcRange[0], max: spcRange[1], tickAmount: 4, labels: { ...base.yaxis.labels, formatter: (v) => num(v, 3) } },
                    annotations: { yaxis: spcLines.map(([name, y, color, dash]) => ({ y, borderColor: color, strokeDashArray: dash, label: { text: `${name} ${y}`, style: { fontSize: "10px", color: "#fff", background: color } } })) } }} />
                </Box>
              ) : <EmptyBody text={tx("No SPC characteristic is configured in the Quality Standard.")} />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 3" } }}>
              <Head title={tx("Quality Alerts")} action={<Typography variant="caption" color="text.secondary">{k.open_alerts} {tx("open")}</Typography>} />
              {data.alerts.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cells, ...colShares(12, 52, 16, 20) }}>
                    <TableHead><TableRow><TableCell>{tx("Time")}</TableCell><TableCell>{tx("Alert")}</TableCell><TableCell align="center">{tx("Severity")}</TableCell><TableCell align="center">{tx("Status")}</TableCell></TableRow></TableHead>
                    <TableBody>{data.alerts.map((a) => (
                      <TableRow key={a.id} hover sx={{ cursor: "pointer", opacity: ["RESOLVED", "CLOSED"].includes(a.status) ? 0.6 : 1 }} onClick={() => setAlert(a)}>
                        <TableCell>{ddmmhhmm(a.raised_at)}</TableCell><TableCell title={a.message || alertText(a)}>{alertText(a)}</TableCell>
                        <TableCell align="center"><SeverityPill value={a.severity} /></TableCell><TableCell align="center"><AlertStatusPill value={a.status} /></TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody />}
            </Paper>
            <Paper elevation={0} sx={panelSx}>
              <Head title={tx("Machine Quality Risk")} />
              {data.machines.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cells, ...colShares(20, 14, 15, 22, 29) }}>
                    <TableHead><TableRow><TableCell>{tx("Machine")}</TableCell><TableCell align="right">NG %</TableCell><TableCell align="right">PPM</TableCell><TableCell>{tx("Top defect")}</TableCell><TableCell align="center">{tx("Status")}</TableCell></TableRow></TableHead>
                    <TableBody>{data.machines.map((m) => (
                      <TableRow key={m.machine_id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/machine-equipment/machine-detail?machine=${m.machine_id}`)}>
                        <TableCell title={[m.wo_no, m.mold_code].filter(Boolean).join(" · ")} sx={{ fontWeight: 800, color: "#1570EF" }}>{m.machine_code}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: QSTATUS_COLORS[m.quality_status] }}>{pctText(m.ng_rate)}</TableCell><TableCell align="right">{num(m.ppm)}</TableCell>
                        <TableCell title={m.top_defect || ""}>{m.top_defect || EMPTY}</TableCell><TableCell align="center"><QStatusPill value={m.quality_status} /></TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody />}
            </Paper>
            <Box sx={{ display: "flex", minHeight: 0, "& > *": { flex: 1 } }}>
              <QuickCard actions={quick} columns={3} />
            </Box>
          </Box>
          {alert ? <AlertDialog alert={alert} lookups={lookups} request={request} actor={actor} notify={notify} canEdit={canEdit} navigate={navigate} onClose={() => setAlert(null)} onChanged={() => load({ silent: true })} /> : null}
        </>
      ) : null}
    </QualityFrame>
  );
}

