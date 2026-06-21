import React, { useState, useEffect } from 'react';
import { 
  Landmark, 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  FolderOpen, 
  Layers, 
  Users, 
  Building, 
  User, 
  Archive, 
  ShieldAlert, 
  LogOut, 
  Menu, 
  X,
  Sparkles,
  Award
} from 'lucide-react';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './utils/firestoreError';

// Types
import { Letter, NothiFile, SubjectClassification, Recipient, AuditLog, Office, Officer, CopyPreset } from './types';

// Services
import { 
  saveLetter, 
  deleteLetter, 
  updateOffice, 
  saveUserProfile, 
  saveFile, 
  saveSubjectClassification, 
  saveRecipient, 
  logAuditAction, 
  getAuditLogs,
  saveOfficer,
  deleteOfficer
} from './services/store';

// Views
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import LetterListView from './components/LetterListView';
import LetterFormView from './components/LetterFormView';
import LetterDetailView from './components/LetterDetailView';
import FilesView from './components/FilesView';
import ClassificationsView from './components/ClassificationsView';
import RecipientsView from './components/RecipientsView';
import OfficersView from './components/OfficersView';
import OfficeSettingsView from './components/OfficeSettingsView';
import ProfileSettingsView from './components/ProfileSettingsView';
import AuditLogsView from './components/AuditLogsView';

