import i18n from "../../../i18n";

export const translations = {
  "vi": {
    "editProfile": {
      "title": "Thông tin nhân viên",
      "metaTitle": "Thông tin nhân viên | VCC Plastics",
      "metaDescription": "Thông tin nhân viên VCC Plastics",
      "signedInDescription": "Thông tin nhân viên đang đăng nhập",
      "userNotFound": "Không tìm thấy thông tin người dùng.",
      "employeeCode": "Mã nhân viên",
      "personalInformation": "Thông tin cá nhân",
      "personalDescription": "Thông tin nhân viên được lấy từ hệ thống VCC Group.",
      "fullName": "Họ và tên",
      "gender": "Giới tính",
      "birthDate": "Ngày sinh",
      "entryDate": "Ngày vào công ty",
      "phone": "Số điện thoại",
      "position": "Chức vụ",
      "organizationInformation": "Cơ cấu tổ chức",
      "organizationDescription": "Thông tin cơ cấu tổ chức được đồng bộ từ VCC Group.",
      "corporation": "Tập đoàn",
      "company": "Công ty",
      "factory": "Nhà máy",
      "division": "Khối",
      "subDivision": "Phân khối",
      "section": "Bộ phận",
      "group": "Nhóm",
      "systemInformation": "Thông tin hệ thống",
      "systemDescription": "Thông tin liên kết tài khoản hiện tại.",
      "userId": "Mã người dùng",
      "dataSource": "Nguồn dữ liệu",
      "status": "Trạng thái",
      "active": "Đang hoạt động"
    }
  },
  "en": {
    "editProfile": {
      "title": "Employee Profile",
      "metaTitle": "Employee Profile | VCC Plastics",
      "metaDescription": "VCC Plastics employee information",
      "signedInDescription": "Information for the signed-in employee",
      "userNotFound": "User information was not found.",
      "employeeCode": "Employee Code",
      "personalInformation": "Personal Information",
      "personalDescription": "Employee information is retrieved from the VCC Group system.",
      "fullName": "Full Name",
      "gender": "Gender",
      "birthDate": "Date of Birth",
      "entryDate": "Company Entry Date",
      "phone": "Phone Number",
      "position": "Position",
      "organizationInformation": "Organization Structure",
      "organizationDescription": "Organization information is synchronized from VCC Group.",
      "corporation": "Corporation",
      "company": "Company",
      "factory": "Factory",
      "division": "Division",
      "subDivision": "Sub Division",
      "section": "Section",
      "group": "Group",
      "systemInformation": "System Information",
      "systemDescription": "Information linked to the current account.",
      "userId": "User ID",
      "dataSource": "Data Source",
      "status": "Status",
      "active": "Active"
    }
  },
  "ja": {
    "editProfile": {
      "title": "従業員情報",
      "metaTitle": "従業員情報 | VCC Plastics",
      "metaDescription": "VCC Plasticsの従業員情報",
      "signedInDescription": "ログイン中の従業員情報",
      "userNotFound": "ユーザー情報が見つかりません。",
      "employeeCode": "社員コード",
      "personalInformation": "個人情報",
      "personalDescription": "従業員情報はVCC Groupシステムから取得されます。",
      "fullName": "氏名",
      "gender": "性別",
      "birthDate": "生年月日",
      "entryDate": "入社日",
      "phone": "電話番号",
      "position": "役職",
      "organizationInformation": "組織構成",
      "organizationDescription": "組織構成情報はVCC Groupから同期されます。",
      "corporation": "グループ",
      "company": "会社",
      "factory": "工場",
      "division": "事業部",
      "subDivision": "サブ事業部",
      "section": "部門",
      "group": "グループ",
      "systemInformation": "システム情報",
      "systemDescription": "現在のアカウントに連携された情報です。",
      "userId": "ユーザーID",
      "dataSource": "データソース",
      "status": "状態",
      "active": "有効"
    }
  }
};

Object.entries(translations).forEach(([language, translation]) => {
  i18n.addResourceBundle(language, "translation", translation, true, true);
});

export default translations;
