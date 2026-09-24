import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Box, Button, IconButton, LinearProgress, MenuItem, Stack, TextField, Tooltip, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";

import i18n from "../../../../i18n";
import { resolveImageUrl } from "../../../../components/common/ImageUploadField";

const DOC_TYPES = ["DRAWING", "MODEL_3D", "PART", "BOM", "COOLING_LAYOUT", "EJECTION_LAYOUT", "MAINTENANCE_PLAN", "OTHER"];
const ACCEPT = ".pdf,.docx,.xlsx,.pptx,.dwg,.stp,.step,.png,.jpg,.jpeg,.webp,.gif";
const MAX = 20 * 1024 * 1024;
const TEXT = {
  vi: { tab: "Tài liệu", title: "Tài liệu kỹ thuật", type: "Loại tài liệu", name: "Tên tài liệu", choose: "Chọn tệp & tải lên", empty: "Chưa có tài liệu.", tooBig: "Tệp lớn hơn 20 MB.",
    hint: "PDF, Word / Excel / PowerPoint, DWG, STEP hoặc ảnh, tối đa 20 MB. Tài liệu hiển thị ở Chi tiết khuôn và các nút Mô hình số.", deleted: "Đã xóa tài liệu.", added: "Đã thêm tài liệu.",
    confirm: "Xóa tài liệu này?", types: { DRAWING: "Bản vẽ", MODEL_3D: "Mô hình 3D", PART: "Chi tiết sản phẩm", BOM: "BOM", COOLING_LAYOUT: "Sơ đồ làm mát", EJECTION_LAYOUT: "Sơ đồ đẩy", MAINTENANCE_PLAN: "Kế hoạch bảo trì", OTHER: "Khác" } },
  en: { tab: "Docs", title: "Technical documents", type: "Document type", name: "Document name", choose: "Choose file & upload", empty: "No document yet.", tooBig: "The file is larger than 20 MB.",
    hint: "PDF, Word / Excel / PowerPoint, DWG, STEP or images, up to 20 MB. Documents appear in Mold Detail and the Digital Twin buttons.", deleted: "Document deleted.", added: "Document added.",
    confirm: "Delete this document?", types: { DRAWING: "Drawing", MODEL_3D: "3D Model", PART: "Part", BOM: "BOM", COOLING_LAYOUT: "Cooling Layout", EJECTION_LAYOUT: "Ejection Layout", MAINTENANCE_PLAN: "Maintenance Plan", OTHER: "Other" } },
  ja: { tab: "資料", title: "技術資料", type: "資料種別", name: "資料名", choose: "ファイルを選択してアップロード", empty: "資料はありません。", tooBig: "20 MBを超えています。",
    hint: "PDF、Word / Excel / PowerPoint、DWG、STEP、画像（最大20 MB）。金型詳細とデジタルツインのボタンに表示されます。", deleted: "資料を削除しました。", added: "資料を追加しました。",
    confirm: "この資料を削除しますか？", types: { DRAWING: "図面", MODEL_3D: "3Dモデル", PART: "部品", BOM: "BOM", COOLING_LAYOUT: "冷却レイアウト", EJECTION_LAYOUT: "突出レイアウト", MAINTENANCE_PLAN: "保全計画", OTHER: "その他" } },
};
Object.entries(TEXT).forEach(([lang, documents]) => i18n.addResourceBundle(lang, "translation", { moldMaster: { documents } }, true, true));

const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export default function MoldDocuments({ moldId, apiBase, request, actor, canEdit }) {
  const { t } = useTranslation();
  const T = (k) => t(`moldMaster.documents.${k}`);
  const [docs, setDocs] = useState([]);
  const [docType, setDocType] = useState("DRAWING");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const input = useRef(null);
  const load = useCallback(() => request(`${apiBase}/api/mold-master/molds/${moldId}/documents`).then(setDocs).catch(() => setDocs([])), [apiBase, moldId, request]);
  useEffect(() => { load(); }, [load]);

  const upload = async (file) => {
    if (!file) return;
    if (file.size > MAX) { setMsg({ type: "error", text: T("tooBig") }); return; }
    setBusy(true); setMsg(null);
    try {
      const up = await request(`${apiBase}/api/files/documents`, { method: "POST", body: JSON.stringify({ category: "mold", filename: file.name, data: await toBase64(file) }) });
      await request(`${apiBase}/api/mold-master/molds/${moldId}/documents`, { method: "POST", body: JSON.stringify({ doc_type: docType, title: title.trim() || file.name, file_url: up.url,
        file_name: file.name, file_size: up.size, uploaded_by: actor }) });
      setTitle(""); setMsg({ type: "success", text: T("added") }); load();
    } catch (e) { setMsg({ type: "error", text: e.message }); } finally { setBusy(false); if (input.current) input.current.value = ""; }
  };
  const remove = async (doc) => {
    if (!window.confirm(T("confirm"))) return;
    try { await request(`${apiBase}/api/mold-master/molds/${moldId}/documents/${doc.id}`, { method: "DELETE" }); setMsg({ type: "success", text: T("deleted") }); load(); }
    catch (e) { setMsg({ type: "error", text: e.message }); }
  };

  return (
    <Box>
      {canEdit ? (
        <Stack spacing={1} sx={{ mb: 1.5 }}>
          <TextField select size="small" label={T("type")} value={docType} onChange={(e) => setDocType(e.target.value)}>
            {DOC_TYPES.map((d) => <MenuItem key={d} value={d}>{t(`moldMaster.documents.types.${d}`)}</MenuItem>)}
          </TextField>
          <TextField size="small" label={T("name")} value={title} onChange={(e) => setTitle(e.target.value)} />
          <input ref={input} type="file" accept={ACCEPT} hidden onChange={(e) => upload(e.target.files?.[0])} />
          <Button variant="outlined" size="small" startIcon={<UploadFileOutlinedIcon />} disabled={busy} onClick={() => input.current?.click()}>{T("choose")}</Button>
          {busy ? <LinearProgress /> : null}
          <Typography variant="caption" color="text.secondary">{T("hint")}</Typography>
        </Stack>
      ) : null}
      {msg ? <Alert severity={msg.type} sx={{ mb: 1, py: 0 }} onClose={() => setMsg(null)}>{msg.text}</Alert> : null}
      {!docs.length ? <Typography variant="caption" color="text.secondary">{T("empty")}</Typography> : docs.map((d) => (
        <Stack key={d.id} direction="row" spacing={1} sx={{ alignItems: "center", py: 0.6, borderBottom: 1, borderColor: "divider" }}>
          <InsertDriveFileOutlinedIcon sx={{ fontSize: 20, color: /\.pdf$/i.test(d.file_url) ? "#F04438" : "#1570EF" }} />
          <Box sx={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => window.open(resolveImageUrl(d.file_url), "_blank", "noopener")}>
            <Typography variant="caption" fontWeight={700} sx={{ display: "block", color: "#1570EF" }} noWrap>{d.title}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5 }}>{t(`moldMaster.documents.types.${d.doc_type}`)} · {d.file_size ? `${(d.file_size / 1048576).toFixed(2)} MB` : ""}</Typography>
          </Box>
          {canEdit ? <Tooltip title="Delete"><IconButton size="small" onClick={() => remove(d)}><DeleteOutlineIcon fontSize="small" sx={{ color: "#F04438" }} /></IconButton></Tooltip> : null}
        </Stack>
      ))}
    </Box>
  );
}
