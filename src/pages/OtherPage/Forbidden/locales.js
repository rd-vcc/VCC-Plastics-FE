import i18n from "../../../i18n";

export const translations = {
  "vi": {
    "errors": {
      "forbiddenTitle": "Không có quyền truy cập",
      "forbiddenDescription": "Bạn không có quyền xem trang này. Hãy liên hệ quản trị viên hệ thống nếu cần được cấp quyền.",
      "backToProfile": "Quay lại hồ sơ"
    }
  },
  "en": {
    "errors": {
      "forbiddenTitle": "Access denied",
      "forbiddenDescription": "You do not have permission to view this page. Contact the system administrator if you need access.",
      "backToProfile": "Back to profile"
    }
  },
  "ja": {
    "errors": {
      "forbiddenTitle": "アクセス権がありません",
      "forbiddenDescription": "このページを表示する権限がありません。必要な場合はシステム管理者にお問い合わせください。",
      "backToProfile": "プロフィールに戻る"
    }
  }
};

Object.entries(translations).forEach(([language, translation]) => {
  i18n.addResourceBundle(language, "translation", translation, true, true);
});

export default translations;
