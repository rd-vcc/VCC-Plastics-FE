let activeLanguage = "en";
export function setActiveLanguage(language) { activeLanguage = language; }
export const UI_TEXT = {
  vi: {
    "Machine & Equipment Master": "Danh mục máy & thiết bị", "Manage all machines and equipment in the system": "Quản lý toàn bộ máy móc và thiết bị trong hệ thống",
    "Equipment Types": "Loại thiết bị", "Machine Groups": "Nhóm máy", "Specifications": "Thông số kỹ thuật", "Specification Definitions": "Định nghĩa thông số",
    "Refresh": "Làm mới", "Add New Machine": "Thêm máy mới", "Total Machines": "Tổng số máy", "All machines": "Tất cả máy", "Running": "Đang chạy", "Idle": "Chờ",
    "Maintenance": "Bảo trì", "Down": "Dừng máy", "Active types": "Loại đang hoạt động", "Equipment Type": "Loại thiết bị", "Machine Status": "Trạng thái máy",
    "All Types": "Tất cả loại", "All Status": "Tất cả trạng thái", "All Groups": "Tất cả nhóm", "Clear": "Xóa bộ lọc", "Equipment Hierarchy": "Cây thiết bị",
    "All locations": "Tất cả vị trí", "Machine List": "Danh sách máy", "Machine Detail": "Chi tiết máy", "General": "Thông tin chung", "Specification": "Thông số",
    "Select a machine.": "Chọn một máy để xem chi tiết.", "Machines by Type": "Máy theo loại", "Recently Updated Machines": "Máy cập nhật gần đây", "No data.": "Chưa có dữ liệu.",
    "Equipment Code": "Mã thiết bị", "Equipment Name": "Tên thiết bị", "Machine Group": "Nhóm máy", "Factory Location": "Vị trí nhà máy", "Technical Information": "Thông tin kỹ thuật",
    "Manufacturer": "Nhà sản xuất", "Model": "Model", "Serial Number": "Số sê-ri", "Manufacturing Year": "Năm sản xuất", "Installation Date": "Ngày lắp đặt",
    "Commissioning Date": "Ngày đưa vào sử dụng", "Image URL": "Đường dẫn hình ảnh", "Asset Status": "Trạng thái tài sản", "Operational Status": "Trạng thái vận hành",
    "Description": "Mô tả", "Cancel": "Hủy", "Save": "Lưu", "Edit Machine / Equipment": "Sửa máy / thiết bị", "Add New Machine / Equipment": "Thêm máy / thiết bị",
    "Code": "Mã", "Name": "Tên", "Category": "Nhóm loại", "Data Type": "Kiểu dữ liệu", "Unit": "Đơn vị", "Required": "Bắt buộc", "Status": "Trạng thái", "Actions": "Thao tác",
    "All equipment types": "Tất cả loại thiết bị", "Select equipment type": "Chọn loại thiết bị", "Sort Order": "Thứ tự", "Yes": "Có", "No": "Không", "Back": "Quay lại", "Close": "Đóng", "Add New": "Thêm mới",
    "Save Specifications": "Lưu thông số", "No specifications are configured for this equipment type.": "Chưa cấu hình thông số cho loại thiết bị này.", "No specifications.": "Chưa có thông số.",
    "Search by machine code or name...": "Tìm theo mã hoặc tên máy...", "of total": "trên tổng số", "Not set": "Chưa nhập", "Delete": "Xóa", "Edit": "Sửa", "View": "Xem",
    "Machine Code": "Mã máy", "Machine Name": "Tên máy", "Area / Line": "Khu vực / Chuyền", "Install Date": "Ngày lắp đặt", "Edit machine": "Sửa máy", "Edit specifications": "Sửa thông số", "Toggle Running / Idle": "Chuyển Đang chạy / Chờ", "Settings": "Cài đặt", "Master Data Configuration": "Cấu hình danh mục",
  },
  ja: {
    "Machine & Equipment Master": "機械・設備マスター", "Manage all machines and equipment in the system": "システム内の機械・設備を一元管理します",
    "Equipment Types": "設備タイプ", "Machine Groups": "機械グループ", "Specifications": "仕様", "Specification Definitions": "仕様定義",
    "Refresh": "更新", "Add New Machine": "機械を追加", "Total Machines": "機械総数", "All machines": "全機械", "Running": "稼働中", "Idle": "待機中",
    "Maintenance": "保守中", "Down": "停止中", "Active types": "有効タイプ", "Equipment Type": "設備タイプ", "Machine Status": "機械状態",
    "All Types": "全タイプ", "All Status": "全状態", "All Groups": "全グループ", "Clear": "クリア", "Equipment Hierarchy": "設備階層",
    "All locations": "全ロケーション", "Machine List": "機械一覧", "Machine Detail": "機械詳細", "General": "基本情報", "Specification": "仕様",
    "Select a machine.": "機械を選択してください。", "Machines by Type": "タイプ別機械", "Recently Updated Machines": "最近更新された機械", "No data.": "データがありません。",
    "Equipment Code": "設備コード", "Equipment Name": "設備名", "Machine Group": "機械グループ", "Factory Location": "工場ロケーション", "Technical Information": "技術情報",
    "Manufacturer": "メーカー", "Model": "モデル", "Serial Number": "シリアル番号", "Manufacturing Year": "製造年", "Installation Date": "設置日",
    "Commissioning Date": "稼働開始日", "Image URL": "画像URL", "Asset Status": "資産状態", "Operational Status": "運転状態", "Description": "説明",
    "Cancel": "キャンセル", "Save": "保存", "Edit Machine / Equipment": "機械・設備を編集", "Add New Machine / Equipment": "機械・設備を追加",
    "Code": "コード", "Name": "名称", "Category": "カテゴリ", "Data Type": "データ型", "Unit": "単位", "Required": "必須", "Status": "状態", "Actions": "操作",
    "All equipment types": "全設備タイプ", "Select equipment type": "設備タイプを選択", "Sort Order": "表示順", "Yes": "はい", "No": "いいえ", "Back": "戻る", "Close": "閉じる", "Add New": "新規追加",
    "Save Specifications": "仕様を保存", "No specifications are configured for this equipment type.": "この設備タイプには仕様が設定されていません。", "No specifications.": "仕様がありません。",
    "Search by machine code or name...": "機械コードまたは名称で検索...", "of total": "全体比", "Not set": "未入力", "Delete": "削除", "Edit": "編集", "View": "表示",
    "Machine Code": "機械コード", "Machine Name": "機械名", "Area / Line": "エリア / ライン", "Install Date": "設置日", "Edit machine": "機械を編集", "Edit specifications": "仕様を編集", "Toggle Running / Idle": "稼働 / 待機を切替", "Settings": "設定", "Master Data Configuration": "マスターデータ設定",
  },
};
export function tx(text) { const lang = String(activeLanguage || "en").split("-")[0]; return UI_TEXT[lang]?.[text] || text; }
export function statusText(value) { const labels = { vi: { UNKNOWN: "Chưa xác định", RUNNING: "Đang chạy", IDLE: "Chờ", DOWN: "Dừng máy", MAINTENANCE: "Bảo trì", OFFLINE: "Mất kết nối", DRAFT: "Nháp", ACTIVE: "Hoạt động", INACTIVE: "Không hoạt động", RETIRED: "Ngừng sử dụng", SCRAPPED: "Thanh lý" }, ja: { UNKNOWN: "不明", RUNNING: "稼働中", IDLE: "待機中", DOWN: "停止中", MAINTENANCE: "保守中", OFFLINE: "オフライン", DRAFT: "下書き", ACTIVE: "有効", INACTIVE: "無効", RETIRED: "廃止", SCRAPPED: "廃棄" } }; const lang = String(activeLanguage || "en").split("-")[0]; return labels[lang]?.[value] || value; }

