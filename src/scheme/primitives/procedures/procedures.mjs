import { nil, Pair, SchemeValue } from "../primitive-objects.mjs";


export class Procedure extends SchemeValue {
  constructor() {
    super();
  }
}


export class PrimitiveProcedure extends Procedure {
  name;
  fn;
  useEnv;

  static foo = [];

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


export class UserDefinedProcedure extends Procedure {
  body;

  constructor() {
    super();
    this.body = nil;
  }
}


export class LambdaProcedure extends UserDefinedProcedure {
  formals;
  env;

  constructor(formals, body, env) {
    super();
    this.formals = formals;
    this.body = body;
    this.env = env;
  }

  // TODO: this is __str__
  schemeRepr() {
    return new Pair("lambda", new Pair(this.formals, this.body)).schemeRepr(); // TODO: is this the right method???
  }

  // TODO: this is __repr__
  toString() {
    return `LambdaProcedure(${this.formals}, ${this.body}, ${this.env})`;
  }
}


export class MuProcedure extends UserDefinedProcedure {
  formals;

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
