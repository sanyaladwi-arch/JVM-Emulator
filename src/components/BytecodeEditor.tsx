import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Code,
  CheckCircle2,
  AlertCircle,
  FileText,
  Save,
  Trash2,
  Copy,
  Download,
  Upload,
  BookOpen,
  Search,
  Sparkles,
  Layers,
  Settings,
  PlusCircle,
  Check,
  Trophy,
  Cpu,
} from 'lucide-react';
import { BytecodeParser } from '../jvm/parser';
import { InstructionIR } from '../jvm/types';
import { OPCODES, OpcodeDef } from '../jvm/constants';
import { SAMPLE_PROGRAMS, SampleProgramDef } from '../jvm/samples';
import { JavaCompiler } from '../jvm/javaCompiler';

interface BytecodeEditorProps {
  onLoadCustomBytecode: (
    name: string,
    assembly: string,
    bytecode: Uint8Array,
    instructions: InstructionIR[],
    args: number[],
    metadata?: {
      className?: string;
      methodName?: string;
      descriptor?: string;
      maxStack?: number;
      maxLocals?: number;
      javaSource?: string;
    }
  ) => void;
  initialCode?: string | null;
  initialName?: string | null;
  initialArgs?: string | null;
  initialLanguage?: 'bytecode' | 'java';
}

interface SavedProgram {
  id: string;
  name: string;
  code: string;
  args: string;
  descriptor: string;
  maxStack: number;
  maxLocals: number;
  updatedAt: number;
}

const STORAGE_KEY = 'jvm_user_custom_programs';

// Starter skeletons for programmers
const STARTER_SKELETONS: { id: string; name: string; desc: string; args: string; code: string }[] = [
  {
    id: 'skeleton_blank',
    name: 'Blank Method Template',
    desc: 'Minimal skeleton returning an integer',
    args: '0',
    code: `// CustomMethod.run()
// LVT: slot 0 = arg0
iload_0
iconst_1
iadd
ireturn`,
  },
  {
    id: 'skeleton_loop',
    name: 'Loop with Counter',
    desc: 'Iterative counting loop from 0 to limit',
    args: '10',
    code: `// LoopCounter(limit) -> LVT: 0=limit, 1=counter, 2=sum
iconst_0
istore_1            // counter = 0
iconst_0
istore_2            // sum = 0

LOOP:
iload_1
iload_0
if_icmpge DONE      // if counter >= limit goto DONE

iload_2
iload_1
iadd
istore_2            // sum += counter

iinc 1 1            // counter++
goto LOOP

DONE:
iload_2             // return sum
ireturn`,
  },
  {
    id: 'skeleton_array',
    name: 'Heap Array Processing',
    desc: 'Heap allocation, array population and return',
    args: '5',
    code: `// ArrayProcessor(size) -> LVT: 0=size, 1=arr, 2=i
iload_0
newarray 10         // allocate int[size] on heap
astore_1

iconst_0
istore_2            // i = 0

FILL_LOOP:
iload_2
iload_0
if_icmpge FINISH

aload_1
iload_2
iload_2
iconst_2
imul
iastore             // arr[i] = i * 2

iinc 2 1
goto FILL_LOOP

FINISH:
aload_1
iconst_0
iaload              // return arr[0]
ireturn`,
  },
  {
    id: 'skeleton_bitwise',
    name: 'Bitwise Masking & Logic',
    desc: 'Demonstrates bitwise AND, OR, XOR, shifts',
    args: '12, 10',
    code: `// BitwiseLogic(a, b) -> LVT: 0=a, 1=b, 2=result
iload_0
iload_1
iand                // a & b
istore_2

iload_2
iconst_2
ishl                // (a & b) << 2
ireturn`,
  },
];

// Common idioms for instant insertion
const PROGRAMMER_SNIPPETS = [
  {
    label: 'Loop Header',
    snippet: `LOOP:
iload_1
iload_0
if_icmpge DONE
iinc 1 1
goto LOOP
DONE:`,
  },
  {
    label: 'If-Else Branch',
    snippet: `iload_0
iconst_0
if_icmpeq THEN_BRANCH
// ELSE branch
iconst_0
goto END_IF
THEN_BRANCH:
iconst_1
END_IF:`,
  },
  {
    label: 'Heap Int Array',
    snippet: `bipush 10
newarray 10
astore_1`,
  },
  {
    label: 'Array Read/Write',
    snippet: `aload_1
iload_2
iaload
// store back
aload_1
iload_2
bipush 42
iastore`,
  },
  {
    label: 'Bitwise Test',
    snippet: `iload_0
iconst_1
iand
ifne IS_ODD`,
  },
];

