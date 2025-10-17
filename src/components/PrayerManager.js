// src/components/PrayerManager.js
import p1Content from '../assets/prayers/p1/content.js';
import p1Audio from '../assets/prayers/p1/audio.mp3';


export const PRAYERS = {
  'p1': {
    id: 'p1',
    title: 'دعای ابوحمزه ثمالی',
    description: 'از دعاهای معروف ماه رمضان',
    audioFile: p1Audio,
    contentFile: p1Content,
    timestampsFile: 'prayers/p1/timestamps.json'
  },/*
  'p2': {
    id: 'p2',
    title: 'مناجات شعبانیه',
    description: 'مناجات امام علی (ع) در ماه شعبان',
    audioFile: require('../assets/prayers/p2/audio.mp3'),
    contentFile: require('../assets/prayers/p2/content.js'),
    timestampsFile: 'p2/timestamps.json'
  },
  'p3': {
    id: 'p3',
    title: 'دعای عرفه',
    description: 'دعای امام حسین (ع) در روز عرفه',
    audioFile: require('../assets/prayers/p3/audio.mp3'),
    contentFile: require('../assets/prayers/p3/content.js'),
    timestampsFile: 'p3/timestamps.json'
  },
  'p4': {
    id: 'p4',
    title: 'دعای کمیل',
    description: 'دعای حضرت خضر (ع)',
    audioFile: require('../assets/prayers/p4/audio.mp3'),
    contentFile: require('../assets/prayers/p4/content.js'),
    timestampsFile: 'p4/timestamps.json'
  },
  'p5': {
    id: 'p5',
    title: 'دعای توسل',
    description: 'دعای توسل به اهل بیت (ع)',
    audioFile: require('../assets/prayers/p5/audio.mp3'),
    contentFile: require('../assets/prayers/p5/content.js'),
    timestampsFile: 'p5/timestamps.json'
  }*/
};

export const getPrayerById = (prayerId) => {
  return PRAYERS[prayerId] || PRAYERS['p1']; // پیش‌فرض p1
};

export const getAllPrayers = () => {
  return Object.values(PRAYERS);
};

// تابع کمکی برای گرفتن مسیر کامل تایم‌استمپ
export const getTimestampsPath = (prayerId) => {
  const prayer = getPrayerById(prayerId);
  return `${FileSystem.documentDirectory}prayers/${prayer.timestampsFile}`;
};

// تابع برای اضافه کردن دعای جدید
export const addPrayer = (prayerId, title, description, audioPath, contentPath) => {
  PRAYERS[prayerId] = {
    id: prayerId,
    title,
    description,
    audioFile: audioPath,
    contentFile: contentPath,
    timestampsFile: `${prayerId}/timestamps.json`
  };
};

// تابع برای حذف دعا
export const removePrayer = (prayerId) => {
  delete PRAYERS[prayerId];
};
