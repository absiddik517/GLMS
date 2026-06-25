import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Office } from '../types';

interface OfficeSettingsViewProps {
  office: Office | null;
  onUpdateOffice: (officeData: Partial<Office>) => Promise<void>;
}

export default function OfficeSettingsView({
  office,
  onUpdateOffice
}: OfficeSettingsViewProps) {
  
  // Form states
  const [officeName, setOfficeName] = useState(office?.office_name || '');
  const [officeCode, setOfficeCode] = useState(office?.office_code || '');
  const [geoCode, setGeoCode] = useState(office?.geo_code || '');
  const [address, setAddress] = useState(office?.address || '');
  const [email, setEmail] = useState(office?.email || '');
  const [phone, setPhone] = useState(office?.phone || '');
  const [website, setWebsite] = useState(office?.website || '');
  const [ministryCode, setMinistryCode] = useState(office?.ministry_code || '০৮');
  const [orgNameLine3, setOrgNameLine3] = useState(office?.org_name_line3 || '');
  const [orgAddressLine4, setOrgAddressLine4] = useState(office?.org_address_line4 || '');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state when office prop loads or updates
  useEffect(() => {
    if (office) {
      setOfficeName(office.office_name || '');
      setOfficeCode(office.office_code || '');
      setGeoCode(office.geo_code || '');
      setAddress(office.address || '');
      setEmail(office.email || '');
      setPhone(office.phone || '');
      setWebsite(office.website || '');
      setMinistryCode(office.ministry_code || '০৮');
      setOrgNameLine3(office.org_name_line3 || '');
      setOrgAddressLine4(office.org_address_line4 || '');
    }
  }, [office]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    
    if (!officeName.trim() || !geoCode.trim() || !address.trim() || !email.trim() || !ministryCode.trim()) {
      setErrorMsg('অনুগ্রহ করে তারকা চিহ্নিত (*) ক্ষেত্রগুলো পূরণ করুন।');
      return;
    }

    setSubmitting(true);
    try {
      await onUpdateOffice({
        office_name: officeName.trim(),
        office_code: officeCode.trim(),
        geo_code: geoCode.trim(),
        address: address.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        ministry_code: ministryCode.trim(),
        org_name_line3: orgNameLine3.trim() || undefined,
        org_address_line4: orgAddressLine4.trim() || undefined
      });
      setSuccessMsg('কার্যালয়ের সাধারণ সেটিংস ও প্যাড বিবরণী সফলভাবে হালনাগাদ করা হয়েছে।');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg('সেটিংস ডাটাবেজে সংরক্ষণ করতে ত্রুটি হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg border border-gray-100 shadow-xs overflow-hidden">
      
      {/* HEADER SECTION */}
      <div className="bg-gray-50 border-b border-gray-200 p-5 flex items-center gap-3">
        <div className="p-2.5 bg-emerald-50 text-[#006A4E] rounded-lg">
          <Settings size={20} />
        </div>
        <div>
          <h2 className="text-md font-bold text-gray-800">দাপ্তরিক কার্যালয় পরিচিত ও প্যাড সেটিংস</h2>
          <p className="text-xs text-gray-400 mt-1">অফিসিয়াল লেটারহেড ও স্মারক বিন্যাসে ব্যবহৃত তথ্যাদি</p>
        </div>
      </div>

      <div className="p-6">
        {successMsg && (
          <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-lg text-xs font-semibold flex items-center gap-2 mb-6">
            <CheckCircle2 size={16} />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-150 rounded-lg text-xs font-semibold mb-6">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Office Name (Papad title) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">কার্যালয়ের পূর্ণ নাম (প্যাড শিরোনাম - ২য় লাইন) *</label>
            <input
              type="text"
              value={officeName}
              onChange={(e) => setOfficeName(e.target.value)}
              placeholder="যেমন: উপজেলা উপানুষ্ঠানিক শিক্ষা কর্মকর্তার কার্যালয়"
              className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none"
              required
            />
            <p className="text-[10px] text-gray-400 mt-1">চিঠির একদম উপরে ২য় লাইনে এই নামটি দৃশ্যমান হবে।</p>
          </div>

          {/* Org Name Line 3 */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">প্রতিষ্ঠানের নাম (পেডে লাইন ৩) (ঐচ্ছিক)</label>
            <input
              type="text"
              value={orgNameLine3}
              onChange={(e) => setOrgNameLine3(e.target.value)}
              placeholder="যেমন: উপানুষ্ঠানিক শিক্ষা ব্যুরো"
              className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none"
            />
            <p className="text-[10px] text-gray-400 mt-1">চিঠির একদম উপরে ৩য় লাইনে এই নামটি দৃশ্যমান হবে (ফাঁকা রাখলে স্বয়ংক্রিয়ভাবে ব্যুরো আসবে)।</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Ministry Code */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">মন্ত্রণালয় কোড (স্মারক ১ম ব্লক) *</label>
              <input
                type="text"
                value={ministryCode}
                onChange={(e) => setMinistryCode(e.target.value)}
                placeholder="যেমন: ০৮"
                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                required
              />
              <p className="text-[10px] text-gray-400 mt-1">স্মারক নম্বরের ১ম ব্লক (যেমন ০৮) যা তথ্য বা মন্ত্রণালয় নির্দেশ করে।</p>
            </div>

            {/* Office Code */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">দপ্তর কোড (স্মারক ২য় ব্লক) *</label>
              <input
                type="text"
                value={officeCode}
                onChange={(e) => setOfficeCode(e.target.value)}
                placeholder="যেমন: ০৩"
                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                required
              />
              <p className="text-[10px] text-gray-400 mt-1">স্মারক নম্বরের ২য় ব্লক (যেমন ০৩) যা অধিদপ্তর বা অফিস বোঝায়।</p>
            </div>

            {/* Geo Code */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">ভৌগোলিক জিও কোড (Geo Code) *</label>
              <input
                type="text"
                value={geoCode}
                onChange={(e) => setGeoCode(e.target.value)}
                placeholder="যেমন: ৬১২৪"
                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                required
              />
              <p className="text-[10px] text-gray-400 mt-1">স্মারক নম্বরের ৩য় ব্লক (যেমন ৬১২৪) যা উপজেলা জিও কোড।</p>
            </div>
          </div>

          {/* Org Address Line 4 (Present Office Address) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">প্রতিষ্ঠানের ঠিকানা (পেডে লাইন ৪) (বর্তমান কার্যালয় ঠিকানা)</label>
            <input
              type="text"
              value={orgAddressLine4}
              onChange={(e) => setOrgAddressLine4(e.target.value)}
              placeholder="যেমন: হালুয়াঘাট, ময়মনসিংহ"
              className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none"
            />
            <p className="text-[10px] text-gray-400 mt-1">চিঠির প্যাডের উপরের ৪র্থ লাইনে (ঠিকানা) এটি প্রদর্শন করা হবে। ফাঁকা থাকলে সাধারণ ঠিকানা ব্যবহার হবে।</p>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">কার্যালয়ের ঠিকানা *</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="যেমন: হালুয়াঘাট, ময়মনসিংহ"
              className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none"
              required
            />
            <p className="text-[10px] text-gray-400 mt-1">চিঠির প্যাডে ৪র্থ লাইনের সাধারণ ব্যাকআপ এবং যোগাযোগের বিবরণী হিসেবে ব্যবহৃত হবে।</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">দাপ্তরিক ইমেইল *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="office@gmail.com"
                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">যোগাযোগ ফোন বা ফ্যাক্স</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01712..."
                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">কার্যালয়ের ওয়েবসাইট (ঐচ্ছিক)</label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="www.xyz.gov.bd"
              className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none font-mono"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-[#006A4E] hover:bg-opacity-90 disabled:opacity-55 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <Save size={14} />
              {submitting ? 'সংরক্ষণ ও আপডেট হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
