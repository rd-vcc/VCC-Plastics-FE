import { useEffect, useState } from "react";
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, FormControl, InputLabel, LinearProgress, MenuItem, Select, Stack, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";

import { DialogHeader, EMPTY, btn, ddmmhhmm, dialogPaperSx, num, toInputDateTime } from "../ProductionManagement/ProductionPlanning/ui";
import { label, tx } from "./machineLocales";

export const MACHINE_COLORS = { RUNNING: "#12B76A", IDLE: "#F79009", DOWN: "#F04438", MAINTENANCE: "#2E90FA", OFFLINE: "#98A2B3", UNKNOWN: "#98A2B3" };
export const PRIORITY_COLORS = { CRITICAL: "#D92D20", HIGH: "#F79009", MEDIUM: "#EAAA08", LOW: "#12B76A" };
export const ALARM_STATUS_COLORS = { ACTIVE: "#F04438", ACKNOWLEDGED: "#F79009", SHELVED: "#7A5AF8", CLEARED: "#12B76A", CLOSED: "#667085" };
export const DT_STATUS_COLORS = { OPEN: "#F04438", CLOSED: "#12B76A", CANCELLED: "#98A2B3" };
export const CATEGORY_COLORS = { PLANNED: "#2E90FA", UNPLANNED: "#F04438" };
export const REASON_COLORS = ["#F04438", "#F79009", "#12B76A", "#7A5AF8", "#2E90FA", "#0E9384", "#EE46BC", "#98A2B3", "#475467"];

const pillSx = (color, width) => ({
  display: "inline-block", width, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", verticalAlign: "middle",
  px: 0.5, py: 0.2, borderRadius: 1, fontSize: 11, fontWeight: 700, color, bgcolor: `${color}1A`, border: `1px solid ${color}40`,
});
export const Pill = ({ group, value, colors, width = 104 }) => <Box component="span" title={label(group, value)} sx={pillSx(colors[value] || "#667085", width)}>{label(group, value)}</Box>;
export const PriorityPill = ({ value }) => <Pill group="priority" value={value} colors={PRIORITY_COLORS} width={92} />;
export const MachineStatusPill = ({ value }) => <Pill group="machineStatus" value={value || "UNKNOWN"} colors={MACHINE_COLORS} />;
export const minText = (m) => (m == null ? EMPTY : m >= 60 ? `${Math.floor(m / 60)}h ${String(Math.round(m % 60)).padStart(2, "0")}m` : `${num(m, 0)} ${tx("min")}`);
export const reasonName = (d) => (d.reason_name ? `${d.reason_name}${d.reason_text ? ` · ${d.reason_text}` : ""}` : d.reason_text || tx("Unspecified"));

// =========================================================
// REPORT / EDIT / CLOSE / CANCEL DOWNTIME
// =========================================================

