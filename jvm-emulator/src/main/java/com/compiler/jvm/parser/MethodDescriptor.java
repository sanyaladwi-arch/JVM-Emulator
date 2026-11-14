package com.compiler.jvm.parser;

import com.compiler.jvm.memory.JvmType;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * JVM Method Descriptor parser parsing signatures like "(I)I", "(II)I", "(Ljava/lang/String;)V", "([I)I".
 */
public final class MethodDescriptor {
    private final String rawDescriptor;
    private final List<JvmType> parameterTypes;
    private final JvmType returnType;
    private final boolean isVoid;

    private MethodDescriptor(String raw, List<JvmType> params, JvmType returnType, boolean isVoid) {
        this.rawDescriptor = raw;
        this.parameterTypes = Collections.unmodifiableList(params);
        this.returnType = returnType;
        this.isVoid = isVoid;
    }

    public static MethodDescriptor parse(String descriptor) {
        if (!descriptor.startsWith("(")) {
            throw new IllegalArgumentException("Invalid method descriptor (must start with '('): " + descriptor);
        }

        int closeParen = descriptor.indexOf(')');
        if (closeParen == -1) {
            throw new IllegalArgumentException("Missing closing ')' in method descriptor: " + descriptor);
        }

        String paramsPart = descriptor.substring(1, closeParen);
        String returnPart = descriptor.substring(closeParen + 1);

        List<JvmType> params = new ArrayList<>();
        int i = 0;
        while (i < paramsPart.length()) {
            char c = paramsPart.charAt(i);
            if (c == 'I' || c == 'Z' || c == 'B' || c == 'C' || c == 'S') {
                params.add(JvmType.INT);
                i++;
            } else if (c == 'L') {
                params.add(JvmType.REFERENCE);
                int semi = paramsPart.indexOf(';', i);
                if (semi == -1) {
                    throw new IllegalArgumentException("Unterminated object descriptor in " + descriptor);
                }
                i = semi + 1;
            } else if (c == '[') {
                params.add(JvmType.REFERENCE);
                while (i < paramsPart.length() && paramsPart.charAt(i) == '[') {
                    i++;
                }
                if (i < paramsPart.length() && paramsPart.charAt(i) == 'L') {
                    int semi = paramsPart.indexOf(';', i);
                    i = (semi != -1) ? semi + 1 : paramsPart.length();
                } else {
                    i++;
                }
            } else {
                throw new IllegalArgumentException("Unsupported parameter type descriptor: " + c);
            }
        }

        JvmType retType;
        boolean voidRet = false;
        if (returnPart.equals("V")) {
            voidRet = true;
            retType = null;
        } else if (returnPart.startsWith("L") || returnPart.startsWith("[")) {
            retType = JvmType.REFERENCE;
        } else {
            retType = JvmType.INT;
        }

        return new MethodDescriptor(descriptor, params, retType, voidRet);
    }

    public String getRawDescriptor() {
        return rawDescriptor;
    }

    public List<JvmType> getParameterTypes() {
        return parameterTypes;
    }

    public int getParameterCount() {
        return parameterTypes.size();
    }

    public JvmType getReturnType() {
        return returnType;
    }

    public boolean isVoid() {
        return isVoid;
    }

    @Override
    public String toString() {
        return rawDescriptor;
    }
}
