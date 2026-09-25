import "./locales";
import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { Box, InputAdornment, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ReportGmailerrorredOutlinedIcon from "@mui/icons-material/ReportGmailerrorredOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import SearchIcon from "@mui/icons-material/Search";
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";

import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, downloadCsv } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, cardSx, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { QuickActionGrid } from "../../MaintenanceManagement/maintUi";
import { label, tx } from "../qualityLocales";
import { EquipmentDialog } from "../qualityDialogs";
import { DonutCard, FilterSelect, GaugeChart, QualityFrame, qsOf, useQualityData, useQualityPage } from "../qualityPage";
import { EQUIP_STATE_COLORS, EquipStatePill, QUALITY_API, dateText, dueText } from "../qualityUi";

const DONUT_STATES = [["IN_SERVICE", "IN_SERVICE"], ["DUE_SOON", "DUE_SOON"], ["OVERDUE", "OVERDUE"], ["UNDER_REPAIR", "UNDER_REPAIR"], ["OUT_OF_SERVICE", "OUT_OF_SERVICE"]];

export default function MeasuringEquipment() {
  const page = useQualityPage();
  const { navigate, params, setParams, dark, axisColor, grid, tableSx, canEdit, lookups, request, actor, notify } = page;
  const [f, setF] = useState({ type_id: "", location: "", state: params.get("state") || "", manufacturer: "", owner: "" });
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(null);
  const [selected, setSelected] = useState(null);
  const url = `${QUALITY_API}/equipment${qsOf({ ...f, search })}`;
  const { data, loading, lastUpdate, live, setLive, load } = useQualityData(page, url, { interval: 60000, paused: Boolean(dialog) });
  const set = (key) => (v) => setF((o) => ({ ...o, [key]: v }));
  useEffect(() => { const id = Number(params.get("equipment")); if (id) { setSelected(id); setDialog({ id }); } }, [params]);
  const closeDialog = () => {
    setDialog(null);
    if (params.get("equipment")) { const p = new URLSearchParams(params); p.delete("equipment"); setParams(p, { replace: true }); }
  };
  const k = data?.kpis || {};
  const list = data?.equipment || [];
  const c = data?.counts || {};
  const donut = DONUT_STATES.map(([s]) => [s, s === "OUT_OF_SERVICE" ? (c.OUT_OF_SERVICE || 0) + (c.SCRAPPED || 0) : s === "OVERDUE" ? (c.OVERDUE || 0) + (c.NOT_CALIBRATED || 0) : s === "UNDER_REPAIR" ? (c.UNDER_REPAIR || 0) + (c.IN_CALIBRATION || 0) : c[s] || 0, label("equipDonut", s)]).filter(([, n]) => n);
  const need = (tab) => (selected ? setDialog({ id: selected, tab }) : notify("info", tx("Select a row in the list.")));
  const exportCsv = () => downloadCsv("measuring-equipment.csv", ["Code", "Name", "Type", "Model", "Serial", "Location", "State", "Last calibration", "Next calibration", "Required Cpk", "Owner"],
    list.map((e) => [e.equipment_code, e.equipment_name, e.type_name, e.model, e.serial_number, e.location, e.state, e.last_calibration_date, e.next_calibration_date, e.required_cpk, e.owner_code]));
  const quick = [
    [tx("Calibration History"), HistoryOutlinedIcon, "#1570EF", () => need("calibration")],
    [tx("View Certificates"), ReceiptLongOutlinedIcon, "#0E9384", () => need("calibration")],
    [tx("Request Calibration"), EventRepeatOutlinedIcon, "#12B76A", () => need("calibration"), !canEdit],
    [tx("Move Location"), SwapHorizOutlinedIcon, "#7A5AF8", () => need("events"), !canEdit],
    [tx("Report Broken / Repair"), BuildOutlinedIcon, "#F79009", () => need("events"), !canEdit],
    [tx("Out of Service"), BlockOutlinedIcon, "#F04438", () => need("events"), !canEdit],
    [tx("Calibration Schedule"), ScheduleOutlinedIcon, "#2E90FA", () => navigate("/quality-management/calibration-management")],
    [tx("Equipment Report"), AssessmentOutlinedIcon, "#475467", () => window.print()],
  ];
  const toolbar = <Typography variant="caption" color="text.secondary">{tx("Equipment is registered by the administrator in the Measuring Equipment Master.")}</Typography>;

  return (
    <QualityFrame page={page} title={tx("Measuring Equipment")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} toolbar={toolbar} system={data?.system}>
      {data ? (
        <>
          <Box sx={{ mb: 1.5 }}>
            <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))", xl: "repeat(6, minmax(0,1fr))" }}>
              <KpiTile tone="primary" title={tx("Total Equipment")} value={num(k.total)} sub={`${k.not_calibrated} ${tx("never calibrated")}`} icon={StraightenOutlinedIcon} onClick={() => set("state")("")} />
              <KpiTile tone="success" title={tx("In Service")} value={num(k.in_service)} sub={tx("valid for inspection")} icon={CheckCircleOutlineIcon} onClick={() => set("state")("IN_SERVICE")} />
              <KpiTile tone="warning" title={tx("Due Soon (≤ {n} days)", { n: data.due_days })} value={num(k.due_soon)} sub={tx("plan the calibration")} icon={ScheduleOutlinedIcon} onClick={() => set("state")("DUE_SOON")} />
              <KpiTile tone="danger" title={tx("Calibration Overdue")} value={num(k.overdue)} sub={tx("blocked at inspection")} icon={ReportGmailerrorredOutlinedIcon} onClick={() => set("state")("OVERDUE")} />
              <KpiTile tone="accent" title={tx("Under Repair")} value={num(k.under_repair)} sub={`${k.in_calibration} ${tx("at calibration")}`} icon={BuildOutlinedIcon} onClick={() => set("state")("UNDER_REPAIR")} />
              <KpiTile tone="info" title={tx("Out of Service")} value={num(k.out_of_service)} sub={tx("locked or scrapped")} icon={BlockOutlinedIcon} onClick={() => set("state")("OUT_OF_SERVICE")} />
            </KpiCardGroup>
          </Box>

          <Paper elevation={0} sx={{ ...cardSx, p: 1, mb: 1.5 }}>
            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
              <TextField size="small" placeholder={tx("Search code, name, serial, model...")} value={search} onChange={(e) => setSearch(e.target.value)} sx={{ width: 260 }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
              <FilterSelect labelText={tx("Equipment type")} value={f.type_id} onChange={set("type_id")} items={(lookups?.equipment_types || []).map((t) => [t.id, t.type_name])} width={160} />
              <FilterSelect labelText={tx("Usage location")} value={f.location} onChange={set("location")} items={(lookups?.locations || []).map((l) => [l, l])} width={170} />
              <FilterSelect labelText={tx("Status")} value={f.state} onChange={set("state")} items={(lookups?.equipment_states || []).map((s) => [s, `${label("equipState", s)} (${c[s] || 0})`])} width={170} />
              <FilterSelect labelText={tx("Manufacturer")} value={f.manufacturer} onChange={set("manufacturer")} items={(data.manufacturers || []).map((m) => [m, m])} width={140} />
              <FilterSelect labelText={tx("Owner")} value={f.owner} onChange={set("owner")} items={(lookups?.inspectors || []).map((p) => [p, p])} width={150} />
            </Stack>
          </Paper>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1fr) 400px" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Measuring Equipment List")} action={<Typography variant="caption" color="text.secondary">{list.length} {tx("rows")}</Typography>} />
              <Box sx={{ px: 1, pb: 1, height: 470, overflow: "auto" }}>
                <Table size="small" stickyHeader sx={tableSx}>
                  <TableHead><TableRow><TableCell>{tx("Equipment ID")}</TableCell><TableCell>{tx("Name")}</TableCell><TableCell>{tx("Type")}</TableCell><TableCell>{tx("Model")}</TableCell>
                    <TableCell>{tx("Serial No.")}</TableCell><TableCell>{tx("Usage location")}</TableCell><TableCell align="center">{tx("Status")}</TableCell><TableCell>{tx("Last calibration")}</TableCell>
                    <TableCell>{tx("Next calibration")}</TableCell><TableCell align="right">{tx("Required Cpk")}</TableCell></TableRow></TableHead>
                  <TableBody>{list.map((e) => (
                    <TableRow key={e.id} hover selected={selected === e.id} sx={{ cursor: "pointer" }} onClick={() => setSelected(e.id)} onDoubleClick={() => setDialog({ id: e.id })}>
                      <TableCell sx={{ fontWeight: 700, color: "#1570EF" }} onClick={(ev) => { ev.stopPropagation(); setSelected(e.id); setDialog({ id: e.id }); }}>{e.equipment_code}</TableCell>
                      <TableCell>{e.equipment_name}</TableCell><TableCell>{e.type_name}</TableCell><TableCell>{e.model || EMPTY}</TableCell><TableCell>{e.serial_number || EMPTY}</TableCell>
                      <TableCell>{e.location || EMPTY}</TableCell><TableCell align="center"><EquipStatePill value={e.state} /></TableCell><TableCell>{dateText(e.last_calibration_date)}</TableCell>
                      <TableCell sx={{ color: EQUIP_STATE_COLORS[e.state] === EQUIP_STATE_COLORS.OVERDUE ? "#F04438" : e.state === "DUE_SOON" ? "#F79009" : undefined, fontWeight: ["OVERDUE", "DUE_SOON"].includes(e.state) ? 700 : 400 }}>
                        {dateText(e.next_calibration_date)}</TableCell>
                      <TableCell align="right">{e.required_cpk ? `≥ ${num(e.required_cpk, 2)}` : EMPTY}</TableCell></TableRow>
                  ))}</TableBody>
                </Table>
                {!list.length ? <Typography variant="caption" color="text.secondary" sx={{ p: 1, display: "block" }}>{tx("No data.")}</Typography> : null}
              </Box>
            </Paper>
            <Stack spacing={1.5}>
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Calibration Status")} />
                <DonutCard entries={donut} colors={EQUIP_STATE_COLORS} dark={dark} axisColor={axisColor} height={170} centerLabel={tx("equipment")} />
              </Paper>
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Calibration Due Soon")} action={<Typography variant="caption" sx={{ color: "#1570EF", cursor: "pointer" }} onClick={() => navigate("/quality-management/calibration-management")}>{tx("View all")}</Typography>} />
                <Box sx={{ px: 1, pb: 1, height: 195, overflow: "auto" }}>
                  <Table size="small" stickyHeader sx={tableSx}>
                    <TableHead><TableRow><TableCell>{tx("Code")}</TableCell><TableCell>{tx("Name")}</TableCell><TableCell>{tx("Due date")}</TableCell><TableCell>{tx("Remaining")}</TableCell><TableCell>{tx("Location")}</TableCell></TableRow></TableHead>
                    <TableBody>{data.due.map((e) => (
                      <TableRow key={e.id} hover sx={{ cursor: "pointer" }} onClick={() => setDialog({ id: e.id })}>
                        <TableCell sx={{ fontWeight: 700 }}>{e.equipment_code}</TableCell><TableCell>{e.equipment_name}</TableCell><TableCell>{dateText(e.next_calibration_date)}</TableCell>
                        <TableCell sx={{ color: e.days_left < 0 ? "#F04438" : "#F79009", fontWeight: 700 }}>{dueText(e.days_left)}</TableCell><TableCell>{e.location}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              </Paper>
            </Stack>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", xl: "minmax(0,1.1fr) minmax(0,1fr) minmax(0,1.1fr) minmax(0,0.8fr)" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Equipment by Type")} />
              <Box sx={{ px: 1 }}>
                <Chart type="bar" height={230} series={[{ name: tx("Equipment"), data: data.by_type.map(([, v]) => v) }]} options={{
                  chart: { background: "transparent", toolbar: { show: false } }, plotOptions: { bar: { horizontal: true, barHeight: "55%", borderRadius: 3 } }, colors: ["#1570EF"], grid,
                  dataLabels: { enabled: true, formatter: (v) => `${v} (${num((v / Math.max(k.total, 1)) * 100, 1)}%)`, style: { fontSize: "10px" } },
                  xaxis: { categories: data.by_type.map(([t]) => t), labels: { style: { colors: axisColor } } }, yaxis: { labels: { style: { colors: axisColor } } }, tooltip: { theme: dark ? "dark" : "light" } }} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Equipment by Location")} />
              <DonutCard entries={data.by_location.map(([l, v]) => [l, v, l])} colors={{}} dark={dark} axisColor={axisColor} height={190} centerLabel={tx("equipment")} />
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Calibration History by Month")} />
              <Box sx={{ px: 1 }}>
                <Chart type="line" height={230} series={[{ name: tx("Calibrated"), data: data.monthly.map((m) => m.calibrated) }, { name: tx("Overdue"), data: data.monthly.map((m) => m.overdue) }]} options={{
                  chart: { background: "transparent", toolbar: { show: false } }, colors: ["#12B76A", "#F04438"], stroke: { width: 2.5 }, markers: { size: 4 }, dataLabels: { enabled: true, style: { fontSize: "9px" } },
                  xaxis: { categories: data.monthly.map((m) => m.month), labels: { style: { colors: axisColor, fontSize: "10px" } } }, yaxis: { min: 0, labels: { style: { colors: axisColor }, formatter: (v) => num(v, 0) } },
                  legend: { position: "top", labels: { colors: axisColor } }, grid, tooltip: { theme: dark ? "dark" : "light" } }} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Calibration Compliance")} />
              <GaugeChart value={data.compliance.rate} target={data.compliance.target} dark={dark} height={200} />
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", pb: 1 }}>{data.compliance.valid}/{data.compliance.total} {tx("equipment with a valid calibration")}</Typography>
            </Paper>
          </Box>

          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Quick Actions")} action={<Typography variant="caption" color="text.secondary">{selected ? `${tx("Selected")}: ${list.find((e) => e.id === selected)?.equipment_code || ""}` : tx("Select a row in the list.")}</Typography>} />
            <Box sx={{ px: 1.5, pb: 1.5 }}><QuickActionGrid actions={quick} columns={{ xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)", xl: "repeat(8, 1fr)" }} /></Box>
          </Paper>
        </>
      ) : null}
      {dialog ? <EquipmentDialog equipmentId={dialog.id} initialTab={dialog.tab} lookups={lookups} request={request} actor={actor} notify={notify} canEdit={canEdit} navigate={navigate}
        onClose={closeDialog} onChanged={() => { load({ silent: true }); page.reloadLookups(); }} /> : null}
    </QualityFrame>
  );
}
