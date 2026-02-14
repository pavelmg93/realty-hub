# Kestra Notes

## Docker runner — required setup
- Kestra must run as `user: "root"` for Docker socket access.
- Docker socket must be mounted: `/var/run/docker.sock:/var/run/docker.sock`
- Shared temp dir: `/tmp/kestra-wd:/tmp/kestra-wd` + `kestra.tasks.tmpDir.path: /tmp/kestra-wd/tmp`
- Task containers are isolated — they DON'T inherit compose project network.
- **Must set `networkMode` explicitly** in taskRunner config for DB access:
  ```yaml
  taskRunner:
    type: io.kestra.plugin.scripts.runner.docker.Docker
    networkMode: re-nhatrang_re-nhatrang  # compose project network
  ```
- Network name = `{project}_{network}` (e.g., `re-nhatrang_re-nhatrang`).
- Use `containerImage: python:3.12-slim` (Kestra container has Python 3.10).

## FILE inputs — pattern
- FILE inputs must be consumed directly in the same flow via `inputFiles`.
- The `refCnt: 0` error was actually a storage permissions issue (not a Kestra bug).
  Running as root fixed it.
- Pattern: FILE-receiving flow consumes file + uses conditional subflow for orchestration.
  Subflow only receives STRINGs like batch_id.
- Use `runIf` (NOT `if`) for conditional subflow execution.

## Docker runner — volume limitation
- Docker runner task containers do NOT have host volumes mounted.
- Writing to `/app/logs/kestra` from a Docker runner task DOES NOT persist to host.
- For logs, use Kestra's built-in execution logging or `outputFiles` mechanism.

## SQLAlchemy in Kestra tasks
- Must use `engine.begin()` (auto-commit) NOT `engine.connect()` + manual commit.
- Kestra script tasks run in isolated containers — `from src import ...` won't work.
  All code must be inline in the script block.

## Flow sync
- Host volume `./kestra/flows` loaded on startup via `--flow-path /app/flows`.
- Use `scripts/kestra_flow_sync.sh push` to sync host files -> Kestra DB (with --delete).
- Use `scripts/kestra_flow_sync.sh pull` to sync Kestra DB -> host files.
- Requires `KESTRA_USER=email:password` env var.
- Changes in Kestra UI are NOT synced back automatically.

## Environment variables
- Kestra auto-strips `ENV_` prefix and lowercases for `{{ envs.* }}` access.
- Example: `ENV_GEMINI_API_KEY` -> `{{ envs.gemini_api_key }}` in flows.
- App DB creds use the `envs` convention with `??` defaults for safety.

## AI Copilot
- Configured in `KESTRA_CONFIGURATION` under `kestra.ai` (separate from plugin-ai).
- Currently using Gemini 2.5 Flash.
