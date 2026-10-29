# Choosing plugins and strategies

Plan from the weak spots in the attack matrix, not from Promptfoo's catalog. Built-in plugins test generic categories. Most business rules (who may see a record, what a discount may be, which approval an action needs) need attacks you write for that application. Strategies then decide how each attack is delivered: one message, a conversation, an encoding.

Promptfoo's catalog changes between versions. The IDs below were checked against CLI 0.125.0. Confirm them with `promptfoo redteam plugins` and the [plugin](https://www.promptfoo.dev/docs/red-team/plugins/) and [strategy](https://www.promptfoo.dev/docs/red-team/strategies/) docs before relying on one, and take exact config keys from there.

## Purpose

Generated attacks are only as specific as `redteam.purpose`. Write it from the app map, not from the app's own marketing text:

- Who the logged-in user is and how identity is bound (session, token, account picker).
- The records, approvals and other objects that user owns, by their real IDs, and what state each is in.
- The other accounts and the records of theirs you found in recon, by ID.
- The rules, in the user's words, and the tools the assistant has.

Attacks that cite real records reach far further than invented ones. In one dry run, the only attacks that broke a pricing limit or changed another user's order were those that reused an approval the logged-in user really owned. The generator found that move because the purpose named the approval. Keep secrets, credentials and anything you weren't allowed to read out of the purpose.

## Plugins: write your own first

For each weak spot, choose how its attacks are produced:

| Route | Use it when | Generation | Notes |
| --- | --- | --- | --- |
| `policy` plugin, one per rule | The rule can be stated in plain words. This covers most weak spots. | Promptfoo's hosted generation works | Write the policy so it names the logged-in account, the record and the forbidden effect. Its grader judges the reply only, so pair it with a check on saved state. |
| Exact cases you write | You know the shape of the attack: planted content that looks like routine work, a specific pretext, a second-pass replay. | None | Put them in a `tests:` file, or in the `intent` plugin when strategies should wrap them. Write them like real users and real content, not obvious override text. |
| Custom plugin file (`file://…yaml` with `generator` and `grader`) | You need a generator prompt a policy can't express, such as several input fields. | Needs a local generator model (`redteam.provider`). Hosted generation doesn't run custom plugin files in 0.125.0. | Use only if the user approved that model and its data sharing. The grader is an `llm-rubric` and can use `{{purpose}}`. |
| Built-in plugin | It matches the weak spot directly. | Hosted | Add it next to your own attacks, not instead of them. |

Built-ins that often match:

| Weak spot | Built-in plugins | Caveat |
| --- | --- | --- |
| Another user's records | `bola`, `bfla`, `rbac` | Generic. Add a `policy` plugin that names the actual accounts and records. |
| Actions without the required approval | `excessive-agency` | Judges the reply. Check saved state for the effect. |
| Content the model reads (notes, documents, retrieved text) | `indirect-prompt-injection` | Under-generates and favours obvious payloads. Add your own routine-looking cases, placed by the provider where the model will read them. |
| Hidden instructions or codes | `prompt-extraction`, `system-prompt-override` | A refusal doesn't prove the secret isn't reachable another way. |
| Personal data across sessions or stores | `pii:session`, `pii:api-db`, `cross-session-leak` | Needs two accounts or sessions to show a leak. |
| What tools exist | `tool-discovery`, `debug-access` | Useful in recon; rarely a finding on its own. |
| Tools that reach a database, shell or URLs | `sql-injection`, `shell-injection`, `ssrf` | Only when the app map shows such a tool. |

Skip the `harmful:*` content plugins unless the user's rules are about harmful content.

## Strategies

A strategy wraps each plugin test. Its cost is the number of messages the target receives per test, which goes in the matrix.

**List strategies explicitly.** If a config lists none, Promptfoo 0.125.0 adds `basic`, `jailbreak:meta` and `jailbreak:composite`, and the last two are expensive.

