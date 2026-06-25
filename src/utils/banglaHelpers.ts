/**
 * Bangla language helper functions for string formatting, digit conversion, and dates.
 */

const englishToBanglaMap: { [key: string]: string } = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

const banglaToEnglishMap: { [key: string]: string } = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

/**
 * Converts English digits to Bangla digits
 */
export function countToBangla(num: number | string | undefined): string {
  if (num === undefined || num === null) return '';
  const str = num.toString();
  return str.split('').map(char => englishToBanglaMap[char] || char).join('');
}

/**
 * Converts Bangla digits to English digits
 */
export function countToEnglish(str: string | undefined): string {
  if (str === undefined || str === null) return '';
  return str.split('').map(char => banglaToEnglishMap[char] || char).join('');
}

/**
 * Helper to left-pad strings with custom characters (e.g. padding "7" to "0007")
 */
export function padLeft(str: string | number, length: number, char: string = '0'): string {
  let s = str.toString();
  while (s.length < length) {
    s = char + s;
  }
  return s;
}

const banglaMonths = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

/**
 * Returns a nicely formatted Bangla date from an English date string (YYYY-MM-DD or parseable format)
 * Returns format like: ২০ জুন ২০২৬
 */
export function formatBanglaDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const monthIndex = d.getMonth();
    const year = d.getFullYear();
    
    const banglaDay = countToBangla(day);
    const banglaMonth = banglaMonths[monthIndex];
    const banglaYear = countToBangla(year);
    
    return `${banglaDay} ${banglaMonth} ${banglaYear}`;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Converts a Gregorian Date string to the Bengali Calendar date (Bangladesh Academy Revised 2019)
 */
export function getBengaliCalendarDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1-indexed
    const day = d.getDate();
    
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    
    let bDay = 0;
    let bMonth = '';
    let bYear = year - 593; // Default for April 14 to Dec 31
    
    // Determine month, day, and year adjustments
    if (month === 4) { // April
      if (day >= 14) {
        bMonth = 'বৈশাখ';
        bDay = day - 13;
      } else {
        bMonth = 'চৈত্র';
        bDay = day + 17;
        bYear = year - 594;
      }
    } else if (month === 5) { // May
      if (day >= 15) {
        bMonth = 'জ্যৈষ্ঠ';
        bDay = day - 14;
      } else {
        bMonth = 'বৈশাখ';
        bDay = day + 17;
      }
    } else if (month === 6) { // June
      if (day >= 15) {
        bMonth = 'আষাঢ়';
        bDay = day - 14;
      } else {
        bMonth = 'জ্যৈষ্ঠ';
        bDay = day + 17;
      }
    } else if (month === 7) { // July
      if (day >= 16) {
        bMonth = 'শ্রাবণ';
        bDay = day - 15;
      } else {
        bMonth = 'আষাঢ়';
        bDay = day + 16;
      }
    } else if (month === 8) { // August
      if (day >= 16) {
        bMonth = 'ভাদ্র';
        bDay = day - 15;
      } else {
        bMonth = 'শ্রাবণ';
        bDay = day + 16;
      }
    } else if (month === 9) { // September
      if (day >= 16) {
        bMonth = 'আশ্বিন';
        bDay = day - 15;
      } else {
        bMonth = 'ভাদ্র';
        bDay = day + 16;
      }
    } else if (month === 10) { // October
      if (day >= 17) {
        bMonth = 'কার্তিক';
        bDay = day - 16;
      } else {
        bMonth = 'আশ্বিন';
        bDay = day + 15;
      }
    } else if (month === 11) { // November
      if (day >= 16) {
        bMonth = 'অগ্রহায়ণ';
        bDay = day - 15;
      } else {
        bMonth = 'কার্তিক';
        bDay = day + 15;
      }
    } else if (month === 12) { // December
      if (day >= 16) {
        bMonth = 'পৌষ';
        bDay = day - 15;
      } else {
        bMonth = 'অগ্রহায়ণ';
        bDay = day + 15;
      }
    } else if (month === 1) { // January
      bYear = year - 594;
      if (day >= 15) {
        bMonth = 'মাঘ';
        bDay = day - 14;
      } else {
        bMonth = 'পৌষ';
        bDay = day + 16;
      }
    } else if (month === 2) { // February
      bYear = year - 594;
      if (day >= 14) {
        bMonth = 'ফাল্গুন';
        bDay = day - 13;
      } else {
        bMonth = 'মাঘ';
        bDay = day + 17;
      }
    } else if (month === 3) { // March
      bYear = year - 594;
      if (day >= 15) {
        bMonth = 'চৈত্র';
        bDay = day - 14;
      } else {
        bMonth = 'ফাল্গুন';
        bDay = isLeapYear ? (day + 16) : (day + 15);
      }
    }
    
    return `${countToBangla(bDay)} ${bMonth} ${countToBangla(bYear)}`;
  } catch (e) {
    return '';
  }
}

/**
 * Return format like: ০৬ আষাঢ় ১৪৩৩ বঙ্গাব্দ / ২০ জুন ২০২৬ খ্রিষ্টাব্দ
 * Standard Bangladesh government official date has both Bengali calendar date and Christian calendar date.
 */
export function getGovtFormattedDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const banglaCalendar = getBengaliCalendarDate(dateStr);
  const christianCalendar = formatBanglaDate(dateStr);
  
  if (banglaCalendar) {
    return `${banglaCalendar} বঙ্গাব্দ / ${christianCalendar} খ্রিষ্টাব্দ`;
  }
  return `${christianCalendar} খ্রিষ্টাব্দ`;
}
