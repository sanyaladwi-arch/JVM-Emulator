package com.compiler.jvm.engine;

/**
 * Listener interface for monitoring instruction execution cycles in real-time.
 */
@FunctionalInterface
public interface ExecutionTraceListener {
    void onStepExecuted(StepTrace trace);
}
