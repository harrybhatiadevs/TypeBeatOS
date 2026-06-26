import fs from "fs";
import path from "path";

type Scorecard = {
  route: string;
  block: string;
  index: number;
};

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, "app");
const DOC_PATH = path.join(ROOT, "docs", "frontend-route-scorecards.md");
const JSON_OUTPUT = process.argv.includes("--json");
const REQUIRED_FIELDS = ["Job", "Primary action", "Desktop", "Mobile", "Copy budget", "States", "QA focus"];

function rel(file: string) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name === "page.tsx" ? [full] : [];
  });
}

function routeFromPage(file: string) {
  const pageDir = path.dirname(rel(file).replace(/^app\//, ""));
  const segments = pageDir.split("/").filter((segment) => segment && segment !== "." && !/^\(.+\)$/.test(segment));
  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

function extractScorecards(markdown: string): Scorecard[] {
  const headingRe = /^### `([^`]+)`\s*$/gm;
  const headings = Array.from(markdown.matchAll(headingRe)).map((match) => ({
    route: match[1],
    index: match.index ?? 0,
  }));

  return headings.map((heading, i) => {
    const next = headings[i + 1]?.index ?? markdown.length;
    return {
      route: heading.route,
      block: markdown.slice(heading.index, next),
      index: heading.index,
    };
  });
}

function lineNumber(markdown: string, index: number) {
  return markdown.slice(0, index).split("\n").length;
}

function fieldValue(block: string, field: string) {
  const match = block.match(new RegExp(`^- ${field}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim() ?? "";
}

const routeFiles = walk(APP_DIR);
const appRoutes = routeFiles.map(routeFromPage).sort((a, b) => a.localeCompare(b));
const markdown = fs.existsSync(DOC_PATH) ? fs.readFileSync(DOC_PATH, "utf8") : "";
const scorecards = extractScorecards(markdown);
const scorecardRoutes = scorecards.map((scorecard) => scorecard.route);

const findings: string[] = [];
const routeSet = new Set(appRoutes);
const scorecardSet = new Set(scorecardRoutes);

for (const route of appRoutes) {
  if (!scorecardSet.has(route)) findings.push(`Missing scorecard for route ${route}`);
}

for (const route of scorecardRoutes) {
  if (!routeSet.has(route)) findings.push(`Stale scorecard for route ${route}`);
}

for (const route of scorecardRoutes) {
  const count = scorecardRoutes.filter((candidate) => candidate === route).length;
  if (count > 1) findings.push(`Duplicate scorecard for route ${route}`);
}

for (const scorecard of scorecards) {
  for (const field of REQUIRED_FIELDS) {
    const value = fieldValue(scorecard.block, field);
    if (!value) {
      findings.push(`${scorecard.route}: missing "${field}" field near line ${lineNumber(markdown, scorecard.index)}`);
    } else if (/^(tbd|todo|n\/a)$/i.test(value)) {
      findings.push(`${scorecard.route}: "${field}" must be specific, not "${value}"`);
    }
  }
}

const result = {
  routes: appRoutes,
  scorecards: scorecardRoutes,
  count: findings.length,
  findings,
};

if (JSON_OUTPUT) {
  console.log(JSON.stringify(result, null, 2));
} else if (findings.length === 0) {
  console.log(`Route scorecard check passed. ${appRoutes.length} route${appRoutes.length === 1 ? "" : "s"} covered.`);
} else {
  console.log(`Route scorecard check found ${findings.length} issue${findings.length === 1 ? "" : "s"}:`);
  for (const finding of findings) console.log(`  - ${finding}`);
}

if (findings.length > 0) process.exit(1);
