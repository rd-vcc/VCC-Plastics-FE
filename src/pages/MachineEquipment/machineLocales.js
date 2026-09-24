import { UI_TEXT as WO_TEXT, localeTag, setActiveLanguage as setWoLanguage } from "../ProductionManagement/WorkOrders/WorkOrderManagement/woLocales";
import { woStatusLabel } from "../ProductionManagement/WorkOrders/woStatus";

let activeLanguage = "en";
export function setActiveLanguage(language) { activeLanguage = language; setWoLanguage(language); }
const lang = () => String(activeLanguage || "en").split("-")[0];

const TEXT = {
  vi: {
    "Downtime Management": "Quản lý dừng máy", "Record, classify and analyse machine stops": "Ghi nhận, phân loại và phân tích các sự kiện dừng máy",
    "Alarm History": "Lịch sử cảnh báo", "Alarm lifecycle: raise, acknowledge, shelve, clear and close": "Vòng đời cảnh báo: phát sinh, xác nhận, tạm ẩn, xóa và đóng",
    "Total Downtime": "Tổng thời gian dừng", "Downtime Events": "Sự kiện dừng", "Affected Machines": "Máy bị ảnh hưởng", "Downtime Rate": "Tỷ lệ dừng máy",
    "MTTR (Avg)": "MTTR (TB)", "Planned Downtime": "Dừng có kế hoạch", "Unplanned Downtime": "Dừng ngoài kế hoạch", "vs previous period": "so với kỳ trước",
    "min": "phút", "events": "sự kiện", "machines": "máy", "open": "đang mở", "Downtime Overview": "Tổng quan dừng máy", "Downtime Trend": "Xu hướng dừng máy",
    "Downtime (min)": "Thời gian dừng (phút)", "Downtime Rate (%)": "Tỷ lệ dừng (%)", "Recent Downtime Events": "Sự kiện dừng gần đây",
    "Downtime Event List": "Danh sách sự kiện dừng", "Downtime by Machine": "Thời gian dừng theo máy", "Top Downtime Reasons": "Nguyên nhân dừng hàng đầu",
    "Downtime by Time of Day": "Dừng máy theo thời điểm trong ngày", "Downtime Category": "Phân loại dừng máy", "Downtime Rate Trend": "Xu hướng tỷ lệ dừng máy",
    "Report Downtime": "Báo dừng máy", "Close Downtime": "Kết thúc dừng máy", "Edit Downtime": "Sửa sự kiện dừng", "Cancel Downtime": "Hủy sự kiện dừng",
    "Downtime Detail": "Chi tiết dừng máy", "No.": "Số", "Start Time": "Bắt đầu", "End Time": "Kết thúc", "Equipment": "Thiết bị", "Machine": "Máy",
    "Work Order": "Work Order", "Reason": "Nguyên nhân", "Reason Code": "Mã nguyên nhân", "Duration (min)": "Thời lượng (phút)", "Category": "Phân loại",
    "Status": "Trạng thái", "Reported By": "Người báo", "Source": "Nguồn", "Root cause": "Nguyên nhân gốc", "Action taken": "Biện pháp xử lý",
    "Planned": "Có kế hoạch", "Unplanned": "Ngoài kế hoạch", "Open": "Đang dừng", "Closed": "Đã xử lý", "Cancelled": "Đã hủy", "Total": "Tổng",
    "Describe the reason": "Mô tả nguyên nhân", "Choose a reason code or describe the reason.": "Chọn mã nguyên nhân hoặc mô tả nguyên nhân.",
    "Leave end time empty if the machine is still stopped.": "Bỏ trống thời gian kết thúc nếu máy vẫn đang dừng.",
    "Downtime reported.": "Đã báo dừng máy.", "Downtime closed.": "Đã kết thúc dừng máy.", "Downtime updated.": "Đã cập nhật sự kiện dừng.", "Downtime cancelled.": "Đã hủy sự kiện dừng.",
    "Cancel reason": "Lý do hủy", "Rate": "Tỷ lệ", "Unspecified": "Chưa ghi nguyên nhân", "Low": "Thấp", "High": "Cao", "Area": "Khu vực", "Shift": "Ca",
    "Equipment type": "Loại thiết bị", "All": "Tất cả", "Clear": "Xóa lọc", "Period from": "Từ ngày", "Period to": "Đến ngày", "Refresh": "Làm mới",
    "Auto Refresh": "Tự làm mới", "Last Update": "Cập nhật lúc", "Export": "Xuất Excel", "Print": "In", "Quick Actions": "Thao tác nhanh",
    "No data.": "Không có dữ liệu.", "Close": "Đóng", "Back": "Quay lại", "Confirm": "Xác nhận", "Save": "Lưu", "Edit": "Sửa", "Cancel": "Hủy",
    "Request Maintenance": "Yêu cầu bảo trì", "Maintenance module is not live yet.": "Phân hệ Bảo trì chưa triển khai.", "Machine Monitoring": "Giám sát máy",
    "Machine Detail": "Chi tiết máy", "Equipment Monitoring": "Giám sát thiết bị", "Active Alarms": "Cảnh báo đang hoạt động", "Critical": "Nghiêm trọng",
    "Medium": "Trung bình", "Shelved": "Tạm ẩn", "Today Alarms": "Cảnh báo hôm nay", "Average Clearance Time": "Thời gian xử lý TB", "Need attention": "Cần xử lý",
    "vs yesterday": "so với hôm qua", "Alarm List": "Danh sách cảnh báo", "Active View": "Đang hoạt động", "History View": "Lịch sử",
    "Alarm Summary by Priority": "Cảnh báo theo mức ưu tiên", "Alarm Trend (Last 24 Hours)": "Xu hướng cảnh báo (24 giờ)", "Active Alarms by Area": "Cảnh báo đang hoạt động theo khu vực",
    "Alarm by Equipment Type": "Cảnh báo theo loại thiết bị", "Alarm Heatmap (by Time of Day)": "Heatmap cảnh báo (theo giờ)", "Alarm Rate Trend (%)": "Xu hướng tỷ lệ cảnh báo (%)",
    "Top 5 Alarm Reasons": "Top 5 nguyên nhân cảnh báo", "Count": "Số lần", "Time": "Thời gian", "Alarm ID": "Mã cảnh báo", "Priority": "Mức ưu tiên",
    "Alarm Message": "Nội dung cảnh báo", "Duration": "Thời lượng", "Acknowledge": "Xác nhận", "Shelve": "Tạm ẩn", "Clear Alarm": "Xóa cảnh báo", "Close Alarm": "Đóng cảnh báo",
    "Report Alarm": "Báo cảnh báo", "Alarm Detail": "Chi tiết cảnh báo", "Note": "Ghi chú", "Shelve for (hours)": "Tạm ẩn trong (giờ)", "Action history": "Lịch sử xử lý",
    "Actor": "Người thực hiện", "Action": "Thao tác", "Value": "Giá trị", "Limit": "Ngưỡng", "Alarm reported.": "Đã báo cảnh báo.", "Done: {n}": "Đã xử lý: {n}",
    "Skipped: {list}": "Bỏ qua: {list}", "Select alarms in the list first.": "Hãy chọn cảnh báo trong danh sách trước.", "Sound On": "Bật âm thanh", "Sound Off": "Tắt âm thanh",
    "A reason is required.": "Bắt buộc nhập lý do.", "Selected": "Đã chọn", "Report downtime from this alarm": "Báo dừng máy từ cảnh báo này", "Linked downtime": "Sự kiện dừng liên quan",
    "Alarm Rate (%)": "Tỷ lệ cảnh báo (%)", "Alarms": "Cảnh báo", "Average": "Trung bình",
  },
  ja: {
    "Downtime Management": "停止管理", "Record, classify and analyse machine stops": "機械停止の記録・分類・分析", "Alarm History": "アラーム履歴",
    "Alarm lifecycle: raise, acknowledge, shelve, clear and close": "アラームのライフサイクル：発生・確認・保留・解除・クローズ",
    "Total Downtime": "総停止時間", "Downtime Events": "停止件数", "Affected Machines": "影響機械", "Downtime Rate": "停止率", "MTTR (Avg)": "MTTR（平均）",
    "Planned Downtime": "計画停止", "Unplanned Downtime": "計画外停止", "vs previous period": "前期間比", "min": "分", "events": "件", "machines": "台", "open": "継続中",
    "Downtime Overview": "停止概要", "Downtime Trend": "停止推移", "Downtime (min)": "停止時間（分）", "Downtime Rate (%)": "停止率（%）", "Recent Downtime Events": "最近の停止",
    "Downtime Event List": "停止一覧", "Downtime by Machine": "機械別停止", "Top Downtime Reasons": "停止要因ランキング", "Downtime by Time of Day": "時間帯別停止",
    "Downtime Category": "停止区分", "Downtime Rate Trend": "停止率推移", "Report Downtime": "停止報告", "Close Downtime": "停止終了", "Edit Downtime": "停止編集",
    "Cancel Downtime": "停止取消", "Downtime Detail": "停止詳細", "No.": "番号", "Start Time": "開始", "End Time": "終了", "Equipment": "設備", "Machine": "機械",
    "Work Order": "作業指示", "Reason": "要因", "Reason Code": "要因コード", "Duration (min)": "時間（分）", "Category": "区分", "Status": "状態", "Reported By": "報告者",
    "Source": "ソース", "Root cause": "根本原因", "Action taken": "対策", "Planned": "計画", "Unplanned": "計画外", "Open": "停止中", "Closed": "処理済", "Cancelled": "取消",
    "Total": "合計", "Describe the reason": "要因を記入", "Choose a reason code or describe the reason.": "要因コードを選択するか要因を記入してください。",
    "Leave end time empty if the machine is still stopped.": "停止中の場合は終了時刻を空欄にしてください。", "Downtime reported.": "停止を報告しました。",
    "Downtime closed.": "停止を終了しました。", "Downtime updated.": "停止を更新しました。", "Downtime cancelled.": "停止を取り消しました。", "Cancel reason": "取消理由",
    "Rate": "率", "Unspecified": "未記入", "Low": "低", "High": "高", "Area": "エリア", "Shift": "シフト", "Equipment type": "設備種別", "All": "すべて", "Clear": "クリア",
    "Period from": "開始日", "Period to": "終了日", "Refresh": "更新", "Auto Refresh": "自動更新", "Last Update": "最終更新", "Export": "出力", "Print": "印刷",
    "Quick Actions": "クイック操作", "No data.": "データなし。", "Close": "閉じる", "Back": "戻る", "Confirm": "確認", "Save": "保存", "Edit": "編集", "Cancel": "取消",
    "Request Maintenance": "保全依頼", "Maintenance module is not live yet.": "保全モジュールは未稼働です。", "Machine Monitoring": "機械監視", "Machine Detail": "機械詳細",
    "Equipment Monitoring": "設備監視", "Active Alarms": "発生中アラーム", "Critical": "重大", "Medium": "中", "Shelved": "保留", "Today Alarms": "本日のアラーム",
    "Average Clearance Time": "平均解除時間", "Need attention": "要対応", "vs yesterday": "前日比", "Alarm List": "アラーム一覧", "Active View": "発生中", "History View": "履歴",
    "Alarm Summary by Priority": "優先度別アラーム", "Alarm Trend (Last 24 Hours)": "アラーム推移（24時間）", "Active Alarms by Area": "エリア別発生中アラーム",
    "Alarm by Equipment Type": "設備種別アラーム", "Alarm Heatmap (by Time of Day)": "時間帯別ヒートマップ", "Alarm Rate Trend (%)": "アラーム率推移（%）",
    "Top 5 Alarm Reasons": "アラーム要因トップ5", "Count": "件数", "Time": "時刻", "Alarm ID": "アラームID", "Priority": "優先度", "Alarm Message": "内容", "Duration": "継続時間",
    "Acknowledge": "確認", "Shelve": "保留", "Clear Alarm": "解除", "Close Alarm": "クローズ", "Report Alarm": "アラーム報告", "Alarm Detail": "アラーム詳細", "Note": "メモ",
    "Shelve for (hours)": "保留時間（時間）", "Action history": "処理履歴", "Actor": "担当者", "Action": "操作", "Value": "値", "Limit": "閾値", "Alarm reported.": "アラームを報告しました。",
    "Done: {n}": "処理: {n}", "Skipped: {list}": "スキップ: {list}", "Select alarms in the list first.": "先に一覧からアラームを選択してください。", "Sound On": "音声オン", "Sound Off": "音声オフ",
    "A reason is required.": "理由は必須です。", "Selected": "選択", "Report downtime from this alarm": "このアラームから停止報告", "Linked downtime": "関連停止",
    "Alarm Rate (%)": "アラーム率（%）", "Alarms": "アラーム", "Average": "平均",
  },
};

