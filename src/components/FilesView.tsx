import React, { useState } from 'react';
import { Plus, Briefcase, Tag, FolderOpen, Inbox, Calendar } from 'lucide-react';
import { NothiFile, SubjectClassification } from '../types';
import { countToBangla } from '../utils/banglaHelpers';

interface FilesViewProps {
  files: NothiFile[];
  classifications: SubjectClassification[];
  onSaveFile: (fileData: Omit<NothiFile, 'id' | 'created_at'>) => Promise<void>;
  officeId: string;
}

export default function FilesView({
  files = [],
  classifications = [],
  onSaveFile,
  officeId
}: FilesViewProps) {
  
  // Form states
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [openingYear, setOpeningYear] = useState('2026');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!title.trim() || !code.trim() || !openingYear.trim()) {
      setErrorMsg('অনুগ্রহ করে সকল তারকা চিহ্নিত (*) ঘরগুলো পূরণ করুন।');
      return;
    }

    setSubmitting(true);
    try {
      // Calculate 2 digit year, e.g. "2026" or "26" -> "26"
      let formattedYear = openingYear.trim();
      if (formattedYear.length > 2) {
        formattedYear = formattedYear.slice(-2);
      }

      await onSaveFile({
        office_id: officeId,
        file_title: title.trim(),
        file_code: code.trim(),
        opening_year: formattedYear,
        description: description.trim() || undefined,
        active: true
      });

      // Clear Form on success
      setTitle('');
      setCode('');
      setOpeningYear('2026');
      setDescription('');
    } catch (err) {
      console.error(err);
      setErrorMsg('নতুন নথি ফাইল ডাটাবেজে সংরক্ষণ করতে ত্রুটি হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  const getClassificationTitle = (clid?: string) => {
    if (!clid) return '-';
    const cl = classifications.find(c => c.id === clid);
    return cl ? `${cl.title} (${cl.code})` : '-';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* ADD NEW FILE FORM CARD */}
      <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-xs lg:col-span-1 h-fit">
        <h2 className="text-md font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
          <FolderOpen size={18} className="text-[#006A4E]" />
          নতুন নথি নথিভুক্তি
        </h2>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-150 text-red-700 rounded-lg text-xs font-semibold mb-4">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">নথির শিরোনাম (Title) *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: প্রশিক্ষণ সংক্রান্ত নথি"
              className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* File Code */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">ফাইল কোড/ক্রমিক *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="যেমন: 105"
                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                required
              />
            </div>

            {/* Opening Year */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">খোলার বছর *</label>
              <input
                type="text"
                value={openingYear}
                onChange={(e) => setOpeningYear(e.target.value)}
                placeholder="যেমন: 2026"
                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">সংক্ষিপ্ত বিবরণ (Description)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="নথির প্রয়োজনীয়তা বা অতিরিক্ত তথ্য (ঐচ্ছিক)"
              className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-[#006A4E] hover:bg-opacity-90 disabled:opacity-55 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Plus size={14} />
            {submitting ? 'সংরক্ষণ করা হচ্ছে...' : 'নতুন নথি ফাইল তৈরি করুন'}
          </button>
        </form>
      </div>

      {/* LIST OF FILES CARD */}
      <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-xs lg:col-span-2 space-y-4">
        <div>
          <h2 className="text-md font-bold text-gray-800">সক্রিয় নথি সূচি (Active Files)</h2>
          <p className="text-xs text-gray-400 mt-1">কার্যালয়ের বর্তমান সেশনের সক্রিয় ও নথিবদ্ধ করার ক্যাটালগ সমূহ</p>
        </div>

        {files.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {files.map((file) => (
              <div key={file.id} className="py-4 hover:bg-gray-50/50 px-2 rounded-lg transition flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-emerald-50 text-[#006A4E] rounded">
                      <Briefcase size={14} />
                    </span>
                    <h3 className="font-bold text-gray-800 text-sm">{file.file_title}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-xs text-gray-500 pl-7">
                    <span className="flex items-center gap-1 font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                      ফাইল কোড: {countToBangla(file.file_code)}
                    </span>
                    <span className="flex items-center gap-1 font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                      বছর: ২০{countToBangla(file.opening_year)}
                    </span>
                    {file.subject_classification_id && (
                      <span className="flex items-center gap-1">
                        <Tag size={12} />
                        শ্রেণি: {getClassificationTitle(file.subject_classification_id)}
                      </span>
                    )}
                  </div>
                  {file.description && (
                    <p className="text-xs text-gray-400 pl-7">{file.description}</p>
                  )}
                </div>
                <div className="self-end md:self-center pr-2">
                  <span className="text-[10px] bg-emerald-50 text-[#006A4E] font-bold px-2 py-0.5 rounded border border-emerald-100 uppercase">
                    সক্রিয়
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-gray-400">
            <Inbox size={48} className="mx-auto mb-3 opacity-60" />
            <p className="text-xs">কোনো সক্রিয় নথি ফাইল তৈরি করা হয়নি। নতুন ক্যাটালগ যোগ করতে বাম পাশের ফর্মটি ব্যবহার করুন।</p>
          </div>
        )}
      </div>

    </div>
  );
}
