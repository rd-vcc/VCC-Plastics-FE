import "./locales";
import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { Box, InputAdornment, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import ReportGmailerrorredOutlinedIcon from "@mui/icons-material/ReportGmailerrorredOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import SearchIcon from "@mui/icons-material/Search";
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, colShares, downloadExcel } from "../../MaterialManagement/materialUi";
import { Dot, EMPTY, Head, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { label, tx } from "../qualityLocales";
import { EquipmentDialog } from "../qualityDialogs";
import { DonutCard, EmptyBody, FilterSelect, FilterToggle, GaugeChart, QualityFrame, QuickCard, chartBase, fillSx, panelSx, qsOf, txs, useQualityData, useQualityPage, who } from "../qualityPage";
import { EQUIP_STATE_COLORS, EquipStatePill, QUALITY_API, dateText, dueText } from "../qualityUi";

const DONUT_STATES = [["IN_SERVICE", "IN_SERVICE"], ["DUE_SOON", "DUE_SOON"], ["OVERDUE", "OVERDUE"], ["UNDER_REPAIR", "UNDER_REPAIR"], ["OUT_OF_SERVICE", "OUT_OF_SERVICE"]];

export default function MeasuringEquipment() {
  const page = useQualityPage();
  const { navigate, params, setParams, dark, axisColor, tableSx, canEdit, lookups, request, actor, notify } = page;
  const [f, setF] = useState({ type_id: "", location: "", state: params.get("state") || "", manufacturer: "", owner: "" });
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [distView, setDistView] = useState("type");
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
  const sel = list.find((e) => e.id === selected);
  const need = (tab) => (sel ? setDialog({ id: sel.id, tab }) : notify("info", tx("Select a row in the list.")));
  const exportCsv = () => downloadExcel("measuring-equipment.csv", ["Code", "Name", "Type", "Model", "Serial", "Location", "State", "Last calibration", "Next calibration", "Required Cpk", "Owner"],
    list.map((e) => [e.equipment_code, e.equipment_name, e.type_name, e.model, e.serial_number, e.location, e.state, e.last_calibration_date, e.next_calibration_date, e.required_cpk, e.owner_code]));
  const quick = [
    [tx("View detail"), VisibilityOutlinedIcon, "#1570EF", () => need(), !sel],
    [tx("Calibration History"), HistoryOutlinedIcon, "#0E9384", () => need("calibration"), !sel],
    [txs("Status & location (short)", "Move Location"), SwapHorizOutlinedIcon, "#7A5AF8", () => need("events"), !canEdit || !sel],
    [tx("Calibration Schedule"), ScheduleOutlinedIcon, "#2E90FA", () => navigate("/quality-management/calibration-management")],
    [tx("Inspection Management"), FactCheckOutlinedIcon, "#12B76A", () => navigate("/quality-management/inspection-management")],
    [txs("Quality overview (short)", "Quality Dashboard"), InsightsOutlinedIcon, "#F79009", () => navigate("/quality-management/dashboard")],
  ];
  const activeFilters = Object.values(f).filter(Boolean).length + (search ? 1 : 0);
  const base = chartBase(dark, axisColor);
  const toolbar = (
    <>
      <FilterToggle open={showFilter} count={activeFilters} onClick={() => setShowFilter((v) => !v)} />
      <Typography variant="caption" color="text.secondary">{tx("Equipment is registered by the administrator in the Measuring Equipment Master.")}</Typography>
    </>
  );
  const filters = showFilter && data ? (
    <>
      <TextField size="small" placeholder={tx("Search code, name, serial, model...")} value={search} onChange={(e) => setSearch(e.target.value)} sx={{ width: 240 }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
      <FilterSelect labelText={tx("Equipment type")} value={f.type_id} onChange={set("type_id")} items={(lookups?.equipment_types || []).map((t) => [t.id, t.type_name])} width={160} />
      <FilterSelect labelText={tx("Usage location")} value={f.location} onChange={set("location")} items={(lookups?.locations || []).map((l) => [l, l])} width={170} />
      <FilterSelect labelText={tx("Status")} value={f.state} onChange={set("state")} items={(lookups?.equipment_states || []).map((s) => [s, `${label("equipState", s)} (${c[s] || 0})`])} width={170} />
      <FilterSelect labelText={tx("Manufacturer")} value={f.manufacturer} onChange={set("manufacturer")} items={(data.manufacturers || []).map((m) => [m, m])} width={140} />
      <FilterSelect labelText={tx("Owner")} value={f.owner} onChange={set("owner")} items={(lookups?.inspectors || []).map((p) => [p, who(p)])} width={160} />
    </>
  ) : null;
  const toggleSx = { px: 1, py: 0.1, textTransform: "none", fontWeight: 700, fontSize: 10.5 };
  const cells = { "& .MuiTableCell-root": { px: 0.5 }, "& td:has(> span[title])": { textOverflow: "clip" } };
  const dist = distView === "location" ? data?.by_location || [] : data?.by_type || [];

  return (
    <QualityFrame fit page={page} title={tx("Measuring Equipment")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} toolbar={toolbar} filters={filters} system={data?.system}>
      {data ? (
        <>
          <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))", xl: "repeat(6, minmax(0,1fr))" }}>
            <KpiTile tone="primary" title={tx("Total Equipment")} value={num(k.total)} sub={`${k.not_calibrated} ${tx("never calibrated")}`} icon={StraightenOutlinedIcon} onClick={() => set("state")("")} />
            <KpiTile tone="success" title={tx("In Service")} value={num(k.in_service)} sub={tx("valid for inspection")} icon={CheckCircleOutlineIcon} onClick={() => set("state")("IN_SERVICE")} />
            <KpiTile tone="warning" title={tx("Due Soon (≤ {n} days)", { n: data.due_days })} value={num(k.due_soon)} sub={tx("plan the calibration")} icon={ScheduleOutlinedIcon} onClick={() => set("state")("DUE_SOON")} />
            <KpiTile tone="danger" title={tx("Calibration Overdue")} value={num(k.overdue)} sub={tx("blocked at inspection")} icon={ReportGmailerrorredOutlinedIcon} onClick={() => set("state")("OVERDUE")} />
            <KpiTile tone="accent" title={tx("Under Repair")} value={num(k.under_repair)} sub={`${k.in_calibration} ${tx("at calibration")}`} icon={BuildOutlinedIcon} onClick={() => set("state")("UNDER_REPAIR")} />
            <KpiTile tone="info" title={tx("Out of Service")} value={num(k.out_of_service)} sub={tx("locked or scrapped")} icon={BlockOutlinedIcon} onClick={() => set("state")("OUT_OF_SERVICE")} />
          </KpiCardGroup>

          <Box sx={{ flex: { lg: "1 1 0" }, minHeight: 0, display: "grid", gap: 1,
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" }, gridTemplateRows: { lg: "minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)" } }}>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 4" }, gridRow: { lg: "1 / 3" }, minHeight: { xs: 360, lg: 0 } }}>
              <Head title={tx("Measuring Equipment List")} action={(
                <Typography variant="caption" color={sel ? "#1570EF" : "text.secondary"} fontWeight={sel ? 700 : 400} noWrap>
                  {sel ? `${tx("Selected")}: ${sel.equipment_code} · ${sel.equipment_name}` : `${list.length} ${tx("rows")}`}</Typography>
              )} />
              {list.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cells, ...colShares(8.5, 16, 10.5, 8.5, 8.5, 10.5, 10.5, 9.5, 9.5, 8) }}>
                    <TableHead><TableRow><TableCell>{tx("Equipment ID")}</TableCell><TableCell>{tx("Name")}</TableCell><TableCell>{tx("Type")}</TableCell><TableCell>{tx("Model")}</TableCell>
                      <TableCell>{tx("Serial No.")}</TableCell><TableCell>{tx("Usage location")}</TableCell><TableCell align="center">{tx("Status")}</TableCell><TableCell>{tx("Last calibration")}</TableCell>
                      <TableCell>{tx("Next calibration")}</TableCell><TableCell align="right">{tx("Required Cpk")}</TableCell></TableRow></TableHead>
                    <TableBody>{list.map((e) => (
                      <TableRow key={e.id} hover selected={selected === e.id} sx={{ cursor: "pointer" }} onClick={() => setSelected(e.id)} onDoubleClick={() => setDialog({ id: e.id })}>
                        <TableCell sx={{ fontWeight: 700, color: "#1570EF" }} onClick={(ev) => { ev.stopPropagation(); setSelected(e.id); setDialog({ id: e.id }); }}>{e.equipment_code}</TableCell>
                        <TableCell title={e.equipment_name}>{e.equipment_name}</TableCell><TableCell title={e.type_name}>{e.type_name}</TableCell><TableCell>{e.model || EMPTY}</TableCell><TableCell>{e.serial_number || EMPTY}</TableCell>
                        <TableCell title={e.location || ""}>{e.location || EMPTY}</TableCell><TableCell align="center"><EquipStatePill value={e.state} /></TableCell><TableCell>{dateText(e.last_calibration_date)}</TableCell>
                        <TableCell sx={{ color: EQUIP_STATE_COLORS[e.state] === EQUIP_STATE_COLORS.OVERDUE ? "#F04438" : e.state === "DUE_SOON" ? "#F79009" : undefined, fontWeight: ["OVERDUE", "DUE_SOON"].includes(e.state) ? 700 : 400 }}>
                          {dateText(e.next_calibration_date)}</TableCell>
                        <TableCell align="right">{e.required_cpk ? `≥ ${num(e.required_cpk, 2)}` : EMPTY}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "4" }, gridRow: { lg: "1" } }}>
              <Head title={tx("Calibration Status")} />
              {donut.length ? (
                <Box sx={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center" }}>
                  <Box sx={{ width: "100%" }}><DonutCard entries={donut} colors={EQUIP_STATE_COLORS} dark={dark} axisColor={axisColor} height={150} size={140} centerLabel={tx("equipment")} /></Box>
                </Box>
              ) : <EmptyBody />}
            </Paper>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "4" }, gridRow: { lg: "2" } }}>
              <Head title={tx("Calibration Compliance")} action={<Typography variant="caption" color="text.secondary">{data.compliance.valid}/{data.compliance.total}</Typography>} />
              <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }}>
                <Box sx={{ mt: -2 }}><GaugeChart value={data.compliance.rate} target={data.compliance.target} dark={dark} height={250} /></Box>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "1" }, gridRow: { lg: "3" } }}>
              <Head title={tx("Calibration Due Soon")} action={<Typography variant="caption" sx={{ color: "#1570EF", cursor: "pointer" }} onClick={() => navigate("/quality-management/calibration-management")}>{tx("View all")}</Typography>} />
              {data.due.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cells, ...colShares(22, 32, 20, 26) }}>
                    <TableHead><TableRow><TableCell>{tx("Code")}</TableCell><TableCell>{tx("Name")}</TableCell><TableCell>{tx("Due date")}</TableCell><TableCell>{tx("Remaining")}</TableCell></TableRow></TableHead>
                    <TableBody>{data.due.map((e) => (
                      <TableRow key={e.id} hover sx={{ cursor: "pointer" }} onClick={() => setDialog({ id: e.id })} title={e.location || ""}>
                        <TableCell sx={{ fontWeight: 700 }}>{e.equipment_code}</TableCell><TableCell title={e.equipment_name}>{e.equipment_name}</TableCell><TableCell>{dateText(e.next_calibration_date)}</TableCell>
                        <TableCell sx={{ color: e.days_left < 0 ? "#F04438" : "#F79009", fontWeight: 700 }}>{dueText(e.days_left)}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "2" }, gridRow: { lg: "3" } }}>
              <Head title={distView === "location" ? tx("Equipment by Location") : tx("Equipment by Type")} action={(
                <ToggleButtonGroup exclusive size="small" value={distView} onChange={(e, v) => v && setDistView(v)}>
                  <ToggleButton value="type" sx={toggleSx}>{tx("Type")}</ToggleButton>
                  <ToggleButton value="location" sx={toggleSx}>{tx("Location")}</ToggleButton>
                </ToggleButtonGroup>
              )} />
              {dist.length ? (
                <Box sx={{ flex: 1, minHeight: 0, px: 1 }}>
                  <Chart key={distView} type="bar" height="100%" series={[{ name: tx("Equipment"), data: dist.map(([, v]) => v) }]} options={{
                    ...base, plotOptions: { bar: { horizontal: true, barHeight: "60%", borderRadius: 3, distributed: distView === "location" } },
                    colors: distView === "location" ? ["#1570EF", "#12B76A", "#F79009", "#7A5AF8", "#0E9384", "#F04438", "#98A2B3"] : ["#1570EF"],
                    dataLabels: { enabled: true, formatter: (v) => `${v} (${num((v / Math.max(k.total, 1)) * 100, 0)}%)`, style: { fontSize: "10px" } },
                    xaxis: { ...base.xaxis, categories: dist.map(([t]) => t), tickAmount: 4, labels: { ...base.xaxis.labels, formatter: (v) => num(v, 0) } },
                    yaxis: { labels: { ...base.yaxis.labels, maxWidth: 110 } } }} />
                </Box>
              ) : <EmptyBody />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "3" }, gridRow: { lg: "3" } }}>
              <Head title={tx("Calibration History by Month")} action={<Stack direction="row" spacing={1.5}><Dot color="#12B76A" text={tx("Calibrated")} /><Dot color="#F04438" text={tx("Overdue")} /></Stack>} />
              <Box sx={{ flex: 1, minHeight: 0, px: 1 }}>
                <Chart type="line" height="100%" series={[{ name: tx("Calibrated"), data: data.monthly.map((m) => m.calibrated) }, { name: tx("Overdue"), data: data.monthly.map((m) => m.overdue) }]} options={{
                  ...base, colors: ["#12B76A", "#F04438"], stroke: { width: 2, curve: "straight" }, markers: { size: 3 },
                  dataLabels: { enabled: true, formatter: (v) => (v ? num(v, 0) : ""), style: { fontSize: "10px" }, background: { enabled: false }, offsetY: -6 },
                  xaxis: { ...base.xaxis, categories: data.monthly.map((m) => m.month) },
                  yaxis: { min: 0, max: (m) => Math.max(5, Math.ceil((m * 1.15) / 5) * 5), tickAmount: 5, labels: { ...base.yaxis.labels, formatter: (v) => num(v, 0) } },
                  tooltip: { ...base.tooltip, shared: true, intersect: false } }} />
              </Box>
            </Paper>

            <Box sx={{ gridColumn: { lg: "4" }, gridRow: { lg: "3" }, display: "flex", minHeight: 0, "& > *": { flex: 1 } }}>
              <QuickCard actions={quick} columns={3} />
            </Box>
          </Box>
        </>
      ) : null}
      {dialog ? <EquipmentDialog equipmentId={dialog.id} initialTab={dialog.tab} lookups={lookups} request={request} actor={actor} notify={notify} canEdit={canEdit} navigate={navigate}
        onClose={closeDialog} onChanged={() => { load({ silent: true }); page.reloadLookups(); }} /> : null}
    </QualityFrame>
  );
}
