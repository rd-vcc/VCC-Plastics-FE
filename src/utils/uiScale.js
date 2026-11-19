/**
 * Proportional UI scaling for smaller desktop / laptop screens.
 *
 * Every screen was designed on a 1920px-wide browser. On a narrower desktop window (a laptop at
 * 1366 / 1536px, or 1920px with Windows scaling 125-150%) the whole app is shrunk with CSS `zoom`
 * so it keeps exactly the same layout as on the big screen instead of wrapping and overflowing.
 *
 *  - `#root` (and MUI dialogs, which are portalled outside it) get `zoom: var(--app-zoom)`.
 *  - `--app-vh` is the window height in zoomed CSS px: use `var(--app-vh, 100vh)` instead of `100vh`
 *    (a plain 100vh inside a zoomed element is shrunk too and leaves an empty band at the bottom).
 *  - MUI breakpoints are rescaled by the Emotion plugin in `uiScaleEmotion.js`, so `xl` etc. switch
 *    at the same *virtual* width as on the big screen.
 *  - Code that measures with getBoundingClientRect / innerHeight gets visual px: divide by getUiScale().
 *
 * Phones and tablets (< 1024px) are not scaled; they keep their own responsive layout.
 */
export const DESIGN_WIDTH = 1920;
const DESKTOP_MIN_WIDTH = 1024;
const MIN_SCALE = 0.6;
export const UI_SCALE_EVENT = "vcc:ui-scale";

let current = 1;

export function computeUiScale(width = window.innerWidth) {
  if (width < DESKTOP_MIN_WIDTH) return 1;
  const scale = Math.floor((width / DESIGN_WIDTH) * 100) / 100; // 2 decimals, never larger than needed
  return Math.max(MIN_SCALE, Math.min(1, scale));
}

export function getUiScale() {
  return current;
}

function apply() {
  const scale = computeUiScale();
  const root = document.documentElement.style;
  root.setProperty("--app-zoom", String(scale));
  root.setProperty("--app-vh", `${window.innerHeight / scale}px`);
  root.setProperty("--app-vw", `${window.innerWidth / scale}px`);
  const changed = scale !== current;
  current = scale;
  return changed;
}

/**
 * ApexCharts mixes getBoundingClientRect / mouse clientX (screen px) with SVG coordinates (zoomed CSS px),
 * which misplaces annotation labels and tooltips while the page is zoomed. Inside a chart, report both
 * in zoomed CSS px so they agree again. Everything outside charts keeps the browser's normal values.
 */
function patchChartGeometry() {
  const inChart = (node) => current !== 1 && node instanceof Element && node.closest(".apexcharts-canvas");
  const rectOf = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
    const r = rectOf.call(this);
    if (!inChart(this)) return r;
    return new DOMRect(r.x / current, r.y / current, r.width / current, r.height / current);
  };
  for (const key of ["clientX", "clientY"]) {
    const desc = Object.getOwnPropertyDescriptor(MouseEvent.prototype, key);
    if (!desc?.get) continue;
    Object.defineProperty(MouseEvent.prototype, key, {
      configurable: true,
      enumerable: desc.enumerable,
      get() {
        const v = desc.get.call(this);
        return inChart(this.target) ? v / current : v;
      },
    });
  }
}

export function installUiScale() {
  apply();
  patchChartGeometry();
  window.addEventListener("resize", () => {
    if (apply()) window.dispatchEvent(new Event(UI_SCALE_EVENT));
  });
}
