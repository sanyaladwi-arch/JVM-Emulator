package com.compiler.jvm.programs;

import com.compiler.jvm.memory.ConstantPool;
import com.compiler.jvm.memory.MethodArea;

/**
 * Pre-compiled bytecode routines showcasing core JVM execution patterns:
 * - Iterative Factorial (loops, branch instructions, local variable modifications)
 * - Recursive Fibonacci (call stack frame creation, invokestatic, returns)
 * - Heap Array Allocation & Sum (newarray, iastore, iaload, arraylength)
 * - Euclidean GCD (modular arithmetic irem, conditional branching)
 */
public final class SamplePrograms {

    /**
     * Loads the Factorial class into the MethodArea.
     * Computes n! iteratively:
     *   result = 1
     *   for (int i = 2; i <= n; i++) result *= i;
     *   return result;
     */
    public static void loadFactorialProgram(MethodArea methodArea) {
        ConstantPool cp = new ConstantPool();
        cp.addClassRef("Factorial");
        cp.addUtf8("compute");
        cp.addUtf8("(I)I");

        byte[] bytecode = BytecodeBuilder.create()
            .iconst_1()          // result = 1
            .istore_1()          // store in slot 1 (result)
            .iconst_2()          // i = 2
            .istore_2()          // store in slot 2 (i)
            .label("LOOP_HEADER")
            .iload_2()           // push i
            .iload_0()           // push n
            .if_icmpgt("LOOP_END") // if i > n goto LOOP_END
            .iload_1()           // push result
            .iload_2()           // push i
            .imul()              // result * i
            .istore_1()          // store result
            .iinc(2, 1)          // i++
            .gotoLabel("LOOP_HEADER")
            .label("LOOP_END")
            .iload_1()           // push result
            .ireturn()           // return result
            .build();

        MethodArea.ClassInfo clazz = new MethodArea.ClassInfo("Factorial", "java/lang/Object", cp);
        MethodArea.MethodInfo method = new MethodArea.MethodInfo(
            "Factorial",
            "compute",
            "(I)I",
            0x0009, // public static
            4,      // maxStack
            4,      // maxLocals (0: n, 1: result, 2: i)
            bytecode,
            cp
        );
        clazz.addMethod(method);
        methodArea.registerClass(clazz);
    }

    /**
     * Loads the Fibonacci class into the MethodArea.
     * Computes fib(n) recursively:
     *   if (n <= 1) return n;
     *   return fib(n - 1) + fib(n - 2);
     */
    public static void loadFibonacciProgram(MethodArea methodArea) {
        ConstantPool cp = new ConstantPool();
        cp.addClassRef("Fibonacci");
        int selfMethodIdx = cp.addMethodRef("Fibonacci", "fib", "(I)I");

        byte[] bytecode = BytecodeBuilder.create()
            .iload_0()           // push n
            .iconst_1()          // push 1
            .if_icmpgt("RECURSION") // if n > 1 goto RECURSION
            .iload_0()           // push n (base cases: 0 or 1)
            .ireturn()
            .label("RECURSION")
            .iload_0()           // push n
            .iconst_1()          // push 1
            .isub()              // n - 1
            .invokestatic(selfMethodIdx) // fib(n - 1)
            .iload_0()           // push n
            .iconst_2()          // push 2
            .isub()              // n - 2
            .invokestatic(selfMethodIdx) // fib(n - 2)
            .iadd()              // fib(n-1) + fib(n-2)
            .ireturn()
            .build();

        MethodArea.ClassInfo clazz = new MethodArea.ClassInfo("Fibonacci", "java/lang/Object", cp);
        MethodArea.MethodInfo method = new MethodArea.MethodInfo(
            "Fibonacci",
            "fib",
            "(I)I",
            0x0009, // public static
            4,      // maxStack
            2,      // maxLocals (0: n)
            bytecode,
            cp
        );
        clazz.addMethod(method);
        methodArea.registerClass(clazz);
    }

