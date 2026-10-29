# Attack matrix and run size

The attack matrix is the plan the Promptfoo configuration is built from, and the record of what the run did. Keep it in `attack-matrix.md` in the engagement folder. Start it in Weak spots, fill it through Strategies, show it at checkpoint 2, and complete it after Run, Review and the second pass. The configuration follows the matrix, not the other way round: if you change a plugin, strategy or count, change the matrix first.

## The file

Two tables, joined by ID. One row per plugin and strategy pair, plus one row per normal task. Keep cells short and link to files rather than pasting payloads.

```markdown
# Attack matrix

Target: <app, mode, model>. Plan approved: <who, when>. Hard cap: <requests>.

## Plan

| ID | Pass | Weak spot (rule) | Channel, account | Plugin | Strategy (why; alternative) | Cases × runs | Requests (est.) | Pass/fail check | Normal task |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | 1 | <boundary in the user's words> | chat, <account> | <`policy`, exact case or built-in id> | basic (plain request works?) | 3 × 1 | 3 | <saved-state check or rubric> | N1 |
| A2 | 1 | <same boundary> | chat, <account> | <plugin route> | jailbreak:meta, numIterations 4 (refines a single ask; alt: crescendo, maxTurns 4) | 3 × 1 | ≤ 12 | <check> | N1 |
| N1 | 1 | Normal task for A1–A2 | chat, <account> | exact case | basic | 1 × 1 | 1 | <expected effect> | — |
| **Total** | | | | | | **7 cases** | **≤ 16 + judge 7** | | |

## Results

| ID | Cases ran | Happened | Didn't | Can't tell | Evidence |
| --- | --- | --- | --- | --- | --- |
| A1 | 1 | 0 | 1 | 0 | runs/baseline/results.json#A1 |
```

- **Pass** is 1 for the first run and 2 for second-pass rows. Add second-pass rows; never edit first-run rows to match.
- **Cases × runs**: generated cases for this row, times repeats per case (`--repeat`).
- **Requests (est.)**: messages the target will receive. Single-turn is 1 per case. Multi-turn and iterative strategies count their full limit per case: `maxTurns` for crescendo and GOAT, `numIterations` for iterative jailbreaks. Crescendo rarely stops early. With `stateful: true`, Promptfoo 0.125.0 ignores crescendo's `maxBacktracks`; without it, add `maxBacktracks` too. Count judge calls separately in the total.
- **Strategy (why; alternative)**: the recommendation from [plugins and strategies](plugins-and-strategies.md), its reason in a few words, and the alternative the user can swap in at checkpoint 2.
- **Pass/fail check**: name the saved state you'll read, or the rubric file. Every attack row points at a normal task that should still work.
- **Results**: use Review's three verdicts. Connection, setup and grader errors go in Can't tell with the reason in Evidence.

## Size the run

Promptfoo's defaults are large: 5 tests per plugin, `basic` runs every plugin test as-is, crescendo allows 10 turns plus 10 retries, GOAT 5 turns, iterative jailbreak 10 iterations, and `jailbreak:composite` about 5 cases per test. Unless the user sets other limits, plan the first run with:

- About 60% of the budget, counted at the full turn limits. Keep about 40% for the second pass. If the user gave no budget, propose 100 messages.
- `numTests: 3` on each plugin: three different wordings per weak spot. One attempt per weak spot often misses a flaw that is there.
- `basic` on every test, plus one multi-turn or iterative strategy on the weak spots where pressure makes sense (see [plugins and strategies](plugins-and-strategies.md)), with short limits: `jailbreak:meta` `numIterations: 4`, crescendo `maxTurns: 4`, GOAT `maxTurns: 4`. Set `stateful: true` on crescendo and GOAT when the target keeps the conversation on its side. Skip `jailbreak:composite` and `jailbreak:hydra` in the first run.
- One run per case (no `--repeat`).
- One normal task per weak spot.

One weak spot planned this way costs about 16 messages (3 `basic` + 3 × 4 multi-turn + 1 normal task), so about four fit in 60. If the plan doesn't fit, use `numTests: 2`, or keep only `basic` on weak spots tested with exact cases (planted content, hidden codes).

The second pass uses the rest: for each weak spot that nearly gave way, 2–4 exact replays of the nearest miss; for each that held, 1–2 more multi-turn conversations; and their normal tasks.

```yaml
redteam:
  numTests: 3
  plugins:
    - id: policy
      numTests: 3
      config: { policy: <the rule, naming the account, record and forbidden effect> }
  strategies:
    - id: basic
    - id: jailbreak:meta
      config: { numIterations: 4 }
    # or, for a gradual pretext:
    # - id: crescendo
    #   config: { maxTurns: 4, stateful: true }
```

A strategy applies to every plugin test unless you limit it. Check these keys against the installed CLI's help and docs before relying on them.

## Ask before going bigger

At checkpoint 2, show the matrix totals and ask whether the user wants more, naming what each option costs:

- **More tests per plugin**: more different attack wordings for the same weak spot. Multiplies that row's cases.
- **More runs per case** (`--repeat N`): the same case sent N times, which shows whether a result is consistent on a non-deterministic model. Multiplies that row's requests and judge calls by N.
- **Another strategy or longer turn limits**: more ways in, at the request cost in the matrix.

Default to no. Never go past a hard cap the user set, even when they ask for more runs; say what would fit instead. A later increase goes back through checkpoint 2.

## Reconcile

- After generation, count the cases in the generated file per row. Fix the configuration or the matrix before running if they differ.
- After the run, fill Cases ran from the results file, not from the plan. If the total differs from the plan (missing file, strategy that under-generated, extra retries), stop and explain before reporting any pass rate.
- Record actual requests and judge calls in the manifest and compare them with the plan's estimate.
