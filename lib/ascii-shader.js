// ascii-shader.js: seeded GPU fields drawn as ASCII. One seed decides everything: the
// shape, the palette and the motion. A field pass renders the shader at half resolution,
// then an ASCII pass draws one glyph per cell in the field's colour.
//
// The field and colour pipeline (silk and nebula fields, OKLCH palettes, ACES tonemap,
// theme-aware ink space) follows the designs of OpenShaders (openshaders.com).
//
//   const s = createShader(canvas, { seed: "mirage", field: "silk", theme: "dark" })
//   s.setTheme("light"); s.destroy()
//
// Options:
//   seed        string; everything derives from it
//   field       "silk" | "nebula"                    (default "silk")
//   cell        glyph height in CSS px               (default 14)
//   charset     a CHARSETS name                      (default "standard")
//   chars       your own ramp, empty to dense; overrides charset
//   look        { brightness, contrast, coverage, invert, opacity, backdrop, mono, speed }
//   font        CSS font family for the glyphs
//   theme       "dark" | "light"
//   background  { dark: "#rrggbb", light: "#rrggbb" }: must match the page behind it
//   params      partial override of the field params
//   autoplay    false renders only on render(time)
//   onError     (error) => void

export const PARAM_NAMES = [
  "HUE", "HUE_SPREAD", "HUE_TRAVEL", "CHROMA", "LIGHTNESS", "COLOUR_CYCLE", "THETA", "SHEAR", "SHRINK", "LAYERS",
  "WARP_FREQ_X", "WARP_FREQ_Y", "WARP_AMP_X", "WARP_AMP_Y", "ASPECT_X", "ASPECT_Y", "OFFSET_X", "OFFSET_Y", "TILT", "ZOOM",
  "CENTRE_X", "CENTRE_Y", "GLOW_SIZE", "FALLOFF", "VIGNETTE", "FLOW_SPEED", "FLOW_DIRECTION", "BREATH_RATE",
  "BREATH_AMOUNT", "PHASE", "ECHO", "ECHO_SHIFT", "SOFTNESS", "LIGHT_SWING",
];
const camel = (name) => name.toLowerCase().replace(/_(.)/g, (_, c) => c.toUpperCase());

// ───────────────────────────── seeding ─────────────────────────────

function hash2(str) {
  let a = 2166136261, b = 1523705862;
  for (const ch of str) {
    const c = ch.codePointAt(0);
    a = Math.imul(a ^ c, 16777619) >>> 0;
    b = Math.imul(b ^ (c * 40503), 2246822507) >>> 0;
  }
  return [a, b];
}

export function rng(str) {
  let [state, step] = hash2(str);
  step = (step | 1) >>> 0;
  return () => {
    let x = state;
    state = (Math.imul(state, 747796405) + step) >>> 0;
    x = Math.imul(x ^ (x >>> 15), 739982445) >>> 0;
    x = Math.imul(x ^ (x >>> 12), 695872825) >>> 0;
    x = (x ^ (x >>> 15)) >>> 0;
    step = (step + 2654435769) | 1;
    return x / 4294967296;
  };
}

// Muddy OKLCH hues (≈83°–140°) are never used as a base or crossed by a palette arc.
const MUD_LO = 0.23, MUD_HI = 0.39, MUD_MID = 0.31;
const wrap = (h) => ((h % 1) + 1) % 1;
const inMud = (h) => { const t = wrap(h); return t > MUD_LO && t < MUD_HI; };
const crossesMud = (hue, d) => { const t = wrap(MUD_MID - hue); return d > 0 ? t < d : 1 - t < -d; };

