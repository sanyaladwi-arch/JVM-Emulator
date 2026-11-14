import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TopNav, ActiveTab, UiTheme } from './components/TopNav';
import { DebuggerView } from './components/DebuggerView';
import { BytecodeEditor } from './components/BytecodeEditor';
import { JavaCodeExplorer } from './components/JavaCodeExplorer';
import { ArchitectureSpecs } from './components/ArchitectureSpecs';
import { LeetCodeExplorer } from './components/LeetCodeExplorer';
import { ExecutionEngine } from './jvm/engine';
import { ExecutionSnapshot, InstructionIR, StepTraceEntry } from './jvm/types';
import { buildSampleMetadata, SampleProgramDef, SAMPLE_PROGRAMS } from './jvm/samples';
import JSZip from 'jszip';
import { JAVA_PROJECT_FILES } from './jvm/javaSourceFiles';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('debugger');
  const [uiTheme, setUiTheme] = useState<UiTheme>('cyber');
  const [selectedProgram, setSelectedProgram] = useState<SampleProgramDef>(SAMPLE_PROGRAMS[0]);
  const [programArgs, setProgramArgs] = useState<number[]>([...SAMPLE_PROGRAMS[0].defaultArgs]);
  const [speedMs, setSpeedMs] = useState<number>(200);

  // Engine instance & execution state
  const engineRef = useRef<ExecutionEngine | null>(null);
  const instructionsRef = useRef<InstructionIR[]>([]);
  const [snapshot, setSnapshot] = useState<ExecutionSnapshot>({
    status: 'idle',
    stepCount: 0,
    pc: 0,
    callStack: [],
    operandStack: [],
    localVariables: [],
    heapArrays: [],
    heapObjects: [],
    constantPool: [],
    stdout: [],
    breakpoints: new Set(),
  });
  const [traces, setTraces] = useState<StepTraceEntry[]>([]);

  // Initialize or re-initialize VM with program
  const initProgram = useCallback((prog: SampleProgramDef, args: number[]) => {
    const meta = buildSampleMetadata(prog);
    instructionsRef.current = meta.instructions;

    const engine = new ExecutionEngine([meta], prog.constantPool);
    engine.loadProgram(prog.className, prog.methodName, prog.descriptor, args);

    engineRef.current = engine;
    setSnapshot(engine.getSnapshot());
    setTraces(engine.getTraces());
  }, []);

  // Initialize on mount
  useEffect(() => {
    initProgram(selectedProgram, programArgs);
  }, []);

  // Step action
  const handleStep = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.step();
    setSnapshot(engineRef.current.getSnapshot());
    setTraces(engineRef.current.getTraces());
  }, []);

  // Run / Pause loop
  const timerRef = useRef<number | null>(null);

  const handlePause = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (engineRef.current) {
      setSnapshot((prev) => ({ ...prev, status: 'paused' }));
    }
  }, []);

  const handleRun = useCallback(() => {
    if (!engineRef.current) return;
    handlePause();

    const engine = engineRef.current;
    setSnapshot((prev) => ({ ...prev, status: 'running' }));

    if (speedMs === 0) {
      // Instant execution loop
      while (engine.getSnapshot().status === 'paused' || engine.getSnapshot().status === 'running') {
        const canContinue = engine.step();
        const snap = engine.getSnapshot();
        if (!canContinue || snap.status === 'completed' || snap.status === 'error') {
          break;
        }
        if (snap.breakpoints.has(snap.pc)) {
          break;
        }
      }
      setSnapshot(engine.getSnapshot());
      setTraces(engine.getTraces());
      return;
    }

    timerRef.current = window.setInterval(() => {
      const snapBefore = engine.getSnapshot();
      if (snapBefore.status === 'completed' || snapBefore.status === 'error') {
        handlePause();
        return;
      }

      const active = engine.step();
      const currentSnap = engine.getSnapshot();

      setSnapshot(currentSnap);
      setTraces(engine.getTraces());

      // Check breakpoints
      if (currentSnap.breakpoints.has(currentSnap.pc)) {
        handlePause();
        return;
      }

      if (!active || currentSnap.status === 'completed' || currentSnap.status === 'error') {
        handlePause();
      }
    }, speedMs);
  }, [handlePause, speedMs]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleReset = useCallback(() => {
    handlePause();
    initProgram(selectedProgram, programArgs);
  }, [handlePause, initProgram, selectedProgram, programArgs]);

  const handleProgramChange = (prog: SampleProgramDef) => {
    handlePause();
    setSelectedProgram(prog);
    setProgramArgs([...prog.defaultArgs]);
    initProgram(prog, [...prog.defaultArgs]);
  };

  const handleArgsChange = (newArgs: number[]) => {
    setProgramArgs(newArgs);
    handlePause();
    initProgram(selectedProgram, newArgs);
  };

  const handleToggleBreakpoint = (pc: number) => {
    if (!engineRef.current) return;
    engineRef.current.toggleBreakpoint(pc);
    setSnapshot(engineRef.current.getSnapshot());
  };

  // Transition from Debugger to Editor with currently selected code
  const [editorInitialCode, setEditorInitialCode] = useState<string | null>(null);
  const [editorInitialName, setEditorInitialName] = useState<string | null>(null);
  const [editorInitialArgs, setEditorInitialArgs] = useState<string | null>(null);
  const [editorInitialLanguage, setEditorInitialLanguage] = useState<'bytecode' | 'java'>('bytecode');

  const handleEditCurrentInAssembler = useCallback((lang: 'bytecode' | 'java' = 'java') => {
    const code = lang === 'java' && selectedProgram.javaSourceSnippet
      ? selectedProgram.javaSourceSnippet
      : selectedProgram.assemblySource;
    setEditorInitialCode(code);
    setEditorInitialName(selectedProgram.className || selectedProgram.name);
    setEditorInitialArgs(programArgs.join(', '));
    setEditorInitialLanguage(lang);
    setActiveTab('editor');
  }, [selectedProgram, programArgs]);

  const handleLoadCustomBytecode = (
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
  ) => {
    handlePause();

    const className = metadata?.className || name || 'CustomProgram';
    const methodName = metadata?.methodName || 'main';
    const descriptor = metadata?.descriptor || (args.length === 0 ? '()I' : args.length === 1 ? '(I)I' : '(II)I');
    const maxStack = metadata?.maxStack || 8;
    const maxLocals = metadata?.maxLocals || Math.max(8, args.length + 2);

    const customProg: SampleProgramDef = {
      id: 'custom_' + Date.now(),
      name: name || 'Custom Assembled Program',
      category: 'algo',
      className,
      methodName,
      descriptor,
      description: `User-assembled custom JVM bytecode program (${instructions.length} instructions)`,
      defaultArgs: args,
      argLabels: args.map((_, i) => `arg${i}`),
      maxStack,
      maxLocals,
      constantPool: [
        { index: 1, tag: 'CLASS_REF', value: className },
        { index: 2, tag: 'METHOD_REF', value: `${className}.${methodName}`, descriptor },
      ],
      javaSourceSnippet:
        metadata?.javaSource ||
        `// Assembled from user JVM bytecode\n// ${instructions.length} instructions\n// Signature: ${className}.${methodName}${descriptor}`,
      assemblySource: assembly,
    };

    setSelectedProgram(customProg);
    setProgramArgs(args);

    instructionsRef.current = instructions;
    const meta = {
      className: customProg.className,
      methodName: customProg.methodName,
      descriptor: customProg.descriptor,
      maxStack: customProg.maxStack,
      maxLocals: customProg.maxLocals,
      bytecode,
      instructions,
    };

    const engine = new ExecutionEngine([meta], customProg.constantPool);
    engine.loadProgram(customProg.className, customProg.methodName, customProg.descriptor, args);

    engineRef.current = engine;
    setSnapshot(engine.getSnapshot());
    setTraces(engine.getTraces());

    setActiveTab('debugger');
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    for (const file of JAVA_PROJECT_FILES) {
      zip.file(file.path, file.content);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jvm-emulator-maven-source.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Keyboard hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'F7' || e.code === 'KeyN') {
        e.preventDefault();
        handleStep();
      } else if (e.key === 'F5') {
        e.preventDefault();
        if (snapshot.status === 'running') {
          handlePause();
        } else {
          handleRun();
        }
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStep, handleRun, handlePause, handleReset, snapshot.status]);

  return (
    <div
      className={`flex flex-col h-screen w-screen overflow-hidden select-none transition-colors duration-300 ${
        uiTheme === 'neon'
          ? 'bg-[#08090d] text-slate-100'
          : uiTheme === 'enterprise'
          ? 'bg-[#0f1117] text-slate-100'
          : 'bg-[#090d16] text-slate-100'
      }`}
    >
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onQuickReset={handleReset}
        onDownloadZip={handleDownloadZip}
        status={snapshot.status}
        stepCount={snapshot.stepCount}
        theme={uiTheme}
        onThemeChange={setUiTheme}
      />

      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'debugger' && (
          <DebuggerView
            snapshot={snapshot}
            instructions={instructionsRef.current}
            traces={traces}
            selectedProgram={selectedProgram}
            programArgs={programArgs}
            onProgramChange={handleProgramChange}
            onArgsChange={handleArgsChange}
            onStep={handleStep}
            onRun={handleRun}
            onPause={handlePause}
            onReset={handleReset}
            onToggleBreakpoint={handleToggleBreakpoint}
            speedMs={speedMs}
            onSpeedChange={setSpeedMs}
            onEditInAssembler={handleEditCurrentInAssembler}
            onOpenLeetCode={() => setActiveTab('leetcode')}
            uiTheme={uiTheme}
            onThemeChange={setUiTheme}
          />
        )}

        {activeTab === 'editor' && (
          <BytecodeEditor
            onLoadCustomBytecode={handleLoadCustomBytecode}
            initialCode={editorInitialCode}
            initialName={editorInitialName}
            initialArgs={editorInitialArgs}
            initialLanguage={editorInitialLanguage}
          />
        )}

        {activeTab === 'leetcode' && (
          <LeetCodeExplorer
            onSelectProblem={(prog) => {
              handleProgramChange(prog);
              setActiveTab('debugger');
            }}
            onOpenInEditor={(prog) => {
              setSelectedProgram(prog);
              setProgramArgs([...prog.defaultArgs]);
              setEditorInitialCode(prog.javaSourceSnippet || prog.assemblySource);
              setEditorInitialName(prog.className || prog.name);
              setEditorInitialArgs(prog.defaultArgs.join(', '));
              setEditorInitialLanguage('java');
              setActiveTab('editor');
            }}
            activeProblemId={selectedProgram.id}
          />
        )}

        {activeTab === 'codebase' && <JavaCodeExplorer />}

        {activeTab === 'specs' && <ArchitectureSpecs />}
      </main>
    </div>
  );
}
