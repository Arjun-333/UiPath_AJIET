import React, { useState } from 'react';
import { Award, FileSpreadsheet, Upload, Download, CheckCircle2, AlertCircle, Plus, Trash2, Eye, X, Mail, ExternalLink } from 'lucide-react';

interface StudentRow {
  name: string;
  email?: string;
  department?: string;
}

interface GeneratedResult {
  batch_id: string;
  count: number;
  preview_pdf_url: string;
  zip_url: string;
  files: { name: string; email?: string; filename: string; preview_url: string }[];
}

interface Props {
  onClose: () => void;
}

export const CertificateStudioModal: React.FC<Props> = ({ onClose }) => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [students, setStudents] = useState<StudentRow[]>([
    { name: 'Aarav Sharma', email: 'aarav@ajiet.edu.in', department: 'CSE - 6th Sem' }
  ]);
  const [manualName, setManualName] = useState('');
  const [manualDept, setManualDept] = useState('');

  const [eventTitle, setEventTitle] = useState('Discovering UiPath & RPA');
  const [subtitle, setSubtitle] = useState('Certificate of Participation');
  const [issueDate, setIssueDate] = useState('November 28, 2026');

  const [importedColumns, setImportedColumns] = useState<string[]>([]);
  const [importedRows, setImportedRows] = useState<Record<string, string>[]>([]);
  const [mappingConfirmed, setMappingConfirmed] = useState(false);
  const [colMapping, setColMapping] = useState<{ nameCol: string; deptCol: string; emailCol: string }>({
    nameCol: '',
    deptCol: '',
    emailCol: ''
  });

  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templateFilename, setTemplateFilename] = useState<string | null>(null);
  const [nameY, setNameY] = useState(48);
  const [nameSize, setNameSize] = useState(46);
  const [textColor, setTextColor] = useState('#0f172a');

  const [isImporting, setIsImporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedResult | null>(null);

  const applyColumnMapping = (
    rows: Record<string, string>[],
    mapping: { nameCol: string; deptCol: string; emailCol: string }
  ) => {
    const mapped = rows
      .map((r) => ({
        name: (mapping.nameCol ? r[mapping.nameCol] : '')?.trim() || '',
        department: (mapping.deptCol ? r[mapping.deptCol] : '')?.trim() || '',
        email: (mapping.emailCol ? r[mapping.emailCol] : '')?.trim() || ''
      }))
      .filter((st) => st.name.length > 0);
    setStudents(mapped);
  };

  const ingestImportedSheet = (data: any) => {
    const cols: string[] = Array.isArray(data.columns) ? data.columns : [];
    const rows: Record<string, string>[] = Array.isArray(data.rows) ? data.rows : [];
    if (cols.length > 0 && rows.length > 0) {
      const sug = data.suggested_mapping || {};
      const nextMap = {
        nameCol: sug.name_col || '',
        deptCol: sug.dept_col || '',
        emailCol: sug.email_col || ''
      };
      setImportedColumns(cols);
      setImportedRows(rows);
      setColMapping(nextMap);
      setMappingConfirmed(false);
      setStudents([]);
    } else {
      setImportedColumns([]);
      setImportedRows([]);
      setMappingConfirmed(true);
      setStudents(data.students || []);
    }
  };

  const handleImportGoogleSheet = async () => {
    if (!sheetUrl.trim()) return;
    setIsImporting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/certificates/import-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheet_url: sheetUrl.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to import Google Sheet.');
      if (!data.rows?.length && !data.students?.length) throw new Error('No student rows found in that sheet.');
      ingestImportedSheet(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Sheet import failed.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setErrorMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/certificates/import-csv', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to parse spreadsheet.');
      if (!data.rows?.length && !data.students?.length) throw new Error('No student rows found in spreadsheet.');
      ingestImportedSheet(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Spreadsheet upload failed.');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleUploadTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/certificates/upload-template', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to upload template image.');
      setTemplateId(data.template_id);
      setTemplateFilename(data.filename);
    } catch (err: any) {
      setErrorMsg(err.message || 'Template upload failed.');
    }
  };

  const handleAddManual = () => {
    if (!manualName.trim()) return;
    setStudents(prev => [...prev, { name: manualName.trim(), department: manualDept.trim() }]);
    setManualName('');
    setManualDept('');
  };

  const handleGenerate = async () => {
    if (students.length === 0) {
      setErrorMsg('Add or import at least one student first.');
      return;
    }
    setIsGenerating(true);
    setErrorMsg(null);
    setEmailStatus(null);
    setSelectedPreviewIdx(0);
    try {
      const res = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_title: eventTitle,
          subtitle,
          issue_date: issueDate,
          students,
          template_id: templateId,
          layout: { nameY, nameSize, textColor, showMeta: true }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to generate PDF certificates.');
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ sent_count: number; failed_count: number; skipped_count: number } | null>(null);
  const [selectedPreviewIdx, setSelectedPreviewIdx] = useState(0);
  const validEmailCount = students.filter((s) => (s.email || '').includes('@')).length;

  const handleSendEmails = async () => {
    if (!result) return;
    setIsSendingEmails(true);
    setErrorMsg(null);
    setEmailStatus(null);
    try {
      const res = await fetch('/api/certificates/send-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: result.batch_id,
          event_title: eventTitle
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send certificate emails.');
      setEmailStatus(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Email delivery failed.');
    } finally {
      setIsSendingEmails(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-5">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">E-Certificate PDF Studio</h2>
              <p className="text-xs text-slate-400">Import Excel / CSV / Google Sheets, preview A4-Landscape PDFs, and email participants</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-[11px] font-mono">
              <span className={`px-2 py-0.5 rounded-full border ${students.length > 0 ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>
                1. Roster ({students.length})
              </span>
              <span className="text-slate-600">&rarr;</span>
              <span className={`px-2 py-0.5 rounded-full border ${result ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>
                2. Render PDFs
              </span>
              <span className="text-slate-600">&rarr;</span>
              <span className={`px-2 py-0.5 rounded-full border ${emailStatus ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>
                3. Email / ZIP
              </span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-3 p-2.5 bg-red-950/60 border border-red-500/40 rounded-xl flex items-center space-x-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex-1 min-h-0 p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-y-auto lg:overflow-hidden">
          {/* Left Column: Roster Import & Settings */}
          <div className="lg:col-span-5 flex flex-col gap-4 lg:overflow-y-auto lg:pr-1">
            {/* 1. Google Sheet / CSV Import */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" /> 1. IMPORT REGISTERED STUDENTS
                </span>
                <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono border border-slate-700 flex items-center gap-1.5">
                  <Upload className="w-3 h-3" />
                  <span>Upload Excel / CSV</span>
                  <input type="file" accept=".csv,.xlsx,.xlsm" onChange={handleImportCsv} className="hidden" />
                </label>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="Paste public Google Sheet URL (Anyone with link can view)..."
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={handleImportGoogleSheet}
                  disabled={isImporting || !sheetUrl.trim()}
                  className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  {isImporting ? 'Loading...' : 'Fetch Sheet'}
                </button>
              </div>

              {/* Column Mapping Prompt (asks user which column is Name & Branch) */}
              {importedColumns.length > 0 && (
                <div className="p-3 bg-slate-900/95 border border-cyan-500/40 rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-cyan-300 font-semibold">
                      Detected {importedColumns.length} columns ({importedRows.length} rows) — select Name &amp; Branch:
                    </span>
                    {mappingConfirmed && (
                      <span className="text-[10px] font-mono text-emerald-400">Loaded</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Student Name *</label>
                      <select
                        value={colMapping.nameCol}
                        onChange={(e) => {
                          const next = { ...colMapping, nameCol: e.target.value };
                          setColMapping(next);
                          if (mappingConfirmed) applyColumnMapping(importedRows, next);
                        }}
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-[11px] text-slate-200 focus:outline-none focus:border-orange-500"
                      >
                        <option value="">-- Select column --</option>
                        {importedColumns.map((col) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Branch / Dept</label>
                      <select
                        value={colMapping.deptCol}
                        onChange={(e) => {
                          const next = { ...colMapping, deptCol: e.target.value };
                          setColMapping(next);
                          if (mappingConfirmed) applyColumnMapping(importedRows, next);
                        }}
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-[11px] text-slate-200 focus:outline-none focus:border-orange-500"
                      >
                        <option value="">(None)</option>
                        {importedColumns.map((col) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Email (optional)</label>
                      <select
                        value={colMapping.emailCol}
                        onChange={(e) => {
                          const next = { ...colMapping, emailCol: e.target.value };
                          setColMapping(next);
                          if (mappingConfirmed) applyColumnMapping(importedRows, next);
                        }}
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-[11px] text-slate-200 focus:outline-none focus:border-orange-500"
                      >
                        <option value="">(None)</option>
                        {importedColumns.map((col) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {!mappingConfirmed && (
                    <button
                      onClick={() => {
                        if (!colMapping.nameCol) return;
                        setMappingConfirmed(true);
                        applyColumnMapping(importedRows, colMapping);
                      }}
                      disabled={!colMapping.nameCol}
                      className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold disabled:opacity-50"
                    >
                      Confirm Columns &amp; Load {importedRows.length} Students
                    </button>
                  )}
                </div>
              )}

              {/* Manual Add */}
              <div className="flex space-x-2 pt-1">
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Student full name..."
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
                <input
                  type="text"
                  value={manualDept}
                  onChange={(e) => setManualDept(e.target.value)}
                  placeholder="Branch / USN (optional)"
                  className="w-40 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={handleAddManual}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs border border-slate-700"
                  title="Add Student"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Student List Preview (Inline Editable) */}
              <div className="max-h-44 overflow-y-auto space-y-1.5 pt-1">
                {students.map((st, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 rounded-lg text-xs border border-slate-800/80">
                    <input
                      type="text"
                      value={st.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStudents(prev => prev.map((item, i) => (i === idx ? { ...item, name: val } : item)));
                      }}
                      placeholder="Student name"
                      className="flex-1 min-w-0 px-2 py-1 bg-slate-950/70 border border-slate-800 rounded text-slate-200 font-semibold focus:outline-none focus:border-orange-500"
                    />
                    <input
                      type="text"
                      value={st.department || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStudents(prev => prev.map((item, i) => (i === idx ? { ...item, department: val } : item)));
                      }}
                      placeholder="Branch"
                      className="w-20 px-2 py-1 bg-slate-950/70 border border-slate-800 rounded text-slate-300 font-mono text-[10px] focus:outline-none focus:border-orange-500"
                    />
                    <input
                      type="text"
                      value={st.email || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStudents(prev => prev.map((item, i) => (i === idx ? { ...item, email: val } : item)));
                      }}
                      placeholder="Email"
                      className="w-32 px-2 py-1 bg-slate-950/70 border border-slate-800 rounded text-slate-400 font-mono text-[10px] focus:outline-none focus:border-orange-500"
                    />
                    <button
                      onClick={() => setStudents(prev => prev.filter((_, i) => i !== idx))}
                      className="text-slate-500 hover:text-red-400 p-1 shrink-0"
                      title="Remove student"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>
                  Recipients: <strong className="text-white">{students.length}</strong> &bull; With email: <strong className="text-cyan-300">{validEmailCount}</strong>
                </span>
                {students.length > 0 && (
                  <button
                    onClick={() => setStudents([])}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* 2. Certificate Content & Template */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <span className="text-xs font-mono font-bold text-orange-400 block">2. TEMPLATE &amp; DETAILS</span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Certificate Heading</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Issue Date</label>
                  <input
                    type="text"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Event / Workshop Title</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-xs">
                  <div className="font-semibold text-slate-200">
                    {templateId ? `Custom Template: ${templateFilename}` : 'Using Default UiPath Community AJIET Template'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {templateId ? 'Custom PNG/JPG background active' : 'Upload a PNG/JPG background anytime when ready'}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {templateId && (
                    <button
                      onClick={() => { setTemplateId(null); setTemplateFilename(null); }}
                      className="px-2 py-1 text-[11px] text-slate-400 hover:text-white"
                    >
                      Reset
                    </button>
                  )}
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                    <input type="file" accept=".png,.jpg,.jpeg" onChange={handleUploadTemplate} className="hidden" />
                  </label>
                </div>
              </div>

              {templateId && (
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block">Name Y ({nameY}%)</label>
                    <input type="range" min={20} max={80} value={nameY} onChange={(e) => setNameY(Number(e.target.value))} className="w-full" />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block">Font Size ({nameSize}px)</label>
                    <input type="range" min={24} max={72} value={nameSize} onChange={(e) => setNameSize(Number(e.target.value))} className="w-full" />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block">Text Color</label>
                    <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-7 bg-transparent cursor-pointer" />
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating || students.length === 0}
                className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/25 disabled:opacity-50"
              >
                {isGenerating ? `Rendering ${students.length} PDF Certificates...` : `Generate ${students.length} PDF Certificate${students.length === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>

          {/* Right Column: Live PDF Preview & Delivery Studio */}
          <div className="lg:col-span-7 p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col space-y-3 min-h-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> LIVE CERTIFICATE PREVIEW
              </span>
              {result && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSendEmails}
                    disabled={isSendingEmails || validEmailCount === 0}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold shadow-md shadow-cyan-600/25 disabled:opacity-50"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{isSendingEmails ? 'Sending...' : `Email All (${validEmailCount})`}</span>
                  </button>
                  <a
                    href={result.zip_url}
                    download
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/25"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .ZIP ({result.count})</span>
                  </a>
                </div>
              )}
            </div>

            {result ? (
              <div className="flex-1 flex flex-col space-y-2.5 min-h-0">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-3 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Generated {result.count} printable A4-Landscape PDFs.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.files.length > 1 && (
                      <select
                        value={selectedPreviewIdx}
                        onChange={(e) => setSelectedPreviewIdx(Number(e.target.value))}
                        className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        {result.files.map((f, i) => (
                          <option key={f.filename} value={i}>
                            {i + 1}. {f.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <a
                      href={(result.files[selectedPreviewIdx] || result.files[0])?.preview_url || result.preview_pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[11px] font-mono text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-700"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                {emailStatus && (
                  <div className="flex items-center space-x-2 text-xs text-cyan-200 bg-cyan-950/40 border border-cyan-500/30 px-3 py-2 rounded-lg">
                    <Mail className="w-4 h-4 shrink-0 text-cyan-400" />
                    <span>
                      Sent <strong>{emailStatus.sent_count}</strong> certificate email{emailStatus.sent_count === 1 ? '' : 's'}
                      {emailStatus.skipped_count > 0 ? ` • ${emailStatus.skipped_count} skipped (missing email)` : ''}
                      {emailStatus.failed_count > 0 ? ` • ${emailStatus.failed_count} failed` : ''}.
                    </span>
                  </div>
                )}
                <div className="flex-1 min-h-0 flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800 p-2 overflow-hidden">
                  <iframe
                    key={(result.files[selectedPreviewIdx] || result.files[0])?.preview_url || result.preview_pdf_url}
                    src={`${(result.files[selectedPreviewIdx] || result.files[0])?.preview_url || result.preview_pdf_url}#view=Fit`}
                    title="Certificate PDF Preview"
                    className="w-full h-full aspect-[1123/794] max-h-full rounded-lg bg-white"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-[380px] flex flex-col items-center justify-center text-center text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-xl p-6">
                <Award className="w-10 h-10 text-slate-700" />
                <p className="text-sm font-semibold text-slate-300">No PDF Batch Generated Yet</p>
                <p className="text-xs max-w-sm">
                  Upload your Excel / CSV sheet on the left, confirm the Name &amp; Branch columns, and click Generate to preview each certificate here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
