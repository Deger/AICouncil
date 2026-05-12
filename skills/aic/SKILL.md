---
name: aic
description: Multi-agent dev council — use Claude, Codex & OpenCode to plan, review, and converge on technical designs before coding.
disable-model-invocation: false
allowed-tools: Bash Read Write Edit Grep Glob
---

# aicouncil

You are using aicouncil, a multi-agent dev council orchestrator. Follow this workflow when the user asks you to plan a technical design.

## Which tool are you?

You are the orchestrator. Always use `--skip <yourself>` to avoid spawning yourself:

- **Claude Code** → `aicouncil plan --skip claude`
- **OpenCode (DeepSeek)** → `aicouncil plan --skip opencode`
- **Codex** → `aicouncil plan --skip codex`

Use `--skip` on every `aicouncil plan` and `aicouncil continue` call. Never spawn yourself.

## Setup (first time only)

```bash
# Install (if not already installed)
git clone https://github.com/Deger/AICouncil.git /tmp/aicouncil && cd /tmp/aicouncil && npm install && npm link

# In the user's project
aicouncil init            # creates council.yaml + copies prompt templates
aicouncil doctor          # checks all agents are available
```

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

Spawn other agents (skip yourself):
```bash
aicouncil plan "<topic>" --skip <your-tool> [--file <path>] [--stdin]
```

### Step 2: Write your own plan

Write your plan as the next numbered file in the run directory (e.g., `03_claude_architect.md` if you're Claude). Match the architect prompt format: Summary, Architecture, Files, Implementation, Tradeoffs, Risks, Questions, Tests.

### Step 3: Read the outputs

List the run directory. Read all plans (your own + the other agents').

### Step 4: Synthesize

Write `04_synthesis.md` comparing all plans:
- Common Ground
- Major Differences
- Risk Matrix
- Open Questions For Human
- Recommended Direction
- Borrow From Each Plan

Write `05_questions_for_human.md` with checkbox questions. Include a free-form "Additional Thoughts" section at the bottom.

### Step 5: Human Gate

Show the user `05_questions_for_human.md`. Wait for their answers. Save as `06_human_answers.md`.

### Step 6: Final Plan

Write `07_final_plan.md` incorporating human decisions. Also write:
- `08_implementation_prompt.md` — dev-ready prompt for implementation
- `09_review_checklist.md` — review criteria

### Step 7: Reviews

```bash
aicouncil continue --skip <your-tool> <run-dir>
```

This spawns the OTHER agents to review. Use `aicouncil continue --latest` if you don't remember the run path.

### Step 8: Revise

Read the review outputs. Classify each comment: accept / reject / defer / clarify. Write `11_deepseek_synthesis_v2.md`.

### Step 9: Review Round 2

```bash
aicouncil continue --skip <your-tool> <run-dir>
```

### Step 10: Finish

Write `14_final.md` — the converged, reviewed final plan.

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
01_claude_architect.md          # Claude's plan
02_codex_architect.md           # Codex's plan
03_opencode_architect.md        # Your plan (name varies)
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
