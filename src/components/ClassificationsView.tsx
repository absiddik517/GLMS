import React, { useState } from 'react';
import { Plus, Tag, HelpCircle, Layers, Inbox, Trash2, RefreshCw, Pencil } from 'lucide-react';
import { SubjectClassification } from '../types';
import { countToBangla } from '../utils/banglaHelpers';

interface ClassificationsViewProps {
  classifications: SubjectClassification[];
  onSaveClassification: (classData: Omit<SubjectClassification, 'id'> & { id?: string }) => Promise<void>;
  onDeleteClassification?: (id: string) => Promise<void>;
  onClearAndReSeedClassifications?: () => Promise<void>;
  officeId: string;
}

export default function ClassificationsView({
  classifications = [],
  onSaveClassification,
  onDeleteClassification,
  onClearAndReSeedClassifications,
  officeId
}: ClassificationsViewProps) {
  
  // Form states
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleEditClick = (cl: SubjectClassification) => {
    setErrorMsg('');
    setCode(cl.code);
    setTitle(cl.title);
    setDescription(cl.description || '');
    setKeywords(cl.keywords ? cl.keywords.join(', ') : '');
    setEditingId(cl.id);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setCode('');
    setTitle('');
    setDescription('');
    setKeywords('');
    setErrorMsg('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!code.trim() || !title.trim()) {
      setErrorMsg('অনুগ্রহ করে শ্রেণি কোড এবং নাম উল্লেখ করুন।');
      return;
    }

    setSubmitting(true);
    try {
      const keywordsArray = keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      await onSaveClassification({
        id: editingId || undefined,
        office_id: officeId,
        code: code.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        keywords: keywordsArray,
        active: true
      });

      handleCloseForm();
    } catch (err) {
      console.error(err);
      setErrorMsg('শ্রেণি বিন্যাস সংরক্ষণ করতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!onDeleteClassification) return;

    setDeletingId(id);
    setErrorMsg('');
    try {
      await onDeleteClassification(id);
    } catch (err) {
      console.error(err);
      setErrorMsg('শ্রেণি বিন্যাস মুছতে সমস্যা হয়েছে।');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-lg border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Layers size={18} className="text-[#006A4E]" />
            বিষয় শ্রেণি বিন্যাস ও ফাইল ট্র্যাকিং কোড কাঠামো
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">নতুন কোড কাঠামো তৈরি করুন এবং অনুমোদিত কোড ও কীওয়ার্ড অনুযায়ী নথি শ্রেণি বিন্যাস করুন</p>
        </div>
        <button
          onClick={() => {
            setErrorMsg('');
            setShowForm(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#006A4E] hover:bg-opacity-90 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-xs whitespace-nowrap self-start sm:self-auto"
        >
          <Plus size={14} />
          নতুন বিষয় শ্রেণি বিন্যাস যুক্ত করুন
        </button>
      </div>

      {/* CLASSIFICATION LIST - ALWAYS FULL WIDTH */}
      <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-md font-bold text-gray-800 font-sans">বিষয় ভিত্তিক শ্রেণি বিন্যাস (Subject Classifications)</h2>
            <p className="text-xs text-gray-400 mt-1">মন্ত্রণালয় নিয়ম অনুসরণী বিষয় কোড কাঠামো তালিকা</p>
          </div>
        </div>

        {classifications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {classifications.map((cl) => (
              <div key={cl.id} className="p-4 bg-gray-50 border border-gray-100 rounded-lg hover:border-emerald-300 hover:bg-emerald-50/10 transition group relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-extrabold text-[#006A4E] bg-emerald-50 text-xs px-2.5 py-0.5 rounded border border-emerald-100">
                      কোড: {countToBangla(cl.code)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">
                        সক্রিয়
                      </span>
                      <button
                        onClick={() => handleEditClick(cl)}
                        className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition p-1 rounded cursor-pointer"
                        title="সম্পাদনা করুন"
                      >
                        <Pencil size={13} />
                      </button>
                      {onDeleteClassification && (
                        <button
                          onClick={() => setDeleteConfirmId(cl.id)}
                          disabled={deletingId === cl.id}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 transition p-1 rounded cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm group-hover:text-[#006A4E] transition pr-5">{cl.title}</h3>
                  {cl.description && (
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{cl.description}</p>
                  )}
                </div>

                {cl.keywords && cl.keywords.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-gray-200/50 flex flex-wrap gap-1 items-center">
                    <span className="text-[9px] text-gray-400 font-bold mr-1 flex items-center gap-0.5">
                      <Tag size={9} /> কীওয়ার্ড:
                    </span>
                    {cl.keywords.map((kw, idx) => (
                      <span key={idx} className="text-[9px] bg-emerald-50 text-[#006A4E] px-1.5 py-0.5 rounded font-semibold border border-emerald-100">
                        {kw}
                      </span>
                    ))}
                  </div>
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

      {/* ADD / EDIT CLASSIFICATION MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#006A4E] text-white px-5 py-4 flex justify-between items-center">
              <h2 className="text-sm font-bold flex items-center gap-2" style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}>
                <Layers size={18} />
                {editingId ? 'বিষয় শ্রেণি বিন্যাস সম্পাদনা/হালনাগাদ' : 'নতুন বিষয় শ্রেণি বিন্যাস সংযুক্তি'}
              </h2>
              <button 
                type="button"
                onClick={handleCloseForm}
                className="text-white hover:text-gray-200 font-bold text-sm p-1 rounded-md transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4" style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}>
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-150 text-red-700 rounded-lg text-xs font-semibold">
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
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
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
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                    required
                  />
                </div>

                {/* Keywords */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700">কীওয়ার্ডসমূহ (Keywords)</label>
                    <span className="text-[10px] text-gray-400 font-medium">কমা দিয়ে লিখুন</span>
                  </div>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="যেমন: বাজেট, নিরীক্ষা, অডিট, ছুটি"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                  />
                  <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                    নতুন চিঠির বিষয় ও বডিতে এই শব্দগুলো উপস্থিত থাকলে স্বয়ংক্রিয়ভাবে কোডটি সুপারিশ করা হবে।
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">বিবরণ / ব্যাখ্যা</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="শ্রেণির অন্তর্ভুক্ত চিঠিপত্রের ব্যাখ্যা (ঐচ্ছিক)"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                    rows={2}
                  />
                </div>

                {/* Footer buttons inside the form so Submit triggers on enter */}
                <div className="flex gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="w-1/3 py-2 border border-gray-250 text-gray-750 text-xs font-semibold rounded-lg hover:bg-gray-50 transition cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-2/3 py-2 bg-[#006A4E] hover:bg-opacity-90 disabled:opacity-55 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Plus size={14} />
                    {submitting ? 'সংরক্ষণ হচ্ছে...' : (editingId ? 'হালনাগাদ করুন' : 'শ্রেণি বিন্যাস যোগ করুন')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL FOR DELETE */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-full">
                <Trash2 size={24} />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">শ্রেণি বিন্যাস মুছে ফেলার নিশ্চিতকরণ</h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed" style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}>
              আপনি কি নিশ্চিত যে এই শ্রেণি বিন্যাসটি মুছে ফেলতে চান? এটি আর পুনরুদ্ধার করা যাবে না।
            </p>
            <div className="flex justify-end gap-2 pt-2" style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 border border-gray-250 text-gray-750 text-xs font-semibold rounded-lg hover:bg-gray-50 transition cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                onClick={() => {
                  const id = deleteConfirmId;
                  setDeleteConfirmId(null);
                  handleDelete(id);
                }}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
