// src/components/Settings.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { SettingsManager } from './SettingsManager';
const Settings = ({ visible, onClose, onSettingsChange, currentSettings }) => {
  const [settings, setSettings] = useState(currentSettings);

  const fonts = [
    { name: 'پیشفرض', value: 'System' },
    { name: 'نسخ', value: 'noto-nastaliq-urdu' },
    { name: 'ثبت', value: 'ScheherazadeNew-Regular' },
    { name: 'آراسته', value: 'IranNastaliq' }
  ];

  const themes = [
    { name: '🌞 روز', value: 'light' },
    { name: '🌙 شب', value: 'dark' },
    { name: '🟠 کهربایی', value: 'amber' }
  ];

  const getThemeStyles = () => {
    const themeStyles = {
      light: {
        container: { backgroundColor: '#f8f9fa' },
        modalContainer: { backgroundColor: 'rgba(0,0,0,0.4)' },
        innerContainer: { backgroundColor: '#ffffff' },
        header: { color: '#2c3e50' },
        section: { backgroundColor: '#ffffff', borderColor: '#e9ecef' },
        sectionTitle: { color: '#495057' },
        option: { backgroundColor: '#f8f9fa', borderColor: '#dee2e6' },
        selectedOption: { backgroundColor: '#007bff', borderColor: '#0056b3' },
        optionText: { color: '#495057' },
        selectedOptionText: { color: 'white' },
        sizeButton: { backgroundColor: '#e9ecef' },
        sizeButtonText: { color: '#495057' },
        sizeText: { color: '#495057' },
        toggle: { backgroundColor: '#6c757d' },
        toggleActive: { backgroundColor: '#007bff' },
        toggleText: { color: 'white' },
        resetButton: { backgroundColor: '#dc3545' },
        applyButton: { backgroundColor: '#28a745' },
	cancelButton: { backgroundColor: '#6c757d' },
        buttonText: { color: 'white' }
      },
      dark: {
        container: { backgroundColor: '#1a1d23' },
        modalContainer: { backgroundColor: 'rgba(0,0,0,0.7)' },
        innerContainer: { backgroundColor: '#2d333b' },
        header: { color: '#ffffff' },
        section: { backgroundColor: '#343a40', borderColor: '#495057' },
        sectionTitle: { color: '#e9ecef' },
        option: { backgroundColor: '#495057', borderColor: '#6c757d' },
        selectedOption: { backgroundColor: '#0d6efd', borderColor: '#0a58ca' },
        optionText: { color: '#f8f9fa' },
        selectedOptionText: { color: 'white' },
        sizeButton: { backgroundColor: '#495057' },
        sizeButtonText: { color: '#f8f9fa' },
        sizeText: { color: '#f8f9fa' },
        toggle: { backgroundColor: '#6c757d' },
        toggleActive: { backgroundColor: '#0d6efd' },
        toggleText: { color: 'white' },
        resetButton: { backgroundColor: '#dc3545' },
        applyButton: { backgroundColor: '#198754' },
	cancelButton: { backgroundColor: '#6c757d' },
        buttonText: { color: 'white' }
      },
      amber: {
        container: { backgroundColor: '#fff9e6' },
        modalContainer: { backgroundColor: 'rgba(0,0,0,0.4)' },
        innerContainer: { backgroundColor: '#fff3cd' },
        header: { color: '#664d03' },
        section: { backgroundColor: '#ffecb5', borderColor: '#ffd54f' },
        sectionTitle: { color: '#664d03' },
        option: { backgroundColor: '#fff3cd', borderColor: '#ffd54f' },
        selectedOption: { backgroundColor: '#fd7e14', borderColor: '#dc6502' },
        optionText: { color: '#664d03' },
        selectedOptionText: { color: 'white' },
        sizeButton: { backgroundColor: '#ffd54f' },
        sizeButtonText: { color: '#664d03' },
        sizeText: { color: '#664d03' },
        toggle: { backgroundColor: '#ffc107' },
        toggleActive: { backgroundColor: '#fd7e14' },
        toggleText: { color: '#664d03' },
        resetButton: { backgroundColor: '#dc3545' },
        applyButton: { backgroundColor: '#198754' },
	cancelButton: { backgroundColor: '#6c757d' },
        buttonText: { color: 'white' }
      }
    };

    return themeStyles[currentSettings.theme] || themeStyles.light;
  };
 const applySettings = () => {
 // console.log('💾 درحال ذخیره تنظیمات:', settings); // اینجا
  onSettingsChange(settings);
  SettingsManager.saveSettings(settings); // این باید صدا زده بشه
  onClose();
};
  const resetToDefaults = async () => {
    const defaults = {
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
    setSettings(defaults);
  };

  const themeStyles = getThemeStyles();
  return (
    <Modal   visible={visible}  animationType="fade"  transparent={true}  onRequestClose={onClose} >
      <View style={[styles.modalContainer, themeStyles.modalContainer]}>
        <View style={[styles.container, themeStyles.innerContainer]}>
          <Text style={[styles.header, themeStyles.header]}>⚙️ تنظیمات نمایش</Text>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

            {/* حالت پخش */}
            <View style={[styles.section, themeStyles.section]}>
              <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>🎵 حالت پخش</Text>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  settings.isSyncMode ? themeStyles.toggleActive : themeStyles.toggle
                ]}
                onPress={() => setSettings({...settings, isSyncMode: !settings.isSyncMode})}
              >
                <Text style={[styles.toggleText, themeStyles.toggleText]}>
                  {settings.isSyncMode ? '✅ پخش همگام فعال' : '❌ پخش همگام غیرفعال'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.toggleDescription}>
                {settings.isSyncMode 
                  ? 'کلیک روی متن، صوت را از زمان ذخیره شده پخش می‌کند' 
                  : 'کلیک روی متن، تایم‌استامپ جدید ثبت می‌کند'}
              </Text>
            </View>

            {/* نمایش متن */}
            <View style={[styles.section, themeStyles.section]}>
              <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>👁️ نمایش متن</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleSmall,
                    settings.showArabic ? themeStyles.toggleActive : themeStyles.toggle
                  ]}

