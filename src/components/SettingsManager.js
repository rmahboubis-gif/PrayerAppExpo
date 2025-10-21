// src/components/SettingsManager.js
import * as FileSystem from 'expo-file-system/legacy';

const SETTINGS_FILE = `${FileSystem.documentDirectory}app_settings.json`;

const defaultSettings = {
  fontFamily: 'System',
  theme: 'light',
  arabicSize: 22,
  persianSize: 16,
  lineHeight: 1.8,
  arabicBold: true,
  persianBold: false,
  isSyncMode: true,
  showArabic: true,
  showPersian: true
};

export const SettingsManager = {
  async saveSettings(settings) {
    try {
      await FileSystem.writeAsStringAsync(SETTINGS_FILE, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  },

  async loadSettings() {
    try {
      const fileInfo = await FileSystem.getInfoAsync(SETTINGS_FILE);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(SETTINGS_FILE);
        return { ...defaultSettings, ...JSON.parse(content) };
      }
      return defaultSettings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return defaultSettings;
    }
  },

  async resetToDefaults() {
    await this.saveSettings(defaultSettings);
    return defaultSettings;
  }
};
