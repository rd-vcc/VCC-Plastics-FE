import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Autocomplete, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, Divider, IconButton, InputAdornment,
  MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircle";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SearchIcon from "@mui/icons-material/Search";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";

import { buttonSystem } from "../../../../components/button/ButtonSystem";

export const COMPONENT_TYPES = ["RESIN", "MASTERBATCH", "ADDITIVE", "INSERT", "PACKAGING", "CONSUMABLE", "OTHER"];
const STATUS_TONES = { DRAFT: "default", ACTIVE: "success", INACTIVE: "warning" };
const EMPTY = "—";

function btn(type, extra = {}) {
  const s = buttonSystem[type] || buttonSystem.edit || { base: {} };
  return { ...(s.base || {}), ...(s.hover ? { "&:hover": s.hover } : {}), ...(s.active ? { "&:active": s.active } : {}), ...extra };
}

const fmt = (value, digits = 4) => (value == null || value === "" ? EMPTY : Number(value).toLocaleString(undefined, { maximumFractionDigits: digits }));
const day = (value) => (value ? String(value).slice(0, 10) : "");

function guessType(material) {
  const code = String(material?.material_code || "").toUpperCase();
  if (material?.material_type === "PACKAGING") return "PACKAGING";
  if (material?.material_type === "ADDITIVE") return "ADDITIVE";
  if (code.startsWith("MB-")) return "MASTERBATCH";
  return "RESIN";
}

export function BomStatusChip({ status, tx }) {
  return <Chip size="small" variant="outlined" color={STATUS_TONES[status] || "default"} label={tx(`BOM_${status}`)} sx={{ height: 21, width: 88, fontSize: 10.5, fontWeight: 800, "& .MuiChip-label": { px: 0.5 } }} />;
}

// =========================================================
// SUMMARY (product detail tab)
// =========================================================

export function BomSummary({ productId, api, requestJson, tx, onManage, refreshKey }) {
  const [boms, setBoms] = useState(null);
  const [detail, setDetail] = useState(null);
  useEffect(() => {
    let cancelled = false;
    setBoms(null); setDetail(null);
    requestJson(`${api}/products/${productId}/boms`).then(async (list) => {
      if (cancelled) return;
      setBoms(list);
      const active = list.find((b) => b.status === "ACTIVE");
      if (active) { const d = await requestJson(`${api}/boms/${active.id}`); if (!cancelled) setDetail(d); }
    }).catch(() => { if (!cancelled) setBoms([]); });
    return () => { cancelled = true; };
  }, [productId, api, requestJson, refreshKey]);

  if (!boms) return <Typography variant="caption" color="text.secondary">…</Typography>;
  const drafts = boms.filter((b) => b.status === "DRAFT").length;
  return (
    <Stack spacing={1}>
      {detail ? (
        <>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="body2" fontWeight={800}>{tx("Revision")} {detail.bom_revision}</Typography>
            <BomStatusChip status={detail.status} tx={tx} />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {tx("Base quantity")}: {fmt(detail.base_qty, 3)} PCS · {tx("Effective from")}: {day(detail.effective_from) || EMPTY}
          </Typography>
          <Divider />
          {detail.items.map((item) => (
            <Box key={item.id} sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" fontWeight={700} noWrap sx={{ display: "block" }}>{item.material_code}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 10.5 }}>{tx(`TYPE_${item.component_type}`)}{Number(item.scrap_pct) ? ` · +${fmt(item.scrap_pct, 2)}%` : ""}</Typography>
              </Box>
              <Typography variant="caption" fontWeight={800}>{fmt(item.qty_per_base)} {item.unit}</Typography>
            </Box>
          ))}
        </>
      ) : (
        <Alert severity="warning" sx={{ py: 0 }}>{tx("No active BOM.")}</Alert>
      )}
      {drafts ? <Typography variant="caption" color="text.secondary">{tx("{{count}} draft revision(s)", { count: drafts })}</Typography> : null}
      <Button size="small" startIcon={<AccountTreeOutlinedIcon />} onClick={onManage} sx={btn("edit")}>{tx("Manage BOM")}</Button>
    </Stack>
  );
}

// =========================================================
// MANAGER
// =========================================================

function emptyLine() {
  return { key: Math.random().toString(36).slice(2), material_id: null, component_type: "RESIN", qty_per_base: "", scrap_pct: 0, is_critical: true, remark: "" };
}

