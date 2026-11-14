package com.compiler.jvm.parser;

import com.compiler.jvm.instructions.Instruction;
import com.compiler.jvm.instructions.Opcode;
import com.compiler.jvm.memory.ConstantPool;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Bytecode Parser and Disassembler translating binary byte arrays into
 * structured Intermediate Representation (IR) instructions.
 */
public final class BytecodeParser {

    public static List<Instruction> parse(byte[] bytecode) {
        return parse(bytecode, null);
    }

    public static List<Instruction> parse(byte[] bytecode, ConstantPool constantPool) {
        if (bytecode == null) {
            return Collections.emptyList();
        }

        List<Instruction> instructions = new ArrayList<>();
        int pc = 0;

        while (pc < bytecode.length) {
            int offset = pc;
            int rawOp = bytecode[pc++] & 0xFF;
            Opcode opcode = Opcode.fromByte(rawOp);

            int[] operands;
            String comment = null;

            switch (opcode) {
                // 0 operands
                case NOP:
                case ACONST_NULL:
                case ICONST_M1:
                case ICONST_0:
                case ICONST_1:
                case ICONST_2:
                case ICONST_3:
                case ICONST_4:
                case ICONST_5:
                case ILOAD_0:
                case ILOAD_1:
                case ILOAD_2:
                case ILOAD_3:
                case ALOAD_0:
                case ALOAD_1:
                case ALOAD_2:
                case ALOAD_3:
                case IALOAD:
                case ISTORE_0:
                case ISTORE_1:
                case ISTORE_2:
                case ISTORE_3:
                case ASTORE_0:
                case ASTORE_1:
                case ASTORE_2:
                case ASTORE_3:
                case IASTORE:
                case POP:
                case DUP:
                case SWAP:
                case IADD:
                case ISUB:
                case IMUL:
                case IDIV:
                case IREM:
                case INEG:
                case IRETURN:
                case ARETURN:
                case RETURN:
                case ARRAYLENGTH:
                    operands = new int[0];
                    break;

                // 1 byte operand (signed or index)
                case BIPUSH: {
                    int val = bytecode[pc++];
                    operands = new int[]{val};
                    break;
                }
                case LDC: {
                    int cpIndex = bytecode[pc++] & 0xFF;
                    operands = new int[]{cpIndex};
                    if (constantPool != null) {
                        comment = "Constant " + constantPool.getEntry(cpIndex);
                    }
                    break;
                }
                case ILOAD:
                case ALOAD:
                case ISTORE:
                case ASTORE: {
                    int slot = bytecode[pc++] & 0xFF;
                    operands = new int[]{slot};
                    break;
                }
                case NEWARRAY: {
                    int atype = bytecode[pc++] & 0xFF;
                    operands = new int[]{atype};
                    comment = atype == 10 ? "T_INT" : "T_REF";
                    break;
                }

                // 2 byte operands: short or branch offset
                case SIPUSH: {
                    int b1 = bytecode[pc++];
                    int b2 = bytecode[pc++] & 0xFF;
                    int val = (short) ((b1 << 8) | b2);
                    operands = new int[]{val};
                    break;
                }
                case IINC: {
                    int slot = bytecode[pc++] & 0xFF;
                    int amount = bytecode[pc++];
                    operands = new int[]{slot, amount};
                    comment = "var" + slot + " += " + amount;
                    break;
                }

                // Branching instructions (signed 16-bit offset from instruction start)
                case IFEQ:
                case IFNE:
                case IFLT:
                case IFGE:
                case IFGT:
                case IFLE:
                case IF_ICMPEQ:
                case IF_ICMPNE:
                case IF_ICMPLT:
                case IF_ICMPGE:
                case IF_ICMPGT:
                case IF_ICMPLE:
                case GOTO: {
                    int b1 = bytecode[pc++];
                    int b2 = bytecode[pc++] & 0xFF;
                    short branchOffset = (short) ((b1 << 8) | b2);
                    int target = offset + branchOffset;
                    operands = new int[]{branchOffset};
                    comment = "-> PC " + target;
                    break;
                }

                // Method invocation (constant pool methodref index)
                case INVOKESTATIC: {
                    int b1 = bytecode[pc++] & 0xFF;
                    int b2 = bytecode[pc++] & 0xFF;
                    int cpIndex = (b1 << 8) | b2;
                    operands = new int[]{cpIndex};
                    if (constantPool != null) {
                        comment = constantPool.getMethodRefName(cpIndex);
                    }
                    break;
                }

                default:
                    throw new UnsupportedOperationException("Unsupported opcode in parser: " + opcode);
            }

            instructions.add(new Instruction(offset, opcode, operands, comment));
        }

        return instructions;
    }
}
