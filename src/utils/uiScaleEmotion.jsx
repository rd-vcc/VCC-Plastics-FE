import { useEffect, useState } from "react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { prefixer } from "stylis";
import { UI_SCALE_EVENT, getUiScale } from "./uiScale";

// Rewrites `@media (min-width:1536px)` to the matching *real* width while the UI is zoomed, so MUI
// breakpoints (sx={{ xl: ... }}) switch at the same virtual width as on the 1920px design screen.
function mediaScaler(scale) {
  const re = /((?:min|max)-width\s*:\s*)([\d.]+)px/g;
  return (element) => {
    if (scale === 1 || element.type !== "@media") return;
    const fix = (s) => s.replace(re, (_, k, v) => `${k}${(parseFloat(v) * scale).toFixed(2)}px`);
    element.value = fix(element.value);
    if (Array.isArray(element.props)) element.props = element.props.map(fix);
  };
}

const caches = new Map();
function cacheFor(scale) {
  if (!caches.has(scale)) {
    // Emotion keys may only contain lowercase letters: 0.71 -> "muihb"
    const key = `mui${String(Math.round(scale * 100)).replace(/\d/g, (d) => "abcdefghij"[d])}`;
    caches.set(scale, createCache({ key, stylisPlugins: [mediaScaler(scale), prefixer] }));
  }
  return caches.get(scale);
}

/** Emotion cache that follows the current UI scale (a new cache, i.e. fresh styles, when it changes). */
export default function UiScaleStyles({ children }) {
  const [scale, setScale] = useState(getUiScale());
  useEffect(() => {
    const onChange = () => setScale(getUiScale());
    window.addEventListener(UI_SCALE_EVENT, onChange);
    return () => window.removeEventListener(UI_SCALE_EVENT, onChange);
  }, []);
  return <CacheProvider value={cacheFor(scale)}>{children}</CacheProvider>;
}
