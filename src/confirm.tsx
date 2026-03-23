import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Modal } from './components'

interface ConfirmOptions {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void
}

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        ...options,
        resolve,
      })
    })
  }, [])

  const handleClose = (result: boolean) => {
    if (!confirmState) {
      return
    }

    confirmState.resolve(result)
    setConfirmState(null)
  }

  const value = useMemo(() => confirm, [confirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal
        open={Boolean(confirmState)}
        onClose={() => handleClose(false)}
        title={confirmState?.title ?? ''}
        subtitle={confirmState?.description ?? ''}
        showCloseButton={false}
      >
        <div className="confirm-actions">
          <button type="button" className="ghost-button" onClick={() => handleClose(false)}>
            {confirmState?.cancelLabel ?? 'Cancelar'}
          </button>
          <button
            type="button"
            className={
              confirmState?.tone === 'danger'
                ? 'primary-button danger-button'
                : 'primary-button'
            }
            onClick={() => handleClose(true)}
          >
            {confirmState?.confirmLabel ?? 'Confirmar'}
          </button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)

  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }

  return context
}
