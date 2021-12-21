export class LineReader {
  lines;
  prompt;
  comment;

  constructor(lines, prompt, comment = ";") {
    this.lines = lines;
    this.prompt = prompt;
    this.comment = comment;
  }

  [Symbol.iterator]() {
    return { next: () => {
      let [ line ] = this.lines.splice(0, 1)
      line = line.replace(/(^\n|\n$)+/gm, "");
      if (this.prompt !== null && line !== "" && !line.trimStart().startsWith(this.comment)) {
        console.log(this.prompt + line);
      }
      return { value: line, done: this.lines.length === 0 };
    } };
  }
}
