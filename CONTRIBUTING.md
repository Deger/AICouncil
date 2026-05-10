# Contributing to aicouncil

## Architecture Overview

```
aicouncil/
├── bin/aicouncil          # CLI entry point — command routing only (~150 lines)
├── lib/
│   ├── config.js          # council.yaml loading, PATH detection, validation
│   ├── workflow.js        # stage engine (plan, review, continue pipeline)
│   ├── agent.js           # child_process.spawn() wrapper with timeout
│   ├── prompt.js          # {{mustache}} template rendering
│   └── run.js             # run directory I/O + metadata state machine
├── prompts/               # built-in prompt templates (user can override)
└── council.yaml           # v2 config format (workflow-driven)
```

### Dependency Direction

```
bin/aicouncil
  └── lib/workflow.js
        ├── lib/config.js      (read config, detect agents)
        ├── lib/agent.js       (spawn external processes)
        ├── lib/prompt.js      (render templates)
        └── lib/run.js         (manage run directories)
```

Strict one-way: `bin → workflow → {config, agent, prompt, run}`. No circular dependencies.

### Key Design Decisions

1. **No framework**: CLI parsing is manual (`process.argv`). 6 commands don't justify Commander/Yargs.
2. **One dependency**: Only `js-yaml`. Zero runtime dependencies beyond Node.js built-ins.
3. **PATH-based agent detection**: `which` + fallback to common install paths. No hardcoded absolute paths.
4. **File-based state machine**: Stage detection uses both `metadata.json` AND file existence checks. If one is stale, the other catches it.
5. **Orchestrator is special**: The `opencode` agent has no `command` — synthesis/revision/finalize stages are handled by the human+AI session directly, not via subprocess.

## Local Development

```bash
git clone https://github.com/Deger/aicouncil.git
cd aicouncil
npm install
```

### Testing Your Changes

```bash
# Validate config
node bin/aicouncil validate

# Run a quick plan (needs claude + codex in PATH)
node bin/aicouncil plan "test topic"

# Dry-run to see what commands would be spawned
node bin/aicouncil plan "test topic" --dry-run

# Check a run status
node bin/aicouncil status runs/<run-id>

# Create a test config
node bin/aicouncil init
```

### Adding a New Command

1. Add the command handler in `bin/aicouncil` (switch case)
2. If it needs workflow logic, add to `lib/workflow.js`
3. If it needs config, use `lib/config.js`
4. Add to the help text in `printHelp()`

### Adding a New Agent

1. Add agent definition in `council.yaml` under `agents:`
2. Add it to the desired workflow stages (`agents: [...]`)
3. If the agent needs special spawn behavior, check `lib/workflow.js` — currently all agents use the same `runAgent()` wrapper. If needed, add agent-specific spawn logic.

### Modifying the Workflow

The workflow is fully config-driven. To change the stage sequence, edit `council.yaml` → `workflow.stages`. The engine in `lib/workflow.js` reads this list and executes stages in order.

To add new stage types (beyond `plan` and `review`):

1. Add stage handler in `lib/workflow.js` (`runStage()` switch)
2. Add stage advancement logic in `continueWorkflow()` if the stage needs auto-detection
3. Add metadata tracking if the stage produces files

## Code Style

- Node.js built-in modules only (except `js-yaml`)
- CommonJS (`require`/`module.exports`) for maximum compatibility
- Async functions with `async/await`
- `Promise.allSettled` for parallel agent execution (one failure doesn't kill others)
- Error messages in English, user-facing messages follow `outputLanguage` config

## Before Submitting

```bash
# Lint check (manual — no linter configured)
# Check for:
# - No hardcoded absolute paths
# - No secrets or API keys
# - Error messages are clear and actionable
# - New commands are in --help output

# Validate
node bin/aicouncil validate

# Test plan + continue flow
node bin/aicouncil plan "test" && node bin/aicouncil continue runs/<latest>

# Check npm pack output (should not include runs/ or node_modules/)
npm pack --dry-run
```

## Release Checklist

- [ ] `package.json` version bumped
- [ ] README updated if commands changed
- [ ] `council.yaml` template in `init` command matches default
- [ ] `npm pack --dry-run` shows correct files
- [ ] Preflight scan: no secrets, no PII, no absolute paths
- [ ] `aicouncil validate` passes
- [ ] `aicouncil plan "test"` spawns agents successfully
