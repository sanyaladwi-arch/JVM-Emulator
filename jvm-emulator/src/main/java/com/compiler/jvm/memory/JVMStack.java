package com.compiler.jvm.memory;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.List;

/**
 * JVM Thread Stack managing active stack frames. Enforces maximum stack depth
 * to prevent stack overflow conditions during deep recursion.
 */
public final class JVMStack {
    public static final int DEFAULT_MAX_DEPTH = 1024;

    private final int maxDepth;
    private final Deque<StackFrame> frames = new ArrayDeque<>();

    public JVMStack() {
        this(DEFAULT_MAX_DEPTH);
    }

    public JVMStack(int maxDepth) {
        if (maxDepth <= 0) {
            throw new IllegalArgumentException("maxDepth must be positive: " + maxDepth);
        }
        this.maxDepth = maxDepth;
    }

    public void pushFrame(StackFrame frame) {
        if (frames.size() >= maxDepth) {
            throw new StackOverflowError("JVM Stack overflow: exceeded maximum frame depth of " + maxDepth);
        }
        frames.push(frame);
    }

    public StackFrame popFrame() {
        if (frames.isEmpty()) {
            throw new IllegalStateException("Attempted to pop from empty JVM Stack");
        }
        return frames.pop();
    }

    public StackFrame currentFrame() {
        if (frames.isEmpty()) {
            return null;
        }
        return frames.peek();
    }

    public int getDepth() {
        return frames.size();
    }

    public boolean isEmpty() {
        return frames.isEmpty();
    }

    public int getMaxDepth() {
        return maxDepth;
    }

    public List<StackFrame> getFramesSnapshot() {
        List<StackFrame> list = new ArrayList<>(frames);
        return Collections.unmodifiableList(list);
    }

    public void clear() {
        frames.clear();
    }
}
