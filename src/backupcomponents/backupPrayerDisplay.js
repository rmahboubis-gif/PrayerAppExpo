// src/components/PrayerDisplay.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
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
  const scrollViewRef = useRef(null);
  const sectionRefs = useRef([]);
  const [currentPlayingSection, setCurrentPlayingSection] = useState(null);
  const hasRestoredScroll = useRef(false);
  const TimeStampManager = {
    async getStaticTimeStamps(prayerId) {
      //console.log('🔍 بررسی استاتیک برای:', prayerId);
      const result = STATIC_TIMESTAMPS[prayerId] || [];
      //console.log('✅ تایم‌استامپ‌های استاتیک:', result.length);
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
        // فقط در مسیر داینامیک ذخیره کن
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
        // حالت ۱: دولوپر + همگام فعال - از استاتیک بخون
        //console.log('📖 حالت ۱: خواندن از تایم‌استامپ‌های استاتیک');
        loadedTimestamps = await TimeStampManager.getStaticTimeStamps(currentPrayerId);
      } else if (!isSyncMode && IS_DEVELOPER_MODE) {
        // حالت ۲: دولوپر + همگام غیرفعال - از داینامیک بخون (برای نمایش)
        //console.log('📝 حالت ۲: نمایش تایم‌استامپ‌های داینامیک');
        loadedTimestamps = await TimeStampManager.getDynamicTimeStamps(currentPrayerId);
      } else {
        // حالت عادی کاربر
        loadedTimestamps = await TimeStampManager.getDynamicTimeStamps(currentPrayerId);
      }

      //console.log('📊 تعداد تایم‌استامپ‌های لود شده:', loadedTimestamps.length);
      setTimestamps(loadedTimestamps);
    } catch (error) {
      console.error('❌ خطا در لود تایم‌استامپ:', error);
      setTimestamps([]);
    }
  };

  useEffect(() => {
    hasRestoredScroll.current = false; // هر دعای جدید از false شروع کن
  }, [currentPrayerId]);



