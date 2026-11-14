import React, { useState } from 'react';
import {
  Folder,
  FileCode,
  Download,
  Copy,
  Check,
  Package,
  Layers,
  Terminal,
  Cpu,
  FileText,
} from 'lucide-react';
import JSZip from 'jszip';
import { JAVA_PROJECT_FILES, JavaFileEntry } from '../jvm/javaSourceFiles';

export const JavaCodeExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<JavaFileEntry>(JAVA_PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportZip = async () => {
    try {
      setExporting(true);
      const zip = new JSZip();

      for (const file of JAVA_PROJECT_FILES) {
        zip.file(file.path, file.content);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jvm-emulator-source.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export zip:', e);
    } finally {
      setExporting(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Files' },
    { id: 'build', label: 'Build & Config' },
    { id: 'memory', label: 'Memory Areas' },
    { id: 'instructions', label: 'Opcodes & IR' },
    { id: 'engine', label: 'Execution Engine' },
    { id: 'cli', label: 'CLI & Driver' },
    { id: 'test', label: 'JUnit Tests' },
  ];

  const [activeCategory, setActiveCategory] = useState('all');

  const filteredFiles = activeCategory === 'all'
    ? JAVA_PROJECT_FILES
    : JAVA_PROJECT_FILES.filter((f) => f.category === activeCategory);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 border-b border-slate-800 bg-slate-900/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              Java Source Code & Maven Project Explorer
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              Production-ready, modular Java 17+ architecture with 100% implementation fidelity
            </p>
          </div>
        </div>

        <button
          onClick={handleExportZip}
          disabled={exporting}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors shadow-sm disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          {exporting ? 'Generating ZIP...' : 'Download Maven Project (.ZIP)'}
        </button>
      </div>

      {/* Main Split View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        {/* Left Column: File Tree & Filter (4 cols) */}
        <div className="lg:col-span-4 flex flex-col h-full bg-slate-950 overflow-hidden">
          {/* Category Filter Pills */}
          <div className="p-3 border-b border-slate-800 flex flex-wrap gap-1 bg-slate-900/30">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
                  activeCategory === c.id
                    ? 'bg-slate-800 text-emerald-400 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* File List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-left transition-colors ${
                    isSelected
                      ? 'bg-slate-800 text-emerald-300 font-semibold border border-slate-700'
                      : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {file.name.endsWith('.xml') ? (
                      <Package className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : file.name.endsWith('.md') ? (
                      <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    ) : (
                      <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    <span className="truncate">{file.name}</span>
                  </div>

                  <span className="text-[10px] text-slate-500 font-sans ml-2 shrink-0 uppercase tracking-wider">
                    {file.category}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Package Summary Box */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/20 text-xs text-slate-400">
            <span className="font-semibold text-slate-300 block mb-1">Architecture Packages:</span>
            <ul className="space-y-0.5 text-[11px] font-mono text-slate-500">
              <li>· com.compiler.jvm.memory (LVT, Stack, Heap)</li>
              <li>· com.compiler.jvm.instructions (Opcode, IR)</li>
              <li>· com.compiler.jvm.parser (Class & Bytecode)</li>
              <li>· com.compiler.jvm.engine (Interpreter Loop)</li>
              <li>· com.compiler.jvm.cli (Tracer & Driver)</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Code Viewer (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-full bg-slate-900/20 overflow-hidden">
          {/* File Header */}
          <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-800 bg-slate-900/60 text-xs">
            <div className="flex items-center gap-2 font-mono text-slate-300">
              <span className="text-slate-500">Path:</span>
              <span className="text-emerald-400">{selectedFile.path}</span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Source</span>
                </>
              )}
            </button>
          </div>

          {/* Code Viewer with Line Numbers */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed bg-slate-950">
            <div className="flex">
              {/* Line Numbers */}
              <div className="text-slate-600 select-none pr-4 text-right border-r border-slate-800 shrink-0 font-mono">
                {selectedFile.content.split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Code Content */}
              <pre className="pl-4 text-slate-200 overflow-x-auto select-text font-mono">
                {selectedFile.content}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
