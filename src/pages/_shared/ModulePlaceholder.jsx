import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useTranslation } from "react-i18next";
import { toTranslationSlug } from "../../i18n";
export default function ModulePlaceholder({ title }) {
    const { t } = useTranslation();
    const translatedTitle = t(`navigation.${toTranslationSlug(title)}`, { defaultValue: title });
    return (<div>
      <PageMeta title={`${translatedTitle} | VCC Plastics`} description={`${translatedTitle} - VCC Plastics Management System`}/>
      <PageBreadcrumb pageTitle={title}/>
      <div className="min-h-[calc(100vh-112px)] w-full rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex min-h-[calc(100vh-138px)] w-full items-center justify-center text-center">
          <div>
            <h3 className="mb-3 text-xl font-semibold text-gray-800 dark:text-white/90">
              {translatedTitle}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
              {t("placeholder.ready")}
            </p>
          </div>
        </div>
      </div>
    </div>);
}

