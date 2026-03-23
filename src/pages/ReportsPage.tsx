import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMovementReport } from '../api'
import { EmptyState, Header, InfoCard, MovementsTable } from '../components'
import { useToast } from '../toast'
import type { MovementChartPoint, MovementTypeSummary, Session } from '../types'

const typeLabels = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Ajuste',
} as const

export function ReportsPage({ session }: { session: Session }) {
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = `${today.slice(0, 8)}01`
  const [movementType, setMovementType] = useState('')
  const [startDate, setStartDate] = useState(monthStart)
  const [endDate, setEndDate] = useState(today)
  const { showToast } = useToast()

  const reportQuery = useQuery({
    queryKey: ['movement-report', movementType, startDate, endDate],
    queryFn: () =>
      fetchMovementReport(session, {
        movement_type: movementType,
        start_date: startDate,
        end_date: endDate,
      }),
  })

  const printableTitle = useMemo(() => {
    const typePart = movementType ? ` - ${typeLabels[movementType as keyof typeof typeLabels]}` : ''
    return `Reporte de movimientos${typePart}`
  }, [movementType])

  const exportPdf = () => {
    if (!reportQuery.data) {
      showToast('No hay informacion para exportar.', 'error')
      return
    }

    const report = reportQuery.data
    const rows = report.movements
      .map(
        (movement) => `
          <tr>
            <td>${new Date(movement.created_at).toLocaleString('es-CO')}</td>
            <td>${movement.product_name}</td>
            <td>${movement.movement_type}</td>
            <td>${movement.quantity}</td>
            <td>${movement.user.name}</td>
            <td>${movement.note || 'Sin nota'}</td>
          </tr>`,
      )
      .join('')

    const printWindow = window.open('', '_blank', 'width=1200,height=900')
    if (!printWindow) {
      showToast('El navegador bloqueo la ventana de impresion.', 'error')
      return
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${printableTitle}</title>
          <style>
            body { font-family: Segoe UI, Arial, sans-serif; padding: 32px; color: #16324f; }
            h1 { margin: 0 0 8px; }
            p { margin: 4px 0; }
            .summary { display: flex; gap: 24px; margin: 20px 0; }
            .card { border: 1px solid #d8e0e8; border-radius: 12px; padding: 16px; min-width: 180px; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th, td { border: 1px solid #d8e0e8; padding: 10px; text-align: left; font-size: 12px; }
            th { background: #edf3f8; }
          </style>
        </head>
        <body>
          <h1>${printableTitle}</h1>
          <p>Rango: ${startDate || 'Sin inicio'} a ${endDate || 'Sin fin'}</p>
          <p>Tipo: ${movementType ? typeLabels[movementType as keyof typeof typeLabels] : 'Todos'}</p>
          <div class="summary">
            <div class="card">
              <strong>Total movimientos</strong>
              <p>${report.total_movements}</p>
            </div>
            <div class="card">
              <strong>Total cantidad</strong>
              <p>${report.total_quantity}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Usuario</th>
                <th>Nota</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    showToast('Reporte preparado para exportacion a PDF.', 'success')
    printWindow.print()
  }

  return (
    <section className="page-section">
      <Header
        title="Reportes"
        subtitle="Analiza movimientos por tipo y rango de fechas, con graficas y exportacion a PDF."
        action={
          <button
            type="button"
            className="primary-button"
            onClick={exportPdf}
            disabled={!reportQuery.data}
          >
            Exportar PDF
          </button>
        }
      />

      <section className="panel">
        <div className="toolbar-grid toolbar-grid-report">
          <label className="field">
            <span>Tipo de movimiento</span>
            <select value={movementType} onChange={(event) => setMovementType(event.target.value)}>
              <option value="">Todos</option>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
              <option value="ajuste">Ajuste</option>
            </select>
          </label>
          <label className="field">
            <span>Fecha inicial</span>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label className="field">
            <span>Fecha final</span>
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </label>
        </div>

        {reportQuery.isLoading ? <InfoCard text="Generando reporte..." /> : null}
        {reportQuery.isError ? (
          <InfoCard text={(reportQuery.error as Error).message} tone="danger" />
        ) : null}

        {reportQuery.data ? (
          <>
            <div className="metrics-grid report-metrics">
              <article className="metric-card">
                <span>Total movimientos</span>
                <strong>{reportQuery.data.total_movements}</strong>
              </article>
              <article className="metric-card warn">
                <span>Total cantidad</span>
                <strong>{reportQuery.data.total_quantity}</strong>
              </article>
            </div>

            <section className="report-grid">
              <div className="panel chart-panel">
                <div className="panel-head">
                  <div>
                    <h2>Movimientos por tipo</h2>
                    <p className="section-copy">Cantidad y frecuencia por categoria de movimiento.</p>
                  </div>
                </div>
                {reportQuery.data.type_summary.length ? (
                  <TypeSummaryChart items={reportQuery.data.type_summary} />
                ) : (
                  <EmptyState text="No hay datos para ese filtro." />
                )}
              </div>

              <div className="panel chart-panel">
                <div className="panel-head">
                  <div>
                    <h2>Tendencia por fecha</h2>
                    <p className="section-copy">Visualiza como se mueve la cantidad en el rango elegido.</p>
                  </div>
                </div>
                {reportQuery.data.daily_summary.length ? (
                  <DailySummaryChart items={reportQuery.data.daily_summary} />
                ) : (
                  <EmptyState text="No hay datos diarios para ese rango." />
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Detalle de movimientos</h2>
                  <p className="section-copy">Incluye hasta 200 registros del filtro activo para analisis y exportacion.</p>
                </div>
              </div>
              {reportQuery.data.movements.length ? (
                <MovementsTable items={reportQuery.data.movements} />
              ) : (
                <EmptyState text="No hay movimientos para mostrar." />
              )}
            </section>
          </>
        ) : null}
      </section>
    </section>
  )
}

function TypeSummaryChart({ items }: { items: MovementTypeSummary[] }) {
  const maxValue = Math.max(...items.map((item) => item.total_quantity), 1)

  return (
    <div className="bar-chart">
      {items.map((item) => (
        <div key={item.movement_type} className="bar-chart-row">
          <div className="bar-chart-label">
            <strong>{typeLabels[item.movement_type]}</strong>
            <span>{item.movement_count} movimientos</span>
          </div>
          <div className="bar-chart-track">
            <div
              className="bar-chart-fill"
              style={{ width: `${(item.total_quantity / maxValue) * 100}%` }}
            />
          </div>
          <span className="bar-chart-value">{item.total_quantity}</span>
        </div>
      ))}
    </div>
  )
}

function DailySummaryChart({ items }: { items: MovementChartPoint[] }) {
  const maxValue = Math.max(...items.map((item) => item.total_quantity), 1)

  return (
    <div className="mini-bars">
      {items.map((item) => (
        <div key={item.label} className="mini-bar-card">
          <div
            className="mini-bar-fill"
            style={{ height: `${Math.max((item.total_quantity / maxValue) * 160, 10)}px` }}
          />
          <strong>{item.total_quantity}</strong>
          <span>{new Date(item.label).toLocaleDateString('es-CO')}</span>
        </div>
      ))}
    </div>
  )
}
