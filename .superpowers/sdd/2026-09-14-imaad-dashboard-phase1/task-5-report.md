# Task 5 Report: Mock Data, Adapter, and API Client Seam

## Import structure used

Used the brief's **primary structure** — no split into `lib/api/errors.ts` was needed.

- `lib/api/client.ts` defines `ApiClient`, `ApiError`, and `apiClient`, and imports `mockClient` from `lib/mock/adapter.ts`.
- `lib/mock/adapter.ts` imports `ApiClient` (type) and `ApiError` (value) from `lib/api/client.ts`.

Why it works despite the apparent cycle: `ApiError` is a class declaration (hoisted binding) evaluated before the trailing `import { mockClient } from "@/lib/mock/adapter"` line executes in `client.ts`. `adapter.ts`'s only value-level use of the cycle is calling `new ApiError(...)` inside functions that run later (at test/request time), never at module-eval time — so by the time either module's top-level code needs the other's export, both modules have finished initializing their own exports. Both the Vite/Vitest ESM loader and `tsc --noEmit` handle this without complaint. I ran the test suite and the typecheck specifically watching for circular-import errors and saw none, so I did not apply the `lib/api/errors.ts` fallback.

## Test output (final, all passing)

Command: `node_modules/.bin/vitest run lib/mock/adapter.test.ts`

```
 RUN  v5.0.0 /home/sunfyre/Desktop/freelance_project/imaad-dashboard

 Test Files  1 passed (1)
      Tests  6 passed (6)
   Start at  04:58:22
   Duration  754ms
```

Full suite (`node_modules/.bin/vitest run`) also green:

```
 Test Files  3 passed (3)
      Tests  8 passed (8)
   Start at  04:58:35
   Duration  773ms
```

Prior to implementation, the same test file was confirmed to fail (as expected) with:

```
FAIL  lib/mock/adapter.test.ts [ lib/mock/adapter.test.ts ]
Error: Failed to resolve import "./adapter" from "lib/mock/adapter.test.ts". Does the file exist?
```

Note: `pnpm` was not available in the execution environment's PATH, so `node_modules/.bin/vitest` and `node_modules/.bin/tsc` were invoked directly instead of via `pnpm test` / `pnpm tsc --noEmit`. Same underlying binaries/config as the pnpm scripts would use.

## Typecheck output

Command: `node_modules/.bin/tsc --noEmit`

Output: (empty — no errors)

## Files created

- `/home/sunfyre/Desktop/freelance_project/imaad-dashboard/lib/mock/seed.ts`
- `/home/sunfyre/Desktop/freelance_project/imaad-dashboard/lib/mock/adapter.ts`
- `/home/sunfyre/Desktop/freelance_project/imaad-dashboard/lib/mock/adapter.test.ts`
- `/home/sunfyre/Desktop/freelance_project/imaad-dashboard/lib/api/client.ts`

No `lib/api/errors.ts` was created (not needed).

## Commit

- `21874cd` — "feat: add seeded mock data, mock adapter, and swappable API client seam"
  (single commit, no attribution lines per instructions; branch: master, parent: 7813aa0)

---

## Fix-up pass (post-review)

Code review found three real issues in the original implementation. All three were fixed in commit `cb588af`.

### 1. Critical: circular import broke `apiClient` — the "no split needed" conclusion above was wrong

