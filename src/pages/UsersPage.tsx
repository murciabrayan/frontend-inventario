import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createUser, fetchUsers, updateUser } from '../api'
import {
  EmptyState,
  formatDate,
  getPasswordChecks,
  Header,
  InfoCard,
  Modal,
  PasswordChecklist,
  PasswordField,
  PaginationControls,
  TextField,
} from '../components'
import { useConfirm } from '../confirm'
import { useToast } from '../toast'
import type { Session, User, UserCreatePayload, UserUpdatePayload } from '../types'

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
  const [confirmCreatePassword, setConfirmCreatePassword] = useState('')
  const [editForm, setEditForm] = useState<UserUpdatePayload>({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    is_active: true,
  })
  const [confirmEditPassword, setConfirmEditPassword] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const confirm = useConfirm()

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
      setConfirmCreatePassword('')
      setIsModalOpen(false)
      showToast('Usuario creado correctamente.', 'success')
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UserUpdatePayload }) =>
      updateUser(session, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      showToast('Usuario actualizado correctamente.', 'success')
      setEditingUser(null)
      setConfirmEditPassword('')
      setEditForm({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        is_active: true,
      })
    },
  })

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setConfirmEditPassword('')
    setEditForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      is_active: user.is_active,
    })
  }

  if (session.user.role !== 'admin') {
    return (
      <section className="page-section">
        <Header title="Usuarios" subtitle="Este modulo esta reservado para administradores." />
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
              setConfirmCreatePassword('')
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
                        <span className="role-pill role-pill-dark">
                          {user.role === 'admin' ? 'Admin' : 'Empleado'}
                        </span>
                      </td>
                      <td>{user.is_active ? 'Si' : 'No'}</td>
                      <td>{formatDate(user.created_at)}</td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => openEditModal(user)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="ghost-button ghost-button-warn"
                          onClick={async () => {
                            const approved = await confirm({
                              title: user.is_active ? 'Desactivar usuario' : 'Activar usuario',
                              description: `Vas a ${user.is_active ? 'desactivar' : 'activar'} a ${user.name}.`,
                              confirmLabel: user.is_active ? 'Desactivar' : 'Activar',
                              cancelLabel: 'Cancelar',
                              tone: user.is_active ? 'danger' : 'default',
                            })
                            if (!approved) {
                              return
                            }
                            updateUserMutation.mutate({
                              id: user.id,
                              payload: { is_active: !user.is_active },
                            })
                          }}
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
            if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
              showToast('Completa nombre, correo y contrasena.', 'error')
              return
            }
            if (!getPasswordChecks(form.password).every((item) => item.valid)) {
              showToast('La contrasena no cumple los requisitos de seguridad.', 'error')
              return
            }
            if (form.password !== confirmCreatePassword) {
              showToast('La confirmacion de la contrasena no coincide.', 'error')
              return
            }
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
          <PasswordField
            label="Contrasena"
            value={form.password}
            onChange={(value) => setForm((current) => ({ ...current, password: value }))}
          />
          <PasswordField
            label="Confirmar contrasena"
            value={confirmCreatePassword}
            onChange={setConfirmCreatePassword}
          />
          <PasswordChecklist password={form.password} />
          {confirmCreatePassword && form.password !== confirmCreatePassword ? (
            <p className="error-text">La confirmacion de la contrasena no coincide.</p>
          ) : null}

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
        </form>
      </Modal>

      <Modal
        open={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title="Editar usuario"
        subtitle="Actualiza la informacion del usuario y, si quieres, define una nueva contrasena."
      >
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault()
            if (!editingUser) {
              return
            }
            if (!editForm.name?.trim() || !editForm.email?.trim()) {
              showToast('Completa nombre y correo.', 'error')
              return
            }
            if (
              editForm.password &&
              !getPasswordChecks(editForm.password).every((item) => item.valid)
            ) {
              showToast('La contrasena no cumple los requisitos de seguridad.', 'error')
              return
            }
            if ((editForm.password ?? '') !== confirmEditPassword) {
              showToast('La confirmacion de la contrasena no coincide.', 'error')
              return
            }
            updateUserMutation.mutate({
              id: editingUser.id,
              payload: editForm,
            })
          }}
        >
          <TextField
            label="Nombre"
            value={editForm.name ?? ''}
            onChange={(value) => setEditForm((current) => ({ ...current, name: value }))}
          />
          <TextField
            label="Correo"
            type="email"
            value={editForm.email ?? ''}
            onChange={(value) => setEditForm((current) => ({ ...current, email: value }))}
          />
          <PasswordField
            label="Nueva contrasena"
            value={editForm.password ?? ''}
            onChange={(value) => setEditForm((current) => ({ ...current, password: value }))}
          />
          {editForm.password ? (
            <>
              <PasswordField
                label="Confirmar nueva contrasena"
                value={confirmEditPassword}
                onChange={setConfirmEditPassword}
              />
              <PasswordChecklist password={editForm.password} />
              {confirmEditPassword && editForm.password !== confirmEditPassword ? (
                <p className="error-text">La confirmacion de la contrasena no coincide.</p>
              ) : null}
            </>
          ) : null}

          <label className="field">
            <span>Rol</span>
            <select
              value={editForm.role ?? 'employee'}
              onChange={(event) =>
                setEditForm((current) => ({
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
              checked={Boolean(editForm.is_active)}
              onChange={(event) =>
                setEditForm((current) => ({ ...current, is_active: event.target.checked }))
              }
            />
            <span>Usuario activo</span>
          </label>

          <button
            type="submit"
            className="primary-button"
            disabled={updateUserMutation.isPending}
          >
            {updateUserMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>

          {updateUserMutation.isError ? (
            <p className="error-text">{(updateUserMutation.error as Error).message}</p>
          ) : null}
        </form>
      </Modal>
    </section>
  )
}
