import { parse, compile, Node } from 'mathjs';
import { MathObject, EvaluationContext } from '@/types/math-studio';

// 1. Ekstrak Semua Simbol/Variabel dari Ekspresi (AST Traversal)
export function extractSymbols(rawExpr: string): {
  symbols: string[];
  isFunction: boolean;
  funcName?: string;
  funcArgs?: string[];
  cleanBody: string;
} {
  try {
    let cleanExpr = rawExpr.trim();
    let funcName: string | undefined;
    let funcArgs: string[] = [];
    let isFunction = false;

    // Cek apakah berupa definisi fungsi, contoh: f(x) = x^2 + a
    if (cleanExpr.includes('=')) {
      const parts = cleanExpr.split('=');
      const lhs = parts[0].trim();
      cleanExpr = parts[1].trim();

      const funcMatch = lhs.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\(([^)]+)\)$/);
      if (funcMatch) {
        isFunction = true;
        funcName = funcMatch[1];
        funcArgs = funcMatch[2].split(',').map((s) => s.trim());
      }
    }

    const node: Node = parse(cleanExpr);
    const symbolsSet = new Set<string>();

    node.traverse((n: any) => {
      if (n.isSymbolNode) {
        // Abaikan nama fungsi bawaan matematika seperti sin, cos, tan, sqrt, pi, e
        const reserved = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'log', 'exp', 'pi', 'e', 'abs'];
        if (!reserved.includes(n.name) && !funcArgs.includes(n.name)) {
          symbolsSet.add(n.name);
        }
      }
    });

    return {
      symbols: Array.from(symbolsSet),
      isFunction,
      funcName,
      funcArgs,
      cleanBody: cleanExpr,
    };
  } catch (err) {
    return {
      symbols: [],
      isFunction: false,
      cleanBody: rawExpr,
    };
  }
}

// 2. Evaluasi Nilai Ekspresi atau Fungsi pada Titik x
export function evaluateMathObject(
  obj: MathObject,
  contextScope: Record<string, number>,
  xValue?: number
): number | null {
  try {
    const { cleanBody, funcArgs } = extractSymbols(obj.raw_expression);
    const compiled = compile(cleanBody);

    const localScope = { ...contextScope };

    // Jika objek berupa fungsi (misal f(x)) dan titik x disuplai
    if (funcArgs && funcArgs.length > 0 && xValue !== undefined) {
      localScope[funcArgs[0]] = xValue;
    }

    const result = compiled.evaluate(localScope);

    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return result;
    }
    return null;
  } catch (err) {
    return null;
  }
}

// 3. Urutkan Evaluasi Objek Berdasarkan Graf Ketergantungan (Topological Sort)
export function resolveDependencyOrder(objects: MathObject[]): MathObject[] {
  const objectMap = new Map<string, MathObject>();
  objects.forEach((obj) => objectMap.set(obj.name, obj));

  const visited = new Set<string>();
  const sorted: MathObject[] = [];

  function visit(name: string, ancestors: Set<string>) {
    if (ancestors.has(name)) {
      console.warn(`Circular dependency detected on variable: ${name}`);
      return;
    }
    if (!visited.has(name)) {
      visited.add(name);
      ancestors.add(name);

      const obj = objectMap.get(name);
      if (obj) {
        obj.dependencies.forEach((dep) => {
          if (objectMap.has(dep)) {
            visit(dep, new Set(ancestors));
          }
        });
        sorted.push(obj);
      }
    }
  }

  objects.forEach((obj) => visit(obj.name, new Set()));
  return sorted;
}