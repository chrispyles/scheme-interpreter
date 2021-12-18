import promptSync from "prompt-sync";


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
