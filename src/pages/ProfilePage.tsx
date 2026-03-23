import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCurrentUser } from '../api'
import {
  getPasswordChecks,
  Header,
  InfoCard,
  Modal,
  PasswordChecklist,
  PasswordField,
  TextField,
} from '../components'
import { useToast } from '../toast'
import type { CurrentUserUpdatePayload, Session, User } from '../types'

interface ProfilePageProps {
  session: Session
  onSessionUpdate: (user: User) => void
}

export function ProfilePage({ session, onSessionUpdate }: ProfilePageProps) {
  const [form, setForm] = useState<CurrentUserUpdatePayload>({
    name: session.user.name,
    email: session.user.email,
  })
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: '',
  })
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  useEffect(() => {
    setForm({
      name: session.user.name,
      email: session.user.email,
    })
  }, [session.user.email, session.user.name])

  const updateProfileMutation = useMutation({
    mutationFn: (payload: CurrentUserUpdatePayload) => updateCurrentUser(session, payload),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['auth-me'] })
      onSessionUpdate(user)
      showToast('Perfil actualizado correctamente.', 'success')
      setForm({
        name: user.name,
        email: user.email,
      })
    },
  })

  const updatePasswordMutation = useMutation({
    mutationFn: (payload: CurrentUserUpdatePayload) => updateCurrentUser(session, payload),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['auth-me'] })
      onSessionUpdate(user)
      showToast('Contrasena actualizada correctamente.', 'success')
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_new_password: '',
      })
      setIsPasswordModalOpen(false)
    },
  })

  return (
    <section className="page-section">
      <Header
        title="Perfil"
        subtitle="Administra tu informacion personal y cambia tu contrasena desde un solo lugar."
      />

      <div className="profile-layout">
        <section className="panel profile-card">
          <div className="profile-card-top">
            <div className="profile-avatar">{session.user.name.charAt(0).toUpperCase()}</div>
            <div className="profile-hero-copy">
              <p className="eyebrow">Cuenta activa</p>
              <h3>{session.user.name}</h3>
              <p>{session.user.email}</p>
            </div>
          </div>

          <div className="profile-detail-list">
            <article className="profile-detail-item">
              <span>Rol</span>
              <strong>{session.user.role === 'admin' ? 'Administrador' : 'Empleado'}</strong>
            </article>
            <article className="profile-detail-item">
              <span>Estado</span>
              <strong>{session.user.is_active ? 'Activo' : 'Inactivo'}</strong>
            </article>
            <article className="profile-detail-item">
              <span>Correo</span>
              <strong>{session.user.email}</strong>
            </article>
          </div>

          <div className="profile-card-note">
            <p>
              Desde aqui puedes mantener actualizados tus datos y reforzar el acceso a tu cuenta
              sin salir del panel.
            </p>
          </div>
        </section>

        <section className="panel profile-form-card">
          <div className="profile-form-head">
            <div>
              <h2>Editar perfil</h2>
              <p className="section-copy">
                Actualiza tu informacion principal y gestiona la seguridad desde acciones
                separadas.
              </p>
            </div>
          </div>

          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault()
              if (!form.name?.trim() || !form.email?.trim()) {
                showToast('Nombre y correo son obligatorios.', 'error')
                return
              }
              updateProfileMutation.mutate(form)
            }}
          >
            <div className="form-grid">
              <TextField
                label="Nombre"
                value={form.name ?? ''}
                onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              />
              <TextField
                label="Correo"
                type="email"
                value={form.email ?? ''}
                onChange={(value) => setForm((current) => ({ ...current, email: value }))}
              />
            </div>

            <div className="profile-form-footer">
              <div className="profile-form-actions">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setIsPasswordModalOpen(true)}
                >
                  Cambiar contrasena
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>

            {updateProfileMutation.isError ? (
              <InfoCard text={(updateProfileMutation.error as Error).message} tone="danger" />
            ) : null}
          </form>
        </section>
      </div>

      <Modal
        open={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false)
          setPasswordForm({
            current_password: '',
            new_password: '',
            confirm_new_password: '',
          })
        }}
        size="compact"
        title="Cambiar contrasena"
        subtitle="Confirma tu contrasena actual y define una nueva clave segura."
      >
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault()
            if (!passwordForm.current_password || !passwordForm.new_password) {
              showToast('Completa la contrasena actual y la nueva.', 'error')
              return
            }
            if (!getPasswordChecks(passwordForm.new_password).every((item) => item.valid)) {
              showToast('La nueva contrasena no cumple los requisitos de seguridad.', 'error')
              return
            }
            if (passwordForm.new_password !== passwordForm.confirm_new_password) {
              showToast('La confirmacion de la nueva contrasena no coincide.', 'error')
              return
            }
            updatePasswordMutation.mutate({
              current_password: passwordForm.current_password,
              new_password: passwordForm.new_password,
            })
          }}
        >
          <PasswordField
            label="Contrasena actual"
            value={passwordForm.current_password}
            onChange={(value) =>
              setPasswordForm((current) => ({ ...current, current_password: value }))
            }
          />
          <PasswordField
            label="Nueva contrasena"
            value={passwordForm.new_password}
            onChange={(value) =>
              setPasswordForm((current) => ({ ...current, new_password: value }))
            }
          />
          <PasswordField
            label="Confirmar nueva contrasena"
            value={passwordForm.confirm_new_password}
            onChange={(value) =>
              setPasswordForm((current) => ({ ...current, confirm_new_password: value }))
            }
          />
          <PasswordChecklist password={passwordForm.new_password} />
          {passwordForm.confirm_new_password &&
          passwordForm.new_password !== passwordForm.confirm_new_password ? (
            <p className="error-text">La confirmacion de la contrasena no coincide.</p>
          ) : null}

          <button
            type="submit"
            className="primary-button"
            disabled={updatePasswordMutation.isPending}
          >
            {updatePasswordMutation.isPending ? 'Actualizando...' : 'Actualizar contrasena'}
          </button>

          {updatePasswordMutation.isError ? (
            <InfoCard text={(updatePasswordMutation.error as Error).message} tone="danger" />
          ) : null}
        </form>
      </Modal>
    </section>
  )
}
