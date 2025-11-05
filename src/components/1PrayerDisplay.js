// src/components/PrayerDisplay.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { getPrayerById } from './PrayerManager';
import { STATIC_TIMESTAMPS } from './PrayerManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

// حالت توسعه - موقع انتشار به false تغییر بده
const IS_DEVELOPER_MODE = true;

const PrayerDisplay = ({
  settings,
  currentPrayerId = 'p1',
  soundRef,
  isSyncMode = false,
  currentSectionIndex,
  onSectionIndexChange,
  onAudioSeekStart
}) => {
  const [prayerData, setPrayerData] = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef(null);
  const [visibleSectionIndex, setVisibleSectionIndex] = useState(0);
  // مدیریت تداخلات
// مدیریت تداخلات
// در PrayerDisplay.js - جایگزین NavigationManager فعلی


const NavigationManager = useRef({
  state: {
    isUserScrolling: false,
    isAudioSeeking: false,
    lastUserAction: null,
    scrollTimeout: null,
    audioSeekTimeout: null
  },

  // وقتی کاربر اسکرول متنی میکند
  handleUserScroll: (event) => {
    NavigationManager.current.state.isUserScrolling = true;
    NavigationManager.current.state.lastUserAction = 'text_scroll';
    
    console.log('👤 کاربر اسکرول متن کرد - حالت اسکرول کاربر فعال شد');
    
    if (NavigationManager.current.state.scrollTimeout) {
      clearTimeout(NavigationManager.current.state.scrollTimeout);
    }
    
    NavigationManager.current.state.scrollTimeout = setTimeout(() => {
      NavigationManager.current.state.isUserScrolling = false;
      console.log('👤 حالت اسکرول کاربر غیرفعال شد');
    }, 1500);
  },

  // وقتی کاربر اسکرول صوتی میکند
  handleAudioSeekStart: () => {
    NavigationManager.current.state.isAudioSeeking = true;
    NavigationManager.current.state.lastUserAction = 'audio_seek';
    console.log('🎵 اسکرول صوتی شروع شد');
    
    if (NavigationManager.current.state.audioSeekTimeout) {
      clearTimeout(NavigationManager.current.state.audioSeekTimeout);
    }
    
    NavigationManager.current.state.audioSeekTimeout = setTimeout(() => {
      NavigationManager.current.state.isAudioSeeking = false;
      console.log('🎵 اسکرول صوتی پایان یافت');
    }, 500);
  },

  // چک کردن آیا میتوان اسکرول خودکار انجام داد
  canAutoScroll: () => {
    return !NavigationManager.current.state.isUserScrolling && 
           !NavigationManager.current.state.isAudioSeeking;
  }
});



  // سیستم تطبیقی اسکرول
  const getSavedItemHeight = async (prayerId) => {
    try {
      const savedHeight = await AsyncStorage.getItem(`@item_height_${prayerId}`);
      return savedHeight ? parseFloat(savedHeight) : null;
    } catch (error) {
      return null;
    }
  };

  const saveItemHeight = async (prayerId, height) => {
    try {
      await AsyncStorage.setItem(`@item_height_${prayerId}`, height.toString());
    } catch (error) {
      console.error('Error saving item height:', error);
    }
  };
//4
/*
  const getCurrentVisibleIndex = () => {
    return new Promise((resolve) => {
      // این یک پیاده‌سازی ساده است - در عمل باید از onViewableItemsChanged استفاده کرد
      setTimeout(() => {
        resolve(currentSectionIndex);
      }, 100);
    });
  };
*/
//4
const getCurrentVisibleIndex = () => {
  return new Promise((resolve) => {
    // راه بهتر: از viewability helper استفاده کن
    if (flatListRef.current) {
      flatListRef.current.getScrollableNode().measure((x, y, width, height, pageX, pageY) => {
        const scrollOffset = flatListRef.current.getScrollableNode().scrollY;
        const estimatedIndex = Math.floor(scrollOffset / 120); // ارتفاع تخمینی
        console.log(`📐 موقعیت اسکرول: ${scrollOffset}px, ایندکس تخمینی: ${estimatedIndex}`);
        resolve(estimatedIndex);
      });
    } else {
      resolve(currentSectionIndex);
    }
  });
};
  const scrollWithAdaptiveMethod = async (targetIndex) => {
    let estimatedHeight = await getSavedItemHeight(currentPrayerId) || 120;
    
    // اسکرول تخمینی
    const offset = targetIndex * estimatedHeight;
    flatListRef.current.scrollToOffset({ offset, animated: true });
    
    // بعد از اسکرول، دقت رو بررسی کن و ذخیره کن
    setTimeout(async () => {
      const visibleIndex = await getCurrentVisibleIndex();
      if (visibleIndex !== targetIndex && visibleIndex > 0) {
        // محاسبه ارتفاع واقعی و ذخیره برای دفعات بعد
        const realHeight = (targetIndex * estimatedHeight) / visibleIndex;
        await saveItemHeight(currentPrayerId, realHeight);
        
        // اسکرول مجدد با ارتفاع دقیق‌تر
        const preciseOffset = targetIndex * realHeight;
        flatListRef.current.scrollToOffset({ offset: preciseOffset, animated: true });
      }
    }, 300);
  };
//4
/*
const adaptiveScrollToIndex = async (targetIndex) => {
  console.log(`🎯 اسکرول به ایندکس: ${targetIndex}`);
  
  if (!flatListRef.current || targetIndex < 0) return;
  
  try {
    console.log('🔄 تلاش برای اسکرول مستقیم');
    flatListRef.current.scrollToIndex({
      index: targetIndex,
      animated: true,
      viewPosition: 0.1
    });
  } catch (error) {
    console.log(`❌ اسکرول مستقیم شکست خورد: ${error.message}`);
    console.log('🔧 فعال کردن اسکرول تطبیقی...');
    await scrollWithAdaptiveMethod(targetIndex);
  }
};
*/
//4


const adaptiveScrollToIndex = async (targetIndex) => {
  console.log(`🎯 اسکرول به ایندکس: ${targetIndex} (اکنون: ${visibleSectionIndex})`);
  try {
    console.log('🔄 تلاش برای اسکرول مستقیم');
    flatListRef.current.scrollToIndex({
      index: targetIndex,
      animated: true,
      viewPosition: 0.1
    });

    // 🔽 لاگ کامل اضافه کن
    setTimeout(async () => {
      console.log('📊 درحال بررسی دقت اسکرول...');
      const visibleIndex = await getCurrentVisibleIndex();
      console.log(`📊 بعد از اسکرول مستقیم: هدف ${targetIndex}, رسید به ${visibleIndex}`);
      
      const difference = Math.abs(visibleIndex - targetIndex);
      console.log(`📐 اختلاف: ${difference} ایندکس`);
      
      if (difference > 2) {
        console.log('🔧 اختلاف زیاد، فعال کردن سیستم تطبیقی...');
        await scrollWithAdaptiveMethod(targetIndex);
        
        // بازهم چک کن
        setTimeout(async () => {
          const finalIndex = await getCurrentVisibleIndex();
          console.log(`📊 بعد از اسکرول تطبیقی: هدف ${targetIndex}, رسید به ${finalIndex}`);
          console.log(`🎯 اختلاف نهایی: ${Math.abs(finalIndex - targetIndex)}`);
        }, 500);
      } else {
        console.log('✅ اسکرول مستقیم دقیق بود');
      }
    }, 500);

  } catch (error) {
    console.log(`❌ اسکرول مستقیم شکست خورد: ${error.message}`);
    console.log('🔧 فعال کردن اسکرول تطبیقی...');
    await scrollWithAdaptiveMethod(targetIndex);
  }
};


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





/*dynamic
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
      console.error('❌ خطا در لود تایماستامپ:', error);
      setTimestamps([]);
    }
  };

const handleTextPress = async (sectionIndex) => {
    if (isSyncMode && IS_DEVELOPER_MODE) {
      const staticTimestamps = await TimeStampManager.getStati>
      const timestamp = staticTimestamps.find(item => item.sec>
      if (timestamp && soundRef) {
        await soundRef.setPositionAsync(timestamp.startTime);
        onSectionIndexChange(sectionIndex);
      }
    } else if (!isSyncMode && IS_DEVELOPER_MODE) {
      await recordTimestamp(sectionIndex);
    } else if (isSyncMode) {
      await playFromTimestamp(sectionIndex);
    } else {
      await playFromTimestamp(sectionIndex);
    }
  };


*/
const loadTimestamps = async () => {
  try {
    let loadedTimestamps = [];

    // ❌ کامنت کردن استاتیک
    // if (isSyncMode && IS_DEVELOPER_MODE) {
    //   loadedTimestamps = await TimeStampManager.getStaticTimeStamps(currentPrayerId);
    // } else 
    if (!isSyncMode && IS_DEVELOPER_MODE) {
      // حالت Developer: از داینامیک بخون
      loadedTimestamps = await TimeStampManager.getDynamicTimeStamps(currentPrayerId);
    } else {
      // حالت Sync: از داینامیک بخون (به جای استاتیک)
      loadedTimestamps = await TimeStampManager.getDynamicTimeStamps(currentPrayerId);
    }

    console.log(`📊 تایم‌استمپ‌های لود شده: ${loadedTimestamps.length} مورد`);
    setTimestamps(loadedTimestamps);
  } catch (error) {
    console.error('❌ خطا در لود تایماستامپ:', error);
    setTimestamps([]);
  }
};


const handleTextPress = async (sectionIndex) => {
  console.log(`🔄 سینک: کلیک بخش ${sectionIndex}`);

  // کد قبلی که کار میکرد
  if (isSyncMode && IS_DEVELOPER_MODE) {
    const staticTimestamps = await TimeStampManager.getStaticTimeStamps(currentPrayerId);
    const timestamp = staticTimestamps.find(item => item.sectionIndex === sectionIndex);
    if (timestamp && soundRef) {
      await soundRef.setPositionAsync(timestamp.startTime);
      onSectionIndexChange(sectionIndex);
    }
  } else if (!isSyncMode && IS_DEVELOPER_MODE) {
    await recordTimestamp(sectionIndex);
  } else if (isSyncMode) {
    await playFromTimestamp(sectionIndex);  // ❌ این تابع وجود نداره یا مشکل داره
  } else {
    await playFromTimestamp(sectionIndex);  // ❌ این تابع وجود نداره یا مشکل داره
  }
};
//////////dynamic
  // اسکرول وقتی currentSectionIndex تغییر کرد
  useEffect(() => {
    if (!NavigationManager.current.state.isUserScrolling) {
      adaptiveScrollToIndex(currentSectionIndex);
    }
  }, [currentSectionIndex]);

  // سیستم ردیابی موقعیت صوت برای اسکرول خودکار
// 🔧 تصحیح شده:

// سیستم ردیابی موقعیت صوت برای اسکرول خودکار
// سیستم ردیابی موقعیت صوت برای اسکرول خودکار - جایگزین کن
useEffect(() => {
  if (!soundRef || !isSyncMode) return;

  const interval = setInterval(async () => {
    try {
      const status = await soundRef.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        const currentTime = status.positionMillis;
        const currentSection = findSectionByTime(currentTime, timestamps);

        console.log(`🔊 پخش: ${formatTime(currentTime)} -> بخش ${currentSection?.index} (متن: ${currentSectionIndex})`);

        // 🔽 فقط اگر کاربر در حال اسکرول نباشد، اسکرول خودکار انجام بده
        if (NavigationManager.current.canAutoScroll()) {
          if (currentSection && 
              currentSection.index !== undefined && 
              currentSectionIndex !== undefined &&
              currentSection.index !== currentSectionIndex) {
            
            console.log(`🔄 اسکرول خودکار: ${currentSectionIndex} -> ${currentSection.index}`);
            onSectionIndexChange(currentSection.index);
          }
        } else {
          console.log('⏸️ اسکرول خودکار متوقف (کاربر در حال اسکرول)');
        }
      }
    } catch (error) {
      console.error('Error checking current section:', error);
    }
  }, 1000);

  return () => clearInterval(interval);
}, [soundRef, timestamps, isSyncMode, currentSectionIndex, onSectionIndexChange]);
////1000 to 200

