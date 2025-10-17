import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Modal, BackHandler } from 'react-native';
import PrayerDisplay from './src/components/PrayerDisplay';
import Settings from './src/components/Settings';
import VoicePlayer from './src/components/VoicePlayer';
import { getAllPrayers } from './src/components/PrayerManager';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('main');
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false); 
  const [globalSoundRef, setGlobalSoundRef] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const [settings, setSettings] = useState({
    fontFamily: 'System',
    theme: 'light',
    arabicSize: 22,
    persianSize: 16,
    lineHeight: 1.8,
    arabicBold: true,
    persianBold: false
  });

  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
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
        setCurrentScreen('main');
        setSelectedPrayer(null);
        if (globalSoundRef) {
          globalSoundRef.stopAsync();
        }
        return true;
      }

      setShowExitConfirm(true);
      return true;
    });

    return () => backHandler.remove();
  }, [currentScreen, showMenu, showSettings, showAbout, showExitConfirm, globalSoundRef]);

  const openMenu = () => {
    setShowMenu(true);
  };

  const closeMenu = () => {
    setShowMenu(false);
  };

  const prayers = getAllPrayers();

  const menuItems = [
    { id: 'main', title: 'صفحه اصلی', icon: '🏠' },
    { id: 'settings', title: 'تنظیمات', icon: '⚙️' },
    { id: 'about', title: 'درباره برنامه', icon: 'ℹ️' },
    { id: 'contact', title: 'ارتباط با سازنده', icon: '📞' },
  ];

  const handleMenuSelect = (itemId) => {
    closeMenu();
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

  const handlePrayerSelect = (prayer) => {
    setSelectedPrayer(prayer);
    setCurrentScreen('prayer');
  };

const renderExitConfirm = () => {
  return (
    <Modal
      visible={showExitConfirm}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowExitConfirm(false)}
    >
      <View style={styles.exitConfirmOverlay}>
        <View style={styles.exitConfirmContainer}>
          <Text style={styles.exitConfirmTitle}>
            خروج از برنامه
          </Text>
          <Text style={styles.exitConfirmMessage}>
            آیا مطمئن هستید که می‌خواهید از برنامه خارج شوید؟
          </Text>
          <View style={styles.exitConfirmButtons}>
            <TouchableOpacity 
              style={[styles.exitConfirmButton, styles.exitConfirmCancel]}
              onPress={() => setShowExitConfirm(false)}
            >
              <Text style={styles.exitConfirmCancelText}>
                انصراف
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.exitConfirmButton, styles.exitConfirmExit]}
              onPress={() => BackHandler.exitApp()}
            >
              <Text style={styles.exitConfirmExitText}>
                خروج
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
  const renderAbout = () => {
    const themeStyles = getThemeStyles();
    
    return (
      <Modal
        visible={showAbout}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAbout(false)}
      >
        <View style={styles.aboutOverlay}>
          <View style={[styles.aboutContainer, themeStyles.menuContainer]}>
            <Text style={[styles.aboutTitle, themeStyles.menuTitle]}>درباره برنامه</Text>
            
            <ScrollView style={styles.aboutContent}>
              <Text style={[styles.aboutText, themeStyles.menuText]}>
                🌙 برنامه دعاهای معنوی
                {"\n\n"}
                این برنامه با هدف دسترسی آسان به دعاهای مذهبی و معنوی توسعه داده شده است.
                {"\n\n"}
                ✨ ویژگی‌ها:
                • پخش صوت دعاها
                • نمایش متن عربی و فارسی
                • قابلیت تنظیم فونت و سایز
                • پشتیبانی از تم‌های مختلف
                • محیط کاربری ساده و زیبا
                {"\n\n"}
                📱 توسعه داده شده با:
                React Native + Expo
                {"\n\n"}
                🙏 امیدواریم این برنامه برای شما مفید واقع شود.
              </Text>
            </ScrollView>
            
            <TouchableOpacity 
              style={[styles.aboutCloseButton, themeStyles.applyButton]}
              onPress={() => setShowAbout(false)}
            >
              <Text style={styles.aboutCloseText}>بستن</Text>
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
      }
    };

    return themeStyles[settings.theme] || themeStyles.light;
  };

  const renderMenu = () => {
    const themeStyles = getThemeStyles();

    return (
      <Modal
        visible={showMenu}
        animationType="slide"
        transparent={true}
        onRequestClose={closeMenu}
      >
        <View style={styles.menuOverlay}>
          <TouchableOpacity
            style={styles.menuOverlayTouchable}
            activeOpacity={1}
            onPress={closeMenu}
          />
          <View style={[styles.menuContainer, themeStyles.menuContainer]}>
            <ScrollView style={styles.menuScroll}>
              <Text style={[styles.menuTitle, themeStyles.menuTitle]}>منوی برنامه</Text>
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
        <TouchableOpacity style={styles.menuButton} onPress={openMenu}>
          <Text style={[styles.menuButtonText, themeStyles.menuButtonText]}>☰</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, themeStyles.headerTitle]}>
          {currentScreen === 'main' ? 'دعاهای معنوی' :
           currentScreen === 'prayer' ? selectedPrayer?.title :
           'برنامه دعا'}
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
      />
    </View>
  );

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
                <Text style={[styles.prayerDescription, themeStyles.prayerDescription]}>{prayer.description}</Text>
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
            onSettingsChange={setSettings}
            currentSettings={settings}
          />
        </View>
      )}
      
      {renderAbout()}
      {renderExitConfirm()}
    </View>
  );
}

// استایل‌ها بدون تغییر می‌مونن
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
  settingsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    flexDirection: 'row-reverse',
  },
  menuOverlayTouchable: {
    flex: 1,
  },
  menuContainer: {
    width: 280,
    height: '100%',
  },
  menuScroll: {
    flex: 1,
    paddingTop: 60
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    padding: 15,
    borderBottomWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  menuIcon: {
    fontSize: 16,
    marginRight: 10
  },
  menuText: {
    fontSize: 16,
  },
  prayerContainer: {
    flex: 1
  },  
  aboutOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 15,
    padding: 20,
    margin: 20,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  aboutContent: {
    flex: 1,
    marginBottom: 15,
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 25,
    textAlign: 'right',
    color: '#000000'
  },
  aboutCloseButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  aboutCloseText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },    
  exitConfirmOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.7)',
  justifyContent: 'center',
  alignItems: 'center',
},
exitConfirmContainer: {
  width: '80%',
  backgroundColor: 'white',
  borderRadius: 15,
  padding: 25,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
},
exitConfirmTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 15,
  color: '#2c3e50',
  textAlign: 'center',
},
exitConfirmMessage: {
  fontSize: 16,
  textAlign: 'center',
  marginBottom: 25,
  lineHeight: 24,
  color: '#34495e',
},
exitConfirmButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: '100%',
  gap: 10,
},
exitConfirmButton: {
  flex: 1,
  padding: 15,
  borderRadius: 10,
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 50,
},
exitConfirmCancel: {
  backgroundColor: '#3498db', // آبی روشن
},
exitConfirmExit: {
  backgroundColor: '#e74c3c', // قرمز
},
exitConfirmCancelText: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 16,
},
exitConfirmExitText: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 16,
},
  exitConfirmExitText: {
    color: 'white',
  }
});
