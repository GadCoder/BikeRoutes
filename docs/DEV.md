# Developer Notes

## Backend (Python)

- Target Python: **3.13**
- On Fedora (and many systems), Python 3.14 can break some dependencies (notably SQLAlchemy typing internals).
- Recommended workflow:

```bash
cd backend
export PATH="$HOME/.local/bin:$PATH"
uv venv --clear
uv pip install -r requirements.txt
uv run alembic heads
uv run pytest -q
```

## Codex CLI flags (for automation)

Use the newer Codex CLI flags to avoid permission/approval issues:

```bash
# Non-interactive (good for QA)
codex exec --full-auto --sandbox workspace-write -C <repo-or-worktree> "<task>"

# Interactive TUI
codex --full-auto --sandbox workspace-write -C <repo-or-worktree>
```
