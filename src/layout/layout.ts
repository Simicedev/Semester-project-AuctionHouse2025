// Layout & rendering helpers
export type Renderable = string | HTMLElement | DocumentFragment;

// Get (or create) the main outlet
export function getOutlet(): HTMLElement {
  let root = document.getElementById("app-root") as HTMLElement | null;
  if (!root) {
    root = document.createElement("div");
    root.id = "app-content";
    root.className = "min-h-screen flex flex-col";
    // Move all children of body into root except script tags
    const children = Array.from(document.body.children);
    for (const child of children) {
      if (child.tagName !== "SCRIPT") {
        root.appendChild(child);
      }
    }
    document.body.appendChild(root);
  }
  let outlet = document.getElementById("app-content") as HTMLElement | null;
  if (!outlet) {
    outlet = document.createElement("main");
    outlet.id = "app-content";
    outlet.className = "flex-1";
    root.appendChild(outlet);
  }
  return outlet;
}

// Clear current outlet content
export function clearOutlet() {
  const outlet = getOutlet();
  outlet.innerHTML = "";
}

// Render a view (string replaces innerHTML; nodes replace content and append)
export function renderView(content: Renderable) {
  const outlet = getOutlet();
  outlet.innerHTML = "";
  if (typeof content === "string") {
    outlet.innerHTML = content;
  } else {
    outlet.appendChild(content);
  }
}

// Simple html template tag returning a DocumentFragment for safer composition
export function html(strings: TemplateStringsArray, ...values: any[]): DocumentFragment {
  const template = document.createElement("template");
  const raw = strings.reduce((acc, part, i) => acc + part + (i < values.length ? values[i] : ""), "");
  template.innerHTML = raw.trim();
  return template.content;
}

// Ensure a footer exists; returns the footer element

