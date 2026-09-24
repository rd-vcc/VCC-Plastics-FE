import { useRef, useState } from "react";
import {
  Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, FormControl, IconButton, InputLabel, ListItemText,
  MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";

import { DialogHeader, EMPTY, btn, dialogPaperSx, fromInputDateTime, toInputDateTime } from "../../ProductionPlanning/ui";
import { label, tx } from "./locales";

export const PRIORITIES = ["URGENT", "HIGH", "MEDIUM", "LOW"];
export const SOURCES = ["MANUAL", "SALES_ORDER", "FORECAST", "MRP", "PLANNING"];
export const STATUSES = ["DRAFT", "RELEASED", "SCHEDULING", "IN_PRODUCTION", "COMPLETED", "CLOSED", "CANCELLED"];
const IMPORT_COLUMNS = ["order_no", "customer_code", "product_code", "order_qty", "priority", "planned_start", "planned_end", "due_date", "source", "source_ref", "remark"];

// =========================================================
// ORDER FORM
// =========================================================

export function OrderForm({ item, lookups, defaultOrderNo, plantId, saving, onClose, onSave, onAddCustomer }) {
  const locked = item && item.status !== "DRAFT";
  const [f, setF] = useState(item ? {
    order_no: item.order_no, customer_id: item.customer_id ?? "", product_id: item.product_id, order_qty: item.order_qty,
    priority: item.priority, planned_start: toInputDateTime(item.planned_start), planned_end: toInputDateTime(item.planned_end),
    due_date: toInputDateTime(item.due_date), factory_node_id: item.factory_node_id ?? "", source: item.source,
    source_ref: item.source_ref || "", remark: item.remark || "",
  } : {
    order_no: defaultOrderNo || "", customer_id: "", product_id: "", order_qty: "", priority: "MEDIUM", planned_start: "",
    planned_end: "", due_date: "", factory_node_id: plantId || "", source: "SALES_ORDER", source_ref: "", remark: "",
  });
  const [customerDialog, setCustomerDialog] = useState(false);
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const orderNo = f.order_no || defaultOrderNo || "";
  const windowInvalid = f.planned_start && f.planned_end && f.planned_end <= f.planned_start;
  const valid = orderNo.trim() && f.product_id && Number(f.order_qty) > 0 && !windowInvalid;
  const plants = lookups.factory_nodes.filter((n) => n.node_type === "FACTORY");

  const submit = () => onSave({
    order_no: orderNo.trim(), customer_id: f.customer_id ? Number(f.customer_id) : null, product_id: Number(f.product_id),
    order_qty: Number(f.order_qty), priority: f.priority, planned_start: fromInputDateTime(f.planned_start),
    planned_end: fromInputDateTime(f.planned_end), due_date: fromInputDateTime(f.due_date),
    factory_node_id: f.factory_node_id ? Number(f.factory_node_id) : null, source: f.source,
    source_ref: f.source_ref || null, remark: f.remark || null,
  });

  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="md" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<AssignmentOutlinedIcon />} title={item ? tx("Edit Order") : tx("Create Order")} subtitle={item?.order_no} onClose={onClose} disabled={saving} />
      <DialogContent sx={{ pt: "20px !important" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
          <TextField required size="small" label={tx("Order No.")} value={orderNo} onChange={ch("order_no")} />
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <FormControl size="small" fullWidth>
              <InputLabel>{tx("Customer")}</InputLabel>
              <Select label={tx("Customer")} value={f.customer_id} onChange={ch("customer_id")}>
                <MenuItem value="">{EMPTY}</MenuItem>
                {lookups.customers.map((c) => <MenuItem key={c.id} value={c.id}>{c.customer_code} — {c.customer_name}</MenuItem>)}
              </Select>
            </FormControl>
            <Tooltip title={tx("Add Customer")}><IconButton size="small" onClick={() => setCustomerDialog(true)}><PersonAddAltOutlinedIcon fontSize="small" /></IconButton></Tooltip>
          </Stack>
          <FormControl required size="small" disabled={locked}>
            <InputLabel>{tx("Product")}</InputLabel>
            <Select label={tx("Product")} value={f.product_id} onChange={ch("product_id")}>
              {lookups.products.map((p) => <MenuItem key={p.id} value={p.id}>{p.product_code} — {p.product_name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField required size="small" type="number" label={tx("Order Qty (PCS)")} value={f.order_qty} onChange={ch("order_qty")} inputProps={{ min: 1 }} />
          <FormControl size="small">
            <InputLabel>{tx("Priority")}</InputLabel>
            <Select label={tx("Priority")} value={f.priority} onChange={ch("priority")}>
              {PRIORITIES.map((p) => <MenuItem key={p} value={p}>{label("priority", p)}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>{tx("Plant")}</InputLabel>
            <Select label={tx("Plant")} value={f.factory_node_id} onChange={ch("factory_node_id")}>
              <MenuItem value="">{EMPTY}</MenuItem>
              {plants.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" type="datetime-local" label={tx("Plan Start")} value={f.planned_start} onChange={ch("planned_start")} InputLabelProps={{ shrink: true }} />
          <TextField size="small" type="datetime-local" label={tx("Plan End")} value={f.planned_end} onChange={ch("planned_end")} InputLabelProps={{ shrink: true }} error={Boolean(windowInvalid)} />
          <TextField size="small" type="datetime-local" label={tx("Due Date")} value={f.due_date} onChange={ch("due_date")} InputLabelProps={{ shrink: true }} />
          <FormControl size="small">
            <InputLabel>{tx("Source")}</InputLabel>
            <Select label={tx("Source")} value={f.source} onChange={ch("source")}>
              {SOURCES.map((s) => <MenuItem key={s} value={s}>{label("source", s)}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" label={tx("Source Ref.")} value={f.source_ref} onChange={ch("source_ref")} />
          <TextField size="small" multiline minRows={2} label={tx("Remark")} value={f.remark} onChange={ch("remark")} sx={{ gridColumn: "1 / -1" }} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={btn("cancel")}>{tx("Cancel")}</Button>
        <Button onClick={submit} disabled={saving || !valid} sx={btn("primary")}>{tx("Save")}</Button>
      </DialogActions>
      {customerDialog ? (
        <CustomerDialog onClose={() => setCustomerDialog(false)}
          onSave={async (payload) => { const id = await onAddCustomer(payload); if (id) { setF((o) => ({ ...o, customer_id: id })); setCustomerDialog(false); } }} />
      ) : null}
    </Dialog>
  );
}

function CustomerDialog({ onClose, onSave }) {
  const [f, setF] = useState({ customer_code: "", customer_name: "", short_name: "" });
  const [saving, setSaving] = useState(false);
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<PersonAddAltOutlinedIcon />} title={tx("Add Customer")} onClose={onClose} />
      <DialogContent sx={{ pt: "20px !important" }}>
        <Stack spacing={2}>
          <TextField required size="small" label={tx("Customer Code")} value={f.customer_code} onChange={ch("customer_code")} />
          <TextField required size="small" label={tx("Customer Name")} value={f.customer_name} onChange={ch("customer_name")} />
          <TextField size="small" label={tx("Short Name")} value={f.short_name} onChange={ch("short_name")} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Cancel")}</Button>
        <Button disabled={saving || !f.customer_code.trim() || !f.customer_name.trim()} sx={btn("primary")}
          onClick={async () => { setSaving(true); try { await onSave({ ...f, short_name: f.short_name || null }); } finally { setSaving(false); } }}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

// =========================================================
// PRIORITY / REASON / COPY
// =========================================================

export function PriorityDialog({ order, saving, onClose, onSave }) {
  const [priority, setPriority] = useState(order.priority);
  const [remark, setRemark] = useState("");
  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<FlagOutlinedIcon />} title={tx("Change Priority")} subtitle={order.order_no} onClose={onClose} disabled={saving} />
      <DialogContent sx={{ pt: "20px !important" }}>
        <Stack spacing={2}>
          <FormControl size="small">
            <InputLabel>{tx("New Priority")}</InputLabel>
            <Select label={tx("New Priority")} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map((p) => <MenuItem key={p} value={p}>{label("priority", p)}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" label={tx("Reason")} value={remark} onChange={(e) => setRemark(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={btn("cancel")}>{tx("Cancel")}</Button>
        <Button disabled={saving || priority === order.priority} onClick={() => onSave(priority, remark || null)} sx={btn("primary")}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export function ReasonDialog({ title, subtitle, message, reasonLabel, required, danger, saving, onClose, onConfirm }) {
  const [remark, setRemark] = useState("");
  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<FlagOutlinedIcon />} tone={danger ? "danger" : "primary"} title={title} subtitle={subtitle} onClose={onClose} disabled={saving} />
      <DialogContent sx={{ pt: "20px !important" }}>
        <Stack spacing={2}>
          {message ? <Alert severity={danger ? "warning" : "info"} sx={{ py: 0 }}>{message}</Alert> : null}
          <TextField size="small" multiline minRows={2} required={required} label={reasonLabel || tx("Remark")} value={remark} onChange={(e) => setRemark(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={btn("cancel")}>{tx("Cancel")}</Button>
        <Button disabled={saving || (required && !remark.trim())} onClick={() => onConfirm(remark.trim() || null)} sx={btn(danger ? "delete" : "primary")}>{tx("Confirm")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export function CopyDialog({ order, saving, onClose, onConfirm }) {
  const [orderNo, setOrderNo] = useState("");
  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<ContentCopyOutlinedIcon />} title={tx("Copy Order")} subtitle={order.order_no} onClose={onClose} disabled={saving} />
      <DialogContent sx={{ pt: "20px !important" }}>
        <TextField fullWidth size="small" label={tx("New Order No.")} value={orderNo} onChange={(e) => setOrderNo(e.target.value)} helperText={tx("Leave blank to generate automatically.")} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={btn("cancel")}>{tx("Cancel")}</Button>
        <Button disabled={saving} onClick={() => onConfirm(orderNo.trim() || null)} sx={btn("primary")}>{tx("Copy Order")}</Button>
      </DialogActions>
    </Dialog>
  );
}

// =========================================================
// IMPORT
// =========================================================

export function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [header = [], ...body] = rows.filter((r) => r.some((v) => v.trim()));
  const keys = header.map((h) => h.replace(/^\uFEFF/, "").trim().toLowerCase());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

export function downloadImportTemplate() {
  const sample = ["", "MOLEX", "1", "5000", "HIGH", "2026-10-01 06:00", "2026-10-02 18:00", "2026-10-03 12:00", "SALES_ORDER", "SO-00001", ""];
  const blob = new Blob([`\uFEFF${IMPORT_COLUMNS.join(",")}\n${sample.join(",")}\n`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "production-order-import-template.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

export function ImportDialog({ saving, onClose, onImport }) {
  const inputRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null);
  const pick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name); setResult(null);
    const parsed = parseCsv(await file.text()).map((r) => ({
      ...r,
      ...Object.fromEntries(["planned_start", "planned_end", "due_date"].map((k) => [k, r[k] ? r[k].replace(" ", "T") : ""])),
    }));
    setRows(parsed);
  };
  const submit = async () => setResult(await onImport(rows));
  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="lg" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<UploadFileOutlinedIcon />} title={tx("Import Orders")} subtitle={tx("Columns: order_no, customer_code, product_code, order_qty, priority, planned_start, planned_end, due_date, source, source_ref, remark")} onClose={onClose} disabled={saving} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
          <input ref={inputRef} type="file" accept=".csv,text/csv" hidden onChange={pick} />
          <Button startIcon={<UploadFileOutlinedIcon />} onClick={() => inputRef.current?.click()} sx={btn("cancel")}>{tx("Choose File")}</Button>
          <Typography variant="body2" color="text.secondary">{fileName ? `${fileName} · ${rows.length} ${tx("rows")}` : tx("Import file (CSV)")}</Typography>
          <Box sx={{ flex: 1 }} />
          <Button size="small" onClick={downloadImportTemplate} sx={{ textTransform: "none" }}>{tx("Download Import Template")}</Button>
        </Stack>
        {result?.errors?.length ? (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {tx("Import rejected. Fix the listed rows and try again.")}
            {result.errors.map((e) => <Typography key={e.row} variant="caption" sx={{ display: "block" }}>{tx("Row")} {e.row}: {e.message}</Typography>)}
          </Alert>
        ) : null}
        {rows.length ? (
          <Box sx={{ maxHeight: 360, overflow: "auto" }}>
            <Table size="small" stickyHeader sx={{ "& td, & th": { fontSize: 12, whiteSpace: "nowrap" } }}>
              <TableHead><TableRow><TableCell>#</TableCell>{IMPORT_COLUMNS.map((c) => <TableCell key={c}>{c}</TableCell>)}</TableRow></TableHead>
              <TableBody>
                {rows.map((r, i) => {
                  const bad = result?.errors?.some((e) => e.row === i + 1);
                  return (
                    <TableRow key={i} sx={{ bgcolor: bad ? "rgba(240,68,56,.08)" : "inherit" }}>
                      <TableCell>{i + 1}</TableCell>{IMPORT_COLUMNS.map((c) => <TableCell key={c}>{r[c] || ""}</TableCell>)}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={btn("cancel")}>{tx("Close")}</Button>
        <Button disabled={saving || !rows.length} onClick={submit} sx={btn("primary")}>{tx("Import")}</Button>
      </DialogActions>
    </Dialog>
  );
}

// =========================================================
// ADVANCED SEARCH
// =========================================================

export function AdvancedSearchDialog({ value, lookups, onClose, onApply }) {
  const [f, setF] = useState(value);
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<ManageSearchOutlinedIcon />} title={tx("Advanced Search")} onClose={onClose} />
      <DialogContent sx={{ pt: "20px !important" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
          <TextField size="small" label={tx("Keyword")} value={f.keyword} onChange={ch("keyword")} sx={{ gridColumn: { md: "span 3", sm: "span 2" } }} />
          <FormControl size="small">
            <InputLabel>{tx("Status")}</InputLabel>
            <Select multiple label={tx("Status")} value={f.statuses} onChange={ch("statuses")} renderValue={(v) => v.map((s) => label("status", s)).join(", ")}>
              {STATUSES.map((s) => <MenuItem key={s} value={s}><Checkbox size="small" checked={f.statuses.includes(s)} /><ListItemText primary={label("status", s)} /></MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>{tx("Customer")}</InputLabel>
            <Select label={tx("Customer")} value={f.customer_id} onChange={ch("customer_id")}>
              <MenuItem value="">{tx("All")}</MenuItem>
              {lookups.customers.map((c) => <MenuItem key={c.id} value={c.id}>{c.customer_name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>{tx("Product")}</InputLabel>
            <Select label={tx("Product")} value={f.product_id} onChange={ch("product_id")}>
              <MenuItem value="">{tx("All")}</MenuItem>
              {lookups.products.map((p) => <MenuItem key={p.id} value={p.id}>{p.product_code} — {p.product_name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>{tx("Priority")}</InputLabel>
            <Select label={tx("Priority")} value={f.priority} onChange={ch("priority")}>
              <MenuItem value="">{tx("All")}</MenuItem>
              {PRIORITIES.map((p) => <MenuItem key={p} value={p}>{label("priority", p)}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>{tx("Source")}</InputLabel>
            <Select label={tx("Source")} value={f.source} onChange={ch("source")}>
              <MenuItem value="">{tx("All")}</MenuItem>
              {SOURCES.map((s) => <MenuItem key={s} value={s}>{label("source", s)}</MenuItem>)}
            </Select>
          </FormControl>
          <Box />
          <TextField size="small" type="date" label={tx("Plan From")} value={f.date_from} onChange={ch("date_from")} InputLabelProps={{ shrink: true }} />
          <TextField size="small" type="date" label={tx("Plan To")} value={f.date_to} onChange={ch("date_to")} InputLabelProps={{ shrink: true }} />
          <Box />
          <TextField size="small" type="date" label={tx("Due From")} value={f.due_from} onChange={ch("due_from")} InputLabelProps={{ shrink: true }} />
          <TextField size="small" type="date" label={tx("Due To")} value={f.due_to} onChange={ch("due_to")} InputLabelProps={{ shrink: true }} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => setF(Object.fromEntries(Object.keys(f).map((k) => [k, Array.isArray(f[k]) ? [] : ""])))} sx={btn("cancel")}>{tx("Clear")}</Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Cancel")}</Button>
        <Button onClick={() => onApply(f)} sx={btn("primary")}>{tx("Apply")}</Button>
      </DialogActions>
    </Dialog>
  );
}
