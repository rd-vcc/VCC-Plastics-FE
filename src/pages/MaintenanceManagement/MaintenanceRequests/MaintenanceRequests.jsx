import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, InputAdornment, MenuItem, Paper, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField } from "@mui/material";
import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SummarizeOutlinedIcon from "@mui/icons-material/SummarizeOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";

import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, colShares, downloadExcel } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, btn, ddmmhhmm, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { EmptyBody, FilterToggle, QuickCard, cellsSx, fillSx, fitGridSx, panelSx, who } from "../../shared/onePage";
import { label, tx, txs } from "../maintLocales";
import { DonutCard, MaintFrame, useMaintData, useMaintPage } from "../maintPage";
import {
  SEL,
  AssetCell, Attachments, InfoRows, MAINT_API, NoteDialog, PRIORITY_COLORS, PriorityPill, REQ_STATUS_COLORS, ReqStatusPill, RequestDialog, TYPE_COLORS, Timeline,
  TypePill, WoDialog, assetPath, woPath,
} from "../maintUi";

const TABS = ["ALL", "NEW", "IN_REVIEW", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"];

export default function MaintenanceRequests() {
  const page = useMaintPage();
  const { navigate, params, setParams, dark, axisColor, tableSx, canEdit, lookups, request, actor, notify } = page;
  const [dialog, setDialog] = useState(() => (params.get("create") ? { type: "create", preset: { asset_type: params.get("asset_type"), asset_id: Number(params.get("asset_id")) || "" } } : null));
  const { data, loading, lastUpdate, live, setLive, load } = useMaintData(page, `${MAINT_API}/requests`, { paused: Boolean(dialog) });
  const [tab, setTab] = useState("ALL");
  const [f, setF] = useState({ q: "", type: "", priority: "", source: "", from: "", to: "" });
  const [selectedId, setSelectedId] = useState(Number(params.get("request")) || null);
  const [detail, setDetail] = useState(null);
  const [dtab, setDtab] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const all = data?.items || [];
  const items = useMemo(() => all.filter((r) => (tab === "ALL" || r.status === tab) && (!f.type || r.request_type === f.type) && (!f.priority || r.priority === f.priority)
    && (!f.source || r.source === f.source) && (!f.from || r.created_at.slice(0, 10) >= f.from) && (!f.to || r.created_at.slice(0, 10) <= f.to)
    && (!f.q || `${r.request_no} ${r.asset_code} ${r.asset_name} ${r.short_description} ${r.requested_by}`.toLowerCase().includes(f.q.toLowerCase()))), [all, tab, f]);
  const loadDetail = useCallback(() => { if (selectedId) request(`${MAINT_API}/requests/${selectedId}`).then(setDetail).catch(() => setDetail(null)); else setDetail(null); }, [selectedId, request]);
  useEffect(() => { loadDetail(); }, [loadDetail, lastUpdate]);
  useEffect(() => { if (!selectedId && items.length) setSelectedId(items[0].id); }, [items, selectedId]);
  const k = data?.kpis || {};
  const r = detail?.id === selectedId ? detail : null;
  const refresh = () => { load({ silent: true }); loadDetail(); };
  const act = async (action, note) => {
    try { await request(`${MAINT_API}/requests/${r.id}/${action}`, { method: "POST", body: JSON.stringify({ note, actor, version: r.version }) }); notify("success", tx("Saved.")); setDialog(null); refresh(); }
    catch (e) { notify("error", e.message); }
  };
  const selSx = { minWidth: 140 };
  const count = (s) => (s === "ALL" ? all.length : all.filter((x) => x.status === s).length);
  const exportCsv = () => downloadExcel("maintenance-requests.csv", ["Request No.", "Date", "Requested by", "Asset", "Type", "Priority", "Status", "Source", "Description", "WO"],
    items.map((x) => [x.request_no, x.created_at, x.requested_by, x.asset_code, x.request_type, x.priority, x.status, x.source, x.short_description, x.wo_no]));
  const quick = [
    [txs("New request (short)", "Create Request"), NoteAddOutlinedIcon, "#1570EF", () => setDialog({ type: "create" }), !canEdit],
    [txs("PM calendar (short)", "PM Calendar"), CalendarMonthOutlinedIcon, "#F79009", () => navigate("/maintenance-management/planning"), false],
    [txs("Equipment (short)", "Equipment List"), PrecisionManufacturingOutlinedIcon, "#12B76A", () => navigate("/machine-equipment/machine-monitoring"), false],
    [tx("Mold List"), GridViewOutlinedIcon, "#7A5AF8", () => navigate("/mold-management/list"), false],
    [txs("Reports (short)", "Reports"), SummarizeOutlinedIcon, "#F04438", () => navigate("/maintenance-management/history"), false],
    [tx("Maintenance Overview"), HistoryOutlinedIcon, "#0E9384", () => navigate("/maintenance-management/overview"), false],
  ];
  const entries = (obj, group, keys) => (keys || Object.keys(obj || {})).map((key) => [key, obj?.[key] || 0, label(group, key)]).filter(([, n]) => n);
  const activeFilters = Object.values(f).filter(Boolean).length;
  const filters = showFilter ? (
    <>
      <TextField size="small" placeholder={tx("Search...")} value={f.q} onChange={set("q")} sx={{ width: 220 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
      <TextField select size="small" slotProps={SEL} label={tx("Request Type")} value={f.type} onChange={set("type")} sx={selSx}><MenuItem value="">{tx("All")}</MenuItem>{(lookups?.request_types || []).map((t) => <MenuItem key={t} value={t}>{label("requestType", t)}</MenuItem>)}</TextField>
      <TextField select size="small" slotProps={SEL} label={tx("Priority")} value={f.priority} onChange={set("priority")} sx={selSx}><MenuItem value="">{tx("All")}</MenuItem>{(lookups?.priorities || []).map((t) => <MenuItem key={t} value={t}>{label("priority", t)}</MenuItem>)}</TextField>
      <TextField select size="small" slotProps={SEL} label={tx("Source")} value={f.source} onChange={set("source")} sx={selSx}><MenuItem value="">{tx("All")}</MenuItem>{(lookups?.sources || []).map((t) => <MenuItem key={t} value={t}>{label("source", t)}</MenuItem>)}</TextField>
      <TextField size="small" type="date" label={tx("Date from")} value={f.from} onChange={set("from")} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 150 }} />
      <TextField size="small" type="date" label={tx("Date to")} value={f.to} onChange={set("to")} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 150 }} />
    </>
  ) : null;
  const donutBox = (list, colors) => (list.length ? (
    <Box sx={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center" }}><Box sx={{ width: "100%" }}><DonutCard entries={list} colors={colors} dark={dark} axisColor={axisColor} height={140} size={130} /></Box></Box>
  ) : <EmptyBody text={tx("No data.")} />);

  return (
    <MaintFrame fit page={page} title={tx("Maintenance Requests")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} system={data?.system} filters={filters}
      toolbar={<FilterToggle label={tx("Filter")} open={showFilter} count={activeFilters} onClick={() => setShowFilter((v) => !v)} />}>
      {data ? (
        <>
          <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))", xl: "repeat(6, minmax(0,1fr))" }}>
            <KpiTile tone="primary" title={tx("Total Requests")} value={num(k.total)} sub={`${k.today || 0} ${tx("today")}`} icon={DescriptionOutlinedIcon} onClick={() => setTab("ALL")} />
            <KpiTile tone="success" title={tx("New Requests")} value={num(k.new)} sub="" icon={NoteAddOutlinedIcon} onClick={() => setTab("NEW")} />
            <KpiTile tone="warning" title={tx("In Review")} value={num(k.in_review)} sub="" icon={PersonSearchOutlinedIcon} onClick={() => setTab("IN_REVIEW")} />
            <KpiTile tone="accent" title={tx("Approved")} value={num(k.approved)} sub="" icon={TaskAltOutlinedIcon} onClick={() => setTab("APPROVED")} />
            <KpiTile tone="danger" title={tx("Rejected")} value={num(k.rejected)} sub="" icon={HighlightOffOutlinedIcon} onClick={() => setTab("REJECTED")} />
            <KpiTile tone="info" title={tx("Completed")} value={num(k.completed)} sub="" icon={CheckCircleOutlineIcon} onClick={() => setTab("COMPLETED")} />
          </KpiCardGroup>

          <Box sx={{ ...fitGridSx, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" }, gridTemplateRows: { lg: "minmax(0,1fr) minmax(0,1fr) minmax(0,0.85fr)" } }}>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 4" }, gridRow: { lg: "1 / 3" }, minHeight: { xs: 360, lg: 0 } }}>
              <Head title={tx("Request List")} action={(
                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                  {/* status chips are the list's status filter */}
                  {TABS.map((s) => {
                    const on = tab === s;
                    const color = s === "ALL" ? "#1570EF" : REQ_STATUS_COLORS[s];
                    return (
                      <Box key={s} component="button" type="button" onClick={() => setTab(s)}
                        sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, height: 22, px: 0.75, borderRadius: 1, cursor: "pointer", font: "inherit", fontSize: 10.5, fontWeight: 700,
                          border: 1, borderColor: on ? color : "divider", bgcolor: on ? `${color}1A` : "background.paper", color: "text.primary" }}>
                        {s === "ALL" ? tx("All") : label("requestStatus", s)}<Box component="span" sx={{ color, fontWeight: 800 }}>{count(s)}</Box>
                      </Box>
                    );
                  })}
                </Stack>
              )} />
              {items.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(10, 9, 13, 16, 9, 8, 10, 16, 9) }}>
                    <TableHead><TableRow>
                      <TableCell>{tx("Request No.")}</TableCell><TableCell>{tx("Requested Date")}</TableCell><TableCell>{tx("Requested By")}</TableCell><TableCell>{tx("Equipment / Mold / Tool")}</TableCell>
                      <TableCell align="center">{tx("Type")}</TableCell><TableCell align="center">{tx("Priority")}</TableCell><TableCell align="center">{tx("Status")}</TableCell><TableCell>{tx("Short Description")}</TableCell><TableCell>{tx("Work Order")}</TableCell>
                    </TableRow></TableHead>
                    <TableBody>{items.map((x) => (
                      <TableRow key={x.id} hover selected={x.id === selectedId} onClick={() => { setSelectedId(x.id); setDtab(0); }} sx={{ cursor: "pointer" }}>
                        <TableCell sx={{ fontWeight: 800, color: "#1570EF" }}>{x.request_no}</TableCell><TableCell>{ddmmhhmm(x.created_at)}</TableCell><TableCell title={who(x.requested_by)}>{who(x.requested_by)}</TableCell>
                        <TableCell title={`${x.asset_code} · ${x.asset_name}`}><b>{x.asset_code}</b> · {x.asset_name}</TableCell>
                        <TableCell align="center"><TypePill value={x.request_type} group="requestType" /></TableCell><TableCell align="center"><PriorityPill value={x.priority} /></TableCell>
                        <TableCell align="center"><ReqStatusPill value={x.status} /></TableCell>
                        <TableCell title={x.short_description}>{x.short_description}</TableCell>
                        <TableCell>{x.wo_no ? <Box component="span" sx={{ color: "#1570EF", fontWeight: 700 }} onClick={(e) => { e.stopPropagation(); navigate(woPath({ asset_type: x.asset_type, id: x.work_order_id })); }}>{x.wo_no}</Box> : EMPTY}</TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "4" }, gridRow: { lg: "1 / 3" }, minHeight: { xs: 360, lg: 0 } }}>
              <Head title={tx("Request Detail")} subtitle={r ? r.request_no : ""} action={r ? <ReqStatusPill value={r.status} /> : null} />
              {!r ? <EmptyBody text={tx("Select a row in the list.")} /> : (
                <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", px: 1.5, pb: 1.25 }}>
                  <Tabs value={dtab} onChange={(_, v) => setDtab(v)} sx={{ minHeight: 27, mb: 1, borderBottom: 1, borderColor: "divider", "& .MuiTab-root": { minHeight: 27, py: 0, textTransform: "none", fontSize: 11, fontWeight: 700 } }}>
                    <Tab label={tx("Information")} /><Tab label={`${tx("History")} (${r.events.length})`} /><Tab label={`${tx("Attachments")} (${r.attachments.length})`} />
                  </Tabs>
                  <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                    {dtab === 0 ? (
                      <InfoRows rows={[[tx("Priority"), <PriorityPill key="p" value={r.priority} />],
                        [tx("Request Type"), label("requestType", r.request_type)], [tx("Source"), label("source", r.source)], [tx("Requested By"), who(r.requested_by)], [tx("Requested Date"), ddmmhhmm(r.created_at)],
                        [tx("Equipment / Mold / Tool"), <Box key="a" component="span" sx={{ color: assetPath(r.asset_type, r.asset_id) ? "#1570EF" : undefined, cursor: "pointer" }}
                          onClick={() => assetPath(r.asset_type, r.asset_id) && navigate(assetPath(r.asset_type, r.asset_id))}>{r.asset_code} · {r.asset_name}</Box>],
                        [tx("Location"), r.asset_location], [tx("Department"), r.department], [tx("Short Description"), r.short_description], [tx("Detail Description"), r.description],
                        [tx("Required Date"), ddmmhhmm(r.required_date)], r.reject_reason ? [tx("Reason"), r.reject_reason, "#F04438"] : null,
                        r.wo_no ? [tx("Work Order"), <Box key="w" component="span" sx={{ color: "#1570EF", cursor: "pointer", fontWeight: 700 }} onClick={() => navigate(woPath({ asset_type: r.asset_type, id: r.work_order_id }))}>{r.wo_no} · {label("woStatus", r.wo_status)}</Box>] : null]} />
                    ) : null}
                    {dtab === 1 ? <Timeline events={r.events} /> : null}
                    {dtab === 2 ? <Attachments owner="requests" ownerId={r.id} items={r.attachments} request={request} actor={actor} canEdit={canEdit} onChanged={loadDetail} notify={notify} /> : null}
                  </Box>
                  {canEdit ? (
                    <Stack direction="row" sx={{ gap: 0.75, flexWrap: "wrap", mt: 1, pt: 1, borderTop: 1, borderColor: "divider" }}>
                      {["NEW", "IN_REVIEW"].includes(r.status) ? <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => setDialog({ type: "edit" })} sx={btn("cancel")}>{tx("Edit")}</Button> : null}
                      {r.status === "NEW" ? <Button size="small" startIcon={<FactCheckOutlinedIcon />} onClick={() => act("REVIEW")} sx={btn("cancel")}>{tx("Review")}</Button> : null}
                      {["NEW", "IN_REVIEW"].includes(r.status) ? <Button size="small" startIcon={<TaskAltOutlinedIcon />} onClick={() => act("APPROVE")} sx={{ ...btn("cancel"), color: "#12B76A" }}>{tx("Approve")}</Button> : null}
                      {["NEW", "IN_REVIEW"].includes(r.status) ? <Button size="small" startIcon={<HighlightOffOutlinedIcon />} onClick={() => setDialog({ type: "reject" })} sx={{ ...btn("cancel"), color: "#F04438" }}>{tx("Reject")}</Button> : null}
                      {["NEW", "IN_REVIEW", "APPROVED"].includes(r.status) && !r.work_order_id ? <Button size="small" startIcon={<CancelOutlinedIcon />} onClick={() => setDialog({ type: "cancel" })} sx={btn("delete")}>{tx("Cancel Request")}</Button> : null}
                      {["NEW", "IN_REVIEW", "APPROVED"].includes(r.status) && !r.work_order_id ? <Button size="small" fullWidth startIcon={<AddTaskOutlinedIcon />} onClick={() => setDialog({ type: "wo" })} sx={btn("primary")}>{tx("Create Work Order")}</Button> : null}
                    </Stack>
                  ) : null}
                </Box>
              )}
            </Paper>

            <Paper elevation={0} sx={panelSx}><Head title={tx("Requests by Type")} />{donutBox(entries(data.by_type, "requestType", lookups?.request_types), TYPE_COLORS)}</Paper>
            <Paper elevation={0} sx={panelSx}><Head title={tx("Requests by Priority")} />{donutBox(entries(data.by_priority, "priority", ["HIGH", "MEDIUM", "LOW"]), PRIORITY_COLORS)}</Paper>
            <Paper elevation={0} sx={panelSx}><Head title={tx("Requests by Source")} />{donutBox(entries(data.by_source, "source", lookups?.sources), {})}</Paper>
            <Box sx={{ display: "flex", minHeight: 0, "& > *": { flex: 1 } }}><QuickCard title={tx("Quick Actions")} actions={quick} columns={3} /></Box>
          </Box>

          {dialog?.type === "create" ? <RequestDialog lookups={lookups} preset={dialog.preset} request={request} actor={actor} notify={notify}
            onClose={() => { setDialog(null); if (params.get("create")) setParams({}); }} onSaved={() => { setDialog(null); if (params.get("create")) setParams({}); load({ silent: true }); }} /> : null}
          {dialog?.type === "edit" && r ? <RequestDialog lookups={lookups} item={r} request={request} actor={actor} notify={notify} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); refresh(); }} /> : null}
          {dialog?.type === "reject" ? <NoteDialog title={tx("Reject")} danger onClose={() => setDialog(null)} onSubmit={({ note }) => act("REJECT", note)} /> : null}
          {dialog?.type === "cancel" ? <NoteDialog title={tx("Cancel Request")} danger onClose={() => setDialog(null)} onSubmit={({ note }) => act("CANCEL", note)} /> : null}
          {dialog?.type === "wo" && r ? <WoDialog mode="from-request" lookups={lookups} item={r} request={request} actor={actor} notify={notify} onClose={() => setDialog(null)}
            onSaved={(id) => { setDialog(null); refresh(); if (id) navigate(woPath({ asset_type: r.asset_type, id })); }} /> : null}
        </>
      ) : null}
    </MaintFrame>
  );
}
