package com.compiler.jvm.engine;

import com.compiler.jvm.memory.JvmValue;

import java.util.Collections;
import java.util.List;

/**
 * Encapsulates the execution result, return value, output stream, and telemetry statistics.
 */
public final class ExecutionResult {
    private final JvmValue returnValue;
    private final int totalSteps;
    private final long executionTimeNanos;
    private final List<String> standardOutput;
    private final boolean normalTermination;
    private final Throwable exception;

    public ExecutionResult(JvmValue returnValue,
                           int totalSteps,
                           long executionTimeNanos,
                           List<String> standardOutput,
                           boolean normalTermination,
                           Throwable exception) {
        this.returnValue = returnValue;
        this.totalSteps = totalSteps;
        this.executionTimeNanos = executionTimeNanos;
        this.standardOutput = Collections.unmodifiableList(standardOutput);
        this.normalTermination = normalTermination;
        this.exception = exception;
    }

    public JvmValue getReturnValue() {
        return returnValue;
    }

    public int getTotalSteps() {
        return totalSteps;
    }

    public long getExecutionTimeNanos() {
        return executionTimeNanos;
    }

    public List<String> getStandardOutput() {
        return standardOutput;
    }

    public boolean isNormalTermination() {
        return normalTermination;
    }

    public Throwable getException() {
        return exception;
    }

    @Override
    public String toString() {
        return String.format("ExecutionResult[return=%s, steps=%d, time=%d ms, stdout=%s]",
            returnValue, totalSteps, executionTimeNanos / 1_000_000, standardOutput);
    }
}
