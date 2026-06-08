import { useState, useEffect, useMemo } from 'react';
import { X, Download, GitBranch, Share2, ZoomIn, ZoomOut, Maximize2, FileText, ChevronLeft, ChevronRight, BookOpen, Layers, Check, Link, Eye } from 'lucide-react';
import { PDFDocument } from '../types';
import { parseGitHubUrl } from '../utils';

interface PdfDetailModalProps {
  pdf: PDFDocument | null;
  onClose: () => void;
  onDownload: (pdf: PDFDocument) => void;
  darkMode: boolean;
}

export default function PdfDetailModal({ pdf, onClose, onDownload, darkMode }: PdfDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'reader' | 'embed'>('reader');
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(105);
  const [isCopied, setIsCopied] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // If the document is updated, reset states
  useEffect(() => {
    setPage(1);
    setZoom(105);
    setIsCopied(false);
  }, [pdf]);

  // Decode PDF base64 file data into an ObjectURL for native browser embed
  useEffect(() => {
    if (pdf && pdf.fileData) {
      try {
        let cleanBase64 = pdf.fileData;
        if (cleanBase64.includes('base64,')) {
          cleanBase64 = cleanBase64.split('base64,')[1];
        }
        
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);

        return () => {
          if (url) URL.revokeObjectURL(url);
        };
      } catch (e) {
        console.error('Error creating PDF blob object URL:', e);
      }
    }
  }, [pdf]);

  const githubDetails = pdf ? parseGitHubUrl(pdf.githubUrl) : null;

  // Handle Shareable copy trigger
  const handleCopyLink = () => {
    if (!pdf) return;
    const shareText = `📚 ${pdf.title} (${pdf.fileSize})\n📦 Hosted source: ${pdf.githubUrl}\n📥 Get from College Seamester Portal!`;
    navigator.clipboard.writeText(shareText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Structured pages mocking logic to provide a highly interactive, reliable reader interface inside any sandboxed environment!
  const simulatedPages = useMemo(() => {
    if (!pdf) return [];
    
    return [
      {
        pageNumber: 1,
        title: 'Title Registration & Cover Abstract',
        subtitle: pdf.title,
        content: `
# College Seamester Secure Metadata Registry
--------------------------------------------------
DOCUMENT_ID      : ${pdf.id}
PUBLICATION TITLE: ${pdf.title}
FILE IDENTIFIERS : ${pdf.fileName}
OCTET STORAGE ID : ${pdf.fileSize}
TIMESTAMP INDEX  : ${pdf.uploadedAt}

## Document Abstract Outline
${pdf.description || 'This document acts as an open-source technical ledger, guide, cheatsheet or reference manual. Please access page 2 for the catalog schema, code indexes, and table of contents.'}
        `,
        notes: 'Metadata index generated automatically upon database registration.'
      },
      {
        pageNumber: 2,
        title: 'Master Table of Contents & Structure Schema',
        subtitle: 'Index Scheme',
        content: `
## Technical Highlights & Covered Subjects
--------------------------------------------------
* Sector I   - Fundamental Concepts, Architectures, and Definitions
* Sector II  - Syntax Specifications & Core Variables Declarations
* Sector III - Deployment Mirroring Setup & Best Practice Guidelines
* Sector IV  - Source Code Mirror, Integration, and References (Git)

## Assigned Portal Classification
* CATEGORY   : ${pdf.category}
* KEYTAGS    : ${pdf.tags.join(', ') || 'none'}
* LINK SOURCE: ${pdf.githubUrl}
        `,
        notes: 'Category assignments allow quick catalog searching.'
      },
      {
        pageNumber: 3,
        title: 'Technical Implementation Details',
        subtitle: 'Reference Sheet',
        content: `
## Reference Cheat Sheet Spec
--------------------------------------------------
This ebook file provides modern programmatic commands and structures mapping directly with the resources hosted in repository files.

For developers seeking absolute precision:
1. Ensure your workspace is updated with the respective dependencies.
2. Confirm matching code declarations before production bundling.
3. Access direct source codes hosted at the dedicated mirror URL below:
   URL: ${pdf.githubUrl}
        `,
        notes: 'Access details can be downloaded directly using the "Get PDF Document" CTA.'
      }
    ];
  }, [pdf]);

  if (!pdf) return null;

  const activePageData = simulatedPages[page - 1] || simulatedPages[0];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div 
        className={`w-full max-w-6xl h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border animate-in fade-in zoom-in-95 duration-250 ${
          darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Top bar header */}
        <div className={`px-5 sm:px-6 py-4 flex items-center justify-between border-b ${
          darkMode ? 'bg-zinc-950 text-white border-zinc-800' : 'bg-zinc-900 text-white border-zinc-850'
        }`}>
          <div className="flex items-center space-x-3.5 max-w-[70%]">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden ${
              darkMode ? 'bg-indigo-505' : 'bg-indigo-600'
            }`}>
              <FileText className="w-5.5 h-5.5 text-white" />
            </div>
            <div className="truncate">
              <h2 className="font-display font-semibold text-sm sm:text-[15px] truncate text-white" title={pdf.title}>
                {pdf.title}
              </h2>
              <p className="text-[10px] text-zinc-400 font-mono flex items-center space-x-2 mt-0.5">
                <span className="text-zinc-500 uppercase tracking-wider">{pdf.category}</span>
                <span>•</span>
                <span>{pdf.fileSize}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              id="detail-modal-download-btn"
              onClick={() => onDownload(pdf)}
              className="px-3.5 py-1.8 bg-indigo-600 hover:bg-indigo-705 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Get PDF</span>
            </button>

            <button
              id="detail-modal-share-btn"
              onClick={handleCopyLink}
              className={`p-1.8 rounded-lg border transition-colors flex items-center justify-center cursor-pointer ${
                isCopied 
                  ? 'bg-emerald-600 border-emerald-600 text-white' 
                  : 'bg-zinc-800 hover:bg-zinc-755 border-zinc-750 hover:border-zinc-700 text-zinc-300 hover:text-white'
              }`}
              title="Copy citation to clipboard"
            >
              {isCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              id="detail-modal-close-btn"
              onClick={onClose}
              className="p-1.8 rounded-lg bg-zinc-800 hover:bg-zinc-755 border border-zinc-750 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Close viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sidebar Info & Reader Canvas */}
        <div className={`flex-1 flex flex-col md:flex-row overflow-hidden ${
          darkMode ? 'bg-zinc-950' : 'bg-zinc-50'
        }`}>
          
          {/* Side Info details bar */}
          <div className={`w-full md:w-80 border-b md:border-b-0 md:border-r p-5 space-y-5 overflow-y-auto custom-scrollbar shrink-0 ${
            darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-800'
          }`}>
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">Document Metadata</span>
              <h3 className={`text-sm font-semibold mt-1 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{pdf.title}</h3>
              <p className="text-xs text-zinc-505 leading-relaxed mt-2">
                {pdf.description || "No abstract details available."}
              </p>
            </div>

            <div className="h-px bg-zinc-150"></div>

            <div className="space-y-2.5">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">Repository Link Details</span>
              {githubDetails ? (
                <div className="space-y-1.5 font-mono text-[11px] text-zinc-650 bg-zinc-50 p-3 rounded-lg border border-zinc-205">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Owner:</span>
                    <span className="font-semibold text-zinc-800">{githubDetails.owner}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-150 pt-1.5">
                    <span className="text-zinc-400">Repository Name:</span>
                    <span className="font-semibold text-zinc-800 max-w-[120px] truncate" title={githubDetails.repo}>{githubDetails.repo}</span>
                  </div>
                  <div className="flex flex-col pt-1.5 border-t border-zinc-150">
                    <span className="text-zinc-400 mb-1">GitHub Mirror Source URL:</span>
                    <a
                      href={pdf.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline break-all"
                    >
                      {pdf.githubUrl}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="font-mono text-[11px] text-zinc-650 bg-zinc-50 p-2.5 rounded-lg border border-zinc-205 leading-relaxed">
                  <p className="text-zinc-400">Direct External URL Source:</p>
                  <a
                    href={pdf.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-605 hover:underline break-all block mt-1"
                  >
                    {pdf.githubUrl}
                  </a>
                </div>
              )}
            </div>
            <div className="h-px bg-zinc-150"></div>

            {/* Keyword Chips */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">Document Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {pdf.tags && pdf.tags.length > 0 ? (
                  pdf.tags.map((tag, i) => (
                    <span
                      key={`modal-tag-${i}`}
                      className={`px-2 py-0.5 border text-[10px] font-mono rounded ${
                        darkMode 
                          ? 'bg-zinc-800 border-zinc-700 text-zinc-300' 
                          : 'bg-zinc-100 border-zinc-200 text-zinc-650'
                      }`}
                    >
                      #{tag.trim()}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-zinc-400 italic">No keywords assigned.</span>
                )}
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold mb-2">Toggle Viewer Mode</span>
              <div className={`grid grid-cols-2 gap-1.5 p-1 rounded-lg border ${
                darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
              }`}>
                <button
                  id="tab-reader-mode-btn"
                  onClick={() => setActiveTab('reader')}
                  className={`py-1.5 text-xs font-semibold rounded-md flex items-center justify-center space-x-1 cursor-pointer transition-all ${
                    activeTab === 'reader'
                      ? (darkMode ? 'bg-zinc-800 text-white shadow' : 'bg-white text-zinc-900 shadow-sm')
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Interactive</span>
                </button>
                <button
                  id="tab-embed-mode-btn"
                  onClick={() => {
                    setActiveTab('embed');
                    if (!objectUrl) {
                      console.warn("Raw PDF data payload not ready.");
                    }
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-md flex items-center justify-center space-x-1 cursor-pointer transition-all ${
                    activeTab === 'embed'
                      ? (darkMode ? 'bg-zinc-800 text-white shadow' : 'bg-white text-zinc-900 shadow-sm')
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                  title="Render native PDF using browser reader plugin"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Native PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Core Reader Canvas Stage */}
          <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
            
            {activeTab === 'reader' ? (
              /* Simulated high end Reader Mode */
              <>
                {/* Control toolbar */}
                <div className={`border-b px-4 py-2 flex items-center justify-between shadow-sm z-10 ${
                  darkMode ? 'bg-zinc-900 border-zinc-850 text-white' : 'bg-white border-zinc-200 text-zinc-800'
                }`}>
                  <div className="flex items-center space-x-3.5">
                    <span className="text-xs font-semibold text-zinc-500 font-mono">
                      CHAPTER {page} OF {simulatedPages.length}
                    </span>
                    <span className="text-zinc-200">|</span>
                    <span className={`text-xs font-sans truncate max-w-[200px] font-medium ${
                      darkMode ? 'text-zinc-200' : 'text-zinc-800'
                    }`}>
                      {activePageData.title}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      id="zoom-out-reader-btn"
                      onClick={() => setZoom(z => Math.max(z - 10, 80))}
                      className="p-1 px-1.5 rounded hover:bg-zinc-100 text-zinc-500 hover:text-zinc-850 cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-semibold font-mono text-zinc-400">
                      {zoom}%
                    </span>
                    <button
                      id="zoom-in-reader-btn"
                      onClick={() => setZoom(z => Math.min(z + 10, 150))}
                      className="p-1 px-1.5 rounded hover:bg-zinc-100 text-zinc-500 hover:text-zinc-850 cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Page Canvas stage */}
                <div className="flex-1 overflow-auto p-6 sm:p-10 flex items-start justify-center custom-scrollbar">
                  <div 
                    className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-zinc-150 p-6 sm:p-10 transition-all font-mono"
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                  >
                    {/* Fake structural watermarks representing real systems */}
                    <div className="flex justify-between items-center text-[10px] text-zinc-350 border-b border-zinc-150 pb-3 mb-5 uppercase tracking-wider font-semibold">
                      <span>COLLEGE SEAMESTER DOCUMENT CLOUD MIRROR</span>
                      <span>PAGE {page} REFERENCE</span>
                    </div>

                    <div className="text-zinc-800 text-xs leading-relaxed whitespace-pre-wrap font-mono">
                      {activePageData.content.trim()}
                    </div>

                    <div className="border-t border-dashed border-zinc-200 pt-3 mt-8 flex justify-between items-center text-[10px] text-zinc-400">
                      <span>Index notes: {activePageData.notes}</span>
                      <span className="bg-zinc-50 px-2 py-0.5 border border-zinc-150 font-semibold uppercase font-mono">LOCAL_MIRROR_ID</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Pagination controls */}
                <div className="bg-white border-t border-zinc-200 px-6 py-3 flex items-center justify-between">
                  <button
                    id="prev-chapter-btn"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    className="flex items-center space-x-1 px-3 py-1.8 bg-zinc-50 hover:bg-zinc-100 text-zinc-650 disabled:opacity-40 disabled:hover:bg-zinc-50 text-xs font-semibold rounded-lg border border-zinc-200 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous page</span>
                  </button>

                  <span className="text-xs font-semibold text-zinc-600 font-mono">
                    {page} / {simulatedPages.length}
                  </span>

                  <button
                    id="next-chapter-btn"
                    disabled={page === simulatedPages.length}
                    onClick={() => setPage(p => Math.min(p + 1, simulatedPages.length))}
                    className="flex items-center space-x-1 px-3 py-1.8 bg-zinc-50 hover:bg-zinc-100 text-zinc-650 disabled:opacity-40 disabled:hover:bg-zinc-50 text-xs font-semibold rounded-lg border border-zinc-200 transition-all cursor-pointer"
                  >
                    <span>Next page</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              /* Core Native embed using ObjectURL */
              <div className="flex-1 w-full h-full relative p-2 sm:p-4 bg-zinc-900 flex items-center justify-center">
                {objectUrl ? (
                  <iframe
                    id="raw-pdf-native-iframe"
                    src={`${objectUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                    className="w-full h-full rounded-xl bg-whites overflow-hidden border border-zinc-800"
                    title={pdf.title}
                  />
                ) : (
                  <div className="text-center space-y-3.5 p-6 max-w-sm rounded-xl bg-zinc-850 border border-zinc-800 text-zinc-300">
                    <X className="w-8 h-8 text-red-500 mx-auto" />
                    <h4 className="font-semibold text-sm">Inline Preview Not Loaded</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      This seeded document metadata is active but uses a mock binary. Real files uploaded via the "Creator Studio" tab will load beautifully in native embed frames.
                    </p>
                    <button
                      id="embed-fail-download-btn"
                      onClick={() => onDownload(pdf)}
                      className="inline-flex items-center space-x-1 px-3.5 py-1.8 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download file directly</span>
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
