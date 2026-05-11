# AICouncil

> **One command. Three AIs debate your plan. You get a reviewed design before coding.**

You tell your AI tool what you want. aicouncil makes Claude, Codex, and OpenCode each write their own plan, review each other, and converge on a battle-tested design. You just answer the hard questions.

---

## If you vibe code (start here)

You don't install anything. You don't run commands. You just paste one sentence into your AI tool:

```
Install the AICouncil skill from https://github.com/Deger/AICouncil, then use it to plan this:
<your requirement>
```

That's it. The AI installs the skill, then spawns Claude and Codex to write plans, compares them, asks you the hard questions, runs reviews, and gives you a final plan.

After the first time, just type `/aic <requirement>`.

> **First install?** Restart your AI tool after installing the skill.
> - **Claude Code**: `/aic` shows up after restart.
> - **OpenCode**: restart, then type `/skills` and select aicouncil, or manually type `/aic` (no autocomplete yet).

**Example**: you want dark mode. You paste:

```
Install the AICouncil skill from https://github.com/Deger/AICouncil, then use it to plan this:
Add a dark mode toggle to Settings. Persist preference in localStorage.
```

---

## If you want to run it yourself

```bash
npx skills add Deger/AICouncil -g
```

Then type `/aic <requirement>` in Claude Code or OpenCode.

Prefer the CLI directly?

```bash
git clone https://github.com/Deger/AICouncil.git && cd AICouncil && npm install && npm link
cd your-project && aicouncil init
aicouncil plan "Add a rate limiter to the API gateway"
```

---

## What You Get

After running `aicouncil plan`, open the run directory:

```
runs/2026-05-10-add-rate-limiter/
├── 00_input.md              ← your topic
├── 01_claude_architect.md   ← Claude's plan (conservative, edge-case focused)
├── 02_codex_architect.md    ← Codex's plan (practical, repo-aware)
└── metadata.json
```


---

## For Your AI Tool 

This is the exact prompt to give your AI coding tool. It tells the AI to use aicouncil step by step.

### One-liner

```
Install https://github.com/Deger/aicouncil.git, then use aicouncil to plan this:
<your requirement here>
```

### With a detailed requirement

```
Install https://github.com/Deger/aicouncil.git.

Then use aicouncil to plan this:
---
<your detailed requirement or @file reference>
---

Follow the aicouncil workflow:
1. Run `aicouncil plan "<topic>"` to generate independent plans from Claude and Codex
2. Read the outputs (01_claude_architect.md, 02_codex_architect.md) and write your own plan as 03_opencode_architect.md
3. Write 04_synthesis.md comparing all 3 plans, and 05_questions_for_human.md for decisions needed
4. Show me 05_questions_for_human.md and wait for my answers
5. After I respond, write 06_human_answers.md and 07_final_plan.md
6. Run `aicouncil continue <run-dir>` — this spawns Claude and Codex to review the plan
7. Read review outputs (10_review_*.md), classify feedback in 11_deepseek_synthesis_v2.md
8. Run `aicouncil continue <run-dir>` again for review round 2
9. Write 14_final.md — the converged final plan
```

### What the AI does

When you give the AI that prompt, it will:

| Step | AI action | Command/file |
|------|-----------|-------------|
| Install | Clone + npm install + npm link | `git clone ...` |
| Init | Create config | `aicouncil init` |
| Plan | Spawn Claude + Codex in parallel | `aicouncil plan "..."` |
| Synthesize | Read 3 plans, compare, extract questions | Writes `04_synthesis.md`, `05_questions_for_human.md` |
| Wait for you | Show you the questions | You edit `06_human_answers.md` |
| Final plan | Generate reviewed plan | Writes `07_final_plan.md` |
| Review R1 | Spawn reviewers | `aicouncil continue <run>` |
| Revise | Read reviews, classify feedback | Writes `11_deepseek_synthesis_v2.md` |
| Review R2 | Spawn reviewers again | `aicouncil continue <run>` |
| Finish | Converged final plan | Writes `14_final.md` |

---

## Two Ways to Use It

Both happen inside your AI coding tool (Cursor, Claude Code, OpenCode, Codex).

### Way 1: Just talk to your AI

```
You:  "I need to refactor the auth module. Use aicouncil."
AI:   *runs aicouncil plan, reads outputs, shows you the comparison*
```

### Way 2: Write a short brief first

```bash
# Your brief (save as brief.md)
## What
Add OAuth2 login (Google, GitHub)
## Don't touch
Existing session-based auth — must still work
## Constraint
No new npm dependencies

# Feed it in
aicouncil plan --file brief.md
```

