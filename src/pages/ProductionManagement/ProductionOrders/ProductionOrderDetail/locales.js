import { WO_STATUS_LABELS } from "../../WorkOrders/woStatus";
import { label, localeTag, setActiveLanguage as setListLanguage, tx as listTx } from "../ProductionOrderList/locales";

let activeLanguage = "en";
export function setActiveLanguage(language) { activeLanguage = language; setListLanguage(language); }
const lang = () => String(activeLanguage || "en").split("-")[0];

export const UI_TEXT = {
  vi: {
    "Production Order Detail": "Chi tiết lệnh sản xuất",
    "Electronic production record of one production order": "Hồ sơ sản xuất điện tử của một lệnh sản xuất",
    "Back to List": "Về danh sách", "Print": "In", "Production Order": "Lệnh sản xuất", "Order Type": "Loại lệnh",
    "Created By": "Người tạo", "Created Date": "Ngày tạo", "Last Update": "Cập nhật lúc", "Switch order": "Chọn lệnh khác",
    "Select a production order": "Chọn lệnh sản xuất", "Production order not found.": "Không tìm thấy lệnh sản xuất.",
    "Overview": "Tổng quan", "Production Plan": "Kế hoạch sản xuất", "Production Progress": "Tiến độ sản xuất",
    "Quality & Scrap": "Chất lượng & phế phẩm", "Material & Consumption": "Vật tư & tiêu hao", "Machine & Mold": "Máy & khuôn",
    "Cost & Performance": "Chi phí & hiệu suất", "History & Log": "Lịch sử & nhật ký",
    "Planned Quantity": "SL kế hoạch", "Remaining": "Còn lại", "Start": "Bắt đầu", "End": "Kết thúc",
    "Status Timeline": "Dòng thời gian trạng thái", "Order Information": "Thông tin lệnh", "Product Code": "Mã sản phẩm",
    "UOM": "ĐVT", "Workflow": "Luồng xử lý", "Description": "Mô tả", "Plant": "Nhà máy",
    "Output Summary": "Tổng hợp sản lượng", "Total Pieces": "Tổng sản phẩm", "Yield (FPY)": "Tỷ lệ đạt (FPY)",
    "Quality Summary": "Tổng hợp chất lượng", "Defect Rate": "Tỷ lệ lỗi", "vs Target": "so với mục tiêu", "No target": "Chưa có mục tiêu",
    "Material Consumption": "Tiêu hao vật tư", "Planned Material": "Vật tư kế hoạch", "Actual Consumption": "Tiêu hao thực tế",
    "Usage Rate": "Tỷ lệ sử dụng", "Theoretical (pieces × part weight)": "Lý thuyết (số SP × khối lượng)",
    "Machine Performance": "Hiệu suất máy", "(This Order)": "(lệnh này)", "OEE (Avg.)": "OEE (TB)", "Availability": "Khả dụng",
    "Performance": "Hiệu năng", "Quality": "Chất lượng", "Needs Production Execution / IoT data": "Cần dữ liệu Production Execution / IoT",
    "Related Work Orders": "Work Order liên quan", "Total WO": "Tổng WO", "Work Orders in This Production Order": "Work Order của lệnh này",
    "Work Order No.": "Số Work Order", "Mold": "Khuôn", "Planned Qty (PCS)": "SL KH (PCS)", "Completed (PCS)": "Đã làm (PCS)",
    "Notes": "Ghi chú", "Add Note": "Thêm ghi chú", "View All Notes": "Xem tất cả ghi chú", "Note added.": "Đã thêm ghi chú.",
    "Write a note...": "Nhập ghi chú...", "No notes yet.": "Chưa có ghi chú.",
    "Report Downtime": "Báo dừng máy", "Request Material": "Yêu cầu vật tư", "Add Work Order": "Thêm Work Order",
    "Quality Check": "Kiểm tra chất lượng", "Change Schedule": "Đổi lịch sản xuất", "Print Order": "In lệnh",
    "Plan": "Kế hoạch", "Plan Status": "TT kế hoạch", "Duration": "Thời lượng", "Schedule window": "Khung lịch",
    "Scheduled Qty": "SL đã lập WO", "Open Production Planning": "Mở Kế hoạch sản xuất", "Open Production Execution": "Mở Thực hiện sản xuất",
    "Open Quality Inspection": "Mở Kiểm tra chất lượng", "Open Material Management": "Mở Quản lý vật tư",
    "Record Progress": "Cập nhật sản lượng", "Progress updated.": "Đã cập nhật sản lượng.",
    "Defect rate by work order": "Tỷ lệ lỗi theo Work Order", "Shot usage": "Số shot đã dùng", "Planned time": "Thời gian KH",
    "Open Machine Detail": "Mở chi tiết máy", "Open Mold Detail": "Mở chi tiết khuôn", "Machines": "Máy", "Molds": "Khuôn",
    "Cost data is not available yet": "Chưa có dữ liệu chi phí",
    "Cost needs material prices, machine hour rates and labour rates, which are not in the master data yet.": "Để tính chi phí cần giá vật tư, đơn giá giờ máy và đơn giá nhân công — các dữ liệu này chưa có trong danh mục.",
    "Activity Log": "Nhật ký hoạt động", "Order": "Lệnh", "Time": "Thời gian", "User": "Người thực hiện", "Event": "Sự kiện",
    "Details": "Chi tiết", "Used by": "Dùng cho", "Unit": "ĐVT",
    "Some work orders have no part weight, so their material is not counted.": "Một số Work Order chưa có khối lượng sản phẩm nên chưa tính được vật tư.",
    "BOM standard × produced pieces": "Định mức BOM × sản lượng đã làm",
    "Recorded in Material Usage": "Ghi nhận ở màn Tiêu hao vật tư",
    "Actual consumption recorded per lot and machine in Material Usage.": "Tiêu hao thực tế đã ghi nhận theo từng lot và máy ở màn Tiêu hao vật tư.",
    "Standard Usage": "Định mức", "Usage Difference": "Chênh lệch",
    "Usage shows the BOM standard for the pieces produced until actual consumption is recorded.": "Tiêu hao đang tính theo định mức BOM × sản lượng đã làm, cho đến khi ghi nhận tiêu hao thực tế.",
    "Preview from the active BOM: materials are assigned when the order is released.": "Xem trước theo BOM hiệu lực: vật tư được phân công khi phát hành lệnh.",
  },
  ja: {
    "Production Order Detail": "製造オーダー詳細",
    "Electronic production record of one production order": "製造オーダーの電子生産記録",
    "Back to List": "一覧へ戻る", "Print": "印刷", "Production Order": "製造オーダー", "Order Type": "オーダー種別",
    "Created By": "作成者", "Created Date": "作成日", "Last Update": "最終更新", "Switch order": "オーダー切替",
    "Select a production order": "製造オーダーを選択", "Production order not found.": "製造オーダーが見つかりません。",
    "Overview": "概要", "Production Plan": "生産計画", "Production Progress": "生産進捗",
    "Quality & Scrap": "品質・スクラップ", "Material & Consumption": "材料・消費", "Machine & Mold": "機械・金型",
    "Cost & Performance": "コスト・パフォーマンス", "History & Log": "履歴・ログ",
    "Planned Quantity": "計画数", "Remaining": "残数", "Start": "開始", "End": "終了",
    "Status Timeline": "状態タイムライン", "Order Information": "オーダー情報", "Product Code": "製品コード",
    "UOM": "単位", "Workflow": "ワークフロー", "Description": "説明", "Plant": "工場",
    "Output Summary": "出来高サマリー", "Total Pieces": "総数", "Yield (FPY)": "良品率 (FPY)",
    "Quality Summary": "品質サマリー", "Defect Rate": "不良率", "vs Target": "目標比", "No target": "目標未設定",
    "Material Consumption": "材料消費", "Planned Material": "計画材料", "Actual Consumption": "実消費",
    "Usage Rate": "使用率", "Theoretical (pieces × part weight)": "理論値（数量 × 製品重量）",
    "Machine Performance": "機械パフォーマンス", "(This Order)": "（本オーダー）", "OEE (Avg.)": "OEE（平均）", "Availability": "時間稼働率",
    "Performance": "性能稼働率", "Quality": "良品率", "Needs Production Execution / IoT data": "生産実行 / IoT データが必要",
    "Related Work Orders": "関連作業オーダー", "Total WO": "WO 合計", "Work Orders in This Production Order": "本オーダーの作業オーダー",
    "Work Order No.": "作業オーダー番号", "Mold": "金型", "Planned Qty (PCS)": "計画数 (PCS)", "Completed (PCS)": "実績 (PCS)",
    "Notes": "メモ", "Add Note": "メモ追加", "View All Notes": "すべてのメモ", "Note added.": "メモを追加しました。",
    "Write a note...": "メモを入力...", "No notes yet.": "メモはまだありません。",
    "Report Downtime": "停止報告", "Request Material": "材料要求", "Add Work Order": "作業オーダー追加",
    "Quality Check": "品質チェック", "Change Schedule": "日程変更", "Print Order": "オーダー印刷",
    "Plan": "計画", "Plan Status": "計画状態", "Duration": "所要時間", "Schedule window": "計画期間",
    "Scheduled Qty": "WO 計画数", "Open Production Planning": "生産計画を開く", "Open Production Execution": "生産実行を開く",
    "Open Quality Inspection": "品質検査を開く", "Open Material Management": "材料管理を開く",
    "Record Progress": "実績入力", "Progress updated.": "実績を更新しました。",
    "Defect rate by work order": "作業オーダー別不良率", "Shot usage": "ショット使用率", "Planned time": "計画時間",
    "Open Machine Detail": "機械詳細を開く", "Open Mold Detail": "金型詳細を開く", "Machines": "機械", "Molds": "金型",
    "Cost data is not available yet": "コストデータはまだありません",
    "Cost needs material prices, machine hour rates and labour rates, which are not in the master data yet.": "コスト計算には材料単価・機械時間単価・労務単価が必要ですが、マスタ未登録です。",
    "Activity Log": "活動ログ", "Order": "オーダー", "Time": "時刻", "User": "ユーザー", "Event": "イベント",
    "Details": "詳細", "Used by": "使用オーダー", "Unit": "単位",
    "Some work orders have no part weight, so their material is not counted.": "製品重量未設定の作業オーダーは材料計算に含まれていません。",
    "BOM standard × produced pieces": "BOM標準 × 生産数",
    "Recorded in Material Usage": "材料使用で記録",
    "Actual consumption recorded per lot and machine in Material Usage.": "材料使用画面でロット・機械ごとに記録された実消費です。",
    "Standard Usage": "標準使用量", "Usage Difference": "差異",
    "Usage shows the BOM standard for the pieces produced until actual consumption is recorded.": "実消費が記録されるまで、使用量は生産数に対するBOM標準で表示します。",
    "Preview from the active BOM: materials are assigned when the order is released.": "有効BOMによるプレビュー：材料はオーダー発行時に割当てられます。",
  },
};

