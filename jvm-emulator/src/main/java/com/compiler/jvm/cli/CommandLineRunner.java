package com.compiler.jvm.cli;

import com.compiler.jvm.engine.ExecutionEngine;
import com.compiler.jvm.engine.ExecutionResult;
import com.compiler.jvm.memory.Heap;
import com.compiler.jvm.memory.JvmValue;
import com.compiler.jvm.memory.MethodArea;
import com.compiler.jvm.programs.SamplePrograms;

/**
 * Command-Line Runner that coordinates memory area initialization, bytecode loading,
 * trace interception, and console execution.
 */
public final class CommandLineRunner {

    public static void run(String[] args) {
        String program = args.length > 0 ? args[0].toLowerCase() : "factorial";
        int arg1 = args.length > 1 ? Integer.parseInt(args[1]) : 5;
        int arg2 = args.length > 2 ? Integer.parseInt(args[2]) : 3;

        System.out.println("==========================================================================================");
        System.out.println("                   JVM (Java Virtual Machine) Emulator & Execution Tracer                 ");
        System.out.println("==========================================================================================");
        System.out.println("Target Program: " + program.toUpperCase());
        System.out.println("Arguments:      " + arg1 + (args.length > 2 ? ", " + arg2 : ""));
        System.out.println();

        MethodArea methodArea = new MethodArea();
        Heap heap = new Heap();
        ExecutionEngine engine = new ExecutionEngine(methodArea, heap);

        // Print header and subscribe tracer
        System.out.println(TraceFormatter.formatHeader());
        System.out.println(TraceFormatter.formatDivider());

        engine.addTraceListener(trace -> {
            System.out.println(TraceFormatter.formatStep(trace));
        });

        // Load requested program
        switch (program) {
            case "factorial":
            case "fact":
                SamplePrograms.loadFactorialProgram(methodArea);
                engine.loadEntryPoint("Factorial", "compute", "(I)I", JvmValue.ofInt(arg1));
                break;

            case "fibonacci":
            case "fib":
                SamplePrograms.loadFibonacciProgram(methodArea);
                engine.loadEntryPoint("Fibonacci", "fib", "(I)I", JvmValue.ofInt(arg1));
                break;

            case "array":
            case "heap":
                SamplePrograms.loadArrayProgram(methodArea);
                engine.loadEntryPoint("ArrayDemo", "allocateAndSum", "(I)I", JvmValue.ofInt(arg1));
                break;

            case "gcd":
                SamplePrograms.loadGcdProgram(methodArea);
                engine.loadEntryPoint("GCD", "compute", "(II)I", JvmValue.ofInt(arg1), JvmValue.ofInt(arg2));
                break;

            default:
                System.err.println("Unknown program: " + program);
                System.out.println("Available programs: factorial [n], fibonacci [n], array [size], gcd [a] [b]");
                return;
        }

        ExecutionResult result = engine.run();

        System.out.println(TraceFormatter.formatDivider());
        System.out.println();
        System.out.println("------------------------------------------------------------------------------------------");
        System.out.println("                                    EXECUTION SUMMARY                                     ");
        System.out.println("------------------------------------------------------------------------------------------");
        System.out.println("Status:             " + (result.isNormalTermination() ? "COMPLETED (Exit Code 0)" : "FAILED"));
        System.out.println("Return Value:       " + result.getReturnValue());
        System.out.println("Total Steps:        " + result.getTotalSteps());
        System.out.printf("Execution Duration: %.3f ms%n", result.getExecutionTimeNanos() / 1_000_000.0);
        System.out.println("Heap Allocations:   " + heap.getAllocatedCount() + " instance(s)");
        if (!result.getStandardOutput().isEmpty()) {
            System.out.println("Standard Output:    " + String.join(", ", result.getStandardOutput()));
        }
        if (result.getException() != null) {
            System.out.println("Exception:          " + result.getException().getMessage());
            result.getException().printStackTrace(System.err);
        }
        System.out.println("==========================================================================================");
    }
}
