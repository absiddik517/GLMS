import React, { useState, useMemo } from 'react';
import { History, Shield, Trash2, Search, Calendar, RefreshCw } from 'lucide-react';
import { AuditLog } from '../types';
import { countToBangla, formatBanglaDate } from '../utils/banglaHelpers';

interface AuditLogsViewProps {
  logs: AuditLog[];
  onRefresh: () => Promise<void>;
}

export default function AuditLogsView({
  logs = [],
  onRefresh
}: AuditLogsViewProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;
    const lowerSearch = searchTerm.toLowerCase();
    return logs.filter((log) => {
      const nameMatch = log.user_name.toLowerCase().includes(lowerSearch);
      const actionMatch = log.action.toLowerCase().includes(lowerSearch);
      const detailsMatch = (log.details || '').toLowerCase().includes(lowerSearch);
      const entityMatch = log.entity_type.toLowerCase().includes(lowerSearch);
      
      return nameMatch || actionMatch || detailsMatch || entityMatch;
    });
  }, [logs, searchTerm]);

  // Action helper translates to friendly Bangla words
  const translateAction = (act: string) => {
    switch (act) {
      case 'create': return 'তৈরি করা হয়েছে';
      case 'update': return 'সম্পাদনা/হালনাগাদ';
      case 'delete': return 'খসড়া মোছা হয়েছে';
      case 'archive': return 'আর্কাইভ করা হয়েছে';
      case 'restore': return 'আর্কাইভ থেকে ফিরিয়ে আনা হয়েছে';
      case 'print': return 'পত্র প্রিন্ট করা হয়েছে';
      case 'export': return 'পত্র পিডিএফ/ডকুমেন্টে রপ্তানি করা হয়েছে';
      default: return act;
    }
  };

  const getLogBadgeColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-emerald-50 text-emerald-800 border-emerald-100';
      case 'delete': return 'bg-red-50 text-red-800 border-red-100';
      case 'archive': return 'bg-amber-50 text-amber-800 border-amber-100';
      case 'restore': return 'bg-blue-50 text-blue-800 border-blue-100';
      default: return 'bg-gray-150 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* ACTION BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-lg border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Shield size={20} className="text-[#006A4E]" />
            সিস্টেম অডিট লগ নিরীক্ষণ (Audit Logs)
          </h1>
          <p className="text-sm text-gray-500 mt-1">দাপ্তরিক নিরাপত্তা নিশ্চিতকল্পে চিঠিপত্র ও নথি সম্পাদন ট্র্যাকিং ডাটা</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          লগ রিলোড করুন
        </button>
      </div>

      {/* FILTER SEARCH HEADER */}
      <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-xs">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="অফিসার নাম, সম্পাদনার ধরণ বা বিবরণ লিখে খোঁজ করুন..."
            className="pl-10 w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
          />
        </div>
      </div>

      {/* TABLE DATA PORT */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-xs overflow-hidden">
        {filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-semibold uppercase">
                  <th className="p-4">তারিখ ও সময়</th>
                  <th className="p-4">ব্যবহারকারী</th>
                  <th className="p-4">সম্পাদনার প্রকার</th>
                  <th className="p-4">মডিউল</th>
                  <th className="p-4">বিস্তারিত বিষয় খতিয়ান</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition">
                    {/* Timestamp */}
                    <td className="p-4 font-mono text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString('bn-BD', { hour12: true })}
                    </td>

                    {/* Officer User */}
                    <td className="p-4">
                      <p className="font-bold text-gray-800">{log.user_name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">UID: {log.user_id.slice(0, 10)}...</p>
                    </td>

                    {/* Action Typology */}
                    <td className="p-4">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${getLogBadgeColor(log.action)}`}>
                        {translateAction(log.action)}
                      </span>
                    </td>

                    {/* Module Entity */}
                    <td className="p-4">
                      <span className="text-xs uppercase bg-gray-150 px-2 py-0.5 rounded text-gray-600 font-mono font-bold">
                        {log.entity_type}
                      </span>
                    </td>

                    {/* Details Description */}
                    <td className="p-4 text-xs text-gray-600 font-sans leading-relaxed">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-gray-400">
            <History size={48} className="mx-auto mb-3 opacity-60" />
            <p className="text-xs">অডিট লগের কোনো ডাটা পাওয়া যায়নি।</p>
          </div>
        )}
      </div>

    </div>
  );
}
