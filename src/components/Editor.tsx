import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Image as ImageIcon, 
  Table as TableIcon,
  HelpCircle,
  FileText,
  Palette,
  Scissors
} from 'lucide-react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function Editor({ value, onChange, placeholder = 'এখানে চিঠি লিখুন...' }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Keep editor content in sync with initial load
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, arg: string = '') => {
    document.execCommand(command, false, arg);
    handleInput();
    editorRef.current?.focus();
  };

  const insertTable = () => {
    const tableHTML = `
      <table class="border-collapse border border-gray-400 my-4 w-full">
        <thead>
          <tr class="bg-gray-100">
            <th class="border border-gray-400 p-2 text-sm text-left">ক্রমিক</th>
            <th class="border border-gray-400 p-2 text-sm text-left">বিষয়</th>
            <th class="border border-gray-400 p-2 text-sm text-left">মন্তব্য</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border border-gray-400 p-2 text-sm">১</td>
            <td class="border border-gray-400 p-2 text-sm">তথ্য ১</td>
            <td class="border border-gray-400 p-2 text-sm">...</td>
          </tr>
          <tr>
            <td class="border border-gray-400 p-2 text-sm">২</td>
            <td class="border border-gray-400 p-2 text-sm">তথ্য ২</td>
            <td class="border border-gray-400 p-2 text-sm">...</td>
          </tr>
        </tbody>
      </table>
    `;
    execCommand('insertHTML', tableHTML);
  };

  const insertImage = () => {
    const url = prompt('ছবির ইউআরএল (URL) দিন বা কম্পিউটার থেকে কপি করে সরাসরি পেস্ট করুন:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const insertPageBreak = () => {
    const pageBreakHTML = '<div class="page-break py-4 border-b-2 border-dashed border-red-400 text-center text-xs text-red-500 font-mono select-none" contenteditable="false">[ পৃষ্ঠা বিরতি / Page Break ]</div><p><br/></p>';
    execCommand('insertHTML', pageBreakHTML);
  };

  const colors = [
    { name: 'কালো', code: '#000000' },
    { name: 'লাল', code: '#F42A41' },
    { name: 'সরকারি সবুজ', code: '#006A4E' },
    { name: 'নীল', code: '#1D4ED8' },
    { name: 'ধূসর', code: '#4B5563' },
  ];

  return (
    <div className="border border-gray-300 rounded-lg shadow-sm overflow-hidden bg-white">
      {/* TOOLBAR */}
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1 items-center sticky top-0 z-10 select-none">
        {/* Basic Styles */}
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-1 px-2 rounded text-gray-700 hover:bg-gray-200 transition"
          title="বোল্ড (Bold) - Ctrl+B"
        >
          <Bold size={16} className="font-bold" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-1 px-2 rounded text-gray-700 hover:bg-gray-200 transition"
          title="ইটালিক (Italic) - Ctrl+I"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-1 px-2 rounded text-gray-700 hover:bg-gray-200 transition"
          title="আন্ডারলাইন (Underline) - Ctrl+U"
        >
          <Underline size={16} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Headings */}
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<h1>')}
          className="p-1 px-2 rounded text-gray-700 hover:bg-gray-200 transition flex items-center gap-0.5"
          title="শিরোনাম ১ (H1)"
        >
          <Heading1 size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<h2>')}
          className="p-1 px-2 rounded text-gray-700 hover:bg-gray-200 transition flex items-center gap-0.5"
          title="শিরোনাম ২ (H2)"
        >
          <Heading2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<p>')}
          className="p-1 px-2 text-xs font-semibold rounded text-gray-700 hover:bg-gray-200 transition"
          title="সাধারণ প্যারাগ্রাফ (Paragraph)"
        >
          P
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Alignment */}
        <button
          type="button"
          onClick={() => execCommand('justifyLeft')}
          className="p-1 px-2 rounded text-gray-700 hover:bg-gray-200 transition"
          title="বাম সারিবদ্ধ (Left Align)"
        >
          <AlignLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyCenter')}
          className="p-1 px-2 rounded text-gray-700 hover:bg-gray-200 transition"
          title="মাঝখানে সারিবদ্ধ (Center Align)"
        >
          <AlignCenter size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyRight')}
          className="p-1 px-2 rounded text-gray-700 hover:bg-gray-200 transition"
          title="ডান সারিবদ্ধ (Right Align)"
        >
          <AlignRight size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyFull')}
          className="p-1 px-2 rounded text-gray-700 hover:bg-gray-200 transition"
          title="উভয় পাশে সারিবদ্ধ (Justify)"
        >
          <AlignJustify size={16} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Lists */}
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-1 px-2 rounded text-gray-700 hover:bg-gray-200 transition"
          title="বুলেট তালিকা (Bullet List)"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-1 px-2 rounded text-gray-700 hover:bg-gray-200 transition"
          title="সংখ্যা তালিকা (Numbered List)"
        >
          <ListOrdered size={16} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Color Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-1 px-2 rounded text-gray-700 hover:bg-gray-200 transition flex items-center gap-1"
            title="লেখার রঙ (Font Color)"
          >
            <Palette size={16} />
            <span className="w-3 h-3 rounded-full border border-gray-400 bg-red-600 inline-block"></span>
          </button>
          {showColorPicker && (
            <div className="absolute left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg p-2 z-20 flex flex-col gap-1 w-32">
              {colors.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    execCommand('foreColor', c.code);
                    setShowColorPicker(false);
                  }}
                  className="flex items-center gap-2 p-1 hover:bg-gray-100 text-left w-full text-xs"
                >
                  <span className="w-4 h-4 rounded-full border border-gray-400 inline-block" style={{ backgroundColor: c.code }}></span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Size dropdown equivalent */}
        <button
          type="button"
          onClick={() => execCommand('fontSize', '3')}
          className="p-1 px-2 text-xs font-semibold rounded text-gray-700 hover:bg-gray-200 transition"
          title="সাধারণ লেখার সাইজ"
        >
          A
        </button>
        <button
          type="button"
          onClick={() => execCommand('fontSize', '5')}
          className="p-1 px-2 text-sm font-semibold rounded text-gray-700 hover:bg-gray-200 transition text-lg"
          title="বড় লেখার সাইজ"
        >
          A+
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Media / Tables */}
        <button
          type="button"
          onClick={insertTable}
          className="p-1 px-2 rounded text-gray-700 hover:bg-gray-200 transition flex items-center gap-0.5"
          title="সারণী যুক্ত করুন (Insert Table)"
        >
          <TableIcon size={16} />
        </button>

        <button
          type="button"
          onClick={insertImage}
          className="p-1 px-2 rounded text-gray-700 hover:bg-gray-200 transition flex items-center gap-0.5"
          title="ছবি যুক্ত করুন (Insert Image)"
        >
          <ImageIcon size={16} />
        </button>

        <button
          type="button"
          onClick={insertPageBreak}
          className="p-1 px-2 rounded text-red-700 hover:bg-red-50 hover:text-red-800 transition flex items-center gap-0.5 text-xs font-semibold"
          title="পৃষ্ঠা বিরতি যুক্ত করুন (Page Break)"
        >
          <FileText size={16} />
          <span>পৃষ্ঠা বিরতি</span>
        </button>
      </div>

      {/* EDITABLE FIELD */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning={true}
        onInput={handleInput}
        className="p-5 font-sans min-h-[400px] max-h-[600px] overflow-y-auto focus:outline-none prose prose-slate max-w-none prose-sm sm:prose-base leading-relaxed"
        style={{ fontFamily: '"Noto Sans Bengali", "Inter", sans-serif' }}
      ></div>
    </div>
  );
}
