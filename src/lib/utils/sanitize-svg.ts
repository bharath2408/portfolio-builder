// ─── SVG Sanitizer ───────────────────────────────────────────────
// Parses and cleans SVG content to prevent XSS and other attacks.

const MAX_SVG_SIZE = 100 * 1024; // 100KB

/** Tags allowed in sanitized SVG output */
const ALLOWED_TAGS = new Set([
  "svg",
  "g",
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "text",
  "tspan",
  "defs",
  "clippath",
  "lineargradient",
  "radialgradient",
  "stop",
  "pattern",
  "mask",
  "filter",
  "fegaussianblur",
  "feoffset",
  "femerge",
  "femergenode",
  "fecolormatrix",
  "feblend",
  "feflood",
  "fecomposite",
  "symbol",
  "use",
  "title",
  "desc",
  "marker",
]);

/** Tags that are explicitly dangerous and must be removed */
const DANGEROUS_TAGS = new Set([
  "script",
  "foreignobject",
  "iframe",
  "embed",
  "object",
  "style",
  "link",
  "meta",
]);

export interface SanitizeResult {
  success: boolean;
  svg: string;
  viewBox: string;
  width: number;
  height: number;
  error?: string;
}

/**
 * Sanitize an SVG string by removing dangerous elements and attributes.
 */
export function sanitizeSvg(rawSvg: string): SanitizeResult {
  // Size check
  if (rawSvg.length > MAX_SVG_SIZE) {
    return {
      success: false,
      svg: "",
      viewBox: "0 0 200 200",
      width: 200,
      height: 200,
      error: `SVG exceeds maximum size of ${Math.round(MAX_SVG_SIZE / 1024)}KB`,
    };
  }

  // Parse with DOMParser
  let doc: Document;
  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(rawSvg, "image/svg+xml");

    // Check for parse errors
    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      return {
        success: false,
        svg: "",
        viewBox: "0 0 200 200",
        width: 200,
        height: 200,
        error: "Invalid SVG: could not parse",
      };
    }
  } catch {
    return {
      success: false,
      svg: "",
      viewBox: "0 0 200 200",
      width: 200,
      height: 200,
      error: "Failed to parse SVG",
    };
  }

  const svgElement = doc.querySelector("svg");
  if (!svgElement) {
    return {
      success: false,
      svg: "",
      viewBox: "0 0 200 200",
      width: 200,
      height: 200,
      error: "No <svg> element found",
    };
  }

  // Recursively clean the DOM tree
  cleanElement(svgElement);

  // Extract dimensions
  const viewBox = svgElement.getAttribute("viewBox") ?? "0 0 200 200";
  const widthAttr = svgElement.getAttribute("width");
  const heightAttr = svgElement.getAttribute("height");

  let width = 200;
  let height = 200;

  if (widthAttr) {
    const parsed = parseFloat(widthAttr);
    if (!isNaN(parsed)) width = parsed;
  }
  if (heightAttr) {
    const parsed = parseFloat(heightAttr);
    if (!isNaN(parsed)) height = parsed;
  }

  // If no explicit width/height, try to extract from viewBox
  if (!widthAttr && !heightAttr && viewBox) {
    const parts = viewBox.split(/[\s,]+/);
    if (parts.length === 4) {
      width = parseFloat(parts[2]) || 200;
      height = parseFloat(parts[3]) || 200;
    }
  }

  // Serialize back to string
  const serializer = new XMLSerializer();
  const cleanedSvg = serializer.serializeToString(svgElement);

  return {
    success: true,
    svg: cleanedSvg,
    viewBox,
    width,
    height,
  };
}

/**
 * Recursively clean a DOM element:
 * - Remove dangerous tags
 * - Remove non-whitelisted tags (but keep their children)
 * - Remove event handler attributes
 * - Remove javascript: hrefs
 */
function cleanElement(element: Element): void {
  // Process children first (in reverse to handle removals)
  const children = Array.from(element.children);
  for (const child of children) {
    const tagName = child.tagName.toLowerCase();

    // Remove dangerous tags entirely (including children)
    if (DANGEROUS_TAGS.has(tagName)) {
      child.remove();
      continue;
    }

    // For non-whitelisted tags, unwrap (keep children, remove tag)
    if (!ALLOWED_TAGS.has(tagName)) {
      // Move children to parent before removing
      while (child.firstChild) {
        element.insertBefore(child.firstChild, child);
      }
      child.remove();
      continue;
    }

    // Recursively clean allowed children
    cleanElement(child);
  }

  // Clean attributes on this element
  cleanAttributes(element);
}

/**
 * Remove dangerous attributes from an element.
 */
function cleanAttributes(element: Element): void {
  const attrs = Array.from(element.attributes);
  for (const attr of attrs) {
    const name = attr.name.toLowerCase();

    // Remove all event handler attributes (on*)
    if (name.startsWith("on")) {
      element.removeAttribute(attr.name);
      continue;
    }

    // Remove javascript: hrefs
    if (name === "href" || name === "xlink:href") {
      const value = attr.value.trim().toLowerCase();
      if (value.startsWith("javascript:")) {
        element.removeAttribute(attr.name);
        continue;
      }
      // Remove external URLs in <use> elements
      if (element.tagName.toLowerCase() === "use" && value.startsWith("http")) {
        element.removeAttribute(attr.name);
        continue;
      }
    }

    // Remove data: URIs that aren't images
    if (name === "href" || name === "xlink:href" || name === "src") {
      const value = attr.value.trim().toLowerCase();
      if (
        value.startsWith("data:") &&
        !value.startsWith("data:image/png") &&
        !value.startsWith("data:image/jpeg") &&
        !value.startsWith("data:image/gif") &&
        !value.startsWith("data:image/svg+xml")
      ) {
        element.removeAttribute(attr.name);
        continue;
      }
    }
  }
}
