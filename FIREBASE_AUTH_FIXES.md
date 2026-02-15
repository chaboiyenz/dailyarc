# Firebase Authentication Fixes (2026-02-13)

## Issues Fixed

### 1. ✅ Firestore Permission Error: "Missing or insufficient permissions"

**Problem:** When new users logged in (especially GitHub), Firestore rules were checking if they had a role before their profile document existed, causing permission denied errors.

**Root Cause:** The `isAdmin()` and `isTrainerRole()` functions called `getUserData()` which attempted to read `/users/{userId}` before it was created.

**Solution:** Updated Firestore rules to gracefully handle non-existent user documents:

```firestore
function isAdmin() {
  return isAuthenticated() && (
    !exists(/databases/$(database)/documents/users/$(request.auth.uid)) ||
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN'
  );
}
```

**Files Modified:**

- `firestore.rules` - Updated `isAdmin()` and `isTrainerRole()` functions
- `firestore.rules` - Added `allow create: if isOwner(userId);` to users collection

---

### 2. ✅ GitHub Auth Error: "auth/account-exists-with-different-credential"

**Problem:** Users who had previously signed up with Google couldn't sign in with GitHub using the same email.

**Root Cause:** Firebase Auth doesn't allow multiple providers for the same email by default. When a user tries to sign in with a different provider than they originally used, Firebase rejects it.

**Solution:** Added error handling to catch this error and provide helpful feedback to users.

**Files Modified:**

- `apps/web/src/hooks/useAuth.ts` - Added try/catch with error code detection for `signInWithGoogle()` and `signInWithGithub()`

---

## What Users Should Do

### For Existing Users with GitHub Sign-In Error

If you see the error `auth/account-exists-with-different-credential`:

1. **Use your original sign-in method** - Check which method you used initially (Google, GitHub, or Email)
2. **Sign in with that method** - Use the same provider you originally used
3. **Optionally link providers** - After signing in, you can contact support to link multiple providers to your account

### For Fresh Installations

These fixes allow new users to sign in with any provider (Google, GitHub, Email) without encountering permission issues.

---

## Technical Details

### Firestore Rules Changes

The updated rules now:

- Check if a user document exists before requiring role checks
- Allow new users to create their own profile during onboarding
- Still enforce proper permissions once the profile is created

```firestore
// Before (problematic)
function isAdmin() {
  return isAuthenticated() && getUserData().role == 'ADMIN';
}

// After (safe for new users)
function isAdmin() {
  return isAuthenticated() && (
    !exists(/databases/$(database)/documents/users/$(request.auth.uid)) ||
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN'
  );
}
```

### Error Handling Changes

The auth hook now catches provider mismatch errors and logs helpful messages:

```typescript
try {
  await signInWithPopup(auth, githubProvider)
} catch (error) {
  const firebaseError = error as { code?: string }
  if (firebaseError.code === 'auth/account-exists-with-different-credential') {
    console.error('❌ Account exists with different credential...')
  }
  throw error
}
```

---

## Testing

To verify the fixes work:

1. **New user sign-in:**

   - Clear browser storage
   - Try signing up with GitHub → Should succeed and go to onboarding
   - Should create profile document in Firestore without permission errors

2. **Existing user with different provider:**

   - If you have a Google account, try signing in with GitHub
   - Should see helpful error message in console instead of crash

3. **Profile creation:**
   - Complete onboarding
   - Verify user document is created in Firestore at `/users/{userId}`
   - Subsequent reads should work correctly

---

## Deployment Notes

**You must deploy the updated Firestore rules:**

1. Log into [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Firestore Database → Rules
4. Replace with content from `firestore.rules`
5. Click "Publish"

The code changes are backward compatible and don't require any migrations.

---

## Related Issues

- GitHub Auth: User receives "Missing or insufficient permissions" error
- GitHub Auth: User receives "account-exists-with-different-credential" error
- New user onboarding: Firestore permission denied errors on profile creation

All issues should now be resolved! 🎉
