package com.compiler.jvm.memory;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Heap representation of class instances with symbolic field mappings.
 */
public final class ObjectInstance {
    private final int address;
    private final String className;
    private final Map<String, JvmValue> fields = new HashMap<>();

    public ObjectInstance(int address, String className) {
        this.address = address;
        this.className = className;
    }

    public int getAddress() {
        return address;
    }

    public String getClassName() {
        return className;
    }

    public void setField(String name, JvmValue value) {
        fields.put(name, value);
    }

    public JvmValue getField(String name) {
        return fields.getOrDefault(name, JvmValue.ZERO);
    }

    public Map<String, JvmValue> getFields() {
        return Collections.unmodifiableMap(fields);
    }

    @Override
    public String toString() {
        return String.format("Object[@0x%04X, class=%s, fields=%s]", address, className, fields);
    }
}
