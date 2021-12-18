import { assert, EOFError, SchemeError } from "../errors.mjs";
import { 
  addPrimitivesToFrame,
  isNil, 
  LambdaProcedure,
  MuProcedure,
  nil, 
  okay, 
  Pair, 
  PrimitiveProcedure,
  schemeAtomp,
  schemeFalse,
  schemeListp,
  SchemePromise, 
  schemeStringp,
  schemeSymbolp,
  schemeTrue,
  SchemeValue,
  UserDefinedProcedure,
} from "./primitives/index.mjs";
import { schemeRead } from "./scheme-reader.mjs";


/**
 * Evaluate a Scheme expression in the provided frame.
 * @param {*} expr The expression to evaluate
 * @param {Frame} env The frame in which to evaluate `expr`
 * @returns The value of the expression as a JavaScript object
 * @throws SchemeError If the expression is invalid
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
  if (schemeSymbolp(first) && first in SPECIAL_FORMS) {
    result = SPECIAL_FORMS[first](rest, env)
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


function evalAll(exprs, env) {
  if (isNil(exprs)) {
    return okay;
  }
  if (isNil(exprs.second)) {
    return schemeEval(exprs.first, env); // TODO: 3rd arg?
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


function checkForm(expr, min, max = Infinity) {
  if (!schemeListp(expr)) {
    throw new SchemeError(`badly formed expression: ${expr}`);
  }
  const length = expr.length;
  if (length < min) {
    throw new SchemeError("too few operands in form");
  }
  else if (length > max) {
    throw new SchemeError("too many operands in form");
  }
}


function checkFormals(formals) {
  const fmls = [];
  while (!isNil(formals)) {
    fmls.push(formals.first);
    formals = formals.second;
  }
  for (let i = 0; i < fmls.length; i++) {
    if (fmls.slice(i + 1).includes(fmls[i]) || !schemeSymbolp(fmls[i])) {
      throw new SchemeError(`invalid formals`);
    }
  }
}


// TODO: refactod doXForm into classes also??


function doDefineForm(exprs, env) {
  checkForm(exprs, 2);
  const target = exprs.first;
  if (schemeSymbolp(target)) {
    checkForm(exprs, 2, 2);
    env.define(target, schemeEval(exprs.second.first, env));
    return exprs.first;
  }
  else if (target instanceof Pair && schemeSymbolp(target.first)) {
    env.define(target.first, new LambdaProcedure(target.second, exprs.second, env));
    return target.first;
  }
  else {
    const bad = target instanceof Pair ? target.first : target;
    throw new SchemeError(`Non-symbol: ${bad}`);
  }
}


function doQuoteForm(exprs, env) {
  checkForm(exprs, 1, 1);
  return exprs.first;
}


function doBeginForm(exprs, env) {
  checkForm(exprs, 1);
  return evalAll(exprs, env);
}


function doLambdaForm(exprs, env) {
  checkForm(exprs, 2);
  const formals = exprs.first;
  checkFormals(formals);
  return new LambdaProcedure(formals, exprs.second, env);
}


function doIfForm(exprs, env) {
  checkForm(exprs, 2, 3);
  if (schemeEval(exprs.first, env) !== false) {
    return schemeEval(exprs.second.first, env);
  }
  else if (!isNil(exprs.second.second)) {
    return schemeEval(exprs.second.second.first, env);
  }
  else {
    return okay;
  }
}


function doAndForm(exprs, env) {
  if (isNil(exprs)) {
    return true;
  }
  if (isNil(exprs.second)) {
    return schemeEval(exprs.first, env);
  }
  const val = schemeEval(exprs.first, env);
  if (val === false) {
    return false;
  }
  else if (isNil(exprs.second)) {
    return val;
  }
  else {
    return doAndForm(exprs.second, env);
  }
}


function doOrForm(exprs, env) {
  if (isNil(exprs)) {
    return false;
  }
  if (isNil(exprs.second)) {
    return schemeEval(exprs.first, env);
  }
  const val = schemeEval(exprs.first, env);
  return !schemeFalse(val) ? val : doOrForm(exprs.second, env);
}


function doCondForm(exprs, env) {
  const numClauses = exprs.length;
  let i = 0;
  while (!isNil(exprs)) {
    checkForm(exprs.first, 1);
    const clause = exprs.first;
    let test;
    if (clause.first === "else") {
      if (i < numClauses - 1) {
        throw new SchemeError("else must be last");
      }
      test = true;
    }
    else {
      test = schemeEval(clause.first, env);
    }
    if (schemeTrue(test)) {
      const val = clause.second;
      if (!isNil(val)) {
        return evalAll(val, env);
      }
      else if (test !== true) {
        return test;
      }
      else {
        return true;
      }
    }
    exprs = exprs.second;
    i++;
  }
  return okay;
}


function doLetForm(exprs, env) {
  checkForm(exprs, 2);
  const letEnv = makeLetFrame(exprs.first, env);
  return evalAll(exprs.second, letEnv);
}


function makeLetFrame(bindings, env) {
  if (!schemeListp(bindings)) {
    throw new SchemeError("bad bindings list in let form");
  }
  let formals = nil, vals = nil;
  while (!isNil(bindings)) {
    checkForm(bindings.first, 2, 2);
    formals = new Pair(bindings.first.first, formals);
    checkFormals(formals);
    vals = new Pair(schemeEval(bindings.first.second.first, env), vals);
    bindings = bindings.second;
  }
  return env.makeChildFrame(formals, vals);
}


function doDelayForm(exprs, env) {
  return new SchemePromise(exprs, env);
}


function doConsStreamForm(exprs, env) {
  return new Pair(schemeEval(exprs.first, env), doDelayForm(exprs.second, env));
}


const SPECIAL_FORMS = {
  and: doAndForm,
  begin: doBeginForm,
  cond: doCondForm,
  "cons-stream": doConsStreamForm,
  define: doDefineForm,
  delay: doDelayForm,
  if: doIfForm,
  lambda: doLambdaForm,
  let: doLetForm,
  or: doOrForm,
  quote: doQuoteForm,
};


function doMuForm(exprs, env) {
  checkForm(exprs, 2);
  const formals = exprs.first;
  checkFormals(formals);
  return new MuProcedure(formals, exprs.second);
}


SPECIAL_FORMS["mu"] = doMuForm;


export function readEvalPrintLoop(getNextLine, env, interactive) {
  /* eslint-disable no-constant-condition */
  while (true) {
    try {
      const src = getNextLine();
      while (src.current()) {
        try {
          const expr = schemeRead(src);
          const result = schemeEval(expr, env);
          SchemeValue.printSchemeObj(result);
        }
        catch (err) {
          if (err instanceof SchemeError) {
            console.log(`Error: ${err.message}`);
          }
          else {
            throw err;
          }
        }
      }
      console.log("foo")
      if (!interactive) throw new EOFError();
    }
    catch (err) {
      if (err instanceof EOFError) {
        return;
      }
      else {
        throw err;
      }
    }
  }
}


export function createGlobalFrame() {
  const env = new Frame(null);
  env.define("eval", new PrimitiveProcedure(schemeEval, { useEnv: true }));
  env.define("apply", new PrimitiveProcedure(schemeApply, { useEnv: true }));
  addPrimitivesToFrame(env);
  return env;
}
