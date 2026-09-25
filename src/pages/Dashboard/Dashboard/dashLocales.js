import { UI_TEXT as WO_TEXT, setActiveLanguage as setWoLanguage } from "../../ProductionManagement/WorkOrders/WorkOrderManagement/woLocales";

let activeLanguage = "en";
export function setActiveLanguage(language) { activeLanguage = language; setWoLanguage(language); }
const lang = () => String(activeLanguage || "en").split("-")[0];

const TEXT = {
  vi: {
    "Dashboard": "Tổng quan nhà máy", "Plant": "Nhà máy", "Area": "Khu vực", "All Area": "Tất cả khu vực", "Shift": "Ca", "Whole day": "Cả ngày", "Business Date": "Ngày làm việc",
    "Save View": "Lưu bộ lọc", "Share": "Chia sẻ", "Fullscreen": "Toàn màn hình", "View saved.": "Đã lưu bộ lọc.", "Cannot save the view in this browser.": "Trình duyệt không cho lưu bộ lọc.",
    "Link copied.": "Đã sao chép liên kết.", "Overall Equipment Effectiveness": "Hiệu suất thiết bị (OEE)", "Production Achievement": "Tỷ lệ đạt kế hoạch", "Good Pieces": "Sản phẩm đạt",
    "Reject Pieces": "Sản phẩm lỗi", "Active Alarms": "Cảnh báo đang mở", "Work Orders In Progress": "Work Order đang chạy", "vs yesterday": "so với hôm qua", "yesterday": "hôm qua",
    "no data yesterday": "hôm qua chưa có dữ liệu", "raised in the period": "phát sinh trong kỳ", "on track": "đúng tiến độ", "at risk": "có rủi ro", "delay": "trễ",
    "Factory Overview": "Tổng quan nhà máy", "All": "Tất cả", "No layout image yet: machines are placed on a grid (set it in Factory Structure).": "Chưa có ảnh mặt bằng: máy được xếp theo lưới.",
    "Click a machine to open Machine Detail.": "Bấm vào máy để mở Chi tiết máy.", "No work order": "Không có Work Order", "active alarms": "cảnh báo đang mở",
    "Production Progress (Top 5 Orders)": "Tiến độ sản xuất (Top 5 lệnh)", "View All": "Xem tất cả", "Order No.": "Số lệnh", "Product": "Sản phẩm", "Plan (PCS)": "Kế hoạch (sp)",
    "Actual (PCS)": "Thực tế (sp)", "Progress": "Tiến độ", "Status": "Trạng thái", "No open production order.": "Không có lệnh sản xuất đang mở.", "Downtime Analysis": "Phân tích dừng máy",
    "View Detail": "Xem chi tiết", "Total (min)": "Tổng (phút)", "No downtime in the period.": "Không có dừng máy trong kỳ.", "Factory Assistant": "Trợ lý nhà máy",
    "Production Status": "Tình trạng sản xuất", "Running Machines": "Máy đang chạy", "Idle Machines": "Máy chờ", "Down Machines": "Máy dừng", "Maintenance": "Bảo trì",
    "Shift Summary": "Tổng hợp ca", "Planned Production": "Kế hoạch sản xuất", "Actual Production": "Sản lượng thực tế", "Achievement": "Tỷ lệ đạt", "Good Rate": "Tỷ lệ đạt chất lượng",
    "Material Readiness": "Sẵn sàng vật tư", "Ready": "Sẵn sàng", "Running Low": "Sắp hết", "Out of Stock / Shortage": "Hết hàng / thiếu", "Maintenance Reminder": "Nhắc bảo trì",
    "Due Today": "Đến hạn hôm nay", "Overdue": "Quá hạn", "View All Notifications": "Xem tất cả thông báo", "Notifications": "Thông báo",
    "Production alerts, open quality alerts and active machine alarms": "Cảnh báo sản xuất, cảnh báo chất lượng đang mở và cảnh báo máy", "Source": "Nguồn", "Notification": "Nội dung",
    "Object": "Đối tượng", "Time": "Thời gian", "Total": "Tổng", "min": "phút", "Previous day": "Ngày trước", "Next day": "Ngày sau",
  },
  ja: {
    "Dashboard": "ダッシュボード", "Plant": "工場", "Area": "エリア", "All Area": "全エリア", "Shift": "シフト", "Whole day": "終日", "Business Date": "業務日", "Save View": "ビュー保存",
    "Share": "共有", "Fullscreen": "全画面", "Overall Equipment Effectiveness": "設備総合効率 (OEE)", "Production Achievement": "生産達成率", "Good Pieces": "良品数", "Reject Pieces": "不良数",
    "Active Alarms": "発生中アラーム", "Work Orders In Progress": "生産中作業指示", "vs yesterday": "前日比", "yesterday": "昨日", "Factory Overview": "工場概要",
    "Production Progress (Top 5 Orders)": "生産進捗（上位5件）", "Downtime Analysis": "停止分析", "Factory Assistant": "工場アシスタント", "Production Status": "生産状況",
    "Material Readiness": "材料準備状況", "Maintenance Reminder": "保全リマインダー", "Notifications": "通知", "View All Notifications": "すべての通知",
  },
};