My original analysis only checked whether `ApiError` was safe to reference across the cycle (it was, since it's evaluated before the back-edge). I did not check `apiClient`/`mockClient`, which is the actually load-bearing export. The reviewer wrote a probe and confirmed: when a module imports `./adapter` before `@/lib/api/client` — exactly the order `lib/mock/adapter.test.ts` already used — `client.ts`'s module body runs as a side effect partway through `adapter.ts`'s own evaluation (because, in the old code, `adapter.ts` imported `ApiError` as a **value** from `client.ts`). At that point `adapter.ts` hadn't yet reached its own `export const mockClient = {...}` at the bottom of the file, so `client.ts`'s `export const apiClient: ApiClient = mockClient;` permanently captured `undefined`. I reproduced this empirically (see below) before fixing it.

**Fix applied — the brief's own documented fallback:**
- Created `lib/api/errors.ts` containing only the `ApiError` class (moved out of `client.ts`).
- `lib/api/client.ts` now does `export { ApiError } from "@/lib/api/errors";` so `import { ApiError } from "@/lib/api/client"` still works for any existing/future callers.
- `lib/mock/adapter.ts` now imports `ApiError` from `@/lib/api/errors` (a value import) instead of from `@/lib/api/client`. Its only remaining reference to `client.ts` is `import type { ApiClient } from "@/lib/api/client"`, which is type-only and erased at compile time — so there is no runtime back-edge from `adapter.ts` to `client.ts` at all anymore. The dependency graph is now a clean one-directional chain: `client.ts` → `adapter.ts` → `errors.ts`/`seed.ts`/`models.ts`.

**Regression test added** in `lib/mock/adapter.test.ts`: `"apiClient resolves to a working client even when adapter is imported first"`. The file's imports already had `./adapter` before `@/lib/api/client` (that ordering is now called out in a comment); the new test additionally imports `apiClient` from `@/lib/api/client` and asserts `typeof apiClient.get === "function"` and that a real call (`apiClient.get("/api/organization")`) resolves correctly.

**Empirical verification of both directions**, done before committing:
- Temporarily restored the pre-fix `client.ts`/`adapter.ts` (via `git show 21874cd:...`) with the *new* test file in place, ran `vitest run lib/mock/adapter.test.ts`: the new regression test failed with `TypeError: Cannot read properties of undefined (reading 'get')` at `apiClient.get`, while the other 6 tests still passed — confirming the test actually catches the bug and that the bug was real.
- Restored the fixed files and re-ran: all tests pass, including the regression test.

### 2. Important: KB-processing timers leaked across tests

`simulateKbProcessing`'s two `setTimeout` calls were untracked; `__resetMockStore()` reset `store`/`idCounter` but never cancelled timers from a prior test, creating a real collision risk (a later test's KB doc could reuse an id a previous test's still-pending timer would also mutate) once `idCounter` resets to the same starting value between tests.

**Fix applied:** added a module-level `let pendingTimers: ReturnType<typeof setTimeout>[] = [];` in `lib/mock/adapter.ts`. Both timer handles created in `simulateKbProcessing` are now pushed onto it. `__resetMockStore()` now calls `clearTimeout` on every entry and resets the array to `[]` before resetting `store`/`idCounter`.

### 3. Minor: no comment flagging `KNOWN_PASSWORD` as mock-only

Added a one-line comment directly above `const KNOWN_PASSWORD = "demo1234";` in `lib/mock/adapter.ts`: "Mock-only credential for the demo login flow — not real auth, never used against a real backend."

### Final verification after all three fixes

`node_modules/.bin/vitest run` (full suite):
```
 Test Files  3 passed (3)
      Tests  9 passed (9)
   Start at  05:09:55
   Duration  774ms
```
(9 = the original 6 adapter tests + 1 new regression test + 2 pre-existing tests from earlier tasks.)

`node_modules/.bin/tsc --noEmit`: empty output, no errors.

(As before, `pnpm` was unavailable in PATH in this environment; `node_modules/.bin/vitest` / `node_modules/.bin/tsc` were used directly — same underlying config/binaries as the `pnpm test` / `pnpm tsc --noEmit` scripts.)

### Fix commit

- `cb588af` — "fix: break circular import via lib/api/errors.ts, clear KB mock timers on reset"
  (single commit, no attribution lines; parent: `21874cd`)

Files touched: `lib/api/client.ts` (modified), `lib/api/errors.ts` (new), `lib/mock/adapter.ts` (modified), `lib/mock/adapter.test.ts` (modified).
