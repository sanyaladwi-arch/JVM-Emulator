package com.compiler.jvm.cli;

import com.compiler.jvm.engine.StepTrace;
import com.compiler.jvm.instructions.Instruction;
import com.compiler.jvm.memory.JvmValue;

import java.util.List;

/**
 * Formats JVM step execution traces into clean, aligned tabular logs.
 */
public final class TraceFormatter {

    public static String formatHeader() {
        return String.format("%-6s | %-5s | %-16s | %-24s | %-26s | %s",
            "STEP", "PC", "INSTRUCTION", "OPERAND STACK", "LOCAL VARIABLES", "METHOD / NOTES");
    }

    public static String formatDivider() {
        return "-------+-------+------------------+--------------------------+----------------------------+-----------------------------";
    }

    public static String formatStep(StepTrace trace) {
        StringBuilder instr = new StringBuilder(trace.getOpcode().getMnemonic());
        for (int op : trace.getOperands()) {
            instr.append(" ").append(op);
        }

        String stackStr = formatStack(trace.getStackAfter());
        String lvtStr = formatLvt(trace.getLvtSnapshot());

        String notes = trace.getComment() != null ? trace.getComment() : "";
        if (trace.getCallDepth() > 1) {
            notes = "[depth " + trace.getCallDepth() + "] " + notes;
        }

        return String.format("%-6d | %-5d | %-16s | %-24s | %-26s | %s",
            trace.getStepNumber(),
            trace.getPc(),
            instr,
            stackStr,
            lvtStr,
            notes);
    }

    private static String formatStack(List<JvmValue> stack) {
        if (stack.isEmpty()) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < stack.size(); i++) {
            sb.append(stack.get(i));
            if (i < stack.size() - 1) sb.append(", ");
        }
        sb.append("]");
        return sb.toString();
    }

    private static String formatLvt(List<JvmValue> lvt) {
        StringBuilder sb = new StringBuilder("{");
        for (int i = 0; i < lvt.size(); i++) {
            sb.append(i).append(":").append(lvt.get(i));
            if (i < lvt.size() - 1) sb.append(", ");
        }
        sb.append("}");
        return sb.toString();
    }
}
