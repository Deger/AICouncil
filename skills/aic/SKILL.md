---
name: aic
description: Multi-agent dev council — use Claude, Codex & OpenCode to plan, review, and converge on technical designs before coding.
disable-model-invocation: false
allowed-tools: Bash Read Write Edit Grep Glob
---

# aicouncil

You are using aicouncil, a multi-agent dev council orchestrator. Follow this workflow when the user asks you to plan a technical design.

## Which tool are you?

You are the orchestrator. Identify which tool+backend you are, then use the corresponding agent name with `--skip`:

| Your tool | Backend | Use `--skip` |
|-----------|---------|-------------|
| Claude Code | Anthropic | `--skip claude` |
| Claude Code | DeepSeek | `--skip deepseek-claude` |
| OpenCode | DeepSeek | `--skip deepseek-opencode` |
| Codex | OpenAI | `--skip codex` |

**If you're unsure which backend you're running on**, ask the user: "Am I running on Anthropic or DeepSeek? Which agent should I skip?"

## Setup (first time only)

**All aicouncil commands must run from the project root.** The `runs/` directory and `council.yaml` are created relative to `process.cwd()`.

```bash
# Install (if not already installed)
git clone https://github.com/Deger/AICouncil.git /tmp/aicouncil && cd /tmp/aicouncil && npm install && npm link

# Navigate to the user's PROJECT ROOT, then initialize
cd <project-root>
aicouncil init         # creates council.yaml + prompts/ in this directory
aicouncil doctor       # checks all agents are available
```

**To update**: `aicouncil update` or delete and reinstall.

## Writing a Good Topic

The topic is the most important input. A good topic gives agents enough context to produce meaningful plans. Include:

- **What** to build (1-2 sentences)
- **Constraints** — what NOT to change, dependencies to avoid, patterns to follow
- **Context** — relevant file paths, existing patterns, gotchas

Use `--file <path>` for detailed briefs. Use `--stdin` when piping from another command.

Example:
```
Add a rate limiter to the API gateway in src/gateway/. Token bucket algorithm, 100 req/s default. Don't touch auth middleware. Keep existing test patterns (vitest).
```

## Workflow

### Step 1: Plan

**Always run from `<project-root>`.**

```bash
cd <project-root> && aicouncil plan "<topic>" --skip <your-tool> [--file <path>] [--stdin]
```

This creates `runs/<date>-<slug>/` under the project root. The run directory path is printed to stdout — **remember it** (e.g., `runs/2026-05-12-my-feature/`).

### Step 2: Write your own plan

Write your plan **inside the run directory** (NOT in the project root). Name it `03_<your-tool>_architect.md`.

Example: if the run dir is `runs/2026-05-12-my-feature/`, write to:
```
runs/2026-05-12-my-feature/03_claude_architect.md
```

### Step 3: Read all plans

List the run directory:
```bash
ls <run-dir>/
```

Read all `*_architect.md` files inside it.

### Step 4: Synthesize

All files go inside the run directory:

- `<run-dir>/04_synthesis.md` — Compare all plans: Common Ground, Differences, Risk Matrix, Open Questions, Recommended Direction
- `<run-dir>/05_questions_for_human.md` — Checkbox questions + free-form "Additional Thoughts"

### Step 5: Human Gate

Show `05_questions_for_human.md` to the user. Wait for their answers. **Save answers inside the run directory as `<run-dir>/06_human_answers.md`.**

### Step 6: Final Plan

Write inside the run directory:
- `<run-dir>/07_final_plan.md` — comprehensive plan incorporating human decisions
- `<run-dir>/08_implementation_prompt.md` — dev-ready implementation prompt
- `<run-dir>/09_review_checklist.md` — review criteria

### Step 7: Reviews

```bash
cd <project-root> && aicouncil continue --skip <your-tool> <run-dir>
```

(AICouncil reads/writes all review files inside the run directory automatically.)

### Step 8: Revise

Read the review outputs inside the run directory. Classify each comment: accept / reject / defer / clarify. Write `<run-dir>/11_deepseek_synthesis_v2.md`.

### Step 9: Review Round 2

```bash
cd <project-root> && aicouncil continue --skip <your-tool> <run-dir>
```

### Step 10: Finish

Write `<run-dir>/14_final.md` — the converged, reviewed final plan.

## Agent Failures

Agent failures are common (rate limits, auth, timeouts). Don't block on them:

- **Plan stage**: If an agent fails, just note it in `04_synthesis.md` — "Agent X unavailable, plan based on available plans". Don't wait or retry unless the user asks.
- **Review stage**: If a reviewer fails, proceed with available reviews. Missing reviews = fewer perspectives, but the workflow doesn't halt.
- **Retry**: `aicouncil retry --agent <name> <run-dir>` to retry a single agent.
- **Diagnose**: `aicouncil health` checks all agents. Each agent also writes `_error.log` on failure.

## Commands Reference

| Command | Purpose |
|---------|---------|
| `aicouncil plan "<topic>" --skip <you>` | Start: spawn other agents |
| `aicouncil continue --skip <you> <run-dir>` | Advance: run reviews |
| `aicouncil retry --agent <name> <run-dir>` | Retry a failed agent |
| `aicouncil status <run-dir>` | Check current stage |
| `aicouncil init` | Create council.yaml + copy prompts |
| `aicouncil doctor` | Pre-flight check: are all agents reachable? |
| `aicouncil health` | Probe each agent with --version |
| `aicouncil validate` | Validate council.yaml structure |

Use `--latest` instead of `<run-dir>` to auto-select the most recent run.

## Run Directory

`aicouncil plan` prints the run directory path. It's under `runs/` in your project directory. Use `aicouncil status --latest` to find it.

## File Naming

```
00_input.md                     # topic
01_claude_architect.md          # Claude's plan (Anthropic)
02_codex_architect.md           # Codex's plan
01_claude_architect.md          # Claude's plan (Anthropic)
02_codex_architect.md           # Codex's plan
03_deepseek_opencode_architect.md  # DeepSeek via OpenCode
04_deepseek_claude_architect.md    # DeepSeek via Claude Code
04_synthesis.md                 # Comparison
05_questions_for_human.md       # Questions for user
06_human_answers.md             # User's decisions
07_final_plan.md                # v1 plan
08_implementation_prompt.md     # Dev prompt
09_review_checklist.md          # Review checklist
10_review_claude_round1.md      # Claude review R1
10_review_codex_round1.md       # Codex review R1 (same prefix = parallel)
11_deepseek_synthesis_v2.md     # v2 plan
12_review_claude_round2.md      # Claude review R2
12_review_codex_round2.md       # Codex review R2
13_final_questions_for_human.md # Final questions
14_final.md                     # Converged final plan
metadata.json                   # Stage tracking
```

## Tips

- Always use `--skip <yourself>` on `plan` and `continue`.
- Use `--latest` instead of typing the full run path.
- If an agent fails, don't block — note it and move on.
- `aicouncil doctor` before starting eliminates most failures.
- Show the human only the blocking questions. Don't overwhelm them.
