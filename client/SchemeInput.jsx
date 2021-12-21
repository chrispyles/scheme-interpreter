import React from "react";

import { Button } from "react-bootstrap";

import PropTypes from "prop-types";

import "./SchemeInput.scss";


const propTypes = {
  /** (string) => void */
  handleRun: PropTypes.func.isRequired,
};


export default class SchemeInput extends React.Component {
  constructor(props) {
    super(props);

    this.handleRun = this.handleRun.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.prompt = React.createRef();
    this.textarea = React.createRef();

    this.state = {
      value: "",
    };
  }

  handleRun() {
    this.props.handleRun(this.textarea.current.value);
    this.setState({ value: "" });
  }

  handleKeyPress(e) {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      this.handleRun();
    }
  }

  handleChange(e) {
    this.setState({ value: e.target.value });
  }

  componentDidUpdate() {
    const el = this.textarea.current;
    if (el.scrollHeight > el.clientHeight) {
      el.style.height = `${el.scrollHeight}px`;
      this.prompt.current.style.height = `${el.scrollHeight}px`;
    }
    else {
      el.style.height = null;
      this.prompt.current.style.height = null;
    }
  }

  render() {
    const numLines = this.state.value.split("\n").length;
    const prompts = Array(numLines).fill("scm&gt;").join("<br />");
    return (
      <div className="scheme-input d-flex flex-col">
        <div className="prompt" ref={this.prompt} dangerouslySetInnerHTML={{ __html: prompts }} />
        <textarea
          className="me-1"
          type="text"
          onKeyPress={this.handleKeyPress}
          onChange={this.handleChange}
          value={this.state.value}
          ref={this.textarea} 
        />
        <Button variant="success" onClick={this.handleRun}>Run</Button>
      </div>
    );
  }
}


SchemeInput.propTypes = propTypes;
SchemeInput.displayName = "SchemeInput";
