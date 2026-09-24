let activeLanguage = "en";
export function setActiveLanguage(language) { activeLanguage = language; }
const lang = () => String(activeLanguage || "en").split("-")[0];

export const UI_TEXT = {
  vi: {
    "Production Order List": "Danh sách lệnh sản xuất",
    "Track, prioritise and coordinate every production order across its lifecycle": "Theo dõi, ưu tiên và điều phối toàn bộ lệnh sản xuất trong suốt vòng đời",
    "Refresh": "Làm mới", "Filter": "Bộ lọc", "Advanced Search": "Tìm kiếm nâng cao", "Create Order": "Tạo lệnh",
    "Import Orders": "Nhập lệnh", "Export": "Xuất", "More": "Thêm", "Last Update": "Cập nhật lúc", "Auto Refresh": "Tự làm mới",
    "Total Orders": "Tổng số lệnh", "On Track": "Đúng tiến độ", "At Risk": "Có rủi ro", "Delay": "Chậm tiến độ", "Completed": "Hoàn thành",
    "Total Good Pieces": "Tổng sản phẩm đạt", "today": "hôm nay", "of total": "trên tổng", "Reject": "Lỗi", "Reject rate": "Tỷ lệ lỗi",
    "Production Orders List": "Danh sách lệnh sản xuất", "All Orders": "Tất cả", "Cancelled": "Đã hủy", "Group By": "Nhóm theo", "None": "Không",
    "Customer": "Khách hàng", "Product": "Sản phẩm", "Priority": "Ưu tiên", "Status": "Trạng thái", "Source": "Nguồn",
    "Order No.": "Số lệnh", "Order Qty (PCS)": "SL đặt (PCS)", "Plan Start": "Bắt đầu KH", "Plan End": "Kết thúc KH", "Due Date": "Hạn giao",
    "Progress": "Tiến độ", "Good Pieces": "SL đạt", "Reject Pieces": "SL lỗi", "Action": "Thao tác", "Work Orders": "Work Order",
    "Columns": "Cột hiển thị", "Search order, product, customer...": "Tìm số lệnh, sản phẩm, khách hàng...",
    "Order Detail": "Chi tiết lệnh", "(Selected)": "(đang chọn)", "View Detail": "Xem chi tiết", "Order Quantity": "Số lượng đặt",
    "Select an order to view details.": "Chọn một lệnh để xem chi tiết.", "Unplanned Qty": "SL chưa lập WO", "Source Ref.": "Số tham chiếu",
    "Related Information": "Thông tin liên quan", "Production Execution": "Thực hiện sản xuất", "Quality Result": "Kết quả chất lượng",
    "Material Usage": "Tiêu hao vật tư", "Machine": "Máy",
    "Orders by Status": "Lệnh theo trạng thái", "Orders by Priority": "Lệnh theo ưu tiên", "Top 5 Products by Order Quantity": "Top 5 sản phẩm theo số lượng",
    "Orders by Customer": "Lệnh theo khách hàng", "Total": "Tổng", "Orders": "lệnh", "Others": "Khác",
    "Quick Actions": "Thao tác nhanh", "View Order Detail": "Xem chi tiết lệnh", "Edit Schedule": "Sửa lịch sản xuất",
    "Change Priority": "Đổi ưu tiên", "Cancel Order": "Hủy lệnh", "Copy Order": "Sao chép lệnh", "Edit Order": "Sửa lệnh",
    "Release Order": "Phát hành lệnh", "Complete Order": "Hoàn thành lệnh", "Close Order": "Đóng lệnh", "Delete Order": "Xóa lệnh",
    "Create Work Order": "Tạo Work Order", "Release Selected": "Phát hành các lệnh đã chọn", "Download Import Template": "Tải mẫu nhập",
    "Plant": "Nhà máy", "All": "Tất cả", "Clear": "Xóa lọc", "Apply": "Áp dụng", "Keyword": "Từ khóa",
    "Plan From": "KH từ ngày", "Plan To": "KH đến ngày", "Due From": "Hạn từ", "Due To": "Hạn đến",
    "Order saved.": "Đã lưu lệnh sản xuất.", "Order released.": "Đã phát hành lệnh.", "Order completed.": "Đã hoàn thành lệnh.",
    "Order closed.": "Đã đóng lệnh.", "Order cancelled.": "Đã hủy lệnh.", "Order copied.": "Đã sao chép lệnh.", "Order deleted.": "Đã xóa lệnh.",
    "Priority updated.": "Đã cập nhật ưu tiên.", "Work order saved.": "Đã lưu Work Order.",
    "{n} orders released.": "Đã phát hành {n} lệnh.", "{n} orders imported.": "Đã nhập {n} lệnh.",
    "Cancel Reason": "Lý do hủy", "Reason": "Lý do", "Remark": "Ghi chú", "New Priority": "Ưu tiên mới", "New Order No.": "Số lệnh mới",
    "Leave blank to generate automatically.": "Để trống để hệ thống tự sinh.",
    "Cancelling also cancels the order's unreleased work orders.": "Hủy lệnh sẽ hủy luôn các Work Order chưa phát hành của lệnh.",
    "Complete this order? Remaining quantity will not be produced.": "Hoàn thành lệnh? Phần số lượng còn lại sẽ không được sản xuất.",
    "Close this order?": "Đóng lệnh này?", "Delete this draft order?": "Xóa lệnh nháp này?",
    "Import file (CSV)": "Tệp nhập (CSV)", "Choose File": "Chọn tệp", "rows": "dòng", "Import": "Nhập",
    "Columns: order_no, customer_code, product_code, order_qty, priority, planned_start, planned_end, due_date, source, source_ref, remark": "Cột: order_no, customer_code, product_code, order_qty, priority, planned_start, planned_end, due_date, source, source_ref, remark",
    "Row": "Dòng", "Import rejected. Fix the listed rows and try again.": "Nhập bị từ chối. Hãy sửa các dòng bên dưới và thử lại.",
    "Add Customer": "Thêm khách hàng", "Customer Code": "Mã khách hàng", "Customer Name": "Tên khách hàng", "Short Name": "Tên ngắn",
    "Customer saved.": "Đã lưu khách hàng.", "Cancel": "Hủy bỏ", "Save": "Lưu", "Close": "Đóng", "Confirm": "Xác nhận",
    "History": "Lịch sử", "No data.": "Không có dữ liệu.", "Showing {from} to {to} of {total} orders": "Hiển thị {from}–{to} / {total} lệnh",
    "This record was changed by someone else. Please reload and try again.": "Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại và thử lại.",
  },
  ja: {
    "Production Order List": "製造オーダー一覧",
    "Track, prioritise and coordinate every production order across its lifecycle": "製造オーダーをライフサイクル全体で追跡・優先付け・調整します",
    "Refresh": "更新", "Filter": "フィルター", "Advanced Search": "詳細検索", "Create Order": "オーダー作成",
    "Import Orders": "オーダー取込", "Export": "出力", "More": "その他", "Last Update": "最終更新", "Auto Refresh": "自動更新",
    "Total Orders": "総オーダー", "On Track": "順調", "At Risk": "リスク", "Delay": "遅延", "Completed": "完了",
    "Total Good Pieces": "良品総数", "today": "本日", "of total": "全体比", "Reject": "不良", "Reject rate": "不良率",
    "Production Orders List": "製造オーダー一覧", "All Orders": "すべて", "Cancelled": "取消", "Group By": "グループ", "None": "なし",
    "Customer": "顧客", "Product": "製品", "Priority": "優先度", "Status": "状態", "Source": "発生元",
    "Order No.": "オーダー番号", "Order Qty (PCS)": "受注数 (PCS)", "Plan Start": "計画開始", "Plan End": "計画終了", "Due Date": "納期",
    "Progress": "進捗", "Good Pieces": "良品数", "Reject Pieces": "不良数", "Action": "操作", "Work Orders": "作業オーダー",
    "Columns": "表示列", "Search order, product, customer...": "オーダー・製品・顧客で検索...",
    "Order Detail": "オーダー詳細", "(Selected)": "（選択中）", "View Detail": "詳細を見る", "Order Quantity": "受注数",
    "Select an order to view details.": "オーダーを選択して詳細を表示してください。", "Unplanned Qty": "未計画数", "Source Ref.": "参照番号",
    "Related Information": "関連情報", "Production Execution": "生産実行", "Quality Result": "品質結果",
    "Material Usage": "材料使用", "Machine": "機械",
    "Orders by Status": "状態別オーダー", "Orders by Priority": "優先度別オーダー", "Top 5 Products by Order Quantity": "受注数上位5製品",
    "Orders by Customer": "顧客別オーダー", "Total": "合計", "Orders": "件", "Others": "その他",
    "Quick Actions": "クイック操作", "View Order Detail": "オーダー詳細", "Edit Schedule": "日程編集",
    "Change Priority": "優先度変更", "Cancel Order": "オーダー取消", "Copy Order": "オーダー複製", "Edit Order": "オーダー編集",
    "Release Order": "オーダー発行", "Complete Order": "オーダー完了", "Close Order": "オーダー締め", "Delete Order": "オーダー削除",
    "Create Work Order": "作業オーダー作成", "Release Selected": "選択分を発行", "Download Import Template": "取込テンプレート",
    "Plant": "工場", "All": "すべて", "Clear": "クリア", "Apply": "適用", "Keyword": "キーワード",
    "Plan From": "計画開始日", "Plan To": "計画終了日", "Due From": "納期から", "Due To": "納期まで",
    "Order saved.": "オーダーを保存しました。", "Order released.": "オーダーを発行しました。", "Order completed.": "オーダーを完了しました。",
    "Order closed.": "オーダーを締めました。", "Order cancelled.": "オーダーを取り消しました。", "Order copied.": "オーダーを複製しました。", "Order deleted.": "オーダーを削除しました。",
    "Priority updated.": "優先度を更新しました。", "Work order saved.": "作業オーダーを保存しました。",
    "{n} orders released.": "{n} 件を発行しました。", "{n} orders imported.": "{n} 件を取り込みました。",
    "Cancel Reason": "取消理由", "Reason": "理由", "Remark": "備考", "New Priority": "新しい優先度", "New Order No.": "新しいオーダー番号",
    "Leave blank to generate automatically.": "空欄の場合は自動採番します。",
    "Cancelling also cancels the order's unreleased work orders.": "取消すると未リリースの作業オーダーも取り消されます。",
    "Complete this order? Remaining quantity will not be produced.": "オーダーを完了しますか？残数は生産されません。",
    "Close this order?": "このオーダーを締めますか？", "Delete this draft order?": "この下書きオーダーを削除しますか？",
    "Import file (CSV)": "取込ファイル (CSV)", "Choose File": "ファイル選択", "rows": "行", "Import": "取込",
    "Columns: order_no, customer_code, product_code, order_qty, priority, planned_start, planned_end, due_date, source, source_ref, remark": "列: order_no, customer_code, product_code, order_qty, priority, planned_start, planned_end, due_date, source, source_ref, remark",
    "Row": "行", "Import rejected. Fix the listed rows and try again.": "取込を拒否しました。該当行を修正して再試行してください。",
    "Add Customer": "顧客追加", "Customer Code": "顧客コード", "Customer Name": "顧客名", "Short Name": "略称",
    "Customer saved.": "顧客を保存しました。", "Cancel": "キャンセル", "Save": "保存", "Close": "閉じる", "Confirm": "確認",
    "History": "履歴", "No data.": "データがありません。", "Showing {from} to {to} of {total} orders": "{total} 件中 {from}–{to} を表示",
    "This record was changed by someone else. Please reload and try again.": "他のユーザーによってデータが変更されました。再読み込みしてもう一度お試しください。",
  },
};