useEffect(() => {
    if (!isLoading && prayerData.length > 0 && initialScrollPosition > 0 && !hasRestoredScroll.current) {
      //console.log('📜 بازیابی موقعیت اسکرول:', initialScrollPosition);
      scrollViewRef.current?.scrollTo({
        y: initialScrollPosition,
        animated: false
      });
      hasRestoredScroll.current = true;
    }
  }, [isLoading, prayerData, initialScrollPosition]);



  useEffect(() => {
    // وقتی prayerData تغییر کرد، refها را ریست کن
    sectionRefs.current = sectionRefs.current.slice(0, prayerData.length);
  }, [prayerData]);

  useEffect(() => {
    if  (!soundRef || !isSyncMode || !hasRestoredScroll.current)  return;

    const checkCurrentSection = async () => {
      try {
        const status = await soundRef.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          const currentTime = status.positionMillis;

          // پیدا کردن بخشی که در حال پخش است
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

    const interval = setInterval(checkCurrentSection, 500); // هر 500ms چک کن

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

  const findElementBySectionIndex = (sectionIndex) => {
    return sectionRefs.current[sectionIndex];
  };

  const debouncedScroll = useRef(null);

  const scrollToSectionWithDebounce = (sectionIndex) => {
    if (debouncedScroll.current) {
      clearTimeout(debouncedScroll.current);
    }

    debouncedScroll.current = setTimeout(() => {
      scrollToSection(sectionIndex);
    }, 300); // فقط هر 300ms اسکرول کن
  };

  // تابع جدید برای ثبت تایم‌استمپ در حالت توسعه
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

          // ریلود تایم‌استمپ‌ها برای نمایش فوری
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

  // تابع برای پخش از تایم‌استمپ (برای کاربران عادی)
  const playFromTimestamp = async (sectionIndex) => {
    const timestamp = timestamps.find(item => item.sectionIndex === sectionIndex);

    if (timestamp && soundRef) {
      try {
        await soundRef.setPositionAsync(timestamp.startTime);
        const status = await soundRef.getStatusAsync();
        if (!status.isPlaying) {
          await soundRef.playAsync();
        }

        // اسکرول به بخش مربوطه
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
    if (scrollViewRef.current && sectionRefs.current[sectionIndex]) {
      sectionRefs.current[sectionIndex].measure((x, y, width, height, pageX, pageY) => {
        if (y !== 0) { // فقط اگر موقعیت معتبر بود اسکرول کن
          //console.log('📏 موقعیت المان:', { x, y, width, height, pageX, pageY });
          scrollViewRef.current.scrollTo({
            y: Math.max(0, y - 100), // 100 پیکسل بالاتر برای دید بهتر
            animated: true
          });
        } else {
          // Fallback: استفاده از روش قدیمی اگر measure کار نکرد
          console.log('❌ المان پیدا نشد، استفاده از روش قدیمی');
          const sectionHeight = 200;
          const scrollPosition = sectionIndex * sectionHeight;
          scrollViewRef.current.scrollTo({
            y: scrollPosition,
            animated: true
          });
        }
      });
    }
  };

  const handleTextPress = async (sectionIndex) => {
    if (isSyncMode && IS_DEVELOPER_MODE) {
      // حالت ۱: فقط از استاتیک بخون
      const staticTimestamps = await TimeStampManager.getStaticTimeStamps(currentPrayerId);
      const timestamp = staticTimestamps.find(item => item.sectionIndex === sectionIndex);
      if (timestamp && soundRef) {
        await soundRef.setPositionAsync(timestamp.startTime);
      }
    } else if (!isSyncMode && IS_DEVELOPER_MODE) {
      // حالت ۲: فقط در داینامیک بنویس
      await recordTimestamp(sectionIndex);
    } else if (isSyncMode) {
      // کاربر عادی: از داینامیک بخون
      await playFromTimestamp(sectionIndex);
    } else {
      // کاربر عادی: از داینامیک بخون (fallback)
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
        developerIndicator: { color: '#007AFF' },
        timestampIndicator: { color: '#27ae60' },
        loadingText: { color: '#666666' },
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
        developerIndicator: { color: '#4da6ff' },
        timestampIndicator: { color: '#2ecc71' },
        loadingText: { color: '#cccccc' },
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
        developerIndicator: { color: '#e67e22' },
        timestampIndicator: { color: '#27ae60' },
        loadingText: { color: '#666666' },
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
      scrollView: {
        flex: 1,
      },
      section: {
        marginBottom: 20,
        padding: 12,
        borderRadius: 8,
        ...currentTheme.sectionTouchable
      },
      separator: {
        height: 1,
        backgroundColor: settings.theme === 'dark' ? '#404040' : '#ddd',
        marginVertical: 10
      },
      developerIndicator: {
        fontSize: 10,
        textAlign: 'left',
        marginBottom: 5,
        ...currentTheme.developerIndicator
      },
      timestampIndicator: {
        fontSize: 10,
        textAlign: 'left',
        marginBottom: 5,
        ...currentTheme.timestampIndicator
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
      },
      loadingText: {
        fontSize: 16,
        ...currentTheme.loadingText
      },
      currentPlayingSection: {
        ...currentTheme.currentPlayingSection
      }
    });
  };

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
      <ScrollView
        ref={scrollViewRef}
        onScroll={(event) => {
          if (onScrollChange) {
            onScrollChange(event.nativeEvent.contentOffset.y);
          }
        }}
        scrollEventThrottle={16} // هر 16ms آپدیت کن
      >
        {prayerData.map((section) => (
          <TouchableOpacity
            key={section.sectionIndex}
            style={[
              dynamicStyles.section,
              currentPlayingSection === section.sectionIndex && dynamicStyles.currentPlayingSection
            ]}
            onPress={() => handleTextPress(section.sectionIndex)}
            activeOpacity={0.7}
           ref={ref => sectionRefs.current[section.sectionIndex] = ref}
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
        ))}
      </ScrollView>
    </View>
  );
};

// تابع کمکی برای فرمت زمان
const formatTime = (millis) => {
  if (!millis) return '0:00';

  const minutes = Math.floor(millis / 60000);
  const seconds = Math.floor((millis % 60000) / 1000);
  const milliseconds = Math.floor((millis % 1000) / 100);

  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}.${milliseconds}`;
};

// استایل‌های اضافی
const styles = StyleSheet.create({
  developerBanner: {
    backgroundColor: '#FFEB3B',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800'
  },
  developerBannerText: {
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  developerBannerSubText: {
    color: '#666',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2
  },
  syncModeBanner: {
    backgroundColor: '#4CAF50',
    padding: 8,
    marginBottom: 10,
    borderRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32'
  },
  syncModeBannerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  timestampDisplay: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    fontFamily: 'monospace',
  },
  timeDisplay: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    fontFamily: 'monospace',
  }
});

export default PrayerDisplay;