export function DowntimeDialog({ mode = "report", api, request, lookups, item, preset, actor, onClose, onSaved, notify }) {
  const [f, setF] = useState(() => ({
    equipment_id: item?.equipment_id ?? preset?.equipment_id ?? "", reason_code_id: item?.reason_code_id ?? "", reason_text: item?.reason_text ?? preset?.reason_text ?? "",
    category: item?.category ?? "", started_at: toInputDateTime(item?.started_at) || toInputDateTime(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString()),
    ended_at: toInputDateTime(item?.ended_at), root_cause: item?.root_cause ?? "", action_taken: item?.action_taken ?? "", cancel: "",
  }));
  const [saving, setSaving] = useState(false);
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const pickReason = (e) => {
    const r = lookups.reasons.find((x) => x.id === e.target.value);
    setF((o) => ({ ...o, reason_code_id: e.target.value, category: o.category || (r ? (r.planned_default ? "PLANNED" : "UNPLANNED") : "") }));
  };
  const valid = mode === "cancel" ? f.cancel.trim() : mode === "close" ? true : f.equipment_id && (f.reason_code_id || f.reason_text.trim()) && f.started_at;
  const iso = (v) => (v ? `${v.length === 16 ? `${v}:00` : v}` : null);
  const submit = async () => {
    setSaving(true);
    try {
      if (mode === "report") {
        await request(api, { method: "POST", body: JSON.stringify({ equipment_id: Number(f.equipment_id), reason_code_id: f.reason_code_id || null, reason_text: f.reason_text.trim() || null,
          category: f.category || null, started_at: iso(f.started_at), ended_at: iso(f.ended_at), alarm_id: preset?.alarm_id || null, actor }) });
        notify("success", tx("Downtime reported."));
      } else if (mode === "close") {
        await request(`${api}/${item.id}/close`, { method: "POST", body: JSON.stringify({ ended_at: iso(f.ended_at), reason_code_id: f.reason_code_id || null, reason_text: f.reason_text.trim() || null,
          root_cause: f.root_cause.trim() || null, action_taken: f.action_taken.trim() || null, actor, version: item.version }) });
        notify("success", tx("Downtime closed."));
      } else if (mode === "edit") {
        await request(`${api}/${item.id}`, { method: "PUT", body: JSON.stringify({ reason_code_id: f.reason_code_id || null, reason_text: f.reason_text.trim() || null, category: f.category || "UNPLANNED",
          started_at: iso(f.started_at), ended_at: iso(f.ended_at), root_cause: f.root_cause.trim() || null, action_taken: f.action_taken.trim() || null, actor, version: item.version }) });
        notify("success", tx("Downtime updated."));
      } else {
        await request(`${api}/${item.id}/cancel`, { method: "POST", body: JSON.stringify({ reason: f.cancel.trim(), actor, version: item.version }) });
        notify("success", tx("Downtime cancelled."));
      }
      onSaved();
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const title = { report: "Report Downtime", close: "Close Downtime", edit: "Edit Downtime", cancel: "Cancel Downtime" }[mode];
  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<BuildCircleOutlinedIcon />} title={tx(title)} subtitle={item ? `${item.downtime_no} · ${item.equipment_code}` : ""} onClose={onClose} disabled={saving} tone={mode === "cancel" ? "danger" : "primary"} />
      <DialogContent sx={{ pt: "16px !important" }}>
        {mode === "cancel" ? (
          <TextField fullWidth size="small" required multiline minRows={2} label={tx("Cancel reason")} value={f.cancel} onChange={ch("cancel")} autoFocus />
        ) : (
          <Stack spacing={1.5}>
            <FormControl size="small" required disabled={mode !== "report"}><InputLabel>{tx("Equipment")}</InputLabel>
              <Select label={tx("Equipment")} value={f.equipment_id} onChange={ch("equipment_id")}>
                {lookups.equipment.map((e) => <MenuItem key={e.id} value={e.id}>{e.equipment_code} — {e.equipment_name} ({label("machineStatus", e.operational_status)})</MenuItem>)}
              </Select></FormControl>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <FormControl size="small" sx={{ flex: 1 }}><InputLabel>{tx("Reason Code")}</InputLabel>
                <Select label={tx("Reason Code")} value={f.reason_code_id} onChange={pickReason}>
                  <MenuItem value="">{EMPTY}</MenuItem>
                  {lookups.reasons.map((r) => <MenuItem key={r.id} value={r.id}>{r.reason_code} — {r.reason_name}</MenuItem>)}
                </Select></FormControl>
              <FormControl size="small" sx={{ width: { sm: 180 } }}><InputLabel>{tx("Category")}</InputLabel>
                <Select label={tx("Category")} value={f.category} onChange={ch("category")}>
                  <MenuItem value="">{EMPTY}</MenuItem>{["UNPLANNED", "PLANNED"].map((c) => <MenuItem key={c} value={c}>{label("dtCategory", c)}</MenuItem>)}
                </Select></FormControl>
            </Stack>
            <TextField size="small" label={tx("Describe the reason")} value={f.reason_text} onChange={ch("reason_text")} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField size="small" type="datetime-local" label={tx("Start Time")} value={f.started_at} onChange={ch("started_at")} slotProps={{ inputLabel: { shrink: true } }} disabled={mode === "close"} sx={{ flex: 1 }} />
              <TextField size="small" type="datetime-local" label={tx("End Time")} value={f.ended_at} onChange={ch("ended_at")} slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: 1 }}
                disabled={mode === "edit" && item?.status === "OPEN"} />
            </Stack>
            {mode === "report" ? <Typography variant="caption" color="text.secondary">{tx("Leave end time empty if the machine is still stopped.")}</Typography> : null}
            {mode !== "report" ? (
              <>
                <TextField size="small" multiline minRows={2} label={tx("Root cause")} value={f.root_cause} onChange={ch("root_cause")} />
                <TextField size="small" multiline minRows={2} label={tx("Action taken")} value={f.action_taken} onChange={ch("action_taken")} />
              </>
            ) : null}
            {!valid && mode === "report" && f.equipment_id ? <Alert severity="info" sx={{ py: 0 }}>{tx("Choose a reason code or describe the reason.")}</Alert> : null}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={btn("cancel")}>{tx("Back")}</Button>
        <Button onClick={submit} disabled={saving || !valid} sx={btn(mode === "cancel" ? "delete" : "primary")}>{tx("Confirm")}</Button>
      </DialogActions>
    </Dialog>
  );
}

