import { useCallback, useLayoutEffect, useState } from "react";
import { getUiScale } from "../utils/uiScale";

// Space kept free below a page's main panels (tree / list / detail), in px.
export const PAGE_BOTTOM_GAP = 16;

/**
 * Makes a block of panels stretch down to the bottom of the window, leaving only
 * PAGE_BOTTOM_GAP px free. Attach `ref` to the element whose top is measured and use
 * `height` for the panels. Re-measures on window resize / zoom and whenever the content
 * above it changes height (KPI cards, filters, ...).
 *
 *   const [panelsRef, panelHeight] = useFillHeight();
 *   <Box ref={panelsRef}> <Paper sx={{ height: panelHeight }} /> </Box>
 */
export default function useFillHeight({ bottomGap = PAGE_BOTTOM_GAP, min = 480 } = {}) {
  const [node, setNode] = useState(null);
  const [height, setHeight] = useState(min);

  const measure = useCallback(() => {
    if (!node) return;
    // document position, so scrolling the page does not change the result
    // rects / innerHeight are in screen px; the page is zoomed by the UI scale (see utils/uiScale)
    const top = node.getBoundingClientRect().top + window.scrollY;
    setHeight(Math.max(min, Math.floor((window.innerHeight - top) / getUiScale() - bottomGap)));
  }, [node, bottomGap, min]);

  useLayoutEffect(() => {
    if (!node) return undefined;
    measure();
    window.addEventListener("resize", measure);
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(document.body);
    return () => {
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [node, measure]);

  return [setNode, height];
}
