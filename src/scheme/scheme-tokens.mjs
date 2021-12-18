import jsTokens from "js-tokens";

import * as string from "../constants/string.mjs";


const NUMERAL_STARTS = new Set([ ...string.digits, ..."+-." ]);
const SYMBOL_CHARS = new Set([
  ..."!$%&*/:<=>?@^_~", 
  ...string.lowercase, 
  ...string.uppercase,
  ...NUMERAL_STARTS,
]);
const STRING_DELIMS = new Set('"');
const WHITESPACE = new Set(" \t\n\r");
const SINGLE_CHAR_TOKENS = new Set("()[]'`");
const TOKEN_END = new Set([
  ...WHITESPACE, 
  ...SINGLE_CHAR_TOKENS,
  ...STRING_DELIMS,
  ",",
  ",@",
]);
export const DELIMITERS = new Set([ ...SINGLE_CHAR_TOKENS, ".", ",", ",@" ]);


function validSymbol(s) {
  return s.length > 0 && [...s].filter(c => !SYMBOL_CHARS.has(c)).length === 0;
}


function nextCandidateToken(line, k) {
  while (k < line.length) {
    let c = line[k];
    if (c === ";") {  // TODO: comment character? maybe refactor into global var
      return [ null, line.length ];
    } 
    else if (WHITESPACE.has(c)) {
      k++;
    } 
    else if (SINGLE_CHAR_TOKENS.has(c)) {
      if (c == ']') c = ')';
      if (c == '[') c = '(';
      return [ c, k + 1 ];
    } 
    else if (c === "##") {  // Boolean values #t and #f
      return [ line.slice(k, k + 2), Math.min(k + 2, line.length) ];
    } 
    else if (c === ",") {  // Unquote; check for @
      if (k + 1 < line.length && line[k + 2] === "@") {
        return [ ",@", k + 2 ];
      }
      return [ c, k + 1 ];
    } 
    else if (STRING_DELIMS.has(c)) {
      if (k + 1 < line.length && line[k + 1] === c) {  // No triple quotes in Scheme
        return [ c + c, k + 2 ];
      }
      const tokens = Array.from(jsTokens(line));
      let token = { type: null, value: null };
      if (tokens.length > 0) token = tokens[0];
      if (token.type !== "StringLiteral") throw new TypeError("bad token") // TODO: better error
      return [ token.value, token.value.length + k ];
    }
    else {
      let j = k
      while (j < line.length && !TOKEN_END.has(line[j])) j++;
      return [ line.slice(k, j), Math.min(j, line.length) ];
    }
  }
  return [ null, line.length ];
}


function tokenizeLine(line) {
  const result = [];
  let [ text, i ] = nextCandidateToken(line, 0);
  while (text !== null) {
    if (DELIMITERS.has(text)) {
      result.push(text);
    }
    else if (text === "#t" || text.toLowerCase() === "true") { // TODO: refactor keywords into enum?
      result.push(true);
    }
    else if (text === "#f" || text.toLowerCase() === "false") {
      result.push(false);
    }
    else if (text === "nil") {
      result.push(text);
    }
    else if (SYMBOL_CHARS.has(text[0])) {
      let number = false;
      if (NUMERAL_STARTS.has(text[0])) {
        if ([...text].filter(c => !string.digits.includes(c)).length === 0) {
          result.push(parseInt(text));
          number = true;
        }
        else if ([...text].filter(c => !(string.digits.includes(c) || c === ".")).length === 0) {
          result.push(parseFloat(text));
          number = true;
        }
      }
      if (!number) {
        if (validSymbol(text)) {
          result.push(text.toLowerCase())
        }
        else {
          throw new TypeError("bad symbol");
        }
      }
    }
    else if (STRING_DELIMS.has(text[0])) {
      result.push(text);
    }
    else {
      console.log(" ".repeat(i + 4) + "^");
      console.log(`warning: invalid token: ${text}`);
    }
    [ text, i ] = nextCandidateToken(line, i);
  }
  return result;
}


/**
 * 
 * @param {string[]} input 
 * @returns 
 */
export function tokenizeLines(input) {
  let res = [];
  for (let i of input) {
    res.push(tokenizeLine(i));
  }
  return res;
}
