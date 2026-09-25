let activeLanguage = "en";
export function setActiveLanguage(language) { activeLanguage = language; }
export const UI_TEXT = {
  vi: {
    "Quality Standard Master": "Danh mục tiêu chuẩn chất lượng",
    "Manage all quality standards, inspection criteria and acceptance rules in the system": "Quản lý tập trung tiêu chuẩn chất lượng, tiêu chí và giới hạn kiểm tra trong hệ thống",
    "Add New Standard": "Thêm tiêu chuẩn", "Settings": "Cài đặt",
    "Total Standards": "Tổng số tiêu chuẩn", "Active Standards": "Đang áp dụng", "Pending Approval": "Chờ duyệt",
    "Obsolete": "Đã lỗi thời", "New Revision": "Revision mới", "of total": "trên tổng số",
    "Search by standard code or name...": "Tìm theo mã hoặc tên tiêu chuẩn...",
    "All Products": "Tất cả sản phẩm", "All Customers": "Tất cả khách hàng", "All Processes": "Tất cả công đoạn",
    "All Status": "Tất cả trạng thái", "Clear": "Xóa bộ lọc",
    "Standard Hierarchy": "Cây tiêu chuẩn", "All standards": "Tất cả tiêu chuẩn",
    "Standard List": "Danh sách tiêu chuẩn", "Standard Detail": "Chi tiết tiêu chuẩn",
    "General": "Thông tin chung", "Characteristics": "Đặc tính kiểm tra", "History": "Lịch sử",
    "Select a standard to view details.": "Chọn một tiêu chuẩn để xem chi tiết.",
    "Standard Code": "Mã tiêu chuẩn", "Standard Name": "Tên tiêu chuẩn", "Product": "Sản phẩm", "Customer": "Khách hàng",
    "Process": "Công đoạn", "Revision": "Revision", "Status": "Trạng thái", "Effective Date": "Ngày hiệu lực",
    "Remark": "Ghi chú", "Submitted By": "Người gửi duyệt", "Submitted At": "Ngày gửi duyệt",
    "Approved By": "Người duyệt", "Approved At": "Ngày duyệt", "Updated": "Cập nhật", "Actions": "Thao tác",
    "Characteristic Name": "Tên đặc tính", "Nominal Value": "Giá trị danh nghĩa", "LSL": "LSL", "USL": "USL",
    "Unit": "Đơn vị", "Inspection Method": "Phương pháp kiểm tra", "Measuring Equipment Type": "Loại thiết bị đo",
    "Inspection Frequency": "Tần suất kiểm tra", "Characteristic Type": "Loại đặc tính", "Variable (measured)": "Định lượng (đo)", "Attribute (OK / NG)": "Định tính (OK / NG)", "SPC Monitoring": "Giám sát SPC", "Control Chart": "Biểu đồ kiểm soát", "Subgroup Size": "Cỡ nhóm mẫu", "Cpk Target": "Cpk mục tiêu", "Critical Characteristic": "Đặc tính quan trọng", "Yes": "Có", "No": "Không", "Add Characteristic": "Thêm đặc tính", "No characteristics yet.": "Chưa có đặc tính nào.",
    "Cancel": "Hủy", "Save": "Lưu", "Close": "Đóng", "Back": "Quay lại", "Edit": "Sửa", "View": "Xem", "Delete": "Xóa",
    "Add New Standard Dialog": "Thêm tiêu chuẩn", "Edit Standard": "Sửa tiêu chuẩn (Draft)",
    "Submit for Approval": "Gửi duyệt", "Approve": "Duyệt", "Reject": "Từ chối", "Activate": "Kích hoạt",
    "Mark Obsolete": "Chuyển lỗi thời", "New Revision Action": "Tạo Revision mới", "Copy Standard": "Sao chép tiêu chuẩn",
    "New Standard Code": "Mã tiêu chuẩn mới", "Confirm": "Xác nhận",
    "Are you sure you want to create a new revision from the current one?": "Bạn có chắc muốn tạo Revision mới từ Revision hiện tại?",
    "Rejection reason (required)": "Lý do từ chối (bắt buộc)",
    "Standard saved.": "Đã lưu tiêu chuẩn.", "Status updated.": "Đã cập nhật trạng thái.",
    "New revision created.": "Đã tạo Revision mới.", "Standard copied.": "Đã sao chép tiêu chuẩn.",
    "This record was changed by someone else. Please reload and try again.": "Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang và thử lại.",
    "Are you sure you want to delete this item?": "Bạn có chắc muốn xóa mục này không?",
    "All Revisions": "Tất cả Revision", "Audit Log": "Nhật ký thao tác", "Action": "Hành động", "By": "Bởi", "At": "Lúc",
  },
  ja: {
    "Quality Standard Master": "品質標準マスター",
    "Manage all quality standards, inspection criteria and acceptance rules in the system": "システム内の品質標準、検査基準、判定ルールを一元管理します",
    "Add New Standard": "標準を追加", "Settings": "設定",
    "Total Standards": "標準総数", "Active Standards": "適用中", "Pending Approval": "承認待ち",
    "Obsolete": "廃止", "New Revision": "新改訂", "of total": "全体比",
    "Search by standard code or name...": "標準コードまたは名称で検索...",
    "All Products": "全製品", "All Customers": "全顧客", "All Processes": "全工程",
    "All Status": "全状態", "Clear": "クリア",
    "Standard Hierarchy": "標準階層", "All standards": "全標準",
    "Standard List": "標準一覧", "Standard Detail": "標準詳細",
    "General": "基本情報", "Characteristics": "検査特性", "History": "履歴",
    "Select a standard to view details.": "標準を選択して詳細を表示してください。",
    "Standard Code": "標準コード", "Standard Name": "標準名", "Product": "製品", "Customer": "顧客",
    "Process": "工程", "Revision": "改訂", "Status": "状態", "Effective Date": "発効日",
    "Remark": "備考", "Submitted By": "申請者", "Submitted At": "申請日時",
    "Approved By": "承認者", "Approved At": "承認日時", "Updated": "更新", "Actions": "操作",
    "Characteristic Name": "特性名", "Nominal Value": "公称値", "LSL": "下限規格", "USL": "上限規格",
    "Unit": "単位", "Inspection Method": "検査方法", "Measuring Equipment Type": "測定器タイプ",
    "Inspection Frequency": "検査頻度", "Characteristic Type": "特性種別", "Variable (measured)": "計量値", "Attribute (OK / NG)": "計数値 (OK / NG)", "SPC Monitoring": "SPC監視", "Control Chart": "管理図", "Subgroup Size": "サブグループサイズ", "Cpk Target": "Cpk目標", "Critical Characteristic": "重要特性", "Yes": "はい", "No": "いいえ", "Add Characteristic": "特性を追加", "No characteristics yet.": "特性がまだありません。",
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
