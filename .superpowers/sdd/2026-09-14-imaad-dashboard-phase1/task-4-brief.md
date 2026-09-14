## Task 4: Copy Table

**Files:**
- Create: `imaad-dashboard/lib/copy/en.ts`
- Create: `imaad-dashboard/lib/copy/en.test.ts`

**Interfaces:**
- Produces: `copy` object, one namespaced key per screen (`copy.auth.loginTitle`, `copy.overview.title`, etc.) — every later component imports strings from here, never inline.

- [ ] **Step 1: Write failing test**

```ts
// lib/copy/en.test.ts
import { describe, it, expect } from "vitest";
import { copy } from "./en";

describe("copy table", () => {
  it("has no empty string values", () => {
    const flatten = (obj: Record<string, unknown>): string[] =>
      Object.values(obj).flatMap((v) =>
        typeof v === "string" ? [v] : flatten(v as Record<string, unknown>)
      );
    const values = flatten(copy as unknown as Record<string, unknown>);
    expect(values.length).toBeGreaterThan(0);
    expect(values.every((v) => v.trim().length > 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/copy/en.test.ts`
Expected: FAIL (module `./en` doesn't exist)

- [ ] **Step 3: Implement copy table**

```ts
// lib/copy/en.ts
export const copy = {
  app: { name: "IMAAD", tagline: "AI Employees for Modern Business" },
  nav: {
    overview: "Overview",
    aiEmployee: "AI Employee",
    conversations: "Conversations",
    knowledgeBase: "Knowledge Base",
    customers: "Customers",
    requests: "Requests",
    analytics: "Analytics",
    settings: "Settings",
  },
  auth: {
    loginTitle: "Sign in to IMAAD",
    loginSubtitle: "Manage your AI employee and customer conversations.",
    registerTitle: "Create your IMAAD account",
    registerSubtitle: "Set up your organization in a few minutes.",
    emailLabel: "Work email",
    passwordLabel: "Password",
    nameLabel: "Full name",
    orgNameLabel: "Organization name",
    loginSubmit: "Sign in",
    registerSubmit: "Create account",
    switchToRegister: "New to IMAAD? Create an account",
    switchToLogin: "Already have an account? Sign in",
    genericError: "Something went wrong. Please try again.",
    rateLimited: "Too many attempts. Please wait a moment before trying again.",
  },
  overview: {
    title: "Overview",
    subtitle: "What's happening in your customer service right now.",
    escalationsHeading: "Needs attention",
    recentConversationsHeading: "Recent conversations",
    noEscalations: "No conversations are waiting on a human right now.",
  },
  aiEmployee: {
    title: "AI Employee",
    subtitle: "Configure the employee who represents your business.",
    sections: {
      identity: "Identity",
      behavior: "Behavior",
      services: "Services",
      policies: "Policies",
      availability: "Availability",
      escalation: "Escalation",
      actions: "Actions",
    },
    previewHeading: "Live preview",
    saveButton: "Save changes",
  },
  conversations: {
    title: "Conversations",
    listEmpty: "No conversations match this filter.",
    composerPlaceholder: "Write a reply…",
    sendButton: "Send",
    assignButton: "Assign to me",
    statusActive: "Active",
    statusEscalated: "Escalated",
    statusResolved: "Resolved",
    channelWebWidget: "Web Widget",
    channelWhatsapp: "WhatsApp",
  },
  knowledgeBase: {
    title: "Knowledge Base",
    subtitle: "What your AI employee knows about your business.",
    uploadButton: "Add document",
    uploadDialogTitle: "Add a knowledge base document",
    textTab: "Write text",
    pdfTab: "Upload PDF",
    statusPending: "Pending",
    statusProcessing: "Processing",
    statusReady: "Ready",
    statusFailed: "Failed",
    reprocessButton: "Reprocess",
    deleteButton: "Delete",
    empty: "No documents yet. Add your first one to teach your AI employee.",
  },
  placeholder: {
    comingSoon: "This section is coming soon.",
  },
  errors: {
    unauthorized: "Your session has expired. Please sign in again.",
    forbidden: "You don't have permission to do that.",
    notFound: "We couldn't find that.",
    conflict: "That already exists.",
  },
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/copy/en.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/copy/en.ts lib/copy/en.test.ts
git commit -m "feat: add English copy table for i18n-ready UI strings"
```

---

