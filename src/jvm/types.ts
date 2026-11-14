export type JvmType = 'INT' | 'REFERENCE';

export interface JvmValue {
  type: JvmType;
  value: number; // For INT: 32-bit int; for REFERENCE: heap address or -1 for null
}

export interface ConstantPoolEntry {
  index: number;
  tag: 'UTF8' | 'INTEGER' | 'CLASS_REF' | 'STRING_REF' | 'METHOD_REF' | 'FIELD_REF';
  value: string | number;
  descriptor?: string;
}

export interface InstructionIR {
  offset: number;
  opcode: number;
  mnemonic: string;
  category: 'push' | 'load' | 'store' | 'stack' | 'math' | 'branch' | 'array' | 'invoke' | 'return';
  operands: number[];
  operandBytes: number;
  branchTarget?: number;
  comment?: string;
}

export interface MethodMetadata {
  className: string;
  methodName: string;
  descriptor: string;
  maxStack: number;
  maxLocals: number;
  bytecode: Uint8Array;
  instructions: InstructionIR[];
}

export interface ClassMetadata {
  className: string;
  superClassName: string;
  constantPool: ConstantPoolEntry[];
  methods: Map<string, MethodMetadata>;
}

export interface HeapArray {
  address: number;
  length: number;
  type: 'INT';
  elements: number[];
}

export interface HeapObject {
  address: number;
  className: string;
  fields: Record<string, JvmValue>;
}

export interface StackFrameState {
  id: string;
  className: string;
  methodName: string;
  descriptor: string;
  pc: number;
  maxStack: number;
  maxLocals: number;
  operandStack: JvmValue[];
  localVariableTable: (JvmValue | null)[];
  currentInstruction?: InstructionIR;
}

export interface StepTraceEntry {
  step: number;
  pc: number;
  mnemonic: string;
  operands: number[];
  method: string;
  callDepth: number;
  stackBefore: JvmValue[];
  stackAfter: JvmValue[];
  lvtSnapshot: (JvmValue | null)[];
  comment?: string;
  timestamp: number;
}

export interface ExecutionSnapshot {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  stepCount: number;
  pc: number;
  currentFrame?: StackFrameState;
  callStack: StackFrameState[];
  operandStack: JvmValue[];
  localVariables: (JvmValue | null)[];
  heapArrays: HeapArray[];
  heapObjects: HeapObject[];
  constantPool: ConstantPoolEntry[];
  stdout: string[];
  returnValue?: JvmValue;
  errorMessage?: string;
  breakpoints: Set<number>;
}
