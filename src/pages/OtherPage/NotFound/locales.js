import i18n from "../../../i18n";

export const translations = {
  "vi": {
    "errors": {
      "notFoundTitle": "Không tìm thấy trang",
      "notFoundDescription": "Trang bạn yêu cầu không tồn tại.",
      "backToDashboard": "Quay lại tổng quan"
    }
  },
  "en": {
    "errors": {
      "notFoundTitle": "Page not found",
      "notFoundDescription": "The requested page does not exist.",
      "backToDashboard": "Back to dashboard"
    }
  },
  "ja": {
    "errors": {
      "notFoundTitle": "ページが見つかりません",
      "notFoundDescription": "指定されたページは存在しません。",
      "backToDashboard": "ダッシュボードに戻る"
    }
  }
};

Object.entries(translations).forEach(([language, translation]) => {
  i18n.addResourceBundle(language, "translation", translation, true, true);
});

export default translations;