// =========================================================
// ALARM DETAIL (+ actions) / REPORT ALARM
// =========================================================

export function AlarmDialog({ api, request, alarmId, canEdit, actor, notify, onClose, onChanged, onReportDowntime }) {
  const [a, setA] = useState(null);
  const [mode, setMode] = useState(null);
  const [note, setNote] = useState("");
  const [hours, setHours] = useState(4);
  const [busy, setBusy] = useState(false);
  const load = () => request(`${api}/${alarmId}`).then(setA).catch((e) => notify("error", e.message));
  useEffect(() => { load(); }, [alarmId]); // eslint-disable-line react-hooks/exhaustive-deps
  const run = async () => {
    setBusy(true);
    try {
      await request(`${api}/${a.id}/${mode}`, { method: "POST", body: JSON.stringify({ actor, version: a.version, note: note.trim() || null, hours: mode === "shelve" ? Number(hours) : null }) });
      setMode(null); setNote(""); await load(); onChanged();
    } catch (e) { notify("error", e.message); } finally { setBusy(false); }
  };
  const allowed = a ? {
    acknowledge: ["ACTIVE", "SHELVED"].includes(a.status), shelve: ["ACTIVE", "ACKNOWLEDGED"].includes(a.status),
    clear: ["ACTIVE", "ACKNOWLEDGED", "SHELVED"].includes(a.status), close: a.status !== "CLOSED",
  } : {};
  const needNote = mode === "shelve" || (mode === "close" && a?.status !== "CLEARED");
  const sx = { "& td, & th": { fontSize: 12, px: 1 }, "& th": { color: "text.secondary", fontWeight: 800 } };
  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="md" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<NotificationsActiveOutlinedIcon />} title={`${tx("Alarm Detail")}${a ? ` · ${a.alarm_no}` : ""}`} subtitle={a ? `${a.equipment_code || EMPTY} · ${a.message}` : ""} onClose={onClose} disabled={busy} tone="danger" />
      <DialogContent sx={{ pt: "16px !important" }}>
        {!a ? <LinearProgress /> : (
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, alignItems: "center" }}>
              <PriorityPill value={a.priority} /><Pill group="alarmStatus" value={a.status} colors={ALARM_STATUS_COLORS} />
              <Typography variant="caption" color="text.secondary">{label("source", a.source)} · {a.area_name || EMPTY} · {a.type_name || EMPTY}</Typography>
            </Stack>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.5 }}>
              {[[tx("Time"), ddmmhhmm(a.raised_at)], [tx("Duration"), minText(a.duration_min)], [tx("Value"), a.value != null ? num(a.value, 2) : EMPTY],
                [tx("Limit"), a.limit_value != null ? num(a.limit_value, 2) : EMPTY], [tx("Work Order"), a.wo_no || EMPTY], [tx("Acknowledge"), a.acknowledged_by ? `${a.acknowledged_by} · ${ddmmhhmm(a.acknowledged_at)}` : EMPTY],
                [tx("Shelved"), a.shelved_until ? ddmmhhmm(a.shelved_until) : EMPTY], [tx("Linked downtime"), (a.downtime || []).map((d) => d.downtime_no).join(", ") || EMPTY]].map(([k, v]) => (
                <Box key={k}><Typography variant="caption" color="text.secondary">{k}</Typography><Typography variant="body2" fontWeight={700}>{v}</Typography></Box>
              ))}
            </Box>
            {a.note ? <Alert severity="info" sx={{ py: 0 }}>{tx("Note")}: {a.note}</Alert> : null}
            {mode ? (
              <Stack spacing={1.25} sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={800}>{tx({ acknowledge: "Acknowledge", shelve: "Shelve", clear: "Clear Alarm", close: "Close Alarm" }[mode])}</Typography>
                {mode === "shelve" ? <TextField size="small" type="number" label={tx("Shelve for (hours)")} value={hours} onChange={(e) => setHours(e.target.value)} inputProps={{ min: 1, max: 72 }} sx={{ width: 200 }} /> : null}
                <TextField size="small" multiline minRows={2} required={needNote} label={tx("Note")} value={note} onChange={(e) => setNote(e.target.value)} />
                <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                  <Button onClick={() => setMode(null)} disabled={busy} sx={btn("cancel")}>{tx("Back")}</Button>
                  <Button onClick={run} disabled={busy || (needNote && !note.trim())} sx={btn("primary")}>{tx("Confirm")}</Button>
                </Stack>
              </Stack>
            ) : null}
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>{tx("Action history")}</Typography>
              <Table size="small" sx={sx}>
                <TableHead><TableRow><TableCell>{tx("Time")}</TableCell><TableCell>{tx("Action")}</TableCell><TableCell>{tx("Status")}</TableCell><TableCell>{tx("Actor")}</TableCell><TableCell>{tx("Note")}</TableCell></TableRow></TableHead>
                <TableBody>
                  {a.actions.map((x) => (
                    <TableRow key={x.id}><TableCell>{ddmmhhmm(x.acted_at)}</TableCell><TableCell sx={{ fontWeight: 700 }}>{label("alarmAction", x.action)}</TableCell>
                      <TableCell>{x.from_status ? `${label("alarmStatus", x.from_status)} → ` : ""}{label("alarmStatus", x.to_status)}</TableCell><TableCell>{x.actor}</TableCell><TableCell>{x.note || EMPTY}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: "wrap", gap: 1 }}>
        {[["acknowledge", "Acknowledge", "primary"], ["shelve", "Shelve", "edit"], ["clear", "Clear Alarm", "edit"], ["close", "Close Alarm", "delete"]].map(([m, t, tone]) => (
          <Button key={m} disabled={!a || !canEdit || busy || !allowed[m]} onClick={() => { setMode(m); setNote(""); }} sx={btn(tone)}>{tx(t)}</Button>
        ))}
        <Button disabled={!a || !canEdit || !a.equipment_id} onClick={() => onReportDowntime(a)} sx={btn("edit")}>{tx("Report downtime from this alarm")}</Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} disabled={busy} sx={btn("cancel")}>{tx("Close")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export function ReportAlarmDialog({ api, request, lookups, actor, notify, onClose, onSaved }) {
  const [f, setF] = useState({ equipment_id: "", message: "", priority: "MEDIUM", note: "" });
  const [saving, setSaving] = useState(false);
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const submit = async () => {
    setSaving(true);
    try {
      await request(api, { method: "POST", body: JSON.stringify({ equipment_id: Number(f.equipment_id), message: f.message.trim(), priority: f.priority, note: f.note.trim() || null, actor }) });
      notify("success", tx("Alarm reported.")); onSaved();
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<NotificationsActiveOutlinedIcon />} title={tx("Report Alarm")} onClose={onClose} disabled={saving} tone="danger" />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack spacing={1.5}>
          <FormControl size="small" required><InputLabel>{tx("Equipment")}</InputLabel>
            <Select label={tx("Equipment")} value={f.equipment_id} onChange={ch("equipment_id")}>
              {lookups.equipment.map((e) => <MenuItem key={e.id} value={e.id}>{e.equipment_code} — {e.equipment_name}</MenuItem>)}
            </Select></FormControl>
          <FormControl size="small"><InputLabel>{tx("Priority")}</InputLabel>
            <Select label={tx("Priority")} value={f.priority} onChange={ch("priority")}>{lookups.priorities.map((p) => <MenuItem key={p} value={p}>{label("priority", p)}</MenuItem>)}</Select></FormControl>
          <TextField size="small" required label={tx("Alarm Message")} value={f.message} onChange={ch("message")} />
          <TextField size="small" multiline minRows={2} label={tx("Note")} value={f.note} onChange={ch("note")} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={btn("cancel")}>{tx("Back")}</Button>
        <Button onClick={submit} disabled={saving || !f.equipment_id || !f.message.trim()} sx={btn("delete")}>{tx("Confirm")}</Button>
      </DialogActions>
    </Dialog>
  );
}
