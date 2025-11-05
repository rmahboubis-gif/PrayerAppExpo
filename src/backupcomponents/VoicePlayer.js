// src/components/VoicePlayer.js
import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, PanResponder, AppState } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { getPrayerById } from './PrayerManager';

let positionUpdateInterval = null;

const VoicePlayer = ({ settings, currentPrayerId = 'p1', onSoundRefReady,onPositionChange }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [appState, setAppState] = useState(AppState.currentState);
  const progressBarRef = useRef(null);

  const speedOptions = [1.0, 2.5];

  useEffect(() => {
    setupAudio();
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      cleanupAudio();
    };
  }, []);

  // سنک چک ساده
  useEffect(() => {
    if (!isPlaying || !sound) return;

    let mounted = true;
    let lastCheckTime = Date.now();

    const interval = setInterval(async () => {
      if (!mounted) return;

      try {
        const status = await sound.getStatusAsync();
        const currentTime = Date.now();
        const timePassed = currentTime - lastCheckTime;
        const expectedPosition = position + timePassed;
        const error = status.positionMillis - expectedPosition;

        if (Math.abs(error) > 50) {
          console.log(`❌ سنک خطا: ${Math.round(error)}ms`);
        }

        lastCheckTime = currentTime;
      } catch (error) {
        // ignore
      }
    }, 2000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isPlaying, sound, position]);

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
      if (sound) {
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
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

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
      if (onSoundRefReady) {
        onSoundRefReady(newSound);
      }

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

    // 🔽 این خط رو اضافه کن:
    if (onPositionChange) {
      onPositionChange(status.positionMillis);
    }

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
      } else {
        await sound.playAsync();
        setIsPlaying(true);
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
    const newPosition = Math.min(duration, position + 10000);
    await sound.setPositionAsync(newPosition);
    setPosition(newPosition);
    // 🔽 این خط رو اضافه کن
    if (onPositionChange) {
      onPositionChange(newPosition);
    }
  } catch (error) {
    console.error('Error seeking forward:', error);
  }
};

const seekBackward = async () => {
  if (!sound) return;

  try {
    const newPosition = Math.max(0, position - 10000);
    await sound.setPositionAsync(newPosition);
    setPosition(newPosition);
    // 🔽 این خط رو اضافه کن
    if (onPositionChange) {
      onPositionChange(newPosition);
    }
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
    // 🔽 این خط رو اضافه کن
    if (onPositionChange) {
      onPositionChange(newPosition);
    }
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
        resetButton: { backgroundColor: '#8E8E93' }
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
        resetButton: { backgroundColor: '#666666' }
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
        resetButton: { backgroundColor: '#bdc3c7' }
      }
    };
    return themeStyles[settings.theme] || themeStyles.light;
  };

  const themeStyles = getThemeStyles();

  return (
    <View style={[styles.container, themeStyles.container]}>
      <View style={styles.topRow}>
        <Text style={[styles.timeText, themeStyles.timeText]}>{formatTime(position)}</Text>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={[styles.seekButton, themeStyles.seekButton]} onPress={seekBackward}>
            <Text style={styles.seekButtonText}>⏪</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.speedButton, themeStyles.speedButton]} onPress={cyclePlaybackRate}>
            <Text style={styles.speedButtonText}>{playbackRate}x</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.playButton, themeStyles.playButton]} onPress={togglePlayPause}>
            <Text style={styles.playIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.seekButton, themeStyles.seekButton]} onPress={seekForward}>
            <Text style={styles.seekButtonText}>⏩</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.resetButton, themeStyles.resetButton]} onPress={resetAudio}>
            <Text style={styles.resetButtonText}>↺</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.timeText, themeStyles.timeText]}>{formatTime(duration)}</Text>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.progressWrapper} ref={progressBarRef}>
          <View style={[styles.progressBar, themeStyles.progressBar]}>
            <View style={[styles.progressFill, themeStyles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <View style={[styles.progressHandle, themeStyles.progressHandle, { left: `${progressPercent}%` }]} {...panResponder.panHandlers} />
        </View>
      </View>
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
