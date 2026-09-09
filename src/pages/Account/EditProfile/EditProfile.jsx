import "./locales";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import { getCurrentUser } from "../../../auth/auth";
import { useTranslation } from "react-i18next";
export default function EditProfile() {
  const { t } = useTranslation();
  const user = getCurrentUser();
  const displayValue = (value) => {
    if (value === undefined || value === null || value === "") {
      return "—";
    }
    return String(value);
  };
  if (!user) {
    return (
      <>
        <PageMeta
          title={t("editProfile.metaTitle")}
          description={t("editProfile.metaDescription")}
        />

        <PageBreadcrumb pageTitle={t("editProfile.title")} />

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("editProfile.userNotFound")}
          </p>
        </div>
      </>
    );
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
  return (
    <>
      <PageMeta
        title={t("editProfile.metaTitle")}
        description={t("editProfile.signedInDescription")}
      />

      <PageBreadcrumb pageTitle={t("editProfile.title")} />

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
                  {t("editProfile.employeeCode")}:{" "}
                  <strong className="font-medium text-gray-700 dark:text-gray-300">
                    {displayValue(user.employee_code)}
                  </strong>
                </span>

                {user.position && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span>{user.position}</span>
                  </>
                )}

                {user.company && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span>{user.company}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PERSONAL INFORMATION */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {t("editProfile.personalInformation")}
            </h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("editProfile.personalDescription")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
            <InfoItem
              label={t("editProfile.employeeCode")}
              value={displayValue(user.employee_code)}
            />

            <InfoItem
              label={t("editProfile.fullName")}
              value={displayValue(user.full_name)}
            />

            <InfoItem
              label={t("editProfile.gender")}
              value={displayValue(user.gender)}
            />

            <InfoItem
              label={t("editProfile.birthDate")}
              value={displayValue(user.birth_date)}
            />

            <InfoItem
              label={t("editProfile.entryDate")}
              value={displayValue(user.entry_date)}
            />

            <InfoItem
              label={t("editProfile.phone")}
              value={displayValue(user.phone)}
            />

            <InfoItem
              label={t("editProfile.position")}
              value={displayValue(user.position)}
            />
          </div>
        </div>

        {/* ORGANIZATION INFORMATION */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {t("editProfile.organizationInformation")}
            </h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("editProfile.organizationDescription")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
            <InfoItem
              label={t("editProfile.corporation")}
              value={displayValue(user.corporation)}
            />

            <InfoItem
              label={t("editProfile.company")}
              value={displayValue(user.company)}
            />

            <InfoItem
              label={t("editProfile.factory")}
              value={displayValue(user.factory)}
            />

            <InfoItem
              label={t("editProfile.division")}
              value={displayValue(user.division)}
            />

            <InfoItem
              label={t("editProfile.subDivision")}
              value={displayValue(user.sub_division)}
            />

            <InfoItem
              label={t("editProfile.section")}
              value={displayValue(user.section)}
            />

            <InfoItem
              label={t("editProfile.group")}
              value={displayValue(user.group_name)}
            />
          </div>
        </div>

        {/* SYSTEM INFORMATION */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {t("editProfile.systemInformation")}
            </h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("editProfile.systemDescription")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
            <InfoItem
              label={t("editProfile.userId")}
              value={displayValue(user.id)}
            />

            <InfoItem label={t("editProfile.dataSource")} value="VCC Group" />

            <InfoItem
              label={t("editProfile.status")}
              value={t("editProfile.active")}
            />
          </div>
        </div>
      </div>
    </>
  );
}
function InfoItem({ label, value }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {label}
      </p>

      <p className="break-words text-sm font-medium text-gray-800 dark:text-white/90">
        {value}
      </p>
    </div>
  );
}