function AppContent() {
  const { user, profile, office, logout, refreshProfileAndOffice, loading: authLoading } = useAuth();
  
  // Navigation states
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Firestore lists states
  const [letters, setLetters] = useState<Letter[]>([]);
  const [files, setFiles] = useState<NothiFile[]>([]);
  const [classifications, setClassifications] = useState<SubjectClassification[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [copyPresets, setCopyPresets] = useState<CopyPreset[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  const [dataLoading, setDataLoading] = useState(false);

  // Real-time Firestore synchronized listeners (isolated by current user's office_id)
  useEffect(() => {
    if (!user || !office?.id) return;

    setDataLoading(true);
    const officeId = office.id;

    // 1. Letters snap listener
    const lettersRef = collection(db, 'letters');
    const qLetters = query(
      lettersRef, 
      where('office_id', '==', officeId),
      orderBy('updated_at', 'desc')
    );
    const unsLetters = onSnapshot(qLetters, (snapshot) => {
      const list: Letter[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Letter);
      });
      setLetters(list);
      setDataLoading(false);
    }, (err) => {
      console.error("Letters listener error:", err);
      setDataLoading(false);
      handleFirestoreError(err, OperationType.GET, 'letters');
    });

    // 2. Files snap listener
    const filesRef = collection(db, 'files');
    const qFiles = query(
      filesRef, 
      where('office_id', '==', officeId),
      where('active', '==', true)
    );
    const unsFiles = onSnapshot(qFiles, (snapshot) => {
      const list: NothiFile[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as NothiFile);
      });
      setFiles(list.sort((a, b) => b.created_at.localeCompare(a.created_at)));
    }, (err) => {
      console.error("Files listener error:", err);
      handleFirestoreError(err, OperationType.GET, 'files');
    });

    // 3. Classifications snap listener
    const classRef = collection(db, 'subject_classifications');
    const qClass = query(
      classRef, 
      where('office_id', '==', officeId),
      where('active', '==', true)
    );
    const unsClass = onSnapshot(qClass, (snapshot) => {
      const list: SubjectClassification[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as SubjectClassification);
      });
      setClassifications(list.sort((a, b) => a.code.localeCompare(b.code)));
    }, (err) => {
      console.error("Subject classifications listener error:", err);
      handleFirestoreError(err, OperationType.GET, 'subject_classifications');
    });

    // 4. Recipients snap listener
    const recRef = collection(db, 'recipients');
    const qRec = query(recRef, where('office_id', '==', officeId));
    const unsRec = onSnapshot(qRec, (snapshot) => {
      const list: Recipient[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Recipient);
      });
      setRecipients(list);
    }, (err) => {
      console.error("Recipients listener error:", err);
      handleFirestoreError(err, OperationType.GET, 'recipients');
    });

    // 4b. Officers snap listener
    const offRef = collection(db, 'officers');
    const qOff = query(offRef, where('office_id', '==', officeId));
    const unsOff = onSnapshot(qOff, (snapshot) => {
      const list: Officer[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Officer);
      });
      setOfficers(list);
    }, (err) => {
      console.error("Officers listener error:", err);
      handleFirestoreError(err, OperationType.GET, 'officers');
    });

    // 4c. Copy Presets snap listener
    const cpRef = collection(db, 'copy_presets');
    const qCP = query(cpRef, where('office_id', '==', officeId));
    const unsCP = onSnapshot(qCP, (snapshot) => {
      const list: CopyPreset[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as CopyPreset);
      });
      setCopyPresets(list);
    }, (err) => {
      console.error("Copy presets listener error:", err);
      handleFirestoreError(err, OperationType.GET, 'copy_presets');
    });

    // 5. Fetch audit logs immediately
    const pullLogs = async () => {
      try {
        const logs = await getAuditLogs(officeId);
        setAuditLogs(logs);
      } catch (err) {
        console.error("Error fetching logs:", err);
      }
    };
    pullLogs();

    return () => {
      unsLetters();
      unsFiles();
      unsClass();
      unsRec();
      unsOff();
      unsCP();
    };
  }, [user, office?.id]);

  // Handle manual log reloads
  const handleReloadLogs = async () => {
    if (office?.id) {
      const logs = await getAuditLogs(office.id);
      setAuditLogs(logs);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center font-sans">
        <div className="w-16 h-16 border-4 border-[#006A4E] border-t-red-650 rounded-full animate-spin border-t-[#F42A41]"></div>
        <p className="mt-4 text-xs font-bold text-gray-500 tracking-wide animate-pulse">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার - সিস্টেম পোর্টাল লোড করা হচ্ছে...</p>
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return <LoginView onSuccess={() => setCurrentTab('dashboard')} />;
  }

  // Active letter model lookup helper
  const activeLetter = selectedLetterId 
    ? letters.find(l => l.id === selectedLetterId) 
    : null;

  // TAB ACTION HANDLERS
  const handleLetterSave = async (
    letterData: Omit<Letter, 'id' | 'created_at' | 'updated_at'> & { id?: string },
    issueNow: boolean
  ) => {
    if (!office || !profile) return;
    
    const isNew = !letterData.id;
    const documentId = await saveLetter(letterData);
    
    // Log action to audit trails
    await logAuditAction(
      office.id,
      profile.id,
      profile.name,
      issueNow ? 'issued' : (isNew ? 'create' : 'update'),
      'letter',
      documentId,
      `স্মারক: ${letterData.memo_no}, বিষয়: ${letterData.subject || '[শিরোনামহীন]'}`
    );

    // Refresh logs, and redirect
    handleReloadLogs();
    setSelectedLetterId(documentId);
    setCurrentTab('view_letter');
  };

  const handleLetterDelete = async (letterId: string) => {
    if (!office || !profile) return;
    const lObj = letters.find(l => l.id === letterId);
    if (!lObj) return;

    if (window.confirm('আপনি কি নিশ্চিত যে খসড়া চিঠিটি স্থায়ীভাবে মুছে ফেলতে চান?')) {
      await deleteLetter(letterId);
      
      await logAuditAction(
        office.id,
        profile.id,
        profile.name,
        'delete',
        'letter',
        letterId,
        `স্মারক: ${lObj.memo_no}, বিষয়: ${lObj.subject}`
      );
      
      handleReloadLogs();
      setCurrentTab('letters');
    }
  };

  const handleLetterArchive = async (letterId: string) => {
    if (!office || !profile) return;
    const lObj = letters.find(l => l.id === letterId);
    if (!lObj) return;

    await saveLetter({ ...lObj, status: 'archived' });
    
    await logAuditAction(
      office.id,
      profile.id,
      profile.name,
      'archive',
      'letter',
      letterId,
      `স্মারক: ${lObj.memo_no}, বিষয়: ${lObj.subject}`
    );
    
    handleReloadLogs();
    setCurrentTab('archive');
  };

  const handleLetterRestore = async (letterId: string) => {
    if (!office || !profile) return;
    const lObj = letters.find(l => l.id === letterId);
    if (!lObj) return;

    await saveLetter({ ...lObj, status: 'issued' });
    
    await logAuditAction(
      office.id,
      profile.id,
      profile.name,
      'restore',
      'letter',
      letterId,
      `স্মারক: ${lObj.memo_no}, বিষয়: ${lObj.subject}`
    );
    
    handleReloadLogs();
    setCurrentTab('letters');
  };

  const handleLogLetterPrint = async () => {
    if (!office || !profile || !activeLetter) return;
    await logAuditAction(
      office.id,
      profile.id,
      profile.name,
      'print',
      'letter',
      activeLetter.id,
      `স্মারক: ${activeLetter.memo_no}`
    );
    handleReloadLogs();
  };

  const handleUpdateOfficeSettings = async (officeData: Partial<Office>) => {
    if (!office?.id || !profile) return;
    await updateOffice(office.id, officeData);
    await refreshProfileAndOffice();
    
    await logAuditAction(
      office.id,
      profile.id,
      profile.name,
      'update',
      'settings',
      office.id,
      `কার্যালয়ের পরিচিতি সংশোধিত করা হয়েছে`
    );
    handleReloadLogs();
  };

  const handleUpdateProfileSettings = async (profileData: Partial<typeof profile>) => {
    if (!office || !profile?.id) return;
    await saveUserProfile({
      ...profile,
      ...profileData,
    } as any);
    await refreshProfileAndOffice();

    await logAuditAction(
      office.id,
      profile.id,
      profile.name,
      'update',
      'settings',
      profile.id,
      `স্বাক্ষরকারী প্রোফাইল হালনাগাদ করা হয়েছে`
    );
    handleReloadLogs();
  };

  const handleSaveFile = async (fileData: Omit<NothiFile, 'id' | 'created_at'>) => {
    if (!office || !profile) return;
    await saveFile(fileData);
    
    await logAuditAction(
      office.id,
      profile.id,
      profile.name,
      'create',
      'file',
      '-',
      `নতুন ফাইল খোলা হয়েছে: ${fileData.file_title} (${fileData.file_code})`
    );
    handleReloadLogs();
  };

  const handleSaveClassification = async (classData: Omit<SubjectClassification, 'id'>) => {
    if (!office || !profile) return;
    await saveSubjectClassification(classData);
    
    await logAuditAction(
      office.id,
      profile.id,
      profile.name,
      'create',
      'classification',
      '-',
      `বিষয় শ্রেণি বিন্যাস যোগ করা হয়েছে: ${classData.title} (${classData.code})`
    );
    handleReloadLogs();
  };

  const handleSaveRecipient = async (recData: Omit<Recipient, 'id'>) => {
    if (!office || !profile) return;
    await saveRecipient(recData);
    
    await logAuditAction(
      office.id,
      profile.id,
      profile.name,
      'create',
      'recipient',
      '-',
      `নতুন গ্রহীতা তালিকাভুক্ত করা হয়েছে: ${recData.recipient_name}`
    );
    handleReloadLogs();
  };

  const handleSaveOfficer = async (offData: Omit<Officer, 'id'> & { id?: string }) => {
    if (!office || !profile) return;
    const isEdit = !!offData.id;
    await saveOfficer(offData);
    
    await logAuditAction(
      office.id,
      profile.id,
      profile.name,
      isEdit ? 'update' : 'create',
      'officer',
      '-',
      `স্বাক্ষরকারী অফিসার সংরক্ষণ করা হয়েছে: ${offData.name}`
    );
    handleReloadLogs();
  };

  const handleDeleteOfficer = async (id: string) => {
    if (!office || !profile) return;
    await deleteOfficer(id);
    await logAuditAction(
      office.id,
      profile.id,
      profile.name,
      'delete',
      'officer',
      id,
      `স্বাক্ষরকারী অফিসার মুছে ফেলা হয়েছে`
    );
    handleReloadLogs();
  };

  // Nav items declarations
  const navItems = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'letters', label: 'চিঠিপত্র সূচি', icon: FileText },
    { id: 'create_letter', label: 'নূতন চিঠি তৈরি', icon: PlusCircle },
    { id: 'files', label: 'নথি ব্যবস্থাপনা (নথি)', icon: FolderOpen },
    { id: 'classifications', label: 'বিষয় শ্রেণি বিন্যাস', icon: Layers },
    { id: 'recipients', label: 'প্রাপক তালিকা', icon: Users },
    { id: 'officers', label: 'স্বাক্ষরকারী অফিসার তালিকা', icon: Award },
    { id: 'office_settings', label: 'কার্যালয় পরিচিতি', icon: Building },
    { id: 'profile_settings', label: 'প্রোফাইল ও স্বাক্ষর', icon: User },
    { id: 'archive', label: 'চিঠিপত্র আর্কাইভ', icon: Archive },
    { id: 'audit_logs', label: 'অডিট লগসমূহ', icon: ShieldAlert },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800" style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}>
      
      {/* SIDEBAR NAVIGATION - DESKTOP */}
      <aside className={`fixed inset-y-0 left-0 z-20 w-64 bg-[#006A4E] text-white flex flex-col justify-between transform transition-transform duration-300 md:translate-x-0 md:static ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Top brand */}
        <div>
          <div className="p-5 flex flex-col items-center border-b border-[#ffffff15] relative">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-xs">
              <div className="w-6 h-6 rounded-full border-3 border-[#F42A41]"></div>
            </div>
            <h1 className="text-xs font-bold text-center leading-tight text-white uppercase tracking-wider">GLMS - বাংলাদেশ</h1>
            <p className="text-[9px] text-emerald-100/70 text-center mt-0.5">সরকারি পত্র ব্যবস্থাপনা পদ্ধতি</p>
            
            <button 
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-[#ffffff10] rounded md:hidden"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="py-2 space-y-0.5">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = currentTab === item.id || 
                (item.id === 'letters' && currentTab === 'view_letter') ||
                (item.id === 'letters' && currentTab === 'edit_letter');
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setSelectedLetterId(null);
                    setSidebarOpen(false); // Close mobile sidebar
                  }}
                  className={`w-full flex items-center gap-3 px-5 py-2 text-xs font-bold transition-all cursor-pointer border-l-4 ${
                    isActive 
                      ? 'bg-[#ffffff15] border-[#F42A41] text-white shadow-xs' 
                      : 'border-transparent hover:bg-[#ffffff15] hover:text-white text-emerald-100/90'
                  }`}
                >
                  <IconComp size={14} className="opacity-80" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info signatory */}
        <div className="p-4 border-t border-[#00523C] bg-[#00523C]/30 text-xs text-emerald-100 flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-700/60 flex items-center justify-center font-bold text-white border border-[#006A4E]">
              {profile?.name ? profile.name[0] : 'অ'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold truncate text-white leading-tight">{profile?.name || 'কর্মকর্তা'}</p>
              <p className="text-[10px] text-emerald-200 truncate leading-none mt-1">{profile?.designation || 'পদবি'}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full py-1.5 bg-[#F42A41]/10 hover:bg-[#F42A41]/20 border border-[#F42A41]/20 text-[#F42A41] rounded-md font-bold text-[10px] flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <LogOut size={12} />
            লগআউট (Logout)
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* TOP COMPREHENSIVE HEADER MODULE */}
        <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 md:hidden transition"
            >
              <Menu size={20} />
            </button>
            <div className="hidden md:block">
              <span className="text-xs bg-emerald-50 text-[#006A4E] border border-emerald-100 font-bold px-2 py-0.5 rounded leading-none inline-block">
                দপ্তর পোর্টাল সক্রিয়
              </span>
              <h2 className="text-sm font-extrabold text-gray-800 mt-1 leading-tight">
                {office?.office_name || 'উপজেলা উপানুষ্ঠানিক শিক্ষা কর্মকর্তার কার্যালয়'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-gray-850 block">{profile?.name || 'প্রবেশকারী'}</span>
              <span className="text-[10px] text-gray-400 font-medium block mt-0.5">{profile?.designation || 'পদবি'}</span>
            </div>
            
            {/* Round Government Seals flag badge */}
            <div className="w-10 h-10 rounded-full bg-[#006A4E]/5 border border-[#006A4E]/20 text-[#006A4E] flex items-center justify-center p-1.5 shadow-xs font-bold text-[10px]">
              BD
            </div>
          </div>
        </header>

        {/* CONTAINER VIEWPORTS PORT */}
        <main className="p-6">
          {currentTab === 'dashboard' && (
            <DashboardView 
              letters={letters}
              files={files}
              classifications={classifications}
              onCreateLetterClick={() => setCurrentTab('create_letter')}
              onNavigateToLetters={() => setCurrentTab('letters')}
              onViewLetter={(id) => {
                setSelectedLetterId(id);
                setCurrentTab('view_letter');
              }}
            />
          )}

          {currentTab === 'letters' && (
            <LetterListView 
              letters={letters}
              files={files}
              recipients={recipients}
              onViewLetter={(id) => {
                setSelectedLetterId(id);
                setCurrentTab('view_letter');
              }}
              onEditLetter={(id) => {
                setSelectedLetterId(id);
                setCurrentTab('edit_letter');
              }}
              onDeleteDraft={handleLetterDelete}
              onArchiveLetter={handleLetterArchive}
              onRestoreLetter={handleLetterRestore}
              onCreateLetter={() => setCurrentTab('create_letter')}
              initialShowArchived={false}
            />
          )}

          {currentTab === 'create_letter' && (
            <LetterFormView 
              files={files}
              classifications={classifications}
              recipients={recipients}
              officers={officers}
              copyPresets={copyPresets}
              onSave={handleLetterSave}
              onCancel={() => setCurrentTab('letters')}
            />
          )}

          {currentTab === 'edit_letter' && activeLetter && (
            <LetterFormView 
              letter={activeLetter}
              files={files}
              classifications={classifications}
              recipients={recipients}
              officers={officers}
              copyPresets={copyPresets}
              onSave={handleLetterSave}
              onCancel={() => {
                setSelectedLetterId(activeLetter.id);
                setCurrentTab('view_letter');
              }}
            />
          )}

          {currentTab === 'view_letter' && activeLetter && profile && office && (
            <LetterDetailView 
              letter={activeLetter}
              profile={profile}
              office={office}
              files={files}
              recipients={recipients}
              officers={officers}
              onBack={() => {
                setSelectedLetterId(null);
                setCurrentTab('letters');
              }}
              onEdit={() => setCurrentTab('edit_letter')}
              onArchive={() => handleLetterArchive(activeLetter.id)}
              onRestore={() => handleLetterRestore(activeLetter.id)}
              onDelete={() => handleLetterDelete(activeLetter.id)}
              onLogPrint={handleLogLetterPrint}
            />
          )}

          {currentTab === 'files' && office?.id && (
            <FilesView 
              files={files}
              classifications={classifications}
              onSaveFile={handleSaveFile}
              officeId={office.id}
            />
          )}

          {currentTab === 'classifications' && office?.id && (
            <ClassificationsView 
              classifications={classifications}
              onSaveClassification={handleSaveClassification}
              officeId={office.id}
            />
          )}

          {currentTab === 'recipients' && office?.id && (
            <RecipientsView 
              recipients={recipients}
              onSaveRecipient={handleSaveRecipient}
              officeId={office.id}
            />
          )}

          {currentTab === 'officers' && office?.id && (
            <OfficersView 
              officers={officers}
              onSaveOfficer={handleSaveOfficer}
              onDeleteOfficer={handleDeleteOfficer}
              officeId={office.id}
            />
          )}

          {currentTab === 'office_settings' && (
            <OfficeSettingsView 
              office={office}
              onUpdateOffice={handleUpdateOfficeSettings}
            />
          )}

          {currentTab === 'profile_settings' && (
            <ProfileSettingsView 
              profile={profile}
              onUpdateProfile={handleUpdateProfileSettings}
            />
          )}

          {currentTab === 'archive' && (
            <LetterListView 
              letters={letters}
              files={files}
              recipients={recipients}
              onViewLetter={(id) => {
                setSelectedLetterId(id);
                setCurrentTab('view_letter');
              }}
              onEditLetter={(id) => {
                setSelectedLetterId(id);
                setCurrentTab('edit_letter');
              }}
              onDeleteDraft={handleLetterDelete}
              onArchiveLetter={handleLetterArchive}
              onRestoreLetter={handleLetterRestore}
              onCreateLetter={() => setCurrentTab('create_letter')}
              initialShowArchived={true}
            />
          )}

          {currentTab === 'audit_logs' && (
            <AuditLogsView 
              logs={auditLogs}
              onRefresh={handleReloadLogs}
            />
          )}
        </main>

        {/* Footer Info */}
        <footer className="h-8 bg-gray-50 border-t flex items-center justify-between px-6 shrink-0 text-slate-500">
          <p className="text-[9px] text-gray-400">GLMS v2.4.0 (Production) | গণপ্রজাতন্ত্রী বাংলাদেশ সরকার কর্তৃক সংরক্ষিত</p>
          <div className="flex gap-4 text-[9px] text-gray-400 uppercase">
            <span>সার্ভার স্ট্যাটাস: সচল</span>
            <span className="text-[#006A4E] font-bold font-mono">SYST-SECURE: 256bit</span>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