You can also pipe it:

```bash
echo "Add health check endpoint on /health returning JSON" | aicouncil plan --stdin
```

Or combine a topic with extra context:

```bash
aicouncil plan "Refactor auth" --file notes.md
```

---

## The Loop

Here's what you actually do, step by step:

| Step | You | aicouncil |
|------|-----|-----------|
| 1 | Tell your AI what you want | — |
| 2 | — | `aicouncil plan` → Claude + Codex write plans |
| 3 | Read the 3 plans, write synthesis | — |
| 4 | Answer the hard questions | — |
| 5 | — | `aicouncil continue` → Claude + Codex review the plan |
| 6 | Read reviews, revise the plan | — |
| 7 | — | `aicouncil continue` → round 2 reviews |
| 8 | Write final plan | — |

The parts **you** do are all inside your AI tool — reading, thinking, writing. The parts **aicouncil** does are spawning AI agents with different perspectives to challenge and improve the plan.

---

## Why Not Just Ask Claude?

One AI gives you **an** answer.

Three AIs with different roles give you a **debated** answer:

- **Claude** plays conservative — "What breaks in 6 months? What edge case did we miss?"
- **Codex** plays practical — "How does this actually land in our repo? What tests?"
- **You (OpenCode)** are the lead — compare, decide, resolve conflicts

A single AI has blind spots. Three AIs catch each other's.

---

## Commands

```bash
aicouncil plan <topic>              # Start: spawn agents to write plans
           [--file <path>]           #   with extra context from a file
           [--stdin]                 #   with topic piped from stdin

aicouncil continue <run-dir>        # Advance: run reviews, detect next step

aicouncil status <run-dir>          # Check: what stage is this run at?

aicouncil init                      # Setup: create council.yaml in current dir

aicouncil run <stage> <run-dir>     # Manual: execute a single stage

aicouncil validate                  # Check: is my council.yaml correct?
```

Options: `--dry-run` (preview only), `--verbose` (show everything)

---

## Setup for Your AI Tools

### Claude Code

```bash
npm install -g @anthropic-ai/claude-code
claude --version
```

In `council.yaml`:
```yaml
claude:
  command: "claude"
  args: ["-p", "--bare"]    # --bare = faster, skips repo scan
```

### Codex

```bash
brew install codex          # macOS
codex --version
```

macOS might block it: `xattr -d com.apple.quarantine $(which codex)`

In `council.yaml`:
```yaml
codex:
  command: "codex"
  args: ["exec"]            # non-interactive mode
```

### OpenCode (that's you)

You don't install or configure OpenCode — **you ARE the orchestrator**. When the workflow says "synthesize", "revise", or "finalize", that's you reading the outputs and writing the next file in your AI tool.

```yaml
opencode:
  # no "command" — because it's you
  role: "Lead Developer & Orchestrator"
```

---

## Configuration

`aicouncil init` creates this. Edit what you need:

```yaml
version: 2

defaults:
  timeoutSeconds: 1800
  outputLanguage: "en"       # "zh-CN", "ja", etc.

agents:
  claude:
    command: "claude"
    args: ["-p", "--bare"]
    role: "Conservative Architect"

  codex:
    command: "codex"
    args: ["exec"]
    role: "Implementation Architect"

  opencode:
    role: "Lead Developer & Orchestrator"

workflow:
  stages:
    - id: plan
      agents: [claude, codex]
      parallel: true

    - id: synthesis
      gate: 06_human_answers.md    # ← pauses here for your decisions

    - id: final-plan

    - id: review
      agents: [claude, codex]
      rounds: 2                    # set to 1 for faster iteration

    - id: finalize
```

---

## FAQ

**Q: Do I need all three AI tools installed?**
No. Works with just Claude, just Codex, or both. Edit `agents: [...]` in workflow stages.

**Q: Can I use this without OpenCode?**
Yes — any AI tool can be the orchestrator. Just add a `command` for the orchestrator agent.

**Q: How is this different from just asking Claude to review Codex's output?**
aicouncil enforces structure. Agents write in the same format. Reviews are structured. Outputs are numbered and trackable. You don't manually copy-paste between tools.

**Q: Where do the runs go?**
`runs/` directory in your project. Each run is a timestamped folder with numbered files. Git-ignore `runs/` if you want.

---

## 中文说明

AICouncil 是多 AI 模型开发议会编排工具。一条命令让 Claude、Codex、OpenCode 三个 AI 并行出方案、互相评审、迭代收敛，最终产出可执行的实施计划。

核心理念：一个 AI 给你答案，三个不同视角的 AI 给你辩论过的方案。

---

## License

MIT
