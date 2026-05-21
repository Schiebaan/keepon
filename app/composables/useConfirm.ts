/**
 * Promise-based confirmation dialog — drop-in replacement for `window.confirm()`.
 *
 * Usage:
 *   const confirm = useConfirm()
 *   if (!await confirm('Weet je het zeker?')) return
 *
 *   // Or richer:
 *   if (!await confirm({
 *     title: 'Klant verwijderen',
 *     message: 'Dit kan niet ongedaan worden.',
 *     confirmLabel: 'Verwijderen',
 *     dangerous: true,
 *   })) return
 *
 * The actual modal lives in <ConfirmDialog/> mounted from app.vue.
 */

export interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  dangerous?: boolean
}

interface ConfirmRequest extends ConfirmOptions {
  id: number
  resolve: (ok: boolean) => void
}

let nextId = 0

export function useConfirmState() {
  return useState<ConfirmRequest | null>('confirmDialog', () => null)
}

export function useConfirm() {
  const state = useConfirmState()
  return (options: ConfirmOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      const opts: ConfirmOptions = typeof options === 'string' ? { message: options } : options
      state.value = {
        id: ++nextId,
        title: opts.title,
        message: opts.message,
        confirmLabel: opts.confirmLabel || 'Bevestigen',
        cancelLabel: opts.cancelLabel || 'Annuleren',
        dangerous: !!opts.dangerous,
        resolve,
      }
    })
  }
}
