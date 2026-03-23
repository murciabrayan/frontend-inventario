import { useEffect, useState, type ReactNode } from 'react'

import type { InventoryMovement, Product } from './types'

export function Header({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle: string
  action?: ReactNode
}) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">Operacion</p>
        <h2>{title}</h2>
        <p className="lead content-lead">{subtitle}</p>
      </div>
      {action ? <div className="header-action">{action}</div> : null}
    </header>
  )
}

export function MetricCard({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: number | string
  tone?: 'default' | 'warn'
}) {
  return (
    <article className={tone === 'warn' ? 'metric-card warn' : 'metric-card'}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

export function InfoCard({
  text,
  tone = 'default',
}: {
  text: string
  tone?: 'default' | 'danger'
}) {
  return <div className={tone === 'danger' ? 'info-card danger' : 'info-card'}>{text}</div>
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'password'
  placeholder?: string
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
      />
    </label>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
      {open ? null : <path d="M4 4l16 16" />}
    </svg>
  )
}

export function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <label className="field">
      <span>{label}</span>
      <div className="password-field-wrap">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ocultar contrasena' : 'Mostrar contrasena'}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
    </label>
  )
}

export function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  const [inputValue, setInputValue] = useState(
    Number.isNaN(value) || value === 0 ? '' : String(value),
  )

  useEffect(() => {
    setInputValue(Number.isNaN(value) || value === 0 ? '' : String(value))
  }, [value])

  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={inputValue}
        onChange={(event) => {
          const nextValue = event.target.value
          setInputValue(nextValue)
          onChange(nextValue === '' ? 0 : Number(nextValue))
        }}
        required
      />
    </label>
  )
}

export function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="field field-full">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} />
    </label>
  )
}

export function getPasswordChecks(password: string) {
  return [
    { label: 'Minimo 8 caracteres', valid: password.length >= 8 },
    { label: 'Al menos una mayuscula', valid: /[A-Z]/.test(password) },
    { label: 'Al menos un numero', valid: /\d/.test(password) },
    { label: 'Al menos un caracter especial', valid: /[^A-Za-z0-9]/.test(password) },
  ]
}

export function PasswordChecklist({ password }: { password: string }) {
  const checks = getPasswordChecks(password)

  return (
    <div className="password-checklist">
      {checks.map((check) => (
        <div
          key={check.label}
          className={check.valid ? 'password-check is-valid' : 'password-check'}
        >
          <span className="password-check-icon">{check.valid ? '✓' : ''}</span>
          <span>{check.label}</span>
        </div>
      ))}
    </div>
  )
}

export function ProductsTable({
  items,
  isAdmin,
  onEdit,
  onDeactivate,
}: {
  items: Product[]
  isAdmin: boolean
  onEdit: (product: Product) => void
  onDeactivate: (product: Product) => void
}) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Producto</th>
          <th>SKU</th>
          <th>Categoria</th>
          <th>Precio</th>
          <th>Stock</th>
          <th>Minimo</th>
          <th>Estado</th>
          {isAdmin ? <th>Acciones</th> : null}
        </tr>
      </thead>
      <tbody>
        {items.map((product) => (
          <tr key={product.id}>
            <td>{product.name}</td>
            <td>{product.sku}</td>
            <td>{product.category_name}</td>
            <td>{formatCurrency(product.price)}</td>
            <td>{product.stock}</td>
            <td>{product.minimum_stock}</td>
            <td>
              <span className={product.is_low_stock ? 'status-badge warn' : 'status-badge'}>
                {product.is_low_stock ? 'Stock bajo' : product.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </td>
            {isAdmin ? (
              <td className="actions-cell">
                <button type="button" className="ghost-button" onClick={() => onEdit(product)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="ghost-button ghost-button-warn"
                  onClick={() => onDeactivate(product)}
                  disabled={!product.is_active}
                >
                  Desactivar
                </button>
              </td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function MovementsTable({ items }: { items: InventoryMovement[] }) {
  return (
    <table className="data-table">
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
      <tbody>
        {items.map((movement) => (
          <tr key={movement.id}>
            <td>{formatDate(movement.created_at)}</td>
            <td>{movement.product_name}</td>
            <td>
              <span className="status-badge">{movement.movement_type}</span>
            </td>
            <td>{movement.quantity}</td>
            <td>{movement.user.name}</td>
            <td>{movement.note || 'Sin nota'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function PaginationControls({
  count,
  page,
  pageSize = 10,
  onPageChange,
}: {
  count: number
  page: number
  pageSize?: number
  onPageChange: (page: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize))

  return (
    <div className="pagination-bar">
      <span>
        Pagina {page} de {totalPages} - {count} registros
      </span>
      <div className="pagination-actions">
        <button
          type="button"
          className="ghost-button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Anterior
        </button>
        <button
          type="button"
          className="ghost-button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}

export function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>
}

export function Modal({
  title,
  subtitle,
  open,
  onClose,
  showCloseButton = true,
  size = 'default',
  children,
}: {
  title: string
  subtitle?: string
  open: boolean
  onClose: () => void
  showCloseButton?: boolean
  size?: 'default' | 'compact'
  children: ReactNode
}) {
  if (!open) {
    return null
  }

  return (
    <div className="modal-overlay" role="presentation">
      <div
        className={size === 'compact' ? 'modal-card modal-card-compact' : 'modal-card'}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            {subtitle ? <p className="section-copy">{subtitle}</p> : null}
          </div>
          {showCloseButton ? (
            <button type="button" className="ghost-button" onClick={onClose}>
              Cerrar
            </button>
          ) : null}
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatCurrency(value: string | number) {
  const amount = typeof value === 'number' ? value : Number(value)
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount)
}