function sample(rand) {
  const range = (lo, hi) => lo + (hi - lo) * rand();
  const sign = () => (rand() < 0.5 ? -1 : 1);
  const ang = range(0, Math.PI * 2), rad = range(0.5, 0.7);
  const a = rand() * 0.84;
  const hue = a > MUD_LO ? a + (MUD_HI - MUD_LO) : a;
  const family = rand();
  const spread = family < 0.2 ? range(0, 0.04) * sign() : family < 0.75 ? range(0.1, 0.36) * sign() : range(0.42, 0.5) * sign();
  const ok = (d) => !inMud(hue + d) && !crossesMud(hue, d);
  let d = spread;
  for (const c of [spread, -spread, spread - Math.sign(spread), -spread + Math.sign(spread)]) if (ok(c)) { d = c; break; }
  for (let i = 0; i < 40 && !ok(d); i++) d *= 0.9;
  const softness = rand() < 0.3 ? range(0.0012, 0.0015) : range(0.0016, 0.0028);
  const glowSize = range(0.0015, 0.0028) * (softness / 0.0018);
  const echo = rand() < 0.55 ? 0 : range(0.3, 0.7);
  return {
    hue, hueSpread: d, hueTravel: range(1.4, 2.6), chroma: range(0.08, 0.17), lightness: range(0.48, 0.64),
    colourCycle: range(0.08, 0.24), theta: range(2.108, 2.15), shear: range(0.955, 0.972), shrink: range(0.946, 0.96),
    layers: 70 + Math.floor(rand() * 26), warpFreqX: range(0.3, 0.6), warpFreqY: range(2, 3),
    warpAmpX: range(0.1, 0.16), warpAmpY: range(0.02, 0.035), aspectX: range(1.6, 2.6), aspectY: range(0.13, 0.22),
    offsetX: range(0.3, 0.42), offsetY: range(-0.06, 0.06), tilt: range(-Math.PI, Math.PI), zoom: range(0.9, 1.2),
    centreX: Math.cos(ang) * rad * 1.2, centreY: Math.sin(ang) * rad, glowSize, falloff: range(0.25, 0.5),
    vignette: range(0, 0.15), flowSpeed: range(0.35, 0.63), flowDirection: sign(), breathRate: range(0.35, 0.63),
    breathAmount: range(0.05, 0.12), phase: range(0, 100), echo, echoShift: range(0.12, 0.22) * sign(), softness,
    lightSwing: family < 0.2 ? range(0.24, 0.34) : range(0.12, 0.24),
  };
}

// The critic: a 48×30 scalar CPU render of the silk field, measured for coverage / exposure / clipping.
export function critique(p, W = 48, H = 30) {
  const breath = 0.5, t = p.phase, zoom = p.zoom - breath * p.breathAmount;
  const ct = Math.cos(p.tilt), st = Math.sin(p.tilt), c = Math.cos(p.theta), s = Math.sin(p.theta);
  const ox = p.offsetX + breath * 0.1;
  let lit = 0, blown = 0, sum = 0, sum2 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const px = ((x + 0.5 - W / 2) / H - p.centreX) * zoom, py = ((y + 0.5 - H / 2) / H - p.centreY) * zoom;
    let ux = ct * px - st * py, uy = st * px + ct * py, acc = 0;
    for (let i = 1; i <= p.layers; i++) {
      ux += -Math.sin(uy * p.warpFreqX + t + i * 0.007) * p.warpAmpX;
      uy += -Math.sin(ux * p.warpFreqY - t + i * 0.02) * p.warpAmpY;
      const nx = (c * ux - p.shear * uy) * p.shrink, ny = (s * ux + c * uy) * p.shrink;
      ux = nx; uy = ny;
      const qx = (ux - ox) * p.aspectX, qy = (uy - p.offsetY) * p.aspectY;
      let glow = p.glowSize / (qx * qx + qy * qy + p.softness);
      if (p.echo > 0) { const ex = (ux - ox - p.echoShift) * p.aspectX; glow += p.echo * p.glowSize / (ex * ex + qy * qy + p.softness); }
      glow *= 0.25 + breath * 0.4;
      const r = Math.hypot(ux, uy);
      const k = Math.sin(i * p.colourCycle + t * 1.2 + r * p.hueTravel) * 0.5 + 0.5;
      const L = p.lightness + p.lightSwing * k;
      acc += glow * L * L * L * 2 ** (-r * p.falloff);
    }
    const tone = Math.min(Math.max((acc * (2.51 * acc + 0.03)) / (acc * (2.43 * acc + 0.59) + 0.14), 0), 1) ** 0.9;
    if (tone > 0.1) lit++;
    if (tone > 0.8) blown++;
    sum += tone; sum2 += tone * tone;
  }
  const n = W * H, mean = sum / n;
  return { coverage: lit / n, mean, deviation: Math.sqrt(Math.max(sum2 / n - mean * mean, 0)), blown: blown / n };
}

export const acceptable = ({ coverage, mean, blown }) => coverage >= 0.35 && coverage <= 0.85 && mean >= 0.14 && mean <= 0.42 && blown <= 0.09;

