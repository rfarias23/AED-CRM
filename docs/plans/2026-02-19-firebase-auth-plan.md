# Implementation Plan: Firebase Authentication

**Design:** `2026-02-19-firebase-auth-design.md`

## Steps

### Step 1: Install Firebase SDK and create config
- `npm install firebase`
- Create `src/lib/firebase.ts` with Firebase app + auth + firestore init
- Create `.env.local` with Firebase project keys
- Update `.gitignore` to ensure .env.local is excluded

### Step 2: Create AuthContext
- Create `src/contexts/AuthContext.tsx`
- Implement `AuthProvider` with `onAuthStateChanged` listener
- Read user role from Firestore `users` collection
- Expose: `user`, `role`, `loading`, `login()`, `logout()`, `resetPassword()`

### Step 3: Create route protection components
- Create `src/components/auth/ProtectedRoute.tsx` — redirects to /login if not authenticated
- Create `src/components/auth/AdminRoute.tsx` — redirects to / if not admin

### Step 4: Create Login page
- Create `src/routes/Login.tsx`
- Email + password form matching existing design system
- Error handling (wrong password, user not found, etc.)
- Password reset link
- Loading states

### Step 5: Update App.tsx routing
- Wrap app with `<AuthProvider>`
- Add `/login` public route
- Wrap existing routes with `<ProtectedRoute>`
- Add `/team` route inside `<AdminRoute>`

### Step 6: Update Sidebar and Header
- Add logout button to Sidebar footer
- Add "Equipo" nav item visible only to admin role
- Show user info in Header
- Add logout option in Header

### Step 7: Create Team Management page
- Create `src/routes/TeamManagement.tsx`
- List users from Firestore `users` collection
- Allow admin to change user roles
- Show user email, display name, role, last login

### Step 8: Update Settings page
- Restrict Backup Import/Restore to admin role
- Advisors can export but not import/restore

### Step 9: Enable Firestore in Firebase Console
- Enable Firestore database in Firebase Console
- Set security rules for `users` collection
- Create initial admin user document

### Step 10: Build, test, and deploy
- `npm run build` — verify 0 errors
- Test login flow locally
- `npm run deploy` — deploy to Firebase Hosting
