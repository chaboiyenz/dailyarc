## 1. System Architecture Overview

DailyArc will be a **Thick-Client React Application**. Logic that traditionally lives on a server (macro calculations, progression logic) will live in shared TypeScript packages executed by the browser.

* **Frontend (`apps/web`):** React + Vite + TanStack Query.
* **Database:** Firestore (Direct Client SDK access).
* **Auth:** Firebase Auth (Client-side).
* **Shared Logic (`packages/shared`):** Zod schemas and "Pure" logic functions (Readiness math, Tech Tree progression).
* **UI Components (`packages/ui`):** Shadcn UI patterns.

---

## 2. Monorepo Data Flow

Even without tRPC, we maintain type safety by importing Zod schemas from `@repo/shared` into our Firestore hooks.

| Layer | Responsibility | Hytel Location |
| --- | --- | --- |
| **Validation** | Defining the shape of a "Workout" or "User". | `packages/shared/src/schemas` |
| **Logic** | The formula for  (Readiness) and Macro adjustments. | `packages/shared/src/logic` |
| **Data** | Firestore `getDoc`, `setDoc`, and `onSnapshot` listeners. | `apps/web/src/hooks` |
| **Display** | Shadcn-powered dashboards and progress rings. | `apps/web/src/components` |

---

## 3. The Firestore Schema (NoSQL)

We will use a **Flat Root Collection** strategy to make client-side querying efficient.

### `/users` (Collection)

* `uid`: `string` (Matches Firebase Auth)
* `role`: `'trainee' | 'trainer'`
* `trainerId`: `string | null`
* `inventory`: `string[]` (e.g., `['chicken', 'rice', 'broccoli']`)
* `stats`: `{ currentPushupLevel: number, weight: number }`

### `/dailyArcs` (Collection)

* `id`: `string` (Document ID: `{uid}_{YYYY-MM-DD}`)
* `userId`: `string`
* `readiness`: `{ sleep: number, stress: number, soreness: string[] }`
* `macros`: `{ target: { p: number, c: number, f: number }, actual: { p: number, c: number, f: number } }`

### `/messages` (Collection)

* `participants`: `string[]` (Array: `[traineeId, trainerId]`)
* `contextRef`: `{ type: 'meal' | 'workout', id: string }`
* `text`: `string`

---

## 4. Core Logic (The Browser "Brain")

By moving logic to `packages/shared`, we ensure the math is testable via **Vitest** without needing the full UI or a database.

### The Readiness Calculation

```typescript
// packages/shared/src/logic/readiness.ts
export const calculateReadinessFactor = (sleep: number, stress: number, sorenessCount: number): number => {
  // Base 1.0, minus 0.1 for every hour under 7, minus stress penalty
  const sleepScore = Math.min(sleep / 8, 1);
  const stressPenalty = stress * 0.05;
  const sorenessPenalty = sorenessCount * 0.1;
  
  return Math.max(0.7, 1.2 - (1 - sleepScore) - stressPenalty - sorenessPenalty);
};

```

### The Progression Tree

The "Push-up Arc" is stored as a constant array in `@repo/shared`. The UI filters this list to show the "Next Level" based on the user's current stats.

---

## 5. Security Rules (The Firewall)

Since we are skipping a backend, **Firestore Security Rules** are non-negotiable for protecting user data.

```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    // Check if the requester is the owner of the document
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    // Check if the requester is the trainer of the user
    function isTrainer(traineeId) {
      let trainee = get(/databases/$(database)/documents/users/$(traineeId)).data;
      return request.auth.uid == trainee.trainerId;
    }

    match /users/{userId} {
      allow read: if isOwner(userId) || isTrainer(userId);
      allow write: if isOwner(userId);
    }

    match /dailyArcs/{arcId} {
      allow read, write: if isOwner(resource.data.userId) || isTrainer(resource.data.userId);
    }
  }
}

```

---

## 6. Implementation Roadmap (The Hytel Way)

1. **Shared Schemas:** Define `UserSchema` and `ArcSchema` in `packages/shared` using **Zod**.
2. **Firestore Hooks:** In `apps/web/src/hooks`, create `useDailyArc(date)` which uses TanStack Query to fetch and cache Firestore data.
3. **UI Construction:** Build the **Readiness Form** in `apps/web` using Shadcn `Form` and `Slider` components.
4. **External APIs:** Integrate the Edamam Recipe API directly in a service file in `apps/web/src/lib/edamam.ts`.

---
