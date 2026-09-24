import { WO_STATUS_LABELS } from "../WorkOrders/woStatus";
let activeLanguage = "en";
export function setActiveLanguage(language) { activeLanguage = language; }
const lang = () => String(activeLanguage || "en").split("-")[0];

export const UI_TEXT = {
  vi: {
    "Production Planning": "Kế hoạch sản xuất",
    "Build, balance and publish the production plan against real factory capacity": "Lập, cân đối và phát hành kế hoạch sản xuất theo năng lực thực tế của nhà máy",
    "Plant": "Nhà máy", "Area": "Khu vực", "Shift": "Ca", "Business Date": "Ngày sản xuất", "All Plants": "Tất cả nhà máy", "All Areas": "Tất cả khu vực",
    "Refresh": "Làm mới", "Filter": "Bộ lọc", "Save Plan View": "Lưu góc nhìn", "Export Plan": "Xuất kế hoạch", "Simulation": "Mô phỏng",
    "Capacity Check": "Kiểm tra năng lực", "Material Check": "Kiểm tra vật tư", "Last Update": "Cập nhật lúc", "Auto Refresh": "Tự làm mới",
    "Plan view saved.": "Đã lưu góc nhìn kế hoạch.",
    "Planned Production": "Sản lượng kế hoạch", "This Shift Target": "Mục tiêu ca này", "Total Capacity": "Tổng năng lực",
    "Load": "Tải", "Planned Orders": "Work Order đã lập", "Total Orders": "Tổng số lệnh", "On Track Orders": "Đúng tiến độ",
    "At Risk Orders": "Có rủi ro", "Delayed Orders": "Chậm tiến độ", "Need Attention": "Cần chú ý", "Delayed": "Đã chậm",
    "Material Availability": "Sẵn sàng vật tư", "Enough": "Đủ", "Running Low": "Sắp hết", "Shortage": "Thiếu hàng",
    "Planning Board (Gantt)": "Bảng kế hoạch (Gantt)", "Shift View": "Theo ca", "Day View": "Theo ngày", "Work Order": "Work Order",
    "Product": "Sản phẩm", "Machine": "Máy", "Mold": "Khuôn", "Qty (PCS)": "SL (PCS)", "Now": "Hiện tại",
    "Capacity Overview (By Machine Group)": "Tổng quan năng lực (theo nhóm máy)", "Machine Group": "Nhóm máy", "Machines": "Số máy",
    "Available (h)": "Khả dụng (giờ)", "Planned (h)": "Kế hoạch (giờ)", "Utilization": "Mức sử dụng", "Total": "Tổng",
    "Est. Capacity (PCS)": "Năng lực ước tính (PCS)", "Total Utilization": "Tổng mức sử dụng",
    "Material Readiness": "Sẵn sàng vật tư", "Material": "Vật tư", "Required": "Cần", "Available": "Tồn", "Availability": "Tình trạng",
    "View Details": "Xem chi tiết", "Order Summary": "Tổng hợp Work Order", "Orders": "lệnh",
    "Capacity vs Demand (Hourly)": "Năng lực vs Nhu cầu (theo giờ)", "Capacity (machine-h)": "Năng lực (máy-giờ)", "Demand (machine-h)": "Nhu cầu (máy-giờ)",
    "Plan vs Achievement (This Shift)": "Kế hoạch vs Thực hiện (ca này)", "Planned": "Kế hoạch", "Actual": "Thực tế", "Expected by now": "Kỳ vọng đến hiện tại",
    "Need {qty} PCS to achieve target": "Cần thêm {qty} PCS để đạt mục tiêu", "Schedule adherence": "Bám tiến độ",
    "Planning Alerts": "Cảnh báo kế hoạch", "View All": "Xem tất cả", "No alerts.": "Không có cảnh báo.",
    "Unscheduled / Backlog Orders": "Work Order chưa lên lịch / Backlog", "Order No.": "Số lệnh", "Priority": "Ưu tiên", "Reason": "Lý do",
    "Due": "Hạn", "Duration": "Thời lượng", "Recommended Action": "Gợi ý", "Schedule next shift": "Xếp vào ca kế tiếp",
    "Add to {start}–{end} ({machine})": "Xếp {start}–{end} ({machine})", "Apply": "Áp dụng", "Schedule": "Lên lịch",
    "Quick Actions": "Thao tác nhanh", "Create Work Order": "Tạo Work Order", "Plan Simulation": "Mô phỏng kế hoạch",
    "Confirm Plan": "Xác nhận kế hoạch", "Reopen Plan": "Mở lại kế hoạch", "Publish Plan": "Phát hành kế hoạch",
    "No plan exists for this date, shift and plant yet.": "Chưa có kế hoạch cho ngày, ca và nhà máy này.",
    "Create Plan": "Tạo kế hoạch", "Plan created.": "Đã tạo kế hoạch.",
    "DRAFT": "Nháp", "CONFIRMED": "Đã xác nhận", "PUBLISHED": "Đã phát hành", "CANCELLED": "Đã hủy",
    "Plan confirmed.": "Đã xác nhận kế hoạch.", "Plan reopened.": "Đã mở lại kế hoạch.", "Plan published to Production Execution.": "Đã phát hành kế hoạch xuống Production Execution.",
    "Publish this plan? Scheduled work orders will be released to Production Execution.": "Phát hành kế hoạch? Các Work Order đã lên lịch sẽ được chuyển sang Production Execution.",
    "Blocking issues": "Lỗi chặn", "Warnings": "Cảnh báo",
    "Resolve the blocking issues before confirming or publishing.": "Cần xử lý các lỗi chặn trước khi xác nhận hoặc phát hành.",
    "Work Order No.": "Số Work Order", "Planned Qty": "SL kế hoạch", "Cavity": "Số cavity", "Cycle Time (s)": "Chu kỳ (giây)",
    "Setup (min)": "Chuẩn bị (phút)", "Part Weight (g)": "Khối lượng sản phẩm (g)", "Due Date": "Hạn hoàn thành", "Source": "Nguồn",
    "Source Ref.": "Số tham chiếu", "Backlog Reason": "Lý do chưa lên lịch", "Remark": "Ghi chú", "Estimated duration": "Thời lượng ước tính",
    "Edit Work Order": "Sửa Work Order", "Work order saved.": "Đã lưu Work Order.", "Schedule Work Order": "Lên lịch Work Order",
    "Planned Start": "Bắt đầu", "Planned End": "Kết thúc", "Work order scheduled.": "Đã lên lịch Work Order.",
    "Move to Backlog": "Đưa về Backlog", "Work order moved to backlog.": "Đã đưa Work Order về Backlog.",
    "Cancel Work Order": "Hủy Work Order", "Work order cancelled.": "Đã hủy Work Order.", "Cancel this work order?": "Hủy Work Order này?",
    "Production Order": "Lệnh sản xuất", "Reject Qty": "SL lỗi",
    "Materials come from the product's active BOM (Product Master).": "Vật tư lấy theo BOM hiệu lực của sản phẩm (Product Master).",
    "Record Progress": "Cập nhật sản lượng", "Actual Qty": "SL thực tế", "Progress updated.": "Đã cập nhật sản lượng.",
    "Actual quantity is entered manually until Production Execution is available.": "Sản lượng thực tế được nhập tay cho đến khi có Production Execution.",
    "Open Order Detail": "Mở chi tiết lệnh", "Status": "Trạng thái", "Progress": "Tiến độ",
    "Cancel": "Hủy bỏ", "Save": "Lưu", "Close": "Đóng", "Edit": "Sửa", "Delete": "Xóa",
    "Simulation compares the current plan with your changes without saving anything.": "Mô phỏng so sánh kế hoạch hiện tại với các thay đổi của bạn mà không lưu dữ liệu.",
    "Add Change": "Thêm thay đổi", "Run Simulation": "Chạy mô phỏng", "Current": "Hiện tại", "Simulated": "Mô phỏng",
    "Keep": "Giữ nguyên", "Errors": "Lỗi", "Alerts after simulation": "Cảnh báo sau mô phỏng",
    "Material Stock": "Tồn kho vật tư", "Safety Stock": "Tồn an toàn", "Update Stock": "Cập nhật tồn",
    "Stock is maintained here until the Material Management module is available.": "Tồn khả dụng lấy từ các Lot vật tư (nhập kho tại Lịch sử Lot). Tại đây chỉ chỉnh tồn an toàn.",
    "Stock updated.": "Đã cập nhật tồn kho.", "No stock record": "Chưa có tồn kho", "Used by": "Dùng cho",
    "All": "Tất cả", "Progress State": "Trạng thái tiến độ", "Clear": "Xóa lọc", "Export": "Xuất",
    "Audit Log": "Nhật ký", "No data.": "Không có dữ liệu.", "min": "phút", "h": "giờ",
    "This record was changed by someone else. Please reload and try again.": "Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại và thử lại.",
  },
  ja: {
    "Production Planning": "生産計画",
    "Build, balance and publish the production plan against real factory capacity": "工場の実能力に基づき生産計画を作成・平準化・発行します",
    "Plant": "工場", "Area": "エリア", "Shift": "シフト", "Business Date": "稼働日", "All Plants": "全工場", "All Areas": "全エリア",
    "Refresh": "更新", "Filter": "フィルター", "Save Plan View": "ビューを保存", "Export Plan": "計画を出力", "Simulation": "シミュレーション",
    "Capacity Check": "能力チェック", "Material Check": "材料チェック", "Last Update": "最終更新", "Auto Refresh": "自動更新",
    "Plan view saved.": "ビューを保存しました。",
    "Planned Production": "計画生産数", "This Shift Target": "本シフト目標", "Total Capacity": "総能力",
    "Load": "負荷", "Planned Orders": "計画オーダー", "Total Orders": "総オーダー", "On Track Orders": "順調",
    "At Risk Orders": "リスクあり", "Delayed Orders": "遅延", "Need Attention": "要注意", "Delayed": "遅延中",
    "Material Availability": "材料充足率", "Enough": "充足", "Running Low": "残少", "Shortage": "不足",
    "Planning Board (Gantt)": "計画ボード（ガント）", "Shift View": "シフト", "Day View": "日", "Work Order": "作業オーダー",
    "Product": "製品", "Machine": "機械", "Mold": "金型", "Qty (PCS)": "数量 (PCS)", "Now": "現在",
    "Capacity Overview (By Machine Group)": "能力概要（機械グループ別）", "Machine Group": "機械グループ", "Machines": "台数",
    "Available (h)": "可用 (h)", "Planned (h)": "計画 (h)", "Utilization": "稼働率", "Total": "合計",
    "Est. Capacity (PCS)": "推定能力 (PCS)", "Total Utilization": "総稼働率",
    "Material Readiness": "材料準備状況", "Material": "材料", "Required": "必要量", "Available": "在庫", "Availability": "状況",
    "View Details": "詳細を見る", "Order Summary": "オーダー集計", "Orders": "件",
    "Capacity vs Demand (Hourly)": "能力 vs 需要（時間別）", "Capacity (machine-h)": "能力（機械時間）", "Demand (machine-h)": "需要（機械時間）",
    "Plan vs Achievement (This Shift)": "計画 vs 実績（本シフト）", "Planned": "計画", "Actual": "実績", "Expected by now": "現時点の期待値",
    "Need {qty} PCS to achieve target": "目標達成まであと {qty} PCS", "Schedule adherence": "計画遵守率",
    "Planning Alerts": "計画アラート", "View All": "すべて表示", "No alerts.": "アラートはありません。",
    "Unscheduled / Backlog Orders": "未計画 / バックログ", "Order No.": "オーダー番号", "Priority": "優先度", "Reason": "理由",
    "Due": "納期", "Duration": "所要時間", "Recommended Action": "推奨アクション", "Schedule next shift": "次シフトへ割付",
    "Add to {start}–{end} ({machine})": "{start}–{end} に割付（{machine}）", "Apply": "適用", "Schedule": "割付",
    "Quick Actions": "クイック操作", "Create Work Order": "作業オーダー作成", "Plan Simulation": "計画シミュレーション",
    "Confirm Plan": "計画を確定", "Reopen Plan": "計画を再開", "Publish Plan": "計画を発行",
    "No plan exists for this date, shift and plant yet.": "この日付・シフト・工場の計画はまだありません。",
    "Create Plan": "計画を作成", "Plan created.": "計画を作成しました。",
    "DRAFT": "下書き", "CONFIRMED": "確定済", "PUBLISHED": "発行済", "CANCELLED": "取消",
    "Plan confirmed.": "計画を確定しました。", "Plan reopened.": "計画を再開しました。", "Plan published to Production Execution.": "計画を生産実行へ発行しました。",
    "Publish this plan? Scheduled work orders will be released to Production Execution.": "計画を発行しますか？割付済みオーダーは生産実行へリリースされます。",
    "Blocking issues": "ブロック要因", "Warnings": "警告",
    "Resolve the blocking issues before confirming or publishing.": "確定・発行の前にブロック要因を解消してください。",
    "Work Order No.": "作業オーダー番号", "Planned Qty": "計画数", "Cavity": "キャビティ数", "Cycle Time (s)": "サイクル (秒)",
    "Setup (min)": "段取り (分)", "Part Weight (g)": "製品重量 (g)", "Due Date": "納期", "Source": "発生元",
    "Source Ref.": "参照番号", "Backlog Reason": "未計画理由", "Remark": "備考", "Estimated duration": "推定所要時間",
    "Edit Work Order": "作業オーダー編集", "Work order saved.": "作業オーダーを保存しました。", "Schedule Work Order": "作業オーダー割付",
    "Planned Start": "開始", "Planned End": "終了", "Work order scheduled.": "作業オーダーを割り付けました。",
    "Move to Backlog": "バックログへ戻す", "Work order moved to backlog.": "バックログへ戻しました。",
    "Cancel Work Order": "作業オーダー取消", "Work order cancelled.": "作業オーダーを取り消しました。", "Cancel this work order?": "この作業オーダーを取り消しますか？",
    "Production Order": "製造オーダー", "Reject Qty": "不良数",
    "Materials come from the product's active BOM (Product Master).": "材料は製品の有効BOMから取得します（製品マスター）。",
    "Record Progress": "実績入力", "Actual Qty": "実績数", "Progress updated.": "実績を更新しました。",
    "Actual quantity is entered manually until Production Execution is available.": "生産実行が利用可能になるまで実績数は手入力です。",
    "Open Order Detail": "オーダー詳細を開く", "Status": "状態", "Progress": "進捗",
    "Cancel": "キャンセル", "Save": "保存", "Close": "閉じる", "Edit": "編集", "Delete": "削除",
    "Simulation compares the current plan with your changes without saving anything.": "シミュレーションは保存せずに現計画と変更案を比較します。",
    "Add Change": "変更を追加", "Run Simulation": "実行", "Current": "現在", "Simulated": "シミュレーション",
    "Keep": "変更なし", "Errors": "エラー", "Alerts after simulation": "シミュレーション後のアラート",
    "Material Stock": "材料在庫", "Safety Stock": "安全在庫", "Update Stock": "在庫更新",
    "Stock is maintained here until the Material Management module is available.": "有効在庫は材料ロットから算出されます（入庫はロット履歴で）。ここでは安全在庫のみ変更します。",
    "Stock updated.": "在庫を更新しました。", "No stock record": "在庫未登録", "Used by": "使用オーダー",
    "All": "すべて", "Progress State": "進捗状態", "Clear": "クリア", "Export": "出力",
    "Audit Log": "監査ログ", "No data.": "データがありません。", "min": "分", "h": "時間",
    "This record was changed by someone else. Please reload and try again.": "他のユーザーによってデータが変更されました。再読み込みしてもう一度お試しください。",
  },
};

