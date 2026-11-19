let activeLanguage = "en";
export function setActiveLanguage(language) { activeLanguage = language; }
export const UI_TEXT = {
  vi: {
    "Shift & Calendar Master": "Danh mục ca & lịch làm việc",
    "Manage factory calendar, working shifts, holidays and special days": "Quản lý ca làm việc và lịch hoạt động của nhà máy",
    "Add New Shift": "Thêm ca làm việc", "Settings": "Cài đặt", "Inactive Shifts": "Ca ngừng dùng", "Working Day": "Ngày làm việc", "Holiday": "Ngày nghỉ", "Special Day": "Ngày đặc biệt", "Selected Day": "Ngày đang chọn", "Custom Day Type": "Tên loại ngày", "Select area": "Chọn khu vực", "Shift Pattern by Area": "Chế độ ca theo khu vực", "Display": "Hiển thị", "Deactivate": "Ngừng dùng", "Activate": "Kích hoạt", "The area of a shift is set in Settings > Shift Pattern by Area.": "Khu vực áp dụng của ca được cài đặt tại Cài đặt > Chế độ ca theo khu vực.", "Each unit runs one shift pattern; sub-units inherit it unless they have their own.": "Mỗi đơn vị chạy một chế độ ca; đơn vị trực thuộc dùng theo cấp cha nếu không gán riêng.",
    "Not assigned": "Chưa gán", "Inherited from parent unit": "Kế thừa từ cấp cha", "Own": "Gán riêng", "Inherited": "Kế thừa", "Assigned here": "Gán tại đơn vị", "From parent unit": "Theo cấp cha",
    "inherited from": "kế thừa từ", "Assignments of this unit": "Lịch sử gán của đơn vị", "no end date": "không thời hạn",
    "No own assignment — this unit uses its parent's shift pattern.": "Chưa gán riêng — đơn vị đang dùng chế độ ca của cấp cha.",
    "Edit assignment": "Sửa bản gán", "Assign shift pattern": "Gán chế độ ca", "Shift Pattern": "Chế độ ca", "Effective from": "Hiệu lực từ", "Effective to": "Đến ngày",
    "Assign": "Gán", "New assignment": "Gán mới", "Shift pattern saved.": "Đã cập nhật chế độ ca.", "Used by": "Đang áp dụng tại", "since": "từ", "Not assigned to any unit": "Chưa gán cho đơn vị nào", "Information": "Thông tin", "on": "ngày", "Created by": "Người tạo", "Updated by": "Người sửa", "Activated by": "Người kích hoạt", "Deactivated by": "Người ngừng dùng", "Deleted by": "Người xóa", "Rules": "Quy tắc", "Break": "Nghỉ", "min": "phút", "hours": "giờ", "e.g. Compensatory day off": "VD: Nghỉ bù, Nghỉ mát công ty", "already registered": "đã có trong lịch", "Skipped (already registered)": "Bỏ qua các ngày đã có", "Could not save": "Không lưu được", "Edit Calendar Day": "Sửa ngày lịch", "Select dates": "Chọn ngày", "Select a date": "Chọn một ngày",
    "Click the dates to select, click again to deselect.": "Bấm vào ngày để chọn, bấm lại để bỏ chọn. Có thể chọn nhiều ngày.",
    "Total Shifts": "Tổng số ca", "Active Shifts": "Ca đang dùng", "Working Days": "Ngày làm việc",
    "Holidays": "Ngày nghỉ", "Special Days": "Ngày đặc biệt", "of total": "trên tổng số", "this month": "trong tháng",
    "Search by shift code or name...": "Tìm theo mã hoặc tên ca...", "All Types": "Tất cả loại",
    "All Status": "Tất cả trạng thái", "All Areas": "Tất cả khu vực", "Effective Date": "Ngày hiệu lực", "Clear": "Xóa bộ lọc",
    "Calendar": "Lịch tháng", "Shift List": "Danh sách ca", "Shift Detail": "Chi tiết ca",
    "General": "Thông tin chung", "Break Time Tab": "Giờ nghỉ", "Applicable Area Tab": "Khu vực áp dụng", "History": "Lịch sử",
    "Select a shift to view details.": "Chọn một ca để xem chi tiết.",
    "Shift Code": "Mã ca", "Shift Name": "Tên ca", "Shift Type": "Loại ca", "Start Time": "Giờ bắt đầu",
    "End Time": "Giờ kết thúc", "Break Time": "Giờ nghỉ (phút)", "Working Hours": "Số giờ làm việc",
    "Applicable Area": "Khu vực áp dụng", "Status": "Trạng thái", "Overtime Allowed": "Cho phép tăng ca",
    "Allow Overlap": "Cho phép chồng ca", "Color": "Màu hiển thị", "Description": "Mô tả", "Overnight Shift": "Ca qua đêm",
    "Yes": "Có", "No": "Không", "Actions": "Thao tác", "Updated": "Cập nhật",
    "Cancel": "Hủy", "Save": "Lưu", "Close": "Đóng", "Edit": "Sửa", "View": "Xem", "Delete": "Xóa", "Copy": "Sao chép",
    "Add New Shift Dialog": "Thêm ca làm việc", "Edit Shift": "Sửa ca làm việc",
    "New Shift Code": "Mã ca mới", "Copy Shift": "Sao chép ca",
    "Toggle Active / Inactive": "Chuyển Đang dùng / Ngừng dùng",
    "Shift saved.": "Đã lưu ca làm việc.", "Status updated.": "Đã cập nhật trạng thái.", "Shift copied.": "Đã sao chép ca.",
    "Are you sure you want to delete this item?": "Bạn có chắc muốn xóa mục này không?",
    "This record was changed by someone else. Please reload and try again.": "Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang và thử lại.",
    "Holiday List": "Danh sách ngày nghỉ", "Special Day List": "Danh sách ngày đặc biệt",
    "Add Holiday": "Thêm ngày nghỉ", "Add Special Day": "Thêm ngày đặc biệt", "Add Calendar Day": "Thêm ngày lịch",
    "Date": "Ngày", "Day Type": "Loại ngày", "Name": "Tên", "Calendar day saved.": "Đã lưu ngày lịch.",
    "HOLIDAY": "Ngày nghỉ lễ", "WEEKEND": "Ngày nghỉ cuối tuần", "SPECIAL_DAY": "Ngày đặc biệt", "COMPANY_EVENT": "Sự kiện công ty",
    "FACTORY_SHUTDOWN": "Dừng nhà máy", "OVERTIME": "Tăng ca", "Audit Log": "Nhật ký thao tác",
  },
  ja: {
    "Shift & Calendar Master": "シフト・カレンダーマスター",
    "Manage factory calendar, working shifts, holidays and special days": "工場カレンダー、勤務シフト、休日、特別日を管理します",
    "Add New Shift": "シフトを追加", "Settings": "設定", "Inactive Shifts": "停止中シフト", "Working Day": "稼働日", "Holiday": "休日", "Special Day": "特別日", "Selected Day": "選択日", "Custom Day Type": "日種別名", "Select area": "エリアを選択", "Shift Pattern by Area": "エリア別シフトパターン", "Deactivate": "無効化", "Activate": "有効化", "Not assigned": "未割当", "Own": "個別", "Inherited": "継承", "Shift Pattern": "シフトパターン", "Assign": "割当", "Used by": "適用先", "Information": "情報", "on": "", "Created by": "作成者", "Updated by": "更新者", "Activated by": "有効化", "Deactivated by": "無効化", "Deleted by": "削除者", "Rules": "ルール", "Break": "休憩", "min": "分", "hours": "時間", "e.g. Compensatory day off": "例：振替休日", "already registered": "登録済み", "Skipped (already registered)": "登録済みのためスキップ", "Could not save": "保存できません", "Edit Calendar Day": "カレンダー日を編集", "Select dates": "日付を選択", "Select a date": "日付を選択",
    "Click the dates to select, click again to deselect.": "日付をクリックして選択、再クリックで解除（複数選択可）。",
    "Total Shifts": "シフト総数", "Active Shifts": "使用中シフト", "Working Days": "稼働日",
    "Holidays": "休日", "Special Days": "特別日", "of total": "全体比", "this month": "今月",
    "Search by shift code or name...": "シフトコードまたは名称で検索...", "All Types": "全タイプ",
    "All Status": "全状態", "All Areas": "全エリア", "Effective Date": "発効日", "Clear": "クリア",
    "Calendar": "月間カレンダー", "Shift List": "シフト一覧", "Shift Detail": "シフト詳細",
    "General": "基本情報", "Break Time Tab": "休憩時間", "Applicable Area Tab": "適用エリア", "History": "履歴",
    "Select a shift to view details.": "シフトを選択して詳細を表示してください。",
    "Shift Code": "シフトコード", "Shift Name": "シフト名", "Shift Type": "シフトタイプ", "Start Time": "開始時刻",
    "End Time": "終了時刻", "Break Time": "休憩時間（分）", "Working Hours": "勤務時間",
    "Applicable Area": "適用エリア", "Status": "状態", "Overtime Allowed": "残業許可",
    "Allow Overlap": "重複許可", "Color": "表示色", "Description": "説明", "Overnight Shift": "夜間跨ぎシフト",
    "Yes": "はい", "No": "いいえ", "Actions": "操作", "Updated": "更新",
    "Cancel": "キャンセル", "Save": "保存", "Close": "閉じる", "Edit": "編集", "View": "表示", "Delete": "削除", "Copy": "複製",
    "Add New Shift Dialog": "シフトを追加", "Edit Shift": "シフトを編集",
    "New Shift Code": "新しいシフトコード", "Copy Shift": "シフトを複製",
    "Toggle Active / Inactive": "有効 / 無効を切替",
    "Shift saved.": "シフトを保存しました。", "Status updated.": "状態を更新しました。", "Shift copied.": "シフトを複製しました。",
    "Are you sure you want to delete this item?": "削除してもよろしいですか？",
    "This record was changed by someone else. Please reload and try again.": "他のユーザーによってデータが変更されました。再読み込みしてもう一度お試しください。",
    "Holiday List": "休日一覧", "Special Day List": "特別日一覧",
    "Add Holiday": "休日を追加", "Add Special Day": "特別日を追加", "Add Calendar Day": "カレンダー日を追加",
    "Date": "日付", "Day Type": "日タイプ", "Name": "名称", "Calendar day saved.": "カレンダー日を保存しました。",
    "HOLIDAY": "休日", "SPECIAL_DAY": "特別日", "COMPANY_EVENT": "会社イベント",
    "FACTORY_SHUTDOWN": "工場休止", "OVERTIME": "残業", "Audit Log": "監査ログ",
  },
};
export function tx(text) {
  const lang = String(activeLanguage || "en").split("-")[0];
  return UI_TEXT[lang]?.[text] || text;
}

