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
  Scissors,
  ChevronsRight,
  Plus,
  Trash2,
  Minimize,
  Columns,
  Grid,
  Paintbrush,
  Maximize,
  ArrowRight,
  Check,
  Split,
  Merge,
  ChevronDown,
  Sparkles
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
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [hoveredGrid, setHoveredGrid] = useState({ rows: 0, cols: 0 });
  const [manualRows, setManualRows] = useState(3);
  const [manualCols, setManualCols] = useState(3);
  
  // Table context states
  const [activeTable, setActiveTable] = useState<HTMLTableElement | null>(null);
  const [activeCell, setActiveCell] = useState<HTMLTableCellElement | null>(null);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showBorderPicker, setShowBorderPicker] = useState(false);

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

  // Selection Tracking
  const updateTableSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setActiveTable(null);
      setActiveCell(null);
      return;
    }
    
    let node: Node | null = selection.getRangeAt(0).startContainer;
    let cell: HTMLTableCellElement | null = null;
    let table: HTMLTableElement | null = null;

    while (node && node !== editorRef.current) {
      if (node.nodeName === 'TD' || node.nodeName === 'TH') {
        cell = node as HTMLTableCellElement;
      }
      if (node.nodeName === 'TABLE') {
        table = node as HTMLTableElement;
        break;
      }
      node = node.parentNode;
    }

    setActiveTable(table);
    setActiveCell(cell);
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      let node: Node | null = selection.getRangeAt(0).startContainer;
      let isInsideEditor = false;
      while (node) {
        if (node === editorRef.current) {
          isInsideEditor = true;
          break;
        }
        node = node.parentNode;
      }
      
      if (isInsideEditor) {
        updateTableSelection();
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      // Check if cursor is in a table cell
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        let node: Node | null = selection.getRangeAt(0).startContainer;
        let cell: HTMLTableCellElement | null = null;
        while (node && node !== editorRef.current) {
          if (node.nodeName === 'TD' || node.nodeName === 'TH') {
            cell = node as HTMLTableCellElement;
            break;
          }
          node = node.parentNode;
        }
        
        if (cell) {
          const row = cell.parentElement as HTMLTableRowElement;
          const table = row.parentElement?.parentElement as HTMLTableElement || row.parentElement as HTMLTableElement;
          const rows = Array.from(table.querySelectorAll('tr'));
          const isLastRow = row === rows[rows.length - 1];
          const isLastCell = cell === row.cells[row.cells.length - 1];
          
          if (isLastRow && isLastCell) {
            // Append a new row!
            const newRow = document.createElement('tr');
            Array.from(row.cells).forEach(oldCell => {
              const newCell = document.createElement('td');
              newCell.className = oldCell.className || "border border-gray-400 p-2 text-sm min-w-[50px]";
              newCell.style.border = oldCell.style.border || '1px solid #9ca3af';
              newCell.style.padding = '8px';
              newCell.style.textAlign = oldCell.style.textAlign || 'center';
              newCell.style.verticalAlign = oldCell.style.verticalAlign || 'middle';
              newCell.innerHTML = '<br/>';
              newRow.appendChild(newCell);
            });
            
            const tbody = table.querySelector('tbody') || table;
            tbody.appendChild(newRow);
            handleInput();
            
            // Move cursor to the first cell of the new row
            setTimeout(() => {
              const firstNewCell = newRow.cells[0];
              const range = document.createRange();
              range.selectNodeContents(firstNewCell);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
              firstNewCell.focus();
              updateTableSelection();
            }, 10);
            return;
          } else {
            // Move to the next cell manually, keeping standard MS Word behavior
            const allCells = Array.from(table.querySelectorAll('td, th')) as HTMLTableCellElement[];
            const currentIdx = allCells.indexOf(cell);
            if (currentIdx < allCells.length - 1) {
              const nextCell = allCells[currentIdx + 1];
              const range = document.createRange();
              range.selectNodeContents(nextCell);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
              nextCell.focus();
              updateTableSelection();
              return;
            }
          }
        }
      }
      
      // Default Tab behavior if not in table
      execCommand('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;');
    }
  };

  // MS Word-like Table Insertion
  const insertCustomTable = (rowsCount: number, colsCount: number) => {
    let tableHTML = `<table style="width: 100%; border-collapse: collapse; border: 1px solid #9ca3af; margin: 15px 0;" class="border-collapse border border-gray-400 my-4 w-full">`;
    
    // Add header row
    tableHTML += '<thead><tr class="bg-gray-100" style="background-color: #f3f4f6;">';
    for (let c = 1; c <= colsCount; c++) {
      tableHTML += `<th style="border: 1px solid #9ca3af; padding: 8px; text-align: center; vertical-align: middle; font-size: 13px;" class="border border-gray-400 p-2 text-sm text-center font-bold">কলাম ${c}</th>`;
    }
    tableHTML += '</tr></thead>';
    
    // Add body rows
    tableHTML += '<tbody>';
    for (let r = 1; r <= rowsCount - 1; r++) {
      tableHTML += '<tr>';
      for (let c = 1; c <= colsCount; c++) {
        tableHTML += `<td style="border: 1px solid #9ca3af; padding: 8px; text-align: center; vertical-align: middle; font-size: 13px;" class="border border-gray-400 p-2 text-sm text-center">-</td>`;
      }
      tableHTML += '</tr>';
    }
    tableHTML += '</tbody></table><p><br/></p>';
    
    execCommand('insertHTML', tableHTML);
    setShowTablePicker(false);
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

  // Table Editing Operations
  const insertRow = (below = true) => {
    if (!activeCell || !activeTable) return;
    const currentRow = activeCell.parentElement as HTMLTableRowElement;
    const newRow = document.createElement('tr');
    
    Array.from(currentRow.cells).forEach(cell => {
      const isHeader = cell.tagName === 'TH';
      const newCell = document.createElement(isHeader ? 'th' : 'td');
      newCell.className = cell.className || "border border-gray-400 p-2 text-sm min-w-[50px]";
      newCell.style.border = cell.style.border || '1px solid #9ca3af';
      newCell.style.padding = '8px';
      newCell.style.textAlign = cell.style.textAlign || 'center';
      newCell.style.verticalAlign = cell.style.verticalAlign || 'middle';
      newCell.innerHTML = '<br/>';
      newRow.appendChild(newCell);
    });
    
    if (below) {
      currentRow.insertAdjacentElement('afterend', newRow);
    } else {
      currentRow.insertAdjacentElement('beforebegin', newRow);
    }
    handleInput();
  };

  const insertColumn = (right = true) => {
    if (!activeCell || !activeTable) return;
    const currentRow = activeCell.parentElement as HTMLTableRowElement;
    const cellIndex = Array.from(currentRow.cells).indexOf(activeCell);
    const rows = activeTable.querySelectorAll('tr');
    
    rows.forEach(row => {
      const isHeader = row.parentElement?.tagName === 'THEAD' || row.querySelector('th') !== null;
      const newCell = document.createElement(isHeader ? 'th' : 'td');
      newCell.className = "border border-gray-400 p-2 text-sm min-w-[50px]";
      newCell.style.border = '1px solid #9ca3af';
      newCell.style.padding = '8px';
      newCell.style.textAlign = 'center';
      newCell.style.verticalAlign = 'middle';
      newCell.innerHTML = '<br/>';
      
      const targetIndex = right ? cellIndex + 1 : cellIndex;
      if (targetIndex >= row.cells.length) {
        row.appendChild(newCell);
      } else {
        row.insertBefore(newCell, row.cells[targetIndex]);
      }
    });
    handleInput();
  };

  const deleteRow = () => {
    if (!activeCell || !activeTable) return;
    const currentRow = activeCell.parentElement as HTMLTableRowElement;
    currentRow.remove();
    
    if (activeTable.querySelectorAll('tr').length === 0) {
      activeTable.remove();
      setActiveTable(null);
      setActiveCell(null);
    } else {
      setActiveCell(null);
      updateTableSelection();
    }
    handleInput();
  };

  const deleteColumn = () => {
    if (!activeCell || !activeTable) return;
    const currentRow = activeCell.parentElement as HTMLTableRowElement;
    const cellIndex = Array.from(currentRow.cells).indexOf(activeCell);
    const rows = activeTable.querySelectorAll('tr');
    
    rows.forEach(row => {
      if (row.cells[cellIndex]) {
        row.cells[cellIndex].remove();
      }
    });
    
    const firstRow = activeTable.querySelector('tr');
    if (!firstRow || firstRow.cells.length === 0) {
      activeTable.remove();
      setActiveTable(null);
      setActiveCell(null);
    } else {
      setActiveCell(null);
      updateTableSelection();
    }
    handleInput();
  };

  const deleteTable = () => {
    if (!activeTable) return;
    activeTable.remove();
    setActiveTable(null);
    setActiveCell(null);
    handleInput();
  };

  const mergeRight = () => {
    if (!activeCell) return;
    const row = activeCell.parentElement as HTMLTableRowElement;
    const cells = Array.from(row.cells);
    const cellIndex = cells.indexOf(activeCell);
    
    if (cellIndex < cells.length - 1) {
      const nextCell = cells[cellIndex + 1];
      const activeColSpan = activeCell.colSpan || 1;
      const nextColSpan = nextCell.colSpan || 1;
      
      const activeContent = activeCell.innerHTML === '<br>' || activeCell.innerHTML === '<br/>' ? '' : activeCell.innerHTML;
      const nextContent = nextCell.innerHTML === '<br>' || nextCell.innerHTML === '<br/>' ? '' : nextCell.innerHTML;
      
      activeCell.innerHTML = (activeContent + (activeContent && nextContent ? ' ' : '') + nextContent) || '<br/>';
      activeCell.colSpan = activeColSpan + nextColSpan;
      nextCell.remove();
      handleInput();
    }
  };

  const splitCell = () => {
    if (!activeCell || activeCell.colSpan <= 1) return;
    activeCell.colSpan = activeCell.colSpan - 1;
    
    const newCell = document.createElement('td');
    newCell.className = activeCell.className || "border border-gray-400 p-2 text-sm min-w-[50px]";
    newCell.style.border = activeCell.style.border || '1px solid #9ca3af';
    newCell.style.padding = '8px';
    newCell.style.textAlign = activeCell.style.textAlign || 'center';
    newCell.style.verticalAlign = activeCell.style.verticalAlign || 'middle';
    newCell.innerHTML = '<br/>';
    
    activeCell.insertAdjacentElement('afterend', newCell);
    handleInput();
  };

  const setCellAlign = (align: 'left' | 'center' | 'right' | 'justify') => {
    if (!activeCell) return;
    activeCell.style.textAlign = align;
    activeCell.classList.remove('text-left', 'text-center', 'text-right', 'text-justify');
    activeCell.classList.add(`text-${align}`);
    handleInput();
  };

  const setCellValign = (valign: 'top' | 'middle' | 'bottom') => {
    if (!activeCell) return;
    activeCell.style.verticalAlign = valign;
    handleInput();
  };

  const setCellBorder = (styleType: 'all' | 'none' | 'thick' | 'dashed') => {
    if (!activeCell) return;
    if (styleType === 'all') {
      activeCell.style.border = '1px solid #9ca3af';
    } else if (styleType === 'none') {
      activeCell.style.border = 'none';
    } else if (styleType === 'thick') {
      activeCell.style.border = '2px solid #374151';
    } else if (styleType === 'dashed') {
      activeCell.style.border = '1px dashed #9ca3af';
    }
    handleInput();
  };

  const setCellBg = (color: string) => {
    if (!activeCell) return;
    activeCell.style.backgroundColor = color;
    handleInput();
  };

  const toggleHeaderRow = () => {
    if (!activeTable) return;
    const firstRow = activeTable.querySelector('tr');
    if (!firstRow) return;
    
    const cells = Array.from(firstRow.cells) as HTMLTableCellElement[];
    const isCurrentlyHeader = cells.every(cell => cell.tagName === 'TH');
    
    const newCells: HTMLTableCellElement[] = [];
    cells.forEach(cell => {
      const newCell = document.createElement(isCurrentlyHeader ? 'td' : 'th');
      newCell.className = cell.className;
      newCell.style.cssText = cell.style.cssText;
      newCell.colSpan = cell.colSpan;
      newCell.innerHTML = cell.innerHTML;
      
      if (!isCurrentlyHeader) {
        newCell.style.backgroundColor = '#f3f4f6';
        newCell.style.fontWeight = 'bold';
      } else {
        newCell.style.backgroundColor = 'transparent';
        newCell.style.fontWeight = 'normal';
      }
      newCells.push(newCell);
    });
    
    firstRow.innerHTML = '';
    newCells.forEach(cell => firstRow.appendChild(cell));
    handleInput();
  };

  return (
    <div className="border border-gray-300 rounded-xl shadow-xs overflow-hidden bg-white">
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

        <button
          type="button"
          onClick={() => execCommand('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;')}
          className="p-1 px-2 rounded text-gray-700 hover:bg-gray-200 transition flex items-center gap-1 text-[11px] font-bold"
          title="ট্যাব দিন (Tab / ৪টি স্পেস)"
        >
          <ChevronsRight size={14} className="text-[#006A4E]" />
          <span>ট্যাব</span>
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
                  className="flex items-center gap-2 p-1 hover:bg-gray-100 text-left w-full text-xs cursor-pointer"
                >
                  <span className="w-4 h-4 rounded-full border border-gray-400 inline-block" style={{ backgroundColor: c.code }}></span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

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

        {/* MS Word style table insert picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTablePicker(!showTablePicker)}
            className={`p-1 px-2 rounded text-gray-700 hover:bg-gray-200 transition flex items-center gap-0.5 ${showTablePicker ? 'bg-gray-200' : ''}`}
            title="সারণী যুক্ত করুন (Insert Table)"
          >
            <TableIcon size={16} />
            <ChevronDown size={10} className="text-gray-400" />
          </button>
          {showTablePicker && (
            <div className="absolute right-0 mt-1 bg-white border border-gray-350 rounded-xl shadow-2xl p-4 z-30 w-64 animate-fadeIn">
              <div className="text-xs font-bold text-gray-700 mb-2 border-b border-gray-100 pb-1.5 flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-gray-800">
                  <Grid size={14} className="text-[#006A4E]" />
                  সারণী ইনসার্ট
                </span>
                {hoveredGrid.rows > 0 && hoveredGrid.cols > 0 ? (
                  <span className="text-[#006A4E] bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {hoveredGrid.cols} × {hoveredGrid.rows}
                  </span>
                ) : (
                  <span className="text-gray-400 text-[10px]">সাইজ বাছুন</span>
                )}
              </div>
              
              {/* Interactive Hover Grid (8x8) */}
              <div 
                className="grid grid-cols-8 gap-1 mb-3.5 bg-gray-50/50 p-2 rounded-lg border border-gray-100" 
                onMouseLeave={() => setHoveredGrid({ rows: 0, cols: 0 })}
              >
                {Array.from({ length: 8 }).map((_, rIdx) => {
                  const r = rIdx + 1;
                  return Array.from({ length: 8 }).map((_, cIdx) => {
                    const c = cIdx + 1;
                    const isHighlighted = r <= hoveredGrid.rows && c <= hoveredGrid.cols;
                    return (
                      <div
                        key={`${r}-${c}`}
                        onMouseEnter={() => setHoveredGrid({ rows: r, cols: c })}
                        onClick={() => insertCustomTable(r, c)}
                        className={`w-5 h-5 border rounded-sm transition-all duration-75 cursor-pointer ${
                          isHighlighted
                            ? 'bg-[#006A4E] border-[#004D38] scale-105'
                            : 'bg-white border-gray-200 hover:border-gray-400'
                        }`}
                      />
                    );
                  });
                })}
              </div>

              {/* Manual numeric overrides */}
              <div className="border-t border-gray-100 pt-3">
                <span className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">ম্যানুয়াল সাইজ ইনপুট</span>
                <div className="grid grid-cols-2 gap-2 mb-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">সারি (Rows)</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={manualRows}
                      onChange={(e) => setManualRows(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full p-1 border border-gray-200 rounded text-xs text-center font-bold focus:ring-1 focus:ring-[#006A4E] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">কলাম (Columns)</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={manualCols}
                      onChange={(e) => setManualCols(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full p-1 border border-gray-200 rounded text-xs text-center font-bold focus:ring-1 focus:ring-[#006A4E] focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => insertCustomTable(manualRows, manualCols)}
                  className="w-full bg-[#006A4E] hover:bg-opacity-95 text-white py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus size={12} />
                  সারণী তৈরি করুন
                </button>
              </div>
            </div>
          )}
        </div>

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

      {/* DYNAMIC TABLE CONTEXT ACTION SUB-TOOLBAR */}
      {activeTable && (
        <div className="bg-emerald-50/70 border-b border-gray-200 p-2.5 flex flex-wrap gap-2 items-center text-xs text-gray-700 animate-fadeIn">
          <span className="flex items-center gap-1 text-[#006A4E] font-bold text-[11px] uppercase tracking-wide mr-1 border-r border-gray-300 pr-2">
            <Sparkles size={14} className="animate-pulse" />
            সারণী টুলস:
          </span>

          {/* Row Addition Options */}
          <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2">
            <button
              type="button"
              onClick={() => insertRow(false)}
              className="p-1.5 px-2 bg-white hover:bg-gray-100 rounded border border-gray-200 text-gray-700 font-bold flex items-center gap-1 shadow-2xs"
              title="উপরে সারি ঢোকান (Insert Row Above)"
            >
              <span>+ সারি ↑</span>
            </button>
            <button
              type="button"
              onClick={() => insertRow(true)}
              className="p-1.5 px-2 bg-white hover:bg-gray-100 rounded border border-gray-200 text-gray-700 font-bold flex items-center gap-1 shadow-2xs"
              title="নিচে সারি ঢোকান (Insert Row Below)"
            >
              <span>+ সারি ↓</span>
            </button>
          </div>

          {/* Column Addition Options */}
          <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2">
            <button
              type="button"
              onClick={() => insertColumn(false)}
              className="p-1.5 px-2 bg-white hover:bg-gray-100 rounded border border-gray-200 text-gray-700 font-bold flex items-center gap-1 shadow-2xs"
              title="বামে কলাম ঢোকান (Insert Column Left)"
            >
              <span>+ কলাম ←</span>
            </button>
            <button
              type="button"
              onClick={() => insertColumn(true)}
              className="p-1.5 px-2 bg-white hover:bg-gray-100 rounded border border-gray-200 text-gray-700 font-bold flex items-center gap-1 shadow-2xs"
              title="ডানে কলাম ঢোকান (Insert Column Right)"
            >
              <span>+ কলাম →</span>
            </button>
          </div>

          {/* Cell Merging / Splitting Horizontal */}
          <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2">
            <button
              type="button"
              onClick={mergeRight}
              className="p-1.5 bg-white hover:bg-gray-100 rounded border border-gray-200 text-gray-700 font-semibold flex items-center gap-1 shadow-2xs"
              title="ডানদিকের সেলের সাথে মার্জ করুন (Merge Horizontally with Cell to Right)"
            >
              <Merge size={13} className="text-[#006A4E]" />
              <span>ডান মার্জ</span>
            </button>
            <button
              type="button"
              onClick={splitCell}
              title="মার্জ করা সেল ভাগ করুন (Split Merged Cell)"
              disabled={!activeCell || (activeCell.colSpan || 1) <= 1}
              className={`p-1.5 bg-white rounded border text-gray-700 font-semibold flex items-center gap-1 shadow-2xs ${
                !activeCell || (activeCell.colSpan || 1) <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
              }`}
            >
              <Split size={13} className="text-[#006A4E]" />
              <span>ভাগ</span>
            </button>
          </div>

          {/* Horizontal Alignments inside Cell */}
          <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 bg-white p-0.5 rounded border border-gray-200">
            <button
              type="button"
              onClick={() => setCellAlign('left')}
              className={`p-1 rounded transition ${activeCell?.style.textAlign === 'left' ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
              title="সেলে বাম সারিবদ্ধকরণ"
            >
              <AlignLeft size={13} />
            </button>
            <button
              type="button"
              onClick={() => setCellAlign('center')}
              className={`p-1 rounded transition ${activeCell?.style.textAlign === 'center' ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
              title="সেলে মাঝখানে সারিবদ্ধকরণ"
            >
              <AlignCenter size={13} />
            </button>
            <button
              type="button"
              onClick={() => setCellAlign('right')}
              className={`p-1 rounded transition ${activeCell?.style.textAlign === 'right' ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
              title="সেলে ডান সারিবদ্ধকরণ"
            >
              <AlignRight size={13} />
            </button>
            <button
              type="button"
              onClick={() => setCellAlign('justify')}
              className={`p-1 rounded transition ${activeCell?.style.textAlign === 'justify' ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
              title="সেলে জাস্টিফাই সারিবদ্ধকরণ"
            >
              <AlignJustify size={13} />
            </button>
          </div>

          {/* Vertical Alignments inside Cell */}
          <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 bg-white p-0.5 rounded border border-gray-200">
            <button
              type="button"
              onClick={() => setCellValign('top')}
              className={`p-1 px-1.5 rounded text-[10px] font-bold transition ${activeCell?.style.verticalAlign === 'top' ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
              title="সেলে টপ এলাইনমেন্ট (Top Align)"
            >
              শীর্ষ
            </button>
            <button
              type="button"
              onClick={() => setCellValign('middle')}
              className={`p-1 px-1.5 rounded text-[10px] font-bold transition ${activeCell?.style.verticalAlign === 'middle' || !activeCell?.style.verticalAlign ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
              title="সেলে মিডল এলাইনমেন্ট (Middle Align)"
            >
              মধ্য
            </button>
            <button
              type="button"
              onClick={() => setCellValign('bottom')}
              className={`p-1 px-1.5 rounded text-[10px] font-bold transition ${activeCell?.style.verticalAlign === 'bottom' ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
              title="সেলে বটম এলাইনমেন্ট (Bottom Align)"
            >
              নিম্ন
            </button>
          </div>

          {/* Cell Background Highlight Color */}
          <div className="relative border-r border-gray-300 pr-2">
            <button
              type="button"
              onClick={() => {
                setShowBgPicker(!showBgPicker);
                setShowBorderPicker(false);
              }}
              className="p-1.5 px-2 bg-white hover:bg-gray-100 rounded border border-gray-200 text-gray-700 font-semibold flex items-center gap-1 shadow-2xs"
              title="সেলের ব্যাকগ্রাউন্ড পরিবর্তন করুন (Cell Background Color)"
            >
              <Paintbrush size={12} className="text-gray-500" />
              <span>ব্যাকগ্রাউন্ড</span>
              <ChevronDown size={10} className="text-gray-400" />
            </button>
            {showBgPicker && (
              <div className="absolute left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-20 grid grid-cols-5 gap-1 w-44">
                {[
                  { name: 'None', code: 'transparent' },
                  { name: 'Gray', code: '#f3f4f6' },
                  { name: 'Green', code: '#ecfdf5' },
                  { name: 'Amber', code: '#fef3c7' },
                  { name: 'Blue', code: '#eff6ff' }
                ].map(bg => (
                  <button
                    key={bg.code}
                    type="button"
                    onClick={() => {
                      setCellBg(bg.code);
                      setShowBgPicker(false);
                    }}
                    className="w-7 h-7 border border-gray-200 rounded-md transition hover:scale-105"
                    style={{ backgroundColor: bg.code }}
                    title={bg.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Border settings */}
          <div className="relative border-r border-gray-300 pr-2">
            <button
              type="button"
              onClick={() => {
                setShowBorderPicker(!showBorderPicker);
                setShowBgPicker(false);
              }}
              className="p-1.5 px-2 bg-white hover:bg-gray-100 rounded border border-gray-200 text-gray-700 font-semibold flex items-center gap-1 shadow-2xs"
              title="সেলের বর্ডার শৈলী পরিবর্তন করুন"
            >
              <Columns size={12} className="text-gray-500" />
              <span>বর্ডার</span>
              <ChevronDown size={10} className="text-gray-400" />
            </button>
            {showBorderPicker && (
              <div className="absolute left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-1.5 z-20 flex flex-col gap-1 w-36">
                <button
                  type="button"
                  onClick={() => {
                    setCellBorder('all');
                    setShowBorderPicker(false);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded text-left text-[11px] font-medium flex items-center justify-between"
                >
                  <span>সব বর্ডার (Standard)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCellBorder('none');
                    setShowBorderPicker(false);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded text-left text-[11px] font-medium flex items-center justify-between"
                >
                  <span>বর্ডারছাড়া (No Border)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCellBorder('thick');
                    setShowBorderPicker(false);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded text-left text-[11px] font-medium flex items-center justify-between"
                >
                  <span>মোটা বর্ডার (Thick 2px)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCellBorder('dashed');
                    setShowBorderPicker(false);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded text-left text-[11px] font-medium flex items-center justify-between"
                >
                  <span>হালকা বর্ডার (Dashed)</span>
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    toggleHeaderRow();
                    setShowBorderPicker(false);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded text-left text-[11px] text-[#006A4E] font-bold"
                >
                  প্রথম সারি হেডার করুন
                </button>
              </div>
            )}
          </div>

          {/* Table / Column / Row Deletions */}
          <div className="flex items-center gap-0.5 ml-auto">
            <button
              type="button"
              onClick={deleteRow}
              className="p-1.5 hover:bg-red-50 text-red-600 rounded flex items-center gap-1 font-semibold hover:border-red-100 border border-transparent"
              title="সারি মুছে দিন (Delete Row)"
            >
              <Trash2 size={12} />
              <span>সারি মুছুন</span>
            </button>
            <button
              type="button"
              onClick={deleteColumn}
              className="p-1.5 hover:bg-red-50 text-red-600 rounded flex items-center gap-1 font-semibold hover:border-red-100 border border-transparent"
              title="কলাম মুছে দিন (Delete Column)"
            >
              <Trash2 size={12} />
              <span>কলাম মুছুন</span>
            </button>
            <button
              type="button"
              onClick={deleteTable}
              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded flex items-center gap-1 font-bold border border-red-200 shadow-2xs ml-1"
              title="সম্পূর্ণ সারণী মুছে দিন (Delete Table)"
            >
              <Trash2 size={12} />
              <span>টেবিল মুছুন</span>
            </button>
          </div>
        </div>
      )}

      {/* EDITABLE FIELD */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning={true}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="p-6 font-sans min-h-[420px] max-h-[650px] overflow-y-auto focus:outline-none prose prose-slate max-w-none prose-sm sm:prose-base leading-relaxed"
        style={{ fontFamily: '"Nikosh", "SolaimanLipi", "Noto Sans Bengali", "Inter", sans-serif' }}
      ></div>
    </div>
  );
}
