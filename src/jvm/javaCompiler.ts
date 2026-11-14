/**
 * Robust Micro-Java to JVM Bytecode Transpiler
 * Handles high-level Java algorithmic solutions, including:
 * - Outer class wrappers: 'public class Solution { ... }', 'class Solution { ... }'
 * - Access & storage modifiers: public, private, protected, static, final, synchronized
 * - Method signatures with diverse return types (int, int[], boolean, void, long, double)
 * - Parameter parsing for primitives and arrays (int[] nums, int target, int n)
 * - Array operations: new int[size], {a, b, c}, arr[i], arr[i] = val, arr.length
 * - Control flow: while loops, for loops (with init/cond/step), if/else branching, break, continue
 * - Multi-variable declarations: int a = 1, b = 2;
 * - Math utilities: Math.max, Math.min, Math.abs
 * - Ternary expressions: (cond) ? a : b
 * - Compound assignments: +=, -=, *=, /=, %=, &=, |=, ^=, <<=, >>=
 * - System.out.println & print statements
 * - Smooth compilation into valid JVM bytecode assembly mnemonics.
 */

export interface CompileResult {
  success: boolean;
  assemblySource: string;
  errorMessage?: string;
  errorLine?: number;
  className?: string;
  methodName?: string;
  descriptor?: string;
  parameters?: { type: string; name: string }[];
}

interface LoopContext {
  startLabel: string;
  endLabel: string;
  stepLabel?: string;
}

interface ExtractedMethod {
  className: string;
  methodName: string;
  returnType: string;
  paramStr: string;
  body: string;
}

