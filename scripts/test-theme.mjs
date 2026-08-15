/**
 * §18.6 theme-spill assertion, headless: the color spring travels through
 * OKLab, so a mid-transition pixel keeps its chroma instead of collapsing to
 * gray the way a naive sRGB lerp does.
 *   node scripts/test-theme.mjs   (Node ≥ 23 strips types natively)
 */

const { hexToRgb, rgbToOklab, oklabToHex, SpringColor } = await import("../src/motion/oklab.ts");

const failures = [];
const check = (name, ok, detail = "") => {
  if (ok) console.log(`  ok  ${name}${detail ? ` (${detail})` : ""}`);
  else {
    failures.push(name);
    console.error(`FAIL  ${name}${detail ? ` (${detail})` : ""}`);
  }
};

const spread = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  return Math.max(r, g, b) - Math.min(r, g, b);
};

/** OKLab-lerp midpoint of two hex colors. */
function oklabMidpoint(a, b) {
  const [la, aa, ba] = rgbToOklab(hexToRgb(a));
  const [lb, ab, bb] = rgbToOklab(hexToRgb(b));
  return oklabToHex((la + lb) / 2, (aa + ab) / 2, (ba + bb) / 2);
}

// 1. Two saturated accents: the midpoint must stay colorful, not gray.
const accentMid = oklabMidpoint("#307afe", "#88c0d0");
check("accent midpoint retains chroma", spread(accentMid) > 0.06, accentMid);

// 2. Paper → dark: the midpoint is a warm-cool midtone, still tinted.
const paperMid = oklabMidpoint("#f7f4ee", "#2e3440");
check("paper midpoint is tinted, not dead gray", spread(paperMid) > 0.008, paperMid);

// 3. The SpringColor actually interpolates through OKLab: after advancing
//    partway, its value matches the OKLab midpoint far closer than an sRGB
//    lerp would.
const spring = new SpringColor("#307afe", 1);
spring.setTarget("#88c0d0");
for (let i = 0; i < 60; i += 1) spring.advance(1 / 60);
const okMid = hexToRgb(oklabMidpoint("#307afe", "#88c0d0"));
const sMid = {
  r: (hexToRgb("#307afe").r + hexToRgb("#88c0d0").r) / 2,
  g: (hexToRgb("#307afe").g + hexToRgb("#88c0d0").g) / 2,
  b: (hexToRgb("#307afe").b + hexToRgb("#88c0d0").b) / 2,
};
const got = hexToRgb(spring.value);
const dist = (a, b) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
check("spring path follows OKLab, not sRGB", dist(got, okMid) < dist(got, sMid));

if (failures.length) {
  console.error(`\n${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\ntheme spill assertions pass");
