import "./locales";
import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, LinearProgress, Paper, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Typography } from "@mui/material";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import FactoryOutlinedIcon from "@mui/icons-material/FactoryOutlined";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import SearchIcon from "@mui/icons-material/Search";
import TableViewOutlinedIcon from "@mui/icons-material/TableViewOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import TrackChangesOutlinedIcon from "@mui/icons-material/TrackChangesOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";

import { resolveImageUrl } from "../../../components/common/ImageUploadField";
import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, colShares, downloadExcel } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, btn, ddmmhhmm, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { EmptyBody, QuickCard, cellsSx, fillSx, fitGridSx, panelSx, who } from "../../shared/onePage";
import { label, tx } from "../traceLocales";
import {
  Chain, Documents, HistoryDialog, KeyGrid, Link, SearchInline, StatusPill, TRACE_API, TraceFrame, TraceTimeline, dateText, qty, refPath, useTraceData, useTracePage, vsYesterday,
} from "../traceUi";

const ICONS = { PRODUCT: Inventory2OutlinedIcon, INSPECTION: FactCheckOutlinedIcon, PRODUCTION: FactoryOutlinedIcon, MACHINE: PrecisionManufacturingOutlinedIcon,
  MOLD: GridViewOutlinedIcon, MATERIAL: ScienceOutlinedIcon };
const OPTIONS = ["LOT", "BARCODE", "QR", "WO", "ORDER"];