export function tx(text, params) {
  const template = UI_TEXT[lang()]?.[text] || text;
  return params ? fmt(template, params) : template;
}

export function fmt(template, params = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => (params[key] ?? ""));
}

const LABELS = {
  progress: {
    en: { NOT_STARTED: "Not Started", ON_TRACK: "On Track", AHEAD: "Ahead", AT_RISK: "At Risk", DELAY: "Delay", COMPLETED: "Completed" },
    vi: { NOT_STARTED: "Chưa bắt đầu", ON_TRACK: "Đúng tiến độ", AHEAD: "Vượt tiến độ", AT_RISK: "Có rủi ro", DELAY: "Chậm", COMPLETED: "Hoàn thành" },
    ja: { NOT_STARTED: "未着手", ON_TRACK: "順調", AHEAD: "前倒し", AT_RISK: "リスク", DELAY: "遅延", COMPLETED: "完了" },
  },
  priority: {
    en: { LOW: "Low", MEDIUM: "Medium", HIGH: "High", URGENT: "Urgent" },
    vi: { LOW: "Thấp", MEDIUM: "Trung bình", HIGH: "Cao", URGENT: "Khẩn" },
    ja: { LOW: "低", MEDIUM: "中", HIGH: "高", URGENT: "緊急" },
  },
  woStatus: WO_STATUS_LABELS,
  source: {
    en: { MANUAL: "Manual", SALES_ORDER: "Sales Order", FORECAST: "Forecast", STOCK: "Stock Replenishment" },
    vi: { MANUAL: "Nhập tay", SALES_ORDER: "Đơn bán hàng", FORECAST: "Dự báo", STOCK: "Bổ sung tồn kho" },
    ja: { MANUAL: "手入力", SALES_ORDER: "受注", FORECAST: "予測", STOCK: "在庫補充" },
  },
  material: {
    en: { ENOUGH: "Enough", RUNNING_LOW: "Running Low", SHORTAGE: "Shortage" },
    vi: { ENOUGH: "Đủ", RUNNING_LOW: "Sắp hết", SHORTAGE: "Thiếu hàng" },
    ja: { ENOUGH: "充足", RUNNING_LOW: "残少", SHORTAGE: "不足" },
  },
  machineStatus: {
    en: { UNKNOWN: "Unknown", RUNNING: "Running", IDLE: "Idle", DOWN: "Down", MAINTENANCE: "Maintenance", OFFLINE: "Offline" },
    vi: { UNKNOWN: "Không rõ", RUNNING: "Đang chạy", IDLE: "Chờ", DOWN: "Dừng máy", MAINTENANCE: "Bảo trì", OFFLINE: "Mất kết nối" },
    ja: { UNKNOWN: "不明", RUNNING: "稼働", IDLE: "待機", DOWN: "停止", MAINTENANCE: "保全", OFFLINE: "オフライン" },
  },
};

