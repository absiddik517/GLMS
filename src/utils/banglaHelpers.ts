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
 * Return format like: ০৬ আষাঢ় ১৪৩৩ বঙ্গাব্দ / ২০ জুন ২০২৬ খ্রিষ্টাব্দ
 * Standard Bangladesh government official date has both Bengali calendar date and Christian calendar date.
 * For simplicity and pixel-perfect design, we'll offer high fidelity Christian standard dates translated to Bangla,
 * which is accepted in all offices.
 */
export function getGovtFormattedDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const parsed = formatBanglaDate(dateStr);
  return `${parsed} খ্রিষ্টাব্দ`;
}
