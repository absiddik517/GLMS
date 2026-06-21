import React, { useState } from 'react';
import { Plus, User, Mail, Phone, MapPin, Building, Inbox } from 'lucide-react';
import { Recipient } from '../types';
import { countToBangla } from '../utils/banglaHelpers';

interface RecipientsViewProps {
  recipients: Recipient[];
  onSaveRecipient: (recData: Omit<Recipient, 'id'>) => Promise<void>;
  officeId: string;
}

export default function RecipientsView({
  recipients = [],
  onSaveRecipient,
  officeId
}: RecipientsViewProps) {
  
  // Form states
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [organization, setOrganization] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  
  // Display switches
  const [showName, setShowName] = useState(true);
  const [showDesignation, setShowDesignation] = useState(true);
  const [showOrganization, setShowOrganization] = useState(true);
  const [showAddress, setShowAddress] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!address.trim()) {
      setErrorMsg('অনুগ্রহ করে প্রাপকের যোগাযোগের ঠিকানা বা সদর দপ্তর এলাকাটি বাংলায় লিখুন।');
      return;
    }

    if (!name.trim() && !designation.trim() && !organization.trim()) {
      setErrorMsg('অনুগ্রহ করে প্রাপকের নাম, পদবি অথবা প্রতিষ্ঠান যেকোনো একটি প্রদান করুন।');
      return;
    }

    setSubmitting(true);
    try {
      await onSaveRecipient({
        office_id: officeId,
        recipient_name: name.trim() || undefined,
        designation: designation.trim() || undefined,
        organization: organization.trim() || undefined,
        address: address.trim(),
        email: email.trim() || undefined,
        mobile: mobile.trim() || undefined,
        show_name: showName,
        show_designation: showDesignation,
        show_organization: showOrganization,
        show_address: showAddress
      });

      // Reset
      setName('');
      setDesignation('');
      setOrganization('');
      setAddress('');
      setEmail('');
      setMobile('');
      setShowName(true);
      setShowDesignation(true);
      setShowOrganization(true);
      setShowAddress(true);
    } catch (err) {
      console.error(err);
      setErrorMsg('প্রাপক ডাটাবেজে যুক্ত করতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* NEW RECIPIENT CARD */}
      <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-xs lg:col-span-1 h-fit">
        <h2 className="text-md font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
          <User size={18} className="text-[#006A4E]" />
          নতুন দাপ্তরিক প্রাপক সংযুক্তি
        </h2>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-150 text-red-700 rounded-lg text-xs font-semibold mb-4 text-center leading-relaxed">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-gray-700">প্রাপকের নাম</label>
              <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">ঐচ্ছিক (Optional)</span>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: জনাব আব্দুর রহমান"
              className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Designation */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">পদবি (ঐচ্ছিক)</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="যেমন: উপজেলা নির্বাহী অফিসার"
                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
              />
            </div>

            {/* Organization */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">প্রতিষ্ঠান (ঐচ্ছিক)</label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="যেমন: উপজেলা পরিষদ"
                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-2 gap-3">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">ইমেইল (ঐচ্ছিক)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@domain.com"
                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">মোবাইল (ঐচ্ছিক)</label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="যেমন: 017..."
                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">ঠিকানা/যোগাযোগ ক্ষেত্র *</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="মহকুমা, জেলা, বিভাগ ও ডাকঘর সহ বিস্তারিত বাংলায় লিখুন..."
              className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
              rows={3}
              required
            />
          </div>

          {/* DISPLAY CONTROLS IN THE PAD */}
          <div className="p-3 bg-emerald-50/50 border border-emerald-150/70 rounded-lg space-y-2">
            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              চিঠির প্যাডে কোন কোন ক্ষেত্র দৃশ্যমান হবে:
            </p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
              <label className="flex items-center gap-1.5 font-medium text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showName}
                  onChange={(e) => setShowName(e.target.checked)}
                  className="rounded border-gray-350 text-[#006A4E] focus:ring-[#006A4E] h-3.5 w-3.5"
                />
                নাম দেখান
              </label>

              <label className="flex items-center gap-1.5 font-medium text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showDesignation}
                  onChange={(e) => setShowDesignation(e.target.checked)}
                  className="rounded border-gray-350 text-[#006A4E] focus:ring-[#006A4E] h-3.5 w-3.5"
                />
                পদবি দেখান
              </label>

              <label className="flex items-center gap-1.5 font-medium text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showOrganization}
                  onChange={(e) => setShowOrganization(e.target.checked)}
                  className="rounded border-gray-350 text-[#006A4E] focus:ring-[#006A4E] h-3.5 w-3.5"
                />
                প্রতিষ্ঠান দেখান
              </label>

              <label className="flex items-center gap-1.5 font-medium text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showAddress}
                  onChange={(e) => setShowAddress(e.target.checked)}
                  className="rounded border-gray-350 text-[#006A4E] focus:ring-[#006A4E] h-3.5 w-3.5"
                />
                ঠিকানা দেখান
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-[#006A4E] hover:bg-opacity-90 disabled:opacity-55 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Plus size={14} />
            {submitting ? 'যুক্ত করা হচ্ছে...' : 'নতুন প্রাপক রেজিস্টার করুন'}
          </button>
        </form>
      </div>

      {/* RECIPIENTS LIST */}
      <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-xs lg:col-span-2 space-y-4">
        <div>
          <h2 className="text-md font-bold text-gray-800">নিবন্ধিত প্রাপক নির্দেশিকা (Recipient Directory)</h2>
          <p className="text-xs text-gray-400 mt-1">চিঠিপত্র ও নোটিশ পাঠানোর জন্য তালিকাভুক্ত সরকারি দপ্তর ও গ্রহীতাগণ</p>
        </div>

        {recipients.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {recipients.map((rec) => (
              <div key={rec.id} className="py-4 hover:bg-gray-50/50 px-2 rounded-lg transition flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                    <User size={14} className="text-[#006A4E]" />
                    {rec.recipient_name || <span className="text-gray-400 font-medium italic">[নাম বিহীন / পদবি ভিত্তিক প্রাপক]</span>}
                  </h3>
                  
                  {/* Designation / Organization */}
                  {(rec.designation || rec.organization) && (
                    <p className="text-xs text-gray-600 font-semibold flex items-center gap-1">
                      <Building size={12} className="text-gray-400" />
                      {[rec.designation, rec.organization].filter(Boolean).join(', ')}
                    </p>
                  )}

                  {/* Address */}
                  <p className="text-xs text-gray-500 flex items-center gap-1 pr-4">
                    <MapPin size={12} className="text-gray-400" />
                    {rec.address}
                  </p>

                  {/* Settings Indicator Badges */}
                  <div className="flex flex-wrap items-center gap-1 pt-1.5">
                    <span className="text-[10px] text-gray-400">ব্যক্তিগত প্রদর্শন সেটিংস:</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition ${rec.show_name !== false && rec.recipient_name ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-gray-50 text-gray-400 border border-gray-150'}`}>
                      নাম {rec.show_name === false ? '✖' : '✔'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition ${rec.show_designation !== false && rec.designation ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-gray-50 text-gray-400 border border-gray-150'}`}>
                      পদবি {rec.show_designation === false ? '✖' : '✔'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition ${rec.show_organization !== false && rec.organization ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-gray-50 text-gray-400 border border-gray-150'}`}>
                      প্রতিষ্ঠান {rec.show_organization === false ? '✖' : '✔'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition ${rec.show_address !== false && rec.address ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-gray-50 text-gray-400 border border-gray-150'}`}>
                      ঠিকানা {rec.show_address === false ? '✖' : '✔'}
                    </span>
                  </div>
                </div>

                {/* Contacts Block */}
                <div className="flex sm:flex-col justify-start md:items-end gap-2 text-xs text-gray-500 self-start md:self-center font-mono pl-0 md:pl-4 border-t md:border-t-0 md:border-l border-gray-150 pt-2 md:pt-0">
                  {rec.mobile && (
                    <span className="flex items-center gap-1">
                      <Phone size={11} className="text-gray-400 font-sans" />
                      {countToBangla(rec.mobile)}
                    </span>
                  )}
                  {rec.email && (
                    <span className="flex items-center gap-1 text-[10px]">
                      <Mail size={11} className="text-gray-400" />
                      {rec.email}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-gray-400">
            <Inbox size={48} className="mx-auto mb-3 opacity-60" />
            <p className="text-xs">কোনো প্রাপক রেজিস্টার পাওয়া যায়নি। নতুন সরকারি কর্মকর্তা বা গ্রহীতা যুক্ত করতে পাশের ফর্মটি পূরণ করুন।</p>
          </div>
        )}
      </div>

    </div>
  );
}
