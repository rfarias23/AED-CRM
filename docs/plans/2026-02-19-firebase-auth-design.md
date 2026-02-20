# Firebase Authentication Design — AEC Pipeline Command Center

**Date:** 2026-02-19
**Status:** Approved

## Overview

Add Firebase Authentication (email+password) with two roles (admin, advisor) to protect sensitive pipeline data at fyfpr.com.

## Architecture

- **Auth Provider:** Firebase Auth SDK (email+password)
- **State Management:** React Context (`AuthContext`) — not Zustand — because auth state must exist before stores load
- **Role Storage:** Firestore `users` collection (`{ uid, email, displayName, role, createdAt }`)
- **Route Protection:** `ProtectedRoute` (auth required) + `AdminRoute` (admin role required) wrappers

## Roles

| Permission | Admin | Advisor |
|-----------|:-----:|:-------:|
| All app features | Yes | Yes |
| Team Management (create/deactivate users) | Yes | No |
| Backup/Restore data | Yes | Export only |

## New Files

| File | Purpose |
|------|---------|
| `src/lib/firebase.ts` | Firebase SDK init (app + auth + firestore) |
| `src/contexts/AuthContext.tsx` | React Context: user, role, login, logout |
| `src/components/auth/ProtectedRoute.tsx` | Redirect to /login if not authenticated |
| `src/components/auth/AdminRoute.tsx` | Redirect to / if not admin |
| `src/routes/Login.tsx` | Login screen (email+password) |
| `src/routes/TeamManagement.tsx` | Admin panel for user role management |

## Modified Files

| File | Changes |
|------|---------|
| `src/App.tsx` | Wrap with AuthProvider, add /login route, add AdminRoute for /team |
| `src/components/layout/Sidebar.tsx` | Add "Equipo" nav item (admin only), add logout button |
| `src/components/layout/Header.tsx` | Show current user name + logout button |
| `src/routes/Settings.tsx` | Restrict Backup/Restore to admin role |
| `package.json` | Add `firebase` dependency |
| `.env.local` | Firebase config keys (not committed) |

## Dependencies

- `firebase` npm package (~80KB gzipped, only auth + firestore modules)
- Cost: $0 (Spark plan: 10K users/month, Firestore 1GB free)

## Login Screen

- Full-screen centered card on `bg-paper`
- DM Serif Display heading, DM Sans body
- Email + password inputs matching existing Settings style
- "Iniciar Sesion" button with `bg-accent`
- Password reset via `sendPasswordResetEmail`
- Error messages in `text-red`

## Team Management

- Admin creates users in Firebase Console (Authentication > Add User)
- Admin manages roles in-app via `/team` route
- Firestore `users` collection stores role mapping
- On first login, user document created with default `advisor` role

## User Creation Flow

1. Admin creates user in Firebase Console with email + temporary password
2. Admin sets role in `/team` page
3. New user logs in at fyfpr.com
4. AuthContext reads role from Firestore
5. User can change password via "Forgot password" flow