export const BytecodeEditor: React.FC<BytecodeEditorProps> = ({
  onLoadCustomBytecode,
  initialCode,
  initialName,
  initialArgs,
  initialLanguage,
}) => {
  const [sourceCode, setSourceCode] = useState<string>(() => initialCode || SAMPLE_PROGRAMS[0].assemblySource);
  const [programName, setProgramName] = useState<string>(() => initialName || 'CustomProgram');
  const [methodName, setMethodName] = useState<string>('compute');
  const [descriptor, setDescriptor] = useState<string>('(I)I');
  const [argsInput, setArgsInput] = useState<string>(() => initialArgs || '5');
  const [maxStack, setMaxStack] = useState<number>(8);
  const [maxLocals, setMaxLocals] = useState<number>(8);

  const [editorLanguage, setEditorLanguage] = useState<'bytecode' | 'java'>(() => {
    if (initialLanguage) return initialLanguage;
    if (initialCode && JavaCompiler.isJavaSource(initialCode)) return 'java';
    return 'bytecode';
  });
  const [compileError, setCompileError] = useState<string | null>(null);
  const [compileSuccess, setCompileSuccess] = useState<boolean>(false);
  const [assembledInstructions, setAssembledInstructions] = useState<InstructionIR[]>([]);
  const [hexBytes, setHexBytes] = useState<string>('');

  // Right column view mode
  const [activeRightTab, setActiveRightTab] = useState<'opcodes' | 'binary'>('opcodes');
  const [opcodeSearch, setOpcodeSearch] = useState<string>('');
  const [opcodeCategoryFilter, setOpcodeCategoryFilter] = useState<string>('all');

  // Program Management / Saved Library
  const [savedPrograms, setSavedPrograms] = useState<SavedProgram[]>([]);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial props if changed from outside (e.g. clicking "Edit in Assembler" from Debugger)
  useEffect(() => {
    if (initialCode) {
      setSourceCode(initialCode);
      if (initialName) setProgramName(initialName);
      if (initialArgs) setArgsInput(initialArgs);
      if (initialLanguage) {
        setEditorLanguage(initialLanguage);
      } else if (JavaCompiler.isJavaSource(initialCode)) {
        setEditorLanguage('java');
      }
      setCompileSuccess(false);
      setCompileError(null);
    }
  }, [initialCode, initialName, initialArgs, initialLanguage]);

  // Load saved programs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedPrograms(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveToStorage = (programs: SavedProgram[]) => {
    setSavedPrograms(programs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(programs));
    } catch {
      // ignore
    }
  };

  const handleSaveCurrentProgram = () => {
    const existingIdx = savedPrograms.findIndex((p) => p.name.toLowerCase() === programName.toLowerCase());
    const item: SavedProgram = {
      id: existingIdx !== -1 ? savedPrograms[existingIdx].id : 'prog_' + Date.now(),
      name: programName.trim() || 'UntitledProgram',
      code: sourceCode,
      args: argsInput,
      descriptor,
      maxStack,
      maxLocals,
      updatedAt: Date.now(),
    };

    let updated: SavedProgram[];
    if (existingIdx !== -1) {
      updated = [...savedPrograms];
      updated[existingIdx] = item;
    } else {
      updated = [item, ...savedPrograms];
    }
    saveToStorage(updated);
  };

  const handleDeleteSavedProgram = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = savedPrograms.filter((p) => p.id !== id);
    saveToStorage(filtered);
  };

  // Synchronize line number scrolling
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Support Tab key indent in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const val = ta.value;
      const newVal = val.substring(0, start) + '    ' + val.substring(end);
      setSourceCode(newVal);
      setCompileSuccess(false);
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      }, 0);
    }
  };

  // Insert text at current cursor or end
  const insertTextAtCursor = (textToInsert: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setSourceCode((prev) => prev + '\n' + textToInsert);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const current = ta.value;
    const updated = current.substring(0, start) + textToInsert + current.substring(end);
    setSourceCode(updated);
    setCompileSuccess(false);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + textToInsert.length;
    }, 0);
  };

  // Assemble and load
  const handleAssemble = (andLaunchDebugger = true) => {
    try {
      setCompileError(null);
      let assemblyToUse = sourceCode;
      let detectedClass = programName;
      let detectedMethod = methodName;
      let detectedDescriptor = descriptor;

      if (editorLanguage === 'java' || JavaCompiler.isJavaSource(sourceCode)) {
        const javaRes = JavaCompiler.compile(sourceCode);
        if (!javaRes.success) {
          throw new Error(`Java Compile Error: ${javaRes.errorMessage}`);
        }
        assemblyToUse = javaRes.assemblySource;
        if (javaRes.className) detectedClass = javaRes.className;
        if (javaRes.methodName) detectedMethod = javaRes.methodName;
        if (javaRes.descriptor) detectedDescriptor = javaRes.descriptor;
      }

      const { bytecode, instructions } = BytecodeParser.assemble(assemblyToUse);
      const hex = BytecodeParser.bytesToHex(bytecode);

      setAssembledInstructions(instructions);
      setHexBytes(hex);
      setCompileSuccess(true);

      const parsedArgs = argsInput
        .split(/[,\s]+/)
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));

      if (andLaunchDebugger) {
        onLoadCustomBytecode(detectedClass, assemblyToUse, bytecode, instructions, parsedArgs, {
          className: detectedClass,
          methodName: detectedMethod,
          descriptor: detectedDescriptor,
          maxStack: Math.max(maxStack, 8),
          maxLocals: Math.max(maxLocals, parsedArgs.length + 4),
          javaSource: editorLanguage === 'java' || JavaCompiler.isJavaSource(sourceCode) ? sourceCode : undefined,
        });
      }
    } catch (e: any) {
      setCompileError(e.message || String(e));
      setCompileSuccess(false);
    }
  };

  // Copy to clipboard
  const handleCopyAssembly = () => {
    navigator.clipboard.writeText(sourceCode);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // Export as .jvm file
  const handleExportFile = () => {
    const blob = new Blob([sourceCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${programName || 'program'}.jvm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import from file
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setSourceCode(content);
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setProgramName(nameWithoutExt);
        setCompileSuccess(false);
        setCompileError(null);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filter opcodes
  const allOpcodesList = Object.values(OPCODES);
  const filteredOpcodes = allOpcodesList.filter((op) => {
    const matchesSearch =
      op.mnemonic.toLowerCase().includes(opcodeSearch.toLowerCase()) ||
      op.description.toLowerCase().includes(opcodeSearch.toLowerCase()) ||
      `0x${op.code.toString(16)}`.includes(opcodeSearch.toLowerCase());

    const matchesCategory =
      opcodeCategoryFilter === 'all' || op.category === opcodeCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const lineCount = sourceCode.split('\n').length;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".jvm,.j,.txt,.asm"
        className="hidden"
      />

      {/* Editor Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 border-b border-slate-800 bg-slate-900/70 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Code className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200">
                Bytecode Assembler Studio
              </span>
              <span className="text-[10px] bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                JVM v17 IR
              </span>
            </div>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Write, assemble, test, and step through any custom JVM bytecode routine
            </span>
          </div>
        </div>

        {/* Templates & Saved Programs Selectors */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Sample Program / Starter Loader */}
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-slate-400">Template:</label>
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return;
                const sampleFound = SAMPLE_PROGRAMS.find((p) => p.id === val);
                if (sampleFound) {
                  setSourceCode(editorLanguage === 'java' && sampleFound.javaSourceSnippet ? sampleFound.javaSourceSnippet : sampleFound.assemblySource);
                  setProgramName(sampleFound.className);
                  setMethodName(sampleFound.methodName);
                  setDescriptor(sampleFound.descriptor);
                  setArgsInput(sampleFound.defaultArgs.join(', '));
                  setMaxStack(sampleFound.maxStack);
                  setMaxLocals(sampleFound.maxLocals);
                  setCompileSuccess(false);
                  setCompileError(null);
                  return;
                }
                const skeletonFound = STARTER_SKELETONS.find((s) => s.id === val);
                if (skeletonFound) {
                  setSourceCode(skeletonFound.code);
                  setProgramName(skeletonFound.name.replace(/\s+/g, ''));
                  setMethodName('execute');
                  setDescriptor('(I)I');
                  setArgsInput(skeletonFound.args);
                  setCompileSuccess(false);
                  setCompileError(null);
                }
              }}
              defaultValue=""
              className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="" disabled>
                -- Load Sample or Starter --
              </option>
              <optgroup label="LeetCode Interview Problems">
                {SAMPLE_PROGRAMS.filter((p) => p.category === 'leetcode' || p.leetcodeId !== undefined).map((p) => (
                  <option key={p.id} value={p.id}>
                    LC {p.leetcodeId ? `${p.leetcodeId}: ` : ''}{p.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Starter Scaffolds">
                {STARTER_SKELETONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Sample Math Problems">
                {SAMPLE_PROGRAMS.filter((p) => p.category === 'math').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Algorithms & Arrays">
                {SAMPLE_PROGRAMS.filter((p) => p.category === 'algo' || p.category === 'heap').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Recursion & Bitwise">
                {SAMPLE_PROGRAMS.filter((p) => p.category === 'recursion' || p.category === 'bitwise').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Saved Programs Dropdown */}
          {savedPrograms.length > 0 && (
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-slate-400">My Saved:</label>
              <select
                onChange={(e) => {
                  const found = savedPrograms.find((p) => p.id === e.target.value);
                  if (found) {
                    setSourceCode(found.code);
                    setProgramName(found.name);
                    setArgsInput(found.args);
                    setDescriptor(found.descriptor);
                    setMaxStack(found.maxStack);
                    setMaxLocals(found.maxLocals);
                    setCompileSuccess(false);
                    setCompileError(null);
                  }
                }}
                defaultValue=""
                className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="" disabled>
                  -- Saved Programs ({savedPrograms.length}) --
                </option>
                {savedPrograms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Save Program Button */}
          <button
            onClick={handleSaveCurrentProgram}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs border border-slate-700 transition-colors"
            title="Save current code to browser storage"
          >
            <Save className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Import / Export Buttons */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs border border-slate-700 transition-colors"
            title="Import assembly from local file"
          >
            <Upload className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">Import</span>
          </button>

          <button
            onClick={handleExportFile}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs border border-slate-700 transition-colors"
            title="Export as .jvm file"
          >
            <Download className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={handleCopyAssembly}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs border border-slate-700 transition-colors"
            title="Copy code to clipboard"
          >
            {copiedNotification ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
            <span className="hidden sm:inline">{copiedNotification ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors ${
              showConfigDrawer
                ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Configure VM Class, Descriptor, MaxStack, MaxLocals"
          >
            <Settings className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">VM Config</span>
          </button>
        </div>
      </div>

      {/* Optional VM Configuration Bar */}
      {showConfigDrawer && (
        <div className="flex flex-wrap items-center gap-4 px-6 py-2 bg-slate-900 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono">Class:</span>
            <input
              type="text"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              className="w-32 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-slate-200 font-mono"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono">Method:</span>
            <input
              type="text"
              value={methodName}
              onChange={(e) => setMethodName(e.target.value)}
              className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-slate-200 font-mono"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono">Descriptor:</span>
            <input
              type="text"
              value={descriptor}
              onChange={(e) => setDescriptor(e.target.value)}
              className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-slate-200 font-mono"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono">Max Stack:</span>
            <input
              type="number"
              value={maxStack}
              onChange={(e) => setMaxStack(parseInt(e.target.value, 10) || 8)}
              className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-slate-200 font-mono text-center"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono">Max Locals:</span>
            <input
              type="number"
              value={maxLocals}
              onChange={(e) => setMaxLocals(parseInt(e.target.value, 10) || 8)}
              className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-slate-200 font-mono text-center"
            />
          </div>
        </div>
      )}

      {/* Main Split Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        {/* Left Column: Assembly Text Editor & Snippet Bar (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full bg-slate-950 p-4 overflow-hidden">
          {/* Editor Header: Idiom Inserters & Language Mode */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <FileText className={`w-3.5 h-3.5 ${editorLanguage === 'java' ? 'text-indigo-400' : 'text-emerald-400'}`} />
                <span className="text-xs font-semibold text-slate-300">
                  {editorLanguage === 'java' ? 'Java Source' : 'JVM Bytecode Source'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  ({lineCount} lines)
                </span>
              </div>

              {/* Mode Toggle [ JVM Bytecode | Java Method ] */}
              <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-md p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setEditorLanguage('bytecode');
                    const matching = SAMPLE_PROGRAMS.find((p) => p.className === programName || p.name === programName);
                    if (matching && matching.assemblySource && JavaCompiler.isJavaSource(sourceCode)) {
                      setSourceCode(matching.assemblySource);
                    }
                  }}
                  className={`px-2.5 py-0.5 rounded transition-all font-medium flex items-center gap-1 ${
                    editorLanguage === 'bytecode'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Direct JVM bytecode assembly mnemonics (iload, iadd, ireturn...)"
                >
                  <Cpu className="w-3 h-3" />
                  <span>Bytecode</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditorLanguage('java');
                    const matching = SAMPLE_PROGRAMS.find((p) => p.className === programName || p.name === programName);
                    if (matching && matching.javaSourceSnippet && !JavaCompiler.isJavaSource(sourceCode)) {
                      setSourceCode(matching.javaSourceSnippet);
                    }
                  }}
                  className={`px-2.5 py-0.5 rounded transition-all font-medium flex items-center gap-1 ${
                    editorLanguage === 'java'
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Write standard Java method (auto-compiled into JVM Bytecode)"
                >
                  <Code className="w-3 h-3" />
                  <span>Java Method</span>
                </button>
              </div>
            </div>

            {/* Quick Idiom Inserter Chips */}
            <div className="flex flex-wrap items-center gap-1 text-[11px]">
              <span className="text-slate-500 text-[10px] mr-1 hidden sm:inline">Snippets:</span>
              {PROGRAMMER_SNIPPETS.map((snip) => (
                <button
                  key={snip.label}
                  onClick={() => insertTextAtCursor('\n' + snip.snippet + '\n')}
                  className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 rounded text-[10px] border border-slate-800 transition-colors"
                >
                  +{snip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gutter + Textarea Editor Container */}
          <div className="flex-1 flex overflow-hidden border border-slate-800 rounded-lg bg-slate-950 shadow-inner focus-within:border-emerald-500/80 transition-colors">
            {/* Line Numbers Gutter */}
            <div
              ref={lineNumbersRef}
              className="w-10 bg-slate-900/60 select-none py-3 px-1 text-right font-mono text-[11px] text-slate-600 border-r border-slate-800/80 overflow-hidden leading-relaxed shrink-0"
            >
              {Array.from({ length: lineCount }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Editor Textarea */}
            <textarea
              ref={textareaRef}
              value={sourceCode}
              onChange={(e) => {
                setSourceCode(e.target.value);
                setCompileSuccess(false);
              }}
              onScroll={handleScroll}
              onKeyDown={handleKeyDown}
              placeholder="// Write JVM Bytecode assembly instructions here...&#10;iconst_1&#10;istore_1&#10;iload_1&#10;ireturn"
              className="flex-1 w-full bg-transparent p-3 font-mono text-xs text-slate-200 focus:outline-none leading-relaxed resize-none overflow-auto"
              spellCheck={false}
            />
          </div>

          {/* Bottom Execution Bar */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            {/* Input Arguments for Custom Program */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Arguments:</span>
              <input
                type="text"
                value={argsInput}
                onChange={(e) => setArgsInput(e.target.value)}
                placeholder="e.g. 5 or 48, 18"
                className="w-36 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                title="Input values for method parameters (slot 0, slot 1, etc.)"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAssemble(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 transition-colors"
                title="Assemble bytecode and check for errors without launching debugger"
              >
                Verify & Disassemble
              </button>

              <button
                onClick={() => handleAssemble(true)}
                className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                title="Assemble bytecode and immediately launch in Execution Debugger"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Assemble & Debug
              </button>
            </div>
          </div>

          {/* Feedback Status */}
          {compileError && (
            <div className="mt-2 p-2.5 bg-red-950/80 border border-red-500/50 rounded flex items-center gap-2 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <div className="flex-1">{compileError}</div>
            </div>
          )}

          {compileSuccess && (
            <div className="mt-2 p-2 bg-emerald-950/80 border border-emerald-500/50 rounded flex items-center gap-2 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Program assembled successfully ({assembledInstructions.length} instructions, {hexBytes.split(' ').length} bytes).</span>
            </div>
          )}
        </div>

        {/* Right Column: Opcode Palette OR Disassembled Binary Stream (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-full bg-slate-900/30 overflow-hidden divide-y divide-slate-800">
          {/* Right Column Tabs */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 shrink-0">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800 text-xs">
              <button
                onClick={() => setActiveRightTab('opcodes')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
                  activeRightTab === 'opcodes'
                    ? 'bg-slate-800 text-emerald-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Opcode Reference & Inserter
              </button>

              <button
                onClick={() => setActiveRightTab('binary')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
                  activeRightTab === 'binary'
                    ? 'bg-slate-800 text-emerald-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Binary IR Stream
              </button>
            </div>

            <span className="text-[11px] font-mono text-slate-500">
              {activeRightTab === 'opcodes' ? `${filteredOpcodes.length} opcodes` : `${assembledInstructions.length} IR nodes`}
            </span>
          </div>

          {/* Tab 1: Interactive Opcode Reference & Code Inserter */}
          {activeRightTab === 'opcodes' && (
            <div className="flex-1 flex flex-col overflow-hidden p-3">
              {/* Opcode Search and Category Filter */}
              <div className="space-y-2 mb-2 shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={opcodeSearch}
                    onChange={(e) => setOpcodeSearch(e.target.value)}
                    placeholder="Search opcode, mnemonic, or behavior..."
                    className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap gap-1 text-[10px]">
                  {['all', 'math', 'branch', 'stack', 'load', 'store', 'array', 'push', 'invoke'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setOpcodeCategoryFilter(cat)}
                      className={`px-2 py-0.5 rounded capitalize transition-colors ${
                        opcodeCategoryFilter === cat
                          ? 'bg-emerald-600 text-white font-medium'
                          : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opcode List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
                {filteredOpcodes.map((op) => {
                  let defaultInsert = op.mnemonic;
                  if (op.mnemonic === 'bipush') defaultInsert = 'bipush 10';
                  else if (op.mnemonic === 'sipush') defaultInsert = 'sipush 1000';
                  else if (op.mnemonic === 'iinc') defaultInsert = 'iinc 1 1';
                  else if (op.mnemonic === 'iload') defaultInsert = 'iload 1';
                  else if (op.mnemonic === 'istore') defaultInsert = 'istore 1';
                  else if (op.mnemonic === 'newarray') defaultInsert = 'newarray 10';
                  else if (op.category === 'branch') defaultInsert = `${op.mnemonic} TARGET_LABEL`;

                  return (
                    <div
                      key={op.code}
                      className="p-2 bg-slate-950 rounded border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-emerald-400 text-xs">
                            {op.mnemonic}
                          </span>
                          <span className="text-[10px] text-slate-600">
                            0x{op.code.toString(16).padStart(2, '0').toUpperCase()}
                          </span>
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-sans uppercase tracking-wider ${
                              op.category === 'branch'
                                ? 'bg-amber-950/80 text-amber-300'
                                : op.category === 'math'
                                ? 'bg-cyan-950/80 text-cyan-300'
                                : op.category === 'array'
                                ? 'bg-pink-950/80 text-pink-300'
                                : op.category === 'stack'
                                ? 'bg-purple-950/80 text-purple-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {op.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-sans truncate">
                          {op.description}
                        </div>
                      </div>

                      <button
                        onClick={() => insertTextAtCursor('\n' + defaultInsert)}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded text-[11px] font-sans border border-slate-800 shrink-0 flex items-center gap-1 transition-colors"
                        title={`Insert '${defaultInsert}' into source`}
                      >
                        <PlusCircle className="w-3 h-3" />
                        <span>Insert</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Binary IR Stream & Decoded Instruction Nodes */}
          {activeRightTab === 'binary' && (
            <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4">
              {hexBytes ? (
                <>
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 block mb-1">
                      Raw Hex Bytecode Stream ({hexBytes.split(' ').length} bytes):
                    </span>
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded font-mono text-xs text-emerald-400 break-all select-all">
                      {hexBytes}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono text-slate-400 block mb-1">
                      Decoded Instruction IR Breakdown ({assembledInstructions.length}):
                    </span>
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
                      {assembledInstructions.map((i) => (
                        <div key={i.offset} className="flex items-center gap-3 text-slate-300">
                          <span className="text-slate-500 w-10">
                            {String(i.offset).padStart(4, '0')}:
                          </span>
                          <span className="text-emerald-400 font-bold w-24">{i.mnemonic}</span>
                          <span className="text-slate-200 w-16">{i.operands.join(' ')}</span>
                          {i.comment && <span className="text-slate-500 italic">// {i.comment}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-xs text-slate-500 font-mono border border-dashed border-slate-800 rounded-lg">
                  Click "Verify & Disassemble" or "Assemble & Debug" to inspect compiled bytecode and decoded IR.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
