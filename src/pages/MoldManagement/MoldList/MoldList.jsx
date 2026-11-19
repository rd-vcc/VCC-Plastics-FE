import "./locales";
import { useEffect, useMemo, useState } from "react";
import { Box, Button, FormControl, InputAdornment, InputLabel, MenuItem, Paper, Select, Slider, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import TimelapseOutlinedIcon from "@mui/icons-material/TimelapseOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";

import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, colShares, downloadExcel } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { EmptyBody, FilterToggle, QuickCard, cellsSx, fillSx, fitGridSx, panelSx } from "../../shared/onePage";
import { label, tx } from "../moldLocales";
import { MoldPageFrame, useMoldData, useMoldPage } from "../moldPage";
import { HealthBadge, InfoGrid, LOCATION_TYPES, LifeBar, MOLD_API, MOLD_STATUSES, MoldImage, MoldRowMenu, MoldStatusPill, dateText, lifeColor, locationText } from "../moldUi";

const EMPTY_FILTER = { status: "", location: "", machine: "", type: "", product: "", life: [0, 100], q: "" };

export default function MoldList() {
  const page = useMoldPage();
  const { navigate, tableSx, canEdit, lookups, params } = page;
  const { data, loading, lastUpdate, live, setLive, load } = useMoldData(page, `${MOLD_API}/summary`);
  const [f, setF] = useState(() => ({ ...EMPTY_FILTER, status: params.get("status") || "" }));
  const [selectedId, setSelectedId] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));

  const all = data?.items || [];
  const items = useMemo(() => all.filter((m) => {
    if (f.status && !(m.status === f.status || (f.status === "OUT_OF_SERVICE" && ["RETIRED", "SCRAPPED"].includes(m.status)))) return false;
    if (f.location && (f.location.startsWith("T:") ? m.location_type !== f.location.slice(2) : m.current_location_id !== Number(f.location.slice(2)))) return false;
    if (f.machine && m.current_machine_id !== f.machine) return false;
    if (f.type && m.mold_type !== f.type) return false;
    if (f.product && m.product_name !== f.product) return false;
    const life = m.life_used_pct ?? 0;
    if (life < f.life[0] || (f.life[1] < 100 && life > f.life[1])) return false;
    if (f.q && !`${m.mold_code} ${m.mold_name} ${m.product_name || ""} ${m.part_no || ""} ${m.machine_code || ""} ${m.location_label || ""}`.toLowerCase().includes(f.q.toLowerCase())) return false;
    return true;
  }), [all, f]);
  const k = data?.kpis || {};
  const total = k.total || 0;
  const pct = (n) => (total ? `${num((n / total) * 100, 1)}% ${tx("of total")}` : "");
  const sel = all.find((m) => m.id === selectedId);
  // the detail card is never empty: preselect the first mold of the list
  useEffect(() => { if (!selectedId && items.length) setSelectedId(items[0].id); }, [selectedId, items]);
  const products = [...new Set(all.map((m) => m.product_name).filter(Boolean))];
  const detailUrl = (id) => `/mold-management/detail?mold=${id}`;
  const withSel = (path) => `${path}${selectedId ? `?mold=${selectedId}` : ""}`;
  const exportCsv = () => downloadExcel("mold-list.csv", ["Mold No.", "Mold Name", "Type", "Cavity", "Product", "Machine", "Status", "Location", "Current shot", "Design shot", "Life used %", "Remaining shot", "PM due", "Health"],
    items.map((m) => [m.mold_code, m.mold_name, m.mold_type, m.cavity_count, m.product_name, m.machine_code, label("moldStatus", m.status), locationText(m), m.current_shot, m.design_shot, m.life_used_pct, m.remaining_shot, m.pm_due_date, m.health]));
  const quick = [
    [tx("View Detail"), VisibilityOutlinedIcon, "#1570EF", () => navigate(detailUrl(selectedId)), !selectedId],
    [tx("Mold Status"), FactCheckOutlinedIcon, "#F79009", () => navigate("/mold-management/status"), false],
    [tx("Shot Counter"), SpeedOutlinedIcon, "#7A5AF8", () => navigate(withSel("/mold-management/shot-counter")), false],
    [tx("Installation History"), HistoryOutlinedIcon, "#2E90FA", () => navigate(withSel("/mold-management/installation-history")), false],
    [tx("Move Location"), SwapHorizOutlinedIcon, "#12B76A", () => page.openAction("move", sel), !canEdit || !sel || Boolean(sel.current_machine_id)],
    [tx("Create PM Schedule"), CalendarMonthOutlinedIcon, "#F04438", () => navigate(`/maintenance-management/planning?create=1&asset_type=MOLD${selectedId ? `&asset_id=${selectedId}` : ""}`), false],
  ];
  const sel2 = (key, text, options, width = 150) => (
    <FormControl size="small" sx={{ minWidth: width }}><InputLabel shrink>{text}</InputLabel>
      <Select displayEmpty notched label={text} value={f[key]} onChange={set(key)}>
        <MenuItem value="">{tx("All")}</MenuItem>{options}
      </Select></FormControl>
  );
  const activeFilters = ["status", "location", "machine", "type", "product", "q"].filter((key) => f[key]).length + (f.life[0] > 0 || f.life[1] < 100 ? 1 : 0);
  const toolbar = <FilterToggle open={showFilter} count={activeFilters} onClick={() => setShowFilter((v) => !v)} label={tx("Filter")} />;
  const filters = showFilter ? (
    <>
      <TextField size="small" placeholder={tx("Search mold, product, machine...")} value={f.q} onChange={set("q")} sx={{ width: 230 }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
      {sel2("status", tx("Status"), [...MOLD_STATUSES.filter((s) => s !== "SCRAPPED"), "OUT_OF_SERVICE"].filter((s) => s !== "RETIRED").map((s) => <MenuItem key={s} value={s}>{label("moldStatus", s)}</MenuItem>))}
      {sel2("location", tx("Location"), [
        ...LOCATION_TYPES.map((t) => <MenuItem key={`T:${t}`} value={`T:${t}`}>{label("locationType", t)}</MenuItem>),
        ...(lookups?.locations || []).map((l) => <MenuItem key={`N:${l.id}`} value={`N:${l.id}`} sx={{ pl: 4 }}>{l.node_code} — {l.node_name}</MenuItem>)], 170)}
      {sel2("machine", tx("Machine"), (lookups?.machines || []).map((m) => <MenuItem key={m.id} value={m.id}>{m.equipment_code}</MenuItem>))}
      {sel2("type", tx("Mold Type"), (lookups?.mold_types || []).map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>))}
      {sel2("product", tx("Product"), products.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>), 170)}
      <Box sx={{ width: 200, px: 1 }}>
        <Typography variant="caption" color="text.secondary">{tx("Life Used (%) range")}: {f.life[0]}–{f.life[1]}%</Typography>
        <Slider size="small" value={f.life} min={0} max={100} step={5} onChange={(_, v) => setF((o) => ({ ...o, life: v }))} sx={{ py: 0.5 }} />
      </Box>
      <Button startIcon={<FilterAltOffOutlinedIcon />} onClick={() => setF(EMPTY_FILTER)} sx={{ textTransform: "none" }}>{tx("Clear")}</Button>
    </>
  ) : null;

  return (
    <MoldPageFrame fit page={page} title={tx("Mold List")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} toolbar={toolbar} filters={filters} system={data?.system} onChanged={() => load({ silent: true })}>
      {data ? (
        <>
          <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(4, minmax(0,1fr))", xl: "repeat(7, minmax(0,1fr))" }}>
            <KpiTile tone="primary" title={tx("Total Molds")} value={num(total)} sub="100%" icon={InventoryOutlinedIcon} onClick={() => setF(EMPTY_FILTER)} />
            <KpiTile tone="success" title={tx("Running")} value={num(k.running)} sub={pct(k.running)} icon={PlayCircleOutlineIcon} onClick={() => setF((o) => ({ ...o, status: "IN_PRODUCTION" }))} />
            <KpiTile tone="info" title={tx("Available")} value={num(k.available)} sub={pct(k.available)} icon={CheckCircleOutlineIcon} onClick={() => setF((o) => ({ ...o, status: "AVAILABLE" }))} />
            <KpiTile tone="accent" title={tx("In Maintenance")} value={num(k.maintenance)} sub={pct(k.maintenance)} icon={EngineeringOutlinedIcon} onClick={() => setF((o) => ({ ...o, status: "IN_MAINTENANCE" }))} />
            <KpiTile tone="danger" title={tx("In Repair")} value={num(k.repair)} sub={pct(k.repair)} icon={BuildCircleOutlinedIcon} onClick={() => setF((o) => ({ ...o, status: "IN_REPAIR" }))} />
            <KpiTile tone="warning" title={tx("Avg Life Used")} value={k.avg_life != null ? num(k.avg_life, 1) : EMPTY} unit={k.avg_life != null ? "%" : ""} sub={`${tx("Health")} ${k.avg_health ?? EMPTY}/100`} icon={TimelapseOutlinedIcon} />
            <KpiTile tone="danger" title={tx("PM Due (7 Days)")} value={num(k.pm_due_7d)} sub={tx("Need attention")} icon={CalendarMonthOutlinedIcon} />
          </KpiCardGroup>

          <Box sx={{ ...fitGridSx, gridTemplateColumns: { xs: "1fr", lg: "repeat(4, minmax(0,1fr))" }, gridTemplateRows: { lg: "minmax(0,1fr) 172px" } }}>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "1 / 4" }, gridRow: { lg: "1 / 3" }, minHeight: { xs: 360, lg: 0 } }}>
              <Head title={tx("Mold List")} action={<Typography variant="caption" color="text.secondary">{items.length} / {all.length} {tx("molds")}</Typography>} />
              {items.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(8, 15, 11, 7, 10.5, 8.5, 7.5, 8.5, 7.5, 7, 5.5, 4) }}>
                    <TableHead><TableRow>
                      {["Mold No.", "Mold Name", "Product", "Machine", "Status", "Location", "Current Shot", "Life Used (%)", "Remaining Shot", "PM Due Date", "Health Score", ""].map((h, i) => (
                        <TableCell key={h || i} align={["Current Shot", "Remaining Shot"].includes(h) ? "right" : ["Status", "Life Used (%)", "Health Score", ""].includes(h) ? "center" : "left"}>{h ? tx(h) : ""}</TableCell>))}
                    </TableRow></TableHead>
                    <TableBody>{items.map((m) => (
                      <TableRow key={m.id} hover selected={m.id === selectedId} onClick={() => setSelectedId(m.id)} onDoubleClick={() => navigate(detailUrl(m.id))} sx={{ cursor: "pointer" }}>
                        <TableCell sx={{ fontWeight: 800, color: "#1570EF" }}>{m.mold_code}</TableCell>
                        <TableCell title={m.mold_name}>{m.mold_name}</TableCell>
                        <TableCell title={m.product_name || ""}>{m.product_name || EMPTY}</TableCell>
                        <TableCell>{m.machine_code || EMPTY}</TableCell>
                        <TableCell align="center"><MoldStatusPill value={m.status} /></TableCell>
                        <TableCell title={m.location_label || ""}>{m.location_type === "MACHINE" ? label("locationType", "MACHINE") : m.location_label || <Box component="span" sx={{ color: "#F79009", fontWeight: 700 }}>{label("locationType", "NOT_ASSIGNED")}</Box>}</TableCell>
                        <TableCell align="right">{num(m.current_shot)}</TableCell>
                        <TableCell align="center"><LifeBar value={m.life_used_pct} width={80} /></TableCell>
                        <TableCell align="right">{num(m.remaining_shot)}</TableCell>
                        <TableCell sx={{ color: m.pm_overdue ? "#F04438" : undefined, fontWeight: m.pm_overdue ? 800 : 400 }}>{dateText(m.pm_due_date)}</TableCell>
                        <TableCell align="center"><HealthBadge value={m.health} /></TableCell>
                        <TableCell align="center" padding="none" sx={{ textOverflow: "clip !important" }}><MoldRowMenu mold={m} canEdit={canEdit} navigate={navigate} onAction={page.openAction} /></TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "4" }, gridRow: { lg: "1" } }}>
              <Head title={sel ? `${sel.mold_code} · ${sel.mold_name}` : tx("Mold Detail")} action={sel ? <MoldStatusPill value={sel.status} /> : null} />
              {sel ? (
                <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1.25, display: "flex", flexDirection: "column", gap: 1 }}>
                  <MoldImage src={sel.image_url} height={130} iconSize={64} />
                  <InfoGrid rows={[[tx("Mold Type"), sel.mold_type], [tx("Cavity"), sel.cavity_count], [tx("Product"), sel.product_name], [tx("Machine"), sel.machine_code],
                    [tx("Location"), locationText(sel)], [tx("Current Shot"), num(sel.current_shot)], [tx("Design Shot"), num(sel.design_shot)],
                    [tx("Remaining Shot"), num(sel.remaining_shot)], [tx("Life Used (%)"), sel.life_used_pct != null ? `${num(sel.life_used_pct, 1)}%` : null, lifeColor(sel.life_used_pct)],
                    [tx("PM Due Date"), dateText(sel.pm_due_date), sel.pm_overdue ? "#F04438" : undefined], [tx("Health Score"), sel.health != null ? `${sel.health}/100` : null]]} />
                </Box>
              ) : <EmptyBody text={tx("Select a mold in the list.")} />}
            </Paper>
            <Box sx={{ gridColumn: { lg: "4" }, gridRow: { lg: "2" }, display: "flex", minHeight: 0, "& > *": { flex: 1 } }}>
              <QuickCard title={tx("Quick Actions")} actions={quick} columns={3} />
            </Box>
          </Box>
        </>
      ) : null}
    </MoldPageFrame>
  );
}
