import "./locales";
import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, FormControlLabel, LinearProgress, Paper, Stack, Switch, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Typography } from "@mui/material";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import FactoryOutlinedIcon from "@mui/icons-material/FactoryOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import SearchIcon from "@mui/icons-material/Search";
import StoreOutlinedIcon from "@mui/icons-material/StoreOutlined";
import TableViewOutlinedIcon from "@mui/icons-material/TableViewOutlined";
import ThermostatOutlinedIcon from "@mui/icons-material/ThermostatOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import TrackChangesOutlinedIcon from "@mui/icons-material/TrackChangesOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";

import { resolveImageUrl } from "../../../components/common/ImageUploadField";
import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, downloadCsv } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, btn, cardSx, ddmmhhmm, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { QuickActionGrid } from "../../MaintenanceManagement/maintUi";
import { label, tx } from "../traceLocales";
import {
  Chain, Documents, HistoryDialog, KeyGrid, Link, SearchPanel, StatusPill, TRACE_API, TraceFrame, TraceTimeline, dateText, qty, refPath, useTraceData, useTracePage, vsYesterday,
} from "../traceUi";

const ICONS = { SUPPLIER: LocalShippingOutlinedIcon, IQC: FactCheckOutlinedIcon, WAREHOUSE: StoreOutlinedIcon, DRYING: ThermostatOutlinedIcon, MACHINE: PrecisionManufacturingOutlinedIcon,
  PRODUCTION: FactoryOutlinedIcon, INSPECTION: FactCheckOutlinedIcon, FINISHED: Inventory2OutlinedIcon };
const OPTIONS = ["LOT", "BARCODE", "CODE", "SUPPLIER_LOT", "SUPPLIER"];

