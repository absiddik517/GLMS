import React, { useState } from 'react';
import { Plus, Tag, HelpCircle, Layers, Inbox } from 'lucide-react';
import { SubjectClassification } from '../types';
import { countToBangla } from '../utils/banglaHelpers';

interface ClassificationsViewProps {
  classifications: SubjectClassification[];
  onSaveClassification: (classData: Omit<SubjectClassification, 'id'>) => Promise<void>;
  officeId: string;
}

export default function ClassificationsView({
  classifications = [],
  onSaveClassification,
  officeId
}: ClassificationsViewProps) {
  
  // Form states
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!code.trim() || !title.trim()) {
      setErrorMsg('অনুগ্রহ করে শ্রেণি কোড এবং নাম উল্লেখ করুন।');
      return;
    }

    setSubmitting(true);
    try {
      await onSaveClassification({
        office_id: officeId,
        code: code.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        active: true
      });

      // Clear layout
      setCode('');
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error(err);
      setErrorMsg('শ্রেণি বিন্যাস সংরক্ষণ করতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* ADD NEW CLASSIFICATION FORM */}
      <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-xs lg:col-span-1 h-fit">
        <h2 className="text-md font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
          <Layers size={18} className="text-[#006A4E]" />
          শ্রেণি বিন্যাস সংযুক্তি
        </h2>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-150 text-red-700 rounded-lg text-xs font-semibold mb-4">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Code */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">শ্রেণি কোড (Subject Code) *</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="যেমন: ১৫"
              className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
              required
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">শ্রেণি নাম (Subject Name) *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: সভা, অর্থ, সাধারণ"
              className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">বিবরণ / ব্যাখ্যা</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="শ্রেণির অন্তর্ভুক্ত চিঠিপত্রের ব্যাখ্যা (ঐচ্ছিক)"
              className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-[#006A4E] hover:bg-opacity-90 disabled:opacity-55 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Plus size={14} />
            {submitting ? 'সংরক্ষণ হচ্ছে...' : 'শ্রেণি বিন্যাস যোগ করুন'}
          </button>
        </form>
      </div>

      {/* CLASSIFICATION LIST */}
      <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-xs lg:col-span-2 space-y-4">
        <div>
          <h2 className="text-md font-bold text-gray-800">বিষয় ভিত্তিক শ্রেণি বিন্যাস (Subject Classifications)</h2>
          <p className="text-xs text-gray-400 mt-1">মন্ত্রণালয় নিয়ম অনুসরণী বিষয় কোড কাঠামো তালিকা</p>
        </div>

        {classifications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classifications.map((cl) => (
              <div key={cl.id} className="p-4 bg-gray-50 border border-gray-100 rounded-lg hover:border-emerald-300 hover:bg-emerald-50/10 transition group">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-extrabold text-[#006A4E] bg-emerald-50 text-xs px-2.5 py-0.5 rounded border border-emerald-100">
                    কোড: {countToBangla(cl.code)}
                  </span>
                  <span className="text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">
                    সক্রিয়
                  </span>
                </div>
                <h3 className="font-bold text-gray-800 text-sm group-hover:text-[#006A4E] transition">{cl.title}</h3>
                {cl.description && (
                  <p className="text-xs text-gray-500 mt-1 lines-clamp-2 leading-relaxed">{cl.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-gray-400">
            <Inbox size={48} className="mx-auto mb-3 opacity-60" />
            <p className="text-xs font-normal">কোনো শ্রেণি বিন্যাস নিবন্ধিত পাওয়া যায়নি।</p>
          </div>
        )}
      </div>

    </div>
  );
}
