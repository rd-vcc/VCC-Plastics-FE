import { label, localeTag, setActiveLanguage as setExLanguage, tx as exTx } from "../WorkOrders/ProductionExecution/exLocales";

let activeLanguage = "en";
export function setActiveLanguage(language) { activeLanguage = language; setExLanguage(language); }
const lang = () => String(activeLanguage || "en").split("-")[0];

const DASH_TEXT = {
  en: {
    "MACHINE_MAINTENANCE": "Machine in maintenance", "MACHINE_DOWN": "Machine down", "MACHINE_OFFLINE": "Machine offline", "WO_ON_HOLD": "Work order on hold",
    "WO_DELAYED": "Work order delayed ({n})", "MATERIAL_SHORTAGE": "Material short for {n} WO", "MOLD_LIFE": "Mold near end of life ({n}%)", "LOW_YIELD": "Low yield ({n}%)",
  },
  vi: {
    "Production Dashboard": "Tổng quan sản xuất", "Real-time overview of the shift": "Điều hành sản xuất theo thời gian thực trong ca",
    "Save View": "Lưu góc nhìn", "Share": "Chia sẻ", "Fullscreen": "Toàn màn hình", "View saved.": "Đã lưu góc nhìn.", "Link copied.": "Đã sao chép liên kết.",
    "Production Achievement": "Hoàn thành kế hoạch", "Good Pieces": "SL đạt", "Reject Pieces": "SL lỗi", "Today's Target": "Kế hoạch ca", "Remaining": "Còn lại",
    "Work Orders In Progress": "WO đang sản xuất", "On Track": "Đúng tiến độ", "At Risk": "Có rủi ro", "Delay": "Chậm", "Ahead": "Vượt tiến độ", "Not Started": "Chưa bắt đầu",
    "vs yesterday": "so với hôm qua", "incl. carry-over {n}": "gồm chuyển tiếp {n}", "Injection Area Overview": "Tổng quan khu vực máy ép",
    "Running": "Đang chạy", "Idle": "Chờ", "Down": "Dừng", "Maintenance": "Bảo trì", "Offline": "Mất kết nối", "All Areas": "Tất cả khu vực",
    "Production Timeline (Gantt)": "Timeline sản xuất (Gantt)", "Plan": "Kế hoạch", "Actual": "Thực tế", "Planned before this shift": "Kế hoạch trước ca này",
    "Production by Hour": "Sản lượng theo giờ", "Plan (PCS)": "Kế hoạch (PCS)", "Actual (PCS)": "Thực tế (PCS)", "Top 5 Machines by OEE": "Top 5 máy theo OEE",
    "Work Order Status": "Trạng thái tiến độ WO", "Production Alerts": "Cảnh báo sản xuất", "Shift Summary": "Tổng hợp ca", "Planned Production": "Kế hoạch sản xuất",
    "Actual Production": "Sản lượng thực tế", "Reject Rate": "Tỷ lệ lỗi", "Achievement": "Hoàn thành", "Report Downtime": "Báo dừng máy",
    "Quality Inspection": "Kiểm tra chất lượng", "Material Request": "Yêu cầu cấp vật tư", "No alerts.": "Không có cảnh báo.", "No work order": "Không có WO",
    "Whole day": "Cả ngày", "MACHINE_MAINTENANCE": "Máy đang bảo trì", "MACHINE_DOWN": "Máy dừng", "MACHINE_OFFLINE": "Máy mất kết nối",
    "WO_ON_HOLD": "WO tạm dừng", "WO_DELAYED": "WO chậm tiến độ ({n})", "MATERIAL_SHORTAGE": "Thiếu vật tư cho {n} WO", "MOLD_LIFE": "Khuôn gần hết tuổi thọ ({n}%)",
    "LOW_YIELD": "Yield thấp ({n}%)", "WO": "WO", "Now": "Hiện tại",
  },
  ja: {
    "Production Dashboard": "生産ダッシュボード", "Real-time overview of the shift": "シフトのリアルタイム概要",
    "Save View": "ビュー保存", "Share": "共有", "Fullscreen": "全画面", "View saved.": "ビューを保存しました。", "Link copied.": "リンクをコピーしました。",
    "Production Achievement": "計画達成率", "Good Pieces": "良品数", "Reject Pieces": "不良数", "Today's Target": "シフト計画", "Remaining": "残数",
    "Work Orders In Progress": "生産中WO", "On Track": "順調", "At Risk": "リスク", "Delay": "遅延", "Ahead": "前倒し", "Not Started": "未着手",
    "vs yesterday": "前日比", "incl. carry-over {n}": "繰越 {n} を含む", "Injection Area Overview": "成形エリア概要",
    "Running": "稼働", "Idle": "待機", "Down": "停止", "Maintenance": "保全", "Offline": "オフライン", "All Areas": "全エリア",
    "Production Timeline (Gantt)": "生産タイムライン（ガント）", "Plan": "計画", "Actual": "実績", "Planned before this shift": "本シフト前の計画",
    "Production by Hour": "時間別生産", "Plan (PCS)": "計画 (PCS)", "Actual (PCS)": "実績 (PCS)", "Top 5 Machines by OEE": "OEE上位5機",
    "Work Order Status": "作業指示進捗", "Production Alerts": "生産アラート", "Shift Summary": "シフト集計", "Planned Production": "計画生産数",
    "Actual Production": "実績生産数", "Reject Rate": "不良率", "Achievement": "達成率", "Report Downtime": "停止報告",
    "Quality Inspection": "品質検査", "Material Request": "材料要求", "No alerts.": "アラートなし。", "No work order": "作業指示なし",
    "Whole day": "終日", "MACHINE_MAINTENANCE": "機械保全中", "MACHINE_DOWN": "機械停止", "MACHINE_OFFLINE": "機械オフライン",
    "WO_ON_HOLD": "作業指示保留", "WO_DELAYED": "作業指示遅延 ({n})", "MATERIAL_SHORTAGE": "{n} WO の材料不足", "MOLD_LIFE": "金型寿命間近 ({n}%)",
    "LOW_YIELD": "歩留低下 ({n}%)", "WO": "WO", "Now": "現在",
  },
};

export function tx(text, params) {
  const own = DASH_TEXT[lang()]?.[text] || DASH_TEXT.en[text];
  if (!own) return exTx(text, params);
  return params ? String(own).replace(/\{(\w+)\}/g, (_, k) => params[k] ?? "") : own;
}

export { label, localeTag };
