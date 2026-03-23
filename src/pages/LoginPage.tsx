import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { loginRequest } from '../api'
import type { LoginPayload, Session } from '../types'

export function LoginPage({ onLogin }: { onLogin: (session: Session) => void }) {
  const [form, setForm] = useState<LoginPayload>({ email: '', password: '' })

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (session) => {
      onLogin(session)
    },
  })

  return (
    <div className="login-shell">
      <section className="login-panel">
        <div>
          <p className="eyebrow">Acceso seguro</p>
          <h1>Sistema de inventario</h1>
          <p className="lead content-lead">
            Inicia sesion para entrar al dashboard y operar el inventario.
          </p>
        </div>

        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault()
            loginMutation.mutate(form)
          }}
        >
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="admin@inventario.com"
            />
          </label>

          <label className="field">
            <span>Contrasena</span>
            <input
              type="password"
              required
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
              placeholder="********"
            />
          </label>

          <button className="primary-button" type="submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'Ingresando...' : 'Iniciar sesion'}
          </button>

          {loginMutation.isError ? (
            <p className="error-text">{(loginMutation.error as Error).message}</p>
          ) : null}
        </form>
      </section>
    </div>
  )
}
