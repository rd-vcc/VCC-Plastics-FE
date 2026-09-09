import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
export default function Notifications() {
  return (
    <div>
      <PageMeta
        title="Notifications | VCC Plastics"
        description="Notifications - VCC Plastics Management System"
      />
      <PageBreadcrumb pageTitle="Notifications" />
      <div className="min-h-[calc(100vh-112px)] w-full rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex min-h-[calc(100vh-138px)] w-full items-center justify-center text-center">
          <div>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-gray-400">
              <svg
                width="24"
                height="24"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591H5.12504V9.16748C5.12504 6.47509 7.30765 4.29248 10 4.29248C12.6924 4.29248 14.875 6.47509 14.875 9.16748V14.4591ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Chưa có thông báo
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Khu vực này đã sẵn sàng để bổ sung dữ liệu thông báo sau.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
