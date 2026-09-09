import i18n from "../../../i18n";

export const translations = {
  "vi": {
    "systemSettings": {
      "title": "Cài đặt hệ thống",
      "languageTitle": "Ngôn ngữ mặc định toàn hệ thống",
      "languageDescription": "Áp dụng khi người dùng chưa chọn ngôn ngữ tạm thời. Lựa chọn riêng không được lưu vào tài khoản.",
      "currentDefault": "Ngôn ngữ mặc định hiện tại",
      "selectLabel": "Ngôn ngữ mặc định",
      "save": "Lưu ngôn ngữ mặc định",
      "saved": "Đã cập nhật ngôn ngữ mặc định toàn hệ thống.",
      "loadError": "Không thể tải cấu hình ngôn ngữ từ máy chủ.",
      "saveError": "Không thể cập nhật ngôn ngữ mặc định.",
      "temporaryNote": "Bộ chọn ngôn ngữ trên thanh trên cùng chỉ áp dụng tạm thời trong tab hiện tại."
    }
  },
  "en": {
    "systemSettings": {
      "title": "System Settings",
      "languageTitle": "System-wide default language",
      "languageDescription": "Used when a user has not selected a temporary language. Personal choices are not saved to user accounts.",
      "currentDefault": "Current default language",
      "selectLabel": "Default language",
      "save": "Save default language",
      "saved": "The system-wide default language was updated.",
      "loadError": "Unable to load language settings from the server.",
      "saveError": "Unable to update the default language.",
      "temporaryNote": "The language selector in the top bar applies only to the current browser tab."
    }
  },
  "ja": {
    "systemSettings": {
      "title": "システム設定",
      "languageTitle": "システム全体のデフォルト言語",
      "languageDescription": "ユーザーが一時言語を選択していない場合に使用されます。個人の選択はアカウントに保存されません。",
      "currentDefault": "現在のデフォルト言語",
      "selectLabel": "デフォルト言語",
      "save": "デフォルト言語を保存",
      "saved": "システム全体のデフォルト言語を更新しました。",
      "loadError": "サーバーから言語設定を読み込めません。",
      "saveError": "デフォルト言語を更新できません。",
      "temporaryNote": "トップバーの言語選択は現在のブラウザータブにのみ適用されます。"
    }
  }
};

Object.entries(translations).forEach(([language, translation]) => {
  i18n.addResourceBundle(language, "translation", translation, true, true);
});

export default translations;
