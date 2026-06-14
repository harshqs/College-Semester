import { useState, useEffect } from 'react';
import { Download, FileText, Moon, Sun, GraduationCap, Sparkles, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PDF_URL = 'https://raw.githubusercontent.com/harshqs/College-Semester/main/Introduction%20of%20C++.pdf';
const PDF_NAME = 'Introduction to C++.pdf';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [splash, setSplash] = useState(true);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing...');

  useEffect(() => {
    const messages = [
      { at: 0,  text: 'Initializing...' },
      { at: 15, text: 'Loading modules...' },
      { at: 35, text: 'Syncing notes...' },
      { at: 55, text: 'Fetching resources...' },
      { at: 75, text: 'Almost ready...' },
      { at: 90, text: 'Welcome!' },
    ];
    const totalMs = 10000;
    const tickMs = 100;
    const steps = totalMs / tickMs;
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      const pct = Math.min(Math.round((current / steps) * 100), 100);
      setProgress(pct);
      const msg = [...messages].reverse().find(m => pct >= m.at);
      if (msg) setStatusText(msg.text);
      if (current >= steps) {
        clearInterval(interval);
        setTimeout(() => setSplash(false), 400);
      }
    }, tickMs);
    return () => clearInterval(interval);
  }, []);

  const handleDownload = () => {
    const anchor = document.createElement('a');
    anchor.href = PDF_URL;
    anchor.download = PDF_NAME;
    anchor.target = '_blank';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-zinc-900'}`}>

      {/* ── SPLASH SCREEN ── */}
      <AnimatePresence>
        {splash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04, filter: 'blur(12px)' }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 overflow-hidden"
          >
            {/* Animated background blobs */}
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-96 sm:h-96 rounded-full bg-indigo-600 blur-[80px] sm:blur-[120px]"
              />
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute bottom-1/4 right-1/4 w-40 h-40 sm:w-80 sm:h-80 rounded-full bg-violet-600 blur-[80px] sm:blur-[120px]"
              />
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.15, 0.08] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 sm:w-64 sm:h-64 rounded-full bg-blue-500 blur-[60px] sm:blur-[100px]"
              />
            </div>

            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.04)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8 px-4 sm:px-6 text-center w-full max-w-xs sm:max-w-md">

              {/* Logo */}
              <motion.div
                initial={{ scale: 0, rotate: -20, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 150, damping: 15, delay: 0.1 }}
                className="relative"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
                  <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300" />
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="space-y-2"
              >
                <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                  <BookOpen className="w-3 h-3 text-indigo-400" />
                  <span className="text-[10px] font-mono text-indigo-300 tracking-widest uppercase">Notes Portal</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none">
                  Code
                  <span className="block bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                    Pe Charcha
                  </span>
                </h1>
                <p className="text-zinc-400 text-xs sm:text-sm">Your notes. Anytime. Anywhere.</p>
              </motion.div>

              {/* Progress bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full space-y-2"
              >
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    style={{ width: `${progress}%` }}
                    transition={{ ease: 'easeOut', duration: 0.1 }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono text-zinc-500">
                  <motion.span
                    key={statusText}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-zinc-400"
                  >
                    {statusText}
                  </motion.span>
                  <span className="text-indigo-400 font-bold">{progress}%</span>
                </div>
              </motion.div>

              {/* Skip */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                onClick={() => setSplash(false)}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer underline underline-offset-2"
              >
                Skip intro
              </motion.button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <header className={`border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm ${
        darkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/90 border-zinc-200'
      }`}>
        <motion.div
          whileHover={{ scale: 1.04 }}
          transition={{ type: 'spring', stiffness: 400 }}
          className="flex items-center gap-2 cursor-default"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 transition-shadow hover:shadow-lg hover:shadow-indigo-500/40">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">Code Pe Charcha</span>
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400 }}
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'}`}
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </motion.button>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: splash ? 0 : 1, y: splash ? 24 : 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-xs sm:max-w-sm flex flex-col items-center gap-6 sm:gap-8"
        >
          {/* Heading */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">My Notes</h1>
            <p className={`text-xs sm:text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Your study material, ready to download
            </p>
          </div>

          {/* PDF Card */}
          <motion.div
            whileHover={{ y: -6, boxShadow: '0 25px 50px -12px rgba(99,102,241,0.25)' }}
            transition={{ type: 'spring', stiffness: 250, damping: 20 }}
            className={`w-full rounded-2xl border p-5 sm:p-7 flex flex-col items-center gap-4 sm:gap-5 shadow-xl transition-colors ${
              darkMode ? 'bg-zinc-900 border-zinc-800 shadow-indigo-950/30' : 'bg-white border-zinc-200 shadow-zinc-200/60'
            }`}>

            {/* PDF icon */}
            <motion.div
              whileHover={{ scale: 1.12, rotate: -6 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 cursor-pointer"
            >
              <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </motion.div>

            {/* File name */}
            <h2 className="font-bold text-lg sm:text-xl text-center">Introduction to C++</h2>

            {/* Download button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.04, boxShadow: '0 10px 30px -5px rgba(99,102,241,0.5)' }}
              transition={{ type: 'spring', stiffness: 350 }}
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 sm:gap-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
            >
              <motion.span
                whileHover={{ x: -2 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <Download className="w-4 h-4 shrink-0" />
              </motion.span>
              Download PDF
            </motion.button>

          </motion.div>
        </motion.div>
      </main>

      {/* ── FOOTER ── */}
      <footer className={`text-center text-xs py-4 sm:py-5 px-4 ${darkMode ? 'text-zinc-700' : 'text-zinc-400'}`}>
        Code Pe Charcha · Notes Portal
      </footer>

    </div>
  );
}
