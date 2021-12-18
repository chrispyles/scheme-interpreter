/**
 * @param source: string[]
 */
export class Buffer {
  index;
  lines;
  source;
  currentLine;

  constructor(source) {
    this.index = 0;
    this.lines = [];
    this.source = source;
    this.currentLine = "";
    this.current();
  }

  get moreOnLine() {
    return this.index < this.currentLine.length;
  }

  pop() {
    const current = this.current();
    this.index++;
    return current;
  }

  current() {
    while (!this.moreOnLine) {
      this.index = 0;
      const clIdx = this.lines.length;
      if (clIdx < this.source.length) {
        this.currentLine = this.source[clIdx];
        this.lines.push(this.currentLine);
      }
      else {
        this.currentLine = "";
        return null;
      }
    }
    return this.currentLine[this.index];
  }
}