export function tx(text, params) {
  const template = UI_TEXT[lang()]?.[text];
  if (!template) return listTx(text, params);
  return params ? String(template).replace(/\{(\w+)\}/g, (_, k) => params[k] ?? "") : template;
}

const WO_STATUS = WO_STATUS_LABELS;
export function woStatusText(value) { return WO_STATUS[lang()]?.[value] || WO_STATUS.en[value] || value || "—"; }

const TIMELINE = {
  en: { DRAFT: "Created", RELEASED: "Released", SCHEDULING: "Scheduling", IN_PRODUCTION: "In Production", COMPLETED: "Completed", CLOSED: "Closed", CANCELLED: "Cancelled" },
  vi: { DRAFT: "Tạo mới", RELEASED: "Phát hành", SCHEDULING: "Lập lịch", IN_PRODUCTION: "Đang sản xuất", COMPLETED: "Hoàn thành", CLOSED: "Đóng lệnh", CANCELLED: "Đã hủy" },
  ja: { DRAFT: "作成", RELEASED: "発行", SCHEDULING: "計画", IN_PRODUCTION: "生産中", COMPLETED: "完了", CLOSED: "締め", CANCELLED: "取消" },
};
export function timelineText(value) { return TIMELINE[lang()]?.[value] || TIMELINE.en[value] || value; }

