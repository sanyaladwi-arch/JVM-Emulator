package com.compiler.jvm.engine;

import com.compiler.jvm.instructions.Opcode;
import com.compiler.jvm.memory.*;
import com.compiler.jvm.parser.MethodDescriptor;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * JVM Execution Engine implementing the Fetch-Decode-Execute interpreter cycle,
 * operand evaluation, stack frame lifecycle, and native system hooks.
 */
public final class ExecutionEngine {
    public static final int DEFAULT_MAX_STEPS = 100_000;

    private final MethodArea methodArea;
    private final Heap heap;
    private final JVMStack jvmStack;
    private final List<String> standardOutput = new ArrayList<>();
    private final List<ExecutionTraceListener> listeners = new ArrayList<>();
    private int stepCounter = 0;
    private int maxSteps = DEFAULT_MAX_STEPS;
    private JvmValue lastReturnValue = null;

    public ExecutionEngine(MethodArea methodArea, Heap heap) {
        this.methodArea = Objects.requireNonNull(methodArea, "methodArea cannot be null");
        this.heap = Objects.requireNonNull(heap, "heap cannot be null");
        this.jvmStack = new JVMStack();
    }

    public void addTraceListener(ExecutionTraceListener listener) {
        listeners.add(listener);
    }

    public void setMaxSteps(int maxSteps) {
        this.maxSteps = maxSteps;
    }

    public JVMStack getJvmStack() {
        return jvmStack;
    }

    public Heap getHeap() {
        return heap;
    }

    public MethodArea getMethodArea() {
        return methodArea;
    }

    public List<String> getStandardOutput() {
        return standardOutput;
    }

    public int getStepCounter() {
        return stepCounter;
    }

    /**
     * Initializes the execution engine with the entry-point method frame.
     */
    public void loadEntryPoint(String className, String methodName, String descriptor, JvmValue... args) {
        MethodArea.MethodInfo entry = methodArea.resolveMethod(className, methodName, descriptor);
        StackFrame frame = new StackFrame(
            entry.getClassName(),
            entry.getMethodName(),
            entry.getDescriptor(),
            entry.getBytecode(),
            entry.getConstantPool(),
            entry.getMaxStack(),
            entry.getMaxLocals()
        );

        if (args != null) {
            for (int i = 0; i < args.length; i++) {
                frame.getLocalVariableTable().set(i, args[i]);
            }
        }

        jvmStack.pushFrame(frame);
    }

    /**
     * Executes the interpreter loop until the JVM stack unwinds completely
     * or maximum execution steps are exceeded.
     */
    public ExecutionResult run() {
        long startTime = System.nanoTime();
        try {
            while (!jvmStack.isEmpty()) {
                if (++stepCounter > maxSteps) {
                    throw new IllegalStateException("Execution exceeded maximum permitted steps: " + maxSteps);
                }
                step();
            }
            long elapsed = System.nanoTime() - startTime;
            return new ExecutionResult(lastReturnValue, stepCounter, elapsed, standardOutput, true, null);
        } catch (Throwable t) {
            long elapsed = System.nanoTime() - startTime;
            return new ExecutionResult(lastReturnValue, stepCounter, elapsed, standardOutput, false, t);
        }
    }

