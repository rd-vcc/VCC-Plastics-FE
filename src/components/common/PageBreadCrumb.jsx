import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { toTranslationSlug } from "../../i18n";
const segmentKeyMap = { iot: "iot-configuration" };
const formatSegment = (segment) => segment
        .split("-")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
const Chevron = () => (<svg className="h-4 w-4 shrink-0 stroke-current text-gray-400 dark:text-gray-600" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M6 12L10 8L6 4" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>);
const PageBreadcrumb = ({ pageTitle }) => {
    const { t } = useTranslation();
    const { pathname } = useLocation();
    const segments = pathname.split("/").filter(Boolean);
    const parentSegments = segments.slice(0, -1);
    return (<nav className="mb-2 w-full" aria-label="Breadcrumb">
      <ol className="flex min-h-7 flex-wrap items-center gap-x-1 gap-y-1 text-sm">
        <li className="flex items-center gap-1">
          <Link className="font-medium text-gray-500 transition hover:text-[#005BAB] dark:text-gray-400 dark:hover:text-white" to="/">
            {t("common.home")}
          </Link>
          <Chevron />
        </li>

        {pathname === "/" ? (<li className="font-medium text-gray-800 dark:text-white/90">{t("navigation.dashboard")}</li>) : (<>
            {parentSegments.map((segment, index) => {
                const targetPath = `/${segments.slice(0, index + 1).join("/")}`;
                return (<li key={targetPath} className="flex items-center gap-1">
                  <span className="font-medium text-gray-500 dark:text-gray-400">
                    {t(`navigation.${segmentKeyMap[segment] || segment}`, { defaultValue: formatSegment(segment) })}
                  </span>
                  <Chevron />
                </li>);
            })}
            <li className="font-medium text-gray-800 dark:text-white/90">{t(`navigation.${toTranslationSlug(pageTitle)}`, { defaultValue: pageTitle })}</li>
          </>)}
      </ol>
    </nav>);
};
export default PageBreadcrumb;

