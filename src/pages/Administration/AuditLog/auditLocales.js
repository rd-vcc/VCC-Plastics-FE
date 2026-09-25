import { UI_TEXT as WO_TEXT, setActiveLanguage as setWoLanguage } from "../../ProductionManagement/WorkOrders/WorkOrderManagement/woLocales";

let activeLanguage = "en";
export function setActiveLanguage(language) { activeLanguage = language; setWoLanguage(language); }
export const isVi = () => String(activeLanguage || "en").startsWith("vi");
const lang = () => String(activeLanguage || "en").split("-")[0];

const TEXT = {
  vi: {
    "Audit Log": "Nhật ký hệ thống", "Export Log": "Xuất nhật ký", "Scheduled Reports": "Báo cáo tự động", "Audit Settings": "Cấu hình Audit", "Total Activities": "Tổng hoạt động",
    "Users": "Người dùng", "Modules": "Phân hệ", "Critical Events": "Sự kiện nghiêm trọng", "Failed Attempts": "Truy cập thất bại", "Data Changes": "Thay đổi dữ liệu",
    "vs previous period": "so với kỳ trước", "active users": "người dùng hoạt động", "modules accessed": "phân hệ có thao tác", "require attention": "cần chú ý",
    "login / access failures": "đăng nhập / truy cập thất bại", "data modified": "dữ liệu được sửa", "Search": "Tìm kiếm", "Search by user, action, record, message...": "Tìm theo người dùng, hành động, bản ghi, thông báo...",
    "Time Range": "Khoảng thời gian", "User": "Người dùng", "All Users": "Tất cả người dùng", "Module": "Phân hệ", "All Modules": "Tất cả phân hệ", "Action": "Hành động", "All Actions": "Tất cả hành động",
    "Severity": "Mức độ", "All Severity": "Tất cả mức độ", "Result": "Kết quả", "All Results": "Tất cả kết quả", "IP Address": "Địa chỉ IP", "All IP Addresses": "Tất cả IP",
    "Data Type": "Loại dữ liệu", "All Data Types": "Tất cả loại dữ liệu", "Source": "Nguồn", "All Sources": "Tất cả nguồn", "Clear": "Xóa lọc", "From": "Từ ngày", "To": "Đến ngày",
    "Activity Log": "Nhật ký hoạt động", "showing {n} of {t}": "hiển thị {n}/{t} bản ghi mới nhất", "Time": "Thời gian", "Role": "Vai trò", "Description": "Mô tả", "Record ID": "Mã bản ghi",
    "Activity Details": "Chi tiết hoạt động", "Select a row to see its details.": "Chọn một dòng để xem chi tiết.", "Before / After Changes": "Giá trị trước / sau",
    "Field": "Trường", "Before": "Trước", "After": "Sau", "No field change recorded.": "Không có thay đổi trường nào được ghi.", "Request data": "Dữ liệu gửi lên", "Related records": "Hoạt động liên quan",
    "Browser / Device": "Trình duyệt / thiết bị", "Session ID": "Phiên", "HTTP": "HTTP", "Duration": "Thời gian xử lý", "Message": "Thông báo",
    "Activities Over Time": "Hoạt động theo thời gian", "Activities by Module": "Hoạt động theo phân hệ", "Top Users by Activities": "Người dùng hoạt động nhiều nhất",
    "Activity Severity Distribution": "Phân bố mức độ", "Total Users": "Tổng người dùng", "Total": "Tổng", "Failed": "Thất bại", "Activities": "Hoạt động",
    "Record data-changing actions": "Ghi nhận các thao tác thay đổi dữ liệu", "Store before / after values of updates": "Lưu giá trị trước / sau khi sửa",
    "Record exports and downloads": "Ghi nhận xuất / tải dữ liệu", "Retention (days)": "Thời gian lưu (ngày)", "Save": "Lưu", "Back": "Quay lại", "Saved.": "Đã lưu.",
    "Audit records are append-only: they cannot be edited or deleted, only aged out after the retention period.": "Bản ghi Audit chỉ ghi thêm: không thể sửa hay xóa, chỉ tự hết hạn sau thời gian lưu.",
    "No data.": "Không có dữ liệu.", "Today": "Hôm nay", "Last 7 Days": "7 ngày gần nhất", "Last 30 Days": "30 ngày gần nhất", "Custom": "Tùy chọn", "Unknown": "Không xác định",
    "since": "từ", "records in total": "bản ghi tổng cộng", "Open": "Mở", "The old module histories were imported: status changes before the Audit Log was enabled.": "Đã nhập lịch sử cũ của các phân hệ: các thay đổi trạng thái trước khi bật Audit Log.",
  },
};

