# Quick Fix for GitHub Sign-In Error

## Immediate Solution - Try This First

### Step 1: Clear Local Data

1. Open your app in the browser
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Paste and run:

```javascript
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Step 2: Delete Your Test Account

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Authentication** → **Users**
4. Find your account and click the ⋮ menu
5. Click **Delete user**

### Step 3: Start Fresh

1. Go back to your app (it should be empty now)
2. Click "Continue with GitHub"
3. Should work now! ✅

---

## If That Doesn't Work

### Solution A: Use Email Sign-Up Instead

1. Click "Continue with Email"
2. Create account with email/password
3. Verify you can log in

### Solution B: Enable Account Linking (Firebase Project Settings)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. **Authentication** → **Settings** tab
4. Scroll down to "Users" section
5. Find toggle: **"Allow multiple accounts with the same email address"**
6. Enable it ✅
7. Now you can use any provider!

**⚠️ Warning:** This is a global setting that affects all users in your project. Use wisely in production.

---

## Browser Console Test

If you want to test before adding a user, run this:

```javascript
// Check what providers are available
import { auth } from '@/lib/firebase'
console.log('Auth Config:', auth)
```

---

## Checking the Server-Side Firestore Rules

Your updated rules already handle new users correctly. To verify:

1. Go to Firebase Console → Firestore Database → Rules
2. Look for these lines (should be there):

```firestore
function isAdmin() {
  return isAuthenticated() && (
    !exists(/databases/$(database)/documents/users/$(request.auth.uid)) ||
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN'
  );
}
```

If these aren't there, paste the content from `firestore.rules` file.

---

## Still Having Issues?

Check these logs:

1. **Browser Console** (F12) - Look for Firebase errors
2. **Firebase Console** - Check Authentication logs
3. **Firestore Rules Simulator** - Test if rules allow creation

Most common causes:

- ❌ IndexedDB issues → Clear cache
- ❌ Provider mismatch → Use same method
- ❌ Rules not deployed → Deploy `firestore.rules`
- ❌ Multiple provider accounts → Enable in Firebase settings

---

## Summary

| Error                                    | Fix                                                     |
| ---------------------------------------- | ------------------------------------------------------- |
| account-exists-with-different-credential | Delete account & start fresh, or enable account linking |
| IDBDatabase connection is closing        | Clear cache & refresh                                   |
| Missing/insufficient permissions         | Deploy updated firestore.rules                          |
| User not found                           | Complete onboarding to create profile doc               |

**Next:** Try the steps above and let me know if you hit any blockers! 🚀
