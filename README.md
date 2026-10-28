# bloff-skills

Agent skills I use and share. Each folder under `skills/` is one skill: a `SKILL.md` plus any reference files it loads.

| Skill | What it does |
| --- | --- |
| [promptfoo-assessment](skills/promptfoo-assessment/) | Red-team an AI app with Promptfoo. The agent does recon, maps the app, connects Promptfoo, plans and runs attacks, checks what actually changed, does a second pass and writes up findings. It stops at three points for you: check the app map, approve the plan and budget, check the findings. |

## Install

Copy a skill folder into your agent's skill directory.

```sh
# Claude Code, this project only
mkdir -p .claude/skills && cp -R skills/promptfoo-assessment .claude/skills/
# Claude Code, every project
mkdir -p ~/.claude/skills && cp -R skills/promptfoo-assessment ~/.claude/skills/
# Codex, this project only
mkdir -p .agents/skills && cp -R skills/promptfoo-assessment .agents/skills/
```

Other agents that support skills have their own skill folder. Check their docs.

## promptfoo-assessment

- Tested with Promptfoo 0.125.0 on Node 22.22 or later.
- You pick the target, the models and the scope. The skill has no target-specific endpoints, credentials or answers.
- Promptfoo's hosted attack generation and hosted grading need `promptfoo config set email` with your own address first. Hosted grading also needs a `redteam:` section in the config and no `OPENAI_API_KEY` set.
- Only point it at apps you're allowed to test.

## License

[MIT](LICENSE)
