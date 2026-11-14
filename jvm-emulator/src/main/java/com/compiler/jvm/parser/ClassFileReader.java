package com.compiler.jvm.parser;

import com.compiler.jvm.memory.ConstantPool;
import com.compiler.jvm.memory.MethodArea;

import java.io.ByteArrayInputStream;
import java.io.DataInputStream;
import java.io.IOException;

/**
 * Binary and Hex Class File reader capable of parsing class metadata, constant pool,
 * method headers, and raw bytecode payloads into executable MethodArea representations.
 */
public final class ClassFileReader {
    public static final int MAGIC = 0xCAFEBABE;

    /**
     * Parses a hex-encoded bytecode stream into a byte array.
     */
    public static byte[] parseHexBytes(String hex) {
        String clean = hex.replaceAll("[\\s,;]", "");
        if (clean.length() % 2 != 0) {
            throw new IllegalArgumentException("Hex string must have an even number of characters: " + hex);
        }
        byte[] bytes = new byte[clean.length() / 2];
        for (int i = 0; i < clean.length(); i += 2) {
            bytes[i / 2] = (byte) Integer.parseInt(clean.substring(i, i + 2), 16);
        }
        return bytes;
    }

    /**
     * Reads a binary class stream compliant with the JVM class file specification subset.
     */
    public static MethodArea.ClassInfo readClass(byte[] rawData) throws IOException {
        try (DataInputStream in = new DataInputStream(new ByteArrayInputStream(rawData))) {
            int magic = in.readInt();
            if (magic != MAGIC) {
                throw new IOException(String.format("Invalid class file magic header: 0x%08X (expected 0xCAFEBABE)", magic));
            }

            int minor = in.readUnsignedShort();
            int major = in.readUnsignedShort();

            // Constant Pool
            int cpCount = in.readUnsignedShort();
            ConstantPool cp = new ConstantPool();

            // Read constant pool entries
            for (int i = 1; i < cpCount; i++) {
                int tag = in.readUnsignedByte();
                switch (tag) {
                    case 1: // UTF8
                        String str = in.readUTF();
                        cp.addUtf8(str);
                        break;
                    case 3: // Integer
                        int intVal = in.readInt();
                        cp.addInteger(intVal);
                        break;
                    case 7: // ClassRef
                        int nameIdx = in.readUnsignedShort();
                        cp.addClassRef("Class#" + nameIdx);
                        break;
                    case 8: // StringRef
                        int strIdx = in.readUnsignedShort();
                        cp.addString("String#" + strIdx);
                        break;
                    case 10: // MethodRef
                        int classIdx = in.readUnsignedShort();
                        int nameAndTypeIdx = in.readUnsignedShort();
                        cp.addMethodRef("Class#" + classIdx, "Method#" + nameAndTypeIdx, "()V");
                        break;
                    default:
                        // Skip or throw
                        break;
                }
            }

            int accessFlags = in.readUnsignedShort();
            int thisClassIdx = in.readUnsignedShort();
            int superClassIdx = in.readUnsignedShort();

            String className = "Class" + thisClassIdx;
            String superClassName = "java/lang/Object";

            MethodArea.ClassInfo classInfo = new MethodArea.ClassInfo(className, superClassName, cp);

            // Interfaces
            int interfacesCount = in.readUnsignedShort();
            for (int i = 0; i < interfacesCount; i++) {
                in.readUnsignedShort();
            }

            // Fields
            int fieldsCount = in.readUnsignedShort();
            for (int i = 0; i < fieldsCount; i++) {
                in.readUnsignedShort(); // access
                in.readUnsignedShort(); // name
                in.readUnsignedShort(); // descriptor
                int attrCount = in.readUnsignedShort();
                for (int a = 0; a < attrCount; a++) {
                    in.readUnsignedShort();
                    int len = in.readInt();
                    in.skipBytes(len);
                }
            }

            // Methods
            int methodsCount = in.readUnsignedShort();
            for (int i = 0; i < methodsCount; i++) {
                int mAccess = in.readUnsignedShort();
                int mNameIdx = in.readUnsignedShort();
                int mDescIdx = in.readUnsignedShort();
                int mAttrCount = in.readUnsignedShort();

                int maxStack = 8;
                int maxLocals = 8;
                byte[] code = new byte[0];

                for (int a = 0; a < mAttrCount; a++) {
                    int attrNameIdx = in.readUnsignedShort();
                    int attrLen = in.readInt();
                    maxStack = in.readUnsignedShort();
                    maxLocals = in.readUnsignedShort();
                    int codeLen = in.readInt();
                    code = new byte[codeLen];
                    in.readFully(code);

                    // Exception table & sub attributes
                    int exTableLen = in.readUnsignedShort();
                    in.skipBytes(exTableLen * 8);
                    int subAttrCount = in.readUnsignedShort();
                    for (int sa = 0; sa < subAttrCount; sa++) {
                        in.readUnsignedShort();
                        int saLen = in.readInt();
                        in.skipBytes(saLen);
                    }
                }

                MethodArea.MethodInfo method = new MethodArea.MethodInfo(
                    className,
                    "method" + mNameIdx,
                    "()I",
                    mAccess,
                    maxStack,
                    maxLocals,
                    code,
                    cp
                );
                classInfo.addMethod(method);
            }

            return classInfo;
        }
    }
}
