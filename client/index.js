import React from "react";
import ReactDOM from "react-dom";


import App from "./App.jsx";


ReactDOM.render(
  React.createElement(React.StrictMode, {}, React.createElement(App)),
  document.getElementById("react-target")
);
