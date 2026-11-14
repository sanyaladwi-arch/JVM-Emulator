package com.compiler.jvm.memory;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * JVM Runtime Constant Pool maintaining symbolic references, string literals,
 * class descriptors, and numeric constants.
 */
public final class ConstantPool {
    public enum Tag {
        UTF8(1),
        INTEGER(3),
        FLOAT(4),
        CLASS_REF(7),
        STRING_REF(8),
        FIELD_REF(9),
        METHOD_REF(10),
        NAME_AND_TYPE(12);

        private final int tagValue;

        Tag(int tagValue) {
            this.tagValue = tagValue;
        }

        public int getTagValue() {
            return tagValue;
        }
    }

    public static final class Entry {
        private final int index;
        private final Tag tag;
        private final Object value;
        private final String descriptor;

        public Entry(int index, Tag tag, Object value, String descriptor) {
            this.index = index;
            this.tag = tag;
            this.value = value;
            this.descriptor = descriptor;
        }

        public int getIndex() {
            return index;
        }

        public Tag getTag() {
            return tag;
        }

        public Object getValue() {
            return value;
        }

        public String getDescriptor() {
            return descriptor;
        }

        @Override
        public String toString() {
            return String.format("#%-2d = %-13s %s %s", index, tag, value, descriptor != null ? "(" + descriptor + ")" : "");
        }
    }

    // 1-indexed to match JVM specification
    private final List<Entry> entries = new ArrayList<>();

    public ConstantPool() {
        // Entry 0 is unused in standard JVM specification
        entries.add(new Entry(0, Tag.UTF8, "<null_entry_0>", null));
    }

    public int addUtf8(String val) {
        int idx = entries.size();
        entries.add(new Entry(idx, Tag.UTF8, val, null));
        return idx;
    }

    public int addInteger(int val) {
        int idx = entries.size();
        entries.add(new Entry(idx, Tag.INTEGER, val, null));
        return idx;
    }

    public int addClassRef(String className) {
        int idx = entries.size();
        entries.add(new Entry(idx, Tag.CLASS_REF, className, null));
        return idx;
    }

    public int addMethodRef(String className, String methodName, String descriptor) {
        int idx = entries.size();
        entries.add(new Entry(idx, Tag.METHOD_REF, className + "." + methodName, descriptor));
        return idx;
    }

    public int addString(String val) {
        int idx = entries.size();
        entries.add(new Entry(idx, Tag.STRING_REF, val, null));
        return idx;
    }

    public Entry getEntry(int index) {
        if (index <= 0 || index >= entries.size()) {
            throw new IndexOutOfBoundsException("Invalid constant pool index: " + index + " (size: " + entries.size() + ")");
        }
        return entries.get(index);
    }

    public int getInteger(int index) {
        Entry e = getEntry(index);
        if (e.getTag() != Tag.INTEGER) {
            throw new IllegalArgumentException("Expected Tag.INTEGER at index " + index + " but found " + e.getTag());
        }
        return (int) e.getValue();
    }

    public String getMethodRefName(int index) {
        Entry e = getEntry(index);
        if (e.getTag() != Tag.METHOD_REF) {
            throw new IllegalArgumentException("Expected Tag.METHOD_REF at index " + index + " but found " + e.getTag());
        }
        return (String) e.getValue();
    }

    public int size() {
        return entries.size();
    }

    public List<Entry> getEntries() {
        return Collections.unmodifiableList(entries);
    }
}
