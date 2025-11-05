// src/components/SettingsManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export class SettingsManager {
  static SETTINGS_KEY = '@prayer_app_settings';

  // Save settings to AsyncStorage
  static async saveSettings(settings) {
    try {
      console.log('💾 Saving settings to storage:', settings); // English log
      await AsyncStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
      console.log('✅ Settings saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      return false;
    }
  }

  // Load settings from AsyncStorage
  static async loadSettings() {
    try {
      const settingsJson = await AsyncStorage.getItem(this.SETTINGS_KEY);
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        console.log('📖 Settings loaded from storage:', settings); // English log
        return settings;
      }
      console.log('📖 No saved settings found');
      return null;
    } catch (error) {
      console.error('❌ Error loading settings:', error);
      return null;
    }
  }

  // Clear all settings
  static async clearSettings() {
    try {
      await AsyncStorage.removeItem(this.SETTINGS_KEY);
      console.log('🗑️ Settings cleared');
      return true;
    } catch (error) {
      console.error('❌ Error clearing settings:', error);
      return false;
    }
  }

  // Get default settings
  static getDefaultSettings() {
    return {
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
  }
}
