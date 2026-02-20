import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useSettingsStore } from '@/stores/useSettingsStore'

export default function PageShell() {
  const collapsed = useSettingsStore((s) => s.sidebarCollapsed)

  return (
    <div className="min-h-screen bg-paper">
      <Sidebar />
      <div
        className={`transition-all ${
          collapsed ? 'ml-16' : 'ml-[260px]'
        }`}
      >
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