const paramCache = new Map();
export function paramsFor(seed, tries = 16) {
  const key = seed.toLowerCase();
  if (paramCache.has(key)) return { ...paramCache.get(key) };
  const rand = rng(key);
  let best = null;
  for (let i = 0; i < tries; i++) {
    const p = sample(rand), m = critique(p);
    if (acceptable(m)) { best = { p }; break; }
    const dist = Math.abs(m.coverage - 0.6);
    if (!best || dist < best.dist) best = { p, dist };
  }
  if (paramCache.size >= 128) paramCache.delete(paramCache.keys().next().value);
  paramCache.set(key, best.p);
  return { ...best.p };
}

// ───────────────────────────── GLSL ─────────────────────────────

const VERTEX = `#version 300 es
void main() {
  vec2 position = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
}`;

const COMMON = `const float TAU = 6.28318530718;
const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
float ign(vec2 p, float frame) {
  p += 5.588238 * mod(frame, 64.0);
  return fract(52.9829189 * fract(0.06711056 * p.x + 0.00583715 * p.y));
}
uvec3 pcg3d(uvec3 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return v;
}
vec3 hash3(vec3 p) { return vec3(pcg3d(uvec3(ivec3(floor(p)) + 0x4000))) / 4294967295.0; }
`;

const FIELD_HEAD = `#version 300 es
precision highp float;
uniform vec2 iResolution;       // full output resolution
uniform vec2 uFieldPixelScale;  // output px per field px (2.0 at half res)
uniform float iTime;
uniform float uLightMode;
uniform vec3 uDarkBackground;
uniform vec3 uLightBackground;
uniform float uP[34];
out vec4 fragColor;
${PARAM_NAMES.map((n, i) => `#define ${n} uP[${i}]`).join("\n")}
${COMMON}
vec3 oklchToLinear(float L, float C, float h) {
  float a = C * cos(h), b = C * sin(h);
  vec3 lms = vec3(L + 0.3963377774 * a + 0.2158037573 * b,
                  L - 0.1055613458 * a - 0.0638541728 * b,
                  L - 0.0894841775 * a - 1.2914855480 * b);
  lms = lms * lms * lms;
  return mat3(4.0767416621, -1.2684380046, -0.0041960863,
              -3.3077115913, 2.6097574011, -0.7034186147,
              0.2309699292, -0.3413193965, 1.7076147010) * lms;
}
vec3 finish(vec3 color, vec2 pos) {
  vec3 x = max(color, 0.0);
  color = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);   // ACES fit
  color = pow(clamp(color, 0.0, 1.0), vec3(0.85, 0.92, 0.98));          // coloured shadows
  color *= 1.0 - smoothstep(0.5, 1.6, length(pos)) * VIGNETTE;
  vec3 dark = uDarkBackground + color * (1.0 - uDarkBackground);         // screen over page
  float strength = max(color.r, max(color.g, color.b));
  vec3 light = uLightBackground * (1.0 - strength) + color * 0.96;      // ink on paper
  return mix(dark, light, uLightMode);
}
`;

const FIELDS = {
  silk: `
