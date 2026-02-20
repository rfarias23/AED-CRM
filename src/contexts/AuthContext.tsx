// ─────────────────────────────────────────────────
// AuthContext — Firebase Auth + Firestore roles
// Provides: user, role, loading, login, logout, resetPassword
// ─────────────────────────────────────────────────

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, firestore } from '@/lib/firebase'

export type UserRole = 'admin' | 'advisor'

interface AuthUser {
  uid: string
  email: string
  displayName: string | null
  role: UserRole
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/** Read or create user role document in Firestore */
async function getUserRole(firebaseUser: User): Promise<UserRole> {
  const userRef = doc(firestore, 'users', firebaseUser.uid)
  const snap = await getDoc(userRef)

  if (snap.exists()) {
    return (snap.data().role as UserRole) ?? 'advisor'
  }

  // First-time login: create user document with default role
  await setDoc(userRef, {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    role: 'advisor',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  })
  return 'advisor'
}

/** Update last login timestamp */
async function updateLastLogin(uid: string) {
  const userRef = doc(firestore, 'users', uid)
  await setDoc(userRef, { lastLoginAt: new Date().toISOString() }, { merge: true })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const role = await getUserRole(firebaseUser)
          await updateLastLogin(firebaseUser.uid)
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            displayName: firebaseUser.displayName,
            role,
          })
        } catch (err) {
          console.error('Error reading user role:', err)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    await signOut(auth)
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}
