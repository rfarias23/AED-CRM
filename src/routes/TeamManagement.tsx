// ─────────────────────────────────────────────────
// Team Management — Admin-only user role management
// Users are created in Firebase Console (Auth > Add User)
// Roles managed here via Firestore 'users' collection
// ─────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { firestore } from '@/lib/firebase'
import { useAuth, type UserRole } from '@/contexts/AuthContext'
import Card from '@/components/shared/Card'
import { UsersRound, Shield, User, AlertCircle } from 'lucide-react'

interface TeamUser {
  uid: string
  email: string
  displayName: string | null
  role: UserRole
  createdAt: string
  lastLoginAt: string
}

export default function TeamManagement() {
  const { user } = useAuth()
  const [users, setUsers] = useState<TeamUser[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      const snap = await getDocs(collection(firestore, 'users'))
      const list: TeamUser[] = []
      snap.forEach((d) => {
        const data = d.data()
        list.push({
          uid: d.id,
          email: data.email ?? '',
          displayName: data.displayName ?? null,
          role: data.role ?? 'advisor',
          createdAt: data.createdAt ?? '',
          lastLoginAt: data.lastLoginAt ?? '',
        })
      })
      // Sort: admin first, then by email
      list.sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1
        if (a.role !== 'admin' && b.role === 'admin') return 1
        return a.email.localeCompare(b.email)
      })
      setUsers(list)
    } catch (err) {
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  async function changeRole(uid: string, newRole: UserRole) {
    // Prevent changing own role (safety measure)
    if (uid === user?.uid) return

    setUpdating(uid)
    try {
      await updateDoc(doc(firestore, 'users', uid), { role: newRole })
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u))
      )
    } catch (err) {
      console.error('Error updating role:', err)
    } finally {
      setUpdating(null)
    }
  }

  function formatDate(iso: string) {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return '—'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <UsersRound className="w-5 h-5 text-muted" />
        <h1 className="font-heading text-2xl">Gestión de Equipo</h1>
      </div>

      {/* Instructions */}
      <Card>
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="text-sm text-muted space-y-1">
            <p>
              Para agregar un nuevo usuario, créalo en{' '}
              <a
                href="https://console.firebase.google.com/project/aedcrm-a082f/authentication/users"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline hover:text-accent/80"
              >
                Firebase Console → Authentication
              </a>{' '}
              con email y contraseña temporal.
            </p>
            <p>
              Al hacer su primer login, aparecerá aquí automáticamente con rol <strong>Asesor</strong>.
              Puedes cambiar su rol a continuación.
            </p>
          </div>
        </div>
      </Card>

      {/* Users table */}
      <Card>
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-4">
          Usuarios ({users.length})
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted py-4">
            No hay usuarios registrados aún. Crea el primer usuario en Firebase Console.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted text-xs uppercase tracking-wider">
                  <th className="pb-3">Usuario</th>
                  <th className="pb-3">Rol</th>
                  <th className="pb-3 hidden sm:table-cell">Último acceso</th>
                  <th className="pb-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isCurrentUser = u.uid === user?.uid
                  return (
                    <tr key={u.uid} className="border-t border-border">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            u.role === 'admin' ? 'bg-accent/10' : 'bg-cream'
                          }`}>
                            {u.role === 'admin' ? (
                              <Shield className="w-4 h-4 text-accent" />
                            ) : (
                              <User className="w-4 h-4 text-muted" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-ink">
                              {u.displayName || u.email.split('@')[0]}
                              {isCurrentUser && (
                                <span className="text-xs text-muted ml-1.5">(tú)</span>
                              )}
                            </p>
                            <p className="text-xs text-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.role === 'admin'
                            ? 'bg-accent/10 text-accent'
                            : 'bg-cream text-muted'
                        }`}>
                          {u.role === 'admin' ? 'Admin' : 'Asesor'}
                        </span>
                      </td>
                      <td className="py-3 hidden sm:table-cell text-xs text-muted">
                        {formatDate(u.lastLoginAt)}
                      </td>
                      <td className="py-3 text-right">
                        {isCurrentUser ? (
                          <span className="text-xs text-muted">—</span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => changeRole(u.uid, e.target.value as UserRole)}
                            disabled={updating === u.uid}
                            className="text-xs border border-border rounded px-2 py-1 bg-white
                              focus:outline-none focus:ring-2 focus:ring-accent/20
                              disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="admin">Admin</option>
                            <option value="advisor">Asesor</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
