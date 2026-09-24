let activeLanguage = "en";
export function setActiveLanguage(language) { activeLanguage = language; }
export const UI_TEXT = {
  vi: {
    "Process Parameter Standard": "Tiêu chuẩn thông số công nghệ",
    "Manage standard process parameters for machines, molds, materials and products": "Quản lý bộ thông số công nghệ tiêu chuẩn cho máy, khuôn, vật liệu và sản phẩm",
    "Add New Standard": "Thêm bộ thông số", "Settings": "Cài đặt",
    "Total Standards": "Tổng số bộ thông số", "Active Standards": "Đang áp dụng", "Products": "Sản phẩm",
    "Processes": "Công đoạn", "Machine Types": "Loại máy", "Parameter Items": "Thông số kỹ thuật", "of total": "trên tổng số",
    "Search by standard code or name...": "Tìm theo mã hoặc tên bộ thông số...",
    "All Products": "Tất cả sản phẩm", "All Processes": "Tất cả công đoạn", "All Machine Types": "Tất cả loại máy",
    "All Materials": "Tất cả vật liệu", "All Status": "Tất cả trạng thái", "Clear": "Xóa bộ lọc",
    "Standard Hierarchy": "Cây bộ thông số", "All standards": "Tất cả bộ thông số",
    "Standard List": "Danh sách bộ thông số", "Standard Detail": "Chi tiết bộ thông số",
    "General": "Thông tin chung", "History": "Lịch sử",
    "Select a standard to view details.": "Chọn một bộ thông số để xem chi tiết.",
    "Standard Code": "Mã bộ thông số", "Standard Name": "Tên bộ thông số", "Product": "Sản phẩm", "Mold": "Khuôn",
    "Machine Type": "Loại máy", "Material": "Vật liệu", "Process": "Công đoạn", "Revision": "Revision",
    "Status": "Trạng thái", "Effective Date": "Ngày hiệu lực", "Remark": "Ghi chú",
    "Submitted By": "Người gửi duyệt", "Submitted At": "Ngày gửi duyệt", "Approved By": "Người duyệt",
    "Approved At": "Ngày duyệt", "Updated": "Cập nhật", "Actions": "Thao tác",
    "Parameter Name": "Tên thông số", "Min Value": "Giá trị nhỏ nhất", "Target Value": "Giá trị mục tiêu",
    "Max Value": "Giá trị lớn nhất", "Unit": "Đơn vị", "Add Parameter": "Thêm thông số", "No parameters yet.": "Chưa có thông số nào.",
    "Cancel": "Hủy", "Save": "Lưu", "Close": "Đóng", "Back": "Quay lại", "Edit": "Sửa", "View": "Xem", "Delete": "Xóa",
    "Add New Standard Dialog": "Thêm bộ thông số", "Edit Standard": "Sửa bộ thông số (Draft)",
    "Submit for Approval": "Gửi duyệt", "Approve": "Duyệt", "Reject": "Từ chối", "Activate": "Kích hoạt",
    "Mark Obsolete": "Chuyển lỗi thời", "New Revision Action": "Tạo Revision mới", "Copy Standard": "Sao chép bộ thông số",
    "New Standard Code": "Mã bộ thông số mới", "Confirm": "Xác nhận",
    "Are you sure you want to create a new revision from the current one?": "Bạn có chắc muốn tạo Revision mới từ Revision hiện tại?",
    "Rejection reason (required)": "Lý do từ chối (bắt buộc)",
    "Standard saved.": "Đã lưu bộ thông số.", "Status updated.": "Đã cập nhật trạng thái.",
    "New revision created.": "Đã tạo Revision mới.", "Standard copied.": "Đã sao chép bộ thông số.",
    "This record was changed by someone else. Please reload and try again.": "Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang và thử lại.",
    "Are you sure you want to delete this item?": "Bạn có chắc muốn xóa mục này không?",
    "All Revisions": "Tất cả Revision", "Audit Log": "Nhật ký thao tác", "Action": "Hành động", "By": "Bởi", "At": "Lúc",
  },
  ja: {
    "Process Parameter Standard": "工程パラメータ標準",
    "Manage standard process parameters for machines, molds, materials and products": "機械、金型、材料、製品の標準工程パラメータを管理します",
    "Add New Standard": "標準を追加", "Settings": "設定",
    "Total Standards": "標準総数", "Active Standards": "適用中", "Products": "製品",
    "Processes": "工程", "Machine Types": "機械タイプ", "Parameter Items": "パラメータ項目", "of total": "全体比",
    "Search by standard code or name...": "標準コードまたは名称で検索...",
    "All Products": "全製品", "All Processes": "全工程", "All Machine Types": "全機械タイプ",
    "All Materials": "全材料", "All Status": "全状態", "Clear": "クリア",
    "Standard Hierarchy": "標準階層", "All standards": "全標準",
    "Standard List": "標準一覧", "Standard Detail": "標準詳細",
    "General": "基本情報", "History": "履歴",
    "Select a standard to view details.": "標準を選択して詳細を表示してください。",
    "Standard Code": "標準コード", "Standard Name": "標準名", "Product": "製品", "Mold": "金型",
    "Machine Type": "機械タイプ", "Material": "材料", "Process": "工程", "Revision": "改訂",
    "Status": "状態", "Effective Date": "発効日", "Remark": "備考",
    "Submitted By": "申請者", "Submitted At": "申請日時", "Approved By": "承認者",
    "Approved At": "承認日時", "Updated": "更新", "Actions": "操作",
    "Parameter Name": "パラメータ名", "Min Value": "最小値", "Target Value": "目標値",
    "Max Value": "最大値", "Unit": "単位", "Add Parameter": "パラメータを追加", "No parameters yet.": "パラメータがまだありません。",
    "Cancel": "キャンセル", "Save": "保存", "Close": "閉じる", "Back": "戻る", "Edit": "編集", "View": "表示", "Delete": "削除",
    "Add New Standard Dialog": "標準を追加", "Edit Standard": "標準を編集（Draft）",
    "Submit for Approval": "承認申請", "Approve": "承認", "Reject": "却下", "Activate": "有効化",
    "Mark Obsolete": "廃止にする", "New Revision Action": "新改訂を作成", "Copy Standard": "標準を複製",
    "New Standard Code": "新しい標準コード", "Confirm": "確認",
    "Are you sure you want to create a new revision from the current one?": "現在の改訂から新しい改訂を作成してもよろしいですか？",
    "Rejection reason (required)": "却下理由（必須）",
    "Standard saved.": "標準を保存しました。", "Status updated.": "状態を更新しました。",
    "New revision created.": "新しい改訂を作成しました。", "Standard copied.": "標準を複製しました。",
    "This record was changed by someone else. Please reload and try again.": "他のユーザーによってデータが変更されました。再読み込みしてもう一度お試しください。",
    "Are you sure you want to delete this item?": "削除してもよろしいですか？",
    "All Revisions": "全改訂", "Audit Log": "監査ログ", "Action": "操作", "By": "実施者", "At": "日時",
  },
};
export function tx(text) {
  const lang = String(activeLanguage || "en").split("-")[0];
  return UI_TEXT[lang]?.[text] || text;
}

const STATUS_LABELS = {
  vi: { DRAFT: "Nháp", PENDING_APPROVAL: "Chờ duyệt", APPROVED: "Đã duyệt", ACTIVE: "Đang áp dụng", OBSOLETE: "Đã lỗi thời" },
  ja: { DRAFT: "下書き", PENDING_APPROVAL: "承認待ち", APPROVED: "承認済み", ACTIVE: "適用中", OBSOLETE: "廃止" },
  en: { DRAFT: "Draft", PENDING_APPROVAL: "Pending Approval", APPROVED: "Approved", ACTIVE: "Active", OBSOLETE: "Obsolete" },
};
export function statusText(value) {
  const lang = String(activeLanguage || "en").split("-")[0];
  return STATUS_LABELS[lang]?.[value] || STATUS_LABELS.en[value] || value || "—";
}
