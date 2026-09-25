import { UI_TEXT as WO_TEXT, setActiveLanguage as setWoLanguage } from "../../ProductionManagement/WorkOrders/WorkOrderManagement/woLocales";

let activeLanguage = "en";
export function setActiveLanguage(language) { activeLanguage = language; setWoLanguage(language); }
export const isVi = () => String(activeLanguage || "en").startsWith("vi");
const lang = () => String(activeLanguage || "en").split("-")[0];

const TEXT = {
  vi: {
    "Report Center": "Trung tâm báo cáo", "Favorites": "Yêu thích", "Scheduled Reports": "Báo cáo tự động", "Report History": "Lịch sử báo cáo", "Create Report": "Tạo báo cáo",
    "Total Reports": "Tổng số báo cáo", "Favorite Reports": "Báo cáo yêu thích", "Reports Generated (MTD)": "Báo cáo đã tạo (tháng)", "Last Generated": "Tạo gần nhất",
    "new this month": "mới trong tháng", "frequently used": "dùng thường xuyên", "vs last month": "so với tháng trước", "active schedules": "lịch đang chạy", "never": "chưa có",
    "All Reports": "Tất cả", "My Favorites": "Yêu thích của tôi", "Frequently Used": "Hay dùng", "Custom Reports": "Báo cáo tự tạo", "Module": "Phân hệ", "All Modules": "Tất cả phân hệ",
    "Report Category": "Nhóm báo cáo", "All Categories": "Tất cả nhóm", "Report Type": "Loại báo cáo", "All Types": "Tất cả loại", "Search by report name, description...": "Tìm theo tên, mô tả báo cáo...",
    "Reset": "Đặt lại", "Report Categories": "Danh mục báo cáo", "Reports": "Báo cáo", "Report Name": "Tên báo cáo", "Category": "Nhóm", "Type": "Loại", "Output": "Định dạng",
    "Actions": "Thao tác", "Quick Actions": "Thao tác nhanh", "Export Data": "Xuất danh sách", "Most Recent Reports": "Báo cáo gần đây", "View all": "Xem tất cả",
    "Report Usage (MTD)": "Mức sử dụng báo cáo (tháng)", "Report Generation Trend (Last 7 Days)": "Xu hướng tạo báo cáo (7 ngày)", "Top 5 Frequently Used Reports (MTD)": "Top 5 báo cáo dùng nhiều (tháng)",
    "Scheduled Reports (Next 7 Days)": "Báo cáo tự động (7 ngày tới)", "Storage Usage": "Dung lượng lưu trữ", "times": "lần", "Used": "Đã dùng", "Available": "Còn trống",
    "No data.": "Không có dữ liệu.", "Preview": "Xem trước", "Period": "Kỳ báo cáo", "From": "Từ ngày", "To": "Đến ngày", "Run": "Chạy", "Excel": "Excel", "CSV": "CSV", "Print / PDF": "In / PDF",
    "rows": "dòng", "Generated in": "Thời gian chạy", "Schedule": "Lập lịch", "Delete": "Xóa", "Close": "Đóng", "Save": "Lưu", "Back": "Quay lại", "Name": "Tên", "Report": "Báo cáo",
    "Frequency": "Tần suất", "Time": "Giờ", "Weekday": "Thứ", "Day of month": "Ngày trong tháng", "Data range": "Phạm vi dữ liệu", "Format": "Định dạng", "Language": "Ngôn ngữ",
    "Recipients (e-mail, comma separated)": "Người nhận (e-mail, cách nhau dấu phẩy)", "Status": "Trạng thái", "Next run": "Lần chạy tới", "Last run": "Lần chạy trước", "Run now": "Chạy ngay",
    "Edit": "Sửa", "New schedule": "Lịch mới", "Pause": "Tạm dừng", "Activate": "Kích hoạt", "Action": "Hành động", "User": "Người dùng", "File": "Tệp", "Rows": "Số dòng", "Duration": "Thời gian",
    "Download": "Tải", "Base report": "Báo cáo gốc", "Description": "Mô tả", "Default range": "Phạm vi mặc định", "Shared with everyone": "Chia sẻ cho mọi người",
    "A custom report is a standard report saved with its own name and default period.": "Báo cáo tự tạo = báo cáo chuẩn được lưu với tên và kỳ mặc định riêng.",
    "E-mail delivery is not configured yet: scheduled files are stored and listed in the Report History.": "Chưa cấu hình gửi e-mail: file tạo tự động được lưu và xem ở Lịch sử báo cáo.",
    "Saved.": "Đã lưu.", "Deleted.": "Đã xóa.", "Schedule run finished": "Đã chạy lịch", "Added to favorites.": "Đã thêm vào yêu thích.", "Removed from favorites.": "Đã bỏ yêu thích.",
    "PDF: use Print and choose \"Save as PDF\".": "PDF: bấm In và chọn \"Lưu thành PDF\".", "Standard": "Chuẩn", "Custom": "Tự tạo", "Delete this custom report?": "Xóa báo cáo tự tạo này?",
    "Period": "Kỳ", "Generated": "Tạo lúc", "Total": "Tổng", "Files": "Tệp", "used by": "dùng", "Most used": "Dùng nhiều",
  },
};

