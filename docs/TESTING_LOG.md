# Testing Log

Human-authored observations from running the pipeline. Record edge cases,
parser gaps, Zalo message quirks, and anything that should drive improvements.
Newest entries first.

For execution history, see the Kestra UI at localhost:8080 (Executions tab).

---

### 2026-02-07 — ProMemo Web App: First Manual Test

**What I tested**:
- Signed up as `pavelmg` user
- Created one listing using freestyle text (did not press Parse)
- Browsed Feed (Dean's 37 listings visible)
- Clicked Message on a feed listing to open a conversation

**Observations**:
- What worked:
    - Signup/login flow worked
    - Listing creation via freestyle text succeeded
    - Feed shows Dean's 37 listings correctly
    - Message button creates conversation and navigates to it

- What didn't:
    - **CRITICAL: White text on white background** — entire app was nearly invisible.
      Root cause: Next.js default `globals.css` has `@media (prefers-color-scheme: dark)`
      which sets body text to light color (#ededed) when OS is in dark mode. But all
      component backgrounds are hardcoded `bg-white`/`bg-gray-50`. Fix: removed dark
      mode, forced `color-scheme: light`, explicit dark text on form elements.
    - **Slow performance** — everything felt very slow. Needs investigation (could be
      dev server overhead, unoptimized queries, or cold compilation on first request).

- Patterns noticed:
    - Parse Text button is a stub — doesn't actually extract data yet (TS parser
      port pending, Phase 4)

**Action items**:
- [x] Fix white-on-white text (dark mode CSS override removed)
- [ ] Investigate performance (dev server vs production build, query optimization)
- [ ] Port TypeScript parser (Phase 4) to enable Parse Text button
- [ ] Test with more users / cross-browser

---

### 2026-02-07 — First real data from An Cu Dean 2026

**What I tested**:
 - Copy pasted all 2026-01 and 2026 feb messages from
 An Cu Dean public Zalo channel (no photos yet)
 - Created csv using our script
 - Asked Claude to add pgadmin.
 - Wiped all volumes to erase the Kestra debugging hell.
 - With fresh docker-compose, ran ingest flow with
 ancudean-2026-01_transformed.csv
 - Browsed data in pgadmin


**Input source**:
 - ancudean-2026-01_transformed.csv
 - Group (no really a group yet): An Cu Dean, my friend agent
 - 2026-01 and 2026 feb messages from
 An Cu Dean public Zalo channel (no photos yet)

**Observations**:
- What worked:
   - Pasrsing correctly skipped messages that contained no property info (3/37)
   - Correctly extracted price, frontage, area, ward
- What didn't:
   - Land (dat) listings sometimes got parsed as "home" (nha)
   - Access info like width of adjecent road or "hem" (narrowest type of road in Vietnam)
   did not get understood correctly.
      - "hem thong" - connecting alley.
      - "cach mat duong chi 50m" - only 50m from main road
   - Quite a few listing types failed to be inferred, because they did not have a "ban" type wording.
      - Let's assume it is "for sale" given no other info, but still having property type info.
- Patterns noticed:
   - Pattern like "duong o to" mean road good for cars (not only bikes).
   - "Hem o to" -- same, alley wide enough for cars.

**Parser gaps found**:
- "HƯƠNG ĐIỀN 227M², h đầy đủ" - words after comma got placed into "District", but they mean "fully furnished",
while "Huong Dien" street did not get placed into "Street" column
- Example of failed listing parsing: ca5334e385c2344e58a073653d7dd23c
   KHÔNG NHANH LÀ MẤT! BÁN ĐẤT TẶNG NHÀ ĐƯỜNG HƯƠNG ĐIỀN 227M², NGANG 8M, GIÁ CHỈ 33TR/M
   🌿 Gần trung tâm TP, khu buôn bán sầm uất
   🏡 Bán đất tặng nhà cấp 4 còn sử dụng tốt
   📐 Diện tích 226,5m², ngang 8m vuông đẹp
   🚗 Ô tô ra vào thoải mái, sân để xe rộng
   🛣️ Cách đường ĐỒNG NAI chỉ 50m
   🏘️ Tiện ích xung quanh đầy đủ, an cư ổn định
   📈 Mức giá hiếm, phù hợp đầu tư giữ tiền
   💰 Giá: ~7,48 tỷ (33 triệu/m², thương lượng nhẹ)
   📕 Pháp lý chuẩn, sẵn sàng giao dịch
   ☎️ 0868.33.1111 (An cư cùng Dean)

**Action items**:
- [x] Test with real Zalo group data to find parser gaps
- [ ] Assume listing type for sale, unless otherwise is stated.
- [ ] Let's add a column for "Access" that we'll copy text like "hem o to" or "duong o to", or related, into.
- [ ] Let's add "Furnished" with text like "h đầy đủ" and variations. Could be "unfurnished", "null" for unknown.
- [ ] Let's review a list of property features from this data source (each starts with an emoji on new line), name them in english.
   - [ ] Based on above I will decide then which to add to our listings schema.
- [ ] We are ready to create a db for agents with relation on-to-many to both listings databases,
   - [ ] Place one record there for now for "Dean/Duy" and associate all listings we have so far to him.
- [ ] Let's create a service database for Nha Trang RE, that will contain list of wards, street names, links to OpenStreetMaps, etc. TBD
   - [ ] Search all street names and ward names in Nha Trang City and add into it.
   - [ ] Let's implement basic address validation and approximation, based on ward and street name
- [ ] Let's plan integration with Open Street Maps. Example of street missed above (Huong Dien):
https://www.openstreetmap.org/way/162825697#map=16/12.24176/109.17981
   - [ ] Given validated address fields we can generate rough geo-pin, and store it in new column inside parsed_listings
- [ ] Query data as a DBA and analyze it. Come up with metrics, calculate them, offer methods of improvements. Add to parse code.

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
