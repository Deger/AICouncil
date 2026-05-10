# aicouncil Skills

Pre-built skill files so your AI tool knows exactly how to use aicouncil. Tell your AI to install it once, use it forever.

## Claude Code

Tell Claude:

```
Install the aicouncil skill from https://github.com/Deger/AICouncil/blob/main/skills/claude-code/SKILL.md
```

Or manually:

```bash
mkdir -p ~/.claude/skills/aicouncil
curl -o ~/.claude/skills/aicouncil/SKILL.md https://raw.githubusercontent.com/Deger/AICouncil/main/skills/claude-code/SKILL.md
```

Then just type `/aicouncil <your requirement>`.

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