const STATUS_LABELS = {
  vi: { ACTIVE: "Hoạt động", INACTIVE: "Ngừng dùng" },
  ja: { ACTIVE: "有効", INACTIVE: "無効" },
  en: { ACTIVE: "Active", INACTIVE: "Inactive" },
};
export function statusText(value) {
  const lang = String(activeLanguage || "en").split("-")[0];
  return STATUS_LABELS[lang]?.[value] || STATUS_LABELS.en[value] || value || "—";
}

const DAY_TYPE_LABELS = {
  vi: { HOLIDAY: "Ngày nghỉ lễ", WEEKEND: "Ngày nghỉ cuối tuần", OTHER_HOLIDAY: "Khác (tự nhập)…", OTHER_SPECIAL: "Khác (tự nhập)…", SPECIAL_DAY: "Ngày đặc biệt", COMPANY_EVENT: "Sự kiện công ty", FACTORY_SHUTDOWN: "Dừng nhà máy", OVERTIME: "Tăng ca" },
  ja: { HOLIDAY: "休日", WEEKEND: "週末休日", OTHER_HOLIDAY: "その他（入力）…", OTHER_SPECIAL: "その他（入力）…", SPECIAL_DAY: "特別日", COMPANY_EVENT: "会社イベント", FACTORY_SHUTDOWN: "工場休止", OVERTIME: "残業" },
  en: { HOLIDAY: "Holiday", WEEKEND: "Weekend", OTHER_HOLIDAY: "Other (type in)…", OTHER_SPECIAL: "Other (type in)…", SPECIAL_DAY: "Special Day", COMPANY_EVENT: "Company Event", FACTORY_SHUTDOWN: "Factory Shutdown", OVERTIME: "Overtime" },
};
export function dayTypeText(value) {
  const lang = String(activeLanguage || "en").split("-")[0];
  return DAY_TYPE_LABELS[lang]?.[value] || DAY_TYPE_LABELS.en[value] || value || "—";
}

const LOCALE_TAGS = { vi: "vi-VN", ja: "ja-JP", en: "en-US" };
export function calendarLocaleTag() {
  const lang = String(activeLanguage || "en").split("-")[0];
  return LOCALE_TAGS[lang] || LOCALE_TAGS.en;
}
