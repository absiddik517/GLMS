import React, { useRef, useState } from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Archive, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Sparkles,
  Layers,
  FileCheck,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
  Maximize2,
  Minimize2,
  X,
  Copy
} from 'lucide-react';
import { Letter, UserProfile, Office, NothiFile, Recipient, Officer } from '../types';
import PrintLetter from './PrintLetter';
import { countToBangla } from '../utils/banglaHelpers';
import { downloadDOCX } from '../utils/docxGenerator';

interface LetterDetailViewProps {
  letter: Letter;
  profile: UserProfile;
  office: Office;
  files: NothiFile[];
  recipients: Recipient[];
  officers: Officer[];
  onBack: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onLogPrint: () => void;
  onClone?: () => void;
}

export default function LetterDetailView({
  letter,
  profile,
  office,
  files = [],
  recipients = [],
  officers = [],
  onBack,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  onLogPrint,
  onClone
}: LetterDetailViewProps) {
  
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Directly generate and download the PDF
  const handleDownloadPDF = async () => {
    // Log PDF download activity as an export/print log event
    onLogPrint();
    setIsDownloading(true);

    // Lists to back up and restore styles
    const styleElements = Array.from(document.querySelectorAll('style'));
    const originalStyleContentsByElement = new Map<HTMLStyleElement, string>();
    const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
    const originalLinkDisabledByElement = new Map<HTMLLinkElement, boolean>();
    const injectedStyleElements: HTMLStyleElement[] = [];

    try {
      // 1. Pre-process inline <style> tags to replace any oklch() color definitions
      styleElements.forEach(el => {
        if (el.textContent) {
          originalStyleContentsByElement.set(el, el.textContent);
          if (el.textContent.includes('oklch')) {
            el.textContent = el.textContent.replace(/oklch\([^)]+\)/g, '#000000');
          }
        }
      });

      // 2. Pre-process external <link> stylesheets (e.g. production bundled tailwind css)
      for (const link of linkElements) {
        originalLinkDisabledByElement.set(link, link.disabled);
        try {
          const response = await fetch(link.href);
          if (response.ok) {
            let cssText = await response.text();
            if (cssText.includes('oklch')) {
              // Convert any oklch color reference to black/dark colors to satisfy html2canvas parser
              cssText = cssText.replace(/oklch\([^)]+\)/g, '#000000');
              
              const tempStyle = document.createElement('style');
              tempStyle.textContent = cssText;
              document.head.appendChild(tempStyle);
              injectedStyleElements.push(tempStyle);
              
              link.disabled = true;
            }
          }
        } catch (err) {
          console.warn('Could not process link stylesheet:', link.href, err);
        }
      }

      // Lazy load html2canvas and jspdf to avoid bloated initial bundle size
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const printContent = document.getElementById('govt-letter-print-area');
      if (!printContent) {
        alert('পত্রের প্রিন্ট এরিয়া খুঁজে পাওয়া যায়নি।');
        setIsDownloading(false);
        return;
      }

      // Capture element with html2canvas (DPI 3x for pristine vectorized-looking Bangla conjuncts rendering)
      const canvas = await html2canvas(printContent, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800,
        onclone: (clonedDoc) => {
          const element = clonedDoc.getElementById('govt-letter-print-area');
          if (element) {
            element.style.boxShadow = 'none';
            element.style.border = 'none';
            element.style.padding = '0px'; // Clear padding here as we apply margin on PDF coordinate layout to avoid double-padding
            element.style.margin = '0px';
            element.style.width = '750px';

            // Set background to pure white and default base styles
            element.style.backgroundColor = '#ffffff';
            element.style.color = '#000000';
            element.style.setProperty('font-size', '8pt', 'important');

            // Force all child text elements to black and set font-size to 8pt to comply with office styles
            const clonedChildren = element.querySelectorAll('*');
            clonedChildren.forEach((childEl: any) => {
              // Strip and replace any inline style colors carrying oklch
              const inlineStyle = childEl.getAttribute('style');
              if (inlineStyle) {
                let cleanStyle = inlineStyle;
                if (cleanStyle.includes('oklch')) {
                  cleanStyle = cleanStyle.replace(/oklch\([^)]+\)/g, '#000000');
                }
                childEl.setAttribute('style', cleanStyle);
              }
              childEl.style.setProperty('color', '#000000', 'important');
              childEl.style.setProperty('text-shadow', 'none', 'important');

              const tagName = childEl.tagName.toLowerCase();
              if (['p', 'span', 'li', 'td', 'th', 'a', 'h1', 'h2', 'h3', 'h4', 'div', 'ol', 'ul'].includes(tagName)) {
                childEl.style.setProperty('font-size', '8pt', 'important');
              }

              // Apply clean high contrast borders for tables or list structures
              if (childEl.style.borderColor || window.getComputedStyle(childEl).borderWidth !== '0px') {
                childEl.style.setProperty('border-color', '#222222', 'important');
              }
            });
          }
        }
      });

      // Standard A4 dimensions in mm: 210 x 297
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const marginX = 20; // 20mm left & right margin (Medium scale margin)
      const marginY = 20; // 20mm top & bottom margin
      const printableWidth = 210 - (marginX * 2); // 170mm printable width
      const printableHeight = 297 - (marginY * 2); // 257mm printable height
      
      // Calculate scaling from high-res canvas pixels to PDF space
      const scale = printableWidth / canvas.width;
      const pagePixelHeight = printableHeight / scale;

      let currentY = 0;
      let pageIndex = 0;

      while (currentY < canvas.height) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        const sliceHeight = Math.min(pagePixelHeight, canvas.height - currentY);

        // Create an offscreen canvas to hold only this page's slice
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;

        const sliceCtx = sliceCanvas.getContext('2d');
        if (sliceCtx) {
          // Fill white background for the slice canvas
          sliceCtx.fillStyle = '#ffffff';
          sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          
          // Draw the current window/slice from the master canvas
          sliceCtx.drawImage(
            canvas,
            0, currentY, canvas.width, sliceHeight, // source coordinate window
            0, 0, canvas.width, sliceHeight         // destination coordinate window
          );
        }

        const sliceImgData = sliceCanvas.toDataURL('image/png');
        const renderHeightMm = sliceHeight * scale;

        // Add sliced page to the PDF with active medium-scale margins
        pdf.addImage(sliceImgData, 'PNG', marginX, marginY, printableWidth, renderHeightMm, undefined, 'FAST');

        currentY += sliceHeight;
        pageIndex++;
      }

      const banglaMemoNo = letter.memo_no || 'Document';
      const cleanFileName = `Govt_Letter_${banglaMemoNo.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
      
      pdf.save(cleanFileName);
    } catch (err) {
      console.error('PDF Download Error:', err);
      alert('সরাসরি পিডিএফ ডাউনলোডে সমস্যা হয়েছে। অনুগ্রহ করে "প্রিন্ট" বাটন ব্যবহার করে "Save as PDF" অপশন সিলেক্ট করুন।');
    } finally {
      // 3. Restore all original styles and remove temporary elements
      originalStyleContentsByElement.forEach((originalContent, el) => {
        el.textContent = originalContent;
      });
      originalLinkDisabledByElement.forEach((disabled, link) => {
        link.disabled = disabled;
      });
      injectedStyleElements.forEach(el => el.remove());

      setIsDownloading(false);
    }
  };

  // Directly generate and download the Word Document (DOCX)
  const handleDownloadDOCX = async () => {
    // Log DOCX download activity as an export/print log event
    onLogPrint();
    setIsDownloadingDocx(true);
    try {
      const rec = recipients.find(r => r.id === letter.recipient_id);
      await downloadDOCX({
        letter,
        profile,
        office,
        recipient: rec,
        officers
      });
    } catch (err) {
      console.error('DOCX Download Error:', err);
      alert('সরাসরি ডকএক্স ডাউনলোডে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  const getRecipientName = () => {
    if (!letter.recipient_id) return '-';
    const rec = recipients.find(r => r.id === letter.recipient_id);
    return rec ? `${rec.recipient_name} (${rec.designation || ''})` : '';
  };

  const getFileName = () => {
    const f = files.find(file => file.id === letter.file_id);
    return f ? `${f.file_title} (${f.file_code})` : '-';
  };

  // Browser Print trigger (Universal, beautiful Bangla font rendering matching and embedded in A4 layout)
  const handlePrint = () => {
    // Audit log
    onLogPrint();

    const printContent = document.getElementById('govt-letter-print-area');
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    
    // Simple, reliable window.print override
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${letter.subject || 'সরকারি পত্র'}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;700&display=swap');
              @media print {
                @page {
                  size: A4;
                  margin: 20mm;
                }
                body {
                  margin: 0;
                  padding: 0;
                  background: white;
                  font-family: 'Noto Sans Bengali', Arial, sans-serif;
                  -webkit-print-color-adjust: exact;
                }
                .page-break {
                  page-break-after: always;
                  display: none !important; /* Hide the visual pagination dotted line in paper layout */
                }
                /* Hide any non-print elements */
                .no-print {
                  display: none !important;
                }
              }
              body {
                font-family: 'Noto Sans Bengali', Arial, sans-serif;
                padding: 40px;
                background: white;
                color: #111;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
              }
              th, td {
                border: 1px solid #777;
                padding: 8px;
                text-align: left;
                font-size: 13px;
              }
              th {
                background-color: #f3f4f6;
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ACTION HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-lg border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition cursor-pointer"
            title="তালিকায় ফেরত যান"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">পত্রের বিবরণী ও লেটারহেড প্রাকদর্শন</h1>
            <p className="text-sm text-gray-500 mt-1">
              {letter.status === 'issued' ? 'জারিকৃত সরকারি পত্র' : letter.status === 'archived' ? 'আর্কাইভকৃত পত্র' : 'খসড়া সংরক্ষণ (Draft)'}
            </p>
          </div>
        </div>

        {/* Action button controls */}
        <div className="flex flex-wrap gap-2">
          {/* Print button works beautifully */}
          <button
            onClick={handlePrint}
            className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer size={14} />
            প্রিন্ট করুন
          </button>

          {/* Direct PDF Download button */}
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              isDownloading 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-[#006A4E] hover:bg-opacity-95 text-white'
            }`}
          >
            <Download size={14} className={isDownloading ? 'animate-bounce' : ''} />
            {isDownloading ? 'পিডিএফ তৈরি হচ্ছে...' : 'পিডিএফ ডাউনলোড'}
          </button>

          {/* Direct DOCX Download button */}
          <button
            onClick={handleDownloadDOCX}
            disabled={isDownloadingDocx}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              isDownloadingDocx 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-[#185ABD] hover:bg-opacity-95 text-white'
            }`}
          >
            <Download size={14} className={isDownloadingDocx ? 'animate-bounce' : ''} />
            {isDownloadingDocx ? 'ডকএক্স তৈরি হচ্ছে...' : 'ডকএক্স ডাউনলোড'}
          </button>

          {/* Full Screen option */}
          <button
            onClick={() => setIsFullScreen(true)}
            className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <Maximize2 size={14} />
            ফুল স্ক্রিন
          </button>

          {/* Clone/Copy option */}
          {onClone && (
            <button
              onClick={onClone}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="এই চিঠিটি কপি করে নতুন খসড়া তৈরি করুন"
            >
              <Copy size={14} />
              চিঠি ক্লোন (কপি) করুন
            </button>
          )}

          {/* Conditional Controls */}
          {letter.status === 'draft' ? (
            <>
              <button
                onClick={onEdit}
                className="bg-indigo-55 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Edit size={14} />
                চিঠি সংশোধন করুন
              </button>
              <button
                onClick={onDelete}
                className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 size={14} />
                ড্রাফট মুছুন
              </button>
            </>
          ) : letter.status === 'issued' ? (
            <button
              onClick={onArchive}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer text-gray-800 border"
            >
              <Archive size={14} />
              পত্র আর্কাইভ করুন
            </button>
          ) : (
            <button
              onClick={onRestore}
              className="bg-blue-600 hover:bg-blue-750 hover:bg-opacity-90 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw size={14} />
              পুনরুদ্ধার করুন
            </button>
          )}
        </div>
      </div>

      {/* METADATA GENERAL DETAILS */}
      <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-xs space-y-4 text-xs font-sans">
        <div className="border-b border-gray-50 pb-3">
          <span className="block text-gray-400 font-semibold uppercase mb-1">স্মারক নম্বর:</span>
          <span className="font-mono text-gray-800 text-sm font-bold select-all leading-relaxed">
            {countToBangla(letter.memo_no) || <span className="text-gray-400 font-normal italic">খসড়া পর্যায়</span>}
          </span>
        </div>
        
        <div className="border-b border-gray-50 pb-3">
          <span className="block text-gray-400 font-semibold uppercase mb-1">সংশ্লিষ্ট নথি ফাইল:</span>
          <span className="text-gray-800 text-sm font-bold truncate block" title={getFileName()}>
            {getFileName()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="block text-gray-400 font-semibold uppercase mb-1">মডিউল ও প্রকার:</span>
            <span className="text-gray-800 text-sm font-bold">
              {letter.letter_type === 'standard' ? 'সাধারণ পত্র' : 
               letter.letter_type === 'office_order' ? 'অফিস আদেশ' : 'নোটিশ/পত্র'}
            </span>
          </div>
          <div>
            <span className="block text-gray-400 font-semibold uppercase mb-1">সংরক্ষণের স্থিতি:</span>
            <span className={`inline-block font-semibold px-2 py-0.5 rounded text-sm ${
              letter.status === 'issued' ? 'bg-emerald-50 text-emerald-700' :
              letter.status === 'archived' ? 'bg-amber-50 text-amber-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {letter.status === 'issued' ? 'জারিকৃত (Active)' : letter.status === 'archived' ? 'আর্কাইভকৃত' : 'খসড়া (Draft)'}
            </span>
          </div>
        </div>
      </div>

      {/* RENDER DYNAMIC PAPER LETTERHEAD PREVIEW */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">লেটারহেড প্রাকদর্শন (A4 সাইজ)</span>
          <button
            onClick={() => setIsFullScreen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
          >
            <Maximize2 size={13} />
            ফুল স্ক্রিন প্রাকদর্শন
          </button>
        </div>
        <div className="w-full overflow-x-auto bg-gray-50 border border-gray-200 p-4 md:p-6 rounded-xl shadow-inner">
          <div className="mx-auto" style={{ width: '794px' }}>
            <div className="relative shadow-lg border border-gray-100 rounded-sm overflow-hidden bg-white" style={{ width: '794px', height: '1123px' }}>
              <div className="absolute inset-0 overflow-y-auto bg-white" style={{ scrollbarWidth: 'thin' }}>
                <PrintLetter 
                  letter={letter}
                  profile={profile}
                  office={office}
                  recipient={recipients.find(r => r.id === letter.recipient_id)}
                  officers={officers}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULL SCREEN MODAL */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-gray-950/95 overflow-auto p-4 md:p-8 no-print">
          {/* Floating Close Button in Top-Right Corner */}
          <button
            onClick={() => setIsFullScreen(false)}
            className="fixed top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-all hover:scale-105 cursor-pointer flex items-center justify-center border border-red-500"
            title="বন্ধ করুন"
          >
            <X size={20} />
          </button>

          {/* Centered A4 viewport with horizontal/vertical safety alignment */}
          <div className="mx-auto my-4" style={{ width: '794px' }}>
            <div className="relative shadow-2xl border border-gray-800 rounded-sm overflow-hidden bg-white" style={{ width: '794px', height: '1123px' }}>
              <div className="absolute inset-0 overflow-y-auto bg-white">
                <PrintLetter 
                  letter={letter}
                  profile={profile}
                  office={office}
                  recipient={recipients.find(r => r.id === letter.recipient_id)}
                  officers={officers}
                />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
