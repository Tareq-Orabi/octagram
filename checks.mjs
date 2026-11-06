import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import postcss from "postcss";
import ts from "typescript";

const project = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(project, "out");
const entry = path.join(root, "index.html");
const cssSource = path.join(project, "src/app/globals.css");
const skipVendor = process.argv.includes("--skip-vendor");
const failures = new Set(),
  references = new Set(),
  contrasts = [];
const fail = (message) => failures.add(message);
const relative = (file) =>
  path.relative(project, file).split(path.sep).join("/");
function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((item) => {
    const file = path.join(directory, item.name);
    return item.isDirectory() ? files(file) : [file];
  });
}
function decode(value) {
  const named = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
  return value.replace(
    /&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi,
    (whole, entity) => {
      if (entity[0] !== "#") return named[entity.toLowerCase()] ?? whole;
      const hex = entity[1].toLowerCase() === "x";
      const code = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    },
  );
}
function checkRef(value, origin) {
  const ref = decode(value.trim());
  if (!ref || /^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(ref)) return null;
  let url, pathname;
  try {
    url = new URL(
      ref,
      "https://export.invalid/" +
        path.relative(root, origin).split(path.sep).join("/"),
    );
    pathname = decodeURIComponent(url.pathname);
  } catch {
    fail("Invalid local URL: " + relative(origin) + " → " + ref);
    return null;
  }
  if (url.origin !== "https://export.invalid") return null;
  const target = path.join(root, pathname);
  const file = [target, target + ".html", path.join(target, "index.html")].find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
  references.add(relative(origin) + " → " + ref);
  if (!file) fail("Missing local file: " + relative(origin) + " → " + ref);
  return { file, hash: url.hash };
}
function htmlTags(html) {
  const markup = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, (block) =>
      block.slice(0, block.indexOf(">") + 1),
    );
  return [
    ...markup.matchAll(
      /<([a-z][\w:-]*)(?=[\s/>])((?:[^>"']|"[^"]*"|'[^']*')*)>/gi,
    ),
  ].map((match) => {
    const attrs = {};
    for (const attr of match[2].matchAll(
      /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+)))?/g,
    ))
      attrs[attr[1].toLowerCase()] = decode(
        attr[2] ?? attr[3] ?? attr[4] ?? "",
      );
    return { name: match[1].toLowerCase(), attrs };
  });
}
function cssRefs(css, origin) {
  let document;
  try {
    document = postcss.parse(css, { from: origin });
  } catch (error) {
    fail("CSS syntax: " + relative(origin) + ": " + error.message);
    return;
  }
  document.walkDecls((decl) => {
    for (const match of decl.value.matchAll(
      /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi,
    ))
      checkRef(match[1] ?? match[2] ?? match[3], origin);
  });
  document.walkAtRules("import", (rule) => {
    const match = rule.params.match(
      /^(?:"([^"]+)"|'([^']+)'|url\(\s*["']?([^"')\s]+))/,
    );
    if (match) checkRef(match[1] ?? match[2] ?? match[3], origin);
  });
}
function syntax(source, file, inline = false) {
  const result = spawnSync(
    process.execPath,
    inline ? ["--check", "--input-type=commonjs"] : ["--check", file],
    {
      encoding: "utf8",
      input: inline ? source : undefined,
      maxBuffer: 1024 * 1024,
    },
  );
  if (result.error || result.status !== 0)
    fail(
      "JavaScript syntax: " +
        relative(file) +
        "\n" +
        (result.error?.message || result.stderr.trim()),
    );
}
function scriptRefs(source, file) {
  const document = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  function visit(node) {
    if (ts.isStringLiteralLike(node)) {
      const value = node.text;
      if (
        /^\/assets\/.+\.[a-z\d]+(?:[?#].*)?$/i.test(value) ||
        /^\/_next\/static\/.+\.(?:js|css)(?:[?#].*)?$/i.test(value)
      )
        checkRef(value, file);
      else if (/^static\/.+\.(?:js|css)(?:[?#].*)?$/i.test(value))
        checkRef("/_next/" + value, file);
    }
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier) &&
      /^[./]/.test(node.moduleSpecifier.text)
    )
      checkRef(node.moduleSpecifier.text, file);
    const dynamic =
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword;
    const url =
      ts.isNewExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "URL";
    if (
      (dynamic || url) &&
      node.arguments?.[0] &&
      ts.isStringLiteralLike(node.arguments[0]) &&
      /^[./]/.test(node.arguments[0].text)
    )
      checkRef(node.arguments[0].text, file);
    ts.forEachChild(node, visit);
  }
  visit(document);
}
function themeTokens(css) {
  const themes = { dark: {} };
  const document = postcss.parse(css, { from: cssSource });
  document.walkRules((rule) => {
    // Component/conditional rules are not global theme scopes.
    if (rule.parent.type !== "root") return;
    const selectors = rule.selectors.map((selector) =>
      selector.replace(/["'\s]/g, ""),
    );
    const defaults = selectors.includes(":root") || selectors.includes("html");
    const dark =
      defaults ||
      selectors.includes("[data-theme=dark]") ||
      selectors.includes("html[data-theme=dark]");
    if (!dark) return;
    rule.walkDecls(/^--/, (decl) => {
      if (dark) themes.dark[decl.prop.slice(2)] = decl.value.trim();
    });
  });
  return themes;
}
function color(value, tokens, seen = new Set()) {
  if (!value) throw new Error("missing token");
  const variable = value.match(/^var\(\s*--([\w-]+)\s*(?:,\s*(.+))?\)$/);
  if (variable) {
    if (seen.has(variable[1])) throw new Error("cyclic token --" + variable[1]);
    seen.add(variable[1]);
    return color(tokens[variable[1]] ?? variable[2], tokens, seen);
  }
  const named = { white: "#ffffff", black: "#000000" };
  const hex = (named[value] ?? value).match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (!hex) throw new Error("expected opaque semantic color, found " + value);
  const expanded =
    hex[1].length === 3
      ? [...hex[1]].map((digit) => digit + digit).join("")
      : hex[1];
  return [0, 2, 4].map(
    (index) => Number.parseInt(expanded.slice(index, index + 2), 16) / 255,
  );
}
function luminance(rgb) {
  const [r, g, b] = rgb.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
if (!fs.existsSync(entry) || !fs.existsSync(cssSource)) {
  console.error(
    "Missing Next export or CSS source. Run npm run build, then node checks.mjs.",
  );
  process.exit(1);
}
const html = fs.readFileSync(entry, "utf8"),
  tags = htmlTags(html),
  ids = new Map();
for (const { attrs } of tags) {
  if (!attrs.id) continue;
  if (ids.has(attrs.id)) fail("Duplicate HTML id: " + attrs.id);
  else ids.set(attrs.id, attrs);
}
const labelled = new Set(
  tags
    .filter((tag) => tag.name === "label")
    .map((tag) => tag.attrs.for)
    .filter(Boolean),
);
for (const { name, attrs } of tags) {
  for (const attribute of ["src", "href", "poster"]) {
    if (!attrs[attribute]) continue;
    const reference = checkRef(attrs[attribute], entry);
    if (attribute === "href") {
      const hash = attrs.href.startsWith("#")
        ? attrs.href.slice(1)
        : reference?.file === entry
          ? reference.hash.slice(1)
          : "";
      if (hash) {
        try {
          if (!ids.has(decodeURIComponent(hash)))
            fail("Broken page anchor: #" + hash);
        } catch {
          fail("Invalid page anchor: #" + hash);
        }
      }
    }
  }
  for (const attribute of ["srcset", "imagesrcset"])
    if (attrs[attribute] && !attrs[attribute].startsWith("data:")) {
      for (const candidate of attrs[attribute].split(","))
        checkRef(candidate.trim().split(/\s+/)[0], entry);
    }
  for (const attribute of [
    "for",
    "aria-controls",
    "aria-labelledby",
    "aria-describedby",
    "aria-owns",
    "list",
  ]) {
    for (const id of (attrs[attribute] ?? "").split(/\s+/).filter(Boolean))
      if (!ids.has(id)) fail("Unresolved " + attribute + " reference: " + id);
  }
  if (
    ["input", "select", "textarea"].includes(name) &&
    !["hidden", "submit", "button", "reset", "image"].includes(attrs.type)
  ) {
    if (
      !labelled.has(attrs.id) &&
      !attrs["aria-label"]?.trim() &&
      !attrs["aria-labelledby"]?.trim()
    )
      fail("Form control lacks an explicit label: " + (attrs.id || name));
  }
  if (attrs.style) cssRefs("element{" + attrs.style + "}", entry);
}
for (const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi))
  cssRefs(match[1], entry);
let inlineCount = 0;
for (const match of html.matchAll(
  /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi,
)) {
  if (
    /\bsrc\s*=/.test(match[1]) ||
    /\btype\s*=\s*["'](?:application\/(?:ld\+)?json|importmap)["']/i.test(
      match[1],
    ) ||
    !match[2].trim()
  )
    continue;
  syntax(match[2], entry, true);
  scriptRefs(match[2], entry);
  inlineCount++;
}
const exported = files(root),
  cssFiles = exported.filter((file) => file.endsWith(".css"));
for (const file of cssFiles) cssRefs(fs.readFileSync(file, "utf8"), file);
const scripts = exported.filter(
  (file) =>
    /\.(?:m?js|cjs)$/.test(file) &&
    !(skipVendor && file.split(path.sep).includes("vendor")),
);
for (const file of scripts) {
  const code = fs.readFileSync(file, "utf8");
  syntax(code, file);
  scriptRefs(code, file);
}
const pairs = [
  ["text-primary", "page-bg", 4.5],
  ["text-secondary", "page-bg", 4.5],
  ["text-muted", "page-bg", 4.5],
  ["interactive-accent", "page-bg", 4.5],
  ["interactive-accent-2", "page-bg", 4.5],
  ["action-text", "action-fill", 4.5],
  ["focus-color", "page-bg", 3],
];
try {
  for (const [theme, tokens] of Object.entries(
    themeTokens(fs.readFileSync(cssSource, "utf8")),
  )) {
    for (const [foreground, background, minimum] of pairs) {
      try {
        const a = luminance(color(tokens[foreground], tokens)),
          b = luminance(color(tokens[background], tokens));
        const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        const result =
          theme +
          " --" +
          foreground +
          "/--" +
          background +
          ": " +
          ratio.toFixed(2) +
          ":1";
        contrasts.push(result);
        if (ratio < minimum)
          fail("Contrast below " + minimum + ":1: " + result);
      } catch (error) {
        fail(
          "Theme " +
            theme +
            " --" +
            foreground +
            "/--" +
            background +
            ": " +
            error.message,
        );
      }
    }
  }
} catch (error) {
  fail("CSS theme parsing: " + error.message);
}
console.log("Next export: " + relative(entry));
console.log(
  "Checked " +
    scripts.length +
    " JavaScript files + " +
    inlineCount +
    " inline scripts, " +
    cssFiles.length +
    " stylesheets, " +
    references.size +
    " local references, " +
    ids.size +
    " unique HTML IDs.",
);
if (skipVendor)
  console.log(
    "Explicit vendor-directory JavaScript skipped; all Next chunks remain checked.",
  );
console.log(
  "Semantic contrast from " +
    relative(cssSource) +
    ":\n" +
    contrasts.join("\n"),
);
console.log(
  "Static checks only: no claim about runtime rendering, animation, focus behavior, or WebGL.",
);
if (failures.size) {
  console.error("FAIL (" + failures.size + "):\n" + [...failures].join("\n"));
  process.exitCode = 1;
} else
  console.log(
    "PASS: export files, chunk/import references, syntax, IDs, anchors, labels, ARIA references, and semantic contrast.",
  );
