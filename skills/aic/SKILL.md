---
name: aic
description: Multi-agent dev council — use Claude, Codex & OpenCode to plan, review, and converge on technical designs before coding.
disable-model-invocation: false
allowed-tools: Bash Read Write Edit Grep Glob
---

# aicouncil

You are using aicouncil, a multi-agent dev council orchestrator. Follow this workflow when the user asks you to plan a technical design.

## Which tool are you? (read this first)

You are the orchestrator. Identify which AI tool you are running in, then **never spawn yourself**:

- **Claude Code** → You will write `03_claude_architect.md` directly. Only spawn Codex.
- **OpenCode (DeepSeek)** → You will write `03_opencode_architect.md` directly. Only spawn Claude and Codex.
- **Codex** → You will write `03_codex_architect.md` directly. Only spawn Claude.
- **Other** → Write your plan as `03_orchestrator_architect.md`. Spawn all other agents.

In all cases: you handle synthesis, revision, and finalization yourself. `aicouncil continue` only spawns reviewers — and you never list yourself as a reviewer.

## Setup (first time only)

If aicouncil is not installed, install it:

```bash
git clone https://github.com/Deger/AICouncil.git /tmp/aicouncil && cd /tmp/aicouncil && npm install && npm link
```

Then in the user's project directory:

```bash
aicouncil init
```

This creates `council.yaml`. Run `aicouncil validate` to check it.

## Workflow

### Step 1: Plan

When the user gives you a requirement:

1. **Edit `council.yaml`** — remove yourself from `workflow.stages[0].agents`. Example: if you are Claude Code, change `agents: [claude, codex]` to `agents: [codex]`. Never spawn yourself.

2. **Spawn other agents**:
```bash
aicouncil plan "<topic>" [--file <path>] [--stdin]
```

3. **Write your own plan** — save it in the run directory. Name it `03_<your-tool>_architect.md` (e.g., `03_claude_architect.md`). Use the same format as the architect prompt template.

### Step 2: Read the outputs

Read all plans in the run directory. There should be 2-3 plans (your own + whatever the other agents produced).

### Step 4: Synthesize

Read all 3 plans. Write:

- `04_synthesis.md` — Compare the 3 plans:
  - Common Ground
  - Major Differences
  - Risk Matrix
  - Open Questions For Human
  - Recommended Direction
  - Borrow From Each Plan

- `05_questions_for_human.md` — Extract only the questions that need human decisions. Format as checkboxes. Include a free-form "additional thoughts" section at the bottom.

### Step 5: Human Gate

Show the user `05_questions_for_human.md`. Wait for their answers. Save as `06_human_answers.md`.

### Step 6: Final Plan

Generate `07_final_plan.md` incorporating human decisions. Also write:
- `08_implementation_prompt.md` — Ready-to-execute dev prompt
- `09_review_checklist.md` — Review criteria checklist

### Step 7: Reviews

Before running reviews, **edit `council.yaml`** — remove yourself from the review stage's `agents` list. Never review your own plan.

```bash
aicouncil continue runs/<run-dir>
```

This spawns the OTHER agents to review the plan. Read their outputs and the synthesis you produced earlier.

### Step 8: Revise

Read the reviews. Classify each comment as: accept / reject / defer / clarify. Write `11_deepseek_synthesis_v2.md` with the revised plan.

### Step 9: Review Round 2

```bash
aicouncil continue runs/<run-dir>
```

Read round 2 outputs, make final revisions.

### Step 10: Finish

Write `14_final.md` — the converged, reviewed final plan.

## Commands Reference

| Command | Purpose |
|---------|---------|
| `aicouncil plan "<topic>"` | Start: spawn agents to write plans |
| `aicouncil continue <run-dir>` | Advance: run reviews, detect next stage |
| `aicouncil status <run-dir>` | Check current stage |
| `aicouncil init` | Create council.yaml |
| `aicouncil validate` | Check config |
| `aicouncil run <stage> <run-dir>` | Execute single stage |

## File Naming Convention

```
00_input.md                     # topic
01_claude_architect.md          # Claude's plan
02_codex_architect.md           # Codex's plan
03_opencode_architect.md        # Your plan
04_synthesis.md                 # Comparison
05_questions_for_human.md       # Questions for user
06_human_answers.md             # User's decisions
07_final_plan.md                # v1 plan
08_implementation_prompt.md     # Dev prompt
09_review_checklist.md          # Review checklist
10_review_claude_round1.md      # Claude review R1
10_review_codex_round1.md       # Codex review R1
11_deepseek_synthesis_v2.md     # v2 plan
12_review_claude_round2.md      # Claude review R2
12_review_codex_round2.md       # Codex review R2
13_final_questions_for_human.md # Final questions
14_final.md                     # Converged final plan
metadata.json                   # Stage tracking
```

## Tips

- The run directory is printed by `aicouncil plan`. Remember it.
- `aicouncil continue` auto-detects the next stage based on file existence.
- If a review stage fails for one agent, the other's output is still saved.
- Human gates: after synthesis and after round 2 reviews. Show the questions, wait for answers.
