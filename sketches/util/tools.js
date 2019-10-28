export function zip(...ls) {
  return ls[0].map((_, i) => ls.map(l => l[i]));
}

export function toRad(deg) {
  return (deg / 180) * Math.PI;
}

export function reflect(vertices) {
  return vertices.map(function([x, y]) {
    return [-1 * x, y];
  });
}

export function random2(prng, l, u) {
  return l + (u - l) * prng();
}

export function random2i(prng, l, u) {
  return Math.floor(random2(prng, l, u));
}

export function withChance(prng, threshold, v1, v2) {
  return prng() <= threshold ? v1 : v2;
}

export function clamp(min, max, v) {
  return v < min ? min : v > max ? max : v;
}

export function normalize(vMin, vMax, v) {
  return (v - vMin) / (vMax - vMin);
}
