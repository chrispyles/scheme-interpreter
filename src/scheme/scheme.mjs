import { assert, EOFError, SchemeError } from "../errors.mjs";
import { getSpecialForm } from "./forms.mjs";
import { 
  addPrimitivesToFrame,
  isNil, 
  LambdaProcedure,
  okay, 
  PrimitiveProcedure,
  schemeAtomp,
  schemeListp,
  schemeStringp,
  schemeSymbolp,
  SchemeValue,
  UserDefinedProcedure,
} from "./primitives/index.mjs";
import { schemeRead } from "./scheme-reader.mjs";


/**
 * Evaluate a Scheme expression in the provided frame.
 * 
 * @param {*} expr The expression to evaluate
 * @param {Frame} env The frame in which to evaluate `expr`
 * @returns The value of the expression as a JavaScript object
 * @throws {SchemeError} If the expression is invalid
 */
export function schemeEval(expr, env) {
  assert(expr !== null);
  if (schemeSymbolp(expr)) {
    return env.lookup(expr);
  }
  else if (selfEvaluating(expr)) {
    return expr;
  }

  if (!schemeListp(expr)) {
    throw new SchemeError(`malformed list: ${expr}`);
  }

  let first = expr.first, rest = expr.second, result;
  if (schemeSymbolp(first) && getSpecialForm(first)) {
    result = getSpecialForm(first)(rest, env)
  }
  else {
    const proc = schemeEval(first, env);
    const args = rest.map((o) => schemeEval(o, env));
    result = schemeApply(proc, args, env);
  }

  return result;
}


/**
 * Determine if a Scheme expression is self-evaluating.
 * @param {*} expr The Scheme expression
 * @returns boolean
 */
function selfEvaluating(expr) {
  return schemeAtomp(expr) || schemeStringp(expr) || okay.equals(expr);
}


function schemeApply(proc, args, env) {
  if (proc instanceof PrimitiveProcedure) {
    return applyPrimitive(proc, args, env);
  }
  else if (proc instanceof UserDefinedProcedure) {
    const newEnv = makeCallFrame(proc, args, env);
    return evalAll(proc.body, newEnv);
  }
  else {
    throw new SchemeError(`cannot call: ${proc}`);
  }
}


function applyPrimitive(proc, argsSchemeList, env) {
  const args = [];
  while (!isNil(argsSchemeList)) {
    args.push(argsSchemeList.first);
    argsSchemeList = argsSchemeList.second;
  }

  if (proc.useEnv) {
    args.push(env);
  }

  try {
    return proc.fn(...args);
  }
  catch (err) {
    if (err instanceof TypeError) { // TODO: swap out TypeErrors
      throw new SchemeError(err.message);
    }
    else {
      throw err;
    }
  }
}


export function evalAll(exprs, env) {
  if (isNil(exprs)) {
    return okay;
  }
  if (isNil(exprs.second)) {
    return schemeEval(exprs.first, env);
  }
  else {
    schemeEval(exprs.first, env);
    return evalAll(exprs.second, env);
  }
}


function makeCallFrame(proc, args, env) {
  if (proc instanceof LambdaProcedure) {
    return proc.env.makeChildFrame(proc.formals, args);
  }
  else {
    return env.makeChildFrame(proc.formals, args);
  }
}


export class Frame {
  bindings;
  parent;

  constructor(parent) {
    this.bindings = {};
    this.parent = parent;
  }

  toString() {
    if (this.parent === null) {
      return "<Global Frame>";
    }
    else {
      let s = Object.entries(this.bindings).map(([k, v]) => `${k}: ${v}`);
      // TODO: sort s
      return `<{${s.join(", ")}} -> ${this.parent}>`;
    }
  }

  lookup(symbol) {
    if (symbol in this.bindings) {
      return this.bindings[symbol];
    }
    else if (this.parent !== null) {
      return this.parent.lookup(symbol);
    }
    throw new SchemeError(`unknown identifier: ${symbol}`);
  }

  makeChildFrame(formals, vals) {
    const frame = new Frame(this);
    try {
      while (!isNil(formals) && !isNil(vals)) {
        if (!schemeSymbolp(formals.first)) {
          throw new SchemeError(`invalid symbol in formals: ${formals.first}`);
        }
        frame.define(formals.first, vals.first);
        formals = formals.second;
        vals = vals.second;
      }
      return frame;
    }
    catch (err) {
      throw new SchemeError(err.message);
    }
  }

  define(symbol, value) {
    this.bindings[symbol] = value;
  }
}


export function readEvalPrintLoop(getNextLine, env, interactive, printLines) {
  /* eslint-disable no-constant-condition */
  const printedLines = [];
  const printCollectedLines = () => printLines(
    printedLines.splice(0, printedLines.length).filter(l => l !== null));
  while (true) {
    try {
      const src = getNextLine();
      while (src.current()) {
        try {
          const expr = schemeRead(src);
          const result = schemeEval(expr, env);
          printedLines.push(SchemeValue.schemeRepr(result));
        }
        catch (err) {
          if (err instanceof SchemeError) {
            printedLines.push(`Error: ${err.message}`);
          }
          else {
            throw err;
          }
        }
      }
      if (!interactive) throw new EOFError();
      else printCollectedLines();
    }
    catch (err) {
      if (err instanceof EOFError) {
        printCollectedLines();
        return;
      }
      else {
        throw err;
      }
    }
  }
}


export function consoleLoggingRepl(getNextLine, env, interactive) {
  const printLines = lines => lines.forEach(l => console.log(l));
  readEvalPrintLoop(getNextLine, env, interactive, printLines);
}


export function createGlobalFrame() {
  const env = new Frame(null);
  env.define("eval", new PrimitiveProcedure(schemeEval, { useEnv: true }));
  env.define("apply", new PrimitiveProcedure(schemeApply, { useEnv: true }));
  addPrimitivesToFrame(env);
  return env;
}
