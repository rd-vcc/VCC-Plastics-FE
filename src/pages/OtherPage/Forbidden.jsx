import { Link } from "react-router";
import { useTranslation } from "react-i18next";

export default function Forbidden() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="text-7xl font-bold text-brand-500">403</div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t("errors.forbiddenTitle")}</h1>
      <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
        {t("errors.forbiddenDescription")}
      </p>
      <Link className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600" to="/profile">
        {t("errors.backToProfile")}
      </Link>
    </div>
  );
}