export function tx(text, params) {
  const template = TEXT[lang()]?.[text] || WO_TEXT[lang()]?.[text] || text;
  return params ? String(template).replace(/\{(\w+)\}/g, (_, k) => params[k] ?? "") : template;
}

const L = (en, vi, ja = {}) => ({ en, vi, ja });
const LABELS = {
  machineStatus: L({ RUNNING: "Running", IDLE: "Idle", DOWN: "Down", MAINTENANCE: "Maintenance", OFFLINE: "Offline" }, { RUNNING: "Đang chạy", IDLE: "Chờ", DOWN: "Dừng", MAINTENANCE: "Bảo trì", OFFLINE: "Mất kết nối" },
    { RUNNING: "稼働", IDLE: "待機", DOWN: "停止", MAINTENANCE: "保全", OFFLINE: "オフライン" }),
  orderState: L({ AHEAD: "Ahead", ON_TRACK: "On Track", AT_RISK: "At Risk", DELAY: "Delay", NOT_STARTED: "Not started", COMPLETED: "Completed" },
    { AHEAD: "Vượt tiến độ", ON_TRACK: "Đúng tiến độ", AT_RISK: "Có rủi ro", DELAY: "Trễ", NOT_STARTED: "Chưa bắt đầu", COMPLETED: "Hoàn thành" }),
  source: L({ PRODUCTION: "Production", QUALITY: "Quality", MACHINE: "Machine" }, { PRODUCTION: "Sản xuất", QUALITY: "Chất lượng", MACHINE: "Máy" }),
  note: L({ MACHINE_DOWN: "Machine down", MACHINE_MAINTENANCE: "Machine in maintenance", MACHINE_OFFLINE: "Machine offline", WO_ON_HOLD: "Work order on hold", WO_DELAYED: "Work order delayed",
    MOLD_LIFE: "Mold near end of life", LOW_YIELD: "Low yield", MATERIAL_SHORTAGE: "Material shortage", ALARM: "Machine alarm", SPC_OOC: "SPC out of control", SPC_TREND: "SPC trend",
    WO_NG: "Work order NG rate", MACHINE_NG: "Machine NG rate", MOLD_REPEAT: "Mold repeated defect", NG_CRITICAL: "Critical NG", NG_OVERDUE: "NG overdue", NG_CUSTOMER: "Customer complaint",
    CAL_OVERDUE: "Calibration overdue", CAL_DUE: "Calibration due soon", NOT_CALIBRATED: "Never calibrated", GAUGE_LOCKED: "Invalid gauge used", INSPECTION_OVERDUE: "Inspection overdue",
    FPY_LOW: "FPY below target", PPM_HIGH: "PPM above target" },
    { MACHINE_DOWN: "Máy dừng", MACHINE_MAINTENANCE: "Máy đang bảo trì", MACHINE_OFFLINE: "Máy mất kết nối", WO_ON_HOLD: "Work Order tạm giữ", WO_DELAYED: "Work Order trễ tiến độ",
      MOLD_LIFE: "Khuôn sắp hết tuổi thọ", LOW_YIELD: "Tỷ lệ đạt thấp", MATERIAL_SHORTAGE: "Thiếu vật tư", ALARM: "Cảnh báo máy", SPC_OOC: "SPC mất kiểm soát", SPC_TREND: "Xu hướng SPC",
      WO_NG: "Tỷ lệ NG Work Order", MACHINE_NG: "Tỷ lệ NG theo máy", MOLD_REPEAT: "Khuôn lặp lỗi", NG_CRITICAL: "NG nghiêm trọng", NG_OVERDUE: "NG quá hạn", NG_CUSTOMER: "Khiếu nại khách hàng",
      CAL_OVERDUE: "Quá hạn hiệu chuẩn", CAL_DUE: "Sắp đến hạn hiệu chuẩn", NOT_CALIBRATED: "Chưa hiệu chuẩn", GAUGE_LOCKED: "Dùng thiết bị đo không hợp lệ", INSPECTION_OVERDUE: "Kiểm tra quá hạn",
      FPY_LOW: "FPY dưới mục tiêu", PPM_HIGH: "PPM vượt mục tiêu" }),
};

export function label(group, value) {
  return LABELS[group]?.[lang()]?.[value] || LABELS[group]?.en?.[value] || value || "—";
}
