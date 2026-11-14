package com.compiler.jvm.memory;

import java.util.Arrays;

/**
 * Heap representation of primitive integer and reference arrays.
 */
public final class ArrayInstance {
    private final int address;
    private final JvmType componentType;
    private final int length;
    private final int[] elements;

    public ArrayInstance(int address, JvmType componentType, int length) {
        if (length < 0) {
            throw new NegativeArraySizeException("Negative array size: " + length);
        }
        this.address = address;
        this.componentType = componentType;
        this.length = length;
        this.elements = new int[length];
    }

    public int getAddress() {
        return address;
    }

    public JvmType getComponentType() {
        return componentType;
    }

    public int getLength() {
        return length;
    }

    public int get(int index) {
        checkBounds(index);
        return elements[index];
    }

    public void set(int index, int value) {
        checkBounds(index);
        elements[index] = value;
    }

    private void checkBounds(int index) {
        if (index < 0 || index >= length) {
            throw new ArrayIndexOutOfBoundsException("Index " + index + " out of bounds for length " + length);
        }
    }

    public int[] getRawElements() {
        return Arrays.copyOf(elements, length);
    }

    @Override
    public String toString() {
        return String.format("Array[@0x%04X, len=%d, values=%s]", address, length, Arrays.toString(elements));
    }
}
