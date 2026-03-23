import { useQuery } from '@tanstack/react-query'
import { fetchDashboardSummary } from '../api'
import { Header, InfoCard, MetricCard, MovementsTable } from '../components'
import type { Session } from '../types'

export function DashboardPage({ session }: { session: Session }) {
  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => fetchDashboardSummary(session),
  })

  return (
    <section className="page-section">
      <Header
        title="Dashboard"
        subtitle="Resumen rapido del inventario y de la actividad reciente."
      />

      {summaryQuery.isLoading ? <InfoCard text="Cargando resumen..." /> : null}
      {summaryQuery.isError ? (
        <InfoCard text={(summaryQuery.error as Error).message} tone="danger" />
      ) : null}

      {summaryQuery.data ? (
        <>
          <div className="metrics-grid">
            <MetricCard label="Total productos" value={summaryQuery.data.total_products} />
            <MetricCard
              label="Stock bajo"
              value={summaryQuery.data.low_stock_products}
              tone="warn"
            />
            <MetricCard label="Categorias" value={summaryQuery.data.total_categories} />
            <MetricCard
              label="Rol actual"
              value={session.user.role === 'admin' ? 'Admin' : 'Empleado'}
            />
          </div>

          <section className="panel">
            <div className="panel-head">
              <h2>Movimientos recientes</h2>
            </div>
            <MovementsTable items={summaryQuery.data.recent_movements} />
          </section>
        </>
      ) : null}
    </section>
  )
}
