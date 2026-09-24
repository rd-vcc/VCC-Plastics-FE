import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

import { getAccessToken } from "../../auth/auth";
import i18n from "../../i18n";
import { API_CONFIG } from "../../config/config";

const API_BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/gif"];

const TEXT = {
  vi: { upload: "Tải ảnh lên", change: "Đổi ảnh", remove: "Xóa ảnh", hint: "PNG, JPG, WEBP, GIF · tối đa 5 MB", type: "Chỉ nhận ảnh PNG, JPG, WEBP hoặc GIF.", size: "Ảnh vượt quá 5 MB.", fail: "Tải ảnh thất bại", label: "Ảnh minh họa" },
  ja: { upload: "画像をアップロード", change: "画像を変更", remove: "画像を削除", hint: "PNG・JPG・WEBP・GIF ・最大 5 MB", type: "PNG・JPG・WEBP・GIF のみ対応しています。", size: "画像が 5 MB を超えています。", fail: "アップロードに失敗しました", label: "画像" },
  en: { upload: "Upload image", change: "Change image", remove: "Remove image", hint: "PNG, JPG, WEBP, GIF · max 5 MB", type: "Only PNG, JPG, WEBP or GIF images are allowed.", size: "The image is larger than 5 MB.", fail: "Upload failed", label: "Image" },
};
const lang = () => {
  const l = String(i18n.resolvedLanguage || i18n.language || "en").split("-")[0];
  return TEXT[l] ? l : "en";
};

/** Turns a stored image path into a displayable URL (uploaded files live on the API server). */
export function resolveImageUrl(url) {
  if (!url) return null;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (url.startsWith("/uploads/")) return `${API_BASE}${url}`;
  return url;
}

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

/**
 * Image field for System Configuration forms: preview + upload + remove.
 * value = stored url (e.g. "/uploads/images/product/xxx.png"), onChange(url | null).
 */
export default function ImageUploadField({ value, onChange, category = "other", label, disabled, height = 140, onError }) {
  useTranslation();
  const t = TEXT[lang()];
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const src = resolveImageUrl(value);

  const fail = (text) => { setError(text); if (onError) onError(text); };
  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPT.includes(file.type)) return fail(t.type);
    if (file.size > MAX_BYTES) return fail(t.size);
    setBusy(true); setError("");
    try {
      const data = await readAsDataUrl(file);
      const token = getAccessToken();
      const res = await fetch(`${API_BASE}/api/files/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ category, filename: file.name, data }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.detail || `HTTP ${res.status}`);
      onChange(body.url);
    } catch (err) {
      fail(`${t.fail}: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>{label || t.label}</Typography>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Box onClick={() => !disabled && !busy && inputRef.current?.click()} sx={{ width: height * 1.3, height, flexShrink: 0, borderRadius: 2, border: 1, borderStyle: src ? "solid" : "dashed",
          borderColor: "divider", display: "grid", placeItems: "center", overflow: "hidden", bgcolor: "action.hover", cursor: disabled ? "default" : "pointer" }}>
          {busy ? <CircularProgress size={28} /> : src ? <Box component="img" src={src} alt="" sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
            : <ImageOutlinedIcon sx={{ fontSize: 42, color: "text.disabled" }} />}
        </Box>
        <Stack spacing={0.75}>
          <Button size="small" variant="outlined" startIcon={<AddPhotoAlternateOutlinedIcon />} disabled={disabled || busy} onClick={() => inputRef.current?.click()} sx={{ textTransform: "none", fontWeight: 700 }}>
            {value ? t.change : t.upload}
          </Button>
          {value ? <Button size="small" color="error" startIcon={<DeleteOutlineOutlinedIcon />} disabled={disabled || busy} onClick={() => { setError(""); onChange(null); }} sx={{ textTransform: "none", fontWeight: 700 }}>{t.remove}</Button> : null}
          <Typography variant="caption" color="text.secondary">{t.hint}</Typography>
          {error ? <Typography variant="caption" color="error">{error}</Typography> : null}
        </Stack>
      </Stack>
      <input ref={inputRef} type="file" accept={ACCEPT.join(",")} hidden onChange={pick} />
    </Box>
  );
}
