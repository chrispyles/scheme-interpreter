import * as fs from "fs";
import promptSync from "prompt-sync";

import { Buffer } from "buffer";
import { bufferLines } from "./scheme/scheme-reader.mjs";
import { tokenizeLines } from "./scheme/scheme-tokens.mjs";
import { createGlobalFrame, readEvalPrintLoop } from "./scheme/scheme.mjs";


const PROMPT = promptSync({ sigint: true });


export class InputReader {
  prompt;

  constructor(prompt) {
    this.prompt = prompt;
  }

  getLines() {
    const value = PROMPT(this.prompt);
    this.prompt = ' '.repeat(this.prompt.length);
    return [ value ];
  }
}


export function bufferInput(prompt="scm> ") {
  const lines = (new InputReader(prompt)).getLines();
  return new Buffer(tokenizeLines(lines));
}


export function main() {
  let getNextLine = bufferInput, interactive = true;
  if (process.argv[2] !== undefined) {
    const lines = fs.readFileSync(process.argv[2], { encoding: "utf-8" }).split(/\r?\n/);
    getNextLine = () => bufferLines(lines);
    interactive = false;
  }
  readEvalPrintLoop(getNextLine, createGlobalFrame(), interactive);
}
