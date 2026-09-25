import "./locales";
import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { Box, Button, InputAdornment, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ReportGmailerrorredOutlinedIcon from "@mui/icons-material/ReportGmailerrorredOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import SearchIcon from "@mui/icons-material/Search";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";

import { resolveImageUrl } from "../../../components/common/ImageUploadField";
import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, downloadCsv } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, btn, cardSx, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { QuickActionGrid } from "../../MaintenanceManagement/maintUi";
import { label, tx } from "../qualityLocales";
import { CalCreateDialog, CalDetailDialog } from "../qualityDialogs";
import { DateRange, DonutCard, FilterSelect, GaugeChart, QualityFrame, monthEndIso, monthStartIso, qsOf, useQualityData, useQualityPage } from "../qualityPage";
import { CAL_STATUS_COLORS, CalStatusPill, PriorityPill, QUALITY_API, ResultText, dateText } from "../qualityUi";

export default function CalibrationManagement() {
  const page = useQualityPage();
  const { navigate, params, setParams, dark, axisColor, grid, tableSx, canEdit, lookups, request, actor, notify } = page;
  const [range, setRange] = useState({ from: monthStartIso(), to: monthEndIso() });
  const [f, setF] = useState({ status: params.get("status") || "", type_id: "", location: "", lab: "", owner: "" });
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(null);
  const [selected, setSelected] = useState(null);
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
  const need = (fn) => (sel ? fn(sel) : notify("info", tx("Select a row in the list.")));
  const exportCsv = () => downloadCsv(`calibration-plans-${range.from}_${range.to}.csv`, ["Plan No.", "Equipment", "Model", "Serial", "Type", "Location", "Lab", "Last calibration", "Planned", "Status", "Priority", "Owner", "Result", "Certificate"],
    plans.map((p) => [p.plan_no, p.equipment_code, p.model, p.serial_number, p.type_name, p.location, p.lab, p.last_calibration_date, p.planned_date, p.display_status, p.priority, p.owner, p.result, p.certificate_no]));
  const quick = [
    [tx("Create Plan"), AddIcon, "#1570EF", () => setDialog({ type: "create", preset: {} }), !canEdit],
    [tx("Schedule Calibration"), CalendarMonthOutlinedIcon, "#2E90FA", () => need((p) => setDialog({ type: "plan", id: p.id })), !canEdit],
    [tx("Send for Calibration"), LocalShippingOutlinedIcon, "#7A5AF8", () => need((p) => setDialog({ type: "plan", id: p.id })), !canEdit],
    [tx("Calibration History"), HistoryOutlinedIcon, "#0E9384", () => need((p) => navigate(`/quality-management/measuring-equipment?equipment=${p.equipment_id}`))],
    [tx("View Certificates"), ReceiptLongOutlinedIcon, "#12B76A", () => need((p) => setDialog({ type: "plan", id: p.id }))],
    [tx("Report Broken / Repair"), BuildOutlinedIcon, "#F79009", () => need((p) => navigate(`/quality-management/measuring-equipment?equipment=${p.equipment_id}`)), !canEdit],
    [tx("Out of Service"), BlockOutlinedIcon, "#F04438", () => need((p) => navigate(`/quality-management/measuring-equipment?equipment=${p.equipment_id}`)), !canEdit],
    [tx("Calibration Report"), AssessmentOutlinedIcon, "#475467", () => window.print()],
  ];
  const donut = data ? Object.entries(data.donut).filter(([, n]) => n).map(([s, n]) => [s, n, label("calStatus", s)]) : [];
  const toolbar = (
    <>
      <DateRange from={range.from} to={range.to} onChange={(a, b) => setRange({ from: a, to: b })} />
      {canEdit ? <Button startIcon={<AddIcon />} onClick={() => setDialog({ type: "create", preset: {} })} sx={btn("primary")}>{tx("Create Calibration Plan")}</Button> : null}
    </>
  );

  return (
    <QualityFrame page={page} title={tx("Calibration Management")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} toolbar={toolbar} system={data?.system}>
      {data ? (
        <>
          <Box sx={{ mb: 1.5 }}>
            <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))", xl: "repeat(6, minmax(0,1fr))" }}>
              <KpiTile tone="primary" title={tx("Total Plans")} value={num(k.total)} sub={`${dateText(data.range.from)} – ${dateText(data.range.to)}`} icon={EventRepeatOutlinedIcon} onClick={() => set("status")("")} />
              <KpiTile tone="success" title={tx("Completed")} value={num(k.completed)} sub={tx("certificate recorded")} icon={CheckCircleOutlineIcon} onClick={() => set("status")("COMPLETED")} />
              <KpiTile tone="warning" title={tx("In Progress")} value={num(k.in_progress)} sub={tx("sent / calibrating")} icon={HourglassEmptyOutlinedIcon} onClick={() => set("status")("IN_PROGRESS")} />
              <KpiTile tone="danger" title={tx("Overdue")} value={num(k.overdue)} sub={tx("past the planned date")} icon={ReportGmailerrorredOutlinedIcon} onClick={() => set("status")("OVERDUE")} />
              <KpiTile tone="accent" title={tx("Due Soon (≤ {n} days)", { n: data.due_days })} value={num(k.due_soon)} sub={tx("to schedule first")} icon={ScheduleOutlinedIcon} onClick={() => set("status")("DUE_SOON")} />
              <KpiTile tone="info" title={tx("Compliance Rate")} value={k.compliance != null ? num(k.compliance, 1) : EMPTY} unit={k.compliance != null ? "%" : ""}
                sub={`${k.compliance_on_time}/${k.compliance_due} ${tx("on time")} · ${tx("Target")} ≥ ${data.target}%`} icon={VerifiedUserOutlinedIcon} />
            </KpiCardGroup>
          </Box>

          <Paper elevation={0} sx={{ ...cardSx, p: 1, mb: 1.5 }}>
            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
              <TextField size="small" placeholder={tx("Search plan, equipment, model, serial...")} value={search} onChange={(e) => setSearch(e.target.value)} sx={{ width: 260 }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
              <FilterSelect labelText={tx("Status")} value={f.status} onChange={set("status")} items={["PLANNED", "DUE_SOON", "IN_PROGRESS", "OVERDUE", "COMPLETED", "CANCELLED"].map((s) => [s, label("calStatus", s)])} width={150} />
              <FilterSelect labelText={tx("Equipment type")} value={f.type_id} onChange={set("type_id")} items={(lookups?.equipment_types || []).map((t) => [t.id, t.type_name])} width={160} />
              <FilterSelect labelText={tx("Usage location")} value={f.location} onChange={set("location")} items={(lookups?.locations || []).map((l) => [l, l])} width={170} />
              <FilterSelect labelText={tx("Calibration lab")} value={f.lab} onChange={set("lab")} items={(lookups?.labs || []).map((l) => [l, l])} width={150} />
              <FilterSelect labelText={tx("Owner")} value={f.owner} onChange={set("owner")} items={(lookups?.inspectors || []).map((p) => [p, p])} width={150} />
            </Stack>
          </Paper>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1fr) 420px" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Calibration Plan List")} action={<Typography variant="caption" color="text.secondary">{plans.length} {tx("rows")}</Typography>} />
              <Box sx={{ px: 1, pb: 1, height: 460, overflow: "auto" }}>
                <Table size="small" stickyHeader sx={tableSx}>
                  <TableHead><TableRow><TableCell>{tx("Plan No.")}</TableCell><TableCell>{tx("Equipment")}</TableCell><TableCell>{tx("Model")}</TableCell><TableCell>{tx("Serial No.")}</TableCell>
                    <TableCell>{tx("Type")}</TableCell><TableCell>{tx("Usage location")}</TableCell><TableCell>{tx("Lab")}</TableCell><TableCell>{tx("Last calibration")}</TableCell>
                    <TableCell>{tx("Planned Date")}</TableCell><TableCell align="center">{tx("Status")}</TableCell><TableCell align="center">{tx("Priority")}</TableCell><TableCell>{tx("Owner")}</TableCell></TableRow></TableHead>
                  <TableBody>{plans.map((p) => (
                    <TableRow key={p.id} hover selected={selected === p.id} sx={{ cursor: "pointer" }} onClick={() => setSelected(p.id)} onDoubleClick={() => setDialog({ type: "plan", id: p.id })}>
                      <TableCell sx={{ fontWeight: 700, color: "#1570EF" }} onClick={(e) => { e.stopPropagation(); setSelected(p.id); setDialog({ type: "plan", id: p.id }); }}>{p.plan_no}</TableCell>
                      <TableCell><Typography variant="caption" fontWeight={700} sx={{ display: "block" }}>{p.equipment_code}</Typography><Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{p.equipment_name}</Typography></TableCell>
                      <TableCell>{p.model || EMPTY}</TableCell><TableCell>{p.serial_number || EMPTY}</TableCell><TableCell>{p.type_name}</TableCell><TableCell>{p.location || EMPTY}</TableCell>
                      <TableCell>{p.lab || EMPTY}</TableCell><TableCell>{dateText(p.last_calibration_date)}</TableCell>
                      <TableCell sx={{ color: p.display_status === "OVERDUE" ? "#F04438" : p.due_soon ? "#F79009" : undefined, fontWeight: p.display_status === "OVERDUE" || p.due_soon ? 700 : 400 }}>{dateText(p.planned_date)}</TableCell>
                      <TableCell align="center"><CalStatusPill value={p.due_soon ? "DUE_SOON" : p.display_status} /></TableCell><TableCell align="center"><PriorityPill value={p.priority} /></TableCell>
                      <TableCell>{p.owner || EMPTY}</TableCell></TableRow>
                  ))}</TableBody>
                </Table>
                {!plans.length ? <Typography variant="caption" color="text.secondary" sx={{ p: 1, display: "block" }}>{tx("No data.")}</Typography> : null}
              </Box>
            </Paper>
            <Stack spacing={1.5}>
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Calibration Status")} />
                <DonutCard entries={donut} colors={CAL_STATUS_COLORS} dark={dark} axisColor={axisColor} height={170} centerLabel={tx("plans")} />
              </Paper>
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Overdue Equipment")} action={<Typography variant="caption" color="text.secondary">{data.overdue_equipment.length}</Typography>} />
                <Box sx={{ px: 1, pb: 1, height: 190, overflow: "auto" }}>
                  <Table size="small" stickyHeader sx={tableSx}>
                    <TableHead><TableRow><TableCell>{tx("Code")}</TableCell><TableCell>{tx("Name")}</TableCell><TableCell>{tx("Due date")}</TableCell><TableCell align="right">{tx("Days overdue")}</TableCell><TableCell>{tx("Location")}</TableCell></TableRow></TableHead>
                    <TableBody>{data.overdue_equipment.map((e) => (
                      <TableRow key={e.id} hover sx={{ cursor: "pointer" }} onClick={() => (e.open_plan_id ? setDialog({ type: "plan", id: e.open_plan_id }) : navigate(`/quality-management/measuring-equipment?equipment=${e.id}`))}>
                        <TableCell sx={{ fontWeight: 700 }}>{e.equipment_code}</TableCell><TableCell>{e.equipment_name}</TableCell><TableCell>{dateText(e.next_calibration_date)}</TableCell>
                        <TableCell align="right" sx={{ color: "#F04438", fontWeight: 800 }}>{-e.days_left}</TableCell><TableCell>{e.location}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                  {!data.overdue_equipment.length ? <Typography variant="caption" color="text.secondary" sx={{ p: 1, display: "block" }}>{tx("No overdue equipment.")}</Typography> : null}
                </Box>
              </Paper>
            </Stack>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1.2fr) minmax(0,0.8fr) minmax(0,1.3fr)" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Calibration Plans by Month")} />
              <Box sx={{ px: 1 }}>
                <Chart type="line" height={250} series={[{ name: tx("Planned"), type: "column", data: data.monthly.map((m) => m.planned) }, { name: tx("Completed"), type: "column", data: data.monthly.map((m) => m.completed) },
                  { name: tx("Overdue"), type: "line", data: data.monthly.map((m) => m.overdue) }]} options={{
                  chart: { background: "transparent", toolbar: { show: false } }, colors: ["#1570EF", "#12B76A", "#F04438"], stroke: { width: [0, 0, 2.5] }, markers: { size: [0, 0, 4] },
                  plotOptions: { bar: { columnWidth: "55%", borderRadius: 2 } }, dataLabels: { enabled: true, enabledOnSeries: [0, 1, 2], style: { fontSize: "9px" } },
                  xaxis: { categories: data.monthly.map((m) => m.month), labels: { style: { colors: axisColor, fontSize: "10px" } } }, yaxis: { min: 0, labels: { style: { colors: axisColor }, formatter: (v) => num(v, 0) } },
                  legend: { position: "top", labels: { colors: axisColor } }, grid, tooltip: { theme: dark ? "dark" : "light", shared: true } }} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Calibration Compliance")} />
              <GaugeChart value={k.compliance} target={data.target} dark={dark} height={210} />
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", pb: 1, px: 1 }}>{tx("On-time calibrations / calibrations due in the period")}</Typography>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Recent Calibrations")} />
              <Box sx={{ px: 1, pb: 1, height: 250, overflow: "auto" }}>
                <Table size="small" stickyHeader sx={tableSx}>
                  <TableHead><TableRow><TableCell>{tx("Calibration date")}</TableCell><TableCell>{tx("Code")}</TableCell><TableCell>{tx("Name")}</TableCell><TableCell>{tx("Lab")}</TableCell>
                    <TableCell align="center">{tx("Result")}</TableCell><TableCell>{tx("Certificate")}</TableCell></TableRow></TableHead>
                  <TableBody>{data.recent.map((h) => (
                    <TableRow key={h.id} hover sx={{ cursor: h.plan_id ? "pointer" : "default" }} onClick={() => h.plan_id && setDialog({ type: "plan", id: h.plan_id })}>
                      <TableCell>{dateText(h.calibration_date)}</TableCell><TableCell sx={{ fontWeight: 700 }}>{h.equipment_code}</TableCell><TableCell>{h.equipment_name}</TableCell><TableCell>{h.lab || EMPTY}</TableCell>
                      <TableCell align="center"><ResultText value={h.result} /></TableCell>
                      <TableCell>{h.certificate_no || EMPTY}{h.certificate_url ? <DownloadOutlinedIcon sx={{ fontSize: 15, color: "#1570EF", ml: 0.5, verticalAlign: "middle", cursor: "pointer" }}
                        onClick={(e) => { e.stopPropagation(); window.open(resolveImageUrl(h.certificate_url), "_blank", "noopener"); }} /> : null}</TableCell></TableRow>
                  ))}</TableBody>
                </Table>
              </Box>
            </Paper>
          </Box>

          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Quick Actions")} action={<Typography variant="caption" color="text.secondary">{sel ? `${tx("Selected")}: ${sel.plan_no} · ${sel.equipment_code}` : tx("Select a row in the list.")}</Typography>} />
            <Box sx={{ px: 1.5, pb: 1.5 }}><QuickActionGrid actions={quick} columns={{ xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)", xl: "repeat(8, 1fr)" }} /></Box>
          </Paper>
        </>
      ) : null}
      {dialog?.type === "create" ? <CalCreateDialog lookups={lookups} preset={dialog.preset} request={request} actor={actor} notify={notify} onClose={closeDialog}
        onSaved={(r) => { load({ silent: true }); setSelected(r.id); setDialog({ type: "plan", id: r.id }); }} /> : null}
      {dialog?.type === "plan" ? <CalDetailDialog planId={dialog.id} lookups={lookups} request={request} actor={actor} notify={notify} canEdit={canEdit} navigate={navigate}
        onClose={closeDialog} onChanged={() => { load({ silent: true }); page.reloadLookups(); }} /> : null}
    </QualityFrame>
  );
}
