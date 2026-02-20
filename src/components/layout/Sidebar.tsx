import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Calculator,
  Target,
  Users,
  Receipt,
  ClipboardList,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { useSettingsStore } from '@/stores/useSettingsStore'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/calculator', icon: Calculator, label: 'Calculadora' },
  { to: '/opportunities', icon: Target, label: 'Oportunidades' },
  { to: '/contacts', icon: Users, label: 'Contactos' },
  { to: '/expenses', icon: Receipt, label: 'Gastos' },
  { to: '/plan', icon: ClipboardList, label: 'Plan Comercial' },
  { to: '/reports', icon: BarChart3, label: 'Reportes' },
  { to: '/settings', icon: Settings, label: 'Configuración' },
]

export default function Sidebar() {
  const collapsed = useSettingsStore((s) => s.sidebarCollapsed)
  const toggle = useSettingsStore((s) => s.toggleSidebar)

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-ink text-white flex flex-col transition-all z-30 ${
        collapsed ? 'w-16' : 'w-[260px]'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10">
        {!collapsed && (
          <span className="font-heading text-lg tracking-tight">AEC Pipeline</span>
        )}
        <button
          onClick={toggle}
          className="ml-auto p-1.5 rounded hover:bg-white/10 transition-colors"
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? (
            <PanelLeft className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-accent text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium">{label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-white/10 text-xs text-white/40">
          Command Center v1.0
        </div>
      )}
    </aside>
  )
}
