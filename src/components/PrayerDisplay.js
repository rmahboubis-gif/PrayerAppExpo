import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Dimensions
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { getPrayerById } from './PrayerManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PrayerDisplay = ({
  settings,
  currentPrayerId = 'p1',
  soundRef,
  isSyncMode = false,
  currentSectionIndex,
  onSectionIndexChange
}) => {
  const [prayerData, setPrayerData] = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allItemsRendered, setAllItemsRendered] = useState(false);  
  
  // بهینه‌سازی اسکرول
  const scrollViewRef = useRef(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 100 }); // ابتدا 100 تا
  const itemHeights = useRef({});
  const itemPositions = useRef({});

  const VISIBLE_ITEMS_COUNT = 30; // 100 آیتم در حافظه
  const BUFFER = 10; // بافر برای اسکرول

  // آیتم‌های قابل مشاهده
  const visibleItems = prayerData.slice(visibleRange.start, visibleRange.end);

  // محاسبه موقعیت‌ها
  const calculatePositions = () => {
    const positions = {};
    let currentY = 0;
    
    for (let i = 0; i < prayerData.length; i++) {
      positions[i] = currentY;
      currentY += itemHeights.current[i] || 120;
    }
    
    itemPositions.current = positions;
    return positions;
  };

  // آپدیت range بر اساس موقعیت مرکزی
  const updateVisibleRange = (centerIndex) => {
    const start = Math.max(0, centerIndex - VISIBLE_ITEMS_COUNT/2);
    const end = Math.min(prayerData.length, centerIndex + VISIBLE_ITEMS_COUNT/2);
    setVisibleRange({ start, end });
  };

  // اسکرول دقیق به ایندکس