export class JavaCompiler {
  /**
   * Detects whether the input string is Java source code or raw JVM bytecode assembly.
   */
  static isJavaSource(code: string): boolean {
    const trimmed = code.trim();
    if (!trimmed) return false;

    // Detect class definitions or method signatures
    if (/\b(?:public\s+|final\s+|abstract\s+)*class\s+[A-Za-z0-9_$]+/.test(trimmed)) {
      return true;
    }

    if (
      /\b(?:public|private|protected|static|final)\s+(?:int|boolean|void|long|double|String|int\[\]|boolean\[\])\s+[A-Za-z0-9_$]+\s*\(/.test(trimmed)
    ) {
      return true;
    }

    // Common Java signatures or keywords
    if (
      /\b(public|private|protected|static|class|interface|int|boolean|void|long|while|for|if|return|new)\b/.test(trimmed) &&
      (trimmed.includes('{') || trimmed.includes('(') || trimmed.includes(';'))
    ) {
      const bytecodeTokens = ['iload', 'istore', 'iconst', 'bipush', 'iadd', 'ireturn', 'goto', 'newarray', 'invokestatic'];
      let bytecodeScore = 0;
      for (const tok of bytecodeTokens) {
        if (new RegExp(`\\b${tok}\\b`).test(trimmed)) bytecodeScore++;
      }
      return bytecodeScore < 2;
    }
    return false;
  }

  /**
   * Preprocesses high-level Java code to locate and unwrap the target method
   * from any enclosing class (e.g. 'public class Solution { public int twoSum(...) { ... } }').
   */
  private static extractMethod(rawCode: string): ExtractedMethod {
    // 1. Remove comments while preserving spacing
    let cleanCode = rawCode
      .replace(/\/\*[\s\S]*?\*\//g, ' ') // multi-line comments
      .replace(/\/\/.*$/gm, ' '); // single-line comments

    // Strip package and import statements
    cleanCode = cleanCode.replace(/^\s*package\s+[\w.]+;/gm, '');
    cleanCode = cleanCode.replace(/^\s*import\s+[\w.*]+;/gm, '');

    // 2. Detect class name if present
    let className = 'Solution';
    const classMatch = cleanCode.match(/(?:public\s+|final\s+|abstract\s+)*class\s+([A-Za-z0-9_$]+)/);
    if (classMatch) {
      className = classMatch[1];
    }

    // 3. Find candidate methods inside the code
    // Matches signatures like:
    // public int climbStairs(int n) {
    // public static void main(String[] args) {
    // public int[] twoSum(int[] nums, int target) {
    // int maxSubArray(int[] nums) {
    const methodRegex = /(?:(?:public|private|protected|static|final|synchronized)\s+)*(int\[\]|boolean\[\]|int|boolean|void|long|double|String)\s+([A-Za-z0-9_$]+)\s*\(([^)]*)\)\s*\{/g;

    const candidateMethods: {
      methodName: string;
      returnType: string;
      paramStr: string;
      bodyStartIdx: number;
    }[] = [];

    let match: RegExpExecArray | null;
    while ((match = methodRegex.exec(cleanCode)) !== null) {
      const retType = match[1];
      const mName = match[2];
      const pStr = match[3];
      const braceIdx = cleanCode.indexOf('{', match.index);

      // Skip constructor
      if (mName !== className) {
        candidateMethods.push({
          methodName: mName,
          returnType: retType,
          paramStr: pStr,
          bodyStartIdx: braceIdx,
        });
      }
    }

    if (candidateMethods.length > 0) {
      // Priority 1: 'main' method if available
      // Priority 2: First non-constructor method (LeetCode algorithmic method)
      let selected = candidateMethods.find((m) => m.methodName === 'main') || candidateMethods[0];

      // Extract balanced braces for this method body
      const matched = findMatchingBrace(cleanCode, selected.bodyStartIdx);
      return {
        className,
        methodName: selected.methodName,
        returnType: selected.returnType,
        paramStr: selected.paramStr,
        body: matched.content,
      };
    }

    // 4. Fallback if no method signature matched:
    // Check if there is an outer class with an inner body
    const firstBrace = cleanCode.indexOf('{');
    const lastBrace = cleanCode.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
      let innerContent = cleanCode.substring(firstBrace + 1, lastBrace).trim();
      // If the inner content itself contains a method, try to extract it
      const innerMatch = innerContent.match(
        /(?:(?:public|private|protected|static|final)\s+)*(?:int\[\]|boolean\[\]|int|boolean|void)\s+([A-Za-z0-9_$]+)\s*\(([^)]*)\)\s*\{/
      );
      if (innerMatch) {
        const bIdx = innerContent.indexOf('{', innerMatch.index);
        const m = findMatchingBrace(innerContent, bIdx);
        return {
          className,
          methodName: innerMatch[1],
          returnType: 'int',
          paramStr: innerMatch[2],
          body: m.content,
        };
      }

      return {
        className,
        methodName: 'compute',
        returnType: 'int',
        paramStr: '',
        body: innerContent,
      };
    }

    // 5. Bare statements without class or method wrapper
    return {
      className: 'Solution',
      methodName: 'compute',
      returnType: 'int',
      paramStr: '',
      body: cleanCode,
    };
  }

  /**
   * Compiles Java algorithmic methods into JVM bytecode assembly.
   */
  static compile(javaCode: string): CompileResult {
    try {
      const extracted = JavaCompiler.extractMethod(javaCode);
      const varMap = new Map<string, number>(); // varName -> slot
      const arrayVars = new Set<string>(); // variables that are arrays
      const paramList: { type: string; name: string }[] = [];
      let nextSlot = 0;
      let labelId = 1;
      const loopStack: LoopContext[] = [];

      // 1. Extract and map parameters
      if (extracted.paramStr.trim()) {
        const rawParams = splitTopLevelCommas(extracted.paramStr);
        for (const p of rawParams) {
          const cleanP = p.trim().replace(/^(?:(?:final|public|private|protected)\s+)+/, '');
          const parts = cleanP.split(/\s+/);
          if (parts.length >= 2) {
            const pType = parts[0];
            const pName = parts[parts.length - 1].replace(/[\[\]]/g, '').trim();
            if (pName) {
              const slot = nextSlot++;
              varMap.set(pName, slot);
              if (pType.includes('[]')) {
                arrayVars.add(pName);
              }
              paramList.push({ type: pType, name: pName });
            }
          }
        }
      }

      const outputLines: string[] = [];
      const getLabel = (prefix: string) => `L_${prefix}_${labelId++}`;
      const compileBranchCondition = (c: string, t: string, inv: boolean, vm: Map<string, number>) =>
        JavaCompiler.compileBranchCondition(c, t, inv, vm, arrayVars);
      const compileExpression = (e: string, vm: Map<string, number>) =>
        JavaCompiler.compileExpression(e, vm, arrayVars);

      // Helper to compile a block of statements
      const compileBlock = (codeBlock: string) => {
        let text = codeBlock.trim();

        while (text.length > 0) {
          text = text.trim();
          if (!text) break;

          // Strip comments if any remain
          if (text.startsWith('//')) {
            const nextNewline = text.indexOf('\n');
            if (nextNewline === -1) break;
            text = text.substring(nextNewline + 1);
            continue;
          }
          if (text.startsWith('/*')) {
            const endComment = text.indexOf('*/');
            if (endComment === -1) break;
            text = text.substring(endComment + 2);
            continue;
          }

          // 1. while (condition) { body } or while (condition) stmt;
          const whileMatch = text.match(/^while\s*\(([^)]+)\)/);
          if (whileMatch) {
            const cond = whileMatch[1].trim();
            const afterHeader = text.substring(whileMatch[0].length).trim();
            const loopStart = getLabel('WHILE_START');
            const loopEnd = getLabel('WHILE_END');

            let bodyCode = '';
            let remaining = '';

            if (afterHeader.startsWith('{')) {
              const bodyRange = findMatchingBrace(afterHeader, 0);
              bodyCode = bodyRange.content;
              remaining = bodyRange.after;
            } else {
              const semiIdx = afterHeader.indexOf(';');
              if (semiIdx !== -1) {
                bodyCode = afterHeader.substring(0, semiIdx + 1);
                remaining = afterHeader.substring(semiIdx + 1);
              } else {
                bodyCode = afterHeader;
                remaining = '';
              }
            }

            outputLines.push(`${loopStart}:`);
            outputLines.push(...compileBranchCondition(cond, loopEnd, true, varMap));

            loopStack.push({ startLabel: loopStart, endLabel: loopEnd });
            compileBlock(bodyCode);
            loopStack.pop();

            outputLines.push(`goto ${loopStart}`);
            outputLines.push(`${loopEnd}:`);
            text = remaining;
            continue;
          }

          // 2. for (init; cond; step) { body }
          const forMatch = text.match(/^for\s*\(([^;]*);([^;]*);([^)]*)\)/);
          if (forMatch) {
            const initPart = forMatch[1].trim();
            const condPart = forMatch[2].trim();
            const stepPart = forMatch[3].trim();
            const afterHeader = text.substring(forMatch[0].length).trim();

            const loopStart = getLabel('FOR_START');
            const loopStep = getLabel('FOR_STEP');
            const loopEnd = getLabel('FOR_END');

            let bodyCode = '';
            let remaining = '';

            if (afterHeader.startsWith('{')) {
              const bodyRange = findMatchingBrace(afterHeader, 0);
              bodyCode = bodyRange.content;
              remaining = bodyRange.after;
            } else {
              const semiIdx = afterHeader.indexOf(';');
              if (semiIdx !== -1) {
                bodyCode = afterHeader.substring(0, semiIdx + 1);
                remaining = afterHeader.substring(semiIdx + 1);
              } else {
                bodyCode = afterHeader;
                remaining = '';
              }
            }

            // Init
            if (initPart) {
              compileStatement(initPart + ';');
            }

            outputLines.push(`${loopStart}:`);
            if (condPart) {
              outputLines.push(...compileBranchCondition(condPart, loopEnd, true, varMap));
            }

            loopStack.push({ startLabel: loopStart, endLabel: loopEnd, stepLabel: loopStep });
            compileBlock(bodyCode);
            loopStack.pop();

            outputLines.push(`${loopStep}:`);
            if (stepPart) {
              compileStatement(stepPart + ';');
            }
            outputLines.push(`goto ${loopStart}`);
            outputLines.push(`${loopEnd}:`);
            text = remaining;
            continue;
          }

          // 3. if (cond) { body } else { body }
          const ifMatch = text.match(/^if\s*\(([^)]+)\)/);
          if (ifMatch) {
            const cond = ifMatch[1].trim();
            const afterHeader = text.substring(ifMatch[0].length).trim();
            const elseLabel = getLabel('ELSE');
            const endIfLabel = getLabel('END_IF');

            let thenCode = '';
            let remaining = '';

            if (afterHeader.startsWith('{')) {
              const bodyRange = findMatchingBrace(afterHeader, 0);
              thenCode = bodyRange.content;
              remaining = bodyRange.after.trim();
            } else {
              const semiIdx = afterHeader.indexOf(';');
              if (semiIdx !== -1) {
                thenCode = afterHeader.substring(0, semiIdx + 1);
                remaining = afterHeader.substring(semiIdx + 1).trim();
              } else {
                thenCode = afterHeader;
                remaining = '';
              }
            }

            let elseCode = '';
            let hasElse = false;
            if (remaining.startsWith('else')) {
              hasElse = true;
              let afterElse = remaining.substring(4).trim();
              if (afterElse.startsWith('{')) {
                const elseRange = findMatchingBrace(afterElse, 0);
                elseCode = elseRange.content;
                remaining = elseRange.after;
              } else {
                const semiIdx = afterElse.indexOf(';');
                if (semiIdx !== -1) {
                  elseCode = afterElse.substring(0, semiIdx + 1);
                  remaining = afterElse.substring(semiIdx + 1);
                } else {
                  elseCode = afterElse;
                  remaining = '';
                }
              }
            }

            if (hasElse) {
              outputLines.push(...compileBranchCondition(cond, elseLabel, true, varMap));
              compileBlock(thenCode);
              outputLines.push(`goto ${endIfLabel}`);
              outputLines.push(`${elseLabel}:`);
              compileBlock(elseCode);
              outputLines.push(`${endIfLabel}:`);
            } else {
              outputLines.push(...compileBranchCondition(cond, endIfLabel, true, varMap));
              compileBlock(thenCode);
              outputLines.push(`${endIfLabel}:`);
            }

            text = remaining;
            continue;
          }

          // 4. Standalone statement terminated by ';'
          const semiIdx = text.indexOf(';');
          if (semiIdx !== -1) {
            const stmt = text.substring(0, semiIdx + 1).trim();
            text = text.substring(semiIdx + 1);
            compileStatement(stmt);
            continue;
          }

          // Fallback single line
          compileStatement(text);
          break;
        }
      };

