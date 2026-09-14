## Task 1: Project Scaffold

**Files:**
- Create: `imaad-dashboard/` (via `pnpm create next-app`)
- Create: `imaad-dashboard/.gitignore`
- Create: `imaad-dashboard/vitest.config.ts`
- Create: `imaad-dashboard/vitest.setup.ts`
- Modify: `imaad-dashboard/package.json` (add vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom, zustand, @tanstack/react-query, recharts, gsap, socket.io-client, @radix-ui/react-dialog, @radix-ui/react-select, @radix-ui/react-tabs, @radix-ui/react-toast)

**Interfaces:**
- Produces: a runnable `pnpm dev` Next.js app, a runnable `pnpm test` command, git repo initialized with first commit.

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd /home/sunfyre/Desktop/freelance_project
pnpm create next-app@latest imaad-dashboard --typescript --tailwind --app --src-dir=false --import-alias "@/*" --eslint
cd imaad-dashboard
git init
```

- [ ] **Step 2: Install additional dependencies**

```bash
pnpm add zustand @tanstack/react-query recharts gsap socket.io-client @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-label
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react
```

- [ ] **Step 3: Configure Vitest**

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./") },
  },
});
```

`vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 4: Run test command to verify empty setup works**

Run: `pnpm test`
Expected: "No test files found" or PASS (0 tests) — exits 0, not a config error.

- [ ] **Step 5: Verify dev server boots**

Run: `pnpm dev &` then `curl -sf http://localhost:3000 > /dev/null && echo OK`
Expected: `OK`. Kill the dev server after.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind, TypeScript, Vitest"
```

---

