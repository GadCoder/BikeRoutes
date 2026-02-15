---
name: pr-creator
description: "Create or update pull request descriptions in a strict four-section format: Summary, Why, What Changed, and Considerations. Use when a user asks to draft a PR, improve PR text, or standardize PR messaging before opening a PR."
---

# PR Creator

## Workflow

1. Inspect the branch changes before writing.
2. Extract intent, scope, and risk from changed files and commit history.
3. Write the PR body using exactly these sections and order:
- `## 1. Summary`
- `## 2. Why`
- `## 3. What Changed`
- `## 4. Considerations`
4. Keep `Summary` to one line by default; extend only if needed for clarity.
5. Keep `What Changed` as technical bullet points with concrete modules/files.
6. Include edge cases, setup notes, breaking behavior, and warnings in `Considerations`.

## Output Template

Use this template verbatim:

```md
## 1. Summary
<one-line summary>

## 2. Why
<context and motivation>

## 3. What Changed
- <technical change 1>
- <technical change 2>

## 4. Considerations
- <edge case or risk>
- <setup/migration note>
- <breaking change or warning, if any>
```

## Rules

- Do not omit any section.
- Do not reorder section numbers.
- Prefer concrete behavior and implementation details over vague statements.
- If no breaking changes exist, explicitly say `- No breaking changes.` in `Considerations`.
