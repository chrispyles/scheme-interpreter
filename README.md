# Scheme Interpreter

This project is a web-based Scheme interpreter that runs entirely in the browser. The Scheme intepreter runs [CS 61A Scheme](https://cs61a.org/articles/scheme-spec/), a flavor of Scheme used in UC Berkeley's CS 61A course. The interpreter's structure is loosely based on the Scheme project from that course.

## Running the Interpreter

### In the Browser

The web-based interpreter can be found at [chrispyles.io/scheme-interpreter](https://chrispyles.io/scheme-interpreter).

### In the Terminal

This project also includes a command-line [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop) that can also be used to execute Scheme code. To use it, clone this repository and use `npm` to run the `start` script:

```
git clone https://github.com/chrispyles/scheme-interpreter
cd scheme-interpreter
npm install
npm run start
```

## Repository Structure

This repository is divided into two main components: the `src` directory and the `client` directory.

The `src` directory is a Node.js module that contains the JavaScript code for evaluating Scheme code. It also includes an entrypoint for running a terminal-based REPL to execute code locally. This module is imported in the client to handle code execution in the browser.

The `client` directory contains the code for the front-end website, built with React. This is the code that renders the website and calls the Scheme interpreter to evaluate the code that the user inputs.

The JavaScript and Sass for this site are bundled with webpack, and the JS is transpiled with babel. The site is hosted out of the `gh-pages` branch of this repo, and GitHub Actions is used to automate builds.
