import { UI_TEXT as WO_TEXT, localeTag, setActiveLanguage as setWoLanguage } from "../ProductionManagement/WorkOrders/WorkOrderManagement/woLocales";

let activeLanguage = "en";
export function setActiveLanguage(language) { activeLanguage = language; setWoLanguage(language); }
const lang = () => String(activeLanguage || "en").split("-")[0];

const VI = {
  "Product Traceability": "Truy xuất sản phẩm", "Material Traceability": "Truy xuất nguyên liệu", "Lot Genealogy": "Phả hệ lô",
  "A product lot is one work order × production date × shift.": "Mỗi lô thành phẩm = 1 Work Order × ngày sản xuất × ca.", "Advanced Search": "Tìm kiếm nâng cao",
  "Available Qty": "SL khả dụng", "Avg. Trace Time": "Thời gian truy xuất TB", "Balance": "Tồn sau GD", "Cavity": "Cavity",
  "Choose a material lot, product lot, work order, machine or mold, then Search.": "Chọn lô nguyên liệu, lô thành phẩm, Work Order, máy hoặc khuôn rồi bấm Tìm kiếm.",
  "Click a node of the map.": "Bấm vào một nút trên sơ đồ.", "Click: details · double-click: open": "Bấm: xem chi tiết · bấm đúp: mở màn hình", "Close": "Đóng",
  "Collapse All": "Thu gọn", "Consumed": "Tiêu thụ", "Created By": "Người tạo", "Created Date": "Ngày tạo", "Current Stock": "Tồn kho hiện tại", "Customer": "Khách hàng",
  "Customers": "Khách hàng", "Customers affected": "Khách hàng liên quan", "Data / Value": "Dữ liệu / giá trị", "Date / Time": "Ngày / giờ", "Detail": "Chi tiết", "Details": "Nội dung",
  "Enter a material lot, material code or supplier lot to trace.": "Nhập lô nguyên liệu, mã nguyên liệu hoặc lô nhà cung cấp để truy xuất.",
  "Enter a product lot, barcode or work order to trace.": "Nhập lô thành phẩm, barcode hoặc Work Order để truy xuất.", "Expand All": "Mở rộng", "Expiry Date": "Hạn sử dụng",
  "Export Report": "Xuất báo cáo", "Finished Products": "Thành phẩm", "First Used": "Dùng lần đầu", "Forward Trace": "Truy xuất xuôi", "Forward Trace Lots": "Lô thành phẩm liên quan",
  "Forward trace shows every work order and product lot that used the lot.": "Truy xuất xuôi hiển thị mọi Work Order và lô thành phẩm đã dùng lô này.", "From → To": "Từ → đến",
  "Full Screen": "Toàn màn hình", "Good Qty": "SL đạt", "Good Qty (pcs)": "SL đạt (sp)", "History": "Lịch sử", "Hold Reason": "Lý do giữ", "In Production": "Đang ở sản xuất",
  "Info Flow": "Luồng thông tin", "Inspection History": "Lịch sử kiểm tra", "Inspector": "Người kiểm tra", "Key Information": "Thông tin chính", "Keyword": "Từ khóa",
  "Last Updated": "Cập nhật", "Lot / Code / Barcode": "Lô / mã / barcode", "Lot Genealogy Map": "Sơ đồ phả hệ lô", "Lot Information": "Thông tin lô", "Lot No. / Code": "Số lô / mã",
  "Lot Relationship Statistics": "Thống kê quan hệ lô", "Lots with Open NG": "Lô có NG đang mở", "Machine": "Máy", "Machines": "Máy", "Material": "Nguyên liệu", "Material Code": "Mã nguyên liệu",
  "Material Flow": "Luồng nguyên liệu", "Material Group": "Nhóm nguyên liệu", "Material History": "Lịch sử nguyên liệu", "Material Journey (Backward & Forward Traceability)": "Hành trình nguyên liệu (truy xuất ngược & xuôi)",
  "Material Lot": "Lô nguyên liệu", "Material Lot Detail": "Chi tiết lô nguyên liệu", "Material Lot No.": "Số lô nguyên liệu", "Material Lots": "Lô nguyên liệu", "Material Name": "Tên nguyên liệu",
  "Material Trace": "Truy xuất nguyên liệu", "Material Usage Details": "Chi tiết sử dụng nguyên liệu", "Materials Traced (Today)": "Nguyên liệu đã truy xuất (hôm nay)", "Mold": "Khuôn", "Molds": "Khuôn",
  "New Search": "Tìm mới", "New Trace": "Truy xuất mới", "No data.": "Không có dữ liệu.", "No image in Product / Mold Master": "Chưa có ảnh trong danh mục Sản phẩm / Khuôn",
  "No incoming inspection recorded for this lot.": "Lô này chưa có kiểm tra đầu vào.", "No lot selected.": "Chưa chọn lô.", "No material lot found for this key.": "Không tìm thấy lô nguyên liệu.",
  "No product lot found for this key.": "Không tìm thấy lô thành phẩm.", "Not available yet": "Chưa có", "Not found": "Không tìm thấy", "Not integrated": "Chưa tích hợp",
  "Nothing found for this key.": "Không tìm thấy dữ liệu.", "Open Lot Genealogy": "Mở phả hệ lô", "Open detail": "Mở chi tiết", "Operator": "Người vận hành", "Operator / Source": "Người thực hiện / nguồn",
  "Packing & shipping is not integrated with the MES yet. Customer from the production order": "Đóng gói & xuất hàng chưa tích hợp vào MES. Khách hàng theo lệnh sản xuất",
  "Plan / NG": "Kế hoạch / NG", "Print Report": "In báo cáo", "Process Flow": "Luồng sản xuất", "Process History": "Lịch sử sản xuất", "Process Step": "Công đoạn", "Product": "Sản phẩm",
  "Product Code": "Mã sản phẩm", "Product Images": "Hình ảnh sản phẩm", "Product Lot": "Lô thành phẩm", "Product Lot No.": "Số lô thành phẩm", "Product Lots": "Lô thành phẩm", "Product Name": "Tên sản phẩm",
  "Product Trace": "Truy xuất sản phẩm", "Production Date": "Ngày sản xuất", "Production Order": "Lệnh sản xuất", "Products Traced (Today)": "Sản phẩm đã truy xuất (hôm nay)",
  "QC & Inspection": "QC & kiểm tra", "Qty": "SL", "Qty Used": "SL sử dụng", "Qty Used (WO)": "SL dùng (theo WO)", "Quality": "Chất lượng", "Quantity": "Số lượng", "Quick Actions": "Thao tác nhanh",
  "Recall Ready": "Sẵn sàng thu hồi", "Received Date": "Ngày nhận", "Related Documents": "Tài liệu liên quan", "Related Statistics": "Thống kê liên quan", "Result": "Kết quả", "Return to WH": "Trả lại kho",
  "Samples": "Mẫu", "Scrap": "Phế phẩm", "Scrap / Waste (est.)": "Phế phẩm (ước tính)", "Search": "Tìm kiếm", "Search & Filter": "Tìm kiếm & lọc", "Search By": "Tìm theo", "Search Tips": "Gợi ý tìm kiếm",
  "Search by material lot no., material code, barcode / QR, supplier lot or supplier.": "Tìm theo số lô, mã nguyên liệu, barcode / QR, lô nhà cung cấp hoặc nhà cung cấp.",
  "Search by product lot no., barcode / QR (= lot no.), work order or production order.": "Tìm theo số lô thành phẩm, barcode / QR (= số lô), Work Order hoặc lệnh sản xuất.",
  "Shift": "Ca", "Shipment History": "Lịch sử xuất hàng", "Shipment data is not integrated yet: customers come from the production orders.": "Dữ liệu xuất hàng chưa tích hợp: khách hàng lấy theo lệnh sản xuất.",
  "Shipped Qty": "SL đã xuất", "Show Forward Trace": "Hiện truy xuất xuôi", "Source": "Nguồn", "Stock Movement": "Biến động kho", "Storage Location": "Vị trí lưu kho", "Summary (Forward Trace)": "Tổng hợp (truy xuất xuôi)",
  "Supplier": "Nhà cung cấp", "Supplier Lot": "Lô NCC", "Supplier Lot No.": "Số lô NCC", "Time": "Thời gian", "Time (s)": "Thời gian (s)", "Total": "Tổng", "Total Consumed": "Tổng tiêu thụ",
  "Total Finished Qty": "Tổng thành phẩm", "Total Genealogies (Today)": "Số lần tra phả hệ (hôm nay)", "Total Qty": "Tổng SL", "Total Received": "Tổng nhập", "Total Traces (Today)": "Số lần truy xuất (hôm nay)",
  "Total Usage": "Tổng sử dụng", "Trace Detail": "Chi tiết truy xuất", "Trace Details": "Chi tiết truy xuất", "Trace Direction": "Chiều truy xuất", "Trace History": "Lịch sử truy xuất",
  "Trace Result Summary": "Tóm tắt kết quả truy xuất", "Trace Success Rate": "Tỷ lệ truy xuất thành công", "Trace Success Rate (Today)": "Tỷ lệ truy xuất thành công (hôm nay)", "Trace Timeline": "Dòng thời gian",
  "Transaction": "Giao dịch", "Type": "Loại", "Unit": "Đơn vị", "Usage in Production": "Sử dụng trong sản xuất", "User": "Người dùng", "Warehouse": "Kho", "Work Order": "Work Order", "Work Orders": "Work Order",
  "from": "từ", "lots used in production": "lô đã dùng cho sản xuất", "lots with a complete chain": "lô có chuỗi đầy đủ", "product lots in system": "lô thành phẩm trong hệ thống",
  "quality issue not closed": "vấn đề chất lượng chưa đóng", "search a material lot": "tìm một lô nguyên liệu", "today": "hôm nay", "used in production": "đã dùng cho sản xuất", "vs yesterday": "so với hôm qua",
  "with output": "có sản lượng", "yesterday": "hôm qua", "{n} lots match": "{n} lô phù hợp",
};

