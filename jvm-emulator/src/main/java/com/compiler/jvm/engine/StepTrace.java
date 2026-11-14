package com.compiler.jvm.engine;

import com.compiler.jvm.instructions.Opcode;
import com.compiler.jvm.memory.JvmValue;

import java.util.List;

/**
 * Immutable snapshot record of a single JVM execution cycle (PC, Opcode, Stack, LVT).
 */
public final class StepTrace {
    private final int stepNumber;
    private final int pc;
    private final Opcode opcode;
    private final int[] operands;
    private final String methodSignature;
    private final int callDepth;
    private final List<JvmValue> stackBefore;
    private final List<JvmValue> stackAfter;
    private final List<JvmValue> lvtSnapshot;
    private final String comment;

    public StepTrace(int stepNumber,
                     int pc,
                     Opcode opcode,
                     int[] operands,
                     String methodSignature,
                     int callDepth,
                     List<JvmValue> stackBefore,
                     List<JvmValue> stackAfter,
                     List<JvmValue> lvtSnapshot,
                     String comment) {
        this.stepNumber = stepNumber;
        this.pc = pc;
        this.opcode = opcode;
        this.operands = operands;
        this.methodSignature = methodSignature;
        this.callDepth = callDepth;
        this.stackBefore = stackBefore;
        this.stackAfter = stackAfter;
        this.lvtSnapshot = lvtSnapshot;
        this.comment = comment;
    }

    public int getStepNumber() {
        return stepNumber;
    }

    public int getPc() {
        return pc;
    }

    public Opcode getOpcode() {
        return opcode;
    }

    public int[] getOperands() {
        return operands;
    }

    public String getMethodSignature() {
        return methodSignature;
    }

    public int getCallDepth() {
        return callDepth;
    }

    public List<JvmValue> getStackBefore() {
        return stackBefore;
    }

    public List<JvmValue> getStackAfter() {
        return stackAfter;
    }

    public List<JvmValue> getLvtSnapshot() {
        return lvtSnapshot;
    }

    public String getComment() {
        return comment;
    }
}
