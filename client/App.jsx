import React from "react";

import SchemeInterpreter from "./SchemeInterpreter";

import 'bootstrap/dist/css/bootstrap.min.css';


export default function App() {
  return (
    <div className="container">
      <h1>Scheme Interpreter</h1>
      <hr />
      <SchemeInterpreter />
    </div>
  );
}
