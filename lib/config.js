const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const yaml = require("js-yaml");

function loadConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config not found: ${configPath}\nRun "aicouncil init" to create one.`);
  }
  const raw = fs.readFileSync(configPath, "utf-8");
  const config = yaml.load(raw);

  if (!config.version) throw new Error("council.yaml missing 'version' field");
  if (!config.agents) throw new Error("council.yaml missing 'agents' section");

  // Resolve agent commands via PATH lookup
  for (const [name, agent] of Object.entries(config.agents)) {
    if (agent.command) {
      const resolved = resolveAgentCommand(agent.command);
      if (!resolved) {
        throw new Error(
          `Agent "${name}": command "${agent.command}" not found in PATH.\n` +
          `Install it or set the full path in council.yaml`
        );
      }
      agent.command = resolved;
    }
    // Expand ${VAR} in env values
    if (agent.env) {
      for (const [k, v] of Object.entries(agent.env)) {
        agent.env[k] = String(v).replace(/\$\{(\w+)\}/g, (_, varName) => process.env[varName] ?? "");
      }
    }
  }

  // Default workflow if not configured
  if (!config.workflow) {
    config.workflow = getDefaultWorkflow();
  }

  return config;
}

function resolveAgentCommand(command) {
  if (command.startsWith("/") && fs.existsSync(command)) return command;

  const result = spawnSync("which", [command], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
  if (result.status === 0 && result.stdout) {
    const resolved = result.stdout.trim();
    if (fs.existsSync(resolved)) return resolved;
  }

  // Try common locations
  const commonPaths = [
    `/usr/local/bin/${command}`,
    `/opt/homebrew/bin/${command}`,
    path.join(process.env.HOME || "/tmp", `.local/bin/${command}`),
  ];
  for (const p of commonPaths) {
    if (fs.existsSync(p)) return p;
  }

  return null;
}

function getDefaultWorkflow() {
  return {
    stages: [
      { id: "plan", description: "Generate independent plans from all agents", agents: ["claude", "codex"], prompt: "architect.md", parallel: true },
      { id: "synthesis", description: "Synthesize plans and extract open questions", gate: "06_human_answers.md" },
      { id: "final-plan", description: "Generate final plan, implementation prompt, and review checklist" },
      { id: "review", description: "Review the current plan", agents: ["claude", "codex"], prompt: "reviewer.md", parallel: true, rounds: 2 },
      { id: "finalize", description: "Extract final questions and generate final.md" },
    ],
  };
}

function getPromptsDir(configPath) {
  const configDir = path.dirname(path.resolve(configPath));
  const localPrompts = path.join(configDir, "prompts");
  if (fs.existsSync(localPrompts)) return localPrompts;

  const builtin = path.join(__dirname, "..", "prompts");
  if (fs.existsSync(builtin)) return builtin;

  throw new Error("Prompts directory not found");
}

function validateConfig(config) {
  const errors = [];
  const stageIds = new Set();

  if (!config.defaults || typeof config.defaults.timeoutSeconds !== "number" || config.defaults.timeoutSeconds <= 0) {
    errors.push("defaults.timeoutSeconds must be a positive number");
  }

  for (const [name, agent] of Object.entries(config.agents || {})) {
    if (!agent.role) errors.push(`Agent "${name}" missing 'role'`);
    if (agent.command) {
      if (!Array.isArray(agent.args)) errors.push(`Agent "${name}": 'args' must be an array`);
    }
  }

  for (const stage of (config.workflow?.stages || [])) {
    if (!stage.id) { errors.push("workflow.stages: each stage requires an 'id'"); continue; }
    if (stageIds.has(stage.id)) { errors.push(`Duplicate stage id: ${stage.id}`); continue; }
    stageIds.add(stage.id);

    if (stage.agents) {
      for (const agentName of stage.agents) {
        const agent = config.agents?.[agentName];
        if (!agent) {
          errors.push(`Stage "${stage.id}" references unknown agent "${agentName}"`);
        } else if (!agent.command) {
          errors.push(`Stage "${stage.id}" uses agent "${agentName}" which has no 'command' (cannot spawn)`);
        }
      }
    }

    if (stage.rounds && (typeof stage.rounds !== "number" || stage.rounds < 1)) {
      errors.push(`Stage "${stage.id}": 'rounds' must be a positive number`);
    }

    if (stage.parallel !== undefined && typeof stage.parallel !== "boolean") {
      errors.push(`Stage "${stage.id}": 'parallel' must be a boolean`);
    }
  }

  return errors;
}

module.exports = { loadConfig, getPromptsDir, validateConfig };
