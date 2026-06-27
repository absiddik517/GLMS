import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  UserPlus, 
  Layers,
  HelpCircle,
  FileCheck,
  Search,
  X,
  Mail,
  Phone,
  MapPin,
  Building,
  User,
  FolderPlus,
  Folder,
  Paperclip,
  Sparkles
} from 'lucide-react';
import { Letter, NothiFile, Recipient, SubjectClassification, CopyRecipient, LetterType, Officer, CopyPreset } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Editor from './Editor';
import { generateNextMemoNumber } from '../utils/memoGenerator';
import { countToBangla, padLeft } from '../utils/banglaHelpers';
import { saveRecipient, saveOfficer, saveFile, saveCopyPreset, deleteCopyPreset, getLetters, saveSubjectClassification, saveLetter } from '../services/store';

interface LetterFormViewProps {
  letter?: Letter; // If editing
  files: NothiFile[];
  classifications: SubjectClassification[];
  recipients: Recipient[];
  officers: Officer[];
  copyPresets?: CopyPreset[];
  onSave: (letterData: Omit<Letter, 'id' | 'created_at' | 'updated_at'> & { id?: string }, issueNow: boolean) => Promise<void>;
  onCancel: () => void;
}

export default function LetterFormView({
  letter,
  files = [],
  classifications = [],
  recipients = [],
  officers = [],
  copyPresets = [],
  onSave,
  onCancel
}: LetterFormViewProps) {
  const { office, profile, user } = useAuth();

  // Local state to track current letter ID (can be updated during auto-save)
  const [currentLetterId, setCurrentLetterId] = useState<string | null>(letter?.id || null);
  const [lastSavedJSON, setLastSavedJSON] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'failed' | string>('idle');

  // Form states
  const [letterType, setLetterType] = useState<LetterType>(letter?.letter_type || 'standard');
  const [letterTypeModalOpen, setLetterTypeModalOpen] = useState(!letter);
  const [selectedFileId, setSelectedFileId] = useState(letter?.file_id || '');
  const [selectedClassificationId, setSelectedClassificationId] = useState(letter?.subject_classification_id || '');
  const [classificationModalOpen, setClassificationModalOpen] = useState(false);
  const [activeClassificationTab, setActiveClassificationTab] = useState<'existing' | 'new'>('existing');
  const [classificationSearchQuery, setClassificationSearchQuery] = useState('');
  const [newClassificationCode, setNewClassificationCode] = useState('');
  const [newClassificationTitle, setNewClassificationTitle] = useState('');
  const [newClassificationDesc, setNewClassificationDesc] = useState('');
  const [newClassificationKeywords, setNewClassificationKeywords] = useState('');
  const [classificationSubmitting, setClassificationSubmitting] = useState(false);
  const [classificationModalError, setClassificationModalError] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState(letter?.recipient_id || '');
  const [subject, setSubject] = useState(letter?.subject || '');
  const [body, setBody] = useState(letter?.body || '<p>মহোদয়,</p><p>বিনীত নিবেদন এই যে, ...</p>');
  const [issueDate, setIssueDate] = useState(letter?.issue_date || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(letter?.notes || '');
  const [memoNo, setMemoNo] = useState(letter?.memo_no || '');
  const [serialNo, setSerialNo] = useState(letter?.serial_no || '');
  const [copyRecipients, setCopyRecipients] = useState<CopyRecipient[]>(letter?.copy_recipients || []);

  // Recipient Display Field Choices
  const [showName, setShowName] = useState<boolean>(
    letter?.recipient_display_options?.show_name !== false
  );
  const [showDesignation, setShowDesignation] = useState<boolean>(
    letter?.recipient_display_options?.show_designation !== false
  );
  const [showOrganization, setShowOrganization] = useState<boolean>(
    letter?.recipient_display_options?.show_organization !== false
  );
  const [showAddress, setShowAddress] = useState<boolean>(
    letter?.recipient_display_options?.show_address !== false
  );

  const [isFirstLoadSelected, setIsFirstLoadSelected] = useState(true);
  const [isFirstClassificationLoad, setIsFirstClassificationLoad] = useState(true);

  // For copy recipients additions
  const [newCopyName, setNewCopyName] = useState('');
  const [newCopyDesignation, setNewCopyDesignation] = useState('');
  const [newCopyOrg, setNewCopyOrg] = useState('');

  // For attachments additions
  const [attachments, setAttachments] = useState<string[]>(letter?.attachments || []);
  const [newAttachment, setNewAttachment] = useState('');
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [historyPresets, setHistoryPresets] = useState<string[]>([]);

  useEffect(() => {
    async function loadHistoryPresets() {
      if (!office?.id) return;
      try {
        const lettersList = await getLetters(office.id);
        const counts: { [key: string]: number } = {};
        lettersList.forEach(l => {
          if (l.attachments && Array.isArray(l.attachments)) {
            l.attachments.forEach(attach => {
              const cleaned = attach.trim();
              if (cleaned) {
                counts[cleaned] = (counts[cleaned] || 0) + 1;
              }
            });
          }
        });
        
        const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
        setHistoryPresets(sorted.slice(0, 5));
      } catch (err) {
        console.error("Error loading attachment history presets:", err);
      }
    }
    loadHistoryPresets();
  }, [office?.id]);

  // For copy recipients modal
  const [copyRecipientModalOpen, setCopyRecipientModalOpen] = useState(false);
  const [activeCopyRecipientTab, setActiveCopyRecipientTab] = useState<'existing' | 'new'>('existing');
  const [copyRecipientSearchQuery, setCopyRecipientSearchQuery] = useState('');

  // For issue confirmation modal
  const [issueConfirmModalOpen, setIssueConfirmModalOpen] = useState(false);
  const [recentIssuedLetters, setRecentIssuedLetters] = useState<Letter[]>([]);
  const [modalSerialNo, setModalSerialNo] = useState('');
  const [modalIssueDate, setModalIssueDate] = useState('');

  const addAttachment = () => {
    if (!newAttachment.trim()) return;
    setAttachments([...attachments, newAttachment.trim()]);
    setNewAttachment('');
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, idx) => idx !== index));
  };

  // Auto memo number preview block
  const [loadingMemo, setLoadingMemo] = useState(false);
  const [errorText, setErrorText] = useState('');

  // For selecting recipients via Modal
  const [recipientModalOpen, setRecipientModalOpen] = useState(false);
  const [recipientSearchQuery, setRecipientSearchQuery] = useState('');
  const [activeRecipientTab, setActiveRecipientTab] = useState<'existing' | 'new'>('existing');

  // New Recipient Form states
  const [newRecName, setNewRecName] = useState('');
  const [newRecDesignation, setNewRecDesignation] = useState('');
  const [newRecOrg, setNewRecOrg] = useState('');
  const [newRecAddress, setNewRecAddress] = useState('');
  const [newRecMobile, setNewRecMobile] = useState('');
  const [newRecEmail, setNewRecEmail] = useState('');
  const [newRecShowName, setNewRecShowName] = useState(true);
  const [newRecShowDesignation, setNewRecShowDesignation] = useState(true);
  const [newRecShowOrganization, setNewRecShowOrganization] = useState(true);
  const [newRecShowAddress, setNewRecShowAddress] = useState(true);
  const [savingNewRecipient, setSavingNewRecipient] = useState(false);
  // For selecting officers via Modal
  const [selectedSignatoryId, setSelectedSignatoryId] = useState(letter?.signatory_officer_id || '');
  const [officerModalOpen, setOfficerModalOpen] = useState(false);
  const [officerSearchQuery, setOfficerSearchQuery] = useState('');
  const [activeOfficerTab, setActiveOfficerTab] = useState<'existing' | 'new'>('existing');

  // New Officer Form states
  const [newOffName, setNewOffName] = useState('');
  const [newOffDesignation, setNewOffDesignation] = useState('');
  const [newOffPhone, setNewOffPhone] = useState('');
  const [newOffEmail, setNewOffEmail] = useState('');
  const [newOffActive, setNewOffActive] = useState(true);
  const [savingNewOfficer, setSavingNewOfficer] = useState(false);

  // For selecting files/folders via Modal
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [activeFileTab, setActiveFileTab] = useState<'existing' | 'new'>('existing');

  // New File Form states
  const [newFileTitle, setNewFileTitle] = useState('');
  const [newFileCode, setNewFileCode] = useState('');
  const [newFileOpeningYear, setNewFileOpeningYear] = useState('26');
  const [newFileClassificationId, setNewFileClassificationId] = useState('');
  const [newFileDescription, setNewFileDescription] = useState('');
  const [savingNewFile, setSavingNewFile] = useState(false);

  const [modalError, setModalError] = useState('');

  // Sync currentLetterId if letter prop changes (e.g. switching letters or cloning)
  useEffect(() => {
    setCurrentLetterId(letter?.id || null);
  }, [letter]);

  // Initialize lastSavedJSON with original or loaded letter's values
  useEffect(() => {
    setLastSavedJSON(JSON.stringify({
      letterType: letter?.letter_type || 'standard',
      selectedFileId: letter?.file_id || '',
      selectedClassificationId: letter?.subject_classification_id || '',
      selectedRecipientId: letter?.recipient_id || '',
      subject: letter?.subject || '',
      body: letter?.body || '<p>মহোদয়,</p><p>বিনীত নিবেদন এই যে, ...</p>',
      issueDate: letter?.issue_date || new Date().toISOString().split('T')[0],
      notes: letter?.notes || '',
      copyRecipients: letter?.copy_recipients || [],
      attachments: letter?.attachments || [],
      showName: letter?.recipient_display_options?.show_name !== false,
      showDesignation: letter?.recipient_display_options?.show_designation !== false,
      showOrganization: letter?.recipient_display_options?.show_organization !== false,
      showAddress: letter?.recipient_display_options?.show_address !== false,
      selectedSignatoryId: letter?.signatory_officer_id || ''
    }));
  }, [letter]);

  // Helper to serialize current form state
  const getFormStateJSON = () => {
    return JSON.stringify({
      letterType,
      selectedFileId,
      selectedClassificationId,
      selectedRecipientId,
      subject,
      body,
      issueDate,
      notes,
      copyRecipients,
      attachments,
      showName,
      showDesignation,
      showOrganization,
      showAddress,
      selectedSignatoryId
    });
  };

  // Auto-Save background worker
  useEffect(() => {
    const interval = setInterval(async () => {
      const currentJSON = getFormStateJSON();
      // Ensure we have loaded initial state and have changes
      if (lastSavedJSON && currentJSON !== lastSavedJSON && office?.id && user?.uid) {
        // We only require a minimal set of fields to auto-save to avoid saving empty drafts
        if (!selectedFileId && !subject.trim() && (!body || body.trim() === '' || body === '<p>মহোদয়,</p><p>বিনীত নিবেদন এই যে, ...</p>')) {
          return;
        }

        const finalMemoNo = memoNo.endsWith('-xx') ? memoNo : (memoNo.includes('-') ? (memoNo.substring(0, memoNo.lastIndexOf('-')) + '-xx') : memoNo);

        setAutoSaveStatus('saving');
        try {
          const letterData = {
            id: currentLetterId || undefined,
            office_id: office.id,
            file_id: selectedFileId,
            subject_classification_id: selectedClassificationId || undefined,
            recipient_id: selectedRecipientId || undefined,
            sender_user_id: profile?.id || '',
            signatory_officer_id: selectedSignatoryId || undefined,
            subject: subject,
            body: body,
            letter_type: letterType,
            memo_no: finalMemoNo,
            serial_no: '',
            issue_date: issueDate,
            status: 'draft' as const,
            notes: notes,
            created_by: user.uid,
            copy_recipients: copyRecipients,
            attachments: attachments,
            recipient_display_options: {
              show_name: showName,
              show_designation: showDesignation,
              show_organization: showOrganization,
              show_address: showAddress
            }
          };

          const documentId = await saveLetter(letterData);
          setCurrentLetterId(documentId);
          setLastSavedJSON(currentJSON);
          
          const nowStr = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setAutoSaveStatus(`saved-at: ${nowStr}`);
        } catch (err) {
          console.error("Auto-save failed:", err);
          setAutoSaveStatus('failed');
        }
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [
    lastSavedJSON,
    currentLetterId,
    letterType,
    selectedFileId,
    selectedClassificationId,
    selectedRecipientId,
    subject,
    body,
    issueDate,
    notes,
    copyRecipients,
    attachments,
    showName,
    showDesignation,
    showOrganization,
    showAddress,
    selectedSignatoryId,
    office,
    profile,
    user,
    memoNo
  ]);

  // Auto-sync classification on file change
  useEffect(() => {
    if (selectedFileId) {
      if (isFirstClassificationLoad) {
        setIsFirstClassificationLoad(false);
        if (letter?.subject_classification_id) {
          return;
        }
      }
      const fileObj = files.find(f => f.id === selectedFileId);
      if (fileObj && fileObj.subject_classification_id) {
        setSelectedClassificationId(fileObj.subject_classification_id);
      }
    } else {
      setIsFirstClassificationLoad(false);
    }
  }, [selectedFileId, files, letter?.subject_classification_id, isFirstClassificationLoad]);

  // Auto-generate memo when selectedFileId or selectedClassificationId changes
  useEffect(() => {
    // If we're editing an already issued letter, we do NOT change the memo number!
    if (letter && letter.status === 'issued') {
      return;
    }

    if (!selectedFileId || !office) {
      setMemoNo('');
      setSerialNo('');
      return;
    }

    const triggerMemoGen = async () => {
      setLoadingMemo(true);
      setErrorText('');
      try {
        const fileObj = files.find(f => f.id === selectedFileId);
        if (!fileObj) return;

        const classObj = classifications.find(c => c.id === (selectedClassificationId || fileObj.subject_classification_id));

        const res = await generateNextMemoNumber({
          office,
          classification: classObj,
          file: fileObj
        });

        const draftMemo = res.memo_no.substring(0, res.memo_no.lastIndexOf('-')) + '-xx';
        setMemoNo(draftMemo);
        setSerialNo('');
      } catch (err) {
        console.error("Error auto-generating memo number:", err);
        setErrorText('স্মারক নম্বর সমন্বয় করতে ত্রুটি হয়েছে।');
      } finally {
        setLoadingMemo(false);
      }
    };

    triggerMemoGen();
  }, [selectedFileId, selectedClassificationId, letterType, files, classifications, office, letter]);

  // Find recommended classifications based on keywords
  const recommendedClassifications = React.useMemo(() => {
    if (!subject.trim() && (!body || body === '<p>মহোদয়,</p><p>বিনীত নিবেদন এই যে, ...</p>')) {
      return [];
    }

    const textToMatch = `${subject} ${body.replace(/<[^>]*>/g, '')}`.toLowerCase();
    
    const matches = classifications
      .map(c => {
        if (!c.keywords || c.keywords.length === 0) return { classification: c, score: 0 };
        
        let score = 0;
        c.keywords.forEach(kw => {
          if (kw && textToMatch.includes(kw.toLowerCase())) {
            score += 1;
          }
        });
        
        return { classification: c, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return matches.map(m => m.classification);
  }, [subject, body, classifications]);

  // Clean form defaults depending on type
  useEffect(() => {
    if (letterType === 'office_order') {
      setSubject('অফিস আদেশ'); // automatic placeholder
    } else if (letterType === 'notice') {
      setSubject('বিজ্ঞপ্তি');
    } else {
      if (subject === 'অফিস আদেশ' || subject === 'বিজ্ঞপ্তি') {
        setSubject('');
      }
    }
  }, [letterType]);

  // Set default signatory officer based on most letters signed
  useEffect(() => {
    // Only set default if we are NOT editing a letter with an existing signatory_officer_id
    if (letter?.signatory_officer_id) {
      return;
    }

    async function determineDefaultSignatory() {
      if (!office?.id || officers.length === 0) return;

      const activeOfficers = officers.filter(o => o.active);
      if (activeOfficers.length === 0) return;

      try {
        const lettersList = await getLetters(office.id);
        
        // Count letters signed by each active officer
        const counts: { [key: string]: number } = {};
        // Initialize counts for all active officers to 0 so we have a fallback
        activeOfficers.forEach(o => {
          counts[o.id] = 0;
        });

        lettersList.forEach(l => {
          if (l.signatory_officer_id && counts[l.signatory_officer_id] !== undefined) {
            counts[l.signatory_officer_id] += 1;
          }
        });

        // Find the active officer with maximum letters signed
        let maxCount = -1;
        let defaultOfficerId = activeOfficers[0].id; // fallback to the first active officer

        activeOfficers.forEach(o => {
          if (counts[o.id] > maxCount) {
            maxCount = counts[o.id];
            defaultOfficerId = o.id;
          }
        });

        setSelectedSignatoryId(defaultOfficerId);
      } catch (err) {
        console.error("Error determining default signatory:", err);
        // Fallback to the first active officer if letters fetch fails
        if (activeOfficers.length > 0) {
          setSelectedSignatoryId(activeOfficers[0].id);
        }
      }
    }

    determineDefaultSignatory();
  }, [letter?.signatory_officer_id, office?.id, officers]);

  // Load default display options when recipient is loaded or selected
  useEffect(() => {
    if (selectedRecipientId) {
      if (isFirstLoadSelected && letter?.recipient_display_options) {
        // Keep the saved letter selections on first load
        setIsFirstLoadSelected(false);
        return;
      }
      setIsFirstLoadSelected(false);
      const rec = recipients.find(r => r.id === selectedRecipientId);
      if (rec) {
        setShowName(rec.show_name !== false);
        setShowDesignation(rec.show_designation !== false);
        setShowOrganization(rec.show_organization !== false);
        setShowAddress(rec.show_address !== false);
      }
    }
  }, [selectedRecipientId, recipients]);

  // Add Copy Recipient
  const addCopyRecipient = async () => {
    if (!newCopyName.trim()) return;
    const nameText = newCopyName.trim();
    const desText = newCopyDesignation.trim();
    const orgText = newCopyOrg.trim();

    const newCopy: CopyRecipient = {
      id: 'cr_' + Date.now(),
      recipient_name: nameText,
      designation: desText || undefined,
      organization: orgText || undefined,
    };
    setCopyRecipients([...copyRecipients, newCopy]);
    setNewCopyName('');
    setNewCopyDesignation('');
    setNewCopyOrg('');

    // Save copy preset selection to database
    try {
      const exists = copyPresets.some(
        p => 
          p.recipient_name.toLowerCase() === nameText.toLowerCase() &&
          (p.designation || '').toLowerCase() === (desText || '').toLowerCase() &&
          (p.organization || '').toLowerCase() === (orgText || '').toLowerCase()
      );
      if (!exists && office?.id) {
        await saveCopyPreset({
          office_id: office.id,
          recipient_name: nameText,
          designation: desText || undefined,
          organization: orgText || undefined
        });
      }
    } catch (err) {
      console.error("Error saving copy preset:", err);
    }
  };

  // Remove Copy Recipient
  const removeCopyRecipient = (id: string) => {
    setCopyRecipients(copyRecipients.filter(cr => cr.id !== id));
  };

  // Add New Recipient inside Selector Modal
  const handleAddNewRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    
    if (!newRecAddress.trim()) {
      setModalError('অনুগ্রহ করে প্রাপকের ঠিকানা বাংলায় লিখুন।');
      return;
    }

    if (!newRecName.trim() && !newRecDesignation.trim() && !newRecOrg.trim()) {
      setModalError('অনুগ্রহ করে প্রাপকের নাম, পদবি অথবা প্রতিষ্ঠান যেকোনো একটি প্রদান করুন।');
      return;
    }

    setSavingNewRecipient(true);
    try {
      const addedId = await saveRecipient({
        office_id: office?.id || '',
        recipient_name: newRecName.trim() || undefined,
        designation: newRecDesignation.trim() || undefined,
        organization: newRecOrg.trim() || undefined,
        address: newRecAddress.trim(),
        mobile: newRecMobile.trim() || undefined,
        email: newRecEmail.trim() || undefined,
        show_name: newRecShowName,
        show_designation: newRecShowDesignation,
        show_organization: newRecShowOrganization,
        show_address: newRecShowAddress,
      });

      setSelectedRecipientId(addedId);
      
      // Clear values
      setNewRecName('');
      setNewRecDesignation('');
      setNewRecOrg('');
      setNewRecAddress('');
      setNewRecMobile('');
      setNewRecEmail('');
      setNewRecShowName(true);
      setNewRecShowDesignation(true);
      setNewRecShowOrganization(true);
      setNewRecShowAddress(true);
      setModalError('');
      
      // Close modal
      setRecipientModalOpen(false);
    } catch (err) {
      console.error("Error inside handleAddNewRecipient in Modal:", err);
      setModalError('প্রাপক সংরক্ষণ করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setSavingNewRecipient(false);
    }
  };

  // Add New Signatory Officer inside Selector Modal
  const handleAddNewOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    
    if (!newOffName.trim()) {
      setModalError('অনুগ্রহ করে অফিসারের নাম বাংলায় লিখুন।');
      return;
    }
    if (!newOffDesignation.trim()) {
      setModalError('অনুগ্রহ করে অফিসারের পদবি বাংলায় লিখুন।');
      return;
    }

    setSavingNewOfficer(true);
    try {
      const addedId = await saveOfficer({
        office_id: office?.id || '',
        name: newOffName.trim(),
        designation: newOffDesignation.trim(),
        phone: newOffPhone.trim() || undefined,
        email: newOffEmail.trim() || undefined,
        active: newOffActive,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      setSelectedSignatoryId(addedId);
      
      // Clear values
      setNewOffName('');
      setNewOffDesignation('');
      setNewOffPhone('');
      setNewOffEmail('');
      setNewOffActive(true);
      setModalError('');
      
      // Close modal
      setOfficerModalOpen(false);
    } catch (err) {
      console.error("Error inside handleAddNewOfficer in Modal:", err);
      setModalError('অফিসার সংরক্ষণ করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setSavingNewOfficer(false);
    }
  };

  // Add New File/Nothi inside Selector Modal
  const handleAddNewFile = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    
    if (!newFileTitle.trim()) {
      setModalError('অনুগ্রহ করে ফাইলের শিরোনাম লিখুন।');
      return;
    }
    if (!newFileCode.trim()) {
      setModalError('অনুগ্রহ করে ফাইলের কোড নম্বর লিখুন।');
      return;
    }

    setSavingNewFile(true);
    try {
      const addedId = await saveFile({
        office_id: office?.id || '',
        file_title: newFileTitle.trim(),
        file_code: newFileCode.trim(),
        opening_year: newFileOpeningYear.trim() || '26',
        subject_classification_id: newFileClassificationId || undefined,
        description: newFileDescription.trim() || undefined,
        active: true
      });

      setSelectedFileId(addedId);
      
      // Clear values
      setNewFileTitle('');
      setNewFileCode('');
      setNewFileOpeningYear('26');
      setNewFileClassificationId('');
      setNewFileDescription('');
      setModalError('');
      
      // Close modal
      setFileModalOpen(false);
    } catch (err) {
      console.error("Error inside handleAddNewFile in Modal:", err);
      setModalError('নথি ফোল্ডার সংরক্ষণ করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setSavingNewFile(false);
    }
  };

  // Add New Subject Classification inside Selector Modal
  const handleAddNewClassification = async (e: React.FormEvent) => {
    e.preventDefault();
    setClassificationModalError('');

    if (!newClassificationCode.trim()) {
      setClassificationModalError('অনুগ্রহ করে শ্রেণি কোড উল্লেখ করুন।');
      return;
    }
    if (!newClassificationTitle.trim()) {
      setClassificationModalError('অনুগ্রহ করে শ্রেণির নাম উল্লেখ করুন।');
      return;
    }

    setClassificationSubmitting(true);
    try {
      const keywordsArray = newClassificationKeywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const addedId = await saveSubjectClassification({
        office_id: office?.id || '',
        code: newClassificationCode.trim(),
        title: newClassificationTitle.trim(),
        description: newClassificationDesc.trim() || undefined,
        keywords: keywordsArray,
        active: true
      });

      setSelectedClassificationId(addedId);

      // Clear values
      setNewClassificationCode('');
      setNewClassificationTitle('');
      setNewClassificationDesc('');
      setNewClassificationKeywords('');
      setClassificationModalError('');

      // Close modal
      setClassificationModalOpen(false);
    } catch (err) {
      console.error("Error inside handleAddNewClassification in Modal:", err);
      setClassificationModalError('শ্রেণি বিন্যাস সংরক্ষণ করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setClassificationSubmitting(false);
    }
  };

  // Helper to construct memo with custom serial
  const getMemoWithSerial = (baseMemo: string, serial: string) => {
    const padded = padLeft(serial, 2);
    if (baseMemo.endsWith('-xx')) {
      return baseMemo.slice(0, -3) + '-' + padded;
    }
    const lastDashIdx = baseMemo.lastIndexOf('-');
    if (lastDashIdx !== -1) {
      return baseMemo.substring(0, lastDashIdx) + '-' + padded;
    }
    return baseMemo + '-' + padded;
  };

  // Load the 3 most recently issued letters for this office
  const loadRecentIssuedLetters = async () => {
    if (!office?.id) return;
    try {
      const lettersList = await getLetters(office.id);
      const issued = lettersList
        .filter(l => l.status === 'issued')
        .sort((a, b) => {
          const serialA = parseInt(a.serial_no || '0', 10);
          const serialB = parseInt(b.serial_no || '0', 10);
          if (serialA !== serialB) {
            return serialB - serialA;
          }
          return (b.updated_at || b.issue_date || '').localeCompare(a.updated_at || a.issue_date || '');
        });
      setRecentIssuedLetters(issued.slice(0, 3));
    } catch (err) {
      console.error("Error loading recent issued letters:", err);
    }
  };

  // Open Issue Confirmation Modal with calculated values
  const handleIssueClick = async () => {
    setErrorText('');
    
    // Dynamic Validation Check
    if (!selectedFileId) {
      setErrorText('অনুগ্রহ করে চিঠির নথি (File) নির্বাচন করুন।');
      return;
    }

    if (letterType === 'standard' && !selectedRecipientId) {
      setErrorText('সাধারণ পত্রের ক্ষেত্রে প্রাপক নির্বাচন করা আবশ্যক।');
      return;
    }

    if (letterType !== 'office_order' && !subject.trim()) {
      setErrorText('চিঠির বিষয় (Subject) লিখুন।');
      return;
    }

    if (!body || body.trim() === '' || body === '<p><br></p>') {
      setErrorText('চিঠির মূল বিবরণ (Body) খালি রাখা যাবে না।');
      return;
    }

    // Load recent 3 issued letters
    await loadRecentIssuedLetters();

    // Compute next sequence/serial number for this specific file
    try {
      const fileObj = files.find(f => f.id === selectedFileId);
      if (fileObj) {
        const classObj = classifications.find(c => c.id === (selectedClassificationId || fileObj.subject_classification_id));
        const res = await generateNextMemoNumber({
          office: office!,
          classification: classObj,
          file: fileObj
        });
        setModalSerialNo(res.serial_no);
      } else {
        setModalSerialNo('01');
      }
    } catch (err) {
      console.error("Error computing next serial number:", err);
      setModalSerialNo('01');
    }

    // Set other states for the modal
    setModalIssueDate(issueDate || new Date().toISOString().split('T')[0]);
    setIssueConfirmModalOpen(true);
  };

  // Confirm letter issue from modal
  const handleConfirmIssue = async () => {
    if (!modalSerialNo.trim()) {
      alert('অনুগ্রহ করে ক্রমিক নম্বর লিখুন।');
      return;
    }

    const finalSerial = padLeft(modalSerialNo.trim(), 4);
    const finalMemo = getMemoWithSerial(memoNo, finalSerial);

    try {
      await onSave({
        id: currentLetterId || undefined,
        office_id: office?.id || '',
        file_id: selectedFileId,
        subject_classification_id: selectedClassificationId || undefined,
        recipient_id: selectedRecipientId || undefined,
        sender_user_id: profile?.id || '',
        signatory_officer_id: selectedSignatoryId || undefined,
        subject: subject,
        body: body,
        letter_type: letterType,
        memo_no: finalMemo,
        serial_no: finalSerial,
        issue_date: modalIssueDate,
        status: 'issued',
        notes: notes,
        created_by: user?.uid || '',
        copy_recipients: copyRecipients,
        attachments: attachments,
        recipient_display_options: {
          show_name: showName,
          show_designation: showDesignation,
          show_organization: showOrganization,
          show_address: showAddress
        }
      }, true);
      setIssueConfirmModalOpen(false);
    } catch (err) {
      console.error("Error confirming issue:", err);
      setErrorText('চিঠি জারি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
  };

  // Submission Validation & Save as Draft
  const handleSubmit = async (issueNow: boolean) => {
    setErrorText('');
    
    // Dynamic Validation Check
    if (!selectedFileId) {
      setErrorText('অনুগ্রহ করে চিঠির নথি (File) নির্বাচন করুন।');
      return;
    }

    if (letterType === 'standard' && !selectedRecipientId) {
      setErrorText('সাধারণ পত্রের ক্ষেত্রে প্রাপক নির্বাচন করা আবশ্যক।');
      return;
    }

    if (letterType !== 'office_order' && !subject.trim()) {
      setErrorText('চিঠির বিষয় (Subject) লিখুন।');
      return;
    }

    if (!body || body.trim() === '' || body === '<p><br></p>') {
      setErrorText('চিঠির মূল বিবরণ (Body) খালি রাখা যাবে না।');
      return;
    }

    // Ensure we are saving as draft: empty serial, ends with -xx
    const finalMemoNo = memoNo.endsWith('-xx') ? memoNo : (memoNo.includes('-') ? (memoNo.substring(0, memoNo.lastIndexOf('-')) + '-xx') : memoNo);

    try {
      await onSave({
        id: currentLetterId || undefined,
        office_id: office?.id || '',
        file_id: selectedFileId,
        subject_classification_id: selectedClassificationId || undefined,
        recipient_id: selectedRecipientId || undefined,
        sender_user_id: profile?.id || '',
        signatory_officer_id: selectedSignatoryId || undefined,
        subject: subject,
        body: body,
        letter_type: letterType,
        memo_no: finalMemoNo,
        serial_no: '',
        issue_date: issueDate,
        status: 'draft',
        notes: notes,
        created_by: user?.uid || '',
        copy_recipients: copyRecipients,
        attachments: attachments,
        recipient_display_options: {
          show_name: showName,
          show_designation: showDesignation,
          show_organization: showOrganization,
          show_address: showAddress
        }
      }, false);
    } catch (err) {
      console.error(err);
      setErrorText('চিঠি সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
  };

  const letterTypes: { k: LetterType; v: string }[] = [
    { k: 'standard', v: 'সাধারণ পত্র (Standard Letter)' },
    { k: 'office_order', v: 'অফিস আদেশ (Office Order)' },
    { k: 'notice', v: 'নোটিশ (Notice)' },
    { k: 'circular', v: 'পরিপত্র (Circular)' },
    { k: 'invitation', v: 'আমন্ত্রণপত্র (Invitation)' },
    { k: 'meeting', v: 'সভার নোটিশ (Meeting)' },
    { k: 'training', v: 'প্রশিক্ষণ নোটিশ (Training)' },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER ACTION BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-lg border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {letter ? 'চিঠিপত্র সংশোধন (Edit Letter)' : 'নতুন সরকারি পত্র লিখুন (Write Letter)'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">বাংলাদেশ সরকারের অফিস প্যাটার্নে চিঠি ড্রাফট বা সরাসরি জারি করুন</p>
          </div>
        </div>
        
        {/* Save/Issue Controls */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          {autoSaveStatus !== 'idle' && (
            <div className="text-xs text-gray-500 flex items-center gap-1.5 animate-pulse bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-100">
              {autoSaveStatus === 'saving' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>স্বয়ংক্রিয়ভাবে ড্রাফট সংরক্ষণ করা হচ্ছে...</span>
                </>
              ) : autoSaveStatus === 'failed' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-red-500 font-medium">অটো-সেভ ব্যর্থ হয়েছে</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>ড্রাফট স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়েছে ({autoSaveStatus.replace('saved-at: ', '')})</span>
                </>
              )}
            </div>
          )}
          <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            <Save size={16} />
            খসড়া হিসেবে সংরক্ষণ (Draft)
          </button>
          <button
            type="button"
            onClick={handleIssueClick}
            className="px-4 py-2 bg-[#006A4E] hover:bg-opacity-90 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <CheckCircle2 size={16} />
            সরাসরি জারি করুন (Issue Now)
          </button>
        </div>
      </div>
    </div>

      {errorText && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-semibold">
          {errorText}
        </div>
      )}

      {/* COMPOSITION FORM GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT / CENTRAL CARD: THE BODY AND CORE INFO */}
        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-xs lg:col-span-2 space-y-5">
          <h2 className="text-md font-bold text-gray-800 border-b border-gray-100 pb-2">চিঠিপত্রের বিবরণ (Body & Details)</h2>
          
          {/* Letter Type Selection (Taken in Modal as requested) */}
          <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">পত্রের বিবরণ / ধরন (Selected Letter Type)</span>
              <span className="text-sm font-bold text-[#006A4E] mt-0.5 block flex items-center gap-2">
                <FileCheck size={16} />
                {letterTypes.find(t => t.k === letterType)?.v || 'সাধারণ পত্র'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setLetterTypeModalOpen(true)}
              className="px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 hover:border-[#006A4E] text-[#006A4E] rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles size={14} className="animate-pulse" />
              পত্রের ধরন পরিবর্তন করুন
            </button>
          </div>

          {/* Subject Block (Hidden for office order) */}
          {letterType !== 'office_order' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">পত্রের বিষয় (Subject)</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="চিঠিপত্রের মূল বিষয়বস্তু বাংলায় উল্লেখ করুন..."
                className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
              />
            </div>
          )}

          {/* Core TipTap Editor Connect */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">চিঠিপত্রের মূল বিবরণী (Rich Text Body)</label>
            <Editor value={body} onChange={setBody} />
          </div>

          {/* Attachments Section (সংযুক্তি) */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <Paperclip size={16} className="text-[#006A4E]" />
              <span>সংযুক্তি যোগ করুন (Attachments / Enclosures) (ডাটাবেইজ এ সংরক্ষণের প্রয়োজন নেই)</span>
            </h3>

            {attachments.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-lg p-5 text-center bg-gray-50/50">
                <p className="text-xs text-gray-500">কোনো সংযুক্তি যোগ করা হয়নি।</p>
                <button
                  type="button"
                  onClick={() => setAttachmentModalOpen(true)}
                  className="mt-3 text-xs font-bold bg-[#006A4E] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus size={14} />
                  সংযুক্তি যোগ করুন (Attachments)
                </button>
              </div>
            ) : (
              <div className="bg-emerald-50/10 border border-emerald-100 rounded-lg p-4 space-y-3 relative">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                    <Paperclip size={13} className="text-[#006A4E]" />
                    সংযুক্তিসমূহ ({countToBangla(attachments.length)}টি)
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachmentModalOpen(true)}
                    className="text-xs font-bold text-[#006A4E] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} />
                    আরো সংযুক্তি যোগ করুন
                  </button>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {attachments.map((attach, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-2 border border-gray-150 rounded text-xs">
                      <span>
                        <strong className="font-mono text-gray-400 mr-2">{countToBangla(idx + 1)}.</strong>
                        {attach}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-red-500 hover:text-red-700 transition cursor-pointer"
                        title="মুছুন"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Copy Recipients Section (অনুলিপি) */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <h3 className="text-sm font-bold text-gray-800 block">অনুলিপি জ্ঞাতার্থে ও কার্যাদার্থে প্রেরণ (Copy Recipients)</h3>

            {copyRecipients.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-lg p-5 text-center bg-gray-50/50">
                <p className="text-xs text-gray-500">কোনো অনুলিপি প্রাপক যুক্ত করা হয়নি।</p>
                <button
                  type="button"
                  onClick={() => {
                    setCopyRecipientSearchQuery('');
                    setActiveCopyRecipientTab('existing');
                    setCopyRecipientModalOpen(true);
                  }}
                  className="mt-3 text-xs font-bold bg-[#006A4E] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus size={14} />
                  অনুলিপি প্রাপক নির্বাচন বা সংযুক্তি
                </button>
              </div>
            ) : (
              <div className="bg-emerald-50/10 border border-emerald-100 rounded-lg p-4 space-y-3 relative">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                    <User size={13} className="text-[#006A4E]" />
                    অনুলিপি প্রাপকসমূহ ({countToBangla(copyRecipients.length)} জন)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCopyRecipientSearchQuery('');
                      setActiveCopyRecipientTab('existing');
                      setCopyRecipientModalOpen(true);
                    }}
                    className="text-xs font-bold text-[#006A4E] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} />
                    আরো অনুলিপি প্রাপক যোগ করুন
                  </button>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {copyRecipients.map((cr, idx) => (
                    <div key={cr.id} className="flex justify-between items-center bg-white p-2 border border-gray-150 rounded text-xs">
                      <span>
                        <strong className="font-mono text-gray-400 mr-2">{countToBangla(idx + 1)}.</strong>
                        {cr.recipient_name}
                        {cr.designation && `, ${cr.designation}`}
                        {cr.organization && `, ${cr.organization}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCopyRecipient(cr.id)}
                        className="text-red-500 hover:text-red-700 transition cursor-pointer"
                        title="মুছুন"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT CARD: CONFIGURATION, MEMO LAYOUTS, RECIPIENTS */}
        <div className="space-y-6">
          {/* METADATA BLOCK */}
          <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-md font-bold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
              <Layers size={16} className="text-[#006A4E]" />
              দাপ্তরিক সংযোগ
            </h2>

            {/* Link to File */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">নথি ফাইল নির্বাচন (Nothi/File) *</label>
              
              {selectedFileId ? (
                (() => {
                  const f = files.find(x => x.id === selectedFileId);
                  return f ? (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 relative flex flex-col space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                          <Folder size={13} className="text-[#006A4E]" />
                          {f.file_title}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedFileId('')}
                          className="text-gray-400 hover:text-red-500 transition cursor-pointer"
                          title="নির্বাচন বাতিল করুন"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <span className="text-[11px] font-mono text-gray-500 font-medium">ফাইল কোড: {countToBangla(f.file_code)} (বছর: {countToBangla(f.opening_year)})</span>
                    </div>
                  ) : null;
                })()
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setFileSearchQuery('');
                    setActiveFileTab('existing');
                    setFileModalOpen(true);
                  }}
                  className="w-full py-2.5 border border-dashed border-gray-200 hover:border-[#006A4E] text-xs font-semibold text-[#006A4E] hover:bg-emerald-50/20 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FolderPlus size={14} />
                  নথি ফাইল নির্বাচন করুন
                </button>
              )}
              <p className="text-[10px] text-gray-400 mt-1">চিঠিটি যে ক্যাটালগ নথির অধীনে সংরক্ষিত থাকবে।</p>
            </div>

            {/* Subject Classification selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">চিঠির বিষয় ভিত্তিক শ্রেণি বিন্যাস</label>
              
              {selectedClassificationId ? (
                (() => {
                  const c = classifications.find(x => x.id === selectedClassificationId);
                  return c ? (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 relative flex flex-col space-y-1 animate-in fade-in duration-150">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                          <Layers size={13} className="text-[#006A4E]" />
                          {c.title} ({countToBangla(c.code)})
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedClassificationId('')}
                          className="text-gray-400 hover:text-red-500 transition cursor-pointer"
                          title="নির্বাচন বাতিল করুন"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      {c.description && <span className="text-[11px] text-gray-500">{c.description}</span>}
                    </div>
                  ) : null;
                })()
              ) : (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setClassificationSearchQuery('');
                      setActiveClassificationTab('existing');
                      setClassificationModalOpen(true);
                    }}
                    className="w-full py-2.5 border border-dashed border-gray-200 hover:border-[#006A4E] text-xs font-semibold text-[#006A4E] hover:bg-emerald-50/20 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} />
                    শ্রেণি বিন্যাস নির্বাচন করুন
                  </button>

                  {/* RECOMMENDATION BLOCK */}
                  {recommendedClassifications.length > 0 && (
                    <div className="bg-amber-50/50 border border-amber-150 rounded-lg p-3 space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center gap-1.5 text-amber-850 font-bold text-xs" style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}>
                        <Sparkles size={13} className="text-amber-600 animate-pulse" />
                        <span>চিঠির বিষয়বস্তু অনুযায়ী প্রস্তাবিত শ্রেণি বিন্যাস:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recommendedClassifications.slice(0, 3).map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedClassificationId(c.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-amber-100 border border-amber-200 hover:border-amber-300 text-gray-800 text-xs font-semibold rounded-md transition cursor-pointer text-left shadow-2xs"
                            style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
                          >
                            <Layers size={11} className="text-[#006A4E]" />
                            <span>{c.title} (কোড: {countToBangla(c.code)})</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium leading-relaxed" style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}>
                        চিঠির বিষয় ও বডিতে ব্যবহৃত কীওয়ার্ডের মিলের ভিত্তিতে এই সুপারিশগুলো করা হয়েছে।
                      </p>
                    </div>
                  )}
                </div>
              )}
              <p className="text-[10px] text-gray-400 mt-1">চিঠির জন্য বিষয় ভিত্তিক শ্রেণি বিন্যাস নির্ধারণ করুন (মডালে নতুন শ্রেণি তৈরি করতে পারবেন)।</p>
            </div>

            {/* Recipient Link (Standard letter mode mandatory) */}
            {letterType === 'standard' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">প্রাপক নির্বাচন (Recipient) *</label>
                
                {/* Selected Recipient Card */}
                {selectedRecipientId ? (
                  (() => {
                    const r = recipients.find(x => x.id === selectedRecipientId);
                    return r ? (
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 relative flex flex-col space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                            <User size={13} className="text-[#006A4E]" />
                            {r.recipient_name}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedRecipientId('')}
                            className="text-gray-400 hover:text-red-500 transition cursor-pointer"
                            title="নির্বাচন বাতিল করুন"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        {r.designation && (
                          <span className="text-[11px] text-gray-600 font-medium">পদবি: {r.designation}</span>
                        )}
                        {r.organization && (
                          <span className="text-[11px] text-gray-600 font-medium flex items-center gap-1">
                            <Building size={11} className="text-gray-400" />
                            {r.organization}
                          </span>
                        )}
                        {r.address && (
                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <MapPin size={10} className="text-gray-400" />
                            ঠিকানা: {r.address}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setRecipientSearchQuery('');
                            setActiveRecipientTab('existing');
                            setRecipientModalOpen(true);
                          }}
                          className="mt-2 text-right text-[10px] text-[#006A4E] hover:underline font-bold self-end cursor-pointer"
                        >
                          প্রাপক পরিবর্তন করুন
                        </button>
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-500">নির্বাচিত প্রাপক পাওয়া যায়নি বা মুছে ফেলা হয়েছে।</p>
                        <button
                          type="button"
                          onClick={() => {
                            setRecipientSearchQuery('');
                            setActiveRecipientTab('existing');
                            setRecipientModalOpen(true);
                          }}
                          className="mt-2 text-xs font-bold bg-[#006A4E] text-white px-3 py-1.5 rounded-lg hover:bg-opacity-90 transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Search size={12} />
                          প্রাপক নির্বাচন করুন
                        </button>
                      </div>
                    );
                  })()
                ) : (
                  <div className="border border-dashed border-gray-300 rounded-lg p-5 text-center bg-gray-50/50">
                    <p className="text-xs text-gray-500">কোনো প্রাপক নির্বাচন করা হয়নি।</p>
                    <button
                      type="button"
                      onClick={() => {
                        setRecipientSearchQuery('');
                        setActiveRecipientTab('existing');
                        setRecipientModalOpen(true);
                      }}
                      className="mt-3 text-xs font-bold bg-[#006A4E] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <UserPlus size={14} />
                      প্রাপক নির্বাচন বা সংযুক্তি
                    </button>
                  </div>
                )}

                {selectedRecipientId && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2 mt-2">
                    <span className="block text-[11px] font-bold text-gray-700">চিঠিতে প্রদর্শনের ক্ষেত্রসমূহ (Recipient Display Fields):</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-1.5 font-medium text-gray-700 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={showName} 
                          onChange={(e) => setShowName(e.target.checked)}
                          className="rounded border-gray-300 text-[#006A4E] focus:ring-[#006A4E] h-3.5 w-3.5"
                        />
                        প্রাপকের নাম (Name)
                      </label>
                      <label className="flex items-center gap-1.5 font-medium text-gray-700 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={showDesignation} 
                          onChange={(e) => setShowDesignation(e.target.checked)}
                          className="rounded border-gray-300 text-[#006A4E] focus:ring-[#006A4E] h-3.5 w-3.5"
                        />
                        পদবি (Designation)
                      </label>
                      <label className="flex items-center gap-1.5 font-medium text-gray-700 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={showOrganization} 
                          onChange={(e) => setShowOrganization(e.target.checked)}
                          className="rounded border-gray-300 text-[#006A4E] focus:ring-[#006A4E] h-3.5 w-3.5"
                        />
                        দপ্তর/প্রতিষ্ঠান (Organization)
                      </label>
                      <label className="flex items-center gap-1.5 font-medium text-gray-700 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={showAddress} 
                          onChange={(e) => setShowAddress(e.target.checked)}
                          className="rounded border-gray-300 text-[#006A4E] focus:ring-[#006A4E] h-3.5 w-3.5"
                        />
                        ঠিকানা (Address)
                      </label>
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-gray-400 font-medium">চিঠিতে শুধুমাত্র নির্বাচিত তথ্য সম্বলিত অংশ থাকবে। নাম ছাড়া কেবল পদবি ও ঠিকানায় চিঠি ইস্যু করা সম্ভব।</p>
              </div>
            )}

            {/* Issue Date */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">চিঠি ইস্যু করার তারিখ (Date)</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E] text-gray-700"
              />
            </div>

            {/* Notes / References */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">সূত্র / অতিরিক্ত মন্তব্য (References/Notes)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="প্রয়োজনীয় সূত্র বা দাপ্তরিক সংকেত উল্লেখ থাকলে এখানে লিখুন (ঐচ্ছিক)"
                className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none font-sans"
                rows={2}
              />
            </div>
          </div>

          {/* GOVERNMENT SWAY MEMO LIVE GENERATOR PREVIEW */}
          <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-md font-bold text-gray-800 border-b border-gray-100 pb-2 block">স্বয়ংক্রিয় স্মারক নম্বর (Auto Memo No)</h2>
            
            {loadingMemo ? (
              <p className="text-xs text-indigo-600 animate-pulse">স্মারক নম্বর যাচাই করা হচ্ছে...</p>
            ) : memoNo ? (
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg">
                <span className="block text-[10px] font-bold text-[#006A4E] mb-1">প্রস্তাবিত স্মারক সংখ্যা:</span>
                <span className="font-mono text-sm font-bold text-gray-800 tracking-tight leading-loose block select-all">
                  {countToBangla(memoNo)}
                </span>
                <span className="block text-[9px] text-[#006A4E] font-medium mt-2">
                  বিন্যাস: মন্ত্রণালয়.দপ্তর.জিও.উপ-দপ্তর.শাখা.শ্রেণি.নথি.বছর.ক্রমিক
                </span>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
                স্মারক নম্বর দেখতে অনুগ্রহ করে ফাইল (Nothi) নির্বাচন করুন।
              </div>
            )}
          </div>

          {/* SIGNATORY SELECTION PREVIEW */}
          <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-xs space-y-3">
            <h2 className="text-md font-bold text-gray-800 border-b border-gray-100 pb-2 flex justify-between items-center">
              <span>চিঠির স্বাক্ষরকারী (Signatory) *</span>
              <button
                type="button"
                onClick={() => {
                  setOfficerSearchQuery('');
                  setActiveOfficerTab('existing');
                  setOfficerModalOpen(true);
                }}
                className="text-xs text-[#006A4E] hover:underline font-bold"
              >
                পরিবর্তন / নির্বাচন করুন
              </button>
            </h2>

            {selectedSignatoryId ? (
              (() => {
                const o = officers.find(x => x.id === selectedSignatoryId);
                if (!o) return null;
                return (
                  <div className="flex items-center gap-3 bg-emerald-50/20 border border-emerald-100 p-3 rounded-lg relative">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-[#006A4E] font-bold">
                      <User size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800">{o.name}</p>
                      <p className="text-xs text-gray-500">{o.designation}</p>
                      {o.phone && <p className="text-[10px] text-gray-400 font-mono">মোবাইল: {countToBangla(o.phone)}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedSignatoryId('')}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50"
                      title="ডিফল্ট ব্যবহার করুন"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })()
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {profile?.signature_image ? (
                    <img 
                      src={profile.signature_image} 
                      alt="সাক্ষর" 
                      className="w-12 h-12 rounded border border-gray-150 object-contain p-0.5 bg-gray-50 flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400 font-bold border border-gray-150">
                      সাক্ষর
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-gray-800">{profile?.name || 'কর্মকর্তার নাম'} (ডিফল্ট)</p>
                    <p className="text-xs text-gray-500">{profile?.designation || 'পদবি'}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">কোনো নির্দিষ্ট স্বাক্ষরকারী অফিসার নির্বাচিত নেই।</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOfficerSearchQuery('');
                    setActiveOfficerTab('existing');
                    setOfficerModalOpen(true);
                  }}
                  className="w-full py-2 border border-dashed border-gray-200 text-xs font-semibold text-[#006A4E] hover:bg-emerald-50/20 rounded-lg text-center transition cursor-pointer"
                >
                  অন্য স্বাক্ষরকারী অফিসার নির্বাচন করুন
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* RECIPIENT SELECTION MODAL */}
      {recipientModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-gray-100 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="text-md font-bold text-gray-800 flex items-center gap-2">
                <UserPlus size={18} className="text-[#006A4E]" />
                প্রাপক নির্বাচন ও সংযুক্তি
              </h3>
              <button
                type="button"
                onClick={() => setRecipientModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs Header */}
            <div className="flex border-b border-gray-100 bg-gray-50/50">
              <button
                type="button"
                onClick={() => {
                  setActiveRecipientTab('existing');
                  setModalError('');
                }}
                className={`flex-1 py-2.5 text-xs font-bold transition text-center ${
                  activeRecipientTab === 'existing'
                    ? 'border-b-2 border-[#006A4E] text-[#006A4E] bg-white bg-opacity-100'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                বিদ্যমান প্রাপক তালিকা ({recipients.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveRecipientTab('new');
                  setModalError('');
                }}
                className={`flex-1 py-2.5 text-xs font-bold transition text-center ${
                  activeRecipientTab === 'new'
                    ? 'border-b-2 border-[#006A4E] text-[#006A4E] bg-white bg-opacity-100'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                নতুন প্রাপক সংযুক্তি
              </button>
            </div>

            {/* Modal Content Space */}
            <div className="p-4 overflow-y-auto flex-1">
              
              {modalError && (
                <div className="mb-3 p-2.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-medium">
                  {modalError}
                </div>
              )}

              {/* TAB 1: EXISTING LIST */}
              {activeRecipientTab === 'existing' && (
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={recipientSearchQuery}
                      onChange={(e) => setRecipientSearchQuery(e.target.value)}
                      placeholder="নাম, পদবি বা প্রতিষ্ঠান দিয়ে খুঁজুন..."
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                    />
                  </div>

                  {/* List of Recipients */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {(() => {
                      const filtered = recipients.filter(r => 
                        (r.recipient_name || '').toLowerCase().includes(recipientSearchQuery.toLowerCase()) ||
                        (r.designation || '').toLowerCase().includes(recipientSearchQuery.toLowerCase()) ||
                        (r.organization || '').toLowerCase().includes(recipientSearchQuery.toLowerCase())
                      );

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <p className="text-xs">কোনো প্রাপক পাওয়া যায়নি।</p>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveRecipientTab('new');
                                setRecipientSearchQuery('');
                              }}
                              className="mt-2 text-xs text-[#006A4E] font-bold hover:underline cursor-pointer"
                            >
                              নতুন প্রাপক এন্টি করুন →
                            </button>
                          </div>
                        );
                      }

                      return filtered.map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            setSelectedRecipientId(r.id);
                            setRecipientModalOpen(false);
                          }}
                          className={`w-full text-left p-3 rounded-lg border transition flex flex-col text-xs space-y-1 hover:border-[#006A4E] hover:bg-emerald-50/20 cursor-pointer ${
                            selectedRecipientId === r.id
                              ? 'border-[#006A4E] bg-emerald-50/30 font-semibold'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="font-bold text-gray-800">{r.recipient_name}</span>
                            {selectedRecipientId === r.id && (
                              <span className="text-[10px] text-white bg-[#006A4E] px-1.5 py-0.5 rounded font-bold">নির্বাচিত</span>
                            )}
                          </div>
                          {r.designation && (
                            <span className="text-gray-500 font-medium">পদবি: {r.designation}</span>
                          )}
                          {(r.organization || r.address) && (
                            <span className="text-gray-400 text-[10px]">
                              {r.organization || ''} {r.organization && r.address ? ' | ' : ''} {r.address || ''}
                            </span>
                          )}
                          {(r.email || r.mobile) && (
                            <div className="flex items-center gap-3 text-[9px] text-gray-400 pt-1 border-t border-dashed border-gray-100 mt-1">
                              {r.mobile && (
                                <span className="flex items-center gap-0.5 font-mono">
                                  <Phone size={8} />
                                  {r.mobile}
                                </span>
                              )}
                              {r.email && (
                                <span className="flex items-center gap-0.5">
                                  <Mail size={8} />
                                  {r.email}
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* TAB 2: CREATE NEW FORM */}
              {activeRecipientTab === 'new' && (
                <form onSubmit={handleAddNewRecipient} className="space-y-3 pb-2">
                  
                  {/* Name field */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[11px] font-bold text-gray-700">প্রাপকের নাম (বাংলায়)</label>
                      <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">ঐচ্ছিক (Optional)</span>
                    </div>
                    <input
                      type="text"
                      value={newRecName}
                      onChange={(e) => setNewRecName(e.target.value)}
                      placeholder="উদা: ড. মো: আব্দুর রহমান"
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                    />
                  </div>

                  {/* Designation */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">পদবি (Designation)</label>
                    <input
                      type="text"
                      value={newRecDesignation}
                      onChange={(e) => setNewRecDesignation(e.target.value)}
                      placeholder="উদা: উপজেলা নির্বাহী অফিসার"
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                    />
                  </div>

                  {/* Organization */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">দপ্তর/প্রতিষ্ঠান (Organization)</label>
                    <input
                      type="text"
                      value={newRecOrg}
                      onChange={(e) => setNewRecOrg(e.target.value)}
                      placeholder="উদা: উপজেলা নির্বাহী কর্মকর্তার কার্যালয়"
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">পূর্ণ ঠিকানা *</label>
                    <input
                      type="text"
                      value={newRecAddress}
                      onChange={(e) => setNewRecAddress(e.target.value)}
                      placeholder="উদা: কালিয়াকৈর, গাজীপুর।"
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Mobile */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">মোবাইল নম্বর</label>
                      <input
                        type="text"
                        value={newRecMobile}
                        onChange={(e) => setNewRecMobile(e.target.value)}
                        placeholder="উদা: ০১৭xxxxxxxx"
                        className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E] font-mono"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">ইমেইল</label>
                      <input
                        type="email"
                        value={newRecEmail}
                        onChange={(e) => setNewRecEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                      />
                    </div>
                  </div>

                  {/* DISPLAY CONTROLS IN THE PAD */}
                  <div className="p-2.5 bg-emerald-50/50 border border-emerald-150/70 rounded-lg space-y-1.5">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      চিঠির প্যাডে কোন কোন ক্ষেত্র দৃশ্যমান হবে:
                    </p>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                      <label className="flex items-center gap-1.5 font-medium text-gray-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={newRecShowName}
                          onChange={(e) => setNewRecShowName(e.target.checked)}
                          className="rounded border-gray-350 text-[#006A4E] focus:ring-[#006A4E] h-3.5 w-3.5"
                        />
                        নাম দেখান
                      </label>

                      <label className="flex items-center gap-1.5 font-medium text-gray-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={newRecShowDesignation}
                          onChange={(e) => setNewRecShowDesignation(e.target.checked)}
                          className="rounded border-gray-350 text-[#006A4E] focus:ring-[#006A4E] h-3.5 w-3.5"
                        />
                        পদবি দেখান
                      </label>

                      <label className="flex items-center gap-1.5 font-medium text-gray-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={newRecShowOrganization}
                          onChange={(e) => setNewRecShowOrganization(e.target.checked)}
                          className="rounded border-gray-350 text-[#006A4E] focus:ring-[#006A4E] h-3.5 w-3.5"
                        />
                        প্রতিষ্ঠান দেখান
                      </label>

                      <label className="flex items-center gap-1.5 font-medium text-gray-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={newRecShowAddress}
                          onChange={(e) => setNewRecShowAddress(e.target.checked)}
                          className="rounded border-gray-350 text-[#006A4E] focus:ring-[#006A4E] h-3.5 w-3.5"
                        />
                        ঠিকানা দেখান
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3 flex justify-end gap-2 border-t border-gray-100 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveRecipientTab('existing');
                        setModalError('');
                      }}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      disabled={savingNewRecipient}
                      className="px-4 py-2 bg-[#006A4E] hover:bg-opacity-90 disabled:bg-gray-300 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {savingNewRecipient ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ ও সিলেক্ট করুন'}
                    </button>
                  </div>

                </form>
              )}

            </div>

          </div>
        </div>
      )}

      {/* SIGNATORY OFFICER SELECTION MODAL */}
      {officerModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-gray-100 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="text-md font-bold text-gray-800 flex items-center gap-2">
                <UserPlus size={18} className="text-[#006A4E]" />
                স্বাক্ষরকারী অফিসার নির্বাচন ও সংযুক্তি
              </h3>
              <button
                type="button"
                onClick={() => setOfficerModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs Header */}
            <div className="flex border-b border-gray-100 bg-gray-50/50">
              <button
                type="button"
                onClick={() => {
                  setActiveOfficerTab('existing');
                  setModalError('');
                }}
                className={`flex-1 py-2.5 text-xs font-bold transition text-center ${
                  activeOfficerTab === 'existing'
                    ? 'border-b-2 border-[#006A4E] text-[#006A4E] bg-white bg-opacity-100'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                বিদ্যমান অফিসার তালিকা ({officers.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveOfficerTab('new');
                  setModalError('');
                }}
                className={`flex-1 py-2.5 text-xs font-bold transition text-center ${
                  activeOfficerTab === 'new'
                    ? 'border-b-2 border-[#006A4E] text-[#006A4E] bg-white bg-opacity-100'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                নতুন অফিসার সংযুক্তি
              </button>
            </div>

            {/* Modal Content Space */}
            <div className="p-4 overflow-y-auto flex-1">
              
              {modalError && (
                <div className="mb-3 p-2.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-medium">
                  {modalError}
                </div>
              )}

              {/* TAB 1: EXISTING LIST */}
              {activeOfficerTab === 'existing' && (
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={officerSearchQuery}
                      onChange={(e) => setOfficerSearchQuery(e.target.value)}
                      placeholder="নাম বা পদবি দিয়ে খুঁজুন..."
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                    />
                  </div>

                  {/* List of Officers */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {(() => {
                      const filtered = officers.filter(o => 
                        (o.name || '').toLowerCase().includes(officerSearchQuery.toLowerCase()) ||
                        (o.designation || '').toLowerCase().includes(officerSearchQuery.toLowerCase())
                      );

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <p className="text-xs">কোনো অফিসার কর্মকর্তা পাওয়া যায়নি।</p>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveOfficerTab('new');
                                setOfficerSearchQuery('');
                              }}
                              className="mt-2 text-xs text-[#006A4E] font-bold hover:underline cursor-pointer"
                            >
                              নতুন অফিসার এন্ট্রি করুন →
                            </button>
                          </div>
                        );
                      }

                      return filtered.map(o => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => {
                            setSelectedSignatoryId(o.id);
                            setOfficerModalOpen(false);
                          }}
                          className={`w-full text-left p-3 rounded-lg border transition flex flex-col text-xs space-y-1 hover:border-[#006A4E] hover:bg-emerald-50/20 cursor-pointer ${
                            selectedSignatoryId === o.id
                              ? 'border-[#006A4E] bg-emerald-50/30 font-semibold'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="font-bold text-gray-800">{o.name}</span>
                            {selectedSignatoryId === o.id && (
                              <span className="text-[10px] text-white bg-[#006A4E] px-1.5 py-0.5 rounded font-bold">নির্বাচিত</span>
                            )}
                          </div>
                          <span className="text-gray-500 font-medium">পদবি: {o.designation}</span>
                          {o.phone && (
                            <span className="text-gray-400 text-[10px] font-mono">মোবাইল: {countToBangla(o.phone)}</span>
                          )}
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* TAB 2: CREATE NEW FORM */}
              {activeOfficerTab === 'new' && (
                <form onSubmit={handleAddNewOfficer} className="space-y-3 pb-2">
                  
                  {/* Name field */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">অফিসারের নাম (বাংলায়) *</label>
                    <input
                      type="text"
                      value={newOffName}
                      onChange={(e) => setNewOffName(e.target.value)}
                      placeholder="উদা: জনাব মোঃ রিয়াজুল ইসলাম"
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                      required
                    />
                  </div>

                  {/* Designation */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">পদবি (Designation) *</label>
                    <input
                      type="text"
                      value={newOffDesignation}
                      onChange={(e) => setNewOffDesignation(e.target.value)}
                      placeholder="উদা: সহকারী পরিচালক"
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Phone */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">মোবাইল নম্বর</label>
                      <input
                        type="text"
                        value={newOffPhone}
                        onChange={(e) => setNewOffPhone(e.target.value)}
                        placeholder="উদা: ০১৭xxxxxxxx"
                        className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E] font-mono"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">ইমেইল</label>
                      <input
                        type="email"
                        value={newOffEmail}
                        onChange={(e) => setNewOffEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">অবস্থা (স্টেটাস)</label>
                    <select
                      value={newOffActive ? 'true' : 'false'}
                      onChange={(e) => setNewOffActive(e.target.value === 'true')}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none"
                    >
                      <option value="true">সক্রিয় (Active)</option>
                      <option value="false">নিষ্ক্রিয় (Inactive)</option>
                    </select>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3 flex justify-end gap-2 border-t border-gray-100 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveOfficerTab('existing');
                        setModalError('');
                      }}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      disabled={savingNewOfficer}
                      className="px-4 py-2 bg-[#006A4E] hover:bg-opacity-90 disabled:bg-gray-300 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {savingNewOfficer ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ ও সিলেক্ট করুন'}
                    </button>
                  </div>

                </form>
              )}

            </div>

          </div>
        </div>
      )}

      {/* NOTHI FILE SELECTION MODAL */}
      {fileModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-gray-100 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="text-md font-bold text-gray-800 flex items-center gap-2">
                <FolderPlus size={18} className="text-[#006A4E]" />
                নথি ফাইল নির্বাচন ও সংযুক্তি
              </h3>
              <button
                type="button"
                onClick={() => setFileModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs Header */}
            <div className="flex border-b border-gray-100 bg-gray-50/50">
              <button
                type="button"
                onClick={() => {
                  setActiveFileTab('existing');
                  setModalError('');
                }}
                className={`flex-1 py-2.5 text-xs font-bold transition text-center ${
                  activeFileTab === 'existing'
                    ? 'border-b-2 border-[#006A4E] text-[#006A4E] bg-white bg-opacity-100'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                বিদ্যমান নথি তালিকা ({files.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveFileTab('new');
                  setModalError('');
                }}
                className={`flex-1 py-2.5 text-xs font-bold transition text-center ${
                  activeFileTab === 'new'
                    ? 'border-b-2 border-[#006A4E] text-[#006A4E] bg-white bg-opacity-100'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                নতুন নথি ফাইল সংযুক্তি
              </button>
            </div>

            {/* Modal Content Space */}
            <div className="p-4 overflow-y-auto flex-1">
              
              {modalError && (
                <div className="mb-3 p-2.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-medium">
                  {modalError}
                </div>
              )}

              {/* TAB 1: EXISTING LIST */}
              {activeFileTab === 'existing' && (
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={fileSearchQuery}
                      onChange={(e) => setFileSearchQuery(e.target.value)}
                      placeholder="নথির নাম বা কোড দিয়ে খুঁজুন..."
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                    />
                  </div>

                  {/* List of Files */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {(() => {
                      const filtered = files.filter(f => 
                        (f.file_title || '').toLowerCase().includes(fileSearchQuery.toLowerCase()) ||
                        (f.file_code || '').toLowerCase().includes(fileSearchQuery.toLowerCase())
                      );

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <p className="text-xs">কোনো নথি পাওয়া যায়নি।</p>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveFileTab('new');
                                setFileSearchQuery('');
                              }}
                              className="mt-2 text-xs text-[#006A4E] font-bold hover:underline cursor-pointer"
                            >
                              নতুন নথি ফাইল এন্ট্রি করুন →
                            </button>
                          </div>
                        );
                      }

                      return filtered.map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            setSelectedFileId(f.id);
                            setFileModalOpen(false);
                          }}
                          className={`w-full text-left p-3 rounded-lg border transition flex flex-col text-xs space-y-1 hover:border-[#006A4E] hover:bg-emerald-50/20 cursor-pointer ${
                            selectedFileId === f.id
                              ? 'border-[#006A4E] bg-emerald-50/30 font-semibold'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="font-bold text-gray-800 flex items-center gap-1">
                              <Folder size={12} className="text-[#006A4E]" />
                              {f.file_title}
                            </span>
                            {selectedFileId === f.id && (
                              <span className="text-[10px] text-white bg-[#006A4E] px-1.5 py-0.5 rounded font-bold">selected</span>
                            )}
                          </div>
                          <div className="flex justify-between text-gray-500 font-medium text-[11px] pt-1">
                            <span>কোড: {countToBangla(f.file_code)}</span>
                            <span>বছর: {countToBangla(f.opening_year)}</span>
                          </div>
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* TAB 2: CREATE NEW FORM */}
              {activeFileTab === 'new' && (
                <form onSubmit={handleAddNewFile} className="space-y-3 pb-2">
                  
                  {/* File Title */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">নথি ফাইলের বিষয়/শিরোনাম (বাংলায়) *</label>
                    <input
                      type="text"
                      value={newFileTitle}
                      onChange={(e) => setNewFileTitle(e.target.value)}
                      placeholder="উদা: কর্মকর্তা/কর্মচারীদের প্রশিক্ষণ বিষয়ক ফাইল"
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* File Code */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">ফাইলের সূচক কোড সংখ্যা (বাংলা/ইংরেজী) *</label>
                      <input
                        type="text"
                        value={newFileCode}
                        onChange={(e) => setNewFileCode(e.target.value)}
                        placeholder="উদা: ১০৫"
                        className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E] font-mono"
                        required
                      />
                    </div>

                    {/* Opening Year */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">ফাইলের সূচনা বছর (২ ডিজিট) *</label>
                      <input
                        type="text"
                        value={newFileOpeningYear}
                        onChange={(e) => setNewFileOpeningYear(e.target.value)}
                        placeholder="উদা: ২৬ (2026-এর জন্য)"
                        className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E] font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Subject Classification (dropdown) */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">নথির মূল বিভাগ (শ্রেণিবিভাগ)</label>
                    <select
                      value={newFileClassificationId}
                      onChange={(e) => setNewFileClassificationId(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                    >
                      <option value="">নির্বাচন করুন...</option>
                      {classifications.map(c => (
                        <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">অতিরিক্ত বিবরণ/টিকা (Description)</label>
                    <textarea
                      value={newFileDescription}
                      onChange={(e) => setNewFileDescription(e.target.value)}
                      placeholder="নথি ফাইলের উদ্দেশ্য বা বিবরণ"
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none font-sans"
                      rows={2}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3 flex justify-end gap-2 border-t border-gray-100 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFileTab('existing');
                        setModalError('');
                      }}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      disabled={savingNewFile}
                      className="px-4 py-2 bg-[#006A4E] hover:bg-opacity-90 disabled:bg-gray-300 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {savingNewFile ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ ও সিলেক্ট করুন'}
                    </button>
                  </div>

                </form>
              )}

            </div>

          </div>
        </div>
      )}

      {/* ATTACHMENTS MODAL */}
      {attachmentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-gray-100 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="text-md font-bold text-gray-800 flex items-center gap-2">
                <Paperclip size={18} className="text-[#006A4E]" />
                সংযুক্তি যোগ করুন (Attachments)
              </h3>
              <button
                type="button"
                onClick={() => setAttachmentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              
              {/* Form Input */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-700">নতুন সংযুক্তির নাম/বিবরণ লিখুন (বাংলায়) *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAttachment}
                    onChange={(e) => setNewAttachment(e.target.value)}
                    placeholder="উদা: প্রশিক্ষণ নির্দেশিকা - ০২ ফর্দ"
                    className="flex-1 p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAttachment();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addAttachment}
                    className="px-4 py-2 bg-[#006A4E] text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer shrink-0"
                  >
                    <Plus size={14} />
                    যুক্ত করুন
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 font-medium"> can be custom text. (ডাটাবেজে সংরক্ষণের প্রয়োজন নেই)।</p>
              </div>

              {/* Standard presets for quick selection */}
              <div>
                <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                  সহজে যোগ করতে ক্লিক করুন (Quick presets) {historyPresets.length > 0 && " - সর্বাধিক ব্যবহৃত"}:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {(historyPresets.length > 0 
                    ? [
                        ...historyPresets,
                        ...[
                          "প্রশিক্ষণ নির্দেশিকা - ০১ ফর্দ",
                          "তদন্ত প্রতিবেদন - ০৪ ফর্দ",
                          "আবেদনপত্র ও বায়োডাটা - ০২ ফর্দ",
                          "বাজেট বিবরণী ও অনুমোদন পত্র - ০৩ পৃষ্ঠা",
                          "নথি অনুলিপি - ০৫ ফর্দ",
                          "প্রয়োজনীয় কাগজপত্র - ০১ সেট"
                        ].filter(p => !historyPresets.includes(p))
                      ].slice(0, 5)
                    : [
                        "প্রশিক্ষণ নির্দেশিকা - ০১ ফর্দ",
                        "তদন্ত প্রতিবেদন - ০৪ ফর্দ",
                        "আবেদনপত্র ও বায়োডাটা - ০২ ফর্দ",
                        "বাজেট বিবরণী ও অনুমোদন পত্র - ০৩ পৃষ্ঠা",
                        "নথি অনুলিপি - ০৫ ফর্দ",
                        "প্রয়োজনীয় কাগজপত্র - ০১ সেট"
                      ]
                  ).map((presetText) => (
                    <button
                      key={presetText}
                      type="button"
                      onClick={() => {
                        if (!attachments.includes(presetText)) {
                          setAttachments([...attachments, presetText]);
                        }
                      }}
                      className="text-left p-2 rounded-lg border border-gray-200 text-[11px] text-gray-700 hover:border-[#006A4E] hover:bg-emerald-50/20 cursor-pointer transition font-medium"
                    >
                      + {presetText}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current List within modal */}
              {attachments.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="block text-[11px] font-bold text-gray-800 mb-2">যুক্তকৃত সংযুক্তিসমূহ:</span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {attachments.map((attach, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 border border-gray-150 rounded text-xs">
                        <span className="text-gray-700">
                          <strong className="font-mono text-gray-400 mr-1.5">{countToBangla(idx + 1)}.</strong>
                          {attach}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="text-red-500 hover:text-red-700 transition cursor-pointer p-0.5"
                          title="মুছুন"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setAttachmentModalOpen(false)}
                className="px-4 py-2 bg-[#006A4E] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
              >
                সম্পন্ন
              </button>
            </div>

          </div>
        </div>
      )}

      {/* COPY RECIPIENT SELECTION MODAL */}
      {copyRecipientModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-gray-100 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="text-md font-bold text-gray-800 flex items-center gap-2">
                <UserPlus size={18} className="text-[#006A4E]" />
                অনুলিপি প্রাপক নির্বাচন ও সংযুক্তি
              </h3>
              <button
                type="button"
                onClick={() => setCopyRecipientModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs Header */}
            <div className="flex border-b border-gray-100 bg-gray-50/50">
              <button
                type="button"
                onClick={() => {
                  setActiveCopyRecipientTab('existing');
                }}
                className={`flex-1 py-2.5 text-xs font-bold transition text-center ${
                  activeCopyRecipientTab === 'existing'
                    ? 'border-b-2 border-[#006A4E] text-[#006A4E] bg-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                বিদ্যমান তালিকা ({copyPresets.length + recipients.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveCopyRecipientTab('new');
                }}
                className={`flex-1 py-2.5 text-xs font-bold transition text-center ${
                  activeCopyRecipientTab === 'new'
                    ? 'border-b-2 border-[#006A4E] text-[#006A4E] bg-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                নতুন অনুলিপি প্রাপক এন্ট্রি
              </button>
            </div>

            {/* Modal Content Space */}
            <div className="p-4 overflow-y-auto flex-1">
              
              {/* TAB 1: EXISTING LIST */}
              {activeCopyRecipientTab === 'existing' && (
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={copyRecipientSearchQuery}
                      onChange={(e) => setCopyRecipientSearchQuery(e.target.value)}
                      placeholder="নাম, পদবি বা প্রতিষ্ঠানের নাম দিয়ে খুঁজুন..."
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                    />
                  </div>

                  {/* List items */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {(() => {
                      // 1. Get filtered presets
                      const filteredPresets = copyPresets.filter(p => 
                        p.recipient_name.toLowerCase().includes(copyRecipientSearchQuery.toLowerCase()) ||
                        (p.designation || '').toLowerCase().includes(copyRecipientSearchQuery.toLowerCase()) ||
                        (p.organization || '').toLowerCase().includes(copyRecipientSearchQuery.toLowerCase())
                      );

                      // 2. Get filtered general recipients
                      const filteredRecs = recipients.filter(r => 
                        r.recipient_name.toLowerCase().includes(copyRecipientSearchQuery.toLowerCase()) ||
                        (r.designation || '').toLowerCase().includes(copyRecipientSearchQuery.toLowerCase()) ||
                        (r.organization || '').toLowerCase().includes(copyRecipientSearchQuery.toLowerCase())
                      );

                      if (filteredPresets.length === 0 && filteredRecs.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <p className="text-xs">কোনো অনুলিপি প্রাপক পাওয়া যায়নি।</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          {filteredPresets.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="block text-[10px] font-bold text-gray-400 uppercase">পূর্বে ব্যবহৃত অনুলিপিসমূহ (Presets)</span>
                              {filteredPresets.map(preset => {
                                const alreadyAdded = copyRecipients.some(
                                  cr => cr.recipient_name.toLowerCase() === preset.recipient_name.toLowerCase()
                                );
                                return (
                                  <div 
                                    key={preset.id}
                                    className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 bg-white hover:border-[#006A4E] hover:bg-emerald-50/10 transition text-xs"
                                  >
                                    <div className="text-left">
                                      <p className="font-bold text-gray-800">{preset.recipient_name}</p>
                                      <p className="text-gray-500 text-[11px]">
                                        {preset.designation && preset.designation}
                                        {preset.designation && preset.organization && ' - '}
                                        {preset.organization && preset.organization}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            await deleteCopyPreset(preset.id);
                                          } catch (err) {
                                            console.error("Error deleting copy preset:", err);
                                          }
                                        }}
                                        className="text-gray-300 hover:text-red-500 transition p-1 hover:bg-gray-100 rounded cursor-pointer"
                                        title="মুছুন"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={alreadyAdded}
                                        onClick={() => {
                                          const newCopy: CopyRecipient = {
                                            id: 'cr_' + Date.now(),
                                            recipient_name: preset.recipient_name,
                                            designation: preset.designation || undefined,
                                            organization: preset.organization || undefined,
                                          };
                                          setCopyRecipients([...copyRecipients, newCopy]);
                                        }}
                                        className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                                          alreadyAdded 
                                            ? 'bg-gray-100 text-gray-400' 
                                            : 'bg-emerald-50 text-[#006A4E] hover:bg-[#006A4E] hover:text-white'
                                        }`}
                                      >
                                        {alreadyAdded ? 'যুক্ত আছে' : 'যোগ করুন'}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {filteredRecs.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="block text-[10px] font-bold text-gray-400 uppercase">বিদ্যমান মূল প্রাপক তালিকা (Recipients)</span>
                              {filteredRecs.map(rec => {
                                const alreadyAdded = copyRecipients.some(
                                  cr => cr.recipient_name.toLowerCase() === rec.recipient_name.toLowerCase()
                                );
                                return (
                                  <div 
                                    key={rec.id}
                                    className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 bg-white hover:border-[#006A4E] hover:bg-emerald-50/10 transition text-xs"
                                  >
                                    <div className="text-left">
                                      <p className="font-bold text-gray-800">{rec.recipient_name}</p>
                                      <p className="text-gray-500 text-[11px]">
                                        {rec.designation && rec.designation}
                                        {rec.designation && rec.organization && ' - '}
                                        {rec.organization && rec.organization}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      disabled={alreadyAdded}
                                      onClick={() => {
                                        const newCopy: CopyRecipient = {
                                          id: 'cr_' + Date.now(),
                                          recipient_name: rec.recipient_name,
                                          designation: rec.designation || undefined,
                                          organization: rec.organization || undefined,
                                        };
                                        setCopyRecipients([...copyRecipients, newCopy]);
                                      }}
                                      className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                                        alreadyAdded 
                                          ? 'bg-gray-100 text-gray-400' 
                                          : 'bg-emerald-50 text-[#006A4E] hover:bg-[#006A4E] hover:text-white'
                                      }`}
                                    >
                                      {alreadyAdded ? 'যুক্ত আছে' : 'যোগ করুন'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* TAB 2: CREATE NEW COPY RECIPIENT */}
              {activeCopyRecipientTab === 'new' && (
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await addCopyRecipient();
                    setActiveCopyRecipientTab('existing');
                  }} 
                  className="space-y-3 pb-2"
                >
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">অনুলিপি প্রাপকের নাম বা পদবি (বাংলায়) *</label>
                    <input
                      type="text"
                      value={newCopyName}
                      onChange={(e) => setNewCopyName(e.target.value)}
                      placeholder="উদা: সচিব, তথ্য ও যোগাযোগ প্রযুক্তি বিভাগ"
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">শাখা বা বিশেষ পরিচিতি (ঐচ্ছিক)</label>
                    <input
                      type="text"
                      value={newCopyDesignation}
                      onChange={(e) => setNewCopyDesignation(e.target.value)}
                      placeholder="উদা: প্রশাসন শাখা / মেমো সেল"
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">অফিস বা প্রতিষ্ঠানের নাম (ঐচ্ছিক)</label>
                    <input
                      type="text"
                      value={newCopyOrg}
                      onChange={(e) => setNewCopyOrg(e.target.value)}
                      placeholder="উদা: ডাক ও টেলিযোগাযোগ মন্ত্রণালয়"
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                    />
                  </div>

                  <div className="pt-3 flex justify-end gap-2 border-t border-gray-100 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCopyRecipientTab('existing');
                      }}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#006A4E] hover:bg-opacity-90 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      সংরক্ষণ ও যোগ করুন
                    </button>
                  </div>
                </form>
              )}

              {/* Added copy recipients list summary */}
              {copyRecipients.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <span className="block text-[11px] font-bold text-gray-800 mb-2">যুক্তকৃত অনুলিপি প্রাপকসমূহ ({copyRecipients.length} জন):</span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {copyRecipients.map((cr, idx) => (
                      <div key={cr.id} className="flex justify-between items-center bg-gray-50 p-2 border border-gray-150 rounded text-xs">
                        <span className="text-gray-700">
                          <strong className="font-mono text-gray-400 mr-1.5">{countToBangla(idx + 1)}.</strong>
                          {cr.recipient_name}
                          {cr.designation && `, ${cr.designation}`}
                          {cr.organization && `, ${cr.organization}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeCopyRecipient(cr.id)}
                          className="text-red-500 hover:text-red-700 transition cursor-pointer p-0.5"
                          title="মুছুন"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setCopyRecipientModalOpen(false)}
                className="px-4 py-2 bg-[#006A4E] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
              >
                সম্পন্ন
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SUBJECT CLASSIFICATION SELECTION MODAL */}
      {classificationModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-gray-100 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="text-md font-bold text-gray-800 flex items-center gap-2">
                <Layers size={18} className="text-[#006A4E]" />
                বিষয় ভিত্তিক শ্রেণি বিন্যাস নির্বাচন ও সংযুক্তি
              </h3>
              <button
                type="button"
                onClick={() => setClassificationModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs Header */}
            <div className="flex border-b border-gray-100 bg-gray-50/50">
              <button
                type="button"
                onClick={() => {
                  setActiveClassificationTab('existing');
                  setClassificationModalError('');
                }}
                className={`flex-1 py-2.5 text-xs font-bold transition text-center ${
                  activeClassificationTab === 'existing'
                    ? 'border-b-2 border-[#006A4E] text-[#006A4E] bg-white bg-opacity-100'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                বিদ্যমান শ্রেণি তালিকা ({classifications.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveClassificationTab('new');
                  setClassificationModalError('');
                }}
                className={`flex-1 py-2.5 text-xs font-bold transition text-center ${
                  activeClassificationTab === 'new'
                    ? 'border-b-2 border-[#006A4E] text-[#006A4E] bg-white bg-opacity-100'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                নতুন শ্রেণি বিন্যাস সংযুক্তি
              </button>
            </div>

            {/* Modal Content Space */}
            <div className="p-4 overflow-y-auto flex-1">
              
              {classificationModalError && (
                <div className="mb-3 p-2.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-medium">
                  {classificationModalError}
                </div>
              )}

              {/* TAB 1: EXISTING LIST */}
              {activeClassificationTab === 'existing' && (
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={classificationSearchQuery}
                      onChange={(e) => setClassificationSearchQuery(e.target.value)}
                      placeholder="শ্রেণির নাম বা কোড দিয়ে খুঁজুন..."
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                    />
                  </div>

                  {/* List of Classifications */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {(() => {
                      const filtered = classifications.filter(c => 
                        (c.title || '').toLowerCase().includes(classificationSearchQuery.toLowerCase()) ||
                        (c.code || '').toLowerCase().includes(classificationSearchQuery.toLowerCase())
                      );

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <p className="text-xs">কোনো শ্রেণি বিন্যাস পাওয়া যায়নি।</p>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveClassificationTab('new');
                                setClassificationSearchQuery('');
                              }}
                              className="mt-2 text-xs text-[#006A4E] font-bold hover:underline cursor-pointer"
                            >
                              নতুন শ্রেণি বিন্যাস এন্ট্রি করুন →
                            </button>
                          </div>
                        );
                      }

                      return filtered.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedClassificationId(c.id);
                            setClassificationModalOpen(false);
                          }}
                          className={`w-full text-left p-3 rounded-lg border transition flex flex-col text-xs space-y-1 hover:border-[#006A4E] hover:bg-emerald-50/20 cursor-pointer ${
                            selectedClassificationId === c.id
                              ? 'border-[#006A4E] bg-emerald-50/30 font-semibold'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="font-bold text-gray-800 flex items-center gap-1">
                              <Layers size={12} className="text-[#006A4E]" />
                              {c.title}
                            </span>
                            {selectedClassificationId === c.id && (
                              <span className="text-[10px] text-white bg-[#006A4E] px-1.5 py-0.5 rounded font-bold">selected</span>
                            )}
                          </div>
                          <div className="flex justify-between text-gray-500 font-medium text-[11px] pt-1">
                            <span>শ্রেণি কোড: {countToBangla(c.code)}</span>
                            {c.description && <span className="line-clamp-1 max-w-[200px]">{c.description}</span>}
                          </div>
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* TAB 2: CREATE NEW FORM */}
              {activeClassificationTab === 'new' && (
                <form onSubmit={handleAddNewClassification} className="space-y-3 pb-2">
                  
                  {/* Code */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">শ্রেণি কোড (Subject Code) *</label>
                    <input
                      type="text"
                      value={newClassificationCode}
                      onChange={(e) => setNewClassificationCode(e.target.value)}
                      placeholder="যেমন: ১৫"
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                      required
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">শ্রেণির নাম (Subject Name) *</label>
                    <input
                      type="text"
                      value={newClassificationTitle}
                      onChange={(e) => setNewClassificationTitle(e.target.value)}
                      placeholder="যেমন: সভা, অর্থ, সাধারণ"
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">অতিরিক্ত বিবরণ/টিকা (Description)</label>
                    <textarea
                      value={newClassificationDesc}
                      onChange={(e) => setNewClassificationDesc(e.target.value)}
                      placeholder="শ্রেণি বিন্যাসের বিবরণ"
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none font-sans"
                      rows={2}
                    />
                  </div>

                  {/* Keywords */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-gray-700">কীওয়ার্ডসমূহ (Keywords)</label>
                      <span className="text-[10px] text-gray-400">কমা দিয়ে লিখুন</span>
                    </div>
                    <input
                      type="text"
                      value={newClassificationKeywords}
                      onChange={(e) => setNewClassificationKeywords(e.target.value)}
                      placeholder="যেমন: বাজেট, অডিট, নিরীক্ষা, সাধারণ"
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3 flex justify-end gap-2 border-t border-gray-100 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNewClassificationCode('');
                        setNewClassificationTitle('');
                        setNewClassificationDesc('');
                        setNewClassificationKeywords('');
                        setClassificationModalError('');
                        setClassificationModalOpen(false);
                      }}
                      className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      disabled={classificationSubmitting}
                      className="px-4 py-1.5 bg-[#006A4E] text-white hover:bg-opacity-90 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {classificationSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                    </button>
                  </div>

                </form>
              )}

            </div>

            {/* Modal Footer (only show for selection list view) */}
            {activeClassificationTab === 'existing' && (
              <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setClassificationModalOpen(false)}
                  className="px-4 py-2 bg-[#006A4E] hover:bg-opacity-90 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                >
                  সম্পন্ন
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* LETTER ISSUE CONFIRMATION MODAL */}
      {issueConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-xl border border-gray-100 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-[#006A4E]/5">
              <h3 className="text-md font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#006A4E]" />
                সরকারি চিঠি জারিকরণ নিশ্চিত করুন (Issue Letter)
              </h3>
              <button
                type="button"
                onClick={() => setIssueConfirmModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
              
              {/* Alert / Warning */}
              <div className="p-3 bg-amber-50 border border-amber-100 text-amber-850 rounded-lg font-medium leading-relaxed">
                <strong>সতর্কতা:</strong> চিঠি জারি করার পর স্মারক নম্বর স্থায়ীভাবে নিবন্ধিত হবে এবং চিঠির বিবরণ আর কোনোভাবেই সংশোধন করা সম্ভব হবে না।
              </div>

              {/* Last 3 Issued Letters List */}
              <div className="space-y-2">
                <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  সর্বশেষ জারিকৃত ৩টি চিঠি (স্মরণিকা):
                </span>
                {recentIssuedLetters.length === 0 ? (
                  <p className="text-gray-500 italic p-3 bg-gray-50 border border-gray-150 rounded-lg text-center">
                    পূর্বে কোনো চিঠি জারি করা হয়নি।
                  </p>
                ) : (
                  <div className="divide-y divide-gray-100 border border-gray-150 rounded-lg bg-gray-50/50 overflow-hidden">
                    {recentIssuedLetters.map((l, idx) => (
                      <div key={l.id || idx} className="p-3 text-left flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div className="space-y-0.5">
                          <p className="font-bold text-gray-800 line-clamp-1">
                            {idx + 1}. বিষয়: {l.subject || '[শিরোনামহীন]'}
                          </p>
                          <p className="text-gray-500 font-mono text-[11px]">
                            স্মারক নং: {countToBangla(l.memo_no)}
                          </p>
                        </div>
                        <div className="shrink-0 bg-[#006A4E]/10 text-[#006A4E] px-2 py-0.5 rounded-full font-bold text-[10px]">
                          তারিখ: {countToBangla(l.issue_date)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Input fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                
                {/* Serial Number Input */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-700">
                    ক্রমিক নম্বর (Serial No) *
                  </label>
                  <input
                    type="text"
                    value={modalSerialNo}
                    onChange={(e) => setModalSerialNo(e.target.value)}
                    placeholder="উদা: 01 বা 1"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E] font-bold"
                  />
                  <p className="text-[10px] text-gray-500 leading-normal">
                    সর্বশেষ জারিকৃত চিঠির ক্রমানুসারে পরবর্তী ক্রমিক। আপনি চাইলে এটি ম্যানুয়ালি পরিবর্তন করতে পারেন।
                  </p>
                </div>

                {/* Issue Date Input */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-700">
                    জারির তারিখ (Issue Date) *
                  </label>
                  <input
                    type="date"
                    value={modalIssueDate}
                    onChange={(e) => setModalIssueDate(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006A4E] font-bold"
                  />
                  <p className="text-[10px] text-gray-500 leading-normal">
                    চিঠিটি জারির তারিখ নির্বাচন করুন। ডিফল্টরূপে আজকের তারিখ দেওয়া রয়েছে।
                  </p>
                </div>

              </div>

              {/* Live Preview of Memo Number with the input Serial */}
              <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-lg space-y-1">
                <span className="block text-[10px] font-bold text-[#006A4E] uppercase tracking-wider">
                  নির্ধারিত চূড়ান্ত স্মারক নম্বর প্রিভিউ:
                </span>
                <p className="font-mono text-xs font-bold text-gray-800 break-all select-all">
                  {countToBangla(getMemoWithSerial(memoNo, modalSerialNo || '01'))}
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIssueConfirmModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmIssue}
                className="px-5 py-2 bg-[#006A4E] hover:bg-opacity-90 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                <CheckCircle2 size={14} />
                নিশ্চিত করুন ও জারি করুন
              </button>
            </div>

          </div>
        </div>
      )}

      {/* LETTER TYPE SELECTION MODAL */}
      {letterTypeModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] animate-scaleIn">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-emerald-50/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 rounded-lg text-[#006A4E]">
                  <FileCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">
                    সরকারি পত্রের ধরন ও বিবরণ নির্বাচন করুন
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">নিচের তালিকা থেকে আপনার পত্রের নির্দিষ্ট ধরন নির্বাচন করুন</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLetterTypeModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition p-1.5 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {letterTypes.map((t) => {
                  let desc = '';
                  if (t.k === 'standard') desc = 'দাপ্তরিক চিঠি, স্মারক পত্র, আবেদন বা সাধারণ যোগাযোগের জন্য।';
                  else if (t.k === 'office_order') desc = 'প্রতিষ্ঠানের অভ্যন্তরে কর্মকর্তা/কর্মচারীদের নির্দেশ বা দায়িত্ব বণ্টনের জন্য।';
                  else if (t.k === 'notice') desc = 'যেকোনো নোটিশ বা জরুরি বিজ্ঞপ্তি প্রকাশের জন্য।';
                  else if (t.k === 'circular') desc = 'সার্বিক নিয়ম, নির্দেশনা বা গুরুত্বপূর্ণ পরিপত্র জারির জন্য।';
                  else if (t.k === 'invitation') desc = 'দাপ্তরিক ও আনুষ্ঠানিক আমন্ত্রণের জন্য আমন্ত্রণপত্র।';
                  else if (t.k === 'meeting') desc = 'সভার বিজ্ঞপ্তি, এজেন্ডা ও আলোচ্যসূচি প্রেরণের জন্য।';
                  else if (t.k === 'training') desc = 'কর্মশালা, ট্রেনিং কোর্স বা সেমিনারের আমন্ত্রণ ও নোটিশ।';

                  const isSelected = letterType === t.k;

                  return (
                    <div
                      key={t.k}
                      onClick={() => setLetterType(t.k)}
                      className={`p-4 rounded-xl border-2 transition cursor-pointer flex gap-3.5 items-start ${
                        isSelected 
                          ? 'border-[#006A4E] bg-emerald-50/30 ring-1 ring-[#006A4E]/35 shadow-xs' 
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/30'
                      }`}
                    >
                      <div className={`p-2 rounded-lg mt-0.5 ${isSelected ? 'bg-[#006A4E]/10 text-[#006A4E]' : 'bg-gray-100 text-gray-500'}`}>
                        <FileCheck size={16} />
                      </div>
                      <div className="flex-1">
                        <span className={`block text-xs font-bold leading-none ${isSelected ? 'text-[#006A4E]' : 'text-gray-800'}`}>
                          {t.v.split(' (')[0]}
                        </span>
                        <span className="block text-[10px] text-gray-400 font-mono mt-1 leading-none">
                          {t.v.includes('(') ? t.v.substring(t.v.indexOf('(') + 1, t.v.indexOf(')')) : ''}
                        </span>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed mt-2">
                          {desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2.5 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setLetterTypeModalOpen(false)}
                className="px-4.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer transition shadow-2xs"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                onClick={() => setLetterTypeModalOpen(false)}
                className="px-5.5 py-2 bg-[#006A4E] hover:bg-opacity-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                <CheckCircle2 size={14} />
                নিশ্চিত করুন (Select)
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
