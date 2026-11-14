package com.compiler.jvm;

import com.compiler.jvm.memory.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("JVM Runtime Data Areas & Memory Model Tests")
class MemoryModelTest {

    private Heap heap;
    private ConstantPool cp;

    @BeforeEach
    void setUp() {
        heap = new Heap();
        cp = new ConstantPool();
    }

    @Test
    @DisplayName("OperandStack push, pop, dup, and swap operations")
    void testOperandStackOperations() {
        OperandStack stack = new OperandStack(4);
        assertTrue(stack.isEmpty());

        stack.pushInt(42);
        assertEquals(1, stack.size());
        assertEquals(42, stack.peek().asInt());

        stack.pushInt(100);
        assertEquals(100, stack.peek().asInt());

        stack.swap();
        assertEquals(42, stack.popInt());
        assertEquals(100, stack.popInt());
        assertTrue(stack.isEmpty());
    }

    @Test
    @DisplayName("OperandStack handles stack overflow and underflow")
    void testOperandStackBounds() {
        OperandStack stack = new OperandStack(2);
        stack.pushInt(1);
        stack.pushInt(2);
        assertThrows(IllegalStateException.class, () -> stack.pushInt(3));

        stack.popInt();
        stack.popInt();
        assertThrows(IllegalStateException.class, stack::popInt);
    }

    @Test
    @DisplayName("LocalVariableTable slot storage and retrieval")
    void testLocalVariableTable() {
        LocalVariableTable lvt = new LocalVariableTable(4);
        assertEquals(0, lvt.getInt(0)); // default uninitialized slot

        lvt.setInt(0, 999);
        lvt.setInt(1, -50);
        lvt.setRef(2, 0x1004);

        assertEquals(999, lvt.getInt(0));
        assertEquals(-50, lvt.getInt(1));
        assertEquals(0x1004, lvt.getRef(2));
        assertThrows(IndexOutOfBoundsException.class, () -> lvt.getInt(4));
    }

    @Test
    @DisplayName("Heap allocates arrays and objects with unique physical addresses")
    void testHeapAllocation() {
        ArrayInstance arr1 = heap.allocateIntArray(5);
        assertEquals(0x1000, arr1.getAddress());
        assertEquals(5, arr1.getLength());

        arr1.set(0, 10);
        arr1.set(4, 50);
        assertEquals(10, arr1.get(0));
        assertEquals(50, arr1.get(4));

        ArrayInstance arr2 = heap.allocateIntArray(3);
        assertTrue(arr2.getAddress() > arr1.getAddress());

        assertEquals(2, heap.getAllocatedCount());
        assertSame(arr1, heap.getArray(arr1.getAddress()));
    }
}
