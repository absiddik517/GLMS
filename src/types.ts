/**
 * Types and interfaces for the Government Letter Management System (GLMS)
 */

export interface Office {
  id: string;
  office_name: string;
  office_code: string;
  geo_code: string; // e.g. 6124
  address: string;
  email: string;
  phone?: string;
  website?: string;
  logo?: string;
  ministry_code?: string; // মন্ত্রণালয় কোড
  org_name_line3?: string; // প্রতিষ্ঠানের নাম (পেডে লাইন ৩)
  org_address_line4?: string; // প্রতিষ্ঠানের ঠিকানা (পেডে লাইন ৪)
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string; // Matches Firebase Auth UID
  office_id: string;
  name: string;
  designation: string;
  email: string;
  mobile?: string;
  signature_image?: string; // Base64 or URL
  seal_image?: string; // Base64 or URL
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubjectClassification {
  id: string;
  office_id: string;
  code: string; // e.g. "15"
  title: string; // e.g. "প্রশাসন", "অর্থ", "প্রশিক্ষণ"
  description?: string;
  active: boolean;
}

export interface NothiFile {
  id: string;
  office_id: string;
  file_title: string; // e.g. "প্রশিক্ষণ সংক্রান্ত নথি"
  file_code: string; // e.g. "105" (File serial number in subject classification, e.g. "0125")
  opening_year: string; // e.g. "26" (last two digits, represent 2026)
  subject_classification_id?: string;
  description?: string;
  active: boolean;
  created_at: string;
}

export interface Officer {
  id: string;
  office_id: string;
  name: string;
  designation: string;
  phone?: string;
  email?: string;
  active: boolean;
  signature_image?: string;
  seal_image?: string;
  created_at: string;
  updated_at: string;
}

export interface Recipient {
  id: string;
  office_id: string;
  recipient_name?: string;
  designation?: string;
  organization?: string;
  address: string;
  email?: string;
  mobile?: string;
  show_name?: boolean;
  show_designation?: boolean;
  show_organization?: boolean;
  show_address?: boolean;
}

export type LetterType = 
  | 'standard'        // সাধারণ পত্র
  | 'office_order'     // অফিস আদেশ
  | 'notice'           // নোটিশ
  | 'circular'         // পরিপত্র
  | 'invitation'       // আমন্ত্রণপত্র
  | 'meeting'          // সভার নোটিশ
  | 'training';        // প্রশিক্ষণ নোটিশ

export type LetterStatus = 'draft' | 'issued' | 'archived';

export interface RecipientDisplayOptions {
  show_name?: boolean;
  show_designation?: boolean;
  show_organization?: boolean;
  show_address?: boolean;
}

export interface Letter {
  id: string;
  office_id: string;
  file_id: string; // Link to File
  recipient_id?: string; // Link to Recipient (optional for office order, notice)
  sender_user_id: string; // Link to User
  signatory_officer_id?: string; // Link to selective Officer/Signatory
  subject: string; // Optional or hidden for office_order
  body: string; // HTML content
  letter_type: LetterType;
  memo_no: string; // Generated memo number
  serial_no: string; // Sequential serial number, e.g. "0007"
  issue_date: string; // YYYY-MM-DD
  status: LetterStatus;
  notes?: string;
  created_by: string; // user ID
  created_at: string;
  updated_at: string;
  copy_recipients?: CopyRecipient[];
  recipient_display_options?: RecipientDisplayOptions;
}

export interface CopyRecipient {
  id: string;
  recipient_name: string;
  designation?: string;
  organization?: string;
  address?: string;
}

export interface CopyPreset {
  id: string;
  office_id: string;
  recipient_name: string;
  designation?: string;
  organization?: string;
}

export interface AuditLog {
  id: string;
  office_id: string;
  user_id: string;
  user_name: string;
  action: string; // "create" | "update" | "delete" | "archive" | "restore" | "print" | "export"
  entity_type: string; // "letter" | "file" | "classification" | "recipient" | "settings"
  entity_id: string;
  details?: string;
  timestamp: string;
}
