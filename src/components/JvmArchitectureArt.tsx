import React, { useState } from 'react';
import { Cpu, HardDrive, Layers, Database, ArrowRight, Zap, RefreshCw, Terminal, CheckCircle2 } from 'lucide-react';
import { ExecutionSnapshot } from '../jvm/types';

interface JvmArchitectureArtProps {
  snapshot?: ExecutionSnapshot;
  activePc?: number;
  compact?: boolean;
}

export const JvmArchitectureArt: React.FC<JvmArchitectureArtProps> = ({ snapshot, activePc = 0, compact = false }) => {
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>('stack');

  const subsystems: Record<string, { title: string; subtitle: string; desc: string; specs: string[] }> = {
    classloader: {
      title: 'Class Loader Subsystem',
      subtitle: 'Loading, Linking, and Initialization Phase',
      desc: 'Dynamically loads compiled .class bytecode into the JVM Method Area. Enforces bytecode verification, binary integrity checks, and symbol resolution.',
      specs: ['Bootstrap Loader (lib/rt.jar)', 'Platform/Extension Loader', 'Application ClassLoader', 'Bytecode Verifier'],
    },
    methodarea: {
      title: 'Method Area & Constant Pool',
      subtitle: 'Per-JVM Shared Type & Code Storage',
      desc: 'Stores class structures, runtime constant pools, field/method metadata, and compiled bytecodes. Shared across all execution threads.',
      specs: ['Runtime Constant Pool (#1..#N)', 'Method Bytecode Storage', 'JIT Compiled Machine Code', 'Static Class Fields'],
    },
    heap: {
      title: 'Virtual Heap Memory',
      subtitle: 'Garbage-Collected Object & Array Storage',
      desc: 'Allocates all class instances and primitive arrays (newarray, new). Monitored by the garbage collector; referenced via 32-bit memory pointers.',
      specs: ['Eden & Survivor Spaces (Young Gen)', 'Tenured Generation (Old Gen)', 'Primitive Int Arrays (T_INT)', 'Generational Mark-Sweep GC'],
    },
    stack: {
      title: 'Java Thread Call Stack',
      subtitle: 'Stack Frames, LVT & Operand Stack',
      desc: 'Each thread allocates a private JVM stack storing activation frames. Each frame houses a Local Variable Table (LVT) and LIFO Operand Stack.',
      specs: ['LIFO Operand Stack (TOS)', 'Local Variable Table (Slots 0..N)', 'Frame Data & Exception Dispatch', 'Zero-overhead Return Passing'],
    },
    pc: {
      title: 'Program Counter (PC) Register',
      subtitle: 'Thread Instruction Pointer',
      desc: 'Maintains the byte offset of the currently executing JVM bytecode instruction within the active method area.',
      specs: ['32-bit Virtual Address', 'Auto-incremented on Fetch', 'Jump Target on Branching', 'Zero-cost Stack Transition'],
    },
    engine: {
      title: 'Execution Engine & JIT',
      subtitle: 'Fetch-Decode-Execute Micro-Interpreter',
      desc: 'Executes bytecode instructions sequentially or compiles hot loops into native assembly via Just-In-Time (JIT) optimization.',
      specs: ['Fetch-Decode-Execute Cycle', 'JIT Hotspot Profiling', 'Native Method Interface (JNI)', 'Garbage Collector Subsystem'],
    },
  };

  const current = subsystems[selectedSubsystem] || subsystems.stack;

  return (
    <div className={`flex flex-col bg-slate-950 text-slate-100 border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl ${compact ? 'p-3' : 'p-5'}`}>
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                JVM Runtime Memory Architecture & Silicon Topology
              </h2>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono">
                JSR-392 / Java 17+
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive architectural map showing data flow between Execution Engine, Thread Stack, Heap, and PC Register
            </p>
          </div>
        </div>

        {/* Live telemetry indicators */}
        {snapshot && (
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-slate-500">PC:</span>
              <span className="text-emerald-400 font-bold">{activePc}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">STACK:</span>
              <span className="text-cyan-400 font-bold">{snapshot.operandStack.length} items</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">HEAP:</span>
              <span className="text-pink-400 font-bold">{snapshot.heapArrays.length} arrays</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Architectural SVG & Interactive Circuit Blueprint */}
      <div className="relative py-4 overflow-x-auto">
        <svg
          viewBox="0 0 920 340"
          className="w-full min-w-[760px] h-auto select-none font-mono"
        >
          {/* Gradients & Definitions */}
          <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0c101d" />
              <stop offset="100%" stopColor="#080b14" />
            </linearGradient>
            <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="pinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#be185d" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.3" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Circuit Grid Lines */}
          <rect x="0" y="0" width="920" height="340" rx="12" fill="url(#bgGrad)" stroke="#1e2638" strokeWidth="1.5" />
          
          {/* Subtle grid pattern */}
          <g stroke="#1a2234" strokeWidth="0.5" strokeDasharray="4 4">
            <line x1="20" y1="80" x2="900" y2="80" />
            <line x1="20" y1="170" x2="900" y2="170" />
            <line x1="20" y1="260" x2="900" y2="260" />
            <line x1="240" y1="20" x2="240" y2="320" />
            <line x1="520" y1="20" x2="520" y2="320" />
            <line x1="720" y1="20" x2="720" y2="320" />
          </g>

          {/* Bus Interconnect Traces */}
          <path
            d="M 200 120 L 270 120 M 470 120 L 540 120 M 400 170 L 400 230 M 640 170 L 640 230 M 740 120 L 790 120"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeDasharray="6 4"
            fill="none"
            opacity="0.6"
          />

          {/* Node 1: ClassLoader Subsystem */}
          <g
            onClick={() => setSelectedSubsystem('classloader')}
            className="cursor-pointer transition-transform hover:opacity-95"
          >
            <rect
              x="30"
              y="50"
              width="170"
              height="140"
              rx="8"
              fill="#111625"
              stroke={selectedSubsystem === 'classloader' ? '#6366f1' : '#27324b'}
              strokeWidth={selectedSubsystem === 'classloader' ? 2 : 1}
            />
            <rect x="30" y="50" width="170" height="28" rx="8" fill="#182035" />
            <text x="45" y="68" fill="#818cf8" fontSize="11" fontWeight="bold">ClassLoader Subsystem</text>
            <text x="45" y="96" fill="#94a3b8" fontSize="9.5">· Loading (.class)</text>
            <text x="45" y="114" fill="#94a3b8" fontSize="9.5">· Linking & Verification</text>
            <text x="45" y="132" fill="#94a3b8" fontSize="9.5">· Symbol Resolution</text>
            <text x="45" y="150" fill="#94a3b8" fontSize="9.5">· Static Init (&lt;clinit&gt;)</text>
            <text x="45" y="176" fill="#475569" fontSize="8.5">[Click to inspect]</text>
          </g>

          {/* Node 2: Method Area & Constant Pool */}
          <g
            onClick={() => setSelectedSubsystem('methodarea')}
            className="cursor-pointer transition-transform hover:opacity-95"
          >
            <rect
              x="270"
              y="50"
              width="200"
              height="140"
              rx="8"
              fill="#111625"
              stroke={selectedSubsystem === 'methodarea' ? '#10b981' : '#27324b'}
              strokeWidth={selectedSubsystem === 'methodarea' ? 2 : 1}
            />
            <rect x="270" y="50" width="200" height="28" rx="8" fill="#182035" />
            <text x="285" y="68" fill="#34d399" fontSize="11" fontWeight="bold">Method Area & Pool</text>
            <text x="285" y="96" fill="#94a3b8" fontSize="9.5">· Runtime Constant Pool</text>
            <text x="285" y="114" fill="#94a3b8" fontSize="9.5">· Class Metadata & Descriptors</text>
            <text x="285" y="132" fill="#94a3b8" fontSize="9.5">· Method Bytecode Stream</text>
            <text x="285" y="150" fill="#94a3b8" fontSize="9.5">· Static Fields & Code Cache</text>
            <text x="285" y="176" fill="#475569" fontSize="8.5">[Click to inspect]</text>
          </g>

          {/* Node 3: Java Thread Call Stack */}
          <g
            onClick={() => setSelectedSubsystem('stack')}
            className="cursor-pointer transition-transform hover:opacity-95"
          >
            <rect
              x="540"
              y="50"
              width="200"
              height="140"
              rx="8"
              fill="#111625"
              stroke={selectedSubsystem === 'stack' ? '#06b6d4' : '#27324b'}
              strokeWidth={selectedSubsystem === 'stack' ? 2 : 1}
            />
            <rect x="540" y="50" width="200" height="28" rx="8" fill="#182035" />
            <text x="555" y="68" fill="#22d3ee" fontSize="11" fontWeight="bold">Thread Stack & Frames</text>
            <text x="555" y="96" fill="#94a3b8" fontSize="9.5">· LIFO Operand Stack (TOS)</text>
            <text x="555" y="114" fill="#94a3b8" fontSize="9.5">· Local Variable Table (LVT)</text>
            <text x="555" y="132" fill="#94a3b8" fontSize="9.5">· Frame Return Passback</text>
            <text x="555" y="150" fill="#94a3b8" fontSize="9.5">· MaxStack / MaxLocals</text>
            <text x="555" y="176" fill="#475569" fontSize="8.5">[Click to inspect]</text>
          </g>

          {/* Node 4: Program Counter (PC) Register */}
          <g
            onClick={() => setSelectedSubsystem('pc')}
            className="cursor-pointer transition-transform hover:opacity-95"
          >
            <rect
              x="780"
              y="50"
              width="110"
              height="140"
              rx="8"
              fill="#111625"
              stroke={selectedSubsystem === 'pc' ? '#f59e0b' : '#27324b'}
              strokeWidth={selectedSubsystem === 'pc' ? 2 : 1}
            />
            <rect x="780" y="50" width="110" height="28" rx="8" fill="#182035" />
            <text x="792" y="68" fill="#fbbf24" fontSize="11" fontWeight="bold">PC Register</text>
            <text x="792" y="96" fill="#94a3b8" fontSize="9.5">· Active PC</text>
            <text x="792" y="114" fill="#fbbf24" fontSize="13" fontWeight="bold">
              {String(activePc).padStart(4, '0')}
            </text>
            <text x="792" y="140" fill="#94a3b8" fontSize="9">0x{activePc.toString(16).toUpperCase()}</text>
            <text x="792" y="176" fill="#475569" fontSize="8.5">[Inspect]</text>
          </g>

          {/* Node 5: Virtual Heap Memory */}
          <g
            onClick={() => setSelectedSubsystem('heap')}
            className="cursor-pointer transition-transform hover:opacity-95"
          >
            <rect
              x="30"
              y="220"
              width="440"
              height="100"
              rx="8"
              fill="#111625"
              stroke={selectedSubsystem === 'heap' ? '#ec4899' : '#27324b'}
              strokeWidth={selectedSubsystem === 'heap' ? 2 : 1}
            />
            <rect x="30" y="220" width="440" height="26" rx="8" fill="#182035" />
            <text x="45" y="238" fill="#f472b6" fontSize="11" fontWeight="bold">Virtual Heap Memory (Garbage-Collected)</text>
            <text x="45" y="265" fill="#94a3b8" fontSize="9.5">· Young Generation (Eden + S0/S1 Survivors) · Old Generation (Tenured)</text>
            <text x="45" y="285" fill="#94a3b8" fontSize="9.5">· newarray primitive allocations (T_INT arrays) · Dynamic Object References</text>
            <text x="45" y="305" fill="#475569" fontSize="8.5">[Click to inspect heap memory model]</text>
          </g>

          {/* Node 6: Execution Engine & JIT */}
          <g
            onClick={() => setSelectedSubsystem('engine')}
            className="cursor-pointer transition-transform hover:opacity-95"
          >
            <rect
              x="540"
              y="220"
              width="350"
              height="100"
              rx="8"
              fill="#111625"
              stroke={selectedSubsystem === 'engine' ? '#8b5cf6' : '#27324b'}
              strokeWidth={selectedSubsystem === 'engine' ? 2 : 1}
            />
            <rect x="540" y="220" width="350" height="26" rx="8" fill="#182035" />
            <text x="555" y="238" fill="#a78bfa" fontSize="11" fontWeight="bold">Execution Engine & JIT Compiler</text>
            <text x="555" y="265" fill="#94a3b8" fontSize="9.5">· Fetch-Decode-Execute Micro-Interpreter</text>
            <text x="555" y="285" fill="#94a3b8" fontSize="9.5">· Native Method Interface (JNI hooks) · Mark-Sweep Garbage Collector</text>
            <text x="555" y="305" fill="#475569" fontSize="8.5">[Click to inspect execution cycle]</text>
          </g>
        </svg>
      </div>

      {/* Selected Subsystem Detail Card */}
      <div className="mt-3 p-4 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">{current.title}</h3>
            <span className="text-slate-500 text-xs">—</span>
            <span className="text-xs text-indigo-300 font-medium">{current.subtitle}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">{current.desc}</p>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-400 shrink-0">
          {current.specs.map((s, idx) => (
            <span key={idx} className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-300">
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
