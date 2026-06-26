import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Office, 
  UserProfile, 
  SubjectClassification, 
  NothiFile, 
  Recipient, 
  Letter, 
  AuditLog,
  Officer,
  CopyPreset
} from '../types';

// ==========================================
// AUDIT LOG SERVICE
// ==========================================
export async function logAuditAction(
  officeId: string, 
  userId: string, 
  userName: string,
  action: string, 
  entityType: string, 
  entityId: string,
  details?: string
) {
  try {
    const logsRef = collection(db, 'audit_logs');
    const newLog: Omit<AuditLog, 'id'> = {
      office_id: officeId,
      user_id: userId,
      user_name: userName,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      timestamp: new Date().toISOString()
    };
    await addDoc(logsRef, newLog);
  } catch (error) {
    console.error("Error logging audit action:", error);
  }
}

// ==========================================
// OFFICE SERVICE
// ==========================================
export async function getOffice(officeId: string): Promise<Office | null> {
  try {
    const docRef = doc(db, 'offices', officeId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Office;
      // Cache it
      localStorage.setItem(`office_${officeId}`, JSON.stringify(data));
      return data;
    }
    return null;
  } catch (error) {
    console.warn(`getOffice offline fallback for ${officeId}:`, error);
    const cached = localStorage.getItem(`office_${officeId}`);
    if (cached) {
      try {
        return JSON.parse(cached) as Office;
      } catch (e) {
        // ignore
      }
    }
    return null;
  }
}

