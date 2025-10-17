import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';

const Settings = ({ visible, onClose, onSettingsChange, currentSettings }) => {
  const [settings, setSettings] = useState(currentSettings);

  const fonts = [
    { name: 'پیش‌فرض', value: 'System' },
    { name: 'نسخ', value: 'noto-nastaliq-urdu' },
    { name: 'ثبت', value: 'ScheherazadeNew-Regular' },
    { name: 'آراسته', value: 'IranNastaliq' }
  ];

  const themes = [
    { name: 'روز', value: 'light' },
    { name: 'شب', value: 'dark' },
    { name: 'کهربایی', value: 'amber' }
  ];

  // استایل‌های داینامیک بر اساس تم
  const getThemeStyles = () => {
    const themeStyles = {
      light: {
        container: { backgroundColor: '#f5f5f5' },
        modalContainer: { backgroundColor: 'rgba(0,0,0,0.5)' },
        innerContainer: { backgroundColor: '#f5f5f5' },
        header: { color: '#2c3e50' },
        section: { backgroundColor: 'white' },
        sectionTitle: { color: '#34495e' },
        option: { backgroundColor: '#f8f9fa', borderColor: '#e9ecef' },
        selectedOption: { backgroundColor: '#3498db', borderColor: '#2980b9' },
        optionText: { color: '#2c3e50' },
        selectedOptionText: { color: 'white' },
        sizeButton: { backgroundColor: '#e9ecef' },
        sizeButtonText: { color: '#2c3e50' },
        sizeText: { color: '#2c3e50' },
        cancelButton: { backgroundColor: '#e74c3c' },
        applyButton: { backgroundColor: '#27ae60' },
        buttonText: { color: 'white' }
      },
      dark: {
        container: { backgroundColor: '#1a1a1a' },
        modalContainer: { backgroundColor: 'rgba(0,0,0,0.7)' },
        innerContainer: { backgroundColor: '#1a1a1a' },
        header: { color: '#ffffff' },
        section: { backgroundColor: '#2d2d2d' },
        sectionTitle: { color: '#ffffff' },
        option: { backgroundColor: '#404040', borderColor: '#555555' },
        selectedOption: { backgroundColor: '#4da6ff', borderColor: '#2980b9' },
        optionText: { color: '#ffffff' },
        selectedOptionText: { color: 'white' },
        sizeButton: { backgroundColor: '#404040' },
        sizeButtonText: { color: '#ffffff' },
        sizeText: { color: '#ffffff' },
        cancelButton: { backgroundColor: '#c0392b' },
        applyButton: { backgroundColor: '#27ae60' },
        buttonText: { color: 'white' }
      },
      amber: {
        container: { backgroundColor: '#fef9e7' },
        modalContainer: { backgroundColor: 'rgba(0,0,0,0.5)' },
        innerContainer: { backgroundColor: '#fef9e7' },
        header: { color: '#333333' },
        section: { backgroundColor: '#fcf3cf' },
        sectionTitle: { color: '#333333' },
        option: { backgroundColor: '#f7e8a4', borderColor: '#e6d9a5' },
        selectedOption: { backgroundColor: '#e67e22', borderColor: '#d35400' },
        optionText: { color: '#333333' },
        selectedOptionText: { color: 'white' },
        sizeButton: { backgroundColor: '#f7e8a4' },
        sizeButtonText: { color: '#333333' },
        sizeText: { color: '#333333' },
        cancelButton: { backgroundColor: '#e74c3c' },
        applyButton: { backgroundColor: '#27ae60' },
        buttonText: { color: 'white' }
      }
    };

    return themeStyles[currentSettings.theme] || themeStyles.light;
  };

  const applySettings = () => {
    onSettingsChange(settings);
    onClose();
  };

  const themeStyles = getThemeStyles();

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={[styles.modalContainer, themeStyles.modalContainer]}>
        <View style={[styles.container, themeStyles.innerContainer]}>
          <Text style={[styles.header, themeStyles.header]}>تنظیمات نمایش</Text>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* انتخاب فونت */}
            <View style={[styles.section, themeStyles.section]}>
              <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>فونت متن</Text>
              {fonts.map(font => (
                <TouchableOpacity
                  key={font.value}
                  style={[
                    styles.option,
                    themeStyles.option,
                    settings.fontFamily === font.value && styles.selectedOption,
                    settings.fontFamily === font.value && themeStyles.selectedOption
                  ]}
                  onPress={() => setSettings({...settings, fontFamily: font.value})}
                >
                  <Text style={[
                    styles.optionText,
                    themeStyles.optionText,
                    settings.fontFamily === font.value && styles.selectedOptionText,
                    settings.fontFamily === font.value && themeStyles.selectedOptionText
                  ]}>
                    {font.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* انتخاب تم */}
            <View style={[styles.section, themeStyles.section]}>
              <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>تم رنگی</Text>
              {themes.map(theme => (
                <TouchableOpacity
                  key={theme.value}
                  style={[
                    styles.option,
                    themeStyles.option,
                    settings.theme === theme.value && styles.selectedOption,
                    settings.theme === theme.value && themeStyles.selectedOption
                  ]}
                  onPress={() => setSettings({...settings, theme: theme.value})}
                >
                  <Text style={[
                    styles.optionText,
                    themeStyles.optionText,
                    settings.theme === theme.value && styles.selectedOptionText,
                    settings.theme === theme.value && themeStyles.selectedOptionText
                  ]}>
                    {theme.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* سایز متن عربی */}
            <View style={[styles.section, themeStyles.section]}>
              <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>سایز متن عربی</Text>
              <View style={styles.sizeControls}>
                <TouchableOpacity
                  style={[styles.sizeButton, themeStyles.sizeButton]}
                  onPress={() => setSettings({...settings, arabicSize: Math.max(16, settings.arabicSize - 2)})}
                >
                  <Text style={[styles.sizeButtonText, themeStyles.sizeButtonText]}>A-</Text>
                </TouchableOpacity>
                <Text style={[styles.sizeText, themeStyles.sizeText]}>{settings.arabicSize}</Text>
                <TouchableOpacity
                  style={[styles.sizeButton, themeStyles.sizeButton]}
                  onPress={() => setSettings({...settings, arabicSize: Math.min(32, settings.arabicSize + 2)})}
                >
                  <Text style={[styles.sizeButtonText, themeStyles.sizeButtonText]}>A+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* سایز متن فارسی */}
            <View style={[styles.section, themeStyles.section]}>
              <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>سایز متن فارسی</Text>
              <View style={styles.sizeControls}>
                <TouchableOpacity
                  style={[styles.sizeButton, themeStyles.sizeButton]}
                  onPress={() => setSettings({...settings, persianSize: Math.max(12, settings.persianSize - 2)})}
                >
                  <Text style={[styles.sizeButtonText, themeStyles.sizeButtonText]}>A-</Text>
                </TouchableOpacity>
                <Text style={[styles.sizeText, themeStyles.sizeText]}>{settings.persianSize}</Text>
                <TouchableOpacity
                  style={[styles.sizeButton, themeStyles.sizeButton]}
                  onPress={() => setSettings({...settings, persianSize: Math.min(24, settings.persianSize + 2)})}
                >
                  <Text style={[styles.sizeButtonText, themeStyles.sizeButtonText]}>A+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* تنظیمات بولد */}
            <View style={[styles.section, themeStyles.section]}>
              <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>سبک متن</Text>
              
              <TouchableOpacity
                style={[
                  styles.option,
                  themeStyles.option,
                  settings.arabicBold && styles.selectedOption,
                  settings.arabicBold && themeStyles.selectedOption
                ]}
                onPress={() => setSettings({...settings, arabicBold: !settings.arabicBold})}
              >
                <Text style={[
                  styles.optionText,
                  themeStyles.optionText,
                  settings.arabicBold && styles.selectedOptionText,
                  settings.arabicBold && themeStyles.selectedOptionText
                ]}>
                  {settings.arabicBold ? '✅ متن عربی بولد' : 'متن عربی بولد'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.option,
                  themeStyles.option,
                  settings.persianBold && styles.selectedOption,
                  settings.persianBold && themeStyles.selectedOption
                ]}
                onPress={() => setSettings({...settings, persianBold: !settings.persianBold})}
              >
                <Text style={[
                  styles.optionText,
                  themeStyles.optionText,
                  settings.persianBold && styles.selectedOptionText,
                  settings.persianBold && themeStyles.selectedOptionText
                ]}>
                  {settings.persianBold ? '✅ متن فارسی بولد' : 'متن فارسی بولد'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* فاصله خطوط */}
            <View style={[styles.section, themeStyles.section]}>
              <Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>فاصله خطوط</Text>
              <View style={styles.sizeControls}>
                <TouchableOpacity
                  style={[styles.sizeButton, themeStyles.sizeButton]}
                  onPress={() => setSettings({...settings, lineHeight: Math.max(1.5, (settings.lineHeight || 1.8) - 0.1)})}
                >
                  <Text style={[styles.sizeButtonText, themeStyles.sizeButtonText]}>-</Text>
                </TouchableOpacity>
                <Text style={[styles.sizeText, themeStyles.sizeText]}>{((settings.lineHeight || 1.8) * 100).toFixed(0)}%</Text>
                <TouchableOpacity
                  style={[styles.sizeButton, themeStyles.sizeButton]}
                  onPress={() => setSettings({...settings, lineHeight: Math.min(2.5, (settings.lineHeight || 1.8) + 0.1)})}
                >
                  <Text style={[styles.sizeButtonText, themeStyles.sizeButtonText]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.cancelButton, themeStyles.cancelButton]} onPress={onClose}>
              <Text style={[styles.buttonText, themeStyles.buttonText]}>انصراف</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.applyButton, themeStyles.applyButton]} onPress={applySettings}>
              <Text style={[styles.buttonText, themeStyles.buttonText]}>اعمال تنظیمات</Text>
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
    justifyContent: 'center',
    padding: 20
  },
  container: {
    flex: 1,
    maxHeight: '80%',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  option: {
    padding: 12,
    marginBottom: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  selectedOption: {
    borderColor: '#2980b9'
  },
  optionText: {
    fontSize: 14,
    textAlign: 'center'
  },
  selectedOptionText: {
    fontWeight: 'bold'
  },
  sizeControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15
  },
  sizeButton: {
    padding: 10,
    borderRadius: 6,
    minWidth: 45,
    alignItems: 'center'
  },
  sizeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sizeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6'
  },
  cancelButton: {
    padding: 12,
    borderRadius: 6,
    flex: 1,
    marginRight: 8
  },
  applyButton: {
    padding: 12,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8
  },
  buttonText: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14
  }
});

export default Settings; // مطمئن شو export default باشه
