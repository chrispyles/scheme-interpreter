import React from "react";

import SchemeInterpreter from "./SchemeInterpreter";

import "bootstrap/dist/css/bootstrap.min.css";

import "./App.scss";


export default function App() {
  return (
    <div className="container">
      <div className="header">
        <h1>Scheme Interpreter</h1>
        <p>
          This website is a simple Scheme interpreter written in JavaScript. It supports{" "}
          <a href="https://cs61a.org/articles/scheme-spec/" target="_blank" rel="noreferrer">CS 61A Scheme</a>,{" "}
          a flavor of Scheme used in UC Berkeley&apos;s CS 61A course. The interpreter runs entirely in
          the browser, although there is also a command-line{" "}
          <a href="https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop" target="_blank" rel="noreferrer">REPL</a>{" "}
          that you can use by cloning the repository on{" "}
          <a href="https://github.com/chrispyles/scheme-interpreter" target="_blank" rel="noreferrer">GitHub</a>.
        </p>
        <hr />
      </div>
      <SchemeInterpreter />
    </div>
  );
}
