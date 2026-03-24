# CLAUDE.md Patch — Fix End-of-Session Flow + Remove Session Numbers

Apply these changes to CLAUDE.md before starting Session 28.

---

## 1. Fix "After Every Session" inside Development Workflow section

Find the `### After Every Session` block inside Development Workflow:
```
### After Every Session (AUTOMATIC — do not wait for user to ask)
1. Create a code session log in `docs/code_sessions/YYYY-MM-DD-sessionNN-brief-topic.md` using the Code Session Template
2. Update `docs/CHANGELOG.md` with session changes
3. Mark completed tasks in `docs/SCOPE.md` with `[x]`
4. Run `cd web && npx tsc --noEmit` — confirm clean
5. `git add -A` and suggest commit message: `Session NN: <brief summary>`
6. After user confirms: `git commit` and `git push`
7. Print reminder: `✅ Pushed. On VM: cd ~/realty-hub && git pull && ./scripts/deploy-vm.sh update`
```

Replace with:
```
### After Every Session (AUTOMATIC — do not wait for user to ask)
1. Create a code session log in `docs/code_sessions/YYYY-MM-DD-sessionNN-brief-topic.md` using the Code Session Template
2. Update `docs/CHANGELOG.md` with session changes
3. Mark completed tasks in `docs/SCOPE.md` with `[x]`
4. Run `cd web && npx tsc --noEmit` — confirm clean
5. `git add -A` and recommend commit message: `Session NN: <brief summary>`
6. Stop. User handles: `/export` → `git commit` → `git push` → VM deploy
```

---

## 2. DELETE the standalone duplicate "After Every Session" section

Find the SECOND standalone section (appears lower in the file, outside Development Workflow):
```
## After Every Session (AUTOMATIC — do not wait for user to ask)

1. Create a code session log in `docs/code_sessions/YYYY-MM-DD-sessionNN-brief-topic.md` using the Code Session Template
2. Update `docs/CHANGELOG.md` with session changes
...
7. Print reminder: `Pushed. On VM: cd ~/realty-hub && git pull && ./scripts/deploy-vm.sh update`
```

**DELETE this entire section.** The one inside Development Workflow is canonical.

Also delete the OLD version if it still exists:
```
## After Every Session

1. **Export chat:** Run `/export` any time to save a raw `.txt` transcript...
...
6. **Commit:** `git add -A && git commit -m "Session N: <one-line summary>"`
```

**DELETE that too if present.** Only ONE "After Every Session" block should exist in the file.

---

## 3. DELETE session number footer

Find and DELETE entirely:
```
**Current session number: 27**
**Last completed session: 26 — 2026-03-24 — Card Redesign, Form Overhaul, Title Fix**
```

Session tracking belongs in `docs/SCOPE.md`, not in CLAUDE.md. CLAUDE.md is a stable reference doc.

---

## 4. Fix Deployment section

Find:
```
## Deployment

`deploy-vm.sh update` runs seed + migrate.sh + regenerate-titles.sh automatically.
NEVER suggest running migrations manually — deploy handles it.

End-of-session deploy instructions:
1. `git push`
2. On VM: `cd ~/realty-hub && git pull && ./scripts/deploy-vm.sh update`

That's it. No separate migration commands.
```

Replace with:
```
## Deployment

`deploy-vm.sh update` runs seed + migrate.sh + regenerate-titles.sh automatically.
NEVER suggest running migrations manually — deploy handles it.

**Claude Code does NOT push or deploy.** It commits locally and recommends a commit message.
User handles the full deploy chain: `git push` → SSH to VM → `git pull && ./scripts/deploy-vm.sh update`
```
