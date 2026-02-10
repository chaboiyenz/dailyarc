### 📋 Phase 1: Foundation & "The Rigging"

**1. Clean the Hytel Template**

- [ ] Remove/Disable `apps/functions` from `turbo.json` and `pnpm-workspace.yaml`.
- [ ] Delete the `apps/functions` directory to enforce the "Thick-Client" architecture.
- [ ] Ensure `apps/web` is running on Vite + React + Tailwind.

**2. Shared Logic & Exports (`@repo/ui` & `@repo/shared`)**

- [ ] Update `packages/ui/package.json` to include the `/src/` prefix in all `exports` (e.g., `"./Button": "./src/components/ui/button.tsx"`).
- [ ] Update `apps/web/tailwind.config.js` to include `../../packages/ui/src/**/*.{ts,tsx}` in the `content` array.
- [ ] Create `UserSchema` in `packages/shared/src/schemas/user.ts` including `uid`, `role`, `onboardingComplete`, and `stats`.
- [ ] Create placeholder `DailyArcSchema` in `packages/shared` for Phase 2 readiness logic.
- [ ] Verify `packages/ui/src/index.ts` exports the `cn` utility for Tailwind class merging.

**3. Firebase Client & Auth Setup**

- [ ] Initialize Firebase (Auth, Firestore, Storage) in `apps/web/src/lib/firebase.ts`.
- [ ] Implement Google Auth provider in `firebase.ts` and `AuthProvider.tsx`.
- [ ] Update `AuthProvider` to check if a user document exists in Firestore to determine if onboarding is needed.
- [ ] Deploy **Firestore Security Rules** to allow users to `read/write` only their own `uid` document in the `/users` collection.

**4. Professional Onboarding UI**

- [ ] Redesign `OnboardingFlow.tsx` with a visual **Stepper/Progress Bar**.
- [ ] Use Shadcn `Card` components for **Role Selection** (Trainee vs. Trainer) with active/hover states.
- [ ] Implement a **Loading Overlay** or Spinner during the `setDoc` Firestore write operation.
- [ ] Add **Toast notifications** for error handling (e.g., "Insufficient Permissions" or network errors).

---

### 🛠️ Verification for Phase 1

- [ ] **Auth Check**: Can I log in with Google and remain logged in after a refresh?
- [ ] **Data Check**: Does the Firestore `users` collection reflect the exact data structure defined in `UserSchema`?
- [ ] **UI Check**: Do the Shadcn components (Buttons, Cards) show their Tailwind styles correctly?
- [ ] **Security Check**: Can an authenticated user write to a different `uid` document? (Should result in "Missing or insufficient permissions").

### Phase 2: The Logic Core (Readiness & Math)

_Focus: Implementing the "Brain" in a testable environment before building the UI._

- [ ] **Pure Logic Implementation (`@repo/shared`)**
- [ ] Implement `calculateReadinessFactor(sleep, stress, soreness)` function.
- [ ] Implement `calculateDynamicMacros(baseMacros, readinessFactor)` function.
- [ ] **Test:** Write `readiness.test.ts` in Vitest to ensure 5hrs sleep = low score.

- [ ] **The Readiness Component (`apps/web`)**
- [ ] Create `ReadinessCheck.tsx` using Shadcn `Slider` and `RadioGroup`.
- [ ] Create `useSubmitReadiness` hook (writes to `/dailyArcs/{id}`).

- [ ] **The Adaptive Dashboard (`apps/web`)**
- [ ] Build **Macro Rings** component (Visualizing the calculated targets).
- [ ] Fetch today's Arc using TanStack Query + Firestore `onSnapshot` (Real-time).

### Phase 3: The "Tech Tree" & Training

_Focus: The workout progression system._

- [ ] **Progression Logic (`@repo/shared`)**
- [ ] Define the `CALISTHENICS_TREE` JSON constant (Levels, prerequisites).
- [ ] Implement `getNextProgression(currentStats)` logic.
- [ ] **Test:** Ensure logic suggests "Diamond Pushups" only after "Standard Pushups" mastery.

- [ ] **Workout Logger (`apps/web`)**
- [ ] Build **Session View** (List of exercises based on the Tree).
- [ ] Implement "Log Set" functionality (Reps, RPE, Video attachment placeholder).

- [ ] **Video Upload (`apps/web`)**
- [ ] Integrate Firebase Storage SDK.
- [ ] Allow attaching a video file to a specific set log.

### Phase 4: Smart Nutrition & Inventory (The UVP)

_Focus: solving "What can I eat?"._

- [ ] **Inventory System (`apps/web`)**
- [ ] Create `InventoryManager` UI (Add/Remove items to `user.inventory`).
- [ ] Implement "Quick Scan" UI (Common items grid).

- [ ] **Recipe Engine (Client-Side)**
- [ ] Create `apps/web/src/lib/edamam.ts` service (Fetch recipes).
- [ ] Implement **Client-Side Filtering**: Match API results against `user.inventory`.
- [ ] Build **Gap List** logic: `Recipe Ingredients - Inventory = Shopping List`.

### Phase 5: The Super-Coach Portal & Social

_Focus: Multi-user data access and messaging._

- [ ] **Trainer Dashboard (`apps/web`)**
- [ ] Create `useTrainees` hook (Query `users` where `trainerId == currentUser.uid`).
- [ ] Build **Risk Dashboard** (Filter clients by low Readiness Score).

- [ ] **Contextual Messaging (`apps/web`)**
- [ ] Create `messages` collection structure: `{ contextId, contextType: 'meal' | 'workout' }`.
- [ ] Build **Chat Drawer** component (opens when clicking a Log).
- [ ] Implement real-time listener for new comments.

### Phase 6: Security & Deployment (The "Firewall")

_Focus: Replacing the backend with strict rules._

- [ ] **Firestore Security Rules (`firestore.rules`)**
- [ ] **User Data:** Allow read/write only if `request.auth.uid == resource.id`.
- [ ] **Trainer Access:** Allow read/write to `users/{id}` IF `request.auth.uid == resource.data.trainerId`.
- [ ] **Validation:** Ensure incoming data matches Zod schema constraints (e.g., `readiness` must be 0-1.2) using Rules validation.

- [ ] **CI/CD Pipeline (.github/workflows)**
- [ ] Configure `deploy-dev.yml` to build `apps/web` and deploy to **Firebase Hosting**.
- [ ] Configure `ci.yml` to run `pnpm test` (Vitest) on every PR.

- [ ] **Stripe Integration**
- [ ] Integrate Stripe Client-only Checkout (or Payment Links) for Trainer subscription billing.

---

### 📊 Summary of "Hytel" Locations

| Logic Type        | Location                        | Tech Details                            |
| ----------------- | ------------------------------- | --------------------------------------- |
| **Data Shape**    | `packages/shared/src/schemas`   | Zod (Exported types)                    |
| **Core Math**     | `packages/shared/src/logic`     | Pure TypeScript functions               |
| **Unit Tests**    | `packages/shared/src/__tests__` | Vitest                                  |
| **Data Fetching** | `apps/web/src/hooks`            | React Query + Firebase SDK              |
| **UI Components** | `packages/ui/src`               | Shadcn + Tailwind                       |
| **Security**      | `firestore.rules`               | Google CEL (Common Expression Language) |
