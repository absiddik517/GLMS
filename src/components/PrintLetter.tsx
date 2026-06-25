import React from 'react';
import { Letter, UserProfile, Office, Recipient, Officer } from '../types';
import { countToBangla, getGovtFormattedDate, getBengaliCalendarDate, formatBanglaDate } from '../utils/banglaHelpers';

interface PrintLetterProps {
  letter: Letter;
  profile: UserProfile;
  office: Office;
  recipient?: Recipient;
  officers?: Officer[];
}

export default function PrintLetter({ letter, profile, office, recipient, officers = [] }: PrintLetterProps) {
  // Translate letter types to Bangla label for centers
  const getLetterHeaderTitle = () => {
    switch (letter.letter_type) {
      case 'office_order':
        return 'অফিস আদেশ';
      case 'notice':
        return 'বিজ্ঞপ্তি';
      case 'circular':
        return 'পরিপত্র';
      case 'invitation':
        return 'আমন্ত্রণপত্র';
      case 'meeting':
        return 'সভার নোটিশ';
      case 'training':
        return 'প্রশিক্ষণ নোটিশ';
      default:
        return '';
    }
  };

  const isStandard = letter.letter_type === 'standard';
  const headerTitle = getLetterHeaderTitle();

  const selectedOfficer = letter.signatory_officer_id 
    ? officers.find(o => o.id === letter.signatory_officer_id)
    : null;

  return (
    <div 
      className="bg-white p-12 shadow-sm border border-gray-200 mx-auto max-w-[800px] w-full min-h-[1100px] text-gray-900 font-sans print:shadow-none print:border-none print:p-0 print:m-0"
      id="govt-letter-print-area"
      style={{ 
        fontFamily: '"Noto Sans Bengali", "Inter", sans-serif',
        lineHeight: '1.2'
      }}
    >
      {/* 1. GOVERNMENT SEAL AND OFFICIAL HEADERS */}
      <div className="relative text-center w-full min-h-[70px] pb-4">
        {/* Left Logo */}
        <div className="absolute left-0 top-0 select-none">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/8/84/Government_Seal_of_Bangladesh.svg" 
            alt="গণপ্রজাতন্ত্রী বাংলাদেশ সরকার সিল" 
            className="h-16 w-16 object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Right Logo */}
        <div className="absolute right-0 top-0 select-none">
          <img 
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1jipO8vnuNDm1qwUZPkLvjXbnHY8ESNuqBFyaE-UBVI4ESwy0Af6U2uw&s=10" 
            alt="মুজিব ১০০ লোগো" 
            className="h-14 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Centered official header details without any logos or seals, matching the photo */}
        <div className="w-full text-black px-20">
          <h1 className="text-lg font-bold leading-tight tracking-wide text-black">
            গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
          </h1>
          <h2 className="text-base font-bold mt-1 text-black leading-tight">
            {office?.office_name || 'উপজেলা উপানুষ্ঠানিক শিক্ষা কর্মকর্তার কার্যালয়'}
          </h2>
          <p className="text-sm text-black font-semibold leading-tight mt-0.5">
            {office?.org_name_line3 !== undefined && office?.org_name_line3 !== ''
              ? office.org_name_line3
              : (office?.office_name?.includes('ব্যুরো') ? '' : 'উপজেলা উপানুষ্ঠানিক শিক্ষা ব্যুরো')}
          </p>
          <p className="text-xs text-black font-semibold leading-tight mt-0.5">
            {office?.org_address_line4 || office?.address || 'হালুয়াঘাট, ময়মনসিংহ'}
          </p>
          {office?.email && (
            <p className="text-xs text-black font-mono tracking-wide mt-0.5">
              ইমেইল: {office.email}
            </p>
          )}
        </div>
      </div>

      {/* 2. MEMO NUMBER AND DATE SECTION */}
      <div className="flex justify-between items-center text-xs select-none leading-relaxed text-black gap-4 mb-4">
        <div className="flex-1 font-semibold text-black">
          স্মারক নং <span className="font-sans text-xs text-black">{countToBangla(letter.memo_no)}</span>
        </div>
        <div className="flex items-center text-black shrink-0">
          <span className="mr-2 font-semibold text-black">তারিখ:</span>
          <div className="inline-flex flex-col items-center text-center">
            <div className="px-2 text-xs text-black font-semibold pb-1">{getBengaliCalendarDate(letter.issue_date)} বঙ্গাব্দ</div>
            <div className="w-full border-t border-black"></div>
            <div className="px-2 text-xs text-black font-semibold pt-1">{formatBanglaDate(letter.issue_date)} খ্রিষ্টাব্দ</div>
          </div>
        </div>
      </div>

      {/* 3. TYPE HEADINGS (Center title for specific letter types like notice, circular, office order) */}
      {headerTitle && (
        <div className="text-center font-bold text-lg pb-1 text-black">
          {headerTitle}
        </div>
      )}

      {/* 5. SUBJECT AND REFERENCE (Hide if Office Order) */}
      {letter.letter_type !== 'office_order' && letter.subject && (
        <div className="mb-2 text-sm leading-relaxed text-black" id="subject-print-block">
          <p className="font-bold text-black">
            বিষয়: <span className="underline font-semibold text-black">{letter.subject}</span>
          </p>
          {letter.notes && letter.notes.trim() && letter.letter_type === 'standard' && (
            <p className="text-xs text-black mt-1">
              সূত্র: {letter.notes}
            </p>
          )}
        </div>
      )}

      {/* 6. MAIN BODY (TipTap/HTML render) */}
      <div 
        className="text-sm leading-relaxed text-black mb-6 prose prose-slate max-w-none prose-sm"
        dangerouslySetInnerHTML={{ __html: letter.body }}
        style={{ textAlign: 'justify', color: '#000000' }}
      ></div>

      {/* 7. GRID LAYOUT: RECIPIENT (LEFT) AND SIGNATORY/SENDER (RIGHT) */}
      {/* Keeping a 20pt/27px space on top of the grid for signing */}
      <div className="grid grid-cols-2 gap-8 text-sm select-none mt-[20pt] pb-6 items-start text-black w-full">
        {/* Recipient on the Left Column */}
        <div className="text-left">
          {isStandard && letter.recipient_id && (
            <div id="rec-print-block" className="text-left text-black leading-relaxed">
              <p className="font-semibold mb-1 text-black">প্রাপক,</p>
              <div className="pl-4 text-black text-xs">
                {recipient ? (
                  <>
                    {(letter.recipient_display_options?.show_name !== false) && (
                      <p className="font-bold text-black">{recipient.recipient_name}</p>
                    )}
                    {(letter.recipient_display_options?.show_designation !== false) && recipient.designation && (
                      <p className="font-semibold text-black">{recipient.designation}</p>
                    )}
                    {(letter.recipient_display_options?.show_organization !== false) && recipient.organization && (
                      <p className="text-black">{recipient.organization}</p>
                    )}
                    {(letter.recipient_display_options?.show_address !== false) && recipient.address && (
                      <p className="text-black">{recipient.address}</p>
                    )}
                  </>
                ) : (
                  <p className="font-bold text-gray-400 italic">প্রাপকের বিস্তারিত তথ্য পাওয়া যায়নি</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Signatory on the Right Column */}
        <div className="text-right text-sm leading-snug text-black">
          {selectedOfficer ? (
            <>
              <p className="font-bold text-black">{selectedOfficer.name}</p>
              <p className="text-xs text-black font-semibold">{selectedOfficer.designation}</p>
              <p className="text-xs text-black">{office?.office_name || 'দপ্তর'}</p>
              
              {selectedOfficer.phone ? (
                <p className="text-xs text-black">মোবাইল: {countToBangla(selectedOfficer.phone)}</p>
              ) : office?.phone ? (
                <p className="text-xs text-black">ফোন: {countToBangla(office.phone)}</p>
              ) : null}
            </>
          ) : (
            <>
              <p className="font-bold text-black">{profile?.name || 'কর্মকর্তার নাম'}</p>
              <p className="text-xs text-black font-semibold">{profile?.designation || 'পদবি'}</p>
              <p className="text-xs text-black">{office?.office_name || 'দপ্তর'}</p>
              
              {office?.phone && <p className="text-xs text-black">ফোন: {countToBangla(office.phone)}</p>}
            </>
          )}
        </div>
      </div>

      {/* 7.5 ATTACHMENTS SECTION (If any exist) */}
      {letter.attachments && letter.attachments.length > 0 && (
        <div className="mb-4 text-xs text-black leading-relaxed select-none" id="attachments-print-block">
          <p className="font-bold underline mb-1 text-black">সংযুক্তি:</p>
          <div className="space-y-0.5 text-black pl-2">
            {letter.attachments.map((attach, idx) => (
              <div key={idx} className="flex items-start text-black">
                <span className="w-4 shrink-0 text-left font-semibold">{countToBangla(idx + 1)}.</span>
                <span className="flex-1">{attach}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. COPY RECIPIENTS SECTION (If any exist) */}
      {letter.copy_recipients && letter.copy_recipients.length > 0 && (
        <div className="text-xs text-black leading-relaxed select-none" id="copy-rec-print-block">
          <p className="font-bold underline mb-1 text-black">অনুলিপি জ্ঞাতার্থে ও কার্যার্থে প্রেরিত হলো:</p>
          <div className="space-y-0.5 text-black pl-2">
            {letter.copy_recipients.map((cr, idx) => (
              <div key={cr.id || idx} className="flex items-start text-black">
                <span className="w-4 shrink-0 text-left font-semibold">{countToBangla(idx + 1)}.</span>
                <span className="flex-1">
                  {[cr.recipient_name, cr.designation, cr.organization, cr.address]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            ))}
            <div className="flex items-start text-black">
              <span className="w-4 shrink-0 text-left font-semibold">{countToBangla(letter.copy_recipients.length + 1)}.</span>
              <span className="flex-1">জরুরি অফিস ফাইল।</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
