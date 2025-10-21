// src/components/VoicePlayer.js
import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, PanResponder, AppState } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { getPrayerById } from './PrayerManager';

// برای آپدیت مداوم position
let positionUpdateInterval = null;

const VoicePlayer = ({ settings, currentPrayerId = 'p1', onSoundRefReady }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [appState, setAppState] = useState(AppState.currentState);
  const [isRecordingMode, setIsRecordingMode] = useState(false);
  const progressBarRef = useRef(null);

  const speedOptions = [0.75, 1.0, 2.5];

  useEffect(() => {
    setupAudio();

    // گوش دادن به تغییرات وضعیت برنامه
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      cleanupAudio();
    };
  }, [currentPrayerId]);

  const cleanupAudio = async () => {
    stopPositionUpdates();
    if (sound) {
      await sound.unloadAsync();
    }
  };

  const startPositionUpdates = () => {
    if (positionUpdateInterval) {
      clearInterval(positionUpdateInterval);
    }

    positionUpdateInterval = setInterval(async () => {
      if (sound && isPlaying) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            setPosition(status.positionMillis);
            setDuration(status.durationMillis || duration);
          }
        } catch (error) {
          console.error('Error getting playback status:', error);
        }
      }
    }, 500);
  };

  const stopPositionUpdates = () => {
    if (positionUpdateInterval) {
      clearInterval(positionUpdateInterval);
      positionUpdateInterval = null;
    }
  };

  const handleAppStateChange = async (nextAppState) => {
    setAppState(nextAppState);

    if (nextAppState === 'background' && isPlaying) {
      console.log('برنامه به پس‌زمینه رفت، صوت ادامه داره...');
    }
  };

  const setupAudio = async () => {
    try {
      // تنظیمات صوتی برای پخش در پس‌زمینه
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // اگر صوت قبلی وجود داره، پاکش کن
      if (sound) {
        await sound.unloadAsync();
      }

      const prayer = getPrayerById(currentPrayerId);
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        prayer.audioFile,
        {
          shouldPlay: false,
          staysActiveInBackground: true,
        },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      
      // ارسال ref به parent component
      if (onSoundRefReady) {
        onSoundRefReady(newSound);
      }

      // گرفتن وضعیت اولیه
      const status = await newSound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis || 0);
        setPosition(status.positionMillis || 0);
      }
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || duration);

      if (status.isPlaying && !positionUpdateInterval) {
        startPositionUpdates();
      } else if (!status.isPlaying && positionUpdateInterval) {
        stopPositionUpdates();
      }

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
        stopPositionUpdates();
      }
    }
  };

  const togglePlayPause = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
        stopPositionUpdates();
      } else {
        await sound.playAsync();
        setIsPlaying(true);
        startPositionUpdates();
      }
    } catch (error) {
      console.error('Error playing/pausing audio:', error);
    }
  };

  const cyclePlaybackRate = async () => {
    if (!sound) return;

    try {
      const currentIndex = speedOptions.indexOf(playbackRate);
      const nextIndex = (currentIndex + 1) % speedOptions.length;
      const nextRate = speedOptions[nextIndex];

      await sound.setRateAsync(nextRate, true);
      setPlaybackRate(nextRate);
    } catch (error) {
      console.error('Error changing playback rate:', error);
    }
  };

  const seekForward = async () => {
    if (!sound || !duration) return;

    try {
      const newPosition = Math.min(
        duration,
        position + 10000 // 10 ثانیه جلو
      );
      await sound.setPositionAsync(newPosition);
      setPosition(newPosition);
    } catch (error) {
      console.error('Error seeking forward:', error);
    }
  };

  const seekBackward = async () => {
    if (!sound) return;

    try {
      const newPosition = Math.max(
        0,
        position - 10000 // 10 ثانیه عقب
      );
      await sound.setPositionAsync(newPosition);
      setPosition(newPosition);
    } catch (error) {
      console.error('Error seeking backward:', error);
    }
  };

  const seekAudio = async (progress) => {
    if (!sound || !duration) return;

    try {
      const newPosition = (progress / 100) * duration;
      await sound.setPositionAsync(newPosition);
      setPosition(newPosition);
    } catch (error) {
      console.error('Error seeking audio:', error);
    }
  };

  const resetAudio = async () => {
    if (!sound) return;

    try {
      await sound.setPositionAsync(0);
      setPosition(0);
      if (isPlaying) {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error resetting audio:', error);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (event, gestureState) => {
      if (progressBarRef.current) {
        progressBarRef.current.measure((x, y, width, height, pageX, pageY) => {
          const touchX = event.nativeEvent.pageX - pageX;
          const progress = Math.max(0, Math.min(100, (touchX / width) * 100));
          seekAudio(progress);
        });
      }
    },
    onPanResponderRelease: () => {}
  });

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  // استایل‌های داینامیک بر اساس تم
  const getThemeStyles = () => {
    const themeStyles = {
      light: {
        container: { backgroundColor: '#ffffff' },
        timeText: { color: '#666666' },
        progressBar: { backgroundColor: '#E0E0E0' },
        progressFill: { backgroundColor: '#007AFF' },
        progressHandle: { backgroundColor: '#007AFF', borderColor: 'white' },
        playButton: { backgroundColor: '#007AFF' },
        speedButton: { backgroundColor: '#34C759' },
        seekButton: { backgroundColor: '#FF9500' },
        resetButton: { backgroundColor: '#8E8E93' },
        recordButtonActive: { backgroundColor: '#FF3B30' },
        recordButtonInactive: { backgroundColor: '#C0C0C0' },
        modeButton: { backgroundColor: '#007AFF' },
        prayerInfo: { color: '#333333' }
      },
      dark: {
        container: { backgroundColor: '#2d2d2d' },
        timeText: { color: '#cccccc' },
        progressBar: { backgroundColor: '#404040' },
        progressFill: { backgroundColor: '#4da6ff' },
        progressHandle: { backgroundColor: '#4da6ff', borderColor: '#2d2d2d' },
        playButton: { backgroundColor: '#4da6ff' },
        speedButton: { backgroundColor: '#2ecc71' },
        seekButton: { backgroundColor: '#e67e22' },
        resetButton: { backgroundColor: '#666666' },
        recordButtonActive: { backgroundColor: '#FF3B30' },
        recordButtonInactive: { backgroundColor: '#666666' },
        modeButton: { backgroundColor: '#4da6ff' },
        prayerInfo: { color: '#ffffff' }
      },
      amber: {
        container: { backgroundColor: '#fcf3cf' },
        timeText: { color: '#666666' },
        progressBar: { backgroundColor: '#e6d9a5' },
        progressFill: { backgroundColor: '#e67e22' },
        progressHandle: { backgroundColor: '#e67e22', borderColor: '#fcf3cf' },
        playButton: { backgroundColor: '#e67e22' },
        speedButton: { backgroundColor: '#27ae60' },
        seekButton: { backgroundColor: '#d35400' },
        resetButton: { backgroundColor: '#bdc3c7' },
        recordButtonActive: { backgroundColor: '#FF3B30' },
        recordButtonInactive: { backgroundColor: '#e6d9a5' },
        modeButton: { backgroundColor: '#e67e22' },
        prayerInfo: { color: '#333333' }
      }
    };

    return themeStyles[settings.theme] || themeStyles.light;
  };

  const themeStyles = getThemeStyles();

