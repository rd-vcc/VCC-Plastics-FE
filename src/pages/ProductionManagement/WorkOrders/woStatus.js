// Work Order lifecycle (spec 1.6.2) shared by Planning, Production Orders and Work Order Management.
export const WO_STATUSES = ["UNSCHEDULED", "SCHEDULED", "RELEASED", "IN_PRODUCTION", "ON_HOLD", "COMPLETED", "CLOSED", "CANCELLED"];

export const WO_STATUS_COLORS = {
  UNSCHEDULED: "#98A2B3", SCHEDULED: "#F79009", RELEASED: "#2E90FA", IN_PRODUCTION: "#12B76A",
  ON_HOLD: "#7A5AF8", COMPLETED: "#0E9384", CLOSED: "#475467", CANCELLED: "#F04438",
};

export const WO_STATUS_LABELS = {
  en: { UNSCHEDULED: "Created", SCHEDULED: "Queued", RELEASED: "Released", IN_PRODUCTION: "In Production", ON_HOLD: "On Hold", COMPLETED: "Completed", CLOSED: "Closed", CANCELLED: "Cancelled" },
  vi: { UNSCHEDULED: "Chưa lên lịch", SCHEDULED: "Chờ phát hành", RELEASED: "Đã phát hành", IN_PRODUCTION: "Đang sản xuất", ON_HOLD: "Tạm dừng", COMPLETED: "Hoàn thành", CLOSED: "Đã đóng", CANCELLED: "Đã hủy" },
  ja: { UNSCHEDULED: "作成済", SCHEDULED: "待機中", RELEASED: "リリース済", IN_PRODUCTION: "生産中", ON_HOLD: "保留", COMPLETED: "完了", CLOSED: "クローズ", CANCELLED: "取消" },
};

export const woStatusLabel = (language, value) => {
  const lang = String(language || "en").split("-")[0];
  return WO_STATUS_LABELS[lang]?.[value] || WO_STATUS_LABELS.en[value] || value || "—";
};
