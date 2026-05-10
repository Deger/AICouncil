# aicouncil

Multi-agent dev council — use Claude, Codex & OpenCode to plan, review, and converge on technical designs before coding.

## Setup (first time)

```bash
git clone https://github.com/Deger/AICouncil.git /tmp/aicouncil
cd /tmp/aicouncil && npm install && npm link
cd <user-project> && aicouncil init && aicouncil validate
```

## Workflow

Follow this exact order. Each step produces numbered files in `runs/<run-dir>/`.

| Step | Action | Files |
|------|--------|-------|
| 1 | `aicouncil plan "<topic>"` | 00_input, 01_claude, 02_codex |
| 2 | Write your plan | 03_opencode_architect.md |
| 3 | Synthesize 3 plans | 04_synthesis, 05_questions |
| 4 | **Human Gate** — show questions, wait | 06_human_answers |
| 5 | Generate final plan v1 | 07_final_plan, 08_impl_prompt, 09_checklist |
| 6 | `aicouncil continue <run>` | 10_review_claude, 10_review_codex |
| 7 | Classify reviews, revise | 11_synthesis_v2 |
| 8 | `aicouncil continue <run>` | 12_review_* (round 2) |
| 9 | Finish | 14_final.md |

## Synthesis format

When writing `04_synthesis.md`, compare the 3 plans using this structure:

```
## Common Ground
## Major Differences
## Risk Matrix (table)
## Open Questions For Human
## Recommended Direction
## Borrow From Each Plan
```

When writing `05_questions_for_human.md`:

```
### Q1: <question>
- [ ] Option A
- [ ] Option B

## 额外观点 / Additional Thoughts
(free-form section)
```

## Review classification

When reading review outputs, classify each comment:
- **accept** — include in next version
- **reject** — insufficient rationale or conflicts with requirements
- **defer** — noted but not blocking
- **clarify** — needs human input

## Commands

```
aicouncil plan <topic> [--file <path>] [--stdin]
aicouncil continue <run-dir>
aicouncil status <run-dir>
aicouncil init
aicouncil validate
aicouncil run <stage> <run-dir>
```
