# Real browser integration suite

Run from a clean frontend checkout with no `.env` files, paired with a backend checkout
with no `.env` files and installed dependencies. PostgreSQL must be running locally,
with the current OS user allowed to create databases (or supply the override below).

```sh
REAL_API_DIR=/absolute/path/to/jlpt-api REAL_QA_DIR=/absolute/outside/path/qa node scripts/real-stack/run.mjs
```

The default backend path is the sibling `../jlpt-api`. Optional environment overrides:
`TEST_DATABASE_ADMIN_URL` (defaults to local PostgreSQL port5432, current OS username,
maintenance database `postgres`; only localhost/loopback hosts accepted). The test
database URL inherits its credentials/port/options and replaces only the database name.
Other overrides: `REAL_API_PORT` (4617), `REAL_WEB_PORT` (3117), `REAL_QA_DIR` (sibling `../qa`).
Pass Playwright options after the script, e.g. `--project=mobile-320`.
Suggested npm script: `"test:e2e:real": "node scripts/real-stack/run.mjs"`.
The regular Playwright config excludes this suite, preserving the existing 135 tests.

The runner refuses occupied ports and `.env` files, creates a random
`jlpt_v2_test_browser_*` database, applies every ordered SQL migration individually,
seeds synthetic users/grammar/vocabulary, builds Nest and Next, and runs the browser
suite against their real HTTP endpoints. No API route interception is used.
Auth cookies are backed by real AuthSession records and the explicit dummy secret.
The worker and both provider keys are explicitly disabled; only the AI result is
injected directly into the isolated DB after the browser submits a real queued job.
This tests DTOs, cookies/CORS, polling, persistence, and UI integration, not model quality.

Three flows run in desktop Chromium (1280×720) and mobile Chromium (320×800):

- N2 creation preserves N1 and the shared 30-minute budget; pause/resume, 80/20
  allocation, stable task IDs on reload, and all-paused access without onboarding.
- Today starts a real session with a persisted scene; queued sentence job resolves
  into four-part feedback; saving an alternative persists its note. A later review
  hides the saved expression on GET/reload, explicit reveal adds a hint, and an
  unscored hinted completion cannot produce cross-scene evidence.
- Vocabulary bookmark note persists; private import remains a candidate until source
  validation and explicit commit; repeated import does not duplicate private words.

Assertions cover intended local URL, app title, nonblank content, no framework
portal/error, no browser console errors, no horizontal overflow, and database
persistence. Screenshots, JSON results, build/server logs and failed traces are
written outside the repository to `REAL_QA_DIR`.

On normal success or failure the runner terminates only its own child processes
and drops only its randomly created database. It never loads main/production
credentials or touches persistent integration databases. A forced OS kill cannot
run cleanup; the printed unique database name identifies any manual cleanup needed.
Browser plugin was not available; the existing Playwright installation was used.
