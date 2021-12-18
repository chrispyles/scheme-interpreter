import { ABCError } from "../../errors.mjs";
import { schemeEval } from "../scheme.mjs";


/**
 * An ABC for JavaScript classes that represent Scheme objects.
 */
export class SchemeValue {
  constructor() {
    if (this.constructor === SchemeValue) {
      throw new ABCError("SchemeValue cannot be instantiated");
    }
  }

  schemeRepr() {
    throw new ABCError("the schemeRepr method must be implemented");
  }

  toString() {
    throw new ABCError("the toString method must be implemented");
  }

  static printSchemeObj(obj) {
    let repr = null;
    if (obj instanceof SchemeValue) {
      repr = obj.schemeRepr();
    }
    else if (obj !== null) {
      repr = obj.toString();
    }
    if (repr !== null) {
      console.log(repr);
    }
  }
}


/**
 * A return value for when a procedure exits successfully but should have no additional output.
 */
 class Okay extends SchemeValue {
  constructor() {
    super();
  }

  schemeRepr() {
    return null;
  }

  toString() {
    return "Okay";
  }

  equals(o) {
    return o instanceof Okay;
  }
}


export const okay = new Okay();
Object.freeze(okay);


class Nil extends SchemeValue {
  constructor() {
    super();
  }

  get length() {
    return 0;
  }

  schemeRepr() {
    return "()";
  }

  toString() {
    return "Nil";
  }

  map() {
    return this;
  }

  equals(o) {
    return o instanceof Nil;
  }
}


export const nil = new Nil();
Object.freeze(nil);


export function isNil(val) {
  return nil.equals(val);
}


export class Pair extends SchemeValue {
  first;
  second;

  constructor(first, second) {
    super();
    this.first = first;
    this.second = second;
  }

  get length() {
    let [ n, second ] = [ 1, this.second ];
    while (second instanceof Pair) {
      n++;
      second = second.second;
    }
    if (!nil.equals(second)) {
      throw new TypeError("end is not nil");
    }
    return n;
  }

  schemeRepr() {
    let s = `(${this.first}`;
    let second = this.second;
    while (second instanceof Pair) {
      s += ` ${second.first}`;
      second = second.second;
    }
    if (!nil.equals(second)) {
      s += ` . ${second}`;
    }
    return s + ")";
  }

  toString() {
    return `Pair(${this.first}, ${this.second})`;
  }

  equals(o) {
    return o instanceof Pair && this.first === o.first && this.second === o.second;
  }

  map(fn) {
    const mapped = fn(this.first);
    if (nil.equals(this.second) || this.second instanceof Pair) {
      return new Pair(mapped, this.second.map(fn));
    }
    else {
      throw new TypeError("ill-formed list");
    }
  }
}


export class SchemePromise extends SchemeValue {
  expr;
  env;
  forced;
  val;

  constructor(expr, env) {
    super();
    this.expr = expr;
    this.env = env;
    this.forced = false;
    this.val = null;
  }

  evaluate() {
    if (this.forced) {
      return this.val;
    }
    else {
      this.val = schemeEval(this.expr.first, this.env.makeChildFrame(nil, nil));
      this.forced = true;
      return this.val;
    }
  }

  schemeRepr() {
    return `#[promise (${this.forced ? "forced" : "not forced"})]`;
  }

  toString() {
    return `SchemePromise(${this.expr}, ${this.forced ? "forced" : "not forced"})`;
  }
}
