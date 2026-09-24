let activeLanguage = "en";
export function setActiveLanguage(language) { activeLanguage = language; }
export const UI_TEXT = {
  vi: {
    "Measuring Equipment Master": "Danh mục thiết bị đo lường", "Manage all measuring and inspection equipment in the system": "Quản lý tập trung thiết bị đo và kiểm tra chất lượng trong hệ thống",
    "Add New Equipment": "Thêm thiết bị", "Settings": "Cài đặt", "Equipment Types": "Loại thiết bị",
    "Total Equipment": "Tổng thiết bị", "All equipment": "Tất cả thiết bị", "In Use": "Đang sử dụng", "Available": "Sẵn sàng",
    "Calibration Due Soon": "Sắp đến hạn hiệu chuẩn", "Calibration Overdue": "Quá hạn hiệu chuẩn", "Out of Use": "Ngừng sử dụng", "of total": "trên tổng số",
    "Search by equipment code or name...": "Tìm theo mã hoặc tên thiết bị...", "All Types": "Tất cả loại", "All Status": "Tất cả trạng thái",
    "All Calibration Status": "Tất cả trạng thái hiệu chuẩn", "All Manufacturers": "Tất cả nhà sản xuất", "Clear": "Xóa bộ lọc",
    "Equipment Hierarchy": "Cây thiết bị", "All categories": "Tất cả nhóm", "All locations": "Tất cả vị trí", "Equipment List": "Danh sách thiết bị", "Equipment Detail": "Chi tiết thiết bị",
    "General": "Thông tin chung", "Specification": "Thông số", "Calibration History": "Lịch sử hiệu chuẩn", "Select equipment to view details.": "Chọn một thiết bị để xem chi tiết.",
    "Equipment Code": "Mã thiết bị", "Equipment Name": "Tên thiết bị", "Equipment Type": "Loại thiết bị", "Category": "Nhóm loại", "Location": "Vị trí",
    "Manufacturer": "Nhà sản xuất", "Model": "Model", "Serial Number": "Số sê-ri", "Measurement Range": "Dải đo", "Resolution": "Độ phân giải",
    "Accuracy": "Độ chính xác", "Calibration Cycle (days)": "Chu kỳ hiệu chuẩn (ngày)", "Last Calibration Date": "Ngày hiệu chuẩn gần nhất",
    "Next Calibration Date": "Ngày đến hạn hiệu chuẩn", "Status": "Trạng thái", "Description": "Mô tả", "Image": "Ảnh minh họa", "Code": "Mã", "Name": "Tên",
    "Sort Order": "Thứ tự", "Actions": "Thao tác", "Cancel": "Hủy", "Save": "Lưu", "Close": "Đóng", "Back": "Quay lại", "Edit": "Sửa", "View": "Xem",
    "Delete": "Xóa", "Add New": "Thêm mới", "Not set": "Chưa nhập", "Yes": "Có", "No": "Không",
    "Edit Equipment": "Sửa thiết bị", "Add New Measuring Equipment": "Thêm thiết bị đo lường",
    "Edit equipment": "Sửa thiết bị", "Toggle Available / In Use": "Chuyển Sẵn sàng / Đang sử dụng", "View calibration history": "Xem lịch sử hiệu chuẩn",
    "Calibration Date": "Ngày hiệu chuẩn", "Result": "Kết quả", "Calibrated By": "Người/đơn vị hiệu chuẩn", "Certificate No.": "Số chứng chỉ", "Remark": "Ghi chú",
    "Add Calibration Record": "Thêm lần hiệu chuẩn", "No calibration records yet.": "Chưa có dữ liệu hiệu chuẩn.",
    "This equipment has never been calibrated.": "Thiết bị này chưa từng được hiệu chuẩn.",
    "Master Data Configuration": "Cấu hình danh mục", "Select a category to view its details.": "Chọn một nhóm để xem chi tiết.",
    "Equipment saved.": "Đã lưu thiết bị.", "Status updated.": "Đã cập nhật trạng thái.", "Calibration record saved.": "Đã lưu dữ liệu hiệu chuẩn.",
    "Equipment has calibration data; set it Inactive instead.": "Thiết bị đã có dữ liệu hiệu chuẩn; hãy chuyển sang Ngừng sử dụng thay vì xóa.",
    "This record was changed by someone else. Please reload and try again.": "Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang và thử lại.",
    "Are you sure you want to delete this item?": "Bạn có chắc muốn xóa mục này không?",
  },
  ja: {
    "Measuring Equipment Master": "測定器マスター", "Manage all measuring and inspection equipment in the system": "システム内の測定・検査機器を一元管理します",
    "Add New Equipment": "測定器を追加", "Settings": "設定", "Equipment Types": "測定器タイプ",
    "Total Equipment": "測定器総数", "All equipment": "全測定器", "In Use": "使用中", "Available": "利用可能",
    "Calibration Due Soon": "校正期限間近", "Calibration Overdue": "校正期限超過", "Out of Use": "使用停止", "of total": "全体比",
    "Search by equipment code or name...": "機器コードまたは名称で検索...", "All Types": "全タイプ", "All Status": "全状態",
    "All Calibration Status": "全校正状態", "All Manufacturers": "全メーカー", "Clear": "クリア",
    "Equipment Hierarchy": "測定器階層", "All categories": "全カテゴリ", "All locations": "全設置場所", "Equipment List": "測定器一覧", "Equipment Detail": "測定器詳細",
    "General": "基本情報", "Specification": "仕様", "Calibration History": "校正履歴", "Select equipment to view details.": "測定器を選択して詳細を表示してください。",
    "Equipment Code": "機器コード", "Equipment Name": "機器名", "Equipment Type": "測定器タイプ", "Category": "カテゴリ", "Location": "設置場所",
    "Manufacturer": "メーカー", "Model": "モデル", "Serial Number": "シリアル番号", "Measurement Range": "測定範囲", "Resolution": "分解能",
    "Accuracy": "精度", "Calibration Cycle (days)": "校正周期（日）", "Last Calibration Date": "前回校正日",
    "Next Calibration Date": "校正期限日", "Status": "状態", "Description": "説明", "Image": "画像", "Code": "コード", "Name": "名称",
    "Sort Order": "表示順", "Actions": "操作", "Cancel": "キャンセル", "Save": "保存", "Close": "閉じる", "Back": "戻る", "Edit": "編集", "View": "表示",
    "Delete": "削除", "Add New": "新規追加", "Not set": "未入力", "Yes": "はい", "No": "いいえ",
    "Edit Equipment": "測定器を編集", "Add New Measuring Equipment": "測定器を追加",
    "Edit equipment": "測定器を編集", "Toggle Available / In Use": "利用可能 / 使用中を切替", "View calibration history": "校正履歴を表示",
    "Calibration Date": "校正日", "Result": "結果", "Calibrated By": "校正実施者", "Certificate No.": "証明書番号", "Remark": "備考",
    "Add Calibration Record": "校正記録を追加", "No calibration records yet.": "校正記録がありません。",
    "This equipment has never been calibrated.": "この機器はまだ校正されていません。",
    "Master Data Configuration": "マスターデータ設定", "Select a category to view its details.": "カテゴリを選択すると詳細が表示されます。",
    "Equipment saved.": "機器を保存しました。", "Status updated.": "状態を更新しました。", "Calibration record saved.": "校正記録を保存しました。",
    "Equipment has calibration data; set it Inactive instead.": "この機器には校正データがあります。削除の代わりに無効にしてください。",
    "This record was changed by someone else. Please reload and try again.": "他のユーザーによってデータが変更されました。再読み込みしてもう一度お試しください。",
    "Are you sure you want to delete this item?": "削除してもよろしいですか？",
  },
};
export function tx(text) {
  const lang = String(activeLanguage || "en").split("-")[0];
  return UI_TEXT[lang]?.[text] || text;
}

