# Adapter acceptance

Implement from the observed contract, not a remembered sample. Select the simplest supported provider that preserves the application's semantics. A JavaScript provider implements `id()` and `callApi()`; its returned `output`/`error` must represent the current attempt. [Official provider interface](https://www.promptfoo.dev/docs/providers/custom-api/).

## Required properties where applicable

- **Identity:** establish and verify the actual bound identity after setup and after the tested action. Text claiming another identity does not change the caller. An unobservable identity is a documented limit, not an invented verification.
- **Session:** keep one session for one conversation; isolate independent cases. A bootstrap request may resume state rather than reset it. Use separate cookie jars and discover fresh object references after reset.
- **Fresh output:** correlate request IDs when provided; otherwise use isolated serial execution and verified new-message/current-input correspondence. Reject absent or ambiguous answers and duplicate correlation/message IDs where uniqueness is required; never fall back to an old answer. For streams/polling, define completion and timeout behavior explicitly.
- **Errors:** reject non-success HTTP/application status and malformed output. Preserve the response/status and any returned or subsequently observed state in a protected artifact. A failed setup must stop the case. Error metadata must not become a normal answer that passes an assertion. Validate the record fields, types, uniqueness and reference joins that the oracle relies on, not just the outer JSON/array shape. Missing policy values or classification fields must produce an explicit error/inconclusive result, never silently filter a record out of coverage or become evidence of a violation.
- **Effects:** inspect state before retrying an interrupted mutation. Do not add automatic replay unless the application's idempotency contract has been established and it is within scope. A new request ID alone does not make a duplicate mutation safe.
- **Isolation and accounting:** default to one in-flight request per stateful trial. Keep a persistent aggregate attempt ledger across resets, reruns and process restarts; fail before exceeding the agreed cap. Count setup/debug and failed attempts; distinguish target chat, non-chat API, underlying model, generation and grading calls where observable. Don't claim a client-side ledger enforces unobserved server-side model spending.
- **Evidence separation:** ordinary adapter output must not contain privileged credentials or private traces. Store secret-bearing session handles separately with restricted access; redact shareable artifacts. Obtain privileged corroboration through a separate authorized path.

## Verify the actual execution path

Run a tiny Promptfoo smoke using the real provider entrypoint against normal permitted application behavior.

For a full engagement, also test controlled failures with mocked transport or a local fixture: non-2xx with retained state; failed setup; changed identity; stale/missing/ambiguous answer; duplicate response IDs; missing/malformed evidence fields or reference records used by the oracle; timeout; and duplicate/concurrent execution if supported. For a time-boxed assessment these mocked tests are optional: say so in the acceptance record, keep the error handling in the provider, and move on. Do not spend live target mutations merely to reproduce infrastructure failures.

Acceptance requires a saved actual CLI result, correctly correlated normal response, any required continuity/isolation behavior and explicit errors for tested failures. A lower-level client smoke cannot establish that provider setup, checkout, extraction, assertions or CLI integration work. Nonempty output is a transport check, not a security oracle.

## Timeouts

Bound every long command. macOS has no `timeout` command; use your agent's own command timeout, or Perl, which ships with macOS:

```sh
perl -e 'alarm shift; exec @ARGV' 900 promptfoo eval --config promptfooconfig.baseline.yaml --no-share
```

A command killed this way exits with status 142. Inside the provider, put a timeout on each request (for example `AbortSignal.timeout(120000)` with `fetch`) and check saved state before treating a timed-out change as not made.

## Let assertions read saved state

Return the caller's relevant saved state from the provider in `metadata`, read after the turn. A JavaScript assertion can then check what happened, not what the reply claimed. Shape only; use the target's real fields and rules:

```js
// provider.mjs, inside callApi(), after the chat turn
const state = await readSavedState(session); // the app's own state/read endpoint
return { output: answer, metadata: { identity: state.identity, records: state.records } };
```

```js
// assertions/state.js
module.exports = (output, context) => {
  const md = context?.providerResponse?.metadata;
  if (!md?.records) return { pass: false, score: 0, reason: 'INCONCLUSIVE: no saved state returned' };
  const bad = md.records.filter((r) => !withinPolicy(r)); // the rule from your app map
  return bad.length
    ? { pass: false, score: 0, reason: `STATE VIOLATION: ${bad.map((r) => r.id).join(', ')}` }
    : { pass: true, score: 1, reason: 'Saved state within policy' };
};
```

Reference it with `type: javascript` and `value: file://assertions/state.js`. Label missing evidence as inconclusive so it can't count as a pass or a finding, and confirm the bound identity in the same check. This sees only the caller's state at the end of each test. Multi-turn strategies such as crescendo and GOAT may not pass provider metadata to the assertion at all (seen on 0.121.17 and 0.125.0), so those tests come back inconclusive here. Read back saved state for every account after the run to cover both gaps.
