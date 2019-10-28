import uuidv4 from "uuid/v4";

import { skilleProfil } from "./util/profil";

const NAME = "PROFILDEMO";

let EL_WIDTH = 32;
let EL_DEG = 24;
let EL_PADDING = 5;
let TOTAL_WIDTH = 800;
let TOTAL_HEIGHT = 200;
let EXTRA_HEIGHT_LOWER_BOUND = 0;
let EXTRA_HEIGHT_UPPER_BOUND = 0;
let COLUMN_HEIGHT_LOWER_BOUND = 200;
let SCALE_LOWER_BOUND = 1;
let SCALE_UPPER_BOUND = 1;

let SEED = "";
let CANVAS;

let c;

const COLOR_MODES = ["RANDOM", "LEFTRIGHT", "HUE"];
let COLOR_MODE = 0;

let NOISE = false;

function initControls(controls, defaultValues) {
  c = controls;

  COLOR_MODE = defaultValues["COLOR_MODE"];
  NOISE = defaultValues["NOISE"];

  try {
    c.loadScheme(NAME);
  } catch (e) {
    c.addScheme(NAME)
      .addNumberValue(
        "total width",
        [defaultValues["TOTAL_WIDTH"], 1, 2000, 25],
        {
          triggerId: 21,
          onChange: initData
        }
      )
      .addNumberValue(
        "total height",
        [defaultValues["TOTAL_HEIGHT"], 1, 500, 5],
        {
          triggerId: 22,
          onChange: initData
        }
      )
      .addNumberValue("element width", [defaultValues["EL_WIDTH"], 1, 200, 1], {
        triggerId: 23,
        onChange: initData
      })
      .addNumberValue("element angle", [defaultValues["EL_DEG"], 1, 89, 1], {
        triggerId: 24,
        onChange: initData
      })
      .addNumberValue(
        "element margin",
        [defaultValues["EL_PADDING"], -5, 20, 1],
        {
          triggerId: 25,
          onChange: initData
        }
      )
      .addNumberValue(
        "extra element height lower bound",
        [defaultValues["EXTRA_HEIGHT_LOWER_BOUND"], -15, 20, 1],
        {
          onChange: initData,
          triggerId: 41
        }
      )
      .addNumberValue(
        "extra element height upper bound",
        [defaultValues["EXTRA_HEIGHT_UPPER_BOUND"], -15, 20, 1],
        {
          onChange: initData,
          triggerId: 42
        }
      )
      .addNumberValue(
        "column height lower bound",
        [defaultValues["COLUMN_HEIGHT_LOWER_BOUND"], 0, 500, 1],
        {
          onChange: initData,
          triggerId: 43
        }
      )
      .addNumberValue(
        "element scale lower bound",
        [defaultValues["SCALE_LOWER_BOUND"], 0.01, 1, 0.01],
        {
          onChange: initData,
          triggerId: 44
        }
      )
      .addNumberValue(
        "element scale upper bound",
        [defaultValues["SCALE_UPPER_BOUND"], 0.01, 1, 0.01],
        {
          onChange: initData,
          triggerId: 45
        }
      )
      .addBooleanValue("regen", [false], {
        triggerId: 9,
        onChange: () => {
          initData();
          render();
        }
      })
      .addBooleanValue("color", [false], {
        triggerId: 10,
        onChange: () => {
          COLOR_MODE += 1;
          if (COLOR_MODE >= COLOR_MODES.length) COLOR_MODE = 0;
        }
      })
      .addBooleanValue("noise", [false], {
        triggerId: 11,
        onChange: () => {
          NOISE = !NOISE;
        }
      });
  }
}

function initData() {
  EL_WIDTH = c.getValue("element width");
  EL_DEG = c.getValue("element angle");
  EL_PADDING = c.getValue("element margin");
  TOTAL_HEIGHT = c.getValue("total height");
  TOTAL_WIDTH = c.getValue("total width");
  EXTRA_HEIGHT_LOWER_BOUND = c.getValue("extra element height lower bound");
  EXTRA_HEIGHT_UPPER_BOUND = c.getValue("extra element height upper bound");
  COLUMN_HEIGHT_LOWER_BOUND = c.getValue("column height lower bound");
  SCALE_LOWER_BOUND = c.getValue("element scale lower bound");
  SCALE_UPPER_BOUND = c.getValue("element scale upper bound");

  SEED = uuidv4();
}

function init(canvas, controls, defaultValues) {
  initControls(controls, defaultValues);
  initData();
  CANVAS = canvas;
  render();
}

let RAF_ID = 0;
function render(canvas) {
  let t0 = 0;
  function loop(t) {
    RAF_ID = requestAnimationFrame(loop);

    if (t0 && t - t0 < 33) return;
    t0 = t;

    let element = skilleProfil([TOTAL_WIDTH, TOTAL_HEIGHT], SEED, {
      elWidth: EL_WIDTH,
      margin: EL_PADDING,
      angle: EL_DEG,
      elHeightLowerBound: EXTRA_HEIGHT_LOWER_BOUND,
      elHeightUpperBound: EXTRA_HEIGHT_UPPER_BOUND,
      columnHeightLowerBound: COLUMN_HEIGHT_LOWER_BOUND,
      columnHeightUpperBound: TOTAL_HEIGHT,
      scaleLowerBound: SCALE_LOWER_BOUND,
      scaleUpperBound: SCALE_UPPER_BOUND,
      colorMode: COLOR_MODES[COLOR_MODE],
      noise: NOISE
    });

    CANVAS.innerHTML = element;
  }

  loop();
}

export function start(canvas, controls, defaultValues) {
  init(canvas, controls, defaultValues);
}

export function stop() {
  c.removeScheme(NAME);
  RAF_ID && cancelAnimationFrame(RAF_ID);
}
