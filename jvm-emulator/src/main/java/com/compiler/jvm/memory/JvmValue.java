package com.compiler.jvm.memory;

import java.util.Objects;

/**
 * Representation of a 32-bit slot value in JVM stack frames, supporting both
 * primitives (int) and heap references (addresses).
 */
public final class JvmValue {
    public static final JvmValue NULL_REFERENCE = new JvmValue(JvmType.REFERENCE, -1);
    public static final JvmValue ZERO = new JvmValue(JvmType.INT, 0);
    public static final JvmValue ONE = new JvmValue(JvmType.INT, 1);

    private final JvmType type;
    private final int rawBits;

    private JvmValue(JvmType type, int rawBits) {
        this.type = Objects.requireNonNull(type, "type cannot be null");
        this.rawBits = rawBits;
    }

    public static JvmValue ofInt(int value) {
        return new JvmValue(JvmType.INT, value);
    }

    public static JvmValue ofReference(int address) {
        return new JvmValue(JvmType.REFERENCE, address);
    }

    public JvmType getType() {
        return type;
    }

    public int asInt() {
        if (type != JvmType.INT) {
            throw new IllegalStateException("Attempted to read non-int JvmValue as int. Actual: " + type);
        }
        return rawBits;
    }

    public int asReference() {
        if (type != JvmType.REFERENCE) {
            throw new IllegalStateException("Attempted to read non-reference JvmValue as reference. Actual: " + type);
        }
        return rawBits;
    }

    public boolean isNull() {
        return type == JvmType.REFERENCE && rawBits == -1;
    }

    public int getRawBits() {
        return rawBits;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        JvmValue jvmValue = (JvmValue) o;
        return rawBits == jvmValue.rawBits && type == jvmValue.type;
    }

    @Override
    public int hashCode() {
        return Objects.hash(type, rawBits);
    }

    @Override
    public String toString() {
        if (type == JvmType.REFERENCE) {
            return isNull() ? "null" : String.format("@0x%04X", rawBits);
        }
        return String.valueOf(rawBits);
    }
}