const STATUS_LABELS = {
  vi: { AVAILABLE: "Sẵn sàng", IN_USE: "Đang sử dụng", OUT_OF_SERVICE: "Ngừng hoạt động", INACTIVE: "Không hoạt động",
        PASS: "Đạt", FAIL: "Không đạt", ADJUSTED: "Đã hiệu chỉnh",
        VALID: "Còn hiệu lực", DUE_SOON: "Sắp đến hạn", OVERDUE: "Quá hạn" },
  ja: { AVAILABLE: "利用可能", IN_USE: "使用中", OUT_OF_SERVICE: "使用停止", INACTIVE: "無効",
        PASS: "合格", FAIL: "不合格", ADJUSTED: "調整済み",
        VALID: "有効", DUE_SOON: "期限間近", OVERDUE: "期限超過" },
  en: { AVAILABLE: "Available", IN_USE: "In Use", OUT_OF_SERVICE: "Out of Service", INACTIVE: "Inactive",
        PASS: "Pass", FAIL: "Fail", ADJUSTED: "Adjusted",
        VALID: "Valid", DUE_SOON: "Due Soon", OVERDUE: "Overdue" },
};
export function statusText(value) {
  const lang = String(activeLanguage || "en").split("-")[0];
  return STATUS_LABELS[lang]?.[value] || STATUS_LABELS.en[value] || value || "—";
}

const CATEGORY_LABELS = {
  vi: { DIMENSIONAL: "Đo kích thước", ELECTRICAL: "Điện", PHYSICAL_TEST: "Thử nghiệm cơ lý", VISION_OPTICAL: "Quang học / Hình ảnh", OTHER: "Khác" },
  ja: { DIMENSIONAL: "寸法測定", ELECTRICAL: "電気", PHYSICAL_TEST: "物理試験", VISION_OPTICAL: "光学・画像", OTHER: "その他" },
  en: { DIMENSIONAL: "Dimension Equipment", ELECTRICAL: "Electrical Equipment", PHYSICAL_TEST: "Physical Test Equipment", VISION_OPTICAL: "Vision / Optical Equipment", OTHER: "Others" },
};
export function categoryText(value) {
  const lang = String(activeLanguage || "en").split("-")[0];
  return CATEGORY_LABELS[lang]?.[value] || CATEGORY_LABELS.en[value] || value || "—";
}
