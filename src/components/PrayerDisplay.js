// src/components/PrayerDisplay.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { getPrayerById } from './PrayerManager';

// حالت توسعه - موقع انتشار به false تغییر بده
const IS_DEVELOPER_MODE = true;

// مدیریت تایم‌استمپ - مستقیم در همین فایل


// در PrayerDisplay.js - بخش TimeStampManager
const TimeStampManager = {
  async saveTimeStamp(prayerId, sectionIndex, position, arabicText, persianText) {
    try {
      const prayer = getPrayerById(prayerId);
      const fileName = `prayers/${prayerId}/timestamps.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // ایجاد پوشه اگر وجود ندارد
      const dir = `${FileSystem.documentDirectory}prayers/${prayerId}`;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      
      // خواندن فایل موجود
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

      // بررسی آیا برای این sectionIndex قبلاً تایم‌استمپ ثبت شده
      const existingIndex = existingData.findIndex(item => item.sectionIndex === sectionIndex);

      if (existingIndex !== -1) {
        // آپدیت تایم‌استمپ موجود
        existingData[existingIndex] = {
          sectionIndex,
          startTime: position,
          arabic: arabicText,
          persian: persianText
        };
      } else {
        // اضافه کردن تایم‌استمپ جدید
        existingData.push({
          sectionIndex,
          startTime: position,
          arabic: arabicText,
          persian: persianText
        });
      }

      // مرتب کردن بر اساس sectionIndex
      existingData.sort((a, b) => a.sectionIndex - b.sectionIndex);

      // ذخیره فایل
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(existingData, null, 2));
      
      console.log(`✅ تایم‌استمپ ثبت شد: ${prayerId} - بخش ${sectionIndex} - زمان: ${position}ms`);
      return true;
    } catch (error) {
      console.error('Error saving timestamp:', error);
      Alert.alert('خطا', 'مشکلی در ثبت تایم‌استمپ پیش آمد');
      return false;
    }
  },

  async getTimeStamps(prayerId) {
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
      console.error('Error reading timestamps:', error);
      return [];
    }
  },
};


const PrayerDisplay = ({ settings, currentPrayerId = 'p1', soundRef }) => {
  const [prayerData, setPrayerData] = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollViewRef = useRef(null);






  useEffect(() => {
    if (currentPrayerId) {
      loadPrayerContent();
      if (!IS_DEVELOPER_MODE) {
        loadTimestamps();
      }
    }
  }, [currentPrayerId]);

  const loadPrayerContent = () => {
    try {
      setIsLoading(true);
      const prayer = getPrayerById(currentPrayerId);
      const content = prayer.contentFile;
      
      // اگر content یک تابع است (default export) آن را فراخوانی کن
      const prayerContent = typeof content === 'function' ? content() : content;
      
      const sections = prayerContent.split('◎').filter(section => section.trim());
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

  const loadTimestamps = async () => {
    try {
      const stamps = await TimeStampManager.getTimeStamps(currentPrayerId);
      setTimestamps(stamps);
    } catch (error) {
      console.error('Error loading timestamps:', error);
    }
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
      Alert.alert('اطلاع', 'تایم‌استمپ برای این بخش ثبت نشده است');
    }
  };

  const handleTextPress = async (sectionIndex) => {
    if (IS_DEVELOPER_MODE) {
      // حالت توسعه: ثبت تایم‌استمپ
      await recordTimestamp(sectionIndex);
    } else {
      // حالت عادی: پخش از تایم‌استمپ
      await playFromTimestamp(sectionIndex);
    }
  };

  const scrollToSection = (sectionIndex) => {
    if (scrollViewRef.current) {
      const sectionHeight = 150;
      const scrollPosition = sectionIndex * sectionHeight;
      
      scrollViewRef.current.scrollTo({
        y: scrollPosition,
        animated: true
      });
    }
  };

  // استایل‌های داینامیک بر اساس تنظیمات
  const getDynamicStyles = () => {
    const themeStyles = {
      light: {
        container: { backgroundColor: '#f5f5f5' },
        arabic: { color: '#000000' },
        persian: { color: '#333333' },
        sectionTouchable: { backgroundColor: '#ffffff' },
        developerIndicator: { color: '#007AFF' },
        timestampIndicator: { color: '#27ae60' },
        loadingText: { color: '#666666' }
      },
      dark: {
        container: { backgroundColor: '#1a1a1a' },
        arabic: { color: '#ffffff' },
        persian: { color: '#cccccc' },
        sectionTouchable: { backgroundColor: '#2d2d2d' },
        developerIndicator: { color: '#4da6ff' },
        timestampIndicator: { color: '#2ecc71' },
        loadingText: { color: '#cccccc' }
      },
      amber: {
        container: { backgroundColor: '#fef9e7' },
        arabic: { color: '#000000' },
        persian: { color: '#333333' },
        sectionTouchable: { backgroundColor: '#fcf3cf' },
        developerIndicator: { color: '#e67e22' },
        timestampIndicator: { color: '#27ae60' },
        loadingText: { color: '#666666' }
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
      {/* نمایش وضعیت توسعه‌دهنده */}
      {IS_DEVELOPER_MODE && (
        <View style={styles.developerBanner}>
          <Text style={styles.developerBannerText}>
            🔧 حالت توسعه‌دهنده - کلیک روی متن برای ثبت تایم‌استمپ
          </Text>
          <Text style={styles.developerBannerSubText}>
            دعای فعلی: {getPrayerById(currentPrayerId).title}
          </Text>
        </View>
      )}
      
      <ScrollView
        ref={scrollViewRef}
        style={dynamicStyles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {prayerData.map((section) => (
          <TouchableOpacity 
            key={section.sectionIndex} 
            style={dynamicStyles.section}
            onPress={() => handleTextPress(section.sectionIndex)}
            activeOpacity={0.7}
          >
            {/* نشانگر حالت توسعه‌دهنده */}
            {IS_DEVELOPER_MODE && (
              <Text style={dynamicStyles.developerIndicator}>
                📍 بخش {section.sectionIndex + 1} - کلیک برای ثبت تایم‌استمپ
              </Text>
            )}
            
            {/* نشانگر تایم‌استمپ موجود (برای حالت عادی) */}
            {!IS_DEVELOPER_MODE && timestamps.find(item => item.sectionIndex === section.sectionIndex) && (
              <Text style={dynamicStyles.timestampIndicator}>
                ⏱️ {formatTime(timestamps.find(item => item.sectionIndex === section.sectionIndex).startTime)}
              </Text>
            )}
            
            <Text style={dynamicStyles.arabic}>{section.arabic}</Text>
            <Text style={dynamicStyles.persian}>{section.persian}</Text>
            
            {section.sectionIndex < prayerData.length - 1 && (
              <View style={dynamicStyles.separator} />
            )}
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
  }
});

export default PrayerDisplay;
