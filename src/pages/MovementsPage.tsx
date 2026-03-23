import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createMovement, fetchMovements, fetchProducts } from '../api'
import {
  EmptyState,
  Header,
  InfoCard,
  MovementsTable,
  NumberField,
  PaginationControls,
  TextAreaField,
} from '../components'
import { useToast } from '../toast'
import type { Session } from '../types'

export function MovementsPage({ session }: { session: Session }) {
  const [page, setPage] = useState(1)
  const [movementTypeFilter, setMovementTypeFilter] = useState('')
  const [form, setForm] = useState({
    product: 0,
    movement_type: 'entrada',
    quantity: 0,
    note: '',
  })
  const queryClient = useQueryClient()
  const isAdmin = session.user.role === 'admin'
  const { showToast } = useToast()

  const productsQuery = useQuery({
    queryKey: ['products', 'movement-select'],
    queryFn: () => fetchProducts(session, { page: 1, pageSize: 100 }),
  })
  const movementsQuery = useQuery({
    queryKey: ['movements', page, movementTypeFilter],
    queryFn: () =>
      fetchMovements(session, {
        page,
        filters: movementTypeFilter ? { movement_type: movementTypeFilter } : {},
      }),
    enabled: !isAdmin,
  })

  const createMovementMutation = useMutation({
    mutationFn: (payload: typeof form) => createMovement(session, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      setForm({ product: 0, movement_type: 'entrada', quantity: 0, note: '' })
      showToast('Movimiento registrado correctamente.', 'success')
    },
  })

  return (
    <section className="page-section">
      <Header
        title="Movimientos"
        subtitle={
          isAdmin
            ? 'Registra entradas, salidas y ajustes. El analisis historico detallado esta en el modulo Reportes.'
            : 'Registra entradas, salidas y ajustes con trazabilidad completa del historial.'
        }
      />

      <section className={isAdmin ? 'panel' : 'panel two-columns'}>
        <div>
          <div className="panel-head">
            <div>
              <h2>Registrar movimiento</h2>
              <p className="section-copy">Cada movimiento actualiza el stock y queda en historial.</p>
            </div>
          </div>
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault()
              if (!form.product) {
                showToast('Selecciona un producto para registrar el movimiento.', 'error')
                return
              }
              if (form.quantity <= 0) {
                showToast('La cantidad debe ser mayor a cero.', 'error')
                return
              }
              createMovementMutation.mutate(form)
            }}
          >
            <label className="field">
              <span>Producto</span>
              <select
                value={form.product}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    product: Number(event.target.value),
                  }))
                }
                required
              >
                <option value={0}>Selecciona un producto</option>
                {productsQuery.data?.results.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Tipo</span>
              <select
                value={form.movement_type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    movement_type: event.target.value,
                  }))
                }
              >
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
                <option value="ajuste">Ajuste</option>
              </select>
            </label>

            <NumberField
              label={form.movement_type === 'ajuste' ? 'Stock final' : 'Cantidad'}
              value={form.quantity}
              onChange={(value) => setForm((current) => ({ ...current, quantity: value }))}
            />

            <TextAreaField
              label="Nota"
              value={form.note}
              onChange={(value) => setForm((current) => ({ ...current, note: value }))}
            />

            <button
              type="submit"
              className="primary-button"
              disabled={createMovementMutation.isPending}
            >
              {createMovementMutation.isPending ? 'Guardando...' : 'Registrar movimiento'}
            </button>

            {createMovementMutation.isError ? (
              <p className="error-text">{(createMovementMutation.error as Error).message}</p>
            ) : null}
          </form>
        </div>

        {!isAdmin ? (
          <div>
            <div className="panel-head">
              <div>
                <h2>Historial</h2>
                <p className="section-copy">Filtra por tipo para revisar actividad reciente.</p>
              </div>
              <select
                className="compact-input"
                value={movementTypeFilter}
                onChange={(event) => {
                  setMovementTypeFilter(event.target.value)
                  setPage(1)
                }}
              >
                <option value="">Todos</option>
                <option value="entrada">Entradas</option>
                <option value="salida">Salidas</option>
                <option value="ajuste">Ajustes</option>
              </select>
            </div>
            {movementsQuery.isLoading ? <InfoCard text="Cargando historial..." /> : null}
            {movementsQuery.isError ? (
              <InfoCard text={(movementsQuery.error as Error).message} tone="danger" />
            ) : null}
            {movementsQuery.data?.results.length ? (
              <>
                <MovementsTable items={movementsQuery.data.results} />
                <PaginationControls
                  count={movementsQuery.data.count}
                  page={page}
                  onPageChange={setPage}
                />
              </>
            ) : null}
            {movementsQuery.data && !movementsQuery.data.results.length ? (
              <EmptyState text="No hay movimientos para los filtros seleccionados." />
            ) : null}
          </div>
        ) : null}
      </section>
    </section>
  )
}
