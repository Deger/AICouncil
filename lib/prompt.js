const fs = require("fs");
const path = require("path");

function loadPrompt(promptsDir, name) {
  const safeName = path.basename(name);
  const filePath = path.join(promptsDir, safeName);
  if (!filePath.startsWith(promptsDir)) {
    throw new Error(`Prompt path traversal blocked: ${name}`);
  }
  return fs.readFileSync(filePath, "utf-8");
}

function renderPrompt(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(`{{${key}}}`).join(value);
  }
  return result;
}

module.exports = { loadPrompt, renderPrompt };
