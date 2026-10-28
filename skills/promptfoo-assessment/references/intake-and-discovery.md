# Intake and discovery

Start with what the user and available authorized artifacts already establish. Ask in small groups, adapting the next questions to what you learn. Do not demand a full questionnaire before useful work.

## Questions that change the assessment

- **Purpose and policy:** What does the application do, for whom? Which legitimate workflow must keep working? What outcome would constitute a business/security failure? Which rules are supplied policy, and which are hypotheses?
- **Scope and access:** Which environment, URLs/interfaces and accounts are in scope? Is this black-box, source-assisted or an existing assessment continuation? Are source, public client assets, API specifications or traffic captures available? Which writes, test fixtures, resets and cleanup are permitted?
- **Execution envelope:** What is the total target-request/time/spend limit, including setup, debug and both evaluations? Which calls count against it (for example, only messages that reach the model)? Which target, generator and grader models/providers are already approved? May application content go to those services? Are concurrency and disruptive actions constrained?
- **Evidence and delivery:** What public state or private audit evidence can verify effects? Who can retrieve privileged records? Where should artifacts go? Does the user want coaching checkpoints or direct execution assistance?

Ask for credential environment-variable names or secure setup paths, not secret values pasted into the conversation. If a URL alone is supplied, learn purpose, access and execution scope before probing it. A local fixture already explicitly authorized for testing does not need repeated authorization questions.

## Discovery record

Maintain a table: claim; evidence path/time; observed/source/user-supplied/inferred; confidence; unresolved question. The application map should connect caller → entrypoint → context/retrieval → model/tool selection → authorization → state/effect. Distinguish who asks from the principal that performs the action.

For the connection contract, discover as applicable:

| Area | Questions to resolve |
| --- | --- |
| Bootstrap/auth | How is a session established? Where is identity bound? Is a session call create, resume or reset? |
| Request | Which method, path, content type and input fields carry a normal interaction? What is user-controlled? |
| Response | Is this one answer, accumulated history, polling or a stream? How do you correlate the current interaction? |
| State | Which operations create/change records? Which reads provide authoritative public state? |
| Isolation | What persists across turns? What is reset? Are object references regenerated? |
| Failure | How are non-2xx, timeouts, busy, limits and partial commits represented? |
| Accounting | What counts as a target attempt? Can a conversation cause multiple provider/tool calls? |

Observe a normal read and, when permitted, a normal write before designing a boundary comparison. Lack of source is a constraint to preserve, not permission to inspect hidden files. Source access does not make source claims equivalent to runtime evidence. Do not reuse adapters, findings or write-ups from earlier assessments of the same target during an independent attempt.
