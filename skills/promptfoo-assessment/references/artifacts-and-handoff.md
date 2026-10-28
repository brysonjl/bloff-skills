# Artifacts and handoff

Use an existing sensible layout or this engagement layout; never write results into the installed skill:

```text
engagement/
  scope.md                    # decisions, access, limits, permitted effects
  discovery.md                # map, contract, evidence, unknowns
  attack-matrix.md            # plan rows, counts, totals, results; see attack-matrix.md
  manifest.json               # versions, phase status, hashes, counts, paths
  provider.mjs                # or supported alternative
  promptfooconfig.smoke.yaml
  promptfooconfig.baseline.yaml
  promptfooconfig.secondary.yaml
  cases/                      # exact inputs, stable IDs, separate holdouts
  assertions/                 # when checks need reusable code
  runs/                       # smoke, baseline, repairs, secondary; never overwrite
  iteration.md                # evidence-linked rationale and diff
  report.md                   # supported findings, comparison, limitations
  artifacts/                  # redacted evidence you can share
  private/                    # raw captures, session handles, private corroboration
  .promptfoo/                 # local CLI database/logs, excluded from sharing
```

The manifest records target/environment and access mode; helper/target/generator/grader identifiers; actual CLI version; source revision or unknown; artifact hashes; scope/decision references; phase statuses; observed request counts by kind; remaining budget; run timestamps, command/exit status and evidence paths. Store no credentials or cookie values in the manifest. Persist attempt accounting before transmission so restarts and errors do not reset the engagement allowance. Record gaps in server-side usage visibility.

A phase is planned, in progress, executed, verified or blocked; use those words precisely. A config file existing does not make its run executed. Revalidate material assumptions on resume and preserve failed outputs. Keep raw private evidence separately and produce a reviewed redacted handoff rather than publishing the whole workspace.

Promptfoo writes the user's email (the one set for hosted generation) into generated case files (an `# Author:` header), results JSON (`author`), debug logs and `.promptfoo/`. Strip or replace it in anything shared, and leave `.promptfoo/` out of the handoff.

The attack matrix is shareable once payload links point at redacted copies. The final report answers: what was assessed, under which access/model/mode, what worked, what failed, what evidence supports the findings, what changed in the second configuration, what the second evaluation showed, what remains uncertain and how to reproduce. Include useful negative findings, operational failures and assistance. Target safety and assessment coverage are different conclusions.