const JA = {
  "Product Traceability": "製品トレーサビリティ", "Material Traceability": "材料トレーサビリティ", "Lot Genealogy": "ロット系譜", "Search": "検索", "Search By": "検索条件", "Close": "閉じる",
  "Product Lot": "製品ロット", "Material Lot": "材料ロット", "Work Order": "作業指示", "Machine": "機械", "Mold": "金型", "Supplier": "仕入先", "Customer": "顧客", "Quality": "品質",
  "Trace Timeline": "タイムライン", "Related Documents": "関連文書", "Quick Actions": "クイック操作", "Not integrated": "未連携", "No data.": "データなし。", "History": "履歴",
  "New Trace": "新規トレース", "Export Report": "レポート出力", "Print Report": "印刷", "Lot Genealogy Map": "ロット系譜マップ", "Lot Information": "ロット情報", "Expand All": "すべて展開",
  "Collapse All": "すべて折りたたむ", "Full Screen": "全画面", "Trace Direction": "トレース方向", "Recall Ready": "リコール準備", "Avg. Trace Time": "平均トレース時間", "today": "本日", "yesterday": "昨日",
};

const TEXT = { vi: VI, ja: JA };

export function tx(text, params) {
  const template = TEXT[lang()]?.[text] || WO_TEXT[lang()]?.[text] || text;
  return params ? String(template).replace(/\{(\w+)\}/g, (_, k) => params[k] ?? "") : template;
}

