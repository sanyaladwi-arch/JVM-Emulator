package com.compiler.jvm.memory;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * JVM Local Variable Table (LVT) storing method parameters and local variables.
 */
public final class LocalVariableTable {
    private final int maxLocals;
    private final JvmValue[] locals;

    public LocalVariableTable(int maxLocals) {
        if (maxLocals < 0) {
            throw new IllegalArgumentException("maxLocals cannot be negative: " + maxLocals);
        }
        this.maxLocals = maxLocals;
        this.locals = new JvmValue[maxLocals];
    }

    public void set(int index, JvmValue value) {
        checkIndex(index);
        locals[index] = value;
    }

    public void setInt(int index, int val) {
        set(index, JvmValue.ofInt(val));
    }

    public void setRef(int index, int address) {
        set(index, JvmValue.ofReference(address));
    }

    public JvmValue get(int index) {
        checkIndex(index);
        JvmValue val = locals[index];
        if (val == null) {
            // Default uninitialized slot
            return JvmValue.ZERO;
        }
        return val;
    }

    public int getInt(int index) {
        return get(index).asInt();
    }

    public int getRef(int index) {
        return get(index).asReference();
    }

    public int getMaxLocals() {
        return maxLocals;
    }

    private void checkIndex(int index) {
        if (index < 0 || index >= maxLocals) {
            throw new IndexOutOfBoundsException(
                "LVT index " + index + " out of bounds for maxLocals " + maxLocals);
        }
    }

    public List<JvmValue> getSnapshot() {
        List<JvmValue> list = new ArrayList<>(maxLocals);
        for (int i = 0; i < maxLocals; i++) {
            list.add(locals[i] != null ? locals[i] : JvmValue.ZERO);
        }
        return Collections.unmodifiableList(list);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder("{");
        for (int i = 0; i < maxLocals; i++) {
            if (locals[i] != null) {
                sb.append(i).append(": ").append(locals[i]).append(", ");
            }
        }
        if (sb.length() > 1) {
            sb.setLength(sb.length() - 2);
        }
        sb.append("}");
        return sb.toString();
    }
}
