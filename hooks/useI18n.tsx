/**
 * Lightweight i18n — КЛГ АСУ ТК.
 * Supports Russian and English.
 */
'use client';
import { useState, useCallback, createContext, useContext, ReactNode } from 'react';

type Locale = 'ru' | 'en';

const translations: Record<Locale, Record<string, string>> = {
  ru: {
    'nav.dashboard': 'Дашборд',
    'nav.organizations': 'Организации',
    'nav.aircraft': 'ВС и типы',
    'nav.applications': 'Заявки',
    'nav.checklists': 'Чек-листы',
    'nav.audits': 'Аудиты',
    'nav.risks': 'Предупреждения о рисках',
    'nav.users': 'Пользователи',
    'nav.monitoring': 'Мониторинг',
    'nav.logout': 'Выйти',
    'common.loading': 'Загрузка...',
    'common.total': 'Всего',
    'common.search': 'Поиск...',
    'common.add': 'Добавить',
    'common.edit': 'Редактировать',
    'common.delete': 'Удалить',
    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
    'common.close': 'Закрыть',
    'common.all': 'Все',
    'common.back': '← Назад',
    'common.forward': 'Вперёд →',
    'common.page': 'Стр.',
    'common.of': 'из',
    'common.noData': 'Нет данных',
    'common.confirm': 'Подтвердить',
    'status.active': 'Активен',
    'status.inactive': 'Неактивен',
    'status.draft': 'Черновик',
    'status.submitted': 'Подана',
    'status.approved': 'Одобрена',
    'status.rejected': 'Отклонена',
    'status.completed': 'Завершён',
    'status.in_progress': 'В процессе',
    'role.admin': 'Администратор',
    'role.authority_inspector': 'Инспектор',
    'role.operator_manager': 'Менеджер оператора',
    'role.operator_user': 'Оператор',
    'role.mro_manager': 'Менеджер ТОиР',
    'role.mro_user': 'Специалист ТОиР',
  },
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.organizations': 'Organizations',
    'nav.aircraft': 'Aircraft',
    'nav.applications': 'Applications',
    'nav.checklists': 'Checklists',
    'nav.audits': 'Audits',
    'nav.risks': 'Risk Alerts',
    'nav.users': 'Users',
    'nav.monitoring': 'Monitoring',
    'nav.logout': 'Logout',
    'common.loading': 'Loading...',
    'common.total': 'Total',
    'common.search': 'Search...',
    'common.add': 'Add',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.all': 'All',
    'common.back': '← Back',
    'common.forward': 'Next →',
    'common.page': 'Page',
    'common.of': 'of',
    'common.noData': 'No data',
    'common.confirm': 'Confirm',
    'status.active': 'Active',
    'status.inactive': 'Inactive',
    'status.draft': 'Draft',
    'status.submitted': 'Submitted',
    'status.approved': 'Approved',
    'status.rejected': 'Rejected',
    'status.completed': 'Completed',
    'status.in_progress': 'In Progress',
    'role.admin': 'Administrator',
    'role.authority_inspector': 'Inspector',
    'role.operator_manager': 'Operator Manager',
    'role.operator_user': 'Operator User',
    'role.mro_manager': 'MRO Manager',
    'role.mro_user': 'MRO Specialist',
  },
};

interface I18nCtx { locale: Locale; setLocale: (l: Locale) => void; t: (key: string) => string; }

const I18nContext = createContext<I18nCtx>({ locale: 'ru', setLocale: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof localStorage !== 'undefined') {
      return (localStorage.getItem('klg-locale') as Locale) || 'ru';
    }
    return 'ru';
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof localStorage !== 'undefined') localStorage.setItem('klg-locale', l);
  }, []);

  const t = useCallback((key: string) => translations[locale]?.[key] || translations.ru[key] || key, [locale]);

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() { return useContext(I18nContext); }
