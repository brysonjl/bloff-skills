# just-agent-things

Agent skills and instructions I use and share.

- `skills/`: each folder is one skill, a `SKILL.md` plus any reference files it loads. The agent loads a skill when a task calls for it.
- `instructions/`: each file is a standing rule you add to your agent's instructions file (`CLAUDE.md`, `AGENTS.md` and so on). The agent follows it on every turn.

## Skills

| Skill | What it does |
| --- | --- |
| [promptfoo-assessment](skills/promptfoo-assessment/) | Red-team an AI app with Promptfoo. The agent does recon, maps the app, connects Promptfoo, plans and runs attacks, checks what actually changed, does a second pass and writes up findings. It stops at three points for you: check the app map, approve the plan and budget, check the findings. |

### Install

The skills use the open [Agent Skills](https://agentskills.io) format, so they aren't tied to one agent. Copy a skill folder into your agent's skill directory.

```sh
# Claude Code, this project only
mkdir -p .claude/skills && cp -R skills/promptfoo-assessment .claude/skills/
# Claude Code, every project
mkdir -p ~/.claude/skills && cp -R skills/promptfoo-assessment ~/.claude/skills/
# Codex, this project only
mkdir -p .agents/skills && cp -R skills/promptfoo-assessment .agents/skills/
# Kiro, this project only
mkdir -p .kiro/skills && cp -R skills/promptfoo-assessment .kiro/skills/
# Kiro, every project
mkdir -p ~/.kiro/skills && cp -R skills/promptfoo-assessment ~/.kiro/skills/
# OpenCode, this project only
mkdir -p .opencode/skills && cp -R skills/promptfoo-assessment .opencode/skills/
```

Kiro can also import a skill from its GitHub folder URL. OpenCode also reads the Claude Code folders above. Other agents that support skills have their own skill folder. Check their docs.

### promptfoo-assessment

- Tested with Promptfoo 0.125.0 on Node 22.22 or later.
- It plans the campaign in `attack-matrix.md` (weak spot, plugin, strategy, case and request counts, then results) and starts small: one test per plugin, one capped multi-turn strategy, about 12 test cases, then about 6 new ones on the second pass. It asks before running more.
- You pick the target, the models and the scope. The skill has no target-specific endpoints, credentials or answers. Your prompt only describes the target: URL, access, test accounts, rules, what it may change, budget and stop time, and which outside services may see data. It asks for anything missing.
- Your budget is a hard cap. By default it counts messages to the app's AI assistant, Promptfoo's included. It stops when the work is done, even with budget left.
- Promptfoo's hosted attack generation and hosted grading need `promptfoo config set email` with your own address first. Hosted grading also needs a `redteam:` section in the config and no `OPENAI_API_KEY` set.
- Only point it at apps you're allowed to test.

## Instructions

| Instruction | What it does |
| --- | --- |
| [needs-you](instructions/needs-you.md) | The agent ends a turn with a numbered NEEDS YOU block when it needs something from you: a decision, an action only you can take, an assumption to confirm, or a blocker. No block when nothing is needed. |

### Install

Add the file to the instructions file your agent reads.

```sh
# Claude Code, every project
cat instructions/needs-you.md >> ~/.claude/CLAUDE.md
# Claude Code, this project only
cat instructions/needs-you.md >> CLAUDE.md
# Codex, every project
cat instructions/needs-you.md >> ~/.codex/AGENTS.md
# Codex or OpenCode, this project only
cat instructions/needs-you.md >> AGENTS.md
# OpenCode, every project
cat instructions/needs-you.md >> ~/.config/opencode/AGENTS.md
# Kiro, every project (steering file)
mkdir -p ~/.kiro/steering && cp instructions/needs-you.md ~/.kiro/steering/
```

In Claude Code you can import the file instead of copying it, so edits here reach every project: add `@/path/to/just-agent-things/instructions/needs-you.md` to `~/.claude/CLAUDE.md`.

## License

[MIT](LICENSE)
