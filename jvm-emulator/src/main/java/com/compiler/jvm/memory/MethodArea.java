package com.compiler.jvm.memory;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * JVM Method Area storing class structures, method bytecode, field descriptors,
 * and runtime constant pools. Shared across threads.
 */
public final class MethodArea {
    public static final class MethodInfo {
        private final String className;
        private final String methodName;
        private final String descriptor;
        private final int accessFlags;
        private final int maxStack;
        private final int maxLocals;
        private final byte[] bytecode;
        private final ConstantPool constantPool;

        public MethodInfo(String className,
                          String methodName,
                          String descriptor,
                          int accessFlags,
                          int maxStack,
                          int maxLocals,
                          byte[] bytecode,
                          ConstantPool constantPool) {
            this.className = className;
            this.methodName = methodName;
            this.descriptor = descriptor;
            this.accessFlags = accessFlags;
            this.maxStack = maxStack;
            this.maxLocals = maxLocals;
            this.bytecode = bytecode;
            this.constantPool = constantPool;
        }

        public String getClassName() {
            return className;
        }

        public String getMethodName() {
            return methodName;
        }

        public String getDescriptor() {
            return descriptor;
        }

        public int getAccessFlags() {
            return accessFlags;
        }

        public int getMaxStack() {
            return maxStack;
        }

        public int getMaxLocals() {
            return maxLocals;
        }

        public byte[] getBytecode() {
            return bytecode;
        }

        public ConstantPool getConstantPool() {
            return constantPool;
        }

        public String getKey() {
            return className + "." + methodName + descriptor;
        }

        @Override
        public String toString() {
            return getKey() + " [stack=" + maxStack + ", locals=" + maxLocals + ", bytes=" + bytecode.length + "]";
        }
    }

    public static final class ClassInfo {
        private final String className;
        private final String superClassName;
        private final ConstantPool constantPool;
        private final Map<String, MethodInfo> methods = new HashMap<>();

        public ClassInfo(String className, String superClassName, ConstantPool constantPool) {
            this.className = className;
            this.superClassName = superClassName;
            this.constantPool = constantPool;
        }

        public String getClassName() {
            return className;
        }

        public String getSuperClassName() {
            return superClassName;
        }

        public ConstantPool getConstantPool() {
            return constantPool;
        }

        public void addMethod(MethodInfo method) {
            methods.put(method.getMethodName() + method.getDescriptor(), method);
        }

        public MethodInfo getMethod(String methodName, String descriptor) {
            return methods.get(methodName + descriptor);
        }

        public Map<String, MethodInfo> getMethods() {
            return Collections.unmodifiableMap(methods);
        }
    }

    private final Map<String, ClassInfo> classes = new HashMap<>();

    public synchronized void registerClass(ClassInfo classInfo) {
        classes.put(classInfo.getClassName(), classInfo);
    }

    public synchronized ClassInfo getClass(String className) {
        ClassInfo info = classes.get(className);
        if (info == null) {
            throw new ClassNotFoundException("Class not found in MethodArea: " + className);
        }
        return info;
    }

    public synchronized MethodInfo resolveMethod(String className, String methodName, String descriptor) {
        ClassInfo clazz = getClass(className);
        MethodInfo method = clazz.getMethod(methodName, descriptor);
        if (method == null) {
            throw new NoSuchMethodError("Method not found: " + className + "." + methodName + descriptor);
        }
        return method;
    }

    public synchronized Map<String, ClassInfo> getClasses() {
        return Collections.unmodifiableMap(classes);
    }

    public synchronized void clear() {
        classes.clear();
    }

    public static class ClassNotFoundException extends RuntimeException {
        public ClassNotFoundException(String message) {
            super(message);
        }
    }
}
