package com.compiler.jvm.memory;

import java.util.Objects;

/**
 * JVM Stack Frame containing the Local Variable Table (LVT), Operand Stack,
 * Program Counter (PC), and Dynamic Linking references for an executing method.
 */
public final class StackFrame {
    private final String className;
    private final String methodName;
    private final String descriptor;
    private final byte[] bytecode;
    private final ConstantPool constantPool;
    private final OperandStack operandStack;
    private final LocalVariableTable localVariableTable;
    private int pc;

    public StackFrame(String className,
                      String methodName,
                      String descriptor,
                      byte[] bytecode,
                      ConstantPool constantPool,
                      int maxStack,
                      int maxLocals) {
        this.className = Objects.requireNonNull(className, "className cannot be null");
        this.methodName = Objects.requireNonNull(methodName, "methodName cannot be null");
        this.descriptor = Objects.requireNonNull(descriptor, "descriptor cannot be null");
        this.bytecode = Objects.requireNonNull(bytecode, "bytecode cannot be null");
        this.constantPool = Objects.requireNonNull(constantPool, "constantPool cannot be null");
        this.operandStack = new OperandStack(maxStack);
        this.localVariableTable = new LocalVariableTable(maxLocals);
        this.pc = 0;
    }

    public int getPc() {
        return pc;
    }

    public void setPc(int pc) {
        this.pc = pc;
    }

    public void advancePc(int offset) {
        this.pc += offset;
    }

    public OperandStack getOperandStack() {
        return operandStack;
    }

    public LocalVariableTable getLocalVariableTable() {
        return localVariableTable;
    }

    public ConstantPool getConstantPool() {
        return constantPool;
    }

    public byte[] getBytecode() {
        return bytecode;
    }

    public String getClassName() {
        return className;
    }

    public String getMethodName() {
        return methodName;
    }

    public String getDescriptor() {
        return descriptor;
    }

    public String getFullMethodSignature() {
        return className + "." + methodName + descriptor;
    }

    public boolean hasMoreBytecode() {
        return pc < bytecode.length;
    }

    public int readOpcode() {
        if (!hasMoreBytecode()) {
            throw new IllegalStateException("PC out of bounds: " + pc + " >= " + bytecode.length);
        }
        return bytecode[pc++] & 0xFF;
    }

    public int readByte() {
        if (!hasMoreBytecode()) {
            throw new IllegalStateException("PC out of bounds: " + pc + " >= " + bytecode.length);
        }
        return bytecode[pc++];
    }

    public int readUnsignedByte() {
        return readByte() & 0xFF;
    }

    public short readShort() {
        int b1 = readByte();
        int b2 = readUnsignedByte();
        return (short) ((b1 << 8) | b2);
    }

    public int peekByte(int offset) {
        int target = pc + offset;
        if (target < 0 || target >= bytecode.length) {
            throw new IndexOutOfBoundsException("Bytecode peek offset " + target + " invalid for length " + bytecode.length);
        }
        return bytecode[target] & 0xFF;
    }

    @Override
    public String toString() {
        return String.format("Frame[%s, PC=%d, Stack=%s, LVT=%s]",
            getFullMethodSignature(), pc, operandStack, localVariableTable);
    }
}
