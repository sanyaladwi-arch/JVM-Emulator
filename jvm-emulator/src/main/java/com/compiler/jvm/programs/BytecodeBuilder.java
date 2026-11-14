package com.compiler.jvm.programs;

import com.compiler.jvm.instructions.Opcode;

import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Fluent Bytecode Builder for assembling JVM instructions with automatic
 * forward/backward label resolution and branch offset calculations.
 */
public final class BytecodeBuilder {
    private final ByteArrayOutputStream buffer = new ByteArrayOutputStream();
    private final Map<String, Integer> labels = new HashMap<>();
    private final Map<Integer, String> unresolvedPatches = new HashMap<>();

    public static BytecodeBuilder create() {
        return new BytecodeBuilder();
    }

    public BytecodeBuilder label(String name) {
        labels.put(name, buffer.size());
        return this;
    }

    public BytecodeBuilder emit(Opcode opcode) {
        buffer.write(opcode.getCode());
        return this;
    }

    public BytecodeBuilder emitByte(int b) {
        buffer.write(b);
        return this;
    }

    public BytecodeBuilder emitShort(int s) {
        buffer.write((s >> 8) & 0xFF);
        buffer.write(s & 0xFF);
        return this;
    }

    public BytecodeBuilder iconst_0() { return emit(Opcode.ICONST_0); }
    public BytecodeBuilder iconst_1() { return emit(Opcode.ICONST_1); }
    public BytecodeBuilder iconst_2() { return emit(Opcode.ICONST_2); }
    public BytecodeBuilder iconst_3() { return emit(Opcode.ICONST_3); }
    public BytecodeBuilder iconst_4() { return emit(Opcode.ICONST_4); }
    public BytecodeBuilder iconst_5() { return emit(Opcode.ICONST_5); }

    public BytecodeBuilder bipush(int val) {
        emit(Opcode.BIPUSH);
        emitByte(val);
        return this;
    }

    public BytecodeBuilder sipush(int val) {
        emit(Opcode.SIPUSH);
        emitShort(val);
        return this;
    }

    public BytecodeBuilder ldc(int cpIndex) {
        emit(Opcode.LDC);
        emitByte(cpIndex);
        return this;
    }

    public BytecodeBuilder iload(int slot) {
        if (slot >= 0 && slot <= 3) {
            emit(Opcode.fromByte(Opcode.ILOAD_0.getCode() + slot));
        } else {
            emit(Opcode.ILOAD);
            emitByte(slot);
        }
        return this;
    }

    public BytecodeBuilder istore(int slot) {
        if (slot >= 0 && slot <= 3) {
            emit(Opcode.fromByte(Opcode.ISTORE_0.getCode() + slot));
        } else {
            emit(Opcode.ISTORE);
            emitByte(slot);
        }
        return this;
    }

    public BytecodeBuilder aload(int slot) {
        if (slot >= 0 && slot <= 3) {
            emit(Opcode.fromByte(Opcode.ALOAD_0.getCode() + slot));
        } else {
            emit(Opcode.ALOAD);
            emitByte(slot);
        }
        return this;
    }

    public BytecodeBuilder astore(int slot) {
        if (slot >= 0 && slot <= 3) {
            emit(Opcode.fromByte(Opcode.ASTORE_0.getCode() + slot));
        } else {
            emit(Opcode.ASTORE);
            emitByte(slot);
        }
        return this;
    }

    public BytecodeBuilder iadd() { return emit(Opcode.IADD); }
    public BytecodeBuilder isub() { return emit(Opcode.ISUB); }
    public BytecodeBuilder imul() { return emit(Opcode.IMUL); }
    public BytecodeBuilder idiv() { return emit(Opcode.IDIV); }
    public BytecodeBuilder irem() { return emit(Opcode.IREM); }
    public BytecodeBuilder dup() { return emit(Opcode.DUP); }
    public BytecodeBuilder pop() { return emit(Opcode.POP); }
    public BytecodeBuilder swap() { return emit(Opcode.SWAP); }
    public BytecodeBuilder ireturn() { return emit(Opcode.IRETURN); }
    public BytecodeBuilder returnVoid() { return emit(Opcode.RETURN); }

    public BytecodeBuilder iinc(int slot, int amount) {
        emit(Opcode.IINC);
        emitByte(slot);
        emitByte(amount);
        return this;
    }

    public BytecodeBuilder newarray(int atype) {
        emit(Opcode.NEWARRAY);
        emitByte(atype);
        return this;
    }

    public BytecodeBuilder iaload() { return emit(Opcode.IALOAD); }
    public BytecodeBuilder iastore() { return emit(Opcode.IASTORE); }
    public BytecodeBuilder arraylength() { return emit(Opcode.ARRAYLENGTH); }

    public BytecodeBuilder invokestatic(int cpIndex) {
        emit(Opcode.INVOKESTATIC);
        emitShort(cpIndex);
        return this;
    }

    public BytecodeBuilder branch(Opcode op, String targetLabel) {
        int branchInstrPos = buffer.size();
        emit(op);
        unresolvedPatches.put(branchInstrPos, targetLabel);
        emitShort(0); // placeholder for 16-bit offset
        return this;
    }

    public BytecodeBuilder ifeq(String label) { return branch(Opcode.IFEQ, label); }
    public BytecodeBuilder ifne(String label) { return branch(Opcode.IFNE, label); }
    public BytecodeBuilder iflt(String label) { return branch(Opcode.IFLT, label); }
    public BytecodeBuilder if_icmplt(String label) { return branch(Opcode.IF_ICMPLT, label); }
    public BytecodeBuilder if_icmpge(String label) { return branch(Opcode.IF_ICMPGE, label); }
    public BytecodeBuilder if_icmpgt(String label) { return branch(Opcode.IF_ICMPGT, label); }
    public BytecodeBuilder if_icmpeq(String label) { return branch(Opcode.IF_ICMPEQ, label); }
    public BytecodeBuilder gotoLabel(String label) { return branch(Opcode.GOTO, label); }

    public byte[] build() {
        byte[] bytes = buffer.toByteArray();
        for (Map.Entry<Integer, String> patch : unresolvedPatches.entrySet()) {
            int branchOffsetPos = patch.getKey();
            String targetLabel = patch.getValue();
            Integer targetPos = labels.get(targetLabel);
            if (targetPos == null) {
                throw new IllegalStateException("Unresolved branch label: '" + targetLabel + "'");
            }
            int relativeOffset = targetPos - branchOffsetPos;
            bytes[branchOffsetPos + 1] = (byte) ((relativeOffset >> 8) & 0xFF);
            bytes[branchOffsetPos + 2] = (byte) (relativeOffset & 0xFF);
        }
        return bytes;
    }
}
