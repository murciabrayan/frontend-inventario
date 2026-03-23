import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createProduct,
  deactivateProduct,
  fetchCategories,
  fetchProducts,
  updateProduct,
} from '../api'
import {
  EmptyState,
  Header,
  InfoCard,
  Modal,
  NumberField,
  PaginationControls,
  ProductsTable,
  TextAreaField,
  TextField,
} from '../components'
import { useConfirm } from '../confirm'
import { useToast } from '../toast'
import type { Product, ProductPayload, Session } from '../types'

const initialForm: ProductPayload = {
  name: '',
  sku: '',
  description: '',
  price: 0,
  stock: 0,
  minimum_stock: 0,
  category: 0,
  is_active: true,
}

export function ProductsPage({ session }: { session: Session }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [lowStockFilter, setLowStockFilter] = useState('')
  const [form, setForm] = useState<ProductPayload>(initialForm)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const queryClient = useQueryClient()
  const isAdmin = session.user.role === 'admin'
  const { showToast } = useToast()
  const confirm = useConfirm()

  const productsQuery = useQuery({
    queryKey: ['products', page, search, categoryFilter, statusFilter, lowStockFilter],
    queryFn: () =>
      fetchProducts(session, {
        page,
        search,
        filters: {
          ...(categoryFilter ? { category: categoryFilter } : {}),
          ...(statusFilter ? { is_active: statusFilter } : {}),
          ...(lowStockFilter ? { low_stock: lowStockFilter } : {}),
        },
      }),
  })
  const categoriesQuery = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => fetchCategories(session, { page: 1, pageSize: 100 }),
  })

  const resetForm = () => {
    setForm(initialForm)
    setEditingProduct(null)
    setIsModalOpen(false)
  }

  const saveProductMutation = useMutation({
    mutationFn: (payload: ProductPayload) => {
      if (editingProduct) {
        return updateProduct(session, editingProduct.id, payload)
      }
      return createProduct(session, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      showToast(
        editingProduct ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.',
        'success',
      )
      resetForm()
    },
  })

  const deactivateProductMutation = useMutation({
    mutationFn: (productId: number) => deactivateProduct(session, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      showToast('Producto desactivado correctamente.', 'success')
    },
  })

  return (
    <section className="page-section">
      <Header
        title="Productos"
        subtitle="Administra inventario, edita productos, aplica filtros y desactiva items sin perder historial."
        action={
          isAdmin ? (
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setEditingProduct(null)
                setForm(initialForm)
                setIsModalOpen(true)
              }}
            >
              Crear producto
            </button>
          ) : null
        }
      />

      <section className="panel">
        <div className="toolbar-grid">
          <label className="field">
            <span>Buscar</span>
            <input
              className="search-input"
              value={search}
              onChange={(event) => {
                setPage(1)
                setSearch(event.target.value)
              }}
              placeholder="Nombre, SKU o descripcion"
            />
          </label>
          <label className="field">
            <span>Categoria</span>
            <select
              value={categoryFilter}
              onChange={(event) => {
                setPage(1)
                setCategoryFilter(event.target.value)
              }}
            >
              <option value="">Todas</option>
              {categoriesQuery.data?.results.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Estado</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(1)
                setStatusFilter(event.target.value)
              }}
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </label>
          <label className="field">
            <span>Stock bajo</span>
            <select
              value={lowStockFilter}
              onChange={(event) => {
                setPage(1)
                setLowStockFilter(event.target.value)
              }}
            >
              <option value="">Todos</option>
              <option value="true">Solo stock bajo</option>
              <option value="false">Stock normal</option>
            </select>
          </label>
        </div>

        {productsQuery.isLoading ? <InfoCard text="Cargando productos..." /> : null}
        {productsQuery.isError ? (
          <InfoCard text={(productsQuery.error as Error).message} tone="danger" />
        ) : null}
        {productsQuery.data?.results.length ? (
          <>
            <ProductsTable
              items={productsQuery.data.results}
              isAdmin={isAdmin}
              onEdit={(product) => {
                setEditingProduct(product)
                setForm({
                  name: product.name,
                  sku: product.sku,
                  description: product.description,
                  price: Number(product.price),
                  stock: product.stock,
                  minimum_stock: product.minimum_stock,
                  category: product.category,
                  is_active: product.is_active,
                })
                setIsModalOpen(true)
              }}
              onDeactivate={async (product) => {
                const approved = await confirm({
                  title: 'Desactivar producto',
                  description: `Vas a desactivar "${product.name}". El producto dejara de estar disponible para nuevas operaciones activas.`,
                  confirmLabel: 'Desactivar',
                  cancelLabel: 'Cancelar',
                  tone: 'danger',
                })
                if (!approved) {
                  return
                }
                deactivateProductMutation.mutate(product.id)
              }}
            />
            <PaginationControls
              count={productsQuery.data.count}
              page={page}
              onPageChange={setPage}
            />
          </>
        ) : null}
        {productsQuery.data && !productsQuery.data.results.length ? (
          <EmptyState text="No hay productos para los filtros seleccionados." />
        ) : null}
      </section>

      {isAdmin ? (
        <Modal
          open={isModalOpen}
          onClose={resetForm}
          title={editingProduct ? 'Editar producto' : 'Crear producto'}
          subtitle={
            editingProduct
              ? 'Actualiza datos del producto seleccionado.'
              : 'Completa los datos para agregar un nuevo producto.'
          }
        >
          <form
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault()
              if (!form.name.trim() || !form.sku.trim()) {
                showToast('Completa el nombre y el SKU del producto.', 'error')
                return
              }
              if (!form.category) {
                showToast('Selecciona una categoria para el producto.', 'error')
                return
              }
              saveProductMutation.mutate(form)
            }}
          >
            <TextField
              label="Nombre"
              value={form.name}
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
            />
            <TextField
              label="SKU"
              value={form.sku}
              onChange={(value) => setForm((current) => ({ ...current, sku: value }))}
            />
            <TextAreaField
              label="Descripcion"
              value={form.description}
              onChange={(value) => setForm((current) => ({ ...current, description: value }))}
            />
            <NumberField
              label="Precio"
              value={form.price}
              onChange={(value) => setForm((current) => ({ ...current, price: value }))}
            />
            <NumberField
              label="Stock"
              value={form.stock}
              onChange={(value) => setForm((current) => ({ ...current, stock: value }))}
            />
            <NumberField
              label="Stock minimo"
              value={form.minimum_stock}
              onChange={(value) =>
                setForm((current) => ({ ...current, minimum_stock: value }))
              }
            />
            <label className="field">
              <span>Categoria</span>
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: Number(event.target.value),
                  }))
                }
                required
              >
                <option value={0}>Selecciona una categoria</option>
                {categoriesQuery.data?.results.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="primary-button field-full"
              disabled={saveProductMutation.isPending}
            >
              {saveProductMutation.isPending
                ? 'Guardando...'
                : editingProduct
                  ? 'Guardar cambios'
                  : 'Crear producto'}
            </button>

            {saveProductMutation.isError ? (
              <p className="error-text field-full">
                {(saveProductMutation.error as Error).message}
              </p>
            ) : null}
          </form>
        </Modal>
      ) : null}
    </section>
  )
}
