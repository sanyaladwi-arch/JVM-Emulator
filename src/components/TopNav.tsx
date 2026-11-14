import React, { useState } from 'react';
import { Cpu, Terminal, FileCode, BookOpen, Download, Trophy, Palette, Sparkles, Shield, Zap } from 'lucide-react';

export type ActiveTab = 'debugger' | 'editor' | 'leetcode' | 'codebase' | 'specs';
export type UiTheme = 'cyber' | 'enterprise' | 'neon';

interface TopNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onQuickReset?: () => void;
  onDownloadZip?: () => void;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  stepCount: number;
  theme: UiTheme;
  onThemeChange: (theme: UiTheme) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onTabChange,
  onDownloadZip,
  status,
  stepCount,
  theme,
  onThemeChange,
}) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  return (
    <header className="flex items-center justify-between gap-4 px-6 py-2.5 border-b border-white/[0.08] bg-slate-950/80 backdrop-blur-xl text-slate-100 select-none z-30 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]">
      {/* Brand Identity Wordmark & Silicon Node */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/30 via-purple-500/15 to-emerald-500/20 border border-white/10 flex items-center justify-center text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.25)]">
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950 shadow-[0_0_8px_#10b981]" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-white whitespace-nowrap bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
              JVM Bytecode Studio
            </span>
            <span className="text-[10px] bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-mono font-medium shadow-[0_0_8px_rgba(99,102,241,0.2)]">
              JDK 17 Spec
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono tracking-tight">
            Runtime Areas · D3 Heap Topology · LeetCode Engine
          </span>
        </div>
      </div>

      {/* Main Navigation Segmented Tabs */}
      <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-900/60 backdrop-blur-md border border-white/[0.08] rounded-xl text-xs font-medium text-slate-400 shadow-inner">
        <button
          onClick={() => onTabChange('debugger')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap ${
            activeTab === 'debugger'
              ? 'bg-slate-800/90 text-emerald-400 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.2)] border border-emerald-500/30'
              : 'hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>Execution Debugger</span>
        </button>

        <button
          onClick={() => onTabChange('leetcode')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap ${
            activeTab === 'leetcode'
              ? 'bg-slate-800/90 text-amber-400 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.2)] border border-amber-500/30'
              : 'hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>LeetCode Problems</span>
          <span className="text-[9px] bg-amber-950/60 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded-full font-mono font-bold">
            26+
          </span>
        </button>

        <button
          onClick={() => onTabChange('editor')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap ${
            activeTab === 'editor'
              ? 'bg-slate-800/90 text-cyan-400 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.2)] border border-cyan-500/30'
              : 'hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-cyan-400" />
          <span>Bytecode Studio</span>
        </button>

        <button
          onClick={() => onTabChange('specs')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap ${
            activeTab === 'specs'
              ? 'bg-slate-800/90 text-indigo-400 font-semibold shadow-[0_0_12px_rgba(99,102,241,0.2)] border border-indigo-500/30'
              : 'hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>Architecture Specs</span>
        </button>

        <button
          onClick={() => onTabChange('codebase')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap ${
            activeTab === 'codebase'
              ? 'bg-slate-800/90 text-purple-400 font-semibold shadow-[0_0_12px_rgba(168,85,247,0.2)] border border-purple-500/30'
              : 'hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span>Java Maven Tree</span>
        </button>
      </nav>

      {/* Right Action Bar, Theme Switcher & VM State */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Theme Picker Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900/70 border border-white/10 rounded-lg hover:bg-slate-800/80 hover:text-white transition-all shadow-sm"
            title="Choose Visual Theme Aesthetic"
          >
            <Palette className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline capitalize">
              {theme === 'cyber' ? 'Cyber-Glass' : theme === 'enterprise' ? 'Enterprise' : 'Neon Dark'}
            </span>
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-white/[0.06]">
                Theme Aesthetic
              </div>
              <button
                onClick={() => {
                  onThemeChange('cyber');
                  setShowThemeMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-800/70 transition-colors ${
                  theme === 'cyber' ? 'text-emerald-400 font-semibold bg-emerald-950/30' : 'text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cyber-Terminal Glass</span>
                </div>
                {theme === 'cyber' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />}
              </button>

              <button
                onClick={() => {
                  onThemeChange('enterprise');
                  setShowThemeMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-800/70 transition-colors ${
                  theme === 'enterprise' ? 'text-indigo-400 font-semibold bg-indigo-950/30' : 'text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Enterprise Minimalist</span>
                </div>
                {theme === 'enterprise' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_6px_#6366f1]" />}
              </button>

              <button
                onClick={() => {
                  onThemeChange('neon');
                  setShowThemeMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-800/70 transition-colors ${
                  theme === 'neon' ? 'text-cyan-400 font-semibold bg-cyan-950/30' : 'text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>OLED Neon Glow</span>
                </div>
                {theme === 'neon' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />}
              </button>
            </div>
          )}
        </div>

        {/* Real-time VM State & Cycle Indicator */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-300 font-mono tabular-nums bg-slate-900/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/[0.08] shadow-inner">
          <span className="text-slate-500">CYCLE</span>
          <span className="text-emerald-400 font-bold">{stepCount}</span>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'running'
                  ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_#f59e0b]'
                  : status === 'completed'
                  ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                  : status === 'error'
                  ? 'bg-rose-400 shadow-[0_0_8px_#f43f5e]'
                  : 'bg-slate-400'
              }`}
            />
            <span
              className={`font-semibold uppercase tracking-wider text-[11px] ${
                status === 'completed'
                  ? 'text-emerald-400'
                  : status === 'running'
                  ? 'text-amber-400'
                  : status === 'error'
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {status}
            </span>
          </div>
        </div>

        {/* Maven ZIP Exporter */}
        {onDownloadZip && (
          <button
            onClick={onDownloadZip}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 border border-white/10 rounded-lg hover:border-emerald-500/40 hover:text-white transition-all whitespace-nowrap shadow-sm hover:shadow-[0_0_12px_rgba(16,185,129,0.15)]"
            title="Download complete Maven project with all Java sources as ZIP"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export ZIP</span>
          </button>
        )}
      </div>
    </header>
  );
};
