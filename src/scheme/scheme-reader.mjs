import { Buffer, InputReader, LineReader } from "../buffer/index.mjs";

import { EOFError, SchemeError } from "../errors.mjs";
import { nil, Pair } from "./primitives/index.mjs";
import { DELIMITERS, tokenizeLines } from "./scheme-tokens.mjs";


export function schemeRead(src) {
  if (src.current() === null) {
    throw new EOFError("EOF");
  }
  const val = src.pop();
  if (val === "nil") {
    return nil;
  }
  else if (!DELIMITERS.has(val)) {
    return val;
  }
  else if (val === "'") {
    return new Pair("quote", new Pair(schemeRead(src), nil));
  }
  else if (val === "(") {
    return readTail(src);
  }
  else {
    throw new SchemeError("unexpected token");
  }
}


function readTail(src) {
  try {
    if (src.current() === null) {
      throw new SchemeError("unexpected EOF");
    }
    else if (src.current() === ")") {
      src.pop();
      return nil;
    }
    else if (src.current() === ".") {
      src.pop();
      const temp = schemeRead(src);
      if (src.pop() === ")") {
        return temp;
      }
      else {
        throw new SchemeError("expected one element after .");
      }
    }
    else {
      const first = schemeRead(src);
      const rest = readTail(src);
      return new Pair(first, rest);
    }
  }
  catch (err) {
    if (err instanceof EOFError) {
      throw new SchemeError("unexpected eof");
    }
    throw err;
  }
}


export function bufferInput(prompt="scm> ") {
  const lines = (new InputReader(prompt)).getLines();
  return new Buffer(tokenizeLines(lines));
}


export function bufferLines(lines, prompt="scm> ", showPrompt=false) {
  let inputLines;
  if (showPrompt) {
    inputLines = lines;
  }
  else {
    inputLines = new LineReader(lines, prompt);
  }
  return new Buffer(tokenizeLines(inputLines));
}
