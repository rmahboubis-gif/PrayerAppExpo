// src/components/PrayerDisplay.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { getPrayerById } from './PrayerManager';
import { STATIC_TIMESTAMPS } from './PrayerManager';

// حالت توسعه - موقع انتشار به false تغییر بده
const IS_DEVELOPER_MODE = true;

const PrayerDisplay = ({
  settings,
  currentPrayerId = 'p1',
  soundRef,
  isSyncMode = false,
  onScrollChange,
  initialScrollPosition = 0
}) => {
  const [prayerData, setPrayerData] = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef(null);
  const [currentPlayingSection, setCurrentPlayingSection] = useState(null);
  const hasRestoredScroll = useRef(false);

  const TimeStampManager = {
    async getStaticTimeStamps(prayerId) {
      const result = STATIC_TIMESTAMPS[prayerId] || [];
      return result;
    },

    async getDynamicTimeStamps(prayerId) {
      try {
        const fileName = `prayers/${prayerId}/timestamps.json`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;

        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) {
          const fileContent = await FileSystem.readAsStringAsync(fileUri);
          return JSON.parse(fileContent);
        }
        return [];
      } catch (error) {
        return [];
      }
    },

    async saveTimeStamp(prayerId, sectionIndex, position, arabicText, persianText) {
      try {
        const fileName = `prayers/${prayerId}/timestamps.json`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;

        const dir = `${FileSystem.documentDirectory}prayers/${prayerId}`;
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

        let existingData = [];
        try {
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          if (fileInfo.exists) {
            const fileContent = await FileSystem.readAsStringAsync(fileUri);
            existingData = JSON.parse(fileContent);
          }
        } catch (error) {
          console.log('Creating new timestamp file');
        }

        const existingIndex = existingData.findIndex(item => item.sectionIndex === sectionIndex);
        if (existingIndex !== -1) {
          existingData[existingIndex] = { sectionIndex, startTime: position, arabic: arabicText, persian: persianText };
        } else {
          existingData.push({ sectionIndex, startTime: position, arabic: arabicText, persian: persianText });
        }

        existingData.sort((a, b) => a.sectionIndex - b.sectionIndex);
        await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(existingData, null, 2));
        return true;
      } catch (error) {
        console.error('Error saving timestamp:', error);
        return false;
      }
    }
  };

  const loadTimestamps = async () => {
    try {
      let loadedTimestamps = [];

      if (isSyncMode && IS_DEVELOPER_MODE) {
        loadedTimestamps = await TimeStampManager.getStaticTimeStamps(currentPrayerId);
      } else if (!isSyncMode && IS_DEVELOPER_MODE) {
        loadedTimestamps = await TimeStampManager.getDynamicTimeStamps(currentPrayerId);
      } else {
        loadedTimestamps = await TimeStampManager.getDynamicTimeStamps(currentPrayerId);
      }

      setTimestamps(loadedTimestamps);
    } catch (error) {
      console.error('❌ خطا در لود تایم‌استامپ:', error);
      setTimestamps([]);
    }
  };

  useEffect(() => {
    hasRestoredScroll.current = false;
  }, [currentPrayerId]);

