package com.compiler.jvm;

import com.compiler.jvm.engine.ExecutionEngine;
import com.compiler.jvm.engine.ExecutionResult;
import com.compiler.jvm.memory.Heap;
import com.compiler.jvm.memory.JvmValue;
import com.compiler.jvm.memory.MethodArea;
import com.compiler.jvm.programs.SamplePrograms;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("JVM Execution Engine & Program Interpretation Tests")
class ExecutionEngineTest {

    private MethodArea methodArea;
    private Heap heap;
    private ExecutionEngine engine;

    @BeforeEach
    void setUp() {
        methodArea = new MethodArea();
        heap = new Heap();
        engine = new ExecutionEngine(methodArea, heap);
    }

    @Test
    @DisplayName("Factorial(5) computes 120 via iterative loop")
    void testFactorial5() {
        SamplePrograms.loadFactorialProgram(methodArea);
        engine.loadEntryPoint("Factorial", "compute", "(I)I", JvmValue.ofInt(5));

        ExecutionResult result = engine.run();
        assertTrue(result.isNormalTermination());
        assertEquals(120, result.getReturnValue().asInt());
        assertTrue(result.getTotalSteps() > 10);
    }

    @Test
    @DisplayName("Fibonacci(7) computes 13 via recursive invokestatic")
    void testFibonacci7() {
        SamplePrograms.loadFibonacciProgram(methodArea);
        engine.loadEntryPoint("Fibonacci", "fib", "(I)I", JvmValue.ofInt(7));

        ExecutionResult result = engine.run();
        assertTrue(result.isNormalTermination());
        assertEquals(13, result.getReturnValue().asInt());
    }

    @Test
    @DisplayName("ArrayDemo(5) allocates heap array and computes sum 150")
    void testArrayAllocationAndSum() {
        SamplePrograms.loadArrayProgram(methodArea);
        // int[5] initialized with 10, 20, 30, 40, 50 -> sum = 150
        engine.loadEntryPoint("ArrayDemo", "allocateAndSum", "(I)I", JvmValue.ofInt(5));

        ExecutionResult result = engine.run();
        assertTrue(result.isNormalTermination());
        assertEquals(150, result.getReturnValue().asInt());
        assertEquals(1, heap.getAllocatedCount());
    }

    @Test
    @DisplayName("GCD(48, 18) computes 6 using Euclidean modulo irem")
    void testGcd() {
        SamplePrograms.loadGcdProgram(methodArea);
        engine.loadEntryPoint("GCD", "compute", "(II)I", JvmValue.ofInt(48), JvmValue.ofInt(18));

        ExecutionResult result = engine.run();
        assertTrue(result.isNormalTermination());
        assertEquals(6, result.getReturnValue().asInt());
    }
}
