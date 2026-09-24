import { woStatusLabel } from "../woStatus";

let activeLanguage = "en";
export function setActiveLanguage(language) { activeLanguage = language; }
const lang = () => String(activeLanguage || "en").split("-")[0];

export const UI_TEXT = {
  vi: {
    "Work Order Management": "Quản lý Work Order", "Work Order": "Work Order",
    "Work Order command center: status, progress and shop-floor actions": "Trung tâm điều hành Work Order: trạng thái, tiến độ và thao tác hiện trường",
    "Refresh": "Làm mới", "Auto Refresh": "Tự làm mới", "Last Update": "Cập nhật lúc", "Search WO, order, product, machine, mold...": "Tìm WO, lệnh, sản phẩm, máy, khuôn...",
    "Create Work Order": "Tạo Work Order", "Release": "Phát hành", "Hold": "Tạm dừng", "Resume": "Tiếp tục", "Cancel": "Hủy", "Export": "Xuất Excel",
    "Change Priority": "Đổi ưu tiên", "Copy Work Order": "Sao chép WO", "Print": "In", "Complete": "Hoàn thành", "Close": "Đóng", "Close WO": "Đóng WO",
    "Total Work Orders": "Tổng Work Order", "Queued": "Chờ phát hành", "Released": "Đã phát hành", "In Production": "Đang sản xuất", "On Hold": "Tạm dừng",
    "Completed Today": "Hoàn thành hôm nay", "Delayed": "Chậm tiến độ", "vs yesterday": "so với hôm qua", "{n} not scheduled": "{n} chưa lên lịch",
    "All": "Tất cả", "Machine": "Máy", "Priority": "Ưu tiên", "Area": "Khu vực", "Shift": "Ca", "Clear": "Xóa lọc", "Period from": "Từ ngày", "Period to": "Đến ngày",
    "WO No.": "Số WO", "Production Order No.": "Số lệnh SX", "Product": "Sản phẩm", "Customer": "Khách hàng", "Mold": "Khuôn", "Planned Qty": "SL kế hoạch",
    "Status": "Trạng thái", "Start Time": "Bắt đầu", "Due Time": "Hạn hoàn thành", "Progress": "Tiến độ", "Good (PCS)": "Đạt (PCS)", "Reject": "Lỗi",
    "Remaining": "Còn lại", "Alerts": "Cảnh báo", "Selected Work Order": "Work Order đang chọn", "Select a work order in the list.": "Chọn một Work Order trong danh sách.",
    "Product Name": "Tên sản phẩm", "Product Code": "Mã sản phẩm", "Part weight": "Khối lượng", "Machine Code": "Mã máy", "Machine Name": "Tên máy",
    "Machine Type": "Loại máy", "Model": "Model", "Mold Code": "Mã khuôn", "Mold Name": "Tên khuôn", "Cavity": "Số cavity", "Mold Type": "Loại khuôn",
    "Mold Status": "Trạng thái khuôn", "Shot Count": "Số shot", "Readiness": "Sẵn sàng sản xuất", "Machine ready": "Máy sẵn sàng", "Mold ready": "Khuôn sẵn sàng",
    "Material ready": "Vật tư đầy đủ", "First-off": "First-off", "Not required yet (Quality module)": "Chưa áp dụng (phân hệ Chất lượng)",
    "Quick Actions": "Thao tác nhanh", "Work Orders by Priority": "Work Order theo ưu tiên", "Work Orders by Machine": "Work Order theo máy",
    "Work Order Status Distribution": "Phân bố trạng thái Work Order", "Work Orders by Status Trend (7 days)": "Xu hướng trạng thái Work Order (7 ngày)",
    "Delayed Work Orders": "Work Order chậm tiến độ", "Delay": "Trễ", "Reason": "Lý do", "Total": "Tổng", "open work orders": "WO đang mở",
    "No data.": "Không có dữ liệu.", "Hold reason": "Lý do tạm dừng", "Cancel reason": "Lý do hủy", "Complete short reason": "Lý do hoàn thành thiếu",
    "Confirm": "Xác nhận", "Back": "Quay lại", "New priority": "Ưu tiên mới", "Release Work Order": "Phát hành Work Order",
    "Before release define: machine, mold, product, planned quantity, start time and due time.": "Trước khi phát hành cần xác định: máy, khuôn, sản phẩm, số lượng, thời gian bắt đầu và hạn hoàn thành.",
    "Missing": "Còn thiếu", "Ready to release.": "Đủ điều kiện phát hành.",
    "Release does not start production. Machine, mold, material and first-off are checked again when production starts.": "Phát hành chưa bắt đầu sản xuất. Máy, khuôn, vật tư và first-off được kiểm tra lại khi bắt đầu chạy.",
    "Close locks the work order record. Return or close out material at the machine first.": "Đóng WO sẽ khóa hồ sơ. Hãy hoàn trả hoặc chốt tiêu hao vật tư ở máy trước.",
    "Work order released.": "Đã phát hành Work Order.", "Work order on hold.": "Đã tạm dừng Work Order.", "Work order resumed.": "Đã tiếp tục Work Order.",
    "Work order cancelled.": "Đã hủy Work Order.", "Priority changed.": "Đã đổi ưu tiên.", "Work order completed.": "Đã hoàn thành Work Order.",
    "Work order closed.": "Đã đóng Work Order.", "Work order saved.": "Đã lưu Work Order.", "History": "Lịch sử thao tác", "Actor": "Người thao tác",
    "Action": "Thao tác", "Time": "Thời gian", "Open Production Execution": "Mở màn Thực hiện sản xuất", "Open Production Order": "Mở lệnh sản xuất",
    "Materials": "Vật tư", "Required": "Nhu cầu", "Allocated": "Đã cấp phát", "Area / Shift": "Khu vực / Ca", "Plan": "Kế hoạch",
    "System Status": "Trạng thái hệ thống", "Online": "Online", "Offline": "Offline", "Not connected": "Chưa kết nối", "Last Sync": "Đồng bộ lúc",
    "Server Time": "Giờ máy chủ", "Version": "Phiên bản", "Upload the image in master data": "Tải ảnh lên ở dữ liệu gốc", "min": "phút",
    "Delayed only": "Chỉ WO chậm", "Work Order Detail": "Chi tiết Work Order", "More": "Thêm", "Unassigned": "Chưa gán", "Others": "Khác",
  },
  ja: {
    "Work Order Management": "作業指示管理", "Work Order": "作業指示",
    "Work Order command center: status, progress and shop-floor actions": "作業指示コマンドセンター：状態・進捗・現場操作",
    "Refresh": "更新", "Auto Refresh": "自動更新", "Last Update": "最終更新", "Search WO, order, product, machine, mold...": "WO・指示・製品・機械・金型を検索...",
    "Create Work Order": "作業指示作成", "Release": "リリース", "Hold": "保留", "Resume": "再開", "Cancel": "取消", "Export": "出力",
    "Change Priority": "優先度変更", "Copy Work Order": "WOコピー", "Print": "印刷", "Complete": "完了", "Close": "閉じる", "Close WO": "WOクローズ",
    "Total Work Orders": "作業指示合計", "Queued": "待機中", "Released": "リリース済", "In Production": "生産中", "On Hold": "保留",
    "Completed Today": "本日完了", "Delayed": "遅延", "vs yesterday": "前日比", "{n} not scheduled": "未計画 {n}",
    "All": "すべて", "Machine": "機械", "Priority": "優先度", "Area": "エリア", "Shift": "シフト", "Clear": "クリア", "Period from": "開始日", "Period to": "終了日",
    "WO No.": "WO番号", "Production Order No.": "製造指示番号", "Product": "製品", "Customer": "顧客", "Mold": "金型", "Planned Qty": "計画数",
    "Status": "状態", "Start Time": "開始", "Due Time": "納期", "Progress": "進捗", "Good (PCS)": "良品 (PCS)", "Reject": "不良",
    "Remaining": "残数", "Alerts": "警告", "Selected Work Order": "選択中の作業指示", "Select a work order in the list.": "一覧から作業指示を選択してください。",
    "Product Name": "製品名", "Product Code": "製品コード", "Part weight": "重量", "Machine Code": "機械コード", "Machine Name": "機械名",
    "Machine Type": "機械種別", "Model": "モデル", "Mold Code": "金型コード", "Mold Name": "金型名", "Cavity": "キャビティ", "Mold Type": "金型種別",
    "Mold Status": "金型状態", "Shot Count": "ショット数", "Readiness": "生産準備", "Machine ready": "機械準備", "Mold ready": "金型準備",
    "Material ready": "材料充足", "First-off": "初品", "Not required yet (Quality module)": "未適用（品質モジュール）",
    "Quick Actions": "クイック操作", "Work Orders by Priority": "優先度別作業指示", "Work Orders by Machine": "機械別作業指示",
    "Work Order Status Distribution": "作業指示状態分布", "Work Orders by Status Trend (7 days)": "状態別推移（7日）",
    "Delayed Work Orders": "遅延作業指示", "Delay": "遅延", "Reason": "理由", "Total": "合計", "open work orders": "未完了WO",
    "No data.": "データなし。", "Hold reason": "保留理由", "Cancel reason": "取消理由", "Complete short reason": "未達完了理由",
    "Confirm": "確認", "Back": "戻る", "New priority": "新しい優先度", "Release Work Order": "作業指示リリース",
    "Before release define: machine, mold, product, planned quantity, start time and due time.": "リリース前に機械・金型・製品・計画数・開始時刻・納期を設定してください。",
    "Missing": "不足", "Ready to release.": "リリース可能です。",
    "Release does not start production. Machine, mold, material and first-off are checked again when production starts.": "リリースは生産開始ではありません。開始時に機械・金型・材料・初品を再確認します。",
    "Close locks the work order record. Return or close out material at the machine first.": "クローズで記録をロックします。機械上の材料は先に返却または締めてください。",
    "Work order released.": "リリースしました。", "Work order on hold.": "保留にしました。", "Work order resumed.": "再開しました。",
    "Work order cancelled.": "取消しました。", "Priority changed.": "優先度を変更しました。", "Work order completed.": "完了しました。",
    "Work order closed.": "クローズしました。", "Work order saved.": "保存しました。", "History": "操作履歴", "Actor": "担当者",
    "Action": "操作", "Time": "時刻", "Open Production Execution": "生産実行を開く", "Open Production Order": "製造指示を開く",
    "Materials": "材料", "Required": "所要量", "Allocated": "引当済", "Area / Shift": "エリア / シフト", "Plan": "計画",
    "System Status": "システム状態", "Online": "オンライン", "Offline": "オフライン", "Not connected": "未接続", "Last Sync": "最終同期",
    "Server Time": "サーバー時刻", "Version": "バージョン", "Upload the image in master data": "マスタで画像を登録してください", "min": "分",
    "Delayed only": "遅延のみ", "Work Order Detail": "作業指示詳細", "More": "その他", "Unassigned": "未割当", "Others": "その他",
  },
};

