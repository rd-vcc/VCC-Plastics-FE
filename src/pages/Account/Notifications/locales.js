import i18n from "../../../i18n";

const EVENTS_VI = {
  WO_RELEASED: "Lệnh công việc mới được phát hành",
  MATERIAL_NEEDED: "Cần chuẩn bị vật tư cho lệnh",
  MATERIAL_ISSUED: "Vật tư đã được cấp ra máy",
  WO_STARTED: "Lệnh đã bắt đầu chạy, cần kiểm tra đầu chuyền",
  NG_REPORTED: "Có hàng lỗi NG cần xử lý",
  WO_ON_HOLD: "Lệnh sản xuất bị tạm dừng",
  DOWNTIME_REPORTED: "Máy dừng",
  WO_COMPLETED: "Lệnh đã kết thúc, thu hồi vật tư dư",
  MAINT_REQUESTED: "Có yêu cầu bảo trì mới",
  MAINT_WO_ASSIGNED: "Lệnh bảo trì được giao",
  MAINT_VERIFY: "Sửa chữa xong, chờ nghiệm thu",
  MAINT_DONE: "Bảo trì hoàn tất, máy sẵn sàng",
  QUALITY_ALERT: "Cảnh báo chất lượng",
};
const EVENTS_EN = {
  WO_RELEASED: "New work order released",
  MATERIAL_NEEDED: "Prepare material for a work order",
  MATERIAL_ISSUED: "Material issued to the machine",
  WO_STARTED: "Work order started, first-article check needed",
  NG_REPORTED: "NG parts to handle",
  WO_ON_HOLD: "Work order on hold",
  DOWNTIME_REPORTED: "Machine stopped",
  WO_COMPLETED: "Work order finished, return leftover material",
  MAINT_REQUESTED: "New maintenance request",
  MAINT_WO_ASSIGNED: "Maintenance work order assigned",
  MAINT_VERIFY: "Repair done, waiting for acceptance",
  MAINT_DONE: "Maintenance completed, machine ready",
  QUALITY_ALERT: "Quality alert",
};
const EVENTS_JA = {
  WO_RELEASED: "新しい作業指示が発行されました",
  MATERIAL_NEEDED: "作業指示の材料を準備してください",
  MATERIAL_ISSUED: "材料が機械に払い出されました",
  WO_STARTED: "作業開始、初品検査が必要です",
  NG_REPORTED: "処理が必要な不良品があります",
  WO_ON_HOLD: "作業指示が保留されました",
  DOWNTIME_REPORTED: "機械停止",
  WO_COMPLETED: "作業完了、残材を返却してください",
  MAINT_REQUESTED: "新しい保全依頼",
  MAINT_WO_ASSIGNED: "保全作業が割り当てられました",
  MAINT_VERIFY: "修理完了、検収待ち",
  MAINT_DONE: "保全完了、機械使用可能",
  QUALITY_ALERT: "品質アラート",
};

export const translations = {
  vi: {
    notifications: {
      title: "Thông báo",
      all: "Tất cả",
      unread: "Chưa đọc",
      markAllRead: "Đánh dấu đã đọc tất cả",
      viewAll: "Xem tất cả thông báo",
      empty: "Không có thông báo",
      emptyUnread: "Bạn đã đọc hết thông báo",
      emptyHelp: "Thông báo về lệnh sản xuất, vật tư, chất lượng và bảo trì liên quan đến vai trò của bạn sẽ hiện ở đây.",
      loadError: "Không tải được thông báo.",
      by: "bởi",
      justNow: "vừa xong",
      minutesAgo: "{{count}} phút trước",
      hoursAgo: "{{count}} giờ trước",
      daysAgo: "{{count}} ngày trước",
      unreadCount: "{{count}} chưa đọc",
      last30Days: "Thông báo trong 30 ngày gần nhất",
      events: EVENTS_VI,
    },
  },
  en: {
    notifications: {
      title: "Notifications",
      all: "All",
      unread: "Unread",
      markAllRead: "Mark all as read",
      viewAll: "View all notifications",
      empty: "No notifications",
      emptyUnread: "You have read everything",
      emptyHelp: "Work order, material, quality and maintenance updates for your role appear here.",
      loadError: "Could not load notifications.",
      by: "by",
      justNow: "just now",
      minutesAgo: "{{count}} min ago",
      hoursAgo: "{{count}} h ago",
      daysAgo: "{{count}} d ago",
      unreadCount: "{{count}} unread",
      last30Days: "Notifications from the last 30 days",
      events: EVENTS_EN,
    },
  },
  ja: {
    notifications: {
      title: "通知",
      all: "すべて",
      unread: "未読",
      markAllRead: "すべて既読にする",
      viewAll: "すべての通知を見る",
      empty: "通知はありません",
      emptyUnread: "未読の通知はありません",
      emptyHelp: "あなたの役割に関係する作業指示・材料・品質・保全の通知がここに表示されます。",
      loadError: "通知を読み込めませんでした。",
      by: "担当",
      justNow: "たった今",
      minutesAgo: "{{count}}分前",
      hoursAgo: "{{count}}時間前",
      daysAgo: "{{count}}日前",
      unreadCount: "未読 {{count}}",
      last30Days: "直近30日の通知",
      events: EVENTS_JA,
    },
  },
};

Object.entries(translations).forEach(([language, translation]) => {
  i18n.addResourceBundle(language, "translation", translation, true, true);
});

export default translations;
