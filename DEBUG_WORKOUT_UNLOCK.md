# Debugging Guide: Workout Session Unlock not Working

## What Was Changed

Enhanced debugging throughout the entire workout logging → unlock flow to identify exactly where data stops flowing:

### 1. **useLogWorkout.ts** - Enhanced Log Output

- Shows exact workout data being saved to Firestore
- Shows when query invalidation starts
- Shows when refetch completes and what data is returned
- Shows if refetch fails with error details

### 2. **TrainingView.tsx** - Enhanced Process Tracking

- Fixed bug: `profile?.stats?.trainingMode` → `profile?.trainingMode`
- Shows exerciseId being logged
- Shows when refetch is called and completes
- Shows detailed breakdown of workouts after query returns

### 3. **TechTreeGraph.tsx** - Visual State Tracking

- Shows when node positions are recalculated
- Shows complete tree state by level with unlock/complete status

## Testing Steps

### Step 1: Open Browser Console

1. Open the app in your browser
2. Press **F12** to open DevTools
3. Click the **Console** tab
4. Make sure you can see console output

### Step 2: Navigate to Training Tab

1. Go to Dashboard → Training Tab
2. Select **Bodyweight** (Calisthenics) mode
3. Look at the console - you should see initial logs like:
   ```
   [TrainingView] 🔄 completedExerciseIds updated: []
   [TechTreeGraph] 🔄 Recalculating node positions...
   [TechTreeGraph] 📊 Node states by level: { 1: [...] }
   ```

### Step 3: Log Your First Workout

1. Click on the **first exercise** (Wall Pushups - Level 1, ID: `wall-pu`)
2. Fill in a few sets (e.g., 3 sets of 20 reps, RPE 7)
3. Click **LOG SESSION**
4. **Watch the console carefully**

## Console Output Flow - What You Should See

### ✅ Expected Flow:

**1. Training View starts logging:**

```
[TrainingView] 🎯 Starting workout log for: {
  exerciseId: 'wall-pu',
  exerciseName: 'Wall Pushups',
  level: 1,
  type: 'CALISTHENICS'
}
[TrainingView] 📤 Sending to mutation: { exerciseId: 'wall-pu', ... }
```

**2. Mutation succeeds and triggers refetch:**

```
[useLogWorkout] ✅ Mutation success for userId: <YOUR_UID>
[useLogWorkout] Logged workout data: {
  id: '<workout_id>',
  exerciseId: 'wall-pu',
  exerciseName: 'Wall Pushups',
  userId: '<YOUR_UID>'
}
[useLogWorkout] Invalidating queries for key: ['workouts', '<YOUR_UID>']
[useLogWorkout] Refetching queries for key: ['workouts', '<YOUR_UID>']
```

**3. After refetch completes:**

```
[useLogWorkout] ✅ Refetch completed
[useLogWorkout] Cached data after refetch: [ ... array with 1 workout ... ]
```

**4. Training View receives updated workouts:**

```
[TrainingView useEffect] Workouts updated from Firestore: {
  count: 1,
  exerciseIds: ['wall-pu'],
  latest: { ... workout object ... }
}
[TrainingView] 🔄 completedExerciseIds updated: ['wall-pu'] from 1 workouts
[TrainingView] Detailed workout breakdown: [
  { exerciseId: 'wall-pu', exerciseName: 'Wall Pushups', date: ... }
]
```

**5. Explicit refetch in handleComplete:**

```
[TrainingView] ⏳ Calling explicit refetch after mutation...
[TrainingView] ✅ Refetch completed, new data: [ ... 1 workout ... ]
```

**6. Tech Tree Graph recalculates with new data:**

```
[TechTreeGraph] 🔄 Recalculating node positions with completedExerciseIds: ['wall-pu']
[TechTreeGraph] 📊 Node states by level: {
  1: [
    { id: 'wall-pu', name: 'Wall Pushups', isUnlocked: true, isCompleted: true },
    { id: 'dead-hang', name: 'Dead Hang', isUnlocked: true, isCompleted: false }
  ],
  2: [
    { id: 'incline-pu', name: 'Incline Pushups', isUnlocked: true, isCompleted: false },
    { id: 'flex-hang', name: 'Flexed Arm Hang', isUnlocked: false, isCompleted: false }
  ]
}
```

**Expected Result:**

- `wall-pu` appears **amber** (completed)
- `incline-pu` appears **cyan** (unlocked) instead of grey
- Success toast shows

---

## Debug Checklist - What to Look For

Copy-paste these checks in order:

- [ ] **Mutation starts?** Do you see `[TrainingView] 🎯 Starting workout log`?
- [ ] **Mutation succeeds?** Do you see `[useLogWorkout] ✅ Mutation success`?
- [ ] **Workout saved correctly?** Is `exerciseId` showing as `'wall-pu'` (not truncated)?
- [ ] **Refetch triggered?** Do you see `[useLogWorkout] Refetching queries`?
- [ ] **Refetch completes?** Do you see `[useLogWorkout] ✅ Refetch completed`?
- [ ] **Cached data shows 1 workout?** Check `Cached data after refetch` - should have 1 item
- [ ] **TrainingView receives workouts?** Do you see `[TrainingView useEffect] Workouts updated`?
- [ ] **completedExerciseIds includes wall-pu?** Should show `['wall-pu']` not `[]`
- [ ] **TechTreeGraph recalculates?** Do you see `[TechTreeGraph] 🔄 Recalculating`?
- [ ] **Incline-pu shows as unlocked?** In node states, should show `isUnlocked: true` for `incline-pu`

---

## Troubleshooting - If Something is Missing

### If refetch never completes:

```
Look for: [useLogWorkout] ❌ Refetch failed: { error details }
Action: Check your network connection, Firebase quota, and Firestore rules
```

### If completedExerciseIds stays as `[]`:

```
This means workouts never arrived from Firestore
The query might not be fetching the saved data
Check: Are you seeing the `Cached data after refetch` log with workout in it?
```

### If TechTreeGraph never recalculates:

```
Look for: [TechTreeGraph] 🔄 Recalculating NOT appearing
This means completedExerciseIds prop didn't change
```

### If incline-pu stays grey:

```
Either:
1. wall-pu not in completedExerciseIds (check step above)
2. OR tree prerequisites not set correctly
3. OR isNodeUnlocked() logic broken
```

---

## What To Share With Us

When opening a bug report, please provide:

1. **Console output** - Copy all `[useLogWorkout]`, `[TrainingView]`, and `[TechTreeGraph]` logs
2. **Which step fails?** - Use the checklist above to pinpoint where logs stop
3. **Firestore verification** - Check if the workout was actually saved:
   - Go to Firebase Console → Firestore
   - Collection: `workouts`
   - Look for document with your userId and `exerciseId: 'wall-pu'`
4. **Tree state verification** - What does the tree show after logging?
   - Is `wall-pu` amber? Is `incline-pu` grey or cyan?

---

## FAQ

**Q: Why all this debugging?**
A: The unlock feature was completely broken (no 2nd stage unlock after logging). These logs will show us EXACTLY where the data flow stops so we can fix it.

**Q: What if I don't see any console logs?**
A: Check if you're on a tab that actually renders the Training component (you should be), and try refreshing F12 or opening console before logging the workout.

**Q: The logs show everything working, but the stage still doesn't unlock?**
A: Then the issue is in the visual rendering (TechTreeGraph styling). We'll need to check the SVG rendering code.
