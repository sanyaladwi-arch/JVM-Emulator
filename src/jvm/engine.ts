import { OPCODES } from './constants';
import { RuntimeConstantPool, VirtualHeap } from './memory';
import {
  ConstantPoolEntry,
  ExecutionSnapshot,
  InstructionIR,
  JvmValue,
  MethodMetadata,
  StackFrameState,
  StepTraceEntry,
} from './types';

interface InternalFrame {
  id: string;
  className: string;
  methodName: string;
  descriptor: string;
  pc: number;
  maxStack: number;
  maxLocals: number;
  bytecode: Uint8Array;
  instructions: InstructionIR[];
  constantPool: RuntimeConstantPool;
  operandStack: JvmValue[];
  localVariables: (JvmValue | null)[];
}

export class ExecutionEngine {
  private methodRegistry = new Map<string, MethodMetadata>();
  private constantPool: RuntimeConstantPool;
  private heap = new VirtualHeap();
  private callStack: InternalFrame[] = [];
  private stepCount = 0;
  private breakpoints = new Set<number>();
  private stdout: string[] = [];
  private traces: StepTraceEntry[] = [];
  private status: 'idle' | 'running' | 'paused' | 'completed' | 'error' = 'idle';
  private errorMessage?: string;
  private returnValue?: JvmValue;

  constructor(methods: MethodMetadata[], cpEntries: ConstantPoolEntry[]) {
    this.constantPool = new RuntimeConstantPool(cpEntries);
    for (const m of methods) {
      this.methodRegistry.set(`${m.className}.${m.methodName}${m.descriptor}`, m);
    }
  }

  loadProgram(
    className: string,
    methodName: string,
    descriptor: string,
    args: number[] = [],
    breakpoints?: number[]
  ) {
    this.reset();
    if (breakpoints) {
      this.breakpoints = new Set(breakpoints);
    }

    const key = `${className}.${methodName}${descriptor}`;
    const method = this.methodRegistry.get(key);
    if (!method) {
      throw new Error(`Entry method not found: ${key}`);
    }

    const lvt: (JvmValue | null)[] = new Array(method.maxLocals).fill(null);
    for (let i = 0; i < args.length && i < method.maxLocals; i++) {
      lvt[i] = { type: 'INT', value: args[i] };
    }

    const initialFrame: InternalFrame = {
      id: `frame-0-${method.methodName}`,
      className: method.className,
      methodName: method.methodName,
      descriptor: method.descriptor,
      pc: 0,
      maxStack: method.maxStack,
      maxLocals: method.maxLocals,
      bytecode: method.bytecode,
      instructions: method.instructions,
      constantPool: this.constantPool,
      operandStack: [],
      localVariables: lvt,
    };

    this.callStack.push(initialFrame);
    this.status = 'paused';
  }

  toggleBreakpoint(pc: number) {
    if (this.breakpoints.has(pc)) {
      this.breakpoints.delete(pc);
    } else {
      this.breakpoints.add(pc);
    }
  }

  hasBreakpoint(pc: number): boolean {
    return this.breakpoints.has(pc);
  }

