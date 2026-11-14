import { OPCODES, MNEMONIC_TO_OPCODE } from './constants';
import { InstructionIR, ConstantPoolEntry } from './types';

export class BytecodeParser {
  static disassemble(bytecode: Uint8Array, constantPool?: ConstantPoolEntry[]): InstructionIR[] {
    const instructions: InstructionIR[] = [];
    let pc = 0;

    while (pc < bytecode.length) {
      const offset = pc;
      const opcodeByte = bytecode[pc++];
      const def = OPCODES[opcodeByte];

      if (!def) {
        instructions.push({
          offset,
          opcode: opcodeByte,
          mnemonic: `unknown_0x${opcodeByte.toString(16).padStart(2, '0')}`,
          category: 'stack',
          operands: [],
          operandBytes: 0,
          comment: 'Unrecognized opcode',
        });
        continue;
      }

      const operands: number[] = [];
      let branchTarget: number | undefined;
      let comment: string | undefined;

      if (def.operands === 1) {
        if (def.mnemonic === 'bipush') {
          // signed 8-bit
          const val = (bytecode[pc++] << 24) >> 24;
          operands.push(val);
          comment = `value = ${val}`;
        } else if (def.mnemonic === 'ldc') {
          const cpIdx = bytecode[pc++];
          operands.push(cpIdx);
          const cpEntry = constantPool?.find((e) => e.index === cpIdx);
          comment = cpEntry ? `#${cpIdx} (${cpEntry.value})` : `#${cpIdx}`;
        } else if (def.mnemonic === 'newarray') {
          const atype = bytecode[pc++];
          operands.push(atype);
          comment = atype === 10 ? 'T_INT (int[])' : `atype=${atype}`;
        } else {
          operands.push(bytecode[pc++]);
        }
      } else if (def.operands === 2) {
        if (def.category === 'branch') {
          const b1 = bytecode[pc++];
          const b2 = bytecode[pc++];
          const rel = ((b1 << 24) >> 16) | b2; // signed 16-bit
          operands.push(rel);
          branchTarget = offset + rel;
          comment = `-> PC ${branchTarget}`;
        } else if (def.mnemonic === 'sipush') {
          const b1 = bytecode[pc++];
          const b2 = bytecode[pc++];
          const val = ((b1 << 24) >> 16) | b2;
          operands.push(val);
          comment = `value = ${val}`;
        } else if (def.mnemonic === 'iinc') {
          const slot = bytecode[pc++];
          const amt = (bytecode[pc++] << 24) >> 24;
          operands.push(slot, amt);
          comment = `var${slot} += ${amt}`;
        } else if (def.mnemonic === 'invokestatic') {
          const b1 = bytecode[pc++];
          const b2 = bytecode[pc++];
          const cpIdx = (b1 << 8) | b2;
          operands.push(cpIdx);
          const cpEntry = constantPool?.find((e) => e.index === cpIdx);
          comment = cpEntry ? `${cpEntry.value}${cpEntry.descriptor || ''}` : `method #${cpIdx}`;
        } else {
          operands.push(bytecode[pc++], bytecode[pc++]);
        }
      }

      instructions.push({
        offset,
        opcode: opcodeByte,
        mnemonic: def.mnemonic,
        category: def.category,
        operands,
        operandBytes: def.operands,
        branchTarget,
        comment,
      });
    }

    return instructions;
  }

  static assemble(sourceText: string, labelsMap?: Map<string, number>): { bytecode: Uint8Array; instructions: InstructionIR[] } {
    const lines = sourceText.split('\n');
    const labels = new Map<string, number>();
    const pendingPatches: { offset: number; label: string }[] = [];
    const byteList: number[] = [];

    // Pass 1: Parse labels and instruction lengths
    const parsedLines: { lineNum: number; mnemonic: string; rawArgs: string[]; isLabel: boolean; labelName?: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
      let raw = lines[i].trim();
      const commentIdx = raw.indexOf('//');
      if (commentIdx !== -1) raw = raw.slice(0, commentIdx).trim();
      const semiIdx = raw.indexOf(';');
      if (semiIdx !== -1) raw = raw.slice(0, semiIdx).trim();
      const hashIdx = raw.indexOf('#');
      if (hashIdx !== -1) raw = raw.slice(0, hashIdx).trim();

      if (!raw) continue;

      if (raw.endsWith(':')) {
        const lbl = raw.slice(0, -1).trim();
        labels.set(lbl, 0); // placeholder
        parsedLines.push({ lineNum: i, mnemonic: '', rawArgs: [], isLabel: true, labelName: lbl });
        continue;
      }

      // Replace commas with spaces to allow "iinc 2, 1" or "iinc 2 1"
      const parts = raw.replace(/,/g, ' ').trim().split(/\s+/);
      const mnemonic = parts[0].toLowerCase();
      const args = parts.slice(1);
      parsedLines.push({ lineNum: i, mnemonic, rawArgs: args, isLabel: false });
    }

    // Pass 2: Calculate label positions
    let currentOffset = 0;
    for (const item of parsedLines) {
      if (item.isLabel && item.labelName) {
        labels.set(item.labelName, currentOffset);
        continue;
      }

      const def = MNEMONIC_TO_OPCODE[item.mnemonic];
      if (!def) {
        throw new Error(`Unknown instruction '${item.mnemonic}' on line ${item.lineNum + 1}`);
      }
      currentOffset += 1 + def.operands;
    }

    // Pass 3: Emit bytes
    for (const item of parsedLines) {
      if (item.isLabel) continue;

      const def = MNEMONIC_TO_OPCODE[item.mnemonic];
      byteList.push(def.code);

      if (def.operands === 1) {
        const argVal = parseInt(item.rawArgs[0] ?? '0', 10);
        byteList.push(argVal & 0xff);
      } else if (def.operands === 2) {
        if (def.category === 'branch') {
          const targetStr = item.rawArgs[0];
          const instrStart = byteList.length - 1;
          pendingPatches.push({ offset: instrStart, label: targetStr });
          byteList.push(0, 0); // placeholder
        } else if (def.mnemonic === 'iinc') {
          const slot = parseInt(item.rawArgs[0] ?? '0', 10);
          const amt = parseInt(item.rawArgs[1] ?? '1', 10);
          byteList.push(slot & 0xff, amt & 0xff);
        } else {
          const val = parseInt(item.rawArgs[0] ?? '0', 10);
          byteList.push((val >> 8) & 0xff, val & 0xff);
        }
      }
    }

    const uint8 = new Uint8Array(byteList);

    // Resolve patches
    for (const patch of pendingPatches) {
      let targetOffset: number | undefined;
      if (labels.has(patch.label)) {
        targetOffset = labels.get(patch.label)!;
      } else if (labelsMap?.has(patch.label)) {
        targetOffset = labelsMap.get(patch.label)!;
      } else if (!isNaN(parseInt(patch.label, 10))) {
        targetOffset = parseInt(patch.label, 10);
      } else {
        throw new Error(`Unresolved label: '${patch.label}'`);
      }

      const relative = targetOffset - patch.offset;
      uint8[patch.offset + 1] = (relative >> 8) & 0xff;
      uint8[patch.offset + 2] = relative & 0xff;
    }

    const instructions = BytecodeParser.disassemble(uint8);
    return { bytecode: uint8, instructions };
  }

  static bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');
  }

  static hexToBytes(hex: string): Uint8Array {
    const clean = hex.replace(/[\s,;]/g, '');
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < clean.length; i += 2) {
      bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
    }
    return bytes;
  }
}
