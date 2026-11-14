import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Layers,
  HardDrive,
  Database,
  ArrowRight,
  Terminal,
  Search,
  Sparkles,
  Code,
  Trophy,
  Cpu,
  Edit3,
  FileCode,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Columns,
  Eye,
  Sliders,
  Check,
  X,
  RefreshCw,
  Palette,
} from 'lucide-react';
import { ExecutionSnapshot, InstructionIR, JvmValue, StepTraceEntry } from '../jvm/types';
import { SampleProgramDef, SAMPLE_PROGRAMS } from '../jvm/samples';
import { JvmArchitectureArt } from './JvmArchitectureArt';
import { JvmHeapD3Visualizer } from './JvmHeapD3Visualizer';
import { JavaCompiler } from '../jvm/javaCompiler';
import { BytecodeParser } from '../jvm/parser';
import { UiTheme } from './TopNav';

interface DebuggerViewProps {
  snapshot: ExecutionSnapshot;
  instructions: InstructionIR[];
  traces: StepTraceEntry[];
  selectedProgram: SampleProgramDef;
  programArgs: number[];
  onProgramChange: (prog: SampleProgramDef) => void;
  onArgsChange: (args: number[]) => void;
  onStep: () => void;
  onRun: () => void;
  onPause: () => void;
  onReset: () => void;
  onToggleBreakpoint: (pc: number) => void;
  speedMs: number;
  onSpeedChange: (ms: number) => void;
  onEditInAssembler?: () => void;
  onOpenLeetCode?: () => void;
  uiTheme?: UiTheme;
  onThemeChange?: (theme: UiTheme) => void;
}

type PanelId =
  | 'source'
  | 'disassembly'
  | 'callStack'
  | 'operandStack'
  | 'lvt'
  | 'heap';

type LayoutMode = 'standard' | 'codeFocus' | 'memoryFocus';