export function tx(text, params) {
  const template = UI_TEXT[lang()]?.[text] || text;
  return params ? String(template).replace(/\{(\w+)\}/g, (_, k) => params[k] ?? "") : template;
}

const LABELS = {
  status: {
    en: { DRAFT: "Draft", RELEASED: "Released", SCHEDULING: "Scheduling", IN_PRODUCTION: "In Production", COMPLETED: "Completed", CLOSED: "Closed", CANCELLED: "Cancelled" },
    vi: { DRAFT: "Nháp", RELEASED: "Đã phát hành", SCHEDULING: "Đang lập lịch", IN_PRODUCTION: "Đang sản xuất", COMPLETED: "Hoàn thành", CLOSED: "Đã đóng", CANCELLED: "Đã hủy" },
    ja: { DRAFT: "下書き", RELEASED: "発行済", SCHEDULING: "計画中", IN_PRODUCTION: "生産中", COMPLETED: "完了", CLOSED: "締め", CANCELLED: "取消" },
  },
  progress: {
    en: { ON_TRACK: "On Track", AT_RISK: "At Risk", DELAY: "Delay", COMPLETED: "Completed", NOT_STARTED: "Not Started", CANCELLED: "Cancelled" },
    vi: { ON_TRACK: "Đúng tiến độ", AT_RISK: "Có rủi ro", DELAY: "Chậm", COMPLETED: "Hoàn thành", NOT_STARTED: "Chưa bắt đầu", CANCELLED: "Đã hủy" },
    ja: { ON_TRACK: "順調", AT_RISK: "リスク", DELAY: "遅延", COMPLETED: "完了", NOT_STARTED: "未着手", CANCELLED: "取消" },
  },
  priority: {
    en: { LOW: "Low", MEDIUM: "Medium", HIGH: "High", URGENT: "Urgent" },
    vi: { LOW: "Thấp", MEDIUM: "Trung bình", HIGH: "Cao", URGENT: "Khẩn" },
    ja: { LOW: "低", MEDIUM: "中", HIGH: "高", URGENT: "緊急" },
  },
  source: {
    en: { MANUAL: "Manual", SALES_ORDER: "Sales Order", FORECAST: "Forecast", MRP: "MRP", PLANNING: "Production Plan" },
    vi: { MANUAL: "Nhập tay", SALES_ORDER: "Đơn bán hàng", FORECAST: "Dự báo", MRP: "MRP", PLANNING: "Kế hoạch sản xuất" },
    ja: { MANUAL: "手入力", SALES_ORDER: "受注", FORECAST: "予測", MRP: "MRP", PLANNING: "生産計画" },
  },
  history: {
    en: { CREATE: "Created", UPDATE: "Updated", RELEASE: "Released", COMPLETE: "Completed", CLOSE: "Closed", CANCEL: "Cancelled", PRIORITY: "Priority changed", COPY: "Copied", AUTO_SYNC: "Auto status update" },
    vi: { CREATE: "Tạo mới", UPDATE: "Cập nhật", RELEASE: "Phát hành", COMPLETE: "Hoàn thành", CLOSE: "Đóng", CANCEL: "Hủy", PRIORITY: "Đổi ưu tiên", COPY: "Sao chép", AUTO_SYNC: "Tự cập nhật trạng thái" },
    ja: { CREATE: "作成", UPDATE: "更新", RELEASE: "発行", COMPLETE: "完了", CLOSE: "締め", CANCEL: "取消", PRIORITY: "優先度変更", COPY: "複製", AUTO_SYNC: "自動状態更新" },
  },
};

export function label(group, value) {
  return LABELS[group]?.[lang()]?.[value] || LABELS[group]?.en?.[value] || value || "—";
}

const LOCALE_TAGS = { vi: "vi-VN", ja: "ja-JP", en: "en-US" };
export function localeTag() { return LOCALE_TAGS[lang()] || LOCALE_TAGS.en; }

export const translations = { vi: {}, en: {}, ja: {} };
export default translations;
