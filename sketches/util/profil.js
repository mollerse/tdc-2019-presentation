import uuidv4 from "uuid/v4";
import SimplexNoise from "simplex-noise";
import { grid as gridFactory } from "./grid.js";
import {
  random2i as random2iPRNG,
  normalize,
  withChance as withChancePRNG,
  random2 as random2PRNG,
  clamp
} from "./tools";
import Alea from "alea";

const R_COLOR = ["#990014", "#EBCCD0"];
const SV_COLOR = ["#d94abf", "#f5d2ef"];
const AP_COLOR = ["#e51c30", "#f8c6cb"];
const SP_COLOR = ["#a5cd39", "#e1efbe"];
const MDG_COLOR = ["#3d8704", "#d8e7cd"];
const KRF_COLOR = ["#f0b618", "#fae7b3"];
const V_COLOR = ["#24b38c", "#bde8dc"];
const H_COLOR = ["#00b8f1", "#abe8fa"];
const FRP_COLOR = ["#005799", "#ccddeb"];

const PALETTE = [
  SV_COLOR,
  AP_COLOR,
  AP_COLOR,
  R_COLOR,
  KRF_COLOR,
  SP_COLOR,
  MDG_COLOR,
  V_COLOR,
  H_COLOR,
  H_COLOR,
  FRP_COLOR
];

const PALETTE_LR = [
  R_COLOR,
  SV_COLOR,
  MDG_COLOR,
  AP_COLOR,
  AP_COLOR,
  SP_COLOR,
  KRF_COLOR,
  V_COLOR,
  H_COLOR,
  H_COLOR,
  FRP_COLOR
];

function rootSVG(uuid, W, H, content, style) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" id="${uuid}"><style>#${uuid}{margin: auto; overflow: visible;}${style}</style><g>${content}</g></svg>`;
}

function cellSVG({ vertices, translate: [dx, dy], scale }, i) {
  let [[sx, sy], ...rest] = vertices;
  let lines = rest.map(([x, y]) => `L${x} ${y}`).join(" ");
  let scaleString = scale === 0 ? `style="transform: scale(${scale});"` : "";

  return `
    <g transform="translate(${dx}, ${dy})" class="profil-row-${i}">
      <path d="M${sx} ${sy} ${lines} Z" ${scaleString} stroke="none" />
    </g>
  `;
}

function skilleProfil(
  [W, H],
  seed,
  {
    elWidth = 25,
    margin = 4,
    angle = 24,
    elHeightUpperBound = -10,
    elHeightLowerBound = 10,
    columnHeightUpperBound = -10,
    columnHeightLowerBound = 10,
    scaleLowerBound = 1,
    scaleUpperBound = 1,
    colorMode = "RANDOM",
    noise = false
  }
) {
  if (W === 0 || H === 0) return "";

  let uuid = `profil-${uuidv4().split("-")[0]}`;
  let uniforms = {
    width: elWidth,
    margin: margin,
    angle: angle,
    edge: "floor"
  };

  let numberOfCols = Math.floor(W / (uniforms.width + uniforms.margin));
  let actualW = numberOfCols * (uniforms.width + uniforms.margin);
  let leftOverWidth = W - actualW;
  let offsetWidth = leftOverWidth;

  let prng = seed ? new Alea(seed) : new Alea();
  let simplex = new SimplexNoise(seed);

  let withChance = withChancePRNG.bind(null, prng);
  let random2 = random2PRNG.bind(null, prng);
  let random2i = random2iPRNG.bind(null, prng);

  let attributes = {
    elementHeight: () => random2(elHeightLowerBound, elHeightUpperBound),
    columnHeight: function(n) {
      if (noise) {
        return (
          columnHeightLowerBound +
          columnHeightUpperBound * normalize(-1, 1, simplex.noise2D(n * 0.1, 0))
        );
      } else {
        return random2(columnHeightLowerBound, columnHeightUpperBound);
      }
    },
    scaleFn: () => random2(scaleLowerBound, scaleUpperBound)
  };

  let profil = gridFactory([W, H], uniforms, attributes);
  profil = profil.map(col => col.filter(cell => cell.scale > 0));

  let maxNumY = Math.max(...profil.map(c => c.length));

  let style = generateSkilleProfilStyle(
    uuid,
    profil.length,
    maxNumY,
    {
      withChance,
      random2,
      random2i
    },
    [W, H],
    colorMode,
    profil
  );

  style += `#${uuid} > g {transform: translate(${offsetWidth}px, 0);}`;

  let renderedProfil = profil
    .map(
      (col, i) => `<g class="profil-col-${i}">${col.map(cellSVG).join("")}</g>`
    )
    .join("");

  return rootSVG(uuid, W, H + 20, renderedProfil, style, offsetWidth);
}

function generateSkilleProfilStyle(
  uuid,
  numX,
  numY,
  { withChance, random2i },
  [W, H],
  colorMode,
  profil
) {
  let SAT_PALLETTE = PALETTE.map(([v]) => v);
  let BG_PALLETTE = PALETTE.map(([, v]) => v);
  let SAT_LR_PALLETTE = PALETTE_LR.map(([v]) => v);
  let BG_LR_PALLETTE = PALETTE_LR.map(([, v]) => v);
  let numberOfColors = SAT_PALLETTE.length;

  let grid = Array(numX)
    .fill(1)
    .map(() => Array(numY).fill(""));

  for (let i = 0; i < numX; i++) {
    let normalizedX = normalize(0, numX, i);
    let pivot = Math.floor(normalizedX * numberOfColors);

    let color;

    for (let j = 0; j < numY; j++) {
      if (colorMode === "RANDOM") {
        let randomColor = random2i(0, numberOfColors);

        color = withChance(
          0.15,
          BG_PALLETTE[randomColor],
          SAT_PALLETTE[randomColor]
        );
      } else if (colorMode === "LEFTRIGHT") {
        let randomColor = clamp(
          0,
          numberOfColors - 1,
          pivot + withChance(0.33, withChance(0.5, -1, 1), 0)
        );

        color = withChance(
          0.15,
          BG_LR_PALLETTE[randomColor],
          SAT_LR_PALLETTE[randomColor]
        );
      } else if (colorMode === "HUE") {
        let randomColor = clamp(
          0,
          numberOfColors - 1,
          pivot + withChance(0.33, withChance(0.5, -1, 1), 0)
        );

        color = withChance(
          0.15,
          BG_PALLETTE[randomColor],
          SAT_PALLETTE[randomColor]
        );
      }

      let scale = (profil[i][j] && profil[i][j].scale) || 0;
      grid[i][j] = { color, scale };
    }
  }

  function cellStyle(x, y, { scale, color }) {
    return `#${uuid} .profil-col-${x} .profil-row-${y} path {fill: ${color}; transform: scale(${scale});${
      scale === 0 ? " opacity: 0;" : ""
    }}`;
  }

  return grid
    .map(
      (col, x) =>
        `#${uuid} .profil-col-${x} {transform: translate(0, ${(numY -
          profil[x].length) *
          15 *
          0.5}px);}` + col.map((c, y) => cellStyle(x, y, c)).join(" ")
    )
    .join(" ");
}

module.exports = {
  skilleProfil
};
