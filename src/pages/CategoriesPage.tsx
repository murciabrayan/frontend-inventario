import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from '../api'
import {
  EmptyState,
  formatDate,
  Header,
  InfoCard,
  Modal,
  PaginationControls,
  TextAreaField,
  TextField,
} from '../components'
import type { Category, CategoryPayload, Session } from '../types'

const initialForm: CategoryPayload = {
  name: '',
  description: '',
}

export function CategoriesPage({ session }: { session: Session }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<CategoryPayload>(initialForm)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const queryClient = useQueryClient()
  const isAdmin = session.user.role === 'admin'

  const categoriesQuery = useQuery({
    queryKey: ['categories', page, search],
    queryFn: () => fetchCategories(session, { page, search }),
  })

  const resetForm = () => {
    setForm(initialForm)
    setEditingCategory(null)
    setIsModalOpen(false)
  }

  const saveCategoryMutation = useMutation({
    mutationFn: (payload: CategoryPayload) => {
      if (editingCategory) {
        return updateCategory(session, editingCategory.id, payload)
      }
      return createCategory(session, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      resetForm()
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: number) => deleteCategory(session, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      resetForm()
    },
  })

  return (
    <section className="page-section">
      <Header
        title="Categorias"
        subtitle="Crea, edita y elimina categorias desde una vista clara para administradores."
        action={
          isAdmin ? (
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setEditingCategory(null)
                setForm(initialForm)
                setIsModalOpen(true)
              }}
            >
              Crear categoria
            </button>
          ) : null
        }
      />

      <section className="panel">
        <div>
          <div className="panel-head">
            <div>
              <h2>Listado</h2>
              <p className="section-copy">Busca categorias por nombre o descripcion.</p>
            </div>
            <input
              className="search-input compact-input"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Buscar categoria"
            />
          </div>

          {categoriesQuery.isLoading ? <InfoCard text="Cargando categorias..." /> : null}
          {categoriesQuery.isError ? (
            <InfoCard text={(categoriesQuery.error as Error).message} tone="danger" />
          ) : null}
          {categoriesQuery.data?.results.length ? (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Descripcion</th>
                    <th>Creada</th>
                    {isAdmin ? <th>Acciones</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {categoriesQuery.data.results.map((category) => (
                    <tr key={category.id}>
                      <td>{category.name}</td>
                      <td>{category.description || 'Sin descripcion'}</td>
                      <td>{formatDate(category.created_at)}</td>
                      {isAdmin ? (
                        <td className="actions-cell">
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => {
                              setEditingCategory(category)
                              setForm({
                                name: category.name,
                                description: category.description,
                              })
                              setIsModalOpen(true)
                            }}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="ghost-button ghost-button-warn"
                            onClick={() => deleteCategoryMutation.mutate(category.id)}
                          >
                            Eliminar
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
              <PaginationControls
                count={categoriesQuery.data.count}
                page={page}
                onPageChange={setPage}
              />
            </>
          ) : null}
          {categoriesQuery.data && !categoriesQuery.data.results.length ? (
            <EmptyState text="No hay categorias para la busqueda actual." />
          ) : null}
        </div>

        {!isAdmin ? (
          <InfoCard text="Solo el rol admin puede crear, editar o eliminar categorias." />
        ) : null}
      </section>

      {isAdmin ? (
        <Modal
          open={isModalOpen}
          onClose={resetForm}
          title={editingCategory ? 'Editar categoria' : 'Crear categoria'}
          subtitle={
            editingCategory
              ? 'Modifica la categoria seleccionada.'
              : 'Crea categorias para organizar productos.'
          }
        >
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault()
              saveCategoryMutation.mutate(form)
            }}
          >
            <TextField
              label="Nombre"
              value={form.name}
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
            />
            <TextAreaField
              label="Descripcion"
              value={form.description}
              onChange={(value) => setForm((current) => ({ ...current, description: value }))}
            />
            <button
              type="submit"
              className="primary-button"
              disabled={saveCategoryMutation.isPending}
            >
              {saveCategoryMutation.isPending
                ? 'Guardando...'
                : editingCategory
                  ? 'Guardar cambios'
                  : 'Crear categoria'}
            </button>
            {saveCategoryMutation.isError ? (
              <p className="error-text">{(saveCategoryMutation.error as Error).message}</p>
            ) : null}
            {deleteCategoryMutation.isError ? (
              <p className="error-text">{(deleteCategoryMutation.error as Error).message}</p>
            ) : null}
          </form>
        </Modal>
      ) : null}
    </section>
  )
}