useEffect(() => {
  if (!isLoading && prayerData.length > 0 && initialScrollPosition > 0 && !hasRestoredScroll.current) {
    // محاسبه ایندکس اما محدود به تعداد بخش‌های فعلی
    const calculatedIndex = Math.floor(initialScrollPosition / 200);
    const safeIndex = Math.min(calculatedIndex, prayerData.length - 1);
    
    console.log('📜 بازیابی موقعیت:', {
      calculatedIndex,
      safeIndex, 
      sections: prayerData.length,
      scrollPosition: initialScrollPosition
    });
    
    setTimeout(() => {
      if (flatListRef.current && safeIndex >= 0) {
        flatListRef.current.scrollToIndex({
          index: safeIndex,
          animated: false,
          viewPosition: 0
        });
      }
      hasRestoredScroll.current = true;
    }, 100);
  }
}, [isLoading, prayerData, initialScrollPosition]);

  useEffect(() => {
    if (!soundRef || !isSyncMode || !hasRestoredScroll.current) return;

    const checkCurrentSection = async () => {
      try {
        const status = await soundRef.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          const currentTime = status.positionMillis;

          const currentSection = timestamps.find(timestamp =>
            currentTime >= timestamp.startTime &&
            (!timestamps[timestamp.sectionIndex + 1] ||
             currentTime < timestamps[timestamp.sectionIndex + 1].startTime)
          );

          if (currentSection && currentSection.sectionIndex !== currentPlayingSection) {
            setCurrentPlayingSection(currentSection.sectionIndex);
            scrollToSection(currentSection.sectionIndex);
          }
        }
      } catch (error) {
        console.error('Error checking current section:', error);
      }
    };

    const interval = setInterval(checkCurrentSection, 1000);
    return () => clearInterval(interval);
  }, [soundRef, timestamps, isSyncMode, currentPlayingSection]);

  useEffect(() => {
    if (currentPrayerId) {
      loadPrayerContent();
      loadTimestamps();
    }
  }, [currentPrayerId]);

  const loadPrayerContent = () => {
    try {
      setIsLoading(true);
      const prayer = getPrayerById(currentPrayerId);
      const content = prayer.contentFile;
      const prayerContent = typeof content === 'function' ? content() : content;
      if (!prayerContent || typeof prayerContent !== 'string') {
        console.error('❌ prayerContent is not a string:', prayerContent);
        Alert.alert('خطا', 'متن دعا به درستی بارگذاری نشد');
        return;
      }

      const sections = prayerContent.split('◎').filter(section => section.trim());
      console.log('sections count:', sections.length);
      const parsedData = sections.map((section, index) => {
        const lines = section.trim().split('\n').filter(line => line.trim());
        return {
          sectionIndex: index,
          arabic: lines[0] || '',
          persian: lines[1] || ''
        };
      }).filter(item => item.arabic && item.persian);

      setPrayerData(parsedData);
    } catch (error) {
      console.error('Error loading prayer content:', error);
      Alert.alert('خطا', 'مشکلی در بارگذاری متن دعا پیش آمد');
    } finally {
      setIsLoading(false);
    }
  };

  const recordTimestamp = async (sectionIndex) => {
    if (!soundRef) {
      Alert.alert('خطا', 'لطفاً اول صوت را پلی کنید');
      return;
    }

    try {
      const status = await soundRef.getStatusAsync();
      if (status.isLoaded) {
        const currentPosition = status.positionMillis;
        const section = prayerData.find(item => item.sectionIndex === sectionIndex);

        if (!section) {
          Alert.alert('خطا', 'بخش متن پیدا نشد');
          return;
        }

        const success = await TimeStampManager.saveTimeStamp(
          currentPrayerId,
          sectionIndex,
          currentPosition,
          section.arabic,
          section.persian
        );

        if (success) {
          Alert.alert(
            '✅ تایم‌استمپ ثبت شد',
            `دعا: ${getPrayerById(currentPrayerId).title}\nبخش: ${sectionIndex + 1}\nزمان: ${formatTime(currentPosition)}`,
            [{ text: 'OK' }]
          );

          if (!IS_DEVELOPER_MODE) {
            loadTimestamps();
          }
        }
      } else {
        Alert.alert('خطا', 'صوت در دسترس نیست');
      }
    } catch (error) {
      console.error('Error recording timestamp:', error);
      Alert.alert('خطا', 'مشکلی در ثبت تایم‌استمپ پیش آمد');
    }
  };

  const playFromTimestamp = async (sectionIndex) => {
    const timestamp = timestamps.find(item => item.sectionIndex === sectionIndex);

    if (timestamp && soundRef) {
      try {
        await soundRef.setPositionAsync(timestamp.startTime);
        const status = await soundRef.getStatusAsync();
        if (!status.isPlaying) {
          await soundRef.playAsync();
        }

        scrollToSection(sectionIndex);
      } catch (error) {
        console.error('Error playing from timestamp:', error);
        Alert.alert('خطا', 'مشکلی در پخش صوت پیش آمد');
      }
    } else {
      Alert.alert(
        'اطلاع',
        `تایم‌استامپ برای بخش ${sectionIndex + 1} ثبت نشده است\n\nبخش‌های موجود: ${timestamps.map(t => t.sectionIndex + 1).join(', ')}`
      );
    }
  };

 const scrollToSection = (sectionIndex) => {
  if (flatListRef.current && sectionIndex >= 0 && sectionIndex < prayerData.length) {
    flatListRef.current.scrollToIndex({
      index: sectionIndex,
      animated: true,
      viewPosition: 0.1
    });
  } else {
    console.log('⚠️ اسکرول به بخش نامعتبر:', sectionIndex, 'تعداد بخش‌ها:', prayerData.length);
  }
};


  const handleTextPress = async (sectionIndex) => {
    if (isSyncMode && IS_DEVELOPER_MODE) {
      const staticTimestamps = await TimeStampManager.getStaticTimeStamps(currentPrayerId);
      const timestamp = staticTimestamps.find(item => item.sectionIndex === sectionIndex);
      if (timestamp && soundRef) {
        await soundRef.setPositionAsync(timestamp.startTime);
      }
    } else if (!isSyncMode && IS_DEVELOPER_MODE) {
      await recordTimestamp(sectionIndex);
    } else if (isSyncMode) {
      await playFromTimestamp(sectionIndex);
    } else {
      await playFromTimestamp(sectionIndex);
    }
  };

  const getDynamicStyles = () => {
    const themeStyles = {
      light: {
        container: { backgroundColor: '#f5f5f5' },
        arabic: { color: '#000000' },
        persian: { color: '#333333' },
        sectionTouchable: { backgroundColor: '#ffffff' },
        currentPlayingSection: {
          borderLeftWidth: 4,
          borderLeftColor: '#007AFF',
          backgroundColor: '#e3f2fd'
        }
      },
      dark: {
        container: { backgroundColor: '#1a1a1a' },
        arabic: { color: '#ffffff' },
        persian: { color: '#cccccc' },
        sectionTouchable: { backgroundColor: '#2d2d2d' },
        currentPlayingSection: {
          borderLeftWidth: 4,
          borderLeftColor: '#4da6ff',
          backgroundColor: '#3a3a3a'
        }
      },
      amber: {
        container: { backgroundColor: '#fef9e7' },
        arabic: { color: '#000000' },
        persian: { color: '#333333' },
        sectionTouchable: { backgroundColor: '#fcf3cf' },
        currentPlayingSection: {
          borderLeftWidth: 4,
          borderLeftColor: '#e67e22',
          backgroundColor: '#fcf3cf'
        }
      }
    };

    const currentTheme = themeStyles[settings.theme] || themeStyles.light;

    return StyleSheet.create({
      container: {
        flex: 1,
        padding: 15,
        ...currentTheme.container
      },
      arabic: {
        fontSize: settings.arabicSize,
        textAlign: 'right',
        lineHeight: settings.arabicSize * (settings.lineHeight || 1.8),
        marginBottom: 5,
        fontFamily: settings.fontFamily,
        writingDirection: 'rtl',
        fontWeight: settings.arabicBold ? 'bold' : 'normal',
        ...currentTheme.arabic
      },
      persian: {
        fontSize: settings.persianSize,
        textAlign: 'right',
        lineHeight: settings.persianSize * (settings.lineHeight || 1.8),
        marginBottom: 15,
        fontFamily: settings.fontFamily,
        writingDirection: 'rtl',
        fontWeight: settings.persianBold ? 'bold' : 'normal',
        ...currentTheme.persian
      },
      section: {
        marginBottom: 20,
        padding: 12,
        borderRadius: 8,
        ...currentTheme.sectionTouchable
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
      },
      loadingText: {
        fontSize: 16,
        color: settings.theme === 'dark' ? '#cccccc' : '#666666'
      },
      currentPlayingSection: {
        ...currentTheme.currentPlayingSection
      }
    });
  };

  const renderSection = ({ item: section }) => (
    <TouchableOpacity
      style={[
        dynamicStyles.section,
        currentPlayingSection === section.sectionIndex && dynamicStyles.currentPlayingSection
      ]}
      onPress={() => handleTextPress(section.sectionIndex)}
      activeOpacity={0.7}
    >
      {settings.showArabic && (
        <Text style={dynamicStyles.arabic}>{section.arabic}</Text>
      )}
      {settings.showPersian && (
        <Text style={dynamicStyles.persian}>{section.persian}</Text>
      )}
      <Text style={styles.timeDisplay}>
        زمان: {timestamps.find(t => t.sectionIndex === section.sectionIndex) ?
          formatTime(timestamps.find(t => t.sectionIndex === section.sectionIndex).startTime) :
          'ثبت نشده'}
      </Text>
    </TouchableOpacity>
  );

  const dynamicStyles = getDynamicStyles();

  if (isLoading) {
    return (
      <View style={[dynamicStyles.container, dynamicStyles.loadingContainer]}>
        <Text style={dynamicStyles.loadingText}>در حال بارگذاری متن دعا...</Text>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <FlatList
        ref={flatListRef}
        data={prayerData}
        renderItem={renderSection}
        keyExtractor={(item) => item.sectionIndex.toString()}
        onScroll={(event) => {
          if (onScrollChange) {
            onScrollChange(event.nativeEvent.contentOffset.y);
          }
        }}
        scrollEventThrottle={16}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
        getItemLayout={(data, index) => ({
          length: 200,
          offset: 200 * index,
          index,
        })}
        removeClippedSubviews={true}
      />
    </View>
  );
};

const formatTime = (millis) => {
  if (!millis) return '0:00';
  const minutes = Math.floor(millis / 60000);
  const seconds = Math.floor((millis % 60000) / 1000);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const styles = StyleSheet.create({
  timeDisplay: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    fontFamily: 'monospace',
  }
});

export default PrayerDisplay;
