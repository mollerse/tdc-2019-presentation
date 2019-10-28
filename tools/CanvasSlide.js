import React from "react";
import {
  start as profildemoStart,
  stop as profildemoStop
} from "../sketches/profildemo.js";

let sketches = {
  profildemo: {
    start: profildemoStart,
    stop: profildemoStop
  }
};

export default class CanvasSlide extends React.Component {
  componentDidMount() {
    const canvas = this._output;

    canvas.style.position = "static";
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.display = "flex";
    canvas.style.justifyContent = "center";
    canvas.style.alignItems = "center";
    canvas.style.width = `100%`;
    canvas.style.height = `100%`;

    this.canvas = canvas;

    document.body.classList.add("show-controls");

    let { controls, sketch, defaultValues } = this.props;
    sketches[sketch].start(canvas, controls, defaultValues);
  }

  componentWillUnmount() {
    sketches[this.props.sketch].stop();
    document.body.classList.remove("show-controls");
  }

  render() {
    return <div ref={el => (this._output = el)} />;
  }
}
