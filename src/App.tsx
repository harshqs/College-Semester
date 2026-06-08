import React, { useState, useEffect, useMemo, useRef } from 'react';
import Header from './components/Header';
import PdfDetailModal from './components/PdfDetailModal';
import { getAllPDFs, savePDF, deletePDF, incrementDownloadCount } from './db';
import { PDFDocument, Category } from './types';
import { fileToBase64, formatBytes, cleanUrl, parseGitHubUrl } from './utils';
import { 
  FileText, 
  UploadCloud, 
  HelpCircle, 
  Search, 
  Trash2, 
  Edit3, 
  Download, 
  Eye, 
  GitBranch, 
  Github, 
  Heart, 
  Loader2,
  Calendar,
  Sparkles,
  ArrowRight,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES: Category[] = [
  'All',
  'Semester 1',
  'Semester 2',
  'Semester 3',
  'Semester 4',
  'Semester 5',
  'Semester 6',
  'Semester 7',
  'Semester 8'
];

export default function App() {
  const [pdfs, setPdfs] = useState<PDFDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePdf, setActivePdf] = useState<PDFDocument | null>(null);

  // Splash screen state
  const [isSplashActive, setIsSplashActive] = useState(true);
  const [splashProgress, setSplashProgress] = useState(0);

  // Dark Mode state (persisted in localStorage)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('portal_theme');
    return saved ? saved === 'dark' : false;
  });

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [category, setCategory] = useState<Category>('Semester 1');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; data: string } | null>(null);

  // Filter State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');

  // Drag-and-drop state
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync splash loading progress bar
  useEffect(() => {
    if (isSplashActive) {
      const interval = setInterval(() => {
        setSplashProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            // Wait briefly on completion for smooth animated exit transition
            setTimeout(() => {
              setIsSplashActive(false);
            }, 300);
            return 100;
          }
          return prev + 5;
        });
      }, 60);
      return () => clearInterval(interval);
    }
  }, [isSplashActive]);

  // Load documents
  useEffect(() => {
    getAllPDFs()
      .then((records) => {
        // Automatically prune legacy documents with old category names (e.g. "Programming", "Cheatsheets")
        const validSemesters = [
          'Semester 1',
          'Semester 2',
          'Semester 3',
          'Semester 4',
          'Semester 5',
          'Semester 6',
          'Semester 7',
          'Semester 8'
        ];
        const legacyRecords = records.filter((p) => !validSemesters.includes(p.category));

        if (legacyRecords.length > 0) {
          Promise.all(legacyRecords.map((p) => deletePDF(p.id)))
            .then(() => {
              const freshRecords = records.filter((p) => validSemesters.includes(p.category));
              setPdfs(freshRecords);
              setLoading(false);
            })
            .catch(() => {
              const freshRecords = records.filter((p) => validSemesters.includes(p.category));
              setPdfs(freshRecords);
              setLoading(false);
            });
        } else {
          setPdfs(records);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Database connection error:', err);
        setLoading(false);
      });
  }, []);

  // Update localStorage and document class when dark mode changes
  useEffect(() => {
    localStorage.setItem('portal_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Compute stats
  const stats = useMemo(() => {
    let totalClicks = 0;
    pdfs.forEach((p) => {
      totalClicks += p.downloadCount || 0;
    });
    return {
      count: pdfs.length,
      clicks: totalClicks,
    };
  }, [pdfs]);

  // Handle drag and drop file parsing
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setErrorMessage('');

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    if (e.target.files && e.target.files.length > 0) {
      await processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setErrorMessage('Please select a valid PDF layout document.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('File size exceeds standard 15MB system limit.');
      return;
    }

    try {
      const base64Str = await fileToBase64(file);
      const sizeStr = formatBytes(file.size);
      setSelectedFile({
        name: file.name,
        size: sizeStr,
        data: base64Str,
      });

      // Autofill title if empty
      if (!title) {
        const cleanName = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    } catch (e) {
      setErrorMessage('Error encoding PDF binary file.');
    }
  };

  // Submit Registration form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!title.trim()) {
      setErrorMessage('Please declare a valid Document Title.');
      return;
    }

    if (!githubUrl.trim()) {
      setErrorMessage('Please input a valid GitHub URL or Mirror Link.');
      return;
    }

    if (!editingId && !selectedFile) {
      setErrorMessage('Please drop or select a PDF file before uploading.');
      return;
    }

    const tagsArray = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const uploadedAtDate = new Date().toISOString().split('T')[0];

    if (editingId) {
      // Edit record
      const existingDoc = pdfs.find((p) => p.id === editingId);
      if (!existingDoc) return;

      const updatedDoc: PDFDocument = {
        ...existingDoc,
        title: title.trim(),
        description: description.trim(),
        category,
        tags: tagsArray,
        githubUrl: cleanUrl(githubUrl.trim()),
        fileName: selectedFile ? selectedFile.name : existingDoc.fileName,
        fileSize: selectedFile ? selectedFile.size : existingDoc.fileSize,
        fileData: selectedFile ? selectedFile.data : existingDoc.fileData,
      };

      savePDF(updatedDoc)
        .then(() => {
          setPdfs((prev) => prev.map((p) => (p.id === editingId ? updatedDoc : p)));
          setSuccessMessage(`"${updatedDoc.title}" modified successfully!`);
          resetForm();
        })
        .catch((err) => {
          setErrorMessage('Failed to write changes to local index.');
          console.error(err);
        });
    } else {
      // New record
      if (!selectedFile) return;

      const newDoc: PDFDocument = {
        id: `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: title.trim(),
        description: description.trim(),
        category,
        tags: tagsArray,
        githubUrl: cleanUrl(githubUrl.trim()),
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileData: selectedFile.data,
        uploadedAt: uploadedAtDate,
        downloadCount: 0,
      };

      savePDF(newDoc)
        .then(() => {
          setPdfs((prev) => [...prev, newDoc]);
          setSuccessMessage(`Document "${newDoc.title}" registered successfully!`);
          resetForm();
        })
        .catch((err) => {
          setErrorMessage('Database storage error saving PDF document.');
          console.error(err);
        });
    }
  };

  const startEdit = (pdf: PDFDocument) => {
    setEditingId(pdf.id);
    setTitle(pdf.title);
    setDescription(pdf.description);
    setCategory(pdf.category as Category);
    setGithubUrl(pdf.githubUrl);
    setTagsInput(pdf.tags.join(', '));
    setSelectedFile({
      name: pdf.fileName,
      size: pdf.fileSize,
      data: pdf.fileData || '',
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleDelete = (id: string) => {
    deletePDF(id)
      .then(() => {
        setPdfs((prev) => prev.filter((p) => p.id !== id));
      })
      .catch((err) => console.error('Delete error:', err));
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setCategory('Semester 1');
    setGithubUrl('');
    setTagsInput('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // File download and metrics handling
  const handleDownloadPdf = (pdf: PDFDocument) => {
    incrementDownloadCount(pdf.id)
      .then(() => {
        setPdfs((prev) =>
          prev.map((p) => (p.id === pdf.id ? { ...p, downloadCount: (p.downloadCount || 0) + 1 } : p))
        );

        if (activePdf && activePdf.id === pdf.id) {
          setActivePdf((prev) => (prev ? { ...prev, downloadCount: (prev.downloadCount || 0) + 1 } : null));
        }

        try {
          if (pdf.fileData) {
            const fileName = pdf.fileName || 'file.pdf';
            let dataUrl = pdf.fileData;

            if (!dataUrl.startsWith('data:application/pdf;base64,')) {
              if (dataUrl.includes('base64,')) {
                dataUrl = `data:application/pdf;base64,${dataUrl.split('base64,')[1]}`;
              } else {
                dataUrl = `data:application/pdf;base64,${dataUrl}`;
              }
            }

            const anchor = document.createElement('a');
            anchor.href = dataUrl;
            anchor.download = fileName;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
          } else {
            window.open(pdf.githubUrl, '_blank');
          }
        } catch (downloadErr) {
          window.open(pdf.githubUrl, '_blank');
        }
      })
      .catch((err) => console.error(err));
  };

  // Filter handler
  const filteredPdfs = useMemo(() => {
    return pdfs.filter((pdf) => {
      const matchCat = selectedCategory === 'All' || pdf.category === selectedCategory;
      const searchLower = search.toLowerCase();
      const matchSearch =
        search === '' ||
        pdf.title.toLowerCase().includes(searchLower) ||
        pdf.description.toLowerCase().includes(searchLower) ||
        pdf.fileName.toLowerCase().includes(searchLower) ||
        pdf.tags.some((t) => t.toLowerCase().includes(searchLower));

      return matchCat && matchSearch;
    });
  }, [pdfs, search, selectedCategory]);

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-850'
    } flex flex-col font-sans antialiased custom-scrollbar`}>
      
      {/* 2. Beautiful Splash Screen Container */}
      <AnimatePresence>
        {isSplashActive && (
          <motion.div
            id="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -40, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 ${
              darkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-900 text-white'
            }`}
          >
            {/* Ambient Background Glow Sparks representing an upscale vibe */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/15 blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px]"></div>

            <div className="relative max-w-lg w-full text-center space-y-8">
              
              {/* Splash central badge / logo icon */}
              <motion.div 
                initial={{ scale: 0.4, rotate: -15, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.1 }}
                className="mx-auto w-20 h-20 rounded-2.5xl bg-gradient-to-tr from-indigo-650 via-indigo-600 to-indigo-400 flex items-center justify-center shadow-2xl shadow-indigo-500/20"
              >
                <FileText className="w-10 h-10 text-white" />
              </motion.div>

              <div className="space-y-3">
                {/* 3. Wrote College Seamester */}
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-400/20 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest text-indigo-300 uppercase"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>Academic PDF Registry</span>
                </motion.span>

                <motion.h1 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="font-display font-black text-4xl sm:text-5xl leading-none tracking-tight text-white uppercase"
                >
                  College Seamester
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs text-zinc-450 tracking-wide font-medium"
                >
                  Secure Portable Notebook Storage &amp; GitHub Mirror Mirror
                </motion.p>
              </div>

              {/* Progress Bar Loader Container */}
              <div className="max-w-xs mx-auto space-y-2 pt-6">
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-indigo-500"
                    style={{ width: `${splashProgress}%` }}
                    transition={{ ease: "easeOut" }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span className="animate-pulse">Loading modules...</span>
                  <span className="font-bold">{splashProgress}%</span>
                </div>
              </div>

              {/* Instant Manual Bypass CTA */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                onClick={() => setIsSplashActive(false)}
                className="inline-flex items-center space-x-1.5 text-xs text-indigo-300 hover:text-indigo-200 transition-colors cursor-pointer bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5 font-semibold"
              >
                <span>Jump straight in</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header with Dark & Light Mode Toggler */}
      <Header 
        pdfCount={pdfs.length} 
        darkMode={darkMode} 
        toggleDarkMode={toggleDarkMode} 
      />

      {/* Main Core Content Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        
        {/* Dynamic Center Branding Hub */}
        <div className={`relative rounded-3xl overflow-hidden py-14 px-6 sm:px-12 text-center border transition-all ${
          darkMode 
            ? 'bg-zinc-900 border-zinc-800 text-white shadow-xl shadow-indigo-950/20' 
            : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'
        }`}>
          {/* Subtle Ambient Shapes */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
          <div className="absolute -top-12 left-1/3 w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl"></div>

          <div className="relative max-w-2xl mx-auto space-y-4">
            
            {/* Aesthetic Academic Label badge */}
            <span className={`inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
              darkMode ? 'bg-zinc-800 text-indigo-400' : 'bg-indigo-50 text-indigo-700'
            }`}>
              <Calendar className="w-3.5 h-3.5" />
              <span>Full Indexed Courseware Catalog</span>
            </span>

            {/* 3. In Centre wrote "College Seamester" */}
            <h2 className={`font-display font-extrabold text-4xl sm:text-5xl leading-none tracking-tight uppercase ${
              darkMode ? 'text-white' : 'text-zinc-900'
            }`}>
              College Seamester
            </h2>

            <p className={`text-xs sm:text-sm max-w-md mx-auto leading-relaxed ${
              darkMode ? 'text-zinc-400' : 'text-zinc-550'
            }`}>
              An elegant academic directory where you can upload reference PDFs, map their original raw GitHub links, and access immediate local downloads with detailed ledger statistics.
            </p>
          </div>
        </div>

        {/* Dual Form & List Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className={`text-xs font-mono font-semibold tracking-wider uppercase ${
              darkMode ? 'text-zinc-500' : 'text-zinc-400'
            }`}>
              Mirroring Storage Repositories...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Publisher console form (5 columns wide) */}
            <div className={`rounded-3xl border p-6 shadow-sm space-y-5 lg:col-span-5 transition-colors sticky top-24 ${
              darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
            }`}>
              <div className="border-b border-zinc-150 pb-3.5 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs uppercase font-mono ${
                    darkMode ? 'bg-zinc-800 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    +
                  </div>
                  <h3 className={`font-display font-semibold text-sm ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                    {editingId ? 'Modify mirror record' : 'Register New Study Resource'}
                  </h3>
                </div>
                {editingId && (
                  <button
                    id="cancel-edit-btn"
                    onClick={resetForm}
                    className="text-[10px] uppercase font-mono tracking-wider font-bold text-red-500 hover:text-red-400 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono block">
                    Document Title *
                  </label>
                  <input
                    id="title-input"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Applied Engineering Mechanics Guide"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                      darkMode 
                        ? 'bg-zinc-950 border border-zinc-800 text-white focus:bg-zinc-900/60' 
                        : 'bg-zinc-50 border border-zinc-200 text-zinc-900 focus:bg-white'
                    }`}
                  />
                </div>

                {/* Abstract Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono block">
                    Summary / Description
                  </label>
                  <textarea
                    id="description-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Chapter topics covered, final formulas cheats, exam tips, lecture notes contents etc."
                    rows={2}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none ${
                      darkMode 
                        ? 'bg-zinc-950 border border-zinc-800 text-white focus:bg-zinc-900/60' 
                        : 'bg-zinc-50 border border-zinc-200 text-zinc-900 focus:bg-white'
                    }`}
                  />
                </div>

                {/* GitHub URL address link */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono flex items-center justify-between">
                    <span>GitHub RAW File Link / Mirror Link *</span>
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-400 cursor-help" title="Input the study notebook URL on GitHub (github.com/owner/repository)" />
                  </label>
                  <input
                    id="githubUrl-input"
                    type="text"
                    required
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/repository/blob/main/math_docs.pdf"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                      darkMode 
                        ? 'bg-zinc-950 border border-zinc-800 text-white focus:bg-zinc-900/60' 
                        : 'bg-zinc-50 border border-zinc-200 text-zinc-900 focus:bg-white'
                    }`}
                  />
                </div>

                {/* Semester & tags row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono block">
                      Target Semester
                    </label>
                    <select
                      id="category-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                      className={`w-full px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                        darkMode 
                          ? 'bg-zinc-950 border border-zinc-800 text-white focus:bg-zinc-900/60' 
                          : 'bg-zinc-50 border border-zinc-200 text-zinc-900 focus:bg-white'
                      }`}
                    >
                      {CATEGORIES.filter(c => c !== 'All').map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono block">
                      Keywords CSV
                    </label>
                    <input
                      id="tags-input"
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="dynamics, exams, maths"
                      className={`w-full px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                        darkMode 
                          ? 'bg-zinc-950 border border-zinc-800 text-white focus:bg-zinc-900/60' 
                          : 'bg-zinc-50 border border-zinc-200 text-zinc-900 focus:bg-white'
                      }`}
                    />
                  </div>
                </div>

                {/* File Upload drag/drop zone */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono block">
                    {editingId ? 'Source PDF Binary (Optional Reupload)' : 'Source PDF Binary Payload *'}
                  </label>

                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleFileDrop}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-500/5 text-indigo-400'
                        : selectedFile
                        ? 'border-emerald-500 bg-emerald-500/5 text-emerald-400'
                        : (darkMode ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-zinc-400' : 'border-zinc-200 hover:border-zinc-350 bg-zinc-50/50 text-zinc-650')
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelection}
                      accept="application/pdf"
                      className="hidden"
                    />

                    {selectedFile ? (
                      <div className="space-y-1">
                        <FileText className="w-7 h-7 mx-auto text-emerald-500" />
                        <h4 className={`text-xs font-semibold truncate max-w-[200px] ${darkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                          {selectedFile.name}
                        </h4>
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-[9px] font-mono text-emerald-400 border border-emerald-500/20">
                          {selectedFile.size} ready to post
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <UploadCloud className="w-6 h-6 text-zinc-400 mx-auto" />
                        <p className="text-[11px] font-semibold">
                          Drop PDF manual here, or <span className="text-indigo-400 underline font-extrabold">browse file</span>
                        </p>
                        <span className="text-[9px] text-zinc-500 font-mono">
                          Supports PDFs up to 15MB
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Alerts */}
                {errorMessage && (
                  <div className="p-3 text-xs bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 text-xs bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                    {successMessage}
                  </div>
                )}

                {/* Submission CTA control box */}
                <div className="flex gap-2 pt-2">
                  <button
                    id="form-reset-btn"
                    type="button"
                    onClick={resetForm}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      darkMode 
                        ? 'border-zinc-800 text-zinc-450 hover:bg-zinc-850 hover:text-zinc-200' 
                        : 'border-zinc-250 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    Reset
                  </button>
                  <button
                    id="form-submit-btn"
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 hover:shadow shadow-indigo-950/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {editingId ? 'Save Mirror' : 'Publish PDF'}
                  </button>
                </div>
              </form>
            </div>

            {/* Catalog vault lists (7 columns wide) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Filter controls, search input, & 4. Heading: Here is your PDF :) */}
              <div className={`p-5 rounded-3xl border shadow-sm space-y-5 transition-colors ${
                darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
              }`}>
                
                {/* 4. Heading wrote Here is your PDF :) */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2 border-b border-zinc-200/20">
                  <div>
                    <h2 className={`font-display font-black text-2xl tracking-tight transition-colors ${
                      darkMode ? 'text-white' : 'text-zinc-900'
                    }`}>
                      Here is your PDF :)
                    </h2>
                    <p className={`text-xs ${darkMode ? 'text-zinc-450' : 'text-zinc-500'}`}>
                      Instantly query, preview, and sync university files below:
                    </p>
                  </div>
                  <div className={`text-[10px] font-mono px-3 py-1 rounded-full ${
                    darkMode ? 'bg-zinc-950 border border-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    LEDGER_SIZE: {filteredPdfs.length} FILE(S)
                  </div>
                </div>

                {/* Core Search panel */}
                <div className="relative">
                  <Search className="w-4.5 h-4.5 text-zinc-450 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="searchbox"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by note title, syllabus keywords, description codes..."
                    className={`w-full pl-11 pr-4 py-3 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                      darkMode 
                        ? 'bg-zinc-950 border border-zinc-800 text-white focus:bg-zinc-900/40' 
                        : 'bg-zinc-50 border border-zinc-200 text-zinc-900 focus:bg-white'
                    }`}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-zinc-700/25 hover:bg-zinc-700/50 text-zinc-300 p-1 rounded text-[10px] cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Aesthetic Semester Navigation Tab Deck */}
                <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                  {CATEGORIES.map((cat) => {
                    const count = cat === 'All' 
                      ? pdfs.length 
                      : pdfs.filter(p => p.category === cat).length;
                    const isActive = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-1.8 text-xs font-semibold rounded-xl shrink-0 cursor-pointer transition-all ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow shadow-indigo-950/20'
                            : (darkMode ? 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white' : 'bg-zinc-50 border border-zinc-200/80 text-zinc-600 hover:bg-zinc-100')
                        }`}
                      >
                        {cat}
                        <span className={`ml-1.5 px-1 py-0.2 text-[9px] rounded-md font-mono ${
                          isActive 
                            ? 'bg-indigo-700 text-indigo-100' 
                            : (darkMode ? 'bg-zinc-900 text-zinc-500' : 'bg-zinc-200 text-zinc-550')
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* PDF Document List Flow */}
              <AnimatePresence mode="popLayout">
                {filteredPdfs.length > 0 ? (
                  <div className="space-y-4">
                    {filteredPdfs.map((pdf) => {
                      const githubInfo = parseGitHubUrl(pdf.githubUrl);
                      return (
                        <motion.div
                          key={pdf.id}
                          layout
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.25 }}
                          className={`rounded-2xl border p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:shadow-md transition-all ${
                            darkMode 
                              ? 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700' 
                              : 'bg-white border-zinc-200 hover:border-zinc-300'
                          }`}
                        >
                          {/* Inner details item details bar */}
                          <div className="flex items-center space-x-4 max-w-[75%]">
                            
                            {/* Visual Spine Representation */}
                            <div className="w-10 h-14 rounded-l bg-zinc-950 text-white flex shrink-0 overflow-hidden shadow-md relative border border-zinc-800/20">
                              <div className="w-2.5 h-full bg-indigo-600 shrink-0"></div>
                              <div className="p-1.5 flex flex-col justify-between items-center w-full">
                                <FileText className="w-5 h-5 text-indigo-400 opacity-80" />
                                <span className="text-[5px] text-zinc-500 font-mono scale-95 uppercase font-bold">PDF</span>
                              </div>
                            </div>

                            {/* Info texts lists */}
                            <div className="space-y-1 truncate">
                              <div className="flex items-center space-x-2">
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase ${
                                  darkMode ? 'bg-zinc-850 border border-zinc-800 text-indigo-400' : 'bg-indigo-50 border border-indigo-100 text-indigo-700'
                                }`}>
                                  {pdf.category}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono">
                                  {pdf.fileSize}
                                </span>
                              </div>

                              <h4 className={`font-display font-bold text-[13.5px] tracking-tight truncate ${
                                darkMode ? 'text-white' : 'text-zinc-900'
                              }`} title={pdf.title}>
                                {pdf.title}
                              </h4>

                              <p className={`text-xs line-clamp-1 ${
                                darkMode ? 'text-zinc-450' : 'text-zinc-500'
                              }`}>
                                {pdf.description || "No customized semester syllabus details recorded."}
                              </p>

                              {/* GitHub direct details banner */}
                              {githubInfo ? (
                                <div className="flex items-center space-x-1 text-[10px] font-mono text-zinc-450 pt-0.5">
                                  <GitBranch className="w-3 h-3 text-zinc-500" />
                                  <a
                                    href={pdf.githubUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-indigo-400 hover:underline transition-colors block truncate max-w-[150px] font-bold"
                                  >
                                    {githubInfo.owner}/{githubInfo.repo}
                                  </a>
                                </div>
                              ) : (
                                <span className="text-[9px] text-zinc-500 font-mono italic">
                                  Custom Mirror Repository Linked
                                </span>
                              )}
                            </div>

                          </div>

                          {/* Action button deck */}
                          <div className="flex sm:flex-col items-stretch sm:items-end justify-between sm:justify-center gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-800/10">
                            
                            {/* Hit statistics counter mapping */}
                            <div className="flex items-center space-x-1 text-[10px] font-mono text-zinc-450 self-center font-bold">
                              <span>📥</span>
                              <span>{pdf.downloadCount || 0} CLICKS</span>
                            </div>

                            {/* Control button array row */}
                            <div className="flex items-center space-x-1">
                              
                              {/* Open detail modal reader */}
                              <button
                                id={`view-btn-${pdf.id}`}
                                onClick={() => setActivePdf(pdf)}
                                className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                                  darkMode 
                                    ? 'bg-zinc-850 hover:bg-zinc-800 border-zinc-805 text-zinc-300 hover:text-white' 
                                    : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-650 hover:text-zinc-900'
                                }`}
                                title="Open Online Notes Viewer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Download file instantly */}
                              <button
                                id={`download-btn-${pdf.id}`}
                                onClick={() => handleDownloadPdf(pdf)}
                                className="px-3 py-1.8 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg cursor-pointer flex items-center space-x-1 shadow-sm"
                                title="Download PDF bytes"
                              >
                                <Download className="w-3 h-3" />
                                <span>Get</span>
                              </button>

                              {/* Inline Edit form filler */}
                              <button
                                id={`edit-btn-${pdf.id}`}
                                onClick={() => startEdit(pdf)}
                                className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                                  darkMode 
                                    ? 'bg-zinc-850 hover:bg-zinc-800 border-zinc-805 hover:border-indigo-500/50 text-zinc-400 hover:text-indigo-400' 
                                    : 'bg-white hover:bg-zinc-50 border-zinc-200 hover:border-indigo-300 text-zinc-500 hover:text-indigo-600'
                                }`}
                                title="Edit mirror metadata details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete option cleaner */}
                              <button
                                id={`delete-btn-${pdf.id}`}
                                onClick={() => {
                                  if (confirm(`Remove PDF mirror "${pdf.title}" from your database catalog registry?`)) {
                                    handleDelete(pdf.id);
                                    if (editingId === pdf.id) resetForm();
                                  }
                                }}
                                className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                                  darkMode 
                                    ? 'bg-zinc-850 hover:bg-red-950/20 border-zinc-805 hover:border-red-500/50 text-red-400' 
                                    : 'bg-white hover:bg-red-50/50 border-zinc-200 hover:border-red-300 text-red-550'
                                }`}
                                title="Delete catalog resource"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                            </div>

                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  /* Elegant empty search indicator */
                  <div className={`p-12 text-center rounded-3xl border border-dashed transition-colors ${
                    darkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
                  }`}>
                    <div className="w-12 h-12 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-400 shadow-inner">
                      <FileText className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h3 className={`font-display font-bold text-sm ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                      No University Materials Present
                    </h3>
                    <p className={`text-xs max-w-sm mx-auto mt-2 leading-relaxed ${
                      darkMode ? 'text-zinc-500' : 'text-zinc-500'
                    }`}>
                      Get started immediately using the creation tools on the left. Register a syllabus handbook for any semester, map its GitHub file, and enjoy immediate downloads!
                    </p>
                    {search && (
                      <button
                        onClick={() => {
                          setSearch('');
                          setSelectedCategory('All');
                        }}
                        className="mt-4 px-3.5 py-1.8 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-sm"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                )}
              </AnimatePresence>

            </div>

          </div>
        )}
      </main>

      {/* Online Document PDF reader modal slideout overlay */}
      {activePdf && (
        <PdfDetailModal
          pdf={activePdf}
          onClose={() => setActivePdf(null)}
          onDownload={handleDownloadPdf}
          darkMode={darkMode}
        />
      )}

      {/* Elegant minimalist academic footer */}
      <footer className={`border-t py-10 mt-20 text-xs transition-colors ${
        darkMode ? 'border-zinc-900 bg-zinc-950 text-zinc-500' : 'border-zinc-200 bg-white text-zinc-500'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-6 rounded flex items-center justify-center border font-bold ${
              darkMode ? 'bg-zinc-900 border-zinc-800 text-indigo-400' : 'bg-zinc-50 border-zinc-200 text-indigo-600'
            }`}>
              C
            </div>
            <span className="font-semibold">College Seamester PDF Platform</span>
            <span>•</span>
            <span>IndexedDB Core Local Sync</span>
          </div>

          <div className="flex items-center space-x-1">
            <span>Formulated for students with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>using React</span>
          </div>

          <div className="flex items-center space-x-3.5">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-indigo-400 transition-colors flex items-center space-x-1.5"
            >
              <Github className="w-4 h-4" />
              <span>Platform Docs</span>
            </a>
          </div>

        </div>
      </footer>
    </div>
  );
}