export function tx(text, params) {
  const template = TEXT[lang()]?.[text] || WO_TEXT[lang()]?.[text] || text;
  return params ? String(template).replace(/\{(\w+)\}/g, (_, k) => params[k] ?? "") : template;
}

const L = (en, vi) => ({ en, vi });
const LABELS = {
  module: L({ PRODUCTION: "Production Management", MACHINE: "Machine & Equipment", MOLD: "Mold Management", MATERIAL: "Material Management", QUALITY: "Quality Management",
    MAINTENANCE: "Maintenance Management", TRACEABILITY: "Traceability", REPORTS: "Reports & Analytics", DASHBOARD: "Dashboard", USER_MANAGEMENT: "User Management",
    ROLE_PERMISSION: "Role & Permission", AUTHENTICATION: "Authentication", ADMINISTRATION: "Administration", FILES: "Files", SYSTEM_CONFIGURATION: "System Configuration", SYSTEM: "System" },
    { PRODUCTION: "Quản lý sản xuất", MACHINE: "Máy móc & thiết bị", MOLD: "Quản lý khuôn", MATERIAL: "Quản lý vật tư", QUALITY: "Quản lý chất lượng", MAINTENANCE: "Quản lý bảo trì",
      TRACEABILITY: "Truy xuất nguồn gốc", REPORTS: "Báo cáo & phân tích", DASHBOARD: "Tổng quan", USER_MANAGEMENT: "Quản lý người dùng", ROLE_PERMISSION: "Vai trò & phân quyền",
      AUTHENTICATION: "Xác thực", ADMINISTRATION: "Quản trị", FILES: "Tệp tin", SYSTEM_CONFIGURATION: "Cấu hình hệ thống", SYSTEM: "Hệ thống" }),
  action: L({ CREATE: "Create", UPDATE: "Update", DELETE: "Delete", LOGIN: "Login", LOGOUT: "Logout", FAILED_LOGIN: "Failed login", EXPORT: "Export", IMPORT: "Import", PRINT: "Print",
    APPROVE: "Approve", REJECT: "Reject", SUBMIT: "Submit", CANCEL: "Cancel", HOLD: "Hold", RESUME: "Resume", START: "Start", COMPLETE: "Complete", CLOSE: "Close", VERIFY: "Verify",
    STATUS_CHANGE: "Status change", CONFIG_CHANGE: "Configuration change", PERMISSION_CHANGE: "Permission change", UPLOAD: "Upload", RUN: "Run", FAVORITE: "Favorite",
    ACKNOWLEDGE: "Acknowledge", CLEAR: "Clear", RELEASE: "Release", ACTIVATE: "Activate", OBSOLETE: "Obsolete", REOPEN: "Reopen" },
    { CREATE: "Tạo mới", UPDATE: "Cập nhật", DELETE: "Xóa", LOGIN: "Đăng nhập", LOGOUT: "Đăng xuất", FAILED_LOGIN: "Đăng nhập thất bại", EXPORT: "Xuất dữ liệu", IMPORT: "Nhập dữ liệu",
      PRINT: "In", APPROVE: "Duyệt", REJECT: "Từ chối", SUBMIT: "Gửi duyệt", CANCEL: "Hủy", HOLD: "Tạm giữ", RESUME: "Tiếp tục", START: "Bắt đầu", COMPLETE: "Hoàn thành", CLOSE: "Đóng",
      VERIFY: "Xác nhận", STATUS_CHANGE: "Đổi trạng thái", CONFIG_CHANGE: "Thay đổi cấu hình", PERMISSION_CHANGE: "Thay đổi phân quyền", UPLOAD: "Tải tệp lên", RUN: "Chạy",
      FAVORITE: "Yêu thích", ACKNOWLEDGE: "Tiếp nhận", CLEAR: "Xóa cảnh báo", RELEASE: "Phát hành", ACTIVATE: "Kích hoạt", OBSOLETE: "Hết hiệu lực", REOPEN: "Mở lại" }),
  severity: L({ LOW: "Low", MEDIUM: "Medium", HIGH: "High", CRITICAL: "Critical" }, { LOW: "Thấp", MEDIUM: "Trung bình", HIGH: "Cao", CRITICAL: "Nghiêm trọng" }),
  result: L({ SUCCESS: "Success", FAILED: "Failed" }, { SUCCESS: "Thành công", FAILED: "Thất bại" }),
  source: L({ API: "User action", AUTH: "Authentication", MODULE: "Module history", SYSTEM: "System" }, { API: "Thao tác người dùng", AUTH: "Xác thực", MODULE: "Lịch sử phân hệ", SYSTEM: "Hệ thống" }),
};

const titleCase = (v) => String(v || "").toLowerCase().split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

export function label(group, value) {
  return LABELS[group]?.[lang()]?.[value] || LABELS[group]?.en?.[value] || (value ? titleCase(value) : "—");
}
