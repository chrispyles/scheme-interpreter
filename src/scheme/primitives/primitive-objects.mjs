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

  /**
   * The Scheme representation of this value, to be printed to the console if an expression
   * evaluates to this object.
   */
  schemeRepr() {
    throw new ABCError("the schemeRepr method must be implemented");
  }

  /**
   * The JS string representation of this object.
   */
  toString() {
    throw new ABCError("the toString method must be implemented");
  }

  /**
   * Return the Scheme string representation of an object if available, otherwise null.
   * @param {any} obj The object
   * @returns {string | null} The Scheme representation of the object
   */
  static schemeRepr(obj) {
    let repr = null;
    if (obj instanceof SchemeValue) {
      repr = obj.schemeRepr();
    }
    else if (obj !== null) {
      repr = obj.toString();
    }
    return repr;
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

  /**
   * Whether another object is also {@link okay}.
   * @param {any} o The other object
   * @returns {boolean} Whether the other object is {@link okay}
   */
  equals(o) {
    return o instanceof Okay;
  }
}


/**
 * A singleton instance of the {@link Okay} class.
 */
export const okay = new Okay();
Object.freeze(okay);


/**
 * A class representing `nil` values in Scheme.
 */
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

  /**
   * Whether another object is also {@link nil}.
   * @param {any} o The other object
   * @returns {boolean} Whether the other object is {@link nil}
   */
  equals(o) {
    return o instanceof Nil;
  }
}


/**
 * A singleton instance of the {@link Nil} class.
 */
export const nil = new Nil();
Object.freeze(nil);


/**
 * Determine whether an object is {@link nil}.
 * @param {*} val The object
 * @returns {boolean} Whether the object is {@link nil}
 */
export function isNil(val) {
  return nil.equals(val);
}


/**
 * A pair in Scheme.
 */
export class Pair extends SchemeValue {
  first;
  second;

  /**
   * @param {any} first The first element of the pair
   * @param {Pair | nil} second The rest of the pair
   */
  constructor(first, second) {
    super();
    this.first = first;
    this.second = second;
  }

  /**
   * The length of the linked list this pair represents.
   */
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

  /**
   * Whether another object equals this pair.
   * @param {any} o The other object
   * @returns {boolean}
   */
  equals(o) {
    return o instanceof Pair && this.first === o.first && this.second === o.second;
  }

  /**
   * Map a function to the values in this pair, returning a new {@link Pair}.
   * @param {(any) => any} fn The function to apply
   * @returns {Pair} The new pair
   */
  map(fn) {
    const mapped = fn(this.first);
    if (isNil(this.second) || this.second instanceof Pair) {
      return new Pair(mapped, this.second.map(fn));
    }
    else {
      throw new TypeError("ill-formed list");
    }
  }
}


/**
 * A possible-evaluated promise in Scheme.
 */
export class SchemePromise extends SchemeValue {
  expr;
  env;
  forced;
  val;

  /**
   * @param {SchemeValue} expr The expression to be evaluated
   * @param {Frame} env The frame in which the expression should be evaluated
   */
  constructor(expr, env) {
    super();
    this.expr = expr;
    this.env = env;
    this.forced = false;
    this.val = null;
  }

  /**
   * Return the value of the expression. If the expression has already been forced, the expression
   * is not evaluated again.
   * @returns {any} The value of the expression
   */
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