export function tx(text, params) {
  const template = TEXT[lang()]?.[text] || WO_TEXT[lang()]?.[text] || text;
  return params ? String(template).replace(/\{(\w+)\}/g, (_, k) => params[k] ?? "") : template;
}

const LABELS = {
  machineStatus: {
    en: { RUNNING: "Running", IDLE: "Idle", DOWN: "Down", MAINTENANCE: "Maintenance", OFFLINE: "Offline", UNKNOWN: "Unknown" },
    vi: { RUNNING: "Đang chạy", IDLE: "Chờ", DOWN: "Dừng", MAINTENANCE: "Bảo trì", OFFLINE: "Mất kết nối", UNKNOWN: "Không rõ" },
    ja: { RUNNING: "稼働", IDLE: "待機", DOWN: "停止", MAINTENANCE: "保全", OFFLINE: "オフライン", UNKNOWN: "不明" },
  },
  priority: {
    en: { CRITICAL: "Critical", HIGH: "High", MEDIUM: "Medium", LOW: "Low" },
    vi: { CRITICAL: "Nghiêm trọng", HIGH: "Cao", MEDIUM: "Trung bình", LOW: "Thấp" },
    ja: { CRITICAL: "重大", HIGH: "高", MEDIUM: "中", LOW: "低" },
  },
  alarmStatus: {
    en: { ACTIVE: "Active", ACKNOWLEDGED: "Acknowledged", SHELVED: "Shelved", CLEARED: "Cleared", CLOSED: "Closed" },
    vi: { ACTIVE: "Đang hoạt động", ACKNOWLEDGED: "Đã xác nhận", SHELVED: "Tạm ẩn", CLEARED: "Đã hết", CLOSED: "Đã đóng" },
    ja: { ACTIVE: "発生中", ACKNOWLEDGED: "確認済", SHELVED: "保留", CLEARED: "解除", CLOSED: "クローズ" },
  },
  alarmAction: {
    en: { RAISE: "Raised", ACKNOWLEDGE: "Acknowledged", SHELVE: "Shelved", UNSHELVE: "Unshelved", CLEAR: "Cleared", CLOSE: "Closed" },
    vi: { RAISE: "Phát sinh", ACKNOWLEDGE: "Xác nhận", SHELVE: "Tạm ẩn", UNSHELVE: "Hết tạm ẩn", CLEAR: "Hết cảnh báo", CLOSE: "Đóng" },
    ja: { RAISE: "発生", ACKNOWLEDGE: "確認", SHELVE: "保留", UNSHELVE: "保留解除", CLEAR: "解除", CLOSE: "クローズ" },
  },
  dtStatus: {
    en: { OPEN: "Open", CLOSED: "Closed", CANCELLED: "Cancelled" },
    vi: { OPEN: "Đang dừng", CLOSED: "Đã xử lý", CANCELLED: "Đã hủy" },
    ja: { OPEN: "停止中", CLOSED: "処理済", CANCELLED: "取消" },
  },
  dtCategory: {
    en: { PLANNED: "Planned", UNPLANNED: "Unplanned" }, vi: { PLANNED: "Có kế hoạch", UNPLANNED: "Ngoài kế hoạch" }, ja: { PLANNED: "計画", UNPLANNED: "計画外" },
  },
  source: {
    en: { MANUAL: "Manual", MES: "MES", PLC: "PLC", IOT: "IoT", SIMULATOR: "Simulator", SYSTEM: "System" },
    vi: { MANUAL: "Nhập tay", MES: "MES", PLC: "PLC", IOT: "IoT", SIMULATOR: "Giả lập", SYSTEM: "Hệ thống" },
    ja: { MANUAL: "手入力", MES: "MES", PLC: "PLC", IOT: "IoT", SIMULATOR: "シミュレーター", SYSTEM: "システム" },
  },
  component: {
    en: { ROBOT: "Robot", HOPPER: "Hopper", MOLD: "Mold", HEATER: "Heater", HYDRAULIC: "Hydraulic", LUBRICATION: "Lubrication", COOLING_WATER: "Cooling Water", AIR_PRESSURE: "Air Pressure",
          COMPRESSOR: "Compressor", PUMP: "Pump", FAN: "Fan", POWER: "Power", SERVO: "Servo", GRIPPER: "Gripper", SAFETY: "Safety" },
    vi: { ROBOT: "Robot", HOPPER: "Phễu nạp liệu", MOLD: "Khuôn", HEATER: "Gia nhiệt", HYDRAULIC: "Thủy lực", LUBRICATION: "Bôi trơn", COOLING_WATER: "Nước làm mát", AIR_PRESSURE: "Khí nén",
          COMPRESSOR: "Máy nén", PUMP: "Bơm", FAN: "Quạt", POWER: "Nguồn điện", SERVO: "Servo", GRIPPER: "Tay gắp", SAFETY: "An toàn" },
    ja: { ROBOT: "ロボット", HOPPER: "ホッパー", MOLD: "金型", HEATER: "ヒーター", HYDRAULIC: "油圧", LUBRICATION: "潤滑", COOLING_WATER: "冷却水", AIR_PRESSURE: "エア圧",
          COMPRESSOR: "コンプレッサー", PUMP: "ポンプ", FAN: "ファン", POWER: "電源", SERVO: "サーボ", GRIPPER: "グリッパー", SAFETY: "安全" },
  },
};

export function label(group, value) {
  if (group === "woStatus") return woStatusLabel(lang(), value);
  return LABELS[group]?.[lang()]?.[value] || LABELS[group]?.en?.[value] || value || "—";
}

export { localeTag };