void main() {
  vec2 R = iResolution;
  vec2 pos = (gl_FragCoord.xy * uFieldPixelScale - 0.5 * R) / R.y;
  float t = iTime * FLOW_SPEED * FLOW_DIRECTION + PHASE;
  float breath = (-sin(iTime * BREATH_RATE * 1.5) + sin(iTime * BREATH_RATE + 1.0)) * 0.25 + 0.5;
  vec2 u = (pos - vec2(CENTRE_X, CENTRE_Y)) * (ZOOM - breath * BREATH_AMOUNT);
  float ct = cos(TILT), st = sin(TILT);
  u = mat2(ct, st, -st, ct) * u;
  mat2 fold = mat2(cos(THETA), sin(THETA), -SHEAR, cos(THETA));
  float hue0 = HUE * TAU, hue1 = hue0 + HUE_SPREAD * TAU;
  vec3 color = vec3(0.0);
  for (float i = 1.0; i <= 96.0; i += 1.0) {
    if (i > LAYERS) break;
    u.x += -sin(u.y * WARP_FREQ_X + t + i * 0.007) * WARP_AMP_X;
    u.y += -sin(u.x * WARP_FREQ_Y - t + i * 0.02) * WARP_AMP_Y;
    u = fold * u * SHRINK;
    vec2 q = u - vec2(OFFSET_X + breath * 0.1, OFFSET_Y);
    vec2 s = vec2(q.x * ASPECT_X, q.y * ASPECT_Y);
    float glow = GLOW_SIZE / (dot(s, s) + SOFTNESS);
#ifndef SKIP_ECHO
    vec2 e = vec2((q.x - ECHO_SHIFT) * ASPECT_X, s.y);
    glow += ECHO * GLOW_SIZE / (dot(e, e) + SOFTNESS);
#endif
    glow *= 0.25 + breath * 0.4;
    float r = length(u);
    float k = sin(i * COLOUR_CYCLE + t * 1.2 + r * HUE_TRAVEL) * 0.5 + 0.5;
    vec3 tint = clamp(oklchToLinear(LIGHTNESS + LIGHT_SWING * k, CHROMA * (0.75 + 0.35 * k), mix(hue0, hue1, k)), 0.0, 1.0);
    color += glow * tint * exp2(-r * FALLOFF);
  }
  fragColor = vec4(finish(color, pos), 1.0);
}`,
  // Domain-warped fBm nebula (Quilez warp) driven by the same palette/motion params.
  nebula: `
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 w = f * f * (3.0 - 2.0 * f);
  float a = hash3(vec3(i, 7.0)).x, b = hash3(vec3(i + vec2(1, 0), 7.0)).x;
  float c = hash3(vec3(i + vec2(0, 1), 7.0)).x, d = hash3(vec3(i + vec2(1, 1), 7.0)).x;
  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y);
}
float fbm(vec2 p) {
  const mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = m * p; a *= 0.5; }
  return s;
}
void main() {
  vec2 R = iResolution;
  vec2 pos = (gl_FragCoord.xy * uFieldPixelScale - 0.5 * R) / R.y;
  float t = iTime * FLOW_SPEED * FLOW_DIRECTION * 0.18 + PHASE;
  float breath = (-sin(iTime * BREATH_RATE * 1.5) + sin(iTime * BREATH_RATE + 1.0)) * 0.25 + 0.5;
  float ct = cos(TILT), st = sin(TILT);
  vec2 p = mat2(ct, st, -st, ct) * (pos - 0.25 * vec2(CENTRE_X, CENTRE_Y)) * (1.1 * ZOOM - breath * BREATH_AMOUNT);
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + 0.6 * t), fbm(p + 3.0 * q + vec2(8.3, 2.8) - 0.5 * t));
  float f = fbm(p + 3.0 * r);
  // Palette coordinate follows the warp structure, not just the final density.
  float k = clamp(0.15 + 1.1 * f * f + 0.5 * (length(q) - 0.6) + 0.3 * r.x, 0.0, 1.0);
  float hue0 = HUE * TAU, hue1 = hue0 + HUE_SPREAD * TAU;
  vec3 tint = clamp(oklchToLinear(LIGHTNESS + LIGHT_SWING * k, CHROMA * (0.75 + 0.35 * k), mix(hue0, hue1, k)), 0.0, 1.0);
  // HDR density: soft body plus a Lorentzian ridge where the second warp layer folds over.
  float body = smoothstep(0.42, 0.85, f);
  float ridge = (GLOW_SIZE / SOFTNESS) * 0.0015 / ((r.x - 0.55) * (r.x - 0.55) + 0.0015);
  vec3 color = tint * (body * body * body * 1.8 + ridge * body * 0.35) * (0.65 + 0.35 * breath) * exp2(-length(pos) * FALLOFF);
  fragColor = vec4(finish(color, pos), 1.0);
}`,
};

const POST_HEAD = `#version 300 es
precision highp float;
uniform highp sampler2D tScene;
uniform sampler2D tGlyphs;
uniform vec2 iResolution;
uniform float iTime;
uniform float uLightMode;
uniform vec3 uDarkBackground;
uniform vec3 uLightBackground;
uniform float uPixelRatio;
uniform vec2 uTilt;
uniform float uStrength;
uniform float uScale;
uniform float uSeed;
uniform float uFinal;
uniform float uBrightness;
uniform float uContrast;
uniform float uCoverage;
uniform float uInvert;
uniform float uOpacity;
uniform float uBackdrop;
uniform float uMono;
uniform vec3 uMonoColor;
out vec4 fragColor;
${COMMON}
vec3 toInk(vec3 c) { return mix(c - uDarkBackground, uLightBackground - c, uLightMode); }
vec3 fromInk(vec3 ink) { return mix(uDarkBackground + ink, uLightBackground - ink, uLightMode); }
// 9-tap Catmull-Rom: exact at texel centres, smooth when the scene is lower resolution.
vec3 sceneInk(vec2 uv) {
  vec2 size = vec2(textureSize(tScene, 0));
  vec2 p = clamp(uv, 0.0, 1.0) * size;
  vec2 p1 = floor(p - 0.5) + 0.5;
  vec2 f = p - p1;
  vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
  vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
  vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));
  vec2 w3 = f * f * (-0.5 + 0.5 * f);
  vec2 w12 = w1 + w2;
  vec2 p12 = (p1 + w2 / w12) / size, p0 = (p1 - 1.0) / size, p3 = (p1 + 2.0) / size;
  vec3 c = texture(tScene, vec2(p0.x, p0.y)).rgb * w0.x * w0.y
    + texture(tScene, vec2(p12.x, p0.y)).rgb * w12.x * w0.y
    + texture(tScene, vec2(p3.x, p0.y)).rgb * w3.x * w0.y
    + texture(tScene, vec2(p0.x, p12.y)).rgb * w0.x * w12.y
    + texture(tScene, vec2(p12.x, p12.y)).rgb * w12.x * w12.y
    + texture(tScene, vec2(p3.x, p12.y)).rgb * w3.x * w12.y
    + texture(tScene, vec2(p0.x, p3.y)).rgb * w0.x * w3.y
    + texture(tScene, vec2(p12.x, p3.y)).rgb * w12.x * w3.y
    + texture(tScene, vec2(p3.x, p3.y)).rgb * w3.x * w3.y;
  return toInk(c);
}
const mat4 BAYER = mat4(0.94118, 0.29412, 0.76471, 0.05882, 0.47059, 0.70588, 0.23529, 0.52941,
                        0.82353, 0.11765, 0.88235, 0.17647, 0.35294, 0.58824, 0.41176, 0.64706);
