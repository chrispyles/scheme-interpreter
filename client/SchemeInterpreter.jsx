import React from "react";

import { Buffer } from "../src/buffer/buffer.mjs";
import { tokenizeLines } from "../src/scheme/scheme-tokens.mjs";
import { createGlobalFrame, readEvalPrintLoop } from "../src/scheme/scheme.mjs";

import SchemeInput from "./SchemeInput.jsx";

import "./SchemeInterpreter.scss";


export default class SchemeInterpreter extends React.Component {
  constructor(props) {
    super(props);

    this.runScheme = this.runScheme.bind(this);

    this.state = {
      history: [],
      env: createGlobalFrame(),
    }
  }

  runScheme(s) {
    const history = [...this.state.history];
    const res = readEvalPrintLoop(
      () => new Buffer(tokenizeLines([s])), this.state.env, false);
    const scheme = s.split("\n").map(l => `scm> ${l}`);
    history.push(...scheme, ...res);
    this.setState({ history });
  }

  render() {
    return (
      <div className="interpreter">
        {this.state.history.map((h, i) => <pre key={`history-${i}`}>{h}</pre>)}
        <SchemeInput handleRun={this.runScheme} />
      </div>
    );
  }
}
