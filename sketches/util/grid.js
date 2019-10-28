import { zip, toRad, reflect } from "./tools";

function gridCell(width, extraHeight, angle, ccw, translate, scale) {
  let baseHeight = 2 * width * Math.sin(toRad(angle));

  let x1 = 0 - width / 2;
  let x2 = 0 + width / 2;
  let x3 = x2;
  let x4 = x1;

  let xs = [x1, x2, x3, x4];

  let y1 = 0 - extraHeight / 2;
  let y2 = 0 - baseHeight / 2 - extraHeight / 2;
  let y3 = y1 + extraHeight;
  let y4 = 0 + baseHeight / 2 + extraHeight / 2;

  let ys = [y1, y2, y3, y4];

  let vertices = zip(xs, ys);

  if (ccw) vertices = reflect(vertices);

  return { vertices, translate, scale };
}

function gridColumn(colNumber, maxHeight, uniforms, attributes) {
  let { width, angle, margin } = uniforms;
  let { elementHeight, columnHeight, scaleFn } = attributes;

  let baseHeight = width * Math.sin(toRad(angle));
  let rowNumbers = Math.ceil(maxHeight / (baseHeight + margin));
  let ccw = colNumber % 2 === 0;

  let colHeight = columnHeight(colNumber);

  let x0 = width / 2 - margin + colNumber * (width + margin);
  let y0 = baseHeight - margin;

  let heightSoFar = y0;

  return Array(rowNumbers)
    .fill(1)
    .map(function(_, rowNumber) {
      let extraHeight = elementHeight([colNumber, rowNumber]);
      let elHeight = extraHeight + baseHeight + margin;
      let scale = heightSoFar > colHeight ? 0 : scaleFn([colNumber, rowNumber]);

      let yMax = heightSoFar + elHeight;
      let yCenter = heightSoFar + 0.5 * elHeight;

      let translate = [x0, yCenter];

      heightSoFar = yMax;

      return gridCell(width, extraHeight, angle, ccw, translate, scale);
    });
}

export function grid([width, height], uniforms, attributes) {
  let { width: elWidth, margin, edge } = uniforms;

  let columNumbers = Math[edge === "floor" ? "floor" : "ceil"](
    width / (elWidth + margin)
  );

  return Array(columNumbers)
    .fill(1)
    .map(function(_, colNumber) {
      return gridColumn(colNumber, height, uniforms, attributes);
    });
}