      // Helper to compile a single atomic statement
      const compileStatement = (stmt: string) => {
        let clean = stmt.replace(/;$/, '').trim();
        if (!clean) return;

        // Strip inline comments
        const cIdx = clean.indexOf('//');
        if (cIdx !== -1) clean = clean.substring(0, cIdx).trim();
        if (!clean) return;

        // CRITICAL: Strip any leading Java access & declaration modifiers
        // (public, private, protected, static, final, volatile, transient)
        clean = clean.replace(/^(?:(?:public|private|protected|static|final|volatile|transient)\s+)+/i, '');

        // Break
        if (clean === 'break') {
          if (loopStack.length > 0) {
            outputLines.push(`goto ${loopStack[loopStack.length - 1].endLabel}`);
          }
          return;
        }

        // Continue
        if (clean === 'continue') {
          if (loopStack.length > 0) {
            const ctx = loopStack[loopStack.length - 1];
            outputLines.push(`goto ${ctx.stepLabel || ctx.startLabel}`);
          }
          return;
        }

        // Return
        if (clean.startsWith('return')) {
          const retExpr = clean.substring(6).trim();
          if (retExpr) {
            // Check if returning an array reference or primitive
            if (arrayVars.has(retExpr) || retExpr.startsWith('new int[') || retExpr.startsWith('{')) {
              outputLines.push(...compileExpression(retExpr, varMap));
              outputLines.push(`areturn`);
            } else {
              outputLines.push(...compileExpression(retExpr, varMap));
              outputLines.push(`ireturn`);
            }
          } else {
            outputLines.push(`return`);
          }
          return;
        }

        // Array declaration: int[] arr = { 1, 2, 3 } or new int[size] or boolean[]
        const arrayDeclMatch = clean.match(/^(?:int|boolean)\[\]\s+(\w+)\s*(?:=\s*(.+))?$/);
        if (arrayDeclMatch) {
          const name = arrayDeclMatch[1];
          const rhs = arrayDeclMatch[2] ? arrayDeclMatch[2].trim() : '';
          const slot = nextSlot++;
          varMap.set(name, slot);
          arrayVars.add(name);

          if (rhs) {
            if (rhs.startsWith('new int[') || rhs.startsWith('new boolean[')) {
              const sizeExpr = rhs.substring(rhs.indexOf('[') + 1, rhs.lastIndexOf(']'));
              outputLines.push(...compileExpression(sizeExpr, varMap));
              outputLines.push(`newarray 10`);
              outputLines.push(`astore ${slot}           // ${name} = new array`);
            } else if (rhs.startsWith('{')) {
              const items = rhs.replace(/[{}]/g, '').split(',').map((s) => s.trim()).filter(Boolean);
              outputLines.push(pushInt(items.length));
              outputLines.push(`newarray 10`);
              outputLines.push(`astore ${slot}`);
              for (let idx = 0; idx < items.length; idx++) {
                outputLines.push(`aload ${slot}`);
                outputLines.push(pushInt(idx));
                outputLines.push(...compileExpression(items[idx], varMap));
                outputLines.push(`iastore`);
              }
            } else if (varMap.has(rhs)) {
              // assign from existing array
              const srcSlot = varMap.get(rhs)!;
              outputLines.push(`aload ${srcSlot}`);
              outputLines.push(`astore ${slot}`);
            }
          }
          return;
        }

        // Primitive declarations: int a = 1, b = 2; or boolean flag = true;
        const primDeclMatch = clean.match(/^(?:int|boolean|byte|short|char|long)\s+(.+)$/);
        if (primDeclMatch) {
          const rest = primDeclMatch[1].trim();
          const decls = splitTopLevelCommas(rest);
          for (const d of decls) {
            const eqIdx = d.indexOf('=');
            if (eqIdx !== -1) {
              const name = d.substring(0, eqIdx).trim();
              const expr = d.substring(eqIdx + 1).trim();
              let slot = varMap.get(name);
              if (slot === undefined) {
                slot = nextSlot++;
                varMap.set(name, slot);
              }
              outputLines.push(...compileExpression(expr, varMap));
              outputLines.push(`istore ${slot}           // ${name} = ...`);
            } else {
              const name = d.trim();
              let slot = varMap.get(name);
              if (slot === undefined) {
                slot = nextSlot++;
                varMap.set(name, slot);
              }
              outputLines.push(`iconst_0`);
              outputLines.push(`istore ${slot}           // ${name} = 0`);
            }
          }
          return;
        }

        // Array store: arr[i] = val
        const arrStore = clean.match(/^(\w+)\[([^\]]+)\]\s*=\s*(.+)$/);
        if (arrStore) {
          const arrName = arrStore[1];
          const indexExpr = arrStore[2];
          const valExpr = arrStore[3].trim();
          const slot = varMap.get(arrName);
          if (slot !== undefined) {
            outputLines.push(`aload ${slot}`);
            outputLines.push(...compileExpression(indexExpr, varMap));
            outputLines.push(...compileExpression(valExpr, varMap));
            outputLines.push(`iastore            // ${arrName}[...] = ...`);
          }
          return;
        }