const L = (en, vi, ja = {}) => ({ en, vi, ja });

const LABELS = {
  searchBy: L({ LOT: "Lot No.", BARCODE: "Barcode", QR: "QR Code", SERIAL: "Serial No.", WO: "Work Order", ORDER: "Production Order", CODE: "Material Code", SUPPLIER_LOT: "Supplier Lot No.",
    SUPPLIER: "Supplier", MATERIAL_LOT: "Material Lot No.", PRODUCT_LOT: "Product Lot No.", MACHINE: "Machine", MOLD: "Mold" },
    { LOT: "Số lô", BARCODE: "Barcode", QR: "Mã QR", SERIAL: "Số serial", WO: "Work Order", ORDER: "Lệnh sản xuất", CODE: "Mã nguyên liệu", SUPPLIER_LOT: "Số lô NCC",
      SUPPLIER: "Nhà cung cấp", MATERIAL_LOT: "Lô nguyên liệu", PRODUCT_LOT: "Lô thành phẩm", MACHINE: "Máy", MOLD: "Khuôn" }),
  node: L({ PRODUCT: "Finished Product", INSPECTION: "Inspection", PRODUCTION: "Production", MACHINE: "Machine", MOLD: "Mold", MATERIAL: "Material", SUPPLIER: "Supplier", IQC: "Incoming IQC",
    WAREHOUSE: "Warehouse", DRYING: "Drying", FINISHED: "Finished Products" },
    { PRODUCT: "Thành phẩm", INSPECTION: "Kiểm tra", PRODUCTION: "Sản xuất", MACHINE: "Máy", MOLD: "Khuôn", MATERIAL: "Nguyên liệu", SUPPLIER: "Nhà cung cấp", IQC: "Kiểm tra đầu vào",
      WAREHOUSE: "Kho", DRYING: "Sấy", FINISHED: "Thành phẩm" }),
  col: L({ SUPPLIER: "Supplier", MATERIAL: "Material", MACHINE: "Machine", PRODUCTION: "Production", INSPECTION: "Inspection", PRODUCT: "Finished Product", SHIPMENT: "Shipment" },
    { SUPPLIER: "Nhà cung cấp", MATERIAL: "Nguyên liệu", MACHINE: "Máy", PRODUCTION: "Sản xuất", INSPECTION: "Kiểm tra", PRODUCT: "Thành phẩm", SHIPMENT: "Xuất hàng" }),
  direction: L({ BOTH: "Both (backward & forward)", BACKWARD: "Backward", FORWARD: "Forward" }, { BOTH: "Hai chiều (ngược & xuôi)", BACKWARD: "Truy xuất ngược", FORWARD: "Truy xuất xuôi" }),
  status: L({ PASS: "Pass", FAIL: "Fail", HOLD: "Quality hold", PENDING: "Pending", DONE: "Done", NA: "N/A", NOT_REQUIRED: "Not required", IN_STOCK: "In stock", IN_PRODUCTION: "In production",
    ON_HOLD: "On hold", COMPLETED: "Completed", RELEASED: "Released", OK: "OK", NG: "NG", "-": "-" },
    { PASS: "Đạt", FAIL: "Không đạt", HOLD: "Giữ chất lượng", PENDING: "Chờ kiểm", DONE: "Hoàn tất", NA: "Không có", NOT_REQUIRED: "Không yêu cầu", IN_STOCK: "Trong kho", IN_PRODUCTION: "Đang sản xuất",
      ON_HOLD: "Tạm giữ", COMPLETED: "Hoàn thành", RELEASED: "Đã phát hành", OK: "OK", NG: "NG", "-": "-" }),
  lotStatus: L({ OPEN: "In production", CLOSED: "Completed" }, { OPEN: "Đang sản xuất", CLOSED: "Hoàn thành" }),
  matStatus: L({ IN_STOCK: "In stock", HOLD: "Hold", QUARANTINE: "Quarantine", RESERVED: "Reserved", CONSUMED: "Consumed", EXPIRED: "Expired", SCRAPPED: "Scrapped" },
    { IN_STOCK: "Trong kho", HOLD: "Tạm giữ", QUARANTINE: "Chờ kiểm", RESERVED: "Đã giữ chỗ", CONSUMED: "Đã dùng hết", EXPIRED: "Hết hạn", SCRAPPED: "Đã hủy" }),
  matSource: L({ OPENING: "Opening balance", RECEIVING: "Receiving", REGRIND: "Regrind (internal)", PRODUCTION: "Production" }, { OPENING: "Tồn đầu kỳ", RECEIVING: "Nhập mua", REGRIND: "Tái sinh nội bộ", PRODUCTION: "Sản xuất" }),
  step: L({ FINISHED_PRODUCT: "Finished Product", PACKING: "Packing", INSPECTION: "Inspection", PRODUCTION: "Production", MACHINE: "Machine", MOLD: "Mold", MATERIAL: "Material", SUPPLIER: "Supplier" },
    { FINISHED_PRODUCT: "Thành phẩm", PACKING: "Đóng gói", INSPECTION: "Kiểm tra", PRODUCTION: "Sản xuất", MACHINE: "Máy", MOLD: "Khuôn", MATERIAL: "Nguyên liệu", SUPPLIER: "Nhà cung cấp" }),
  stepDetail: L({ "Product lot": "Product lot", "Packing / shipment": "Packing / shipment", "Inspection result": "Inspection result", "Work order": "Work order", Machine: "Machine", Mold: "Mold",
    "Material lot": "Material lot", Supplier: "Supplier" },
    { "Product lot": "Lô thành phẩm", "Packing / shipment": "Đóng gói / xuất hàng", "Inspection result": "Kết quả kiểm tra", "Work order": "Work Order", Machine: "Máy", Mold: "Khuôn",
      "Material lot": "Lô nguyên liệu", Supplier: "Nhà cung cấp" }),
  event: L({ MAT_OPENING: "Opening balance", MAT_RECEIVING: "Material received", MAT_IQC_PASS: "IQC passed", MAT_IQC_FAIL: "IQC failed", MAT_REGRIND_CREATE: "Regrind lot created",
    MAT_ADJUSTMENT: "Stock adjustment", MAT_HOLD: "Lot held", MAT_RELEASE: "Lot released", MAT_RESERVATION: "Reserved", MAT_ISSUE_TO_MACHINE: "Issued to machine", MAT_RETURN: "Returned to warehouse",
    MAT_CONSUMPTION: "Consumed (back-flush)", MAT_TRANSFER: "Transferred", MOLD_INSTALLED: "Mold installed", PRODUCTION_STARTED: "Production started", INSPECTION: "Inspection completed",
    NG: "NG recorded", LOT_COMPLETED: "Product lot completed", LAST_OUTPUT: "Last output", IQC: "Incoming inspection", PRODUCT_LOT: "Product lot created" },
    { MAT_OPENING: "Tồn đầu kỳ", MAT_RECEIVING: "Nhập nguyên liệu", MAT_IQC_PASS: "IQC đạt", MAT_IQC_FAIL: "IQC không đạt", MAT_REGRIND_CREATE: "Tạo lô tái sinh", MAT_ADJUSTMENT: "Điều chỉnh tồn",
      MAT_HOLD: "Giữ lô", MAT_RELEASE: "Giải phóng lô", MAT_RESERVATION: "Giữ chỗ", MAT_ISSUE_TO_MACHINE: "Cấp cho máy", MAT_RETURN: "Trả lại kho", MAT_CONSUMPTION: "Tiêu thụ (back-flush)",
      MAT_TRANSFER: "Chuyển kho", MOLD_INSTALLED: "Lắp khuôn", PRODUCTION_STARTED: "Bắt đầu sản xuất", INSPECTION: "Hoàn thành kiểm tra", NG: "Ghi nhận NG", LOT_COMPLETED: "Hoàn thành lô",
      LAST_OUTPUT: "Sản lượng gần nhất", IQC: "Kiểm tra đầu vào", PRODUCT_LOT: "Tạo lô thành phẩm" }),
  doc: L({ INSPECTION_REPORT: "Inspection Report", PACKING_LIST: "Packing List", CERTIFICATE: "Certificate", COA: "COA", IQC_REPORT: "IQC Report", DRYING_RECORD: "Drying Record", MATERIAL_SPEC: "Material Spec", MOLD_DOC: "Mold document" },
    { INSPECTION_REPORT: "Phiếu kiểm tra", PACKING_LIST: "Packing list", CERTIFICATE: "Chứng nhận", COA: "COA", IQC_REPORT: "Phiếu IQC", DRYING_RECORD: "Hồ sơ sấy", MATERIAL_SPEC: "Thông số NL", MOLD_DOC: "Tài liệu khuôn" }),
  planStatus: L({ NOT_STARTED: "Not started", IN_PROGRESS: "In progress", COMPLETED: "Completed", CANCELLED: "Cancelled" }, { NOT_STARTED: "Chưa thực hiện", IN_PROGRESS: "Đang thực hiện", COMPLETED: "Hoàn thành", CANCELLED: "Đã hủy" }),
  ngStatus: L({ NEW: "New", INVESTIGATING: "Investigating", CA_IN_PROGRESS: "Corrective action", WAITING_VERIFICATION: "Waiting verification", CLOSED: "Closed", REOPENED: "Reopened" },
    { NEW: "Chờ xử lý", INVESTIGATING: "Đang điều tra", CA_IN_PROGRESS: "Đang khắc phục", WAITING_VERIFICATION: "Chờ xác nhận", CLOSED: "Đã đóng", REOPENED: "Mở lại" }),
};

export function label(group, value) {
  return LABELS[group]?.[lang()]?.[value] || LABELS[group]?.en?.[value] || value || "—";
}

export { localeTag };
