# aicouncil Skills

Pre-built skill files so your AI tool knows exactly how to use aicouncil. Tell your AI to install it once, use it forever.

## Claude Code

```bash
npx skills add Deger/AICouncil -g
```

Or manually:

```bash
mkdir -p ~/.claude/skills/aicouncil
curl -o ~/.claude/skills/aicouncil/SKILL.md https://raw.githubusercontent.com/Deger/AICouncil/main/skills/aicouncil/SKILL.md
```

Then type `/aicouncil <requirement>`.

## OpenCode

Tell OpenCode:

```
Install the aicouncil skill from https://github.com/Deger/AICouncil/blob/main/skills/opencode/aicouncil.md
```

Or manually:

```bash
curl -o ~/.openclaw/skills/aicouncil.md https://raw.githubusercontent.com/Deger/AICouncil/main/skills/opencode/aicouncil.md
```

## Codex

Tell Codex:

```
Add an aicouncil profile to ~/.codex/config.toml that uses gpt-5.5 with workspace-write sandbox, for running the aicouncil workflow from https://github.com/Deger/AICouncil
```
