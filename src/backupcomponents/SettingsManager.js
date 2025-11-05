
// src/components/SettingsManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      await AsyncStorage.setItem('@prayer_app_settings', JSON.stringify(settings));
     // console.log('💾 تنظیمات ذخیره شد:', settings);
    } catch (error) {
     // console.error('Error saving settings:', error);
    }
  },

  async loadSettings() {
    try {
      const settingsJson = await AsyncStorage.getItem('@prayer_app_settings');
      //console.log('📖 تنظیمات لود شد:', settingsJson);
      return settingsJson ? JSON.parse(settingsJson) : defaultSettings;
    } catch (error) {
      //console.error('Error loading settings:', error);
      return defaultSettings;
    }
  },

  async resetToDefaults() {
    await this.saveSettings(defaultSettings);
    return defaultSettings;
  }
};