  step(): boolean {
    if (this.status === 'completed' || this.status === 'error') {
      return false;
    }

    if (this.callStack.length === 0) {
      this.status = 'completed';
      return false;
    }

    const frame = this.callStack[this.callStack.length - 1];
    if (frame.pc >= frame.bytecode.length) {
      this.status = 'completed';
      return false;
    }

    const initialPc = frame.pc;
    const rawOp = frame.bytecode[frame.pc++];
    const def = OPCODES[rawOp];

    if (!def) {
      this.status = 'error';
      this.errorMessage = `Unknown opcode 0x${rawOp.toString(16).padStart(2, '0')} at PC ${initialPc}`;
      return false;
    }

    const stackBefore = [...frame.operandStack];
    const operands: number[] = [];
    let comment: string | undefined;

    try {
      switch (def.code) {
        case 0x00: // nop
          break;
        case 0x01: // aconst_null
          frame.operandStack.push({ type: 'REFERENCE', value: -1 });
          break;
        case 0x02: // iconst_m1
          frame.operandStack.push({ type: 'INT', value: -1 });
          break;
        case 0x03: // iconst_0
          frame.operandStack.push({ type: 'INT', value: 0 });
          break;
        case 0x04: // iconst_1
          frame.operandStack.push({ type: 'INT', value: 1 });
          break;
        case 0x05: // iconst_2
          frame.operandStack.push({ type: 'INT', value: 2 });
          break;
        case 0x06: // iconst_3
          frame.operandStack.push({ type: 'INT', value: 3 });
          break;
        case 0x07: // iconst_4
          frame.operandStack.push({ type: 'INT', value: 4 });
          break;
        case 0x08: // iconst_5
          frame.operandStack.push({ type: 'INT', value: 5 });
          break;

        case 0x10: { // bipush
          const byteVal = (frame.bytecode[frame.pc++] << 24) >> 24;
          operands.push(byteVal);
          frame.operandStack.push({ type: 'INT', value: byteVal });
          break;
        }
        case 0x11: { // sipush
          const b1 = frame.bytecode[frame.pc++];
          const b2 = frame.bytecode[frame.pc++];
          const shortVal = ((b1 << 24) >> 16) | b2;
          operands.push(shortVal);
          frame.operandStack.push({ type: 'INT', value: shortVal });
          break;
        }
        case 0x12: { // ldc
          const cpIdx = frame.bytecode[frame.pc++];
          operands.push(cpIdx);
          const entry = frame.constantPool.getEntry(cpIdx);
          if (entry.tag === 'INTEGER') {
            frame.operandStack.push({ type: 'INT', value: entry.value as number });
          } else {
            const obj = this.heap.allocateObject('java/lang/String');
            frame.operandStack.push({ type: 'REFERENCE', value: obj.address });
          }
          comment = `LDC #${cpIdx} (${entry.value})`;
          break;
        }

        // Loads
        case 0x15: { // iload
          const slot = frame.bytecode[frame.pc++];
          operands.push(slot);
          const v = frame.localVariables[slot];
          frame.operandStack.push(v ?? { type: 'INT', value: 0 });
          break;
        }
        case 0x19: { // aload
          const slot = frame.bytecode[frame.pc++];
          operands.push(slot);
          const v = frame.localVariables[slot];
          frame.operandStack.push(v ?? { type: 'REFERENCE', value: -1 });
          break;
        }
        case 0x1a: // iload_0
        case 0x1b: // iload_1
        case 0x1c: // iload_2
        case 0x1d: { // iload_3
          const slot = def.code - 0x1a;
          const v = frame.localVariables[slot];
          frame.operandStack.push(v ?? { type: 'INT', value: 0 });
          break;
        }
        case 0x2a: // aload_0
        case 0x2b: // aload_1
        case 0x2c: // aload_2
        case 0x2d: { // aload_3
          const slot = def.code - 0x2a;
          const v = frame.localVariables[slot];
          frame.operandStack.push(v ?? { type: 'REFERENCE', value: -1 });
          break;
        }

        // Stores
        case 0x36: { // istore
          const slot = frame.bytecode[frame.pc++];
          operands.push(slot);
          const v = frame.operandStack.pop();
          frame.localVariables[slot] = v ?? { type: 'INT', value: 0 };
          break;
        }
        case 0x3a: { // astore
          const slot = frame.bytecode[frame.pc++];
          operands.push(slot);
          const v = frame.operandStack.pop();
          frame.localVariables[slot] = v ?? { type: 'REFERENCE', value: -1 };
          break;
        }
        case 0x3b: // istore_0
        case 0x3c: // istore_1
        case 0x3d: // istore_2
        case 0x3e: { // istore_3
          const slot = def.code - 0x3b;
          const v = frame.operandStack.pop();
          frame.localVariables[slot] = v ?? { type: 'INT', value: 0 };
          break;
        }
        case 0x4b: // astore_0
        case 0x4c: // astore_1
        case 0x4d: // astore_2
        case 0x4e: { // astore_3
          const slot = def.code - 0x4b;
          const v = frame.operandStack.pop();
          frame.localVariables[slot] = v ?? { type: 'REFERENCE', value: -1 };
          break;
        }

        // Stack ops
        case 0x57: // pop
          frame.operandStack.pop();
          break;
        case 0x59: { // dup
          const top = frame.operandStack[frame.operandStack.length - 1];
          if (top) frame.operandStack.push({ ...top });
          break;
        }
        case 0x5c: { // dup2
          const len = frame.operandStack.length;
          if (len >= 2) {
            const v2 = frame.operandStack[len - 2];
            const v1 = frame.operandStack[len - 1];
            frame.operandStack.push({ ...v2 }, { ...v1 });
          } else if (len === 1) {
            frame.operandStack.push({ ...frame.operandStack[0] });
          }
          break;
        }
        case 0x5f: { // swap
          const v1 = frame.operandStack.pop()!;
          const v2 = frame.operandStack.pop()!;
          frame.operandStack.push(v1, v2);
          break;
        }

        // Arithmetic
        case 0x60: { // iadd
          const v2 = frame.operandStack.pop()!.value;
          const v1 = frame.operandStack.pop()!.value;
          frame.operandStack.push({ type: 'INT', value: (v1 + v2) | 0 });
          break;
        }
        case 0x64: { // isub
          const v2 = frame.operandStack.pop()!.value;
          const v1 = frame.operandStack.pop()!.value;
          frame.operandStack.push({ type: 'INT', value: (v1 - v2) | 0 });
          break;
        }
        case 0x68: { // imul
          const v2 = frame.operandStack.pop()!.value;
          const v1 = frame.operandStack.pop()!.value;
          frame.operandStack.push({ type: 'INT', value: Math.imul(v1, v2) });
          break;
        }
        case 0x6c: { // idiv
          const v2 = frame.operandStack.pop()!.value;
          const v1 = frame.operandStack.pop()!.value;
          if (v2 === 0) throw new Error('ArithmeticException: / by zero');
          frame.operandStack.push({ type: 'INT', value: (v1 / v2) | 0 });
          break;
        }
        case 0x70: { // irem
          const v2 = frame.operandStack.pop()!.value;
          const v1 = frame.operandStack.pop()!.value;
          if (v2 === 0) throw new Error('ArithmeticException: / by zero');
          frame.operandStack.push({ type: 'INT', value: (v1 % v2) | 0 });
          break;
        }
        case 0x74: { // ineg
          const v = frame.operandStack.pop()!.value;
          frame.operandStack.push({ type: 'INT', value: -v | 0 });
          break;
        }
        case 0x78: { // ishl
          const v2 = frame.operandStack.pop()!.value & 0x1f;
          const v1 = frame.operandStack.pop()!.value;
          frame.operandStack.push({ type: 'INT', value: (v1 << v2) | 0 });
          break;
        }
        case 0x7a: { // ishr
          const v2 = frame.operandStack.pop()!.value & 0x1f;
          const v1 = frame.operandStack.pop()!.value;
          frame.operandStack.push({ type: 'INT', value: (v1 >> v2) | 0 });
          break;
        }
        case 0x7c: { // iushr
          const v2 = frame.operandStack.pop()!.value & 0x1f;
          const v1 = frame.operandStack.pop()!.value;
          frame.operandStack.push({ type: 'INT', value: (v1 >>> v2) | 0 });
          break;
        }
        case 0x7e: { // iand
          const v2 = frame.operandStack.pop()!.value;
          const v1 = frame.operandStack.pop()!.value;
          frame.operandStack.push({ type: 'INT', value: (v1 & v2) | 0 });
          break;
        }
        case 0x80: { // ior
          const v2 = frame.operandStack.pop()!.value;
          const v1 = frame.operandStack.pop()!.value;
          frame.operandStack.push({ type: 'INT', value: (v1 | v2) | 0 });
          break;
        }
        case 0x82: { // ixor
          const v2 = frame.operandStack.pop()!.value;
          const v1 = frame.operandStack.pop()!.value;
          frame.operandStack.push({ type: 'INT', value: (v1 ^ v2) | 0 });
          break;
        }
        case 0x84: { // iinc
          const slot = frame.bytecode[frame.pc++];
          const amt = (frame.bytecode[frame.pc++] << 24) >> 24;
          operands.push(slot, amt);
          const current = (frame.localVariables[slot]?.value ?? 0) + amt;
          frame.localVariables[slot] = { type: 'INT', value: current | 0 };
          comment = `var${slot} = ${current}`;
          break;
        }

        // Branching
        case 0x99: { // ifeq
          const b1 = frame.bytecode[frame.pc++];
          const b2 = frame.bytecode[frame.pc++];
          const rel = ((b1 << 24) >> 16) | b2;
          operands.push(rel);
          const v = frame.operandStack.pop()!.value;
          if (v === 0) {
            frame.pc = initialPc + rel;
            comment = `Branch taken -> PC ${frame.pc}`;
          }
          break;
        }
        case 0x9a: { // ifne
          const b1 = frame.bytecode[frame.pc++];
          const b2 = frame.bytecode[frame.pc++];
          const rel = ((b1 << 24) >> 16) | b2;
          operands.push(rel);
          const v = frame.operandStack.pop()!.value;
          if (v !== 0) {
            frame.pc = initialPc + rel;
            comment = `Branch taken -> PC ${frame.pc}`;
          }
          break;
        }
        case 0x9b: { // iflt
          const b1 = frame.bytecode[frame.pc++];
          const b2 = frame.bytecode[frame.pc++];
          const rel = ((b1 << 24) >> 16) | b2;
          operands.push(rel);
          const v = frame.operandStack.pop()!.value;
          if (v < 0) {
            frame.pc = initialPc + rel;
            comment = `Branch taken -> PC ${frame.pc}`;
          }
          break;
        }
        case 0x9c: { // ifge
          const b1 = frame.bytecode[frame.pc++];
          const b2 = frame.bytecode[frame.pc++];
          const rel = ((b1 << 24) >> 16) | b2;
          operands.push(rel);
          const v = frame.operandStack.pop()!.value;
          if (v >= 0) {
            frame.pc = initialPc + rel;
            comment = `Branch taken -> PC ${frame.pc}`;
          }
          break;
        }
        case 0x9d: { // ifgt
          const b1 = frame.bytecode[frame.pc++];
          const b2 = frame.bytecode[frame.pc++];
          const rel = ((b1 << 24) >> 16) | b2;
          operands.push(rel);
          const v = frame.operandStack.pop()!.value;
          if (v > 0) {
            frame.pc = initialPc + rel;
            comment = `Branch taken -> PC ${frame.pc}`;
          }
          break;
        }
        case 0x9e: { // ifle
          const b1 = frame.bytecode[frame.pc++];
          const b2 = frame.bytecode[frame.pc++];
          const rel = ((b1 << 24) >> 16) | b2;
          operands.push(rel);
          const v = frame.operandStack.pop()!.value;
          if (v <= 0) {
            frame.pc = initialPc + rel;
            comment = `Branch taken -> PC ${frame.pc}`;
          }
          break;
        }
        case 0x9f: { // if_icmpeq
          const b1 = frame.bytecode[frame.pc++];
          const b2 = frame.bytecode[frame.pc++];
          const rel = ((b1 << 24) >> 16) | b2;
          operands.push(rel);
          const v2 = frame.operandStack.pop()!.value;
          const v1 = frame.operandStack.pop()!.value;
          if (v1 === v2) {
            frame.pc = initialPc + rel;
            comment = `Branch taken -> PC ${frame.pc}`;
          }
          break;
        }
        case 0xa0: { // if_icmpne
          const b1 = frame.bytecode[frame.pc++];
          const b2 = frame.bytecode[frame.pc++];
          const rel = ((b1 << 24) >> 16) | b2;
          operands.push(rel);
          const v2 = frame.operandStack.pop()!.value;
          const v1 = frame.operandStack.pop()!.value;
          if (v1 !== v2) {
            frame.pc = initialPc + rel;
            comment = `Branch taken -> PC ${frame.pc}`;
          }
          break;
        }
        case 0xa1: { // if_icmplt
          const b1 = frame.bytecode[frame.pc++];
          const b2 = frame.bytecode[frame.pc++];
          const rel = ((b1 << 24) >> 16) | b2;
          operands.push(rel);
          const v2 = frame.operandStack.pop()!.value;
          const v1 = frame.operandStack.pop()!.value;
          if (v1 < v2) {
            frame.pc = initialPc + rel;
            comment = `Branch taken -> PC ${frame.pc}`;
          }
          break;
        }
        case 0xa2: { // if_icmpge
          const b1 = frame.bytecode[frame.pc++];
          const b2 = frame.bytecode[frame.pc++];
          const rel = ((b1 << 24) >> 16) | b2;
          operands.push(rel);
          const v2 = frame.operandStack.pop()!.value;
          const v1 = frame.operandStack.pop()!.value;
          if (v1 >= v2) {
            frame.pc = initialPc + rel;
            comment = `Branch taken -> PC ${frame.pc}`;
          }
          break;
        }
        case 0xa3: { // if_icmpgt
          const b1 = frame.bytecode[frame.pc++];
          const b2 = frame.bytecode[frame.pc++];
          const rel = ((b1 << 24) >> 16) | b2;
          operands.push(rel);
          const v2 = frame.operandStack.pop()!.value;
          const v1 = frame.operandStack.pop()!.value;
          if (v1 > v2) {
            frame.pc = initialPc + rel;
            comment = `Branch taken -> PC ${frame.pc}`;
          }
          break;
        }
        case 0xa4: { // if_icmple
          const b1 = frame.bytecode[frame.pc++];
          const b2 = frame.bytecode[frame.pc++];
          const rel = ((b1 << 24) >> 16) | b2;
          operands.push(rel);
          const v2 = frame.operandStack.pop()!.value;
          const v1 = frame.operandStack.pop()!.value;
          if (v1 <= v2) {
            frame.pc = initialPc + rel;
            comment = `Branch taken -> PC ${frame.pc}`;
          }
          break;
        }
        case 0xa7: { // goto
          const b1 = frame.bytecode[frame.pc++];
          const b2 = frame.bytecode[frame.pc++];
          const rel = ((b1 << 24) >> 16) | b2;
          operands.push(rel);
          frame.pc = initialPc + rel;
          comment = `Jump -> PC ${frame.pc}`;
          break;
        }

        // Arrays
        case 0xbc: { // newarray
          const atype = frame.bytecode[frame.pc++];
          operands.push(atype);
          const len = frame.operandStack.pop()!.value;
          const arr = this.heap.allocateIntArray(len);
          frame.operandStack.push({ type: 'REFERENCE', value: arr.address });
          comment = `Allocated int[${len}] @0x${arr.address.toString(16).toUpperCase()}`;
          break;
        }
        case 0x2e: { // iaload
          const index = frame.operandStack.pop()!.value;
          const addr = frame.operandStack.pop()!.value;
          const arr = this.heap.getArray(addr);
          frame.operandStack.push({ type: 'INT', value: arr.elements[index] ?? 0 });
          break;
        }
        case 0x4f: { // iastore
          const val = frame.operandStack.pop()!.value;
          const index = frame.operandStack.pop()!.value;
          const addr = frame.operandStack.pop()!.value;
          const arr = this.heap.getArray(addr);
          arr.elements[index] = val;
          comment = `arr[${index}] = ${val}`;
          break;
        }
        case 0xbe: { // arraylength
          const addr = frame.operandStack.pop()!.value;
          const arr = this.heap.getArray(addr);
          frame.operandStack.push({ type: 'INT', value: arr.length });
          break;
        }

        // Null checks
        case 0xc6: { // ifnull
          const b1 = frame.bytecode[frame.pc++];
          const b2 = frame.bytecode[frame.pc++];
          const rel = ((b1 << 24) >> 16) | b2;
          operands.push(rel);
          const ref = frame.operandStack.pop()!;
          if (ref.value === -1 || ref.value === 0) {
            frame.pc = initialPc + rel;
            comment = `Branch taken -> PC ${frame.pc}`;
          }
          break;
        }
        case 0xc7: { // ifnonnull
          const b1 = frame.bytecode[frame.pc++];
          const b2 = frame.bytecode[frame.pc++];
          const rel = ((b1 << 24) >> 16) | b2;
          operands.push(rel);
          const ref = frame.operandStack.pop()!;
          if (ref.value !== -1 && ref.value !== 0) {
            frame.pc = initialPc + rel;
            comment = `Branch taken -> PC ${frame.pc}`;
          }
          break;
        }

        // Method invocation
        case 0xb8: { // invokestatic
          const b1 = frame.bytecode[frame.pc++];
          const b2 = frame.bytecode[frame.pc++];
          const cpIdx = (b1 << 8) | b2;
          operands.push(cpIdx);
          const entry = frame.constantPool.getEntry(cpIdx);
          const targetKey = `${entry.value}${entry.descriptor || ''}`;

          // Native hook for println
          if (targetKey.includes('println') || targetKey.includes('System.out')) {
            const arg = frame.operandStack.pop()!;
            this.stdout.push(arg.type === 'REFERENCE' ? `@0x${arg.value.toString(16).toUpperCase()}` : String(arg.value));
            comment = `System.out.println: ${arg.value}`;
            break;
          }

          const targetMethod = this.methodRegistry.get(targetKey);
          if (!targetMethod) {
            throw new Error(`NoSuchMethodError: ${targetKey}`);
          }

          // Read param count from descriptor e.g. (II)I -> 2, (I)I -> 1
          const match = targetMethod.descriptor.match(/\((.*?)\)/);
          const paramsStr = match ? match[1] : '';
          const paramCount = paramsStr.replace(/\[/g, '').length;

          const newLvt: (JvmValue | null)[] = new Array(targetMethod.maxLocals).fill(null);
          for (let i = paramCount - 1; i >= 0; i--) {
            newLvt[i] = frame.operandStack.pop() ?? { type: 'INT', value: 0 };
          }

          const newFrame: InternalFrame = {
            id: `frame-${this.callStack.length}-${targetMethod.methodName}`,
            className: targetMethod.className,
            methodName: targetMethod.methodName,
            descriptor: targetMethod.descriptor,
            pc: 0,
            maxStack: targetMethod.maxStack,
            maxLocals: targetMethod.maxLocals,
            bytecode: targetMethod.bytecode,
            instructions: targetMethod.instructions,
            constantPool: this.constantPool,
            operandStack: [],
            localVariables: newLvt,
          };

          this.callStack.push(newFrame);
          comment = `invokestatic -> ${targetMethod.methodName}`;
          break;
        }

        // Method returns
        case 0xac: { // ireturn
          const ret = frame.operandStack.pop()!;
          this.returnValue = ret;
          this.callStack.pop();
          if (this.callStack.length > 0) {
            const caller = this.callStack[this.callStack.length - 1];
            caller.operandStack.push(ret);
          } else {
            this.status = 'completed';
          }
          comment = `ireturn -> ${ret.value}`;
          break;
        }
        case 0xb0: { // areturn
          const ret = frame.operandStack.pop()!;
          this.returnValue = ret;
          this.callStack.pop();
          if (this.callStack.length > 0) {
            const caller = this.callStack[this.callStack.length - 1];
            caller.operandStack.push(ret);
          } else {
            this.status = 'completed';
          }
          comment = `areturn -> @0x${ret.value.toString(16).toUpperCase()}`;
          break;
        }
        case 0xb1: { // return
          this.returnValue = undefined;
          this.callStack.pop();
          if (this.callStack.length === 0) {
            this.status = 'completed';
          }
          comment = `return void`;
          break;
        }
      }

      this.stepCount++;

      const stackAfter = this.callStack.length > 0
        ? [...this.callStack[this.callStack.length - 1].operandStack]
        : [];
      const lvtSnapshot = frame ? [...frame.localVariables] : [];

      this.traces.push({
        step: this.stepCount,
        pc: initialPc,
        mnemonic: def.mnemonic,
        operands,
        method: `${frame.className}.${frame.methodName}`,
        callDepth: this.callStack.length,
        stackBefore,
        stackAfter,
        lvtSnapshot,
        comment,
        timestamp: Date.now(),
      });

      if (this.callStack.length === 0) {
        this.status = 'completed';
      }

      return true;
    } catch (e: any) {
      this.status = 'error';
      this.errorMessage = e.message || String(e);
      return false;
    }
  }

  getSnapshot(): ExecutionSnapshot {
    const currentInternal = this.callStack.length > 0 ? this.callStack[this.callStack.length - 1] : undefined;
    const currentFrameState: StackFrameState | undefined = currentInternal
      ? {
          id: currentInternal.id,
          className: currentInternal.className,
          methodName: currentInternal.methodName,
          descriptor: currentInternal.descriptor,
          pc: currentInternal.pc,
          maxStack: currentInternal.maxStack,
          maxLocals: currentInternal.maxLocals,
          operandStack: [...currentInternal.operandStack],
          localVariableTable: [...currentInternal.localVariables],
          currentInstruction: currentInternal.instructions.find((i) => i.offset === currentInternal.pc),
        }
      : undefined;

    const callStackStates: StackFrameState[] = this.callStack.map((f) => ({
      id: f.id,
      className: f.className,
      methodName: f.methodName,
      descriptor: f.descriptor,
      pc: f.pc,
      maxStack: f.maxStack,
      maxLocals: f.maxLocals,
      operandStack: [...f.operandStack],
      localVariableTable: [...f.localVariables],
      currentInstruction: f.instructions.find((i) => i.offset === f.pc),
    }));

    return {
      status: this.status,
      stepCount: this.stepCount,
      pc: currentInternal?.pc ?? 0,
      currentFrame: currentFrameState,
      callStack: callStackStates,
      operandStack: currentInternal ? [...currentInternal.operandStack] : [],
      localVariables: currentInternal ? [...currentInternal.localVariables] : [],
      heapArrays: this.heap.getArraysSnapshot(),
      heapObjects: this.heap.getObjectsSnapshot(),
      constantPool: this.constantPool.getEntries(),
      stdout: [...this.stdout],
      returnValue: this.returnValue,
      errorMessage: this.errorMessage,
      breakpoints: new Set(this.breakpoints),
    };
  }

  getTraces(): StepTraceEntry[] {
    return [...this.traces];
  }

  reset() {
    this.callStack = [];
    this.heap.reset();
    this.stepCount = 0;
    this.stdout = [];
    this.traces = [];
    this.status = 'idle';
    this.errorMessage = undefined;
    this.returnValue = undefined;
  }
}
