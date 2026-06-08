import { BookOpen, Cpu, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  pdfCount: number;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Header({ pdfCount, darkMode, toggleDarkMode }: HeaderProps) {
  return (
    <header className={`border-b sticky top-0 z-50 transition-all ${
      darkMode 
        ? 'border-zinc-800 bg-zinc-950/85 text-white backdrop-blur-md' 
        : 'border-zinc-150 bg-white/80 text-zinc-900 backdrop-blur-md'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Brand/Logo Layout */}
          <div className="flex items-center space-x-3.5">
            <div className={`relative flex items-center justify-center w-11 h-11 rounded-xl shadow-md overflow-hidden group transition-colors ${
              darkMode ? 'bg-indigo-500 shadow-indigo-950/30' : 'bg-indigo-600 shadow-indigo-100'
            }`}>
              <BookOpen className="w-5 h-5 text-white absolute transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-700/0 via-white/10 to-white/20"></div>
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <span className={`font-display font-bold text-lg leading-tight tracking-tight transition-colors ${
                  darkMode ? 'text-white' : 'text-zinc-900'
                }`}>
                  College Seamester
                </span>
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold font-mono tracking-wider uppercase border transition-colors ${
                  darkMode 
                    ? 'bg-zinc-900 text-indigo-400 border-zinc-800' 
                    : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                }`}>
                  v3.0
                </span>
              </div>
              <p className={`text-xs font-sans tracking-tight transition-colors ${
                darkMode ? 'text-zinc-450' : 'text-zinc-500'
              }`}>
                College Shared Ledger Engine
              </p>
            </div>
          </div>

          {/* Actions: Database file count & Dark mode switcher */}
          <div className="flex items-center space-x-3">
            {/* Database Counter badge */}
            <div className={`inline-flex items-center px-3.5 py-2 rounded-xl text-[11px] font-semibold font-mono border transition-all ${
              darkMode 
                ? 'bg-zinc-900 border-zinc-800 text-zinc-400' 
                : 'bg-zinc-50 border-zinc-150 text-zinc-600'
            }`}>
              <Cpu className="w-3.5 h-3.5 mr-1.5 text-indigo-500 animate-pulse" />
              LEDGER:{pdfCount}
            </div>

            {/* Dark & White Mode Toggler Button */}
            <button
              id="theme-toggle-btn"
              onClick={toggleDarkMode}
              className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center shadow-sm relative overflow-hidden active:scale-95 ${
                darkMode 
                  ? 'bg-zinc-900 border-zinc-800 text-yellow-400 hover:text-yellow-300 hover:bg-zinc-850' 
                  : 'bg-white border-zinc-200 text-zinc-600 hover:text-indigo-650 hover:bg-zinc-50'
              }`}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <motion.div
                initial={{ rotate: -30, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                key={darkMode ? "dark" : "light"}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="flex items-center justify-center"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </motion.div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
