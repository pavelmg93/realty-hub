---
name: savechat
description: Save a structured summary of the current conversation to docs/chat_exports/. Use before context compaction or at end of session.
---

Review the full conversation so far and create a chat export file.

1. Determine today's date and a 3-5 word slug describing the main topic of this conversation.
2. Create a file at `docs/chat_exports/YYYY-MM-DD-<slug>.md` using this format:

```
# Chat Export: [Topic]
**Date:** YYYY-MM-DD
**Session:** [Session number if known]

## Summary
[2-3 paragraph summary of what was discussed and accomplished]

## Key Decisions & Changes
[Bullet list of important decisions, architectural choices, or approaches agreed on]

## Files Modified
[List of files created or changed, with one-line description of what changed]

## Problems Solved
[Bugs fixed, errors resolved, deployment issues worked through]

## Pending / Next Actions
[Anything left open, deferred, or planned for next session]

## Deployment Notes
[Any VM, Docker, or infrastructure state changes — migrations run, env vars set, etc.]
```

3. After creating the file, confirm with the file path.