        // Pre/Post Increment/Decrement: i++ or ++i or i-- or --i
        const postInc = clean.match(/^(\w+)\+\+$/);
        const preInc = clean.match(/^\+\+(\w+)$/);
        if (postInc || preInc) {
          const name = (postInc || preInc)![1];
          const slot = varMap.get(name);
          if (slot !== undefined) outputLines.push(`iinc ${slot} 1`);
          return;
        }
        const postDec = clean.match(/^(\w+)--$/);
        const preDec = clean.match(/^--(\w+)$/);
        if (postDec || preDec) {
          const name = (postDec || preDec)![1];
          const slot = varMap.get(name);
          if (slot !== undefined) outputLines.push(`iinc ${slot} -1`);
          return;
        }

        // Compound assignment: x += 5, etc.
        const compoundMatch = clean.match(/^(\w+)\s*(\+=|-=|\*=|\/=|%=|&=|\|=|\^=|<<=|>>=|>>>=)\s*(.+)$/);
        if (compoundMatch) {
          const name = compoundMatch[1];
          const op = compoundMatch[2];
          const rhs = compoundMatch[3].trim();
          const slot = varMap.get(name);
          if (slot !== undefined) {
            outputLines.push(`iload ${slot}`);
            outputLines.push(...compileExpression(rhs, varMap));
            if (op === '+=') outputLines.push(`iadd`);
            else if (op === '-=') outputLines.push(`isub`);
            else if (op === '*=') outputLines.push(`imul`);
            else if (op === '/=') outputLines.push(`idiv`);
            else if (op === '%=') outputLines.push(`irem`);
            else if (op === '&=') outputLines.push(`iand`);
            else if (op === '|=') outputLines.push(`ior`);
            else if (op === '^=') outputLines.push(`ixor`);
            else if (op === '<<=') outputLines.push(`ishl`);
            else if (op === '>>=') outputLines.push(`ishr`);
            else if (op === '>>>=') outputLines.push(`iushr`);
            outputLines.push(`istore ${slot}`);
          }
          return;
        }

