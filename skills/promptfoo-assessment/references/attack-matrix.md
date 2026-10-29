# Attack matrix and run size

The attack matrix is the plan the Promptfoo configuration is built from, and the record of what the run did. Keep it in `attack-matrix.md` in the engagement folder. Start it in Weak spots, fill it through Strategies, show it at checkpoint 2, and complete it after Run, Review and the second pass. The configuration follows the matrix, not the other way round: if you change a plugin, strategy or count, change the matrix first.

## The file

Two tables, joined by ID. One row per plugin and strategy pair, plus one row per normal task. Keep cells short and link to files rather than pasting payloads.

```markdown
# Attack matrix

Target: <app, mode, model>. Plan approved: <who, when>. Hard cap: <requests>.

## Plan

| ID | Pass | Weak spot (rule) | Channel, account | Plugin | Strategy | Cases × runs | Requests (est.) | Pass/fail check | Normal task |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | 1 | <boundary in the user's words> | chat, <account> | <plugin id or "exact case"> | basic | 1 × 1 | 1 | <saved-state check or rubric> | N1 |
| A2 | 1 | <same boundary> | chat, <account> | <plugin id> | crescendo (maxTurns 4, maxBacktracks 2) | 1 × 1 | ≤ 6 | <check> | N1 |
| N1 | 1 | Normal task for A1–A2 | chat, <account> | exact case | basic | 1 × 1 | 1 | <expected effect> | — |
| **Total** | | | | | | **3 cases** | **≤ 8 + judge 3** | | |

## Results

| ID | Cases ran | Happened | Didn't | Can't tell | Evidence |
| --- | --- | --- | --- | --- | --- |
| A1 | 1 | 0 | 1 | 0 | runs/baseline/results.json#A1 |
```

- **Pass** is 1 for the first run and 2 for second-pass rows. Add second-pass rows; never edit first-run rows to match.
- **Cases × runs**: generated cases for this row, times repeats per case (`--repeat`).
- **Requests (est.)**: messages the target will receive. Single-turn is 1 per case. Multi-turn is at most the turn and retry limits per case (crescendo `maxTurns` + `maxBacktracks`, GOAT `maxTurns`, iterative jailbreak `numIterations`). Count judge calls separately in the total.
- **Pass/fail check**: name the saved state you'll read, or the rubric file. Every attack row points at a normal task that should still work.
- **Results**: use Review's three verdicts. Connection, setup and grader errors go in Can't tell with the reason in Evidence.

## Start small

Promptfoo's defaults are large: 5 tests per plugin, `basic` runs every plugin test as-is, crescendo allows 10 turns plus 10 retries, GOAT 5 turns, iterative jailbreak 10 iterations, and `jailbreak:composite` about 5 cases per test. Unless the user sets other limits, plan the first run with:

- At most about 12 test cases in all, counted after strategies. The second pass adds at most about 6 new ones.
- `numTests: 1` on each plugin (or `redteam.numTests: 1`).
- `basic`, plus at most one multi-turn strategy on the plugins where pressure over several turns makes sense. Cap it with the strategy's own `numTests` (1–2) and short limits: crescendo `maxTurns: 4`, `maxBacktracks: 2`; GOAT `maxTurns: 4`; iterative jailbreak `numIterations: 3`. Skip `jailbreak:composite` unless one plugin clearly needs it.
- One run per case (no `--repeat`).
- One normal task per weak spot.

```yaml
redteam:
  numTests: 1
  plugins:
    - id: <plugin>
      numTests: 1
  strategies:
    - id: basic
    - id: crescendo
      config: { numTests: 2, maxTurns: 4, maxBacktracks: 2 }
```

Check these keys against the installed CLI's help and docs before relying on them.

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