export function label(group, value) {
  return LABELS[group]?.[lang()]?.[value] || LABELS[group]?.en?.[value] || value || "—";
}

const ALERTS = {
  en: {
    MACHINE_OVERLAP: ["Machine double booked", "{wo} overlaps {other} on {resource}"],
    MOLD_OVERLAP: ["Mold double booked", "{wo} overlaps {other} on mold {resource}"],
    MACHINE_UNAVAILABLE: ["Machine unavailable", "{wo}: {machine} is {status}"],
    MOLD_UNAVAILABLE: ["Mold unavailable", "{wo}: mold {mold} is {status}"],
    MISSING_MACHINE: ["No machine assigned", "{wo} has no machine"],
    MISSING_MOLD: ["No mold assigned", "{wo} has no mold"],
    MOLD_PRODUCT_MISMATCH: ["Mold not linked to product", "{wo}: mold {mold} is not registered for product {product}"],
    OUTSIDE_SHIFT: ["Runs outside shift", "{wo} runs {start}–{end}, beyond the shift window"],
    DUE_DATE_RISK: ["Due date at risk", "{wo} finishes {late_minutes} min after due {due}"],
    BEHIND_SCHEDULE: ["Behind schedule", "{wo}: actual {actual} vs expected {expected} PCS"],
    NO_MATERIAL_DATA: ["Material data missing", "{wo} has no material or part weight; material need not checked"],
    NO_BOM: ["No active BOM", "{wo}: product {product} has no active BOM, so its material need is not checked"],
    MATERIAL_SHORTAGE: ["Material shortage", "{material}: need {required} {unit}, available {available} {unit}"],
    MATERIAL_LOW: ["Material running low", "{material}: need {required} {unit}, available {available} {unit} (below safety stock after use)"],
    CAPACITY_OVERLOAD: ["Capacity overload", "{group} loaded at {utilization}%"],
    BACKLOG_URGENT: ["Urgent backlog order", "{wo} is due {due} but not scheduled"],
  },
  vi: {
    MACHINE_OVERLAP: ["Trùng lịch máy", "{wo} trùng thời gian với {other} trên máy {resource}"],
    MOLD_OVERLAP: ["Trùng lịch khuôn", "{wo} trùng thời gian với {other} trên khuôn {resource}"],
    MACHINE_UNAVAILABLE: ["Máy không khả dụng", "{wo}: máy {machine} đang ở trạng thái {status}"],
    MOLD_UNAVAILABLE: ["Khuôn không khả dụng", "{wo}: khuôn {mold} đang ở trạng thái {status}"],
    MISSING_MACHINE: ["Chưa gán máy", "{wo} chưa được gán máy"],
    MISSING_MOLD: ["Chưa gán khuôn", "{wo} chưa được gán khuôn"],
    MOLD_PRODUCT_MISMATCH: ["Khuôn không khớp sản phẩm", "{wo}: khuôn {mold} chưa được khai báo cho sản phẩm {product}"],
    OUTSIDE_SHIFT: ["Vượt khung ca", "{wo} chạy {start}–{end}, vượt ngoài khung giờ ca"],
    DUE_DATE_RISK: ["Nguy cơ trễ hạn", "{wo} kết thúc sau hạn {due} khoảng {late_minutes} phút"],
    BEHIND_SCHEDULE: ["Chậm tiến độ", "{wo}: thực tế {actual} / kỳ vọng {expected} PCS"],
    NO_MATERIAL_DATA: ["Thiếu dữ liệu vật tư", "{wo} chưa có vật tư hoặc khối lượng sản phẩm, chưa kiểm tra được nhu cầu vật tư"],
    NO_BOM: ["Chưa có BOM", "{wo}: sản phẩm {product} chưa có BOM hiệu lực nên chưa kiểm tra được nhu cầu vật tư"],
    MATERIAL_SHORTAGE: ["Thiếu vật tư", "{material}: cần {required} {unit}, tồn {available} {unit}"],
    MATERIAL_LOW: ["Vật tư sắp hết", "{material}: cần {required} {unit}, tồn {available} {unit} (dưới tồn an toàn sau khi dùng)"],
    CAPACITY_OVERLOAD: ["Quá tải công suất", "{group} đang tải {utilization}%"],
    BACKLOG_URGENT: ["Lệnh gấp chưa lên lịch", "{wo} đến hạn {due} nhưng chưa được lên lịch"],
  },
  ja: {
    MACHINE_OVERLAP: ["機械の重複割付", "{wo} が {resource} で {other} と重複"],
    MOLD_OVERLAP: ["金型の重複割付", "{wo} が金型 {resource} で {other} と重複"],
    MACHINE_UNAVAILABLE: ["機械使用不可", "{wo}: {machine} は {status}"],
    MOLD_UNAVAILABLE: ["金型使用不可", "{wo}: 金型 {mold} は {status}"],
    MISSING_MACHINE: ["機械未割付", "{wo} に機械が未割付"],
    MISSING_MOLD: ["金型未割付", "{wo} に金型が未割付"],
    MOLD_PRODUCT_MISMATCH: ["金型と製品の不一致", "{wo}: 金型 {mold} は製品 {product} に未登録"],
    OUTSIDE_SHIFT: ["シフト時間外", "{wo} は {start}–{end} でシフト枠を超過"],
    DUE_DATE_RISK: ["納期リスク", "{wo} は納期 {due} より {late_minutes} 分遅れて終了"],
    BEHIND_SCHEDULE: ["進捗遅れ", "{wo}: 実績 {actual} / 期待 {expected} PCS"],
    NO_MATERIAL_DATA: ["材料データ不足", "{wo} は材料または製品重量が未設定のため材料チェック不可"],
    NO_BOM: ["有効BOMなし", "{wo}: 製品 {product} に有効なBOMがないため材料チェック不可"],
    MATERIAL_SHORTAGE: ["材料不足", "{material}: 必要 {required} {unit}、在庫 {available} {unit}"],
    MATERIAL_LOW: ["材料残少", "{material}: 必要 {required} {unit}、在庫 {available} {unit}（使用後に安全在庫割れ）"],
    CAPACITY_OVERLOAD: ["能力超過", "{group} の負荷 {utilization}%"],
    BACKLOG_URGENT: ["緊急の未計画オーダー", "{wo} は納期 {due} だが未計画"],
  },
};

export function alertText(alert) {
  const [title, template] = ALERTS[lang()]?.[alert.code] || ALERTS.en[alert.code] || [alert.code, ""];
  const params = { ...alert.params };
  if (params.status) params.status = label("machineStatus", params.status);
  return { title, message: fmt(template, params) };
}

const LOCALE_TAGS = { vi: "vi-VN", ja: "ja-JP", en: "en-US" };
export function localeTag() { return LOCALE_TAGS[lang()] || LOCALE_TAGS.en; }

export const translations = { vi: {}, en: {}, ja: {} };
export default translations;
