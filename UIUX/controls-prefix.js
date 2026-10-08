const realDocument = globalThis.document;

function scopedDocument(root) {
  if (!root) throw new Error("Enochian source root is missing");
  return new Proxy(realDocument, {
    get(target, property) {
      if (property === "body" || property === "documentElement") return root;
      if (property === "getElementById") return id => root.querySelector(`#${CSS.escape(id)}`);
      if (property === "querySelectorAll") return selector => root.querySelectorAll(selector);
      if (property === "querySelector") return selector => root.querySelector(selector);
      if (property === "activeElement") return root.contains(target.activeElement) ? target.activeElement : root;
      if (property === "elementFromPoint") return (x, y) => {
        const element = target.elementFromPoint(x, y);
        return root.contains(element) ? element : null;
      };
      const value = target[property];
      return typeof value === "function" ? value.bind(target) : value;
    }
  });
}

function scopedListener(root) {
  return (type, handler, options) => {
    (type === "resize" ? window : root).addEventListener(type, handler, options);
  };
}

function fallbackAnimate(element, values) {
  for (const [name, value] of Object.entries(values)) {
    if (name === "x") element.style.translate = `${value}px 0`;
    else if (name === "y") element.style.translate = `0 ${value}px`;
    else if (name === "rotate") element.style.rotate = `${value}deg`;
    else if (name === "scale") element.style.scale = value;
    else element.style[name] = value;
  }
}

let animate = fallbackAnimate;
const motionPromise = import("https://cdn.jsdelivr.net/npm/motion@11/+esm");
