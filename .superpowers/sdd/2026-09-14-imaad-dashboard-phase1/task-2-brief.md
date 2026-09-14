## Task 2: Design Tokens and Fonts

**Files:**
- Modify: `imaad-dashboard/tailwind.config.ts`
- Modify: `imaad-dashboard/app/globals.css`
- Modify: `imaad-dashboard/app/layout.tsx`
- Create: `imaad-dashboard/lib/design-tokens.test.ts`

**Interfaces:**
- Produces: Tailwind color tokens `brand.black`, `brand.lime`, `brand.mint`, `brand.lavender`, `brand.neutral`, `brand.gray`; CSS variable `--font-sans` bound to IBM Plex Sans.

- [ ] **Step 1: Write failing test asserting token values**

```ts
// lib/design-tokens.test.ts
import { describe, it, expect } from "vitest";
import tailwindConfig from "../tailwind.config";

describe("brand color tokens", () => {
  const colors = (tailwindConfig.theme?.extend as any).colors.brand;

  it("defines exact brand hex values", () => {
    expect(colors.black).toBe("#060505");
    expect(colors.lime).toBe("#CAE51B");
    expect(colors.mint).toBe("#86D6C9");
    expect(colors.lavender).toBe("#D9B9F2");
    expect(colors.neutral).toBe("#FAFAFA");
    expect(colors.gray).toBe("#212121");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/design-tokens.test.ts`
Expected: FAIL (colors undefined, tailwind.config has no `brand` key yet)

- [ ] **Step 3: Implement tokens**

`tailwind.config.ts`:
```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#060505",
          lime: "#CAE51B",
          mint: "#86D6C9",
          lavender: "#D9B9F2",
          neutral: "#FAFAFA",
          gray: "#212121",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(6,5,5,0.06)",
        md: "0 4px 12px rgba(6,5,5,0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

`app/layout.tsx` (font wiring):
```tsx
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plexSans.variable}>
      <body className="bg-brand-neutral text-brand-black font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
```

`app/globals.css` — keep Tailwind directives, add base resets:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body {
  height: 100%;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/design-tokens.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts app/globals.css app/layout.tsx lib/design-tokens.test.ts
git commit -m "feat: wire IMAAD brand tokens and IBM Plex Sans"
```

---