`;

// Real glyphs on the page: each cell takes the field's colour, its brightness picks the glyph,
// and nothing is drawn between glyphs, so unlit cells are exactly the background.
const ASCII = `vec3 effect(vec2 frag) {
  float h = floor(uScale * uPixelRatio + 0.5);
  vec2 cellPx = vec2(floor(h * 0.6 + 0.5), h);
  vec2 cell = floor(frag / cellPx);
  vec2 centre = (cell + 0.5) * cellPx;
  vec3 ink = sceneInk(centre / iResolution) * 2.0;
  ink += sceneInk((centre + cellPx * vec2(0.3, 0.3)) / iResolution);
  ink += sceneInk((centre + cellPx * vec2(-0.3, 0.3)) / iResolution);
  ink += sceneInk((centre + cellPx * vec2(0.3, -0.3)) / iResolution);
  ink += sceneInk((centre + cellPx * vec2(-0.3, -0.3)) / iResolution);
  ink /= 6.0;
  float level = clamp(dot(ink, LUMA) * mix(1.8, 3.2, uLightMode), 0.0, 1.0);
  level = clamp((level - 0.5) * (1.0 + uContrast) + 0.5 + uBrightness, 0.0, 1.0);
  // Coverage hides the dimmest cells; invert swaps which end of the ramp is dense.
  float shown = step(1.0 - uCoverage, level + 1e-4);
  float pick = mix(level, 1.0 - level, uInvert);
  float glyph = floor(pow(pick, 0.75) * (GLYPHS - 1.0) + 0.5);
  vec2 local = clamp((frag - cell * cellPx) / cellPx, vec2(0.12, 0.04), vec2(0.88, 0.96));
  float mask = texture(tGlyphs, vec2((glyph + local.x) / GLYPHS, local.y)).r;
  vec3 tint = ink / max(max(ink.r, max(ink.g, ink.b)), 1e-3);
  vec3 colour = mix(tint, max(toInk(uMonoColor), vec3(0.0)), uMono);
  vec3 glyphs = colour * mask * mix(0.45, 1.0, sqrt(max(level, pick))) * uOpacity * shown;
  return glyphs + sceneInk(frag / iResolution) * uBackdrop;
}`;

// Character ramps, from empty to dense.
export const CHARSETS = {
  standard: " .:-=+*#%@",
  classic: " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  minimal: " .:+#",
  blocks: " ░▒▓█",
  braille: "⠀⠁⠃⠇⠏⠟⠿⡿⣿",
  dots: " ·•●",
  geometric: " ·∘○◎●",
  binary: " 10",
  numeric: " 1723456890",
  hacker: " ._-=+*<>{}#$@",
  katakana: " ･ｰｼﾂｿﾝﾐﾊﾑﾒ",
}

const postSource = (ramp) => `${POST_HEAD}
const float GLYPHS = ${[...ramp].length}.0;
${ASCII}
void main() {
  fragColor = vec4(clamp(fromInk(clamp(effect(gl_FragCoord.xy), 0.0, 1.0)), 0.0, 1.0), 1.0);
}`;

// ───────────────────────────── WebGL plumbing ─────────────────────────────

function parseHex(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Background colours must be #rrggbb, got "${hex}".`);
  return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255);
}

