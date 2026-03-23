import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCurrentUser, getStoredSession, setStoredSession } from './api'
import './App.css'
import { CategoriesPage } from './pages/CategoriesPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { MovementsPage } from './pages/MovementsPage'
import { ProductsPage } from './pages/ProductsPage'
import { ReportsPage } from './pages/ReportsPage'
import { UsersPage } from './pages/UsersPage'
import type { Session } from './types'

type ViewKey = 'dashboard' | 'products' | 'categories' | 'movements' | 'reports' | 'users'

const viewLabels: Record<ViewKey, string> = {
  dashboard: 'Dashboard',
  products: 'Productos',
  categories: 'Categorias',
  movements: 'Movimientos',
  reports: 'Reportes',
  users: 'Usuarios',
}

const roleLabels = {
  admin: 'Admin',
  employee: 'Empleado',
} as const

function App() {
  const [session, setSession] = useState<Session | null>(() => getStoredSession())
  const [activeView, setActiveView] = useState<ViewKey>('dashboard')

  const meQuery = useQuery({
    queryKey: ['auth-me', session?.access],
    queryFn: () => fetchCurrentUser(session as Session),
    enabled: Boolean(session?.access),
    retry: false,
  })

  useEffect(() => {
    setStoredSession(session)
    if (!session && activeView === 'users') {
      setActiveView('dashboard')
    }
  }, [activeView, session])

  useEffect(() => {
    if (!session || !meQuery.data) {
      return
    }

    if (meQuery.data.role !== session.user.role || meQuery.data.name !== session.user.name) {
      setSession({
        ...session,
        user: meQuery.data,
      })
    }
  }, [meQuery.data, session])

  useEffect(() => {
    if (meQuery.isError) {
      setSession(null)
    }
  }, [meQuery.isError])

  const availableViews = useMemo(() => {
    if (!session) {
      return []
    }

    const views: ViewKey[] = ['dashboard', 'products', 'categories', 'movements']
    if (session.user.role === 'admin') {
      views.push('reports')
      views.push('users')
    }
    return views
  }, [session])

  if (!session) {
    return <LoginPage onLogin={setSession} />
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Inventario</p>
          <h1>Panel operativo</h1>
          <p className="lead sidebar-copy">
            Gestiona stock, categorias, usuarios y movimientos desde un solo lugar.
          </p>
        </div>

        <nav className="sidebar-nav">
          {availableViews.map((view) => (
            <button
              key={view}
              type="button"
              className={view === activeView ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveView(view)}
            >
              {viewLabels[view]}
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          <strong>{session.user.name}</strong>
          <span>{session.user.email}</span>
          <span className="role-pill">{roleLabels[session.user.role]}</span>
          <button type="button" className="ghost-button" onClick={() => setSession(null)}>
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main className="content">
        {activeView === 'dashboard' ? <DashboardPage session={session} /> : null}
        {activeView === 'products' ? <ProductsPage session={session} /> : null}
        {activeView === 'categories' ? <CategoriesPage session={session} /> : null}
        {activeView === 'movements' ? <MovementsPage session={session} /> : null}
        {activeView === 'reports' ? <ReportsPage session={session} /> : null}
        {activeView === 'users' ? <UsersPage session={session} /> : null}
      </main>
    </div>
  )
}

export default App
