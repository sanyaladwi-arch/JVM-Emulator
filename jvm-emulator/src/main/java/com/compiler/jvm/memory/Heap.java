package com.compiler.jvm.memory;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * JVM Heap Memory managing dynamic allocation of arrays and objects with
 * unique simulated physical memory addresses.
 */
public final class Heap {
    public static final int START_ADDRESS = 0x1000;
    public static final int ADDRESS_ALIGNMENT = 4;

    private int nextAddress = START_ADDRESS;
    private final Map<Integer, ArrayInstance> arrays = new LinkedHashMap<>();
    private final Map<Integer, ObjectInstance> objects = new LinkedHashMap<>();

    public synchronized ArrayInstance allocateIntArray(int length) {
        int address = nextAddress;
        nextAddress += Math.max(ADDRESS_ALIGNMENT, length * 4);
        ArrayInstance instance = new ArrayInstance(address, JvmType.INT, length);
        arrays.put(address, instance);
        return instance;
    }

    public synchronized ObjectInstance allocateObject(String className) {
        int address = nextAddress;
        nextAddress += 16;
        ObjectInstance instance = new ObjectInstance(address, className);
        objects.put(address, instance);
        return instance;
    }

    public synchronized ArrayInstance getArray(int address) {
        ArrayInstance instance = arrays.get(address);
        if (instance == null) {
            throw new NullPointerException("Invalid array reference at address: " + String.format("0x%04X", address));
        }
        return instance;
    }

    public synchronized ObjectInstance getObject(int address) {
        ObjectInstance instance = objects.get(address);
        if (instance == null) {
            throw new NullPointerException("Invalid object reference at address: " + String.format("0x%04X", address));
        }
        return instance;
    }

    public synchronized Map<Integer, ArrayInstance> getArrays() {
        return Collections.unmodifiableMap(arrays);
    }

    public synchronized Map<Integer, ObjectInstance> getObjects() {
        return Collections.unmodifiableMap(objects);
    }

    public synchronized void reset() {
        arrays.clear();
        objects.clear();
        nextAddress = START_ADDRESS;
    }

    public synchronized int getAllocatedCount() {
        return arrays.size() + objects.size();
    }
}
