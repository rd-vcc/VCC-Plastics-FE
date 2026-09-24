import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, IconButton, Stack, Tooltip, Typography,
} from "@mui/material";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import LocationOffOutlinedIcon from "@mui/icons-material/LocationOffOutlined";

import i18n from "../../../../i18n";
import MachineLayoutBoard, { LAYOUT_STATUS_COLORS } from "../../../../components/machine/MachineLayoutBoard";
import { DialogHeader, btn, dialogPaperSx } from "../../../ProductionManagement/ProductionPlanning/ui";

const TEXT = {
  vi: { title: "Bố trí thiết bị trên mặt bằng", subtitle: "Kéo thả máy / thiết bị lên ảnh mặt bằng của {{name}}", noImage: "Nút này chưa có ảnh mặt bằng. Hãy sửa nút và tải ảnh mặt bằng lên trước; tạm thời thiết bị được đặt trên lưới.",
    noEquipment: "Chưa có máy / thiết bị nào được gán vào nút này (hoặc nút con không có ảnh mặt bằng riêng).", hint: "Khung nét đứt = chưa đặt vị trí (đang xếp tự động). Kéo để đặt, bấm nút bỏ vị trí để trả về xếp tự động.",
    equipment: "Thiết bị", placed: "Đã đặt", auto: "Tự động", clearPos: "Bỏ vị trí", resetAll: "Bỏ tất cả vị trí", saved: "Đã lưu bố trí mặt bằng.", unsaved: "Có thay đổi chưa lưu", open: "Bố trí máy trên mặt bằng" },
  en: { title: "Equipment layout", subtitle: "Drag machines / equipment onto the layout image of {{name}}", noImage: "This node has no layout image yet. Edit the node and upload a layout image first; equipment is shown on a grid for now.",
    noEquipment: "No machine / equipment is assigned to this node (or to child nodes without their own layout image).", hint: "Dashed frame = no saved position (auto placed). Drag to place; use clear position to return it to auto placement.",
    equipment: "Equipment", placed: "Placed", auto: "Auto", clearPos: "Clear position", resetAll: "Clear all positions", saved: "Layout saved.", unsaved: "Unsaved changes", open: "Machine layout" },
  ja: { title: "設備レイアウト", subtitle: "{{name}} のレイアウト図に機械・設備をドラッグして配置", noImage: "このノードにはレイアウト図がありません。先にノードを編集してレイアウト図をアップロードしてください（現在はグリッド表示）。",
    noEquipment: "このノード（または独自のレイアウト図がない子ノード）に割り当てられた設備はありません。", hint: "破線枠 = 位置未設定（自動配置）。ドラッグで配置し、位置クリアで自動配置に戻します。",
    equipment: "設備", placed: "配置済", auto: "自動", clearPos: "位置クリア", resetAll: "全位置クリア", saved: "レイアウトを保存しました。", unsaved: "未保存の変更あり", open: "機械レイアウト" },
};
Object.entries(TEXT).forEach(([lang, machineLayout]) => i18n.addResourceBundle(lang, "translation", { factoryStructure: { machineLayout } }, true, true));

export default function MachineLayoutDialog({ node, apiBase, requestJson, actor, onClose, notify }) {
  const { t } = useTranslation();
  const T = (k, o) => t(`factoryStructure.machineLayout.${k}`, o);
  const [data, setData] = useState(null);
  const [items, setItems] = useState([]);
  const [dirty, setDirty] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const api = `${apiBase}/api/machine-monitoring/layout`;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const load = useCallback(async () => {
    try {
      const d = await requestJson(`${api}?node_id=${node.id}`);
      setData(d); setItems(d.items); setDirty(new Set());
    } catch (e) { notify("error", e.message); closeRef.current(); }
  }, [api, node.id, requestJson, notify]);
  useEffect(() => { load(); }, [load]);

  const setPos = (id, x, y) => {
    setItems((list) => list.map((i) => (i.id === id ? { ...i, layout_x: x, layout_y: y } : i)));
    setDirty((s) => new Set(s).add(id));
  };
  const save = async () => {
    setSaving(true);
    try {
      await requestJson(api, { method: "PUT", body: JSON.stringify({ actor, items: items.filter((i) => dirty.has(i.id)).map((i) => ({ equipment_id: i.id, x: i.layout_x, y: i.layout_y })) }) });
      notify("success", T("saved"));
      onClose();
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="lg" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<GridViewOutlinedIcon />} title={T("title")} subtitle={T("subtitle", { name: node.name })} onClose={onClose} disabled={saving} />
      <DialogContent sx={{ pt: "16px !important" }}>
        {!data ? <Box sx={{ height: 300, display: "grid", placeItems: "center" }}><CircularProgress /></Box> : (
          <>
            {!data.node.image_url ? <Alert severity="warning" sx={{ mb: 1.5 }}>{T("noImage")}</Alert> : null}
            {!items.length ? <Alert severity="info">{T("noEquipment")}</Alert> : (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0,1fr) 250px" }, gap: 1.5, alignItems: "start" }}>
                <Box>
                  <MachineLayoutBoard image={data.node.image_url} items={items} editable onMove={setPos} minHeight={420} />
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>{T("hint")}</Typography>
                </Box>
                <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, maxHeight: 460, overflow: "auto" }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: "divider" }}>{T("equipment")} ({items.length})</Typography>
                  {items.map((i) => (
                    <Stack key={i.id} direction="row" spacing={1} sx={{ alignItems: "center", px: 1.5, py: 0.6, borderBottom: 1, borderColor: "divider" }}>
                      <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: LAYOUT_STATUS_COLORS[i.operational_status] || "#98A2B3", flexShrink: 0 }} />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="caption" fontWeight={800} sx={{ display: "block" }} noWrap>{i.equipment_code}{dirty.has(i.id) ? " •" : ""}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 10.5 }} noWrap>{i.equipment_name}</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ fontSize: 10.5, color: i.layout_x != null ? "#12B76A" : "text.secondary", whiteSpace: "nowrap" }}>
                        {i.layout_x != null ? `${Math.round(i.layout_x)}, ${Math.round(i.layout_y)}` : T("auto")}</Typography>
                      <Tooltip title={T("clearPos")}><span>
                        <IconButton size="small" disabled={i.layout_x == null} onClick={() => setPos(i.id, null, null)}><LocationOffOutlinedIcon sx={{ fontSize: 16 }} /></IconButton>
                      </span></Tooltip>
                    </Stack>
                  ))}
                </Box>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button startIcon={<RestartAltOutlinedIcon />} disabled={saving || !items.some((i) => i.layout_x != null)} onClick={() => items.forEach((i) => i.layout_x != null && setPos(i.id, null, null))} sx={btn("cancel")}>{T("resetAll")}</Button>
        <Box sx={{ flex: 1 }} />
        {dirty.size ? <Typography variant="caption" color="warning.main" fontWeight={700}>{T("unsaved")} ({dirty.size})</Typography> : null}
        <Button onClick={onClose} disabled={saving} sx={btn("cancel")}>{t("common.cancel")}</Button>
        <Button onClick={save} disabled={saving || !dirty.size} sx={btn("primary")}>{t("common.save")}</Button>
      </DialogActions>
    </Dialog>
  );
}
