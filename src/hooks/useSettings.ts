'use client';

import { createContext, useContext } from 'react';

interface Settings {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  theme: 'light',
  fontSize: 'medium',
};

export const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
});

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