    /**
     * Performs a single Fetch-Decode-Execute step on the top stack frame.
     */
    public boolean step() {
        if (jvmStack.isEmpty()) {
            return false;
        }

        StackFrame frame = jvmStack.currentFrame();
        int initialPc = frame.getPc();
        int rawOpcode = frame.readOpcode();
        Opcode opcode = Opcode.fromByte(rawOpcode);

        OperandStack stack = frame.getOperandStack();
        LocalVariableTable lvt = frame.getLocalVariableTable();

        List<JvmValue> stackBefore = stack.getElementsSnapshot();
        int[] operands = new int[0];
        String comment = null;

        switch (opcode) {
            // Constants
            case NOP:
                break;
            case ACONST_NULL:
                stack.push(JvmValue.NULL_REFERENCE);
                break;
            case ICONST_M1:
                stack.pushInt(-1);
                break;
            case ICONST_0:
                stack.pushInt(0);
                break;
            case ICONST_1:
                stack.pushInt(1);
                break;
            case ICONST_2:
                stack.pushInt(2);
                break;
            case ICONST_3:
                stack.pushInt(3);
                break;
            case ICONST_4:
                stack.pushInt(4);
                break;
            case ICONST_5:
                stack.pushInt(5);
                break;
            case BIPUSH: {
                int byteVal = frame.readByte();
                operands = new int[]{byteVal};
                stack.pushInt(byteVal);
                break;
            }
            case SIPUSH: {
                short shortVal = frame.readShort();
                operands = new int[]{shortVal};
                stack.pushInt(shortVal);
                break;
            }
            case LDC: {
                int cpIndex = frame.readUnsignedByte();
                operands = new int[]{cpIndex};
                ConstantPool.Entry entry = frame.getConstantPool().getEntry(cpIndex);
                if (entry.getTag() == ConstantPool.Tag.INTEGER) {
                    stack.pushInt((int) entry.getValue());
                } else if (entry.getTag() == ConstantPool.Tag.STRING_REF) {
                    // String literal stored in heap
                    ObjectInstance strObj = heap.allocateObject("java/lang/String");
                    stack.pushRef(strObj.getAddress());
                } else {
                    throw new UnsupportedOperationException("LDC for tag: " + entry.getTag());
                }
                comment = "LDC #" + cpIndex + " (" + entry.getValue() + ")";
                break;
            }

            // Local variable loads
            case ILOAD: {
                int index = frame.readUnsignedByte();
                operands = new int[]{index};
                stack.pushInt(lvt.getInt(index));
                break;
            }
            case ILOAD_0:
                stack.pushInt(lvt.getInt(0));
                break;
            case ILOAD_1:
                stack.pushInt(lvt.getInt(1));
                break;
            case ILOAD_2:
                stack.pushInt(lvt.getInt(2));
                break;
            case ILOAD_3:
                stack.pushInt(lvt.getInt(3));
                break;

            case ALOAD: {
                int index = frame.readUnsignedByte();
                operands = new int[]{index};
                stack.push(lvt.get(index));
                break;
            }
            case ALOAD_0:
                stack.push(lvt.get(0));
                break;
            case ALOAD_1:
                stack.push(lvt.get(1));
                break;
            case ALOAD_2:
                stack.push(lvt.get(2));
                break;
            case ALOAD_3:
                stack.push(lvt.get(3));
                break;

            // Local variable stores
            case ISTORE: {
                int index = frame.readUnsignedByte();
                operands = new int[]{index};
                lvt.setInt(index, stack.popInt());
                break;
            }
            case ISTORE_0:
                lvt.setInt(0, stack.popInt());
                break;
            case ISTORE_1:
                lvt.setInt(1, stack.popInt());
                break;
            case ISTORE_2:
                lvt.setInt(2, stack.popInt());
                break;
            case ISTORE_3:
                lvt.setInt(3, stack.popInt());
                break;

            case ASTORE: {
                int index = frame.readUnsignedByte();
                operands = new int[]{index};
                lvt.set(index, stack.pop());
                break;
            }
            case ASTORE_0:
                lvt.set(0, stack.pop());
                break;
            case ASTORE_1:
                lvt.set(1, stack.pop());
                break;
            case ASTORE_2:
                lvt.set(2, stack.pop());
                break;
            case ASTORE_3:
                lvt.set(3, stack.pop());
                break;

            // Stack manipulation
            case POP:
                stack.pop();
                break;
            case DUP:
                stack.dup();
                break;
            case SWAP:
                stack.swap();
                break;

            // Arithmetic & Logic
            case IADD: {
                int v2 = stack.popInt();
                int v1 = stack.popInt();
                stack.pushInt(v1 + v2);
                break;
            }
            case ISUB: {
                int v2 = stack.popInt();
                int v1 = stack.popInt();
                stack.pushInt(v1 - v2);
                break;
            }
            case IMUL: {
                int v2 = stack.popInt();
                int v1 = stack.popInt();
                stack.pushInt(v1 * v2);
                break;
            }
            case IDIV: {
                int v2 = stack.popInt();
                int v1 = stack.popInt();
                if (v2 == 0) {
                    throw new ArithmeticException("/ by zero");
                }
                stack.pushInt(v1 / v2);
                break;
            }
            case IREM: {
                int v2 = stack.popInt();
                int v1 = stack.popInt();
                if (v2 == 0) {
                    throw new ArithmeticException("/ by zero");
                }
                stack.pushInt(v1 % v2);
                break;
            }
            case INEG: {
                int v = stack.popInt();
                stack.pushInt(-v);
                break;
            }
            case IINC: {
                int index = frame.readUnsignedByte();
                int amount = frame.readByte();
                operands = new int[]{index, amount};
                int current = lvt.getInt(index);
                lvt.setInt(index, current + amount);
                comment = "LVT[" + index + "] = " + (current + amount);
                break;
            }

            // Branching
            case IFEQ: {
                short offset = frame.readShort();
                operands = new int[]{offset};
                int val = stack.popInt();
                if (val == 0) {
                    frame.setPc(initialPc + offset);
                    comment = "Branch taken -> PC " + frame.getPc();
                }
                break;
            }
            case IFNE: {
                short offset = frame.readShort();
                operands = new int[]{offset};
                int val = stack.popInt();
                if (val != 0) {
                    frame.setPc(initialPc + offset);
                    comment = "Branch taken -> PC " + frame.getPc();
                }
                break;
            }
            case IFLT: {
                short offset = frame.readShort();
                operands = new int[]{offset};
                int val = stack.popInt();
                if (val < 0) {
                    frame.setPc(initialPc + offset);
                    comment = "Branch taken -> PC " + frame.getPc();
                }
                break;
            }
            case IFGE: {
                short offset = frame.readShort();
                operands = new int[]{offset};
                int val = stack.popInt();
                if (val >= 0) {
                    frame.setPc(initialPc + offset);
                    comment = "Branch taken -> PC " + frame.getPc();
                }
                break;
            }
            case IFGT: {
                short offset = frame.readShort();
                operands = new int[]{offset};
                int val = stack.popInt();
                if (val > 0) {
                    frame.setPc(initialPc + offset);
                    comment = "Branch taken -> PC " + frame.getPc();
                }
                break;
            }
            case IFLE: {
                short offset = frame.readShort();
                operands = new int[]{offset};
                int val = stack.popInt();
                if (val <= 0) {
                    frame.setPc(initialPc + offset);
                    comment = "Branch taken -> PC " + frame.getPc();
                }
                break;
            }

            // Comparison branching
            case IF_ICMPEQ: {
                short offset = frame.readShort();
                operands = new int[]{offset};
                int v2 = stack.popInt();
                int v1 = stack.popInt();
                if (v1 == v2) {
                    frame.setPc(initialPc + offset);
                    comment = "Branch taken -> PC " + frame.getPc();
                }
                break;
            }
            case IF_ICMPNE: {
                short offset = frame.readShort();
                operands = new int[]{offset};
                int v2 = stack.popInt();
                int v1 = stack.popInt();
                if (v1 != v2) {
                    frame.setPc(initialPc + offset);
                    comment = "Branch taken -> PC " + frame.getPc();
                }
                break;
            }
            case IF_ICMPLT: {
                short offset = frame.readShort();
                operands = new int[]{offset};
                int v2 = stack.popInt();
                int v1 = stack.popInt();
                if (v1 < v2) {
                    frame.setPc(initialPc + offset);
                    comment = "Branch taken -> PC " + frame.getPc();
                }
                break;
            }
            case IF_ICMPGE: {
                short offset = frame.readShort();
                operands = new int[]{offset};
                int v2 = stack.popInt();
                int v1 = stack.popInt();
                if (v1 >= v2) {
                    frame.setPc(initialPc + offset);
                    comment = "Branch taken -> PC " + frame.getPc();
                }
                break;
            }
            case IF_ICMPGT: {
                short offset = frame.readShort();
                operands = new int[]{offset};
                int v2 = stack.popInt();
                int v1 = stack.popInt();
                if (v1 > v2) {
                    frame.setPc(initialPc + offset);
                    comment = "Branch taken -> PC " + frame.getPc();
                }
                break;
            }
            case IF_ICMPLE: {
                short offset = frame.readShort();
                operands = new int[]{offset};
                int v2 = stack.popInt();
                int v1 = stack.popInt();
                if (v1 <= v2) {
                    frame.setPc(initialPc + offset);
                    comment = "Branch taken -> PC " + frame.getPc();
                }
                break;
            }

            // Unconditional branch
            case GOTO: {
                short offset = frame.readShort();
                operands = new int[]{offset};
                frame.setPc(initialPc + offset);
                comment = "Jump -> PC " + frame.getPc();
                break;
            }

            // Arrays & Heap
            case NEWARRAY: {
                int atype = frame.readUnsignedByte();
                operands = new int[]{atype};
                int length = stack.popInt();
                ArrayInstance array = heap.allocateIntArray(length);
                stack.pushRef(array.getAddress());
                comment = "Allocated int[" + length + "] at " + String.format("@0x%04X", array.getAddress());
                break;
            }
            case IALOAD: {
                int index = stack.popInt();
                int arrayRef = stack.popRef();
                ArrayInstance array = heap.getArray(arrayRef);
                stack.pushInt(array.get(index));
                break;
            }
            case IASTORE: {
                int value = stack.popInt();
                int index = stack.popInt();
                int arrayRef = stack.popRef();
                ArrayInstance array = heap.getArray(arrayRef);
                array.set(index, value);
                comment = String.format("Array[@0x%04X][%d] = %d", arrayRef, index, value);
                break;
            }
            case ARRAYLENGTH: {
                int arrayRef = stack.popRef();
                ArrayInstance array = heap.getArray(arrayRef);
                stack.pushInt(array.getLength());
                break;
            }

            // Method Invocation
            case INVOKESTATIC: {
                int cpIndex = (frame.readUnsignedByte() << 8) | frame.readUnsignedByte();
                operands = new int[]{cpIndex};
                ConstantPool.Entry entry = frame.getConstantPool().getEntry(cpIndex);
                String fullMethod = (String) entry.getValue();
                String desc = entry.getDescriptor();
                comment = "Invoke: " + fullMethod + desc;

                // Virtual Native Hook for System.out.println
                if (fullMethod.equals("java/lang/System.out.println") || fullMethod.contains("println")) {
                    JvmValue val = stack.pop();
                    String line = val.getType() == JvmType.REFERENCE ? "Ref" + val : String.valueOf(val.asInt());
                    standardOutput.add(line);
                    break;
                }

                // Split className and methodName
                int dot = fullMethod.lastIndexOf('.');
                String targetClass = fullMethod.substring(0, dot);
                String targetMethod = fullMethod.substring(dot + 1);

                MethodArea.MethodInfo resolved = methodArea.resolveMethod(targetClass, targetMethod, desc);
                MethodDescriptor md = MethodDescriptor.parse(desc);

                // Create new frame
                StackFrame newFrame = new StackFrame(
                    resolved.getClassName(),
                    resolved.getMethodName(),
                    resolved.getDescriptor(),
                    resolved.getBytecode(),
                    resolved.getConstantPool(),
                    resolved.getMaxStack(),
                    resolved.getMaxLocals()
                );

                // Pass arguments in reverse order into newFrame's LVT
                int paramCount = md.getParameterCount();
                for (int i = paramCount - 1; i >= 0; i--) {
                    newFrame.getLocalVariableTable().set(i, stack.pop());
                }

                jvmStack.pushFrame(newFrame);
                break;
            }

            // Method Returns
            case IRETURN: {
                JvmValue ret = stack.pop();
                lastReturnValue = ret;
                jvmStack.popFrame();
                if (!jvmStack.isEmpty()) {
                    jvmStack.currentFrame().getOperandStack().push(ret);
                }
                comment = "Return int: " + ret.asInt();
                break;
            }
            case ARETURN: {
                JvmValue ret = stack.pop();
                lastReturnValue = ret;
                jvmStack.popFrame();
                if (!jvmStack.isEmpty()) {
                    jvmStack.currentFrame().getOperandStack().push(ret);
                }
                comment = "Return ref: " + ret;
                break;
            }
            case RETURN: {
                lastReturnValue = null;
                jvmStack.popFrame();
                comment = "Return void";
                break;
            }

            default:
                throw new UnsupportedOperationException("Unhandled opcode in ExecutionEngine: " + opcode);
        }

        List<JvmValue> stackAfter = stack.getElementsSnapshot();
        List<JvmValue> lvtSnapshot = lvt.getSnapshot();

        StepTrace trace = new StepTrace(
            stepCounter,
            initialPc,
            opcode,
            operands,
            frame.getFullMethodSignature(),
            jvmStack.getDepth(),
            stackBefore,
            stackAfter,
            lvtSnapshot,
            comment
        );

        for (ExecutionTraceListener listener : listeners) {
            listener.onStepExecuted(trace);
        }

        return true;
    }
}
