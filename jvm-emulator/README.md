# Production JVM Bytecode Emulator in Java

A clean, modular, and fully functional Java Virtual Machine (JVM) emulator written in modern Java (17+). This engine implements the core runtime data areas, binary bytecode parser, execution loop (Fetch-Decode-Execute), stack frame management, and heap allocation models specified in the Java Virtual Machine Specification (JVMS).

---

## Architecture Overview

```
                      +-----------------------------+
                      |     ClassFileReader /       |
                      |     BytecodeParser          |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |         MethodArea          |
                      |  +-----------------------+  |
                      |  | Runtime ConstantPool  |  |
                      |  +-----------------------+  |
                      |  | Method Bytecode / IR  |  |
                      |  +-----------------------+  |
                      +--------------+--------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                            ExecutionEngine                              |
|   +-----------------------------------------------------------------+   |
|   |                      Fetch-Decode-Execute                       |   |
|   +-----------------------------------------------------------------+   |
|                                                                         |
|   +-------------------------+             +-------------------------+   |
|   |        JVMStack         |             |       Heap Memory       |   |
|   |  +-------------------+  |             |  +-------------------+  |   |
|   |  | Current Frame     |  |             |  | Object Instances  |  |   |
|   |  | - PC Register     |  |             |  | Array Instances   |  |   |
|   |  | - Operand Stack   |  |             |  | (@0x1000, etc.)   |  |   |
|   |  | - Local Var Table |  |             |  +-------------------+  |   |
|   |  | - Dynamic Linking |  |             |                         |   |
|   |  +-------------------+  |             +-------------------------+   |
|   |  | Caller Frame ...  |  |                                           |
|   |  +-------------------+  |                                           |
|   +-------------------------+                                           |
+-------------------------------------------------------------------------+
```

### 1. Runtime Data Areas (`com.compiler.jvm.memory`)
- **PC Register**: Encapsulated within each `StackFrame` to maintain current instruction offset and support jump instructions (`goto`, `ifeq`, `if_icmplt`).
- **JVM Stack & Stack Frames**:
  - `StackFrame`: Contains the method metadata, current PC, dynamic link reference to the constant pool, `OperandStack`, and `LocalVariableTable`.
  - `OperandStack`: Type-safe LIFO stack handling push/pop of 32-bit `int` and reference values (`JvmValue`) with bounds checking.
  - `LocalVariableTable`: Array of indexed slots (0 to max_locals-1) storing typed values (`JvmType.INT`, `JvmType.REFERENCE`).
  - `JVMStack`: Call stack managing nested frames. Enforces maximum recursion depth (`DEFAULT_MAX_DEPTH = 1024`) to guard against stack overflows.
- **Heap Memory**:
  - Allocator tracking unique memory addresses (`0x1000`, `0x1004`, ...).
  - Supports `ArrayInstance` (primitive int arrays, reference arrays) and `ObjectInstance` (field symbol tables).
- **Method Area & Constant Pool**:
  - `MethodArea`: Class metadata registry storing class names, method descriptors, max stack/locals attributes, and parsed bytecode instructions.
  - `ConstantPool`: Runtime constant pool storing UTF8 strings, integer constants, class references, and method descriptors.

### 2. Bytecode Parser & Loader (`com.compiler.jvm.parser`)
- Custom binary/hex bytecode reader capable of parsing JVM class bytecode streams and structured intermediate representations (IR).
- Handles opcode identification, operand extraction (immediate bytes, 16-bit short offsets, constant pool indices), and branch target resolution.

### 3. Execution Engine & Interpreter (`com.compiler.jvm.engine`)
- High-performance Fetch-Decode-Execute loop.
- Full support for:
  - **Constants & Pushes**: `nop`, `aconst_null`, `iconst_m1`, `iconst_0` .. `iconst_5`, `bipush`, `sipush`, `ldc`
  - **Loads & Stores**: `iload`, `istore` (and indexed variants `iload_0`..`iload_3`, `istore_0`..`istore_3`), `aload`, `astore` (and indexed variants)
  - **Stack Operations**: `pop`, `dup`, `swap`
  - **Arithmetic & Logic**: `iadd`, `isub`, `imul`, `idiv`, `irem`, `ineg`, `iinc`
  - **Control Transfer & Branching**: `ifeq`, `ifne`, `iflt`, `ifge`, `ifgt`, `ifle`, `if_icmpeq`, `if_icmpne`, `if_icmplt`, `if_icmpge`, `if_icmpgt`, `if_icmple`, `goto`
  - **Heap / Arrays**: `newarray`, `iaload`, `iastore`, `arraylength`
  - **Method Invocation & Returns**: `invokestatic`, `ireturn`, `areturn`, `return`
  - **Virtual Native Hook**: Intercepts `System.out.println(int)` calls for console rendering.

### 4. CLI Runner & Driver (`com.compiler.jvm.cli`)
- Interactive or automated execution showing step-by-step traces:
  - Step counter, Current PC, Instruction Mnemonic and Operands.
  - Snapshot of Operand Stack (`[bottom ... top]`).
  - Snapshot of Local Variable Table (`[0: x, 1: y]`).
  - Active call stack depth and returned values.

---

## Compilation & Execution Guide

### Requirements
- JDK 17 or higher
- Apache Maven 3.8+

### 1. Build the Project
```bash
mvn clean package
```

### 2. Run the Test Suite
```bash
mvn test
```

### 3. Run Sample Programs via CLI
```bash
# Run Iterative Factorial (calculating 5!)
java -jar target/jvm-emulator-1.0.0.jar factorial 5

# Run Recursive Fibonacci (calculating fib(7) via recursive invokestatic)
java -jar target/jvm-emulator-1.0.0.jar fibonacci 7

# Run Heap Memory & Array Allocation Demo
java -jar target/jvm-emulator-1.0.0.jar array 10

# Run Euclidean GCD (Greatest Common Divisor)
java -jar target/jvm-emulator-1.0.0.jar gcd 48 18
```
