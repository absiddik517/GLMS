import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Archive, 
  TrendingUp, 
  Plus, 
  Briefcase,
  Layers,
  History,
  FileCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Letter, NothiFile, SubjectClassification } from '../types';
import { countToBangla } from '../utils/banglaHelpers';

interface DashboardViewProps {
  letters: Letter[];
  files: NothiFile[];
  classifications: SubjectClassification[];
  onCreateLetterClick: () => void;
  onNavigateToLetters: () => void;
  onViewLetter: (letterId: string) => void;
}

export default function DashboardView({
  letters = [],
  files = [],
  classifications = [],
  onCreateLetterClick,
  onNavigateToLetters,
  onViewLetter
}: DashboardViewProps) {
  
  // States for counts
  const totalLetters = letters.length;
  const issuedLetters = letters.filter(l => l.status === 'issued').length;
  const draftLetters = letters.filter(l => l.status === 'draft').length;
  const archivedLetters = letters.filter(l => l.status === 'archived').length;

  // Recent letters
  const recentLetters = [...letters]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  // Month-wise analytics data (Bangla months fallback or English abbreviations formatted in Bangla)
  const monthData = [
    { name: 'জানুয়ারি', সংখ্যা: letters.filter(l => new Date(l.issue_date).getMonth() === 0).length },
    { name: 'ফেব্রুয়ারি', সংখ্যা: letters.filter(l => new Date(l.issue_date).getMonth() === 1).length },
    { name: 'মার্চ', সংখ্যা: letters.filter(l => new Date(l.issue_date).getMonth() === 2).length },
    { name: 'এপ্রিল', সংখ্যা: letters.filter(l => new Date(l.issue_date).getMonth() === 3).length },
    { name: 'মে', সংখ্যা: letters.filter(l => new Date(l.issue_date).getMonth() === 4).length },
    { name: 'জুন', সংখ্যা: letters.filter(l => new Date(l.issue_date).getMonth() === 5).length },
    { name: 'জুলাই', সংখ্যা: letters.filter(l => new Date(l.issue_date).getMonth() === 6).length },
    { name: 'আগস্ট', সংখ্যা: letters.filter(l => new Date(l.issue_date).getMonth() === 7).length },
    { name: 'সেপ্টেম্বর', সংখ্যা: letters.filter(l => new Date(l.issue_date).getMonth() === 8).length },
    { name: 'অক্টোবর', সংখ্যা: letters.filter(l => new Date(l.issue_date).getMonth() === 9).length },
    { name: 'নভেম্বর', সংখ্যা: letters.filter(l => new Date(l.issue_date).getMonth() === 10).length },
    { name: 'ডিসেম্বর', সংখ্যা: letters.filter(l => new Date(l.issue_date).getMonth() === 11).length },
  ];

  // Letter Type stats
  const typeLabels: { [key: string]: string } = {
    standard: 'সাধারণ পত্র',
    office_order: 'অফিস আদেশ',
    notice: 'বিজ্ঞপ্তি',
    circular: 'পরিপত্র',
    invitation: 'আমন্ত্রণপত্র',
    meeting: 'সভার নোটিশ',
    training: 'প্রশিক্ষণ নোটিশ',
  };

  const typeData = Object.entries(typeLabels).map(([key, label]) => {
    return {
      name: label,
      value: letters.filter(l => l.letter_type === key).length
    };
  }).filter(t => t.value > 0);

  const COLORS = ['#006A4E', '#F42A41', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#10B981'];

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-lg border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-800">দাপ্তরিক ড্যাশবোর্ড (Dashboard)</h1>
          <p className="text-sm text-gray-500 mt-1">উপজেলা উপানুষ্ঠানিক শিক্ষা কর্মকর্তা কার্যালয় চিঠি ব্যবস্থাপনা তথ্য ও পরিসংখ্যান</p>
        </div>
        <button
          onClick={onCreateLetterClick}
          className="bg-[#006A4E] hover:bg-opacity-90 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition shadow-xs cursor-pointer"
        >
          <Plus size={16} />
          নূতন পত্র লিখুন
        </button>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* TOTAL LETTERS */}
        <div className="bg-white p-4 border-l-4 border-[#006A4E] shadow-sm flex items-center justify-between transition hover:shadow-md">
          <div>
            <p className="text-xs font-semibold text-slate-500">মোট পত্র সংখ্যা</p>
            <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{countToBangla(totalLetters)}</p>
            <p className="text-[9px] text-[#006A4E] font-medium mt-1">দপ্তর খতিয়ান ভুক্ত</p>
          </div>
          <div className="p-2 bg-emerald-50 text-[#006A4E] rounded">
            <FileText size={20} />
          </div>
        </div>

        {/* ISSUED LETTERS */}
        <div className="bg-white p-4 border-l-4 border-blue-500 shadow-sm flex items-center justify-between transition hover:shadow-md">
          <div>
            <p className="text-xs font-semibold text-slate-500">জারিকৃত (Issued)</p>
            <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{countToBangla(issuedLetters)}</p>
            <p className="text-[9px] text-blue-600 font-medium mt-1">অফিসিয়াল জারিকৃত</p>
          </div>
          <div className="p-2 bg-blue-50 text-blue-600 rounded">
            <CheckCircle size={20} />
          </div>
        </div>

        {/* DRAFT LETTERS */}
        <div className="bg-white p-4 border-l-4 border-orange-500 shadow-sm flex items-center justify-between transition hover:shadow-md">
          <div>
            <p className="text-xs font-semibold text-slate-500">খসড়া (Draft)</p>
            <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{countToBangla(draftLetters)}</p>
            <p className="text-[9px] text-orange-600 font-semibold mt-1">সম্পাদনাধীন খসড়া</p>
          </div>
          <div className="p-2 bg-amber-50 text-amber-600 rounded">
            <Clock size={20} />
          </div>
        </div>

        {/* ARCHIVED LETTERS */}
        <div className="bg-white p-4 border-l-4 border-[#F42A41] shadow-sm flex items-center justify-between transition hover:shadow-md">
          <div>
            <p className="text-xs font-semibold text-slate-500">আর্কাইভড (Archived)</p>
            <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{countToBangla(archivedLetters)}</p>
            <p className="text-[9px] text-red-600 font-semibold mt-1">সংরক্ষিত আর্কাইভ</p>
          </div>
          <div className="p-2 bg-red-50 text-[#F42A41] rounded">
            <Archive size={20} />
          </div>
        </div>
      </div>

      {/* MID-PART: ANALYTICAL CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MONTHLY BAR CHART */}
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-xs lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp size={16} className="text-[#006A4E]" />
              মাসিক চিঠি জারির রাশিফল ({countToBangla(2026)})
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="সংখ্যা" fill="#006A4E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIE CHART / LETTER STATUS */}
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-bold text-gray-800">শ্রেণি ভিত্তিক পত্র বণ্টন</h3>
          </div>
          <div className="h-44 flex items-center justify-center relative">
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-xs">কোন ডাটা নেই</p>
            )}
          </div>
          <div className="space-y-1.5 mt-2">
            {typeData.map((item, index) => (
              <div key={item.name} className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  {item.name}
                </span>
                <span className="font-mono font-bold text-gray-600">{countToBangla(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* RECENT RECORDS PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* RECENT LETTERS LIST */}
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-xs md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <History size={16} className="text-indigo-600" />
              সম্প্রতি সম্পাদিত চিঠিসমূহ
            </h3>
            <button 
              onClick={onNavigateToLetters} 
              className="text-[#006A4E] hover:underline text-xs font-bold"
            >
              সকল চিঠি দেখুন »
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {recentLetters.length > 0 ? (
              recentLetters.map((l) => (
                <div 
                  key={l.id} 
                  className="py-3 flex justify-between items-center hover:bg-gray-50 px-2 rounded-lg transition group cursor-pointer"
                  onClick={() => onViewLetter(l.id)}
                >
                  <div className="flex flex-col min-w-0 pr-4">
                    <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-[#006A4E] transition">
                      {l.subject || '[অনুরোধ/অফিস আদেশ]'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      স্মারক: {countToBangla(l.memo_no) || 'খসড়া স্মারক'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-gray-500 px-2 py-0.5 bg-gray-100 rounded">
                      {typeLabels[l.letter_type]}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      l.status === 'issued' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      l.status === 'archived' ? 'bg-red-50 text-red-700 border border-red-100' :
                      'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {l.status === 'issued' ? 'জারি' : l.status === 'archived' ? 'আর্কাইভ' : 'খসড়া'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-400 text-xs">
                কোন চিঠিপত্র পাওয়া যায় নি। তৈরি করতে উপরের "নূতন পত্র লিখুন" চাপুন।
              </div>
            )}
          </div>
        </div>

        {/* INFRASTRUCTURE OVERVIEW DOCKET */}
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-xs space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
            <Layers size={16} className="text-amber-500" />
            দাপ্তরিক নথি কাঠামো
          </h3>
          
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded">
                  <Briefcase size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700">মোট সক্রিয় নথি (নথি)</p>
                  <p className="text-[10px] text-gray-400 font-medium">চিঠি সংগঠিত করার ক্যাটালগ</p>
                </div>
              </div>
              <span className="font-mono font-bold text-gray-800 text-sm bg-indigo-100 px-2 py-0.5 rounded">{countToBangla(files.length)}</span>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded">
                  <Layers size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700">শ্রেণি বিন্যাস (Classification)</p>
                  <p className="text-[10px] text-gray-400 font-medium">প্রধান প্রশাসনিক শ্রেণিসমূহ</p>
                </div>
              </div>
              <span className="font-mono font-bold text-gray-800 text-sm bg-amber-100 px-2 py-0.5 rounded">{countToBangla(classifications.length)}</span>
            </div>
          </div>

          <div className="text-xs text-gray-400 leading-relaxed bg-[#006A4E]/5 p-3 rounded-lg border border-[#006A4E]/20 text-[#006A4E]">
            <p className="font-bold mb-1">গুরুত্বপূর্ণ নির্দেশনা:</p>
            স্মারক নম্বরগুলো স্বয়ংক্রিয়ভাবে নথি আইডি, বিন্যাস কোড এবং সেশন খতিয়ান থেকে জেনারেট হয়ে থাকে। নতুন ফাইলে চিঠি ইস্যু করার আগে সঠিক নথি নির্বাচন নিশ্চিত করুন।
          </div>
        </div>

      </div>
    </div>
  );
}
