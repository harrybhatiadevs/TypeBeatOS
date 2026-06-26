import fs from "fs";
import path from "path";
import ts from "typescript";

type Finding = {
  code: string;
  file: string;
  line: number;
  message: string;
  excerpt: string;
};

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, "app");
const STRICT = process.argv.includes("--strict");
const JSON_OUTPUT = process.argv.includes("--json");

const FILE_RE = /\.(tsx|ts|jsx|js)$/;
const BUTTON_CLASS_RE = /\b(btn|copy-btn|nav-link|tb-auth-submit|tb-form-btn|tb-final-btn)\b/;
const HELPER_CLASS_RE = /\b(tb-helper|page-sub|helper-block|helper-spaced|empty-state|checklist-hint)\b/;
const LONG_LABEL_CLAUSE_RE = /\b(appears in|shown in|if left|used to|every generated|automatically|direct upload needs|auto-detected)\b/i;
const DECORATIVE_RE = /[\u{1f300}-\u{1faff}\u{2600}-\u{27bf}]|[↻→✓⚡▶⬇↗⏳]/u;
const PHRASES = [
  "full YouTube upload package",
  "full YouTube package",
  "auto-detected from audio if left blank",
  "Direct upload needs Google API credentials",
  "Fill in the beat details",
  "AI-generated",
];
const INLINE_STYLE_EXEMPTIONS = new Set(["app/opengraph-image.tsx"]);
const REPORT_LIMIT = 40;

const findings: Finding[] = [];

function rel(file: string) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return FILE_RE.test(entry.name) ? [full] : [];
  });
}

function add(source: ts.SourceFile, node: ts.Node, code: string, message: string, excerpt: string) {
  const pos = source.getLineAndCharacterOfPosition(node.getStart(source));
  findings.push({
    code,
    file: rel(source.fileName),
    line: pos.line + 1,
    message,
    excerpt: excerpt.replace(/\s+/g, " ").trim().slice(0, 160),
  });
}

function attrText(attr: ts.JsxAttribute): string {
  if (!attr.initializer) return "";
  if (ts.isStringLiteral(attr.initializer)) return attr.initializer.text;
  if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
    const expr = attr.initializer.expression;
    if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) return expr.text;
  }
  return "";
}

function classNameOf(attrs: ts.JsxAttributes): string {
  for (const prop of attrs.properties) {
    if (ts.isJsxAttribute(prop) && attrName(prop.name) === "className") return attrText(prop);
  }
  return "";
}

function attrName(name: ts.JsxAttributeName): string {
  return ts.isIdentifier(name) ? name.text : name.getText();
}

function tagName(tag: ts.JsxTagNameExpression): string {
  return tag.getText();
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function combineText(left: string, right: string): string {
  return normalizeText([left, right].filter(Boolean).join(" "));
}

function combineVariants(left: string[], right: string[]): string[] {
  const variants = new Set<string>();
  for (const a of left) {
    for (const b of right) {
      variants.add(combineText(a, b));
    }
  }
  return Array.from(variants).slice(0, 24);
}

function childNodes(node: ts.Node): ts.Node[] {
  const children: ts.Node[] = [];
  ts.forEachChild(node, (child) => children.push(child));
  return children;
}

function variantsFromChildren(children: readonly ts.Node[]): string[] {
  return children.reduce<string[]>((variants, child) => combineVariants(variants, textVariants(child)), [""]);
}

function textVariants(node: ts.Node): string[] {
  if (ts.isJsxText(node)) return [normalizeText(node.getText())];
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return [normalizeText(node.text)];
  if (ts.isConditionalExpression(node)) return [...textVariants(node.whenTrue), ...textVariants(node.whenFalse)];
  if (ts.isJsxExpression(node)) return node.expression ? textVariants(node.expression) : [""];
  if (ts.isJsxElement(node)) return variantsFromChildren(node.children);
  if (ts.isJsxFragment(node)) return variantsFromChildren(node.children);
  if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node) || ts.isJsxClosingElement(node)) return [""];
  return variantsFromChildren(childNodes(node));
}

