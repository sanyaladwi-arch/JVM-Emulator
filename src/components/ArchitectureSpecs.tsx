import React from 'react';
import { BookOpen, Terminal, CheckCircle2, Layers, HardDrive, Cpu, Database } from 'lucide-react';
import { OPCODES } from '../jvm/constants';

export const ArchitectureSpecs: React.FC = () => {
  const opcodeList = Object.values(OPCODES);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans overflow-y-auto p-6 md:p-8 space-y-8">
      {/* Overview Banner */}
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">
              JVM Virtual Machine Architecture & Specification
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Compliant implementation of the JVM Specification (JVMS) SE 17+
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          The Java Virtual Machine (JVM) is a stack-based abstract computing machine. It defines
          runtime data areas shared across the process (Method Area, Heap) and areas private to each
          thread (PC Register, JVM Call Stack). This implementation features strict type-safety,
          stack overflow prevention, dynamic constant pool resolution, and an interactive execution
          tracer.
        </p>
      </div>

      {/* Runtime Data Areas Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          1. Runtime Data Areas (JVM Memory Model)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* PC Register */}
          <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-xs font-bold uppercase tracking-wider">PC Register</span>
              <span className="text-[10px] font-mono text-slate-500">Per-Thread</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Holds the bytecode address/offset of the JVM instruction currently being executed by the
              active stack frame. Updated sequentially or modified by branch instructions (<code className="text-emerald-300">goto</code>, <code className="text-emerald-300">ifeq</code>, <code className="text-emerald-300">if_icmpgt</code>).
            </p>
          </div>

          {/* JVM Stack & Frames */}
          <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-cyan-400">
              <span className="text-xs font-bold uppercase tracking-wider">JVM Stack & Frames</span>
              <span className="text-[10px] font-mono text-slate-500">Per-Thread</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Stores stack frames. Each frame holds a <strong>Local Variable Table (LVT)</strong> and an <strong>Operand Stack (LIFO)</strong> for evaluating expressions, along with references for dynamic linking. Enforces depth limits to prevent stack overflows.
            </p>
          </div>

          {/* Heap Memory */}
          <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-pink-400">
              <span className="text-xs font-bold uppercase tracking-wider">Heap Memory</span>
              <span className="text-[10px] font-mono text-slate-500">Shared</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dynamically allocates class instances and primitive arrays (<code className="text-pink-300">newarray</code>). Objects are assigned simulated physical addresses (e.g., <code className="text-pink-300">@0x1000</code>) referenced safely by 32-bit reference slots.
            </p>
          </div>

          {/* Method Area & Constant Pool */}
          <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-purple-400">
              <span className="text-xs font-bold uppercase tracking-wider">Method Area & CP</span>
              <span className="text-[10px] font-mono text-slate-500">Shared</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Stores class structures, method bytecode, field descriptors, and the <strong>Runtime Constant Pool</strong> (UTF8, integers, class/method references) required for dynamic linking and method invocation (<code className="text-purple-300">invokestatic</code>).
            </p>
          </div>
        </div>
      </div>

      {/* CLI & Compilation Guide */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          2. Compilation & Setup Guide (Maven CLI)
        </h2>

        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg space-y-4 font-mono text-xs">
          <div>
            <span className="text-slate-400 block mb-1"># 1. Compile the Maven Project:</span>
            <div className="p-2 bg-slate-950 rounded border border-slate-800 text-emerald-400">
              mvn clean package
            </div>
          </div>

          <div>
            <span className="text-slate-400 block mb-1"># 2. Run the Full JUnit 5 Test Suite:</span>
            <div className="p-2 bg-slate-950 rounded border border-slate-800 text-emerald-400">
              mvn test
            </div>
          </div>

          <div>
            <span className="text-slate-400 block mb-1"># 3. Execute Driver Programs with Step-by-Step Tracer:</span>
            <div className="space-y-1.5">
              <div className="p-2 bg-slate-950 rounded border border-slate-800 text-slate-300">
                java -jar target/jvm-emulator-1.0.0.jar factorial 5
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800 text-slate-300">
                java -jar target/jvm-emulator-1.0.0.jar fibonacci 7
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800 text-slate-300">
                java -jar target/jvm-emulator-1.0.0.jar array 10
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800 text-slate-300">
                java -jar target/jvm-emulator-1.0.0.jar gcd 48 18
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supported Bytecode Instructions Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            3. Supported JVM Bytecode Instruction Set ({opcodeList.length} Opcodes)
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Core arithmetic, branching, array, and invocation opcodes
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 select-none">
              <tr>
                <th className="py-2.5 px-4 w-20">Hex</th>
                <th className="py-2.5 px-4 w-32">Mnemonic</th>
                <th className="py-2.5 px-4 w-24">Operands</th>
                <th className="py-2.5 px-4 w-28">Category</th>
                <th className="py-2.5 px-4">Semantic Description & Stack Effect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-950">
              {opcodeList.map((op) => (
                <tr key={op.code} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-2 px-4 text-emerald-400 tabular-nums">
                    0x{op.code.toString(16).padStart(2, '0').toUpperCase()}
                  </td>
                  <td className="py-2 px-4 font-bold text-slate-100">{op.mnemonic}</td>
                  <td className="py-2 px-4 text-slate-400 tabular-nums">{op.operands} byte(s)</td>
                  <td className="py-2 px-4">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-sans">
                      {op.category}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-slate-300 font-sans text-xs">
                    {op.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
