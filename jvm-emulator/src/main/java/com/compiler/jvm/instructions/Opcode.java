package com.compiler.jvm.instructions;

/**
 * Standard JVM Opcode enumerations with numeric bytecode values (0x00 - 0xFF).
 */
public enum Opcode {
    NOP(0x00, "nop", 0),
    ACONST_NULL(0x01, "aconst_null", 0),
    ICONST_M1(0x02, "iconst_m1", 0),
    ICONST_0(0x03, "iconst_0", 0),
    ICONST_1(0x04, "iconst_1", 0),
    ICONST_2(0x05, "iconst_2", 0),
    ICONST_3(0x06, "iconst_3", 0),
    ICONST_4(0x07, "iconst_4", 0),
    ICONST_5(0x08, "iconst_5", 0),

    BIPUSH(0x10, "bipush", 1),
    SIPUSH(0x11, "sipush", 2),
    LDC(0x12, "ldc", 1),

    ILOAD(0x15, "iload", 1),
    ALOAD(0x19, "aload", 1),

    ILOAD_0(0x1A, "iload_0", 0),
    ILOAD_1(0x1B, "iload_1", 0),
    ILOAD_2(0x1C, "iload_2", 0),
    ILOAD_3(0x1D, "iload_3", 0),

    ALOAD_0(0x2A, "aload_0", 0),
    ALOAD_1(0x2B, "aload_1", 0),
    ALOAD_2(0x2C, "aload_2", 0),
    ALOAD_3(0x2D, "aload_3", 0),

    IALOAD(0x2E, "iaload", 0),

    ISTORE(0x36, "istore", 1),
    ASTORE(0x3A, "astore", 1),

    ISTORE_0(0x3B, "istore_0", 0),
    ISTORE_1(0x3C, "istore_1", 0),
    ISTORE_2(0x3D, "istore_2", 0),
    ISTORE_3(0x3E, "istore_3", 0),

    ASTORE_0(0x4B, "astore_0", 0),
    ASTORE_1(0x4C, "astore_1", 0),
    ASTORE_2(0x4D, "astore_2", 0),
    ASTORE_3(0x4E, "astore_3", 0),

    IASTORE(0x4F, "iastore", 0),

    POP(0x57, "pop", 0),
    DUP(0x59, "dup", 0),
    SWAP(0x5F, "swap", 0),

    IADD(0x60, "iadd", 0),
    ISUB(0x64, "isub", 0),
    IMUL(0x68, "imul", 0),
    IDIV(0x6C, "idiv", 0),
    IREM(0x70, "irem", 0),
    INEG(0x74, "ineg", 0),

    IINC(0x84, "iinc", 2),

    IFEQ(0x99, "ifeq", 2),
    IFNE(0x9A, "ifne", 2),
    IFLT(0x9B, "iflt", 2),
    IFGE(0x9C, "ifge", 2),
    IFGT(0x9D, "ifgt", 2),
    IFLE(0x9E, "ifle", 2),

    IF_ICMPEQ(0x9F, "if_icmpeq", 2),
    IF_ICMPNE(0xA0, "if_icmpne", 2),
    IF_ICMPLT(0xA1, "if_icmplt", 2),
    IF_ICMPGE(0xA2, "if_icmpge", 2),
    IF_ICMPGT(0xA3, "if_icmpgt", 2),
    IF_ICMPLE(0xA4, "if_icmple", 2),

    GOTO(0xA7, "goto", 2),

    IRETURN(0xAC, "ireturn", 0),
    ARETURN(0xB0, "areturn", 0),
    RETURN(0xB1, "return", 0),

    INVOKESTATIC(0xB8, "invokestatic", 2),
    NEWARRAY(0xBC, "newarray", 1),
    ARRAYLENGTH(0xBE, "arraylength", 0);

    private final int code;
    private final String mnemonic;
    private final int operandBytes;

    Opcode(int code, String mnemonic, int operandBytes) {
        this.code = code;
        this.mnemonic = mnemonic;
        this.operandBytes = operandBytes;
    }

    public int getCode() {
        return code;
    }

    public String getMnemonic() {
        return mnemonic;
    }

    public int getOperandBytes() {
        return operandBytes;
    }

    private static final Opcode[] LOOKUP = new Opcode[256];

    static {
        for (Opcode op : values()) {
            LOOKUP[op.code] = op;
        }
    }

    public static Opcode fromByte(int code) {
        int masked = code & 0xFF;
        Opcode op = LOOKUP[masked];
        if (op == null) {
            throw new IllegalArgumentException(String.format("Unknown JVM opcode: 0x%02X (%d)", masked, masked));
        }
        return op;
    }
}
