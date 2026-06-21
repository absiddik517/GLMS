import React, { useState } from 'react';
import { User, Save, CheckCircle2, FileText, Stamp } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileSettingsViewProps {
  profile: UserProfile | null;
  onUpdateProfile: (profileData: Partial<UserProfile>) => Promise<void>;
}

export default function ProfileSettingsView({
  profile,
  onUpdateProfile
}: ProfileSettingsViewProps) {
  
  // Form states
  const [name, setName] = useState(profile?.name || '');
  const [designation, setDesignation] = useState(profile?.designation || '');
  const [email] = useState(profile?.email || '');
  const [mobile, setMobile] = useState(profile?.mobile || '');
  const [sigImage, setSigImage] = useState(profile?.signature_image || '');
  const [sealImage, setSealImage] = useState(profile?.seal_image || '');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Signature file changes handler -> Converts to compact Base64
  const handleSignatureFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('ছবির সাইজ অবশ্যই ২ মেগাবাইটের কম হতে হবে।');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSigImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Seal file changes handler -> Converts to compact Base64
  const handleSealFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('ছবির সাইজ অবশ্যই ২ মেগাবাইটের কম হতে হবে।');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSealImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!name.trim() || !designation.trim()) {
      setErrorMsg('অনুগ্রহ করে নাম এবং দাপ্তরিক পদবি প্রদান করুন।');
      return;
    }

    setSubmitting(true);
    try {
      await onUpdateProfile({
        name: name.trim(),
        designation: designation.trim(),
        mobile: mobile.trim() || undefined,
        signature_image: sigImage || undefined,
        seal_image: sealImage || undefined
      });
      setSuccessMsg('প্রোফাইল এবং দাপ্তরিক স্বাক্ষর/সীল মোহর ডাটা সম্পন্ন হয়েছে।');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg('প্রোফাইল সেটিংস হালনাগাদ করা সম্ভব হয়নি।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg border border-gray-100 shadow-xs overflow-hidden">
      
      {/* HEADER BAR */}
      <div className="bg-gray-50 border-b border-gray-200 p-5 flex items-center gap-3">
        <div className="p-2.5 bg-emerald-50 text-[#006A4E] rounded-lg">
          <User size={20} />
        </div>
        <div>
          <h2 className="text-md font-bold text-gray-800">ব্যক্তিগত প্রোফাইল ও স্বাক্ষর ফাইল</h2>
          <p className="text-xs text-gray-400 mt-1">চিঠিপত্রের শেষে স্বাক্ষরকারী কর্মকর্তা হিসেবে সংযুক্ত তথ্যাদি</p>
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email (Readonly) */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">ইমেইল ঠিকানা (পরিবর্তন অযোগ্য)</label>
            <input
              type="text"
              value={email}
              disabled
              className="w-full p-2 border border-gray-200 bg-gray-100 text-gray-500 rounded-lg text-xs select-all focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Officers Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">কর্মকর্তার নাম (বাংলায়) *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: জনাব আবু সিদ্দীক"
                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                required
              />
            </div>

            {/* Officers Designation */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">দাপ্তরিক পদবি (বাংলায়) *</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="যেমন: উপজেলা উপানুষ্ঠানিক শিক্ষা কর্মকর্তা"
                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">ব্যক্তিগত মোবাইল নম্বর</label>
            <input
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="01712..."
              className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none font-mono"
            />
          </div>

          {/* DUAL COLS: SIGNATURES AND STAMP/SEALS FILE UPLODAERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-150">
            {/* Signature Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 flex items-center gap-1">
                <FileText size={14} className="text-amber-500" />
                অফিসিয়াল স্বাক্ষর আপলোড (Signature Image)
              </label>
              
              <div className="p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center text-center">
                {sigImage ? (
                  <div className="relative">
                    <img 
                      src={sigImage} 
                      alt="Signature Preview" 
                      className="max-h-20 max-w-[200px] object-contain mb-2 bg-white border p-1 rounded" 
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setSigImage('')}
                      className="text-[10px] text-red-500 hover:underline font-bold block mx-auto cursor-pointer"
                    >
                      স্বাক্ষরটি মুছুন
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 mb-2">স্বাক্ষর ছবি আপলোড করুন (.png/.jpg, max 2MB এবং স্বচ্ছ ব্যাকগ্রাউন্ড শ্রেষ্ঠ)</p>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureFile}
                  className="block w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 transition cursor-pointer"
                />
              </div>
            </div>

            {/* Seal Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 flex items-center gap-1">
                <Stamp size={14} className="text-[#006A4E]" />
                গোল সীলমোহর আপলোড (Seal/Stamp Image)
              </label>
              
              <div className="p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center text-center">
                {sealImage ? (
                  <div className="relative">
                    <img 
                      src={sealImage} 
                      alt="Seal Preview" 
                      className="max-h-20 max-w-[200px] object-contain mb-2 bg-white border p-1 rounded" 
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setSealImage('')}
                      className="text-[10px] text-red-500 hover:underline font-bold block mx-auto cursor-pointer"
                    >
                      সীলমোহরটি মুছুন
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 mb-2">সীল ছবি আপলোড করুন (.png/.jpg, max 2MB এবং স্বচ্ছ ব্যাকগ্রাউন্ড শ্রেষ্ঠ)</p>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSealFile}
                  className="block w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 transition cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-150 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-[#006A4E] hover:bg-opacity-90 disabled:opacity-55 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <Save size={14} />
              {submitting ? 'প্রক্রিয়াকরণ হচ্ছে...' : 'প্রোফাইল আপডেট করুন'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
