import "./locales";
import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { Box, InputAdornment, LinearProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined";

import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, colShares, downloadExcel } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, ddmmhhmm, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { label, tx } from "../qualityLocales";
import { InspectionDialog, PlanCreateDialog } from "../qualityDialogs";
import { DateRange, DonutCard, EmptyBody, FilterSelect, FilterToggle, QualityFrame, QuickCard, chartBase, fillSx, panelSx, qsOf, todayIso, useQualityData, useQualityPage, who } from "../qualityPage";
import { Change, PROCESS_COLORS, PlanStatusPill, QUALITY_API, ResultText, TypePill, changeOf, pctText, relChange } from "../qualityUi";

export default function InspectionManagement() {
  const page = useQualityPage();
  const { navigate, params, setParams, dark, axisColor, tableSx, canEdit, lookups, request, actor, notify } = page;
  const [range, setRange] = useState({ from: params.get("date_from") || todayIso(), to: params.get("date_to") || todayIso() });
  const [f, setF] = useState({ work_order_id: params.get("wo") || params.get("work_order_id") || "", product_id: params.get("product_id") || "", inspection_type: params.get("type") || "", process: "",
    machine_id: params.get("machine_id") || "", mold_id: "", status: params.get("status") || "" });
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const url = `${QUALITY_API}/inspections${qsOf({ date_from: range.from, date_to: range.to, ...f, search })}`;
  const { data, loading, lastUpdate, live, setLive, load } = useQualityData(page, url, { interval: 30000, paused: Boolean(dialog) });
  const set = (key) => (v) => setF((o) => ({ ...o, [key]: v }));
  useEffect(() => {
    const plan = Number(params.get("plan"));
    if (plan) setDialog({ type: "plan", id: plan });
    else if (params.get("create")) setDialog({ type: "create", preset: { inspection_type: params.get("type") || "IPQC", work_order_id: Number(params.get("wo")) || "" } });
  }, [params]);
  const closeDialog = () => {
    setDialog(null);
    if (params.get("plan") || params.get("create")) { const p = new URLSearchParams(params); p.delete("plan"); p.delete("create"); setParams(p, { replace: true }); }
  };
  const k = data?.kpis || {};
  const base = chartBase(dark, axisColor);
  const plans = data?.plans || [];
  const firstOpen = plans.find((p) => ["NOT_STARTED", "IN_PROGRESS", "OVERDUE"].includes(p.display_status));
  const exportCsv = () => downloadExcel(`inspection-plans-${range.from}_${range.to}.csv`, ["Plan No.", "Type", "Work Order", "Product", "Lot", "Process", "Frequency", "Sample", "Done", "OK %", "NG %", "Status", "Planned", "Inspector"],
    plans.map((p) => [p.plan_no, p.inspection_type, p.wo_no, p.product_code, p.lot_no, p.process, p.frequency_type === "TIME" ? `${p.frequency_value} min` : p.frequency_type,
      p.sample_size, p.done_qty, p.ok_rate, p.ng_rate, p.display_status, p.planned_at, p.inspector]));
  const quick = [
    [tx("Create Plan"), AddIcon, "#1570EF", () => setDialog({ type: "create", preset: {} }), !canEdit],
    [tx("Perform Inspection"), PlayCircleOutlineIcon, "#12B76A", () => (firstOpen ? setDialog({ type: "plan", id: firstOpen.id }) : notify("info", tx("No open inspection plan."))), !canEdit],
    [tx("Inspection History"), HistoryOutlinedIcon, "#667085", () => { setF((o) => ({ ...o, status: "COMPLETED" })); setRange({ from: new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10), to: todayIso() }); }],
    [tx("SPC Monitoring"), ShowChartOutlinedIcon, "#F79009", () => navigate(`/quality-management/spc-monitoring${f.work_order_id ? `?wo=${f.work_order_id}` : f.product_id ? `?product=${f.product_id}` : "?product=1"}`)],
    [tx("NG Management"), ReportProblemOutlinedIcon, "#F04438", () => navigate(`/quality-management/ng-management${qsOf({ date_from: range.from, date_to: range.to, wo: f.work_order_id })}`)],
    [tx("Measuring Equipment"), StraightenOutlinedIcon, "#7A5AF8", () => navigate("/quality-management/measuring-equipment")],
  ];
  const vsY = (a, b, unit = "", goodWhenUp = true) => <><span>{tx("vs yesterday")} </span><Change value={unit ? changeOf(a, b) : relChange(a, b)} unit={unit || "%"} goodWhenUp={goodWhenUp} /></>;
  const activeFilters = Object.values(f).filter(Boolean).length + (search ? 1 : 0);
  const toolbar = (
    <>
      <DateRange from={range.from} to={range.to} onChange={(a, b) => setRange({ from: a, to: b })} />
      <FilterToggle open={showFilter} count={activeFilters} onClick={() => setShowFilter((v) => !v)} />
    </>
  );
  const filters = showFilter && data ? (
    <>
      <TextField size="small" placeholder={tx("Search plan, work order, product, lot...")} value={search} onChange={(e) => setSearch(e.target.value)} sx={{ width: 240 }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
      <FilterSelect labelText={tx("Work Order")} value={f.work_order_id} onChange={set("work_order_id")} items={(lookups?.work_orders || []).map((w) => [w.id, w.wo_no])} />
      <FilterSelect labelText={tx("Product")} value={f.product_id} onChange={set("product_id")} items={(lookups?.products || []).map((p) => [p.id, `${p.product_code} ${p.product_name}`])} />
      <FilterSelect labelText={tx("Inspection Type")} value={f.inspection_type} onChange={set("inspection_type")} items={(lookups?.inspection_types || []).map((x) => [x, label("inspectionType", x)])} width={130} />
      <FilterSelect labelText={tx("Process")} value={f.process} onChange={set("process")} items={(lookups?.processes || []).map((x) => [x, label("process", x)])} width={130} />
      <FilterSelect labelText={tx("Machine")} value={f.machine_id} onChange={set("machine_id")} items={(lookups?.machines || []).map((m) => [m.id, m.code])} width={120} />
      <FilterSelect labelText={tx("Mold")} value={f.mold_id} onChange={set("mold_id")} items={(lookups?.molds || []).map((m) => [m.id, m.code])} width={120} />
      <FilterSelect labelText={tx("Status")} value={f.status} onChange={set("status")} width={160}
        items={["NOT_STARTED", "IN_PROGRESS", "OVERDUE", "COMPLETED", "CANCELLED"].map((s) => [s, `${label("planStatus", s)} (${data.counts[s] || 0})`])} />
    </>
  ) : null;
  const pillCells = { "& .MuiTableCell-root": { px: 0.5 }, "& td:has(> span[title])": { textOverflow: "clip" } };

  return (
    <QualityFrame fit page={page} title={tx("Inspection Management")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} toolbar={toolbar} filters={filters} system={data?.system}>
      {data ? (
        <>
          <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))", xl: "repeat(6, minmax(0,1fr))" }}>
            <KpiTile tone="primary" title={tx("Total Inspection Plans")} value={num(k.total)} unit={tx("plans")} sub={vsY(k.total, k.y_total)} icon={FactCheckOutlinedIcon} onClick={() => set("status")("")} />
            <KpiTile tone="success" title={tx("Completed")} value={num(k.completed)} unit={tx("plans")} sub={vsY(k.completed, k.y_completed)} icon={CheckCircleOutlineIcon} onClick={() => set("status")("COMPLETED")} />
            <KpiTile tone="warning" title={tx("In Progress")} value={num(k.in_progress)} unit={tx("plans")} sub={k.overdue ? `${k.overdue} ${tx("overdue")}` : tx("on time")} icon={HourglassEmptyOutlinedIcon} onClick={() => set("status")("IN_PROGRESS")} />
            <KpiTile tone="accent" title={tx("Not Started")} value={num(k.not_started)} unit={tx("plans")} sub={k.overdue ? <span style={{ color: "#F04438", fontWeight: 700 }}>{k.overdue} {tx("overdue")}</span> : tx("none overdue")}
              icon={CancelOutlinedIcon} onClick={() => set("status")(k.overdue ? "OVERDUE" : "NOT_STARTED")} />
            <KpiTile tone="danger" title={tx("OK Rate")} value={k.ok_rate != null ? num(k.ok_rate, 2) : EMPTY} unit={k.ok_rate != null ? "%" : ""} sub={vsY(k.ok_rate, k.y_ok_rate, "%")} icon={AssignmentTurnedInOutlinedIcon} />
            <KpiTile tone="info" title={tx("NG Rate")} value={k.ng_rate != null ? num(k.ng_rate, 2) : EMPTY} unit={k.ng_rate != null ? "%" : ""} sub={vsY(k.ng_rate, k.y_ng_rate, "%", false)} icon={ReportProblemOutlinedIcon}
              onClick={() => navigate(`/quality-management/ng-management${qsOf({ date_from: range.from, date_to: range.to })}`)} />
          </KpiCardGroup>

          <Box sx={{ flex: { lg: "1 1 0" }, minHeight: 0, display: "grid", gap: 1,
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" },
            gridTemplateRows: { lg: "minmax(0,1fr) minmax(0,1fr) 216px" } }}>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 4" }, gridRow: { lg: "1 / 3" }, minHeight: { xs: 360, lg: 0 } }}>
              <Head title={tx("Inspection Plan List")} action={<Typography variant="caption" color="text.secondary">{plans.length} {tx("rows")}</Typography>} />
              {plans.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...pillCells, ...colShares(10, 9.5, 9.5, 7.5, 7.5, 7.5, 7.5, 7.5, 5.5, 5.5, 12, 11) }}>
                    <TableHead><TableRow><TableCell>{tx("Plan No.")}</TableCell><TableCell>{tx("Work Order")}</TableCell><TableCell>{tx("Product")}</TableCell><TableCell align="center">{tx("Type")}</TableCell>
                      <TableCell>{tx("Process")}</TableCell><TableCell>{tx("Frequency")}</TableCell><TableCell>{tx("Planned")}</TableCell>
                      <TableCell>{tx("Progress")}</TableCell><TableCell align="right">OK %</TableCell><TableCell align="right">NG %</TableCell><TableCell>{tx("Inspector")}</TableCell><TableCell align="center">{tx("Status")}</TableCell></TableRow></TableHead>
                    <TableBody>{plans.map((p) => (
                      <TableRow key={p.id} hover sx={{ cursor: "pointer" }} onClick={() => setDialog({ type: "plan", id: p.id })}>
                        <TableCell sx={{ fontWeight: 700, color: "#1570EF" }}>{p.plan_no}</TableCell><TableCell>{p.wo_no || EMPTY}</TableCell>
                        <TableCell title={p.product_name || p.lot_no || ""}>{p.product_name || (p.lot_no ? `${p.lot_no} · ${p.material_code || ""}` : EMPTY)}</TableCell>
                        <TableCell align="center"><TypePill value={p.inspection_type} /></TableCell><TableCell>{label("process", p.process)}</TableCell>
                        <TableCell>{p.frequency_type === "TIME" ? `${tx("every")} ${p.frequency_value} ${tx("min")}` : label("frequency", p.frequency_type)}</TableCell>
                        <TableCell sx={{ color: p.display_status === "OVERDUE" ? "#F04438" : undefined }}>{ddmmhhmm(p.planned_at)}</TableCell>
                        <TableCell><Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                          <LinearProgress variant="determinate" value={Math.min(100, (p.done_qty / p.sample_size) * 100)} sx={{ flex: 1, height: 6, borderRadius: 3 }} color={p.ng_qty ? "error" : "primary"} />
                          <Typography variant="caption">{p.done_qty}/{p.sample_size}</Typography></Stack></TableCell>
                        <TableCell align="right">{pctText(p.ok_rate)}</TableCell><TableCell align="right" sx={{ color: p.ng_qty ? "#F04438" : undefined, fontWeight: p.ng_qty ? 700 : 400 }}>{pctText(p.ng_rate)}</TableCell>
                        <TableCell title={who(p.inspector)}>{who(p.inspector)}</TableCell>
                        <TableCell align="center"><PlanStatusPill value={p.display_status} /></TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "4" }, gridRow: { lg: "1" } }}>
              <Head title={tx("Inspection Result Overview")} />
              <Box sx={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center" }}>
                {k.ok || k.ng ? (
                  <Box sx={{ width: "100%" }}>
                    <DonutCard entries={[["OK", k.ok || 0, "OK"], ["NG", k.ng || 0, "NG"]].filter(([, n]) => n)} colors={{ OK: "#12B76A", NG: "#F04438" }} dark={dark} axisColor={axisColor} height={150} size={140} centerLabel={tx("samples")} />
                  </Box>
                ) : <EmptyBody />}
              </Box>
            </Paper>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "4" }, gridRow: { lg: "2" } }}>
              <Head title={tx("NG Rate by Process")} />
              {data.by_process.length ? (
                <Box sx={{ flex: 1, minHeight: 0, px: 1 }}>
                  <Chart type="bar" height="100%" series={[{ name: "NG %", data: data.by_process.map((x) => x.ng_rate ?? 0) }]} options={{
                    ...base, plotOptions: { bar: { horizontal: true, barHeight: "46%", borderRadius: 3, distributed: true } },
                    colors: data.by_process.map((x) => PROCESS_COLORS[x.process] || "#F04438"),
                    dataLabels: { enabled: true, formatter: (v) => `${num(v, 2)}%`, style: { fontSize: "10px" } },
                    xaxis: { ...base.xaxis, categories: data.by_process.map((x) => label("process", x.process)), labels: { ...base.xaxis.labels, formatter: (v) => `${num(v, 1)}%` } },
                    tooltip: { ...base.tooltip, y: { formatter: (v, o) => `${num(v, 2)}% · ${data.by_process[o.dataPointIndex].ng}/${data.by_process[o.dataPointIndex].samples}` } } }} />
                </Box>
              ) : <EmptyBody />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "1" }, gridRow: { lg: "3" } }}>
              <Head title={tx("Result by Inspection Type")} />
              {data.by_type.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...pillCells, ...colShares(22, 17, 15, 13, 17, 16) }}>
                    <TableHead><TableRow><TableCell>{tx("Type")}</TableCell><TableCell align="right">{tx("Samples")}</TableCell><TableCell align="right">OK</TableCell><TableCell align="right">NG</TableCell>
                      <TableCell align="right">OK %</TableCell><TableCell align="right">NG %</TableCell></TableRow></TableHead>
                    <TableBody>{data.by_type.map((x) => (
                      <TableRow key={x.type} hover sx={{ cursor: "pointer" }} onClick={() => set("inspection_type")(x.type)}>
                        <TableCell sx={{ fontWeight: 700 }}>{label("inspectionType", x.type)}</TableCell><TableCell align="right">{num(x.samples)}</TableCell><TableCell align="right">{num(x.ok)}</TableCell>
                        <TableCell align="right">{num(x.ng)}</TableCell><TableCell align="right" sx={{ color: "#12B76A", fontWeight: 700 }}>{pctText(x.ok_rate)}</TableCell>
                        <TableCell align="right" sx={{ color: x.ng ? "#F04438" : undefined, fontWeight: 700 }}>{pctText(x.ng_rate)}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody />}
            </Paper>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "2" }, gridRow: { lg: "3" } }}>
              <Head title={tx("Top 5 Defects")} action={<Typography variant="caption" sx={{ color: "#1570EF", cursor: "pointer" }} onClick={() => navigate(`/quality-management/ng-management${qsOf({ date_from: range.from, date_to: range.to })}`)}>{tx("View all defects")}</Typography>} />
              {data.top_defects.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...pillCells, ...colShares(20, 40, 13, 15, 12) }}>
                    <TableHead><TableRow><TableCell>{tx("Code")}</TableCell><TableCell>{tx("Defect")}</TableCell><TableCell align="right">{tx("Qty")}</TableCell><TableCell align="right">%</TableCell><TableCell align="center">{tx("Trend")}</TableCell></TableRow></TableHead>
                    <TableBody>{data.top_defects.map((d) => (
                      <TableRow key={d.id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/quality-management/ng-management${qsOf({ date_from: range.from, date_to: range.to, defect: d.id })}`)}>
                        <TableCell>{d.code}</TableCell><TableCell sx={{ fontWeight: 700 }} title={d.name}>{d.name}</TableCell><TableCell align="right">{d.qty}</TableCell><TableCell align="right">{num(d.share, 1)}%</TableCell>
                        <TableCell align="center" sx={{ color: d.qty > d.prev ? "#F04438" : d.qty < d.prev ? "#12B76A" : "text.secondary", fontWeight: 800 }} title={`${tx("previous period")}: ${d.prev}`}>
                          {d.qty > d.prev ? "▲" : d.qty < d.prev ? "▼" : "="}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody text={tx("No NG sample in the period.")} />}
            </Paper>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "3" }, gridRow: { lg: "3" } }}>
              <Head title={tx("Recent Inspection History")} />
              {data.recent.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...pillCells, ...colShares(18, 27, 15, 40) }}>
                    <TableHead><TableRow><TableCell>{tx("Time")}</TableCell><TableCell>{tx("Plan No.")}</TableCell><TableCell align="center">{tx("Result")}</TableCell><TableCell>{tx("Inspector")}</TableCell></TableRow></TableHead>
                    <TableBody>{data.recent.map((p) => (
                      <TableRow key={p.id} hover sx={{ cursor: "pointer" }} onClick={() => setDialog({ type: "plan", id: p.id })}>
                        <TableCell>{ddmmhhmm(p.completed_at)}</TableCell><TableCell sx={{ color: "#1570EF", fontWeight: 700 }} title={`${label("inspectionType", p.inspection_type)} · ${p.wo_no || ""} · ${p.product_name || p.lot_no || ""}`}>{p.plan_no}</TableCell>
                        <TableCell align="center"><ResultText value={p.result} /></TableCell><TableCell title={who(p.inspector)}>{who(p.inspector)}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody />}
            </Paper>
            <Box sx={{ gridColumn: { lg: "4" }, gridRow: { lg: "3" }, display: "flex", minHeight: 0, "& > *": { flex: 1 } }}>
              <QuickCard actions={quick} columns={3} />
            </Box>
          </Box>
        </>
      ) : null}
      {dialog?.type === "create" ? <PlanCreateDialog lookups={lookups} preset={dialog.preset} request={request} actor={actor} notify={notify} onClose={closeDialog}
        onSaved={(r) => { load({ silent: true }); setDialog({ type: "plan", id: r.id }); }} /> : null}
      {dialog?.type === "plan" ? <InspectionDialog planId={dialog.id} lookups={lookups} request={request} actor={actor} notify={notify} canEdit={canEdit} navigate={navigate}
        onClose={closeDialog} onChanged={() => load({ silent: true })} /> : null}
    </QualityFrame>
  );
}
