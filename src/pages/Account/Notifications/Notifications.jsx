import { useState } from "react";
import { useTranslation } from "react-i18next";
import "./locales";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { NotificationItem, useOpenNotification } from "../../../components/header/NotificationDropdown";
import { markNotificationsRead, useNotifications } from "./notificationApi";

export default function Notifications() {
  const { t } = useTranslation();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { items, unread, error, loading } = useNotifications({ limit: 200, unread: unreadOnly });
  const openItem = useOpenNotification();
  const tab = (active) =>
    `h-[29px] rounded-md px-3 text-[11px] font-semibold transition ${active ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.05]"}`;

  return (
    <div>
      <PageMeta title={`${t("notifications.title")} | VCC Plastics`} description="Notifications - VCC Plastics Management System" />
      <PageBreadcrumb pageTitle={t("notifications.title")} />
      <div className="flex h-[calc(var(--app-vh,100vh)-150px)] w-full flex-col rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2 dark:border-gray-800">
          <div className="flex items-center gap-1">
            <button type="button" className={tab(!unreadOnly)} onClick={() => setUnreadOnly(false)}>{t("notifications.all")}</button>
            <button type="button" className={tab(unreadOnly)} onClick={() => setUnreadOnly(true)}>
              {t("notifications.unread")}{unread ? ` (${unread})` : ""}
            </button>
            <span className="ml-2 text-[10px] text-gray-500 dark:text-gray-400">{t("notifications.last30Days")}</span>
          </div>
          <button
            type="button"
            disabled={!unread}
            onClick={() => markNotificationsRead().catch(() => {})}
            className="h-[29px] rounded-md border border-gray-300 px-3 text-[11px] font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.05]"
          >
            {t("notifications.markAllRead")}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {error ? <p className="py-10 text-center text-[11px] text-red-600">{t("notifications.loadError")}</p> : null}
          {!error && !loading && !items.length ? (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">{unreadOnly ? t("notifications.emptyUnread") : t("notifications.empty")}</h3>
                <p className="mt-1 max-w-sm text-[11px] text-gray-500 dark:text-gray-400">{t("notifications.emptyHelp")}</p>
              </div>
            </div>
          ) : null}
          <div className="flex flex-col gap-0.5">
            {items.map((n) => <NotificationItem key={n.id} n={n} onOpen={openItem} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
