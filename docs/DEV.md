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

## Mobile (Expo) map engine notes

The mobile editor UI (OpenSpec task 6.1) currently ships with a lightweight in-app **stub map** so the route-editor UX (bottom sheet, undo/redo, GeoJSON LineString draft, metrics) is usable without native map dependencies.

To switch to a real MapLibre React Native engine later:

1. Add a MapLibre RN package to `frontend/mobile` (choice depends on the project’s preferred RN MapLibre bindings).
2. If the package requires native setup, prefer **Expo config plugins** (SDK 52 compatible) over manual edits.
3. Register the config plugin in `frontend/mobile/app.json` under `expo.plugins`.
4. Run `npx expo prebuild` (or `expo run:ios` / `expo run:android`) to apply native changes.
5. Replace `frontend/mobile/src/components/map/StubMap.tsx` with a MapLibre-backed component that emits `GeoJSONPosition` on tap and renders the `GeoJSONLineStringGeometry` draft.

The geometry contract used by the editor is GeoJSON `LineString` (`type: "LineString"`, `coordinates: [lon, lat][]`) to match backend expectations.