const WO_ACTIONS = {
  en: { CREATE: "WO created", UPDATE: "WO updated", SCHEDULE: "WO scheduled", RESCHEDULE: "WO rescheduled", UNSCHEDULE: "WO moved to backlog", CANCEL: "WO cancelled", RELEASE: "WO released", PROGRESS: "Progress recorded" },
  vi: { CREATE: "Tạo WO", UPDATE: "Sửa WO", SCHEDULE: "Lên lịch WO", RESCHEDULE: "Đổi lịch WO", UNSCHEDULE: "Đưa WO về backlog", CANCEL: "Hủy WO", RELEASE: "Phát hành WO", PROGRESS: "Cập nhật sản lượng" },
  ja: { CREATE: "WO 作成", UPDATE: "WO 更新", SCHEDULE: "WO 割付", RESCHEDULE: "WO 再割付", UNSCHEDULE: "WO をバックログへ", CANCEL: "WO 取消", RELEASE: "WO リリース", PROGRESS: "実績入力" },
};
export function activityText(entry) {
  if (entry.source === "WORK_ORDER") return WO_ACTIONS[lang()]?.[entry.action] || WO_ACTIONS.en[entry.action] || entry.action;
  return label("history", entry.action);
}

export { label, localeTag };
export const translations = { vi: {}, en: {}, ja: {} };
export default translations;
