import "./locales";
import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { Box, InputAdornment, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import ReportGmailerrorredOutlinedIcon from "@mui/icons-material/ReportGmailerrorredOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import SearchIcon from "@mui/icons-material/Search";
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { resolveImageUrl } from "../../../components/common/ImageUploadField";
import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, colShares, downloadExcel } from "../../MaterialManagement/materialUi";
import { Dot, EMPTY, Head, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { label, tx } from "../qualityLocales";
import { CalCreateDialog, CalDetailDialog } from "../qualityDialogs";
import { DateRange, DonutCard, EmptyBody, FilterSelect, FilterToggle, GaugeChart, QualityFrame, QuickCard, chartBase, fillSx, monthEndIso, monthStartIso, panelSx, qsOf, txs, useQualityData, useQualityPage, who } from "../qualityPage";
import { CAL_STATUS_COLORS, CalStatusPill, PriorityPill, QUALITY_API, ResultText, dateText } from "../qualityUi";

export default function CalibrationManagement() {
  const page = useQualityPage();
  const { navigate, params, setParams, dark, axisColor, tableSx, canEdit, lookups, request, actor, notify } = page;
  const [range, setRange] = useState({ from: monthStartIso(), to: monthEndIso() });
  const [f, setF] = useState({ status: params.get("status") || "", type_id: "", location: "", lab: "", owner: "" });
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const url = `${QUALITY_API}/calibration${qsOf({ date_from: range.from, date_to: range.to, ...f, search })}`;
  const { data, loading, lastUpdate, live, setLive, load } = useQualityData(page, url, { interval: 60000, paused: Boolean(dialog) });
  const set = (key) => (v) => setF((o) => ({ ...o, [key]: v }));
  useEffect(() => {
    const id = Number(params.get("plan"));
    if (id) { setSelected(id); setDialog({ type: "plan", id }); } else if (params.get("create")) setDialog({ type: "create", preset: { equipment_id: Number(params.get("equipment")) || "" } });
  }, [params]);
  const closeDialog = () => {
    setDialog(null);
    if (params.get("plan") || params.get("create")) { const p = new URLSearchParams(params); p.delete("plan"); p.delete("create"); setParams(p, { replace: true }); }
  };
  const k = data?.kpis || {};
  const plans = data?.plans || [];
  const sel = plans.find((p) => p.id === selected);
  const need = (fn) => () => (sel ? fn(sel) : notify("info", tx("Select a row in the list.")));
  const exportCsv = () => downloadExcel(`calibration-plans-${range.from}_${range.to}.csv`, ["Plan No.", "Equipment", "Model", "Serial", "Type", "Location", "Lab", "Last calibration", "Planned", "Status", "Priority", "Owner", "Result", "Certificate"],
    plans.map((p) => [p.plan_no, p.equipment_code, p.model, p.serial_number, p.type_name, p.location, p.lab, p.last_calibration_date, p.planned_date, p.display_status, p.priority, p.owner, p.result, p.certificate_no]));
  const quick = [
    [tx("Create Plan"), AddIcon, "#1570EF", () => setDialog({ type: "create", preset: {} }), !canEdit],
    [tx("View detail"), VisibilityOutlinedIcon, "#2E90FA", need((p) => setDialog({ type: "plan", id: p.id })), !sel],
    [tx("Calibration History"), HistoryOutlinedIcon, "#0E9384", need((p) => navigate(`/quality-management/measuring-equipment?equipment=${p.equipment_id}`)), !sel],
    [tx("Measuring Equipment"), StraightenOutlinedIcon, "#7A5AF8", () => navigate("/quality-management/measuring-equipment")],
    [tx("Inspection Management"), FactCheckOutlinedIcon, "#12B76A", () => navigate("/quality-management/inspection-management")],
    [txs("Quality overview (short)", "Quality Dashboard"), InsightsOutlinedIcon, "#F79009", () => navigate("/quality-management/dashboard")],
  ];
  const donut = data ? Object.entries(data.donut).filter(([, n]) => n).map(([s, n]) => [s, n, label("calStatus", s)]) : [];
  const activeFilters = Object.values(f).filter(Boolean).length + (search ? 1 : 0);
  const base = chartBase(dark, axisColor);
  const toolbar = (
    <>
      <DateRange from={range.from} to={range.to} onChange={(a, b) => setRange({ from: a, to: b })} />
      <FilterToggle open={showFilter} count={activeFilters} onClick={() => setShowFilter((v) => !v)} />
    </>
  );
  const filters = showFilter ? (
    <>
      <TextField size="small" placeholder={tx("Search plan, equipment, model, serial...")} value={search} onChange={(e) => setSearch(e.target.value)} sx={{ width: 240 }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
      <FilterSelect labelText={tx("Status")} value={f.status} onChange={set("status")} items={["PLANNED", "DUE_SOON", "IN_PROGRESS", "OVERDUE", "COMPLETED", "CANCELLED"].map((s) => [s, label("calStatus", s)])} width={150} />
      <FilterSelect labelText={tx("Equipment type")} value={f.type_id} onChange={set("type_id")} items={(lookups?.equipment_types || []).map((t) => [t.id, t.type_name])} width={160} />
      <FilterSelect labelText={tx("Usage location")} value={f.location} onChange={set("location")} items={(lookups?.locations || []).map((l) => [l, l])} width={170} />
      <FilterSelect labelText={tx("Calibration lab")} value={f.lab} onChange={set("lab")} items={(lookups?.labs || []).map((l) => [l, l])} width={150} />
      <FilterSelect labelText={tx("Owner")} value={f.owner} onChange={set("owner")} items={(lookups?.inspectors || []).map((p) => [p, who(p)])} width={160} />
    </>
  ) : null;
  const cells = { "& .MuiTableCell-root": { px: 0.5 }, "& td:has(> span[title])": { textOverflow: "clip" } };

  return (
    <QualityFrame fit page={page} title={tx("Calibration Management")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} toolbar={toolbar} filters={filters} system={data?.system}>
      {data ? (
        <>
          <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))", xl: "repeat(6, minmax(0,1fr))" }}>
            <KpiTile tone="primary" title={tx("Total Plans")} value={num(k.total)} sub={`${dateText(data.range.from)} – ${dateText(data.range.to)}`} icon={EventRepeatOutlinedIcon} onClick={() => set("status")("")} />
            <KpiTile tone="success" title={tx("Completed")} value={num(k.completed)} sub={tx("certificate recorded")} icon={CheckCircleOutlineIcon} onClick={() => set("status")("COMPLETED")} />
            <KpiTile tone="warning" title={tx("In Progress")} value={num(k.in_progress)} sub={tx("sent / calibrating")} icon={HourglassEmptyOutlinedIcon} onClick={() => set("status")("IN_PROGRESS")} />
            <KpiTile tone="danger" title={tx("Overdue")} value={num(k.overdue)} sub={tx("past the planned date")} icon={ReportGmailerrorredOutlinedIcon} onClick={() => set("status")("OVERDUE")} />
            <KpiTile tone="accent" title={tx("Due Soon (≤ {n} days)", { n: data.due_days })} value={num(k.due_soon)} sub={tx("to schedule first")} icon={ScheduleOutlinedIcon} onClick={() => set("status")("DUE_SOON")} />
            <KpiTile tone="info" title={tx("Compliance Rate")} value={k.compliance != null ? num(k.compliance, 1) : EMPTY} unit={k.compliance != null ? "%" : ""}
              sub={`${k.compliance_on_time}/${k.compliance_due} ${tx("on time")} · ${tx("Target")} ≥ ${data.target}%`} icon={VerifiedUserOutlinedIcon} />
          </KpiCardGroup>

          <Box sx={{ flex: { lg: "1 1 0" }, minHeight: 0, display: "grid", gap: 1,
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" }, gridTemplateRows: { lg: "minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)" } }}>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 4" }, gridRow: { lg: "1 / 3" }, minHeight: { xs: 360, lg: 0 } }}>
              <Head title={tx("Calibration Plan List")} action={(
                <Typography variant="caption" color={sel ? "#1570EF" : "text.secondary"} fontWeight={sel ? 700 : 400} noWrap>
                  {sel ? `${tx("Selected")}: ${sel.plan_no} · ${sel.equipment_code}` : `${plans.length} ${tx("rows")}`}</Typography>
              )} />
              {plans.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cells, ...colShares(9, 14, 8, 8, 9.5, 8, 8, 8, 10.5, 7.5, 9.5) }}>
                    <TableHead><TableRow><TableCell>{tx("Plan No.")}</TableCell><TableCell>{tx("Equipment")}</TableCell><TableCell>{tx("Serial No.")}</TableCell>
                      <TableCell>{tx("Type")}</TableCell><TableCell>{tx("Usage location")}</TableCell><TableCell>{tx("Lab")}</TableCell><TableCell>{tx("Last calibration")}</TableCell>
                      <TableCell>{tx("Planned Date")}</TableCell><TableCell align="center">{tx("Status")}</TableCell><TableCell align="center">{tx("Priority")}</TableCell><TableCell>{tx("Owner")}</TableCell></TableRow></TableHead>
                    <TableBody>{plans.map((p) => (
                      <TableRow key={p.id} hover selected={selected === p.id} sx={{ cursor: "pointer" }} onClick={() => setSelected(p.id)} onDoubleClick={() => setDialog({ type: "plan", id: p.id })}>
                        <TableCell sx={{ fontWeight: 700, color: "#1570EF" }} onClick={(e) => { e.stopPropagation(); setSelected(p.id); setDialog({ type: "plan", id: p.id }); }}>{p.plan_no}</TableCell>
                        <TableCell title={`${p.equipment_code} · ${p.equipment_name}${p.model ? ` · ${p.model}` : ""}`}><b>{p.equipment_code}</b> · {p.equipment_name}</TableCell>
                        <TableCell>{p.serial_number || EMPTY}</TableCell><TableCell title={p.type_name}>{p.type_name}</TableCell><TableCell title={p.location || ""}>{p.location || EMPTY}</TableCell>
                        <TableCell title={p.lab || ""}>{p.lab || EMPTY}</TableCell><TableCell>{dateText(p.last_calibration_date)}</TableCell>
                        <TableCell sx={{ color: p.display_status === "OVERDUE" ? "#F04438" : p.due_soon ? "#F79009" : undefined, fontWeight: p.display_status === "OVERDUE" || p.due_soon ? 700 : 400 }}>{dateText(p.planned_date)}</TableCell>
                        <TableCell align="center"><CalStatusPill value={p.due_soon ? "DUE_SOON" : p.display_status} /></TableCell><TableCell align="center"><PriorityPill value={p.priority} /></TableCell>
                        <TableCell title={who(p.owner)}>{who(p.owner)}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "4" }, gridRow: { lg: "1" } }}>
              <Head title={tx("Calibration Status")} />
              {donut.length ? (
                <Box sx={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center" }}>
                  <Box sx={{ width: "100%" }}><DonutCard entries={donut} colors={CAL_STATUS_COLORS} dark={dark} axisColor={axisColor} height={150} size={140} centerLabel={tx("plans")} /></Box>
                </Box>
              ) : <EmptyBody />}
            </Paper>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "4" }, gridRow: { lg: "2" } }}>
              <Head title={tx("Calibration Compliance")} action={<Typography variant="caption" color="text.secondary">{k.compliance_on_time}/{k.compliance_due}</Typography>} />
              <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }}>
                <Box sx={{ mt: -2 }}><GaugeChart value={k.compliance} target={data.target} dark={dark} height={250} /></Box>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "1" }, gridRow: { lg: "3" } }}>
              <Head title={tx("Overdue Equipment")} action={<Typography variant="caption" color="text.secondary">{data.overdue_equipment.length}</Typography>} />
              {data.overdue_equipment.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cells, ...colShares(22, 34, 22, 22) }}>
                    <TableHead><TableRow><TableCell>{tx("Code")}</TableCell><TableCell>{tx("Name")}</TableCell><TableCell>{tx("Due date")}</TableCell><TableCell align="right">{tx("Days overdue")}</TableCell></TableRow></TableHead>
                    <TableBody>{data.overdue_equipment.map((e) => (
                      <TableRow key={e.id} hover sx={{ cursor: "pointer" }} title={e.location || ""} onClick={() => (e.open_plan_id ? setDialog({ type: "plan", id: e.open_plan_id }) : navigate(`/quality-management/measuring-equipment?equipment=${e.id}`))}>
                        <TableCell sx={{ fontWeight: 700 }}>{e.equipment_code}</TableCell><TableCell title={e.equipment_name}>{e.equipment_name}</TableCell><TableCell>{dateText(e.next_calibration_date)}</TableCell>
                        <TableCell align="right" sx={{ color: "#F04438", fontWeight: 800 }}>{-e.days_left}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody text={tx("No overdue equipment.")} />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "2" }, gridRow: { lg: "3" } }}>
              <Head title={tx("Calibration Plans by Month")} action={<Stack direction="row" spacing={1}><Dot color="#1570EF" text={tx("Planned")} /><Dot color="#12B76A" text={tx("Completed")} /><Dot color="#F04438" text={tx("Overdue")} /></Stack>} />
              <Box sx={{ flex: 1, minHeight: 0, px: 1 }}>
                <Chart type="line" height="100%" series={[{ name: tx("Planned"), type: "column", data: data.monthly.map((m) => m.planned) }, { name: tx("Completed"), type: "column", data: data.monthly.map((m) => m.completed) },
                  { name: tx("Overdue"), type: "line", data: data.monthly.map((m) => m.overdue) }]} options={{
                  ...base, colors: ["#1570EF", "#12B76A", "#F04438"], stroke: { width: [0, 0, 2], curve: "straight" }, markers: { size: [0, 0, 3] },
                  plotOptions: { bar: { columnWidth: "46%", borderRadius: 2, dataLabels: { position: "top" } } },
                  dataLabels: { enabled: true, enabledOnSeries: [0, 1], formatter: (v) => (v ? num(v, 0) : ""), offsetY: -14, style: { fontSize: "10px", fontWeight: 700, colors: [axisColor] }, background: { enabled: false } },
                  xaxis: { ...base.xaxis, categories: data.monthly.map((m) => m.month) },
                  yaxis: { min: 0, max: (m) => Math.max(5, Math.ceil((m * 1.15) / 5) * 5), tickAmount: 4, labels: { ...base.yaxis.labels, formatter: (v) => num(v, 0) } },
                  tooltip: { ...base.tooltip, shared: true, intersect: false } }} />
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "3" }, gridRow: { lg: "3" } }}>
              <Head title={tx("Recent Calibrations")} />
              {data.recent.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cells, ...colShares(19, 17, 22, 19, 23) }}>
                    <TableHead><TableRow><TableCell>{tx("Calibration date")}</TableCell><TableCell>{tx("Code")}</TableCell><TableCell>{tx("Lab")}</TableCell>
                      <TableCell align="center">{tx("Result")}</TableCell><TableCell>{tx("Certificate")}</TableCell></TableRow></TableHead>
                    <TableBody>{data.recent.map((h) => (
                      <TableRow key={h.id} hover title={h.equipment_name} sx={{ cursor: h.plan_id ? "pointer" : "default" }} onClick={() => h.plan_id && setDialog({ type: "plan", id: h.plan_id })}>
                        <TableCell>{dateText(h.calibration_date)}</TableCell><TableCell sx={{ fontWeight: 700 }}>{h.equipment_code}</TableCell><TableCell title={h.lab || ""}>{h.lab || EMPTY}</TableCell>
                        <TableCell align="center"><ResultText value={h.result} /></TableCell>
                        <TableCell>{h.certificate_no || EMPTY}{h.certificate_url ? <DownloadOutlinedIcon sx={{ fontSize: 13, color: "#1570EF", ml: 0.5, verticalAlign: "middle", cursor: "pointer" }}
                          onClick={(e) => { e.stopPropagation(); window.open(resolveImageUrl(h.certificate_url), "_blank", "noopener"); }} /> : null}</TableCell></TableRow>
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
      {dialog?.type === "create" ? <CalCreateDialog lookups={lookups} preset={dialog.preset} request={request} actor={actor} notify={notify} onClose={closeDialog}
        onSaved={(r) => { load({ silent: true }); setSelected(r.id); setDialog({ type: "plan", id: r.id }); }} /> : null}
      {dialog?.type === "plan" ? <CalDetailDialog planId={dialog.id} lookups={lookups} request={request} actor={actor} notify={notify} canEdit={canEdit} navigate={navigate}
        onClose={closeDialog} onChanged={() => { load({ silent: true }); page.reloadLookups(); }} /> : null}
    </QualityFrame>
  );
}
