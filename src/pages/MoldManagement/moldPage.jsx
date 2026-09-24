import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
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
import { EMPTY, btn, cardSx, pageTheme } from "../ProductionManagement/ProductionPlanning/ui";
import { SystemStatusBar } from "../ProductionManagement/WorkOrders/WorkOrderManagement/WoParts";
import { localeTag, setActiveLanguage, tx } from "./moldLocales";
import { MOLD_API, MoldActionDialog } from "./moldUi";

/** Shared state of the Mold Management screens: language, theme, permissions, lookups, action dialog, snackbar. */
export function useMoldPage() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  const { theme } = useAppTheme();
  const muiTheme = useMemo(() => pageTheme(theme), [theme]);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { canEdit } = usePagePermission();
  const actor = getCurrentUser()?.employee_code || "SYSTEM";
  const request = useRequest();
  const [lookups, setLookups] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [msg, setMsg] = useState({ open: false, type: "success", text: "" });
  const notify = useCallback((type, text) => setMsg({ open: true, type, text }), []);
  const loadLookups = useCallback(() => request(`${MOLD_API}/lookups`).then(setLookups).catch(() => {}), [request]);
  useEffect(() => { loadLookups(); }, [loadLookups]);
  const dark = theme === "dark";
  return {
    language, dark, muiTheme, navigate, params, setParams, canEdit, actor, request, lookups, loadLookups, dialog, setDialog, msg, setMsg, notify,
    openAction: (mode, mold) => setDialog({ mode, mold }),
    axisColor: dark ? "#A7B0C0" : "#667085", grid: { borderColor: dark ? "#263244" : "#EEF2F6" },
    tableSx: { "& td, & th": { fontSize: 11.5, px: 0.75, py: 0.5, whiteSpace: "nowrap" }, "& th": { color: "text.secondary", fontWeight: 800, bgcolor: "background.paper" } },
  };
}

/** Page chrome: meta, breadcrumb, toolbar (filters + refresh / auto refresh / export / print), children, system bar, dialogs. */
export function MoldPageFrame({ page, title, subtitle, loading, ready, lastUpdate, live, setLive, onRefresh, onExport, toolbar, system, onChanged, children }) {
  const toolBtnSx = { ...btn("cancel"), bgcolor: "background.paper", border: 1, borderColor: "divider" };
  const { muiTheme, dialog, setDialog, msg, setMsg, lookups, request, actor, notify, loadLookups } = page;
  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", minWidth: 0 }}>
        <PageMeta title={`${title} | VCC Plastics`} description={subtitle || title} />
        <PageBreadcrumb pageTitle={title} />
        <Paper elevation={0} sx={{ ...cardSx, p: 1, mb: 1.5 }}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            {toolbar}
            <Button startIcon={<RefreshIcon />} onClick={onRefresh} sx={toolBtnSx}>{tx("Refresh")}</Button>
            {onExport ? <Button startIcon={<FileDownloadOutlinedIcon />} onClick={onExport} sx={toolBtnSx}>{tx("Export")}</Button> : null}
            <Button startIcon={<PrintOutlinedIcon />} onClick={() => window.print()} sx={toolBtnSx}>{tx("Print")}</Button>
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">{tx("Last Update")}: {lastUpdate ? lastUpdate.toLocaleString(localeTag()) : EMPTY}</Typography>
            {setLive ? <FormControlLabel sx={{ mx: 0.5 }} control={<Switch size="small" checked={live} onChange={(e) => setLive(e.target.checked)} />} label={<Typography variant="caption" fontWeight={700}>{tx("Auto Refresh")}</Typography>} /> : null}
          </Stack>
        </Paper>
        {loading ? <LinearProgress sx={{ mb: 1 }} /> : null}
        {!ready ? <Box sx={{ height: 400, display: "grid", placeItems: "center" }}><CircularProgress /></Box> : <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)" }}><Box sx={{ minWidth: 0 }}>{children}</Box></Box>}
        {ready && system ? <Box sx={{ mt: 1.5 }}><SystemStatusBar system={system} /></Box> : null}
        {dialog?.mode ? (
          <MoldActionDialog mode={dialog.mode} mold={dialog.mold} presetAction={dialog.action} lookups={lookups} request={request} actor={actor} notify={notify}
            onClose={() => setDialog(null)} onDone={() => { setDialog(null); loadLookups(); onChanged?.(); }} />
        ) : null}
        <Snackbar open={msg.open} autoHideDuration={5000} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}

/** Auto-refreshing loader for an endpoint. */
export function useMoldData(page, url, { interval = 30000 } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [live, setLive] = useState(true);
  const { request, notify, dialog } = page;
  const load = useCallback(async ({ silent } = {}) => {
    if (!url) return;
    if (!silent) setLoading(true);
    try { setData(await request(url)); setLastUpdate(new Date()); }
    catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [url, request, notify]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!live) return undefined;
    const t = setInterval(() => { if (!dialog) load({ silent: true }); }, interval);
    return () => clearInterval(t);
  }, [live, load, dialog, interval]);
  return { data, loading, lastUpdate, live, setLive, load };
}
