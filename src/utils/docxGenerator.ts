import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  BorderStyle,
  WidthType,
  ImageRun,
  UnderlineType,
  VerticalMergeType
} from 'docx';
import { Letter, UserProfile, Office, Recipient, Officer } from '../types';
import { countToBangla, getBengaliCalendarDate, formatBanglaDate } from './banglaHelpers';

interface GenerateDocxParams {
  letter: Letter;
  profile: UserProfile;
  office: Office;
  recipient?: Recipient;
  officers?: Officer[];
}

/**
 * Helper to fetch images as ArrayBuffer for docx embedding.
 * Returns null if fetch fails or times out.
 */
async function fetchImageAsArrayBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch (err) {
    console.warn("Failed to fetch image for DOCX:", url, err);
    return null;
  }
}

/**
 * Traverses HTML DOM children to extract nested formatting as TextRuns.
 */
interface StyleProps {
  bold?: boolean;
  italics?: boolean;
  underline?: boolean;
}

function traverseAndCreateRuns(node: Node, currentStyle: StyleProps = {}): TextRun[] {
  const runs: TextRun[] = [];
  
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';
    if (text) {
      runs.push(new TextRun({
        text: text,
        font: "Nikosh",
        bold: currentStyle.bold,
        italics: currentStyle.italics,
        underline: currentStyle.underline ? { type: UnderlineType.SINGLE } : undefined,
        size: 24, // 12pt
      }));
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tagName = el.tagName.toUpperCase();
    const nextStyle: StyleProps = { ...currentStyle };
    
    if (tagName === 'STRONG' || tagName === 'B') {
      nextStyle.bold = true;
    }
    if (tagName === 'EM' || tagName === 'I') {
      nextStyle.italics = true;
    }
    if (tagName === 'U') {
      nextStyle.underline = true;
    }
    
    if (el.childNodes.length > 0) {
      el.childNodes.forEach(child => {
        runs.push(...traverseAndCreateRuns(child, nextStyle));
      });
    } else if (tagName === 'BR') {
      runs.push(new TextRun({ text: "\n" }));
    }
  }
  return runs;
}

/**
 * Parses rich text/HTML body into clean Word elements (Paragraph, Table, etc.).
 */
export function parseHtmlToDocxElements(html: string): any[] {
  const div = document.createElement('div');
  div.innerHTML = html;
  
  const elements: any[] = [];
  
  div.childNodes.forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toUpperCase();
      
      if (tagName === 'P') {
        const runs = el.childNodes.length > 0 
          ? Array.from(el.childNodes).flatMap(child => traverseAndCreateRuns(child))
          : [new TextRun({ text: "" })];
          
        let alignment: any = AlignmentType.LEFT;
        if (el.classList.contains('text-center') || el.style.textAlign === 'center') {
          alignment = AlignmentType.CENTER;
        } else if (el.classList.contains('text-right') || el.style.textAlign === 'right') {
          alignment = AlignmentType.RIGHT;
        } else if (el.classList.contains('text-justify') || el.style.textAlign === 'justify') {
          alignment = AlignmentType.JUSTIFIED;
        }
        
        elements.push(new Paragraph({
          children: runs,
          alignment: alignment,
          spacing: { after: 120 }, // 6pt after
        }));
      } else if (tagName === 'UL' || tagName === 'OL') {
        let count = 1;
        el.childNodes.forEach(liNode => {
          if (liNode.nodeType === Node.ELEMENT_NODE && (liNode as HTMLElement).tagName.toUpperCase() === 'LI') {
            const liEl = liNode as HTMLElement;
            const runs = Array.from(liEl.childNodes).flatMap(child => traverseAndCreateRuns(child));
            
            if (tagName === 'UL') {
              elements.push(new Paragraph({
                children: runs,
                bullet: { level: 0 },
                spacing: { after: 80 },
              }));
            } else {
              // Standard ordered list formatting using manually formatted Bangla count prefix
              const banglaIndex = countToBangla(count) + '. ';
              const orderedRuns = [
                new TextRun({ text: banglaIndex, font: "Nikosh", bold: true, size: 24 }),
                ...runs
              ];
              elements.push(new Paragraph({
                children: orderedRuns,
                spacing: { after: 80 },
              }));
              count++;
            }
          }
        });
      } else if (tagName === 'TABLE') {
        const rows: TableRow[] = [];
        el.querySelectorAll('tr').forEach(tr => {
          const cells: TableCell[] = [];
          tr.querySelectorAll('td, th').forEach(td => {
            const innerElements = parseHtmlToDocxElements(td.innerHTML);
            cells.push(new TableCell({
              children: innerElements.length > 0 ? innerElements : [new Paragraph({ text: "" })],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
                left: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
                right: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
              }
            }));
          });
          if (cells.length > 0) {
            rows.push(new TableRow({ children: cells }));
          }
        });
        if (rows.length > 0) {
          elements.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));
        }
      } else if (/^H[1-6]$/.test(tagName)) {
        const runs = Array.from(el.childNodes).flatMap(child => traverseAndCreateRuns(child, { bold: true }));
        const level = parseInt(tagName.substring(1));
        const size = level === 1 ? 36 : level === 2 ? 32 : level === 3 ? 28 : 24;
        
        runs.forEach(r => {
          (r as any).size = size;
        });
        
        elements.push(new Paragraph({
          children: runs,
          spacing: { before: 240, after: 120 },
        }));
      } else {
        const text = el.textContent || '';
        if (text.trim()) {
          elements.push(new Paragraph({
            children: [new TextRun({ text, font: "Nikosh", size: 24 })],
            spacing: { after: 120 },
          }));
        }
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text.trim()) {
        elements.push(new Paragraph({
          children: [new TextRun({ text, font: "Nikosh", size: 24 })],
          spacing: { after: 120 },
        }));
      }
    }
  });
  
  return elements;
}

