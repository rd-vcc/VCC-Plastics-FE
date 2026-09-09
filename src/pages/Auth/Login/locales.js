import i18n from "../../../i18n";

export const translations = {
  "vi": {
    "login": {
      "title": "Đăng nhập hệ thống",
      "description": "Sử dụng tài khoản VCC Group để đăng nhập.",
      "systemDescription": "Hệ thống quản lý sản xuất, máy móc, khuôn, chất lượng, vật tư và vận hành nhà máy VCC Plastics.",
      "username": "Tài khoản",
      "usernamePlaceholder": "Nhập mã nhân viên",
      "password": "Mật khẩu",
      "passwordPlaceholder": "Nhập mật khẩu",
      "showPassword": "Hiện mật khẩu",
      "hidePassword": "Ẩn mật khẩu",
      "submit": "Đăng nhập",
      "submitting": "Đang đăng nhập...",
      "required": "Vui lòng nhập đầy đủ tài khoản và mật khẩu.",
      "connectionError": "Không thể kết nối tới máy chủ VCC Group. Vui lòng kiểm tra địa chỉ API hoặc kết nối mạng.",
      "failed": "Đăng nhập thất bại. Vui lòng thử lại.",
      "verifiedBy": "Tài khoản đăng nhập được xác thực thông qua hệ thống VCC Group."
    }
  },
  "en": {
    "login": {
      "title": "Sign in",
      "description": "Use your VCC Group account to sign in.",
      "systemDescription": "Production, machine, mold, quality, material and factory operations management system for VCC Plastics.",
      "username": "Username",
      "usernamePlaceholder": "Enter employee code",
      "password": "Password",
      "passwordPlaceholder": "Enter password",
      "showPassword": "Show password",
      "hidePassword": "Hide password",
      "submit": "Sign in",
      "submitting": "Signing in...",
      "required": "Please enter both username and password.",
      "connectionError": "Cannot connect to the VCC Group server. Check the API address or network connection.",
      "failed": "Sign-in failed. Please try again.",
      "verifiedBy": "Your sign-in is authenticated through the VCC Group system."
    }
  },
  "ja": {
    "login": {
      "title": "システムにログイン",
      "description": "VCC Groupアカウントでログインしてください。",
      "systemDescription": "VCC Plasticsの生産、機械、金型、品質、材料、工場運営を管理するシステムです。",
      "username": "ユーザー名",
      "usernamePlaceholder": "社員コードを入力",
      "password": "パスワード",
      "passwordPlaceholder": "パスワードを入力",
      "showPassword": "パスワードを表示",
      "hidePassword": "パスワードを隠す",
      "submit": "ログイン",
      "submitting": "ログイン中...",
      "required": "ユーザー名とパスワードを入力してください。",
      "connectionError": "VCC Groupサーバーに接続できません。APIアドレスまたはネットワーク接続を確認してください。",
      "failed": "ログインに失敗しました。もう一度お試しください。",
      "verifiedBy": "ログイン認証はVCC Groupシステムを通じて行われます。"
    }
  }
};

Object.entries(translations).forEach(([language, translation]) => {
  i18n.addResourceBundle(language, "translation", translation, true, true);
});

export default translations;
