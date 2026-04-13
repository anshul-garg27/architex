# Branch Protection Rules

Recommended branch protection configuration for the `main` branch of the
Architex repository. Apply these rules under **Settings > Branches > Branch
protection rules** in GitHub.

---

## Rule: `main`

### Protect matching branches

| Setting | Value |
|---|---|
| **Branch name pattern** | `main` |

### Pull request requirements

| Setting | Value | Rationale |
|---|---|---|
| Require a pull request before merging | Yes | All changes go through code review |
| Required approving reviews | 1 | At least one reviewer must approve |
| Dismiss stale pull request approvals when new commits are pushed | Yes | Re-review after force-push or new commits |
| Require review from code owners | Yes (when CODEOWNERS exists) | Domain experts review relevant areas |
| Restrict who can dismiss pull request reviews | Maintainers only | Prevent accidental dismissals |

### Status checks

| Setting | Value | Rationale |
|---|---|---|
| Require status checks to pass before merging | Yes | Prevent broken code from landing |
| Require branches to be up to date before merging | Yes | Avoid merge-skew issues |
| **Required checks** | `quality` (CI), `test` (CI), `build` (CI) | Must pass lint, typecheck, tests, and build |

### Additional protections

| Setting | Value | Rationale |
|---|---|---|
| Require signed commits | Optional | Improves auditability if team has GPG set up |
| Require linear history | Yes | Clean history; use squash or rebase merges |
| Include administrators | Yes | Admins follow the same rules |
| Restrict who can push to matching branches | Maintainers | Prevent direct pushes |
| Allow force pushes | No | Never force-push to main |
| Allow deletions | No | Prevent accidental branch deletion |

### Merge strategy

| Setting | Value |
|---|---|
| Allow merge commits | No |
| Allow squash merging | Yes (default) |
| Allow rebase merging | Yes |
| Automatically delete head branches | Yes |

---

## Additional branch rules

### `release/*`

| Setting | Value |
|---|---|
| Require pull request | Yes, 1 approval |
| Required status checks | `quality`, `test`, `build` |
| Allow force pushes | No |

### `hotfix/*`

| Setting | Value |
|---|---|
| Require pull request | Yes, 1 approval |
| Required status checks | `quality`, `test`, `build` |
| Allow force pushes | No |

---

## Applying via GitHub CLI

```bash
# Requires admin access and the GitHub CLI
gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["quality","test","build"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null \
  --field required_linear_history=true \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

---

## Notes

- The `quality` job in CI runs linting and type-checking.
- The `test` job runs the Vitest test suite.
- The `build` job ensures Next.js production build succeeds.
- Consider enabling **Dependabot** alerts and the weekly `dependency-audit.yml`
  workflow for automated vulnerability scanning.
