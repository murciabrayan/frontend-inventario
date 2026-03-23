import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createUser, fetchUsers, updateUser } from '../api'
import {
  EmptyState,
  formatDate,
  Header,
  InfoCard,
  Modal,
  PaginationControls,
  TextField,
} from '../components'
import type { Session, UserCreatePayload, UserUpdatePayload } from '../types'

const initialForm: UserCreatePayload = {
  name: '',
  email: '',
  password: '',
  role: 'employee',
  is_active: true,
}

export function UsersPage({ session }: { session: Session }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<UserCreatePayload>(initialForm)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const usersQuery = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => fetchUsers(session, { page, search }),
    enabled: session.user.role === 'admin',
  })

  const createUserMutation = useMutation({
    mutationFn: (payload: UserCreatePayload) => createUser(session, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setForm(initialForm)
      setIsModalOpen(false)
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UserUpdatePayload }) =>
      updateUser(session, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  if (session.user.role !== 'admin') {
    return (
      <section className="page-section">
        <Header
          title="Usuarios"
          subtitle="Este modulo esta reservado para administradores."
        />
        <InfoCard text="No tienes permisos para gestionar usuarios." tone="danger" />
      </section>
    )
  }

  return (
    <section className="page-section">
      <Header
        title="Usuarios"
        subtitle="Crea usuarios nuevos, asigna rol y controla si pueden entrar al sistema."
        action={
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setForm(initialForm)
              setIsModalOpen(true)
            }}
          >
            Crear usuario
          </button>
        }
      />

      <section className="panel">
        <div>
          <div className="panel-head">
            <div>
              <h2>Listado de usuarios</h2>
              <p className="section-copy">Busca por nombre o correo.</p>
            </div>
            <input
              className="search-input compact-input"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Buscar usuario"
            />
          </div>
          {usersQuery.isLoading ? <InfoCard text="Cargando usuarios..." /> : null}
          {usersQuery.isError ? (
            <InfoCard text={(usersQuery.error as Error).message} tone="danger" />
          ) : null}

          {usersQuery.data?.results.length ? (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Activo</th>
                    <th>Creado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usersQuery.data.results.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className="role-pill role-pill-dark">{user.role}</span>
                      </td>
                      <td>{user.is_active ? 'Si' : 'No'}</td>
                      <td>{formatDate(user.created_at)}</td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() =>
                            updateUserMutation.mutate({
                              id: user.id,
                              payload: {
                                role: user.role === 'admin' ? 'employee' : 'admin',
                              },
                            })
                          }
                        >
                          Cambiar rol
                        </button>
                        <button
                          type="button"
                          className="ghost-button ghost-button-warn"
                          onClick={() =>
                            updateUserMutation.mutate({
                              id: user.id,
                              payload: { is_active: !user.is_active },
                            })
                          }
                        >
                          {user.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <PaginationControls
                count={usersQuery.data.count}
                page={page}
                onPageChange={setPage}
              />
            </>
          ) : null}
          {usersQuery.data && !usersQuery.data.results.length ? (
            <EmptyState text="No hay usuarios para esa busqueda." />
          ) : null}
        </div>
      </section>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear usuario"
        subtitle="Asigna el rol correcto desde el inicio."
      >
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault()
            createUserMutation.mutate(form)
          }}
        >
          <TextField
            label="Nombre"
            value={form.name}
            onChange={(value) => setForm((current) => ({ ...current, name: value }))}
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(value) => setForm((current) => ({ ...current, email: value }))}
          />
          <TextField
            label="Contrasena"
            type="password"
            value={form.password}
            onChange={(value) => setForm((current) => ({ ...current, password: value }))}
          />
          <label className="field">
            <span>Rol</span>
            <select
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  role: event.target.value as UserCreatePayload['role'],
                }))
              }
            >
              <option value="employee">Empleado</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) =>
                setForm((current) => ({ ...current, is_active: event.target.checked }))
              }
            />
            <span>Usuario activo</span>
          </label>

          <button
            type="submit"
            className="primary-button"
            disabled={createUserMutation.isPending}
          >
            {createUserMutation.isPending ? 'Creando...' : 'Crear usuario'}
          </button>

          {createUserMutation.isError ? (
            <p className="error-text">{(createUserMutation.error as Error).message}</p>
          ) : null}
          {updateUserMutation.isError ? (
            <p className="error-text">{(updateUserMutation.error as Error).message}</p>
          ) : null}
        </form>
      </Modal>
    </section>
  )
}
