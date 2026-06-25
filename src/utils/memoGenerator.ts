import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { NothiFile, SubjectClassification, Office } from '../types';
import { padLeft } from './banglaHelpers';

interface MemoParams {
  office: Office;
  classification?: SubjectClassification;
  file: NothiFile;
  customMinistryCode?: string; // default "08"
  customOfficeCode?: string;   // default "03"
  customInstitutionCode?: string; // default "000"
  customBranchCode?: string;      // default "000"
}

/**
 * Letter Memo Number Generator Service
 * Format: 08.03.6124.000.000.XX.XXXX.XX.XXXX
 */
export async function generateNextMemoNumber(params: MemoParams): Promise<{
  memo_no: string;
  serial_no: string;
  nextIncrement: number;
}> {
  const {
    office,
    classification,
    file,
    customMinistryCode = office.ministry_code || '08',
    customOfficeCode = office.office_code || '03',
    customInstitutionCode = '000',
    customBranchCode = '000',
  } = params;
  
  // Step 1: Query firestore to find the latest letter issued under this specific file_id
  const lettersRef = collection(db, 'letters');
  const q = query(
    lettersRef,
    where('office_id', '==', office.id),
    where('file_id', '==', file.id)
  );
  
  let nextIncrement = 1;
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const docs = snapshot.docs.map(d => d.data()).filter(d => d.status === 'issued' && d.serial_no);
    if (docs.length > 0) {
      docs.sort((a, b) => {
        const serialA = parseInt(a.serial_no || '0', 10);
        const serialB = parseInt(b.serial_no || '0', 10);
        return serialB - serialA;
      });
      const latestLetter = docs[0];
      const latestSerial = parseInt(latestLetter.serial_no || '0', 10);
      if (!isNaN(latestSerial)) {
        nextIncrement = latestSerial + 1;
      }
    }
  }
  
  // Format variables
  const ministry = padLeft(customMinistryCode, 2);
  const officeCode = padLeft(customOfficeCode, 2);
  const geoCode = padLeft(office.geo_code || '6124', 4);
  const instCode = padLeft(customInstitutionCode, 3);
  const branchCode = padLeft(customBranchCode, 3);
  const classCode = padLeft(classification?.code || '00', 2);
  const fileCode = padLeft(file.file_code || '0000', 4);
  
  // Extract two-digit year, e.g. "2026" -> "26" or "26" -> "26"
  let openingYear = file.opening_year || '26';
  if (openingYear.length > 2) {
    openingYear = openingYear.slice(-2);
  }
  openingYear = padLeft(openingYear, 2);
  
  const serialNoStr = padLeft(nextIncrement, 2);
  
  // Memo combination
  const memoNo = `${ministry}.${officeCode}.${geoCode}.${instCode}.${branchCode}.${classCode}.${fileCode}.${openingYear}-${serialNoStr}`;
  
  return {
    memo_no: memoNo,
    serial_no: serialNoStr,
    nextIncrement,
  };
}
