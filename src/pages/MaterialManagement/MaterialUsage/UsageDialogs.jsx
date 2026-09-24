import { useCallback, useEffect, useState } from "react";
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, InputAdornment, LinearProgress, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";

import { DialogHeader, EMPTY, btn, ddmmhhmm, dialogPaperSx, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { label, tx } from "../materialLocales";
import { qty } from "../materialUi";

export const USAGE_COLORS = { OVER: "#F04438", WITHIN: "#12B76A", SAVING: "#2E90FA", PENDING: "#98A2B3" };

export function UsagePill({ value }) {
  const color = USAGE_COLORS[value] || "#667085";
  return (
    <Box component="span" title={label("usageStatus", value)} sx={{ display: "inline-block", width: 104, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis",
      whiteSpace: "nowrap", verticalAlign: "middle", px: 0.5, py: 0.2, borderRadius: 1, fontSize: 11, fontWeight: 700, color, bgcolor: `${color}1A`, border: `1px solid ${color}40` }}>
      {label("usageStatus", value)}
    </Box>
  );
}

export const signed = (v, digits = 3) => (v == null ? EMPTY : `${v > 0 ? "+" : ""}${num(v, digits)}`);
export const diffColor = (v) => (v > 0 ? "#F04438" : v < 0 ? "#12B76A" : "inherit");

const tableSx = { "& td, & th": { fontSize: 12, whiteSpace: "nowrap", px: 1 }, "& th": { color: "text.secondary", fontWeight: 800 } };

export function WorkOrderUsageDialog({ api, request, workOrderId, canEdit, actor, notify, onClose, onChanged }) {
  const [wo, setWo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState(null); // { allocation, qty, remark }
  const [reversing, setReversing] = useState(null); // { usage, reason }
  const [confirmClose, setConfirmClose] = useState(false);

  const load = useCallback(() => request(`${api}/work-orders/${workOrderId}`).then(setWo).catch((e) => notify("error", e.message)), [api, workOrderId, request, notify]);
  useEffect(() => { load(); }, [load]);

  const run = async (fn) => {
    setBusy(true);
    try { await fn(); await load(); onChanged(); } catch (e) { notify("error", e.message); } finally { setBusy(false); }
  };
  const doBackflush = () => run(async () => {
    const r = await request(`${api}/work-orders/${workOrderId}/backflush`, { method: "POST", body: JSON.stringify({ actor }) });
    const missing = r.not_at_machine.map((m) => `${m.material_code} (${num(m.missing_qty, 3)} ${m.unit})`).join(", ");
    const text = r.created.length ? tx("{n} usage records created.", { n: r.created.length }) : tx("Nothing to back-flush.");
    notify(missing ? "warning" : "success", missing ? `${text} ${tx("Not at the machine: {list}", { list: missing })}` : text);
  });
  const doCloseOut = () => run(async () => {
    const r = await request(`${api}/work-orders/${workOrderId}/close-out`, { method: "POST", body: JSON.stringify({ actor }) });
    const loss = r.loss.filter((l) => String(l.unit).toUpperCase() === "KG").reduce((a, l) => a + l.qty, 0);
    setConfirmClose(false);
    notify("success", tx("Close-out done: {n} kg loss recorded.", { n: num(loss, 3) }));
  });
  const doManual = () => run(async () => {
    await request(api, { method: "POST", body: JSON.stringify({ allocation_id: manual.allocation.id, qty: Number(manual.qty), remark: manual.remark.trim(), actor }) });
    setManual(null); notify("success", tx("Usage recorded."));
  });
  const doReverse = () => run(async () => {
    await request(`${api}/${reversing.usage.id}/reverse`, { method: "POST", body: JSON.stringify({ reason: reversing.reason.trim(), actor }) });
    setReversing(null); notify("success", tx("Usage reversed."));
  });

  const manualValid = manual && Number(manual.qty) > 0 && Number(manual.qty) <= manual.allocation.in_use_qty + 1e-3 && manual.remark.trim();
  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="lg" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<InsightsOutlinedIcon />} title={`${tx("Usage Detail")}${wo ? ` · ${wo.wo_no}` : ""}`}
        subtitle={wo ? `${wo.product_name}${wo.order_no ? ` · ${wo.order_no}` : ""}${wo.machine_code ? ` · ${wo.machine_code}` : ""}` : ""} onClose={onClose} disabled={busy} />
      <DialogContent sx={{ pt: "16px !important" }}>
        {!wo ? <LinearProgress /> : (
          <Stack spacing={2}>
            {busy ? <LinearProgress /> : null}
            <Stack direction="row" sx={{ gap: 3, flexWrap: "wrap" }}>
              {[[tx("Status"), wo.status], [tx("Planned Qty"), num(wo.planned_qty)], [tx("Produced"), num(Number(wo.actual_qty) + Number(wo.reject_qty))],
                [tx("Tolerance ±{n}%", { n: num(wo.tolerance_pct, 1) }), ""]].map(([k, v]) => (
                <Box key={k}><Typography variant="caption" color="text.secondary">{k}</Typography><Typography variant="subtitle2" fontWeight={800}>{v}</Typography></Box>
              ))}
            </Stack>
            <Box>
              <Table size="small" sx={tableSx}>
                <TableHead><TableRow>
                  <TableCell>{tx("Material")}</TableCell><TableCell>{tx("Unit")}</TableCell><TableCell align="right">{tx("Standard")}</TableCell>
                  <TableCell align="right">{tx("Actual")}</TableCell><TableCell align="right">{tx("Difference")}</TableCell><TableCell align="right">{tx("Difference (%)")}</TableCell>
                  <TableCell align="center">{tx("Status")}</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {wo.lines.length === 0 ? <TableRow><TableCell colSpan={7}>{tx("No data.")}</TableCell></TableRow> : wo.lines.map((l) => (
                    <TableRow key={l.key}>
                      <TableCell sx={{ fontWeight: 700 }}>{l.material_code}</TableCell><TableCell>{l.unit}</TableCell>
                      <TableCell align="right">{num(l.standard_qty, 3)}</TableCell><TableCell align="right">{num(l.actual_qty, 3)}</TableCell>
                      <TableCell align="right" sx={{ color: diffColor(l.diff_qty), fontWeight: 700 }}>{l.status === "PENDING" ? EMPTY : signed(l.diff_qty)}</TableCell>
                      <TableCell align="right" sx={{ color: diffColor(l.diff_qty) }}>{l.status === "PENDING" || l.diff_pct == null ? EMPTY : `${signed(l.diff_pct, 2)}%`}</TableCell>
                      <TableCell align="center"><UsagePill value={l.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            <Box>
              <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ flex: 1 }}>{tx("Material at the machine")}</Typography>
                <Button disabled={!canEdit || busy} onClick={doBackflush} sx={btn("primary")}>{tx("Back-flush from production")}</Button>
                <Button disabled={!canEdit || busy} onClick={() => setConfirmClose(true)} sx={btn("delete")}>{tx("Close out work order")}</Button>
              </Stack>
              {confirmClose ? (
                <Alert severity="warning" sx={{ mb: 1 }} action={
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => setConfirmClose(false)} disabled={busy}>{tx("Cancel")}</Button>
                    <Button size="small" color="error" variant="contained" onClick={doCloseOut} disabled={busy}>{tx("Confirm")}</Button>
                  </Stack>}>
                  {tx("Close-out consumes everything still at the machine as loss. Return left-over on the Material Allocation screen first.")}
                </Alert>
              ) : null}
              {wo.in_use.length === 0 ? <Typography variant="caption" color="text.secondary">{tx("No material at the machine.")}</Typography> : (
                <Table size="small" sx={tableSx}>
                  <TableHead><TableRow>
                    <TableCell>{tx("Allocation")}</TableCell><TableCell>{tx("Material")}</TableCell><TableCell>{tx("Lot No.")}</TableCell><TableCell>{tx("Machine")}</TableCell>
                    <TableCell align="right">{tx("In use qty")}</TableCell><TableCell />
                  </TableRow></TableHead>
                  <TableBody>
                    {wo.in_use.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell sx={{ fontWeight: 700 }}>{a.allocation_no}</TableCell><TableCell>{a.material_code}</TableCell><TableCell>{a.lot_no}</TableCell>
                        <TableCell>{a.machine_code || EMPTY}</TableCell><TableCell align="right">{qty(a.in_use_qty, a.unit)}</TableCell>
                        <TableCell align="right"><Button size="small" disabled={!canEdit || busy} onClick={() => setManual({ allocation: a, qty: "", remark: "" })}>{tx("Record Usage")}</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {manual ? (
                <Stack spacing={1.5} sx={{ mt: 1.5, p: 1.5, border: 1, borderColor: "divider", borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={800}>{tx("Record Usage")} · {manual.allocation.allocation_no} · {manual.allocation.material_code}</Typography>
                  <Alert severity="info" sx={{ py: 0 }}>{tx("Manual entry is for special cases only; a reason is required.")}</Alert>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <TextField size="small" type="number" label={tx("Quantity")} value={manual.qty} onChange={(e) => setManual({ ...manual, qty: e.target.value })} sx={{ width: { sm: 200 } }}
                      inputProps={{ min: 0, step: "any" }} InputProps={{ endAdornment: <InputAdornment position="end">{manual.allocation.unit}</InputAdornment> }}
                      helperText={`≤ ${qty(manual.allocation.in_use_qty, manual.allocation.unit)}`} />
                    <TextField size="small" required label={tx("Reason")} value={manual.remark} onChange={(e) => setManual({ ...manual, remark: e.target.value })} sx={{ flex: 1 }} />
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                    <Button onClick={() => setManual(null)} disabled={busy} sx={btn("cancel")}>{tx("Cancel")}</Button>
                    <Button onClick={doManual} disabled={busy || !manualValid} sx={btn("primary")}>{tx("Confirm")}</Button>
                  </Stack>
                </Stack>
              ) : null}
            </Box>

            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>{tx("Usage records")}</Typography>
              <Box sx={{ maxHeight: 260, overflow: "auto" }}>
                <Table size="small" stickyHeader sx={tableSx}>
                  <TableHead><TableRow>
                    <TableCell>{tx("Time")}</TableCell><TableCell>{tx("Usage No.")}</TableCell><TableCell>{tx("Material")}</TableCell><TableCell>{tx("Lot No.")}</TableCell>
                    <TableCell align="right">{tx("Quantity")}</TableCell><TableCell>{tx("Source")}</TableCell><TableCell>{tx("Machine")}</TableCell><TableCell>{tx("Operator")}</TableCell>
                    <TableCell>{tx("Reason")}</TableCell><TableCell />
                  </TableRow></TableHead>
                  <TableBody>
                    {wo.usages.length === 0 ? <TableRow><TableCell colSpan={10}>{tx("No data.")}</TableCell></TableRow> : wo.usages.map((u) => (
                      <TableRow key={u.id} sx={{ opacity: u.status === "REVERSED" ? 0.5 : 1, "& td": { textDecoration: u.status === "REVERSED" ? "line-through" : "none" } }}>
                        <TableCell>{ddmmhhmm(u.used_at)}</TableCell><TableCell sx={{ fontWeight: 700 }}>{u.usage_no}</TableCell><TableCell>{u.material_code}</TableCell>
                        <TableCell>{u.lot_no}</TableCell><TableCell align="right">{qty(u.qty, u.unit)}</TableCell><TableCell>{label("usageSource", u.source)}</TableCell>
                        <TableCell>{u.machine_code || EMPTY}</TableCell><TableCell>{u.actor}</TableCell>
                        <TableCell sx={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }} title={u.reverse_reason || u.remark || ""}>{u.status === "REVERSED" ? `${tx("Reversed")}: ${u.reverse_reason}` : u.remark || EMPTY}</TableCell>
                        <TableCell align="right" sx={{ textDecoration: "none !important" }}>
                          {u.status === "ACTIVE" ? <Button size="small" color="error" disabled={!canEdit || busy} onClick={() => setReversing({ usage: u, reason: "" })}>{tx("Reverse")}</Button> : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              {reversing ? (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 1.5, p: 1.5, border: 1, borderColor: "divider", borderRadius: 2, alignItems: { sm: "center" } }}>
                  <Typography variant="subtitle2" fontWeight={800}>{tx("Reverse")} · {reversing.usage.usage_no} ({qty(reversing.usage.qty, reversing.usage.unit)})</Typography>
                  <TextField size="small" required label={tx("Reason")} value={reversing.reason} onChange={(e) => setReversing({ ...reversing, reason: e.target.value })} sx={{ flex: 1 }} />
                  <Button onClick={() => setReversing(null)} disabled={busy} sx={btn("cancel")}>{tx("Cancel")}</Button>
                  <Button onClick={doReverse} disabled={busy || !reversing.reason.trim()} sx={btn("delete")}>{tx("Confirm")}</Button>
                </Stack>
              ) : null}
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={onClose} disabled={busy} sx={btn("cancel")}>{tx("Close")}</Button></DialogActions>
    </Dialog>
  );
}
