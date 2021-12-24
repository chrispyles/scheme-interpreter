import { Buffer, LineReader } from "../buffer/index.mjs";

import { EOFError, SchemeError } from "../errors.mjs";
import { nil, Pair } from "./primitives/index.mjs";
import { DELIMITERS, tokenizeLines } from "./scheme-tokens.mjs";


/**
 * Read the next expression in a {@link Buffer} and return a {@link SchemeValue} representing the 
 * parsed expression.
 * 
 * @param {Buffer} src The buffer to read from
 * @returns {SchemeValue} The Scheme expression as a JS object
 */
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


/**
 * Read the rest of the current expression in a buffer and return its parsed value as a 
 * {@link SchemeValue}.
 * 
 * @param {Buffer} src The buffer to read from
 * @returns {SchemeValue} The Scheme expression as a JS object
 */
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


/**
 * Convert list of lines of Scheme into a Buffer by tokenizing them.
 * 
 * @param {string[]} lines The lines of Scheme
 * @param {string} prompt The prompt
 * @param {boolean} showPrompt // TODO
 * @returns {Buffer} A buffer containing the tokenized expression represented by {@link lines}
 */
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