onPress={() => {
  const newShowArabic = !settings.showArabic;
  const newShowPersian = settings.showPersian;

  // اگر هر دو غیرفعال میشن، جلوگیری کن
  if (!newShowArabic && !newShowPersian) {
    Alert.alert('توجه', 'حداقل یک زبان باید فعال باشد');
    return;
  }

  setSettings({...settings, showArabic: newShowArabic});
}}
                >
                  <Text style={[styles.toggleTextSmall, themeStyles.toggleText]}>
                    {settings.showArabic ? '✅' : '☑️'} عربی
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleSmall,
                    settings.showPersian ? themeStyles.toggleActive : themeStyles.toggle
                  ]}
                 onPress={() => {
  const newShowPersian = !settings.showPersian;
  const newShowArabic = settings.showArabic;
  // اگر هر دو غیرفعال میشن، جلوگیری کن
  if (!newShowPersian && !newShowArabic) {
    Alert.alert('توجه', 'حداقل یک زبان باید فعال باشد');
    return;
  }

  setSettings({...settings, showPersian: newShowPersian});
}}
                >
                  <Text style={[styles.toggleTextSmall, themeStyles.toggleText]}>
                    {settings.showPersian ? '✅' : '☑️'} فارسی
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* انتخاب فونت */}
            <View style={[styles.section, themeStyles.section]}>
              <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>🔤 فونت متن</Text>
              <View style={styles.optionsRow}>
                {fonts.map(font => (
                  <TouchableOpacity
                    key={font.value}
                    style={[
                      styles.optionSmall,
                      themeStyles.option,
                      settings.fontFamily === font.value && styles.selectedOptionSmall,
                      settings.fontFamily === font.value && themeStyles.selectedOption
                    ]}
                    onPress={() => setSettings({...settings, fontFamily: font.value})}
                  >
                    <Text style={[
                      styles.optionTextSmall,
                      themeStyles.optionText,
                      settings.fontFamily === font.value && themeStyles.selectedOptionText
                    ]}>
                      {font.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* انتخاب تم */}
            <View style={[styles.section, themeStyles.section]}>
              <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>🎨 تم رنگی</Text>
              <View style={styles.optionsRow}>
                {themes.map(theme => (
                  <TouchableOpacity
                    key={theme.value}
                    style={[
                      styles.optionSmall,
                      themeStyles.option,
                      settings.theme === theme.value && styles.selectedOptionSmall,
                      settings.theme === theme.value && themeStyles.selectedOption
                    ]}
                    onPress={() => setSettings({...settings, theme: theme.value})}
                  >
                    <Text style={[
                      styles.optionTextSmall,
                      themeStyles.optionText,
                      settings.theme === theme.value && themeStyles.selectedOptionText
                    ]}>
                      {theme.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* سایز متن */}
            <View style={[styles.section, themeStyles.section]}>
              <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>📏 سایز متن</Text>
              
              <View style={styles.sizeControl}>
                <Text style={[styles.sizeLabel, themeStyles.sectionTitle]}>عربی</Text>
                <View style={styles.sizeControls}>
                  <TouchableOpacity
                    style={[styles.sizeButton, themeStyles.sizeButton]}
                    onPress={() => setSettings({...settings, arabicSize: Math.max(16, settings.arabicSize - 2)})}
                  >
                    <Text style={[styles.sizeButtonText, themeStyles.sizeButtonText]}>A-</Text>
                  </TouchableOpacity>
                  <Text style={[styles.sizeValue, themeStyles.sizeText]}>{settings.arabicSize}</Text>
                  <TouchableOpacity
                    style={[styles.sizeButton, themeStyles.sizeButton]}
                    onPress={() => setSettings({...settings, arabicSize: Math.min(32, settings.arabicSize + 2)})}
                  >
                    <Text style={[styles.sizeButtonText, themeStyles.sizeButtonText]}>A+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.sizeControl}>
                <Text style={[styles.sizeLabel, themeStyles.sectionTitle]}>فارسی</Text>
                <View style={styles.sizeControls}>
                  <TouchableOpacity
                    style={[styles.sizeButton, themeStyles.sizeButton]}
                    onPress={() => setSettings({...settings, persianSize: Math.max(12, settings.persianSize - 2)})}
                  >
                    <Text style={[styles.sizeButtonText, themeStyles.sizeButtonText]}>A-</Text>
                  </TouchableOpacity>
                  <Text style={[styles.sizeValue, themeStyles.sizeText]}>{settings.persianSize}</Text>
                  <TouchableOpacity
                    style={[styles.sizeButton, themeStyles.sizeButton]}
                    onPress={() => setSettings({...settings, persianSize: Math.min(24, settings.persianSize + 2)})}
                  >
                    <Text style={[styles.sizeButtonText, themeStyles.sizeButtonText]}>A+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* سبک متن */}
            <View style={[styles.section, themeStyles.section]}>
              <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>✨ سبک متن</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleSmall,
                    settings.arabicBold ? themeStyles.toggleActive : themeStyles.toggle
                  ]}
                  onPress={() => setSettings({...settings, arabicBold: !settings.arabicBold})}
                >
                  <Text style={[styles.toggleTextSmall, themeStyles.toggleText]}>
                    {settings.arabicBold ? '✅' : '☑️'} عربی بولد
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.toggleSmall,
                    settings.persianBold ? themeStyles.toggleActive : themeStyles.toggle
                  ]}
                  onPress={() => setSettings({...settings, persianBold: !settings.persianBold})}
                >
                  <Text style={[styles.toggleTextSmall, themeStyles.toggleText]}>
                    {settings.persianBold ? '✅' : '☑️'} فارسی بولد
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>
<View style={styles.buttons}>
  <TouchableOpacity
    style={[styles.cancelButton, themeStyles.cancelButton]}
    onPress={onClose}
  >
    <View style={styles.buttonContent}>
      <Text style={styles.buttonIcon}>❌</Text>
      <Text style={[styles.buttonText, themeStyles.buttonText]}>انصراف</Text>
    </View>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.resetButton, themeStyles.resetButton]}
    onPress={resetToDefaults}
  >
    <View style={styles.buttonContent}>
      <Text style={styles.buttonIcon}>🔄</Text>
      <Text style={[styles.buttonText, themeStyles.buttonText]}>بازنشانی</Text>
    </View>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.applyButton, themeStyles.applyButton]}
    onPress={applySettings}
  >
    <View style={styles.buttonContent}>
      <Text style={styles.buttonIcon}>💾</Text>
      <Text style={[styles.buttonText, themeStyles.buttonText]}>ذخیره</Text>
    </View>
  </TouchableOpacity>
