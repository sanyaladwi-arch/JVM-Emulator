package com.compiler.jvm;

import com.compiler.jvm.instructions.Instruction;
import com.compiler.jvm.instructions.Opcode;
import com.compiler.jvm.parser.BytecodeParser;
import com.compiler.jvm.parser.ClassFileReader;
import com.compiler.jvm.parser.MethodDescriptor;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Bytecode Parser, Hex Reader & Method Descriptor Tests")
class BytecodeParserTest {

    @Test
    @DisplayName("MethodDescriptor parses parameters and return types")
    void testMethodDescriptor() {
        MethodDescriptor md1 = MethodDescriptor.parse("(I)I");
        assertEquals(1, md1.getParameterCount());
        assertFalse(md1.isVoid());

        MethodDescriptor md2 = MethodDescriptor.parse("(II)V");
        assertEquals(2, md2.getParameterCount());
        assertTrue(md2.isVoid());

        MethodDescriptor md3 = MethodDescriptor.parse("([I)I");
        assertEquals(1, md3.getParameterCount());
    }

    @Test
    @DisplayName("ClassFileReader parses hex bytecode string")
    void testHexParser() {
        byte[] bytes = ClassFileReader.parseHexBytes("03 3B 10 0A 60 AC");
        assertEquals(6, bytes.length);
        assertEquals((byte) 0x03, bytes[0]); // iconst_0
        assertEquals((byte) 0x3B, bytes[1]); // istore_0
        assertEquals((byte) 0x10, bytes[2]); // bipush
        assertEquals((byte) 0x0A, bytes[3]); // 10
        assertEquals((byte) 0x60, bytes[4]); // iadd
        assertEquals((byte) 0xAC, bytes[5]); // ireturn
    }

    @Test
    @DisplayName("BytecodeParser disassembles raw opcodes into IR instructions")
    void testDisassembly() {
        byte[] code = new byte[]{
            (byte) 0x04,       // iconst_1
            (byte) 0x3C,       // istore_1
            (byte) 0x1B,       // iload_1
            (byte) 0x10, 0x05, // bipush 5
            (byte) 0x60,       // iadd
            (byte) 0xAC        // ireturn
        };

        List<Instruction> instructions = BytecodeParser.parse(code);
        assertEquals(6, instructions.size());
        assertEquals(Opcode.ICONST_1, instructions.get(0).getOpcode());
        assertEquals(Opcode.ISTORE_1, instructions.get(1).getOpcode());
        assertEquals(Opcode.ILOAD_1, instructions.get(2).getOpcode());
        assertEquals(Opcode.BIPUSH, instructions.get(3).getOpcode());
        assertEquals(5, instructions.get(3).getOperand(0));
        assertEquals(Opcode.IADD, instructions.get(4).getOpcode());
        assertEquals(Opcode.IRETURN, instructions.get(5).getOpcode());
    }
}
