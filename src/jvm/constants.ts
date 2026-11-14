export interface OpcodeDef {
  code: number;
  mnemonic: string;
  operands: number; // number of operand bytes
  category: 'push' | 'load' | 'store' | 'stack' | 'math' | 'branch' | 'array' | 'invoke' | 'return';
  description: string;
}

export const OPCODES: Record<number, OpcodeDef> = {
  0x00: { code: 0x00, mnemonic: 'nop', operands: 0, category: 'stack', description: 'Do nothing' },
  0x01: { code: 0x01, mnemonic: 'aconst_null', operands: 0, category: 'push', description: 'Push null object reference' },
  0x02: { code: 0x02, mnemonic: 'iconst_m1', operands: 0, category: 'push', description: 'Push int constant -1' },
  0x03: { code: 0x03, mnemonic: 'iconst_0', operands: 0, category: 'push', description: 'Push int constant 0' },
  0x04: { code: 0x04, mnemonic: 'iconst_1', operands: 0, category: 'push', description: 'Push int constant 1' },
  0x05: { code: 0x05, mnemonic: 'iconst_2', operands: 0, category: 'push', description: 'Push int constant 2' },
  0x06: { code: 0x06, mnemonic: 'iconst_3', operands: 0, category: 'push', description: 'Push int constant 3' },
  0x07: { code: 0x07, mnemonic: 'iconst_4', operands: 0, category: 'push', description: 'Push int constant 4' },
  0x08: { code: 0x08, mnemonic: 'iconst_5', operands: 0, category: 'push', description: 'Push int constant 5' },

  0x10: { code: 0x10, mnemonic: 'bipush', operands: 1, category: 'push', description: 'Push signed byte as integer' },
  0x11: { code: 0x11, mnemonic: 'sipush', operands: 2, category: 'push', description: 'Push signed 16-bit short as integer' },
  0x12: { code: 0x12, mnemonic: 'ldc', operands: 1, category: 'push', description: 'Push constant from runtime constant pool' },

  0x15: { code: 0x15, mnemonic: 'iload', operands: 1, category: 'load', description: 'Load int from local variable slot' },
  0x19: { code: 0x19, mnemonic: 'aload', operands: 1, category: 'load', description: 'Load reference from local variable slot' },

  0x1a: { code: 0x1a, mnemonic: 'iload_0', operands: 0, category: 'load', description: 'Load int from local variable 0' },
  0x1b: { code: 0x1b, mnemonic: 'iload_1', operands: 0, category: 'load', description: 'Load int from local variable 1' },
  0x1c: { code: 0x1c, mnemonic: 'iload_2', operands: 0, category: 'load', description: 'Load int from local variable 2' },
  0x1d: { code: 0x1d, mnemonic: 'iload_3', operands: 0, category: 'load', description: 'Load int from local variable 3' },

  0x2a: { code: 0x2a, mnemonic: 'aload_0', operands: 0, category: 'load', description: 'Load reference from local variable 0' },
  0x2b: { code: 0x2b, mnemonic: 'aload_1', operands: 0, category: 'load', description: 'Load reference from local variable 1' },
  0x2c: { code: 0x2c, mnemonic: 'aload_2', operands: 0, category: 'load', description: 'Load reference from local variable 2' },
  0x2d: { code: 0x2d, mnemonic: 'aload_3', operands: 0, category: 'load', description: 'Load reference from local variable 3' },

  0x2e: { code: 0x2e, mnemonic: 'iaload', operands: 0, category: 'array', description: 'Load int from array at index' },

  0x36: { code: 0x36, mnemonic: 'istore', operands: 1, category: 'store', description: 'Store int into local variable slot' },
  0x3a: { code: 0x3a, mnemonic: 'astore', operands: 1, category: 'store', description: 'Store reference into local variable slot' },

  0x3b: { code: 0x3b, mnemonic: 'istore_0', operands: 0, category: 'store', description: 'Store int into local variable 0' },
  0x3c: { code: 0x3c, mnemonic: 'istore_1', operands: 0, category: 'store', description: 'Store int into local variable 1' },
  0x3d: { code: 0x3d, mnemonic: 'istore_2', operands: 0, category: 'store', description: 'Store int into local variable 2' },
  0x3e: { code: 0x3e, mnemonic: 'istore_3', operands: 0, category: 'store', description: 'Store int into local variable 3' },

  0x4b: { code: 0x4b, mnemonic: 'astore_0', operands: 0, category: 'store', description: 'Store reference into local variable 0' },
  0x4c: { code: 0x4c, mnemonic: 'astore_1', operands: 0, category: 'store', description: 'Store reference into local variable 1' },
  0x4d: { code: 0x4d, mnemonic: 'astore_2', operands: 0, category: 'store', description: 'Store reference into local variable 2' },
  0x4e: { code: 0x4e, mnemonic: 'astore_3', operands: 0, category: 'store', description: 'Store reference into local variable 3' },

  0x4f: { code: 0x4f, mnemonic: 'iastore', operands: 0, category: 'array', description: 'Store int into array at index' },

  0x57: { code: 0x57, mnemonic: 'pop', operands: 0, category: 'stack', description: 'Pop the top operand value' },
  0x59: { code: 0x59, mnemonic: 'dup', operands: 0, category: 'stack', description: 'Duplicate top operand value' },
  0x5c: { code: 0x5c, mnemonic: 'dup2', operands: 0, category: 'stack', description: 'Duplicate top two operand values' },
  0x5f: { code: 0x5f, mnemonic: 'swap', operands: 0, category: 'stack', description: 'Swap the two top operand values' },

  0x60: { code: 0x60, mnemonic: 'iadd', operands: 0, category: 'math', description: 'Add two integers' },
  0x64: { code: 0x64, mnemonic: 'isub', operands: 0, category: 'math', description: 'Subtract two integers' },
  0x68: { code: 0x68, mnemonic: 'imul', operands: 0, category: 'math', description: 'Multiply two integers' },
  0x6c: { code: 0x6c, mnemonic: 'idiv', operands: 0, category: 'math', description: 'Divide two integers' },
  0x70: { code: 0x70, mnemonic: 'irem', operands: 0, category: 'math', description: 'Remainder of two integers' },
  0x74: { code: 0x74, mnemonic: 'ineg', operands: 0, category: 'math', description: 'Negate integer' },
  0x78: { code: 0x78, mnemonic: 'ishl', operands: 0, category: 'math', description: 'Bitwise shift left (v1 << v2)' },
  0x7a: { code: 0x7a, mnemonic: 'ishr', operands: 0, category: 'math', description: 'Arithmetic shift right (v1 >> v2)' },
  0x7c: { code: 0x7c, mnemonic: 'iushr', operands: 0, category: 'math', description: 'Logical unsigned shift right (v1 >>> v2)' },
  0x7e: { code: 0x7e, mnemonic: 'iand', operands: 0, category: 'math', description: 'Bitwise AND (v1 & v2)' },
  0x80: { code: 0x80, mnemonic: 'ior', operands: 0, category: 'math', description: 'Bitwise OR (v1 | v2)' },
  0x82: { code: 0x82, mnemonic: 'ixor', operands: 0, category: 'math', description: 'Bitwise XOR (v1 ^ v2)' },

  0x84: { code: 0x84, mnemonic: 'iinc', operands: 2, category: 'math', description: 'Increment local variable slot by const' },

  0x99: { code: 0x99, mnemonic: 'ifeq', operands: 2, category: 'branch', description: 'Branch if value is 0' },
  0x9a: { code: 0x9a, mnemonic: 'ifne', operands: 2, category: 'branch', description: 'Branch if value is not 0' },
  0x9b: { code: 0x9b, mnemonic: 'iflt', operands: 2, category: 'branch', description: 'Branch if value is less than 0' },
  0x9c: { code: 0x9c, mnemonic: 'ifge', operands: 2, category: 'branch', description: 'Branch if value is >= 0' },
  0x9d: { code: 0x9d, mnemonic: 'ifgt', operands: 2, category: 'branch', description: 'Branch if value is > 0' },
  0x9e: { code: 0x9e, mnemonic: 'ifle', operands: 2, category: 'branch', description: 'Branch if value is <= 0' },

  0x9f: { code: 0x9f, mnemonic: 'if_icmpeq', operands: 2, category: 'branch', description: 'Branch if int1 == int2' },
  0xa0: { code: 0xa0, mnemonic: 'if_icmpne', operands: 2, category: 'branch', description: 'Branch if int1 != int2' },
  0xa1: { code: 0xa1, mnemonic: 'if_icmplt', operands: 2, category: 'branch', description: 'Branch if int1 < int2' },
  0xa2: { code: 0xa2, mnemonic: 'if_icmpge', operands: 2, category: 'branch', description: 'Branch if int1 >= int2' },
  0xa3: { code: 0xa3, mnemonic: 'if_icmpgt', operands: 2, category: 'branch', description: 'Branch if int1 > int2' },
  0xa4: { code: 0xa4, mnemonic: 'if_icmple', operands: 2, category: 'branch', description: 'Branch if int1 <= int2' },

  0xa7: { code: 0xa7, mnemonic: 'goto', operands: 2, category: 'branch', description: 'Unconditional branch' },

  0xac: { code: 0xac, mnemonic: 'ireturn', operands: 0, category: 'return', description: 'Return int from method' },
  0xb0: { code: 0xb0, mnemonic: 'areturn', operands: 0, category: 'return', description: 'Return reference from method' },
  0xb1: { code: 0xb1, mnemonic: 'return', operands: 0, category: 'return', description: 'Return void from method' },

  0xb8: { code: 0xb8, mnemonic: 'invokestatic', operands: 2, category: 'invoke', description: 'Invoke static method from constant pool' },
  0xbc: { code: 0xbc, mnemonic: 'newarray', operands: 1, category: 'array', description: 'Allocate primitive array on heap' },
  0xbe: { code: 0xbe, mnemonic: 'arraylength', operands: 0, category: 'array', description: 'Get length of array' },

  0xc6: { code: 0xc6, mnemonic: 'ifnull', operands: 2, category: 'branch', description: 'Branch if reference is null' },
  0xc7: { code: 0xc7, mnemonic: 'ifnonnull', operands: 2, category: 'branch', description: 'Branch if reference is not null' },
};

export const MNEMONIC_TO_OPCODE: Record<string, OpcodeDef> = Object.values(OPCODES).reduce((acc, def) => {
  acc[def.mnemonic.toLowerCase()] = def;
  return acc;
}, {} as Record<string, OpcodeDef>);