</View>
</View>
</View>
</Modal>
);
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderRadius: 20,
    padding: 20,
    height: '90%',
    marginHorizontal: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  optionSmall: {
    flex: 1,
    padding: 10,
    margin: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 70,
  },
  selectedOptionSmall: {
    borderWidth: 2,
  },
  optionTextSmall: {
    fontSize: 12,
    textAlign: 'center'
  },
  sizeControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sizeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  sizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  sizeButton: {
    padding: 8,
    borderRadius: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  sizeButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  sizeValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 15,
    minWidth: 25,
    textAlign: 'center'
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggleButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleSmall: {
    flex: 1,
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  toggleTextSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  toggleDescription: {
    fontSize: 11,
    textAlign: 'center',
    color: '#6c757d',
    marginTop: 4,
  },
buttons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 20,
  paddingTop: 20,
  borderTopWidth: 1,
  borderTopColor: '#dee2e6',
},
buttonContent: {
  alignItems: 'center',
  justifyContent: 'center',
},
buttonIcon: {
  fontSize: 16,
  marginBottom: 4,
},
buttonText: {
  fontWeight: 'bold',
  fontSize: 12,
  textAlign: 'center',
},
cancelButton: {
  padding: 12,
  borderRadius: 8,
  width: '30%',
  alignItems: 'center',
},
resetButton: {
  padding: 12,
  borderRadius: 8,
  width: '30%', // 🔽 همین
  alignItems: 'center',
},
applyButton: {
  padding: 12,
  borderRadius: 8,
  width: '30%', // 🔽 همین
  alignItems: 'center',
}
});

export default Settings;