export function tx(text, params) {
  const template = TEXT[lang()]?.[text] || WO_TEXT[lang()]?.[text] || text;
  return params ? String(template).replace(/\{(\w+)\}/g, (_, k) => params[k] ?? "") : template;
}

const L = (en, vi) => ({ en, vi });
const LABELS = {
  module: L({ PRODUCTION: "Production Management", MACHINE: "Machine & Equipment", MOLD: "Mold Management", MATERIAL: "Material Management", QUALITY: "Quality Management",
    MAINTENANCE: "Maintenance Management", TRACEABILITY: "Traceability", ADMINISTRATION: "Administration", SYSTEM: "System" },
    { PRODUCTION: "Quản lý sản xuất", MACHINE: "Máy móc & thiết bị", MOLD: "Quản lý khuôn", MATERIAL: "Quản lý vật tư", QUALITY: "Quản lý chất lượng", MAINTENANCE: "Quản lý bảo trì",
      TRACEABILITY: "Truy xuất nguồn gốc", ADMINISTRATION: "Quản trị", SYSTEM: "Hệ thống" }),
  category: L({ SUMMARY: "Summary", TREND: "Trend", EFFICIENCY: "Efficiency", PROGRESS: "Progress", UTILIZATION: "Utilization", DOWNTIME: "Downtime", ALARM: "Alarm", PERFORMANCE: "Performance",
    SHOT_COUNTER: "Shot Counter", HISTORY: "History", INVENTORY: "Inventory", CONSUMPTION: "Consumption", PLANNING: "Planning", QUALITY: "Quality", NG: "NG", SPC: "SPC", CALIBRATION: "Calibration",
    COST: "Cost", TRACEABILITY: "Traceability", SECURITY: "Security", MASTER_DATA: "Master Data", SETTINGS: "Settings" },
    { SUMMARY: "Tổng hợp", TREND: "Xu hướng", EFFICIENCY: "Hiệu suất", PROGRESS: "Tiến độ", UTILIZATION: "Sử dụng", DOWNTIME: "Dừng máy", ALARM: "Cảnh báo", PERFORMANCE: "Hiệu suất",
      SHOT_COUNTER: "Bộ đếm shot", HISTORY: "Lịch sử", INVENTORY: "Tồn kho", CONSUMPTION: "Tiêu thụ", PLANNING: "Kế hoạch", QUALITY: "Chất lượng", NG: "NG", SPC: "SPC", CALIBRATION: "Hiệu chuẩn",
      COST: "Chi phí", TRACEABILITY: "Truy xuất", SECURITY: "Bảo mật", MASTER_DATA: "Danh mục", SETTINGS: "Thiết lập" }),
  range: L({ TODAY: "Today", YESTERDAY: "Yesterday", LAST_7: "Last 7 days", LAST_30: "Last 30 days", MTD: "Month to date", LAST_MONTH: "Last month", CUSTOM: "Custom" },
    { TODAY: "Hôm nay", YESTERDAY: "Hôm qua", LAST_7: "7 ngày gần nhất", LAST_30: "30 ngày gần nhất", MTD: "Từ đầu tháng", LAST_MONTH: "Tháng trước", CUSTOM: "Tùy chọn" }),
  frequency: L({ DAILY: "Daily", WEEKLY: "Weekly", MONTHLY: "Monthly" }, { DAILY: "Hằng ngày", WEEKLY: "Hằng tuần", MONTHLY: "Hằng tháng" }),
  weekday: L({ 0: "Monday", 1: "Tuesday", 2: "Wednesday", 3: "Thursday", 4: "Friday", 5: "Saturday", 6: "Sunday" }, { 0: "Thứ 2", 1: "Thứ 3", 2: "Thứ 4", 3: "Thứ 5", 4: "Thứ 6", 5: "Thứ 7", 6: "Chủ nhật" }),
  action: L({ PREVIEW: "Preview", EXPORT: "Export", PRINT: "Print / PDF", SCHEDULE: "Scheduled" }, { PREVIEW: "Xem trước", EXPORT: "Xuất file", PRINT: "In / PDF", SCHEDULE: "Tự động" }),
  status: L({ ACTIVE: "Active", PAUSED: "Paused", SUCCESS: "Success", FAILED: "Failed" }, { ACTIVE: "Đang chạy", PAUSED: "Tạm dừng", SUCCESS: "Thành công", FAILED: "Lỗi" }),
};

export function label(group, value) {
  return LABELS[group]?.[lang()]?.[value] || LABELS[group]?.en?.[value] || value || "—";
}
