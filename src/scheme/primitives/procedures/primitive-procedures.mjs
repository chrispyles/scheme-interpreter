import { EOFError, SchemeError } from "../../../errors.mjs";

import { isNil, nil, okay, Pair, SchemePromise, SchemeValue } from "../primitive-objects.mjs";

import { PrimitiveProcedure } from "./procedures.mjs";


const PRIMITIVES = [];


function registerPrimitive(fn, ...names) {
  const proc = new PrimitiveProcedure(fn, { name: names[0] });
  names.forEach(n => PRIMITIVES.push([ n, proc ]));
}


export function addPrimitivesToFrame(frame) {
  PRIMITIVES.forEach(([ name, proc ]) => frame.define(name, proc));
}


// TODO: change naming scheme


function checkType(val, pred, k, name) {
  if (!pred(val)) {
    throw new SchemeError(`argument ${k} of ${name} has wrong type (${val.constructor.name})`);
  }
  return val;
}


function schemeBooleanp(x) {
  return typeof x === "boolean";
}
registerPrimitive(schemeBooleanp, "boolean?");


export function schemeTrue(x) {
  return x !== false;
}


export function schemeFalse(x) {
  return x === false;
}


function schemeNot(x) {
  return !schemeTrue(x);
}
registerPrimitive(schemeNot, "not");


function schemeEqp(x, y) {
  return x === y;
}
registerPrimitive(schemeEqp, "eq?", "equal?");


function schemePairp(x) {
  return x instanceof Pair;
}
registerPrimitive(schemePairp, "pair?");


function schemePromisep(x) {
  return x instanceof SchemePromise;
}
registerPrimitive(schemePromisep, "promise?");


function schemeStreamp(x) {
  return isNil(x) || (schemePairp(x) && schemePromisep(x)); // TODO: is this logic correct??
}
registerPrimitive(schemeStreamp, "stream?")


function schemeNullp(x) {
  return isNil(x);
}
registerPrimitive(schemeNullp, "null?");


export function schemeListp(x) {
  while (!isNil(x)) {
    if (!(x instanceof Pair)) return false;
    x = x.second;
  }
  return true;
}
registerPrimitive(schemeListp, "list?");


function schemeLength(x) {
  checkType(x, schemeListp, 0, "length");
  if (isNil(x)) return 0;
  return x.length;
}
registerPrimitive(schemeLength, "length");


function schemeCons(x, y) {
  return new Pair(x, y);
}
registerPrimitive(schemeCons, "cons");


function schemeCar(x) {
  checkType(x, schemePairp, 0, "car");
  return x.first;
}
registerPrimitive(schemeCar, "car");


function schemeCdr(x) {
  checkType(x, schemePairp, 0, "cdr");
  return x.second;
}
registerPrimitive(schemeCdr, "cdr");


function schemeForce(x) {
  checkType(x, schemePromisep, 0, "promise");
  return x.evaluate();
}
registerPrimitive(schemeForce, "force");


function schemeStreamCdr(x) {
  checkType(x, schemeStreamp, 0, "promise");
  return schemeForce(x.second);
}
registerPrimitive(schemeStreamCdr, "stream-cdr");


function schemeList(...x) {
  let result = nil;
  x.reverse();
  for (let xi of x) {
    result = new Pair(xi, result);
  }
  return result;
}
registerPrimitive(schemeList, "list");


function schemeAppend(...vals) {
  if (vals.length === 0) {
    return nil;
  }
  let result = vals[vals.length - 1];
  for (let i = vals.length - 2; i > -1; i--) {
    let v = vals[i];
    if (!isNil(v)) {
      checkType(v, schemePairp, i, "append");
      let r = new Pair(v.first, result);
      let p = r;
      v = v.second;
      while (schemePairp(v)) {
        p.second = new Pair(v.first, result);
        p = p.second;
        v = v.second;
      }
      result = r;
    }
  }
  return result;
}
registerPrimitive(schemeAppend, "append");


export function schemeStringp(x) {
  return typeof x === "string" && x.startsWith('"');
}
registerPrimitive(schemeStringp, "string?");


export function schemeSymbolp(x) {
  return typeof x === "string" && !schemeStringp(x);
}
registerPrimitive(schemeSymbolp, "symbol?");


function schemeNumberp(x) {
  return !isNaN(x) && !schemeBooleanp(x);
}
registerPrimitive(schemeNumberp, "number?");


function schemeIntegerp(x) {
  return schemeNumberp(x) && Number.isInteger(x);
}
registerPrimitive(schemeIntegerp, "integer?");


function checkNums(...vals) {
  vals.forEach((v, i) => {
    if (!schemeNumberp(v)) {
      throw new SchemeError(`operand ${i} (${v}) is not a number`);
    }
  });
}


