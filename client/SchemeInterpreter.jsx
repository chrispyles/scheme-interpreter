import React from "react";

import { readEvalPrintLoop } from "../src/scheme/scheme.mjs";


export default class SchemeInterpreter extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <p>Scheme interpreter</p>
    );
  }
}
