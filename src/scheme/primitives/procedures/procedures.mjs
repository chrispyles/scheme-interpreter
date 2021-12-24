import { nil, Pair, SchemeValue } from "../primitive-objects.mjs";


/**
 * An ABC for a procedure in Scheme.
 */
export class Procedure extends SchemeValue {
  constructor() {
    super();
  }
}


/**
 * A primitive procedure in Scheme.
 */
export class PrimitiveProcedure extends Procedure {
  name;
  fn;
  useEnv;

  static foo = [];

  /**
   * @param {(...ang) => SchemeValue} fn The JS function underlying this Scheme procedure
   * @param {{ name?, useEnv? }} options
   */
  constructor(fn, options) {
    super();
    this.name = options.name || "primitive";
    this.fn = fn;
    this.useEnv = options.useEnv || false;
  }

  schemeRepr() {
    return `#[${this.name}]`;
  }

  toString() {
    return `Procedure(${this.name})`;
  }
}


/**
 * An ABC for a user-defined procedure in Scheme.
 */
export class UserDefinedProcedure extends Procedure {
  body;

  constructor() {
    super();
    this.body = nil;
  }
}


/**
 * A lambda procedure in Scheme.
 */
export class LambdaProcedure extends UserDefinedProcedure {
  formals;
  env;

  /**
   * @param {Pair} formals The declaration of the procedure as a series of {@link Pair}s
   * @param {Pair} body The function body as a series of {@link Pair}s
   * @param {Frame} env The procedure's parent frame
   */
  constructor(formals, body, env) {
    super();
    this.formals = formals;
    this.body = body;
    this.env = env;
  }

  schemeRepr() {
    return new Pair("lambda", new Pair(this.formals, this.body)).schemeRepr();
  }

  toString() {
    return `LambdaProcedure(${this.formals}, ${this.body}, ${this.env})`;
  }
}


/**
 * A mu procedure in Scheme.
 */
export class MuProcedure extends UserDefinedProcedure {
  formals;

  /**
   * @param {Pair} formals The declaration of the procedure as a series of {@link Pair}s
   * @param {Pair} body The function body as a series of {@link Pair}s 
   */
  constructor(formals, body) {
    super();
    this.formals = formals;
    this.body = body;
  }

  schemeRepr() {
    return (new Pair("mu", new Pair(this.formals, this.body))).toString();
  }

  toString() {
    return `MuProcedure(${this.formals}, ${this.body})`;
  }
}
