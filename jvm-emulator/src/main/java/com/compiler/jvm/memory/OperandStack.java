package com.compiler.jvm.memory;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * JVM Operand Stack implementing LIFO operations for evaluating expressions
 * and method arguments.
 */
public final class OperandStack {
    private final int maxStack;
    private final JvmValue[] stack;
    private int top;

    public OperandStack(int maxStack) {
        if (maxStack < 0) {
            throw new IllegalArgumentException("maxStack cannot be negative: " + maxStack);
        }
        this.maxStack = maxStack;
        this.stack = new JvmValue[maxStack];
        this.top = 0;
    }

    public void push(JvmValue value) {
        if (top >= maxStack) {
            throw new IllegalStateException("OperandStack overflow: max size " + maxStack);
        }
        stack[top++] = value;
    }

    public void pushInt(int val) {
        push(JvmValue.ofInt(val));
    }

    public void pushRef(int address) {
        push(JvmValue.ofReference(address));
    }

    public JvmValue pop() {
        if (top <= 0) {
            throw new IllegalStateException("OperandStack underflow: empty stack");
        }
        JvmValue value = stack[--top];
        stack[top] = null;
        return value;
    }

    public int popInt() {
        return pop().asInt();
    }

    public int popRef() {
        return pop().asReference();
    }

    public JvmValue peek() {
        if (top <= 0) {
            throw new IllegalStateException("OperandStack underflow: empty stack");
        }
        return stack[top - 1];
    }

    public void dup() {
        JvmValue val = peek();
        push(val);
    }

    public void swap() {
        if (top < 2) {
            throw new IllegalStateException("OperandStack swap requires at least 2 elements");
        }
        JvmValue val1 = pop();
        JvmValue val2 = pop();
        push(val1);
        push(val2);
    }

    public int size() {
        return top;
    }

    public int getMaxStack() {
        return maxStack;
    }

    public boolean isEmpty() {
        return top == 0;
    }

    public void clear() {
        for (int i = 0; i < top; i++) {
            stack[i] = null;
        }
        top = 0;
    }

    public List<JvmValue> getElementsSnapshot() {
        List<JvmValue> list = new ArrayList<>(top);
        for (int i = 0; i < top; i++) {
            list.add(stack[i]);
        }
        return Collections.unmodifiableList(list);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < top; i++) {
            sb.append(stack[i]);
            if (i < top - 1) sb.append(", ");
        }
        sb.append("]");
        return sb.toString();
    }
}
