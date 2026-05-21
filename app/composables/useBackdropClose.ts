/**
 * Helper for modal backdrop click-to-close that survives text selection.
 *
 * Without this: dragging text inside the modal and releasing on the backdrop
 * fires `click.self` and unintentionally closes the modal — losing the form.
 *
 * With this: only close when mousedown AND click both originated on the backdrop
 * itself (i.e. true intent-to-dismiss).
 *
 * Usage:
 *   const { onMouseDown, onClick } = useBackdropClose(() => closeFn())
 *   <div @mousedown="onMouseDown" @click="onClick">...</div>
 */
export function useBackdropClose(close: () => void) {
  const armed = ref(false)
  return {
    onMouseDown(e: MouseEvent) {
      armed.value = e.target === e.currentTarget
    },
    onClick(e: MouseEvent) {
      if (armed.value && e.target === e.currentTarget) {
        close()
      }
      armed.value = false
    },
  }
}