const scrollToIndex = (index, source = 'unknown') => {
  console.log('🔍 scrollToIndex called:', { index, source });

  if (!scrollViewRef.current || index < 0 || index >= prayerData.length) return;

  console.log(`🎯 [${source}] Scrolling to index: ${index}`);

  // اول range را حول هدف تنظیم کن
  updateVisibleRange(index);

  // 🔥 اگر کاربر کلیک کرده، مستقیم اسکرول کن (بدون تاخیر)
  if (source === 'user_click') {
    const positions = calculatePositions();
    const targetY = positions[index] || 0;
    console.log(`🎯 Immediate scroll for user click to Y: ${targetY}`);
    scrollViewRef.current.scrollTo({ y: targetY, animated: true });
    return;
  }

  // برای سایر حالت‌ها (لود اولیه، تغییر صوت) تایمر نگه دار
  setTimeout(() => {
    const positions = calculatePositions();
    const targetY = positions[index] || 0;
    console.log(`🎯 Delayed scroll for ${source} to Y: ${targetY}`);
    scrollViewRef.current.scrollTo({ y: targetY, animated: true });
  }, 200);
};




  // مدیریت اسکرول کاربر
  const handleScroll = (event) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const positions = itemPositions.current;
    
    if (!positions || Object.keys(positions).length === 0) return;
    
    // پیدا کردن ایندکس مرکزی بر اساس موقعیت اسکرول
    let centerIndex = 0;
    for (let i = 0; i < prayerData.length; i++) {
      if (positions[i] > scrollY) {
        centerIndex = Math.max(0, i - 1);
        break;
      }
    }
    
    // اگر از مرز range فعلی دور شدیم، آپدیت کن
    const distanceFromStart = Math.abs(centerIndex - visibleRange.start);
    const distanceFromEnd = Math.abs(centerIndex - visibleRange.end);
    
    if (distanceFromStart > 20 || distanceFromEnd > 20) {
      updateVisibleRange(centerIndex);
    }
  };

  // اندازه‌گیری ارتفاع آیتم
  const measureItem = (index, height) => {
    if (itemHeights.current[index] !== height) {
      itemHeights.current[index] = height;
    }
  };

  // محاسبه ارتفاع spacer
  const getSpacerHeight = (type) => {
    const positions = itemPositions.current;
    
    if (!positions || Object.keys(positions).length === 0) {
      return 0;
    }
    
    if (type === 'before' && visibleRange.start > 0) {
      return positions[visibleRange.start] || 0;
    }
    
    if (type === 'after' && visibleRange.end < prayerData.length) {
      const totalHeight = positions[prayerData.length - 1] + (itemHeights.current[prayerData.length - 1] || 120);
      const endPosition = positions[visibleRange.end] || totalHeight;
      return totalHeight - endPosition;
    }
    
    return 0;
  };

  // لود محتوای دعا
  const loadPrayerContent = () => {
    try {
      setIsLoading(true);
      const prayer = getPrayerById(currentPrayerId);
      const content = prayer.contentFile;
      const prayerContent = typeof content === 'function' ? content() : content;

      if (!prayerContent || typeof prayerContent !== 'string') {
        console.error('❌ prayerContent is not a string');
        Alert.alert('خطا', 'متن دعا به درستی بارگذاری نشد');
        return;
      }

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
      console.log(`📖 Prayer text loaded: ${parsedData.length} sections`);
      
    } catch (error) {
      console.error('Error loading prayer content:', error);
      Alert.alert('خطا', 'مشکلی در بارگذاری متن دعا پیش آمد');
    } finally {
      setIsLoading(false);
    }
  };

  // لود تایم‌استامپ‌ها
  const loadTimestamps = async () => {
    try {
      const fileName = `prayers/${currentPrayerId}/timestamps.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (fileInfo.exists) {
        const fileContent = await FileSystem.readAsStringAsync(fileUri);
        const loadedTimestamps = JSON.parse(fileContent);
        setTimestamps(loadedTimestamps);
        console.log(`📊 Timestamps loaded: ${loadedTimestamps.length} items`);
      } else {
        setTimestamps([]);
        console.log('📊 No timestamps found');
      }
    } catch (error) {
      console.error('❌ Error loading timestamps:', error);
      setTimestamps([]);
    }
  };

  // هندل کلیک روی متن
const handleTextPress = async (sectionIndex) => {
  console.log(`👆 Clicked on section ${sectionIndex}`);

  if (isSyncMode) {
    const timestamp = timestamps.find(item => item.sectionIndex === sectionIndex);
    if (timestamp && soundRef) {
      try {
        await soundRef.setPositionAsync(timestamp.startTime);
        onSectionIndexChange(sectionIndex);
        
        // 🔥 مستقیم اسکرول کن با منبع user_click
        scrollToIndex(sectionIndex, 'user_click');
        
      } catch (error) {
        console.error('Error setting audio position:', error);
      }
    }
  } else {
    await recordTimestamp(sectionIndex);
  }
};

  // ثبت تایم‌استامپ
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

        const newTimestamp = {
          sectionIndex,
          startTime: currentPosition,
          arabic: section.arabic,
          persian: section.persian
        };

        const fileName = `prayers/${currentPrayerId}/timestamps.json`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        const dir = `${FileSystem.documentDirectory}prayers/${currentPrayerId}`;

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
          existingData[existingIndex] = newTimestamp;
        } else {
          existingData.push(newTimestamp);
        }

        existingData.sort((a, b) => a.sectionIndex - b.sectionIndex);
        await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(existingData, null, 2));

        setTimestamps(existingData);

        Alert.alert(
          '✅ تایماستمپ ثبت شد',
          `بخش: ${sectionIndex + 1}\nزمان: ${formatTime(currentPosition)}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error recording timestamp:', error);
      Alert.alert('خطا', 'مشکلی در ثبت تایماستمپ پیش آمد');
    }
  };

  // پیدا کردن سکشن بر اساس زمان
  const findSectionByTime = (currentTime, timestamps) => {
    if (!timestamps || !Array.isArray(timestamps) || timestamps.length === 0) {
      return { index: 0 };
    }

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


////4

// در PrayerDisplay.js، با سایر useEffectها این رو اضافه کنید:
// این useEffect رو جایگزین کنید:
useEffect(() => {
  if (prayerData.length > 0 && currentSectionIndex >= 0) {
    const isTargetVisible = currentSectionIndex >= visibleRange.start && 
                           currentSectionIndex < visibleRange.end;
    
    console.log('🎯 Target Visibility Check:', {
      target: currentSectionIndex,
      visibleRange,
      isTargetVisible
    });
    
    if (!isTargetVisible) {
      console.log('🚨 Target section not visible - expanding range');
      setVisibleRange({ 
        start: Math.max(0, currentSectionIndex - 10), 
        end: Math.min(prayerData.length, currentSectionIndex + 20)
      });
    }
  }
}, [currentSectionIndex, visibleRange, prayerData.length]);



// برای دیباگ - چک کردن props
useEffect(() => {
  console.log('🔍 PrayerDisplay received props:', {
    currentSectionIndex, // این باید تغییر کند
    prayerDataLength: prayerData.length,
    hasSoundRef: !!soundRef,
    visibleRange
  });
}, [currentSectionIndex, prayerData, soundRef, visibleRange]);

// برای دیباگ - چک کردن اسکرول
useEffect(() => {
  console.log('🎯 currentSectionIndex changed:', currentSectionIndex);
  
  if (currentSectionIndex >= 0 && prayerData.length > 0) {
    console.log('🔄 Should scroll to section:', currentSectionIndex);
    setTimeout(() => {
      scrollToIndex(currentSectionIndex, 'section_change');
    }, 100);
  }
}, [currentSectionIndex, prayerData.length]);



useEffect(() => {
  console.log('🚨 VISIBLE_RANGE_DEBUG:', {
    visibleRange,
    prayerDataLength: prayerData.length,
    currentSectionIndex,
    hasScrollRef: !!scrollViewRef.current,
    visibleItemsCount: visibleItems.length
  });

  // چک کنیم آیا آیتم‌های visible رندر میشن
  if (visibleItems.length > 0) {
    console.log('👀 First visible item:', visibleItems[0].sectionIndex);
    console.log('👀 Last visible item:', visibleItems[visibleItems.length - 1].sectionIndex);
  } else {
    console.log('❌ No visible items!');
  }
}, [visibleRange, prayerData.length]);








  // useEffect اصلی برای اندازه‌گیری ارتفاع‌ها
  useEffect(() => {
    if (prayerData.length > 0) {
      const checkHeights = async () => {
        const savedVersion = await AsyncStorage.getItem(`@height_version_${currentPrayerId}`);
        const currentVersion = settings.heightVersion.toString();
        
        if (savedVersion !== currentVersion || Object.keys(itemHeights.current).length === 0) {
          console.log('🔄 Measuring all item heights...');
          
          // همه آیتم‌ها را رندر کن
          setVisibleRange({ start: 0, end: prayerData.length });
          
          const interval = setInterval(() => {
            const allMeasured = prayerData.every((_, i) => itemHeights.current[i] !== undefined);
            if (allMeasured) {
              clearInterval(interval);
              calculatePositions();
              AsyncStorage.setItem(`@height_version_${currentPrayerId}`, currentVersion);
              
              // حالا به حالت lazy برگرد
              const targetIndex = currentSectionIndex >= 0 ? currentSectionIndex : 0;
              updateVisibleRange(targetIndex);
              
              // اسکرول کن
              if (currentSectionIndex >= 0) {
                setTimeout(() => {
                  scrollToIndex(currentSectionIndex, 'initial_load');
                }, 100);
              }
            }
          }, 100);
          
          setTimeout(() => {
            clearInterval(interval);
          }, 5000);
        } else {
          // اگر ارتفاع‌ها از قبل هستند
          calculatePositions();
          const targetIndex = currentSectionIndex >= 0 ? currentSectionIndex : 0;
          updateVisibleRange(targetIndex);
          
          if (currentSectionIndex >= 0) {
            setTimeout(() => {
              scrollToIndex(currentSectionIndex, 'cached_heights');
            }, 100);
          }
        }
      };
      
      checkHeights();
    }
  }, [prayerData, settings.heightVersion, currentPrayerId, currentSectionIndex]);

  // لود اولیه
  useEffect(() => {
    if (currentPrayerId) {
      loadPrayerContent();
      loadTimestamps();
    }
  }, [currentPrayerId]);

  // ردیابی موقعیت صوت
  useEffect(() => {
    if (!soundRef || !isSyncMode || prayerData.length === 0) return;

    console.log('🔊 Audio position tracking activated');

    const checkAudioPosition = async () => {
      try {
        const status = await soundRef.getStatusAsync();
        if (status.isLoaded ){
	//&& status.isPlaying) {
          const currentTime = status.positionMillis;
          const currentSection = findSectionByTime(currentTime, timestamps);

          if (currentSection && currentSection.index !== undefined &&
              currentSection.index !== currentSectionIndex) {

            console.log(`🔊 Audio position: ${formatTime(currentTime)} -> section ${currentSection.index}`);
            onSectionIndexChange(currentSection.index);
          }
        }
      } catch (error) {
        console.error('❌ Error checking audio position:', error);
      }
    };

    const interval = setInterval(checkAudioPosition, 500);
    return () => clearInterval(interval);
  }, [soundRef, isSyncMode, timestamps, currentSectionIndex, onSectionIndexChange, prayerData]);

  // استایل‌ها و رندر (بدون تغییر)
  const getDynamicStyles = () => {
    const themeStyles = {
      light: {
        container: { backgroundColor: '#f5f5f5' },
        arabic: { color: '#000000' },
        persian: { color: '#333333' },
        sectionTouchable: { backgroundColor: '#ffffff' },
        currentPlayingSection: {
          backgroundColor: '#e3f2fd'
        }
      },
      dark: {
        container: { backgroundColor: '#1a1a1a' },
        arabic: { color: '#ffffff' },
        persian: { color: '#cccccc' },
        sectionTouchable: { backgroundColor: '#2d2d2d' },
        currentPlayingSection: {
          backgroundColor: '#3a3a3a'
        }
      },
      amber: {
        container: { backgroundColor: '#fef9e7' },
        arabic: { color: '#000000' },
        persian: { color: '#333333' },
        sectionTouchable: { backgroundColor: '#fcf3cf' },
        currentPlayingSection: {
          backgroundColor: '#fdebd0'
        }
      }
    };

    const currentTheme = themeStyles[settings.theme] || themeStyles.light;

    return StyleSheet.create({
      container: {
        flex: 1,
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

  const renderSection = (section, globalIndex) => {
    const dynamicStyles = getDynamicStyles();

    return (
      <View
        key={`section-${section.sectionIndex}`}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          measureItem(globalIndex, height);
        }}
      >
        <TouchableOpacity
          style={[
            dynamicStyles.section,
            currentSectionIndex === section.sectionIndex && dynamicStyles.currentPlayingSection
          ]}
          onPress={() => handleTextPress(section.sectionIndex)}
          activeOpacity={0.7}
        >
          <View>
            <Text style={styles.sectionIndexText}>
              بخش: {section.sectionIndex + 1}
            </Text>
            
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
          </View>
        </TouchableOpacity>
      </View>
    );
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
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
      >
        <View style={{ height: getSpacerHeight('before') }} />
        {visibleItems.map((item, localIndex) => {
          const globalIndex = visibleRange.start + localIndex;
          return renderSection(item, globalIndex);
        })}
        <View style={{ height: getSpacerHeight('after') }} />
      </ScrollView>
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
  },
  sectionIndexText: {
    fontSize: 12,
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 5,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  }
});

export default PrayerDisplay;
