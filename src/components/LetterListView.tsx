import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  FileText, 
  Eye, 
  Trash2, 
  Archive, 
  RefreshCcw, 
  Printer, 
  Download,
  Plus, 
  Inbox,
  Calendar,
  X,
  Sparkles,
  Copy
} from 'lucide-react';
import { Letter, NothiFile, Recipient } from '../types';
import { countToBangla, countToEnglish, formatBanglaDate } from '../utils/banglaHelpers';

// Helper function to render text with highlighted search keywords
function highlightText(text: string, search: string) {
  if (!search || !search.trim()) return <>{text}</>;

  const query = search.trim();
  const queryBng = countToBangla(query);
  const queryEng = countToEnglish(query);

  // Collect all unique variations of the search term to match
  const targets = Array.from(new Set([query, queryBng, queryEng])).filter(Boolean);
  
  // Escape special regex characters to avoid errors
  const escapedTargets = targets.map(t => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
  
  try {
    const regex = new RegExp(`(${escapedTargets.join('|')})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-100 text-[#00664F] rounded-[2px] px-0.5 font-bold border border-yellow-300">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  } catch (e) {
    return <>{text}</>;
  }
}


interface LetterListViewProps {
  letters: Letter[];
  files: NothiFile[];
  recipients: Recipient[];
  onViewLetter: (letterId: string) => void;
  onEditLetter: (letterId: string) => void;
  onDeleteDraft: (letterId: string) => void;
  onArchiveLetter: (letterId: string) => void;
  onRestoreLetter: (letterId: string) => void;
  onCreateLetter: () => void;
  onCloneLetter?: (letterId: string) => void;
  initialShowArchived?: boolean;
}

export default function LetterListView({
  letters = [],
  files = [],
  recipients = [],
  onViewLetter,
  onEditLetter,
  onDeleteDraft,
  onArchiveLetter,
  onRestoreLetter,
  onCreateLetter,
  onCloneLetter,
  initialShowArchived = false
}: LetterListViewProps) {
  
  // States for search and filter parameters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedFile, setSelectedFile] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState(initialShowArchived ? 'archived' : 'all_active');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Clear filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedFile('all');
    setSelectedStatus(initialShowArchived ? 'archived' : 'all_active');
    setStartDate('');
    setEndDate('');
  };

  const getRecipientName = (recId: string | undefined) => {
    if (!recId) return '';
    const rec = recipients.find(r => r.id === recId);
    return rec ? `${rec.recipient_name} (${rec.designation || ''})` : '';
  };

  const getFileName = (fileId: string | undefined) => {
    if (!fileId) return '';
    const f = files.find(file => file.id === fileId);
    return f ? `${f.file_title} (${f.file_code})` : '';
  };

  // Filter and search logic
  const filteredLetters = useMemo(() => {
    return letters.filter((l) => {
      // Status filtration
      if (selectedStatus === 'all_active') {
        if (l.status === 'archived') return false;
      } else if (selectedStatus !== 'all') {
        if (l.status !== selectedStatus) return false;
      }

      // Type filtration
      if (selectedType !== 'all' && l.letter_type !== selectedType) return false;

      // File filtration
      if (selectedFile !== 'all' && l.file_id !== selectedFile) return false;

      // Date range filter
      if (startDate && l.issue_date < startDate) return false;
      if (endDate && l.issue_date > endDate) return false;

      // Primary Search text match: subject, memo_no, recipient designation/name
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const lowerSearchBng = countToBangla(lowerSearch);
        const lowerSearchEng = countToEnglish(lowerSearch);

        const rawMemo = (l.memo_no || '').toLowerCase();
        const banglaMemo = countToBangla(rawMemo).toLowerCase();

        const subjectMatch = (l.subject || '').toLowerCase().includes(lowerSearch);
        const memoMatch = rawMemo.includes(lowerSearch) || 
                          rawMemo.includes(lowerSearchEng) ||
                          banglaMemo.includes(lowerSearchBng) ||
                          banglaMemo.includes(lowerSearch);
        const bodyMatch = (l.body || '').toLowerCase().includes(lowerSearch);
        const recName = getRecipientName(l.recipient_id).toLowerCase();
        const recMatch = recName.includes(lowerSearch);
        
        return subjectMatch || memoMatch || bodyMatch || recMatch;
      }

      return true;
    });
  }, [letters, searchTerm, selectedType, selectedFile, selectedStatus, startDate, endDate, recipients]);

  const letterTypesMap: { [key: string]: string } = {
    standard: 'সাধারণ পত্র',
    office_order: 'অফিস আদেশ',
    notice: 'বিজ্ঞপ্তি',
    circular: 'পরিপত্র',
    invitation: 'আমন্ত্রণপত্র',
    meeting: 'সভার নোটিশ',
    training: 'প্রশিক্ষণ নোটিশ',
  };

  return (
    <div className="space-y-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-lg border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-800">চিঠিপত্র তালিকা (Letters)</h1>
          <p className="text-sm text-gray-500 mt-1">কার্যালয়ের সমস্ত চিঠি তৈরি, নিস্পত্তি, প্রক্রিয়াকরণ এবং আর্কাইভ তালিকা</p>
        </div>
        <button
          onClick={onCreateLetter}
          className="bg-[#006A4E] hover:bg-opacity-90 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
        >
          <Plus size={16} />
          নূতন পত্র লিখুন
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-xs space-y-4">
        {/* Search Input and Type Select */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="স্মারক নম্বর, বিষয় বা প্রাপকের নাম দিয়ে অনুসন্ধান করুন..."
              className="pl-10 w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E] transition"
            />
          </div>
          
          <div className="w-full md:w-48">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg text-sm w-full bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E] text-gray-700"
            >
              <option value="all_active">সক্রিয় চিঠিসমূহ</option>
              <option value="draft">খসড়া (Draft)</option>
              <option value="issued">জারিকৃত (Issued)</option>
              <option value="archived">আর্কাইভড (Archived)</option>
              <option value="all">সর্বমোট চিঠিপত্র</option>
            </select>
          </div>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-2 border rounded-lg text-sm font-semibold flex items-center gap-2 transition cursor-pointer ${
              showAdvancedFilters ? 'bg-emerald-50 text-[#006A4E] border-[#006A4E]' : 'bg-gray-50 text-gray-600 border-gray-300'
            }`}
          >
            <Filter size={16} />
            ফিল্টার {showAdvancedFilters ? <X size={14} /> : ''}
          </button>
        </div>

        {/* Advanced Filters Drawer */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-55/60 bg-gray-50 rounded-xl border border-gray-200 transition-all text-xs">
            {/* Letter Type */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">পত্র ধরণ</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="p-1.5 border border-gray-300 rounded-lg w-full bg-white text-xs focus:outline-none"
              >
                <option value="all">সকল ধরন</option>
                {Object.entries(letterTypesMap).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {/* File selection */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">দাপ্তরিক নথি</label>
              <select
                value={selectedFile}
                onChange={(e) => setSelectedFile(e.target.value)}
                className="p-1.5 border border-gray-300 rounded-lg w-full bg-white text-xs focus:outline-none"
              >
                <option value="all">সকল নথি</option>
                {files.map((f) => (
                  <option key={f.id} value={f.id}>{f.file_title} ({f.file_code})</option>
                ))}
              </select>
            </div>

            {/* Date Start */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">শুরু তারিখ</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="p-1.5 border border-gray-300 rounded-lg w-full bg-white text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Date End */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">শেষ তারিখ</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="p-1.5 border border-gray-300 rounded-lg w-full bg-white text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-4 flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button 
                onClick={resetFilters}
                className="text-gray-500 hover:text-gray-700 font-bold text-xs"
              >
                রিসেট করুন
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TABLE/GRID OF LETTERS */}
      <div className="bg-white rounded border border-gray-200 shadow-xs overflow-hidden">
        {filteredLetters.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-[11px] text-gray-500 uppercase font-bold">
                  <th className="p-2.5">স্মারক ও ইস্যু তারিখ</th>
                  <th className="p-2.5">বিষয়বস্তু ও প্রকার</th>
                  <th className="p-2.5">প্রাপক</th>
                  <th className="p-2.5">সংশ্লিষ্ট নথি</th>
                  <th className="p-2.5 text-center">স্থিতি</th>
                  <th className="p-2.5 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredLetters.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50/50 transition">
                    {/* MEMO & DATE */}
                    <td className="p-2.5">
                      <p className="font-mono text-gray-800 font-bold">
                        {l.memo_no ? highlightText(countToBangla(l.memo_no), searchTerm) : <span className="text-gray-400 italic text-[10px]">খসড়া স্মারক</span>}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5 font-sans">
                        {formatBanglaDate(l.issue_date)}
                      </p>
                    </td>

                    {/* SUBJECT & TYPE */}
                    <td className="p-2.5 max-w-[220px]">
                      <p className="text-gray-900 font-bold truncate" title={l.subject}>
                        {l.subject ? highlightText(l.subject, searchTerm) : <span className="text-gray-400 italic text-[10px]">শিরোনামহীন পত্র</span>}
                      </p>
                      <span className="inline-block text-[9px] text-[#006A4E] font-bold px-1.5 py-0.2 bg-emerald-50 rounded border border-emerald-100/60 mt-1 h-auto">
                        {letterTypesMap[l.letter_type]}
                      </span>
                    </td>

                    {/* RECIPIENT */}
                    <td className="p-2.5 text-gray-700">
                      <p className="font-bold truncate max-w-[150px]">
                        {getRecipientName(l.recipient_id) || <span className="text-gray-400 italic text-[10px]">-</span>}
                      </p>
                    </td>

                    {/* FIELD / NOTHI */}
                    <td className="p-2.5 text-[11px] text-gray-600">
                      <span className="truncate block max-w-[150px]" title={getFileName(l.file_id)}>
                        {getFileName(l.file_id) || <span className="text-gray-400 italic">-</span>}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td className="p-2.5 text-center">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                        l.status === 'issued' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                        l.status === 'archived' ? 'bg-red-50 text-red-800 border border-red-100' :
                        'bg-amber-50 text-amber-800 border border-amber-100'
                      }`}>
                        {l.status === 'issued' ? 'জারি' : l.status === 'archived' ? 'আর্কাইভ' : 'খসড়া'}
                      </span>
                    </td>

                    {/* OPERATIONS */}
                    <td className="p-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 h-full">
                        {/* View Details */}
                        <button
                          onClick={() => onViewLetter(l.id)}
                          className="p-1 px-2 rounded-lg text-gray-500 hover:text-[#006A4E] hover:bg-emerald-50 transition cursor-pointer"
                          title="চিঠি বিস্তারিত দেখুন"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Clone Letter */}
                        {onCloneLetter && (
                          <button
                            onClick={() => onCloneLetter(l.id)}
                            className="p-1 px-2 text-[#006A4E] hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            title="এই চিঠিটি ক্লোন (কপি) করে নতুন খসড়া তৈরি করুন"
                          >
                            <Copy size={16} />
                          </button>
                        )}

                        {/* Edit or Delete for Draft; Archive for Issued; Restore for Archived */}
                        {l.status === 'draft' ? (
                          <>
                            <button
                              onClick={() => onEditLetter(l.id)}
                              className="p-1 px-2 text-indigo-500 hover:bg-indigo-50 rounded-lg"
                              title="চিঠিটি সম্পাদনা করুন"
                            >
                              <Sparkles size={16} />
                            </button>
                            <button
                              onClick={() => onDeleteDraft(l.id)}
                              className="p-1 px-2 text-red-500 hover:bg-red-50 rounded-lg"
                              title="খসড়া মুছুন"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : l.status === 'issued' ? (
                          <button
                            onClick={() => onArchiveLetter(l.id)}
                            className="p-1 px-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                            title="আর্কাইভ করুন"
                          >
                            <Archive size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => onRestoreLetter(l.id)}
                            className="p-1 px-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="পুনরুদ্ধার করুন"
                          >
                            <RefreshCcw size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-gray-400">
            <Inbox size={48} className="mx-auto mb-3 opacity-60" />
            <p className="text-sm">অনুসন্ধান অনুযায়ী কোনো চিঠিপত্র পাওয়া যায় নি।</p>
            <button 
              onClick={resetFilters} 
              className="text-[#006A4E] font-bold text-xs underline mt-2"
            >
              ফিল্টার রিসেট করুন
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
