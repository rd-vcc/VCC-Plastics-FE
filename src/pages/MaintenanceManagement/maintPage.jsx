import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import { Alert, Box, Button, CircularProgress, FormControlLabel, LinearProgress, Paper, Snackbar, Stack, Switch, ThemeProvider as MuiThemeProvider, Typography } from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";

import { getCurrentUser } from "../../auth/auth";
import usePagePermission from "../../auth/usePagePermission";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useTheme as useAppTheme } from "../../context/ThemeContext";
import { useRequest } from "../MaterialManagement/materialUi";
import { EMPTY, btn, cardSx, num, pageTheme } from "../ProductionManagement/ProductionPlanning/ui";
import { SystemStatusBar } from "../ProductionManagement/WorkOrders/WorkOrderManagement/WoParts";
import { localeTag, setActiveLanguage, tx } from "./maintLocales";
import { CHART_COLORS, DonutLegend, MAINT_API } from "./maintUi";

export function useMaintPage() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  const { theme } = useAppTheme();
  const muiTheme = useMemo(() => pageTheme(theme), [theme]);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { canEdit } = usePagePermission();
  const u = getCurrentUser();
  const actor = u?.full_name ? `${u.full_name} (${u.employee_code})` : u?.employee_code || "SYSTEM";
  const request = useRequest();
  const [lookups, setLookups] = useState(null);
  const [msg, setMsg] = useState({ open: false, type: "success", text: "" });
  const notify = useCallback((type, text) => setMsg({ open: true, type, text }), []);
  useEffect(() => { request(`${MAINT_API}/lookups`).then(setLookups).catch(() => {}); }, [request]);
  const dark = theme === "dark";
  return {
    language, dark, muiTheme, navigate, params, setParams, canEdit, actor, request, lookups, msg, setMsg, notify,
    axisColor: dark ? "#A7B0C0" : "#667085", grid: { borderColor: dark ? "#263244" : "#EEF2F6" },
    tableSx: { "& td, & th": { fontSize: 11.5, px: 0.75, py: 0.5, whiteSpace: "nowrap" }, "& th": { color: "text.secondary", fontWeight: 800, bgcolor: "background.paper" } },
  };
}

export function useMaintData(page, url, { interval = 30000, paused } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [live, setLive] = useState(true);
  const { request, notify } = page;
  const load = useCallback(async ({ silent } = {}) => {
    if (!url) return;
    if (!silent) setLoading(true);
    try { setData(await request(url)); setLastUpdate(new Date()); } catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [url, request, notify]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!live) return undefined;
    const t = setInterval(() => { if (!paused) load({ silent: true }); }, interval);
    return () => clearInterval(t);
  }, [live, load, interval, paused]);
  return { data, loading, lastUpdate, live, setLive, load };
}

export function MaintFrame({ page, title, loading, ready, lastUpdate, live, setLive, onRefresh, onExport, toolbar, actions, system, children }) {
  const toolBtnSx = { ...btn("cancel"), bgcolor: "background.paper", border: 1, borderColor: "divider" };
  const { muiTheme, msg, setMsg } = page;
  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", minWidth: 0 }}>
        <PageMeta title={`${title} | VCC Plastics`} description={title} />
        <PageBreadcrumb pageTitle={title} />
        <Paper elevation={0} sx={{ ...cardSx, p: 1, mb: 1.5 }}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            {toolbar}
            <Button startIcon={<RefreshIcon />} onClick={onRefresh} sx={toolBtnSx}>{tx("Refresh")}</Button>
            {onExport ? <Button startIcon={<FileDownloadOutlinedIcon />} onClick={onExport} sx={toolBtnSx}>{tx("Export")}</Button> : null}
            <Button startIcon={<PrintOutlinedIcon />} onClick={() => window.print()} sx={toolBtnSx}>{tx("Print")}</Button>
            {actions}
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">{tx("Last Update")}: {lastUpdate ? lastUpdate.toLocaleString(localeTag()) : EMPTY}</Typography>
            {setLive ? <FormControlLabel sx={{ mx: 0.5 }} control={<Switch size="small" checked={live} onChange={(e) => setLive(e.target.checked)} />} label={<Typography variant="caption" fontWeight={700}>{tx("Auto Refresh")}</Typography>} /> : null}
          </Stack>
        </Paper>
        {loading ? <LinearProgress sx={{ mb: 1 }} /> : null}
        {!ready ? <Box sx={{ height: 400, display: "grid", placeItems: "center" }}><CircularProgress /></Box> : <Box sx={{ minWidth: 0 }}>{children}</Box>}
        {ready && system ? <Box sx={{ mt: 1.5 }}><SystemStatusBar system={system} /></Box> : null}
        <Snackbar open={msg.open} autoHideDuration={5000} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}

/** Donut + legend: entries [key, value, label]. */
export function DonutCard({ entries, colors = {}, dark, axisColor, height = 150, centerLabel, formatter }) {
  const total = entries.reduce((a, [, n]) => a + n, 0);
  if (!total) return <Typography variant="caption" color="text.secondary" sx={{ px: 1.5 }}>{tx("No data.")}</Typography>;
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "130px 1fr", alignItems: "center", px: 1, pb: 1 }}>
      <Chart type="donut" height={height} series={entries.map(([, n]) => n)} options={{
        labels: entries.map(([, , l]) => l), colors: entries.map(([k], i) => colors[k] || CHART_COLORS[i % CHART_COLORS.length]), legend: { show: false }, dataLabels: { enabled: false },
        stroke: { width: 1, colors: [dark ? "#111827" : "#fff"] }, chart: { background: "transparent" }, tooltip: { theme: dark ? "dark" : "light", y: { formatter: formatter || ((v) => num(v, 0)) } },
        plotOptions: { pie: { donut: { size: "66%", labels: { show: true, name: { color: axisColor, fontSize: "11px" }, value: { fontSize: "16px", fontWeight: 800, color: dark ? "#fff" : "#101828", formatter: (v) => (formatter ? formatter(Number(v)) : v) },
          total: { show: true, label: centerLabel || tx("Total"), color: axisColor, formatter: () => (formatter ? formatter(total) : String(total)) } } } } } }} />
      <DonutLegend items={entries} colors={colors} total={total} formatter={formatter} />
    </Box>
  );
}