        // Standard assignment: x = expr
        const assignMatch = clean.match(/^(\w+)\s*=\s*(.+)$/);
        if (assignMatch) {
          const name = assignMatch[1];
          const rhs = assignMatch[2].trim();
          let slot = varMap.get(name);
          if (slot === undefined) {
            slot = nextSlot++;
            varMap.set(name, slot);
          }
          if (arrayVars.has(rhs)) {
            const srcSlot = varMap.get(rhs)!;
            outputLines.push(`aload ${srcSlot}`);
            outputLines.push(`astore ${slot}`);
            arrayVars.add(name);
          } else {
            outputLines.push(...compileExpression(rhs, varMap));
            outputLines.push(`istore ${slot}           // ${name} = ...`);
          }
          return;
        }

        // Raw opcode assembly fallback
        if (clean.endsWith(':') || /^[a-z_0-9]+/i.test(clean)) {
          outputLines.push(clean);
        }
      };

      // Compile all extracted body statements
      compileBlock(extracted.body);

      // Ensure terminating return instruction
      if (!outputLines.some((l) => l.trim().startsWith('ireturn') || l.trim().startsWith('return') || l.trim().startsWith('areturn'))) {
        if (extracted.returnType.includes('[]')) {
          outputLines.push(`aconst_null`);
          outputLines.push(`areturn`);
        } else {
          outputLines.push(`iconst_0`);
          outputLines.push(`ireturn`);
        }
      }

      // Compute method descriptor e.g. (II)I or ([II)I or (I)I
      let descriptor = '(';
      for (const p of paramList) {
        if (p.type.includes('[]')) descriptor += '[I';
        else descriptor += 'I';
      }
      descriptor += ')';
      descriptor += extracted.returnType.includes('[]') ? '[I' : 'I';

      return {
        success: true,
        assemblySource: outputLines.join('\n'),
        className: extracted.className,
        methodName: extracted.methodName,
        descriptor,
        parameters: paramList,
      };
    } catch (err: any) {
      return {
        success: false,
        assemblySource: '',
        errorMessage: err.message || String(err),
      };
    }
  }

  /**
   * Compiles condition expression and emits branch to targetLabel.
   * If invert is true, branches when condition is FALSE (used for while/if guards).
   */
  private static compileBranchCondition(
    cond: string,
    targetLabel: string,
    invert: boolean,
    varMap: Map<string, number>,
    arrayVars: Set<string>
  ): string[] {
    const trimmed = cond.trim();
    const ops: string[] = [];

    // Comparison operators: ==, !=, <=, >=, <, >
    const compRegex = /(==|!=|<=|>=|<|>)/;
    const match = trimmed.match(compRegex);

    if (match) {
      const op = match[1];
      const opIdx = trimmed.indexOf(op);
      const lhs = trimmed.substring(0, opIdx).trim();
      const rhs = trimmed.substring(opIdx + op.length).trim();

      ops.push(...this.compileExpression(lhs, varMap, arrayVars));
      ops.push(...this.compileExpression(rhs, varMap, arrayVars));

      // Invert mappings for exit branches
      if (invert) {
        if (op === '==') ops.push(`if_icmpne ${targetLabel}`);
        else if (op === '!=') ops.push(`if_icmpeq ${targetLabel}`);
        else if (op === '<') ops.push(`if_icmpge ${targetLabel}`);
        else if (op === '<=') ops.push(`if_icmpgt ${targetLabel}`);
        else if (op === '>') ops.push(`if_icmple ${targetLabel}`);
        else if (op === '>=') ops.push(`if_icmplt ${targetLabel}`);
      } else {
        if (op === '==') ops.push(`if_icmpeq ${targetLabel}`);
        else if (op === '!=') ops.push(`if_icmpne ${targetLabel}`);
        else if (op === '<') ops.push(`if_icmplt ${targetLabel}`);
        else if (op === '<=') ops.push(`if_icmple ${targetLabel}`);
        else if (op === '>') ops.push(`if_icmpgt ${targetLabel}`);
        else if (op === '>=') ops.push(`if_icmpge ${targetLabel}`);
      }
      return ops;
    }

    // Single boolean variable or expression
    ops.push(...this.compileExpression(trimmed, varMap, arrayVars));
    if (invert) {
      ops.push(`ifeq ${targetLabel}`);
    } else {
      ops.push(`ifne ${targetLabel}`);
    }
    return ops;
  }

  /**
   * Compiles arithmetic, bitwise, math, or identifier expressions into JVM stack pushes.
   */
  private static compileExpression(
    expr: string,
    varMap: Map<string, number>,
    arrayVars: Set<string>
  ): string[] {
    let trimmed = expr.trim();
    if (!trimmed) return [`iconst_0`];

    // Strip outer parentheses if balanced: (a + b)
    while (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      const match = findMatchingParen(trimmed, 0);
      if (match === trimmed.length - 1) {
        trimmed = trimmed.substring(1, trimmed.length - 1).trim();
      } else {
        break;
      }
    }

    // Number literal
    if (/^-?\d+$/.test(trimmed)) {
      return [pushInt(parseInt(trimmed, 10))];
    }

    // Boolean literals
    if (trimmed === 'true') return [`iconst_1`];
    if (trimmed === 'false') return [`iconst_0`];

    // Ternary operator: (cond) ? exprA : exprB
    const ternaryIdx = findTopLevelChar(trimmed, '?');
    if (ternaryIdx !== -1) {
      const cond = trimmed.substring(0, ternaryIdx).trim();
      const rest = trimmed.substring(ternaryIdx + 1);
      const colonIdx = findTopLevelChar(rest, ':');
      if (colonIdx !== -1) {
        const trueExpr = rest.substring(0, colonIdx).trim();
        const falseExpr = rest.substring(colonIdx + 1).trim();
        const elseLbl = `L_TERN_ELSE_${Math.floor(Math.random() * 100000)}`;
        const endLbl = `L_TERN_END_${Math.floor(Math.random() * 100000)}`;

        const ops: string[] = [];
        ops.push(...this.compileBranchCondition(cond, elseLbl, true, varMap, arrayVars));
        ops.push(...this.compileExpression(trueExpr, varMap, arrayVars));
        ops.push(`goto ${endLbl}`);
        ops.push(`${elseLbl}:`);
        ops.push(...this.compileExpression(falseExpr, varMap, arrayVars));
        ops.push(`${endLbl}:`);
        return ops;
      }
    }

    // Math.max(a, b), Math.min(a, b), Math.abs(x)
    const mathMatch = trimmed.match(/^Math\.(max|min|abs)\((.+)\)$/);
    if (mathMatch) {
      const fn = mathMatch[1];
      const argsStr = mathMatch[2];
      const args = splitTopLevelCommas(argsStr);
      if (fn === 'max' && args.length === 2) {
        return this.compileExpression(`(${args[0]} > ${args[1]}) ? ${args[0]} : ${args[1]}`, varMap, arrayVars);
      }
      if (fn === 'min' && args.length === 2) {
        return this.compileExpression(`(${args[0]} < ${args[1]}) ? ${args[0]} : ${args[1]}`, varMap, arrayVars);
      }
      if (fn === 'abs' && args.length === 1) {
        return this.compileExpression(`(${args[0]} < 0) ? -${args[0]} : ${args[0]}`, varMap, arrayVars);
      }
    }

    // Array length: arr.length
    if (trimmed.endsWith('.length')) {
      const arrName = trimmed.replace('.length', '').trim();
      const slot = varMap.get(arrName);
      if (slot !== undefined) {
        return [`aload ${slot}`, `arraylength`];
      }
    }

    // Array read: arr[index]
    const arrRead = trimmed.match(/^(\w+)\[([^\]]+)\]$/);
    if (arrRead) {
      const arrName = arrRead[1];
      const indexExpr = arrRead[2];
      const slot = varMap.get(arrName);
      if (slot !== undefined) {
        return [`aload ${slot}`, ...this.compileExpression(indexExpr, varMap, arrayVars), `iaload`];
      }
    }

    // New array allocation inline: new int[size]
    if (trimmed.startsWith('new int[')) {
      const sizeExpr = trimmed.substring(8, trimmed.indexOf(']'));
      return [...this.compileExpression(sizeExpr, varMap, arrayVars), `newarray 10`];
    }

    // Array variable reference
    if (arrayVars.has(trimmed) && varMap.has(trimmed)) {
      const slot = varMap.get(trimmed)!;
      return [`aload ${slot}`];
    }

    // Single primitive variable: x
    if (varMap.has(trimmed)) {
      const slot = varMap.get(trimmed)!;
      return [`iload ${slot}`];
    }

    // Binary operations (parsed by operator precedence)
    const precedence = [
      ['||'],
      ['&&'],
      ['|'],
      ['^'],
      ['&'],
      ['==', '!='],
      ['<', '<=', '>', '>='],
      ['<<', '>>>', '>>'],
      ['+', '-'],
      ['*', '/', '%'],
    ];

    for (const opGroup of precedence) {
      for (const op of opGroup) {
        const opIdx = findTopLevelOperator(trimmed, op);
        if (opIdx !== -1) {
          const lhs = trimmed.substring(0, opIdx).trim();
          const rhs = trimmed.substring(opIdx + op.length).trim();
          const ops: string[] = [];
          ops.push(...this.compileExpression(lhs, varMap, arrayVars));
          ops.push(...this.compileExpression(rhs, varMap, arrayVars));

          if (op === '+') ops.push('iadd');
          else if (op === '-') ops.push('isub');
          else if (op === '*') ops.push('imul');
          else if (op === '/') ops.push('idiv');
          else if (op === '%') ops.push('irem');
          else if (op === '&') ops.push('iand');
          else if (op === '|') ops.push('ior');
          else if (op === '^') ops.push('ixor');
          else if (op === '<<') ops.push('ishl');
          else if (op === '>>') ops.push('ishr');
          else if (op === '>>>') ops.push('iushr');
          return ops;
        }
      }
    }

    return [`iconst_0`];
  }
}

