/* eslint-disable no-unused-vars */

import { assert, SchemeError } from "../../errors.mjs";
import { 
  isNil, 
  LambdaProcedure,
  MuProcedure,
  nil,
  okay,
  Pair,
  schemeFalse,
  schemeListp, 
  SchemePromise, 
  schemeSymbolp,
  schemeTrue,
} from "../primitives/index.mjs";
import { evalAll, schemeEval } from "../scheme.mjs";


/**
 * An object containing Scheme special forms keyed on their names.
 */
const SPECIAL_FORMS = {};


/**
 * Register a special form with the specified name.
 * 
 * @param {(exprs: Pair, env: Frame) => SchemeValue} form The function that runs the form
 * @param {string} name The name to register the form as
 */
function registerSpecialForm(form, name) {
  SPECIAL_FORMS[name] = form;
}


/**
 * Return the special form with the specified name if it exists, otherwise `undefined`.
 * 
 * @param {string} name The name of the form to get
 * @returns {((exprs: Pair, env: Frame) => SchemeValue) | undefined} The function that runs the form
 */
export function getSpecialForm(name) {
  return SPECIAL_FORMS[name];
}


/**
 * Assert that the {@link Pair} containing the arguments has the correct length.
 * 
 * @param {Pair} expr The arguments
 * @param {number} min The minimum number of arguments
 * @param {number} max The maximum number of arguments (defaults to infinity)
 * @throws {SchemeError} If the arguments are not in a {@link Pair} or the wrong number of arguments
 * is provided
 */
function checkForm(expr, min, max = Infinity) {
  assert(schemeListp(expr), `badly formed expression: ${expr}`, SchemeError);
  const length = expr.length;
  assert(length >= min, "too few operands in form", SchemeError);
  assert(length <= max, "too many operands in form");
}


/**
 * Assert that the provided frmals for a user-defined procedure are all valid Scheme symbols and are
 * not duplicated.
 * 
 * @param {Pair} formals The formals of the procedure
 * @throws {SchemeError} If the formals are invalid
 */
function checkFormals(formals) {
  const fmls = [];
  while (!isNil(formals)) {
    fmls.push(formals.first);
    formals = formals.second;
  }
  for (let i = 0; i < fmls.length; i++) {
    assert(
      !fmls.slice(i + 1).includes(fmls[i]) && schemeSymbolp(fmls[i]), 
      "invalid formals", 
      SchemeError);
  }
}


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
registerSpecialForm(doDefineForm, "define");


function doQuoteForm(exprs, env) {
  checkForm(exprs, 1, 1);
  return exprs.first;
}
registerSpecialForm(doQuoteForm, "quote");


function doBeginForm(exprs, env) {
  checkForm(exprs, 1);
  return evalAll(exprs, env);
}
registerSpecialForm(doBeginForm, "begin");


function doLambdaForm(exprs, env) {
  checkForm(exprs, 2);
  const formals = exprs.first;
  checkFormals(formals);
  return new LambdaProcedure(formals, exprs.second, env);
}
registerSpecialForm(doLambdaForm, "lambda");


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
registerSpecialForm(doIfForm, "if");


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
registerSpecialForm(doAndForm, "and");


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
registerSpecialForm(doOrForm, "or");


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
registerSpecialForm(doCondForm, "cond");


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


function doLetForm(exprs, env) {
  checkForm(exprs, 2);
  const letEnv = makeLetFrame(exprs.first, env);
  return evalAll(exprs.second, letEnv);
}
registerSpecialForm(doLetForm, "let");


function doDelayForm(exprs, env) {
  return new SchemePromise(exprs, env);
}
registerSpecialForm(doDelayForm, "delay");


function doConsStreamForm(exprs, env) {
  return new Pair(schemeEval(exprs.first, env), doDelayForm(exprs.second, env));
}
registerSpecialForm(doConsStreamForm, "cons-stream");


function doMuForm(exprs, env) {
  checkForm(exprs, 2);
  const formals = exprs.first;
  checkFormals(formals);
  return new MuProcedure(formals, exprs.second);
}
registerSpecialForm(doMuForm, "mu");