export default function ProductTraceability() {
  const page = useTracePage();
  const { navigate, params, setParams, tableSx, lookups, request, actor, notify } = page;
  const [by, setBy] = useState("LOT");
  const [key, setKey] = useState(params.get("lot") || "");
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("details");
  const [history, setHistory] = useState(false);
  const [img, setImg] = useState(0);
  const sum = useTraceData(page, `${TRACE_API}/summary/product`, { interval: 60000 });
  const trace = useCallback(async (q) => {
    setBusy(true);
    try {
      const r = await request(`${TRACE_API}/product?${new URLSearchParams({ actor, ...q })}`);
      if (!r.found) { notify("warning", tx("No product lot found for this key.")); setData(null); } else { setData(r); setImg(0); }
      sum.load({ silent: true });
    } catch (e) { notify("error", e.message); } finally { setBusy(false); }
  }, [request, actor, notify]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const id = params.get("lot_id");
    if (id) trace({ lot_id: id });
    else if (params.get("lot")) trace({ by: "LOT", key: params.get("lot") });
  }, [params, trace]);
  const search = () => { if (params.get("lot_id")) setParams({}, { replace: true }); trace({ by, key: key.trim() }); };
  const k = sum.data?.kpis || {};
  const lot = data?.lot;
  const wo = data?.work_order;
  const suggestions = by === "WO" ? lookups?.work_orders : by === "ORDER" ? lookups?.orders : lookups?.product_lots;
  const exportCsv = () => data && downloadExcel(`trace-${lot.lot_no}.csv`, ["#", "Step", "Detail", "Value", "Time", "Operator / Source"],
    data.steps.map((s, i) => [i + 1, s.step, s.detail, s.value || "", s.at || "", s.actor || ""]));
  const quick = [
    [tx("New Trace"), AddBoxOutlinedIcon, "#1570EF", () => { setData(null); setKey(""); setParams({}, { replace: true }); }],
    [tx("Advanced Search"), SearchIcon, "#7A5AF8", () => setBy("WO")],
    [tx("Trace History"), HistoryOutlinedIcon, "#0E9384", () => setHistory(true)],
    [tx("Material Trace"), ScienceOutlinedIcon, "#F79009", () => navigate(data?.materials?.[0] ? `/traceability/material?lot_id=${data.materials[0].lot_id}` : "/traceability/material")],
    [tx("Lot Genealogy"), AccountTreeOutlinedIcon, "#2E90FA", () => navigate(lot ? `/traceability/lot-genealogy?by=PRODUCT_LOT&key=${lot.lot_no}` : "/traceability/lot-genealogy")],
    [tx("Export Report"), TableViewOutlinedIcon, "#12B76A", exportCsv, !data],
  ];
  const images = data?.images || [];
  const toolbar = (
    <SearchInline options={OPTIONS} by={by} setBy={setBy} value={key} setValue={setKey} suggestions={suggestions} onSearch={search}
      tips={[tx("Search by product lot no., barcode / QR (= lot no.), work order or production order."), tx("A product lot is one work order × production date × shift.")]} />
  );
  const empty = <EmptyBody text={tx("Enter a product lot, barcode or work order to trace.")} />;
  const cells = { ...tableSx, ...cellsSx };

  return (
    <TraceFrame fit page={page} title={tx("Product Traceability")} loading={busy || sum.loading} ready={Boolean(sum.data)} lastUpdate={sum.lastUpdate} onRefresh={() => sum.load()}
      onExport={exportCsv} toolbar={toolbar} system={sum.data?.system}>
      <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))", xl: "repeat(6, minmax(0,1fr))" }}>
        <KpiTile tone="primary" title={tx("Trace Success Rate (Today)")} value={k.today?.success != null ? num(k.today.success, 1) : EMPTY} unit={k.today?.success != null ? "%" : ""}
          sub={vsYesterday(k.today?.success, k.yesterday?.success, "%")} icon={VerifiedUserOutlinedIcon} />
        <KpiTile tone="success" title={tx("Total Traces (Today)")} value={num(k.today?.total)} sub={`${tx("yesterday")}: ${num(k.yesterday?.total)}`} icon={TrackChangesOutlinedIcon} onClick={() => setHistory(true)} />
        <KpiTile tone="accent" title={tx("Products Traced (Today)")} value={num(k.today?.objects)} sub={`${num(k.product_lots)} ${tx("product lots in system")}`} icon={Inventory2OutlinedIcon} />
        <KpiTile tone="warning" title={tx("Lots with Open NG")} value={num(k.lots_with_open_ng)} sub={tx("quality issue not closed")} icon={HourglassEmptyOutlinedIcon} onClick={() => navigate("/quality-management/ng-management")} />
        <KpiTile tone="info" title={tx("Avg. Trace Time")} value={k.today?.avg_sec != null ? num(k.today.avg_sec, 2) : EMPTY} unit={k.today?.avg_sec != null ? "s" : ""}
          sub={vsYesterday(k.today?.avg_sec, k.yesterday?.avg_sec, " s")} icon={TimerOutlinedIcon} />
        <KpiTile tone="danger" title={tx("Recall Ready")} value={k.recall_ready != null ? num(k.recall_ready, 1) : EMPTY} unit={k.recall_ready != null ? "%" : ""}
          sub={`${k.ready_lots}/${k.product_lots} ${tx("lots with a complete chain")}`} icon={CategoryOutlinedIcon} />
      </KpiCardGroup>
      {data?.candidates?.length > 1 ? (
        <Alert severity="info" sx={{ py: 0 }}>
          {tx("{n} lots match", { n: data.candidates.length })}: {data.candidates.map((c) => (
            <Typography key={c.id} component="span" variant="caption" sx={{ mr: 1.5, cursor: "pointer", color: c.id === lot.id ? "text.primary" : "#1570EF", fontWeight: 700 }}
              onClick={() => trace({ lot_id: c.id })}>{c.lot_no}</Typography>))}
        </Alert>
      ) : null}

      <Box sx={{ ...fitGridSx, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" }, gridTemplateRows: { lg: "auto minmax(0,1fr) minmax(0,1fr)" } }}>
        <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 4" }, gridRow: { lg: "1" }, minHeight: { xs: 160, lg: 0 } }}>
          <Head title={tx("Trace Result Summary")} />
          <Box sx={{ px: 1.5, pb: 1.25 }}>{data ? <Chain nodes={data.nodes} icons={ICONS} navigate={navigate} /> : empty}</Box>
        </Paper>

        <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "4" }, gridRow: { lg: "1 / 3" } }}>
          <Head title={tx("Trace Detail")} action={lot ? <Box component="span" sx={{ fontSize: 11 }}><Link navigate={navigate} to={`/traceability/lot-genealogy?by=PRODUCT_LOT&key=${lot.lot_no}`}>{tx("Open Lot Genealogy")} →</Link></Box> : null} />
          {!data ? <EmptyBody text={tx("No lot selected.")} /> : (
            <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1.25 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.75 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#1570EF" }}>{lot.lot_no}</Typography><StatusPill value={lot.status} group="lotStatus" width={90} />
              </Stack>
              <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 1.5, rowGap: 0.3, mb: 1 }}>
                {[[tx("Product Name"), lot.product_name], [tx("Product Code"), lot.product_code], [tx("Quantity"), `${num(lot.good_qty)} pcs (NG ${num(lot.reject_qty)})`],
                  [tx("Production Date"), `${dateText(lot.production_date)} · ${lot.shift_name || ""}`], [tx("Quality"), <StatusPill key="q" value={lot.quality_status} width={110} />],
                  [tx("Customer"), lot.customer_name || EMPTY], [tx("Production Order"), lot.order_no || EMPTY],
                ].map(([a, b]) => [<Typography key={`${a}k`} variant="caption" color="text.secondary">{a}</Typography>, <Typography key={`${a}v`} variant="caption" fontWeight={700}>{b ?? EMPTY}</Typography>])}
              </Box>
              <KeyGrid navigate={navigate} columns={2} items={[
                [tx("Work Order"), wo.wo_no, refPath({ type: "WO", id: wo.id })], [tx("Shift"), lot.shift_name], [tx("Operator"), lot.operator_code ? (lot.operator_name ? `${lot.operator_name} - ${lot.operator_code}` : lot.operator_code) : EMPTY],
                [tx("Machine"), lot.machine_code, refPath({ type: "MACHINE", id: lot.machine_id })], [tx("Mold"), lot.mold_code, refPath({ type: "MOLD", id: lot.mold_id })],
                [tx("Material Lot"), data.materials[0]?.lot_no, data.materials[0] ? refPath({ type: "MATERIAL_LOT", id: data.materials[0].lot_id }) : null],
                [tx("Supplier"), data.materials[0]?.supplier], [tx("Cavity"), wo.cavity || wo.cavity_count],
              ]} />
              <Typography variant="caption" fontWeight={800} sx={{ display: "block", mt: 1, mb: 0.5 }}>{tx("Related Documents")}</Typography>
              <Documents docs={data.documents} navigate={navigate} />
            </Box>
          )}
        </Paper>

        <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 3" }, gridRow: { lg: "2 / 4" }, minHeight: { xs: 300, lg: 0 } }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" sx={{ px: 1, minHeight: 34, flexShrink: 0, "& .MuiTab-root": { minHeight: 34, py: 0, px: 1.25, minWidth: 0, textTransform: "none", fontWeight: 700, fontSize: 11.5 } }}>
            <Tab value="details" label={tx("Trace Details")} /><Tab value="process" label={tx("Process History")} /><Tab value="material" label={tx("Material History")} />
            <Tab value="inspection" label={tx("Inspection History")} /><Tab value="shipment" label={tx("Shipment History")} />
          </Tabs>
          {!data ? empty : (
            <Box sx={fillSx}>
              {tab === "details" ? (
                <Table size="small" stickyHeader sx={{ ...cells, ...colShares(5, 14, 16, 33, 14, 18) }}>
                  <TableHead><TableRow><TableCell>#</TableCell><TableCell>{tx("Process Step")}</TableCell><TableCell>{tx("Details")}</TableCell><TableCell>{tx("Data / Value")}</TableCell>
                    <TableCell>{tx("Date / Time")}</TableCell><TableCell>{tx("Operator / Source")}</TableCell></TableRow></TableHead>
                  <TableBody>{data.steps.map((s, i) => (
                    <TableRow key={s.step} sx={{ opacity: s.value ? 1 : 0.6 }}>
                      <TableCell>{i + 1}</TableCell><TableCell sx={{ fontWeight: 700 }}>{label("step", s.step)}</TableCell><TableCell>{label("stepDetail", s.detail)}</TableCell>
                      <TableCell title={s.value || ""}>{s.value || (s.step === "PACKING" ? tx("Not integrated") : EMPTY)}</TableCell>
                      <TableCell>{s.at ? ddmmhhmm(s.at) : EMPTY}</TableCell><TableCell title={who(s.actor)}>{who(s.actor)}</TableCell></TableRow>
                  ))}</TableBody>
                </Table>
              ) : null}
              {tab === "process" ? (
                <Table size="small" stickyHeader sx={{ ...cells, ...colShares(45, 30, 25) }}>
                  <TableHead><TableRow><TableCell>{tx("Product Lot")}</TableCell><TableCell>{tx("Production Date")}</TableCell><TableCell align="right">{tx("Good Qty")}</TableCell></TableRow></TableHead>
                  <TableBody>{data.siblings.map((s) => (
                    <TableRow key={s.id} hover selected={s.id === lot.id} sx={{ cursor: "pointer" }} onClick={() => trace({ lot_id: s.id })}>
                      <TableCell sx={{ fontWeight: 700, color: "#1570EF" }}>{s.lot_no}</TableCell><TableCell>{dateText(s.production_date)}</TableCell><TableCell align="right">{num(s.good_qty)}</TableCell></TableRow>
                  ))}</TableBody>
                </Table>
              ) : null}
              {tab === "material" ? (
                <Table size="small" stickyHeader sx={{ ...cells, ...colShares(15, 22, 15, 13, 12, 11, 12) }}>
                  <TableHead><TableRow><TableCell>{tx("Material Lot")}</TableCell><TableCell>{tx("Material")}</TableCell><TableCell>{tx("Supplier")}</TableCell><TableCell>{tx("Supplier Lot")}</TableCell>
                    <TableCell align="right">{tx("Qty Used (WO)")}</TableCell><TableCell>IQC</TableCell><TableCell>{tx("First Used")}</TableCell></TableRow></TableHead>
                  <TableBody>{data.materials.map((m) => (
                    <TableRow key={m.lot_id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/traceability/material?lot_id=${m.lot_id}`)}>
                      <TableCell sx={{ fontWeight: 700, color: "#1570EF" }}>{m.lot_no}</TableCell><TableCell title={`${m.material_code} — ${m.material_name}`}>{m.material_code} — {m.material_name}</TableCell><TableCell>{m.supplier || EMPTY}</TableCell>
                      <TableCell>{m.supplier_lot_no || EMPTY}</TableCell><TableCell align="right">{qty(m.qty, m.unit)}</TableCell><TableCell><StatusPill value={m.iqc_result} width={76} /></TableCell>
                      <TableCell>{ddmmhhmm(m.first_used)}</TableCell></TableRow>
                  ))}</TableBody>
                </Table>
              ) : null}
              {tab === "inspection" ? (
                <Table size="small" stickyHeader sx={{ ...cells, ...colShares(18, 10, 15, 10, 8, 14, 25) }}>
                  <TableHead><TableRow><TableCell>{tx("Plan / NG")}</TableCell><TableCell>{tx("Type")}</TableCell><TableCell>{tx("Time")}</TableCell><TableCell align="right">{tx("Samples")}</TableCell>
                    <TableCell align="right">NG</TableCell><TableCell>{tx("Result")}</TableCell><TableCell>{tx("Inspector")}</TableCell></TableRow></TableHead>
                  <TableBody>
                    {data.quality.plans.map((p) => (
                      <TableRow key={`p${p.id}`} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/quality-management/inspection-management?plan=${p.id}`)}>
                        <TableCell sx={{ fontWeight: 700, color: "#1570EF" }}>{p.plan_no}</TableCell><TableCell>{p.inspection_type}</TableCell><TableCell>{ddmmhhmm(p.completed_at || p.planned_at)}</TableCell>
                        <TableCell align="right">{p.samples}</TableCell><TableCell align="right">{p.ng}</TableCell>
                        <TableCell sx={{ color: p.result === "NG" ? "#F04438" : "#12B76A", fontWeight: 800 }}>{p.result || label("planStatus", p.status)}</TableCell><TableCell title={who(p.inspector)}>{who(p.inspector)}</TableCell></TableRow>
                    ))}
                    {data.quality.ng.map((n) => (
                      <TableRow key={`n${n.id}`} hover sx={{ cursor: "pointer", bgcolor: "#F044380A" }} onClick={() => navigate(`/quality-management/ng-management?ng=${n.id}`)}>
                        <TableCell sx={{ fontWeight: 700, color: "#F04438" }}>{n.ng_no}</TableCell><TableCell>{n.source}</TableCell><TableCell>{ddmmhhmm(n.detected_at)}</TableCell>
                        <TableCell align="right">—</TableCell><TableCell align="right">{n.ng_qty}</TableCell><TableCell>{n.defect_name}</TableCell><TableCell>{label("ngStatus", n.status)}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : null}
              {tab === "shipment" ? <Alert severity="info" sx={{ m: 1 }}>{tx("Packing & shipping is not integrated with the MES yet. Customer from the production order")}: <b>{lot.customer_name || EMPTY}</b></Alert> : null}
            </Box>
          )}
        </Paper>

        <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "3" }, gridRow: { lg: "2" } }}>
          <Head title={tx("Product Images")} />
          <Box sx={{ flex: 1, minHeight: 0, px: 1.5, pb: 1.25, display: "flex", gap: 0.75 }}>
            <Box sx={{ flex: 1, minWidth: 0, borderRadius: 1.5, bgcolor: "action.hover", display: "grid", placeItems: "center", overflow: "hidden" }}>
              {images.length ? <Box component="img" src={resolveImageUrl(images[img]?.url)} alt="" sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                : <Stack sx={{ alignItems: "center" }}><Inventory2OutlinedIcon sx={{ fontSize: 34, color: "#98A2B3" }} /><Typography variant="caption" color="text.secondary">{tx("No image in Product / Mold Master")}</Typography></Stack>}
            </Box>
            {images.length > 1 ? <Stack spacing={0.75} sx={{ overflow: "auto" }}>{images.map((x, i) => (
              <Box key={i} component="img" src={resolveImageUrl(x.url)} onClick={() => setImg(i)} sx={{ width: 44, height: 44, flexShrink: 0, objectFit: "cover", borderRadius: 1, border: 2, borderColor: i === img ? "#1570EF" : "divider", cursor: "pointer" }} />
            ))}</Stack> : null}
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "3" }, gridRow: { lg: "3" } }}>
          <Head title={tx("Trace Timeline")} />
          {data ? <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1 }}><TraceTimeline events={[...data.timeline].reverse()} /></Box> : <EmptyBody text={tx("No data.")} />}
        </Paper>

        <Box sx={{ gridColumn: { lg: "4" }, gridRow: { lg: "3" }, display: "flex", minHeight: 0, "& > *": { flex: 1 } }}>
          <QuickCard title={tx("Quick Actions")} actions={quick} columns={3} />
        </Box>
      </Box>
      {history ? <HistoryDialog rows={sum.data?.history || []} onClose={() => setHistory(false)} onPick={(r) => { setHistory(false); setBy("LOT"); setKey(r.result_ref); trace({ by: "LOT", key: r.result_ref }); }} /> : null}
    </TraceFrame>
  );
}
