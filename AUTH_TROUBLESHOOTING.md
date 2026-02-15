# Authentication Troubleshooting Guide

## Error: "account-exists-with-different-credential"

### What This Means

You tried to sign in with one provider (e.g., GitHub), but your account was created with a different provider (e.g., Google).

**Example:**

- First time: You signed up with Google using `user@example.com`
- Later: You tried to sign in with GitHub using the same `user@example.com`
- Result: ❌ Error - Firebase rejects it

### Solution - Choose One:

#### Option 1: Use Your Original Sign-In Method (Recommended)

1. Remember which method you used first (Google, GitHub, or Email)
2. Sign in with that method only
3. Share this with other users

#### Option 2: Clear All Data & Start Fresh

If this is a test account:

1. Clear browser storage: `localStorage.clear()` in console
2. Clear cookies for your domain
3. Sign out completely
4. Try signing in fresh with GitHub

#### Option 3: Enable Account Linking in Firebase (Admin Only)

If you control the Firebase project:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Authentication → Settings
3. Under "Users" section, enable **"Allow multiple accounts with the same email address"**
4. This allows users to link multiple providers to one account

**Note:** This changes how Firebase Auth works. Use carefully in production.

#### Option 4: Implement Custom Account Linking

This is the most user-friendly but requires code changes:

- Detect the `account-exists-with-different-credential` error
- Offer user to sign in with their original provider
- Then link the new provider to their account
- Currently showing alert, but not linking automatically

---

## Error: "IDBDatabase connection is closing"

### What This Means

Firebase is having trouble accessing browser IndexedDB (local storage). This is usually temporary or caused by:

- Multiple browser tabs fighting for access
- Browser storage quota exceeded
- Browser privacy mode limitations

### Quick Fix

1. **Close other tabs** with the app open
2. **Refresh the page** (F5 or Cmd+R)
3. **Clear browser cache**: Settings → Cache → Clear
4. **Disable privacy mode** if enabled

### Permanent Fix

Add resilient Firestore configuration (already in place):

```typescript
// In apps/web/src/lib/firebase.ts
initializeFirestore(app, {
  localCache: memoryLocalCache(),
  experimentalForceLongPolling: true,
})
```

This uses memory cache instead of IndexedDB, preventing storage conflicts.

---

## How to Test Authentication

### Test Case 1: Fresh Installation

1. Clear all browser storage: `localStorage.clear()`
2. Sign up with **Email** first
3. Complete onboarding
4. Try signing in with Google
5. Expected: ❌ Error (different credential)
6. Solution: Use Email again

### Test Case 2: Clean Start

1. Delete Firebase user from [Firebase Console](https://console.firebase.google.com)
   - Auth → Users → Delete
2. Clear browser storage
3. Try signing up fresh with GitHub
4. Expected: ✅ Works

### Test Case 3: Account Linking (After Option 3)

1. Sign up with Google
2. Try signing in with GitHub
3. Expected: ✅ Works (if account linking enabled)

---

## For End Users - FAQ

### Q: I get an error when signing in

**A:** Try signing in with the same method you used when you first created your account. If you used Google to sign up, use Google to sign in.

### Q: I forgot which method I used

**A:** Try all three methods (Google, GitHub, Email). One should work. Once you're logged in, you can set up a password for future logins.

### Q: Can I use multiple sign-in methods?

**A:** Currently no - Firebase requires one method per account. But we can add this feature if needed.

### Q: Why does the GitHub button not work?

**A:** If your account was created with Google, GitHub sign-in will be blocked. Use Google instead.

---

## Development Notes

### Error Codes Reference

- `auth/account-exists-with-different-credential` - Provider mismatch
- `auth/popup-closed-by-user` - User closed popup
- `auth/operation-not-allowed` - Provider not enabled in Firebase
- `auth/network-request-failed` - Network issue (IndexedDB or API)

### Related Files

- `apps/web/src/hooks/useAuth.ts` - Authentication logic
- `apps/web/src/lib/firebase.ts` - Firebase config
- `firestore.rules` - Security rules

### Testing with Emulator

```bash
firebase emulator:start
# Auth and Firestore run locally, no credential conflicts
```

---

## Next Steps for Better UX

We should implement:

1. ✅ Better error messages (done)
2. ⏳ Account linking flow (pending)
3. ⏳ Provider detection (show which method account uses)
4. ⏳ One-click sign-in recovery
5. ⏳ Support for passwordless email links

Would you like me to implement any of these improvements?