export default function MaterialTraceability() {
  const page = useTracePage();
  const { navigate, params, setParams, tableSx, lookups, request, actor, notify } = page;
  const [by, setBy] = useState("LOT");
  const [key, setKey] = useState(params.get("lot") || "");
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("usage");
  const [forward, setForward] = useState(true);
  const [history, setHistory] = useState(false);
  const sum = useTraceData(page, `${TRACE_API}/summary/material`, { interval: 60000 });
  const trace = useCallback(async (q) => {
    setBusy(true);
    try {
      const r = await request(`${TRACE_API}/material?${new URLSearchParams({ actor, ...q })}`);
      if (!r.found) { notify("warning", tx("No material lot found for this key.")); setData(null); } else setData(r);
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
  const st = data?.statistics || {};
  const suggestions = by === "CODE" ? lookups?.material_codes : by === "SUPPLIER" ? lookups?.suppliers : by === "SUPPLIER_LOT" ? lookups?.supplier_lots : lookups?.material_lots;
  const journey = data ? (forward ? data.journey : data.journey.slice(0, 3)) : [];
  const exportCsv = () => data && downloadCsv(`material-trace-${lot.lot_no}.csv`, ["Work Order", "Product Lot", "Machine", "Mold", "Production date", `Consumed (${st.unit})`, "Good qty", `Scrap (${st.unit})`, "Operator", "Quality", "Customer"],
    data.usage.map((u) => [u.wo_no, u.product_lot, u.machine_code, u.mold_code, u.production_date, u.consumed, u.good_qty, u.scrap, u.operator, u.quality_status, u.customer]));
  const quick = [
    [tx("New Trace"), AddBoxOutlinedIcon, "#1570EF", () => { setData(null); setKey(""); setParams({}, { replace: true }); }],
    [tx("Advanced Search"), SearchIcon, "#7A5AF8", () => setBy("SUPPLIER_LOT")],
    [tx("Product Trace"), Inventory2OutlinedIcon, "#12B76A", () => navigate(data?.product_lots?.[0] ? `/traceability/product?lot_id=${data.product_lots[0].id}` : "/traceability/product")],
    [tx("Lot Genealogy"), AccountTreeOutlinedIcon, "#2E90FA", () => navigate(lot ? `/traceability/lot-genealogy?by=MATERIAL_LOT&key=${lot.lot_no}` : "/traceability/lot-genealogy")],
    [tx("Export Report"), TableViewOutlinedIcon, "#0E9384", exportCsv, !data],
    [tx("Print Report"), PrintOutlinedIcon, "#475467", () => window.print(), !data],
  ];
  const toolbar = (
    <>
      <Button startIcon={<AddBoxOutlinedIcon />} onClick={() => { setData(null); setKey(""); setParams({}, { replace: true }); }} sx={btn("cancel")}>{tx("New Trace")}</Button>
      <Button startIcon={<HistoryOutlinedIcon />} onClick={() => setHistory(true)} sx={btn("cancel")}>{tx("History")}</Button>
    </>
  );

  return (
    <TraceFrame page={page} title={tx("Material Traceability")} loading={busy || sum.loading} ready={Boolean(sum.data)} lastUpdate={sum.lastUpdate} onRefresh={() => sum.load()}
      onExport={exportCsv} toolbar={toolbar} system={sum.data?.system}>
      <Box sx={{ mb: 1.5 }}>
        <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))", xl: "repeat(5, minmax(0,1fr))" }}>
          <KpiTile tone="primary" title={tx("Trace Success Rate (Today)")} value={k.today?.success != null ? num(k.today.success, 1) : EMPTY} unit={k.today?.success != null ? "%" : ""}
            sub={vsYesterday(k.today?.success, k.yesterday?.success, "%")} icon={VerifiedUserOutlinedIcon} />
          <KpiTile tone="success" title={tx("Total Traces (Today)")} value={num(k.today?.total)} sub={`${tx("yesterday")}: ${num(k.yesterday?.total)}`} icon={TrackChangesOutlinedIcon} onClick={() => setHistory(true)} />
          <KpiTile tone="accent" title={tx("Materials Traced (Today)")} value={num(k.today?.objects)} sub={`${num(k.used_material_lots)}/${num(k.material_lots)} ${tx("lots used in production")}`} icon={ScienceOutlinedIcon} />
          <KpiTile tone="warning" title={tx("Avg. Trace Time")} value={k.today?.avg_sec != null ? num(k.today.avg_sec, 2) : EMPTY} unit={k.today?.avg_sec != null ? "s" : ""}
            sub={vsYesterday(k.today?.avg_sec, k.yesterday?.avg_sec, " s")} icon={TimerOutlinedIcon} />
          <KpiTile tone="info" title={tx("Forward Trace Lots")} value={data ? num(data.product_lots.length) : EMPTY} sub={data ? `${tx("from")} ${lot.lot_no}` : tx("search a material lot")} icon={Inventory2OutlinedIcon} />
        </KpiCardGroup>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1fr) 400px" }, gap: 1.5 }}>
        <Stack spacing={1.5} sx={{ minWidth: 0 }}>
          <SearchPanel options={OPTIONS} by={by} setBy={setBy} value={key} setValue={setKey} suggestions={suggestions} onSearch={search}
            tips={[tx("Search by material lot no., material code, barcode / QR, supplier lot or supplier."), tx("Forward trace shows every work order and product lot that used the lot.")]} />
          {busy ? <LinearProgress /> : null}
          {!data ? <Alert severity="info">{tx("Enter a material lot, material code or supplier lot to trace.")}</Alert> : (
            <>
              {data.candidates?.length > 1 ? (
                <Alert severity="info" sx={{ py: 0 }}>
                  {tx("{n} lots match", { n: data.candidates.length })}: {data.candidates.map((c) => (
                    <Typography key={c.id} component="span" variant="caption" sx={{ mr: 1.5, cursor: "pointer", color: c.id === lot.id ? "text.primary" : "#1570EF", fontWeight: 700 }}
                      onClick={() => trace({ lot_id: c.id })}>{c.lot_no}</Typography>))}
                </Alert>
              ) : null}
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Material Journey (Backward & Forward Traceability)")}
                  action={<FormControlLabel control={<Switch size="small" checked={forward} onChange={(e) => setForward(e.target.checked)} />} label={<Typography variant="caption" fontWeight={700}>{tx("Show Forward Trace")}</Typography>} />} />
                <Box sx={{ px: 1.5, pb: 1.5 }}><Chain nodes={journey} icons={ICONS} navigate={navigate} /></Box>
              </Paper>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1fr) 300px" }, gap: 1.5 }}>
                <Paper elevation={0} sx={cardSx}>
                  <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" sx={{ px: 1, minHeight: 38, "& .MuiTab-root": { minHeight: 38, textTransform: "none", fontWeight: 700 } }}>
                    <Tab value="usage" label={`${tx("Usage in Production")} (${data.usage.length})`} /><Tab value="stock" label={tx("Stock Movement")} />
                    <Tab value="qc" label={tx("QC & Inspection")} /><Tab value="docs" label={tx("Related Documents")} /><Tab value="forward" label={tx("Forward Trace")} />
                  </Tabs>
                  <Box sx={{ px: 1, pb: 1, height: 340, overflow: "auto" }}>
                    {tab === "usage" ? (
                      <Table size="small" stickyHeader sx={tableSx}>
                        <TableHead><TableRow><TableCell>#</TableCell><TableCell>{tx("Work Order")}</TableCell><TableCell>{tx("Product Lot")}</TableCell><TableCell>{tx("Machine")}</TableCell>
                          <TableCell>{tx("Mold")}</TableCell><TableCell>{tx("Production Date")}</TableCell><TableCell align="right">{tx("Consumed")} ({st.unit})</TableCell>
                          <TableCell align="right">{tx("Good Qty (pcs)")}</TableCell><TableCell align="right">{tx("Scrap")} ({st.unit})</TableCell><TableCell>{tx("Operator")}</TableCell><TableCell>{tx("Quality")}</TableCell></TableRow></TableHead>
                        <TableBody>{data.usage.map((u, i) => (
                          <TableRow key={`${u.work_order_id}-${u.product_lot_id}`}>
                            <TableCell>{i + 1}</TableCell><TableCell><Link navigate={navigate} to={refPath({ type: "WO", id: u.work_order_id })}>{u.wo_no}</Link></TableCell>
                            <TableCell>{u.product_lot ? <Link navigate={navigate} to={refPath({ type: "PRODUCT_LOT", id: u.product_lot_id })}>{u.product_lot}</Link> : EMPTY}</TableCell>
                            <TableCell>{u.machine_code || EMPTY}</TableCell><TableCell>{u.mold_code || EMPTY}</TableCell><TableCell>{dateText(u.production_date)} {u.shift_name ? `· ${u.shift_name}` : ""}</TableCell>
                            <TableCell align="right">{num(u.consumed, 3)}</TableCell><TableCell align="right">{num(u.good_qty)}</TableCell><TableCell align="right">{num(u.scrap, 3)}</TableCell>
                            <TableCell>{u.operator || EMPTY}</TableCell><TableCell><StatusPill value={u.quality_status} width={84} /></TableCell></TableRow>
                        ))}</TableBody>
                      </Table>
                    ) : null}
                    {tab === "stock" ? (
                      <Table size="small" stickyHeader sx={tableSx}>
                        <TableHead><TableRow><TableCell>{tx("Time")}</TableCell><TableCell>{tx("Transaction")}</TableCell><TableCell align="right">{tx("Qty")}</TableCell><TableCell align="right">{tx("Balance")}</TableCell>
                          <TableCell>{tx("From → To")}</TableCell><TableCell>{tx("Work Order")}</TableCell><TableCell>{tx("Machine")}</TableCell><TableCell>{tx("User")}</TableCell></TableRow></TableHead>
                        <TableBody>{data.transactions.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell>{ddmmhhmm(t.acted_at)}</TableCell><TableCell sx={{ fontWeight: 700 }}>{label("event", `MAT_${t.txn_type}`)}</TableCell>
                            <TableCell align="right" sx={{ color: Number(t.qty_change) < 0 ? "#F04438" : "#12B76A" }}>{num(t.qty_change, 3)}</TableCell><TableCell align="right">{num(t.qty_after, 3)}</TableCell>
                            <TableCell>{[t.from_code, t.to_code].filter(Boolean).join(" → ") || EMPTY}</TableCell><TableCell>{t.wo_no || EMPTY}</TableCell><TableCell>{t.machine_code || EMPTY}</TableCell><TableCell>{t.actor}</TableCell></TableRow>
                        ))}</TableBody>
                      </Table>
                    ) : null}
                    {tab === "qc" ? (
                      <Stack spacing={1} sx={{ p: 0.5 }}>
                        <Typography variant="caption">IQC: <StatusPill value={lot.iqc_result} width={100} /> {lot.iqc_by ? `· ${lot.iqc_by}` : ""} {lot.iqc_at ? `· ${ddmmhhmm(lot.iqc_at)}` : ""}</Typography>
                        <Table size="small" sx={tableSx}>
                          <TableHead><TableRow><TableCell>{tx("Plan / NG")}</TableCell><TableCell>{tx("Time")}</TableCell><TableCell>{tx("Result")}</TableCell><TableCell>{tx("Inspector")}</TableCell></TableRow></TableHead>
                          <TableBody>
                            {data.iqc.map((p) => (
                              <TableRow key={`p${p.id}`} hover sx={{ cursor: "pointer" }} onClick={() => navigate(refPath({ type: "INSPECTION", id: p.id }))}>
                                <TableCell sx={{ color: "#1570EF", fontWeight: 700 }}>{p.plan_no}</TableCell><TableCell>{ddmmhhmm(p.completed_at)}</TableCell>
                                <TableCell sx={{ color: p.result === "NG" ? "#F04438" : "#12B76A", fontWeight: 800 }}>{p.result || label("planStatus", p.status)}</TableCell><TableCell>{p.inspector}</TableCell></TableRow>
                            ))}
                            {data.ng.map((n) => (
                              <TableRow key={`n${n.id}`} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/quality-management/ng-management?ng=${n.id}`)}>
                                <TableCell sx={{ color: "#F04438", fontWeight: 700 }}>{n.ng_no}</TableCell><TableCell>{ddmmhhmm(n.detected_at)}</TableCell><TableCell>{n.defect_name} · {n.ng_qty}</TableCell><TableCell>{label("ngStatus", n.status)}</TableCell></TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {!data.iqc.length && !data.ng.length ? <Typography variant="caption" color="text.secondary">{tx("No incoming inspection recorded for this lot.")}</Typography> : null}
                      </Stack>
                    ) : null}
                    {tab === "docs" ? <Box sx={{ p: 1 }}><Documents docs={data.documents} navigate={navigate} /></Box> : null}
                    {tab === "forward" ? (
                      <Stack spacing={1} sx={{ p: 0.5 }}>
                        <Typography variant="caption">{tx("Customers affected")}: <b>{data.customers.join(", ") || EMPTY}</b> · {tx("Shipment data is not integrated yet: customers come from the production orders.")}</Typography>
                        <Table size="small" sx={tableSx}>
                          <TableHead><TableRow><TableCell>{tx("Product Lot")}</TableCell><TableCell>{tx("Work Order")}</TableCell><TableCell>{tx("Product")}</TableCell><TableCell align="right">{tx("Good Qty")}</TableCell><TableCell>{tx("Customer")}</TableCell><TableCell>{tx("Quality")}</TableCell></TableRow></TableHead>
                          <TableBody>{data.product_lots.map((p) => (
                            <TableRow key={p.id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(refPath({ type: "PRODUCT_LOT", id: p.id }))}>
                              <TableCell sx={{ color: "#1570EF", fontWeight: 700 }}>{p.lot_no}</TableCell><TableCell>{p.wo_no}</TableCell><TableCell>{p.product_name}</TableCell><TableCell align="right">{num(p.good_qty)}</TableCell>
                              <TableCell>{p.customer_short || p.customer_name || EMPTY}</TableCell><TableCell><StatusPill value={p.quality_status} width={84} /></TableCell></TableRow>
                          ))}</TableBody>
                        </Table>
                      </Stack>
                    ) : null}
                  </Box>
                </Paper>
                <Paper elevation={0} sx={cardSx}>
                  <Head title={tx("Trace Timeline")} />
                  <Box sx={{ px: 1.5, pb: 1.5, maxHeight: 340, overflow: "auto" }}><TraceTimeline events={data.timeline} /></Box>
                </Paper>
              </Box>
            </>
          )}
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Quick Actions")} />
            <Box sx={{ px: 1.5, pb: 1.5 }}><QuickActionGrid actions={quick} columns={{ xs: "repeat(2, 1fr)", md: "repeat(3, 1fr)", xl: "repeat(6, 1fr)" }} /></Box>
          </Paper>
        </Stack>

        <Paper elevation={0} sx={{ ...cardSx, alignSelf: "start" }}>
          <Head title={tx("Material Lot Detail")} />
          {!data ? <Typography variant="caption" color="text.secondary" sx={{ px: 1.5, pb: 1.5, display: "block" }}>{tx("No lot selected.")}</Typography> : (
            <Box sx={{ px: 1.5, pb: 1.5 }}>
              <Typography variant="caption" color="text.secondary">{tx("Material Lot No.")}</Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#1570EF" }}>{lot.lot_no}</Typography><StatusPill value={lot.status} group="matStatus" width={90} />
              </Stack>
              <Box sx={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 1.5, mb: 1.5 }}>
                <Box sx={{ width: 100, height: 100, borderRadius: 2, bgcolor: "action.hover", display: "grid", placeItems: "center", overflow: "hidden" }}>
                  {lot.material_image ? <Box component="img" src={resolveImageUrl(lot.material_image)} alt="" sx={{ maxWidth: "100%", maxHeight: "100%" }} /> : <ScienceOutlinedIcon sx={{ fontSize: 44, color: "#98A2B3" }} />}
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 1, rowGap: 0.3, alignContent: "start" }}>
                  {[[tx("Material Code"), lot.material_code], [tx("Material Name"), lot.material_name], [tx("Material Group"), lot.material_group], [tx("Unit"), lot.unit]]
                    .map(([a, b]) => [<Typography key={`${a}k`} variant="caption" color="text.secondary">{a}</Typography>, <Typography key={`${a}v`} variant="caption" fontWeight={700} sx={{ overflowWrap: "anywhere" }}>{b ?? EMPTY}</Typography>])}
                </Box>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 1.5, rowGap: 0.4, mb: 1.5 }}>
                {[[tx("Total Qty"), qty(lot.initial_qty, lot.unit)], [tx("Available Qty"), qty(Number(lot.current_qty) - Number(lot.reserved_qty || 0), lot.unit)], [tx("Supplier"), lot.supplier],
                  [tx("Supplier Lot No."), lot.supplier_lot_no], [tx("Received Date"), dateText(lot.received_at)], [tx("Expiry Date"), dateText(lot.expiry_date)],
                  [tx("Storage Location"), lot.location_code ? `${lot.location_code} · ${lot.location_name}` : EMPTY], lot.hold_reason ? [tx("Hold Reason"), lot.hold_reason] : null]
                  .filter(Boolean).map(([a, b]) => [<Typography key={`${a}k`} variant="caption" color="text.secondary">{a}</Typography>, <Typography key={`${a}v`} variant="caption" fontWeight={700}>{b ?? EMPTY}</Typography>])}
              </Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.75 }}>{tx("Key Information")}</Typography>
              <KeyGrid navigate={navigate} columns={3} items={[[tx("Source"), label("matSource", lot.source)], [tx("Warehouse"), lot.location_name], [tx("Material Group"), lot.material_group],
                [tx("Created By"), lot.created_by], [tx("Created Date"), dateText(lot.created_at)], [tx("Last Updated"), dateText(lot.updated_at)]]} />
              <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 1.5, mb: 0.75 }}>{tx("Related Statistics")}</Typography>
              <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5 }}>
                {[[tx("Total Received"), qty(st.received, st.unit)], [tx("Total Consumed"), qty(st.consumed, st.unit)], [tx("In Production"), qty(st.in_production, st.unit)],
                  [tx("Current Stock"), qty(st.current, st.unit)], [tx("Finished Products"), `${num(st.finished_pcs)} pcs`], [tx("Scrap / Waste (est.)"), qty(st.scrap, st.unit)],
                  [tx("Return to WH"), qty(st.returned, st.unit)]].map(([a, b], i) => (
                  <Stack key={a} direction="row" sx={{ justifyContent: "space-between", px: 1, py: 0.6, borderTop: i ? 1 : 0, borderColor: "divider" }}>
                    <Typography variant="caption">{a}</Typography><Typography variant="caption" fontWeight={800}>{b}</Typography></Stack>
                ))}
              </Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 1.5, mb: 0.75 }}>{tx("Related Documents")}</Typography>
              <Documents docs={data.documents} navigate={navigate} />
              <Stack direction="row" sx={{ mt: 1.5 }}><Link navigate={navigate} to={`/traceability/lot-genealogy?by=MATERIAL_LOT&key=${lot.lot_no}`}>{tx("Open Lot Genealogy")} →</Link></Stack>
            </Box>
          )}
        </Paper>
      </Box>
      {history ? <HistoryDialog rows={sum.data?.history || []} onClose={() => setHistory(false)} onPick={(r) => { setHistory(false); setBy("LOT"); setKey(r.result_ref); trace({ by: "LOT", key: r.result_ref }); }} /> : null}
    </TraceFrame>
  );
}
