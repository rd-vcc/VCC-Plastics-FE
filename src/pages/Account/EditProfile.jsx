import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { getCurrentUser } from "../../auth/auth";
export default function EditProfile() {
    const user = getCurrentUser();
    const displayValue = (value) => {
        if (value === undefined ||
            value === null ||
            value === "") {
            return "—";
        }
        return String(value);
    };
    if (!user) {
        return (<>
        <PageMeta title="Thông tin nhân viên | VCC Plastics" description="Thông tin nhân viên VCC Plastics"/>

        <PageBreadcrumb pageTitle="Thông tin nhân viên"/>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Không tìm thấy thông tin người dùng.
          </p>
        </div>
      </>);
    }
    const initials = user.full_name
        ? user.full_name
            .trim()
            .split(/\s+/)
            .slice(-2)
            .map((item) => item.charAt(0))
            .join("")
            .toUpperCase()
        : "U";
    return (<>
      <PageMeta title="Thông tin nhân viên | VCC Plastics" description="Thông tin nhân viên đang đăng nhập"/>

      <PageBreadcrumb pageTitle="Thông tin nhân viên"/>

      <div className="space-y-6">
        {/* EMPLOYEE HEADER */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-50 text-2xl font-semibold text-brand-500 dark:bg-brand-500/10">
              {initials}
            </div>

            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                {displayValue(user.full_name)}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                <span>
                  Mã nhân viên:{" "}
                  <strong className="font-medium text-gray-700 dark:text-gray-300">
                    {displayValue(user.employee_code)}
                  </strong>
                </span>

                {user.position && (<>
                    <span className="hidden sm:inline">•</span>
                    <span>{user.position}</span>
                  </>)}

                {user.company && (<>
                    <span className="hidden sm:inline">•</span>
                    <span>{user.company}</span>
                  </>)}
              </div>
            </div>
          </div>
        </div>

        {/* PERSONAL INFORMATION */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Thông tin cá nhân
            </h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Thông tin nhân viên được lấy từ hệ thống VCC Group.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
            <InfoItem label="Mã nhân viên" value={displayValue(user.employee_code)}/>

            <InfoItem label="Họ và tên" value={displayValue(user.full_name)}/>

            <InfoItem label="Giới tính" value={displayValue(user.gender)}/>

            <InfoItem label="Ngày sinh" value={displayValue(user.birth_date)}/>

            <InfoItem label="Ngày vào công ty" value={displayValue(user.entry_date)}/>

            <InfoItem label="Số điện thoại" value={displayValue(user.phone)}/>

            <InfoItem label="Chức vụ" value={displayValue(user.position)}/>
          </div>
        </div>

        {/* ORGANIZATION INFORMATION */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Cơ cấu tổ chức
            </h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Thông tin cơ cấu tổ chức được đồng bộ từ VCC Group.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
            <InfoItem label="Tập đoàn" value={displayValue(user.corporation)}/>

            <InfoItem label="Công ty" value={displayValue(user.company)}/>

            <InfoItem label="Nhà máy" value={displayValue(user.factory)}/>

            <InfoItem label="Division" value={displayValue(user.division)}/>

            <InfoItem label="Sub Division" value={displayValue(user.sub_division)}/>

            <InfoItem label="Section" value={displayValue(user.section)}/>

            <InfoItem label="Group" value={displayValue(user.group_name)}/>
            
          </div>
        </div>

        {/* SYSTEM INFORMATION */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Thông tin hệ thống
            </h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Thông tin liên kết tài khoản hiện tại.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
            <InfoItem label="User ID" value={displayValue(user.id)}/>

            <InfoItem label="Nguồn dữ liệu" value="VCC Group"/>

            <InfoItem label="Trạng thái" value="Đang hoạt động"/>
          </div>
        </div>
      </div>
    </>);
}
function InfoItem({ label, value, }) {
    return (<div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {label}
      </p>

      <p className="break-words text-sm font-medium text-gray-800 dark:text-white/90">
        {value}
      </p>
    </div>);
}
