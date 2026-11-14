package com.compiler.jvm.instructions;

import java.util.Arrays;

/**
 * Intermediate Representation (IR) of a decoded JVM instruction with its
 * bytecode offset (PC), opcode, operands, and optional symbolic target.
 */
public final class Instruction {
    private final int offset;
    private final Opcode opcode;
    private final int[] operands;
    private final String comment;

    public Instruction(int offset, Opcode opcode, int[] operands) {
        this(offset, opcode, operands, null);
    }

    public Instruction(int offset, Opcode opcode, int[] operands, String comment) {
        this.offset = offset;
        this.opcode = opcode;
        this.operands = operands != null ? operands : new int[0];
        this.comment = comment;
    }

    public int getOffset() {
        return offset;
    }

    public Opcode getOpcode() {
        return opcode;
    }

    public int[] getOperands() {
        return Arrays.copyOf(operands, operands.length);
    }

    public int getOperand(int index) {
        return operands[index];
    }

    public int getOperandCount() {
        return operands.length;
    }

    public String getComment() {
        return comment;
    }

    public int getLength() {
        return 1 + opcode.getOperandBytes();
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("%4d: %-12s", offset, opcode.getMnemonic()));
        for (int op : operands) {
            sb.append(" ").append(op);
        }
        if (comment != null && !comment.isEmpty()) {
            sb.append("  // ").append(comment);
        }
        return sb.toString();
    }
}
