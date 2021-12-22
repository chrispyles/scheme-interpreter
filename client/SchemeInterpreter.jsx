import React from "react";

import { Buffer } from "../src/buffer/buffer.mjs";
import { tokenizeLines } from "../src/scheme/scheme-tokens.mjs";
import { createGlobalFrame, readEvalPrintLoop } from "../src/scheme/scheme.mjs";

import SchemeInput from "./SchemeInput.jsx";

import "./SchemeInterpreter.scss";


const HistoryElementType = {
  INPUT: "input",
  OUTPUT: "output",
};


class HistoryElement {
  text;
  type;

  constructor(text, type) {
    this.text = text;
    this.type = type;
  }
}


export default class SchemeInterpreter extends React.Component {
  constructor(props) {
    super(props);

    this.runScheme = this.runScheme.bind(this);
    this.renderHistory = this.renderHistory.bind(this);

    this.state = {
      history: [],
      env: createGlobalFrame(),
    }
  }

  runScheme(s) {
    const history = [...this.state.history];
    const res = readEvalPrintLoop(
      () => new Buffer(tokenizeLines([s])), this.state.env, false);
    history.push(
      new HistoryElement(s, HistoryElementType.INPUT), 
      new HistoryElement(res.join("\n"), HistoryElementType.OUTPUT));
    this.setState({ history });
  }

  renderHistory() {
    return this.state.history.map((h, i) => {
      let lines = h.text.split("\n");
      if (h.type === HistoryElementType.INPUT) {
        lines = lines.map(l => `scm> ${l}`);
      }
      return <pre key={`history-${i}`}>{lines.join("\n")}</pre>
    })
  }

  render() {
    return (
      <div className="interpreter">
        {this.renderHistory()}
        <SchemeInput handleRun={this.runScheme} />
      </div>
    );
  }
}
