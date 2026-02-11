---
trigger: always_on
---

### 1. State & Data Fetching

- **Use TanStack Query:** All Firestore reads must be wrapped in a TanStack Query hook (e.g., `useQuery` or `useFirestoreQuery`). Do not use raw `useEffect` for data fetching.
- **Real-time Sync:** For messaging or live updates, use `onSnapshot` inside a custom hook that cleans up the listener on unmount.

### 2. Style & Layout

- **Tailwind & Shadcn:** Use Tailwind CSS for one-off layouts and Shadcn UI for interactive elements (Buttons, Dialogs, Cards).
- **Responsive Design:** Every dashboard component must be "Mobile First," as trainees will use this in the gym.

---

## 📂 Workspace Rules (`packages/shared/.antigravity/rules/workspace.md`)

_These apply to the logic and schema package._

### 1. Pure Logic Only

- **Constraint:** This package must remain environment-agnostic (no browser APIs, no Firebase SDK).
- **Direction:** Only export pure TypeScript functions (e.g., calculations, macro math) and Zod schemas. This ensures logic is testable via **Vitest**.

### 2. The "DailyArc" Formula

- **Enforcement:** Ensure any modification to the Readiness Factor () calculation follows the PDD formula: .

---

## 📂 Workspace Rules (`packages/ui/.antigravity/rules/workspace.md`)

_These apply to the design system._

### 1. Atomic Design

- **Direction:** Follow the Hytel boilerplate pattern. Place base components in `src/components/ui` (standard Shadcn) and composite components (like the `MacroRing` or `ProgressionTree`) in `src/components`.

---
