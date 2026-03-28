# Workspace Guardrails

- `c:\Projetos\conect360` is the primary running workspace. Do not use this directory for clean PR extraction, `origin/main` cherry-pick chains, or rebases against `origin/main`.
- Never run `git switch`, `git checkout`, or `git rebase origin/main` here when the user is validating the live system from this workspace.
- If work must be based on `origin/main`, create an isolated worktree instead:
  `npm run branch:worktree:new -- -BranchName feat/core-admin-ajuste-x`
- Run the user-facing system from the primary workspace:
  `npm run start:all`
  `npm --prefix frontend-web run start`
- Keep the primary workspace on the active system branch that the user is validating.
- Before risky git work, run `npm run branch:health`. If the branch is far from `origin/main`, move the work to an isolated worktree instead of trying to "clean" the active checkout.

## Execution Mode

- Do not ask for confirmation to proceed to next implementation steps after a phase is completed.
- Continue execution autonomously until the requested scope is finished or a hard blocker is found.
- At the end of each phase, run the tests/checks related to that phase before moving on.
- Report phase results with: implemented changes, executed tests, and pass/fail outcome.
