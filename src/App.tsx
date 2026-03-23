import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCurrentUser, getStoredSession, setStoredSession } from './api'
import './App.css'
import { CategoriesPage } from './pages/CategoriesPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { MovementsPage } from './pages/MovementsPage'
import { ProfilePage } from './pages/ProfilePage'
import { ProductsPage } from './pages/ProductsPage'
import { ReportsPage } from './pages/ReportsPage'
import { UsersPage } from './pages/UsersPage'
import type { Session, User } from './types'

type ViewKey =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'movements'
  | 'reports'
  | 'users'
  | 'profile'

const viewLabels: Record<ViewKey, string> = {
  dashboard: 'Dashboard',
  products: 'Productos',
  categories: 'Categorias',
  movements: 'Movimientos',
  reports: 'Reportes',
  users: 'Usuarios',
  profile: 'Perfil',
}

const viewIcons: Record<ViewKey, string> = {
  dashboard: '◫',
  products: '◧',
  categories: '◩',
  movements: '↕',
  reports: '◰',
  users: '◉',
  profile: '◎',
}

const roleLabels = {
  admin: 'Admin',
  employee: 'Empleado',
} as const

function App() {
  const [session, setSession] = useState<Session | null>(() => getStoredSession())
  const [activeView, setActiveView] = useState<ViewKey>('dashboard')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

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

    const views: ViewKey[] = ['dashboard', 'products', 'categories', 'movements', 'profile']
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
    <div className={isSidebarCollapsed ? 'app-shell sidebar-collapsed' : 'app-shell'}>
      <aside className={isSidebarCollapsed ? 'sidebar is-collapsed' : 'sidebar'}>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setIsSidebarCollapsed((current) => !current)}
          aria-label={isSidebarCollapsed ? 'Expandir menu lateral' : 'Colapsar menu lateral'}
          title={isSidebarCollapsed ? 'Expandir menu lateral' : 'Colapsar menu lateral'}
        >
          <span>{isSidebarCollapsed ? '›' : '‹'}</span>
        </button>

        <div>
          {isSidebarCollapsed ? (
            <div className="sidebar-mini-brand">
              <span>I</span>
            </div>
          ) : (
            <>
              <p className="eyebrow">Inventario</p>
              <h1>Panel operativo</h1>
              <p className="lead sidebar-copy">
                Gestiona stock, categorias, usuarios y movimientos desde un solo lugar.
              </p>
            </>
          )}
        </div>

        <nav className="sidebar-nav">
          {availableViews.map((view) => (
            <button
              key={view}
              type="button"
              className={view === activeView ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveView(view)}
              title={viewLabels[view]}
            >
              {isSidebarCollapsed ? (
                <span className="nav-icon-mini" aria-hidden="true">
                  {viewIcons[view]}
                </span>
              ) : (
                viewLabels[view]
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          {isSidebarCollapsed ? (
            <>
              <strong className="sidebar-user-icon" aria-hidden="true">
                ◉
              </strong>
              <span className="role-pill">{session.user.role === 'admin' ? 'A' : 'E'}</span>
            </>
          ) : (
            <>
              <strong>{session.user.name}</strong>
              <span>{session.user.email}</span>
              <span className="role-pill">{roleLabels[session.user.role]}</span>
            </>
          )}
          <button type="button" className="ghost-button" onClick={() => setSession(null)}>
            {isSidebarCollapsed ? 'Salir' : 'Cerrar sesion'}
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
        {activeView === 'profile' ? (
          <ProfilePage
            session={session}
            onSessionUpdate={(user: User) => {
              setSession((current) => (current ? { ...current, user } : current))
            }}
          />
        ) : null}
      </main>
    </div>
  )
}

export default App