function textCandidates(node: ts.Node): string[] {
  return textVariants(node).map(normalizeText).filter(Boolean);
}

function isButtonLike(node: ts.JsxElement | ts.JsxSelfClosingElement): boolean {
  const opening = ts.isJsxElement(node) ? node.openingElement : node;
  const tag = tagName(opening.tagName);
  if (tag === "button") return true;
  if (tag === "a" || tag === "Link") return BUTTON_CLASS_RE.test(classNameOf(opening.attributes));
  return false;
}

function scanSource(file: string) {
  const text = fs.readFileSync(file, "utf8");
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") || file.endsWith(".jsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const relative = rel(file);

  for (const phrase of PHRASES) {
    const index = text.toLowerCase().indexOf(phrase.toLowerCase());
    if (index !== -1) {
      const line = source.getLineAndCharacterOfPosition(index).line + 1;
      findings.push({
        code: "copy:banned-phrase",
        file: relative,
        line,
        message: `Avoid the phrase "${phrase}" in user-facing UI.`,
        excerpt: phrase,
      });
    }
  }

  function visit(node: ts.Node) {
    if (ts.isJsxAttribute(node) && attrName(node.name) === "style" && !INLINE_STYLE_EXEMPTIONS.has(relative)) {
      add(source, node, "style:inline", "Move inline UI styling into CSS classes.", node.getText(source));
    }

    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      const tag = tagName(opening.tagName);
      const className = classNameOf(opening.attributes);

      if (isButtonLike(node)) {
        for (const label of textCandidates(node)) {
          if (label.length > 24) {
            add(source, node, "button:long-label", "Button labels should stay at 24 characters or fewer.", label);
          }
          if (DECORATIVE_RE.test(label)) {
            add(source, node, "button:decorative-symbol", "Use icons, not decorative text symbols or emoji, inside buttons.", label);
          }
        }
      }

      if (tag === "label") {
        for (const text of textCandidates(node)) {
          if (text.length > 56 || LONG_LABEL_CLAUSE_RE.test(text)) {
            add(source, node, "label:verbose", "Labels should be short nouns. Move explanations to state or helper text.", text);
          }
        }
      }

      if (HELPER_CLASS_RE.test(className)) {
        for (const text of textCandidates(node)) {
          if (text.length > 120) {
            add(source, node, "helper:long-copy", "Helper copy should be one short line where possible.", text);
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(source);
}

for (const file of walk(APP_DIR)) scanSource(file);

findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.code.localeCompare(b.code));

if (JSON_OUTPUT) {
  console.log(JSON.stringify({ findings, count: findings.length, strict: STRICT }, null, 2));
} else if (findings.length === 0) {
  console.log("UI quality check passed. No drift warnings found.");
} else {
  console.log(`UI quality check found ${findings.length} warning${findings.length === 1 ? "" : "s"}:`);
  const counts = findings.reduce<Record<string, number>>((acc, finding) => {
    acc[finding.code] = (acc[finding.code] ?? 0) + 1;
    return acc;
  }, {});
  for (const [code, count] of Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
    console.log(`  ${code}: ${count}`);
  }
  console.log("");
  for (const finding of findings.slice(0, REPORT_LIMIT)) {
    console.log(`${finding.file}:${finding.line} [${finding.code}] ${finding.message}`);
    if (finding.excerpt) console.log(`  ${finding.excerpt}`);
  }
  if (findings.length > REPORT_LIMIT) {
    console.log("");
    console.log(`... ${findings.length - REPORT_LIMIT} more warning${findings.length - REPORT_LIMIT === 1 ? "" : "s"}. Run npm run ui:check -- --json for the full report.`);
  }
  console.log("");
  if (STRICT) {
    console.log("Strict mode is enabled. Resolve these warnings before merging.");
  } else {
    console.log("Default mode is advisory and exits 0. Re-run with --strict to make warnings blocking.");
  }
}

if (STRICT && findings.length > 0) process.exit(1);
