// src/components/PrayerManager.js
import p1Content from '../assets/prayers/p1/content.js';
import p1Audio from '../assets/prayers/p1/audio.mp3';
import p2Content from '../assets/prayers/p2/content.js';
import p2Audio from '../assets/prayers/p2/audio.mp3';
import p3Content from '../assets/prayers/p3/content.js';
import p3Audio from '../assets/prayers/p3/audio.mp3';
import p4Content from '../assets/prayers/p4/content.js';
import p4Audio from '../assets/prayers/p4/audio.mp3';

export const PRAYERS = {
  'p1': {
    id: 'p1',
    title: 'دعای ابوحمزه ثمالی',
    description: 'از دعاهای معروف ماه رمضان',
    audioFile: p1Audio,
    contentFile: p1Content,
    timestampsFile: 'prayers/p1/timestamps.json'
  },
'p2': {
  id: 'p2',
  title: 'مناجات امیرالمومنین', 
  description: 'مناجات امام علی (ع)',
  audioFile: p2Audio,
  contentFile: p2Content,
  timestampsFile: 'p2/timestamps.json'
},
  'p3': {
    id: 'p3',
    title: 'مناجات شعبانیه',
    description:'مناجات امام علی علیه‌السلام در ماه شعبان',
    audioFile: p3Audio,
    contentFile: p3Content,
    timestampsFile: 'p3/timestamps.json'
  },
  'p4': {
    id: 'p4',
    title: 'دعای عرفه',
    description: 'دعای امام حسین (ع) در روز عرفه',
    audioFile: p4Audio,
    contentFile: p4Content,
    timestampsFile: 'p4/timestamps.json'
  }
/*
'p4': {
    id: 'p4',
    title: 'دعای عرفه',
    description: 'دعای امام حسین (ع) در روز عرفه',
    audioFile: p4Audio,
    contentFile: p4Content,
    timestampsFile: 'p4/timestamps.json'
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