function compile(gl, fragment, label) {
  const program = gl.createProgram();
  for (const [type, src] of [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, fragment]]) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(`${label} failed to compile: ${gl.getShaderInfoLog(shader)}`);
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(`${label} failed to link: ${gl.getProgramInfoLog(program)}`);
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS), loc = {};
  for (let i = 0; i < count; i++) {
    const name = gl.getActiveUniform(program, i).name.replace(/\[0\]$/, "");
    loc[name] = gl.getUniformLocation(program, name);
  }
  return { program, loc };
}

function glyphAtlas(gl, font, ramp) {
  const glyphs = [...ramp], cw = 48, ch = 80;
  const canvas = document.createElement("canvas");
  canvas.width = cw * glyphs.length; canvas.height = ch;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, ch);
  ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = `500 62px ${font}`;
  // Shade blocks are painted as solid fills so they tile without seams in any font.
  const shades = { "░": 0.25, "▒": 0.5, "▓": 0.75, "█": 1 };
  for (let i = 0; i < glyphs.length; i++) {
    const shade = shades[glyphs[i]];
    if (shade === undefined) ctx.fillText(glyphs[i], i * cw + cw / 2, ch / 2 + ch * 0.04);
    else { ctx.globalAlpha = shade; ctx.fillRect(i * cw, 0, cw, ch); ctx.globalAlpha = 1; }
  }
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

const MAX_PIXELS = 2_400_000;
const FRAME_MS = 1000 / 60;