export function BomManagerDialog({ product, api, requestJson, tx, canEdit, actor, notify, onClose, onChanged }) {
  const [boms, setBoms] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [calcQty, setCalcQty] = useState(10000);
  const [requirement, setRequirement] = useState(null);

  const loadList = useCallback(async (preferId) => {
    const list = await requestJson(`${api}/products/${product.id}/boms`);
    setBoms(list);
    setSelectedId((old) => {
      const want = preferId ?? old;
      if (want && list.some((b) => b.id === want)) return want;
      return list[0]?.id ?? null;
    });
  }, [api, product.id, requestJson]);

  useEffect(() => {
    requestJson(`${api}/bom-lookups`).then((d) => setMaterials(d.materials)).catch((e) => notify("error", e.message));
    loadList().catch((e) => notify("error", e.message));
  }, [api, requestJson, loadList, notify]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); setForm(null); return; }
    requestJson(`${api}/boms/${selectedId}`).then((d) => {
      setDetail(d);
      setForm({
        bom_revision: d.bom_revision, base_qty: d.base_qty, effective_from: day(d.effective_from), effective_to: day(d.effective_to),
        description: d.description || "",
        items: d.items.map((i) => ({ key: String(i.id), material_id: i.material_id, component_type: i.component_type, qty_per_base: i.qty_per_base,
          scrap_pct: i.scrap_pct, is_critical: Boolean(i.is_critical), remark: i.remark || "" })),
      });
      setRequirement(null);
    }).catch((e) => notify("error", e.message));
  }, [selectedId, api, requestJson, notify]);

  const materialById = useMemo(() => Object.fromEntries(materials.map((m) => [m.id, m])), [materials]);
  const editable = canEdit && detail?.status === "DRAFT";
  const hasActive = boms.some((b) => b.status === "ACTIVE");
  const usedIds = new Set((form?.items || []).map((i) => i.material_id).filter(Boolean));
  const lineErrors = (form?.items || []).map((i) => !i.material_id || !(Number(i.qty_per_base) > 0) || Number(i.scrap_pct) < 0 || Number(i.scrap_pct) > 100);
  const valid = form && Number(form.base_qty) > 0 && !lineErrors.some(Boolean) && (!form.effective_to || !form.effective_from || form.effective_to >= form.effective_from);

  const setLine = (key, patch) => setForm((f) => ({ ...f, items: f.items.map((i) => (i.key === key ? { ...i, ...patch } : i)) }));
  const payload = () => ({
    bom_revision: form.bom_revision || null, base_qty: Number(form.base_qty), effective_from: form.effective_from || null,
    effective_to: form.effective_to || null, description: form.description || null,
    items: form.items.map((i) => ({ material_id: i.material_id, component_type: i.component_type, qty_per_base: Number(i.qty_per_base),
      scrap_pct: Number(i.scrap_pct || 0), is_critical: Boolean(i.is_critical), remark: i.remark || null })),
  });

  const act = async (fn, text, preferId) => {
    setSaving(true);
    try { const result = await fn(); notify("success", text); await loadList(preferId ?? result?.id); onChanged?.(); return result; }
    catch (e) { notify("error", e.message); return null; } finally { setSaving(false); }
  };
  const createNew = () => act(() => requestJson(`${api}/products/${product.id}/boms`, { method: "POST", body: JSON.stringify({ base_qty: 1000, items: [], created_by: actor }) }), tx("BOM created."));
  const save = () => act(async () => {
    await requestJson(`${api}/boms/${detail.id}`, { method: "PUT", body: JSON.stringify({ ...payload(), version: detail.version, updated_by: actor }) });
    return { id: detail.id };
  }, tx("BOM saved."));
  const activate = () => {
    if (!window.confirm(tx("Activate this BOM? The current active revision will be retired."))) return;
    act(async () => {
      await requestJson(`${api}/boms/${detail.id}`, { method: "PUT", body: JSON.stringify({ ...payload(), version: detail.version, updated_by: actor }) });
      await requestJson(`${api}/boms/${detail.id}/activate`, { method: "POST", body: JSON.stringify({ version: detail.version + 1, actor, effective_from: form.effective_from || null }) });
      return { id: detail.id };
    }, tx("BOM activated."));
  };
  const deactivate = () => {
    if (!window.confirm(tx("Deactivate this BOM? The product will have no active BOM."))) return;
    act(async () => { await requestJson(`${api}/boms/${detail.id}/deactivate`, { method: "POST", body: JSON.stringify({ version: detail.version, actor }) }); return { id: detail.id }; }, tx("BOM deactivated."));
  };
  const copy = () => act(() => requestJson(`${api}/boms/${detail.id}/copy`, { method: "POST", body: JSON.stringify({ created_by: actor }) }), tx("New revision created."));
  const remove = () => {
    if (!window.confirm(tx("Delete this draft BOM?"))) return;
    act(async () => { await requestJson(`${api}/boms/${detail.id}`, { method: "DELETE" }); return { id: null }; }, tx("BOM deleted."), null);
  };
  const calculate = async () => {
    try { setRequirement(await requestJson(`${api}/boms/${detail.id}/requirement?qty=${Number(calcQty)}`)); }
    catch (e) { notify("error", e.message); }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="xl" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", height: "90vh" } }}>
      <Box sx={{ px: 3, py: 2, display: "flex", alignItems: "center", gap: 1.5, borderBottom: 1, borderColor: "divider", bgcolor: (t) => (t.palette.mode === "dark" ? "rgba(0,91,171,0.14)" : "#F1F7FF") }}>
        <AccountTreeOutlinedIcon color="primary" />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={800} noWrap>{tx("Product BOM")} — {product.product_code}</Typography>
          <Typography variant="body2" color="text.secondary" noWrap>{product.product_name}</Typography>
        </Box>
        <IconButton size="small" disabled={saving} onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </Box>
      <DialogContent sx={{ p: 0, display: "grid", gridTemplateColumns: { xs: "1fr", md: "240px 1fr" }, minHeight: 0 }}>
        {/* revisions */}
        <Box sx={{ borderRight: 1, borderColor: "divider", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <Stack direction="row" sx={{ p: 1.25, alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="subtitle2" fontWeight={800}>{tx("Revisions")}</Typography>
            <Button size="small" startIcon={<AddIcon />} disabled={!canEdit || saving} onClick={createNew} sx={{ textTransform: "none" }}>{tx("New BOM")}</Button>
          </Stack>
          <Box sx={{ flex: 1, overflow: "auto" }}>
            {boms.length === 0 ? <Typography variant="caption" color="text.secondary" sx={{ px: 1.5 }}>{tx("No BOM yet. Create the first revision.")}</Typography> : boms.map((b) => (
              <Box key={b.id} onClick={() => setSelectedId(b.id)}
                sx={{ px: 1.5, py: 1, cursor: "pointer", borderLeft: 3, borderColor: b.id === selectedId ? "primary.main" : "transparent", bgcolor: b.id === selectedId ? "action.selected" : "transparent", "&:hover": { bgcolor: "action.hover" } }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="body2" fontWeight={800}>{tx("Revision")} {b.bom_revision}</Typography>
                  <BomStatusChip status={b.status} tx={tx} />
                </Stack>
                <Typography variant="caption" color="text.secondary">{b.item_count} {tx("lines")} · {day(b.effective_from) || EMPTY}{b.effective_to ? ` → ${day(b.effective_to)}` : ""}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* editor */}
        <Box sx={{ overflow: "auto", p: 2 }}>
          {!detail || !form ? (
            <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}><Typography color="text.secondary">{tx("Select or create a BOM revision.")}</Typography></Box>
          ) : (
            <Stack spacing={2}>
              {!editable && detail.status !== "DRAFT" ? (
                <Alert severity="info" sx={{ py: 0 }}>{tx("Active and inactive revisions are read-only. Create a new revision to change the BOM.")}</Alert>
              ) : null}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", lg: "120px 160px 160px 160px 1fr" }, gap: 1.5 }}>
                <TextField size="small" label={tx("Revision")} value={form.bom_revision} disabled={!editable} onChange={(e) => setForm({ ...form, bom_revision: e.target.value })} />
                <TextField size="small" type="number" label={tx("Base quantity")} value={form.base_qty} disabled={!editable} onChange={(e) => setForm({ ...form, base_qty: e.target.value })}
                  InputProps={{ endAdornment: <InputAdornment position="end">PCS</InputAdornment> }} error={!(Number(form.base_qty) > 0)} />
                <TextField size="small" type="date" label={tx("Effective from")} value={form.effective_from} disabled={!editable} onChange={(e) => setForm({ ...form, effective_from: e.target.value })} InputLabelProps={{ shrink: true }} />
                <TextField size="small" type="date" label={tx("Effective to")} value={form.effective_to} disabled={!editable} onChange={(e) => setForm({ ...form, effective_to: e.target.value })} InputLabelProps={{ shrink: true }} />
                <TextField size="small" label={tx("Description")} value={form.description} disabled={!editable} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {tx("Quantities are per base quantity, in each material's own unit (e.g. 13.3 KG per 1,000 PCS).")}
              </Typography>

              <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small" sx={{ "& td, & th": { fontSize: 12, px: 1 }, "& th": { fontWeight: 800, whiteSpace: "nowrap", bgcolor: "action.hover" } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell width={36}>#</TableCell>
                        <TableCell sx={{ minWidth: 260 }}>{tx("Material")}</TableCell>
                        <TableCell sx={{ minWidth: 140 }}>{tx("Component Type")}</TableCell>
                        <TableCell sx={{ minWidth: 130 }} align="right">{tx("Qty / base")}</TableCell>
                        <TableCell>{tx("Unit")}</TableCell>
                        <TableCell sx={{ minWidth: 100 }} align="right">{tx("Scrap %")}</TableCell>
                        <TableCell align="right">{tx("Qty / 1 PCS")}</TableCell>
                        <TableCell align="center">{tx("Critical")}</TableCell>
                        <TableCell sx={{ minWidth: 160 }}>{tx("Remark")}</TableCell>
                        <TableCell width={40} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {form.items.length === 0 ? (
                        <TableRow><TableCell colSpan={10}><Typography variant="caption" color="text.secondary">{tx("No material lines yet.")}</Typography></TableCell></TableRow>
                      ) : form.items.map((line, index) => {
                        const material = materialById[line.material_id];
                        const perPiece = Number(form.base_qty) > 0 && Number(line.qty_per_base) > 0
                          ? (Number(line.qty_per_base) / Number(form.base_qty)) * (1 + Number(line.scrap_pct || 0) / 100) : null;
                        return (
                          <TableRow key={line.key} sx={{ bgcolor: lineErrors[index] && editable ? "rgba(240,68,56,.06)" : "inherit" }}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              {editable ? (
                                <Autocomplete size="small" options={materials} value={material || null}
                                  getOptionLabel={(m) => `${m.material_code} — ${m.material_name}`}
                                  getOptionDisabled={(m) => usedIds.has(m.id) && m.id !== line.material_id}
                                  isOptionEqualToValue={(a, b) => a.id === b.id}
                                  onChange={(_, m) => setLine(line.key, { material_id: m?.id ?? null, component_type: m ? guessType(m) : line.component_type })}
                                  renderInput={(p) => <TextField {...p} placeholder={tx("Select material")} />} />
                              ) : (
                                <><Typography variant="caption" fontWeight={700} sx={{ display: "block" }}>{material?.material_code || detail.items[index]?.material_code}</Typography>
                                  <Typography variant="caption" color="text.secondary">{material?.material_name || detail.items[index]?.material_name}</Typography></>
                              )}
                            </TableCell>
                            <TableCell>
                              {editable ? (
                                <Select size="small" fullWidth value={line.component_type} onChange={(e) => setLine(line.key, { component_type: e.target.value })}>
                                  {COMPONENT_TYPES.map((t) => <MenuItem key={t} value={t}>{tx(`TYPE_${t}`)}</MenuItem>)}
                                </Select>
                              ) : tx(`TYPE_${line.component_type}`)}
                            </TableCell>
                            <TableCell align="right">
                              {editable ? <TextField size="small" type="number" value={line.qty_per_base} onChange={(e) => setLine(line.key, { qty_per_base: e.target.value })} inputProps={{ min: 0, step: "any", style: { textAlign: "right" } }} /> : fmt(line.qty_per_base)}
                            </TableCell>
                            <TableCell>{material?.unit || detail.items[index]?.unit || EMPTY}</TableCell>
                            <TableCell align="right">
                              {editable ? <TextField size="small" type="number" value={line.scrap_pct} onChange={(e) => setLine(line.key, { scrap_pct: e.target.value })} inputProps={{ min: 0, max: 100, step: "any", style: { textAlign: "right" } }} /> : fmt(line.scrap_pct, 2)}
                            </TableCell>
                            <TableCell align="right">{perPiece == null ? EMPTY : fmt(perPiece, 6)}</TableCell>
                            <TableCell align="center"><Checkbox size="small" disabled={!editable} checked={Boolean(line.is_critical)} onChange={(e) => setLine(line.key, { is_critical: e.target.checked })} /></TableCell>
                            <TableCell>{editable ? <TextField size="small" fullWidth value={line.remark} onChange={(e) => setLine(line.key, { remark: e.target.value })} /> : line.remark || EMPTY}</TableCell>
                            <TableCell>{editable ? <IconButton size="small" color="error" onClick={() => setForm((f) => ({ ...f, items: f.items.filter((i) => i.key !== line.key) }))}><DeleteOutlineIcon fontSize="small" /></IconButton> : null}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
                {editable ? <Button size="small" startIcon={<AddIcon />} onClick={() => setForm((f) => ({ ...f, items: [...f.items, emptyLine()] }))} sx={{ m: 1, textTransform: "none" }}>{tx("Add Line")}</Button> : null}
              </Paper>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.4fr 1fr" }, gap: 2 }}>
                <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                    <CalculateOutlinedIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={800} sx={{ flex: 1 }}>{tx("Material requirement calculator")}</Typography>
                    <TextField size="small" type="number" value={calcQty} onChange={(e) => setCalcQty(e.target.value)} sx={{ width: 150 }}
                      InputProps={{ endAdornment: <InputAdornment position="end">PCS</InputAdornment> }} />
                    <Button size="small" disabled={!(Number(calcQty) > 0) || !detail.items.length} onClick={calculate} sx={btn("primary")}>{tx("Calculate")}</Button>
                  </Stack>
                  {detail.status === "DRAFT" && JSON.stringify(payload().items) !== JSON.stringify(detail.items.map((i) => ({ material_id: i.material_id, component_type: i.component_type, qty_per_base: Number(i.qty_per_base), scrap_pct: Number(i.scrap_pct || 0), is_critical: Boolean(i.is_critical), remark: i.remark || null }))) ? (
                    <Typography variant="caption" color="warning.main">{tx("Save the BOM first to calculate with the latest lines.")}</Typography>
                  ) : null}
                  {requirement ? (
                    <Table size="small" sx={{ "& td, & th": { fontSize: 12, px: 1 } }}>
                      <TableHead><TableRow><TableCell>{tx("Material")}</TableCell><TableCell align="right">{tx("Net")}</TableCell><TableCell align="right">{tx("Required (incl. scrap)")}</TableCell><TableCell>{tx("Unit")}</TableCell></TableRow></TableHead>
                      <TableBody>
                        {requirement.rows.map((r) => (
                          <TableRow key={r.material_id}><TableCell>{r.material_code}</TableCell><TableCell align="right">{fmt(r.net_qty, 3)}</TableCell><TableCell align="right" sx={{ fontWeight: 800 }}>{fmt(r.required_qty, 3)}</TableCell><TableCell>{r.unit}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : null}
                </Paper>
                <Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5, maxHeight: 260, overflow: "auto" }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>{tx("History")}</Typography>
                  {detail.history.map((h) => (
                    <Box key={h.id} sx={{ py: 0.5, borderBottom: 1, borderColor: "divider" }}>
                      <Typography variant="caption" fontWeight={700} sx={{ display: "block" }}>{tx(`BOM_ACTION_${h.action}`)} — {h.from_status ? tx(`BOM_${h.from_status}`) : EMPTY} → {h.to_status ? tx(`BOM_${h.to_status}`) : EMPTY}</Typography>
                      <Typography variant="caption" color="text.secondary">{String(h.acted_at).replace("T", " ").slice(0, 16)} · {h.actor}{h.remark ? ` · ${h.remark}` : ""}</Typography>
                    </Box>
                  ))}
                </Paper>
              </Box>
            </Stack>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, borderTop: 1, borderColor: "divider", flexWrap: "wrap", gap: 1 }}>
        {detail?.status === "DRAFT" ? <Button disabled={!canEdit || saving} color="error" startIcon={<DeleteOutlineIcon />} onClick={remove} sx={btn("delete")}>{tx("Delete")}</Button> : null}
        {detail?.status === "ACTIVE" ? <Button disabled={!canEdit || saving} startIcon={<PauseCircleOutlineIcon />} onClick={deactivate} sx={btn("cancel")}>{tx("Deactivate")}</Button> : null}
        <Box sx={{ flex: 1 }} />
        {detail && detail.status !== "DRAFT" ? (
          <Tooltip title={tx("Copies this revision into a new Draft revision.")}>
            <span><Button disabled={!canEdit || saving} startIcon={<ContentCopyOutlinedIcon />} onClick={copy} sx={btn("edit")}>{tx("New Revision")}</Button></span>
          </Tooltip>
        ) : null}
        {editable ? <Button disabled={saving || !valid} startIcon={<SaveOutlinedIcon />} onClick={save} sx={btn("edit")}>{tx("Save")}</Button> : null}
        {editable ? (
          <Tooltip title={hasActive ? tx("Activating retires the current active revision.") : ""}>
            <span><Button disabled={saving || !valid || !form.items.length} startIcon={<TaskAltOutlinedIcon />} onClick={activate} sx={btn("primary")}>{tx("Activate")}</Button></span>
          </Tooltip>
        ) : null}
        <Button onClick={onClose} disabled={saving} sx={btn("cancel")}>{tx("Close")}</Button>
      </DialogActions>
    </Dialog>
  );
}

// =========================================================
// OVERVIEW (toolbar "Product BOM")
// =========================================================

export function BomOverviewDialog({ api, requestJson, tx, products, notify, onOpen, onClose }) {
  const [rows, setRows] = useState([]);
  const [keyword, setKeyword] = useState("");
  useEffect(() => { requestJson(`${api}/boms`).then(setRows).catch((e) => notify("error", e.message)); }, [api, requestJson, notify]);
  const active = useMemo(() => new Set(rows.filter((r) => r.status === "ACTIVE").map((r) => r.product_id)), [rows]);
  const list = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return products.filter((p) => !q || `${p.product_code} ${p.product_name}`.toLowerCase().includes(q)).map((p) => ({
      ...p, revisions: rows.filter((r) => r.product_id === p.id),
    }));
  }, [products, rows, keyword]);
  const missing = products.filter((p) => !active.has(p.id)).length;
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <Box sx={{ px: 3, py: 2, display: "flex", alignItems: "center", gap: 1.5, borderBottom: 1, borderColor: "divider" }}>
        <AccountTreeOutlinedIcon color="primary" />
        <Typography variant="subtitle1" fontWeight={800} sx={{ flex: 1 }}>{tx("Product BOM")}</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </Box>
      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
          <TextField size="small" placeholder={tx("Search by part number or name...")} value={keyword} onChange={(e) => setKeyword(e.target.value)} sx={{ flex: 1 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
          {missing ? <Chip color="warning" variant="outlined" label={tx("{{count}} product(s) without active BOM", { count: missing })} /> : null}
        </Stack>
        <Table size="small" sx={{ "& td, & th": { fontSize: 12 } }}>
          <TableHead><TableRow><TableCell>{tx("Part Number")}</TableCell><TableCell>{tx("Product Name")}</TableCell><TableCell>{tx("Active revision")}</TableCell><TableCell>{tx("Revisions")}</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {list.map((p) => {
              const current = p.revisions.find((r) => r.status === "ACTIVE");
              return (
                <TableRow key={p.id} hover sx={{ cursor: "pointer" }} onClick={() => onOpen(p)}>
                  <TableCell sx={{ fontWeight: 700 }}>{p.product_code}</TableCell>
                  <TableCell>{p.product_name}</TableCell>
                  <TableCell>{current ? `${current.bom_revision} · ${current.item_count} ${tx("lines")}` : <Typography variant="caption" color="warning.main">{tx("No active BOM.")}</Typography>}</TableCell>
                  <TableCell>{p.revisions.length}</TableCell>
                  <TableCell align="right"><Button size="small" sx={{ textTransform: "none" }}>{tx("Manage BOM")}</Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={onClose} sx={btn("cancel")}>{tx("Close")}</Button></DialogActions>
    </Dialog>
  );
}