function arith(fn, init, vals) {
  checkNums(...vals);
  let s = init;
  for (let v of vals) {
    s = fn(s, v);
  }
  if (Math.round(s) === s) {
    s = Math.round(s);
  }
  return s;
}


function schemeAdd(...vals) {
  return arith((x, y) => x + y, 0, vals);
}
registerPrimitive(schemeAdd, "+");


function schemeSub(val0, ...vals) {
  checkNums(val0, ...vals);
  if (vals.length === 0) return -val0;
  return arith((x, y) => x - y, val0, vals);
}
registerPrimitive(schemeSub, "-");


function schemeMul(...vals) {
  return arith((x, y) => x * y, 1, vals);
}
registerPrimitive(schemeMul, "*");


function schemeDiv(val0, ...vals) {
  checkNums(val0, ...vals);
  try {
    if (vals.length === 0) return 1 / val0;
    return arith((x, y) => x / y, val0, vals);
  }
  catch (err) {
    throw new SchemeError(err.message);
  }
}
registerPrimitive(schemeDiv, "/");


function schemeExpt(x, y) {
  checkNums(x, y);
  return Math.pow(x, y);
}
registerPrimitive(schemeExpt, "expt");


function schemeAbs(x) {
  return Math.abs(x);
}
registerPrimitive(schemeAbs, "abs");


function schemeQuo(x, y) {
  checkNums(x, y);
  try {
    return Math.floor(x / y);
  }
  catch (err) {
    throw new SchemeError(err.message);
  }
}
registerPrimitive(schemeQuo, "quotient");


function schemeModulo(x, y) {
  checkNums(x, y);
  try {
    return x % y;
  }
  catch (err) {
    throw new SchemeError(err.message);
  }
}
registerPrimitive(schemeModulo, "modulo");


function schemeRemainder(x, y) {
  checkNums(x, y);
  let result;
  try {
    result = x % y;
  }
  catch (err) {
    throw new SchemeError(err.message);
  }
  while (result < 0 && x > 0 || result > 0 && x < 0) {
    result -= y;
  }
  return result;
}
registerPrimitive(schemeRemainder, "remainder");


function createNumericFunction(obj, fnName) {
  return x => {
    checkNums(x);
    return obj[fnName](x);
  }
}


for (let fnName of [
  "acos", "acosh", "asin", "asinh", "atan", "atan2", "atanh", "ceil", "cos", "cosh", "floor", "log",
  "log10", "log1p", "log2", "sin", "sinh", "sqrt", "tan", "tanh", "trunc",
]) {
  registerPrimitive(createNumericFunction(Math, fnName), fnName);
}


function numComp(op, x, y) {
  checkNums(x, y);
  return op(x, y);
}


function schemeEq(x, y) {
  return numComp((a, b) => a === b, x, y);
}
registerPrimitive(schemeEq, "=");


function schemeLt(x, y) {
  return numComp((a, b) => a < b, x, y);
}
registerPrimitive(schemeLt, "<");


function schemeGt(x, y) {
  return numComp((a, b) => a > b, x, y);
}
registerPrimitive(schemeGt, ">")


function schemeLe(x, y) {
  return numComp((a, b) => a <= b, x, y);
}
registerPrimitive(schemeLe, "<=");


function schemeGe(x, y) {
  return numComp((a, b) => a >= b, x, y);
}
registerPrimitive(schemeGe, ">=");


function schemeEvenp(x) {
  checkNums(x);
  return x % 2 === 0;
}
registerPrimitive(schemeEvenp, "even?");


function schemeOddp(x) {
  checkNums(x);
  return x % 2 === 1;
}
registerPrimitive(schemeOddp, "odd?");


function schemeZerop(x) {
  checkNums(x);
  return x === 0;
}
registerPrimitive(schemeZerop, "zero?");


export function schemeAtomp(x) {
  return schemeBooleanp(x) || schemeNumberp(x) || schemeSymbolp(x) || schemeNullp(x);
}
registerPrimitive(schemeAtomp, "atom?");


function schemeDisplay(x) {
  if (schemeStringp(x)) x = eval(x);
  process.stdout.write(x.toString());
  return okay;
}
registerPrimitive(schemeDisplay, "display");


function schemePrint(x) {
  SchemeValue.printSchemeObj(x);
  return okay;
}
registerPrimitive(schemePrint, "print");


function schemeNewline() {
  console.log();
  return okay;
}
registerPrimitive(schemeNewline, "newline");


function schemeError(msg = null) {
  if (msg === null) msg = "";
  throw new SchemeError(msg);
}
registerPrimitive(schemeError, "error");


function schemeExit() {
  throw new EOFError();
}
registerPrimitive(schemeExit, "exit");
