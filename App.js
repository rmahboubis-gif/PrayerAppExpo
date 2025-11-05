import React, { useState, useEffect } from 'react';
import PrayerDisplay from './src/components/PrayerDisplay';
import Settings from './src/components/Settings';
import VoicePlayer from './src/components/VoicePlayer';
import { getAllPrayers } from './src/components/PrayerManager';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Modal, BackHandler, Alert } from 'react-native';
import { SettingsManager } from './src/components/SettingsManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to find section by time
const findSectionByTime = (currentTime, timestamps) => {
  if (!timestamps || timestamps.length === 0) return { index: 0 };
  
  const sortedTimestamps = [...timestamps].sort((a, b) => a.startTime - b.startTime);

  for (let i = 0; i < sortedTimestamps.length; i++) {
    const currentSection = sortedTimestamps[i];
    const nextSection = sortedTimestamps[i + 1];

    if (currentTime >= currentSection.startTime &&
        (!nextSection || currentTime < nextSection.startTime)) {
      return {
        index: currentSection.sectionIndex,
        timestamp: currentSection
      };
    }
  }

  return sortedTimestamps[0] || { index: 0 };
};

const formatTime = (millis) => {
  if (!millis) return '0:00';
  const minutes = Math.floor(millis / 60000);
  const seconds = Math.floor((millis % 60000) / 1000);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function App() {
  const [prayerPosition, setPrayerPosition] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentScreen, setCurrentScreen] = useState('main');
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [globalSoundRef, setGlobalSoundRef] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [timestamps, setTimestamps] = useState([]);

  const [settings, setSettings] = useState({
    fontFamily: 'System',
    theme: 'light',
    arabicSize: 22,
    persianSize: 16,
    lineHeight: 1.8,
    arabicBold: true,
    persianBold: false,
    isSyncMode: true,
    showArabic: true,
    showPersian: true,
    heightVersion: 1
  });

  // Load settings on app start
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const savedSettings = await SettingsManager.loadSettings();
    if (savedSettings) {
      setSettings(savedSettings);
    } else {
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
      setSettings(defaultSettings);
      await SettingsManager.saveSettings(defaultSettings);
    }
  };

  // Save prayer state when exiting prayer
  const savePrayerState = async (prayerId, state) => {
    try {
      console.log('💾 Saving to AsyncStorage:', prayerId, state);
      await AsyncStorage.setItem(`@prayer_state_${prayerId}`, JSON.stringify(state));
      console.log('✅ Save successful');
    } catch (error) {
      console.error('❌ Save error:', error);
    }
  };

  // Load prayer state when entering prayer
  const loadPrayerState = async (prayerId) => {
    try {
      const stateJson = await AsyncStorage.getItem(`@prayer_state_${prayerId}`);
      return stateJson ? JSON.parse(stateJson) : null;
    } catch (error) {
      console.error('Error loading prayer state:', error);
      return null;
    }
  };

  // Handle back button press
