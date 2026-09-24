import { UI_TEXT as WO_TEXT, label as woLabel, localeTag, setActiveLanguage as setWoLanguage } from "../WorkOrderManagement/woLocales";

let activeLanguage = "en";
export function setActiveLanguage(language) { activeLanguage = language; setWoLanguage(language); }
const lang = () => String(activeLanguage || "en").split("-")[0];

const EX_TEXT = {
  en: { NO_MACHINE: "No machine assigned", MACHINE_NOT_READY: "Machine not ready", NO_MOLD: "No mold assigned", MOLD_NOT_READY: "Mold not ready",
    MATERIAL_NOT_READY: "Material not reserved / issued", MACHINE_BUSY: "Machine busy with another WO", MOLD_BUSY: "Mold mounted on another machine" },
  vi: {
    "Production Execution": "Thực hiện sản xuất", "Real-time control of work orders at the machines": "Điều hành và giám sát Work Order tại máy theo thời gian thực",
    "Business date": "Ngày sản xuất", "Start Production": "Bắt đầu sản xuất", "Report Output": "Báo sản lượng", "End Production": "Kết thúc sản xuất",
    "Qty Adjustment": "Điều chỉnh SL", "Param Monitor": "Giám sát thông số", "Production Log": "Nhật ký sản xuất",
    "Active Work Orders": "WO đang chạy", "Planned Qty (Today)": "SL kế hoạch (hôm nay)", "Good Qty (Today)": "SL đạt (hôm nay)",
    "Reject Qty (Today)": "SL lỗi (hôm nay)", "Yield (Today)": "Yield (hôm nay)", "OEE (Line Average)": "OEE (TB chuyền)", "Avg Cycle Time": "Cycle time TB",
    "{n} on hold · {m} ready": "{n} tạm dừng · {m} chờ chạy", "ideal {n} s": "chuẩn {n} s", "yesterday {n}": "hôm qua {n}",
    "Active": "Đang chạy", "Ready to Start": "Chờ bắt đầu", "Completed Today": "Hoàn thành hôm nay", "Cycle (s)": "Cycle (s)",
    "Reject (PCS)": "Lỗi (PCS)", "Work Order Details": "Chi tiết Work Order", "Production Information": "Thông tin sản xuất",
    "Leader": "Trưởng ca", "Operator": "Người vận hành", "Status since": "Trạng thái từ", "Machine Status": "Trạng thái máy",
    "Mold Status": "Trạng thái khuôn", "Run Time": "Thời gian chạy", "Stop Time": "Thời gian dừng", "Utilization": "Hiệu suất sử dụng",
    "Cycle Time (Avg)": "Cycle time TB", "Shot Counter": "Bộ đếm shot", "Life (Max)": "Tuổi thọ (max)", "Life remaining": "Tuổi thọ còn lại",
    "Notes": "Ghi chú", "Add a note (mold change, parameter change, incident...)": "Thêm ghi chú (thay khuôn, chỉnh thông số, sự cố...)", "Add": "Thêm",
    "Progress by Status": "Tiến độ theo trạng thái", "Good / Reject Analysis (Today)": "Phân tích Đạt / Lỗi (hôm nay)", "Top Delay Reasons": "Nguyên nhân dừng / chậm hàng đầu",
    "Production Trend (7 days)": "Xu hướng sản lượng (7 ngày)", "Cycle Time Trend (avg)": "Xu hướng cycle time (TB)", "Machine Utilization": "Hiệu suất sử dụng máy",
    "Planned": "Kế hoạch", "Good": "Đạt", "Reject": "Lỗi", "Ideal cycle": "Cycle chuẩn", "Actual cycle": "Cycle thực tế",
    "Operator code": "Mã người vận hành", "Leader code": "Mã trưởng ca", "Readiness check": "Kiểm tra sẵn sàng", "Ready to start.": "Đủ điều kiện bắt đầu.",
    "Good qty": "SL đạt", "Reject qty": "SL lỗi", "Reason code": "Mã lý do", "Reject reason": "Lý do lỗi", "Hold reason": "Lý do tạm dừng",
    "Move from good (found at inspection)": "Chuyển từ hàng đạt (phát hiện khi kiểm)", "New good total": "Tổng SL đạt mới", "New reject total": "Tổng SL lỗi mới",
    "Adjustment reason": "Lý do điều chỉnh", "Current": "Hiện tại", "Remark": "Ghi chú", "Final result": "Kết quả cuối",
    "End production completes the work order, back-flushes material and releases left-over reservations.": "Kết thúc sản xuất sẽ hoàn thành WO, trừ vật tư theo định mức và giải phóng phần giữ chỗ còn lại.",
    "Output is entered manually until PLC / IoT is connected.": "Sản lượng nhập tay cho đến khi kết nối PLC / IoT.",
    "Production started.": "Đã bắt đầu sản xuất.", "Output recorded.": "Đã ghi nhận sản lượng.", "Reject recorded.": "Đã ghi nhận hàng lỗi.",
    "Quantities adjusted.": "Đã điều chỉnh sản lượng.", "Production ended.": "Đã kết thúc sản xuất.", "Note added.": "Đã thêm ghi chú.",
    "Material not at machine: {list}": "Vật tư chưa có ở máy: {list}", "Event": "Sự kiện", "Qty": "SL", "By": "Người thực hiện",
    "Availability": "Availability", "Performance": "Performance", "Quality": "Quality", "No active work order.": "Không có WO đang chạy.",
    "NO_MACHINE": "Chưa gán máy", "MACHINE_NOT_READY": "Máy chưa sẵn sàng (bảo trì / dừng)", "NO_MOLD": "Chưa gán khuôn",
    "MOLD_NOT_READY": "Khuôn chưa sẵn sàng", "MATERIAL_NOT_READY": "Vật tư chưa giữ chỗ / cấp phát đủ", "MACHINE_BUSY": "Máy đang chạy WO khác", "MOLD_BUSY": "Khuôn đang lắp trên máy khác",
    "First-off approval is checked when the Quality module is live.": "Phê duyệt first-off sẽ kiểm tra khi có phân hệ Chất lượng.",
    "Print Production Report": "In báo cáo sản xuất", "Shots": "Số shot",
  },
  ja: {
    "Production Execution": "生産実行", "Real-time control of work orders at the machines": "機械での作業指示をリアルタイムに管理",
    "Business date": "業務日", "Start Production": "生産開始", "Report Output": "実績入力", "End Production": "生産終了",
    "Qty Adjustment": "数量調整", "Param Monitor": "パラメータ監視", "Production Log": "生産ログ",
    "Active Work Orders": "稼働中WO", "Planned Qty (Today)": "計画数（本日）", "Good Qty (Today)": "良品数（本日）",
    "Reject Qty (Today)": "不良数（本日）", "Yield (Today)": "歩留（本日）", "OEE (Line Average)": "OEE（ライン平均）", "Avg Cycle Time": "平均サイクル",
    "{n} on hold · {m} ready": "保留 {n} ・ 待機 {m}", "ideal {n} s": "標準 {n} s", "yesterday {n}": "前日 {n}",
    "Active": "稼働中", "Ready to Start": "開始待ち", "Completed Today": "本日完了", "Cycle (s)": "サイクル (s)",
    "Reject (PCS)": "不良 (PCS)", "Work Order Details": "作業指示詳細", "Production Information": "生産情報",
    "Leader": "リーダー", "Operator": "オペレーター", "Status since": "状態開始", "Machine Status": "機械状態",
    "Mold Status": "金型状態", "Run Time": "稼働時間", "Stop Time": "停止時間", "Utilization": "稼働率",
    "Cycle Time (Avg)": "平均サイクル", "Shot Counter": "ショット数", "Life (Max)": "寿命（最大）", "Life remaining": "残寿命",
    "Notes": "メモ", "Add a note (mold change, parameter change, incident...)": "メモを追加（金型交換・条件変更・トラブルなど）", "Add": "追加",
    "Progress by Status": "状態別進捗", "Good / Reject Analysis (Today)": "良品 / 不良分析（本日）", "Top Delay Reasons": "停止・遅延要因",
    "Production Trend (7 days)": "生産推移（7日）", "Cycle Time Trend (avg)": "サイクル推移（平均）", "Machine Utilization": "機械稼働率",
    "Planned": "計画", "Good": "良品", "Reject": "不良", "Ideal cycle": "標準サイクル", "Actual cycle": "実サイクル",
    "Operator code": "オペレーターコード", "Leader code": "リーダーコード", "Readiness check": "準備確認", "Ready to start.": "開始可能です。",
    "Good qty": "良品数", "Reject qty": "不良数", "Reason code": "理由コード", "Reject reason": "不良理由", "Hold reason": "保留理由",
    "Move from good (found at inspection)": "良品から移動（検査で発見）", "New good total": "新しい良品合計", "New reject total": "新しい不良合計",
    "Adjustment reason": "調整理由", "Current": "現在", "Remark": "備考", "Final result": "最終結果",
    "End production completes the work order, back-flushes material and releases left-over reservations.": "生産終了で作業指示を完了し、材料を引落し、残りの引当を解除します。",
    "Output is entered manually until PLC / IoT is connected.": "PLC / IoT 接続までは実績を手入力します。",
    "Production started.": "生産を開始しました。", "Output recorded.": "実績を記録しました。", "Reject recorded.": "不良を記録しました。",
    "Quantities adjusted.": "数量を調整しました。", "Production ended.": "生産を終了しました。", "Note added.": "メモを追加しました。",
    "Material not at machine: {list}": "機械上にない材料: {list}", "Event": "イベント", "Qty": "数量", "By": "担当",
    "Availability": "時間稼働率", "Performance": "性能稼働率", "Quality": "良品率", "No active work order.": "稼働中の作業指示はありません。",
    "NO_MACHINE": "機械未割当", "MACHINE_NOT_READY": "機械準備未完了（保全 / 停止）", "NO_MOLD": "金型未割当",
    "MOLD_NOT_READY": "金型準備未完了", "MATERIAL_NOT_READY": "材料の引当 / 払出が不足", "MACHINE_BUSY": "機械は別WOで稼働中", "MOLD_BUSY": "金型は別の機械に装着中",
    "First-off approval is checked when the Quality module is live.": "初品承認は品質モジュール稼働後に確認します。",
    "Print Production Report": "生産レポート印刷", "Shots": "ショット",
  },
};

export function tx(text, params) {
  const template = EX_TEXT[lang()]?.[text] || WO_TEXT[lang()]?.[text] || text;
  return params ? String(template).replace(/\{(\w+)\}/g, (_, k) => params[k] ?? "") : template;
}

const EVENTS = {
  en: { START: "Start", OUTPUT: "Output", REJECT: "Reject", QTY_ADJUST: "Qty adjustment", HOLD: "Hold", RESUME: "Resume", END: "End", NOTE: "Note" },
  vi: { START: "Bắt đầu", OUTPUT: "Báo sản lượng", REJECT: "Hàng lỗi", QTY_ADJUST: "Điều chỉnh SL", HOLD: "Tạm dừng", RESUME: "Tiếp tục", END: "Kết thúc", NOTE: "Ghi chú" },
  ja: { START: "開始", OUTPUT: "実績", REJECT: "不良", QTY_ADJUST: "数量調整", HOLD: "保留", RESUME: "再開", END: "終了", NOTE: "メモ" },
};

export function label(group, value) {
  if (group === "event") return EVENTS[lang()]?.[value] || EVENTS.en[value] || value;
  return woLabel(group, value);
}

export { localeTag };
