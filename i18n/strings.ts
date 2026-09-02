// Translation dictionaries for Astropanth. English is the source of truth; hi
// (Hindi) and mr (Marathi) are Devanagari translations. Keys are dotted and
// grouped by area. Add keys here and reference them via t('key') — see
// contexts/LanguageContext. Missing keys fall back to English, then the key.

export type Lang = 'en' | 'hi' | 'mr';

export const LANGUAGES: { code: Lang; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
];

type Dict = Record<string, string>;

const en: Dict = {
  // tabs
  'tab.home': 'Home',
  'tab.astrology': 'Astrology',
  'tab.numerology': 'Numerology',
  'tab.askastro': 'AskAstro',
  'tab.more': 'More',
  'tab.profile': 'Profile',
  // common
  'common.signInUp': 'Sign in / Sign up',
  'common.back': 'Back',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.gotIt': 'Got it',
  'common.unlock': 'Unlock reports',
  // home
  'home.welcomeTo': 'Welcome to',
  'home.welcomeBack': 'Welcome back, {name}',
  // profile
  'profile.about': 'About',
  'profile.version': 'Version {v}',
  'profile.shareApp': 'Share Astropanth',
  'profile.rateApp': 'Rate Astropanth',
  'profile.signOut': 'Sign Out',
  'profile.deleteAccount': 'Delete Account',
  'profile.reminders': 'Daily Horoscope Reminders',
  'profile.changePassword': 'Change Password',
  'profile.language': 'Language',
  // reports
  'report.preparingTitle': 'Preparing your report',
  'report.preparingBody': "We prepare each reading individually from your birth chart. It'll be ready within 24 hours — we'll send you a notification the moment it's done.",
  'report.readyBy': 'Usually ready by {time}',
  'report.signInTitle': 'Sign in to view reports',
  'report.unlockTitle': 'Unlock detailed reports',
};

const hi: Dict = {
  'tab.home': 'होम',
  'tab.astrology': 'ज्योतिष',
  'tab.numerology': 'अंकशास्त्र',
  'tab.askastro': 'AskAstro',
  'tab.more': 'अधिक',
  'tab.profile': 'प्रोफ़ाइल',
  'common.signInUp': 'साइन इन / साइन अप',
  'common.back': 'वापस',
  'common.save': 'सहेजें',
  'common.cancel': 'रद्द करें',
  'common.gotIt': 'ठीक है',
  'common.unlock': 'रिपोर्ट अनलॉक करें',
  'home.welcomeTo': 'स्वागत है',
  'home.welcomeBack': 'वापसी पर स्वागत है, {name}',
  'profile.about': 'ऐप के बारे में',
  'profile.version': 'संस्करण {v}',
  'profile.shareApp': 'Astropanth शेयर करें',
  'profile.rateApp': 'Astropanth को रेट करें',
  'profile.signOut': 'साइन आउट',
  'profile.deleteAccount': 'खाता हटाएं',
  'profile.reminders': 'दैनिक राशिफल रिमाइंडर',
  'profile.changePassword': 'पासवर्ड बदलें',
  'profile.language': 'भाषा',
  'report.preparingTitle': 'आपकी रिपोर्ट तैयार हो रही है',
  'report.preparingBody': 'हम आपकी जन्म कुंडली से हर रिपोर्ट अलग से तैयार करते हैं। यह 24 घंटों के भीतर तैयार हो जाएगी — तैयार होते ही हम आपको सूचना भेज देंगे।',
  'report.readyBy': 'आमतौर पर {time} तक तैयार',
  'report.signInTitle': 'रिपोर्ट देखने के लिए साइन इन करें',
  'report.unlockTitle': 'विस्तृत रिपोर्ट अनलॉक करें',
};

const mr: Dict = {
  'tab.home': 'होम',
  'tab.astrology': 'ज्योतिष',
  'tab.numerology': 'अंकशास्त्र',
  'tab.askastro': 'AskAstro',
  'tab.more': 'अधिक',
  'tab.profile': 'प्रोफाइल',
  'common.signInUp': 'साइन इन / साइन अप',
  'common.back': 'मागे',
  'common.save': 'जतन करा',
  'common.cancel': 'रद्द करा',
  'common.gotIt': 'ठीक आहे',
  'common.unlock': 'अहवाल अनलॉक करा',
  'home.welcomeTo': 'स्वागत आहे',
  'home.welcomeBack': 'पुन्हा स्वागत आहे, {name}',
  'profile.about': 'अ‍ॅपबद्दल',
  'profile.version': 'आवृत्ती {v}',
  'profile.shareApp': 'Astropanth शेअर करा',
  'profile.rateApp': 'Astropanth ला रेट करा',
  'profile.signOut': 'साइन आउट',
  'profile.deleteAccount': 'खाते हटवा',
  'profile.reminders': 'दैनिक राशिफल स्मरण',
  'profile.changePassword': 'पासवर्ड बदला',
  'profile.language': 'भाषा',
  'report.preparingTitle': 'तुमचा अहवाल तयार होत आहे',
  'report.preparingBody': 'आम्ही तुमच्या जन्म कुंडलीवरून प्रत्येक अहवाल स्वतंत्रपणे तयार करतो. तो 24 तासांत तयार होईल — तयार होताच आम्ही तुम्हाला सूचना पाठवू.',
  'report.readyBy': 'सहसा {time} पर्यंत तयार',
  'report.signInTitle': 'अहवाल पाहण्यासाठी साइन इन करा',
  'report.unlockTitle': 'सविस्तर अहवाल अनलॉक करा',
};

export const DICTS: Record<Lang, Dict> = { en, hi, mr };
