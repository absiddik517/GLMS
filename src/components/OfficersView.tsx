import React, { useState } from 'react';
import { Plus, User, Mail, Phone, ShieldAlert, Award, Inbox, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { Officer } from '../types';
import { countToBangla } from '../utils/banglaHelpers';

interface OfficersViewProps {
  officers: Officer[];
  onSaveOfficer: (officerData: Omit<Officer, 'id'> & { id?: string }) => Promise<void>;
  onDeleteOfficer: (id: string) => Promise<void>;
  officeId: string;
}

export default function OfficersView({
  officers = [],
  onSaveOfficer,
  onDeleteOfficer,
  officeId
}: OfficersViewProps) {
  
  // Form states
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !designation.trim()) {
      setErrorMsg('অনুগ্রহ করে অফিসারের নাম এবং পদবি প্রদান করুন।');
      return;
    }

    setSubmitting(true);
    try {
      await onSaveOfficer({
        id: editingId || undefined,
        office_id: officeId,
        name: name.trim(),
        designation: designation.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        active: isActive,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Reset
      setName('');
      setDesignation('');
      setPhone('');
      setEmail('');
      setIsActive(true);
      setEditingId(null);
    } catch (err) {
      console.error(err);
      setErrorMsg('অফিসারের তথ্য সংরক্ষণ করতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (officer: Officer) => {
    setEditingId(officer.id);
    setName(officer.name);
    setDesignation(officer.designation);
    setPhone(officer.phone || '');
    setEmail(officer.email || '');
    setIsActive(officer.active);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* NEW OFFICER FORM CARD */}
      <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-xs lg:col-span-1 h-fit">
        <h2 className="text-md font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
          <Award size={18} className="text-[#006A4E]" />
          {editingId ? 'অফিসারের তথ্য সংশোধন' : 'নতুন স্বাক্ষরকারী অফিসার সংযুক্তি'}
        </h2>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-150 text-red-700 rounded-lg text-xs font-semibold mb-4">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">কর্মকর্তার নাম *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: জনাব মোঃ রিয়াজুল ইসলাম"
              className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none"
              required
            />
          </div>

          {/* Designation */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">পদবি (যেমন: সহকারী পরিচালক) *</label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="যেমন: উপজেলা উপানুষ্ঠানিক শিক্ষা কর্মকর্তা (অ. দা.)"
              className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none"
              required
            />
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-2 gap-3">
            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">ফোন/মোবাইল (ঐচ্ছিক)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="যেমন: 017..."
                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">ইমেইল (ঐচ্ছিক)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@domain.com"
                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Status (স্টেটস) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">অবস্থা (স্টেটাস)</label>
            <select
              value={isActive ? 'true' : 'false'}
              onChange={(e) => setIsActive(e.target.value === 'true')}
              className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none"
            >
              <option value="true">সক্রিয় (Active)</option>
              <option value="false">নিষ্ক্রিয় (Inactive)</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 bg-[#006A4E] hover:bg-opacity-90 disabled:opacity-55 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Plus size={14} />
              {submitting ? 'সংরক্ষণ করা হচ্ছে...' : editingId ? 'হালনাগাদ করুন' : 'অফিসার যুক্ত করুন'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setName('');
                  setDesignation('');
                  setPhone('');
                  setEmail('');
                  setIsActive(true);
                }}
                className="py-2 px-3 bg-gray-150 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition"
              >
                বাতিল
              </button>
            )}
          </div>
        </form>
      </div>

      {/* OFFICERS LIST */}
      <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-xs lg:col-span-2 space-y-4">
        <div>
          <h2 className="text-md font-bold text-gray-800">নিবন্ধিত স্বাক্ষরকারী অফিসার তালিকা (Officer Signatories)</h2>
          <p className="text-xs text-gray-400 mt-1">চিঠিপত্রে স্বাক্ষর সংযোজন ও নির্বাচন করার জন্য অনুমোদিত কর্মকর্তাদের তালিকা</p>
        </div>

        {officers.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {officers.map((officer) => (
              <div key={officer.id} className="py-4 hover:bg-gray-50/50 px-2 rounded-lg transition flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                      <User size={14} className="text-teal-600" />
                      {officer.name}
                    </h3>
                    {officer.active ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle2 size={10} /> সক্রিয়
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                        <XCircle size={10} /> নিষ্ক্রিয়
                      </span>
                    )}
                  </div>
                  
                  {/* Designation */}
                  <p className="text-xs text-gray-600 font-semibold">
                    {officer.designation}
                  </p>

                  {/* Contact Block */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 font-sans pt-1">
                    {officer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={11} className="text-gray-400" />
                        {countToBangla(officer.phone)}
                      </span>
                    )}
                    {officer.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={11} className="text-gray-400" />
                        {officer.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => startEdit(officer)}
                    className="p-1.5 hover:bg-gray-100 text-[#006A4E] hover:text-opacity-90 rounded-lg transition text-xs font-semibold cursor-pointer"
                    title="সম্পাদনা করুন"
                  >
                    সম্পাদনা
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('আপনি কি এই অফিসারের তথ্য মুছে ফেলতে চান?')) {
                        onDeleteOfficer(officer.id);
                      }
                    }}
                    className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-gray-400">
            <Inbox size={48} className="mx-auto mb-3 opacity-60" />
            <p className="text-xs">কোনো অফিসারের তথ্য পাওয়া যায়নি। কর্মকর্তাদের তালিকাভুক্ত করতে পাশের ফর্মটি পূরণ করুন।</p>
          </div>
        )}
      </div>

    </div>
  );
}
