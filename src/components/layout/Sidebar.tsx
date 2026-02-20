import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Calculator,
  Target,
  Users,
  Receipt,
  Plane,
  ClipboardList,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeft,
  X,
  UsersRound,
  LogOut,
} from 'lucide-react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useAuth } from '@/contexts/AuthContext'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Panel' },
  { to: '/calculator', icon: Calculator, label: 'Calculadora' },
  { to: '/opportunities', icon: Target, label: 'Oportunidades' },
  { to: '/contacts', icon: Users, label: 'Contactos' },
  { to: '/expenses', icon: Receipt, label: 'Gastos' },
  { to: '/trips', icon: Plane, label: 'Viajes' },
  { to: '/plan', icon: ClipboardList, label: 'Plan Comercial' },
  { to: '/reports', icon: BarChart3, label: 'Reportes' },
  { to: '/settings', icon: Settings, label: 'Configuración' },
]

// Admin-only nav items
const ADMIN_NAV_ITEMS = [
  { to: '/team', icon: UsersRound, label: 'Equipo' },
]

export default function Sidebar() {
  const collapsed = useSettingsStore((s) => s.sidebarCollapsed)
  const mobileOpen = useSettingsStore((s) => s.mobileSidebarOpen)
  const toggle = useSettingsStore((s) => s.toggleSidebar)
  const closeMobile = useSettingsStore((s) => s.closeMobileSidebar)
  const { user, logout } = useAuth()

  const isAdmin = user?.role === 'admin'

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar — desktop: fixed, mobile: slide-in overlay */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-ink text-white flex flex-col z-50
          transition-all duration-200
          /* Desktop: always visible */
          max-lg:translate-x-[-100%]
          lg:translate-x-0
          ${collapsed ? 'lg:w-16' : 'lg:w-[260px]'}
          /* Mobile: slide in when open */
          ${mobileOpen ? 'max-lg:translate-x-0 max-lg:w-[260px]' : ''}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10">
          {(!collapsed || mobileOpen) && (
            <span className="font-heading text-lg tracking-tight">FyF Public Relations</span>
          )}
          {/* Desktop toggle */}
          <button
            onClick={toggle}
            className="ml-auto p-1.5 rounded hover:bg-white/10 transition-colors hidden lg:block"
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? (
              <PanelLeft className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
          {/* Mobile close */}
          <button
            onClick={closeMobile}
            className="ml-auto p-1.5 rounded hover:bg-white/10 transition-colors lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={closeMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-accent text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                } ${collapsed && !mobileOpen ? 'justify-center' : ''}`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {(!collapsed || mobileOpen) && (
                <span className="text-sm font-medium">{label}</span>
              )}
            </NavLink>
          ))}

          {/* Admin-only section */}
          {isAdmin && (
            <>
              {(!collapsed || mobileOpen) && (
                <div className="mx-4 my-3 border-t border-white/10" />
              )}
              {ADMIN_NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-accent text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    } ${collapsed && !mobileOpen ? 'justify-center' : ''}`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {(!collapsed || mobileOpen) && (
                    <span className="text-sm font-medium">{label}</span>
                  )}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Footer — user info + logout */}
        <div className="border-t border-white/10">
          {(!collapsed || mobileOpen) && user && (
            <div className="px-4 py-2 text-xs text-white/50 truncate">
              {user.displayName || user.email}
            </div>
          )}
          <button
            onClick={logout}
            className={`flex items-center gap-3 w-full px-4 py-3 text-white/50 hover:text-white hover:bg-white/5 transition-colors ${
              collapsed && !mobileOpen ? 'justify-center' : ''
            }`}
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {(!collapsed || mobileOpen) && (
              <span className="text-sm">Cerrar sesión</span>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
