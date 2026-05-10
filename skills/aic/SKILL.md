---
name: aic
description: Multi-agent dev council — use Claude, Codex & OpenCode to plan, review, and converge on technical designs before coding.
disable-model-invocation: false
allowed-tools: Bash Read Write Edit Grep Glob
---

# aicouncil

You are using aicouncil, a multi-agent dev council orchestrator. Follow this workflow when the user asks you to plan a technical design.

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

When the user gives you a requirement, run:

```bash
aicouncil plan "<topic>" [--file <path>] [--stdin]
```

This spawns Claude Code and Codex in parallel. They each write a technical plan.

### Step 2: Read the outputs

```bash
ls runs/<run-dir>/
```

Read:
- `01_claude_architect.md` — Claude's plan
- `02_codex_architect.md` — Codex's plan

### Step 3: Write your own plan

Write your plan as `03_opencode_architect.md` in the run directory. Use the same format as the architect prompt template.

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

### Step 7: Reviews (automated)

```bash
aicouncil continue runs/<run-dir>
```

This spawns Claude and Codex to review `07_final_plan.md`. Read their outputs:
- `10_review_claude_round1.md`
- `10_review_codex_round1.md`

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
