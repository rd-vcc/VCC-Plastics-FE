import { useMemo, useState } from "react";
import {
  Alert, Autocomplete, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, FormControl, FormControlLabel, IconButton, InputAdornment,
  InputLabel, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CallReceivedOutlinedIcon from "@mui/icons-material/CallReceivedOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import RecyclingOutlinedIcon from "@mui/icons-material/RecyclingOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";

import { DialogHeader, EMPTY, btn, dialogPaperSx, ddmmhhmm, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { label, tx } from "../materialLocales";
import { LotStatusPill, qty } from "../materialUi";

const STORE_TYPES = new Set(["WAREHOUSE", "SILO", "DRYER", "IQC_AREA", "HOLD_AREA", "OTHER"]);
const LOCATION_TYPES = ["WAREHOUSE", "SILO", "DRYER", "MACHINE", "IQC_AREA", "HOLD_AREA", "OTHER"];

function Frame({ icon, title, subtitle, saving, onClose, onSubmit, submitText, valid, children, maxWidth = "sm", tone }) {
  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth={maxWidth} fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={icon} title={title} subtitle={subtitle} onClose={onClose} disabled={saving} tone={tone} />
      <DialogContent sx={{ pt: "20px !important" }}>{children}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={btn("cancel")}>{tx("Cancel")}</Button>
        {onSubmit ? <Button disabled={saving || !valid} onClick={onSubmit} sx={btn(tone === "danger" ? "delete" : "primary")}>{submitText || tx("Save")}</Button> : null}
      </DialogActions>
    </Dialog>
  );
}

function LocationSelect({ value, onChange, locations, allow = STORE_TYPES, labelText = tx("Store at"), exclude }) {
  return (
    <FormControl size="small" fullWidth required>
      <InputLabel>{labelText}</InputLabel>
      <Select label={labelText} value={value} onChange={(e) => onChange(e.target.value)}>
        {locations.filter((l) => l.status === "ACTIVE" && allow.has(l.location_type) && l.id !== exclude).map((l) => (
          <MenuItem key={l.id} value={l.id}>{l.location_name} · {label("locationType", l.location_type)}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

// =========================================================
// RECEIVE / REGRIND
// =========================================================

export function ReceiveDialog({ lookups, saving, onClose, onSave }) {
  const iqcArea = lookups.locations.find((l) => l.location_type === "IQC_AREA" && l.status === "ACTIVE");
  const [f, setF] = useState({ material_id: null, qty: "", location_id: iqcArea?.id || "", lot_no: "", supplier: "", supplier_lot_no: "",
    received_at: "", manufacture_date: "", expiry_date: "", iqc_required: true, reference_no: "", remark: "" });
  const material = lookups.materials.find((m) => m.id === f.material_id);
  const valid = f.material_id && Number(f.qty) > 0 && f.location_id && (!f.expiry_date || !f.manufacture_date || f.expiry_date >= f.manufacture_date);
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  return (
    <Frame icon={<CallReceivedOutlinedIcon />} title={tx("Receive Material")} saving={saving} onClose={onClose} valid={valid} maxWidth="md"
      onSubmit={() => onSave({ ...f, qty: Number(f.qty), lot_no: f.lot_no || null, supplier: f.supplier || null, supplier_lot_no: f.supplier_lot_no || null,
        received_at: f.received_at ? `${f.received_at}:00` : null, manufacture_date: f.manufacture_date || null, expiry_date: f.expiry_date || null,
        reference_no: f.reference_no || null, remark: f.remark || null })}>
      <Alert severity="info" sx={{ mb: 2, py: 0 }}>{tx("Local inventory mode: stock is kept in MES until a warehouse system (WMS) is connected.")}</Alert>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
        <Autocomplete size="small" options={lookups.materials} value={material || null} getOptionLabel={(m) => `${m.material_code} — ${m.material_name}`}
          isOptionEqualToValue={(a, b) => a.id === b.id} onChange={(_, m) => setF((o) => ({ ...o, material_id: m?.id ?? null }))}
          renderInput={(p) => <TextField {...p} required label={tx("Material")} />} sx={{ gridColumn: { sm: "1 / -1" } }} />
        <TextField required size="small" type="number" label={tx("Quantity")} value={f.qty} onChange={ch("qty")}
          InputProps={{ endAdornment: <InputAdornment position="end">{material?.unit || ""}</InputAdornment> }} inputProps={{ min: 0, step: "any" }} />
        <LocationSelect value={f.location_id} onChange={(v) => setF((o) => ({ ...o, location_id: v }))} locations={lookups.locations} />
        <TextField size="small" label={tx("Lot No.")} value={f.lot_no} onChange={ch("lot_no")} helperText={tx("Leave blank to generate automatically.")} />
        <Autocomplete size="small" freeSolo options={lookups.suppliers} value={f.supplier} onInputChange={(_, v) => setF((o) => ({ ...o, supplier: v }))}
          renderInput={(p) => <TextField {...p} label={tx("Supplier")} />} />
        <TextField size="small" label={tx("Supplier lot no.")} value={f.supplier_lot_no} onChange={ch("supplier_lot_no")} />
        <TextField size="small" label={tx("Reference (receipt no.)")} value={f.reference_no} onChange={ch("reference_no")} />
        <TextField size="small" type="datetime-local" label={tx("Receiving date")} value={f.received_at} onChange={ch("received_at")} InputLabelProps={{ shrink: true }} />
        <TextField size="small" type="date" label={tx("Manufacture date")} value={f.manufacture_date} onChange={ch("manufacture_date")} InputLabelProps={{ shrink: true }} />
        <TextField size="small" type="date" label={tx("Expiry date")} value={f.expiry_date} onChange={ch("expiry_date")} InputLabelProps={{ shrink: true }} />
        <FormControlLabel control={<Checkbox checked={f.iqc_required} onChange={(e) => setF((o) => ({ ...o, iqc_required: e.target.checked }))} />} label={tx("IQC required")} />
        <TextField size="small" multiline minRows={2} label={tx("Remark")} value={f.remark} onChange={ch("remark")} sx={{ gridColumn: "1 / -1" }} />
      </Box>
    </Frame>
  );
}

export function RegrindDialog({ lookups, saving, onClose, onSave }) {
  const regrinds = lookups.materials.filter((m) => m.material_type === "RECYCLED");
  const [f, setF] = useState({ material_id: regrinds[0]?.id || "", qty: "", location_id: "", source_work_order_id: null, iqc_required: false, remark: "" });
  const wo = lookups.work_orders.find((w) => w.id === f.source_work_order_id);
  const valid = f.material_id && Number(f.qty) > 0 && f.location_id;
  return (
    <Frame icon={<RecyclingOutlinedIcon />} title={tx("Create Regrind Lot")} saving={saving} onClose={onClose} valid={valid}
      onSubmit={() => onSave({ ...f, qty: Number(f.qty), remark: f.remark || null })}>
      <Stack spacing={2}>
        <FormControl size="small" required>
          <InputLabel>{tx("Regrind material")}</InputLabel>
          <Select label={tx("Regrind material")} value={f.material_id} onChange={(e) => setF((o) => ({ ...o, material_id: e.target.value }))}>
            {regrinds.map((m) => <MenuItem key={m.id} value={m.id}>{m.material_code} — {m.material_name}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField required size="small" type="number" label={tx("Weight (kg)")} value={f.qty} onChange={(e) => setF((o) => ({ ...o, qty: e.target.value }))} inputProps={{ min: 0, step: "any" }} />
        <Autocomplete size="small" options={lookups.work_orders} value={wo || null}
          getOptionLabel={(w) => `${w.wo_no} · ${w.product_name}${w.machine_code ? ` · ${w.machine_code}` : ""}${w.reject_qty ? ` · NG ${num(w.reject_qty)}` : ""}`}
          isOptionEqualToValue={(a, b) => a.id === b.id} onChange={(_, w) => setF((o) => ({ ...o, source_work_order_id: w?.id ?? null }))}
          renderInput={(p) => <TextField {...p} label={tx("Source work order")} />} />
        <LocationSelect value={f.location_id} onChange={(v) => setF((o) => ({ ...o, location_id: v }))} locations={lookups.locations} />
        <FormControlLabel control={<Checkbox checked={f.iqc_required} onChange={(e) => setF((o) => ({ ...o, iqc_required: e.target.checked }))} />} label={tx("IQC required")} />
        <TextField size="small" multiline minRows={2} label={tx("Remark")} value={f.remark} onChange={(e) => setF((o) => ({ ...o, remark: e.target.value }))} />
      </Stack>
    </Frame>
  );
}

// =========================================================
// LOT ACTIONS
// =========================================================

export function IqcDialog({ lot, locations, saving, onClose, onSave }) {
  const [result, setResult] = useState("PASS");
  const [to, setTo] = useState("");
  const [remark, setRemark] = useState("");
  return (
    <Frame icon={<FactCheckOutlinedIcon />} title={tx("Record IQC Result")} subtitle={`${lot.lot_no} · ${lot.material_code}`} saving={saving} onClose={onClose}
      valid={result === "PASS" || remark.trim()} onSubmit={() => onSave({ result, to_location_id: to || null, remark: remark || null })}>
      <Stack spacing={2}>
        <ToggleButtonGroup exclusive value={result} onChange={(_, v) => v && setResult(v)} fullWidth size="small">
          <ToggleButton value="PASS" color="success">{tx("Pass")}</ToggleButton>
          <ToggleButton value="FAIL" color="error">{tx("Fail")}</ToggleButton>
        </ToggleButtonGroup>
        {result === "PASS" ? (
          <LocationSelect value={to} onChange={setTo} locations={locations} labelText={tx("Move to")} allow={new Set(["WAREHOUSE", "SILO", "DRYER", "OTHER"])} />
        ) : <Alert severity="warning" sx={{ py: 0 }}>{tx("Failed lots go to the Hold area.")}</Alert>}
        <TextField size="small" multiline minRows={2} required={result === "FAIL"} label={result === "FAIL" ? tx("Hold reason") : tx("Remark")} value={remark} onChange={(e) => setRemark(e.target.value)} />
      </Stack>
    </Frame>
  );
}

export function TransferDialog({ lot, locations, saving, onClose, onSave }) {
  const [to, setTo] = useState("");
  const [remark, setRemark] = useState("");
  return (
    <Frame icon={<SwapHorizOutlinedIcon />} title={tx("Transfer Lot")} subtitle={`${lot.lot_no} · ${lot.location_name}`} saving={saving} onClose={onClose}
      valid={Boolean(to)} onSubmit={() => onSave({ to_location_id: to, remark: remark || null })}>
      <Stack spacing={2}>
        <LocationSelect value={to} onChange={setTo} locations={locations} labelText={tx("Move to")} exclude={lot.location_id} />
        <TextField size="small" multiline minRows={2} label={tx("Remark")} value={remark} onChange={(e) => setRemark(e.target.value)} />
      </Stack>
    </Frame>
  );
}

export function ReasonDialog({ lot, title, fieldLabel, required, helper, danger, saving, onClose, onSave }) {
  const [text, setText] = useState("");
  return (
    <Frame icon={<InventoryOutlinedIcon />} tone={danger ? "danger" : undefined} title={title} subtitle={`${lot.lot_no} · ${lot.material_code}`} saving={saving} onClose={onClose}
      valid={!required || text.trim()} submitText={tx("Confirm")} onSubmit={() => onSave(text.trim() || null)}>
      <TextField fullWidth size="small" multiline minRows={3} required={required} label={fieldLabel} helperText={helper} value={text} onChange={(e) => setText(e.target.value)} />
    </Frame>
  );
}

export function AdjustDialog({ lot, saving, onClose, onSave }) {
  const [value, setValue] = useState(lot.current_qty);
  const [reason, setReason] = useState("");
  return (
    <Frame icon={<TuneOutlinedIcon />} title={tx("Adjust Quantity")} subtitle={`${lot.lot_no} · ${qty(lot.current_qty, lot.unit)}`} saving={saving} onClose={onClose}
      valid={value !== "" && Number(value) >= 0 && Number(value) !== lot.current_qty && reason.trim()} onSubmit={() => onSave({ new_qty: Number(value), reason: reason.trim() })}>
      <Stack spacing={2}>
        <TextField size="small" type="number" label={tx("New quantity")} value={value} onChange={(e) => setValue(e.target.value)} helperText={tx("Setting the quantity to 0 closes the lot.")}
          InputProps={{ endAdornment: <InputAdornment position="end">{lot.unit}</InputAdornment> }} inputProps={{ min: 0, step: "any" }} />
        <TextField size="small" required label={tx("Reason")} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Stack>
    </Frame>
  );
}

// =========================================================
// LOCATIONS
// =========================================================

export function LocationsDialog({ locations, machines, canEdit, saving, onClose, onSave }) {
  const [edit, setEdit] = useState(null);
  const blank = { location_code: "", location_name: "", location_type: "WAREHOUSE", equipment_id: "", capacity_kg: "", sort_order: 0, status: "ACTIVE" };
  const valid = edit && edit.location_code.trim() && edit.location_name.trim();
  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="md" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<PlaceOutlinedIcon />} title={tx("Locations")} onClose={onClose} disabled={saving} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Table size="small" sx={{ "& td, & th": { fontSize: 12 } }}>
          <TableHead><TableRow><TableCell>{tx("Code")}</TableCell><TableCell>{tx("Name")}</TableCell><TableCell>{tx("Type")}</TableCell><TableCell>{tx("Machine")}</TableCell><TableCell align="right">{tx("Capacity (kg)")}</TableCell><TableCell>{tx("Status")}</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {locations.map((l) => (
              <TableRow key={l.id} hover>
                <TableCell sx={{ fontWeight: 700 }}>{l.location_code}</TableCell><TableCell>{l.location_name}</TableCell>
                <TableCell>{label("locationType", l.location_type)}</TableCell>
                <TableCell>{machines.find((m) => m.id === l.equipment_id)?.equipment_code || EMPTY}</TableCell>
                <TableCell align="right">{l.capacity_kg == null ? EMPTY : num(l.capacity_kg)}</TableCell>
                <TableCell>{l.status}</TableCell>
                <TableCell align="right"><IconButton size="small" disabled={!canEdit} onClick={() => setEdit({ ...l, equipment_id: l.equipment_id ?? "", capacity_kg: l.capacity_kg ?? "" })}><EditOutlinedIcon fontSize="small" /></IconButton></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {edit ? (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.5, mt: 2, p: 1.5, border: 1, borderColor: "divider", borderRadius: 2 }}>
            <TextField size="small" required label={tx("Code")} value={edit.location_code} onChange={(e) => setEdit({ ...edit, location_code: e.target.value })} />
            <TextField size="small" required label={tx("Name")} value={edit.location_name} onChange={(e) => setEdit({ ...edit, location_name: e.target.value })} />
            <FormControl size="small"><InputLabel>{tx("Type")}</InputLabel>
              <Select label={tx("Type")} value={edit.location_type} onChange={(e) => setEdit({ ...edit, location_type: e.target.value })}>
                {LOCATION_TYPES.map((t) => <MenuItem key={t} value={t}>{label("locationType", t)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" disabled={!["MACHINE", "DRYER"].includes(edit.location_type)}><InputLabel>{tx("Machine")}</InputLabel>
              <Select label={tx("Machine")} value={edit.equipment_id} onChange={(e) => setEdit({ ...edit, equipment_id: e.target.value })}>
                <MenuItem value="">{EMPTY}</MenuItem>
                {machines.map((m) => <MenuItem key={m.id} value={m.id}>{m.equipment_code}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" type="number" label={tx("Capacity (kg)")} value={edit.capacity_kg} onChange={(e) => setEdit({ ...edit, capacity_kg: e.target.value })} />
            <TextField size="small" type="number" label={tx("Order")} value={edit.sort_order} onChange={(e) => setEdit({ ...edit, sort_order: e.target.value })} />
            <FormControl size="small"><InputLabel>{tx("Status")}</InputLabel>
              <Select label={tx("Status")} value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                <MenuItem value="ACTIVE">ACTIVE</MenuItem><MenuItem value="INACTIVE">INACTIVE</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1} sx={{ gridColumn: { sm: "span 2" }, justifyContent: "flex-end", alignItems: "center" }}>
              <Button onClick={() => setEdit(null)} sx={btn("cancel")}>{tx("Cancel")}</Button>
              <Button disabled={saving || !valid} sx={btn("primary")} onClick={async () => {
                const ok = await onSave(edit.id, { ...edit, equipment_id: edit.equipment_id || null, capacity_kg: edit.capacity_kg === "" ? null : Number(edit.capacity_kg), sort_order: Number(edit.sort_order || 0) });
                if (ok) setEdit(null);
              }}>{tx("Save")}</Button>
            </Stack>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button startIcon={<AddIcon />} disabled={!canEdit || Boolean(edit)} onClick={() => setEdit(blank)} sx={btn("edit")}>{tx("Add Location")}</Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Close")}</Button>
      </DialogActions>
    </Dialog>
  );
}

// =========================================================
// LOT TIMELINE (shared by the page card and the detail dialog)
// =========================================================

export function LotTimeline({ lot, dense }) {
  const rows = useMemo(() => lot?.transactions || [], [lot]);
  if (!lot) return <Typography variant="caption" color="text.secondary">{tx("Select a lot to see its history.")}</Typography>;
  return (
    <Box>
      {rows.map((t, i) => (
        <Stack key={t.id} direction="row" spacing={1.25} sx={{ position: "relative", pb: i === rows.length - 1 ? 0 : dense ? 1 : 1.5 }}>
          {i < rows.length - 1 ? <Box sx={{ position: "absolute", left: 11, top: 24, bottom: 0, borderLeft: "2px solid", borderColor: "divider" }} /> : null}
          <Box sx={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid", borderColor: "primary.main", bgcolor: "background.paper", zIndex: 1, flexShrink: 0, display: "grid", placeItems: "center" }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main" }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" fontWeight={800} sx={{ display: "block" }}>{label("txn", t.txn_type)}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              {ddmmhhmm(t.acted_at)} · {t.actor}
              {t.qty_change ? ` · ${Number(t.qty_change) > 0 ? "+" : ""}${num(t.qty_change, 3)} ${lot.unit}` : ""}
              {t.to_location ? ` · ${t.from_location ? `${t.from_location} → ` : ""}${t.to_location}` : ""}
              {t.wo_no ? ` · ${t.wo_no}` : ""}{t.machine_code ? ` · ${t.machine_code}` : ""}{t.reference_no && !t.wo_no ? ` · ${t.reference_no}` : ""}
            </Typography>
            {t.remark ? <Typography variant="caption" sx={{ display: "block", fontStyle: "italic" }}>{t.remark}</Typography> : null}
          </Box>
        </Stack>
      ))}
    </Box>
  );
}

export function LotDetailDialog({ lot, canEdit, saving, onClose, onAction }) {
  const s = lot.effective_status;
  const actions = [
    ["iqc", tx("Record IQC Result"), lot.status === "WAITING_IQC"],
    ["transfer", tx("Transfer Lot"), ["IN_STOCK", "HOLD", "WAITING_IQC"].includes(lot.status)],
    ["hold", tx("Hold / Release"), ["IN_STOCK", "WAITING_IQC", "HOLD"].includes(lot.status)],
    ["adjust", tx("Adjust Quantity"), !["CONSUMED", "CLOSED"].includes(lot.status)],
  ];
  const info = [
    [tx("Material"), `${lot.material_code} — ${lot.material_name}`], [tx("Group"), label("category", lot.category)],
    [tx("Status"), <LotStatusPill key="s" value={s} />], [tx("Location"), lot.location_name],
    [tx("Current quantity"), qty(lot.current_qty, lot.unit)], [tx("Initial quantity"), qty(lot.initial_qty, lot.unit)],
    [tx("Reserved"), qty(lot.reserved_qty, lot.unit)], [tx("Origin"), `${label("source", lot.source)}${lot.source_wo_no ? ` · ${lot.source_wo_no}` : ""}`],
    [tx("Supplier"), lot.supplier || EMPTY], [tx("Supplier lot no."), lot.supplier_lot_no || EMPTY],
    [tx("Received"), ddmmhhmm(lot.received_at)], [tx("Expiry"), lot.expiry_date ? `${String(lot.expiry_date).slice(0, 10)}${lot.days_to_expiry != null ? ` (${lot.days_to_expiry})` : ""}` : EMPTY],
    [tx("IQC"), `${lot.iqc_result}${lot.iqc_by ? ` · ${lot.iqc_by} · ${ddmmhhmm(lot.iqc_at)}` : ""}`], [tx("Hold reason"), lot.hold_reason || EMPTY],
  ];
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<InventoryOutlinedIcon />} title={`${tx("Lot Detail")} · ${lot.lot_no}`} subtitle={lot.material_name} onClose={onClose} />
      <DialogContent sx={{ pt: "16px !important", display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" }, gap: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "42% 58%", rowGap: 0.9, columnGap: 1, alignContent: "start" }}>
          {info.map(([k, v]) => [
            <Typography key={`${k}-k`} variant="caption" color="text.secondary">{k}</Typography>,
            <Typography key={`${k}-v`} variant="caption" fontWeight={700} component="div">{v}</Typography>,
          ])}
        </Box>
        <Box><Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>{tx("Lot Traceability")}</Typography><LotTimeline lot={lot} /></Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: "wrap", gap: 1 }}>
        {actions.map(([key, text, enabled]) => (
          <Button key={key} disabled={!canEdit || saving || !enabled} onClick={() => onAction(key, lot)} sx={btn("edit")}>{text}</Button>
        ))}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
