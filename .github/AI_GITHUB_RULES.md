# AI GitHub Development Rules

## Purpose
This repository is operated with a phase-based AI development workflow. AI must complete and verify a logical phase before publishing its final GitHub change.

## Non-negotiable rules

1. Treat each requested development unit as one logical phase/task.
2. Complete all related work for the phase before publishing the phase's final GitHub state.
3. Do not push every intermediate edit to GitHub.
4. Batch related changes and publish a consolidated final state.
5. One logical phase should have one working branch.
6. One logical phase should have one PR.
7. Never create a duplicate PR for a phase that already has an open PR.
8. If a PR already exists for the phase, update that PR instead of creating another one.
9. Do not mix unrelated work into the phase or its PR.
10. Do not perform unrelated refactoring, formatting, dependency upgrades, or architecture changes.

## Commit rules

11. Prefer one consolidated logical commit for a completed phase.
12. Avoid meaningless commits such as `final`, `final2`, `test`, or `fix123`.
13. Commit messages must clearly describe the phase/change.
14. Do not create commits merely to test an idea if the change can remain unpushed until the phase is ready.

## Branch rules

15. Never work directly on `main` for normal development.
16. Use a dedicated branch for each phase.
17. Do not force-push unless explicitly required for a controlled recovery operation.
18. Never rewrite shared branch history as a normal development step.
19. Keep production/default-branch history stable.

## Pre-PR verification

20. Before opening/updating the final PR, inspect the complete diff.
21. Verify the changed-file list.
22. Remove unintended changes.
23. Run all project-appropriate tests.
24. Run linting when configured.
25. Run type-checking when configured.
26. Run the production/build validation when configured.
27. Check configuration changes.
28. Check for accidentally committed secrets or credentials.
29. Verify the phase acceptance requirements.
30. Do not claim a check passed unless it actually passed.

## CI rules

31. CI is required for pull requests.
32. The CI workflow must use concurrency control so obsolete runs are cancelled when a newer run for the same PR/branch starts.
33. Do not intentionally create duplicate CI workflows for the same validation.
34. Keep CI focused on relevant changes.
35. Required CI checks must be green before merge.
36. A failed, cancelled, or pending required check must not be treated as successful.
37. Do not bypass CI to merge.
38. Do not disable required CI checks to make a PR mergeable.
39. When CI fails, diagnose and fix the existing phase/PR rather than opening a replacement PR.
40. Re-run only the necessary validation after a fix.

## Merge rules

41. Never merge a PR while required CI is failing or pending.
42. Merge only after all required checks are green.
43. Do not bypass branch protection or required reviews.
44. Do not merge unrelated changes together merely because CI is green.
45. The final merged state must correspond to the verified PR state.

## Security rules

46. Never commit API keys, passwords, tokens, private keys, or other credentials.
47. Never commit `.env` files containing secrets.
48. Use repository/environment secrets where secrets are required.
49. Never print secrets in CI logs.
50. Do not weaken repository security controls for convenience.
51. Do not disable branch protection or required checks as a workaround.

## Dependency rules

52. Add a dependency only when it is genuinely required.
53. Avoid unrelated dependency upgrades.
54. Avoid unnecessary lockfile churn.
55. Major dependency upgrades should be isolated from unrelated feature work when practical.
56. Verify dependency changes before merge.

## Safety rules

57. Preserve existing working functionality unless the phase explicitly changes it.
58. Identify breaking changes before merge.
59. Treat database/schema migrations as high-risk changes and verify them carefully.
60. Do not execute destructive production operations as part of ordinary development.
61. Keep a clear rollback/recovery path for production-impacting changes.
62. Do not delete production data or critical infrastructure without explicit authorization.

## AI behavior

63. AI should work autonomously within the defined phase scope.
64. AI must not treat an intermediate edit as a completed phase.
65. AI must self-review before creating/updating the final PR.
66. AI must report failures honestly.
67. AI must not fabricate test, build, lint, or CI results.
68. AI must fix failures in the existing branch/PR when possible.
69. AI must not create duplicate branches/PRs to hide failures.
70. AI must not silently expand scope.

## Phase completion protocol

71. Receive phase requirements.
72. Plan the phase internally.
73. Implement all required changes.
74. Review the complete diff.
75. Run project-appropriate local validation.
76. Consolidate related changes.
77. Publish the phase's final branch state.
78. Create or update exactly one PR for the phase.
79. Allow the required CI validation to run.
80. Wait for required CI to become green.
81. Resolve any CI failure in the same PR.
82. Do not merge until all required checks are green.
83. Merge only the verified PR state.
84. Verify the post-merge/deployment state when deployment is configured.

## Important implementation note

GitHub Actions can prevent duplicate active runs with `concurrency`, but Actions alone cannot enforce the final merge gate. The repository's `main` branch must also have a GitHub ruleset/branch-protection policy requiring the designated CI status check before merging. That repository setting is an administrative control and is separate from this file.
