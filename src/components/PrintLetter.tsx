import React from 'react';
import { Letter, UserProfile, Office, Recipient, Officer } from '../types';
import { countToBangla, getGovtFormattedDate } from '../utils/banglaHelpers';

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
        lineHeight: '1.8'
      }}
    >
      {/* 1. GOVERNMENT SEAL AND OFFICIAL HEADERS */}
      <div className="relative mb-8 text-center pb-2 w-full">
        {/* Centered official header details without any logos or seals, matching the photo */}
        <div className="w-full text-black">
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
      <div className="flex justify-between items-start text-xs pb-3 mb-6 select-none leading-relaxed text-black">
        <div className="w-3/5 font-semibold text-black">
          স্মারক নম্বর: <span className="font-mono text-xs text-black">{countToBangla(letter.memo_no)}</span>
        </div>
        <div className="w-2/5 text-right font-semibold text-black">
          তারিখ: <span className="font-sans text-black">{getGovtFormattedDate(letter.issue_date)}</span>
        </div>
      </div>

      {/* 3. TYPE HEADINGS (Center title for specific letter types like notice, circular, office order) */}
      {headerTitle && (
        <div className="text-center font-bold text-lg pb-1 mb-6 text-black border-b border-black">
          {headerTitle}
        </div>
      )}

      {/* 5. SUBJECT AND REFERENCE (Hide if Office Order) */}
      {letter.letter_type !== 'office_order' && letter.subject && (
        <div className="mb-6 text-sm leading-relaxed text-black" id="subject-print-block">
          <p className="font-bold text-black">
            বিষয়: <span className="underline font-semibold text-black">{letter.subject}</span>
          </p>
          {letter.notes && letter.letter_type === 'standard' && (
            <p className="text-xs text-black mt-1">
              সূত্র: {letter.notes}
            </p>
          )}
        </div>
      )}

      {/* 6. MAIN BODY (TipTap/HTML render) */}
      <div 
        className="text-sm leading-relaxed text-black min-h-[250px] mb-6 prose prose-slate max-w-none prose-sm"
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
              {selectedOfficer.signature_image || profile?.signature_image ? (
                <div className="flex justify-end mb-1">
                  <img 
                    src={selectedOfficer.signature_image || profile.signature_image} 
                    alt="সাক্ষর" 
                    className="max-h-12 max-w-[150px] object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="h-12"></div>
              )}
              
              <p className="font-bold text-black">{selectedOfficer.name}</p>
              <p className="text-xs text-black font-semibold">{selectedOfficer.designation}</p>
              <p className="text-xs text-black">{office?.office_name || 'দপ্তর'}</p>
              
              {selectedOfficer.phone ? (
                <p className="text-xs text-black">মোবাইল: {countToBangla(selectedOfficer.phone)}</p>
              ) : office?.phone ? (
                <p className="text-xs text-black">ফোন: {countToBangla(office.phone)}</p>
              ) : null}
              
              {selectedOfficer.seal_image || profile?.seal_image ? (
                <div className="flex justify-end mt-2">
                  <img 
                    src={selectedOfficer.seal_image || profile.seal_image} 
                    alt="সীলা" 
                    className="max-h-14 max-w-[120px] object-contain opacity-95 border border-transparent"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : null}
            </>
          ) : (
            <>
              {profile?.signature_image ? (
                <div className="flex justify-end mb-1">
                  <img 
                    src={profile.signature_image} 
                    alt="সাক্ষর" 
                    className="max-h-12 max-w-[150px] object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="h-12"></div>
              )}
              
              <p className="font-bold text-black">{profile?.name || 'কর্মকর্তার নাম'}</p>
              <p className="text-xs text-black font-semibold">{profile?.designation || 'পদবি'}</p>
              <p className="text-xs text-black">{office?.office_name || 'দপ্তর'}</p>
              
              {office?.phone && <p className="text-xs text-black">ফোন: {countToBangla(office.phone)}</p>}
              
              {profile?.seal_image && (
                <div className="flex justify-end mt-2">
                  <img 
                    src={profile.seal_image} 
                    alt="সীলা" 
                    className="max-h-14 max-w-[120px] object-contain opacity-95 border border-transparent"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 8. COPY RECIPIENTS SECTION (If any exist) */}
      {letter.copy_recipients && letter.copy_recipients.length > 0 && (
        <div className="mt-12 pt-4 border-t border-black text-xs text-black leading-relaxed select-none" id="copy-rec-print-block">
          <p className="font-bold underline mb-1 text-black">অনুলিপি জ্ঞাতার্থে ও কার্যার্থে প্রেরিত হলো:</p>
          <ol className="list-decimal pl-5 text-black">
            {letter.copy_recipients.map((cr, idx) => (
              <li key={cr.id || idx} className="text-black">
                {[cr.recipient_name, cr.designation, cr.organization, cr.address]
                  .filter(Boolean)
                  .join(', ')}
              </li>
            ))}
            <li className="text-black">জরুরি অফিস ফাইল।</li>
          </ol>
        </div>
      )}
    </div>
  );
}
