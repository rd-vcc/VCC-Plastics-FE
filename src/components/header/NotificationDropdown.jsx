import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Dropdown } from "../ui/dropdown/Dropdown";
import "../../pages/Account/Notifications/locales";
import { SEVERITY_COLORS, eventTitle, markNotificationsRead, timeAgo, useNotifications } from "../../pages/Account/Notifications/notificationApi";

const BELL = "M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z";

export function NotificationItem({ n, onOpen, compact }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={() => onOpen(n)}
      className={`flex w-full gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-gray-100 dark:hover:bg-white/[0.05] ${n.is_read ? "" : "bg-blue-50/70 dark:bg-blue-500/[0.08]"}`}
    >
      <span className="mt-1 h-2 w-2 flex-none rounded-full" style={{ background: SEVERITY_COLORS[n.severity] || SEVERITY_COLORS.INFO }} />
      <span className="min-w-0 flex-1">
        <span className={`block text-[11px] leading-4 text-gray-800 dark:text-gray-100 ${n.is_read ? "font-medium" : "font-bold"}`}>{eventTitle(n, t)}</span>
        {n.message ? <span className={`block text-[11px] leading-4 text-gray-600 dark:text-gray-300 ${compact ? "line-clamp-2" : ""}`}>{n.message}</span> : null}
        <span className="mt-0.5 block text-[10px] leading-4 text-gray-500 dark:text-gray-400">
          {n.ref_code ? <span className="font-semibold text-blue-600 dark:text-blue-400">{n.ref_code}</span> : null}
          {n.ref_code ? " · " : ""}{timeAgo(n.created_at, t)}
          {n.created_by && n.created_by !== "SYSTEM" ? ` · ${t("notifications.by")} ${n.created_by_label || n.created_by}` : ""}
        </span>
      </span>
      {!n.is_read ? <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-blue-600" aria-label={t("notifications.unread")} /> : null}
    </button>
  );
}

export function useOpenNotification() {
  const navigate = useNavigate();
  return (n) => {
    if (!n.is_read) markNotificationsRead([n.id]).catch(() => {});
    if (n.link) navigate(n.link);
  };
}

export default function NotificationDropdown() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { items, unread, error } = useNotifications({ limit: 15 });
  const openItem = useOpenNotification();
  const close = () => setIsOpen(false);

  return (
    <div className="relative">
      <button
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors dropdown-toggle hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={unread ? `${t("notifications.title")} (${unread})` : t("notifications.title")}
      >
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F04438] px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
        <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d={BELL} fill="currentColor" />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={close}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="mb-2 flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
          <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {t("notifications.title")}
            {unread ? <span className="ml-1.5 text-[11px] font-medium text-gray-500">{t("notifications.unreadCount", { count: unread })}</span> : null}
          </h5>
          {unread ? (
            <button type="button" onClick={() => markNotificationsRead().catch(() => {})} className="text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400">
              {t("notifications.markAllRead")}
            </button>
          ) : null}
        </div>

        <div className="-mx-1 flex-1 overflow-y-auto px-1">
          {error ? <p className="px-2 py-6 text-center text-[11px] text-red-600">{t("notifications.loadError")}</p> : null}
          {!error && !items.length ? (
            <div className="flex h-full items-center justify-center px-5 text-center">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("notifications.empty")}</p>
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{t("notifications.emptyHelp")}</p>
              </div>
            </div>
          ) : null}
          <div className="flex flex-col gap-0.5">
            {items.map((n) => <NotificationItem key={n.id} n={n} compact onOpen={(x) => { close(); openItem(x); }} />)}
          </div>
        </div>

        <Link
          to="/notifications"
          onClick={close}
          className="mt-2 block rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-center text-[11px] font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          {t("notifications.viewAll")}
        </Link>
      </Dropdown>
    </div>
  );
}