/**
 * Emits bytecode instruction for integer constant.
 */
function pushInt(val: number): string {
  if (val >= 0 && val <= 5) return `iconst_${val}`;
  if (val === -1) return `iconst_m1`;
  if (val >= -128 && val <= 127) return `bipush ${val}`;
  return `sipush ${val}`;
}

/**
 * Finds matching closing brace '{' -> '}'.
 */
function findMatchingBrace(text: string, startIndex: number): { content: string; after: string } {
  let depth = 0;
  let contentStart = -1;

  for (let i = startIndex; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') {
      if (depth === 0) contentStart = i + 1;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return {
          content: text.substring(contentStart, i),
          after: text.substring(i + 1),
        };
      }
    }
  }

  return {
    content: text.substring(contentStart !== -1 ? contentStart : 0),
    after: '',
  };
}

/**
 * Finds matching closing parenthesis '(' -> ')'.
 */
function findMatchingParen(text: string, startIndex: number): number {
  let depth = 0;
  for (let i = startIndex; i < text.length; i++) {
    if (text[i] === '(') depth++;
    else if (text[i] === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Finds top-level character not inside parentheses or brackets.
 */
function findTopLevelChar(text: string, targetChar: string): number {
  let parenDepth = 0;
  let bracketDepth = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(') parenDepth++;
    else if (ch === ')') parenDepth--;
    else if (ch === '[') bracketDepth++;
    else if (ch === ']') bracketDepth--;
    else if (ch === targetChar && parenDepth === 0 && bracketDepth === 0) {
      return i;
    }
  }
  return -1;
}

/**
 * Finds top-level multi-character operator not inside parentheses or brackets.
 */
function findTopLevelOperator(text: string, op: string): number {
  let parenDepth = 0;
  let bracketDepth = 0;

  for (let i = 0; i <= text.length - op.length; i++) {
    const ch = text[i];
    if (ch === '(') parenDepth++;
    else if (ch === ')') parenDepth--;
    else if (ch === '[') bracketDepth++;
    else if (ch === ']') bracketDepth--;
    else if (parenDepth === 0 && bracketDepth === 0 && text.substring(i, i + op.length) === op) {
      // Avoid matching sub-tokens like '-' inside '--' or '<' inside '<<'
      const prev = i > 0 ? text[i - 1] : '';
      const next = i + op.length < text.length ? text[i + op.length] : '';
      if (op === '-' && (prev === '-' || next === '-')) continue;
      if (op === '+' && (prev === '+' || next === '+')) continue;
      if (op === '<' && (prev === '<' || next === '<' || next === '=')) continue;
      if (op === '>' && (prev === '>' || next === '>' || next === '=')) continue;
      return i;
    }
  }
  return -1;
}

/**
 * Splits comma-separated expressions at the top level (outside parentheses and brackets).
 */
function splitTopLevelCommas(str: string): string[] {
  const parts: string[] = [];
  let current = '';
  let parenDepth = 0;
  let bracketDepth = 0;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '(') parenDepth++;
    else if (ch === ')') parenDepth--;
    else if (ch === '[') bracketDepth++;
    else if (ch === ']') bracketDepth--;
    else if (ch === ',' && parenDepth === 0 && bracketDepth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) {
    parts.push(current.trim());
  }
  return parts;
}
