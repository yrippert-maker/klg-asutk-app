export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'ru' | 'en';
  notifications: {
    email: boolean;
    push: boolean;
    sound: boolean;
    criticalOnly: boolean;
  };
  export: {
    defaultFormat: 'excel' | 'csv' | 'pdf' | 'json';
    includeHeaders: boolean;
    autoExport: boolean;
  };
  pagination: {
    itemsPerPage: number;
    showTotal: boolean;
  };
  dataRefresh: {
    autoRefresh: boolean;
    refreshInterval: number;
  };
  display: {
    compactMode: boolean;
    showTooltips: boolean;
    animations: boolean;
  };
  shortcuts: {
    enabled: boolean;
    showHints: boolean;
  };
}

export const defaultPreferences: UserPreferences = {
  theme: 'light',
  language: 'ru',
  notifications: {
    email: true,
    push: true,
    sound: true,
    criticalOnly: false,
  },
  export: {
    defaultFormat: 'excel',
    includeHeaders: true,
    autoExport: false,
  },
  pagination: {
    itemsPerPage: 50,
    showTotal: true,
  },
  dataRefresh: {
    autoRefresh: true,
    refreshInterval: 5,
  },
  display: {
    compactMode: false,
    showTooltips: true,
    animations: true,
  },
  shortcuts: {
    enabled: true,
    showHints: true,
  },
};

export type SettingsTabId = 'general' | 'notifications' | 'export' | 'display' | 'advanced' | 'ai-access';

export type PreferencesUpdater =
  | Partial<UserPreferences>
  | ((prev: UserPreferences) => UserPreferences);
