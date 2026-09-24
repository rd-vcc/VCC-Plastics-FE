import { label, localeTag, setActiveLanguage as setExLanguage, tx as exTx } from "../WorkOrders/ProductionExecution/exLocales";

let activeLanguage = "en";
export function setActiveLanguage(language) { activeLanguage = language; setExLanguage(language); }
const lang = () => String(activeLanguage || "en").split("-")[0];

const RES_TEXT = {
  vi: {
    "Production Results": "Kết quả sản xuất", "Production output, quality and performance by period": "Tổng hợp sản lượng, chất lượng và hiệu suất theo thời gian",
    "Today": "Hôm nay", "Yesterday": "Hôm qua", "This Week": "Tuần này", "This Month": "Tháng này", "Date from": "Từ ngày", "Date to": "Đến ngày",
    "Total Production": "Tổng sản lượng", "Good Quantity": "SL đạt", "Reject Quantity": "SL lỗi", "Yield (Good Rate)": "Yield (tỷ lệ đạt)", "Scrap Rate": "Tỷ lệ phế",
    "OEE (Average)": "OEE (trung bình)", "vs previous period": "so với kỳ trước", "Production Results by Work Order": "Kết quả sản xuất theo Work Order",
    "Completed": "Hoàn thành", "In Progress": "Đang sản xuất", "Cancelled": "Đã hủy", "Yield (%)": "Yield (%)", "Completed Time": "Thời gian hoàn thành",
    "Production Summary by Product": "Tổng hợp sản xuất theo sản phẩm", "Production Trend": "Xu hướng sản lượng", "Yield Trend": "Xu hướng Yield",
    "Reject Rate by Reason": "Tỷ lệ lỗi theo nguyên nhân", "Top Machines by Performance": "Top máy theo hiệu suất", "Production by Shift": "Sản xuất theo ca",
    "Quality Summary": "Tổng hợp chất lượng", "First Pass Yield": "First Pass Yield", "Rework Qty": "SL làm lại", "Scrap Qty": "SL phế",
    "Quality Detail": "Chi tiết chất lượng", "Downtime Detail": "Chi tiết dừng máy", "Export Excel": "Xuất Excel", "Print Report": "In báo cáo",
    "Product": "Sản phẩm", "Customer": "Khách hàng", "work orders": "WO", "Completion": "Hoàn thành KH", "UNSPECIFIED": "Chưa ghi lý do",
    "Rework is recorded by the Quality module (not live yet).": "SL làm lại được ghi nhận từ phân hệ Chất lượng (chưa triển khai).",
    "Select a work order in the list to open its production log.": "Chọn một Work Order trong danh sách để mở nhật ký sản xuất.",
    "Period totals come from the production log; the list shows each work order's totals.": "Số liệu kỳ lấy từ nhật ký sản xuất; danh sách hiển thị tổng của từng Work Order.",
    "pcs": "pcs", "Total (pcs)": "Tổng (pcs)", "Shift": "Ca",
  },
  ja: {
    "Production Results": "生産実績", "Production output, quality and performance by period": "期間別の生産数・品質・性能",
    "Today": "今日", "Yesterday": "昨日", "This Week": "今週", "This Month": "今月", "Date from": "開始日", "Date to": "終了日",
    "Total Production": "総生産数", "Good Quantity": "良品数", "Reject Quantity": "不良数", "Yield (Good Rate)": "歩留（良品率）", "Scrap Rate": "スクラップ率",
    "OEE (Average)": "OEE（平均）", "vs previous period": "前期間比", "Production Results by Work Order": "作業指示別生産実績",
    "Completed": "完了", "In Progress": "生産中", "Cancelled": "取消", "Yield (%)": "歩留 (%)", "Completed Time": "完了時刻",
    "Production Summary by Product": "製品別生産集計", "Production Trend": "生産推移", "Yield Trend": "歩留推移",
    "Reject Rate by Reason": "要因別不良率", "Top Machines by Performance": "機械別性能ランキング", "Production by Shift": "シフト別生産",
    "Quality Summary": "品質サマリー", "First Pass Yield": "直行率", "Rework Qty": "手直し数", "Scrap Qty": "スクラップ数",
    "Quality Detail": "品質詳細", "Downtime Detail": "停止詳細", "Export Excel": "Excel出力", "Print Report": "レポート印刷",
    "Product": "製品", "Customer": "顧客", "work orders": "WO", "Completion": "計画達成", "UNSPECIFIED": "理由未入力",
    "Rework is recorded by the Quality module (not live yet).": "手直し数は品質モジュールで記録します（未稼働）。",
    "Select a work order in the list to open its production log.": "一覧から作業指示を選択して生産ログを開いてください。",
    "Period totals come from the production log; the list shows each work order's totals.": "期間集計は生産ログ、一覧は作業指示ごとの合計です。",
    "pcs": "pcs", "Total (pcs)": "合計 (pcs)", "Shift": "シフト",
  },
};

export function tx(text, params) {
  const own = RES_TEXT[lang()]?.[text];
  if (!own) return exTx(text, params);
  return params ? String(own).replace(/\{(\w+)\}/g, (_, k) => params[k] ?? "") : own;
}

export { label, localeTag };
