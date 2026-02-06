# Testing Log

Human-authored observations from running the pipeline. Record edge cases,
parser gaps, Zalo message quirks, and anything that should drive improvements.

For execution history, see the Kestra UI at localhost:8080 (Executions tab).

---

### 2026-02-06 — Session 3: The Great Kestra Debugging Marathon

**What I tested**:
- Gemini API key integration and Kestra AI Copilot activation
- Full ingest-csv + parse-listings pipeline (FILE upload -> DB insert -> parse)
- Docker runner task execution (vs. Process runner)
- Network connectivity between task containers and app-postgres
- Flow sync between host files and Kestra DB

**Input source**:
sample_listings.csv (8 listings), then 2-row test CSV for verification runs.

**Observations**:
- What worked:
    - Kestra AI Copilot activated and responding (Gemini 2.5 Flash)
    - demo-file-test flow: FILE upload + Python script reading works
    - Full pipeline (ingest + auto-parse) succeeds end-to-end
    - Vietnamese parser correctly extracted all fields from test data at 100% confidence
    - Flow sync script (`scripts/kestra_flow_sync.sh push`) works reliably

- What didn't (and the journey to fix it):
    1. **"Illegal state: refCnt: 0, decrement: 1"** — Spent hours investigating
       FILE lifecycle across subflows. ChatGPT analyzed it as a Kestra core bug
       with reference counting. Claude Code investigated source code extensively.
       **Actual root cause**: `/app/storage` volume permissions. Kestra was running
       as non-root user and couldn't write uploaded files. Netty threw a misleading
       error. **Fix**: Run Kestra as `user: "root"` (official Kestra Docker approach).
    2. **"No such file or directory" (SocketException)** — Script tasks defaulted to
       Docker runner but no Docker socket was mounted. **Fix**: Mount docker.sock.
    3. **"Permission denied" installing packages** — Process runner runs as kestra
       user inside the container, can't pip install to system site-packages.
       **Fix**: Use Docker runner (task containers run as root).
    4. **Python 3.10 instead of 3.12** — Kestra container ships Ubuntu's system
       Python 3.10. **Fix**: Docker runner with `containerImage: python:3.12-slim`.
    5. **"could not translate host name app-postgres"** — Docker runner task
       containers spawn on the default bridge network, not the compose project
       network. **Fix**: `networkMode: re-nhatrang_re-nhatrang` in task runner config.
    6. **Custom JSON logs not persisting** — Docker runner task containers don't have
       host volume mounts. Logs written inside them vanish. **Fix**: Removed custom
       log-writing code; rely on Kestra's built-in execution logging (print statements
       appear in Kestra Logs tab).

- Patterns noticed:
    - Kestra error messages are often misleading — the refCnt error had nothing to
      do with FILE references. Always check permissions, networking, and runner
      config before diving into Kestra internals.
    - ChatGPT and Kestra AI Copilot both provided plausible-sounding but incorrect
      analyses. Cross-referencing multiple AI tools didn't converge on the right
      answer — hands-on debugging (checking permissions, trying minimal test flows)
      was what cracked it.
    - The Kestra class example from the instructor was the golden reference for
      docker-compose configuration.

**Parser gaps found**:
- None identified yet — both test listings parsed at 100% confidence.
  Need real Zalo data to stress-test the parser.

**Action items**:
- [x] Fix storage permissions (run as root)
- [x] Fix Docker runner networking (networkMode)
- [x] Remove dead custom log-writing code from flows
- [x] Delete full-pipeline flow (merged into ingest-csv with auto_parse)
- [ ] Test with real Zalo group data to find parser gaps
- [ ] Verify plugin-ai persists across container rebuilds

---

### 2026-02-05 — First run!

**What I tested**:
- Installed Docker Desktop, and enabled WSL access
- First run of docker-compose up, everything got pulled and loaded.
- Signed up to Kestra account on localhost:8080
- Had to modify docker-compose.yml to load in flows from mounted volume
- Ran full-pipeline flow.
- Added AI plugin to Kestra
- Installed Google Cloud Platform SDK (a bit by mistake, but it is here for later versions)
- Set Gemini API key in project .env, mounted it to Kestra container
- Enabled Kestra AI copilot via Gemini

**Input source**:
Loaded sample_listings.csv

**Observations**:
- What worked:
    - Input showed asking for csv file.

- What didn't:
    - Kestra error:
    ```
    Illegal state
    Illegal state: refCnt: 0, decrement: 1
    ```
    - Error persisted despite Claude Code going in a rabbit hole of source code investigation to find the culprit.
    - Kestra AI Copilot suggested couple fixes that were off mark (not following our app data flow logic)
    - Initially thought the bug was outputFiles recapturing the CSV. Actual root cause discovered in Session 3 (storage permissions).

- Patterns noticed:
    - AI tools (Claude Code, Kestra Copilot, ChatGPT) all gave confident but wrong diagnoses for this error.

**Parser gaps found**:
- None tested yet (flow didn't complete)

**Action items**:
- [x] Fix the refCnt error (resolved in Session 3 — storage permissions)

<!-- Template for new entries:

### YYYY-MM-DD — Brief description

**What I tested**: (which flow, what data, how many messages)

**Input source**: (which Zalo group, sample data, etc.)

**Observations**:
- What worked
- What didn't
- Patterns noticed

**Parser gaps found**:
- Specific text patterns the parser missed or got wrong
- Copy the exact Vietnamese text so we can add it as a test case

**Action items**:
- [ ] Things to fix or improve based on this test run

-->