export function tx(text, params) {
  const template = UI_TEXT[lang()]?.[text] || text;
  return params ? String(template).replace(/\{(\w+)\}/g, (_, k) => params[k] ?? "") : template;
}

const LABELS = {
  priority: {
    en: { URGENT: "Urgent", HIGH: "High", MEDIUM: "Medium", LOW: "Low" },
    vi: { URGENT: "Khẩn", HIGH: "Cao", MEDIUM: "Trung bình", LOW: "Thấp" },
    ja: { URGENT: "緊急", HIGH: "高", MEDIUM: "中", LOW: "低" },
  },
  exception: {
    en: { DELAYED: "Delayed", WAITING_MATERIAL: "Waiting Material", WAITING_MOLD: "Waiting Mold", WAITING_MAINTENANCE: "Waiting Maintenance",
          WAITING_QUALITY: "Waiting Quality", NOT_STARTED: "Not started", BEHIND_PLAN: "Behind plan" },
    vi: { DELAYED: "Chậm tiến độ", WAITING_MATERIAL: "Chờ vật tư", WAITING_MOLD: "Chờ khuôn", WAITING_MAINTENANCE: "Chờ bảo trì",
          WAITING_QUALITY: "Chờ chất lượng", NOT_STARTED: "Chưa bắt đầu", BEHIND_PLAN: "Chậm so với kế hoạch" },
    ja: { DELAYED: "遅延", WAITING_MATERIAL: "材料待ち", WAITING_MOLD: "金型待ち", WAITING_MAINTENANCE: "保全待ち",
          WAITING_QUALITY: "品質待ち", NOT_STARTED: "未着手", BEHIND_PLAN: "計画遅れ" },
  },
  action: {
    en: { CREATE: "Created", SCHEDULE: "Scheduled", RESCHEDULE: "Rescheduled", UNSCHEDULE: "Moved to backlog", RELEASE: "Released", START: "Started",
          HOLD: "Hold", RESUME: "Resumed", CANCEL: "Cancelled", PRIORITY: "Priority changed", COMPLETE: "Completed", CLOSE: "Closed", PROGRESS: "Progress", UPDATE: "Updated" },
    vi: { CREATE: "Tạo mới", SCHEDULE: "Lên lịch", RESCHEDULE: "Đổi lịch", UNSCHEDULE: "Đưa về chờ lịch", RELEASE: "Phát hành", START: "Bắt đầu sản xuất",
          HOLD: "Tạm dừng", RESUME: "Tiếp tục", CANCEL: "Hủy", PRIORITY: "Đổi ưu tiên", COMPLETE: "Hoàn thành", CLOSE: "Đóng", PROGRESS: "Báo sản lượng", UPDATE: "Cập nhật" },
    ja: { CREATE: "作成", SCHEDULE: "計画", RESCHEDULE: "再計画", UNSCHEDULE: "未計画へ", RELEASE: "リリース", START: "生産開始",
          HOLD: "保留", RESUME: "再開", CANCEL: "取消", PRIORITY: "優先度変更", COMPLETE: "完了", CLOSE: "クローズ", PROGRESS: "実績", UPDATE: "更新" },
  },
};

export function label(group, value) {
  if (group === "woStatus") return woStatusLabel(lang(), value);
  return LABELS[group]?.[lang()]?.[value] || LABELS[group]?.en?.[value] || value || "—";
}

const LOCALE_TAGS = { vi: "vi-VN", ja: "ja-JP", en: "en-US" };
export function localeTag() { return LOCALE_TAGS[lang()] || LOCALE_TAGS.en; }