export const DebuggerView: React.FC<DebuggerViewProps> = ({
  snapshot,
  instructions,
  traces,
  selectedProgram,
  programArgs,
  onProgramChange,
  onArgsChange,
  onStep,
  onRun,
  onPause,
  onReset,
  onToggleBreakpoint,
  speedMs,
  onSpeedChange,
  onEditInAssembler,
  onOpenLeetCode,
  uiTheme = 'cyber',
}) => {
  const [showArchitectureArt, setShowArchitectureArt] = useState(false);
  const [heapDisplayMode, setHeapDisplayMode] = useState<'d3' | 'raw'>('d3');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('standard');
  const [maximizedPanel, setMaximizedPanel] = useState<PanelId | null>(null);

  // Panel Collapsed States
  const [collapsedPanels, setCollapsedPanels] = useState<Record<PanelId, boolean>>({
    source: false,
    disassembly: false,
    callStack: false,
    operandStack: false,
    lvt: false,
    heap: false,
  });

  const togglePanelCollapse = (panelId: PanelId) => {
    setCollapsedPanels((prev) => ({
      ...prev,
      [panelId]: !prev[panelId],
    }));
  };

  const bytecodeContainerRef = useRef<HTMLDivElement>(null);

  // Interactive Java Source Editor State
  const [isEditingJava, setIsEditingJava] = useState(false);
  const [editedJavaSource, setEditedJavaSource] = useState(selectedProgram.javaSourceSnippet);
  const [javaCompileError, setJavaCompileError] = useState<string | null>(null);
  const [javaCompileSuccess, setJavaCompileSuccess] = useState(false);

  useEffect(() => {
    setEditedJavaSource(selectedProgram.javaSourceSnippet);
    setJavaCompileError(null);
    setJavaCompileSuccess(false);
  }, [selectedProgram]);

  const handleApplyJavaEdit = () => {
    try {
      setJavaCompileError(null);
      setJavaCompileSuccess(false);

      const res = JavaCompiler.compile(editedJavaSource);
      if (!res.success) {
        throw new Error(res.errorMessage || 'Java compilation failed');
      }

      // Verify bytecode assembly
      BytecodeParser.assemble(res.assemblySource);

      const updatedProgram: SampleProgramDef = {
        ...selectedProgram,
        name: res.methodName ? `${res.methodName}()` : selectedProgram.name,
        className: res.className || selectedProgram.className,
        methodName: res.methodName || selectedProgram.methodName,
        descriptor: res.descriptor || selectedProgram.descriptor,
        javaSourceSnippet: editedJavaSource,
        assemblySource: res.assemblySource,
      };

      onProgramChange(updatedProgram);
      setJavaCompileSuccess(true);
      setTimeout(() => setJavaCompileSuccess(false), 3000);
    } catch (e: any) {
      setJavaCompileError(e.message || String(e));
    }
  };

  // Auto-scroll bytecode list to active PC
  useEffect(() => {
    if (bytecodeContainerRef.current) {
      const activeElem = bytecodeContainerRef.current.querySelector('[data-active-pc="true"]');
      if (activeElem) {
        activeElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [snapshot.pc]);

  const isCustomProgram = !SAMPLE_PROGRAMS.some((p) => p.id === selectedProgram.id);

  const cardBgStyle =
    uiTheme === 'neon'
      ? 'bg-[#0c0e17]/95 border-cyan-500/25 shadow-[0_0_20px_rgba(6,182,212,0.06)]'
      : uiTheme === 'enterprise'
      ? 'bg-[#13151f] border-[#252837] shadow-sm'
      : 'bg-slate-900/60 backdrop-blur-md border-white/[0.08] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.45)]';

  // Common Panel Header Component
  const renderPanelHeader = (
    panelId: PanelId,
    title: string,
    icon: React.ReactNode,
    badgeText?: string | React.ReactNode,
    actions?: React.ReactNode
  ) => {
    const isCollapsed = collapsedPanels[panelId];

    return (
      <div
        className={`flex items-center justify-between px-3.5 py-2 select-none shrink-0 transition-colors ${
          uiTheme === 'neon'
            ? 'bg-[#0f121e]/90 border-b border-cyan-500/20'
            : uiTheme === 'enterprise'
            ? 'bg-[#181a24] border-b border-[#282c37]'
            : 'bg-slate-900/80 backdrop-blur-md border-b border-white/[0.08]'
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => togglePanelCollapse(panelId)}
            className="text-slate-400 hover:text-slate-200 transition-colors p-0.5 rounded hover:bg-white/5"
            title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 tracking-wide">
            {icon}
            <span>{title}</span>
          </div>
          {badgeText && (
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                uiTheme === 'neon'
                  ? 'bg-cyan-950/40 text-cyan-300 border-cyan-500/30'
                  : uiTheme === 'enterprise'
                  ? 'bg-[#202430] text-slate-300 border-[#2f3545]'
                  : 'bg-slate-800/80 text-slate-300 border-white/[0.08]'
              }`}
            >
              {badgeText}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {actions}
          <button
            onClick={() => setMaximizedPanel(maximizedPanel === panelId ? null : panelId)}
            className="p-1 text-slate-400 hover:text-indigo-300 hover:bg-white/5 rounded transition-colors"
            title={maximizedPanel === panelId ? 'Restore view' : 'Maximize panel'}
          >
            {maximizedPanel === panelId ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col h-full overflow-hidden font-sans transition-colors duration-300 ${
        uiTheme === 'neon'
          ? 'bg-[#08090d] text-slate-100'
          : uiTheme === 'enterprise'
          ? 'bg-[#0f1117] text-slate-100'
          : 'bg-[#090d16] text-slate-100'
      }`}
    >
      {/* ======================================================== */}
      {/* 1. TOP APP TOOLBAR & VM ORCHESTRATOR                     */}
      {/* ======================================================== */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 shrink-0 transition-colors ${
          uiTheme === 'neon'
            ? 'bg-[#0c0e14]/90 backdrop-blur-xl border-b border-cyan-500/20 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.7)]'
            : uiTheme === 'enterprise'
            ? 'bg-[#14161f] border-b border-[#232733]'
            : 'bg-slate-900/60 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]'
        }`}
      >
        {/* Left: Program Selection & Test Cases */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Class / Problem:</span>
            <select
              value={selectedProgram.id}
              onChange={(e) => {
                const found = SAMPLE_PROGRAMS.find((p) => p.id === e.target.value);
                if (found) {
                  onProgramChange(found);
                }
              }}
              className="bg-slate-950/80 border border-white/10 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-100 focus:outline-none focus:border-indigo-400 focus:shadow-[0_0_12px_rgba(99,102,241,0.25)] transition-all max-w-[280px] truncate"
            >
              {isCustomProgram && (
                <optgroup label="Custom User Program">
                  <option value={selectedProgram.id}>
                    ★ {selectedProgram.name} ({selectedProgram.className}.{selectedProgram.methodName})
                  </option>
                </optgroup>
              )}
              <optgroup label="LeetCode Interview Problems">
                {SAMPLE_PROGRAMS.filter((p) => p.category === 'leetcode' || p.leetcodeId !== undefined).map((p) => (
                  <option key={p.id} value={p.id}>
                    LC #{p.leetcodeId} [{p.difficulty}] {p.name.replace(/^LeetCode\s+\d+:\s*/, '')}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Math & Numbers">
                {SAMPLE_PROGRAMS.filter((p) => p.category === 'math').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.className}.{p.methodName})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Algorithms & Searching">
                {SAMPLE_PROGRAMS.filter((p) => p.category === 'algo').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.className}.{p.methodName})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Heap Memory & Arrays">
                {SAMPLE_PROGRAMS.filter((p) => p.category === 'heap').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.className}.{p.methodName})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Recursion & Call Stack">
                {SAMPLE_PROGRAMS.filter((p) => p.category === 'recursion').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.className}.{p.methodName})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Bitwise & Low-Level">
                {SAMPLE_PROGRAMS.filter((p) => p.category === 'bitwise').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.className}.{p.methodName})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {onOpenLeetCode && (
            <button
              onClick={onOpenLeetCode}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-amber-950/50 hover:bg-amber-900/70 text-amber-300 border border-amber-500/30 rounded-lg transition-all shadow-[0_0_12px_rgba(245,158,11,0.15)] hover:shadow-[0_0_16px_rgba(245,158,11,0.25)]"
              title="Browse all LeetCode problems with filters and test suites"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>LeetCode Library</span>
            </button>
          )}

          {/* Test Cases Quick Selector */}
          {selectedProgram.testCases && selectedProgram.testCases.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-900/60 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/[0.08] text-xs">
              <span className="text-[10px] text-slate-500 font-mono">Test Cases:</span>
              {selectedProgram.testCases.map((tc, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onArgsChange([...tc.args]);
                    onReset();
                  }}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800/80 hover:bg-indigo-950/60 text-indigo-300 hover:text-indigo-200 border border-white/[0.06] hover:border-indigo-500/40 transition-all hover:shadow-[0_0_8px_rgba(99,102,241,0.25)]"
                  title={`${tc.name}: args [${tc.args.join(', ')}], expected ${tc.expected}`}
                >
                  {tc.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center/Right: Execution Controls & Layout Switches */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Layout Mode Selector */}
          <div className="flex items-center bg-slate-950/70 border border-white/[0.08] rounded-lg p-0.5 text-xs shadow-inner">
            <button
              onClick={() => setLayoutMode('standard')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                layoutMode === 'standard'
                  ? 'bg-slate-800 text-white font-semibold shadow-sm border border-white/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Standard Balanced IDE Panels"
            >
              Standard
            </button>
            <button
              onClick={() => setLayoutMode('codeFocus')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                layoutMode === 'codeFocus'
                  ? 'bg-slate-800 text-white font-semibold shadow-sm border border-white/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Focus on Java Code & Bytecode Disassembly"
            >
              Code Focus
            </button>
            <button
              onClick={() => setLayoutMode('memoryFocus')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                layoutMode === 'memoryFocus'
                  ? 'bg-slate-800 text-white font-semibold shadow-sm border border-white/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Focus on D3 Heap & Stacks"
            >
              Memory Focus
            </button>
          </div>

          {/* Architecture Map Toggle */}
          <button
            onClick={() => setShowArchitectureArt(!showArchitectureArt)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
              showArchitectureArt
                ? 'bg-pink-950/70 border-pink-500/40 text-pink-300 shadow-[0_0_12px_rgba(244,114,182,0.2)]'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-white/10'
            }`}
            title="Toggle interactive JVM Architecture Map"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>JVM Map</span>
          </button>

          {/* Execution Controls */}
          {snapshot.status === 'running' ? (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-lg transition-all shadow-[0_0_16px_rgba(245,158,11,0.35)] border border-amber-400/40"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              Pause
            </button>
          ) : (
            <button
              onClick={onRun}
              disabled={snapshot.status === 'completed' || snapshot.status === 'error'}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-lg disabled:opacity-40 transition-all shadow-[0_0_16px_rgba(16,185,129,0.35)] border border-emerald-400/40"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Run
            </button>
          )}

          <button
            onClick={onStep}
            disabled={snapshot.status === 'running' || snapshot.status === 'completed'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900/80 border border-white/10 text-emerald-400 hover:text-emerald-300 rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-all hover:shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            title="Execute single instruction (Fetch-Decode-Execute)"
          >
            <SkipForward className="w-3.5 h-3.5 text-emerald-400" />
            Step (F7)
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-900/80 border border-white/10 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
            title="Reset VM State, Stack Frames & Heap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10 text-xs text-slate-400">
            <span>Clock:</span>
            <select
              value={speedMs}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              className="bg-slate-950/80 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-400 transition-colors"
            >
              <option value={50}>50ms (Fast)</option>
              <option value={200}>200ms (Normal)</option>
              <option value={500}>500ms (Deliberate)</option>
              <option value={1000}>1s (Slow)</option>
              <option value={0}>0ms (Instant)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Collapsible Architecture Map */}
      {showArchitectureArt && (
        <div className="p-4 border-b border-white/[0.08] bg-slate-950/95 shrink-0">
          <JvmArchitectureArt snapshot={snapshot} activePc={snapshot.pc} compact />
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. DEDICATED MULTI-PANEL WORKBENCH                       */}
      {/* ======================================================== */}
      <div
        className={`flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3.5 p-3.5 overflow-hidden ${
          uiTheme === 'neon'
            ? 'bg-[#08090d]'
            : uiTheme === 'enterprise'
            ? 'bg-[#0d0f15]'
            : 'bg-[#090d16]'
        }`}
      >
        {/* ---------------------------------------------------- */}
        {/* COLUMN 1: SOURCE CODE & BYTECODE INSTRUCTIONS       */}
        {/* ---------------------------------------------------- */}
        <div
          className={`${
            layoutMode === 'codeFocus'
              ? 'lg:col-span-6'
              : layoutMode === 'memoryFocus'
              ? 'lg:col-span-3'
              : 'lg:col-span-4'
          } flex flex-col gap-3.5 h-full overflow-hidden`}
        >
          {/* PANEL 1: SOURCE & JAVA STUDIO PANEL */}
          <div
            className={`flex flex-col ${
              collapsedPanels.source ? 'flex-none' : 'flex-1 min-h-0'
            } rounded-xl border overflow-hidden transition-all ${cardBgStyle}`}
          >
            {renderPanelHeader(
              'source',
              'Java Source / Problem Definition',
              <Code className="w-3.5 h-3.5 text-indigo-400" />,
              <span>High-Level Java</span>,
              <div className="flex items-center gap-1">
                {!isEditingJava ? (
                  <>
                    <button
                      onClick={() => setIsEditingJava(true)}
                      className="flex items-center gap-1 px-2.5 py-0.5 bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 rounded text-[11px] border border-indigo-500/30 transition-all shadow-[0_0_8px_rgba(99,102,241,0.2)]"
                      title="Edit this high-level Java code directly"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    {onEditInAssembler && (
                      <button
                        onClick={onEditInAssembler}
                        className="flex items-center gap-1 px-2 py-0.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded text-[11px] border border-white/10 transition-colors"
                        title="Open in full assembler studio"
                      >
                        <FileCode className="w-3 h-3 text-slate-400" />
                        <span>Studio</span>
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleApplyJavaEdit}
                      className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition-all shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                      title="Compile Java to Bytecode and update JVM"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Compile</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditedJavaSource(selectedProgram.javaSourceSnippet);
                        setJavaCompileError(null);
                        setJavaCompileSuccess(false);
                      }}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded text-[11px] border border-white/10 transition-colors"
                      title="Revert changes"
                    >
                      Revert
                    </button>
                    <button
                      onClick={() => setIsEditingJava(false)}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-[11px] border border-white/10 transition-colors"
                    >
                      Done
                    </button>
                  </>
                )}
              </div>
            )}

            {!collapsedPanels.source && (
              <div className="flex-1 flex flex-col p-3 overflow-hidden bg-slate-950/40">
                {/* Method info metadata strip */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-2 mb-2 border-b border-white/[0.06]">
                  <span className="truncate">
                    class <span className="text-indigo-300 font-semibold">{selectedProgram.className}</span> &rarr;{' '}
                    <span className="text-emerald-300 font-semibold">{selectedProgram.methodName}</span>
                    <span className="text-slate-500">{selectedProgram.descriptor}</span>
                  </span>
                  <span className="text-slate-500 shrink-0">Args: [{programArgs.join(', ')}]</span>
                </div>

                {/* Notifications */}
                {javaCompileError && (
                  <div className="mb-2 p-2 bg-rose-950/80 border border-rose-500/40 rounded-lg text-[11px] font-mono text-rose-300 flex items-start gap-1.5 shrink-0 shadow-[0_0_12px_rgba(244,63,94,0.2)]">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span className="leading-tight">{javaCompileError}</span>
                  </div>
                )}
                {javaCompileSuccess && (
                  <div className="mb-2 p-1.5 bg-emerald-950/80 border border-emerald-500/40 rounded-lg text-[11px] font-mono text-emerald-300 flex items-center gap-1.5 shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Java compiled & loaded into JVM!</span>
                  </div>
                )}

                {/* Editor / Viewer */}
                {isEditingJava ? (
                  <div className="flex-1 flex flex-col min-h-0">
                    <textarea
                      value={editedJavaSource}
                      onChange={(e) => setEditedJavaSource(e.target.value)}
                      className="w-full flex-1 text-[11px] font-mono text-indigo-100 bg-slate-950/90 p-3 rounded-lg border border-indigo-500/40 focus:outline-none focus:border-indigo-400 focus:shadow-[0_0_14px_rgba(99,102,241,0.25)] leading-relaxed resize-none transition-all"
                      placeholder="Write standard Java method with public class or public int..."
                      spellCheck={false}
                    />
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto bg-slate-950/70 p-3 rounded-lg border border-white/[0.08] shadow-inner custom-thin-scrollbar">
                    <pre className="text-[11px] font-mono text-slate-300 leading-relaxed">
                      {selectedProgram.javaSourceSnippet}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PANEL 2: BYTECODE INSTRUCTION STREAM DISASSEMBLY */}
          <div
            className={`flex flex-col ${
              collapsedPanels.disassembly ? 'flex-none' : 'flex-1 min-h-0'
            } rounded-xl border overflow-hidden transition-all ${cardBgStyle}`}
          >
            {renderPanelHeader(
              'disassembly',
              'Bytecode Instruction Stream',
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />,
              <span>
                {instructions.length} instrs · PC: {snapshot.pc}
              </span>
            )}

            {!collapsedPanels.disassembly && (
              <div
                ref={bytecodeContainerRef}
                className="flex-1 overflow-y-auto p-2.5 font-mono text-xs select-none space-y-1 bg-slate-950/40 custom-thin-scrollbar"
              >
                {instructions.map((instr) => {
                  const isActive = snapshot.pc === instr.offset && snapshot.status !== 'completed';
                  const isBreakpoint = snapshot.breakpoints.has(instr.offset);

                  return (
                    <div
                      key={instr.offset}
                      data-active-pc={isActive}
                      onClick={() => onToggleBreakpoint(instr.offset)}
                      className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                        isActive
                          ? uiTheme === 'neon'
                            ? 'bg-cyan-950/90 border border-cyan-400 text-cyan-100 font-semibold shadow-[0_0_18px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400/50'
                            : uiTheme === 'enterprise'
                            ? 'bg-indigo-950/70 border border-indigo-500/60 text-indigo-100 font-semibold shadow-sm ring-1 ring-indigo-500/30'
                            : 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-200 font-semibold shadow-[0_0_14px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/30'
                          : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      {/* Breakpoint Indicator */}
                      <div
                        className={`w-3 h-3 rounded-full flex items-center justify-center shrink-0 transition-opacity ${
                          isBreakpoint
                            ? 'bg-red-500 text-white shadow-[0_0_8px_#f43f5e]'
                            : 'opacity-0 group-hover:opacity-40 border border-slate-600'
                        }`}
                      >
                        {isBreakpoint && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>

                      {/* Active PC Indicator Arrow */}
                      <div className="w-3 text-center shrink-0">
                        {isActive ? (
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-400 animate-pulse drop-shadow-[0_0_6px_#10b981]" />
                        ) : (
                          <span className="text-slate-600 text-[10px]"></span>
                        )}
                      </div>

                      {/* Offset */}
                      <span className="w-9 text-slate-500 text-[11px] tabular-nums shrink-0">
                        {String(instr.offset).padStart(4, '0')}
                      </span>

                      {/* Hex opcode byte */}
                      <span className="w-7 text-slate-600 text-[10px] tabular-nums shrink-0">
                        0x{instr.opcode.toString(16).padStart(2, '0').toUpperCase()}
                      </span>

                      {/* Mnemonic */}
                      <span
                        className={`w-24 shrink-0 font-bold ${
                          isActive
                            ? 'text-emerald-300'
                            : instr.category === 'branch'
                            ? 'text-amber-400'
                            : instr.category === 'invoke'
                            ? 'text-purple-400'
                            : instr.category === 'array'
                            ? 'text-pink-400'
                            : 'text-slate-200'
                        }`}
                      >
                        {instr.mnemonic}
                      </span>

                      {/* Operands */}
                      <span className="text-slate-300 text-xs w-16 truncate">
                        {instr.operands.length > 0 ? instr.operands.join(', ') : ''}
                      </span>

                      {/* Comment Annotation */}
                      {instr.comment && (
                        <span className="text-slate-500 text-[11px] truncate flex-1 font-sans italic">
                          // {instr.comment}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* COLUMN 2: RUNTIME STACKS & LOCAL VARIABLE TABLE     */}
        {/* ---------------------------------------------------- */}
        <div
          className={`${
            layoutMode === 'memoryFocus'
              ? 'lg:col-span-4'
              : layoutMode === 'codeFocus'
              ? 'lg:col-span-3'
              : 'lg:col-span-4'
          } flex flex-col gap-3.5 h-full overflow-hidden`}
        >
          {/* PANEL 3: CALL STACK & THREAD FRAME PANEL */}
          <div
            className={`flex flex-col ${
              collapsedPanels.callStack ? 'flex-none' : 'flex-none'
            } rounded-xl border overflow-hidden transition-all ${cardBgStyle}`}
          >
            {renderPanelHeader(
              'callStack',
              'Call Stack & Thread Frame',
              <Layers className="w-3.5 h-3.5 text-purple-400" />,
              <span>{snapshot.callStack.length} frame(s) · PC: {snapshot.pc}</span>
            )}

            {!collapsedPanels.callStack && (
              <div className="p-3 space-y-2 bg-slate-950/40">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-white/[0.08] shadow-inner">
                    <span className="text-slate-500 text-[10px] block">ACTIVE METHOD</span>
                    <span className="text-slate-100 font-semibold truncate block">
                      {snapshot.currentFrame ? snapshot.currentFrame.methodName : selectedProgram.methodName}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {selectedProgram.descriptor}
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-white/[0.08] shadow-inner">
                    <span className="text-slate-500 text-[10px] block">STACK DEPTH</span>
                    <span className="text-slate-100 font-semibold tabular-nums">
                      {snapshot.callStack.length} frame(s)
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Max Stack: {selectedProgram.maxStack} slots
                    </span>
                  </div>
                </div>

                {/* Return Value / Test Case Outcome Banner */}
                {snapshot.status === 'completed' && snapshot.returnValue && (() => {
                  const matchingTest = selectedProgram.testCases?.find(
                    (tc) => JSON.stringify(tc.args) === JSON.stringify(programArgs)
                  );
                  const isTestMatch = matchingTest && snapshot.returnValue.value === matchingTest.expected;
                  const isTestFail = matchingTest && snapshot.returnValue.value !== matchingTest.expected;

                  return (
                    <div
                      className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-all ${
                        isTestMatch
                          ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.25)]'
                          : isTestFail
                          ? 'bg-rose-950/80 border-rose-500/60 text-rose-200 shadow-[0_0_16px_rgba(244,63,94,0.25)]'
                          : 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200 shadow-[0_0_14px_rgba(16,185,129,0.2)]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <CheckCircle
                          className={`w-4 h-4 shrink-0 ${isTestFail ? 'text-rose-400' : 'text-emerald-400'}`}
                        />
                        <span className="font-semibold truncate">
                          {matchingTest
                            ? isTestMatch
                              ? `Passed ${matchingTest.name}!`
                              : `Failed ${matchingTest.name} (Expected: ${matchingTest.expected})`
                            : 'Execution Completed'}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-xs text-white bg-slate-950/90 px-2.5 py-0.5 rounded border border-white/10 shrink-0 shadow-inner">
                        Ret ={' '}
                        {snapshot.returnValue.type === 'REFERENCE'
                          ? `@0x${snapshot.returnValue.value.toString(16).toUpperCase()}`
                          : snapshot.returnValue.value}
                      </span>
                    </div>
                  );
                })()}

                {snapshot.status === 'error' && (
                  <div className="p-2.5 bg-red-950/80 border border-red-500/50 rounded-lg flex items-center gap-2 text-xs text-red-200 shadow-[0_0_16px_rgba(239,68,68,0.25)]">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{snapshot.errorMessage}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PANEL 4: OPERAND STACK (LIFO) */}
          <div
            className={`flex flex-col ${
              collapsedPanels.operandStack ? 'flex-none' : 'flex-1 min-h-0'
            } rounded-xl border overflow-hidden transition-all ${cardBgStyle}`}
          >
            {renderPanelHeader(
              'operandStack',
              'Operand Stack (LIFO)',
              <span className="w-2.5 h-2.5 rounded bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />,
              <span>
                {snapshot.operandStack.length} / {selectedProgram.maxStack} slots
              </span>
            )}

            {!collapsedPanels.operandStack && (
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5 bg-slate-950/40 custom-thin-scrollbar">
                {snapshot.operandStack.length === 0 ? (
                  <div className="h-full flex items-center justify-center border border-dashed border-white/10 rounded-lg text-center text-xs text-slate-500 font-mono py-6">
                    [ Empty Operand Stack ]
                  </div>
                ) : (
                  snapshot.operandStack
                    .slice()
                    .reverse()
                    .map((item, reverseIdx) => {
                      const actualIdx = snapshot.operandStack.length - 1 - reverseIdx;
                      const isTop = reverseIdx === 0;

                      return (
                        <div
                          key={actualIdx}
                          className={`flex items-center justify-between px-3 py-1.5 rounded-lg border transition-all ${
                            isTop
                              ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-200 font-bold shadow-[0_0_14px_rgba(6,182,212,0.2)] ring-1 ring-cyan-500/30'
                              : 'bg-slate-900/70 border-white/[0.06] text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-[10px] w-6">#{actualIdx}</span>
                            <span className="px-1.5 py-0.5 text-[9px] rounded bg-slate-800/80 text-slate-400 font-semibold border border-white/[0.06]">
                              {item.type}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold tabular-nums text-slate-100">
                              {item.type === 'REFERENCE'
                                ? `@0x${item.value.toString(16).toUpperCase()}`
                                : item.value}
                            </span>
                            {isTop && (
                              <span className="text-[9px] font-sans px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40">
                                TOP
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            )}
          </div>

          {/* PANEL 5: LOCAL VARIABLE TABLE (LVT) */}
          <div
            className={`flex flex-col ${
              collapsedPanels.lvt ? 'flex-none' : 'flex-1 min-h-0'
            } rounded-xl border overflow-hidden transition-all ${cardBgStyle}`}
          >
            {renderPanelHeader(
              'lvt',
              'Local Variable Table (LVT)',
              <span className="w-2.5 h-2.5 rounded bg-amber-400 shadow-[0_0_6px_#f59e0b]" />,
              <span>{selectedProgram.maxLocals} slots</span>
            )}

            {!collapsedPanels.lvt && (
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5 bg-slate-950/40 font-mono text-xs custom-thin-scrollbar">
                {Array.from({ length: selectedProgram.maxLocals }).map((_, slotIdx) => {
                  const val = snapshot.localVariables[slotIdx];
                  return (
                    <div
                      key={slotIdx}
                      className="flex items-center justify-between px-3 py-1.5 bg-slate-900/60 rounded-lg border border-white/[0.06] text-slate-300 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold text-xs w-6">
                          [{slotIdx}]
                        </span>
                        <span className="text-slate-300 text-xs">
                          {slotIdx === 0 && selectedProgram.descriptor.includes('([I')
                            ? 'arg0 (array ref)'
                            : slotIdx < programArgs.length
                            ? `arg${slotIdx}`
                            : `var${slotIdx}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800/80 border border-white/[0.06]">
                          {val ? val.type : 'UNINIT'}
                        </span>
                        <span className="font-semibold text-slate-100 tabular-nums">
                          {val
                            ? val.type === 'REFERENCE'
                              ? `@0x${val.value.toString(16).toUpperCase()}`
                              : val.value
                            : '0'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* ---------------------------------------------------- */}
        {/* COLUMN 3: REAL-TIME D3 HEAP VISUALIZER               */}
        {/* ---------------------------------------------------- */}
        <div
          className={`${
            layoutMode === 'memoryFocus'
              ? 'lg:col-span-5'
              : layoutMode === 'codeFocus'
              ? 'lg:col-span-3'
              : 'lg:col-span-4'
          } flex flex-col h-full overflow-hidden`}
        >
          {/* HEAP MEMORY VISUALIZER */}
          <div
            className={`flex flex-col ${
              collapsedPanels.heap ? 'flex-none' : 'flex-1 min-h-0'
            } rounded-xl border overflow-hidden transition-all ${cardBgStyle} h-full`}
          >
            {renderPanelHeader(
              'heap',
              'JVM Heap Visualizer (D3 Real-Time)',
              <HardDrive className="w-3.5 h-3.5 text-pink-400" />,
              <span>
                {snapshot.heapArrays.length} arrays · {snapshot.heapObjects.length} objects
              </span>,
              <div className="flex items-center bg-slate-950/80 border border-white/10 rounded-md p-0.5 text-[10px]">
                <button
                  onClick={() => setHeapDisplayMode('d3')}
                  className={`px-2 py-0.5 rounded transition-all ${
                    heapDisplayMode === 'd3'
                      ? 'bg-pink-950/80 text-pink-200 font-semibold border border-pink-500/40 shadow-[0_0_8px_rgba(244,114,182,0.25)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  D3 Topology
                </button>
                <button
                  onClick={() => setHeapDisplayMode('raw')}
                  className={`px-2 py-0.5 rounded transition-all ${
                    heapDisplayMode === 'raw'
                      ? 'bg-slate-800 text-slate-200 font-semibold border border-white/10'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Raw Cells
                </button>
              </div>
            )}

            {!collapsedPanels.heap && (
              <div className="flex-1 p-2.5 overflow-hidden flex flex-col bg-slate-950/40 min-h-0">
                {heapDisplayMode === 'd3' ? (
                  <div className="flex-1 min-h-[220px] overflow-hidden rounded-lg border border-white/[0.08] shadow-inner bg-slate-950/60 flex flex-col">
                    <JvmHeapD3Visualizer snapshot={snapshot} className="w-full h-full flex-1" />
                  </div>
                ) : snapshot.heapArrays.length === 0 && snapshot.heapObjects.length === 0 ? (
                  <div className="h-full flex items-center justify-center border border-dashed border-white/10 rounded-lg text-center text-xs text-slate-500 font-mono py-6">
                    No active heap allocations (run newarray / new instructions)
                  </div>
                ) : (
                  <div className="space-y-2 font-mono text-xs overflow-y-auto flex-1 custom-thin-scrollbar p-1">
                    {snapshot.heapArrays.map((arr) => (
                      <div
                        key={arr.address}
                        className="p-2.5 bg-slate-900/60 border border-white/[0.08] rounded-lg space-y-1.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between text-pink-300">
                          <span className="font-bold">
                            Array@0x{arr.address.toString(16).toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400">int[{arr.length}]</span>
                        </div>

                        <div className="flex flex-wrap gap-1 text-[11px]">
                          {arr.elements.map((el, elIdx) => (
                            <div
                              key={elIdx}
                              className="px-2 py-0.5 bg-slate-950/90 border border-white/10 rounded text-slate-200 shadow-inner"
                            >
                              <span className="text-slate-500 text-[9px] mr-1">[{elIdx}]</span>
                              <span className="tabular-nums font-semibold">{el}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {snapshot.heapObjects.map((obj) => (
                      <div
                        key={obj.address}
                        className="p-2.5 bg-slate-900/60 border border-white/[0.08] rounded-lg space-y-1.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between text-amber-300">
                          <span className="font-bold">
                            Object@0x{obj.address.toString(16).toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400">{obj.className}</span>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          Fields: {Object.keys(obj.fields).length === 0 ? 'none' : JSON.stringify(obj.fields)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. APPLICATION BOTTOM STATUS BAR                         */}
      {/* ======================================================== */}
      <div
        className={`flex items-center justify-between px-4 py-1.5 text-[11px] font-mono text-slate-400 shrink-0 select-none transition-colors ${
          uiTheme === 'neon'
            ? 'bg-[#0a0c12] border-t border-cyan-500/20'
            : uiTheme === 'enterprise'
            ? 'bg-[#14161f] border-t border-[#232733]'
            : 'bg-slate-950/90 backdrop-blur-md border-t border-white/[0.08]'
        }`}
      >
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                snapshot.status === 'running'
                  ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]'
                  : snapshot.status === 'paused'
                  ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                  : snapshot.status === 'completed'
                  ? 'bg-blue-400 shadow-[0_0_6px_#60a5fa]'
                  : 'bg-slate-500'
              }`}
            />
            <span className="font-semibold uppercase tracking-wider text-slate-300">
              {snapshot.status}
            </span>
          </span>
          <span>PC: 0x{snapshot.pc.toString(16).padStart(4, '0').toUpperCase()}</span>
          <span>Step #{snapshot.stepCount}</span>
          <span className="truncate max-w-[200px]">
            Method: {selectedProgram.className}.{selectedProgram.methodName}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span>Clock: {speedMs}ms</span>
          <span>Heap: {snapshot.heapArrays.length} arrays</span>
          <span>Stack: {snapshot.operandStack.length} slots</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. FULLSCREEN PANEL MODAL                                */}
      {/* ======================================================== */}
      {maximizedPanel && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col p-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
              <span>Panel Focus: {maximizedPanel}</span>
            </div>
            <button
              onClick={() => setMaximizedPanel(null)}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-900 border border-white/10 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/[0.08] p-4 shadow-2xl">
            {maximizedPanel === 'heap' && (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-pink-300">
                    JVM Virtual Heap Memory Graph (Interactive D3 Topology)
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => setHeapDisplayMode('d3')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                        heapDisplayMode === 'd3'
                          ? 'bg-pink-900/80 text-pink-200 border border-pink-500/40 shadow-[0_0_12px_rgba(244,114,182,0.3)]'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      D3 Topology
                    </button>
                    <button
                      onClick={() => setHeapDisplayMode('raw')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                        heapDisplayMode === 'raw'
                          ? 'bg-pink-900/80 text-pink-200 border border-pink-500/40 shadow-[0_0_12px_rgba(244,114,182,0.3)]'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Raw Cells
                    </button>
                  </div>
                </div>
                <div className="flex-1 border border-white/10 rounded-xl overflow-hidden bg-slate-950/80">
                  {heapDisplayMode === 'd3' ? (
                    <JvmHeapD3Visualizer snapshot={snapshot} />
                  ) : (
                    <div className="p-4 space-y-3 overflow-y-auto h-full">
                      {snapshot.heapArrays.map((arr) => (
                        <div key={arr.address} className="p-4 bg-slate-900/80 rounded-xl border border-white/10">
                          <span className="text-pink-300 font-bold block mb-2 font-mono">
                            Array@0x{arr.address.toString(16).toUpperCase()} (int[{arr.length}])
                          </span>
                          <div className="grid grid-cols-6 gap-2 font-mono text-xs">
                            {arr.elements.map((el, idx) => (
                              <div key={idx} className="p-2 bg-slate-950 rounded-lg border border-white/10 text-center">
                                <div className="text-[10px] text-slate-500">idx {idx}</div>
                                <div className="text-sm font-bold text-white">{el}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {maximizedPanel === 'source' && (
              <div className="h-full flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-indigo-300">Java Source & Compilation Studio</h3>
                  <button
                    onClick={handleApplyJavaEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Compile & Update VM</span>
                  </button>
                </div>
                <textarea
                  value={editedJavaSource}
                  onChange={(e) => setEditedJavaSource(e.target.value)}
                  className="w-full flex-1 font-mono text-xs text-indigo-100 bg-slate-950/90 p-4 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-400 focus:shadow-[0_0_16px_rgba(99,102,241,0.25)] resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
            )}

            {maximizedPanel === 'disassembly' && (
              <div className="h-full overflow-y-auto font-mono text-xs space-y-1 p-2">
                {instructions.map((instr) => (
                  <div
                    key={instr.offset}
                    className={`flex items-center gap-4 px-3 py-2 rounded-lg ${
                      snapshot.pc === instr.offset
                        ? 'bg-emerald-950/80 border border-emerald-500/70 text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.25)]'
                        : 'bg-slate-950/80 text-slate-300'
                    }`}
                  >
                    <span className="w-12 text-slate-500 font-mono">PC {instr.offset}</span>
                    <span className="w-12 text-slate-600">0x{instr.opcode.toString(16).toUpperCase()}</span>
                    <span className="w-28 font-bold">{instr.mnemonic}</span>
                    <span className="w-24 text-slate-400">{instr.operands.join(', ')}</span>
                    <span className="text-slate-500 italic flex-1">// {instr.comment || ''}</span>
                  </div>
                ))}
              </div>
            )}

            {maximizedPanel !== 'heap' && maximizedPanel !== 'source' && maximizedPanel !== 'disassembly' && (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                Panel {maximizedPanel} maximized view.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