return (
  <View style={[styles.container, themeStyles.container]}>
    {/* ❌ حذف: اطلاعات دعای فعلی */}
    
    {/* ردیف بالا: اعداد و دکمه‌ها */}
    <View style={styles.topRow}>
      <Text style={[styles.timeText, themeStyles.timeText]}>{formatTime(position)}</Text>

      <View style={styles.buttonsContainer}>
        {/* دکمه عقب ۱۰ ثانیه */}
        <TouchableOpacity style={[styles.seekButton, themeStyles.seekButton]} onPress={seekBackward}>
          <Text style={styles.seekButtonText}>⏪</Text>
        </TouchableOpacity>

        {/* دکمه تغییر سرعت */}
        <TouchableOpacity style={[styles.speedButton, themeStyles.speedButton]} onPress={cyclePlaybackRate}>
          <Text style={styles.speedButtonText}>{playbackRate}x</Text>
        </TouchableOpacity>

        {/* دکمه پلی/پاز */}
        <TouchableOpacity style={[styles.playButton, themeStyles.playButton]} onPress={togglePlayPause}>
          <Text style={styles.playIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
        </TouchableOpacity>

        {/* دکمه جلو ۱۰ ثانیه */}
        <TouchableOpacity style={[styles.seekButton, themeStyles.seekButton]} onPress={seekForward}>
          <Text style={styles.seekButtonText}>⏩</Text>
        </TouchableOpacity>

        {/* دکمه ریست */}
        <TouchableOpacity style={[styles.resetButton, themeStyles.resetButton]} onPress={resetAudio}>
          <Text style={styles.resetButtonText}>↺</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.timeText, themeStyles.timeText]}>{formatTime(duration)}</Text>
    </View>

    {/* ردیف پایین: پروگرس بار */}
    <View style={styles.bottomRow}>
      <View style={styles.progressWrapper} ref={progressBarRef}>
        <View style={[styles.progressBar, themeStyles.progressBar]}>
          <View style={[styles.progressFill, themeStyles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        <View style={[styles.progressHandle, themeStyles.progressHandle, { left: `${progressPercent}%` }]} {...panResponder.panHandlers} />
      </View>
    </View>

    {/* ❌ حذف: وضعیت پخش */}
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
  container: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    minHeight: 80,
  },
  prayerInfoRow: {
    marginBottom: 8,
    alignItems: 'center',
  },
  prayerInfo: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    alignItems: 'center',
    marginTop: 4,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  playIcon: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 1,
  },
  speedButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  seekButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 45,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  progressWrapper: {
    width: '100%',
    height: 20,
    justifyContent: 'center',
    position: 'relative',
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressHandle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    top: 2,
    marginLeft: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 3,
  },
});

export default VoicePlayer;
