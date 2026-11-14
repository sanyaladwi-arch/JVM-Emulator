import React, { useState, useEffect } from 'react';
import {
  Code,
  Play,
  Terminal,
  Search,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Tag,
  Zap,
  ArrowRight,
  BookOpen,
  Filter,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Save,
  Edit3,
  RotateCcw,
  Check,
  X,
  FileCode,
} from 'lucide-react';
import {
  SAMPLE_PROGRAMS,
  SampleProgramDef,
  getCustomLeetCodeProblems,
  saveCustomLeetCodeProblem,
  deleteCustomLeetCodeProblem,
  buildSampleMetadata,
  TestCaseDef,
} from '../jvm/samples';
import { JavaCompiler } from '../jvm/javaCompiler';
import { BytecodeParser } from '../jvm/parser';
import { ExecutionEngine } from '../jvm/engine';

interface LeetCodeExplorerProps {
  onSelectProblem: (problem: SampleProgramDef) => void;
  onOpenInEditor: (problem: SampleProgramDef) => void;
  activeProblemId?: string;
}

interface TestRunResult {
  name: string;
  args: number[];
  expected: number;
  actual: number | null;
  passed: boolean;
  error?: string;
}

export const LeetCodeExplorer: React.FC<LeetCodeExplorerProps> = ({
  onSelectProblem,
  onOpenInEditor,
  activeProblemId,
}) => {
  const [customProblems, setCustomProblems] = useState<SampleProgramDef[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedProblem, setSelectedProblem] = useState<SampleProgramDef>(
    SAMPLE_PROGRAMS.find((p) => p.leetcodeId === 1) || SAMPLE_PROGRAMS[0]
  );
  const [previewTab, setPreviewTab] = useState<'java' | 'bytecode'>('java');

  // Interactive Solution Code Editor State
  const [isEditingSolution, setIsEditingSolution] = useState(false);
  const [editedJavaCode, setEditedJavaCode] = useState('');
  const [compilerError, setCompilerError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResults, setTestResults] = useState<TestRunResult[] | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // New Custom LeetCode Problem Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProblemNumber, setNewProblemNumber] = useState<number>(15);
  const [newProblemTitle, setNewProblemTitle] = useState('3Sum Representation');
  const [newDifficulty, setNewDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [newCategoryTags, setNewCategoryTags] = useState('Array, Two Pointers');
  const [newDescription, setNewDescription] = useState('Given an integer array nums, return the count of distinct triplets that sum to zero.');
  const [newDefaultArgs, setNewDefaultArgs] = useState('0');
  const [newExpectedOutput, setNewExpectedOutput] = useState('1');
  const [newJavaCode, setNewJavaCode] = useState(`public static int solve(int target) {
    int[] nums = { -1, 0, 1, 2, -1, -4 };
    int count = 0;
    for (int i = 0; i < nums.length; i++) {
        for (int j = i + 1; j < nums.length; j++) {
            if (nums[i] + nums[j] == target) count++;
        }
    }
    return count;
}`);
  const [modalError, setModalError] = useState<string | null>(null);

  // Load custom problems on mount
  useEffect(() => {
    setCustomProblems(getCustomLeetCodeProblems());
  }, []);

  // Sync edited code when selected problem changes
  useEffect(() => {
    setEditedJavaCode(selectedProblem.javaSourceSnippet || '');
    setCompilerError(null);
    setSaveSuccess(false);
    setTestResults(null);
  }, [selectedProblem]);

  // Combine built-in and custom LeetCode problems
  const allProblems = [
    ...customProblems,
    ...SAMPLE_PROGRAMS.filter((p) => p.category === 'leetcode' || p.leetcodeId !== undefined),
  ];

  // Collect all unique tags
  const allTags = Array.from(
    new Set(allProblems.flatMap((p) => p.tags || []))
  );

  const filteredProblems = allProblems.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.leetcodeId || '').includes(searchTerm);

    const matchesDifficulty =
      selectedDifficulty === 'all' || p.difficulty === selectedDifficulty;

    const matchesTag =
      selectedTag === 'all' || (p.tags && p.tags.includes(selectedTag));

    return matchesSearch && matchesDifficulty && matchesTag;
  });

  // Run Test Suite against current code
  const handleRunTestSuite = (codeToRun: string, prob: SampleProgramDef) => {
    setIsRunningTests(true);
    setCompilerError(null);

    try {
      // 1. Compile Java
      const res = JavaCompiler.compile(codeToRun);
      if (!res.success) {
        throw new Error(res.errorMessage || 'Java compilation failed');
      }

      // 2. Assemble Bytecode
      const { bytecode, instructions } = BytecodeParser.assemble(res.assemblySource);

      const className = res.className || prob.className;
      const methodName = res.methodName || prob.methodName;
      const descriptor = res.descriptor || prob.descriptor;

      const targetMethod = {
        className,
        methodName,
        descriptor,
        maxStack: Math.max(prob.maxStack, 8),
        maxLocals: Math.max(prob.maxLocals, 8),
        bytecode,
        instructions,
      };

      const cases = prob.testCases && prob.testCases.length > 0
        ? prob.testCases
        : [{ name: 'Default Args', args: prob.defaultArgs, expected: 0, description: 'Default execution' }];

      const results: TestRunResult[] = [];

      for (const tc of cases) {
        try {
          const engine = new ExecutionEngine([targetMethod], prob.constantPool);
          engine.loadProgram(className, methodName, descriptor, tc.args);

          let steps = 0;
          let snap = engine.getSnapshot();

          while (steps < 25000 && snap.status !== 'completed' && snap.status !== 'error') {
            steps++;
            const active = engine.step();
            snap = engine.getSnapshot();
            if (!active) break;
          }

          if (snap.status === 'completed' && snap.returnValue) {
            results.push({
              name: tc.name,
              args: tc.args,
              expected: tc.expected,
              actual: snap.returnValue.value,
              passed: snap.returnValue.value === tc.expected,
            });
          } else if (snap.status === 'error') {
            results.push({
              name: tc.name,
              args: tc.args,
              expected: tc.expected,
              actual: null,
              passed: false,
              error: snap.errorMessage,
            });
          } else {
            results.push({
              name: tc.name,
              args: tc.args,
              expected: tc.expected,
              actual: null,
              passed: false,
              error: 'Execution limit exceeded',
            });
          }
        } catch (tcErr: any) {
          results.push({
            name: tc.name,
            args: tc.args,
            expected: tc.expected,
            actual: null,
            passed: false,
            error: tcErr.message || String(tcErr),
          });
        }
      }

      setTestResults(results);
    } catch (err: any) {
      setCompilerError(err.message || String(err));
    } finally {
      setIsRunningTests(false);
    }
  };

  // Save modified solution to persistent storage
  const handleSaveCustomizedSolution = () => {
    try {
      setCompilerError(null);
      const res = JavaCompiler.compile(editedJavaCode);
      if (!res.success) {
        throw new Error(res.errorMessage || 'Java compilation failed');
      }

      // Verify bytecode
      BytecodeParser.assemble(res.assemblySource);

      const updated: SampleProgramDef = {
        ...selectedProblem,
        javaSourceSnippet: editedJavaCode,
        assemblySource: res.assemblySource,
      };

      saveCustomLeetCodeProblem(updated);
      setSelectedProblem(updated);
      setCustomProblems(getCustomLeetCodeProblems());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e: any) {
      setCompilerError(e.message || String(e));
    }
  };

  // Create new problem
  const handleCreateNewProblem = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    try {
      const compileRes = JavaCompiler.compile(newJavaCode);
      if (!compileRes.success) {
        throw new Error(`Java Compile Error: ${compileRes.errorMessage}`);
      }

      const { instructions } = BytecodeParser.assemble(compileRes.assemblySource);

      const parsedArgs = newDefaultArgs
        .split(/[,\s]+/)
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));

      const expVal = parseInt(newExpectedOutput.trim(), 10) || 0;

      const tags = newCategoryTags
        .split(/[,\s]+/)
        .map((t) => t.trim())
        .filter(Boolean);

      const cleanClassName = `LeetCode${newProblemNumber}`;
      const newProg: SampleProgramDef = {
        id: `custom_lc_${newProblemNumber}_${Date.now()}`,
        name: `LeetCode ${newProblemNumber}: ${newProblemTitle.trim()}`,
        category: 'leetcode',
        leetcodeId: newProblemNumber,
        difficulty: newDifficulty,
        tags: tags.length ? tags : ['Algorithm'],
        className: cleanClassName,
        methodName: 'solve',
        descriptor: parsedArgs.length === 0 ? '()I' : parsedArgs.length === 1 ? '(I)I' : '(II)I',
        description: newDescription.trim() || 'Custom LeetCode problem implemented in Java & JVM Bytecode.',
        defaultArgs: parsedArgs,
        argLabels: parsedArgs.map((_, i) => `arg${i}`),
        testCases: [
          {
            name: `Test 1 (${parsedArgs.join(', ') || 'default'})`,
            args: parsedArgs,
            expected: expVal,
            description: `Expected output ${expVal}`,
          },
        ],
        maxStack: 8,
        maxLocals: Math.max(8, parsedArgs.length + 4),
        constantPool: [{ index: 1, tag: 'CLASS_REF', value: cleanClassName }],
        javaSourceSnippet: newJavaCode,
        assemblySource: compileRes.assemblySource,
      };

      saveCustomLeetCodeProblem(newProg);
      const updatedList = getCustomLeetCodeProblems();
      setCustomProblems(updatedList);
      setSelectedProblem(newProg);
      setShowAddModal(false);
    } catch (err: any) {
      setModalError(err.message || String(err));
    }
  };

  const handleDeleteCustom = (probId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCustomLeetCodeProblem(probId);
    const updated = getCustomLeetCodeProblems();
    setCustomProblems(updated);
    if (selectedProblem.id === probId) {
      setSelectedProblem(SAMPLE_PROGRAMS[0]);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-950 text-slate-100 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
      {/* Left Column: Problem Catalog & Filters (5 cols) */}
      <div className="lg:w-5/12 flex flex-col h-full bg-slate-950/80 overflow-hidden">
        {/* Header & Quick Action Buttons */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                LeetCode Catalog ({filteredProblems.length})
              </h2>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-[11px] font-semibold transition-colors shadow-sm"
              title="Add any LeetCode problem or custom question"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add LeetCode Question</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by LeetCode #, title, or topic..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-500 mr-1">Difficulty:</span>
            {['all', 'Easy', 'Medium', 'Hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  selectedDifficulty === diff
                    ? diff === 'Easy'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : diff === 'Medium'
                      ? 'bg-amber-950 text-amber-300 border border-amber-700'
                      : diff === 'Hard'
                      ? 'bg-rose-950 text-rose-300 border border-rose-700'
                      : 'bg-slate-800 text-white border border-slate-700'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 text-[10px]">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-2 py-0.5 rounded transition-colors ${
                selectedTag === 'all'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All Topics
            </button>
            {allTags.slice(0, 7).map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  selectedTag === tag
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Problem Cards */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-900 p-2 space-y-1">
          {filteredProblems.map((prob) => {
            const isSelected = selectedProblem.id === prob.id;
            const isActiveInVm = activeProblemId === prob.id;
            const isCustom = prob.id.startsWith('custom_lc_');

            return (
              <div
                key={prob.id}
                onClick={() => setSelectedProblem(prob)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-900/90 border border-indigo-500/50 shadow-md'
                    : 'hover:bg-slate-900/40 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {prob.leetcodeId && (
                      <span className="font-mono text-xs font-bold text-amber-400">
                        #{prob.leetcodeId}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-white">
                      {prob.name.replace(/^LeetCode\s+\d+:\s*/, '')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isCustom && (
                      <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-700/60 px-1 py-0.2 rounded font-mono">
                        CUSTOM
                      </span>
                    )}
                    {isActiveInVm && (
                      <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-700 px-1.5 py-0.2 rounded font-mono">
                        ACTIVE
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        prob.difficulty === 'Easy'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                          : prob.difficulty === 'Medium'
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                      }`}
                    >
                      {prob.difficulty || 'Easy'}
                    </span>

                    {isCustom && (
                      <button
                        onClick={(e) => handleDeleteCustom(prob.id, e)}
                        className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors"
                        title="Delete custom question"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed font-sans">
                  {prob.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
                  <div className="flex items-center gap-1.5">
                    {prob.tags?.map((t) => (
                      <span key={t} className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-400">
                        {t}
                      </span>
                    ))}
                  </div>
                  <span>{prob.className}.{prob.methodName}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Problem Detail & Interactive Solution Studio (7 cols) */}
      <div className="lg:w-7/12 flex flex-col h-full bg-slate-950 overflow-y-auto divide-y divide-slate-800">
        {/* Detail Header & Main Actions */}
        <div className="p-6 bg-slate-900/40">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              {selectedProblem.leetcodeId && (
                <span className="text-sm font-mono font-bold text-amber-400">
                  LeetCode #{selectedProblem.leetcodeId}
                </span>
              )}
              <h1 className="text-base font-bold text-white tracking-tight">
                {selectedProblem.name}
              </h1>
            </div>

            {/* Launchers */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  // If solution was edited, apply before launching
                  if (isEditingSolution && editedJavaCode) {
                    try {
                      const res = JavaCompiler.compile(editedJavaCode);
                      if (res.success) {
                        const updated = {
                          ...selectedProblem,
                          javaSourceSnippet: editedJavaCode,
                          assemblySource: res.assemblySource,
                        };
                        onSelectProblem(updated);
                        return;
                      }
                    } catch {
                      // fallback
                    }
                  }
                  onSelectProblem(selectedProblem);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold transition-colors shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run in Debugger</span>
              </button>

              <button
                onClick={() => {
                  const probToOpen = isEditingSolution
                    ? { ...selectedProblem, javaSourceSnippet: editedJavaCode }
                    : selectedProblem;
                  onOpenInEditor(probToOpen);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-medium border border-slate-700 transition-colors"
              >
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                <span>Open in Assembler</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-4">
            <span
              className={`font-semibold ${
                selectedProblem.difficulty === 'Easy'
                  ? 'text-emerald-400'
                  : selectedProblem.difficulty === 'Medium'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {selectedProblem.difficulty || 'Easy'}
            </span>
            <span>·</span>
            <span>Method: <code className="text-slate-300 font-mono">{selectedProblem.className}.{selectedProblem.methodName}{selectedProblem.descriptor}</code></span>
            <span>·</span>
            <span>MaxStack: {selectedProblem.maxStack} slots</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            {selectedProblem.description}
          </p>

          {/* Test Cases Panel */}
          {selectedProblem.testCases && selectedProblem.testCases.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Automated Test Cases ({selectedProblem.testCases.length})
                </h3>

                <button
                  onClick={() => handleRunTestSuite(isEditingSolution ? editedJavaCode : selectedProblem.javaSourceSnippet, selectedProblem)}
                  disabled={isRunningTests}
                  className="px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 rounded text-[11px] font-mono flex items-center gap-1 transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isRunningTests ? 'Running...' : 'Run All Test Cases'}</span>
                </button>
              </div>

              {/* Test Results Output */}
              {testResults && (
                <div className="mb-3 space-y-1">
                  {testResults.map((tr, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded text-[11px] font-mono border flex items-center justify-between ${
                        tr.passed
                          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                          : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {tr.passed ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        )}
                        <span>{tr.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span>Expected: <strong>{tr.expected}</strong></span>
                        <span>Actual: <strong>{tr.actual !== null ? tr.actual : 'error'}</strong></span>
                        <span className={`px-1.5 py-0.2 rounded font-bold ${tr.passed ? 'bg-emerald-900/60 text-emerald-200' : 'bg-rose-900/60 text-rose-200'}`}>
                          {tr.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1.5 font-mono text-xs">
                {selectedProblem.testCases.map((tc, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-md text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-400 font-bold">Case {idx + 1}:</span>
                      <span className="text-slate-300">{tc.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">
                        Args: <span className="text-slate-200">{tc.args.length ? tc.args.join(', ') : 'none'}</span>
                      </span>
                      <span className="text-emerald-400 font-bold">
                        Expected: {tc.expected}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Code Editor & Preview Section */}
        <div className="flex-1 flex flex-col p-6 bg-slate-950">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded border border-slate-800 text-xs">
                <button
                  onClick={() => setPreviewTab('java')}
                  className={`px-3 py-1 rounded transition-colors ${
                    previewTab === 'java'
                      ? 'bg-slate-800 text-amber-400 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Java Solution
                </button>
                <button
                  onClick={() => setPreviewTab('bytecode')}
                  className={`px-3 py-1 rounded transition-colors ${
                    previewTab === 'bytecode'
                      ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  JVM Bytecode
                </button>
              </div>

              {/* Edit Mode Toggle */}
              {previewTab === 'java' && (
                <button
                  onClick={() => setIsEditingSolution(!isEditingSolution)}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors border ${
                    isEditingSolution
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingSolution ? 'Editing Active' : 'Edit Solution Code'}</span>
                </button>
              )}
            </div>

            {/* Actions for Editor */}
            {isEditingSolution && previewTab === 'java' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRunTestSuite(editedJavaCode, selectedProblem)}
                  className="px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 rounded text-xs font-semibold flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Test Code</span>
                </button>

                <button
                  onClick={handleSaveCustomizedSolution}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-sm"
                >
                  <Save className="w-3 h-3" />
                  <span>Save</span>
                </button>

                <button
                  onClick={() => setEditedJavaCode(selectedProblem.javaSourceSnippet)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded text-xs border border-slate-700"
                  title="Revert to original Java snippet"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Compiler notification */}
          {compilerError && (
            <div className="mb-3 p-2.5 bg-rose-950/80 border border-rose-800 rounded text-xs font-mono text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{compilerError}</span>
            </div>
          )}
          {saveSuccess && (
            <div className="mb-3 p-2 bg-emerald-950/80 border border-emerald-800 rounded text-xs font-mono text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Solution saved successfully to your LeetCode Bank!</span>
            </div>
          )}

          {/* Main Code Area */}
          {previewTab === 'java' ? (
            isEditingSolution ? (
              <div className="flex-1 flex flex-col">
                <textarea
                  value={editedJavaCode}
                  onChange={(e) => setEditedJavaCode(e.target.value)}
                  rows={16}
                  className="w-full flex-1 p-4 bg-slate-950 border border-indigo-500/70 rounded-lg font-mono text-xs text-indigo-100 focus:outline-none focus:border-indigo-400 leading-relaxed resize-none shadow-inner"
                  placeholder="Edit Java solution algorithm..."
                  spellCheck={false}
                />
                <span className="text-[10px] text-slate-500 font-mono mt-1">
                  Tip: Supports int variables, while/for loops, if/else, array allocation, Math.max/min, and return statements.
                </span>
              </div>
            ) : (
              <div className="flex-1 relative group">
                <pre className="h-full p-4 bg-slate-900/40 border border-slate-800 rounded-lg font-mono text-xs text-slate-200 overflow-auto leading-relaxed">
                  {selectedProblem.javaSourceSnippet}
                </pre>
                <button
                  onClick={() => setIsEditingSolution(true)}
                  className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 bg-indigo-900/90 hover:bg-indigo-800 text-indigo-200 rounded text-xs font-sans flex items-center gap-1 shadow-md"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Source Code</span>
                </button>
              </div>
            )
          ) : (
            <pre className="flex-1 p-4 bg-slate-900/40 border border-slate-800 rounded-lg font-mono text-xs text-slate-200 overflow-auto leading-relaxed">
              {selectedProblem.assemblySource}
            </pre>
          )}
        </div>
      </div>

      {/* Add Custom LeetCode Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Add Any LeetCode Question
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-2.5 bg-rose-950/80 border border-rose-800 rounded text-xs font-mono text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateNewProblem} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    LeetCode Problem #
                  </label>
                  <input
                    type="number"
                    value={newProblemNumber}
                    onChange={(e) => setNewProblemNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-mono"
                    placeholder="e.g. 15"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-semibold block mb-1">
                    Problem Title
                  </label>
                  <input
                    type="text"
                    value={newProblemTitle}
                    onChange={(e) => setNewProblemTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200"
                    placeholder="e.g. 3Sum Target Match"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Difficulty
                  </label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Topic Tags
                  </label>
                  <input
                    type="text"
                    value={newCategoryTags}
                    onChange={(e) => setNewCategoryTags(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200"
                    placeholder="e.g. Array, Two Pointers"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Problem Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 resize-none"
                  placeholder="Describe the problem, input format, and constraints..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Test Input Arguments
                  </label>
                  <input
                    type="text"
                    value={newDefaultArgs}
                    onChange={(e) => setNewDefaultArgs(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-mono"
                    placeholder="e.g. 0 or 5, 10"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Expected Return Value
                  </label>
                  <input
                    type="number"
                    value={newExpectedOutput}
                    onChange={(e) => setNewExpectedOutput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-mono"
                    placeholder="e.g. 1"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">
                    Java Solution Source Code
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Auto-transpiled to JVM Bytecode
                  </span>
                </div>
                <textarea
                  value={newJavaCode}
                  onChange={(e) => setNewJavaCode(e.target.value)}
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 font-mono text-xs text-indigo-200 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
                  spellCheck={false}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-semibold transition-colors shadow-sm"
                >
                  Create & Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
