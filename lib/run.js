const fs = require("fs");
const path = require("path");

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30) || "run";
}

function todayStr() {
  const d = new Date();
  const ts = String(d.getHours()).padStart(2, "0") + String(d.getMinutes()).padStart(2, "0");
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}-${ts}`;
}

function createRunDir(runsDir, topic) {
  const slug = slugify(topic);
  const name = `${todayStr()}-${slug}`;
  const dir = path.join(runsDir, name);
  fs.mkdirSync(dir, { recursive: true });
  return { dir, name };
}

function readMeta(runDir) {
  const p = path.join(runDir, "metadata.json");
  if (!fs.existsSync(p)) return { stage: "created" };
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function writeMeta(runDir, meta) {
  fs.writeFileSync(
    path.join(runDir, "metadata.json"),
    JSON.stringify(meta, null, 2)
  );
}

function updateAgentMeta(runDir, agentName, status, outputFile) {
  const meta = readMeta(runDir);
  if (!meta.agents) meta.agents = {};
  meta.agents[agentName] = { status, output: outputFile, updatedAt: new Date().toISOString() };
  writeMeta(runDir, meta);
}

function fileExists(runDir, name) {
  return fs.existsSync(path.join(runDir, name));
}

function readRunFile(runDir, name) {
  return fs.readFileSync(path.join(runDir, name), "utf-8");
}

function latestRunDir(runsDir) {
  if (!fs.existsSync(runsDir)) return null;
  const dirs = fs.readdirSync(runsDir)
    .map(d => path.join(runsDir, d))
    .filter(d => fs.statSync(d).isDirectory() && fs.existsSync(path.join(d, "metadata.json")))
    .sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime());
  return dirs[0] || null;
}

module.exports = {
  slugify, todayStr, createRunDir,
  readMeta, writeMeta, updateAgentMeta,
  fileExists, readRunFile, latestRunDir,
};