// این useEffect رو اضافه کن
useEffect(() => {
  if (onAudioSeekStart) {
    // وقتی اسکرول صوتی شروع میشه، به NavigationManager اطلاع بده
    onAudioSeekStart(() => {
      NavigationManager.current.handleAudioSeekStart();
    });
  }
}, [onAudioSeekStart]);


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


const findSectionByTime = (currentTime, timestamps) => {
  // 🔽 چک‌های امنیتی اضافه کن
  if (!timestamps || !Array.isArray(timestamps) || timestamps.length === 0) {
    console.log('❌ تایم‌استمپ‌ها نامعتبر:', timestamps);
    return { index: 0 };
  }
  
  if (currentTime === undefined || currentTime === null) {
    return { index: 0 };
  }

  const sortedTimestamps = [...timestamps].sort((a, b) => a.startTime - b.startTime);
  
  for (let i = 0; i < sortedTimestamps.length; i++) {
    const currentSection = sortedTimestamps[i];
    if (!currentSection || currentSection.sectionIndex === undefined) continue;
    
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
            '✅ تایماستمپ ثبت شد',
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
      Alert.alert('خطا', 'مشکلی در ثبت تایماستمپ پیش آمد');
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

        onSectionIndexChange(sectionIndex);
      } catch (error) {
        console.error('Error playing from timestamp:', error);
        Alert.alert('خطا', 'مشکلی در پخش صوت پیش آمد');
      }
    } else {
      Alert.alert(
        'اطلاع',
        `تایماستامپ برای بخش ${sectionIndex + 1} ثبت نشده است\n\nبخشهای موجود: ${timestamps.map(t => t.sectionIndex + 1).join(', ')}`
      );
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
        currentSectionIndex === section.sectionIndex && dynamicStyles.currentPlayingSection
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
  onScroll={NavigationManager.current.handleUserScroll}
  
  // 🔽 این ۴ خط رو اضافه کن
  onViewableItemsChanged={({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const firstVisible = viewableItems[0];
      if (firstVisible?.item?.sectionIndex !== undefined) {
        const realVisibleIndex = firstVisible.item.sectionIndex;
        setVisibleSectionIndex(realVisibleIndex);
        console.log(`👁️ موقعیت واقعی صفحه: بخش ${realVisibleIndex}`);
      }
    }
  }}
  viewabilityConfig={{
    itemVisiblePercentThreshold: 50
  }}
  
  scrollEventThrottle={16}
  initialNumToRender={15}
  maxToRenderPerBatch={10}
  windowSize={10}
  removeClippedSubviews={true}
  onScrollToIndexFailed={(info) => {
    // Fallback برای وقتی که اسکرول مستقیم شکست می‌خورد
    const offset = info.averageItemLength * info.index;
    flatListRef.current.scrollToOffset({ offset, animated: true });
  }}
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