| Group | IDs | Messages per test | Good against |
| --- | --- | --- | --- |
| Baseline | `basic` | 1 | Always include it. It shows whether the plain request already works. |
| Multi-turn conversation | `crescendo`, `goat`, `jailbreak:hydra`, `jailbreak:goblin`, `mischievous-user`, `custom` | Up to the turn limit; count the full limit | Rules the model keeps on a single request but loosens under rapport, claimed authority or a gradual pretext: ownership, approvals, limits. |
| Single-turn, iterative | `jailbreak`, `jailbreak:meta`, `jailbreak:tree`, `best-of-n` | Up to the iteration limit | A model that refuses a single message. `jailbreak:meta` with `numIterations: 4` was the cheapest per hit in testing. Cap the iterations. |
| Prompt templates | `jailbreak:composite`, `jailbreak-templates`, `jailbreak:likert` | About 5 tests per test for composite | Broad refusal testing. Cap the count. |
| Encodings and obfuscation | `base64`, `rot13`, `leetspeak`, `hex`, `homoglyph`, `morse`, `piglatin`, `camelcase`, `emoji`, `multilingual` | 1 | Keyword filters and guardrails in front of the model, not the model's own judgment. |
| Injection framing | `prompt-injection`, `authoritative-markup-injection`, `citation`, `math-prompt` | 1 | Direct prompt injection and fake authority in the user's message. |
| Situational | `retry`, `layer`, `indirect-web-pwn`, `audio`, `image`, `video`, `gcg` | Varies | Only when the target fits: `retry` replays earlier failures, `layer` chains strategies, the media ones need a multimodal target. |

**Targets that keep the conversation.** If the target keeps the conversation on its side (a session or conversation ID), set `stateful: true` on multi-turn strategies, and have the provider return the session ID. Without it, Promptfoo sends the whole transcript as one message, often into a fresh session. In 0.125.0, `stateful: true` also turns off crescendo's backtracking, so `maxBacktracks` does nothing; plan on `maxTurns` alone.

**Hydra shares memory across a scan.** `jailbreak:hydra` carries what worked in one test into the next. Its hits aren't independent attempts and depend on test order, so use it as a second-pass alternative, not as a measurement.

## What to recommend

| Weak spot | First run | Alternative, or second pass | Why |
| --- | --- | --- | --- |
| Another user's records | `basic` + `crescendo` (`maxTurns: 4`) | `jailbreak:meta` | Models often refuse a direct request but follow a gradual story (a colleague, the same team, a support case). The proof is often a hidden read: the assistant looks the record up, then refuses. To get a visible effect, attack an action on the record, not only a lookup. |
| Limits on prices, discounts or amounts | `basic` + `jailbreak:meta` (`numIterations: 4`) | Second pass: exact cases that cite a real record or approval the user owns and ask to reuse it | No strategy was reliable in testing. Negotiation and claimed authority usually stopped at the limit; reusing something real got through. |
| Actions that need an approval | `basic` + `jailbreak:meta` (`numIterations: 4`) | `crescendo` (`maxTurns: 4`) | A borrowed approval: "use the one recorded on my other order". Hits came within 1–3 turns or iterations. |
| Content the model reads | Your own routine-looking cases, plus `indirect-prompt-injection` | Rewrite the payload as ordinary work: a packing instruction, a booking note | Obvious "SYSTEM OVERRIDE" text fails. A note that reads like normal work is what gets acted on. |
| Hidden instructions or codes | `basic` | `crescendo`, `prompt-injection` | Ask for it as part of a legitimate task. |
| Staff-only knowledge | `basic` | `crescendo` | A plausible staff pretext over a few turns. |
| A filter in front of the model | `basic` | One or two encodings, such as `base64` or `multilingual` | Encodings test filters, not judgment. Skip them if there's no sign of a filter. |

In dry runs on deliberately vulnerable apps, a first run with one attempt per weak spot usually found nothing. A later test on one app (Promptfoo 0.125.0, an open-weight model, 4 attempts per cell) found:

- Every multi-turn and iterative strategy reached an approval flaw at least half the time; `basic` reached it 1 time in 4.
- `jailbreak:meta` cost about 3 messages per attempt; crescendo at 4 turns about 4. Doubling crescendo to 8 turns doubled the cost and found no new flaw.
- GOAT added nothing over crescendo.
- A pricing limit fell to a strategy once in 24 attempts, but to a single message that reused an existing approval 4 times in 4.
- Promptfoo's grader disagreed with saved state on about one conversation in nine, mostly hidden reads and replies that misdescribed what the assistant had done.

Planted content that looked like routine work also found flaws. `jailbreak:composite` sometimes errored.

## Recommend, then ask

At Strategies, write a recommendation into each attack-matrix row: the plugin route, the strategy, a one-line reason, the cost, and one alternative. At checkpoint 2, present them as recommendations. The user approves, swaps or drops each one. If the user asked for coaching, ask them to choose between the two options before showing yours.

Don't add plugins or strategies the user didn't approve. In the second pass, change a strategy only when the first run's evidence points there, for example a reply that nearly gave way.