export async function createOrGetOffice(officeId: string, defaultData: Partial<Office>): Promise<Office> {
  const existing = await getOffice(officeId);
  if (existing) return existing;

  const newOffice: Office = {
    id: officeId,
    office_name: defaultData.office_name || 'উপজেলা উপানুষ্ঠানিক শিক্ষা কর্মকর্তার কার্যালয়',
    office_code: defaultData.office_code || '০৩',
    geo_code: defaultData.geo_code || '৬১২৪',
    address: defaultData.address || 'হালুয়াঘাট, ময়মনসিংহ',
    email: defaultData.email || 'unfeohaluaghat@gmail.com',
    phone: defaultData.phone || '',
    website: defaultData.website || '',
    logo: defaultData.logo || '',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Cache locally
  localStorage.setItem(`office_${officeId}`, JSON.stringify(newOffice));

  try {
    await setDoc(doc(db, 'offices', officeId), newOffice);
    // Seed default classifications for a new office
    await seedDefaultSubjectClassifications(officeId);
  } catch (error) {
    console.warn(`Failed to set office on server, operating offline:`, error);
  }
  
  return newOffice;
}

export async function updateOffice(officeId: string, data: Partial<Office>): Promise<void> {
  const cleanData = cleanFirestorePayload(data);
  const cached = localStorage.getItem(`office_${officeId}`);
  if (cached) {
    try {
      const officeObj = JSON.parse(cached) as Office;
      const updated = { ...officeObj, ...cleanData, updated_at: new Date().toISOString() };
      localStorage.setItem(`office_${officeId}`, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  }

  try {
    const docRef = doc(db, 'offices', officeId);
    await updateDoc(docRef, {
      ...cleanData,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Failed to update office on server:`, error);
    throw error;
  }
}

// ==========================================
// USER PROFILE SERVICE
// ==========================================
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, 'users', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      // Cache it
      localStorage.setItem(`user_profile_${userId}`, JSON.stringify(data));
      return data;
    }
    return null;
  } catch (error) {
    console.warn(`getUserProfile offline fallback for ${userId}:`, error);
    const cached = localStorage.getItem(`user_profile_${userId}`);
    if (cached) {
      try {
        return JSON.parse(cached) as UserProfile;
      } catch (e) {
        // ignore
      }
    }
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const cleanData = cleanFirestorePayload(profile);
  const updatedProfile = {
    ...cleanData,
    updated_at: new Date().toISOString()
  };

  // Cache locally
  localStorage.setItem(`user_profile_${profile.id}`, JSON.stringify(updatedProfile));

  try {
    const docRef = doc(db, 'users', profile.id);
    await setDoc(docRef, updatedProfile);
  } catch (error) {
    console.error(`Failed to save user profile on server:`, error);
    throw error;
  }
}

// ==========================================
// SUBJECT CLASSIFICATIONS
// ==========================================
export async function getSubjectClassifications(officeId: string): Promise<SubjectClassification[]> {
  const classificationsRef = collection(db, 'subject_classifications');
  const q = query(
    classificationsRef, 
    where('office_id', '==', officeId),
    where('active', '==', true)
  );
  
  const snap = await getDocs(q);
  const list: SubjectClassification[] = [];
  snap.forEach((d) => {
    list.push({ id: d.id, ...d.data() } as SubjectClassification);
  });
  return list.sort((a, b) => a.code.localeCompare(b.code));
}

export async function saveSubjectClassification(classification: Omit<SubjectClassification, 'id'> & { id?: string }): Promise<string> {
  const cleaned: any = {};
  Object.keys(classification).forEach((key) => {
    const val = (classification as any)[key];
    if (val !== undefined) {
      cleaned[key] = val;
    }
  });

  if (classification.id) {
    const docRef = doc(db, 'subject_classifications', classification.id);
    await setDoc(docRef, cleaned, { merge: true });
    return classification.id;
  } else {
    const classificationsRef = collection(db, 'subject_classifications');
    const docRef = await addDoc(classificationsRef, cleaned);
    return docRef.id;
  }
}

async function seedDefaultSubjectClassifications(officeId: string) {
  const defaults = [
    { code: '০১', title: 'অডিট', description: 'অডিট সংক্রান্ত নিরীক্ষা ও আপত্তি', keywords: ['অডিট', 'নিরীক্ষা', 'আপত্তি', 'audit'] },
    { code: '০৬', title: 'কমিটি গঠন/সভা/কার্যবিবরণী', description: 'কমিটি গঠন, সভা ও কার্যবিবরণী সংক্রান্ত', keywords: ['কমিটি', 'সভা', 'কার্যবিবরণী', 'রেজুলেশন', 'meeting', 'committee'] },
    { code: '০৭', title: 'ক্রয় প্রক্রিয়াকরণ', description: 'ক্রয় প্রক্রিয়া করণ', keywords: ['ক্রয়', 'দরপত্র', 'টেন্ডার', 'procurement', 'tender', 'purchase'] },
    { code: '০৮', title: 'ছুটি সংক্রান্ত', description: 'ছুটি সংক্রান্ত আবেদন ও অনুমোদন', keywords: ['ছুটি', 'নৈমিত্তিক', 'অর্জিত', 'leave', 'casual'] },
    { code: '১০', title: 'টেলিফোন সংযোগ', description: 'টেলিফোন ও ইন্টারনেট সংযোগ সংক্রান্ত', keywords: ['টেলিফোন', 'ইন্টারনেট', 'ব্রডব্যান্ড', 'সংযোগ', 'telephone', 'internet'] },
    { code: '১১', title: 'নিয়োগ সংক্রান্ত', description: 'নিয়োগ ও নিয়োগ বিধি সংক্রান্ত', keywords: ['নিয়োগ', 'নিয়োগ বিজ্ঞপ্তি', 'বিজ্ঞপ্তি', 'recruitment', 'appoint'] },
    { code: '১২', title: 'পদোন্নতি', description: 'পদোন্নতি সংক্রান্ত নথি', keywords: ['পদোন্নতি', 'promotion', 'গ্রেড'] },
    { code: '১৩', title: 'পেনশন', description: 'পেনশন সংক্রান্ত নথি', keywords: ['পেনশন', 'অবসর', 'pension', 'lpr'] },
    { code: '১৪', title: 'প্রকল্প বাস্তবায়ন', description: 'প্রকল্প বাস্তবায়ন ও অগ্রগতি', keywords: ['প্রকল্প', 'বাস্তবায়ন', 'অগ্রগতি', 'project', 'dpp'] },
    { code: '১৬', title: 'প্রতিবেদন প্রেরণ/সংরক্ষণ', description: 'প্রতিবেদন প্রেরণ/সংরক্ষণ সংক্রান্ত', keywords: ['প্রতিবেদন', 'রিপোর্ট', 'সংরক্ষণ', 'report'] },
    { code: '১৮', title: 'প্রশাসনিক অফিস আদেশ', description: 'প্রশাসনিক অফিস আদেশ ও নির্দেশিকা', keywords: ['অফিস আদেশ', 'প্রশাসনিক', 'অফিস', 'আদেশ', 'order'] },
    { code: '২০', title: 'বাজেট বরাদ্দ সংক্রান্ত', description: 'বাজেট বরাদ্দ সংক্রান্ত নথি', keywords: ['বাজেট', 'বরাদ্দ', 'অর্থ', 'অনুমোদন', 'budget', 'allocation'] },
    { code: '২১', title: 'বার্ষিক গোপনীয় প্রতিবেদন', description: 'বার্ষিক গোপনীয় প্রতিবেদন (ACR)', keywords: ['বার্ষিক গোপনীয় প্রতিবেদন', 'গোপনীয়', 'এসিআর', 'acr', 'annual confidential report'] },
    { code: '২৩', title: 'বিভিন্ন দিবস উদযাপন', description: 'বিভিন্ন জাতীয় ও আন্তর্জাতিক দিবস উদযাপন', keywords: ['দিবস', 'উদযাপন', 'বিজয় দিবস', 'স্বাধীনতা দিবস', '২১শে ফেব্রুয়ারি', 'day'] },
    { code: '২৫', title: 'ভ্রমন/প্রशिक्ণ', description: 'ভ্রমন/প্রশিক্ষণ সংক্রান্ত নথি', keywords: ['ভ্রমণ', 'ভ্রমণ আদেশ', 'প্রশিক্ষণ', 'tour', 'training'] },
    { code: '২৬', title: 'যানবাহন/ক্রয়/জ্বালানী', description: 'যানবাহন, ক্রয় ও জ্বালানী সংক্রান্ত', keywords: ['যানবাহন', 'জ্বালানী', 'গাড়ি', 'পেট্রোল', 'অকটেন', 'ডিজেল', 'fuel', 'vehicle'] },
    { code: '২৭', title: 'তদন্ত/অভিযোগ', description: 'তদন্ত/অভিযোগ সংক্রান্ত নথি', keywords: ['তদন্ত', 'অভিযোগ', 'শাস্তি', 'বিভাগীয় মামলা', 'investigation', 'complaint'] },
    { code: '২৯', title: 'সেমিনার / ওয়ার্কশপ', description: 'সেমিনার ও ওয়ার্কশপ সংক্রান্ত', keywords: ['সেমিনার', 'ওয়ার্কশপ', 'আলোচনা সভা', 'seminar', 'workshop'] },
    { code: '৩১ হতে ৯৮ পর্যন্ত', title: 'অন্যান্য নথি', description: 'অন্যান্য অনির্ধারিত নথি সমূহ', keywords: ['অন্যান্য', 'অন্য', 'অন্যান্য নথি', 'others'] },
    { code: '৯৯', title: 'বিবিধ', description: 'বিবিধ তথ্য ও নথি', keywords: ['বিবিধ', 'misc', 'miscellaneous'] }
  ];

  for (const item of defaults) {
    await saveSubjectClassification({
      office_id: officeId,
      code: item.code,
      title: item.title,
      description: item.description,
      keywords: (item as any).keywords || [],
      active: true,
    });
  }
}

export async function deleteSubjectClassification(id: string): Promise<void> {
  const docRef = doc(db, 'subject_classifications', id);
  await deleteDoc(docRef);
}

export async function clearAndReSeedSubjectClassifications(officeId: string): Promise<void> {
  const classificationsRef = collection(db, 'subject_classifications');
  const q = query(
    classificationsRef, 
    where('office_id', '==', officeId)
  );
  const snap = await getDocs(q);
  for (const docSnap of snap.docs) {
    await deleteDoc(doc(db, 'subject_classifications', docSnap.id));
  }
  await seedDefaultSubjectClassifications(officeId);
}

// ==========================================
// FILES (নথি) SERVICE
// ==========================================
export async function getFiles(officeId: string): Promise<NothiFile[]> {
  const filesRef = collection(db, 'files');
  const q = query(
    filesRef, 
    where('office_id', '==', officeId),
    where('active', '==', true)
  );
  const snap = await getDocs(q);
  const list: NothiFile[] = [];
  snap.forEach((d) => {
    list.push({ id: d.id, ...d.data() } as NothiFile);
  });
  return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function saveFile(file: Omit<NothiFile, 'id' | 'created_at'> & { id?: string; created_at?: string }): Promise<string> {
  const cleanData: any = {};
  Object.keys(file).forEach(key => {
    const val = (file as any)[key];
    if (val !== undefined) {
      cleanData[key] = val;
    }
  });

  const { id, ...dataWithoutId } = cleanData;

  if (id) {
    const docRef = doc(db, 'files', id);
    await setDoc(docRef, dataWithoutId, { merge: true });
    return id;
  } else {
    const filesRef = collection(db, 'files');
    const docRef = await addDoc(filesRef, {
      ...dataWithoutId,
      created_at: new Date().toISOString()
    });
    return docRef.id;
  }
}

// ==========================================
// RECIPIENTS SERVICE
// ==========================================
export async function getRecipients(officeId: string): Promise<Recipient[]> {
  const recipientsRef = collection(db, 'recipients');
  const q = query(
    recipientsRef, 
    where('office_id', '==', officeId)
  );
  const snap = await getDocs(q);
  const list: Recipient[] = [];
  snap.forEach((d) => {
    list.push({ id: d.id, ...d.data() } as Recipient);
  });
  return list;
}

// Helper to deep clean payload from undefined properties to prevent firestore serialization errors
function cleanFirestorePayload<T>(obj: T): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanFirestorePayload(item));
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
      const val = (obj as any)[key];
      if (val !== undefined) {
        cleaned[key] = cleanFirestorePayload(val);
      }
    });
    return cleaned;
  }
  return obj;
}

export async function saveRecipient(recipient: Omit<Recipient, 'id'> & { id?: string }): Promise<string> {
  const cleanData = cleanFirestorePayload(recipient);
  const { id, ...dataWithoutId } = cleanData;

  if (id) {
    const docRef = doc(db, 'recipients', id);
    await setDoc(docRef, dataWithoutId, { merge: true });
    return id;
  } else {
    const recipientsRef = collection(db, 'recipients');
    const docRef = await addDoc(recipientsRef, dataWithoutId);
    return docRef.id;
  }
}

export async function saveOfficer(officer: Omit<Officer, 'id'> & { id?: string }): Promise<string> {
  const cleanData = cleanFirestorePayload(officer);
  const { id, ...dataWithoutId } = cleanData;

  if (id) {
    const docRef = doc(db, 'officers', id);
    await setDoc(docRef, {
      ...dataWithoutId,
      updated_at: new Date().toISOString()
    }, { merge: true });
    return id;
  } else {
    const officersRef = collection(db, 'officers');
    const docRef = await addDoc(officersRef, {
      ...dataWithoutId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    return docRef.id;
  }
}

export async function deleteOfficer(id: string): Promise<void> {
  const docRef = doc(db, 'officers', id);
  await deleteDoc(docRef);
}

// ==========================================
// LETTERS SERVICE
// ==========================================
export async function getLetters(officeId: string): Promise<Letter[]> {
  const lettersRef = collection(db, 'letters');
  const q = query(
    lettersRef, 
    where('office_id', '==', officeId)
  );
  const snap = await getDocs(q);
  const list: Letter[] = [];
  snap.forEach((d) => {
    list.push({ id: d.id, ...d.data() } as Letter);
  });
  return list.sort((a, b) => {
    const timeA = a.updated_at || '';
    const timeB = b.updated_at || '';
    return timeB.localeCompare(timeA);
  });
}

export async function getLetter(letterId: string): Promise<Letter | null> {
  const docRef = doc(db, 'letters', letterId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as Letter;
  }
  return null;
}

export async function saveLetter(letter: Omit<Letter, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }): Promise<string> {
  const now = new Date().toISOString();
  const cleanData = cleanFirestorePayload(letter);
  const { id, ...dataWithoutId } = cleanData;

  if (id) {
    const docRef = doc(db, 'letters', id);
    await setDoc(docRef, {
      ...dataWithoutId,
      updated_at: now
    }, { merge: true });
    return id;
  } else {
    const lettersRef = collection(db, 'letters');
    const docAdded = await addDoc(lettersRef, {
      ...dataWithoutId,
      created_at: now,
      updated_at: now
    });
    return docAdded.id;
  }
}

export async function deleteLetter(letterId: string): Promise<void> {
  const docRef = doc(db, 'letters', letterId);
  await deleteDoc(docRef);
}

// ==========================================
// AUDIT LOG LIST SERVICE
// ==========================================
export async function getAuditLogs(officeId: string): Promise<AuditLog[]> {
  const logsRef = collection(db, 'audit_logs');
  const q = query(
    logsRef,
    where('office_id', '==', officeId)
  );
  try {
    const snap = await getDocs(q);
    const list: AuditLog[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as AuditLog);
    });
    // Sort in-memory descending by timestamp
    list.sort((a, b) => {
      const timeA = a.timestamp || '';
      const timeB = b.timestamp || '';
      return timeB.localeCompare(timeA);
    });
    return list.slice(0, 150);
  } catch (error) {
    console.error("Error inside getAuditLogs:", error);
    throw error;
  }
}

// ==========================================
// COPY PRESETS (অনুলিপি) SERVICE
// ==========================================
export async function getCopyPresets(officeId: string): Promise<CopyPreset[]> {
  const presetsRef = collection(db, 'copy_presets');
  const q = query(
    presetsRef, 
    where('office_id', '==', officeId)
  );
  try {
    const snap = await getDocs(q);
    const list: CopyPreset[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as CopyPreset);
    });
    return list;
  } catch (error) {
    console.error("Error in getCopyPresets:", error);
    return [];
  }
}

export async function saveCopyPreset(preset: Omit<CopyPreset, 'id'> & { id?: string }): Promise<string> {
  const cleanData = cleanFirestorePayload(preset);
  const { id, ...dataWithoutId } = cleanData;

  if (id) {
    const docRef = doc(db, 'copy_presets', id);
    await setDoc(docRef, dataWithoutId, { merge: true });
    return id;
  } else {
    const presetsRef = collection(db, 'copy_presets');
    const docRef = await addDoc(presetsRef, dataWithoutId);
    return docRef.id;
  }
}

export async function deleteCopyPreset(id: string): Promise<void> {
  const docRef = doc(db, 'copy_presets', id);
  await deleteDoc(docRef);
}