/**
 * Triggers Word (DOCX) document generation and download.
 */
export async function downloadDOCX({
  letter,
  profile,
  office,
  recipient,
  officers = []
}: GenerateDocxParams) {
  
  // 1. Fetch images asynchronously (Govt seal, Mujib logo, QR code)
  const govtSealUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_Seal_of_Bangladesh.svg/150px-Government_Seal_of_Bangladesh.svg.png";
  const mujibLogoUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1jipO8vnuNDm1qwUZPkLvjXbnHY8ESNuqBFyaE-UBVI4ESwy0Af6U2uw&s=10";
  
  const [govtSealBuffer, mujibLogoBuffer] = await Promise.all([
    fetchImageAsArrayBuffer(govtSealUrl),
    fetchImageAsArrayBuffer(mujibLogoUrl)
  ]);

  const orgNameLine3 = office?.org_name_line3 !== undefined && office?.org_name_line3 !== ''
    ? office.org_name_line3
    : (office?.office_name?.includes('ব্যুরো') ? '' : 'উপজেলা উপানুষ্ঠানিক শিক্ষা ব্যুরো');

  const orgAddressLine4 = office?.org_address_line4 || office?.address || 'হালুয়াঘাট, ময়মনসিংহ';

  // Construct QR code data string
  const qrDataStr = [
    `${orgNameLine3}`,
    `${orgAddressLine4}`,
    `স্মারক নং: ${countToBangla(letter.memo_no)}`,
    `তারিখ: ${getBengaliCalendarDate(letter.issue_date)} বঙ্গাব্দ, ${formatBanglaDate(letter.issue_date)} খ্রিষ্টাব্দ`,
    `বিষয়: ${letter.subject || ''}`
  ].join('\n');

  // Fetch QR Code image as well (from public API)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrDataStr)}`;
  const qrCodeBuffer = await fetchImageAsArrayBuffer(qrCodeUrl);

  // Borderless style for clean grids
  const borderless = {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  };

  // Helper to translate letter types to Bangla header titles
  const getLetterHeaderTitle = () => {
    switch (letter.letter_type) {
      case 'office_order': return 'অফিস আদেশ';
      case 'notice': return 'বিজ্ঞপ্তি';
      case 'circular': return 'পরিপত্র';
      case 'invitation': return 'আমন্ত্রণপত্র';
      case 'meeting': return 'সভার নোটিশ';
      case 'training': return 'প্রশিক্ষণ নোটিশ';
      default: return '';
    }
  };

  const isStandard = letter.letter_type === 'standard';
  const headerTitle = getLetterHeaderTitle();

  const selectedOfficer = letter.signatory_officer_id 
    ? officers.find(o => o.id === letter.signatory_officer_id)
    : null;

  // 2. Prepare the children array for the document section
  const sectionChildren: any[] = [];

  // --- HEADER SECTION (3 Columns: Seal, Office Info, Logo) ---
  const headerCells: TableCell[] = [];

  // Left Cell: Seal
  headerCells.push(new TableCell({
    width: { size: 15, type: WidthType.PERCENTAGE },
    borders: borderless,
    children: govtSealBuffer ? [
      new Paragraph({
        children: [
          new ImageRun({
            data: govtSealBuffer,
            transformation: { width: 64, height: 64 },
            type: "png"
          })
        ],
        alignment: AlignmentType.CENTER
      })
    ] : [new Paragraph({ text: "" })]
  }));

  // Center Cell: Office Details
  headerCells.push(new TableCell({
    width: { size: 70, type: WidthType.PERCENTAGE },
    borders: borderless,
    children: [
      new Paragraph({
        children: [new TextRun({ text: "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার", font: "Nikosh", bold: true, size: 28 })],
        alignment: AlignmentType.CENTER
      }),
      new Paragraph({
        children: [new TextRun({ text: office?.office_name || 'উপজেলা উপানুষ্ঠানিক শিক্ষা কর্মকর্তার কার্যালয়', font: "Nikosh", bold: true, size: 24 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 40 }
      }),
      orgNameLine3 ? new Paragraph({
        children: [new TextRun({ text: orgNameLine3, font: "Nikosh", bold: true, size: 22 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 20 }
      }) : null,
      new Paragraph({
        children: [new TextRun({ text: orgAddressLine4, font: "Nikosh", size: 20 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 20 }
      }),
      office?.email ? new Paragraph({
        children: [new TextRun({ text: `ইমেইল: ${office.email}`, font: "Nikosh", size: 18 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 20 }
      }) : null,
    ].filter(Boolean) as Paragraph[]
  }));

  // Right Cell: Mujib Logo
  headerCells.push(new TableCell({
    width: { size: 15, type: WidthType.PERCENTAGE },
    borders: borderless,
    children: mujibLogoBuffer ? [
      new Paragraph({
        children: [
          new ImageRun({
            data: mujibLogoBuffer,
            transformation: { width: 64, height: 48 },
            type: "png"
          })
        ],
        alignment: AlignmentType.CENTER
      })
    ] : [new Paragraph({ text: "" })]
  }));

  sectionChildren.push(new Table({
    rows: [new TableRow({ children: headerCells })],
    width: { size: 100, type: WidthType.PERCENTAGE }
  }));

  // Space after header
  sectionChildren.push(new Paragraph({ text: "", spacing: { after: 240 } }));

  // --- MEMO NUMBER AND DATE SECTION (3-column, 2-row layout with merged cells) ---
  const memoDateTable = new Table({
    rows: [
      // Row 1
      new TableRow({
        children: [
          // Column 1 (Left): Memo number (starts merge)
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: borderless,
            verticalMerge: VerticalMergeType.RESTART,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "স্মারক নং ", font: "Nikosh", bold: true, size: 22 }),
                  new TextRun({ text: countToBangla(letter.memo_no), font: "Nikosh", size: 22 })
                ]
              })
            ]
          }),
          // Column 2 (Middle): 'তারিখ:' text (starts merge)
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            borders: borderless,
            verticalMerge: VerticalMergeType.RESTART,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "তারিখ:", font: "Nikosh", bold: true, size: 22 })
                ],
                alignment: AlignmentType.RIGHT
              })
            ]
          }),
          // Column 3 (Right, Row 1): Bengali calendar date
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            borders: borderless,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `${getBengaliCalendarDate(letter.issue_date)} বঙ্গাব্দ`, font: "Nikosh", bold: true, size: 22 })
                ],
                alignment: AlignmentType.LEFT
              })
            ]
          })
        ]
      }),
      // Row 2
      new TableRow({
        children: [
          // Column 1 (Left): Merged Memo Number
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: borderless,
            verticalMerge: VerticalMergeType.CONTINUE,
            children: [new Paragraph({ text: "" })]
          }),
          // Column 2 (Middle): Merged 'তারিখ:' text
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            borders: borderless,
            verticalMerge: VerticalMergeType.CONTINUE,
            children: [new Paragraph({ text: "" })]
          }),
          // Column 3 (Right, Row 2): Gregorian calendar date
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            borders: borderless,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `${formatBanglaDate(letter.issue_date)} খ্রিষ্টাব্দ`, font: "Nikosh", bold: true, size: 22 })
                ],
                alignment: AlignmentType.LEFT
              })
            ]
          })
        ]
      })
    ],
    width: { size: 100, type: WidthType.PERCENTAGE }
  });

  sectionChildren.push(memoDateTable);
  sectionChildren.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // --- TYPE HEADINGS (Center title for notice, circular, office order) ---
  if (headerTitle) {
    sectionChildren.push(new Paragraph({
      children: [
        new TextRun({ text: headerTitle, font: "Nikosh", bold: true, size: 28, underline: { type: UnderlineType.SINGLE } })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }));
  }

  // --- SUBJECT AND REFERENCE ---
  if (letter.letter_type !== 'office_order' && letter.subject) {
    const subjectRuns = [
      new TextRun({ text: "বিষয়: ", font: "Nikosh", bold: true, size: 24 }),
      new TextRun({ text: letter.subject, font: "Nikosh", bold: true, size: 24 })
    ];
    sectionChildren.push(new Paragraph({
      children: subjectRuns,
      spacing: { after: 120 }
    }));

    if (letter.notes && letter.notes.trim() && letter.letter_type === 'standard') {
      sectionChildren.push(new Paragraph({
        children: [
          new TextRun({ text: "সূত্র: ", font: "Nikosh", bold: true, size: 20 }),
          new TextRun({ text: letter.notes, font: "Nikosh", size: 20 })
        ],
        spacing: { after: 160 }
      }));
    }
  }

  // --- MAIN BODY (Parsed from HTML) ---
  const bodyParagraphs = parseHtmlToDocxElements(letter.body);
  sectionChildren.push(...bodyParagraphs);
  sectionChildren.push(new Paragraph({ text: "", spacing: { after: 360 } })); // 30pt space roughly for signing

  // --- RECIPIENT & SIGNATORY ROW (2 Columns) ---
  const gridCells: TableCell[] = [];

  // Left Cell: Recipient block (Left Column)
  const recipientChildren: Paragraph[] = [];
  if (isStandard && letter.recipient_id && recipient) {
    recipientChildren.push(new Paragraph({
      children: [new TextRun({ text: "প্রাপক,", font: "Nikosh", bold: true, size: 22 })],
      spacing: { after: 80 }
    }));

    if (letter.recipient_display_options?.show_name !== false) {
      recipientChildren.push(new Paragraph({
        children: [new TextRun({ text: recipient.recipient_name || '', font: "Nikosh", bold: true, size: 20 })],
        spacing: { after: 40 }
      }));
    }
    if (letter.recipient_display_options?.show_designation !== false && recipient.designation) {
      recipientChildren.push(new Paragraph({
        children: [new TextRun({ text: recipient.designation, font: "Nikosh", bold: true, size: 20 })],
        spacing: { after: 40 }
      }));
    }
    if (letter.recipient_display_options?.show_organization !== false && recipient.organization) {
      recipientChildren.push(new Paragraph({
        children: [new TextRun({ text: recipient.organization, font: "Nikosh", size: 20 })],
        spacing: { after: 40 }
      }));
    }
    if (letter.recipient_display_options?.show_address !== false && recipient.address) {
      recipientChildren.push(new Paragraph({
        children: [new TextRun({ text: recipient.address, font: "Nikosh", size: 20 })],
        spacing: { after: 40 }
      }));
    }
  }

  gridCells.push(new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    borders: borderless,
    children: recipientChildren.length > 0 ? recipientChildren : [new Paragraph({ text: "" })]
  }));

  // Right Cell: Signatory block (Right Column, Centered text)
  const signatoryChildren: Paragraph[] = [];
  if (selectedOfficer) {
    signatoryChildren.push(new Paragraph({
      children: [new TextRun({ text: selectedOfficer.name, font: "Nikosh", bold: true, size: 22 })],
      alignment: AlignmentType.CENTER
    }));
    signatoryChildren.push(new Paragraph({
      children: [new TextRun({ text: selectedOfficer.designation, font: "Nikosh", bold: true, size: 20 })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 40 }
    }));
    if (orgNameLine3) {
      signatoryChildren.push(new Paragraph({
        children: [new TextRun({ text: orgNameLine3, font: "Nikosh", size: 20 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 20 }
      }));
    }
    signatoryChildren.push(new Paragraph({
      children: [new TextRun({ text: orgAddressLine4, font: "Nikosh", size: 20 })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 20 }
    }));
    const phoneVal = selectedOfficer.phone || office?.phone;
    if (phoneVal) {
      signatoryChildren.push(new Paragraph({
        children: [new TextRun({ text: `ফোন/মোবাইল: ${countToBangla(phoneVal)}`, font: "Nikosh", size: 18 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 20 }
      }));
    }
  } else {
    // Fallback to active profile
    signatoryChildren.push(new Paragraph({
      children: [new TextRun({ text: profile?.name || 'কর্মকর্তার নাম', font: "Nikosh", bold: true, size: 22 })],
      alignment: AlignmentType.CENTER
    }));
    signatoryChildren.push(new Paragraph({
      children: [new TextRun({ text: profile?.designation || 'পদবি', font: "Nikosh", bold: true, size: 20 })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 40 }
    }));
    if (orgNameLine3) {
      signatoryChildren.push(new Paragraph({
        children: [new TextRun({ text: orgNameLine3, font: "Nikosh", size: 20 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 20 }
      }));
    }
    signatoryChildren.push(new Paragraph({
      children: [new TextRun({ text: orgAddressLine4, font: "Nikosh", size: 20 })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 20 }
    }));
    if (office?.phone) {
      signatoryChildren.push(new Paragraph({
        children: [new TextRun({ text: `ফোন: ${countToBangla(office.phone)}`, font: "Nikosh", size: 18 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 20 }
      }));
    }
  }

  gridCells.push(new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    borders: borderless,
    children: signatoryChildren
  }));

  sectionChildren.push(new Table({
    rows: [new TableRow({ children: gridCells })],
    width: { size: 100, type: WidthType.PERCENTAGE }
  }));

  // Space before CC/attachments
  sectionChildren.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // --- ATTACHMENTS (সংযুক্তি) ---
  if (letter.attachments && letter.attachments.length > 0) {
    sectionChildren.push(new Paragraph({
      children: [new TextRun({ text: "সংযুক্তি:", font: "Nikosh", bold: true, size: 20, underline: { type: UnderlineType.SINGLE } })],
      spacing: { after: 80 }
    }));
    letter.attachments.forEach((attach, idx) => {
      sectionChildren.push(new Paragraph({
        children: [
          new TextRun({ text: `${countToBangla(idx + 1)}. `, font: "Nikosh", bold: true, size: 20 }),
          new TextRun({ text: attach, font: "Nikosh", size: 20 })
        ],
        spacing: { after: 40 }
      }));
    });
    sectionChildren.push(new Paragraph({ text: "", spacing: { after: 120 } }));
  }

  // --- COPY RECIPIENTS SECTION (অনুলিপি) ---
  if (letter.copy_recipients && letter.copy_recipients.length > 0) {
    sectionChildren.push(new Paragraph({
      children: [new TextRun({ text: "অনুলিপি জ্ঞাতার্থে ও কার্যার্থে প্রেরিত হলো:", font: "Nikosh", bold: true, size: 20, underline: { type: UnderlineType.SINGLE } })],
      spacing: { after: 80 }
    }));
    letter.copy_recipients.forEach((cr, idx) => {
      const detailsStr = [cr.recipient_name, cr.designation, cr.organization, cr.address]
        .filter(Boolean)
        .join(', ');
      sectionChildren.push(new Paragraph({
        children: [
          new TextRun({ text: `${countToBangla(idx + 1)}. `, font: "Nikosh", bold: true, size: 20 }),
          new TextRun({ text: detailsStr, font: "Nikosh", size: 20 })
        ],
        spacing: { after: 40 }
      }));
    });
    // Add default office file item
    sectionChildren.push(new Paragraph({
      children: [
        new TextRun({ text: `${countToBangla(letter.copy_recipients.length + 1)}. `, font: "Nikosh", bold: true, size: 20 }),
        new TextRun({ text: "জরুরি অফিস ফাইল।", font: "Nikosh", size: 20 })
      ],
      spacing: { after: 40 }
    }));
    sectionChildren.push(new Paragraph({ text: "", spacing: { after: 120 } }));
  }

  // --- QR CODE SECTION ---
  if (qrCodeBuffer) {
    sectionChildren.push(new Paragraph({
      children: [
        new ImageRun({
          data: qrCodeBuffer,
          transformation: { width: 60, height: 60 },
          type: "png"
        })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { before: 120 }
    }));
  }

  // 3. Construct the final DOCX document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,    // 1 inch in twentieths of a point (dxa)
              bottom: 1440,
              left: 1440,
              right: 1440
            }
          }
        },
        children: sectionChildren
      }
    ]
  });

  // 4. Generate and download Blob
  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const banglaMemoNo = countToBangla(letter.memo_no);
  const cleanFileName = `Govt_Letter_${banglaMemoNo.replace(/[/\\?%*:|"<>]/g, '_')}.docx`;
  a.download = cleanFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