export function createShader(canvas, options = {}) {
  const seed = options.seed ?? "openshaders";
  const params = { ...paramsFor(seed), ...options.params };
  const traits = { strength: 1, scale: options.cell ?? 14, seed: rng(`${seed}\u0000ascii`)() };
  const chain = ["ascii"];
  const ramp = options.chars || CHARSETS[options.charset ?? "standard"] || CHARSETS.standard;
  if ([...ramp].length < 2) throw new Error("chars needs at least two characters, from empty to dense.");
  // Live look: changing these never recompiles.
  const look = { brightness: 0, contrast: 0, coverage: 1, invert: false, opacity: 1, backdrop: 0, mono: null, speed: 1, ...options.look };
  const fieldKind = options.field ?? "silk";
  if (!FIELDS[fieldKind]) throw new Error(`Unknown field "${fieldKind}".`);
  const fieldScale = Math.min(1, Math.max(0.25, options.fieldScale ?? 0.5));
  const dark = parseHex(options.background?.dark ?? "#090909");
  const light = parseHex(options.background?.light ?? "#ffffff");

  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false });
  if (!gl) throw new Error("WebGL2 is not available in this browser.");
  const floatTargets = !!gl.getExtension("EXT_color_buffer_float");
  const maxDimension = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));

  let field, posts, glyphs, targets;
  function build() {
    const define = params.echo === 0 && fieldKind === "silk" ? "#define SKIP_ECHO\n" : "";
    field = compile(gl, FIELD_HEAD.replace("precision highp float;\n", `precision highp float;\n${define}`) + FIELDS[fieldKind], `Field (${fieldKind})`);
    gl.useProgram(field.program);
    gl.uniform1fv(field.loc.uP, new Float32Array(PARAM_NAMES.map((n) => params[camel(n)])));
    posts = [compile(gl, postSource(ramp), "ASCII")];
    glyphs = glyphAtlas(gl, options.font ?? "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", ramp);
    targets = [];
  }

  // Render targets: [0] = field (scaled), [1],[2] = ping-pong for chained effects.
  function target(i, w, h) {
    let t = targets[i];
    if (t && t.w === w && t.h === h) return t;
    if (t) { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fbo); }
    const tex = gl.createTexture(), fbo = gl.createFramebuffer();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, floatTargets ? gl.RGBA16F : gl.RGBA8, w, h, 0, gl.RGBA, floatTargets ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("Render target incomplete.");
    return (targets[i] = { tex, fbo, w, h });
  }

  function common(loc, time, mode) {
    gl.uniform1f(loc.iTime, time);
    gl.uniform1f(loc.uLightMode, mode);
    gl.uniform3fv(loc.uDarkBackground, dark);
    gl.uniform3fv(loc.uLightBackground, light);
  }

  function drawThemed(time, mode, tilt, pixelRatio, blend) {
    const W = canvas.width, H = canvas.height;
    const fw = Math.max(1, Math.round(W * fieldScale)), fh = Math.max(1, Math.round(H * fieldScale));
    gl.disable(gl.BLEND);
    const f = target(0, fw, fh);
    gl.bindFramebuffer(gl.FRAMEBUFFER, f.fbo);
    gl.viewport(0, 0, fw, fh);
    gl.useProgram(field.program);
    common(field.loc, time, mode);
    gl.uniform2f(field.loc.iResolution, W, H);
    gl.uniform2f(field.loc.uFieldPixelScale, W / fw, H / fh);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    let source = f.tex;
    posts.forEach(({ program, loc }, i) => {
      const last = i === posts.length - 1;
      const out = last ? null : target(1 + (i % 2), W, H);
      gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.fbo : null);
      gl.viewport(0, 0, W, H);
      gl.useProgram(program);
      common(loc, time, mode);
      gl.uniform2f(loc.iResolution, W, H);
      gl.uniform1f(loc.uPixelRatio, pixelRatio);
      gl.uniform2fv(loc.uTilt, tilt);
      gl.uniform1f(loc.uStrength, traits.strength);
      gl.uniform1f(loc.uScale, traits.scale);
      gl.uniform1f(loc.uSeed, traits.seed);
      gl.uniform1f(loc.uFinal, last ? 1 : 0);
      gl.uniform1f(loc.uBrightness, look.brightness);
      gl.uniform1f(loc.uContrast, look.contrast);
      gl.uniform1f(loc.uCoverage, look.coverage);
      gl.uniform1f(loc.uInvert, look.invert ? 1 : 0);
      gl.uniform1f(loc.uOpacity, look.opacity);
      gl.uniform1f(loc.uBackdrop, look.backdrop);
      gl.uniform1f(loc.uMono, look.mono ? 1 : 0);
      gl.uniform3fv(loc.uMonoColor, look.mono ?? [0, 0, 0]);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, source);
      gl.uniform1i(loc.tScene, 0);
      if (glyphs) { gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, glyphs); gl.uniform1i(loc.tGlyphs, 1); }
      if (last && blend) gl.enable(gl.BLEND);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (out) source = out.tex;
    });
    gl.disable(gl.BLEND);
  }

  function draw(time, theme, tilt, pixelRatio) {
    if (theme <= 0 || theme >= 1) return drawThemed(time, theme, tilt, pixelRatio, false);
    drawThemed(time, 0, tilt, pixelRatio, false);
    gl.blendColor(0, 0, 0, theme);
    gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA);
    drawThemed(time, 1, tilt, pixelRatio, true);   // true cross-dissolve of both themed renders
  }

  function release() {
    if (!field) return;
    gl.deleteProgram(field.program);
    for (const p of posts) gl.deleteProgram(p.program);
    for (const t of targets) if (t) { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fbo); }
    if (glyphs) gl.deleteTexture(glyphs);
    field = null;
  }

  build();

  // ── animation loop: pixel budget, dt clamp, eased theme/tilt, pausing, reduced motion, 60 fps cap
  const autoplay = options.autoplay !== false;
  const stillness = matchMedia("(prefers-reduced-motion: reduce)");
  const pointerless = matchMedia("(hover: none), (prefers-reduced-motion: reduce)");
  let width = canvas.clientWidth, height = canvas.clientHeight, visible = true, disposed = false, lost = false;
  let targetTheme = options.theme === "light" ? 1 : 0, theme = targetTheme;
  let raf = 0, elapsed = 0, lastTime = 0, previous = null, nextAt = -Infinity;
  let fixedTilt = options.tilt ?? null;
  const lean = { x: 0, y: 0 }, aim = { x: 0, y: 0 };
  let ratio = devicePixelRatio || 1, ratioQuery = matchMedia(`(resolution: ${ratio}dppx)`);

  const canDraw = () => !disposed && !lost && !document.hidden && visible && width > 0 && height > 0;
  function fit() {
    const scale = Math.min(ratio, 2, Math.sqrt(MAX_PIXELS / (width * height)), maxDimension / width, maxDimension / height);
    const w = Math.max(1, Math.floor(width * scale)), h = Math.max(1, Math.floor(height * scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    return w / width;
  }
  function render(time) {
    lastTime = time;
    if (!canDraw()) return;
    try { draw(time, theme, fixedTilt ?? [lean.x, lean.y], fit()); }
    catch (error) { destroy(); (options.onError ?? console.error)(error instanceof Error ? error : new Error(String(error))); }
  }
  const schedule = () => { if (!raf && canDraw()) raf = requestAnimationFrame(tick); };
  function refresh() { if (canDraw()) schedule(); else { cancelAnimationFrame(raf); raf = 0; previous = null; } }
  function tick(now) {
    raf = 0;
    if (!canDraw()) { previous = null; return; }
    const dt = previous === null ? 0 : Math.min((now - previous) / 1000, 0.1);
    previous = now;
    if (autoplay) {
      if (!stillness.matches) elapsed += dt * look.speed;
      theme += (targetTheme - theme) * (1 - Math.exp(-dt * 7));
      if (Math.abs(targetTheme - theme) < 0.002) theme = targetTheme;
      const ease = 1 - Math.exp(-dt * 8);
      lean.x += (aim.x - lean.x) * ease; lean.y += (aim.y - lean.y) * ease;
      if (Math.abs(aim.x - lean.x) < 1e-4) lean.x = aim.x;
      if (Math.abs(aim.y - lean.y) < 1e-4) lean.y = aim.y;
    }
    if (now >= nextAt - 0.5) {
      render(autoplay ? elapsed : lastTime);
      nextAt = Number.isFinite(nextAt) ? nextAt + Math.max(1, Math.floor((now - nextAt) / FRAME_MS) + 1) * FRAME_MS : now + FRAME_MS;
    }
    const moving = theme !== targetTheme || (fixedTilt === null && (lean.x !== aim.x || lean.y !== aim.y));
    if (autoplay && (!stillness.matches || moving)) schedule(); else previous = null;
  }
  function move(e) {
    if (!canDraw() || pointerless.matches) return;
    const box = canvas.getBoundingClientRect();
    aim.x = Math.max(-1, Math.min(1, (e.clientX - (box.left + box.width / 2)) / (innerWidth / 2)));
    aim.y = Math.max(-1, Math.min(1, (e.clientY - (box.top + box.height / 2)) / (innerHeight / 2)));
    autoplay ? refresh() : ((lean.x = aim.x), (lean.y = aim.y), render(lastTime));
  }
  const leave = () => { aim.x = 0; aim.y = 0; refresh(); };
  function ratioChanged() {
    ratioQuery.removeEventListener("change", ratioChanged);
    ratio = devicePixelRatio || 1;
    ratioQuery = matchMedia(`(resolution: ${ratio}dppx)`);
    ratioQuery.addEventListener("change", ratioChanged);
    refresh();
  }
  const onLost = (e) => { e.preventDefault(); lost = true; field = null; cancelAnimationFrame(raf); raf = 0; previous = null; };
  const onRestored = () => { lost = false; build(); refresh(); };
  const resize = new ResizeObserver(([entry]) => {
    const r = entry.contentRect;
    if (r.width === width && r.height === height) return;
    width = r.width; height = r.height;
    autoplay ? refresh() : render(lastTime);
  });
  const intersect = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; refresh(); });

  function destroy() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    resize.disconnect(); intersect.disconnect();
    ratioQuery.removeEventListener("change", ratioChanged);
    stillness.removeEventListener("change", refresh);
    document.removeEventListener("visibilitychange", refresh);
    removeEventListener("pointermove", move);
    document.documentElement.removeEventListener("pointerleave", leave);
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
    if (!lost) release();
  }

  resize.observe(canvas); intersect.observe(canvas);
  ratioQuery.addEventListener("change", ratioChanged);
  stillness.addEventListener("change", refresh);
  document.addEventListener("visibilitychange", refresh);
  addEventListener("pointermove", move, { passive: true });
  document.documentElement.addEventListener("pointerleave", leave);
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  schedule();

  return {
    params, field: fieldKind, quality: critique(params),
    setTheme(next) { targetTheme = next === "light" ? 1 : 0; if (autoplay) refresh(); else { theme = targetTheme; render(lastTime); } },
    /** Update brightness, contrast, coverage, invert, opacity, backdrop, mono ([r,g,b] 0–1 or null) or speed. */
    set(next) { Object.assign(look, next); render(autoplay ? elapsed : lastTime); refresh(); },
    setTilt(next) { fixedTilt = next ?? null; autoplay ? refresh() : render(lastTime); },
    render(time) { theme = targetTheme; render(time); },
    destroy,
  };
}
