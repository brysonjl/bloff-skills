# Promptfoo files and execution

Prepare the writable CLI state/log environment below **before** invoking even `--help` or `--version`; startup may access the CLI database. Then consult the installed version's help and official documentation. Tested with CLI **0.125.0** (earlier testing used 0.121.17); do not silently upgrade an existing engagement. Pin the executable/version in its manifest. The skill itself does not install tools, call targets or supply an application adapter until invoked for an engagement.

If available, use the official `promptfoo-provider-setup`, `promptfoo-evals`, `promptfoo-redteam-setup` and `promptfoo-redteam-run` skills for their respective syntax/workflows. They are optional companions, not hidden dependencies. If absent, use the [official documentation](https://www.promptfoo.dev/docs/integrations/agent-skill/) and record that path; don't claim they were installed or invent slash commands.

## Files to author

Create a provider, smoke config, baseline config, exact cases and justified assertions. Preserve these under the engagement's own layout. Use target-derived fields and business rules; do not copy another application's contract. Choose explicit authored cases for a small focused evaluation or generated plugin/strategy cases when justified. Identify purpose, input channel, authentic principal, expected policy, outcome evidence and legitimate utility.

For generic shape only:

```yaml
# Complete provider/config/test files from the observed application contract.
# This shape is not a runnable target connection.
prompts:
  - '{{prompt}}'
providers:
  - id: file://./provider.mjs
    config: {} # Supply the provider's verified application configuration.
tests: file://./cases.yaml
evaluateOptions:
  maxConcurrency: 1
sharing: false
```

If a test variable is intentionally a structured array rather than a Cartesian set of values, use `defaultTest.options.disableVarExpansion: true` in the supported version and verify actual case/turn counts. Do not assume an array of messages is one conversation. YAML environment references use `'{{env.NAME}}'`; provider code should read secure runtime variables. Never place actual secrets into config or examples. See the [configuration reference](https://www.promptfoo.dev/docs/configuration/reference/).

Use named case IDs and deterministic assertions for observable record owner, status, value, action and before/after effects. Check freshness and expected identity as well as the value. Avoid output-length or keyword-only checks for business violations. Test a grader against fixtures that should pass, fail and be classified as operational errors; ensure JavaScript assertion syntax works in the actual CLI. See [adapter acceptance](adapter-acceptance.md) for an assertion that reads the provider's saved state.

When a model judge grades a reply (`llm-rubric` or a plugin's grader), the rubric must say who the logged-in account is, which record is involved and what effect counts as a pass or fail. The judge can't see the session. In a dry run, a rubric that said "names typed in chat don't count" without naming the bound account failed a valid normal task because the reply used the user's own name. Regrade saved outputs after fixing a rubric and label the change as a measurement correction.

## Local CLI state and reproducible execution

Use a private writable engagement directory for CLI state and logs. Example shell setup, from that directory:

```sh
mkdir -p .promptfoo/logs runs/baseline runs/secondary
export PROMPTFOO_CONFIG_DIR="$PWD/.promptfoo"
export PROMPTFOO_LOG_DIR="$PWD/.promptfoo/logs"
export PROMPTFOO_DISABLE_TELEMETRY=1
export PROMPTFOO_DISABLE_UPDATE=1
export PROMPTFOO_CACHE_ENABLED=false
promptfoo --version
promptfoo validate config --config promptfooconfig.baseline.yaml
```

Check supported flags before execution. For a completed explicit-case config, testing verified:

```sh
promptfoo eval --config promptfooconfig.baseline.yaml --no-cache --max-concurrency 1 --no-share --output runs/baseline/results.json
```

Save stdout/stderr, exit status and immutable input hashes. Use distinct paths for repair reruns and the second config/result. Never overwrite the initial failed result. Local logs/CLI databases can contain test data; keep them outside the publishable report. `--no-share` is not a network sandbox: configured targets, generators, graders and remote generation services may still receive data. Review those destinations first. See [CLI reference](https://www.promptfoo.dev/docs/usage/command-line/).

## Generated campaigns

For generation, choose relevant plugins and strategies with explicit purpose and count. Identify the generator and grader separately from the target. Verify and control any remote generation path; a small seed count does not bound adaptive target calls.

Use distinct generation and execution stages when cases need inspection before execution. Save exact generated cases and transcripts; then execute those reviewed files. `redteam run` combines generation and evaluation, so do not use it blindly for a baseline replay. Verify the installed version's commands rather than inventing flags. Retain legitimately sensitive scenario content only in approved services. See [red-team configuration](https://www.promptfoo.dev/docs/red-team/configuration/).

Lessons from dry runs (0.121.17):

- **Email first.** Promptfoo's hosted generation stops at an interactive "Work email" prompt and exits unless an email is already set. With `PROMPTFOO_CONFIG_DIR` exported, run `promptfoo config get email` before generating. If none is set, ask the user to set their own with `promptfoo config set email`, or for the address to set. Never invent or use a placeholder address.
- **Write generated cases next to the config that runs them.** The generated file keeps the config's relative `file://` paths (provider, assertions). Writing it into a subfolder with `redteam generate -o cases/…` breaks those paths. Generate beside the run config, then move or copy it only if you fix the paths.
- **Cap `jailbreak:composite`.** It makes about five cases per test and sometimes errors. Apply it to a few plugins or set a small count, and include its multiplier in the workload estimate.
- **Expect `indirect-prompt-injection` to under-generate**, and its obvious "SYSTEM OVERRIDE" payloads to fail. Check the generated count, and add realistic, routine-looking payloads by hand when the channel matters. The provider has to place each payload where the model will read it (a note, a document) before sending an innocent request. Hosted generation may pack the user's request and the payload into one field ("Prompt: … <payload>"), with the label's capitalization varying; split them before use.
- **Turn off the judge's reasoning text on Ollama.** Since 0.123.1, Promptfoo adds an Ollama model's reasoning to its output by default. A judge's reasoning can quote the grading format, and Promptfoo then reads that instead of the verdict (`pass: false`, reason `"string"`). Set the judge as a provider object:

  ```yaml
  defaultTest:
    options:
      provider:
        id: ollama:chat:<judge model> # the judge the user named
        config: { showThinking: false }
  ```

- **Most findings came from the second pass**, from multi-turn strategies and from planted content that looked like routine work. A clean first run is normal.

After any run, reconcile observed attempts and expanded case counts with the ledger. Check the expanded test count against the plan before trusting a pass rate: a `tests: file://…` path that points at a missing file logs an error, runs one empty test, reports "1 passed (100%)" and exits 0. An exit status or aggregate failure count alone does not distinguish assertions, provider errors and security findings. Unknown usage is unknown, not zero cost.