const handleBack = async () => {
  console.log('🔙 handleBack called', {
    currentScreen,
    selectedPrayer: selectedPrayer?.id,
    prayerPosition,
    currentSectionIndex
  });

  if (currentScreen === 'prayer' && selectedPrayer) {
    let finalPosition = prayerPosition;

    // قطع صوت هنگام خروج
    if (globalSoundRef) {
      try {
        const status = await globalSoundRef.getStatusAsync();
        if (status.isLoaded) {
          finalPosition = status.positionMillis;
          await globalSoundRef.stopAsync(); // 🔥 قطع صوت
          await globalSoundRef.unloadAsync(); // 🔥 آزاد کردن منابع
          console.log('🎵 Audio stopped and unloaded in handleBack');
        }
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
    }

    const currentState = {
      position: finalPosition,
      sectionIndex: currentSectionIndex
    };

    console.log('💾 Saving position in handleBack:', {
      prayer: selectedPrayer.id,
      position: finalPosition,
      sectionIndex: currentSectionIndex
    });

    await savePrayerState(selectedPrayer.id, currentState);
  }

  setCurrentScreen('main');
  setSelectedPrayer(null);
  setCurrentSectionIndex(0);
  setGlobalSoundRef(null); // 🔥 پاک کردن رفرنس
};

  // Load timestamps for prayer
  const loadTimestampsForPrayer = async (prayerId) => {
    try {
      console.log('📊 Loading timestamps for:', prayerId);
      setTimestamps([]); // Empty for now
    } catch (error) {
      console.error('❌ Error loading timestamps:', error);
      setTimestamps([]);
    }
  };

  // Handle settings change
  const handleSettingsChange = (newSettings) => {
    console.log('🔄 Settings changed:', newSettings);
    setSettings(newSettings);
    SettingsManager.saveSettings(newSettings);
  };

  // Back handler
// Back handler
useEffect(() => {
  const backHandler = BackHandler.addEventListener('hardwareBackPress', async () => { // async اضافه شد
    if (showAbout) {
      setShowAbout(false);
      return true;
    }
    if (showSettings) {
      setShowSettings(false);
      return true;
    }
    if (showMenu) {
      setShowMenu(false);
      return true;
    }
    if (showExitConfirm) {
      setShowExitConfirm(false);
      return true;
    }

    if (currentScreen !== 'main') {
      await handleBack(); // await اضافه شد
      return true;
    }

    setShowExitConfirm(true);
    return true;
  });

  return () => backHandler.remove();
}, [currentScreen, showMenu, showSettings, showAbout, showExitConfirm, handleBack]);
  // Load prayer state when entering prayer screen
// 1. وقتی وارد صفحه دعا شدیم، state را لود کن
useEffect(() => {
  if (currentScreen === 'prayer' && selectedPrayer) {
    loadPrayerState(selectedPrayer.id).then(state => {
      if (state) {
        console.log('📖 Prayer state loaded:', selectedPrayer.id, state);
        setCurrentSectionIndex(state.sectionIndex || 0);

        if (state.position && globalSoundRef) {
          setTimeout(() => {
            globalSoundRef.setPositionAsync(state.position);
            setPrayerPosition(state.position);
          }, 1000);
        }
      }
    });

    loadTimestampsForPrayer(selectedPrayer.id);
  }
}, [currentScreen, selectedPrayer]); // globalSoundRef را حذف کنید

// 2. وقتی globalSoundRef آماده شد، موقعیت را تنظیم کن
useEffect(() => {
  if (currentScreen === 'prayer' && selectedPrayer && globalSoundRef) {
    loadPrayerState(selectedPrayer.id).then(state => {
      if (state && state.position) {
        setTimeout(() => {
          globalSoundRef.setPositionAsync(state.position);
          setPrayerPosition(state.position);
        }, 1000);
      }
    });
  }
}, [globalSoundRef, currentScreen, selectedPrayer]);


  // Audio position tracking
  useEffect(() => {
    if (currentScreen === 'prayer' && selectedPrayer && timestamps.length > 0) {
      const newSection = findSectionByTime(prayerPosition, timestamps);
      if (newSection && newSection.index !== currentSectionIndex) {
        console.log(`🔄 Audio position ${formatTime(prayerPosition)} -> section ${newSection.index}`);
        setCurrentSectionIndex(newSection.index);
      }
    }
  }, [prayerPosition, currentScreen, selectedPrayer, timestamps, currentSectionIndex]);

  const prayers = getAllPrayers();

  const menuItems = [
    { id: 'main', title: 'Main Page', icon: '🏠' },
    { id: 'settings', title: 'Settings', icon: '⚙' },
    { id: 'about', title: 'About App', icon: 'ℹ' },
  ];

const handleMenuSelect = async (itemId) => {
  setShowMenu(false);
  
  // اگر در صفحه دعا هستیم و به صفحه اصلی می‌رویم، handleBack را صدا بزن
  if (currentScreen === 'prayer' && itemId === 'main') {
    await handleBack();
    return; // 🔥 این خط را اضافه کنید - بعد از handleBack برگرد
  }
  
  switch(itemId) {
    case 'main':
      setCurrentScreen('main');
      setSelectedPrayer(null);
      if (globalSoundRef) {
        globalSoundRef.stopAsync();
      }
      break;
    case 'settings':
      setShowSettings(true);
      break;
    case 'about':
      setShowAbout(true);
      break;
    default:
      break;
  }
};




  const renderExitConfirm = () => {
    const themeStyles = getThemeStyles();

    return (
      <Modal
        visible={showExitConfirm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExitConfirm(false)}
      >
        <View style={styles.settingsOverlay}>
          <View style={[styles.settingsContainer, themeStyles.container]}>
            <Text style={[styles.settingsTitle, themeStyles.headerTitle]}>
              Exit App
            </Text>
            <Text style={[styles.settingsMessage, themeStyles.menuText]}>
              Are you sure you want to exit the app?
            </Text>
            <View style={styles.settingsButtons}>
              <TouchableOpacity
                style={[styles.settingsButton, themeStyles.cancelButton]}
                onPress={() => setShowExitConfirm(false)}
              >
                <Text style={[styles.settingsButtonText, themeStyles.buttonText]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.settingsButton, themeStyles.applyButton]}
                onPress={() => BackHandler.exitApp()}
              >
                <Text style={[styles.settingsButtonText, themeStyles.buttonText]}>
                  Exit
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderAbout = () => {
    return (
      <Modal
        visible={showAbout}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAbout(false)}
      >
        <View style={styles.aboutOverlay}>
          <View style={styles.aboutContainer}>
            <Text style={styles.aboutTitle}>About App</Text>
            <ScrollView style={styles.aboutContent}>
              <Text style={styles.aboutText}>
                🌙 Spiritual Prayers App
                {"\n\n"}
                This app is developed for easy access to religious and spiritual prayers.
                {"\n\n"}
                ✨ Features:
                • Audio playback of prayers
                • Arabic and Persian text display
                • Font and size customization
                • Multiple theme support
                • Simple and beautiful UI
                {"\n\n"}
                📱 Developed with:
                React Native + Expo
                {"\n\n"}
                🙏 We hope this app is useful for you.
                {"\n\n"}
                🔄 Version: 1.0.0
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.aboutCloseButton}
              onPress={() => setShowAbout(false)}
            >
              <Text style={styles.aboutCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const getThemeStyles = () => {
    const themeStyles = {
      light: {
        container: { backgroundColor: '#f5f5f5' },
        header: { backgroundColor: '#ffffff' },
        headerTitle: { color: '#333333' },
        menuButtonText: { color: '#000000' },
        menuContainer: { backgroundColor: '#ffffff' },
        menuTitle: { color: '#333333' },
        menuText: { color: '#333333' },
        menuItem: { borderBottomColor: '#f0f0f0' },
        mainContainer: { backgroundColor: '#f5f5f5' },
        prayerItem: { backgroundColor: '#ffffff' },
        prayerTitle: { color: '#333333' },
        prayerDescription: { color: '#666666' },
        cancelButton: { backgroundColor: '#6c757d' },
        applyButton: { backgroundColor: '#007bff' },
        buttonText: { color: 'white' }
      },
      dark: {
        container: { backgroundColor: '#1a1a1a' },
        header: { backgroundColor: '#2d2d2d' },
        headerTitle: { color: '#ffffff' },
        menuButtonText: { color: '#ffffff' },
        menuContainer: { backgroundColor: '#2d2d2d' },
        menuTitle: { color: '#ffffff' },
        menuText: { color: '#ffffff' },
        menuItem: { borderBottomColor: '#404040' },
        mainContainer: { backgroundColor: '#1a1a1a' },
        prayerItem: { backgroundColor: '#2d2d2d' },
        prayerTitle: { color: '#ffffff' },
        prayerDescription: { color: '#cccccc' },
        cancelButton: { backgroundColor: '#404040' },
        applyButton: { backgroundColor: '#0d6efd' },
        buttonText: { color: 'white' }
      },
      amber: {
        container: { backgroundColor: '#fef9e7' },
        header: { backgroundColor: '#fcf3cf' },
        headerTitle: { color: '#333333' },
        menuButtonText: { color: '#000000' },
        menuContainer: { backgroundColor: '#fcf3cf' },
        menuTitle: { color: '#333333' },
        menuText: { color: '#333333' },
        menuItem: { borderBottomColor: '#e6d9a5' },
        mainContainer: { backgroundColor: '#fef9e7' },
        prayerItem: { backgroundColor: '#fcf3cf' },
        prayerTitle: { color: '#333333' },
        prayerDescription: { color: '#666666' },
        cancelButton: { backgroundColor: '#e6d9a5' },
        applyButton: { backgroundColor: '#e67e22' },
        buttonText: { color: 'white' }
      }
    };

    return themeStyles[settings.theme] || themeStyles.light;
  };

  const renderMenu = () => {
    const themeStyles = getThemeStyles();

    return (
      <Modal
        visible={showMenu}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowMenu(false)}
      >
        <View style={styles.menuOverlay}>
          <TouchableOpacity
            style={styles.menuOverlayTouchable}
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
          />
          <View style={[styles.menuContainer, themeStyles.menuContainer]}>
            <ScrollView style={styles.menuScroll}>
              <Text style={[styles.menuTitle, themeStyles.menuTitle]}>App Menu</Text>
              {menuItems.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, themeStyles.menuItem]}
                  onPress={() => handleMenuSelect(item.id)}
                >
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={[styles.menuText, themeStyles.menuText]}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderHeader = () => {
    const themeStyles = getThemeStyles();

    return (
      <View style={[styles.header, themeStyles.header]}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setShowMenu(true)}>
          <Text style={[styles.menuButtonText, themeStyles.menuButtonText]}>☰</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, themeStyles.headerTitle]}>
          {currentScreen === 'main' ? 'Spiritual Prayers' :
           currentScreen === 'prayer' ? selectedPrayer?.title :
           'Prayer App'}
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>
    );
  };

  const renderPrayerHeader = () => (
    <View style={styles.prayerHeader}>
      <VoicePlayer
        settings={settings}
        currentPrayerId={selectedPrayer?.id || 'p1'}
        onSoundRefReady={setGlobalSoundRef}
        onPositionChange={setPrayerPosition}
      />
    </View>
  );

  const handlePrayerSelect = (prayer) => {
    setSelectedPrayer(prayer);
    setCurrentScreen('prayer');
    setCurrentSectionIndex(0);
  };

  const renderMainScreen = () => {
    const themeStyles = getThemeStyles();

    return (
      <View style={[styles.mainContainer, themeStyles.mainContainer]}>
        <ScrollView style={styles.prayerList}>
          {prayers.map(prayer => (
            <TouchableOpacity
              key={prayer.id}
              style={[styles.prayerItem, themeStyles.prayerItem]}
              onPress={() => handlePrayerSelect(prayer)}
            >
              <View style={styles.prayerContent}>
                <Text style={[styles.prayerTitle, themeStyles.prayerTitle]}>{prayer.title}</Text>
                <Text style={[styles.prayerDescription, themeStyles.prayerDescription]}>
                  {prayer.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderPrayerScreen = () => (
    <View style={styles.prayerContainer}>
      {renderPrayerHeader()}
      <PrayerDisplay
        settings={settings}
        currentPrayerId={selectedPrayer?.id || 'p1'}
        soundRef={globalSoundRef}
        isSyncMode={settings.isSyncMode}
        currentSectionIndex={currentSectionIndex}
        onSectionIndexChange={setCurrentSectionIndex}
      />
    </View>
  );

  const themeStyles = getThemeStyles();
  return (
    <View style={[styles.container, themeStyles.container]}>
      {renderHeader()}
      <View style={styles.content}>
        {currentScreen === 'main' && renderMainScreen()}
        {currentScreen === 'prayer' && renderPrayerScreen()}
      </View>

      {renderMenu()}

      {showSettings && (
        <View style={styles.settingsOverlay}>
          <Settings
            visible={true}
            onClose={() => setShowSettings(false)}
            onSettingsChange={handleSettingsChange}
            currentSettings={settings}
          />
        </View>
      )}

      {showExitConfirm && renderExitConfirm()}
      {showAbout && !showExitConfirm && renderAbout()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 30,
    height: 60
  },
  menuButton: {
    padding: 10,
    backgroundColor: 'transparent',
    borderRadius: 5,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1
  },
  headerPlaceholder: {
    width: 40
  },
  content: {
    flex: 1
  },
  prayerHeader: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  mainContainer: {
    flex: 1,
    padding: 20
  },
  prayerList: {
    flex: 1
  },
  prayerItem: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  prayerContent: {
    alignItems: 'center',
  },
  prayerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  prayerDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuOverlayTouchable: {
    flex: 1,
  },
  menuContainer: {
    width: 280,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  menuScroll: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    fontSize: 16,
    marginRight: 10,
    width: 20,
    textAlign: 'center',
  },
  menuText: {
    fontSize: 16,
  },
  prayerContainer: {
    flex: 1
  },
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsContainer: {
    width: '85%',
    borderRadius: 15,
    padding: 25,
    maxHeight: '40%',
  },
  settingsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  settingsMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  settingsButtons: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 12,
  },
  settingsButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  aboutOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  aboutContainer: {
    width: '90%',
    height: '80%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
  },
  aboutContent: {
    flex: 1,
    marginBottom: 15,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    paddingBottom: 10,
    color: '#000',
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 25,
    textAlign: 'right',
    color: '#000',
  },
  aboutCloseButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#3498db',
  },
  aboutCloseText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