    /**
     * Loads an Array Allocation and Sum program into the MethodArea.
     *   int[] arr = new int[size];
     *   for (int i = 0; i < size; i++) arr[i] = (i + 1) * 10;
     *   int sum = 0;
     *   for (int i = 0; i < size; i++) sum += arr[i];
     *   return sum;
     */
    public static void loadArrayProgram(MethodArea methodArea) {
        ConstantPool cp = new ConstantPool();
        cp.addClassRef("ArrayDemo");

        byte[] bytecode = BytecodeBuilder.create()
            // slot 0: size
            .iload_0()
            .newarray(10)        // T_INT = 10, heap allocate int[size]
            .astore_1()          // slot 1: arr reference

            // Initialization loop: arr[i] = (i + 1) * 10
            .iconst_0()
            .istore_2()          // slot 2: i = 0
            .label("INIT_LOOP")
            .iload_2()
            .iload_0()
            .if_icmpge("SUM_INIT") // if i >= size goto SUM_INIT
            .aload_1()           // push arr
            .iload_2()           // push index i
            .iload_2()
            .iconst_1()
            .iadd()              // i + 1
            .bipush(10)
            .imul()              // (i + 1) * 10
            .iastore()           // arr[i] = (i+1)*10
            .iinc(2, 1)          // i++
            .gotoLabel("INIT_LOOP")

            // Sum loop
            .label("SUM_INIT")
            .iconst_0()
            .istore_3()          // slot 3: sum = 0
            .iconst_0()
            .istore_2()          // reset i = 0
            .label("SUM_LOOP")
            .iload_2()
            .iload_0()
            .if_icmpge("DONE")
            .iload_3()           // push sum
            .aload_1()           // push arr
            .iload_2()           // push index i
            .iaload()            // arr[i]
            .iadd()              // sum + arr[i]
            .istore_3()          // store sum
            .iinc(2, 1)          // i++
            .gotoLabel("SUM_LOOP")

            .label("DONE")
            .iload_3()           // return sum
            .ireturn()
            .build();

        MethodArea.ClassInfo clazz = new MethodArea.ClassInfo("ArrayDemo", "java/lang/Object", cp);
        MethodArea.MethodInfo method = new MethodArea.MethodInfo(
            "ArrayDemo",
            "allocateAndSum",
            "(I)I",
            0x0009,
            5, // maxStack
            5, // maxLocals (0: size, 1: arr, 2: i, 3: sum)
            bytecode,
            cp
        );
        clazz.addMethod(method);
        methodArea.registerClass(clazz);
    }

    /**
     * Loads the Euclidean GCD program into the MethodArea.
     *   while (b != 0) {
     *     int temp = b;
     *     b = a % b;
     *     a = temp;
     *   }
     *   return a;
     */
    public static void loadGcdProgram(MethodArea methodArea) {
        ConstantPool cp = new ConstantPool();
        cp.addClassRef("GCD");

        byte[] bytecode = BytecodeBuilder.create()
            // slot 0: a, slot 1: b
            .label("LOOP")
            .iload_1()           // push b
            .ifeq("DONE")        // if b == 0 goto DONE
            .iload_0()           // push a
            .iload_1()           // push b
            .irem()              // a % b
            .istore_2()          // slot 2: temp = a % b
            .iload_1()           // push b
            .istore_0()          // a = b
            .iload_2()           // push temp
            .istore_1()          // b = temp
            .gotoLabel("LOOP")
            .label("DONE")
            .iload_0()           // return a
            .ireturn()
            .build();

        MethodArea.ClassInfo clazz = new MethodArea.ClassInfo("GCD", "java/lang/Object", cp);
        MethodArea.MethodInfo method = new MethodArea.MethodInfo(
            "GCD",
            "compute",
            "(II)I",
            0x0009,
            3,
            3, // 0: a, 1: b, 2: temp
            bytecode,
            cp
        );
        clazz.addMethod(method);
        methodArea.registerClass(clazz);
    }
}
